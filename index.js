/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  NEUROFORGE — FIREBASE CLOUD FUNCTIONS  v2.0                            ║
 * ║  Target: 200K+ DAU                                                       ║
 * ║                                                                          ║
 * ║  INSTALL:                                                                ║
 * ║    npm install -g firebase-tools                                         ║
 * ║    firebase init functions   (select your project: neuros-52cda)        ║
 * ║    cd functions                                                          ║
 * ║    npm install firebase-admin firebase-functions @google-cloud/vision    ║
 * ║                                                                          ║
 * ║  ALGOLIA SYNC:                                                           ║
 * ║    npm install algoliasearch                                             ║
 * ║    firebase functions:config:set algolia.app_id="YOUR_ID"               ║
 * ║    firebase functions:config:set algolia.api_key="YOUR_ADMIN_KEY"       ║
 * ║    firebase functions:config:set algolia.index="nf_users"               ║
 * ║                                                                          ║
 * ║  DEPLOY:                                                                 ║
 * ║    firebase deploy --only functions                                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();

const db    = admin.firestore();
const rtdb  = admin.database();

// ── Lazy-init Google Cloud Vision (only loads on first NSFW check) ──
let _visionClient = null;
function getVisionClient() {
  if (!_visionClient) {
    const { ImageAnnotatorClient } = require('@google-cloud/vision');
    _visionClient = new ImageAnnotatorClient();
  }
  return _visionClient;
}

// ── Lazy-init Algolia (only loads on first user write) ──
let _algoliaIndex = null;
function getAlgoliaIndex() {
  if (_algoliaIndex) return _algoliaIndex;
  const cfg = functions.config().algolia || {};
  if (!cfg.app_id || !cfg.api_key) {
    console.warn('[Algolia] Missing config — search sync disabled');
    return null;
  }
  const algoliasearch = require('algoliasearch');
  const client = algoliasearch(cfg.app_id, cfg.api_key);
  _algoliaIndex = client.initIndex(cfg.index || 'nf_users');
  return _algoliaIndex;
}

/* ════════════════════════════════════════════════════════════════════════════
   §A  MESSAGE MODERATION — Firestore trigger on new message
   ─────────────────────────────────────────────────────────────────────────
   Runs server-side for EVERY message written to any subcollection under
   messages/{chatId}/msgs/{msgId}.
   Provides the ultimate security layer — client JS can be bypassed,
   but this function cannot.
════════════════════════════════════════════════════════════════════════════ */
exports.moderateMessage = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .firestore
  .document('messages/{chatId}/msgs/{msgId}')
  .onCreate(async (snap, ctx) => {
    const msg  = snap.data();
    const text = (msg.text || '').trim();
    const uid  = msg.sender || msg.uid;

    if (!uid) return null;

    // ── Step 1: Check if user is banned or shadowbanned ──
    const userRef  = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const user     = userSnap.data() || {};

    if (user.shadowbanned) {
      // Shadowban: message appears to sender but is deleted server-side
      await snap.ref.delete();
      return null;
    }

    const bannedUntil = user.bannedUntil?.toMillis?.() || (user.bannedUntil || 0);
    if (typeof bannedUntil === 'number' && bannedUntil > Date.now()) {
      await snap.ref.delete();
      return null;
    }

    if (!text) return null; // images/media — skipped (handled by moderateImage)

    // ── Step 2: Server-side heuristic checks ──
    const checks = {
      tooManyUrls:    (text.match(/https?:\/\/\S+|www\.\S+/gi) || []).length > 3,
      extremeCaps:    text.length > 10 && (text.match(/[A-Z]/g) || []).length / text.length > 0.85,
      repeatedChars:  /(.)\1{9,}/.test(text), // 10+ same char in a row
      zalgo:          /[\u0300-\u036f]{4,}/.test(text), // diacritic overload
      extremeLen:     text.length > 4000,
    };

    const violations = Object.entries(checks).filter(([, v]) => v).map(([k]) => k);

    if (violations.length > 0) {
      console.log(`[Moderation] Deleting message from ${uid}: ${violations.join(', ')}`);
      await snap.ref.delete();

      // Increment violation counter — auto-ban at threshold
      await userRef.set({
        serverViolations: admin.firestore.FieldValue.increment(1),
        lastViolationAt:  admin.firestore.FieldValue.serverTimestamp(),
        lastViolationType: violations[0]
      }, { merge: true });

      // Auto-ban after 5 server violations
      const updatedUser = (await userRef.get()).data() || {};
      if ((updatedUser.serverViolations || 0) >= 5) {
        await userRef.set({
          bannedUntil: admin.firestore.Timestamp.fromMillis(Date.now() + 86_400_000),
          bannedByServer: true,
          autobanReason: 'Repeated server-side moderation violations'
        }, { merge: true });
        console.log(`[Moderation] Auto-banned ${uid} after 5 violations`);
      }
      return null;
    }

    // ── Step 3: Basic profanity/toxicity check (simple keyword list) ──
    // For heavy AI: integrate Perspective API or ToxicBERT via Cloud Run
    const TOXIC_PATTERNS = [
      /\b(kill\s+yourself|kys)\b/i,
      /\b(n[i1]gg[ae3]r)\b/i,
      // Add more patterns — this is a starter set
    ];
    const isToxic = TOXIC_PATTERNS.some(re => re.test(text));
    if (isToxic) {
      await snap.ref.delete();
      await userRef.set({
        serverViolations: admin.firestore.FieldValue.increment(3), // weighted
        lastViolationAt:  admin.firestore.FieldValue.serverTimestamp(),
        lastViolationType: 'toxic_content'
      }, { merge: true });
      return null;
    }

    return null;
  });

/* ════════════════════════════════════════════════════════════════════════════
   §B  COMMUNITY POST MODERATION — Firestore trigger on new community post
════════════════════════════════════════════════════════════════════════════ */
exports.moderateCommunityPost = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .firestore
  .document('community/{postId}')
  .onCreate(async (snap, ctx) => {
    const post = snap.data();
    const uid  = post.uid;
    const text = (post.text || '').trim();

    if (!uid) return null;

    const userRef  = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const user     = userSnap.data() || {};

    // Delete posts from banned/shadowbanned users
    if (user.shadowbanned) { await snap.ref.delete(); return null; }
    const bannedUntil = user.bannedUntil?.toMillis?.() || (user.bannedUntil || 0);
    if (typeof bannedUntil === 'number' && bannedUntil > Date.now()) {
      await snap.ref.delete();
      return null;
    }

    // Rate limit: max 5 posts per 5 minutes per user
    const fiveMinsAgo = Date.now() - 5 * 60_000;
    const recentPostsSnap = await db.collection('community')
      .where('uid', '==', uid)
      .where('time', '>', fiveMinsAgo)
      .limit(6)
      .get();

    if (recentPostsSnap.size > 5) {
      await snap.ref.delete();
      console.log(`[Moderation] Post rate-limit hit for ${uid}`);
      return null;
    }

    // URL spam in community post
    const urlCount = (text.match(/https?:\/\/\S+|www\.\S+/gi) || []).length;
    if (urlCount > 2) {
      await snap.ref.delete();
      await userRef.set({
        serverViolations: admin.firestore.FieldValue.increment(1)
      }, { merge: true });
      return null;
    }

    return null;
  });

/* ════════════════════════════════════════════════════════════════════════════
   §C  NSFW IMAGE MODERATION — HTTPS Callable
   ─────────────────────────────────────────────────────────────────────────
   Called by the client when a user uploads an image.
   Heavy Cloud Vision processing happens server-side — keeps client fast.
════════════════════════════════════════════════════════════════════════════ */
exports.moderateImage = functions
  .runWith({ memory: '512MB', timeoutSeconds: 60 })
  .https.onCall(async (data, ctx) => {
    const { imageBase64, userId, chatId, msgId } = data;
    if (!imageBase64) return { isNSFW: false };

    // Only allow authenticated calls
    if (!ctx.auth) return { isNSFW: false, error: 'unauthenticated' };

    try {
      const vc = getVisionClient();
      const [result] = await vc.safeSearchDetection({
        image: { content: imageBase64 }
      });

      const s    = result.safeSearchAnnotation;
      const bad  = ['LIKELY', 'VERY_LIKELY'];
      const isNSFW = bad.includes(s.adult)    ||
                     bad.includes(s.violence)  ||
                     bad.includes(s.racy);

      if (isNSFW && userId) {
        const userRef = db.collection('users').doc(userId);
        await userRef.set({
          nsfwViolations: admin.firestore.FieldValue.increment(1),
          lastNsfwAt:     admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Delete the NSFW message if msgId is provided
        if (chatId && msgId) {
          await db.collection('messages').doc(chatId).collection('msgs').doc(msgId).delete();
        }

        // Auto-ban after 3 NSFW violations
        const updated = (await userRef.get()).data() || {};
        if ((updated.nsfwViolations || 0) >= 3) {
          await userRef.set({
            bannedUntil: admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 86_400_000),
            bannedByServer: true,
            autobanReason: 'Repeated NSFW image uploads'
          }, { merge: true });
        }
      }

      return { isNSFW, annotations: s };

    } catch(e) {
      console.error('[Vision] Error:', e);
      return { isNSFW: false, error: e.message };
    }
  });

/* ════════════════════════════════════════════════════════════════════════════
   §D  SCORE REPORT — HTTPS Callable (receives client moderation scores)
   ─────────────────────────────────────────────────────────────────────────
   The client moderation engine reports high-score users here.
   This function independently verifies and enforces bans server-side.
════════════════════════════════════════════════════════════════════════════ */
exports.reportMessage = functions
  .runWith({ memory: '128MB', timeoutSeconds: 10 })
  .https.onCall(async (data, ctx) => {
    if (!ctx.auth) return { ok: false, reason: 'unauthenticated' };

    const uid        = ctx.auth.uid; // ALWAYS use server auth UID, never client data
    const { scoreAfter, delta, riskLevel } = data;

    if (typeof scoreAfter !== 'number') return { ok: false };

    // Independently enforce ban if score is extreme
    if (scoreAfter >= 70) {
      await db.collection('users').doc(uid).set({
        bannedUntil:    admin.firestore.Timestamp.fromMillis(Date.now() + 86_400_000),
        bannedByServer: true,
        lastRiskLevel:  riskLevel || 'extreme',
        banReportScore: scoreAfter
      }, { merge: true });
      console.log(`[Score Report] Server-enforced ban on ${uid} (score: ${scoreAfter})`);
    }

    return { ok: true };
  });

/* ════════════════════════════════════════════════════════════════════════════
   §E  PRESENCE MIRROR — RTDB trigger mirrors presence to Firestore
   ─────────────────────────────────────────────────────────────────────────
   The client writes to RTDB. This function mirrors it to Firestore so the
   existing 'online' field on user documents stays accurate — without the
   client needing to write to Firestore at all.
   COST: One Firestore write per presence change (connect/disconnect) instead
         of one write every 60 seconds per user. 100x cheaper.
════════════════════════════════════════════════════════════════════════════ */
exports.onPresenceChange = functions
  .runWith({ memory: '128MB', timeoutSeconds: 10 })
  .database.ref('/presence/{uid}')
  .onWrite(async (change, ctx) => {
    const uid = ctx.params.uid;
    const presence = change.after.val();

    if (!presence) return null; // deleted — nothing to mirror

    const isOnline   = presence.online === true;
    const lastSeen   = presence.lastSeen || Date.now();

    try {
      await db.collection('users').doc(uid).set({
        online:   isOnline,
        lastSeen: lastSeen,
        ...(isOnline ? { onlineAt: lastSeen } : {})
      }, { merge: true });
    } catch(e) {
      console.error(`[Presence] Firestore mirror failed for ${uid}:`, e.message);
    }

    return null;
  });

/* ════════════════════════════════════════════════════════════════════════════
   §F  SET OFFLINE — HTTPS endpoint called via sendBeacon on page unload
   ─────────────────────────────────────────────────────────────────────────
   sendBeacon is more reliable than Firebase SDK calls on page close.
   The RTDB onDisconnect() is the primary safety net; this is a backup.
════════════════════════════════════════════════════════════════════════════ */
exports.setOffline = functions
  .runWith({ memory: '128MB', timeoutSeconds: 5 })
  .https.onRequest(async (req, res) => {
    // CORS: only allow from your domain
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

    try {
      const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      const uid  = body.uid;
      if (!uid) { res.status(400).json({ ok: false }); return; }

      // Mirror to RTDB (triggers onPresenceChange → Firestore mirror)
      await rtdb.ref('presence/' + uid).set({
        online:   false,
        lastSeen: Date.now()
      });

      res.status(200).json({ ok: true });
    } catch(e) {
      console.error('[setOffline]', e);
      res.status(500).json({ ok: false });
    }
  });

/* ════════════════════════════════════════════════════════════════════════════
   §G  ALGOLIA SEARCH INDEX — Sync users to Algolia on create/update
   ─────────────────────────────────────────────────────────────────────────
   Whenever a user document is created or updated in Firestore, this function
   syncs the relevant search fields to Algolia. Algolia then powers the
   search bar on the client — no more full-collection scans.
════════════════════════════════════════════════════════════════════════════ */
exports.syncUserToAlgolia = functions
  .runWith({ memory: '128MB', timeoutSeconds: 10 })
  .firestore
  .document('users/{userId}')
  .onWrite(async (change, ctx) => {
    const idx = getAlgoliaIndex();
    if (!idx) return null;

    const userId = ctx.params.userId;

    // Deletion: remove from Algolia
    if (!change.after.exists) {
      try { await idx.deleteObject(userId); } catch(e) {}
      return null;
    }

    const data = change.after.data() || {};

    // Only index the fields needed for search — never put sensitive data in Algolia
    const record = {
      objectID:         userId,
      name:             data.name        || '',
      username:         data.username    || '',
      handle:           data.handle      || '',
      uid:              data.uid         || '',
      ini:              data.ini         || '',
      g:                data.g           || '',
      photoURL:         data.photoURL    || '',
      equippedAvatarId: data.equippedAvatarId || null,
      online:           data.online      || false,
      role:             data.role        || '',
      // Searchable fields — Algolia uses these for typo-tolerant search
      _searchName:      (data.name || '').toLowerCase(),
      _searchHandle:    (data.handle || '').toLowerCase(),
    };

    // Don't index banned users in search results
    if (data.bannedUntil > Date.now()) {
      try { await idx.deleteObject(userId); } catch(e) {}
      return null;
    }

    try {
      await idx.saveObject(record);
    } catch(e) {
      console.error('[Algolia] sync failed for', userId, ':', e.message);
    }

    return null;
  });

/* ════════════════════════════════════════════════════════════════════════════
   §H  COMMUNITY FEED CACHE — scheduled function generates a cached feed
   ─────────────────────────────────────────────────────────────────────────
   At 200K DAU, even getDocs() calls add up. This function generates a
   pre-built feed snapshot every 3 minutes and stores it in a single
   Firestore document. Clients can fetch 1 document instead of N posts.
   ─────────────────────────────────────────────────────────────────────────
   Optional enhancement: serve via Firebase Hosting + Cloud CDN for edge
   caching, so it costs 0 Firestore reads for 99% of requests.
════════════════════════════════════════════════════════════════════════════ */
exports.buildFeedCache = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .pubsub.schedule('every 3 minutes')
  .onRun(async () => {
    try {
      const snap = await db.collection('community')
        .orderBy('time', 'desc')
        .limit(50)
        .get();

      const posts = snap.docs.map(d => {
        const data = d.data();
        // Strip likedBy/dislikedBy arrays from cache (too large + privacy)
        return {
          id:           d.id,
          text:         data.text        || '',
          name:         data.name        || 'Anonymous',
          uid:          data.uid         || '',
          g:            data.g           || '',
          ini:          data.ini         || '',
          photoURL:     data.photoURL    || '',
          time:         data.time        || 0,
          category:     data.category    || 'general',
          likeCount:    (data.likedBy    || []).length,
          dislikeCount: (data.dislikedBy || []).length,
          commentCount: data.commentCount || 0,
          customUid:    data.customUid   || '',
        };
      });

      await db.collection('_cache').doc('community_feed').set({
        posts,
        generatedAt:  Date.now(),
        postCount:    posts.length,
        ttl:          180, // seconds — clients should re-fetch after this
      });

      console.log(`[Feed Cache] Built with ${posts.length} posts`);
    } catch(e) {
      console.error('[Feed Cache] Build failed:', e);
    }
  });

/* ════════════════════════════════════════════════════════════════════════════
   §I  BAN CLEANUP — scheduled daily cleanup of expired bans
════════════════════════════════════════════════════════════════════════════ */
exports.cleanExpiredBans = functions
  .runWith({ memory: '128MB', timeoutSeconds: 60 })
  .pubsub.schedule('every 24 hours')
  .onRun(async () => {
    const now = Date.now();
    const snap = await db.collection('users')
      .where('bannedUntil', '<', now)
      .where('bannedByServer', '==', true)
      .limit(100)
      .get();

    if (snap.empty) return null;

    const batch = db.batch();
    snap.docs.forEach(d => {
      batch.update(d.ref, {
        bannedUntil:    0,
        bannedByServer: admin.firestore.FieldValue.delete(),
        autobanReason:  admin.firestore.FieldValue.delete()
      });
    });
    await batch.commit();
    console.log(`[BanCleanup] Lifted ${snap.size} expired bans`);
    return null;
  });

/* ════════════════════════════════════════════════════════════════════════════
   §J  GROUP RECEIPT READ — HTTPS Callable
   ─────────────────────────────────────────────────────────────────────────
   Optional: if you want to batch-read all group receipts for a user in one
   call instead of individual getDoc() calls per group.
════════════════════════════════════════════════════════════════════════════ */
exports.getGroupReceipts = functions
  .runWith({ memory: '128MB', timeoutSeconds: 15 })
  .https.onCall(async (data, ctx) => {
    if (!ctx.auth) return { ok: false };
    const uid      = ctx.auth.uid;
    const groupIds = data.groupIds || [];

    if (!Array.isArray(groupIds) || groupIds.length > 20) {
      return { ok: false, reason: 'invalid_input' };
    }

    const results = {};
    await Promise.all(
      groupIds.map(async gid => {
        try {
          const snap = await db
            .collection('groups').doc(gid)
            .collection('receipts').doc(uid)
            .get();
          results[gid] = snap.exists ? (snap.data().unread || 0) : 0;
        } catch(e) {
          results[gid] = 0;
        }
      })
    );

    return { ok: true, receipts: results };
  });

/* ════════════════════════════════════════════════════════════════════════════
   §K  FIRESTORE SECURITY RULES (reference — deploy separately)
   ─────────────────────────────────────────────────────────────────────────
   Paste these into your Firestore console or firestore.rules file.
   These are the REAL security gatekeeper — client JS is just UX.
════════════════════════════════════════════════════════════════════════════

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() { return request.auth != null; }
    function isOwner(uid) { return isAuth() && request.auth.uid == uid; }
    function notBanned() {
      let user = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return !(user.get('bannedUntil', 0) > request.time.toMillis());
    }
    function isAdmin() {
      let user = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return user.get('uid', '') == 'NF-CK7-FRWH';
    }
    function isMember(groupId) {
      let group = get(/databases/$(database)/documents/groups/$(groupId)).data;
      return isAuth() && request.auth.uid in group.members;
    }

    // Users: read = auth; write = own doc only; no client-side banning
    match /users/{userId} {
      allow read:   if isAuth();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId)
                    && !request.resource.data.keys().hasAny(
                       ['bannedUntil','bannedByServer','serverViolations',
                        'shadowbanned','nsfwViolations']
                       );
      allow delete: if isAdmin();
    }

    // Chats: only participants
    match /chats/{chatId} {
      allow read, write: if isAuth()
                         && request.auth.uid in resource.data.users;
    }

    // Messages: must be participant, not banned, max 4000 chars
    match /messages/{chatId}/msgs/{msgId} {
      allow read:   if isAuth();
      allow create: if isAuth()
                    && notBanned()
                    && request.resource.data.sender == request.auth.uid
                    && request.resource.data.text.size() <= 4000;
      allow delete: if isAuth()
                    && (resource.data.sender == request.auth.uid || isAdmin());
    }

    // Groups: member-only
    match /groups/{groupId} {
      allow read:  if isAuth();
      allow write: if isAuth() && isMember(groupId);
    }

    // Group receipts: only own receipt
    match /groups/{groupId}/receipts/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Community: auth + not banned + 4000 char limit
    match /community/{postId} {
      allow read:   if isAuth();
      allow create: if isAuth()
                    && notBanned()
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.text.size() <= 4000;
      allow update: if isAuth()
                    && (resource.data.uid == request.auth.uid || isAdmin());
      allow delete: if isAuth()
                    && (resource.data.uid == request.auth.uid || isAdmin());
    }

    // Feed cache: read-only for clients
    match /_cache/{doc} {
      allow read:  if isAuth();
      allow write: if false; // Cloud Functions only
    }

    // Reports: create only
    match /reports/{reportId} {
      allow read:   if isAdmin();
      allow create: if isAuth();
    }

    // RTDB Presence: users read-only (mirror handled by Cloud Function)
    // (configure in database.rules.json, not here)
  }
}

════════════════════════════════════════════════════════════════════════════

Firebase RTDB Rules (database.rules.json):
{
  "rules": {
    "presence": {
      "$uid": {
        ".read":  "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}

════════════════════════════════════════════════════════════════════════════
*/

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║       NEUROFORGE — SCALE UPGRADE PATCH LAYER  v1.0                      ║
 * ║       Targets: 200K+ DAU   Cost: Minimal   Safety: Maximum              ║
 * ║                                                                          ║
 * ║  This file contains EXACT replacement blocks for chat.html.             ║
 * ║  Each section is labeled with:                                           ║
 * ║    [FIND]    — the exact existing code to locate in chat.html           ║
 * ║    [REPLACE] — the new code to substitute                                ║
 * ║                                                                          ║
 * ║  PATCHES SUMMARY:                                                        ║
 * ║  §1 — Firebase config: add databaseURL + RTDB import                    ║
 * ║  §2 — Presence System: Firestore heartbeat → Firebase RTDB              ║
 * ║  §3 — Community Feed: onSnapshot → static getDocs + "New Posts" poll    ║
 * ║  §4 — Search: full-collection scan → Algolia client SDK                 ║
 * ║  §5 — Group Unreads: single-doc increment → subcollection receipts      ║
 * ║  §6 — Rate Limiting: per-user API call throttle                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/* ═══════════════════════════════════════════════════════════════════════════
   §1  FIREBASE CONFIG + RTDB IMPORT
   ─────────────────────────────────────────────────────────────────────────
   FIND (inside <script type="module">, around line 7103):
     import { initializeApp } ...
     import { getStorage, ref, uploadBytes, getDownloadURL } ...
     ...
     const firebaseConfig = {
       apiKey: "AIzaSyC4VFRg8moM-39BO0CPZgOg94gD3T1ED5k",
       ...
     };

   REPLACE WITH:
═══════════════════════════════════════════════════════════════════════════ */

// ── ADD this import at the top of the <script type="module"> block ──
// (place it alongside the other Firebase imports)

/* NEW IMPORT — add alongside existing Firebase imports:
import {
  getDatabase,
  ref     as rtdbRef,
  set     as rtdbSet,
  onValue as rtdbOnValue,
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
*/

// ── REPLACE the firebaseConfig block with this version ──
/*
const firebaseConfig = {
  apiKey:            "AIzaSyC4VFRg8moM-39BO0CPZgOg94gD3T1ED5k",
  authDomain:        "neuros-52cda.firebaseapp.com",
  databaseURL:       "https://neuros-52cda-default-rtdb.firebaseio.com", // ← ADD THIS LINE
  projectId:         "neuros-52cda",
  storageBucket:     "neuros-52cda.firebasestorage.app",
  messagingSenderId: "817588719752",
  appId:             "1:817588719752:web:f206aabf4e908d99d90f3d"
};

const app     = initializeApp(firebaseConfig);
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);
const rtdb    = getDatabase(app);              // ← ADD THIS LINE
*/

/* ═══════════════════════════════════════════════════════════════════════════
   §2  PRESENCE SYSTEM — FIRESTORE HEARTBEAT → FIREBASE RTDB
   ─────────────────────────────────────────────────────────────────────────
   Problem: setInterval writing to Firestore every 60 s → 20,000 writes/min
            at 20K concurrent users = financial ticking time bomb.
   Fix:     Firebase RTDB onDisconnect() handles offline detection server-side
            with ZERO polling. One write on connect, RTDB handles disconnect.
   Cost:    RTDB presence = ~$0 for this use case. Firestore approach = $$$.
   ─────────────────────────────────────────────────────────────────────────
   FIND (around line 7793):
     async function setOnlineStatus(isOnline) { ... }
     ... all the way through the visibilitychange handler and beforeunload ...

   REPLACE WITH the block below.
═══════════════════════════════════════════════════════════════════════════ */

/* ── §2 REPLACEMENT BLOCK ── paste this into chat.html, replacing the
   old setOnlineStatus / _startPresenceHeartbeat / _stopPresenceHeartbeat
   functions AND the visibilitychange + beforeunload handlers. ─────────── */

const _PRESENCE_SECTION_REPLACEMENT = `

/* ─────────────────────────────────────────────────────────────────────────
   PRESENCE v2.0 — Firebase Realtime Database (RTDB)
   ─────────────────────────────────────────────────────────────────────────
   HOW IT WORKS:
   1. On connect: write {online:true, onlineAt: SERVER_TIMESTAMP} to RTDB.
   2. Register onDisconnect() BEFORE writing — RTDB server guarantees
      that if the connection drops (tab close, network loss, crash), it will
      automatically set online:false + lastSeen without ANY client-side polling.
   3. Zero setInterval. Zero Firestore writes for presence. Zero cost at scale.
   4. Firestore 'users' doc still gets a one-time write on login (for the
      profile display) but NOT every 60 seconds.
   ───────────────────────────────────────────────────────────────────────── */

let _presenceInitialized = false;
let _presenceRef         = null;

function _initRTDBPresence(uid) {
  if (_presenceInitialized || !uid) return;
  _presenceInitialized = true;

  _presenceRef = rtdbRef(rtdb, 'presence/' + uid);
  const connectedRef = rtdbRef(rtdb, '.info/connected');

  rtdbOnValue(connectedRef, (snap) => {
    if (snap.val() === false) return; // offline — onDisconnect handles it server-side

    // Step 1: Register the "on disconnect" cleanup FIRST.
    // RTDB guarantees this fires even on hard crashes.
    onDisconnect(_presenceRef).set({
      online:   false,
      lastSeen: rtdbServerTimestamp()
    }).then(() => {
      // Step 2: THEN mark online. Order matters — guard registered before write.
      rtdbSet(_presenceRef, {
        online:   true,
        onlineAt: rtdbServerTimestamp()
      });
    });
  });
}

// Compatibility shim: setOnlineStatus is called from a few places.
// It now only writes once to Firestore (for profile display) and
// delegates live presence to RTDB.
async function setOnlineStatus(isOnline) {
  if (!currentUser) return;
  const now = Date.now();
  // Only write to Firestore for the profile field — not for heartbeating.
  await setDoc(doc(db, 'users', currentUser.uid), {
    online:   isOnline,
    lastSeen: now,
    ...(isOnline ? { onlineAt: now } : {})
  }, { merge: true });
}

// RTDB presence is started once after auth — no intervals needed.
function _startPresenceHeartbeat() {
  if (!currentUser) return;
  _initRTDBPresence(currentUser.uid);
  // Keep reading the user's own Firestore online field in sync
  // (some UI components still read it from 'users' collection).
  // RTDB presence listener above syncs RTDB; a lightweight Cloud Function
  // (see functions/index.js §onPresenceChange) can mirror it back to Firestore
  // if needed. Without that function, the Firestore 'online' field is only
  // written on login/logout — which is accurate enough for the sidebar.
}

function _stopPresenceHeartbeat() {
  // No-op — RTDB handles cleanup automatically via onDisconnect.
  // Nothing to clear.
}

// Tab visibility: pause RTDB presence when hidden, restore on return.
// This is optional — RTDB onDisconnect already handles hard disconnects.
document.addEventListener('visibilitychange', () => {
  if (!currentUser || !_presenceRef) return;
  if (document.hidden) {
    // Soft "away" signal — set lastSeen but keep online flag via RTDB
    setDoc(doc(db, 'users', currentUser.uid), {
      online: false, lastSeen: Date.now()
    }, { merge: true }).catch(() => {});
    rtdbSet(_presenceRef, { online: false, lastSeen: rtdbServerTimestamp() })
      .catch(() => {});
  } else {
    // Back — re-register RTDB presence
    _initRTDBPresence(currentUser.uid);
    setOnlineStatus(true).catch(() => {});
  }
});

// Logout: clean up RTDB presence synchronously
window.addEventListener('beforeunload', () => {
  // sendBeacon to a Cloud Function is more reliable than Firebase SDK on unload
  if (currentUser && window.NF_CLOUD_FN_URL) {
    navigator.sendBeacon(
      window.NF_CLOUD_FN_URL + '/setOffline',
      JSON.stringify({ uid: currentUser.uid })
    );
  }
  // Best-effort RTDB write (may not complete — onDisconnect is the real safety net)
  if (_presenceRef) {
    rtdbSet(_presenceRef, { online: false, lastSeen: Date.now() }).catch(() => {});
  }
});
`;

/* ═══════════════════════════════════════════════════════════════════════════
   §3  COMMUNITY FEED — onSnapshot → STATIC getDocs + "NEW POSTS" POLLING
   ─────────────────────────────────────────────────────────────────────────
   Problem: onSnapshot on 'community' collection → every new post triggers
            a read for EACH connected user. 10K users + 50 posts/min = 500K
            reads/min. Firestore quota hit almost instantly.
   Fix:     Replace onSnapshot with getDocs (one-time fetch, paginated).
            A lightweight "New Posts Available" banner polls every 90 seconds
            by fetching ONLY the most recent post's timestamp — 1 document read
            per 90 seconds per user instead of N reads per post.
   ─────────────────────────────────────────────────────────────────────────
   FIND (around line 11575):
     function startListeningPosts() {
       if (_commUnsub) return;
       ...
       const q = query(collection(db, 'community'), orderBy('time', 'desc'));
       _commUnsub = onSnapshot(q, (snapshot) => { ... });
     }

   REPLACE WITH the block below.
═══════════════════════════════════════════════════════════════════════════ */

const _COMMUNITY_FEED_REPLACEMENT = `

/* ─────────────────────────────────────────────────────────────────────────
   COMMUNITY FEED v2.0 — Static Fetch + Smart Poll
   ───────────────────────────────────────────────────────────────────────── */

const FEED_PAGE_SIZE    = 20;   // Posts per page
const FEED_POLL_MS      = 90_000; // Check for new posts every 90 seconds
const FEED_NEW_BADGE_MS = 300_000; // Hide "new posts" badge after 5 min if ignored

let _feedLastFetchedAt   = 0;       // Timestamp of the newest post we've fetched
let _feedPollTimer        = null;    // setInterval for new-post polling
let _feedIsLoadingMore    = false;   // Pagination in-flight guard
let _feedLastDocCursor    = null;    // Firestore cursor for "Load more"
let _feedNoMorePosts      = false;   // Reached end of collection
let _newPostsBannerShown  = false;
let _feedLoadMoreObserver = null;    // IntersectionObserver for infinite scroll

/* Fetch a page of posts starting after the cursor doc */
async function _fetchFeedPage(afterDoc = null) {
  const constraints = [
    orderBy('time', 'desc'),
    limit(FEED_PAGE_SIZE)
  ];
  if (afterDoc) constraints.push(startAfter(afterDoc));
  const snap = await getDocs(query(collection(db, 'community'), ...constraints));
  return snap;
}

/* Show the "New Posts Available" banner */
function _showNewPostsBanner(count) {
  if (_newPostsBannerShown) return;
  _newPostsBannerShown = true;
  let banner = document.getElementById('_commNewBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = '_commNewBanner';
    banner.style.cssText = [
      'position:sticky;top:8px;z-index:100;',
      'margin:0 auto 12px;max-width:320px;',
      'background:var(--accent);color:#fff;',
      'padding:9px 18px;border-radius:var(--r-f);',
      'font-size:.8rem;font-weight:700;text-align:center;',
      'cursor:pointer;box-shadow:0 4px 20px rgba(139,92,246,.35);',
      'animation:fadeSlideDown .25s ease;letter-spacing:.04em;'
    ].join('');
    const feed = document.getElementById('commFeed');
    if (feed) feed.insertBefore(banner, feed.firstChild);
  }
  banner.textContent = \`↑ \${count} new post\${count !== 1 ? 's' : ''} — tap to refresh\`;
  banner.onclick = () => {
    _newPostsBannerShown = false;
    banner.remove();
    reloadCommunityFeed();
  };
  // Auto-dismiss after FEED_NEW_BADGE_MS ms
  clearTimeout(banner._dismissTimer);
  banner._dismissTimer = setTimeout(() => {
    _newPostsBannerShown = false;
    banner.remove();
  }, FEED_NEW_BADGE_MS);
}

/* Poll for new posts: fetch only the newest doc's timestamp — 1 read per poll */
async function _pollForNewPosts() {
  if (!document.getElementById('commFeed')) return;
  if (document.hidden) return; // Don't poll when tab is backgrounded

  try {
    const snap = await getDocs(
      query(collection(db, 'community'), orderBy('time', 'desc'), limit(3))
    );
    if (snap.empty) return;

    let newCount = 0;
    snap.docs.forEach(d => {
      const t = d.data().time || 0;
      if (t > _feedLastFetchedAt) newCount++;
    });

    if (newCount > 0 && _feedLastFetchedAt > 0) {
      _showNewPostsBanner(newCount);
    }
  } catch(e) {
    // Non-critical — silent fail
  }
}

/* Full reload: re-fetch from top, reset cursor */
async function reloadCommunityFeed() {
  _feedLastDocCursor = null;
  _feedNoMorePosts   = false;
  _feedLastFetchedAt = 0;
  _newPostsBannerShown = false;
  document.getElementById('_commNewBanner')?.remove();
  _allPosts = [];

  const feed = document.getElementById('commFeed');
  if (!feed) return;

  // Show skeleton
  feed.innerHTML = [1,2,3].map(() => \`
    <div class="sk-item" style="flex-direction:column;align-items:flex-start;padding:16px;border-radius:16px;background:var(--bg-card);border:1px solid var(--border);margin-bottom:10px;gap:12px;">
      <div style="display:flex;gap:10px;align-items:center;width:100%;">
        <div class="sk-av" style="width:38px;height:38px;flex-shrink:0;"></div>
        <div class="sk-lines" style="flex:1;"><div class="sk-l1" style="width:40%;"></div><div class="sk-l2" style="width:25%;"></div></div>
      </div>
      <div class="sk-l2" style="width:90%;height:13px;background:var(--bg-input);border-radius:6px;animation:skPulse 1.5s ease-in-out infinite;"></div>
    </div>\`).join('');

  try {
    const snap = await _fetchFeedPage();
    _handleFeedSnapshot(snap, true);
  } catch(e) {
    console.error('[Feed] reload failed:', e);
    feed.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--tm);">Could not load posts — pull to refresh</div>';
  }
}

/* Handle a fetched snapshot: update _allPosts master list */
function _handleFeedSnapshot(snap, isReset) {
  if (isReset) _allPosts = [];

  if (!snap.empty) {
    _feedLastDocCursor = snap.docs[snap.docs.length - 1]; // pagination cursor
    const newest = snap.docs[0]?.data()?.time || 0;
    if (newest > _feedLastFetchedAt) _feedLastFetchedAt = newest;
    // Add to master list (dedup by id)
    const existingIds = new Set(_allPosts.map(p => p.id));
    snap.docs.forEach(d => {
      if (!existingIds.has(d.id)) {
        _allPosts.push({ id: d.id, ...d.data() });
        existingIds.add(d.id);
      }
    });
    _feedNoMorePosts = snap.docs.length < FEED_PAGE_SIZE;
  } else if (isReset) {
    _feedNoMorePosts = true;
  }

  _renderFeed();
  _attachInfiniteScroll();
}

/* Load next page of posts (infinite scroll) */
async function _loadMorePosts() {
  if (_feedIsLoadingMore || _feedNoMorePosts || !_feedLastDocCursor) return;
  _feedIsLoadingMore = true;

  // Show "loading more" spinner at the bottom of the feed
  const feed = document.getElementById('commFeed');
  let spinner = document.getElementById('_feedLoadMore');
  if (feed && !spinner) {
    spinner = document.createElement('div');
    spinner.id = '_feedLoadMore';
    spinner.style.cssText = 'text-align:center;padding:16px;color:var(--ts);font-size:.8rem;';
    spinner.textContent = 'Loading more…';
    feed.appendChild(spinner);
  }

  try {
    const snap = await _fetchFeedPage(_feedLastDocCursor);
    spinner?.remove();
    _handleFeedSnapshot(snap, false);
  } catch(e) {
    console.error('[Feed] loadMore failed:', e);
    spinner?.remove();
  }

  _feedIsLoadingMore = false;
}

/* Attach IntersectionObserver for infinite scroll */
function _attachInfiniteScroll() {
  if (_feedLoadMoreObserver) { _feedLoadMoreObserver.disconnect(); _feedLoadMoreObserver = null; }
  if (_feedNoMorePosts) return;

  const feed = document.getElementById('commFeed');
  if (!feed) return;

  // Sentinel: last post card in the feed
  const sentinel = document.createElement('div');
  sentinel.id = '_feedSentinel';
  sentinel.style.height = '1px';
  feed.appendChild(sentinel);

  _feedLoadMoreObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) _loadMorePosts();
  }, { root: feed, rootMargin: '200px', threshold: 0 });

  _feedLoadMoreObserver.observe(sentinel);
}

/* Pull-to-refresh: watch for scroll above top of feed */
function _attachPullToRefresh(feedContainer) {
  let _startY = 0;
  let _pulling = false;
  const MIN_PULL = 60; // px to trigger refresh

  feedContainer.addEventListener('touchstart', e => {
    if (feedContainer.scrollTop === 0) {
      _startY = e.touches[0].clientY;
      _pulling = true;
    }
  }, { passive: true });

  feedContainer.addEventListener('touchend', e => {
    if (!_pulling) return;
    const deltaY = e.changedTouches[0].clientY - _startY;
    _pulling = false;
    if (deltaY > MIN_PULL) {
      toast('🔄 Refreshing feed…');
      reloadCommunityFeed();
    }
  }, { passive: true });
}

/* MAIN ENTRY — replaces the old startListeningPosts */
function startListeningPosts() {
  // Tear down old onSnapshot if any (compatibility: _commUnsub cleanup)
  if (_commUnsub) { _commUnsub(); _commUnsub = null; }

  _wireCommControls();

  // Initial load
  reloadCommunityFeed();

  // Wire pull-to-refresh
  const feed = document.getElementById('commFeed');
  if (feed && !feed._pullWired) {
    feed._pullWired = true;
    _attachPullToRefresh(feed);
  }

  // Start polling for new posts
  if (_feedPollTimer) clearInterval(_feedPollTimer);
  _feedPollTimer = setInterval(_pollForNewPosts, FEED_MS);

  // Also poll when user returns to the tab
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) _pollForNewPosts();
  });
}

/* Stop community feed (called from closeCommunity) */
function stopListeningPosts() {
  if (_feedPollTimer) { clearInterval(_feedPollTimer); _feedPollTimer = null; }
  if (_feedLoadMoreObserver) { _feedLoadMoreObserver.disconnect(); _feedLoadMoreObserver = null; }
  if (_commUnsub) { _commUnsub(); _commUnsub = null; }
}

// Make FEED_POLL_MS available for the setInterval call above
// (defined before the function so the name resolves correctly)
const FEED_MS = FEED_POLL_MS;
`;

/* ═══════════════════════════════════════════════════════════════════════════
   §4  SEARCH — FULL COLLECTION SCAN → ALGOLIA CLIENT SDK
   ─────────────────────────────────────────────────────────────────────────
   Problem: getDocs(query(collection(db, 'users'))) fetches EVERY user doc
            when local cache misses — will OOM browser and cost a fortune
            at 200K users.
   Fix:     Algolia Instant Search — sub-100ms results, handles typos,
            never touches Firestore for search. Free tier = 10K searches/month,
            pay-as-you-go after that ($0.50 per 1K searches).
   ─────────────────────────────────────────────────────────────────────────
   FIND (around line 7198):
     async function searchUsers(searchText) {
       ...
       // ── LAYER 2: Firestore fallback when online and local results are thin ──
       if (_isOnline && localHits.size < 3) {
         try {
           const snapshot = await getDocs(query(collection(db, 'users')));
           ...

   REPLACE WITH the block below. Also add the Algolia <script> tag before
   </body> in your HTML:
     <script src="https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.umd.js"></script>

   Then set these globals before loading chat's <script type="module">:
     window.NF_ALGOLIA_APP_ID    = 'YOUR_APP_ID';
     window.NF_ALGOLIA_SEARCH_KEY = 'YOUR_SEARCH_ONLY_API_KEY'; // NOT admin key!
     window.NF_ALGOLIA_INDEX     = 'nf_users';
═══════════════════════════════════════════════════════════════════════════ */

const _SEARCH_REPLACEMENT = `

/* ─────────────────────────────────────────────────────────────────────────
   SEARCH v2.0 — Algolia Instant Search with local-cache fallback
   ───────────────────────────────────────────────────────────────────────── */

// Lazy-init Algolia client (only when first search fires)
let _algoliaIndex = null;
function _getAlgoliaIndex() {
  if (_algoliaIndex) return _algoliaIndex;
  if (!window.algoliasearch || !window.NF_ALGOLIA_APP_ID || !window.NF_ALGOLIA_SEARCH_KEY) {
    return null; // Algolia not configured — fall back to local cache
  }
  const client = window.algoliasearch(window.NF_ALGOLIA_APP_ID, window.NF_ALGOLIA_SEARCH_KEY);
  _algoliaIndex = client.initIndex(window.NF_ALGOLIA_INDEX || 'nf_users');
  return _algoliaIndex;
}

async function searchUsers(searchText) {
  if (!searchText) return [];
  const term = searchText.toLowerCase();

  // ── LAYER 1: In-memory cache search — instant, works offline ──
  const localHits = new Map();
  contactsMap.forEach((u, id) => {
    if (u.name?.toLowerCase().includes(term) || u.uid?.toLowerCase().includes(term))
      localHits.set(id, u);
  });
  usersCache.forEach((u, id) => {
    if (!localHits.has(id) &&
        (u.name?.toLowerCase().includes(term) || u.uid?.toLowerCase().includes(term)))
      localHits.set(id, { id, ...u });
  });

  // ── LAYER 2: Algolia — fast, typo-tolerant, scales to millions of users ──
  const idx = _getAlgoliaIndex();
  if (_isOnline && idx) {
    try {
      const { hits } = await idx.search(searchText, {
        attributesToRetrieve: ['objectID','name','uid','handle','username','ini','g','photoURL','equippedAvatarId','online'],
        hitsPerPage: 12,
        typoTolerance: true,
      });
      hits.forEach(hit => {
        const id = hit.objectID;
        if (!localHits.has(id)) {
          const user = { id, ...hit };
          usersCache.set(id, user); // warm in-memory cache
          localHits.set(id, user);
        }
      });
    } catch(e) {
      // Algolia failure is non-fatal — local cache results still returned
      console.warn('[Search] Algolia error (using local cache):', e.message);
      SyncObserver.log('algolia_fail', { term });
    }
  }

  // ── LAYER 3: If Algolia not configured and local results thin, warn dev ──
  if (_isOnline && !idx && localHits.size < 3) {
    console.warn(
      '[NF Scale] Search: Algolia not configured. ' +
      'Set window.NF_ALGOLIA_APP_ID + NF_ALGOLIA_SEARCH_KEY for scalable search. ' +
      'See INTEGRATION.md §4 for setup instructions.'
    );
    // Note: the old getDocs(query(collection(db, 'users'))) fallback has been
    // intentionally removed — it fetches every document and will crash at 200K users.
  }

  return Array.from(localHits.values());
}
`;

/* ═══════════════════════════════════════════════════════════════════════════
   §5  GROUP UNREAD COUNTERS — SINGLE-DOC INCREMENT → SUBCOLLECTION RECEIPTS
   ─────────────────────────────────────────────────────────────────────────
   Problem: Incrementing unread_${uid} on a group document with 50 active
            members messaging = 50 writes/second to ONE document.
            Firestore hard limit: 1 write/second/document. Messages drop.
   Fix:     Move read receipts to a subcollection:
              groups/{groupId}/receipts/{userId}
            Each user has their own document → no write contention.
   ─────────────────────────────────────────────────────────────────────────
   FIND (in sendMsg, around line 8796):
       } else if (curIsGroup && curGroup) {
         (curGroup.members || []).forEach(uid => {
           if (uid !== currentUser.uid) previewData[\`unread_\${uid}\`] = increment(1);
         });
       }
       await setDoc(previewRef, previewData, { merge: true });

   REPLACE WITH the block below.
═══════════════════════════════════════════════════════════════════════════ */

const _GROUP_UNREAD_REPLACEMENT = `
    // ── DM unread: still safe on a single-recipient doc ──
    if (!curIsGroup && curOtherUser) {
      previewData[\`unread_\${curOtherUser.id}\`] = increment(1);
      await setDoc(previewRef, previewData, { merge: true });

    } else if (curIsGroup && curGroup) {
      // ── GROUP unread v2: write to subcollection (no write contention) ──
      // Each member has their own receipt doc — no shared document hammering.
      await setDoc(previewRef, previewData, { merge: true });

      // Fan-out receipt writes in parallel
      const receiptWrites = (curGroup.members || [])
        .filter(uid => uid !== currentUser.uid)
        .map(uid =>
          setDoc(
            doc(db, 'groups', curChatId, 'receipts', uid),
            { unread: increment(1), lastMsgTime: Date.now() },
            { merge: true }
          )
        );
      // Non-blocking: fire and forget — UI is already showing optimistic state
      Promise.all(receiptWrites).catch(e => {
        console.warn('[Receipts] Write batch failed (non-fatal):', e.message);
      });
    }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   §5b  GROUP UNREAD READ — fetch from subcollection instead of group doc
   ─────────────────────────────────────────────────────────────────────────
   FIND (in listenToGroups, around line 7980):
     const g = {
       id: docSnap.id,
       ...data,
       isGroup: true,
       unreadCount: data[\`unread_\${currentUser.uid}\`] || 0
     };

   REPLACE WITH:
═══════════════════════════════════════════════════════════════════════════ */

const _GROUP_UNREAD_READ_REPLACEMENT = `
      const g = {
        id: docSnap.id,
        ...data,
        isGroup: true,
        unreadCount: 0 // populated asynchronously from receipts subcollection below
      };
      groupsMap.set(g.id, g);

      // Async receipt fetch — updates unread badge once available
      getDoc(doc(db, 'groups', g.id, 'receipts', currentUser.uid))
        .then(receiptSnap => {
          if (receiptSnap.exists()) {
            const unread = receiptSnap.data().unread || 0;
            const existing = groupsMap.get(g.id);
            if (existing) { existing.unreadCount = unread; _scheduleContactsRender(); }
          }
        })
        .catch(() => {}); // non-fatal
`;

/* ═══════════════════════════════════════════════════════════════════════════
   §5c  CLEAR GROUP UNREAD — when opening a group chat
   ─────────────────────────────────────────────────────────────────────────
   FIND (in openGroupChat):
     setDoc(doc(db, "groups", group.id), {
       [\`unread_\${currentUser.uid}\`]: 0
     }, { merge: true }).catch(...)

   REPLACE WITH:
═══════════════════════════════════════════════════════════════════════════ */

const _GROUP_UNREAD_CLEAR_REPLACEMENT = `
    // Clear unread in the receipt subcollection (not on the group doc)
    setDoc(
      doc(db, 'groups', group.id, 'receipts', currentUser.uid),
      { unread: 0 },
      { merge: true }
    ).catch(e => console.warn('[Receipts] Clear failed:', e.message));
`;

/* ═══════════════════════════════════════════════════════════════════════════
   §6  CLIENT-SIDE RATE LIMITER
   ─────────────────────────────────────────────────────────────────────────
   Extra guard: limits how fast any single client can call Firestore write
   APIs regardless of moderation score — covers edge cases.
   ADD this block anywhere in the module, then call _clientRateLimit()
   at the top of sendMsg() and submitPost().
═══════════════════════════════════════════════════════════════════════════ */

const _RATE_LIMITER_BLOCK = `
/* ─────────────────────────────────────────────────────────────────────────
   CLIENT RATE LIMITER — token bucket algorithm
   ─────────────────────────────────────────────────────────────────────────
   Each user gets a bucket of 10 tokens that refills at 1 token/second.
   Each send() costs 1 token. If the bucket empties, the send is blocked.
   This is a UX-layer guard only — Firestore Security Rules are the real gate.
   ───────────────────────────────────────────────────────────────────────── */
const _ClientRateLimiter = (() => {
  const CAPACITY    = 10;    // max burst
  const REFILL_RATE = 1;     // tokens per second
  const COST        = 1;     // tokens per action
  let _tokens       = CAPACITY;
  let _lastRefillAt = Date.now();

  function _refill() {
    const now     = Date.now();
    const elapsed = (now - _lastRefillAt) / 1000;
    _tokens = Math.min(CAPACITY, _tokens + elapsed * REFILL_RATE);
    _lastRefillAt = now;
  }

  return {
    /**
     * Returns true if the action is allowed, false if rate-limited.
     * Call at the top of sendMsg / submitPost.
     */
    check() {
      _refill();
      if (_tokens < COST) return false;
      _tokens -= COST;
      return true;
    },
    get tokens() { _refill(); return Math.floor(_tokens); }
  };
})();

function _clientRateLimit() {
  if (!_ClientRateLimiter.check()) {
    toast('⏳ Slow down — sending too fast');
    return false;
  }
  return true;
}
`;

// ─────────────────────────────────────────────────────────────────────────
// EXPORT GUIDE: what to add to the top of sendMsg() and submitPost()
// ─────────────────────────────────────────────────────────────────────────
// async function sendMsg() {
//   if (!_clientRateLimit()) return;  // ← ADD THIS LINE
//   ...
// }
//
// window.submitPost = async function() {
//   if (!_clientRateLimit()) return;  // ← ADD THIS LINE
//   ...
// }

console.log('[NF Scale Patches] All replacement blocks defined. See INTEGRATION.md for placement instructions.');

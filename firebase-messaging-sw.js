/**
 * NeuroForge — Unified Service Worker
 * ════════════════════════════════════════════════════════════════
 *  Handles TWO jobs in one file:
 *    1. FCM push notifications  (background / killed-app)
 *    2. App Shell caching       (offline support / instant load)
 *
 *  Why merged? A browser scope can only have ONE active SW.
 *  Your existing blob SW and a separate FCM SW would fight over
 *  the same scope (/). Merging them fixes that permanently.
 *
 *  Place at: /firebase-messaging-sw.js  (web server root)
 * ════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
//  PART 1 — FIREBASE CLOUD MESSAGING
// ─────────────────────────────────────────────────────────────────
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyC4VFRg8moM-39BO0CPZgOg94gD3T1ED5k",
  authDomain:        "neuros-52cda.firebaseapp.com",
  databaseURL:       "https://neuros-52cda-default-rtdb.firebaseio.com",
  projectId:         "neuros-52cda",
  storageBucket:     "neuros-52cda.firebasestorage.app",
  messagingSenderId: "817588719752",
  appId:             "1:817588719752:web:f206aabf4e908d99d90f3d"
});

const messaging = firebase.messaging();

// ── Background / killed-app message handler ──────────────────────
// FCM calls this when a push arrives and NO app tab is in the foreground.
// onMessage() in chat.html handles the foreground case instead.
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background push received:', payload);

  // ── DUPLICATE NOTIFICATION FIX ───────────────────────────────────
  // When a campaign is sent from the Firebase Console it always includes a
  // 'notification' object. The Firebase SDK will display that notification
  // automatically. If we also call showNotification() here the user would
  // receive TWO identical notifications for every campaign message.
  // Solution: only manually show a notification for data-only messages
  // (i.e. those sent via the Admin SDK / Cloud Functions with no
  // 'notification' key). Console campaigns are handled natively by FCM.
  //
  // Trade-off: custom action buttons (Reply / Dismiss) will NOT appear on
  // Console Campaign notifications because we let FCM render them natively.
  // To get custom buttons, send data-only messages via the Admin SDK instead.
  if (payload.notification) {
    console.log('[SW] Notification payload detected — letting FCM display it natively to avoid duplicates.');
    return;
  }

  // ── Data-only message: build and show the notification manually ──
  const d    = payload.data || {};

  const title      = d.title      || 'NeuroForge';
  const body       = d.body       || 'You have a new message';
  const icon       = d.icon       || 'https://i.postimg.cc/tgtQsSRH/1775462136384.png';
  const image      = d.image      || null;
  const tag        = d.tag        || d.chatId     || 'nf-msg-default';
  const clickUrl   = d.url        || '/chat.html';
  const senderId   = d.senderId   || '';
  const senderName = d.senderName || title;
  const chatId     = d.chatId     || '';

  const options = {
    body,
    icon,
    badge:              'https://i.postimg.cc/tgtQsSRH/1775462136384.png',
    tag,                        // collapses duplicate notifs per chat
    renotify:           true,   // vibrate/sound even when replacing same tag
    silent:             false,
    requireInteraction: false,
    vibrate:            [120, 60, 120],
    timestamp:          d.timestamp ? Number(d.timestamp) : Date.now(),

    // Action buttons (only shown for data-only / Admin SDK messages)
    actions: [
      { action: 'reply',   title: '↩ Reply'   },
      { action: 'dismiss', title: '✕ Dismiss' }
    ],

    // Payload passed through to the click handler below
    data: {
      url: clickUrl,
      chatId,
      senderId,
      senderName,
      timestamp: d.timestamp || Date.now()
    }
  };

  if (image) options.image = image;

  return self.registration.showNotification(title, options);
});

// ─────────────────────────────────────────────────────────────────
//  NOTIFICATION CLICK HANDLER
// ─────────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const action = event.action;               // 'reply' | 'dismiss' | '' (body tap)
  const data   = event.notification.data || {};

  event.notification.close();

  // User tapped "Dismiss" — just close
  if (action === 'dismiss') return;

  // Body-tap or Reply: open / focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {

      // ── App already open somewhere ────────────────────────────
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // Tell the app which chat to open (action='reply' also focuses the input)
          client.postMessage({
            type:       'NF_NOTIFICATION_CLICK',
            action,                          // '' = open, 'reply' = open + focus input
            chatId:     data.chatId,
            senderId:   data.senderId,
            senderName: data.senderName,
            url:        data.url
          });
          return;
        }
      }

      // ── App is fully closed — launch it ──────────────────────
      if (clients.openWindow) {
        return clients.openWindow(data.url || '/chat.html').then((newClient) => {
          if (!newClient) return;
          // Wait for the page to boot, then send the navigation event
          setTimeout(() => {
            newClient.postMessage({
              type:       'NF_NOTIFICATION_CLICK',
              action,
              chatId:     data.chatId,
              senderId:   data.senderId,
              senderName: data.senderName,
              url:        data.url
            });
          }, 3500);
        });
      }
    })
  );
});

// Optional: analytics hook for "user saw notif but never opened it"
self.addEventListener('notificationclose', (event) => {
  const d = event.notification.data || {};
  console.log('[SW] Notification dismissed without opening, chatId:', d.chatId);
});

// ─────────────────────────────────────────────────────────────────
//  PART 2 — APP SHELL CACHING  (replaces your inline blob SW)
// ─────────────────────────────────────────────────────────────────
const CACHE = 'nf-shell-v2';

const SHELL = [
  '/',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap'
];

self.addEventListener('install', (event) => {
  console.log('[SW] NeuroForge unified SW installing…');
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL.map(u => new Request(u, { mode: 'no-cors' }))))
      .then(() => self.skipWaiting())   // activate immediately
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated — cleaning old caches.');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => clients.claim())      // take control of all open tabs immediately
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ── Never intercept Firebase / Firestore / Auth / FCM ──────────
  if (
    url.hostname.includes('firestore.googleapis.com')   ||
    url.hostname.includes('firebase.googleapis.com')    ||
    url.hostname.includes('firebaseio.com')             ||
    url.hostname.includes('googleapis.com')             ||
    url.hostname.includes('identitytoolkit.google.com') ||
    url.hostname.includes('gstatic.com')
  ) return;

  // ── HTML navigation: serve cache instantly, refresh in background
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const network = fetch(event.request).then(resp => {
          if (resp.ok) caches.open(CACHE).then(c => c.put(event.request, resp.clone()));
          return resp;
        });
        return cached || network;
      })
    );
    return;
  }

  // ── Fonts / static assets: cache-first ─────────────────────────
  if (url.hostname.includes('fonts.')) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(resp => {
          if (resp.ok) caches.open(CACHE).then(c => c.put(event.request, resp.clone()));
          return resp;
        })
      )
    );
  }
  // Everything else: network pass-through (Firebase handles its own stuff)
});

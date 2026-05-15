/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                        NEUROCORE ENGINE v2.0                               ║
 * ║                  Central Data Engine — NeuroForge Platform                 ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  ARCHITECTURE:                                                             ║
 * ║    UI Layer → NeuroCore → { Firebase | IndexedDB | MemoryCache }           ║
 * ║                                                                            ║
 * ║  MODULES:                                                                  ║
 * ║    1.  MemoryCache          — RAM-speed instant reads + LRU eviction       ║
 * ║    2.  IDBStore             — IndexedDB v2 (msgs, contacts, optimistic,    ║
 * ║                               pagination, renderedMath, groups, channels)  ║
 * ║    3.  ListenerManager      — Reference-counted Firebase onSnapshot reg    ║
 * ║    4.  SubscriptionBus      — UI pub/sub event system                      ║
 * ║    5.  OptimisticQueue      — Pending write buffer with retry              ║
 * ║    6.  RenderScheduler      — Tiered rAF/rIC/microtask update flusher      ║
 * ║    7.  PaginationEngine     — Cursor-based lazy message loading            ║
 * ║    8.  VirtualWindowManager — DOM virtualisation (spacers + windowing)     ║
 * ║    9.  SyncEngine           — Firebase ↔ Cache bidirectional sync          ║
 * ║    10. NeuroCore            — Public API surface                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * GOLDEN RULE: UI NEVER touches Firebase directly.
 *              UI talks only to NeuroCore.
 *
 * v2.0 CHANGES:
 *   • VirtualWindowManager  — mounts only visible + OVERSCAN_BUFFER messages;
 *                             top/bottom spacers preserve scroll height.
 *   • ListenerManager       — already reference-counted (attach → count++,
 *                             detach → count--; destroy at 0).
 *   • IDBStore v2           — adds paginationCursors, optimisticQueue,
 *                             renderedMath stores; IndexedDB replaces
 *                             localStorage for runtime state.
 *   • MemoryCache eviction  — MAX_CHATS / MAX_MSGS_PER_CHAT / MAX_CONTACTS /
 *                             MAX_RENDER_CACHE caps with LRU eviction.
 *   • RenderScheduler tiers — scheduleData (queueMicrotask) for pure-JS state,
 *                             schedule (rAF) for DOM mutations, scheduleIdle
 *                             (rIC) for background / animation bookkeeping.
 *
 * HOW TO INTEGRATE:
 *   <script src="neurocore.js"></script>
 *   NeuroCore.init(db, firebaseOps, auth.currentUser);
 */

'use strict';

(function (global) {

  /* ════════════════════════════════════════════════════════════════
     ① MEMORY CACHE
     Pure Map-based in-memory store.  Zero latency.
     Holds: chats, contacts, channels, communityPosts, users, groups.

     EVICTION LIMITS (LRU per namespace):
       MAX_CHATS          — how many chat threads stay in RAM
       MAX_MSGS_PER_CHAT  — message list cap per thread
       MAX_CONTACTS       — contact objects in RAM
       MAX_RENDER_CACHE   — rendered-math HTML snippets
  ════════════════════════════════════════════════════════════════ */
  const MemoryCache = (function () {

    /* ── Eviction limits ── */
    const MAX_CHATS         = 50;
    const MAX_MSGS_PER_CHAT = 200;
    const MAX_CONTACTS      = 500;
    const MAX_RENDER_CACHE  = 500;   // for renderedMath namespace

    const _store = {
      chats:          new Map(),   // chatId   → { messages: [], meta: {} }
      contacts:       new Map(),   // uid      → contactObject
      groups:         new Map(),   // groupId  → groupObject
      channels:       new Map(),   // chanId   → channelObject
      communityPosts: new Map(),   // postId   → postObject
      users:          new Map(),   // uid      → userObject
      unread:         new Map(),   // chatId   → count
      channelPosts:   new Map(),   // chanId   → [posts]
      renderedMath:   new Map(),   // expr_hash → rendered HTML string
    };

    const _timestamps = new Map();  // `namespace:key` → lastUpdatedMs
    // LRU access order per namespace (array of keys, MRU at end)
    const _lruOrder = {};
    Object.keys(_store).forEach(ns => { _lruOrder[ns] = []; });

    /* ── internal LRU touch ── */
    function _touch(namespace, key) {
      const order = _lruOrder[namespace];
      if (!order) return;
      const idx = order.indexOf(key);
      if (idx !== -1) order.splice(idx, 1);
      order.push(key);
    }

    /* ── internal LRU eviction (evicts oldest if over limit) ── */
    function _maybeEvict(namespace, limit) {
      const ns    = _store[namespace];
      const order = _lruOrder[namespace];
      if (!ns || !order || ns.size <= limit) return;
      const excess = ns.size - limit;
      for (let i = 0; i < excess; i++) {
        const oldest = order.shift();
        if (oldest !== undefined) {
          ns.delete(oldest);
          _timestamps.delete(`${namespace}:${oldest}`);
        }
      }
    }

    function get(namespace, key) {
      const ns = _store[namespace];
      if (!ns) { _warn('MemoryCache.get: unknown namespace', namespace); return undefined; }
      const val = ns.get(key);
      if (val !== undefined) _touch(namespace, key);
      return val;
    }

    function set(namespace, key, value) {
      const ns = _store[namespace];
      if (!ns) { _warn('MemoryCache.set: unknown namespace', namespace); return; }
      if (!ns.has(key)) _lruOrder[namespace].push(key);  // new key
      ns.set(key, value);
      _timestamps.set(`${namespace}:${key}`, Date.now());
      _touch(namespace, key);

      // Enforce per-namespace caps
      if (namespace === 'chats')        _maybeEvict('chats',        MAX_CHATS);
      if (namespace === 'contacts')     _maybeEvict('contacts',     MAX_CONTACTS);
      if (namespace === 'renderedMath') _maybeEvict('renderedMath', MAX_RENDER_CACHE);
    }

    function del(namespace, key) {
      const ns = _store[namespace];
      if (ns) ns.delete(key);
      _timestamps.delete(`${namespace}:${key}`);
      const order = _lruOrder[namespace];
      if (order) {
        const idx = order.indexOf(key);
        if (idx !== -1) order.splice(idx, 1);
      }
    }

    function getAll(namespace) {
      const ns = _store[namespace];
      if (!ns) return [];
      return Array.from(ns.values());
    }

    function age(namespace, key) {
      const ts = _timestamps.get(`${namespace}:${key}`);
      return ts ? Date.now() - ts : Infinity;
    }

    function isFresh(namespace, key, maxAgeMs) {
      return age(namespace, key) < maxAgeMs;
    }

    function patch(namespace, key, updates) {
      const existing = get(namespace, key);
      if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
        set(namespace, key, { ...existing, ...updates });
      } else {
        set(namespace, key, updates);
      }
    }

    /**
     * Append a message to a chat's message array, deduplicating by id.
     * Enforces MAX_MSGS_PER_CHAT by pruning the oldest messages.
     */
    function appendMessage(chatId, msg) {
      const chat = get('chats', chatId) || { messages: [], meta: {} };
      const msgs = chat.messages || [];

      // Dedup: replace if same id, otherwise append
      const idx = msgs.findIndex(m => m.id === msg.id);
      if (idx >= 0) {
        msgs[idx] = { ...msgs[idx], ...msg };
      } else {
        msgs.push(msg);
      }

      // Keep sorted by time ascending
      msgs.sort((a, b) => (a.time || 0) - (b.time || 0));

      // Enforce MAX_MSGS_PER_CHAT: drop oldest when over cap
      if (msgs.length > MAX_MSGS_PER_CHAT) {
        msgs.splice(0, msgs.length - MAX_MSGS_PER_CHAT);
      }

      set('chats', chatId, { ...chat, messages: msgs });
    }

    function removeMessage(chatId, msgId) {
      const chat = get('chats', chatId);
      if (!chat) return;
      chat.messages = (chat.messages || []).filter(m => m.id !== msgId);
      set('chats', chatId, chat);
    }

    function clearNamespace(namespace) {
      const ns = _store[namespace];
      if (ns) ns.clear();
      if (_lruOrder[namespace]) _lruOrder[namespace].length = 0;
    }

    /**
     * Prune messages in all chats older than maxAgeMs (time-based GC).
     * Call on init or periodically with requestIdleCallback.
     */
    function pruneOldMessages(maxAgeMs) {
      const cutoff = Date.now() - maxAgeMs;
      _store.chats.forEach((chat, chatId) => {
        if (!chat.messages) return;
        const before = chat.messages.length;
        chat.messages = chat.messages.filter(m => (m.time || 0) > cutoff);
        if (chat.messages.length !== before) {
          set('chats', chatId, chat);
        }
      });
    }

    return {
      get, set, del, getAll, age, isFresh, patch,
      appendMessage, removeMessage, clearNamespace, pruneOldMessages,
      // Expose limits for external inspection
      MAX_CHATS, MAX_MSGS_PER_CHAT, MAX_CONTACTS, MAX_RENDER_CACHE,
    };
  }());


  /* ════════════════════════════════════════════════════════════════
     ② IDB STORE (IndexedDB v2)
     Persistent offline storage.  Survives page reloads.

     v2 adds three stores:
       paginationCursors  — serialisable cursor state per chat
       optimisticQueue    — offline write queue (survives hard reload)
       renderedMath       — KaTeX render cache keyed by expression hash
  ════════════════════════════════════════════════════════════════ */
  const IDBStore = (function () {
    const DB_NAME    = 'NeuroForgeDB';
    const DB_VERSION = 2;           // ← bumped from 1 to 2

    const STORES = [
      // ── Existing (v1) ──────────────────────────────────────────────
      'messages',        // { id, chatId, ...fields }
      'contacts',        // { id, ...fields }
      'groups',          // { id, ...fields }
      'channels',        // { id, ...fields }
      'communityPosts',  // { id, ...fields }
      'users',           // { id, ...fields }
      'meta',            // arbitrary key-value pairs (key is keyPath)
      // ── New in v2 ──────────────────────────────────────────────────
      'paginationCursors',  // { id: chatId, cursorData: {...}, updatedAt }
      'optimisticQueue',    // { id, operation, payload, attempts, createdAt }
      'renderedMath',       // { id: hash, html: '…', accessedAt }
    ];

    let _db = null;
    let _ready = false;
    let _readyCallbacks = [];

    function open() {
      return new Promise((resolve, reject) => {
        if (_ready && _db) { resolve(_db); return; }

        if (!window.indexedDB) {
          _warn('IDBStore: IndexedDB not supported — offline storage disabled');
          reject(new Error('IndexedDB not supported'));
          return;
        }

        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          const oldVersion = e.oldVersion;

          STORES.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              const keyPath = storeName === 'meta' ? 'key' : 'id';
              const store   = db.createObjectStore(storeName, { keyPath });

              if (storeName === 'messages') {
                store.createIndex('chatId',    'chatId',    { unique: false });
                store.createIndex('msgType',   'msgType',   { unique: false });
                store.createIndex('time',      'time',      { unique: false });
              }
              if (storeName === 'optimisticQueue') {
                store.createIndex('status', 'status', { unique: false });
              }
              if (storeName === 'renderedMath') {
                store.createIndex('accessedAt', 'accessedAt', { unique: false });
              }
            }
          });

          _log(`IDBStore: upgraded from v${oldVersion} to v${DB_VERSION}`);
        };

        req.onsuccess = (e) => {
          _db = e.target.result;
          _ready = true;
          _readyCallbacks.forEach(cb => cb(_db));
          _readyCallbacks = [];
          resolve(_db);
        };

        req.onerror = (e) => {
          _warn('IDBStore: open failed', e.target.error);
          reject(e.target.error);
        };
      });
    }

    function _getDB() {
      if (_ready && _db) return Promise.resolve(_db);
      return open();
    }

    function put(storeName, record) {
      return _getDB().then(db => new Promise((resolve, reject) => {
        try {
          const tx    = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req   = store.put(record);
          req.onsuccess = () => resolve();
          req.onerror   = (e) => { _warn('IDBStore.put error', e.target.error); reject(e.target.error); };
        } catch (err) {
          _warn('IDBStore.put caught', err);
          reject(err);
        }
      })).catch(() => {});
    }

    function putMany(storeName, records) {
      if (!records || records.length === 0) return Promise.resolve();
      return _getDB().then(db => new Promise((resolve, reject) => {
        try {
          const tx    = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          records.forEach(r => store.put(r));
          tx.oncomplete = () => resolve();
          tx.onerror    = (e) => { _warn('IDBStore.putMany error', e.target.error); reject(e.target.error); };
        } catch (err) {
          _warn('IDBStore.putMany caught', err);
          reject(err);
        }
      })).catch(() => {});
    }

    function getOne(storeName, id) {
      return _getDB().then(db => new Promise((resolve) => {
        try {
          const tx    = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req   = store.get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror   = () => resolve(null);
        } catch {
          resolve(null);
        }
      })).catch(() => null);
    }

    function getAll(storeName) {
      return _getDB().then(db => new Promise((resolve) => {
        try {
          const tx    = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req   = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror   = () => resolve([]);
        } catch {
          resolve([]);
        }
      })).catch(() => []);
    }

    function getMessagesByChatId(chatId) {
      return _getDB().then(db => new Promise((resolve) => {
        try {
          const tx    = db.transaction('messages', 'readonly');
          const store = tx.objectStore('messages');
          const idx   = store.index('chatId');
          const req   = idx.getAll(chatId);
          req.onsuccess = () => resolve(req.result || []);
          req.onerror   = () => resolve([]);
        } catch {
          resolve([]);
        }
      })).catch(() => []);
    }

    /**
     * Delete all plain-text messages in a chat older than cutoffMs timestamp.
     * Called during the 48-hour auto-cleanup pass.
     * Returns an array of deleted message IDs.
     */
    function deleteExpiredPlainMessages(chatId, cutoffMs) {
      return _getDB().then(db => new Promise((resolve) => {
        try {
          const tx    = db.transaction('messages', 'readwrite');
          const store = tx.objectStore('messages');
          const idx   = store.index('chatId');
          const req   = idx.getAll(chatId);
          const deleted = [];

          req.onsuccess = () => {
            const records = req.result || [];
            records.forEach(r => {
              // Only delete normal text messages — never cards, stickers, or images
              const isPlain = r.msgType === 'text' &&
                              !r.mathCard && !r.sticker && !r.img && !r.discuss;
              if (isPlain && (r.time || 0) < cutoffMs) {
                store.delete(r.id);
                deleted.push(r.id);
              }
            });
          };
          tx.oncomplete = () => resolve(deleted);
          tx.onerror    = () => resolve([]);
        } catch {
          resolve([]);
        }
      })).catch(() => []);
    }

    function del(storeName, id) {
      return _getDB().then(db => new Promise((resolve) => {
        try {
          const tx    = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.delete(id);
          tx.oncomplete = () => resolve();
          tx.onerror    = () => resolve();
        } catch {
          resolve();
        }
      })).catch(() => {});
    }

    function clear(storeName) {
      return _getDB().then(db => new Promise((resolve) => {
        try {
          const tx    = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.clear();
          tx.oncomplete = () => resolve();
          tx.onerror    = () => resolve();
        } catch {
          resolve();
        }
      })).catch(() => {});
    }

    function getMeta(key) {
      return getOne('meta', key).then(r => r ? r.value : null);
    }

    function setMeta(key, value) {
      return put('meta', { key, value, updatedAt: Date.now() });
    }

    /* ── Pagination cursor persistence ── */
    function savePaginationCursor(chatId, cursorData) {
      return put('paginationCursors', { id: chatId, cursorData, updatedAt: Date.now() });
    }

    function loadPaginationCursor(chatId) {
      return getOne('paginationCursors', chatId).then(r => r ? r.cursorData : null);
    }

    /* ── Optimistic queue persistence (survive hard reload) ── */
    function saveOptimisticEntry(entry) {
      return put('optimisticQueue', entry);
    }

    function loadOptimisticQueue() {
      return getAll('optimisticQueue');
    }

    function removeOptimisticEntry(id) {
      return del('optimisticQueue', id);
    }

    /* ── Rendered-math cache ── */
    function getCachedMath(hash) {
      return getOne('renderedMath', hash).then(r => {
        if (!r) return null;
        // Touch accessedAt for LRU eviction
        put('renderedMath', { ...r, accessedAt: Date.now() }).catch(() => {});
        return r.html;
      });
    }

    function saveCachedMath(hash, html) {
      return put('renderedMath', { id: hash, html, accessedAt: Date.now() });
    }

    /**
     * Evict rendered-math entries down to maxCount (keeps newest-accessed).
     */
    function evictMathCache(maxCount) {
      return _getDB().then(db => new Promise((resolve) => {
        try {
          const tx    = db.transaction('renderedMath', 'readwrite');
          const store = tx.objectStore('renderedMath');
          const idx   = store.index('accessedAt');
          const all   = [];
          idx.openCursor().onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) { all.push(cursor.primaryKey); cursor.continue(); }
            else {
              // all is sorted oldest-first by accessedAt
              const excess = all.length - maxCount;
              if (excess > 0) {
                for (let i = 0; i < excess; i++) store.delete(all[i]);
              }
              resolve();
            }
          };
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      })).catch(() => {});
    }

    // Begin opening the DB eagerly on module load
    open().catch(() => {});

    return {
      open, put, putMany, getOne, getAll,
      getMessagesByChatId, deleteExpiredPlainMessages, del, clear,
      getMeta, setMeta,
      savePaginationCursor, loadPaginationCursor,
      saveOptimisticEntry, loadOptimisticQueue, removeOptimisticEntry,
      getCachedMath, saveCachedMath, evictMathCache,
    };
  }());


  /* ════════════════════════════════════════════════════════════════
     ③ LISTENER MANAGER
     Exactly ONE active Firebase onSnapshot per resource.
     Reference-counted: attach() → refCount++, detach() → refCount--;
     the underlying Firebase listener is destroyed only when refCount
     reaches 0.  This prevents accidental listener leaks when the same
     resource is opened by two independent consumers (e.g. chat panel
     + notification badge).
  ════════════════════════════════════════════════════════════════ */
  const ListenerManager = (function () {
    // Map of resourceKey → { unsub: Function, refCount: number, type: string, attachedAt: number }
    const _active = new Map();

    /**
     * Register a new listener (or increment an existing refCount).
     * @param {string}   key        Unique resource identifier (e.g. 'chat:abc123')
     * @param {Function} attachFn   Called once; must return the unsubscribe function.
     * @param {string}   [type]     Label for debugging.
     */
    function attach(key, attachFn, type = 'unknown') {
      if (_active.has(key)) {
        const entry = _active.get(key);
        entry.refCount++;
        _log(`[Listener] reuse "${key}" (refs: ${entry.refCount})`);
        return;
      }

      let unsub;
      try {
        unsub = attachFn();
      } catch (err) {
        _warn(`[Listener] attachFn threw for key "${key}"`, err);
        return;
      }

      if (typeof unsub !== 'function') {
        _warn(`[Listener] attachFn did not return an unsubscribe function for key "${key}"`);
        return;
      }

      _active.set(key, { unsub, refCount: 1, type, attachedAt: Date.now() });
      _log(`[Listener] attached "${key}" [type: ${type}]`);
    }

    /**
     * Decrement refCount.  Destroys the listener when it reaches 0.
     * @param {string} key
     */
    function detach(key) {
      const entry = _active.get(key);
      if (!entry) {
        _warn(`[Listener] detach: no listener found for key "${key}"`);
        return;
      }

      entry.refCount--;
      _log(`[Listener] detach "${key}" (refs: ${entry.refCount})`);

      if (entry.refCount <= 0) {
        try { entry.unsub(); } catch (err) { _warn(`[Listener] unsub threw for "${key}"`, err); }
        _active.delete(key);
        _log(`[Listener] destroyed "${key}"`);
      }
    }

    /** Detach ALL listeners immediately (e.g. on logout). */
    function detachAll() {
      _active.forEach((entry, key) => {
        try { entry.unsub(); } catch (err) { _warn(`[Listener] unsub threw for "${key}"`, err); }
      });
      _active.clear();
      _log('[Listener] all listeners destroyed');
    }

    function isActive(key) { return _active.has(key); }

    function activeKeys() { return Array.from(_active.keys()); }

    function refCount(key) {
      const entry = _active.get(key);
      return entry ? entry.refCount : 0;
    }

    return { attach, detach, detachAll, isActive, activeKeys, refCount };
  }());


  /* ════════════════════════════════════════════════════════════════
     ④ SUBSCRIPTION BUS
     UI subscribes to named topics.  Engine notifies subscribers
     when data changes.  Completely decoupled from Firebase.
  ════════════════════════════════════════════════════════════════ */
  const SubscriptionBus = (function () {
    // Map of topic → Set of callbacks
    const _subs = new Map();

    function subscribe(topic, callback) {
      if (!_subs.has(topic)) _subs.set(topic, new Set());
      _subs.get(topic).add(callback);
      return () => {
        const set = _subs.get(topic);
        if (set) { set.delete(callback); if (set.size === 0) _subs.delete(topic); }
      };
    }

    function notify(topic, data) {
      const set = _subs.get(topic);
      if (!set || set.size === 0) return;
      set.forEach(cb => {
        try { cb(data); } catch (err) { _warn(`[SubscriptionBus] callback error on "${topic}"`, err); }
      });
    }

    function clear(topic)  { _subs.delete(topic); }
    function clearAll()    { _subs.clear(); }
    function count(topic)  { return _subs.has(topic) ? _subs.get(topic).size : 0; }

    return { subscribe, notify, clear, clearAll, count };
  }());


  /* ════════════════════════════════════════════════════════════════
     ⑤ OPTIMISTIC QUEUE
     Write-through optimistic updates with retry on failure.

     Flow:
       1. UI calls a write (sendMessage, reactPost, etc.)
       2. Engine applies change to MemoryCache immediately (optimistic)
       3. Engine notifies UI subscribers (instant feedback)
       4. Engine writes to Firebase asynchronously
       5. If Firebase write fails → entry moved to retry queue
       6. On reconnect / next tick → retry queue is flushed
  ════════════════════════════════════════════════════════════════ */
  const OptimisticQueue = (function () {
    const _pending  = [];
    const _retrying = new Set();
    const MAX_ATTEMPTS   = 5;
    const RETRY_DELAYS   = [2000, 5000, 10000, 30000, 60000];

    let _retryTimer = null;

    function enqueue(operation, writeFn) {
      const id = _genId();
      const entry = { id, operation, writeFn, attempts: 0, createdAt: Date.now(), status: 'pending' };
      _pending.push(entry);
      // Persist to IDB so queue survives hard reload
      IDBStore.saveOptimisticEntry({
        id, operation, createdAt: entry.createdAt, status: 'pending',
        // writeFn is not serialisable; only label+meta is persisted for diagnostics
      }).catch(() => {});
      _flush();
      return id;
    }

    async function _flush() {
      const toFlush = _pending.filter(e => e.status === 'pending' && !_retrying.has(e.id));
      for (const entry of toFlush) {
        _retrying.add(entry.id);
        entry.status = 'inflight';
        entry.attempts++;
        try {
          await entry.writeFn();
          const idx = _pending.findIndex(e => e.id === entry.id);
          if (idx >= 0) _pending.splice(idx, 1);
          _retrying.delete(entry.id);
          IDBStore.removeOptimisticEntry(entry.id).catch(() => {});
          _log(`[Queue] "${entry.operation}" succeeded (attempt ${entry.attempts})`);
        } catch (err) {
          _retrying.delete(entry.id);
          entry.status = 'pending';
          _warn(`[Queue] "${entry.operation}" failed (attempt ${entry.attempts})`, err);
          if (entry.attempts >= MAX_ATTEMPTS) {
            _warn(`[Queue] "${entry.operation}" exceeded max attempts — dropping`);
            const idx = _pending.findIndex(e => e.id === entry.id);
            if (idx >= 0) _pending.splice(idx, 1);
            IDBStore.removeOptimisticEntry(entry.id).catch(() => {});
          } else {
            const delay = RETRY_DELAYS[Math.min(entry.attempts - 1, RETRY_DELAYS.length - 1)];
            _log(`[Queue] "${entry.operation}" will retry in ${delay}ms`);
            if (_retryTimer) clearTimeout(_retryTimer);
            _retryTimer = setTimeout(_flush, delay);
          }
        }
      }
    }

    function cancel(id) {
      const idx = _pending.findIndex(e => e.id === id);
      if (idx >= 0) _pending.splice(idx, 1);
      IDBStore.removeOptimisticEntry(id).catch(() => {});
    }

    function retryAll() {
      _pending.forEach(e => { e.status = 'pending'; });
      _flush();
    }

    function pendingCount() { return _pending.length; }

    return { enqueue, cancel, retryAll, pendingCount };
  }());


  /* ════════════════════════════════════════════════════════════════
     ⑥ RENDER SCHEDULER  (TIERED)
     Three tiers for different work priorities:

       scheduleData  → queueMicrotask
         Pure JS state updates that must complete before the next
         macrotask (e.g. updating a derived cache or badge count).

       schedule (DOM) → requestAnimationFrame
         DOM mutations that must be synchronised with the browser's
         paint cycle.  Batched: only the LAST data for a key wins
         within a single frame.

       scheduleIdle  → requestIdleCallback (fallback: setTimeout 100ms)
         Background / low-priority work that must not interrupt user
         interaction: math cache eviction, analytics flushes,
         inactive-chat cleanup, etc.
  ════════════════════════════════════════════════════════════════ */
  const RenderScheduler = (function () {

    /* ── Tier 1: DATA — queueMicrotask ── */
    const _dataPending = new Map();  // key → { cb, data }
    let _dataQueued = false;

    function scheduleData(key, cb, data) {
      _dataPending.set(key, { cb, data });
      if (_dataQueued) return;
      _dataQueued = true;
      queueMicrotask(_flushData);
    }

    function _flushData() {
      _dataQueued = false;
      const batch = new Map(_dataPending);
      _dataPending.clear();
      batch.forEach(({ cb, data }) => {
        try { cb(data); } catch (err) { _warn('[RenderScheduler:data] error', err); }
      });
    }

    /* ── Tier 2: DOM — requestAnimationFrame ── */
    const _domPending = new Map();   // key → { cb, data }
    let _rafHandle = null;

    function schedule(key, cb, data) {
      _domPending.set(key, { cb, data });
      if (_rafHandle) return;
      _rafHandle = requestAnimationFrame(_flushDom);
    }

    function _flushDom() {
      _rafHandle = null;
      const batch = new Map(_domPending);
      _domPending.clear();
      batch.forEach(({ cb, data }) => {
        try { cb(data); } catch (err) { _warn('[RenderScheduler:dom] error', err); }
      });
    }

    function cancelDom(key) { _domPending.delete(key); }

    function flush() {
      if (_rafHandle) { cancelAnimationFrame(_rafHandle); _rafHandle = null; }
      _flushDom();
    }

    /* ── Tier 3: IDLE — requestIdleCallback ── */
    const _idleQueue = [];  // [{ cb, label }]
    let _idleScheduled = false;

    function scheduleIdle(cb, label = 'idle') {
      _idleQueue.push({ cb, label });
      if (_idleScheduled) return;
      _idleScheduled = true;

      const run = (deadline) => {
        _idleScheduled = false;
        while (_idleQueue.length > 0) {
          const { cb: task, label: lbl } = _idleQueue.shift();
          try { task(); } catch (err) { _warn(`[RenderScheduler:idle] "${lbl}" error`, err); }
          // If time slice is nearly exhausted, reschedule remaining tasks
          if (deadline && typeof deadline.timeRemaining === 'function' &&
              deadline.timeRemaining() < 2 && _idleQueue.length > 0) {
            _idleScheduled = true;
            _scheduleIdleFrame(run);
            return;
          }
        }
      };

      _scheduleIdleFrame(run);
    }

    function _scheduleIdleFrame(fn) {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(fn, { timeout: 1000 });
      } else {
        setTimeout(() => fn({ timeRemaining: () => 50 }), 100);
      }
    }

    return { scheduleData, schedule, scheduleIdle, cancelDom, flush };
  }());


  /* ════════════════════════════════════════════════════════════════
     ⑦ PAGINATION ENGINE
     Manages per-chat cursor state for scroll-up "load older" pages.
  ════════════════════════════════════════════════════════════════ */
  const PaginationEngine = (function () {
    const PAGE_SIZE = 30;

    // Map of chatId → { cursor, loading, noMore }
    const _state = new Map();

    function _getState(chatId) {
      if (!_state.has(chatId)) {
        _state.set(chatId, { cursor: null, loading: false, noMore: false });
      }
      return _state.get(chatId);
    }

    function reset(chatId)  { _state.set(chatId, { cursor: null, loading: false, noMore: false }); }
    function resetAll()     { _state.clear(); }
    function canLoadMore(chatId) { const s = _getState(chatId); return !s.loading && !s.noMore; }
    function startLoad(chatId)   { _getState(chatId).loading = true; }

    function finishLoad(chatId, lastDoc, count) {
      const s = _getState(chatId);
      s.loading = false;
      s.cursor  = lastDoc;
      s.noMore  = count < PAGE_SIZE;

      // Persist cursor to IDB so it survives a page reload
      if (lastDoc) {
        try {
          // Firestore DocumentSnapshot is not directly serialisable.
          // Store a lightweight stub with the doc's id and time for
          // reference.  The real cursor must be re-obtained from Firebase
          // on reload; we persist it primarily for analytics / debugging.
          const stub = { id: lastDoc.id, time: lastDoc.data?.().time || Date.now() };
          IDBStore.savePaginationCursor(chatId, stub).catch(() => {});
        } catch (_) {}
      }
    }

    function getCursor(chatId)    { return _getState(chatId).cursor; }
    function isLoading(chatId)    { return _getState(chatId).loading; }
    function isExhausted(chatId)  { return _getState(chatId).noMore; }

    return {
      PAGE_SIZE, reset, resetAll,
      canLoadMore, startLoad, finishLoad,
      getCursor, isLoading, isExhausted,
    };
  }());


  /* ════════════════════════════════════════════════════════════════
     ⑧ VIRTUAL WINDOW MANAGER
     True message virtualisation: only VISIBLE + OVERSCAN_BUFFER
     messages are mounted to the DOM; everything else is hidden behind
     CSS spacer divs.

     Architecture:
       ┌───────────────────┐   ← scroll container (#msgs)
       │  #vwm-top-spacer  │   ← height = sum of unmounted-top msgs
       │  [message 160]    │   ← mounted
       │  [message 161]    │
       │  …                │
       │  [message 230]    │   ← mounted
       │  #vwm-bot-spacer  │   ← height = sum of unmounted-bot msgs
       └───────────────────┘

     Integration (chat.html):
       1.  Add spacer divs inside #msgs:
             <div id="vwm-top-spacer" style="will-change:height;"></div>
             …messages…
             <div id="vwm-bot-spacer" style="will-change:height;"></div>

       2.  After receiving a message array from NeuroBridge:
             VirtualWindowManager.setMessages(messages);

       3.  On scroll (throttled):
             VirtualWindowManager.onScroll(box.scrollTop, box.clientHeight);

       4.  Register a viewport callback (once, on chat open):
             VirtualWindowManager.onViewportChange(({ mounted, topH, botH }) => {
               topSpacer.style.height = topH + 'px';
               botSpacer.style.height = botH + 'px';
               renderMountedSlice(mounted);   // your existing appendMsg loop
             });

       5.  Measure each rendered message and feed back heights:
             VirtualWindowManager.measureHeight(msg.id, domNode.offsetHeight);

       6.  On chat close / switch:
             VirtualWindowManager.reset();
  ════════════════════════════════════════════════════════════════ */
  const VirtualWindowManager = (function () {

    const OVERSCAN      = 20;    // messages above + below viewport to keep mounted
    const EST_MSG_H     = 68;    // estimated height per message (px) before measurement
    const SCROLL_THROTTLE_MS = 60; // minimum ms between scroll-triggered re-windows

    let _messages    = [];        // full ordered message array (data only, no DOM)
    let _heightCache = new Map(); // msgId → measured height (px)
    let _mountedRange  = { start: 0, end: -1 }; // inclusive index range
    let _containerH  = 0;        // scroll container clientHeight
    let _scrollTop   = 0;        // last known scrollTop
    let _onViewport  = null;     // callback registered by UI
    let _lastScrollNotify = 0;   // throttle guard
    let _pendingRaf  = false;    // rAF dedup flag
    let _atBottom    = true;     // auto-scroll anchor

    /* ── Compute cumulative height up to (not including) index i ── */
    function _offsetBefore(i) {
      let h = 0;
      for (let j = 0; j < i; j++) {
        h += (_heightCache.get(_messages[j]?.id) || EST_MSG_H);
      }
      return h;
    }

    /* ── Find message index at a given pixel offset from top ── */
    function _indexAtOffset(px) {
      let acc = 0;
      for (let i = 0; i < _messages.length; i++) {
        const h = _heightCache.get(_messages[i]?.id) || EST_MSG_H;
        if (acc + h > px) return i;
        acc += h;
      }
      return Math.max(0, _messages.length - 1);
    }

    /* ── Compute which messages should be mounted ── */
    function _computeMountRange() {
      if (_messages.length === 0) return { start: 0, end: -1 };

      // Visible indices
      const visStart = _indexAtOffset(_scrollTop);
      const visEnd   = _indexAtOffset(_scrollTop + _containerH);

      const start = Math.max(0, visStart - OVERSCAN);
      const end   = Math.min(_messages.length - 1, visEnd + OVERSCAN);
      return { start, end };
    }

    /* ── Compute spacer heights ── */
    function _spacers(start, end) {
      let topH = 0, botH = 0;
      for (let i = 0; i < start; i++) {
        topH += (_heightCache.get(_messages[i]?.id) || EST_MSG_H);
      }
      for (let i = end + 1; i < _messages.length; i++) {
        botH += (_heightCache.get(_messages[i]?.id) || EST_MSG_H);
      }
      return { topH, botH };
    }

    /* ── Fire the viewport change callback ── */
    function _notify() {
      if (!_onViewport) return;
      const { start, end } = _mountedRange;
      const { topH, botH } = _spacers(start, end);
      const mounted = (start <= end) ? _messages.slice(start, end + 1) : [];
      try {
        _onViewport({ mounted, topH, botH, startIdx: start, endIdx: end });
      } catch (err) {
        _warn('[VirtualWindowManager] onViewportChange callback error', err);
      }
    }

    /* ── Recompute mount range and notify if it changed ── */
    function _recompute(forceNotify) {
      const prev  = _mountedRange;
      const next  = _computeMountRange();
      const changed = forceNotify || next.start !== prev.start || next.end !== prev.end;
      if (changed) {
        _mountedRange = next;
        _notify();
      }
    }

    /**
     * Replace the full message list.  Call this every time the message
     * array from NeuroBridge changes.
     *
     * @param {Array} messages  Ordered array of message objects (plain data).
     */
    function setMessages(messages) {
      _messages = messages || [];

      // If anchored to bottom, scroll index should stay at end
      if (_atBottom) {
        _mountedRange = {
          start: Math.max(0, _messages.length - 1 - OVERSCAN),
          end:   _messages.length - 1,
        };
      }

      _recompute(true);
    }

    /**
     * Feed back the measured pixel height of a rendered message node.
     * This refines the spacer calculations away from the initial estimate.
     *
     * @param {string} msgId
     * @param {number} heightPx
     */
    function measureHeight(msgId, heightPx) {
      if (!msgId || heightPx <= 0) return;
      const prev = _heightCache.get(msgId);
      _heightCache.set(msgId, heightPx);
      // If height changed significantly, recompute spacers (no re-mount needed)
      if (prev !== undefined && Math.abs(prev - heightPx) > 4) {
        if (!_pendingRaf) {
          _pendingRaf = true;
          requestAnimationFrame(() => { _pendingRaf = false; _recompute(true); });
        }
      }
    }

    /**
     * Call this from your scroll event handler (throttled internally).
     *
     * @param {number} scrollTop
     * @param {number} containerH
     */
    function onScroll(scrollTop, containerH) {
      _scrollTop  = scrollTop;
      _containerH = containerH;

      // Bottom-anchor detection
      const totalH = getTotalHeight();
      _atBottom = (scrollTop + containerH >= totalH - 80);

      const now = Date.now();
      if (now - _lastScrollNotify < SCROLL_THROTTLE_MS) {
        // Throttle: schedule one rAF update if none pending
        if (!_pendingRaf) {
          _pendingRaf = true;
          requestAnimationFrame(() => {
            _pendingRaf = false;
            _lastScrollNotify = Date.now();
            _recompute(false);
          });
        }
        return;
      }
      _lastScrollNotify = now;
      _recompute(false);
    }

    /**
     * Register the UI callback that receives viewport updates.
     * Called once when a chat is opened.
     *
     * @param {Function} cb  ({ mounted, topH, botH, startIdx, endIdx }) => void
     */
    function onViewportChange(cb) {
      _onViewport = cb;
    }

    /**
     * Wrap a DOM mutation that adds messages above the current viewport
     * (scroll-up pagination) to prevent scroll jump.
     *
     * @param {HTMLElement} container  The scroll container (#msgs)
     * @param {Function}    mutateFn   Synchronous DOM mutation
     */
    function preserveAnchor(container, mutateFn) {
      const prevScrollTop = container.scrollTop;
      const prevScrollH   = container.scrollHeight;
      mutateFn();
      // Use rAF to measure after paint
      requestAnimationFrame(() => {
        const delta = container.scrollHeight - prevScrollH;
        if (delta > 0) {
          container.style.scrollBehavior = 'auto';
          container.scrollTop = prevScrollTop + delta;
          requestAnimationFrame(() => { container.style.scrollBehavior = ''; });
        }
      });
    }

    /** Reset all state — call on chat switch or logout. */
    function reset() {
      _messages     = [];
      _heightCache  = new Map();
      _mountedRange = { start: 0, end: -1 };
      _containerH   = 0;
      _scrollTop    = 0;
      _onViewport   = null;
      _atBottom     = true;
      _lastScrollNotify = 0;
      _pendingRaf   = false;
    }

    /** Total estimated (or measured) height of all messages. */
    function getTotalHeight() {
      return _messages.reduce((sum, m) => sum + (_heightCache.get(m.id) || EST_MSG_H), 0);
    }

    function getMountedRange() { return { ..._mountedRange }; }
    function getAllMessages()   { return _messages; }
    function isAtBottom()      { return _atBottom; }

    return {
      setMessages, measureHeight, onScroll, onViewportChange,
      preserveAnchor, reset,
      getTotalHeight, getMountedRange, getAllMessages, isAtBottom,
      // Exposed constants for external use
      OVERSCAN, EST_MSG_H,
    };
  }());


  /* ════════════════════════════════════════════════════════════════
     ⑨ SYNC ENGINE
     Orchestrates data flow:
       Cache miss → IDB → Firebase → Cache → Notify UI
     Also handles bidirectional sync on login.
  ════════════════════════════════════════════════════════════════ */
  const SyncEngine = (function () {

    async function syncContacts(uid, db, firebaseOps) {
      const { collection, query, where, onSnapshot } = firebaseOps;

      // ── Layer 1: Memory cache ──
      const cached = MemoryCache.getAll('contacts');
      if (cached.length > 0) {
        SubscriptionBus.notify('contacts', cached);
        _log('[Sync] contacts: served from MemoryCache');
      }

      // ── Layer 2: IndexedDB ──
      if (cached.length === 0) {
        const persisted = await IDBStore.getAll('contacts');
        if (persisted.length > 0) {
          persisted.forEach(c => MemoryCache.set('contacts', c.id, c));
          SubscriptionBus.notify('contacts', persisted);
          _log('[Sync] contacts: served from IDB');
        }
      }

      // ── Layer 3: Firebase realtime listener ──
      const key = `contacts:${uid}`;
      if (ListenerManager.isActive(key)) return;

      ListenerManager.attach(key, () => {
        const contactsRef = collection(db, 'contacts');
        const q = query(contactsRef, where('users', 'array-contains', uid));

        const unsub = onSnapshot(q, (snap) => {
          const contacts = [];
          snap.forEach(doc => {
            const c = { id: doc.id, ...doc.data() };
            contacts.push(c);
            MemoryCache.set('contacts', c.id, c);
            IDBStore.put('contacts', c).catch(() => {});
          });

          snap.docChanges().forEach(change => {
            if (change.type === 'removed') {
              MemoryCache.del('contacts', change.doc.id);
            }
          });

          RenderScheduler.schedule('contacts', (data) => {
            SubscriptionBus.notify('contacts', data);
          }, contacts);

          _log(`[Sync] contacts: Firebase snapshot — ${contacts.length} contacts`);
        }, (err) => {
          _warn('[Sync] contacts: listener error', err);
        });

        return unsub;
      }, 'contacts');
    }

    async function syncChat(chatId, isGroup, currentUid, db, firebaseOps) {
      const { collection, query, orderBy, limit, onSnapshot, startAfter } = firebaseOps;

      // ── Layer 1: Memory cache ──
      const cached = MemoryCache.get('chats', chatId);
      if (cached && (cached.messages || []).length > 0) {
        SubscriptionBus.notify(`chat:${chatId}`, cached.messages);
        _log(`[Sync] chat ${chatId}: served ${cached.messages.length} from MemoryCache`);
      }

      // ── Layer 2: IndexedDB ──
      if (!cached || (cached.messages || []).length === 0) {
        const persisted = await IDBStore.getMessagesByChatId(chatId);
        if (persisted.length > 0) {
          const sorted = persisted.sort((a, b) => (a.time || 0) - (b.time || 0));
          MemoryCache.set('chats', chatId, { messages: sorted, meta: {} });
          SubscriptionBus.notify(`chat:${chatId}`, sorted);
          _log(`[Sync] chat ${chatId}: served ${sorted.length} from IDB`);
        }
      }

      // ── Layer 3: Firebase realtime listener ──
      const key = `chat:${chatId}`;
      if (ListenerManager.isActive(key)) return;

      PaginationEngine.reset(chatId);

      ListenerManager.attach(key, () => {
        const collPath  = isGroup ? `groups/${chatId}/messages` : `chats/${chatId}/messages`;
        const msgsRef   = collection(db, collPath);
        const q = query(msgsRef, orderBy('time', 'asc'), limit(PaginationEngine.PAGE_SIZE));

        const unsub = onSnapshot(q, (snap) => {
          snap.docChanges().forEach(change => {
            const msg = { id: change.doc.id, ...change.doc.data() };
            if (change.type === 'added' || change.type === 'modified') {
              MemoryCache.appendMessage(chatId, msg);
              IDBStore.put('messages', { ...msg, chatId }).catch(() => {});
            } else if (change.type === 'removed') {
              MemoryCache.removeMessage(chatId, msg.id);
              IDBStore.del('messages', msg.id).catch(() => {});
            }
          });

          const chatData = MemoryCache.get('chats', chatId);
          const messages = chatData ? chatData.messages : [];

          // Feed messages into VirtualWindowManager (data tier — microtask)
          RenderScheduler.scheduleData(`vwm:${chatId}`, (msgs) => {
            VirtualWindowManager.setMessages(msgs);
          }, messages);

          // Notify UI subscribers (DOM tier — rAF)
          RenderScheduler.schedule(`chat:${chatId}`, (msgs) => {
            SubscriptionBus.notify(`chat:${chatId}`, msgs);
          }, messages);

        }, (err) => {
          _warn(`[Sync] chat ${chatId}: listener error`, err);
        });

        return unsub;
      }, 'messages');
    }

    function closeChat(chatId) {
      ListenerManager.detach(`chat:${chatId}`);
      VirtualWindowManager.reset();
      _log(`[Sync] chat ${chatId}: listener detached`);
    }

    async function loadOlderMessages(chatId, isGroup, db, firebaseOps) {
      if (!PaginationEngine.canLoadMore(chatId)) return [];

      const { collection, query, orderBy, limit, getDocs, startAfter } = firebaseOps;
      PaginationEngine.startLoad(chatId);
      const cursor = PaginationEngine.getCursor(chatId);

      try {
        const collPath = isGroup ? `groups/${chatId}/messages` : `chats/${chatId}/messages`;
        const msgsRef  = collection(db, collPath);
        const constraints = [orderBy('time', 'desc'), limit(PaginationEngine.PAGE_SIZE)];
        if (cursor) constraints.push(startAfter(cursor));

        const q    = query(msgsRef, ...constraints);
        const snap = await getDocs(q);

        const older = [];
        snap.forEach(doc => {
          const msg = { id: doc.id, ...doc.data() };
          older.push(msg);
          MemoryCache.appendMessage(chatId, msg);
          IDBStore.put('messages', { ...msg, chatId }).catch(() => {});
        });

        older.reverse();
        const lastDoc = snap.docs[snap.docs.length - 1] || null;
        PaginationEngine.finishLoad(chatId, lastDoc, snap.docs.length);

        _log(`[Sync] loadOlderMessages: ${older.length} messages for chat ${chatId}`);
        return older;

      } catch (err) {
        PaginationEngine.finishLoad(chatId, null, 0);
        _warn('[Sync] loadOlderMessages error', err);
        return [];
      }
    }

    async function syncGroups(uid, db, firebaseOps) {
      const { collection, query, where, onSnapshot } = firebaseOps;
      const key = `groups:${uid}`;
      if (ListenerManager.isActive(key)) return;

      const cached = MemoryCache.getAll('groups');
      if (cached.length > 0) SubscriptionBus.notify('groups', cached);

      ListenerManager.attach(key, () => {
        const groupsRef = collection(db, 'groups');
        const q = query(groupsRef, where('members', 'array-contains', uid));

        const unsub = onSnapshot(q, (snap) => {
          const groups = [];
          snap.forEach(doc => {
            const g = { id: doc.id, ...doc.data() };
            groups.push(g);
            MemoryCache.set('groups', g.id, g);
            IDBStore.put('groups', g).catch(() => {});
          });

          snap.docChanges().forEach(change => {
            if (change.type === 'removed') MemoryCache.del('groups', change.doc.id);
          });

          RenderScheduler.schedule('groups', (data) => {
            SubscriptionBus.notify('groups', data);
          }, groups);
        }, (err) => {
          _warn('[Sync] groups listener error', err);
        });

        return unsub;
      }, 'groups');
    }

    async function syncCommunity(db, firebaseOps, pageSize = 20) {
      const { collection, query, orderBy, limit, onSnapshot } = firebaseOps;
      const key = 'community:feed';
      if (ListenerManager.isActive(key)) return;

      const cached = MemoryCache.getAll('communityPosts');
      if (cached.length > 0) SubscriptionBus.notify('community', cached);

      ListenerManager.attach(key, () => {
        const q = query(
          collection(db, 'community'),
          orderBy('time', 'desc'),
          limit(pageSize)
        );

        const unsub = onSnapshot(q, (snap) => {
          snap.docChanges().forEach(change => {
            const post = { id: change.doc.id, ...change.doc.data() };
            if (change.type === 'removed') {
              MemoryCache.del('communityPosts', post.id);
            } else {
              MemoryCache.set('communityPosts', post.id, post);
              IDBStore.put('communityPosts', post).catch(() => {});
            }
          });

          const posts = MemoryCache.getAll('communityPosts')
            .sort((a, b) => (b.time || 0) - (a.time || 0));

          RenderScheduler.schedule('community', (data) => {
            SubscriptionBus.notify('community', data);
          }, posts);
        }, (err) => {
          _warn('[Sync] community listener error', err);
        });

        return unsub;
      }, 'community');
    }

    async function syncChannels(uid, db, firebaseOps) {
      const { collection, query, where, onSnapshot } = firebaseOps;
      const key = `channels:${uid}`;
      if (ListenerManager.isActive(key)) return;

      const cached = MemoryCache.getAll('channels');
      if (cached.length > 0) SubscriptionBus.notify('channels', cached);

      ListenerManager.attach(key, () => {
        const q = query(
          collection(db, 'channels'),
          where('followers', 'array-contains', uid)
        );

        const unsub = onSnapshot(q, (snap) => {
          const channels = [];
          snap.forEach(doc => {
            const c = { id: doc.id, ...doc.data() };
            channels.push(c);
            MemoryCache.set('channels', c.id, c);
            IDBStore.put('channels', c).catch(() => {});
          });

          snap.docChanges().forEach(change => {
            if (change.type === 'removed') MemoryCache.del('channels', change.doc.id);
          });

          RenderScheduler.schedule('channels', (data) => {
            SubscriptionBus.notify('channels', data);
          }, channels);
        }, (err) => {
          _warn('[Sync] channels listener error', err);
        });

        return unsub;
      }, 'channels');
    }

    async function getUser(uid, db, firebaseOps) {
      const { doc, getDoc } = firebaseOps;

      // Layer 1: Memory
      const cached = MemoryCache.get('users', uid);
      if (cached) return cached;

      // Layer 2: IDB
      const persisted = await IDBStore.getOne('users', uid);
      if (persisted) {
        MemoryCache.set('users', uid, persisted);
        return persisted;
      }

      // Layer 3: Firebase
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const user = { id: snap.id, ...snap.data() };
          MemoryCache.set('users', uid, user);
          IDBStore.put('users', user).catch(() => {});
          return user;
        }
      } catch (err) {
        _warn(`[Sync] getUser ${uid} error`, err);
      }

      return { id: uid, name: 'Unknown', ini: '?', g: '#333' };
    }

    function teardown() {
      ListenerManager.detachAll();
      SubscriptionBus.clearAll();
      PaginationEngine.resetAll();
      VirtualWindowManager.reset();
      MemoryCache.clearNamespace('chats');
      MemoryCache.clearNamespace('contacts');
      MemoryCache.clearNamespace('groups');
      MemoryCache.clearNamespace('channels');
      MemoryCache.clearNamespace('communityPosts');
      MemoryCache.clearNamespace('users');
      MemoryCache.clearNamespace('unread');
      _log('[Sync] teardown complete');
    }

    return {
      syncContacts, syncChat, closeChat, loadOlderMessages,
      syncGroups, syncCommunity, syncChannels, getUser,
      teardown,
    };
  }());


  /* ════════════════════════════════════════════════════════════════
     NETWORK OBSERVER
  ════════════════════════════════════════════════════════════════ */
  const NetworkObserver = (function () {
    let _online = navigator.onLine;

    function _onOnline() {
      _online = true;
      _log('[Network] back online — flushing retry queue');
      OptimisticQueue.retryAll();
      SubscriptionBus.notify('network', { online: true });
    }

    function _onOffline() {
      _online = false;
      _log('[Network] offline');
      SubscriptionBus.notify('network', { online: false });
    }

    function init() {
      window.addEventListener('online',  _onOnline);
      window.addEventListener('offline', _onOffline);
    }

    function isOnline() { return _online; }

    return { init, isOnline };
  }());


  /* ════════════════════════════════════════════════════════════════
     INTERNAL HELPERS
  ════════════════════════════════════════════════════════════════ */
  function _log(...args) {
    if (NeuroCore._debug) console.log('[NeuroCore]', ...args);
  }

  function _warn(...args) {
    console.warn('[NeuroCore]', ...args);
  }

  function _genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }


  /* ════════════════════════════════════════════════════════════════
     ⑩ PUBLIC API — NeuroCore
     This is the ONLY surface the UI should ever call.
  ════════════════════════════════════════════════════════════════ */
  const NeuroCore = {

    _debug:        false,
    _db:           null,
    _firebaseOps:  null,
    _currentUser:  null,
    _initialized:  false,

    /**
     * ── INIT ──────────────────────────────────────────────────────
     * Must be called ONCE after Firebase is ready and user is logged in.
     */
    init(db, firebaseOps, user) {
      if (this._initialized) {
        _warn('NeuroCore.init: already initialized — call teardown() before re-init');
        return;
      }

      if (!db)          { _warn('NeuroCore.init: db is required');         return; }
      if (!firebaseOps) { _warn('NeuroCore.init: firebaseOps is required'); return; }
      if (!user)        { _warn('NeuroCore.init: user is required');        return; }

      this._db          = db;
      this._firebaseOps = firebaseOps;
      this._currentUser = user;
      this._initialized = true;

      NetworkObserver.init();
      _log('NeuroCore initialized for user:', user.uid);

      // Auto-sync contacts and groups on init
      SyncEngine.syncContacts(user.uid, db, firebaseOps);
      SyncEngine.syncGroups(user.uid, db, firebaseOps);

      // Background maintenance (runs in idle time — no impact on startup)
      RenderScheduler.scheduleIdle(() => {
        // Evict stale rendered-math entries down to MAX_RENDER_CACHE
        IDBStore.evictMathCache(MemoryCache.MAX_RENDER_CACHE).catch(() => {});
        // Prune in-memory messages older than 7 days
        MemoryCache.pruneOldMessages(7 * 24 * 60 * 60 * 1000);
      }, 'init-maintenance');
    },

    /**
     * ── OPEN CHAT ──────────────────────────────────────────────────
     * Open a chat and subscribe to its messages.
     * Also resets VirtualWindowManager for the new chat.
     */
    openChat(chatId, isGroup, callback) {
      this._assertInit('openChat');

      // Reset virtualiser for the new chat
      VirtualWindowManager.reset();

      const unsub = SubscriptionBus.subscribe(`chat:${chatId}`, callback);

      const cached = MemoryCache.get('chats', chatId);
      if (cached && (cached.messages || []).length > 0) {
        Promise.resolve().then(() => {
          VirtualWindowManager.setMessages(cached.messages);
          callback(cached.messages);
        });
      }

      SyncEngine.syncChat(chatId, isGroup, this._currentUser.uid, this._db, this._firebaseOps);

      return unsub;
    },

    /**
     * ── CLOSE CHAT ──────────────────────────────────────────────────
     */
    closeChat(chatId) {
      SyncEngine.closeChat(chatId);
    },

    /**
     * ── SEND MESSAGE ───────────────────────────────────────────────
     * Adds msgType: 'text' for plain messages so the 48-hour cleanup
     * can target them precisely without touching cards/stickers/images.
     */
    sendMessage(chatId, isGroup, messageData) {
      this._assertInit('sendMessage');

      const { addDoc, collection, serverTimestamp } = this._firebaseOps;
      const db = this._db;

      const tempId = 'pending_' + _genId();
      const optimisticMsg = {
        id:        tempId,
        chatId,
        time:      Date.now(),
        status:    'pending',
        ...messageData,
      };

      MemoryCache.appendMessage(chatId, optimisticMsg);
      VirtualWindowManager.setMessages(
        (MemoryCache.get('chats', chatId) || { messages: [] }).messages
      );
      SubscriptionBus.notify(`chat:${chatId}`,
        (MemoryCache.get('chats', chatId) || { messages: [] }).messages
      );

      OptimisticQueue.enqueue('sendMessage', async () => {
        const collPath = isGroup
          ? `groups/${chatId}/messages`
          : `chats/${chatId}/messages`;

        const docRef = await addDoc(collection(db, collPath), {
          ...messageData,
          time:   serverTimestamp(),
          status: 'sent',
        });

        MemoryCache.removeMessage(chatId, tempId);
        const realMsg = {
          id:     docRef.id,
          chatId,
          time:   Date.now(),
          status: 'sent',
          ...messageData,
        };
        MemoryCache.appendMessage(chatId, realMsg);

        const chatData = MemoryCache.get('chats', chatId);
        if (chatData) {
          VirtualWindowManager.setMessages(chatData.messages);
          SubscriptionBus.notify(`chat:${chatId}`, chatData.messages);
        }
      });

      return tempId;
    },

    /**
     * ── LOAD OLDER MESSAGES ────────────────────────────────────────
     */
    loadOlderMessages(chatId, isGroup) {
      this._assertInit('loadOlderMessages');
      return SyncEngine.loadOlderMessages(chatId, isGroup, this._db, this._firebaseOps);
    },

    /**
     * ── SUBSCRIBE CONTACTS ──────────────────────────────────────────
     */
    subscribeContacts(callback) {
      this._assertInit('subscribeContacts');
      const unsub = SubscriptionBus.subscribe('contacts', callback);
      const cached = MemoryCache.getAll('contacts');
      if (cached.length > 0) Promise.resolve().then(() => callback(cached));
      return unsub;
    },

    /**
     * ── SUBSCRIBE GROUPS ────────────────────────────────────────────
     */
    subscribeGroups(callback) {
      this._assertInit('subscribeGroups');
      const unsub = SubscriptionBus.subscribe('groups', callback);
      const cached = MemoryCache.getAll('groups');
      if (cached.length > 0) Promise.resolve().then(() => callback(cached));
      return unsub;
    },

    /**
     * ── OPEN COMMUNITY FEED ─────────────────────────────────────────
     */
    openCommunity(callback) {
      this._assertInit('openCommunity');
      const unsub = SubscriptionBus.subscribe('community', callback);
      const cached = MemoryCache.getAll('communityPosts')
        .sort((a, b) => (b.time || 0) - (a.time || 0));
      if (cached.length > 0) Promise.resolve().then(() => callback(cached));
      SyncEngine.syncCommunity(this._db, this._firebaseOps);
      return unsub;
    },

    /**
     * ── OPEN CHANNELS ───────────────────────────────────────────────
     */
    openChannels(callback) {
      this._assertInit('openChannels');
      const unsub = SubscriptionBus.subscribe('channels', callback);
      const cached = MemoryCache.getAll('channels');
      if (cached.length > 0) Promise.resolve().then(() => callback(cached));
      SyncEngine.syncChannels(this._currentUser.uid, this._db, this._firebaseOps);
      return unsub;
    },

    /**
     * ── GET USER ────────────────────────────────────────────────────
     */
    getUser(uid) {
      this._assertInit('getUser');
      return SyncEngine.getUser(uid, this._db, this._firebaseOps);
    },

    /**
     * ── GET CACHED ──────────────────────────────────────────────────
     */
    getCached(namespace, key) {
      if (key !== undefined) return MemoryCache.get(namespace, key);
      return MemoryCache.getAll(namespace);
    },

    /**
     * ── GET MESSAGES ─────────────────────────────────────────────────
     */
    getMessages(chatId) {
      const chat = MemoryCache.get('chats', chatId);
      return chat ? (chat.messages || []) : [];
    },

    /**
     * ── SUBSCRIBE ────────────────────────────────────────────────────
     */
    subscribe(topic, callback) {
      return SubscriptionBus.subscribe(topic, callback);
    },

    /**
     * ── WRITE ────────────────────────────────────────────────────────
     */
    write(label, writeFn, optimistic) {
      this._assertInit('write');
      if (optimistic) {
        const { namespace, key, updates } = optimistic;
        MemoryCache.patch(namespace, key, updates);
        const topicMap = {
          contacts:       'contacts',
          groups:         'groups',
          communityPosts: 'community',
          channels:       'channels',
          users:          null,
        };
        const topic = topicMap[namespace];
        if (topic) {
          const data = MemoryCache.getAll(namespace);
          SubscriptionBus.notify(topic, data);
        }
      }
      return OptimisticQueue.enqueue(label, writeFn);
    },

    /**
     * ── SYNC ─────────────────────────────────────────────────────────
     */
    sync(resource) {
      this._assertInit('sync');
      const uid = this._currentUser.uid;
      const db  = this._db;
      const ops = this._firebaseOps;
      switch (resource) {
        case 'contacts':  SyncEngine.syncContacts(uid, db, ops);  break;
        case 'groups':    SyncEngine.syncGroups(uid, db, ops);    break;
        case 'community': SyncEngine.syncCommunity(db, ops);      break;
        case 'channels':  SyncEngine.syncChannels(uid, db, ops);  break;
        default: _warn('NeuroCore.sync: unknown resource', resource);
      }
    },

    retryPending()         { OptimisticQueue.retryAll(); },
    pendingCount()         { return OptimisticQueue.pendingCount(); },
    isOnline()             { return NetworkObserver.isOnline(); },
    canLoadMore(chatId)    { return PaginationEngine.canLoadMore(chatId); },

    /**
     * ── TEARDOWN ──────────────────────────────────────────────────────
     */
    teardown() {
      SyncEngine.teardown();
      this._db          = null;
      this._firebaseOps = null;
      this._currentUser = null;
      this._initialized = false;
      _log('NeuroCore: teardown complete');
    },

    /**
     * ── DEBUG ─────────────────────────────────────────────────────────
     */
    debug() {
      return {
        initialized:      this._initialized,
        online:           NetworkObserver.isOnline(),
        activeListeners:  ListenerManager.activeKeys(),
        pendingWrites:    OptimisticQueue.pendingCount(),
        subscriptionCounts: {
          contacts:  SubscriptionBus.count('contacts'),
          groups:    SubscriptionBus.count('groups'),
          community: SubscriptionBus.count('community'),
          channels:  SubscriptionBus.count('channels'),
        },
        cachedChats:    MemoryCache.getAll('chats').length,
        cachedContacts: MemoryCache.getAll('contacts').length,
        cachedGroups:   MemoryCache.getAll('groups').length,
        virtualWindow:  VirtualWindowManager.getMountedRange(),
        totalMsgHeight: VirtualWindowManager.getTotalHeight(),
      };
    },

    _assertInit(methodName) {
      if (!this._initialized) {
        _warn(`NeuroCore.${methodName}: engine not initialized — call NeuroCore.init() first`);
      }
    },
  };

  /* ════════════════════════════════════════════════════════════════
     EXPORT
  ════════════════════════════════════════════════════════════════ */
  global.NeuroCore = NeuroCore;

  // Expose sub-modules for advanced use and testing
  global.NeuroCore._modules = {
    MemoryCache,
    IDBStore,
    ListenerManager,
    SubscriptionBus,
    OptimisticQueue,
    RenderScheduler,
    PaginationEngine,
    VirtualWindowManager,
    SyncEngine,
    NetworkObserver,
  };

  _log('NeuroCore v2.0 engine loaded');

}(window));


/* ════════════════════════════════════════════════════════════════════
   INTEGRATION GUIDE v2 — HOW TO WIRE INTO chat.html
   ════════════════════════════════════════════════════════════════════

   ─────────────────────────────────────────────────────────────────
   A) SPACER DIVS  (one-time HTML change in chat.html)
   ─────────────────────────────────────────────────────────────────
   Find <div class="msgs" id="msgs"></div> and change it to:

     <div class="msgs" id="msgs">
       <div id="vwm-top-spacer" style="will-change:height;transition:none;"></div>
       <!-- messages rendered here -->
       <div id="vwm-bot-spacer" style="will-change:height;transition:none;"></div>
     </div>

   ─────────────────────────────────────────────────────────────────
   B) VIRTUALISE RENDERING  (change in listenMessages / first-load path)
   ─────────────────────────────────────────────────────────────────
   Replace the existing appendMsg loop with VirtualWindowManager:

     // 1. Register the viewport callback ONCE per chat open:
     const VWM = NeuroCore._modules.VirtualWindowManager;
     const topSp = document.getElementById('vwm-top-spacer');
     const botSp = document.getElementById('vwm-bot-spacer');

     VWM.onViewportChange(({ mounted, topH, botH }) => {
       topSp.style.height = topH + 'px';
       botSp.style.height = botH + 'px';
       // render only 'mounted' — a slice of the full message array
       renderMountedMessages(mounted, box, isGroup, otherUser);
     });

     // 2. Feed messages into VWM instead of looping appendMsg:
     VWM.setMessages(sortedMessages);

     // 3. After each appendMsg call, feed the measured height back:
     //    (put this at the END of appendMsg, after appendChild)
     VWM.measureHeight(m.id, w.offsetHeight);

     // 4. Hook scroll events (throttled by VWM internally):
     box.addEventListener('scroll', () => {
       VWM.onScroll(box.scrollTop, box.clientHeight);
     }, { passive: true });

   ─────────────────────────────────────────────────────────────────
   C) 48-HOUR AUTO-DELETE OF PLAIN TEXT MESSAGES
   ─────────────────────────────────────────────────────────────────
   Add msgType: 'text' in sendMsg() (and 'sticker' / 'image' for
   those paths).  Then call the cleanup helper on every chat open:

     // In sendMsg — inside msgData object:
     msgType: 'text',    // ← add this field

     // Cleanup helper (call at bottom of openChat):
     _cleanExpiredNormalMsgs(curChatId);

   The cleanup helper is defined in the chat-patches section.

   ─────────────────────────────────────────────────────────────────
   D) RENDER BATCHING  (already done — use the tiered scheduler)
   ─────────────────────────────────────────────────────────────────
   Use the correct tier for each class of work:

     RenderScheduler.scheduleData(key, cb, data)    // pure JS, pre-paint
     RenderScheduler.schedule(key, cb, data)         // DOM mutations, rAF
     RenderScheduler.scheduleIdle(cb, label)         // background, rIC

════════════════════════════════════════════════════════════════════ */

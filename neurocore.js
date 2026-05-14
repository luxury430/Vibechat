/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                        NEUROCORE ENGINE v1.0                               ║
 * ║                  Central Data Engine — NeuroForge Platform                 ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  ARCHITECTURE:                                                             ║
 * ║    UI Layer → NeuroCore → { Firebase | IndexedDB | MemoryCache }           ║
 * ║                                                                            ║
 * ║  MODULES:                                                                  ║
 * ║    1. MemoryCache     — RAM-speed instant reads (Map-based)                ║
 * ║    2. IDBStore        — Persistent IndexedDB offline storage               ║
 * ║    3. ListenerManager — Deduplicated Firebase onSnapshot registry          ║
 * ║    4. SubscriptionBus — UI pub/sub event system                            ║
 * ║    5. OptimisticQueue — Pending write buffer with retry                    ║
 * ║    6. RenderScheduler — Batched rAF-based update flusher                   ║
 * ║    7. PaginationEngine — Cursor-based lazy message loading                 ║
 * ║    8. SyncEngine      — Firebase ↔ Cache bidirectional sync               ║
 * ║    9. NeuroCore       — Public API surface                                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * GOLDEN RULE: UI NEVER touches Firebase directly.
 *              UI talks only to NeuroCore.
 *
 * HOW TO INTEGRATE:
 *   <script src="neurocore.js"></script>
 *   Then in chat.html, replace all direct Firebase calls with NeuroCore calls.
 *
 *   Example migration:
 *     BEFORE: onSnapshot(chatRef, snap => renderMessages(snap.docs));
 *     AFTER:  NeuroCore.openChat(chatId, messages => renderMessages(messages));
 */

'use strict';

(function (global) {

  /* ════════════════════════════════════════════════════════════════
     ① MEMORY CACHE
     Pure Map-based in-memory store. Zero latency.
     Holds: chats, contacts, channels, communityPosts, users, groups
  ════════════════════════════════════════════════════════════════ */
  const MemoryCache = (function () {
    const _store = {
      chats:          new Map(),   // chatId   → { messages: [], meta: {} }
      contacts:       new Map(),   // uid      → contactObject
      groups:         new Map(),   // groupId  → groupObject
      channels:       new Map(),   // chanId   → channelObject
      communityPosts: new Map(),   // postId   → postObject
      users:          new Map(),   // uid      → userObject
      unread:         new Map(),   // chatId   → count
      channelPosts:   new Map(),   // chanId   → [posts]
    };

    const _timestamps = new Map(); // key → lastUpdatedMs

    /**
     * Read a value from cache.
     * @param {string} namespace - One of the _store keys
     * @param {string} key
     * @returns {*} value or undefined
     */
    function get(namespace, key) {
      const ns = _store[namespace];
      if (!ns) { _warn('MemoryCache.get: unknown namespace', namespace); return undefined; }
      return ns.get(key);
    }

    /**
     * Write a value to cache and stamp a timestamp.
     */
    function set(namespace, key, value) {
      const ns = _store[namespace];
      if (!ns) { _warn('MemoryCache.set: unknown namespace', namespace); return; }
      ns.set(key, value);
      _timestamps.set(`${namespace}:${key}`, Date.now());
    }

    /**
     * Delete a single key from cache.
     */
    function del(namespace, key) {
      const ns = _store[namespace];
      if (ns) ns.delete(key);
      _timestamps.delete(`${namespace}:${key}`);
    }

    /**
     * Return all values in a namespace as an Array.
     */
    function getAll(namespace) {
      const ns = _store[namespace];
      if (!ns) return [];
      return Array.from(ns.values());
    }

    /**
     * Check how old a cached entry is (ms).
     * Returns Infinity if never cached.
     */
    function age(namespace, key) {
      const ts = _timestamps.get(`${namespace}:${key}`);
      return ts ? Date.now() - ts : Infinity;
    }

    /**
     * Check if cache entry is fresh (< maxAgeMs).
     */
    function isFresh(namespace, key, maxAgeMs) {
      return age(namespace, key) < maxAgeMs;
    }

    /**
     * Patch (merge) an existing cached object with new fields.
     * For messages: appends new messages without duplicates.
     */
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
      set('chats', chatId, { ...chat, messages: msgs });
    }

    /**
     * Remove a message from a chat's message array.
     */
    function removeMessage(chatId, msgId) {
      const chat = get('chats', chatId);
      if (!chat) return;
      chat.messages = (chat.messages || []).filter(m => m.id !== msgId);
      set('chats', chatId, chat);
    }

    /**
     * Clear an entire namespace.
     */
    function clearNamespace(namespace) {
      const ns = _store[namespace];
      if (ns) ns.clear();
    }

    return {
      get, set, del, getAll, age, isFresh, patch,
      appendMessage, removeMessage, clearNamespace,
    };
  }());


  /* ════════════════════════════════════════════════════════════════
     ② IDB STORE (IndexedDB)
     Persistent offline storage. Survives page reloads.
     Stores: messages, contacts, channels, communityPosts, groups
  ════════════════════════════════════════════════════════════════ */
  const IDBStore = (function () {
    const DB_NAME    = 'NeuroForgeDB';
    const DB_VERSION = 1;
    const STORES = [
      'messages',        // { id, chatId, ...fields }
      'contacts',        // { id, ...fields }
      'groups',          // { id, ...fields }
      'channels',        // { id, ...fields }
      'communityPosts',  // { id, ...fields }
      'users',           // { id, ...fields }
      'meta',            // arbitrary key-value pairs
    ];

    let _db = null;
    let _ready = false;
    let _readyCallbacks = [];

    /**
     * Open the IndexedDB database.
     * Resolves when the db is ready.
     * @returns {Promise<IDBDatabase>}
     */
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
          STORES.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              // All stores keyed by 'id' except meta which uses 'key'
              const keyPath = storeName === 'meta' ? 'key' : 'id';
              const store = db.createObjectStore(storeName, { keyPath });
              // Add chatId index to messages for fast per-chat queries
              if (storeName === 'messages') {
                store.createIndex('chatId', 'chatId', { unique: false });
              }
            }
          });
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

    /**
     * Internal: get the IDBDatabase, opening if needed.
     */
    function _getDB() {
      if (_ready && _db) return Promise.resolve(_db);
      return open();
    }

    /**
     * Write one record to a store.
     * The record MUST have an `id` field (or `key` for meta store).
     */
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
      })).catch(() => { /* Never throw — offline storage is best-effort */ });
    }

    /**
     * Write multiple records in a single transaction.
     */
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

    /**
     * Read one record by primary key.
     */
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

    /**
     * Read all records in a store.
     */
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

    /**
     * Read all messages for a specific chatId using the index.
     */
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
     * Delete a record by primary key.
     */
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

    /**
     * Delete all records in a store.
     */
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

    /**
     * Read a meta key-value pair.
     */
    function getMeta(key) {
      return getOne('meta', key).then(r => r ? r.value : null);
    }

    /**
     * Write a meta key-value pair.
     */
    function setMeta(key, value) {
      return put('meta', { key, value, updatedAt: Date.now() });
    }

    // Begin opening the DB eagerly on module load
    open().catch(() => {});

    return {
      open, put, putMany, getOne, getAll,
      getMessagesByChatId, del, clear,
      getMeta, setMeta,
    };
  }());


  /* ════════════════════════════════════════════════════════════════
     ③ LISTENER MANAGER
     Guarantees exactly ONE active Firebase onSnapshot per resource.
     Tracks all unsubscribe functions and cleans them up properly.
  ════════════════════════════════════════════════════════════════ */
  const ListenerManager = (function () {
    // Map of resourceKey → { unsub: Function, refCount: number, type: string }
    const _active = new Map();

    /**
     * Register a new listener.
     * If a listener already exists for the key, increments its refCount.
     * The `attachFn` is called ONLY if no listener exists yet.
     *
     * @param {string} key          - Unique resource identifier (e.g. 'chat:abc123')
     * @param {Function} attachFn   - Called with no args; must return the unsubscribe function
     * @param {string} [type]       - Label for debugging (e.g. 'messages', 'contacts')
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
     * Decrement refCount. If it reaches 0, call unsub and remove the entry.
     *
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

    /**
     * Detach ALL listeners immediately (e.g. on logout).
     */
    function detachAll() {
      _active.forEach((entry, key) => {
        try { entry.unsub(); } catch (err) { _warn(`[Listener] unsub threw for "${key}"`, err); }
      });
      _active.clear();
      _log('[Listener] all listeners destroyed');
    }

    /**
     * Check if a listener is active for a key.
     */
    function isActive(key) {
      return _active.has(key);
    }

    /**
     * Debug: return all active listener keys.
     */
    function activeKeys() {
      return Array.from(_active.keys());
    }

    return { attach, detach, detachAll, isActive, activeKeys };
  }());


  /* ════════════════════════════════════════════════════════════════
     ④ SUBSCRIPTION BUS
     UI subscribes to named topics. Engine notifies subscribers
     when data changes. Completely decoupled from Firebase.
  ════════════════════════════════════════════════════════════════ */
  const SubscriptionBus = (function () {
    // Map of topic → Set of callbacks
    const _subs = new Map();

    /**
     * Subscribe to a topic.
     * @param {string} topic   - e.g. 'chat:abc123', 'contacts', 'unread'
     * @param {Function} cb    - Called with (data) whenever topic is notified
     * @returns {Function}     - Unsubscribe function — call it to stop receiving updates
     */
    function subscribe(topic, cb) {
      if (typeof cb !== 'function') {
        _warn(`[SubscriptionBus] subscribe: cb is not a function for topic "${topic}"`);
        return () => {};
      }
      if (!_subs.has(topic)) _subs.set(topic, new Set());
      _subs.get(topic).add(cb);
      _log(`[SubscriptionBus] subscribed to "${topic}"`);
      return function unsubscribe() {
        const set = _subs.get(topic);
        if (set) {
          set.delete(cb);
          if (set.size === 0) _subs.delete(topic);
        }
      };
    }

    /**
     * Notify all subscribers of a topic with new data.
     * Errors in individual callbacks are caught so one broken subscriber
     * cannot block others.
     *
     * @param {string} topic
     * @param {*} data
     */
    function notify(topic, data) {
      const set = _subs.get(topic);
      if (!set || set.size === 0) return;
      set.forEach(cb => {
        try { cb(data); }
        catch (err) { _warn(`[SubscriptionBus] callback error on topic "${topic}"`, err); }
      });
    }

    /**
     * Remove all subscriptions for a topic.
     */
    function clear(topic) {
      _subs.delete(topic);
    }

    /**
     * Remove all subscriptions for all topics.
     */
    function clearAll() {
      _subs.clear();
    }

    /**
     * Count subscribers for a topic (for debugging).
     */
    function count(topic) {
      return _subs.has(topic) ? _subs.get(topic).size : 0;
    }

    return { subscribe, notify, clear, clearAll, count };
  }());


  /* ════════════════════════════════════════════════════════════════
     ⑤ OPTIMISTIC QUEUE
     Write-through optimistic updates with retry on failure.
     Maintains a pending queue for offline-safe operations.

     Flow:
       1. UI calls a write (sendMessage, reactPost, etc.)
       2. Engine applies change to MemoryCache immediately (optimistic)
       3. Engine notifies UI subscribers (instant feedback)
       4. Engine writes to Firebase asynchronously
       5. If Firebase write fails → entry moved to retry queue
       6. On reconnect / next tick → retry queue is flushed
  ════════════════════════════════════════════════════════════════ */
  const OptimisticQueue = (function () {
    // Array of { id, operation, args, attempts, createdAt }
    const _pending  = [];
    const _retrying = new Set(); // IDs currently being retried
    const MAX_ATTEMPTS = 5;
    const RETRY_DELAYS = [2000, 5000, 10000, 30000, 60000]; // exponential backoff ms

    let _retryTimer = null;

    /**
     * Enqueue a write operation.
     * @param {string} operation  - Human-readable label (e.g. 'sendMessage')
     * @param {Function} writeFn  - Async function that performs the Firebase write
     * @returns {string}          - Entry ID (for cancelling if needed)
     */
    function enqueue(operation, writeFn) {
      const id = _genId();
      const entry = {
        id,
        operation,
        writeFn,
        attempts:  0,
        createdAt: Date.now(),
        status:    'pending',
      };
      _pending.push(entry);
      _flush();
      return id;
    }

    /**
     * Attempt to flush pending writes.
     * Called after enqueue and after network recovery.
     */
    async function _flush() {
      const toFlush = _pending.filter(
        e => e.status === 'pending' && !_retrying.has(e.id)
      );

      for (const entry of toFlush) {
        _retrying.add(entry.id);
        entry.status = 'inflight';
        entry.attempts++;

        try {
          await entry.writeFn();
          // Success: remove from pending
          const idx = _pending.findIndex(e => e.id === entry.id);
          if (idx >= 0) _pending.splice(idx, 1);
          _retrying.delete(entry.id);
          _log(`[Queue] "${entry.operation}" succeeded (attempt ${entry.attempts})`);
        } catch (err) {
          _retrying.delete(entry.id);
          entry.status = 'pending';
          _warn(`[Queue] "${entry.operation}" failed (attempt ${entry.attempts})`, err);

          if (entry.attempts >= MAX_ATTEMPTS) {
            _warn(`[Queue] "${entry.operation}" exceeded max attempts — dropping`);
            const idx = _pending.findIndex(e => e.id === entry.id);
            if (idx >= 0) _pending.splice(idx, 1);
          } else {
            // Schedule retry with backoff
            const delay = RETRY_DELAYS[Math.min(entry.attempts - 1, RETRY_DELAYS.length - 1)];
            _log(`[Queue] "${entry.operation}" will retry in ${delay}ms`);
            if (_retryTimer) clearTimeout(_retryTimer);
            _retryTimer = setTimeout(_flush, delay);
          }
        }
      }
    }

    /**
     * Cancel a pending entry by ID.
     */
    function cancel(id) {
      const idx = _pending.findIndex(e => e.id === id);
      if (idx >= 0) _pending.splice(idx, 1);
    }

    /**
     * Force-retry all pending entries (e.g. after network reconnect).
     */
    function retryAll() {
      _pending.forEach(e => { e.status = 'pending'; });
      _flush();
    }

    /**
     * Count of pending writes (for UI indicators).
     */
    function pendingCount() {
      return _pending.length;
    }

    return { enqueue, cancel, retryAll, pendingCount };
  }());


  /* ════════════════════════════════════════════════════════════════
     ⑥ RENDER SCHEDULER
     Batches rapid successive UI update requests into a single
     requestAnimationFrame flush. Prevents:
       - Multiple re-renders per Firebase burst
       - Layout thrashing from synchronous DOM updates
       - Duplicate renders during contact list floods
  ════════════════════════════════════════════════════════════════ */
  const RenderScheduler = (function () {
    // Map of renderKey → { cb, data }
    const _pending = new Map();
    let _rafHandle = null;

    /**
     * Schedule a render callback.
     * If the same key is scheduled multiple times before the next
     * animation frame, only the LAST data wins (latest always wins).
     *
     * @param {string} key      - Unique render unit (e.g. 'contacts', 'chat:abc')
     * @param {Function} cb     - Called with (data) on the next animation frame
     * @param {*} data          - Data to pass to cb
     */
    function schedule(key, cb, data) {
      _pending.set(key, { cb, data });

      if (_rafHandle) return; // already queued
      _rafHandle = requestAnimationFrame(_flush);
    }

    /**
     * Flush all pending renders in a single animation frame.
     */
    function _flush() {
      _rafHandle = null;
      // Copy and clear before iterating — callbacks may schedule new renders
      const batch = new Map(_pending);
      _pending.clear();

      batch.forEach(({ cb, data }) => {
        try { cb(data); }
        catch (err) { _warn('[RenderScheduler] callback error', err); }
      });
    }

    /**
     * Cancel a scheduled render.
     */
    function cancel(key) {
      _pending.delete(key);
    }

    /**
     * Force an immediate flush without waiting for rAF.
     * Use only for critical synchronous scenarios.
     */
    function flush() {
      if (_rafHandle) { cancelAnimationFrame(_rafHandle); _rafHandle = null; }
      _flush();
    }

    return { schedule, cancel, flush };
  }());


  /* ════════════════════════════════════════════════════════════════
     ⑦ PAGINATION ENGINE
     Manages per-chat cursor state for scroll-up "load older" pages.
     Cursor = last loaded Firestore DocumentSnapshot.
  ════════════════════════════════════════════════════════════════ */
  const PaginationEngine = (function () {
    const PAGE_SIZE = 30;

    // Map of chatId → { cursor, loading, noMore }
    const _state = new Map();

    /**
     * Get or create pagination state for a chatId.
     */
    function _getState(chatId) {
      if (!_state.has(chatId)) {
        _state.set(chatId, { cursor: null, loading: false, noMore: false });
      }
      return _state.get(chatId);
    }

    /**
     * Reset pagination for a chatId (called when opening a new chat).
     */
    function reset(chatId) {
      _state.set(chatId, { cursor: null, loading: false, noMore: false });
    }

    /**
     * Reset all pagination state.
     */
    function resetAll() {
      _state.clear();
    }

    /**
     * Check if we can load more (not already loading, not exhausted).
     */
    function canLoadMore(chatId) {
      const s = _getState(chatId);
      return !s.loading && !s.noMore;
    }

    /**
     * Mark loading started.
     */
    function startLoad(chatId) {
      const s = _getState(chatId);
      s.loading = true;
    }

    /**
     * Mark loading finished, store cursor.
     * @param {string} chatId
     * @param {*} lastDoc   - Firestore DocumentSnapshot (cursor)
     * @param {number} count - Number of docs returned this page
     */
    function finishLoad(chatId, lastDoc, count) {
      const s = _getState(chatId);
      s.loading = false;
      s.cursor  = lastDoc;
      s.noMore  = count < PAGE_SIZE;
    }

    /**
     * Get the current cursor for a chatId.
     */
    function getCursor(chatId) {
      return _getState(chatId).cursor;
    }

    /**
     * Get loading state.
     */
    function isLoading(chatId) {
      return _getState(chatId).loading;
    }

    /**
     * Are all pages loaded?
     */
    function isExhausted(chatId) {
      return _getState(chatId).noMore;
    }

    return {
      PAGE_SIZE, reset, resetAll,
      canLoadMore, startLoad, finishLoad,
      getCursor, isLoading, isExhausted,
    };
  }());


  /* ════════════════════════════════════════════════════════════════
     ⑧ SYNC ENGINE
     Orchestrates data flow:
       Cache miss → IDB → Firebase → Cache → Notify UI
     Also handles bidirectional sync on login.
  ════════════════════════════════════════════════════════════════ */
  const SyncEngine = (function () {

    /**
     * Load contacts for the current user.
     * Priority: MemoryCache → IDB → Firebase
     *
     * @param {string} uid           - Current user's UID
     * @param {Function} db          - Firestore db instance
     * @param {object} firebaseOps   - { collection, query, onSnapshot, orderBy, where, ... }
     */
    async function syncContacts(uid, db, firebaseOps) {
      const { collection, query, where, onSnapshot } = firebaseOps;
      const cacheKey = `contacts:${uid}`;

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
        const q = query(
          contactsRef,
          where('users', 'array-contains', uid)
        );

        const unsub = onSnapshot(q, (snap) => {
          const contacts = [];
          snap.forEach(doc => {
            const c = { id: doc.id, ...doc.data() };
            contacts.push(c);
            MemoryCache.set('contacts', c.id, c);
            IDBStore.put('contacts', c).catch(() => {});
          });

          // Handle deletions
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

    /**
     * Open a direct chat or group chat and start listening to messages.
     * Priority: MemoryCache → IDB → Firebase
     *
     * @param {string} chatId         - Chat/group doc ID
     * @param {boolean} isGroup       - true if group chat
     * @param {string} currentUid     - Current user's UID
     * @param {object} db             - Firestore db instance
     * @param {object} firebaseOps    - Firestore functions
     */
    async function syncChat(chatId, isGroup, currentUid, db, firebaseOps) {
      const { collection, query, orderBy, limit, onSnapshot, startAfter } = firebaseOps;

      // ── Layer 1: Memory cache — instant serve ──
      const cached = MemoryCache.get('chats', chatId);
      if (cached && (cached.messages || []).length > 0) {
        SubscriptionBus.notify(`chat:${chatId}`, cached.messages);
        _log(`[Sync] chat ${chatId}: served ${cached.messages.length} from MemoryCache`);
      }

      // ── Layer 2: IndexedDB — fast persist ──
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

      // Reset pagination cursors for fresh open
      PaginationEngine.reset(chatId);

      ListenerManager.attach(key, () => {
        const collPath  = isGroup ? `groups/${chatId}/messages` : `chats/${chatId}/messages`;
        const msgsRef   = collection(db, collPath);
        const q = query(
          msgsRef,
          orderBy('time', 'asc'),
          limit(PaginationEngine.PAGE_SIZE)
        );

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

          RenderScheduler.schedule(`chat:${chatId}`, (msgs) => {
            SubscriptionBus.notify(`chat:${chatId}`, msgs);
          }, messages);

        }, (err) => {
          _warn(`[Sync] chat ${chatId}: listener error`, err);
        });

        return unsub;
      }, 'messages');
    }

    /**
     * Close a chat: detach its Firebase listener.
     * MemoryCache is kept so re-opening is instant.
     */
    function closeChat(chatId) {
      ListenerManager.detach(`chat:${chatId}`);
      _log(`[Sync] chat ${chatId}: listener detached`);
    }

    /**
     * Load older messages for a chat (scroll-up pagination).
     *
     * @param {string} chatId
     * @param {boolean} isGroup
     * @param {object} db
     * @param {object} firebaseOps
     * @returns {Promise<Array>} - Array of older messages prepended
     */
    async function loadOlderMessages(chatId, isGroup, db, firebaseOps) {
      if (!PaginationEngine.canLoadMore(chatId)) return [];

      const { collection, query, orderBy, limit, getDocs, startAfter } = firebaseOps;

      PaginationEngine.startLoad(chatId);
      const cursor = PaginationEngine.getCursor(chatId);

      try {
        const collPath = isGroup ? `groups/${chatId}/messages` : `chats/${chatId}/messages`;
        const msgsRef  = collection(db, collPath);

        const constraints = [
          orderBy('time', 'desc'),
          limit(PaginationEngine.PAGE_SIZE),
        ];
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

        // Reverse since we fetched desc
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

    /**
     * Sync groups list for current user.
     */
    async function syncGroups(uid, db, firebaseOps) {
      const { collection, query, where, onSnapshot } = firebaseOps;
      const key = `groups:${uid}`;
      if (ListenerManager.isActive(key)) return;

      // ── Serve from cache first ──
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

    /**
     * Sync community feed.
     */
    async function syncCommunity(db, firebaseOps, pageSize = 20) {
      const { collection, query, orderBy, limit, onSnapshot } = firebaseOps;
      const key = 'community:feed';
      if (ListenerManager.isActive(key)) return;

      // Serve from cache
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

    /**
     * Sync channels list.
     */
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

    /**
     * Get a user profile with caching.
     * Priority: MemoryCache → IDB → Firebase
     */
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

    /**
     * Full logout teardown.
     */
    function teardown() {
      ListenerManager.detachAll();
      SubscriptionBus.clearAll();
      PaginationEngine.resetAll();
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
     Detects online/offline transitions and triggers retry logic.
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
     ⑨ PUBLIC API — NeuroCore
     This is the ONLY surface the UI should ever call.
  ════════════════════════════════════════════════════════════════ */
  const NeuroCore = {

    /**
     * Enable debug logging.
     */
    _debug: false,

    /**
     * Internal references (set during init).
     */
    _db:           null,
    _firebaseOps:  null,
    _currentUser:  null,
    _initialized:  false,

    /**
     * ── INIT ──────────────────────────────────────────────────────
     * Must be called ONCE after Firebase is ready and user is logged in.
     *
     * @param {object} db              - Firestore database instance
     * @param {object} firebaseOps     - Object containing all Firestore functions:
     *                                   { collection, query, where, orderBy, limit,
     *                                     onSnapshot, getDocs, getDoc, doc, setDoc,
     *                                     addDoc, updateDoc, deleteDoc, increment,
     *                                     startAfter, serverTimestamp }
     * @param {object} user            - Firebase auth user object
     *
     * Usage in chat.html:
     *   NeuroCore.init(db, { collection, query, where, onSnapshot, ... }, auth.currentUser);
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
    },

    /**
     * ── OPEN CHAT ──────────────────────────────────────────────────
     * Open a chat and subscribe to its messages.
     * Instantly returns cached data, then syncs Firebase in background.
     *
     * @param {string}   chatId   - Chat or group document ID
     * @param {boolean}  isGroup  - true if group chat
     * @param {Function} callback - Called with (messages: Array) on every update
     * @returns {Function}        - Unsubscribe function
     *
     * Usage:
     *   const unsub = NeuroCore.openChat('chatId', false, msgs => renderMessages(msgs));
     *   // Later:
     *   unsub(); // stop receiving updates
     */
    openChat(chatId, isGroup, callback) {
      this._assertInit('openChat');

      // Subscribe UI to this chat's topic
      const unsub = SubscriptionBus.subscribe(`chat:${chatId}`, callback);

      // Serve whatever is already cached immediately (zero delay)
      const cached = MemoryCache.get('chats', chatId);
      if (cached && (cached.messages || []).length > 0) {
        // Synchronous: deliver on next tick so caller can set up before receiving
        Promise.resolve().then(() => callback(cached.messages));
      }

      // Kick off sync (non-blocking)
      SyncEngine.syncChat(
        chatId,
        isGroup,
        this._currentUser.uid,
        this._db,
        this._firebaseOps
      );

      return unsub;
    },

    /**
     * ── CLOSE CHAT ──────────────────────────────────────────────────
     * Detach the Firebase listener for a chat.
     * MemoryCache is retained for instant re-open.
     *
     * @param {string} chatId
     */
    closeChat(chatId) {
      SyncEngine.closeChat(chatId);
    },

    /**
     * ── SEND MESSAGE ───────────────────────────────────────────────
     * Optimistically adds message to cache & notifies UI immediately.
     * Writes to Firebase asynchronously with retry.
     *
     * @param {string} chatId
     * @param {boolean} isGroup
     * @param {object} messageData  - { text, senderId, senderName, ... }
     * @returns {string}            - Temporary message ID
     *
     * Usage:
     *   NeuroCore.sendMessage('chatId', false, { text: 'Hello!', senderId: uid });
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
        status:    'pending', // UI can show a clock icon
        ...messageData,
      };

      // ── Optimistic: add to cache and notify UI instantly ──
      MemoryCache.appendMessage(chatId, optimisticMsg);
      SubscriptionBus.notify(`chat:${chatId}`,
        (MemoryCache.get('chats', chatId) || { messages: [] }).messages
      );

      // ── Queue the actual Firebase write ──
      OptimisticQueue.enqueue('sendMessage', async () => {
        const collPath = isGroup
          ? `groups/${chatId}/messages`
          : `chats/${chatId}/messages`;

        const docRef = await addDoc(collection(db, collPath), {
          ...messageData,
          time:   serverTimestamp(),
          status: 'sent',
        });

        // Replace optimistic message with real one
        MemoryCache.removeMessage(chatId, tempId);
        const realMsg = {
          id:     docRef.id,
          chatId,
          time:   Date.now(),
          status: 'sent',
          ...messageData,
        };
        MemoryCache.appendMessage(chatId, realMsg);

        // Notify UI with confirmed message
        const chatData = MemoryCache.get('chats', chatId);
        if (chatData) {
          SubscriptionBus.notify(`chat:${chatId}`, chatData.messages);
        }
      });

      return tempId;
    },

    /**
     * ── LOAD OLDER MESSAGES ────────────────────────────────────────
     * Triggered by scroll-up. Fetches one page of older messages.
     *
     * @param {string} chatId
     * @param {boolean} isGroup
     * @returns {Promise<Array>} - Older messages array
     */
    loadOlderMessages(chatId, isGroup) {
      this._assertInit('loadOlderMessages');
      return SyncEngine.loadOlderMessages(
        chatId, isGroup, this._db, this._firebaseOps
      );
    },

    /**
     * ── SUBSCRIBE CONTACTS ──────────────────────────────────────────
     * Subscribe to the contacts list. Returns unsub function.
     *
     * @param {Function} callback - Called with (contacts: Array)
     * @returns {Function} unsubscribe
     */
    subscribeContacts(callback) {
      this._assertInit('subscribeContacts');
      const unsub = SubscriptionBus.subscribe('contacts', callback);

      // Serve from cache immediately
      const cached = MemoryCache.getAll('contacts');
      if (cached.length > 0) {
        Promise.resolve().then(() => callback(cached));
      }

      return unsub;
    },

    /**
     * ── SUBSCRIBE GROUPS ────────────────────────────────────────────
     * @param {Function} callback - Called with (groups: Array)
     * @returns {Function} unsubscribe
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
     * @param {Function} callback - Called with (posts: Array)
     * @returns {Function} unsubscribe
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
     * @param {Function} callback - Called with (channels: Array)
     * @returns {Function} unsubscribe
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
     * Get a user profile with 3-layer cache.
     *
     * @param {string} uid
     * @returns {Promise<object>} user object
     */
    getUser(uid) {
      this._assertInit('getUser');
      return SyncEngine.getUser(uid, this._db, this._firebaseOps);
    },

    /**
     * ── GET CACHED ──────────────────────────────────────────────────
     * Direct synchronous cache read. No Firebase fallback.
     *
     * @param {string} namespace   - 'chats' | 'contacts' | 'groups' | 'users' | etc.
     * @param {string} [key]       - Specific key, or omit to get all
     * @returns {*}
     */
    getCached(namespace, key) {
      if (key !== undefined) return MemoryCache.get(namespace, key);
      return MemoryCache.getAll(namespace);
    },

    /**
     * ── GET MESSAGES ─────────────────────────────────────────────────
     * Synchronous: returns currently cached messages for a chat.
     *
     * @param {string} chatId
     * @returns {Array}
     */
    getMessages(chatId) {
      const chat = MemoryCache.get('chats', chatId);
      return chat ? (chat.messages || []) : [];
    },

    /**
     * ── SUBSCRIBE ────────────────────────────────────────────────────
     * Generic subscription to any NeuroCore topic.
     * Topics: 'contacts', 'groups', 'community', 'channels',
     *         'network', `chat:${id}`
     *
     * @param {string} topic
     * @param {Function} callback
     * @returns {Function} unsubscribe
     */
    subscribe(topic, callback) {
      return SubscriptionBus.subscribe(topic, callback);
    },

    /**
     * ── WRITE ────────────────────────────────────────────────────────
     * Generic optimistic write with retry.
     * Use for: reactions, post likes, profile updates, etc.
     *
     * @param {string} label       - Descriptive label for debugging
     * @param {Function} writeFn   - Async function that performs the Firebase write
     * @param {object} [optimistic] - { namespace, key, updates } — applied to cache before write
     * @returns {string}           - Queue entry ID
     *
     * Usage:
     *   NeuroCore.write('reactPost', async () => {
     *     await setDoc(doc(db, 'community', postId), { likes: increment(1) }, { merge: true });
     *   }, { namespace: 'communityPosts', key: postId, updates: { likes: currentLikes + 1 } });
     */
    write(label, writeFn, optimistic) {
      this._assertInit('write');

      // Apply optimistic update immediately
      if (optimistic) {
        const { namespace, key, updates } = optimistic;
        MemoryCache.patch(namespace, key, updates);
        // Notify relevant subscribers
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
     * Force-refresh a resource from Firebase.
     *
     * @param {string} resource  - 'contacts' | 'groups' | 'community' | 'channels'
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

    /**
     * ── RETRY PENDING ─────────────────────────────────────────────────
     * Force retry all failed writes. Call this after network recovery.
     */
    retryPending() {
      OptimisticQueue.retryAll();
    },

    /**
     * ── PENDING COUNT ─────────────────────────────────────────────────
     * How many writes are waiting to be confirmed?
     *
     * @returns {number}
     */
    pendingCount() {
      return OptimisticQueue.pendingCount();
    },

    /**
     * ── IS ONLINE ─────────────────────────────────────────────────────
     * @returns {boolean}
     */
    isOnline() {
      return NetworkObserver.isOnline();
    },

    /**
     * ── CAN LOAD MORE ─────────────────────────────────────────────────
     * @param {string} chatId
     * @returns {boolean}
     */
    canLoadMore(chatId) {
      return PaginationEngine.canLoadMore(chatId);
    },

    /**
     * ── TEARDOWN ──────────────────────────────────────────────────────
     * Full reset: detach all listeners, clear all caches.
     * Call this on logout.
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
     * Returns internal diagnostic info.
     */
    debug() {
      return {
        initialized:    this._initialized,
        online:         NetworkObserver.isOnline(),
        activeListeners: ListenerManager.activeKeys(),
        pendingWrites:  OptimisticQueue.pendingCount(),
        subscriptionCounts: {
          contacts:  SubscriptionBus.count('contacts'),
          groups:    SubscriptionBus.count('groups'),
          community: SubscriptionBus.count('community'),
          channels:  SubscriptionBus.count('channels'),
        },
        cachedChats:    MemoryCache.getAll('chats').length,
        cachedContacts: MemoryCache.getAll('contacts').length,
        cachedGroups:   MemoryCache.getAll('groups').length,
      };
    },

    /**
     * Internal: assert the engine is initialized before a call.
     */
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

  // Also expose sub-modules for advanced use and testing
  global.NeuroCore._modules = {
    MemoryCache,
    IDBStore,
    ListenerManager,
    SubscriptionBus,
    OptimisticQueue,
    RenderScheduler,
    PaginationEngine,
    SyncEngine,
    NetworkObserver,
  };

  _log('NeuroCore engine loaded');

}(window));


/* ════════════════════════════════════════════════════════════════════
   INTEGRATION GUIDE — HOW TO WIRE INTO chat.html
   ════════════════════════════════════════════════════════════════════

   ① Add this script tag BEFORE your main chat.html <script> block:
       <script src="neurocore.js"></script>

   ② After Firebase is initialized and user is signed in, call:

       // Pass in the Firestore db + all Firestore function imports
       NeuroCore.init(db, {
         collection, query, where, orderBy, limit,
         onSnapshot, getDocs, getDoc, doc,
         setDoc, addDoc, updateDoc, deleteDoc,
         increment, startAfter, serverTimestamp
       }, auth.currentUser);

   ③ Replace scattered Firebase listeners with NeuroCore subscriptions:

       // BEFORE (in chat.html):
       onSnapshot(chatRef, snap => renderMessages(snap.docs));

       // AFTER:
       const unsub = NeuroCore.openChat(chatId, false, messages => {
         renderMessages(messages);
       });
       // When closing chat: unsub();

   ④ Replace direct Firebase writes with NeuroCore.write():

       // BEFORE:
       await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);

       // AFTER:
       NeuroCore.sendMessage(chatId, false, msgData);

   ⑤ Replace contact list Firebase listeners:

       // BEFORE:
       onSnapshot(contactsQuery, snap => renderContacts(snap.docs));

       // AFTER:
       const unsubContacts = NeuroCore.subscribeContacts(contacts => {
         renderContacts(contacts);
       });

   ⑥ On logout, call:
       NeuroCore.teardown();

   ⑦ Enable debug logging during development:
       NeuroCore._debug = true;
       console.log(NeuroCore.debug()); // See all active listeners + cache stats
════════════════════════════════════════════════════════════════════ */

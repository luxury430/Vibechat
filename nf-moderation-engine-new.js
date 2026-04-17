/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║          NEUROFORGE — ADVANCED MODERATION ENGINE  v4.0                   ║
 * ║          File: nf-moderation-engine.js                                   ║
 * ║                                                                          ║
 * ║  PIPELINE (every action):                                                ║
 * ║  Detect → Analyze → Score → Classify → Rule → Action → Cooldown → Heal  ║
 * ║                                                                          ║
 * ║  v4.0 NEW FEATURES:                                                      ║
 * ║  §A  AI Toxicity Detection   — TF.js Toxicity model (client-side)        ║
 * ║  §A  Semantic Similarity     — Universal Sentence Encoder embeddings     ║
 * ║  §B  Trust Multiplier        — Account age, titles, achievements          ║
 * ║  §B  New Account Sandbox     — Stricter rules for accounts < 24 h        ║
 * ║  §C  Shadowbanning           — Hellban (invisible to others, not told)   ║
 * ║  §D  Media Moderation        — pHash image dedup + Cloud Vision NSFW     ║
 * ║  §E  Zalgo Filter            — Detects diacritic-overloaded text         ║
 * ║  §E  Homograph Detection     — IDN/Punycode Unicode spoofing in URLs     ║
 * ║  §E  Domain Blacklist        — Known phishing/scam domain registry       ║
 * ║  §F  Cloud Function Bridge   — Hybrid client + server enforcement        ║
 * ║                                                                          ║
 * ║  v3.0 FEATURES (retained):                                               ║
 * ║  • 12-layer detection: burst, repeat, near-duplicate, fast-type,        ║
 * ║    caps-lock, entropy (keyboard mash), emoji flood, URL flood,           ║
 * ║    unicode spam, session velocity, content flags, behavioral memory      ║
 * ║  • Levenshtein near-duplicate detection                                  ║
 * ║  • Shannon entropy analysis (random character detection)                 ║
 * ║  • Behavioral fingerprinting + risk levels (low/med/high/extreme)        ║
 * ║  • Adaptive score multipliers (repeat offenders score faster)            ║
 * ║  • Adaptive mute duration (longer for repeat offenders)                  ║
 * ║  • Graduated ladder: warn1 → warn2 → warn3 → mute → ban                ║
 * ║  • Score decay (fast during quiet, slow during active)                   ║
 * ║  • Warning amnesty after 12 min good behaviour                           ║
 * ║  • Firestore mirror (ban syncs to ME + Firestore)                        ║
 * ║  • Admin bypass (isAdmin() checked before every action)                  ║
 * ║  • Keyboard capture-phase guard (blocks Enter on muted inputs)           ║
 * ║  • Human-toned rotating message banks (no robotic output)                ║
 * ║  • New user greeting (fires once per UID)                                ║
 * ║  • Full DevTools API                                                     ║
 * ║                                                                          ║
 * ║  INTEGRATION — add before </body> after all other scripts:               ║
 * ║    <script src="nf-moderation-engine.js"></script>                       ║
 * ║                                                                          ║
 * ║  REQUIRED ENV VARIABLE (set before script loads):                        ║
 * ║    window.NF_CLOUD_FN_URL = "https://YOUR_REGION-YOUR_PROJECT            ║
 * ║                              .cloudfunctions.net";                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   §0  CONFIGURATION — All thresholds in one place
═══════════════════════════════════════════════════════════════════ */
const MOD_CFG = Object.freeze({
  // ── Burst Detection ──────────────────────────────────────────
  BURST_WINDOW_MS:           5_000,
  BURST_WARN_THRESHOLD:      6,
  BURST_BAN_THRESHOLD:       10,

  // ── Repeat / Near-Duplicate ───────────────────────────────────
  REPEAT_THRESHOLD:          3,
  SIMILAR_RATIO:             0.82,   // Levenshtein ratio for near-dupes

  // ── Fast Typing ───────────────────────────────────────────────
  FAST_TYPE_MS:              500,
  FAST_TYPE_STRIKE:          4,
  FAST_TYPE_MIN_LEN:         2,      // Skip check for very short msgs

  // ── Content Heuristics ────────────────────────────────────────
  CAPS_RATIO:                0.75,
  CAPS_MIN_LEN:              8,
  ENTROPY_THRESHOLD:         4.2,    // Shannon entropy (keyboard mash)
  EMOJI_SPAM_N:              8,
  URL_SPAM_N:                3,
  UNICODE_RUN_N:             6,

  // ── Score Weights (v3.0) ──────────────────────────────────────
  W_FAST_MSG:                5,
  W_BURST:                   20,
  W_REPEAT:                  15,
  W_NEAR_DUP:                10,
  W_FAST_TYPE:               10,
  W_CAPS:                    8,
  W_ENTROPY:                 12,
  W_EMOJI:                   6,
  W_URL:                     14,
  W_UNICODE:                 9,

  // ── Score Thresholds ──────────────────────────────────────────
  MUTE_THRESHOLD:            40,
  BAN_THRESHOLD:             70,

  // ── Score Decay ───────────────────────────────────────────────
  DECAY_INTERVAL_MS:         4_000,
  DECAY_SLOW:                1,
  DECAY_FAST:                3,      // Used when user has been quiet >30 s
  QUIET_MS:                  30_000,

  // ── Punishment Durations ──────────────────────────────────────
  MUTE_MS:                   7  * 60_000,
  MUTE_REPEAT_MS:            15 * 60_000,
  BAN_MS:                    24 * 60 * 60_000,

  // ── Warning System ────────────────────────────────────────────
  WARN_MUTE_AT:              3,
  WARN_RESET_MS:             12 * 60_000,

  // ── Cooldowns ─────────────────────────────────────────────────
  SYS_COOLDOWN_MS:           10_000,
  CLEANUP_MS:                6_000,

  // ══════════════════════════════════════════════════════════════
  //  v4.0 NEW CONFIG KEYS
  // ══════════════════════════════════════════════════════════════

  // ── §A  AI Engine ─────────────────────────────────────────────
  AI_TOXICITY_THRESHOLD:     0.75,   // Confidence above which we flag toxicity
  AI_SEMANTIC_THRESHOLD:     0.88,   // Cosine similarity for semantic near-dupe
  W_AI_TOXIC:                35,     // Score added for confirmed AI toxicity
  W_AI_SEMANTIC_DUP:         12,     // Score added for semantic near-dupe
  AI_RETROACTIVE_DELETE:     true,   // Attempt to delete msg from Firestore if toxic

  // ── §B  Trust + Sandbox ───────────────────────────────────────
  SANDBOX_AGE_MS:            24 * 60 * 60_000, // < 24 h = new account
  SANDBOX_BURST_DIVISOR:     2,      // Halves BURST_BAN_THRESHOLD for new accts
  TRUST_VETERAN_DECAY_BONUS: 2,      // Extra decay points/tick for veterans

  // ── §C  Shadowban ─────────────────────────────────────────────
  SHADOWBAN_AT_RISK:         'extreme', // Risk level that triggers shadowban

  // ── §D  Media Moderation ──────────────────────────────────────
  IMG_HASH_WINDOW_MS:        60_000, // Duplicate image detection window
  IMG_HASH_HAMMING:          8,      // Max Hamming distance = duplicate
  IMG_SPAM_THRESHOLD:        3,      // # dupe images before score penalty
  W_IMG_SPAM:                14,     // Score weight for image spam
  NSFW_CLOUD_ROUTE:          '/moderateImage', // Appended to NF_CLOUD_FN_URL

  // ── §E  Phishing / Zalgo / Homograph ─────────────────────────
  ZALGO_MIN_MARKS:           4,      // Combining chars before flagging
  W_ZALGO:                   20,
  W_HOMOGRAPH:               25,
  W_PHISHING_DOMAIN:         30,

  // ── §F  Cloud Function Bridge ─────────────────────────────────
  CF_REPORT_ROUTE:           '/reportMessage', // Appended to NF_CLOUD_FN_URL
  CF_TIMEOUT_MS:             5_000,  // Abort cloud report after this

  // ── Debug ─────────────────────────────────────────────────────
  DEBUG: false,
});

/* ═══════════════════════════════════════════════════════════════════
   §1  UTILITIES
═══════════════════════════════════════════════════════════════════ */
const _now  = Date.now.bind(Date);
const _log  = (...a) => MOD_CFG.DEBUG && console.log('[MOD]', ...a);
const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
const _uid  = () => { try { return window.currentUser?.uid || 'anon'; } catch { return 'anon'; } };

/* ── Levenshtein similarity (0–1) ── */
function _sim(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) / Math.max(la, lb) > 0.5) return 0;
  const dp = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= la; i++)
    for (let j = 1; j <= lb; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return 1 - dp[la][lb] / Math.max(la, lb);
}

/* ── Shannon entropy ── */
function _entropy(str) {
  if (!str || str.length < 4) return 0;
  const freq = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  return Object.values(freq).reduce((e, f) => { const p = f / str.length; return e - p * Math.log2(p); }, 0);
}

/* ── Emoji count ── */
function _emojiCount(s) { return (s.match(/\p{Emoji_Presentation}/gu) || []).length; }

/* ── URL count ── */
function _urlCount(s) { return (s.match(/https?:\/\/\S+|www\.\S+/gi) || []).length; }

/* ── Caps ratio ── */
function _capsRatio(s) {
  const letters = s.replace(/[^a-zA-Z]/g, '');
  return letters.length ? s.replace(/[^A-Z]/g, '').length / letters.length : 0;
}

/* ── Max unicode (non-latin) run ── */
function _uniRun(s) {
  let max = 0, cur = 0;
  for (const c of s) {
    if (c.charCodeAt(0) > 127 && !/\p{Emoji_Presentation}/u.test(c)) { max = Math.max(max, ++cur); }
    else cur = 0;
  }
  return max;
}

/* ── Dynamic script loader (used by §A AI engine) ── */
function _loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`[MOD] Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

/* ── Cosine similarity for embedding vectors ── */
function _cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i]; }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/* ═══════════════════════════════════════════════════════════════════
   §2  PERSISTENT STATE STORE
═══════════════════════════════════════════════════════════════════ */
const _SK = () => `nf_mod4_${_uid()}`;
const _FK = () => `nf_mod4_fp_${_uid()}`;

const _DS = () => ({
  spamScore: 0, warnings: 0, lastWarningAt: 0,
  mutedUntil: 0, bannedUntil: 0,
  greeted: false, muteCount: 0,
  lastMsgText: '', lastMsgAt: 0,
  repeatStreak: 0, fastTypeCount: 0, sessionMsgs: 0,
  // v4.0
  shadowbanned: false,
  imgSpamCount: 0,
  aiToxicStrikes: 0,
});
const _DF = () => ({
  totalBans: 0, totalMutes: 0, totalWarnings: 0,
  firstSeen: _now(), lastSeen: _now(), riskLevel: 'low',
  // v4.0
  nsfwViolations: 0,
  totalShadowbans: 0,
});

let _S = _DS(), _F = _DF();

const _save  = () => { try { localStorage.setItem(_SK(), JSON.stringify(_S)); } catch {} };
const _saveF = () => { _F.lastSeen = _now(); try { localStorage.setItem(_FK(), JSON.stringify(_F)); } catch {} };

function _loadState() {
  try { const r = localStorage.getItem(_SK()); if (r) _S = { ..._DS(), ...JSON.parse(r) }; } catch { _S = _DS(); }
  try { const r = localStorage.getItem(_FK()); if (r) _F = { ..._DF(), ...JSON.parse(r) }; } catch { _F = _DF(); }
}

/* ── Risk level ── */
function _updateRisk() {
  const { totalBans: B, totalMutes: M, totalWarnings: W } = _F;
  _F.riskLevel = B >= 2 || M >= 5 ? 'extreme' : B >= 1 || M >= 3 ? 'high' : M >= 1 || W >= 4 ? 'medium' : 'low';
  _saveF();
}

const _RISK_MULTI = { low: 1.0, medium: 1.25, high: 1.6, extreme: 2.0 };
const _riskMul    = () => _RISK_MULTI[_F.riskLevel] || 1.0;
const _muteDur    = () => _S.muteCount >= 2 ? MOD_CFG.MUTE_REPEAT_MS : MOD_CFG.MUTE_MS;

/* ═══════════════════════════════════════════════════════════════════
   §3  BURST DETECTION (timestamp ring-buffer)
═══════════════════════════════════════════════════════════════════ */
const _ts = [];
const _recordTS = () => _ts.push(_now());
const _pruneTS  = () => { const c = _now() - MOD_CFG.BURST_WINDOW_MS; while (_ts.length && _ts[0] < c) _ts.shift(); };
const _burst    = () => { _pruneTS(); return _ts.length; };

/* ═══════════════════════════════════════════════════════════════════
   §4  SYSTEM MESSAGE COOLDOWN
═══════════════════════════════════════════════════════════════════ */
const _cooldowns = {};
function _canSys(k) {
  const n = _now();
  if (!_cooldowns[k] || n - _cooldowns[k] > MOD_CFG.SYS_COOLDOWN_MS) { _cooldowns[k] = n; return true; }
  return false;
}

/* ═══════════════════════════════════════════════════════════════════
   §5  HUMAN-TONED MESSAGE BANKS
═══════════════════════════════════════════════════════════════════ */
const M = {
  warn1: [
    '⚠️ Whoa, slow down! You\'re sending messages super fast. Give people a chance to read! 😊',
    '⚠️ Hey! You\'re on a roll — maybe pace it a bit? The chat will still be here! 🙏',
    '⚠️ Just a heads-up — you\'re firing off messages really quickly. Slow it down a little!',
    '⚠️ Easy there! Take a breath between messages. Everyone\'s reading what you write! 😄',
  ],
  warn2: [
    '⚠️ Final warning! One more burst like that and you\'ll be muted for a few minutes. You got this! 💪',
    '⚠️ Last chance — keep it up and you\'ll be muted. We know you can pace yourself! 😉',
    '⚠️ This is your last warning before a temporary mute. Take it easy and you\'re golden! 🙌',
  ],
  warn3: [
    '⚠️ You\'re really pushing it now! Next step is a mute — let\'s avoid that. Be cool! 😎',
  ],
  muted: [
    '🔇 You\'ve been muted for a bit — too many messages too fast. Chill, read the chat, you\'ll be back soon! 😌',
    '🔇 Muted for a few minutes. Short break — grab some water and come back refreshed! 💧',
    '🔇 Slow down, champ! Muted temporarily. Use the time to catch up on what others said! 📖',
    '🔇 Too fast! You\'re muted for a short while. No worries — it lifts automatically! ⏱️',
  ],
  mutedRepeat: [
    '🔇 Muted again — and a bit longer this time. Let\'s really take a break, yeah? 😅',
    '🔇 Another mute, extended duration. We\'re not trying to be harsh — just keep it chill! 🙏',
  ],
  unmuted: [
    '✅ You\'re back! Welcome — let\'s keep it chill this time! 😄',
    '✅ Mute lifted! Good to have you back. Easy does it from here! 🤙',
    '✅ You\'re unmuted! Quality over quantity — chat away! 🎉',
  ],
  banned: [
    '🚫 You\'ve been banned for 24 hours due to repeated spamming. Come back tomorrow — we\'ll be here! 🙏',
    '🚫 24-hour ban applied. Take a rest and come back fresh. We appreciate everyone who keeps chat healthy! 😌',
    '🚫 Banned for a day. We hate doing this but it keeps the chat good for everyone. See you tomorrow! ✌️',
  ],
  unbanned: [
    '✅ Your ban has expired! Welcome back — let\'s start fresh. Keep it cool and you\'re golden! 😊',
    '✅ Ban lifted! A new day, a new start. We\'re glad you\'re back! 🎉',
  ],
  greeting: [
    '👋 Welcome to NeuroForge! Great to have you. Jump in, say hi, and enjoy the chat! 🚀',
    '👋 Hey, welcome! We\'re a friendly bunch here — feel free to chat away! 😄',
    '🎉 Welcome to the community! Introduce yourself anytime. Glad you joined! ✨',
  ],
  capsWarn:     ['📢 Ease up on the caps! Normal text is fine — everyone can hear you! 😊'],
  repeatWarn:   ['🔁 Looks like you\'re sending the same thing a lot. You\'ve been heard! 👍'],
  entropyWarn:  ['🤔 That message looks like random characters. Keep it readable and we\'re all good! 😊'],
  urlWarn:      ['🔗 Whoa, lots of links! Share one at a time and keep it relevant. 😊'],
  emojiWarn:    ['😂 Love the energy, but that\'s a LOT of emojis! Mix in some words too. 😄'],
  blockMuted:   ['🔇 You\'re still muted. Hang tight — it lifts automatically! ⏱️'],
  blockBanned:  ['🚫 You\'re banned and can\'t send messages right now.'],
  // v4.0 additions
  toxicWarn:    [
    '🛑 That message contains content that violates our community guidelines. Please keep it respectful.',
    '🛑 Our system flagged that message. Remember: real people are reading this chat.',
    '⚠️ Heads up — that content wasn\'t okay. Let\'s keep things positive here. 🙏',
  ],
  zalgoWarn:    ['🔡 Corrupted or zalgo-style text isn\'t allowed here — it breaks the chat layout for everyone!'],
  homographWarn:['🔗 That link contains suspicious characters that could be a phishing attempt. Blocked for safety.'],
  phishingWarn: ['🎣 That domain is on our phishing blocklist. Sharing known scam links will get you banned fast.'],
  sandboxWarn:  ['🆕 New accounts can\'t share links yet. Spend some time chatting first and earn that trust! 😊'],
  imgSpamWarn:  ['🖼️ You\'re uploading the same image repeatedly. Mix it up!'],
  nsfwWarn:     ['🔞 That image was flagged as inappropriate and has been blocked. Please keep media family-friendly.'],
  semanticWarn: ['🔁 That message has essentially the same meaning as your last one. No need to repeat yourself! 😄'],
};

/* ═══════════════════════════════════════════════════════════════════
   §6  UI HELPERS
═══════════════════════════════════════════════════════════════════ */
function _toast(msg) {
  if (typeof window.toast === 'function') { window.toast(msg); return; }
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:92px;left:50%;transform:translateX(-50%) translateY(10px);
    background:#12122a;color:#eaeaf8;padding:12px 22px;border-radius:16px;font-size:.84rem;
    font-family:'Plus Jakarta Sans',sans-serif;z-index:99999;max-width:90vw;text-align:center;
    border:1px solid rgba(139,92,246,.35);box-shadow:0 8px 32px rgba(0,0,0,.6);
    opacity:0;transition:opacity .22s ease,transform .22s ease;`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(0)'; });
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(8px)'; setTimeout(() => el.remove(), 300); }, 4500);
}

function _banner(id, text, color, ttl = 0) {
  _rmBanner(id);
  const root = document.getElementById('inpArea') || document.querySelector('.inp-area');
  if (!root) return;
  const el = document.createElement('div');
  el.id = id;
  el.style.cssText = `padding:10px 16px;background:rgba(9,9,26,.96);border-top:2px solid ${color};
    color:#eaeaf8;font-size:.79rem;font-family:'Plus Jakarta Sans',sans-serif;text-align:center;
    letter-spacing:.01em;line-height:1.55;backdrop-filter:blur(10px);
    animation:_modSlide .25s ease both;`;
  el.textContent = text;
  root.prepend(el);
  if (ttl > 0) setTimeout(() => _rmBanner(id), ttl);
}
const _rmBanner = id => document.getElementById(id)?.remove();

function _flashInput(sel) {
  const el = document.querySelector(sel);
  if (!el) return;
  el.style.transition = 'box-shadow .18s ease';
  el.style.boxShadow  = '0 0 0 2px #ef4444';
  setTimeout(() => { el.style.boxShadow = ''; }, 650);
}

function _setInputsOff(off) {
  [['#msgInp','.send-btn'], ['#chanInpArea','.chan-send-btn'], ['#postTextarea','.post-btn']].forEach(([i, b]) => {
    const ie = document.querySelector(i);
    if (ie) { ie.disabled = off; ie.readOnly = off; ie.style.opacity = off ? '.4' : ''; ie.style.cursor = off ? 'not-allowed' : ''; }
    const be = document.querySelector(b);
    if (be) { be.disabled = off; be.style.opacity = off ? '.4' : ''; be.style.pointerEvents = off ? 'none' : ''; }
  });
}

/* ═══════════════════════════════════════════════════════════════════
   §7  STATUS CHECKS
═══════════════════════════════════════════════════════════════════ */
function _isMuted() {
  if (!_S.mutedUntil) return false;
  if (_S.mutedUntil > _now()) return true;
  _liftMute(true); return false;
}
function _isBanned() {
  if (!_S.bannedUntil) return false;
  if (_S.bannedUntil > _now()) return true;
  _liftBan(true); return false;
}
/* v4.0 — Shadowban check (state-local; Firestore is source of truth for others) */
const _isShadowbanned = () => !!_S.shadowbanned;

/* ═══════════════════════════════════════════════════════════════════
   §8  PUNISHMENT ACTIONS
═══════════════════════════════════════════════════════════════════ */
function _doWarn(reason) {
  _S.warnings++; _S.lastWarningAt = _now(); _F.totalWarnings++;
  _updateRisk(); _save(); _saveF();
  const msg = _S.warnings === 1 ? _pick(M.warn1) : _S.warnings === 2 ? _pick(M.warn2) : _pick(M.warn3);
  if (_canSys('warn_' + _S.warnings)) { _toast(msg); _banner('mod-warn-banner', msg, '#f59e0b', 7000); }
  _log(`Warn #${_S.warnings} | ${reason} | score:${_S.spamScore}`);
  if (_S.warnings >= MOD_CFG.WARN_MUTE_AT) _doMute('Warning limit reached');
}

function _doMute(reason) {
  const dur = _muteDur();
  _S.mutedUntil = _now() + dur; _S.muteCount++; _S.warnings = 0; _S.spamScore = 0;
  _F.totalMutes++; _updateRisk(); _save(); _saveF();
  const mins = Math.ceil(dur / 60_000);
  const msg  = _S.muteCount > 1 ? _pick(M.mutedRepeat) : _pick(M.muted);
  const full = `${msg} (${mins} min)`;
  _toast(full); _banner('mod-mute-banner', full, '#f59e0b', dur); _setInputsOff(true);
  setTimeout(() => { if (!_isMuted()) _liftMute(); }, dur + 200);
  _log(`Muted #${_S.muteCount} until ${new Date(_S.mutedUntil).toLocaleTimeString()} | ${reason}`);
}

function _liftMute(silent = false) {
  _S.mutedUntil = 0; _save(); _rmBanner('mod-mute-banner'); _setInputsOff(false);
  if (!silent && _canSys('lift_mute')) _toast(_pick(M.unmuted));
}

function _doBan(reason) {
  _S.bannedUntil = _now() + MOD_CFG.BAN_MS; _S.mutedUntil = 0; _S.spamScore = 0; _S.warnings = 0;
  _F.totalBans++; _updateRisk(); _save(); _saveF();
  _syncBan(_S.bannedUntil);
  const h = Math.ceil(MOD_CFG.BAN_MS / 3_600_000);
  const msg = _pick(M.banned);
  _toast(msg); _banner('mod-ban-banner', `${msg} (${h}h)`, '#ef4444', 0); _setInputsOff(true);
  setTimeout(() => { if (!_isBanned()) _liftBan(); }, MOD_CFG.BAN_MS + 200);
  _log(`Banned until ${new Date(_S.bannedUntil).toLocaleString()} | ${reason}`);
}

function _liftBan(silent = false) {
  _S.bannedUntil = 0; _save(); _syncBan(0); _rmBanner('mod-ban-banner'); _setInputsOff(false);
  if (!silent && _canSys('lift_ban')) _toast(_pick(M.unbanned));
}

function _syncBan(until) {
  try {
    if (!window.ME || !window.currentUser) return;
    window.ME.bannedUntil = until;
    const { setDoc, doc } = window._firebaseModExports || {};
    if (setDoc && doc && window.db) {
      setDoc(doc(window.db, 'users', window.currentUser.uid), { bannedUntil: until }, { merge: true }).catch(() => {});
    }
  } catch {}
}

/* ═══════════════════════════════════════════════════════════════════
   §9  CONTENT ANALYSIS  (12-layer heuristics + v4.0 checks)
═══════════════════════════════════════════════════════════════════ */
function _analyzeContent(text) {
  let score = 0;
  if (!text || text.length < 1) return score;

  if (text.length >= MOD_CFG.CAPS_MIN_LEN && _capsRatio(text) >= MOD_CFG.CAPS_RATIO) {
    score += MOD_CFG.W_CAPS;
    if (_canSys('caps')) _toast(_pick(M.capsWarn));
  }
  if (_entropy(text.replace(/\s/g, '')) > MOD_CFG.ENTROPY_THRESHOLD && text.length > 10) {
    score += MOD_CFG.W_ENTROPY;
    if (_canSys('entropy')) _toast(_pick(M.entropyWarn));
  }
  if (_emojiCount(text) > MOD_CFG.EMOJI_SPAM_N) {
    score += MOD_CFG.W_EMOJI;
    if (_canSys('emoji')) _toast(_pick(M.emojiWarn));
  }
  if (_urlCount(text) > MOD_CFG.URL_SPAM_N) {
    score += MOD_CFG.W_URL;
    if (_canSys('url')) _toast(_pick(M.urlWarn));
  }
  if (_uniRun(text) > MOD_CFG.UNICODE_RUN_N) {
    score += MOD_CFG.W_UNICODE;
  }

  // v4.0 §E checks (synchronous)
  const zalgoResult = _detectZalgo(text);
  if (zalgoResult) {
    score += MOD_CFG.W_ZALGO;
    if (_canSys('zalgo')) _toast(_pick(M.zalgoWarn));
    _log('Zalgo detected');
  }

  const homographResult = _detectHomograph(text);
  if (homographResult) {
    score += MOD_CFG.W_HOMOGRAPH;
    if (_canSys('homograph')) _toast(_pick(M.homographWarn));
    _log('Homograph attack detected');
  }

  const phishResult = _detectPhishingDomain(text);
  if (phishResult) {
    score += MOD_CFG.W_PHISHING_DOMAIN;
    if (_canSys('phish')) _toast(_pick(M.phishingWarn));
    _log(`Phishing domain detected: ${phishResult}`);
  }

  // §B New-account sandbox: block all links
  if (_isNewAccount() && _urlCount(text) > 0) {
    score += MOD_CFG.BAN_THRESHOLD; // Immediately push to ban threshold
    if (_canSys('sandbox_url')) _toast(_pick(M.sandboxWarn));
    _log('Sandbox: new account attempted to share a link');
  }

  return score;
}

/* ═══════════════════════════════════════════════════════════════════
   §10  CORE MODERATION PIPELINE
   Returns { allowed: boolean, reason: string|null }
═══════════════════════════════════════════════════════════════════ */
function _pipeline(text) {
  // Admin bypass
  try { if (typeof window.isAdmin === 'function' && window.isAdmin()) return { allowed: true, reason: null }; } catch {}

  // Pre-flight: already punished
  if (_isBanned()) {
    const h = Math.ceil((_S.bannedUntil - _now()) / 3_600_000);
    if (_canSys('ban_block')) _toast(_pick(M.blockBanned) + ` ${h}h remaining.`);
    return { allowed: false, reason: 'banned' };
  }
  if (_isMuted()) {
    const m = Math.ceil((_S.mutedUntil - _now()) / 60_000);
    if (_canSys('mute_block')) _toast(_pick(M.blockMuted) + ` ${m} min left.`);
    return { allowed: false, reason: 'muted' };
  }

  // §C Shadowban: silently allow (they think it worked; others won't see it)
  if (_isShadowbanned()) {
    _recordTS(); _S.sessionMsgs++; _S.lastMsgAt = _now(); _save();
    _log('Shadowbanned user sent message — silently passed client-side.');
    return { allowed: true, reason: 'shadowbanned' };
  }

  // Record timestamp
  _recordTS();
  _S.sessionMsgs++;

  // §B Effective burst threshold (halved for sandbox accounts)
  const effectiveBurstBan = _isNewAccount()
    ? Math.ceil(MOD_CFG.BURST_BAN_THRESHOLD / MOD_CFG.SANDBOX_BURST_DIVISOR)
    : MOD_CFG.BURST_BAN_THRESHOLD;

  const n = _now(), burst = _burst();
  let delta = 0, doWarn = false, doMute = false, doBan = false, banReason = '';

  // ── Rule 1: Extreme burst → immediate ban ─────────────────────
  if (burst > effectiveBurstBan) {
    delta += MOD_CFG.W_BURST; doBan = true;
    banReason = `Extreme burst: ${burst} msgs in ${MOD_CFG.BURST_WINDOW_MS / 1000}s`;
  }
  // ── Rule 2: Burst warning zone ─────────────────────────────────
  else if (burst > MOD_CFG.BURST_WARN_THRESHOLD) {
    delta += MOD_CFG.W_BURST; doWarn = true;
  }

  // ── Rule 3+4: Fast typing ─────────────────────────────────────
  const gap = _S.lastMsgAt ? n - _S.lastMsgAt : 9999;
  if (gap < MOD_CFG.FAST_TYPE_MS && text.length > MOD_CFG.FAST_TYPE_MIN_LEN) {
    delta += MOD_CFG.W_FAST_MSG;
    _S.fastTypeCount++;
    if (_S.fastTypeCount >= MOD_CFG.FAST_TYPE_STRIKE) delta += MOD_CFG.W_FAST_TYPE;
  } else {
    _S.fastTypeCount = Math.max(0, _S.fastTypeCount - 1);
  }

  // ── Rule 5+6: Repeat / near-duplicate (Levenshtein) ───────────
  const lower = text.trim().toLowerCase();
  if (lower === _S.lastMsgText) {
    _S.repeatStreak++;
    if (_S.repeatStreak >= MOD_CFG.REPEAT_THRESHOLD) {
      delta += MOD_CFG.W_REPEAT; doWarn = true;
      if (_canSys('repeat')) _toast(_pick(M.repeatWarn));
    }
  } else if (_S.lastMsgText && _sim(lower, _S.lastMsgText) >= MOD_CFG.SIMILAR_RATIO) {
    _S.repeatStreak = Math.min(_S.repeatStreak + 1, MOD_CFG.REPEAT_THRESHOLD);
    delta += MOD_CFG.W_NEAR_DUP;
  } else {
    _S.repeatStreak = 0;
  }
  _S.lastMsgText = lower;

  // ── Rules 7–11+: Content heuristics (+ v4.0 sync checks) ──────
  delta += _analyzeContent(text);

  // ── §B Apply trust + risk multipliers ─────────────────────────
  //    delta = raw * riskMul / trustMul
  //    Veterans accumulate score slower; untrusted (new) accounts faster.
  delta = Math.round(delta * _riskMul() / _trustMul());

  // ── Update score ───────────────────────────────────────────────
  _S.spamScore = Math.min(100, _S.spamScore + delta);
  _S.lastMsgAt = n;
  _save();

  _log(`score:${_S.spamScore} burst:${burst} gap:${gap}ms repeat:${_S.repeatStreak} Δ:+${delta} risk:${_F.riskLevel} trust:${_trustLevel()}`);

  // ── Score threshold escalations ────────────────────────────────
  if (_S.spamScore >= MOD_CFG.BAN_THRESHOLD && !doBan) {
    doBan = true; banReason = `Score ${_S.spamScore} ≥ ban threshold`;
  } else if (_S.spamScore >= MOD_CFG.MUTE_THRESHOLD) {
    doMute = true;
  }

  // ── Apply highest-severity action first ────────────────────────
  if (doBan)  { _doBan(banReason); return { allowed: false, reason: 'auto-banned' }; }
  if (doMute) { _doMute(`Score ${_S.spamScore}`); return { allowed: false, reason: 'auto-muted' }; }
  if (doWarn) {
    _doWarn(`burst:${burst} repeat:${_S.repeatStreak}`);
    if (_isMuted()) return { allowed: false, reason: 'muted-post-warn' };
  }

  // §C Trigger shadowban at extreme risk
  if (_F.riskLevel === MOD_CFG.SHADOWBAN_AT_RISK && !_isShadowbanned()) {
    _doShadowban('Risk level reached EXTREME');
  }

  // §F Fire-and-forget cloud function report (non-blocking)
  _cloudReport(text, _S.spamScore, delta);

  // §A Run async AI checks after allowing (retroactive enforcement)
  _runAIChecks(text).catch(() => {});

  return { allowed: true, reason: null };
}

/* ═══════════════════════════════════════════════════════════════════
   §11  DECAY + WARNING RESET
═══════════════════════════════════════════════════════════════════ */
function _decay() {
  const quiet  = _S.lastMsgAt && (_now() - _S.lastMsgAt > MOD_CFG.QUIET_MS);
  // §B Veterans get extra decay bonus
  const trustBonus = _trustLevel() === 'veteran' ? MOD_CFG.TRUST_VETERAN_DECAY_BONUS : 0;
  const amount = (quiet ? MOD_CFG.DECAY_FAST : MOD_CFG.DECAY_SLOW) + trustBonus;
  if (_S.spamScore > 0) _S.spamScore = Math.max(0, _S.spamScore - amount);

  if (_S.warnings > 0 && _S.lastWarningAt && _now() - _S.lastWarningAt > MOD_CFG.WARN_RESET_MS) {
    _S.warnings = 0; _S.lastWarningAt = 0;
    _log('Warning amnesty — good behaviour reset');
  }
  _save();
}

/* ═══════════════════════════════════════════════════════════════════
   §12  CLEANUP LOOP
═══════════════════════════════════════════════════════════════════ */
function _cleanup() {
  _pruneTS();
  _decay();
  if (_isBanned()) {
    _setInputsOff(true);
    if (!document.getElementById('mod-ban-banner')) {
      const h = Math.ceil((_S.bannedUntil - _now()) / 3_600_000);
      _banner('mod-ban-banner', `🚫 You\'re banned. ${h}h remaining.`, '#ef4444', 0);
    }
  } else if (_isMuted()) {
    _setInputsOff(true);
    if (!document.getElementById('mod-mute-banner')) {
      const m = Math.ceil((_S.mutedUntil - _now()) / 60_000);
      _banner('mod-mute-banner', `🔇 Muted — ${m} min remaining.`, '#f59e0b', _S.mutedUntil - _now());
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   §13  NEW USER GREETING
═══════════════════════════════════════════════════════════════════ */
function _greet() {
  if (_S.greeted) return;
  _S.greeted = true; _save();
  setTimeout(() => _toast(_pick(M.greeting)), 1400);
}

/* ═══════════════════════════════════════════════════════════════════
   §14  FUNCTION PATCHING
═══════════════════════════════════════════════════════════════════ */
const _patched = new Set();

function _patch(fnName, attempt = 0) {
  if (_patched.has(fnName)) return;
  if (typeof window[fnName] !== 'function') {
    if (attempt < 25) setTimeout(() => _patch(fnName, attempt + 1), 300);
    return;
  }
  const orig = window[fnName];
  window[fnName] = async function _modWrapped(...args) {
    try { if (typeof window.isAdmin === 'function' && window.isAdmin()) return orig.apply(this, args); } catch {}
    const text   = _getText(fnName);
    const result = _pipeline(text);
    if (!result.allowed) { _flashInput(_inpSel(fnName)); return; }
    return orig.apply(this, args);
  };
  _patched.add(fnName);
  _log(`Patched: window.${fnName}`);
}

const _inpSel = fn => fn === 'sendMsg' ? '#msgInp' : fn === 'sendChanMsg' ? '#chanInpArea' : '#commPostInp';
const _getText = fn => document.querySelector(_inpSel(fn))?.value?.trim() || '';

/* ─── §D Patch image upload ─────────────────────────────────────── */
function _patchImageInput() {
  const el = document.getElementById('imgInput');
  if (!el || el._modImgGuarded) return;
  el._modImgGuarded = true;
  el.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { if (typeof window.isAdmin === 'function' && window.isAdmin()) return; } catch {}
    await _handleImageUpload(file, el);
  });
  _log('Image input guarded.');
}

/* ═══════════════════════════════════════════════════════════════════
   §15  KEYBOARD CAPTURE GUARD
═══════════════════════════════════════════════════════════════════ */
function _keyGuard() {
  ['#msgInp', '#chanInpArea'].forEach(sel => {
    const el = document.querySelector(sel);
    if (!el || el._modGuarded) return;
    el._modGuarded = true;
    el.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      try { if (typeof window.isAdmin === 'function' && window.isAdmin()) return; } catch {}
      if (_isBanned() || _isMuted()) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (_canSys('keyblock')) {
          _toast(_isBanned()
            ? `🚫 Banned — ${Math.ceil((_S.bannedUntil - _now()) / 3_600_000)}h left.`
            : `🔇 Muted — ${Math.ceil((_S.mutedUntil - _now()) / 60_000)} min left.`);
        }
        _flashInput(sel);
      }
    }, true);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   §16  STYLE INJECTION
═══════════════════════════════════════════════════════════════════ */
function _styles() {
  if (document.getElementById('nf-mod-css')) return;
  const s = document.createElement('style');
  s.id = 'nf-mod-css';
  s.textContent = `@keyframes _modSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════════════
   §17  PUBLIC API  (window.ModerationEngine)
═══════════════════════════════════════════════════════════════════ */
window.ModerationEngine = {
  status() {
    return {
      spamScore:        _S.spamScore,
      warnings:         _S.warnings,
      burstCount:       _burst(),
      repeatStreak:     _S.repeatStreak,
      fastTypeCount:    _S.fastTypeCount,
      sessionMsgs:      _S.sessionMsgs,
      isMuted:          _isMuted(),
      mutedUntil:       _S.mutedUntil ? new Date(_S.mutedUntil).toLocaleTimeString() : '—',
      isBanned:         _isBanned(),
      bannedUntil:      _S.bannedUntil ? new Date(_S.bannedUntil).toLocaleString() : '—',
      isShadowbanned:   _isShadowbanned(),
      muteCount:        _S.muteCount,
      riskLevel:        _F.riskLevel,
      riskMultiplier:   _riskMul(),
      trustLevel:       _trustLevel(),
      trustMultiplier:  _trustMul(),
      isNewAccount:     _isNewAccount(),
      aiReady:          _aiReady,
      totalWarnings:    _F.totalWarnings,
      totalMutes:       _F.totalMutes,
      totalBans:        _F.totalBans,
      nsfwViolations:   _F.nsfwViolations,
      scoreToMute:      Math.max(0, MOD_CFG.MUTE_THRESHOLD - _S.spamScore),
      scoreToBan:       Math.max(0, MOD_CFG.BAN_THRESHOLD  - _S.spamScore),
    };
  },
  check(text)       { return _pipeline(text || ''); },
  checkToxicity(t)  { return _runAIChecks(t || ''); },
  checkImage(file)  { return _handleImageUpload(file); },
  reset()           {
    _S = _DS(); _F = _DF(); _save(); _saveF();
    _setInputsOff(false); _ts.length = 0;
    _imgHashStore.length = 0;
    _lastEmbedding = null;
    ['mod-ban-banner','mod-mute-banner','mod-warn-banner'].forEach(_rmBanner);
    console.log('[MOD] ✅ Full reset complete.');
  },
  simulateWarn()    { _doWarn('manual test'); },
  simulateMute()    { _doMute('manual test'); },
  simulateBan()     { _doBan('manual test'); },
  simulateShadowban(){ _doShadowban('manual test'); },
  /**
   * isUserShadowbanned(uid) — async Firestore check.
   * Use inside your onSnapshot listener to filter shadowbanned messages:
   *
   *   const isBanned = await ModerationEngine.isUserShadowbanned(msg.uid);
   *   if (isBanned) return; // skip rendering this message
   */
  async isUserShadowbanned(uid) {
    try {
      const { getDoc, doc } = window._firebaseModExports || {};
      if (!getDoc || !doc || !window.db || !uid) return false;
      const snap = await getDoc(doc(window.db, 'users', uid));
      return snap.exists() && !!snap.data()?.shadowbanned;
    } catch { return false; }
  },
  /**
   * filterMessages(messages) — pass your raw Firestore messages array here
   * and get back only the ones not authored by shadowbanned users.
   * This is async because it may need to query Firestore for each unique UID.
   */
  async filterMessages(messages) {
    const checked = new Map();
    const result  = [];
    for (const msg of messages) {
      const uid = msg.uid || msg.userId;
      if (!checked.has(uid)) checked.set(uid, await window.ModerationEngine.isUserShadowbanned(uid));
      if (!checked.get(uid)) result.push(msg);
    }
    return result;
  },
  config: MOD_CFG,
};

/* ═══════════════════════════════════════════════════════════════════
   §18  BOOT SEQUENCE
═══════════════════════════════════════════════════════════════════ */
function _boot() {
  try { if (typeof window.isAdmin === 'function' && window.isAdmin()) { _log('Admin — bypassed.'); return; } } catch {}

  _styles();
  _loadState();

  if (_isBanned()) {
    const h = Math.ceil((_S.bannedUntil - _now()) / 3_600_000);
    _banner('mod-ban-banner', `🚫 Banned. ${h}h remaining.`, '#ef4444', 0);
    _setInputsOff(true);
  } else if (_isMuted()) {
    const m = Math.ceil((_S.mutedUntil - _now()) / 60_000);
    _banner('mod-mute-banner', `🔇 Muted — ${m} min remaining.`, '#f59e0b', _S.mutedUntil - _now());
    _setInputsOff(true);
  }

  ['sendMsg', 'sendChanMsg', 'submitPost', 'createPost'].forEach(fn => _patch(fn));

  setTimeout(_keyGuard, 900);
  setInterval(_keyGuard, 6_000);
  setTimeout(_patchImageInput, 1000);
  setInterval(_patchImageInput, 8_000);

  _greet();
  setInterval(_cleanup, MOD_CFG.CLEANUP_MS);

  // §A Boot AI models (async, non-blocking)
  _initAIModels().catch(e => _log('AI init failed (non-critical):', e.message));

  window.addEventListener('load', () => {
    setTimeout(() => {
      ['sendMsg', 'sendChanMsg'].forEach(fn => _patch(fn));
      _keyGuard();
      _patchImageInput();
    }, 1600);
  }, { once: true });

  _log('🛡️ NeuroForge Moderation Engine v4.0 booted.', window.ModerationEngine.status());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _boot);
} else {
  _boot();
}

/* ═══════════════════════════════════════════════════════════════════════════
   ██████████████████████████████████████████████████████████████████████████
   ███                        v4.0 NEW SECTIONS                           ███
   ██████████████████████████████████████████████████████████████████████████
═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   §A  AI ENGINE — TF.js Toxicity + Universal Sentence Encoder
   ─────────────────────────────────────────────────────────────────
   HOW IT WORKS:
   1. Models are loaded from CDN on boot (15–30 MB, cached after first load).
   2. _initAIModels() resolves quietly if CDN is unreachable (fail-open).
   3. Every allowed message gets a background async AI pass via _runAIChecks().
   4. If toxicity is confirmed, score is raised retroactively and the
      user may be muted/banned even after the message was "sent".
   5. Semantic similarity compares the USE embedding of the current message
      against the stored embedding of the previous one, catching paraphrase
      spam that Levenshtein cannot detect.
═══════════════════════════════════════════════════════════════════ */
let _toxicityModel  = null;  // TF.js toxicity model instance
let _useModel       = null;  // Universal Sentence Encoder instance
let _aiReady        = false; // true when both models are ready
let _lastEmbedding  = null;  // Float32Array — embedding of last message
let _aiInitPromise  = null;  // Deduplication guard

const _TF_CDN  = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const _TOX_CDN = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/toxicity@1.2.2/dist/toxicity.min.js';
const _USE_CDN = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@1.3.3/dist/universal_sentence_encoder.min.js';

const _TOXICITY_LABELS = ['toxicity', 'severe_toxicity', 'identity_attack', 'insult', 'threat', 'sexual_explicit'];

async function _initAIModels() {
  if (_aiInitPromise) return _aiInitPromise;
  _aiInitPromise = (async () => {
    try {
      _log('AI: Loading TensorFlow.js…');
      await _loadScript(_TF_CDN);
      await _loadScript(_TOX_CDN);
      await _loadScript(_USE_CDN);

      _log('AI: Warming up Toxicity model…');
      _toxicityModel = await window.toxicity.load(MOD_CFG.AI_TOXICITY_THRESHOLD, _TOXICITY_LABELS);

      _log('AI: Warming up Universal Sentence Encoder…');
      _useModel = await window.use.load();

      _aiReady = true;
      _log('AI: ✅ Both models ready.');
    } catch (e) {
      _log('AI: Failed to load models (non-fatal):', e.message);
      // Engine continues with heuristic-only mode
    }
  })();
  return _aiInitPromise;
}

/**
 * _runAIChecks(text)
 * Async. Called after pipeline allows a message. Retroactively raises
 * score or punishes if AI detects toxicity or semantic near-duplicates.
 */
async function _runAIChecks(text) {
  if (!_aiReady || !text || text.length < 3) return;

  try {
    const [toxResult, semDelta] = await Promise.all([
      _checkToxicity(text),
      _checkSemanticSimilarity(text),
    ]);

    let delta = 0;
    if (toxResult.isToxic) {
      delta += MOD_CFG.W_AI_TOXIC;
      _S.aiToxicStrikes++;
      if (_canSys('ai_toxic')) _toast(_pick(M.toxicWarn));
      _log(`AI Toxicity: ${JSON.stringify(toxResult.labels)}`);

      // Optionally delete the message from Firestore (requires access to msg ID)
      // This is best handled server-side (see §G Cloud Function docs).
      if (MOD_CFG.AI_RETROACTIVE_DELETE && window._lastSentMsgId) {
        _deleteMessage(window._lastSentMsgId).catch(() => {});
      }
    }
    if (semDelta > 0) {
      delta += semDelta;
      if (_canSys('ai_sem')) _toast(_pick(M.semanticWarn));
    }

    if (delta > 0) {
      delta = Math.round(delta * _riskMul() / _trustMul());
      _S.spamScore = Math.min(100, _S.spamScore + delta);
      _save();
      _log(`AI retroactive score delta: +${delta} → total: ${_S.spamScore}`);
      if (_S.spamScore >= MOD_CFG.BAN_THRESHOLD) _doBan('AI: toxicity/semantic score');
      else if (_S.spamScore >= MOD_CFG.MUTE_THRESHOLD) _doMute('AI: toxicity/semantic score');
    }
  } catch (e) {
    _log('AI check error (non-fatal):', e.message);
  }
}

/** Run TF.js toxicity model. Returns { isToxic, labels } */
async function _checkToxicity(text) {
  if (!_toxicityModel) return { isToxic: false, labels: [] };
  try {
    const predictions = await _toxicityModel.classify([text]);
    const flagged = predictions
      .filter(p => p.results[0]?.match === true)
      .map(p => p.label);
    return { isToxic: flagged.length > 0, labels: flagged };
  } catch {
    return { isToxic: false, labels: [] };
  }
}

/**
 * Run USE semantic similarity against last message embedding.
 * Returns a score delta (0 if no similarity concern).
 */
async function _checkSemanticSimilarity(text) {
  if (!_useModel) return 0;
  try {
    const tensor = await _useModel.embed([text]);
    const arr    = await tensor.array();
    tensor.dispose();
    const embedding = arr[0]; // Float32Array
    let delta = 0;

    if (_lastEmbedding) {
      const sim = _cosineSim(embedding, _lastEmbedding);
      _log(`Semantic sim: ${sim.toFixed(3)} (threshold: ${MOD_CFG.AI_SEMANTIC_THRESHOLD})`);
      if (sim >= MOD_CFG.AI_SEMANTIC_THRESHOLD) {
        delta = MOD_CFG.W_AI_SEMANTIC_DUP;
      }
    }
    _lastEmbedding = embedding; // Store for next comparison
    return delta;
  } catch {
    return 0;
  }
}

/** Attempt to delete a Firestore message by ID (retroactive AI enforcement) */
async function _deleteMessage(msgId) {
  try {
    const { deleteDoc, doc } = window._firebaseModExports || {};
    if (!deleteDoc || !doc || !window.db) return;

    // Prefer the full path set by chat.html (subcollection-aware).
    // Falls back to flat collection path only if nothing else is available.
    const fullPath = window._lastSentMsgPath;
    if (!fullPath) {
      _log('AI: Cannot delete — window._lastSentMsgPath not set.');
      return;
    }
    const parts = fullPath.split('/');
    await deleteDoc(doc(window.db, ...parts));
    _log(`AI: Deleted message at path: ${fullPath}`);
  } catch (e) {
    _log('AI: Could not delete message:', e.message);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   §B  TRUST MULTIPLIER + NEW ACCOUNT SANDBOX
   ─────────────────────────────────────────────────────────────────
   Trust levels and their effect on score accumulation:
     untrusted  (new < 24 h):   divisor 0.5 → score accumulates 2× FASTER
     normal     (default):       divisor 1.0 → no change
     trusted    (earned titles): divisor 1.5 → score accumulates 33% slower
     veteran    (og titles/mod): divisor 2.5 → score accumulates 60% slower

   The formula in the pipeline: delta = raw * riskMul / trustMul
   Veterans also receive an extra decay bonus per cleanup tick.
═══════════════════════════════════════════════════════════════════ */

/** Titles considered "veteran" — adjust to match your chat.html title system */
const _VETERAN_TITLES  = new Set(['veteran', 'og_user', 'mod', 'moderator', 'admin', 'trusted_mod']);
/** Titles considered "trusted" */
const _TRUSTED_TITLES  = new Set(['verified', 'active', 'regular', 'contributor', 'supporter', 'vip']);

function _isNewAccount() {
  const age = _now() - _F.firstSeen;
  return age < MOD_CFG.SANDBOX_AGE_MS;
}

function _trustLevel() {
  if (_isNewAccount()) return 'untrusted';
  // Read titles from the same ME object used by chat.html
  const titles = window.ME?.titles || window.currentUser?.reloadUserInfo?.customAttributes
    ? JSON.parse(window.currentUser?.reloadUserInfo?.customAttributes || '{}')?.titles || []
    : [];
  if (titles.some(t => _VETERAN_TITLES.has(t))) return 'veteran';
  if (titles.some(t => _TRUSTED_TITLES.has(t))) return 'trusted';
  return 'normal';
}

const _TRUST_MULTI = { untrusted: 0.5, normal: 1.0, trusted: 1.5, veteran: 2.5 };
const _trustMul    = () => _TRUST_MULTI[_trustLevel()] || 1.0;

/* ═══════════════════════════════════════════════════════════════════
   §C  SHADOWBAN SYSTEM  (Hellbanning)
   ─────────────────────────────────────────────────────────────────
   When a user hits EXTREME risk, they are shadowbanned instead of
   loudly banned. They can continue to send messages and see their
   own messages in their own client. No other user sees their messages.

   CLIENT-SIDE:
     • _pipeline() silently returns { allowed: true } for shadowbanned users.
     • Their messages still go to Firestore (so they think it worked).
     • A `shadowbanned: true` flag is written to their Firestore user doc.

   SERVER-SIDE (you must implement this):
     • Your Firestore message listener (onSnapshot) should call
       ModerationEngine.filterMessages(messages) to strip shadowbanned
       messages from the rendered list.
     • OR add a Firestore security rule / Cloud Function trigger that
       filters messages from shadowbanned users before they reach others.

   See §G for the Cloud Function pattern.
═══════════════════════════════════════════════════════════════════ */

function _doShadowban(reason) {
  _S.shadowbanned = true;
  _F.totalShadowbans++;
  _updateRisk(); _save(); _saveF();
  _syncShadowban(true);
  _log(`Shadowbanned | ${reason}`);
  // No visible toast — the user must not know they've been shadowbanned.
}

function _syncShadowban(state) {
  try {
    if (!window.currentUser) return;
    const { setDoc, doc } = window._firebaseModExports || {};
    if (setDoc && doc && window.db) {
      setDoc(doc(window.db, 'users', window.currentUser.uid),
        { shadowbanned: state, shadowbannedAt: state ? _now() : null },
        { merge: true }
      ).catch(() => {});
    }
  } catch {}
}

/* ═══════════════════════════════════════════════════════════════════
   §D  MEDIA MODERATION — pHash Image Dedup + NSFW Cloud Vision
   ─────────────────────────────────────────────────────────────────
   IMAGE DEDUP (client-side pHash):
     1. Draw uploaded image to an 8×8 grayscale canvas.
     2. Compute the mean pixel brightness.
     3. 64-bit hash: pixel > mean → 1, else → 0.
     4. Compare against recent hashes using Hamming distance.
     5. Distance ≤ IMG_HASH_HAMMING → duplicate → increase score.

   NSFW DETECTION (server-side Cloud Vision):
     1. Convert file to base64.
     2. POST to your Cloud Function /moderateImage endpoint.
     3. Cloud Function uses Google Cloud Vision safeSearchDetection.
     4. If LIKELY/VERY_LIKELY adult/violence, return isNSFW: true.
     5. Client receives response and raises score / cancels upload.

   See §G for the full Cloud Function implementation.
═══════════════════════════════════════════════════════════════════ */

const _imgHashStore = []; // { hash: string, ts: number }

/** Compute an 8×8 perceptual hash of an image File/Blob. Returns hex string. */
async function _pHash(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const SIZE = 8;
        const c = document.createElement('canvas');
        c.width = c.height = SIZE;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
        const pixels = [];
        for (let i = 0; i < data.length; i += 4) {
          // Luminance approximation (greyscale)
          pixels.push(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
        }
        const mean = pixels.reduce((a, b) => a + b, 0) / pixels.length;
        const bits = pixels.map(p => (p > mean ? 1 : 0));
        // Pack 64 bits into 16 hex chars
        let hex = '';
        for (let i = 0; i < 64; i += 4) {
          hex += (bits[i]*8 + bits[i+1]*4 + bits[i+2]*2 + bits[i+3]).toString(16);
        }
        URL.revokeObjectURL(url);
        resolve(hex);
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

/** Hamming distance between two hex pHash strings */
function _hammingDist(a, b) {
  if (a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    dist += xor.toString(2).split('').filter(c => c === '1').length;
  }
  return dist;
}

/**
 * Main image upload handler.
 * Called from the patched #imgInput change event.
 * Returns false if the upload should be cancelled.
 */
async function _handleImageUpload(file, inputEl) {
  if (!file || !file.type.startsWith('image/')) return true;
  const now = _now();
  let blocked = false;

  // ── 1. pHash dedup ─────────────────────────────────────────────
  try {
    const hash = await _pHash(file);
    // Prune stale hashes
    const cutoff = now - MOD_CFG.IMG_HASH_WINDOW_MS;
    while (_imgHashStore.length && _imgHashStore[0].ts < cutoff) _imgHashStore.shift();

    const dupeCount = _imgHashStore.filter(h => _hammingDist(h.hash, hash) <= MOD_CFG.IMG_HASH_HAMMING).length;
    _imgHashStore.push({ hash, ts: now });

    if (dupeCount >= MOD_CFG.IMG_SPAM_THRESHOLD - 1) {
      _S.imgSpamCount++;
      _S.spamScore = Math.min(100, _S.spamScore + MOD_CFG.W_IMG_SPAM);
      if (_canSys('img_spam')) _toast(_pick(M.imgSpamWarn));
      _save();
      _log(`Image dupe detected (${dupeCount + 1}× in window). Score: ${_S.spamScore}`);
      if (_S.spamScore >= MOD_CFG.BAN_THRESHOLD) { _doBan('Image spam'); blocked = true; }
      else if (_S.spamScore >= MOD_CFG.MUTE_THRESHOLD) { _doMute('Image spam'); blocked = true; }
    }
  } catch (e) {
    _log('pHash failed (non-fatal):', e.message);
  }

  if (blocked) {
    if (inputEl) inputEl.value = '';
    return false;
  }

  // ── 2. Cloud Vision NSFW check ─────────────────────────────────
  const cfBase = window.NF_CLOUD_FN_URL;
  if (cfBase) {
    try {
      const base64 = await _fileToBase64(file);
      const resp   = await _cfFetch(cfBase + MOD_CFG.NSFW_CLOUD_ROUTE, {
        imageBase64: base64,
        userId: _uid(),
        fileName: file.name,
      });
      if (resp?.isNSFW) {
        _F.nsfwViolations++;
        _S.spamScore = Math.min(100, _S.spamScore + MOD_CFG.BAN_THRESHOLD);
        _saveF(); _save();
        if (_canSys('nsfw')) _toast(_pick(M.nsfwWarn));
        if (inputEl) inputEl.value = '';
        _log('NSFW image blocked by Cloud Vision.');
        if (_S.spamScore >= MOD_CFG.BAN_THRESHOLD) _doBan('NSFW image upload');
        return false;
      }
    } catch (e) {
      _log('NSFW check failed (fail-open):', e.message);
    }
  }
  return true;
}

/** Convert a File to a base64 data string */
function _fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   §E  PHISHING, ZALGO & HOMOGRAPH DETECTION
═══════════════════════════════════════════════════════════════════ */

/* ── E.1  Zalgo text detector ────────────────────────────────────
   Zalgo text stacks excessive Unicode combining diacritical marks on
   base characters, causing text to bleed into adjacent UI elements.
   We flag any run of ≥ ZALGO_MIN_MARKS combining marks.           */
const _ZALGO_RE = /[\u0300-\u036f\u0489\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]{4,}/g;

function _detectZalgo(text) {
  const marks = (text.match(/[\u0300-\u036f\u0489\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g) || []).length;
  if (marks >= MOD_CFG.ZALGO_MIN_MARKS) return true;
  if (_ZALGO_RE.test(text)) { _ZALGO_RE.lastIndex = 0; return true; }
  return false;
}

/* ── E.2  Homograph attack detector ─────────────────────────────
   Detects IDN homograph attacks — URLs using non-ASCII characters
   that look like Latin letters (e.g., Cyrillic 'а' vs Latin 'a').
   Also catches leet-speak substitutions in domain names.          */

/** Known confusable character groups (simplified) */
const _CONFUSABLE_RE = /[а-яёА-ЯЁ\u0430-\u044f\u0401\u0450-\u045f]|[\u03b1-\u03c9\u0391-\u03a9]/; // Cyrillic + Greek

function _detectHomograph(text) {
  const urls = text.match(/https?:\/\/\S+|www\.\S+/gi) || [];
  for (const raw of urls) {
    try {
      const urlStr = raw.startsWith('http') ? raw : 'https://' + raw;
      const host   = new URL(urlStr).hostname;
      // Non-ASCII hostname → possible IDN homograph
      if (/[^\x00-\x7F]/.test(host)) return true;
      // Cyrillic or Greek characters mixed into what looks like a Latin domain
      if (_CONFUSABLE_RE.test(host)) return true;
      // Common leet-speak digit substitutions inside domain labels (e.g. g00gle, paypa1)
      if (/[a-z]+[0-9]+[a-z]+/i.test(host.split('.')[0])) {
        // Only flag if digits replace letters in recognisable brand names
        const normalised = host.replace(/0/g,'o').replace(/1/g,'l').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s');
        const BRANDS = ['google','paypal','facebook','instagram','microsoft','amazon','apple','netflix'];
        if (BRANDS.some(b => normalised.includes(b) && host !== normalised)) return true;
      }
    } catch {}
  }
  return false;
}

/* ── E.3  Domain blacklist ───────────────────────────────────────
   A curated list of known phishing / scam TLDs and domain patterns.
   Extend _PHISH_DOMAINS with your community's specific threat list.  */
const _PHISH_DOMAINS = new Set([
  // Common phishing patterns
  'bit.ly','tinyurl.com','t.co','ow.ly','goo.gl','cutt.ly',   // Shortened (warn, not block)
  // Known scam domains (sample — extend as needed)
  'free-robux.xyz','freerobux.net','discord-nitro.gift','steamcommunity.cm',
  'paypa1.com','g00gle.com','arnazon.com','roblox-promo.com',
  'free-vbucks.com','claimprize.win','getfreegift.net','cryptogiveaway.live',
  'nft-drop.io','metamask-verify.com','wallet-connect.site',
  // TLDs heavily abused for phishing
]);

/** Broader TLD pattern for highly suspicious domains */
const _PHISH_TLD_RE = /\.(xyz|top|click|loan|win|gq|ml|cf|tk|pw|work|download|stream)$/i;

function _detectPhishingDomain(text) {
  const urls = text.match(/https?:\/\/\S+|www\.\S+/gi) || [];
  for (const raw of urls) {
    try {
      const urlStr = raw.startsWith('http') ? raw : 'https://' + raw;
      const host   = new URL(urlStr).hostname.toLowerCase().replace(/^www\./, '');
      if (_PHISH_DOMAINS.has(host)) return host;
      if (_PHISH_TLD_RE.test(host)) return host;
      // Excessive subdomains (e.g., secure.login.paypal.malicious.com)
      if (host.split('.').length > 4) return host;
    } catch {}
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   §F  SERVER-SIDE CLOUD FUNCTION BRIDGE
   ─────────────────────────────────────────────────────────────────
   The client-side engine handles UX. This bridge sends a lightweight
   report to your Cloud Functions so the server can be the final judge.
   If a user bypasses the JS engine via DevTools, the Cloud Function
   (see §G documentation) catches the raw Firestore write.

   Set window.NF_CLOUD_FN_URL before the script loads:
     <script>window.NF_CLOUD_FN_URL = "https://us-central1-YOUR_PROJECT.cloudfunctions.net";</script>
═══════════════════════════════════════════════════════════════════ */

/** Generic authenticated fetch to a Cloud Function endpoint */
async function _cfFetch(url, body) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), MOD_CFG.CF_TIMEOUT_MS);
  try {
    // Attach Firebase ID token for server-side auth verification
    let token = '';
    try { token = await window.currentUser?.getIdToken() || ''; } catch {}
    const res = await fetch(url, {
      method:  'POST',
      signal:  ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body:    JSON.stringify({ ...body, _ts: _now() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(tid);
  }
}

/**
 * _cloudReport(text, score, delta)
 * Fire-and-forget. Sends message metadata to the server so the Cloud
 * Function can independently verify and enforce bans if the client
 * was bypassed. Non-blocking — never delays the send.
 */
async function _cloudReport(text, score, delta) {
  const cfBase = window.NF_CLOUD_FN_URL;
  if (!cfBase || score < 5) return; // Don't flood CF with clean messages
  try {
    await _cfFetch(cfBase + MOD_CFG.CF_REPORT_ROUTE, {
      uid:        _uid(),
      scoreAfter: score,
      delta,
      riskLevel:  _F.riskLevel,
      flags: {
        zalgo:       _ZALGO_RE.test(text),
        urlCount:    _urlCount(text),
        emojiCount:  _emojiCount(text),
      },
    });
  } catch (e) {
    _log('Cloud report failed (non-fatal):', e.message);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   §G  CLOUD FUNCTION IMPLEMENTATION GUIDE
   ─────────────────────────────────────────────────────────────────
   Deploy the following to Firebase Cloud Functions (functions/index.js).
   This is the server-side half of the hybrid enforcement model.

   ┌──────────────────────────────────────────────────────────────┐
   │  INSTALL:  npm install firebase-admin firebase-functions     │
   │            @google-cloud/vision                              │
   └──────────────────────────────────────────────────────────────┘

   ╔══════════════════════════════════════════════════════════════╗
   ║  // functions/index.js                                       ║
   ║                                                              ║
   ║  const functions = require('firebase-functions');            ║
   ║  const admin     = require('firebase-admin');                ║
   ║  const vision    = require('@google-cloud/vision');          ║
   ║  admin.initializeApp();                                      ║
   ║  const db     = admin.firestore();                           ║
   ║  const vc     = new vision.ImageAnnotatorClient();           ║
   ║                                                              ║
   ║  // ── 1. Firestore trigger: moderate new messages ────────  ║
   ║  exports.moderateMessage = functions.firestore               ║
   ║    .document('messages/{msgId}')                             ║
   ║    .onCreate(async (snap, ctx) => {                          ║
   ║      const msg  = snap.data();                               ║
   ║      const text = msg.text || '';                            ║
   ║      const uid  = msg.uid  || msg.userId;                    ║
   ║      if (!uid) return;                                       ║
   ║                                                              ║
   ║      const userDoc = db.collection('users').doc(uid);        ║
   ║      const user    = (await userDoc.get()).data() || {};      ║
   ║                                                              ║
   ║      // Block if shadowbanned                                ║
   ║      if (user.shadowbanned) {                                ║
   ║        await snap.ref.delete(); return;                      ║
   ║      }                                                       ║
   ║                                                              ║
   ║      // Block if server-banned                               ║
   ║      if (user.bannedUntil?.toMillis() > Date.now()) {        ║
   ║        await snap.ref.delete(); return;                      ║
   ║      }                                                       ║
   ║                                                              ║
   ║      // Simple server-side spam heuristics                   ║
   ║      const urlRe = /https?:\/\/\S+|www\.\S+/gi;             ║
   ║      const urlCount = (text.match(urlRe) || []).length;      ║
   ║      if (urlCount > 3) {                                     ║
   ║        await snap.ref.delete();                              ║
   ║        await userDoc.set({ bannedUntil:                      ║
   ║          admin.firestore.Timestamp.fromMillis(               ║
   ║            Date.now() + 86_400_000)                          ║
   ║        }, { merge: true });                                   ║
   ║      }                                                       ║
   ║    });                                                       ║
   ║                                                              ║
   ║  // ── 2. HTTPS callable: NSFW image moderation ───────────  ║
   ║  exports.moderateImage = functions.https.onCall(             ║
   ║    async (data, ctx) => {                                    ║
   ║      const { imageBase64, userId } = data;                   ║
   ║      if (!imageBase64) return { isNSFW: false };             ║
   ║                                                              ║
   ║      const [result] = await vc.safeSearchDetection({         ║
   ║        image: { content: imageBase64 }                       ║
   ║      });                                                      ║
   ║      const s = result.safeSearchAnnotation;                  ║
   ║      const bad = ['LIKELY','VERY_LIKELY'];                   ║
   ║      const isNSFW = bad.includes(s.adult) ||                 ║
   ║                     bad.includes(s.violence);                ║
   ║                                                              ║
   ║      if (isNSFW && userId) {                                  ║
   ║        await db.collection('users').doc(userId).set({        ║
   ║          nsfwViolations:                                      ║
   ║            admin.firestore.FieldValue.increment(1),          ║
   ║          lastNsfwAt:                                          ║
   ║            admin.firestore.FieldValue.serverTimestamp()       ║
   ║        }, { merge: true });                                   ║
   ║      }                                                       ║
   ║      return { isNSFW, annotations: s };                      ║
   ║    });                                                       ║
   ║                                                              ║
   ║  // ── 3. HTTPS callable: client score report handler ──────  ║
   ║  exports.reportMessage = functions.https.onCall(             ║
   ║    async (data, ctx) => {                                    ║
   ║      const uid = ctx.auth?.uid || data.uid;                  ║
   ║      if (!uid) return { ok: false };                         ║
   ║      const { scoreAfter, delta, riskLevel } = data;          ║
   ║      if (scoreAfter >= 70) {                                  ║
   ║        // Independently enforce ban server-side               ║
   ║        await db.collection('users').doc(uid).set({           ║
   ║          bannedUntil: admin.firestore.Timestamp.fromMillis(  ║
   ║            Date.now() + 86_400_000),                         ║
   ║          bannedByServer: true,                                ║
   ║          lastRiskLevel: riskLevel,                            ║
   ║        }, { merge: true });                                   ║
   ║      }                                                       ║
   ║      return { ok: true };                                    ║
   ║    });                                                       ║
   ╚══════════════════════════════════════════════════════════════╝

   SECURITY NOTE:
   Always verify ctx.auth.uid server-side and never trust the client-
   provided uid for security-sensitive writes. The client uid is used
   here only for logging in unauthenticated fallback scenarios.
═══════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════
   DevTools reference:
     ModerationEngine.status()               → full live state snapshot
     ModerationEngine.check("text")          → manually test pipeline
     ModerationEngine.checkToxicity("text")  → run AI checks manually
     ModerationEngine.checkImage(file)       → test image moderation
     ModerationEngine.reset()                → wipe all state (admin use)
     ModerationEngine.simulateWarn()         → trigger a warning
     ModerationEngine.simulateMute()         → trigger a mute
     ModerationEngine.simulateBan()          → trigger a ban
     ModerationEngine.simulateShadowban()    → trigger a shadowban
     ModerationEngine.isUserShadowbanned(uid)→ async Firestore check
     ModerationEngine.filterMessages(arr)    → strip shadowbanned msgs
     ModerationEngine.config                 → view all thresholds

   INTEGRATION CHECKLIST:
     □ Set window.NF_CLOUD_FN_URL before this script loads
     □ Set window._chatCollection to your Firestore messages collection name
     □ Set window._lastSentMsgId after each successful message send
       (enables retroactive AI message deletion)
     □ Wrap your onSnapshot message renderer with:
         const visible = await ModerationEngine.filterMessages(msgs);
     □ Deploy Firebase Cloud Functions from §G above
════════════════════════════════════════════════════════════════════ */

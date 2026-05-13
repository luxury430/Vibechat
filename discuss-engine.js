/* ═══════════════════════════════════════════════════════════════════════
   discuss-engine.js  —  NeuroForge Academic DISCUSS System v2
   ───────────────────────────────────────────────────────────────────────
   FIXED IN v2
   ────────────
   ROOT-CAUSE BUG: window._discussSend / _openDiscussRoom / _openDiscussSection
   were assigned at IIFE module-level (sync) inside discuss-engine.js.
   But the stub fallbacks in chat.html live inside a <script type="module">
   block, which ES-module spec defers to run AFTER all sync scripts.
   Result: the module always re-wrote the real implementations back to the
   toast-only stubs, so clicking any discuss button just showed
   "select a recipient to continue" and nothing else.

   FIX: move window._* overrides into boot(), which fires on
   DOMContentLoaded — after all module scripts have already run.

   NEW IN v2
   ─────────
   • 3-stage compose wizard inside one bottom sheet:
       Stage 1 — Compose form  (fill in details)
       Stage 2 — Card preview  (see exactly what will post)
       Stage 3 — Action choice (Post to Community | Send Privately)
   • 'explain' type fully wired (Explanation card)
   • Private send via window.openDiscussModal() (existing chat infra)
   • Type-picker entry point: window._openDiscussComposer() — opens a
     type-selection bottom sheet so users can also reach compose from
     a single "Discuss" FAB without pre-selecting a type.

   Firestore collections
   ─────────────────────
     community_discuss/{unitId}
     community_discuss/{unitId}/replies/{replyId}

   Unit types & TTLs
   ──────────────────
     question 5d  · equation 5d  · hint 1d
     concept  2d  · test     3d  · challenge 2d  · explain 3d
═══════════════════════════════════════════════════════════════════════ */
(function _discussEngine() {

  /* ── Constants ─────────────────────────────────────────────────────── */
  const COL       = 'community_discuss';
  const PAGE_SIZE = 15;

  const TTL_DAYS = {
    question: 5, equation: 5,
    hint: 1, concept: 2, test: 3, challenge: 2, explain: 3,
  };

  const TYPE_META = {
    question:  { label: 'Question',      color: '#3B82F6', bg: 'rgba(59,130,246,.1)',   icon: `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>` },
    equation:  { label: 'Equation',      color: '#8B5CF6', bg: 'rgba(139,92,246,.1)',   icon: `<line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8"/><circle cx="12" cy="12" r="10"/>` },
    hint:      { label: 'Hint Request',  color: '#F59E0B', bg: 'rgba(245,158,11,.1)',   icon: `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>` },
    concept:   { label: 'Concept Card',  color: '#10B981', bg: 'rgba(16,185,129,.1)',   icon: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>` },
    test:      { label: 'Test Share',    color: '#F59E0B', bg: 'rgba(245,158,11,.1)',   icon: `<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>` },
    challenge: { label: 'Challenge',     color: '#EF4444', bg: 'rgba(239,68,68,.1)',    icon: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>` },
    explain:   { label: 'Explanation',   color: '#06B6D4', bg: 'rgba(6,182,212,.1)',    icon: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>` },
  };

  // Ordered list for the type-picker sheet
  const TYPE_PICKER_ORDER = [
    'question','equation','hint','concept','explain','test','challenge',
  ];

  function svgIcon(paths, color, size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  }

  /* ── Helpers ────────────────────────────────────────────────────────── */
  function ge(id) { return document.getElementById(id); }
  function toast(msg) { if (typeof window.toast === 'function') window.toast(msg); }

  function timeAgo(ts) {
    if (!ts) return '';
    const ms   = typeof ts === 'number' ? ts : (ts.seconds ? ts.seconds * 1000 : Date.now());
    const diff = Date.now() - ms;
    if (diff < 60000)    return 'just now';
    if (diff < 3600000)  return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return Math.floor(diff / 86400000) + 'd ago';
  }

  function expiryLabel(expiresAt) {
    if (!expiresAt) return '';
    const ms   = typeof expiresAt === 'number' ? expiresAt : expiresAt.seconds * 1000;
    const diff = ms - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `Expires in ${h}h`;
    return `Expires in ${Math.floor(h / 24)}d`;
  }

  function isExpired(unit) {
    if (!unit.expiresAt) return false;
    const ms = typeof unit.expiresAt === 'number' ? unit.expiresAt : unit.expiresAt.seconds * 1000;
    return ms < Date.now();
  }

  function expiresAtFromType(type) {
    const days = TTL_DAYS[type] || 5;
    return Date.now() + days * 86400000;
  }

  function currentUid()  { return window.currentUser?.uid || null; }
  function currentName() { return window.currentUser?.displayName || window.currentUser?.name || 'You'; }

  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ── KaTeX math renderer ────────────────────────────────────────────── */
  function _ensureKatexStyles() {
    if (document.querySelector('link[data-nf-katex]')) return;
    const already = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(l => l.href.includes('katex'));
    if (already) return;
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
    link.setAttribute('data-nf-katex', '1');
    document.head.appendChild(link);
  }
  _ensureKatexStyles();

  const _KATEX_MACROS = {
    '\\R':'\\mathbb{R}',  '\\N':'\\mathbb{N}',  '\\Z':'\\mathbb{Z}',
    '\\Q':'\\mathbb{Q}',  '\\C':'\\mathbb{C}',  '\\F':'\\mathbb{F}',
    '\\P':'\\mathbb{P}',  '\\E':'\\mathbb{E}',  '\\H':'\\mathbb{H}',
    '\\sgn':  '\\operatorname{sgn}',   '\\rank': '\\operatorname{rank}',
    '\\tr':   '\\operatorname{tr}',    '\\Tr':   '\\operatorname{Tr}',
    '\\spann':'\\operatorname{span}',  '\\lcm':  '\\operatorname{lcm}',
    '\\argmin':'{\\operatorname{arg\\,min}}',
    '\\argmax':'{\\operatorname{arg\\,max}}',
    '\\grad': '\\operatorname{grad}',  '\\curl': '\\operatorname{curl}',
    '\\Div':  '\\operatorname{div}',   '\\Res':  '\\operatorname{Res}',
    '\\proj': '\\operatorname{proj}',  '\\diag': '\\operatorname{diag}',
    '\\Prob': '\\mathbb{P}',   '\\Var':'\\operatorname{Var}',
    '\\Cov':  '\\operatorname{Cov}',   '\\Exp': '\\mathbb{E}',
    '\\eps':  '\\varepsilon',  '\\veps':'\\varepsilon',
    '\\vphi': '\\varphi',      '\\vtheta':'\\vartheta',
    '\\d':    '\\mathrm{d}',   '\\ii': '\\mathrm{i}',  '\\ee':'\\mathrm{e}',
    '\\norm': '\\left\\lVert #1 \\right\\rVert',
    '\\abs':  '\\left\\lvert #1 \\right\\rvert',
    '\\inner':'\\left\\langle #1,\\, #2 \\right\\rangle',
    '\\ceil': '\\left\\lceil #1 \\right\\rceil',
    '\\floor':'\\left\\lfloor #1 \\right\\rfloor',
    '\\from': '\\leftarrow',
  };

  const _kBase = {
    throwOnError: false, strict: false, trust: false,
    macros: _KATEX_MACROS, output: 'html',
    minRuleThickness: 0.05, maxSize: Infinity, maxExpand: 1000,
  };
  const _KATEX_INLINE  = Object.assign({}, _kBase, { displayMode: false });
  const _KATEX_DISPLAY = Object.assign({}, _kBase, { displayMode: true  });

  function renderKatex(src, display) {
    if (!window.katex) return esc(src);
    try {
      return window.katex.renderToString(
        String(src).trim(),
        display ? _KATEX_DISPLAY : _KATEX_INLINE
      );
    } catch (e) {
      console.warn('[DISCUSS] KaTeX error:', e.message, '| src:', src);
      return (
        '<span style="color:#f87171;font-family:monospace;font-size:.8em;' +
        'border:1px solid rgba(248,113,113,.4);border-radius:4px;padding:1px 4px;" ' +
        'title="' + esc(e.message) + '">⚠\u202F' + esc(src) + '</span>'
      );
    }
  }

  const _MATH_RE = /(\\\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

  function renderMath(raw) {
    if (raw == null) return '';
    const src = String(raw);
    let html = '', lastIdx = 0, m;
    _MATH_RE.lastIndex = 0;
    while ((m = _MATH_RE.exec(src)) !== null) {
      if (m.index > lastIdx) html += esc(src.slice(lastIdx, m.index));
      lastIdx = m.index + m[0].length;
      const tok = m[0];
      if      (tok === '\\$')         html += '$';
      else if (tok.startsWith('\\[')) html += renderKatex(tok.slice(2, -2), true);
      else if (tok.startsWith('\\(')) html += renderKatex(tok.slice(2, -2), false);
      else if (tok.startsWith('$$'))  html += renderKatex(tok.slice(2, -2), true);
      else                            html += renderKatex(tok.slice(1, -1), false);
    }
    if (lastIdx < src.length) html += esc(src.slice(lastIdx));
    return html;
  }

  /* ── Firebase accessor ──────────────────────────────────────────────── */
  function fx() {
    return window._firebaseModExports || {};
  }
  function db() { return window.db; }
  function canWrite() { return !!db() && !!fx().addDoc && !!currentUid(); }

  /* ═══════════════════════════════════════════════════════════════
     CSS INJECTION
  ════════════════════════════════════════════════════════════════ */
  function injectStyles() {
    if (ge('de-styles')) return;
    const s = document.createElement('style');
    s.id = 'de-styles';
    s.textContent = `
/* ─────────────────────────────────────────────
   TYPE PICKER SHEET (Stage 0 — pick type)
───────────────────────────────────────────── */
.de-picker-ov {
  position: fixed; inset: 0; z-index: 2900;
  background: rgba(0,0,0,.65); backdrop-filter: blur(6px);
  opacity: 0; pointer-events: none;
  transition: opacity .22s ease;
  display: flex; align-items: flex-end;
}
.de-picker-ov.open { opacity: 1; pointer-events: all; }
.de-picker-sheet {
  width: 100%; background: var(--bg-card);
  border-radius: 22px 22px 0 0;
  border: 1px solid var(--border2); border-bottom: none;
  padding: 0 0 36px; transform: translateY(100%);
  transition: transform .3s cubic-bezier(.22,.1,.36,1);
}
.de-picker-ov.open .de-picker-sheet { transform: translateY(0); }
.de-picker-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,.13); margin: 12px auto 0;
}
.de-picker-hdr {
  padding: 16px 18px 6px;
  display: flex; align-items: center; justify-content: space-between;
}
.de-picker-title {
  font-family: var(--font-d); font-size: .9rem;
  font-weight: 800; color: var(--tp); letter-spacing: .3px;
}
.de-picker-close {
  background: var(--bg-input); border: 1px solid var(--border);
  border-radius: 99px; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ts);
}
.de-picker-grid {
  display: grid; grid-template-columns: repeat(2,1fr);
  gap: 10px; padding: 14px 16px 0;
}
@media (min-width:420px) { .de-picker-grid { grid-template-columns: repeat(3,1fr); } }
.de-picker-item {
  display: flex; flex-direction: column; align-items: center;
  gap: 9px; padding: 15px 10px; border-radius: 14px;
  border: 1.5px solid var(--border2); background: var(--bg-surface);
  cursor: pointer; transition: background .14s, border-color .14s, transform .12s;
  -webkit-tap-highlight-color: transparent;
}
.de-picker-item:active { transform: scale(.97); }
.de-picker-ico {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.de-picker-lbl {
  font-size: .72rem; font-weight: 800; letter-spacing: .3px;
  text-align: center; color: var(--ts); line-height: 1.3;
}
.de-picker-desc {
  font-size: .6rem; color: var(--tm); text-align: center;
  line-height: 1.4; margin-top: -4px; letter-spacing: .01em;
}

/* ─────────────────────────────────────────────
   COMPOSE SHEET  (Stage 1 & 2 in one sheet)
───────────────────────────────────────────── */
.de-compose-ov {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(0,0,0,.7); backdrop-filter: blur(4px);
  opacity: 0; pointer-events: none;
  transition: opacity .22s ease;
  display: flex; align-items: flex-end;
}
.de-compose-ov.open { opacity: 1; pointer-events: all; }
.de-compose-sheet {
  width: 100%; max-height: 92dvh; overflow: hidden;
  background: var(--bg-card); border-radius: 22px 22px 0 0;
  border: 1px solid var(--border2); border-bottom: none;
  transform: translateY(100%);
  transition: transform .3s cubic-bezier(.22,.1,.36,1);
  display: flex; flex-direction: column;
}
.de-compose-ov.open .de-compose-sheet { transform: translateY(0); }
.de-compose-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,.13); margin: 12px auto 0; flex-shrink: 0;
}
.de-compose-hdr {
  padding: 14px 16px 12px; flex-shrink: 0;
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--border);
}
.de-compose-type-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 11px; border-radius: 99px;
  font-size: .62rem; font-weight: 800;
  letter-spacing: .7px; text-transform: uppercase;
  flex-shrink: 0;
}
.de-compose-ttl {
  font-family: var(--font-d); font-size: .93rem;
  font-weight: 800; color: var(--tp); flex: 1;
}
.de-compose-step-pip {
  font-size: .59rem; font-weight: 700; color: var(--tm);
  letter-spacing: .3px; white-space: nowrap; flex-shrink: 0;
}
.de-compose-close {
  background: var(--bg-input); border: 1px solid var(--border);
  border-radius: 99px; width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ts); flex-shrink: 0;
}

/* Step wrapper — slides horizontally */
.de-steps-track {
  display: flex; flex: 1; overflow: hidden;
  transition: transform .3s cubic-bezier(.22,.1,.36,1);
}
.de-steps-track.at-step2 { transform: translateX(-100%); }
.de-step-panel {
  width: 100%; flex-shrink: 0;
  overflow-y: auto; padding: 18px 18px 28px;
}
.de-step-panel::-webkit-scrollbar { display: none; }

/* ── Compose form fields ── */
.de-field-lbl {
  font-size: .6rem; font-weight: 800; color: var(--ts);
  letter-spacing: 1px; text-transform: uppercase;
  margin-bottom: 7px; display: block;
}
.de-field-inp {
  width: 100%; background: var(--bg-input);
  border: 1.5px solid var(--border2); border-radius: 11px;
  color: var(--tp); font-family: var(--font-b); font-size: .86rem;
  padding: 11px 14px; margin-bottom: 14px;
  transition: border-color .15s;
  outline: none; resize: none;
}
.de-field-inp:focus { border-color: var(--accent); }
.de-field-inp.mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: .83rem; letter-spacing: .02em; }
.de-field-inp::placeholder { color: var(--tm); }
.de-diff-row { display: flex; gap: 7px; margin-bottom: 14px; }
.de-diff-btn {
  flex: 1; padding: 9px; border-radius: 9px;
  border: 1.5px solid var(--border2);
  background: var(--bg-input); color: var(--ts);
  font-size: .73rem; font-weight: 700; cursor: pointer;
  transition: all .14s; letter-spacing: .3px;
}
.de-diff-btn.sel-easy   { background: rgba(34,197,94,.12); border-color: rgba(34,197,94,.35); color: #4ade80; }
.de-diff-btn.sel-medium { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.35); color: #fbbf24; }
.de-diff-btn.sel-hard   { background: rgba(239,68,68,.12); border-color: rgba(239,68,68,.35); color: #f87171; }
.de-eq-preview {
  background: var(--bg-surface); border: 1px dashed var(--border2);
  border-radius: 10px; padding: 11px 14px 10px;
  margin-bottom: 14px; display: flex; flex-direction: column; gap: 0;
}
.de-eq-preview-text {
  overflow-x: auto; min-height: 26px; color: var(--tp);
}
.de-eq-preview-text .katex-display { margin: 0; }
.de-eq-preview-hint {
  color: var(--tm); font-style: italic; font-size: .82rem;
  font-family: var(--font-b);
}
.de-eq-preview-src {
  display: block; font-family: monospace; font-size: .7rem;
  color: var(--tm); word-break: break-all; margin-top: 6px;
}
.de-eq-preview-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 8px;
}
.de-eq-copy-btn {
  background: rgba(139,92,246,.14); border: 1px solid rgba(139,92,246,.3);
  border-radius: 7px; color: #A78BFA;
  font-size: .67rem; font-weight: 800; padding: 6px 11px;
  cursor: pointer; letter-spacing: .3px; white-space: nowrap;
  flex-shrink: 0; transition: background .14s;
}
.de-eq-copy-btn:hover { background: rgba(139,92,246,.25); }
.de-test-list {
  max-height: 190px; overflow-y: auto;
  background: var(--bg-surface); border: 1.5px solid var(--border2);
  border-radius: 11px; margin-bottom: 14px;
}
.de-test-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 13px; cursor: pointer;
  border-bottom: 1px solid var(--border3);
  transition: background .13s;
}
.de-test-row:last-child { border-bottom: none; }
.de-test-row:hover { background: var(--bg-hover); }
.de-test-row.sel { background: rgba(59,130,246,.1); }
.de-test-row-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: var(--border2); transition: background .13s;
}
.de-test-row.sel .de-test-row-dot { background: var(--accent); }
.de-test-row-title { font-size: .82rem; color: var(--ts); font-weight: 600; flex: 1; }
.de-test-row.sel .de-test-row-title { color: var(--tp); }
.de-test-row-meta { font-size: .65rem; color: var(--tm); }
.de-xp-row { display: flex; gap: 7px; margin-bottom: 14px; }
.de-xp-btn {
  flex: 1; padding: 8px; border-radius: 9px;
  border: 1.5px solid var(--border2); background: var(--bg-input);
  color: var(--ts); font-size: .73rem; font-weight: 700;
  cursor: pointer; transition: all .14s;
}
.de-xp-btn.sel {
  background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.35);
  color: #fbbf24;
}

/* Step 1 footer */
.de-step1-footer {
  flex-shrink: 0; padding: 0 18px 36px;
}
.de-preview-btn {
  width: 100%; padding: 15px;
  background: var(--accent); border: none; border-radius: 12px;
  color: #fff; font-family: var(--font-d); font-size: .9rem; font-weight: 800;
  cursor: pointer; letter-spacing: .3px;
  box-shadow: 0 4px 16px rgba(37,99,235,.28);
  transition: opacity .15s, transform .13s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.de-preview-btn:active { transform: scale(.98); }
.de-compose-ttl-note {
  margin-top: 9px; font-size: .62rem; color: var(--tm);
  text-align: center; line-height: 1.55;
}

/* ─────────────────────────────────────────────
   PREVIEW STEP  (Stage 2)
───────────────────────────────────────────── */
.de-preview-card {
  border-radius: 14px; padding: 15px 16px;
  margin-bottom: 16px;
}
.de-preview-card-hdr {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.de-preview-card-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.de-preview-tag {
  font-size: .6rem; font-weight: 800; letter-spacing: .7px;
  text-transform: uppercase; padding: 3px 9px; border-radius: 99px;
}
.de-preview-diff {
  font-size: .6rem; font-weight: 700; padding: 3px 8px; border-radius: 99px;
}
.de-preview-diff.easy   { background: rgba(34,197,94,.1);  color: #4ade80; }
.de-preview-diff.medium { background: rgba(245,158,11,.1); color: #fbbf24; }
.de-preview-diff.hard   { background: rgba(239,68,68,.1);  color: #f87171; }
.de-preview-expiry { font-size: .63rem; color: var(--tm); }
.de-preview-by {
  font-size: .72rem; color: var(--ts); margin-bottom: 9px;
  display: flex; align-items: center; gap: 5px;
}
.de-preview-by-name { color: var(--tp); font-weight: 700; }
.de-preview-body {
  font-size: .9rem; color: var(--tp); line-height: 1.68; margin-bottom: 10px;
}
.de-preview-eq-block {
  background: rgba(0,0,0,.25); border: 1px solid rgba(139,92,246,.22);
  border-radius: 10px; padding: 12px 14px; margin-bottom: 10px;
}
.de-preview-eq-rendered { overflow-x: auto; text-align: center; color: var(--tp); }
.de-preview-eq-rendered .katex-display { margin: 0; }
.de-preview-eq-src {
  font-family: 'SF Mono','Fira Code',monospace;
  font-size: .7rem; color: var(--tm); word-break: break-all; margin-top: 6px;
}
.de-preview-xp {
  font-family: var(--font-d); font-size: .78rem;
  font-weight: 800; color: #FBBF24; margin-top: 4px;
}

/* Preview back button */
.de-preview-back {
  display: flex; align-items: center; gap: 6px;
  color: var(--ts); font-size: .8rem; font-weight: 700;
  background: none; border: none; cursor: pointer;
  padding: 0 0 14px; letter-spacing: .2px;
}

/* Action buttons */
.de-action-section {
  border-top: 1px solid var(--border); padding-top: 16px; margin-top: 6px;
}
.de-action-title {
  font-size: .6rem; font-weight: 800; color: var(--tm);
  letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;
}
.de-action-btn {
  width: 100%; padding: 14px 16px; border-radius: 12px;
  border: 1.5px solid var(--border2); margin-bottom: 9px;
  cursor: pointer; display: flex; align-items: center; gap: 12px;
  transition: background .14s, border-color .14s;
  background: var(--bg-surface); text-align: left;
}
.de-action-btn:hover { background: var(--bg-hover); border-color: var(--border2); }
.de-action-btn.primary {
  background: var(--accent); border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(37,99,235,.28);
}
.de-action-btn.primary:hover { opacity: .92; }
.de-action-btn-ico {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.de-action-btn.primary .de-action-btn-ico { background: rgba(255,255,255,.15); }
.de-action-btn:not(.primary) .de-action-btn-ico { background: var(--bg-input); }
.de-action-btn-text { flex: 1; }
.de-action-btn-title {
  font-size: .86rem; font-weight: 700; color: var(--tp);
  display: block; margin-bottom: 2px; font-family: var(--font-d);
}
.de-action-btn.primary .de-action-btn-title { color: #fff; }
.de-action-btn-desc { font-size: .68rem; color: var(--ts); line-height: 1.45; }
.de-action-btn.primary .de-action-btn-desc { color: rgba(255,255,255,.72); }
.de-action-btn-arrow { color: var(--ts); flex-shrink: 0; }
.de-action-btn.primary .de-action-btn-arrow { color: rgba(255,255,255,.7); }
.de-action-btn:disabled { opacity: .4; cursor: default; pointer-events: none; }

/* Spinner */
@keyframes de-spin { to { transform: rotate(360deg); } }
.de-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.2);
  border-top-color: white;
  animation: de-spin .6s linear infinite;
  display: inline-block;
}

/* ─────────────────────────────────────────────
   ROOM OVERLAY
───────────────────────────────────────────── */
.de-room-ov {
  position: fixed; inset: 0; z-index: 3100;
  background: var(--bg-chat);
  transform: translateX(100%);
  transition: transform .3s cubic-bezier(.22,.1,.36,1);
  display: flex; flex-direction: column;
}
.de-room-ov.open { transform: translateX(0); }
.de-room-hdr {
  padding: 14px 16px 13px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-sidebar);
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
}
.de-room-back {
  background: none; border: none; color: var(--ts);
  font-size: .9rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 5px;
  padding: 0; letter-spacing: .2px;
}
.de-room-hdr-title {
  font-family: var(--font-d); font-size: .88rem;
  font-weight: 800; color: var(--tp); flex: 1;
}
.de-room-hdr-badge {
  font-size: .58rem; font-weight: 800;
  letter-spacing: .7px; text-transform: uppercase;
  padding: 4px 9px; border-radius: 99px;
}
.de-room-body {
  flex: 1; overflow-y: auto; padding: 14px 16px 12px;
}
.de-room-body::-webkit-scrollbar { display: none; }

/* ── Unit Card (full view in room) ── */
.de-unit-card {
  border-radius: 14px; padding: 15px 16px;
  margin-bottom: 14px; border-left: 3px solid transparent;
}
.de-unit-header {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 11px;
}
.de-unit-meta {
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
}
.de-unit-chapter {
  font-size: .6rem; font-weight: 800; letter-spacing: .7px;
  text-transform: uppercase; padding: 3px 9px; border-radius: 99px;
}
.de-unit-diff {
  font-size: .6rem; font-weight: 700; letter-spacing: .4px;
  padding: 3px 8px; border-radius: 99px;
}
.de-unit-diff.easy   { background: rgba(34,197,94,.1);  color: #4ade80; }
.de-unit-diff.medium { background: rgba(245,158,11,.1); color: #fbbf24; }
.de-unit-diff.hard   { background: rgba(239,68,68,.1);  color: #f87171; }
.de-unit-time { font-size: .65rem; color: var(--tm); }
.de-unit-by {
  font-size: .72rem; color: var(--ts);
  display: flex; align-items: center; gap: 5px; margin-bottom: 9px;
}
.de-unit-by-name { color: var(--tp); font-weight: 700; }
.de-unit-body {
  font-size: .9rem; color: var(--tp); line-height: 1.68;
  margin-bottom: 11px;
}
.de-unit-context {
  font-size: .8rem; color: var(--ts); line-height: 1.5;
  margin-bottom: 9px; font-style: italic;
}
.de-unit-eq-block {
  background: rgba(0,0,0,.3); border: 1px solid rgba(139,92,246,.25);
  border-radius: 10px; padding: 12px 14px;
  margin-bottom: 11px; flex-direction: column; align-items: stretch; gap: 9px;
  display: flex;
}
.de-unit-eq-rendered {
  overflow-x: auto; overflow-y: hidden;
  text-align: center; color: var(--tp); padding: 4px 0;
}
.de-unit-eq-rendered .katex-display { margin: 0; }
.de-unit-eq-footer { display: flex; align-items: center; gap: 8px; }
.de-unit-eq-src {
  font-family: 'SF Mono','Fira Code',monospace;
  font-size: .71rem; color: var(--tm);
  word-break: break-all; flex: 1; letter-spacing: .02em;
}
.de-unit-eq-copy {
  background: rgba(139,92,246,.14); border: 1px solid rgba(139,92,246,.3);
  border-radius: 7px; color: #A78BFA;
  font-size: .65rem; font-weight: 800; padding: 5px 10px;
  cursor: pointer; letter-spacing: .3px; white-space: nowrap; flex-shrink: 0;
}
.de-unit-test-link {
  display: flex; align-items: center; gap: 9px;
  background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.25);
  border-radius: 10px; padding: 11px 13px; margin-bottom: 10px;
  cursor: pointer; transition: background .13s;
}
.de-unit-test-link:hover { background: rgba(245,158,11,.18); }
.de-unit-test-link-title { font-size: .84rem; font-weight: 700; color: var(--tp); flex: 1; }
.de-unit-test-link-arrow { color: var(--ts); font-size: .9rem; }
.de-unit-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; padding-top: 10px;
  border-top: 1px solid var(--border3);
}
.de-unit-expiry { font-size: .62rem; color: var(--tm); }
.de-unit-understood-btn {
  display: flex; align-items: center; gap: 5px;
  background: none; border: 1px solid var(--border3);
  border-radius: 99px; padding: 5px 11px;
  color: var(--tm); font-size: .62rem; font-weight: 700;
  cursor: pointer; transition: all .14s;
}
.de-unit-understood-btn.active {
  border-color: rgba(34,197,94,.3); color: #4ade80;
  background: rgba(34,197,94,.08);
}
.de-challenge-xp {
  font-family: var(--font-d); font-size: .78rem; font-weight: 800;
  color: #FBBF24; margin-top: 5px;
}

/* ── Replies ── */
.de-replies-section { margin-top: 4px; }
.de-replies-hdr {
  font-size: .65rem; font-weight: 800; color: var(--ts);
  letter-spacing: .6px; text-transform: uppercase;
  margin-bottom: 11px; display: flex; align-items: center; gap: 7px;
}
.de-replies-count {
  background: var(--bg-surface); border-radius: 99px;
  padding: 1px 8px; color: var(--tp); font-size: .68rem; font-weight: 800;
}
.de-reply-block { margin-bottom: 14px; }
.de-reply-top {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}
.de-reply-av {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--bg-surface); border: 1px solid var(--border2);
  display: flex; align-items: center; justify-content: center;
  font-size: .6rem; font-weight: 800; color: var(--ts); flex-shrink: 0;
}
.de-reply-name { font-size: .76rem; font-weight: 700; color: var(--tp); }
.de-reply-time { font-size: .63rem; color: var(--tm); margin-left: auto; }
.de-reply-body { font-size: .84rem; color: var(--ts); line-height: 1.62; }
.de-reply-helpful {
  margin-top: 8px; display: flex; align-items: center; gap: 5px;
  background: none; border: 1px solid var(--border3);
  border-radius: 99px; padding: 4px 10px;
  color: var(--tm); font-size: .62rem; font-weight: 700;
  cursor: pointer; transition: all .14s; width: fit-content;
}
.de-reply-helpful.active {
  border-color: rgba(34,197,94,.3); color: #4ade80;
  background: rgba(34,197,94,.08);
}
.de-no-replies {
  text-align: center; padding: 18px 0 10px;
  font-size: .77rem; color: var(--tm);
}

/* ── Reply Composer ── */
.de-room-compose {
  padding: 10px 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--bg-sidebar); flex-shrink: 0;
}
.de-room-compose-row { display: flex; gap: 8px; align-items: flex-end; }
.de-room-compose-input {
  flex: 1; background: var(--bg-input);
  border: 1.5px solid var(--border2); border-radius: 11px;
  color: var(--tp); font-family: var(--font-b); font-size: .84rem;
  padding: 10px 13px; outline: none; resize: none;
  max-height: 90px; transition: border-color .15s; line-height: 1.52;
}
.de-room-compose-input:focus { border-color: var(--accent); }
.de-room-compose-input::placeholder { color: var(--tm); }
.de-room-send {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: var(--accent); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity .14s;
}
.de-room-send:disabled { opacity: .35; cursor: default; }
.de-room-compose-hint {
  font-size: .59rem; color: var(--tm);
  margin-top: 7px; text-align: center; letter-spacing: .03em;
}

/* ── Recent list unit card ── */
.de-recent-card {
  display: flex; align-items: center; gap: 11px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 13px; padding: 12px 14px;
  cursor: pointer; transition: background .14s, border-color .14s;
  position: relative; overflow: hidden;
}
.de-recent-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 0 2px 2px 0;
}
.de-recent-card.type-question::before  { background: #3B82F6; }
.de-recent-card.type-equation::before  { background: #8B5CF6; }
.de-recent-card.type-hint::before      { background: #F59E0B; }
.de-recent-card.type-concept::before   { background: #10B981; }
.de-recent-card.type-test::before      { background: #F59E0B; }
.de-recent-card.type-challenge::before { background: #EF4444; }
.de-recent-card.type-explain::before   { background: #06B6D4; }
.de-recent-card:hover { background: var(--bg-surface); border-color: var(--border2); }
.de-recent-ico {
  width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.de-recent-info { flex: 1; min-width: 0; }
.de-recent-title {
  font-size: .82rem; font-weight: 700; color: var(--tp);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 4px;
}
.de-recent-meta {
  display: flex; align-items: center; gap: 5px;
  font-size: .63rem; color: var(--tm);
}
.de-recent-type-tag {
  font-size: .58rem; font-weight: 800; letter-spacing: .6px;
  text-transform: uppercase; padding: 2px 7px; border-radius: 99px;
}
.de-recent-dot { opacity: .35; }
.de-recent-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
}
.de-recent-replies { font-size: .65rem; color: var(--ts); font-weight: 700; }
.de-recent-time { font-size: .62rem; color: var(--tm); }
.de-recent-loading {
  text-align: center; padding: 20px; color: var(--tm); font-size: .75rem;
}

/* ── KaTeX inside discuss cards ── */
.katex { max-width: 100%; }
.katex-display { overflow-x: auto; overflow-y: hidden; }
.katex-html { vertical-align: middle; }
.de-unit-body .katex,
.de-reply-body .katex,
.de-unit-context .katex,
.de-preview-body .katex { font-size: 1em; }
.de-unit-body .katex-display,
.de-reply-body .katex-display,
.de-preview-body .katex-display { margin: 0.4em 0; overflow-x: auto; }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════════════════════
     TYPE PICKER SHEET  (Stage 0 — optional entry)
  ════════════════════════════════════════════════════════════════ */
  const TYPE_DESCS = {
    question:  'Ask a doubt',
    equation:  'Share LaTeX math',
    hint:      'Request a hint',
    concept:   'Explain a concept',
    explain:   'Full explanation',
    test:      'Share a test',
    challenge: 'Post a problem + XP',
  };

  function injectPickerSheet() {
    if (ge('dePickerOv')) return;
    const ov = document.createElement('div');
    ov.className = 'de-picker-ov';
    ov.id = 'dePickerOv';

    const items = TYPE_PICKER_ORDER.map(type => {
      const m = TYPE_META[type];
      return `
        <button class="de-picker-item" data-type="${type}">
          <div class="de-picker-ico" style="background:${m.bg};">
            ${svgIcon(m.icon, m.color, 20)}
          </div>
          <div class="de-picker-lbl" style="color:${m.color};">${m.label}</div>
          <div class="de-picker-desc">${TYPE_DESCS[type] || ''}</div>
        </button>`;
    }).join('');

    ov.innerHTML = `
      <div class="de-picker-sheet">
        <div class="de-picker-handle"></div>
        <div class="de-picker-hdr">
          <div class="de-picker-title">Start a Study Unit</div>
          <button class="de-picker-close" id="dePickerClose">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="de-picker-grid" id="dePickerGrid">${items}</div>
      </div>`;
    document.body.appendChild(ov);

    ov.addEventListener('click', e => { if (e.target === ov) closePicker(); });
    ge('dePickerClose').addEventListener('click', closePicker);
    ge('dePickerGrid').querySelectorAll('.de-picker-item').forEach(btn => {
      btn.addEventListener('click', () => {
        closePicker();
        setTimeout(() => openCompose(btn.dataset.type), 80);
      });
    });
  }

  function openPicker() {
    ge('dePickerOv')?.classList.add('open');
  }
  function closePicker() {
    ge('dePickerOv')?.classList.remove('open');
  }

  /* ═══════════════════════════════════════════════════════════════
     COMPOSE SHEET  (Stage 1 + Stage 2)
  ════════════════════════════════════════════════════════════════ */
  let _composeType      = null;
  let _diffSel          = 'medium';
  let _xpSel            = '20';
  let _testSelId        = null;
  let _testSelTitle     = null;
  let _composeSubmitting = false;
  let _builtUnitData    = null;   // populated after Stage 1 validation

  function injectComposeSheet() {
    if (ge('deComposeOv')) return;
    const ov = document.createElement('div');
    ov.className = 'de-compose-ov';
    ov.id = 'deComposeOv';
    ov.innerHTML = `
      <div class="de-compose-sheet" id="deComposeSheet">
        <div class="de-compose-handle"></div>
        <div class="de-compose-hdr">
          <div class="de-compose-type-badge" id="deComposeBadge"></div>
          <div class="de-compose-ttl" id="deComposeTtl"></div>
          <div class="de-compose-step-pip" id="deStepPip">Step 1 of 2</div>
          <button class="de-compose-close" id="deComposeClose">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Two-panel slider -->
        <div class="de-steps-track" id="deStepsTrack">

          <!-- Stage 1: Compose Form -->
          <div class="de-step-panel" id="deStep1Panel">
            <div id="deComposeBody"></div>
          </div>

          <!-- Stage 2: Preview + Actions -->
          <div class="de-step-panel" id="deStep2Panel">
            <button class="de-preview-back" id="dePreviewBack">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Edit
            </button>
            <div id="dePreviewCard"></div>
            <div class="de-action-section">
              <div class="de-action-title">Choose how to share</div>
              <button class="de-action-btn primary" id="deActionPublic">
                <div class="de-action-btn-ico">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <div class="de-action-btn-text">
                  <span class="de-action-btn-title">Post to Community</span>
                  <span class="de-action-btn-desc">Visible to all students · auto-expires in ${0} days</span>
                </div>
                <svg class="de-action-btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button class="de-action-btn" id="deActionPrivate">
                <div class="de-action-btn-ico">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div class="de-action-btn-text">
                  <span class="de-action-btn-title">Send to Friends</span>
                  <span class="de-action-btn-desc">Pick up to 3 friends or groups to collaborate privately</span>
                </div>
                <svg class="de-action-btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

        </div><!-- /de-steps-track -->

        <!-- Stage 1 footer (outside the slider so it doesn't scroll away) -->
        <div class="de-step1-footer" id="deStep1Footer">
          <button class="de-preview-btn" id="dePreviewBtn">
            Preview
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div class="de-compose-ttl-note" id="deComposeTtlNote"></div>
        </div>

      </div>`;
    document.body.appendChild(ov);

    ov.addEventListener('click', e => { if (e.target === ov) closeCompose(); });
    ge('deComposeClose').addEventListener('click', closeCompose);
    ge('dePreviewBtn').addEventListener('click', onPreviewClick);
    ge('dePreviewBack').addEventListener('click', goBackToEdit);
    ge('deActionPublic').addEventListener('click', onPublicPost);
    ge('deActionPrivate').addEventListener('click', onPrivateSend);
  }

  function openCompose(type) {
    _composeType      = type;
    _diffSel          = 'medium';
    _xpSel            = '20';
    _testSelId        = null;
    _testSelTitle     = null;
    _composeSubmitting = false;
    _builtUnitData    = null;

    const meta = TYPE_META[type] || TYPE_META.question;

    // Badge
    const badge = ge('deComposeBadge');
    badge.style.background = meta.bg;
    badge.style.color      = meta.color;
    badge.style.border     = `1px solid ${meta.color}44`;
    badge.innerHTML = svgIcon(meta.icon, meta.color, 11) + ' ' + meta.label;

    // Title
    const TITLES = {
      question:  'Ask a Doubt',
      equation:  'Send an Equation',
      hint:      'Request a Hint',
      concept:   'Share a Concept',
      test:      'Share a Test',
      challenge: 'Post a Challenge',
      explain:   'Share an Explanation',
    };
    ge('deComposeTtl').textContent = TITLES[type] || 'New Study Unit';

    // TTL note + public button desc
    const days = TTL_DAYS[type] || 5;
    ge('deComposeTtlNote').textContent = `This unit auto-expires in ${days} day${days !== 1 ? 's' : ''} · no permanent clutter`;
    const pubDesc = ge('deActionPublic')?.querySelector('.de-action-btn-desc');
    if (pubDesc) pubDesc.textContent = `Visible to all students · auto-expires in ${days} days`;

    // Step pip
    ge('deStepPip').textContent = 'Step 1 of 2';

    // Body
    ge('deComposeBody').innerHTML = renderComposeForm(type);
    _wireComposeForm(type);

    // Reset to step 1
    ge('deStepsTrack').classList.remove('at-step2');
    ge('deStep1Footer').style.display = '';

    // Reset action buttons
    _setActionBtnsEnabled(true);

    ge('deComposeOv').classList.add('open');
    setTimeout(() => {
      const firstInput = ge('deComposeBody').querySelector('input,textarea');
      if (firstInput) firstInput.focus();
    }, 350);
  }

  function closeCompose() {
    ge('deComposeOv')?.classList.remove('open');
    // Small delay before resetting so animation plays clean
    setTimeout(() => {
      if (!ge('deComposeOv')?.classList.contains('open')) {
        ge('deStepsTrack')?.classList.remove('at-step2');
        ge('deStep1Footer') && (ge('deStep1Footer').style.display = '');
        ge('deComposeBody') && (ge('deComposeBody').innerHTML = '');
        ge('dePreviewCard') && (ge('dePreviewCard').innerHTML = '');
        _composeSubmitting = false;
        _builtUnitData     = null;
      }
    }, 350);
  }

  function renderComposeForm(type) {
    const chapterField = `
      <label class="de-field-lbl">Chapter / Topic</label>
      <input class="de-field-inp" id="deChapterInp" type="text" placeholder="e.g. Trigonometry, Calculus, Optics…">`;

    if (type === 'question') {
      return `
        ${chapterField}
        <label class="de-field-lbl">Difficulty</label>
        <div class="de-diff-row">
          <button class="de-diff-btn" data-diff="easy">Easy</button>
          <button class="de-diff-btn sel-medium" data-diff="medium">Medium</button>
          <button class="de-diff-btn" data-diff="hard">Hard</button>
        </div>
        <label class="de-field-lbl">Your Doubt</label>
        <textarea class="de-field-inp" id="deBodyInp" rows="4" placeholder="Describe your question clearly. You can include LaTeX using $…$ syntax."></textarea>`;
    }

    if (type === 'hint') {
      return `
        ${chapterField}
        <label class="de-field-lbl">Question Context</label>
        <textarea class="de-field-inp" id="deBodyInp" rows="3" placeholder="What problem are you stuck on?"></textarea>
        <label class="de-field-lbl">What You've Tried <span style="font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>
        <textarea class="de-field-inp" id="deTriedInp" rows="2" placeholder="Showing your work helps get better hints"></textarea>`;
    }

    if (type === 'equation') {
      return `
        ${chapterField}
        <label class="de-field-lbl">LaTeX Equation</label>
        <input class="de-field-inp mono" id="deEqInput" type="text" placeholder="e.g. \\sin^2\\theta + \\cos^2\\theta = 1">
        <div class="de-eq-preview">
          <div class="de-eq-preview-text" id="deEqPreview"><span class="de-eq-preview-hint">Your equation will appear here…</span></div>
          <div class="de-eq-preview-row">
            <span class="de-eq-preview-src" id="deEqPreviewSrc"></span>
            <button class="de-eq-copy-btn" id="deEqCopyBtn">Copy LaTeX</button>
          </div>
        </div>
        <label class="de-field-lbl">Context / Label <span style="font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>
        <input class="de-field-inp" id="deBodyInp" type="text" placeholder="e.g. Wave interference, Pythagorean identity…">`;
    }

    if (type === 'concept') {
      return `
        ${chapterField}
        <label class="de-field-lbl">Concept Title</label>
        <input class="de-field-inp" id="deTitleInp" type="text" placeholder="e.g. What is a surjective function?">
        <label class="de-field-lbl">Explanation</label>
        <textarea class="de-field-inp" id="deBodyInp" rows="4" placeholder="Write a clear, concise explanation. Keep it focused — one concept per card."></textarea>`;
    }

    if (type === 'explain') {
      return `
        ${chapterField}
        <label class="de-field-lbl">Topic Title</label>
        <input class="de-field-inp" id="deTitleInp" type="text" placeholder="e.g. Why does Snell's Law work?">
        <label class="de-field-lbl">Explanation</label>
        <textarea class="de-field-inp" id="deBodyInp" rows="5" placeholder="Walk through the concept step by step. LaTeX supported with $…$ syntax."></textarea>
        <label class="de-field-lbl">Source / Reference <span style="font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>
        <input class="de-field-inp" id="deSourceInp" type="text" placeholder="e.g. NCERT Ch.10, Khan Academy, your notes…">`;
    }

    if (type === 'test') {
      const myTests = _getMyTests();
      const listHtml = myTests.length
        ? myTests.map(t => `
            <div class="de-test-row" data-id="${esc(t.id)}" data-title="${esc(t.title || 'Untitled')}">
              <div class="de-test-row-dot"></div>
              <div class="de-test-row-title">${esc(t.title || 'Untitled Test')}</div>
              <div class="de-test-row-meta">${t.numQ || '?'}Qs</div>
            </div>`).join('')
        : `<div style="padding:14px;text-align:center;font-size:.75rem;color:var(--tm);">No published tests yet.<br>Publish a test first from the Tests tab.</div>`;

      return `
        ${chapterField}
        <label class="de-field-lbl">Select Test to Share</label>
        <div class="de-test-list" id="deTestList">${listHtml}</div>
        <label class="de-field-lbl">Note <span style="font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>
        <textarea class="de-field-inp" id="deBodyInp" rows="2" placeholder="Add context for this test share…"></textarea>`;
    }

    if (type === 'challenge') {
      return `
        ${chapterField}
        <label class="de-field-lbl">Problem Statement</label>
        <textarea class="de-field-inp" id="deBodyInp" rows="4" placeholder="State the problem clearly. LaTeX supported with $…$ syntax."></textarea>
        <label class="de-field-lbl">XP Reward for Correct Solution</label>
        <div class="de-xp-row">
          <button class="de-xp-btn" data-xp="10">+10 XP</button>
          <button class="de-xp-btn sel" data-xp="20">+20 XP</button>
          <button class="de-xp-btn" data-xp="30">+30 XP</button>
          <button class="de-xp-btn" data-xp="50">+50 XP</button>
        </div>`;
    }

    return `${chapterField}
      <label class="de-field-lbl">Content</label>
      <textarea class="de-field-inp" id="deBodyInp" rows="4" placeholder="Write your study unit content…"></textarea>`;
  }

  function _wireComposeForm(type) {
    if (type === 'question' || type === 'hint') {
      ge('deComposeBody').querySelectorAll('.de-diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          _diffSel = btn.dataset.diff;
          ge('deComposeBody').querySelectorAll('.de-diff-btn').forEach(b => b.className = 'de-diff-btn');
          btn.classList.add(`sel-${_diffSel}`);
        });
      });
    }

    if (type === 'equation') {
      const eqInp  = ge('deEqInput');
      const eqPrev = ge('deEqPreview');
      const srcEl  = ge('deEqPreviewSrc');
      const copyBtn = ge('deEqCopyBtn');
      if (eqInp) {
        eqInp.addEventListener('input', () => {
          const val = eqInp.value.trim();
          if (val) {
            eqPrev.innerHTML = renderKatex(val, false);
            if (srcEl) srcEl.textContent = val;
          } else {
            eqPrev.innerHTML = '<span class="de-eq-preview-hint">Your equation will appear here…</span>';
            if (srcEl) srcEl.textContent = '';
          }
        });
      }
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const val = ge('deEqInput')?.value || '';
          if (val) navigator.clipboard.writeText(val).then(() => toast('Equation copied!')).catch(() => {});
        });
      }
    }

    if (type === 'test') {
      ge('deTestList')?.querySelectorAll('.de-test-row').forEach(row => {
        row.addEventListener('click', () => {
          ge('deTestList').querySelectorAll('.de-test-row').forEach(r => r.classList.remove('sel'));
          row.classList.add('sel');
          _testSelId    = row.dataset.id;
          _testSelTitle = row.dataset.title;
        });
      });
    }

    if (type === 'challenge') {
      ge('deComposeBody').querySelectorAll('.de-xp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          _xpSel = btn.dataset.xp;
          ge('deComposeBody').querySelectorAll('.de-xp-btn').forEach(b => b.classList.remove('sel'));
          btn.classList.add('sel');
        });
      });
    }
  }

  function _getMyTests() {
    try { return JSON.parse(localStorage.getItem('nf_my_tests') || '[]'); }
    catch (e) { return []; }
  }

  /* ── Stage 1 → Stage 2 transition ────────────────────────────────── */
  function onPreviewClick() {
    const type    = _composeType;
    if (!type) return;

    const chapter = ge('deChapterInp')?.value.trim() || '';
    const body    = ge('deBodyInp')?.value.trim()    || '';
    const eq      = ge('deEqInput')?.value.trim()    || '';
    const tried   = ge('deTriedInp')?.value.trim()   || '';
    const title   = ge('deTitleInp')?.value.trim()   || '';
    const source  = ge('deSourceInp')?.value.trim()  || '';

    // Validation
    if (type === 'equation' && !eq) { toast('Please enter an equation'); return; }
    if (type === 'test' && !_testSelId) { toast('Please select a test to share'); return; }
    if (type !== 'equation' && type !== 'test' && !body) { toast('Please add some content'); return; }

    // Build unit data snapshot for preview
    const unitData = {
      type,
      chapter:    chapter || 'General',
      body:       body    || '',
      createdBy:  currentName() || 'You',
      uid:        currentUid(),
      createdAt:  Date.now(),
      expiresAt:  expiresAtFromType(type),
      replies:    0,
      understood: 0,
    };

    if (type === 'question' || type === 'hint') unitData.difficulty = _diffSel;
    if (type === 'equation') { unitData.equation = eq; unitData.context = body; }
    if (type === 'concept' || type === 'explain') {
      unitData.title = title || body.slice(0, 50);
      if (type === 'explain') unitData.source = source;
    }
    if (type === 'test') { unitData.testId = _testSelId; unitData.testTitle = _testSelTitle; }
    if (type === 'challenge') unitData.xpReward = parseInt(_xpSel, 10) || 20;
    if (tried) unitData.tried = tried;

    _builtUnitData = unitData;

    // Render preview card
    ge('dePreviewCard').innerHTML = buildPreviewCard(unitData);

    // Slide to step 2
    ge('deStepsTrack').classList.add('at-step2');
    ge('deStep1Footer').style.display = 'none';
    ge('deStepPip').textContent = 'Step 2 of 2';
  }

  function goBackToEdit() {
    ge('deStepsTrack').classList.remove('at-step2');
    ge('deStep1Footer').style.display = '';
    ge('deStepPip').textContent = 'Step 1 of 2';
  }

  function buildPreviewCard(u) {
    const meta   = TYPE_META[u.type] || TYPE_META.question;
    const expiry = expiryLabel(u.expiresAt);

    let bodyHtml = '';
    if (u.type === 'equation') {
      bodyHtml = `
        <div class="de-preview-eq-block">
          <div class="de-preview-eq-rendered">${renderKatex(u.equation || '', true)}</div>
          <div class="de-preview-eq-src">${esc(u.equation || '')}</div>
        </div>
        ${u.context ? `<div style="font-size:.8rem;color:var(--ts);font-style:italic;margin-bottom:8px;">"${renderMath(u.context)}"</div>` : ''}`;
    } else if (u.type === 'challenge') {
      bodyHtml = `
        <div class="de-preview-body">${renderMath(u.body || '')}</div>
        <div class="de-preview-xp">⚡ +${u.xpReward || 20} XP for correct solution</div>`;
    } else if (u.type === 'hint') {
      bodyHtml = `
        <div class="de-preview-body">${renderMath(u.body || '')}</div>
        ${u.tried ? `<div style="margin-top:8px;padding:9px 11px;background:var(--bg-surface);border-radius:9px;font-size:.76rem;color:var(--ts);line-height:1.5;">
          <div style="font-size:.58rem;font-weight:800;color:var(--tm);letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px;">What I've tried</div>
          ${renderMath(u.tried)}
        </div>` : ''}`;
    } else if (u.type === 'explain') {
      bodyHtml = `
        ${u.title ? `<div style="font-size:.88rem;font-weight:800;color:var(--tp);margin-bottom:8px;font-family:var(--font-d);">${esc(u.title)}</div>` : ''}
        <div class="de-preview-body">${renderMath(u.body || '')}</div>
        ${u.source ? `<div style="font-size:.68rem;color:var(--tm);margin-top:4px;">📚 ${esc(u.source)}</div>` : ''}`;
    } else {
      bodyHtml = `<div class="de-preview-body">${renderMath(u.body || '')}</div>`;
    }

    const diffBadge = (u.difficulty && (u.type === 'question' || u.type === 'hint'))
      ? `<span class="de-preview-diff ${u.difficulty}">${u.difficulty}</span>` : '';

    return `
      <div class="de-preview-card" style="background:${meta.bg};border-left:3px solid ${meta.color};">
        <div class="de-preview-card-hdr">
          <div class="de-preview-card-badges">
            <span class="de-preview-tag" style="background:${meta.bg};color:${meta.color};border:1px solid ${meta.color}33;">
              ${esc(u.chapter || 'General')}
            </span>
            ${diffBadge}
          </div>
          <span class="de-preview-expiry">${expiry}</span>
        </div>
        <div class="de-preview-by">By <span class="de-preview-by-name">&nbsp;${esc(u.createdBy || 'You')}</span></div>
        ${bodyHtml}
      </div>`;
  }

  /* ── Stage 2 → Post/Send ──────────────────────────────────────────── */
  function _setActionBtnsEnabled(enabled) {
    const pub = ge('deActionPublic');
    const priv = ge('deActionPrivate');
    if (pub)  pub.disabled  = !enabled;
    if (priv) priv.disabled = !enabled;
  }

  async function onPublicPost() {
    if (_composeSubmitting || !_builtUnitData) return;
    if (!canWrite()) { toast('Sign in to post study units'); return; }

    _composeSubmitting = true;
    _setActionBtnsEnabled(false);

    const btn = ge('deActionPublic');
    const origInner = btn.innerHTML;
    btn.innerHTML = `<div class="de-action-btn-ico"><span class="de-spinner"></span></div><div class="de-action-btn-text"><span class="de-action-btn-title">Posting…</span></div>`;

    try {
      const { addDoc, collection } = fx();
      await addDoc(collection(db(), COL), _builtUnitData);
      toast('✓ Study unit posted to community');
      closeCompose();
      loadRecentUnits(true);
    } catch (e) {
      console.error('[DISCUSS] post error:', e);
      toast('Failed to post — check connection');
      btn.innerHTML = origInner;
      _setActionBtnsEnabled(true);
    }
    _composeSubmitting = false;
  }

  function onPrivateSend() {
    if (!_builtUnitData) return;

    // Build a mathCard-compatible object so openDiscussModal can handle it
    const u = _builtUnitData;
    const cardData = {
      type:        u.type,
      topic:       u.chapter || 'General',
      body:        u.body    || '',
      equation:    u.equation || null,
      context:     u.context  || null,
      title:       u.title    || null,
      difficulty:  u.difficulty || null,
      xpReward:    u.xpReward  || null,
      testId:      u.testId    || null,
      testTitle:   u.testTitle || null,
      source:      u.source    || null,
      tried:       u.tried     || null,
      createdBy:   u.createdBy,
      createdAt:   u.createdAt,
    };

    // Close compose first, then open recipient picker
    closeCompose();

    if (typeof window.openDiscussModal === 'function') {
      setTimeout(() => window.openDiscussModal(cardData), 280);
    } else {
      toast('Sign in and connect with friends to send privately');
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     ROOM OVERLAY
  ════════════════════════════════════════════════════════════════ */
  let _roomUnitId   = null;
  let _roomUnit     = null;
  let _repliesUnsub = null;
  let _myUnderstood = new Set();
  let _myHelpful    = new Set();

  function injectRoomOverlay() {
    if (ge('deRoomOv')) return;
    const ov = document.createElement('div');
    ov.className = 'de-room-ov';
    ov.id = 'deRoomOv';
    ov.innerHTML = `
      <div class="de-room-hdr">
        <button class="de-room-back" id="deRoomBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="de-room-hdr-title" id="deRoomTitle">Discussion</div>
        <div class="de-room-hdr-badge" id="deRoomBadge"></div>
      </div>
      <div class="de-room-body" id="deRoomBody"></div>
      <div class="de-room-compose">
        <div class="de-room-compose-row">
          <textarea class="de-room-compose-input" id="deRoomInput" placeholder="Add a response…" rows="1"></textarea>
          <button class="de-room-send" id="deRoomSend" disabled>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div class="de-room-compose-hint">Responses are academic — be helpful, be clear</div>
      </div>`;
    document.body.appendChild(ov);

    ge('deRoomBack').addEventListener('click', closeRoom);

    const inp  = ge('deRoomInput');
    const send = ge('deRoomSend');
    inp.addEventListener('input', () => {
      send.disabled = !inp.value.trim();
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 90) + 'px';
    });
    send.addEventListener('click', () => submitReply());
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(); }
    });
  }

  function openRoom(unitId, unitData) {
    _roomUnitId = unitId;
    _roomUnit   = unitData;

    const meta = TYPE_META[unitData.type] || TYPE_META.question;

    ge('deRoomTitle').textContent = unitData.chapter || 'Discussion Room';
    const badge = ge('deRoomBadge');
    badge.textContent      = meta.label;
    badge.style.background = meta.bg;
    badge.style.color      = meta.color;
    badge.style.border     = `1px solid ${meta.color}44`;

    const body = ge('deRoomBody');
    body.innerHTML = buildRoomUnitCard(unitData) + `
      <div class="de-replies-section">
        <div class="de-replies-hdr">
          Responses <span class="de-replies-count" id="deRepliesCount">0</span>
        </div>
        <div id="deRepliesList"><div class="de-no-replies">No responses yet — be the first to help!</div></div>
      </div>`;

    const undBtn = ge('deUnderstoodBtn');
    if (undBtn) {
      undBtn.addEventListener('click', () => toggleUnderstood(unitId, unitData));
      if (_myUnderstood.has(unitId)) undBtn.classList.add('active');
    }

    const testLink = ge('deRoomTestLink');
    if (testLink && unitData.testId) {
      testLink.addEventListener('click', () => {
        const tests = _getMyTests().concat(
          JSON.parse(localStorage.getItem('nf_test_explore_cache') || '{}').tests || []
        );
        const t = tests.find(x => x.id === unitData.testId);
        if (t && typeof window.mountTestTaking === 'function') {
          window.mountTestTaking(t);
        } else {
          toast('Test not found locally — browse the Tests tab');
        }
      });
    }

    ge('deRoomOv').classList.add('open');
    loadReplies(unitId);
    _incrementField(unitId, 'views');
  }

  function closeRoom() {
    ge('deRoomOv')?.classList.remove('open');
    if (_repliesUnsub) { _repliesUnsub(); _repliesUnsub = null; }
    _roomUnitId = null;
    _roomUnit   = null;
    ge('deRoomInput').value = '';
    ge('deRoomSend').disabled = true;
  }

  function buildRoomUnitCard(u) {
    const meta   = TYPE_META[u.type] || TYPE_META.question;
    const expiry = expiryLabel(u.expiresAt);

    let bodyHtml = '';
    if (u.type === 'equation') {
      bodyHtml = `
        <div class="de-unit-eq-block">
          <div class="de-unit-eq-rendered">${renderKatex(u.equation || '', true)}</div>
          <div class="de-unit-eq-footer">
            <span class="de-unit-eq-src">${esc(u.equation || '')}</span>
            <button class="de-unit-eq-copy" id="deRoomEqCopy">Copy LaTeX</button>
          </div>
        </div>
        ${u.context ? `<div class="de-unit-context">"${renderMath(u.context)}"</div>` : ''}`;
    } else if (u.type === 'test') {
      bodyHtml = `
        <div class="de-unit-test-link" id="deRoomTestLink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
          <span class="de-unit-test-link-title">${esc(u.testTitle || 'Open Test')}</span>
          <span class="de-unit-test-link-arrow">→</span>
        </div>
        ${u.body ? `<div class="de-unit-body">${renderMath(u.body)}</div>` : ''}`;
    } else if (u.type === 'hint') {
      bodyHtml = `
        <div class="de-unit-body">${renderMath(u.body || '')}</div>
        ${u.tried ? `<div style="margin-top:8px;padding:9px 11px;background:var(--bg-surface);border-radius:9px;font-size:.76rem;color:var(--ts);line-height:1.5;">
          <div style="font-size:.58rem;font-weight:800;color:var(--tm);letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px;">What I've tried</div>
          ${renderMath(u.tried)}
        </div>` : ''}`;
    } else if (u.type === 'challenge') {
      bodyHtml = `
        <div class="de-unit-body">${renderMath(u.body || '')}</div>
        <div class="de-challenge-xp">⚡ +${u.xpReward || 20} XP for correct solution</div>`;
    } else if (u.type === 'explain') {
      bodyHtml = `
        ${u.title ? `<div style="font-size:.95rem;font-weight:800;color:var(--tp);margin-bottom:10px;font-family:var(--font-d);">${esc(u.title)}</div>` : ''}
        <div class="de-unit-body">${renderMath(u.body || '')}</div>
        ${u.source ? `<div style="font-size:.7rem;color:var(--tm);margin-top:4px;">📚 ${esc(u.source)}</div>` : ''}`;
    } else {
      bodyHtml = `<div class="de-unit-body">${renderMath(u.body || '')}</div>`;
    }

    const diffBadge = (u.difficulty && (u.type === 'question' || u.type === 'hint'))
      ? `<span class="de-unit-diff ${u.difficulty}">${u.difficulty}</span>` : '';

    return `
      <div class="de-unit-card" style="background:${meta.bg};border-color:${meta.color}44;border-left-color:${meta.color};">
        <div class="de-unit-header">
          <div class="de-unit-meta">
            <span class="de-unit-chapter" style="background:${meta.bg};color:${meta.color};border:1px solid ${meta.color}33;">
              ${esc(u.chapter || 'General')}
            </span>
            ${diffBadge}
          </div>
          <span class="de-unit-time">${timeAgo(u.createdAt)}</span>
        </div>
        <div class="de-unit-by">By <span class="de-unit-by-name">${esc(u.createdBy || 'Anonymous')}</span></div>
        ${bodyHtml}
        <div class="de-unit-footer">
          <span class="de-unit-expiry">${expiry}</span>
          <button class="de-unit-understood-btn" id="deUnderstoodBtn">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Understood · <span id="deUnderstoodCount">${u.understood || 0}</span>
          </button>
        </div>
      </div>`;
  }

  // Wire equation copy in room (event delegation)
  document.addEventListener('click', e => {
    if (e.target.id === 'deRoomEqCopy' && _roomUnit?.equation) {
      navigator.clipboard.writeText(_roomUnit.equation).then(() => toast('Equation copied!')).catch(() => {});
    }
  });

  function toggleUnderstood(unitId, unit) {
    const btn     = ge('deUnderstoodBtn');
    const countEl = ge('deUnderstoodCount');
    const isActive = _myUnderstood.has(unitId);

    if (isActive) {
      _myUnderstood.delete(unitId);
      btn?.classList.remove('active');
      if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
      _incrementField(unitId, 'understood', -1);
    } else {
      _myUnderstood.add(unitId);
      btn?.classList.add('active');
      if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
      _incrementField(unitId, 'understood', 1);
    }
  }

  async function loadReplies(unitId) {
    if (!db() || !fx().collection) return;
    const { collection, query, orderBy, onSnapshot } = fx();
    if (!onSnapshot) { _loadRepliesFallback(unitId); return; }
    if (_repliesUnsub) _repliesUnsub();
    try {
      const q = query(collection(db(), `${COL}/${unitId}/replies`), orderBy('createdAt', 'asc'));
      _repliesUnsub = onSnapshot(q, snap => {
        renderReplies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    } catch (e) { _loadRepliesFallback(unitId); }
  }

  async function _loadRepliesFallback(unitId) {
    const { getDocs, collection, query, orderBy } = fx();
    if (!getDocs) return;
    try {
      const snap = await getDocs(query(
        collection(db(), `${COL}/${unitId}/replies`), orderBy('createdAt', 'asc')
      ));
      renderReplies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {}
  }

  function renderReplies(replies) {
    const list    = ge('deRepliesList');
    const counter = ge('deRepliesCount');
    if (!list) return;
    if (counter) counter.textContent = replies.length;

    if (!replies.length) {
      list.innerHTML = '<div class="de-no-replies">No responses yet — be the first to help!</div>';
      return;
    }

    list.innerHTML = replies.map(r => {
      const initials = (r.createdBy || 'U').slice(0, 2).toUpperCase();
      const helpful  = _myHelpful.has(r.id);
      return `
        <div class="de-reply-block">
          <div class="de-reply-top">
            <div class="de-reply-av">${initials}</div>
            <div class="de-reply-name">${esc(r.createdBy || 'Anonymous')}</div>
            <div class="de-reply-time">${timeAgo(r.createdAt)}</div>
          </div>
          <div class="de-reply-body">${renderMath(r.body || '')}</div>
          <button class="de-reply-helpful ${helpful ? 'active' : ''}"
            data-rid="${r.id}" data-helpful="${r.helpful || 0}">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Helpful · ${r.helpful || 0}
          </button>
        </div>`;
    }).join('');

    list.querySelectorAll('.de-reply-helpful').forEach(btn => {
      btn.addEventListener('click', () => {
        const rid = btn.dataset.rid;
        const was = _myHelpful.has(rid);
        const cnt = parseInt(btn.dataset.helpful) || 0;
        if (was) {
          _myHelpful.delete(rid);
          btn.classList.remove('active');
          btn.innerHTML = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Helpful · ${Math.max(0, cnt - 1)}`;
          btn.dataset.helpful = Math.max(0, cnt - 1);
        } else {
          _myHelpful.add(rid);
          btn.classList.add('active');
          btn.innerHTML = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Helpful · ${cnt + 1}`;
          btn.dataset.helpful = cnt + 1;
          _incrementReplyField(_roomUnitId, rid, 'helpful', 1);
        }
      });
    });
  }

  async function submitReply() {
    const inp  = ge('deRoomInput');
    const send = ge('deRoomSend');
    const text = inp?.value.trim();
    if (!text || !_roomUnitId) return;
    if (!canWrite()) { toast('Sign in to respond'); return; }

    send.disabled = true;
    inp.value = '';
    inp.style.height = '';

    const { addDoc, collection } = fx();
    try {
      await addDoc(collection(db(), `${COL}/${_roomUnitId}/replies`), {
        body:      text,
        createdBy: currentName(),
        uid:       currentUid(),
        createdAt: Date.now(),
        helpful:   0,
      });
      _incrementField(_roomUnitId, 'replies', 1);
    } catch (e) {
      console.error('[DISCUSS] reply error:', e);
      toast('Failed to post reply');
      inp.value = text;
    }
    send.disabled = false;
  }

  async function _incrementField(unitId, field, delta = 1) {
    const { doc, updateDoc, increment } = fx();
    if (!doc || !updateDoc || !increment) return;
    try { await updateDoc(doc(db(), COL, unitId), { [field]: increment(delta) }); } catch (e) {}
  }

  async function _incrementReplyField(unitId, replyId, field, delta = 1) {
    const { doc, updateDoc, increment } = fx();
    if (!doc || !updateDoc || !increment) return;
    try { await updateDoc(doc(db(), `${COL}/${unitId}/replies`, replyId), { [field]: increment(delta) }); } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════════
     RECENT UNITS FEED
  ════════════════════════════════════════════════════════════════ */
  let _recentLoaded = false;

  async function loadRecentUnits(forceRefresh) {
    const container = ge('discussRecentList');
    if (!container) return;
    if (_recentLoaded && !forceRefresh) return;

    if (!db() || !fx().getDocs) return; // keep static placeholder cards

    container.innerHTML = '<div class="de-recent-loading">Loading…</div>';

    try {
      const { getDocs, collection, query, orderBy, limit } = fx();
      const snap = await getDocs(query(
        collection(db(), COL),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      ));

      const units = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => !isExpired(u));

      if (!units.length) {
        container.innerHTML = `
          <div style="text-align:center;padding:22px 16px;color:var(--tm);font-size:.75rem;line-height:1.65;">
            No study units yet.<br>Be the first to post a question or equation!
          </div>`;
        return;
      }

      container.innerHTML = '';
      units.forEach(u => container.appendChild(buildRecentCard(u)));
      _recentLoaded = true;
    } catch (e) {
      console.warn('[DISCUSS] feed load error:', e);
      // keep static placeholder cards
    }
  }

  function buildRecentCard(u) {
    const meta = TYPE_META[u.type] || TYPE_META.question;
    const card = document.createElement('div');
    card.className = `de-recent-card type-${u.type}`;

    const previewText = u.type === 'equation'
      ? (u.equation || '').slice(0, 55)
      : (u.title || u.body || '').slice(0, 65);

    card.innerHTML = `
      <div class="de-recent-ico" style="background:${meta.bg};">
        ${svgIcon(meta.icon, meta.color, 16)}
      </div>
      <div class="de-recent-info">
        <div class="de-recent-title">${esc(previewText || 'Untitled')}</div>
        <div class="de-recent-meta">
          <span class="de-recent-type-tag" style="background:${meta.bg};color:${meta.color};">${meta.label}</span>
          <span class="de-recent-dot">·</span>
          <span>${esc(u.chapter || 'General')}</span>
          <span class="de-recent-dot">·</span>
          <span>${expiryLabel(u.expiresAt)}</span>
        </div>
      </div>
      <div class="de-recent-right">
        <div class="de-recent-replies">${u.replies || 0} replies</div>
        <div class="de-recent-time">${timeAgo(u.createdAt)}</div>
      </div>`;

    card.addEventListener('click', () => openRoom(u.id, u));
    return card;
  }

  /* ═══════════════════════════════════════════════════════════════
     BOOT  —  window overrides live HERE so they always run AFTER
     ES-module scripts (which are deferred past sync scripts).
  ════════════════════════════════════════════════════════════════ */
  function boot() {
    injectStyles();
    injectPickerSheet();
    injectComposeSheet();
    injectRoomOverlay();

    /* ─────────────────────────────────────────────────────────────
       CRITICAL FIX: assign window._ overrides INSIDE boot()
       ─────────────────────────────────────────────────────────────
       chat.html has a <script type="module"> block that defines
       stub fallbacks for these three functions. Because ES modules
       are deferred, that module executes AFTER discuss-engine.js
       (a sync <script>), so any module-level assignments in this
       file would be silently overwritten by the stubs.

       DOMContentLoaded fires AFTER all module scripts complete,
       so placing the real assignments here guarantees they win.
    ─────────────────────────────────────────────────────────────── */

    window._discussSend = function(type) {
      // 'all' or unrecognised → show type picker
      if (!TYPE_META[type]) { openPicker(); return; }
      openCompose(type);
    };

    window._openDiscussRoom = function(unitId, unitData) {
      if (unitData) {
        openRoom(unitId, unitData);
      } else {
        const { getDoc, doc } = fx();
        if (getDoc && doc && db()) {
          getDoc(doc(db(), COL, unitId))
            .then(snap => {
              if (snap.exists()) openRoom(unitId, { id: snap.id, ...snap.data() });
              else toast('Discussion not found or expired');
            })
            .catch(() => toast('Could not open discussion'));
        } else {
          toast('Connect to Firebase to view discussions');
        }
      }
    };

    window._openDiscussSection = function(section) {
      // Scroll to feed and toast the filter intent
      const labels = {
        questions: 'Questions', tests: 'Tests', challenges: 'Challenges',
        requests: 'Hint Requests', mentors: 'Mentor Posts',
        schedule: 'Scheduled', all: 'All Discussions',
      };
      toast(`Showing ${labels[section] || section}`);
      ge('discussRecentList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Also expose type-picker entry (for a generic "Discuss" FAB)
    window._openDiscussComposer = openPicker;

    // Load recent units once Firebase is ready
    let tries = 0;
    const poll = setInterval(() => {
      if (window.db && window._firebaseModExports) {
        clearInterval(poll);
        loadRecentUnits();
      }
      if (++tries > 30) clearInterval(poll);
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

}());

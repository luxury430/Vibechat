/* ═══════════════════════════════════════════════════════════════════════
   discuss-engine.js  —  NeuroForge Academic DISCUSS System
   ───────────────────────────────────────────────────────────────────────
   Architecture: object-centric, academic, temporary.
   Study units — not social bubbles.

   Firestore collections used:
     community_discuss/{unitId}          — public study units
     community_discuss/{unitId}/replies/{replyId}  — unit thread replies

   Five unit types:
     question   5d  "Ask Doubt"
     equation   5d  "Send Equation"
     hint       1d  "Ask Hint"
     concept    2d  "Concept Card"
     test       3d  "Share Test"
     challenge  2d  "Challenge Card"
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
  //
  //  Supported delimiters (same as TestTakingPage):
  //    $$...$$    display math   \[...\]  display math
  //    $...$      inline math    \(...\)  inline math    \$  literal dollar
  //
  //  renderKatex(src, display) — renders raw LaTeX (no delimiters); used
  //    directly for equation-type units and the compose live-preview.
  //  renderMath(str) — scans free text for all delimiter types and returns
  //    a safe HTML string; used for body text and replies.

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
/* ── Compose Sheet ── */
.de-compose-ov {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(0,0,0,.7); backdrop-filter: blur(4px);
  opacity: 0; pointer-events: none;
  transition: opacity .22s ease;
  display: flex; align-items: flex-end;
}
.de-compose-ov.open { opacity: 1; pointer-events: all; }
.de-compose-sheet {
  width: 100%; max-height: 92dvh; overflow-y: auto;
  background: var(--bg-card); border-radius: 22px 22px 0 0;
  border: 1px solid var(--border2); border-bottom: none;
  padding: 0 0 40px; transform: translateY(100%);
  transition: transform .3s cubic-bezier(.22,.1,.36,1);
}
.de-compose-ov.open .de-compose-sheet { transform: translateY(0); }
.de-compose-sheet::-webkit-scrollbar { display: none; }
.de-compose-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,.13); margin: 12px auto 0;
}
.de-compose-hdr {
  padding: 16px 18px 14px;
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--border);
}
.de-compose-type-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 11px; border-radius: 99px;
  font-size: .62rem; font-weight: 800;
  letter-spacing: .7px; text-transform: uppercase;
}
.de-compose-ttl {
  font-family: var(--font-d); font-size: .95rem;
  font-weight: 800; color: var(--tp); flex: 1;
}
.de-compose-close {
  background: var(--bg-input); border: 1px solid var(--border);
  border-radius: 99px; width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ts); flex-shrink: 0;
}
.de-compose-body { padding: 18px 18px 0; }
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
.de-diff-row {
  display: flex; gap: 7px; margin-bottom: 14px;
}
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
  border-radius: 10px; padding: 11px 14px;
  margin-bottom: 14px; display: flex;
  align-items: center; justify-content: space-between; gap: 10px;
}
.de-eq-preview-text {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: .82rem; color: #A78BFA; flex: 1;
  word-break: break-all;
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
.de-compose-submit {
  margin: 18px 18px 0; width: calc(100% - 36px);
  padding: 15px; background: var(--accent);
  border: none; border-radius: 12px; color: #fff;
  font-family: var(--font-d); font-size: .9rem; font-weight: 800;
  cursor: pointer; letter-spacing: .3px;
  box-shadow: 0 4px 16px rgba(37,99,235,.28);
  transition: opacity .15s, transform .15s;
}
.de-compose-submit:disabled { opacity: .45; cursor: default; }
.de-compose-ttl-note {
  margin: 8px 18px 0; font-size: .64rem; color: var(--tm);
  text-align: center; line-height: 1.55;
}

/* ── Room Overlay ── */
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
.de-unit-eq-block {
  background: rgba(0,0,0,.3); border: 1px solid rgba(139,92,246,.25);
  border-radius: 10px; padding: 12px 14px;
  margin-bottom: 11px;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.de-unit-eq-text {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: .88rem; color: #C084FC; flex: 1;
  word-break: break-all; letter-spacing: .03em;
}
.de-unit-eq-copy {
  background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.28);
  border-radius: 7px; color: #A78BFA;
  font-size: .66rem; font-weight: 800; padding: 6px 11px;
  cursor: pointer; letter-spacing: .3px; flex-shrink: 0;
  transition: background .14s;
}
.de-unit-eq-copy:hover { background: rgba(139,92,246,.28); }
.de-unit-context {
  font-size: .78rem; color: var(--ts);
  font-style: italic; margin-top: 6px; line-height: 1.55;
}
.de-unit-footer {
  display: flex; align-items: center; gap: 9px;
  padding-top: 11px; border-top: 1px solid var(--border3);
}
.de-unit-expiry {
  font-size: .62rem; color: var(--tm); flex: 1;
}
.de-unit-understood-btn {
  display: flex; align-items: center; gap: 5px;
  background: var(--bg-input); border: 1.5px solid var(--border2);
  border-radius: 99px; padding: 5px 12px;
  color: var(--ts); font-size: .68rem; font-weight: 700;
  cursor: pointer; transition: all .15s;
}
.de-unit-understood-btn.active {
  background: rgba(34,197,94,.12); border-color: rgba(34,197,94,.35);
  color: #4ade80;
}
.de-unit-test-link {
  display: flex; align-items: center; gap: 7px;
  background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.25);
  border-radius: 10px; padding: 10px 13px; margin-bottom: 11px; cursor: pointer;
  transition: background .14s;
}
.de-unit-test-link:hover { background: rgba(245,158,11,.18); }
.de-unit-test-link-title { font-size: .83rem; color: #FBBF24; font-weight: 700; flex: 1; }
.de-unit-test-link-arrow { font-size: .75rem; color: #FBBF24; }

/* ── Replies section ── */
.de-replies-section { }
.de-replies-hdr {
  font-size: .6rem; font-weight: 800; color: var(--ts);
  letter-spacing: 1.1px; text-transform: uppercase;
  margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
}
.de-replies-count {
  background: var(--bg-input); border-radius: 99px;
  padding: 2px 8px; color: var(--ts);
  font-size: .6rem; font-weight: 700;
}
.de-reply-block {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; padding: 12px 14px; margin-bottom: 9px;
}
.de-reply-top {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.de-reply-av {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--bg-input); border: 1px solid var(--border2);
  display: flex; align-items: center; justify-content: center;
  font-size: .62rem; font-weight: 800; color: var(--ts);
  flex-shrink: 0; font-family: var(--font-d);
}
.de-reply-name {
  font-size: .77rem; font-weight: 700; color: var(--tp); flex: 1;
}
.de-reply-time { font-size: .62rem; color: var(--tm); }
.de-reply-body {
  font-size: .84rem; color: var(--ts); line-height: 1.62;
}
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
  background: var(--bg-sidebar);
  flex-shrink: 0;
}
.de-room-compose-row {
  display: flex; gap: 8px; align-items: flex-end;
}
.de-room-compose-input {
  flex: 1; background: var(--bg-input);
  border: 1.5px solid var(--border2); border-radius: 11px;
  color: var(--tp); font-family: var(--font-b); font-size: .84rem;
  padding: 10px 13px; outline: none; resize: none;
  max-height: 90px; transition: border-color .15s;
  line-height: 1.52;
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
.de-recent-card.type-question::before { background: #3B82F6; }
.de-recent-card.type-equation::before { background: #8B5CF6; }
.de-recent-card.type-hint::before     { background: #F59E0B; }
.de-recent-card.type-concept::before  { background: #10B981; }
.de-recent-card.type-test::before     { background: #F59E0B; }
.de-recent-card.type-challenge::before { background: #EF4444; }
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
.de-recent-replies {
  font-size: .65rem; color: var(--ts); font-weight: 700;
}
.de-recent-time { font-size: .62rem; color: var(--tm); }
.de-recent-loading {
  text-align: center; padding: 20px; color: var(--tm);
  font-size: .75rem;
}
.de-challenge-xp {
  font-family: var(--font-d); font-size: .78rem; font-weight: 800;
  color: #FBBF24; margin-top: 5px;
}

/* Loader spinner */
@keyframes de-spin { to { transform: rotate(360deg); } }
.de-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.2);
  border-top-color: white;
  animation: de-spin .6s linear infinite;
  display: inline-block;
}

/* ── KaTeX inside discuss cards ── */
.katex { max-width: 100%; }
.katex-display { overflow-x: auto; overflow-y: hidden; }
.katex-html { vertical-align: middle; }

/* Unit body & reply text — inline KaTeX baseline */
.de-unit-body .katex,
.de-reply-body .katex,
.de-unit-context .katex { font-size: 1em; }
.de-unit-body .katex-display,
.de-reply-body .katex-display { margin: 0.4em 0; overflow-x: auto; }

/* Equation-type unit block — rendered display layout */
.de-unit-eq-block { flex-direction: column; align-items: stretch; gap: 9px; }
.de-unit-eq-rendered {
  overflow-x: auto; overflow-y: hidden;
  text-align: center; color: var(--tp); padding: 4px 0;
}
.de-unit-eq-rendered .katex-display { margin: 0; }
.de-unit-eq-footer {
  display: flex; align-items: center; gap: 8px;
}
.de-unit-eq-src {
  font-family: 'SF Mono','Fira Code',monospace;
  font-size: .71rem; color: var(--tm);
  word-break: break-all; flex: 1; letter-spacing: .02em;
}

/* Compose preview — rendered KaTeX + source line */
.de-eq-preview { flex-direction: column; align-items: stretch; justify-content: flex-start; gap: 0; }
.de-eq-preview-text { overflow-x: auto; min-height: 26px; color: var(--tp); }
.de-eq-preview-text .katex-display { margin: 0; }
.de-eq-preview-src {
  display: block; font-family: monospace; font-size: .7rem;
  color: var(--tm); word-break: break-all; margin-top: 6px;
}
.de-eq-preview-hint {
  color: var(--tm); font-style: italic; font-size: .82rem;
  font-family: var(--font-b);
}
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════════════════════
     COMPOSE SHEET
  ════════════════════════════════════════════════════════════════ */
  let _composeType   = null;
  let _diffSel       = 'medium';
  let _xpSel         = '20';
  let _testSelId     = null;
  let _testSelTitle  = null;
  let _composeSubmitting = false;

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
          <button class="de-compose-close" id="deComposeClose">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="de-compose-body" id="deComposeBody"></div>
        <button class="de-compose-submit" id="deComposeSubmit">Post</button>
        <div class="de-compose-ttl-note" id="deComposeTtlNote"></div>
      </div>`;
    document.body.appendChild(ov);

    ov.addEventListener('click', e => { if (e.target === ov) closeCompose(); });
    ge('deComposeClose').addEventListener('click', closeCompose);
    ge('deComposeSubmit').addEventListener('click', onComposeSubmit);
  }

  function openCompose(type) {
    _composeType     = type;
    _diffSel         = 'medium';
    _xpSel           = '20';
    _testSelId       = null;
    _testSelTitle    = null;
    _composeSubmitting = false;

    const meta = TYPE_META[type] || TYPE_META.question;

    // Badge
    const badge = ge('deComposeBadge');
    badge.style.background = meta.bg;
    badge.style.color      = meta.color;
    badge.style.border     = `1px solid ${meta.color}44`;
    badge.innerHTML = svgIcon(meta.icon, meta.color, 11) + ' ' + meta.label;

    // Title
    const titles = {
      question: 'Ask a Doubt', equation: 'Send an Equation',
      hint: 'Request a Hint', concept: 'Share a Concept',
      test: 'Share a Test', challenge: 'Post a Challenge',
    };
    ge('deComposeTtl').textContent = titles[type] || 'New Study Unit';

    // TTL note
    const days = TTL_DAYS[type] || 5;
    ge('deComposeTtlNote').textContent = `This unit will auto-expire in ${days} day${days !== 1 ? 's' : ''} · Focus on learning, not permanence`;

    // Body
    ge('deComposeBody').innerHTML = renderComposeForm(type);
    ge('deComposeSubmit').disabled = false;
    ge('deComposeSubmit').textContent = 'Post';

    // Wire dynamic elements
    if (type === 'question' || type === 'hint') {
      ge('deComposeBody').querySelectorAll('.de-diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          _diffSel = btn.dataset.diff;
          ge('deComposeBody').querySelectorAll('.de-diff-btn').forEach(b => {
            b.className = 'de-diff-btn';
          });
          btn.classList.add(`sel-${_diffSel}`);
        });
      });
    }

    if (type === 'equation') {
      const eqInp  = ge('deEqInput');
      const eqPrev = ge('deEqPreview');
      const copyBtn = ge('deEqCopyBtn');
      if (eqInp) {
        eqInp.addEventListener('input', () => {
          const val = eqInp.value.trim();
          const srcEl = ge('deEqPreviewSrc');
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
          if (val) {
            navigator.clipboard.writeText(val).then(() => toast('Equation copied!')).catch(() => {});
          }
        });
      }
    }

    if (type === 'test') {
      _renderTestList();
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

    ge('deComposeOv').classList.add('open');
    setTimeout(() => {
      const firstInput = ge('deComposeBody').querySelector('input,textarea');
      if (firstInput) firstInput.focus();
    }, 350);
  }

  function closeCompose() {
    ge('deComposeOv')?.classList.remove('open');
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
        <label class="de-field-lbl">What You've Tried</label>
        <textarea class="de-field-inp" id="deTriedInp" rows="2" placeholder="Optional — showing your work helps get better hints"></textarea>`;
    }

    if (type === 'equation') {
      return `
        ${chapterField}
        <label class="de-field-lbl">LaTeX Equation</label>
        <input class="de-field-inp mono" id="deEqInput" type="text" placeholder="e.g. \\sin^2\\theta + \\cos^2\\theta = 1">
        <div class="de-eq-preview">
          <div class="de-eq-preview-text" id="deEqPreview"><span class="de-eq-preview-hint">Your equation will appear here…</span></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
            <span class="de-eq-preview-src" id="deEqPreviewSrc"></span>
            <button class="de-eq-copy-btn" id="deEqCopyBtn">Copy LaTeX</button>
          </div>
        </div>
        <label class="de-field-lbl">Context / Label <span style="font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>
        <input class="de-field-inp" id="deBodyInp" type="text" placeholder="e.g. Wave interference pattern, Pythagorean identity…">`;
    }

    if (type === 'concept') {
      return `
        ${chapterField}
        <label class="de-field-lbl">Concept Title</label>
        <input class="de-field-inp" id="deTitleInp" type="text" placeholder="e.g. What is a surjective function?">
        <label class="de-field-lbl">Explanation</label>
        <textarea class="de-field-inp" id="deBodyInp" rows="4" placeholder="Write a clear, concise explanation. Keep it focused — one concept per card."></textarea>`;
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

  function _renderTestList() {
    const list = ge('deTestList');
    if (!list) return;
    list.querySelectorAll('.de-test-row').forEach(row => {
      row.addEventListener('click', () => {
        list.querySelectorAll('.de-test-row').forEach(r => r.classList.remove('sel'));
        row.classList.add('sel');
        _testSelId    = row.dataset.id;
        _testSelTitle = row.dataset.title;
      });
    });
  }

  function _getMyTests() {
    try { return JSON.parse(localStorage.getItem('nf_my_tests') || '[]'); }
    catch (e) { return []; }
  }

  async function onComposeSubmit() {
    if (_composeSubmitting) return;
    const type = _composeType;
    if (!type) return;

    const chapter = ge('deChapterInp')?.value.trim() || '';
    const body    = ge('deBodyInp')?.value.trim() || '';
    const eq      = ge('deEqInput')?.value.trim()  || '';
    const tried   = ge('deTriedInp')?.value.trim() || '';
    const title   = ge('deTitleInp')?.value.trim() || '';

    // Validation
    if (type === 'equation' && !eq) { toast('Please enter an equation'); return; }
    if (type === 'test'     && !_testSelId) { toast('Please select a test to share'); return; }
    if (type !== 'equation' && type !== 'test' && !body) { toast('Please add some content'); return; }

    if (!canWrite()) {
      toast('Sign in to post study units');
      return;
    }

    _composeSubmitting = true;
    const btn = ge('deComposeSubmit');
    btn.disabled = true;
    btn.innerHTML = `<span class="de-spinner"></span>  Posting…`;

    const unitData = {
      type,
      chapter:    chapter || 'General',
      body:       body    || '',
      createdBy:  currentName(),
      uid:        currentUid(),
      createdAt:  Date.now(),
      expiresAt:  expiresAtFromType(type),
      replies:    0,
      understood: 0,
    };

    if (type === 'question' || type === 'hint') {
      unitData.difficulty = _diffSel;
    }
    if (type === 'equation') {
      unitData.equation = eq;
      unitData.context  = body; // the context label
    }
    if (type === 'concept') {
      unitData.title = title || body.slice(0, 50);
    }
    if (type === 'test') {
      unitData.testId    = _testSelId;
      unitData.testTitle = _testSelTitle;
      unitData.body      = body;
    }
    if (type === 'challenge') {
      unitData.xpReward = parseInt(_xpSel, 10) || 20;
    }

    try {
      const { addDoc, collection } = fx();
      await addDoc(collection(db(), COL), unitData);
      toast('✓ Study unit posted');
      closeCompose();
      loadRecentUnits(true);
    } catch (e) {
      console.error('[DISCUSS] post error:', e);
      toast('Failed to post — check connection');
      btn.disabled = false;
      btn.textContent = 'Post';
    }
    _composeSubmitting = false;
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

    // Header
    ge('deRoomTitle').textContent = unitData.chapter || 'Discussion Room';
    const badge = ge('deRoomBadge');
    badge.textContent  = meta.label;
    badge.style.background = meta.bg;
    badge.style.color      = meta.color;
    badge.style.border     = `1px solid ${meta.color}44`;

    // Body: unit card + replies section
    const body = ge('deRoomBody');
    body.innerHTML = buildRoomUnitCard(unitData) + `
      <div class="de-replies-section">
        <div class="de-replies-hdr">
          Responses <span class="de-replies-count" id="deRepliesCount">0</span>
        </div>
        <div id="deRepliesList"><div class="de-no-replies">No responses yet — be the first to help!</div></div>
      </div>`;

    // Wire understood button
    const undBtn = ge('deUnderstoodBtn');
    if (undBtn) {
      undBtn.addEventListener('click', () => toggleUnderstood(unitId, unitData));
      if (_myUnderstood.has(unitId)) undBtn.classList.add('active');
    }

    // Wire test link
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

    // Load replies
    ge('deRoomOv').classList.add('open');
    loadReplies(unitId);

    // Increment view / update attempts in Firebase silently
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
    const meta  = TYPE_META[u.type] || TYPE_META.question;
    const expiry = expiryLabel(u.expiresAt);

    let bodyHtml = '';
    if (u.type === 'equation') {
      // Show rendered KaTeX prominently; keep raw LaTeX + copy button in footer
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
        ${u.tried ? `<div style="margin-top:8px;padding:9px 11px;background:var(--bg-surface);border-radius:9px;font-size:.76rem;color:var(--ts);">
          <div style="font-size:.58rem;font-weight:800;color:var(--tm);letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px;">What I've tried</div>
          ${renderMath(u.tried)}
        </div>` : ''}`;
    } else if (u.type === 'challenge') {
      bodyHtml = `
        <div class="de-unit-body">${renderMath(u.body || '')}</div>
        <div class="de-challenge-xp">⚡ +${u.xpReward || 20} XP for correct solution</div>`;
    } else {
      // question, concept, and any future types
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

  // Wire eq copy in room
  document.addEventListener('click', e => {
    if (e.target.id === 'deRoomEqCopy' && _roomUnit?.equation) {
      navigator.clipboard.writeText(_roomUnit.equation).then(() => toast('Equation copied!')).catch(() => {});
    }
  });

  function toggleUnderstood(unitId, unit) {
    const btn       = ge('deUnderstoodBtn');
    const countEl   = ge('deUnderstoodCount');
    const isActive  = _myUnderstood.has(unitId);

    if (isActive) {
      _myUnderstood.delete(unitId);
      if (btn) btn.classList.remove('active');
      if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
      _incrementField(unitId, 'understood', -1);
    } else {
      _myUnderstood.add(unitId);
      if (btn) btn.classList.add('active');
      if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
      _incrementField(unitId, 'understood', 1);
    }
  }

  async function loadReplies(unitId) {
    if (!db() || !fx().collection) return;
    const { collection, query, orderBy, onSnapshot } = fx();
    if (!onSnapshot) {
      // fallback: getDocs
      _loadRepliesFallback(unitId);
      return;
    }
    if (_repliesUnsub) _repliesUnsub();
    try {
      const q = query(
        collection(db(), `${COL}/${unitId}/replies`),
        orderBy('createdAt', 'asc')
      );
      _repliesUnsub = onSnapshot(q, snap => {
        const replies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderReplies(replies);
      });
    } catch (e) {
      _loadRepliesFallback(unitId);
    }
  }

  async function _loadRepliesFallback(unitId) {
    const { getDocs, collection, query, orderBy } = fx();
    if (!getDocs) return;
    try {
      const snap = await getDocs(query(
        collection(db(), `${COL}/${unitId}/replies`),
        orderBy('createdAt', 'asc')
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

    // Wire helpful toggles
    list.querySelectorAll('.de-reply-helpful').forEach(btn => {
      btn.addEventListener('click', () => {
        const rid  = btn.dataset.rid;
        const was  = _myHelpful.has(rid);
        const cnt  = parseInt(btn.dataset.helpful) || 0;
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
    inp.value     = '';
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
    try {
      await updateDoc(doc(db(), COL, unitId), { [field]: increment(delta) });
    } catch (e) {}
  }

  async function _incrementReplyField(unitId, replyId, field, delta = 1) {
    const { doc, updateDoc, increment } = fx();
    if (!doc || !updateDoc || !increment) return;
    try {
      await updateDoc(doc(db(), `${COL}/${unitId}/replies`, replyId), { [field]: increment(delta) });
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════════
     RECENT UNITS  —  live feed for the dashboard
  ════════════════════════════════════════════════════════════════ */
  let _recentLoaded = false;

  async function loadRecentUnits(forceRefresh) {
    const container = ge('discussRecentList');
    if (!container) return;
    if (_recentLoaded && !forceRefresh) return;

    if (!db() || !fx().getDocs) {
      // Keep the static placeholder cards — no Firebase yet
      return;
    }

    container.innerHTML = '<div class="de-recent-loading">Loading…</div>';

    try {
      const { getDocs, collection, query, orderBy, limit, where } = fx();
      // Fetch recent non-expired units
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
      // Leave the static placeholder cards
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
     OVERRIDE STUBS  —  replace the do-nothing implementations
  ════════════════════════════════════════════════════════════════ */
  window._discussSend = function(type) {
    openCompose(type);
  };

  window._openDiscussRoom = function(unitId, unitData) {
    if (unitData) {
      openRoom(unitId, unitData);
    } else {
      // Fetch from Firebase first
      const { getDoc, doc } = fx();
      if (getDoc && doc && db()) {
        getDoc(doc(db(), COL, unitId)).then(snap => {
          if (snap.exists()) openRoom(unitId, { id: snap.id, ...snap.data() });
          else toast('Discussion not found or expired');
        }).catch(() => toast('Could not open discussion'));
      }
    }
  };

  window._openDiscussSection = function(section) {
    const labels = {
      questions: 'Questions', tests: 'Tests',
      challenges: 'Challenges', all: 'All Discussions',
    };
    toast(`Showing ${labels[section] || section} — scroll to see recent units`);
    ge('discussRecentList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ═══════════════════════════════════════════════════════════════
     BOOT
  ════════════════════════════════════════════════════════════════ */
  function boot() {
    injectStyles();
    injectComposeSheet();
    injectRoomOverlay();
    // Load recent units once Firebase is ready (poll briefly)
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

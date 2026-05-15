/* ═══════════════════════════════════════════════════════════════════════
   discuss-card-patch.js  —  NeuroForge Private Discuss Card v1
   ───────────────────────────────────────────────────────────────────────
   Adds full premium card rendering to private discuss sends in chat.html.

   HOW TO INSTALL  (one line change to chat.html)
   ───────────────────────────────────────────────
   1.  In appendMsg() function (around line 19599), add this as the
       FIRST LINE inside the function body:

         if (window._nfPatchMsg && window._nfPatchMsg(box, m, c)) return;

   2.  Add this script tag AFTER discuss-engine.js in chat.html:

         <script src="discuss-card-patch.js"></script>

   WHAT THIS DOES
   ──────────────
   • Intercepts any message where mathCard.createdBy exists (meaning it
     came from discuss-engine, not MathBot) and replaces the plain bubble
     with a full premium discuss card identical in style to the preview card.
   • Sender sees: full card with type badge, KaTeX equation, all fields, expiry.
   • Receiver sees: identical card PLUS an "REPLY" button that opens an
     academic reply bottom sheet.
   • Patching window.openDiscussModal to inject a live card preview above
     the contacts list in the Discuss modal.
   • Full KaTeX math rendering (reuses the katex.min.js already loaded by
     chat.html from CDN).

   UNIT TYPES SUPPORTED
   ─────────────────────
     question · equation · hint · concept · test · challenge · explain
═══════════════════════════════════════════════════════════════════════ */

(function _dcPatch() {
  'use strict';

  /* ── Mirror discuss-engine constants ─────────────────────────────── */
  const TYPE_META = {
    question:  { label: 'Question',     color: '#3B82F6', bg: 'rgba(59,130,246,.1)',
      icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
    equation:  { label: 'Equation',     color: '#8B5CF6', bg: 'rgba(139,92,246,.1)',
      icon: '<line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8"/><circle cx="12" cy="12" r="10"/>' },
    hint:      { label: 'Hint Request', color: '#F59E0B', bg: 'rgba(245,158,11,.1)',
      icon: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' },
    concept:   { label: 'Concept Card', color: '#10B981', bg: 'rgba(16,185,129,.1)',
      icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>' },
    test:      { label: 'Test Share',   color: '#F59E0B', bg: 'rgba(245,158,11,.1)',
      icon: '<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>' },
    challenge: { label: 'Challenge',    color: '#EF4444', bg: 'rgba(239,68,68,.1)',
      icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
    explain:   { label: 'Explanation',  color: '#06B6D4', bg: 'rgba(6,182,212,.1)',
      icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' },
  };

  const TTL_DAYS = { question:5, equation:5, hint:1, concept:2, test:3, challenge:2, explain:3 };

  /* ── Mini helpers ─────────────────────────────────────────────────── */
  function _e(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function _svgIco(paths, color, sz=15) {
    return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  }
  function _timeAgo(ts) {
    if (!ts) return '';
    const ms   = typeof ts==='number' ? ts : (ts.seconds ? ts.seconds*1000 : Date.now());
    const diff = Date.now() - ms;
    if (diff < 60000)    return 'just now';
    if (diff < 3600000)  return Math.floor(diff/60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
    return Math.floor(diff/86400000) + 'd ago';
  }
  function _expiryLabel(expiresAt) {
    if (!expiresAt) return '';
    const ms   = typeof expiresAt==='number' ? expiresAt : expiresAt.seconds*1000;
    const diff = ms - Date.now();
    if (diff<=0) return '• Expired';
    const h = Math.floor(diff/3600000);
    if (h<24) return `• Expires in ${h}h`;
    return `• Expires in ${Math.floor(h/24)}d`;
  }
  function _computeExpiry(type, createdAt) {
    const days = TTL_DAYS[type] || 5;
    return (createdAt || Date.now()) + days*86400000;
  }

  /* ── KaTeX — reuse the instance loaded by chat.html ──────────────── */
  const _KM = {
    '\\R':'\\mathbb{R}','\\N':'\\mathbb{N}','\\Z':'\\mathbb{Z}',
    '\\Q':'\\mathbb{Q}','\\C':'\\mathbb{C}','\\F':'\\mathbb{F}',
    '\\E':'\\mathbb{E}','\\d':'\\mathrm{d}','\\ii':'\\mathrm{i}',
    '\\ee':'\\mathrm{e}','\\eps':'\\varepsilon',
    '\\norm':'\\left\\lVert #1 \\right\\rVert',
    '\\abs':'\\left\\lvert #1 \\right\\rvert',
  };
  const _KB = { throwOnError:false, strict:false, trust:false, macros:_KM, output:'html',
                minRuleThickness:0.05, maxSize:Infinity, maxExpand:1000 };

  function _renderKatex(src, display) {
    if (!window.katex) return _e(src);
    try {
      return window.katex.renderToString(String(src).trim(),
        Object.assign({}, _KB, { displayMode: !!display }));
    } catch(err) {
      return `<span style="color:#f87171;font-family:monospace;font-size:.78em;border:1px solid rgba(248,113,113,.35);border-radius:4px;padding:1px 4px;">⚠ ${_e(String(src).slice(0,40))}</span>`;
    }
  }

  const _MTHRE = /(\\\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  function _renderMath(raw) {
    if (raw==null) return '';
    const src = String(raw);
    let html='', last=0, m;
    _MTHRE.lastIndex=0;
    while ((m=_MTHRE.exec(src))!==null) {
      if (m.index>last) html+=_e(src.slice(last,m.index));
      last = m.index+m[0].length;
      const tok=m[0];
      if      (tok==='\\$')         html+='$';
      else if (tok.startsWith('\\[')) html+=_renderKatex(tok.slice(2,-2),true);
      else if (tok.startsWith('\\(')) html+=_renderKatex(tok.slice(2,-2),false);
      else if (tok.startsWith('$$'))  html+=_renderKatex(tok.slice(2,-2),true);
      else                            html+=_renderKatex(tok.slice(1,-1),false);
    }
    if (last<src.length) html+=_e(src.slice(last));
    return html;
  }

  /* ── CSS injection ────────────────────────────────────────────────── */
  function _injectStyles() {
    if (document.getElementById('dc-patch-styles')) return;
    const s = document.createElement('style');
    s.id = 'dc-patch-styles';
    s.textContent = `
/* ─────────────────────────────────────────────────────
   DISCUSS CARD  (private chat bubble)
───────────────────────────────────────────────────── */
.dc-card {
  width: 272px; max-width: 88vw;
  border-radius: 14px; overflow: hidden;
  border: 1px solid var(--border2);
  background: var(--bg-card);
  box-shadow: 0 2px 12px rgba(0,0,0,.3);
  position: relative;
}
.dc-card::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
}
.dc-card-head {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--border3);
}
.dc-type-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 99px;
  font-size: .59rem; font-weight: 800;
  letter-spacing: .65px; text-transform: uppercase;
}
.dc-diff-badge {
  font-size: .57rem; font-weight: 700;
  padding: 2px 7px; border-radius: 99px; margin-left: 4px;
}
.dc-diff-easy   { background:rgba(34,197,94,.1);  color:#4ade80; }
.dc-diff-medium { background:rgba(245,158,11,.1); color:#fbbf24; }
.dc-diff-hard   { background:rgba(239,68,68,.1);  color:#f87171; }
.dc-expiry {
  font-size: .58rem; color: var(--tm); letter-spacing: .02em;
  flex-shrink: 0; margin-left: 6px;
}
.dc-by {
  font-size: .68rem; color: var(--ts);
  padding: 5px 12px 0;
  display: flex; align-items: center; gap: 4px;
}
.dc-by-name { color: var(--tp); font-weight: 700; }
.dc-body {
  padding: 8px 12px 10px;
}
.dc-card-title {
  font-size: .84rem; font-weight: 800; color: var(--tp);
  margin-bottom: 5px; line-height: 1.35;
  font-family: var(--font-d, 'Outfit', sans-serif);
  letter-spacing: .2px;
}
.dc-body-text {
  font-size: .84rem; color: var(--tp); line-height: 1.62;
}
.dc-eq-block {
  background: rgba(0,0,0,.25);
  border: 1px solid rgba(139,92,246,.2);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
}
.dc-eq-rendered {
  overflow-x: auto; text-align: center; color: var(--tp);
  padding: 2px 0;
}
.dc-eq-rendered .katex-display { margin: 0; }
.dc-eq-src {
  font-family: 'SF Mono','Fira Code', monospace;
  font-size: .67rem; color: var(--tm);
  word-break: break-all; margin-top: 5px;
  letter-spacing: .02em;
}
.dc-context {
  font-size: .77rem; color: var(--ts); font-style: italic;
  margin-top: 4px; line-height: 1.5;
}
.dc-tried-block {
  background: var(--bg-surface); border-radius: 8px;
  padding: 7px 10px; margin-top: 7px;
}
.dc-tried-lbl {
  font-size: .55rem; font-weight: 800; color: var(--tm);
  letter-spacing: .8px; text-transform: uppercase; margin-bottom: 3px;
}
.dc-tried-text { font-size: .78rem; color: var(--ts); line-height: 1.5; }
.dc-source {
  font-size: .65rem; color: var(--tm);
  margin-top: 5px;
}
.dc-xp {
  font-size: .78rem; font-weight: 800; color: #FBBF24;
  margin-top: 5px;
  font-family: var(--font-d, 'Outfit', sans-serif);
}
.dc-test-link {
  display: flex; align-items: center; gap: 8px;
  background: rgba(245,158,11,.08);
  border: 1px solid rgba(245,158,11,.22);
  border-radius: 9px; padding: 8px 11px;
  margin-bottom: 6px; cursor: pointer;
  transition: background .13s;
}
.dc-test-link:hover { background: rgba(245,158,11,.16); }
.dc-test-link-title { font-size: .82rem; font-weight: 700; color: var(--tp); flex: 1; }
.dc-test-arrow { font-size: .88rem; color: var(--ts); }

.dc-card-foot {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 7px 12px 9px;
  border-top: 1px solid var(--border3);
}
.dc-chapter {
  font-size: .62rem; color: var(--tm);
  display: flex; align-items: center; gap: 4px;
}
.dc-reply-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; border-radius: 99px;
  background: none;
  border: 1.5px solid var(--border2);
  color: var(--ts); font-size: .65rem; font-weight: 800;
  letter-spacing: .4px; cursor: pointer;
  transition: all .14s; text-transform: uppercase;
  font-family: var(--font-b, 'Plus Jakarta Sans', sans-serif);
}
.dc-reply-btn:hover {
  background: rgba(59,130,246,.1);
  border-color: rgba(59,130,246,.35);
  color: #60A5FA;
}
.dc-reply-btn:active { transform: scale(.96); }

/* mbw override — transparent wrapper for discuss cards */
.mw .dc-mbw-reset {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  padding: 0 !important;
}

/* ─────────────────────────────────────────────────────
   DISCUSS MODAL CARD PREVIEW (above contacts list)
───────────────────────────────────────────────────── */
#dcModalPreview {
  margin: 8px 14px 4px;
  border-radius: 12px;
  border: 1px solid var(--border2);
  overflow: hidden;
  flex-shrink: 0;
}
.dc-mp-head {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 12px 7px;
}
.dc-mp-type-ico {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dc-mp-info { flex: 1; min-width: 0; }
.dc-mp-title {
  font-size: .8rem; font-weight: 800; color: var(--tp);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dc-mp-sub { font-size: .63rem; color: var(--tm); margin-top: 1px; }
.dc-mp-expiry {
  font-size: .58rem; color: var(--tm); flex-shrink: 0;
}
.dc-mp-content {
  border-top: 1px solid var(--border3);
  padding: 7px 12px 9px;
  overflow-x: hidden;
}
.dc-mp-eq { overflow-x: auto; text-align: center; color: var(--tp); }
.dc-mp-eq .katex-display { margin: 4px 0; }
.dc-mp-text {
  font-size: .8rem; color: var(--ts); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}

/* ─────────────────────────────────────────────────────
   EDUCATIONAL REPLY SHEET  (bottom sheet)
───────────────────────────────────────────────────── */
#dcReplyOv {
  position: fixed; inset: 0; z-index: 3200;
  background: rgba(0,0,0,.68); backdrop-filter: blur(5px);
  opacity: 0; pointer-events: none;
  transition: opacity .22s ease;
  display: flex; align-items: flex-end;
}
#dcReplyOv.open { opacity: 1; pointer-events: all; }
#dcReplySheet {
  width: 100%; background: var(--bg-card);
  border-radius: 22px 22px 0 0;
  border: 1px solid var(--border2); border-bottom: none;
  transform: translateY(100%);
  transition: transform .3s cubic-bezier(.22,.1,.36,1);
  display: flex; flex-direction: column;
  max-height: 88dvh;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
#dcReplyOv.open #dcReplySheet { transform: translateY(0); }
.dc-rs-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,.13);
  margin: 12px auto 0; flex-shrink: 0;
}
.dc-rs-head {
  padding: 13px 16px 11px; flex-shrink: 0;
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--border);
}
.dc-rs-type-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 99px;
  font-size: .6rem; font-weight: 800; letter-spacing: .65px;
  text-transform: uppercase; flex-shrink: 0;
}
.dc-rs-head-title {
  font-family: var(--font-d, 'Outfit', sans-serif);
  font-size: .9rem; font-weight: 800; color: var(--tp); flex: 1;
}
.dc-rs-close {
  background: var(--bg-input); border: 1px solid var(--border);
  border-radius: 99px; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ts); flex-shrink: 0;
}
.dc-rs-ref {
  margin: 10px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border2);
  border-radius: 11px; padding: 9px 12px;
  flex-shrink: 0;
}
.dc-rs-ref-lbl {
  font-size: .55rem; font-weight: 800; color: var(--tm);
  letter-spacing: .9px; text-transform: uppercase; margin-bottom: 4px;
}
.dc-rs-ref-content {
  font-size: .79rem; color: var(--ts); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.dc-rs-ref-eq { overflow-x: auto; color: var(--tp); text-align: center; }
.dc-rs-ref-eq .katex-display { margin: 2px 0; font-size: .85em; }
.dc-rs-body {
  padding: 0 14px 0; flex: 1; min-height: 0;
  overflow-y: auto; display: flex; flex-direction: column;
}
.dc-rs-inp-lbl {
  font-size: .6rem; font-weight: 800; color: var(--ts);
  letter-spacing: 1px; text-transform: uppercase;
  margin: 10px 0 7px; display: block;
}
.dc-rs-textarea {
  width: 100%; min-height: 100px; max-height: 200px;
  background: var(--bg-input); border: 1.5px solid var(--border2);
  border-radius: 11px; color: var(--tp);
  font-family: var(--font-b, 'Plus Jakarta Sans', sans-serif);
  font-size: .86rem; padding: 11px 13px; outline: none;
  resize: none; transition: border-color .15s; line-height: 1.6;
}
.dc-rs-textarea:focus { border-color: var(--accent); }
.dc-rs-textarea::placeholder { color: var(--tm); }
.dc-rs-hint {
  font-size: .62rem; color: var(--tm);
  margin: 7px 0 0; line-height: 1.55;
}
.dc-rs-hint code {
  font-family: 'SF Mono','Fira Code',monospace;
  background: var(--bg-surface); border-radius: 4px;
  padding: 1px 5px; font-size: .75em;
  color: var(--ts);
}
/* Preview panel — toggled */
.dc-rs-preview {
  background: var(--bg-surface); border: 1px solid var(--border2);
  border-radius: 10px; padding: 10px 13px; margin-top: 9px;
  display: none;
  font-size: .85rem; color: var(--tp); line-height: 1.65;
  overflow-x: auto;
}
.dc-rs-preview.show { display: block; }
.dc-rs-preview .katex-display { margin: 4px 0; }
.dc-rs-foot {
  flex-shrink: 0; padding: 12px 14px 28px;
  border-top: 1px solid var(--border);
  display: flex; gap: 8px; align-items: center;
  background: var(--bg-card);
}
.dc-rs-preview-btn {
  padding: 11px 16px; border-radius: 11px;
  background: var(--bg-surface); border: 1.5px solid var(--border2);
  color: var(--ts); font-size: .8rem; font-weight: 700;
  cursor: pointer; transition: all .14s; letter-spacing: .2px;
  white-space: nowrap;
}
.dc-rs-preview-btn:hover { background: var(--bg-hover); }
.dc-rs-send-btn {
  flex: 1; padding: 13px 16px; border-radius: 11px;
  background: var(--accent); border: none;
  color: #fff; font-size: .88rem; font-weight: 800;
  cursor: pointer; letter-spacing: .3px;
  font-family: var(--font-d, 'Outfit', sans-serif);
  box-shadow: 0 4px 14px rgba(37,99,235,.3);
  transition: opacity .15s, transform .13s;
  display: flex; align-items: center; justify-content: center; gap: 7px;
}
.dc-rs-send-btn:active { transform: scale(.98); }
.dc-rs-send-btn:disabled { opacity: .4; cursor: default; pointer-events: none; }
`;
    document.head.appendChild(s);
  }

  /* ── Build full discuss card HTML ─────────────────────────────────── */
  function _buildCard(card, isSender, cardUid) {
    const type  = card.type || 'question';
    const meta  = TYPE_META[type] || TYPE_META.question;
    const expAt = card.expiresAt || _computeExpiry(type, card.createdAt);
    const exp   = _expiryLabel(expAt);

    /* header badges */
    let diffBadge = '';
    if (card.difficulty && (type==='question' || type==='hint')) {
      const d = card.difficulty;
      diffBadge = `<span class="dc-diff-badge dc-diff-${d}">${d}</span>`;
    }

    /* main content area */
    let bodyHtml = '';

    if (type === 'equation') {
      const rendered = card.equation ? _renderKatex(card.equation, true) : '';
      bodyHtml = `
        <div class="dc-eq-block">
          <div class="dc-eq-rendered">${rendered}</div>
          ${card.equation ? `<div class="dc-eq-src">${_e(card.equation)}</div>` : ''}
        </div>
        ${card.context ? `<div class="dc-context">"${_renderMath(card.context)}"</div>` : ''}`;

    } else if (type === 'concept' || type === 'explain') {
      bodyHtml = `
        ${card.title ? `<div class="dc-card-title">${_e(card.title)}</div>` : ''}
        <div class="dc-body-text">${_renderMath(card.body||'')}</div>
        ${(type==='explain' && card.source)
          ? `<div class="dc-source">📚 ${_e(card.source)}</div>` : ''}`;

    } else if (type === 'hint') {
      bodyHtml = `
        <div class="dc-body-text">${_renderMath(card.body||'')}</div>
        ${card.tried ? `
          <div class="dc-tried-block">
            <div class="dc-tried-lbl">What I've tried</div>
            <div class="dc-tried-text">${_renderMath(card.tried)}</div>
          </div>` : ''}`;

    } else if (type === 'challenge') {
      bodyHtml = `
        <div class="dc-body-text">${_renderMath(card.body||'')}</div>
        <div class="dc-xp">⚡ +${card.xpReward||20} XP for correct solution</div>`;

    } else if (type === 'test') {
      bodyHtml = `
        ${card.testTitle ? `
          <div class="dc-test-link" onclick="if(window._dcOpenTest)window._dcOpenTest('${_e(card.testId||'')}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
            <span class="dc-test-link-title">${_e(card.testTitle)}</span>
            <span class="dc-test-arrow">→</span>
          </div>` : ''}
        ${card.body ? `<div class="dc-body-text">${_renderMath(card.body)}</div>` : ''}`;

    } else {
      /* question and fallback */
      bodyHtml = `<div class="dc-body-text">${_renderMath(card.body||'')}</div>`;
    }

    /* ── replyTo reference block (only on reply cards) ── */
    let replyToHtml = '';
    if (card.replyTo) {
      const rt     = card.replyTo;
      const rtMeta = TYPE_META[rt.type] || TYPE_META.question;
      let   rtContent = '';
      if (rt.type === 'equation' && rt.body) {
        rtContent = `<span style="font-family:'SF Mono','Fira Code',monospace;font-size:.72rem;color:var(--tm);word-break:break-all;">${_e(rt.body.slice(0,60))}${rt.body.length>60?'…':''}</span>`;
      } else {
        const rtText = (rt.body || rt.title || 'Study card').slice(0, 80);
        rtContent = `<span style="color:var(--ts);font-size:.76rem;">${_e(rtText)}${(rt.body||rt.title||'').length > 80 ? '…' : ''}</span>`;
      }
      replyToHtml = `
        <div style="
          display:flex;align-items:flex-start;gap:7px;
          background:var(--bg-surface);
          border:1px solid rgba(${_hexToRgb(rtMeta.color)},.2);
          border-left:3px solid ${rtMeta.color};
          border-radius:8px;padding:7px 10px;margin-bottom:8px;
        ">
          <div style="flex-shrink:0;margin-top:1px;">${_svgIco(rtMeta.icon, rtMeta.color, 11)}</div>
          <div style="min-width:0;">
            <div style="font-size:.55rem;font-weight:800;color:${rtMeta.color};letter-spacing:.7px;text-transform:uppercase;margin-bottom:2px;">
              ${rtMeta.label} by ${_e(rt.createdBy||'them')}
            </div>
            ${rtContent}
          </div>
        </div>`;
    }

    /* chapter / expiry footer */
    const chapter = card.topic || card.chapter || 'General';

    /* reply button — only for receiver on non-reply cards (prevent infinite chains) */
    const replyBtn = (!isSender && !card.replyTo)
      ? `<button class="dc-reply-btn" onclick="window._dcOpenReply('${cardUid}')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          REPLY
        </button>`
      : '';

    return `
      <div class="dc-card" style="--dc-c:${meta.color};" data-dc-uid="${_e(cardUid)}">
        <style>.dc-card[data-dc-uid="${_e(cardUid)}"]{border-color:rgba(${_hexToRgb(meta.color)},.2);}
        .dc-card[data-dc-uid="${_e(cardUid)}"]::before{background:${meta.color};}
        </style>
        <!-- HEADER -->
        <div class="dc-card-head" style="background:${meta.bg};">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span class="dc-type-badge" style="background:${meta.bg};color:${meta.color};border:1px solid ${meta.color}44;">
              ${_svgIco(meta.icon, meta.color, 11)}
              ${meta.label}
            </span>
            ${diffBadge}
          </div>
          <span class="dc-expiry">${exp}</span>
        </div>
        <!-- SENDER -->
        <div class="dc-by">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span class="dc-by-name">${_e(card.createdBy || 'You')}</span>
          <span style="color:var(--tm);">·</span>
          <span style="color:var(--tm);font-size:.62rem;">${_timeAgo(card.createdAt)}</span>
        </div>
        <!-- BODY -->
        <div class="dc-body">${replyToHtml}${bodyHtml}</div>
        <!-- FOOTER -->
        <div class="dc-card-foot">
          <div class="dc-chapter">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            ${_e(chapter)}
          </div>
          ${replyBtn}
        </div>
      </div>`;
  }

  /* Convert #rrggbb to "r,g,b" for rgba() usage */
  function _hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }

  /* ── appendMsg hook ───────────────────────────────────────────────── */
  /* This is called by appendMsg BEFORE any rendering if present.        */
  /* Return true → skip the original appendMsg entirely.                  */
  window._nfPatchMsg = function(box, m, c) {
    /* Detect discuss-engine card: mathCard with createdBy field (not MathBot) */
    const card = m.mathCard || m.discussCard;
    if (!card) return false;

    /* MathBot cards have 'question' and 'answer'; discuss-engine has 'createdBy' */
    const isDiscussCard = !!(card.createdBy || (card.type && !card.question));
    if (!isDiscussCard) return false;

    const isSender = !!m.s;
    const cardUid  = 'dc_' + String(m.id||Date.now()).replace(/[^a-z0-9]/gi,'_');

    /* Store card data keyed by cardUid so the reply button can retrieve it */
    window._dcCards = window._dcCards || {};
    window._dcCards[cardUid] = card;

    /* Build wrapper (.mw) — same structure as appendMsg */
    const w = document.createElement('div');
    w.className  = 'mw ' + (isSender ? 'sent' : 'received');
    w.dataset.mid = m.id;

    /* Avatar (received only) */
    let avHtml = '';
    if (!isSender) {
      const avStyle = window._buildAvStyle
        ? window._buildAvStyle(c||{})
        : `background:${(c&&c.g)||'#333'}`;
      const avContent = window._buildAvContent
        ? window._buildAvContent(c||{}, 'sm')
        : ((c&&c.ini)||'?');
      avHtml = `<div class="m-av" style="${avStyle};width:26px;height:26px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;overflow:hidden;">${avContent}</div>`;
    }

    /* Sender name in group chats */
    const senderNameH = (window.curIsGroup && !isSender && c && c.name)
      ? `<div style="font-size:.67rem;font-weight:700;color:var(--accent2);margin-bottom:3px;padding-left:2px;">${_e(c.name)}</div>`
      : '';

    /* Tick indicator for sent messages */
    const tickH = isSender ? `
      <span class="m-tick-wrap">
        <span class="m-tick ${m._sending?'sent-tick _sending':(m.seen?'seen-tick':'sent-tick')}" title="${m.seen?'Seen':'Sent'}">
          <svg viewBox="0 0 15 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4.5L4.5 8L10 1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 4.5L8.5 8L14 1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </span>` : '';

    w.innerHTML = `
      ${avHtml}
      <div class="mbw dc-mbw-reset">
        <div class="m-acts">
          <button class="act-b" onclick="window.doReply&&window.doReply('${m.id}','${_e(card.topic||card.chapter||'')} study card')" title="Reply">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          </button>
          ${isSender ? `<button class="act-b del" onclick="window.delMsg&&window.delMsg('${m.id}')" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>` : ''}
        </div>
        ${senderNameH}
        ${_buildCard(card, isSender, cardUid)}
        <div class="m-time" style="display:flex;align-items:center;gap:2px;padding-top:4px;padding-${isSender?'right':'left'}:2px;">
          ${m.formattedTime||''}${tickH}
        </div>
      </div>`;

    /* Insert date separator if crossing to a new day */
    if (m.time) {
      const msgDay = new Date(m.time).toDateString();
      const lastSep = box.querySelector('.date-sep:last-of-type');
      const lastDay = lastSep ? lastSep.dataset.day : null;
      if (msgDay !== lastDay) {
        const sep = document.createElement('div');
        sep.className = 'date-sep';
        sep.dataset.day = msgDay;
        sep.textContent = new Date(m.time).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
        sep.style.cssText = 'text-align:center;font-size:.62rem;color:var(--tm);padding:10px 0 6px;letter-spacing:.5px;user-select:none;';
        box.appendChild(sep);
      }
    }

    box.appendChild(w);

    /* Attach long-press selection if engine is available */
    if (typeof window._attachMsgLongPress === 'function') {
      window._attachMsgLongPress(w);
    }
    /* Attach swipe-to-reply gesture if GesturePhysics is available */
    if (typeof GesturePhysics !== 'undefined' && GesturePhysics.attachReplySwipe) {
      GesturePhysics.attachReplySwipe(w, () => {
        if (window.doReply) window.doReply(m.id, card.topic || card.chapter || 'Study Card');
      });
    }

    return true; /* tell appendMsg to skip its own rendering */
  };

  /* ── Discuss Modal: patch to add card preview ─────────────────────── */
  function _injectModalPreviewSlot() {
    const sheet = document.querySelector('.discuss-sheet');
    if (!sheet || document.getElementById('dcModalPreview')) return;
    const list = document.getElementById('discussList');
    if (!list) return;
    const el = document.createElement('div');
    el.id = 'dcModalPreview';
    el.style.display = 'none';
    sheet.insertBefore(el, list);
  }

  function _renderModalPreview(card) {
    const type = card.type || 'question';
    const meta = TYPE_META[type] || TYPE_META.question;
    const topic = card.topic || card.chapter || 'General';
    const expAt = card.expiresAt || _computeExpiry(type, card.createdAt);
    const exp   = _expiryLabel(expAt);

    let contentHtml = '';
    if (type === 'equation' && card.equation) {
      contentHtml = `<div class="dc-mp-eq">${_renderKatex(card.equation, true)}</div>`;
    } else if (card.title) {
      contentHtml = `<div class="dc-mp-text"><strong>${_e(card.title)}</strong>${card.body?` — ${_e(card.body)}`:''}`;
    } else if (card.body) {
      contentHtml = `<div class="dc-mp-text">${_e(card.body)}</div>`;
    }

    const preview = document.getElementById('dcModalPreview');
    if (!preview) return;
    preview.style.display = '';
    preview.style.background = meta.bg;
    preview.style.borderColor = `${meta.color}33`;
    preview.innerHTML = `
      <div class="dc-mp-head">
        <div class="dc-mp-type-ico" style="background:${meta.bg};">
          ${_svgIco(meta.icon, meta.color, 16)}
        </div>
        <div class="dc-mp-info">
          <div class="dc-mp-title">${meta.label} · ${_e(topic)}</div>
          <div class="dc-mp-sub">by ${_e(card.createdBy||'You')}</div>
        </div>
        <div class="dc-mp-expiry">${exp}</div>
      </div>
      ${contentHtml ? `<div class="dc-mp-content">${contentHtml}</div>` : ''}`;

    /* Also update the modal header title */
    const hdrTitle = document.querySelector('.discuss-hdr-title');
    if (hdrTitle) hdrTitle.innerHTML = `${_svgIco(meta.icon, meta.color, 14)}&nbsp; Share ${meta.label}`;
    const hdrSub = document.querySelector('.discuss-hdr-sub');
    if (hdrSub) hdrSub.textContent = 'Choose up to 3 friends or groups';
    /* Update send button text */
    const btn = document.getElementById('discussSendBtn');
    if (btn) btn.textContent = `Send ${meta.label} →`;
  }

  /* Wrap window.openDiscussModal to inject preview */
  function _patchOpenDiscussModal() {
    const _orig = window.openDiscussModal;
    if (!_orig || _orig._dcPatched) return;

    window.openDiscussModal = function(cardData) {
      /* Add expiresAt if missing (discuss-engine may not have included it) */
      if (!cardData.expiresAt && cardData.type) {
        cardData.expiresAt = _computeExpiry(cardData.type, cardData.createdAt);
      }
      /* Store for reply use */
      window._dcPendingCard = cardData;

      /* Call original to populate contacts */
      _orig(cardData);

      /* Inject / update the card preview in the modal */
      _injectModalPreviewSlot();
      _renderModalPreview(cardData);
    };
    window.openDiscussModal._dcPatched = true;
  }

  /* ── Educational Reply Sheet ─────────────────────────────────────── */
  let _replyCard   = null;   /* card data for current reply */
  let _replyCardUid = null;  /* dc_* uid */

  function _injectReplySheet() {
    if (document.getElementById('dcReplyOv')) return;
    const ov = document.createElement('div');
    ov.id = 'dcReplyOv';
    ov.innerHTML = `
      <div id="dcReplySheet">
        <div class="dc-rs-handle"></div>
        <div class="dc-rs-head">
          <span class="dc-rs-type-badge" id="dcRsTypeBadge"></span>
          <div class="dc-rs-head-title">Academic Reply</div>
          <button class="dc-rs-close" id="dcRsClose" title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="dc-rs-ref" id="dcRsRef">
          <div class="dc-rs-ref-lbl">Replying to</div>
          <div class="dc-rs-ref-content" id="dcRsRefContent"></div>
        </div>
        <div class="dc-rs-body">
          <label class="dc-rs-inp-lbl" for="dcRsTextarea">Your Academic Response</label>
          <textarea id="dcRsTextarea" class="dc-rs-textarea" rows="4"
            placeholder="Write your explanation, solution, or answer here…
LaTeX is supported: $x^2$ for inline, $$E=mc^2$$ for display."></textarea>
          <div class="dc-rs-hint">
            💡 Keep it educational — explain clearly, show your steps.
            LaTeX: <code>$x^2 + y^2 = r^2$</code> · Display: <code>$$\\int_0^\\infty e^{-x}\\,dx$$</code>
          </div>
          <div class="dc-rs-preview" id="dcRsPreview"></div>
        </div>
        <div class="dc-rs-foot">
          <button class="dc-rs-preview-btn" id="dcRsPreviewBtn">Preview</button>
          <button class="dc-rs-send-btn" id="dcRsSendBtn" disabled>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send Academic Reply
          </button>
        </div>
      </div>`;
    document.body.appendChild(ov);

    /* Wire events */
    document.getElementById('dcRsClose').addEventListener('click', _closeReply);
    ov.addEventListener('click', e => { if (e.target === ov) _closeReply(); });

    const ta   = document.getElementById('dcRsTextarea');
    const send = document.getElementById('dcRsSendBtn');
    const prev = document.getElementById('dcRsPreviewBtn');
    const prevPanel = document.getElementById('dcRsPreview');

    ta.addEventListener('input', () => {
      send.disabled = !ta.value.trim();
      /* Auto-resize */
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
      /* If preview is open, refresh it live */
      if (prevPanel.classList.contains('show') && ta.value.trim()) {
        prevPanel.innerHTML = _renderMath(ta.value);
      }
    });

    let _previewOpen = false;
    prev.addEventListener('click', () => {
      _previewOpen = !_previewOpen;
      const txt = ta.value.trim();
      if (_previewOpen && txt) {
        prevPanel.innerHTML = _renderMath(txt);
        prevPanel.classList.add('show');
        prev.textContent = 'Hide Preview';
      } else {
        prevPanel.classList.remove('show');
        prev.textContent = 'Preview';
        _previewOpen = false;
      }
    });

    send.addEventListener('click', _sendReply);
  }

  /* Open the reply sheet for a specific card */
  window._dcOpenReply = function(cardUid) {
    _replyCard    = (window._dcCards && window._dcCards[cardUid]) || null;
    _replyCardUid = cardUid;
    if (!_replyCard) return;

    const type = _replyCard.type || 'question';
    const meta = TYPE_META[type] || TYPE_META.question;

    /* Type badge */
    const badge = document.getElementById('dcRsTypeBadge');
    if (badge) {
      badge.style.background = meta.bg;
      badge.style.color      = meta.color;
      badge.style.border     = `1px solid ${meta.color}44`;
      badge.innerHTML = _svgIco(meta.icon, meta.color, 10) + ' ' + meta.label;
    }

    /* Reference panel */
    const refContent = document.getElementById('dcRsRefContent');
    if (refContent) {
      if (type === 'equation' && _replyCard.equation) {
        refContent.className = 'dc-rs-ref-eq';
        refContent.innerHTML = _renderKatex(_replyCard.equation, false);
      } else {
        refContent.className = 'dc-rs-ref-content';
        const summary = _replyCard.title || _replyCard.body || 'Study card';
        refContent.textContent = String(summary).slice(0, 100) + (String(summary).length > 100 ? '…' : '');
      }
    }

    /* Reset textarea & preview */
    const ta = document.getElementById('dcRsTextarea');
    if (ta) { ta.value = ''; ta.style.height = 'auto'; }
    const send = document.getElementById('dcRsSendBtn');
    if (send) send.disabled = true;
    const prev = document.getElementById('dcRsPreviewBtn');
    if (prev) prev.textContent = 'Preview';
    const prevPanel = document.getElementById('dcRsPreview');
    if (prevPanel) prevPanel.classList.remove('show');

    document.getElementById('dcReplyOv').classList.add('open');
    setTimeout(() => ta && ta.focus(), 320);
  };

  function _closeReply() {
    document.getElementById('dcReplyOv')?.classList.remove('open');
    _replyCard    = null;
    _replyCardUid = null;
  }

  async function _sendReply() {
    const ta   = document.getElementById('dcRsTextarea');
    const send = document.getElementById('dcRsSendBtn');
    const text = ta?.value.trim();
    if (!text || !_replyCard) return;

    send.disabled = true;
    send.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg> Sending…`;

    try {
      const origCard = _replyCard;
      const origType = origCard.type || 'question';
      const origMeta = TYPE_META[origType] || TYPE_META.question;
      const topic    = origCard.topic || origCard.chapter || 'General';

      /* ── Build the reply discuss card ── */
      /* Type is always 'explain' — the reply is an academic explanation/answer */
      const replyCard = {
        type:      'explain',
        body:      text,
        topic:     topic,
        createdBy: (window.currentUser?.displayName || window.currentUser?.email || 'You'),
        createdAt: Date.now(),
        /* Embed compact reference to the original card so _buildCard can render it */
        replyTo: {
          type:      origType,
          body:      origCard.equation || origCard.body || origCard.title || '',
          topic:     topic,
          createdBy: origCard.createdBy || 'them',
        },
      };

      /* ── Resolve Firebase write ops ── */
      /* Try window._nfAllOps first (NeuroBridge path), then _firebaseModExports fallback */
      const _ops = window._nfAllOps || window._firebaseModExports;
      if (!_ops?.setDoc || !_ops?.doc || !window.db || !window.currentUser) {
        throw new Error('Firebase not ready — cannot send reply card');
      }
      const { setDoc, doc: fsDoc } = _ops;

      const chatId  = window.curChatId;
      const isGroup = !!window.curIsGroup;
      if (!chatId) throw new Error('No active chat open');

      /* ── Generate a stable client message ID ── */
      const clientMsgId = window._genClientMsgId
        ? window._genClientMsgId()
        : ('dcr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));

      /* ── Build message payload — identical shape to original card send ── */
      const msgData = {
        sender:      window.currentUser.uid,
        time:        Date.now(),
        fwd:         false,
        seen:        false,
        mathCard:    replyCard,      /* ← key field: _nfPatchMsg detects this */
        text:        '\uD83D\uDCDD Reply: ' + topic,
        clientMsgId,
      };

      /* ── Write to messages/{chatId}/msgs/{clientMsgId} ── */
      await setDoc(fsDoc(window.db, 'messages', chatId, 'msgs', clientMsgId), msgData);

      /* ── Update chat / group preview ── */
      const previewRef = isGroup
        ? fsDoc(window.db, 'groups', chatId)
        : fsDoc(window.db, 'chats',  chatId);
      await setDoc(previewRef, {
        lastMsg:   '\uD83D\uDCDD Reply: ' + topic,
        updatedAt: Date.now(),
      }, { merge: true });

      /* ── Clear any stale reply-input state left from doReply() ── */
      const replyBar = document.getElementById('replyBar') || document.getElementById('msgReplyBar');
      if (replyBar) replyBar.style.display = 'none';
      if (typeof window._clearReply === 'function') window._clearReply();

      _closeReply();
      if (typeof window.toast === 'function') window.toast('Academic reply sent \u2713');

    } catch (e) {
      console.error('[dcPatch] reply card send error:', e);
      if (typeof window.toast === 'function') window.toast('Failed to send reply \u2014 ' + (e.message || 'unknown error'));
      send.disabled  = false;
      send.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Academic Reply`;
    }
  }

  /* ── Test link opener (optional — delegates to window.mountTestTaking) */
  window._dcOpenTest = function(testId) {
    if (!testId) return;
    try {
      const tests = JSON.parse(localStorage.getItem('nf_my_tests')||'[]')
                  .concat(JSON.parse(localStorage.getItem('nf_test_explore_cache')||'{}').tests||[]);
      const t = tests.find(x => x.id === testId);
      if (t && typeof window.mountTestTaking === 'function') {
        window.mountTestTaking(t);
      } else {
        if (typeof window.toast==='function') window.toast('Test not found locally — browse Tests tab');
      }
    } catch(e) {}
  };

  /* ── Boot ─────────────────────────────────────────────────────────── */
  function _boot() {
    _injectStyles();
    _injectReplySheet();
    _injectModalPreviewSlot();
    _patchOpenDiscussModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    _boot();
  }

  /* Re-apply patch to window.openDiscussModal after any module defer */
  window.addEventListener('load', _patchOpenDiscussModal);

}());

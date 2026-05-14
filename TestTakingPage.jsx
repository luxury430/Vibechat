// ═══════════════════════════════════════════════════════════════════════
//  TestTakingPage.jsx  —  NeuroForge Test Player
//
//  Loaded by chat.html via:
//    <script type="text/babel" src="TestTakingPage.jsx" data-presets="react">
//
//  Entry point:  window.mountTestTaking(testData)
//  Exit:         window.unmountTestTaking()
//
//  testData shape (from Firestore community_tests):
//    { id, title, chapter, numQ, xpPerQ, createdBy,
//      questions: [{ question, options:{A,B,C,D}, correct }] }
//
//  Fixes applied:
//    1. Layered memo architecture  — no full-screen rerenders on answer click
//    2. XSS-safe math renderer     — KaTeX with $$ \[ \( delimiters, macros, error badges
//    3. useRef answer store        — no object spread / GC churn
//    4. Session persistence        — auto-save snapshot every 10 s to localStorage
//    5. Anti-cheat timing          — startedAt, activeDuration, tabLosses, suspicious flag
//    6. Results: wrong-first       — collapsed correct answers, lazy reveal
//    7. Offline attempt queue      — pendingAttempts → Firebase when online
//    8. KaTeX preload cache        — prev / current / next questions pre-parsed
// ═══════════════════════════════════════════════════════════════════════

(() => {
  const init = () => {
    if (!window.React || !window.ReactCreateRoot) { setTimeout(init, 50); return; }

    const { useState, useEffect, useCallback, useRef, memo } = window.React;


    /* ══════════════════════════════════════════════════════════════════
       ISSUE 2 ─ XSS-SAFE MATH RENDERER  (enhanced KaTeX edition)

       Supported delimiters:
         $$...$$          display math  (standard Markdown/LaTeX)
         $...$            inline math   (standard Markdown/LaTeX)
         \[...\]          display math  (classic LaTeX)
         \(...\)          inline math   (classic LaTeX)
         \$               escaped dollar sign → literal "$"

       Professional macros pre-loaded:
         Number sets  →  \R \N \Z \Q \C \F \P \E \H
         Operators    →  \sgn \rank \tr \Tr \span \lcm \argmin \argmax
                         \grad \curl \div \Res \proj \diag \vol
         Arrows       →  \from  (\leftarrow shorthand)
         Abbreviations → \eps \veps \vphi \vtheta \d \ii \ee
         Norms        →  \norm{x}  \abs{x}  \inner{a}{b}  \ceil{x}  \floor{x}
         Probability  →  \Prob  \Var  \Cov  \Exp
    ════════════════════════════════════════════════════════════════════ */

    // ── 2a. Ensure KaTeX stylesheet is present ───────────────────────
    function ensureKatexStyles() {
      if (document.querySelector('link[data-nf-katex]')) return;
      // Try to detect KaTeX CSS already loaded via any <link>
      const already = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .some(l => l.href.includes('katex'));
      if (already) return;
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
      link.setAttribute('data-nf-katex', '1');
      document.head.appendChild(link);
    }
    ensureKatexStyles();

    // ── 2a-ii. KaTeX layout tweaks injected once ─────────────────────
    (function injectKatexCardStyles() {
      if (document.querySelector('style[data-nf-katex-card]')) return;
      const s = document.createElement('style');
      s.setAttribute('data-nf-katex-card', '1');
      s.textContent = `
        /* Display-math blocks inside test cards */
        .katex-display {
          margin: 0.55em 0;
          overflow-x: auto;
          overflow-y: hidden;
        }
        /* Prevent KaTeX from blowing past card width */
        .katex { font-size: 1.05em; max-width: 100%; }
        .katex-display > .katex { max-width: 100%; overflow-x: auto; }
        /* Inline math baseline alignment */
        .katex-html { vertical-align: middle; }
        /* Error badge consistent with NeuroForge palette */
        .nf-katex-err {
          color: #f87171;
          font-family: monospace;
          font-size: .8em;
          border: 1px solid rgba(248,113,113,.4);
          border-radius: 4px;
          padding: 1px 4px;
        }
      `;
      document.head.appendChild(s);
    })();

    // ── 2b. Professional macro library ──────────────────────────────
    const KATEX_MACROS = {
      // Number / field sets
      '\\R':      '\\mathbb{R}',
      '\\N':      '\\mathbb{N}',
      '\\Z':      '\\mathbb{Z}',
      '\\Q':      '\\mathbb{Q}',
      '\\C':      '\\mathbb{C}',
      '\\F':      '\\mathbb{F}',
      '\\P':      '\\mathbb{P}',
      '\\E':      '\\mathbb{E}',
      '\\H':      '\\mathbb{H}',
      // Named operators
      '\\sgn':    '\\operatorname{sgn}',
      '\\rank':   '\\operatorname{rank}',
      '\\tr':     '\\operatorname{tr}',
      '\\Tr':     '\\operatorname{Tr}',
      '\\spann':  '\\operatorname{span}',   // \span is reserved in TeX
      '\\lcm':    '\\operatorname{lcm}',
      '\\argmin': '{\\operatorname{arg\\,min}}',
      '\\argmax': '{\\operatorname{arg\\,max}}',
      '\\grad':   '\\operatorname{grad}',
      '\\curl':   '\\operatorname{curl}',
      '\\Div':    '\\operatorname{div}',
      '\\Res':    '\\operatorname{Res}',
      '\\proj':   '\\operatorname{proj}',
      '\\diag':   '\\operatorname{diag}',
      '\\vol':    '\\operatorname{vol}',
      // Probability / statistics
      '\\Prob':   '\\mathbb{P}',
      '\\Var':    '\\operatorname{Var}',
      '\\Cov':    '\\operatorname{Cov}',
      '\\Exp':    '\\mathbb{E}',
      // Greek shortcuts
      '\\eps':    '\\varepsilon',
      '\\veps':   '\\varepsilon',
      '\\vphi':   '\\varphi',
      '\\vtheta': '\\vartheta',
      // Upright math constants
      '\\d':      '\\mathrm{d}',
      '\\ii':     '\\mathrm{i}',
      '\\ee':     '\\mathrm{e}',
      // Paired delimiters  (usage: \norm{x}  \abs{x}  etc.)
      '\\norm':   '\\left\\lVert #1 \\right\\rVert',
      '\\abs':    '\\left\\lvert #1 \\right\\rvert',
      '\\inner':  '\\left\\langle #1,\\, #2 \\right\\rangle',
      '\\ceil':   '\\left\\lceil #1 \\right\\rceil',
      '\\floor':  '\\left\\lfloor #1 \\right\\rfloor',
      // Arrows
      '\\from':   '\\leftarrow',
    };

    // ── 2c. Shared KaTeX option objects (created once, reused every call) ──
    const _katexBase = {
      throwOnError:    false,
      strict:          false,
      trust:           false,
      macros:          KATEX_MACROS,
      output:          'html',        // pure HTML — no MathML fallback overhead
      minRuleThickness: 0.05,
      maxSize:         Infinity,
      maxExpand:       1000,
    };
    const KATEX_OPT_INLINE  = Object.assign({}, _katexBase, { displayMode: false });
    const KATEX_OPT_DISPLAY = Object.assign({}, _katexBase, { displayMode: true  });

    // ── 2d. Core render helpers ──────────────────────────────────────
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderKatex(src, display) {
      if (!window.katex) return escapeHtml(src);
      try {
        return window.katex.renderToString(
          src.trim(),
          display ? KATEX_OPT_DISPLAY : KATEX_OPT_INLINE
        );
      } catch (e) {
        // Show a styled error badge instead of silently losing the expression
        console.warn('[NeuroForge] KaTeX error:', e.message, '| src:', src);
        return (
          '<span style="color:#f87171;font-family:monospace;font-size:.8em;' +
          'border:1px solid rgba(248,113,113,.4);border-radius:4px;padding:1px 4px;" ' +
          'title="' + escapeHtml(e.message) + '">⚠\u202F' + escapeHtml(src) + '</span>'
        );
      }
    }

    // ── 2e. Multi-delimiter math parser ─────────────────────────────
    // Matches (in priority order):
    //   \$                    → escaped dollar  (must come first)
    //   \[...\]               → display block
    //   \(...\)               → inline
    //   $$...$$               → display block   (must come before $...$)
    //   $...$                 → inline
    const _MATH_RE = /(\\\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

    function safeParseMath(raw) {
      if (raw == null) return { __html: '' };
      const src = String(raw);
      let   html = '';
      let   lastIdx = 0;
      let   m;

      _MATH_RE.lastIndex = 0; // reset stateful regex before each parse

      while ((m = _MATH_RE.exec(src)) !== null) {
        // Append escaped plain text segment before this math token
        if (m.index > lastIdx) html += escapeHtml(src.slice(lastIdx, m.index));
        lastIdx = m.index + m[0].length;

        const tok = m[0];
        if (tok === '\\$') {
          html += '$';                                       // literal dollar
        } else if (tok.startsWith('\\[')) {
          html += renderKatex(tok.slice(2, -2), true);      // \[...\] display
        } else if (tok.startsWith('\\(')) {
          html += renderKatex(tok.slice(2, -2), false);     // \(...\) inline
        } else if (tok.startsWith('$$')) {
          html += renderKatex(tok.slice(2, -2), true);      // $$...$$ display
        } else {
          html += renderKatex(tok.slice(1, -1), false);     // $...$ inline
        }
      }

      // Append any remaining plain text after the last math token
      if (lastIdx < src.length) html += escapeHtml(src.slice(lastIdx));

      return { __html: html };
    }


    /* ══════════════════════════════════════════════════════════════════
       ISSUE 8 ─ QUESTION HTML PRELOAD CACHE
       getQHtml() parses KaTeX once per unique question string, O(1) after.
       prewarm() is called whenever currentQ changes so adjacent questions
       are already rendered in memory before the user swipes to them.
       All four delimiter types ($$, $, \[, \() are handled by safeParseMath.
    ════════════════════════════════════════════════════════════════════ */
    const _qHtmlCache = Object.create(null); // module-level, survives re-renders

    function getQHtml(q) {
      if (!q) return null;
      const key = q.question || '';
      if (!_qHtmlCache[key]) {
        _qHtmlCache[key] = {
          question: safeParseMath(q.question),
          A: safeParseMath(q.options?.A),
          B: safeParseMath(q.options?.B),
          C: safeParseMath(q.options?.C),
          D: safeParseMath(q.options?.D),
        };
      }
      return _qHtmlCache[key];
    }

    function prewarm(questions, center, numQ) {
      for (let d = -1; d <= 1; d++) {
        const i = center + d;
        if (i >= 0 && i < numQ) getQHtml(questions[i]);
      }
    }


    /* ══════════════════════════════════════════════════════════════════
       OPTION COLOR MAP  — refined for premium examination UI
       Each entry now carries: bg, border, text, accent, badgeBg
    ════════════════════════════════════════════════════════════════════ */
    const OPT_COLOR = {
      A: { bg: 'rgba(59,130,246,.07)',  border: 'rgba(59,130,246,.45)',  text: '#93C5FD', accent: '#3B82F6', badgeBg: 'rgba(59,130,246,.14)'  },
      B: { bg: 'rgba(139,92,246,.07)',  border: 'rgba(139,92,246,.45)',  text: '#C4B5FD', accent: '#8B5CF6', badgeBg: 'rgba(139,92,246,.14)'  },
      C: { bg: 'rgba(34,197,94,.07)',   border: 'rgba(34,197,94,.45)',   text: '#86EFAC', accent: '#22C55E', badgeBg: 'rgba(34,197,94,.14)'   },
      D: { bg: 'rgba(245,158,11,.07)',  border: 'rgba(245,158,11,.45)',  text: '#FDE68A', accent: '#F59E0B', badgeBg: 'rgba(245,158,11,.14)'  },
    };


    /* ══════════════════════════════════════════════════════════════════
       ISSUE 7 ─ OFFLINE ATTEMPT QUEUE
       On submit: always write to localStorage first (instant, offline-safe).
       drainPendingAttempts() is called on mount and on the 'online' event
       to flush any queued attempts to Firebase once connectivity returns.
    ════════════════════════════════════════════════════════════════════ */
    const PENDING_KEY = 'nf_pending_attempts';

    function queueAttempt(attempt) {
      try {
        const list = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
        // Deduplicate by testId + uid so a retry doesn't double-count
        const idx = list.findIndex(a => a.testId === attempt.testId && a.uid === attempt.uid);
        if (idx >= 0) list[idx] = attempt; else list.push(attempt);
        localStorage.setItem(PENDING_KEY, JSON.stringify(list));
      } catch (e) { console.warn('[NeuroForge] queue error', e); }
    }

    async function drainPendingAttempts() {
      if (!window.db || !window._firebaseModExports || !window.currentUser) return;
      try {
        const list = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
        if (!list.length) return;
        const { setDoc, doc, updateDoc, increment } = window._firebaseModExports;
        const remaining = [];
        for (const a of list) {
          try {
            if (setDoc && doc)
              await setDoc(doc(window.db, `test_attempts/${a.testId}/attempts/${a.uid}`), a);
            if (updateDoc && increment && doc)
              await updateDoc(
                doc(window.db, 'community_tests', a.testId),
                { attempts: increment(1) }
              ).catch(() => {});
          } catch (e) {
            remaining.push(a); // keep for next attempt
          }
        }
        localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
      } catch (e) { console.warn('[NeuroForge] drain error', e); }
    }


    /* ══════════════════════════════════════════════════════════════════
       INTRO SCREEN
       Shows "Resume Session" / "Start Fresh" when a saved session exists.
    ════════════════════════════════════════════════════════════════════ */
    function IntroScreen({ testData, numQ, xpPerQ, hasSavedSession, onStart, onStartFresh, onClose }) {
      const totalXP = numQ * xpPerQ;

      return (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          maxWidth: 580, margin: '0 auto', width: '100%',
          padding: '28px 24px 52px',
        }}>

          {/* ── Back / Exit ── */}
          <button onClick={onClose} style={{
            alignSelf: 'flex-start',
            background: 'none', border: 'none', padding: '4px 0',
            color: 'var(--ts)', fontSize: '.65rem', fontWeight: 700,
            cursor: 'pointer', marginBottom: 42,
            display: 'flex', alignItems: 'center', gap: 7,
            letterSpacing: '.8px', textTransform: 'uppercase', opacity: .5,
            WebkitTapHighlightColor: 'transparent',
          }}>← Back</button>

          {/* ── Chapter badge ── */}
          <div style={{
            fontSize: '.52rem', fontWeight: 800, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--accent2)',
            marginBottom: 13,
          }}>
            {testData.chapter || 'General'}
          </div>

          {/* ── Title ── */}
          <h1 style={{
            fontFamily: 'var(--font-d)', fontSize: '1.7rem', fontWeight: 800,
            color: 'var(--tp)', lineHeight: 1.18, marginBottom: 8,
            letterSpacing: '-.55px', margin: '0 0 8px',
          }}>
            {testData.title || 'Untitled Test'}
          </h1>

          <div style={{
            fontSize: '.72rem', color: 'var(--ts)', marginBottom: 38, opacity: .55,
          }}>
            Created by{' '}
            <span style={{ color: 'var(--tp)', opacity: 1, fontWeight: 600 }}>
              {testData.createdBy || 'Anonymous'}
            </span>
          </div>

          {/* ── Stats grid ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1, marginBottom: 38,
            borderRadius: 10, overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--border)',
          }}>
            {[
              { label: 'Questions',    val: numQ },
              { label: 'XP per Q',     val: xpPerQ },
              { label: 'Total XP',     val: totalXP },
            ].map(({ label, val }) => (
              <div key={label} style={{
                background: 'var(--bg-card)',
                padding: '16px 14px',
                display: 'flex', flexDirection: 'column', gap: 5,
              }}>
                <span style={{
                  fontSize: '.5rem', color: 'var(--tm)', fontWeight: 700,
                  letterSpacing: '1.3px', textTransform: 'uppercase',
                }}>{label}</span>
                <span style={{
                  fontSize: '1.15rem', color: 'var(--tp)',
                  fontWeight: 800, fontFamily: 'var(--font-d)',
                  letterSpacing: '-.3px',
                }}>{val}</span>
              </div>
            ))}
          </div>

          {/* ── Instructions ── */}
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 24, marginBottom: 38,
          }}>
            <div style={{
              fontSize: '.5rem', fontWeight: 800, color: 'var(--tm)',
              letterSpacing: '1.8px', textTransform: 'uppercase', marginBottom: 18,
            }}>Instructions</div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                'Read each question carefully before selecting an answer.',
                'Select one option (A / B / C / D) per question.',
                'Navigate freely using the progress dots or Prev / Next.',
                'Submit only when all questions have been answered.',
              ].map((txt, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  padding: '12px 0',
                  borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{
                    fontSize: '.58rem', fontWeight: 800, color: 'var(--tm)',
                    fontFamily: 'var(--font-d)', minWidth: 18, marginTop: 2,
                    letterSpacing: '.3px',
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{
                    fontSize: '.78rem', color: 'var(--ts)',
                    lineHeight: 1.58, fontWeight: 400,
                  }}>{txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA buttons ── */}
          {hasSavedSession ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                padding: '11px 15px', borderRadius: 8,
                background: 'rgba(99,102,241,.07)',
                border: '1px solid rgba(99,102,241,.2)',
                fontSize: '.7rem', color: 'var(--accent2)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>↩</span> A previous session was found — your progress is saved.
              </div>
              <button onClick={onStart} style={{
                width: '100%', padding: '16px',
                background: 'var(--accent)',
                border: 'none', borderRadius: 10,
                color: '#fff', fontSize: '.88rem', fontWeight: 800,
                letterSpacing: '.3px', cursor: 'pointer',
                fontFamily: 'var(--font-d)',
                WebkitTapHighlightColor: 'transparent',
              }}>Resume Session →</button>
              <button onClick={onStartFresh} style={{
                width: '100%', padding: '14px',
                background: 'transparent',
                border: '1px solid var(--border2)', borderRadius: 10,
                color: 'var(--ts)', fontSize: '.82rem', fontWeight: 600,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}>Start Fresh</button>
            </div>
          ) : (
            <button onClick={onStart} style={{
              width: '100%', padding: '17px',
              background: 'var(--accent)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: '.9rem', fontWeight: 800,
              letterSpacing: '.3px', cursor: 'pointer',
              fontFamily: 'var(--font-d)',
              WebkitTapHighlightColor: 'transparent',
            }}>Begin Examination →</button>
          )}
        </div>
      );
    }


    /* ══════════════════════════════════════════════════════════════════
       ISSUE 1 ─ LAYERED TAKING SCREEN
       Three isolated memo layers so an answer click never re-renders
       the parts of the screen that didn't change.

       ProgressLayer  — re-renders ONLY when: answeredCount | currentQ changes
       QuestionCard   — re-renders ONLY when: question changes | option is picked
       NavBar         — re-renders ONLY when: currentQ | allAnswered | answeredSet changes
    ════════════════════════════════════════════════════════════════════ */

    /* ── LAYER 1: Progress header ───────────────────────────────────── */
    const ProgressLayer = memo(function ProgressLayer({ currentQ, numQ, answeredCount, onClose }) {
      const pct = numQ > 0 ? Math.round((answeredCount / numQ) * 100) : 0;
      return (
        <div style={{
          flexShrink: 0,
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border)',
        }}>
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '15px 22px 0',
          }}>
            <button onClick={onClose} style={{
              background: 'none', border: 'none',
              color: 'var(--tm)', fontSize: '.6rem', fontWeight: 700,
              cursor: 'pointer', padding: '4px 0',
              letterSpacing: '.7px', textTransform: 'uppercase', opacity: .5,
              WebkitTapHighlightColor: 'transparent',
            }}>✕ Exit</button>

            <span style={{
              fontFamily: 'var(--font-d)', fontSize: '.7rem',
              fontWeight: 800, letterSpacing: '.6px',
              textTransform: 'uppercase',
            }}>
              <span style={{ color: 'var(--tm)' }}>Question </span>
              <span style={{ color: 'var(--tp)' }}>{currentQ + 1}</span>
              <span style={{ color: 'var(--tm)' }}> / {numQ}</span>
            </span>

            <span style={{
              fontSize: '.6rem', fontWeight: 700,
              color: answeredCount === numQ ? '#22C55E' : 'var(--tm)',
              letterSpacing: '.5px',
              transition: 'color .3s',
              textTransform: 'uppercase',
            }}>
              {answeredCount}/{numQ}
            </span>
          </div>

          {/* Progress bar — 2px hairline */}
          <div style={{
            height: 2,
            background: 'rgba(255,255,255,.06)',
            margin: '13px 0 0',
          }}>
            <div style={{
              height: '100%',
              background: pct === 100 ? '#22C55E' : 'var(--accent)',
              width: `${pct}%`,
              transition: 'width .4s cubic-bezier(.22,.1,.36,1), background .3s',
            }} />
          </div>
        </div>
      );
    });

    /* ── LAYER 2: Question card + options ───────────────────────────── */
    // ISSUE 2: uses safeParseMath (HTML-escaped) instead of dangerouslySetInnerHTML(raw)
    // ISSUE 8: receives pre-parsed qHtml from cache — rendering is O(1)
    const QuestionCard = memo(function QuestionCard({ qHtml, selectedOpt, allAnswered, onPick }) {
      if (!qHtml) return null;
      return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px 22px 22px' }}>

          {/* Question text — generous line-height for readability */}
          <div
            style={{
              fontSize: '.95rem', lineHeight: 1.82,
              color: 'var(--tp)', marginBottom: 28,
              fontWeight: 450, letterSpacing: '.01em',
            }}
            dangerouslySetInnerHTML={qHtml.question}
          />

          {/* Thin rule separating stem from options */}
          <div style={{
            height: 1, background: 'var(--border)',
            marginBottom: 20,
          }} />

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {['A', 'B', 'C', 'D'].map(label => {
              const html = qHtml[label];
              if (!html || !html.__html) return null;
              const isSel = selectedOpt === label;
              const col   = OPT_COLOR[label];

              return (
                <button
                  key={label}
                  onClick={() => onPick(label)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '13px 15px',
                    background: isSel ? col.bg : 'transparent',
                    border: `1px solid ${isSel ? col.border : 'var(--border)'}`,
                    borderLeft: `3px solid ${isSel ? col.accent : 'transparent'}`,
                    borderRadius: 7,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all .13s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* Letter badge — square with rounded corners */}
                  <span style={{
                    width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                    background: isSel ? col.badgeBg : 'var(--bg-input)',
                    border: `1px solid ${isSel ? col.border : 'var(--border2)'}`,
                    color: isSel ? col.text : 'var(--tm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-d)', fontSize: '.62rem', fontWeight: 800,
                    letterSpacing: '.4px',
                    transition: 'all .13s',
                  }}>{label}</span>

                  {/* Option text — XSS-safe, already in cache */}
                  <span
                    style={{
                      flex: 1, fontSize: '.875rem', lineHeight: 1.65,
                      color: isSel ? 'var(--tp)' : 'var(--ts)',
                      fontWeight: isSel ? 500 : 400,
                      paddingTop: 4,
                      transition: 'color .13s',
                    }}
                    dangerouslySetInnerHTML={html}
                  />
                </button>
              );
            })}
          </div>

          {allAnswered && (
            <div style={{
              marginTop: 22,
              padding: '10px 14px',
              borderRadius: 6,
              background: 'rgba(34,197,94,.05)',
              border: '1px solid rgba(34,197,94,.18)',
              textAlign: 'center',
              fontSize: '.65rem', color: '#4ade80',
              fontWeight: 700, letterSpacing: '.8px',
              textTransform: 'uppercase',
            }}>
              All questions answered — proceed to submit
            </div>
          )}
        </div>
      );
    });

    /* ── LAYER 3: Dot navigator + Prev / Next / Submit ──────────────── */
    // Uses answeredSet (a Set<number>) instead of the full answers object
    // so it only re-renders when the set of answered indices actually changes.
    const NavBar = memo(function NavBar({
      currentQ, numQ, answeredSet, allAnswered, submitting, onNav, onSubmit,
    }) {
      const isFirst = currentQ === 0;
      const isLast  = currentQ === numQ - 1;

      return (
        <div style={{
          padding: '14px 22px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-sidebar)',
          flexShrink: 0,
        }}>
          {/* Question dot navigator */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: 4, marginBottom: 16, flexWrap: 'wrap',
            padding: '0 2px',
          }}>
            {Array.from({ length: numQ }, (_, i) => {
              const done    = answeredSet.has(i);
              const current = i === currentQ;
              return (
                <button
                  key={i}
                  onClick={() => onNav(i)}
                  title={`Q${i + 1}`}
                  style={{
                    width: current ? 20 : 7, height: 7, borderRadius: 4,
                    background: current
                      ? 'var(--accent)'
                      : done ? 'rgba(34,197,94,.55)' : 'rgba(255,255,255,.1)',
                    border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                    transition: 'all .22s cubic-bezier(.22,.1,.36,1)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                />
              );
            })}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onNav(Math.max(0, currentQ - 1))}
              disabled={isFirst}
              style={{
                flex: 1, padding: '13px 10px',
                background: 'transparent',
                border: '1px solid var(--border2)',
                borderRadius: 8,
                color: isFirst ? 'var(--tm)' : 'var(--ts)',
                fontSize: '.76rem', fontWeight: 700,
                cursor: isFirst ? 'default' : 'pointer',
                opacity: isFirst ? .28 : 1,
                transition: 'opacity .15s',
                WebkitTapHighlightColor: 'transparent',
                letterSpacing: '.3px',
              }}
            >← Previous</button>

            {allAnswered ? (
              <button
                onClick={onSubmit}
                disabled={submitting}
                style={{
                  flex: 2, padding: '13px',
                  background: submitting ? 'rgba(22,163,74,.55)' : '#16A34A',
                  border: '1px solid rgba(34,197,94,.25)',
                  borderRadius: 8,
                  color: '#fff', fontSize: '.82rem', fontWeight: 800,
                  cursor: submitting ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  letterSpacing: '.4px', fontFamily: 'var(--font-d)',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background .2s',
                }}
              >
                {submitting
                  ? <>
                      <span style={{
                        width: 11, height: 11, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,.3)',
                        borderTopColor: '#fff',
                        animation: 'spin .7s linear infinite',
                        display: 'inline-block',
                      }} />
                      Submitting…
                    </>
                  : 'Submit Examination'
                }
              </button>
            ) : (
              <button
                onClick={() => onNav(Math.min(numQ - 1, currentQ + 1))}
                style={{
                  flex: 2, padding: '13px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff', fontSize: '.82rem', fontWeight: 800,
                  cursor: 'pointer', letterSpacing: '.3px',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >Next →</button>
            )}
          </div>
        </div>
      );
    });


    /* ══════════════════════════════════════════════════════════════════
       ISSUE 6 ─ RESULTS SCREEN: WRONG-FIRST + LAZY CORRECT REVEAL
       Wrong answers are expanded by default (the study-critical info).
       Correct answers are collapsed — student expands them optionally.
       ReviewItem is a standalone component so it can share the qHtml cache.
    ════════════════════════════════════════════════════════════════════ */
    function ReviewItem({ q, i, userAns, isRight }) {
      const qHtml   = getQHtml(q); // O(1) cache hit
      const correct = q.correct;
      const leftAccent = isRight ? '#22C55E' : '#EF4444';
      const bg         = isRight ? 'rgba(34,197,94,.04)'   : 'rgba(239,68,68,.04)';
      const border     = isRight ? 'rgba(34,197,94,.14)'   : 'rgba(239,68,68,.14)';
      const badge      = isRight ? '#4ade80'                : '#f87171';

      return (
        <div style={{
          background: bg,
          border: `1px solid ${border}`,
          borderLeft: `3px solid ${leftAccent}`,
          borderRadius: 8,
          padding: '14px 15px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 10,
          }}>
            <span style={{
              fontSize: '.58rem', fontWeight: 800, color: 'var(--tm)',
              letterSpacing: '.7px', textTransform: 'uppercase',
            }}>
              Question {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{
              fontSize: '.58rem', fontWeight: 800, color: badge,
              letterSpacing: '.8px', textTransform: 'uppercase',
            }}>
              {isRight ? '✓ Correct' : '✗ Incorrect'}
            </span>
          </div>

          <div
            style={{
              fontSize: '.82rem', color: 'var(--ts)',
              lineHeight: 1.62, marginBottom: 12,
            }}
            dangerouslySetInnerHTML={qHtml ? qHtml.question : { __html: '' }}
          />

          {!isRight && userAns && (
            <div style={{
              fontSize: '.74rem', color: '#f87171', marginBottom: 7,
              paddingLeft: 10, borderLeft: '2px solid rgba(239,68,68,.25)',
            }}>
              Your answer: <strong>{userAns}</strong>
              {' — '}
              <span dangerouslySetInnerHTML={qHtml ? qHtml[userAns] : { __html: '—' }} />
            </div>
          )}

          <div style={{
            fontSize: '.74rem', color: '#4ade80', fontWeight: 600,
            paddingLeft: 10, borderLeft: '2px solid rgba(34,197,94,.25)',
          }}>
            Correct: <strong>{correct}</strong>
            {' — '}
            <span dangerouslySetInnerHTML={qHtml ? qHtml[correct] : { __html: '—' }} />
          </div>
        </div>
      );
    }

    function ResultsScreen({ testData, questions, answers, score, numQ, pct, xpEarned, onClose }) {
      const [showWrong,   setShowWrong]   = useState(true);  // wrong open by default
      const [showCorrect, setShowCorrect] = useState(false); // correct collapsed

      const grade =
        pct >= 90 ? { label: 'Outstanding',       color: '#4ade80' } :
        pct >= 75 ? { label: 'Proficient',         color: '#60a5fa' } :
        pct >= 50 ? { label: 'Developing',         color: '#fbbf24' } :
                   { label: 'Needs Improvement',   color: '#f87171' };

      // Partition once
      const wrongItems   = [];
      const correctItems = [];
      questions.forEach((q, i) => {
        const isRight = answers[i] === q.correct;
        (isRight ? correctItems : wrongItems).push({ q, i, userAns: answers[i], isRight });
      });

      return (
        <div style={{
          flex: 1, overflowY: 'auto',
          maxWidth: 580, margin: '0 auto', width: '100%',
          padding: '36px 22px 56px',
        }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              fontSize: '.5rem', fontWeight: 800, letterSpacing: '2px',
              textTransform: 'uppercase', color: 'var(--tm)', marginBottom: 10,
            }}>Examination Complete</div>
            <div style={{
              fontFamily: 'var(--font-d)', fontSize: '1.55rem',
              fontWeight: 800, color: grade.color, letterSpacing: '-.4px',
            }}>
              {grade.label}
            </div>
          </div>

          {/* ── Score ring ── */}
          <div style={{
            width: 148, height: 148, borderRadius: '50%', margin: '0 auto 32px',
            background: `conic-gradient(${grade.color} ${pct * 3.6}deg, rgba(255,255,255,.06) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 118, height: 118, borderRadius: '50%',
              background: 'var(--bg-chat)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
            }}>
              <span style={{
                fontFamily: 'var(--font-d)', fontSize: '2.1rem',
                fontWeight: 800, color: 'var(--tp)', lineHeight: 1,
              }}>
                {score}/{numQ}
              </span>
              <span style={{ fontSize: '.64rem', color: 'var(--ts)', fontWeight: 700, letterSpacing: '.3px' }}>
                {pct}%
              </span>
            </div>
          </div>

          {/* ── Stats chips ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1, marginBottom: 32,
            borderRadius: 10, overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--border)',
          }}>
            {[
              { label: 'XP Earned',  val: `+${xpEarned}`, color: '#fbbf24' },
              { label: 'Correct',    val: score,           color: '#4ade80' },
              { label: 'Incorrect',  val: numQ - score,    color: '#f87171' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{
                background: 'var(--bg-card)',
                padding: '14px 12px', textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '.5rem', color: 'var(--tm)', fontWeight: 700,
                  letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 6,
                }}>{label}</div>
                <div style={{
                  fontFamily: 'var(--font-d)', fontSize: '1.1rem', fontWeight: 800, color,
                }}>{val}</div>
              </div>
            ))}
          </div>

          {/* ── Done button ── */}
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '15px', marginBottom: 28,
              background: 'var(--accent)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: '.88rem', fontWeight: 800,
              cursor: 'pointer', letterSpacing: '.3px', fontFamily: 'var(--font-d)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >Return to Dashboard</button>

          {/* ── WRONG answers — expanded by default (study focus) ── */}
          {wrongItems.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={() => setShowWrong(v => !v)}
                style={{
                  width: '100%', padding: '13px 16px',
                  background: 'rgba(239,68,68,.05)',
                  border: '1px solid rgba(239,68,68,.18)',
                  borderLeft: '3px solid #EF4444',
                  borderRadius: 8,
                  color: '#f87171', fontSize: '.78rem', fontWeight: 700,
                  cursor: 'pointer', textAlign: 'left',
                  marginBottom: showWrong ? 10 : 0,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  WebkitTapHighlightColor: 'transparent',
                  letterSpacing: '.35px',
                }}
              >
                <span>✗ {wrongItems.length} Incorrect Answer{wrongItems.length !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: '.6rem', opacity: .55 }}>{showWrong ? '▲' : '▼'}</span>
              </button>
              {showWrong && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {wrongItems.map(({ q, i, userAns }) => (
                    <ReviewItem key={i} q={q} i={i} userAns={userAns} isRight={false} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CORRECT answers — collapsed by default (lightweight DOM) ── */}
          {correctItems.length > 0 && (
            <div>
              <button
                onClick={() => setShowCorrect(v => !v)}
                style={{
                  width: '100%', padding: '13px 16px',
                  background: 'rgba(34,197,94,.05)',
                  border: '1px solid rgba(34,197,94,.18)',
                  borderLeft: '3px solid #22C55E',
                  borderRadius: 8,
                  color: '#4ade80', fontSize: '.78rem', fontWeight: 700,
                  cursor: 'pointer', textAlign: 'left',
                  marginBottom: showCorrect ? 10 : 0,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  WebkitTapHighlightColor: 'transparent',
                  letterSpacing: '.35px',
                }}
              >
                <span>✓ {correctItems.length} Correct Answer{correctItems.length !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: '.6rem', opacity: .55 }}>{showCorrect ? '▲' : '▼'}</span>
              </button>
              {/* Only mounted when user requests — keeps initial DOM lean */}
              {showCorrect && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {correctItems.map(({ q, i, userAns }) => (
                    <ReviewItem key={i} q={q} i={i} userAns={userAns} isRight={true} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }


    /* ══════════════════════════════════════════════════════════════════
       ROOT ─ TestTakingPage
       Orchestrates all 8 fixes at the state-management layer.
    ════════════════════════════════════════════════════════════════════ */
    function TestTakingPage({ testData, onClose }) {
      const questions = testData.questions || [];
      const numQ      = questions.length;
      const xpPerQ    = testData.xpPerQ || 10;
      const SESSION_KEY = `nf_test_session_${testData.id}`;

      /* ISSUE 3 ─ mutable ref for answers (no object spread / GC churn)
         answeredSet (Set<number>) is the lightweight state twin used for UI.
         answersRef holds the full payload for submission. */
      const answersRef = useRef({});

      const [phase,           setPhase]           = useState('intro');
      const [currentQ,        setCurrentQ]        = useState(0);
      const [answeredSet,     setAnsweredSet]      = useState(() => new Set());
      const [selectedOpt,     setSelectedOpt]     = useState(null);
      const [submitting,      setSubmitting]       = useState(false);
      const [mounted,         setMounted]          = useState(false);
      const [hasSavedSession, setHasSavedSession] = useState(false);

      /* ISSUE 5 ─ timing ref (anti-cheat, never triggers re-renders) */
      const timingRef = useRef({
        startedAt:           null,
        activeDuration:      0,
        lastActiveTime:      null,
        tabVisibilityLosses: 0,
        answerTimestamps:    [],
      });

      /* ISSUE 4 ─ session ref tracks currentQ without stale closure in interval */
      const sessionRef = useRef({ currentQ: 0 });

      /* Results snapshot written by handleSubmit, read by results phase */
      const resultsRef = useRef({ score: 0, xpEarned: 0, answers: {} });

      /* Stable nav ref so handleSelectAnswer can call handleNav without
         circular const declaration or dep-array gymnastics */
      const handleNavRef = useRef(null);

      /* ── Mount effects ─────────────────────────────────────────────── */
      useEffect(() => {
        const t = requestAnimationFrame(() => setMounted(true));

        // ISSUE 7: drain any queued attempts from previous sessions
        drainPendingAttempts();
        window.addEventListener('online', drainPendingAttempts);

        // ISSUE 4: detect saved session for intro screen banner
        try {
          const raw = localStorage.getItem(SESSION_KEY);
          if (raw) {
            const s = JSON.parse(raw);
            if (s?.answers && Object.keys(s.answers).length > 0) setHasSavedSession(true);
          }
        } catch (_) {}

        return () => {
          cancelAnimationFrame(t);
          window.removeEventListener('online', drainPendingAttempts);
        };
      }, []);

      /* ISSUE 4 ─ keep sessionRef in sync with current question index */
      useEffect(() => { sessionRef.current.currentQ = currentQ; }, [currentQ]);

      /* ISSUE 4 ─ auto-save lightweight snapshot every 10 s during test */
      useEffect(() => {
        if (phase !== 'taking') return;
        const id = setInterval(() => {
          try {
            localStorage.setItem(SESSION_KEY, JSON.stringify({
              currentQ:  sessionRef.current.currentQ,
              answers:   answersRef.current,
              startedAt: timingRef.current.startedAt,
              savedAt:   Date.now(),
            }));
          } catch (_) {}
        }, 10000);
        return () => clearInterval(id);
      }, [phase]);

      /* ISSUE 5 ─ tab visibility tracking */
      useEffect(() => {
        if (phase !== 'taking') return;
        const handleVis = () => {
          if (document.hidden) {
            if (timingRef.current.lastActiveTime) {
              timingRef.current.activeDuration +=
                Date.now() - timingRef.current.lastActiveTime;
            }
            timingRef.current.tabVisibilityLosses++;
            timingRef.current.lastActiveTime = null;
          } else {
            timingRef.current.lastActiveTime = Date.now();
          }
        };
        document.addEventListener('visibilitychange', handleVis);
        return () => document.removeEventListener('visibilitychange', handleVis);
      }, [phase]);

      /* ISSUE 8 ─ prewarm KaTeX cache for adjacent questions on navigation */
      useEffect(() => {
        if (phase !== 'taking') return;
        prewarm(questions, currentQ, numQ);
      }, [currentQ, phase]);

      /* ── Close handler ─────────────────────────────────────────────── */
      const handleClose = useCallback(() => {
        setMounted(false);
        setTimeout(() => {
          if (typeof window.unmountTestTaking === 'function') window.unmountTestTaking();
        }, 320);
      }, []);

      /* ── Session restore (called when user taps Resume) ────────────── */
      const restoreSession = useCallback(() => {
        try {
          const raw = localStorage.getItem(SESSION_KEY);
          if (!raw) return;
          const s = JSON.parse(raw);
          answersRef.current = s.answers || {};
          const set = new Set(Object.keys(s.answers || {}).map(Number));
          const q   = typeof s.currentQ === 'number' ? s.currentQ : 0;
          setAnsweredSet(set);
          setCurrentQ(q);
          setSelectedOpt(answersRef.current[q] ?? null);
          sessionRef.current.currentQ = q;
          if (s.startedAt) timingRef.current.startedAt = s.startedAt;
        } catch (_) {}
      }, []);

      /* ── Start (resume) ────────────────────────────────────────────── */
      const handleStart = useCallback(() => {
        restoreSession();
        if (!timingRef.current.startedAt) timingRef.current.startedAt = Date.now();
        timingRef.current.lastActiveTime = Date.now();
        prewarm(questions, 0, numQ);
        setPhase('taking');
      }, [restoreSession]);

      /* ── Start fresh (discards saved session) ──────────────────────── */
      const handleStartFresh = useCallback(() => {
        try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
        answersRef.current = {};
        setAnsweredSet(new Set());
        setCurrentQ(0);
        setSelectedOpt(null);
        sessionRef.current.currentQ = 0;
        timingRef.current = {
          startedAt: Date.now(), activeDuration: 0,
          lastActiveTime: Date.now(), tabVisibilityLosses: 0, answerTimestamps: [],
        };
        prewarm(questions, 0, numQ);
        setPhase('taking');
      }, []);

      /* ── Navigate ──────────────────────────────────────────────────── */
      // React 18 batches both setState calls → single re-render of QuestionCard
      const handleNav = useCallback((idx) => {
        setCurrentQ(idx);
        setSelectedOpt(answersRef.current[idx] ?? null);
        sessionRef.current.currentQ = idx;
      }, []);

      // Keep stable ref so handleSelectAnswer can call it safely
      handleNavRef.current = handleNav;

      /* ── Select answer ─────────────────────────────────────────────── */
      // ISSUE 3: mutates ref directly — no spread, no GC churn
      // Only setSelectedOpt re-renders QuestionCard.
      // setAnsweredSet only fires when it's a NEWLY answered question.
      const handleSelectAnswer = useCallback((qIdx, opt) => {
        const isNew = answersRef.current[qIdx] === undefined;
        answersRef.current[qIdx] = opt;                       // mutate — no re-render
        timingRef.current.answerTimestamps.push(Date.now()); // ISSUE 5

        setSelectedOpt(opt); // QuestionCard re-renders (option highlight)

        if (isNew) {
          // ProgressLayer + NavBar re-render only on NEW answer
          setAnsweredSet(prev => { const s = new Set(prev); s.add(qIdx); return s; });
        }

        // Auto-advance to next unanswered (preserve original behaviour)
        if (qIdx !== numQ - 1) {
          setTimeout(() => {
            for (let i = qIdx + 1; i < numQ; i++) {
              if (answersRef.current[i] === undefined) {
                handleNavRef.current(i); return;
              }
            }
            for (let i = 0; i < qIdx; i++) {
              if (answersRef.current[i] === undefined) {
                handleNavRef.current(i); return;
              }
            }
            // All answered — stay so submit button is visible
          }, 350);
        }
      }, [numQ]);

      /* ── Submit ────────────────────────────────────────────────────── */
      const handleSubmit = useCallback(async () => {
        if (submitting) return;
        setSubmitting(true);

        // ISSUE 5: finalize active-duration accumulation
        if (timingRef.current.lastActiveTime) {
          timingRef.current.activeDuration +=
            Date.now() - timingRef.current.lastActiveTime;
          timingRef.current.lastActiveTime = null;
        }
        const totalMs       = Date.now() - (timingRef.current.startedAt || Date.now());
        const minExpectedMs = numQ * 3000; // 3 s minimum per question
        const suspicious    =
          totalMs < minExpectedMs ||
          timingRef.current.tabVisibilityLosses > 5;

        // Snapshot answers from ref (safe for async)
        const snapshotAnswers = { ...answersRef.current };
        const finalScore      = questions.filter((q, i) => snapshotAnswers[i] === q.correct).length;
        const finalXp         = finalScore * xpPerQ;

        const attempt = {
          uid:         window.currentUser?.uid || 'anonymous',
          testId:      testData.id,
          answers:     snapshotAnswers,
          score:       finalScore,
          total:       numQ,
          xpEarned:    finalXp,
          completedAt: new Date().toISOString(),
          timing: {
            totalMs,
            activeDuration:      timingRef.current.activeDuration,
            tabVisibilityLosses: timingRef.current.tabVisibilityLosses,
          },
          suspicious,
        };

        // ISSUE 7: queue locally first (works offline)
        queueAttempt(attempt);

        // Try to flush to Firebase immediately
        try { await drainPendingAttempts(); }
        catch (e) { console.warn('[NeuroForge] Firebase offline — queued for retry', e); }

        // ISSUE 4: clear session after successful submit
        try { localStorage.removeItem(SESSION_KEY); } catch (_) {}

        // Store results snapshot for results screen
        resultsRef.current = { score: finalScore, xpEarned: finalXp, answers: snapshotAnswers };

        setSubmitting(false);
        setPhase('results');
      }, [submitting, numQ, questions, xpPerQ, testData.id]);

      /* ── Derived values ────────────────────────────────────────────── */
      const answeredCount = answeredSet.size;
      const allAnswered   = answeredCount === numQ && numQ > 0;

      // Results data (populated by handleSubmit before phase transition)
      const { score = 0, xpEarned = 0, answers: finalAnswers = {} } = resultsRef.current;
      const pct = numQ > 0 ? Math.round((score / numQ) * 100) : 0;

      /* ── Slide container ───────────────────────────────────────────── */
      const slideStyle = {
        position: 'fixed', inset: 0,
        background: 'var(--bg-chat)',
        zIndex: 2200,
        display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-b)',
        transform: mounted ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .32s cubic-bezier(.22,.1,.36,1)',
        overflowY: phase === 'taking' ? 'hidden' : 'auto',
      };

      return (
        <div style={slideStyle}>

          {phase === 'intro' && (
            <IntroScreen
              testData={testData}
              numQ={numQ}
              xpPerQ={xpPerQ}
              hasSavedSession={hasSavedSession}
              onStart={handleStart}
              onStartFresh={handleStartFresh}
              onClose={handleClose}
            />
          )}

          {phase === 'taking' && (
            // ISSUE 1: static wrapper div (never re-renders itself)
            // Each child layer is memo'd and receives only the props it needs.
            <div style={{
              display: 'flex', flexDirection: 'column',
              height: '100%', maxWidth: 600, margin: '0 auto', width: '100%',
            }}>
              {/* LAYER 1 — progress bar re-renders on answeredCount / currentQ only */}
              <ProgressLayer
                currentQ={currentQ}
                numQ={numQ}
                answeredCount={answeredCount}
                onClose={handleClose}
              />

              {/* LAYER 2 — question card re-renders on question change / option pick only
                  ISSUE 8: getQHtml() is O(1) cache hit for current + adjacent questions */}
              <QuestionCard
                qHtml={getQHtml(questions[currentQ])}
                selectedOpt={selectedOpt}
                allAnswered={allAnswered}
                onPick={(opt) => handleSelectAnswer(currentQ, opt)}
              />

              {/* LAYER 3 — nav bar re-renders on currentQ / answeredSet / allAnswered only */}
              <NavBar
                currentQ={currentQ}
                numQ={numQ}
                answeredSet={answeredSet}
                allAnswered={allAnswered}
                submitting={submitting}
                onNav={handleNav}
                onSubmit={handleSubmit}
              />
            </div>
          )}

          {phase === 'results' && (
            <ResultsScreen
              testData={testData}
              questions={questions}
              answers={finalAnswers}
              score={score}
              numQ={numQ}
              pct={pct}
              xpEarned={xpEarned}
              onClose={handleClose}
            />
          )}
        </div>
      );
    }


    /* ══════════════════════════════════════════════════════════════════
       MOUNT / UNMOUNT BRIDGE
    ════════════════════════════════════════════════════════════════════ */
    window.mountTestTaking = function (testData) {
      let root = document.getElementById('testTakingRoot');
      if (!root) {
        root = document.createElement('div');
        root.id = 'testTakingRoot';
        document.body.appendChild(root);
      }
      const createRoot = window.ReactCreateRoot;
      if (!createRoot) {
        console.error('[NeuroForge] window.ReactCreateRoot not found');
        return;
      }
      if (!window._ttRoot) window._ttRoot = createRoot(root);
      window._ttRoot.render(
        window.React.createElement(TestTakingPage, {
          testData,
          onClose: window.unmountTestTaking,
        })
      );
    };

    window.unmountTestTaking = function () {
      if (window._ttRoot) { window._ttRoot.unmount(); window._ttRoot = null; }
      const root = document.getElementById('testTakingRoot');
      if (root) root.remove();
    };

  }; // end init

  init();
})();

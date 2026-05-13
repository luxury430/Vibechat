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
       OPTION COLOR MAP  (A=blue  B=purple  C=green  D=amber)
    ════════════════════════════════════════════════════════════════════ */
    const OPT_COLOR = {
      A: { bg: 'rgba(59,130,246,.13)',  border: 'rgba(59,130,246,.45)',  text: '#60A5FA' },
      B: { bg: 'rgba(168,85,247,.13)',  border: 'rgba(168,85,247,.45)',  text: '#C084FC' },
      C: { bg: 'rgba(34,197,94,.13)',   border: 'rgba(34,197,94,.45)',   text: '#4ADE80' },
      D: { bg: 'rgba(245,158,11,.13)',  border: 'rgba(245,158,11,.45)',  text: '#FBBF24' },
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
          maxWidth: 520, margin: '0 auto', width: '100%',
          padding: '22px 18px 44px',
        }}>

          <button onClick={onClose} style={{
            alignSelf: 'flex-start', background: 'var(--bg-input)',
            border: '1px solid var(--border2)', borderRadius: 99,
            padding: '7px 15px', color: 'var(--ts)',
            fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
            marginBottom: 30, display: 'flex', alignItems: 'center', gap: 6,
            letterSpacing: '.4px',
          }}>← Back</button>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.22)',
            borderRadius: 99, padding: '5px 13px',
            fontSize: '.62rem', fontWeight: 800, color: 'var(--accent2)',
            letterSpacing: '.8px', marginBottom: 14, alignSelf: 'flex-start',
          }}>
            {testData.chapter || 'General'}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-d)', fontSize: '1.55rem', fontWeight: 800,
            color: 'var(--tp)', lineHeight: 1.22, marginBottom: 9, letterSpacing: '-.5px',
          }}>
            {testData.title || 'Untitled Test'}
          </h1>

          <div style={{ fontSize: '.78rem', color: 'var(--ts)', marginBottom: 26 }}>
            by <span style={{ color: 'var(--tp)', fontWeight: 700 }}>
              {testData.createdBy || 'Anonymous'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 30 }}>
            {[
              { label: 'Questions', val: numQ },
              { label: 'XP / Q',    val: `${xpPerQ} XP` },
              { label: 'Total XP',  val: `${totalXP} XP` },
            ].map(({ label, val }) => (
              <div key={label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '10px 16px',
                display: 'flex', flexDirection: 'column', gap: 3,
              }}>
                <span style={{
                  fontSize: '.52rem', color: 'var(--ts)', fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase',
                }}>{label}</span>
                <span style={{
                  fontSize: '.98rem', color: 'var(--tp)',
                  fontWeight: 800, fontFamily: 'var(--font-d)',
                }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '15px 17px', marginBottom: 28,
          }}>
            <div style={{
              fontSize: '.6rem', fontWeight: 800, color: 'var(--tm)',
              letterSpacing: '1.1px', textTransform: 'uppercase', marginBottom: 11,
            }}>How it works</div>
            {[
              'Read each question carefully',
              'Tap an option (A / B / C / D) to select your answer',
              'Use the dots or Prev / Next to navigate freely',
              'Hit Submit once all questions are answered',
            ].map((txt, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                fontSize: '.8rem', color: 'var(--ts)',
                marginBottom: i < 3 ? 9 : 0, lineHeight: 1.52,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(99,102,241,.14)', color: 'var(--accent2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.58rem', fontWeight: 800, flexShrink: 0, marginTop: 1,
                }}>{i + 1}</span>
                {txt}
              </div>
            ))}
          </div>

          {/* ISSUE 4 — Resume banner + dual CTA when a saved session exists */}
          {hasSavedSession ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                padding: '9px 14px', borderRadius: 10,
                background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.22)',
                fontSize: '.72rem', color: 'var(--accent2)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <span>↩</span> Previous session found — your answers are saved.
              </div>
              <button onClick={onStart} style={{
                width: '100%', padding: '16px',
                background: 'linear-gradient(135deg, var(--accent3), var(--accent))',
                border: 'none', borderRadius: 14,
                color: '#fff', fontSize: '.95rem', fontWeight: 800,
                letterSpacing: '.4px', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(37,99,235,.35)',
                fontFamily: 'var(--font-d)',
              }}>Resume Session →</button>
              <button onClick={onStartFresh} style={{
                width: '100%', padding: '13px',
                background: 'transparent',
                border: '1px solid var(--border2)', borderRadius: 14,
                color: 'var(--ts)', fontSize: '.84rem', fontWeight: 700, cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}>Start Fresh</button>
            </div>
          ) : (
            <button onClick={onStart} style={{
              width: '100%', padding: '16px',
              background: 'linear-gradient(135deg, var(--accent3), var(--accent))',
              border: 'none', borderRadius: 14,
              color: '#fff', fontSize: '.95rem', fontWeight: 800,
              letterSpacing: '.4px', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(37,99,235,.35)',
              fontFamily: 'var(--font-d)',
              transition: 'transform .14s, box-shadow .14s',
            }}>Start Test →</button>
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
          padding: '14px 18px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-sidebar)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 10,
          }}>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: 'var(--ts)',
              fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              padding: 0, letterSpacing: '.3px',
            }}>✕ Exit</button>

            <span style={{
              fontFamily: 'var(--font-d)', fontSize: '.8rem',
              fontWeight: 800, color: 'var(--ts)',
            }}>
              Q {currentQ + 1}
              <span style={{ color: 'var(--tm)' }}> / {numQ}</span>
            </span>

            <span style={{
              fontSize: '.7rem', fontWeight: 700,
              color: answeredCount === numQ ? '#4ade80' : 'var(--ts)',
              transition: 'color .3s',
            }}>
              {answeredCount}/{numQ} done
            </span>
          </div>

          <div style={{
            height: 3, borderRadius: 2,
            background: 'rgba(255,255,255,.07)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: pct === 100
                ? 'linear-gradient(90deg,#16a34a,#22c55e)'
                : 'linear-gradient(90deg,var(--accent3),var(--accent))',
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 18px' }}>

          {/* Question text — already XSS-safe via safeParseMath */}
          <div
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '15px 16px', marginBottom: 16,
              fontSize: '.9rem', lineHeight: 1.72, color: 'var(--tp)', minHeight: 60,
            }}
            dangerouslySetInnerHTML={qHtml.question}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px',
                    background: isSel ? col.bg : 'var(--bg-card)',
                    border: `1.5px solid ${isSel ? col.border : 'var(--border)'}`,
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all .16s ease',
                    boxShadow: isSel ? `0 0 0 1px ${col.border}` : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: isSel ? col.bg : 'var(--bg-input)',
                    border: `2px solid ${isSel ? col.border : 'var(--border2)'}`,
                    color: isSel ? col.text : 'var(--ts)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-d)', fontSize: '.68rem', fontWeight: 800,
                    transition: 'all .16s',
                  }}>{label}</span>

                  {/* Option text — XSS-safe, already in cache */}
                  <span
                    style={{
                      flex: 1, fontSize: '.86rem', lineHeight: 1.56,
                      color: isSel ? 'var(--tp)' : 'var(--ts)',
                      fontWeight: isSel ? 600 : 400,
                      paddingTop: 3, transition: 'color .16s',
                    }}
                    dangerouslySetInnerHTML={html}
                  />
                </button>
              );
            })}
          </div>

          {allAnswered && (
            <div style={{
              marginTop: 16, textAlign: 'center',
              fontSize: '.72rem', color: '#4ade80',
              fontWeight: 700, letterSpacing: '.3px',
            }}>
              ✓ All questions answered — ready to submit!
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
          padding: '12px 18px 22px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-sidebar)',
          flexShrink: 0,
        }}>
          {/* Dot navigator */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: 5, marginBottom: 13, flexWrap: 'wrap',
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
                    width: current ? 22 : 8, height: 8, borderRadius: 4,
                    background: current
                      ? 'var(--accent)'
                      : done ? 'rgba(74,222,128,.65)' : 'rgba(255,255,255,.15)',
                    border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                    transition: 'all .22s cubic-bezier(.22,.1,.36,1)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onNav(Math.max(0, currentQ - 1))}
              disabled={isFirst}
              style={{
                flex: 1, padding: '13px',
                background: 'var(--bg-input)', border: '1px solid var(--border2)',
                borderRadius: 12,
                color: isFirst ? 'var(--tm)' : 'var(--ts)',
                fontSize: '.82rem', fontWeight: 700,
                cursor: isFirst ? 'default' : 'pointer',
                opacity: isFirst ? .38 : 1, transition: 'opacity .15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >← Prev</button>

            {allAnswered ? (
              <button
                onClick={onSubmit}
                disabled={submitting}
                style={{
                  flex: 2, padding: '13px',
                  background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                  border: 'none', borderRadius: 12,
                  color: '#fff', fontSize: '.88rem', fontWeight: 800,
                  cursor: submitting ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 7,
                  letterSpacing: '.3px', fontFamily: 'var(--font-d)',
                  boxShadow: '0 4px 16px rgba(22,163,74,.32)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {submitting
                  ? <>
                      <span style={{
                        width: 12, height: 12, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,.35)',
                        borderTopColor: '#fff',
                        animation: 'spin .7s linear infinite',
                        display: 'inline-block',
                      }} />
                      Submitting…
                    </>
                  : '✓ Submit Test'
                }
              </button>
            ) : (
              <button
                onClick={() => onNav(Math.min(numQ - 1, currentQ + 1))}
                style={{
                  flex: 2, padding: '13px',
                  background: 'linear-gradient(135deg,var(--accent3),var(--accent))',
                  border: 'none', borderRadius: 12,
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
      const bg     = isRight ? 'rgba(34,197,94,.1)'  : 'rgba(239,68,68,.1)';
      const border = isRight ? 'rgba(34,197,94,.3)'  : 'rgba(239,68,68,.3)';
      const badge  = isRight ? '#4ade80'              : '#f87171';

      return (
        <div style={{
          background: bg, border: `1px solid ${border}`,
          borderRadius: 12, padding: '13px 14px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 8,
          }}>
            <span style={{ fontSize: '.67rem', fontWeight: 800, color: 'var(--ts)' }}>
              Q{i + 1}
            </span>
            <span style={{ fontSize: '.62rem', fontWeight: 800, color: badge, letterSpacing: '.4px' }}>
              {isRight ? '✓ CORRECT' : '✗ WRONG'}
            </span>
          </div>

          <div
            style={{ fontSize: '.8rem', color: 'var(--ts)', lineHeight: 1.56, marginBottom: 10 }}
            dangerouslySetInnerHTML={qHtml ? qHtml.question : { __html: '' }}
          />

          {!isRight && userAns && (
            <div style={{ fontSize: '.74rem', color: '#f87171', marginBottom: 5 }}>
              Your answer: <strong>{userAns}</strong>
              {' — '}
              <span dangerouslySetInnerHTML={qHtml ? qHtml[userAns] : { __html: '—' }} />
            </div>
          )}

          <div style={{ fontSize: '.74rem', color: '#4ade80', fontWeight: 600 }}>
            ✓ Correct: <strong>{correct}</strong>
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
        pct >= 90 ? { label: 'Excellent! 🎉', color: '#4ade80' } :
        pct >= 75 ? { label: 'Great job! 👍', color: '#60a5fa' } :
        pct >= 50 ? { label: 'Good effort',   color: '#fbbf24' } :
                   { label: 'Keep practising', color: '#f87171' };

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
          maxWidth: 520, margin: '0 auto', width: '100%',
          padding: '30px 18px 50px',
        }}>

          <div style={{
            textAlign: 'center', marginBottom: 26,
            fontFamily: 'var(--font-d)', fontSize: '1.45rem',
            fontWeight: 800, color: grade.color, letterSpacing: '-.4px',
          }}>
            {grade.label}
          </div>

          {/* Score ring */}
          <div style={{
            width: 148, height: 148, borderRadius: '50%', margin: '0 auto 26px',
            background: `conic-gradient(${grade.color} ${pct * 3.6}deg, rgba(255,255,255,.06) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 116, height: 116, borderRadius: '50%',
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
              <span style={{ fontSize: '.64rem', color: 'var(--ts)', fontWeight: 700 }}>
                {pct}%
              </span>
            </div>
          </div>

          {/* Stats chips */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 26 }}>
            {[
              { label: 'XP Earned',  val: `+${xpEarned}`, color: '#fbbf24' },
              { label: 'Correct',    val: score,           color: '#4ade80' },
              { label: 'Incorrect',  val: numQ - score,    color: '#f87171' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '10px 16px', textAlign: 'center', flex: 1,
              }}>
                <div style={{
                  fontSize: '.5rem', color: 'var(--ts)', fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 5,
                }}>{label}</div>
                <div style={{
                  fontFamily: 'var(--font-d)', fontSize: '1.05rem', fontWeight: 800, color,
                }}>{val}</div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '14px', marginBottom: 22,
              background: 'linear-gradient(135deg,var(--accent3),var(--accent))',
              border: 'none', borderRadius: 12,
              color: '#fff', fontSize: '.88rem', fontWeight: 800,
              cursor: 'pointer', letterSpacing: '.3px', fontFamily: 'var(--font-d)',
              boxShadow: '0 4px 16px rgba(37,99,235,.26)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >Done</button>

          {/* WRONG answers — expanded by default (study focus) */}
          {wrongItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setShowWrong(v => !v)}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(239,68,68,.08)',
                  border: '1px solid rgba(239,68,68,.25)', borderRadius: 12,
                  color: '#f87171', fontSize: '.84rem', fontWeight: 700,
                  cursor: 'pointer', textAlign: 'left',
                  marginBottom: showWrong ? 11 : 0,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span>✗ {wrongItems.length} Wrong Answer{wrongItems.length !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: '.7rem' }}>{showWrong ? '▲' : '▼'}</span>
              </button>
              {showWrong && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {wrongItems.map(({ q, i, userAns }) => (
                    <ReviewItem key={i} q={q} i={i} userAns={userAns} isRight={false} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CORRECT answers — collapsed by default (lightweight DOM) */}
          {correctItems.length > 0 && (
            <div>
              <button
                onClick={() => setShowCorrect(v => !v)}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(34,197,94,.08)',
                  border: '1px solid rgba(34,197,94,.25)', borderRadius: 12,
                  color: '#4ade80', fontSize: '.84rem', fontWeight: 700,
                  cursor: 'pointer', textAlign: 'left',
                  marginBottom: showCorrect ? 11 : 0,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span>✓ {correctItems.length} Correct Answer{correctItems.length !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: '.7rem' }}>{showCorrect ? '▲' : '▼'}</span>
              </button>
              {/* Only mounted when user requests — keeps initial DOM lean */}
              {showCorrect && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              height: '100%', maxWidth: 520, margin: '0 auto', width: '100%',
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

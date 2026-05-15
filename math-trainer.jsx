/* globals: React and math (mathjs) are set by scripts in chat.html */
const { useState, useCallback, useEffect, useRef } = React;

// ── Runtime getter — evaluated on each call so a slow CDN script
//    cannot leave math=undefined when the file first parses. ──
const getMath = () => window.math || window.mathjs;

// ══════════════════════════════════════════════════════════════════════
//  1. KATEX — Load from CDN, render LaTeX strings beautifully
// ══════════════════════════════════════════════════════════════════════
let _katexReady = typeof window !== 'undefined' && !!window.katex;

function useKaTeX() {
  const [ready, setReady] = useState(_katexReady);
  useEffect(() => {
    if (_katexReady) { setReady(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
    document.head.appendChild(link);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
    s.onload = () => { _katexReady = true; setReady(true); };
    document.head.appendChild(s);
  }, []);
  return ready;
}

// Renders a LaTeX string — inline or block. Falls back to styled monospace.
function TeX({ children, block = false }) {
  const ready = useKaTeX();
  const ref = useRef(null);
  useEffect(() => {
    if (!ready || !ref.current || !window.katex) return;
    try {
      window.katex.render(String(children), ref.current, {
        displayMode: block, throwOnError: false, output: 'html',
      });
    } catch (_) { if (ref.current) ref.current.textContent = children; }
  }, [ready, children, block]);

  if (!ready) {
    return (
      <span style={{
        fontFamily:'Georgia,serif', color:'#a8cce8',
        fontSize: block ? 17 : 14,
        display: block ? 'block' : 'inline',
        textAlign: block ? 'center' : undefined,
        padding: block ? '6px 0' : undefined,
      }}>{children}</span>
    );
  }
  return <span ref={ref} style={block ? { display:'block', textAlign:'center' } : {}} />;
}

// ══════════════════════════════════════════════════════════════════════
//  2. SMART DISTRACTOR GENERATOR
//     Models real student mistakes — not just n ± 1
// ══════════════════════════════════════════════════════════════════════
const MISTAKE = {
  // Forgot to negate (sign error)
  sign:    (n) => [-n, Math.abs(n) + 1, Math.abs(n) - 1].filter(x => x !== n),
  // Added exponents instead of multiplying (or vice versa)
  addmul:  (n) => [n + 2, n * 2, Math.ceil(n / 2)],
  // Off by one — very common in combinatorics / sequence counting
  offone:  (n) => [n - 1, n + 1, n + 2],
  // Forgot to halve / doubled accidentally
  double:  (n) => [n * 2, Math.ceil(n / 2), n + n - 1],
  // Didn't take square root (used n² when √n was needed)
  nosqrt:  (n) => [n * n, n + 1, Math.max(1, n - 1)],
  // Partial calculation — stopped one step early
  partial: (n) => [Math.round(n * 0.6), Math.round(n * 1.4), n + Math.ceil(n * 0.2)],
  // Generic numeric proximity
  numeric: (n) => {
    const step = Math.max(1, Math.round(Math.abs(n) * 0.15));
    return [n + step, n - step, n + step * 2];
  },
};

function smartMcq(correctStr, mistakeType = 'numeric', extras = []) {
  const n = parseFloat(correctStr);
  let wrongs;
  if (!isNaN(n) && MISTAKE[mistakeType]) {
    wrongs = MISTAKE[mistakeType](n)
      .filter(w => !isNaN(w) && w !== n && isFinite(w))
      .map(w => Number.isInteger(w) ? String(w) : w.toFixed(2));
  } else {
    wrongs = extras.slice(0, 3);
  }
  const allWrongs = [...new Set([...wrongs, ...extras])].filter(w => w !== correctStr).slice(0, 3);
  while (allWrongs.length < 3) allWrongs.push(String(Math.abs(parseFloat(correctStr) || 0) + allWrongs.length + 1));
  const opts = sh([correctStr, ...allWrongs.slice(0, 3)]);
  return { options: opts, answerIndex: opts.indexOf(correctStr) };
}

// ══════════════════════════════════════════════════════════════════════
//  3. INTERACTIVE SVG GRAPHS — Ch10 Lines, Ch11 Conics
// ══════════════════════════════════════════════════════════════════════

const GRAPH_STYLE = { background:'#060c18', borderRadius:10, border:'1px solid #1a2c45', display:'block' };

function GridAxes({ W, H, cx, cy, sc }) {
  const ticks = [-5,-4,-3,-2,-1,1,2,3,4,5];
  return (
    <>
      {ticks.map(i => (
        <g key={i}>
          <line x1={cx+i*sc} y1={0} x2={cx+i*sc} y2={H} stroke="#0e1929" strokeWidth={1}/>
          <line x1={0} y1={cy-i*sc} x2={W} y2={cy-i*sc} stroke="#0e1929" strokeWidth={1}/>
        </g>
      ))}
      <line x1={0} y1={cy} x2={W} y2={cy} stroke="#253548" strokeWidth={1.5}/>
      <line x1={cx} y1={0} x2={cx} y2={H} stroke="#253548" strokeWidth={1.5}/>
      {ticks.map(i => (
        <g key={i}>
          <text x={cx+i*sc-3} y={cy+13} fill="#253548" fontSize={8} fontFamily="monospace">{i}</text>
          <text x={cx+4} y={cy-i*sc+3} fill="#253548" fontSize={8} fontFamily="monospace">{i !== 0 ? i : ''}</text>
        </g>
      ))}
      <text x={W-14} y={cy-5} fill="#304458" fontSize={10} fontFamily="monospace">x</text>
      <text x={cx+4} y={10} fill="#304458" fontSize={10} fontFamily="monospace">y</text>
    </>
  );
}

function LineGraph({ x1, y1, x2, y2 }) {
  const W=310,H=240,cx=155,cy=120,sc=20;
  const sv = (x,y) => [cx+x*sc, cy-y*sc];
  const dx=x2-x1, dy=y2-y1;
  let lx1,ly1,lx2,ly2;
  if (Math.abs(dx) < 0.001) {
    lx1=lx2=cx+x1*sc; ly1=0; ly2=H;
  } else {
    const m=dy/dx, b=y1-m*x1;
    const xL=(0-cx)/sc, xR=(W-cx)/sc;
    [lx1,ly1]=sv(xL,m*xL+b); [lx2,ly2]=sv(xR,m*xR+b);
  }
  const [s1x,s1y]=sv(x1,y1), [s2x,s2y]=sv(x2,y2);
  return (
    <svg width={W} height={H} style={GRAPH_STYLE}>
      <GridAxes W={W} H={H} cx={cx} cy={cy} sc={sc}/>
      <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="#f5a623" strokeWidth={2.5}/>
      <circle cx={s1x} cy={s1y} r={5} fill="#7eb8f7" stroke="#060c18" strokeWidth={1.5}/>
      <text x={s1x+7} y={s1y-6} fill="#7eb8f7" fontSize={10} fontFamily="monospace">A({x1},{y1})</text>
      <circle cx={s2x} cy={s2y} r={5} fill="#5de89a" stroke="#060c18" strokeWidth={1.5}/>
      <text x={s2x+7} y={s2y-6} fill="#5de89a" fontSize={10} fontFamily="monospace">B({x2},{y2})</text>
    </svg>
  );
}

function ParabolaGraph({ a, direction }) {
  const W=310,H=240,cx=155,cy=120,sc=18;
  const sv=(x,y)=>[cx+x*sc,cy-y*sc];
  const pts=[];
  for(let t=-8;t<=8;t+=0.15){
    let x,y;
    if(direction==='right'){x=t*t/(4*a);y=t;}
    else if(direction==='left'){x=-t*t/(4*a);y=t;}
    else if(direction==='up'){x=t;y=t*t/(4*a);}
    else{x=t;y=-t*t/(4*a);}
    const[sx,sy]=sv(x,y);
    if(sx>0&&sx<W&&sy>0&&sy<H) pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
  }
  const[fx,fy]=direction==='right'?sv(a,0):direction==='left'?sv(-a,0):direction==='up'?sv(0,a):sv(0,-a);
  const dirY=direction==='up'?sv(0,-a)[1]:direction==='down'?sv(0,a)[1]:null;
  const dirX=direction==='right'?sv(-a,0)[0]:direction==='left'?sv(a,0)[0]:null;
  return (
    <svg width={W} height={H} style={GRAPH_STYLE}>
      <GridAxes W={W} H={H} cx={cx} cy={cy} sc={sc}/>
      {dirY!=null && <><line x1={0} y1={dirY} x2={W} y2={dirY} stroke="#f07070" strokeWidth={1.5} strokeDasharray="5,4"/><text x={4} y={dirY-5} fill="#f07070" fontSize={9} fontFamily="monospace">directrix</text></>}
      {dirX!=null && <><line x1={dirX} y1={0} x2={dirX} y2={H} stroke="#f07070" strokeWidth={1.5} strokeDasharray="5,4"/><text x={dirX+3} y={14} fill="#f07070" fontSize={9} fontFamily="monospace">dir</text></>}
      {pts.length>1&&<polyline points={pts.join(' ')} fill="none" stroke="#7eb8f7" strokeWidth={2.5} strokeLinejoin="round"/>}
      <circle cx={cx} cy={cy} r={4} fill="#5de89a"/>
      <text x={cx+5} y={cy-8} fill="#5de89a" fontSize={9} fontFamily="monospace">V(0,0)</text>
      <circle cx={fx} cy={fy} r={5} fill="#f5a623"/>
      <text x={fx+6} y={fy-6} fill="#f5a623" fontSize={9} fontFamily="monospace">F(focus)</text>
    </svg>
  );
}

function EllipseGraph({ a2, b2 }) {
  const W=310,H=240,cx=155,cy=120;
  const a=Math.sqrt(a2),b=Math.sqrt(b2);
  const sc=Math.min(45,Math.floor(90/Math.max(a,b)));
  const c2=a2-b2,c=c2>0?Math.sqrt(c2):0;
  const rx=a*sc,ry=b*sc,cf=c*sc;
  return (
    <svg width={W} height={H} style={GRAPH_STYLE}>
      <GridAxes W={W} H={H} cx={cx} cy={cy} sc={sc}/>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="rgba(126,184,247,0.06)" stroke="#7eb8f7" strokeWidth={2}/>
      <line x1={cx} y1={cy} x2={cx+rx} y2={cy} stroke="#1e4040" strokeWidth={1} strokeDasharray="3,3"/>
      <text x={cx+rx/2-8} y={cy-5} fill="#5de89a" fontSize={9} fontFamily="monospace">a={a.toFixed(0)}</text>
      <line x1={cx} y1={cy} x2={cx} y2={cy-ry} stroke="#1e4040" strokeWidth={1} strokeDasharray="3,3"/>
      <text x={cx+4} y={cy-ry/2+3} fill="#5de89a" fontSize={9} fontFamily="monospace">b={b.toFixed(0)}</text>
      {cf>0&&<>
        <circle cx={cx+cf} cy={cy} r={4} fill="#f5a623"/><text x={cx+cf+5} y={cy-7} fill="#f5a623" fontSize={9} fontFamily="monospace">F₁</text>
        <circle cx={cx-cf} cy={cy} r={4} fill="#f5a623"/><text x={cx-cf-18} y={cy-7} fill="#f5a623" fontSize={9} fontFamily="monospace">F₂</text>
      </>}
      <circle cx={cx} cy={cy} r={3} fill="#5de89a"/>
    </svg>
  );
}

function CircleGraph({ h, k, r }) {
  const W=310,H=240,cx=155,cy=120,sc=20;
  const sv=(x,y)=>[cx+x*sc,cy-y*sc];
  const[scx,scy]=sv(h,k),sr=r*sc;
  return (
    <svg width={W} height={H} style={GRAPH_STYLE}>
      <GridAxes W={W} H={H} cx={cx} cy={cy} sc={sc}/>
      <circle cx={scx} cy={scy} r={sr} fill="rgba(126,184,247,0.06)" stroke="#7eb8f7" strokeWidth={2}/>
      <line x1={scx} y1={scy} x2={scx+sr} y2={scy} stroke="#1e4040" strokeWidth={1} strokeDasharray="3,3"/>
      <text x={scx+sr/2-8} y={scy-6} fill="#5de89a" fontSize={9} fontFamily="monospace">r={r}</text>
      <circle cx={scx} cy={scy} r={4} fill="#f5a623"/>
      <text x={scx+6} y={scy-7} fill="#f5a623" fontSize={9} fontFamily="monospace">({h},{k})</text>
    </svg>
  );
}

function GraphPanel({ config }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{color:"#3a5a70",fontSize:10,fontFamily:"monospace",letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>
        ◈ Visual
      </div>
      {config.type==='line'     && <LineGraph {...config}/>}
      {config.type==='parabola' && <ParabolaGraph {...config}/>}
      {config.type==='ellipse'  && <EllipseGraph {...config}/>}
      {config.type==='circle'   && <CircleGraph {...config}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  4. STEP-BY-STEP REVEAL
//     Steps revealed one at a time. Auto-parsed from solution string
//     or supplied as an explicit steps[] array on the card.
// ══════════════════════════════════════════════════════════════════════
function StepReveal({ steps, keyFormula }) {
  const [revealed, setRevealed] = useState(0);
  const done = revealed >= steps.length;

  return (
    <div>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
      `}</style>

      {/* Key formula rendered via KaTeX */}
      {keyFormula && (
        <div style={{
          background:'#0c1628', border:'1px solid #1a3050', borderRadius:10,
          padding:'14px 20px', marginBottom:16, textAlign:'center'
        }}>
          <div style={{color:'#3a5a80',fontSize:10,fontFamily:'monospace',letterSpacing:2,marginBottom:10,textTransform:'uppercase'}}>
            Key Formula
          </div>
          <TeX block>{keyFormula}</TeX>
        </div>
      )}

      {/* Revealed steps */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
        {steps.slice(0, revealed).map((step, i) => {
          const isLast = i === steps.length - 1;
          const isFormula = /formula|rule|identity|law|let |define|using|property/i.test(step);
          return (
            <div key={i} style={{
              display:'flex', gap:12, alignItems:'flex-start',
              background: isLast ? '#0d2018' : isFormula ? '#0c1830' : '#0d1520',
              border: isLast ? '1px solid #1e5a30' : isFormula ? '1px solid #1e3a60' : '1px solid #151f30',
              borderLeft: isLast ? '3px solid #2a9a60' : isFormula ? '3px solid #2a5aaf' : '3px solid #1e2840',
              borderRadius:8, padding:'10px 14px',
              animation:'slideUp 0.2s ease',
            }}>
              <span style={{
                background: isLast?'#1a5a30':isFormula?'#1a3a60':'#151f30',
                color: isLast?'#5de89a':isFormula?'#7eb8f7':'#3a5070',
                borderRadius:'50%', width:22, height:22, minWidth:22,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontFamily:'monospace', fontWeight:'bold',
              }}>{i+1}</span>
              <pre style={{
                color: isLast?'#7adba8':isFormula?'#a8cce8':'#8a9aaa',
                fontSize:13, margin:0, whiteSpace:'pre-wrap',
                fontFamily:'monospace', lineHeight:1.7,
              }}>{step}</pre>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      {!done ? (
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setRevealed(r => r + 1)} style={{
            padding:'9px 22px', background:'transparent',
            border:'1px solid #2a4a40', borderRadius:8,
            color:'#4a8a6a', cursor:'pointer', fontSize:13,
            fontFamily:'monospace', letterSpacing:1, transition:'all 0.2s',
          }}>
            {revealed === 0 ? 'Start Solution →' : `Step ${revealed+1} of ${steps.length} →`}
          </button>
          {revealed > 0 && (
            <button onClick={() => setRevealed(steps.length)} style={{
              padding:'9px 18px', background:'transparent',
              border:'1px solid #1e2a38', borderRadius:8,
              color:'#3a4a58', cursor:'pointer', fontSize:12,
              fontFamily:'monospace', transition:'all 0.2s',
            }}>
              Show All
            </button>
          )}
        </div>
      ) : (
        <div style={{
          padding:'10px 16px', background:'#0a1a10', border:'1px solid #2a6040',
          borderRadius:8, color:'#5de89a', fontSize:12,
          fontFamily:'monospace', textAlign:'center',
        }}>
          ✓ Solution complete — hit GENERATE for a new problem
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MATH UTILITIES (unchanged from v1)
// ══════════════════════════════════════════════════════════════════════
const ri  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const sh   = a => [...a].sort(() => Math.random() - 0.5);
const abs  = Math.abs;

function gcd(a, b) { return b === 0 ? abs(a) : gcd(abs(b), abs(a) % abs(b)); }
function fact(n) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }
function isPrime(n) { if (n < 2) return false; for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false; return true; }
function primes(max) { const p = []; for (let i = 2; i <= max; i++) if (isPrime(i)) p.push(i); return p; }
function factors(n) { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; }
function C(n, k) { if (k > n || k < 0) return 0; return Math.round(fact(n) / (fact(k) * fact(n - k))); }
function Perm(n, k) { if (k > n) return 0; return Math.round(fact(n) / fact(n - k)); }
function subsets(arr) {
  const res = [];
  for (let mask = 0; mask < (1 << arr.length); mask++) {
    const sub = arr.filter((_, i) => mask & (1 << i));
    res.push(sub.length === 0 ? "∅" : `{${sub.join(",")}}`);
  }
  return res;
}
function wrongs3(correct, spread = [1, 2, 3]) {
  const s = new Set();
  for (const d of spread) { s.add(correct + d); s.add(correct - d); }
  return [...s].filter(x => x !== correct && x > 0).slice(0, 3);
}
function mcq(correctStr, wrongStrs) {
  const opts = sh([correctStr, ...wrongStrs.slice(0, 3)]);
  return { options: opts, answerIndex: opts.indexOf(correctStr) };
}
const DEG = ["30","45","60","90","120","135","150","180","210","240","270","300","330","360"];
const RAD = ["π/6","π/4","π/3","π/2","2π/3","3π/4","5π/6","π","7π/6","4π/3","3π/2","5π/3","11π/6","2π"];
const SIN = ["1/2","1/√2","√3/2","1","√3/2","1/√2","1/2","0","−1/2","−√3/2","−1","−√3/2","−1/2","0"];
const COS = ["√3/2","1/√2","1/2","0","−1/2","−1/√2","−√3/2","−1","−√3/2","−1/2","0","1/2","√3/2","1"];

// ══════════════════════════════════════════════════════════════════════
//  PROCEDURAL ENGINE — all 16 chapters
//  Upgrades: ch10/ch11 have graph:{} + keyFormula, ch13 uses mathjs
// ══════════════════════════════════════════════════════════════════════
const ENGINE = {

  ch1: {
    title: "Sets",
    teach: [
      () => {
        const kinds = ["multiples","squares","factors","primes"];
        const kind = pick(kinds);
        let desc, elems, sbf;
        if (kind === "multiples") {
          const m = ri(3,8), lim = ri(30,60);
          elems=[]; for(let x=m;x<lim;x+=m) elems.push(x);
          desc=`multiples of ${m} less than ${lim}`; sbf=`{ x : x = ${m}k, k ∈ ℕ, x < ${lim} }`;
        } else if (kind === "squares") {
          const lim=ri(50,120); elems=[];
          for(let i=1;i*i<lim;i++) elems.push(i*i);
          desc=`perfect squares less than ${lim}`; sbf=`{ x : x = n², n ∈ ℕ, x < ${lim} }`;
        } else if (kind === "factors") {
          const n=pick([12,18,24,30,36,48,60]); elems=factors(n);
          desc=`factors of ${n}`; sbf=`{ x : x | ${n}, x ∈ ℕ }`;
        } else {
          const lim=ri(20,40); elems=primes(lim);
          desc=`prime numbers less than ${lim}`; sbf=`{ x : x is prime, x < ${lim} }`;
        }
        return { title:"Roster Form from Set-Builder", concept:`In roster form, list every element inside { } separated by commas. Order doesn't matter; no element is repeated.`, problem:`Write the set of all ${desc} in roster form.`, solution:`{ ${elems.join(", ")} }\n\nSet-builder form: ${sbf}\nNumber of elements: ${elems.length}` };
      },
      () => {
        const size=ri(2,4);
        const base=sh([1,2,3,4,5,6,7,8,9]).slice(0,size).sort((a,b)=>a-b);
        const subs=subsets(base); const pw=1<<size;
        return { title:"Power Set Enumeration", concept:`The Power Set P(A) is the set of ALL subsets of A. If |A| = n, then |P(A)| = 2ⁿ.`, problem:`List all subsets of A = {${base.join(",")}} and find |P(A)|.`, solution:`Subsets: ${subs.join("  ")}\n\n|P(A)| = 2^${size} = ${pw}` };
      },
      () => {
        const total=ri(50,100),a=ri(20,40),b=ri(20,40),both=ri(5,Math.min(a,b)-5);
        const either=a+b-both, neither=total-either;
        const sport=pick(["cricket","football","badminton","chess","tennis"]);
        const art=pick(["painting","dancing","singing","coding","reading"]);
        return { title:"Practical Problem — Union & Intersection", concept:`n(A ∪ B) = n(A) + n(B) − n(A ∩ B).  Neither = Total − n(A ∪ B).`, problem:`In a school of ${total} students, ${a} play ${sport} and ${b} practice ${art}. ${both} do both. (a) at least one? (b) neither?`, solution:`n(A ∪ B) = ${a} + ${b} − ${both} = ${either}\n\n(a) At least one: ${either}\n(b) Neither: ${total} − ${either} = ${neither<0?0:neither}` };
      },
      () => {
        const A=sh([1,2,3,4,5,6,7,8,9,10]).slice(0,ri(3,5)).sort((a,b)=>a-b);
        const B=sh([2,4,6,8,10,12,14]).slice(0,ri(3,5)).sort((a,b)=>a-b);
        const union=[...new Set([...A,...B])].sort((a,b)=>a-b);
        const inter=A.filter(x=>B.includes(x)), Aminus=A.filter(x=>!B.includes(x));
        return { title:"Set Operations — A∪B, A∩B, A−B", concept:`A∪B: all in A OR B.\nA∩B: only in BOTH.\nA−B: in A but NOT in B.`, problem:`A={${A.join(",")}}, B={${B.join(",")}}.\nFind (i) A∪B  (ii) A∩B  (iii) A−B.`, solution:`(i) A∪B = {${union.join(",")}}\n(ii) A∩B = {${inter.length?inter.join(","):"∅"}}\n(iii) A−B = {${Aminus.length?Aminus.join(","):"∅"}}` };
      },
      () => {
        const U=Array.from({length:10},(_,i)=>i+1);
        const A=sh(U).slice(0,ri(3,6)).sort((a,b)=>a-b), B=sh(U).slice(0,ri(3,6)).sort((a,b)=>a-b);
        const Ac=U.filter(x=>!A.includes(x)), Bc=U.filter(x=>!B.includes(x));
        const AuBc=U.filter(x=>!(A.includes(x)||B.includes(x))), AcnBc=Ac.filter(x=>Bc.includes(x));
        return { title:"De Morgan's Laws", concept:`(A∪B)' = A' ∩ B'\n(A∩B)' = A' ∪ B'`, problem:`U={1..10}, A={${A.join(",")}}, B={${B.join(",")}}.\nVerify (A∪B)' = A'∩B'.`, solution:`A' = {${Ac.join(",")}}\nB' = {${Bc.join(",")}}\n(A∪B)' = {${AuBc.length?AuBc.join(","):"∅"}}\nA'∩B' = {${AcnBc.length?AcnBc.join(","):"∅"}}\n(A∪B)' = A'∩B'  ✓` };
      },
      () => {
        const total=ri(40,80),a=ri(15,30),b=ri(15,30),c=ri(10,20);
        const ab=ri(3,8),bc=ri(3,8),ac=ri(3,8),abc=ri(1,3);
        const union=a+b+c-ab-bc-ac+abc, neither=total-union;
        return { title:"Three-Set Formula", concept:`n(A∪B∪C) = n(A)+n(B)+n(C) − n(A∩B)−n(B∩C)−n(A∩C) + n(A∩B∩C)`, problem:`${total} students: ${a} Maths, ${b} Physics, ${c} Chemistry. M&P=${ab}, P&C=${bc}, M&C=${ac}, all=${abc}.\n(i) At least one? (ii) None?`, solution:`n(M∪P∪C) = ${a}+${b}+${c} − ${ab}−${bc}−${ac} + ${abc}\n= ${union}\n\n(i) At least one: ${union}\n(ii) None: ${total} − ${union} = ${Math.max(0,neither)}` };
      },
    ],
    check: [
      () => { const n=ri(2,5),ans=1<<n; const{options,answerIndex}=mcq(`${ans}`,wrongs3(ans,[1,2,4]).map(String)); return{title:"Power Set Size",question:`Set A has ${n} elements. How many elements does P(A) have?`,options,answerIndex,explanation:`|P(A)| = 2ⁿ = 2^${n} = ${ans}.`,mistakeType:'double'}; },
      () => { const total=ri(40,80),a=ri(15,30),b=ri(15,30),both=ri(3,(Math.min(a,b)/2)|0),neither=Math.max(0,total-a-b+both); const{options,answerIndex}=mcq(`${neither}`,[neither+5,neither-5<0?neither+8:neither-5,neither+3].map(String)); return{title:"Neither Count",question:`${total} people; ${a} like tea, ${b} like coffee, ${both} like both. How many like neither?`,options,answerIndex,explanation:`n(T∪C)=${a}+${b}−${both}=${a+b-both}. Neither=${total}−${a+b-both}=${neither}.`,mistakeType:'sign'}; },
      () => { const n=ri(20,64),maxX=Math.floor(Math.sqrt(n-1)); const{options,answerIndex}=mcq(`${maxX}`,[maxX+1,maxX-1,maxX+2].map(String)); return{title:"Roster — Count Elements",question:`How many elements are in { x : x ∈ ℕ, x² < ${n} }?`,options,answerIndex,explanation:`Largest x is ${maxX} since ${maxX}²=${maxX*maxX}<${n} but ${maxX+1}²=${(maxX+1)**2}≥${n}.`,mistakeType:'offone'}; },
      () => { const A=[ri(1,4),ri(5,7),ri(8,10)],B=[A[0],ri(11,14),ri(15,18)],union=[...new Set([...A,...B])]; const ans=`{${union.sort((a,b)=>a-b).join(",")}}`,{options,answerIndex}=mcq(ans,[`{${A.join(",")}}`,`{${B.join(",")}}`,`{${A[0]}}`]); return{title:"A∪B Value",question:`A={${A.join(",")}}, B={${B.join(",")}}. Find A∪B.`,options,answerIndex,explanation:`A∪B contains all elements from both: ${ans}.`,mistakeType:'partial'}; },
    ],
  },

  ch2: {
    title: "Relations & Functions",
    teach: [
      () => { const p=ri(2,4),q=ri(2,4),A=sh([1,2,3,4,5]).slice(0,p),B=sh(["a","b","c","d","e"]).slice(0,q),prod=[]; A.forEach(a=>B.forEach(b=>prod.push(`(${a},${b})`))); return{title:"Cartesian Product A × B",concept:`A × B = {(a,b) : a ∈ A, b ∈ B}. n(A×B) = n(A)×n(B).`,problem:`A = {${A.join(",")}}  B = {${B.join(",")}}. Find A × B.`,solution:`A × B = { ${prod.join(", ")} }\n\n|A × B| = ${p} × ${q} = ${p*q}`,keyFormula:`|A \\times B| = |A| \\cdot |B| = ${p} \\cdot ${q} = ${p*q}`}; },
      () => { const A=[ri(1,3),ri(4,6),ri(7,9)],d=ri(1,3),rel=A.map(x=>[x,x+d]).filter(([x,y])=>y<=10); return{title:"Relation — Domain & Range",concept:`Domain = set of all first elements. Range = set of all second elements. Range ⊆ Codomain.`,problem:`A = {${A.join(",")}} and R = {(x,y) : y = x + ${d}}. Find R, domain, range.`,solution:"R = { "+rel.map(([a,b])=>"("+a+","+b+")").join(", ")+" }\nDomain = {"+rel.map(r=>r[0]).join(",")+"}\nRange  = {"+rel.map(r=>r[1]).join(",")+"}"}; },
      () => { const n=ri(3,5),A=Array.from({length:n},(_,i)=>i+1),type=pick(["one-one","constant","quadratic"]); let fDef,pairs,isOneOne,isOnto; if(type==="one-one"){pairs=A.map(x=>[x,x*ri(1,2)]);fDef=`f(x) = ${pairs[0][1]/pairs[0][0]}x`;isOneOne=true;isOnto=false;}else if(type==="constant"){const c=ri(2,5);pairs=A.map(x=>[x,c]);fDef=`f(x) = ${c}`;isOneOne=false;isOnto=false;}else{pairs=A.map(x=>[x,x*x]);fDef=`f(x) = x²`;isOneOne=false;isOnto=false;} return{title:"Function — One-One & Onto",concept:`A function: every domain element has exactly ONE image.\nOne-one: distinct inputs → distinct images.\nOnto: every codomain element is hit.`,problem:`f: {${A.join(",")}} → ℕ defined by ${fDef}. Is f one-one? Onto?`,solution:"Pairs: { "+pairs.map(([a,b])=>"("+a+","+b+")").join(", ")+" }\nOne-one: "+(isOneOne?"YES — all images distinct":"NO — some images repeat")+"\nOnto: "+(isOnto?"YES":"NO — not all of ℕ is covered")}; },
      () => { const m=ri(2,4),n=ri(2,4),A=Array.from({length:m},(_,i)=>i+1),B=Array.from({length:n},(_,i)=>String.fromCharCode(97+i)); const totalRel=Math.pow(2,m*n),totalFunc=Math.pow(n,m); return{title:"Number of Relations vs Functions",concept:`Total relations = 2^(|A|×|B|)\nTotal functions = |B|^|A|\nFunctions ⊂ Relations.`,problem:`A={${A.join(",")}}, B={${B.join(",")}}. Count total relations and functions from A to B.`,solution:`|A|=${m}, |B|=${n}\n|A×B| = ${m*n}\nTotal relations = 2^${m*n} = ${totalRel}\nTotal functions = ${n}^${m} = ${totalFunc}`,keyFormula:`\\text{Relations} = 2^{|A||B|} = ${totalRel}, \\quad \\text{Functions} = |B|^{|A|} = ${totalFunc}`}; },
      () => { const ops=[{sym:"+",fn:(a,b)=>a+b},{sym:"−",fn:(a,b)=>a-b},{sym:"×",fn:(a,b)=>a*b}]; const op=pick(ops),a=ri(1,5),b=ri(1,4),x=ri(2,6),y=ri(2,6),fv=op.fn(x,a),gv=op.fn(y,b),fg=op.fn(fv,gv); let combined=op.sym==="+"?"2x+"+(a+b):op.sym==="−"?String(a-b):"x²+"+(a+b)+"x+"+(a*b); return{title:"Algebra of Functions",concept:"For f,g: A→R:\n(f+g)(x)=f(x)+g(x)  (f−g)(x)=f(x)−g(x)  (f·g)(x)=f(x)·g(x)",problem:"f(x)=x+"+a+", g(x)=x+"+b+". Find (f "+op.sym+" g)(x) and evaluate.",solution:"(f "+op.sym+" g)(x) = (x+"+a+") "+op.sym+" (x+"+b+") = "+combined+"\n\nf("+x+") = "+fv+",  g("+y+") = "+gv+"\nResult: "+fv+" "+op.sym+" "+gv+" = "+fg}; },
      () => { const n=ri(3,7),A=Array.from({length:n},(_,i)=>i+1); const d=ri(1,4),rel=A.map(x=>[x,x+d]).filter(([x,y])=>y<=10); const totalRel=Math.pow(2,n*n); return{title:"Equivalence vs General Relation",concept:`A relation can be: reflexive, symmetric, transitive.\nEquivalence = all three hold simultaneously.`,problem:`On A={${A.join(",")}}, is R={(x,y):x+y=${A[0]+A[0]+d}} reflexive, symmetric, or transitive?`,solution:`We check each property systematically:\nReflexive: Does (a,a) ∈ R for all a? → Check a+a = ${A[0]*2+d}...\nSymmetric: Does (a,b) ∈ R → (b,a) ∈ R? → Addition is commutative ✓\nTransitive: Does (a,b) and (b,c) → (a,c)? → Verify by cases.`}; },
    ],
    check: [
      () => { const p=ri(2,5),q=ri(2,5),ans=p*q; const{options,answerIndex}=mcq(`${ans}`,[p+q,ans+1,ans-1].map(String)); return{title:"Cartesian Product Size",question:`|A|=${p}, |B|=${q}. How many elements in A×B?`,options,answerIndex,explanation:`n(A×B)=${p}×${q}=${ans}.`,mistakeType:'addmul'}; },
      () => { const A=[ri(1,3),ri(4,6),ri(7,9)],d=ri(1,3),rel=A.map(x=>x+d).filter(y=>y<=10); const{options,answerIndex}=mcq(`{${A.join(",")}}`,[ `{${rel.join(",")}}`,`{${[...A,ri(1,9)].slice(0,4).join(",")}}`,`{${A.slice(0,2).join(",")}}`]); return{title:"Domain of Relation",question:`R={(x,y):y=x+${d}}, x∈{${A.join(",")}}. Domain?`,options,answerIndex,explanation:`Domain = set of first elements = {${A.join(",")}}.`,mistakeType:'sign'}; },
      () => { const m=ri(2,5),n=ri(2,4),ans=Math.pow(n,m); const{options,answerIndex}=mcq(`${ans}`,[Math.pow(2,m*n),m*n,m+n].map(String)); return{title:"Count Functions",question:`How many functions from a set of ${m} elements to a set of ${n} elements?`,options,answerIndex,explanation:`Each of ${m} elements maps to any of ${n} → ${n}^${m}=${ans}.`,mistakeType:'addmul'}; },
      () => { const a=ri(1,5),b=ri(1,5),x=ri(2,8),sum=x+a+x+b; const{options,answerIndex}=mcq(`${sum}`,[`${sum+1}`,`${sum-1}`,`${x+a}`].map(String)); return{title:"Algebra of Functions",question:`f(x)=x+${a}, g(x)=x+${b}. Find (f+g)(${x}).`,options,answerIndex,explanation:`(f+g)(${x})=(${x+a})+(${x+b})=${sum}.`,mistakeType:'partial'}; },
    ],
  },

  ch3: {
    title: "Trigonometric Functions",
    teach: [
      () => { const idx=ri(0,DEG.length-1),dir=pick(["toRad","toDeg"]); return dir==="toRad"?{title:"Degree → Radian Conversion",concept:`Radians = Degrees × (π/180). Full circle: 2π = 360°.`,keyFormula:`${DEG[idx]}^\\circ \\times \\dfrac{\\pi}{180} = ${RAD[idx]} \\text{ rad}`,problem:`Convert ${DEG[idx]}° to radians.`,solution:`${DEG[idx]}° × π/180 = ${RAD[idx]} rad\n\nsin(${DEG[idx]}°) = ${SIN[idx]},  cos(${DEG[idx]}°) = ${COS[idx]}`}:{title:"Radian → Degree Conversion",concept:`Degrees = Radians × (180/π).`,keyFormula:`${RAD[idx]} \\times \\dfrac{180}{\\pi} = ${DEG[idx]}^\\circ`,problem:`Convert ${RAD[idx]} radians to degrees.`,solution:`${RAD[idx]} × 180/π = ${DEG[idx]}°\n\nsin(${RAD[idx]}) = ${SIN[idx]},  cos(${RAD[idx]}) = ${COS[idx]}`}; },
      () => { const idx=ri(0,3),quadrant=ri(1,4),cosSigns=[1,-1,-1,1],baseSin=["1/2","1/√2","√3/2","1"][idx],baseCos=["√3/2","1/√2","1/2","0"][idx]; return{title:"Pythagorean Identity Application",concept:`sin²θ + cos²θ = 1\nUse this to find one ratio given another. Signs depend on quadrant.`,keyFormula:`\\sin^2\\theta + \\cos^2\\theta = 1`,problem:`If sin θ = ${baseSin} and θ is in quadrant ${quadrant}, find cos θ.`,solution:`cos²θ = 1 − (${baseSin})² = 1 − ${idx===0?"1/4":idx===1?"1/2":"3/4"} = ${idx===0?"3/4":idx===1?"1/2":"1/4"}\ncos θ = ${cosSigns[quadrant-1]>0?"+":"−"}${baseCos}\n(${quadrant>2?"negative":"positive"} in Q${quadrant})`}; },
      () => { const pairs=[[30,45],[45,60],[30,60],[45,30]],[A,B]=pick(pairs),sinA={30:"1/2",45:"1/√2",60:"√3/2"}[A],cosA={30:"√3/2",45:"1/√2",60:"1/2"}[A],sinB={30:"1/2",45:"1/√2",60:"√3/2"}[B],cosB={30:"√3/2",45:"1/√2",60:"1/2"}[B]; return{title:"Addition Formula",concept:`sin(A+B) = sinA·cosB + cosA·sinB\ncos(A+B) = cosA·cosB − sinA·sinB`,keyFormula:`\\sin(A+B) = \\sin A\\cos B + \\cos A\\sin B`,problem:`Find exact value of sin(${A}° + ${B}°) = sin(${A+B}°).`,solution:`sin(${A}°+${B}°) = sin${A}°·cos${B}° + cos${A}°·sin${B}°\n= (${sinA})(${cosB}) + (${cosA})(${sinB})\n= sin${A+B}° = ${SIN[DEG.indexOf(String(A+B))]}`}; },
      () => { const A=pick([30,45,60]),sin2A={30:"√3/2",45:"1",60:"√3/2"}[A],cos2A={30:"1/2",45:"0",60:"-1/2"}[A]; return{title:"Double Angle Formulas",concept:`sin 2A = 2 sinA cosA\ncos 2A = cos²A − sin²A = 1−2sin²A = 2cos²A−1`,keyFormula:`\\sin 2A = 2\\sin A\\cos A, \\quad \\cos 2A = \\cos^2 A - \\sin^2 A`,problem:`Find sin(${2*A}°) and cos(${2*A}°) using double angle formulas.`,solution:`sin(${2*A}°) = 2·sin${A}°·cos${A}° = ${sin2A}\ncos(${2*A}°) = cos²${A}°−sin²${A}° = ${cos2A}`}; },
      () => { const r=ri(3,8),arcLen=ri(4,12),theta=(arcLen/r).toFixed(3),area=(0.5*r*r*arcLen/r).toFixed(2); return{title:"Arc Length & Sector Area",concept:`For radius r, angle θ (radians):\nl = rθ  (arc length)\nA = ½r²θ  (sector area)`,keyFormula:`l = r\\theta, \\quad A = \\dfrac{1}{2}r^2\\theta`,problem:`Circle: radius ${r} cm, arc length ${arcLen} cm. Find θ (radians) and sector area.`,solution:`θ = l/r = ${arcLen}/${r} = ${theta} rad\nSector area = ½×${r}²×${theta} = ${area} cm²`}; },
    ],
    check: [
      () => { const idx=ri(0,DEG.length-1); const{options,answerIndex}=mcq(RAD[idx],sh(RAD.filter((_,i)=>i!==idx)).slice(0,3)); return{title:"Degree to Radian",question:`Convert ${DEG[idx]}° to radians.`,options,answerIndex,explanation:`${DEG[idx]}°×π/180 = ${RAD[idx]}.`,mistakeType:'sign'}; },
      () => { const idx=ri(0,3),sinVals=["1/2","1/√2","√3/2","1"],cosVals=["√3/2","1/√2","1/2","0"],sinV=sinVals[idx],cosV=cosVals[idx]; const{options,answerIndex}=mcq(cosV,sh(cosVals.filter((_,i)=>i!==idx)).slice(0,3)); return{title:"Pythagorean Identity",question:`If sin θ=${sinV} (first quadrant), find cos θ.`,options,answerIndex,explanation:`cos²θ=1−(${sinV})². cos θ = ${cosV}.`,mistakeType:'nosqrt'}; },
    ],
  },

  ch4: {
    title: "Principle of Mathematical Induction",
    teach: [
      () => { const n=ri(5,15),sumAP=n*(n+1)/2,k=ri(3,8); return{title:"Verify Sum Formula",keyFormula:`1+2+\\cdots+n = \\dfrac{n(n+1)}{2}`,concept:`P(n): 1+2+...+n = n(n+1)/2.\nBase: P(1): 1=1(2)/2 ✓\nInductive: Assume P(k), prove P(k+1).`,problem:`Verify P(${n}): sum = ${n}(${n+1})/2, and state P(${k}).`,solution:`LHS = ${n}(${n+1})/2 = ${sumAP} = RHS ✓\n\nP(${k}): 1+2+...+${k} = ${k*(k+1)/2}\nP(${k+1}): add (${k+1}) → ${k*(k+1)/2}+${k+1} = ${(k+1)*(k+2)/2} = ${k+1}(${k+2})/2 ✓`}; },
      () => { const n=ri(4,12),sumSq=n*(n+1)*(2*n+1)/6; return{title:"Sum of Squares Formula",keyFormula:`\\sum_{k=1}^{n} k^2 = \\dfrac{n(n+1)(2n+1)}{6}`,concept:`P(n): 1²+2²+...+n² = n(n+1)(2n+1)/6.`,problem:`Verify the sum-of-squares formula for n = ${n}.`,solution:`= ${n}(${n+1})(${2*n+1})/6\n= ${n*(n+1)*(2*n+1)}/6\n= ${sumSq} ✓`}; },
      () => { const n=ri(3,10),base=Math.pow(2,n); return{title:"Inequality Proof: 2ⁿ > n",keyFormula:`2^n > n \\text{ for all } n \\in \\mathbb{N}`,concept:`Base: 2¹=2>1 ✓\nInductive: 2^(k+1)=2·2^k>2k≥k+1 ✓`,problem:`Verify 2^${n} > ${n}, and outline the inductive step.`,solution:`P(${n}): 2^${n} = ${base} > ${n} ✓\n\nInductive: Assume 2^k > k.\nMultiply by 2: 2^(k+1) > 2k = k+k ≥ k+1\nTherefore P(k+1) follows. ✓`}; },
    ],
    check: [
      () => { const n=ri(10,50),ans=n*(n+1)/2; const{options,answerIndex}=mcq(`${ans}`,wrongs3(ans,[n,n+1,2*n]).map(String)); return{title:"AP Sum Formula",question:`Find 1+2+...+${n} using n(n+1)/2.`,options,answerIndex,explanation:`${n}×${n+1}/2 = ${ans}.`,mistakeType:'double'}; },
      () => { const n=ri(3,8),ans=n*(n+1)*(2*n+1)/6; const{options,answerIndex}=mcq(`${ans}`,wrongs3(ans,[n,n*n,n*(n+1)/2]).map(String)); return{title:"Sum of Squares",question:`Find 1²+2²+...+${n}² using n(n+1)(2n+1)/6.`,options,answerIndex,explanation:`${n}×${n+1}×${2*n+1}/6 = ${ans}.`,mistakeType:'partial'}; },
    ],
  },

  ch5: {
    title: "Complex Numbers & Quadratic Equations",
    teach: [
      () => { const a1=ri(1,6),b1=ri(1,6),a2=ri(1,6),b2=ri(1,6),s1=pick([1,-1]),s2=pick([1,-1]),realProd=a1*a2-s1*b1*s2*b2,imagProd=a1*(s2*b2)+(s1*b1)*a2; return{title:"Multiplication of Complex Numbers",concept:`(a+bi)(c+di) = (ac−bd) + (ad+bc)i,  using i² = −1.`,keyFormula:`(a+bi)(c+di) = (ac-bd) + (ad+bc)i`,problem:`Multiply z₁=${a1}${s1>0?"+":"-"}${b1}i and z₂=${a2}${s2>0?"+":"-"}${b2}i.`,solution:`= ${a1*a2} ${s2*a1*b2>=0?"+":""}${s2*a1*b2}i ${s1*a2*b1>=0?"+":""}${s1*a2*b1}i ${s1*s2*b1*b2>=0?"+":""}${s1*s2*b1*b2}i²\n= (${realProd}) + (${imagProd})i`}; },
      () => { const a=ri(1,8),b=ri(1,8),mod=Math.sqrt(a*a+b*b),modStr=Number.isInteger(mod)?`${mod}`:`√${a*a+b*b}`; return{title:"Modulus & Conjugate",concept:`z = a+bi:\n• Conjugate z̄ = a−bi\n• Modulus |z| = √(a²+b²)\n• z·z̄ = |z|²`,keyFormula:`|z| = \\sqrt{a^2 + b^2} = \\sqrt{${a}^2+${b}^2} = ${modStr}`,problem:`Find the modulus and conjugate of z = ${a}+${b}i.`,solution:`z̄ = ${a}−${b}i\n|z| = √(${a}²+${b}²) = √${a*a+b*b} = ${modStr}\n|z|² = z·z̄ = ${a*a+b*b}`}; },
      () => { const a=1,b=ri(1,4),c=ri(1,4)*ri(1,3),D=b*b-4*a*c; if(D<0){const realPart=-b,imagSq=-D; return{title:"Quadratic with Complex Roots",concept:`D = b²−4ac < 0 → complex roots:\nx = (−b ± i√(−D)) / 2a`,keyFormula:`x = \\dfrac{-b \\pm i\\sqrt{4ac-b^2}}{2a} = \\dfrac{${-b} \\pm i\\sqrt{${imagSq}}}{2}`,problem:`Solve: x² + ${b}x + ${c} = 0.`,solution:`D = ${b}²−4(${c}) = ${D} < 0\nRoots = (${realPart} ± i√${imagSq}) / 2`};}else{const r1=(-b+Math.sqrt(D))/2,r2=(-b-Math.sqrt(D))/2; return{title:"Quadratic with Real Roots",concept:`D = b²−4ac. D>0: two real roots. D=0: one repeated root.`,keyFormula:`x = \\dfrac{${-b} \\pm \\sqrt{${D}}}{2}`,problem:`Solve: x² + ${b}x + ${c} = 0.`,solution:`D = ${D} > 0 (real roots)\nx = (${-b} ± √${D}) / 2\nx₁ = ${r1.toFixed(2)},  x₂ = ${r2.toFixed(2)}`};} },
    ],
    check: [
      () => { const a=ri(1,8),b=ri(1,8),ans=Math.sqrt(a*a+b*b),ansStr=Number.isInteger(ans)?`${ans}`:`√${a*a+b*b}`; const{options,answerIndex}=mcq(ansStr,[`${a+b}`,`${a*b}`,`√${a*a+b*b+1}`]); return{title:"Modulus",question:`|z| for z=${a}+${b}i?`,options,answerIndex,explanation:`|z|=√(${a}²+${b}²)=√${a*a+b*b}=${ansStr}.`,mistakeType:'nosqrt'}; },
      () => { const a=ri(1,5),b=ri(1,5),c=ri(1,5),d=ri(1,5),real=a*c-b*d,imag=a*d+b*c,ans=`${real}+${imag}i`; const{options,answerIndex}=mcq(ans,[`${a+c}+${b+d}i`,`${real-1}+${imag+1}i`,`${a*c}+${b*d}i`]); return{title:"Complex Multiplication",question:`(${a}+${b}i)(${c}+${d}i)=?`,options,answerIndex,explanation:`Real:${a}×${c}−${b}×${d}=${real}. Imag:${a}×${d}+${b}×${c}=${imag}.`,mistakeType:'sign'}; },
    ],
  },

  ch6: {
    title: "Linear Inequalities",
    teach: [
      () => { const a=ri(2,8),b=ri(1,10),c=ri(5,20),neg=pick([true,false]),coeff=neg?-a:a,rhs=c,ans=(rhs-b)/coeff,sign=neg?"≥":"≤",interval=neg?ans.toFixed(2)+", +∞":"-∞, "+ans.toFixed(2),flipNote=neg?" (sign flipped — divided by negative)":""; return{title:"Solving a Linear Inequality",concept:"Treat like an equation EXCEPT: dividing/multiplying by NEGATIVE reverses the inequality sign.",problem:"Solve: "+coeff+"x + "+b+" ≤ "+rhs,solution:coeff+"x ≤ "+(rhs-b)+"\nx "+sign+" "+ans.toFixed(2)+flipNote+"\n\nSolution set: ("+interval+")"}; },
      () => { const a=ri(2,5),b=ri(1,8),c=ri(10,25),ans=(c-b)/a; return{title:"Inequality — Number Line",concept:`For ax+b > c (a>0): x > (c−b)/a. Use open circle ○ for strict.`,problem:`Solve and represent: ${a}x + ${b} > ${c}`,solution:`${a}x > ${c-b}\nx > ${ans}\n\nSolution set: (${ans}, +∞)\n○—→ (open circle at ${ans}, shaded right)`}; },
      () => { const a=ri(1,4),b=ri(1,4); return{title:"System of Two Inequalities",concept:`Solve each separately, then intersect.`,problem:`Solve: ${a}x − ${b} < ${a*3} AND x + ${b} > ${b-1}`,solution:`Ineq 1: x < ${3+b/a}\nIneq 2: x > ${-1}\n\nIntersection: ${-1} < x < ${3+b/a}\nSolution set: (${-1}, ${3+b/a})`}; },
    ],
    check: [
      () => { const a=ri(2,6),b=ri(2,8),c=ri(10,20),ans=(c+b)/a,ansStr=Number.isInteger(ans)?`x ≤ ${ans}`:`x ≤ ${ans.toFixed(1)}`; const{options,answerIndex}=mcq(ansStr,[`x ≥ ${ans.toFixed(1)}`,`x < ${ans.toFixed(1)}`,`x ≤ ${(ans+1).toFixed(1)}`]); return{title:"Solve Inequality",question:`Solve: ${a}x − ${b} ≤ ${c}`,options,answerIndex,explanation:`${a}x ≤ ${c+b}  →  x ≤ ${ans.toFixed(1)}.`,mistakeType:'sign'}; },
      () => { const a=ri(2,5),b=ri(1,6),ans=b/a,ansStr=`x ≥ ${ans.toFixed(2)}`; const{options,answerIndex}=mcq(ansStr,[`x ≤ ${ans.toFixed(2)}`,`x ≥ ${(ans+1).toFixed(2)}`,`x ≥ ${(ans-0.5).toFixed(2)}`]); return{title:"Negative Coefficient",question:`Solve: −${a}x + ${b} ≤ 0`,options,answerIndex,explanation:`−${a}x ≤ −${b}  →  x ≥ ${b}/${a} = ${ans.toFixed(2)} (sign flips!).`,mistakeType:'sign'}; },
    ],
  },

  ch7: {
    title: "Permutations & Combinations",
    teach: [
      () => { const n=ri(5,9),r=ri(2,4),ans=Perm(n,r),stepsArr=[]; for(let i=n;i>n-r;i--) stepsArr.push(i); return{title:"Permutations P(n,r)",concept:`P(n,r) = n!/(n−r)! = n×(n−1)×...×(n−r+1). Ordered arrangements.`,keyFormula:`P(${n},${r}) = \\dfrac{${n}!}{(${n}-${r})!} = ${stepsArr.join("\\times")} = ${ans}`,problem:`Find P(${n},${r}) — arrange ${r} objects from ${n} distinct objects.`,solution:`P(${n},${r}) = ${n}!/${n-r}!\n= ${stepsArr.join(" × ")}\n= ${ans}`}; },
      () => { const n=ri(6,12),r=ri(2,5),ans=C(n,r); return{title:"Combinations C(n,r)",concept:`C(n,r) = n!/(r!(n−r)!). Selection without regard to order.`,keyFormula:`\\binom{${n}}{${r}} = \\dfrac{${n}!}{${r}! \\cdot ${n-r}!} = ${ans}`,problem:`In how many ways can a committee of ${r} be chosen from ${n} people?`,solution:`C(${n},${r}) = ${n}!/(${r}!×${n-r}!)\n= ${Array.from({length:r},(_,i)=>n-i).join("×")} / ${Array.from({length:r},(_,i)=>r-i).join("×")}\n= ${ans} ways`}; },
      () => { const word=pick(["MATHS","INDIA","DELTA","PLANE","CURVE","PRIME"]),n=word.length,freq={}; for(const c of word) freq[c]=(freq[c]||0)+1; const denom=Object.values(freq).map(f=>f>1?f+"!":"").filter(Boolean).join("×")||"1",total=fact(n)/Object.values(freq).reduce((acc,f)=>acc*fact(f),1),repeatInfo=Object.entries(freq).filter(([,v])=>v>1).map(([k,v])=>"'"+k+"' repeats "+v+" times").join(", ")||"All letters distinct",denomProd=Object.values(freq).reduce((a,f)=>a*fact(f),1); return{title:"Arrangements of Letters",concept:"Arrangements with repetition: n!/(f₁!×f₂!×...)",problem:"Distinct arrangements of all letters of '"+word+"'?",solution:"Letters: "+word.split("").join(", ")+"\n"+repeatInfo+"\n\nArrangements = "+n+"! / "+denom+" = "+fact(n)+" / "+denomProd+" = "+total}; },
      () => { const n=ri(5,10),boys=ri(3,5),girls=n-boys; return{title:"Constrained Arrangements",concept:`All boys together: treat them as 1 block.\n(girls+1)! × boys! arrangements.`,problem:`${boys} boys and ${girls} girls in a row. (i) No restriction? (ii) All boys together?`,solution:`(i) No restriction: ${n}! = ${fact(n)} ways\n\n(ii) All boys together:\n${girls+1} units → (${girls+1})! = ${fact(girls+1)} ways\nBoys in block: ${boys}! = ${fact(boys)} ways\nTotal = ${fact(girls+1)} × ${fact(boys)} = ${fact(girls+1)*fact(boys)}`}; },
      () => { const n=ri(8,15),r=ri(3,6),crn=C(n,r),crn1=C(n,r-1),sum=crn+crn1; return{title:"Pascal's Identity",concept:`C(n,r) + C(n,r−1) = C(n+1,r)`,keyFormula:`\\binom{${n}}{${r}} + \\binom{${n}}{${r-1}} = \\binom{${n+1}}{${r}}`,problem:`Verify: C(${n},${r}) + C(${n},${r-1}) = C(${n+1},${r}).`,solution:`C(${n},${r}) = ${crn}\nC(${n},${r-1}) = ${crn1}\nSum = ${sum}\n\nC(${n+1},${r}) = ${C(n+1,r)}\n\n${sum} = ${C(n+1,r)} ✓`}; },
    ],
    check: [
      () => { const n=ri(5,8),r=ri(2,3),ans=Perm(n,r); const{options,answerIndex}=mcq(`${ans}`,wrongs3(ans,[C(n,r),Perm(n,r-1),Perm(n-1,r)]).map(String)); return{title:"P(n,r) Value",question:`Calculate P(${n},${r}).`,options,answerIndex,explanation:`P(${n},${r})=${Array.from({length:r},(_,i)=>n-i).join("×")}=${ans}.`,mistakeType:'addmul'}; },
      () => { const n=ri(7,12),r=ri(2,4),ans=C(n,r); const{options,answerIndex}=mcq(`${ans}`,wrongs3(ans,[C(n,r-1),C(n-1,r),Perm(n,r)]).map(String)); return{title:"C(n,r) Value",question:`Team of ${r} from ${n} people — how many ways?`,options,answerIndex,explanation:`C(${n},${r})=${n}!/(${r}!×${n-r}!)=${ans}.`,mistakeType:'offone'}; },
    ],
  },

  ch8: {
    title: "Binomial Theorem",
    teach: [
      () => { const n=ri(3,5),a=pick([1,1,2,2,1]),b=ri(1,3),terms=Array.from({length:n+1},(_,r)=>{const coeff=C(n,r)*Math.pow(a,n-r)*Math.pow(b,r),xpow=n-r,ypow=r,xpart=xpow===0?"":xpow===1?"x":"x^"+xpow,ypart=ypow===0?"":ypow===1?"y":"y^"+ypow;return coeff+xpart+ypart;}); return{title:"Expanding via Binomial Theorem",concept:`(a+b)ⁿ = Σ C(n,r)·aⁿ⁻ʳ·bʳ for r=0 to n. Total terms = n+1.`,keyFormula:`(a+b)^n = \\sum_{r=0}^{n} \\binom{n}{r} a^{n-r}b^r`,problem:`Expand (${a>1?a:""}x + ${b})^${n}.`,solution:`${terms.join(" + ")}\n\n(${n+1} terms total)`}; },
      () => { const n=ri(6,10),t=ri(2,n),r=t-1,coeff=C(n,r); return{title:"General Term T(r+1)",concept:`T(r+1) = C(n,r)·aⁿ⁻ʳ·bʳ. For the ${t}th term use r=${r}.`,keyFormula:`T_{r+1} = \\binom{n}{r}\\,a^{n-r}\\,b^r`,problem:`Find the ${t}th term in expansion of (x+y)^${n}.`,solution:`T(${t}) = T(${r}+1) = C(${n},${r})·x^${n-r}·y^${r}\n= ${coeff}·x^${n-r}·y^${r}\n= ${coeff}x^${n-r}y^${r}`}; },
      () => { const n=ri(4,8),mid=n%2===0?[n/2+1]:[(n+1)/2,(n+3)/2],parity=n%2===0?"even, ONE middle term":"odd, TWO middle terms",midLines=mid.map(m=>"T("+m+") = C("+n+","+(m-1)+")·x^"+(n-m+1)+"·y^"+(m-1)+" = "+C(n,m-1)+"x^"+(n-m+1)+"y^"+(m-1)).join("\n"); return{title:"Middle Term of Binomial Expansion",concept:"In (a+b)ⁿ:\n• n even → 1 middle term: T(n/2+1)\n• n odd → 2 middle terms",problem:"Find the middle term(s) of (x+y)^"+n+".",solution:"n="+n+" → "+parity+"\nMiddle term(s): T("+mid.join(") and T(")+") \n"+midLines}; },
    ],
    check: [
      () => { const n=ri(5,12),ans=n+1; const{options,answerIndex}=mcq(`${ans}`,[n,n+2,2*n].map(String)); return{title:"Number of Terms",question:`How many terms does (a+b)^${n} have?`,options,answerIndex,explanation:`n+1=${n}+1=${ans}.`,mistakeType:'offone'}; },
      () => { const n=ri(6,10),r=ri(1,4),ans=C(n,r); const{options,answerIndex}=mcq(`${ans}`,wrongs3(ans,[C(n,r-1),C(n,r+1),C(n-1,r)]).map(String)); return{title:"Coefficient in Expansion",question:`Coefficient of x^${n-r}·y^${r} in (x+y)^${n}?`,options,answerIndex,explanation:`T(${r+1}) has coefficient C(${n},${r})=${ans}.`,mistakeType:'offone'}; },
    ],
  },

  ch9: {
    title: "Sequences & Series",
    teach: [
      () => { const a=ri(2,15),d=pick([-3,-2,-1,1,2,3,4,5]),n=ri(10,25),an=a+(n-1)*d,Sn=n*(2*a+(n-1)*d)/2; return{title:"Arithmetic Progression",keyFormula:`a_n = a + (n-1)d = ${a}+(${n}-1)(${d}) = ${an}`,concept:`aₙ = a+(n−1)d.   Sₙ = n/2·[2a+(n−1)d].`,problem:`AP: ${a}, ${a+d}, ${a+2*d}, ... Find the ${n}th term and sum of ${n} terms.`,solution:`a=${a}, d=${d}\na_${n} = ${a}+(${n}−1)(${d}) = ${an}\n\nS_${n} = ${n}/2×[${2*a}+${(n-1)*d}]\n= ${n}/2×${2*a+(n-1)*d}\n= ${Sn}`}; },
      () => { const a=ri(2,6),r_ratio=pick([2,3,-2,0.5]),n=ri(5,8),rStr=r_ratio===0.5?"1/2":`${r_ratio}`,an=a*Math.pow(r_ratio,n-1),Sn=r_ratio===1?a*n:a*(Math.pow(r_ratio,n)-1)/(r_ratio-1); return{title:"Geometric Progression",keyFormula:`a_n = a \\cdot r^{n-1} = ${a} \\cdot (${rStr})^{${n-1}} = ${an}`,concept:`aₙ = a·rⁿ⁻¹.   Sₙ = a(rⁿ−1)/(r−1).`,problem:`GP: ${a}, ${a*r_ratio}, ${a*r_ratio*r_ratio}, ... Find the ${n}th term and sum.`,solution:`a=${a}, r=${rStr}\na_${n} = ${a}×(${rStr})^${n-1} = ${an}\n\nS_${n} = ${a}×((${rStr})^${n}−1)/(${rStr}−1) = ${Sn.toFixed(2)}`}; },
      () => { const a=ri(2,10),b=ri(11,20),AM=(a+b)/2,GM=Math.sqrt(a*b); return{title:"AM–GM Inequality",concept:`AM = (a+b)/2,  GM = √(ab)\nAM ≥ GM, equality iff a=b.`,keyFormula:`\\dfrac{a+b}{2} \\geq \\sqrt{ab}`,problem:`Find AM and GM of ${a} and ${b}. Verify AM ≥ GM.`,solution:`AM = (${a}+${b})/2 = ${AM}\nGM = √(${a*b}) ≈ ${GM.toFixed(3)}\n\n${AM} ≥ ${GM.toFixed(3)}  ✓`}; },
      () => { const a=ri(2,8),d=ri(1,5),n=ri(6,15),last=a+(n-1)*d,Sn=n*(a+last)/2,APterms=Array.from({length:Math.min(n,5)},(_,i)=>a+i*d); return{title:"Sum using First & Last Term",keyFormula:`S_n = \\dfrac{n}{2}(a_1 + a_n) = \\dfrac{${n}}{2}(${a}+${last}) = ${Sn}`,concept:`Sₙ = n/2×(first+last). Useful when both endpoints are known.`,problem:`Sum of AP: ${APterms.join(", ")}, ... up to ${n} terms.`,solution:`Last term = ${a}+(${n}-1)(${d}) = ${last}\nSₙ = ${n}/2×(${a}+${last}) = ${Sn}`}; },
      () => { const a=ri(1,5),rFrac=pick([{n:1,d:2},{n:1,d:3},{n:2,d:3},{n:1,d:4}]),rStr=`${rFrac.n}/${rFrac.d}`,S=a/(1-rFrac.n/rFrac.d); return{title:"Sum of Infinite GP",keyFormula:`S_\\infty = \\dfrac{a}{1-r} = \\dfrac{${a}}{1-${rStr}} = ${S.toFixed(3)}`,concept:`For |r|<1, S∞ = a/(1−r). The series converges.`,problem:`Sum of infinite GP: ${a}, ${a}×${rStr}, ...`,solution:`a=${a}, r=${rStr} (|r|<1 ✓)\n\nS∞ = ${a}/(1−${rStr})\n= ${a}/(${rFrac.d-rFrac.n}/${rFrac.d})\n= ${S.toFixed(4)}`}; },
    ],
    check: [
      () => { const a=ri(3,10),d=ri(2,6),n=ri(8,20),ans=a+(n-1)*d; const{options,answerIndex}=mcq(`${ans}`,wrongs3(ans,[a+n*d,a+(n-2)*d,a+n*d+d]).map(String)); return{title:"AP nth Term",question:`AP: first=${a}, d=${d}. Find the ${n}th term.`,options,answerIndex,explanation:`a_${n}=${a}+(${n}-1)(${d})=${ans}.`,mistakeType:'offone'}; },
      () => { const a=ri(1,4),rat=ri(2,4),n=ri(4,7),ans=Math.round(a*(Math.pow(rat,n)-1)/(rat-1)); const{options,answerIndex}=mcq(`${ans}`,wrongs3(ans,[ans-1,ans+1,a*(n+1)]).map(String)); return{title:"GP Sum",question:`GP: first=${a}, r=${rat}. Sum of ${n} terms?`,options,answerIndex,explanation:`S_${n}=${a}(${rat}^${n}−1)/(${rat}−1)=${ans}.`,mistakeType:'addmul'}; },
    ],
  },

  // ── CH10 — STRAIGHT LINES (upgraded with graphs + keyFormula) ──────
  ch10: {
    title: "Straight Lines",
    teach: [
      () => {
        const x1=ri(-5,3),y1=ri(-5,3),x2=ri(4,9),y2=ri(-5,9);
        const dy=y2-y1,dx=x2-x1,g=gcd(Math.abs(dy),Math.abs(dx));
        const mStr=`${dy/g}/${dx/g}`,angle=(Math.atan2(dy,dx)*180/Math.PI).toFixed(1);
        return {
          title:"Slope of a Line",
          concept:`m = (y₂−y₁)/(x₂−x₁) = tanθ.\nParallel: m₁=m₂.  Perpendicular: m₁·m₂=−1.`,
          keyFormula:`m = \\dfrac{y_2-y_1}{x_2-x_1} = \\dfrac{${dy}}{${dx}} = ${dy/g}/${dx/g}`,
          problem:`Find the slope of the line through A(${x1},${y1}) and B(${x2},${y2}).`,
          solution:`m = (${y2}−${y1}) / (${x2}−${x1})\n= ${dy} / ${dx}\n= ${mStr}\n\nAngle θ ≈ ${angle}°`,
          graph: { type:'line', x1, y1, x2, y2 },
        };
      },
      () => {
        const x1=ri(-3,3),y1=ri(-3,3),m=pick([-3,-2,-1,1,2,3]),c=y1-m*x1;
        const cStr=c>=0?`+${c}`:String(c);
        return {
          title:"Equation of a Line",
          concept:`Point-slope: y−y₁=m(x−x₁).\nSlope-intercept: y=mx+c.`,
          keyFormula:`y - ${y1} = ${m}(x - ${x1}) \\implies y = ${m}x ${cStr}`,
          problem:`Find equation of line through (${x1},${y1}) with slope ${m}.`,
          solution:`y−${y1} = ${m}(x−${x1})\ny = ${m}x ${cStr}\n\nGeneral form: ${-m}x + y ${-c>=0?"+"+(-c):String(-c)} = 0`,
          graph: { type:'line', x1, y1, x2: x1+3, y2: y1+m*3 },
        };
      },
      () => {
        const A=ri(1,5),B=ri(1,5),C=ri(-10,10),x0=ri(-4,4),y0=ri(-4,4);
        const num=Math.abs(A*x0+B*y0+C),den=Math.sqrt(A*A+B*B),dist=(num/den).toFixed(3);
        return {
          title:"Distance from a Point to a Line",
          concept:`d = |Ax₀+By₀+C| / √(A²+B²)`,
          keyFormula:`d = \\dfrac{|${A}(${x0})+${B}(${y0})+(${C})|}{\\sqrt{${A}^2+${B}^2}} = \\dfrac{${num}}{${den.toFixed(2)}} \\approx ${dist}`,
          problem:`Distance from (${x0},${y0}) to ${A}x+${B}y+${C}=0.`,
          solution:`d = |${A*x0+B*y0+C}| / √${A*A+B*B}\n= ${num} / ${den.toFixed(3)}\n= ${dist}`,
        };
      },
    ],
    check: [
      () => { const x1=ri(-3,2),y1=ri(-3,2),x2=ri(3,7),y2=ri(3,8),dy=y2-y1,dx=x2-x1,g=gcd(abs(dy),abs(dx)),ans=`${dy/g}/${dx/g}`; const{options,answerIndex}=mcq(ans,[`${dx/g}/${dy/g}`,`${(dy+1)/g}/${dx/g}`,`${-dy/g}/${dx/g}`]); return{title:"Slope Calculation",question:`Slope through (${x1},${y1}) and (${x2},${y2})?`,options,answerIndex,explanation:`m=(${y2}−${y1})/(${x2}−${x1})=${dy}/${dx}=${ans}.`,mistakeType:'sign'}; },
      () => { const A=ri(3,6),B=ri(4,8),C=ri(-8,8),num=abs(C),den=Math.sqrt(A*A+B*B),ans=(num/den).toFixed(2); const{options,answerIndex}=mcq(ans,[((num+1)/den).toFixed(2),((num-1)/den).toFixed(2),(num/den+1).toFixed(2)]); return{title:"Distance from Origin",question:`Distance from (0,0) to ${A}x+${B}y+${C}=0?`,options,answerIndex,explanation:`d=|${C}|/√(${A}²+${B}²)=${num}/${den.toFixed(2)}≈${ans}.`,mistakeType:'nosqrt'}; },
    ],
  },

  // ── CH11 — CONIC SECTIONS (upgraded with graphs + keyFormula) ─────
  ch11: {
    title: "Conic Sections",
    teach: [
      () => {
        const a=ri(2,8),type=pick(["right","left","up","down"]),fourA=4*a;
        let eq,focus,dir,kf;
        if(type==="right"){eq=`y²=${fourA}x`;focus=`(${a},0)`;dir=`x=−${a}`;kf=`y^2=${fourA}x`;}
        else if(type==="left"){eq=`y²=−${fourA}x`;focus=`(−${a},0)`;dir=`x=${a}`;kf=`y^2=-${fourA}x`;}
        else if(type==="up"){eq=`x²=${fourA}y`;focus=`(0,${a})`;dir=`y=−${a}`;kf=`x^2=${fourA}y`;}
        else{eq=`x²=−${fourA}y`;focus=`(0,−${a})`;dir=`y=${a}`;kf=`x^2=-${fourA}y`;}
        return {
          title:"Parabola — Focus & Directrix",
          concept:`y²=4ax → opens right, focus(a,0)\ny²=−4ax → opens left, focus(−a,0)\nx²=4ay → opens up, focus(0,a)\nx²=−4ay → opens down, focus(0,−a)`,
          keyFormula:`${kf},\\quad a=${a}`,
          problem:`For the parabola ${eq}, find focus and directrix.`,
          solution:`4a=${fourA}  →  a=${a}\nFocus: ${focus}\nDirectrix: ${dir}\nOpens ${type}.`,
          graph: { type:'parabola', a, direction:type },
        };
      },
      () => {
        const a2=ri(16,36),b2=ri(4,a2-4),c2=a2-b2,c=Math.sqrt(c2),cStr=Number.isInteger(c)?String(c):`√${c2}`,a=Math.sqrt(a2),e=(c/a).toFixed(3);
        return {
          title:"Ellipse — Foci & Eccentricity",
          concept:`x²/a²+y²/b²=1 (a>b>0).\nc²=a²−b². Foci at (±c,0). e=c/a, 0<e<1.`,
          keyFormula:`\\dfrac{x^2}{${a2}}+\\dfrac{y^2}{${b2}}=1,\\quad c^2=${c2},\\quad e\\approx${e}`,
          problem:`Find foci and eccentricity of x²/${a2}+y²/${b2}=1.`,
          solution:`c²=a²−b²=${a2}−${b2}=${c2}\nc=${cStr}\n\nFoci: (±${cStr},0)\nEccentricity e≈${e}`,
          graph: { type:'ellipse', a2, b2 },
        };
      },
      () => {
        const h=ri(-3,3),k=ri(-3,3),r=ri(2,7);
        const hs=h>=0?`- ${h}`:`+ ${Math.abs(h)}`,ks=k>=0?`- ${k}`:`+ ${Math.abs(k)}`;
        return {
          title:"Equation of a Circle",
          concept:`Circle centre (h,k) radius r: (x−h)²+(y−k)²=r²`,
          keyFormula:`(x ${hs})^2+(y ${ks})^2=${r}^2=${r*r}`,
          problem:`Circle with centre (${h},${k}) and radius ${r}. Find its equation.`,
          solution:`(x−${h})²+(y−${k})²=${r*r}\n\nExpanded: x²+y²${-2*h>=0?"+"+(-2*h):String(-2*h)}x${-2*k>=0?"+"+(-2*k):String(-2*k)}y+${h*h+k*k-r*r}=0`,
          graph: { type:'circle', h, k, r },
        };
      },
    ],
    check: [
      () => { const a=ri(2,7),opts=[`Opens right, focus (${a},0)`,`Opens left, focus (−${a},0)`,`Opens up, focus (0,${a})`,`Opens down, focus (0,−${a})`],correct=opts[0]; const{options,answerIndex}=mcq(correct,sh(opts.slice(1))); return{title:"Parabola y²=4ax",question:`For y²=${4*a}x, which is correct?`,options,answerIndex,explanation:`y²=4ax opens right with focus(a,0)=(${a},0).`,mistakeType:'sign'}; },
      () => { const a2=ri(16,49),b2=ri(4,a2-4),a=Math.sqrt(a2),ans=Number.isInteger(a)?`${2*a}`:`2√${a2}`; const{options,answerIndex}=mcq(ans,[`${2*Math.sqrt(b2).toFixed(0)}`,`${a2}`,`${a.toFixed(0)}`]); return{title:"Major Axis Length",question:`Major axis length of x²/${a2}+y²/${b2}=1?`,options,answerIndex,explanation:`a=√${a2}. Major axis=2a=${ans}.`,mistakeType:'double'}; },
    ],
  },

  ch12: {
    title: "Introduction to Three Dimensional Geometry",
    teach: [
      () => { const x1=ri(-5,5),y1=ri(-5,5),z1=ri(-5,5),x2=ri(-5,5),y2=ri(-5,5),z2=ri(-5,5),dx=x2-x1,dy=y2-y1,dz=z2-z1,d2=dx*dx+dy*dy+dz*dz,d=Math.sqrt(d2),dStr=Number.isInteger(d)?`${d}`:`√${d2}`; return{title:"Distance Formula in 3D",keyFormula:`d = \\sqrt{(${dx})^2+(${dy})^2+(${dz})^2} = \\sqrt{${d2}} = ${dStr}`,concept:`d = √[(x₂−x₁)²+(y₂−y₁)²+(z₂−z₁)²]`,problem:`Distance between A(${x1},${y1},${z1}) and B(${x2},${y2},${z2}).`,solution:`d = √[${dx}²+${dy}²+${dz}²]\n= √[${dx*dx}+${dy*dy}+${dz*dz}]\n= √${d2} = ${dStr}`}; },
      () => { const x1=ri(-4,4),y1=ri(-4,4),z1=ri(-4,4),x2=ri(-4,4),y2=ri(-4,4),z2=ri(-4,4),mx=(x1+x2)/2,my=(y1+y2)/2,mz=(z1+z2)/2; return{title:"Midpoint in 3D",concept:`M = ((x₁+x₂)/2, (y₁+y₂)/2, (z₁+z₂)/2)`,keyFormula:`M = \\left(\\dfrac{${x1}+${x2}}{2}, \\dfrac{${y1}+${y2}}{2}, \\dfrac{${z1}+${z2}}{2}\\right) = (${mx},${my},${mz})`,problem:`Midpoint of P(${x1},${y1},${z1}) and Q(${x2},${y2},${z2}).`,solution:`M = ((${x1}+${x2})/2, (${y1}+${y2})/2, (${z1}+${z2})/2)\n= (${mx}, ${my}, ${mz})`}; },
    ],
    check: [
      () => { const x=ri(1,6),y=ri(1,6),z=ri(1,6),d2=x*x+y*y+z*z,d=Math.sqrt(d2),ans=Number.isInteger(d)?`${d}`:`√${d2}`; const{options,answerIndex}=mcq(ans,[`${x+y+z}`,`√${d2+1}`,`√${d2-1}`]); return{title:"Distance from Origin",question:`Distance from (0,0,0) to (${x},${y},${z})?`,options,answerIndex,explanation:`d=√(${x}²+${y}²+${z}²)=√${d2}=${ans}.`,mistakeType:'nosqrt'}; },
      () => { const x1=ri(-4,2),y1=ri(-4,2),z1=ri(-4,2),x2=ri(3,8),y2=ri(3,8),z2=ri(3,8),ans=`(${(x1+x2)/2}, ${(y1+y2)/2}, ${(z1+z2)/2})`; const{options,answerIndex}=mcq(ans,[`(${x1+x2}, ${y1+y2}, ${z1+z2})`,`(${x2-x1}, ${y2-y1}, ${z2-z1})`,`(${(x1+x2)/2+1}, ${(y1+y2)/2}, ${(z1+z2)/2})`]); return{title:"Midpoint",question:`Midpoint of (${x1},${y1},${z1}) and (${x2},${y2},${z2})?`,options,answerIndex,explanation:`M=((${x1}+${x2})/2,(${y1}+${y2})/2,(${z1}+${z2})/2)=${ans}.`,mistakeType:'double'}; },
    ],
  },

  // ── CH13 — LIMITS & DERIVATIVES (upgraded with mathjs symbolic engine)
  ch13: {
    title: "Limits & Derivatives",
    teach: [
      () => { const a=ri(2,7),n=ri(2,4),val=Math.pow(a,n); return{title:"Limit by Factoring",concept:`If direct substitution gives 0/0, factor and cancel.\nlim(x→a)(xⁿ−aⁿ)/(x−a) = n·aⁿ⁻¹`,keyFormula:`\\lim_{x \\to ${a}} \\dfrac{x^2-${a*a}}{x-${a}} = \\lim_{x \\to ${a}}(x+${a}) = ${2*a}`,problem:`Evaluate: lim(x→${a}) (x²−${a*a}) / (x−${a})`,solution:`Direct sub: 0/0 (indeterminate)\nFactor: (x+${a})(x−${a})/(x−${a}) = x+${a}\nlim = ${a}+${a} = ${2*a}`}; },
      () => { const k=ri(2,6); return{title:"Standard Trigonometric Limit",concept:`lim(x→0) sin(x)/x = 1  [x in radians]`,keyFormula:`\\lim_{x \\to 0} \\dfrac{\\sin(${k}x)}{x} = ${k} \\cdot \\lim_{x \\to 0} \\dfrac{\\sin(${k}x)}{${k}x} = ${k}`,problem:`Evaluate: lim(x→0) sin(${k}x)/x`,solution:`sin(${k}x)/x = ${k}·sin(${k}x)/(${k}x)\nAs x→0, sin(${k}x)/(${k}x)→1\nlim = ${k}×1 = ${k}`}; },
      () => {
        // ── mathjs symbolic derivative ──────────────────────────────
        const coeffs=[ri(1,5),ri(1,4),ri(1,6),ri(0,5)];
        const [a,b,c,d]=coeffs;
        let derivStr=`${3*a}x² + ${2*b}x + ${c}`;
        let derivTex=`${3*a}x^2 + ${2*b}x + ${c}`;
        try {
          const _math = getMath();
          if (!_math) throw new Error('mathjs not loaded');
          const expr=`${a}*x^3 + ${b}*x^2 + ${c}*x + ${d}`;
          const node=_math.derivative(expr,'x');
          const simp=_math.simplify(node);
          derivStr=simp.toString();
          if(simp.toTex) derivTex=simp.toTex();
        } catch(_) {}
        return {
          title:"Derivative by Power Rule (Symbolic)",
          concept:`d/dx(xⁿ) = n·xⁿ⁻¹\nApply term-by-term using linearity.`,
          keyFormula:`f(x) = ${a}x^3+${b}x^2+${c}x+${d} \\implies f'(x) = ${derivTex}`,
          problem:`Find f'(x) if f(x) = ${a}x³+${b}x²+${c}x+${d}.`,
          solution:`d/dx(${a}x³) = ${3*a}x²\nd/dx(${b}x²) = ${2*b}x\nd/dx(${c}x) = ${c}\nd/dx(${d}) = 0\n\nf'(x) = ${derivStr}`,
        };
      },
      () => { const a=ri(1,5),b=ri(1,5),x0=ri(1,4),fVal=a*x0+b,gVal=x0*x0+a,prodPrime=a*gVal+fVal*(2*x0); return{title:"Product Rule for Derivatives",concept:`h(x)=f·g  →  h'=f'g+fg'`,keyFormula:`\\dfrac{d}{dx}[f \\cdot g] = f'g + fg'`,problem:`h(x)=(${a}x+${b})(x²+${a}). Find h'(x) and h'(${x0}).`,solution:`f'(x)=${a},  g'(x)=2x\nh'(x)=${a}(x²+${a})+(${a}x+${b})(2x)\n= ${3*a}x²+${2*b}x+${a*a}\n\nh'(${x0}) = ${prodPrime}`}; },
      () => { const a=ri(2,6),b=ri(1,4); return{title:"Left/Right Hand Limits",concept:`Limit exists iff LHL = RHL.\nFor piecewise functions, check both sides separately.`,problem:`f(x) = { ${a}x+${b}  if x≤${a};  ${a*a+b}  if x>${a} }\nDoes lim(x→${a}) f(x) exist?`,solution:`LHL = lim(x→${a}⁻)(${a}x+${b}) = ${a*a+b}\nRHL = lim(x→${a}⁺)(${a*a+b}) = ${a*a+b}\n\nLHL=RHL=${a*a+b}  →  Limit EXISTS ✓`}; },
    ],
    check: [
      () => { const a=ri(2,8),ans=2*a; const{options,answerIndex}=mcq(`${ans}`,[a,ans+1,ans-2].map(String)); return{title:"Limit by Factoring",question:`lim(x→${a})(x²−${a*a})/(x−${a})=?`,options,answerIndex,explanation:`Factor: x+${a}. At x=${a}: ${ans}.`,mistakeType:'double'}; },
      () => { const a=ri(2,5),b=ri(1,4),c=ri(1,6),ans=`${3*a}x²+${2*b}x+${c}`; const{options,answerIndex}=mcq(ans,[`${3*a}x²+${2*b}x`,`${a}x²+${b}x+${c}`,`${3*a}x²+${b}x+${c}`]); return{title:"Derivative",question:`d/dx[${a}x³+${b}x²+${c}x]=?`,options,answerIndex,explanation:`Power rule: ${3*a}x²+${2*b}x+${c}.`,mistakeType:'offone'}; },
    ],
  },

  ch14: {
    title: "Mathematical Reasoning",
    teach: [
      () => { const stmts=[{s:"The square of every real number is positive.",truth:false,reason:"0²=0, which is not positive."},{s:"Every prime number is odd.",truth:false,reason:"2 is prime and even."},{s:"The sum of two odd numbers is even.",truth:true,reason:"(2m+1)+(2n+1)=2(m+n+1), which is even."},{s:"All triangles are equilateral.",truth:false,reason:"A scalene triangle has all sides different."}]; const{s,truth,reason}=pick(stmts); return{title:"Truth Value of a Statement",concept:`A mathematical statement is a declarative sentence that is either TRUE or FALSE (not both).`,problem:`Is "${s}" true or false?`,solution:`The statement is ${truth?"TRUE":"FALSE"}.\nReason: ${reason}`}; },
      () => { const implications=[{p:"a number is divisible by 6",q:"it is divisible by 2",contra:"if a number is not divisible by 2, then it is not divisible by 6"},{p:"a triangle is equilateral",q:"it is isosceles",contra:"if a triangle is not isosceles, then it is not equilateral"},{p:"x² = 4",q:"x = 2 or x = −2",contra:"if x ≠ 2 and x ≠ −2, then x² ≠ 4"}]; const{p,q,contra}=pick(implications); return{title:"Implication & Contrapositive",concept:`p→q (If p then q)\nContrapositive (¬q→¬p) is logically EQUIVALENT to p→q.`,problem:`Write the contrapositive of:\n"If ${p}, then ${q}."`,solution:`Contrapositive (¬q→¬p):\n"${contra.charAt(0).toUpperCase()+contra.slice(1)}"\n\nThis is logically equivalent to the original.`}; },
    ],
    check: [
      () => { const opts=["The sum of angles in a triangle is 180°.","Where are you going?","Open the door.","This sentence is false."]; const{options,answerIndex}=mcq(opts[0],sh(opts.slice(1))); return{title:"Identify a Statement",question:`Which of the following is a valid mathematical statement?`,options,answerIndex,explanation:`A statement must be declarative and have a definite truth value. "Sum of angles=180°" is a verifiable mathematical fact.`,mistakeType:'partial'}; },
    ],
  },

  ch15: {
    title: "Statistics",
    teach: [
      () => { const n=ri(5,8),data=Array.from({length:n},()=>ri(5,25)),mean=data.reduce((s,x)=>s+x,0)/n,md=(data.reduce((s,x)=>s+Math.abs(x-mean),0)/n).toFixed(2); return{title:"Mean Deviation about Mean",keyFormula:`\\text{MD} = \\dfrac{1}{n}\\sum|x_i - \\bar{x}| = \\dfrac{1}{${n}}\\sum|x_i - ${mean.toFixed(1)}| = ${md}`,concept:`MD = (1/n)·Σ|xᵢ−x̄|. First find mean, then average of absolute deviations.`,problem:`Find the mean deviation about the mean for: ${data.join(", ")}.`,solution:"Mean x̄ = ("+data.join("+")+")/"+ n+" = "+mean.toFixed(2)+"\n\nDeviations: "+data.map(x=>"|"+x+"−"+mean.toFixed(1)+"|="+Math.abs(x-mean).toFixed(1)).join(", ")+"\n\nMD = "+data.reduce((s,x)=>s+Math.abs(x-mean),0).toFixed(2)+"/"+n+" = "+md}; },
      () => { const n=ri(5,8),data=Array.from({length:n},()=>ri(4,20)),mean=data.reduce((s,x)=>s+x,0)/n,variance=data.reduce((s,x)=>s+(x-mean)**2,0)/n,sd=Math.sqrt(variance),cv=(sd/mean*100).toFixed(1); return{title:"Variance, SD & Coefficient of Variation",keyFormula:`\\sigma^2 = \\dfrac{1}{n}\\sum(x_i-\\bar{x})^2 = ${variance.toFixed(2)},\\quad \\sigma = ${sd.toFixed(3)}`,concept:`σ² = (1/n)Σ(xᵢ−x̄)².  σ=√(σ²).  CV=(σ/x̄)×100%.`,problem:`Find variance, SD, and CV for: ${data.join(", ")}.`,solution:"x̄ = "+mean.toFixed(2)+"\nSquared devs: "+data.map(x=>((x-mean)**2).toFixed(1)).join(", ")+"\nσ² = "+variance.toFixed(2)+"\nσ = "+sd.toFixed(3)+"\nCV = "+cv+"%"}; },
    ],
    check: [
      () => { const v=ri(9,64),ans=Math.sqrt(v),ansStr=Number.isInteger(ans)?`${ans}`:`√${v}`; const{options,answerIndex}=mcq(ansStr,[`${v}`,`${v*2}`,`${ans+1}`].map(String)); return{title:"SD from Variance",question:`If variance=${v}, what is the standard deviation?`,options,answerIndex,explanation:`SD=√(variance)=√${v}=${ansStr}.`,mistakeType:'nosqrt'}; },
      () => { const m1=ri(40,60),s1=ri(5,12),m2=ri(80,120),s2=ri(8,20),cv1=(s1/m1*100).toFixed(1),cv2=(s2/m2*100).toFixed(1),more=parseFloat(cv1)>parseFloat(cv2)?"Dataset A":"Dataset B"; const{options,answerIndex}=mcq(more,[more==="Dataset A"?"Dataset B":"Dataset A","Both equal","Cannot determine"]); return{title:"Comparing Variability",question:`A: mean=${m1}, SD=${s1}. B: mean=${m2}, SD=${s2}. Which has MORE relative variability?`,options,answerIndex,explanation:`CV(A)=${cv1}%, CV(B)=${cv2}%. Higher CV = more variable → ${more}.`,mistakeType:'sign'}; },
    ],
  },

  ch16: {
    title: "Probability",
    teach: [
      () => { const type=pick(["coin2","coin3","dice1","dice2"]); let exp,n,sample; if(type==="coin2"){exp="2 coins tossed";n=4;sample=["HH","HT","TH","TT"];}else if(type==="coin3"){exp="3 coins tossed";n=8;sample=["HHH","HHT","HTH","HTT","THH","THT","TTH","TTT"];}else if(type==="dice1"){exp="one die rolled";n=6;sample=["1","2","3","4","5","6"];}else{exp="two dice rolled";n=36;sample=["(1,1)","(1,2)","...","(6,6)"];} return{title:"Sample Space",keyFormula:`|S| = ${n}`,concept:`Sample Space S = all possible outcomes. |S| = total equally likely outcomes.`,problem:`Write the sample space when ${exp}.`,solution:`S = { ${sample.join(", ")} }\n|S| = ${n}\n\nEach outcome has probability 1/${n}.`}; },
      () => { const total=ri(30,60),fav=ri(5,total-5),g=gcd(fav,total),event=pick(["drawing a red ball","getting a head","picking a prime","selecting a vowel"]); return{title:"Basic Probability & Complement",keyFormula:`P(A) = \\dfrac{n(A)}{n(S)} = \\dfrac{${fav}}{${total}} = \\dfrac{${fav/g}}{${total/g}}`,concept:`P(A)=n(A)/n(S).  P(A')=1−P(A).  0≤P(A)≤1.`,problem:`${total} equally likely outcomes, ${fav} favourable to A (${event}). Find P(A) and P(A').`,solution:`P(A) = ${fav}/${total} = ${fav/g}/${total/g}\nP(A') = 1−${fav/g}/${total/g} = ${(total-fav)/g}/${total/g}`}; },
      () => { const pA=ri(3,6)/10,pB=ri(2,5)/10,pAB=Math.round(Math.min(pA,pB)*5)/10,pAuB=(pA+pB-pAB); return{title:"Addition Rule of Probability",concept:`P(A∪B)=P(A)+P(B)−P(A∩B)`,keyFormula:`P(A\\cup B) = ${pA.toFixed(1)}+${pB.toFixed(1)}-${pAB.toFixed(2)} = ${pAuB.toFixed(2)}`,problem:`P(A)=${pA.toFixed(1)}, P(B)=${pB.toFixed(1)}, P(A∩B)=${pAB.toFixed(2)}. Find P(A∪B).`,solution:`P(A∪B) = ${pA.toFixed(1)}+${pB.toFixed(1)}−${pAB.toFixed(2)}\n= ${pAuB.toFixed(2)}`}; },
      () => { const suit=pick(["hearts","clubs","diamonds","spades"]),face=pick(["king","queen","jack","ace"]); return{title:"Probability with Cards",concept:`Deck: 52 cards, 4 suits of 13 each.\nP(A∪B)=P(A)+P(B)−P(A∩B).`,problem:`One card from 52. Find P(${suit}), P(${face}), and P(${suit} OR ${face}).`,solution:`P(${suit})=13/52=1/4\nP(${face})=4/52=1/13\nP(both)=1/52\n\nP(${suit} OR ${face})=13/52+4/52−1/52=16/52=4/13≈0.308`}; },
      () => { const n=ri(2,3),total=Math.pow(6,n); let sum=ri(3+n-1,4+n),count=0; if(n===2){for(let i=1;i<=6;i++)for(let j=1;j<=6;j++)if(i+j===sum)count++;}else{for(let i=1;i<=6;i++)for(let j=1;j<=6;j++)for(let k=1;k<=6;k++)if(i+j+k===sum)count++;} const g=gcd(count,total); const kfReduced=g>1?" = \\\\dfrac{"+count/g+"}{"+total/g+"}":""; return{title:"Probability with "+n+" Dice",concept:`|S|=6^${n}=${total}. Count favourable outcomes systematically.`,keyFormula:"P(\\\\text{sum}="+sum+") = \\\\dfrac{"+count+"}{"+total+"}"+kfReduced,problem:`${n} dice rolled. Find P(sum=${sum}).`,solution:`|S|=6^${n}=${total}\nFavourable (sum=${sum}): ${count}\n\nP(sum=${sum})=${count}/${total}`+(g>1?" = "+(count/g)+"/"+(total/g):"")}; },
    ],
    check: [
      () => { const n=pick([2,3]),ans=Math.pow(2,n); const{options,answerIndex}=mcq(`${ans}`,[`${n*2}`,`${ans+2}`,`${ans-1}`].map(String)); return{title:"Sample Space Size",question:`${n} coins tossed. How many outcomes?`,options,answerIndex,explanation:`|S|=2^${n}=${ans}.`,mistakeType:'addmul'}; },
      () => { const p=ri(1,5)/10,q=ri(1,4)/10,inter=Math.round(Math.min(p,q)*5)/10,ans=(p+q-inter).toFixed(1); const{options,answerIndex}=mcq(ans,[(p+q).toFixed(1),(p+q-inter+0.1).toFixed(1),inter.toFixed(1)]); return{title:"Addition Rule",question:`P(A)=${p.toFixed(1)}, P(B)=${q.toFixed(1)}, P(A∩B)=${inter.toFixed(1)}. P(A∪B)?`,options,answerIndex,explanation:`P(A∪B)=${p.toFixed(1)}+${q.toFixed(1)}−${inter.toFixed(1)}=${ans}.`,mistakeType:'sign'}; },
      () => { const p=ri(2,8)/10,ans=(1-p).toFixed(1); const{options,answerIndex}=mcq(ans,[p.toFixed(1),(1+p).toFixed(1),(p-0.1).toFixed(1)]); return{title:"Complementary Probability",question:`P(event)=${p.toFixed(1)}. P(event does NOT occur)?`,options,answerIndex,explanation:`P(A')=1−P(A)=1−${p.toFixed(1)}=${ans}.`,mistakeType:'sign'}; },
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════
//  MAIN APP COMPONENT
// ══════════════════════════════════════════════════════════════════════
const CHAPTERS = Object.entries(ENGINE).map(([id,ch]) => ({ id, title: ch.title }));

function MathTrainer() {
  // ── Wait for mathjs (used for symbolic calculus cards) before rendering.
  //    Short failsafe so the UI still appears even if mathjs is slow. ──
  const [libsReady, setLibsReady] = useState(!!getMath());
  useEffect(() => {
    if (libsReady) return;
    const iv = setInterval(() => { if (getMath()) { clearInterval(iv); setLibsReady(true); } }, 50);
    const to = setTimeout(() => { clearInterval(iv); setLibsReady(true); }, 5000); // failsafe
    return () => { clearInterval(iv); clearTimeout(to); };
  }, []);

  if (!libsReady) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center",
                    height:"100vh", flexDirection:"column", gap:14,
                    background:"#06090f", color:"#f5a623", fontFamily:"monospace" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             style={{ animation:"spin .8s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ fontSize:13 }}>Initializing Math Engine…</span>
      </div>
    );
  }

  const [activeChapter, setActiveChapter] = useState("ch1");
  const [mode, setMode]       = useState("teach");
  const [card, setCard]       = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [genCount, setGenCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const generate = useCallback(() => {
    const ch = ENGINE[activeChapter];
    const pool = mode === "teach" ? ch.teach : ch.check;
    setCard(pool[Math.floor(Math.random() * pool.length)]());
    setRevealed(false);
    setSelected(null);
    setGenCount(c => c + 1);
  }, [activeChapter, mode]);

  const handleChapter = (id) => { setActiveChapter(id); setCard(null); setRevealed(false); setSelected(null); };
  const handleMode    = (m)  => { setMode(m); setCard(null); setRevealed(false); setSelected(null); };
  const handleOption  = (i)  => { if (revealed) return; setSelected(i); setRevealed(true); };

  const chNum = CHAPTERS.findIndex(c => c.id === activeChapter) + 1;

  return (
    <div style={{ display:"flex", height:"100vh", background:"#06090f", fontFamily:"'Georgia',serif", color:"#e8e0d0", overflow:"hidden" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#06090f} ::-webkit-scrollbar-thumb{background:#1e2a40;border-radius:3px}
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width:sidebarOpen?236:0, minWidth:sidebarOpen?236:0, background:"#0a0e1a", borderRight:"1px solid #12203a", overflowY:"auto", overflowX:"hidden", transition:"all 0.3s ease", flexShrink:0 }}>
        <div style={{ padding:"20px 14px 6px", color:"#f5a623", fontSize:10, letterSpacing:3, fontFamily:"monospace", textTransform:"uppercase" }}>Class XI</div>
        <div style={{ padding:"0 14px 14px", color:"#e8e0d0", fontSize:15, fontWeight:"bold" }}>Mathematics</div>
        {CHAPTERS.map((ch,i) => (
          <button key={ch.id} onClick={()=>handleChapter(ch.id)} style={{
            width:"100%", textAlign:"left",
            background:activeChapter===ch.id?"#101e38":"transparent",
            border:"none", borderLeft:activeChapter===ch.id?"3px solid #f5a623":"3px solid transparent",
            color:activeChapter===ch.id?"#f5d48a":"#6a7890",
            padding:"9px 14px", cursor:"pointer", fontSize:12, transition:"all 0.15s", lineHeight:1.4,
          }}>
            <span style={{ color:activeChapter===ch.id?"#f5a623":"#2e3a50", marginRight:6, fontFamily:"monospace", fontSize:10 }}>{String(i+1).padStart(2,"0")}</span>
            {ch.title}
          </button>
        ))}
      </div>

      {/* MAIN PANEL */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* TOPBAR */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 22px", background:"#0a0e1a", borderBottom:"1px solid #12203a", flexShrink:0 }}>
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{ background:"transparent", border:"none", color:"#5a6880", cursor:"pointer", fontSize:18, padding:"0 4px" }}>☰</button>
          <div style={{ flex:1 }}>
            <span style={{ color:"#f5a623", fontFamily:"monospace", fontSize:10, letterSpacing:2, textTransform:"uppercase" }}>Ch {String(chNum).padStart(2,"0")} · </span>
            <span style={{ color:"#e8e0d0", marginLeft:6, fontSize:15 }}>{ENGINE[activeChapter].title}</span>
          </div>

          {/* Mode Toggle */}
          <div style={{ display:"flex", background:"#10172a", borderRadius:8, padding:3, gap:3 }}>
            {["teach","check"].map(m => (
              <button key={m} onClick={()=>handleMode(m)} style={{
                padding:"6px 18px", borderRadius:6, border:"none",
                background:mode===m?(m==="teach"?"#1a3f80":"#801a1a"):"transparent",
                color:mode===m?"#fff":"#3a4a60",
                cursor:"pointer", fontSize:12, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:1, transition:"all 0.2s",
              }}>{m==="teach"?"📖 Teach":"✏️ Check"}</button>
            ))}
          </div>

          <button onClick={generate} style={{
            padding:"8px 22px", borderRadius:8,
            background:"linear-gradient(135deg,#f5a623,#e8890f)",
            border:"none", color:"#06090f", fontWeight:"bold",
            cursor:"pointer", fontSize:13, fontFamily:"monospace", letterSpacing:1,
            boxShadow:"0 0 18px rgba(245,166,35,0.3)", transition:"transform 0.1s",
          }}>⟳ GENERATE</button>
        </div>

        {/* CONTENT */}
        <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
          {!card ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:14, opacity:0.5 }}>
              <div style={{ fontSize:52 }}>{mode==="teach"?"📐":"🎯"}</div>
              <div style={{ color:"#3a4a60", fontFamily:"monospace", letterSpacing:3, textTransform:"uppercase", fontSize:11 }}>Press GENERATE to begin</div>
              <div style={{ color:"#1e2838", fontSize:10, fontFamily:"monospace" }}>
                {ENGINE[activeChapter].teach.length} teach · {ENGINE[activeChapter].check.length} check generators → ∞ problems
              </div>
            </div>
          ) : mode === "teach" ? (
            <TeachCard key={genCount} card={card} count={genCount} />
          ) : (
            <CheckCard card={card} selected={selected} revealed={revealed} onOption={handleOption} count={genCount} />
          )}
        </div>

        {/* FOOTER */}
        {card && (
          <div style={{ padding:"9px 22px", background:"#0a0e1a", borderTop:"1px solid #12203a", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:10, color:"#1e2838", fontFamily:"monospace" }}>
            <span>NCERT Mathematics · Class XI · 2020-21</span>
            <span>#{genCount} generated · ∞ available · mathjs + KaTeX</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  TEACH CARD — with StepReveal, GraphPanel, KaTeX formula
// ══════════════════════════════════════════════════════════════════════
function TeachCard({ card, count }) {
  // Auto-derive steps from solution string if not explicitly provided
  const steps = card.steps || (card.solution || "").split('\n').filter(s => s.trim());

  return (
    <div style={{ maxWidth:800, margin:"0 auto", animation:"fadeIn 0.3s ease" }}>

      {/* Badge */}
      <div style={{ display:"flex", gap:8, marginBottom:18, alignItems:"center" }}>
        <span style={{ background:"#0f2a60", color:"#7eb8f7", padding:"3px 10px", borderRadius:5, fontSize:10, fontFamily:"monospace", letterSpacing:1 }}>📖 TEACH</span>
        <span style={{ color:"#1e3060", fontSize:10, fontFamily:"monospace" }}>#{count}</span>
      </div>

      {/* Title */}
      <h2 style={{ color:"#f5d48a", fontSize:21, marginBottom:18, fontWeight:"bold", lineHeight:1.3 }}>
        {card.title}
      </h2>

      {/* Key Formula — KaTeX rendered */}
      {card.keyFormula && (
        <div style={{ background:"#080f1e", border:"1px solid #162a50", borderLeft:"3px solid #3a6ac0", borderRadius:10, padding:"16px 20px", marginBottom:18 }}>
          <div style={{ color:"#2a4a80", fontSize:10, fontFamily:"monospace", letterSpacing:2, marginBottom:12, textTransform:"uppercase" }}>Key Formula</div>
          <TeX block>{card.keyFormula}</TeX>
        </div>
      )}

      {/* Concept */}
      <div style={{ background:"#080f1e", border:"1px solid #12264a", borderLeft:"3px solid #2060a0", borderRadius:10, padding:"14px 18px", marginBottom:18 }}>
        <div style={{ color:"#2a4a7a", fontSize:10, fontFamily:"monospace", letterSpacing:2, marginBottom:8, textTransform:"uppercase" }}>Core Concept</div>
        <pre style={{ color:"#8ab8d8", fontSize:13, margin:0, whiteSpace:"pre-wrap", fontFamily:"monospace", lineHeight:1.7 }}>{card.concept}</pre>
      </div>

      {/* Problem */}
      <div style={{ background:"#0e0a04", border:"1px solid #30200a", borderLeft:"3px solid #f5a623", borderRadius:10, padding:"14px 18px", marginBottom:18 }}>
        <div style={{ color:"#a06820", fontSize:10, fontFamily:"monospace", letterSpacing:2, marginBottom:8, textTransform:"uppercase" }}>Problem</div>
        <p style={{ color:"#f0d9a0", fontSize:15, margin:0, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{card.problem}</p>
      </div>

      {/* Graph — shown between problem and solution for visual chapters */}
      {card.graph && <GraphPanel config={card.graph} />}

      {/* Step-by-step solution */}
      <div style={{ background:"#080e16", border:"1px solid #122030", borderLeft:"3px solid #1a3850", borderRadius:10, padding:"16px 18px" }}>
        <div style={{ color:"#2a4060", fontSize:10, fontFamily:"monospace", letterSpacing:2, marginBottom:14, textTransform:"uppercase" }}>Solution</div>
        <StepReveal steps={steps} keyFormula={null} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  CHECK CARD — MCQ with smart mistake-aware distractor highlighting
// ══════════════════════════════════════════════════════════════════════
function CheckCard({ card, selected, revealed, onOption, count }) {
  const letters = ["A","B","C","D"];

  // Classify what kind of mistake each wrong option represents
  const getMistakeLabel = (optIdx) => {
    if (!revealed || optIdx === card.answerIndex) return null;
    const mt = card.mistakeType;
    if (!mt) return "Common error";
    const labels = {
      sign: "Sign error", double: "Off by ×2", addmul: "Add/multiply confusion",
      offone: "Off by 1", nosqrt: "Forgot √", partial: "Incomplete calculation",
    };
    return labels[mt] || "Common error";
  };

  return (
    <div style={{ maxWidth:740, margin:"0 auto", animation:"fadeIn 0.3s ease" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>

      {/* Badge */}
      <div style={{ display:"flex", gap:8, marginBottom:18, alignItems:"center" }}>
        <span style={{ background:"#3a0808", color:"#f07070", padding:"3px 10px", borderRadius:5, fontSize:10, fontFamily:"monospace", letterSpacing:1 }}>✏️ CHECK</span>
        <span style={{ color:"#1e3060", fontSize:10, fontFamily:"monospace" }}>#{count}</span>
      </div>

      <h2 style={{ color:"#f5d48a", fontSize:20, marginBottom:20, fontWeight:"bold" }}>{card.title}</h2>

      {/* Question */}
      <div style={{ background:"#0e0a04", border:"1px solid #30200a", borderLeft:"3px solid #f5a623", borderRadius:10, padding:"16px 20px", marginBottom:22 }}>
        <p style={{ color:"#f0d9a0", fontSize:15, margin:0, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{card.question}</p>
      </div>

      {/* Options */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:22 }}>
        {card.options.map((opt, i) => {
          const isCorrect = i === card.answerIndex;
          const isSelected = i === selected;
          const isWrong = revealed && isSelected && !isCorrect;
          const mistakeLabel = getMistakeLabel(i);

          let bg="#080e18", border="1px solid #101a28", color="#8090a8";
          if (revealed) {
            if (isCorrect) { bg="#0a1e10"; border="1px solid #1e5a28"; color="#5de89a"; }
            else if (isWrong) { bg="#180808"; border="1px solid #5a1818"; color="#f07070"; }
          } else if (isSelected) { bg="#0c1428"; border="1px solid #203060"; color="#7eb8f7"; }

          return (
            <button key={i} onClick={() => onOption(i)} style={{
              display:"flex", alignItems:"flex-start", gap:12,
              background:bg, border, borderRadius:8,
              padding:"12px 16px", cursor:revealed?"default":"pointer",
              textAlign:"left", transition:"all 0.15s", color, width:"100%",
            }}>
              <span style={{
                fontFamily:"monospace", fontSize:11, fontWeight:"bold",
                background: isCorrect&&revealed?"#1a5028": isWrong?"#5a1818":"#0c1428",
                color: isCorrect&&revealed?"#5de89a": isWrong?"#f07070":"#2a3a58",
                borderRadius:4, padding:"2px 6px", flexShrink:0, marginTop:1,
              }}>{letters[i]}</span>
              <span style={{ fontSize:13.5, lineHeight:1.6, flex:1 }}>{opt}</span>
              {/* Mistake label on wrong answers */}
              {revealed && !isCorrect && (
                <span style={{ fontSize:9, fontFamily:"monospace", color:"#3a2020", background:"#1e0808", padding:"2px 6px", borderRadius:4, flexShrink:0, alignSelf:"center" }}>
                  {mistakeLabel}
                </span>
              )}
              {revealed && isCorrect && <span style={{ marginLeft:"auto", fontSize:16, flexShrink:0 }}>✓</span>}
              {isWrong && <span style={{ marginLeft:"auto", fontSize:16, flexShrink:0 }}>✗</span>}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && (
        <div style={{ background:"#080e10", border:"1px solid #122030", borderLeft:"3px solid #1a8050", borderRadius:10, padding:"14px 18px", animation:"fadeIn 0.25s ease" }}>
          <div style={{ color:"#1a5038", fontSize:10, fontFamily:"monospace", letterSpacing:2, marginBottom:8, textTransform:"uppercase" }}>✓ Explanation</div>
          {card.mistakeType && selected !== card.answerIndex && (
            <div style={{ marginBottom:10, padding:"6px 10px", background:"#1a0808", borderRadius:6, border:"1px solid #3a1818" }}>
              <span style={{ color:"#f07070", fontSize:11, fontFamily:"monospace" }}>
                ⚠ Common mistake type: {({sign:"Sign error — watch for negatives when dividing/multiplying by negative numbers.",double:"Doubling error — check if you doubled or halved accidentally.",addmul:"Add/multiply confusion — did you add exponents instead of multiplying?",offone:"Off-by-one — recount; boundaries often shift by 1 in sequences/counting.",nosqrt:"Square root omitted — remember to take √ at the final step.",partial:"Incomplete — you may have stopped one step early."})[card.mistakeType]||"Review the concept carefully."}
              </span>
            </div>
          )}
          <p style={{ color:"#5de89a", fontSize:13, margin:0, lineHeight:1.7, whiteSpace:"pre-wrap", fontFamily:"monospace" }}>{card.explanation}</p>
        </div>
      )}
    </div>
  );
}

// Register for use by openMathTrainer()
window._MathTrainerComponent = MathTrainer;

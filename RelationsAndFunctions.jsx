import { useState, useEffect, useRef, useCallback } from "react";

// ── KaTeX CDN loader ──────────────────────────────────────────
let _kDone = false; const _kCbs = [];
function _initKaTeX() {
  if (_kDone || window.katex || document.querySelector('[data-kx]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.setAttribute('data-kx','1');
  l.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
  document.head.appendChild(l);
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
  s.onload = () => { _kDone = true; _kCbs.forEach(f => f()); _kCbs.length = 0; };
  document.head.appendChild(s);
}
function onKaTeX(cb) { (_kDone || window.katex) ? cb() : _kCbs.push(cb); }

// ── Seeded random helpers ─────────────────────────────────────
const sr  = n => Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
const srI = (n, lo, hi) => Math.floor(sr(n) * (hi - lo + 1)) + lo;
const srP = (arr, n) => arr[Math.floor(sr(n) * arr.length)];
function genNums(seed, count, lo, hi) {
  const pool = Array.from({ length: hi - lo + 1 }, (_, i) => i + lo);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(sr(seed * 17 + i * 31) * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length)).sort((a, b) => a - b);
}
const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
const setStr = arr => `\\{${arr.join(', ')}\\}`;
const setTxt = arr => `{${arr.join(', ')}}`;
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const isPrime = n => n >= 2 && !Array.from({length: Math.floor(Math.sqrt(n))}, (_,i)=>i+2).some(i => n%i===0);

// ── KaTeX Renderer ────────────────────────────────────────────
function KTex({ l, block = false, style = {} }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(!!window.katex);
  useEffect(() => { if (!ready) onKaTeX(() => setReady(true)); }, []);
  useEffect(() => {
    if (ready && ref.current && l) {
      try { window.katex.render(l, ref.current, { throwOnError: false, displayMode: block, strict: false }); }
      catch { if (ref.current) ref.current.textContent = l; }
    }
  }, [ready, l, block]);
  if (!ready) return <span style={{ fontFamily: 'monospace', opacity: 0.8, ...style }}>{l}</span>;
  return <span ref={ref} style={style} />;
}

// ── Mini Arrow Diagram SVG ────────────────────────────────────
function ArrowDiagram({ A = ['1','2','3'], B = ['a','b','c'], pairs = [[0,0],[1,1],[2,2]], colorA = '#4ECDC4', colorB = '#FF6B6B', title = '' }) {
  const W = 260, H = Math.max(A.length, B.length) * 46 + 40;
  const xA = 48, xB = W - 48, rowH = (H - 40) / Math.max(A.length, B.length);
  const yA = i => 28 + i * rowH + rowH / 2;
  const yB = i => 28 + i * rowH + rowH / 2;
  return (
    <svg width={W} height={H} style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
      <rect x={8} y={8} width={xA * 1.6} height={H - 16} rx={10} fill={`${colorA}12`} stroke={`${colorA}40`} strokeWidth={1.5} />
      <rect x={W - xA * 1.6 - 8} y={8} width={xA * 1.6} height={H - 16} rx={10} fill={`${colorB}12`} stroke={`${colorB}40`} strokeWidth={1.5} />
      <text x={xA * 0.8 + 8} y={H - 4} textAnchor="middle" fill={`${colorA}88`} fontSize={11} fontFamily="Playfair Display,serif" fontWeight="bold">A</text>
      <text x={W - xA * 0.8 - 8} y={H - 4} textAnchor="middle" fill={`${colorB}88`} fontSize={11} fontFamily="Playfair Display,serif" fontWeight="bold">B</text>
      {A.map((a, i) => (<g key={i}><circle cx={xA} cy={yA(i)} r={14} fill={`${colorA}22`} stroke={colorA} strokeWidth={1.5}/><text x={xA} y={yA(i) + 4} textAnchor="middle" fill={colorA} fontSize={12} fontFamily="JetBrains Mono,monospace">{a}</text></g>))}
      {B.map((b, i) => (<g key={i}><circle cx={xB} cy={yB(i)} r={14} fill={`${colorB}22`} stroke={colorB} strokeWidth={1.5}/><text x={xB} y={yB(i) + 4} textAnchor="middle" fill={colorB} fontSize={12} fontFamily="JetBrains Mono,monospace">{b}</text></g>))}
      {pairs.map(([ai, bi], k) => {
        const x1 = xA + 15, y1 = yA(ai), x2 = xB - 15, y2 = yB(bi);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 10;
        return (<g key={k}><path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" stroke="rgba(255,209,102,0.6)" strokeWidth={1.5} markerEnd="url(#arr)" /><circle cx={x2} cy={y2} r={3} fill="rgba(255,209,102,0.8)" /></g>);
      })}
      <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="rgba(255,209,102,0.8)" /></marker></defs>
      {title && <text x={W/2} y={H + 16} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={11} fontFamily="Crimson Pro,serif" fontStyle="italic">{title}</text>}
    </svg>
  );
}

// ── Mini Function Graph SVG ────────────────────────────────────
function FnGraph({ fn = x => x, xRange = [-3, 3], yRange = [-3, 3], color = '#4ECDC4', label = '', pts = 120 }) {
  const W = 260, H = 180, pad = 28;
  const gW = W - 2 * pad, gH = H - 2 * pad;
  const toSX = x => pad + ((x - xRange[0]) / (xRange[1] - xRange[0])) * gW;
  const toSY = y => pad + gH - ((y - yRange[0]) / (yRange[1] - yRange[0])) * gH;
  const xs = Array.from({ length: pts }, (_, i) => xRange[0] + i * (xRange[1] - xRange[0]) / (pts - 1));
  const points = xs.map(x => {
    try { const y = fn(x); return (isFinite(y) && y >= yRange[0] - 1 && y <= yRange[1] + 1) ? `${toSX(x).toFixed(1)},${toSY(y).toFixed(1)}` : null; } catch { return null; }
  });
  // split at nulls
  const paths = []; let cur = [];
  points.forEach(p => { if (p) cur.push(p); else if (cur.length) { paths.push(cur); cur = []; } });
  if (cur.length) paths.push(cur);
  const x0 = toSX(0), y0 = toSY(0);
  return (
    <svg width={W} height={H + 20} style={{ display: 'block', margin: '0 auto' }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      <line x1={pad} y1={y0} x2={W - pad} y2={y0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      <line x1={x0} y1={pad} x2={x0} y2={H - pad} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      {[-2,-1,1,2].map(v => (<g key={v}><line x1={toSX(v)} y1={pad} x2={toSX(v)} y2={H-pad} stroke="rgba(255,255,255,0.05)" strokeWidth={1} /><line x1={pad} y1={toSY(v)} x2={W-pad} y2={toSY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} /></g>))}
      {paths.map((seg, i) => <polyline key={i} points={seg.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
      {label && <text x={W / 2} y={H + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={11} fontFamily="Crimson Pro,serif" fontStyle="italic">{label}</text>}
    </svg>
  );
}
// ── Notation Table ────────────────────────────────────────────
const NOTATION = [
  { sym: 'A \\times B',       name: 'Cartesian Product',     meaning: 'All ordered pairs (a, b) with a∈A, b∈B',    ex: '\\{1,2\\}\\times\\{x,y\\}=\\{(1,x),(1,y),(2,x),(2,y)\\}' },
  { sym: '(a, b)',             name: 'Ordered Pair',          meaning: 'Sequence of two elements; order matters',    ex: '(2,3) \\neq (3,2)' },
  { sym: 'R \\subseteq A\\times B', name: 'Relation R',      meaning: 'A relation is a subset of A×B',             ex: 'R = \\{(1,a),(2,b)\\} \\subseteq A\\times B' },
  { sym: 'aRb',                name: 'a relates to b',        meaning: 'The pair (a,b) belongs to relation R',      ex: 'aRb \\Leftrightarrow (a,b)\\in R' },
  { sym: '\\text{Dom}(R)',     name: 'Domain',                meaning: 'Set of all first elements (pre-images)',     ex: '\\text{Dom}(R)=\\{a:(a,b)\\in R\\}' },
  { sym: '\\text{Ran}(R)',     name: 'Range',                 meaning: 'Set of all second elements (images)',        ex: '\\text{Ran}(R)=\\{b:(a,b)\\in R\\}' },
  { sym: '\\text{Codom}(f)',   name: 'Codomain',              meaning: 'Target set B in f: A→B (range ⊆ codomain)', ex: 'f:A\\to B,\\;\\text{Codom}=B' },
  { sym: 'R^{-1}',            name: 'Inverse Relation',       meaning: 'Swap all pairs: (b,a) from (a,b)',          ex: 'R^{-1}=\\{(b,a):(a,b)\\in R\\}' },
  { sym: 'f: A \\to B',       name: 'Function',              meaning: 'A rule assigning each element of A exactly one in B', ex: 'f(x) = x^2,\\; f:\\mathbb{R}\\to\\mathbb{R}' },
  { sym: 'f(x)',               name: 'Image of x',            meaning: 'Output of function f at input x',           ex: 'f(x)=2x+1,\\;f(3)=7' },
  { sym: 'f^{-1}(x)',         name: 'Inverse Function',       meaning: 'Undoes f; exists only if f is bijective',   ex: 'f(x)=2x\\Rightarrow f^{-1}(x)=x/2' },
  { sym: '(f\\circ g)(x)',    name: 'Composite Function',     meaning: 'Apply g first, then f to the result',       ex: '(f\\circ g)(x)=f(g(x))' },
  { sym: 'f+g,\\;fg',         name: 'Algebra of Functions',  meaning: 'Pointwise addition and multiplication',      ex: '(f+g)(x)=f(x)+g(x)' },
  { sym: '|x|',                name: 'Absolute Value (Modulus)', meaning: 'Distance from 0; always ≥ 0',           ex: '|x|=\\begin{cases}x&x\\geq 0\\\\-x&x<0\\end{cases}' },
  { sym: '\\lfloor x \\rfloor','name': 'Floor / GIF',        meaning: 'Greatest integer ≤ x',                      ex: '\\lfloor 3.7\\rfloor=3,\\;\\lfloor -2.3\\rfloor=-3' },
  { sym: '\\{x\\}',            name: 'Fractional Part',       meaning: '{x} = x − ⌊x⌋',                           ex: '\\{3.7\\}=0.7,\\;\\{-2.3\\}=0.7' },
  { sym: '\\text{sgn}(x)',     name: 'Signum Function',       meaning: 'Sign of x: −1, 0, or +1',                  ex: '\\text{sgn}(-5)=-1,\\;\\text{sgn}(0)=0,\\;\\text{sgn}(3)=1' },
  { sym: 'f \\text{ injective}','name': 'One-to-One (1-1)',  meaning: 'Different inputs give different outputs',    ex: 'f(a)=f(b)\\Rightarrow a=b' },
  { sym: 'f \\text{ surjective}','name': 'Onto',             meaning: 'Every element of codomain is an image',     ex: '\\forall b\\in B,\\;\\exists a\\in A:f(a)=b' },
  { sym: 'f \\text{ bijective}','name': 'Bijective',         meaning: 'Both injective AND surjective',             ex: '\\text{One-to-one correspondence}' },
  { sym: '\\phi(n)',           name: "Euler's Totient",        meaning: 'Count of integers ≤n coprime to n',         ex: '\\phi(6)=2,\\;\\phi(p)=p-1\\text{ (p prime)}' },
  { sym: 'd(n)',               name: 'Divisor Function',       meaning: 'Number of positive divisors of n',          ex: 'd(6)=4\\;(1,2,3,6)' },
  { sym: '\\sigma(n)',         name: 'Sum of Divisors',        meaning: 'Sum of all positive divisors of n',         ex: '\\sigma(6)=12\\;(1+2+3+6)' },
  { sym: 'f(x+y)=f(x)+f(y)', name: "Cauchy's Equation",     meaning: 'Additive functional equation (over ℝ)',     ex: 'f(x)=cx\\text{ (continuous sol.)}' },
  { sym: 'f(x)=f(-x)',        name: 'Even Function',          meaning: 'Symmetric about y-axis',                   ex: 'f(x)=x^2,\\cos(x)' },
  { sym: 'f(-x)=-f(x)',       name: 'Odd Function',           meaning: 'Symmetric about origin',                   ex: 'f(x)=x^3,\\sin(x)' },
  { sym: 'f(x+T)=f(x)',       name: 'Periodic Function',      meaning: 'Repeats every T units (T is the period)',   ex: '\\sin(x+2\\pi)=\\sin(x)' },
];

// ── Sections ──────────────────────────────────────────────────
const SECTIONS = [
  {
    id:'cartesian', title:'Cartesian Product A × B', level:'Beginner', color:'#4ECDC4', icon:'×',
    shortDef:'A × B is the set of ALL ordered pairs (a, b) where a ∈ A and b ∈ B.',
    fullDef:'Named after René Descartes, A × B creates every possible combination of one element from A with one from B as ordered pairs. Since order matters in pairs — (1, a) ≠ (a, 1) — A × B ≠ B × A in general. The Cartesian product is the foundation on which all relations and functions are built. If |A| = m and |B| = n, then |A × B| = mn.',
    keyFacts:[
      {text:'Definition', l:'A\\times B=\\{(a,b):a\\in A,\\;b\\in B\\}'},
      {text:'Size formula', l:'|A\\times B|=|A|\\cdot|B|'},
      {text:'NOT commutative (generally)', l:'A\\times B\\neq B\\times A'},
      {text:'With empty set', l:'A\\times\\phi=\\phi'},
      {text:'Coordinate plane example', l:'\\mathbb{R}\\times\\mathbb{R}=\\mathbb{R}^2\\text{ (the XY-plane)}'},
      {text:'Self-product example', l:'\\{1,2\\}\\times\\{1,2\\}=\\{(1,1),(1,2),(2,1),(2,2)\\}'},
    ], genKey:'cartesian',
  },
  {
    id:'rel_def', title:'Definition & Representation of Relations', level:'Beginner', color:'#FF6B6B', icon:'R',
    shortDef:'A relation R from set A to B is any subset of A × B — a collection of ordered pairs.',
    fullDef:'When we "relate" elements of A to elements of B according to some rule, we form a relation. For example, "is the father of" relates people to people. Relations are represented in four ways: Roster (list pairs), Set-builder (state the rule), Arrow diagram (draw arrows), or Matrix (grid of 0s and 1s). The domain is all first-elements, the range is all second-elements used, and the codomain is the full target set B.',
    keyFacts:[
      {text:'Relation as subset', l:'R\\subseteq A\\times B'},
      {text:'Domain', l:'\\text{Dom}(R)=\\{a\\in A:\\exists b\\in B,(a,b)\\in R\\}'},
      {text:'Range', l:'\\text{Ran}(R)=\\{b\\in B:\\exists a\\in A,(a,b)\\in R\\}'},
      {text:'Number of relations from A to B', l:'\\text{If }|A|=m,|B|=n,\\text{ then }2^{mn}\\text{ relations exist}'},
      {text:'Inverse relation', l:'R^{-1}=\\{(b,a):(a,b)\\in R\\}'},
    ], genKey:'rel_def',
  },
  {
    id:'rel_types', title:'Types of Relations', level:'Beginner', color:'#A78BFA', icon:'∅→U',
    shortDef:'Relations are classified as empty, universal, identity, or inverse based on which pairs they contain.',
    fullDef:'The Empty relation contains no pairs (∅). The Universal relation contains all possible pairs (A × B). The Identity relation on A maps each element only to itself: {(a,a) : a ∈ A}. The Inverse relation R⁻¹ swaps every pair. Understanding these extremes and special cases is crucial before studying properties.',
    keyFacts:[
      {text:'Empty relation', l:'R=\\phi\\;(\\text{no pairs})'},
      {text:'Universal relation', l:'R=A\\times B\\;(\\text{all pairs})'},
      {text:'Identity relation on A', l:'I_A=\\{(a,a):a\\in A\\}'},
      {text:'Inverse relation', l:'R^{-1}=\\{(b,a):(a,b)\\in R\\}'},
      {text:'Dom of inverse = Ran of R', l:'\\text{Dom}(R^{-1})=\\text{Ran}(R)'},
    ], genKey:'rel_types',
  },
  {
    id:'rel_props', title:'Properties of Relations', level:'Beginner', color:'#34D399', icon:'≡',
    shortDef:'Relations on a set A can be reflexive, symmetric, transitive, or antisymmetric.',
    fullDef:'These four properties describe how a relation "behaves" with respect to the elements of A. A relation can have none, some, or all of these properties. Reflexive means every element relates to itself. Symmetric means if a relates to b, then b relates to a. Transitive chains: if a→b and b→c then a→c. Antisymmetric: if aRb and bRa then a = b (used in orderings).',
    keyFacts:[
      {text:'Reflexive: every element relates to itself', l:'\\forall a\\in A,\\;(a,a)\\in R'},
      {text:'Symmetric: bidirectional', l:'(a,b)\\in R\\Rightarrow(b,a)\\in R'},
      {text:'Transitive: chain propagates', l:'(a,b)\\in R\\text{ and }(b,c)\\in R\\Rightarrow(a,c)\\in R'},
      {text:'Antisymmetric: no two-way except equal', l:'(a,b)\\in R\\text{ and }(b,a)\\in R\\Rightarrow a=b'},
      {text:'Irreflexive: NO element relates to itself', l:'\\forall a,\\;(a,a)\\notin R'},
    ], genKey:'rel_props',
  },
  {
    id:'equiv', title:'Equivalence Relations', level:'Beginner', color:'#F59E0B', icon:'~',
    shortDef:'A relation is an equivalence relation if it is Reflexive, Symmetric, AND Transitive.',
    fullDef:'Equivalence relations generalize the notion of equality. They partition the entire set A into disjoint equivalence classes where every element within a class is "equivalent" to every other in that class. Classic examples: congruence modulo n (a ≡ b mod n), "same length" on line segments, "same birthday" on people. The set of all equivalence classes is called the quotient set A/R.',
    keyFacts:[
      {text:'Must be all three: R + S + T', l:'R\\text{ equiv.}\\Leftrightarrow\\text{Reflexive}\\wedge\\text{Symmetric}\\wedge\\text{Transitive}'},
      {text:'Equivalence class of a', l:'[a]=\\{b\\in A:(a,b)\\in R\\}'},
      {text:'Classes partition A', l:'A=\\bigsqcup_{i}[a_i]\\;\\text{(disjoint union)}'},
      {text:'Congruence mod n', l:'a\\equiv b\\pmod{n}\\Leftrightarrow n\\mid(a-b)'},
      {text:'Number of equiv. classes', l:'\\text{Equals the number of parts in the partition of }A'},
    ], genKey:'equiv',
  },
  {
    id:'poset', title:'Partial Order & Hasse Diagrams', level:'Beginner', color:'#60A5FA', icon:'≤',
    shortDef:'A partial order is Reflexive, Antisymmetric, and Transitive — the basis for Hasse diagrams.',
    fullDef:'A partial order ≤ on set A (a POSET — Partially Ordered Set) extends the familiar ≤ on numbers. Unlike equivalence, it is antisymmetric: a ≤ b and b ≤ a forces a = b. A Hasse diagram is a visual "upward" graph: draw a above b if a > b and there\'s no element in between. Familiar examples: divisibility on {1,…,12}, subset ordering on power sets.',
    keyFacts:[
      {text:'Partial order: R+A+T (not necessarily S)', l:'\\text{Reflexive}+\\text{Antisymmetric}+\\text{Transitive}'},
      {text:'Divisibility partial order', l:'a\\leq b\\Leftrightarrow a\\mid b\\;\\text{(on }\\mathbb{N})'},
      {text:'Subset partial order', l:'A\\leq B\\Leftrightarrow A\\subseteq B\\;\\text{(on power set)}'},
      {text:'Linear / total order', l:'\\text{Every pair is comparable: }a\\leq b\\text{ or }b\\leq a'},
      {text:'Hasse diagram rule', l:'\\text{Draw }b\\text{ above }a\\text{ if }a<b\\text{ with no element between}'},
    ], genKey:'poset',
  },
  {
    id:'fn_def', title:'Definition of a Function', level:'Intermediate', color:'#EC4899', icon:'f(x)',
    shortDef:'A function f: A → B is a relation where every element of A has exactly ONE image in B.',
    fullDef:'A function is a "reliable machine": put any valid input in, get exactly one output out — no ambiguity, no missing values. More formally, f is a function iff (a, b₁) ∈ f and (a, b₂) ∈ f implies b₁ = b₂. This is the KEY difference from a general relation. Every function is a relation, but not every relation is a function. Functions model almost every real-world relationship in mathematics and science.',
    keyFacts:[
      {text:'Function rule: one output per input', l:'(a,b_1)\\in f\\text{ and }(a,b_2)\\in f\\Rightarrow b_1=b_2'},
      {text:'Domain: all valid inputs', l:'\\text{Dom}(f)=A'},
      {text:'Range ⊆ Codomain', l:'\\text{Ran}(f)\\subseteq\\text{Codom}(f)=B'},
      {text:'Notation', l:'f:A\\to B,\\;x\\mapsto f(x)'},
      {text:'Total functions from A to B', l:'|B|^{|A|}\\;\\text{functions exist}'},
    ], genKey:'fn_def',
  },
  {
    id:'fn_types', title:'Types of Functions', level:'Intermediate', color:'#8B5CF6', icon:'↔',
    shortDef:'Functions are classified as injective (1-1), surjective (onto), or bijective (both).',
    fullDef:'Injective (one-to-one): distinct inputs always give distinct outputs — the function "spreads out" elements. Surjective (onto): every element of the codomain is "hit" — the function "covers" B entirely. Bijective: both injective and surjective — there is a perfect pairing between A and B. Only bijective functions have true inverses. These properties determine what kind of inverse exists and the relative sizes of A and B.',
    keyFacts:[
      {text:'Injective (1-1)', l:'f(a_1)=f(a_2)\\Rightarrow a_1=a_2'},
      {text:'Surjective (onto)', l:'\\forall b\\in B,\\;\\exists a\\in A:f(a)=b'},
      {text:'Bijective = Injective + Surjective', l:'f\\text{ bijective}\\Leftrightarrow f\\text{ has an inverse}'},
      {text:'Injective count (|A|≤|B|)', l:'\\frac{|B|!}{(|B|-|A|)!}\\text{ injections}'},
      {text:'Surjective count (inclusion-exclusion)', l:'\\sum_{k=0}^{|B|}(-1)^k\\binom{|B|}{k}(|B|-k)^{|A|}'},
    ], genKey:'fn_types',
  },
  {
    id:'special_fns', title:'Special Function Types', level:'Intermediate', color:'#F97316', icon:'⌊x⌋',
    shortDef:'Modulus, Signum, Greatest Integer (floor), and Fractional Part are fundamental special functions.',
    fullDef:'These functions appear constantly in analysis and number theory. The modulus |x| gives distance from zero. The signum function sgn(x) extracts the sign. The Greatest Integer Function ⌊x⌋ (also called floor) rounds down to the nearest integer — note that ⌊−2.3⌋ = −3 (not −2). The fractional part {x} = x − ⌊x⌋ is always in [0, 1). Together they decompose any real number.',
    keyFacts:[
      {text:'Modulus', l:'|x|=\\begin{cases}x&x\\geq 0\\\\-x&x<0\\end{cases}'},
      {text:'Signum', l:'\\text{sgn}(x)=\\begin{cases}1&x>0\\\\0&x=0\\\\-1&x<0\\end{cases}'},
      {text:'Greatest Integer Function (GIF)', l:'\\lfloor x\\rfloor=\\text{largest integer}\\leq x'},
      {text:'GIF for negatives (careful!)', l:'\\lfloor -2.3\\rfloor=-3,\\;\\lfloor 2.3\\rfloor=2'},
      {text:'Fractional Part', l:'\\{x\\}=x-\\lfloor x\\rfloor\\in[0,1)'},
      {text:'Key GIF property', l:'\\lfloor x+n\\rfloor=\\lfloor x\\rfloor+n\\;\\text{for }n\\in\\mathbb{Z}'},
    ], genKey:'special_fns',
  },
  {
    id:'composite', title:'Composite Functions  f ∘ g', level:'Intermediate', color:'#2DD4BF', icon:'∘',
    shortDef:'(f ∘ g)(x) = f(g(x)): apply g first, then apply f to the result.',
    fullDef:'Composition chains functions together. Think of it as a pipeline: input → g → intermediate → f → output. Composition is NOT generally commutative (f∘g ≠ g∘f), but IS associative: (f∘g)∘h = f∘(g∘h). For composition to be defined, the range of g must be a subset of the domain of f. If f: B→C and g: A→B, then f∘g: A→C.',
    keyFacts:[
      {text:'Definition', l:'(f\\circ g)(x)=f(g(x))'},
      {text:'NOT commutative', l:'f\\circ g\\neq g\\circ f\\;\\text{(generally)}'},
      {text:'IS associative', l:'(f\\circ g)\\circ h=f\\circ(g\\circ h)'},
      {text:'Domain condition', l:'\\text{Ran}(g)\\subseteq\\text{Dom}(f)\\text{ for }f\\circ g\\text{ to exist}'},
      {text:'Composition types', l:'\\text{If }f,g\\text{ injective}\\Rightarrow f\\circ g\\text{ injective}'},
      {text:'Identity composition', l:'f\\circ I=I\\circ f=f'},
    ], genKey:'composite',
  },
  {
    id:'inverse_fn', title:'Inverse Functions  f⁻¹', level:'Intermediate', color:'#FCD34D', icon:'f⁻¹',
    shortDef:'The inverse f⁻¹ undoes f: f⁻¹(f(x)) = x. It exists only when f is bijective.',
    fullDef:'If f: A → B is bijective, then f⁻¹: B → A is defined by f⁻¹(b) = a ⟺ f(a) = b. Graphically, the inverse is the reflection of f across the line y = x. To find f⁻¹ algebraically: replace f(x) with y, swap x and y, then solve for y. The domain of f⁻¹ equals the range of f, and vice versa.',
    keyFacts:[
      {text:'Exists iff f is bijective', l:'f^{-1}\\text{ exists}\\Leftrightarrow f\\text{ is bijective}'},
      {text:'Definition', l:'f^{-1}(b)=a\\Leftrightarrow f(a)=b'},
      {text:'Cancellation laws', l:'f^{-1}(f(x))=x\\;\\text{and}\\;f(f^{-1}(y))=y'},
      {text:'Graph reflection', l:'\\text{Graph of }f^{-1}\\text{ is reflection of }f\\text{ in }y=x'},
      {text:'Inverse of inverse', l:'(f^{-1})^{-1}=f'},
      {text:'Inverse of composition', l:'(f\\circ g)^{-1}=g^{-1}\\circ f^{-1}'},
    ], genKey:'inverse_fn',
  },
  {
    id:'alg_fns', title:'Algebra of Functions', level:'Intermediate', color:'#FB923C', icon:'f±g',
    shortDef:'Functions can be added, subtracted, multiplied, and divided pointwise.',
    fullDef:'Given f, g with a common domain D, we define new functions: (f+g)(x) = f(x)+g(x), (f−g)(x) = f(x)−g(x), (fg)(x) = f(x)·g(x), and (f/g)(x) = f(x)/g(x) where g(x) ≠ 0. The domain of f/g excludes all points where g(x) = 0. This algebraic structure makes the set of functions into a ring.',
    keyFacts:[
      {text:'Sum', l:'(f+g)(x)=f(x)+g(x)'},
      {text:'Difference', l:'(f-g)(x)=f(x)-g(x)'},
      {text:'Product', l:'(fg)(x)=f(x)\\cdot g(x)'},
      {text:'Quotient (g(x)≠0)', l:'\\left(\\frac{f}{g}\\right)(x)=\\frac{f(x)}{g(x)}'},
      {text:'Domain of f/g', l:'\\text{Dom}(f/g)=\\text{Dom}(f)\\cap\\text{Dom}(g)\\setminus\\{x:g(x)=0\\}'},
    ], genKey:'alg_fns',
  },
  {
    id:'even_odd', title:'Even & Odd Functions', level:'Intermediate', color:'#C084FC', icon:'±x',
    shortDef:'Even: f(−x) = f(x) (symmetric about y-axis). Odd: f(−x) = −f(x) (symmetric about origin).',
    fullDef:'Symmetry determines whether a function is even or odd. Even functions (like cos x, x², |x|) look the same when reflected in the y-axis. Odd functions (like sin x, x³, x) rotate to themselves by 180° about the origin. Most functions are NEITHER even nor odd. The domain must be symmetric about 0 for even/odd classification to make sense. The sum of an even and odd function is generally neither.',
    keyFacts:[
      {text:'Even function test', l:'f(-x)=f(x)\\;\\forall x\\in\\text{Dom}(f)'},
      {text:'Odd function test', l:'f(-x)=-f(x)\\;\\forall x\\in\\text{Dom}(f)'},
      {text:'Even examples', l:'x^2,\\;x^4,\\;|x|,\\;\\cos x,\\;\\cosh x'},
      {text:'Odd examples', l:'x,\\;x^3,\\;\\sin x,\\;\\tan x,\\;\\sinh x'},
      {text:'Odd function value at 0', l:'f(-0)=-f(0)\\Rightarrow f(0)=0\\text{ (if defined)}'},
      {text:'Product: even×odd = odd', l:'f\\text{ even},g\\text{ odd}\\Rightarrow fg\\text{ odd}'},
    ], genKey:'even_odd',
  },
  {
    id:'periodic', title:'Periodic Functions', level:'Intermediate', color:'#86EFAC', icon:'∿',
    shortDef:'f is periodic with period T if f(x + T) = f(x) for all x. T is the smallest such positive value.',
    fullDef:'Periodic functions repeat their pattern every T units. The fundamental period T is the smallest positive value for which f(x+T) = f(x). If f has period T, then nT is also a period for any integer n. The sum of two periodic functions may or may not be periodic (it is if the ratio of their periods is rational). Periodic functions are central to Fourier analysis, signal processing, and wave mechanics.',
    keyFacts:[
      {text:'Definition', l:'f(x+T)=f(x)\\;\\forall x,\\;T>0'},
      {text:'sin and cos periods', l:'\\sin(x+2\\pi)=\\sin x,\\;\\cos(x+2\\pi)=\\cos x'},
      {text:'tan period', l:'\\tan(x+\\pi)=\\tan x,\\;\\text{period}=\\pi'},
      {text:'GIF period', l:'\\lfloor x+1\\rfloor-\\lfloor x\\rfloor\\text{ is periodic with period }1'},
      {text:'Rational ratio → periodic sum', l:'T_f/T_g\\in\\mathbb{Q}\\Rightarrow f+g\\text{ is periodic}'},
      {text:'Constant is periodic', l:'f(x)=c\\text{ has any }T>0\\text{ as period (no fundamental period)}'},
    ], genKey:'periodic',
  },
  {
    id:'monotonic', title:'Monotonic Functions', level:'Intermediate', color:'#38BDF8', icon:'↑↓',
    shortDef:'A function is monotonically increasing if x₁ < x₂ ⟹ f(x₁) < f(x₂), decreasing if reversed.',
    fullDef:'Monotonic functions never "turn around" — they consistently go up or down. Strictly increasing: x₁ < x₂ ⟹ f(x₁) < f(x₂). Strictly decreasing: x₁ < x₂ ⟹ f(x₁) > f(x₂). Key property: every strictly monotonic function is injective (one-to-one) and has an inverse on its range. A function is monotone if it is either entirely increasing or entirely decreasing.',
    keyFacts:[
      {text:'Strictly increasing', l:'x_1<x_2\\Rightarrow f(x_1)<f(x_2)'},
      {text:'Strictly decreasing', l:'x_1<x_2\\Rightarrow f(x_1)>f(x_2)'},
      {text:'Monotone ⟹ injective', l:'\\text{Strictly monotone}\\Rightarrow\\text{one-to-one}'},
      {text:'Monotone + bijective ⟹ inverse exists', l:'f^{-1}\\text{ is also monotone}'},
      {text:'Product of two increasing', l:'f,g\\geq 0\\text{ increasing}\\Rightarrow fg\\text{ increasing}'},
    ], genKey:'monotonic',
  },
  {
    id:'cauchy', title:"Cauchy's Functional Equation", level:'Olympiad', color:'#F87171', icon:'C(x+y)',
    shortDef:'f(x+y) = f(x) + f(y). If continuous (or monotone, or bounded), the only solutions are f(x) = cx.',
    fullDef:'Cauchy\'s equation f(x+y) = f(x)+f(y) is the most fundamental functional equation. Over ℚ, the only solutions are f(x) = cx (proved by setting x=y=0 to get f(0)=0, then induction). Over ℝ without continuity assumptions, there exist wild pathological solutions. The four Cauchy variants are: additive f(x+y)=f(x)+f(y), exponential f(x+y)=f(x)f(y), logarithmic f(xy)=f(x)+f(y), and power f(xy)=f(x)f(y).',
    keyFacts:[
      {text:'Cauchy additive', l:'f(x+y)=f(x)+f(y)\\Rightarrow f(x)=cx\\;(\\text{if cont.})'},
      {text:'Set x=y=0', l:'f(0+0)=f(0)+f(0)\\Rightarrow f(0)=0'},
      {text:'Cauchy exponential', l:'f(x+y)=f(x)f(y)\\Rightarrow f(x)=a^x'},
      {text:'Cauchy logarithmic', l:'f(xy)=f(x)+f(y)\\Rightarrow f(x)=c\\ln x'},
      {text:'Cauchy power', l:'f(xy)=f(x)f(y)\\Rightarrow f(x)=x^c'},
      {text:'Key substitution technique', l:'\\text{Try }x=y=0,\\;y=x,\\;y=-x\\text{ to reveal structure}'},
    ], genKey:'cauchy',
  },
  {
    id:'fixed_pts', title:'Fixed Points & Iterated Functions', level:'Olympiad', color:'#818CF8', icon:'f(x)=x',
    shortDef:'A fixed point of f is x* where f(x*) = x*. Iterates are f(f(x)), f(f(f(x))), etc.',
    fullDef:'Fixed points satisfy f(x) = x — the input is unchanged by the function. Geometrically, fixed points are intersections of y = f(x) and the line y = x. Iterated functions fⁿ(x) = f applied n times can converge to a fixed point (attractive), diverge, or cycle. By the Banach Fixed Point Theorem, a contraction mapping on a complete metric space has a unique fixed point. Fixed point theory underlies Newton\'s method, fractal geometry, and stability analysis.',
    keyFacts:[
      {text:'Fixed point definition', l:'f(x^*)=x^*'},
      {text:'Geometric interpretation', l:'\\text{Intersection of }y=f(x)\\text{ and }y=x'},
      {text:'f² (iterate twice)', l:'f^2(x)=f(f(x))'},
      {text:'Period-2 orbit', l:'f(f(x))=x\\text{ but }f(x)\\neq x'},
      {text:'Contraction: unique fixed point', l:'|f(x)-f(y)|\\leq k|x-y|,\\;k<1\\Rightarrow\\text{unique fixed pt}'},
      {text:'Intermediate value argument', l:'f:[a,b]\\to[a,b]\\text{ continuous}\\Rightarrow\\exists\\text{ fixed pt}'},
    ], genKey:'fixed_pts',
  },
  {
    id:'fn_inequalities', title:'Functional Inequalities', level:'Olympiad', color:'#34D399', icon:'≥',
    shortDef:'Functional inequalities like f(x+y) ≥ f(x) + f(y) (superadditive) arise in Olympiad problems.',
    fullDef:'Functional inequalities constrain the form of f without fully determining it. Superadditive: f(x+y) ≥ f(x)+f(y). Subadditive: f(x+y) ≤ f(x)+f(y). Jensen\'s inequality states: for convex f, f((x+y)/2) ≤ (f(x)+f(y))/2. For concave f, the inequality reverses. The standard technique: find specific substitutions (x=y=0, x=1, y=−x) that reveal the behavior, then use continuity or monotonicity arguments.',
    keyFacts:[
      {text:'Superadditive', l:'f(x+y)\\geq f(x)+f(y)\\;\\forall x,y'},
      {text:'Subadditive', l:'f(x+y)\\leq f(x)+f(y)\\;\\forall x,y'},
      {text:"Jensen's (convex f)", l:'f\\left(\\frac{x+y}{2}\\right)\\leq\\frac{f(x)+f(y)}{2}'},
      {text:"Jensen's (concave f)", l:'f\\left(\\frac{x+y}{2}\\right)\\geq\\frac{f(x)+f(y)}{2}'},
      {text:'Triangle inequality', l:'|f(x)-f(y)|\\leq|x-y|\\Rightarrow f\\text{ is Lipschitz}'},
    ], genKey:'fn_inequalities',
  },
  {
    id:'totient', title:"Euler's Totient & Arithmetic Functions", level:'Olympiad', color:'#FCD34D', icon:'φ(n)',
    shortDef:'φ(n) counts integers from 1 to n that are coprime to n. Key multiplicative function in number theory.',
    fullDef:'Euler\'s totient φ(n) = |{k : 1 ≤ k ≤ n, gcd(k,n)=1}|. For prime p: φ(p) = p−1. For prime powers: φ(pᵏ) = pᵏ − pᵏ⁻¹. For coprime m,n: φ(mn) = φ(m)φ(n). The divisor function d(n) counts divisors, σ(n) sums them, and the Möbius function μ(n) encodes the factorization pattern. These multiplicative arithmetic functions are the backbone of analytic and algebraic number theory.',
    keyFacts:[
      {text:"Euler's totient formula", l:'\\phi(n)=n\\prod_{p|n}\\left(1-\\frac{1}{p}\\right)'},
      {text:'Prime case', l:'\\phi(p)=p-1'},
      {text:'Prime power case', l:'\\phi(p^k)=p^k-p^{k-1}'},
      {text:'Multiplicativity: gcd(m,n)=1', l:'\\phi(mn)=\\phi(m)\\phi(n)'},
      {text:'Sum identity', l:'\\sum_{d|n}\\phi(d)=n'},
      {text:'Divisor count', l:'d(n)=\\prod(e_i+1)\\text{ if }n=\\prod p_i^{e_i}'},
    ], genKey:'totient',
  },
  {
    id:'olympiad_rf', title:'Olympiad Challenge Problems', level:'Olympiad', color:'#F59E0B', icon:'★',
    shortDef:'Competition-level problems combining functional equations, bijections, and combinatorial functions.',
    fullDef:'Olympiad problems in relations and functions test deep structural understanding: prove a function is bijective using clever arguments, solve a functional equation over ℤ using induction, count functions with given properties, or show a fixed point must exist. The key techniques are strategic substitution, injectivity/surjectivity proofs, construction of counter-examples, and exploiting symmetry of the equation.',
    keyFacts:[
      {text:'D\'Alembert equation', l:'f(x+y)+f(x-y)=2f(x)f(y)\\Rightarrow f=\\cos\\text{ or }f=\\cosh'},
      {text:'Bijections count: |A|=|B| needed', l:'f:A\\to B\\text{ bijective}\\Rightarrow|A|=|B|'},
      {text:'Functions |A|→|B|, |A|=m, |B|=n', l:'\\text{Injective: }n^{\\underline{m}}=\\frac{n!}{(n-m)!},\\text{ Bijective (m=n): }n!'},
      {text:'Involution: f(f(x))=x', l:'f^2=\\text{id}\\Rightarrow f\\text{ is its own inverse}'},
      {text:'Period of iterate', l:'f^n=\\text{id}\\Rightarrow\\text{period divides }n'},
    ], genKey:'olympiad_rf',
  },
];
// ── Procedural Question Generators ────────────────────────────
const GENERATORS = {
  cartesian:(n)=>{
    const letters=[['a','b','c','d'],['p','q','r'],['x','y','z'],['α','β','γ'],['i','ii','iii']];
    const A=srP(letters,n).slice(0,srI(n+1,2,3));
    const B=srP(letters,n+7).slice(0,srI(n+2,2,3));
    const AxB=A.flatMap(a=>B.map(b=>`(${a},${b})`));
    const BxA=B.flatMap(b=>A.map(a=>`(${b},${a})`));
    return{question:`A = {${A.join(', ')}}, B = {${B.join(', ')}}. Find A × B, B × A, and verify |A×B| = |A|·|B|.`,questionLatex:`A=\\{${A.join(',')}\\},\\;B=\\{${B.join(',')}\\}.\\text{ Find }A\\times B,\\;B\\times A.`,
    steps:[`For each a∈A, pair with every b∈B:`,...A.map(a=>`  ${a}: ${B.map(b=>`(${a},${b})`).join(', ')}`),`A×B = {${AxB.join(', ')}}`,`B×A = {${BxA.join(', ')}}`,`|A×B| = ${A.length}×${B.length} = ${AxB.length} ✓`,`A×B ≠ B×A? ${JSON.stringify(AxB)!==JSON.stringify(BxA)?'YES (different)':'Same here (special case)'}`],
    answer:`A×B = {${AxB.join(', ')}}, |A×B| = ${AxB.length}`,answerLatex:`A\\times B=\\{${AxB.join(',\\;')}\\},\\;|A\\times B|=${AxB.length}`,tip:'Grid method: draw rows for A, columns for B. Each cell = one ordered pair.'};
  },
  rel_def:(n)=>{
    const aSize=srI(n,3,5),bSize=srI(n+1,3,5);
    const A=genNums(n,aSize,1,10),B=genNums(n+20,bSize,1,10);
    const rule=['is less than','is greater than','equals','divides'][n%4];
    const pairs=A.flatMap(a=>B.filter(b=>{
      if(rule==='is less than')return a<b;
      if(rule==='is greater than')return a>b;
      if(rule==='equals')return a===b;
      if(rule==='divides')return b%a===0;
      return false;
    }).map(b=>[a,b]));
    const dom=[...new Set(pairs.map(p=>p[0]))].sort((a,b)=>a-b);
    const ran=[...new Set(pairs.map(p=>p[1]))].sort((a,b)=>a-b);
    return{question:`A = ${setTxt(A)}, B = ${setTxt(B)}. Define relation R: a R b iff "a ${rule} b". Find R, Domain, Range.`,questionLatex:`A=${setStr(A)},\\;B=${setStr(B)}.\\;R=\\{(a,b):a\\text{ ${rule} }b\\}`,
    steps:[`Check each (a,b) pair:`,...A.map(a=>`  a=${a}: pairs with ${B.filter(b=>b%a===0||(rule==='is less than'&&a<b)||(rule==='is greater than'&&a>b)||(rule==='equals'&&a===b)).join(', ')||'none'}`),`R = {${pairs.map(([a,b])=>`(${a},${b})`).join(', ')||'∅'}}`,`Domain = {${dom.join(', ')||'∅'}}  (all first elements used)`,`Range = {${ran.join(', ')||'∅'}}  (all second elements used)`,`Codomain = ${setTxt(B)}  (Range ⊆ Codomain? ${ran.every(r=>B.includes(r))?'YES ✓':'Check!'})`],
    answer:`R has ${pairs.length} pair(s). Dom = ${setTxt(dom)}, Ran = ${setTxt(ran)}`,answerLatex:`|R|=${pairs.length},\\;\\text{Dom}=${setStr(dom)},\\;\\text{Ran}=${setStr(ran)}`,tip:'Domain = first elements of pairs actually used. Range = second elements actually used. Both are subsets of A and B respectively.'};
  },
  rel_types:(n)=>{
    const size=srI(n,3,5);
    const A=genNums(n+1,size,1,10);
    const typeIdx=n%4;
    const typeNames=['Empty','Universal','Identity','Inverse of a given'];
    let R=[],invR=[],desc='';
    if(typeIdx===0){R=[];desc='Empty relation: no pairs at all';}
    else if(typeIdx===1){R=A.flatMap(a=>A.map(b=>[a,b]));desc='Universal relation: contains ALL pairs from A×A';}
    else if(typeIdx===2){R=A.map(a=>[a,a]);desc='Identity: each element maps only to itself';}
    else{const given=A.slice(0,Math.min(3,A.length)).map((a,i)=>[a,A[(i+1)%A.length]]);R=given;invR=given.map(([a,b])=>[b,a]);desc='Inverse relation: swap each ordered pair';}
    return{question:`A = ${setTxt(A)}. Identify and write the ${typeNames[typeIdx]} relation on A.`,questionLatex:`A=${setStr(A)}.\\text{ Write the ${typeNames[typeIdx]} relation.}`,
    steps:[`Type: ${typeNames[typeIdx]}`,desc,...(typeIdx===3?[`Given R = {${R.map(([a,b])=>`(${a},${b})`).join(', ')}}`,`R⁻¹ = swap all pairs = {${invR.map(([a,b])=>`(${a},${b})`).join(', ')}}`]:[`R = {${R.map(([a,b])=>`(${a},${b})`).join(', ')||'∅'}}`]),`|R| = ${typeIdx===3?invR.length:R.length}  (out of |A|² = ${A.length**2} possible pairs)`],
    answer:typeIdx===3?`R⁻¹ = {${invR.map(([a,b])=>`(${a},${b})`).join(', ')}}`:`R = {${R.map(([a,b])=>`(${a},${b})`).join(', ')||'∅'}}`,answerLatex:typeIdx===3?`R^{-1}=\\{${invR.map(([a,b])=>`(${a},${b})`).join(',\\;')}\\}`:`R=\\{${R.map(([a,b])=>`(${a},${b})`).join(',\\;')||'\\phi'}\\}`,tip:'Identity always has exactly n pairs for an n-element set. Universal always has n² pairs.'};
  },
  rel_props:(n)=>{
    const size=srI(n,3,5);
    const A=genNums(n,size,1,8);
    const rules=['≤','=','divides','same parity'];
    const rule=rules[n%rules.length];
    const pairs=A.flatMap(a=>A.filter(b=>{
      if(rule==='≤')return a<=b;
      if(rule==='=')return a===b;
      if(rule==='divides')return b%a===0;
      if(rule==='same parity')return a%2===b%2;
      return false;
    }).map(b=>[a,b]));
    const isRef=A.every(a=>pairs.some(([x,y])=>x===a&&y===a));
    const isSym=pairs.every(([a,b])=>pairs.some(([x,y])=>x===b&&y===a));
    const isTrans=pairs.every(([a,b])=>pairs.filter(([x,y])=>x===b).every(([,c])=>pairs.some(([p,q])=>p===a&&q===c)));
    const isAnti=pairs.every(([a,b])=>!(a!==b&&pairs.some(([x,y])=>x===b&&y===a)));
    return{question:`A = ${setTxt(A)}, R = {(a,b): a ${rule} b}. Determine which properties R satisfies: Reflexive, Symmetric, Transitive, Antisymmetric.`,questionLatex:`A=${setStr(A)},\\;R=\\{(a,b):a\\text{ ${rule} }b\\}`,
    steps:[`R = {${pairs.map(([a,b])=>`(${a},${b})`).join(', ')||'∅'}}`,`Reflexive: Does (a,a)∈R for all a∈A? ${isRef?'YES ✓':'NO ✗ — '+A.filter(a=>!pairs.some(([x,y])=>x===a&&y===a)).join(',')+" not related to themselves"}`,`Symmetric: If (a,b)∈R then (b,a)∈R? ${isSym?'YES ✓':'NO ✗'}`,`Transitive: If (a,b)∈R and (b,c)∈R then (a,c)∈R? ${isTrans?'YES ✓':'NO ✗'}`,`Antisymmetric: If (a,b)∈R and (b,a)∈R then a=b? ${isAnti?'YES ✓':'NO ✗'}`,`Conclusion: R is ${[isRef&&'Reflexive',isSym&&'Symmetric',isTrans&&'Transitive',isAnti&&'Antisymmetric'].filter(Boolean).join(', ')||'none of these'}`],
    answer:`Reflexive:${isRef?'✓':'✗'} Symmetric:${isSym?'✓':'✗'} Transitive:${isTrans?'✓':'✗'} Antisymmetric:${isAnti?'✓':'✗'}`,answerLatex:`\\text{R:}${isRef?'\\checkmark':'\\times'}\\text{Ref},${isSym?'\\checkmark':'\\times'}\\text{Sym},${isTrans?'\\checkmark':'\\times'}\\text{Trans},${isAnti?'\\checkmark':'\\times'}\\text{Anti}`,tip:'Equivalence relations are R+S+T. Partial orders are R+A+T. Check each property carefully with specific counterexamples.'};
  },
  equiv:(n)=>{
    const modN=srI(n,2,6);
    const size=srI(n+1,8,14);
    const A=Array.from({length:size},(_,i)=>i+1);
    const classes={};
    A.forEach(a=>{const cl=((a-1)%modN);if(!classes[cl])classes[cl]=[];classes[cl].push(a);});
    const classArr=Object.values(classes).filter(c=>c.length>0);
    const repA=A[srI(n+2,0,A.length-1)],repB=A[srI(n+3,0,A.length-1)];
    const related=(repA-1)%modN===(repB-1)%modN;
    return{question:`On A = {1, 2, …, ${size}}, define a R b iff a ≡ b (mod ${modN}). (a) Show R is an equivalence relation. (b) Find all equivalence classes. (c) Is ${repA} R ${repB}?`,questionLatex:`a\\equiv b\\pmod{${modN}},\\;A=\\{1,...,${size}\\}.\\text{ Equivalence classes?}`,
    steps:[`Step 1: Verify equivalence relation:`,`  Reflexive: a−a=0, ${modN}∣0 → a≡a ✓`,`  Symmetric: ${modN}∣(a−b) → ${modN}∣(b−a) ✓`,`  Transitive: ${modN}∣(a−b) and ${modN}∣(b−c) → ${modN}∣(a−c) ✓`,`Step 2: Equivalence classes (group by remainder mod ${modN}):`,...classArr.map((cl,i)=>`  [${cl[0]}] = {${cl.join(', ')}} — remainder ${i} mod ${modN}`),`Step 3: Is ${repA} R ${repB}? ${repA} mod ${modN} = ${(repA-1)%modN+1}, ${repB} mod ${modN} = ${(repB-1)%modN+1} → ${related?'SAME remainder, so YES ✓':'DIFFERENT remainders, so NO ✗'}`],
    answer:`${classArr.length} classes: ${classArr.map(c=>`{${c.join(',')}}`).join(', ')}. ${repA} R ${repB}: ${related?'YES':'NO'}`,answerLatex:`${classArr.length}\\text{ classes.}\\;${repA}\\;R\\;${repB}:\\;\\textbf{${related?'YES':'NO'}}`,tip:'For mod n, equivalence classes are {1,1+n,1+2n,…}, {2,2+n,2+2n,…}, etc. Always exactly n classes.'};
  },
  poset:(n)=>{
    const maxN=srI(n,8,16);
    const divPairs=[];
    for(let a=1;a<=maxN;a++)for(let b=a+1;b<=maxN;b++)if(b%a===0)divPairs.push([a,b]);
    const A=genNums(n,srI(n+1,5,8),1,maxN);
    const pairsInA=divPairs.filter(([a,b])=>A.includes(a)&&A.includes(b));
    const reflexive=A.map(a=>[a,a]);
    return{question:`A = ${setTxt(A)}. Define a ≤ b iff a | b (a divides b). (a) Is this a partial order on A? (b) List all comparable pairs. (c) Which elements are maximal?`,questionLatex:`A=${setStr(A)},\\;a\\leq b\\Leftrightarrow a\\mid b.\\text{ Verify partial order.}`,
    steps:[`Reflexive: a|a for all a ✓ (every number divides itself)`,`Antisymmetric: if a|b and b|a then a=b ✓ (for positive integers)`,`Transitive: if a|b and b|c then a|c ✓`,`YES — divisibility is a partial order ✓`,`Comparable pairs (a,b) with a|b and a≠b: ${pairsInA.map(([a,b])=>`(${a},${b})`).join(', ')||'none within A'}`,`Maximal elements (nothing in A is strictly above them): ${A.filter(a=>!pairsInA.some(([x,y])=>x===a&&A.includes(y))).join(', ')}`],
    answer:`Yes, divisibility is a partial order. Maximal: ${A.filter(a=>!pairsInA.some(([x,y])=>x===a)).join(', ')}`,answerLatex:`\\text{Partial order: }\\checkmark.\\;\\text{Maximal: }\\{${A.filter(a=>!pairsInA.some(([x,y])=>x===a)).join(',')}\\}`,tip:'In a Hasse diagram, draw arrows upward only for DIRECT divisibility (no middle element). Remove transitive arrows.'};
  },
  fn_def:(n)=>{
    const size=srI(n,3,5);
    const A=genNums(n,size,1,8);
    const B=genNums(n+10,size+1,1,10);
    // One valid function, one invalid
    const valid=A.map(a=>({a,b:srP(B,a*n+7)}));
    const dupA=A[srI(n+3,0,A.length-2)];
    const invalid=[...valid];
    invalid.push({a:dupA,b:B.find(b=>b!==invalid.find(p=>p.a===dupA)?.b)||B[0]});
    const isValidFn=(pairs)=>{const seen=new Map();for(const{a,b}of pairs){if(seen.has(a)&&seen.get(a)!==b)return{ok:false,bad:a};seen.set(a,b);}for(const a of A)if(!seen.has(a))return{ok:false,missing:a};return{ok:true};};
    const v1=isValidFn(valid),v2=isValidFn(invalid);
    return{question:`A = ${setTxt(A)}, B = ${setTxt(B)}.\nR₁ = {${valid.map(({a,b})=>`(${a},${b})`).join(', ')}}\nR₂ = {${invalid.map(({a,b})=>`(${a},${b})`).join(', ')}}\nWhich is a valid function from A to B? Why?`,questionLatex:`A=${setStr(A)},\\;B=${setStr(B)}.\\text{ Which relation is a function?}`,
    steps:[`Function rule: every element of A has EXACTLY ONE image in B.`,`Check R₁: {${valid.map(({a,b})=>`(${a},${b})`).join(', ')}}`,`  Each element of A appears exactly once as first coordinate? ${v1.ok?'YES ✓':'NO ✗'}`,`Check R₂: {${invalid.map(({a,b})=>`(${a},${b})`).join(', ')}}`,`  ${v2.ok?'Looks valid':'Element '+dupA+' appears more than once → NOT a function ✗'}`,`Total functions from A to B possible: |B|^|A| = ${B.length}^${A.length} = ${B.length**A.length}`],
    answer:`R₁ is a function (${v1.ok?'valid':'invalid'}). R₂ is ${v2.ok?'valid':'NOT a function'}.`,answerLatex:`R_1:\\;\\textbf{${v1.ok?'Function \\checkmark':'Not a function \\times'}},\\;R_2:\\;\\textbf{${v2.ok?'Function \\checkmark':'Not a function \\times'}}`,tip:'Test for function: scan first elements. Any repeat = NOT a function. Any missing element from domain = NOT a function.'};
  },
  fn_types:(n)=>{
    const scenarios=[
      {f:'f(x)=2x',type:'injective',reason:'f(a)=f(b) ⟹ 2a=2b ⟹ a=b ✓',notSurj:'Range={even integers}≠ℤ (odd integers missed)',a:'Injective but NOT surjective (f:ℤ→ℤ)'},
      {f:'f(x)=x²',type:'neither',reason:'f(2)=f(-2)=4 → NOT injective',notSurj:'f(x)≥0 → negative reals not in range',a:'Neither injective nor surjective (f:ℝ→ℝ)'},
      {f:'f(x)=x³',type:'bijective',reason:'f(a)=f(b) ⟹ a³=b³ ⟹ a=b ✓',surj:'∀y∈ℝ, x=y^(1/3) gives f(x)=y ✓',a:'Bijective (f:ℝ→ℝ)'},
      {f:'f(x)=eˣ',type:'injective',reason:'eˣ is strictly increasing → injective ✓',notSurj:'eˣ>0 always → negative reals not in range',a:'Injective but NOT surjective (f:ℝ→ℝ)'},
      {f:'f(x)=|x|',type:'neither',reason:'f(2)=f(-2)=2 → NOT injective',notSurj:'Range=[0,∞)≠ℝ',a:'Neither (f:ℝ→ℝ)'},
    ];
    const s=scenarios[n%scenarios.length];
    const nA=srI(n+1,3,5),nB=srI(n+2,3,6);
    const injCount=nA<=nB?Array.from({length:nA},(_,i)=>nB-i).reduce((p,v)=>p*v,1):0;
    return{question:`For f: ℝ → ℝ defined as ${s.f}: (a) Is it injective? (b) Is it surjective? (c) Is it bijective? Also: count injective functions from a ${nA}-set to a ${nB}-set.`,questionLatex:`f(x)=${s.f.replace('f(x)=','')},\\;f:\\mathbb{R}\\to\\mathbb{R}.\\text{ Classify.}`,
    steps:[`Function: ${s.f}`,`Injectivity: f(a)=f(b) implies a=b?`,`  ${s.reason}`,`  ${s.type==='injective'||s.type==='bijective'?'INJECTIVE ✓':'NOT injective ✗'}`,`Surjectivity: every y in codomain has a preimage?`,`  ${s.notSurj||s.surj||'Check range'}`,`  ${s.type==='bijective'?'SURJECTIVE ✓':'NOT surjective ✗'}`,`Conclusion: ${s.a}`,`Injective functions from ${nA}-set to ${nB}-set: ${nB}P${nA} = ${injCount}`],
    answer:`${s.a}. Injective functions: ${injCount}`,answerLatex:`\\text{${s.a}},\\quad{}^{${nB}}P_{${nA}}=${injCount}`,tip:'Injective: horizontal line hits graph at MOST once. Surjective: horizontal line hits at LEAST once. Use ⁿPᵣ for counting injections.'};
  },
  special_fns:(n)=>{
    const templates=[
      (s)=>{const x=(srI(s,1,9)+srI(s+1,1,9)/10);return{q:`⌊${x.toFixed(1)}⌋ = ?`,steps:[`⌊x⌋ = greatest integer ≤ x`,`⌊${x.toFixed(1)}⌋ = ${Math.floor(x)} (largest integer not exceeding ${x.toFixed(1)})`,`Fractional part {${x.toFixed(1)}} = ${x.toFixed(1)} − ${Math.floor(x)} = ${(x-Math.floor(x)).toFixed(1)}`],ans:`${Math.floor(x)}`,ansL:`\\lfloor${x.toFixed(1)}\\rfloor=${Math.floor(x)}`};},
      (s)=>{const x=-(srI(s,1,9)+srI(s+1,1,9)/10);return{q:`⌊${x.toFixed(1)}⌋ = ? (CAREFUL: negative)`,steps:[`⌊x⌋ = greatest integer ≤ x`,`For negative ${x.toFixed(1)}, we go MORE negative`,`⌊${x.toFixed(1)}⌋ = ${Math.floor(x)} (NOT ${Math.ceil(x)}!)`,`Remember: floor always rounds DOWN on number line`],ans:`${Math.floor(x)}`,ansL:`\\lfloor${x.toFixed(1)}\\rfloor=${Math.floor(x)}`};},
      (s)=>{const a=srI(s,-5,5),b=srI(s+1,1,5);const x=a+b/10;return{q:`sgn(${x.toFixed(1)}) = ?`,steps:[`sgn(x) = 1 if x>0, 0 if x=0, −1 if x<0`,`${x.toFixed(1)} ${x>0?'> 0':'< 0'} → sgn = ${Math.sign(x)}`],ans:`${Math.sign(x)}`,ansL:`\\text{sgn}(${x.toFixed(1)})=${Math.sign(x)}`};},
      (s)=>{const n_=srI(s,2,7);const x=srI(s+1,10,30)+srI(s+2,1,9)/10;return{q:`⌊${x.toFixed(1)}/n⌋ where n=${n_}`,steps:[`x/${n_} = ${(x/n_).toFixed(4)}`,`⌊${(x/n_).toFixed(4)}⌋ = ${Math.floor(x/n_)}`],ans:`${Math.floor(x/n_)}`,ansL:`\\lfloor${x.toFixed(1)}/${n_}\\rfloor=${Math.floor(x/n_)}`};},
      (s)=>{const a=srI(s,1,4),x=srI(s+1,1,5)+srI(s+2,1,9)/10;return{q:`⌊${a}·${x.toFixed(1)}⌋ vs ${a}·⌊${x.toFixed(1)}⌋ — are they equal?`,steps:[`${a}·${x.toFixed(1)} = ${(a*x).toFixed(1)}`,`⌊${a}·${x.toFixed(1)}⌋ = ${Math.floor(a*x)}`,`${a}·⌊${x.toFixed(1)}⌋ = ${a}·${Math.floor(x)} = ${a*Math.floor(x)}`,`Equal? ${Math.floor(a*x)===a*Math.floor(x)?'YES (integer multiple)':'NO — ⌊cx⌋ ≠ c⌊x⌋ in general'}`],ans:`${Math.floor(a*x)} vs ${a*Math.floor(x)} — ${Math.floor(a*x)===a*Math.floor(x)?'equal':'NOT equal'}`,ansL:`\\lfloor${a}\\cdot${x.toFixed(1)}\\rfloor=${Math.floor(a*x)}\\neq ${a}\\cdot\\lfloor${x.toFixed(1)}\\rfloor=${a*Math.floor(x)}`};},
    ];
    const t=templates[n%templates.length](n*13+7);
    return{question:`Evaluate: ${t.q}`,questionLatex:t.q,steps:t.steps,answer:t.ans,answerLatex:t.ansL,tip:'For negative numbers, GIF (floor) always rounds AWAY from zero (more negative). ⌊−2.3⌋ = −3, NOT −2.'};
  },
  composite:(n)=>{
    const fns=[{name:'f(x)=2x+1',fn:x=>2*x+1,tex:'2x+1'},{name:'g(x)=x²',fn:x=>x*x,tex:'x^2'},{name:'h(x)=x−3',fn:x=>x-3,tex:'x-3'},{name:'p(x)=3x',fn:x=>3*x,tex:'3x'}];
    const f=fns[n%fns.length],g=fns[(n+1)%fns.length];
    const xVal=srI(n+2,1,5);
    const gx=g.fn(xVal),fogx=f.fn(gx),gfx=g.fn(f.fn(xVal));
    return{question:`f(x) = ${f.name.replace('f(x)=','')}, g(x) = ${g.name.replace('g(x)=','')}.\n(a) Find (f∘g)(x) and evaluate at x=${xVal}.\n(b) Find (g∘f)(x) and evaluate at x=${xVal}.\n(c) Is f∘g = g∘f?`,questionLatex:`f(x)=${f.tex},\\;g(x)=${g.tex}.\\text{ Find }f\\circ g\\text{ and }g\\circ f.`,
    steps:[`(f∘g)(x) = f(g(x)):`,`  g(x) = ${g.tex}`,`  f(g(x)) = f(${g.tex}) = ${f.tex.replace(/x/g,`(${g.tex})`)}`,`  At x=${xVal}: g(${xVal})=${gx}, f(g(${xVal}))=f(${gx})=${fogx}`,`(g∘f)(x) = g(f(x)):`,`  f(x) = ${f.tex}`,`  g(f(x)) = g(${f.tex}) = ${g.tex.replace(/x/g,`(${f.tex})`)}`,`  At x=${xVal}: f(${xVal})=${f.fn(xVal)}, g(f(${xVal}))=g(${f.fn(xVal)})=${gfx}`,`f∘g = g∘f? (${fogx}) vs (${gfx}) at x=${xVal}: ${fogx===gfx?'Same here, but generally NO':'NO — composition is NOT commutative'}`],
    answer:`(f∘g)(${xVal}) = ${fogx},  (g∘f)(${xVal}) = ${gfx}`,answerLatex:`(f\\circ g)(${xVal})=${fogx},\\;(g\\circ f)(${xVal})=${gfx}`,tip:'Always apply the RIGHTMOST function first. f∘g means: g first, then f. Think of it as a pipeline.'};
  },
  inverse_fn:(n)=>{
    const fns=[{tex:'2x+3',inv:y=>`(${y}-3)/2`,invTex:'\\dfrac{x-3}{2}',check:'f(f⁻¹(x))=(2·((x-3)/2)+3)=x ✓'},{tex:'x^3',inv:y=>`∛${y}`,invTex:'x^{1/3}=\\sqrt[3]{x}',check:'f(f⁻¹(x))=(x^{1/3})³=x ✓'},{tex:'\\frac{x+1}{x-1}',inv:y=>`(${y}+1)/(${y}-1)`,invTex:'\\dfrac{x+1}{x-1}',check:'Involution: f is its own inverse!'},{tex:'e^x',inv:y=>`ln(${y})`,invTex:'\\ln(x)',check:'f(f⁻¹(x))=e^{ln x}=x ✓'}];
    const f=fns[n%fns.length];
    const xVal=srI(n+1,2,6);
    return{question:`f(x) = ${f.tex.replace(/\\/g,'')}. Find f⁻¹(x). Verify f⁻¹(f(${xVal})) = ${xVal}.`,questionLatex:`f(x)=${f.tex}.\\text{ Find }f^{-1}(x).`,
    steps:[`Step 1: Replace f(x) with y: y = ${f.tex}`,`Step 2: Swap x and y: x = ${f.tex.replace(/x/g,'y')}`,`Step 3: Solve for y (= f⁻¹(x))`,`f⁻¹(x) = ${f.invTex}`,`Verification: ${f.check}`,`Domain of f⁻¹ = Range of f`],
    answer:`f⁻¹(x) = ${f.invTex}`,answerLatex:`f^{-1}(x)=${f.invTex}`,tip:'Inverse = swap x and y, then solve for y. Graph of f⁻¹ is the reflection of f in the line y = x.'};
  },
  alg_fns:(n)=>{
    const f_coeffs=[srI(n,1,4),srI(n+1,0,3)];
    const g_coeffs=[srI(n+2,1,3),srI(n+3,1,4)];
    const xVal=srI(n+4,1,5);
    const fx=f_coeffs[0]*xVal+f_coeffs[1],gx=g_coeffs[0]*xVal+g_coeffs[1];
    const f_tex=`${f_coeffs[0]}x${f_coeffs[1]>0?'+'+f_coeffs[1]:f_coeffs[1]===0?'':f_coeffs[1]}`;
    const g_tex=`${g_coeffs[0]}x+${g_coeffs[1]}`;
    return{question:`f(x) = ${f_tex}, g(x) = ${g_tex}. Find (f+g), (f−g), (fg), and (f/g) at x=${xVal}.`,questionLatex:`f(x)=${f_tex},\\;g(x)=${g_tex}.\\text{ Algebra of functions at }x=${xVal}.`,
    steps:[`At x=${xVal}: f(${xVal})=${fx}, g(${xVal})=${gx}`,`(f+g)(x) = f(x)+g(x) = ${f_tex}+${g_tex}`,`  At x=${xVal}: ${fx}+${gx} = ${fx+gx}`,`(f−g)(x) = f(x)−g(x) = ${f_tex}−(${g_tex})`,`  At x=${xVal}: ${fx}−${gx} = ${fx-gx}`,`(fg)(x) = f(x)·g(x), at x=${xVal}: ${fx}·${gx} = ${fx*gx}`,`(f/g)(x) = f(x)/g(x), at x=${xVal}: ${fx}/${gx} = ${(fx/gx).toFixed(4)}`,`Domain of f/g excludes x where g(x)=0: g(x)=0 ⟹ x=${-g_coeffs[1]/g_coeffs[0].toFixed(2)}`],
    answer:`(f+g)(${xVal})=${fx+gx}, (fg)(${xVal})=${fx*gx}, (f/g)(${xVal})=${(fx/gx).toFixed(3)}`,answerLatex:`(f+g)(${xVal})=${fx+gx},\\;(fg)(${xVal})=${fx*gx},\\;(f/g)(${xVal})=${(fx/gx).toFixed(3)}`,tip:'f/g is undefined where g(x) = 0. Always state the domain restriction when dividing functions.'};
  },
  even_odd:(n)=>{
    const fns=[{tex:'f(x)=x^4-3x^2+1',fn:x=>x**4-3*x**2+1,type:'even',why:'f(-x)=(-x)⁴-3(-x)²+1=x⁴-3x²+1=f(x)'},{tex:'f(x)=x^3+2x',fn:x=>x**3+2*x,type:'odd',why:'f(-x)=(-x)³+2(-x)=−x³−2x=−f(x)'},{tex:'f(x)=x^2+x',fn:x=>x**2+x,type:'neither',why:'f(-x)=x²-x ≠ f(x) and ≠ -f(x)'},{tex:'f(x)=\\sin(x)',fn:x=>Math.sin(x),type:'odd',why:'sin(-x) = -sin(x)'},{tex:'f(x)=\\cos(x)',fn:x=>Math.cos(x),type:'even',why:'cos(-x) = cos(x)'},{tex:'f(x)=|x|+1',fn:x=>Math.abs(x)+1,type:'even',why:'|-x|+1=|x|+1=f(x)'}];
    const f=fns[n%fns.length];
    const xTest=srI(n+1,1,4);
    const fx=f.fn(xTest),fnx=f.fn(-xTest);
    return{question:`f(x) = ${f.tex.replace('f(x)=','')}. Determine if f is even, odd, or neither.`,questionLatex:`f(x)=${f.tex.replace('f(x)=','')}.\\text{ Even, odd, or neither?}`,
    steps:[`Test with x = ${xTest}: f(${xTest}) = ${fx.toFixed(4)}`,`Compute f(−${xTest}) = ${fnx.toFixed(4)}`,`Is f(−x) = f(x)? ${Math.abs(fnx-fx)<1e-9?'YES → EVEN':'NO'}`,`Is f(−x) = −f(x)? ${Math.abs(fnx+fx)<1e-9?'YES → ODD':'NO'}`,`General proof: ${f.why}`,`Conclusion: f is ${f.type.toUpperCase()}`],
    answer:`f is ${f.type}`,answerLatex:`f\\text{ is }\\textbf{${f.type}}`,tip:'Always verify algebraically by computing f(−x) and comparing to f(x) and −f(x). Numeric check is only a hint.'};
  },
  periodic:(n)=>{
    const fns=[{tex:'\\sin(x)',T:'2\\pi',Tnum:2*Math.PI,name:'sin'},{tex:'\\cos(2x)',T:'\\pi',Tnum:Math.PI,name:'cos2x'},{tex:'\\tan(x)',T:'\\pi',Tnum:Math.PI,name:'tan'},{tex:'\\{x\\}\\text{ (fractional part)}',T:'1',Tnum:1,name:'frac'},{tex:'|\\sin(x)|',T:'\\pi',Tnum:Math.PI,name:'absSin'}];
    const f=fns[n%fns.length];
    const xTest=(srI(n+1,1,6)*Math.PI/3);
    return{question:`(a) Is f(x) = ${f.tex.replace(/\\/g,'')} periodic? If yes, find its fundamental period T.\n(b) Find ALL periods of f.\n(c) What is f(x + 5T)?`,questionLatex:`f(x)=${f.tex}.\\text{ Fundamental period?}`,
    steps:[`f(x) = ${f.tex}`,`Fundamental period T = ${f.T}`,`Verify: f(x+T) = f(x) for all x ✓`,`All periods: T, 2T, 3T, … (i.e., nT for n∈ℕ)`,`f(x + 5T) = f(x + 5·${f.T}) = f(x)  (since 5T is a multiple of T)`,`f is ${f.name} which has period ${f.T}`],
    answer:`T = ${f.T}, f(x+5T) = f(x)`,answerLatex:`T=${f.T},\\quad f(x+5T)=f(x)`,tip:'To find period of f(kx): divide standard period by k. Period of sin(2x) = 2π/2 = π.'};
  },
  monotonic:(n)=>{
    const intervals=[[-3,3],[0,5],[-5,0],[1,4]],fns=[{tex:'f(x)=2x+1',fn:x=>2*x+1,type:'strictly increasing',why:'f\'(x)=2>0 everywhere'},{tex:'f(x)=−3x+2',fn:x=>-3*x+2,type:'strictly decreasing',why:'f\'(x)=−3<0 everywhere'},{tex:'f(x)=x²',fn:x=>x*x,type:'not monotone on ℝ',why:'decreasing on (-∞,0], increasing on [0,∞)'},{tex:'f(x)=x³',fn:x=>x**3,type:'strictly increasing',why:'f\'(x)=3x²≥0, =0 only at x=0'},{tex:'f(x)=eˣ',fn:x=>Math.exp(x),type:'strictly increasing',why:'f\'(x)=eˣ>0 always'}];
    const f=fns[n%fns.length];
    const [lo,hi]=intervals[n%intervals.length];
    const x1=lo+srI(n+1,0,(hi-lo)/2-1),x2=x1+srI(n+2,1,(hi-lo)/2);
    return{question:`For f(x) = ${f.tex.replace('f(x)=','')}: (a) Is it monotonic? (b) Verify at x₁=${x1} < x₂=${x2}.`,questionLatex:`f(x)=${f.tex.replace('f(x)=','')}.\\text{ Monotonic?}`,
    steps:[`f(x) = ${f.tex}`,`Monotonicity: ${f.type}`,`Reason: ${f.why}`,`Verification at x₁=${x1} < x₂=${x2}:`,`  f(${x1}) = ${f.fn(x1).toFixed(4)}`,`  f(${x2}) = ${f.fn(x2).toFixed(4)}`,`  f(${x1}) ${f.fn(x1)<f.fn(x2)?'<':'>'} f(${x2})  →  ${f.type==='strictly decreasing'?'Decreasing confirmed ✓':'Increasing confirmed ✓'}`],
    answer:`f is ${f.type}`,answerLatex:`f\\text{ is }\\textbf{${f.type}}`,tip:'Strictly monotone ⟹ injective. Use derivative: if f\'(x)>0 everywhere ⟹ increasing; f\'(x)<0 ⟹ decreasing.'};
  },
  cauchy:(n)=>{
    const types=[{eq:'f(x+y)=f(x)+f(y)',name:'Additive',sol:'f(x)=cx',steps:['Set x=y=0: f(0)=f(0)+f(0) ⟹ f(0)=0','Set y=−x: f(0)=f(x)+f(−x) ⟹ f(−x)=−f(x)','By induction over ℕ: f(n)=nf(1)=nc','Extend to ℚ: f(p/q)=cf(1)·p/q','With continuity: f(x)=cx for all x∈ℝ']},{eq:'f(x+y)=f(x)f(y)',name:'Exponential',sol:'f(x)=aˣ (or f≡0)',steps:['Set x=y=0: f(0)=f(0)²⟹f(0)=0 or 1','If f(0)=0: f(x)=f(x+0)=f(x)f(0)=0 (trivial)','If f(0)=1: f(1)=a, by induction f(n)=aⁿ','Extend to ℚ, then ℝ with continuity: f(x)=aˣ']},{eq:'f(xy)=f(x)+f(y)',name:'Logarithmic',sol:'f(x)=c·log(x)',steps:['Set x=y=1: f(1)=2f(1)⟹f(1)=0','Set y=1/x: f(1)=f(x)+f(1/x)⟹f(1/x)=−f(x)','f(xⁿ)=nf(x) by induction','With continuity: f(x)=c·ln(x)']}];
    const t=types[n%types.length];
    const c=srI(n+1,1,5);
    return{question:`Solve the functional equation: ${t.eq} (${t.name} Cauchy equation) over ℝ, assuming continuity.`,questionLatex:`${t.eq}\\quad\\forall x,y\\in\\mathbb{R}`,
    steps:[`Equation type: ${t.name} Cauchy equation`,...t.steps,`General continuous solution: ${t.sol}`,`Example: with c=${c}, f(x) = ${t.sol.replace('c',c).replace('a',c)}`],
    answer:t.sol,answerLatex:`f(x)=${t.sol.replace(/(\w)/,'$1')}`,tip:'The 3 key substitutions: x=y=0 (find f(0)), y=−x (find f(−x)), and y=x (relate f(2x) to f(x)).'};
  },
  fixed_pts:(n)=>{
    const fns=[{tex:'f(x)=x²−x+1',fn:x=>x**2-x+1,fixed:[1],why:'x²−x+1=x ⟹ x²−2x+1=0 ⟹ (x−1)²=0 ⟹ x=1'},{tex:'f(x)=2x−1',fn:x=>2*x-1,fixed:[1],why:'2x−1=x ⟹ x=1'},{tex:'f(x)=x²',fn:x=>x**2,fixed:[0,1],why:'x²=x ⟹ x(x−1)=0 ⟹ x=0 or x=1'},{tex:'f(x)=\\sin(x)',fn:x=>Math.sin(x),fixed:[0],why:'sin(0)=0; only fixed point'},{tex:'f(x)=(x+2)/2',fn:x=>(x+2)/2,fixed:[2],why:'(x+2)/2=x ⟹ x+2=2x ⟹ x=2'}];
    const f=fns[n%fns.length];
    const iterX=srI(n+1,2,5);
    let iter=[iterX];for(let i=0;i<4;i++){try{iter.push(+f.fn(iter[iter.length-1]).toFixed(4));}catch{break;}}
    return{question:`For f(x) = ${f.tex.replace('f(x)=','')}: (a) Find all fixed points. (b) Compute 5 iterates starting at x₀ = ${iterX}. (c) Do iterates converge?`,questionLatex:`f(x)=${f.tex.replace('f(x)=','')}.\\text{ Fixed points and iterates from }x_0=${iterX}.`,
    steps:[`Fixed points: solve f(x) = x`,`${f.why}`,`Fixed point(s): x* = {${f.fixed.join(', ')}}`,`Iterates from x₀ = ${iterX}:`,`  x₀=${iter[0]}, x₁=${iter[1]}, x₂=${iter[2]}, x₃=${iter[3]}, x₄=${iter[4]||'—'}`,`Convergence: ${Math.abs((iter[4]||iter[3])-f.fixed[0])<1?'Converging toward x*='+f.fixed[0]:'Diverging'}`],
    answer:`Fixed pt(s): {${f.fixed.join(', ')}}. Iterates: ${iter.join(' → ')}`,answerLatex:`x^*\\in\\{${f.fixed.join(',')}\\},\\;${iter.slice(0,3).join('\\to')}\\to\\cdots`,tip:'Fixed points: set f(x)=x and solve. Iterates converge to an "attractive" fixed point if |f\'(x*)| < 1.'};
  },
  fn_inequalities:(n)=>{
    const problems=[{ineq:'f(x+y) ≥ f(x)+f(y)',name:'Superadditive',type:'super',eg:'f(x)=x² on [0,∞)',check:'(x+y)²≥x²+y² iff 2xy≥0 ✓ for x,y≥0'},{ineq:'f(x+y) ≤ f(x)+f(y)',name:'Subadditive (Triangle-like)',type:'sub',eg:'f(x)=√x on [0,∞)',check:'√(x+y)≤√x+√y by squaring both sides'},{ineq:"f((x+y)/2) ≤ (f(x)+f(y))/2",name:"Jensen's (convex)",type:'jensen_conv',eg:'f(x)=x² (convex)',check:'((x+y)/2)²≤(x²+y²)/2 iff 0≤(x−y)²/2 ✓'}];
    const p=problems[n%problems.length];
    const x=srI(n+1,1,5),y=srI(n+2,1,5);
    const verif=p.type==='super'?(x+y)**2>=x**2+y**2:p.type==='sub'?Math.sqrt(x+y)<=Math.sqrt(x)+Math.sqrt(y):((x+y)/2)**2<=(x**2+y**2)/2;
    return{question:`Determine if the inequality "${p.ineq}" holds for ${p.eg}. Verify at x=${x}, y=${y}.`,questionLatex:`${p.ineq}\\text{ for }${p.eg}?`,
    steps:[`Inequality type: ${p.name}`,`Function: ${p.eg}`,`General proof: ${p.check}`,`Verify at x=${x}, y=${y}:`,p.type==='super'?`  f(${x+y})=${(x+y)**2} vs f(${x})+f(${y})=${x**2+y**2} → ${(x+y)**2>=(x**2+y**2)?'✓':'✗'}`:p.type==='sub'?`  f(${x+y})=${Math.sqrt(x+y).toFixed(4)} vs f(${x})+f(${y})=${(Math.sqrt(x)+Math.sqrt(y)).toFixed(4)} → ${verif?'✓':'✗'}`:`  f((${x}+${y})/2)=${(((x+y)/2)**2).toFixed(4)} vs (f(${x})+f(${y}))/2=${((x**2+y**2)/2).toFixed(4)} → ${verif?'✓':'✗'}`],
    answer:`${p.name}: ${verif?'Holds ✓':'Fails ✗'} at x=${x}, y=${y}`,answerLatex:`\\text{${p.name}: ${verif?'\\checkmark':'\\times'}}`,tip:"Jensen's inequality: for CONVEX f, the function at the midpoint is below (≤) the midpoint of the function values. Reverse for concave."};
  },
  totient:(n)=>{
    const nums=[6,10,12,15,18,20,24,30,36,42];
    const num=nums[n%nums.length];
    // Factorize
    let m=num,factors=[];
    for(let p=2;p*p<=m;p++){if(m%p===0){let e=0;while(m%p===0){e++;m=Math.floor(m/p);}factors.push({p,e});}}
    if(m>1)factors.push({p:m,e:1});
    const phi=factors.reduce((acc,{p})=>acc*(1-1/p),num)|0;
    const coprimes=Array.from({length:num},(_,i)=>i+1).filter(k=>gcd(k,num)===1);
    const divs=Array.from({length:num},(_,i)=>i+1).filter(k=>num%k===0);
    const dNum=divs.length,sigma=divs.reduce((a,b)=>a+b,0);
    return{question:`For n = ${num}: (a) Find φ(${num}) using the formula. (b) List all coprimes to ${num} in [1,${num}]. (c) Find d(${num}) and σ(${num}).`,questionLatex:`n=${num}.\\text{ Find }\\phi(${num}),\\;d(${num}),\\;\\sigma(${num}).`,
    steps:[`Prime factorization: ${num} = ${factors.map(({p,e})=>e>1?`${p}^${e}`:p).join('×')}`,`φ(${num}) = ${num} × ${factors.map(({p})=>`(1−1/${p})`).join(' × ')}`,`φ(${num}) = ${phi}`,`Coprimes: ${coprimes.join(', ')}  (${coprimes.length} numbers ✓)`,`Divisors of ${num}: ${divs.join(', ')}`,`d(${num}) = ${dNum}  (number of divisors)`,`σ(${num}) = ${divs.join('+')} = ${sigma}  (sum of divisors)`],
    answer:`φ(${num})=${phi}, d(${num})=${dNum}, σ(${num})=${sigma}`,answerLatex:`\\phi(${num})=${phi},\\;d(${num})=${dNum},\\;\\sigma(${num})=${sigma}`,tip:`φ formula: n·∏(1−1/p) for each prime p dividing n. Quick check: φ(p)=p−1 for prime p.`};
  },
  olympiad_rf:(n)=>{
    const problems=[
      (s)=>{const nA=srI(s,2,4),nB=srI(s+1,nA,nA+3);const bij=nA===nB?Array.from({length:nA},(_,i)=>i+1).reduce((a,b)=>a*b,1):0;const inj=nA<=nB?Array.from({length:nA},(_,i)=>nB-i).reduce((p,v)=>p*v,1):0;return{q:`Count: (a) all functions {1..${nA}}→{1..${nB}}, (b) injections, (c) bijections.`,steps:[`Total functions = |B|^|A| = ${nB}^${nA} = ${nB**nA}`,`Injections (1-1): ${nA}≤${nB}? YES. ⁿPᵣ = ${nB}!/(${nB-nA})! = ${inj}`,`Bijections: need |A|=|B|. ${nA===nB?`${nA}! = ${bij}`:'|A|≠|B|, so 0 bijections'}`],ans:`Functions:${nB**nA}, Injections:${inj}, Bijections:${bij}`,ansL:`|B|^{|A|}=${nB**nA},\\;{}^{${nB}}P_{${nA}}=${inj},\\;\\text{Bij}=${bij}`};},
      (s)=>{const a=srI(s,2,5);return{q:`f(f(x)) = x for all x (involution). If f(${a}) = ${a+3}, find f(${a+3}).`,steps:[`f(f(x)) = x means f is its own inverse (involution)`,`Apply: f(f(${a})) = ${a}`,`But f(${a}) = ${a+3}`,`So f(f(${a})) = f(${a+3}) = ${a}`,`f(${a+3}) = ${a} ✓`],ans:`f(${a+3}) = ${a}`,ansL:`f(${a+3})=${a}`};},
      (s)=>{const c=srI(s,1,4);return{q:`f(x+1) = f(x) + 2 for all x, and f(0) = ${c}. Find f(${srI(s+1,3,7)}).`,steps:[`Recurrence: f(x+1) = f(x) + 2`,`f(0) = ${c}`,`f(1) = ${c+2}, f(2) = ${c+4}, f(3) = ${c+6}`,`Pattern: f(n) = ${c} + 2n`,`f(${srI(s+1,3,7)}) = ${c} + 2·${srI(s+1,3,7)} = ${c+2*srI(s+1,3,7)}`],ans:`f(n) = ${c}+2n, f(${srI(s+1,3,7)}) = ${c+2*srI(s+1,3,7)}`,ansL:`f(n)=${c}+2n,\\;f(${srI(s+1,3,7)})=${c+2*srI(s+1,3,7)}`};},
    ];
    const p=problems[n%problems.length](n*17+13);
    return{question:p.q,questionLatex:p.q,steps:p.steps,answer:p.ans,answerLatex:p.ansL,tip:'For functional equations: try x=0, y=0, y=x, y=−x first. Then see if injectivity or surjectivity simplifies things.'};
  },
};
// ── Global Styles ─────────────────────────────────────────────
function useGlobalStyles() {
  useEffect(() => {
    _initKaTeX();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=JetBrains+Mono:wght@400;600&display=swap';
    document.head.appendChild(link);
    const s = document.createElement('style');
    s.textContent = `
      *{box-sizing:border-box;margin:0;padding:0;}
      body{background:#07090f;}
      ::-webkit-scrollbar{width:5px;}
      ::-webkit-scrollbar-track{background:#07090f;}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:4px;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
      @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
      .btn{transition:all 0.2s ease;cursor:pointer;}
      .btn:active{transform:scale(0.97);}
      .katex{color:inherit!important;}
      .katex-display{margin:0!important;}
      .fade-up{animation:fadeUp 0.5s ease both;}
      .fade-in{animation:fadeIn 0.4s ease both;}
    `;
    document.head.appendChild(s);
  }, []);
}

// ── SCREEN 1: Cover ───────────────────────────────────────────
function CoverScreen({ onNext }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [300, 900, 1600].map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => t.forEach(clearTimeout);
  }, []);
  const floaters = ['f(x)','∘','→','R⁻¹','∀','∃','φ(n)','f∘g'];
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', background:'radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.07) 0%, transparent 65%), #07090f', textAlign:'center' }}>
      {floaters.map((s, i) => (
        <div key={s} style={{ position:'fixed', pointerEvents:'none', fontSize:16 + (i%3)*7, color:`rgba(236,72,153,${0.04+(i%4)*0.02})`, top:`${8+i*11}%`, left:i%2===0?`${2+i*4}%`:`${74+i*2}%`, fontFamily:'serif', animation:`pulse ${3+i*0.6}s ease-in-out infinite`, animationDelay:`${i*0.25}s` }}>{s}</div>
      ))}
      <div style={{ opacity:phase>=1?1:0, transform:phase>=1?'translateY(0)':'translateY(12px)', transition:'all 0.6s ease', marginBottom:20, display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'rgba(236,72,153,0.08)', border:'1px solid rgba(236,72,153,0.25)', borderRadius:40 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'#EC4899', animation:'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize:12, color:'#EC4899', letterSpacing:'2px', textTransform:'uppercase', fontFamily:'Crimson Pro, serif' }}>Mathematics · Chapter 2</span>
      </div>
      <div style={{ opacity:phase>=2?1:0, transform:phase>=2?'translateY(0)':'translateY(20px)', transition:'all 0.7s ease 0.1s', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:'clamp(40px, 10vw, 90px)', color:'#fff', letterSpacing:'-3px', lineHeight:0.92, marginBottom:0 }}>
          Relations<br /><span style={{ color:'#EC4899' }}>&amp; Functions</span>
        </h1>
        <div style={{ height:3, width:80, background:'linear-gradient(90deg, #EC4899, transparent)', margin:'16px auto 0', borderRadius:2 }} />
      </div>
      <div style={{ opacity:phase>=3?1:0, transition:'all 0.6s ease', maxWidth:560, marginBottom:40 }}>
        <p style={{ fontFamily:'Crimson Pro, serif', fontSize:19, color:'rgba(255,255,255,0.7)', lineHeight:1.55, marginBottom:18, fontStyle:'italic' }}>
          "A function is a relation where every input has exactly one output — the backbone of all mathematics."
        </p>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 24px', textAlign:'left' }}>
          <div style={{ fontSize:11, color:'#EC4899', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:12, fontFamily:'JetBrains Mono, monospace' }}>Chapter Overview</div>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>
            Starting from Cartesian products and building through relations, properties, equivalence, and partial orders — this chapter systematically develops functions from their definition through types, special forms, composition, inverses, and algebra, culminating in Olympiad-level functional equations, Cauchy's equation, fixed points, and arithmetic functions like Euler's totient.
          </p>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:20 }}>
          {['Class 9 → Olympiad','20 Topics','∞ Practice','RMO · INMO · IMO'].map(t => (
            <span key={t} style={{ padding:'4px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, fontSize:12, color:'rgba(255,255,255,0.5)', fontFamily:'Crimson Pro, serif' }}>{t}</span>
          ))}
        </div>
      </div>
      {phase >= 3 && (
        <button onClick={onNext} className="btn" style={{ padding:'16px 48px', background:'#EC4899', color:'#07090f', border:'none', borderRadius:50, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, letterSpacing:'-0.3px', boxShadow:'0 8px 30px rgba(236,72,153,0.35)', animation:'fadeUp 0.5s ease both' }}>
          Begin Chapter →
        </button>
      )}
    </div>
  );
}

// ── SCREEN 2: Notation Reference ──────────────────────────────
function NotationScreen({ onNext }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setTimeout(() => setRevealed(true), 100); }, []);
  const groups = [
    { title:'Relations & Cartesian Product', color:'#4ECDC4', rows:NOTATION.slice(0,8) },
    { title:'Functions — Core Concepts', color:'#EC4899', rows:NOTATION.slice(8,14) },
    { title:'Special Functions', color:'#F97316', rows:NOTATION.slice(14,18) },
    { title:'Function Properties', color:'#A78BFA', rows:NOTATION.slice(18,22) },
    { title:'Olympiad & Number Theory', color:'#FCD34D', rows:NOTATION.slice(22) },
  ];
  return (
    <div style={{ minHeight:'100vh', background:'#07090f', padding:'32px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:32, opacity:revealed?1:0, transition:'opacity 0.5s ease' }}>
          <div style={{ fontSize:11, color:'#EC4899', textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Before We Begin</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:34, color:'#fff', letterSpacing:'-1px', marginBottom:10 }}>Notation Guide</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>
            Master these symbols first. They are the precise language of relations and functions — used from Class 9 through IMO-level problems.
          </p>
        </div>
        {groups.map((g, gi) => (
          <div key={g.title} style={{ marginBottom:24, opacity:revealed?1:0, transform:revealed?'translateY(0)':'translateY(16px)', transition:`all 0.5s ease ${gi*0.1+0.2}s` }}>
            <div style={{ fontSize:11, color:g.color, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:20, height:2, background:g.color, borderRadius:1 }} />
              {g.title}
            </div>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
              {g.rows.map((row, ri) => (
                <div key={ri} style={{ display:'grid', gridTemplateColumns:'100px 1fr 1fr', gap:0, borderBottom:ri<g.rows.length-1?'1px solid rgba(255,255,255,0.05)':'none', padding:'11px 16px', alignItems:'center' }}>
                  <div style={{ fontFamily:'serif', fontSize:16, color:g.color, overflowX:'auto' }}><KTex l={row.sym} /></div>
                  <div>
                    <div style={{ fontFamily:'Crimson Pro, serif', fontWeight:600, fontSize:13, color:'#fff', marginBottom:2 }}>{row.name}</div>
                    <div style={{ fontFamily:'Crimson Pro, serif', fontSize:12, color:'rgba(255,255,255,0.4)', fontStyle:'italic' }}>{row.meaning}</div>
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'JetBrains Mono,monospace', paddingLeft:8, overflowX:'auto' }}>
                    <KTex l={row.ex} style={{ fontSize:11 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ background:'linear-gradient(135deg,rgba(236,72,153,0.08),rgba(236,72,153,0.03))', border:'1px solid rgba(236,72,153,0.2)', borderRadius:14, padding:'18px 20px', marginBottom:32 }}>
          <div style={{ fontSize:11, color:'#EC4899', textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:12 }}>Quick Memory Aid</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:8 }}>
            {[['f ∘ g','apply g first, then f'],['f⁻¹','undo f (needs bijective)'],['Dom','valid inputs'],['Ran','actual outputs used'],['⌊x⌋','round DOWN always'],['φ(n)','coprimes ≤ n']].map(([sym,hint])=>(
              <div key={sym} style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'#EC4899', minWidth:70 }}>{sym}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontFamily:'Crimson Pro,serif', fontStyle:'italic' }}>{hint}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onNext} className="btn" style={{ width:'100%', padding:'16px', background:'#EC4899', color:'#07090f', border:'none', borderRadius:12, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:'0 6px 24px rgba(236,72,153,0.3)' }}>
          Start Learning →
        </button>
      </div>
    </div>
  );
}

// ── SCREEN 3: Section Menu ────────────────────────────────────
function SectionMenuScreen({ onSelect, completedIds }) {
  const levels = ['Beginner','Intermediate','Olympiad'];
  const lColors = { Beginner:'#4ECDC4', Intermediate:'#F59E0B', Olympiad:'#C084FC' };
  const lDesc = { Beginner:'Class 9–10 · Foundational concepts', Intermediate:'Class 11–12 · CBSE/JEE level', Olympiad:'RMO · INMO · IMO · Putnam' };
  return (
    <div style={{ minHeight:'100vh', background:'#07090f', padding:'28px 16px 60px' }}>
      <div style={{ maxWidth:660, margin:'0 auto' }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, color:'#EC4899', textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>Chapter · Relations &amp; Functions</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:30, color:'#fff', letterSpacing:'-0.8px', marginBottom:6 }}>Choose a Topic</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:15, color:'rgba(255,255,255,0.4)' }}>Follow in order for best understanding — each topic builds on the previous.</p>
        </div>
        {levels.map(level => (
          <div key={level} style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:lColors[level] }} />
              <span style={{ fontSize:13, color:lColors[level], fontWeight:600, fontFamily:'Crimson Pro, serif', textTransform:'uppercase', letterSpacing:'1px' }}>{level}</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:'Crimson Pro, serif' }}>— {lDesc[level]}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {SECTIONS.filter(s => s.level === level).map(sec => {
                const done = completedIds.has(sec.id);
                return (
                  <button key={sec.id} onClick={() => onSelect(sec)} className="btn"
                    style={{ background:done?`${lColors[level]}10`:'rgba(255,255,255,0.025)', border:`1px solid ${done?lColors[level]+'44':'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'14px 18px', textAlign:'left', display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${lColors[level]}15`, border:`1px solid ${lColors[level]}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:lColors[level], fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>
                      {done ? '✓' : sec.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:15, color:done?lColors[level]:'#fff', marginBottom:2 }}>{sec.title}</div>
                      <div style={{ fontFamily:'Crimson Pro, serif', fontSize:13, color:'rgba(255,255,255,0.4)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sec.shortDef}</div>
                    </div>
                    <div style={{ fontSize:16, color:'rgba(255,255,255,0.2)', flexShrink:0 }}>→</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SCREEN 4: Learn ───────────────────────────────────────────
function SectionLearnScreen({ section, onPractice, onBack }) {
  const [tab, setTab] = useState('learn');
  const lColors = { Beginner:'#4ECDC4', Intermediate:'#F59E0B', Olympiad:'#C084FC' };
  const col = lColors[section.level] || '#EC4899';

  // Decide which diagram to show
  const showArrow = ['fn_def','fn_types','rel_def'].includes(section.id);
  const showGraph = ['special_fns','even_odd','periodic','monotonic','composite','inverse_fn'].includes(section.id);

  const arrowConfigs = {
    fn_def:{ A:['1','2','3'], B:['a','b','c','d'], pairs:[[0,0],[1,2],[2,1]], title:'Valid function: each input → exactly one output' },
    fn_types:{ A:['1','2','3'], B:['a','b','c'], pairs:[[0,0],[1,1],[2,2]], title:'Bijective: one-to-one & onto' },
    rel_def:{ A:['a','b','c'], B:['x','y','z'], pairs:[[0,0],[0,1],[1,2],[2,1]], title:'Relation: multiple pairs allowed' },
  };
  const graphConfigs = {
    special_fns:{ fn: x => Math.floor(x), label:'y = ⌊x⌋  (Greatest Integer Function)', color:'#F97316' },
    even_odd:{ fn: x => x*x, label:'y = x²  (Even function — symmetric y-axis)', color:'#C084FC' },
    periodic:{ fn: x => Math.sin(x), label:'y = sin(x)  (Period = 2π)', color:'#34D399' },
    monotonic:{ fn: x => Math.exp(x*0.5), label:'y = e^(x/2)  (Strictly increasing)', color:'#4ECDC4' },
    composite:{ fn: x => Math.sin(x*x*0.3), label:'y = sin(x²·0.3)  (composite)', color:'#EC4899' },
    inverse_fn:{ fn: x => x*x*x, label:'y = x³ and its inverse y = ∛x', color:'#FCD34D' },
  };

  return (
    <div style={{ minHeight:'100vh', background:'#07090f', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(7,9,15,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>← Back</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:15, color:'#fff' }}>{section.title}</div>
          <div style={{ fontSize:11, color:col, fontFamily:'JetBrains Mono,monospace' }}>{section.level}</div>
        </div>
      </div>
      <div style={{ maxWidth:660, margin:'0 auto', padding:'24px 16px' }}>
        <div style={{ display:'flex', gap:4, marginBottom:24, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4 }}>
          {['learn','keys'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn"
              style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:tab===t?col:'transparent', color:tab===t?'#07090f':'rgba(255,255,255,0.5)', fontFamily:'Crimson Pro, serif', fontWeight:600, fontSize:14 }}>
              {t==='learn'?'📖 Explanation':'🔑 Key Facts'}
            </button>
          ))}
        </div>
        {tab === 'learn' && (
          <div className="fade-in">
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:22 }}>
              <div style={{ width:56, height:56, borderRadius:14, background:`${col}15`, border:`1px solid ${col}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:col, fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>{section.icon}</div>
              <p style={{ fontFamily:'Playfair Display, serif', fontSize:18, color:'#fff', fontStyle:'italic', lineHeight:1.5 }}>"{section.shortDef}"</p>
            </div>
            {showArrow && arrowConfigs[section.id] && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16 }}>
                <ArrowDiagram {...arrowConfigs[section.id]} colorA={col} colorB="#EC4899" />
              </div>
            )}
            {showGraph && graphConfigs[section.id] && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'12px 16px' }}>
                <FnGraph fn={graphConfigs[section.id].fn} color={graphConfigs[section.id].color} label={graphConfigs[section.id].label} />
              </div>
            )}
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontSize:10, color:col, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Full Explanation</div>
              <p style={{ fontFamily:'Crimson Pro, serif', fontSize:17, color:'rgba(255,255,255,0.75)', lineHeight:1.8 }}>{section.fullDef}</p>
            </div>
          </div>
        )}
        {tab === 'keys' && (
          <div className="fade-in">
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:14 }}>Key Results & Formulas</div>
            {section.keyFacts.map((fact, i) => (
              <div key={i} style={{ display:'flex', gap:12, marginBottom:14, alignItems:'flex-start', animation:`fadeUp 0.4s ease ${i*0.07}s both` }}>
                <div style={{ width:26, height:26, borderRadius:8, background:`${col}18`, border:`1px solid ${col}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:col, fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Crimson Pro, serif', fontSize:14, color:'rgba(255,255,255,0.55)', marginBottom:4 }}>{fact.text}</div>
                  <div style={{ background:`${col}0d`, border:`1px solid ${col}22`, borderRadius:8, padding:'8px 12px', overflowX:'auto' }}>
                    <KTex l={fact.l} style={{ color:col, fontSize:15 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop:32, position:'sticky', bottom:24 }}>
          <button onClick={onPractice} className="btn" style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${col},${col}cc)`, color:'#07090f', border:'none', borderRadius:12, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${col}40` }}>
            ⚡ Practice Questions →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SCREEN 5: Practice ────────────────────────────────────────
function PracticeScreen({ section, onBack, onDone }) {
  const [qIdx, setQIdx] = useState(0);
  const [baseSeed] = useState(() => Math.floor(Math.random() * 9999));
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [count, setCount] = useState(0);
  const lColors = { Beginner:'#4ECDC4', Intermediate:'#F59E0B', Olympiad:'#C084FC' };
  const col = lColors[section.level] || '#EC4899';
  const gen = GENERATORS[section.genKey] || GENERATORS.cartesian;
  const seed = baseSeed + qIdx * 97;
  const question = useCallback(() => { try { return gen(seed); } catch { return { question:'Loading…', steps:[], answer:'—', answerLatex:'—', tip:'' }; } }, [seed])();
  const next = () => { setQIdx(i => i+1); setShowAnswer(false); setShowSteps(false); setCount(c => c+1); };
  return (
    <div style={{ minHeight:'100vh', background:'#07090f', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(7,9,15,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>← Learn</button>
          <div style={{ flex:1, fontFamily:'Playfair Display, serif', fontSize:14, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{section.title}</div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, color:col, background:`${col}15`, padding:'4px 10px', borderRadius:20, flexShrink:0 }}>Q {count+1}</div>
          <button onClick={onDone} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13, flexShrink:0 }}>Done ✓</button>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'Crimson Pro,serif', fontStyle:'italic' }}>Infinite practice · Every question uniquely generated</div>
      </div>
      <div style={{ maxWidth:660, margin:'0 auto', padding:'24px 16px' }}>
        <div key={qIdx} className="fade-up" style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${col}30`, borderRadius:16, overflow:'hidden', marginBottom:18 }}>
          <div style={{ background:`${col}10`, borderBottom:`1px solid ${col}20`, padding:'10px 18px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:col, animation:'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize:11, color:col, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace' }}>Question {count+1} · {section.level}</span>
          </div>
          <div style={{ padding:'20px 20px 22px' }}>
            <p style={{ fontFamily:'Crimson Pro, serif', fontSize:17, color:'#e2e8f0', lineHeight:1.75, marginBottom:12, whiteSpace:'pre-wrap' }}>{question.question}</p>
            {question.questionLatex && (
              <div style={{ background:`${col}0d`, border:`1px solid ${col}20`, borderRadius:10, padding:'12px 16px', overflowX:'auto' }}>
                <KTex l={question.questionLatex} style={{ color:col, fontSize:15 }} />
              </div>
            )}
          </div>
        </div>
        {!showAnswer && (
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <button onClick={() => setShowSteps(v => !v)} className="btn"
              style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.7)', fontFamily:'Crimson Pro,serif', fontSize:15 }}>
              {showSteps ? '🙈 Hide Steps' : '💡 Show Steps'}
            </button>
            <button onClick={() => setShowAnswer(true)} className="btn"
              style={{ flex:1, padding:'12px', background:`${col}20`, border:`1px solid ${col}44`, borderRadius:10, color:col, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:15 }}>
              Reveal Answer ▶
            </button>
          </div>
        )}
        {showSteps && !showAnswer && (
          <div className="fade-up" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.2px', fontFamily:'JetBrains Mono,monospace', marginBottom:12 }}>Step-by-Step Approach</div>
            {question.steps.map((step, i) => (
              <div key={i} style={{ display:'flex', gap:10, marginBottom:i<question.steps.length-1?10:0, animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
                <span style={{ color:`${col}77`, fontSize:11, fontFamily:'JetBrains Mono,monospace', minWidth:20, paddingTop:2 }}>{i+1}.</span>
                <span style={{ fontFamily:'Crimson Pro,serif', fontSize:15, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{step}</span>
              </div>
            ))}
          </div>
        )}
        {showAnswer && (
          <div className="fade-up">
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.2px', fontFamily:'JetBrains Mono,monospace', marginBottom:12 }}>Solution</div>
              {question.steps.map((step, i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:i<question.steps.length-1?10:0, animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
                  <span style={{ color:`${col}77`, fontSize:11, fontFamily:'JetBrains Mono,monospace', minWidth:20, paddingTop:2 }}>{i+1}.</span>
                  <span style={{ fontFamily:'Crimson Pro,serif', fontSize:15, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{ background:`linear-gradient(135deg,${col}18,${col}08)`, border:`1px solid ${col}44`, borderRadius:14, padding:'16px 20px', marginBottom:14, textAlign:'center' }}>
              <div style={{ fontSize:10, color:`${col}99`, textTransform:'uppercase', letterSpacing:'1.2px', fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>Answer</div>
              <div style={{ overflowX:'auto', padding:'4px 0' }}>
                <KTex l={question.answerLatex || question.answer} style={{ color:col, fontSize:16 }} />
              </div>
            </div>
            {question.tip && (
              <div style={{ background:'rgba(255,209,102,0.06)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:10, alignItems:'flex-start' }}>
                <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
                <p style={{ fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:14, color:'rgba(255,209,102,0.85)', lineHeight:1.6 }}>{question.tip}</p>
              </div>
            )}
            <button onClick={next} className="btn" style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${col},${col}cc)`, color:'#07090f', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${col}40` }}>
              Next Question ⟶
            </button>
            <p style={{ textAlign:'center', marginTop:10, fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:13, color:'rgba(255,255,255,0.25)' }}>
              Questions are procedurally generated — they never repeat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  useGlobalStyles();
  const [screen, setScreen] = useState('cover');
  const [activeSection, setActiveSection] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const markDone = id => setCompletedIds(prev => new Set([...prev, id]));
  if (screen === 'cover')    return <CoverScreen onNext={() => setScreen('notation')} />;
  if (screen === 'notation') return <NotationScreen onNext={() => setScreen('menu')} />;
  if (screen === 'menu')     return <SectionMenuScreen completedIds={completedIds} onSelect={sec => { setActiveSection(sec); setScreen('learn'); }} />;
  if (screen === 'learn' && activeSection)    return <SectionLearnScreen section={activeSection} onBack={() => setScreen('menu')} onPractice={() => setScreen('practice')} />;
  if (screen === 'practice' && activeSection) return <PracticeScreen section={activeSection} onBack={() => setScreen('learn')} onDone={() => { markDone(activeSection.id); setScreen('menu'); }} />;
  return <CoverScreen onNext={() => setScreen('notation')} />;
}

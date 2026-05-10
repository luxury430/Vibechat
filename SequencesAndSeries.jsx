import { useState, useEffect, useRef, useCallback } from "react";

// ── KaTeX CDN loader ──────────────────────────────────────────
let _kDone = false; const _kCbs = [];
function _initKaTeX() {
  if (_kDone || window.katex || document.querySelector('[data-kx]')) return;
  const l = document.createElement('link'); l.rel='stylesheet'; l.setAttribute('data-kx','1');
  l.href='https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
  document.head.appendChild(l);
  const s = document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
  s.onload=()=>{ _kDone=true; _kCbs.forEach(f=>f()); _kCbs.length=0; };
  document.head.appendChild(s);
}
function onKaTeX(cb) { (_kDone||window.katex)?cb():_kCbs.push(cb); }

// ── Helpers ───────────────────────────────────────────────────
const sr  = n => Math.abs(Math.sin(n*127.1+311.7)*43758.5453)%1;
const srI = (n,lo,hi) => Math.floor(sr(n)*(hi-lo+1))+lo;
const srP = (arr,n) => arr[Math.floor(sr(n)*arr.length)];
const fmt = (n,d=4) => Number.isFinite(n)?(+n.toFixed(d)===0?'0':n.toFixed(d)):'—';
const ACCENT = '#F59E0B';  // Amber accent for Sequences & Series

function fact(n){if(n<=1)return 1;let r=1;for(let i=2;i<=n;i++)r*=i;return r;}
function C(n,r){if(r<0||r>n)return 0;return Math.round(fact(n)/(fact(r)*fact(n-r)));}
function gcd(a,b){return b===0?Math.abs(a):gcd(b,a%b);}
function shuffle(arr,seed){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(sr(seed*i+i)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

// ── KaTeX Renderer ─────────────────────────────────────────────
function KTex({ l, block=false, style={} }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(!!window.katex);
  useEffect(()=>{ if(!ready) onKaTeX(()=>setReady(true)); },[]);
  useEffect(()=>{
    if(ready&&ref.current&&l){
      try{ window.katex.render(l,ref.current,{throwOnError:false,displayMode:block,strict:false}); }
      catch{ if(ref.current) ref.current.textContent=l; }
    }
  },[ready,l,block]);
  if(!ready) return <span style={{fontFamily:'monospace',opacity:0.8,...style}}>{l}</span>;
  return <span ref={ref} style={style}/>;
}

// ── SVG Diagrams for Sequences & Series ───────────────────────
function SequencePlotSVG({ color=ACCENT, size=300, type='ap' }) {
  const W=size, H=size*0.65;
  const ox=40, oy=H-20, maxX=W-20, maxY=20;
  const nPts = 5;
  const pts = [];
  for (let i=0; i<nPts; i++) {
    const x = ox + (i+1)*(maxX-ox)/(nPts+1);
    let y;
    if (type==='ap') y = oy - (1 + i*2) * 15;
    else y = oy - Math.pow(2,i) * 10;
    pts.push({x, y});
  }
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto'}}>
      <line x1={ox} y1={oy} x2={maxX} y2={oy} stroke={`${color}66`} strokeWidth={1.2}/>
      <line x1={ox} y1={oy} x2={ox} y2={maxY} stroke={`${color}66`} strokeWidth={1.2}/>
      <text x={maxX+4} y={oy+4} fill={color} fontSize={11} fontFamily="JetBrains Mono">n</text>
      <text x={ox-12} y={maxY-6} fill={color} fontSize={11} fontFamily="JetBrains Mono">aₙ</text>
      {pts.map((p,i)=>(
        i>0 && <line key={'l'+i} x1={pts[i-1].x} y1={pts[i-1].y} x2={p.x} y2={p.y} stroke={color} strokeWidth={1.5}/>
      ))}
      {pts.map((p,i)=>(
        <circle key={'c'+i} cx={p.x} cy={p.y} r={3} fill={color} stroke="#fff" strokeWidth={1}/>
      ))}
    </svg>
  );
}

function BarChartSVG({ data=[], color=ACCENT, size=300, title='' }) {
  const W=size, H=size*0.6, padL=30, padB=28, padT=16, padR=10;
  const gW=W-padL-padR, gH=H-padB-padT;
  const maxV=Math.max(...data.map(d=>d.v),0.001);
  return (
    <svg width={W} height={H+20} style={{display:'block',margin:'0 auto'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      <line x1={padL} y1={padT} x2={padL} y2={H-padB} stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
      {data.map((d,i)=>{
        const bW=gW/data.length*0.7, bX=padL+gW*i/data.length+gW/data.length*0.15;
        const bH=gH*(d.v/maxV), bY=padT+gH-bH;
        return(<g key={i}>
          <rect x={bX} y={bY} width={bW} height={bH} rx={3} fill={`${color}66`} stroke={color} strokeWidth={1}/>
          <text x={bX+bW/2} y={H-padB+12} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9} fontFamily="JetBrains Mono,monospace">{d.l}</text>
          <text x={bX+bW/2} y={bY-3} textAnchor="middle" fill={color} fontSize={9} fontFamily="JetBrains Mono,monospace">{fmt(d.v,2)}</text>
        </g>);
      })}
      {title&&<text x={W/2} y={H+16} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={10} fontFamily="Crimson Pro,serif" fontStyle="italic">{title}</text>}
    </svg>
  );
}

function ConvergenceSVG({ color=ACCENT, size=300 }) {
  const W=size, H=size*0.65;
  const ox=40, oy=H-20, maxX=W-20, maxY=20;
  const L = oy - 80;
  const pts = [];
  for (let n=1; n<=10; n++) {
    const x = ox + n*(maxX-ox)/12;
    const y = L + 80/n;
    pts.push({x, y: Math.min(y, oy-5)});
  }
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto'}}>
      <line x1={ox} y1={oy} x2={maxX} y2={oy} stroke={`${color}66`} strokeWidth={1}/>
      <line x1={ox} y1={oy} x2={ox} y2={maxY} stroke={`${color}66`} strokeWidth={1}/>
      <text x={maxX+4} y={oy+4} fill={color} fontSize={11} fontFamily="JetBrains Mono">n</text>
      <text x={ox-12} y={maxY-6} fill={color} fontSize={11} fontFamily="JetBrains Mono">aₙ</text>
      <line x1={ox} y1={L} x2={maxX} y2={L} stroke="#fff" strokeWidth={1} strokeDasharray="4,3"/>
      <text x={ox+5} y={L-8} fill="#fff" fontSize={10} fontFamily="JetBrains Mono">L</text>
      {pts.map((p,i)=>(
        i>0 && <line key={'l'+i} x1={pts[i-1].x} y1={pts[i-1].y} x2={p.x} y2={p.y} stroke={color} strokeWidth={1.5}/>
      ))}
      {pts.map((p,i)=>(
        <circle key={'c'+i} cx={p.x} cy={p.y} r={3} fill={color} stroke="#fff" strokeWidth={1}/>
      ))}
    </svg>
  );
}

// ── Notation Table ─────────────────────────────────────────────
const NOTATION = [
  { sym:'a_n', name:'n-th term', meaning:'General term of a sequence', ex:'a_n = 2n+1\\text{ for odd numbers}' },
  { sym:'S_n', name:'Sum of first n terms', meaning:'Partial sum of a series', ex:'S_n = a_1 + a_2 + \\cdots + a_n' },
  { sym:'d', name:'Common difference (AP)', meaning:'Difference between consecutive terms', ex:'a, a+d, a+2d, \\dots' },
  { sym:'r', name:'Common ratio (GP)', meaning:'Ratio between consecutive terms', ex:'a, ar, ar^2, \\dots' },
  { sym:'\\sum_{k=1}^{n} a_k', name:'Sigma notation', meaning:'Sum of terms from k=1 to n', ex:'\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}' },
  { sym:'AM = \\frac{a+b}{2}', name:'Arithmetic Mean', meaning:'Average of two numbers', ex:'AM of 2 and 8 is 5' },
  { sym:'GM = \\sqrt{ab}', name:'Geometric Mean', meaning:'Square root of product', ex:'GM of 2 and 8 is 4' },
  { sym:'HM = \\frac{2ab}{a+b}', name:'Harmonic Mean', meaning:'Reciprocal of average of reciprocals', ex:'HM of 2 and 8 is 3.2' },
  { sym:'AGP', name:'Arithmetico-Geometric Progression', meaning:'Term = (AP term)×(GP term)', ex:'1·2 + 2·2² + 3·2³ + …' },
  { sym:'\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}', name:'Sum of squares', meaning:'Formula for Σk²', ex:'1²+2²+3²+4² = 30' },
  { sym:'\\sum_{k=1}^{n} k^3 = \\left[\\frac{n(n+1)}{2}\\right]^2', name:'Sum of cubes', meaning:'Formula for Σk³', ex:'1³+2³+3³ = 36' },
  { sym:'V_n - V_{n-1}', name:'Method of differences', meaning:'Telescoping cancellation', ex:'\\frac{1}{n(n+1)} = \\frac{1}{n} - \\frac{1}{n+1}' },
  { sym:'a_n = c_1 a_{n-1} + c_2 a_{n-2} + f(n)', name:'Non-homogeneous linear recurrence', meaning:'Recurrence with forcing term', ex:'a_n = 2a_{n-1} + n' },
  { sym:'\\phi = \\frac{1+\\sqrt5}{2}', name:'Golden ratio (Binet form)', meaning:'Closed form for Fibonacci', ex:'F_n = \\frac{\\phi^n - \\psi^n}{\\sqrt5}' },
  { sym:'G(x) = \\sum a_n x^n', name:'Ordinary Generating Function (OGF)', meaning:'Power series encoding sequence', ex:'G(x)=\\frac{1}{1-x-x^2}\\text{ for Fibonacci}' },
  { sym:'E(x) = \\sum \\frac{a_n}{n!} x^n', name:'Exponential Generating Function (EGF)', meaning:'Generates permutations / factorials', ex:'E(x)=e^x\\text{ for }a_n=1' },
  { sym:'a_n \\equiv b_n \\pmod m', name:'Modular sequence', meaning:'Congruence relation for terms', ex:'Fibonacci mod 5: 0,1,1,2,3,0,..., period 20' },
  { sym:'v_p(n)', name:'p-adic valuation', meaning:'Highest power of prime p dividing n', ex:'v_2(12)=2' },
  { sym:'\\sum_{k=1}^{n} a_k b_k', name:'Abel summation', meaning:'Discrete integration by parts', ex:'\\sum a_k(b_{k+1}-b_k) = a_n b_{n+1} - a_1 b_1 - \\sum (a_{k+1}-a_k) b_{k+1}' },
  { sym:'\\lim_{n\\to\\infty} a_n = L', name:'Limit of a sequence', meaning:'Formal definition: ∀ ε>0 ∃ N s.t. |a_n–L|<ε ∀n≥N', ex:'\\lim\\frac{n}{n+1}=1' },
  { sym:'\\Delta a_n = a_{n+1} - a_n', name:'Forward difference', meaning:'Discrete derivative', ex:'\\Delta n^2 = 2n+1' },
];

// ── Sections ───────────────────────────────────────────────────
const SECTIONS = [
  // Foundation
  {
    id:'ap', title:'Arithmetic Progression (AP)', level:'Foundation', color:'#F59E0B', icon:'AP',
    shortDef:'Sequence with constant difference d; nth term: a+(n-1)d; sum: n/2 [2a+(n-1)d].',
    fullDef:"An arithmetic progression (AP) is a sequence where the difference between any two successive terms is constant, denoted by d. The nth term is a_n = a + (n-1)d, where a is the first term. The sum of the first n terms is S_n = n/2 * [2a + (n-1)d] = n/2 * (a + l), where l = a_n is the last term. These formulas form the foundation for many pattern-based problems.",
    keyFacts:[
      {text:'nth term', l:'a_n = a + (n-1)d'},
      {text:'Sum of n terms (first/last)', l:'S_n = \\frac{n}{2}(a + l)'},
      {text:'Sum using d', l:'S_n = \\frac{n}{2}[2a + (n-1)d]'},
      {text:'Common difference from terms', l:'d = a_{k+1} - a_k'},
      {text:'Average of AP', l:'\\text{Mean of first }n\\text{ terms} = \\frac{S_n}{n} = \\frac{a+l}{2}'},
    ], genKey:'ap', diagram:'sequenceplot',
  },
  {
    id:'gp', title:'Geometric Progression (GP)', level:'Foundation', color:'#F59E0B', icon:'GP',
    shortDef:'Constant ratio r; nth term: ar^{n-1}; sum: a(r^n-1)/(r-1) (r≠1), infinite sum a/(1-r) (|r|<1).',
    fullDef:"A geometric progression (GP) has a constant ratio r between consecutive terms. The nth term is a_n = a r^{n-1}. The sum of the first n terms is S_n = a (r^n-1)/(r-1) for r ≠ 1. When |r| < 1, the infinite geometric series converges to S_∞ = a/(1-r). These formulas appear in compound interest, population growth, and fractals.",
    keyFacts:[
      {text:'nth term', l:'a_n = a \\cdot r^{n-1}'},
      {text:'Sum of n terms (finite)', l:'S_n = a\\frac{r^n-1}{r-1} = a\\frac{1-r^n}{1-r}'},
      {text:'Infinite sum (|r|<1)', l:'S_\\infty = \\frac{a}{1-r}'},
      {text:'Common ratio', l:'r = \\frac{a_{k+1}}{a_k}'},
      {text:'Product of first n terms', l:'P_n = a^n \\cdot r^{n(n-1)/2}'},
    ], genKey:'gp', diagram:'sequenceplot',
  },
  {
    id:'hp_means', title:'Harmonic Progression & Means', level:'Foundation', color:'#F59E0B', icon:'HP',
    shortDef:'Reciprocals of AP terms. AM = (a+b)/2, GM = √(ab), HM = 2ab/(a+b); relation AM ≥ GM ≥ HM.',
    fullDef:"A harmonic progression (HP) is a sequence whose reciprocals form an AP. The harmonic mean (HM) of two numbers a and b is 2ab/(a+b). The three classical means satisfy AM ≥ GM ≥ HM for positive a,b. The AM is the average, GM the square root of product, and HM relates to rates. These inequalities are fundamental in optimization problems.",
    keyFacts:[
      {text:'HP definition', l:'\\frac{1}{a_1}, \\frac{1}{a_2}, \\dots \\text{ form AP}'},
      {text:'Arithmetic Mean', l:'AM = \\frac{a+b}{2}'},
      {text:'Geometric Mean', l:'GM = \\sqrt{ab}'},
      {text:'Harmonic Mean', l:'HM = \\frac{2ab}{a+b}'},
      {text:'Inequality', l:'AM \\ge GM \\ge HM\\;(a,b>0)'},
    ], genKey:'hp_means', diagram:'bar',
  },
  // Core
  {
    id:'agp', title:'Arithmetico-Geometric Progression (AGP)', level:'Core', color:'#D97706', icon:'AGP',
    shortDef:'Term = (AP term)×(GP term). Summation uses shifting and subtracting.',
    fullDef:"An arithmetico-geometric progression (AGP) is a sequence where each term is the product of an AP term and a GP term, e.g., (a + (k-1)d) r^{k-1}. The sum S_n = Σ (a + (k-1)d) r^{k-1} is evaluated by the method of differences: multiply by r, shift, and subtract. The resulting formula involves both geometric and arithmetic components. The infinite sum converges if |r|<1.",
    keyFacts:[
      {text:'AGP nth term', l:'t_k = (a + (k-1)d)r^{k-1}'},
      {text:'Sum of AGP (finite)', l:'S_n = \\frac{a - [a+(n-1)d]r^n}{1-r} + \\frac{dr(1-r^{n-1})}{(1-r)^2}'},
      {text:'Infinite AGP sum (|r|<1)', l:'S_\\infty = \\frac{a}{1-r} + \\frac{dr}{(1-r)^2}'},
      {text:'Method: multiply by r and subtract', l:'S_n - r S_n = a + dr\\frac{1-r^{n-1}}{1-r} - [a+(n-1)d]r^n'},
    ], genKey:'agp', diagram:'sequenceplot',
  },
  {
    id:'special_series', title:'Special Series (Σn, Σn², Σn³)', level:'Core', color:'#D97706', icon:'Σ',
    shortDef:'Formulas: Σn = n(n+1)/2, Σn² = n(n+1)(2n+1)/6, Σn³ = [n(n+1)/2]².',
    fullDef:"The sums of the first n natural numbers, their squares, and cubes are frequently used. Σn = n(n+1)/2, Σn² = n(n+1)(2n+1)/6, Σn³ = [n(n+1)/2]². These can be proven by induction or combinatorially. They serve as building blocks for more complex series like Σ (n)(n+1) or mixture of terms.",
    keyFacts:[
      {text:'Sum of first n numbers', l:'\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}'},
      {text:'Sum of squares', l:'\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}'},
      {text:'Sum of cubes', l:'\\sum_{k=1}^{n} k^3 = \\left[\\frac{n(n+1)}{2}\\right]^2'},
      {text:'Sum of first n odd numbers', l:'n^2'},
      {text:'Sum of Σn² relation', l:'\\sum (k)(k+1) = \\frac{n(n+1)(n+2)}{3}'},
    ], genKey:'special_series', diagram:'bar',
  },
  {
    id:'diff_telescoping', title:'Method of Differences & Telescoping', level:'Core', color:'#D97706', icon:'Vₙ',
    shortDef:'If term = difference of two consecutive terms, sum collapses (telescopes). Use T_n = S_n - S_{n-1}.',
    fullDef:"The method of differences relies on expressing the general term t_k as V_k − V_{k-1} (or similar). Summing such terms leads to massive cancellation leaving only the boundary terms. This is the discrete analogue of the fundamental theorem of calculus. Classic examples: 1/[k(k+1)] = 1/k − 1/(k+1), (2k+1)/[k²(k+1)²] = 1/k² − 1/(k+1)².",
    keyFacts:[
      {text:'Telescoping concept', l:'\\sum_{k=1}^{n} (V_k - V_{k-1}) = V_n - V_0'},
      {text:'Example: rational splitting', l:'\\frac{1}{k(k+1)} = \\frac{1}{k} - \\frac{1}{k+1}'},
      {text:'Sum of telescoping', l:'\\sum_{k=1}^{n}\\frac{1}{k(k+1)} = 1 - \\frac{1}{n+1}'},
      {text:'General method', l:'\\text{Write }t_k = f(k)-f(k-1)'},
    ], genKey:'diff_telescoping', diagram:'sequenceplot',
  },
  // Advanced
  {
    id:'recurrence', title:'Solving Linear Recurrences', level:'Advanced', color:'#8B5CF6', icon:'Fₙ',
    shortDef:'Solve homogeneous a_n = c₁a_{n-1}+c₂a_{n-2} via characteristic equation. Example: Fibonacci.',
    fullDef:"Linear homogeneous recurrences of order 2, a_n = p a_{n-1} + q a_{n-2}, are solved using the characteristic equation r² − p r − q = 0. For distinct roots, a_n = A·r₁ⁿ + B·r₂ⁿ. The Fibonacci sequence (p=1,q=1) yields the Binet formula. This topic extends to order-k recurrences and initial conditions.",
    keyFacts:[
      {text:'Characteristic equation', l:'r^2 - p r - q = 0'},
      {text:'General solution (distinct roots)', l:'a_n = A \\cdot r_1^n + B \\cdot r_2^n'},
      {text:'Fibonacci definition', l:'F_0=0, F_1=1, F_n=F_{n-1}+F_{n-2}'},
      {text:'Binet formula', l:'F_n = \\frac{\\varphi^n - \\psi^n}{\\sqrt5}'},
      {text:'Golden ratio', l:'\\varphi = \\frac{1+\\sqrt5}{2} \\approx 1.618'},
    ], genKey:'recurrence', diagram:'sequenceplot',
  },
  {
    id:'non_homog_recur', title:'Non-Homogeneous & Systems of Recurrences', level:'Advanced', color:'#7C3AED', icon:'aₙ+f(n)',
    shortDef:'Solve a_n = c₁a_{n-1} + f(n) (polynomial/exponential). Interlinked sequences (systems).',
    fullDef:"Non-homogeneous recurrences include a forcing term f(n). For a_n = c a_{n-1} + g(n), guess a particular solution based on the form of g(n) (polynomial, exponential, or their products). Systems of recurrences define two or more sequences simultaneously, e.g., a_n = p a_{n-1} + q b_{n-1}, b_n = r a_{n-1} + s b_{n-1}. These are solved by matrix methods or by eliminating one sequence to get a higher-order recurrence.",
    keyFacts:[
      {text:'Non-homogeneous form', l:'a_n = c a_{n-1} + p(n)\\quad(\\text{p(n) polynomial or exponential})'},
      {text:'Particular solution guess', l:'\\text{If }f(n)=k^n:\\; a_n^{(p)}=A k^n; \\text{ if }f(n)=n^d:\\; \\text{polynomial of same degree}'},
      {text:'General solution', l:'a_n = a_n^{(h)} + a_n^{(p)}'},
      {text:'Systems: using matrix', l:'\\mathbf{v}_n = M \\mathbf{v}_{n-1},\\; M=\\begin{pmatrix}p&q\\\\r&s\\end{pmatrix}'},
      {text:'Eigenvalues give closed form', l:'v_n = A\\lambda_1^n u_1 + B\\lambda_2^n u_2'},
    ], genKey:'non_homog_recur', diagram:'sequenceplot',
  },
  {
    id:'stability', title:'Stability & Limit of Recurrence', level:'Advanced', color:'#A78BFA', icon:'lim aₙ',
    shortDef:'Long-term behaviour, convergence of recursive sequences. Fixed point analysis.',
    fullDef:"A recurrence may converge to a fixed point (equilibrium) if it satisfies certain conditions. For a first-order recurrence a_{n+1} = f(a_n), a fixed point L satisfies L = f(L). If |f'(L)| < 1, the sequence converges to L locally (contraction mapping). For higher-order recurrences, stability is analyzed via the characteristic equation: roots with modulus < 1 lead to convergence to 0 (in homogeneous case). Boundedness and monotonicity are also studied.",
    keyFacts:[
      {text:'Fixed point condition', l:'L = f(L)'},
      {text:'Convergence criterion (1st order)', l:"|f'(L)| < 1 \\Rightarrow a_n \\to L"},
      {text:'Homogeneous: root magnitude', l:'|\\lambda_i| < 1\\text{ for all roots} \\Rightarrow a_n \\to 0'},
      {text:'Cobweb diagram', l:'\\text{Graphical method to visualise convergence}'},
    ], genKey:'stability', diagram:'convergence',
  },
  {
    id:'inequalities', title:'Inequalities for Sequences', level:'Advanced', color:'#8B5CF6', icon:'AM≥GM',
    shortDef:'AM-GM-HM, Cauchy-Schwarz, rearrangement, Jensen inequalities applied to sequence sums.',
    fullDef:"Inequalities are powerful tools to bound or find extremes of sums and products. The AM-GM inequality states that for positive numbers, the arithmetic mean is at least the geometric mean, with equality when all numbers are equal. Cauchy-Schwarz: (Σ a_i b_i)² ≤ (Σ a_i²)(Σ b_i²). The rearrangement inequality states that the sum of products is maximized when sequences are similarly sorted. These are essential in Olympiad problems.",
    keyFacts:[
      {text:'AM-GM (n numbers)', l:'\\frac{x_1+\\cdots+x_n}{n} \\ge \\sqrt[n]{x_1\\cdots x_n}'},
      {text:'Cauchy-Schwarz (sequences)', l:'(\\sum a_i b_i)^2 \\le (\\sum a_i^2)(\\sum b_i^2)'},
      {text:'Rearrangement inequality', l:'\\sum a_i b_{\\pi(i)}\\text{ max when similarly sorted}'},
      {text:'Jensen (convex function)', l:'f(\\frac{\\sum x_i}{n}) \\le \\frac{\\sum f(x_i)}{n}'},
    ], genKey:'inequalities', diagram:'bar',
  },
  // Olympiad – part 1: Limits, Convergence basics
  {
    id:'convergence_limits', title:'Convergence, Limits & Periodic Sequences', level:'Olympiad', color:'#EC4899', icon:'ε-N',
    shortDef:'Limit of a sequence: ε-N definition. Sandwich theorem, monotone bounded → convergence. Periodic sequences mod m.',
    fullDef:"A sequence a_n converges to L if for every ε>0 there exists N such that |a_n−L|<ε for all n≥N. For example, n/(n+1)→1, (1+1/n)ⁿ→e. The sandwich theorem: if x_n ≤ y_n ≤ z_n and x_n,z_n→L, then y_n→L. A monotone increasing sequence that is bounded above converges to its supremum. A sequence is periodic modulo m if a_{n+T} ≡ a_n (mod m) for all n. These concepts are foundational for rigorous analysis of sequences.",
    keyFacts:[
      {text:'Limit definition (ε-N)', l:'\\lim_{n\\to\\infty} a_n = L \\iff \\forall \\epsilon>0, \\exists N, n>N \\Rightarrow |a_n-L|<\\epsilon'},
      {text:'Sandwich theorem', l:'x_n \\le y_n \\le z_n,\\; x_n,z_n\\to L \\Rightarrow y_n\\to L'},
      {text:'Monotone bounded → convergence', l:'\\text{Increasing and bounded above} \\Rightarrow \\text{limit exists}'},
      {text:'Periodic sequence mod m', l:'a_{n+T} \\equiv a_n \\pmod m'},
      {text:'Examples', l:'\\frac{n}{n+1}\\to1,\\;(1+1/n)^n\\to e,\\; \\sin(n)\\text{ diverges}'},
    ], genKey:'convergence_limits', diagram:'convergence',
  },
  {
    id:'convergence_tests', title:'Convergence Tests & Dirichlet/Abel Tests', level:'Olympiad', color:'#EC4899', icon:'Σ∞',
    shortDef:'Ratio, Root, Comparison tests. Dirichlet and Abel tests for non-absolute convergence.',
    fullDef:"For infinite series Σ a_n, the ratio test: if lim |a_{n+1}/a_n| = L < 1 → converges; L > 1 → diverges. The root test: lim |a_n|^{1/n} = L, similar conclusion. The comparison test: 0 ≤ a_n ≤ b_n, Σ b_n converges ⇒ Σ a_n converges. Dirichlet's test: Σ a_n b_n converges if partial sums of a_n bounded and b_n → 0 monotonically. Abel's test: if Σ a_n converges and b_n monotone bounded, then Σ a_n b_n converges.",
    keyFacts:[
      {text:'Ratio test', l:'\\lim \\left|\\frac{a_{n+1}}{a_n}\\right| = L:\\; L<1\\Rightarrow\\text{converges},\\; L>1\\Rightarrow\\text{diverges}'},
      {text:'Root test', l:'\\lim |a_n|^{1/n} = L:\\; L<1\\Rightarrow\\text{converges}'},
      {text:'Comparison test', l:'0\\le a_n\\le b_n,\\;\\sum b_n\\text{ converges}\\Rightarrow\\sum a_n\\text{ converges}'},
      {text:"Dirichlet's test", l:'\\sum A_n\\text{ bounded},\\ b_n\\downarrow 0\\Rightarrow\\sum a_n b_n\\text{ converges}'},
      {text:"Abel's test", l:'\\sum a_n\\text{ converges},\\ b_n\\text{ monotone bounded}\\Rightarrow\\sum a_n b_n\\text{ converges}'},
    ], genKey:'convergence_tests', diagram:'convergence',
  },
  {
    id:'finite_diff', title:'Finite Differences (Discrete Calculus)', level:'Olympiad', color:'#EC4899', icon:'Δ',
    shortDef:'Forward difference Δ a_n = a_{n+1} − a_n. Relates to derivatives. Summation via antidifferences.',
    fullDef:"The finite difference operator Δ acts on sequences: Δ a_n = a_{n+1} − a_n. Iterated differences Δ^k a_n yield binomial-like patterns. The fundamental theorem of discrete calculus: Σ_{k=m}^{n-1} Δ a_k = a_n − a_m. This is the discrete analogue of the fundamental theorem of calculus. Polynomial sequences satisfy Δ^{d+1} p(n) = 0 for degree d. The inverse operator Σ (indefinite sum) gives antidifferences, enabling closed-form sums like Σ n².",
    keyFacts:[
      {text:'Forward difference', l:'\\Delta a_n = a_{n+1} - a_n'},
      {text:'Higher differences', l:'\\Delta^2 a_n = \\Delta(\\Delta a_n) = a_{n+2} - 2a_{n+1} + a_n'},
      {text:'Discrete FTC', l:'\\sum_{k=m}^{n-1} \\Delta a_k = a_n - a_m'},
      {text:'Factorial powers', l:'\\Delta n^{\\underline{k}} = k n^{\\underline{k-1}}'},
      {text:'Polynomial degree drops', l:'\\Delta^{d+1} p(n) = 0\\text{ for deg }p = d'},
    ], genKey:'finite_diff', diagram:'sequenceplot',
  },
  {
    id:'gen_functions', title:'Generating Functions (OGF & EGF)', level:'Olympiad', color:'#EC4899', icon:'G(x)',
    shortDef:'Ordinary (OGF) Σ a_n xⁿ and exponential (EGF) Σ a_n xⁿ/n! to solve recurrences and combinatorics.',
    fullDef:"Generating functions encode sequences as coefficients of power series. An ordinary generating function (OGF) is G(x)=Σ_{n≥0} a_n xⁿ; multiplication corresponds to convolution. The exponential generating function (EGF) is E(x)=Σ a_n xⁿ/n!; it simplifies handling of permutations and labelled structures. Recurrence relations become algebraic equations; solving yields closed forms. Example: Fibonacci OGF = x/(1−x−x²). The EGF for Derangements is e^{−x}/(1−x).",
    keyFacts:[
      {text:'OGF definition', l:'G(x) = \\sum_{n=0}^{\\infty} a_n x^n'},
      {text:'EGF definition', l:'E(x) = \\sum_{n=0}^{\\infty} \\frac{a_n}{n!} x^n'},
      {text:'Convolution (OGF)', l:'(\\sum a_n x^n)(\\sum b_n x^n) = \\sum (\\sum_{k=0}^n a_k b_{n-k}) x^n'},
      {text:'Solving recurrences', l:'\\text{Multiply recurrence by }x^n,\\text{ sum over }n \\ge k,\\text{ solve}'},
      {text:'Fibonacci OGF', l:'G(x) = \\frac{x}{1-x-x^2}'},
      {text:'EGF for derangements', l:'D(x) = \\frac{e^{-x}}{1-x}'},
    ], genKey:'gen_functions', diagram:'sequenceplot',
  },
  {
    id:'number_theoretic', title:'Number Theoretic Sequences', level:'Olympiad', color:'#EC4899', icon:'mod',
    shortDef:'Sequences modulo m, periodicity (Pisano period). p-adic valuation v_p(a_n) and its properties.',
    fullDef:"Many classical sequences (Fibonacci, linear recurrences) exhibit rich arithmetic when considered modulo m. The Pisano period is the period of Fibonacci numbers modulo m. More generally, the order of a recurrent sequence modulo m can be studied via matrix exponentiation modulo m. The p-adic valuation v_p(a_n) — the highest power of a prime p dividing a_n — reveals the divisibility structure and often satisfies its own recurrence (e.g., for a_n = n! the Legendre formula).",
    keyFacts:[
      {text:'Sequence modulo m', l:'a_{n} \\equiv r_n \\pmod m'},
      {text:'Pisano period (Fibonacci)', l:'\\pi(m): F_{n+\\pi(m)} \\equiv F_n \\pmod m'},
      {text:'p-adic valuation', l:'v_p(a_n) = \\max\\{k: p^k \\mid a_n\\}'},
      {text:"Legendre's formula for n!", l:'v_p(n!) = \\sum_{i=1}^{\\infty} \\lfloor n/p^i \\rfloor'},
      {text:'Linear recurrence v_p', l:'v_p(F_n)\\text{ itself obeys recurrence relations}'},
    ], genKey:'number_theoretic', diagram:'sequenceplot',
  },
  {
    id:'summation_techniques', title:'Advanced Summation (Abel, Euler-Maclaurin, Telescoping Products)', level:'Olympiad', color:'#EC4899', icon:'Σ+',
    shortDef:'Abel summation (discrete parts), Euler-Maclaurin formula (sum ↔ integral), telescoping products.',
    fullDef:"Abel's summation formula (summation by parts) is the discrete analogue of integration by parts: Σ_{k=m}^{n} a_k (b_{k+1}−b_k) = a_n b_{n+1} − a_m b_m − Σ_{k=m}^{n-1} (a_{k+1}−a_k) b_{k+1}. It is used to evaluate sums like Σ a_k (where a_k can be difficult) by pairing with a telescoping b_k. The Euler-Maclaurin formula provides asymptotic expansion of sums using integrals and derivatives. Telescoping products work similarly to telescoping sums: if a_k = b_{k+1}/b_k, then Π_{k=1}^n a_k = b_{n+1}/b_1.",
    keyFacts:[
      {text:'Abel summation (sum by parts)', l:'\\sum_{k=m}^{n} a_k \\Delta b_k = a_n b_{n+1} - a_m b_m - \\sum_{k=m}^{n-1} (\\Delta a_k) b_{k+1}'},
      {text:'Euler-Maclaurin (first order)', l:'\\sum_{k=1}^{n} f(k) \\approx \\int_1^n f(x)dx + \\frac{f(1)+f(n)}{2}'},
      {text:'Telescoping product', l:'\\prod_{k=1}^{n} \\frac{b_{k+1}}{b_k} = \\frac{b_{n+1}}{b_1}'},
      {text:'Example', l:'\\prod_{k=1}^{n} \\frac{k+1}{k} = n+1'},
    ], genKey:'summation_techniques', diagram:'sequenceplot',
  },
  {
    id:'advanced_inequalities', title:'Advanced Sequence Inequalities', level:'Olympiad', color:'#EC4899', icon:'Cheb',
    shortDef:'Chebyshev sum inequality, Muirhead, Schur — for symmetric sums and polynomial sequences.',
    fullDef:"Chebyshev's inequality: if a_1 ≤ a_2 ≤ … and b_1 ≤ b_2 ≤ … then (1/n)Σ a_i b_i ≥ ( (1/n)Σ a_i ) ( (1/n)Σ b_i ). Muirhead's inequality provides a tool to compare symmetric sums: for sequences (α) majorizing (β), Σ_sym x₁^{α₁}…x_n^{α_n} ≥ Σ_sym x₁^{β₁}…x_n^{β_n} for positive reals. Schur's inequality: x^r(x-y)(x-z) + y^r(y-z)(y-x) + z^r(z-x)(z-y) ≥ 0 for r ≥ 0. These inequalities are crucial in Olympiad sequence and series problems involving symmetric sums of powers.",
    keyFacts:[
      {text:'Chebyshev sum inequality', l:'\\frac{1}{n}\\sum a_i b_i \\ge \\left(\\frac{1}{n}\\sum a_i\\right)\\left(\\frac{1}{n}\\sum b_i\\right)'},
      {text:'Muirhead (majorization)', l:'\\sum_{\\text{sym}} x^\\alpha \\ge \\sum_{\\text{sym}} x^\\beta\\text{ if }\\alpha\\succ\\beta'},
      {text:"Schur's inequality (r=1)", l:'x^3+y^3+z^3+3xyz \\ge \\sum_{\\text{sym}} x^2 y'},
      {text:'Applications', l:'\\text{Proving inequalities of sequences like }\\sum a_n^k\\ge\\ldots'},
    ], genKey:'advanced_inequalities', diagram:'bar',
  },
];

// ── Practice Generators ────────────────────────────────────────
const GENERATORS = {
  ap:(n)=>{
    const templates=[
      (s)=>{const a=srI(s,1,10), d=srI(s+1,1,5), n_=srI(s+2,4,10); const an=a+(n_-1)*d, Sn=n_/2*(2*a+(n_-1)*d); return{question:`In an AP with first term ${a} and common difference ${d}, find the ${n_}th term and sum of first ${n_} terms.`,steps:[`a_n = a + (n-1)d = ${a}+(${n_}-1)*${d}=${an}`,`S_n = n/2 [2a + (n-1)d] = ${n_}/2 * [2*${a}+${n_-1}*${d}] = ${Sn}`],answer:`a_${n_}=${an}, S_${n_}=${Sn}`,answerLatex:`a_{${n_}} = ${an},\\; S_{${n_}} = ${Sn}`,tip:'Use standard AP formulas.'};},
      (s)=>{const a3=srI(s,5,15), a8=srI(s+1,20,35); const d=(a8-a3)/5, a1=a3-2*d; return{question:`The 3rd term of an AP is ${a3} and the 8th is ${a8}. Find the first term and common difference.`,steps:[`a_3 = a + 2d = ${a3}`, `a_8 = a + 7d = ${a8}`, `Subtract: 5d = ${a8-a3} → d = ${d}`, `a = a_3 - 2d = ${a1}`],answer:`a=${a1}, d=${d}`,answerLatex:`a=${a1},\\; d=${d}`,tip:'Use a_n = a + (n-1)d to form equations.'};},
      (s)=>{const a=srI(s,1,8), d=srI(s+1,2,5), n_=srI(s+2,5,12); const Sn=n_/2*(2*a+(n_-1)*d); return{question:`Find the sum of the AP: ${a}, ${a+d}, ${a+2*d}, ... (${n_} terms).`,steps:[`S_n = n/2 [2a + (n-1)d] = ${n_}/2 * [2*${a}+${n_-1}*${d}] = ${Sn}`],answer:`${Sn}`,answerLatex:`S_{${n_}} = ${Sn}`,tip:'Sum of AP formula.'};},
    ];
    const t=templates[n%templates.length](n*31+7);
    return{...t};
  },
  gp:(n)=>{
    const templates=[
      (s)=>{const a=srI(s,2,6), r=srI(s+1,2,3), n_=srI(s+2,4,7); const an=a*Math.pow(r,n_-1), Sn=a*(Math.pow(r,n_)-1)/(r-1); return{question:`In a GP with first term ${a} and common ratio ${r}, find the ${n_}th term and sum of first ${n_} terms.`,steps:[`a_n = a * r^{n-1} = ${a}*${r}^${n_-1} = ${Math.round(an)}`,`S_n = a(r^n-1)/(r-1) = ${a}*(${Math.pow(r,n_)}-1)/(${r}-1) = ${Math.round(Sn)}`],answer:`a_${n_}=${Math.round(an)}, S_${n_}=${Math.round(Sn)}`,answerLatex:`a_{${n_}} \\approx ${Math.round(an)},\\; S_{${n_}} \\approx ${Math.round(Sn)}`,tip:'GP formulas: a_n = a r^{n-1}, S_n = a(r^n-1)/(r-1).'};},
      (s)=>{const a=srI(s,3,8), r=srI(s+1,2,4)/10; if(Math.abs(r)>=1) r=0.5; const Sinf=a/(1-r); return{question:`Find the infinite sum of the GP: ${a} + ${a*r} + ${a*r*r} + ... (|r|<1)`,steps:[`S_∞ = a / (1 - r) = ${a} / (1 - ${r}) = ${fmt(Sinf,4)}`],answer:`${fmt(Sinf,4)}`,answerLatex:`S_\\infty = \\frac{${a}}{1-${r}} = ${fmt(Sinf,4)}`,tip:'Infinite GP sum = a/(1−r) for |r|<1.'};},
    ];
    const t=templates[n%templates.length](n*37+11);
    return{...t};
  },
  hp_means:(n)=>{
    const templates=[
      (s)=>{const a=srI(s,1,10), b=srI(s+1,1,10); const HM=(2*a*b)/(a+b); return{question:`Find the harmonic mean of ${a} and ${b}.`,steps:[`HM = 2ab/(a+b) = 2*${a}*${b}/(${a+b}) = ${fmt(HM,2)}`],answer:`${fmt(HM,2)}`,answerLatex:`HM = \\frac{2\\cdot${a}\\cdot${b}}{${a}+${b}} = ${fmt(HM,2)}`,tip:'HM = 2ab/(a+b).'};},
      (s)=>{const x=srI(s,2,8), y=srI(s+1,2,8); const AM=(x+y)/2, GM=Math.sqrt(x*y), HM=(2*x*y)/(x+y); return{question:`Verify AM ≥ GM ≥ HM for ${x} and ${y}.`,steps:[`AM=${fmt(AM,2)}, GM=${fmt(GM,2)}, HM=${fmt(HM,2)}`, `Order: ${fmt(AM,2)} ≥ ${fmt(GM,2)} ≥ ${fmt(HM,2)}`],answer:`True`,answerLatex:`${fmt(AM,2)} \\ge ${fmt(GM,2)} \\ge ${fmt(HM,2)}`,tip:'AM = (x+y)/2, GM = √(xy), HM = 2xy/(x+y).'};},
    ];
    const t=templates[n%templates.length](n*41+13);
    return{...t};
  },
  agp:(n)=>{
    const templates=[
      (s)=>{const a=srI(s,1,3), d=srI(s+1,1,3), r=srI(s+2,2,3)/10; const n_=srI(s+3,3,5); const terms=Array.from({length:n_},(_,i)=> (a+i*d)*Math.pow(r,i)); const Sn=terms.reduce((s,v)=>s+v,0); return{question:`Find the sum of the AGP: ${terms.map((t,i)=>`(${a+i*d})·${r}^${i}`).join(' + ')}`,steps:[`Compute each term:`,...terms.map((t,i)=>`Term ${i+1}: (${a+i*d}) * ${r}^${i} = ${fmt(t,4)}`),`Sum = ${fmt(Sn,4)}`],answer:`${fmt(Sn,4)}`,answerLatex:`S_{${n_}} = ${fmt(Sn,4)}`,tip:'AGP sum: multiply by r, subtract, use geometric series.'};},
    ];
    const t=templates[n%templates.length](n*43+17);
    return{...t};
  },
  special_series:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,5,15); const sumSq=n_*(n_+1)*(2*n_+1)/6; return{question:`Find the sum of squares of first ${n_} natural numbers.`,steps:[`Σk² = n(n+1)(2n+1)/6 = ${n_}*${n_+1}*${2*n_+1}/6 = ${sumSq}`],answer:`${sumSq}`,answerLatex:`\\sum_{k=1}^{${n_}} k^2 = ${sumSq}`,tip:'Σn² = n(n+1)(2n+1)/6.'};},
      (s)=>{const n_=srI(s,5,12); const sumCub=Math.pow(n_*(n_+1)/2,2); return{question:`Find the sum of cubes of first ${n_} natural numbers.`,steps:[`Σk³ = [n(n+1)/2]² = [${n_}*${n_+1}/2]² = ${sumCub}`],answer:`${sumCub}`,answerLatex:`\\left[\\frac{${n_}*${n_+1}}{2}\\right]^2 = ${sumCub}`,tip:'Σn³ = [n(n+1)/2]².'};},
    ];
    const t=templates[n%templates.length](n*47+19);
    return{...t};
  },
  diff_telescoping:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,4,8); const sum=1-1/(n_+1); return{question:`Find the sum: 1/(1·2) + 1/(2·3) + ... + 1/(${n_}(${n_+1}))`,steps:[`Each term = 1/k - 1/(k+1)`, `Sum telescopes: = 1 - 1/(${n_+1}) = ${fmt(sum,4)}`],answer:`${fmt(sum,4)}`,answerLatex:`1 - \\frac{1}{${n_+1}} = ${fmt(sum,4)}`,tip:'Telescoping: 1/(k(k+1)) = 1/k − 1/(k+1).'};},
      (s)=>{const n_=srI(s,3,6); const sum=1-1/Math.pow(n_+1,2); return{question:`Sum to n terms of (2k+1)/(k²(k+1)²) for k=1 to ${n_}`,steps:[`Write (2k+1)/(k²(k+1)²) = 1/k² - 1/(k+1)²`,`Sum telescopes: = 1 - 1/(${n_+1})² = ${fmt(sum,4)}`],answer:`${fmt(sum,4)}`,answerLatex:`1 - \\frac{1}{${n_+1}^2} = ${fmt(sum,4)}`,tip:'Key identity: (2k+1)/(k²(k+1)²) = 1/k² - 1/(k+1)².'};},
    ];
    const t=templates[n%templates.length](n*53+23);
    return{...t};
  },
  recurrence:(n)=>{
    const templates=[
      (s)=>{const a0=srI(s,1,3), a1=srI(s+1,2,5), p=srI(s+2,2,4), q=-srI(s+3,1,3); const target=5; const seq=[a0, a1]; for(let i=2;i<=target;i++) seq.push(p*seq[i-1]+q*seq[i-2]); return{question:`a_0=${a0}, a_1=${a1}, a_n=${p}a_{n-1} + ${q}a_{n-2}. Find a_${target}.`,steps:[`Compute iteratively:`,...Array.from({length:target-1},(_,i)=>`a_${i+2}=${p}*${seq[i]}+${q}*${seq[i+1]}=${seq[i+2]}`),`a_${target}=${seq[target]}`],answer:`${seq[target]}`,answerLatex:`a_{${target}} = ${seq[target]}`,tip:'Iterate the recurrence.'};},
      (s)=>{const phi=(1+Math.sqrt(5))/2, psi=(1-Math.sqrt(5))/2, n_=srI(s,6,10); const Fn=Math.round((Math.pow(phi,n_)-Math.pow(psi,n_))/Math.sqrt(5)); return{question:`Using Binet's formula, find Fibonacci F_${n_}.`,steps:[`Binet: F_n = (φ^n - ψ^n)/√5`, `φ=${fmt(phi,4)}, ψ=${fmt(psi,4)}`, `F_${n_} = (${fmt(Math.pow(phi,n_),2)} - ${fmt(Math.pow(psi,n_),2)})/√5 ≈ ${Fn}`],answer:`${Fn}`,answerLatex:`F_{${n_}} = ${Fn}`,tip:'Binet formula for Fibonacci numbers.'};},
    ];
    const t=templates[n%templates.length](n*59+29);
    return{...t};
  },
  non_homog_recur:(n)=>{
    const templates=[
      (s)=>{const a1=srI(s,1,4), c=2, n_=srI(s+1,4,7); const particular=(n_*(n_+1))/2; const an=a1*Math.pow(2,n_-1)+particular; return{question:`Solve a_n = 2 a_{n-1} + n, with a_1 = ${a1}. Find a_${n_}.`,steps:[`Homogeneous part: h_n = A·2^n. Particular: try C₀ + C₁ n → gives n(n+1)/2.`,`General: a_n = A·2^n + n(n+1)/2. Use a_1 to find A.`,`a_1 = 2A + 1 = ${a1} → A = ${(a1-1)/2}`,`a_${n_} = ${(a1-1)/2}·2^${n_} + ${n_}*${n_+1}/2 = ${an}`],answer:`${an}`,answerLatex:`a_{${n_}} = ${an}`,tip:'Find homogeneous and particular solutions, then use initial condition.'};},
    ];
    const t=templates[n%templates.length](n*61+31);
    return{...t};
  },
  stability:(n)=>{
    const templates=[
      (s)=>{return{question:`Fixed point of a_{n+1} = 0.5 a_n + 2. Does a_n converge?`,steps:[`Fixed point L: L = 0.5L + 2 → 0.5L = 2 → L = 4.`,`Function f(x)=0.5x+2, f'(x)=0.5, |f'(L)|=0.5 < 1 → converges to 4.`],answer:`Yes, converges to 4`,answerLatex:`\\text{Converges to }4`,tip:'Check |f\'(L)| < 1 for convergence to fixed point.'};},
    ];
    const t=templates[n%templates.length](n*63+37);
    return{...t};
  },
  inequalities:(n)=>{
    const templates=[
      (s)=>{const x=srI(s,2,6); return{question:`For x>0, find the minimum value of x + 1/x using AM-GM.`,steps:[`AM of x and 1/x ≥ GM: (x + 1/x)/2 ≥ √(x·1/x) = 1`, `So x + 1/x ≥ 2, minimum is 2 (when x=1).`],answer:'2',answerLatex:'2',tip:'AM-GM: (x + 1/x) ≥ 2√(x·1/x) = 2.'};},
      (s)=>{const a=srI(s,1,4), b=srI(s+1,5,8), c=srI(s+2,3,6); const LHS=Math.pow(a+b+c,2), RHS=3*(a*a+b*b+c*c); const hold=LHS<=RHS; return{question:`By Cauchy-Schwarz, check: (${a}+${b}+${c})² ≤ 3(${a*a}+${b*b}+${c*c})?`,steps:[`LHS=${(a+b+c)**2}, RHS=3*(${a*a+b*b+c*c})=${RHS}`, `${hold?'Yes, inequality holds.':'No, inequality does not hold.'}`],answer:hold?'Yes':'No',answerLatex:`\\text{${hold?'Yes':'No'}}`,tip:'Cauchy: (Σ1·aᵢ)² ≤ (Σ1²)(Σaᵢ²).'};},
    ];
    const t=templates[n%templates.length](n*65+41);
    return{...t};
  },
  convergence_limits:(n)=>{
    const templates=[
      (s)=>{return{question:`Find the limit of a_n = n/(n+1) as n→∞.`,steps:[`Divide numerator and denominator by n: a_n = 1/(1+1/n)`, `As n→∞, 1/n→0, so limit = 1.`],answer:'1',answerLatex:'1',tip:'Limit of rational expression.'};},
      (s)=>{return{question:`Does the sequence a_n = (-1)^n converge?`,steps:[`The sequence alternates: 1, -1, 1, -1,...`, `No single limit approached → diverges.`],answer:'No',answerLatex:'\\text{No, it diverges.}',tip:'Oscillating sequences diverge.'};},
      (s)=>{const n_=srI(s,3,8); const limit=Math.exp(1); return{question:`Find the limit of a_n = (1 + 1/n)^n as n→∞ (approximate).`,steps:[`Limit is e ≈ 2.71828.`],answer:`e ≈ 2.71828`,answerLatex:'e',tip:'Famous limit definition of e.'};},
    ];
    const t=templates[n%templates.length](n*71+41);
    return{...t};
  },
  convergence_tests:(n)=>{
    const templates=[
      (s)=>{const an = 1/Math.pow(srI(s,2,5), srI(s+1,2,4)); return{question:`Check convergence of Σ 1/2ⁿ using ratio test.`,steps:[`a_n = 1/2ⁿ, a_{n+1}/a_n = 1/2 < 1 → converges by ratio test.`],answer:'Converges',answerLatex:'\\text{Converges}',tip:'Ratio test: limit < 1 → converges.'};},
      (s)=>{return{question:`Does Σ 1/n converge? (p-series with p=1)`,steps:[`The harmonic series diverges (p=1).`],answer:'Diverges',answerLatex:'\\text{Diverges}',tip:'Harmonic series is the classic divergent series.'};},
    ];
    const t=templates[n%templates.length](n*75+59);
    return{...t};
  },
  finite_diff:(n)=>{
    const templates=[
      (s)=>{return{question:`If a_n = n², find Δ a_n and Δ² a_n.`,steps:[`Δ n² = (n+1)² - n² = 2n+1`,`Δ² n² = Δ(2n+1) = 2(n+1)+1 - (2n+1) = 2`],answer:`Δ = 2n+1, Δ² = 2`,answerLatex:`\\Delta n^2 = 2n+1,\\; \\Delta^2 n^2 = 2`,tip:'Forward difference: Δ f(n) = f(n+1)-f(n).'};},
      (s)=>{const n_=srI(s,2,5); return{question:`Evaluate Σ_{k=1}^{${n_}} k·k! using discrete FTC with a_k = (k+1)! - k!`,steps:[`Note (k+1)! - k! = k·k!`, `Sum telescopes: = (${n_+1})! - 1`],answer:`(${n_+1})! - 1`,answerLatex:`(${n_+1})! - 1`,tip:'Recognise telescoping in factorial differences.'};},
    ];
    const t=templates[n%templates.length](n*77+63);
    return{...t};
  },
  gen_functions:(n)=>{
    const templates=[
      (s)=>{return{question:`Find the OGF of the constant sequence a_n = 1.`,steps:[`G(x) = Σ_{n≥0} x^n = 1/(1-x) for |x|<1.`],answer:'1/(1-x)',answerLatex:'\\frac{1}{1-x}',tip:'Geometric series.'};},
      (s)=>{return{question:`What is the EGF of the sequence a_n = n!?`,steps:[`EGF: E(x)= Σ (n!/n!) x^n = Σ x^n = 1/(1-x).`],answer:'1/(1-x)',answerLatex:'\\frac{1}{1-x}',tip:'Factorials cancel in EGF.'};},
    ];
    const t=templates[n%templates.length](n*67+43);
    return{...t};
  },
  number_theoretic:(n)=>{
    const templates=[
      (s)=>{return{question:`Find the Pisano period of Fibonacci modulo 3.`,steps:[`Fibonacci mod 3: 0,1,1,2,0,2,2,1,0,1,...`, `Cycle repeats after 8 terms → period = 8.`],answer:'8',answerLatex:'8',tip:'Compute Fibonacci numbers modulo m until the pair (0,1) reappears.'};},
      (s)=>{return{question:`v₂(48)? (2-adic valuation of 48)`,steps:[`48 = 2⁴ × 3 → v₂(48) = 4.`],answer:'4',answerLatex:'4',tip:'Highest power of prime dividing the number.'};},
    ];
    const t=templates[n%templates.length](n*69+47);
    return{...t};
  },
  summation_techniques:(n)=>{
    const templates=[
      (s)=>{return{question:`Evaluate Σ_{k=1}^{n} k·2^k using summation by parts.`,steps:[`Let a_k = k, Δb_k = 2^k, so b_k = 2^k - 2^{k-1}? Better: set b_{k+1}-b_k = 2^k → b_k = 2^k.`,`Abel: Σ k·2^k = n·2^{n+1} - 1·2 - Σ_{k=1}^{n-1} (1)·2^{k+1} = n·2^{n+1} - 2 - 2²(2^{n-1}-1) = (n-1)2^{n+1}+2.`],answer:'(n-1)2^{n+1}+2',answerLatex:'(n-1)2^{n+1}+2',tip:'Use Abel summation with b_k = 2^k.'};},
      (s)=>{return{question:`Find the telescoping product: ∏_{k=1}^{n} (k+1)/k.`,steps:[`Product = (2/1)*(3/2)*...*((n+1)/n) = n+1.`],answer:`${n} + 1`,answerLatex:'n+1',tip:'Telescoping product cancels almost everything.'};},
    ];
    const t=templates[n%templates.length](n*71+51);
    return{...t};
  },
  advanced_inequalities:(n)=>{
    const templates=[
      (s)=>{const x=srI(s,2,5), y=srI(s+1,2,5); return{question:`By Chebyshev, (x²+y²)(1/x²+1/y²) ≥ ? ( x,y>0 )`,steps:[`Assume x≥y, then x²≥y² and 1/x² ≤ 1/y² (reverse order). Chebyshev for similarly sorted requires both monotonic same way. But we can use AM-GM. Actually, expansion gives 2 + (x⁴+y⁴)/(x²y²) ≥ 2+2=4. So minimum 4.`],answer:'4',answerLatex:'4',tip:'Or apply AM-GM: (x²/y² + y²/x²) ≥ 2, sum = 4.'};},
      (s)=>{return{question:`Prove by Schur: a³ + b³ + c³ + 3abc ≥ a²(b+c) + b²(c+a) + c²(a+b) for a,b,c >0. True?`,steps:[`Schur's inequality (r=1): a(a-b)(a-c) + b(b-c)(b-a) + c(c-a)(c-b) ≥ 0, which is equivalent. So true.`],answer:'True',answerLatex:'\\text{True (Schur)}',tip:'Schur’s inequality is a powerful tool for symmetric sums.'};},
    ];
    const t=templates[n%templates.length](n*73+55);
    return{...t};
  },
};

// ── Quiz Generators ────────────────────────────────────────────
const QUIZ_GENERATORS = {
  ap:(n)=>{
    const templates=[
      (s)=>{const a=srI(s,2,5), d=srI(s+1,1,4), n_=srI(s+2,5,8); const an=a+(n_-1)*d; return{q:`${n_}th term of AP with a=${a}, d=${d}?`,opts:shuffle([an, an+d, a+n_*d, an-d].map(String),s),correct:String(an)};},
      (s)=>{const a=srI(s,1,6), d=3, n_=4; const Sn=n_/2*(2*a+(n_-1)*d); return{q:`Sum of 4,7,10,13?`,opts:shuffle([Sn, Sn+1, Sn-1, 40].map(String),s),correct:String(Sn)};},
    ];
    const t=templates[n%templates.length](n*31+7);
    return{...t,tip:'AP: a_n = a + (n-1)d, S_n = n/2(2a+(n-1)d).'};
  },
  gp:(n)=>{
    const templates=[
      (s)=>{const a=srI(s,2,5), r=2, n_=4; const an=a*Math.pow(r,n_-1); return{q:`4th term of GP 2,4,8,...?`,opts:shuffle([16,8,32,12].map(String),s),correct:'16'};},
      (s)=>{const a=5, r=0.5; const Sinf=a/(1-r); return{q:`Sum of infinite GP 5+2.5+1.25+...?`,opts:shuffle([Sinf, 10, 8, 7.5].map(String),s),correct:String(Sinf)};},
    ];
    const t=templates[n%templates.length](n*37+11);
    return{...t,tip:'GP: a_n = a r^{n-1}, S_∞ = a/(1-r) for |r|<1.'};
  },
  hp_means:(n)=>{
    const templates=[
      (s)=>{return{q:`Harmonic mean of 3 and 6?`,opts:shuffle(['4','4.5','3.6','2'],s),correct:'4'};},
      (s)=>{return{q:`Which is largest for positive numbers?`,opts:shuffle(['AM','GM','HM'],s),correct:'AM'};},
    ];
    const t=templates[n%templates.length](n*41+13);
    return{...t,tip:'HM = 2ab/(a+b). AM ≥ GM ≥ HM.'};
  },
  agp:(n)=>{
    const templates=[
      (s)=>{return{q:`Sum of 1·1 + 2·½ + 3·(½)² + … infinite?`,opts:shuffle(['4','3','2','5'],s),correct:'4'};},
    ];
    const t=templates[n%templates.length](n*43+17);
    return{...t,tip:'AGP sum formula: S = a/(1-r) + dr/(1-r)².'};
  },
  special_series:(n)=>{
    const templates=[
      (s)=>{const n_=10; const sum=n_*(n_+1)*(2*n_+1)/6; return{q:`Sum of squares 1²+2²+…+10²?`,opts:shuffle([sum, 3025, 2500, 385].map(String),s),correct:String(sum)};},
      (s)=>{const n_=5; const cub=Math.pow(n_*(n_+1)/2,2); return{q:`Sum of cubes 1³+2³+…+5³?`,opts:shuffle([cub, 125, 225, 300].map(String),s),correct:String(cub)};},
    ];
    const t=templates[n%templates.length](n*47+19);
    return{...t,tip:'Σn = n(n+1)/2, Σn² = n(n+1)(2n+1)/6, Σn³ = [n(n+1)/2]².'};
  },
  diff_telescoping:(n)=>{
    const templates=[
      (s)=>{return{q:`Sum of 1/(1·2)+1/(2·3)+…+1/(n(n+1)) up to n=99?`,opts:shuffle(['0.99','1','0.5','0.01'],s),correct:'0.99'};},
    ];
    const t=templates[n%templates.length](n*53+23);
    return{...t,tip:'Telescoping: 1/(k(k+1)) = 1/k − 1/(k+1).'};
  },
  recurrence:(n)=>{
    const templates=[
      (s)=>{return{q:`a_0=0, a_1=1, a_n=a_{n-1}+a_{n-2}. a_5=?`,opts:shuffle([5,8,13,21].map(String),s),correct:'5'};},
    ];
    const t=templates[n%templates.length](n*59+29);
    return{...t,tip:'Fibonacci recurrence.'};
  },
  non_homog_recur:(n)=>{
    const templates=[
      (s)=>{return{q:`Solve a_n = 2a_{n-1} + 1, a_1=1. a_3=?`,opts:shuffle([7,11,15,9].map(String),s),correct:'7'};},
    ];
    const t=templates[n%templates.length](n*61+31);
    return{...t,tip:'Homogeneous + particular solution.'};
  },
  stability:(n)=>{
    const templates=[
      (s)=>{return{q:`Fixed point of a_{n+1} = 0.5 a_n + 3?`,opts:shuffle([6,3,0,'∞'],s),correct:'6'};},
    ];
    const t=templates[n%templates.length](n*63+37);
    return{...t,tip:'Solve L = f(L) for fixed point.'};
  },
  inequalities:(n)=>{
    const templates=[
      (s)=>{return{q:`Minimum of x + 1/x for x>0?`,opts:shuffle([2,1,0,4],s),correct:'2'};},
    ];
    const t=templates[n%templates.length](n*65+41);
    return{...t,tip:'AM-GM: (x+1/x) ≥ 2.'};
  },
  convergence_limits:(n)=>{
    const templates=[
      (s)=>{return{q:`Limit of n/(n+1) as n→∞?`,opts:shuffle([1,0,'∞',0.5],s),correct:'1'};},
      (s)=>{return{q:`Does (-1)^n converge?`,opts:shuffle(['No','Yes','To 1','To -1'],s),correct:'No'};},
    ];
    const t=templates[n%templates.length](n*67+41);
    return{...t,tip:'Convergence requires a single finite limit.'};
  },
  convergence_tests:(n)=>{
    const templates=[
      (s)=>{return{q:`Σ 1/n² converges?`,opts:shuffle(['Yes (p=2>1)','No','Conditionally','Depends on n'],s),correct:'Yes (p=2>1)'};},
    ];
    const t=templates[n%templates.length](n*75+59);
    return{...t,tip:'p-series converges if p > 1.'};
  },
  finite_diff:(n)=>{
    const templates=[
      (s)=>{return{q:`Δ(n³) = ?`,opts:shuffle(['3n²+3n+1','3n²','3n²+1','n³'],s),correct:'3n²+3n+1'};},
    ];
    const t=templates[n%templates.length](n*77+63);
    return{...t,tip:'Δ n³ = (n+1)³ - n³ = 3n²+3n+1.'};
  },
  gen_functions:(n)=>{
    const templates=[
      (s)=>{return{q:`OGF of constant sequence 1,1,1,…?`,opts:shuffle(['1/(1-x)','x/(1-x)','1/(1+x)','x/(1-x)²'],s),correct:'1/(1-x)'};},
    ];
    const t=templates[n%templates.length](n*79+65);
    return{...t,tip:'Σ x^n = 1/(1-x).'};
  },
  number_theoretic:(n)=>{
    const templates=[
      (s)=>{return{q:`Pisano period of Fibonacci mod 2?`,opts:shuffle([3,2,5,8],s),correct:'3'};},
      (s)=>{return{q:`v₂(12) = ?`,opts:shuffle([2,3,4,1],s),correct:'2'};},
    ];
    const t=templates[n%templates.length](n*81+67);
    return{...t,tip:'Period mod m and p-adic valuations.'};
  },
  summation_techniques:(n)=>{
    const templates=[
      (s)=>{return{q:`Summation by parts is analogous to?`,opts:shuffle(['Integration by parts','Chain rule','Product rule','Taylor series'],s),correct:'Integration by parts'};},
    ];
    const t=templates[n%templates.length](n*83+69);
    return{...t,tip:'Abel summation = discrete integration by parts.'};
  },
  advanced_inequalities:(n)=>{
    const templates=[
      (s)=>{return{q:`Chebyshev inequality relates to?`,opts:shuffle(['Monotonically similarly sorted sequences','Convex functions','Integrals','Trigonometric sums'],s),correct:'Monotonically similarly sorted sequences'};},
    ];
    const t=templates[n%templates.length](n*85+71);
    return{...t,tip:'Chebyshev requires sequences sorted in the same direction.'};
  },
};

// ── Global Styles ──────────────────────────────────────────────
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
      body{background:#0d0802;}
      ::-webkit-scrollbar{width:5px;}
      ::-webkit-scrollbar-track{background:#0d0802;}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:4px;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
      @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
      @keyframes shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(8px);}60%{transform:translateX(-5px);}80%{transform:translateX(5px);}}
      @keyframes popIn{0%{transform:scale(0.7);opacity:0;}80%{transform:scale(1.05);}100%{transform:scale(1);opacity:1;}}
      .btn{transition:all 0.2s ease;cursor:pointer;}
      .btn:active{transform:scale(0.97);}
      .katex{color:inherit!important;}
      .katex-display{margin:0!important;}
      .fade-up{animation:fadeUp 0.5s ease both;}
      .fade-in{animation:fadeIn 0.4s ease both;}
      .shake{animation:shake 0.5s ease;}
      .pop-in{animation:popIn 0.4s ease both;}
    `;
    document.head.appendChild(s);
  }, []);
}

// ── Cover Screen ───────────────────────────────────────────────
function CoverScreen({ onNext }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [300, 900, 1600].map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => ts.forEach(clearTimeout);
  }, []);
  const floaters = ['Sₙ','aₙ','d','r','∑','AP','GP','HP','∞','lim','φ','AM≥GM','mod','Δ'];
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', background:`radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.09) 0%, transparent 65%), #0d0802`, textAlign:'center' }}>
      {floaters.map((s, i) => (
        <div key={s} style={{ position:'fixed', pointerEvents:'none', fontSize:14+(i%3)*7, color:`rgba(245,158,11,${0.04+(i%4)*0.02})`, top:`${8+i*11}%`, left:i%2===0?`${2+i*4}%`:`${74+i*2}%`, fontFamily:'JetBrains Mono,monospace', animation:`pulse ${3+i*0.6}s ease-in-out infinite`, animationDelay:`${i*0.25}s` }}>{s}</div>
      ))}
      <div style={{ opacity:phase>=1?1:0, transform:phase>=1?'translateY(0)':'translateY(12px)', transition:'all 0.6s ease', marginBottom:20, display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:40 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:ACCENT, animation:'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize:12, color:ACCENT, letterSpacing:'2px', textTransform:'uppercase', fontFamily:'Crimson Pro, serif' }}>Mathematics · Algebra</span>
      </div>
      <div style={{ opacity:phase>=2?1:0, transform:phase>=2?'translateY(0)':'translateY(20px)', transition:'all 0.7s ease 0.1s', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:'clamp(40px, 10vw, 90px)', color:'#fff', letterSpacing:'-3px', lineHeight:0.92, marginBottom:0 }}>
          Sequences & <span style={{ color:ACCENT }}>Series</span>
        </h1>
        <div style={{ height:3, width:80, background:`linear-gradient(90deg, ${ACCENT}, transparent)`, margin:'16px auto 0', borderRadius:2 }} />
      </div>
      <div style={{ opacity:phase>=3?1:0, transition:'all 0.6s ease', maxWidth:560, marginBottom:40 }}>
        <p style={{ fontFamily:'Crimson Pro, serif', fontSize:19, color:'rgba(255,255,255,0.7)', lineHeight:1.55, marginBottom:18, fontStyle:'italic' }}>
          "From AP & GP to generating functions, advanced recurrences, and discrete calculus — sequences are the heartbeat of mathematical reasoning."
        </p>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 24px', textAlign:'left' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:12, fontFamily:'JetBrains Mono, monospace' }}>Chapter Overview</div>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>
            Master progressions (AP, GP, HP), means, AGP, special sums, telescoping, advanced recurrences (non‑homogeneous, systems, stability), generating functions (OGF & EGF), number theoretic sequences, Abel/Euler‑Maclaurin summation, Chebyshev/Muirhead/Schur inequalities, convergence tests, limits (ε‑N), finite differences — right up to Olympiad level.
          </p>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:20 }}>
          {['Foundation → Olympiad','17 Topics','∞ Practice','Quiz-Gated Progress'].map(t => (
            <span key={t} style={{ padding:'4px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, fontSize:12, color:'rgba(255,255,255,0.5)', fontFamily:'Crimson Pro, serif' }}>{t}</span>
          ))}
        </div>
      </div>
      {phase >= 3 && (
        <button onClick={onNext} className="btn" style={{ padding:'16px 48px', background:ACCENT, color:'#fff', border:'none', borderRadius:50, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, letterSpacing:'-0.3px', boxShadow:`0 8px 30px ${ACCENT}55`, animation:'fadeUp 0.5s ease both' }}>
          Begin Chapter →
        </button>
      )}
    </div>
  );
}

// ── Notation Screen ────────────────────────────────────────────
function NotationScreen({ onNext }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setTimeout(() => setRevealed(true), 100); }, []);
  const groups = [
    { title:'Sequence Basics', color:ACCENT, rows:NOTATION.slice(0,5) },
    { title:'Means & Special Sums', color:'#D97706', rows:NOTATION.slice(5,11) },
    { title:'Advanced Recurrences & GF', color:'#8B5CF6', rows:NOTATION.slice(11,16) },
    { title:'Olympiad Tools', color:'#EC4899', rows:NOTATION.slice(16) },
  ];
  return (
    <div style={{ minHeight:'100vh', background:'#0d0802', padding:'32px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:32, opacity:revealed?1:0, transition:'opacity 0.5s ease' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Before We Begin</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:34, color:'#fff', letterSpacing:'-1px', marginBottom:10 }}>Notation Guide</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>Key symbols and formulas for sequences and series.</p>
        </div>
        {groups.map((g, gi) => (
          <div key={g.title} style={{ marginBottom:24, opacity:revealed?1:0, transform:revealed?'translateY(0)':'translateY(16px)', transition:`all 0.5s ease ${gi*0.1+0.2}s` }}>
            <div style={{ fontSize:11, color:g.color, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:20, height:2, background:g.color, borderRadius:1 }} />
              {g.title}
            </div>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
              {g.rows.map((row, ri) => (
                <div key={ri} style={{ display:'grid', gridTemplateColumns:'130px 1fr 1fr', borderBottom:ri<g.rows.length-1?'1px solid rgba(255,255,255,0.05)':'none', padding:'10px 16px', alignItems:'center', gap:8 }}>
                  <div style={{ color:g.color, overflowX:'auto' }}><KTex l={row.sym} /></div>
                  <div><div style={{ fontFamily:'Crimson Pro,serif', fontWeight:600, fontSize:13, color:'#fff', marginBottom:2 }}>{row.name}</div><div style={{ fontFamily:'Crimson Pro,serif', fontSize:12, color:'rgba(255,255,255,0.4)', fontStyle:'italic' }}>{row.meaning}</div></div>
                  <div style={{ overflowX:'auto' }}><KTex l={row.ex} style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }} /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ background:`linear-gradient(135deg,${ACCENT}10,${ACCENT}05)`, border:`1px solid ${ACCENT}25`, borderRadius:14, padding:'16px 20px', marginBottom:28 }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Quiz-Gated Progress</div>
          <p style={{ fontFamily:'Crimson Pro,serif', fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>Complete the <strong style={{color:'#fff'}}>4‑question quiz</strong> for each topic to unlock the next. Infinite practice ensures mastery.</p>
        </div>
        <button onClick={onNext} className="btn" style={{ width:'100%', padding:'16px', background:ACCENT, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${ACCENT}44` }}>
          Start Learning Sequences & Series →
        </button>
      </div>
    </div>
  );
}

// ── Section Menu ───────────────────────────────────────────────
function SectionMenuScreen({ onSelect, completedIds }) {
  const levels = ['Foundation','Core','Advanced','Olympiad'];
  const lColors = { Foundation:'#F59E0B', Core:'#D97706', Advanced:'#8B5CF6', Olympiad:'#EC4899' };
  const lDesc = { Foundation:'AP, GP, HP & Means', Core:'AGP, Special Sums, Telescoping', Advanced:'Recurrences, Stability, Inequalities', Olympiad:'Limits, Convergence Tests, Finite Diff, Generating Functions, Number Theory, Advanced Sums & Inequalities' };
  return (
    <div style={{ minHeight:'100vh', background:'#0d0802', padding:'28px 16px 60px' }}>
      <div style={{ maxWidth:660, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>Chapter · Sequences & Series</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:30, color:'#fff', letterSpacing:'-0.8px', marginBottom:6 }}>Choose a Topic</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:15, color:'rgba(255,255,255,0.4)', marginBottom:14 }}>Pass the quiz to unlock the next topic.</p>
          <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(completedIds.size/SECTIONS.length)*100}%`, background:`linear-gradient(90deg,${ACCENT},#D97706)`, borderRadius:4, transition:'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'JetBrains Mono,monospace', marginTop:6, textAlign:'right' }}>{completedIds.size}/{SECTIONS.length} completed</div>
        </div>
        {levels.map(level => (
          <div key={level} style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:lColors[level] }} />
              <span style={{ fontSize:13, color:lColors[level], fontWeight:600, fontFamily:'Crimson Pro, serif', textTransform:'uppercase', letterSpacing:'1px' }}>{level}</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:'Crimson Pro, serif' }}>— {lDesc[level]}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {SECTIONS.filter(s => s.level === level).map(sec => {
                const done = completedIds.has(sec.id);
                const secIdx = SECTIONS.indexOf(sec);
                const locked = secIdx > 0 && !completedIds.has(SECTIONS[secIdx-1].id);
                return (
                  <button key={sec.id} onClick={() => !locked && onSelect(sec)} className={locked?'':'btn'}
                    style={{ background:done?`${lColors[level]}12`:locked?'rgba(255,255,255,0.015)':'rgba(255,255,255,0.025)', border:`1px solid ${done?lColors[level]+'44':locked?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'14px 18px', textAlign:'left', display:'flex', alignItems:'center', gap:14, opacity:locked?0.5:1, cursor:locked?'default':'pointer' }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:done?`${lColors[level]}25`:locked?'rgba(255,255,255,0.05)':`${lColors[level]}15`, border:`1px solid ${done?lColors[level]+'55':locked?'rgba(255,255,255,0.08)':`${lColors[level]}30`}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:locked?20:14, color:done?lColors[level]:locked?'rgba(255,255,255,0.2)':lColors[level], fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>
                      {done ? '✓' : locked ? '🔒' : sec.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:15, color:done?lColors[level]:locked?'rgba(255,255,255,0.3)':'#fff', marginBottom:2 }}>{sec.title}</div>
                      <div style={{ fontFamily:'Crimson Pro, serif', fontSize:13, color:locked?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.4)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{locked?'Complete previous topic to unlock':sec.shortDef}</div>
                    </div>
                    <div style={{ fontSize:16, color:locked?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.2)', flexShrink:0 }}>{locked?'🔒':'→'}</div>
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

// ── Learn Screen ───────────────────────────────────────────────
function SectionLearnScreen({ section, onPractice, onBack }) {
  const [tab, setTab] = useState('learn');
  const lColors = { Foundation:'#F59E0B', Core:'#D97706', Advanced:'#8B5CF6', Olympiad:'#EC4899' };
  const col = lColors[section.level] || ACCENT;
  const Diagram = section.diagram === 'sequenceplot' ? (props) => <SequencePlotSVG {...props} type={section.id==='gp'?'gp':'ap'} /> :
                 section.diagram === 'bar' ? BarChartSVG :
                 section.diagram === 'convergence' ? ConvergenceSVG : null;
  return (
    <div style={{ minHeight:'100vh', background:'#0d0802', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(13,8,2,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>← Topics</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:15, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{section.title}</div>
          <div style={{ fontSize:11, color:col, fontFamily:'JetBrains Mono,monospace' }}>{section.level}</div>
        </div>
      </div>
      <div style={{ maxWidth:660, margin:'0 auto', padding:'24px 16px' }}>
        <div style={{ display:'flex', gap:4, marginBottom:24, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4 }}>
          {['learn','keys'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn" style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:tab===t?col:'transparent', color:tab===t?'#fff':'rgba(255,255,255,0.5)', fontFamily:'Crimson Pro, serif', fontWeight:600, fontSize:14 }}>
              {t==='learn'?'📖 Explanation':'🔑 Key Facts'}
            </button>
          ))}
        </div>
        {tab === 'learn' && (
          <div className="fade-in">
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:22 }}>
              <div style={{ width:56, height:56, borderRadius:14, background:`${col}15`, border:`1px solid ${col}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:col, fontFamily:'JetBrains Mono,monospace', flexShrink:0, letterSpacing:'-1px' }}>{section.icon}</div>
              <p style={{ fontFamily:'Playfair Display, serif', fontSize:18, color:'#fff', fontStyle:'italic', lineHeight:1.5 }}>"{section.shortDef}"</p>
            </div>
            {Diagram && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16, display:'flex', justifyContent:'center' }}>
                <Diagram color={col} size={300} />
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
          <button onClick={onPractice} className="btn" style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${col}44` }}>
            ⚡ Practice Questions →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Practice Screen ────────────────────────────────────────────
function PracticeScreen({ section, onBack, onStartQuiz }) {
  const [qIdx, setQIdx] = useState(0);
  const [baseSeed] = useState(() => Math.floor(Math.random() * 9999));
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [count, setCount] = useState(0);
  const col = ({Foundation:'#F59E0B', Core:'#D97706', Advanced:'#8B5CF6', Olympiad:'#EC4899'})[section.level] || ACCENT;
  const gen = GENERATORS[section.genKey] || (()=>({question:'Practice question',steps:[],answer:'...',tip:''}));
  const seed = baseSeed + qIdx * 97;
  const question = useCallback(() => gen(seed), [seed])();
  const next = () => { setQIdx(i => i+1); setShowAnswer(false); setShowSteps(false); setCount(c => c+1); };
  return (
    <div style={{ minHeight:'100vh', background:'#0d0802', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(13,8,2,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>← Learn</button>
          <div style={{ flex:1, fontFamily:'Playfair Display, serif', fontSize:14, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{section.title}</div>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:col, background:`${col}15`, padding:'4px 10px', borderRadius:20, flexShrink:0 }}>Q {count+1}</div>
          <button onClick={onStartQuiz} className="btn" style={{ background:`${col}20`, border:`1px solid ${col}55`, color:col, borderRadius:8, padding:'6px 13px', fontSize:13, fontWeight:700, flexShrink:0 }}>Done → Quiz ✓</button>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'Crimson Pro,serif', fontStyle:'italic' }}>Infinite practice · Click "Done → Quiz" when ready</div>
      </div>
      <div style={{ maxWidth:660, margin:'0 auto', padding:'24px 16px' }}>
        <div key={qIdx} className="fade-up" style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${col}30`, borderRadius:16, overflow:'hidden', marginBottom:18 }}>
          <div style={{ background:`${col}10`, borderBottom:`1px solid ${col}20`, padding:'10px 18px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:col, animation:'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize:11, color:col, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace' }}>Practice · {section.level}</span>
          </div>
          <div style={{ padding:'20px 20px 22px' }}>
            <p style={{ fontFamily:'Crimson Pro, serif', fontSize:17, color:'#e2e8f0', lineHeight:1.75, marginBottom:12 }}>{question.question}</p>
            {question.questionLatex && (
              <div style={{ background:`${col}0d`, border:`1px solid ${col}20`, borderRadius:10, padding:'12px 16px', overflowX:'auto' }}>
                <KTex l={question.questionLatex} style={{ color:col, fontSize:15 }} />
              </div>
            )}
          </div>
        </div>
        {!showAnswer && (
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <button onClick={() => setShowSteps(v => !v)} className="btn" style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.7)', fontFamily:'Crimson Pro,serif', fontSize:15 }}>
              {showSteps?'🙈 Hide Steps':'💡 Show Steps'}
            </button>
            <button onClick={() => setShowAnswer(true)} className="btn" style={{ flex:1, padding:'12px', background:`${col}20`, border:`1px solid ${col}44`, borderRadius:10, color:col, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:15 }}>Reveal ▶</button>
          </div>
        )}
        {showSteps && !showAnswer && (
          <div className="fade-up" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
            {question.steps.map((step, i) => (
              <div key={i} style={{ display:'flex', gap:10, marginBottom:i<question.steps.length-1?10:0 }}>
                <span style={{ color:`${col}77`, fontSize:11, fontFamily:'JetBrains Mono,monospace', minWidth:20, paddingTop:2 }}>{i+1}.</span>
                <span style={{ fontFamily:'Crimson Pro,serif', fontSize:15, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{step}</span>
              </div>
            ))}
          </div>
        )}
        {showAnswer && (
          <div className="fade-up">
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
              {question.steps.map((step, i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:i<question.steps.length-1?10:0 }}>
                  <span style={{ color:`${col}77`, fontSize:11, fontFamily:'JetBrains Mono,monospace', minWidth:20, paddingTop:2 }}>{i+1}.</span>
                  <span style={{ fontFamily:'Crimson Pro,serif', fontSize:15, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{ background:`linear-gradient(135deg,${col}18,${col}08)`, border:`1px solid ${col}44`, borderRadius:14, padding:'16px 20px', marginBottom:14, textAlign:'center' }}>
              <div style={{ fontSize:10, color:`${col}99`, textTransform:'uppercase', letterSpacing:'1.2px', fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>Answer</div>
              <KTex l={question.answerLatex||question.answer} style={{ color:col, fontSize:16 }} />
            </div>
            {question.tip && (
              <div style={{ background:'rgba(255,209,102,0.06)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:10 }}>
                <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
                <p style={{ fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:14, color:'rgba(255,209,102,0.85)', lineHeight:1.6 }}>{question.tip}</p>
              </div>
            )}
            <button onClick={next} className="btn" style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${col}40` }}>
              Next Question ⟶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quiz Screen ────────────────────────────────────────────────
function QuizScreen({ section, onPass, onFail, onBack }) {
  const col = ({Foundation:'#F59E0B', Core:'#D97706', Advanced:'#8B5CF6', Olympiad:'#EC4899'})[section.level] || ACCENT;
  const [baseSeed] = useState(() => Math.floor(Math.random() * 7777));
  const TOTAL = 4;
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const quizGen = QUIZ_GENERATORS[section.genKey] || (()=>({q:'Sample?',opts:['A','B','C','D'],correct:'A'}));
  const qSeed = baseSeed + qIdx * 113;
  const question = useCallback(() => quizGen(qSeed), [qSeed])();
  const opts = (question.opts||[]).slice(0,4);
  const correctAnswer = question.correct;
  const confirm = () => {
    if (selected === null) return;
    const correct = String(selected) === String(correctAnswer);
    setConfirmed(true);
    if (correct) setScore(s=>s+1);
    else setShakeKey(k=>k+1);
    setResults(r=>[...r, { correct, question: question.q }]);
  };
  const goNext = () => {
    if (qIdx+1>=TOTAL) setFinished(true);
    else { setQIdx(i=>i+1); setSelected(null); setConfirmed(false); }
  };
  if (finished) {
    const passed = score === TOTAL;
    return (
      <div style={{ minHeight:'100vh', background:'#0d0802', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', textAlign:'center' }}>
        <div className="pop-in" style={{ maxWidth:420, width:'100%' }}>
          {passed ? (
            <svg width="72" height="72" viewBox="0 0 72 72" style={{display:'block',margin:'0 auto'}}>
              <defs><radialGradient id="winGP" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={col} stopOpacity="0.25"/><stop offset="100%" stopColor={col} stopOpacity="0"/></radialGradient></defs>
              <circle cx="36" cy="36" r="36" fill="url(#winGP)"/>
              <path d="M24 36 L32 44 L48 28" fill="none" stroke={col} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="72" height="72" viewBox="0 0 72 72" style={{display:'block',margin:'0 auto'}}>
              <defs><radialGradient id="failGP" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EF4444" stopOpacity="0.25"/><stop offset="100%" stopColor="#EF4444" stopOpacity="0"/></radialGradient></defs>
              <circle cx="36" cy="36" r="36" fill="url(#failGP)"/>
              <circle cx="36" cy="36" r="28" fill="none" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.4"/>
              <text x="36" y="44" textAnchor="middle" fontSize="32" fontFamily="JetBrains Mono" fill="#EF4444">✗</text>
            </svg>
          )}
          <div style={{ marginTop:20, fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:28, color:passed?'#fff':'#EF4444', marginBottom:10 }}>
            {passed ? 'Topic Mastered! 🎯' : `${score}/4 Correct`}
          </div>
          <div style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.55)', marginBottom:24, lineHeight:1.6 }}>
            {passed ? `Perfect! You've unlocked the next topic.` : `Need 4/4 to advance. Review and retry.`}
          </div>
          {results.map((r,i)=> (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:r.correct?'rgba(245,158,11,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${r.correct?'rgba(245,158,11,0.2)':'rgba(239,68,68,0.2)'}`, borderRadius:8, marginBottom:6, textAlign:'left' }}>
              <span style={{ fontSize:16 }}>{r.correct?'✅':'❌'}</span>
              <span style={{ fontFamily:'Crimson Pro,serif', fontSize:13, color:'rgba(255,255,255,0.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Q{i+1}: {r.question?.substring(0,60)}</span>
            </div>
          ))}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20 }}>
            {passed ? (
              <button onClick={onPass} className="btn" style={{ padding:'14px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>Continue to Next Topic →</button>
            ) : (
              <button onClick={onFail} className="btn" style={{ padding:'14px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#FCA5A5', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>Review Topic & Retry</button>
            )}
            <button onClick={onBack} className="btn" style={{ padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', borderRadius:12, fontFamily:'Crimson Pro,serif', fontSize:15 }}>← Back to Topics</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ minHeight:'100vh', background:'#0d0802', paddingBottom:60 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(13,8,2,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>✕ Exit Quiz</button>
          <div style={{ flex:1, fontFamily:'Playfair Display,serif', fontSize:15, color:'#fff', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Mastery Quiz: {section.title}</div>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, color:col, flexShrink:0 }}>{qIdx+1}/{TOTAL}</div>
        </div>
        <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
          {Array.from({length:TOTAL},(_,i)=>(
            <div key={i} style={{ width:i===qIdx?28:10, height:10, borderRadius:5, background:i<qIdx?col:i===qIdx?col:'rgba(255,255,255,0.12)', transition:'all 0.3s ease', opacity:i<=qIdx?1:0.5 }} />
          ))}
        </div>
      </div>
      <div style={{ maxWidth:600, margin:'0 auto', padding:'24px 16px' }}>
        <div style={{ background:`${col}10`, border:`1px solid ${col}30`, borderRadius:10, padding:'8px 14px', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>🔐</span>
          <span style={{ fontFamily:'Crimson Pro,serif', fontSize:13, color:col, fontStyle:'italic' }}>Answer all {TOTAL} correctly to unlock the next topic.</span>
        </div>
        <div key={qIdx} className="fade-up" style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${col}30`, borderRadius:16, padding:'20px 20px 24px', marginBottom:18 }}>
          <div style={{ fontSize:10, color:`${col}99`, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:12 }}>Question {qIdx+1} of {TOTAL}</div>
          <p style={{ fontFamily:'Crimson Pro,serif', fontSize:17, color:'#e2e8f0', lineHeight:1.75, marginBottom:0 }}>{question.q}</p>
        </div>
        <div key={`opts-${shakeKey}`} style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }} className={confirmed && String(selected)!==String(correctAnswer)?'shake':''}>
          {opts.map((opt,i)=>{
            const isSelected = String(selected)===String(opt);
            const isCorrect = String(opt)===String(correctAnswer);
            let bg='rgba(255,255,255,0.04)',border='1px solid rgba(255,255,255,0.1)',color='rgba(255,255,255,0.8)';
            if(confirmed){
              if(isCorrect){bg='rgba(245,158,11,0.12)';border='1px solid rgba(245,158,11,0.5)';color='#FCD34D';}
              else if(isSelected){bg='rgba(239,68,68,0.12)';border='1px solid rgba(239,68,68,0.5)';color='#FCA5A5';}
            }else if(isSelected){bg=`${col}18`;border=`1px solid ${col}66`;color=col;}
            return (
              <button key={i} onClick={()=>!confirmed&&setSelected(opt)} disabled={confirmed}
                style={{ background:bg, border, borderRadius:12, padding:'14px 18px', textAlign:'left', color, fontFamily:'Crimson Pro,serif', fontSize:16, display:'flex', alignItems:'center', gap:12, cursor:confirmed?'default':'pointer', transition:'all 0.15s ease' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:isSelected&&!confirmed?`${col}25`:confirmed&&isCorrect?'rgba(245,158,11,0.2)':confirmed&&isSelected?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)', border:`1px solid ${isSelected&&!confirmed?col+'66':confirmed&&isCorrect?'rgba(245,158,11,0.5)':confirmed&&isSelected?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:'JetBrains Mono,monospace', flexShrink:0, color:isSelected&&!confirmed?col:confirmed&&isCorrect?'#FCD34D':confirmed&&isSelected?'#FCA5A5':'rgba(255,255,255,0.4)' }}>
                  {confirmed?(isCorrect?'✓':isSelected?'✗':['A','B','C','D'][i]):['A','B','C','D'][i]}
                </div>
                <span>{String(opt)}</span>
              </button>
            );
          })}
        </div>
        {confirmed && question.tip && (
          <div className="fade-up" style={{ background:'rgba(255,209,102,0.06)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:10 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
            <p style={{ fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:14, color:'rgba(255,209,102,0.85)', lineHeight:1.6 }}>{question.tip}</p>
          </div>
        )}
        {!confirmed? (
          <button onClick={confirm} disabled={selected===null} className="btn" style={{ width:'100%', padding:'14px', background:selected!==null?`linear-gradient(135deg,${col},${col}bb)`:'rgba(255,255,255,0.06)', border:selected!==null?'none':'1px solid rgba(255,255,255,0.1)', color:selected!==null?'#fff':'rgba(255,255,255,0.3)', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16, opacity:selected===null?0.6:1, cursor:selected===null?'not-allowed':'pointer' }}>
            Submit Answer
          </button>
        ):(
          <button onClick={goNext} className="btn" style={{ width:'100%', padding:'14px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>
            {qIdx+1<TOTAL?`Next Question (${qIdx+2}/${TOTAL}) →`:'See Results →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  useGlobalStyles();
  const [screen, setScreen] = useState('cover');
  const [activeIdx, setActiveIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState(new Set());
  const activeSection = SECTIONS[activeIdx];
  const nextSection = SECTIONS[activeIdx+1] || null;
  const handlePass = () => {
    setCompletedIds(prev => new Set([...prev, activeSection.id]));
    if (nextSection) { setActiveIdx(activeIdx+1); setScreen('learn'); }
    else setScreen('menu');
  };
  const handleFail = () => { setScreen('learn'); };
  if (screen === 'cover')    return <CoverScreen onNext={() => setScreen('notation')} />;
  if (screen === 'notation') return <NotationScreen onNext={() => setScreen('menu')} />;
  if (screen === 'menu')     return <SectionMenuScreen completedIds={completedIds} onSelect={sec => { setActiveIdx(SECTIONS.indexOf(sec)); setScreen('learn'); }} />;
  if (screen === 'learn')    return <SectionLearnScreen section={activeSection} onBack={() => setScreen('menu')} onPractice={() => setScreen('practice')} />;
  if (screen === 'practice') return <PracticeScreen section={activeSection} onBack={() => setScreen('learn')} onStartQuiz={() => setScreen('quiz')} />;
  if (screen === 'quiz')     return <QuizScreen section={activeSection} onPass={handlePass} onFail={handleFail} onBack={() => setScreen('menu')} />;
  return <CoverScreen onNext={() => setScreen('notation')} />;
}
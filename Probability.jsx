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
const ACCENT = '#10B981';

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

// ── Probability Tree SVG ───────────────────────────────────────
function ProbTreeSVG({ color=ACCENT, size=300 }) {
  const W=size, H=size*0.75;
  const nodes=[
    {x:W*0.1, y:H*0.5, label:'S', r:18},
    {x:W*0.4, y:H*0.2, label:'A', r:16},
    {x:W*0.4, y:H*0.8, label:'Aᶜ', r:16},
    {x:W*0.75, y:H*0.1, label:'B', r:14},
    {x:W*0.75, y:H*0.35, label:'Bᶜ', r:14},
    {x:W*0.75, y:H*0.65, label:'B', r:14},
    {x:W*0.75, y:H*0.9, label:'Bᶜ', r:14},
  ];
  const edges=[
    [0,1,'p'],[0,2,'1-p'],
    [1,3,'q'],[1,4,'1-q'],
    [2,5,'q'],[2,6,'1-q'],
  ];
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      {edges.map(([from,to,lbl],i)=>{
        const n1=nodes[from],n2=nodes[to];
        const mx=(n1.x+n2.x)/2, my=(n1.y+n2.y)/2;
        return(<g key={i}>
          <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke={`${color}44`} strokeWidth={1.5}/>
          <text x={mx-8} y={my-5} fill={`${color}cc`} fontSize={11} fontFamily="JetBrains Mono,monospace">{lbl}</text>
        </g>);
      })}
      {nodes.map((n,i)=>(
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={`${color}${i===0?'30':'18'}`} stroke={color} strokeWidth={1.5}/>
          <text x={n.x} y={n.y+4} textAnchor="middle" fill={color} fontSize={12} fontFamily="Playfair Display,serif" fontWeight="bold">{n.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Venn Diagram SVG ───────────────────────────────────────────
function VennSVG({ shade='union', color=ACCENT, size=280 }) {
  const W=size, H=size*0.65;
  const cx1=W*0.37, cx2=W*0.63, cy=H*0.5, r=H*0.42;
  const hi=color+'99', dim=color+'18';
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      <rect x={4} y={4} width={W-8} height={H-8} rx={10} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.12)" strokeWidth={1}/>
      <text x={W-12} y={18} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={11} fontFamily="serif" fontStyle="italic">S</text>
      {shade==='union'&&<><circle cx={cx1} cy={cy} r={r} fill={hi}/><circle cx={cx2} cy={cy} r={r} fill={hi}/></>}
      {shade==='intersection'&&<><circle cx={cx1} cy={cy} r={r} fill={dim}/><circle cx={cx2} cy={cy} r={r} fill={dim}/><ellipse cx={(cx1+cx2)/2} cy={cy} rx={r*0.32} ry={r*0.82} fill={hi}/></>}
      {shade==='complement'&&<><rect x={4} y={4} width={W-8} height={H-8} rx={10} fill={hi}/><circle cx={cx1} cy={cy} r={r} fill="rgba(7,9,15,0.75)"/></>}
      {shade==='diff'&&<><circle cx={cx1} cy={cy} r={r} fill={hi}/><ellipse cx={(cx1+cx2)/2} cy={cy} rx={r*0.32} ry={r*0.82} fill="rgba(7,9,15,0.75)"/></>}
      <circle cx={cx1} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2}/>
      <circle cx={cx2} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2}/>
      <text x={cx1-r*0.55} y={cy+5} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={14} fontFamily="Playfair Display,serif" fontWeight="bold">A</text>
      <text x={cx2+r*0.55} y={cy+5} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={14} fontFamily="Playfair Display,serif" fontWeight="bold">B</text>
    </svg>
  );
}

// ── Bar Chart SVG (for distributions) ──────────────────────────
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

// ── Trophy SVG ────────────────────────────────────────────────
function TrophySVG({ col=ACCENT }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="bgGP" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={col} stopOpacity="0.25"/><stop offset="100%" stopColor={col} stopOpacity="0"/></radialGradient>
        <linearGradient id="trGP" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#34D399"/><stop offset="50%" stopColor="#10B981"/><stop offset="100%" stopColor="#059669"/></linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#bgGP)"/>
      <circle cx="36" cy="36" r="32" fill="none" stroke={col} strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M24 18 h24 l-4 20 Q36 44 36 44 Q36 44 28 38 Z" fill="url(#trGP)" opacity="0.95"/>
      <path d="M24 22 Q16 22 16 30 Q16 36 24 36" fill="none" stroke="url(#trGP)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 22 Q56 22 56 30 Q56 36 48 36" fill="none" stroke="url(#trGP)" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="33" y="44" width="6" height="8" rx="1" fill="#10B981" opacity="0.9"/>
      <rect x="27" y="52" width="18" height="4" rx="2" fill="url(#trGP)"/>
      <polygon points="36,21 37.5,25.5 42,25.5 38.5,28 40,32.5 36,30 32,32.5 33.5,28 30,25.5 34.5,25.5" fill="#D1FAE5" opacity="0.95"/>
      <circle cx="16" cy="16" r="2.5" fill={col} opacity="0.9"/>
      <circle cx="56" cy="16" r="2" fill="#34D399" opacity="0.9"/>
      <circle cx="14" cy="48" r="1.8" fill="#059669" opacity="0.8"/>
      <circle cx="58" cy="48" r="2.2" fill={col} opacity="0.8"/>
      <circle cx="36" cy="10" r="2" fill="#34D399" opacity="0.7"/>
      <rect x="10" y="22" width="3" height="7" rx="1.5" fill="#6EE7B7" opacity="0.8" transform="rotate(-25 11.5 25.5)"/>
      <rect x="59" y="28" width="3" height="7" rx="1.5" fill="#A7F3D0" opacity="0.8" transform="rotate(20 60.5 31.5)"/>
    </svg>
  );
}
// ── Notation Table ─────────────────────────────────────────────
const NOTATION = [
  { sym:'S\\text{ or }\\Omega', name:'Sample Space', meaning:'Set of ALL possible outcomes of an experiment', ex:'S=\\{H,T\\}\\text{ for a coin flip}' },
  { sym:'P(A)', name:'Probability of event A', meaning:'A number in [0,1] measuring likelihood', ex:'P(\\text{head})=0.5' },
  { sym:"A'\\text{ or }A^c", name:'Complement of A', meaning:'All outcomes NOT in A', ex:"P(A')=1-P(A)" },
  { sym:'A\\cup B', name:'Union (A OR B)', meaning:'At least one of A or B occurs', ex:'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)' },
  { sym:'A\\cap B', name:'Intersection (A AND B)', meaning:'Both A and B occur simultaneously', ex:'P(A\\cap B)=P(A)\\cdot P(B)\\text{ if indep.}' },
  { sym:'P(A|B)', name:'Conditional Probability', meaning:'P of A given that B has already occurred', ex:'P(A|B)=\\dfrac{P(A\\cap B)}{P(B)}' },
  { sym:'P(A\\cup B)', name:'Addition Rule', meaning:'P(A)+P(B)−P(A∩B)', ex:'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)' },
  { sym:'A\\perp B', name:'Independence', meaning:'P(A∩B)=P(A)·P(B) — knowing B gives no info about A', ex:'Two fair dice: outcomes are independent' },
  { sym:"P(A)=\\sum_i P(A|B_i)P(B_i)", name:'Law of Total Probability', meaning:'Break A into cases via partition {Bᵢ}', ex:"P(\\text{win})=P(\\text{win}|\\text{rain})P(\\text{rain})+\\cdots" },
  { sym:"P(B_i|A)=\\dfrac{P(A|B_i)P(B_i)}{P(A)}", name:"Bayes' Theorem", meaning:'Update prior P(Bᵢ) given evidence A', ex:'\\text{Medical testing, spam filters}' },
  { sym:'X\\sim\\text{Bin}(n,p)', name:'Binomial Distribution', meaning:'n independent trials, success prob p', ex:'P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}' },
  { sym:'X\\sim\\text{Poi}(\\lambda)', name:'Poisson Distribution', meaning:'Events in fixed interval, avg rate λ', ex:'P(X=k)=\\dfrac{e^{-\\lambda}\\lambda^k}{k!}' },
  { sym:'E[X]', name:'Expected Value', meaning:'Weighted average outcome (long-run mean)', ex:'E[X]=\\sum x\\cdot P(X=x)' },
  { sym:'\\text{Var}(X)=E[X^2]-(E[X])^2', name:'Variance', meaning:'Spread of distribution around the mean', ex:'\\text{Var}(X)=E[(X-\\mu)^2]' },
  { sym:'\\sigma=\\sqrt{\\text{Var}(X)}', name:'Standard Deviation', meaning:'Square root of variance — same units as X', ex:'\\sigma_X=\\sqrt{np(1-p)}\\text{ for Binomial}' },
  { sym:'F(x)=P(X\\leq x)', name:'CDF (Cumulative Dist. Function)', meaning:'P that X is at most x', ex:'F(x)=\\int_{-\\infty}^{x}f(t)dt\\text{ (continuous)}' },
  { sym:'D_n=n!\\sum_{k=0}^{n}\\dfrac{(-1)^k}{k!}', name:'Derangements', meaning:'Permutations with no fixed points', ex:'D_3=2,\\;D_4=9' },
  { sym:'P(|\\bar{X}-\\mu|>\\varepsilon)\\to 0', name:'Law of Large Numbers', meaning:'Sample mean converges to population mean', ex:'\\text{Long run frequency}\\to\\text{true prob.}' },
  { sym:'\\dfrac{\\bar{X}-\\mu}{\\sigma/\\sqrt{n}}\\to N(0,1)', name:'Central Limit Theorem', meaning:'Sum of iid variables → Normal distribution', ex:'\\text{Large }n\\text{: binomial}\\approx\\text{normal}' },
  { sym:'\\phi_X(t)=E[e^{itX}]', name:'Characteristic Function', meaning:'Fourier transform of the distribution', ex:'\\phi_{X+Y}=\\phi_X\\cdot\\phi_Y\\text{ (indep.)}' },
  { sym:'G_X(z)=E[z^X]', name:'Probability Generating Function', meaning:'Power series encoding PMF', ex:'G_{\\text{Bin}}(z)=(q+pz)^n' },
  { sym:'P(A_1\\cap\\cdots\\cap A_n)', name:'Inclusion-Exclusion (PIE)', meaning:'Alternating sum of single, pairs, triples…', ex:'P(A\\cup B\\cup C)=\\sum P(A_i)-\\sum P(A_i\\cap A_j)+\\cdots' },
];

// ── Sections ───────────────────────────────────────────────────
const SECTIONS = [
  {
    id:'terminology', title:'Sample Space, Events & Axioms', level:'Foundation', color:'#10B981', icon:'S',
    shortDef:'A sample space S contains all possible outcomes. An event is any subset of S. Probability satisfies P(S)=1, P(A)≥0, and additivity.',
    fullDef:"Probability theory begins with a sample space S — the universal set of all possible outcomes. Any subset A⊆S is an event. Kolmogorov's axioms (1933) form the foundation: (1) P(A)≥0 for all events A, (2) P(S)=1, (3) For mutually exclusive events, P(A∪B)=P(A)+P(B). From these three axioms, all of probability theory follows. Mutually exclusive events cannot happen simultaneously (A∩B=∅). Exhaustive events cover the whole sample space (A∪B=S).",
    keyFacts:[
      {text:'Axiom 1: Non-negativity', l:'P(A)\\geq 0\\text{ for all events }A'},
      {text:'Axiom 2: Certainty', l:'P(S)=1'},
      {text:'Axiom 3: Additivity', l:'A\\cap B=\\emptyset\\Rightarrow P(A\\cup B)=P(A)+P(B)'},
      {text:'Mutually exclusive', l:'A\\cap B=\\emptyset\\Leftrightarrow A,B\\text{ mutually exclusive}'},
      {text:'Exhaustive events', l:'A\\cup B=S\\Leftrightarrow A,B\\text{ exhaustive}'},
      {text:'Complement rule', l:"P(A')=1-P(A)"},
    ], genKey:'terminology', diagram:'venn', diagramShade:'union',
  },
  {
    id:'classical', title:'Classical & Empirical Probability', level:'Foundation', color:'#059669', icon:'n/N',
    shortDef:'Classical: P(A) = (favourable outcomes)/(total equally likely outcomes). Empirical: P(A) ≈ frequency/total trials.',
    fullDef:"Classical probability assumes all outcomes are equally likely: P(A) = n(A)/n(S). This is the 'theoretical' approach valid for fair coins, dice, cards. Empirical probability estimates P(A) from observed data: P(A) ≈ (number of times A occurred)/(total trials). The Law of Large Numbers guarantees these converge as the number of trials grows. For large n, relative frequency ≈ true probability. These two approaches together cover most introductory problems.",
    keyFacts:[
      {text:'Classical formula', l:'P(A)=\\dfrac{n(A)}{n(S)}=\\dfrac{\\text{favourable outcomes}}{\\text{total outcomes}}'},
      {text:'Empirical formula', l:'P(A)\\approx\\dfrac{f_A}{n}\\text{ where }f_A=\\text{frequency of }A'},
      {text:'Range of probability', l:'0\\leq P(A)\\leq 1\\text{ always}'},
      {text:'Impossible event', l:'P(\\emptyset)=0'},
      {text:'Certain event', l:'P(S)=1'},
      {text:'Convergence (LLN)', l:'\\dfrac{f_A}{n}\\to P(A)\\text{ as }n\\to\\infty'},
    ], genKey:'classical',
  },
  {
    id:'addition_rule', title:'Addition Rule & Complementary Events', level:'Foundation', color:'#34D399', icon:'P(A∪B)',
    shortDef:'P(A∪B) = P(A)+P(B)−P(A∩B). For mutually exclusive events: P(A∪B) = P(A)+P(B).',
    fullDef:"The addition rule handles the probability of 'OR' events. When we add P(A)+P(B), we count A∩B twice, so subtract it once: P(A∪B) = P(A)+P(B)−P(A∩B). For mutually exclusive events (A∩B=∅), this simplifies to P(A)+P(B). The complementary rule follows from Axiom 3: P(A)+P(A')=P(S)=1, so P(A')=1−P(A). Often it is easier to compute P(A') and subtract from 1 (the 'complement trick').",
    keyFacts:[
      {text:'General Addition Rule', l:'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)'},
      {text:'Mutually exclusive case', l:'A\\cap B=\\emptyset\\Rightarrow P(A\\cup B)=P(A)+P(B)'},
      {text:'Three events (PIE)', l:'P(A\\cup B\\cup C)=\\sum P(A_i)-\\sum P(A_i\\cap A_j)+P(A\\cap B\\cap C)'},
      {text:'Complementary rule', l:"P(A')=1-P(A)"},
      {text:'Complement trick', l:"P(\\text{at least one})=1-P(\\text{none})"},
      {text:'Subadditivity', l:"P(A\\cup B)\\leq P(A)+P(B)\\;(\\text{Boole's inequality})"},
    ], genKey:'addition_rule', diagram:'venn', diagramShade:'union',
  },
  {
    id:'multiplication', title:'Multiplication Rule & Independence', level:'Foundation', color:'#6EE7B7', icon:'P(A∩B)',
    shortDef:'P(A∩B) = P(A)·P(B|A). If independent: P(A∩B) = P(A)·P(B).',
    fullDef:"The multiplication rule computes 'AND' probabilities. In general: P(A∩B) = P(A)·P(B|A). Events A and B are independent when knowing B tells you nothing about A: P(A|B) = P(A), which is equivalent to P(A∩B) = P(A)·P(B). Independence is a mathematical property — it must be verified, not assumed! For multiple independent events: P(A₁∩A₂∩…∩Aₙ) = P(A₁)·P(A₂)·…·P(Aₙ).",
    keyFacts:[
      {text:'Multiplication rule (general)', l:'P(A\\cap B)=P(A)\\cdot P(B|A)=P(B)\\cdot P(A|B)'},
      {text:'Independent events', l:'A\\perp B\\Leftrightarrow P(A\\cap B)=P(A)\\cdot P(B)'},
      {text:'Independence test', l:'P(A|B)=P(A)\\Leftrightarrow A,B\\text{ independent}'},
      {text:'n independent events', l:'P\\left(\\bigcap_{i=1}^n A_i\\right)=\\prod_{i=1}^n P(A_i)'},
      {text:'Mutually exclusive ≠ independent', l:'A\\cap B=\\emptyset\\Rightarrow\\text{NOT independent (unless }P(A)=0\\text{)}'},
    ], genKey:'multiplication',
  },
  {
    id:'conditional', title:'Conditional Probability', level:'Intermediate', color:'#F59E0B', icon:'P(A|B)',
    shortDef:'P(A|B) = P(A∩B)/P(B). The probability of A given that B has occurred — B is now our new sample space.',
    fullDef:"Conditional probability P(A|B) updates the probability of A once we know B occurred. Geometrically: restrict the sample space to B, then find the fraction occupied by A∩B. This is the foundation for Bayes' theorem, the chain rule, and all of statistical inference. Key properties: P(·|B) is itself a valid probability measure. The chain rule extends it: P(A∩B∩C) = P(A)·P(B|A)·P(C|A∩B). Always check whether P(B)>0 before conditioning on B.",
    keyFacts:[
      {text:'Definition', l:'P(A|B)=\\dfrac{P(A\\cap B)}{P(B)},\\;P(B)>0'},
      {text:'Multiplication form', l:'P(A\\cap B)=P(A|B)\\cdot P(B)'},
      {text:'Chain rule (3 events)', l:'P(A\\cap B\\cap C)=P(A)P(B|A)P(C|A\\cap B)'},
      {text:'P(·|B) is a prob. measure', l:'P(S|B)=1,\\;P(A|B)\\geq 0'},
      {text:'If A⊆B', l:'P(A|B)=P(A)/P(B)\\geq P(A)'},
    ], genKey:'conditional', diagram:'venn', diagramShade:'intersection',
  },
  {
    id:'bayes', title:"Bayes' Theorem", level:'Intermediate', color:'#D97706', icon:'P(B|A)',
    shortDef:"P(Bᵢ|A) = P(A|Bᵢ)P(Bᵢ)/P(A). Reverse conditional — update beliefs given evidence.",
    fullDef:"Bayes' Theorem (1763) is the engine of statistical inference. Given a partition {B₁,…,Bₙ} of S and evidence A, it computes the 'posterior' P(Bᵢ|A) from the 'prior' P(Bᵢ) and 'likelihood' P(A|Bᵢ). The denominator P(A) = ΣP(A|Bᵢ)P(Bᵢ) is the Law of Total Probability. Applications: medical testing (false positive rate), spam filters, machine learning, forensic evidence, Monty Hall Problem.",
    keyFacts:[
      {text:"Bayes' Theorem (2 events)", l:"P(B|A)=\\dfrac{P(A|B)P(B)}{P(A)}"},
      {text:'Full form with partition', l:"P(B_i|A)=\\dfrac{P(A|B_i)P(B_i)}{\\sum_j P(A|B_j)P(B_j)}"},
      {text:'Law of Total Probability', l:"P(A)=\\sum_i P(A|B_i)P(B_i)"},
      {text:'Prior → Posterior update', l:'P(B_i|A)\\propto P(A|B_i)\\cdot P(B_i)'},
      {text:'Sensitivity & specificity', l:'\\text{True Positive Rate}=P(\\text{test}+|\\text{disease}+)'},
    ], genKey:'bayes', diagram:'tree',
  },
  {
    id:'random_vars', title:'Random Variables & Distributions', level:'Intermediate', color:'#EF4444', icon:'X',
    shortDef:'A random variable X maps outcomes to numbers. PMF (discrete) or PDF (continuous) describes the distribution.',
    fullDef:"A random variable X: S→ℝ assigns a number to each outcome. Discrete RVs have a Probability Mass Function (PMF): P(X=k). Continuous RVs have a Probability Density Function (PDF): f(x), where P(a≤X≤b) = ∫f(x)dx. The CDF F(x)=P(X≤x) works for both. Key discrete distributions: Bernoulli (single trial), Binomial (n trials), Geometric (trials until first success), Poisson (rare events). Key continuous: Normal (bell curve), Exponential (waiting times), Uniform.",
    keyFacts:[
      {text:'PMF (discrete)', l:'P(X=k)\\geq 0,\\;\\sum_k P(X=k)=1'},
      {text:'PDF (continuous)', l:'f(x)\\geq 0,\\;\\int_{-\\infty}^{\\infty}f(x)dx=1'},
      {text:'CDF', l:'F(x)=P(X\\leq x)'},
      {text:'Binomial', l:'X\\sim\\text{Bin}(n,p):\\;P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}'},
      {text:'Poisson', l:'X\\sim\\text{Poi}(\\lambda):\\;P(X=k)=\\frac{e^{-\\lambda}\\lambda^k}{k!}'},
      {text:'Normal', l:'X\\sim N(\\mu,\\sigma^2):\\;f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}'},
    ], genKey:'random_vars', diagram:'bar',
  },
  {
    id:'expectation', title:'Expectation & Variance', level:'Intermediate', color:'#DC2626', icon:'E[X]',
    shortDef:'E[X] = Σ x·P(X=x). Var(X) = E[X²]−(E[X])². Linearity: E[aX+b] = aE[X]+b.',
    fullDef:"Expected value E[X] is the probability-weighted average of all possible values — the 'long-run average'. It is linear: E[aX+bY] = aE[X]+bE[Y] always (even if X,Y are dependent). Variance Var(X)=E[(X−μ)²]=E[X²]−μ² measures spread. For independent X,Y: Var(X+Y)=Var(X)+Var(Y). The standard deviation σ=√Var(X) has the same units as X. Law of Total Expectation: E[X]=E[E[X|Y]] — average over all possible values of Y.",
    keyFacts:[
      {text:'E[X] (discrete)', l:'E[X]=\\sum_x x\\cdot P(X=x)'},
      {text:'Linearity', l:'E[aX+bY]=aE[X]+bE[Y]\\text{ (always)}'},
      {text:'Variance formula', l:'\\text{Var}(X)=E[X^2]-(E[X])^2'},
      {text:'Var for independent', l:'\\text{Var}(X+Y)=\\text{Var}(X)+\\text{Var}(Y)\\text{ (indep.)}'},
      {text:'Binomial moments', l:'E[\\text{Bin}(n,p)]=np,\\;\\text{Var}=np(1-p)'},
      {text:'Law of Total Expectation', l:'E[X]=E[E[X|Y]]'},
    ], genKey:'expectation',
  },
  {
    id:'combinatorial', title:'Combinatorial Probability & PIE', level:'Olympiad', color:'#7C3AED', icon:'PIE',
    shortDef:'Use counting techniques — combinations, PIE, derangements — to compute probabilities of complex events.',
    fullDef:"Many probability problems reduce to counting. The Principle of Inclusion-Exclusion (PIE): P(A₁∪…∪Aₙ) = ΣP(Aᵢ) − ΣP(Aᵢ∩Aⱼ) + …. Derangements Dₙ = n!·Σ(−1)ᵏ/k! count permutations with no fixed points — the probability a random permutation is a derangement approaches 1/e ≈ 0.368. The Pigeonhole Principle: if n+1 objects are in n boxes, some box has ≥2 objects — useful for guaranteeing collisions.",
    keyFacts:[
      {text:'PIE for 3 events', l:'P(A\\cup B\\cup C)=\\sum P(A_i)-\\sum P(A_i\\cap A_j)+P(A\\cap B\\cap C)'},
      {text:'Derangement formula', l:'D_n=n!\\sum_{k=0}^{n}\\frac{(-1)^k}{k!}\\approx n!/e'},
      {text:'P(derangement) → 1/e', l:'P(\\text{derangement})=\\sum_{k=0}^{n}\\frac{(-1)^k}{k!}\\to\\frac{1}{e}\\approx 0.3679'},
      {text:'Pigeonhole (probability)', l:'n+1\\text{ items in }n\\text{ boxes}\\Rightarrow\\text{ some box has }\\geq 2'},
      {text:'Birthday problem', l:'P(\\text{match})=1-\\frac{365\\cdot364\\cdots(365-n+1)}{365^n}'},
    ], genKey:'combinatorial',
  },
  {
    id:'geometric_prob', title:'Geometric Probability', level:'Olympiad', color:'#5B21B6', icon:'Area',
    shortDef:'P(A) = (length/area/volume of A)/(total measure). Used when outcomes are continuous points in space.',
    fullDef:"Geometric probability extends probability to continuous spaces. P(A) = (measure of favorable region)/(measure of total region), where 'measure' is length, area, or volume. Classic problems: Bertrand's paradox (choose a random chord of a circle — the answer depends on how 'random' is defined!), Buffon's Needle (P(needle crosses a line) = 2L/πd), and the 'meeting problem' (two people arrive uniformly in [0,60] — what is P(they overlap for ≥t minutes)?). These problems develop geometric intuition for probability.",
    keyFacts:[
      {text:'General formula', l:'P(A)=\\dfrac{\\text{measure of }A}{\\text{measure of }S}'},
      {text:"Buffon's Needle", l:"P(\\text{cross})=\\frac{2L}{\\pi d}\\;(L\\leq d)"},
      {text:'Meeting problem setup', l:'\\text{P(meet)}=1-\\left(\\frac{60-t}{60}\\right)^2'},
      {text:"Bertrand's paradox insight", l:'\\text{Answer depends on the definition of }\\text{"random chord"}'},
      {text:'Uniform distribution', l:'X\\sim\\text{Unif}[a,b]:\\;P(X\\in[c,d])=\\frac{d-c}{b-a}'},
    ], genKey:'geometric_prob',
  },
  {
    id:'gen_functions', title:'Generating Functions for Probability', level:'Olympiad', color:'#4F46E5', icon:'G(z)',
    shortDef:"PGF G_X(z) = E[z^X] = Σ P(X=k)·zᵏ. Encode the full distribution; G_X(1)=1, G'_X(1)=E[X].",
    fullDef:"The Probability Generating Function (PGF) G_X(z) = E[zˣ] = ΣP(X=k)zᵏ encodes the entire distribution in a single function. Key properties: G_X(1)=1 (sum of probabilities), G'_X(1)=E[X], G''_X(1)=E[X(X-1)]. For independent X,Y: G_{X+Y}(z) = G_X(z)·G_Y(z) — convolution becomes multiplication! This makes PGFs powerful for sums of independent random variables. Binomial PGF: (q+pz)ⁿ. Poisson PGF: e^{λ(z-1)}.",
    keyFacts:[
      {text:'Definition', l:'G_X(z)=E[z^X]=\\sum_{k=0}^{\\infty}P(X=k)z^k'},
      {text:'Moments from PGF', l:"G_X(1)=1,\\;G_X'(1)=E[X],\\;G_X''(1)=E[X(X-1)]"},
      {text:'Sum of independent', l:'G_{X+Y}(z)=G_X(z)\\cdot G_Y(z)'},
      {text:'Binomial PGF', l:'G_{\\text{Bin}(n,p)}(z)=(q+pz)^n'},
      {text:'Poisson PGF', l:'G_{\\text{Poi}(\\lambda)}(z)=e^{\\lambda(z-1)}'},
      {text:'Geometric PGF', l:'G_{\\text{Geom}(p)}(z)=\\dfrac{pz}{1-(1-p)z}'},
    ], genKey:'gen_functions',
  },
  {
    id:'markov', title:'Random Walks & Markov Chains', level:'Olympiad', color:'#3730A3', icon:'Mₙ',
    shortDef:'A Markov chain has P(Xₙ₊₁|X₁,…,Xₙ) = P(Xₙ₊₁|Xₙ) — the future depends only on the present.',
    fullDef:"A random walk on ℤ moves +1 with prob p or −1 with prob q=1−p at each step. Simple random walk (p=q=½) is symmetric and recurrent on ℤ (returns to 0 with probability 1) but transient in ℝ³. Markov chains generalize this: the next state depends only on the current state (Markov property). Key concepts: transition matrix P, stationary distribution π satisfying πP=π, absorption probabilities for absorbing states (Gambler's Ruin), and the Gambler's Ruin formula P(ruin|start at k) = (qᵏ−(q/p)ᵏ·pᵏ)/(…) depending on p vs q.",
    keyFacts:[
      {text:'Markov property', l:'P(X_{n+1}=j|X_n=i,X_{n-1},\\ldots)=P(X_{n+1}=j|X_n=i)=p_{ij}'},
      {text:'Stationary distribution', l:'\\pi P=\\pi,\\;\\sum_i \\pi_i=1'},
      {text:"Gambler's Ruin (p≠q)", l:'P(\\text{ruin from }k)=\\dfrac{(q/p)^k-(q/p)^N}{1-(q/p)^N}'},
      {text:"Gambler's Ruin (p=q=½)", l:'P(\\text{ruin from }k)=1-k/N'},
      {text:'Simple random walk: recurrent', l:'P(\\text{return to 0})=1\\text{ (on }\\mathbb{Z}\\text{)}'},
    ], genKey:'markov',
  },
  {
    id:'limit_theorems', title:'Law of Large Numbers & CLT', level:'Olympiad', color:'#1D4ED8', icon:'→N',
    shortDef:'LLN: X̄ₙ → μ as n→∞. CLT: (X̄ₙ−μ)/(σ/√n) → N(0,1) — sample means are approximately Normal.',
    fullDef:"The Law of Large Numbers (LLN) says the sample mean X̄ₙ converges to the true mean μ as n→∞. The weak LLN gives convergence in probability; the strong LLN gives almost sure convergence. The Central Limit Theorem (CLT) — arguably the most important theorem in probability — says the standardized sum (ΣXᵢ − nμ)/(σ√n) converges in distribution to N(0,1), regardless of the original distribution (provided finite variance). This explains why the Normal distribution appears everywhere in nature and allows confidence intervals and hypothesis testing.",
    keyFacts:[
      {text:'Weak Law of Large Numbers', l:'P\\left(|\\bar{X}_n-\\mu|>\\varepsilon\\right)\\to 0\\text{ for all }\\varepsilon>0'},
      {text:'CLT statement', l:'\\frac{\\bar{X}_n-\\mu}{\\sigma/\\sqrt{n}}\\xrightarrow{d} N(0,1)'},
      {text:"Chebyshev's inequality (LLN proof)", l:"P(|X-\\mu|\\geq k\\sigma)\\leq\\frac{1}{k^2}"},
      {text:'CLT for Binomial (normal approx)', l:'\\text{Bin}(n,p)\\approx N(np,np(1-p))\\;(\\text{large }n)'},
      {text:'Continuity correction', l:'P(X\\leq k)\\approx\\Phi\\left(\\frac{k+0.5-np}{\\sqrt{np(1-p)}}\\right)'},
    ], genKey:'limit_theorems',
  },
  {
    id:'paradoxes', title:'Classic Paradoxes & Counter-Intuitions', level:'Olympiad', color:'#0E7490', icon:'!?',
    shortDef:"Birthday Paradox, Monty Hall Problem, Gambler's Ruin, Two Envelopes — probability surprises our intuition.",
    fullDef:"Classic probability paradoxes build deep intuition. The Birthday Paradox: with just 23 people, P(two share birthday) > 50%! The Monty Hall Problem: switching doors doubles your win probability (2/3 vs 1/3) — most people get this wrong. The Two Envelopes Paradox: seemingly always switching envelopes is better, yet the strategy is undefined. Simpson's Paradox: a trend can appear in several groups but reverse when groups are combined. These paradoxes train you to think precisely about sample spaces, conditioning, and what question is actually being asked.",
    keyFacts:[
      {text:'Birthday paradox (n people)', l:'P(\\text{match})=1-\\frac{365!}{(365-n)!\\cdot365^n}\\;(>50\\%\\text{ at }n=23)'},
      {text:'Monty Hall: switch wins', l:'P(\\text{win}|\\text{switch})=\\frac{2}{3},\\;P(\\text{win}|\\text{stay})=\\frac{1}{3}'},
      {text:'Monty Hall via Bayes', l:'P(\\text{car at C}|\\text{host opens B})=\\frac{2}{3}'},
      {text:"St. Petersburg paradox", l:'E[\\text{payoff}]=\\sum_{k=1}^{\\infty}2^k\\cdot\\frac{1}{2^k}=\\infty'},
      {text:"Simpson's paradox", l:'\\text{Trend in subgroups reverses in combined data}'},
    ], genKey:'paradoxes',
  },
];
// ── Practice Generators ────────────────────────────────────────
const GENERATORS = {
  terminology:(n)=>{
    const templates=[
      (s)=>{const total=srI(s,4,12),fav=srI(s+1,1,total-1);const p=fav/total;return{question:`A bag has ${total} balls. ${fav} are red. What is P(red)?`,questionLatex:`P(\\text{red})=?\\quad(${fav}\\text{ red, }${total}\\text{ total})`,steps:[`P(A) = favourable / total`,`P(red) = ${fav}/${total} = ${fmt(p,4)}`],answer:`${fav}/${total} = ${fmt(p,4)}`,answerLatex:`\\dfrac{${fav}}{${total}}=${fmt(p,4)}`,tip:'P(A) = n(A)/n(S). Always check the denominator is the TOTAL sample space.'};},
      (s)=>{const pA=srI(s,2,7)/10,pB=srI(s+1,1,10-pA*10)/10;return{question:`P(A)=${fmt(pA,1)}, P(B)=${fmt(pB,1)}, A and B are mutually exclusive. Find P(A∪B).`,questionLatex:`P(A)=${fmt(pA,1)},\\;P(B)=${fmt(pB,1)},\\;A\\cap B=\\emptyset.\\;P(A\\cup B)=?`,steps:[`Mutually exclusive: A∩B=∅`,`P(A∪B) = P(A)+P(B) = ${fmt(pA,1)}+${fmt(pB,1)} = ${fmt(pA+pB,1)}`],answer:`${fmt(pA+pB,1)}`,answerLatex:`P(A\\cup B)=${fmt(pA+pB,1)}`,tip:'For mutually exclusive events: P(A∪B)=P(A)+P(B). No double counting needed.'};},
      (s)=>{const pA=srI(s,3,7)/10;return{question:`P(A) = ${fmt(pA,1)}. Find P(A').`,questionLatex:`P(A)=${fmt(pA,1)}.\\;P(A')=?`,steps:[`Complement rule: P(A')+P(A)=1`,`P(A') = 1 − ${fmt(pA,1)} = ${fmt(1-pA,1)}`],answer:`${fmt(1-pA,1)}`,answerLatex:`P(A')=1-${fmt(pA,1)}=${fmt(1-pA,1)}`,tip:"P(A')=1−P(A). The complement trick: often easier to find P(NOT A) then subtract."};},
    ];
    const t=templates[n%templates.length](n*31+7);
    return{...t};
  },
  classical:(n)=>{
    const templates=[
      (s)=>{const faces=6,target=srI(s,1,6);const p=1/faces;return{question:`A fair die is rolled. What is P(getting ${target})?`,questionLatex:`P(\\text{getting }${target})=?`,steps:[`Sample space: {1,2,3,4,5,6}, n(S)=6`,`Favourable: {${target}}, n(A)=1`,`P(${target}) = 1/6 ≈ ${fmt(p,4)}`],answer:`1/6 ≈ ${fmt(p,4)}`,answerLatex:`\\frac{1}{6}\\approx${fmt(p,4)}`,tip:'Classical: all outcomes equally likely. Count carefully!'};},
      (s)=>{const n_=srI(s,20,50),k=srI(s+1,2,8);const p=C(n_,k)/Math.pow(n_,k);return{question:`${k} cards are drawn (with replacement) from a 52-card deck. Empirically, in ${n_} trials, event A occurred ${k} times. Estimate P(A).`,questionLatex:`\\hat{P}(A)=\\frac{${k}}{${n_}}=?`,steps:[`Empirical probability: P(A) ≈ frequency/trials`,`P(A) ≈ ${k}/${n_} = ${fmt(k/n_,4)}`],answer:`${fmt(k/n_,4)}`,answerLatex:`\\hat{P}(A)=\\frac{${k}}{${n_}}=${fmt(k/n_,4)}`,tip:'Empirical P = relative frequency. As n→∞ this converges to true probability (LLN).'};},
      (s)=>{const n_=srI(s,5,10),r=srI(s+1,2,Math.min(n_,4));const total=C(n_,r);const fav=C(srI(s+2,2,Math.min(n_-1,5)),r-1)*C(n_-srI(s+2,2,Math.min(n_-1,5)),1);const p=C(Math.floor(n_/2),r)/total;return{question:`${r} people are chosen from a group of ${n_}. Total ways = C(${n_},${r})=${total}. If ${Math.floor(n_/2)} are women, find P(all chosen are women).`,questionLatex:`P(\\text{all women from }${n_})=?`,steps:[`Total ways: C(${n_},${r})=${total}`,`Women ways: C(${Math.floor(n_/2)},${r})=${C(Math.floor(n_/2),r)}`,`P = ${C(Math.floor(n_/2),r)}/${total} = ${fmt(C(Math.floor(n_/2),r)/total,4)}`],answer:`${fmt(C(Math.floor(n_/2),r)/total,4)}`,answerLatex:`\\frac{\\binom{${Math.floor(n_/2)}}{${r}}}{\\binom{${n_}}{${r}}}=${fmt(C(Math.floor(n_/2),r)/total,4)}`,tip:'Combinatorial probability: count favourable arrangements / total arrangements.'};},
    ];
    const t=templates[n%templates.length](n*37+11);
    return{...t};
  },
  addition_rule:(n)=>{
    const templates=[
      (s)=>{const pA=srI(s,2,5)/10,pB=srI(s+1,2,5)/10,pAB=srI(s+2,1,Math.floor(Math.min(pA,pB)*10))/10;return{question:`P(A)=${pA}, P(B)=${pB}, P(A∩B)=${pAB}. Find P(A∪B).`,questionLatex:`P(A)=${pA},P(B)=${pB},P(A\\cap B)=${pAB}.\\;P(A\\cup B)=?`,steps:[`Addition Rule: P(A∪B)=P(A)+P(B)−P(A∩B)`,`=${pA}+${pB}−${pAB}=${fmt(pA+pB-pAB,1)}`],answer:`${fmt(pA+pB-pAB,1)}`,answerLatex:`P(A\\cup B)=${fmt(pA+pB-pAB,1)}`,tip:'Always subtract the intersection once — it was counted twice in P(A)+P(B).'};},
      (s)=>{const pA=srI(s,3,6)/10;return{question:`P(A)=${pA}. Find P(at least A).`,questionLatex:`P(A)=${pA}.\\;P(A')=?`,steps:[`Complement: P(A')=1−P(A)=1−${pA}=${fmt(1-pA,1)}`],answer:`P(A')=${fmt(1-pA,1)}`,answerLatex:`P(A')=${fmt(1-pA,1)}`,tip:"P(at least one) = 1 − P(none). The complement trick saves effort."};},
      (s)=>{const p1=srI(s,2,4)/10,p2=srI(s+1,2,4)/10,p3=srI(s+2,1,3)/10;const p12=p1*p2,p13=p1*p3,p23=p2*p3,p123=p1*p2*p3;return{question:`Three independent events A, B, C with P(A)=${p1}, P(B)=${p2}, P(C)=${p3}. Find P(A∪B∪C).`,questionLatex:`P(A\\cup B\\cup C)=?\\;(\\text{independent})`,steps:[`PIE: P(A∪B∪C)=P(A)+P(B)+P(C)−P(A∩B)−P(B∩C)−P(A∩C)+P(A∩B∩C)`,`=${p1}+${p2}+${p3}−${fmt(p12,4)}−${fmt(p23,4)}−${fmt(p13,4)}+${fmt(p123,4)}`,`=${fmt(p1+p2+p3-p12-p23-p13+p123,4)}`],answer:`${fmt(p1+p2+p3-p12-p23-p13+p123,4)}`,answerLatex:`${fmt(p1+p2+p3-p12-p23-p13+p123,4)}`,tip:'For independent events: P(Aᵢ∩Aⱼ)=P(Aᵢ)·P(Aⱼ). Or use 1−P(none)=1−(1−p1)(1−p2)(1−p3).'};},
    ];
    const t=templates[n%templates.length](n*41+13);
    return{...t};
  },
  multiplication:(n)=>{
    const templates=[
      (s)=>{const p1=srI(s,1,4)/10+0.5,p2=srI(s+1,2,5)/10;return{question:`Two independent events: P(A)=${fmt(p1,1)}, P(B)=${fmt(p2,1)}. Find P(A∩B).`,questionLatex:`P(A)=${fmt(p1,1)},P(B)=${fmt(p2,1)},\\text{independent.}\\;P(A\\cap B)=?`,steps:[`Independent: P(A∩B)=P(A)·P(B)`,`=${fmt(p1,1)}×${fmt(p2,1)}=${fmt(p1*p2,4)}`],answer:`${fmt(p1*p2,4)}`,answerLatex:`P(A\\cap B)=${fmt(p1*p2,4)}`,tip:'Independent events: multiply. Dependent events: use P(A∩B)=P(A)·P(B|A).'};},
      (s)=>{const n_=srI(s,5,10),k=srI(s+1,2,4);const p=1/n_,pChain=Array.from({length:k},(_,i)=>1/(n_-i)).reduce((a,b)=>a*b,1);return{question:`Draw ${k} cards WITHOUT replacement from ${n_} (numbered 1–${n_}). P(all ${k} drawn in increasing order)?`,questionLatex:`P(\\text{increasing order, no replacement})=?`,steps:[`P(1st correct)=1/${n_}`,`P(2nd correct|1st)=1/${n_-1}`,...Array.from({length:k-2},(_,i)=>`P(${i+3}rd correct|prev)=1/${n_-i-2}`),`P = ${Array.from({length:k},(_,i)=>`1/${n_-i}`).join('×')} = 1/${Math.round(1/pChain)}`],answer:`1/${Math.round(1/pChain)}`,answerLatex:`\\frac{1}{${Math.round(1/pChain)}}`,tip:'Multiplication rule for dependent: P(A∩B)=P(A)·P(B|A)·… Chain the fractions.'};},
      (s)=>{const p=srI(s,3,7)/10;const n_=srI(s+1,3,6);const pAll=Math.pow(p,n_);return{question:`A biased coin has P(head)=${p}. Find P(${n_} heads in a row).`,questionLatex:`P(${n_}\\text{ heads in a row})=?\\;(P(H)=${p})`,steps:[`Independent flips: multiply`,`P = ${p}^${n_} = ${fmt(pAll,6)}`],answer:`${fmt(pAll,6)}`,answerLatex:`${p}^{${n_}}=${fmt(pAll,4)}`,tip:'Independent repeated trials: multiply probabilities. Result shrinks rapidly!'};},
    ];
    const t=templates[n%templates.length](n*43+17);
    return{...t};
  },
  conditional:(n)=>{
    const templates=[
      (s)=>{const pAB=srI(s,1,4)/20,pB=srI(s+1,3,8)/10;return{question:`P(A∩B)=${fmt(pAB,2)}, P(B)=${fmt(pB,1)}. Find P(A|B).`,questionLatex:`P(A|B)=\\dfrac{P(A\\cap B)}{P(B)}=?`,steps:[`P(A|B) = P(A∩B)/P(B)`,`= ${fmt(pAB,2)} / ${fmt(pB,1)} = ${fmt(pAB/pB,4)}`],answer:`${fmt(pAB/pB,4)}`,answerLatex:`P(A|B)=${fmt(pAB/pB,4)}`,tip:'Conditional = intersection/condition. Think: restrict sample space to B.'};},
      (s)=>{const n_=52,hearts=13,faceCards=12,heartFaces=3;const p=heartFaces/(hearts);return{question:`A card is drawn from a 52-card deck. Given it's a heart, what is P(it's a face card)?`,questionLatex:`P(\\text{face}|\\text{heart})=?`,steps:[`Hearts: 13. Face cards: 12. Heart face cards: 3 (J,Q,K of hearts)`,`P(face|heart) = P(face∩heart)/P(heart) = (3/52)/(13/52) = 3/13 ≈ ${fmt(p,4)}`],answer:`3/13 ≈ ${fmt(p,4)}`,answerLatex:`\\frac{3}{13}\\approx${fmt(p,4)}`,tip:'Given a heart, restrict to 13 hearts. 3 of them are face cards. 3/13.'};},
      (s)=>{const pA=srI(s,3,6)/10,pBA=srI(s+1,4,8)/10,pBAc=(srI(s+2,2,5)/10);const pB=pA*pBA+(1-pA)*pBAc;return{question:`P(A)=${pA}, P(B|A)=${pBA}, P(B|A')=${fmt(pBAc,1)}. Find P(B).`,questionLatex:`P(B)=P(B|A)P(A)+P(B|A')P(A')=?`,steps:[`Law of Total Probability: P(B)=P(B|A)P(A)+P(B|A')P(A')`,`=${pBA}×${pA}+${fmt(pBAc,1)}×${fmt(1-pA,1)}`,`=${fmt(pA*pBA,4)}+${fmt((1-pA)*pBAc,4)}=${fmt(pB,4)}`],answer:`${fmt(pB,4)}`,answerLatex:`P(B)=${fmt(pB,4)}`,tip:'Law of Total Probability: break event B into cases. Essential tool for Bayes theorem.'};},
    ];
    const t=templates[n%templates.length](n*47+19);
    return{...t};
  },
  bayes:(n)=>{
    const templates=[
      (s)=>{const pD=srI(s,1,5)/100,sens=srI(s+1,8,10)/10,spec=srI(s+2,8,10)/10;const pTP=pD*sens,pFP=(1-pD)*(1-spec),pPos=pTP+pFP,pDpos=pTP/pPos;return{question:`A disease affects ${pD*100}% of the population. Test sensitivity=${sens*100}%, specificity=${spec*100}%. P(disease|positive test)?`,questionLatex:`P(D|+)=\\dfrac{P(+|D)P(D)}{P(+)}=?`,steps:[`P(D)=${pD}, P(+|D)=${sens}, P(+|D')=${fmt(1-spec,2)}`,`P(+) = P(+|D)P(D)+P(+|D')P(D') = ${fmt(pTP,4)}+${fmt(pFP,4)} = ${fmt(pPos,4)}`,`P(D|+) = ${fmt(pTP,4)}/${fmt(pPos,4)} = ${fmt(pDpos,4)}`],answer:`${fmt(pDpos,4)} = ${fmt(pDpos*100,1)}%`,answerLatex:`P(D|+)=${fmt(pDpos,4)}\\approx${fmt(pDpos*100,1)}\\%`,tip:'Even with 90%+ accuracy, a rare disease has low P(D|+). Base rate matters enormously!'};},
      (s)=>{const pR=srI(s,3,6)/10,pDR=srI(s+1,6,9)/10,pDNR=srI(s+2,2,5)/10;const pD=pR*pDR+(1-pR)*pDNR,pRD=pR*pDR/pD;return{question:`P(rain)=${pR}. P(dark clouds|rain)=${pDR}. P(dark|no rain)=${pDNR}. Given dark clouds, find P(rain).`,questionLatex:`P(\\text{rain}|\\text{dark})=?\\;\\text{Bayes theorem}`,steps:[`P(dark)=P(dark|rain)P(rain)+P(dark|no rain)P(no rain)`,`=${pDR}×${pR}+${pDNR}×${fmt(1-pR,1)}=${fmt(pD,4)}`,`P(rain|dark)=P(dark|rain)×P(rain)/P(dark)`,`=${pDR}×${pR}/${fmt(pD,4)}=${fmt(pRD,4)}`],answer:`${fmt(pRD,4)}`,answerLatex:`P(\\text{rain}|\\text{dark})=${fmt(pRD,4)}`,tip:"Bayes: P(cause|effect) = P(effect|cause)·P(cause)/P(effect). Prior → Posterior."};},
    ];
    const t=templates[n%templates.length](n*53+23);
    return{...t};
  },
  random_vars:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,4,8),p=srI(s+1,2,5)/10,k=srI(s+2,1,n_-1);const prob=C(n_,k)*Math.pow(p,k)*Math.pow(1-p,n_-k);return{question:`X~Bin(${n_},${p}). Find P(X=${k}).`,questionLatex:`X\\sim\\text{Bin}(${n_},${p}).\\;P(X=${k})=?`,steps:[`P(X=k)=C(n,k)pᵏ(1-p)ⁿ⁻ᵏ`,`P(X=${k})=C(${n_},${k})×${p}^${k}×${fmt(1-p,1)}^${n_-k}`,`=${C(n_,k)}×${fmt(Math.pow(p,k),6)}×${fmt(Math.pow(1-p,n_-k),6)}`,`=${fmt(prob,6)}`],answer:`${fmt(prob,6)}`,answerLatex:`P(X=${k})=${fmt(prob,4)}`,tip:'Binomial: n trials, k successes, prob p each. Use C(n,k)pᵏ(1-p)ⁿ⁻ᵏ.'};},
      (s)=>{const lambda=srI(s,2,6),k=srI(s+1,0,lambda+2);const prob=Math.exp(-lambda)*Math.pow(lambda,k)/fact(Math.min(k,20));return{question:`X~Poi(${lambda}). Find P(X=${k}).`,questionLatex:`X\\sim\\text{Poi}(${lambda}).\\;P(X=${k})=?`,steps:[`P(X=k)=e^{-λ}λᵏ/k!`,`P(X=${k})=e^{-${lambda}}×${lambda}^${k}/${k}!`,`=${fmt(Math.exp(-lambda),6)}×${fmt(Math.pow(lambda,k),4)}/${fact(Math.min(k,20))}`,`=${fmt(prob,6)}`],answer:`${fmt(prob,6)}`,answerLatex:`P(X=${k})=${fmt(prob,4)}`,tip:'Poisson: λ = average rate. P(X=k) = e^{-λ}λᵏ/k!. Works for rare events.'};},
      (s)=>{const n_=srI(s,5,10),p=srI(s+1,2,6)/10;return{question:`X~Bin(${n_},${p}). Find E[X] and Var(X).`,questionLatex:`X\\sim\\text{Bin}(${n_},${p}).\\;E[X]=?,\\;\\text{Var}(X)=?`,steps:[`For Binomial: E[X]=np, Var(X)=np(1-p)`,`E[X] = ${n_}×${p} = ${n_*p}`,`Var(X) = ${n_}×${p}×${fmt(1-p,1)} = ${fmt(n_*p*(1-p),4)}`,`σ = √${fmt(n_*p*(1-p),4)} = ${fmt(Math.sqrt(n_*p*(1-p)),4)}`],answer:`E[X]=${n_*p}, Var=${fmt(n_*p*(1-p),4)}, σ=${fmt(Math.sqrt(n_*p*(1-p)),4)}`,answerLatex:`E[X]=${n_*p},\\;\\text{Var}=${fmt(n_*p*(1-p),4)}`,tip:'Binomial formulas: E[X]=np, Var(X)=npq where q=1-p. Know these cold.'};},
    ];
    const t=templates[n%templates.length](n*59+29);
    return{...t};
  },
  expectation:(n)=>{
    const templates=[
      (s)=>{const vals=Array.from({length:srI(s,3,5)},(_,i)=>i+1);const probs=vals.map(()=>srI(s+vals.indexOf(_)+1,1,4));const total=probs.reduce((a,b)=>a+b,0);const normP=probs.map(p=>p/total);const ex=vals.reduce((sum,v,i)=>sum+v*normP[i],0);return{question:`X has distribution: ${vals.map((v,i)=>`P(${v})=${fmt(normP[i],2)}`).join(', ')}. Find E[X].`,questionLatex:`E[X]=\\sum x\\cdot P(X=x)=?`,steps:[`E[X]=Σx·P(x)`,...vals.map((v,i)=>`  ${v}×${fmt(normP[i],2)}=${fmt(v*normP[i],4)}`),`E[X]=${fmt(ex,4)}`],answer:`${fmt(ex,4)}`,answerLatex:`E[X]=${fmt(ex,4)}`,tip:'E[X]=Σ x·P(X=x). Weighted average of all outcomes.'};},
      (s)=>{const n_=srI(s,2,6),p=srI(s+1,2,6)/10;const ex=n_*p,vx=n_*p*(1-p);return{question:`For X~Bin(${n_},${p}), find E[X²].`,questionLatex:`E[X^2]=\\text{Var}(X)+(E[X])^2=?`,steps:[`Var(X)=E[X²]−(E[X])²`,`E[X]=np=${n_*p}, Var(X)=np(1-p)=${fmt(vx,4)}`,`E[X²]=Var(X)+(E[X])²=${fmt(vx,4)}+${fmt(ex*ex,4)}=${fmt(vx+ex*ex,4)}`],answer:`${fmt(vx+ex*ex,4)}`,answerLatex:`E[X^2]=${fmt(vx+ex*ex,4)}`,tip:'E[X²]=Var(X)+(E[X])². Never forget: Var=E[X²]-μ².'};},
      (s)=>{const a=srI(s,2,5),b=srI(s+1,1,4);const ex=srI(s+2,2,8),vx=srI(s+3,1,5);return{question:`E[X]=${ex}, Var(X)=${vx}. Find E[${a}X+${b}] and Var(${a}X+${b}).`,questionLatex:`E[${a}X+${b}]=?,\\;\\text{Var}(${a}X+${b})=?`,steps:[`Linearity: E[aX+b]=aE[X]+b`,`E[${a}X+${b}]=${a}×${ex}+${b}=${a*ex+b}`,`Var[aX+b]=a²Var(X) (constant shifts don't affect variance)`,`Var[${a}X+${b}]=${a}²×${vx}=${a*a*vx}`],answer:`E=${a*ex+b}, Var=${a*a*vx}`,answerLatex:`E[${a}X+${b}]=${a*ex+b},\\;\\text{Var}=${a*a*vx}`,tip:'E[aX+b]=aE[X]+b. Var(aX+b)=a²Var(X). The constant b vanishes from variance!'};},
    ];
    const t=templates[n%templates.length](n*61+31);
    return{...t};
  },
  combinatorial:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,5,8);const dn=Math.round(fact(n_)*Array.from({length:n_+1},(_,k)=>Math.pow(-1,k)/fact(k)).reduce((a,b)=>a+b,0));const total=fact(n_);return{question:`${n_} letters are randomly placed in ${n_} envelopes. Find P(no letter in correct envelope) — the derangement probability.`,questionLatex:`P(\\text{derangement of }${n_}\\text{ items})=?`,steps:[`Derangements: D_n = n!·Σ(-1)ᵏ/k!`,`D_${n_} = ${dn}`,`Total permutations = ${n_}! = ${total}`,`P = ${dn}/${total} = ${fmt(dn/total,4)}`,`Note: as n→∞, this → 1/e ≈ ${fmt(1/Math.E,4)}`],answer:`${fmt(dn/total,4)} ≈ 1/e`,answerLatex:`\\frac{D_{${n_}}}{${n_}!}=\\frac{${dn}}{${total}}=${fmt(dn/total,4)}`,tip:'Derangement: no fixed points. Formula: D_n = n!·(1−1+1/2!−1/3!+…). Prob→1/e.'};},
      (s)=>{const n_=srI(s,15,35);const pNone=Array.from({length:n_},(_,i)=>(365-i)/365).reduce((a,b)=>a*b,1);const pMatch=1-pNone;return{question:`In a room of ${n_} people, what is the probability that at least two share the same birthday?`,questionLatex:`P(\\text{birthday match, }n=${n_})=?`,steps:[`P(no match) = 365/365 × 364/365 × … × ${365-n_+1}/365`,`= ${fmt(pNone,6)}`,`P(at least one match) = 1 − ${fmt(pNone,6)} = ${fmt(pMatch,4)}`,`Note: ${n_} people → ${fmt(pMatch*100,1)}% chance of a match!`],answer:`${fmt(pMatch,4)} = ${fmt(pMatch*100,1)}%`,answerLatex:`1-\\frac{365\\cdot364\\cdots${365-n_+1}}{365^{${n_}}}=${fmt(pMatch,4)}`,tip:'Birthday paradox: n=23 gives >50%. The 1−P(none) complement trick is essential.'};},
    ];
    const t=templates[n%templates.length](n*67+37);
    return{...t};
  },
  geometric_prob:(n)=>{
    const templates=[
      (s)=>{const a=srI(s,1,5),b=srI(s+1,a+1,10);const c=srI(s+2,a,b-1),d=srI(s+3,c+1,b);const p=(d-c)/(b-a);return{question:`X~Uniform[${a},${b}]. Find P(${c} ≤ X ≤ ${d}).`,questionLatex:`X\\sim\\text{Unif}[${a},${b}].\\;P(${c}\\leq X\\leq ${d})=?`,steps:[`Uniform: P(a≤X≤b)=(d-c)/(b-a)`,`P = (${d}-${c})/(${b}-${a}) = ${d-c}/${b-a} = ${fmt(p,4)}`],answer:`${fmt(p,4)}`,answerLatex:`P=${fmt(p,4)}`,tip:'Geometric probability: ratio of lengths (1D), areas (2D), or volumes (3D).'};},
      (s)=>{const t=srI(s,10,25);const total=60,p=1-Math.pow((total-t)/total,2);return{question:`Two people arrive uniformly in a 60-minute window. Find P(they overlap for at least ${t} minutes).`,questionLatex:`P(\\text{wait}\\leq ${60-t}\\text{ min apart})=?`,steps:[`Let X,Y be arrival times. |X-Y| ≤ ${60-t} needed`,`P(|X-Y| > ${60-t}) = area of corner triangles / 60² = 2×½×${60-t}²/3600 = ${fmt(Math.pow(60-t,2)/3600,4)}`,`P(overlap ≥ ${t} min) = 1 − ${fmt(Math.pow(60-t,2)/3600,4)} = ${fmt(p,4)}`],answer:`${fmt(p,4)}`,answerLatex:`1-\\left(\\frac{${60-t}}{60}\\right)^2=${fmt(p,4)}`,tip:'Meeting problem: draw square [0,60]². Favorable region is a band around the diagonal.'};},
    ];
    const t=templates[n%templates.length](n*71+41);
    return{...t};
  },
  gen_functions:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,3,7),p=srI(s+1,2,6)/10;const gat1=1,gDeriv=n_*p;return{question:`For X~Bin(${n_},${p}), G_X(z)=(${fmt(1-p,1)}+${p}z)^${n_}. Find G_X(1) and G'_X(1)=E[X].`,questionLatex:`G_X(z)=(${fmt(1-p,1)}+${p}z)^{${n_}}.\\;G_X(1)=?,\\;G_X'(1)=?`,steps:[`G_X(1) = (${fmt(1-p,1)}+${p}×1)^${n_} = 1^${n_} = 1`,`G'_X(z) = ${n_}×${p}×(${fmt(1-p,1)}+${p}z)^${n_-1}`,`G'_X(1) = ${n_}×${p}×1 = ${n_*p} = E[X] ✓`],answer:`G(1)=1, E[X]=G'(1)=${n_*p}`,answerLatex:`G_X(1)=1,\\;E[X]=G_X'(1)=${n_*p}`,tip:'PGF at z=1 always gives 1 (prob sums to 1). First derivative at z=1 gives E[X].'};},
      (s)=>{const lam1=srI(s,2,4),lam2=srI(s+1,1,3);return{question:`X~Poi(${lam1}), Y~Poi(${lam2}), independent. What is the distribution of X+Y?`,questionLatex:`X+Y\\sim?\\text{ (Poisson PGF convolution)}`,steps:[`PGF of X: G_X(z)=e^{${lam1}(z-1)}`,`PGF of Y: G_Y(z)=e^{${lam2}(z-1)}`,`G_{X+Y}(z)=G_X(z)·G_Y(z)=e^{${lam1+lam2}(z-1)}`,`X+Y ~ Poi(${lam1+lam2}) ✓`],answer:`X+Y ~ Poi(${lam1+lam2})`,answerLatex:`X+Y\\sim\\text{Poi}(${lam1+lam2})`,tip:'Sum of independent Poissons is Poisson with summed parameter. PGF proves it elegantly.'};},
    ];
    const t=templates[n%templates.length](n*73+43);
    return{...t};
  },
  markov:(n)=>{
    const templates=[
      (s)=>{const p=srI(s,3,7)/10,q=1-p,N=srI(s+1,5,10),k=srI(s+2,1,N-1);const ruin=q===p?1-k/N:(Math.pow(q/p,k)-1)/(Math.pow(q/p,N)-1);return{question:`Gambler's Ruin: start at $${k}, play until $${N} or $0. P(H)=${p}, P(T)=${fmt(q,1)}. Find P(ruin).`,questionLatex:`P(\\text{ruin}|\\text{start at }${k},\\;N=${N})=?`,steps:[`p=${p}, q=${fmt(q,1)}, k=${k}, N=${N}`,p!==q?`Formula: P(ruin) = (1−(p/q)^k)/(1−(p/q)^N) — wait, let r=q/p`:`p=q=½: P(ruin) = 1−k/N = 1−${k}/${N}`,p!==q?`r=q/p=${fmt(q/p,4)}, P(ruin)=(r^${k}−1)/(r^${N}−1)=${fmt(ruin,4)}`:`P(ruin) = ${fmt(ruin,4)}`],answer:`${fmt(ruin,4)}`,answerLatex:`P(\\text{ruin})=${fmt(ruin,4)}`,tip:"Gambler's Ruin: P(ruin|k) = 1−k/N for fair game. Unfair: use geometric ratio (q/p)^k."};},
      (s)=>{return{question:`A Markov chain has stationary distribution π. What condition must π satisfy?`,questionLatex:`\\pi P=\\pi,\\;\\sum_i\\pi_i=1`,steps:[`Stationary = balance condition: πP=π`,`Also called detailed balance for reversible chains: πᵢpᵢⱼ=πⱼpⱼᵢ`,`Sum constraint: Σπᵢ=1`],answer:`πP=π and Σπᵢ=1`,answerLatex:`\\pi P=\\pi,\\;\\sum_i\\pi_i=1`,tip:'Stationary distribution: solving πP=π. It represents long-run fraction of time in each state.'};},
    ];
    const t=templates[n%templates.length](n*79+47);
    return{...t};
  },
  limit_theorems:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,50,500),p=srI(s+1,2,7)/10;const mu=n_*p,sigma=Math.sqrt(n_*p*(1-p)),k=Math.round(mu+srI(s+2,1,3)*sigma);const z=(k-mu)/sigma;return{question:`X~Bin(${n_},${p}). Use CLT to approximate P(X≤${k}).`,questionLatex:`X\\sim\\text{Bin}(${n_},${p}).\\;P(X\\leq${k})\\approx?\\;(\\text{CLT})`,steps:[`μ=np=${mu}, σ=√(npq)=${fmt(sigma,4)}`,`Standardize: z=(${k}−${mu})/${fmt(sigma,4)}=${fmt(z,4)}`,`P(X≤${k}) ≈ Φ(${fmt(z,2)}) ≈ ${fmt(0.5+0.5*Math.sign(z)*Math.min(0.4999,Math.abs(z)*0.4),4)}`],answer:`≈ Φ(${fmt(z,2)})`,answerLatex:`P(X\\leq${k})\\approx\\Phi(${fmt(z,2)})`,tip:'CLT: Bin(n,p) ≈ N(np,npq) for large n. Always standardize first: Z=(X-μ)/σ.'};},
      (s)=>{const k=srI(s,2,6),eps=srI(s+1,1,4)/10;const bound=1/(k*k);return{question:`Chebyshev: for any RV with mean μ and std σ, find P(|X−μ| ≥ ${k}σ).`,questionLatex:`P(|X-\\mu|\\geq ${k}\\sigma)\\leq?\\;(\\text{Chebyshev})`,steps:[`Chebyshev's inequality: P(|X−μ|≥kσ) ≤ 1/k²`,`k=${k}: P(|X−μ|≥${k}σ) ≤ 1/${k}² = ${fmt(bound,4)}`],answer:`≤ ${fmt(bound,4)} = 1/${k}²`,answerLatex:`P(|X-\\mu|\\geq${k}\\sigma)\\leq\\frac{1}{${k}^2}=${fmt(bound,4)}`,tip:"Chebyshev is weak but works for ANY distribution. Useful in LLN proofs."};},
    ];
    const t=templates[n%templates.length](n*83+53);
    return{...t};
  },
  paradoxes:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,20,40);const pNone=Array.from({length:n_},(_,i)=>(365-i)/365).reduce((a,b)=>a*b,1);const pMatch=1-pNone;return{question:`Explain the Birthday Paradox: with ${n_} people, P(shared birthday) = ${fmt(pMatch,4)}. Why is this surprising?`,questionLatex:`P(\\text{match},n=${n_})=1-\\frac{365\\cdots${365-n_+1}}{365^{${n_}}}=${fmt(pMatch,4)}`,steps:[`P(no match among ${n_}) = 365/365 × 364/365 × … × ${365-n_+1}/365`,`= ${fmt(pNone,6)}`,`P(match) = 1−${fmt(pNone,6)} = ${fmt(pMatch,4)} ≈ ${fmt(pMatch*100,0)}%!`,`Intuition: ${n_} people create C(${n_},2)=${C(n_,2)} PAIRS — each pair can share a birthday`],answer:`P=${fmt(pMatch,4)}. High because ${C(n_,2)} pairs exist.`,answerLatex:`${fmt(pMatch,4)}\\text{ (${C(n_,2)} pairs = many chances)}`,tip:`We think about "my birthday matches someone's" (1 pair), but there are C(n,2)=${C(n_,2)} pairs!`};},
      (s)=>{return{question:`Monty Hall: 3 doors, car behind 1. You pick door 1. Host opens door 3 (goat). Should you switch? What is P(win|switch)?`,questionLatex:`P(\\text{win}|\\text{switch})=?`,steps:[`Initially: P(car at 1)=1/3, P(car at 2)=1/3, P(car at 3)=1/3`,`Host opens a goat door. This gives info!`,`P(car at 2|host opens 3) = P(host opens 3|car at 2)×P(car at 2)/P(host opens 3)`,`= 1×(1/3) / (1/2) = 2/3`,`P(win|stay) = 1/3. P(win|switch) = 2/3`],answer:`P(win|switch) = 2/3. Always switch!`,answerLatex:`P(\\text{win}|\\text{switch})=\\frac{2}{3}`,tip:"Monty's action is NOT random — he always reveals a goat. This information shifts probability."};},
    ];
    const t=templates[n%templates.length](n*89+59);
    return{...t};
  },
};

// ── Quiz Generators (tough MCQ) ────────────────────────────────
const QUIZ_GENERATORS = {
  terminology:(n)=>{
    const templates=[
      (s)=>{const pA=srI(s,2,7)/10,pB=srI(s+1,1,Math.round(pA*10)-1)/10;return{q:`P(A)=${pA} and P(B)=${pB} with A,B mutually exclusive. P(A∪B)=?`,opts:shuffle([fmt(pA+pB,1),fmt(pA*pB,2),fmt(pA-pB,1),fmt(pA+pB+0.1,1)],s),correct:fmt(pA+pB,1)};},
      (s)=>{const pA=srI(s,3,7)/10;return{q:`P(A)=${pA}. What is P(A')?`,opts:shuffle([fmt(1-pA,1),fmt(pA,1),fmt(1-pA+0.1,1),fmt(pA*2,1)],s),correct:fmt(1-pA,1)};},
      (s)=>{return{q:`Which of these is NOT a valid probability?`,opts:shuffle(['−0.1','0','0.5','1'],s),correct:'−0.1'};},
      (s)=>{return{q:`If A and B are mutually exclusive events, then P(A∩B)=?`,opts:shuffle(['0','P(A)+P(B)','P(A)·P(B)','1'],s),correct:'0'};},
    ];
    const t=templates[n%templates.length](n*31+7);
    return{...t,tip:'P(A)∈[0,1]. Mutually exclusive: A∩B=∅, so P(A∩B)=0.'};
  },
  classical:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,3,8),k=srI(s+1,1,n_-1);const p=k/n_;return{q:`${k} red balls from ${n_} total (all equally likely). P(red)=?`,opts:shuffle([fmt(p,4),fmt((k+1)/n_,4),fmt((k-1)/n_,4),fmt(k/(n_+1),4)],s),correct:fmt(p,4)};},
      (s)=>{const ev=srI(s,1,3),total=6;const p=ev/total;return{q:`Roll a fair die. P(rolling ≤${ev+1})=?`,opts:shuffle([fmt((ev+1)/total,4),fmt(ev/total,4),fmt((ev+2)/total,4),fmt(1/total,4)],s),correct:fmt((ev+1)/total,4)};},
      (s)=>{return{q:`Empirical probability is based on?`,opts:shuffle(['Observed frequency/total trials','Theory only','Equally likely outcomes','Geometric areas'],s),correct:'Observed frequency/total trials'};},
      (s)=>{const n_=srI(s,10,30),k=srI(s+1,2,6);return{q:`From ${n_} people, ${k} are chosen. How many ways? (Combination)`,opts:shuffle([C(n_,k),C(n_,k)+1,C(n_-1,k),Math.round(fact(n_)/fact(k))].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s),correct:C(n_,k)};},
    ];
    const t=templates[n%templates.length](n*37+11);
    return{...t,tip:'Classical: P(A)=n(A)/n(S). Empirical: relative frequency. Use combinations for "choose".'};
  },
  addition_rule:(n)=>{
    const templates=[
      (s)=>{const pA=srI(s,2,5)/10,pB=srI(s+1,2,5)/10,pAB=srI(s+2,1,Math.min(Math.round(pA*10),Math.round(pB*10))-1)/10;return{q:`P(A)=${pA},P(B)=${pB},P(A∩B)=${pAB}. P(A∪B)=?`,opts:shuffle([fmt(pA+pB-pAB,1),fmt(pA+pB,1),fmt(pA*pB,2),fmt(pA+pB+pAB,1)],s),correct:fmt(pA+pB-pAB,1)};},
      (s)=>{const pA=srI(s,3,7)/10;return{q:`P(A)=${pA}. P(complement of A)=?`,opts:shuffle([fmt(1-pA,1),fmt(pA,1),fmt(2*pA,1),fmt(1-pA-0.1,1)],s),correct:fmt(1-pA,1)};},
      (s)=>{const p1=0.3,p2=0.4;return{q:`P(A)=0.3, P(B)=0.4, A,B independent. P(A∪B)=?`,opts:shuffle([fmt(p1+p2-p1*p2,2),'0.7',fmt(p1*p2,2),'0.5'],s),correct:fmt(p1+p2-p1*p2,2)};},
      (s)=>{return{q:`Boole's inequality states P(A∪B)≤?`,opts:shuffle(['P(A)+P(B)','P(A)+P(B)-P(A∩B)','P(A)·P(B)','1'],s),correct:'P(A)+P(B)'};},
    ];
    const t=templates[n%templates.length](n*41+13);
    return{...t,tip:'P(A∪B)=P(A)+P(B)−P(A∩B). For independent: subtract P(A)·P(B).'};
  },
  multiplication:(n)=>{
    const templates=[
      (s)=>{const p1=srI(s,3,7)/10,p2=srI(s+1,3,7)/10;return{q:`P(A)=${p1},P(B)=${p2}, independent. P(A∩B)=?`,opts:shuffle([fmt(p1*p2,2),fmt(p1+p2,1),fmt(p1+p2-p1*p2,2),fmt((p1+p2)/2,2)],s),correct:fmt(p1*p2,2)};},
      (s)=>{return{q:`If A and B are independent, then P(A|B)=?`,opts:shuffle(['P(A)','P(B)','P(A)·P(B)','P(A∩B)'],s),correct:'P(A)'};},
      (s)=>{const p=srI(s,3,8)/10,n_=srI(s+1,2,5);return{q:`3 independent events each with prob ${p}. P(all occur)?`,opts:shuffle([fmt(Math.pow(p,3),4),fmt(3*p,2),fmt(p,1),fmt(p*p,2)].slice(0,4),s),correct:fmt(Math.pow(p,3),4)};},
      (s)=>{return{q:`P(A∩B)=P(A)·P(B) holds when A,B are?`,opts:shuffle(['Independent','Mutually exclusive','Complementary','Both occur'],s),correct:'Independent'};},
    ];
    const t=templates[n%templates.length](n*43+17);
    return{...t,tip:'Independent: P(A∩B)=P(A)P(B). P(A|B)=P(A). Mutually exclusive≠independent.'};
  },
  conditional:(n)=>{
    const templates=[
      (s)=>{const pAB=srI(s,1,3)/10,pB=srI(s+1,4,8)/10;return{q:`P(A∩B)=${pAB},P(B)=${pB}. P(A|B)=?`,opts:shuffle([fmt(pAB/pB,4),fmt(pB/pAB,4),fmt(pAB*pB,4),fmt(pAB+pB,4)],s),correct:fmt(pAB/pB,4)};},
      (s)=>{const pA=srI(s,3,6)/10,pBA=srI(s+1,5,8)/10;return{q:`P(A)=${pA},P(B|A)=${pBA}. P(A∩B)=?`,opts:shuffle([fmt(pA*pBA,2),fmt(pA+pBA,1),fmt(pBA/pA,2),fmt(pBA-pA,2)],s),correct:fmt(pA*pBA,2)};},
      (s)=>{return{q:`P(A|B)=P(A∩B)/P(B). This is defined only when?`,opts:shuffle(['P(B)>0','P(A)>0','A and B are independent','P(A∩B)>0'],s),correct:'P(B)>0'};},
      (s)=>{const pA=0.4,pB=0.5,pAB=0.2;return{q:`P(A)=0.4,P(B)=0.5,P(A∩B)=0.2. Are A,B independent?`,opts:shuffle(['Yes (0.4×0.5=0.2=P(A∩B))','No','Cannot determine','Only if P(A|B)=0.5'],s),correct:'Yes (0.4×0.5=0.2=P(A∩B))'};},
    ];
    const t=templates[n%templates.length](n*47+19);
    return{...t,tip:'P(A|B)=P(A∩B)/P(B). Chain: P(A∩B)=P(A|B)·P(B).'};
  },
  bayes:(n)=>{
    const templates=[
      (s)=>{const pD=0.01,sens=0.9,spec=0.95;const pT=pD*sens+(1-pD)*(1-spec);const pDT=pD*sens/pT;return{q:`P(disease)=0.01,sensitivity=0.9,specificity=0.95. P(disease|positive test)≈?`,opts:shuffle([fmt(pDT,3),fmt(sens,2),fmt(pD,2),fmt(spec,2)],s),correct:fmt(pDT,3)};},
      (s)=>{return{q:`Bayes' theorem updates which probability?`,opts:shuffle(['Posterior given evidence','Prior before evidence','Likelihood of data','Marginal probability'],s),correct:'Posterior given evidence'};},
      (s)=>{const pA=srI(s,3,6)/10,pBA=srI(s+1,6,9)/10,pBAc=srI(s+2,1,4)/10;const pB=pA*pBA+(1-pA)*pBAc;return{q:`P(A)=${pA},P(B|A)=${pBA},P(B|A')=${pBAc}. P(A|B)≈?`,opts:shuffle([fmt(pA*pBA/pB,4),fmt(pBA*pA,4),fmt(pA,1),fmt(pBA,1)],s),correct:fmt(pA*pBA/pB,4)};},
      (s)=>{return{q:`In Bayes' theorem, P(A) before seeing evidence is called the?`,opts:shuffle(['Prior','Posterior','Likelihood','Evidence'],s),correct:'Prior'};},
    ];
    const t=templates[n%templates.length](n*53+23);
    return{...t,tip:'Bayes: P(cause|effect)=P(effect|cause)·P(cause)/P(effect). Prior→Posterior.'};
  },
  random_vars:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,4,8),p=srI(s+1,3,7)/10,k=srI(s+2,1,n_-1);const prob=C(n_,k)*Math.pow(p,k)*Math.pow(1-p,n_-k);return{q:`X~Bin(${n_},${p}). P(X=${k})≈?`,opts:shuffle([fmt(prob,4),fmt(C(n_,k)*Math.pow(p,k+1)*Math.pow(1-p,n_-k-1),4),fmt(prob*2,4),fmt(C(n_,k)*Math.pow(p,k)*Math.pow(1-p,n_-k+1),4)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s),correct:fmt(prob,4)};},
      (s)=>{const lam=srI(s,2,5),k=srI(s+1,0,lam+1);const prob=Math.exp(-lam)*Math.pow(lam,k)/fact(Math.min(k,12));return{q:`X~Poi(${lam}). P(X=${k})≈?`,opts:shuffle([fmt(prob,4),fmt(prob*lam,4),fmt(Math.exp(-lam)*lam/fact(k),4),fmt(prob+0.05,4)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s),correct:fmt(prob,4)};},
      (s)=>{const n_=srI(s,4,8),p=srI(s+1,2,6)/10;return{q:`X~Bin(${n_},${p}). E[X]=?`,opts:shuffle([n_*p,n_*p+1,n_*p*(1-p),n_*p-1],s),correct:n_*p};},
      (s)=>{return{q:`For a continuous RV, P(X=x) for any single value x is?`,opts:shuffle(['0','Positive','f(x)','1'],s),correct:'0'};},
    ];
    const t=templates[n%templates.length](n*59+29);
    return{...t,tip:'Bin: P(X=k)=C(n,k)pᵏ(1-p)ⁿ⁻ᵏ. Poi: P(X=k)=e^{-λ}λᵏ/k!.'};
  },
  expectation:(n)=>{
    const templates=[
      (s)=>{const a=srI(s,2,5),b=srI(s+1,1,5),ex=srI(s+2,3,8);return{q:`E[X]=${ex}. Find E[${a}X+${b}].`,opts:shuffle([a*ex+b,a*ex,ex+b,a*ex-b],s),correct:a*ex+b};},
      (s)=>{const n_=srI(s,4,8),p=srI(s+1,2,6)/10;return{q:`X~Bin(${n_},${p}). Var(X)=?`,opts:shuffle([fmt(n_*p*(1-p),2),fmt(n_*p,2),fmt(n_*p*p,2),fmt(n_*(1-p),2)],s),correct:fmt(n_*p*(1-p),2)};},
      (s)=>{return{q:`E[aX+bY]=? (always, for any X,Y)`,opts:shuffle(['aE[X]+bE[Y]','aE[X]+bE[Y] only if independent','a+b times E[X+Y]','cannot determine'],s),correct:'aE[X]+bE[Y]'};},
      (s)=>{const ex=srI(s,2,6),vx=srI(s+1,1,5);return{q:`E[X]=${ex}, Var(X)=${vx}. E[X²]=?`,opts:shuffle([vx+ex*ex,ex*ex,vx,ex+vx],s),correct:vx+ex*ex};},
    ];
    const t=templates[n%templates.length](n*61+31);
    return{...t,tip:'E[aX+b]=aE[X]+b. Var(aX+b)=a²Var(X). E[X²]=Var(X)+(E[X])².'};
  },
  combinatorial:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,3,6);const dn=Math.round(fact(n_)*Array.from({length:n_+1},(_,k)=>Math.pow(-1,k)/fact(k)).reduce((a,b)=>a+b,0));return{q:`D_${n_} (derangements of ${n_} items)=?`,opts:shuffle([dn,dn+1,dn-1,fact(n_)-dn].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s),correct:dn};},
      (s)=>{return{q:`P(derangement)→? as n→∞`,opts:shuffle(['1/e≈0.368','1/2','0','1'],s),correct:'1/e≈0.368'};},
      (s)=>{const n_=23;const p=1-Array.from({length:n_},(_,i)=>(365-i)/365).reduce((a,b)=>a*b,1);return{q:`With 23 people, P(birthday match)≈?`,opts:shuffle([fmt(p,3),'0.1','0.9','0.05'],s),correct:fmt(p,3)};},
      (s)=>{return{q:`PIE for 3 events: P(A∪B∪C)=?`,opts:shuffle(['P(A)+P(B)+P(C)−P(AB)−P(BC)−P(AC)+P(ABC)','P(A)+P(B)+P(C)','P(A)+P(B)+P(C)−P(AB)−P(BC)−P(AC)','P(A)·P(B)·P(C)'],s),correct:'P(A)+P(B)+P(C)−P(AB)−P(BC)−P(AC)+P(ABC)'};},
    ];
    const t=templates[n%templates.length](n*67+37);
    return{...t,tip:'Derangements: D_n→n!/e. Birthday: n=23 gives >50%. PIE: alternating signs.'};
  },
  geometric_prob:(n)=>{
    const templates=[
      (s)=>{const a=1,b=10,c=3,d=7;const p=(d-c)/(b-a);return{q:`X~Unif[1,10]. P(3≤X≤7)=?`,opts:shuffle([fmt(p,2),'0.3','0.5','0.6'],s),correct:fmt(p,2)};},
      (s)=>{return{q:`In geometric probability, P(A)=?`,opts:shuffle(['Favorable measure / Total measure','Count of outcomes / Total','P(A∩B)/P(B)',"1−P(A')"],s),correct:'Favorable measure / Total measure'};},
      (s)=>{return{q:`Bertrand's Paradox demonstrates that "random" in geometric probability requires?`,opts:shuffle(['Specifying a probability model exactly','Using area always','Counting outcomes','Applying the CLT'],s),correct:'Specifying a probability model exactly'};},
      (s)=>{const t_=20;const p=1-Math.pow((60-t_)/60,2);return{q:`Meeting problem (60 min window, need ${t_} min overlap): P(meet)≈?`,opts:shuffle([fmt(p,3),fmt(t_/60,2),'0.5',fmt((60-t_)/60,2)],s),correct:fmt(p,3)};},
    ];
    const t=templates[n%templates.length](n*71+41);
    return{...t,tip:'Geometric: P=measure(favorable)/measure(total). Draw the region on a coordinate system.'};
  },
  gen_functions:(n)=>{
    const templates=[
      (s)=>{const n_=srI(s,3,7),p=srI(s+1,2,6)/10;return{q:`Binomial PGF G_X(z)=(${fmt(1-p,1)}+${p}z)^${n_}. G_X(1)=?`,opts:shuffle(['1',fmt(n_*p,2),fmt(Math.pow(1+p,n_),2),'0'],s),correct:'1'};},
      (s)=>{const n_=srI(s,3,7),p=srI(s+1,2,6)/10;return{q:`G_X(z)=(${fmt(1-p,1)}+${p}z)^${n_}. G'_X(1)=E[X]=?`,opts:shuffle([n_*p,n_*p*(1-p),n_*(1-p),n_*p+1],s),correct:n_*p};},
      (s)=>{const l1=srI(s,2,4),l2=srI(s+1,1,3);return{q:`X~Poi(${l1}), Y~Poi(${l2}), independent. X+Y~?`,opts:shuffle([`Poi(${l1+l2})`,`Poi(${l1*l2})`,`Bin(${l1+l2},0.5)`,`Poi(${Math.max(l1,l2)})`],s),correct:`Poi(${l1+l2})`};},
      (s)=>{return{q:`PGF G_{X+Y}(z)=G_X(z)·G_Y(z) holds when X,Y are?`,opts:shuffle(['Independent','Identically distributed','Both Poisson','Continuous'],s),correct:'Independent'};},
    ];
    const t=templates[n%templates.length](n*73+43);
    return{...t,tip:"PGF G(1)=1, G'(1)=E[X]. Independent sums: multiply PGFs."};
  },
  markov:(n)=>{
    const templates=[
      (s)=>{const k=srI(s,2,5),N=srI(s+1,k+2,10);const p=fmt(1-k/N,4);return{q:`Gambler's Ruin (fair, p=q=0.5), start=$${k}, target=$${N}. P(ruin)=?`,opts:shuffle([fmt(1-k/N,4),fmt(k/N,4),'0.5',fmt(k/(N*2),4)],s),correct:fmt(1-k/N,4)};},
      (s)=>{return{q:`The Markov property states the next state depends on?`,opts:shuffle(['Only the current state','All past states','The starting state','The target state'],s),correct:'Only the current state'};},
      (s)=>{return{q:`A stationary distribution π of a Markov chain satisfies?`,opts:shuffle(['πP=π','Pπ=π','π²=π','πP=I'],s),correct:'πP=π'};},
      (s)=>{const p=srI(s,3,7)/10,q=1-p;return{q:`Simple random walk with P(+1)=${p}>0.5. Is the walk recurrent?`,opts:shuffle(['No — transient (drifts right)','Yes — always recurrent','Only if p=0.5','Depends on starting point'],s),correct:'No — transient (drifts right)'};},
    ];
    const t=templates[n%templates.length](n*79+47);
    return{...t,tip:"Gambler's Ruin fair: P(ruin|k)=1-k/N. Markov: future|present ⊥ past."};
  },
  limit_theorems:(n)=>{
    const templates=[
      (s)=>{return{q:`The CLT says the standardized sample mean converges to?`,opts:shuffle(['N(0,1)','Poi(1)','Unif[0,1)','Bin(n,p)'],s),correct:'N(0,1)'};},
      (s)=>{const k=srI(s,2,5);return{q:`Chebyshev: P(|X-μ|≥${k}σ)≤?`,opts:shuffle([`1/${k}²`,`1/${k}`,`${k}²`,`2/${k}²`],s),correct:`1/${k}²`};},
      (s)=>{const n_=srI(s,50,200),p=0.5;return{q:`X~Bin(${n_},0.5). By CLT, X is approximately N(μ,σ²) where μ=?`,opts:shuffle([n_*p,n_*p*(1-p),Math.sqrt(n_*p*(1-p)),n_*p-1],s),correct:n_*p};},
      (s)=>{return{q:`The Weak Law of Large Numbers states X̄_n → μ in which sense?`,opts:shuffle(['In probability (convergence in probability)','Almost surely','In distribution','In mean square only'],s),correct:'In probability (convergence in probability)'};},
    ];
    const t=templates[n%templates.length](n*83+53);
    return{...t,tip:'CLT: (X̄-μ)/(σ/√n)→N(0,1). Chebyshev: P(|X-μ|≥kσ)≤1/k². WLLN: convergence in probability.'};
  },
  paradoxes:(n)=>{
    const templates=[
      (s)=>{return{q:`In the Monty Hall problem, P(win|switch)=?`,opts:shuffle(['2/3','1/2','1/3','3/4'],s),correct:'2/3'};},
      (s)=>{const n_=23;return{q:`The Birthday Paradox: with ${n_} people, P(at least one shared birthday)>?`,opts:shuffle(['50%','25%','75%','10%'],s),correct:'50%'};},
      (s)=>{return{q:`In the St. Petersburg paradox, E[payoff]=?`,opts:shuffle(['∞ (infinite)','100','e','2^n'],s),correct:'∞ (infinite)'};},
      (s)=>{return{q:`Simpson's Paradox shows that a trend can appear in subgroups but?`,opts:shuffle(['Reverse in the combined data','Stay the same','Disappear','Be stronger combined'],s),correct:'Reverse in the combined data'};},
    ];
    const t=templates[n%templates.length](n*89+59);
    return{...t,tip:'Monty Hall: always switch (2/3). Birthday: 23 people>50%. Simpson: aggregation can reverse trends.'};
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
      body{background:#06100e;}
      ::-webkit-scrollbar{width:5px;}
      ::-webkit-scrollbar-track{background:#06100e;}
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
  const floaters = ['P(A)','E[X]','σ²','Bayes','∩','∪','λ','N(0,1)'];
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', background:`radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.09) 0%, transparent 65%), #06100e`, textAlign:'center' }}>
      {floaters.map((s, i) => (
        <div key={s} style={{ position:'fixed', pointerEvents:'none', fontSize:14+(i%3)*7, color:`rgba(16,185,129,${0.04+(i%4)*0.02})`, top:`${8+i*11}%`, left:i%2===0?`${2+i*4}%`:`${74+i*2}%`, fontFamily:'JetBrains Mono,monospace', animation:`pulse ${3+i*0.6}s ease-in-out infinite`, animationDelay:`${i*0.25}s` }}>{s}</div>
      ))}
      <div style={{ opacity:phase>=1?1:0, transform:phase>=1?'translateY(0)':'translateY(12px)', transition:'all 0.6s ease', marginBottom:20, display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:40 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:ACCENT, animation:'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize:12, color:ACCENT, letterSpacing:'2px', textTransform:'uppercase', fontFamily:'Crimson Pro, serif' }}>Mathematics · Chapter 5</span>
      </div>
      <div style={{ opacity:phase>=2?1:0, transform:phase>=2?'translateY(0)':'translateY(20px)', transition:'all 0.7s ease 0.1s', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:'clamp(40px, 10vw, 90px)', color:'#fff', letterSpacing:'-3px', lineHeight:0.92, marginBottom:0 }}>
          Proba<span style={{ color:ACCENT }}>bility</span>
        </h1>
        <div style={{ height:3, width:80, background:`linear-gradient(90deg, ${ACCENT}, transparent)`, margin:'16px auto 0', borderRadius:2 }} />
      </div>
      <div style={{ opacity:phase>=3?1:0, transition:'all 0.6s ease', maxWidth:560, marginBottom:40 }}>
        <p style={{ fontFamily:'Crimson Pro, serif', fontSize:19, color:'rgba(255,255,255,0.7)', lineHeight:1.55, marginBottom:18, fontStyle:'italic' }}>
          "Probability is the branch of mathematics that studies chance — from the toss of a coin to the foundations of quantum mechanics."
        </p>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 24px', textAlign:'left' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:12, fontFamily:'JetBrains Mono, monospace' }}>Chapter Overview</div>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>
            From axioms and classical probability through conditional probability and Bayes' theorem, random variables, expectation and variance — to Olympiad-level combinatorial probability, geometric probability, generating functions, Markov chains, limit theorems, and classic paradoxes like Monty Hall and the Birthday Problem.
          </p>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:20 }}>
          {['Class 11 → Olympiad','14 Topics','∞ Practice','Quiz-Gated Progress'].map(t => (
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
    { title:'Core Probability Symbols', color:ACCENT, rows:NOTATION.slice(0,6) },
    { title:'Rules & Conditioning', color:'#34D399', rows:NOTATION.slice(6,11) },
    { title:'Distributions & Moments', color:'#F59E0B', rows:NOTATION.slice(11,16) },
    { title:'Olympiad & Advanced Tools', color:'#8B5CF6', rows:NOTATION.slice(16) },
  ];
  return (
    <div style={{ minHeight:'100vh', background:'#06100e', padding:'32px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:32, opacity:revealed?1:0, transition:'opacity 0.5s ease' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Before We Begin</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:34, color:'#fff', letterSpacing:'-1px', marginBottom:10 }}>Notation Guide</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>These symbols form the complete language of probability — from classical P(A) to advanced stochastic processes.</p>
        </div>
        {groups.map((g, gi) => (
          <div key={g.title} style={{ marginBottom:24, opacity:revealed?1:0, transform:revealed?'translateY(0)':'translateY(16px)', transition:`all 0.5s ease ${gi*0.1+0.2}s` }}>
            <div style={{ fontSize:11, color:g.color, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:20, height:2, background:g.color, borderRadius:1 }} />
              {g.title}
            </div>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
              {g.rows.map((row, ri) => (
                <div key={ri} style={{ display:'grid', gridTemplateColumns:'110px 1fr 1fr', borderBottom:ri<g.rows.length-1?'1px solid rgba(255,255,255,0.05)':'none', padding:'10px 16px', alignItems:'center', gap:8 }}>
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
          <p style={{ fontFamily:'Crimson Pro,serif', fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>When you click <strong style={{color:'#fff'}}>Done</strong> on any topic, you'll face <strong style={{color:ACCENT}}>4 tough questions</strong>. Answer all 4 correctly to unlock the next topic. Wrong answer? Review and retry.</p>
        </div>
        <button onClick={onNext} className="btn" style={{ width:'100%', padding:'16px', background:ACCENT, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${ACCENT}44` }}>
          Start Learning Probability →
        </button>
      </div>
    </div>
  );
}

// ── Section Menu ───────────────────────────────────────────────
function SectionMenuScreen({ onSelect, completedIds }) {
  const levels = ['Foundation','Intermediate','Olympiad'];
  const lColors = { Foundation:'#10B981', Intermediate:'#F59E0B', Olympiad:'#8B5CF6' };
  const lDesc = { Foundation:'Class 11 · Core probability', Intermediate:'JEE · Distributions & Bayes', Olympiad:'RMO · INMO · IMO' };
  return (
    <div style={{ minHeight:'100vh', background:'#06100e', padding:'28px 16px 60px' }}>
      <div style={{ maxWidth:660, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>Chapter · Probability</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:30, color:'#fff', letterSpacing:'-0.8px', marginBottom:6 }}>Choose a Topic</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:15, color:'rgba(255,255,255,0.4)', marginBottom:14 }}>Pass the quiz gate to unlock each next topic.</p>
          <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(completedIds.size/SECTIONS.length)*100}%`, background:`linear-gradient(90deg,${ACCENT},#34D399)`, borderRadius:4, transition:'width 0.5s ease' }} />
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
  const lColors = { Foundation:'#10B981', Intermediate:'#F59E0B', Olympiad:'#8B5CF6' };
  const col = lColors[section.level] || ACCENT;
  const barData = section.id === 'random_vars' ? [
    {l:'0',v:0.1},{l:'1',v:0.25},{l:'2',v:0.3},{l:'3',v:0.2},{l:'4',v:0.1},{l:'5',v:0.05}
  ] : null;
  return (
    <div style={{ minHeight:'100vh', background:'#06100e', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(6,16,14,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px', display:'flex', alignItems:'center', gap:12 }}>
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
            {section.diagram === 'venn' && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16, display:'flex', justifyContent:'center' }}>
                <VennSVG shade={section.diagramShade||'union'} color={col} size={280} />
              </div>
            )}
            {section.diagram === 'tree' && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16 }}>
                <ProbTreeSVG color={col} size={300} />
              </div>
            )}
            {section.diagram === 'bar' && barData && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16 }}>
                <BarChartSVG data={barData} color={col} size={300} title="Example: Binomial PMF distribution" />
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
  const lColors = { Foundation:'#10B981', Intermediate:'#F59E0B', Olympiad:'#8B5CF6' };
  const col = lColors[section.level] || ACCENT;
  const gen = GENERATORS[section.genKey] || GENERATORS.terminology;
  const seed = baseSeed + qIdx * 97;
  const question = useCallback(() => { try { return gen(seed); } catch { return { question:'Loading…', steps:[], answer:'—', answerLatex:'—', tip:'' }; } }, [seed])();
  const next = () => { setQIdx(i => i+1); setShowAnswer(false); setShowSteps(false); setCount(c => c+1); };
  return (
    <div style={{ minHeight:'100vh', background:'#06100e', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(6,16,14,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>← Learn</button>
          <div style={{ flex:1, fontFamily:'Playfair Display, serif', fontSize:14, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{section.title}</div>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:col, background:`${col}15`, padding:'4px 10px', borderRadius:20, flexShrink:0 }}>Q {count+1}</div>
          <button onClick={onStartQuiz} className="btn" style={{ background:`${col}20`, border:`1px solid ${col}55`, color:col, borderRadius:8, padding:'6px 13px', fontSize:13, fontWeight:700, flexShrink:0 }}>Done → Quiz ✓</button>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'Crimson Pro,serif', fontStyle:'italic' }}>Infinite practice · Click "Done → Quiz" when ready to unlock next topic</div>
      </div>
      <div style={{ maxWidth:660, margin:'0 auto', padding:'24px 16px' }}>
        <div key={qIdx} className="fade-up" style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${col}30`, borderRadius:16, overflow:'hidden', marginBottom:18 }}>
          <div style={{ background:`${col}10`, borderBottom:`1px solid ${col}20`, padding:'10px 18px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:col, animation:'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize:11, color:col, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace' }}>Practice · {section.level}</span>
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
  const lColors = { Foundation:'#10B981', Intermediate:'#F59E0B', Olympiad:'#8B5CF6' };
  const col = lColors[section.level] || ACCENT;
  const [baseSeed] = useState(() => Math.floor(Math.random() * 7777));
  const TOTAL = 4;
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const quizGen = QUIZ_GENERATORS[section.genKey] || QUIZ_GENERATORS.terminology;
  const qSeed = baseSeed + qIdx * 113;
  const question = useCallback(() => {
    let q; let tries = 0;
    do { try { q = quizGen(qSeed + tries * 7); } catch { q = null; } tries++; }
    while ((!q || !q.q || !q.opts || q.opts.length < 2) && tries < 10);
    if (!q || !q.q) return { q:`P(A)=0.4, P(A')=?`, opts:['0.6','0.4','1','0'], correct:'0.6', tip:"P(A')=1-P(A)." };
    return q;
  }, [qSeed])();
  const opts = (question.opts||[]).slice(0, 4);
  const correctAnswer = question.correct;
  const confirm = () => {
    if (selected === null) return;
    const isCorrect = String(selected) === String(correctAnswer);
    setConfirmed(true);
    if (isCorrect) setScore(s => s + 1);
    else setShakeKey(k => k + 1);
    setResults(r => [...r, { correct: isCorrect, question: question.q }]);
  };
  const goNext = () => {
    if (qIdx + 1 >= TOTAL) setFinished(true);
    else { setQIdx(i => i + 1); setSelected(null); setConfirmed(false); }
  };
  if (finished) {
    const passed = score === TOTAL;
    return (
      <div style={{ minHeight:'100vh', background:'#06100e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', textAlign:'center' }}>
        <div className="pop-in" style={{ maxWidth:420, width:'100%' }}>
          {passed ? <TrophySVG col={col} /> : (
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ display:'block', margin:'0 auto' }}>
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
            {passed ? `Perfect score! You've mastered "${section.title}". Unlocking the next topic.` : `You got ${score} out of ${TOTAL}. All 4 correct needed to advance. Review the topic and try again.`}
          </div>
          {results.map((r, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:r.correct?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${r.correct?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}`, borderRadius:8, marginBottom:6, textAlign:'left' }}>
              <span style={{ fontSize:16 }}>{r.correct?'✅':'❌'}</span>
              <span style={{ fontFamily:'Crimson Pro,serif', fontSize:13, color:'rgba(255,255,255,0.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Q{i+1}: {r.question.substring(0,60)}{r.question.length>60?'…':''}</span>
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
    <div style={{ minHeight:'100vh', background:'#06100e', paddingBottom:60 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(6,16,14,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
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
          <p style={{ fontFamily:'Crimson Pro,serif', fontSize:17, color:'#e2e8f0', lineHeight:1.75, marginBottom:question.questionLatex&&question.questionLatex!==question.q?14:0 }}>{question.q}</p>
          {question.questionLatex && question.questionLatex !== question.q && (
            <div style={{ background:`${col}0d`, border:`1px solid ${col}20`, borderRadius:10, padding:'10px 14px', overflowX:'auto' }}>
              <KTex l={question.questionLatex} style={{ color:col, fontSize:15 }} />
            </div>
          )}
        </div>
        <div key={`opts-${shakeKey}`} style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }} className={confirmed && String(selected) !== String(correctAnswer) ? 'shake' : ''}>
          {opts.map((opt, i) => {
            const isSelected = String(selected) === String(opt);
            const isCorrect = String(opt) === String(correctAnswer);
            let bg='rgba(255,255,255,0.04)',border='1px solid rgba(255,255,255,0.1)',color='rgba(255,255,255,0.8)';
            if (confirmed) {
              if (isCorrect) { bg='rgba(16,185,129,0.12)'; border='1px solid rgba(16,185,129,0.5)'; color='#34D399'; }
              else if (isSelected && !isCorrect) { bg='rgba(239,68,68,0.12)'; border='1px solid rgba(239,68,68,0.5)'; color='#FCA5A5'; }
            } else if (isSelected) { bg=`${col}18`; border=`1px solid ${col}66`; color=col; }
            return (
              <button key={i} onClick={() => !confirmed && setSelected(opt)} className={!confirmed?'btn':''} disabled={confirmed}
                style={{ background:bg, border, borderRadius:12, padding:'14px 18px', textAlign:'left', color, fontFamily:'Crimson Pro,serif', fontSize:16, display:'flex', alignItems:'center', gap:12, cursor:confirmed?'default':'pointer', transition:'all 0.15s ease' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:isSelected&&!confirmed?`${col}25`:confirmed&&isCorrect?'rgba(16,185,129,0.2)':confirmed&&isSelected?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)', border:`1px solid ${isSelected&&!confirmed?col+'66':confirmed&&isCorrect?'rgba(16,185,129,0.5)':confirmed&&isSelected?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:'JetBrains Mono,monospace', flexShrink:0, color:isSelected&&!confirmed?col:confirmed&&isCorrect?'#34D399':confirmed&&isSelected?'#FCA5A5':'rgba(255,255,255,0.4)' }}>
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
        {!confirmed ? (
          <button onClick={confirm} disabled={selected===null} className="btn" style={{ width:'100%', padding:'14px', background:selected!==null?`linear-gradient(135deg,${col},${col}bb)`:'rgba(255,255,255,0.06)', border:selected!==null?'none':'1px solid rgba(255,255,255,0.1)', color:selected!==null?'#fff':'rgba(255,255,255,0.3)', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16, opacity:selected===null?0.6:1, cursor:selected===null?'not-allowed':'pointer' }}>
            Submit Answer
          </button>
        ) : (
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
  const nextSection = SECTIONS[activeIdx + 1] || null;
  const handlePass = () => {
    setCompletedIds(prev => new Set([...prev, activeSection.id]));
    if (nextSection) { setActiveIdx(activeIdx + 1); setScreen('learn'); }
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

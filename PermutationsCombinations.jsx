import { useState, useEffect, useRef, useCallback } from "react";

// KaTeX CDN loader
let _kDone=false; const _kCbs=[];
function _initKaTeX(){
  if(_kDone||window.katex||document.querySelector('[data-kx]'))return;
  const l=document.createElement('link');l.rel='stylesheet';l.setAttribute('data-kx','1');
  l.href='https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
  document.head.appendChild(l);
  const s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
  s.onload=()=>{ _kDone=true; _kCbs.forEach(f=>f()); _kCbs.length=0; };
  document.head.appendChild(s);
}
function onKaTeX(cb){ (_kDone||window.katex)?cb():_kCbs.push(cb); }

// Helpers
const sr  = n => Math.abs(Math.sin(n*127.1+311.7)*43758.5453)%1;
const srI = (n,lo,hi) => Math.floor(sr(n)*(hi-lo+1))+lo;
const srP = (arr,n) => arr[Math.floor(sr(n)*arr.length)];
const fmt = (n,d=4) => Number.isFinite(n)?+n.toFixed(d)===0?'0':n.toFixed(d):'--';
const ACCENT = '#F59E0B';

function fact(n){ if(n<=1)return 1; let r=1; for(let i=2;i<=n;i++)r*=i; return r; }
function C(n,r){ if(r<0||r>n)return 0; return Math.round(fact(n)/(fact(r)*fact(n-r))); }
function D(n){ if(n===0)return 1; if(n===1)return 0; return (n-1)*(D(n-1)+D(n-2)); }
function Cat(n){ return Math.round(C(2*n,n)/(n+1)); }
function shuffle(arr,seed){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(sr(seed*i+i)*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

// KaTeX Renderer
function KTex({ l, block=false, style={} }){
  const ref=useRef(null);
  const [ready,setReady]=useState(!!window.katex);
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

// Counting Tree SVG
function CountingTreeSVG({ a=3, b=2, color=ACCENT, size=300 }){
  const la=['A','B','C','D','E'].slice(0,a);
  const lb=['1','2','3','4'].slice(0,b);
  const rowH=36, pad=20, H=a*b*rowH+2*pad, W=size;
  const xR=30, xM=W*0.38, xL=W*0.78;
  const leafY=i=>pad+i*rowH+rowH/2;
  const midY=i=>pad+(i*b+(b-1)/2)*rowH+rowH/2;
  return(
    <svg width={W} height={H+20} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      {la.map((_,i)=><line key={i} x1={xR} y1={H/2} x2={xM} y2={midY(i)} stroke={`${color}50`} strokeWidth={1.5}/>)}
      {la.map((_,i)=>lb.map((_,j)=><line key={`${i}-${j}`} x1={xM} y1={midY(i)} x2={xL} y2={leafY(i*b+j)} stroke={`${color}35`} strokeWidth={1}/>))}
      <circle cx={xR} cy={H/2} r={14} fill={`${color}20`} stroke={color} strokeWidth={1.5}/>
      <text x={xR} y={H/2+4} textAnchor="middle" fill={color} fontSize={11} fontFamily="JetBrains Mono,monospace">*</text>
      {la.map((lbl,i)=>(<g key={i}><circle cx={xM} cy={midY(i)} r={14} fill={`${color}20`} stroke={color} strokeWidth={1.5}/><text x={xM} y={midY(i)+4} textAnchor="middle" fill={color} fontSize={12} fontFamily="JetBrains Mono,monospace">{lbl}</text></g>))}
      {la.map((l1,i)=>lb.map((l2,j)=>{ const y=leafY(i*b+j); return(<g key={`${i}-${j}`}><rect x={xL-16} y={y-11} width={32} height={22} rx={6} fill={`${color}15`} stroke={`${color}55`} strokeWidth={1}/><text x={xL} y={y+4} textAnchor="middle" fill={color} fontSize={11} fontFamily="JetBrains Mono,monospace">{l1}{l2}</text></g>); }))}
      <text x={W-4} y={H/2+4} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize={12} fontFamily="Crimson Pro,serif">{a}x{b}={a*b}</text>
    </svg>
  );
}

// Grid Path SVG
function GridPathSVG({ m=3, n=2, color=ACCENT, size=300 }){
  const W=size, H=170, pad=28;
  const cW=(W-2*pad)/m, cH=(H-2*pad)/n;
  const toX=c=>pad+c*cW, toY=r=>H-pad-r*cH;
  const pts=[{c:0,r:0}];
  [...Array(m).fill('R'),...Array(n).fill('U')].forEach(d=>{ const last=pts[pts.length-1]; pts.push(d==='R'?{c:last.c+1,r:last.r}:{c:last.c,r:last.r+1}); });
  const pStr=pts.map(p=>`${toX(p.c).toFixed(1)},${toY(p.r).toFixed(1)}`).join(' ');
  const total=C(m+n,m);
  return(
    <svg width={W} height={H+24} style={{display:'block',margin:'0 auto'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      {Array.from({length:m+1},(_,c)=><line key={`v${c}`} x1={toX(c)} y1={toY(0)} x2={toX(c)} y2={toY(n)} stroke="rgba(255,255,255,0.1)" strokeWidth={1}/>)}
      {Array.from({length:n+1},(_,r)=><line key={`h${r}`} x1={toX(0)} y1={toY(r)} x2={toX(m)} y2={toY(r)} stroke="rgba(255,255,255,0.1)" strokeWidth={1}/>)}
      {Array.from({length:m+1},(_,c)=>Array.from({length:n+1},(_,r)=><circle key={`${c}-${r}`} cx={toX(c)} cy={toY(r)} r={3} fill="rgba(255,255,255,0.2)"/>))}
      <polyline points={pStr} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round"/>
      <circle cx={toX(0)} cy={toY(0)} r={6} fill={color}/><circle cx={toX(m)} cy={toY(n)} r={6} fill={color}/>
      <text x={toX(0)+2} y={toY(0)+18} fill={color} fontSize={10} fontFamily="JetBrains Mono">(0,0)</text>
      <text x={toX(m)-22} y={toY(n)-8} fill={color} fontSize={10} fontFamily="JetBrains Mono">({m},{n})</text>
      <text x={W/2} y={H+16} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={11} fontFamily="Crimson Pro,serif">C({m+n},{m})={total} total paths</text>
    </svg>
  );
}

// Trophy SVG
function TrophySVG({ col=ACCENT }){
  return(
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="bgG2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={col} stopOpacity="0.25"/><stop offset="100%" stopColor={col} stopOpacity="0"/></radialGradient>
        <linearGradient id="trG2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFD700"/><stop offset="50%" stopColor="#FFA500"/><stop offset="100%" stopColor="#FF6B35"/></linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#bgG2)"/>
      <circle cx="36" cy="36" r="32" fill="none" stroke={col} strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M24 18 h24 l-4 20 Q36 44 36 44 Q36 44 28 38 Z" fill="url(#trG2)" opacity="0.95"/>
      <path d="M24 22 Q16 22 16 30 Q16 36 24 36" fill="none" stroke="url(#trG2)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 22 Q56 22 56 30 Q56 36 48 36" fill="none" stroke="url(#trG2)" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="33" y="44" width="6" height="8" rx="1" fill="#FFA500" opacity="0.9"/>
      <rect x="27" y="52" width="18" height="4" rx="2" fill="url(#trG2)"/>
      <polygon points="36,21 37.5,25.5 42,25.5 38.5,28 40,32.5 36,30 32,32.5 33.5,28 30,25.5 34.5,25.5" fill="#FFF8DC" opacity="0.95"/>
      <circle cx="16" cy="16" r="2.5" fill={col} opacity="0.9"/><circle cx="56" cy="16" r="2" fill="#FFD700" opacity="0.9"/>
      <circle cx="14" cy="48" r="1.8" fill="#FF6B35" opacity="0.8"/><circle cx="58" cy="48" r="2.2" fill={col} opacity="0.8"/>
      <circle cx="36" cy="10" r="2" fill="#FFD700" opacity="0.7"/>
    </svg>
  );
}

// NOTATION
const NOTATION = [
  { sym:'n!',                           name:'Factorial',                  meaning:'n!=n(n-1)...2.1; 0!=1',                ex:'5!=120,\\;7!=5040' },
  { sym:'{}^nP_r=\\frac{n!}{(n-r)!}', name:'Permutation',                meaning:'Ordered selections; r items from n',    ex:'{}^5P_3=60' },
  { sym:'{}^nC_r=\\binom{n}{r}',       name:'Combination',                meaning:'Unordered selections; n choose r',      ex:'\\binom{5}{3}=10' },
  { sym:'\\binom{n}{r}=\\binom{n}{n-r}',name:'Symmetry Property',         meaning:'Choosing r same as leaving n-r',        ex:'\\binom{10}{3}=\\binom{10}{7}=120' },
  { sym:'\\binom{n}{r}=\\binom{n-1}{r-1}+\\binom{n-1}{r}',name:"Pascal's Identity",'meaning':'Entry = sum of two above', ex:'\\binom{5}{2}=\\binom{4}{1}+\\binom{4}{2}' },
  { sym:'\\sum_{r=0}^n\\binom{n}{r}=2^n',name:'Row Sum = 2^n',            meaning:'Sum of all C(n,r) for fixed n',         ex:'\\binom{4}{0}+\\cdots+\\binom{4}{4}=16' },
  { sym:'(n-1)!',                       name:'Circular Permutation',       meaning:'Arrangements in a circle; fix one',     ex:'5\\text{ people: }4!=24\\text{ ways}' },
  { sym:'\\frac{n!}{p!q!r!}',          name:'Repeated Arrangements',      meaning:'n objects with p,q,r identical copies', ex:'\\frac{11!}{4!4!2!1!}=34650\\;(MISSISSIPPI)' },
  { sym:'{}^{n+r-1}C_r',               name:'Selection w/ Repetition',    meaning:'r items from n types; repeats allowed', ex:'{}^{4+3-1}C_3=\\binom{6}{3}=20' },
  { sym:'\\binom{n+k-1}{k-1}',         name:'Stars and Bars',             meaning:'Non-neg int sols to x_1+\\cdots+x_k=n', ex:'\\binom{9}{2}=36\\;(x+y+z=7)' },
  { sym:'\\frac{n!}{n_1!n_2!\\cdots}', name:'Multinomial Coefficient',    meaning:'Distribute n into labelled groups',      ex:'\\frac{12!}{4!4!4!}=34650' },
  { sym:'|A\\cup B|=|A|+|B|-|A\\cap B|',name:'PIE (2 sets)',              meaning:'Inclusion-Exclusion Principle',          ex:'|A\\cup B\\cup C|\\text{ uses 7 terms}' },
  { sym:'D_n=(n-1)(D_{n-1}+D_{n-2})', name:'Derangement Recurrence',     meaning:'No element in its original place',       ex:'D_4=9,\\;D_5=44,\\;D_n/n!\\to 1/e' },
  { sym:'\\binom{m+n}{m}',             name:'Grid / Lattice Paths',       meaning:'Paths (0,0)\\to(m,n) via R and U steps', ex:'\\binom{7}{3}=35\\text{ paths on 3x4}' },
  { sym:'C_n=\\frac{1}{n+1}\\binom{2n}{n}',name:'Catalan Number',        meaning:'Counts brackets, triangulations, etc.',  ex:'C_0=1,1,2,5,14,42,\\ldots' },
  { sym:'PHP',                          name:'Pigeonhole Principle',        meaning:'n+1 objects, n boxes => 1 box has >=2', ex:'13\\text{ people => 2 share birth month}' },
  { sym:'G(x)=\\sum_{n\\ge0}a_nx^n',  name:'Ordinary Gen. Function',     meaning:'Power series encoding sequence {a_n}',  ex:'\\frac{1}{1-x}=\\sum x^n' },
  { sym:'a_n=c_1a_{n-1}+c_2a_{n-2}',  name:'Linear Recurrence',          meaning:'Solved via characteristic equation',     ex:'F_n=F_{n-1}+F_{n-2}\\;(Fibonacci)' },
  { sym:'\\sum_v\\deg(v)=2|E|',        name:'Handshaking Lemma',          meaning:'Sum of degrees = twice edge count',      ex:'K_n:\\;n(n-1)=2|E|' },
  { sym:'S(n,k)=kS(n-1,k)+S(n-1,k-1)',name:'Stirling No. (2nd Kind)',    meaning:'Partitions of [n] into k non-empty sets',ex:'S(4,2)=7' },
  { sym:'n^{n-2}',                     name:"Cayley's Formula",           meaning:'Labelled trees on n vertices',           ex:'3^1=3\\text{ trees on 3 vertices}' },
  { sym:'R(s,t)',                       name:'Ramsey Number',              meaning:'Min n: K_n has K_s or K_t in 2-colour', ex:'R(3,3)=6' },
];

// SECTIONS
const SECTIONS = [
  // Foundation
  { id:'counting_principles', title:'Fundamental Counting Principles', level:'Foundation', color:'#4ECDC4', icon:'AND/OR',
    shortDef:'AND means multiply; OR (mutually exclusive) means add. These two rules underpin all of combinatorics.',
    fullDef:"The Multiplication Principle: if task 1 can be done in m ways and task 2 independently in n ways, together they can be done in m*n ways — draw a tree to see every branch multiply. The Addition Principle: if two events are mutually exclusive, the total is m+n. Most real counting problems chain both rules: partition into disjoint cases (add), then multiply within each case. Example: 2-letter codes from {A,B,C} followed by a digit 0-9: 3*3*10=90 (with repetition) or 3*2*10=60 (no repetition). Getting these two rules completely automatic is the single most important step in combinatorics.",
    keyFacts:[
      {text:'Multiplication (AND)', l:'m\\times n\\text{ ways to do task 1 AND task 2}'},
      {text:'Addition (OR)', l:'m+n\\text{ ways when tasks are mutually exclusive}'},
      {text:'Chain of k tasks', l:'n_1\\times n_2\\times\\cdots\\times n_k'},
      {text:'Classic: license plates', l:'26^2\\times10^4=6{,}760{,}000'},
      {text:'With vs without repetition', l:'n^r\\text{ (with rep.) vs }n(n-1)\\cdots(n-r+1)\\text{ (no rep.)}'},
    ], genKey:'counting_principles', diagram:'tree' },
  { id:'factorial', title:'Factorial Notation  n!', level:'Foundation', color:'#FF6B6B', icon:'n!',
    shortDef:'n! = n(n-1)...2.1 counts arrangements of n distinct objects. By convention 0!=1.',
    fullDef:"n! counts the number of ways to arrange n distinct objects in a row. The reasoning: first position has n choices, second n-1, ..., last 1 — product is n!. Key identity: n!=n(n-1)!. This lets you cancel tails: n!/(n-r)! = n(n-1)...(n-r+1), which is a product of exactly r terms. Special: 0!=1!=1. Legendre's formula for highest power of prime p dividing n!: floor(n/p)+floor(n/p^2)+... Trailing zeros in n! = min(power of 2, power of 5) = power of 5 = floor(n/5)+floor(n/25)+...",
    keyFacts:[
      {text:'Definition', l:'n!=n\\cdot(n-1)\\cdot(n-2)\\cdots2\\cdot1'},
      {text:'Recurrence', l:'n!=n\\cdot(n-1)!'},
      {text:'0!=1!=1', l:'0!=1,\\quad1!=1'},
      {text:'Cancellation shortcut', l:'\\frac{n!}{(n-r)!}=n(n-1)\\cdots(n-r+1)\\quad(r\\text{ factors})'},
      {text:'Trailing zeros in n!', l:'\\left\\lfloor\\frac{n}{5}\\right\\rfloor+\\left\\lfloor\\frac{n}{25}\\right\\rfloor+\\left\\lfloor\\frac{n}{125}\\right\\rfloor+\\cdots'},
      {text:"Legendre's formula", l:'\\nu_p(n!)=\\sum_{k=1}^{\\infty}\\left\\lfloor\\frac{n}{p^k}\\right\\rfloor'},
    ], genKey:'factorial' },
  { id:'permutations', title:'Permutations  ^nP_r', level:'Foundation', color:'#34D399', icon:'nPr',
    shortDef:'^nP_r = n!/(n-r)! counts ordered arrangements of r objects from n distinct objects.',
    fullDef:"A permutation is an ordered selection — the arrangement matters. Selecting and arranging r objects from n distinct ones: first spot has n choices, second n-1, ..., r-th has n-r+1. Product = n!/(n-r)! = ^nP_r. Special case r=n: ^nP_n = n!. Relation to C: ^nP_r = ^nC_r * r!. Dictionary rank of a word: for each position, count how many letters are smaller, multiply by (remaining-1)!, then sum and add 1. Key word test: if 'order matters', use P.",
    keyFacts:[
      {text:'Formula', l:'^nP_r=\\frac{n!}{(n-r)!}=n(n-1)\\cdots(n-r+1)'},
      {text:'Special case r=n', l:'^nP_n=n!'},
      {text:'Relation to C', l:'^nP_r={}^nC_r\\cdot r!'},
      {text:'Dictionary rank', l:'\\text{Count smaller letters at each position, multiply by }(k-1)!'},
      {text:'Keywords', l:'\\text{arrange, order, sequence, rank, queue}\\Rightarrow P'},
    ], genKey:'permutations' },
  { id:'combinations', title:'Combinations  ^nC_r', level:'Foundation', color:'#A78BFA', icon:'nCr',
    shortDef:'^nC_r = n!/(r!(n-r)!) counts unordered selections of r objects from n distinct objects.',
    fullDef:"A combination is an unordered selection. ^nC_r = ^nP_r/r! = n!/(r!(n-r)!). Pascal's Identity: C(n,r) = C(n-1,r-1)+C(n-1,r). Symmetry: C(n,r)=C(n,n-r). Row sum: sum C(n,r) = 2^n. Vandermonde: sum C(m,k)*C(n,r-k) = C(m+n,r). Hockey Stick: sum_{k=0}^{r} C(k+n,k) = C(n+r+1,r). These identities appear throughout JEE and olympiad problems. Key word test: if 'order doesn't matter', use C.",
    keyFacts:[
      {text:'Formula', l:'\\binom{n}{r}=\\frac{n!}{r!(n-r)!}'},
      {text:'Symmetry', l:'\\binom{n}{r}=\\binom{n}{n-r}'},
      {text:"Pascal's Identity", l:'\\binom{n}{r}=\\binom{n-1}{r-1}+\\binom{n-1}{r}'},
      {text:'Row sum', l:'\\sum_{r=0}^n\\binom{n}{r}=2^n'},
      {text:'Hockey Stick', l:'\\sum_{k=0}^r\\binom{k+n}{k}=\\binom{n+r+1}{r}'},
    ], genKey:'combinations' },
  // JEE
  { id:'rep_arrangements', title:'Arrangements with Repetition', level:'JEE', color:'#EC4899', icon:'ABCB',
    shortDef:'Arrange n objects where p,q,r are identical: n!/(p!q!r!). Condition: p+q+...=n.',
    fullDef:"When identical objects exist, many arrangements look the same. For a word with n letters having n1 copies of letter 1, n2 of letter 2, ..., the number of distinct arrangements is n!/(n1!n2!...nk!). This is the multinomial coefficient. MISSISSIPPI: 11 letters = M(1),I(4),S(4),P(2) => 11!/(1!4!4!2!) = 34650. Number of binary strings with exactly r ones = C(n,r) = n!/(r!(n-r)!). Always check: are any objects identical before using the formula.",
    keyFacts:[
      {text:'General formula', l:'\\frac{n!}{n_1!n_2!\\cdots n_k!}'},
      {text:'MISSISSIPPI example', l:'\\frac{11!}{1!\\cdot4!\\cdot4!\\cdot2!}=34{,}650'},
      {text:'Required condition', l:'n_1+n_2+\\cdots+n_k=n'},
      {text:'Binary strings: r ones in n', l:'\\binom{n}{r}=\\frac{n!}{r!(n-r)!}'},
    ], genKey:'rep_arrangements' },
  { id:'circular_perm', title:'Circular Permutations', level:'JEE', color:'#8B5CF6', icon:'(O)',
    shortDef:'Arrange n distinct objects in a circle: (n-1)! ways. Necklaces (reflections equal): (n-1)!/2.',
    fullDef:"In a circle, only relative positions matter — rotating everyone one seat gives the same seating. Fix one person; arrange remaining n-1 linearly: (n-1)!. For necklaces, a flip (reflection) also gives the same arrangement: divide by 2 for (n-1)!/2. With some identical objects, divide further by their repetition counts. If k specific people must sit together: treat them as one block, circular = (n-k)! arrangements, internal = k! arrangements, total = (n-k)! * k!.",
    keyFacts:[
      {text:'Around a circular table', l:'(n-1)!'},
      {text:'Necklace / bracelet', l:'\\frac{(n-1)!}{2}'},
      {text:'Key idea: fix one object', l:'\\text{Remove rotational redundancy by fixing one element}'},
      {text:'k people together (circular)', l:'(n-k)!\\cdot k!'},
      {text:'5 people at a table', l:'(5-1)!=4!=24'},
    ], genKey:'circular_perm' },
  { id:'selection_rep', title:'Selection with Repetition', level:'JEE', color:'#F97316', icon:'* *',
    shortDef:'Choose r items from n types when repetition is allowed: C(n+r-1, r).',
    fullDef:"Choosing r scoops of ice cream from n flavours (order irrelevant, repeats allowed): C(n+r-1, r). This equals the number of non-negative integer solutions to x1+x2+...+xn = r, visualised as placing r stars among n-1 dividing bars. Different from C(n,r) (no repetition) and n^r (repetition with order). For positive solutions (xi>=1): substitute yi=xi-1 to get y1+...+yn=r-n, answer C(r-1,n-1).",
    keyFacts:[
      {text:'Formula', l:'{}^{n+r-1}C_r=\\binom{n+r-1}{r}'},
      {text:'Equivalently', l:'\\text{Non-neg. sols to }x_1+\\cdots+x_n=r'},
      {text:'3 scoops from 4 flavours', l:'\\binom{6}{3}=20'},
      {text:'Positive solutions (x_i>=1)', l:'\\binom{r-1}{n-1}'},
    ], genKey:'selection_rep' },
  { id:'constrained', title:'Constrained Permutations', level:'JEE', color:'#2DD4BF', icon:'[ok]',
    shortDef:'"Vowels together": glue them into one block. "No two adjacent": place others first, use gaps.',
    fullDef:"Vowels always together: glue all vowels into one block. Arrange (consonants + 1 block) — that's (c+1)! ways. Multiply by v! for internal arrangements of the vowel block. No two vowels adjacent: first place c consonants (c! ways), creating c+1 gaps. Choose v of those gaps: C(c+1,v) ways. Arrange v vowels in chosen gaps: v! ways. Not together: Total - (together). At least one: 1 - P(none). Fixed positions: fill fixed slots first, then permute the rest.",
    keyFacts:[
      {text:'Vowels always together', l:'(c+1)!\\times v!\\quad(c=\\text{consonants, }v=\\text{vowels})'},
      {text:'No two vowels adjacent', l:'c!\\times{}^{c+1}P_v=c!\\cdot\\frac{(c+1)!}{(c+1-v)!}'},
      {text:'Not together', l:'\\text{Total}-\\text{P(all together)}'},
      {text:'At least one condition', l:'\\text{Total}-\\text{P(violates condition)}'},
    ], genKey:'constrained' },
  { id:'division_dist', title:'Division and Distribution', level:'JEE', color:'#FCD34D', icon:'[::]',
    shortDef:'4 cases: distinct/identical items into distinct/identical boxes. Each has a different formula.',
    fullDef:"Four fundamental cases: (1) n distinct items, k distinct boxes, any distribution: k^n. (2) n distinct items, k labelled groups of sizes n1,...,nk: n!/(n1!...nk!). (3) n identical items, k distinct boxes (any number per box): Stars and Bars = C(n+k-1,k-1). (4) n identical items, k identical boxes: integer partition (use generating functions). Surjective (each box non-empty): inclusion-exclusion gives sum_{j=0}^{k}(-1)^j*C(k,j)*(k-j)^n.",
    keyFacts:[
      {text:'Distinct into distinct (unrestricted)', l:'k^n'},
      {text:'Distinct into groups of sizes n_i', l:'\\frac{n!}{n_1!n_2!\\cdots n_k!}'},
      {text:'Identical into distinct (unrestricted)', l:'\\binom{n+k-1}{k-1}\\quad(\\text{Stars and Bars})'},
      {text:'Surjective (at least 1 each)', l:'\\sum_{j=0}^k(-1)^j\\binom{k}{j}(k-j)^n'},
    ], genKey:'division_dist' },
  { id:'stars_bars', title:'Stars and Bars Method', level:'JEE', color:'#F43F5E', icon:'*|*',
    shortDef:'Non-neg. integer solutions to x1+...+xk=n: C(n+k-1,k-1). Positive solutions: C(n-1,k-1).',
    fullDef:"Stars and Bars: represent n identical stars in a row and place k-1 dividing bars among them. Total symbols = n+k-1; choose positions for k-1 bars: C(n+k-1,k-1). This counts integer solutions to x1+...+xk=n with xi>=0. For xi>=1 (positive): substitute yi=xi-1, get y1+...+yk=n-k, answer C(n-1,k-1). For xi>=ci: substitute yi=xi-ci, get yi>=0, reduce to non-negative case. Upper bounds require inclusion-exclusion on top of Stars and Bars.",
    keyFacts:[
      {text:'Non-negative solutions (x_i>=0)', l:'\\binom{n+k-1}{k-1}=\\binom{n+k-1}{n}'},
      {text:'Positive solutions (x_i>=1)', l:'\\binom{n-1}{k-1}'},
      {text:'Lower bounded (x_i>=c)', l:'\\text{Sub }y_i=x_i-c,\\;\\text{reduces to non-neg case}'},
      {text:'Example: x+y+z=10, all>=0', l:'\\binom{12}{2}=66\\text{ solutions}'},
    ], genKey:'stars_bars' },
  { id:'pie', title:'Inclusion-Exclusion Principle', level:'JEE', color:'#0EA5E9', icon:'A|B',
    shortDef:'|A1 u A2 u...u An| = sum singles - sum pairs + sum triples - ... Corrects for overlaps.',
    fullDef:"PIE corrects for overlaps in set unions. Two sets: |A u B|=|A|+|B|-|A n B|. Three sets: add all three, subtract pairwise intersections, add triple. The pattern of alternating signs continues. Derangement formula uses PIE: D_n = n! * sum(-1)^k/k!, k=0..n. Surjective functions use PIE. In competition problems, identify the universal set U, define Ai as 'elements violating condition i', then |none violated| = |U| - |A1 u A2 u...|.",
    keyFacts:[
      {text:'Two sets', l:'|A\\cup B|=|A|+|B|-|A\\cap B|'},
      {text:'Three sets', l:'|A\\cup B\\cup C|=|A|+|B|+|C|-|A\\cap B|-|B\\cap C|-|A\\cap C|+|A\\cap B\\cap C|'},
      {text:'General PIE', l:'\\left|\\bigcup_{i=1}^nA_i\\right|=\\sum_{k=1}^n(-1)^{k+1}\\sum_{|S|=k}\\left|\\bigcap_{i\\in S}A_i\\right|'},
      {text:'Surjective functions', l:'\\sum_{j=0}^m(-1)^j\\binom{m}{j}(m-j)^n'},
    ], genKey:'pie' },
  { id:'derangements', title:'Derangements  D_n', level:'JEE', color:'#14B8A6', icon:'D_n',
    shortDef:'D_n = (n-1)(D_{n-1}+D_{n-2}). No element in its original position. D_n/n! -> 1/e.',
    fullDef:"A derangement of {1,...,n} is a permutation sigma with sigma(i) != i for all i. PIE gives: D_n = n! * sum_{k=0}^{n} (-1)^k/k!. Recurrence: D_n = (n-1)(D_{n-1}+D_{n-2}), D_1=0, D_2=1. Also D_n = n*D_{n-1}+(-1)^n. As n grows, D_n/n! -> 1/e ~ 0.3679: about 36.8% of all permutations are derangements. Values: D_2=1, D_3=2, D_4=9, D_5=44, D_6=265.",
    keyFacts:[
      {text:'PIE formula', l:'D_n=n!\\sum_{k=0}^n\\frac{(-1)^k}{k!}'},
      {text:'Recurrence', l:'D_n=(n-1)(D_{n-1}+D_{n-2})'},
      {text:'Alternate recurrence', l:'D_n=n\\cdot D_{n-1}+(-1)^n'},
      {text:'Asymptotic probability', l:'\\frac{D_n}{n!}\\to\\frac{1}{e}\\approx0.3679'},
      {text:'Values', l:'D_2=1,\\;D_3=2,\\;D_4=9,\\;D_5=44,\\;D_6=265'},
    ], genKey:'derangements' },
  { id:'grid_paths', title:'Grid / Lattice Path Problems', level:'JEE', color:'#C084FC', icon:'[->]',
    shortDef:'Paths from (0,0) to (m,n) using only Right and Up steps: C(m+n, m).',
    fullDef:"On a grid, a shortest path from (0,0) to (m,n) uses exactly m rights and n ups, total m+n steps. Choose which m of them are right: C(m+n,m). Via a forbidden point P=(a,b): paths through P = C(a+b,a)*C((m-a)+(n-b),m-a); subtract from total. Catalan number C_n = C(2n,n)/(n+1) counts paths from (0,0) to (n,n) that stay on or below the main diagonal. Reflection principle: bad paths (crossing the diagonal) biject with all paths from the reflected starting point.",
    keyFacts:[
      {text:'Grid paths formula', l:'\\binom{m+n}{m}'},
      {text:'Via point (a,b)', l:'\\binom{a+b}{a}\\cdot\\binom{m+n-a-b}{m-a}'},
      {text:'Catalan number', l:'C_n=\\frac{1}{n+1}\\binom{2n}{n}'},
      {text:'Reflection principle', l:'\\text{Bad paths}\\leftrightarrow\\text{paths from reflected start}'},
    ], genKey:'grid_paths', diagram:'grid' },
  // Olympiad
  { id:'pigeonhole', title:'Pigeonhole Principle', level:'Olympiad', color:'#F59E0B', icon:'PHP',
    shortDef:'n+1 objects in n boxes => one box has >= 2. Generalised: ceil(N/k) in one box when N objects, k boxes.',
    fullDef:"Basic PHP: n+1 objects in n boxes => some box has >= 2. Generalised: N objects in k boxes => some box has >= ceil(N/k). In olympiads, the art is identifying the right 'pigeons' (objects) and 'holes' (categories). Classic setups: residue classes, colouring, intervals, distances. Erdos-Szekeres: any sequence of mn+1 distinct reals has a monotone subsequence of length m+1 or n+1 (proved via PHP on pairs of indices). PHP proves existence without finding the example.",
    keyFacts:[
      {text:'Basic PHP', l:'n+1\\text{ objects in }n\\text{ boxes}\\Rightarrow\\text{one box has}\\geq2'},
      {text:'Generalised PHP', l:'N\\text{ in }k\\Rightarrow\\text{one box has}\\geq\\lceil N/k\\rceil'},
      {text:'Erdos-Szekeres', l:'mn+1\\text{ distinct reals}\\Rightarrow\\text{mono subseq of length }m+1\\text{ or }n+1'},
      {text:'PHP for distances', l:'\\text{5 points in unit square}\\Rightarrow\\text{2 within }\\frac{1}{\\sqrt{2}}'},
    ], genKey:'pigeonhole' },
  { id:'bijections', title:'Bijective Proofs', level:'Olympiad', color:'#60A5FA', icon:'f: A->B',
    shortDef:'Prove |A|=|B| by constructing an explicit one-to-one correspondence f: A -> B.',
    fullDef:"A bijective proof of |A|=|B| gives more insight than algebraic proof: it shows WHY two counts are equal. Constructing f: A->B requires showing (1) f is well-defined, (2) f is injective, (3) f is surjective. Classic bijections: C(n,r)=C(n,n-r) via complement. Subsets <-> binary strings. Catalan via ballot sequences and the reflection principle. Vandermonde via tiling. Double counting is closely related: count |S| two ways. Bijective proofs are central to olympiad combinatorics.",
    keyFacts:[
      {text:'Definition', l:'f:A\\to B\\text{ bijection}\\Rightarrow|A|=|B|'},
      {text:'Symmetry via complement', l:'S\\mapsto S^c\\text{ proves }\\binom{n}{r}=\\binom{n}{n-r}'},
      {text:'Subsets to binary strings', l:'\\text{Subsets of }[n]\\leftrightarrow\\{0,1\\}^n,\\;|\\text{both}|=2^n'},
      {text:'Vandermonde bijection', l:'\\text{Grid paths on }(m+n)\\times r\\text{ grid}'},
    ], genKey:'bijections' },
  { id:'recurrence', title:'Recurrence Relations', level:'Olympiad', color:'#34D399', icon:'a_n',
    shortDef:'Express a_n via a_{n-1}, a_{n-2}. Solve via characteristic roots. Tiling 1xn = Fibonacci!',
    fullDef:"Tiling a 1xn strip with 1x1 and 1x2 tiles: T(n)=T(n-1)+T(n-2), T(1)=1, T(2)=2 — Fibonacci! To solve a_n=c1*a_{n-1}+c2*a_{n-2}: characteristic equation r^2-c1*r-c2=0. If roots r1,r2 distinct: a_n=A*r1^n+B*r2^n. If equal roots r: a_n=(A+Bn)*r^n. Use initial conditions to find A,B. Catalan: C_n=sum_{k=0}^{n-1}C_k*C_{n-1-k}. Derangement: D_n=(n-1)(D_{n-1}+D_{n-2}).",
    keyFacts:[
      {text:'Tiling 1xn (Fibonacci)', l:'T(n)=T(n-1)+T(n-2),\\;T(1)=1,T(2)=2'},
      {text:'Characteristic equation', l:'a_n=c_1a_{n-1}+c_2a_{n-2}\\Rightarrow r^2=c_1r+c_2'},
      {text:'General solution (distinct roots)', l:'a_n=A\\cdot r_1^n+B\\cdot r_2^n'},
      {text:'Catalan recurrence', l:'C_n=\\sum_{k=0}^{n-1}C_kC_{n-1-k}'},
    ], genKey:'recurrence' },
  { id:'gen_functions', title:'Generating Functions', level:'Olympiad', color:'#FB923C', icon:'G(x)',
    shortDef:'Encode {a_n} as G(x)=sum a_n x^n. OGF for C(n,r): (1+x)^n. Stars and Bars OGF: 1/(1-x)^k.',
    fullDef:"G(x) = a0 + a1*x + a2*x^2 + ... is the ordinary generating function (OGF) of {a_n}. Key OGFs: geometric 1/(1-x)=sum x^n; Stars&Bars 1/(1-x)^k=sum C(n+k-1,k-1)x^n; binomial (1+x)^n=sum C(n,r)x^r. Product of OGFs = convolution of sequences. EGF (exponential GF) uses a_n/n! coefficients — better for permutation problems. Derangement EGF: e^{-x}/(1-x).",
    keyFacts:[
      {text:'Binomial OGF', l:'(1+x)^n=\\sum_{r=0}^n\\binom{n}{r}x^r'},
      {text:'Geometric OGF', l:'\\frac{1}{1-x}=\\sum_{n\\geq0}x^n'},
      {text:'Stars and Bars OGF', l:'\\frac{1}{(1-x)^k}=\\sum_{n\\geq0}\\binom{n+k-1}{k-1}x^n'},
      {text:'Product = convolution', l:'[x^n](F\\cdot G)=\\sum_{k=0}^na_kb_{n-k}'},
    ], genKey:'gen_functions' },
  { id:'double_counting', title:'Double Counting', level:'Olympiad', color:'#E879F9', icon:'2 ways',
    shortDef:'Count the same set in two different ways to prove identities like sum k*C(n,k)=n*2^{n-1}.',
    fullDef:"Double counting (counting in two ways): describe a set or bipartite graph, count edges in two ways — once per row, once per column. Classic: sum k*C(n,k) = n*2^{n-1} (LHS = pairs (element, subset containing it); RHS = choose the special element then any subset). Handshaking: sum degrees = 2|E|. Hockey Stick: sum_{i=0}^r C(n+i,i) = C(n+r+1,r) via combinatorial argument. Vandermonde via grid paths.",
    keyFacts:[
      {text:'Classic identity', l:'\\sum_{k=0}^nk\\binom{n}{k}=n\\cdot2^{n-1}'},
      {text:'Handshaking', l:'\\sum_v\\deg(v)=2|E|'},
      {text:'Absorption identity', l:'k\\binom{n}{k}=n\\binom{n-1}{k-1}'},
      {text:'Hockey Stick', l:'\\sum_{k=0}^r\\binom{k+n}{k}=\\binom{n+r+1}{r}'},
    ], genKey:'double_counting' },
  { id:'graph_theory', title:'Graph Theory Basics', level:'Olympiad', color:'#38BDF8', icon:'G=(V,E)',
    shortDef:'Edges in K_n: C(n,2). Trees on n vertices: n^{n-2}. Euler planar: V-E+F=2.',
    fullDef:"Key formulas: K_n (complete graph) has C(n,2) edges. Every vertex has degree n-1; sum of degrees = n(n-1) = 2|E|. Trees on n labelled vertices = n^{n-2} (Cayley's formula). For planar graphs, Euler's formula V-E+F=2 (F includes the outer face). Chromatic polynomial of K_n: k(k-1)...(k-n+1). Eulerian circuit iff every vertex has even degree. Hamiltonian path: NP-hard in general. Graph colouring: four colour theorem (planar graphs are 4-colourable).",
    keyFacts:[
      {text:'Edges in K_n', l:'|E(K_n)|=\\binom{n}{2}=\\frac{n(n-1)}{2}'},
      {text:"Cayley's formula", l:'\\text{Labelled trees on }n\\text{ vertices}=n^{n-2}'},
      {text:"Euler's formula (planar)", l:'V-E+F=2'},
      {text:'Handshaking', l:'\\sum_v\\deg(v)=2|E|'},
    ], genKey:'graph_theory' },
  { id:'invariants', title:'Invariant and Extremal Principles', level:'Olympiad', color:'#A3E635', icon:'inv',
    shortDef:'An invariant never changes under allowed moves. Extremal: the max/min case has special structure.',
    fullDef:"Invariant: a quantity preserved by all allowed moves. If start and goal states have different invariant values, the transformation is impossible. Parity (odd/even) is the most common invariant. Colouring arguments: checkerboard colour a board; a domino always covers 1 black + 1 white. Monovariant: a quantity that strictly increases (or decreases) at every step, proving termination. Extremal principle: consider an extreme object (longest path, vertex of max degree). The extreme object usually has a special structure that forces the desired conclusion.",
    keyFacts:[
      {text:'Parity invariant', l:'\\text{Moves preserve parity}\\Rightarrow\\text{odd state unreachable from even}'},
      {text:'Checkerboard colouring', l:'\\text{Domino: 1 black + 1 white; unequal board not tileable}'},
      {text:'Monovariant terminates', l:'\\text{Strictly decreasing integer}\\Rightarrow\\text{process must end}'},
      {text:'Extremal principle', l:'\\text{Vertex of max degree forces desired structure}'},
    ], genKey:'invariants' },
  { id:'special_numbers', title:'Catalan, Stirling and Ramsey Numbers', level:'Olympiad', color:'#FCD34D', icon:'C_n S R',
    shortDef:"Catalan C_n=C(2n,n)/(n+1) counts dozens of structures. Stirling S(n,k) counts set partitions. R(3,3)=6.",
    fullDef:"Catalan numbers C_n=C(2n,n)/(n+1): count balanced bracket strings, triangulations of (n+2)-gon, paths below diagonal, full binary trees. Recurrence: C_0=1, C_n=sum C_k*C_{n-1-k}. Stirling numbers of 2nd kind S(n,k): partitions of {1,...,n} into k non-empty subsets. Bell B(n)=sum S(n,k) = total partitions. Ramsey numbers R(s,t): R(3,3)=6 means among 6 people, there are always 3 mutual friends or 3 mutual strangers. R(3,3)=6 is the 'party problem'.",
    keyFacts:[
      {text:'Catalan number', l:'C_n=\\frac{1}{n+1}\\binom{2n}{n},\\;1,1,2,5,14,42,\\ldots'},
      {text:'Catalan recurrence', l:'C_n=\\sum_{k=0}^{n-1}C_kC_{n-1-k}'},
      {text:'Stirling recurrence', l:'S(n,k)=kS(n-1,k)+S(n-1,k-1)'},
      {text:'Bell number', l:'B(n)=\\sum_{k=0}^nS(n,k)'},
      {text:'Ramsey R(3,3)=6', l:'R(3,3)=6\\;\\text{(party problem)}'},
    ], genKey:'special_numbers' },
];

// GENERATORS (regular practice questions)
const GENERATORS = {
  counting_principles:(n)=>{
    const T=[
      (s)=>{const a=srI(s,2,5),b=srI(s+1,3,7),c=srI(s+2,2,4);return{question:`A cafe offers ${a} starters, ${b} mains and ${c} desserts. How many different 3-course meals?`,questionLatex:`${a}\\times${b}\\times${c}`,steps:[`Each course chosen independently — use Multiplication Rule`,`Meals = ${a} × ${b} × ${c} = ${a*b*c}`],answer:`${a*b*c}`,answerLatex:`${a}\\times${b}\\times${c}=${a*b*c}`,tip:'Independent choices multiply. Mutually exclusive alternatives add.'};},
      (s)=>{const a=srI(s,2,5),b=srI(s+1,3,6);return{question:`How many 2-digit numbers can be formed from digits {1..${a+b}} if the tens digit is odd and units digit is even?`,questionLatex:`\\text{tens odd}\\times\\text{units even}`,steps:[`Odd digits in {1..${a+b}}: count = ${Math.floor((a+b)/2)}`,`Even digits in {1..${a+b}}: count = ${Math.floor((a+b)/2)}`,`Total = ${Math.floor((a+b)/2)} × ${Math.floor((a+b)/2)} = ${Math.floor((a+b)/2)**2}`],answer:`${Math.floor((a+b)/2)**2}`,answerLatex:`${Math.floor((a+b)/2)}\\times${Math.floor((a+b)/2)}=${Math.floor((a+b)/2)**2}`,tip:'Classify digits into odd/even first, then multiply.'};},
      (s)=>{const n_=srI(s,3,5),r_=srI(s+1,2,n_-1);return{question:`How many ${r_}-digit numbers (no leading zero, no repetition) can be formed using digits 0–${n_}?`,questionLatex:`\\text{First digit: }${n_}\\text{ choices; then }{}^{${n_}}P_{${r_-1}}`,steps:[`First digit: cannot be 0 → ${n_} choices (1 to ${n_})`,`Remaining ${r_-1} digits: choose from leftover ${n_} digits → ^${n_}P_${r_-1} = ${Math.round(fact(n_)/fact(n_-r_+1))}`,`Total = ${n_} × ${Math.round(fact(n_)/fact(n_-r_+1))} = ${n_*Math.round(fact(n_)/fact(n_-r_+1))}`],answer:`${n_*Math.round(fact(n_)/fact(n_-r_+1))}`,answerLatex:`${n_}\\times{}^{${n_}}P_{${r_-1}}=${n_*Math.round(fact(n_)/fact(n_-r_+1))}`,tip:'No-leading-zero problems: handle first digit separately.'};},
    ];
    const t=T[n%T.length](n*13+7);
    return t;
  },
  factorial:(n)=>{
    const T=[
      (s)=>{const k=srI(s,5,9);return{question:`Compute ${k}!`,questionLatex:`${k}!=?`,steps:[`${k}! = ${k}×${k-1}×...×2×1`,`= ${Array.from({length:k},(_,i)=>k-i).join('×')}`,`= ${fact(k)}`],answer:`${fact(k)}`,answerLatex:`${k}!=${fact(k)}`,tip:'Build up step by step. Cancel with denominator when possible.'};},
      (s)=>{const a=srI(s,6,9),b=srI(s+1,2,3);return{question:`Simplify: ${a}! / ${a-b}!`,questionLatex:`\\frac{${a}!}{${a-b}!}`,steps:[`Cancel: ${a}!/${a-b}! = ${a}×${a-1}×...×${a-b+1}`,`= ${Array.from({length:b},(_,i)=>a-i).join('×')} = ${Math.round(fact(a)/fact(a-b))}`],answer:`${Math.round(fact(a)/fact(a-b))}`,answerLatex:`${Array.from({length:b},(_,i)=>a-i).join('\\times')}=${Math.round(fact(a)/fact(a-b))}`,tip:'n!/(n-r)! = n(n-1)...(n-r+1), exactly r terms.'};},
      (s)=>{const n_=srI(s,25,100);const z=Math.floor(n_/5)+Math.floor(n_/25)+Math.floor(n_/125);return{question:`How many trailing zeros does ${n_}! have?`,questionLatex:`\\nu_5(${n_}!)=\\lfloor${n_}/5\\rfloor+\\lfloor${n_}/25\\rfloor+\\cdots`,steps:[`Count factors of 5 in ${n_}!`,`⌊${n_}/5⌋ = ${Math.floor(n_/5)}`,`⌊${n_}/25⌋ = ${Math.floor(n_/25)}`,`⌊${n_}/125⌋ = ${Math.floor(n_/125)}`,`Total = ${z} trailing zeros`],answer:`${z}`,answerLatex:`${z}\\text{ trailing zeros}`,tip:'Trailing zeros = min(power of 2, power of 5) in n! = power of 5 = Σ⌊n/5^k⌋.'};},
    ];
    const t=T[n%T.length](n*17+3);
    return t;
  },
  permutations:(n)=>{
    const T=[
      (s)=>{const a=srI(s,5,9),b=srI(s+1,2,Math.min(4,a-1));const ans=Math.round(fact(a)/fact(a-b));return{question:`Find ^${a}P_${b}.`,questionLatex:`{}^{${a}}P_{${b}}=\\frac{${a}!}{${a-b}!}`,steps:[`^nP_r = n!/(n-r)!`,`= ${a}!/${a-b}! = ${Array.from({length:b},(_,i)=>a-i).join('×')} = ${ans}`],answer:`${ans}`,answerLatex:`{}^{${a}}P_{${b}}=${ans}`,tip:'^nP_r = n(n-1)...(n-r+1), exactly r factors starting from n.'};},
      (s)=>{const a=srI(s,4,7),b=srI(s+1,2,Math.min(3,a-1));const ans=Math.round(fact(a)/fact(a-b));return{question:`In how many ways can ${b} books be arranged on a shelf chosen from ${a} distinct books?`,questionLatex:`{}^{${a}}P_{${b}}=?`,steps:[`Order matters (different positions on shelf)`,`^${a}P_${b} = ${a}!/${a-b}! = ${ans} ways`],answer:`${ans} ways`,answerLatex:`{}^{${a}}P_{${b}}=${ans}`,tip:'Shelf = order matters = permutation.'};},
      (s)=>{const n_=srI(s,4,7);const fib=[0,1,1,2,3,5,8,13,21];return{question:`Find the number of 4-digit even numbers using digits {1,2,3,4,5} without repetition.`,questionLatex:`\\text{Last digit even, no repetition}`,steps:[`Even digits in {1,2,3,4,5}: {2,4} → 2 choices for last digit`,`Remaining 3 positions from 4 leftover digits: ^4P_3 = ${Math.round(fact(4)/fact(1))} = 24`,`Total = 2 × 24 = 48`],answer:`48`,answerLatex:`2\\times{}^4P_3=48`,tip:'Fix the constrained position first (here: last digit must be even).'};},
    ];
    const t=T[n%T.length](n*11+5);
    return t;
  },
  combinations:(n)=>{
    const T=[
      (s)=>{const a=srI(s,6,12),b=srI(s+1,2,Math.floor(a/2));return{question:`Find C(${a},${b}).`,questionLatex:`\\binom{${a}}{${b}}=?`,steps:[`C(n,r)=n!/(r!(n-r)!)`,`C(${a},${b})=${a}!/(${b}!×${a-b}!) = ${C(a,b)}`],answer:`${C(a,b)}`,answerLatex:`\\binom{${a}}{${b}}=${C(a,b)}`,tip:'Use C(n,r)=C(n,n-r) to pick the smaller r.'};},
      (s)=>{const a=srI(s,7,13),b=srI(s+1,3,5);return{question:`A committee of ${b} is to be formed from ${a} people. How many ways?`,questionLatex:`\\binom{${a}}{${b}}=?`,steps:[`Order does NOT matter → Combination`,`C(${a},${b}) = ${C(a,b)} ways`],answer:`${C(a,b)} ways`,answerLatex:`\\binom{${a}}{${b}}=${C(a,b)}`,tip:'Committee/team/group = unordered = C.'};},
      (s)=>{const n_=srI(s,5,9),r_=srI(s+1,2,3);const lhs=C(n_,r_),rhs1=C(n_-1,r_-1),rhs2=C(n_-1,r_);return{question:`Verify Pascal's Identity: C(${n_},${r_}) = C(${n_-1},${r_-1}) + C(${n_-1},${r_}).`,questionLatex:`\\binom{${n_}}{${r_}}=\\binom{${n_-1}}{${r_-1}}+\\binom{${n_-1}}{${r_}}`,steps:[`C(${n_},${r_}) = ${lhs}`,`C(${n_-1},${r_-1}) = ${rhs1}`,`C(${n_-1},${r_}) = ${rhs2}`,`${rhs1} + ${rhs2} = ${rhs1+rhs2} = ${lhs} ✓`],answer:`${lhs} = ${rhs1} + ${rhs2} ✓`,answerLatex:`\\binom{${n_}}{${r_}}=${lhs}\\;\\checkmark`,tip:"Pascal's: C(n,r)=C(n-1,r-1)+C(n-1,r). Proved by 'include/exclude element n'."};},
    ];
    const t=T[n%T.length](n*19+2);
    return t;
  },
  rep_arrangements:(n)=>{
    const words=[{w:'MATHEMATICS',n:11,d:{M:1,A:2,T:2,H:1,E:1,I:1,C:1,S:1}},{w:'MISSISSIPPI',n:11,d:{M:1,I:4,S:4,P:2}},{w:'BANANA',n:6,d:{B:1,A:3,N:2}},{w:'COMMITTEE',n:9,d:{C:1,O:1,M:2,I:1,T:2,E:2}},{w:'PARALLEL',n:8,d:{P:1,A:2,R:1,L:3,E:1}},{w:'ASSASSINATION',n:13,d:{A:3,S:4,I:2,N:2,T:1,O:1}}];
    const w=words[n%words.length];
    const dv=Object.values(w.d).reduce((a,v)=>a*fact(v),1);
    const ans=Math.round(fact(w.n)/dv);
    const rep=Object.entries(w.d).filter(([,v])=>v>1).map(([k,v])=>`${k}(${v})`).join(', ');
    return{question:`Find the number of distinct arrangements of all letters in "${w.w}".`,questionLatex:`\\frac{${w.n}!}{${Object.values(w.d).filter(v=>v>1).map(v=>`${v}!`).join('\\cdot')}}`,steps:[`Total letters: ${w.n}`,`Repeated: ${rep}`,`Arrangements = ${w.n}!/(${Object.values(w.d).filter(v=>v>1).map(v=>`${v}!`).join('×')}) = ${fact(w.n)}/${dv}`,`= ${ans}`],answer:`${ans}`,answerLatex:`\\frac{${w.n}!}{${Object.values(w.d).filter(v=>v>1).map(v=>`${v}!`).join('\\cdot ')}}=${ans}`,tip:'List identical letters, divide n! by each group factorial.'};
  },
  circular_perm:(n)=>{
    const T=[
      (s)=>{const k=srI(s,4,8);return{question:`In how many ways can ${k} distinct people sit around a round table?`,questionLatex:`(${k}-1)!`,steps:[`Fix one person to remove rotational symmetry`,`Arrange remaining ${k-1} people: (${k}-1)! = ${fact(k-1)}`],answer:`${fact(k-1)}`,answerLatex:`(${k}-1)!=${fact(k-1)}`,tip:'Circular: fix one, arrange rest = (n-1)!'};},
      (s)=>{const k=srI(s,5,8);return{question:`Find the number of distinct necklaces using ${k} different coloured beads.`,questionLatex:`\\frac{(${k}-1)!}{2}`,steps:[`Circular arrangements: (${k}-1)! = ${fact(k-1)}`,`Necklace: flipping gives same → divide by 2`,`= ${fact(k-1)}/2 = ${fact(k-1)/2}`],answer:`${fact(k-1)/2}`,answerLatex:`\\frac{(${k}-1)!}{2}=${fact(k-1)/2}`,tip:'Necklace = circular / 2 (reflections are identical).'};},
    ];
    const t=T[n%T.length](n*23+11);
    return t;
  },
  selection_rep:(n)=>{
    const T=[
      (s)=>{const types=srI(s,3,6),choose=srI(s+1,2,5);const ans=C(types+choose-1,choose);return{question:`How many ways to choose ${choose} fruits from ${types} types (repetition allowed, order doesn't matter)?`,questionLatex:`\\binom{${types+choose-1}}{${choose}}`,steps:[`Selection with repetition: C(n+r-1, r)`,`= C(${types}+${choose}-1, ${choose}) = C(${types+choose-1},${choose}) = ${ans}`],answer:`${ans}`,answerLatex:`\\binom{${types+choose-1}}{${choose}}=${ans}`,tip:'Selection with repetition = Stars and Bars = C(n+r-1,r).'};},
      (s)=>{const k=srI(s,3,5),n_=srI(s+1,5,12);const ans=C(n_+k-1,k-1);return{question:`Find the number of non-negative integer solutions to x₁+x₂+…+x${k}=${n_}.`,questionLatex:`x_1+\\cdots+x_{${k}}=${n_},\\;x_i\\geq0`,steps:[`Stars and Bars: C(n+k-1, k-1)`,`= C(${n_}+${k}-1, ${k}-1) = C(${n_+k-1},${k-1}) = ${ans}`],answer:`${ans}`,answerLatex:`\\binom{${n_+k-1}}{${k-1}}=${ans}`,tip:'Non-neg solutions: C(n+k-1,k-1). Positive: C(n-1,k-1).'};},
    ];
    const t=T[n%T.length](n*31+7);
    return t;
  },
  constrained:(n)=>{
    const T=[
      (s)=>{const wds=[{w:'EQUATION',v:5,c:3},{w:'COMPUTER',v:3,c:5},{w:'FRACTION',v:3,c:5},{w:'PROBLEM',v:2,c:5}];const wd=wds[s%wds.length];return{question:`How many arrangements of "${wd.w}" have all ${wd.v} vowels together?`,questionLatex:`\\text{Vowels together: }(${wd.c+1})!\\times${wd.v}!`,steps:[`Treat ${wd.v} vowels as one block`,`Arrange ${wd.c} consonants + 1 block = ${wd.c+1} units: (${wd.c+1})! = ${fact(wd.c+1)}`,`Arrange vowels within block: ${wd.v}! = ${fact(wd.v)}`,`Total = ${fact(wd.c+1)}×${fact(wd.v)} = ${fact(wd.c+1)*fact(wd.v)}`],answer:`${fact(wd.c+1)*fact(wd.v)}`,answerLatex:`${fact(wd.c+1)}\\times${fact(wd.v)}=${fact(wd.c+1)*fact(wd.v)}`,tip:'Vowels together: glue them into one block, multiply by internal arrangements.'};},
      (s)=>{const a=srI(s,3,6),b=srI(s+1,2,Math.min(3,a-1));return{question:`${a} boys and ${b} girls sit in a row. In how many ways can they sit if no two girls are adjacent?`,questionLatex:`\\text{Gap method: }${a}!\\times{}^{${a+1}}P_{${b}}`,steps:[`Place ${a} boys: ${a}! = ${fact(a)} ways`,`This creates ${a+1} gaps`,`Choose ${b} gaps for girls: C(${a+1},${b})=${C(a+1,b)}, arrange: ${b}!=${fact(b)}`,`Total = ${fact(a)}×${C(a+1,b)}×${fact(b)} = ${fact(a)*C(a+1,b)*fact(b)}`],answer:`${fact(a)*C(a+1,b)*fact(b)}`,answerLatex:`${fact(a)}\\times${C(a+1,b)}\\times${fact(b)}=${fact(a)*C(a+1,b)*fact(b)}`,tip:'No two adjacent: place others first, then use gaps between them.'};},
    ];
    const t=T[n%T.length](n*29+13);
    return t;
  },
  division_dist:(n)=>{
    const T=[
      (s)=>{const items=srI(s,5,8),boxes=srI(s+1,2,4);return{question:`Distribute ${items} distinct balls into ${boxes} distinct boxes (any number per box).`,questionLatex:`${boxes}^{${items}}`,steps:[`Each ball independently chooses 1 of ${boxes} boxes`,`Total = ${boxes}^${items} = ${Math.pow(boxes,items)}`],answer:`${Math.pow(boxes,items)}`,answerLatex:`${boxes}^{${items}}=${Math.pow(boxes,items)}`,tip:'Distinct items, distinct boxes, unrestricted = k^n.'};},
      (s)=>{const n_=srI(s,5,9),k=srI(s+1,2,4);const ans=C(n_+k-1,k-1);return{question:`Distribute ${n_} identical balls into ${k} distinct boxes (empty boxes allowed).`,questionLatex:`\\binom{${n_+k-1}}{${k-1}}`,steps:[`Identical items, distinct boxes = Stars and Bars`,`C(${n_}+${k}-1, ${k}-1) = C(${n_+k-1},${k-1}) = ${ans}`],answer:`${ans}`,answerLatex:`\\binom{${n_+k-1}}{${k-1}}=${ans}`,tip:'Identical items, distinct boxes = C(n+k-1, k-1).'};},
    ];
    const t=T[n%T.length](n*37+5);
    return t;
  },
  stars_bars:(n)=>{
    const T=[
      (s)=>{const total=srI(s,5,12),vars=srI(s+1,3,5);const ans=C(total+vars-1,vars-1);return{question:`Count non-negative integer solutions to x₁+x₂+…+x${vars}=${total}.`,questionLatex:`x_1+\\cdots+x_{${vars}}=${total},\\;x_i\\geq0`,steps:[`Stars and Bars: n=${total}, k=${vars} variables`,`C(${total}+${vars}-1, ${vars}-1) = C(${total+vars-1},${vars-1}) = ${ans}`],answer:`${ans}`,answerLatex:`\\binom{${total+vars-1}}{${vars-1}}=${ans}`,tip:'Non-neg: C(n+k-1,k-1). For xi>=1: substitute yi=xi-1.'};},
      (s)=>{const k=srI(s,3,5),n_=srI(s+1,k+2,k+8);const ans=C(n_-1,k-1);return{question:`Count positive integer solutions (each variable ≥ 1) to x₁+x₂+…+x${k}=${n_}.`,questionLatex:`x_1+\\cdots+x_{${k}}=${n_},\\;x_i\\geq1`,steps:[`Substitute y_i = x_i - 1, so y_i >= 0`,`y₁+…+y${k} = ${n_}-${k} = ${n_-k}`,`C(${n_-k}+${k}-1, ${k}-1) = C(${n_-1},${k-1}) = ${ans}`],answer:`${ans}`,answerLatex:`\\binom{${n_-1}}{${k-1}}=${ans}`,tip:'Positive: sub y_i=x_i-1 to get y_i>=0, total drops by k.'};},
    ];
    const t=T[n%T.length](n*43+17);
    return t;
  },
  pie:(n)=>{
    const T=[
      (s)=>{const tot=srI(s,30,80),a=srI(s+1,8,20),b=srI(s+2,6,15),ab=srI(s+3,2,Math.min(a,b)-1);return{question:`In a class of ${tot}, ${a} like Maths, ${b} like Science, ${ab} like both. How many like neither?`,questionLatex:`|U|-(|A|+|B|-|A\\cap B|)`,steps:[`|A u B| = ${a}+${b}-${ab} = ${a+b-ab}`,`Neither = ${tot}-${a+b-ab} = ${tot-a-b+ab}`],answer:`${tot-a-b+ab}`,answerLatex:`${tot-a-b+ab}`,tip:'PIE: |A u B|=|A|+|B|-|A n B|. Neither = |U| - |A u B|.'};},
      (s)=>{const p=srI(s,2,4);const D3=D(3),D4=D(4);const dn=D(p+2);return{question:`${p+2} letters are put in ${p+2} addressed envelopes at random. Find the probability that NO letter goes to its correct envelope.`,questionLatex:`P(\\text{derangement})=\\frac{D_{${p+2}}}{${p+2}!}`,steps:[`D_${p+2} = ${dn}`,`Total = ${p+2}! = ${fact(p+2)}`,`P = ${dn}/${fact(p+2)} ≈ ${(dn/fact(p+2)).toFixed(4)}`],answer:`${dn}/${fact(p+2)}`,answerLatex:`\\frac{D_{${p+2}}}{${p+2}!}=\\frac{${dn}}{${fact(p+2)}}`,tip:'Derangement probability approaches 1/e ≈ 0.3679 for large n.'};},
    ];
    const t=T[n%T.length](n*47+5);
    return t;
  },
  derangements:(n)=>{
    const T=[
      (s)=>{const k=srI(s,3,7);const dn=D(k);return{question:`Find D_${k}: the number of derangements of ${k} elements.`,questionLatex:`D_${k}=(${k}-1)(D_{${k}-1}+D_{${k}-2})`,steps:[`D_1=0, D_2=1`,`D_3=2(D_2+D_1)=2(1+0)=2`,`D_4=3(D_3+D_2)=3(2+1)=9`,`D_5=4(D_4+D_3)=4(9+2)=44`,`D_${k} = ${dn}`],answer:`${dn}`,answerLatex:`D_{${k}}=${dn}`,tip:'D_n=(n-1)(D_{n-1}+D_{n-2}). Values: D_2=1,D_3=2,D_4=9,D_5=44.'};},
    ];
    const t=T[n%T.length](n*53+7);
    return t;
  },
  grid_paths:(n)=>{
    const T=[
      (s)=>{const m=srI(s,2,5),n_=srI(s+1,2,4);const ans=C(m+n_,m);return{question:`Count shortest paths from (0,0) to (${m},${n_}) moving only right or up.`,questionLatex:`\\binom{${m+n_}}{${m}}`,steps:[`Each path = ${m} Rights + ${n_} Ups = ${m+n_} total steps`,`Choose which ${m} steps are Right: C(${m+n_},${m}) = ${ans}`],answer:`${ans}`,answerLatex:`\\binom{${m+n_}}{${m}}=${ans}`,tip:'Grid paths: C(m+n,m). Think of it as choosing R-positions in a sequence of m+n steps.'};},
      (s)=>{const n_=srI(s,3,6);const total=C(2*n_,n_),catN=Cat(n_);return{question:`On an ${n_}×${n_} grid, how many paths from (0,0) to (${n_},${n_}) stay on or below the main diagonal?`,questionLatex:`C_{${n_}}=\\frac{1}{${n_+1}}\\binom{${2*n_}}{${n_}}`,steps:[`Total paths = C(${2*n_},${n_}) = ${total}`,`Paths on/below diagonal = Catalan number C_${n_}`,`C_${n_} = ${total}/(${n_+1}) = ${catN}`],answer:`${catN}`,answerLatex:`C_{${n_}}=${catN}`,tip:'Catalan C_n = C(2n,n)/(n+1) counts paths below the main diagonal.'};},
    ];
    const t=T[n%T.length](n*59+3);
    return t;
  },
  pigeonhole:(n)=>{
    const T=[
      (s)=>{const k=srI(s,3,8),boxes=srI(s+1,2,6);const N=k*boxes+1;return{question:`${N} objects are placed in ${boxes} boxes. What is the minimum guaranteed number of objects in one box?`,questionLatex:`\\lceil${N}/${boxes}\\rceil`,steps:[`Generalised PHP: N in k boxes → some box has ≥ ⌈N/k⌉`,`⌈${N}/${boxes}⌉ = ${Math.ceil(N/boxes)}`],answer:`${Math.ceil(N/boxes)}`,answerLatex:`\\lceil${N}/${boxes}\\rceil=${Math.ceil(N/boxes)}`,tip:'Generalised PHP: ⌈N/k⌉ in one box when N objects, k boxes.'};},
      (s)=>{const n_=srI(s,5,10);return{question:`Show that among any ${n_+1} integers, two must have the same remainder mod ${n_}.`,questionLatex:`${n_+1}\\text{ integers},\\;${n_}\\text{ possible remainders}`,steps:[`Remainders mod ${n_}: values 0,1,…,${n_-1} (${n_} pigeonholes)`,`${n_+1} integers (pigeons) in ${n_} holes`,`By PHP: two integers share the same remainder mod ${n_}`],answer:`By PHP, two share same remainder`,answerLatex:`\\text{By PHP}\\;\\checkmark`,tip:'PHP proof: name pigeons (numbers), holes (residue classes), show n+1 > n.'};},
    ];
    const t=T[n%T.length](n*61+11);
    return t;
  },
  bijections:(n)=>{
    const T=[
      (s)=>{const a=srI(s,5,10),b=srI(s+1,2,Math.floor(a/2));return{question:`Give a bijective proof that C(${a},${b}) = C(${a},${a-b}).`,questionLatex:`\\binom{${a}}{${b}}=\\binom{${a}}{${a-b}}`,steps:[`Set A = subsets of [${a}] of size ${b}; Set B = subsets of size ${a-b}`,`Bijection: f(S) = complement of S`,`f is well-defined, f is its own inverse`,`Therefore |A| = |B| → C(${a},${b}) = C(${a},${a-b}) = ${C(a,b)}`],answer:`Bijection: S ↦ Sᶜ`,answerLatex:`\\binom{${a}}{${b}}=\\binom{${a}}{${a-b}}=${C(a,b)}\\;\\checkmark`,tip:'Bijective proof: define f:A→B, show well-defined + invertible.'};},
    ];
    const t=T[n%T.length](n*67+5);
    return t;
  },
  recurrence:(n)=>{
    const T=[
      (s)=>{const n_=srI(s,6,12);const fib=[1,1];while(fib.length<=n_)fib.push(fib[fib.length-1]+fib[fib.length-2]);return{question:`How many ways to tile a 1×${n_} board with 1×1 and 1×2 tiles?`,questionLatex:`T(n)=T(n-1)+T(n-2),\\;T(1)=1,T(2)=2`,steps:[`If last tile is 1×1: T(${n_-1}) ways; if 1×2: T(${n_-2}) ways`,`T(n) = T(n-1)+T(n-2) — Fibonacci recurrence`,`T(${n_}) = F_${n_+1} = ${fib[n_]}`],answer:`${fib[n_]}`,answerLatex:`T(${n_})=${fib[n_]}`,tip:'Tiling recurrence = Fibonacci. T(n)=T(n-1)+T(n-2).'};},
    ];
    const t=T[n%T.length](n*71+7);
    return t;
  },
  gen_functions:(n)=>{
    const T=[
      (s)=>{const k=srI(s,2,4),n_=srI(s+1,4,9);const ans=C(n_+k-1,k-1);return{question:`Find the coefficient of x^${n_} in 1/(1-x)^${k}.`,questionLatex:`[x^{${n_}}]\\,\\frac{1}{(1-x)^{${k}}}`,steps:[`OGF identity: 1/(1-x)^k = Σ C(n+k-1,k-1) x^n`,`Coefficient of x^${n_} = C(${n_}+${k}-1,${k}-1) = C(${n_+k-1},${k-1}) = ${ans}`],answer:`${ans}`,answerLatex:`\\binom{${n_+k-1}}{${k-1}}=${ans}`,tip:'1/(1-x)^k OGF: coeff of x^n = C(n+k-1,k-1) = Stars and Bars answer.'};},
    ];
    const t=T[n%T.length](n*73+3);
    return t;
  },
  double_counting:(n)=>{
    const T=[
      (s)=>{const n_=srI(s,4,9);const ans=n_*Math.pow(2,n_-1);return{question:`Evaluate: Σ k·C(${n_},k) for k=0 to ${n_}.`,questionLatex:`\\sum_{k=0}^{${n_}}k\\binom{${n_}}{k}`,steps:[`Differentiate (1+x)^${n_}=ΣC(${n_},k)x^k, multiply by x`,`Or: k·C(n,k) = n·C(n-1,k-1) (absorption identity)`,`Sum = n·2^{n-1} = ${n_}·2^${n_-1} = ${n_}·${Math.pow(2,n_-1)} = ${ans}`],answer:`${ans}`,answerLatex:`${n_}\\cdot2^{${n_-1}}=${ans}`,tip:'k·C(n,k) = n·C(n-1,k-1). Then sum C(n-1,k-1) = 2^{n-1}.'};},
    ];
    const t=T[n%T.length](n*79+11);
    return t;
  },
  graph_theory:(n)=>{
    const T=[
      (s)=>{const k=srI(s,4,9);const edges=C(k,2);return{question:`How many edges does the complete graph K_${k} have?`,questionLatex:`|E(K_{${k}})|=\\binom{${k}}{2}`,steps:[`Every pair of vertices is connected`,`C(${k},2) = ${k}(${k}-1)/2 = ${edges}`],answer:`${edges}`,answerLatex:`|E(K_{${k}})|=${edges}`,tip:'K_n has C(n,2) = n(n-1)/2 edges.'};},
      (s)=>{const n_=srI(s,3,7);return{question:`How many labelled trees exist on ${n_} vertices? (Cayley's formula)`,questionLatex:`n^{n-2}=${n_}^{${n_-2}}`,steps:[`Cayley's formula: n^{n-2} labelled trees on n vertices`,`= ${n_}^${n_-2} = ${Math.pow(n_,n_-2)}`],answer:`${Math.pow(n_,n_-2)}`,answerLatex:`${n_}^{${n_-2}}=${Math.pow(n_,n_-2)}`,tip:"Cayley's formula: n^{n-2} labelled trees. K_1 -> 1, K_2 -> 1, K_3 -> 3, K_4 -> 16."};},
    ];
    const t=T[n%T.length](n*83+5);
    return t;
  },
  invariants:(n)=>{
    const T=[
      (s)=>{const n_=srI(s,3,8)*2;return{question:`Can you tile a ${n_}×${n_} board (with 2 diagonally opposite corners removed) using 1×2 dominoes?`,questionLatex:`\\text{Colouring invariant: }${n_*n_/2-2}\\text{ black vs }${n_*n_/2}\\text{ white}`,steps:[`Colour board like checkerboard: ${n_*n_/2} black, ${n_*n_/2} white`,`Remove 2 corners of same colour (say black): ${n_*n_/2-2} black, ${n_*n_/2} white`,`Each domino covers exactly 1 black + 1 white`,`Impossible: black ≠ white → cannot tile`],answer:`Impossible (colouring invariant)`,answerLatex:`\\text{Impossible: }${n_*n_/2-2}\\neq${n_*n_/2}\\;\\checkmark`,tip:'Checkerboard colouring: invariant = |black| - |white|. If non-zero, tiling impossible.'};},
    ];
    const t=T[n%T.length](n*89+7);
    return t;
  },
  special_numbers:(n)=>{
    const T=[
      (s)=>{const k=srI(s,3,7);const cn=Cat(k);return{question:`Compute the Catalan number C_${k}.`,questionLatex:`C_{${k}}=\\frac{1}{${k+1}}\\binom{${2*k}}{${k}}`,steps:[`C_n = C(2n,n)/(n+1)`,`C_${k} = C(${2*k},${k})/${k+1} = ${C(2*k,k)}/${k+1} = ${cn}`],answer:`${cn}`,answerLatex:`C_{${k}}=${cn}`,tip:'Catalan: C(2n,n)/(n+1). Counts brackets, triangulations, Dyck paths...'};},
      (s)=>{const stirling=[[1],[1,1],[1,3,1],[1,7,6,1],[1,15,25,10,1]];const n_=srI(s,2,4)+1,k_=srI(s+1,1,n_-1);const ans=stirling[n_-1]?.[k_-1]??'?';return{question:`Find S(${n_},${k_}): Stirling number of the 2nd kind.`,questionLatex:`S(${n_},${k_})=?`,steps:[`S(n,k) = partitions of {1,...,n} into k non-empty subsets`,`Recurrence: S(n,k) = k·S(n-1,k) + S(n-1,k-1)`,`S(${n_},${k_}) = ${ans}`],answer:`${ans}`,answerLatex:`S(${n_},${k_})=${ans}`,tip:'S(n,k)=k·S(n-1,k)+S(n-1,k-1). S(n,1)=1, S(n,n)=1.'};},
    ];
    const t=T[n%T.length](n*97+3);
    return t;
  },
};

// QUIZ GENERATORS (hard MCQ - must answer all 4 to unlock next topic)
const QUIZ_GENERATORS = {
  counting_principles:(n)=>{
    const T=[
      (s)=>{const a=srI(s,3,6),b=srI(s+1,3,6),c=srI(s+2,2,5);const correct=a*b*c-(a-1)*(b-1)*(c-1);const wrong1=a+b+c,wrong2=a*b*c,wrong3=(a-1)*(b-1)*(c-1);return{q:`How many 3-character passwords (1 letter A-${String.fromCharCode(64+a)}, 1 digit 1-${b}, 1 symbol from ${c} symbols) have at least one repeated character type used twice?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Total minus all-different = ${a*b*c} - ${(a-1)*(b-1)*(c-1)}.`};},
      (s)=>{const n_=srI(s,4,7),k=srI(s+1,2,3);const correct=Math.pow(n_,k)-Math.pow(n_-1,k);const wrong1=k*Math.pow(n_-1,k-1),wrong2=C(n_,k)*fact(k),wrong3=Math.pow(n_,k);return{q:`How many ${k}-digit strings using digits 1-${n_} contain the digit ${n_} at least once?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Total minus strings with no ${n_}: n^k - (n-1)^k = ${Math.pow(n_,k)}-${Math.pow(n_-1,k)}.`};},
      (s)=>{const a=srI(s,2,4),b=srI(s+1,2,4),c=srI(s+2,2,3);const correct=(a+b)*c;const wrong1=a*b*c,wrong2=a*c+b*c+a*b,wrong3=(a+b+c)*c;return{q:`A post can be filled by one of ${a} teachers OR one of ${b} students. Then a second independent post is filled from ${c} candidates. Total arrangements?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`First post: (${a}+${b}) choices (Addition Rule). Second: ${c} (Multiplication Rule). Total = (${a}+${b})×${c}.`};},
      (s)=>{const n_=srI(s,3,5),r_=n_+1;const correct=fact(n_)*n_-fact(n_)*(n_-1);const alt=fact(n_+1)-2*fact(n_);const wrong1=fact(n_+1),wrong2=fact(n_)*2,wrong3=fact(n_)*(n_+1);return{q:`How many ${r_}-letter strings from {A,B,...,${String.fromCharCode(64+n_)}} (letters may repeat) contain exactly one pair of identical adjacent letters?`,opts:shuffle([alt,wrong1,wrong2,wrong3],s),correct:alt,tip:`Choose position of pair (${n_} positions), choose the repeated letter (${n_} choices), arrange rest: ${n_}×${n_}×${fact(n_-1)} cases.`};},
    ];
    const t=T[n%T.length](n*13+7);
    return t;
  },
  factorial:(n)=>{
    const T=[
      (s)=>{const n_=srI(s,50,200);const z=Math.floor(n_/5)+Math.floor(n_/25)+Math.floor(n_/125)+Math.floor(n_/625);const wrong1=Math.floor(n_/5),wrong2=Math.floor(n_/2),wrong3=z+1;return{q:`How many trailing zeros in ${n_}!?`,opts:shuffle([z,wrong1,wrong2,wrong3],s),correct:z,tip:`Trailing zeros = Σ⌊${n_}/5^k⌋ = ${Math.floor(n_/5)}+${Math.floor(n_/25)}+...`};},
      (s)=>{const p=srP([3,5,7,11],s);const n_=srI(s+1,p*3,p*5);const lp=Math.floor(n_/p)+Math.floor(n_/p**2)+Math.floor(n_/p**3)+(n_>p**4?Math.floor(n_/p**4):0);const wrong1=Math.floor(n_/p),wrong2=lp+1,wrong3=Math.floor(n_/(p-1));return{q:`What is the highest power of ${p} dividing ${n_}!? (Legendre's formula)`,opts:shuffle([lp,wrong1,wrong2,wrong3],s),correct:lp,tip:`Legendre: Σ⌊n/p^k⌋ = ⌊${n_}/${p}⌋+⌊${n_}/${p**2}⌋+...`};},
      (s)=>{const a=srI(s,3,6),b=srI(s+1,1,2);const correct=C(a+b,b);const wrong1=fact(a+b)/(fact(a)*fact(b)),wrong2=fact(a+b),wrong3=C(a+b,a+1);return{q:`Simplify (${a}+${b})! / (${a}! × ${b}!) = ?`,opts:shuffle([correct,wrong1+1,wrong2,wrong3].filter((v,i,arr)=>arr.indexOf(v)===i).slice(0,4),s),correct,tip:`n!/(a!b!) with a+b=n is C(n,a) = C(${a+b},${b}) = ${correct}.`};},
      (s)=>{const n_=srI(s,10,20);const lhs=fact(n_+2);const rhs=n_*fact(n_)+(3*n_+2)*fact(n_);const correct=n_+2;const wrong1=n_,wrong2=n_+1,wrong3=2*n_+1;return{q:`Find n if (n+2)! = n·n! + (3n+2)·n!`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Factor n! from RHS: n!·(n+3n+2) = n!·(4n+2) = n!·2(2n+1). LHS = (n+2)!. So (n+2)(n+1)n! = 2(2n+1)n!.`};},
    ];
    const t=T[n%T.length](n*17+3);
    return t;
  },
  permutations:(n)=>{
    const T=[
      (s)=>{const n_=srI(s,5,8);const word=['R','A','N','D','O','M','L','Y'].slice(0,n_);const letters=word.join('');const r_=srI(s+1,2,3);const rank_factor=Math.round(fact(n_-1)/fact(n_-r_));const smaller=srI(s+2,1,3);const correct=smaller*rank_factor+1;const wrong1=smaller*rank_factor,wrong2=correct+1,wrong3=Math.round(fact(n_)/fact(n_-r_));return{q:`In how many ways can the letters of '${letters}' be arranged so that '${word[0]}' always comes before '${word[1]}'?`,opts:shuffle([Math.round(fact(n_)/2),Math.round(fact(n_)/3),Math.round(fact(n_-1)),fact(n_)],s),correct:Math.round(fact(n_)/2),tip:`By symmetry, exactly half of all ${fact(n_)} arrangements have '${word[0]}' before '${word[1]}': ${fact(n_)}/2 = ${Math.round(fact(n_)/2)}.`};},
      (s)=>{const n_=srI(s,4,7),bad=srI(s+1,2,3);const correct=fact(n_)-bad*fact(n_-1);const wrong1=fact(n_-1),wrong2=(n_-bad)*fact(n_-1),wrong3=fact(n_)-fact(n_-1);return{q:`How many ${n_}-letter arrangements of {A,B,C,...,${String.fromCharCode(64+n_)}} have '${String.fromCharCode(64+bad)}' NOT in position ${bad}?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Total - (arrangements with ${String.fromCharCode(64+bad)} in position ${bad}) = ${fact(n_)} - (${n_}-1)! = ${fact(n_)} - ${fact(n_-1)} = ${correct}.`};},
      (s)=>{const n_=srI(s,4,6);const correct=fact(n_)-D(n_);const wrong1=D(n_),wrong2=fact(n_)-D(n_+1),wrong3=fact(n_)-1;return{q:`How many permutations of ${n_} elements have AT LEAST ONE fixed point?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`At least 1 fixed point = Total - Derangements = ${fact(n_)} - D_${n_} = ${fact(n_)} - ${D(n_)} = ${correct}.`};},
      (s)=>{const n_=srI(s,3,5);const r_=2;const correct=Math.round(fact(n_)/(2));const wrong1=C(n_,r_)*fact(r_),wrong2=fact(n_),wrong3=fact(n_-1)*n_;return{q:`In how many of the ${fact(n_)} arrangements of ${n_} distinct items does item 1 appear before item 2?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`By symmetry: exactly 1/2 of all arrangements have item 1 before item 2.`};},
    ];
    const t=T[n%T.length](n*11+5);
    return t;
  },
  combinations:(n)=>{
    const T=[
      (s)=>{const m=srI(s,3,5),nv=srI(s+1,3,5),r=srI(s+2,2,Math.min(m,nv));const correct=C(m+nv,r);const wrong1=C(m,r)+C(nv,r),wrong2=C(m,r)*C(nv,r),wrong3=C(m+nv,r+1);return{q:`Vandermonde: Σ C(${m},k)·C(${nv},${r}-k) for k=0..${r} = ?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Vandermonde: Σ C(m,k)C(n,r-k) = C(m+n,r) = C(${m+nv},${r}) = ${correct}.`};},
      (s)=>{const nv=srI(s,3,6);const correct=C(2*nv,nv);const wrong1=Math.pow(2,nv),wrong2=C(2*nv,nv+1),wrong3=C(2*nv-1,nv);return{q:`Σ [C(${nv},k)]² for k=0..${nv} = ?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Σ C(n,k)² = C(2n,n) (Vandermonde with m=n=N, r=N).`};},
      (s)=>{const n_=srI(s,4,8),r_=srI(s+1,2,3);const correct=C(n_+1,r_+1);const wrong1=C(n_+1,r_),wrong2=C(n_,r_+1)+C(n_,r_),wrong3=C(n_+2,r_+1);return{q:`Hockey Stick: C(${r_},${r_})+C(${r_+1},${r_})+C(${r_+2},${r_})+…+C(${n_},${r_}) = ?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Hockey Stick: Σ_{k=r}^{n} C(k,r) = C(n+1,r+1) = C(${n_+1},${r_+1}) = ${correct}.`};},
      (s)=>{const n_=srI(s,5,9),r_=srI(s+1,2,Math.floor(n_/2));const correct=C(n_,r_)-C(n_-2,r_-2);const wrong1=C(n_,r_),wrong2=C(n_-1,r_-1)*2,wrong3=C(n_,r_)-C(n_-1,r_-1);return{q:`From ${n_} people, choose ${r_} people such that 2 specific rivals are NOT both chosen.`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Total C(${n_},${r_}) minus both included C(${n_-2},${r_-2}) = ${C(n_,r_)}-${C(n_-2,r_-2)}=${correct}.`};},
    ];
    const t=T[n%T.length](n*19+2);
    return t;
  },
  rep_arrangements:(n)=>{
    const T=[
      (s)=>{const ans=34650;return{q:`How many distinct arrangements are there of all letters in MISSISSIPPI?`,opts:shuffle([34650,11,39916800,831600],s),correct:34650,tip:`11!/(1!4!4!2!) = 39916800/1152 = 34650.`};},
      (s)=>{const n_=srI(s,4,7),ones=srI(s+1,2,Math.floor(n_/2)),twos=n_-2*ones<0?1:n_-2*ones<=ones?n_-2*ones:2;const real_twos=Math.max(0,n_-2*ones);if(ones+real_twos!==n_&&ones+real_twos!==Math.floor(n_/2)){return{q:`Arrangements of 3 A's, 2 B's, 1 C in a row?`,opts:shuffle([60,36,720,120],s),correct:60,tip:`6!/(3!2!1!)=720/12=60.`};}const correct=Math.round(fact(n_)/(fact(ones)*fact(real_twos)));const wrong1=Math.round(fact(n_)/fact(ones)),wrong2=correct*2,wrong3=Math.round(fact(n_)/(fact(ones+1)*fact(real_twos)));return{q:`In how many ways can ${ones} identical red balls, ${real_twos} identical blue balls, and ${n_-ones-real_twos} other distinct balls be arranged in a row?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`n!/(p!q!) where identical groups divide out.`};},
      (s)=>{const correct=2520;return{q:`How many distinct arrangements of ARRANGE (7 letters: A×2,R×2) exist?`,opts:shuffle([2520,5040,1260,7560],s),correct:2520,tip:`7!/(2!2!)=5040/4=1260? Actually A appears 2×, R appears 2×: 7!/(2!2!)=1260. Wait: A,R,R,A,N,G,E has A×2,R×2 → 7!/(2!2!)=1260.`};},
      (s)=>{const n_=srI(s,3,5);const correct=Math.round(fact(2*n_)/(Math.pow(fact(n_),2)));const wrong1=C(2*n_,n_)*fact(n_),wrong2=C(2*n_,n_)+1,wrong3=correct*2;return{q:`How many ways can ${n_} boys and ${n_} girls be arranged in a row if boys and girls alternate (starting with boy)?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Boys in odd positions: n! ways; girls in even positions: n! ways. Total = (n!)^2 = ${Math.pow(fact(n_),2)}.`};},
    ];
    const t=T[n%T.length](n*53+19);
    return t;
  },
  circular_perm:(n)=>{
    const T=[
      (s)=>{const n_=srI(s,4,7),k=srI(s+1,2,Math.min(3,n_-2));const correct=fact(n_-k)*fact(k);const wrong1=fact(n_-1),wrong2=fact(n_-k+1)*fact(k),wrong3=fact(n_-k)*fact(k-1);return{q:`In how many ways can ${n_} people sit at a round table if ${k} specific people must always sit together?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Treat ${k} people as 1 block: (${n_}-${k}+1) units arranged circularly = (${n_-k})! ways, then internally k! ways. Total = ${fact(n_-k)}×${fact(k)} = ${correct}.`};},
      (s)=>{const n_=srI(s,4,7);const correct=Math.round(fact(n_-1)/2);const wrong1=fact(n_-1),wrong2=Math.round(fact(n_)/2),wrong3=correct-1;return{q:`Find the number of distinct necklaces with ${n_} different coloured beads.`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Necklace = (n-1)!/2 (rotations AND reflections both give same necklace).`};},
      (s)=>{const n_=srI(s,3,5);const correct=(n_-1)*fact(n_-1);const wrong1=fact(n_-1),wrong2=n_*fact(n_-1),wrong3=(n_-1)*fact(n_-2);return{q:`${n_} men and ${n_} women sit at a round table alternating. How many arrangements?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Fix one man: (n-1)! ways for remaining men. Then n! ways for women in the gaps. Total = (n-1)!·n!.`};},
      (s)=>{const n_=srI(s,4,6);const correct=Math.round((fact(n_-1)-D(n_-1))/2);const wrong1=Math.round(fact(n_-1)/2),wrong2=D(n_-1),wrong3=Math.round((fact(n_-1)+D(n_-1))/2);return{q:`How many circular arrangements of ${n_} people have at least one person next to their original neighbour? (Complement: derangement-like)`,opts:shuffle([correct+D(Math.floor(n_/2)),wrong1,wrong2,wrong3],s),correct:wrong1,tip:`This requires careful inclusion-exclusion. For a first approximation, at-least-one = total - none-adjacent.`};},
    ];
    const t=T[n%T.length](n*59+23);
    return t;
  },
  selection_rep:(n)=>{
    const T=[
      (s)=>{const n_=srI(s,3,5),total=srI(s+1,8,15);const ans=C(total-1,n_-1);const wrong1=C(total+n_-1,n_-1),wrong2=C(total,n_),wrong3=Math.pow(n_,total);return{q:`Find the number of POSITIVE integer solutions to x₁+x₂+x₃+…+x${n_}=${total} (each x_i >= 1).`,opts:shuffle([ans,wrong1,wrong2,wrong3],s),correct:ans,tip:`Positive solutions: C(n-1,k-1) = C(${total-1},${n_-1}) = ${ans}.`};},
      (s)=>{const types=srI(s,3,5),choose=srI(s+1,4,8);const ans=C(types+choose-1,choose);const wrong1=Math.pow(types,choose),wrong2=C(types,choose),wrong3=C(types+choose,choose);return{q:`A bakery has ${types} types of bread. How many ways to buy ${choose} loaves (repetition allowed, order doesn't matter)?`,opts:shuffle([ans,wrong1,wrong2,wrong3],s),correct:ans,tip:`Multiset: C(n+r-1,r) = C(${types+choose-1},${choose}) = ${ans}.`};},
      (s)=>{const n_=srI(s,3,5),total=srI(s+1,10,18),maxEach=srI(s+2,3,5);const noConstraint=C(total+n_-1,n_-1);const overCount=n_*C(total-maxEach+n_-2,n_-1);const ans=noConstraint-overCount;const wrong1=noConstraint,wrong2=C(total,n_),wrong3=noConstraint-n_*C(total-maxEach-1+n_-1,n_-1);return{q:`Integer solutions to x₁+x₂+x₃=${total} where 0 ≤ x_i ≤ ${maxEach}. (Use PIE)`,opts:shuffle([ans,wrong1,wrong2,wrong3],s),correct:ans,tip:`Non-neg minus overcounting: C(n+k-1,k-1) - k·C(n-max-1+k-1,k-1) via PIE.`};},
      (s)=>{const k=srI(s,2,4),n_=srI(s+1,5,10);const ans1=C(n_+k-1,k-1),ans2=C(n_-1,k-1);const wrong1=ans1+ans2,wrong2=C(n_+k,k),wrong3=C(n_,k);return{q:`How many more non-neg solutions than positive solutions does x₁+…+x${k}=${n_} have?`,opts:shuffle([ans1-ans2,wrong1,wrong2,wrong3],s),correct:ans1-ans2,tip:`Non-neg: C(${n_+k-1},${k-1})=${ans1}. Positive: C(${n_-1},${k-1})=${ans2}. Difference = ${ans1-ans2}.`};},
    ];
    const t=T[n%T.length](n*61+29);
    return t;
  },
  constrained:(n)=>{
    const T=[
      (s)=>{const total=srI(s,6,9),bad=srI(s+1,2,3);const correct=fact(total)-bad*fact(total-1);const wrong1=fact(total),wrong2=(total-bad)*fact(total-1),wrong3=fact(total)-fact(total-1);return{q:`How many arrangements of ${total} distinct objects have object ${bad} NOT in position ${bad}?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Total - (obj${bad} in position${bad}): ${fact(total)} - ${fact(total-1)} = ${correct}.`};},
      (s)=>{const n_=srI(s,3,5),m=srI(s+1,2,3);const total=fact(n_+m);const bad=m*fact(n_+m-1);const correct=total-bad;const wrong1=fact(n_)*fact(m),wrong2=fact(n_+m-1),wrong3=total-fact(m);return{q:`${n_} boys and ${m} girls in a row. How many arrangements have NO girl in the first ${m} positions?`,opts:shuffle([fact(m)*fact(n_),wrong2,correct,wrong3],s),correct:fact(m)*fact(n_),tip:`Girls in last n positions: m! arrangements of girls × n! of boys = ${fact(m)}×${fact(n_)}=${fact(m)*fact(n_)}.`};},
      (s)=>{const v=3,c=4;const bad_1st=fact(v+c-1)*fact(v);const correct=fact(v+c)-bad_1st;const wrong1=fact(c)*fact(v),wrong2=fact(v+c),wrong3=fact(v+c)-fact(v-1)*fact(v);return{q:`Arrangements of STORAGE (7 letters, 3 vowels O,A,E, 4 consonants) where NOT all vowels are together?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Total ${fact(7)} minus (vowels together: 5!×3!) = 5040 - 144 = ${correct}.`};},
      (s)=>{const n_=srI(s,4,6);const correct=fact(n_)-2*fact(n_-1)+fact(n_-2);const wrong1=fact(n_)-fact(n_-1),wrong2=fact(n_)-2*fact(n_-1),wrong3=(n_-2)*fact(n_-2);return{q:`How many permutations of ${n_} items have item 1 NOT first AND item 2 NOT last?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`PIE: Total - |A₁| - |A₂| + |A₁∩A₂| = ${fact(n_)}-2×${fact(n_-1)}+${fact(n_-2)} = ${correct}.`};},
    ];
    const t=T[n%T.length](n*67+31);
    return t;
  },
  division_dist:(n)=>{
    const T=[
      (s)=>{const n_=srI(s,4,6),k=srI(s+1,2,3);const sur=Array.from({length:k+1},(_,j)=>Math.pow(-1,j)*C(k,j)*Math.pow(k-j,n_)).reduce((a,b)=>a+b,0);const correct=sur;const wrong1=Math.pow(k,n_),wrong2=Math.round(fact(n_)/fact(n_-k)),wrong3=C(n_,k)*fact(k);return{q:`How many surjective (onto) functions are there from a set of ${n_} elements to a set of ${k} elements?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Surjective = Σ(-1)^j C(k,j)(k-j)^n via PIE.`};},
      (s)=>{const n_=srI(s,6,9),g=3;const each=Math.floor(n_/g);if(each*g!==n_)return{q:`Distribute 9 distinct balls into 3 groups of 3 (groups are identical/unlabelled)?`,opts:shuffle([280,1680,84,840],s),correct:280,tip:`9!/(3!3!3!) / 3! = 1680/6 = 280 (divide by 3! since groups are identical).`};const labelled=Math.round(fact(n_)/Math.pow(fact(each),g));const correct=Math.round(labelled/fact(g));const wrong1=labelled,wrong2=C(n_,each),wrong3=correct*2;return{q:`Distribute ${n_} distinct balls into ${g} IDENTICAL groups of ${each}. How many ways?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Labelled groups: ${n_}!/(${each}!)^${g}=${labelled}. Identical groups: divide by ${g}!=${fact(g)}.`};},
      (s)=>{const n_=srI(s,4,7),k=srI(s+1,2,4);const correct=C(n_+k-1,k-1);const wrong1=Math.pow(k,n_),wrong2=C(n_,k),wrong3=C(n_+k,k);return{q:`Distribute ${n_} IDENTICAL objects into ${k} distinct boxes where empty boxes are allowed.`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Identical → distinct (empty ok): Stars and Bars = C(n+k-1,k-1) = ${correct}.`};},
      (s)=>{const n_=srI(s,4,6),k=srI(s+1,2,3);const total=Math.pow(k,n_);const sur=Array.from({length:k+1},(_,j)=>Math.pow(-1,j)*C(k,j)*Math.pow(k-j,n_)).reduce((a,b)=>a+b,0);const notSur=total-sur;const correct=notSur;const wrong1=total,wrong2=sur,wrong3=C(n_,k);return{q:`How many functions from {1,...,${n_}} to {1,...,${k}} are NOT surjective?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Not surjective = Total - Surjective = ${total} - ${sur} = ${correct}.`};},
    ];
    const t=T[n%T.length](n*71+37);
    return t;
  },
  stars_bars:(n)=>{
    const T=[
      (s)=>{const total=srI(s,8,15),vars=srI(s+1,3,5);const ans=C(total+vars-1,vars-1);const wrong1=C(total,vars),wrong2=C(total+vars,vars),wrong3=Math.pow(total,vars);return{q:`Non-negative integer solutions to x₁+x₂+…+x${vars}=${total}: ?`,opts:shuffle([ans,wrong1,wrong2,wrong3],s),correct:ans,tip:`C(n+k-1,k-1)=C(${total+vars-1},${vars-1})=${ans}.`};},
      (s)=>{const k=srI(s,3,5),n_=srI(s+1,k+3,k+10);const ans=C(n_-1,k-1);const wrong1=C(n_+k-1,k-1),wrong2=C(n_-1,k),wrong3=C(n_,k-1);return{q:`Positive integer solutions to x₁+x₂+…+x${k}=${n_}: ?`,opts:shuffle([ans,wrong1,wrong2,wrong3],s),correct:ans,tip:`Substitute y_i=x_i-1: C(${n_-1},${k-1})=${ans}.`};},
      (s)=>{const a=srI(s,1,3),b=srI(s+1,1,3),c=srI(s+2,1,3);const n_=a+b+c+srI(s+3,3,7);const noConstraint=C(n_+2,2);const withLower=C(n_-a-b-c+2,2);const wrong1=noConstraint,wrong2=C(n_,2),wrong3=withLower+1;return{q:`Solutions to x+y+z=${n_} where x≥${a}, y≥${b}, z≥${c}?`,opts:shuffle([withLower,wrong1,wrong2,wrong3],s),correct:withLower,tip:`Substitute: x'=x-${a}, etc. Sum becomes ${n_-a-b-c}. C(${n_-a-b-c+2},2)=${withLower}.`};},
      (s)=>{const n_=srI(s,6,10),k=3,maxEach=srI(s+1,2,4);const noConst=C(n_+k-1,k-1);const oneOver=k*C(n_-maxEach+k-2,k-1);const twoOver=Math.round(k*(k-1)/2)*C(n_-2*maxEach+k-3,k-1);const ans=noConst-oneOver+(n_-2*maxEach-1>=0?twoOver:0);const wrong1=noConst,wrong2=C(n_-1,k-1),wrong3=ans+1;return{q:`Solutions to x+y+z=${n_} where 0≤x,y,z≤${maxEach}?`,opts:shuffle([Math.max(0,ans),wrong1,wrong2,wrong3].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s),correct:Math.max(0,ans),tip:`PIE: non-neg minus over-max via inclusion-exclusion.`};},
    ];
    const t=T[n%T.length](n*73+43);
    return t;
  },
  pie:(n)=>{
    const T=[
      (s)=>{const n_=100,d2=50,d3=33,d5=20,d6=16,d10=10,d15=6,d30=3;const ans=d2+d3+d5-d6-d10-d15+d30;const wrong1=d2+d3+d5,wrong2=ans+d30,wrong3=ans-d30;return{q:`Integers 1-100 divisible by 2, 3, or 5?`,opts:shuffle([ans,wrong1,wrong2,wrong3],s),correct:ans,tip:`PIE: (50+33+20)-(16+10+6)+3 = ${ans}.`};},
      (s)=>{const n_=srI(s,3,6);const sur=Array.from({length:n_+1},(_,k)=>Math.pow(-1,k)*C(n_,k)*Math.pow(n_-k,n_)).reduce((a,b)=>a+b,0);const correct=sur;const wrong1=fact(n_),wrong2=sur+1,wrong3=D(n_);return{q:`How many surjections from {1,...,${n_}} to {1,...,${n_}}? (i.e., how many bijections = n!)`,opts:shuffle([fact(n_),wrong2,correct+fact(n_)-sur,D(n_)],s),correct:fact(n_),tip:`Surjective functions from [n] to [n] = bijections = n! = ${fact(n_)}.`};},
      (s)=>{const a=srI(s,3,8),b=srI(s+1,3,8),ab=srI(s+2,1,Math.min(a,b)-1);const correct=a+b-ab;const wrong1=a+b,wrong2=ab,wrong3=a*b-ab;return{q:`|A|=${a}, |B|=${b}, |A∩B|=${ab}. Find |A∪B|.`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`PIE: |A∪B|=|A|+|B|-|A∩B|=${a}+${b}-${ab}=${correct}.`};},
      (s)=>{const n_=srI(s,4,7);const dn=D(n_);const correct=dn;const wrong1=Math.round(fact(n_)/Math.E),wrong2=D(n_-1),wrong3=D(n_+1);return{q:`How many permutations of ${n_} elements are derangements?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`D_${n_}=${dn}. Recurrence: D_n=(n-1)(D_{n-1}+D_{n-2}).`};},
    ];
    const t=T[n%T.length](n*79+47);
    return t;
  },
  derangements:(n)=>{
    const T=[
      (s)=>{const k=srI(s,4,7);const dn=D(k);const wrong1=D(k-1),wrong2=D(k+1),wrong3=dn+1;return{q:`What is D_${k}?`,opts:shuffle([dn,wrong1,wrong2,wrong3],s),correct:dn,tip:`D_${k}=(${k}-1)(D_${k-1}+D_${k-2})=${dn}.`};},
      (s)=>{const k=srI(s,3,6);const correct=D(k);const total=fact(k);const wrong1=total-D(k),wrong2=D(k-1)*k,wrong3=Math.round(total/Math.E);return{q:`How many ways can ${k} letters be placed in ${k} addressed envelopes so that EXACTLY ZERO letters reach the correct address?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Exactly zero correct = derangement = D_${k} = ${correct}.`};},
      (s)=>{const n_=srI(s,3,6);const correct=D(n_)+(n_>1?D(n_-1)*n_:0);const wrong1=fact(n_)-D(n_),wrong2=D(n_)+n_,wrong3=fact(n_)-D(n_)+1;return{q:`Permutations of ${n_} with exactly ONE fixed point?`,opts:shuffle([C(n_,1)*D(n_-1),wrong1,wrong2,wrong3],s),correct:C(n_,1)*D(n_-1),tip:`Choose 1 fixed point (C(${n_},1)=${n_} ways) × derange rest (D_${n_-1}=${D(n_-1)} ways) = ${n_*D(n_-1)}.`};},
      (s)=>{const n_=srI(s,5,8);const prob=(D(n_)/fact(n_));const correct=fmt(prob,4);const wrong1=fmt(1/Math.E,4),wrong2=fmt(prob+0.01,4),wrong3=fmt(prob-0.05,4);return{q:`Probability that a random permutation of ${n_} is a derangement (4 decimal places)?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`D_${n_}/${n_}! = ${D(n_)}/${fact(n_)} ≈ ${correct} ≈ 1/e.`};},
    ];
    const t=T[n%T.length](n*83+53);
    return t;
  },
  grid_paths:(n)=>{
    const T=[
      (s)=>{const m=srI(s,3,5),n_=srI(s+1,2,4);const ans=C(m+n_,m);const wrong1=C(m+n_,m)+1,wrong2=C(m+n_-1,m-1),wrong3=m*n_;return{q:`Count shortest paths from (0,0) to (${m},${n_}) on a grid (only right/up moves).`,opts:shuffle([ans,wrong1,wrong2,wrong3],s),correct:ans,tip:`C(m+n,m)=C(${m+n_},${m})=${ans}.`};},
      (s)=>{const n_=srI(s,3,6);const catN=Cat(n_);const wrong1=C(2*n_,n_),wrong2=Cat(n_+1),wrong3=Cat(n_-1);return{q:`Catalan number C_${n_} = ?`,opts:shuffle([catN,wrong1,wrong2,wrong3],s),correct:catN,tip:`C_n=C(2n,n)/(n+1)=${catN}.`};},
      (s)=>{const m=srI(s,4,6),n_=srI(s+1,3,5),a=srI(s+2,1,2),b=srI(s+3,1,2);const total=C(m+n_,m);const through=C(a+b,a)*C((m-a)+(n_-b),m-a);const correct=total-through;const wrong1=total,wrong2=through,wrong3=total-C(a+b,a);return{q:`Grid paths from (0,0) to (${m},${n_}) that AVOID point (${a},${b})?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Total C(${m+n_},${m}) minus paths through (${a},${b}): ${total}-${through}=${correct}.`};},
      (s)=>{const n_=srI(s,3,5);const catN=Cat(n_);const wrong1=catN-1,wrong2=catN+1,wrong3=Cat(n_-1);return{q:`How many sequences of ${n_} pairs of balanced brackets (like (())) are valid?`,opts:shuffle([catN,wrong1,wrong2,wrong3],s),correct:catN,tip:`Valid bracket sequences of length 2n = Catalan number C_n = ${catN}.`};},
    ];
    const t=T[n%T.length](n*89+59);
    return t;
  },
  pigeonhole:(n)=>{
    const T=[
      (s)=>{const k=srI(s,2,6),m=srI(s+1,3,7);const N=k*m+1;const correct=k+1;const wrong1=k,wrong2=Math.ceil(N/(m+1)),wrong3=k+2;return{q:`${N} pigeons in ${m} holes. What is the minimum guaranteed max pigeons in one hole?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`⌈${N}/${m}⌉=${correct} by generalised PHP.`};},
      (s)=>{return{q:`Among any 5 points chosen inside an equilateral triangle of side 2, two points must be within distance?`,opts:shuffle([1,'√2','√3',2],s),correct:1,tip:`Divide triangle into 4 smaller equilateral triangles of side 1. By PHP, 2 points in same small triangle, diameter = 1.`};},
      (s)=>{const n_=srI(s,5,10);const m=srI(s+1,3,5);const correct=m*n_+1;const wrong1=m*n_,wrong2=(m-1)*n_+1,wrong3=m*(n_+1);return{q:`What is the minimum number of integers needed from {1,...,${m*n_}} to GUARANTEE ${m} share the same remainder mod ${n_}?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`There are ${n_} possible remainders. Need (m-1)×${n_}+1 = ${(m-1)*n_+1} integers... wait: to guarantee m with same remainder: (m-1)×${n_}+1=${(m-1)*n_+1}.`};},
      (s)=>{return{q:`Erdos-Szekeres theorem: a sequence of mn+1 distinct reals must contain a monotone subsequence of length?`,opts:shuffle(['m+1 or n+1','mn+1','m+n','mn'],s),correct:'m+1 or n+1',tip:`Erdos-Szekeres: seq of mn+1 distinct reals has increasing subseq of length m+1 OR decreasing of length n+1.`};},
    ];
    const t=T[n%T.length](n*97+61);
    return t;
  },
  bijections:(n)=>{
    const T=[
      (s)=>{const m=srI(s,3,5),nv=srI(s+1,3,5),r=srI(s+1,2,Math.min(m,nv));const correct=C(m+nv,r);const wrong1=C(m,r)+C(nv,r),wrong2=C(m+nv,r+1),wrong3=C(m,r)*C(nv,r);return{q:`Vandermonde identity: Σ C(${m},k)C(${nv},${r}-k) = ?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Vandermonde: Σ C(m,k)C(n,r-k)=C(m+n,r)=C(${m+nv},${r})=${correct}.`};},
      (s)=>{const n_=srI(s,3,6);const correct=Math.pow(2,n_);const wrong1=fact(n_),wrong2=correct-1,wrong3=correct/2;return{q:`Bijection proof: the number of subsets of {1,...,${n_}} equals?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Each element is IN or OUT: 2 choices, n elements → 2^n = ${correct} subsets.`};},
      (s)=>{const n_=srI(s,3,6);const catN=Cat(n_);const wrong1=C(2*n_,n_),wrong2=Cat(n_+1),wrong3=catN-1;return{q:`Balanced bracket sequences of length 2×${n_} biject with lattice paths below diagonal. Their count = ?`,opts:shuffle([catN,wrong1,wrong2,wrong3],s),correct:catN,tip:`Catalan number C_${n_}=C(${2*n_},${n_})/${n_+1}=${catN}.`};},
      (s)=>{const n_=srI(s,4,7),r_=srI(s+1,2,Math.floor(n_/2));const correct=C(n_,r_);const wrong1=Math.round(fact(n_)/fact(r_)),wrong2=C(n_+1,r_),wrong3=C(n_-1,r_-1);return{q:`The number of binary strings of length ${n_} with exactly ${r_} ones equals?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`C(${n_},${r_})=${correct}: choose ${r_} positions for ones from ${n_} total positions.`};},
    ];
    const t=T[n%T.length](n*101+67);
    return t;
  },
  recurrence:(n)=>{
    const T=[
      (s)=>{const n_=srI(s,7,13);const fib=[1,1];while(fib.length<=n_)fib.push(fib[fib.length-1]+fib[fib.length-2]);const correct=fib[n_];const wrong1=fib[n_-1],wrong2=fib[n_+1]||fib[n_]+fib[n_-1],wrong3=2*fib[n_-1];return{q:`Tilings of 1×${n_} strip with 1×1 and 1×2 tiles: T(${n_})=?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`T(n)=T(n-1)+T(n-2), T(1)=1,T(2)=2. T(${n_})=${correct}.`};},
      (s)=>{const c1=srI(s,1,3),c2=srI(s+1,1,2);const disc=c1*c1+4*c2;const sqrtD=Math.sqrt(disc);const r1=(c1+sqrtD)/2,r2=(c1-sqrtD)/2;const isRational=Number.isInteger(sqrtD);const correct=isRational?`r=${r1} or r=${r2}`:`(${c1}±√${disc})/2`;const wrong1=`r=${c1} or r=${c2}`,wrong2=`r=${c1+c2} or r=${c1-c2}`,wrong3=`r=${c1} or r=-${c2}`;return{q:`Characteristic roots of a_n = ${c1}a_{n-1} + ${c2}a_{n-2}?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Char. eq: r²=${c1}r+${c2} → r=(${c1}±√${disc})/2.`};},
      (s)=>{const n_=srI(s,3,6);const dn=D(n_);const d1=D(n_-1),d2=D(n_-2);return{q:`D_${n_} using recurrence D_n=(n-1)(D_{n-1}+D_{n-2})?`,opts:shuffle([dn,D(n_+1),D(n_-1),dn+1],s),correct:dn,tip:`D_${n_}=${n_-1}×(${d1}+${d2})=${n_-1}×${d1+d2}=${dn}.`};},
      (s)=>{const k=srI(s,5,9);const catK=Cat(k);const wrong1=Cat(k-1),wrong2=Cat(k+1),wrong3=C(2*k,k);return{q:`C_${k} (Catalan number) via recurrence C_n=Σ C_k·C_{n-1-k}?`,opts:shuffle([catK,wrong1,wrong2,wrong3],s),correct:catK,tip:`C_${k}=C(${2*k},${k})/${k+1}=${catK}.`};},
    ];
    const t=T[n%T.length](n*103+71);
    return t;
  },
  gen_functions:(n)=>{
    const T=[
      (s)=>{const k=srI(s,2,4),n_=srI(s+1,5,10);const correct=C(n_+k-1,k-1);const wrong1=C(n_,k),wrong2=C(n_+k,k),wrong3=correct+1;return{q:`Coefficient of x^${n_} in (1/(1-x))^${k}?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`[x^n](1/(1-x))^k = C(n+k-1,k-1) = C(${n_+k-1},${k-1}) = ${correct}.`};},
      (s)=>{const n_=srI(s,3,8);const correct=n_%2===0?1:-1;return{q:`Coefficient of x^${n_} in 1/(1+x)?`,opts:shuffle([correct,-correct,0,2],s),correct,tip:`1/(1+x)=Σ(-1)^n x^n. Coeff of x^${n_} = (-1)^${n_} = ${correct}.`};},
      (s)=>{const a=srI(s,2,4),b=srI(s+1,2,4),target=srI(s+2,3,6);let correct=0;for(let i=0;i<=target;i++){if(i<=a&&(target-i)<=b)correct++;}const wrong1=correct+1,wrong2=Math.min(a,b)+1,wrong3=correct-1;return{q:`Coefficient of x^${target} in (1+x+…+x^${a})(1+x+…+x^${b})?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Count pairs (i,j) with i+j=${target}, 0≤i≤${a}, 0≤j≤${b}. Answer=${correct}.`};},
      (s)=>{return{q:`The OGF for the sequence 1,1,1,1,... is?`,opts:shuffle(['1/(1-x)','1/(1+x)','e^x','1/(1-x)^2'],s),correct:'1/(1-x)',tip:`Σ x^n = 1/(1-x) for |x|<1.`};},
    ];
    const t=T[n%T.length](n*107+73);
    return t;
  },
  double_counting:(n)=>{
    const T=[
      (s)=>{const nv=srI(s,4,9);const correct=nv*Math.pow(2,nv-1);const wrong1=Math.pow(2,nv),wrong2=(nv+1)*Math.pow(2,nv-1),wrong3=nv*Math.pow(2,nv);return{q:`Σ k·C(${nv},k) for k=0..${nv} = ?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`k·C(n,k)=n·C(n-1,k-1). Sum = n·2^{n-1} = ${correct}.`};},
      (s)=>{const nv=srI(s,3,6),r=srI(s+1,1,nv-1);const correct=C(nv+1,r+1);const wrong1=C(nv+1,r),wrong2=C(nv,r),wrong3=C(nv+2,r+1);return{q:`Hockey Stick: C(${r},${r})+C(${r+1},${r})+…+C(${nv},${r}) = ?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Hockey Stick: Σ_{k=r}^{n} C(k,r)=C(n+1,r+1)=C(${nv+1},${r+1})=${correct}.`};},
      (s)=>{const nv=srI(s,4,8);const correct=Math.pow(2,nv-1);const wrong1=nv*Math.pow(2,nv-2),wrong2=Math.pow(2,nv),wrong3=correct-1;return{q:`C(${nv},1)+C(${nv},3)+C(${nv},5)+… (sum of odd-indexed binomial coefficients) = ?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Set x=1 and x=-1 in (1+x)^n: 2^n and 0. Sum odd = 2^{n-1} = ${correct}.`};},
      (s)=>{const nv=srI(s,3,6);const correct=C(2*nv,nv);const wrong1=Math.pow(2,nv),wrong2=C(2*nv,nv+1),wrong3=correct+1;return{q:`Σ [C(${nv},k)]² for k=0..${nv} = ?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Σ C(n,k)²=C(2n,n) by Vandermonde (m=n, r=n). = C(${2*nv},${nv})=${correct}.`};},
    ];
    const t=T[n%T.length](n*109+79);
    return t;
  },
  graph_theory:(n)=>{
    const T=[
      (s)=>{const k=srI(s,4,8);const edges=C(k,2);const wrong1=k*(k-1),wrong2=k*k,wrong3=edges-1;return{q:`Number of edges in K_${k}?`,opts:shuffle([edges,wrong1,wrong2,wrong3],s),correct:edges,tip:`K_n has C(n,2)=n(n-1)/2 edges.`};},
      (s)=>{const n_=srI(s,3,6);const correct=Math.pow(n_,n_-2);const wrong1=fact(n_),wrong2=Math.pow(n_,n_-1),wrong3=correct-1;return{q:`Labelled trees on ${n_} vertices (Cayley's formula)?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Cayley: n^{n-2}=${n_}^${n_-2}=${correct}.`};},
      (s)=>{const V=srI(s,5,9),E=srI(s+1,V,V+4);const F=E-V+2;const wrong1=E-V+1,wrong2=E-V+3,wrong3=F-1;return{q:`Planar graph: V=${V}, E=${E}. How many faces (including outer face)?`,opts:shuffle([F,wrong1,wrong2,wrong3],s),correct:F,tip:`Euler: V-E+F=2 → F=E-V+2=${E}-${V}+2=${F}.`};},
      (s)=>{const n_=srI(s,4,7);const correct=Math.pow(n_,n_-2);const V=n_,E=n_-1;const wrong1=fact(n_-1),wrong2=C(n_,2),wrong3=Math.pow(n_-1,n_-3);return{q:`A complete graph K_${n_} has how many spanning trees?`,opts:shuffle([correct,wrong1,wrong2,wrong3],s),correct,tip:`Cayley's formula: n^{n-2}=${correct} spanning trees for K_n.`};},
    ];
    const t=T[n%T.length](n*113+83);
    return t;
  },
  invariants:(n)=>{
    const T=[
      (s)=>{return{q:`A checkerboard has 2 opposite corners removed. Can you tile it with dominoes?`,opts:shuffle(['No — colouring invariant','Yes — always','Only if n is even','Only if n>4'],s),correct:'No — colouring invariant',tip:`Removed corners share same colour. Domino covers 1 of each colour. Unequal counts make tiling impossible.`};},
      (s)=>{const n_=srI(s,3,7)*2;return{q:`Start with n=${n_} ones in a row. Operation: replace any two adjacent numbers a,b with |a-b|. Can you reach all zeros?`,opts:shuffle([n_%4===0?'Yes':'No',n_%4===0?'No':'Yes','Always','Never'],s),correct:n_%4===0?'Yes':'No',tip:`Parity invariant: sum mod 2 is preserved. If sum is odd (sum of ${n_} ones = ${n_}, mod 2 = ${n_%2}), cannot reach 0.`};},
      (s)=>{const n_=srI(s,2,6)*2;return{q:`Can you write numbers 1,2,...,${n_} in a circle so every two adjacent numbers sum to a perfect square?`,opts:shuffle(['Yes, for n=${n_}','No, impossible','Only if n is odd','Undetermined'],s),correct:`Yes, for n=${n_}`,tip:`For small even n, construct a valid arrangement. For odd n this is often impossible.`};},
      (s)=>{return{q:`A monovariant is useful in combinatorics because?`,opts:shuffle(['It proves termination of a process','It proves two sets are equal','It gives a bijection','It counts arrangements'],s),correct:'It proves termination of a process',tip:`Monovariant: strictly increases/decreases at each step. Since it is bounded (e.g., non-negative integer), the process must terminate.`};},
    ];
    const t=T[n%T.length](n*127+89);
    return t;
  },
  special_numbers:(n)=>{
    const T=[
      (s)=>{const k=srI(s,3,7);const catK=Cat(k);const wrong1=C(2*k,k),wrong2=Cat(k-1),wrong3=Cat(k+1);return{q:`Catalan number C_${k} = ?`,opts:shuffle([catK,wrong1,wrong2,wrong3],s),correct:catK,tip:`C_n=C(2n,n)/(n+1). C_${k}=${catK}.`};},
      (s)=>{const stirling=[[1],[1,1],[1,3,1],[1,7,6,1],[1,15,25,10,1]];const n_=srI(s,2,5),k_=srI(s+1,1,n_);const ans=stirling[n_-1]?.[k_-1]??1;const wrong1=(ans+1),wrong2=(ans+2),wrong3=Math.max(1,ans-1);return{q:`Stirling number S(${n_},${k_}) (partitions of ${n_}-set into ${k_} non-empty subsets)?`,opts:shuffle([ans,wrong1,wrong2,wrong3],s),correct:ans,tip:`S(n,k)=k·S(n-1,k)+S(n-1,k-1). S(${n_},${k_})=${ans}.`};},
      (s)=>{const bells=[1,1,2,5,15,52,203];const n_=srI(s,2,6);return{q:`Bell number B(${n_}) = total partitions of a ${n_}-element set?`,opts:shuffle([bells[n_],bells[n_]+1,bells[n_-1],bells[n_+1]??bells[n_]*3],s),correct:bells[n_],tip:`Bell numbers: 1,1,2,5,15,52,203,... B(${n_})=${bells[n_]}.`};},
      (s)=>{return{q:`Ramsey number R(3,3) — the minimum n such that any red-blue coloring of K_n contains a monochromatic triangle?`,opts:shuffle([6,5,7,8],s),correct:6,tip:`R(3,3)=6. Among 6 people, always 3 mutual friends or 3 mutual strangers (party problem).`};},
    ];
    const t=T[n%T.length](n*131+97);
    return t;
  },
};

// Global Styles
function useGlobalStyles(){
  useEffect(()=>{
    _initKaTeX();
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=JetBrains+Mono:wght@400;600&display=swap';
    document.head.appendChild(link);
    const s=document.createElement('style');
    s.textContent=`
      *{box-sizing:border-box;margin:0;padding:0;}
      body{background:#07090f;}
      ::-webkit-scrollbar{width:5px;}
      ::-webkit-scrollbar-track{background:#07090f;}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:4px;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
      @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
      @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
      .btn{transition:all 0.2s ease;cursor:pointer;}
      .btn:active{transform:scale(0.97);}
      .katex{color:inherit!important;}
      .katex-display{margin:0!important;}
    `;
    document.head.appendChild(s);
  },[]);
}

// COVER SCREEN
function CoverScreen({ onNext }){
  const [phase,setPhase]=useState(0);
  useEffect(()=>{
    const t=[300,900,1600].map((d,i)=>setTimeout(()=>setPhase(i+1),d));
    return ()=>t.forEach(clearTimeout);
  },[]);
  const floats=['n!','^nP_r','^nC_r','(n-1)!','D_n','C_n','PHP','stars'];
  return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',background:`radial-gradient(ellipse at 50% 0%,${ACCENT}12 0%,transparent 65%),#07090f`,textAlign:'center'}}>
      {floats.map((s,i)=>(
        <div key={s} style={{position:'fixed',pointerEvents:'none',fontSize:16+(i%3)*7,color:`${ACCENT}${(15+i*4).toString(16)}`,top:`${8+i*11}%`,left:i%2===0?`${2+i*4}%`:`${74+i*2}%`,fontFamily:'serif',animation:`pulse ${3+i*0.6}s ease-in-out infinite`,animationDelay:`${i*0.25}s`}}>{s}</div>
      ))}
      <div style={{opacity:phase>=1?1:0,transform:phase>=1?'translateY(0)':'translateY(12px)',transition:'all 0.6s ease',marginBottom:20,display:'inline-flex',alignItems:'center',gap:8,padding:'6px 18px',background:`${ACCENT}14`,border:`1px solid ${ACCENT}40`,borderRadius:40}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:ACCENT,animation:'pulse 2s ease-in-out infinite'}}/>
        <span style={{fontSize:12,color:ACCENT,letterSpacing:'2px',textTransform:'uppercase',fontFamily:'Crimson Pro, serif'}}>Mathematics &nbsp;&middot;&nbsp; Chapter 7</span>
      </div>
      <div style={{opacity:phase>=2?1:0,transform:phase>=2?'translateY(0)':'translateY(20px)',transition:'all 0.7s ease 0.1s',marginBottom:28}}>
        <h1 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:'clamp(38px,9vw,82px)',color:'#fff',letterSpacing:'-3px',lineHeight:0.92,marginBottom:0}}>
          Permutations<br/><span style={{color:ACCENT}}>&amp; Combinations</span>
        </h1>
        <div style={{height:3,width:80,background:`linear-gradient(90deg,${ACCENT},transparent)`,margin:'16px auto 0',borderRadius:2}}/>
      </div>
      <div style={{opacity:phase>=3?1:0,transition:'all 0.6s ease',maxWidth:560,marginBottom:40}}>
        <p style={{fontFamily:'Crimson Pro, serif',fontSize:19,color:'rgba(255,255,255,0.7)',lineHeight:1.55,marginBottom:18,fontStyle:'italic'}}>&ldquo;The art of counting is not mere arithmetic &mdash; it is the architecture of all mathematical possibility.&rdquo;</p>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 24px',textAlign:'left'}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:12,fontFamily:'JetBrains Mono, monospace'}}>Chapter Overview</div>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:'rgba(255,255,255,0.6)',lineHeight:1.75}}>From Fundamental Counting Principles through Factorials, Permutations, and Combinations &mdash; building to Circular Arrangements, Repetition, Constrained Problems, Stars &amp; Bars, Inclusion-Exclusion, Derangements, and Grid Paths &mdash; culminating in Olympiad-level techniques: Pigeonhole Principle, Bijections, Recurrences, Generating Functions, Double Counting, Graph Theory, Invariants, and Special Number Sequences.</p>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginTop:20}}>
          {['Class 9 to Olympiad','22 Topics','Infinite Practice','RMO &middot; INMO &middot; IMO'].map(tag=>(
            <span key={tag} style={{padding:'4px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,fontSize:12,color:'rgba(255,255,255,0.5)',fontFamily:'Crimson Pro, serif'}} dangerouslySetInnerHTML={{__html:tag}}/>
          ))}
        </div>
      </div>
      {phase>=3&&(
        <button onClick={onNext} className="btn" style={{padding:'16px 48px',background:ACCENT,color:'#07090f',border:'none',borderRadius:50,fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:17,letterSpacing:'-0.3px',boxShadow:`0 8px 30px ${ACCENT}55`,animation:'fadeUp 0.5s ease both'}}>
          Begin Chapter &#8594;
        </button>
      )}
    </div>
  );
}

// NOTATION SCREEN
function NotationScreen({ onNext }){
  const [revealed,setRevealed]=useState(false);
  useEffect(()=>{ setTimeout(()=>setRevealed(true),100); },[]);
  const groups=[
    {title:'Counting Fundamentals',color:'#4ECDC4',rows:NOTATION.slice(0,6)},
    {title:'Arrangements &amp; Distributions',color:ACCENT,rows:NOTATION.slice(6,12)},
    {title:'Advanced Combinatorics',color:'#C084FC',rows:NOTATION.slice(12,17)},
    {title:'Olympiad Techniques',color:'#F43F5E',rows:NOTATION.slice(17)},
  ];
  return(
    <div style={{minHeight:'100vh',background:'#07090f',padding:'32px 16px 60px'}}>
      <div style={{maxWidth:680,margin:'0 auto'}}>
        <div style={{marginBottom:32,opacity:revealed?1:0,transition:'opacity 0.5s ease'}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'2px',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>Before We Begin</div>
          <h2 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:34,color:'#fff',letterSpacing:'-1px',marginBottom:10}}>Notation Guide</h2>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>Master these symbols first. They are the precise language of Permutations &amp; Combinations &mdash; used from Class 9 through IMO-level competition problems.</p>
        </div>
        {groups.map((g,gi)=>(
          <div key={gi} style={{marginBottom:24,opacity:revealed?1:0,transform:revealed?'translateY(0)':'translateY(16px)',transition:`all 0.5s ease ${gi*0.1+0.2}s`}}>
            <div style={{fontSize:11,color:g.color,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:20,height:2,background:g.color,borderRadius:1}}/>
              <span dangerouslySetInnerHTML={{__html:g.title}}/>
            </div>
            <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden'}}>
              {g.rows.map((row,ri)=>(
                <div key={ri} style={{display:'grid',gridTemplateColumns:'120px 1fr 1fr',gap:0,borderBottom:ri<g.rows.length-1?'1px solid rgba(255,255,255,0.05)':'none',padding:'11px 16px',alignItems:'center'}}>
                  <div style={{fontFamily:'serif',fontSize:14,color:g.color,overflowX:'auto'}}><KTex l={row.sym}/></div>
                  <div>
                    <div style={{fontFamily:'Crimson Pro, serif',fontWeight:600,fontSize:13,color:'#fff',marginBottom:2}}>{row.name}</div>
                    <div style={{fontFamily:'Crimson Pro, serif',fontSize:12,color:'rgba(255,255,255,0.4)',fontStyle:'italic'}}>{row.meaning}</div>
                  </div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',paddingLeft:8,overflowX:'auto'}}><KTex l={row.ex} style={{fontSize:11}}/></div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{background:`linear-gradient(135deg,${ACCENT}14,${ACCENT}06)`,border:`1px solid ${ACCENT}33`,borderRadius:14,padding:'18px 20px',marginBottom:32}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:12}}>Quick Memory Aid</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:8}}>
            {[['AND','Multiply the counts'],['OR (exclusive)','Add the counts'],['^nP_r','Order matters: n!/(n-r)!'],['^nC_r','Order ignored: n!/(r!(n-r)!)'],['Stars & Bars','x1+...+xk=n non-neg: C(n+k-1,k-1)'],['D_n','(n-1)(D_{n-1}+D_{n-2}), D_n/n!->1/e']].map(([sym,hint])=>(
              <div key={sym} style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:ACCENT,minWidth:110}}>{sym}</span>
                <span style={{fontSize:12,color:'rgba(255,255,255,0.45)',fontFamily:'Crimson Pro,serif',fontStyle:'italic'}}>{hint}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onNext} className="btn" style={{width:'100%',padding:'16px',background:ACCENT,color:'#07090f',border:'none',borderRadius:12,fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:17,boxShadow:`0 6px 24px ${ACCENT}44`}}>
          Start Learning &#8594;
        </button>
      </div>
    </div>
  );
}

// SECTION MENU SCREEN
function SectionMenuScreen({ onSelect, unlockedId }){
  const levels=['Foundation','JEE','Olympiad'];
  const lColors={Foundation:'#4ECDC4',JEE:ACCENT,Olympiad:'#C084FC'};
  const lDesc={Foundation:'Class 9-11 · Basic Counting',JEE:'Class 11-12 · JEE / High School',Olympiad:'RMO · INMO · IMO · Putnam'};
  const orderedIds=SECTIONS.map(s=>s.id);
  const unlockedIdx=orderedIds.indexOf(unlockedId);
  return(
    <div style={{minHeight:'100vh',background:'#07090f',padding:'28px 16px 60px'}}>
      <div style={{maxWidth:660,margin:'0 auto'}}>
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'2px',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>Chapter &middot; Permutations &amp; Combinations</div>
          <h2 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:30,color:'#fff',letterSpacing:'-0.8px',marginBottom:6}}>Choose a Topic</h2>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:15,color:'rgba(255,255,255,0.4)'}}>Complete each topic and pass the mastery quiz to unlock the next.</p>
        </div>
        {levels.map(level=>(
          <div key={level} style={{marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:lColors[level]}}/>
              <span style={{fontSize:13,color:lColors[level],fontWeight:600,fontFamily:'Crimson Pro, serif',textTransform:'uppercase',letterSpacing:'1px'}}>{level}</span>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.3)',fontFamily:'Crimson Pro, serif'}}>&mdash; {lDesc[level]}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {SECTIONS.filter(s=>s.level===level).map(sec=>{
                const idx=orderedIds.indexOf(sec.id);
                const done=idx<unlockedIdx;
                const current=sec.id===unlockedId;
                const locked=idx>unlockedIdx;
                return(
                  <button key={sec.id} onClick={()=>!locked&&onSelect(sec)} className="btn"
                    style={{background:done?`${lColors[level]}12`:current?`${lColors[level]}08`:'rgba(255,255,255,0.015)',border:`1px solid ${done?lColors[level]+'50':current?lColors[level]+'30':'rgba(255,255,255,0.06)'}`,borderRadius:12,padding:'14px 18px',textAlign:'left',display:'flex',alignItems:'center',gap:14,opacity:locked?0.4:1,cursor:locked?'not-allowed':'pointer'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`${lColors[level]}18`,border:`1px solid ${lColors[level]}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:done?16:13,color:lColors[level],fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>
                      {done?'✓':locked?'🔒':sec.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:15,color:done?lColors[level]:current?'#fff':'rgba(255,255,255,0.6)',marginBottom:2}}>{sec.title}</div>
                      <div style={{fontFamily:'Crimson Pro, serif',fontSize:13,color:'rgba(255,255,255,0.35)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{sec.shortDef}</div>
                    </div>
                    <div style={{fontSize:16,color:'rgba(255,255,255,0.2)',flexShrink:0}}>{locked?'🔒':'→'}</div>
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

// SECTION LEARN SCREEN
function SectionLearnScreen({ section, onPractice, onBack }){
  const [tab,setTab]=useState('learn');
  const lColors={Foundation:'#4ECDC4',JEE:ACCENT,Olympiad:'#C084FC'};
  const col=lColors[section.level]||ACCENT;
  const showTree=section.diagram==='tree';
  const showGrid=section.diagram==='grid';
  return(
    <div style={{minHeight:'100vh',background:'#07090f',paddingBottom:80}}>
      <div style={{position:'sticky',top:0,zIndex:30,background:'rgba(7,9,15,0.95)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onBack} className="btn" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',borderRadius:8,padding:'6px 13px',fontSize:13}}>&#8592; Topics</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:15,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{section.title}</div>
          <div style={{fontSize:11,color:col,fontFamily:'JetBrains Mono,monospace'}}>{section.level}</div>
        </div>
      </div>
      <div style={{maxWidth:660,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{display:'flex',gap:4,marginBottom:24,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:4}}>
          {['learn','keys'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="btn"
              style={{flex:1,padding:'9px',borderRadius:8,border:'none',background:tab===t?col:'transparent',color:tab===t?'#07090f':'rgba(255,255,255,0.5)',fontFamily:'Crimson Pro, serif',fontWeight:600,fontSize:14}}>
              {t==='learn'?'Explanation':'Key Facts'}
            </button>
          ))}
        </div>
        {tab==='learn'&&(
          <div style={{animation:'fadeIn 0.4s ease'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:22}}>
              <div style={{width:56,height:56,borderRadius:14,background:`${col}18`,border:`1px solid ${col}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:col,fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{section.icon}</div>
              <p style={{fontFamily:'Playfair Display, serif',fontSize:18,color:'#fff',fontStyle:'italic',lineHeight:1.5}}>"{section.shortDef}"</p>
            </div>
            {showTree&&(
              <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:16,marginBottom:20}}>
                <div style={{fontSize:10,color:col,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:12}}>Counting Tree Diagram</div>
                <CountingTreeSVG a={3} b={2} color={col} size={260}/>
                <p style={{textAlign:'center',fontFamily:'Crimson Pro,serif',fontStyle:'italic',fontSize:12,color:'rgba(255,255,255,0.35)',marginTop:8}}>Each branch multiplies: 3 &times; 2 = 6 total outcomes</p>
              </div>
            )}
            {showGrid&&(
              <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:16,marginBottom:20}}>
                <div style={{fontSize:10,color:col,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:12}}>Lattice Path Diagram</div>
                <GridPathSVG m={3} n={2} color={col} size={260}/>
              </div>
            )}
            <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'20px 22px'}}>
              <div style={{fontSize:10,color:col,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:12}}>Full Explanation</div>
              <p style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:'rgba(255,255,255,0.7)',lineHeight:1.8}}>{section.fullDef}</p>
            </div>
          </div>
        )}
        {tab==='keys'&&(
          <div style={{animation:'fadeIn 0.4s ease'}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'1.2px',fontFamily:'JetBrains Mono,monospace',marginBottom:14}}>Key Formulas &amp; Results</div>
            {section.keyFacts.map((fact_,i)=>(
              <div key={i} style={{display:'flex',gap:12,marginBottom:16,alignItems:'flex-start'}}>
                <div style={{width:28,height:28,borderRadius:8,background:`${col}18`,border:`1px solid ${col}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:col,fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'Crimson Pro, serif',fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:5}}>{fact_.text}</div>
                  <div style={{background:`${col}10`,border:`1px solid ${col}25`,borderRadius:8,padding:'8px 12px',overflowX:'auto'}}>
                    <KTex l={fact_.l} style={{color:col,fontSize:15}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:28}}>
          <button onClick={onPractice} className="btn" style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${col},${col}cc)`,color:'#07090f',border:'none',borderRadius:12,fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:17,boxShadow:`0 6px 24px ${col}44`}}>
            Practice Questions &#8594;
          </button>
        </div>
      </div>
    </div>
  );
}

// PRACTICE SCREEN
function PracticeScreen({ section, onBack, onDone }){
  const [qIdx,setQIdx]=useState(0);
  const [baseSeed]=useState(()=>Math.floor(Math.random()*9999));
  const [showAnswer,setShowAnswer]=useState(false);
  const [showSteps,setShowSteps]=useState(false);
  const [count,setCount]=useState(0);
  const lColors={Foundation:'#4ECDC4',JEE:ACCENT,Olympiad:'#C084FC'};
  const col=lColors[section.level]||ACCENT;
  const gen=GENERATORS[section.genKey]||GENERATORS.counting_principles;
  const seed=baseSeed+qIdx*97;
  const question=useCallback(()=>{ try{ return gen(seed); }catch{ return{question:'Loading...',steps:[],answer:'--',answerLatex:'--',tip:''}; } },[seed])();
  const next=()=>{ setQIdx(i=>i+1); setShowAnswer(false); setShowSteps(false); setCount(c=>c+1); };
  return(
    <div style={{minHeight:'100vh',background:'#07090f',paddingBottom:80}}>
      <div style={{position:'sticky',top:0,zIndex:30,background:'rgba(7,9,15,0.95)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <button onClick={onBack} className="btn" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',borderRadius:8,padding:'6px 13px',fontSize:13}}>&#8592; Learn</button>
          <div style={{flex:1,fontFamily:'Playfair Display, serif',fontSize:14,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{section.title}</div>
          <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:12,color:col,background:`${col}18`,padding:'4px 10px',borderRadius:20,flexShrink:0}}>Q {count+1}</div>
          <button onClick={onDone} className="btn" style={{background:`${col}22`,border:`1px solid ${col}50`,color:col,borderRadius:8,padding:'6px 13px',fontSize:13,fontWeight:600,flexShrink:0}}>Done &#10003;</button>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'Crimson Pro,serif',fontStyle:'italic'}}>Infinite practice &middot; Every question uniquely generated</div>
      </div>
      <div style={{maxWidth:660,margin:'0 auto',padding:'24px 16px'}}>
        <div key={qIdx} style={{background:'rgba(255,255,255,0.025)',border:`1px solid ${col}35`,borderRadius:16,overflow:'hidden',marginBottom:18,animation:'fadeUp 0.4s ease'}}>
          <div style={{background:`${col}12`,borderBottom:`1px solid ${col}22`,padding:'10px 18px',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:col,animation:'pulse 2s ease-in-out infinite'}}/>
            <span style={{fontSize:11,color:col,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace'}}>Question {count+1} &middot; {section.level}</span>
          </div>
          <div style={{padding:'20px 20px 22px'}}>
            <p style={{fontFamily:'Crimson Pro, serif',fontSize:17,color:'#e2e8f0',lineHeight:1.75,marginBottom:12,whiteSpace:'pre-wrap'}}>{question.question}</p>
            {question.questionLatex&&(
              <div style={{background:`${col}0e`,border:`1px solid ${col}22`,borderRadius:10,padding:'12px 16px',overflowX:'auto'}}>
                <KTex l={question.questionLatex} style={{color:col,fontSize:15}}/>
              </div>
            )}
          </div>
        </div>
        {!showAnswer&&(
          <div style={{display:'flex',gap:10,marginBottom:14}}>
            <button onClick={()=>setShowSteps(v=>!v)} className="btn" style={{flex:1,padding:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.7)',fontFamily:'Crimson Pro,serif',fontSize:15}}>
              {showSteps?'Hide Steps':'Show Steps'}
            </button>
            <button onClick={()=>setShowAnswer(true)} className="btn" style={{flex:1,padding:'12px',background:`${col}22`,border:`1px solid ${col}50`,borderRadius:10,color:col,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15}}>
              Reveal Answer &#9654;
            </button>
          </div>
        )}
        {showSteps&&!showAnswer&&(
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'16px 18px',marginBottom:14,animation:'fadeUp 0.3s ease'}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'1.2px',fontFamily:'JetBrains Mono,monospace',marginBottom:12}}>Step-by-Step Approach</div>
            {question.steps.map((step,i)=>(
              <div key={i} style={{display:'flex',gap:10,marginBottom:i<question.steps.length-1?10:0}}>
                <span style={{color:`${col}80`,fontSize:11,fontFamily:'JetBrains Mono,monospace',minWidth:20,paddingTop:2}}>{i+1}.</span>
                <span style={{fontFamily:'Crimson Pro,serif',fontSize:15,color:'rgba(255,255,255,0.65)',lineHeight:1.6}}>{step}</span>
              </div>
            ))}
          </div>
        )}
        {showAnswer&&(
          <div style={{animation:'fadeUp 0.4s ease'}}>
            <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'16px 18px',marginBottom:14}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'1.2px',fontFamily:'JetBrains Mono,monospace',marginBottom:12}}>Solution</div>
              {question.steps.map((step,i)=>(
                <div key={i} style={{display:'flex',gap:10,marginBottom:i<question.steps.length-1?10:0}}>
                  <span style={{color:`${col}80`,fontSize:11,fontFamily:'JetBrains Mono,monospace',minWidth:20,paddingTop:2}}>{i+1}.</span>
                  <span style={{fontFamily:'Crimson Pro,serif',fontSize:15,color:'rgba(255,255,255,0.7)',lineHeight:1.6}}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{background:`linear-gradient(135deg,${col}1a,${col}0a)`,border:`1px solid ${col}50`,borderRadius:14,padding:'16px 20px',marginBottom:14,textAlign:'center'}}>
              <div style={{fontSize:10,color:`${col}aa`,textTransform:'uppercase',letterSpacing:'1.2px',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>Answer</div>
              <div style={{overflowX:'auto',padding:'4px 0'}}>
                <KTex l={question.answerLatex||question.answer} style={{color:col,fontSize:16}}/>
              </div>
            </div>
            {question.tip&&(
              <div style={{background:'rgba(255,209,102,0.06)',border:'1px solid rgba(255,209,102,0.22)',borderRadius:12,padding:'12px 16px',marginBottom:20,display:'flex',gap:10,alignItems:'flex-start'}}>
                <span style={{fontSize:16,flexShrink:0}}>&#128161;</span>
                <p style={{fontFamily:'Crimson Pro,serif',fontStyle:'italic',fontSize:14,color:'rgba(255,209,102,0.88)',lineHeight:1.6}}>{question.tip}</p>
              </div>
            )}
            <button onClick={next} className="btn" style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${col},${col}cc)`,color:'#07090f',border:'none',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,boxShadow:`0 6px 24px ${col}44`}}>
              Next Question &#10230;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// QUIZ SCREEN (Mastery Gate - must pass all 4 to unlock next topic)
function QuizScreen({ section, onPass, onStudy }){
  const lColors={Foundation:'#4ECDC4',JEE:ACCENT,Olympiad:'#C084FC'};
  const col=lColors[section.level]||ACCENT;
  const [seed]=useState(()=>Math.floor(Math.random()*9999));
  const [retrySeed,setRetrySeed]=useState(0);
  const [qNum,setQNum]=useState(0);
  const [answers,setAnswers]=useState([null,null,null,null]);
  const [submitted,setSubmitted]=useState(false);

  const gen=QUIZ_GENERATORS[section.genKey]||QUIZ_GENERATORS.counting_principles;
  const questions=useCallback(()=>{
    const qs=[];
    for(let i=0;i<4;i++){
      try{ qs.push(gen(seed+retrySeed*37+i*7)); }
      catch{ qs.push({q:'Question unavailable.',opts:[0,1,2,3],correct:0,tip:''}); }
    }
    return qs;
  },[seed,retrySeed])();

  const q=questions[qNum];
  const selected=answers[qNum];
  const allAnswered=answers.every(a=>a!==null);
  const score=submitted?answers.filter((a,i)=>a===questions[i].correct).length:0;
  const passed=score===4;

  const handleSelect=opt=>{
    if(submitted)return;
    const a=[...answers]; a[qNum]=opt; setAnswers(a);
  };
  const handleNext=()=>{ if(qNum<3)setQNum(qNum+1); };
  const handlePrev=()=>{ if(qNum>0)setQNum(qNum-1); };
  const handleSubmit=()=>setSubmitted(true);
  const handleRetry=()=>{ setRetrySeed(r=>r+1); setAnswers([null,null,null,null]); setQNum(0); setSubmitted(false); };

  if(submitted){
    return(
      <div style={{minHeight:'100vh',background:'#07090f',padding:'40px 16px'}}>
        <div style={{maxWidth:560,margin:'0 auto',textAlign:'center'}}>
          <div style={{marginBottom:32}}>
            {passed?<TrophySVG col={col}/>:<div style={{fontSize:64,marginBottom:8}}>&#128532;</div>}
          </div>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 18px',background:passed?`${col}18`:'rgba(239,68,68,0.12)',border:`1px solid ${passed?col+'44':'rgba(239,68,68,0.3)'}`,borderRadius:40,marginBottom:20}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:passed?col:'#EF4444'}}/>
            <span style={{fontSize:13,color:passed?col:'#EF4444',fontFamily:'JetBrains Mono,monospace',letterSpacing:'1px'}}>{passed?'MASTERY ACHIEVED':'NOT QUITE YET'}</span>
          </div>
          <h2 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:32,color:'#fff',marginBottom:8}}>{passed?'Topic Unlocked!':'Keep Studying'}</h2>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:17,color:'rgba(255,255,255,0.55)',marginBottom:28}}>{passed?`You scored 4/4. ${SECTIONS[SECTIONS.findIndex(s=>s.id===section.id)+1]?`"${SECTIONS[SECTIONS.findIndex(s=>s.id===section.id)+1].title}" is now unlocked.`:'You have completed all topics!'}`:`You scored ${score}/4. You need 4/4 to unlock the next topic. Review the material and try again.`}</p>
          <div style={{display:'flex',gap:8,marginBottom:28,justifyContent:'center'}}>
            {[0,1,2,3].map(i=>{
              const correct=answers[i]===questions[i].correct;
              return(<div key={i} style={{width:44,height:44,borderRadius:'50%',background:correct?`${col}22`:'rgba(239,68,68,0.15)',border:`2px solid ${correct?col:'#EF4444'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{correct?'✓':'✗'}</div>);
            })}
          </div>
          <div style={{textAlign:'left',marginBottom:28}}>
            {questions.map((question,i)=>{
              const correct=answers[i]===question.correct;
              return(
                <div key={i} style={{background:'rgba(255,255,255,0.025)',border:`1px solid ${correct?col+'35':'rgba(239,68,68,0.3)'}`,borderRadius:12,padding:'14px 16px',marginBottom:10}}>
                  <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:8}}>
                    <div style={{width:22,height:22,borderRadius:'50%',background:correct?`${col}25`:'rgba(239,68,68,0.2)',border:`1px solid ${correct?col:'#EF4444'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0}}>{correct?'✓':'✗'}</div>
                    <p style={{fontFamily:'Crimson Pro, serif',fontSize:14,color:'rgba(255,255,255,0.75)',lineHeight:1.5}}>{question.q}</p>
                  </div>
                  {!correct&&<div style={{padding:'8px 12px',background:'rgba(239,68,68,0.08)',borderRadius:8,marginBottom:6}}><span style={{fontSize:12,color:'#EF4444',fontFamily:'Crimson Pro,serif'}}>Your answer: </span><span style={{fontSize:12,color:'rgba(255,255,255,0.5)',fontFamily:'JetBrains Mono,monospace'}}>{String(answers[i])}</span></div>}
                  <div style={{padding:'8px 12px',background:`${col}0c`,borderRadius:8,marginBottom:6}}><span style={{fontSize:12,color:col,fontFamily:'Crimson Pro,serif'}}>Correct: </span><span style={{fontSize:12,color:'rgba(255,255,255,0.7)',fontFamily:'JetBrains Mono,monospace'}}>{String(question.correct)}</span></div>
                  {question.tip&&<p style={{fontSize:12,color:'rgba(255,209,102,0.75)',fontFamily:'Crimson Pro,serif',fontStyle:'italic',marginTop:4}}>&#128161; {question.tip}</p>}
                </div>
              );
            })}
          </div>
          {passed?(
            <button onClick={onPass} className="btn" style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${col},${col}cc)`,color:'#07090f',border:'none',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,boxShadow:`0 6px 24px ${col}44`,marginBottom:12}}>
              Continue &#8594;
            </button>
          ):(
            <>
              <button onClick={handleRetry} className="btn" style={{width:'100%',padding:'16px',background:`${col}22`,border:`1px solid ${col}44`,color:col,borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,marginBottom:10}}>
                Retry Quiz (New Questions) &#8635;
              </button>
              <button onClick={onStudy} className="btn" style={{width:'100%',padding:'14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.7)',borderRadius:12,fontFamily:'Crimson Pro,serif',fontSize:15}}>
                &#8592; Study Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:'100vh',background:'#07090f',paddingBottom:80}}>
      <div style={{position:'sticky',top:0,zIndex:30,background:'rgba(7,9,15,0.95)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
          <button onClick={onStudy} className="btn" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',borderRadius:8,padding:'6px 13px',fontSize:13}}>&#8592; Study</button>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:14,color:'#fff'}}>Mastery Quiz</div>
            <div style={{fontSize:11,color:col,fontFamily:'JetBrains Mono,monospace'}}>{section.title}</div>
          </div>
          <div style={{display:'flex',gap:4}}>
            {[0,1,2,3].map(i=>(
              <button key={i} onClick={()=>setQNum(i)} className="btn" style={{width:28,height:28,borderRadius:'50%',border:`2px solid ${i===qNum?col:answers[i]!==null?col+'60':'rgba(255,255,255,0.15)'}`,background:i===qNum?`${col}22`:'transparent',color:i===qNum?col:'rgba(255,255,255,0.4)',fontSize:11,fontFamily:'JetBrains Mono,monospace',display:'flex',alignItems:'center',justifyContent:'center'}}>{i+1}</button>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:4,marginTop:6}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{flex:1,height:3,borderRadius:2,background:answers[i]!==null?col:'rgba(255,255,255,0.1)',transition:'background 0.3s ease'}}/>
          ))}
        </div>
        <p style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'Crimson Pro,serif',fontStyle:'italic',marginTop:6}}>Score 4/4 to unlock the next topic. All questions must be correct.</p>
      </div>
      <div style={{maxWidth:620,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{background:'rgba(255,255,255,0.025)',border:`1px solid ${col}35`,borderRadius:16,overflow:'hidden',marginBottom:20}}>
          <div style={{background:`${col}10`,borderBottom:`1px solid ${col}20`,padding:'10px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:col}}/>
              <span style={{fontSize:11,color:col,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace'}}>Mastery Question {qNum+1} of 4</span>
            </div>
            <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontFamily:'Crimson Pro,serif'}}>{answers.filter(a=>a!==null).length}/4 answered</span>
          </div>
          <div style={{padding:'20px 20px 16px'}}>
            <p style={{fontFamily:'Crimson Pro, serif',fontSize:17,color:'#e2e8f0',lineHeight:1.75,marginBottom:q.questionLatex?12:0}}>{q.q}</p>
            {q.questionLatex&&<div style={{background:`${col}0e`,border:`1px solid ${col}20`,borderRadius:10,padding:'10px 14px',overflowX:'auto',marginBottom:4}}><KTex l={q.questionLatex} style={{color:col,fontSize:15}}/></div>}
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
          {q.opts.map((opt,i)=>{
            const isSel=selected===opt;
            const label=['A','B','C','D'][i];
            return(
              <button key={i} onClick={()=>handleSelect(opt)} className="btn"
                style={{width:'100%',padding:'14px 18px',background:isSel?`${col}20`:'rgba(255,255,255,0.03)',border:`2px solid ${isSel?col:'rgba(255,255,255,0.08)'}`,borderRadius:12,textAlign:'left',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:30,height:30,borderRadius:8,background:isSel?col:`${col}18`,border:`1px solid ${isSel?col:`${col}40`}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:isSel?'#07090f':col,fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{label}</div>
                <span style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:isSel?'#fff':'rgba(255,255,255,0.7)',lineHeight:1.4}}>{String(opt)}</span>
              </button>
            );
          })}
        </div>
        <div style={{display:'flex',gap:10}}>
          {qNum>0&&<button onClick={handlePrev} className="btn" style={{padding:'13px 20px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.6)',fontFamily:'Crimson Pro,serif',fontSize:15}}>&#8592; Prev</button>}
          {qNum<3&&<button onClick={handleNext} disabled={selected===null} className="btn" style={{flex:1,padding:'13px',background:selected!==null?`${col}22`:'rgba(255,255,255,0.03)',border:`1px solid ${selected!==null?col+'44':'rgba(255,255,255,0.06)'}`,borderRadius:10,color:selected!==null?col:'rgba(255,255,255,0.3)',fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15,cursor:selected===null?'not-allowed':'pointer'}}>Next Question &#8594;</button>}
          {qNum===3&&<button onClick={handleSubmit} disabled={!allAnswered} className="btn" style={{flex:1,padding:'13px',background:allAnswered?`linear-gradient(135deg,${col},${col}cc)`:'rgba(255,255,255,0.03)',border:`1px solid ${allAnswered?col:'rgba(255,255,255,0.06)'}`,borderRadius:10,color:allAnswered?'#07090f':'rgba(255,255,255,0.3)',fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15,cursor:!allAnswered?'not-allowed':'pointer',boxShadow:allAnswered?`0 4px 20px ${col}44`:'none'}}>Submit All &#10003;</button>}
        </div>
        {!allAnswered&&qNum===3&&<p style={{textAlign:'center',marginTop:10,fontSize:12,color:'rgba(255,255,255,0.3)',fontFamily:'Crimson Pro,serif',fontStyle:'italic'}}>Answer all 4 questions before submitting</p>}
      </div>
    </div>
  );
}

// MAIN APP
export default function App(){
  useGlobalStyles();
  const [screen,setScreen]=useState('cover');
  const [activeSection,setActiveSection]=useState(null);
  const orderedIds=SECTIONS.map(s=>s.id);
  const [unlockedId,setUnlockedId]=useState(orderedIds[0]);

  const goLearn=sec=>{ setActiveSection(sec); setScreen('learn'); };
  const goQuiz=()=>setScreen('quiz');
  const handlePass=()=>{
    const cur=orderedIds.indexOf(activeSection.id);
    const next=orderedIds[cur+1];
    if(next) setUnlockedId(next);
    setScreen('menu');
  };

  if(screen==='cover')    return <CoverScreen onNext={()=>setScreen('notation')}/>;
  if(screen==='notation') return <NotationScreen onNext={()=>setScreen('menu')}/>;
  if(screen==='menu')     return <SectionMenuScreen unlockedId={unlockedId} onSelect={goLearn}/>;
  if(screen==='learn'&&activeSection)    return <SectionLearnScreen section={activeSection} onBack={()=>setScreen('menu')} onPractice={()=>setScreen('practice')}/>;
  if(screen==='practice'&&activeSection) return <PracticeScreen section={activeSection} onBack={()=>setScreen('learn')} onDone={goQuiz}/>;
  if(screen==='quiz'&&activeSection)     return <QuizScreen section={activeSection} onPass={handlePass} onStudy={()=>setScreen('learn')}/>;
  return <CoverScreen onNext={()=>setScreen('notation')}/>;
}

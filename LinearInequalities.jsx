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

// ── Helpers ───────────────────────────────────────────────────
const sr  = n => Math.abs(Math.sin(n*127.1+311.7)*43758.5453)%1;
const srI = (n,lo,hi) => Math.floor(sr(n)*(hi-lo+1))+lo;
const ACCENT = '#22C55E';
function gcd(a,b){return b===0?Math.abs(a):gcd(b,a%b);}
function fmtF(n,d){const g=gcd(Math.abs(n),d);return g===d?String(n/g):`${n/g}/${d/g}`;}

// ── Number Line SVG ────────────────────────────────────────────
function NumberLineSVG({ a=2, strict=true, right=true, color=ACCENT, size=320 }) {
  const W=size, H=64, pad=30, mid=H/2-4;
  const lo=-5, hi=8;
  const sx=x=>pad+((x-lo)/(hi-lo))*(W-2*pad);
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      <line x1={pad} y1={mid} x2={W-pad} y2={mid} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5}/>
      <polygon points={`${W-pad},${mid} ${W-pad-8},${mid-4} ${W-pad-8},${mid+4}`} fill="rgba(255,255,255,0.25)"/>
      {Array.from({length:hi-lo+1},(_,i)=>lo+i).map(v=>(
        <g key={v}>
          <line x1={sx(v)} y1={mid-5} x2={sx(v)} y2={mid+5} stroke="rgba(255,255,255,0.22)" strokeWidth={1}/>
          <text x={sx(v)} y={mid+18} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)" fontFamily="JetBrains Mono,monospace">{v}</text>
        </g>
      ))}
      {right
        ? <line x1={sx(a)} y1={mid} x2={W-pad-4} y2={mid} stroke={color} strokeWidth={3} strokeLinecap="round"/>
        : <line x1={pad+4} y1={mid} x2={sx(a)} y2={mid} stroke={color} strokeWidth={3} strokeLinecap="round"/>
      }
      <circle cx={sx(a)} cy={mid} r={5.5} fill={strict?'#07090f':color} stroke={color} strokeWidth={2.2}/>
      <text x={W/2} y={H-2} textAnchor="middle" fontSize={9} fill={`${color}88`} fontFamily="JetBrains Mono,monospace">
        {right ? `x ${strict?'>':'≥'} ${a}` : `x ${strict?'<':'≤'} ${a}`}
      </text>
    </svg>
  );
}

// ── Half-Plane SVG ─────────────────────────────────────────────
function HalfPlaneSVG({ a=1, b=1, c=4, above=false, color=ACCENT, size=320 }) {
  const W=size, H=Math.round(size*0.6), pad=28;
  const range=Math.max(c/Math.max(Math.abs(a),0.01),c/Math.max(Math.abs(b),0.01),5)+1;
  const sx=x=>pad+x/range*(W-2*pad);
  const sy=y=>H-pad-y/range*(H-2*pad);
  const ox=sx(0),oy=sy(0);
  // Line: a*x + b*y = c
  // x=0 → y=c/b; y=0 → x=c/a
  const lx1=0,ly1=b!==0?c/b:range;
  const lx2=a!==0?c/a:range,ly2=0;
  // Shade region (below for ≤, above for ≥)
  const polyPts = above
    ? `${sx(lx1)},${sy(ly1)} ${sx(lx2)},${sy(ly2)} ${sx(range)},${sy(0)} ${sx(range)},${sy(range)} ${sx(0)},${sy(range)}`
    : `${sx(lx1)},${sy(ly1)} ${sx(lx2)},${sy(ly2)} ${sx(range)},${sy(0)} ${sx(range)},${sy(-1)} ${sx(0)},${sy(-1)} ${sx(0)},${sy(0)}`;
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      {[1,2,3,4,5].map(v=>(
        <g key={v}>
          <line x1={sx(v)} y1={pad} x2={sx(v)} y2={H-pad} stroke="rgba(255,255,255,0.05)" strokeWidth={1}/>
          <line x1={pad} y1={sy(v)} x2={W-pad} y2={sy(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1}/>
        </g>
      ))}
      <line x1={pad} y1={oy} x2={W-pad} y2={oy} stroke="rgba(255,255,255,0.22)" strokeWidth={1.2}/>
      <line x1={ox} y1={pad} x2={ox} y2={H-pad} stroke="rgba(255,255,255,0.22)" strokeWidth={1.2}/>
      <text x={W-pad+3} y={oy+4} fontSize={9} fill="rgba(255,255,255,0.35)" fontFamily="serif" fontStyle="italic">x</text>
      <text x={ox+4} y={pad-4} fontSize={9} fill="rgba(255,255,255,0.35)" fontFamily="serif" fontStyle="italic">y</text>
      <polygon points={polyPts} fill={`${color}22`} stroke="none" clipPath="url(#hpclip)"/>
      <defs><clipPath id="hpclip"><rect x={pad} y={pad} width={W-2*pad} height={H-2*pad}/></clipPath></defs>
      <line x1={sx(lx1)} y1={sy(ly1)} x2={sx(lx2)} y2={sy(ly2)} stroke={color} strokeWidth={2} strokeDasharray="6,4"/>
      <text x={W/2} y={H-5} textAnchor="middle" fontSize={9} fill={`${color}77`} fontFamily="JetBrains Mono,monospace">
        {a}x + {b}y {above?'≥':'≤'} {c}
      </text>
    </svg>
  );
}

// ── Trophy SVG ────────────────────────────────────────────────
function TrophySVG({ col=ACCENT }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <rect x="10" y="22" width="3" height="7" rx="1.5" fill="#4ECDC4" opacity="0.8" transform="rotate(-25 11.5 25.5)"/>
      <rect x="59" y="28" width="3" height="7" rx="1.5" fill="#FF6B6B" opacity="0.8" transform="rotate(20 60.5 31.5)"/>
      <rect x="18" y="54" width="2.5" height="6" rx="1.25" fill="#FFD700" opacity="0.7" transform="rotate(15 19.25 57)"/>
      <rect x="51" y="52" width="2.5" height="6" rx="1.25" fill="#A78BFA" opacity="0.7" transform="rotate(-20 52.25 55)"/>
    </svg>
  );
}

// ── Notation Table ─────────────────────────────────────────────
const NOTATION = [
  {sym:'<',name:'Strictly Less Than',meaning:'a < b: a is less, NOT equal to b',ex:'3<7,\\;-2<0'},
  {sym:'>',name:'Strictly Greater Than',meaning:'a > b: a is greater, NOT equal to b',ex:'5>2,\\;0>-3'},
  {sym:'\\leq',name:'Less Than or Equal (Slack)',meaning:'a ≤ b: a is less than OR equal to b',ex:'3\\leq3,\\;2\\leq5'},
  {sym:'\\geq',name:'Greater Than or Equal (Slack)',meaning:'a ≥ b: a is greater than OR equal to b',ex:'5\\geq5,\\;7\\geq3'},
  {sym:'a<x<b',name:'Compound Inequality',meaning:'x satisfies BOTH a<x and x<b simultaneously',ex:'-2<x<5\\;\\text{(open interval)}'},
  {sym:'[a,b]',name:'Closed Interval',meaning:'All x with a≤x≤b; endpoints included',ex:'[2,5]=\\{x:2\\leq x\\leq5\\}'},
  {sym:'(a,b)',name:'Open Interval',meaning:'All x with a<x<b; endpoints excluded',ex:'(0,1)=\\{x:0<x<1\\}'},
  {sym:'(-\\infty,a)',name:'Unbounded Left Interval',meaning:'All x strictly less than a',ex:'x<3\\;\\Leftrightarrow\\;x\\in(-\\infty,3)'},
  {sym:'|x|<a',name:'Absolute Value (less than)',meaning:'Equivalent to −a < x < a',ex:'|x-2|<3\\Leftrightarrow-1<x<5'},
  {sym:'|x|>a',name:'Absolute Value (greater than)',meaning:'Equivalent to x < −a OR x > a',ex:'|x|>4\\Leftrightarrow x<-4\\text{ or }x>4'},
  {sym:'ax+by\\leq c',name:'Linear Inequality (2 variables)',meaning:'Defines a half-plane in the Cartesian plane',ex:'2x+3y\\leq12'},
  {sym:'z=cx+dy',name:'Objective Function',meaning:'Linear function to maximize or minimize in LP',ex:'z=3x+2y\\;(\\text{LP})'},
  {sym:'\\frac{a+b}{2}\\geq\\sqrt{ab}',name:'AM-GM Inequality',meaning:'Arithmetic Mean ≥ Geometric Mean; equality iff a=b',ex:'\\frac{x+4/x}{2}\\geq\\sqrt{4}=2'},
  {sym:'AM\\geq GM\\geq HM',name:'AM-GM-HM Chain',meaning:'Three classical means ordered for positive reals',ex:'\\frac{a+b}{2}\\geq\\sqrt{ab}\\geq\\frac{2ab}{a+b}'},
  {sym:'(\\sum a_ib_i)^2\\leq(\\sum a_i^2)(\\sum b_i^2)',name:'Cauchy-Schwarz Inequality',meaning:'Power tool for ratio and sum bounds',ex:'(x_1y_1+x_2y_2)^2\\leq(x_1^2+x_2^2)(y_1^2+y_2^2)'},
  {sym:"f\\!\\left(\\tfrac{\\sum x_i}{n}\\right)\\leq\\tfrac{\\sum f(x_i)}{n}",name:"Jensen's Inequality (convex f)",meaning:'For convex f, function of mean ≤ mean of function',ex:"e^{(a+b)/2}\\leq\\tfrac{e^a+e^b}{2}"},
  {sym:'|a+b|\\leq|a|+|b|',name:'Triangle Inequality',meaning:'Modulus of sum ≤ sum of moduli; equality iff same sign',ex:'|{-3}+5|=2\\leq|-3|+|5|=8'},
  {sym:'\\sum a_ib_{\\sigma(i)}\\text{ max}',name:'Rearrangement Inequality',meaning:'Sum is maximized when sequences sorted in same order',ex:'\\text{same-order sort gives max }\\sum a_ib_i'},
  {sym:'n\\sum a_ib_i\\geq(\\sum a_i)(\\sum b_i)',name:"Chebyshev's Sum Inequality",meaning:'For similarly-ordered sequences; reverses for opposite order',ex:'3(ab+cd+ef)\\geq(a+c+e)(b+d+f)'},
  {sym:'a^t(a-b)(a-c)+\\cdots\\geq0',name:"Schur's Inequality",meaning:'For t≥0 and non-negative a,b,c; t=1 is most common',ex:'a(a-b)(a-c)+b(b-a)(b-c)+c(c-a)(c-b)\\geq0'},
  {sym:'a=y+z,\\;b=z+x,\\;c=x+y',name:'Ravi Substitution',meaning:'For triangle sides a,b,c: substitute to enforce triangle inequality automatically',ex:'x,y,z>0\\Rightarrow a,b,c\\text{ are valid sides}'},
  {sym:'f=\\sum\\lambda_i s_i^2',name:'SOS / Normalization',meaning:'Sum of Squares: prove f≥0 by writing as ∑λᵢsᵢ². Normalize via a+b+c=1 or abc=1',ex:'x^2+y^2-xy=(x-y/2)^2+3y^2/4\\geq0'},
];

// ── Sections ───────────────────────────────────────────────────
const SECTIONS = [
  {id:'li_notation',title:'Basic Notation & Sign Rules',level:'Foundation',color:'#22C55E',icon:'<≤>≥',
   shortDef:"The four inequality symbols: strict (<,>) vs slack (≤,≥). The critical rule: multiplying or dividing by a negative FLIPS the inequality direction.",
   fullDef:"Inequalities compare two expressions. Strict inequalities (<,>) exclude the boundary value (open circle on number line, parenthesis in interval notation). Slack inequalities (≤,≥) include it (filled circle, square bracket). The most important rule: if you multiply or divide both sides by a negative number, you MUST flip the direction. Example: −3x > 6 → x < −2 (flip!). This is because the number line reverses when scaled by a negative. Interval notation: (a,b) is open, [a,b] is closed, [a,b) is half-open. Infinity always gets a parenthesis since it is not a real number.",
   keyFacts:[{text:'Strict (<,>): open circle; Slack (≤,≥): filled',l:'a<b\\text{ (open) vs }a\\leq b\\text{ (closed)}'},{text:'⚠️ FLIP when × or ÷ by negative',l:'-3x>6\\Rightarrow x<-2\\;(\\text{flip!})'},{text:'Interval notation',l:'x\\geq a\\Leftrightarrow x\\in[a,\\infty)'},{text:'Compound inequality',l:'a<x<b\\Leftrightarrow x\\in(a,b)'},{text:'Equivalence',l:'x\\leq5\\Leftrightarrow x\\in(-\\infty,5]'}],
   genKey:'li_notation',diagram:'numberline'},
  {id:'li_onevar',title:'One-Variable Inequalities',level:'Foundation',color:'#4ADE80',icon:'ax+b>c',
   shortDef:"Solve ax+b>c using the same steps as equations, but flip the sign when dividing by a negative. Represent solutions on a number line or in interval notation.",
   fullDef:"To solve a linear inequality in one variable: isolate x using the same arithmetic steps as equations. The only difference is the flip rule: dividing or multiplying by a negative reverses the inequality. Steps: (1) Expand and simplify both sides. (2) Move all x-terms to one side and constants to the other. (3) Divide by the coefficient of x — if it is negative, FLIP. (4) Write the solution as an inequality, on a number line (open/closed circle + shaded arrow), or in interval notation. Special cases: if you get a contradiction (like 5>7) the solution set is empty ∅. If you get a tautology (like 3>0) the solution is all real numbers ℝ.",
   keyFacts:[{text:'Solve like equation, but flip on ÷ negative',l:'\\text{If }a<0:\\quad ax>b\\Rightarrow x<b/a'},{text:'Open interval for strict',l:'3x+1>10\\Rightarrow x>3\\Rightarrow x\\in(3,\\infty)'},{text:'Closed for slack',l:'2x-5\\leq1\\Rightarrow x\\leq3\\Rightarrow x\\in(-\\infty,3]'},{text:'Contradiction → empty set',l:'x+1>x+5\\Rightarrow 1>5\\;\\text{(impossible: }\\emptyset)'},{text:'Tautology → all reals',l:'x+5>x+1\\Rightarrow 5>1\\;\\text{(always: }\\mathbb{R})'}],
   genKey:'li_onevar',diagram:'numberline'},
  {id:'li_twovar',title:'Two-Variable Inequalities',level:'Foundation',color:'#10B981',icon:'ax+by<c',
   shortDef:"ax+by<c defines a half-plane. Draw the boundary line (dashed for strict, solid for slack), then test a point to determine which side to shade.",
   fullDef:"A linear inequality in two variables (ax+by<c) describes a half-plane — one of the two regions the boundary line divides the plane into. Steps: (1) Draw the boundary line ax+by=c. Use a dashed line for strict (<, >) and a solid line for slack (≤, ≥). (2) Pick a test point NOT on the line (the origin (0,0) is easiest when not on the line). (3) Substitute into the inequality. If true, shade the side containing the test point; if false, shade the other side. The shaded region is the solution set. Every point in the shaded region satisfies the inequality.",
   keyFacts:[{text:'Boundary: dashed for strict, solid for slack',l:'ax+by<c\\;\\text{(dashed)}\\quad ax+by\\leq c\\;\\text{(solid)}'},{text:'Test point (0,0) if not on line',l:'\\text{If }a(0)+b(0)<c\\Leftrightarrow 0<c:\\text{ shade origin side}'},{text:'Half-plane: one side of boundary',l:'\\{(x,y):ax+by<c\\}\\text{ is a half-plane}'},{text:'Shade the region satisfying the inequality',l:'2x+y<4:\\text{ shade below line }2x+y=4'},{text:'Every point in shaded region is a solution',l:'(1,1):2+1=3<4\\;\\checkmark'}],
   genKey:'li_twovar',diagram:'halfplane'},
  {id:'li_systems',title:'Systems of Linear Inequalities',level:'Foundation',color:'#059669',icon:'∩ regions',
   shortDef:"Graph each inequality's half-plane and shade the intersection — the feasible region. Corner points of the feasible region are found by solving the boundary lines simultaneously.",
   fullDef:"A system of linear inequalities is solved graphically: shade the half-plane for each inequality, and the feasible region is their intersection (the overlap of all shaded areas). The feasible region may be bounded (a polygon) or unbounded. Key steps: (1) Graph each boundary line. (2) Shade the correct half-plane for each. (3) The feasible region is the area satisfying ALL inequalities simultaneously. (4) Find corner vertices by solving pairs of boundary equations. The corner points are crucial because, for any linear objective function, the optimal value always occurs at a corner of the feasible region.",
   keyFacts:[{text:'Feasible region = intersection of all half-planes',l:'\\text{Feasible}=H_1\\cap H_2\\cap\\cdots\\cap H_n'},{text:'Corner points: solve boundary pairs',l:'x+y=4\\text{ and }2x+y=6:\\;(2,2)'},{text:'Standard LP domain',l:'x\\geq0,\\;y\\geq0\\text{ (first quadrant)}'},{text:'Bounded vs unbounded regions',l:'x\\geq0,y\\geq0,x+y\\leq4:\\text{ triangle}'},{text:'Check all 4 constraints at each corner',l:'(3,0):\\;x+y=3\\leq4\\;\\checkmark,\\;2x+y=6\\;\\checkmark'}],
   genKey:'li_systems',diagram:'halfplane'},
  {id:'li_wordprob',title:'Word Problems & Constraints',level:'Foundation',color:'#16A34A',icon:'constraints',
   shortDef:"Translate real-world conditions into inequalities: 'at least' → ≥, 'at most' → ≤, 'more than' → >, 'less than' → <. Then solve the system.",
   fullDef:"Word problems require translating English phrases into mathematical inequalities. Key translations: 'at least n' or 'no less than n' → ≥ n. 'At most n' or 'no more than n' → ≤ n. 'More than n' → > n. 'Less than n' → < n. 'Between a and b' (inclusive) → a ≤ x ≤ b. Typical setups: budgeting constraints (total cost ≤ budget), production limits (total items ≤ capacity), mixture problems (percentages). Non-negativity constraints (x ≥ 0, y ≥ 0) are often implicit. Always define your variables clearly, write one inequality per constraint, and check your answer makes physical sense.",
   keyFacts:[{text:'"At least" → ≥; "at most" → ≤',l:'\\text{"spend at most \\$50" }\\Rightarrow\\text{ cost}\\leq50'},{text:'"More than" → >; "fewer than" → <',l:'\\text{"more than 3 hours" }\\Rightarrow t>3'},{text:'Non-negativity is often implicit',l:'x\\geq0,\\;y\\geq0\\;(\\text{quantities cannot be negative})'},{text:'Budget constraint',l:'p_1x_1+p_2x_2\\leq B'},{text:'Capacity constraint',l:'x+y\\leq N\\;(\\text{total production limit})'}],
   genKey:'li_wordprob'},
  {id:'li_absval',title:'Absolute Value Inequalities',level:'JEE',color:'#F59E0B',icon:'|ax+b|',
   shortDef:"|ax+b|<c → −c<ax+b<c. |ax+b|>c → ax+b<−c OR ax+b>c. The 'less than' case gives an intersection; 'greater than' gives a union.",
   fullDef:"Absolute value inequalities have two cases based on direction. Case 1 (less than): |f(x)| < c (c>0) ↔ −c < f(x) < c — a compound inequality that gives an interval. Case 2 (greater than): |f(x)| > c (c>0) ↔ f(x) < −c or f(x) > c — two separate inequalities that give a union of intervals. For ≤ and ≥, apply the same rule with the boundary included. When c ≤ 0: |f(x)| < c is impossible (empty set); |f(x)| ≥ 0 is always true. Key: |f(x)| ≤ c gives a closed bounded interval; |f(x)| ≥ c gives a closed unbounded union. Always check: is c positive?",
   keyFacts:[{text:'Less than: bounded interval',l:'|ax+b|<c\\Leftrightarrow-c<ax+b<c'},{text:'Greater than: two rays',l:'|ax+b|>c\\Leftrightarrow ax+b<-c\\text{ or }ax+b>c'},{text:'Slack versions',l:'|x-a|\\leq r\\Leftrightarrow a-r\\leq x\\leq a+r'},{text:'Always: |f(x)|≥0',l:'|x|<0\\text{ has NO solution (empty set)}'},{text:'Equality: |x-a|=r means x=a±r',l:'|x-3|=5\\Rightarrow x=8\\text{ or }x=-2'}],
   genKey:'li_absval'},
  {id:'li_triangle',title:'Triangle Inequality',level:'JEE',color:'#FBBF24',icon:'|a+b|≤|a|+|b|',
   shortDef:"|a+b| ≤ |a|+|b| (triangle inequality) and ||a|−|b|| ≤ |a−b| (reverse). Equality holds iff a and b have the same sign (or one is zero).",
   fullDef:"The triangle inequality |a+b| ≤ |a|+|b| holds for all real a,b. It says the absolute value of a sum cannot exceed the sum of absolute values. Equality holds iff a and b are both non-negative or both non-positive (same sign). The reverse triangle inequality: ||a|−|b|| ≤ |a−b| — useful for lower bounds. Iterated form: |a₁+a₂+⋯+aₙ| ≤ |a₁|+|a₂|+⋯+|aₙ|. Applications: bounding expressions, proving |f(x)−f(a)| < ε, estimating sums. The geometric interpretation: in a triangle, any side is less than the sum of the other two sides.",
   keyFacts:[{text:'Triangle inequality',l:'|a+b|\\leq|a|+|b|'},{text:'Equality condition',l:'ab\\geq0\\;(\\text{same sign or zero})'},{text:'Reverse triangle inequality',l:'\\bigl||a|-|b|\\bigr|\\leq|a-b|'},{text:'Iterated form',l:'|a_1+\\cdots+a_n|\\leq|a_1|+\\cdots+|a_n|'},{text:'Geometric: triangle sides',l:'|AC|\\leq|AB|+|BC|\\text{ always}'}],
   genKey:'li_triangle'},
  {id:'li_wavycurve',title:'Quadratic & Rational Inequalities',level:'JEE',color:'#F97316',icon:'wavy curve',
   shortDef:"Use the Wavy Curve (Sign Chart) Method: factor the expression, place roots on number line, alternate signs from right to left, read off intervals.",
   fullDef:"For polynomial inequalities P(x) > 0: (1) Move everything to one side. (2) Factor completely. (3) Find all real roots (zeros). (4) Place roots in increasing order on a number line. (5) Check the sign in the rightmost interval (for large x, the sign depends on leading coefficient). (6) Alternate signs moving left through each root. For rational inequalities P(x)/Q(x) > 0: also find zeros of Q(x) (where expression is undefined) and treat them like roots. Key: at a root of even multiplicity, the sign does NOT change; at odd multiplicity, it does. This is the core of the Wavy Curve Method used in JEE.",
   keyFacts:[{text:'Move all to one side, factor',l:'x^2-5x+6>0\\Rightarrow(x-2)(x-3)>0'},{text:'Roots: x=2, x=3. Sign alternates',l:'x<2:\\;+;\\;2<x<3:\\;-;\\;x>3:\\;+'},{text:'Solution for >0: x<2 or x>3',l:'(x-2)(x-3)>0\\Leftrightarrow x\\in(-\\infty,2)\\cup(3,\\infty)'},{text:'Rational: find zeros of numerator and denominator',l:'\\frac{x-1}{x+2}>0:\\;x<-2\\text{ or }x>1'},{text:'Even multiplicity: sign does NOT change at root',l:'(x-2)^2>0:\\;x\\neq2\\;(\\text{same sign both sides})'}],
   genKey:'li_wavycurve'},
  {id:'li_linprog',title:'Basic Linear Programming',level:'JEE',color:'#EAB308',icon:'max/min z',
   shortDef:"Maximize or minimize a linear objective function z=ax+by subject to a system of linear constraints. The optimal value always occurs at a corner point of the feasible region.",
   fullDef:"Linear Programming (LP) finds the optimal value of a linear objective function z=cx+dy subject to a system of linear constraints (inequalities). Fundamental theorem: if the feasible region is bounded and non-empty, the maximum and minimum of z are attained at corner (vertex) points. Algorithm: (1) Write all constraints; (2) Graph the feasible region; (3) Find all corner points by solving pairs of boundary equations; (4) Evaluate z at each corner point; (5) The largest/smallest value is the optimum. If the feasible region is unbounded, a maximum may not exist, but we can still find a minimum. LP has real-world applications in resource allocation, diet problems, and production optimization.",
   keyFacts:[{text:'Objective function: z=ax+by',l:'\\text{Maximize/minimize }z=ax+by'},{text:'Optimal value at corner point',l:'\\max z\\text{ always at a vertex of feasible region}'},{text:'Standard constraints',l:'x\\geq0,\\;y\\geq0,\\;\\text{plus resource constraints}'},{text:'Corner points from constraint intersections',l:'\\text{Solve pairs of boundary lines}'},{text:'Evaluate z at ALL corners',l:'\\text{Compare: select max or min}'}],
   genKey:'li_linprog'},
  {id:'li_amgm',title:'AM-GM-HM Inequality',level:'Olympiad',color:'#A855F7',icon:'AM≥GM',
   shortDef:"AM ≥ GM ≥ HM for positive reals. The most powerful tool for finding minima/maxima of symmetric expressions. Equality iff all variables are equal.",
   fullDef:"For positive reals a₁,a₂,…,aₙ: AM = (a₁+⋯+aₙ)/n ≥ GM = (a₁a₂⋯aₙ)^{1/n} ≥ HM = n/(1/a₁+⋯+1/aₙ). Equality holds iff all aᵢ are equal. The two-variable AM-GM: (a+b)/2 ≥ √(ab) ↔ a+b ≥ 2√(ab). Power tool: to find the minimum of x+k/x (x>0), write x+k/x ≥ 2√(x·k/x) = 2√k, with equality at x=√k. For three variables: a+b+c ≥ 3(abc)^{1/3}. Weighted AM-GM: λa+(1−λ)b ≥ a^λ b^{1−λ}. In Olympiads, AM-GM is used to prove that a sum achieves a minimum or that a product is bounded.",
   keyFacts:[{text:'Two-variable AM-GM',l:'\\dfrac{a+b}{2}\\geq\\sqrt{ab},\\;a,b>0'},{text:'Equality iff a=b',l:'\\text{Eq. when }a=b'},{text:'Min of x+k/x',l:'x+\\dfrac{k}{x}\\geq 2\\sqrt{k},\\;\\text{min at }x=\\sqrt{k}'},{text:'Three-variable',l:'a+b+c\\geq3(abc)^{1/3}'},{text:'AM-GM-HM chain',l:'\\dfrac{a+b}{2}\\geq\\sqrt{ab}\\geq\\dfrac{2ab}{a+b}'}],
   genKey:'li_amgm'},
  {id:'li_cauchy',title:'Cauchy-Schwarz Inequality',level:'Olympiad',color:'#9333EA',icon:'C-S ineq',
   shortDef:"(∑aᵢbᵢ)² ≤ (∑aᵢ²)(∑bᵢ²). Equality iff aᵢ/bᵢ = const. Used for bounding dot products, sums of ratios (Titu's lemma), and proving symmetric bounds.",
   fullDef:"Cauchy-Schwarz: (a₁b₁+a₂b₂+⋯+aₙbₙ)² ≤ (a₁²+a₂²+⋯+aₙ²)(b₁²+b₂²+⋯+bₙ²). Equality iff (a₁,…,aₙ) and (b₁,…,bₙ) are proportional. Titu's lemma (Engel/SOS form): a₁²/b₁+⋯+aₙ²/bₙ ≥ (a₁+⋯+aₙ)²/(b₁+⋯+bₙ). Extremely useful for bounding sums of fractions. Special case n=2: (a₁b₁+a₂b₂)² ≤ (a₁²+a₂²)(b₁²+b₂²) → (ax+by)² ≤ (a²+b²)(x²+y²). Setting bᵢ=1: (∑aᵢ)² ≤ n∑aᵢ² (power mean inequality). Used in Olympiads to prove lower bounds on sums, find minima under constraints, and simplify ratio problems.",
   keyFacts:[{text:'Cauchy-Schwarz',l:'(\\textstyle\\sum a_ib_i)^2\\leq(\\sum a_i^2)(\\sum b_i^2)'},{text:"Titu's Lemma (Engel form)",l:'\\dfrac{a_1^2}{b_1}+\\cdots+\\dfrac{a_n^2}{b_n}\\geq\\dfrac{(a_1+\\cdots+a_n)^2}{b_1+\\cdots+b_n}'},{text:'Equality condition',l:'a_i/b_i=\\text{const for all }i'},{text:'Special: set bᵢ=1',l:'(\\textstyle\\sum a_i)^2\\leq n\\sum a_i^2'},{text:'Min of ∑aᵢ²/bᵢ via Titu',l:'\\dfrac{a^2}{x}+\\dfrac{b^2}{y}\\geq\\dfrac{(a+b)^2}{x+y}'}],
   genKey:'li_cauchy'},
  {id:'li_jensen',title:"Jensen's Inequality",level:'Olympiad',color:'#C084FC',icon:'convex f',
   shortDef:"For convex f: f((a₁+⋯+aₙ)/n) ≤ (f(a₁)+⋯+f(aₙ))/n. For concave f, reverse. Equality iff all xᵢ are equal.",
   fullDef:"Jensen's inequality: if f is convex on an interval and x₁,…,xₙ are points in that interval, then f((x₁+⋯+xₙ)/n) ≤ (f(x₁)+⋯+f(xₙ))/n. For concave f, the inequality reverses. Convex functions (f''(x)>0): x², eˣ, x log x, 1/x (x>0), xᵖ for p>1. Concave functions (f''(x)<0): √x, log x, xᵖ for 0<p<1. Weighted version: f(∑wᵢxᵢ) ≤ ∑wᵢf(xᵢ) for weights wᵢ≥0 summing to 1. Applications: proving AM-GM (use f=−log), proving trigonometric inequalities in triangles (use concavity of sin on [0,π]).",
   keyFacts:[{text:"Jensen's (convex f)",l:"f\\!\\left(\\dfrac{\\sum x_i}{n}\\right)\\leq\\dfrac{\\sum f(x_i)}{n}"},{text:'Convex functions (f\'\'≥0)',l:"f(x)=x^2,\\;e^x,\\;1/x\\;(x>0)\\text{ are convex}"},{text:'Concave functions (f\'\'≤0)',l:'f(x)=\\sqrt{x},\\;\\ln x\\text{ are concave}'},{text:'Weighted Jensen',l:'f(\\textstyle\\sum w_ix_i)\\leq\\sum w_if(x_i),\\;\\sum w_i=1'},{text:'Example: sin in triangle',l:'\\sin A+\\sin B+\\sin C\\leq\\tfrac{3\\sqrt{3}}{2}\\;(A+B+C=\\pi)'}],
   genKey:'li_jensen'},
  {id:'li_rearrange',title:'Rearrangement & Chebyshev',level:'Olympiad',color:'#EC4899',icon:'sort & sum',
   shortDef:"Rearrangement: sum ∑aᵢbσ(i) is maximized when both sequences sorted the same way, minimized when sorted oppositely. Chebyshev: n∑aᵢbᵢ ≥ (∑aᵢ)(∑bᵢ) for similarly ordered sequences.",
   fullDef:"Rearrangement Inequality: if a₁≤a₂≤⋯≤aₙ and b₁≤b₂≤⋯≤bₙ, then for any permutation σ: ∑aᵢbₙ₊₁₋ᵢ ≤ ∑aᵢbσ(i) ≤ ∑aᵢbᵢ. The maximum sum uses the same-sorted order; the minimum uses the opposite order. Chebyshev's Sum Inequality: if a₁≥a₂≥⋯≥aₙ and b₁≥b₂≥⋯≥bₙ (same order), then n∑aᵢbᵢ ≥ (∑aᵢ)(∑bᵢ). For opposite order, ≤. These are proven by repeated application of the simple fact that (a₁−a₂)(b₁−b₂)≥0 when both sequences are sorted the same way.",
   keyFacts:[{text:'Rearrangement: max = same order',l:'a_1\\leq a_2,\\;b_1\\leq b_2\\Rightarrow a_1b_1+a_2b_2\\geq a_1b_2+a_2b_1'},{text:'Rearrangement: min = opposite order',l:'a_1b_2+a_2b_1\\leq a_1b_1+a_2b_2'},{text:"Chebyshev's (same order)",l:'n\\textstyle\\sum a_ib_i\\geq(\\sum a_i)(\\sum b_i)'},{text:'Proof idea',l:'(a_i-a_j)(b_i-b_j)\\geq0\\text{ for same-sorted}'},{text:'Application',l:'a^2+b^2+c^2\\geq ab+bc+ca\\;(\\text{from rearrangement})'}],
   genKey:'li_rearrange'},
  {id:'li_schur',title:"Schur's, Muirhead's & Ravi",level:'Olympiad',color:'#F472B6',icon:'Schur/Ravi',
   shortDef:"Schur's inequality: a^t(a-b)(a-c)+b^t(b-a)(b-c)+c^t(c-a)(c-b)≥0. Ravi: for triangle sides, set a=y+z, b=z+x, c=x+y. Muirhead: [p,q,r]≻[s,t,u] iff one majorizes the other.",
   fullDef:"Schur's Inequality (t=1): a³+b³+c³+abc ≥ ab(a+b)+bc(b+c)+ca(c+a) for non-negative a,b,c. This is equivalent to a(a−b)(a−c)+b(b−a)(b−c)+c(c−a)(c−b)≥0. Ravi Substitution: if a,b,c are sides of a triangle, set a=y+z, b=z+x, c=x+y where x,y,z>0. This automatically satisfies triangle inequalities and simplifies many proofs. Muirhead's Inequality: if [p,q,r] majorizes [s,t,u] (i.e., p≥s, p+q≥s+t), then ∑sym a^p b^q c^r ≥ ∑sym a^s b^t c^u for non-negative a,b,c with a+b+c fixed. Homogenization: multiply/divide terms by (a+b+c)^k to make degrees equal before applying Muirhead.",
   keyFacts:[{text:"Schur's (t=1)",l:'a^3+b^3+c^3+abc\\geq ab(a+b)+bc(b+c)+ca(c+a)'},{text:'Ravi Substitution',l:'a=y+z,\\;b=z+x,\\;c=x+y\\;(x,y,z>0)'},{text:'Ravi auto-satisfies triangle inequality',l:'a+b>c\\Leftrightarrow(y+z)+(z+x)>(x+y)\\;\\checkmark'},{text:"Muirhead: [2,1,0]≻[1,1,1]",l:'a^2b+a^2c+\\cdots\\geq 6abc\\;(\\text{AM-GM type})'},{text:'Homogenization',l:'\\text{Make degrees equal: }f(a,b,c)=g(a,b,c)(a+b+c)^k'}],
   genKey:'li_schur'},
  {id:'li_advanced',title:'UVW, SOS & Lagrange',level:'Olympiad',color:'#FB923C',icon:'UVW/SOS',
   shortDef:"UVW: parametrize by p=a+b+c, q=ab+bc+ca, r=abc. SOS: write expression as sum of squares ≥ 0. Lagrange multipliers: ∇f = λ∇g for constrained optimization.",
   fullDef:"UVW Method: For symmetric inequalities in a,b,c, set p=a+b+c, q=ab+bc+ca, r=abc. Then a,b,c are roots of t³−pt²+qt−r=0. The constraint q²≥3pr (discriminant ≥ 0) bounds the variables. Fix p,q and minimize/maximize in r. SOS (Sum of Squares): prove f(x,y,…) ≥ 0 by writing f = λ₁s₁²+λ₂s₂²+⋯ with λᵢ≥0. This is a certificate of non-negativity. Example: x²+y²−xy = (x−y/2)²+3y²/4 ≥ 0. Lagrange Multipliers: for extrema of f(x,y) subject to g(x,y)=c, solve ∇f=λ∇g along with g=c. The method converts constrained optimization into a system of equations.",
   keyFacts:[{text:'UVW parametrization',l:'p=a+b+c,\\;q=ab+bc+ca,\\;r=abc'},{text:'SOS certificate',l:'f\\geq0\\Leftrightarrow f=\\sum\\lambda_i s_i^2,\\;\\lambda_i\\geq0'},{text:'SOS example',l:'x^2+y^2-xy=\\left(x-\\tfrac{y}{2}\\right)^2+\\tfrac{3y^2}{4}\\geq0'},{text:'Lagrange: ∇f=λ∇g',l:'\\nabla f=\\lambda\\nabla g\\text{ at constrained extremum}'},{text:'Normalization',l:'\\text{WLOG: set }a+b+c=1\\text{ or }abc=1'}],
   genKey:'li_advanced'},
];

// ── Practice Generators ───────────────────────────────────────
const GENERATORS = {
  li_notation:(n)=>{
    const t=n%3;
    if(t===0){
      const k=srI(n,2,7),m=srI(n+1,2,6)*k;
      return{question:`Solve: −${k}x > ${m}. Remember the sign rule!`,questionLatex:`-${k}x>${m}`,steps:[`Divide both sides by −${k}`,`⚠️ Dividing by NEGATIVE → FLIP the inequality!`,`x < ${m}/${k} = ${m/k}`],answer:`x < ${m/k}`,answerLatex:`x<${m/k}`,tip:`FLIP whenever you multiply or divide both sides by a negative. Here ÷(−${k}) flips > to <.`};}
    if(t===1){
      const a=srI(n+2,-5,-1),b=srI(n+3,a+1,6);
      return{question:`Express as an interval: ${a} < x ≤ ${b}.`,questionLatex:`${a}<x\\leq${b}`,steps:[`Left: strict < at ${a} → open parenthesis (`,`Right: slack ≤ at ${b} → closed bracket ]`,`Interval: (${a}, ${b}]`],answer:`(${a}, ${b}]`,answerLatex:`(${a},${b}]`,tip:`Strict inequality → open paren/parenthesis; Slack ≤ or ≥ → square bracket.`};}
    const k2=srI(n+4,2,8),b2=srI(n+5,1,10);
    return{question:`Solve: ${k2}x ≥ ${-b2}. Write in interval notation.`,questionLatex:`${k2}x\\geq${-b2}`,steps:[`Divide by ${k2} (positive → NO flip)`,`x ≥ ${-b2}/${k2} = ${fmtF(-b2,k2)}`,`Interval: [${fmtF(-b2,k2)}, ∞)`],answer:`x ≥ ${fmtF(-b2,k2)}, or [${fmtF(-b2,k2)}, ∞)`,answerLatex:`x\\geq${fmtF(-b2,k2)},\\;[${fmtF(-b2,k2)},\\infty)`,tip:`Positive divisor: no flip. Result x≥k gives a closed left-bounded interval.`};
  },
  li_onevar:(n)=>{
    const t=n%3;
    const a=srI(n,1,5),b=srI(n+1,1,10),c=srI(n+2,b+a,b+5*a);
    if(t===0){
      const rhs=c-b;const g=gcd(rhs,a);const ans=fmtF(rhs,a);
      return{question:`Solve: ${a}x + ${b} > ${c}.`,questionLatex:`${a}x+${b}>${c}`,steps:[`Subtract ${b}: ${a}x > ${rhs}`,`Divide by ${a}: x > ${ans}`],answer:`x > ${ans}`,answerLatex:`x>${ans}`,tip:`Positive leading coefficient → inequality direction stays the same.`};}
    if(t===1){
      const k=srI(n+3,2,6),m=srI(n+4,5,15),r=srI(n+5,0,3);
      const lhs_ans=m-r;const g=gcd(Math.abs(lhs_ans),k);const ans=fmtF(lhs_ans,k);
      return{question:`Solve: −${k}x + ${m} ≥ ${r}.`,questionLatex:`-${k}x+${m}\\geq${r}`,steps:[`Subtract ${m}: −${k}x ≥ ${r-m}`,`Divide by −${k} → FLIP: x ≤ ${lhs_ans}/${k} = ${ans}`],answer:`x ≤ ${ans}`,answerLatex:`x\\leq${ans}`,tip:`−${k}x means negative coefficient → flip ≥ to ≤ when isolating x.`};}
    const x1=srI(n+6,-4,-1),x2=srI(n+7,2,7);
    return{question:`Solve the compound inequality: 2x+${-2*x1} > 0 and 3x < ${3*x2}.`,questionLatex:`2x+${-2*x1}>0\\text{ AND }3x<${3*x2}`,steps:[`From 2x+${-2*x1}>0: x>${x1}`,`From 3x<${3*x2}: x<${x2}`,`Both: ${x1} < x < ${x2}`],answer:`${x1} < x < ${x2}`,answerLatex:`${x1}<x<${x2}`,tip:`"AND" means intersection: both must hold simultaneously.`};
  },
  li_twovar:(n)=>{
    const a=srI(n,1,4),b=srI(n+1,1,3),c=srI(n+2,6,12);
    const px=srI(n+3,1,4),py=srI(n+4,0,4);
    const val=a*px+b*py;
    const sat=val<c;
    return{question:`Does the point (${px}, ${py}) satisfy ${a}x + ${b}y < ${c}?`,questionLatex:`${a}x+${b}y<${c},\\;(${px},${py})`,steps:[`Substitute x=${px}, y=${py}:`,`${a}(${px})+${b}(${py}) = ${a*px}+${b*py} = ${val}`,`Is ${val} < ${c}? → ${sat?'YES ✓':'NO ✗'}`,`The point ${sat?'IS':'is NOT'} in the solution region`],answer:sat?`Yes, (${px},${py}) satisfies the inequality`:`No, ${val} is not < ${c}`,answerLatex:sat?`${val}<${c}\\;\\checkmark`:`${val}\\not< ${c}\\;\\times`,tip:`Substitute directly. If true → point is in shaded half-plane. If false → not in region.`};
  },
  li_systems:(n)=>{
    const a=srI(n,2,4),b=srI(n+1,1,3),c=a*srI(n+2,2,4)+b*srI(n+3,1,3);
    const q=srI(n+4,1,3),p=srI(n+5,1,3),r=p*srI(n+6,1,3)+q*srI(n+7,1,3);
    // Feasible region: x≥0,y≥0,ax+by≤c,px+qy≤r  
    // Corner (0,0),(c/a,0),(0,c/b) but only those feasible under both
    const corners=[];
    corners.push({x:0,y:0,z:0});
    // x-axis: ax=c → x=c/a, y=0: check px≤r → p(c/a)≤r
    const xInt=c/a,yInt=c/b;
    if(p*xInt<=r) corners.push({x:xInt,y:0});
    if(q*yInt<=r) corners.push({x:0,y:yInt});
    const mx=srI(n+8,1,4),my=srI(n+9,1,4);
    let maxZ=-1,maxPt={x:0,y:0};
    corners.forEach(pt=>{const z=mx*pt.x+my*pt.y;if(z>maxZ){maxZ=z;maxPt=pt;}});
    return{question:`Corner points of x≥0, y≥0, ${a}x+${b}y≤${c}. Which maximizes z=${mx}x+${my}y?`,questionLatex:`z=${mx}x+${my}y,\\;x\\geq0,y\\geq0,${a}x+${b}y\\leq${c}`,steps:[`Corner points: (0,0), (${xInt},0), (0,${yInt.toFixed(2)})`,`z at (0,0)=${mx*0+my*0}=0`,`z at (${xInt},0)=${mx*xInt+my*0}=${mx*xInt}`,`z at (0,${yInt.toFixed(2)})=${mx*0+my*yInt}=${+(my*yInt).toFixed(2)}`,`Maximum z=${+maxZ.toFixed(2)} at (${+maxPt.x.toFixed(2)},${+maxPt.y.toFixed(2)})`],answer:`Max z=${+maxZ.toFixed(2)} at (${+maxPt.x.toFixed(2)}, ${+maxPt.y.toFixed(2)})`,answerLatex:`z_{\\max}=${+maxZ.toFixed(2)}`,tip:`Evaluate objective function at ALL corner points. Max/min always at a vertex.`};
  },
  li_wordprob:(n)=>{
    const budget=srI(n,50,200)*5,p1=srI(n+1,3,12),p2=srI(n+2,2,8);
    const cap=srI(n+3,15,40);
    return{question:`A shop sells item A for $${p1} and item B for $${p2}. Total items ≤ ${cap} and budget ≤ $${budget}. Write the constraints.`,questionLatex:`p_1x+p_2y\\leq${budget},\\;x+y\\leq${cap},\\;x,y\\geq0`,steps:[`Let x = units of A, y = units of B`,`Cost constraint: ${p1}x+${p2}y ≤ ${budget}`,`Quantity constraint: x+y ≤ ${cap}`,`Non-negativity: x ≥ 0, y ≥ 0`],answer:`${p1}x+${p2}y≤${budget}, x+y≤${cap}, x,y≥0`,answerLatex:`${p1}x+${p2}y\\leq${budget},\\;x+y\\leq${cap},\\;x,y\\geq0`,tip:`"At most" → ≤. Non-negativity is always implied for physical quantities.`};
  },
  li_absval:(n)=>{
    const t=n%2;
    const a=srI(n,1,3),b=srI(n+1,0,5),c=srI(n+2,4,10);
    if(t===0){
      // |ax+b|<c → -c<ax+b<c → (-c-b)/a < x < (c-b)/a
      const lo=(-c-b),hi=(c-b);
      const loS=fmtF(lo,a),hiS=fmtF(hi,a);
      return{question:`Solve: |${a}x${b>=0?'+':''}${b}| < ${c}.`,questionLatex:`|${a}x${b>=0?'+'+b:b}|<${c}`,steps:[`|f(x)|<c ↔ −c < f(x) < c`,`−${c} < ${a}x${b>=0?'+':''}${b} < ${c}`,`Subtract ${b}: ${-c-b} < ${a}x < ${c-b}`,`Divide by ${a}: ${loS} < x < ${hiS}`],answer:`${loS} < x < ${hiS}`,answerLatex:`${loS}<x<${hiS}`,tip:`|f|<c gives a bounded interval: −c<f<c.`};}
    const a2=srI(n+3,1,3),b2=srI(n+4,1,5),c2=srI(n+5,3,8);
    const lo2=(-c2-b2),hi2=(c2-b2);
    const loS2=fmtF(lo2,a2),hiS2=fmtF(hi2,a2);
    return{question:`Solve: |${a2}x+${b2}| ≥ ${c2}.`,questionLatex:`|${a2}x+${b2}|\\geq${c2}`,steps:[`|f(x)|≥c ↔ f(x)≤−c OR f(x)≥c`,`Case 1: ${a2}x+${b2} ≤ −${c2} → x ≤ ${loS2}`,`Case 2: ${a2}x+${b2} ≥ ${c2} → x ≥ ${hiS2}`,`Solution: x ≤ ${loS2} or x ≥ ${hiS2}`],answer:`x ≤ ${loS2} or x ≥ ${hiS2}`,answerLatex:`x\\leq${loS2}\\text{ or }x\\geq${hiS2}`,tip:`|f|≥c gives a union of two rays (unbounded). Think of it as "far from the centre".`};
  },
  li_triangle:(n)=>{
    const a=srI(n,-6,6)||1,b=srI(n+1,-6,6)||2;
    const lhs=Math.abs(a+b),rhs=Math.abs(a)+Math.abs(b);
    return{question:`Verify |${a}+${b}| ≤ |${a}|+|${b}|. When does equality hold?`,questionLatex:`|${a}+${b}|\\leq|${a}|+|${b}|`,steps:[`LHS: |${a}+${b}| = |${a+b}| = ${lhs}`,`RHS: |${a}|+|${b}| = ${Math.abs(a)}+${Math.abs(b)} = ${rhs}`,`${lhs} ≤ ${rhs}? → ${lhs<=rhs?'YES ✓':'ERROR'}`,`Equality holds iff a,b have the same sign (or one is 0)`,`Here: ${(a>=0&&b>=0)||(a<=0&&b<=0)?'Same sign → equality holds':'Different signs → strict inequality'}`],answer:`LHS=${lhs} ≤ RHS=${rhs} ✓. Equality iff same sign.`,answerLatex:`${lhs}\\leq${rhs}\\;\\checkmark`,tip:`Triangle inequality is always true. Equality iff ab≥0 (same sign or zero).`};
  },
  li_wavycurve:(n)=>{
    const t=n%2;
    if(t===0){
      const r1=srI(n,0,4),r2=r1+srI(n+1,1,4);
      // (x-r1)(x-r2)>0 → x<r1 or x>r2
      return{question:`Solve: (x−${r1})(x−${r2}) > 0 using the Wavy Curve Method.`,questionLatex:`(x-${r1})(x-${r2})>0`,steps:[`Roots: x=${r1} and x=${r2}`,`For large x: (x−${r1})(x−${r2})>0 (positive, coefficient +1)`,`Signs: x<${r1}:+, ${r1}<x<${r2}:−, x>${r2}:+`,`Solution (>0): x<${r1} or x>${r2}`],answer:`x < ${r1} or x > ${r2}`,answerLatex:`x<${r1}\\text{ or }x>${r2}`,tip:`Wavy curve: alternate +/− from right. Find where it matches your inequality direction.`};}
    const r1=srI(n+2,-2,2),r2=r1+srI(n+3,1,3);
    // (x-r1)/(x-r2)>0 → x<r1 or x>r2 (if r1<r2)
    return{question:`Solve the rational inequality: (x−${r1})/(x−${r2}) > 0.`,questionLatex:`\\dfrac{x-${r1}}{x-${r2}}>0`,steps:[`Critical points: numerator=0 at x=${r1}; denominator=0 at x=${r2}`,`x=${r2} is EXCLUDED (undefined)`,`Signs: x<${r1}:+/−=−; ${r1}<x<${r2}:+/−=−; wait: check signs carefully`,`x<${r1}: (−)(−)>0 ✓; ${r1}<x<${r2}: (+)(−)<0 ✗; x>${r2}: (+)(+)>0 ✓`,`Solution: x<${r1} or x>${r2}`],answer:`x < ${r1} or x > ${r2} (x≠${r2})`,answerLatex:`x<${r1}\\text{ or }x>${r2}`,tip:`For rational inequalities, include zeros of numerator (if ≥), EXCLUDE zeros of denominator.`};
  },
  li_linprog:(n)=>{
    const a=srI(n,2,5),b=srI(n+1,1,4),c=srI(n+2,8,20);
    const d=srI(n+3,1,4),e=srI(n+4,1,3),f=srI(n+5,6,16);
    const px=srI(n+6,2,6),py=srI(n+7,1,5);
    // corners: (0,0),(c/a,0),(0,c/b) subject to dx+ey≤f
    const x1=Math.min(c/a,f/d),y1=0;
    const x2=0,y2=Math.min(c/b,f/e);
    const vals=[[0,0],[x1,y1],[x2,y2]].map(([x,y])=>({x,y,z:px*x+py*y}));
    const maxV=vals.reduce((m,v)=>v.z>m.z?v:m,vals[0]);
    return{question:`Maximize z=${px}x+${py}y subject to: ${a}x+${b}y≤${c}, ${d}x+${e}y≤${f}, x,y≥0.`,questionLatex:`\\max z=${px}x+${py}y,\\;${a}x+${b}y\\leq${c},\\;${d}x+${e}y\\leq${f},\\;x,y\\geq0`,steps:[`Find corner points: (0,0), (${x1.toFixed(1)},0), (0,${y2.toFixed(1)})`,`z(0,0)=0`,`z(${x1.toFixed(1)},0)=${+(px*x1).toFixed(1)}`,`z(0,${y2.toFixed(1)})=${+(py*y2).toFixed(1)}`,`Max z=${+maxV.z.toFixed(1)} at (${+maxV.x.toFixed(1)},${+maxV.y.toFixed(1)})`],answer:`Max z=${+maxV.z.toFixed(1)}`,answerLatex:`z_{\\max}=${+maxV.z.toFixed(1)}`,tip:`Always evaluate at ALL corner points. Optimal value is guaranteed at a vertex.`};
  },
  li_amgm:(n)=>{
    const k2s=[1,4,9,16,25,36];const k2=k2s[n%6];const k=Math.sqrt(k2);
    const a=srI(n+1,1,6),b=srI(n+2,1,6);
    const t=n%2;
    if(t===0){
      return{question:`Find the minimum value of f(x) = x + ${k2}/x for x > 0.`,questionLatex:`f(x)=x+\\dfrac{${k2}}{x},\\;x>0`,steps:[`By AM-GM: x + ${k2}/x ≥ 2√(x·${k2}/x) = 2√${k2} = ${2*k}`,`Equality when x = ${k2}/x → x² = ${k2} → x = ${k}`,`Minimum value = ${2*k}`],answer:`Minimum = ${2*k}`,answerLatex:`\\min=${2*k}\\text{ at }x=${k}`,tip:`AM-GM: a+b ≥ 2√(ab). To minimize x+k/x: set a=x, b=k/x, get min=2√k.`};}
    const s=a+b;
    return{question:`For positive reals a,b with a+b=${s}, find the maximum of ab.`,questionLatex:`a+b=${s},\\;a,b>0:\\;\\max(ab)=?`,steps:[`By AM-GM: (a+b)/2 ≥ √(ab)`,`${s}/2 ≥ √(ab) → ab ≤ (${s}/2)² = ${(s/2)**2}`,`Equality when a=b=${s/2}`,`Maximum ab = ${(s/2)**2}`],answer:`Max ab = ${(s/2)**2} at a=b=${s/2}`,answerLatex:`\\max(ab)=${(s/2)**2},\\;a=b=${s/2}`,tip:`AM-GM: max of product given fixed sum s is (s/2)². Achieved when a=b.`};
  },
  li_cauchy:(n)=>{
    const a=srI(n,1,5),b=srI(n+1,1,5),x=srI(n+2,1,5),y=srI(n+3,1,5);
    const t=n%2;
    if(t===0){
      const lhs=(a*x+b*y)**2,rhs=(a*a+b*b)*(x*x+y*y);
      return{question:`Verify Cauchy-Schwarz: (${a}·${x}+${b}·${y})² ≤ (${a}²+${b}²)(${x}²+${y}²).`,questionLatex:`(${a*x+b*y})^2\\leq(${a*a+b*b})(${x*x+y*y})`,steps:[`LHS = (${a*x}+${b*y})² = ${lhs}`,`RHS = (${a*a}+${b*b})(${x*x}+${y*y}) = ${(a*a+b*b)}·${(x*x+y*y)} = ${rhs}`,`${lhs} ≤ ${rhs}? → ${lhs<=rhs?'YES ✓':'checking...'}`],answer:`${lhs} ≤ ${rhs} ✓`,answerLatex:`${lhs}\\leq${rhs}\\;\\checkmark`,tip:`(ab+cd)² ≤ (a²+c²)(b²+d²). Equality iff a/b=c/d (proportional).`};}
    const b1=srI(n+4,1,4),b2=srI(n+5,1,4);
    // Titu: a²/b1 + b²/b2 ≥ (a+b)²/(b1+b2)
    const lhsV=a*a/b1+b*b/b2,rhsV=(a+b)**2/(b1+b2);
    return{question:`Apply Titu's Lemma: ${a}²/${b1} + ${b}²/${b2} ≥ (${a}+${b})²/(${b1}+${b2}).`,questionLatex:`\\dfrac{${a}^2}{${b1}}+\\dfrac{${b}^2}{${b2}}\\geq\\dfrac{(${a}+${b})^2}{${b1}+${b2}}`,steps:[`Titu (Engel): a²/x + b²/y ≥ (a+b)²/(x+y)`,`LHS = ${a*a}/${b1}+${b*b}/${b2} = ${lhsV.toFixed(3)}`,`RHS = ${(a+b)**2}/${b1+b2} = ${rhsV.toFixed(3)}`,`${lhsV.toFixed(3)} ≥ ${rhsV.toFixed(3)} ✓`],answer:`LHS ≥ RHS ✓ (Titu's Lemma)`,answerLatex:`\\dfrac{${a*a}}{${b1}}+\\dfrac{${b*b}}{${b2}}\\geq\\dfrac{${(a+b)**2}}{${b1+b2}}\\;\\checkmark`,tip:`Titu: Σaᵢ²/bᵢ ≥ (Σaᵢ)²/Σbᵢ. Equality when aᵢ/bᵢ = const.`};
  },
  li_jensen:(n)=>{
    const a=srI(n,1,4),b=srI(n+1,a+1,a+4);
    const t=n%2;
    if(t===0){
      // f(x)=x², convex: ((a+b)/2)² ≤ (a²+b²)/2
      const lhs=((a+b)/2)**2,rhs=(a*a+b*b)/2;
      return{question:`For convex f(x)=x², verify Jensen's: f((${a}+${b})/2) ≤ (f(${a})+f(${b}))/2.`,questionLatex:`f\\!\\left(\\dfrac{${a}+${b}}{2}\\right)\\leq\\dfrac{f(${a})+f(${b})}{2}`,steps:[`f((${a+b})/2)=f(${(a+b)/2})=(${(a+b)/2})²=${lhs}`,`(f(${a})+f(${b}))/2=(${a*a}+${b*b})/2=${rhs}`,`${lhs} ≤ ${rhs}? → YES ✓ (convex function)`],answer:`${lhs} ≤ ${rhs} ✓ (Jensen's)`,answerLatex:`${lhs}\\leq${rhs}\\;\\checkmark`,tip:`For convex f: function of mean ≤ mean of function. For concave: reverse.`};}
    const c=srI(n+2,a+1,b-1); // a<c<b
    // concave: f=√x: √((a+c)/2) ≥ (√a+√c)/2... actually Jensen for concave is ≥
    return{question:`For concave f(x)=√x, Jensen says f((${a}+${b})/2) ≥ (f(${a})+f(${b}))/2. Verify.`,questionLatex:`\\sqrt{\\dfrac{${a}+${b}}{2}}\\geq\\dfrac{\\sqrt{${a}}+\\sqrt{${b}}}{2}`,steps:[`LHS = √(${(a+b)/2}) = ${Math.sqrt((a+b)/2).toFixed(4)}`,`RHS = (√${a}+√${b})/2 = (${Math.sqrt(a).toFixed(4)}+${Math.sqrt(b).toFixed(4)})/2 = ${((Math.sqrt(a)+Math.sqrt(b))/2).toFixed(4)}`,`${Math.sqrt((a+b)/2).toFixed(4)} ≥ ${((Math.sqrt(a)+Math.sqrt(b))/2).toFixed(4)}? → YES ✓`],answer:`√((a+b)/2) ≥ (√a+√b)/2 ✓`,answerLatex:`\\sqrt{\\tfrac{a+b}{2}}\\geq\\tfrac{\\sqrt{a}+\\sqrt{b}}{2}\\;\\checkmark`,tip:`For CONCAVE f: Jensen reverses → f(mean) ≥ mean of f. Concave: √x, ln x.`};
  },
  li_rearrange:(n)=>{
    const a1=srI(n,1,4),a2=srI(n+1,a1+1,a1+4);
    const b1=srI(n+2,1,4),b2=srI(n+3,b1+1,b1+4);
    const sameOrder=a1*b1+a2*b2,oppOrder=a1*b2+a2*b1;
    return{question:`a₁=${a1},a₂=${a2},b₁=${b1},b₂=${b2}. Compare a₁b₁+a₂b₂ vs a₁b₂+a₂b₁.`,questionLatex:`\\text{Compare }${a1}\\cdot${b1}+${a2}\\cdot${b2}\\text{ vs }${a1}\\cdot${b2}+${a2}\\cdot${b1}`,steps:[`Same-order (asc,asc): ${a1}·${b1}+${a2}·${b2}=${a1*b1}+${a2*b2}=${sameOrder}`,`Opposite-order: ${a1}·${b2}+${a2}·${b1}=${a1*b2}+${a2*b1}=${oppOrder}`,`Rearrangement: same-order ≥ opposite-order`,`${sameOrder} ≥ ${oppOrder} ✓`,`Difference = (${a2}-${a1})(${b2}-${b1}) = ${(a2-a1)*(b2-b1)} > 0 ✓`],answer:`Same-order sum ${sameOrder} ≥ Opposite-order sum ${oppOrder}`,answerLatex:`${sameOrder}\\geq${oppOrder}\\;\\checkmark`,tip:`Rearrangement: same-sorted order gives maximum sum; opposite order gives minimum.`};
  },
  li_schur:(n)=>{
    const x=srI(n,1,4),y=srI(n+1,1,3),z=srI(n+2,1,3);
    const a=y+z,b=z+x,c=x+y;
    return{question:`Verify Schur's (t=1) for a=${a},b=${b},c=${c}: a³+b³+c³+abc ≥ ab(a+b)+bc(b+c)+ca(c+a).`,questionLatex:`a^3+b^3+c^3+abc\\geq ab(a+b)+bc(b+c)+ca(c+a)`,steps:[`LHS = ${a}³+${b}³+${c}³+${a}·${b}·${c} = ${a**3+b**3+c**3+a*b*c}`,`ab(a+b) = ${a*b*(a+b)}, bc(b+c) = ${b*c*(b+c)}, ca(c+a) = ${c*a*(c+a)}`,`RHS = ${a*b*(a+b)+b*c*(b+c)+c*a*(c+a)}`,`${a**3+b**3+c**3+a*b*c} ≥ ${a*b*(a+b)+b*c*(b+c)+c*a*(c+a)}? → YES ✓`],answer:`LHS=${a**3+b**3+c**3+a*b*c} ≥ RHS=${a*b*(a+b)+b*c*(b+c)+c*a*(c+a)} ✓`,answerLatex:`\\text{LHS}\\geq\\text{RHS}\\;\\checkmark`,tip:`Schur's with t=1 is the most useful form. Note a,b,c came from Ravi: a=y+z, b=z+x, c=x+y.`};
  },
  li_advanced:(n)=>{
    const a=srI(n,1,4),b=srI(n+1,1,4);
    const t=n%2;
    if(t===0){
      // SOS: a²+b²-ab = (a-b/2)²+3b²/4 ≥ 0
      return{question:`Prove ${a*a}+${b*b}-${a*b} ≥ 0 using the SOS (Sum of Squares) method. (Express a²+b²-ab as SOS.)`,questionLatex:`a^2+b^2-ab\\geq0\\text{ for all real }a,b`,steps:[`Complete the square: a²+b²-ab`,`= a²−ab+b²/4 + 3b²/4`,`= (a−b/2)² + 3b²/4`,`Both terms ≥ 0, so a²+b²−ab ≥ 0 ✓`,`For a=${a},b=${b}: (${a}-${b/2})²+3·${b}²/4 = ${(a-b/2)**2}+${3*b*b/4} = ${(a-b/2)**2+3*b*b/4}`],answer:`a²+b²−ab = (a−b/2)²+3b²/4 ≥ 0`,answerLatex:`a^2+b^2-ab=\\left(a-\\tfrac{b}{2}\\right)^2+\\tfrac{3b^2}{4}\\geq0`,tip:`SOS: complete the square to write f = sum of squared terms ≥ 0. This is a non-negativity certificate.`};}
    const s=srI(n+2,3,8);
    return{question:`Minimize f(x,y)=x²+y² subject to x+y=${s} using Lagrange multipliers.`,questionLatex:`\\min(x^2+y^2)\\text{ subject to }x+y=${s}`,steps:[`Lagrange: ∇f=λ∇g where g=x+y−${s}=0`,`∇f=(2x,2y), ∇g=(1,1)`,`2x=λ, 2y=λ → x=y`,`x+y=${s} → x=y=${s/2}`,`Min = x²+y² = 2·(${s/2})² = ${2*(s/2)**2}`],answer:`Min = ${2*(s/2)**2} at x=y=${s/2}`,answerLatex:`\\min=${2*(s/2)**2}\\text{ at }x=y=${s/2}`,tip:`Lagrange: at optimum, gradient of objective ∝ gradient of constraint. Often gives x=y (symmetric point).`};
  },
};

// ── Quiz Generators ───────────────────────────────────────────
function shuffle(arr,seed){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(sr(seed*i+i)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

const QUIZ_GENERATORS = {
  li_notation:(n)=>{
    const T=[
      (s)=>{const k=srI(s,2,7),m=srI(s+1,2,6)*k;const ans=String(-m/k);return{q:`Solve: −${k}x > ${m}. What is the solution?`,opts:shuffle([`x < ${-m/k}`,`x > ${-m/k}`,`x < ${m/k}`,`x > ${m/k}`],s),correct:`x < ${-m/k}`,tip:`Divide by −${k} → FLIP the inequality. ${m}/−${k} = −${m/k}.`};},
      (s)=>{return{q:`Which symbol means "at most"?`,opts:shuffle(['≤','≥','<','>'],s+1),correct:'≤',tip:`"At most k" means the value is ≤ k (includes equality).`};},
      (s)=>{const a=srI(s+2,-5,-1),b=srI(s+3,1,6);return{q:`What is the interval notation for ${a} ≤ x < ${b}?`,opts:shuffle([`[${a},${b})`,`(${a},${b})`,`[${a},${b}]`,`(${a},${b}]`],s+4),correct:`[${a},${b})`,tip:`Closed bracket [ for ≤ (included), open paren ) for < (excluded).`};},
      (s)=>{const k=srI(s+5,2,8);return{q:`If you multiply both sides of x > 3 by −${k}, the result is:`,opts:shuffle([`x < −${3*k}`,`x > −${3*k}`,`x < ${3*k}`,`x > ${3*k}`],s+6),correct:`x < −${3*k}`,tip:`Multiply by −${k} (negative) → flip >  to < AND multiply: 3·−${k}=−${3*k}.`};},
    ];const t=T[n%T.length](n*67+13);return t;
  },
  li_onevar:(n)=>{
    const T=[
      (s)=>{const a=srI(s,1,5),b=srI(s+1,1,8),c=b+a*srI(s+2,1,5);const ans=`x > ${fmtF(c-b,a)}`;return{q:`Solve: ${a}x+${b} > ${c}`,opts:shuffle([ans,`x < ${fmtF(c-b,a)}`,`x > ${fmtF(c+b,a)}`,`x < ${fmtF(c+b,a)}`],s+3),correct:ans,tip:`${a}x > ${c-b} → x > ${fmtF(c-b,a)}.`};},
      (s)=>{const k=srI(s+4,2,6),m=srI(s+5,5,14),r=srI(s+6,0,m-1);const ans=`x ≤ ${fmtF(m-r,k)}`;return{q:`Solve: −${k}x+${m} ≥ ${r}`,opts:shuffle([`x ≤ ${fmtF(m-r,k)}`,`x ≥ ${fmtF(m-r,k)}`,`x ≤ ${fmtF(m+r,k)}`,`x ≥ ${fmtF(r-m,k)}`],s+7),correct:ans,tip:`−${k}x ≥ ${r-m} → divide by −${k}, FLIP: x ≤ ${fmtF(m-r,k)}.`};},
      (s)=>{const a=srI(s+8,-4,-1),b=srI(s+9,1,5);return{q:`x ≥ ${a} in interval notation is:`,opts:shuffle([`[${a},∞)`,`(${a},∞)`,`(−∞,${a}]`,`(−∞,${a})`],s+10),correct:`[${a},∞)`,tip:`≥ means closed bracket. Infinity always gets a parenthesis.`};},
      (s)=>{const c=srI(s+11,1,4),d=srI(s+12,c+1,c+6);return{q:`Solution of ${c} < 2x < ${2*d} is:`,opts:shuffle([`${c/2} < x < ${d}`,`${c} < x < ${2*d}`,`${c/2} < x < ${2*d}`,`${c} < x < ${d}`],s+13),correct:`${c/2} < x < ${d}`,tip:`Divide all parts by 2: ${c}/2 < x < ${2*d}/2.`};},
    ];const t=T[n%T.length](n*71+17);return t;
  },
  li_twovar:(n)=>{
    const T=[
      (s)=>{const a=srI(s,1,3),b=srI(s+1,1,3),c=srI(s+2,6,12);const px=srI(s+3,1,4),py=srI(s+4,0,4);const val=a*px+b*py;const sat=val<c;const ans=sat?`Yes — satisfies`:`No — does not satisfy`;return{q:`Does (${px},${py}) satisfy ${a}x+${b}y < ${c}?`,opts:shuffle([`Yes — satisfies`,`No — does not satisfy`,'Cannot determine','Only on boundary'],s+5),correct:ans,tip:`Substitute: ${a}(${px})+${b}(${py})=${val}. Is ${val}<${c}? ${sat?'Yes':'No'}.`};},
      (s)=>{return{q:`For a STRICT inequality ax+by < c, the boundary line is drawn:`,opts:shuffle(['Dashed (not included)','Solid (included)','Dotted','As a double line'],s+6),correct:'Dashed (not included)',tip:`Strict < or > → dashed boundary. Slack ≤ or ≥ → solid boundary.`};},
      (s)=>{const c=srI(s+7,4,10);return{q:`To find which side to shade for x+y < ${c}: test point (0,0) gives:`,opts:shuffle([`0+0=0 < ${c} ✓ shade origin side`,`0+0=0 > ${c} shade other side`,`0+0=${c} — on boundary`,`Test fails — need another point`],s+8),correct:`0+0=0 < ${c} ✓ shade origin side`,tip:`(0,0) is almost always the easiest test point (avoid if line passes through origin).`};},
      (s)=>{const a=srI(s+9,1,4),b=srI(s+10,1,3),c=srI(s+11,4,10);return{q:`The boundary of ${a}x+${b}y ≤ ${c} passes through which two axis points?`,opts:shuffle([`(${c/a},0) and (0,${c/b})`,`(${a},0) and (0,${b})`,`(0,${c/a}) and (${c/b},0)`,`(${c},0) and (0,${c})`],s+12),correct:`(${c/a},0) and (0,${c/b})`,tip:`Set y=0: x=${c/a}. Set x=0: y=${c/b}.`};},
    ];const t=T[n%T.length](n*73+19);return t;
  },
  li_systems:(n)=>{
    const T=[
      (s)=>{return{q:`The optimal value in a bounded LP problem occurs:`,opts:shuffle(['At a corner point of the feasible region','Inside the feasible region','On any boundary edge','At the origin only'],s),correct:'At a corner point of the feasible region',tip:`Fundamental theorem of LP: optimal always at a vertex (corner point).`};},
      (s)=>{const sum=srI(s+1,5,10);const a=srI(s+2,2,sum-2),b=sum-a;return{q:`Corner points of x≥0,y≥0,x+y≤${sum} are:`,opts:shuffle([`(0,0),(${sum},0),(0,${sum})`,`(0,0),(${a},0),(0,${b})`,`(1,1),(${sum},0),(0,${sum})`,`(${a},${b}) only`],s+3),correct:`(0,0),(${sum},0),(0,${sum})`,tip:`Three corners: origin (0,0), x-intercept (${sum},0), y-intercept (0,${sum}).`};},
      (s)=>{const p=srI(s+4,2,5),q=srI(s+5,1,4);const c1=p*2+q*1,c2=p*0+q*4,c3=p*3+q*0;const corners=[[2,1,c1],[0,4,c2],[3,0,c3],[0,0,0]];const maxC=corners.reduce((m,c)=>c[2]>m[2]?c:m,corners[0]);return{q:`Maximize z=${p}x+${q}y at corners (0,0),(2,1),(0,4),(3,0). Max z=?`,opts:shuffle([maxC[2],c1-1,c2+1,c3-1].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+6),correct:maxC[2],tip:`z at (0,0)=0, (2,1)=${c1}, (0,4)=${c2}, (3,0)=${c3}. Max=${maxC[2]}.`};},
      (s)=>{return{q:`A feasible region is the:`,opts:shuffle(['Intersection (overlap) of all half-planes','Union of all half-planes','Area outside all constraints','Single corner point'],s+7),correct:'Intersection (overlap) of all half-planes',tip:`Each constraint gives a half-plane. The feasible region is where ALL constraints are satisfied simultaneously.`};},
    ];const t=T[n%T.length](n*79+23);return t;
  },
  li_wordprob:(n)=>{
    const T=[
      (s)=>{return{q:`"A student must study at least 3 hours" is written as:`,opts:shuffle(['t ≥ 3','t > 3','t ≤ 3','t < 3'],s),correct:'t ≥ 3',tip:`"At least" includes equality → ≥.`};},
      (s)=>{const b=srI(s+1,50,200)*5,p=srI(s+2,3,12);return{q:`Total cost of x items at $${p} each is at most $${b}. The constraint is:`,opts:shuffle([`${p}x ≤ ${b}`,`${p}x < ${b}`,`${p}x ≥ ${b}`,`x ≤ ${b}`],s+3),correct:`${p}x ≤ ${b}`,tip:`"At most" = ≤. Cost per item × quantity ≤ budget.`};},
      (s)=>{const cap=srI(s+4,20,50);return{q:`"Box A and Box B together hold fewer than ${cap} items" is:`,opts:shuffle([`A+B < ${cap}`,`A+B ≤ ${cap}`,`A+B > ${cap}`,`A+B ≥ ${cap}`],s+5),correct:`A+B < ${cap}`,tip:`"Fewer than" is strict < (does NOT include ${cap}).`};},
      (s)=>{return{q:`Non-negativity constraints x≥0, y≥0 are needed because:`,opts:shuffle(['Quantities cannot be negative in real contexts','The graph looks better','They are always given','Negative values give higher z'],s+6),correct:'Quantities cannot be negative in real contexts',tip:`Physical quantities (items, hours, etc.) are always ≥ 0. These are implicit constraints.`};},
    ];const t=T[n%T.length](n*83+29);return t;
  },
  li_absval:(n)=>{
    const T=[
      (s)=>{const c=srI(s,3,8),b=srI(s+1,0,4);const lo=-c-b,hi=c-b;return{q:`Solve |x+${b}| < ${c}. The solution is:`,opts:shuffle([`${lo} < x < ${hi}`,`x < ${lo} or x > ${hi}`,`x > ${-c} only`,`x < ${c} only`],s+2),correct:`${lo} < x < ${hi}`,tip:`|x+${b}|<${c} ↔ −${c} < x+${b} < ${c} ↔ ${lo} < x < ${hi}.`};},
      (s)=>{const a=srI(s+3,1,3),b=srI(s+4,1,5),c=srI(s+5,3,9);const lo=(-c-b),hi=(c-b);const loS=fmtF(lo,a),hiS=fmtF(hi,a);return{q:`|${a}x+${b}| > ${c}. The solution is:`,opts:shuffle([`x < ${loS} or x > ${hiS}`,`${loS} < x < ${hiS}`,`x > ${hiS} only`,`x < ${loS} only`],s+6),correct:`x < ${loS} or x > ${hiS}`,tip:`|f|>c gives TWO intervals: f<−c or f>c.`};},
      (s)=>{const a=srI(s+7,1,4);return{q:`|x−${a}| ≤ 3 means:`,opts:shuffle([`${a-3} ≤ x ≤ ${a+3}`,`x ≤ ${a-3} or x ≥ ${a+3}`,`−3 ≤ x ≤ 3`,`x ≤ −3 or x ≥ 3`],s+8),correct:`${a-3} ≤ x ≤ ${a+3}`,tip:`|x−${a}|≤3 means distance from ${a} is ≤ 3, so x ∈ [${a-3},${a+3}].`};},
      (s)=>{return{q:`|x| < −5 has how many solutions?`,opts:shuffle(['None (empty set)','Infinitely many','Exactly two','Exactly one'],s+9),correct:'None (empty set)',tip:`|x| ≥ 0 always. So |x| < negative is impossible → empty set.`};},
    ];const t=T[n%T.length](n*89+31);return t;
  },
  li_triangle:(n)=>{
    const T=[
      (s)=>{return{q:`The triangle inequality |a+b| ≤ |a|+|b| holds for:`,opts:shuffle(['All real a,b','Only positive a,b','Only when ab>0','Only integers'],s),correct:'All real a,b',tip:`|a+b|≤|a|+|b| is a universal identity. No conditions on a,b.`};},
      (s)=>{return{q:`|a+b|=|a|+|b| holds if and only if:`,opts:shuffle(['ab ≥ 0 (same sign or zero)','a=b','a+b=0','|a|=|b|'],s+1),correct:'ab ≥ 0 (same sign or zero)',tip:`Equality iff a and b point in the same direction, i.e., ab≥0.`};},
      (s)=>{const a=srI(s+2,-5,5)||1,b=srI(s+3,-5,5)||2;const lhs=Math.abs(a+b),rhs=Math.abs(a)+Math.abs(b);return{q:`|${a}+${b}| = ${lhs}. What is |${a}|+|${b}|?`,opts:shuffle([rhs,rhs-1,rhs+1,Math.abs(a-b)],s+4),correct:rhs,tip:`|${a}|=${Math.abs(a)}, |${b}|=${Math.abs(b)}, sum=${rhs}. TI: ${lhs}≤${rhs}.`};},
      (s)=>{return{q:`The REVERSE triangle inequality states: ||a|−|b|| ≤ ?`,opts:shuffle(['|a−b|','|a+b|','|a|+|b|','|a|·|b|'],s+5),correct:'|a−b|',tip:`Reverse TI: ||a|−|b||≤|a−b|. Useful for lower bounds.`};},
    ];const t=T[n%T.length](n*97+37);return t;
  },
  li_wavycurve:(n)=>{
    const T=[
      (s)=>{const r1=srI(s,0,3),r2=r1+srI(s+1,1,4);return{q:`Solve (x−${r1})(x−${r2}) > 0.`,opts:shuffle([`x<${r1} or x>${r2}`,`${r1}<x<${r2}`,`x<${r2} only`,`x>${r1} only`],s+2),correct:`x<${r1} or x>${r2}`,tip:`Product>0 when both factors same sign. Both neg: x<${r1}. Both pos: x>${r2}.`};},
      (s)=>{const r1=srI(s+3,-2,1),r2=r1+srI(s+4,2,5);return{q:`Solve (x−${r1})(x−${r2}) < 0.`,opts:shuffle([`${r1}<x<${r2}`,`x<${r1} or x>${r2}`,`x>${r2}`,`x<${r1}`],s+5),correct:`${r1}<x<${r2}`,tip:`Product<0 when factors have opposite signs. That's the interval between the roots.`};},
      (s)=>{const r1=srI(s+6,-2,1),r2=r1+srI(s+7,1,4);return{q:`Solve (x−${r1})/(x−${r2}) > 0 (x≠${r2}).`,opts:shuffle([`x<${r1} or x>${r2}`,`${r1}<x<${r2}`,`x>${r2} only`,`x<${r1} only`],s+8),correct:`x<${r1} or x>${r2}`,tip:`Same critical points as product. But x=${r2} is EXCLUDED (undefined).`};},
      (s)=>{const r=srI(s+9,0,4);return{q:`Solution of x²−${2*r}x+${r*r} > 0 (perfect square)?`,opts:shuffle([`x ≠ ${r} (all reals except ${r})`,`x > ${r}`,`x < ${r}`,`No solution`],s+10),correct:`x ≠ ${r} (all reals except ${r})`,tip:`(x−${r})²≥0 always, =0 only at x=${r}. So (x−${r})²>0 for x≠${r}.`};},
    ];const t=T[n%T.length](n*101+41);return t;
  },
  li_linprog:(n)=>{
    const T=[
      (s)=>{return{q:`In LP, the maximum of z=ax+by over a bounded feasible region always occurs at:`,opts:shuffle(['A corner (vertex) point','The midpoint of a boundary edge','The centroid of the region','An interior point'],s),correct:'A corner (vertex) point',tip:`Fundamental theorem: linear function over a convex polygon achieves max/min at a vertex.`};},
      (s)=>{const p=srI(s+1,1,5),q=srI(s+2,1,4);const corners=[[0,0,0],[4,0,4*p],[2,2,2*p+2*q],[0,3,3*q]];const maxC=corners.reduce((m,c)=>c[2]>m[2]?c:m,corners[0]);return{q:`z=${p}x+${q}y at corners (0,0),(4,0),(2,2),(0,3). Max z=?`,opts:shuffle([maxC[2],maxC[2]+1,maxC[2]-1,Math.max(4*p,3*q)-1].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+3),correct:maxC[2],tip:`z at each corner: (0,0)→0, (4,0)→${4*p}, (2,2)→${2*p+2*q}, (0,3)→${3*q}. Max=${maxC[2]}.`};},
      (s)=>{const c=srI(s+4,6,12);return{q:`Feasible region: x≥0,y≥0,x+y≤${c}. Maximize z=x+y. Max z=?`,opts:shuffle([c,c/2,2*c,c-1],s+5),correct:c,tip:`z=x+y is maximized at the corner farthest from origin on x+y=${c}: z=${c}.`};},
      (s)=>{return{q:`If the feasible region is unbounded, which statement is TRUE?`,opts:shuffle(['A minimum may exist even if maximum does not','Neither min nor max exists','Both min and max exist at infinity','The problem has no solution'],s+6),correct:'A minimum may exist even if maximum does not',tip:`For z=x+y with x,y≥0: no upper bound (unbounded region), but min=0 at (0,0).`};},
    ];const t=T[n%T.length](n*103+43);return t;
  },
  li_amgm:(n)=>{
    const T=[
      (s)=>{const k2s=[1,4,9,16,25];const k2=k2s[s%5];const k=Math.sqrt(k2);return{q:`Minimum of x+${k2}/x for x>0?`,opts:shuffle([2*k,k,k2,4*k].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+1),correct:2*k,tip:`AM-GM: x+${k2}/x ≥ 2√${k2}=${2*k}. Equality at x=${k}.`};},
      (s)=>{const sum=srI(s+2,4,10);return{q:`For a,b>0 with a+b=${sum}, maximum of ab is:`,opts:shuffle([(sum/2)**2,(sum/2)**2+1,(sum/2)**2-1,sum*sum].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+3),correct:(sum/2)**2,tip:`Max ab=(sum/2)²=${(sum/2)**2} by AM-GM. Achieved at a=b=${sum/2}.`};},
      (s)=>{return{q:`AM-GM equality a+b=2√(ab) holds if and only if:`,opts:shuffle(['a=b','a+b=0','ab=1','a>b'],s+4),correct:'a=b',tip:`AM=GM iff all terms are equal. Here: a=b.`};},
      (s)=>{const a=srI(s+5,1,5),b=srI(s+6,1,5);return{q:`AM of ${a} and ${b} is ${(a+b)/2}. GM is √${a*b}≈${Math.sqrt(a*b).toFixed(2)}. Which is larger?`,opts:shuffle([`AM=${(a+b)/2}`,`GM≈${Math.sqrt(a*b).toFixed(2)}`,`They are equal`,`Cannot compare`],s+7),correct:`AM=${(a+b)/2}`,tip:`AM≥GM always (for positive numbers). Equal only when a=b.`};},
    ];const t=T[n%T.length](n*107+47);return t;
  },
  li_cauchy:(n)=>{
    const T=[
      (s)=>{const a=srI(s,1,4),b=srI(s+1,1,4),c=srI(s+2,1,4),d=srI(s+3,1,4);const lhs=(a*c+b*d)**2,rhs=(a*a+b*b)*(c*c+d*d);return{q:`(${a}·${c}+${b}·${d})² ≤ (${a}²+${b}²)(${c}²+${d}²). LHS=?`,opts:shuffle([lhs,lhs+1,rhs,lhs-1].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+4),correct:lhs,tip:`LHS=(${a*c}+${b*d})²=${lhs}. RHS=${a*a+b*b}·${c*c+d*d}=${rhs}. LHS≤RHS ✓.`};},
      (s)=>{return{q:`Cauchy-Schwarz equality (a₁b₁+a₂b₂)²=(a₁²+a₂²)(b₁²+b₂²) holds iff:`,opts:shuffle(['a₁/a₂=b₁/b₂ (proportional)','a₁=a₂','b₁=b₂','a₁b₂=a₂b₁=0'],s+5),correct:'a₁/a₂=b₁/b₂ (proportional)',tip:`Equality in C-S iff the two vectors are proportional.`};},
      (s)=>{const a=srI(s+6,1,5),b=srI(s+7,1,5),x=srI(s+8,1,4),y=srI(s+9,1,4);return{q:`By Titu: ${a}²/${x}+${b}²/${y} ≥ (${a}+${b})²/(${x}+${y}) = ${(a+b)**2}/${x+y}. The bound equals:`,opts:shuffle([+((a+b)**2/(x+y)).toFixed(3),+((a+b)**2/(x+y)+1).toFixed(3),+(a**2/x+b**2/y).toFixed(3),+((a+b)/(x+y)).toFixed(3)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+10),correct:+((a+b)**2/(x+y)).toFixed(3),tip:`Titu: Σaᵢ²/bᵢ ≥ (Σaᵢ)²/Σbᵢ = ${(a+b)**2}/${x+y}.`};},
      (s)=>{const n_=srI(s+11,2,5);return{q:`By C-S with bᵢ=1: (a₁+⋯+a${n_})² ≤ ?`,opts:shuffle([`${n_}(a₁²+⋯+a${n_}²)`,`(a₁²+⋯+a${n_}²)`,`${n_}²(a₁²+⋯+a${n_}²)`,`${n_}(a₁+⋯+a${n_})²`],s+12),correct:`${n_}(a₁²+⋯+a${n_}²)`,tip:`C-S with all bᵢ=1: (Σaᵢ)² ≤ n·Σaᵢ². Classic power mean inequality.`};},
    ];const t=T[n%T.length](n*109+53);return t;
  },
  li_jensen:(n)=>{
    const T=[
      (s)=>{return{q:`For convex f, Jensen's says f(mean) is __ the mean of f values:`,opts:shuffle(['≤ (at most)','≥ (at least)','= (exactly)','Unrelated to'],s),correct:'≤ (at most)',tip:`Convex f: f(mean)≤mean of f. Concave: f(mean)≥mean of f.`};},
      (s)=>{return{q:`f(x)=x² is convex. Jensen: ((a+b)/2)² ≤ ?`,opts:shuffle(['(a²+b²)/2','(a+b)²/4','√(ab)','(a+b)/2'],s+1),correct:'(a²+b²)/2',tip:`f convex: f((a+b)/2)≤(f(a)+f(b))/2. Here: ((a+b)/2)²≤(a²+b²)/2.`};},
      (s)=>{const a=srI(s+2,1,4),b=srI(s+3,a+1,a+4);return{q:`√x is CONCAVE. Jensen says √((${a}+${b})/2) is:`,opts:shuffle([`≥ (√${a}+√${b})/2`,`≤ (√${a}+√${b})/2`,`= (√${a}+√${b})/2`,`Not related to √${a},√${b}`],s+4),correct:`≥ (√${a}+√${b})/2`,tip:`For CONCAVE f: f(mean)≥mean of f. So √((a+b)/2)≥(√a+√b)/2.`};},
      (s)=>{return{q:`In a triangle with angles A,B,C summing to π, by concavity of sin: sin A+sin B+sin C ≤ ?`,opts:shuffle(['3√3/2','3/2','3','√3'],s+5),correct:'3√3/2',tip:`sin is concave on [0,π]. Jensen: sin((A+B+C)/3)≥(sinA+sinB+sinC)/3 → sum≤3sin(π/3)=3√3/2.`};},
    ];const t=T[n%T.length](n*113+59);return t;
  },
  li_rearrange:(n)=>{
    const T=[
      (s)=>{const a=srI(s,1,3),b=a+srI(s+1,1,3),c=srI(s+2,1,3),d=c+srI(s+3,1,3);const maxV=a*c+b*d,minV=a*d+b*c;return{q:`a₁=${a}<a₂=${b}, b₁=${c}<b₂=${d}. Max of a₁bσ(1)+a₂bσ(2) is:`,opts:shuffle([maxV,minV,(a*c+b*c),(a*d+b*d)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+4),correct:maxV,tip:`Same order max: ${a}·${c}+${b}·${d}=${maxV}. Opposite order (min): ${a}·${d}+${b}·${c}=${minV}.`};},
      (s)=>{return{q:`Rearrangement Inequality: ∑aᵢbᵢ is MAXIMIZED when:`,opts:shuffle(['Both sequences sorted in the same order','Sequences sorted in opposite orders','One sequence is reversed','Sequences are interleaved'],s+5),correct:'Both sequences sorted in the same order',tip:`Same sort order (both ascending or both descending) maximizes the dot product.`};},
      (s)=>{const a=srI(s+6,1,5),b=srI(s+7,1,5);const lhs=a*a+b*b,rhs=a*b+b*a;return{q:`From rearrangement: a²+b² ≥ ab+ba = 2ab? Verify for a=${a},b=${b}.`,opts:shuffle([`YES: ${lhs}≥${rhs}`,`NO: ${lhs}<${rhs}`,`Only if a=b`,`Only if a>b`],s+8),correct:`YES: ${lhs}≥${rhs}`,tip:`a²+b²≥2ab ↔ (a−b)²≥0. Always true! This is rearrangement with a₁=a,a₂=b,b₁=a,b₂=b sorted same order.`};},
      (s)=>{const n_=srI(s+9,2,4);return{q:`Chebyshev's sum: if a₁≥⋯≥a${n_} and b₁≥⋯≥b${n_} (same order), then:`,opts:shuffle([`${n_}∑aᵢbᵢ ≥ (∑aᵢ)(∑bᵢ)`,`${n_}∑aᵢbᵢ ≤ (∑aᵢ)(∑bᵢ)`,`∑aᵢbᵢ = (∑aᵢ)(∑bᵢ)/${n_}`,`∑aᵢbᵢ ≥ n²`],s+10),correct:`${n_}∑aᵢbᵢ ≥ (∑aᵢ)(∑bᵢ)`,tip:`Chebyshev (same order): n∑aᵢbᵢ≥(∑aᵢ)(∑bᵢ). Reverses for opposite-order sequences.`};},
    ];const t=T[n%T.length](n*127+61);return t;
  },
  li_schur:(n)=>{
    const T=[
      (s)=>{return{q:`Schur's Inequality (t=1): a³+b³+c³+abc ≥ ab(a+b)+bc(b+c)+ca(c+a) holds for:`,opts:shuffle(['All non-negative a,b,c','Only a=b=c','Only a,b,c>0 with a+b+c=1','Only integers a,b,c'],s),correct:'All non-negative a,b,c',tip:`Schur's holds for all non-negative a,b,c and t≥0.`};},
      (s)=>{return{q:`In the Ravi substitution for triangle sides, a=y+z,b=z+x,c=x+y. What does this guarantee?`,opts:shuffle(['Triangle inequality a+b>c etc. automatically','a+b+c=1','a,b,c are integers','a=b=c'],s+1),correct:'Triangle inequality a+b>c etc. automatically',tip:`Ravi: a+b=(y+z)+(z+x)=y+2z+x>(x+y)=c for any x,y,z>0. All TI's hold!`};},
      (s)=>{const x=srI(s+2,1,4),y=srI(s+3,1,3),z=srI(s+4,1,3);const a=y+z,b=z+x,c=x+y;return{q:`Ravi: x=${x},y=${y},z=${z}. Then (a,b,c)=?`,opts:shuffle([`(${y+z},${z+x},${x+y})`,`(${x},${y},${z})`,`(${x+y},${y+z},${z+x})`,`(${x+y+z},${x+y},${y+z})`],s+5),correct:`(${y+z},${z+x},${x+y})`,tip:`a=y+z=${y}+${z}=${y+z}, b=z+x=${z}+${x}=${z+x}, c=x+y=${x}+${y}=${x+y}.`};},
      (s)=>{return{q:`Muirhead's: [2,1,0] ≻ [1,1,1] means (for a+b+c given):`,opts:shuffle(['∑sym a²b ≥ ∑sym abc = 6abc','∑sym a²b ≤ 6abc','∑sym a²b = 6abc always','Muirhead does not apply here'],s+6),correct:'∑sym a²b ≥ ∑sym abc = 6abc',tip:`[2,1,0] majorizes [1,1,1] (check: 2≥1, 2+1≥1+1, 2+1+0=1+1+1). So Σ a²b ≥ Σ abc.`};},
    ];const t=T[n%T.length](n*131+67);return t;
  },
  li_advanced:(n)=>{
    const T=[
      (s)=>{return{q:`"SOS" stands for what technique in inequality proofs?`,opts:shuffle(['Sum of Squares (non-negativity certificate)','Sum of Solutions','System of Substitutions','Sum of Symmetrics'],s),correct:'Sum of Squares (non-negativity certificate)',tip:`SOS: write f = λ₁s₁²+λ₂s₂²+⋯ with λᵢ≥0. This proves f≥0 automatically.`};},
      (s)=>{return{q:`x²+y²−xy as an SOS is:`,opts:shuffle(['(x−y/2)²+3y²/4','(x+y)²−2xy','(x−y)²+xy','(x/2−y/2)²'],s+1),correct:'(x−y/2)²+3y²/4',tip:`Complete square: x²−xy+y²/4+3y²/4=(x−y/2)²+3y²/4≥0.`};},
      (s)=>{const s_=srI(s+2,2,6);return{q:`Minimize x²+y² subject to x+y=${s_} via Lagrange. The minimum is:`,opts:shuffle([s_*s_/2,s_*s_/4,s_*s_,s_/2].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+3),correct:s_*s_/2,tip:`Lagrange gives x=y=${s_/2}. Min = 2·(${s_/2})²=${s_*s_/2}.`};},
      (s)=>{return{q:`In the UVW method, p=a+b+c, q=ab+bc+ca, r=abc. Fixing p and q, a symmetric inequality in a,b,c is minimized/maximized:`,opts:shuffle(['When r is at its extremes (a,b,c as equal as possible or one equal to another)','When r=0 always','When p=q=r','Only at a=b=c'],s+4),correct:'When r is at its extremes (a,b,c as equal as possible or one equal to another)',tip:`UVW: fix p,q and vary r. Extreme cases: a=b=c or two of them equal (e.g., b=c).`};},
    ];const t=T[n%T.length](n*137+71);return t;
  },
};

// ── Global Styles ──────────────────────────────────────────────
function useGlobalStyles() {
  useEffect(() => {
    _initKaTeX();
    const link=document.createElement('link');link.rel='stylesheet';
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
  },[]);
}

// ── Cover Screen ───────────────────────────────────────────────
function CoverScreen({ onNext }) {
  const [phase,setPhase]=useState(0);
  useEffect(()=>{const ts=[300,900,1600].map((d,i)=>setTimeout(()=>setPhase(i+1),d));return()=>ts.forEach(clearTimeout);},[]);
  const floaters=['a<b','AM≥GM','|x|≤r','ax+b>0','≤≥','Cauchy','SOS','Ravi'];
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',background:`radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.09) 0%, transparent 65%), #07090f`,textAlign:'center'}}>
      {floaters.map((s,i)=>(
        <div key={s} style={{position:'fixed',pointerEvents:'none',fontSize:14+(i%3)*7,color:`rgba(34,197,94,${0.04+(i%4)*0.02})`,top:`${8+i*11}%`,left:i%2===0?`${2+i*4}%`:`${74+i*2}%`,fontFamily:'JetBrains Mono,monospace',animation:`pulse ${3+i*0.6}s ease-in-out infinite`,animationDelay:`${i*0.25}s`}}>{s}</div>
      ))}
      <div style={{opacity:phase>=1?1:0,transform:phase>=1?'translateY(0)':'translateY(12px)',transition:'all 0.6s ease',marginBottom:20,display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:40}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:ACCENT,animation:'pulse 2s ease-in-out infinite'}}/>
        <span style={{fontSize:12,color:ACCENT,letterSpacing:'2px',textTransform:'uppercase',fontFamily:'Crimson Pro, serif'}}>Mathematics · Chapter 6</span>
      </div>
      <div style={{opacity:phase>=2?1:0,transform:phase>=2?'translateY(0)':'translateY(20px)',transition:'all 0.7s ease 0.1s',marginBottom:28}}>
        <h1 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:'clamp(32px, 10vw, 84px)',color:'#fff',letterSpacing:'-3px',lineHeight:0.92,marginBottom:0}}>
          Linear<br/><span style={{color:ACCENT}}>Inequalities</span>
        </h1>
        <div style={{height:3,width:80,background:`linear-gradient(90deg, ${ACCENT}, transparent)`,margin:'16px auto 0',borderRadius:2}}/>
      </div>
      <div style={{opacity:phase>=3?1:0,transition:'all 0.6s ease',maxWidth:560,marginBottom:40}}>
        <p style={{fontFamily:'Crimson Pro, serif',fontSize:19,color:'rgba(255,255,255,0.7)',lineHeight:1.55,marginBottom:18,fontStyle:'italic'}}>
          "An inequality is more interesting than an equality — it tells you not just where something is, but where it can and cannot be."
        </p>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 24px',textAlign:'left'}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:12,fontFamily:'JetBrains Mono, monospace'}}>Chapter Overview</div>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:'rgba(255,255,255,0.6)',lineHeight:1.75}}>
            From basic notation and the critical sign-flip rule through one- and two-variable inequalities, feasible regions, and LP — to pre-Olympiad absolute value, triangle inequality, and wavy curve methods — culminating in the full Olympiad toolkit: AM-GM-HM, Cauchy-Schwarz, Jensen's, Rearrangement, Chebyshev, Schur's, Ravi substitution, SOS, UVW, and Lagrange multipliers.
          </p>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginTop:20}}>
          {['Class 10 → Olympiad','15 Topics','∞ Practice','Quiz-Gated Progress'].map(t=>(
            <span key={t} style={{padding:'4px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,fontSize:12,color:'rgba(255,255,255,0.5)',fontFamily:'Crimson Pro, serif'}}>{t}</span>
          ))}
        </div>
      </div>
      {phase>=3&&<button onClick={onNext} className="btn" style={{padding:'16px 48px',background:ACCENT,color:'#fff',border:'none',borderRadius:50,fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:17,letterSpacing:'-0.3px',boxShadow:`0 8px 30px ${ACCENT}55`,animation:'fadeUp 0.5s ease both'}}>Begin Chapter →</button>}
    </div>
  );
}

// ── Notation Screen ────────────────────────────────────────────
function NotationScreen({ onNext }) {
  const [revealed,setRevealed]=useState(false);
  useEffect(()=>{setTimeout(()=>setRevealed(true),100);},[]);
  const groups=[
    {title:'Inequality Symbols & Intervals',color:ACCENT,rows:NOTATION.slice(0,8)},
    {title:'Absolute Value & Two-Variable',color:'#4ADE80',rows:NOTATION.slice(8,12)},
    {title:'Classical Inequalities',color:'#F59E0B',rows:NOTATION.slice(12,17)},
    {title:'Olympiad Techniques',color:'#A855F7',rows:NOTATION.slice(17)},
  ];
  return (
    <div style={{minHeight:'100vh',background:'#07090f',padding:'32px 16px 60px'}}>
      <div style={{maxWidth:680,margin:'0 auto'}}>
        <div style={{marginBottom:32,opacity:revealed?1:0,transition:'opacity 0.5s ease'}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'2px',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>Before We Begin</div>
          <h2 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:34,color:'#fff',letterSpacing:'-1px',marginBottom:10}}>Notation Guide</h2>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>These symbols span the full range — from basic {'<'} and ≥ to Cauchy-Schwarz, Jensen&apos;s, Ravi substitution, and SOS proofs used in IMO competitions.</p>
        </div>
        {groups.map((g,gi)=>(
          <div key={g.title} style={{marginBottom:24,opacity:revealed?1:0,transform:revealed?'translateY(0)':'translateY(16px)',transition:`all 0.5s ease ${gi*0.1+0.2}s`}}>
            <div style={{fontSize:11,color:g.color,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:20,height:2,background:g.color,borderRadius:1}}/>{g.title}
            </div>
            <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden'}}>
              {g.rows.map((row,ri)=>(
                <div key={ri} style={{display:'grid',gridTemplateColumns:'110px 1fr 1fr',borderBottom:ri<g.rows.length-1?'1px solid rgba(255,255,255,0.05)':'none',padding:'10px 16px',alignItems:'center',gap:8}}>
                  <div style={{color:g.color,overflowX:'auto'}}><KTex l={row.sym}/></div>
                  <div><div style={{fontFamily:'Crimson Pro,serif',fontWeight:600,fontSize:13,color:'#fff',marginBottom:2}}>{row.name}</div><div style={{fontFamily:'Crimson Pro,serif',fontSize:12,color:'rgba(255,255,255,0.4)',fontStyle:'italic'}}>{row.meaning}</div></div>
                  <div style={{overflowX:'auto'}}><KTex l={row.ex} style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}/></div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{background:`linear-gradient(135deg,${ACCENT}10,${ACCENT}05)`,border:`1px solid ${ACCENT}25`,borderRadius:14,padding:'16px 20px',marginBottom:28}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>Quiz-Gated Progress</div>
          <p style={{fontFamily:'Crimson Pro,serif',fontSize:14,color:'rgba(255,255,255,0.55)',lineHeight:1.6}}>When you click <strong style={{color:'#fff'}}>Done</strong> on any topic, you'll face <strong style={{color:ACCENT}}>4 tough questions</strong>. Answer all 4 correctly to unlock the next topic. Wrong answer? Review and retry — mastery is required to advance.</p>
        </div>
        <button onClick={onNext} className="btn" style={{width:'100%',padding:'16px',background:ACCENT,color:'#fff',border:'none',borderRadius:12,fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:17,boxShadow:`0 6px 24px ${ACCENT}44`}}>Start Learning →</button>
      </div>
    </div>
  );
}

// ── Section Menu ───────────────────────────────────────────────
function SectionMenuScreen({ onSelect, completedIds }) {
  const levels=['Foundation','JEE','Olympiad'];
  const lColors={Foundation:'#22C55E',JEE:'#F59E0B',Olympiad:'#A855F7'};
  const lDesc={Foundation:'Class 10–11 · Core concepts',JEE:'JEE Mains & Advanced',Olympiad:'RMO · INMO · IMO'};
  return (
    <div style={{minHeight:'100vh',background:'#07090f',padding:'28px 16px 60px'}}>
      <div style={{maxWidth:660,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'2px',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>Chapter · Linear Inequalities</div>
          <h2 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:30,color:'#fff',letterSpacing:'-0.8px',marginBottom:6}}>Choose a Topic</h2>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:15,color:'rgba(255,255,255,0.4)',marginBottom:14}}>Pass the quiz gate to unlock each next topic.</p>
          <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:4,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(completedIds.size/SECTIONS.length)*100}%`,background:`linear-gradient(90deg,${ACCENT},#A855F7)`,borderRadius:4,transition:'width 0.5s ease'}}/>
          </div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',marginTop:6,textAlign:'right'}}>{completedIds.size}/{SECTIONS.length} completed</div>
        </div>
        {levels.map(level=>(
          <div key={level} style={{marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:lColors[level]}}/>
              <span style={{fontSize:13,color:lColors[level],fontWeight:600,fontFamily:'Crimson Pro, serif',textTransform:'uppercase',letterSpacing:'1px'}}>{level}</span>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.3)',fontFamily:'Crimson Pro, serif'}}>— {lDesc[level]}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {SECTIONS.filter(s=>s.level===level).map((sec)=>{
                const done=completedIds.has(sec.id);
                const secIdx=SECTIONS.indexOf(sec);
                const locked=secIdx>0&&!completedIds.has(SECTIONS[secIdx-1].id);
                return (
                  <button key={sec.id} onClick={()=>!locked&&onSelect(sec)} className={locked?'':'btn'}
                    style={{background:done?`${lColors[level]}12`:locked?'rgba(255,255,255,0.015)':'rgba(255,255,255,0.025)',border:`1px solid ${done?lColors[level]+'44':locked?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.08)'}`,borderRadius:12,padding:'14px 18px',textAlign:'left',display:'flex',alignItems:'center',gap:14,opacity:locked?0.5:1,cursor:locked?'default':'pointer'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:done?`${lColors[level]}25`:locked?'rgba(255,255,255,0.05)':`${lColors[level]}15`,border:`1px solid ${done?lColors[level]+'55':locked?'rgba(255,255,255,0.08)':`${lColors[level]}30`}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:locked?20:14,color:done?lColors[level]:locked?'rgba(255,255,255,0.2)':lColors[level],fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>
                      {done?'✓':locked?'🔒':sec.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:15,color:done?lColors[level]:locked?'rgba(255,255,255,0.3)':'#fff',marginBottom:2}}>{sec.title}</div>
                      <div style={{fontFamily:'Crimson Pro, serif',fontSize:13,color:locked?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.4)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{locked?'Complete previous topic to unlock':sec.shortDef}</div>
                    </div>
                    <div style={{fontSize:16,color:locked?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.2)',flexShrink:0}}>{locked?'🔒':'→'}</div>
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
  const [tab,setTab]=useState('learn');
  const lColors={Foundation:'#22C55E',JEE:'#F59E0B',Olympiad:'#A855F7'};
  const col=lColors[section.level]||ACCENT;
  return (
    <div style={{minHeight:'100vh',background:'#07090f',paddingBottom:80}}>
      <div style={{position:'sticky',top:0,zIndex:30,background:'rgba(7,9,15,0.96)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onBack} className="btn" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',borderRadius:8,padding:'6px 13px',fontSize:13}}>← Topics</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:15,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{section.title}</div>
          <div style={{fontSize:11,color:col,fontFamily:'JetBrains Mono,monospace'}}>{section.level}</div>
        </div>
      </div>
      <div style={{maxWidth:660,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{display:'flex',gap:4,marginBottom:24,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:4}}>
          {['learn','keys'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="btn" style={{flex:1,padding:'9px',borderRadius:8,border:'none',background:tab===t?col:'transparent',color:tab===t?'#fff':'rgba(255,255,255,0.5)',fontFamily:'Crimson Pro, serif',fontWeight:600,fontSize:14}}>
              {t==='learn'?'📖 Explanation':'🔑 Key Facts'}
            </button>
          ))}
        </div>
        {tab==='learn'&&(
          <div className="fade-in">
            <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:22}}>
              <div style={{width:56,height:56,borderRadius:14,background:`${col}15`,border:`1px solid ${col}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:col,fontFamily:'JetBrains Mono,monospace',flexShrink:0,letterSpacing:'-1px'}}>{section.icon}</div>
              <p style={{fontFamily:'Playfair Display, serif',fontSize:18,color:'#fff',fontStyle:'italic',lineHeight:1.5}}>"{section.shortDef}"</p>
            </div>
            {section.diagram==='numberline'&&(
              <div style={{marginBottom:22,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:16,overflowX:'auto'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',textAlign:'center',marginBottom:10,textTransform:'uppercase',letterSpacing:'1px'}}>Example: Solution Set on Number Line</div>
                <NumberLineSVG a={2} strict={true} right={true} color={col} size={320}/>
                <div style={{height:12}}/>
                <NumberLineSVG a={-1} strict={false} right={false} color={col} size={320}/>
              </div>
            )}
            {section.diagram==='halfplane'&&(
              <div style={{marginBottom:22,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:16}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',textAlign:'center',marginBottom:10,textTransform:'uppercase',letterSpacing:'1px'}}>Example: Half-Plane for x+y ≤ 4</div>
                <HalfPlaneSVG a={1} b={1} c={4} above={false} color={col} size={320}/>
              </div>
            )}
            <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'20px 22px'}}>
              <div style={{fontSize:10,color:col,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>Full Explanation</div>
              <p style={{fontFamily:'Crimson Pro, serif',fontSize:17,color:'rgba(255,255,255,0.75)',lineHeight:1.8}}>{section.fullDef}</p>
            </div>
          </div>
        )}
        {tab==='keys'&&(
          <div className="fade-in">
            {section.keyFacts.map((fact,i)=>(
              <div key={i} style={{display:'flex',gap:12,marginBottom:14,alignItems:'flex-start',animation:`fadeUp 0.4s ease ${i*0.07}s both`}}>
                <div style={{width:26,height:26,borderRadius:8,background:`${col}18`,border:`1px solid ${col}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:col,fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'Crimson Pro, serif',fontSize:14,color:'rgba(255,255,255,0.55)',marginBottom:4}}>{fact.text}</div>
                  <div style={{background:`${col}0d`,border:`1px solid ${col}22`,borderRadius:8,padding:'8px 12px',overflowX:'auto'}}>
                    <KTex l={fact.l} style={{color:col,fontSize:15}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:32,position:'sticky',bottom:24}}>
          <button onClick={onPractice} className="btn" style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${col},${col}bb)`,color:'#fff',border:'none',borderRadius:12,fontFamily:'Playfair Display, serif',fontWeight:700,fontSize:17,boxShadow:`0 6px 24px ${col}44`}}>
            ⚡ Practice Questions →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Practice Screen ────────────────────────────────────────────
function PracticeScreen({ section, onBack, onStartQuiz }) {
  const [qIdx,setQIdx]=useState(0);
  const [baseSeed]=useState(()=>Math.floor(Math.random()*9999));
  const [showAnswer,setShowAnswer]=useState(false);
  const [showSteps,setShowSteps]=useState(false);
  const [count,setCount]=useState(0);
  const lColors={Foundation:'#22C55E',JEE:'#F59E0B',Olympiad:'#A855F7'};
  const col=lColors[section.level]||ACCENT;
  const gen=GENERATORS[section.genKey]||GENERATORS.li_notation;
  const seed=baseSeed+qIdx*97;
  const question=useCallback(()=>{try{return gen(seed);}catch{return{question:'Loading…',steps:[],answer:'—',answerLatex:'—',tip:''};}},[seed])();
  const next=()=>{setQIdx(i=>i+1);setShowAnswer(false);setShowSteps(false);setCount(c=>c+1);};
  return (
    <div style={{minHeight:'100vh',background:'#07090f',paddingBottom:80}}>
      <div style={{position:'sticky',top:0,zIndex:30,background:'rgba(7,9,15,0.96)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <button onClick={onBack} className="btn" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',borderRadius:8,padding:'6px 13px',fontSize:13}}>← Learn</button>
          <div style={{flex:1,fontFamily:'Playfair Display, serif',fontSize:14,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{section.title}</div>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:col,background:`${col}15`,padding:'4px 10px',borderRadius:20,flexShrink:0}}>Q {count+1}</div>
          <button onClick={onStartQuiz} className="btn" style={{background:`${col}20`,border:`1px solid ${col}55`,color:col,borderRadius:8,padding:'6px 13px',fontSize:13,fontWeight:700,flexShrink:0}}>Done → Quiz ✓</button>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'Crimson Pro,serif',fontStyle:'italic'}}>Infinite practice · Click "Done → Quiz" when ready to unlock next topic</div>
      </div>
      <div style={{maxWidth:660,margin:'0 auto',padding:'24px 16px'}}>
        <div key={qIdx} className="fade-up" style={{background:'rgba(255,255,255,0.025)',border:`1px solid ${col}30`,borderRadius:16,overflow:'hidden',marginBottom:18}}>
          <div style={{background:`${col}10`,borderBottom:`1px solid ${col}20`,padding:'10px 18px',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:col,animation:'pulse 2s ease-in-out infinite'}}/>
            <span style={{fontSize:11,color:col,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace'}}>Practice · {section.level}</span>
          </div>
          <div style={{padding:'20px 20px 22px'}}>
            <p style={{fontFamily:'Crimson Pro, serif',fontSize:17,color:'#e2e8f0',lineHeight:1.75,marginBottom:12}}>{question.question}</p>
            {question.questionLatex&&(
              <div style={{background:`${col}0d`,border:`1px solid ${col}20`,borderRadius:10,padding:'12px 16px',overflowX:'auto'}}>
                <KTex l={question.questionLatex} style={{color:col,fontSize:15}}/>
              </div>
            )}
          </div>
        </div>
        {!showAnswer&&(
          <div style={{display:'flex',gap:10,marginBottom:14}}>
            <button onClick={()=>setShowSteps(v=>!v)} className="btn" style={{flex:1,padding:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.7)',fontFamily:'Crimson Pro,serif',fontSize:15}}>
              {showSteps?'🙈 Hide Steps':'💡 Show Steps'}
            </button>
            <button onClick={()=>setShowAnswer(true)} className="btn" style={{flex:1,padding:'12px',background:`${col}20`,border:`1px solid ${col}44`,borderRadius:10,color:col,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15}}>Reveal ▶</button>
          </div>
        )}
        {showSteps&&!showAnswer&&(
          <div className="fade-up" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'16px 18px',marginBottom:14}}>
            {question.steps.map((step,i)=>(
              <div key={i} style={{display:'flex',gap:10,marginBottom:i<question.steps.length-1?10:0}}>
                <span style={{color:`${col}77`,fontSize:11,fontFamily:'JetBrains Mono,monospace',minWidth:20,paddingTop:2}}>{i+1}.</span>
                <span style={{fontFamily:'Crimson Pro,serif',fontSize:15,color:'rgba(255,255,255,0.65)',lineHeight:1.6}}>{step}</span>
              </div>
            ))}
          </div>
        )}
        {showAnswer&&(
          <div className="fade-up">
            <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'16px 18px',marginBottom:14}}>
              {question.steps.map((step,i)=>(
                <div key={i} style={{display:'flex',gap:10,marginBottom:i<question.steps.length-1?10:0}}>
                  <span style={{color:`${col}77`,fontSize:11,fontFamily:'JetBrains Mono,monospace',minWidth:20,paddingTop:2}}>{i+1}.</span>
                  <span style={{fontFamily:'Crimson Pro,serif',fontSize:15,color:'rgba(255,255,255,0.7)',lineHeight:1.6}}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{background:`linear-gradient(135deg,${col}18,${col}08)`,border:`1px solid ${col}44`,borderRadius:14,padding:'16px 20px',marginBottom:14,textAlign:'center'}}>
              <div style={{fontSize:10,color:`${col}99`,textTransform:'uppercase',letterSpacing:'1.2px',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>Answer</div>
              <KTex l={question.answerLatex||question.answer} style={{color:col,fontSize:16}}/>
            </div>
            {question.tip&&(
              <div style={{background:'rgba(255,209,102,0.06)',border:'1px solid rgba(255,209,102,0.2)',borderRadius:12,padding:'12px 16px',marginBottom:20,display:'flex',gap:10}}>
                <span style={{fontSize:16,flexShrink:0}}>💡</span>
                <p style={{fontFamily:'Crimson Pro,serif',fontStyle:'italic',fontSize:14,color:'rgba(255,209,102,0.85)',lineHeight:1.6}}>{question.tip}</p>
              </div>
            )}
            <button onClick={next} className="btn" style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${col},${col}bb)`,color:'#fff',border:'none',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,boxShadow:`0 6px 24px ${col}40`}}>
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
  const lColors={Foundation:'#22C55E',JEE:'#F59E0B',Olympiad:'#A855F7'};
  const col=lColors[section.level]||ACCENT;
  const [baseSeed]=useState(()=>Math.floor(Math.random()*7777));
  const TOTAL=4;
  const [qIdx,setQIdx]=useState(0);
  const [selected,setSelected]=useState(null);
  const [confirmed,setConfirmed]=useState(false);
  const [score,setScore]=useState(0);
  const [shakeKey,setShakeKey]=useState(0);
  const [results,setResults]=useState([]);
  const [finished,setFinished]=useState(false);
  const quizGen=QUIZ_GENERATORS[section.genKey]||QUIZ_GENERATORS.li_notation;
  const qSeed=baseSeed+qIdx*113;
  const question=useCallback(()=>{
    let q;let tries=0;
    do{try{q=quizGen(qSeed+tries*7);}catch{q=null;}tries++;}while((!q||!q.q||q.opts.length<2)&&tries<10);
    if(!q||!q.q)return{q:`Which symbol means "at most"?`,opts:['≤','≥','<','>'],correct:'≤',tip:'At most → ≤ (includes equality).'};
    return q;
  },[qSeed])();
  const opts=question.opts.slice(0,4);
  const correctAnswer=question.correct;
  const confirm=()=>{
    if(selected===null)return;
    const isCorrect=String(selected)===String(correctAnswer);
    setConfirmed(true);
    if(isCorrect)setScore(s=>s+1);
    else setShakeKey(k=>k+1);
    setResults(r=>[...r,{correct:isCorrect,question:question.q}]);
  };
  const goNext=()=>{
    if(qIdx+1>=TOTAL){setFinished(true);}
    else{setQIdx(i=>i+1);setSelected(null);setConfirmed(false);}
  };
  if(finished){
    const passed=score===TOTAL;
    return (
      <div style={{minHeight:'100vh',background:'#07090f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 20px',textAlign:'center'}}>
        <div className="pop-in" style={{maxWidth:420,width:'100%'}}>
          {passed?<TrophySVG col={col}/>:(
            <svg width="72" height="72" viewBox="0 0 72 72" style={{display:'block',margin:'0 auto'}}>
              <defs><radialGradient id="failG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EF4444" stopOpacity="0.25"/><stop offset="100%" stopColor="#EF4444" stopOpacity="0"/></radialGradient></defs>
              <circle cx="36" cy="36" r="36" fill="url(#failG)"/>
              <circle cx="36" cy="36" r="28" fill="none" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.4"/>
              <text x="36" y="44" textAnchor="middle" fontSize="32" fontFamily="JetBrains Mono" fill="#EF4444">✗</text>
            </svg>
          )}
          <div style={{marginTop:20,fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:28,color:passed?'#fff':'#EF4444',marginBottom:10}}>
            {passed?'Topic Mastered! 🎯':`${score}/4 Correct`}
          </div>
          <div style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:'rgba(255,255,255,0.55)',marginBottom:24,lineHeight:1.6}}>
            {passed?`Perfect score! You've mastered "${section.title}". Advancing to the next topic.`:`You got ${score} out of ${TOTAL}. Need all 4 to advance. Review and retry.`}
          </div>
          {results.map((r,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:r.correct?'rgba(52,211,153,0.08)':'rgba(239,68,68,0.08)',border:`1px solid ${r.correct?'rgba(52,211,153,0.2)':'rgba(239,68,68,0.2)'}`,borderRadius:8,marginBottom:6,textAlign:'left'}}>
              <span style={{fontSize:16}}>{r.correct?'✅':'❌'}</span>
              <span style={{fontFamily:'Crimson Pro,serif',fontSize:13,color:'rgba(255,255,255,0.6)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Q{i+1}: {r.question.substring(0,60)}{r.question.length>60?'…':''}</span>
            </div>
          ))}
          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:20}}>
            {passed?(
              <button onClick={onPass} className="btn" style={{padding:'14px',background:`linear-gradient(135deg,${col},${col}bb)`,color:'#fff',border:'none',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16}}>
                Continue to Next Topic →
              </button>
            ):(
              <button onClick={onFail} className="btn" style={{padding:'14px',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#FCA5A5',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16}}>
                Review Topic & Retry
              </button>
            )}
            <button onClick={onBack} className="btn" style={{padding:'12px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.6)',borderRadius:12,fontFamily:'Crimson Pro,serif',fontSize:15}}>
              ← Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{minHeight:'100vh',background:'#07090f',paddingBottom:60}}>
      <div style={{position:'sticky',top:0,zIndex:30,background:'rgba(7,9,15,0.96)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <button onClick={onBack} className="btn" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',borderRadius:8,padding:'6px 13px',fontSize:13}}>✕ Exit Quiz</button>
          <div style={{flex:1,fontFamily:'Playfair Display,serif',fontSize:15,color:'#fff',fontWeight:700}}>Mastery Quiz: {section.title}</div>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:13,color:col}}>{qIdx+1}/{TOTAL}</div>
        </div>
        <div style={{display:'flex',gap:6,justifyContent:'center'}}>
          {Array.from({length:TOTAL},(_,i)=>(
            <div key={i} style={{width:i===qIdx?28:10,height:10,borderRadius:5,background:i<qIdx?col:i===qIdx?col:'rgba(255,255,255,0.12)',transition:'all 0.3s ease',opacity:i<=qIdx?1:0.5}}/>
          ))}
        </div>
      </div>
      <div style={{maxWidth:600,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{background:`${col}10`,border:`1px solid ${col}30`,borderRadius:10,padding:'8px 14px',marginBottom:18,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16}}>🔐</span>
          <span style={{fontFamily:'Crimson Pro,serif',fontSize:13,color:col,fontStyle:'italic'}}>Answer all {TOTAL} correctly to unlock the next topic. All questions are required.</span>
        </div>
        <div key={qIdx} className="fade-up" style={{background:'rgba(255,255,255,0.025)',border:`1px solid ${col}30`,borderRadius:16,padding:'20px 20px 24px',marginBottom:18}}>
          <div style={{fontSize:10,color:`${col}99`,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:12}}>Question {qIdx+1} of {TOTAL}</div>
          <p style={{fontFamily:'Crimson Pro,serif',fontSize:17,color:'#e2e8f0',lineHeight:1.75,marginBottom:question.questionLatex?14:0}}>{question.q}</p>
          {question.questionLatex&&question.questionLatex!==question.q&&(
            <div style={{background:`${col}0d`,border:`1px solid ${col}20`,borderRadius:10,padding:'10px 14px',overflowX:'auto'}}>
              <KTex l={question.questionLatex} style={{color:col,fontSize:15}}/>
            </div>
          )}
        </div>
        <div key={`opts-${shakeKey}`} style={{display:'flex',flexDirection:'column',gap:10,marginBottom:18}} className={confirmed&&selected!==null&&String(selected)!==String(correctAnswer)?'shake':''}>
          {opts.map((opt,i)=>{
            const isSelected=String(selected)===String(opt);
            const isCorrect=String(opt)===String(correctAnswer);
            let bg='rgba(255,255,255,0.04)',border='1px solid rgba(255,255,255,0.1)',color='rgba(255,255,255,0.8)';
            if(confirmed){
              if(isCorrect){bg='rgba(52,211,153,0.12)';border='1px solid rgba(52,211,153,0.5)';color='#34D399';}
              else if(isSelected&&!isCorrect){bg='rgba(239,68,68,0.12)';border='1px solid rgba(239,68,68,0.5)';color='#FCA5A5';}
            }else if(isSelected){bg=`${col}18`;border=`1px solid ${col}66`;color=col;}
            return (
              <button key={i} onClick={()=>!confirmed&&setSelected(opt)} className={!confirmed?'btn':''} disabled={confirmed}
                style={{background:bg,border,borderRadius:12,padding:'14px 18px',textAlign:'left',color,fontFamily:'Crimson Pro,serif',fontSize:16,display:'flex',alignItems:'center',gap:12,cursor:confirmed?'default':'pointer',transition:'all 0.15s ease'}}>
                <div style={{width:28,height:28,borderRadius:8,background:isSelected&&!confirmed?`${col}25`:confirmed&&isCorrect?'rgba(52,211,153,0.2)':confirmed&&isSelected?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)',border:`1px solid ${isSelected&&!confirmed?col+'66':confirmed&&isCorrect?'rgba(52,211,153,0.5)':confirmed&&isSelected?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontFamily:'JetBrains Mono,monospace',flexShrink:0,color:isSelected&&!confirmed?col:confirmed&&isCorrect?'#34D399':confirmed&&isSelected?'#FCA5A5':'rgba(255,255,255,0.4)'}}>
                  {confirmed?(isCorrect?'✓':isSelected?'✗':['A','B','C','D'][i]):['A','B','C','D'][i]}
                </div>
                <span>{String(opt)}</span>
              </button>
            );
          })}
        </div>
        {confirmed&&question.tip&&(
          <div className="fade-up" style={{background:'rgba(255,209,102,0.06)',border:'1px solid rgba(255,209,102,0.2)',borderRadius:12,padding:'12px 16px',marginBottom:16,display:'flex',gap:10}}>
            <span style={{fontSize:16,flexShrink:0}}>💡</span>
            <p style={{fontFamily:'Crimson Pro,serif',fontStyle:'italic',fontSize:14,color:'rgba(255,209,102,0.85)',lineHeight:1.6}}>{question.tip}</p>
          </div>
        )}
        {!confirmed?(
          <button onClick={confirm} disabled={selected===null} className="btn" style={{width:'100%',padding:'14px',background:selected!==null?`linear-gradient(135deg,${col},${col}bb)`:'rgba(255,255,255,0.06)',border:selected!==null?'none':'1px solid rgba(255,255,255,0.1)',color:selected!==null?'#fff':'rgba(255,255,255,0.3)',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16,opacity:selected===null?0.6:1,cursor:selected===null?'not-allowed':'pointer'}}>
            Submit Answer
          </button>
        ):(
          <button onClick={goNext} className="btn" style={{width:'100%',padding:'14px',background:`linear-gradient(135deg,${col},${col}bb)`,color:'#fff',border:'none',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16}}>
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
  const [screen,setScreen]=useState('cover');
  const [activeIdx,setActiveIdx]=useState(0);
  const [completedIds,setCompletedIds]=useState(new Set());
  const activeSection=SECTIONS[activeIdx];
  const nextSection=SECTIONS[activeIdx+1]||null;
  const handlePass=()=>{setCompletedIds(prev=>new Set([...prev,activeSection.id]));if(nextSection){setActiveIdx(activeIdx+1);setScreen('learn');}else setScreen('menu');};
  const handleFail=()=>{setScreen('learn');};
  if(screen==='cover')    return <CoverScreen onNext={()=>setScreen('notation')}/>;
  if(screen==='notation') return <NotationScreen onNext={()=>setScreen('menu')}/>;
  if(screen==='menu')     return <SectionMenuScreen completedIds={completedIds} onSelect={sec=>{setActiveIdx(SECTIONS.indexOf(sec));setScreen('learn');}}/>;
  if(screen==='learn')    return <SectionLearnScreen section={activeSection} onBack={()=>setScreen('menu')} onPractice={()=>setScreen('practice')}/>;
  if(screen==='practice') return <PracticeScreen section={activeSection} onBack={()=>setScreen('learn')} onStartQuiz={()=>setScreen('quiz')}/>;
  if(screen==='quiz')     return <QuizScreen section={activeSection} onPass={handlePass} onFail={handleFail} onBack={()=>setScreen('menu')}/>;
  return <CoverScreen onNext={()=>setScreen('notation')}/>;
}

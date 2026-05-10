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
const ACCENT = '#6366F1';  // Indigo accent for Straight Lines

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

// ── SVG Diagrams for Straight Lines ───────────────────────────
function CoordPlaneSVG({ color=ACCENT, size=300 }) {
  const W=size, H=size*0.7;
  const ox=40, oy=H-20, maxX=W-20, maxY=20;
  const pointX = ox+srI(3,60,160), pointY = oy-srI(5,40,130);
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto'}}>
      {/* Axes */}
      <line x1={ox} y1={oy} x2={maxX} y2={oy} stroke={`${color}66`} strokeWidth={1.2}/>
      <line x1={ox} y1={oy} x2={ox} y2={maxY} stroke={`${color}66`} strokeWidth={1.2}/>
      <text x={maxX+4} y={oy+4} fill={color} fontSize={11} fontFamily="JetBrains Mono">x</text>
      <text x={ox-12} y={maxY-6} fill={color} fontSize={11} fontFamily="JetBrains Mono">y</text>
      {/* Grid */}
      {[80,120,160,200,240].map(x=> <line key={'gx'+x} x1={ox+x} y1={oy-2} x2={ox+x} y2={maxY+2} stroke={`${color}22`} strokeWidth={0.5}/>)}
      {[50,90,130,170,210].map(y=> <line key={'gy'+y} x1={ox-2} y1={oy-y} x2={maxX+2} y2={oy-y} stroke={`${color}22`} strokeWidth={0.5}/>)}
      {/* Point */}
      <circle cx={pointX} cy={pointY} r={4} fill={color} stroke="#fff" strokeWidth={1.5}/>
      <text x={pointX+6} y={pointY-8} fill={color} fontSize={12} fontFamily="JetBrains Mono">P(x₁,y₁)</text>
    </svg>
  );
}

function LineSlopeSVG({ color=ACCENT, size=300 }) {
  const W=size, H=size*0.5;
  const x1=60, y1=H-50, x2=W-50, y2=30;
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto'}}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5}/>
      <line x1={x1} y1={y1} x2={x2} y2={y1} stroke={`${color}44`} strokeWidth={1} strokeDasharray="4,3"/>
      <line x1={x2} y1={y1} x2={x2} y2={y2} stroke={`${color}44`} strokeWidth={1} strokeDasharray="4,3"/>
      <text x={(x1+x2)/2-8} y={y1-8} fill={`${color}cc`} fontSize={13} fontFamily="JetBrains Mono">Δx</text>
      <text x={x2+6} y={(y1+y2)/2} fill={`${color}cc`} fontSize={13} fontFamily="JetBrains Mono">Δy</text>
      <text x={W/2} y={y2-5} textAnchor="middle" fill="#fff" fontSize={15} fontFamily="JetBrains Mono" fontWeight="bold">θ</text>
      <text x={(x1+x2)/2} y={y1+25} textAnchor="middle" fill={color} fontSize={12} fontFamily="Playfair Display,serif">m = tanθ = Δy/Δx</text>
    </svg>
  );
}

function AngleLinesSVG({ color=ACCENT, size=300 }) {
  const W=size, H=size*0.65;
  const cx=W/2, cy=H/2;
  const len=90;
  const angle1 = Math.PI/8, angle2 = Math.PI/2.8;
  const x1=cx+len*Math.cos(angle1), y1=cy-len*Math.sin(angle1);
  const x2=cx+len*Math.cos(angle2), y2=cy-len*Math.sin(angle2);
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto'}}>
      <line x1={cx} y1={cy} x2={x1} y2={y1} stroke={color} strokeWidth={2}/>
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={`${color}cc`} strokeWidth={2}/>
      <path d={`M ${cx+25} ${cy-20} A 25 25 0 0 0 ${cx+15} ${cy-12}`} fill="none" stroke="#fff" strokeWidth={1.2}/>
      <text x={cx+32} y={cy-24} fill="#fff" fontSize={14} fontFamily="Playfair Display, serif" fontWeight="bold">α</text>
      <text x={cx+len*0.45} y={cy-len*0.3} fill={color} fontSize={12} fontFamily="JetBrains Mono">Line 1 (m₁)</text>
      <text x={cx+len*0.5} y={cy-len*0.75} fill={`${color}cc`} fontSize={12} fontFamily="JetBrains Mono">Line 2 (m₂)</text>
      <text x={W/2} y={H-10} textAnchor="middle" fill={color} fontSize={12} fontFamily="Playfair Display,serif">tan α = |(m₁-m₂)/(1+m₁m₂)|</text>
    </svg>
  );
}

function PairLinesSVG({ color=ACCENT, size=300 }) {
  const W=size, H=size*0.65;
  const cx=W/2, cy=H/2;
  const a1=Math.PI/5, a2=-Math.PI/4.2;
  const len=100;
  const lx1=cx+len*Math.cos(a1), ly1=cy-len*Math.sin(a1);
  const lx2=cx-len*Math.cos(a1), ly2=cy+len*Math.sin(a1);
  const rx1=cx+len*Math.cos(a2), ry1=cy-len*Math.sin(a2);
  const rx2=cx-len*Math.cos(a2), ry2=cy+len*Math.sin(a2);
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto'}}>
      <line x1={lx2} y1={ly2} x2={lx1} y2={ly1} stroke={color} strokeWidth={2}/>
      <line x1={rx2} y1={ry2} x2={rx1} y2={ry1} stroke={color} strokeWidth={2}/>
      <circle cx={cx} cy={cy} r={4} fill="#fff"/>
      <text x={cx+10} y={cy+12} fill={color} fontSize={12} fontFamily="Playfair Display,serif">Point of intersection</text>
    </svg>
  );
}

// ── Notation Table ─────────────────────────────────────────────
const NOTATION = [
  { sym:'(x_1, y_1)', name:'Coordinates of a point', meaning:'Position in Cartesian plane', ex:'P(2,3)\\text{ lies 2 right, 3 up from origin}' },
  { sym:'d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}', name:'Distance Formula', meaning:'Euclidean distance between two points', ex:'d = \\sqrt{(4-1)^2+(5-2)^2}=\\sqrt{9+9}=\\sqrt{18}' },
  { sym:'(mx_2+nx_1)/(m+n), (my_2+ny_1)/(m+n)', name:'Section Formula (internal)', meaning:'Divides segment in ratio m:n internally', ex:'Midpoint: ( \\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2} )' },
  { sym:'\\frac{1}{2}|x_1(y_2-y_3)+x_2(y_3-y_1)+x_3(y_1-y_2)|', name:'Area of Triangle', meaning:'Area from coordinates using determinant', ex:'A(1,2),B(4,5),C(3,6)\\to\\text{area}=2.5' },
  { sym:'m = \\tan\\theta = \\frac{y_2-y_1}{x_2-x_1}', name:'Slope', meaning:'Steepness of a line', ex:'Line through (1,2) and (3,6): m=2' },
  { sym:'y - y_1 = m(x - x_1)', name:'Point-Slope Form', meaning:'Line passing through (x₁,y₁) with slope m', ex:'y-3=2(x-1)' },
  { sym:'y = mx + c', name:'Slope-Intercept Form', meaning:'Line with slope m, y‑intercept c', ex:'y=2x+5' },
  { sym:'\\frac{x}{a} + \\frac{y}{b} = 1', name:'Intercept Form', meaning:'Line with x‑intercept a, y‑intercept b', ex:'\\frac{x}{3}+\\frac{y}{4}=1' },
  { sym:'x\\cos\\alpha + y\\sin\\alpha = p', name:'Normal Form', meaning:'Line at distance p from origin, angle α', ex:'x\\cos60^\\circ+y\\sin60^\\circ=5' },
  { sym:'Ax + By + C = 0', name:'General Equation', meaning:'Standard linear equation', ex:'2x+3y-6=0\\;(m=-A/B)' },
  { sym:'d = \\frac{|Ax_1+By_1+C|}{\\sqrt{A^2+B^2}}', name:'Distance of Point from Line', meaning:'Perpendicular distance', ex:'d=\\frac{|2\\cdot1+3\\cdot2-6|}{\\sqrt{13}}' },
  { sym:'\\tan\\theta = \\left|\\frac{m_1-m_2}{1+m_1m_2}\\right|', name:'Angle Between Lines', meaning:'Acute angle between two lines', ex:'m_1=2,m_2=3\\to\\tan\\theta=1/7' },
  { sym:'m_1 = m_2', name:'Parallel Lines', meaning:'Same slope', ex:'y=2x+1\\parallel y=2x-4' },
  { sym:'m_1 m_2 = -1', name:'Perpendicular Lines', meaning:'Product of slopes = -1', ex:'y=3x+2\\perp y=-\\frac{1}{3}x+5' },
  { sym:'L_1 + \\lambda L_2 = 0', name:'Family of Lines', meaning:'All lines passing through intersection of L₁ and L₂', ex:'(2x+y-3)+\\lambda(x-y+1)=0' },
  { sym:'\\frac{A_1x+B_1y+C_1}{\\sqrt{A_1^2+B_1^2}} = \\pm \\frac{A_2x+B_2y+C_2}{\\sqrt{A_2^2+B_2^2}}', name:'Angle Bisectors', meaning:'Equations of internal and external bisectors', ex:'Bisector of lines 3x+4y-5=0, 5x+12y-13=0' },
  { sym:'(x_1 + r\\cos\\theta, y_1 + r\\sin\\theta)', name:'Parametric Form', meaning:'Point on a line at signed distance r from (x₁,y₁)', ex:'r=5,\\theta=45^\\circ\\to(x_1+5/\\sqrt2, y_1+5/\\sqrt2)' },
  { sym:'ax^2+2hxy+by^2+2gx+2fy+c=0', name:'Second Degree Equation', meaning:'General conic; pair of lines if Δ=0', ex:'Δ = abc+2fgh-af^2-bg^2-ch^2=0' },
  { sym:'\\tan\\theta = \\frac{2\\sqrt{h^2-ab}}{a+b}', name:'Angle between Pair of Lines', meaning:'For homogeneous ax²+2hxy+by²=0', ex:'x^2-3xy+y^2=0\\to\\theta=45^\\circ' },
  { sym:'\\text{Locus of }P(h,k)', name:'Locus', meaning:'Set of points satisfying a condition', ex:'Distance from (1,2) equals 5\\to (x-1)^2+(y-2)^2=25' },
  { sym:'\\text{Image of }(x_1,y_1)\\text{ in }ax+by+c=0', name:'Reflection', meaning:'Mirror image across a line', ex:'Image of P(1,2) in x+y+1=0' },
];

// ── Sections ───────────────────────────────────────────────────
const SECTIONS = [
  {
    id:'cartesian', title:'Cartesian System & Coordinates', level:'Foundation', color:'#6366F1', icon:'(x,y)',
    shortDef:'Coordinates of a point, distance formula, section formula (internal & external), midpoint.',
    fullDef:"The Cartesian plane provides a coordinate system to locate points. Given two points P(x₁,y₁) and Q(x₂,y₂), the distance between them is √((x₂−x₁)²+(y₂−y₁)²). The section formula divides PQ in ratio m:n: ( (mx₂+nx₁)/(m+n), (my₂+ny₁)/(m+n) ) for internal division; external division uses minus. The midpoint is the special case m=n=1. These formulas are the building blocks for all coordinate geometry problems.",
    keyFacts:[
      {text:'Distance formula', l:'d = \\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}'},
      {text:'Internal division (m:n)', l:'\\left(\\frac{mx_2+nx_1}{m+n},\\frac{my_2+ny_1}{m+n}\\right)'},
      {text:'External division', l:'\\left(\\frac{mx_2-nx_1}{m-n},\\frac{my_2-ny_1}{m-n}\\right)'},
      {text:'Midpoint', l:'\\left(\\frac{x_1+x_2}{2},\\frac{y_1+y_2}{2}\\right)'},
      {text:'Area of triangle', l:'\\frac{1}{2}|x_1(y_2-y_3)+x_2(y_3-y_1)+x_3(y_1-y_2)|'},
      {text:'Collinearity condition', l:'\\text{Area}=0\\;\\text{or }\\frac{y_2-y_1}{x_2-x_1}=\\frac{y_3-y_1}{x_3-x_1}'},
    ], genKey:'cartesian', diagram:'coordplane',
  },
  {
    id:'triangle_centers', title:'Triangle Centers & Special Points', level:'Foundation', color:'#A5B4FC', icon:'Δ',
    shortDef:'Centroid, Incenter, Orthocenter, Circumcenter — their coordinates and properties.',
    fullDef:"The centroid G is the intersection of medians: G = ((x₁+x₂+x₃)/3, (y₁+y₂+y₃)/3). The incenter I is the intersection of angle bisectors: I = ((ax₁+bx₂+cx₃)/(a+b+c), ...), where a,b,c are side lengths. For right triangles, the circumcenter is the midpoint of the hypotenuse. The orthocenter is the intersection of altitudes; it can be found using slope relationships. These points have many collinearity properties (Euler line).",
    keyFacts:[
      {text:'Centroid', l:'G = \\left(\\frac{x_1+x_2+x_3}{3},\\frac{y_1+y_2+y_3}{3}\\right)'},
      {text:'Incenter', l:'I = \\left(\\frac{ax_1+bx_2+cx_3}{a+b+c},\\frac{ay_1+by_2+cy_3}{a+b+c}\\right)'},
      {text:'Circumcenter (right triangle)', l:'\\text{Midpoint of hypotenuse}'},
      {text:'Orthocenter (slope method)', l:'\\text{Find foot of altitudes using perpendicular slopes}'},
      {text:'Euler line', l:'O, G, H\\text{ are collinear, }HG:GO = 2:1'},
    ], genKey:'triangle_centers', diagram:'coordplane',
  },
  {
    id:'slope', title:'Slope & Equation Forms', level:'Core', color:'#818CF8', icon:'m',
    shortDef:'Definition of slope m = tanθ = (y₂−y₁)/(x₂−x₁). Various forms: point-slope, two-point, slope-intercept, intercept, normal.',
    fullDef:"The slope m of a line measures its steepness: m = Δy/Δx = tanθ, where θ is the angle with the positive x-axis. If two points (x₁,y₁) and (x₂,y₂) are known, m = (y₂−y₁)/(x₂−x₁). The line's equation can be written in several useful forms: point-slope (y−y₁)=m(x−x₁); two-point (y−y₁)/(x−x₁)=(y₂−y₁)/(x₂−x₁); slope-intercept y=mx+c; intercept x/a+y/b=1; normal x cosα + y sinα = p; and general Ax+By+C=0. Converting between these forms is essential for problem-solving.",
    keyFacts:[
      {text:'Slope definition', l:'m = \\tan\\theta = \\frac{y_2-y_1}{x_2-x_1}'},
      {text:'Point-slope form', l:'y-y_1 = m(x-x_1)'},
      {text:'Two-point form', l:'\\frac{y-y_1}{x-x_1} = \\frac{y_2-y_1}{x_2-x_1}'},
      {text:'Slope-intercept', l:'y = mx + c'},
      {text:'Intercept form', l:'\\frac{x}{a} + \\frac{y}{b} = 1'},
      {text:'Normal form', l:'x\\cos\\alpha + y\\sin\\alpha = p'},
    ], genKey:'slope', diagram:'lineslope',
  },
  {
    id:'line_forms', title:'General Equation & Conversions', level:'Core', color:'#C7D2FE', icon:'Ax+By+C',
    shortDef:'Transforming general equation Ax+By+C=0 into slope, intercept, and normal forms. Finding slope, intercepts.',
    fullDef:"The general equation Ax+By+C=0 represents a straight line (provided A and B are not both zero). Its slope is −A/B (if B≠0), x‑intercept = −C/A, y‑intercept = −C/B. To convert to normal form, divide by √(A²+B²) with appropriate sign. The intercept form is obtained by moving C to the RHS and dividing by −C. These conversions allow quick identification of key geometric features.",
    keyFacts:[
      {text:'Slope from general form', l:'m = -\\frac{A}{B}'},
      {text:'Intercepts', l:'x\\text{-intercept}=-C/A,\\;y\\text{-intercept}=-C/B'},
      {text:'Normal form conversion', l:'\\frac{Ax+By+C}{\\sqrt{A^2+B^2}}=0\\;(\\text{choose sign})'},
      {text:'Parallel to general line', l:'\\text{Any line }Ax+By+k=0\\text{ is parallel}'},
    ], genKey:'line_forms', diagram:'lineslope',
  },
  {
    id:'distance_metrics', title:'Distance of a Point & Between Lines', level:'Advanced', color:'#F59E0B', icon:'d',
    shortDef:'Perpendicular distance of a point from a line, and distance between two parallel lines.',
    fullDef:"The distance from a point P(x₁,y₁) to a line Ax+By+C=0 is |Ax₁+By₁+C|/√(A²+B²). For two parallel lines Ax+By+C₁=0 and Ax+By+C₂=0, the distance between them is |C₁−C₂|/√(A²+B²). These formulas are derived from the projection of the vector connecting a point on one line to the point onto the normal vector.",
    keyFacts:[
      {text:'Point to line distance', l:'d = \\frac{|Ax_1+By_1+C|}{\\sqrt{A^2+B^2}}'},
      {text:'Distance between parallel lines', l:'d = \\frac{|C_1-C_2|}{\\sqrt{A^2+B^2}}'},
      {text:'Perpendicular foot', l:'\\text{Solving line perpendicular to given through point}'},
      {text:'Signed distance', l:'\\frac{Ax_1+By_1+C}{\\sqrt{A^2+B^2}}\\;(\\text{sign indicates side})'},
    ], genKey:'distance_metrics', diagram:'coordplane',
  },
  {
    id:'angle_concurrency', title:'Angle, Parallelism & Concurrency', level:'Advanced', color:'#D97706', icon:'∠',
    shortDef:'Angle between lines, conditions for parallel (m₁=m₂) and perpendicular (m₁m₂=−1). Concurrency of three lines.',
    fullDef:"The acute angle θ between two lines with slopes m₁,m₂ is given by tanθ = |(m₁−m₂)/(1+m₁m₂)|. Two lines are parallel if their slopes are equal (m₁=m₂) or A₁/A₂ = B₁/B₂. They are perpendicular if m₁m₂ = −1, or A₁A₂+B₁B₂=0. Three lines L₁,L₂,L₃ are concurrent (intersect at a single point) if the determinant formed by their coefficients is zero. This is equivalent to checking that the intersection of L₁ and L₂ lies on L₃.",
    keyFacts:[
      {text:'Angle formula (slopes)', l:'\\tan\\theta = \\left|\\frac{m_1-m_2}{1+m_1m_2}\\right|'},
      {text:'Parallel lines', l:'m_1=m_2\\;\\text{or }\\frac{A_1}{A_2}=\\frac{B_1}{B_2}\\neq\\frac{C_1}{C_2}'},
      {text:'Perpendicular lines', l:'m_1m_2=-1\\;\\text{or }A_1A_2+B_1B_2=0'},
      {text:'Concurrency condition', l:'\\det\\begin{pmatrix}A_1&B_1&C_1\\\\A_2&B_2&C_2\\\\A_3&B_3&C_3\\end{pmatrix}=0'},
      {text:'Intersection point', l:'\\text{Solve }L_1,L_2\\to(x_0,y_0),\\text{ check }L_3(x_0,y_0)=0'},
    ], genKey:'angle_concurrency', diagram:'anglelines',
  },
  {
    id:'bisectors_family', title:'Angle Bisectors & Family of Lines', level:'Advanced', color:'#B45309', icon:'λ',
    shortDef:'Equations of angle bisectors. Family of lines passing through intersection: L₁+λL₂=0.',
    fullDef:"The angle bisectors of two lines a₁x+b₁y+c₁=0 and a₂x+b₂y+c₂=0 are given by (a₁x+b₁y+c₁)/√(a₁²+b₁²) = ± (a₂x+b₂y+c₂)/√(a₂²+b₂²). The plus sign gives one bisector, the minus sign the other (acute vs obtuse). The family of lines passing through the intersection of L₁ and L₂ is L₁ + λ L₂ = 0, where λ is any real parameter. This is extremely useful for solving problems involving lines through a fixed point.",
    keyFacts:[
      {text:'Angle bisectors', l:'\\frac{a_1x+b_1y+c_1}{\\sqrt{a_1^2+b_1^2}} = \\pm \\frac{a_2x+b_2y+c_2}{\\sqrt{a_2^2+b_2^2}}'},
      {text:'Family of lines', l:'L_1 + \\lambda L_2 = 0'},
      {text:'Acute/obtuse bisector', l:'\\text{Check sign of }a_1a_2+b_1b_2\\text{ vs }\\pm'},
      {text:'Through intersection', l:'\\text{Any line through }(x_0,y_0)\\text{ can be expressed via family}'},
    ], genKey:'bisectors_family', diagram:'anglelines',
  },
  {
    id:'parametric_locus', title:'Parametric Form & Locus Problems', level:'Olympiad', color:'#7C3AED', icon:'r',
    shortDef:'Parametric: (x₁ + r cosθ, y₁ + r sinθ). Locus: set of points satisfying a geometric condition.',
    fullDef:"The parametric form (x₁ + r cosθ, y₁ + r sinθ) describes any point on a line through (x₁,y₁) with direction θ. Here r is the signed distance from (x₁,y₁). Locus problems ask for the set of points satisfying a given condition, such as equidistance from two lines or points. The strategy: take a general point (h,k), impose the condition, and eliminate parameters to obtain an equation in x,y.",
    keyFacts:[
      {text:'Parametric point', l:'(x_1 + r\\cos\\theta,\\; y_1 + r\\sin\\theta)'},
      {text:'Locus definition', l:'\\text{Set of points }(x,y)\\text{ satisfying a property}'},
      {text:'Method', l:'\\text{Let }P(h,k),\\text{ enforce condition, eliminate parameters}'},
      {text:'Example: fixed distance', l:'\\text{From }(1,2): (x-1)^2+(y-2)^2=d^2\\;(\\text{circle})'},
      {text:'Locus of equidistant points', l:'\\text{Perpendicular bisector (a line)}'},
    ], genKey:'parametric_locus', diagram:'coordplane',
  },
  {
    id:'pair_lines', title:'Pair of Straight Lines', level:'Olympiad', color:'#5B21B6', icon:'ax²+…',
    shortDef:'Homogeneous second-degree equations, angle between pair, point of intersection.',
    fullDef:"A homogeneous second-degree equation ax²+2hxy+by²=0 represents a pair of straight lines through the origin. Their angle θ satisfies tanθ = 2√(h²−ab)/(a+b). The general second-degree equation ax²+2hxy+by²+2gx+2fy+c=0 represents a pair of straight lines iff Δ = abc+2fgh−af²−bg²−ch² = 0. The point of intersection of the pair can be found by solving ∂F/∂x=0 and ∂F/∂y=0.",
    keyFacts:[
      {text:'Through origin (homogeneous)', l:'ax^2+2hxy+by^2=0'},
      {text:'Angle between them', l:'\\tan\\theta = \\frac{2\\sqrt{h^2-ab}}{a+b}'},
      {text:'Condition for pair of lines', l:'\\Delta = abc+2fgh-af^2-bg^2-ch^2=0'},
      {text:'Point of intersection', l:'\\frac{\\partial F}{\\partial x}=0,\\;\\frac{\\partial F}{\\partial y}=0'},
      {text:'Separating the lines', l:'\\text{Factor the quadratic in }y/x\\text{ for homogeneous case}'},
    ], genKey:'pair_lines', diagram:'pairlines',
  },
  {
    id:'reflection', title:'Reflection, Shifting & Advanced Lemmas', level:'Olympiad', color:'#4F46E5', icon:'⟳',
    shortDef:'Image of a point/line in a line. Shifting origin. Using coordinate lemmas (Stewart, Ceva) in geometry.',
    fullDef:"The image of a point (x₁,y₁) across the line ax+by+c=0 is found by reflecting across the perpendicular through the point. The formula involves the foot of perpendicular and doubling the signed distance. Shifting the origin to (h,k) replaces x by X+h, y by Y+k. Advanced problems often combine coordinate geometry with Euclidean theorems (Stewart's theorem, Ceva, Menelaus) expressed in coordinates, especially in Olympiad settings.",
    keyFacts:[
      {text:'Image of point in line', l:'\\text{Use foot of perpendicular, then mirror}'},
      {text:'Shifting origin', l:'x = X+h,\\ y = Y+k'},
      {text:'Stewart’s theorem coordinates', l:'\\text{Place triangle wisely, use section formula}'},
      {text:'Ceva in coordinates', l:'\\text{Condition for concurrency of cevians using section ratios}'},
      {text:'Homogenization trick', l:'\\text{Making curve equation homogeneous with line to find chord}'},
    ], genKey:'reflection', diagram:'coordplane',
  },
];

// ── Practice Generators ────────────────────────────────────────
const GENERATORS = {
  cartesian:(n)=>{
    const templates=[
      (s)=>{const x1=srI(s,1,8),y1=srI(s+1,1,8),x2=srI(s+2,1,8),y2=srI(s+3,1,8);const d=Math.sqrt((x2-x1)**2+(y2-y1)**2);return{question:`Find the distance between P(${x1},${y1}) and Q(${x2},${y2}).`,steps:[`d = √[(x₂−x₁)²+(y₂−y₁)²]`,`= √[(${x2}−${x1})² + (${y2}−${y1})²] = √[${(x2-x1)**2} + ${(y2-y1)**2}]`,`= √${(x2-x1)**2+(y2-y1)**2} = ${fmt(d,4)}`],answer:`${fmt(d,4)}`,answerLatex:`\\sqrt{${(x2-x1)**2+(y2-y1)**2}} = ${fmt(d,4)}`,tip:'Distance formula: √(Δx²+Δy²).'};},
      (s)=>{const x1=srI(s,1,6),y1=srI(s+1,1,6),x2=srI(s+2,2,8),y2=srI(s+3,2,8);const r=srI(s+4,2,5);const x=(r*x2+x1)/(r+1),y=(r*y2+y1)/(r+1);return{question:`Divide the segment joining (${x1},${y1}) and (${x2},${y2}) in ratio ${r}:1 internally. Find the point.`,steps:[`Internal section: x = (mx₂+nx₁)/(m+n), y = (my₂+ny₁)/(m+n)`,`= (${r}*${x2}+1*${x1})/(${r}+1) = ${fmt(x,3)}`,`y = (${r}*${y2}+1*${y1})/(${r}+1) = ${fmt(y,3)}`],answer:`(${fmt(x,3)}, ${fmt(y,3)})`,answerLatex:`\\left(\\frac{${r* x2+x1}}{${r+1}},\\frac{${r* y2+y1}}{${r+1}}\\right)=(${fmt(x,3)},${fmt(y,3)})`,tip:'Internal division formula: (mx₂+nx₁)/(m+n), etc.'};},
      (s)=>{const x1=srI(s,1,5),y1=srI(s+1,1,5),x2=srI(s+2,3,8),y2=srI(s+3,3,8),x3=srI(s+4,1,8),y3=srI(s+5,1,8);const area=Math.abs(x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2))/2;return{question:`Find the area of triangle with vertices (${x1},${y1}), (${x2},${y2}), (${x3},${y3}).`,steps:[`Area = ½|x₁(y₂−y₃)+x₂(y₃−y₁)+x₃(y₁−y₂)|`,`= ½|${x1}(${y2}−${y3})+${x2}(${y3}−${y1})+${x3}(${y1}−${y2})| = ½|${x1*(y2-y3)} + ${x2*(y3-y1)} + ${x3*(y1-y2)}| = ½|${x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2)}| = ${fmt(area,4)}`],answer:`${fmt(area,4)}`,answerLatex:`\\frac{1}{2}|${x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2)}| = ${fmt(area,4)}`,tip:'Determinant formula for area: ½|Σ xᵢ(yⱼ−yₖ)|.'};},
    ];
    const t=templates[n%templates.length](n*31+7);
    return{...t};
  },
  triangle_centers:(n)=>{
    const templates=[
      (s)=>{const x1=srI(s,1,6),y1=srI(s+1,1,6),x2=srI(s+2,2,8),y2=srI(s+3,2,8),x3=srI(s+4,1,8),y3=srI(s+5,1,8);const cx=(x1+x2+x3)/3,cy=(y1+y2+y3)/3;return{question:`Find the centroid of triangle with vertices (${x1},${y1}), (${x2},${y2}), (${x3},${y3}).`,steps:[`Centroid G = ((x₁+x₂+x₃)/3, (y₁+y₂+y₃)/3)`,`= (${x1}+${x2}+${x3})/3 = ${fmt(cx,3)}, (${y1}+${y2}+${y3})/3 = ${fmt(cy,3)}`],answer:`(${fmt(cx,3)}, ${fmt(cy,3)})`,answerLatex:`\\left(\\frac{${x1+x2+x3}}{3},\\frac{${y1+y2+y3}}{3}\\right)=(${fmt(cx,3)},${fmt(cy,3)})`,tip:'Centroid = average of vertices.'};},
      (s)=>{const a=srI(s,3,8),b=srI(s+1,3,8),c=srI(s+2,3,8);const x1=srI(s+3,1,5),y1=srI(s+4,1,5),x2=x1+a,y2=y1,x3=x1,y3=y1+c;const Ix=(a*x1+b*x2+c*x3)/(a+b+c),Iy=(a*y1+b*y2+c*y3)/(a+b+c);return{question:`Triangle with side lengths a=${a}, b=${b}, c=${c} and vertices A(${x1},${y1}), B(${x2},${y2}), C(${x3},${y3}). Find the incenter.`,steps:[`Incenter coordinates: ( (ax₁+bx₂+cx₃)/(a+b+c), ... )`,`= ( (${a}*${x1}+${b}*${x2}+${c}*${x3})/(${a+b+c}) = ${fmt(Ix,3)}`,`y = (${a}*${y1}+${b}*${y2}+${c}*${y3})/(${a+b+c}) = ${fmt(Iy,3)}`],answer:`(${fmt(Ix,3)}, ${fmt(Iy,3)})`,answerLatex:`\\left(\\frac{${a*x1+b*x2+c*x3}}{${a+b+c}},\\frac{${a*y1+b*y2+c*y3}}{${a+b+c}}\\right)`,tip:'Incenter = weighted average by side lengths.'};},
    ];
    const t=templates[n%templates.length](n*37+11);
    return{...t};
  },
  slope:(n)=>{
    const templates=[
      (s)=>{const x1=srI(s,1,6),y1=srI(s+1,1,6),x2=srI(s+2,2,8),y2=srI(s+3,2,8);const m=(y2-y1)/(x2-x1);return{question:`Find the slope of the line through (${x1},${y1}) and (${x2},${y2}).`,steps:[`m = (y₂−y₁)/(x₂−x₁) = (${y2}−${y1})/(${x2}−${x1}) = ${fmt(m,4)}`],answer:`${fmt(m,4)}`,answerLatex:`m = ${fmt(m,4)}`,tip:'Slope = rise/run.'};},
      (s)=>{const m=srI(s,2,6)*(sr(s+1)>0.5?1:-1);const x1=srI(s+2,1,6),y1=srI(s+3,1,6);return{question:`Write the point-slope form of line with slope ${m} passing through (${x1},${y1}).`,steps:[`Point-slope: y − y₁ = m(x − x₁)`,`y − ${y1} = ${m}(x − ${x1})`],answer:`y − ${y1} = ${m}(x − ${x1})`,answerLatex:`y-${y1}=${m}(x-${x1})`,tip:'Point-slope form: y−y₁=m(x−x₁).'};},
      (s)=>{const a=srI(s,1,8),b=srI(s+1,1,8);const eq=`${a}x+${b}y+${srI(s+2,2,12)}=0`;const m=-a/b;return{question:`Find the slope of the line ${eq}.`,steps:[`General form: Ax+By+C=0 → slope m = −A/B`,`m = −${a}/${b} = ${fmt(m,4)}`],answer:`${fmt(m,4)}`,answerLatex:`m = -\\frac{${a}}{${b}} = ${fmt(m,4)}`,tip:'For Ax+By+C=0, slope = −A/B.'};},
    ];
    const t=templates[n%templates.length](n*41+13);
    return{...t};
  },
  line_forms:(n)=>{
    const templates=[
      (s)=>{const a=srI(s,2,6),b=srI(s+1,2,6),c=-srI(s+2,6,20);const interceptX=-c/a,interceptY=-c/b;return{question:`Convert ${a}x+${b}y+${c}=0 to intercept form.`,steps:[`${a}x+${b}y = ${-c}`,`Divide by ${-c}: x/(${-c/a}) + y/(${-c/b}) = 1`,`Intercept form: x/${fmt(interceptX,1)} + y/${fmt(interceptY,1)} = 1`],answer:`x/${fmt(interceptX,1)} + y/${fmt(interceptY,1)} = 1`,answerLatex:`\\frac{x}{${fmt(interceptX,1)}} + \\frac{y}{${fmt(interceptY,1)}} = 1`,tip:'Move constant to RHS, then divide by constant.'};},
      (s)=>{const A=srI(s,2,5),B=srI(s+1,2,5),C=-srI(s+2,2,8);const p=C/Math.sqrt(A**2+B**2);return{question:`Convert ${A}x+${B}y+${C}=0 to normal form.`,steps:[`Divide by √(A²+B²) = √(${A**2}+${B**2}) = ${fmt(Math.sqrt(A**2+B**2),4)}`,`Normal form: (${A}x+${B}y+${C})/${fmt(Math.sqrt(A**2+B**2),3)} = 0`,`=> ${fmt(A/Math.sqrt(A**2+B**2),3)}x + ${fmt(B/Math.sqrt(A**2+B**2),3)}y + ${fmt(C/Math.sqrt(A**2+B**2),3)} = 0`],answer:`${fmt(A/Math.sqrt(A**2+B**2),3)}x + ${fmt(B/Math.sqrt(A**2+B**2),3)}y + ${fmt(C/Math.sqrt(A**2+B**2),3)} = 0`,answerLatex:`\\frac{${A}}{\\sqrt{${A**2}+${B**2}}}x+\\frac{${B}}{\\sqrt{${A**2}+${B**2}}}y+\\frac{${C}}{\\sqrt{${A**2}+${B**2}}}=0`,tip:'Normal form: divide by √(A²+B²).'};},
    ];
    const t=templates[n%templates.length](n*43+17);
    return{...t};
  },
  distance_metrics:(n)=>{
    const templates=[
      (s)=>{const A=srI(s,1,4),B=srI(s+1,1,4),C=-srI(s+2,3,8);const x1=srI(s+3,1,6),y1=srI(s+4,1,6);const d=Math.abs(A*x1+B*y1+C)/Math.sqrt(A**2+B**2);return{question:`Distance from point (${x1},${y1}) to line ${A}x+${B}y+${C}=0`,steps:[`d = |Ax₁+By₁+C|/√(A²+B²)`,`= |${A}*${x1}+${B}*${y1}+${C}|/√(${A**2}+${B**2}) = |${A*x1+B*y1+C}|/√${A**2+B**2} = ${fmt(d,4)}`],answer:`${fmt(d,4)}`,answerLatex:`\\frac{|${A*x1+B*y1+C}|}{\\sqrt{${A**2+B**2}}} = ${fmt(d,4)}`,tip:'Distance from point to line formula.'};},
      (s)=>{const A=srI(s,1,3),B=srI(s+1,1,3),C1=srI(s+2,3,8),C2=srI(s+3,3,8);const d=Math.abs(C1-C2)/Math.sqrt(A**2+B**2);return{question:`Distance between parallel lines ${A}x+${B}y+${C1}=0 and ${A}x+${B}y+${C2}=0`,steps:[`d = |C₁−C₂|/√(A²+B²) = |${C1}−${C2}|/√(${A**2}+${B**2}) = ${fmt(d,4)}`],answer:`${fmt(d,4)}`,answerLatex:`\\frac{|${C1}-${C2}|}{\\sqrt{${A**2+B**2}}} = ${fmt(d,4)}`,tip:'For parallel lines, distance = |C₁−C₂|/√(A²+B²).'};},
    ];
    const t=templates[n%templates.length](n*47+19);
    return{...t};
  },
  angle_concurrency:(n)=>{
    const templates=[
      (s)=>{const m1=srI(s,1,5),m2=srI(s+1,1,5);const tanθ=Math.abs((m1-m2)/(1+m1*m2));return{question:`Find tan of acute angle between lines with slopes ${m1} and ${m2}.`,steps:[`tanθ = |(m₁−m₂)/(1+m₁m₂)|`, `= |(${m1}−${m2})/(1+${m1}*${m2})| = |${m1-m2}|/${1+m1*m2} = ${fmt(tanθ,4)}`],answer:`${fmt(tanθ,4)}`,answerLatex:`\\tan\\theta = ${fmt(tanθ,4)}`,tip:'Angle between lines formula.'};},
      (s)=>{const A1=srI(s,1,3),B1=srI(s+1,1,3),C1=srI(s+2,1,4);const A2=srI(s+3,1,3),B2=srI(s+4,1,3);return{question:`Are lines ${A1}x+${B1}y+${C1}=0 and ${A2}x+${B2}y+${C2}=0 parallel or perpendicular?`,steps:[`Slopes: m₁ = −${A1}/${B1} = ${fmt(-A1/B1,2)}, m₂ = −${A2}/${B2} = ${fmt(-A2/B2,2)}`,`Check m₁·m₂ = ${fmt((-A1/B1)*(-A2/B2),2)}`,(-A1/B1)*(-A2/B2)===-1?`Product is -1 → Perpendicular.`:`Product not -1 → Not perpendicular. Check m₁ == m₂? ${fmt(-A1/B1,2)} == ${fmt(-A2/B2,2)}? ${-A1/B1===-A2/B2?'Parallel':'Neither'}`],answer:(-A1/B1)*(-A2/B2)===-1?'Perpendicular':(-A1/B1===-A2/B2?'Parallel':'Neither'),answerLatex:`\\text{${(-A1/B1)*(-A2/B2)===-1?'Perpendicular':(-A1/B1===-A2/B2?'Parallel':'Neither')}}`,tip:'Parallel: m₁=m₂. Perpendicular: m₁m₂=−1.'};},
      (s)=>{const L1=`x+y-2=0`,L2=`2x-y+1=0`,L3=`3x+4y-7=0`;return{question:`Do lines ${L1}, ${L2}, ${L3} intersect at a common point?`,steps:[`Solve L1 and L2: intersection (1/3, 5/3). Sub into L3: 3*(1/3)+4*(5/3)-7 = 1+20/3-7 ≠ 0 → Not concurrent.`],answer:'No',answerLatex:'\\text{No, they are not concurrent.}',tip:'Check if intersection of two lines lies on the third.'};},
    ];
    const t=templates[n%templates.length](n*53+23);
    return{...t};
  },
  bisectors_family:(n)=>{
    const templates=[
      (s)=>{const a1=srI(s,1,3),b1=srI(s+1,1,3),c1=-srI(s+2,2,5);const a2=srI(s+3,1,3),b2=srI(s+4,1,3),c2=-srI(s+5,2,5);return{question:`Find the equations of angle bisectors of ${a1}x+${b1}y+${c1}=0 and ${a2}x+${b2}y+${c2}=0.`,steps:[`Bisectors: (a₁x+b₁y+c₁)/√(a₁²+b₁²) = ± (a₂x+b₂y+c₂)/√(a₂²+b₂²)`,`Plug in values. Positive sign and negative sign give two bisectors.`],answer:`See steps`,answerLatex:`\\frac{${a1}x+${b1}y+${c1}}{\\sqrt{${a1**2+b1**2}}} = \\pm \\frac{${a2}x+${b2}y+${c2}}{\\sqrt{${a2**2+b2**2}}}`,tip:'Angle bisectors formula.'};},
      (s)=>{const L1='x+y-1',L2='2x-y+3',lam=srI(s,2,5);return{question:`Find the line from the family ${L1}+λ(${L2})=0 passing through (2,1).`,steps:[`Family: (x+y-1) + λ(2x-y+3)=0 → (1+2λ)x + (1-λ)y + (-1+3λ)=0`,`Sub (2,1): (1+2λ)*2 + (1-λ)*1 + (-1+3λ)=0 → 2+4λ+1-λ-1+3λ=0 → 6λ+2=0 → λ=−1/3`,`Line: (x+y-1) - (1/3)(2x-y+3)=0 → simplify.`],answer:`(1/3)x + (4/3)y - 2 = 0 or x+4y-6=0`,answerLatex:`x+4y-6=0`,tip:'Use family to find line through intersection satisfying extra condition.'};},
    ];
    const t=templates[n%templates.length](n*59+29);
    return{...t};
  },
  parametric_locus:(n)=>{
    const templates=[
      (s)=>{const x1=srI(s,1,4),y1=srI(s+1,1,4),r=srI(s+2,2,5),theta=Math.PI/srI(s+3,3,6);return{question:`Find the point on line through (${x1},${y1}) at angle ${Math.round(theta*180/Math.PI)}° at distance ${r}.`,steps:[`Parametric: (x₁ + r cosθ, y₁ + r sinθ)`,`cosθ=${Math.cos(theta).toFixed(3)}, sinθ=${Math.sin(theta).toFixed(3)}`,`x = ${x1} + ${r}*${Math.cos(theta).toFixed(3)} = ${fmt(x1+r*Math.cos(theta),3)}`,`y = ${y1} + ${r}*${Math.sin(theta).toFixed(3)} = ${fmt(y1+r*Math.sin(theta),3)}`],answer:`(${fmt(x1+r*Math.cos(theta),3)}, ${fmt(y1+r*Math.sin(theta),3)})`,answerLatex:`(${fmt(x1+r*Math.cos(theta),3)}, ${fmt(y1+r*Math.sin(theta),3)})`,tip:'Parametric point on a line.'};},
      (s)=>{return{question:`Find the locus of a point whose distance from (2,0) equals its distance from line x+1=0.`,steps:[`Let P(x,y). Distance to (2,0): √((x−2)²+y²). Distance to x+1=0: |x+1|.`,`Set equal: √((x−2)²+y²) = |x+1| → square: (x−2)²+y² = (x+1)² → simplify → y²=6x−3.`],answer:`y² = 6x − 3`,answerLatex:`y^2 = 6x - 3`,tip:'Locus: equate distances, eliminate radicals.'};},
    ];
    const t=templates[n%templates.length](n*61+31);
    return{...t};
  },
  pair_lines:(n)=>{
    const templates=[
      (s)=>{const a=srI(s,1,4),h=srI(s+1,1,3),b=srI(s+2,1,4);const tanθ=2*Math.sqrt(h**2-a*b)/(a+b);return{question:`Find tan of angle between the pair of lines ${a}x²+${2*h}xy+${b}y²=0.`,steps:[`tanθ = 2√(h²−ab)/(a+b) = 2√(${h}²−${a}*${b})/(${a+b}) = ${fmt(tanθ,4)}`],answer:`${fmt(tanθ,4)}`,answerLatex:`\\tan\\theta = ${fmt(tanθ,4)}`,tip:'Angle between pair of lines through origin.'};},
      (s)=>{const a=1,h=2,b=3,g=1,f=2,c=0;const delta=a*b*c+2*f*g*h-a*f**2-b*g**2-c*h**2;return{question:`Check if  x²+4xy+3y²+2x+4y=0 represents a pair of lines.`,steps:[`Δ = abc+2fgh−af²−bg²−ch² = 1*3*0+2*2*1*2-1*4-3*1-0 = 0+8-4-3 = 1 ≠0 → No.`],answer:'No',answerLatex:'\\Delta = 1 \\neq 0,\\text{ not a pair of lines.}',tip:'Condition for pair: Δ=0.'};},
    ];
    const t=templates[n%templates.length](n*67+37);
    return{...t};
  },
  reflection:(n)=>{
    const templates=[
      (s)=>{const x1=srI(s,1,5),y1=srI(s+1,1,5);const line=`x+y-1=0`;return{question:`Find the image of (${x1},${y1}) across the line ${line}.`,steps:[`Foot of perpendicular: solve line perpendicular through point.`,`Midpoint = foot, image = 2*foot - original.`],answer:`(${fmt(-y1+1,1)}, ${fmt(-x1+1,1)})`,answerLatex:`(${fmt(-y1+1,1)}, ${fmt(-x1+1,1)})`,tip:'Reflection: find foot, then mirror.'};},
      (s)=>{return{question:`If the origin is shifted to (2,-3), what is the new equation of x²+y²−4x+6y−12=0?`,steps:[`Shifting: x = X+2, y = Y−3. Sub: (X+2)²+(Y-3)²−4(X+2)+6(Y-3)−12=0 → X²+Y²−25=0.`],answer:'X² + Y² = 25',answerLatex:'X^2+Y^2=25',tip:'Shifting origin: replace x by X+h, y by Y+k.'};},
    ];
    const t=templates[n%templates.length](n*71+41);
    return{...t};
  },
};

// ── Quiz Generators ────────────────────────────────────────────
const QUIZ_GENERATORS = {
  cartesian:(n)=>{
    const templates=[
      (s)=>{const x1=srI(s,1,5),y1=srI(s+1,1,5),x2=srI(s+2,2,8),y2=srI(s+3,2,8);const d=Math.sqrt((x2-x1)**2+(y2-y1)**2);return{q:`Distance between (${x1},${y1}) and (${x2},${y2})?`,opts:shuffle([fmt(d,4),fmt(d+1,4),fmt(d*2,4),fmt(Math.sqrt((x2-x1)**2+(y2-y1+1)**2),4)],s),correct:fmt(d,4)};},
      (s)=>{const m=2,n=3,x1=1,y1=2,x2=4,y2=6;const x=(m*x2+n*x1)/(m+n),y=(m*y2+n*y1)/(m+n);return{q:`Internal division of (1,2) and (4,6) in ratio 2:3. Point is?`,opts:shuffle([`(${fmt(x,3)}, ${fmt(y,3)})`,`(${fmt(x+0.1,3)}, ${fmt(y,3)})`,`(${fmt(x,3)}, ${fmt(y+0.1,3)})`,`(${fmt(x2,y1)})`].slice(0,4),s),correct:`(${fmt(x,3)}, ${fmt(y,3)})`};},
    ];
    const t=templates[n%templates.length](n*31+7);
    return{...t,tip:'Distance and section formula.'};
  },
  triangle_centers:(n)=>{
    const templates=[
      (s)=>{const x1=2,y1=3,x2=5,y2=7,x3=1,y3=4;const gx=(x1+x2+x3)/3,gy=(y1+y2+y3)/3;return{q:`Centroid of (2,3),(5,7),(1,4) is?`,opts:shuffle([`(${fmt(gx,3)}, ${fmt(gy,3)})`,`(${fmt(gx+0.2,3)}, ${fmt(gy,3)})`,`(${fmt(gx,3)}, ${fmt(gy+0.2,3)})`,`(${fmt(2,3)})`].slice(0,4),s),correct:`(${fmt(gx,3)}, ${fmt(gy,3)})`};},
    ];
    const t=templates[n%templates.length](n*37+11);
    return{...t,tip:'Centroid = average coordinates.'};
  },
  slope:(n)=>{
    const templates=[
      (s)=>{const x1=1,y1=2,x2=5,y2=10;const m=(y2-y1)/(x2-x1);return{q:`Slope of line through (1,2) and (5,10)?`,opts:shuffle([fmt(m,1),fmt(m+0.5,1),fmt(m-0.5,1),fmt(m*2,1)],s),correct:fmt(m,1)};},
      (s)=>{const m=3,c=5;return{q:`Line with slope 3 and y-intercept 5 is?`,opts:shuffle(['y=3x+5','y=3x-5','y=5x+3','x=3y+5'],s),correct:'y=3x+5'};},
    ];
    const t=templates[n%templates.length](n*41+13);
    return{...t,tip:'Slope = (y₂−y₁)/(x₂−x₁). Slope-intercept y=mx+c.'};
  },
  line_forms:(n)=>{
    const templates=[
      (s)=>{const A=3,B=4,C=-12;const xint=-C/A,yint=-C/B;return{q:`Intercept form of 3x+4y-12=0?`,opts:shuffle([`x/4 + y/3 = 1`,`x/3 + y/4 = 1`,`x/12 + y/12 = 1`,`x/3 - y/4 = 1`],s),correct:`x/4 + y/3 = 1`};},
    ];
    const t=templates[n%templates.length](n*43+17);
    return{...t,tip:'Divide by constant, move to denominators.'};
  },
  distance_metrics:(n)=>{
    const templates=[
      (s)=>{const d=Math.abs(3*1+4*2-5)/5;return{q:`Distance of (1,2) to 3x+4y-5=0?`,opts:shuffle([fmt(d,2),fmt(d+0.2,2),fmt(d*2,2),fmt(d/2,2)],s),correct:fmt(d,2)};},
      (s)=>{const d=Math.abs(3-(-5))/5;return{q:`Distance between 3x+4y+3=0 and 3x+4y-5=0?`,opts:shuffle([fmt(d,1),fmt(d+0.2,1),fmt(d*2,1),'0'],s),correct:fmt(d,1)};},
    ];
    const t=templates[n%templates.length](n*47+19);
    return{...t,tip:'Distance from point/ between parallel lines.'};
  },
  angle_concurrency:(n)=>{
    const templates=[
      (s)=>{const tanθ=Math.abs((2-3)/(1+6));return{q:`tanθ between lines with slopes 2 and 3?`,opts:shuffle([fmt(tanθ,4),fmt(tanθ+0.1,4),'0.5','0.1429'],s),correct:fmt(tanθ,4)};},
    ];
    const t=templates[n%templates.length](n*53+23);
    return{...t,tip:'|m₁−m₂|/(1+m₁m₂).'};
  },
  bisectors_family:(n)=>{
    const templates=[
      (s)=>{return{q:`Equation of angle bisectors of 3x+4y-5=0 and 5x+12y-13=0?`,opts:shuffle(['(3x+4y-5)/5 = ±(5x+12y-13)/13','(3x+4y-5)=±(5x+12y-13)','(3x+4y-5)/13=±(5x+12y-13)/5','x+y=0'],s),correct:'(3x+4y-5)/5 = ±(5x+12y-13)/13'};},
    ];
    const t=templates[n%templates.length](n*59+29);
    return{...t,tip:'Divide by √(a²+b²).'};
  },
  parametric_locus:(n)=>{
    const templates=[
      (s)=>{return{q:`Parametric point on line with angle 60° at distance 2 from (0,0)?`,opts:shuffle([`(1, √3)`,`(√3,1)`,`(2,0)`,`(1,1)`],s),correct:`(1, √3)`};},
    ];
    const t=templates[n%templates.length](n*61+31);
    return{...t,tip:'(r cosθ, r sinθ) for origin.'};
  },
  pair_lines:(n)=>{
    const templates=[
      (s)=>{const tanθ=2*Math.sqrt(4-3)/(4);return{q:`Angle between pair x²+4xy+3y²=0: tanθ =?`,opts:shuffle([fmt(tanθ,3),'0','1','0.577'],s),correct:fmt(tanθ,3)};},
    ];
    const t=templates[n%templates.length](n*67+37);
    return{...t,tip:'2√(h²−ab)/(a+b).'};
  },
  reflection:(n)=>{
    const templates=[
      (s)=>{return{q:`Image of (1,2) across line x+y-1=0?`,opts:shuffle([`(-1,0)`,`(0,-1)`,`(1,0)`,`(0,1)`],s),correct:`(-1,0)`};},
    ];
    const t=templates[n%templates.length](n*71+41);
    return{...t,tip:'Reflect: foot of perpendicular then mirror.'};
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
      body{background:#0b0f1e;}
      ::-webkit-scrollbar{width:5px;}
      ::-webkit-scrollbar-track{background:#0b0f1e;}
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
  const floaters = ['y=mx+c','d=√(Δx²+Δy²)','ax²+2hxy+by²','θ','∩','(x₁,y₁)','‖','⊥'];
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', background:`radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.09) 0%, transparent 65%), #0b0f1e`, textAlign:'center' }}>
      {floaters.map((s, i) => (
        <div key={s} style={{ position:'fixed', pointerEvents:'none', fontSize:14+(i%3)*7, color:`rgba(99,102,241,${0.04+(i%4)*0.02})`, top:`${8+i*11}%`, left:i%2===0?`${2+i*4}%`:`${74+i*2}%`, fontFamily:'JetBrains Mono,monospace', animation:`pulse ${3+i*0.6}s ease-in-out infinite`, animationDelay:`${i*0.25}s` }}>{s}</div>
      ))}
      <div style={{ opacity:phase>=1?1:0, transform:phase>=1?'translateY(0)':'translateY(12px)', transition:'all 0.6s ease', marginBottom:20, display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:40 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:ACCENT, animation:'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize:12, color:ACCENT, letterSpacing:'2px', textTransform:'uppercase', fontFamily:'Crimson Pro, serif' }}>Mathematics · Coordinate Geometry</span>
      </div>
      <div style={{ opacity:phase>=2?1:0, transform:phase>=2?'translateY(0)':'translateY(20px)', transition:'all 0.7s ease 0.1s', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:'clamp(40px, 10vw, 90px)', color:'#fff', letterSpacing:'-3px', lineHeight:0.92, marginBottom:0 }}>
          Straight <span style={{ color:ACCENT }}>Lines</span>
        </h1>
        <div style={{ height:3, width:80, background:`linear-gradient(90deg, ${ACCENT}, transparent)`, margin:'16px auto 0', borderRadius:2 }} />
      </div>
      <div style={{ opacity:phase>=3?1:0, transition:'all 0.6s ease', maxWidth:560, marginBottom:40 }}>
        <p style={{ fontFamily:'Crimson Pro, serif', fontSize:19, color:'rgba(255,255,255,0.7)', lineHeight:1.55, marginBottom:18, fontStyle:'italic' }}>
          "From the Cartesian plane to the pair of straight lines — coordinate geometry gives algebraic wings to Euclidean intuition."
        </p>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 24px', textAlign:'left' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:12, fontFamily:'JetBrains Mono, monospace' }}>Chapter Overview</div>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>
            Master the coordinate framework: distance, section formula, centroid, slope, all forms of line equations, angle between lines, concurrency, families, parametric form, locus, pair of lines, and advanced Olympiad lemmas.
          </p>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:20 }}>
          {['Foundation → Olympiad','10 Topics','∞ Practice','Quiz-Gated Progress'].map(t => (
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
    { title:'Coordinate Basics', color:ACCENT, rows:NOTATION.slice(0,5) },
    { title:'Line Equations', color:'#A5B4FC', rows:NOTATION.slice(5,10) },
    { title:'Advanced Metrics & Angle', color:'#F59E0B', rows:NOTATION.slice(10,16) },
    { title:'Olympiad Tools', color:'#8B5CF6', rows:NOTATION.slice(16) },
  ];
  return (
    <div style={{ minHeight:'100vh', background:'#0b0f1e', padding:'32px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:32, opacity:revealed?1:0, transition:'opacity 0.5s ease' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Before We Begin</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:34, color:'#fff', letterSpacing:'-1px', marginBottom:10 }}>Notation Guide</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>Key symbols and formulas for straight lines and coordinate geometry.</p>
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
          Start Learning →
        </button>
      </div>
    </div>
  );
}

// ── Section Menu ───────────────────────────────────────────────
function SectionMenuScreen({ onSelect, completedIds }) {
  const levels = ['Foundation','Core','Advanced','Olympiad'];
  const lColors = { Foundation:'#6366F1', Core:'#818CF8', Advanced:'#F59E0B', Olympiad:'#7C3AED' };
  const lDesc = { Foundation:'Basics of coordinates', Core:'Equation forms', Advanced:'JEE · Angle & Concurrency', Olympiad:'RMO · INMO' };
  return (
    <div style={{ minHeight:'100vh', background:'#0b0f1e', padding:'28px 16px 60px' }}>
      <div style={{ maxWidth:660, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>Chapter · Straight Lines</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:30, color:'#fff', letterSpacing:'-0.8px', marginBottom:6 }}>Choose a Topic</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:15, color:'rgba(255,255,255,0.4)', marginBottom:14 }}>Pass the quiz to unlock the next topic.</p>
          <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(completedIds.size/SECTIONS.length)*100}%`, background:`linear-gradient(90deg,${ACCENT},#A5B4FC)`, borderRadius:4, transition:'width 0.5s ease' }} />
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
  const lColors = { Foundation:'#6366F1', Core:'#818CF8', Advanced:'#F59E0B', Olympiad:'#7C3AED' };
  const col = lColors[section.level] || ACCENT;
  const Diagram = section.diagram === 'coordplane'? CoordPlaneSVG :
                 section.diagram === 'lineslope'? LineSlopeSVG :
                 section.diagram === 'anglelines'? AngleLinesSVG :
                 section.diagram === 'pairlines'? PairLinesSVG : null;
  return (
    <div style={{ minHeight:'100vh', background:'#0b0f1e', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(11,15,30,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px', display:'flex', alignItems:'center', gap:12 }}>
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
  const col = ({Foundation:'#6366F1', Core:'#818CF8', Advanced:'#F59E0B', Olympiad:'#7C3AED'})[section.level] || ACCENT;
  const gen = GENERATORS[section.genKey] || (()=>({question:'Practice question',steps:[],answer:'...',tip:''}));
  const seed = baseSeed + qIdx * 97;
  const question = useCallback(() => gen(seed), [seed])();
  const next = () => { setQIdx(i => i+1); setShowAnswer(false); setShowSteps(false); setCount(c => c+1); };
  return (
    <div style={{ minHeight:'100vh', background:'#0b0f1e', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(11,15,30,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
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
  const col = ({Foundation:'#6366F1', Core:'#818CF8', Advanced:'#F59E0B', Olympiad:'#7C3AED'})[section.level] || ACCENT;
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
      <div style={{ minHeight:'100vh', background:'#0b0f1e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', textAlign:'center' }}>
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
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:r.correct?'rgba(99,102,241,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${r.correct?'rgba(99,102,241,0.2)':'rgba(239,68,68,0.2)'}`, borderRadius:8, marginBottom:6, textAlign:'left' }}>
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
    <div style={{ minHeight:'100vh', background:'#0b0f1e', paddingBottom:60 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(11,15,30,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
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
              if(isCorrect){bg='rgba(99,102,241,0.12)';border='1px solid rgba(99,102,241,0.5)';color='#A5B4FC';}
              else if(isSelected){bg='rgba(239,68,68,0.12)';border='1px solid rgba(239,68,68,0.5)';color='#FCA5A5';}
            }else if(isSelected){bg=`${col}18`;border=`1px solid ${col}66`;color=col;}
            return (
              <button key={i} onClick={()=>!confirmed&&setSelected(opt)} disabled={confirmed}
                style={{ background:bg, border, borderRadius:12, padding:'14px 18px', textAlign:'left', color, fontFamily:'Crimson Pro,serif', fontSize:16, display:'flex', alignItems:'center', gap:12, cursor:confirmed?'default':'pointer', transition:'all 0.15s ease' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:isSelected&&!confirmed?`${col}25`:confirmed&&isCorrect?'rgba(99,102,241,0.2)':confirmed&&isSelected?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)', border:`1px solid ${isSelected&&!confirmed?col+'66':confirmed&&isCorrect?'rgba(99,102,241,0.5)':confirmed&&isSelected?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:'JetBrains Mono,monospace', flexShrink:0, color:isSelected&&!confirmed?col:confirmed&&isCorrect?'#A5B4FC':confirmed&&isSelected?'#FCA5A5':'rgba(255,255,255,0.4)' }}>
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
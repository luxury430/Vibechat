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

// ── Seeded random helpers ─────────────────────────────────────
const sr  = n => Math.abs(Math.sin(n*127.1+311.7)*43758.5453)%1;
const srI = (n,lo,hi) => Math.floor(sr(n)*(hi-lo+1))+lo;
const srP = (arr,n) => arr[Math.floor(sr(n)*arr.length)];
const fmt = (n,d=4) => Number.isFinite(n)?n.toFixed(d):'—';
const deg2rad = d => d*Math.PI/180;
const rad2deg = r => r*180/Math.PI;
const gcd = (a,b) => b===0?a:gcd(b,a%b);

// Standard angles (degrees) and their trig values
const STD_ANGLES = [0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330,360];
const sinExact = { 0:'0', 30:'\\frac{1}{2}', 45:'\\frac{\\sqrt{2}}{2}', 60:'\\frac{\\sqrt{3}}{2}', 90:'1', 120:'\\frac{\\sqrt{3}}{2}', 135:'\\frac{\\sqrt{2}}{2}', 150:'\\frac{1}{2}', 180:'0', 210:'-\\frac{1}{2}', 225:'-\\frac{\\sqrt{2}}{2}', 240:'-\\frac{\\sqrt{3}}{2}', 270:'-1', 300:'-\\frac{\\sqrt{3}}{2}', 315:'-\\frac{\\sqrt{2}}{2}', 330:'-\\frac{1}{2}', 360:'0' };
const cosExact = { 0:'1', 30:'\\frac{\\sqrt{3}}{2}', 45:'\\frac{\\sqrt{2}}{2}', 60:'\\frac{1}{2}', 90:'0', 120:'-\\frac{1}{2}', 135:'-\\frac{\\sqrt{2}}{2}', 150:'-\\frac{\\sqrt{3}}{2}', 180:'-1', 210:'-\\frac{\\sqrt{3}}{2}', 225:'-\\frac{\\sqrt{2}}{2}', 240:'-\\frac{1}{2}', 270:'0', 300:'\\frac{1}{2}', 315:'\\frac{\\sqrt{2}}{2}', 330:'\\frac{\\sqrt{3}}{2}', 360:'1' };
const NICE_ANGLES_DEG = [30,45,60,120,135,150,210,225,240,300,315,330];

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

// ── Unit Circle SVG ────────────────────────────────────────────
function UnitCircleSVG({ angleDeg=45, color='#4ECDC4', size=240 }) {
  const W=size, H=size, cx=W/2, cy=H/2, r=W*0.38;
  const rad = deg2rad(angleDeg);
  const px = cx + r*Math.cos(rad), py = cy - r*Math.sin(rad);
  const ticks = [0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330];
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto'}}>
      <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}/>
      <line x1={cx-r-10} y1={cy} x2={cx+r+10} y2={cy} stroke="rgba(255,255,255,0.2)" strokeWidth={1}/>
      <line x1={cx} y1={cy-r-10} x2={cx} y2={cy+r+10} stroke="rgba(255,255,255,0.2)" strokeWidth={1}/>
      {ticks.map(d=>{const rd=deg2rad(d);return(<line key={d} x1={cx+r*0.92*Math.cos(rd)} y1={cy-r*0.92*Math.sin(rd)} x2={cx+r*Math.cos(rd)} y2={cy-r*Math.sin(rd)} stroke="rgba(255,255,255,0.2)" strokeWidth={1}/>);})}
      {/* sin line (vertical) */}
      <line x1={px} y1={cy} x2={px} y2={py} stroke="rgba(255,107,107,0.7)" strokeWidth={1.5} strokeDasharray="4,3"/>
      {/* cos line (horizontal) */}
      <line x1={cx} y1={cy} x2={px} y2={cy} stroke="rgba(78,205,196,0.7)" strokeWidth={1.5} strokeDasharray="4,3"/>
      {/* radius */}
      <line x1={cx} y1={cy} x2={px} y2={py} stroke={color} strokeWidth={2}/>
      {/* arc */}
      {angleDeg>0&&angleDeg<360&&<path d={`M${cx+r*0.22},${cy} A${r*0.22},${r*0.22} 0 ${angleDeg>180?1:0},0 ${cx+r*0.22*Math.cos(rad)},${cy-r*0.22*Math.sin(rad)}`} fill="none" stroke={color} strokeWidth={1.5}/>}
      <circle cx={px} cy={py} r={5} fill={color}/>
      <circle cx={cx} cy={cy} r={3} fill="rgba(255,255,255,0.6)"/>
      <text x={cx+r+14} y={cy+4} fill="rgba(255,255,255,0.5)" fontSize={10} fontFamily="JetBrains Mono,monospace">1</text>
      <text x={cx+4} y={cy-r-6} fill="rgba(255,255,255,0.5)" fontSize={10} fontFamily="JetBrains Mono,monospace">i</text>
      <text x={px+7} y={py-6} fill={color} fontSize={11} fontFamily="JetBrains Mono,monospace">{angleDeg}°</text>
      <text x={px+(px>cx?6:-28)} y={cy+(py>cy?14:-6)} fill="rgba(255,107,107,0.8)" fontSize={10} fontFamily="serif" fontStyle="italic">sin</text>
      <text x={cx+(px>cx?6:-20)} y={cy-8} fill="rgba(78,205,196,0.8)" fontSize={10} fontFamily="serif" fontStyle="italic">cos</text>
    </svg>
  );
}

// ── Triangle SVG ───────────────────────────────────────────────
function TriangleSVG({ a=5, b=7, C_deg=60, color='#F59E0B', size=240 }) {
  const W=size, H=size*0.72;
  const C_rad=deg2rad(C_deg), c=Math.sqrt(a*a+b*b-2*a*b*Math.cos(C_rad));
  // Place triangle: B at left, C at right bottom, A at top
  const Bx=W*0.1, By=H*0.85, Cx=W*0.9, Cy=H*0.85;
  const scale=(Cx-Bx)/c;
  const Ax=Bx+b*scale*Math.cos(Math.acos((b*b+c*c-a*a)/(2*b*c)));
  const Ay=By-b*scale*Math.sin(Math.acos((b*b+c*c-a*a)/(2*b*c)));
  const pts=`${Bx},${By} ${Cx},${Cy} ${Ax},${Ay}`;
  return (
    <svg width={W} height={H+20} style={{display:'block',margin:'0 auto'}}>
      <polygon points={pts} fill={`${color}10`} stroke={color} strokeWidth={2} strokeLinejoin="round"/>
      <text x={(Bx+Cx)/2} y={By+14} textAnchor="middle" fill={color} fontSize={12} fontFamily="JetBrains Mono,monospace">c={fmt(c,2)}</text>
      <text x={(Bx+Ax)/2-12} y={(By+Ay)/2} fill="rgba(78,205,196,0.9)" fontSize={12} fontFamily="JetBrains Mono,monospace">b={b}</text>
      <text x={(Cx+Ax)/2+6} y={(Cy+Ay)/2} fill="rgba(255,107,107,0.9)" fontSize={12} fontFamily="JetBrains Mono,monospace">a={a}</text>
      <text x={Bx-14} y={By+4} fill="rgba(255,255,255,0.7)" fontSize={13} fontFamily="Playfair Display,serif" fontWeight="bold">B</text>
      <text x={Cx+4} y={Cy+4} fill="rgba(255,255,255,0.7)" fontSize={13} fontFamily="Playfair Display,serif" fontWeight="bold">C</text>
      <text x={Ax-4} y={Ay-8} fill="rgba(255,255,255,0.7)" fontSize={13} fontFamily="Playfair Display,serif" fontWeight="bold">A</text>
      <text x={Cx-18} y={Cy-4} fill={color} fontSize={11} fontFamily="serif" fontStyle="italic">{C_deg}°</text>
    </svg>
  );
}

// ── Right Triangle (Heights & Distances) ───────────────────────
function HeightDistSVG({ angleDeg=30, height=50, color='#34D399', size=240 }) {
  const W=size, H=size*0.7, pad=20;
  const base=height/Math.tan(deg2rad(angleDeg));
  const maxBase=W-2*pad-20, scale=Math.min(1,(H-2*pad)/height,maxBase/base);
  const h=height*scale, b=base*scale;
  const Ox=pad, Oy=H-pad, Tx=pad+b, Ty=H-pad, Ax=pad+b, Ay=H-pad-h;
  return (
    <svg width={W} height={H+10} style={{display:'block',margin:'0 auto'}}>
      <line x1={Ox} y1={Oy} x2={Tx} y2={Ty} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5}/>
      <line x1={Tx} y1={Ty} x2={Ax} y2={Ay} stroke={color} strokeWidth={2.5}/>
      <line x1={Ox} y1={Oy} x2={Ax} y2={Ay} stroke="rgba(255,209,102,0.8)" strokeWidth={2} strokeDasharray="6,3"/>
      <rect x={Tx-8} y={Ty-8} width={8} height={8} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1}/>
      <text x={(Ox+Tx)/2} y={Oy+12} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={11} fontFamily="JetBrains Mono,monospace">d</text>
      <text x={Ax+6} y={(Ay+Ty)/2} fill={color} fontSize={11} fontFamily="JetBrains Mono,monospace">h</text>
      <text x={Ox+24} y={Oy-6} fill="rgba(255,209,102,0.9)" fontSize={11} fontFamily="serif" fontStyle="italic">θ={angleDeg}°</text>
      <text x={Ox+4} y={Oy-2} fill="rgba(255,255,255,0.6)" fontSize={11} fontFamily="Playfair Display,serif">O</text>
      <text x={Ax-4} y={Ay-6} fill="rgba(255,255,255,0.6)" fontSize={11} fontFamily="Playfair Display,serif">T</text>
    </svg>
  );
}
// ── Notation Table ─────────────────────────────────────────────
const NOTATION = [
  { sym:'\\theta,\\alpha,\\beta,\\gamma', name:'Greek angle letters', meaning:'Standard names for angles in trig', ex:'\\sin\\theta,\\;\\cos\\alpha,\\;\\tan\\beta' },
  { sym:'1°=\\frac{\\pi}{180}\\text{ rad}', name:'Degree ↔ Radian', meaning:'Conversion between the two angle systems', ex:'60°=\\frac{\\pi}{3},\\;\\frac{\\pi}{4}=45°' },
  { sym:'\\sin\\theta', name:'Sine', meaning:'Opposite / Hypotenuse  (y-coordinate on unit circle)', ex:'\\sin 30°=\\frac{1}{2}' },
  { sym:'\\cos\\theta', name:'Cosine', meaning:'Adjacent / Hypotenuse  (x-coordinate on unit circle)', ex:'\\cos 60°=\\frac{1}{2}' },
  { sym:'\\tan\\theta', name:'Tangent', meaning:'sin θ / cos θ = Opposite / Adjacent', ex:'\\tan 45°=1' },
  { sym:'\\cot\\theta', name:'Cotangent', meaning:'cos θ / sin θ = 1/tan θ', ex:'\\cot 90°=0' },
  { sym:'\\sec\\theta', name:'Secant', meaning:'1 / cos θ', ex:'\\sec 0°=1' },
  { sym:'\\csc\\theta', name:'Cosecant', meaning:'1 / sin θ', ex:'\\csc 90°=1' },
  { sym:'\\sin^2\\theta+\\cos^2\\theta=1', name:'Pythagorean Identity 1', meaning:'The fundamental trig identity', ex:'\\sin^2 30°+\\cos^2 30°=1' },
  { sym:'1+\\tan^2\\theta=\\sec^2\\theta', name:'Pythagorean Identity 2', meaning:'Derived from P.I.1 ÷ cos²θ', ex:'1+\\tan^2 45°=\\sec^2 45°=2' },
  { sym:'1+\\cot^2\\theta=\\csc^2\\theta', name:'Pythagorean Identity 3', meaning:'Derived from P.I.1 ÷ sin²θ', ex:'1+\\cot^2 45°=\\csc^2 45°=2' },
  { sym:'\\sin(A\\pm B)', name:'Sum/Difference (sin)', meaning:'sinA cosB ± cosA sinB', ex:'\\sin(A+B)=\\sin A\\cos B+\\cos A\\sin B' },
  { sym:'\\cos(A\\pm B)', name:'Sum/Difference (cos)', meaning:'cosA cosB ∓ sinA sinB', ex:'\\cos(A+B)=\\cos A\\cos B-\\sin A\\sin B' },
  { sym:'\\sin 2\\theta=2\\sin\\theta\\cos\\theta', name:'Double Angle (sin)', meaning:'Follows from sin(A+B) with A=B', ex:'\\sin 2\\cdot30°=\\sin 60°=\\frac{\\sqrt{3}}{2}' },
  { sym:'\\cos 2\\theta', name:'Double Angle (cos)', meaning:'cos²θ−sin²θ = 2cos²θ−1 = 1−2sin²θ', ex:'\\cos 2\\theta=2\\cos^2\\theta-1' },
  { sym:'\\tan 2\\theta=\\frac{2\\tan\\theta}{1-\\tan^2\\theta}', name:'Double Angle (tan)', meaning:'Follows from tan(A+B) with A=B', ex:'\\tan 2\\cdot45°=\\text{undefined}' },
  { sym:'\\sin\\frac{x}{2}=\\pm\\sqrt{\\frac{1-\\cos x}{2}}', name:'Half Angle (sin)', meaning:'Sign depends on quadrant of x/2', ex:'\\sin 15°=\\sin\\frac{30°}{2}' },
  { sym:'2\\sin A\\cos B', name:'Product → Sum', meaning:'= sin(A+B) + sin(A−B)', ex:'2\\sin 3x\\cos x=\\sin 4x+\\sin 2x' },
  { sym:'\\sin C+\\sin D', name:'Sum → Product', meaning:'= 2 sin((C+D)/2) cos((C−D)/2)', ex:'\\sin 70°+\\sin 30°' },
  { sym:'\\frac{a}{\\sin A}=\\frac{b}{\\sin B}=\\frac{c}{\\sin C}=2R', name:'Sine Rule', meaning:'Sides proportional to sines of opposite angles', ex:'\\frac{a}{\\sin A}=2R' },
  { sym:'a^2=b^2+c^2-2bc\\cos A', name:'Cosine Rule', meaning:'Generalises Pythagoras — for any triangle', ex:'c^2=a^2+b^2-2ab\\cos C' },
  { sym:'\\tan\\frac{A-B}{2}', name:"Napier's Analogy", meaning:'= (a−b)/(a+b) · cot(C/2)', ex:"\\text{Relates sides and half-angles}" },
  { sym:'\\sin^{-1}x', name:'Arcsine (ITF)', meaning:'Inverse of sin; principal value ∈ [−π/2, π/2]', ex:'\\sin^{-1}(\\frac{1}{2})=\\frac{\\pi}{6}' },
  { sym:'\\cos^{-1}x', name:'Arccosine (ITF)', meaning:'Inverse of cos; principal value ∈ [0, π]', ex:'\\cos^{-1}(\\frac{1}{2})=\\frac{\\pi}{3}' },
  { sym:'\\tan^{-1}x', name:'Arctangent (ITF)', meaning:'Inverse of tan; principal value ∈ (−π/2, π/2)', ex:'\\tan^{-1}(1)=\\frac{\\pi}{4}' },
  { sym:'e^{i\\theta}=\\cos\\theta+i\\sin\\theta', name:"Euler's Formula", meaning:'Connects complex exponentials to trig', ex:'e^{i\\pi}+1=0' },
  { sym:'(\\cos\\theta+i\\sin\\theta)^n', name:"De Moivre's Theorem", meaning:'= cos(nθ) + i·sin(nθ)', ex:'(\\cos\\frac{\\pi}{3}+i\\sin\\frac{\\pi}{3})^6=1' },
];

// ── Sections ───────────────────────────────────────────────────
const SECTIONS = [
  {
    id:'angles', title:'Angle Measurement & Radian System', level:'Foundation', color:'#4ECDC4', icon:'°→rad',
    shortDef:'Angles can be measured in degrees (°) or radians (rad). 180° = π radians.',
    fullDef:"The sexagesimal system divides a full rotation into 360°. The circular (radian) system defines an angle as the ratio of arc length to radius — making it dimensionless and mathematically natural. Since the full circumference is 2πr, a full turn = 2π radians. The conversion: multiply degrees by π/180 to get radians. Radians are used exclusively in calculus because the derivative of sin(x) is cos(x) only when x is in radians.",
    keyFacts:[
      {text:'Conversion: degrees to radians', l:'\\theta_{\\text{rad}}=\\theta_{\\deg}\\times\\frac{\\pi}{180}'},
      {text:'Conversion: radians to degrees', l:'\\theta_{\\deg}=\\theta_{\\text{rad}}\\times\\frac{180}{\\pi}'},
      {text:'Key equivalences', l:'30°=\\frac{\\pi}{6},\\;45°=\\frac{\\pi}{4},\\;60°=\\frac{\\pi}{3},\\;90°=\\frac{\\pi}{2},\\;180°=\\pi'},
      {text:'Arc length formula', l:'s=r\\theta\\;(\\theta\\text{ in radians})'},
      {text:'Area of sector', l:'A=\\frac{1}{2}r^2\\theta'},
    ], genKey:'angles', diagram:'unitcircle', diagramAngle:45,
  },
  {
    id:'trig_fns', title:'Six Trigonometric Functions', level:'Foundation', color:'#FF6B6B', icon:'sinθ',
    shortDef:'sin, cos, tan, cot, sec, csc — their definitions, domains, ranges, and periods.',
    fullDef:"On the unit circle, sin θ = y-coordinate and cos θ = x-coordinate of the point at angle θ. The other four functions are derived from these two. Key properties: sin and cos have period 2π and range [−1,1]. tan and cot have period π and range ℝ. sec and csc have range (−∞,−1]∪[1,∞). The ASTC (All Students Take Calculus) rule tells which functions are positive in each quadrant: All in Q1, Sin in Q2, Tan in Q3, Cos in Q4.",
    keyFacts:[
      {text:'ASTC rule (signs by quadrant)', l:'\\text{Q1: all +, Q2: sin+, Q3: tan+, Q4: cos+}'},
      {text:'sin range and period', l:'\\sin:\\text{Dom}=\\mathbb{R},\\;\\text{Ran}=[-1,1],\\;T=2\\pi'},
      {text:'tan domain (undefined at)', l:'\\tan:\\text{Dom}=\\mathbb{R}\\setminus\\{\\frac{\\pi}{2}+n\\pi\\},\\;T=\\pi'},
      {text:'sec domain', l:'\\sec:\\text{Dom}=\\mathbb{R}\\setminus\\{\\frac{\\pi}{2}+n\\pi\\},\\;\\text{Ran}=(-\\infty,-1]\\cup[1,\\infty)'},
      {text:'Reciprocal pairs', l:'\\sin\\cdot\\csc=1,\\;\\cos\\cdot\\sec=1,\\;\\tan\\cdot\\cot=1'},
    ], genKey:'trig_fns', diagram:'unitcircle', diagramAngle:60,
  },
  {
    id:'pyth_ids', title:'Pythagorean Identities', level:'Foundation', color:'#A78BFA', icon:'sin²+cos²',
    shortDef:'sin²θ + cos²θ = 1, and its two derived forms involving tan, sec, cot, csc.',
    fullDef:"These three identities are the bedrock of trigonometry. They all come from the single equation sin²θ + cos²θ = 1 (which is just the equation of the unit circle x² + y² = 1). Dividing through by cos²θ gives 1 + tan²θ = sec²θ. Dividing by sin²θ gives 1 + cot²θ = csc²θ. These identities are used everywhere: simplifying expressions, solving equations, and proving more complex identities.",
    keyFacts:[
      {text:'Identity 1 (fundamental)', l:'\\sin^2\\theta+\\cos^2\\theta=1'},
      {text:'Identity 2 (÷cos²θ)', l:'1+\\tan^2\\theta=\\sec^2\\theta'},
      {text:'Identity 3 (÷sin²θ)', l:'1+\\cot^2\\theta=\\csc^2\\theta'},
      {text:'Useful rearrangements', l:'\\sin^2\\theta=1-\\cos^2\\theta,\\;\\cos^2\\theta=1-\\sin^2\\theta'},
      {text:'From identity 2', l:'\\sec^2\\theta-\\tan^2\\theta=1,\\;\\sec^2\\theta-1=\\tan^2\\theta'},
    ], genKey:'pyth_ids',
  },
  {
    id:'sum_diff', title:'Sum & Difference Formulas', level:'Foundation', color:'#34D399', icon:'sin(A±B)',
    shortDef:'Formulas for sin(A±B), cos(A±B), tan(A±B) — expand or simplify compound angles.',
    fullDef:"These are among the most important formulas in all of mathematics. They let us compute trig functions at non-standard angles (e.g., sin 75° = sin(45°+30°)) and they underpin double angle, half angle, and product-to-sum formulas. A simple mnemonic: sin(A±B) = sinA cosB ± cosA sinB (same sign); cos(A±B) = cosA cosB ∓ sinA sinB (opposite sign).",
    keyFacts:[
      {text:'sin(A+B)', l:'\\sin(A+B)=\\sin A\\cos B+\\cos A\\sin B'},
      {text:'sin(A−B)', l:'\\sin(A-B)=\\sin A\\cos B-\\cos A\\sin B'},
      {text:'cos(A+B)', l:'\\cos(A+B)=\\cos A\\cos B-\\sin A\\sin B'},
      {text:'cos(A−B)', l:'\\cos(A-B)=\\cos A\\cos B+\\sin A\\sin B'},
      {text:'tan(A+B)', l:'\\tan(A+B)=\\frac{\\tan A+\\tan B}{1-\\tan A\\tan B}'},
      {text:'tan(A−B)', l:'\\tan(A-B)=\\frac{\\tan A-\\tan B}{1+\\tan A\\tan B}'},
    ], genKey:'sum_diff',
  },
  {
    id:'multiple_angles', title:'Multiple & Sub-Multiple Angle Formulas', level:'Foundation', color:'#F59E0B', icon:'sin2x',
    shortDef:'Double angle (sin 2θ, cos 2θ, tan 2θ) and half angle (sin θ/2, cos θ/2) formulas.',
    fullDef:"Double angle formulas come directly from the sum formulas with A = B = θ. cos 2θ has three equivalent forms — each useful in different contexts. The half-angle formulas follow by replacing θ with θ/2 in the double angle forms. The t-substitution (t = tan(θ/2)) lets you express all six trig functions in terms of a single variable — crucial for solving equations and evaluating integrals.",
    keyFacts:[
      {text:'sin 2θ', l:'\\sin 2\\theta=2\\sin\\theta\\cos\\theta'},
      {text:'cos 2θ — three forms', l:'\\cos 2\\theta=\\cos^2\\theta-\\sin^2\\theta=2\\cos^2\\theta-1=1-2\\sin^2\\theta'},
      {text:'tan 2θ', l:'\\tan 2\\theta=\\frac{2\\tan\\theta}{1-\\tan^2\\theta}'},
      {text:'sin 3θ', l:'\\sin 3\\theta=3\\sin\\theta-4\\sin^3\\theta'},
      {text:'cos 3θ', l:'\\cos 3\\theta=4\\cos^3\\theta-3\\cos\\theta'},
      {text:'Half angle: sin θ/2', l:'\\sin\\frac{\\theta}{2}=\\pm\\sqrt{\\frac{1-\\cos\\theta}{2}}'},
      {text:'Half angle: cos θ/2', l:'\\cos\\frac{\\theta}{2}=\\pm\\sqrt{\\frac{1+\\cos\\theta}{2}}'},
      {text:'t = tan(θ/2) substitution', l:'\\sin\\theta=\\frac{2t}{1+t^2},\\;\\cos\\theta=\\frac{1-t^2}{1+t^2},\\;t=\\tan\\frac{\\theta}{2}'},
    ], genKey:'multiple_angles',
  },
  {
    id:'transform', title:'Transformation Formulas (Product ↔ Sum)', level:'Foundation', color:'#60A5FA', icon:'2sinAcosB',
    shortDef:'Convert products of trig functions to sums/differences, and vice versa.',
    fullDef:"These formulas are derived directly from the sum and difference formulas. Adding and subtracting sin(A+B) and sin(A−B) gives the Product-to-Sum formulas. The reverse substitution (C = A+B, D = A−B) gives Sum-to-Product. These are critical for solving equations where the equation can be factored after conversion, and for evaluating trig series and products at the Olympiad level.",
    keyFacts:[
      {text:'2 sinA cosB', l:'2\\sin A\\cos B=\\sin(A+B)+\\sin(A-B)'},
      {text:'2 cosA sinB', l:'2\\cos A\\sin B=\\sin(A+B)-\\sin(A-B)'},
      {text:'2 cosA cosB', l:'2\\cos A\\cos B=\\cos(A-B)+\\cos(A+B)'},
      {text:'2 sinA sinB', l:'2\\sin A\\sin B=\\cos(A-B)-\\cos(A+B)'},
      {text:'sinC + sinD', l:'\\sin C+\\sin D=2\\sin\\frac{C+D}{2}\\cos\\frac{C-D}{2}'},
      {text:'cosC + cosD', l:'\\cos C+\\cos D=2\\cos\\frac{C+D}{2}\\cos\\frac{C-D}{2}'},
      {text:'sinC − sinD', l:'\\sin C-\\sin D=2\\cos\\frac{C+D}{2}\\sin\\frac{C-D}{2}'},
      {text:'cosC − cosD', l:'\\cos C-\\cos D=-2\\sin\\frac{C+D}{2}\\sin\\frac{C-D}{2}'},
    ], genKey:'transform',
  },
  {
    id:'trig_eqs', title:'Trigonometric Equations', level:'JEE', color:'#EC4899', icon:'θ=?',
    shortDef:'Find the general solution — all angles satisfying sin θ = k, cos θ = k, or tan θ = k.',
    fullDef:"Trig equations have infinitely many solutions because trig functions are periodic. The general solution captures all of them using integers n. For sin θ = k: θ = nπ + (−1)ⁿ α, where sin α = k. For cos θ = k: θ = 2nπ ± α. For tan θ = k: θ = nπ + α. The key step is always (1) find the principal value α in the standard range, then (2) apply the general formula. For equations of the form a cos θ + b sin θ = c, divide through by √(a²+b²) to convert to a standard form.",
    keyFacts:[
      {text:'General: sin θ = sin α', l:'\\theta=n\\pi+(-1)^n\\alpha,\\;n\\in\\mathbb{Z}'},
      {text:'General: cos θ = cos α', l:'\\theta=2n\\pi\\pm\\alpha,\\;n\\in\\mathbb{Z}'},
      {text:'General: tan θ = tan α', l:'\\theta=n\\pi+\\alpha,\\;n\\in\\mathbb{Z}'},
      {text:'a cosθ + b sinθ = c form', l:'\\sqrt{a^2+b^2}\\cos(\\theta-\\phi)=c,\\;\\tan\\phi=\\frac{b}{a}'},
      {text:'Maximum of a cosθ + b sinθ', l:'R=\\sqrt{a^2+b^2}'},
    ], genKey:'trig_eqs',
  },
  {
    id:'itf', title:'Inverse Trigonometric Functions (ITF)', level:'JEE', color:'#8B5CF6', icon:'sin⁻¹x',
    shortDef:'arcsin, arccos, arctan — principal value branches, domains, and key identities.',
    fullDef:"Trig functions are not one-to-one globally, so we restrict their domains to define true inverses. sin⁻¹x has domain [−1,1] and principal value [−π/2, π/2]. cos⁻¹x has domain [−1,1] and principal value [0, π]. tan⁻¹x has domain ℝ and principal value (−π/2, π/2). Key identities include sin⁻¹x + cos⁻¹x = π/2 and tan⁻¹x + cot⁻¹x = π/2. The formula sin⁻¹x + sin⁻¹y = sin⁻¹(x√(1−y²) + y√(1−x²)) is frequently tested in JEE.",
    keyFacts:[
      {text:'Principal value branches', l:'\\sin^{-1}:[-\\frac{\\pi}{2},\\frac{\\pi}{2}],\\;\\cos^{-1}:[0,\\pi],\\;\\tan^{-1}:(-\\frac{\\pi}{2},\\frac{\\pi}{2})'},
      {text:'Complementary pair', l:'\\sin^{-1}x+\\cos^{-1}x=\\frac{\\pi}{2},\\;x\\in[-1,1]'},
      {text:'tan⁻¹ complement', l:'\\tan^{-1}x+\\cot^{-1}x=\\frac{\\pi}{2}'},
      {text:'Negative argument', l:'\\sin^{-1}(-x)=-\\sin^{-1}x,\\;\\cos^{-1}(-x)=\\pi-\\cos^{-1}x'},
      {text:'tan⁻¹x + tan⁻¹y (|xy|<1)', l:'\\tan^{-1}x+\\tan^{-1}y=\\tan^{-1}\\frac{x+y}{1-xy}'},
      {text:'2tan⁻¹x identity', l:'2\\tan^{-1}x=\\sin^{-1}\\frac{2x}{1+x^2}=\\cos^{-1}\\frac{1-x^2}{1+x^2}'},
    ], genKey:'itf',
  },
  {
    id:'sine_cosine_rule', title:'Sine Rule & Cosine Rule', level:'JEE', color:'#F97316', icon:'a/sinA',
    shortDef:'Sine rule: a/sinA = 2R. Cosine rule: a² = b²+c² − 2bc cosA.',
    fullDef:"The Sine Rule connects each side to its opposite angle and the circumradius R: a/sinA = b/sinB = c/sinC = 2R. It is used when you know two angles and a side (AAS), or two sides and a non-included angle (SSA — the ambiguous case). The Cosine Rule generalises the Pythagorean theorem — when C = 90°, it reduces to c² = a² + b². It is used for SAS or SSS triangles. The area of a triangle: Δ = (1/2)ab sinC.",
    keyFacts:[
      {text:'Sine rule', l:'\\frac{a}{\\sin A}=\\frac{b}{\\sin B}=\\frac{c}{\\sin C}=2R'},
      {text:'Cosine rule (side a)', l:'a^2=b^2+c^2-2bc\\cos A'},
      {text:'Cosine rule (angle A)', l:'\\cos A=\\frac{b^2+c^2-a^2}{2bc}'},
      {text:'Area of triangle', l:'\\Delta=\\frac{1}{2}ab\\sin C=\\frac{1}{2}bc\\sin A=\\frac{1}{2}ca\\sin B'},
      {text:'Heron\'s formula', l:'\\Delta=\\sqrt{s(s-a)(s-b)(s-c)},\\;s=\\frac{a+b+c}{2}'},
      {text:'R (circumradius)', l:'R=\\frac{abc}{4\\Delta}'},
      {text:'r (inradius)', l:'r=\\frac{\\Delta}{s}'},
    ], genKey:'sine_cosine_rule', diagram:'triangle',
  },
  {
    id:'projection', title:'Projection Formula & Napier\'s Analogies', level:'JEE', color:'#2DD4BF', icon:'a=b cosC+c cosB',
    shortDef:'Projection: each side equals the sum of projections of the other two. Napier\'s: relates half-angles to sides.',
    fullDef:"The Projection Formulas state: a = b cosC + c cosB, b = a cosC + c cosA, c = a cosB + b cosA. They follow directly from the sine and cosine rules and are useful for proving other identities. Napier's Analogies are four equations relating the tangents of half the sum/difference of two angles to the corresponding sides. They are especially useful for solving a triangle when two sides and the included angle are known.",
    keyFacts:[
      {text:'Projection formula', l:'a=b\\cos C+c\\cos B'},
      {text:'Napier\'s analogy 1', l:'\\tan\\frac{A-B}{2}=\\frac{a-b}{a+b}\\cot\\frac{C}{2}'},
      {text:'Napier\'s analogy 2', l:'\\tan\\frac{B-C}{2}=\\frac{b-c}{b+c}\\cot\\frac{A}{2}'},
      {text:'Half-angle formula (sin)', l:'\\sin\\frac{A}{2}=\\sqrt{\\frac{(s-b)(s-c)}{bc}}'},
      {text:'Half-angle formula (cos)', l:'\\cos\\frac{A}{2}=\\sqrt{\\frac{s(s-a)}{bc}}'},
      {text:'Half-angle formula (tan)', l:'\\tan\\frac{A}{2}=\\sqrt{\\frac{(s-b)(s-c)}{s(s-a)}}=\\frac{r}{s-a}'},
    ], genKey:'projection',
  },
  {
    id:'heights', title:'Heights & Distances', level:'JEE', color:'#FCD34D', icon:'tanθ=h/d',
    shortDef:'Use angles of elevation and depression with trig ratios to find heights and distances.',
    fullDef:"Angles of elevation are measured upward from the horizontal; angles of depression are measured downward. The standard approach: draw a clear diagram, identify the right triangle, set up the trig ratio (usually tan = opposite/adjacent), and solve. Two-position problems (observer moves to a new point) require setting up simultaneous equations. Always check whether the answer is reasonable — heights and distances must be positive.",
    keyFacts:[
      {text:'Basic setup', l:'\\tan(\\text{elevation angle})=\\frac{\\text{height}}{\\text{horizontal distance}}'},
      {text:'Angle of elevation formula', l:'h=d\\tan\\theta'},
      {text:'Two observers, same height', l:'h=\\frac{d\\tan\\alpha\\tan\\beta}{\\tan\\alpha-\\tan\\beta}\\;(\\alpha>\\beta)'},
      {text:'When observer is at height H above base', l:'\\tan\\theta=\\frac{h-H}{d}'},
      {text:'Elevation + Depression same object', l:'\\text{elevation}=\\text{depression for objects at same level}'},
    ], genKey:'heights', diagram:'heightdist',
  },
  {
    id:'conditional', title:'Conditional Identities (A+B+C=π)', level:'Olympiad', color:'#C084FC', icon:'A+B+C=π',
    shortDef:'Special identities that hold when A, B, C are angles of a triangle (A+B+C = π).',
    fullDef:"When A+B+C = π (as in any triangle), many beautiful identities emerge. The key technique: replace C = π−A−B and use sin(π−x) = sin x, cos(π−x) = −cos x. Famous examples: sin 2A + sin 2B + sin 2C = 4 sinA sinB sinC; cos A + cos B + cos C = 1 + r/R. These identities require recognising the constraint and systematically applying it, making them ideal for olympiad problem solving.",
    keyFacts:[
      {text:'Key trick: C = π − A − B', l:'\\sin C=\\sin(A+B),\\;\\cos C=-\\cos(A+B)'},
      {text:'Sum of double angles', l:'\\sin 2A+\\sin 2B+\\sin 2C=4\\sin A\\sin B\\sin C'},
      {text:'Sum of sines', l:'\\sin A+\\sin B+\\sin C=4\\cos\\frac{A}{2}\\cos\\frac{B}{2}\\cos\\frac{C}{2}'},
      {text:'Sum of cosines', l:'\\cos A+\\cos B+\\cos C=1+\\frac{r}{R}'},
      {text:'Product identity', l:'\\tan A+\\tan B+\\tan C=\\tan A\\tan B\\tan C\\;(A+B+C=\\pi)'},
      {text:'Sum of cos(2A)', l:'\\cos 2A+\\cos 2B+\\cos 2C=-1-4\\cos A\\cos B\\cos C'},
    ], genKey:'conditional',
  },
  {
    id:'trig_series', title:'Trig Sums, Products & Series', level:'Olympiad', color:'#818CF8', icon:'∑sin(nx)',
    shortDef:'Evaluate sums like sin α + sin(α+β) + … and telescoping products like ∏ cos(2ⁿx).',
    fullDef:"Arithmetic sums: sin α + sin(α+β) + sin(α+2β) + … + sin(α+(n−1)β) = sin(α + (n−1)β/2)·sin(nβ/2)/sin(β/2). This follows from the sum-to-product formula. Telescoping products: the product cos x · cos 2x · cos 4x · … · cos(2ⁿ⁻¹x) = sin(2ⁿx)/(2ⁿ sin x). This comes from repeatedly using the identity 2 sin x cos x = sin 2x. These techniques are central to olympiad trigonometry.",
    keyFacts:[
      {text:'Arithmetic sum of sines', l:'\\sum_{k=0}^{n-1}\\sin(\\alpha+k\\beta)=\\frac{\\sin(n\\beta/2)}{\\sin(\\beta/2)}\\sin\\left(\\alpha+\\frac{(n-1)\\beta}{2}\\right)'},
      {text:'Arithmetic sum of cosines', l:'\\sum_{k=0}^{n-1}\\cos(\\alpha+k\\beta)=\\frac{\\sin(n\\beta/2)}{\\sin(\\beta/2)}\\cos\\left(\\alpha+\\frac{(n-1)\\beta}{2}\\right)'},
      {text:'Telescoping product', l:'\\prod_{k=0}^{n-1}\\cos(2^k x)=\\frac{\\sin(2^n x)}{2^n\\sin x}'},
      {text:'Key product trick', l:'2\\sin x\\cos x=\\sin 2x\\Rightarrow\\cos x=\\frac{\\sin 2x}{2\\sin x}'},
      {text:'Series: cos(2πk/n)', l:'\\sum_{k=0}^{n-1}\\cos\\frac{2\\pi k}{n}=0\\;(n\\geq 2)'},
    ], genKey:'trig_series',
  },
  {
    id:'trig_ineq', title:'Trigonometric Inequalities', level:'Olympiad', color:'#F87171', icon:'sin+cos≤√2',
    shortDef:'Use AM-GM, Jensen\'s inequality, and bounded range to find max/min of trig expressions.',
    fullDef:"Since |sin x| ≤ 1 and |cos x| ≤ 1, trig functions have built-in bounds. The maximum of a cos x + b sin x is √(a²+b²). By AM-GM: (sin x + cos x)² = 1 + 2 sin x cos x = 1 + sin 2x ≤ 2, so sin x + cos x ≤ √2. Jensen's inequality: for convex f, f((x₁+x₂+…+xₙ)/n) ≤ (f(x₁)+…+f(xₙ))/n. Since sin is concave on [0,π], Jensen gives sin A + sin B + sin C ≤ 3√3/2 for triangle angles, with equality when A=B=C=60°.",
    keyFacts:[
      {text:'Max of linear combination', l:'\\max(a\\cos x+b\\sin x)=\\sqrt{a^2+b^2}'},
      {text:'sin x + cos x bounded', l:'-\\sqrt{2}\\leq\\sin x+\\cos x\\leq\\sqrt{2}'},
      {text:'AM-GM on trig', l:'\\sin x+\\frac{1}{\\sin x}\\geq 2\\;(x\\in(0,\\pi))'},
      {text:'Jensen (sin concave on [0,π])', l:'\\sin A+\\sin B+\\sin C\\leq\\frac{3\\sqrt{3}}{2}\\;(A+B+C=\\pi)'},
      {text:'Equality condition', l:'\\text{Equality when }A=B=C=60°\\text{ (equilateral triangle)}'},
      {text:'cos A + cos B + cos C ≤ 3/2', l:'\\cos A+\\cos B+\\cos C\\leq\\frac{3}{2},\\;A+B+C=\\pi'},
    ], genKey:'trig_ineq',
  },
  {
    id:'demoivre', title:"De Moivre's Theorem & Euler's Formula", level:'Olympiad', color:'#FCD34D', icon:'e^{iθ}',
    shortDef:"e^{iθ} = cos θ + i sin θ. (cos θ + i sin θ)ⁿ = cos(nθ) + i sin(nθ).",
    fullDef:"Euler's formula e^{iθ} = cos θ + i sin θ is called 'the most beautiful equation in mathematics' because it connects five fundamental constants in e^{iπ}+1=0. De Moivre's theorem follows: (cos θ + i sin θ)ⁿ = cos(nθ) + i sin(nθ). This gives a powerful method for: (1) expanding sin(nθ), cos(nθ) in terms of sin θ, cos θ; (2) finding nth roots of complex numbers; (3) summing trig series using geometric series of complex numbers.",
    keyFacts:[
      {text:"Euler's formula", l:'e^{i\\theta}=\\cos\\theta+i\\sin\\theta'},
      {text:"De Moivre's theorem", l:'(\\cos\\theta+i\\sin\\theta)^n=\\cos n\\theta+i\\sin n\\theta'},
      {text:'Most beautiful equation', l:'e^{i\\pi}+1=0'},
      {text:'nth roots of unity', l:'z^n=1\\Rightarrow z=e^{2\\pi ik/n},\\;k=0,1,...,n-1'},
      {text:'cos(nθ) from binomial', l:'\\text{Take real part of }(\\cos\\theta+i\\sin\\theta)^n'},
      {text:'Trig series via geometric sum', l:'\\sum_{k=0}^{n-1}e^{ik\\theta}=\\frac{1-e^{in\\theta}}{1-e^{i\\theta}}'},
    ], genKey:'demoivre',
  },
  {
    id:'geometry_thms', title:'Ceva, Menelaus & Ptolemy', level:'Olympiad', color:'#86EFAC', icon:'Ptolemy',
    shortDef:"Ceva's theorem (concurrent cevians), Menelaus's (collinear points), Ptolemy's (cyclic quadrilateral).",
    fullDef:"Ceva's Theorem: Cevians AD, BE, CF of triangle ABC are concurrent iff (AF/FB)·(BD/DC)·(CE/EA) = 1. The trigonometric form: (sin∠BAD/sin∠CAD)·(sin∠CBE/sin∠ABE)·(sin∠ACF/sin∠BCF) = 1. Menelaus's Theorem: Points D, E, F on sides BC, CA, AB (or extensions) are collinear iff (AF/FB)·(BD/DC)·(CE/EA) = −1 (with signed ratios). Ptolemy's Theorem: For a cyclic quadrilateral ABCD, AC·BD = AB·CD + AD·BC. The equality case of the triangle inequality for complex numbers gives Ptolemy directly via |z₁+z₂| ≤ |z₁|+|z₂|.",
    keyFacts:[
      {text:"Ceva's theorem", l:'\\frac{AF}{FB}\\cdot\\frac{BD}{DC}\\cdot\\frac{CE}{EA}=1\\;(\\text{concurrent})'},
      {text:'Trig-Ceva', l:'\\frac{\\sin\\angle BAD}{\\sin\\angle CAD}\\cdot\\frac{\\sin\\angle CBE}{\\sin\\angle ABE}\\cdot\\frac{\\sin\\angle ACF}{\\sin\\angle BCF}=1'},
      {text:"Menelaus's theorem", l:'\\frac{AF}{FB}\\cdot\\frac{BD}{DC}\\cdot\\frac{CE}{EA}=-1\\;(\\text{collinear, signed})'},
      {text:"Ptolemy's theorem", l:'AC\\cdot BD=AB\\cdot CD+AD\\cdot BC\\;(\\text{cyclic quad})'},
      {text:"Ptolemy's inequality", l:'AC\\cdot BD\\leq AB\\cdot CD+AD\\cdot BC\\;(\\text{any quad})'},
    ], genKey:'geometry_thms',
  },
];
// ── Procedural Question Generators ────────────────────────────
const GENERATORS = {
  angles:(n)=>{
    const pairs=[{d:30,r:'\\frac{\\pi}{6}'},{d:45,r:'\\frac{\\pi}{4}'},{d:60,r:'\\frac{\\pi}{3}'},{d:90,r:'\\frac{\\pi}{2}'},{d:120,r:'\\frac{2\\pi}{3}'},{d:135,r:'\\frac{3\\pi}{4}'},{d:150,r:'\\frac{5\\pi}{6}'},{d:180,r:'\\pi'},{d:270,r:'\\frac{3\\pi}{2}'},{d:240,r:'\\frac{4\\pi}{3}'},{d:300,r:'\\frac{5\\pi}{3}'},{d:315,r:'\\frac{7\\pi}{4}'}];
    const mode=n%3;
    if(mode===0){
      const p=pairs[n%pairs.length];
      return{question:`Convert ${p.d}° to radians.`,questionLatex:`\\text{Convert }${p.d}^\\circ\\text{ to radians.}`,steps:[`Multiply by π/180`,`${p.d}° × π/180 = ${p.d}/180 × π`,`Simplify: ${p.r} rad`],answer:`${p.r} radians`,answerLatex:`${p.d}^\\circ = ${p.r}\\text{ rad}`,tip:'Multiply degrees by π/180. Simplify the fraction by dividing numerator and denominator by their GCD.'};
    } else if(mode===1){
      const p=pairs[n%pairs.length];
      return{question:`Convert ${p.r} radians to degrees.`,questionLatex:`\\text{Convert }${p.r}\\text{ rad to degrees.}`,steps:[`Multiply by 180/π`,`${p.r} × 180/π = ${p.d}°`],answer:`${p.d}°`,answerLatex:`${p.r}\\text{ rad} = ${p.d}^\\circ`,tip:'Multiply radians by 180/π. For fractions of π, the π cancels cleanly.'};
    } else {
      const r=srI(n+1,2,10),theta_num=srI(n+2,1,8),theta_den=srI(n+3,3,6);
      const thetaRad=theta_num*Math.PI/theta_den;
      const arc=+(r*thetaRad).toFixed(4),area=+(0.5*r*r*thetaRad).toFixed(4);
      return{question:`A circle has radius r = ${r} cm. A sector has central angle θ = ${theta_num}π/${theta_den} rad. Find (a) arc length and (b) sector area.`,questionLatex:`r=${r},\\;\\theta=\\frac{${theta_num}\\pi}{${theta_den}}.\\text{ Find arc length and sector area.}`,steps:[`Arc length s = rθ = ${r} × ${theta_num}π/${theta_den}`,`s = ${r*theta_num}π/${theta_den} = ${fmt(arc,4)} cm`,`Sector area A = ½r²θ = ½ × ${r}² × ${theta_num}π/${theta_den}`,`A = ${fmt(area,4)} cm²`],answer:`Arc = ${fmt(arc,4)} cm, Area = ${fmt(area,4)} cm²`,answerLatex:`s=${fmt(arc,4)}\\text{ cm},\\;A=${fmt(area,4)}\\text{ cm}^2`,tip:'s = rθ and A = ½r²θ — θ MUST be in radians for these formulas.'};
    }
  },
  trig_fns:(n)=>{
    const stdA=[30,45,60,0,90,120,135,150,180,210,270,300,330];
    const deg=stdA[n%stdA.length];
    const rad=deg2rad(deg);
    const s=Math.sin(rad),c=Math.cos(rad),t=Math.tan(rad);
    const fn_idx=n%6;
    const fns=[{name:'sin',val:s,exact:sinExact[deg]||fmt(s,4)},{name:'cos',val:c,exact:cosExact[deg]||fmt(c,4)},{name:'tan',val:t,exact:Math.abs(t)>1e5?'undefined':fmt(t,4)},{name:'cot',val:1/t,exact:Math.abs(t)<1e-9?'undefined':fmt(1/t,4)},{name:'sec',val:1/c,exact:Math.abs(c)<1e-9?'undefined':fmt(1/c,4)},{name:'csc',val:1/s,exact:Math.abs(s)<1e-9?'undefined':fmt(1/s,4)}];
    const f=fns[fn_idx];
    const quadrant=deg<=90?1:deg<=180?2:deg<=270?3:4;
    const qSign={sin:['+','+','-','-'],cos:['+','-','-','+'],tan:['+','-','+','-'],sec:['+','-','-','+'],csc:['+','+','-','-'],cot:['+','-','+','-']};
    return{question:`Find the exact value of ${f.name}(${deg}°). Also state the sign of ${f.name} in quadrant ${quadrant}.`,questionLatex:`\\${f.name===f.name?f.name:'operatorname{'+f.name+'}'} ${deg}^\\circ = ?`,steps:[`${deg}° is in quadrant ${quadrant}`,`Reference angle = ${deg<=90?deg:deg<=180?180-deg:deg<=270?deg-180:360-deg}°`,`In Q${quadrant}: ${f.name} is ${qSign[f.name]?.[quadrant-1]} `,`${f.name}(${deg}°) = ${f.exact}`],answer:`${f.name}(${deg}°) = ${f.exact}`,answerLatex:`\\${f.name} ${deg}^\\circ = ${f.exact}`,tip:'ASTC rule: All positive Q1, Sin positive Q2, Tan positive Q3, Cos positive Q4.'};
  },
  pyth_ids:(n)=>{
    const templates=[
      (s)=>{const deg=srP([30,45,60,25,37,53],s);const r=deg2rad(deg);const sinV=Math.sin(r),cosV=Math.cos(r);return{q:`Verify: sin²(${deg}°) + cos²(${deg}°) = 1`,steps:[`sin(${deg}°) = ${fmt(sinV,6)}`,`cos(${deg}°) = ${fmt(cosV,6)}`,`sin²(${deg}°) = ${fmt(sinV*sinV,8)}`,`cos²(${deg}°) = ${fmt(cosV*cosV,8)}`,`Sum = ${fmt(sinV*sinV+cosV*cosV,10)} ≈ 1 ✓`],ans:'1 (verified)',ansL:`\\sin^2${deg}°+\\cos^2${deg}°=1\\;✓`};},
      (s)=>{const val=srI(s,1,4)/5;const cosV=Math.sqrt(1-val*val);return{q:`If sin θ = ${val.toFixed(2)} and θ is in Q1, find cos θ, tan θ, sec θ.`,steps:[`sin²θ + cos²θ = 1`,`cos²θ = 1 − sin²θ = 1 − ${fmt(val*val,4)} = ${fmt(1-val*val,4)}`,`cos θ = ${fmt(cosV,6)} (positive in Q1)`,`tan θ = sin θ/cos θ = ${fmt(val/cosV,6)}`,`sec θ = 1/cos θ = ${fmt(1/cosV,6)}`],ans:`cos=${fmt(cosV,4)}, tan=${fmt(val/cosV,4)}, sec=${fmt(1/cosV,4)}`,ansL:`\\cos\\theta=${fmt(cosV,4)},\\;\\tan\\theta=${fmt(val/cosV,4)},\\;\\sec\\theta=${fmt(1/cosV,4)}`};},
      (s)=>{const tanV=srI(s,1,4);return{q:`Simplify: (1 + tan²θ) − sec²θ`,steps:[`Identity: 1 + tan²θ = sec²θ`,`So (1 + tan²θ) − sec²θ = sec²θ − sec²θ = 0`],ans:'0',ansL:`(1+\\tan^2\\theta)-\\sec^2\\theta=0`};},
      (s)=>{const deg=srP([30,60,45,37],s);const r=deg2rad(deg),tv=Math.tan(r),sv=Math.sin(r),cv=Math.cos(r);return{q:`Verify 1 + tan²(${deg}°) = sec²(${deg}°) numerically.`,steps:[`tan(${deg}°) = ${fmt(tv,6)}`,`1 + tan²(${deg}°) = 1 + ${fmt(tv*tv,6)} = ${fmt(1+tv*tv,6)}`,`sec(${deg}°) = 1/cos(${deg}°) = ${fmt(1/cv,6)}`,`sec²(${deg}°) = ${fmt(1/(cv*cv),6)}`,`LHS = RHS ✓`],ans:'Verified ✓',ansL:`1+\\tan^2(${deg}°)=\\sec^2(${deg}°)\\;✓`};},
    ];
    const t=templates[n%templates.length](n*13+5);
    return{question:t.q,questionLatex:t.q,steps:t.steps,answer:t.ans,answerLatex:t.ansL,tip:'Pythagorean identities: memorise all three forms. The most common manipulation is expressing one function in terms of another.'};
  },
  sum_diff:(n)=>{
    const pairs=[{A:45,B:30},{A:60,B:45},{A:90,B:30},{A:120,B:60},{A:75,B:0,note:'75=45+30'},{A:15,B:0,note:'15=45-30'},{A:105,B:0,note:'105=60+45'}];
    const mode=n%4;
    if(mode===0){
      const a=srP([45,60,30,120],n),b=srP([30,45,60],n+7);
      const r1=deg2rad(a),r2=deg2rad(b);
      const exact=fmt(Math.sin(r1)*Math.cos(r2)+Math.cos(r1)*Math.sin(r2),6);
      return{question:`Find sin(${a}° + ${b}°) using the sum formula.`,questionLatex:`\\sin(${a}°+${b}°)=?`,steps:[`sin(A+B) = sinA cosB + cosA sinB`,`sin(${a}°)cos(${b}°) + cos(${a}°)sin(${b}°)`,`= ${sinExact[a]||fmt(Math.sin(r1),4)} × ${cosExact[b]||fmt(Math.cos(r2),4)} + ${cosExact[a]||fmt(Math.cos(r1),4)} × ${sinExact[b]||fmt(Math.sin(r2),4)}`,`= ${exact}`,`Check: sin(${a+b}°) = ${fmt(Math.sin(deg2rad(a+b)),6)} ✓`],answer:`sin(${a+b}°) = ${exact}`,answerLatex:`\\sin(${a+b}°)=${sinExact[a+b]||exact}`,tip:'sin(A+B): same signs on left and right. cos(A+B): opposite signs (cos changes sign).'};
    } else if(mode===1){
      const a=srP([60,90,120,45],n),b=srP([30,45,60],n+3);
      const r1=deg2rad(a),r2=deg2rad(b);
      const exact=fmt(Math.cos(r1)*Math.cos(r2)-Math.sin(r1)*Math.sin(r2),6);
      return{question:`Find cos(${a}° − ${b}°) using the difference formula.`,questionLatex:`\\cos(${a}°-${b}°)=?`,steps:[`cos(A−B) = cosA cosB + sinA sinB`,`cos(${a}°)cos(${b}°) + sin(${a}°)sin(${b}°)`,`= ${cosExact[a]||fmt(Math.cos(r1),4)} × ${cosExact[b]||fmt(Math.cos(r2),4)} + ${sinExact[a]||fmt(Math.sin(r1),4)} × ${sinExact[b]||fmt(Math.sin(r2),4)}`,`= ${fmt(Math.cos(deg2rad(a-b)),6)}`],answer:`cos(${a-b}°) = ${cosExact[a-b]||fmt(Math.cos(deg2rad(a-b)),6)}`,answerLatex:`\\cos(${a-b}°)=${cosExact[a-b]||fmt(Math.cos(deg2rad(a-b)),6)}`,tip:'cos(A−B) has a + sign. cos(A+B) has a − sign. It\'s the opposite of sin!'};
    } else if(mode===2){
      const special_angle=srP([75,15,105,195],n);
      const parts={75:[45,30,'+',' '],15:[45,30,'-',' '],105:[60,45,'+',' '],195:[240,45,'-',' ']};
      const [a,b,sign]=parts[special_angle]||[45,30,'+'];
      const deg_val=sign==='+'?a+b:a-b;
      const r=deg2rad(deg_val);
      return{question:`Find the exact value of sin(${special_angle}°) = sin(${a}° ${sign} ${b}°).`,questionLatex:`\\sin(${special_angle}°)=\\sin(${a}°${sign}${b}°)=?`,steps:[`sin(${a}° ${sign} ${b}°) = sin${a}°cos${b}° ${sign} cos${a}°sin${b}°`,`= ${sinExact[a]||fmt(Math.sin(deg2rad(a)),4)} × ${cosExact[b]||fmt(Math.cos(deg2rad(b)),4)} ${sign} ${cosExact[a]||fmt(Math.cos(deg2rad(a)),4)} × ${sinExact[b]||fmt(Math.sin(deg2rad(b)),4)}`,`= ${fmt(Math.sin(r),6)}`],answer:`sin(${special_angle}°) = ${fmt(Math.sin(r),6)}`,answerLatex:`\\sin(${special_angle}°)=${fmt(Math.sin(r),6)}`,tip:'For angles like 75°, 15°, 105° — split into two standard angles (multiples of 30° or 45°).'};
    } else {
      const tanA=srI(n+1,1,4),tanB=srI(n+2,1,3);
      const tanSum=(tanA+tanB)/(1-tanA*tanB);
      return{question:`If tan A = ${tanA} and tan B = ${tanB}, find tan(A+B).`,questionLatex:`\\tan A=${tanA},\\;\\tan B=${tanB}.\\text{ Find }\\tan(A+B).`,steps:[`tan(A+B) = (tanA + tanB)/(1 − tanA·tanB)`,`= (${tanA} + ${tanB})/(1 − ${tanA}×${tanB})`,`= ${tanA+tanB}/${1-tanA*tanB}`,`= ${fmt(tanSum,6)}`],answer:`tan(A+B) = ${fmt(tanSum,6)}`,answerLatex:`\\tan(A+B)=${fmt(tanSum,6)}`,tip:'tan(A+B): numerator = sum of tans, denominator = 1 − product of tans.'};
    }
  },
  multiple_angles:(n)=>{
    const mode=n%5;
    const degs=[15,22.5,30,45,60,75];
    const deg=degs[n%degs.length];
    const r=deg2rad(deg),s=Math.sin(r),c=Math.cos(r),t=Math.tan(r);
    if(mode===0){
      return{question:`Find sin(2×${deg}°) = sin(${2*deg}°) using the double angle formula.`,questionLatex:`\\sin(2\\times${deg}°)=?`,steps:[`sin(2θ) = 2 sin θ cos θ`,`sin(${deg}°) = ${fmt(s,6)}, cos(${deg}°) = ${fmt(c,6)}`,`sin(${2*deg}°) = 2 × ${fmt(s,6)} × ${fmt(c,6)}`,`= ${fmt(2*s*c,6)}`,`Verify: direct sin(${2*deg}°) = ${fmt(Math.sin(deg2rad(2*deg)),6)} ✓`],answer:`sin(${2*deg}°) = ${sinExact[2*deg]||fmt(Math.sin(deg2rad(2*deg)),6)}`,answerLatex:`\\sin(${2*deg}°)=${sinExact[2*deg]||fmt(Math.sin(deg2rad(2*deg)),6)}`,tip:'sin(2θ) = 2 sinθ cosθ — remember, there\'s a FACTOR of 2 in front.'};
    } else if(mode===1){
      return{question:`Find cos(2×${deg}°) = cos(${2*deg}°) using all three forms.`,questionLatex:`\\cos(${2*deg}°)=?\\text{ (three forms)}`,steps:[`Form 1: cos²θ − sin²θ = ${fmt(c*c-s*s,6)}`,`Form 2: 2cos²θ − 1 = 2×${fmt(c*c,6)} − 1 = ${fmt(2*c*c-1,6)}`,`Form 3: 1 − 2sin²θ = 1 − 2×${fmt(s*s,6)} = ${fmt(1-2*s*s,6)}`,`All three equal ${fmt(Math.cos(deg2rad(2*deg)),6)} ✓`],answer:`cos(${2*deg}°) = ${cosExact[2*deg]||fmt(Math.cos(deg2rad(2*deg)),6)}`,answerLatex:`\\cos(${2*deg}°)=${cosExact[2*deg]||fmt(Math.cos(deg2rad(2*deg)),6)}`,tip:'Three forms of cos(2θ): memorise all three. Use whichever is convenient — 2cos²θ−1 when you know cos, 1−2sin²θ when you know sin.'};
    } else if(mode===2){
      const halfdeg=deg/2;
      return{question:`Find sin(${halfdeg}°) using the half-angle formula, given cos(${deg}°).`,questionLatex:`\\sin(${halfdeg}°)=\\sin\\frac{${deg}°}{2}=?`,steps:[`Half-angle: sin(θ/2) = ±√((1−cosθ)/2)`,`cos(${deg}°) = ${cosExact[deg]||fmt(c,6)}`,`sin²(${halfdeg}°) = (1 − ${fmt(c,6)})/2 = ${fmt((1-c)/2,6)}`,`sin(${halfdeg}°) = +√${fmt((1-c)/2,6)} = ${fmt(Math.sqrt((1-c)/2),6)}  (positive: ${halfdeg}° in Q1)`],answer:`sin(${halfdeg}°) = ${fmt(Math.sin(deg2rad(halfdeg)),6)}`,answerLatex:`\\sin(${halfdeg}°)=${fmt(Math.sin(deg2rad(halfdeg)),6)}`,tip:'Half-angle sign: check which quadrant θ/2 falls in to determine + or −.'};
    } else if(mode===3){
      return{question:`Expand sin(3×${deg}°) using sin(3θ) = 3sinθ − 4sin³θ.`,questionLatex:`\\sin 3\\theta=3\\sin\\theta-4\\sin^3\\theta.\\;\\text{Find }\\sin(${3*deg}°).`,steps:[`θ = ${deg}°, sin(${deg}°) = ${fmt(s,6)}`,`sin(3×${deg}°) = 3sin(${deg}°) − 4sin³(${deg}°)`,`= 3×${fmt(s,6)} − 4×${fmt(s*s*s,6)}`,`= ${fmt(3*s,6)} − ${fmt(4*s*s*s,6)}`,`= ${fmt(3*s-4*s*s*s,6)}`,`Direct: sin(${3*deg}°) = ${fmt(Math.sin(deg2rad(3*deg)),6)} ✓`],answer:`sin(${3*deg}°) = ${sinExact[3*deg]||fmt(Math.sin(deg2rad(3*deg)),6)}`,answerLatex:`\\sin(${3*deg}°)=${sinExact[3*deg]||fmt(Math.sin(deg2rad(3*deg)),6)}`,tip:'sin(3θ) = 3sinθ − 4sin³θ. Think "3 minus 4 cubed". Similarly cos(3θ) = 4cos³θ − 3cosθ ("4 cubed minus 3").'};
    } else {
      const tVal=srI(n+2,1,5)/srI(n+3,2,4);
      return{question:`Using t = tan(θ/2) = ${fmt(tVal,3)}, find sin θ and cos θ.`,questionLatex:`t=\\tan\\frac{\\theta}{2}=${fmt(tVal,3)}.\\text{ Find }\\sin\\theta,\\cos\\theta.`,steps:[`t-substitution: sin θ = 2t/(1+t²), cos θ = (1−t²)/(1+t²)`,`t = ${fmt(tVal,4)}, t² = ${fmt(tVal*tVal,4)}, 1+t² = ${fmt(1+tVal*tVal,4)}`,`sin θ = 2×${fmt(tVal,4)}/${fmt(1+tVal*tVal,4)} = ${fmt(2*tVal/(1+tVal*tVal),6)}`,`cos θ = (1−${fmt(tVal*tVal,4)})/${fmt(1+tVal*tVal,4)} = ${fmt((1-tVal*tVal)/(1+tVal*tVal),6)}`],answer:`sin θ = ${fmt(2*tVal/(1+tVal*tVal),4)}, cos θ = ${fmt((1-tVal*tVal)/(1+tVal*tVal),4)}`,answerLatex:`\\sin\\theta=${fmt(2*tVal/(1+tVal*tVal),4)},\\;\\cos\\theta=${fmt((1-tVal*tVal)/(1+tVal*tVal),4)}`,tip:'t-substitution (t = tan(θ/2)): converts trig equations into algebraic ones — very powerful for solving equations.'};
    }
  },
  transform:(n)=>{
    const mode=n%4;
    const a_deg=srP([75,65,55,45,80,40],n),b_deg=srP([15,25,35,45,20,10],n+7);
    const a=deg2rad(a_deg),b=deg2rad(b_deg);
    if(mode===0){
      const lhs=2*Math.sin(a)*Math.cos(b),rhs=Math.sin(a+b)+Math.sin(a-b);
      return{question:`Express 2 sin(${a_deg}°) cos(${b_deg}°) as a sum of sines.`,questionLatex:`2\\sin${a_deg}°\\cos${b_deg}°=?`,steps:[`2 sinA cosB = sin(A+B) + sin(A−B)`,`= sin(${a_deg}°+${b_deg}°) + sin(${a_deg}°−${b_deg}°)`,`= sin(${a_deg+b_deg}°) + sin(${a_deg-b_deg}°)`,`Numerically: ${fmt(lhs,4)} = ${fmt(rhs,4)} ✓`],answer:`sin(${a_deg+b_deg}°) + sin(${a_deg-b_deg}°)`,answerLatex:`\\sin${a_deg+b_deg}°+\\sin${a_deg-b_deg}°`,tip:'Product-to-sum: 2 sinA cosB = sin(A+B) + sin(A−B). Notice the signs match sin(A+B).'};
    } else if(mode===1){
      const C_deg=srP([70,80,50,40,100],n),D_deg=srP([20,40,30,10,20],n+5);
      const C=deg2rad(C_deg),D=deg2rad(D_deg);
      const lhs=Math.sin(C)+Math.sin(D);
      return{question:`Express sin(${C_deg}°) + sin(${D_deg}°) as a product.`,questionLatex:`\\sin${C_deg}°+\\sin${D_deg}°=?\\text{ (product form)}`,steps:[`sinC + sinD = 2 sin((C+D)/2) cos((C−D)/2)`,`C = ${C_deg}°, D = ${D_deg}°`,`(C+D)/2 = ${(C_deg+D_deg)/2}°, (C−D)/2 = ${(C_deg-D_deg)/2}°`,`= 2 sin(${(C_deg+D_deg)/2}°) cos(${(C_deg-D_deg)/2}°)`,`= ${fmt(2*Math.sin(deg2rad((C_deg+D_deg)/2))*Math.cos(deg2rad((C_deg-D_deg)/2)),6)}`],answer:`2 sin(${(C_deg+D_deg)/2}°) cos(${(C_deg-D_deg)/2}°)`,answerLatex:`2\\sin${(C_deg+D_deg)/2}°\\cos${(C_deg-D_deg)/2}°`,tip:'Sum-to-product: take half-sum and half-difference as the new angles. Remember the middle two letters: cosC+cosD uses cos·cos; sinC−sinD uses cos·sin.'};
    } else if(mode===2){
      const C_deg=srP([80,100,60,50],n),D_deg=srP([20,40,20,10],n+3);
      return{question:`Express cos(${C_deg}°) + cos(${D_deg}°) as a product.`,questionLatex:`\\cos${C_deg}°+\\cos${D_deg}°=?`,steps:[`cosC + cosD = 2 cos((C+D)/2) cos((C−D)/2)`,`= 2 cos(${(C_deg+D_deg)/2}°) cos(${(C_deg-D_deg)/2}°)`,`= ${fmt(2*Math.cos(deg2rad((C_deg+D_deg)/2))*Math.cos(deg2rad((C_deg-D_deg)/2)),6)}`],answer:`2 cos(${(C_deg+D_deg)/2}°) cos(${(C_deg-D_deg)/2}°)`,answerLatex:`2\\cos${(C_deg+D_deg)/2}°\\cos${(C_deg-D_deg)/2}°`,tip:'cosC + cosD: both cos. cosC − cosD: −2 sin·sin (negative sign, uses sin).'};
    } else {
      const A_deg=srP([60,45,75,50,80],n),B_deg=srP([30,15,15,10,20],n+2);
      const lhs=2*Math.cos(deg2rad(A_deg))*Math.cos(deg2rad(B_deg));
      return{question:`Expand 2 cos(${A_deg}°) cos(${B_deg}°) as sum of cosines.`,questionLatex:`2\\cos${A_deg}°\\cos${B_deg}°=?`,steps:[`2 cosA cosB = cos(A−B) + cos(A+B)`,`= cos(${A_deg-B_deg}°) + cos(${A_deg+B_deg}°)`,`= ${fmt(Math.cos(deg2rad(A_deg-B_deg))+Math.cos(deg2rad(A_deg+B_deg)),6)}`],answer:`cos(${A_deg-B_deg}°) + cos(${A_deg+B_deg}°)`,answerLatex:`\\cos${A_deg-B_deg}°+\\cos${A_deg+B_deg}°`,tip:'2 cosA cosB = cos(A−B) + cos(A+B). 2 sinA sinB = cos(A−B) − cos(A+B) (note the minus!).'};
    }
  },
  trig_eqs:(n)=>{
    const mode=n%4;
    if(mode===0){
      const vals=[{k:0.5,alpha:30},{k:Math.sqrt(3)/2,alpha:60},{k:Math.sqrt(2)/2,alpha:45},{k:-0.5,alpha:-30},{k:1,alpha:90}];
      const v=vals[n%vals.length];
      return{question:`Find the general solution of sin θ = ${fmt(v.k,4)}.`,questionLatex:`\\sin\\theta=${fmt(v.k,4)},\\text{ find general solution.}`,steps:[`Principal value: α = arcsin(${fmt(v.k,4)}) = ${v.alpha}°`,`General solution: θ = nπ + (−1)ⁿα`,`In degrees: θ = 180°n + (−1)ⁿ×${v.alpha}°`,`Some solutions: n=0: ${v.alpha}°, n=1: ${180-v.alpha}°, n=2: ${360+v.alpha}°, n=3: ${540-v.alpha}°`],answer:`θ = nπ + (−1)ⁿ(${v.alpha}°)`,answerLatex:`\\theta=n\\pi+(-1)^n\\times${v.alpha}°,\\;n\\in\\mathbb{Z}`,tip:'For sin θ = k: the (−1)ⁿ alternates the sign of α — giving the two solutions in [0°,360°] then repeating.'};
    } else if(mode===1){
      const alphas=[30,45,60,120,90,150];
      const alpha=alphas[n%alphas.length];
      const cosK=Math.cos(deg2rad(alpha));
      return{question:`Find the general solution of cos θ = ${cosExact[alpha]||fmt(cosK,4)}.`,questionLatex:`\\cos\\theta=${cosExact[alpha]||fmt(cosK,4)}.`,steps:[`Principal value: α = arccos(${cosExact[alpha]||fmt(cosK,4)}) = ${alpha}°`,`General solution: θ = 2nπ ± α`,`In degrees: θ = 360°n ± ${alpha}°`,`Some solutions: n=0: ±${alpha}°, n=1: ${360-alpha}° or ${360+alpha}°`],answer:`θ = 360°n ± ${alpha}°`,answerLatex:`\\theta=2n\\pi\\pm${alpha}°,\\;n\\in\\mathbb{Z}`,tip:'For cos θ = k: the ± gives the two solutions in [0°,360°]. cos is symmetric about 0° (and 360°).'};
    } else if(mode===2){
      const tanAlphas=[30,45,60,-30,-45];
      const alpha=tanAlphas[n%tanAlphas.length];
      return{question:`Find the general solution of tan θ = tan(${alpha}°).`,questionLatex:`\\tan\\theta=\\tan(${alpha}°).`,steps:[`For tan θ = tan α, general solution is θ = nπ + α`,`θ = n×180° + ${alpha}°`,`Some solutions: n=0: ${alpha}°, n=1: ${180+alpha}°, n=2: ${360+alpha}°, n=−1: ${-180+alpha}°`],answer:`θ = n×180° + ${alpha}°`,answerLatex:`\\theta=n\\pi+${alpha}°,\\;n\\in\\mathbb{Z}`,tip:'For tan: period is π (180°), so just add multiples of 180°. Simpler than sin and cos!'};
    } else {
      const a=srI(n+1,1,4),b=srI(n+2,1,4);
      const R=Math.sqrt(a*a+b*b),phi=rad2deg(Math.atan2(b,a));
      const c=srI(n+3,1,Math.floor(R));
      return{question:`Find the range of a cosθ + b sinθ where a=${a}, b=${b}. Also find its maximum.`,questionLatex:`a\\cos\\theta+b\\sin\\theta\\text{ where }a=${a},b=${b}.\\text{ Max value?}`,steps:[`Write as R cos(θ − φ) where R = √(a²+b²)`,`R = √(${a}² + ${b}²) = √${a*a+b*b} = ${fmt(R,4)}`,`φ = arctan(b/a) = arctan(${b}/${a}) = ${fmt(phi,2)}°`,`Range: [−R, R] = [${fmt(-R,4)}, ${fmt(R,4)}]`,`Maximum = ${fmt(R,4)} when θ = φ = ${fmt(phi,2)}°`],answer:`Max = √(${a*a+b*b}) = ${fmt(R,4)}, Range = [−${fmt(R,4)}, ${fmt(R,4)}]`,answerLatex:`\\max=${fmt(R,4)}=\\sqrt{${a*a+b*b}},\\;\\text{Range}=[-${fmt(R,4)},${fmt(R,4)}]`,tip:'a cosθ + b sinθ = R cos(θ−φ) where R = √(a²+b²). The maximum is always R = √(a²+b²).'};
    }
  },
  itf:(n)=>{
    const mode=n%5;
    if(mode===0){
      const vals=[{v:'\\frac{1}{2}',ans:'\\frac{\\pi}{6}',fn:'sin⁻¹'},{v:'\\frac{\\sqrt{3}}{2}',ans:'\\frac{\\pi}{3}',fn:'sin⁻¹'},{v:'\\frac{1}{2}',ans:'\\frac{\\pi}{3}',fn:'cos⁻¹'},{v:'1',ans:'\\frac{\\pi}{4}',fn:'tan⁻¹'},{v:'-\\frac{1}{2}',ans:'-\\frac{\\pi}{6}',fn:'sin⁻¹'}];
      const v=vals[n%vals.length];
      return{question:`Find the principal value of ${v.fn}(${v.v}).`,questionLatex:`${v.fn==='sin⁻¹'?'\\sin^{-1}':v.fn==='cos⁻¹'?'\\cos^{-1}':'\\tan^{-1}'}\\left(${v.v}\\right)=?`,steps:[`Principal value branch for ${v.fn}:`,v.fn==='sin⁻¹'?`sin⁻¹: range = [−π/2, π/2]`:v.fn==='cos⁻¹'?`cos⁻¹: range = [0, π]`:`tan⁻¹: range = (−π/2, π/2)`,`Find angle α in range where ${v.fn.replace('⁻¹','')}(α) = ${v.v}`,`α = ${v.ans}`],answer:`${v.fn}(${v.v}) = ${v.ans}`,answerLatex:`${v.fn==='sin⁻¹'?'\\sin^{-1}':v.fn==='cos⁻¹'?'\\cos^{-1}':'\\tan^{-1}'}\\left(${v.v}\\right)=${v.ans}`,tip:'Always identify the principal value branch first. sin⁻¹ output ∈ [−π/2,π/2]; cos⁻¹ output ∈ [0,π]; tan⁻¹ output ∈ (−π/2,π/2).'};
    } else if(mode===1){
      const xVals=['\\frac{1}{2}','\\frac{\\sqrt{3}}{2}','\\frac{\\sqrt{2}}{2}'];
      const xv=xVals[n%xVals.length];
      return{question:`Prove: sin⁻¹(${xv}) + cos⁻¹(${xv}) = π/2.`,questionLatex:`\\sin^{-1}\\left(${xv}\\right)+\\cos^{-1}\\left(${xv}\\right)=\\frac{\\pi}{2}?`,steps:[`Key identity: sin⁻¹(x) + cos⁻¹(x) = π/2 for all x ∈ [−1,1]`,`Proof: Let sin⁻¹(x) = α, so sin α = x`,`Then cos(π/2 − α) = sin α = x`,`So cos⁻¹(x) = π/2 − α`,`Therefore sin⁻¹(x) + cos⁻¹(x) = α + π/2 − α = π/2 ✓`],answer:`π/2 (identity always holds for x ∈ [−1,1])`,answerLatex:`\\sin^{-1}x+\\cos^{-1}x=\\frac{\\pi}{2}\\;\\forall x\\in[-1,1]\\;✓`,tip:'sin⁻¹x + cos⁻¹x = π/2 always — it\'s because the two complement each other to a right angle.'};
    } else if(mode===2){
      const p=srI(n+1,1,4),q=srI(n+2,1,3);
      const pq=p*q;const denom=1-pq;
      return{question:`Find tan⁻¹(${p}) + tan⁻¹(${q}). (Assume pq ${pq<1?'< 1':pq===1?'= 1':'> 1'})`,questionLatex:`\\tan^{-1}${p}+\\tan^{-1}${q}=?`,steps:[`Formula: tan⁻¹x + tan⁻¹y = tan⁻¹((x+y)/(1−xy)) when xy < 1`,`x = ${p}, y = ${q}, xy = ${pq}, 1−xy = ${denom}`,pq<1?`xy = ${pq} < 1 → use the formula directly`:`xy = ${pq} ≥ 1 → add π if x>0, subtract π if x<0`,`tan⁻¹(${p}+${q})/(1-${pq}) = tan⁻¹(${p+q}/${denom})${pq>=1?' + π (since xy≥1 and x>0)':''}`,`= ${fmt(Math.atan(p)+Math.atan(q),6)} rad = ${fmt(rad2deg(Math.atan(p)+Math.atan(q)),4)}°`],answer:`${fmt(Math.atan(p)+Math.atan(q),6)} rad`,answerLatex:`\\tan^{-1}${p}+\\tan^{-1}${q}=${fmt(Math.atan(p)+Math.atan(q),4)}\\text{ rad}`,tip:'tan⁻¹x + tan⁻¹y: if xy > 1 and x,y > 0, add π. If xy > 1 and x,y < 0, subtract π.'};
    } else if(mode===3){
      const xV=srI(n+1,1,4);
      return{question:`Simplify: 2 tan⁻¹(${xV}) using the double angle identity.`,questionLatex:`2\\tan^{-1}(${xV})=?`,steps:[`2 tan⁻¹(x) = sin⁻¹(2x/(1+x²)) when |x| ≤ 1`,`x = ${xV}: |x| ${xV<=1?'≤ 1, use sin⁻¹ form':'> 1, use π − sin⁻¹ form'}`,`2x/(1+x²) = ${2*xV}/${1+xV*xV} = ${fmt(2*xV/(1+xV*xV),6)}`,`2 tan⁻¹(${xV}) = ${fmt(2*Math.atan(xV),6)} rad = ${fmt(rad2deg(2*Math.atan(xV)),4)}°`],answer:`${fmt(2*Math.atan(xV),6)} rad`,answerLatex:`2\\tan^{-1}(${xV})=${fmt(2*Math.atan(xV),4)}\\text{ rad}`,tip:'2tan⁻¹x = sin⁻¹(2x/(1+x²)) when |x|≤1. This identity connects ITF to double-angle formulas.'};
    } else {
      return{question:`Write sin⁻¹(3/5) in terms of tan⁻¹.`,questionLatex:`\\sin^{-1}\\frac{3}{5}=\\tan^{-1}(?).`,steps:[`Let sin⁻¹(3/5) = α, so sin α = 3/5`,`cos α = √(1 − 9/25) = √(16/25) = 4/5`,`tan α = sin α/cos α = (3/5)/(4/5) = 3/4`,`So α = tan⁻¹(3/4)`,`sin⁻¹(3/5) = tan⁻¹(3/4)`],answer:`tan⁻¹(3/4)`,answerLatex:`\\sin^{-1}\\frac{3}{5}=\\tan^{-1}\\frac{3}{4}`,tip:'To convert between ITF forms: use a right triangle. Set the known ratio, find the missing side by Pythagoras, then read the desired ratio.'};
    }
  },
  sine_cosine_rule:(n)=>{
    const mode=n%4;
    if(mode===0){
      const a=srI(n+1,4,10),A_deg=srI(n+2,30,80),B_deg=srI(n+3,30,80);
      if(A_deg+B_deg>=180) return GENERATORS.sine_cosine_rule(n+1);
      const b=a*Math.sin(deg2rad(B_deg))/Math.sin(deg2rad(A_deg));
      const C_deg=180-A_deg-B_deg;
      const c=a*Math.sin(deg2rad(C_deg))/Math.sin(deg2rad(A_deg));
      return{question:`In △ABC, a=${a}, A=${A_deg}°, B=${B_deg}°. Find b, c, and C using the Sine Rule.`,questionLatex:`a=${a},\\;A=${A_deg}°,\\;B=${B_deg}°.\\text{ Find b, c, C.}`,steps:[`C = 180° − A − B = 180° − ${A_deg}° − ${B_deg}° = ${C_deg}°`,`Sine rule: a/sinA = b/sinB = c/sinC`,`a/sinA = ${a}/sin(${A_deg}°) = ${a}/${fmt(Math.sin(deg2rad(A_deg)),4)} = ${fmt(a/Math.sin(deg2rad(A_deg)),4)}`,`b = ${fmt(a/Math.sin(deg2rad(A_deg)),4)} × sin(${B_deg}°) = ${fmt(b,4)}`,`c = ${fmt(a/Math.sin(deg2rad(A_deg)),4)} × sin(${C_deg}°) = ${fmt(c,4)}`],answer:`b = ${fmt(b,4)}, c = ${fmt(c,4)}, C = ${C_deg}°`,answerLatex:`b=${fmt(b,4)},\\;c=${fmt(c,4)},\\;C=${C_deg}°`,tip:'Sine rule: first find the third angle (A+B+C=180°), then use a/sinA to find the scale factor, multiply by the needed sine.'};
    } else if(mode===1){
      const b=srI(n+1,5,10),c=srI(n+2,5,10),A_deg=srI(n+3,40,120);
      const a2=b*b+c*c-2*b*c*Math.cos(deg2rad(A_deg)),a=Math.sqrt(a2);
      return{question:`In △ABC, b=${b}, c=${c}, A=${A_deg}°. Find side a using the Cosine Rule.`,questionLatex:`b=${b},\\;c=${c},\\;A=${A_deg}°.\\text{ Find }a.`,steps:[`Cosine rule: a² = b² + c² − 2bc cosA`,`a² = ${b}² + ${c}² − 2(${b})(${c})cos(${A_deg}°)`,`= ${b*b} + ${c*c} − ${2*b*c} × ${fmt(Math.cos(deg2rad(A_deg)),4)}`,`= ${b*b+c*c} − ${fmt(2*b*c*Math.cos(deg2rad(A_deg)),4)}`,`= ${fmt(a2,4)}`,`a = ${fmt(a,4)}`],answer:`a = ${fmt(a,4)}`,answerLatex:`a=${fmt(a,4)}`,tip:'Cosine rule: SAS → side. SSS → angle (rearrange to solve for cos). It reduces to Pythagoras when A = 90°.'};
    } else if(mode===2){
      const a=srI(n+1,3,8),b=srI(n+2,4,9),c=srI(n+3,5,10);
      if(a+b<=c||a+c<=b||b+c<=a) return GENERATORS.sine_cosine_rule(n+1);
      const s=(a+b+c)/2,area=Math.sqrt(s*(s-a)*(s-b)*(s-c));
      const cosA=(b*b+c*c-a*a)/(2*b*c),A_deg=rad2deg(Math.acos(cosA));
      return{question:`In △ABC, a=${a}, b=${b}, c=${c}. Find angle A and the area using Heron's formula.`,questionLatex:`a=${a},b=${b},c=${c}.\\text{ Find }\\angle A\\text{ and area.}`,steps:[`Cosine rule: cosA = (b²+c²−a²)/(2bc)`,`= (${b*b}+${c*c}−${a*a})/${2*b*c} = ${fmt(cosA,4)}`,`A = arccos(${fmt(cosA,4)}) = ${fmt(A_deg,2)}°`,`Heron's: s = (${a}+${b}+${c})/2 = ${s}`,`Area = √(s(s-a)(s-b)(s-c)) = √(${fmt(s*(s-a)*(s-b)*(s-c),4)}) = ${fmt(area,4)}`],answer:`A = ${fmt(A_deg,2)}°, Area = ${fmt(area,4)} sq units`,answerLatex:`\\angle A=${fmt(A_deg,2)}°,\\;\\Delta=${fmt(area,4)}`,tip:"Heron's formula: s = (a+b+c)/2, Area = √(s(s-a)(s-b)(s-c)). Use when all three sides are known."};
    } else {
      const a=srI(n+1,5,10),b=srI(n+2,5,10),C_deg=srI(n+3,30,120);
      const area=0.5*a*b*Math.sin(deg2rad(C_deg));
      return{question:`Find the area of △ABC with a=${a}, b=${b}, C=${C_deg}°.`,questionLatex:`a=${a},\\;b=${b},\\;C=${C_deg}°.\\text{ Area}=?`,steps:[`Area = ½ab sinC`,`= ½ × ${a} × ${b} × sin(${C_deg}°)`,`= ½ × ${a*b} × ${fmt(Math.sin(deg2rad(C_deg)),4)}`,`= ${fmt(area,4)} square units`],answer:`Area = ${fmt(area,4)} sq units`,answerLatex:`\\Delta=\\frac{1}{2}ab\\sin C=${fmt(area,4)}\\text{ sq units}`,tip:'Area = ½ × side × side × sin(included angle). This works for ANY two sides and their included angle.'};
    }
  },
  projection:(n)=>{
    const a=srI(n+1,4,9),b=srI(n+2,4,9),C_deg=srI(n+3,40,100);
    const C=deg2rad(C_deg),c2=a*a+b*b-2*a*b*Math.cos(C),c=Math.sqrt(c2);
    const s=(a+b+c)/2;
    const tan_half_AmB=Math.tan(Math.acos((b*b+c*c-a*a)/(2*b*c))/2);
    const rhs=((a-b)/(a+b))/Math.tan(C/2);
    return{question:`In △ABC, a=${a}, b=${b}, C=${C_deg}°. (a) Find c using Cosine Rule. (b) Verify the projection formula: c = a cosB + b cosA.`,questionLatex:`a=${a},b=${b},C=${C_deg}°.\\text{ Verify projection formula.}`,steps:[`c² = a²+b²−2ab cosC = ${a*a}+${b*b}−${2*a*b}×${fmt(Math.cos(C),4)} = ${fmt(c2,4)}`,`c = ${fmt(c,4)}`,`Find A: cosA = (b²+c²−a²)/(2bc) = ${fmt((b*b+c2-a*a)/(2*b*c),4)}, A = ${fmt(rad2deg(Math.acos((b*b+c2-a*a)/(2*b*c))),2)}°`,`Find B: B = 180° − A − ${C_deg}° = ${fmt(180-rad2deg(Math.acos((b*b+c2-a*a)/(2*b*c)))-C_deg,2)}°`,`Projection check: a cosB + b cosA = ${fmt(a*Math.cos(deg2rad(180-rad2deg(Math.acos((b*b+c2-a*a)/(2*b*c)))-C_deg)),4)} + ${fmt(b*Math.cos(Math.acos((b*b+c2-a*a)/(2*b*c))),4)} = ${fmt(c,4)} ≈ c ✓`],answer:`c = ${fmt(c,4)}, projection formula verified`,answerLatex:`c=${fmt(c,4)},\\;c=a\\cos B+b\\cos A\\;✓`,tip:"Projection formula: each side = projection of the other two onto it. Useful for proving other identities."};
  },
  heights:(n)=>{
    const mode=n%4;
    if(mode===0){
      const theta=srP([30,45,60],n),d=srI(n+1,20,100);
      const h=d*Math.tan(deg2rad(theta));
      return{question:`From a point ${d}m from the base of a tower, the angle of elevation of the top is ${theta}°. Find the height of the tower.`,questionLatex:`d=${d}\\text{ m},\\;\\theta=${theta}°.\\text{ Find height }h.`,steps:[`tan(elevation) = height/horizontal distance`,`tan(${theta}°) = h/${d}`,`h = ${d} × tan(${theta}°) = ${d} × ${fmt(Math.tan(deg2rad(theta)),4)}`,`h = ${fmt(h,4)} m`],answer:`Height = ${fmt(h,4)} m`,answerLatex:`h=${fmt(h,4)}\\text{ m}`,tip:'tan(θ) = opposite/adjacent. For heights and distances: always draw a diagram first and label the right angle.'};
    } else if(mode===1){
      const h=srI(n+1,30,100),alpha=srP([45,60],n),beta=srP([30,45],n+7);
      if(alpha<=beta) return GENERATORS.heights(n+1);
      const d=h*(1/Math.tan(deg2rad(alpha)-deg2rad(beta)));
      return{question:`A tower of height ${h}m is observed from two points A and B on the same horizontal line. Angles of elevation are ${alpha}° and ${beta}°. Find the distance AB.`,questionLatex:`h=${h}\\text{ m},\\;\\alpha=${alpha}°,\\;\\beta=${beta}°.\\text{ Find AB.}`,steps:[`Let the base of tower be T, distance from closer point = d₁`,`From closer point: tan(${alpha}°) = ${h}/d₁ → d₁ = ${fmt(h/Math.tan(deg2rad(alpha)),4)} m`,`From farther point: tan(${beta}°) = ${h}/d₂ → d₂ = ${fmt(h/Math.tan(deg2rad(beta)),4)} m`,`AB = d₂ − d₁ = ${fmt(h/Math.tan(deg2rad(beta))-h/Math.tan(deg2rad(alpha)),4)} m`],answer:`AB = ${fmt(Math.abs(h/Math.tan(deg2rad(beta))-h/Math.tan(deg2rad(alpha))),4)} m`,answerLatex:`AB=${fmt(Math.abs(h/Math.tan(deg2rad(beta))-h/Math.tan(deg2rad(alpha))),4)}\\text{ m}`,tip:'Two-point problems: write equations for each angle separately, then combine to eliminate the unknown distance.'};
    } else if(mode===2){
      const theta=srP([30,45,60],n),h=srI(n+1,40,80),H=srI(n+2,5,20);
      const d=+(h-H)/Math.tan(deg2rad(theta)).toFixed(2);
      return{question:`An observer on a cliff ${H}m high sees the top of a ${h}m tower at an angle of elevation ${theta}°. Find the horizontal distance.`,questionLatex:`H=${H}\\text{ m (cliff)},\\;h=${h}\\text{ m (tower)},\\;\\theta=${theta}°.`,steps:[`Vertical difference = h − H = ${h-H} m`,`tan(${theta}°) = (h−H)/d`,`d = (h−H)/tan(${theta}°) = ${h-H}/${fmt(Math.tan(deg2rad(theta)),4)}`,`d = ${fmt((h-H)/Math.tan(deg2rad(theta)),4)} m`],answer:`Distance = ${fmt((h-H)/Math.tan(deg2rad(theta)),4)} m`,answerLatex:`d=${fmt((h-H)/Math.tan(deg2rad(theta)),4)}\\text{ m}`,tip:'When the observer is elevated, the effective height difference is (tower height − observer height).'};
    } else {
      const theta=srP([30,45],n),phi=srP([45,60],n+5),d=srI(n+1,50,150);
      const h=d/(1/Math.tan(deg2rad(theta))-1/Math.tan(deg2rad(phi)));
      return{question:`From a point P, the angle of depression of the bottom of a building is ${theta}° and the angle of elevation of the top is ${phi}°. If the horizontal distance is ${d}m, find the total height of the building.`,questionLatex:`\\text{Depression}=${theta}°,\\;\\text{Elevation}=${phi}°,\\;d=${d}\\text{ m}.`,steps:[`Let P be at height h₁ above ground, building height = H`,`tan(${theta}°) = h₁/d → h₁ = ${d}×tan(${theta}°) = ${fmt(d*Math.tan(deg2rad(theta)),4)} m`,`tan(${phi}°) = h₂/d → h₂ = ${d}×tan(${phi}°) = ${fmt(d*Math.tan(deg2rad(phi)),4)} m (height above P)`,`Total height H = h₁ + h₂ = ${fmt(d*Math.tan(deg2rad(theta))+d*Math.tan(deg2rad(phi)),4)} m`],answer:`Total height = ${fmt(d*Math.tan(deg2rad(theta))+d*Math.tan(deg2rad(phi)),4)} m`,answerLatex:`H=${fmt(d*Math.tan(deg2rad(theta))+d*Math.tan(deg2rad(phi)),4)}\\text{ m}`,tip:'Elevation is measured upward, depression downward — both from horizontal. Total height = h₁ (below) + h₂ (above observer).'};
    }
  },
  conditional:(n)=>{
    const identities=[
      {q:'Prove: sin 2A + sin 2B + sin 2C = 4 sinA sinB sinC (given A+B+C=π)',steps:['sin 2A + sin 2B + sin 2C','= sin 2A + 2 sin(B+C) cos(B−C)  [sum-to-product on last two]','Since A+B+C=π: B+C = π−A → sin(B+C) = sinA','= sin 2A + 2 sinA cos(B−C)','= 2 sinA cosA + 2 sinA cos(B−C)','= 2 sinA[cosA + cos(B−C)]','cos A = −cos(B+C)','= 2 sinA[cos(B−C) − cos(B+C)]','= 2 sinA × 2 sinB sinC','= 4 sinA sinB sinC ✓'],ans:'4 sinA sinB sinC',ansL:'4\\sin A\\sin B\\sin C'},
      {q:'Prove: tanA + tanB + tanC = tanA tanB tanC (given A+B+C=π)',steps:['A+B+C = π → A+B = π−C','tan(A+B) = tan(π−C) = −tan C','(tanA + tanB)/(1−tanA tanB) = −tanC','tanA + tanB = −tanC(1−tanA tanB)','tanA + tanB = −tanC + tanA tanB tanC','tanA + tanB + tanC = tanA tanB tanC ✓'],ans:'tanA tanB tanC',ansL:'\\tan A\\tan B\\tan C'},
      {q:'Prove: sin A + sin B + sin C = 4 cos(A/2) cos(B/2) cos(C/2) (A+B+C=π)',steps:['sin A + sin B = 2 sin((A+B)/2) cos((A−B)/2)','(A+B)/2 = (π−C)/2 = π/2 − C/2','sin((A+B)/2) = sin(π/2 − C/2) = cos(C/2)','So sin A + sin B = 2 cos(C/2) cos((A−B)/2)','Add sin C = 2 sin(C/2) cos(C/2)','= 2 cos(C/2)[cos((A−B)/2) + sin(C/2)]','sin(C/2) = sin((π−A−B)/2) = cos((A+B)/2)','cos((A-B)/2) + cos((A+B)/2) = 2 cos(A/2) cos(B/2)','Result = 4 cos(A/2)cos(B/2)cos(C/2) ✓'],ans:'4 cos(A/2)cos(B/2)cos(C/2)',ansL:'4\\cos\\frac{A}{2}\\cos\\frac{B}{2}\\cos\\frac{C}{2}'},
    ];
    const id=identities[n%identities.length];
    return{question:id.q,questionLatex:id.q,steps:id.steps,answer:id.ans,answerLatex:id.ansL,tip:'Key trick for conditional identities: replace C with π−A−B. Then sin C = sin(A+B) and cos C = −cos(A+B).'};
  },
  trig_series:(n)=>{
    const mode=n%3;
    if(mode===0){
      const alpha=srP([10,15,20,5],n),beta=srP([10,15,20,12],n+3),terms=srI(n+2,4,7);
      const exact=Math.sin(deg2rad(terms*beta/2))/Math.sin(deg2rad(beta/2))*Math.sin(deg2rad(alpha+(terms-1)*beta/2));
      return{question:`Evaluate the sum: sin(${alpha}°) + sin(${alpha+beta}°) + sin(${alpha+2*beta}°) + … (${terms} terms, common difference ${beta}°).`,questionLatex:`\\sum_{k=0}^{${terms-1}}\\sin(${alpha}°+k\\cdot${beta}°)=?`,steps:[`AP series: α=${alpha}°, β=${beta}°, n=${terms}`,`Formula: sin(nβ/2)/sin(β/2) × sin(α + (n−1)β/2)`,`sin(${terms}×${beta}/2)/sin(${beta}/2) = sin(${terms*beta/2}°)/sin(${beta/2}°) = ${fmt(Math.sin(deg2rad(terms*beta/2))/Math.sin(deg2rad(beta/2)),4)}`,`Middle angle: ${alpha}° + ${(terms-1)*beta/2}° = ${alpha+(terms-1)*beta/2}°`,`Sum = ${fmt(Math.sin(deg2rad(terms*beta/2))/Math.sin(deg2rad(beta/2)),4)} × sin(${alpha+(terms-1)*beta/2}°) = ${fmt(exact,4)}`],answer:`Sum = ${fmt(exact,4)}`,answerLatex:`\\text{Sum}=${fmt(exact,4)}`,tip:'AP trig sum: numerator uses n×β/2, denominator uses β/2 alone. Middle term angle = α + (n−1)β/2.'};
    } else if(mode===1){
      const x_deg=srP([10,15,20,9],n),n_terms=srI(n+2,3,6);
      const x=deg2rad(x_deg);
      let product=1;for(let k=0;k<n_terms;k++)product*=Math.cos(Math.pow(2,k)*x);
      const exact=Math.sin(Math.pow(2,n_terms)*x)/(Math.pow(2,n_terms)*Math.sin(x));
      return{question:`Find the product: cos(${x_deg}°) × cos(${2*x_deg}°) × cos(${4*x_deg}°) × … × cos(${Math.pow(2,n_terms-1)*x_deg}°).`,questionLatex:`\\prod_{k=0}^{${n_terms-1}}\\cos(2^k\\cdot${x_deg}°)=?`,steps:[`Telescoping product formula: ∏cos(2ᵏx) = sin(2ⁿx)/(2ⁿ sin x)`,`x = ${x_deg}°, n = ${n_terms}`,`2ⁿ = ${Math.pow(2,n_terms)}, 2ⁿx = ${Math.pow(2,n_terms)*x_deg}°`,`sin(${Math.pow(2,n_terms)*x_deg}°) = ${fmt(Math.sin(deg2rad(Math.pow(2,n_terms)*x_deg)),4)}`,`sin(${x_deg}°) = ${fmt(Math.sin(x),4)}`,`Product = ${fmt(Math.sin(deg2rad(Math.pow(2,n_terms)*x_deg)),4)} / (${Math.pow(2,n_terms)} × ${fmt(Math.sin(x),4)}) = ${fmt(exact,4)}`],answer:`Product = ${fmt(exact,4)}`,answerLatex:`\\prod=${fmt(exact,4)}`,tip:'Telescoping: repeatedly use 2 sinθ cosθ = sin 2θ. Multiply both sides by 2 sin x at each step to build sin(2ⁿx) in the numerator.'};
    } else {
      const n_roots=srI(n+1,3,6);
      const sum=0,sumSq=n_roots;
      return{question:`The ${n_roots}th roots of unity are 1, ω, ω², …, ω^(${n_roots-1}) where ω = e^(2πi/${n_roots}). Find: (a) their sum, (b) sum of their squares.`,questionLatex:`\\omega=e^{2\\pi i/${n_roots}}.\\text{ Find }\\sum_{k=0}^{${n_roots-1}}\\omega^k.`,steps:[`${n_roots}th roots of unity: sum of ALL roots of z^${n_roots} − 1 = 0`,`By Vieta's formulas: sum = coefficient of z^(n−1) / leading = 0/${n_roots} = 0`,`OR: geometric series: (1 − ω^${n_roots})/(1 − ω) = (1−1)/(1−ω) = 0`,`Sum of squares: these are the ${n_roots}th roots of unity too!`,`Sum of cos(2πk/${n_roots}) for k=0..${n_roots-1} = 0`,`Sum of sin(2πk/${n_roots}) for k=0..${n_roots-1} = 0`],answer:`Sum = 0 (both real and imaginary parts)`,answerLatex:`\\sum_{k=0}^{${n_roots-1}}\\omega^k=0,\\;\\sum\\cos\\frac{2\\pi k}{${n_roots}}=0`,tip:'Roots of unity sum to 0 whenever n ≥ 2. This is the most useful result for summing trig series over equally-spaced angles.'};
    }
  },
  trig_ineq:(n)=>{
    const mode=n%4;
    if(mode===0){
      const a=srI(n+1,1,5),b=srI(n+2,1,5);
      const R=Math.sqrt(a*a+b*b);
      return{question:`Find the maximum and minimum of f(θ) = ${a} cosθ + ${b} sinθ.`,questionLatex:`f(\\theta)=${a}\\cos\\theta+${b}\\sin\\theta.\\text{ Max and Min?}`,steps:[`f(θ) = R cos(θ − φ) where R = √(a²+b²), tan φ = b/a`,`R = √(${a}²+${b}²) = √${a*a+b*b} = ${fmt(R,4)}`,`Maximum = +R = ${fmt(R,4)} (when θ = φ)`,`Minimum = −R = ${fmt(-R,4)} (when θ = π + φ)`,`Range: [${fmt(-R,4)}, ${fmt(R,4)}]`],answer:`Max = ${fmt(R,4)}, Min = ${fmt(-R,4)}`,answerLatex:`\\max=${fmt(R,4)},\\;\\min=${fmt(-R,4)}`,tip:'a cosθ + b sinθ always has max √(a²+b²) and min −√(a²+b²). Think of it as the amplitude of a wave.'};
    } else if(mode===1){
      return{question:`Prove: sin A + sin B + sin C ≤ 3√3/2, where A+B+C = π, A,B,C > 0.`,questionLatex:`A+B+C=\\pi.\\text{ Prove }\\sin A+\\sin B+\\sin C\\leq\\frac{3\\sqrt{3}}{2}.`,steps:[`sin is CONCAVE on (0, π)  [since sin′′(x) = −sin x < 0]`,`By Jensen's inequality for concave f:`,`(sin A + sin B + sin C)/3 ≤ sin((A+B+C)/3) — WAIT: concave gives ≥`,`For concave f: f((x₁+x₂+x₃)/3) ≥ (f(x₁)+f(x₂)+f(x₃))/3`,`sin((A+B+C)/3) = sin(π/3) = √3/2`,`So (sin A + sin B + sin C)/3 ≤ sin(π/3) = √3/2 — Hmm, that gives ≤ for concave`,`Wait: Jensen for concave: f(mean) ≥ mean of f values`,`→ (sin A+sin B+sin C)/3 ≤ sin(π/3) = √3/2 is actually from AM considerations`,`sin A + sin B + sin C ≤ 3×√3/2 = 3√3/2 ✓, equality at A=B=C=60°`],answer:`Max = 3√3/2 ≈ 2.598, achieved at equilateral triangle`,answerLatex:`\\sin A+\\sin B+\\sin C\\leq\\frac{3\\sqrt{3}}{2},\\;\\text{eq. when }A=B=C=60°`,tip:'Jensen: for concave f, f(x̄) ≥ mean of f values. For sin in a triangle, max sum is at the equilateral case.'};
    } else if(mode===2){
      return{question:`Find the minimum value of sec²θ + csc²θ.`,questionLatex:`\\sec^2\\theta+\\csc^2\\theta=?\\;\\text{(minimum)}`,steps:[`sec²θ + csc²θ = 1/cos²θ + 1/sin²θ`,`= (sin²θ + cos²θ)/(sin²θ cos²θ)`,`= 1/(sin²θ cos²θ)`,`= 4/(sin²(2θ))  [since sin 2θ = 2 sinθ cosθ]`,`= 4/sin²(2θ) ≥ 4  (since sin²(2θ) ≤ 1)`,`Minimum = 4, achieved when sin(2θ) = 1, i.e., 2θ = 90°, θ = 45°`],answer:`Minimum = 4 at θ = 45°`,answerLatex:`\\min(\\sec^2\\theta+\\csc^2\\theta)=4,\\;\\theta=45°`,tip:'Convert to sin²θ cos²θ form, then use the double angle. Many trig minima reduce to "sin = 1" or "cos = 1".'};
    } else {
      return{question:`Show that cos A + cos B + cos C ≤ 3/2 for triangle angles A+B+C = π.`,questionLatex:`\\cos A+\\cos B+\\cos C\\leq\\frac{3}{2}\\;(A+B+C=\\pi).`,steps:[`cos is CONCAVE on (0, π) [cos′′(x) = −cos x, which is negative on (0, π/2) but positive on (π/2, π)]`,`Better approach: use the known identity cos A+cos B+cos C = 1 + r/R`,`r = inradius ≥ 0, R = circumradius`,`Also: by AM-GM, since each angle < π and sum = π`,`cos A + cos B + cos C ≤ 3 cos((A+B+C)/3) = 3 cos(π/3) = 3/2 ... (concavity on (0,2π/3))`,`Equality when A=B=C=60°`],answer:`Max = 3/2 at equilateral triangle. cos A + cos B + cos C = 1 + r/R ≤ 3/2.`,answerLatex:`\\cos A+\\cos B+\\cos C=1+\\frac{r}{R}\\leq\\frac{3}{2}`,tip:'The identity cosA+cosB+cosC = 1+r/R is elegant — it relates angles to the triangle\'s radii.'};
    }
  },
  demoivre:(n)=>{
    const mode=n%4;
    if(mode===0){
      const nv=srI(n+1,3,8),theta_deg=srP([30,45,60,15,36],n);
      const res_cos=fmt(Math.cos(deg2rad(nv*theta_deg)),4),res_sin=fmt(Math.sin(deg2rad(nv*theta_deg)),4);
      return{question:`Use De Moivre's theorem to find (cos${theta_deg}° + i sin${theta_deg}°)^${nv}.`,questionLatex:`(\\cos${theta_deg}°+i\\sin${theta_deg}°)^{${nv}}=?`,steps:[`De Moivre: (cosθ + i sinθ)ⁿ = cos(nθ) + i sin(nθ)`,`n = ${nv}, θ = ${theta_deg}°`,`nθ = ${nv}×${theta_deg}° = ${nv*theta_deg}°`,`= cos(${nv*theta_deg}°) + i sin(${nv*theta_deg}°)`,`= ${res_cos} + ${res_sin}i`],answer:`cos(${nv*theta_deg}°) + i sin(${nv*theta_deg}°) = ${res_cos} + ${res_sin}i`,answerLatex:`\\cos${nv*theta_deg}°+i\\sin${nv*theta_deg}°=${res_cos}+${res_sin}i`,tip:'De Moivre: just multiply the angle by n. The modulus stays 1 (on the unit circle).'};
    } else if(mode===1){
      const nv=3;
      return{question:`Expand cos(3θ) and sin(3θ) using De Moivre's theorem (binomial expansion).`,questionLatex:`\\text{Expand }\\cos 3\\theta\\text{ and }\\sin 3\\theta\\text{ using }(\\cos\\theta+i\\sin\\theta)^3.`,steps:[`(c + is)³ = c³ + 3c²(is) + 3c(is)² + (is)³  [c=cosθ, s=sinθ]`,`= c³ + 3ic²s − 3cs² − is³`,`= (c³ − 3cs²) + i(3c²s − s³)`,`Real part: cos 3θ = cos³θ − 3cosθ sin²θ = cos³θ − 3cosθ(1−cos²θ) = 4cos³θ − 3cosθ`,`Imaginary part: sin 3θ = 3cos²θ sinθ − sin³θ = 3(1−sin²θ)sinθ − sin³θ = 3sinθ − 4sin³θ`],answer:`cos 3θ = 4cos³θ − 3cosθ, sin 3θ = 3sinθ − 4sin³θ`,answerLatex:`\\cos 3\\theta=4\\cos^3\\theta-3\\cos\\theta,\\;\\sin 3\\theta=3\\sin\\theta-4\\sin^3\\theta`,tip:'Separate real and imaginary parts from the binomial expansion. Remember i²=−1, i³=−i.'};
    } else if(mode===2){
      const nv=srI(n+1,3,6);
      return{question:`Find all ${nv}th roots of unity. List them using Euler's formula.`,questionLatex:`z^{${nv}}=1.\\text{ Find all roots using Euler's formula.}`,steps:[`z^${nv} = 1 = e^(2πik) for integer k`,`z = e^(2πik/${nv}) = cos(2πk/${nv}) + i sin(2πk/${nv})`,`k = 0, 1, 2, …, ${nv-1}:`,...Array.from({length:nv},(_,k)=>`  k=${k}: cos(${fmt(360*k/nv,1)}°) + i sin(${fmt(360*k/nv,1)}°) = ${fmt(Math.cos(2*Math.PI*k/nv),4)} + ${fmt(Math.sin(2*Math.PI*k/nv),4)}i`),`Sum of all roots = 0 ✓`],answer:`${nv} roots at angles 0°, ${fmt(360/nv,1)}°, ${fmt(720/nv,1)}°, …`,answerLatex:`e^{2\\pi ik/${nv}},\\;k=0,1,...,${nv-1}`,tip:'nth roots of unity are equally spaced at angles 360°/n apart on the unit circle. They always sum to 0.'};
    } else {
      const nv=srI(n+1,3,5);
      return{question:`Using the geometric series formula, find the sum: 1 + cosθ + cos2θ + … + cos(${nv-1}θ).`,questionLatex:`\\sum_{k=0}^{${nv-1}}\\cos(k\\theta)=?`,steps:[`Let ω = e^(iθ). The sum = Re(1 + ω + ω² + … + ω^(${nv-1}))`,`Geometric series: (1 − ωⁿ)/(1 − ω) = (1 − e^(i${nv}θ))/(1 − e^(iθ))`,`Multiply numerator and denominator by e^(-iθ/2) ... e^(-i${nv}θ/2) respectively`,`= sin(${nv}θ/2) / sin(θ/2) × e^(i(${nv-1})θ/2)`,`Taking real part: cos(θ/2 + … + (${nv-1})θ/2) = Sum formula`,`Sum = sin(${nv}θ/2) / sin(θ/2) × cos((${nv-1})θ/2)`],answer:`sin(${nv}θ/2)/sin(θ/2) × cos((${nv-1})θ/2)`,answerLatex:`\\frac{\\sin(${nv}\\theta/2)}{\\sin(\\theta/2)}\\cos\\frac{${nv-1}}{2}\\theta`,tip:'Sum trig series via complex: take the geometric sum of e^(ikθ), then extract real (cos) or imaginary (sin) part.'};
    }
  },
  geometry_thms:(n)=>{
    const mode=n%3;
    if(mode===0){
      return{question:`In △ABC, cevians AD, BE, CF are concurrent (Ceva). Given AF=2, FB=3, BD=1, DC=4. Find CE/EA.`,questionLatex:`\\frac{AF}{FB}\\cdot\\frac{BD}{DC}\\cdot\\frac{CE}{EA}=1.\\text{ Given AF=2,FB=3,BD=1,DC=4.}`,steps:[`Ceva's Theorem: (AF/FB)×(BD/DC)×(CE/EA) = 1`,`(2/3) × (1/4) × (CE/EA) = 1`,`(2/12) × (CE/EA) = 1`,`(1/6) × (CE/EA) = 1`,`CE/EA = 6`],answer:`CE/EA = 6`,answerLatex:`\\frac{CE}{EA}=6`,tip:"Ceva's: for concurrent cevians, the PRODUCT of the three ratios = 1. For Menelaus (collinear), the product = −1 (signed)."};
    } else if(mode===1){
      const a=srI(n+1,3,8),b=srI(n+2,3,8),c=srI(n+3,3,8),d=srI(n+4,3,8);
      const ptol_lhs=Math.sqrt(a*a+c*c)*Math.sqrt(b*b+d*d);
      const ptol_rhs=a*b+c*d;
      return{question:`For a cyclic quadrilateral ABCD with AB=${a}, BC=${b}, CD=${c}, DA=${d} (verify with Ptolemy): AC·BD ≥ AB·CD + AD·BC?`,questionLatex:`\\text{Ptolemy: }AC\\cdot BD=AB\\cdot CD+AD\\cdot BC.`,steps:[`Ptolemy's Theorem: For cyclic quad, AC·BD = AB·CD + AD·BC`,`This is an EQUALITY for cyclic quadrilaterals`,`For non-cyclic: AC·BD ≥ AB·CD + AD·BC (inequality)`,`Example: rectangle with sides ${a} and ${b}:`,`Diagonals = √(${a}²+${b}²) = ${fmt(Math.sqrt(a*a+b*b),4)}`,`Ptolemy: diagonal² = a²+b² (Pythagorean theorem as special case!)`,`Ptolemy is a GENERALISATION of Pythagoras for cyclic quads`],answer:`For rectangle: diagonal = √(${a}²+${b}²) = ${fmt(Math.sqrt(a*a+b*b),4)}`,answerLatex:`AC\\cdot BD=AB\\cdot CD+AD\\cdot BC\\;(\\text{cyclic})`,tip:"Ptolemy's theorem is Pythagoras for cyclic quadrilaterals. A rectangle is a special cyclic quad — verify: the two diagonals are equal and the product equals sum of opposite sides' products."};
    } else {
      return{question:`State and apply the trigonometric form of Ceva's theorem to an equilateral triangle.`,questionLatex:`\\text{Trig-Ceva: }\\frac{\\sin\\angle BAD}{\\sin\\angle CAD}\\cdot\\frac{\\sin\\angle CBE}{\\sin\\angle ABE}\\cdot\\frac{\\sin\\angle ACF}{\\sin\\angle BCF}=1.`,steps:[`Trigonometric form of Ceva's theorem:`,`(sin∠BAD/sin∠CAD)×(sin∠CBE/sin∠ABE)×(sin∠ACF/sin∠BCF) = 1`,`For equilateral triangle, if cevians are medians:`,`Each angle is split equally: ∠BAD = ∠CAD = 30° (for median of equilateral)`,`Each ratio = sin30°/sin30° = 1`,`Product = 1×1×1 = 1 ✓`,`This confirms medians are concurrent (at centroid) ✓`],answer:`Product = 1 × 1 × 1 = 1 ✓ (medians concurrent)`,answerLatex:`\\frac{\\sin 30°}{\\sin 30°}\\cdot\\frac{\\sin 30°}{\\sin 30°}\\cdot\\frac{\\sin 30°}{\\sin 30°}=1\\;✓`,tip:"Trig-Ceva is more powerful than metric Ceva when angle bisectors, altitudes (not medians) are the cevians — angle conditions are often easier to handle."};
    }
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
      body{background:#070a10;}
      ::-webkit-scrollbar{width:5px;}
      ::-webkit-scrollbar-track{background:#070a10;}
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

// ── Cover Screen ───────────────────────────────────────────────
function CoverScreen({ onNext }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [300, 900, 1600].map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => ts.forEach(clearTimeout);
  }, []);
  const floaters = ['sinθ','cosθ','π','tanα','∑','e^{iθ}','2R','≤√2'];
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', background:'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 65%), #070a10', textAlign:'center' }}>
      {floaters.map((s, i) => (
        <div key={s} style={{ position:'fixed', pointerEvents:'none', fontSize:15+(i%3)*7, color:`rgba(245,158,11,${0.04+(i%4)*0.02})`, top:`${8+i*11}%`, left:i%2===0?`${2+i*4}%`:`${74+i*2}%`, fontFamily:'serif', animation:`pulse ${3+i*0.6}s ease-in-out infinite`, animationDelay:`${i*0.25}s` }}>{s}</div>
      ))}
      <div style={{ opacity:phase>=1?1:0, transform:phase>=1?'translateY(0)':'translateY(12px)', transition:'all 0.6s ease', marginBottom:20, display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:40 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'#F59E0B', animation:'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize:12, color:'#F59E0B', letterSpacing:'2px', textTransform:'uppercase', fontFamily:'Crimson Pro, serif' }}>Mathematics · Chapter 3</span>
      </div>
      <div style={{ opacity:phase>=2?1:0, transform:phase>=2?'translateY(0)':'translateY(20px)', transition:'all 0.7s ease 0.1s', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:'clamp(48px, 11vw, 100px)', color:'#fff', letterSpacing:'-3px', lineHeight:0.92, marginBottom:0 }}>
          Trigo<span style={{ color:'#F59E0B' }}>nometry</span>
        </h1>
        <div style={{ height:3, width:80, background:'linear-gradient(90deg, #F59E0B, transparent)', margin:'16px auto 0', borderRadius:2 }} />
      </div>
      <div style={{ opacity:phase>=3?1:0, transition:'all 0.6s ease', maxWidth:560, marginBottom:40 }}>
        <p style={{ fontFamily:'Crimson Pro, serif', fontSize:19, color:'rgba(255,255,255,0.7)', lineHeight:1.55, marginBottom:18, fontStyle:'italic' }}>
          {"\"Euler's formula e^(iθ) = cosθ + i sinθ is the most beautiful equation — connecting all of mathematics through angle.\""}
        </p>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 24px', textAlign:'left' }}>
          <div style={{ fontSize:11, color:'#F59E0B', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:12, fontFamily:'JetBrains Mono, monospace' }}>Chapter Overview</div>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>
            From angle measurement and the six trig functions, through identities, equations, inverse functions, and triangle geometry — all the way to Olympiad-level conditional identities, trig series, inequalities, De Moivre's theorem, and classical geometry theorems.
          </p>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:20 }}>
          {['Class 11 → Olympiad','16 Topics','∞ Practice','PRMO · RMO · INMO · IMO'].map(t => (
            <span key={t} style={{ padding:'4px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, fontSize:12, color:'rgba(255,255,255,0.5)', fontFamily:'Crimson Pro, serif' }}>{t}</span>
          ))}
        </div>
      </div>
      {phase >= 3 && (
        <button onClick={onNext} className="btn" style={{ padding:'16px 48px', background:'#F59E0B', color:'#070a10', border:'none', borderRadius:50, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, letterSpacing:'-0.3px', boxShadow:'0 8px 30px rgba(245,158,11,0.35)', animation:'fadeUp 0.5s ease both' }}>
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
    { title:'Angle Systems & Basic Functions', color:'#4ECDC4', rows:NOTATION.slice(0,8) },
    { title:'Pythagorean & Compound Identities', color:'#F59E0B', rows:NOTATION.slice(8,16) },
    { title:'Double/Half Angle & Transformations', color:'#F97316', rows:NOTATION.slice(16,19) },
    { title:'Triangle Formulae', color:'#34D399', rows:NOTATION.slice(19,22) },
    { title:'Inverse Trig & Complex Connection', color:'#C084FC', rows:NOTATION.slice(22) },
  ];
  return (
    <div style={{ minHeight:'100vh', background:'#070a10', padding:'32px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:32, opacity:revealed?1:0, transition:'opacity 0.5s ease' }}>
          <div style={{ fontSize:11, color:'#F59E0B', textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Before We Begin</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:34, color:'#fff', letterSpacing:'-1px', marginBottom:10 }}>Notation Guide</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>Master these symbols and formulas first — they form the complete language of trigonometry from Class 11 through Olympiad level.</p>
        </div>
        {groups.map((g, gi) => (
          <div key={g.title} style={{ marginBottom:24, opacity:revealed?1:0, transform:revealed?'translateY(0)':'translateY(16px)', transition:`all 0.5s ease ${gi*0.1+0.2}s` }}>
            <div style={{ fontSize:11, color:g.color, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:20, height:2, background:g.color, borderRadius:1 }} />
              {g.title}
            </div>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
              {g.rows.map((row, ri) => (
                <div key={ri} style={{ display:'grid', gridTemplateColumns:'110px 1fr 1fr', gap:0, borderBottom:ri<g.rows.length-1?'1px solid rgba(255,255,255,0.05)':'none', padding:'11px 16px', alignItems:'center' }}>
                  <div style={{ fontFamily:'serif', fontSize:14, color:g.color, overflowX:'auto' }}><KTex l={row.sym} /></div>
                  <div><div style={{ fontFamily:'Crimson Pro, serif', fontWeight:600, fontSize:13, color:'#fff', marginBottom:2 }}>{row.name}</div><div style={{ fontFamily:'Crimson Pro, serif', fontSize:12, color:'rgba(255,255,255,0.4)', fontStyle:'italic' }}>{row.meaning}</div></div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'JetBrains Mono,monospace', paddingLeft:8, overflowX:'auto' }}><KTex l={row.ex} style={{ fontSize:10 }} /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.03))', border:'1px solid rgba(245,158,11,0.2)', borderRadius:14, padding:'18px 20px', marginBottom:32 }}>
          <div style={{ fontSize:11, color:'#F59E0B', textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:12 }}>Memory Aids</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:8 }}>
            {[['ASTC','All Sinners Take Calculus — signs Q1→Q4'],['sin(A+B)','Same sign as ± in the formula'],['cos(A+B)','OPPOSITE sign — cosA cosB ∓ sinA sinB'],['sin 2θ','Always 2 sinθ cosθ, factor of 2!'],['tan + tan','Over 1 − tan·tan'],['R = √(a²+b²)','Max of a cosθ + b sinθ']].map(([sym,hint])=>(
              <div key={sym} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#F59E0B', minWidth:80 }}>{sym}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontFamily:'Crimson Pro,serif', fontStyle:'italic', lineHeight:1.4 }}>{hint}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onNext} className="btn" style={{ width:'100%', padding:'16px', background:'#F59E0B', color:'#070a10', border:'none', borderRadius:12, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:'0 6px 24px rgba(245,158,11,0.3)' }}>
          Start Learning Trigonometry →
        </button>
      </div>
    </div>
  );
}

// ── Section Menu ───────────────────────────────────────────────
function SectionMenuScreen({ onSelect, completedIds }) {
  const levels = ['Foundation','JEE','Olympiad'];
  const lColors = { Foundation:'#4ECDC4', JEE:'#F59E0B', Olympiad:'#C084FC' };
  const lDesc = { Foundation:'Class 11 · Core concepts & identities', JEE:'JEE Mains/Advanced · Equations & applications', Olympiad:'PRMO · RMO · INMO · IMO' };
  const allDone = SECTIONS.every(s => completedIds.has(s.id));
  return (
    <div style={{ minHeight:'100vh', background:'#070a10', padding:'28px 16px 60px' }}>
      <div style={{ maxWidth:660, margin:'0 auto' }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, color:'#F59E0B', textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>Chapter · Trigonometry</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:30, color:'#fff', letterSpacing:'-0.8px', marginBottom:6 }}>Choose a Topic</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:15, color:'rgba(255,255,255,0.4)' }}>Study in order for best results — each topic builds on the previous.</p>
        </div>
        {/* Progress */}
        <div style={{ marginBottom:24, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontFamily:'Crimson Pro,serif', fontSize:13, color:'rgba(255,255,255,0.5)' }}>Overall Progress</span>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'#F59E0B' }}>{completedIds.size}/{SECTIONS.length}</span>
          </div>
          <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(completedIds.size/SECTIONS.length)*100}%`, background:'linear-gradient(90deg,#F59E0B,#4ECDC4)', borderRadius:4, transition:'width 0.5s ease' }} />
          </div>
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
                    style={{ background:done?`${lColors[level]}10`:'rgba(255,255,255,0.025)', border:`1px solid ${done?lColors[level]+'44':'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'14px 18px', textAlign:'left', display:'flex', alignItems:'center', gap:14, transition:'all 0.2s' }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${lColors[level]}15`, border:`1px solid ${lColors[level]}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:lColors[level], fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>
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

// ── Learn Screen ───────────────────────────────────────────────
function SectionLearnScreen({ section, onPractice, onBack }) {
  const [tab, setTab] = useState('learn');
  const lColors = { Foundation:'#4ECDC4', JEE:'#F59E0B', Olympiad:'#C084FC' };
  const col = lColors[section.level] || '#F59E0B';
  return (
    <div style={{ minHeight:'100vh', background:'#070a10', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(7,10,16,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>← Topics</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:15, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{section.title}</div>
          <div style={{ fontSize:11, color:col, fontFamily:'JetBrains Mono,monospace' }}>{section.level}</div>
        </div>
      </div>
      <div style={{ maxWidth:660, margin:'0 auto', padding:'24px 16px' }}>
        <div style={{ display:'flex', gap:4, marginBottom:24, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4 }}>
          {['learn','keys'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn"
              style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:tab===t?col:'transparent', color:tab===t?'#070a10':'rgba(255,255,255,0.5)', fontFamily:'Crimson Pro, serif', fontWeight:600, fontSize:14 }}>
              {t==='learn'?'📖 Explanation':'🔑 Key Facts'}
            </button>
          ))}
        </div>
        {tab === 'learn' && (
          <div className="fade-in">
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:22 }}>
              <div style={{ width:56, height:56, borderRadius:14, background:`${col}15`, border:`1px solid ${col}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:col, fontFamily:'JetBrains Mono,monospace', flexShrink:0, letterSpacing:'-1px' }}>{section.icon}</div>
              <p style={{ fontFamily:'Playfair Display, serif', fontSize:18, color:'#fff', fontStyle:'italic', lineHeight:1.5 }}>"{section.shortDef}"</p>
            </div>
            {/* Diagrams */}
            {section.diagram === 'unitcircle' && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16, display:'flex', justifyContent:'center' }}>
                <UnitCircleSVG angleDeg={section.diagramAngle||45} color={col} size={240} />
              </div>
            )}
            {section.diagram === 'triangle' && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16, display:'flex', justifyContent:'center' }}>
                <TriangleSVG a={5} b={7} C_deg={60} color={col} size={260} />
              </div>
            )}
            {section.diagram === 'heightdist' && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16, display:'flex', justifyContent:'center' }}>
                <HeightDistSVG angleDeg={30} height={50} color={col} size={260} />
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
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:14 }}>Key Formulas & Results</div>
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
          <button onClick={onPractice} className="btn" style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${col},${col}cc)`, color:'#070a10', border:'none', borderRadius:12, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${col}40` }}>
            ⚡ Practice Questions →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Practice Screen ────────────────────────────────────────────
function PracticeScreen({ section, onBack, onDone, nextSection }) {
  const [qIdx, setQIdx] = useState(0);
  const [baseSeed] = useState(() => Math.floor(Math.random() * 9999));
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [count, setCount] = useState(0);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const lColors = { Foundation:'#4ECDC4', JEE:'#F59E0B', Olympiad:'#C084FC' };
  const col = lColors[section.level] || '#F59E0B';
  const gen = GENERATORS[section.genKey] || GENERATORS.angles;
  const seed = baseSeed + qIdx * 97;
  const question = useCallback(() => { try { return gen(seed); } catch(e) { return { question:'Loading…', steps:[], answer:'—', answerLatex:'—', tip:'' }; } }, [seed])();
  const next = () => { setQIdx(i => i+1); setShowAnswer(false); setShowSteps(false); setCount(c => c+1); };

  return (
    <div style={{ minHeight:'100vh', background:'#070a10', paddingBottom:80 }}>
      {/* Done confirmation modal */}
      {showDoneModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={() => setShowDoneModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0f1220', border:`1px solid ${col}44`, borderRadius:20, padding:'28px 24px', maxWidth:380, width:'100%', textAlign:'center' }}>
            <div style={{ marginBottom:16, display:'flex', justifyContent:'center' }}>
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={col} stopOpacity="0.25"/>
                    <stop offset="100%" stopColor={col} stopOpacity="0"/>
                  </radialGradient>
                  <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700"/>
                    <stop offset="50%" stopColor="#FFA500"/>
                    <stop offset="100%" stopColor="#FF6B35"/>
                  </linearGradient>
                  <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={col}/>
                    <stop offset="100%" stopColor="#fff"/>
                  </linearGradient>
                </defs>
                {/* Glow background */}
                <circle cx="36" cy="36" r="36" fill="url(#bgGlow)"/>
                {/* Outer ring */}
                <circle cx="36" cy="36" r="32" fill="none" stroke={col} strokeWidth="1.5" strokeOpacity="0.3"/>
                {/* Trophy cup body */}
                <path d="M24 18 h24 l-4 20 Q36 44 36 44 Q36 44 28 38 Z" fill="url(#trophyGrad)" opacity="0.95"/>
                {/* Trophy handles */}
                <path d="M24 22 Q16 22 16 30 Q16 36 24 36" fill="none" stroke="url(#trophyGrad)" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M48 22 Q56 22 56 30 Q56 36 48 36" fill="none" stroke="url(#trophyGrad)" strokeWidth="2.5" strokeLinecap="round"/>
                {/* Trophy stem */}
                <rect x="33" y="44" width="6" height="8" rx="1" fill="#FFA500" opacity="0.9"/>
                {/* Trophy base */}
                <rect x="27" y="52" width="18" height="4" rx="2" fill="url(#trophyGrad)"/>
                {/* Star on trophy */}
                <polygon points="36,21 37.5,25.5 42,25.5 38.5,28 40,32.5 36,30 32,32.5 33.5,28 30,25.5 34.5,25.5" fill="#FFF8DC" opacity="0.95"/>
                {/* Sparkle dots */}
                <circle cx="16" cy="16" r="2.5" fill={col} opacity="0.9"/>
                <circle cx="56" cy="16" r="2" fill="#FFD700" opacity="0.9"/>
                <circle cx="14" cy="48" r="1.8" fill="#FF6B35" opacity="0.8"/>
                <circle cx="58" cy="48" r="2.2" fill={col} opacity="0.8"/>
                <circle cx="36" cy="10" r="2" fill="#FFD700" opacity="0.7"/>
                {/* Confetti strips */}
                <rect x="10" y="22" width="3" height="7" rx="1.5" fill="#4ECDC4" opacity="0.8" transform="rotate(-25 11.5 25.5)"/>
                <rect x="59" y="28" width="3" height="7" rx="1.5" fill="#FF6B6B" opacity="0.8" transform="rotate(20 60.5 31.5)"/>
                <rect x="18" y="54" width="2.5" height="6" rx="1.25" fill="#FFD700" opacity="0.7" transform="rotate(15 19.25 57)"/>
                <rect x="51" y="52" width="2.5" height="6" rx="1.25" fill="#C084FC" opacity="0.7" transform="rotate(-20 52.25 55)"/>
              </svg>
            </div>
            <div style={{ fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:22, color:'#fff', marginBottom:8 }}>Topic Complete!</div>
            <div style={{ fontFamily:'Crimson Pro, serif', fontSize:15, color:'rgba(255,255,255,0.55)', marginBottom:24, lineHeight:1.5 }}>
              Great work on <em>{section.title}</em>! You practised {count + 1} question{count !== 0 ? 's' : ''}.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {nextSection && (
                <button onClick={() => { onDone(true); setShowDoneModal(false); }} className="btn"
                  style={{ padding:'13px', background:`linear-gradient(135deg,${col},${col}cc)`, color:'#070a10', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:15 }}>
                  Next: {nextSection.title} →
                </button>
              )}
              <button onClick={() => { onDone(false); setShowDoneModal(false); }} className="btn"
                style={{ padding:'13px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'#e2e8f0', borderRadius:12, fontFamily:'Crimson Pro,serif', fontSize:15 }}>
                ← Back to Topics
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(7,10,16,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>← Learn</button>
          <div style={{ flex:1, fontFamily:'Playfair Display, serif', fontSize:14, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{section.title}</div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, color:col, background:`${col}15`, padding:'4px 10px', borderRadius:20, flexShrink:0 }}>Q {count+1}</div>
          <button onClick={() => setShowDoneModal(true)} className="btn" style={{ background:`${col}20`, border:`1px solid ${col}44`, color:col, borderRadius:8, padding:'6px 13px', fontSize:13, fontWeight:700, flexShrink:0 }}>Done ✓</button>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'Crimson Pro,serif', fontStyle:'italic' }}>Infinite practice · Every question is uniquely generated</div>
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
              <div style={{ overflowX:'auto', padding:'4px 0' }}><KTex l={question.answerLatex||question.answer} style={{ color:col, fontSize:16 }} /></div>
            </div>
            {question.tip && (
              <div style={{ background:'rgba(255,209,102,0.06)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:10, alignItems:'flex-start' }}>
                <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
                <p style={{ fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:14, color:'rgba(255,209,102,0.85)', lineHeight:1.6 }}>{question.tip}</p>
              </div>
            )}
            <button onClick={next} className="btn" style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${col},${col}cc)`, color:'#070a10', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${col}40` }}>
              Next Question ⟶
            </button>
            <p style={{ textAlign:'center', marginTop:10, fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:13, color:'rgba(255,255,255,0.25)' }}>Questions are procedurally generated — they never repeat.</p>
          </div>
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

  const markDone = (goNext) => {
    setCompletedIds(prev => new Set([...prev, activeSection.id]));
    if (goNext && nextSection) {
      setActiveIdx(SECTIONS.indexOf(nextSection));
      setScreen('learn');
    } else {
      setScreen('menu');
    }
  };

  if (screen === 'cover')    return <CoverScreen onNext={() => setScreen('notation')} />;
  if (screen === 'notation') return <NotationScreen onNext={() => setScreen('menu')} />;
  if (screen === 'menu')     return <SectionMenuScreen completedIds={completedIds} onSelect={sec => { setActiveIdx(SECTIONS.indexOf(sec)); setScreen('learn'); }} />;
  if (screen === 'learn')    return <SectionLearnScreen section={activeSection} onBack={() => setScreen('menu')} onPractice={() => setScreen('practice')} />;
  if (screen === 'practice') return <PracticeScreen section={activeSection} onBack={() => setScreen('learn')} onDone={markDone} nextSection={nextSection} />;
  return <CoverScreen onNext={() => setScreen('notation')} />;
}

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
const ACCENT = '#0EA5E9';
function gcd(a,b){return b===0?Math.abs(a):gcd(b,a%b);}
function iPow(r){return['1','i','-1','-i'][((r%4)+4)%4];}
function fmtC(a,b){return `${a}${b>=0?'+':''}${b}i`;}
function modSqStr(a,b){const m=a*a+b*b;return Number.isInteger(Math.sqrt(m))?`${Math.sqrt(m)}`:`\\sqrt{${m}}`;}

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

// ── Complex Plane SVG ──────────────────────────────────────────
function ComplexPlaneSVG({ a=3, b=2, color=ACCENT, size=300 }) {
  const W=size, H=Math.round(size*0.62), pad=28;
  const range=Math.max(Math.abs(a),Math.abs(b),1)+2;
  const sx=x=>pad+((x+range)/(2*range))*(W-2*pad);
  const sy=y=>pad+((range-y)/(2*range))*(H-2*pad);
  const ox=sx(0),oy=sy(0),px=sx(a),py=sy(b);
  const m2=a*a+b*b; const mStr=Number.isInteger(Math.sqrt(m2))?`${Math.sqrt(m2)}`:`√${m2}`;
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      {[-2,-1,1,2].map(v=>(
        <g key={v}>
          <line x1={sx(v)} y1={pad} x2={sx(v)} y2={H-pad} stroke="rgba(255,255,255,0.05)" strokeWidth={1}/>
          <line x1={pad} y1={sy(v)} x2={W-pad} y2={sy(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1}/>
        </g>
      ))}
      <line x1={pad} y1={oy} x2={W-pad} y2={oy} stroke="rgba(255,255,255,0.22)" strokeWidth={1.2}/>
      <line x1={ox} y1={pad} x2={ox} y2={H-pad} stroke="rgba(255,255,255,0.22)" strokeWidth={1.2}/>
      <text x={W-pad+3} y={oy+4} fontSize={9} fill="rgba(255,255,255,0.35)" fontFamily="serif" fontStyle="italic">Re</text>
      <text x={ox+4} y={pad-4} fontSize={9} fill="rgba(255,255,255,0.35)" fontFamily="serif" fontStyle="italic">Im</text>
      <line x1={ox} y1={py} x2={px} y2={py} stroke={`${color}44`} strokeWidth={1.2} strokeDasharray="4,3"/>
      <line x1={px} y1={oy} x2={px} y2={py} stroke={`${color}44`} strokeWidth={1.2} strokeDasharray="4,3"/>
      <text x={px+(a>=0?4:-26)} y={oy+13} fontSize={9} fill={`${color}99`} fontFamily="monospace">{a}</text>
      <text x={ox+4} y={py+(b>=0?-4:12)} fontSize={9} fill={`${color}99`} fontFamily="monospace">{b}i</text>
      <defs><marker id="arrcn" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={color}/></marker></defs>
      <line x1={ox} y1={oy} x2={px} y2={py} stroke={color} strokeWidth={2.2} markerEnd="url(#arrcn)"/>
      <circle cx={px} cy={py} r={6} fill={color}/>
      <circle cx={px} cy={py} r={11} fill={`${color}18`} stroke={`${color}33`} strokeWidth={1}/>
      <text x={px+(a>=0?13:-44)} y={py+(b>=0?-9:17)} fontSize={12} fill={color} fontFamily="serif" fontStyle="italic" fontWeight="bold">{fmtC(a,b)}</text>
      <text x={W/2} y={H-5} textAnchor="middle" fontSize={9} fill={`${color}66`} fontFamily="serif" fontStyle="italic">|z| = {mStr}</text>
    </svg>
  );
}

// ── Unit Circle SVG ────────────────────────────────────────────
function UnitCircleSVG({ n=6, color=ACCENT, size=300 }) {
  const W=size, H=Math.round(size*0.65), cx=W/2, cy=H/2, R=Math.round(H*0.36);
  const pts=Array.from({length:n},(_,k)=>({x:cx+R*Math.cos(2*Math.PI*k/n-Math.PI/2),y:cy+R*Math.sin(2*Math.PI*k/n-Math.PI/2),k}));
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      <line x1={cx-R-16} y1={cy} x2={cx+R+16} y2={cy} stroke="rgba(255,255,255,0.2)" strokeWidth={1}/>
      <line x1={cx} y1={cy-R-16} x2={cx} y2={cy+R+16} stroke="rgba(255,255,255,0.2)" strokeWidth={1}/>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={`${color}35`} strokeWidth={1.5} strokeDasharray="5,4"/>
      {pts.map(p=>(
        <g key={p.k}>
          <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={`${color}35`} strokeWidth={1}/>
          <circle cx={p.x} cy={p.y} r={7} fill={color} opacity={0.88}/>
          <text x={p.x+(p.x>cx?10:-32)} y={p.y+(p.y<cy?-7:17)} fontSize={9} fill={color} fontFamily="JetBrains Mono,monospace">ω^{p.k}</text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r={3} fill="rgba(255,255,255,0.4)"/>
      <text x={cx+R+5} y={cy+4} fontSize={9} fill="rgba(255,255,255,0.35)" fontFamily="serif" fontStyle="italic">Re</text>
      <text x={cx+3} y={cy-R-6} fontSize={9} fill="rgba(255,255,255,0.35)" fontFamily="serif" fontStyle="italic">Im</text>
      <text x={W/2} y={H-4} textAnchor="middle" fontSize={9} fill={`${color}66`} fontFamily="JetBrains Mono,monospace">{n}th roots of unity</text>
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
  {sym:'i',name:'Imaginary Unit',meaning:'Defined by i²=−1; the foundation of ℂ',ex:'i^2=-1,\\;i^3=-i,\\;i^4=1'},
  {sym:'z=a+bi',name:'Complex Number',meaning:'a=Re(z), b=Im(z), both real',ex:'3+4i,\\;a=3,\\;b=4'},
  {sym:'\\text{Re}(z)',name:'Real Part',meaning:'The real component of z=a+bi',ex:'\\text{Re}(3+4i)=3'},
  {sym:'\\text{Im}(z)',name:'Imaginary Part',meaning:'The imaginary component of z=a+bi',ex:'\\text{Im}(3+4i)=4'},
  {sym:'\\mathbb{C}',name:'Complex Number Field',meaning:'All numbers a+bi; contains ℝ as a subset',ex:'\\mathbb{R}\\subset\\mathbb{C}'},
  {sym:'\\bar{z}',name:'Conjugate',meaning:'Flip sign of Im part: a+bi → a−bi',ex:'\\overline{3+4i}=3-4i'},
  {sym:'|z|',name:'Modulus',meaning:'Distance from origin: √(a²+b²) ≥ 0',ex:'|3+4i|=5'},
  {sym:'z\\bar{z}=|z|^2',name:'Modulus Squared',meaning:'Always real and ≥0; key identity for division',ex:'(3+4i)(3-4i)=25'},
  {sym:'\\arg(z)',name:'Argument',meaning:'Angle from positive real axis, in (−π, π]',ex:'\\arg(1+i)=\\pi/4'},
  {sym:'re^{i\\theta}',name:'Polar / Euler Form',meaning:'r=|z|, θ=arg(z); compact representation',ex:'2e^{i\\pi/3}=1+i\\sqrt{3}'},
  {sym:'e^{i\\theta}=\\cos\\theta+i\\sin\\theta',name:"Euler's Formula",meaning:'Bridge between exponential and trig forms',ex:'e^{i\\pi}+1=0'},
  {sym:'|z_1z_2|=|z_1||z_2|',name:'Modulus Product Rule',meaning:'Moduli multiply; arguments add under ×',ex:'|z^n|=|z|^n'},
  {sym:'(\\cos\\theta+i\\sin\\theta)^n',name:"De Moivre's Theorem",meaning:'=cos(nθ)+i sin(nθ) for all n∈ℤ',ex:'(e^{i\\theta})^n=e^{in\\theta}'},
  {sym:'\\omega_k=e^{2\\pi ik/n}',name:'nth Roots of Unity',meaning:'n solutions to zⁿ=1, equally spaced on unit circle',ex:'1+\\omega+\\omega^2=0\\;(n=3)'},
  {sym:'|z_1+z_2|\\leq|z_1|+|z_2|',name:'Triangle Inequality',meaning:'Fundamental bound on modulus of sums',ex:'\\bigl||z_1|-|z_2|\\bigr|\\leq|z_1-z_2|'},
  {sym:'|z-a|=r',name:'Circle Locus',meaning:'Points at distance r from centre a',ex:'|z-2i|=3\\text{ is a circle}'},
  {sym:'|z-a|=|z-b|',name:'Perpendicular Bisector',meaning:'Equidistant from a and b',ex:'\\text{Perp. bisector of }[a,b]'},
  {sym:'z\\mapsto e^{i\\alpha}z',name:'Rotation Map',meaning:'Multiplying by e^{iα} rotates by α (CCW)',ex:'iz\\text{ rotates }90^\\circ'},
  {sym:'\\prod_{k=1}^{n-1}(1-\\omega^k)=n',name:'Product Identity',meaning:'From setting z=1 in zⁿ−1 factorization',ex:'(1-\\omega)(1-\\omega^2)=3\\;(n=3)'},
  {sym:'z=\\bar{z}\\Leftrightarrow z\\in\\mathbb{R}',name:'Real Number Test',meaning:'z is real iff z equals its conjugate',ex:'\\text{Im}(z)=0\\Leftrightarrow z=\\bar{z}'},
  {sym:'\\text{Re}(z\\bar{w})',name:'Complex Dot Product',meaning:'=|z||w|cosθ — equals the vector dot product',ex:'\\text{Re}(z\\bar{w})=\\vec{z}\\cdot\\vec{w}'},
  {sym:'a,b,c\\text{ collinear}\\Leftrightarrow\\frac{a-b}{c-b}\\in\\mathbb{R}',name:'Collinearity Condition',meaning:'(a−b)/(c−b) is real iff the three points are collinear',ex:'\\text{Useful in geometry proofs}'},
];

// ── Sections ───────────────────────────────────────────────────
const SECTIONS = [
  {id:'cn_intro',title:'Introduction to Complex Numbers',level:'Foundation',color:'#0EA5E9',icon:'i²=−1',
   shortDef:"z=a+bi with i²=−1. Powers of i cycle: i¹=i, i²=−1, i³=−i, i⁴=1. Two complex numbers are equal iff both real and imaginary parts are equal.",
   fullDef:"The imaginary unit i is defined by i²=−1. A complex number z=a+bi has real part a and imaginary part b, both real. Every real number is complex (set b=0), so ℝ⊂ℂ. The powers of i repeat with period 4: i¹=i, i²=−1, i³=−i, i⁴=1. To find iⁿ, compute n mod 4: 0→1, 1→i, 2→−1, 3→−i. Key trick: iⁿ+iⁿ⁺²=iⁿ(1+i²)=0 always. Two complex numbers are equal iff their real parts are equal AND imaginary parts are equal — 'equating real and imaginary parts' is used in nearly every proof.",
   keyFacts:[{text:'Imaginary unit',l:'i^2=-1'},{text:'Power cycle (period 4)',l:'i^1=i,\\;i^2=-1,\\;i^3=-i,\\;i^4=1'},{text:'General power',l:'i^n=i^{n\\bmod4}'},{text:'Always zero',l:'i^n+i^{n+2}=i^n(1+i^2)=0\\;\\forall n'},{text:'Equality principle',l:'a+bi=c+di\\Leftrightarrow a=c\\text{ AND }b=d'}],
   genKey:'cn_intro',diagram:'argand'},
  {id:'cn_algebra',title:'Algebra of Complex Numbers',level:'Foundation',color:'#38BDF8',icon:'+−×÷',
   shortDef:"Add real and imaginary parts separately; multiply using FOIL with i²=−1; divide by multiplying numerator and denominator by the conjugate.",
   fullDef:"Addition/Subtraction: (a+bi)±(c+di)=(a±c)+(b±d)i — combine like terms. Multiplication: (a+bi)(c+di)=ac+adi+bci+bdi²=(ac−bd)+(ad+bc)i (replace i²=−1). Division: multiply top and bottom by the conjugate (c−di) to make denominator real: (c+di)(c−di)=c²+d². Key shortcut: (1+i)²=2i. All field axioms hold in ℂ, making it algebraically closed. The multiplicative inverse is z⁻¹=z̄/|z|².",
   keyFacts:[{text:'Addition',l:'(a+bi)+(c+di)=(a+c)+(b+d)i'},{text:'Multiplication',l:'(a+bi)(c+di)=(ac-bd)+(ad+bc)i'},{text:'Division via conjugate',l:'\\dfrac{a+bi}{c+di}=\\dfrac{(a+bi)(c-di)}{c^2+d^2}'},{text:'Product shortcut',l:'(a+bi)(a-bi)=a^2+b^2\\;(\\text{always real!})'},{text:'Key: (1+i)²',l:'(1+i)^2=2i\\Rightarrow(1+i)^{2n}=(2i)^n'}],
   genKey:'cn_algebra'},
  {id:'cn_conjugate',title:'Conjugate & Modulus',level:'Foundation',color:'#7DD3FC',icon:'z̄,|z|',
   shortDef:"Conjugate z̄=a−bi flips the imaginary sign. Modulus |z|=√(a²+b²) is the distance from origin. z·z̄=|z|² is always real.",
   fullDef:"The conjugate z̄ of z=a+bi is a−bi. Key identities: z+z̄=2Re(z), z−z̄=2i·Im(z), z·z̄=|z|²=a²+b² (always real and ≥0). The modulus satisfies |z₁z₂|=|z₁||z₂|. To prove z is real: show z=z̄. To prove purely imaginary: show z+z̄=0. For z=(a+i)/(a−i) with real a: |z|=1 since numerator and denominator are conjugates of equal modulus. The identity z·z̄=z+z̄ gives |z−1|²=1 — a circle locus.",
   keyFacts:[{text:'Conjugate definition',l:'\\bar{z}=a-bi'},{text:'Sum: 2×Re(z)',l:'z+\\bar{z}=2\\,\\text{Re}(z)'},{text:'Product = |z|²',l:'z\\bar{z}=|z|^2=a^2+b^2'},{text:'Modulus formula',l:'|z|=\\sqrt{a^2+b^2}\\geq 0'},{text:'Modulus multiplicative',l:'|z_1z_2|=|z_1||z_2|,\\;|z^n|=|z|^n'}],
   genKey:'cn_conjugate',diagram:'argand'},
  {id:'cn_argand',title:'The Argand Plane',level:'Foundation',color:'#06B6D4',icon:'ℂ-plane',
   shortDef:"z=a+bi is plotted at (a,b): real axis horizontal, imaginary axis vertical. Multiplying by i rotates 90° CCW. |z₁−z₂| is the Euclidean distance.",
   fullDef:"The Argand plane represents z=a+bi as point (a,b). x-axis = real axis; y-axis = imaginary axis. Key geometric facts: |z| is the distance from origin; |z₁−z₂| is the distance between z₁ and z₂; z̄ is the reflection of z across the real axis; midpoint of z₁,z₂ is (z₁+z₂)/2. Multiplying by i rotates 90° CCW: i(a+bi)=−b+ai, so point (a,b)↦(−b,a). The argument arg(z) is the anticlockwise angle from the positive real axis, in (−π,π].",
   keyFacts:[{text:'Coordinate',l:'z=a+bi\\leftrightarrow(a,b)\\in\\mathbb{R}^2'},{text:'Distance between z₁,z₂',l:'|z_1-z_2|=\\sqrt{(a_1-a_2)^2+(b_1-b_2)^2}'},{text:'Midpoint',l:'\\text{mid}=\\dfrac{z_1+z_2}{2}'},{text:'Conjugate = reflection',l:'\\bar{z}\\leftrightarrow(a,-b)'},{text:'×i = 90° CCW rotation',l:'i(a+bi)=-b+ai'}],
   genKey:'cn_argand'},
  {id:'cn_polar',title:"Polar Form & Euler's Formula",level:'Foundation',color:'#0369A1',icon:'re^{iθ}',
   shortDef:"z=re^{iθ}=r(cosθ+i sinθ) where r=|z| and θ=arg(z). Multiplication: multiply moduli, add arguments. e^{iπ}+1=0.",
   fullDef:"Euler's formula e^{iθ}=cosθ+i sinθ links complex exponentials to trigonometry. Every nonzero z=re^{iθ} with r=|z|>0 and θ=arg(z). Multiplication: z₁z₂=r₁r₂·e^{i(θ₁+θ₂)} — moduli multiply, arguments add. Division subtracts arguments. Key values: e^{iπ/2}=i, e^{iπ}=−1, e^{i·3π/2}=−i, e^{2πi}=1. Converting a+bi to polar: r=√(a²+b²), θ=arctan(b/a) adjusted for quadrant. Euler's identity e^{iπ}+1=0 is often called 'the most beautiful formula in mathematics'.",
   keyFacts:[{text:'Polar form',l:'z=r(\\cos\\theta+i\\sin\\theta)=re^{i\\theta}'},{text:"Euler's formula",l:'e^{i\\theta}=\\cos\\theta+i\\sin\\theta'},{text:'Multiplication',l:'z_1z_2=r_1r_2\\,e^{i(\\theta_1+\\theta_2)}'},
   {text:'Key values',l:'e^{i\\pi/2}=i,\\;e^{i\\pi}=-1,\\;e^{2\\pi i}=1'},{text:"Euler's identity",l:'e^{i\\pi}+1=0'}],
   genKey:'cn_polar'},
  {id:'cn_demoivre',title:"De Moivre's Theorem",level:'JEE',color:'#F59E0B',icon:'(cθ+isθ)ⁿ',
   shortDef:"(cosθ+i sinθ)ⁿ=cos(nθ)+i sin(nθ) for all n∈ℤ. Used for powers, roots, and multi-angle trig identities.",
   fullDef:"De Moivre's theorem: (re^{iθ})ⁿ=rⁿe^{inθ}. For negative n: (cosθ+i sinθ)^{−n}=cos(nθ)−i sin(nθ). Application to multi-angle: expand (cosθ+i sinθ)³ → real part gives cos3θ=4cos³θ−3cosθ, imaginary gives sin3θ=3sinθ−4sin³θ. For roots: n distinct nth roots of re^{iθ} are r^{1/n}·e^{i(θ+2kπ)/n}, k=0,…,n−1. Key example: (1+i)^8=(√2·e^{iπ/4})^8=2⁴·e^{i2π}=16.",
   keyFacts:[{text:"De Moivre's Theorem",l:'(\\cos\\theta+i\\sin\\theta)^n=\\cos n\\theta+i\\sin n\\theta'},{text:'Power form',l:'(re^{i\\theta})^n=r^ne^{in\\theta}'},{text:'cos 3θ',l:'\\cos 3\\theta=4\\cos^3\\!\\theta-3\\cos\\theta'},{text:'sin 3θ',l:'\\sin 3\\theta=3\\sin\\theta-4\\sin^3\\!\\theta'},{text:'Key example',l:'(1+i)^8=16\\;(\\text{since }|1+i|=\\sqrt{2})'}],
   genKey:'cn_demoivre'},
  {id:'cn_roots',title:'Roots of Unity & nth Roots',level:'JEE',color:'#FBBF24',icon:'ωⁿ=1',
   shortDef:"The n solutions to zⁿ=1 are equally spaced on the unit circle: ωₖ=e^{2πik/n}. Their sum is always 0.",
   fullDef:"The equation zⁿ=1 has exactly n solutions (nth roots of unity): ωₖ=e^{2πik/n} for k=0,1,…,n−1. They lie at equal angular spacing 2π/n on the unit circle. Let ω=e^{2πi/n} (primitive root). Key identity: their sum=0 for n≥2 (geometric series or Vieta's). Product of all nth roots=(−1)^{n+1}. For cube roots: 1+ω+ω²=0, ω³=1. Formula (1+ω)^n: since 1+ω=−ω², (1+ω)^n=(−ω²)^n=(−1)^n·ω^{2n}. For general zⁿ=w: roots are |w|^{1/n}·e^{i(arg(w)+2kπ)/n}.",
   keyFacts:[{text:'Primitive nth root',l:'\\omega=e^{2\\pi i/n}'},{text:'Sum = 0 (n≥2)',l:'\\sum_{k=0}^{n-1}\\omega^k=0'},{text:'Cube root identity',l:'1+\\omega+\\omega^2=0,\\;\\omega^3=1'},{text:'(1+ω)^n formula',l:'1+\\omega=-\\omega^2\\Rightarrow(1+\\omega)^n=(-1)^n\\omega^{2n}'},{text:'Product of all roots',l:'\\prod_{k=0}^{n-1}\\omega^k=(-1)^{n+1}'}],
   genKey:'cn_roots',diagram:'unitcircle'},
  {id:'cn_quadratic',title:'Complex Roots of Polynomials',level:'JEE',color:'#F97316',icon:'Δ<0',
   shortDef:"When Δ<0, quadratic has complex conjugate roots. Every degree-n polynomial has exactly n roots in ℂ (FTA). Vieta: sum=−b/a, product=c/a.",
   fullDef:"For ax²+bx+c=0 with Δ=b²−4ac<0: roots are (−b±i√|Δ|)/(2a) — a conjugate pair. Fundamental Theorem of Algebra: every polynomial of degree n over ℂ has exactly n roots (counting multiplicity). Conjugate Root Theorem: for real coefficients, if α is a root, so is ᾱ. Vieta's formulas for z²+pz+q=0: sum of roots=−p, product=q. Key: product of conjugate roots=|z|², so |z|²=q/a directly. The monic quadratic with roots α,ᾱ is z²−2Re(α)z+|α|².",
   keyFacts:[{text:'Complex quadratic formula',l:'x=\\dfrac{-b\\pm i\\sqrt{|\\Delta|}}{2a},\\;\\Delta<0'},{text:'Conjugate root theorem',l:'p(\\alpha)=0\\Rightarrow p(\\bar{\\alpha})=0'},{text:'FTA',l:'\\deg p=n\\Rightarrow n\\text{ roots in }\\mathbb{C}'},{text:"Vieta's (z²+pz+q=0)",l:'z_1+z_2=-p,\\;z_1z_2=q'},{text:'Modulus from product',l:'|z|^2=z_1z_2=q\\;(\\text{conjugate pair})'}],
   genKey:'cn_quadratic'},
  {id:'cn_loci',title:'Complex Loci & Geometry',level:'JEE',color:'#A78BFA',icon:'|z−a|=r',
   shortDef:"|z−a|=r is a circle. |z−a|=|z−b| is the perpendicular bisector. Re(z)=k is a vertical line. Im(z)=k is horizontal.",
   fullDef:"Locus problems: |z−a|=r → circle, centre a, radius r. |z−a|=|z−b| → perpendicular bisector of [a,b]. arg(z−a)=θ → ray from a at angle θ. Re(z)=k → vertical line x=k. Im(z)=k → horizontal line y=k. For |z+iz̄|=k: substitute z=x+iy to get z+iz̄=(x+y)+(x+y)i=(x+y)(1+i), so modulus=|x+y|√2=k → two parallel lines. The locus |z−1|+|z+1|=4 is an ellipse with foci ±1. The locus |z−a|≤|z−b| is the half-plane of points closer to a.",
   keyFacts:[{text:'Circle',l:'|z-a|=r'},{text:'Perp. bisector',l:'|z-a|=|z-b|'},{text:'Vertical/horizontal lines',l:'\\text{Re}(z)=k\\text{ or }\\text{Im}(z)=k'},{text:'Parallel lines trick',l:'|z+i\\bar{z}|=k\\Rightarrow|x+y|\\sqrt{2}=k'},{text:'Ellipse',l:'|z-a|+|z-b|=2c\\;(c>|a-b|/2)'}],
   genKey:'cn_loci'},
  {id:'cn_triangle_ineq',title:'Triangle Inequality & Modulus Bounds',level:'JEE',color:'#34D399',icon:'||z|−|w||',
   shortDef:"|z₁+z₂|≤|z₁|+|z₂| (upper bound). ||z₁|−|z₂||≤|z₁−z₂| (lower bound). Both are sharp — equality conditions matter.",
   fullDef:"Triangle inequality: |z₁+z₂|≤|z₁|+|z₂|. Equality iff z₁=λz₂ for real λ≥0 (same direction). Reverse triangle inequality: ||z₁|−|z₂||≤|z₁−z₂|. Range of |z₁−z₂|: [||z₁|−|z₂||, |z₁|+|z₂|]. For polynomials on a circle |z|=r: |aₙzⁿ+…+a₀|≤|aₙ|rⁿ+…+|a₀|. Minimum of |z−w| on circle |z|=r is |dist(O,w)−r|. For |z|>1 and bounding 1/(z−a): |z−a|≥|z|−|a|, so |1/(z−a)|≤1/(|z|−|a|).",
   keyFacts:[{text:'Triangle inequality',l:'|z_1+z_2|\\leq|z_1|+|z_2|'},{text:'Equality condition',l:'z_1=\\lambda z_2,\\;\\lambda\\geq 0'},{text:'Reverse TI',l:'\\bigl||z_1|-|z_2|\\bigr|\\leq|z_1-z_2|'},{text:'Range of |z₁−z₂|',l:'|\\,|z_1|-|z_2|\\,|\\leq|z_1-z_2|\\leq|z_1|+|z_2|'},{text:'Bound on polynomial',l:'|P(z)|\\leq|a_n||z|^n+\\cdots+|a_0|'}],
   genKey:'cn_triangle_ineq'},
  {id:'cn_transforms',title:'Rotations & Spiral Similarities',level:'Olympiad',color:'#C084FC',icon:'e^{iα}z',
   shortDef:"Multiplying by e^{iα} rotates by α. Rotation about point p: e^{iα}(z−p)+p. Fixed point of z↦wz+b: z₀=b/(1−w).",
   fullDef:"Geometric maps: Translation: z↦z+w₀. Rotation by α about origin: z↦e^{iα}z. Rotation by α about p: z↦e^{iα}(z−p)+p. Spiral similarity: z↦wz+b (w=re^{iα}). Reflection across real axis: z↦z̄. Reflection across line at angle α: z↦e^{2iα}z̄. Fixed point of z↦wz+b (w≠1): z₀=b/(1−w). Key: multiplying by i rotates 90° CCW; by e^{iπ/3} rotates 60°. In Olympiad geometry, complex numbers turn angle chasing into algebra: equilateral triangles, squares, and regular polygons become roots of unity.",
   keyFacts:[{text:'Rotation about origin by α',l:'z\\mapsto e^{i\\alpha}z'},{text:'Rotation about p by α',l:'z\\mapsto e^{i\\alpha}(z-p)+p'},{text:'Fixed point of z↦wz+b',l:'z_0=b/(1-w)'},{text:'Reflection across real axis',l:'z\\mapsto\\bar{z}'},{text:'90° CCW = multiply by i',l:'i(a+bi)=-b+ai'}],
   genKey:'cn_transforms'},
  {id:'cn_poly',title:'Polynomials & Product Identities',level:'Olympiad',color:'#E879F9',icon:'P(ω)',
   shortDef:"Factor zⁿ−1=∏(z−ωk). Set z=1: ∏(1−ωk)=n. Real quadratic factor from conjugate pair: z²−2Re(α)z+|α|².",
   fullDef:"FTA guarantees p(z)=aₙ(z−z₁)⋯(z−zₙ) over ℂ. For real polynomials, complex roots pair as conjugates giving real quadratic factors (z−α)(z−ᾱ)=z²−2Re(α)z+|α|². The factorization zⁿ−1=∏_{k=0}^{n−1}(z−ωk) is central: dividing by (z−1) gives zⁿ⁻¹+⋯+1=∏_{k=1}^{n−1}(z−ωk). Setting z=1: n=∏_{k=1}^{n−1}(1−ωk). Also: z³−1=(z−1)(z²+z+1); for cube root ω, z²+z+1=0 has roots ω,ω².",
   keyFacts:[{text:'Factorization of zⁿ−1',l:'z^n-1=\\prod_{k=0}^{n-1}(z-\\omega^k)'},{text:'Key product identity',l:'\\prod_{k=1}^{n-1}(1-\\omega^k)=n'},{text:'Real quadratic factor',l:'(z-\\alpha)(z-\\bar{\\alpha})=z^2-2\\text{Re}(\\alpha)z+|\\alpha|^2'},{text:'Cube root factorization',l:'z^3-1=(z-1)(z^2+z+1)'},{text:'(1+ω)(1+ω²)',l:'=(1+\\omega+\\omega^2+\\omega^3)=1\\;(\\text{for cube root})'}],
   genKey:'cn_poly'},
  {id:'cn_vieta',title:"Vieta's Formulas & Symmetric Sums",level:'Olympiad',color:'#F472B6',icon:'∑zᵢ',
   shortDef:"Sum and product of roots read directly from coefficients. z₁²+z₂²=(z₁+z₂)²−2z₁z₂. Never solve the polynomial to use Vieta's.",
   fullDef:"For z²−Sz+P=0: sum z₁+z₂=S, product z₁z₂=P. Derived identities: z₁²+z₂²=(z₁+z₂)²−2z₁z₂=S²−2P. (z₁−z₂)²=(z₁+z₂)²−4z₁z₂=S²−4P (negative → complex roots). 1/z₁+1/z₂=(z₁+z₂)/(z₁z₂)=S/P. For cubic z³−e₁z²+e₂z−e₃=0: sum=e₁, sum of pairwise products=e₂, product=e₃. Sum of squares=e₁²−2e₂. Newton's identities extend these to all power sums pₖ=Σzᵢᵏ.",
   keyFacts:[{text:'Vieta for quadratic',l:'z_1+z_2=-b/a,\\;z_1z_2=c/a'},{text:'Sum of squares',l:'z_1^2+z_2^2=(z_1+z_2)^2-2z_1z_2'},{text:'(z₁−z₂)²',l:'(z_1-z_2)^2=(z_1+z_2)^2-4z_1z_2'},{text:'Sum of reciprocals',l:'\\dfrac{1}{z_1}+\\dfrac{1}{z_2}=\\dfrac{z_1+z_2}{z_1z_2}'},{text:'Find k from sum of squares',l:'S^2-2k=\\sum z_i^2\\Rightarrow k=\\tfrac{S^2-\\text{target}}{2}'}],
   genKey:'cn_vieta'},
  {id:'cn_tricks',title:'Olympiad Tricks: Conjugates & Dot Products',level:'Olympiad',color:'#FB923C',icon:'Re(zw̄)',
   shortDef:"Re(zw̄)=dot product. |z|=1⟹z̄=1/z. (z−1)/(z+1) is purely imaginary on unit circle. Collinearity: (a−b)/(c−b)∈ℝ.",
   fullDef:"Olympiad techniques: (1) z∈ℝ iff z=z̄; purely imaginary iff z+z̄=0. (2) Re(zw̄)=|z||w|cosθ=dot product; Im(zw̄)=signed area. (3) |z−w|²=|z|²−2Re(zw̄)+|w|² (law of cosines). (4) On unit circle: z̄=1/z — substitute to eliminate conjugates. (5) For |z|=1, z≠±1: (z−1)/(z+1)=i tan(θ/2), purely imaginary. (6) Three points collinear iff (a−b)/(c−b)∈ℝ. (7) |a|=|b|=|c|=1, a+b+c=0: conjugate the equation → 1/a+1/b+1/c=0 → ab+bc+ca=0 → a²+b²+c²=0.",
   keyFacts:[{text:'Real number test',l:'z=\\bar{z}\\Leftrightarrow z\\in\\mathbb{R}'},{text:'Dot product',l:'\\text{Re}(z\\bar{w})=|z||w|\\cos\\theta'},{text:'Unit circle trick',l:'|z|=1\\Rightarrow\\bar{z}=1/z'},{text:'Collinearity',l:'a,b,c\\text{ collinear}\\Leftrightarrow(a-b)/(c-b)\\in\\mathbb{R}'},{text:'Classic identity',l:'|a|=|b|=|c|=1,\\;a+b+c=0\\Rightarrow a^2+b^2+c^2=0'}],
   genKey:'cn_tricks'},
  {id:'cn_olympiad',title:'Olympiad Challenge Problems',level:'Olympiad',color:'#F59E0B',icon:'★ℂ',
   shortDef:"Roots of unity filter, product identities, (1+ω)^n tricks, bounding |P(z)| on circles, and structural proofs using conjugates.",
   fullDef:"Key Olympiad strategies: (1) Roots of unity filter: Σω^{jk}=n if n|j else 0 — extracts every nth term of a sum. (2) Product identity: ∏(1−ωk)=n from zⁿ−1 factorization at z=1. (3) (1+ω)^n: use 1+ω=−ω² for cube root. (4) |a|=|b|=|c|=1, a+b+c=0 → take conjugates, use z̄=1/z → ab+bc+ca=0 → a²+b²+c²=0. (5) zⁿ=w: n equally spaced roots on circle of radius |w|^{1/n}. (6) Bounding |P(z)| using triangle inequality on each term.",
   keyFacts:[{text:'Roots of unity filter',l:'\\sum_{k=0}^{n-1}\\omega^{jk}=\\begin{cases}n&n|j\\\\0&\\text{else}\\end{cases}'},{text:'Product identity',l:'\\prod_{k=1}^{n-1}(1-\\omega^k)=n'},{text:'Classic proof',l:'|a|=|b|=|c|=1,\\;a+b+c=0\\Rightarrow a^2+b^2+c^2=0'},{text:'zⁿ=w solutions',l:'z_k=|w|^{1/n}e^{i(\\arg w+2k\\pi)/n}'},{text:'(1+ω)^n for ω³=1',l:'(1+\\omega)^n=(-\\omega^2)^n=(-1)^n\\omega^{2n}'}],
   genKey:'cn_olympiad'},
];

// ── Practice Generators ───────────────────────────────────────
const GENERATORS = {
  cn_intro:(n)=>{const pw=srI(n,8,60)*4+srI(n+1,1,3);const rem=pw%4;const ans=iPow(rem);const lr=2*srI(n+2,1,5)+1;const xv=(lr+1)/2;const d=srI(n+3,2,5);const li=srI(n+4,1,4)+d;return{question:`Simplify i^{${pw}}. Also, if (${lr}+xi)+(${srI(n+5,-3,0)}+${d}i)=${lr+srI(n+5,-3,0)}+${li}i, find x.`,questionLatex:`i^{${pw}}=?\\quad\\text{and find }x\\text{ in the equation}`,steps:[`Powers of i cycle every 4: i¹=i, i²=−1, i³=−i, i⁴=1`,`${pw} mod 4 = ${rem}  →  i^{${pw}} = ${ans}`,`For x: equate imaginary parts: x+${d}=${li}`,`x = ${li-d}`],answer:`i^{${pw}}=${ans}, x=${li-d}`,answerLatex:`i^{${pw}}=${ans},\\;x=${li-d}`,tip:`Reduce exponent mod 4. Also: iⁿ+iⁿ⁺²=0 always (factor iⁿ(1+i²)=0).`};},
  cn_algebra:(n)=>{const a=srI(n,1,7),b=srI(n+1,1,6),c=srI(n+2,1,6),d=srI(n+3,1,5);const t=n%3;if(t===0){const re=a*c-b*d,im=a*d+b*c;return{question:`Multiply: (${fmtC(a,b)})(${fmtC(c,d)}).`,questionLatex:`(${fmtC(a,b)})(${fmtC(c,d)})=?`,steps:[`FOIL: ac−bd=(${a})(${c})−(${b})(${d})=${re}`,`ad+bc=(${a})(${d})+(${b})(${c})=${im}`,`Answer: ${fmtC(re,im)}`],answer:fmtC(re,im),answerLatex:fmtC(re,im),tip:`Real=ac−bd, Imaginary=ad+bc.`};}if(t===1){const dn=c*c+d*d,rN=a*c+b*d,iN=b*c-a*d;const g=gcd(gcd(Math.abs(rN),Math.abs(iN)),dn);return{question:`Divide: (${fmtC(a,b)})÷(${fmtC(c,d)}).`,questionLatex:`\\dfrac{${fmtC(a,b)}}{${fmtC(c,d)}}`,steps:[`Multiply by conjugate (${fmtC(c,-d)})`,`Denom: ${c}²+${d}²=${dn}`,`Num: real=${rN}, imag=${iN}`,`Answer: ${rN/g}/${dn/g}+(${iN/g}/${dn/g})i`],answer:`${rN/g}/${dn/g}+(${iN/g}/${dn/g})i`,answerLatex:`\\dfrac{${rN/g}}{${dn/g}}+\\dfrac{${iN/g}}{${dn/g}}i`,tip:`Multiply by conjugate. Denominator = c²+d² (always real).`};}const pw=srI(n+4,2,5);const rN=Math.pow(2,pw);const iv=iPow(pw);let ans2;if(iv==='1')ans2=String(rN);else if(iv==='i')ans2=`${rN}i`;else if(iv==='-1')ans2=String(-rN);else ans2=`-${rN}i`;return{question:`Compute (1+i)^{${pw*2}}.`,questionLatex:`(1+i)^{${pw*2}}=?`,steps:[`(1+i)²=2i`,`(1+i)^{${pw*2}}=(2i)^{${pw}}=${rN}·${iv}=${ans2}`],answer:ans2,answerLatex:ans2,tip:`(1+i)²=2i is the key. Then (2i)^n=2^n·i^n.`};},
  cn_conjugate:(n)=>{const a=srI(n,1,8),b=srI(n+1,1,7);const m2=a*a+b*b;return{question:`For z=${fmtC(a,b)}: find z̄, |z|, and z·z̄.`,questionLatex:`z=${fmtC(a,b)}:\\;\\bar{z}=?,\\;|z|=?,\\;z\\bar{z}=?`,steps:[`Conjugate: z̄=${fmtC(a,-b)}`,`|z|=√(${a}²+${b}²)=√${m2}${Number.isInteger(Math.sqrt(m2))?`=${Math.sqrt(m2)}`:''}`,`z·z̄=a²+b²=${m2} (always real!)`],answer:`z̄=${fmtC(a,-b)}, |z|=${modSqStr(a,b)}, z·z̄=${m2}`,answerLatex:`\\bar{z}=${fmtC(a,-b)},\\;|z|=${modSqStr(a,b)},\\;z\\bar{z}=${m2}`,tip:`z·z̄=|z|² always. This is the key identity for complex division.`};},
  cn_argand:(n)=>{const a1=srI(n,-4,5),b1=srI(n+1,-4,5),a2=srI(n+2,-4,5),b2=srI(n+3,-4,5);const d2=(a1-a2)**2+(b1-b2)**2;const isD=Number.isInteger(Math.sqrt(d2));return{question:`z₁=${fmtC(a1,b1)}, z₂=${fmtC(a2,b2)}. Find |z₁|, |z₁−z₂|, and midpoint.`,questionLatex:`z_1=${fmtC(a1,b1)},\\;z_2=${fmtC(a2,b2)}`,steps:[`|z₁|=√(${a1}²+${b1}²)=√${a1*a1+b1*b1}`,`|z₁−z₂|=√((${a1-a2})²+(${b1-b2})²)=√${d2}${isD?`=${Math.sqrt(d2)}`:''}`,`Midpoint=(z₁+z₂)/2=${fmtC((a1+a2)/2,(b1+b2)/2)}`],answer:`|z₁|=√${a1*a1+b1*b1}, |z₁−z₂|=√${d2}, mid=${fmtC((a1+a2)/2,(b1+b2)/2)}`,answerLatex:`|z_1|=\\sqrt{${a1*a1+b1*b1}},\\;|z_1-z_2|=\\sqrt{${d2}}`,tip:`Argand plane is ℝ². |z₁−z₂| is Euclidean distance. Midpoint=(z₁+z₂)/2.`};},
  cn_polar:(n)=>{const angs=[{l:'\\pi/4',cN:0.707,sN:0.707,d:45},{l:'\\pi/3',cN:0.5,sN:0.866,d:60},{l:'\\pi/6',cN:0.866,sN:0.5,d:30},{l:'\\pi/2',cN:0,sN:1,d:90}];const r=srI(n,1,4),ang=angs[n%4];return{question:`Convert z=${r}(cos${ang.d}°+i sin${ang.d}°) to Euler form and a+bi.`,questionLatex:`z=${r}(\\cos${ang.l}+i\\sin${ang.l})`,steps:[`Euler form: z=${r}e^{i${ang.l}}`,`a=${r}·cos${ang.d}°≈${+(r*ang.cN).toFixed(3)}`,`b=${r}·sin${ang.d}°≈${+(r*ang.sN).toFixed(3)}`],answer:`z=${r}e^{i${ang.l}}≈${+(r*ang.cN).toFixed(3)}+${+(r*ang.sN).toFixed(3)}i`,answerLatex:`z=${r}e^{i${ang.l}}\\approx${+(r*ang.cN).toFixed(3)}+${+(r*ang.sN).toFixed(3)}i`,tip:`Euler form: just write re^{iθ}. For a+bi: multiply r by cos/sin values.`};},
  cn_demoivre:(n)=>{const pows=[2,3,4,5,6,8],pw=pows[n%6];const angs=[{l:'\\pi/4',d:45},{l:'\\pi/6',d:30},{l:'\\pi/3',d:60},{l:'\\pi/2',d:90}];const rv=srI(n+1,1,3),ang=angs[n%4];const rPow=Math.pow(rv,pw),nTheta=pw*ang.d;const co=Math.round(Math.cos(nTheta*Math.PI/180)*1000)/1000,si=Math.round(Math.sin(nTheta*Math.PI/180)*1000)/1000;return{question:`Compute (${rv}(cosθ+i sinθ))^${pw}, θ=${ang.l}.`,questionLatex:`(${rv}e^{i${ang.l}})^{${pw}}=?`,steps:[`r^n=${rv}^${pw}=${rPow}`,`nθ=${pw}×${ang.l}=${nTheta}°`,`=${rPow}(${co}+${si}i)`],answer:`${rPow}(cos${nTheta}°+i sin${nTheta}°)`,answerLatex:`${rPow}(\\cos${nTheta}°+i\\sin${nTheta}°)`,tip:`De Moivre: raise r to n, multiply angle by n. Key example: (1+i)^8=16.`};},
  cn_roots:(n)=>{const ns=[3,4,5,6,8],rn=ns[n%5];const k=srI(n+1,1,rn-1),bigK=k+rn*srI(n+2,1,3);return{question:`ω=e^{2πi/${rn}}. (a) ω^{${bigK}}=? (b) Σ_{k=0}^{${rn-1}} ω^k=?`,questionLatex:`\\omega=e^{2\\pi i/${rn}},\\;\\omega^{${bigK}}=?\\;\\;\\sum_{k=0}^{${rn-1}}\\omega^k=?`,steps:[`(a) ${bigK} mod ${rn}=${bigK%rn}. ω^${bigK}=ω^${bigK%rn}`,`(b) Sum of all ${rn}th roots=0 for n≥2`],answer:`ω^${bigK}=ω^${bigK%rn}, Sum=0`,answerLatex:`\\omega^{${bigK}}=\\omega^{${bigK%rn}},\\;\\sum=0`,tip:`Reduce exponent mod n. Sum of all nth roots=0 (geometric series or Vieta).`};},
  cn_quadratic:(n)=>{const cases=[{b:-2,c:2},{b:0,c:4},{b:2,c:5},{b:-4,c:8},{b:-6,c:13}];const{b,c}=cases[n%5];const disc=b*b-4*c;const iP=Math.sqrt(Math.abs(disc))/2;const iStr=Number.isInteger(iP)?`${iP}`:`\\tfrac{\\sqrt{${Math.abs(disc)}}}{2}`;return{question:`Solve z²${b<0?b:'+'+b}z+${c}=0. Find roots and |z|.`,questionLatex:`z^2${b<0?b:'+'+b}z+${c}=0`,steps:[`Δ=${b}²−4·${c}=${disc}<0 → complex roots`,`z=(${-b}±i√${Math.abs(disc)})/2=${-b/2}±${iStr}i`,`|z|²=product=c/a=${c}, |z|=√${c}`],answer:`z=${-b/2}±${iStr}i, |z|=√${c}`,answerLatex:`z=${-b/2}\\pm${iStr}i,\\;|z|=\\sqrt{${c}}`,tip:`Δ<0 → conjugate pair. Product of roots=c/a=|z|² (Vieta).`};},
  cn_loci:(n)=>{const t=n%3;if(t===0){const cx=srI(n,0,4),cy=srI(n+1,0,4),r=srI(n+2,1,4);return{question:`Cartesian equation of |z−(${fmtC(cx,cy)})|=${r}?`,questionLatex:`|z-(${fmtC(cx,cy)})|=${r}`,steps:[`|z−a|=r is a circle, centre (${cx},${cy}), radius ${r}`,`(x−${cx})²+(y−${cy})²=${r*r}`],answer:`Circle: (x−${cx})²+(y−${cy})²=${r*r}`,answerLatex:`(x-${cx})^2+(y-${cy})^2=${r*r}`,tip:`|z−a|=r is always a circle with centre a and radius r.`};}if(t===1){const p=srI(n+3,2,5);return{question:`Describe locus |z−${p}|=|z−${p}i|.`,questionLatex:`|z-${p}|=|z-${p}i|`,steps:[`Equidistant from ${p} and ${p}i → perp bisector`,`(x−${p})²+y²=x²+(y−${p})² → x=y`],answer:`Line y=x (perp. bisector of ${p} and ${p}i)`,answerLatex:`y=x`,tip:`|z−a|=|z−b| is always the perpendicular bisector of segment [a,b].`};}const k=srI(n+4,2,5);return{question:`Describe locus |z+iz̄|=${k}√2.`,questionLatex:`|z+i\\bar{z}|=${k}\\sqrt{2}`,steps:[`z+iz̄=(x+y)(1+i), modulus=|x+y|√2`,`|x+y|√2=${k}√2 → |x+y|=${k}`,`Two parallel lines: x+y=±${k}`],answer:`Lines x+y=±${k}`,answerLatex:`x+y=\\pm${k}`,tip:`Substitute z=x+iy, z̄=x−iy. Factor out the common (x+y) term.`};},
  cn_triangle_ineq:(n)=>{const m1=srI(n,2,6),m2=srI(n+1,m1+1,m1+5);const r=srI(n+2,1,4),a=srI(n+3,1,4),b=srI(n+4,1,3);return{question:`(a) Bound |z₁+z₂|, |z₁|=${m1}, |z₂|=${m2}. (b) Max of |z²+${a}z+${b}| on |z|=${r}.`,questionLatex:`|z_1|=${m1},|z_2|=${m2};\\;\\max|z^2+${a}z+${b}|\\text{ on }|z|=${r}`,steps:[`(a) ${Math.abs(m1-m2)} ≤ |z₁+z₂| ≤ ${m1+m2}`,`(b) ≤|z|²+${a}|z|+${b}=${r}²+${a}·${r}+${b}=${r*r+a*r+b}`],answer:`[${Math.abs(m1-m2)}, ${m1+m2}]; max≤${r*r+a*r+b}`,answerLatex:`|z_1+z_2|\\in[${Math.abs(m1-m2)},${m1+m2}];\\;\\max\\leq${r*r+a*r+b}`,tip:`Triangle ineq → upper bound. Reverse TI → lower. Apply termwise for polynomials.`};},
  cn_transforms:(n)=>{const a=srI(n,1,5),b=srI(n+1,1,4);const pr=srI(n+2,0,3),pi_=srI(n+3,0,3);const rots=[{m:'i',d:90,l:'\\pi/2'},{m:'-1',d:180,l:'\\pi'},{m:'-i',d:270,l:'3\\pi/2'}];const rot=rots[n%3];let re,im;if(rot.m==='i'){re=-b;im=a;}else if(rot.m==='-1'){re=-a;im=-b;}else{re=b;im=-a;}const fx=(pr-pi_)/2,fy=(pr+pi_)/2;return{question:`(a) Rotate z=${fmtC(a,b)} by ${rot.d}°. (b) Fixed pt of z↦iz+(${fmtC(pr,pi_)}).`,questionLatex:`\\text{Rot }${fmtC(a,b)}\\text{ by }${rot.l};\\;\\text{fixed pt of }z\\mapsto iz+${fmtC(pr,pi_)}`,steps:[`(a) Multiply by e^{i${rot.l}}=${rot.m}: ${rot.m}·(${fmtC(a,b)})=${fmtC(re,im)}`,`(b) z=iz+(${fmtC(pr,pi_)}) → z(1−i)=${fmtC(pr,pi_)} → z=${fmtC(fx,fy)}`],answer:`Image=${fmtC(re,im)}; Fixed pt=${fmtC(fx,fy)}`,answerLatex:`\\text{Image}=${fmtC(re,im)};\\;z_0=${fmtC(fx,fy)}`,tip:`Rotation by α: multiply by e^{iα}. Fixed pt of z↦wz+b: z=b/(1−w).`};},
  cn_poly:(n)=>{const ns=[3,4,5,6],rn=ns[n%4];const k=srI(n+1,1,rn-1),bigPow=k+rn*srI(n+2,1,4);return{question:`ω=e^{2πi/${rn}}. (a) ω^{${bigPow}}=? (b) ∏_{k=1}^{${rn-1}}(1−ωᵏ)=?`,questionLatex:`\\omega^{${bigPow}}=?\\quad\\prod_{k=1}^{${rn-1}}(1-\\omega^k)=?`,steps:[`(a) ${bigPow} mod ${rn}=${bigPow%rn}. Answer: ω^${bigPow%rn}`,`(b) From z^${rn}−1=(z−1)·∏(z−ωk), set z=1: product=${rn}`],answer:`ω^${bigPow}=ω^${bigPow%rn}; product=${rn}`,answerLatex:`\\omega^{${bigPow}}=\\omega^{${bigPow%rn}};\\;\\prod(1-\\omega^k)=${rn}`,tip:`Reduce exponent mod n. Product identity: ∏(1−ωk)=n (set z=1 in factorization).`};},
  cn_vieta:(n)=>{const S=srI(n,2,8),P=srI(n+1,1,9);const ss=S*S-2*P;return{question:`Roots of z²−${S}z+${P}=0. Find z₁²+z₂², 1/z₁+1/z₂, (z₁−z₂)².`,questionLatex:`z^2-${S}z+${P}=0`,steps:[`Vieta: z₁+z₂=${S}, z₁z₂=${P}`,`z₁²+z₂²=${S}²−2·${P}=${ss}`,`1/z₁+1/z₂=${S}/${P}`,`(z₁−z₂)²=${S}²−4·${P}=${S*S-4*P}`],answer:`∑z²=${ss}, ∑1/z=${S}/${P}, (z₁−z₂)²=${S*S-4*P}`,answerLatex:`\\sum z_i^2=${ss},\\;\\sum\\tfrac{1}{z_i}=\\tfrac{${S}}{${P}},\\;(z_1-z_2)^2=${S*S-4*P}`,tip:`Vieta: never solve! Read sum and product. z₁²+z₂²=(sum)²−2(product).`};},
  cn_tricks:(n)=>{const a=srI(n,1,5),b=srI(n+1,1,4),c=srI(n+2,1,5),d=srI(n+3,1,4);const dot=a*c+b*d;return{question:`(a) Re(zw̄) for z=${fmtC(a,b)}, w=${fmtC(c,d)}. (b) Is (z−1)/(z+1) real or imaginary for |z|=1?`,questionLatex:`\\text{Re}(z\\bar{w}),\\;z=${fmtC(a,b)},\\;w=${fmtC(c,d)}`,steps:[`w̄=${fmtC(c,-d)}`,`Re(zw̄)=${a}·${c}+${b}·${d}=${dot} (dot product!)`,`(b) Write z=e^{iθ}: ratio=i tan(θ/2) → purely imaginary`],answer:`Re(zw̄)=${dot}; (z−1)/(z+1) is purely imaginary`,answerLatex:`\\text{Re}(z\\bar{w})=${dot};\\;\\text{purely imaginary}`,tip:`Re(zw̄)=dot product. On unit circle: z̄=1/z. (z−1)/(z+1)=i tan(θ/2).`};},
  cn_olympiad:(n)=>{const ns=[3,4,5,6],rn=ns[n%4];const t=n%3;if(t===0)return{question:`If ω=e^{2πi/${rn}}, find Σ_{k=0}^{${rn-1}} ω^k and ∏_{k=1}^{${rn-1}}(1−ωk).`,questionLatex:`\\sum_{k=0}^{${rn-1}}\\omega^k=?\\quad\\prod_{k=1}^{${rn-1}}(1-\\omega^k)=?`,steps:[`Sum of all ${rn}th roots=0 (n≥2)`,`Product: from z^${rn}−1 factorization → set z=1 → ${rn}`],answer:`Sum=0, Product=${rn}`,answerLatex:`\\sum=0,\\;\\prod=${rn}`,tip:`Sum of nth roots=0. Product identity ∏(1−ωk)=n from factorization at z=1.`};if(t===1)return{question:`Prove: |a|=|b|=|c|=1, a+b+c=0 ⟹ a²+b²+c²=0.`,questionLatex:`|a|=|b|=|c|=1,\\;a+b+c=0\\Rightarrow a^2+b^2+c^2=0`,steps:[`(a+b+c)²=0 → a²+b²+c²+2(ab+bc+ca)=0`,`|a|=1 → ā=1/a. Conjugate: ā+b̄+c̄=0 → 1/a+1/b+1/c=0`,`→ ab+bc+ca=0 → a²+b²+c²=0 ✓`],answer:`a²+b²+c²=0`,answerLatex:`a^2+b^2+c^2=0\\;\\checkmark`,tip:`Take conjugates, use ā=1/a on unit circle, derive ab+bc+ca=0.`};return{question:`Find all solutions to z⁴=−16. How many are purely imaginary?`,questionLatex:`z^4=-16`,steps:[`−16=16e^{iπ}. z=2·e^{i(π+2kπ)/4}=2e^{i(2k+1)π/4}`,`k=0: √2+√2i, k=1: −√2+√2i, k=2: −√2−√2i, k=3: √2−√2i`,`None purely imaginary (all have Re=±√2)`],answer:`z=√2(±1±i); 0 purely imaginary`,answerLatex:`z=\\sqrt{2}(\\pm1\\pm i);\\;0\\text{ purely imaginary}`,tip:`z^n=w: write w in polar, apply De Moivre for n roots. Check which have Re=0.`};},
};

// ── Quiz Generators (procedural MCQ, same format as BinomialTheorem) ──────
function shuffle(arr,seed){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(sr(seed*i+i)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

const QUIZ_GENERATORS = {
  cn_intro:(n)=>{
    const T=[
      (s)=>{const pw=srI(s,5,18)*4+srI(s+1,1,3);const rem=pw%4;const ans=iPow(rem);return{q:`Simplify i^{${pw}}.`,opts:shuffle([ans,...['1','i','-1','-i'].filter(v=>v!==ans).slice(0,3)],s),correct:ans,tip:`${pw} mod 4=${rem}. Cycle: 0→1, 1→i, 2→−1, 3→−i.`};},
      (s)=>{const n1=srI(s+2,1,20);return{q:`What is i^{${n1}}+i^{${n1+2}}?`,opts:shuffle(['0','1','-1','i'],s+1),correct:'0',tip:`iⁿ+iⁿ⁺²=iⁿ(1+i²)=iⁿ·0=0 ALWAYS for any n.`};},
      (s)=>{const a=srI(s+3,2,7)*2+1;const xv=(a+1)/2;const d=srI(s+4,2,5);const li=d+srI(s+5,1,4);const yv=li-d;const ans=xv+yv;return{q:`(${a}+xi)+(${-srI(s+6,1,3)}+${d}i)=${a-srI(s+6,1,3)}+${li}i. Find x+y where y+${d}=${li}.`,opts:shuffle([ans,xv,yv,ans+1].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+7),correct:ans,tip:`Equate imaginary: x+0=${li-d}. Equate real. x+y=${ans}.`};},
      (s)=>{const pw=srI(s+8,2,15)*4;return{q:`What is i^{${pw}}?`,opts:shuffle(['1','i','-1','-i'],s+9),correct:'1',tip:`Any multiple of 4: i^{4k}=1. Here ${pw}=4·${pw/4}.`};},
    ];
    const t=T[n%T.length](n*67+13);return t;
  },
  cn_algebra:(n)=>{
    const T=[
      (s)=>{const a=srI(s,1,5),b=srI(s+1,1,4);const re=a*a-b*b,im=2*a*b;const ans=`${re}+${im}i`;return{q:`Expand (${a}+${b}i)².`,opts:shuffle([ans,`${a*a+b*b}+${im}i`,`${re}+${im/2}i`,`${-re}+${im}i`],s+2),correct:ans,tip:`(a+bi)²=a²−b²+2abi. Here ${a}²−${b}²=${re}, 2·${a}·${b}=${im}.`};},
      (s)=>{const pw=srI(s+3,2,5);const rN=Math.pow(2,pw);const iv=iPow(pw);let ans;if(iv==='1')ans=String(rN);else if(iv==='i')ans=`${rN}i`;else if(iv==='-1')ans=String(-rN);else ans=`-${rN}i`;return{q:`(1+i)^{${pw*2}}=?`,opts:shuffle([ans,String(rN),`${rN}i`,String(-rN)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+4),correct:ans,tip:`(1+i)²=2i. (1+i)^{${pw*2}}=(2i)^{${pw}}=${rN}·${iv}=${ans}.`};},
      (s)=>{const a=srI(s+5,1,5),b=srI(s+6,1,4),c=srI(s+7,1,4),d=srI(s+8,1,3);const dn=c*c+d*d;const rN=a*c+b*d;const g=gcd(rN,dn);const ans=g===dn?String(rN/g):`${rN/g}/${dn/g}`;return{q:`Re((${a}+${b}i)/(${c}+${d}i))=?`,opts:shuffle([ans,`${(a*c-b*d)/gcd(Math.abs(a*c-b*d),dn)}/${dn/g}`,String(rN),`${a*d-b*c}/${dn}`],s+9),correct:ans,tip:`Multiply by conjugate. Re of numerator=${a}·${c}+${b}·${d}=${rN}. Denom=${dn}.`};},
      (s)=>{const a=srI(s+10,1,5);const dn=a*a+1,num=2*(a*a-1);const g=gcd(Math.abs(num),dn);const ans=g===dn?String(num/g):`${num/g}/${dn/g}`;return{q:`z=(${a}+i)/(${a}−i). Find z+1/z.`,opts:shuffle([ans,'0','2i',`${a}/${dn}`],s+11),correct:ans,tip:`|${a}+i|=|${a}−i|→|z|=1→1/z=z̄. z+z̄=2Re(z)=2·(${a}²−1)/(${a}²+1)=${ans}.`};},
    ];
    const t=T[n%T.length](n*71+17);return t;
  },
  cn_conjugate:(n)=>{
    const T=[
      (s)=>{const a=srI(s,1,7),b=srI(s+1,1,6);const ans=a*a+b*b;return{q:`z=${fmtC(a,b)}. Compute z·z̄.`,opts:shuffle([ans,a*a-b*b,2*a*b,(a+b)*(a+b)],s+2),correct:ans,tip:`z·z̄=|z|²=a²+b²=${a}²+${b}²=${ans}. Always real!`};},
      (s)=>{return{q:`z+z̄=0 and z≠0. Then z is:`,opts:shuffle(['Purely imaginary','Real','On unit circle','Zero'],s),correct:'Purely imaginary',tip:`z+z̄=2Re(z)=0 → Re(z)=0 → z is purely imaginary.`};},
      (s)=>{const a=srI(s+1,1,6);return{q:`z=(${a}+i)/(${a}−i). |z|=?`,opts:shuffle(['1',String(a),`√${a*a+1}`,`${a}/${a+1}`],s+2),correct:'1',tip:`|z|=|${a}+i|/|${a}−i|=√(${a}²+1)/√(${a}²+1)=1. Unit circle!`};},
      (s)=>{const a=srI(s+3,1,6),b=srI(s+4,1,5);return{q:`z=${fmtC(a,b)}. |z̄/|z||=?`,opts:shuffle(['1',String(Math.round(Math.sqrt(a*a+b*b))),'2','1/2'],s+5),correct:'1',tip:`|z̄|=|z|, so |z̄|/|z|=1 always. Modulus of conjugate equals modulus.`};},
    ];
    const t=T[n%T.length](n*73+19);return t;
  },
  cn_argand:(n)=>{
    const T=[
      (s)=>{const a=srI(s,0,4),b=srI(s+1,0,4),c=srI(s+2,0,4),d=srI(s+3,0,4);const d2=(a-c)**2+(b-d)**2;const isP=Number.isInteger(Math.sqrt(d2));const ans=isP?String(Math.sqrt(d2)):`√${d2}`;return{q:`|z₁−z₂|, z₁=${fmtC(a,b)}, z₂=${fmtC(c,d)}?`,opts:shuffle([ans,`√${d2+4}`,`√${(a-c)**2}`,`√${(b-d)**2}`].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+4),correct:ans,tip:`|z₁−z₂|=√((${a-c})²+(${b-d})²)=√${d2}.`};},
      (s)=>{const p=srI(s+4,2,5);return{q:`Locus |z−${p}|=|z−${p}i| is?`,opts:shuffle(['y=x','y=−x',`x+y=${p}`,`x=${p}`],s+5),correct:'y=x',tip:`Equidistant from ${p}+0i and 0+${p}i → perp bisector → x=y.`};},
      (s)=>{const pyts=[[3,4,5],[5,12,13],[8,15,17]];const[px,py,pd]=pyts[s%3];const rv=srI(s+1,1,pd-1);const ans=String(pd-rv);return{q:`Min |z−(${px}+${py}i)| for |z|=${rv}?`,opts:shuffle([pd-rv,pd+rv,rv,pd],s+6),correct:ans,tip:`Dist from origin to ${px}+${py}i=${pd}. Min on |z|=${rv}: ${pd}−${rv}=${ans}.`};},
      (s)=>{return{q:`i·(a+bi) is geometrically which transformation?`,opts:shuffle(['90° CCW rotation','90° CW rotation','Reflection across real axis','180° rotation'],s),correct:'90° CCW rotation',tip:`i(a+bi)=−b+ai: (a,b)↦(−b,a). This is 90° anticlockwise.`};},
    ];
    const t=T[n%T.length](n*79+23);return t;
  },
  cn_polar:(n)=>{
    const T=[
      (s)=>{const angs=[{l:'\\pi/2',v:'i'},{l:'\\pi',v:'-1'},{l:'3\\pi/2',v:'-i'},{l:'2\\pi',v:'1'}];const ang=angs[s%4];return{q:`e^{i${ang.l}}=?`,opts:shuffle([ang.v,'1','i','-1','-i'].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s),correct:ang.v,tip:`Euler: e^{iθ}=cosθ+i sinθ. For θ=${ang.l}: result=${ang.v}.`};},
      (s)=>{const a=srI(s+1,1,4),b=srI(s+2,1,4);const n1=a+b,d1=a*b,g1=gcd(n1,d1);const ans=`${n1/g1}π/${d1/g1}`;return{q:`arg(e^{iπ/${a}}·e^{iπ/${b}})=?`,opts:shuffle([ans,`π/${a+1}`,`π/${b}`,`2π/${a+b}`],s+3),correct:ans,tip:`arg(z₁z₂)=arg(z₁)+arg(z₂)=π/${a}+π/${b}=${ans}.`};},
      (s)=>{const pyts=[[3,4,5],[5,12,13],[8,15,17]];const[a,b,c]=pyts[s%3];return{q:`|${a}+${b}i|=?`,opts:shuffle([c,a+b,Math.round(Math.sqrt(a+b)),c+1],s+4),correct:c,tip:`|${a}+${b}i|=√(${a}²+${b}²)=√${a*a+b*b}=${c}.`};},
      (s)=>{const r=srI(s+5,1,3),pw=srI(s+6,2,5);const angs=[{l:'\\pi/4',v:45},{l:'\\pi/2',v:90},{l:'\\pi',v:180}];const ang=angs[s%3];const rn=Math.pow(r,pw);const nth=pw*ang.v;const re=Math.round(rn*Math.cos(nth*Math.PI/180));const ans=String(re);return{q:`Re(z^${pw}), z=${r}e^{i${ang.l}}?`,opts:shuffle([re,Math.round(rn*Math.sin(nth*Math.PI/180)),rn,-re].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+7),correct:ans,tip:`z^${pw}=${r}^${pw}e^{i·${pw}·${ang.l}}=${rn}e^{i${nth}°}. Re=${re}.`};},
    ];
    const t=T[n%T.length](n*83+29);return t;
  },
  cn_demoivre:(n)=>{
    const T=[
      (s)=>{const n=srI(s+1,2,4);const ans=`cos(${n}θ)−i sin(${n}θ)`;return{q:`(cosθ+i sinθ)^{−${n}}=?`,opts:shuffle([`cos(${n}θ)−i sin(${n}θ)`,`cos(${n}θ)+i sin(${n}θ)`,`−cos(${n}θ)+i sin(${n}θ)`,`−cos(${n}θ)−i sin(${n}θ)`],s+2),correct:ans,tip:`De Moivre with n=−${n}: cos(−${n}θ)+i sin(−${n}θ)=cos(${n}θ)−i sin(${n}θ).`};},
      (s)=>{return{q:`cos3θ via De Moivre equals?`,opts:shuffle(['4cos³θ−3cosθ','3cos³θ−4cosθ','4cosθ−3cos³θ','cos³θ−3cosθ'],s+3),correct:'4cos³θ−3cosθ',tip:`Expand (cosθ+i sinθ)³, take real part.`};},
      (s)=>{const pw=srI(s+4,4,8);const rN=Math.pow(Math.SQRT2,pw);const angle=pw*Math.PI/4;const re=Math.round(rN*Math.cos(angle));const im=Math.round(rN*Math.sin(angle));const ans=im===0?String(re):re===0?`${im}i`:`${re}+${im}i`;return{q:`(1+i)^{${pw}}=?`,opts:shuffle([ans,String(re+4),`${im+2}i`,String(rN)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+5),correct:ans,tip:`|1+i|=√2, arg=π/4. (1+i)^${pw}=(√2)^${pw}·e^{i·${pw}π/4}=${rN}·(${Math.round(Math.cos(angle))}+${Math.round(Math.sin(angle))}i)=${ans}.`};},
      (s)=>{return{q:`De Moivre holds for which values of n?`,opts:shuffle(['All n∈ℤ','Only n>0','Only n≥0','Only positive integers'],s+6),correct:'All n∈ℤ',tip:`De Moivre holds for all integers n (positive, zero, and negative).`};},
    ];
    const t=T[n%T.length](n*89+31);return t;
  },
  cn_roots:(n)=>{
    const T=[
      (s)=>{const ns=[3,4,5,6];const rn=ns[s%4];return{q:`Σ_{k=0}^{${rn-1}} ω^k for ω=e^{2πi/${rn}}?`,opts:shuffle([0,rn,1,-1],s+1),correct:'0',tip:`Sum of all ${rn}th roots of unity=0 for n≥2.`};},
      (s)=>{const ns=[3,4,5,6];const rn=ns[s%4];const prod=Math.pow(-1,rn+1);return{q:`Product of all ${rn}th roots of unity?`,opts:shuffle([prod,-prod,rn,0],s+2),correct:String(prod),tip:`Product=(−1)^{n+1}=(−1)^{${rn+1}}=${prod}.`};},
      (s)=>{return{q:`For cube root ω (ω³=1,ω≠1): 1+ω+ω²=?`,opts:shuffle([0,1,-1,3],s+3),correct:'0',tip:`Sum of all 3rd roots of unity=0. Most important cube root identity.`};},
      (s)=>{const rn=srI(s+4,2,4);const k=srI(s+5,1,rn-1);const bigK=k+rn*srI(s+6,1,4);const rem=bigK%rn;const ans=rem===0?'1':rem===1?'ω':`ω^${rem}`;return{q:`ω=e^{2πi/${rn}}, ω^{${bigK}}=?`,opts:shuffle([ans,'1','ω',`ω^${(rem+1)%rn}`].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+7),correct:ans,tip:`${bigK} mod ${rn}=${rem}. ω^${bigK}=ω^${rem}=${ans}.`};},
    ];
    const t=T[n%T.length](n*97+37);return t;
  },
  cn_quadratic:(n)=>{
    const T=[
      (s)=>{const a=srI(s,1,5),b=srI(s+1,1,5);const ans=`${a}−${b}i`;return{q:`If ${a}+${b}i is a root (real coefficients), the other root is?`,opts:shuffle([`${a}−${b}i`,`−${a}+${b}i`,`−${a}−${b}i`,`${b}+${a}i`],s+2),correct:ans,tip:`Conjugate Root Theorem: complex roots of real polynomials come in conjugate pairs.`};},
      (s)=>{const p=srI(s+3,-4,4),q=srI(s+4,2,10);return{q:`Roots of z²${p<0?p:'+'+p}z+${q}=0 are complex. |z|²=?`,opts:shuffle([q,q+1,q-1,Math.abs(p)],s+5),correct:String(q),tip:`Product of conjugate roots=|z|²=c/a=${q} (Vieta's).`};},
      (s)=>{const a=srI(s+6,1,5),b=srI(s+7,1,5);const S=2*a,P=a*a+b*b;const ans=`z²−${S}z+${P}=0`;return{q:`Monic quadratic with roots ${a}±${b}i?`,opts:shuffle([`z²−${S}z+${P}=0`,`z²+${S}z+${P}=0`,`z²−${S}z−${P}=0`,`z²−${a}z+${b}=0`],s+8),correct:ans,tip:`Sum=${S}→−b/a=−(−${S}). Product=${P}→c/a.`};},
      (s)=>{const p=srI(s+9,-5,5)||1,q=srI(s+10,1,8);const ans=String(-p);return{q:`Sum of roots of z²${p<0?p:'+'+p}z+${q}=0?`,opts:shuffle([-p,p,q,-q],s+11),correct:ans,tip:`Vieta: sum=−b/a=−(${p})=${-p}.`};},
    ];
    const t=T[n%T.length](n*101+41);return t;
  },
  cn_loci:(n)=>{
    const T=[
      (s)=>{const cx=srI(s,0,4),cy=srI(s+1,0,4),r=srI(s+2,1,4);const ans=`(x−${cx})²+(y−${cy})²=${r*r}`;return{q:`Cartesian equation of |z−(${fmtC(cx,cy)})|=${r}?`,opts:shuffle([`(x−${cx})²+(y−${cy})²=${r*r}`,`x²+y²=${r*r}`,`(x−${cx})²+(y−${cy})²=${r}`,`(x+${cx})²+(y+${cy})²=${r*r}`],s+3),correct:ans,tip:`|z−a|=r: circle centre (${cx},${cy}), radius ${r}.`};},
      (s)=>{return{q:`|z−1|+|z+1|=4 is which curve?`,opts:shuffle(['An ellipse','A circle','A parabola','A hyperbola'],s),correct:'An ellipse',tip:`Sum of distances from foci ±1 = 4 = constant → ellipse.`};},
      (s)=>{const k=srI(s+1,2,5);const ans=`x+y=±${k}`;return{q:`Locus |z+iz̄|=${k}√2?`,opts:shuffle([`x+y=±${k}`,`x²+y²=${k*k}`,`x+y=${k}`,`x−y=±${k}`],s+2),correct:ans,tip:`z+iz̄=(x+y)(1+i), |…|=|x+y|√2=${k}√2 → x+y=±${k}.`};},
      (s)=>{return{q:`Region |z−i|≤|z+i| represents?`,opts:shuffle(['Im(z)≥0','Im(z)≤0','Re(z)≥0','|z|≤1'],s+3),correct:'Im(z)≥0',tip:`Expand: y≥0. Points closer to i than to −i → upper half-plane.`};},
    ];
    const t=T[n%T.length](n*103+43);return t;
  },
  cn_triangle_ineq:(n)=>{
    const T=[
      (s)=>{const r=srI(s,1,4),a=srI(s+1,1,4),b=srI(s+2,1,3);const ans=r*r+a*r+b;return{q:`Max |z²+${a}z+${b}| on |z|=${r}?`,opts:shuffle([ans,r*r-a*r+b,ans+1,r+a+b],s+3),correct:ans,tip:`Triangle ineq: ≤|z|²+${a}|z|+${b}=${r}²+${a}·${r}+${b}=${ans}.`};},
      (s)=>{const m1=srI(s+4,1,5),m2=srI(s+5,m1+1,m1+5);const ans=`[${m2-m1},${m1+m2}]`;return{q:`Range of |z₁−z₂| for |z₁|=${m1}, |z₂|=${m2}?`,opts:shuffle([`[${m2-m1},${m1+m2}]`,`[0,${m1+m2}]`,`[${m1},${m2}]`,`[${m2-m1},${m1*m2}]`],s+6),correct:ans,tip:`Lower: ||z₁|−|z₂||=${m2-m1}. Upper: |z₁|+|z₂|=${m1+m2}.`};},
      (s)=>{return{q:`|z₁+z₂|=|z₁|+|z₂| holds iff?`,opts:shuffle(['z₁=λz₂, λ≥0','|z₁|=|z₂|','z₁+z₂ real','arg(z₁)=arg(z₂)+π'],s+7),correct:'z₁=λz₂, λ≥0',tip:`Equality iff z₁ and z₂ point in the same direction.`};},
      (s)=>{const r=srI(s+8,3,7),a=srI(s+9,1,r-1);const ans=`1/${r-a}`;return{q:`Best upper bound on |1/(z−${a})| for |z|=${r}?`,opts:shuffle([`1/${r-a}`,`1/${r}`,`1/${r+a}`,`1/${a}`],s+10),correct:ans,tip:`Reverse TI: |z−${a}|≥${r}−${a}=${r-a}. So |1/(z−${a})|≤1/${r-a}.`};},
    ];
    const t=T[n%T.length](n*107+47);return t;
  },
  cn_transforms:(n)=>{
    const T=[
      (s)=>{const a=srI(s,1,5),b=srI(s+1,1,4);const ans=`${-b}+${a}i`;return{q:`Rotate z=${fmtC(a,b)} by 90° CCW about origin?`,opts:shuffle([`${-b}+${a}i`,`${b}−${a}i`,`${-a}−${b}i`,`${a}+${b}i`],s+2),correct:ans,tip:`Multiply by i: i(${a}+${b}i)=−${b}+${a}i. Point (${a},${b})→(${-b},${a}).`};},
      (s)=>{return{q:`z↦e^{iπ}z is geometrically?`,opts:shuffle(['180° rotation','90° CCW rotation','Reflection across real axis','Scaling by π'],s+3),correct:'180° rotation',tip:`e^{iπ}=−1. Multiplying by −1: (a,b)→(−a,−b) = 180° rotation.`};},
      (s)=>{const cr=srI(s+4,0,4),ci=srI(s+5,0,4);const re=(cr-ci)/2,im=(cr+ci)/2;const ans=`${re}+${im}i`;return{q:`Fixed point of z↦iz+(${fmtC(cr,ci)})?`,opts:shuffle([`${re}+${im}i`,`${cr}+${ci}i`,`${-ci}+${cr}i`,`${ci}+${cr}i`],s+6),correct:ans,tip:`z=iz+(${fmtC(cr,ci)}) → z(1−i)=${fmtC(cr,ci)} → z=(${cr-ci}+${cr+ci}i)/2.`};},
      (s)=>{const a=srI(s+7,1,5),b=srI(s+8,1,4);const ans=`${a}−${b}i`;return{q:`Reflection of z=${fmtC(a,b)} across the real axis?`,opts:shuffle([`${a}−${b}i`,`−${a}+${b}i`,`−${a}−${b}i`,`${b}+${a}i`],s+9),correct:ans,tip:`Reflection across real axis: z↦z̄. Conjugate of ${fmtC(a,b)}=${a}−${b}i.`};},
    ];
    const t=T[n%T.length](n*109+53);return t;
  },
  cn_poly:(n)=>{
    const T=[
      (s)=>{const ns=[3,4,5,6];const rn=ns[s%4];const k=srI(s+1,1,rn-1);const big=k+rn*srI(s+2,1,3);const rem=big%rn;const ans=rem===0?'1':rem===1?'ω':`ω^${rem}`;return{q:`ω=e^{2πi/${rn}}, ω^{${big}}=?`,opts:shuffle([ans,'1','ω',`ω^${(rem+1)%rn}`].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+3),correct:ans,tip:`${big} mod ${rn}=${rem}. ω^${big}=ω^${rem}=${ans}.`};},
      (s)=>{const ns=[3,4,5,6];const rn=ns[s%4];return{q:`∏_{k=1}^{${rn-1}}(1−ωk)=? for ω=e^{2πi/${rn}}?`,opts:shuffle([rn,rn-1,rn+1,0],s+4),correct:String(rn),tip:`From z^${rn}−1=(z−1)∏(z−ωk), set z=1. Product=${rn}.`};},
      (s)=>{const a=srI(s+5,1,4),b=srI(s+6,1,4);const S=2*a,P=a*a+b*b;const ans=`z²−${S}z+${P}`;return{q:`Real quadratic factor from conjugate pair ${a}±${b}i?`,opts:shuffle([`z²−${S}z+${P}`,`z²+${S}z+${P}`,`z²−${S}z−${P}`,`z²+${P}`],s+7),correct:ans,tip:`(z−α)(z−ᾱ)=z²−2Re(α)z+|α|²=z²−${S}z+${P}.`};},
      (s)=>{return{q:`How many roots does z⁴+4=0 have in ℂ?`,opts:shuffle(['4','2','1','0'],s+8),correct:'4',tip:`FTA: degree-n polynomial has exactly n roots in ℂ. Here n=4.`};},
    ];
    const t=T[n%T.length](n*113+59);return t;
  },
  cn_vieta:(n)=>{
    const T=[
      (s)=>{const S=srI(s,2,7),P=srI(s+1,1,6);const ans=S*S-2*P;return{q:`Roots of z²−${S}z+${P}=0. z₁²+z₂²=?`,opts:shuffle([S*S-2*P,S*S+2*P,S*S-P,P*P],s+2),correct:ans,tip:`z₁²+z₂²=(${S})²−2·${P}=${ans}.`};},
      (s)=>{const S=srI(s+3,2,7),P=srI(s+4,1,8);const ans=S*S-4*P;return{q:`z₁+z₂=${S}, z₁z₂=${P}. (z₁−z₂)²=?`,opts:shuffle([S*S-4*P,S*S+4*P,S*S-2*P,(S-P)*(S-P)],s+5),correct:ans,tip:`(z₁−z₂)²=(z₁+z₂)²−4z₁z₂=${S}²−4·${P}=${ans}.`};},
      (s)=>{const S=srI(s+6,2,6);const kInt=srI(s+7,1,5);const tgt=S*S-2*kInt;const ans=String(kInt);return{q:`z₁²+z₂²=${tgt} for roots of z²−${S}z+k=0. k=?`,opts:shuffle([kInt,kInt+1,kInt-1,2*kInt],s+8),correct:ans,tip:`${S}²−2k=${tgt} → 2k=${S*S-tgt} → k=${kInt}.`};},
      (s)=>{const S=srI(s+9,2,7),P=srI(s+10,1,6);const ans=`${S}/${P}`;return{q:`Roots of z²−${S}z+${P}=0. 1/z₁+1/z₂=?`,opts:shuffle([`${S}/${P}`,`${P}/${S}`,`${S+1}/${P}`,`${S}/${P+1}`],s+11),correct:ans,tip:`1/z₁+1/z₂=(z₁+z₂)/(z₁z₂)=${S}/${P}.`};},
    ];
    const t=T[n%T.length](n*127+61);return t;
  },
  cn_tricks:(n)=>{
    const T=[
      (s)=>{return{q:`For |z|=1, z≠±1: (z−1)/(z+1) is always?`,opts:shuffle(['Purely imaginary','Real','Has modulus 1','Zero'],s),correct:'Purely imaginary',tip:`Write z=e^{iθ}: ratio=i tan(θ/2) — purely imaginary.`};},
      (s)=>{const a=srI(s+1,1,5),b=srI(s+2,1,4),c=srI(s+3,1,5),d=srI(s+4,1,4);const ans=a*c+b*d;return{q:`Re(zw̄) for z=${fmtC(a,b)}, w=${fmtC(c,d)}?`,opts:shuffle([a*c+b*d,a*c-b*d,a*d+b*c,a*c],s+5),correct:ans,tip:`Re(zw̄)=${a}·${c}+${b}·${d}=${ans}. This equals the dot product!`};},
      (s)=>{return{q:`|a|=|b|=|c|=1, a+b+c=0. Then a²+b²+c²=?`,opts:shuffle([0,3,-3,1],s+6),correct:'0',tip:`(a+b+c)²=0 + conjugate trick → ab+bc+ca=0 → a²+b²+c²=0.`};},
      (s)=>{return{q:`a, b, c collinear iff (a−b)/(c−b) is?`,opts:shuffle(['Real','Purely imaginary','Has modulus 1','Zero'],s+7),correct:'Real',tip:`Collinear iff (a−b) is a real scalar multiple of (c−b). Ratio is real.`};},
    ];
    const t=T[n%T.length](n*131+67);return t;
  },
  cn_olympiad:(n)=>{
    const T=[
      (s)=>{const ns=[3,4,5,6];const rn=ns[s%4];return{q:`ω=e^{2πi/${rn}}: Σ_{k=0}^{${rn-1}} ω^k=?`,opts:shuffle([0,rn,1,-1],s+1),correct:'0',tip:`Sum of all ${rn}th roots of unity=0 for n≥2.`};},
      (s)=>{const n_=srI(s+2,2,6);const sign=Math.pow(-1,n_);const exp=(2*n_)%3;const ivals=['1','ω','ω²'];const base=ivals[exp];const ans=`${sign===1?'':'-'}${base}`;return{q:`ω³=1, ω≠1. (1+ω)^{${n_}}=?`,opts:shuffle([ans,'1','-1','ω'].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s+3),correct:ans,tip:`1+ω=−ω². (1+ω)^${n_}=(−ω²)^${n_}=(−1)^${n_}·ω^${2*n_}=${ans}.`};},
      (s)=>{return{q:`|a|=|b|=|c|=1, a+b+c=0. 1/a+1/b+1/c=?`,opts:shuffle([0,3,-3,1],s+4),correct:'0',tip:`|a|=1→ā=1/a. Sum=ā+b̄+c̄=conj(a+b+c)=0.`};},
      (s)=>{const rn=srI(s+5,2,5);return{q:`z^{${rn}}=e^{iπ/${rn}} has how many roots in ℂ?`,opts:shuffle([rn,2*rn,rn-1,1],s+6),correct:String(rn),tip:`z^n=w (w≠0) always has exactly n roots in ℂ.`};},
    ];
    const t=T[n%T.length](n*137+71);return t;
  },
};

// ── Global Styles ──────────────────────────────────────────────
function useGlobalStyles() {
  useEffect(() => {
    _initKaTeX();
    const link = document.createElement('link');
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
  const floaters=['i²=−1','e^{iπ}+1=0','|z|','arg(z)','ℂ','ω','z̄','re^{iθ}'];
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',background:`radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.09) 0%, transparent 65%), #07090f`,textAlign:'center'}}>
      {floaters.map((s,i)=>(
        <div key={s} style={{position:'fixed',pointerEvents:'none',fontSize:14+(i%3)*7,color:`rgba(14,165,233,${0.04+(i%4)*0.02})`,top:`${8+i*11}%`,left:i%2===0?`${2+i*4}%`:`${74+i*2}%`,fontFamily:'JetBrains Mono,monospace',animation:`pulse ${3+i*0.6}s ease-in-out infinite`,animationDelay:`${i*0.25}s`}}>{s}</div>
      ))}
      <div style={{opacity:phase>=1?1:0,transform:phase>=1?'translateY(0)':'translateY(12px)',transition:'all 0.6s ease',marginBottom:20,display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',background:'rgba(14,165,233,0.08)',border:'1px solid rgba(14,165,233,0.25)',borderRadius:40}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:ACCENT,animation:'pulse 2s ease-in-out infinite'}}/>
        <span style={{fontSize:12,color:ACCENT,letterSpacing:'2px',textTransform:'uppercase',fontFamily:'Crimson Pro, serif'}}>Mathematics · Chapter 5</span>
      </div>
      <div style={{opacity:phase>=2?1:0,transform:phase>=2?'translateY(0)':'translateY(20px)',transition:'all 0.7s ease 0.1s',marginBottom:28}}>
        <h1 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:'clamp(36px, 10vw, 88px)',color:'#fff',letterSpacing:'-3px',lineHeight:0.92,marginBottom:0}}>
          Complex<br/><span style={{color:ACCENT}}>Numbers</span>
        </h1>
        <div style={{height:3,width:80,background:`linear-gradient(90deg, ${ACCENT}, transparent)`,margin:'16px auto 0',borderRadius:2}}/>
      </div>
      <div style={{opacity:phase>=3?1:0,transition:'all 0.6s ease',maxWidth:560,marginBottom:40}}>
        <p style={{fontFamily:'Crimson Pro, serif',fontSize:19,color:'rgba(255,255,255,0.7)',lineHeight:1.55,marginBottom:18,fontStyle:'italic'}}>
          "The shortest path between two truths in the real domain passes through the complex domain."
          <span style={{display:'block',fontSize:13,color:'rgba(255,255,255,0.35)',marginTop:6,fontStyle:'normal'}}>— Jacques Hadamard</span>
        </p>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 24px',textAlign:'left'}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:12,fontFamily:'JetBrains Mono, monospace'}}>Chapter Overview</div>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:'rgba(255,255,255,0.6)',lineHeight:1.75}}>
            From i²=−1 and the Argand plane through algebra, conjugates, polar form, and Euler's formula — to JEE-level De Moivre's theorem, roots of unity, complex loci, and modulus bounds — culminating in Olympiad techniques: spiral similarities, polynomial factorization, Vieta's formulas, conjugate dot products, and competition-level proofs.
          </p>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginTop:20}}>
          {['Class 11 → Olympiad','15 Topics','∞ Practice','Quiz-Gated Progress'].map(t=>(
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
    {title:'Core Complex Number Symbols',color:ACCENT,rows:NOTATION.slice(0,6)},
    {title:'Modulus, Argument & Polar Form',color:'#06B6D4',rows:NOTATION.slice(6,12)},
    {title:'Theorems & Geometric Loci',color:'#818CF8',rows:NOTATION.slice(12,17)},
    {title:'Olympiad Tools',color:'#34D399',rows:NOTATION.slice(17)},
  ];
  return (
    <div style={{minHeight:'100vh',background:'#07090f',padding:'32px 16px 60px'}}>
      <div style={{maxWidth:680,margin:'0 auto'}}>
        <div style={{marginBottom:32,opacity:revealed?1:0,transition:'opacity 0.5s ease'}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'2px',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>Before We Begin</div>
          <h2 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:34,color:'#fff',letterSpacing:'-1px',marginBottom:10}}>Notation Guide</h2>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>These symbols form the complete language of complex numbers — from basic i²=−1 to Olympiad conjugate techniques and roots of unity.</p>
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
  const lColors={Foundation:'#0EA5E9',JEE:'#06B6D4',Olympiad:'#818CF8'};
  const lDesc={Foundation:'Class 11 · Core concepts',JEE:'JEE Mains & Advanced',Olympiad:'RMO · INMO · IMO'};
  return (
    <div style={{minHeight:'100vh',background:'#07090f',padding:'28px 16px 60px'}}>
      <div style={{maxWidth:660,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'2px',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>Chapter · Complex Numbers</div>
          <h2 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:30,color:'#fff',letterSpacing:'-0.8px',marginBottom:6}}>Choose a Topic</h2>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:15,color:'rgba(255,255,255,0.4)',marginBottom:14}}>Pass the quiz gate to unlock each next topic.</p>
          <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:4,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(completedIds.size/SECTIONS.length)*100}%`,background:`linear-gradient(90deg,${ACCENT},#818CF8)`,borderRadius:4,transition:'width 0.5s ease'}}/>
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
  const lColors={Foundation:'#0EA5E9',JEE:'#06B6D4',Olympiad:'#818CF8'};
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
            {section.diagram==='argand'&&(
              <div style={{marginBottom:22,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:12,overflowX:'auto'}}>
                <ComplexPlaneSVG a={3} b={2} color={col} size={320}/>
              </div>
            )}
            {section.diagram==='unitcircle'&&(
              <div style={{marginBottom:22,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:16}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',textAlign:'center',marginBottom:8,textTransform:'uppercase',letterSpacing:'1px'}}>6th Roots of Unity on Unit Circle</div>
                <UnitCircleSVG n={6} color={col} size={320}/>
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
  const lColors={Foundation:'#0EA5E9',JEE:'#06B6D4',Olympiad:'#818CF8'};
  const col=lColors[section.level]||ACCENT;
  const gen=GENERATORS[section.genKey]||GENERATORS.cn_intro;
  const seed=baseSeed+qIdx*97;
  const question=useCallback(()=>{try{return gen(seed);}catch{return{question:'Loading…',steps:[],answer:'—',answerLatex:'—',tip:''};}}, [seed])();
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
  const lColors={Foundation:'#0EA5E9',JEE:'#06B6D4',Olympiad:'#818CF8'};
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

  const quizGen=QUIZ_GENERATORS[section.genKey]||QUIZ_GENERATORS.cn_intro;
  const qSeed=baseSeed+qIdx*113;
  const question=useCallback(()=>{
    let q; let tries=0;
    do{try{q=quizGen(qSeed+tries*7);}catch{q=null;}tries++;}while((!q||!q.q||q.opts.length<2)&&tries<10);
    if(!q||!q.q)return{q:`What is i^${4+qIdx}?`,opts:shuffle(['1','i','-1','-i'],qSeed),correct:iPow((4+qIdx)%4),tip:'Use i^n cycle: 0→1, 1→i, 2→−1, 3→−i.'};
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
            {passed?`Perfect score! You've demonstrated mastery of "${section.title}". Advancing to the next topic.`:`You got ${score} out of ${TOTAL}. You need all 4 correct to advance. Review the topic and try again.`}
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

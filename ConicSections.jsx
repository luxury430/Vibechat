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
const ACCENT = '#06B6D4';
function gcd(a,b){return b===0?Math.abs(a):gcd(b,a%b);}
function fmtF(n,d){const g=gcd(Math.abs(n),d);return g===d?String(n/g):`${n/g}/${d/g}`;}

// ── Circle SVG ─────────────────────────────────────────────────
function CircleSVG({ h=0, k=0, r=3, color=ACCENT, size=320 }) {
  const W=size, H=Math.round(size*0.62), pad=24;
  const range=r+2.5;
  const sx=x=>W/2+(x-h)/range*(W/2-pad);
  const sy=y=>H/2-(y-k)/range*(H/2-pad);
  const cx=W/2, cy=H/2;
  const svgR=(r/range)*(W/2-pad);
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      {[-2,-1,0,1,2,3].map(v=>(
        <g key={v}>
          <line x1={sx(v+h)} y1={pad} x2={sx(v+h)} y2={H-pad} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
          <line x1={pad} y1={sy(v+k)} x2={W-pad} y2={sy(v+k)} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
        </g>
      ))}
      <line x1={pad} y1={cy} x2={W-pad} y2={cy} stroke="rgba(255,255,255,0.2)" strokeWidth={1.2}/>
      <line x1={cx} y1={pad} x2={cx} y2={H-pad} stroke="rgba(255,255,255,0.2)" strokeWidth={1.2}/>
      <text x={W-pad+3} y={cy+4} fontSize={9} fill="rgba(255,255,255,0.3)" fontFamily="serif" fontStyle="italic">x</text>
      <text x={cx+4} y={pad-3} fontSize={9} fill="rgba(255,255,255,0.3)" fontFamily="serif" fontStyle="italic">y</text>
      <circle cx={cx} cy={cy} r={svgR} fill={`${color}12`} stroke={color} strokeWidth={2}/>
      <circle cx={cx} cy={cy} r={3.5} fill={color}/>
      <line x1={cx} y1={cy} x2={cx+svgR} y2={cy} stroke={`${color}77`} strokeWidth={1.5} strokeDasharray="4,3"/>
      <text x={cx+svgR/2} y={cy-6} textAnchor="middle" fontSize={9} fill={`${color}bb`} fontFamily="JetBrains Mono,monospace">r={r}</text>
      <text x={cx+4} y={cy-8} fontSize={9} fill={`${color}cc`} fontFamily="JetBrains Mono,monospace">({h},{k})</text>
      <text x={W/2} y={H-3} textAnchor="middle" fontSize={9} fill={`${color}66`} fontFamily="JetBrains Mono,monospace">
        (x{h<0?`+${Math.abs(h)}`:h>0?`-${h}`:''})\u00B2+(y{k<0?`+${Math.abs(k)}`:k>0?`-${k}`:''})\u00B2={r*r}
      </text>
    </svg>
  );
}

// ── Parabola SVG ───────────────────────────────────────────────
function ParabolaSVG({ a=2, vertical=false, color=ACCENT, size=320 }) {
  const W=size, H=Math.round(size*0.62), pad=26;
  const ymax=2*a+1.5; const xlo=-1; const xhi=a+3.5;
  const sx=x=>pad+(x-xlo)/(xhi-xlo)*(W-2*pad);
  const sy=y=>H/2-(y/ymax)*(H/2-pad);
  const pts=[];
  if(!vertical){
    for(let t=-ymax;t<=ymax;t+=0.15){const x=t*t/(4*a);if(x>=xlo&&x<=xhi)pts.push(`${sx(x).toFixed(1)},${sy(t).toFixed(1)}`);}
  } else {
    const xmax2=xhi; for(let t=-xmax2;t<=xmax2;t+=0.15){const y=t*t/(4*a);if(y<=ymax)pts.push(`${sx(t).toFixed(1)},${sy(y).toFixed(1)}`);}
  }
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      {[-1,0,1,2,3].map(v=>(
        <g key={v}><line x1={sx(v)} y1={pad} x2={sx(v)} y2={H-pad} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
        <text x={sx(v)} y={H-pad+12} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.25)" fontFamily="JetBrains Mono,monospace">{v}</text></g>
      ))}
      <line x1={pad} y1={H/2} x2={W-pad} y2={H/2} stroke="rgba(255,255,255,0.2)" strokeWidth={1.2}/>
      <line x1={sx(0)} y1={pad} x2={sx(0)} y2={H-pad} stroke="rgba(255,255,255,0.2)" strokeWidth={1.2}/>
      {!vertical&&<line x1={sx(-a)} y1={pad} x2={sx(-a)} y2={H-pad} stroke={color} strokeWidth={1.5} strokeDasharray="5,4" opacity={0.6}/>}
      {vertical&&<line x1={pad} y1={sy(-a)} x2={W-pad} y2={sy(-a)} stroke={color} strokeWidth={1.5} strokeDasharray="5,4" opacity={0.6}/>}
      {!vertical&&<circle cx={sx(a)} cy={H/2} r={4} fill={color}/>}
      {vertical&&<circle cx={sx(0)} cy={sy(a)} r={4} fill={color}/>}
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/>
      {!vertical&&<text x={sx(-a)} y={pad+10} fontSize={8} fill={`${color}99`} fontFamily="JetBrains Mono,monospace" textAnchor="middle">x=−{a}</text>}
      {!vertical&&<text x={sx(a)+2} y={H/2-8} fontSize={8} fill={`${color}cc`} fontFamily="JetBrains Mono,monospace">F({a},0)</text>}
      <text x={W/2} y={H-3} textAnchor="middle" fontSize={9} fill={`${color}66`} fontFamily="JetBrains Mono,monospace">
        {!vertical?`y\u00B2=${4*a}x (a=${a})`:`x\u00B2=${4*a}y (a=${a})`}
      </text>
    </svg>
  );
}

// ── Ellipse SVG ────────────────────────────────────────────────
function EllipseSVG({ a=5, b=3, color=ACCENT, size=320 }) {
  const W=size, H=Math.round(size*0.62), pad=26;
  const c=Math.sqrt(Math.max(0,a*a-b*b));
  const cxW=W/2, cyH=H/2;
  const sc=Math.min((W/2-pad)/a,(H/2-pad)/b);
  const rx=a*sc, ry=b*sc, fcx=c*sc;
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      <line x1={pad} y1={cyH} x2={W-pad} y2={cyH} stroke="rgba(255,255,255,0.2)" strokeWidth={1.2}/>
      <line x1={cxW} y1={pad} x2={cxW} y2={H-pad} stroke="rgba(255,255,255,0.2)" strokeWidth={1.2}/>
      <ellipse cx={cxW} cy={cyH} rx={rx} ry={ry} fill={`${color}10`} stroke={color} strokeWidth={2}/>
      <circle cx={cxW+fcx} cy={cyH} r={3.5} fill={color}/>
      <circle cx={cxW-fcx} cy={cyH} r={3.5} fill={color}/>
      <line x1={cxW} y1={cyH} x2={cxW} y2={cyH-ry} stroke={`${color}55`} strokeWidth={1.2} strokeDasharray="3,3"/>
      <line x1={cxW} y1={cyH} x2={cxW+rx} y2={cyH} stroke={`${color}55`} strokeWidth={1.2} strokeDasharray="3,3"/>
      <text x={cxW+rx+3} y={cyH+4} fontSize={8} fill={`${color}99`} fontFamily="JetBrains Mono,monospace">(a,0)</text>
      <text x={cxW-rx-3} y={cyH+4} fontSize={8} fill={`${color}99`} fontFamily="JetBrains Mono,monospace" textAnchor="end">(-a,0)</text>
      <text x={cxW+rx/2+2} y={cyH-5} fontSize={8} fill={`${color}88`} fontFamily="JetBrains Mono,monospace">a={a}</text>
      <text x={cxW+4} y={cyH-ry/2} fontSize={8} fill={`${color}88`} fontFamily="JetBrains Mono,monospace">b={b}</text>
      <text x={cxW+fcx} y={cyH+14} textAnchor="middle" fontSize={7} fill={`${color}cc`} fontFamily="JetBrains Mono,monospace">F₂</text>
      <text x={cxW-fcx} y={cyH+14} textAnchor="middle" fontSize={7} fill={`${color}cc`} fontFamily="JetBrains Mono,monospace">F₁</text>
      <text x={W/2} y={H-3} textAnchor="middle" fontSize={9} fill={`${color}66`} fontFamily="JetBrains Mono,monospace">
        x\u00B2/{a*a}+y\u00B2/{b*b}=1, c\u00B2={a*a-b*b}, e={(c/a).toFixed(3)}
      </text>
    </svg>
  );
}

// ── Trophy SVG ────────────────────────────────────────────────
function TrophySVG({ col=ACCENT }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGC" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={col} stopOpacity="0.25"/><stop offset="100%" stopColor={col} stopOpacity="0"/></radialGradient>
        <linearGradient id="trGC" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFD700"/><stop offset="50%" stopColor="#FFA500"/><stop offset="100%" stopColor="#FF6B35"/></linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#bgGC)"/>
      <circle cx="36" cy="36" r="32" fill="none" stroke={col} strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M24 18 h24 l-4 20 Q36 44 36 44 Q36 44 28 38 Z" fill="url(#trGC)" opacity="0.95"/>
      <path d="M24 22 Q16 22 16 30 Q16 36 24 36" fill="none" stroke="url(#trGC)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 22 Q56 22 56 30 Q56 36 48 36" fill="none" stroke="url(#trGC)" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="33" y="44" width="6" height="8" rx="1" fill="#FFA500" opacity="0.9"/>
      <rect x="27" y="52" width="18" height="4" rx="2" fill="url(#trGC)"/>
      <polygon points="36,21 37.5,25.5 42,25.5 38.5,28 40,32.5 36,30 32,32.5 33.5,28 30,25.5 34.5,25.5" fill="#FFF8DC" opacity="0.95"/>
      <circle cx="16" cy="16" r="2.5" fill={col} opacity="0.9"/><circle cx="56" cy="16" r="2" fill="#FFD700" opacity="0.9"/>
      <circle cx="14" cy="48" r="1.8" fill="#FF6B35" opacity="0.8"/><circle cx="58" cy="48" r="2.2" fill={col} opacity="0.8"/>
      <rect x="10" y="22" width="3" height="7" rx="1.5" fill="#4ECDC4" opacity="0.8" transform="rotate(-25 11.5 25.5)"/>
      <rect x="59" y="28" width="3" height="7" rx="1.5" fill="#FF6B6B" opacity="0.8" transform="rotate(20 60.5 31.5)"/>
    </svg>
  );
}

// ── Notation Table ─────────────────────────────────────────────
const NOTATION = [
  {sym:'(x-h)^2+(y-k)^2=r^2',name:'Standard Circle',meaning:'Center (h,k), radius r. Eccentricity e=0.',ex:'(x-2)^2+(y-3)^2=25'},
  {sym:'x^2+y^2+2gx+2fy+c=0',name:'General Circle',meaning:'Center=(−g,−f), r=√(g²+f²−c)',ex:'x^2+y^2-4x+6y-3=0\\Rightarrow c=(2,-3)'},
  {sym:'(x-x_1)(x-x_2)+(y-y_1)(y-y_2)=0',name:'Diameter Form Circle',meaning:'Diameter endpoints (x₁,y₁),(x₂,y₂); uses 90° angle in semicircle',ex:'\\text{Angle in semicircle}=90^\\circ'},
  {sym:'y^2=4ax',name:'Parabola (opens right)',meaning:'Vertex (0,0), focus (a,0), directrix x=−a, e=1',ex:'y^2=8x:\\;a=2,\\;F=(2,0)'},
  {sym:'x^2=4ay',name:'Parabola (opens up)',meaning:'Vertex (0,0), focus (0,a), directrix y=−a',ex:'x^2=12y:\\;a=3,\\;F=(0,3)'},
  {sym:'\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1,\\;a>b',name:'Standard Ellipse (horizontal)',meaning:'c²=a²−b², e=c/a<1, foci (±c,0)',ex:'\\frac{x^2}{25}+\\frac{y^2}{9}=1,\\;c=4'},
  {sym:'\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1',name:'Standard Hyperbola',meaning:'c²=a²+b², e=c/a>1, foci (±c,0)',ex:'\\frac{x^2}{16}-\\frac{y^2}{9}=1,\\;c=5'},
  {sym:'xy=c^2',name:'Rectangular Hyperbola',meaning:'Asymptotes: coordinate axes, eccentricity e=√2',ex:'xy=4,\\;\\text{pt: }(2,2)'},
  {sym:'e=c/a',name:'Eccentricity Classification',meaning:'e=0: circle; e<1: ellipse; e=1: parabola; e>1: hyperbola',ex:'e=3/5<1\\Rightarrow\\text{ellipse}'},
  {sym:'\\text{LR}=4a',name:'Latus Rectum (Parabola)',meaning:'Chord through focus perpendicular to axis; length always 4a',ex:'y^2=20x:\\;\\text{LR}=20'},
  {sym:'\\text{LR}=2b^2/a',name:'Latus Rectum (Ellipse/Hyperbola)',meaning:'Same formula for both ellipse and hyperbola',ex:'\\frac{x^2}{25}+\\frac{y^2}{9}=1:\\;\\text{LR}=\\frac{18}{5}'},
  {sym:'ax^2+2hxy+by^2+2gx+2fy+c=0',name:'General 2nd Degree Equation',meaning:'Represents any conic section (all 6 types)',ex:'h^2<ab\\Rightarrow\\text{ellipse/circle}'},
  {sym:'\\Delta=abc+2fgh-af^2-bg^2-ch^2',name:'Discriminant Δ',meaning:'Δ=0: degenerate; Δ≠0: non-degenerate conic',ex:'\\Delta=\\det\\begin{pmatrix}a&h&g\\\\h&b&f\\\\g&f&c\\end{pmatrix}'},
  {sym:'h^2=ab\\;(\\Delta\\neq0)',name:'Parabola via Determinant',meaning:'h²=ab and Δ≠0 → parabola',ex:'4x^2+4xy+y^2:\\;h=2,ab=4\\;\\checkmark'},
  {sym:'h^2<ab\\text{ or }h^2>ab',name:'Ellipse / Hyperbola',meaning:'h²<ab: ellipse (circle if h=0,a=b); h²>ab: hyperbola',ex:'x^2+y^2:\\;h=0,ab=1\\Rightarrow\\text{circle}'},
  {sym:'T=0',name:'Tangent / Chord of Contact',meaning:'Point on conic → tangent; external point → chord of contact',ex:'\\frac{xx_1}{a^2}+\\frac{yy_1}{b^2}=1'},
  {sym:'T=S_1',name:'Chord Bisected at Point',meaning:'Chord of conic S=0 with midpoint (x₁,y₁): T(x₁,y₁)=S(x₁,y₁)',ex:'\\text{Midpoint}\\;(x_1,y_1)\\Rightarrow T=S_1'},
  {sym:'t_1t_2=-1',name:'Focal Chord (Parabola)',meaning:'Ends of focal chord of y²=4ax at (at₁²,2at₁),(at₂²,2at₂)',ex:'t_1=3\\Rightarrow t_2=-1/3'},
  {sym:'x^2+y^2=a^2+b^2',name:'Director Circle (Ellipse)',meaning:'Locus of intersections of perpendicular tangents to ellipse',ex:'\\frac{x^2}{25}+\\frac{y^2}{9}=1:\\;x^2+y^2=34'},
  {sym:'y=\\pm\\frac{b}{a}x',name:'Asymptotes of Hyperbola',meaning:'Lines approached by x²/a²−y²/b²=1; pass through center',ex:'\\frac{x^2}{9}-\\frac{y^2}{4}=1:\\;y=\\pm\\frac{2}{3}x'},
  {sym:'SS_1=T^2',name:'Pair of Tangents from External Point',meaning:'Combined equation of both tangents from (x₁,y₁) to S=0',ex:'S_1=S(x_1,y_1),\\;T=\\text{polar}'},
  {sym:'\\frac{PF}{PM}=e',name:'Focus-Directrix Definition',meaning:'Fundamental: all conics defined by distance ratio to focus and directrix',ex:'e=1\\Rightarrow PF=PM\\;(\\text{parabola})'},
];

// ── Sections ───────────────────────────────────────────────────
const SECTIONS = [
  // ─── FOUNDATION ───────────────────────────────────────────────
  {id:'cs_cone',title:'Sections of a Cone',level:'Foundation',color:'#06B6D4',icon:'∩ cone',
   shortDef:"A double right circular cone intersected by a plane at different angles produces the four classical conics: Circle (⊥ to axis), Ellipse (tilted), Parabola (∥ to one generator), Hyperbola (cuts both nappes).",
   fullDef:"When a plane cuts a double right circular cone, the cross-section depends on the angle relative to the axis. (1) Circle: plane perpendicular to the axis — all points equidistant. (2) Ellipse: plane tilted at angle less than the semi-vertical angle — a closed oval. (3) Parabola: plane parallel to exactly one generator (slant edge) — open curve, e=1. (4) Hyperbola: plane cuts BOTH nappes (upper and lower cones) — two separate branches, e>1. Degenerate cases (Δ=0): point, line, pair of lines. Dandelin spheres provide elegant proofs that these cross-sections satisfy the focus-directrix ratio PF/PM=e. All four are second-degree (quadratic) curves in the Cartesian plane.",
   keyFacts:[{text:'Plane ⊥ axis → Circle (e=0)',l:'\\text{Perpendicular to axis}\\Rightarrow e=0'},{text:'Tilted < semi-vertical angle → Ellipse',l:'0<e<1\\Rightarrow\\text{ellipse}'},{text:'Parallel to one generator → Parabola',l:'e=1\\Rightarrow\\text{parabola}'},{text:'Cuts BOTH nappes → Hyperbola',l:'e>1\\Rightarrow\\text{hyperbola}'},{text:'Degenerate: pair of lines, point, empty',l:'\\Delta=0\\Rightarrow\\text{degenerate conic}'}],
   genKey:'cs_cone'},

  {id:'cs_circle',title:'The Circle',level:'Foundation',color:'#0891B2',icon:'x²+y²=r²',
   shortDef:"Standard form: (x−h)²+(y−k)²=r². General form: x²+y²+2gx+2fy+c=0, center=(−g,−f), r=√(g²+f²−c). Diameter form: (x−x₁)(x−x₂)+(y−y₁)(y−y₂)=0.",
   fullDef:"A circle is the locus of a point equidistant (distance r) from a fixed center. Standard form: (x−h)²+(y−k)²=r², center=(h,k), radius=r. General form: x²+y²+2gx+2fy+c=0 — expanding and rearranging the standard form. From general form: center=(−g,−f), r=√(g²+f²−c). Condition for real circle: g²+f²>c. If g²+f²=c: a point; g²+f²<c: empty. Diameter form: if (x₁,y₁) and (x₂,y₂) are endpoints of a diameter, the equation is (x−x₁)(x−x₂)+(y−y₁)(y−y₂)=0. This follows from the angle in a semicircle always being 90°. The eccentricity of a circle is 0. Tangent at point (x₁,y₁) on x²+y²=r²: xx₁+yy₁=r².",
   keyFacts:[{text:'Standard form',l:'(x-h)^2+(y-k)^2=r^2'},{text:'General form: center & radius',l:'x^2+y^2+2gx+2fy+c=0,\\;\\text{centre}=(-g,-f)'},{text:'Radius from general form',l:'r=\\sqrt{g^2+f^2-c}\\;\\;(g^2+f^2>c)'},{text:'Diameter form',l:'(x-x_1)(x-x_2)+(y-y_1)(y-y_2)=0'},{text:'Eccentricity e=0',l:'e=0\\;(\\text{all diameters equal})'}],
   genKey:'cs_circle',diagram:'circle'},

  {id:'cs_parabola',title:'The Parabola',level:'Foundation',color:'#0E7490',icon:'y²=4ax',
   shortDef:"y²=4ax (right): focus (a,0), directrix x=−a. y²=−4ax (left). x²=4ay (up): focus (0,a), directrix y=−a. x²=−4ay (down). Eccentricity e=1 always. Latus rectum=4a.",
   fullDef:"A parabola is the locus of a point equidistant from focus F and directrix line, so PF/PM=e=1. Standard forms: (1) y²=4ax — opens right, vertex (0,0), focus (a,0), directrix x=−a, axis y=0. (2) y²=−4ax — opens left, focus (−a,0), directrix x=a. (3) x²=4ay — opens up, focus (0,a), directrix y=−a. (4) x²=−4ay — opens down, focus (0,−a), directrix y=a. The latus rectum is the chord through the focus perpendicular to the axis; length is always 4a. Parametric form for y²=4ax: a general point is (at²,2at) for t∈ℝ. The tangent at this point is ty=x+at². The normal at this point is y+tx=2at+at³.",
   keyFacts:[{text:'y²=4ax: focus & directrix',l:'y^2=4ax:\\;F=(a,0),\\;\\text{directrix }x=-a'},{text:'x²=4ay: focus & directrix',l:'x^2=4ay:\\;F=(0,a),\\;\\text{directrix }y=-a'},{text:'Eccentricity always 1',l:'e=1\\;(PF=PM\\text{ for all points})'},{text:'Latus rectum length 4a',l:'\\text{LR}=4a\\;(\\text{chord through focus}\\perp\\text{axis})'},{text:'Parametric form',l:'(at^2,2at),\\;t\\in\\mathbb{R}'}],
   genKey:'cs_parabola',diagram:'parabola'},

  {id:'cs_ellipse',title:'The Ellipse',level:'Foundation',color:'#22D3EE',icon:'x²/a²+y²/b²',
   shortDef:"x²/a²+y²/b²=1 (a>b): c²=a²−b², e=c/a<1, foci (±c,0). Sum PF₁+PF₂=2a. Latus rectum=2b²/a. Directrices x=±a/e.",
   fullDef:"An ellipse is the locus where the sum of distances from two foci is constant: PF₁+PF₂=2a. Standard form (horizontal major axis): x²/a²+y²/b²=1 with a>b>0. c=√(a²−b²), e=c/a<1. Foci at (±c,0). Vertices at (±a,0), co-vertices (0,±b). Directrices x=±a²/c. Latus rectum length 2b²/a at each focus. For vertical major axis (b replaced by a under y²): foci at (0,±c). Key property: e close to 0 is nearly circular; e close to 1 is very elongated. Parametric form: (acosθ, bsinθ). Tangent at angle θ: (xcosθ)/a+(ysinθ)/b=1. Sum of distances 2a is the defining constant of the ellipse.",
   keyFacts:[{text:'Standard form (a>b)',l:'\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1,\\;c^2=a^2-b^2'},{text:'Eccentricity e<1',l:'e=c/a<1,\\;\\text{foci }(\\pm c,0)'},{text:'Sum of focal distances',l:'PF_1+PF_2=2a\\text{ for all }P'},{text:'Latus rectum',l:'\\text{LR}=2b^2/a\\text{ at each focus}'},{text:'Directrices',l:'x=\\pm a/e=\\pm a^2/c'}],
   genKey:'cs_ellipse',diagram:'ellipse'},

  {id:'cs_hyperbola',title:'The Hyperbola',level:'Foundation',color:'#14B8A6',icon:'x²/a²−y²/b²',
   shortDef:"|PF₁−PF₂|=2a. x²/a²−y²/b²=1: c²=a²+b², e=c/a>1. Asymptotes y=±(b/a)x. Rectangular hyperbola: xy=c², e=√2.",
   fullDef:"A hyperbola is the locus where |PF₁−PF₂|=2a (constant difference of focal distances). Standard form: x²/a²−y²/b²=1. c=√(a²+b²), e=c/a>1. Foci at (±c,0). Vertices at (±a,0). Asymptotes: y=±(b/a)x — lines the hyperbola approaches but never touches. Combined asymptote equation: x²/a²−y²/b²=0. Latus rectum 2b²/a. Directrices x=±a/e. The conjugate hyperbola is −x²/a²+y²/b²=1 (same asymptotes). Rectangular hyperbola: a=b, so asymptotes are perpendicular, e=√2. Standard form after 45° rotation: xy=c². Parametric: (ct, c/t) for t≠0. The transverse axis=2a, conjugate axis=2b.",
   keyFacts:[{text:'Standard form, c²=a²+b²',l:'\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1,\\;c^2=a^2+b^2'},{text:'e>1; |PF₁−PF₂|=2a',l:'e=c/a>1,\\;|PF_1-PF_2|=2a'},{text:'Asymptotes',l:'y=\\pm(b/a)x,\\;\\text{combined: }x^2/a^2-y^2/b^2=0'},{text:'Rectangular hyperbola',l:'xy=c^2,\\;e=\\sqrt{2},\\;\\text{param: }(ct,c/t)'},{text:'Conjugate hyperbola (same asymptotes)',l:'-x^2/a^2+y^2/b^2=1'}],
   genKey:'cs_hyperbola'},

  {id:'cs_elements',title:'Core Conic Elements',level:'Foundation',color:'#0284C7',icon:'e·LR·foci',
   shortDef:"Eccentricity e=c/a classifies all conics. Latus rectum: 4a (parabola), 2b²/a (ellipse & hyperbola). Focus-directrix ratio PF/PM=e defines every conic.",
   fullDef:"Key elements shared by all conics: (1) Eccentricity e=c/a: determines the shape. e=0: circle. 0<e<1: ellipse. e=1: parabola. e>1: hyperbola. (2) Foci: one for parabola, two for ellipse/hyperbola, conceptual for circle. (3) Directrix: a line perpendicular to the axis such that PF/PM=e. Each focus has its own directrix. (4) Vertex: point(s) on the conic closest to the center/focus. (5) Latus rectum: chord through focus perpendicular to major axis. Length = 4a for parabola; 2b²/a for ellipse and hyperbola. (6) Transverse/major axis = 2a; conjugate/minor axis = 2b. Mastering these elements allows rapid extraction of all geometric info from a conic equation. The semi-latus rectum l=b²/a is the focal distance to the conic perpendicular to the axis.",
   keyFacts:[{text:'Eccentricity scale',l:'e=0:\\text{circle},\\;e<1:\\text{ellipse},\\;e=1:\\text{para},\\;e>1:\\text{hyp}'},{text:'Parabola latus rectum',l:'\\text{Parabola }y^2=4ax:\\;\\text{LR}=4a'},{text:'Ellipse latus rectum',l:'\\text{Ellipse}:\\;\\text{LR}=2b^2/a'},{text:'Hyperbola latus rectum',l:'\\text{Hyperbola}:\\;\\text{LR}=2b^2/a'},{text:'Focus-directrix PF=e·PM',l:'\\frac{PF}{PM}=e\\;\\text{(defines the conic)}'}],
   genKey:'cs_elements',diagram:'parabola'},

  // ─── ADVANCED ─────────────────────────────────────────────────
  {id:'cs_general',title:'General Second-Degree Equation',level:'Advanced',color:'#F97316',icon:'ax²+2hxy',
   shortDef:"ax²+2hxy+by²+2gx+2fy+c=0 represents ALL conics. h²<ab→ellipse/circle; h²=ab→parabola; h²>ab→hyperbola (when Δ≠0). Δ=0 gives degenerate conics.",
   fullDef:"The general second-degree equation ax²+2hxy+by²+2gx+2fy+c=0 (a,b,c,f,g,h∈ℝ) represents any conic section. The discriminant Δ=abc+2fgh−af²−bg²−ch² (= determinant of 3×3 coefficient matrix). Classification when Δ≠0: (1) Circle: h=0 and a=b. (2) Parabola: h²=ab. (3) Ellipse: h²<ab. (4) Hyperbola: h²>ab. (5) Rectangular hyperbola: h²>ab and a+b=0. When Δ=0: degenerate — pair of real/imaginary lines, a point, or empty. The 2hxy term introduces a rotation/tilt. For no xy term (h=0), principal axes align with coordinate axes. To remove xy term: rotate by angle θ where cot(2θ)=(a−b)/(2h).",
   keyFacts:[{text:'General 2nd degree',l:'ax^2+2hxy+by^2+2gx+2fy+c=0'},{text:'h²=ab, Δ≠0 → Parabola',l:'h^2=ab\\Rightarrow\\text{parabola}'},{text:'h²<ab, Δ≠0 → Ellipse/Circle',l:'h^2<ab\\Rightarrow\\text{ellipse or circle}'},{text:'h²>ab, Δ≠0 → Hyperbola',l:'h^2>ab\\Rightarrow\\text{hyperbola}'},{text:'Degenerate when Δ=0',l:'\\Delta=0\\Rightarrow\\text{pair of lines / point}'}],
   genKey:'cs_general'},

  {id:'cs_classify',title:'Conic Classification via Δ',level:'Advanced',color:'#EA580C',icon:'Δ=abc+…',
   shortDef:"Δ=abc+2fgh−af²−bg²−ch². Full classification: compute Δ then h²−ab. Rectangular hyperbola: Δ≠0, h²>ab, a+b=0. Pair of lines: Δ=0.",
   fullDef:"Full classification procedure: Step 1 — compute h²−ab. Step 2 — compute Δ=abc+2fgh−af²−bg²−ch². Step 3: If Δ=0 → degenerate (pair of lines, a point, or empty). If Δ≠0 and h=0 and a=b → circle. If Δ≠0 and h²<ab → ellipse. If Δ≠0 and h²=ab → parabola. If Δ≠0 and h²>ab → hyperbola. If Δ≠0, h²>ab, AND a+b=0 → rectangular hyperbola. For the homogeneous equation ax²+2hxy+by²=0: always Δ=0, represents a pair of lines through origin — real if h²≥ab, imaginary if h²<ab, coincident if h²=ab. The pair of lines ax²+2hxy+by²=0 gives slopes m from bm²+2hm+a=0.",
   keyFacts:[{text:'Δ=0 → degenerate',l:'\\Delta=0\\Rightarrow\\text{pair of lines, point, or empty}'},{text:'Circle: h=0, a=b, Δ≠0',l:'h=0,\\;a=b,\\;\\Delta\\neq0\\Rightarrow\\text{circle}'},{text:'Rectangular hyperbola: a+b=0',l:'h^2>ab,\\;a+b=0\\Rightarrow\\text{rect. hyperbola}'},{text:'Real pair of lines from homogeneous',l:'ax^2+2hxy+by^2=0:\\;h^2\\geq ab\\Rightarrow\\text{real}'},{text:'Slopes from pair of lines',l:'bm^2+2hm+a=0\\;(\\text{slopes }m_1,m_2)'}],
   genKey:'cs_classify'},

  {id:'cs_tangents',title:'Equations of Tangents',level:'Advanced',color:'#FB923C',icon:'T=0',
   shortDef:"T=0 rule (point form). Parabola y²=4ax: slope form y=mx+a/m (condition c=a/m). Ellipse: y=mx±√(a²m²+b²). Hyperbola: c²=a²m²−b². Parametric forms.",
   fullDef:"Tangent equations via the T=0 substitution rule (replace x²→xx₁, y²→yy₁, 2x→x+x₁, 2y→y+y₁, 2xy→xy₁+x₁y): Parabola y²=4ax at (x₁,y₁): yy₁=2a(x+x₁). Parametric at t: ty=x+at². Slope form: y=mx+a/m — condition of tangency c=a/m. Ellipse x²/a²+y²/b²=1 at (x₁,y₁): xx₁/a²+yy₁/b²=1. Parametric at θ: (xcosθ)/a+(ysinθ)/b=1. Slope form: y=mx±√(a²m²+b²). Hyperbola x²/a²−y²/b²=1 slope form: y=mx±√(a²m²−b²); condition c²=a²m²−b². Circle x²+y²=r² slope: y=mx±r√(1+m²). The T=0 rule elegantly unifies all these formulas.",
   keyFacts:[{text:'T=0 substitution rule',l:'x^2\\to xx_1,\\;y^2\\to yy_1,\\;x\\to(x+x_1)/2'},{text:'Parabola slope form',l:'y=mx+a/m\\;(c=a/m\\text{ condition})'},{text:'Ellipse slope form',l:'y=mx\\pm\\sqrt{a^2m^2+b^2}'},{text:'Hyperbola tangency condition',l:'c^2=a^2m^2-b^2'},{text:'Ellipse parametric tangent',l:'\\frac{x\\cos\\theta}{a}+\\frac{y\\sin\\theta}{b}=1'}],
   genKey:'cs_tangents'},

  {id:'cs_normals',title:'Equations of Normals',level:'Advanced',color:'#F59E0B',icon:'normal ⊥',
   shortDef:"Normal ⊥ tangent at contact point. Parabola at (at²,2at): y+tx=2at+at³. Ellipse at (x₁,y₁): a²x/x₁−b²y/y₁=a²−b². Cubic equation for 3 normals.",
   fullDef:"The normal is perpendicular to the tangent at the point of contact. Parabola y²=4ax at (at²,2at): normal is y+tx=2at+at³. In slope form (slope m): y=mx−2am−am³. Ellipse x²/a²+y²/b²=1 at (x₁,y₁): a²x/x₁−b²y/y₁=a²−b²(=a²e²). Hyperbola x²/a²−y²/b²=1 at (x₁,y₁): a²x/x₁+b²y/y₁=a²+b². Circle x²+y²=r² at (x₁,y₁): the normal is y·x₁=x·y₁ (through center). From an external point (h,k), the normal to parabola y²=4ax at (at²,2at) passes through (h,k) iff at³+(2a−h)t−k=0. This cubic has at most 3 real roots → at most 3 normals from any external point.",
   keyFacts:[{text:'Parabola: normal at parameter t',l:'y+tx=2at+at^3'},{text:'Parabola: slope form of normal',l:'y=mx-2am-am^3'},{text:'Ellipse: normal at (x₁,y₁)',l:'a^2x/x_1-b^2y/y_1=a^2-b^2'},{text:'Hyperbola: normal',l:'a^2x/x_1+b^2y/y_1=a^2+b^2'},{text:'Normal cubic (parabola)',l:'at^3+(2a-h)t-k=0\\;(\\leq3\\text{ normals})'}],
   genKey:'cs_normals'},

  // ─── EXTREME PRO ──────────────────────────────────────────────
  {id:'cs_chords',title:'Chord Properties',level:'Extreme Pro',color:'#A855F7',icon:'T=S₁',
   shortDef:"Chord of contact T=0. Chord bisected at (x₁,y₁): T=S₁. Focal chord of parabola: t₁t₂=−1. Harmonic mean of focal distances = semi-latus rectum.",
   fullDef:"Chord of Contact: Chord joining the two tangency points from external point (x₁,y₁) to conic S=0 is given by T=0 (using the standard T rule). For parabola y²=4ax: yy₁=2a(x+x₁). For ellipse: xx₁/a²+yy₁/b²=1. Chord Bisected at (x₁,y₁): T=S₁ where S₁=S evaluated at (x₁,y₁). This gives the equation of the unique chord with midpoint (x₁,y₁). Focal Chords of Parabola y²=4ax: endpoints (at₁²,2at₁) and (at₂²,2at₂) satisfy t₁t₂=−1. Focal distance: r=a(t²+1) for point (at²,2at). For focal chord: 1/r₁+1/r₂=1/a (harmonic property — semi-LR is harmonic mean). On ellipse, focal chord satisfies 1/SP+1/S'P=2a/b² where S,S' are foci.",
   keyFacts:[{text:'Chord of contact: T=0',l:'T=0\\text{ for external point }(x_1,y_1)'},{text:'Chord bisected at P: T=S₁',l:'T=S_1,\\;\\text{where }S_1=S(x_1,y_1)'},{text:'Focal chord of parabola',l:'t_1t_2=-1\\;\\text{for }(at_i^2,2at_i)'},{text:'Focal chord harmonic property',l:'1/r_1+1/r_2=1/a\\;(\\text{semi-LR}=a)'},{text:'Focal distance formula',l:'r=a(t^2+1)\\text{ for }(at^2,2at)'}],
   genKey:'cs_chords'},

  {id:'cs_director',title:'Director Circle',level:'Extreme Pro',color:'#9333EA',icon:'⊙ director',
   shortDef:"Locus of point from which perpendicular tangents can be drawn. Ellipse: x²+y²=a²+b². Hyperbola: x²+y²=a²−b². Parabola: the directrix line itself.",
   fullDef:"The Director Circle is the locus of points from which two mutually perpendicular tangents can be drawn to the conic. For ellipse x²/a²+y²/b²=1: director circle is x²+y²=a²+b². Any point on this circle sees the ellipse at a right angle between the two tangents. For hyperbola x²/a²−y²/b²=1: director circle is x²+y²=a²−b² (real only when a>b). For circle x²+y²=r²: director circle is x²+y²=2r². For the parabola y²=4ax: there is NO circular director locus — the locus of points from which perpendicular tangents can be drawn is the directrix x=−a itself. Proof: tangent slope m gives y=mx+a/m; two perpendicular tangents m₁m₂=−1; product of the 'c' values = a²/(m₁m₂) = −a²; the x-intercept condition gives x=−a.",
   keyFacts:[{text:'Ellipse director circle',l:'x^2+y^2=a^2+b^2'},{text:'Hyperbola director circle (a>b)',l:'x^2+y^2=a^2-b^2'},{text:'Circle director circle',l:'x^2+y^2=r^2\\Rightarrow x^2+y^2=2r^2'},{text:'Parabola: directrix = director locus',l:'x=-a\\text{ for }y^2=4ax'},{text:'Tangents from director circle at 90°',l:'m_1m_2=-1\\;(\\text{perpendicular pair})'}],
   genKey:'cs_director'},

  {id:'cs_asymptotes',title:'Asymptotes & Conjugate Hyperbola',level:'Extreme Pro',color:'#C084FC',icon:'y=±(b/a)x',
   shortDef:"Asymptotes of x²/a²−y²/b²=1: y=±(b/a)x. Combined: x²/a²−y²/b²=0. Conjugate hyperbola shares same asymptotes. Rectangular hyperbola xy=c², e=√2.",
   fullDef:"Asymptotes of hyperbola x²/a²−y²/b²=1 are y=±(b/a)x, or bx∓ay=0. Combined equation: x²/a²−y²/b²=0. They pass through the center and bound both branches. The hyperbola is 'equidistant' from its asymptotes — asymptotes are tangents at infinity. The conjugate hyperbola −x²/a²+y²/b²=1 has the SAME asymptotes. The combined equation of hyperbola+conjugate = 2×(asymptotes). Angle between asymptotes: tan(θ/2)=b/a, so for rectangular (a=b): θ=90°. Rectangular hyperbola xy=c²: obtained after 45° rotation of x²−y²=2c². Parametric (ct,c/t). Eccentricity √2. Tangent at (ct,c/t): x/t+ty=2c. Normal: tx−y/t=c(t²−1/t²). Midpoint of chord joining (ct₁,c/t₁) and (ct₂,c/t₂): x-coord = c(t₁+t₂)/2.",
   keyFacts:[{text:'Asymptotes of hyperbola',l:'y=\\pm(b/a)x,\\;\\text{combined: }x^2/a^2-y^2/b^2=0'},{text:'Conjugate hyperbola (same asymptotes)',l:'-x^2/a^2+y^2/b^2=1'},{text:'Rectangular hyperbola xy=c²',l:'xy=c^2,\\;e=\\sqrt{2},\\;\\text{asym: axes}'},{text:'Rectangular parametric',l:'(ct,\\,c/t),\\;t\\neq0'},{text:'Angle between asymptotes',l:'\\tan(\\theta/2)=b/a\\;(90^\\circ\\text{ if }a=b)'}],
   genKey:'cs_asymptotes'},

  {id:'cs_conormal',title:'Co-normal Points',level:'Extreme Pro',color:'#EC4899',icon:'3 normals',
   shortDef:"At most 3 normals from external (h,k) to parabola y²=4ax. Cubic: at³+(2a−h)t−k=0. Vieta: t₁+t₂+t₃=0. Circle through 3 co-normal points passes through vertex.",
   fullDef:"From an external point (h,k), normals to parabola y²=4ax at (at²,2at) must satisfy y+tx=2at+at³. Substituting (h,k): at³+(2a−h)t−k=0. This cubic in t has roots t₁,t₂,t₃ (feet of the three normals). By Vieta's formulas: t₁+t₂+t₃=0 (coefficient of t² is 0). t₁t₂+t₂t₃+t₃t₁=(2a−h)/a. t₁t₂t₃=k/a. Key result: t₁+t₂+t₃=0 ⟹ sum of y-coordinates of feet 2a(t₁+t₂+t₃)=0 — centroid of feet lies on x-axis (axis of parabola). Another key result: circle through the 3 co-normal points always passes through the vertex (0,0) of the parabola. For ellipse, the equation for normals from (h,k) is of degree 4 (quartic) — at most 4 normals.",
   keyFacts:[{text:'Normal cubic for parabola',l:'at^3+(2a-h)t-k=0'},{text:'Vieta: sum t₁+t₂+t₃=0',l:'t_1+t_2+t_3=0\\;(\\text{coeff of }t^2=0)'},{text:'Centroid of feet on axis',l:'\\bar{y}=\\tfrac{2a(t_1+t_2+t_3)}{3}=0'},{text:'Max 3 normals to parabola',l:'\\text{cubic}\\Rightarrow\\leq3\\text{ real normals}'},{text:'Circle through co-normal points',l:'\\text{passes through vertex }(0,0)'}],
   genKey:'cs_conormal'},

  {id:'cs_polar',title:'Pole and Polar',level:'Extreme Pro',color:'#F472B6',icon:'pole↔polar',
   shortDef:"Polar of (x₁,y₁) w.r.t. conic = T=0. Reciprocal: P on polar of Q ↔ Q on polar of P. Pair of tangents from P: SS₁=T². Self-polar triangle properties.",
   fullDef:"For conic S=0, the polar of point P(x₁,y₁) is the line T=0 (same T as in tangent formula). This equals the chord of contact when P is external, and the tangent when P lies on the conic. Circle x²+y²=r²: polar of (x₁,y₁) is xx₁+yy₁=r². Ellipse: xx₁/a²+yy₁/b²=1. Parabola: yy₁=2a(x+x₁). Pole of line lx+my+n=0 w.r.t. x²+y²=r² is (−lr²/n, −mr²/n). Reciprocal property: P lies on polar of Q ↔ Q lies on polar of P. This is the harmonic property — (P,Q;A,B)=−1 where A,B are the points where PQ meets the conic. Pair of tangents from P: SS₁=T² — both tangent lines combined in one equation. A self-polar triangle has each vertex as the pole of the opposite side.",
   keyFacts:[{text:'Polar of (x₁,y₁) w.r.t. circle',l:'xx_1+yy_1=r^2\\;(=T=0)'},{text:'Polar w.r.t. ellipse',l:'xx_1/a^2+yy_1/b^2=1'},{text:'Reciprocal property',l:'P\\in\\text{polar}(Q)\\Leftrightarrow Q\\in\\text{polar}(P)'},{text:'Pair of tangents',l:'SS_1=T^2'},{text:'On conic: polar = tangent',l:'P\\in S\\Rightarrow\\text{polar}(P)=\\text{tangent at }P'}],
   genKey:'cs_polar'},

  // ─── INFINITY TIER ────────────────────────────────────────────
  {id:'cs_focusdirectrix',title:'Focus-Directrix Locus',level:'Infinity',color:'#EAB308',icon:'PF=e·PM',
   shortDef:"Unified definition PF/PM=e derives all conics. e<1→ellipse b²=a²(1−e²); e=1→parabola; e>1→hyperbola b²=a²(e²−1). Verification via parametric points.",
   fullDef:"The focus-directrix definition unifies all conics: given focus F and directrix l, the conic is the locus of P such that PF/PM=e where PM is the perpendicular to l. For F=(ae,0) and directrix x=−a/e: PF²=(x−ae)²+y², PM=x+a/e. PF=e·PM → (x−ae)²+y²=e²(x+a/e)² → x²(1−e²)+y²=a²(1−e²). For e<1: divide by a²(1−e²) → x²/a²+y²/b²=1 where b²=a²(1−e²) (ellipse). For e=1: y²=−4a·(x−a)/... simplifies to y²=4ax (parabola, F=(a,0), directrix x=−a). For e>1: x²/a²−y²/b²=1 where b²=a²(e²−1) (hyperbola). Verification: for (at²,2at) on y²=4ax, PF=a(t²+1)=PM. For ellipse vertex (a,0): PF=a−ae=a(1−e); PM=a/e−ae=a(1−e)/e; ratio=e ✓.",
   keyFacts:[{text:'Focus-directrix definition',l:'PF/PM=e\\;(\\text{all conics})'},{text:'e=1 → parabola',l:'F=(a,0),\\;x=-a\\Rightarrow y^2=4ax'},{text:'e<1 → ellipse',l:'b^2=a^2(1-e^2),\\;F=(ae,0)'},{text:'e>1 → hyperbola',l:'b^2=a^2(e^2-1)'},{text:'Directrices (ellipse/hyperbola)',l:'x=\\pm a/e=\\pm a^2/c'}],
   genKey:'cs_focusdirectrix'},

  {id:'cs_pascal',title:"Pascal's Theorem",level:'Infinity',color:'#CA8A04',icon:"Pascal's",
   shortDef:"Hexagrammum Mysticum: hexagon ABCDEF inscribed in any conic → AB∩DE, BC∩EF, CD∩FA are collinear (Pascal's line). 60 distinct Pascal lines per hexagon.",
   fullDef:"Pascal's Theorem (1640): If a hexagon ABCDEF is inscribed in a conic section (all 6 vertices on the conic), then the three intersection points of opposite sides — P₁=AB∩DE, P₂=BC∩EF, P₃=CD∩FA — are collinear. The line through P₁,P₂,P₃ is the Pascal line. This holds for all non-degenerate conics and even for degenerate ones (pair of lines → Pappus' theorem). Degenerate hexagon: when two adjacent vertices coincide (e.g., A→B), side AB becomes the tangent at A. This gives a method to construct tangents. With 6 vertices, there are 60 different orderings as a hexagon (ABCDEF, ABCDFE, etc.) — yielding 60 distinct Pascal lines. The dual of Pascal's theorem is Brianchon's theorem. Pascal was only 16 years old when he discovered this theorem.",
   keyFacts:[{text:'Statement',l:'ABCDEF\\text{ on conic}\\Rightarrow AB\\cap DE,BC\\cap EF,CD\\cap FA\\text{ collinear}'},{text:'Pascal line',l:'\\text{3 opposite-side intersections are collinear}'},{text:'Degenerate: tangent construction',l:'A=B\\Rightarrow\\text{side }AB=\\text{tangent at }A'},{text:'Dual theorem',l:"\\text{Dual}=\\text{Brianchon's theorem}"},{text:'60 Pascal lines per hexagon',l:'\\text{60 ways to arrange 6 vertices as hexagon}'}],
   genKey:'cs_pascal'},

  {id:'cs_brianchon',title:"Brianchon's Theorem",level:'Infinity',color:'#D97706',icon:"Brianchon",
   shortDef:"Dual of Pascal's: hexagon ABCDEF circumscribed about a conic (all sides tangent) → main diagonals AD, BE, CF are concurrent at Brianchon's point.",
   fullDef:"Brianchon's Theorem (1810): If hexagon ABCDEF is circumscribed about a conic (each of its 6 sides is tangent to the conic), then the three main diagonals AD, BE, CF are concurrent. Their point of concurrence is the Brianchon point. This is the exact projective dual of Pascal's theorem: replace 'points on conic' ↔ 'lines tangent to conic', 'collinear' ↔ 'concurrent', 'sides' ↔ 'vertices'. For a circle, a circumscribed hexagon has three concurrent diagonals. Degenerate case: triangle circumscribed about a conic — the three vertex-to-tangent-point lines (cevians) are concurrent (a statement consistent with Ceva's theorem). The Brianchon point is the pole of the Pascal line with respect to the conic. Both theorems are purely projective — they hold over any field.",
   keyFacts:[{text:'Statement',l:'\\text{Hexagon circumscribed}\\Rightarrow AD,BE,CF\\text{ concurrent}'},{text:'Brianchon point',l:'\\text{Concurrence of the 3 main diagonals}'},{text:'Duality with Pascal',l:'\\text{Inscribed→collinear}\\;\\leftrightarrow\\;\\text{circumscribed→concurrent}'},{text:'Pole relationship',l:'\\text{Brianchon pt = pole of Pascal line}'},{text:'Degenerate: triangle',l:'\\text{Triangle circumscribed: cevians concurrent}'}],
   genKey:'cs_brianchon'},

  {id:'cs_duality',title:'Pole-Polar Duality Transformations',level:'Infinity',color:'#FBBF24',icon:'P↔line',
   shortDef:"Projective duality via pole-polar maps points↔lines. Cross-ratio (A,B;P,Q)=−1 ↔ harmonic conjugates. Collinear points ↔ concurrent lines. Self-polar triangles.",
   fullDef:"The pole-polar relationship establishes projective duality: every point P maps to a line (polar) and every line maps to a point (pole) w.r.t. a fixed conic. This mapping is an involution: (polar of pole) = original line. Harmonic property: P and Q are harmonic conjugates w.r.t. A,B if (P,Q;A,B)=−1 (cross-ratio). This happens iff Q lies on the polar of P (and P on polar of Q). Cross-ratio: (A,B;P,Q)=(AP/PB)/(AQ/QB) using signed ratios. Projective duality: 'collinear points' ↔ 'concurrent lines'. Transforms Pascal's theorem into Brianchon's. A self-polar triangle: each vertex is the pole of the opposite side; the triangle is self-conjugate. Applications: finding polars quickly, proving collinearity by checking concurrence of polars, and vice versa — solving complex problems by 'dualizing' into simpler configurations.",
   keyFacts:[{text:'Pole-polar duality',l:'P\\leftrightarrow\\text{polar}(P)\\;\\text{(w.r.t. conic)}'},{text:'Harmonic conjugates',l:'(A,B;P,Q)=-1\\Leftrightarrow Q\\in\\text{polar}(P)'},{text:'Collinear → concurrent (duality)',l:'P,Q,R\\text{ collinear}\\Rightarrow\\text{polars concurrent}'},{text:'Self-polar triangle',l:'\\text{Each vertex = pole of opposite side}'},{text:'Cross-ratio invariance',l:'(A,B;C,D)\\text{ preserved by projective maps}'}],
   genKey:'cs_duality'},

  {id:'cs_homothety',title:'Homothety & Inversion in Conics',level:'Infinity',color:'#F59E0B',icon:'inversion',
   shortDef:"Homothety (x,y)→(ax,by) maps circle to ellipse. Inversion (x,y)→(x,y)/(x²+y²): circle through origin → line; circle not through origin → circle. All conics projectively equivalent.",
   fullDef:"Homothety (scaling): the transformation (x,y)→(ax,by) maps conics to conics of the same type. The unit circle x²+y²=1 maps to x²/a²+y²/b²=1 (an ellipse) under (x,y)→(ax,by). Similarly, any ellipse can be obtained from any circle via an appropriate affine scaling. Inversion: the map (x,y)→(x/(x²+y²), y/(x²+y²)) about the origin. Key rules: (i) Circle through origin → line. (ii) Circle NOT through origin → circle (not through origin). (iii) Line through origin → itself. (iv) Line not through origin → circle through origin. Inversion maps a conic to a higher-degree curve in general. Projective transformation: a map (X,Y,Z)→A(X,Y,Z)ᵀ (invertible 3×3 matrix) in homogeneous coordinates maps conics to conics, preserving degree and cross-ratio. All conics are projectively equivalent — every conic can be transformed to x²+y²=z² (unit circle in projective plane) via a projective map.",
   keyFacts:[{text:'Homothety: circle → ellipse',l:'(x,y)\\to(ax,by):\\;x^2+y^2=1\\to x^2/a^2+y^2/b^2=1'},{text:'Inversion formula',l:'(x,y)\\to(x/(x^2+y^2),\\;y/(x^2+y^2))'},{text:'Circle through O → line',l:'\\text{Under inversion: circle through origin}\\to\\text{line}'},{text:'Line through O → itself',l:'\\text{Lines through inversion center are fixed}'},{text:'All conics projectively equivalent',l:'\\text{Every conic}\\cong x^2+y^2=z^2\\text{ (proj.)}'}],
   genKey:'cs_homothety'},

  {id:'cs_intersections',title:'Intersections of Conics',level:'Infinity',color:'#A16207',icon:"Bezout's",
   shortDef:"Bezout's theorem: two degree-2 curves intersect in 2×2=4 points in ℙ²(ℂ). Radical axis: S₁−S₂=0. Family S+λS'=0 passes through all common points.",
   fullDef:"Bezout's Theorem: two algebraic curves of degrees m and n intersect in exactly m×n points in the complex projective plane ℙ²(ℂ), counted with multiplicity. Two conics (both degree 2): exactly 4 intersection points over ℂ. Real intersection counts: 0, 1, 2, 3, or 4 real points depending on configuration. A tangency counts as 2 (multiplicity 2). Two circles always have exactly 2 real intersections OR are non-intersecting (the other 2 are complex conjugate). Radical Axis: for circles S₁=0 and S₂=0, the radical axis S₁−S₂=0 is a line (since x² and y² terms cancel). Points on the radical axis have equal power (equal tangent length) to both circles. Family of Conics: S+λS'=0 for λ∈ℝ sweeps a family of conics all passing through the 4 common points of S=0 and S'=0. This is used to find all conics through 4 given points.",
   keyFacts:[{text:"Bezout's theorem",l:'\\deg f\\cdot\\deg g=mn\\text{ intersection pts in }\\mathbb{P}^2(\\mathbb{C})'},{text:'Two conics: 4 points in ℂ',l:'2\\times2=4,\\;\\leq4\\text{ real intersections}'},{text:'Radical axis of two circles',l:'S_1-S_2=0\\;(\\text{linear — }x^2,y^2\\text{ cancel})'},{text:'Family of conics through 4 pts',l:'S+\\lambda S\'=0,\\;\\lambda\\in\\mathbb{R}'},{text:'Tangency = double intersection',l:'\\text{Tangent at }P\\Rightarrow P\\text{ has multiplicity 2}'}],
   genKey:'cs_intersections'},
];

// ── Practice Generators ───────────────────────────────────────
const GENERATORS = {
  cs_cone:(n)=>{
    const t=n%3;
    if(t===0){const types=['Circle','Ellipse','Parabola','Hyperbola'];const eVals=['0','0.6','1','1.5'];const i=srI(n+1,0,3);return{question:`A conic has eccentricity e=${eVals[i]}. Identify the type of conic section.`,questionLatex:`e=${eVals[i]}`,steps:[`Eccentricity e classifies all conics:`,`e=0 → Circle`,`0<e<1 → Ellipse`,`e=1 → Parabola`,`e>1 → Hyperbola`,`e=${eVals[i]} → ${types[i]}`],answer:types[i],answerLatex:`e=${eVals[i]}\\Rightarrow\\text{${types[i]}}`,tip:`Memorize: e=0 circle, e<1 ellipse, e=1 parabola, e>1 hyperbola.`};}
    if(t===1){const descs=[['perpendicular to the axis of the cone','Circle'],['parallel to exactly one generator (slant edge) of the cone','Parabola'],['at an angle less than the semi-vertical angle of the cone','Ellipse'],['cutting through both nappes (upper and lower parts) of the cone','Hyperbola']];const j=srI(n+2,0,3);const[desc,type]=descs[j];return{question:`A plane is ${desc}. What conic section is formed?`,questionLatex:`\\text{Cutting plane: ${desc}}`,steps:[`Plane perpendicular to axis → circle`,`Plane parallel to one generator → parabola (e=1)`,`Plane tilted less than semi-vertical angle → ellipse`,`Plane cuts both nappes → hyperbola`,`This plane → ${type}`],answer:type,answerLatex:`\\text{${type}}`,tip:`The parabola is the special 'boundary' case between the closed ellipse and the two-branched hyperbola.`};}
    return{question:`State the Dandelin sphere proof idea for the parabola: what two geometric distances are shown equal?`,questionLatex:`\\text{Dandelin sphere: parabola}`,steps:[`One Dandelin sphere fits inside the cone, touching the cutting plane at point F`,`The sphere also touches the cone along a circle; the plane through this circle meets the cutting plane in a line — the directrix`,`For any point P on the parabola, the generator through P touches the sphere at A`,`PF = PA (tangents from P to the sphere)`,`PA = PD (P to directrix, since A is on the generator plane circle)`,`Therefore PF = PM (distance to directrix) → e=1 ✓`],answer:`PF = PM (distance to directrix), proving e=1`,answerLatex:`PF=PM\\Rightarrow e=1\\;\\checkmark`,tip:`Dandelin spheres give elegant geometric proofs. For parabola: one sphere. For ellipse/hyperbola: two spheres (one in each nappe).`};
  },

  cs_circle:(n)=>{
    const t=n%3;
    if(t===0){const h=srI(n,-4,4),k=srI(n+1,-4,4),r=srI(n+2,1,6);const hs=h<0?`+${Math.abs(h)}`:h>0?`-${h}`:'';const ks=k<0?`+${Math.abs(k)}`:k>0?`-${k}`:'';return{question:`Write the equation of a circle with center (${h},${k}) and radius r=${r}.`,questionLatex:`\\text{Center }(${h},${k}),\\;r=${r}`,steps:[`Standard form: (x−h)²+(y−k)²=r²`,`Substitute h=${h}, k=${k}, r=${r}`,`(x${hs})²+(y${ks})²=${r}²=${r*r}`],answer:`(x${hs})²+(y${ks})²=${r*r}`,answerLatex:`(x${hs})^2+(y${ks})^2=${r*r}`,tip:`The right side is r²=${r*r}, NOT r. The signs inside the brackets flip: centre (${h},${k}) gives (x${hs}).`};}
    if(t===1){const h=srI(n+3,-3,3),k=srI(n+4,-3,3),r=srI(n+5,1,5);const g=-h,f=-k,c=h*h+k*k-r*r;const G=2*g,F=2*f;const gs=G>=0?`+${G}`:`${G}`,fs=F>=0?`+${F}`:`${F}`,cs=c>=0?`+${c}`:`${c}`;return{question:`Find the center and radius of: x²+y²${gs}x${fs}y${cs}=0`,questionLatex:`x^2+y^2${gs}x${fs}y${cs}=0`,steps:[`Compare with x²+y²+2gx+2fy+c=0`,`2g=${G} → g=${g};  2f=${F} → f=${f};  c=${c}`,`Center = (−g,−f) = (${h},${k})`,`r² = g²+f²−c = ${g*g}+${f*f}−(${c}) = ${g*g+f*f-c}`,`r = ${r}`],answer:`Center=(${h},${k}), r=${r}`,answerLatex:`\\text{Center}=(${h},${k}),\\;r=${r}`,tip:`Key: center=(−g,−f). Extract g and f by halving the linear coefficients. Then r=√(g²+f²−c).`};}
    const x1=srI(n+6,-4,0),y1=srI(n+7,-3,3),x2=srI(n+8,1,5),y2=srI(n+9,-3,3);
    const cx=(x1+x2)/2,cy=(y1+y2)/2,r2=((x2-x1)**2+(y2-y1)**2)/4;
    return{question:`Find the equation of the circle with diameter endpoints A(${x1},${y1}) and B(${x2},${y2}).`,questionLatex:`A(${x1},${y1}),\\;B(${x2},${y2})\\text{ diameter endpoints}`,steps:[`Diameter form: (x−x₁)(x−x₂)+(y−y₁)(y−y₂)=0`,`(x−${x1})(x−${x2})+(y−${y1})(y−${y2})=0`,`Center = midpoint = ((${x1}+${x2})/2,(${y1}+${y2})/2) = (${cx},${cy})`,`r² = [(${x2-x1})²+(${y2-y1})²]/4 = ${r2}`],answer:`(x−${x1})(x−${x2})+(y−${y1})(y−${y2})=0; Center=(${cx},${cy}), r²=${r2}`,answerLatex:`(x-${x1})(x-${x2})+(y-${y1})(y-${y2})=0`,tip:`Diameter form uses the angle-in-semicircle=90° theorem. Center = midpoint of diameter.`};
  },

  cs_parabola:(n)=>{
    const t=n%3;const a=srI(n,1,6);
    if(t===0){return{question:`For y²=${4*a}x, find (a) value of a, (b) focus, (c) directrix, (d) latus rectum length.`,questionLatex:`y^2=${4*a}x`,steps:[`Compare y²=4ax: 4a=${4*a} → a=${a}`,`Focus F=(a,0)=(${a},0)`,`Directrix: x=−a → x=−${a}`,`Latus rectum length=4a=${4*a}`,`LR endpoints: x=${a},y²=${4*a}·${a}=${4*a*a} → y=±${2*a}; LR from (${a},${-2*a}) to (${a},${2*a})`],answer:`a=${a}, F=(${a},0), directrix x=−${a}, LR=4a=${4*a}`,answerLatex:`a=${a},\\;F=(${a},0),\\;x=-${a},\\;\\text{LR}=${4*a}`,tip:`Always compare 4a with the coefficient of x (or y). Directrix is at x=−a for y²=4ax — note the NEGATIVE.`};}
    if(t===1){return{question:`For x²=${4*a}y, identify the opening direction, focus, and directrix.`,questionLatex:`x^2=${4*a}y`,steps:[`Form x²=4ay: 4a=${4*a} → a=${a}. Opens UPWARD.`,`Focus: (0,a)=(0,${a})`,`Directrix: y=−a → y=−${a}`,`Vertex: (0,0), Latus rectum length=4a=${4*a}`],answer:`Opens up, F=(0,${a}), directrix y=−${a}`,answerLatex:`F=(0,${a}),\\;y=-${a}`,tip:`x²=4ay → opens UP; x²=−4ay → DOWN; y²=4ax → RIGHT; y²=−4ax → LEFT.`};}
    return{question:`Find the equation of the parabola with vertex (0,0) and focus (${a},0).`,questionLatex:`\\text{Vertex}=(0,0),\\;\\text{Focus}=(${a},0)`,steps:[`Focus (${a},0) lies on positive x-axis → parabola opens right`,`a=${a}`,`Standard form y²=4ax = y²=${4*a}x`,`Directrix: x=−${a}; Latus rectum=4a=${4*a}`],answer:`y²=${4*a}x`,answerLatex:`y^2=${4*a}x`,tip:`Focus on positive x-axis → y²=4ax (opens right). Focus on positive y-axis → x²=4ay (opens up).`};
  },

  cs_ellipse:(n)=>{
    const t=n%3;const a=srI(n,3,7),b=srI(n+1,1,a-1);const c=Math.sqrt(a*a-b*b),e=c/a;
    if(t===0){return{question:`For x²/${a*a}+y²/${b*b}=1 (a=${a}>b=${b}), find c, e, foci, and latus rectum.`,questionLatex:`\\frac{x^2}{${a*a}}+\\frac{y^2}{${b*b}}=1`,steps:[`a²=${a*a}, b²=${b*b}`,`c²=a²−b²=${a*a}−${b*b}=${a*a-b*b} → c=${c.toFixed(3)}`,`e=c/a=${c.toFixed(3)}/${a}=${e.toFixed(4)} < 1 ✓`,`Foci: (±${c.toFixed(3)},0)`,`LR=2b²/a=2·${b*b}/${a}=${(2*b*b/a).toFixed(3)}`],answer:`c≈${c.toFixed(3)}, e≈${e.toFixed(3)}, LR=${(2*b*b/a).toFixed(3)}`,answerLatex:`c=${c.toFixed(2)},\\;e=${e.toFixed(3)},\\;\\text{LR}=${(2*b*b/a).toFixed(2)}`,tip:`ELLIPSE: c²=a²−b² (MINUS). HYPERBOLA: c²=a²+b² (PLUS). Never mix these up!`};}
    if(t===1){const av=srI(n+4,3,7),bv=srI(n+5,1,av-1),cv=Math.sqrt(av*av-bv*bv);return{question:`x²/${bv*bv}+y²/${av*av}=1 (vertical ellipse). Find the foci.`,questionLatex:`\\frac{x^2}{${bv*bv}}+\\frac{y^2}{${av*av}}=1`,steps:[`Larger denominator ${av*av} is under y² → vertical major axis, a=${av},b=${bv}`,`c²=a²−b²=${av*av}−${bv*bv}=${av*av-bv*bv} → c=${cv.toFixed(3)}`,`For vertical ellipse: foci on y-axis: (0,±${cv.toFixed(3)})`,`e=c/a=${cv.toFixed(3)}/${av}=${(cv/av).toFixed(4)} < 1 ✓`],answer:`Foci: (0,±${cv.toFixed(3)})`,answerLatex:`\\text{Foci: }(0,\\pm${cv.toFixed(2)})`,tip:`If larger denominator is under y²: vertical ellipse, foci on y-axis. If under x²: horizontal, foci on x-axis.`};}
    const a2=srI(n+2,3,7),eN=srI(n+3,1,4),eD=eN+srI(n+4,1,3);const eV=eN/eD,c2=eV*a2,b2=Math.sqrt(a2*a2-c2*c2);
    return{question:`Ellipse: a=${a2}, eccentricity e=${eN}/${eD}. Find b and state the equation.`,questionLatex:`a=${a2},\\;e=${eN}/${eD}`,steps:[`c=ae=${a2}·${eN}/${eD}=${(a2*eN/eD).toFixed(3)}`,`b²=a²−c²=${a2*a2}−${c2.toFixed(3)}²=${(a2*a2-c2*c2).toFixed(3)}`,`b=${b2.toFixed(3)}`],answer:`b≈${b2.toFixed(3)}, equation: x²/${a2*a2}+y²/${(a2*a2-c2*c2).toFixed(2)}=1`,answerLatex:`b\\approx${b2.toFixed(2)},\\;\\frac{x^2}{${a2*a2}}+\\frac{y^2}{${(a2*a2-c2*c2).toFixed(2)}}=1`,tip:`Use c=ae to find c first, then b²=a²−c² for ellipse.`};
  },

  cs_hyperbola:(n)=>{
    const t=n%3;const a=srI(n,2,6),b=srI(n+1,1,5);const c=Math.sqrt(a*a+b*b),e=c/a;
    if(t===0){return{question:`For x²/${a*a}−y²/${b*b}=1, find c, e, foci, asymptotes, and latus rectum.`,questionLatex:`\\frac{x^2}{${a*a}}-\\frac{y^2}{${b*b}}=1`,steps:[`a²=${a*a}, b²=${b*b}`,`c²=a²+b²=${a*a}+${b*b}=${a*a+b*b} → c=${c.toFixed(3)}`,`e=c/a=${e.toFixed(4)} > 1 ✓`,`Foci: (±${c.toFixed(3)},0)`,`Asymptotes: y=±(${b}/${a})x`,`LR=2b²/a=${(2*b*b/a).toFixed(3)}`],answer:`c≈${c.toFixed(3)}, e≈${e.toFixed(3)}, asymptotes y=±${b}/${a}·x`,answerLatex:`c=${c.toFixed(2)},\\;y=\\pm\\tfrac{${b}}{${a}}x`,tip:`HYPERBOLA: c²=a²+b² (PLUS). Also: asymptotes are y=±(b/a)x, NOT ±(a/b)x.`};}
    if(t===1){const c2=srI(n+2,1,5);return{question:`For rectangular hyperbola xy=${c2*c2}: find e, state the parametric form, and give one point.`,questionLatex:`xy=${c2*c2}`,steps:[`xy=c² with c=${c2}. Rectangular hyperbola (a=b after rotation)`,`Eccentricity e=√2 (always for rectangular hyperbola)`,`Parametric: (ct,c/t)=(${c2}t, ${c2}/t) for any t≠0`,`Point t=1: (${c2},${c2}); check: ${c2}·${c2}=${c2*c2} ✓`,`Asymptotes: coordinate axes x=0 and y=0`],answer:`e=√2, parametric (${c2}t, ${c2}/t), point (${c2},${c2})`,answerLatex:`e=\\sqrt{2},\\;(${c2}t,\\,${c2}/t)`,tip:`Rectangular hyperbola: xy=c², e=√2, parametric=(ct,c/t), asymptotes=coordinate axes.`};}
    return{question:`Write the conjugate hyperbola to x²/${a*a}−y²/${b*b}=1 and state their shared property.`,questionLatex:`\\text{Conjugate of }\\frac{x^2}{${a*a}}-\\frac{y^2}{${b*b}}=1`,steps:[`Conjugate hyperbola: negate both fractions: −x²/${a*a}+y²/${b*b}=1`,`Equivalently: y²/${b*b}−x²/${a*a}=1`,`SAME asymptotes: y=±(${b}/${a})x`,`Original eq. + Conjugate eq. = 2·(asymptote eq.): x²/${a*a}−y²/${b*b}+(−x²/${a*a}+y²/${b*b})=0`],answer:`Conjugate: y²/${b*b}−x²/${a*a}=1; same asymptotes y=±${b}/${a}·x`,answerLatex:`\\frac{y^2}{${b*b}}-\\frac{x^2}{${a*a}}=1,\\;y=\\pm\\tfrac{${b}}{${a}}x\\text{ (shared)}`,tip:`Conjugate hyperbola: flip the sign of =1 to =−1, or swap the terms. SAME asymptotes always.`};
  },

  cs_elements:(n)=>{
    const t=n%3;
    if(t===0){const a=srI(n,1,6);return{question:`Parabola y²=${4*a}x has latus rectum of length ${4*a}. Find a, focus, and directrix.`,questionLatex:`y^2=${4*a}x,\\;\\text{LR}=${4*a}`,steps:[`LR=4a=${4*a} → a=${a}`,`Focus=(a,0)=(${a},0)`,`Directrix: x=−${a}`],answer:`a=${a}, F=(${a},0), directrix x=−${a}`,answerLatex:`a=${a},\\;F=(${a},0),\\;x=-${a}`,tip:`LR=4a for parabola. Divide LR by 4 to get a.`};}
    if(t===1){const a=srI(n+2,3,7),b=srI(n+3,1,a-1);const c=Math.sqrt(a*a-b*b),e=c/a,lr=2*b*b/a;return{question:`Ellipse x²/${a*a}+y²/${b*b}=1. Find eccentricity e and length of latus rectum.`,questionLatex:`\\frac{x^2}{${a*a}}+\\frac{y^2}{${b*b}}=1`,steps:[`c=√(a²−b²)=√(${a*a}−${b*b})=√${a*a-b*b}≈${c.toFixed(3)}`,`e=c/a≈${e.toFixed(4)} < 1 ✓`,`LR=2b²/a=2·${b*b}/${a}=${lr.toFixed(3)}`],answer:`e≈${e.toFixed(3)}, LR≈${lr.toFixed(3)}`,answerLatex:`e\\approx${e.toFixed(3)},\\;\\text{LR}=${lr.toFixed(2)}`,tip:`Ellipse LR=2b²/a. Hyperbola ALSO uses LR=2b²/a. Don't confuse the c² formulas though (minus vs plus).`};}
    const a3=srI(n+4,1,6);return{question:`Parabola with vertex at origin has directrix x=−${a3}. Find the equation and focus.`,questionLatex:`\\text{Directrix: }x=-${a3}`,steps:[`Directrix x=−a where a=${a3}`,`Parabola opens RIGHT (directrix on left side of vertex)`,`Equation: y²=4ax=y²=${4*a3}x`,`Focus: (${a3},0)`],answer:`y²=${4*a3}x, Focus=(${a3},0)`,answerLatex:`y^2=${4*a3}x,\\;F=(${a3},0)`,tip:`Directrix x=−a → opens right, y²=4ax. Directrix y=−a → opens up, x²=4ay.`};
  },

  cs_general:(n)=>{
    const t=n%3;
    if(t===0){const cases=[{a:1,h:0,b:1,type:'Circle',desc:'h=0, a=b, Δ≠0'},{a:2,h:0,b:3,type:'Ellipse',desc:'h²=0 < ab=6'},{a:1,h:2,b:4,type:'Parabola',desc:'h²=4 = ab=4'},{a:1,h:0,b:-1,type:'Hyperbola',desc:'h²=0 > ab=−1'}];const i=srI(n+1,0,3);const {a:ca,h:ch,b:cb,type,desc}=cases[i];return{question:`In ax²+2hxy+by²+…=0 with a=${ca},h=${ch},b=${cb}: classify the conic (Δ≠0).`,questionLatex:`a=${ca},\\;h=${ch},\\;b=${cb}`,steps:[`h²=${ch*ch},\\;ab=${ca*cb}`,`Compare: h²=${ch*ch} vs ab=${ca*cb}`,`Also check h=0 and a=b`,`Classification: ${type} (${desc})`],answer:type,answerLatex:`\\text{${type}}\\;(${desc})`,tip:`Always compute h² and ab first. h²<ab: ellipse/circle; h²=ab: parabola; h²>ab: hyperbola.`};}
    if(t===1){return{question:`Factor x²−5xy+6y²=0 (a pair of straight lines through origin).`,questionLatex:`x^2-5xy+6y^2=0`,steps:[`Treat as quadratic in x: x²−5xy+6y²=0`,`Discriminant: (5y)²−4·1·6y²=25y²−24y²=y²`,`x=(5y±y)/2 → x=3y or x=2y`,`Check: (x−2y)(x−3y)=x²−5xy+6y²=0 ✓`,`Δ=0 confirms degenerate conic (pair of lines)`],answer:`(x−2y)(x−3y)=0; lines x=2y and x=3y`,answerLatex:`(x-2y)(x-3y)=0`,tip:`For homogeneous ax²+2hxy+by²=0: always Δ=0 (degenerate). Factor as product of two linear forms.`};}
    return{question:`For 3x²+2hxy+3y²+…=0 to represent a parabola, find h.`,questionLatex:`3x^2+2hxy+3y^2+\\cdots\\;\\text{parabola condition}`,steps:[`Parabola condition: h²=ab`,`a=3, b=3: ab=9`,`h²=9 → h=±3`,`Check: a+b=3+3=6≠0 (not rectangular hyperbola)`,`So h=±3 gives a parabola`],answer:`h=±3`,answerLatex:`h=\\pm3`,tip:`Parabola: h²=ab. Here ab=3·3=9, so h=±3. Note a+b≠0 confirms it's a parabola not rect. hyperbola.`};
  },

  cs_classify:(n)=>{
    const t=n%2;
    if(t===0){const a=srI(n,1,4),b=srI(n+1,1,4),c=srI(n+2,-4,4);const f=srI(n+3,-3,3),g=srI(n+4,-3,3),h=0;const D=a*b*c+2*f*g*h-a*f*f-b*g*g-c*h*h;return{question:`Compute Δ for a=${a},b=${b},c=${c},f=${f},g=${g},h=0.`,questionLatex:`\\Delta=abc+2fgh-af^2-bg^2-ch^2,\\;h=0`,steps:[`Δ=abc+2fgh−af²−bg²−ch²`,`With h=0: Δ=abc−af²−bg²`,`abc=${a}·${b}·${c}=${a*b*c}`,`af²=${a}·${f*f}=${a*f*f}`,`bg²=${b}·${g*g}=${b*g*g}`,`Δ=${a*b*c}−${a*f*f}−${b*g*g}=${D}`],answer:`Δ=${D} (${D===0?'degenerate':'non-degenerate'})`,answerLatex:`\\Delta=${D}`,tip:`Δ=abc+2fgh−af²−bg²−ch². With h=0: reduces to Δ=abc−af²−bg².`};}
    const a5=srI(n+1,1,5);return{question:`Show x²−y²−${2*a5}x+${2*a5}y=0 is a rectangular hyperbola. What is a+b?`,questionLatex:`x^2-y^2-${2*a5}x+${2*a5}y=0`,steps:[`Compare: a=1,h=0,b=−1,g=−${a5},f=${a5},c=0`,`h²=0, ab=1·(−1)=−1; h²=0>ab=−1 → hyperbola ✓`,`a+b=1+(−1)=0 → rectangular hyperbola condition ✓`,`(Asymptotes are perpendicular since a+b=0)`],answer:`a+b=0, confirmed rectangular hyperbola`,answerLatex:`a+b=0\\Rightarrow\\text{rectangular hyperbola}`,tip:`Two tests for rectangular hyperbola: (i) h²>ab AND (ii) a+b=0. Both needed!`};
  },

  cs_tangents:(n)=>{
    const t=n%3;const a=srI(n,1,5);
    if(t===0){const m=srI(n+1,1,4);return{question:`Find the equation of tangent to y²=${4*a}x with slope m=${m}.`,questionLatex:`y^2=${4*a}x,\\;m=${m}`,steps:[`Parabola y²=4ax, a=${a}`,`Slope form: y=mx+a/m`,`y=${m}x+${a}/${m}`,`Simplify: y=${m}x+${+(a/m).toFixed(3)}`,`Condition: c=a/m (the y-intercept equals a/m)`],answer:`y=${m}x+${+(a/m).toFixed(3)}`,answerLatex:`y=${m}x+\\dfrac{${a}}{${m}}`,tip:`Parabola y²=4ax slope tangent: y=mx+a/m. Constant term is ALWAYS a/m — not m/a!`};}
    if(t===1){const a2=srI(n+2,3,6),b2=srI(n+3,1,a2-1);return{question:`Find the tangent to x²/${a2*a2}+y²/${b2*b2}=1 at its vertex (${a2},0).`,questionLatex:`\\text{Tangent at }(${a2},0)\\text{ to }\\frac{x^2}{${a2*a2}}+\\frac{y^2}{${b2*b2}}=1`,steps:[`Apply T=0 rule: xx₁/a²+yy₁/b²=1`,`x₁=${a2}, y₁=0`,`x·${a2}/${a2*a2}+y·0/${b2*b2}=1`,`x/${a2}=1`,`x=${a2} (vertical tangent at right vertex)`],answer:`x=${a2}`,answerLatex:`x=${a2}`,tip:`At vertex (a,0) of ellipse: tangent is x=a (vertical line). Similarly at (−a,0): x=−a.`};}
    const a3=srI(n+4,3,6),b3=srI(n+5,1,a3-1),m=srI(n+6,1,4);
    return{question:`Find the slope-form tangents to x²/${a3*a3}+y²/${b3*b3}=1 with slope m=${m}.`,questionLatex:`\\frac{x^2}{${a3*a3}}+\\frac{y^2}{${b3*b3}}=1,\\;m=${m}`,steps:[`Ellipse slope tangent: y=mx±√(a²m²+b²)`,`a²=${a3*a3}, b²=${b3*b3}, m=${m}`,`a²m²=${a3*a3*m*m}, b²=${b3*b3}`,`√(a²m²+b²)=√(${a3*a3*m*m}+${b3*b3})=√${a3*a3*m*m+b3*b3}≈${Math.sqrt(a3*a3*m*m+b3*b3).toFixed(3)}`],answer:`y=${m}x±√${a3*a3*m*m+b3*b3}≈${m}x±${Math.sqrt(a3*a3*m*m+b3*b3).toFixed(3)}`,answerLatex:`y=${m}x\\pm\\sqrt{${a3*a3*m*m+b3*b3}}`,tip:`Ellipse: y=mx±√(a²m²+b²). Both + and − give two parallel tangents with slope m.`};
  },

  cs_normals:(n)=>{
    const t=n%2;const a=srI(n,1,4);const t1=(srI(n+1,0,5)||1)*(n%2===0?1:-1);
    if(t===0){return{question:`Find the normal to y²=${4*a}x at parameter t=${t1} (point=(${a*t1*t1},${2*a*t1})).`,questionLatex:`y^2=${4*a}x\\text{ at }t=${t1}`,steps:[`Normal at (at²,2at): y+tx=2at+at³`,`a=${a}, t=${t1}`,`y+${t1}x=2·${a}·${t1}+${a}·${Math.pow(t1,3)}`,`y+${t1}x=${2*a*t1}+${a*Math.pow(t1,3)}`,`y+${t1}x=${2*a*t1+a*Math.pow(t1,3)}`],answer:`y+${t1}x=${2*a*t1+a*Math.pow(t1,3)}`,answerLatex:`y+${t1}x=${2*a*t1+a*Math.pow(t1,3)}`,tip:`Normal to parabola at parameter t: y+tx=2at+at³. Memorize this — it appears constantly in JEE problems!`};}
    const a2=srI(n+2,3,6),b2=srI(n+3,1,a2-1);
    return{question:`Write the normal to x²/${a2*a2}+y²/${b2*b2}=1 at (x₁,y₁). State the formula.`,questionLatex:`\\text{Normal to }\\frac{x^2}{${a2*a2}}+\\frac{y^2}{${b2*b2}}=1\\text{ at }(x_1,y_1)`,steps:[`Tangent at (x₁,y₁): xx₁/${a2*a2}+yy₁/${b2*b2}=1`,`Tangent slope = −(b²x₁)/(a²y₁) = −${b2*b2}x₁/(${a2*a2}y₁)`,`Normal slope = a²y₁/(b²x₁) = ${a2*a2}y₁/(${b2*b2}x₁)`,`Normal equation: a²x/x₁−b²y/y₁=a²−b²`,`${a2*a2}x/x₁−${b2*b2}y/y₁=${a2*a2-b2*b2}=a²e²`],answer:`${a2*a2}x/x₁ − ${b2*b2}y/y₁ = ${a2*a2-b2*b2}`,answerLatex:`\\frac{${a2*a2}x}{x_1}-\\frac{${b2*b2}y}{y_1}=${a2*a2-b2*b2}`,tip:`Ellipse normal: a²x/x₁ − b²y/y₁ = a²−b² (=a²e²). Note MINUS in normal vs PLUS in tangent (xx₁/a²+yy₁/b²=1).`};
  },

  cs_chords:(n)=>{
    const t=n%3;const a=srI(n,1,5);
    if(t===0){const t1=srI(n+1,1,4);const t2=-1/t1;return{question:`For y²=${4*a}x, one end of a focal chord has parameter t₁=${t1}. Find t₂ and the other endpoint.`,questionLatex:`y^2=${4*a}x,\\;t_1=${t1}`,steps:[`Focal chord property: t₁t₂=−1`,`${t1}·t₂=−1 → t₂=−1/${t1}=${t2.toFixed(4)}`,`Point 1: (at₁²,2at₁)=(${a*t1*t1},${2*a*t1})`,`Point 2: (a/t₁², −2a/t₁)=(${(a/t1/t1).toFixed(2)},${(-2*a/t1).toFixed(2)})`,`Focal distance r₁=a(t₁²+1)=${a*(t1*t1+1)}`],answer:`t₂=−1/${t1}, endpoints (${a*t1*t1},${2*a*t1}) and (${(a/t1/t1).toFixed(2)},${(-2*a/t1).toFixed(2)})`,answerLatex:`t_2=-\\frac{1}{${t1}}`,tip:`Focal chord t₁t₂=−1 ALWAYS. One of the most important results for parabola problems.`};}
    if(t===1){const x1=srI(n+2,-5,-1),y1=srI(n+3,1,4);return{question:`Find the chord of contact from (${x1},${y1}) to y²=${4*a}x.`,questionLatex:`\\text{Chord of contact from }(${x1},${y1})\\text{ to }y^2=${4*a}x`,steps:[`Chord of contact = T=0 rule`,`For y²=4ax: T = yy₁−2a(x+x₁)=0`,`y·${y1}=2·${a}·(x+${x1})`,`${y1}y=${2*a}x+${2*a*x1}`],answer:`${y1}y=${2*a}x+${2*a*x1}`,answerLatex:`${y1}y=${2*a}x${2*a*x1>=0?'+':''}${2*a*x1}`,tip:`Chord of contact T=0: same formula as tangent but (x₁,y₁) is the external point, NOT a point on the conic.`};}
    const a2=srI(n+4,2,5),b2=srI(n+5,1,a2-1),x1=srI(n+6,0,3),y1=srI(n+7,1,4);
    const S1=(x1*x1/(a2*a2)+y1*y1/(b2*b2)-1);
    return{question:`Chord of x²/${a2*a2}+y²/${b2*b2}=1 bisected at (${x1},${y1}): find using T=S₁.`,questionLatex:`\\text{Midpoint }(${x1},${y1})\\text{ on }\\frac{x^2}{${a2*a2}}+\\frac{y^2}{${b2*b2}}=1`,steps:[`T=xx₁/a²+yy₁/b²−1 = x·${x1}/${a2*a2}+y·${y1}/${b2*b2}−1`,`S₁=x₁²/a²+y₁²/b²−1 = ${x1*x1}/${a2*a2}+${y1*y1}/${b2*b2}−1=${S1.toFixed(4)}`,`Set T=S₁: ${x1}x/${a2*a2}+${y1}y/${b2*b2}=${S1.toFixed(4)}+1=${(S1+1).toFixed(4)}`],answer:`${x1}x/${a2*a2}+${y1}y/${b2*b2}=${(S1+1).toFixed(3)}`,answerLatex:`\\frac{${x1}x}{${a2*a2}}+\\frac{${y1}y}{${b2*b2}}=${(S1+1).toFixed(3)}`,tip:`Chord bisected at P: T=S₁. This is one of the most elegant shortcuts in coordinate geometry.`};
  },

  cs_director:(n)=>{
    const t=n%2;const a=srI(n,3,7),b=srI(n+1,1,a-1);
    if(t===0){return{question:`Find the director circle of the ellipse x²/${a*a}+y²/${b*b}=1.`,questionLatex:`\\text{Director circle of }\\frac{x^2}{${a*a}}+\\frac{y^2}{${b*b}}=1`,steps:[`Director circle = locus of points from which perpendicular tangents can be drawn`,`Formula for ellipse: x²+y²=a²+b²`,`x²+y²=${a*a}+${b*b}=${a*a+b*b}`,`Center (0,0), radius=√${a*a+b*b}≈${Math.sqrt(a*a+b*b).toFixed(3)}`],answer:`x²+y²=${a*a+b*b}`,answerLatex:`x^2+y^2=${a*a+b*b}`,tip:`Ellipse director circle: x²+y²=a²+b². Always larger than the ellipse itself.`};}
    const a2=srI(n+2,1,5);
    return{question:`For parabola y²=${4*a2}x (a=${a2}): what is the locus of points from which two perpendicular tangents can be drawn?`,questionLatex:`y^2=${4*a2}x\\text{ — perpendicular tangent locus}`,steps:[`Parabola has no circular director locus`,`Slope tangent: y=mx+${a2}/m`,`For perpendicular tangents: m₁m₂=−1`,`Product of y-intercepts: (${a2}/m₁)(${a2}/m₂)=${a2*a2}/(m₁m₂)=${a2*a2}/(−1)=−${a2*a2}`,`Locus condition gives x=−${a2} (the directrix)`,`The directrix x=−${a2} is the 'director locus' for the parabola`],answer:`Directrix x=−${a2} (degenerate director locus — a line, not a circle)`,answerLatex:`x=-${a2}\\text{ (directrix = perpendicular tangent locus)}`,tip:`Parabola: perpendicular tangents always meet ON THE DIRECTRIX. No circular director circle exists.`};
  },

  cs_asymptotes:(n)=>{
    const t=n%2;const a=srI(n,2,6),b=srI(n+1,1,5);
    if(t===0){const angle=2*Math.atan(b/a)*180/Math.PI;return{question:`Find the asymptotes of x²/${a*a}−y²/${b*b}=1 and the angle between them.`,questionLatex:`\\frac{x^2}{${a*a}}-\\frac{y^2}{${b*b}}=1`,steps:[`Asymptotes: y=±(b/a)x = y=±(${b}/${a})x`,`Combined equation: x²/${a*a}−y²/${b*b}=0`,`Angle: tan(θ/2)=b/a=${b}/${a}`,`θ/2=arctan(${b}/${a})≈${(Math.atan(b/a)*180/Math.PI).toFixed(2)}°`,`Full angle θ≈${angle.toFixed(2)}°${a===b?' (rectangular: 90°)':''}`],answer:`y=±(${b}/${a})x, angle≈${angle.toFixed(1)}°`,answerLatex:`y=\\pm\\tfrac{${b}}{${a}}x,\\;\\theta\\approx${angle.toFixed(1)}^\\circ`,tip:`Asymptotes: y=±(b/a)x. For rectangular hyperbola (a=b): angle=90°.`};}
    const c2=srI(n+2,1,6);
    return{question:`For rectangular hyperbola xy=${c2*c2}: find e, a tangent at t=2, and verify xy=c².`,questionLatex:`xy=${c2*c2}`,steps:[`c=${c2}, e=√2 (always for rectangular hyperbola)`,`Point at t=2: (c·2, c/2)=(${2*c2},${c2/2})`,`Check: ${2*c2}·${c2/2}=${c2*c2} ✓`,`Tangent at (ct,c/t): x/t+ty=2c → x/2+2y=2·${c2}=${2*c2}`,`Tangent: x+4y=${4*c2}`],answer:`e=√2; tangent at t=2: x+4y=${4*c2}`,answerLatex:`e=\\sqrt{2};\\;x+4y=${4*c2}`,tip:`Rectangular hyperbola xy=c² tangent at (ct,c/t): x/t+ty=2c. Simplify by multiplying by t.`};
  },

  cs_conormal:(n)=>{
    const t=n%2;const a=srI(n,1,4);
    if(t===0){const h=srI(n+1,5,12),k=srI(n+2,1,5);return{question:`For y²=${4*a}x, find the cubic equation for normals through (${h},${k}).`,questionLatex:`y^2=${4*a}x,\\;\\text{point }(${h},${k})`,steps:[`Normal at (at²,2at): y+tx=2at+at³`,`Substitute (${h},${k}): ${k}+t·${h}=2·${a}·t+${a}·t³`,`${a}t³+(2·${a}−${h})t−${k}=0`,`${a}t³+${2*a-h}t−${k}=0`,`By Vieta: t₁+t₂+t₃=0 (no t² term)`],answer:`${a}t³+${2*a-h}t−${k}=0`,answerLatex:`${a}t^3+${2*a-h}t-${k}=0`,tip:`Normal cubic: at³+(2a−h)t−k=0. The t² coefficient is always ZERO, so t₁+t₂+t₃=0 by Vieta.`};}
    return{question:`Three normals from (h,k) to y²=4x (a=1) have parameter feet t₁,t₂,t₃. If t₁=1,t₂=2, find t₃.`,questionLatex:`y^2=4x,\\;t_1=1,\\;t_2=2\\Rightarrow t_3=?`,steps:[`Cubic: t³+(2−h)t−k=0 (a=1)`,`By Vieta: t₁+t₂+t₃=0`,`1+2+t₃=0`,`t₃=−3`,`Verify: centroid of feet: ȳ=2a(t₁+t₂+t₃)/3=2·1·0/3=0 (on axis ✓)`],answer:`t₃=−3`,answerLatex:`t_3=-3`,tip:`t₁+t₂+t₃=0 always. This is the most useful co-normal property.`};
  },

  cs_polar:(n)=>{
    const t=n%3;
    if(t===0){const r=srI(n,2,6),x1=srI(n+1,1,4),y1=srI(n+2,1,4);return{question:`Find the polar of (${x1},${y1}) w.r.t. x²+y²=${r*r}.`,questionLatex:`\\text{Polar of }(${x1},${y1})\\text{ w.r.t. }x^2+y^2=${r*r}`,steps:[`Polar of (x₁,y₁) w.r.t. x²+y²=r²: xx₁+yy₁=r²`,`x·${x1}+y·${y1}=${r*r}`,`${x1}x+${y1}y=${r*r}`],answer:`${x1}x+${y1}y=${r*r}`,answerLatex:`${x1}x+${y1}y=${r*r}`,tip:`Polar of (x₁,y₁) w.r.t. circle x²+y²=r² is xx₁+yy₁=r². Same T=0 formula as tangent/chord of contact.`};}
    if(t===1){const a=srI(n+3,3,6),b=srI(n+4,1,a-1),x1=srI(n+5,1,3),y1=srI(n+6,1,3);return{question:`Polar of (${x1},${y1}) w.r.t. ellipse x²/${a*a}+y²/${b*b}=1.`,questionLatex:`\\text{Polar of }(${x1},${y1})\\text{ w.r.t. }\\frac{x^2}{${a*a}}+\\frac{y^2}{${b*b}}=1`,steps:[`Polar: xx₁/a²+yy₁/b²=1`,`x·${x1}/${a*a}+y·${y1}/${b*b}=1`,`${x1}x/${a*a}+${y1}y/${b*b}=1`],answer:`${x1}x/${a*a}+${y1}y/${b*b}=1`,answerLatex:`\\frac{${x1}x}{${a*a}}+\\frac{${y1}y}{${b*b}}=1`,tip:`Polar w.r.t. ellipse = T=0 formula. If (x₁,y₁) is ON the ellipse, this is just the tangent there.`};}
    const r2=srI(n+7,2,5),x1=srI(n+8,r2+1,r2+4);
    return{question:`Find the pair of tangents from (${x1},0) to circle x²+y²=${r2*r2} using SS₁=T².`,questionLatex:`\\text{Tangents from }(${x1},0)\\text{ to }x^2+y^2=${r2*r2}`,steps:[`S=x²+y²−${r2*r2}`,`S₁=S(${x1},0)=${x1*x1}+0−${r2*r2}=${x1*x1-r2*r2}`,`T=x·${x1}+y·0−${r2*r2}=${x1}x−${r2*r2}`,`SS₁=T²: (x²+y²−${r2*r2})·${x1*x1-r2*r2}=(${x1}x−${r2*r2})²`],answer:`(x²+y²−${r2*r2})·${x1*x1-r2*r2}=(${x1}x−${r2*r2})²`,answerLatex:`(x^2+y^2-${r2*r2})\\cdot${x1*x1-r2*r2}=(${x1}x-${r2*r2})^2`,tip:`Pair of tangents: SS₁=T². This combined equation factors into both tangent lines.`};
  },

  cs_focusdirectrix:(n)=>{
    const t=n%2;
    if(t===0){const eN=srI(n,1,4),eD=srI(n+1,eN+1,eN+4);const e=eN/eD,a=srI(n+2,3,7);const b=Math.sqrt(a*a*(1-e*e));return{question:`Derive the ellipse (e=${eN}/${eD}, a=${a}) from PF/PM=e. Find b.`,questionLatex:`e=${eN}/${eD},\\;a=${a}`,steps:[`c=ae=${a}·${eN}/${eD}=${(a*eN/eD).toFixed(3)}`,`b²=a²(1−e²)=${a*a}·(1−(${eN}/${eD})²)=${a*a}·${(1-eN*eN/(eD*eD)).toFixed(4)}≈${(a*a*(1-eN*eN/(eD*eD))).toFixed(3)}`,`b≈${b.toFixed(3)}`],answer:`b≈${b.toFixed(3)}`,answerLatex:`b^2=${(a*a*(1-eN*eN/(eD*eD))).toFixed(2)},\\;b\\approx${b.toFixed(2)}`,tip:`Ellipse: b²=a²(1−e²). Hyperbola: b²=a²(e²−1). The formula differs only by the sign inside!`};}
    const a2=srI(n+3,1,5),t1=srI(n+4,1,4);
    return{question:`Verify PF=PM for (${a2*t1*t1},${2*a2*t1}) on y²=${4*a2}x (parameter t=${t1}).`,questionLatex:`P=(${a2*t1*t1},${2*a2*t1}),\\;y^2=${4*a2}x`,steps:[`a=${a2}, t=${t1}: P=(at²,2at)=(${a2*t1*t1},${2*a2*t1}) ✓`,`Focus F=(${a2},0), directrix x=−${a2}`,`PF=a(t²+1)=${a2}(${t1*t1}+1)=${a2*(t1*t1+1)}`,`PM=x+a=${a2*t1*t1}+${a2}=${a2*(t1*t1+1)}`,`PF=PM=${a2*(t1*t1+1)} ✓ → e=1 confirmed`],answer:`PF=PM=${a2*(t1*t1+1)} ✓`,answerLatex:`PF=PM=${a2*(t1*t1+1)}\\;\\checkmark`,tip:`Key shortcut: focal distance of (at²,2at) on y²=4ax is r=a(t²+1). Memorize this.`};
  },

  cs_pascal:(n)=>{return{question:`State Pascal's Theorem and identify the three collinear points for hexagon ABCDEF inscribed in a conic.`,questionLatex:`\\text{Pascal's Theorem}`,steps:[`Pascal's Theorem (1640):`,`If hexagon ABCDEF is INSCRIBED in any conic section,`,`then the three pairwise intersections of OPPOSITE SIDES are COLLINEAR:`,`P₁ = AB ∩ DE`,`P₂ = BC ∩ EF`,`P₃ = CD ∩ FA`,`These three points P₁,P₂,P₃ lie on the PASCAL LINE`],answer:`P₁=AB∩DE, P₂=BC∩EF, P₃=CD∩FA — all collinear on the Pascal line`,answerLatex:`AB\\cap DE,\\;BC\\cap EF,\\;CD\\cap FA\\text{ are collinear}`,tip:`Opposite sides in hexagon ABCDEF: (AB,DE), (BC,EF), (CD,FA). Pairs skip one side.`};},

  cs_brianchon:(n)=>{return{question:`State Brianchon's Theorem and explain its duality with Pascal's theorem.`,questionLatex:`\\text{Brianchon's Theorem}`,steps:[`Brianchon's Theorem (1810):`,`If hexagon ABCDEF is CIRCUMSCRIBED about a conic (all 6 sides tangent),`,`then the three MAIN DIAGONALS AD, BE, CF are CONCURRENT`,`at the BRIANCHON POINT`,`Duality with Pascal:`,`Pascal: INSCRIBED hexagon → 3 opposite-side intersections COLLINEAR`,`Brianchon: CIRCUMSCRIBED hexagon → 3 main diagonals CONCURRENT`,`Replace: point↔line, inscribed↔circumscribed, collinear↔concurrent`],answer:`AD, BE, CF concurrent at Brianchon point; dual of Pascal's theorem`,answerLatex:`AD\\cap BE\\cap CF=\\text{Brianchon point}`,tip:`Pascal and Brianchon are projective duals. Switch 'inscribed' ↔ 'circumscribed' and 'collinear' ↔ 'concurrent'.`};},

  cs_duality:(n)=>{
    const t=n%2;
    if(t===0){const r=srI(n,2,6),x1=srI(n+1,0,3),y1=srI(n+2,0,3);return{question:`Find the pole of the line ${x1}x+${y1}y=${r*r} with respect to circle x²+y²=${r*r}.`,questionLatex:`\\text{Pole of }${x1}x+${y1}y=${r*r}\\text{ w.r.t. }x^2+y^2=${r*r}`,steps:[`Polar of (h,k) w.r.t. x²+y²=r²: hx+ky=r²`,`Match ${x1}x+${y1}y=${r*r} with hx+ky=r²=${r*r}`,`h=${x1}, k=${y1}`,`Pole=(${x1},${y1})`],answer:`Pole=(${x1},${y1})`,answerLatex:`\\text{Pole}=(${x1},${y1})`,tip:`Pole-polar duality: polar of (h,k) w.r.t. x²+y²=r² is hx+ky=r². Reverse-engineer the line to find the pole.`};}
    return{question:`Prove: P lies on polar of Q ↔ Q lies on polar of P (reciprocal property). Use circle x²+y²=r².`,questionLatex:`P\\in\\text{polar}(Q)\\Leftrightarrow Q\\in\\text{polar}(P)`,steps:[`Let P=(x₁,y₁) and Q=(x₂,y₂)`,`Polar of Q: xx₂+yy₂=r²`,`P lies on this: x₁x₂+y₁y₂=r² ···①`,`Polar of P: xx₁+yy₁=r²`,`Q lies on this: x₂x₁+y₂y₁=r² ···②`,`①=② (both equal r²) → symmetric relation ✓`],answer:`x₁x₂+y₁y₂=r² is the symmetric condition (same for both)`,answerLatex:`x_1x_2+y_1y_2=r^2\\Leftrightarrow P\\in\\text{polar}(Q)\\Leftrightarrow Q\\in\\text{polar}(P)`,tip:`The reciprocal property follows from the symmetry of the dot product: x₁x₂+y₁y₂ = x₂x₁+y₂y₁.`};
  },

  cs_homothety:(n)=>{
    const t=n%2;const a=srI(n,2,5),b=srI(n+1,1,a);
    if(t===0){return{question:`Transformation (x,y)→(${a}x,${b}y) applied to unit circle x²+y²=1. Find the image curve.`,questionLatex:`(x,y)\\to(${a}x,${b}y):\\;x^2+y^2=1`,steps:[`Let X=${a}x, Y=${b}y → x=X/${a}, y=Y/${b}`,`Substitute into x²+y²=1:`,`(X/${a})²+(Y/${b})²=1`,`X²/${a*a}+Y²/${b*b}=1`,`This is an ellipse with semi-major a=${a}, semi-minor b=${b}`],answer:`x²/${a*a}+y²/${b*b}=1 (ellipse)`,answerLatex:`\\frac{x^2}{${a*a}}+\\frac{y^2}{${b*b}}=1`,tip:`Homothety (x,y)→(ax,by) maps unit circle to ellipse x²/a²+y²/b². All ellipses come from circles this way!`};}
    const k=srI(n+2,2,6);
    return{question:`Inversion about origin maps circle x²+y²−${k}x=0 (passes through origin). Find its image.`,questionLatex:`x^2+y^2-${k}x=0\\text{ under inversion}`,steps:[`Circle x²+y²=${k}x passes through origin (set x=y=0: 0=0 ✓)`,`Under inversion (x,y)→(X,Y)=(x/(x²+y²),y/(x²+y²))`,`Inverse map: x=X/(X²+Y²), y=Y/(X²+Y²)`,`Substitute: X²/(X²+Y²)+Y²/(X²+Y²)−${k}X/(X²+Y²)=0`,`Multiply by (X²+Y²): 1−${k}X=0 → X=1/${k}`,`Image: vertical line x=1/${k}`],answer:`Image is the line x=1/${k}`,answerLatex:`x=\\frac{1}{${k}}\\;(\\text{vertical line})`,tip:`Key inversion rule: circle through the center of inversion → a line (not through center). Beautiful result!`};
  },

  cs_intersections:(n)=>{
    const t=n%2;
    if(t===0){const r1=srI(n,2,5),r2=srI(n+1,1,r1-1),d=srI(n+2,0,r1+r2);const lo=Math.abs(r1-r2),hi=r1+r2;const pts=d<lo?'0 real':d===lo||d===hi?'1 (tangent)':'2 real';return{question:`Two circles: r₁=${r1}, r₂=${r2}, centre distance d=${d}. Count real intersections.`,questionLatex:`r_1=${r1},\\;r_2=${r2},\\;d=${d}`,steps:[`Condition: |r₁−r₂| < d < r₁+r₂ → 2 real intersections`,`|r₁−r₂|=|${r1}−${r2}|=${lo}`,`r₁+r₂=${hi}`,`d=${d}: ${lo<d&&d<hi?`${lo}<${d}<${hi} → 2 intersections`:d===lo||d===hi?`boundary d=${d} → tangent (1)`:d<lo?`d<${lo} → one inside other → 0`:`d>${hi} → separate → 0`}`],answer:`${pts}`,answerLatex:`\\text{${pts}}`,tip:`|r₁−r₂|<d<r₁+r₂: 2 intersections. d=|r₁−r₂| or r₁+r₂: tangent. Otherwise: 0.`};}
    const a2=srI(n+3,1,4),b2=srI(n+4,1,4),c1=srI(n+5,1,9),c2=srI(n+6,-8,8);
    return{question:`Find the radical axis of S₁: x²+y²=${c1} and S₂: x²+y²+${2*a2}x+${2*b2}y+${c2}=0.`,questionLatex:`S_1: x^2+y^2=${c1},\\;S_2: x^2+y^2+${2*a2}x+${2*b2}y+${c2}=0`,steps:[`Radical axis: S₁−S₂=0`,`S₁=x²+y²−${c1}`,`S₂=x²+y²+${2*a2}x+${2*b2}y+${c2}`,`S₁−S₂=−${c1}−${2*a2}x−${2*b2}y−${c2}=0`,`${-2*a2}x+${-2*b2}y=${c1+c2}`],answer:`${-2*a2}x+${-2*b2}y=${c1+c2}`,answerLatex:`${-2*a2}x${-2*b2>=0?'+':''}${-2*b2}y=${c1+c2}`,tip:`Radical axis S₁−S₂=0 cancels all x² and y² terms, leaving a LINEAR equation. It's always a straight line.`};
  },
};

// ── Quiz Generators ───────────────────────────────────────────
function shuffle(arr,seed){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(sr(seed*i+i)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

const QUIZ_GENERATORS = {
  cs_cone:(n)=>{const T=[(s)=>{const types=['Circle','Ellipse','Parabola','Hyperbola'];const eVs=['0','0.6','1','1.8'];const i=srI(s,0,3);return{q:`Eccentricity e=${eVs[i]}. Which conic?`,opts:shuffle(types,s),correct:types[i],tip:`e=0:circle, 0<e<1:ellipse, e=1:parabola, e>1:hyperbola.`};},(s)=>{return{q:`A plane parallel to ONE generator of a cone produces:`,opts:shuffle(['Parabola','Circle','Ellipse','Hyperbola'],s+1),correct:'Parabola',tip:`Parallel to one generator → e=1 → parabola. The 'boundary' conic.`};},(s)=>{return{q:`Cutting plane perpendicular to the cone's axis gives:`,opts:shuffle(['Circle','Parabola','Ellipse','Hyperbola'],s+2),correct:'Circle',tip:`Perpendicular to axis → e=0 → circle (all cross-section points equidistant from axis).`};},(s)=>{return{q:`A plane that cuts BOTH nappes of a double cone forms:`,opts:shuffle(['Hyperbola','Parabola','Ellipse','Circle'],s+3),correct:'Hyperbola',tip:`Cutting both nappes (upper and lower cones) → two separate branches → hyperbola (e>1).`};}];const t=T[n%T.length](n*67+13);return t;},

  cs_circle:(n)=>{const T=[(s)=>{const h=srI(s,-3,3),k=srI(s+1,-3,3),r=srI(s+2,1,5);const hs=h<0?`+${Math.abs(h)}`:h>0?`-${h}`:'';const ks=k<0?`+${Math.abs(k)}`:k>0?`-${k}`:'';return{q:`Center (${h},${k}), radius ${r}. Standard form?`,opts:shuffle([`(x${hs})\u00B2+(y${ks})\u00B2=${r*r}`,`(x${hs})\u00B2+(y${ks})\u00B2=${r}`,`(x+${h})\u00B2+(y+${k})\u00B2=${r*r}`,`x\u00B2+y\u00B2=${r*r}`],s+3),correct:`(x${hs})\u00B2+(y${ks})\u00B2=${r*r}`,tip:`Standard form: (x-h)²+(y-k)²=r². Right side is r²=${r*r}, not r.`};},(s)=>{const g=srI(s+4,-3,3),f=srI(s+5,-3,3);return{q:`Center of x²+y²+${2*g}x+${2*f}y+…=0?`,opts:shuffle([`(-${g},-${f})`,`(${g},${f})`,`(${2*g},${2*f})`,`(0,0)`],s+6),correct:`(-${g},-${f})`,tip:`Center=(−g,−f). Extract g and f by halving the linear coefficients.`};},(s)=>{return{q:`Eccentricity of a circle is:`,opts:shuffle(['0','1','< 1','Undefined'],s+7),correct:'0',tip:`Circle e=0. No focus-directrix in the usual sense (all points equidistant from center).`};},(s)=>{const x1=srI(s+8,-3,0),y1=srI(s+9,-2,2),x2=srI(s+10,1,4),y2=srI(s+11,-2,2);return{q:`Circle with diameter A(${x1},${y1}) to B(${x2},${y2}). Center?`,opts:shuffle([`(${(x1+x2)/2},${(y1+y2)/2})`,`(${x1},${y1})`,`(${x2},${y2})`,`(0,0)`],s+12),correct:`(${(x1+x2)/2},${(y1+y2)/2})`,tip:`Center = midpoint of diameter = ((${x1}+${x2})/2,(${y1}+${y2})/2).`};}];const t=T[n%T.length](n*71+17);return t;},

  cs_parabola:(n)=>{const T=[(s)=>{const a=srI(s,1,6);return{q:`Focus of y²=${4*a}x?`,opts:shuffle([`(${a},0)`,`(-${a},0)`,`(0,${a})`,`(0,-${a})`],s+1),correct:`(${a},0)`,tip:`y²=4ax: focus=(a,0). Compare 4a=${4*a} to get a=${a}.`};},(s)=>{const a=srI(s+2,1,5);return{q:`Directrix of x²=${4*a}y (upward parabola)?`,opts:shuffle([`y=-${a}`,`y=${a}`,`x=-${a}`,`x=${a}`],s+3),correct:`y=-${a}`,tip:`x²=4ay (opens up): directrix y=−a=−${a}.`};},(s)=>{const a=srI(s+4,1,6);return{q:`Length of latus rectum of y²=${4*a}x?`,opts:shuffle([`${4*a}`,`${2*a}`,`${a}`,`${8*a}`],s+5),correct:`${4*a}`,tip:`LR=4a=${4*a} for any parabola.`};},(s)=>{return{q:`Eccentricity of a parabola is ALWAYS:`,opts:shuffle(['1','0','0.5','>1'],s+6),correct:'1',tip:`Parabola: e=1 by definition. This is the ONLY conic with exactly e=1.`};}];const t=T[n%T.length](n*73+19);return t;},

  cs_ellipse:(n)=>{const T=[(s)=>{const a=srI(s,3,7),b=srI(s+1,1,a-1);const c2=a*a-b*b;return{q:`c²=? for ellipse x²/${a*a}+y²/${b*b}=1.`,opts:shuffle([c2,a*a+b*b,a*b,a*a-b].filter((v,i,ar)=>ar.indexOf(v)===i).slice(0,4),s+2),correct:c2,tip:`Ellipse: c²=a²−b² (MINUS). Compare with hyperbola c²=a²+b² (PLUS).`};},(s)=>{return{q:`Sum of focal distances PF₁+PF₂ for any point on ellipse x²/a²+y²/b²=1?`,opts:shuffle(['2a','2b','2c','a+b'],s+3),correct:'2a',tip:`Defining property of ellipse: PF₁+PF₂=2a (constant=major axis length).`};},(s)=>{const a=srI(s+4,3,7),b=srI(s+5,1,a-1);const lr=(2*b*b/a).toFixed(2);return{q:`Latus rectum of x²/${a*a}+y²/${b*b}=1?`,opts:shuffle([lr,`${(a*a/b).toFixed(2)}`,`${(2*b).toFixed(2)}`,`${(b*b/a).toFixed(2)}`].filter((v,i,ar)=>ar.indexOf(v)===i).slice(0,4),s+6),correct:lr,tip:`Ellipse LR=2b²/a=2·${b*b}/${a}=${lr}.`};},(s)=>{return{q:`For vertical ellipse x²/b²+y²/a²=1 (a>b): foci are on:`,opts:shuffle(['y-axis at (0,±c)','x-axis at (±c,0)','Origin','Both axes'],s+7),correct:'y-axis at (0,±c)',tip:`Vertical ellipse: larger denominator under y² → foci on y-axis at (0,±c).`};}];const t=T[n%T.length](n*79+23);return t;},

  cs_hyperbola:(n)=>{const T=[(s)=>{const a=srI(s,2,5),b=srI(s+1,1,5);return{q:`Asymptotes of x²/${a*a}−y²/${b*b}=1?`,opts:shuffle([`y=\u00B1(${b}/${a})x`,`y=\u00B1(${a}/${b})x`,`y=\u00B1${a}x`,`x=\u00B1${b}`],s+2),correct:`y=\u00B1(${b}/${a})x`,tip:`Asymptotes y=±(b/a)x. It's b/a (not a/b). Compare with the equation where b² is under y².`};},(s)=>{return{q:`Eccentricity of rectangular hyperbola xy=c²?`,opts:shuffle(['√2','2','1','√3'],s+3),correct:'√2',tip:`Rectangular hyperbola: a=b → e=√(a²+b²)/a=√(2a²)/a=√2.`};},(s)=>{const a=srI(s+4,2,5),b=srI(s+5,1,5);return{q:`c² for hyperbola x²/${a*a}−y²/${b*b}=1?`,opts:shuffle([a*a+b*b,a*a-b*b,a*b,a*a].filter((v,i,ar)=>ar.indexOf(v)===i).slice(0,4),s+6),correct:a*a+b*b,tip:`Hyperbola: c²=a²+b²=${a*a}+${b*b}=${a*a+b*b}. PLUS sign (unlike ellipse which has MINUS).`};},(s)=>{return{q:`Conjugate hyperbola −x²/a²+y²/b²=1 has:`,opts:shuffle(['Same asymptotes as the original','Different asymptotes','No asymptotes','Asymptotes y=±(a/b)x'],s+7),correct:'Same asymptotes as the original',tip:`Both hyperbola and its conjugate share IDENTICAL asymptotes y=±(b/a)x. Key result!`};}];const t=T[n%T.length](n*83+29);return t;},

  cs_elements:(n)=>{const T=[(s)=>{const a=srI(s,2,8);return{q:`Latus rectum of y²=${4*a}x?`,opts:shuffle([`${4*a}`,`${2*a}`,`${a}`,`${a/2}`].filter((v,i,ar)=>ar.indexOf(v)===i).slice(0,4),s+1),correct:`${4*a}`,tip:`LR of parabola y²=4ax is 4a=${4*a}.`};},(s)=>{const types=['0','0.6','1','1.5'];const names=['Circle','Ellipse','Parabola','Hyperbola'];const i=srI(s+2,0,3);return{q:`e=${types[i]} → which conic?`,opts:shuffle(names,s+3),correct:names[i],tip:`e=0:circle, 0<e<1:ellipse, e=1:parabola, e>1:hyperbola.`};},(s)=>{const a=srI(s+4,3,7),b=srI(s+5,1,a-1);const lr=2*b*b/a;return{q:`LR of hyperbola x²/${a*a}−y²/${b*b}=1?`,opts:shuffle([lr.toFixed(2),(2*a*a/b).toFixed(2),(2*b).toFixed(2),(b*b/a).toFixed(2)].filter((v,i,ar)=>ar.indexOf(v)===i).slice(0,4),s+6),correct:lr.toFixed(2),tip:`Hyperbola LR=2b²/a=2·${b*b}/${a}=${lr.toFixed(2)}. SAME formula as ellipse.`};},(s)=>{return{q:`The latus rectum passes through:`,opts:shuffle(['The focus, perpendicular to the axis','The center','The directrix','A vertex'],s+7),correct:'The focus, perpendicular to the axis',tip:`Latus rectum: chord through FOCUS, PERPENDICULAR to principal axis.`};}];const t=T[n%T.length](n*89+31);return t;},

  cs_general:(n)=>{const T=[(s)=>{return{q:`h²=ab and Δ≠0 → conic is:`,opts:shuffle(['Parabola','Circle','Ellipse','Hyperbola'],s),correct:'Parabola',tip:`h²=ab: parabola. h²<ab: ellipse/circle. h²>ab: hyperbola. Always check Δ≠0 for non-degenerate.`};},(s)=>{const a=srI(s+1,1,5);return{q:`a=b=${a}, h=0, Δ≠0 in ax²+2hxy+by²+…=0. Conic is:`,opts:shuffle(['Circle','Ellipse','Parabola','Hyperbola'],s+2),correct:'Circle',tip:`h=0 AND a=b → circle (if Δ≠0). Equal diagonal coefficients, no xy term.`};},(s)=>{return{q:`When Δ=0: the conic is:`,opts:shuffle(['Degenerate (pair of lines / point)','Parabola','Rectangular hyperbola','Circle'],s+3),correct:'Degenerate (pair of lines / point)',tip:`Δ=0 → degenerate: pair of real/imaginary lines, point, or empty. Non-zero Δ gives real conic.`};},(s)=>{return{q:`h²>ab AND a+b=0, Δ≠0. Conic is:`,opts:shuffle(['Rectangular hyperbola','Parabola','Circle','Ellipse'],s+4),correct:'Rectangular hyperbola',tip:`h²>ab: hyperbola. Additionally a+b=0 → asymptotes perpendicular → rectangular hyperbola.`};}];const t=T[n%T.length](n*97+37);return t;},

  cs_classify:(n)=>{const T=[(s)=>{return{q:`x²+4xy+4y²+…=0. h=2, a=1, b=4. h²=4, ab=4. Conic is:`,opts:shuffle(['Parabola (h²=ab)','Ellipse (h²<ab)','Hyperbola (h²>ab)','Circle'],s),correct:'Parabola (h²=ab)',tip:`h=2→h²=4; ab=1·4=4; h²=ab=4 → parabola (check Δ≠0).`};},(s)=>{return{q:`x²−y²+4x−6y=0: a=1, b=−1. a+b=?`,opts:shuffle(['0','2','−2','Undefined'],s+1),correct:'0',tip:`a=1, b=−1: a+b=0 → rectangular hyperbola. Also h=0, ab=−1<0=h²: h²>ab ✓.`};},(s)=>{const a=srI(s+2,1,4),b=srI(s+3,1,4),h2=srI(s+4,0,1);const ab=a*b;const h=Math.floor(Math.sqrt(ab*(h2===0?0.5:1.5)));return{q:`a=${a},b=${b},h=${h}. Classify: h²=${h*h}, ab=${ab}.`,opts:shuffle([h*h<ab?'Ellipse/Circle':h*h===ab?'Parabola':'Hyperbola','Circle','Pair of lines','Unknown'],s+5),correct:h*h<ab?'Ellipse/Circle':h*h===ab?'Parabola':'Hyperbola',tip:`h²=${h*h} vs ab=${ab}: ${h*h<ab?'h²<ab→ellipse':h*h===ab?'h²=ab→parabola':'h²>ab→hyperbola'}.`};},(s)=>{return{q:`For ax²+2hxy+by²=0 to represent two REAL lines: condition?`,opts:shuffle(['h²≥ab (real if h²>ab, coincident if h²=ab)','h²<ab','h²=0','ab>0'],s+6),correct:'h²≥ab (real if h²>ab, coincident if h²=ab)',tip:`Homogeneous: real lines iff h²≥ab. h²>ab: two distinct real lines. h²=ab: coincident lines. h²<ab: imaginary.`};}];const t=T[n%T.length](n*101+41);return t;},

  cs_tangents:(n)=>{const T=[(s)=>{const a=srI(s,1,5),m=srI(s+1,1,4);return{q:`Slope tangent to y²=${4*a}x with slope m=${m}?`,opts:shuffle([`y=${m}x+${a/m}`,`y=${m}x+${m/a}`,`y=${m}x-${a/m}`,`y=${m}x`],s+2),correct:`y=${m}x+${a/m}`,tip:`Parabola y²=4ax: y=mx+a/m. Here a=${a},m=${m}: y=${m}x+${a/m}.`};},(s)=>{return{q:`Condition for y=mx+c to touch y²=4ax?`,opts:shuffle(['c=a/m','c=am','c²=am','c=m/a'],s+3),correct:'c=a/m',tip:`Parabola tangency: c=a/m. The y-intercept must equal a/m.`};},(s)=>{const a=srI(s+4,2,5),b=srI(s+5,1,a-1),m=srI(s+6,1,3);const val=a*a*m*m+b*b;return{q:`Tangent to x²/${a*a}+y²/${b*b}=1 with slope m=${m}: y=mx±?`,opts:shuffle([`√${val}`,`√${a*a-b*b*m*m}`,`${a*m}+${b}`,`√${a*a+b*b}`].filter((v,i,ar)=>ar.indexOf(v)===i).slice(0,4),s+7),correct:`√${val}`,tip:`Ellipse: y=mx±√(a²m²+b²)=mx±√(${a*a}·${m*m}+${b*b})=mx±√${val}.`};},(s)=>{return{q:`T=0 rule: x² in conic → ?`,opts:shuffle(['xx₁','x·x₁/2','x²₁','x+x₁'],s+8),correct:'xx₁',tip:`T rule: x²→xx₁, y²→yy₁, 2x→x+x₁, 2y→y+y₁, 2xy→xy₁+x₁y.`};}];const t=T[n%T.length](n*103+43);return t;},

  cs_normals:(n)=>{const T=[(s)=>{const a=srI(s,1,4),t1=srI(s+1,1,3);return{q:`Normal to y²=${4*a}x at parameter t=${t1}: y+${t1}x=?`,opts:shuffle([2*a*t1+a*t1**3,2*a*t1,a*t1**3,2*a+a*t1].filter((v,i,ar)=>ar.indexOf(v)===i).slice(0,4),s+2),correct:2*a*t1+a*t1**3,tip:`Normal at t: y+tx=2at+at³=${2*a*t1}+${a*t1**3}=${2*a*t1+a*t1**3}.`};},(s)=>{return{q:`Max normals from external point to parabola y²=4ax?`,opts:shuffle(['3','2','4','1'],s+3),correct:'3',tip:`Normal cubic at³+(2a-h)t-k=0 has at most 3 real roots → at most 3 normals.`};},(s)=>{return{q:`Normal to ellipse x²/a²+y²/b²=1 at (x₁,y₁)?`,opts:shuffle(['a²x/x₁−b²y/y₁=a²−b²','a²x/x₁+b²y/y₁=1','x/x₁+y/y₁=1','ax−by=1'],s+4),correct:'a²x/x₁−b²y/y₁=a²−b²',tip:`Ellipse normal: a²x/x₁−b²y/y₁=a²−b². Note MINUS (compare tangent: xx₁/a²+yy₁/b²=1 has PLUS).`};},(s)=>{return{q:`Normal to parabola y²=4x (a=1) at t=2: y+2x=?`,opts:shuffle(['12','4','8','16'],s+5),correct:'12',tip:`y+tx=2at+at³. a=1,t=2: y+2x=2(1)(2)+1(8)=4+8=12.`};}];const t=T[n%T.length](n*107+47);return t;},

  cs_chords:(n)=>{const T=[(s)=>{return{q:`Focal chord of parabola: t₁=3 → t₂=?`,opts:shuffle(['-1/3','-3','1/3','3'],s),correct:'-1/3',tip:`t₁t₂=−1 always for focal chord. t₂=−1/3.`};},(s)=>{return{q:`Chord of contact from external point: equation is?`,opts:shuffle(['T=0','S=0','T=S₁','S₁=0'],s+1),correct:'T=0',tip:`Chord of contact T=0. Chord bisected at point T=S₁. Different conditions!`};},(s)=>{return{q:`Chord of ellipse bisected at (x₁,y₁): equation?`,opts:shuffle(['T=S₁','T=0','S=0','T²=S'],s+2),correct:'T=S₁',tip:`Chord bisected at midpoint P: T=S₁ (T evaluated gives S₁ when applied at P).`};},(s)=>{const a=srI(s+3,1,5);return{q:`Focal distance of point (at²,2at) on y²=${4*a}x from focus?`,opts:shuffle([`a(t²+1)`,`at²`,`2at`,`a(t²-1)`],s+4),correct:`a(t²+1)`,tip:`Focal distance r=a(t²+1) for point (at²,2at). This is a key formula.`};}];const t=T[n%T.length](n*109+53);return t;},

  cs_director:(n)=>{const T=[(s)=>{const a=srI(s,3,7),b=srI(s+1,1,a-1);return{q:`Director circle of x²/${a*a}+y²/${b*b}=1?`,opts:shuffle([`x²+y²=${a*a+b*b}`,`x²+y²=${a*a-b*b}`,`x²+y²=${a*b}`,`x²+y²=${a+b}`],s+2),correct:`x²+y²=${a*a+b*b}`,tip:`Ellipse director circle: x²+y²=a²+b²=${a*a}+${b*b}=${a*a+b*b}.`};},(s)=>{return{q:`Perpendicular tangents to parabola y²=4ax meet on:`,opts:shuffle(['Directrix x=−a','Director circle','Focus','Vertex'],s+3),correct:'Directrix x=−a',tip:`For parabola: perpendicular tangents always intersect ON the directrix. No circular director locus.`};},(s)=>{const r=srI(s+4,2,7);return{q:`Director circle of x²+y²=${r*r} has equation:`,opts:shuffle([`x²+y²=${2*r*r}`,`x²+y²=${r*r}`,`x²+y²=${4*r*r}`,`x²+y²=${r}`],s+5),correct:`x²+y²=${2*r*r}`,tip:`Circle x²+y²=r²: director circle x²+y²=2r². Radius becomes r√2.`};},(s)=>{return{q:`Points on the director circle of an ellipse send tangents that are:`,opts:shuffle(['Perpendicular (90° between them)','Parallel','Equal length','Tangent to a second ellipse'],s+6),correct:'Perpendicular (90° between them)',tip:`Definition: director circle = locus of points from which perpendicular tangents can be drawn.`};}];const t=T[n%T.length](n*113+59);return t;},

  cs_asymptotes:(n)=>{const T=[(s)=>{const a=srI(s,2,5),b=srI(s+1,1,4);return{q:`Asymptotes of x²/${a*a}−y²/${b*b}=1 pass through:`,opts:shuffle(['Origin (0,0)',`(${a},0)`,`(0,${b})`,'Foci'],s+2),correct:'Origin (0,0)',tip:`Asymptotes y=±(b/a)x always pass through origin (centre of hyperbola).`};},(s)=>{return{q:`Rectangular hyperbola xy=c²: asymptotes are:`,opts:shuffle(['Coordinate axes x=0, y=0','Lines y=±x','Lines y=±cx','Circles'],s+3),correct:'Coordinate axes x=0, y=0',tip:`xy=c²: asymptotes are the coordinate axes (x=0 and y=0). Graph approaches but never touches axes.`};},(s)=>{return{q:`Conjugate hyperbola −x²/a²+y²/b²=1 and x²/a²−y²/b²=1 share:`,opts:shuffle(['Same asymptotes y=±(b/a)x','Different asymptotes','No asymptotes','Perpendicular asymptotes only'],s+4),correct:'Same asymptotes y=±(b/a)x',tip:`Both conjugate hyperbolas have IDENTICAL asymptotes. Key property of conjugate pairs.`};},(s)=>{return{q:`Angle between asymptotes of rectangular hyperbola x²−y²=a²?`,opts:shuffle(['90°','45°','60°','30°'],s+5),correct:'90°',tip:`a=b for rectangular: asymptotes y=±x are perpendicular (angle 90°).`};}];const t=T[n%T.length](n*127+61);return t;},

  cs_conormal:(n)=>{const T=[(s)=>{return{q:`Sum of parameters t₁+t₂+t₃ of co-normal points on y²=4ax?`,opts:shuffle(['0','1','−1','k/a'],s),correct:'0',tip:`Vieta: cubic at³+(2a−h)t−k=0 has no t² term → sum of roots = 0.`};},(s)=>{return{q:`Max normals to ellipse from external point?`,opts:shuffle(['4','3','2','Infinite'],s+1),correct:'4',tip:`Normal equation for ellipse gives a 4th-degree equation → at most 4 real normals.`};},(s)=>{return{q:`t₁=1,t₂=2 are two co-normal parameters on y²=4x. Find t₃.`,opts:shuffle(['−3','3','1','−1'],s+2),correct:'−3',tip:`t₁+t₂+t₃=0 → 1+2+t₃=0 → t₃=−3.`};},(s)=>{return{q:`Circle through 3 co-normal points of parabola y²=4ax passes through:`,opts:shuffle(['Vertex (0,0)','Focus (a,0)','Centre of latus rectum','Only if specific (h,k)'],s+3),correct:'Vertex (0,0)',tip:`Classical result: circle through 3 co-normal points of parabola ALWAYS passes through vertex (0,0).`};}];const t=T[n%T.length](n*131+67);return t;},

  cs_polar:(n)=>{const T=[(s)=>{const r=srI(s,2,6),x1=srI(s+1,1,4),y1=srI(s+2,1,4);return{q:`Polar of (${x1},${y1}) w.r.t. x²+y²=${r*r}?`,opts:shuffle([`${x1}x+${y1}y=${r*r}`,`${x1}x−${y1}y=${r*r}`,`x/${x1}+y/${y1}=${r}`,`${r*r}x+${r*r}y=1`],s+3),correct:`${x1}x+${y1}y=${r*r}`,tip:`Polar of (x₁,y₁) w.r.t. x²+y²=r²: xx₁+yy₁=r².`};},(s)=>{return{q:`If P lies on polar of Q, then:`,opts:shuffle(['Q lies on polar of P','P=Q','Polars are parallel','P is on the conic'],s+4),correct:'Q lies on polar of P',tip:`Reciprocal property: P∈polar(Q) ↔ Q∈polar(P). Symmetric (harmonic) relation.`};},(s)=>{return{q:`Pair of tangents from (x₁,y₁) to conic S=0:`,opts:shuffle(['SS₁=T²','T=S₁','S=T','T²=0'],s+5),correct:'SS₁=T²',tip:`Pair of tangents: SS₁=T². Combined equation of BOTH tangent lines from external point.`};},(s)=>{return{q:`Polar of a point LYING ON the conic is:`,opts:shuffle(['The tangent at that point','The normal','The chord of contact','The axis'],s+6),correct:'The tangent at that point',tip:`If P is ON conic S=0, its polar (T=0) is the tangent at P. Elegant unification!`};}];const t=T[n%T.length](n*137+71);return t;},

  cs_focusdirectrix:(n)=>{const T=[(s)=>{return{q:`PF/PM=e. If e=1, the conic is:`,opts:shuffle(['Parabola','Ellipse','Hyperbola','Circle'],s),correct:'Parabola',tip:`e=1: PF=PM (equidistant from focus and directrix) → parabola.`};},(s)=>{const eN=srI(s+1,1,4),eD=srI(s+2,eN+1,eN+3);return{q:`e=${eN}/${eD} (since ${eN}<${eD}): conic is?`,opts:shuffle(['Ellipse','Hyperbola','Parabola','Circle'],s+3),correct:'Ellipse',tip:`${eN}/${eD} < 1 → e<1 → ellipse.`};},(s)=>{return{q:`b²=a²(1−e²) applies to:`,opts:shuffle(['Ellipse only (e<1)','Hyperbola (e>1)','Parabola (e=1)','All conics'],s+4),correct:'Ellipse only (e<1)',tip:`b²=a²(1−e²) for ELLIPSE. Hyperbola: b²=a²(e²−1). Parabola: no b in standard form.`};},(s)=>{return{q:`Focal distance of point (at²,2at) on parabola y²=4ax?`,opts:shuffle(['a(t²+1)','at²','2at','a(t+1)²'],s+5),correct:'a(t²+1)',tip:`r=a(t²+1). Verify: PF=a(t²+1), PM=at²+a=a(t²+1). So PF=PM ✓.`};}];const t=T[n%T.length](n*139+73);return t;},

  cs_pascal:(n)=>{const T=[(s)=>{return{q:`Pascal's theorem: hexagon ABCDEF inscribed in conic. 3 collinear points are intersections of:`,opts:shuffle(['Opposite sides AB∩DE, BC∩EF, CD∩FA','Adjacent sides','Diagonals','Altitudes'],s),correct:'Opposite sides AB∩DE, BC∩EF, CD∩FA',tip:`Opposite sides: (AB,DE), (BC,EF), (CD,FA). Their pairwise intersections are collinear.`};},(s)=>{return{q:`When two adjacent vertices A=B in the inscribed hexagon, side AB becomes:`,opts:shuffle(['Tangent at A','Normal at A','Chord AB','Directrix'],s+1),correct:'Tangent at A',tip:`Degenerate Pascal: A→B means AB is the tangent at A. Used to construct tangents to conics.`};},(s)=>{return{q:`Pascal's theorem holds for:`,opts:shuffle(['All conics (circle, ellipse, parabola, hyperbola)','Circles only','Ellipses only','Non-degenerate conics only'],s+2),correct:'All conics (circle, ellipse, parabola, hyperbola)',tip:`Pascal is a projective theorem valid for ALL conics. For degenerate case (two lines), it reduces to Pappus' theorem.`};},(s)=>{return{q:`How many distinct Pascal lines arise from a hexagon inscribed in a conic?`,opts:shuffle(['60','6','15','30'],s+3),correct:'60',tip:`6 vertices → 60 distinct orderings as ABCDEF → 60 distinct Pascal lines (each giving a different triple of collinear points).`};}];const t=T[n%T.length](n*141+79);return t;},

  cs_brianchon:(n)=>{const T=[(s)=>{return{q:`Brianchon: hexagon circumscribed about conic. Which are concurrent?`,opts:shuffle(['Main diagonals AD, BE, CF','Opposite sides','Altitudes','Perpendicular bisectors'],s),correct:'Main diagonals AD, BE, CF',tip:`Brianchon: CIRCUMSCRIBED hexagon → 3 MAIN DIAGONALS concurrent at Brianchon point.`};},(s)=>{return{q:"Brianchon's theorem is the projective dual of:",opts:shuffle(["Pascal's theorem","Menelaus' theorem","Ceva's theorem","Pappus' theorem"],s+1),correct:"Pascal's theorem",tip:`Duality: Pascal (inscribed→collinear) ↔ Brianchon (circumscribed→concurrent). Replace point↔line.`};},(s)=>{return{q:`Circumscribed hexagon has all 6 sides:`,opts:shuffle(['Tangent to the conic','Passing through focus','Equal in length','On the conic'],s+2),correct:'Tangent to the conic',tip:`Circumscribed = all 6 SIDES tangent to conic. Inscribed = all 6 VERTICES on conic.`};},(s)=>{return{q:`Brianchon point is the pole of which line?`,opts:shuffle(['Pascal line (w.r.t. the conic)','Directrix','Axis','Tangent at vertex'],s+3),correct:'Pascal line (w.r.t. the conic)',tip:`Projective duality: Brianchon point = pole of corresponding Pascal line w.r.t. the conic.`};}];const t=T[n%T.length](n*143+83);return t;},

  cs_duality:(n)=>{const T=[(s)=>{return{q:`P∈polar(Q) implies:`,opts:shuffle(['Q∈polar(P)','P=Q','Polars are perpendicular','P is the pole'],s),correct:'Q∈polar(P)',tip:`Reciprocal: P on polar of Q ↔ Q on polar of P. Perfect symmetry.`};},(s)=>{return{q:`Cross-ratio (A,B;P,Q)=−1 means P,Q are:`,opts:shuffle(['Harmonic conjugates of A,B','Midpoints of AB','Reflections','Foci'],s+1),correct:'Harmonic conjugates of A,B',tip:`(A,B;P,Q)=−1 → harmonic range. P divides AB in ratio λ internally, Q divides it in ratio λ externally.`};},(s)=>{return{q:`Projective duality: 'collinear points' maps to:`,opts:shuffle(['Concurrent lines','Parallel lines','Intersecting lines','Perpendicular lines'],s+2),correct:'Concurrent lines',tip:`Duality: collinear points ↔ concurrent lines. This converts Pascal ↔ Brianchon.`};},(s)=>{return{q:`Self-polar triangle: each vertex is:`,opts:shuffle(['Pole of opposite side','On the conic','Focus','Midpoint of opposite side'],s+3),correct:'Pole of opposite side',tip:`Self-polar: vertex A = pole of side BC. The 3 vertices are mutually polar w.r.t. the conic.`};}];const t=T[n%T.length](n*149+89);return t;},

  cs_homothety:(n)=>{const T=[(s)=>{const a=srI(s,2,6),b=srI(s+1,1,a);return{q:`(x,y)→(${a}x,${b}y) maps x²+y²=1 to:`,opts:shuffle([`x²/${a*a}+y²/${b*b}=1`,`x²/${a}+y²/${b}=1`,`${a}x²+${b}y²=1`,`x²+y²=${a*a}`],s+2),correct:`x²/${a*a}+y²/${b*b}=1`,tip:`Substitute X=${a}x,Y=${b}y: (X/${a})²+(Y/${b})²=1 → X²/${a*a}+Y²/${b*b}=1 (ellipse).`};},(s)=>{return{q:`Inversion maps a circle through the center of inversion to:`,opts:shuffle(['A line (not through center)','Another circle','An ellipse','Itself'],s+3),correct:'A line (not through center)',tip:`Key inversion rule: circle THROUGH O → line (not through O). Circle NOT through O → circle.`};},(s)=>{return{q:`A line through the center of inversion maps under inversion to:`,opts:shuffle(['Itself (same line)','A circle','A parallel line','A parabola'],s+4),correct:'Itself (same line)',tip:`Lines through the center of inversion map to themselves. They are fixed lines of the inversion.`};},(s)=>{return{q:`All conics are related by:`,opts:shuffle(['Projective transformations (preserve cross-ratio)','Rigid motions only','Translations only','Reflections only'],s+5),correct:'Projective transformations (preserve cross-ratio)',tip:`All conics are projectively equivalent — you can transform any conic to any other via a projective map.`};}];const t=T[n%T.length](n*151+97);return t;},

  cs_intersections:(n)=>{const T=[(s)=>{return{q:`By Bézout's theorem, two conics (degree 2) intersect in at most:`,opts:shuffle(['4 points','2 points','6 points','8 points'],s),correct:'4 points',tip:`Bézout: degree 2 × degree 2 = 4 intersection points (over ℂ in projective plane, with multiplicity).`};},(s)=>{return{q:`Radical axis of two circles is always:`,opts:shuffle(['A straight line','A circle','A parabola','A point'],s+1),correct:'A straight line',tip:`Radical axis S₁−S₂=0 cancels x² and y² terms → always a LINEAR equation → straight line.`};},(s)=>{return{q:`Family S+λS'=0 (λ∈ℝ) passes through:`,opts:shuffle(['All intersection points of S=0 and S\'=0','Only S=0','Only S\'=0','No intersections'],s+2),correct:'All intersection points of S=0 and S\'=0',tip:`Any conic in family S+λS'=0 passes through ALL common points of S and S'. Varying λ sweeps through the family.`};},(s)=>{return{q:`A tangent counts as how many intersection points (multiplicity)?`,opts:shuffle(['2 (double point)','1','3','0'],s+3),correct:'2 (double point)',tip:`Tangent at P: the line meets the conic at P with multiplicity 2 (double root). Bézout: 1×2=2 total.`};}];const t=T[n%T.length](n*157+101);return t;},
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
  const floaters=['y²=4ax','e=c/a','x²/a²+y²/b²','xy=c²','T=0','Δ','Pascal','Bézout','PF=e·PM','t₁t₂=-1'];
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',background:`radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.09) 0%, transparent 65%), #07090f`,textAlign:'center'}}>
      {floaters.map((s,i)=>(
        <div key={s} style={{position:'fixed',pointerEvents:'none',fontSize:14+(i%3)*7,color:`rgba(6,182,212,${0.04+(i%4)*0.02})`,top:`${8+i*9}%`,left:i%2===0?`${2+i*4}%`:`${72+i*2}%`,fontFamily:'JetBrains Mono,monospace',animation:`pulse ${3+i*0.6}s ease-in-out infinite`,animationDelay:`${i*0.25}s`}}>{s}</div>
      ))}
      <div style={{opacity:phase>=1?1:0,transform:phase>=1?'translateY(0)':'translateY(12px)',transition:'all 0.6s ease',marginBottom:20,display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',background:'rgba(6,182,212,0.08)',border:'1px solid rgba(6,182,212,0.25)',borderRadius:40}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:ACCENT,animation:'pulse 2s ease-in-out infinite'}}/>
        <span style={{fontSize:12,color:ACCENT,letterSpacing:'2px',textTransform:'uppercase',fontFamily:'Crimson Pro, serif'}}>Mathematics · Chapter 11</span>
      </div>
      <div style={{opacity:phase>=2?1:0,transform:phase>=2?'translateY(0)':'translateY(20px)',transition:'all 0.7s ease 0.1s',marginBottom:28}}>
        <h1 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:'clamp(32px, 10vw, 84px)',color:'#fff',letterSpacing:'-3px',lineHeight:0.92,marginBottom:0}}>
          Conic<br/><span style={{color:ACCENT}}>Sections</span>
        </h1>
        <div style={{height:3,width:80,background:`linear-gradient(90deg, ${ACCENT}, transparent)`,margin:'16px auto 0',borderRadius:2}}/>
      </div>
      <div style={{opacity:phase>=3?1:0,transition:'all 0.6s ease',maxWidth:560,marginBottom:40}}>
        <p style={{fontFamily:'Crimson Pro, serif',fontSize:19,color:'rgba(255,255,255,0.7)',lineHeight:1.55,marginBottom:18,fontStyle:'italic'}}>
          "A conic section is the most perfect curve — born where a plane meets infinity in the shape of a cone, and found again in every orbit, lens, and parabolic dish."
        </p>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 24px',textAlign:'left'}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:12,fontFamily:'JetBrains Mono, monospace'}}>Chapter Overview</div>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:'rgba(255,255,255,0.6)',lineHeight:1.75}}>
            From geometric derivations of circles, parabolas, ellipses, and hyperbolas — through standard equations, eccentricity, foci, and latus rectum — to general second-degree classification via the Δ determinant, tangent/normal forms, chord and polar theory — culminating in Pascal's theorem, Brianchon's theorem, projective duality, and Bézout's intersections.
          </p>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginTop:20}}>
          {['Class 11 → Olympiad','21 Topics','∞ Practice','Quiz-Gated Progress'].map(t=>(
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
    {title:'Circle — Standard, General & Diameter Forms',color:ACCENT,rows:NOTATION.slice(0,3)},
    {title:'Parabola, Ellipse, Hyperbola & Eccentricity',color:'#22D3EE',rows:NOTATION.slice(3,11)},
    {title:'General Equation, Δ Discriminant & Classification',color:'#F97316',rows:NOTATION.slice(11,15)},
    {title:'Tangents, Chords, Polars & Focus-Directrix',color:'#A855F7',rows:NOTATION.slice(15)},
  ];
  return (
    <div style={{minHeight:'100vh',background:'#07090f',padding:'32px 16px 60px'}}>
      <div style={{maxWidth:680,margin:'0 auto'}}>
        <div style={{marginBottom:32,opacity:revealed?1:0,transition:'opacity 0.5s ease'}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'2px',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>Before We Begin</div>
          <h2 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:34,color:'#fff',letterSpacing:'-1px',marginBottom:10}}>Notation Guide</h2>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:16,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>These symbols span the full landscape — from the standard circle and parabola through eccentricity, the Δ discriminant, T=0 tangent rules, chord theory, and the projective theorems of Pascal, Brianchon, and Bézout.</p>
        </div>
        {groups.map((g,gi)=>(
          <div key={g.title} style={{marginBottom:24,opacity:revealed?1:0,transform:revealed?'translateY(0)':'translateY(16px)',transition:`all 0.5s ease ${gi*0.1+0.2}s`}}>
            <div style={{fontSize:11,color:g.color,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:20,height:2,background:g.color,borderRadius:1}}/>{g.title}
            </div>
            <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden'}}>
              {g.rows.map((row,ri)=>(
                <div key={ri} style={{display:'grid',gridTemplateColumns:'120px 1fr 1fr',borderBottom:ri<g.rows.length-1?'1px solid rgba(255,255,255,0.05)':'none',padding:'10px 16px',alignItems:'center',gap:8}}>
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
  const levels=['Foundation','Advanced','Extreme Pro','Infinity'];
  const lColors={Foundation:ACCENT,Advanced:'#F97316','Extreme Pro':'#A855F7',Infinity:'#EAB308'};
  const lDesc={Foundation:'Class 11 · Core Conic Forms',Advanced:'JEE Mains · General Forms & Tangency','Extreme Pro':'JEE Advanced · Analytical Geometry',Infinity:'Olympiad · Projective Geometry'};
  return (
    <div style={{minHeight:'100vh',background:'#07090f',padding:'28px 16px 60px'}}>
      <div style={{maxWidth:660,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'2px',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>Chapter · Conic Sections</div>
          <h2 style={{fontFamily:'Playfair Display, serif',fontWeight:900,fontSize:30,color:'#fff',letterSpacing:'-0.8px',marginBottom:6}}>Choose a Topic</h2>
          <p style={{fontFamily:'Crimson Pro, serif',fontSize:15,color:'rgba(255,255,255,0.4)',marginBottom:14}}>Pass the quiz gate to unlock each next topic.</p>
          <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:4,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(completedIds.size/SECTIONS.length)*100}%`,background:`linear-gradient(90deg,${ACCENT},#A855F7,#EAB308)`,borderRadius:4,transition:'width 0.5s ease'}}/>
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
                    <div style={{width:40,height:40,borderRadius:10,background:done?`${lColors[level]}25`:locked?'rgba(255,255,255,0.05)':`${lColors[level]}15`,border:`1px solid ${done?lColors[level]+'55':locked?'rgba(255,255,255,0.08)':`${lColors[level]}30`}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:locked?20:13,color:done?lColors[level]:locked?'rgba(255,255,255,0.2)':lColors[level],fontFamily:'JetBrains Mono,monospace',flexShrink:0,letterSpacing:'-1px'}}>
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
  const lColors={Foundation:ACCENT,Advanced:'#F97316','Extreme Pro':'#A855F7',Infinity:'#EAB308'};
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
              <div style={{width:56,height:56,borderRadius:14,background:`${col}15`,border:`1px solid ${col}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:col,fontFamily:'JetBrains Mono,monospace',flexShrink:0,letterSpacing:'-1px'}}>{section.icon}</div>
              <p style={{fontFamily:'Playfair Display, serif',fontSize:18,color:'#fff',fontStyle:'italic',lineHeight:1.5}}>"{section.shortDef}"</p>
            </div>
            {section.diagram==='circle'&&(
              <div style={{marginBottom:22,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:16,overflowX:'auto'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',textAlign:'center',marginBottom:10,textTransform:'uppercase',letterSpacing:'1px'}}>Example: (x−1)²+(y−2)²=9 and x²+y²−4x+6y−3=0</div>
                <CircleSVG h={1} k={2} r={3} color={col} size={320}/>
              </div>
            )}
            {section.diagram==='parabola'&&(
              <div style={{marginBottom:22,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:16,overflowX:'auto'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',textAlign:'center',marginBottom:10,textTransform:'uppercase',letterSpacing:'1px'}}>Example: y²=8x (right) and x²=8y (up), a=2</div>
                <ParabolaSVG a={2} vertical={false} color={col} size={320}/>
                <div style={{height:12}}/>
                <ParabolaSVG a={2} vertical={true} color={col} size={320}/>
              </div>
            )}
            {section.diagram==='ellipse'&&(
              <div style={{marginBottom:22,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:16,overflowX:'auto'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',textAlign:'center',marginBottom:10,textTransform:'uppercase',letterSpacing:'1px'}}>Example: x²/25+y²/9=1 (a=5, b=3, c=4, e=0.8)</div>
                <EllipseSVG a={5} b={3} color={col} size={320}/>
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
  const lColors={Foundation:ACCENT,Advanced:'#F97316','Extreme Pro':'#A855F7',Infinity:'#EAB308'};
  const col=lColors[section.level]||ACCENT;
  const gen=GENERATORS[section.genKey]||GENERATORS.cs_cone;
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
  const lColors={Foundation:ACCENT,Advanced:'#F97316','Extreme Pro':'#A855F7',Infinity:'#EAB308'};
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
  const quizGen=QUIZ_GENERATORS[section.genKey]||QUIZ_GENERATORS.cs_cone;
  const qSeed=baseSeed+qIdx*113;
  const question=useCallback(()=>{
    let q;let tries=0;
    do{try{q=quizGen(qSeed+tries*7);}catch{q=null;}tries++;}while((!q||!q.q||!q.opts||q.opts.length<2)&&tries<10);
    if(!q||!q.q)return{q:`Eccentricity of a parabola is always:`,opts:['1','0','<1','>1'],correct:'1',tip:'Parabola: e=1 always.'};
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
              <defs><radialGradient id="failGC" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EF4444" stopOpacity="0.25"/><stop offset="100%" stopColor="#EF4444" stopOpacity="0"/></radialGradient></defs>
              <circle cx="36" cy="36" r="36" fill="url(#failGC)"/>
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

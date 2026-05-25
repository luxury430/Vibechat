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
const ACCENT = '#38BDF8';
function gcd(a,b){return b===0?Math.abs(a):gcd(b,a%b);}
function fmtF(n,d){if(!d)return String(n);const g=gcd(Math.abs(n),Math.abs(d));const sn=n/g,sd=d/g;return sd===1?String(sn):`${sn}/${sd}`;}

// ── 3D Coordinate Axes SVG ─────────────────────────────────────
function CoordAxesSVG({ color=ACCENT, size=320 }) {
  const W=size, H=Math.round(size*0.56);
  const cx=W*0.44, cy=H*0.62;
  const len=Math.min(W,H)*0.34;
  const ix=len*0.866, iy=len*0.5;
  const jy=-len;
  const kx=-len*0.866, ky=len*0.5;
  const tx=0.52, ty=0.58, tz=0.32;
  const Px=cx+ix*tx+kx*tz, Py=cy+iy*tx+jy*ty+ky*tz;
  const Pxz_x=cx+ix*tx+kx*tz, Pxz_y=cy+iy*tx+ky*tz;
  const Pxy_x=cx+ix*tx, Pxy_y=cy+iy*tx;
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      <polygon points={`${cx},${cy} ${cx+ix},${cy+iy} ${cx+ix+kx},${cy+iy+ky} ${cx+kx},${cy+ky}`} fill={`${color}09`} stroke={`${color}20`} strokeWidth={0.8}/>
      <line x1={Pxz_x} y1={Pxz_y} x2={Px} y2={Py} stroke="rgba(255,255,255,0.13)" strokeWidth={1} strokeDasharray="4,3"/>
      <line x1={Pxy_x} y1={Pxy_y} x2={Pxz_x} y2={Pxz_y} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4,3"/>
      <line x1={cx} y1={cy} x2={cx+ix} y2={cy+iy} stroke="#F87171" strokeWidth={2.5} strokeLinecap="round"/>
      <polygon points={`${cx+ix+5},${cy+iy+3} ${cx+ix-6},${cy+iy-4} ${cx+ix-4},${cy+iy+6}`} fill="#F87171"/>
      <text x={cx+ix+11} y={cy+iy+5} fontSize={13} fill="#F87171" fontFamily="JetBrains Mono,monospace" fontWeight="bold">X</text>
      <line x1={cx} y1={cy} x2={cx} y2={cy+jy} stroke="#4ADE80" strokeWidth={2.5} strokeLinecap="round"/>
      <polygon points={`${cx},${cy+jy-1} ${cx-5},${cy+jy+9} ${cx+5},${cy+jy+9}`} fill="#4ADE80"/>
      <text x={cx+7} y={cy+jy-4} fontSize={13} fill="#4ADE80" fontFamily="JetBrains Mono,monospace" fontWeight="bold">Y</text>
      <line x1={cx} y1={cy} x2={cx+kx} y2={cy+ky} stroke="#60A5FA" strokeWidth={2.5} strokeLinecap="round"/>
      <polygon points={`${cx+kx-5},${cy+ky+3} ${cx+kx+7},${cy+ky-4} ${cx+kx+5},${cy+ky+6}`} fill="#60A5FA"/>
      <text x={cx+kx-20} y={cy+ky+5} fontSize={13} fill="#60A5FA" fontFamily="JetBrains Mono,monospace" fontWeight="bold">Z</text>
      <circle cx={Px} cy={Py} r={4.5} fill={color} stroke="rgba(255,255,255,0.6)" strokeWidth={1.5}/>
      <text x={Px+8} y={Py-3} fontSize={10} fill={color} fontFamily="JetBrains Mono,monospace">P(x,y,z)</text>
      <circle cx={cx} cy={cy} r={3.5} fill="rgba(255,255,255,0.75)"/>
      <text x={cx+5} y={cy+13} fontSize={9} fill="rgba(255,255,255,0.4)" fontFamily="JetBrains Mono,monospace">O</text>
      <text x={W/2} y={H-4} textAnchor="middle" fontSize={9} fill={`${color}88`} fontFamily="JetBrains Mono,monospace">3D Coordinate System · Isometric View</text>
    </svg>
  );
}

// ── Plane SVG ─────────────────────────────────────────────────
function PlaneSVG({ color=ACCENT, size=320 }) {
  const W=size, H=Math.round(size*0.56);
  const cx=W*0.44, cy=H*0.62;
  const len=Math.min(W,H)*0.34;
  const ix=len*0.866, iy=len*0.5;
  const jy=-len;
  const kx=-len*0.866, ky=len*0.5;
  const ax=cx+ix*0.72, ay=cy+iy*0.72;
  const bx=cx, by=cy+jy*0.72;
  const zx_=cx+kx*0.72, zy_=cy+ky*0.72;
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      <line x1={cx} y1={cy} x2={cx+ix} y2={cy+iy} stroke="#F8717150" strokeWidth={1.5}/>
      <line x1={cx} y1={cy} x2={cx} y2={cy+jy} stroke="#4ADE8050" strokeWidth={1.5}/>
      <line x1={cx} y1={cy} x2={cx+kx} y2={cy+ky} stroke="#60A5FA50" strokeWidth={1.5}/>
      <text x={cx+ix+8} y={cy+iy+5} fontSize={10} fill="#F87171" fontFamily="JetBrains Mono,monospace">X</text>
      <text x={cx+7} y={cy+jy} fontSize={10} fill="#4ADE80" fontFamily="JetBrains Mono,monospace">Y</text>
      <text x={cx+kx-16} y={cy+ky+5} fontSize={10} fill="#60A5FA" fontFamily="JetBrains Mono,monospace">Z</text>
      <polygon points={`${ax},${ay} ${bx},${by} ${zx_},${zy_}`} fill={`${color}1a`} stroke={color} strokeWidth={1.8} strokeDasharray="5,3"/>
      <circle cx={ax} cy={ay} r={3.5} fill={color}/>
      <circle cx={bx} cy={by} r={3.5} fill={color}/>
      <circle cx={zx_} cy={zy_} r={3.5} fill={color}/>
      <text x={ax+7} y={ay+4} fontSize={9} fill={color} fontFamily="JetBrains Mono,monospace">x-int</text>
      <text x={bx+5} y={by-4} fontSize={9} fill={color} fontFamily="JetBrains Mono,monospace">y-int</text>
      <text x={zx_-28} y={zy_+4} fontSize={9} fill={color} fontFamily="JetBrains Mono,monospace">z-int</text>
      <circle cx={cx} cy={cy} r={3} fill="rgba(255,255,255,0.6)"/>
      <text x={W/2} y={H-4} textAnchor="middle" fontSize={9} fill={`${color}88`} fontFamily="JetBrains Mono,monospace">Plane: x/a + y/b + z/c = 1</text>
    </svg>
  );
}

// ── Trophy SVG ────────────────────────────────────────────────
function TrophySVG({ col=ACCENT }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgG3" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={col} stopOpacity="0.25"/><stop offset="100%" stopColor={col} stopOpacity="0"/></radialGradient>
        <linearGradient id="trG3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#38BDF8"/><stop offset="50%" stopColor="#818CF8"/><stop offset="100%" stopColor="#F472B6"/></linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#bgG3)"/>
      <circle cx="36" cy="36" r="32" fill="none" stroke={col} strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M24 18 h24 l-4 20 Q36 44 36 44 Q36 44 28 38 Z" fill="url(#trG3)" opacity="0.95"/>
      <path d="M24 22 Q16 22 16 30 Q16 36 24 36" fill="none" stroke="url(#trG3)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 22 Q56 22 56 30 Q56 36 48 36" fill="none" stroke="url(#trG3)" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="33" y="44" width="6" height="8" rx="1" fill="#818CF8" opacity="0.9"/>
      <rect x="27" y="52" width="18" height="4" rx="2" fill="url(#trG3)"/>
      <polygon points="36,21 37.5,25.5 42,25.5 38.5,28 40,32.5 36,30 32,32.5 33.5,28 30,25.5 34.5,25.5" fill="#E0F2FE" opacity="0.95"/>
    </svg>
  );
}


// ── Notation ──────────────────────────────────────────────────
const NOTATION = [
  {sym:'(x,y,z)',name:'Ordered Triple',meaning:'Unique spatial address — one value per axis',ex:'P=(2,-1,3)'},
  {sym:'d=\\sqrt{\\Delta x^2+\\Delta y^2+\\Delta z^2}',name:'3D Distance Formula',meaning:'Distance between two points; 3D Pythagoras',ex:'d((0,0,0),(1,2,2))=3'},
  {sym:'P=\\tfrac{mB+nA}{m+n}',name:'Internal Section Formula',meaning:'Divides AB in ratio m:n from A',ex:'P=\\left(\\tfrac{mx_2+nx_1}{m+n},\\ldots\\right)'},
  {sym:'P=\\tfrac{mB-nA}{m-n}',name:'External Section Formula',meaning:'Divides AB externally in ratio m:n',ex:'\\text{Outside segment AB}'},
  {sym:'G=\\tfrac{A+B+C}{3}',name:'Centroid of Triangle',meaning:'Mean of three vertex position vectors',ex:'G=\\left(\\tfrac{\\sum x_i}{3},\\tfrac{\\sum y_i}{3},\\tfrac{\\sum z_i}{3}\\right)'},
  {sym:'G=\\tfrac{A+B+C+D}{4}',name:'Centroid of Tetrahedron',meaning:'Mean of four vertex position vectors',ex:'\\text{Medians meet here in ratio }3:1'},
  {sym:'l^2+m^2+n^2=1',name:'DC Identity',meaning:'Direction cosines form a unit vector',ex:'l=\\cos\\alpha,m=\\cos\\beta,n=\\cos\\gamma'},
  {sym:'l=\\tfrac{a}{\\sqrt{a^2+b^2+c^2}}',name:'DC from DR',meaning:'Normalise direction ratios to get DCs',ex:'(1,2,2)\\to(\\tfrac{1}{3},\\tfrac{2}{3},\\tfrac{2}{3})'},
  {sym:'\\vec{r}=\\vec{a}+\\lambda\\vec{b}',name:'Vector Line Equation',meaning:'Line through a with direction b; λ free',ex:'\\vec{r}=(1,0,2)+\\lambda(2,-1,3)'},
  {sym:'\\tfrac{x-x_1}{a}=\\tfrac{y-y_1}{b}=\\tfrac{z-z_1}{c}',name:'Cartesian Symmetric Form',meaning:'Line through (x₁,y₁,z₁) with DRs a,b,c',ex:'\\tfrac{x-1}{2}=\\tfrac{y+3}{-1}=\\tfrac{z}{4}'},
  {sym:'SD=\\tfrac{|(\\vec{a}_2-\\vec{a}_1)\\cdot(\\vec{b}_1\\times\\vec{b}_2)|}{|\\vec{b}_1\\times\\vec{b}_2|}',name:'Shortest Distance (Skew)',meaning:'Min gap between non-coplanar lines',ex:'SD=0\\Leftrightarrow\\text{coplanar}'},
  {sym:'\\vec{r}\\cdot\\vec{n}=d',name:'Vector Plane Equation',meaning:'Plane with normal n at distance from origin',ex:'\\vec{r}\\cdot(0,1,0)=5\\Leftrightarrow y=5'},
  {sym:'ax+by+cz+d=0',name:'General Cartesian Plane',meaning:'Normal vector is (a,b,c)',ex:'2x-y+3z-6=0'},
  {sym:'\\tfrac{x}{p}+\\tfrac{y}{q}+\\tfrac{z}{r}=1',name:'Intercept Form',meaning:'Intercepts p,q,r on X,Y,Z axes',ex:'\\text{Points }(p,0,0),(0,q,0),(0,0,r)'},
  {sym:'\\cos\\theta=\\tfrac{|\\vec{n}_1\\cdot\\vec{n}_2|}{|\\vec{n}_1||\\vec{n}_2|}',name:'Angle Between Planes',meaning:'Via dot product of normals',ex:'n_1\\perp n_2\\Rightarrow\\theta=90°'},
  {sym:'\\sin\\theta=\\tfrac{|\\vec{b}\\cdot\\vec{n}|}{|\\vec{b}||\\vec{n}|}',name:'Line-Plane Angle',meaning:'Sine of inclination from plane',ex:'\\vec{b}\\perp\\vec{n}\\Rightarrow\\theta=0'},
  {sym:'F=P-t(a,b,c)',name:'Foot of Perpendicular',meaning:'t=-(ax+by+cz+d)/(a²+b²+c²)',ex:'F\\text{ lies on the plane}'},
  {sym:'I=2F-P',name:'Mirror Image',meaning:'Reflection across plane; F is midpoint of PI',ex:'|PI|=2\\cdot\\text{dist}(P,\\text{plane})'},
  {sym:'(\\vec{a}_2-\\vec{a}_1)\\cdot(\\vec{b}_1\\times\\vec{b}_2)=0',name:'Coplanarity Condition',meaning:'Lines coplanar iff this STP = 0',ex:'\\det[\\Delta\\vec{a},\\vec{b}_1,\\vec{b}_2]=0'},
  {sym:'P_1+\\lambda P_2=0',name:'Family of Planes',meaning:'All planes through intersection line of P₁=0, P₂=0',ex:'\\lambda\\in\\mathbb{R}'},
  {sym:'(x-a)^2+(y-b)^2+(z-c)^2=r^2',name:'Sphere Equation',meaning:'Locus at distance r from centre (a,b,c)',ex:'x^2+y^2+z^2=25'},
  {sym:'[\\vec{a},\\vec{b},\\vec{c}]=\\vec{a}\\cdot(\\vec{b}\\times\\vec{c})',name:'Scalar Triple Product',meaning:'3×3 det; |STP|=parallelepiped volume',ex:'[\\vec{a},\\vec{b},\\vec{c}]=0\\Leftrightarrow\\text{coplanar}'},
];

// ── Sections ──────────────────────────────────────────────────
const SECTIONS = [
  {id:'g3d_axes',title:'Three-Dimensional Coordinate Axes',level:'Foundation',color:'#38BDF8',icon:'XYZ',
   shortDef:"Three mutually perpendicular axes X,Y,Z meet at O=(0,0,0). Any point is (x,y,z). Three coordinate planes: XY(z=0), YZ(x=0), XZ(y=0).",
   fullDef:"3D geometry adds a Z axis perpendicular to both X and Y. Point P=(x,y,z) is located by moving x units along X, y along Y, z along Z. The three axes define coordinate planes: XY-plane (z=0), YZ-plane (x=0), XZ-plane (y=0). Distance from origin: d=√(x²+y²+z²). A point lies on a coordinate plane when one coordinate is 0.",
   keyFacts:[{text:'Three mutually perpendicular axes',l:'X,Y,Z\\text{ meet at }O=(0,0,0)'},{text:'Three coordinate planes',l:'XY(z=0),\\;YZ(x=0),\\;XZ(y=0)'},{text:'Any point in 3D space',l:'P=(x,y,z)\\text{ — ordered triple}'},{text:'Distance from origin',l:'d(O,P)=\\sqrt{x^2+y^2+z^2}'},{text:'One coord=0 → on coord plane',l:'(a,0,c)\\in XZ\\text{-plane}'}],
   genKey:'g3d_axes',diagram:'axes3d'},
  {id:'g3d_octants',title:'The Eight Octants',level:'Foundation',color:'#7DD3FC',icon:'±±±',
   shortDef:"Three coordinate planes divide space into 8 octants. Octant I=(+,+,+). Sign pattern (±,±,±) of (x,y,z) determines octant.",
   fullDef:"Three coordinate planes (XY,YZ,XZ) create 8 octants. NCERT: I(+,+,+),II(-,+,+),III(-,-,+),IV(+,-,+),V(+,+,-),VI(-,+,-),VII(-,-,-),VIII(+,-,-). A point with one zero coordinate lies on a coordinate plane boundary. Adjacent octants differ in one sign.",
   keyFacts:[{text:'3 planes create 8 octants',l:'2^3=8\\text{ sign combinations}'},{text:'Octant I',l:'x>0,y>0,z>0\\;(+,+,+)'},{text:'Key four octants',l:'\\text{I}(+,+,+),\\text{II}(-,+,+),\\text{III}(-,-,+),\\text{IV}(+,-,+)'},{text:'On boundary: one coord=0',l:'z=0\\Rightarrow\\text{on XY-plane}'},{text:'Neighbours differ in one sign',l:'\\text{I neighbours: II, IV, V}'}],
   genKey:'g3d_octants'},
  {id:'g3d_distance',title:'Spatial Distance Formula',level:'Foundation',color:'#BAE6FD',icon:'d(P,Q)',
   shortDef:"d=√((x₂-x₁)²+(y₂-y₁)²+(z₂-z₁)²). Distance to coordinate planes: |x|, |y|, |z|. For P=(k,k,k): d=k√3.",
   fullDef:"Distance between P₁=(x₁,y₁,z₁) and P₂=(x₂,y₂,z₂): d=√((x₂-x₁)²+(y₂-y₁)²+(z₂-z₁)²). Distance to YZ-plane=|x|, to XZ-plane=|y|, to XY-plane=|z|. Midpoint M=average of coordinates. For P=(k,k,k): d=k√3 from origin.",
   keyFacts:[{text:'3D distance formula',l:'d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}'},{text:'Distance to origin',l:'d(O,P)=\\sqrt{x^2+y^2+z^2}'},{text:'To coordinate planes',l:'\\text{to YZ}=|x|,\\;\\text{to XZ}=|y|,\\;\\text{to XY}=|z|'},{text:'P=(k,k,k)',l:'d(O,P)=k\\sqrt{3}'},{text:'Midpoint',l:'M=\\left(\\tfrac{x_1+x_2}{2},\\tfrac{y_1+y_2}{2},\\tfrac{z_1+z_2}{2}\\right)'}],
   genKey:'g3d_distance'},
  {id:'g3d_section',title:'Section Formula in 3D',level:'Foundation',color:'#0EA5E9',icon:'m:n',
   shortDef:"Internal: P=((mx₂+nx₁)/(m+n),…). External: minus signs. Midpoint: m=n=1.",
   fullDef:"Internal division of AB in ratio m:n: P=((mx₂+nx₁)/(m+n),(my₂+ny₁)/(m+n),(mz₂+nz₁)/(m+n)). External: P=((mx₂-nx₁)/(m-n),…). Midpoint: M=((x₁+x₂)/2,(y₁+y₂)/2,(z₁+z₂)/2).",
   keyFacts:[{text:'Internal section',l:'P=\\left(\\tfrac{mx_2+nx_1}{m+n},\\tfrac{my_2+ny_1}{m+n},\\tfrac{mz_2+nz_1}{m+n}\\right)'},{text:'External section',l:'P=\\left(\\tfrac{mx_2-nx_1}{m-n},\\tfrac{my_2-ny_1}{m-n},\\tfrac{mz_2-nz_1}{m-n}\\right)'},{text:'Midpoint (ratio 1:1)',l:'M=\\left(\\tfrac{x_1+x_2}{2},\\tfrac{y_1+y_2}{2},\\tfrac{z_1+z_2}{2}\\right)'},{text:'Internal: P between A and B',l:'\\text{positive ratio }m:n'},{text:'Find ratio from point',l:'\\text{Set up section eq. and solve for }m/n'}],
   genKey:'g3d_section'},
  {id:'g3d_centroid',title:'Centroid Formulations',level:'Foundation',color:'#0284C7',icon:'G',
   shortDef:"Triangle: G=(sum/3). Tetrahedron: G=(sum/4). Divides each median 2:1 (triangle) or 3:1 (tetrahedron) from vertex.",
   fullDef:"Triangle centroid: G=((x₁+x₂+x₃)/3,…). Tetrahedron: G=((x₁+x₂+x₃+x₄)/4,…). Commandino's theorem: 4 medians of tetrahedron concurrent at G=(A+B+C+D)/4, ratio 3:1 from vertex. Unknown vertex: C=3G-A-B.",
   keyFacts:[{text:'Triangle centroid',l:'G=\\left(\\tfrac{x_1+x_2+x_3}{3},\\tfrac{y_1+y_2+y_3}{3},\\tfrac{z_1+z_2+z_3}{3}\\right)'},{text:'Tetrahedron centroid',l:'G=\\left(\\tfrac{\\sum x_i}{4},\\tfrac{\\sum y_i}{4},\\tfrac{\\sum z_i}{4}\\right)'},{text:'Triangle median ratio',l:'G\\text{ divides median }2:1\\text{ from vertex}'},{text:'Tetrahedron median ratio',l:'G\\text{ divides median }3:1\\text{ from vertex}'},{text:'Find unknown vertex',l:'C=3G-A-B'}],
   genKey:'g3d_centroid'},
  {id:'g3d_dc',title:'Direction Cosines (DCs)',level:'Advanced',color:'#818CF8',icon:'l,m,n',
   shortDef:"l=cosα, m=cosβ, n=cosγ (angles with X,Y,Z). Identity: l²+m²+n²=1. DC from DR: divide by magnitude.",
   fullDef:"DCs are cosines of angles α,β,γ a line makes with positive X,Y,Z. Identity: l²+m²+n²=1. From DRs (a,b,c): l=a/|DR|, m=b/|DR|, n=c/|DR|. Equal angles with all axes: l=m=n=1/√3. Two sets of DCs per line: (l,m,n) and (-l,-m,-n).",
   keyFacts:[{text:'Definition',l:'l=\\cos\\alpha,\\;m=\\cos\\beta,\\;n=\\cos\\gamma'},{text:'Identity (ALWAYS)',l:'l^2+m^2+n^2=1'},{text:'DCs from DRs',l:'l=\\tfrac{a}{\\sqrt{a^2+b^2+c^2}},\\;\\text{etc.}'},{text:'Equal angles with axes',l:'l=m=n=\\tfrac{1}{\\sqrt{3}}'},{text:'Two directions per line',l:'(l,m,n)\\text{ and }(-l,-m,-n)'}],
   genKey:'g3d_dc'},
  {id:'g3d_dr',title:'Direction Ratios (DRs)',level:'Advanced',color:'#A5B4FC',icon:'a:b:c',
   shortDef:"Any (a,b,c) proportional to DCs. DRs of P₁P₂: (x₂-x₁,y₂-y₁,z₂-z₁). Parallel: proportional. Perpendicular: dot=0.",
   fullDef:"DRs are any triple proportional to DCs. Not unique: (2,4,6),(1,2,3),(-1,-2,-3) describe the same direction. DRs from two points: (x₂-x₁,y₂-y₁,z₂-z₁). Parallel: a₁/a₂=b₁/b₂=c₁/c₂. Perpendicular: a₁a₂+b₁b₂+c₁c₂=0.",
   keyFacts:[{text:'DRs proportional to DCs',l:'a:b:c=kl:km:kn'},{text:'DRs from two points',l:'(a,b,c)=(x_2-x_1,y_2-y_1,z_2-z_1)'},{text:'Parallel lines',l:'\\tfrac{a_1}{a_2}=\\tfrac{b_1}{b_2}=\\tfrac{c_1}{c_2}'},{text:'Perpendicular lines',l:'a_1a_2+b_1b_2+c_1c_2=0'},{text:'Infinite DRs, unique DCs',l:'(1,2,2),(2,4,4)\\text{ same direction}'}],
   genKey:'g3d_dr'},
  {id:'g3d_vecline',title:'Vector Equation of Lines',level:'Advanced',color:'#6366F1',icon:'r=a+λb',
   shortDef:"r⃗=a⃗+λb⃗: a⃗=known point, b⃗=direction, λ∈ℝ. Two points: b⃗=B-A. Parallel iff direction vectors proportional.",
   fullDef:"Vector equation: r⃗=a⃗+λb⃗. λ=0 gives point a⃗. Line through two points: r⃗=a⃗+λ(b⃗-a⃗). Parallel: b⃗₁=kb⃗₂. Intersect: solve a⃗₁+λb⃗₁=a⃗₂+μb⃗₂. Neither parallel nor intersecting → skew.",
   keyFacts:[{text:'Vector line equation',l:'\\vec{r}=\\vec{a}+\\lambda\\vec{b},\\;\\lambda\\in\\mathbb{R}'},{text:'Line through A and B',l:'\\vec{r}=\\vec{a}+\\lambda(\\vec{b}-\\vec{a})'},{text:'λ=0 gives point a⃗',l:'\\lambda=0\\Rightarrow\\vec{r}=\\vec{a}'},{text:'Parallel lines',l:'\\vec{b}_1=k\\vec{b}_2'},{text:'Intersection',l:'\\vec{a}_1+\\lambda\\vec{b}_1=\\vec{a}_2+\\mu\\vec{b}_2'}],
   genKey:'g3d_vecline',diagram:'axes3d'},
  {id:'g3d_cartline',title:'Cartesian Line Structures',level:'Advanced',color:'#4F46E5',icon:'sym.',
   shortDef:"(x-x₁)/a=(y-y₁)/b=(z-z₁)/c=t. Parametric: x=x₁+at, y=y₁+bt, z=z₁+ct. Zero DR → constant coordinate.",
   fullDef:"Symmetric form through (x₁,y₁,z₁) with DRs (a,b,c): (x-x₁)/a=(y-y₁)/b=(z-z₁)/c=t. Parametric: x=x₁+at, etc. Zero DR (c=0): z=z₁ constant. DRs are the denominators.",
   keyFacts:[{text:'Symmetric form',l:'\\tfrac{x-x_1}{a}=\\tfrac{y-y_1}{b}=\\tfrac{z-z_1}{c}=t'},{text:'Parametric form',l:'x=x_1+at,\\;y=y_1+bt,\\;z=z_1+ct'},{text:'Zero DR → constant coord',l:'c=0:\\;z=z_1\\text{ constant}'},{text:'DRs = denominators',l:'\\text{DRs of }\\tfrac{x-1}{4}=\\tfrac{y}{5}=\\tfrac{z-3}{6}\\text{ are }(4,5,6)'},{text:'Vector to symmetric',l:'\\vec{r}=(1,2,3)+\\lambda(4,5,6)\\Leftrightarrow\\tfrac{x-1}{4}=\\cdots'}],
   genKey:'g3d_cartline'},
  {id:'g3d_skew',title:'Skew Lines Intuition',level:'Advanced',color:'#4338CA',icon:'no∩ no∥',
   shortDef:"Skew = non-parallel AND non-intersecting. Unique to 3D. Four relationships: identical, intersecting, parallel, skew.",
   fullDef:"Four 3D line relationships: identical, intersecting (coplanar), parallel (coplanar), skew (non-coplanar). Skew lines cannot exist in 2D. Classic example: opposite edges of a cuboid. Test: not parallel (DRs not proportional) AND not intersecting (system inconsistent). SD>0 for skew lines.",
   keyFacts:[{text:'Four relationships',l:'\\text{Identical|Intersecting|Parallel|Skew}'},{text:'Skew: non-coplanar',l:'\\text{NOT }\\parallel\\text{ AND no common point}'},{text:'Non-coplanar condition',l:'(\\vec{a}_2-\\vec{a}_1)\\cdot(\\vec{b}_1\\times\\vec{b}_2)\\neq0'},{text:'Classic example',l:'\\text{Opposite edges of rectangular box}'},{text:'SD>0 for skew lines',l:'SD=0\\Leftrightarrow\\text{coplanar}'}],
   genKey:'g3d_skew'},
  {id:'g3d_shdist',title:'Shortest Distance Formula',level:'Advanced',color:'#3730A3',icon:'SD',
   shortDef:"SD=|(a₂-a₁)·(b₁×b₂)|/|b₁×b₂|. Numerator is scalar triple product. For parallel: SD=|(a₂-a₁)×b|/|b|.",
   fullDef:"SD between skew lines r⃗=a⃗₁+λb⃗₁ and r⃗=a⃗₂+μb⃗₂: SD=|(a⃗₂-a⃗₁)·(b⃗₁×b⃗₂)|/|b⃗₁×b⃗₂|. Numerator=|scalar triple product|=|3×3 det|. SD=0 → coplanar. Parallel lines: use SD=|(a₂-a₁)×b|/|b|.",
   keyFacts:[{text:'SD between skew lines',l:'SD=\\tfrac{|(\\vec{a}_2-\\vec{a}_1)\\cdot(\\vec{b}_1\\times\\vec{b}_2)|}{|\\vec{b}_1\\times\\vec{b}_2|}'},{text:'Numerator = |STP|',l:'=|\\det[\\vec{a}_2-\\vec{a}_1,\\vec{b}_1,\\vec{b}_2]|'},{text:'SD=0 → coplanar',l:'SD=0\\Leftrightarrow(\\vec{a}_2-\\vec{a}_1)\\cdot(\\vec{b}_1\\times\\vec{b}_2)=0'},{text:'For parallel lines',l:'SD=\\tfrac{|(\\vec{a}_2-\\vec{a}_1)\\times\\vec{b}|}{|\\vec{b}|}'},{text:'b₁×b₂ = common perp direction',l:'\\vec{b}_1\\times\\vec{b}_2\\perp\\text{both lines}'}],
   genKey:'g3d_shdist'},
  {id:'g3d_plane',title:'Plane Equation Formats',level:'Advanced',color:'#312E81',icon:'n·r=d',
   shortDef:"Vector: r⃗·n⃗=d. Cartesian: ax+by+cz+d=0. Intercept: x/p+y/q+z/r=1. Distance from origin: |d|/|n⃗|.",
   fullDef:"Three plane forms: (1) Vector: r⃗·n⃗=d. (2) Cartesian: ax+by+cz+d=0, normal=(a,b,c). (3) Intercept: x/p+y/q+z/r=1, intercepts (p,0,0),(0,q,0),(0,0,r). Point-normal: a(x-x₁)+b(y-y₁)+c(z-z₁)=0. Distance from O: |d|/√(a²+b²+c²).",
   keyFacts:[{text:'Vector form',l:'\\vec{r}\\cdot\\vec{n}=d'},{text:'General Cartesian',l:'ax+by+cz+d=0,\\;\\vec{n}=(a,b,c)'},{text:'Intercept form',l:'\\tfrac{x}{p}+\\tfrac{y}{q}+\\tfrac{z}{r}=1'},{text:'Point-normal form',l:'a(x-x_1)+b(y-y_1)+c(z-z_1)=0'},{text:'Distance from origin',l:'\\text{dist}=\\tfrac{|d|}{\\sqrt{a^2+b^2+c^2}}'}],
   genKey:'g3d_plane',diagram:'plane3d'},
  {id:'g3d_foot',title:'Foot of Perpendicular',level:'JEE',color:'#F472B6',icon:'foot',
   shortDef:"t=-(ax₁+by₁+cz₁+d)/(a²+b²+c²). Foot F=P+t(a,b,c). Perp dist=|t|·|n⃗|.",
   fullDef:"Foot of perpendicular from P=(x₁,y₁,z₁) to plane ax+by+cz+d=0: t=-(ax₁+by₁+cz₁+d)/(a²+b²+c²). F=(x₁+at,y₁+bt,z₁+ct). Perp distance=|ax₁+by₁+cz₁+d|/√(a²+b²+c²). For z=k plane: F=(x₁,y₁,k), dist=|z₁-k|.",
   keyFacts:[{text:'Parameter t',l:'t=-\\tfrac{ax_1+by_1+cz_1+d}{a^2+b^2+c^2}'},{text:'Foot F',l:'F=(x_1+at,y_1+bt,z_1+ct)'},{text:'Perp distance',l:'\\tfrac{|ax_1+by_1+cz_1+d|}{\\sqrt{a^2+b^2+c^2}}'},{text:'F on the plane',l:'aF_x+bF_y+cF_z+d=0'},{text:'On z=k plane',l:'F=(x_1,y_1,k),\\;\\text{dist}=|z_1-k|'}],
   genKey:'g3d_foot'},
  {id:'g3d_mirror',title:'Spatial Mirror Images',level:'JEE',color:'#EC4899',icon:'mirror',
   shortDef:"I=2F-P where F is foot. I=P+2t(a,b,c). F is midpoint of P and I. Across z=0: negate z.",
   fullDef:"Mirror image of P across plane: I=2F-P=(x₁+2at,y₁+2bt,z₁+2ct). F is midpoint. |PI|=2×perp distance. Across coordinate planes: XY(z=0)→negate z; YZ(x=0)→negate x; XZ(y=0)→negate y. Across x=k: Ix=2k-x₁.",
   keyFacts:[{text:'Image formula',l:'I=2F-P'},{text:'With parameter t',l:'I=(x_1+2at,y_1+2bt,z_1+2ct)'},{text:'F = midpoint of PI',l:'F=(P+I)/2'},{text:'|PI| = twice perp dist',l:'|PI|=2\\cdot\\text{dist}(P,\\text{plane})'},{text:'Across XY-plane',l:'(x,y,z)\\to(x,y,-z)'}],
   genKey:'g3d_mirror'},
  {id:'g3d_coplanar',title:'Coplanarity Conditions',level:'JEE',color:'#DB2777',icon:'copl.',
   shortDef:"Coplanar iff (a₂-a₁)·(b₁×b₂)=0. 3×3 determinant condition. Parallel/intersecting always coplanar; skew never.",
   fullDef:"Lines r⃗=a⃗₁+λb⃗₁ and r⃗=a⃗₂+μb⃗₂ are coplanar iff (a⃗₂-a⃗₁)·(b⃗₁×b⃗₂)=0. This is the 3×3 determinant with rows (Δa,b₁,b₂). Parallel→always coplanar. Intersecting→always coplanar. Skew→never coplanar.",
   keyFacts:[{text:'Coplanarity condition',l:'(\\vec{a}_2-\\vec{a}_1)\\cdot(\\vec{b}_1\\times\\vec{b}_2)=0'},{text:'Determinant form',l:'\\det[\\vec{a}_2-\\vec{a}_1,\\vec{b}_1,\\vec{b}_2]=0'},{text:'Parallel → coplanar',l:'\\vec{b}_1\\parallel\\vec{b}_2\\Rightarrow\\text{coplanar}'},{text:'Intersecting → coplanar',l:'\\text{Common point → shared plane}'},{text:'Skew → never coplanar',l:'\\det\\neq0\\Rightarrow\\text{skew}'}],
   genKey:'g3d_coplanar'},
  {id:'g3d_angle',title:'Angle Formulations',level:'JEE',color:'#BE185D',icon:'θ',
   shortDef:"Lines: cosθ=|b₁·b₂|/(|b₁||b₂|). Planes: cosθ=|n₁·n₂|/(|n₁||n₂|). Line-plane: sinθ=|b·n|/(|b||n|).",
   fullDef:"Line-line: cosθ=|b⃗₁·b⃗₂|/(|b⃗₁||b⃗₂|) (absolute value for acute). Plane-plane: cosθ=|n⃗₁·n⃗₂|/(|n⃗₁||n⃗₂|). Line-plane (inclination): sinθ=|b⃗·n⃗|/(|b⃗||n⃗|) — use SINE. Perpendicular: dot=0. Parallel: cross=0.",
   keyFacts:[{text:'Angle between two lines',l:'\\cos\\theta=\\tfrac{|\\vec{b}_1\\cdot\\vec{b}_2|}{|\\vec{b}_1||\\vec{b}_2|}'},{text:'Angle between two planes',l:'\\cos\\theta=\\tfrac{|\\vec{n}_1\\cdot\\vec{n}_2|}{|\\vec{n}_1||\\vec{n}_2|}'},{text:'Line-plane angle (SINE)',l:'\\sin\\theta=\\tfrac{|\\vec{b}\\cdot\\vec{n}|}{|\\vec{b}||\\vec{n}|}'},{text:'Lines perpendicular',l:'a_1a_2+b_1b_2+c_1c_2=0'},{text:'Planes perpendicular',l:'a_1a_2+b_1b_2+c_1c_2=0'}],
   genKey:'g3d_angle'},
  {id:'g3d_bisector',title:'Bisector Planes',level:'JEE',color:'#9D174D',icon:'bisect.',
   shortDef:"Bisectors of P₁=0 and P₂=0: (P₁/|n₁|)=±(P₂/|n₂|). Two perpendicular bisector planes.",
   fullDef:"Bisector planes of P₁=0 and P₂=0: (P₁/|n₁|)=±(P₂/|n₂|). Normalize first! Two bisector planes always perpendicular to each other. Bisectors are loci of equidistant points. To find acute/obtuse: substitute test point.",
   keyFacts:[{text:'Bisector equation',l:'\\tfrac{P_1}{|\\vec{n}_1|}=\\pm\\tfrac{P_2}{|\\vec{n}_2|}'},{text:'Two bisectors always ⊥',l:'\\theta=90°\\text{ between them}'},{text:'Equidistant from both planes',l:'d(\\text{pt},P_1)=d(\\text{pt},P_2)'},{text:'Normalize before equating',l:'\\text{divide by }|\\vec{n}|\\text{ first}'},{text:'± gives acute and obtuse',l:'\\text{one bisects each dihedral angle}'}],
   genKey:'g3d_bisector'},
  {id:'g3d_family',title:'Family of Planes',level:'JEE',color:'#831843',icon:'P₁+λP₂',
   shortDef:"P₁+λP₂=0 for λ∈ℝ: all planes through intersection line of P₁=0, P₂=0. Find λ with extra condition.",
   fullDef:"Family P₁+λP₂=0 represents all planes through line L=P₁∩P₂. λ=0→P₁. λ→∞→P₂ (not finite). Use extra condition (pass through point, ⊥ to plane) to find specific λ.",
   keyFacts:[{text:'Family formula',l:'P_1+\\lambda P_2=0,\\;\\lambda\\in\\mathbb{R}'},{text:'All through intersection line',l:'L=P_1\\cap P_2'},{text:'λ=0 gives P₁',l:'P_1+0\\cdot P_2=P_1=0'},{text:'Find λ from extra condition',l:'\\text{Sub. point: }P_1(x_0)+\\lambda P_2(x_0)=0'},{text:'P₂ not in family (λ→∞)',l:'\\text{Use }P_2+\\mu P_1=0\\text{ to include P}_2'}],
   genKey:'g3d_family'},
  {id:'g3d_sphere',title:'Spheres in 3D',level:'JEE',color:'#E11D48',icon:'S³',
   shortDef:"(x-a)²+(y-b)²+(z-c)²=r². General: x²+y²+z²+2gx+2fy+2hz+d=0, C=(-g,-f,-h), r=√(g²+f²+h²-d).",
   fullDef:"Standard: (x-a)²+(y-b)²+(z-c)²=r². General: x²+y²+z²+2gx+2fy+2hz+d=0, C=(-g,-f,-h), r=√(g²+f²+h²-d). Real if g²+f²+h²>d. Plane at dist d from C cuts sphere in circle radius r'=√(R²-d²).",
   keyFacts:[{text:'Standard form',l:'(x-a)^2+(y-b)^2+(z-c)^2=r^2'},{text:'General form',l:'x^2+y^2+z^2+2gx+2fy+2hz+d=0'},{text:'Centre and radius',l:'C=(-g,-f,-h),\\;r=\\sqrt{g^2+f^2+h^2-d}'},{text:'Real sphere',l:'g^2+f^2+h^2>d'},{text:'Plane-sphere circle',l:"r'=\\sqrt{R^2-d^2}"}],
   genKey:'g3d_sphere'},
  {id:'g3d_triple',title:'Scalar & Vector Triple Products',level:'Olympiad',color:'#FB923C',icon:'[abc]',
   shortDef:"STP: [a,b,c]=a·(b×c)=det. |STP|=parallelepiped volume. Zero iff coplanar. BAC-CAB: a×(b×c)=(a·c)b-(a·b)c.",
   fullDef:"STP [a,b,c]=a·(b×c)=3×3 det. |STP|=parallelepiped volume. =0 iff coplanar. Cyclic: [a,b,c]=[b,c,a]=[c,a,b]. Tet volume=(1/6)|STP|. VTP (BAC-CAB): a×(b×c)=(a·c)b-(a·b)c. Cross product NOT associative.",
   keyFacts:[{text:'STP = 3×3 determinant',l:'[\\vec{a},\\vec{b},\\vec{c}]=\\det[\\vec{a}\\;\\vec{b}\\;\\vec{c}]'},{text:'Volume of parallelepiped',l:'V=|[\\vec{a},\\vec{b},\\vec{c}]|'},{text:'STP=0 ↔ coplanar',l:'[\\vec{a},\\vec{b},\\vec{c}]=0\\Leftrightarrow\\text{coplanar}'},{text:'BAC-CAB rule',l:'\\vec{a}\\times(\\vec{b}\\times\\vec{c})=(\\vec{a}\\cdot\\vec{c})\\vec{b}-(\\vec{a}\\cdot\\vec{b})\\vec{c}'},{text:'Tetrahedron volume',l:'V_{tet}=\\tfrac{1}{6}|[\\vec{b}-\\vec{a},\\vec{c}-\\vec{a},\\vec{d}-\\vec{a}]|'}],
   genKey:'g3d_triple'},
  {id:'g3d_tetra',title:'Tetrahedral Geometry',level:'Olympiad',color:'#F97316',icon:'tetra',
   shortDef:"V=(1/6)|det[AB,AC,AD]|. Commandino's: 4 medians meet at G=(A+B+C+D)/4, ratio 3:1 from vertex.",
   fullDef:"Tetrahedron: 4 faces, 6 edges, 4 vertices. Volume=(1/6)|[AB,AC,AD]|. Commandino's theorem: 4 medians concurrent at G=(A+B+C+D)/4, dividing each 3:1 from vertex. Right-angle tet at origin: V=(1/6)abc.",
   keyFacts:[{text:'Volume',l:'V=\\tfrac{1}{6}|\\det[\\vec{AB},\\vec{AC},\\vec{AD}]|'},{text:"Commandino's theorem",l:'G=\\tfrac{A+B+C+D}{4},\\text{ 4 medians concurrent}'},{text:'Median ratio',l:'G\\text{ divides each median }3:1\\text{ from vertex}'},{text:'Right-angle tet at O',l:'V=\\tfrac{1}{6}abc'},{text:'Tetrahedron vs triangle',l:'\\text{Tet: }3:1\\;|\\;\\text{Triangle: }2:1'}],
   genKey:'g3d_tetra'},
  {id:'g3d_bary',title:'Barycentric Coordinates in 3D',level:'Olympiad',color:'#EA580C',icon:'λ₁λ₂λ₃λ₄',
   shortDef:"P=λ₁A+λ₂B+λ₃C+λ₄D, λ₁+λ₂+λ₃+λ₄=1. Interior: all λᵢ>0. Centroid: all λᵢ=1/4.",
   fullDef:"Any point P=λ₁A+λ₂B+λ₃C+λ₄D with Σλᵢ=1. λᵢ=sub-tet volume/total volume. Interior: all λᵢ>0. On face: one λᵢ=0. At vertex A: λ₁=1, others 0. Centroid: all λᵢ=1/4. Used in graphics, FEM, geometry proofs.",
   keyFacts:[{text:'Representation',l:'P=\\lambda_1A+\\lambda_2B+\\lambda_3C+\\lambda_4D,\\;\\sum\\lambda_i=1'},{text:'λᵢ = volume ratio',l:'\\lambda_i=\\text{sub-tet vol}/\\text{total vol}'},{text:'Interior: all λᵢ>0',l:'P\\text{ inside}\\Leftrightarrow\\text{all }\\lambda_i>0'},{text:'Centroid: all equal',l:'G:\\;\\lambda_i=1/4'},{text:'On face BCD: λ₁=0',l:'\\lambda_1=0\\Rightarrow P\\in\\text{face }BCD'}],
   genKey:'g3d_bary'},
  {id:'g3d_euler',title:"Euler's Brick Problem",level:'Olympiad',color:'#C2410C',icon:'a²+b²=d²',
   shortDef:"Euler brick: integers a,b,c with all face diagonals integers. (240,117,44) is the first known. Perfect cuboid (space diagonal also integer): unsolved open problem.",
   fullDef:"Euler brick: integer edges a,b,c with √(a²+b²),√(b²+c²),√(a²+c²) all integers. Smallest: (240,117,44), diagonals 267,244,125. Perfect cuboid also needs √(a²+b²+c²)∈ℤ — unsolved as of 2024. Scaling k(a,b,c) preserves brick property.",
   keyFacts:[{text:'Euler brick conditions',l:'\\sqrt{a^2+b^2},\\sqrt{b^2+c^2},\\sqrt{a^2+c^2}\\in\\mathbb{Z}'},{text:'First known brick',l:'(240,117,44):\\;267,244,125'},{text:'Verify (117,44)',l:'117^2+44^2=15625=125^2\\;\\checkmark'},{text:'Perfect cuboid: open problem',l:'\\sqrt{a^2+b^2+c^2}\\in\\mathbb{Z}\\;(\\text{unsolved})'},{text:'Scaling preserves brick',l:'k(a,b,c)\\text{ also an Euler brick}'}],
   genKey:'g3d_euler'},
  {id:'g3d_rotation',title:'Spatial Rotation Matrices',level:'Olympiad',color:'#9A3412',icon:'R(θ)',
   shortDef:"Rz(90°): (x,y,z)→(-y,x,z). Rx(180°): (x,y,z)→(x,-y,-z). All rotation matrices: R⁻¹=Rᵀ. 3D rotations non-commutative.",
   fullDef:"Rz(θ): [[cosθ,-sinθ,0],[sinθ,cosθ,0],[0,0,1]]. Ry(θ): [[cosθ,0,sinθ],[0,1,0],[-sinθ,0,cosθ]]. Rx(θ): [[1,0,0],[0,cosθ,-sinθ],[0,sinθ,cosθ]]. Orthogonal: RRᵀ=I, R⁻¹=Rᵀ. Non-commutative: Rx·Ry≠Ry·Rx.",
   keyFacts:[{text:'Rz(θ) rule',l:'R_z(\\theta):\\;(x,y,z)\\to(x\\cos\\theta-y\\sin\\theta,x\\sin\\theta+y\\cos\\theta,z)'},{text:'Orthogonality',l:'RR^T=I,\\;R^{-1}=R^T'},{text:'Rz(90°) shortcut',l:'(x,y,z)\\to(-y,x,z)'},{text:'Rx(180°) shortcut',l:'(x,y,z)\\to(x,-y,-z)'},{text:'Non-commutative',l:'R_xR_y\\neq R_yR_x\\text{ in general}'}],
   genKey:'g3d_rotation'},
];


// ── Practice Generators ───────────────────────────────────────
const GENERATORS = {
  g3d_axes:(n)=>{
    const t=n%3;
    if(t===0){const a=srI(n,1,5),b=srI(n+1,1,5),c=srI(n+2,1,5);const d2=a*a+b*b+c*c;return{question:`Find the distance of P=(${a},${b},${c}) from the origin.`,questionLatex:`d=\\sqrt{${a}^2+${b}^2+${c}^2}`,steps:[`Apply d=\\sqrt{x^2+y^2+z^2}`,`d=\\sqrt{${a*a}+${b*b}+${c*c}}=\\sqrt{${d2}}`],answer:`\\sqrt{${d2}}`,answerLatex:`\\sqrt{${d2}}`,tip:`d=√(x²+y²+z²). Square each coordinate, sum, then root.`};}
    if(t===1){const x=srI(n+3,1,5),y=srI(n+4,1,5);return{question:`Point P=(${x},${y},0). Which coordinate plane? Distance from O?`,questionLatex:`P=(${x},${y},0)`,steps:[`z=0 → P lies on the XY-plane`,`d=\\sqrt{${x}^2+${y}^2+0}=\\sqrt{${x*x+y*y}}`],answer:`XY-plane; d=√${x*x+y*y}`,answerLatex:`XY\\text{-plane},d=\\sqrt{${x*x+y*y}}`,tip:`z=0 → XY-plane. Distance formula reduces to 2D.`};}
    const a=srI(n+5,1,4),b=srI(n+6,1,4);return{question:`Name all three coordinate planes and their defining equations.`,questionLatex:`XY,YZ,XZ`,steps:[`XY-plane: z=0 (contains X and Y axes)`,`YZ-plane: x=0 (contains Y and Z axes)`,`XZ-plane: y=0 (contains X and Z axes)`],answer:`XY(z=0), YZ(x=0), XZ(y=0)`,answerLatex:`XY(z=0),YZ(x=0),XZ(y=0)`,tip:`Each plane is named for the two axes it contains. The absent axis has value zero.`};
  },
  g3d_octants:(n)=>{
    const sgs=[[1,1,1],[-1,1,1],[-1,-1,1],[1,-1,1],[1,1,-1],[-1,1,-1],[-1,-1,-1],[1,-1,-1]];
    const names=['I','II','III','IV','V','VI','VII','VIII'];
    const idx=n%8;const sg=sgs[idx];
    const x=sg[0]*srI(n+1,1,5),y=sg[1]*srI(n+2,1,5),z=sg[2]*srI(n+3,1,5);
    if(n%2===0){return{question:`Determine the octant for P=(${x},${y},${z}).`,questionLatex:`P=(${x},${y},${z})`,steps:[`x=${x}: ${sg[0]>0?'positive':'negative'}`,`y=${y}: ${sg[1]>0?'positive':'negative'}`,`z=${z}: ${sg[2]>0?'positive':'negative'}`,`Signs (${sg[0]>0?'+':'−'},${sg[1]>0?'+':'−'},${sg[2]>0?'+':'−'}) → Octant ${names[idx]}`],answer:`Octant ${names[idx]}`,answerLatex:`\\text{Octant ${names[idx]}}`,tip:`I(+,+,+),II(-,+,+),III(-,-,+),IV(+,-,+),V(+,+,-),VI(-,+,-),VII(-,-,-),VIII(+,-,-).`};}
    return{question:`How many octants share a face (coordinate plane) with Octant I (+,+,+)?`,questionLatex:`\\text{Octant I}:(+,+,+)`,steps:[`Flip x: (-,+,+)=Octant II`,`Flip y: (+,-,+)=Octant IV`,`Flip z: (+,+,-)=Octant V`,`3 octants share a face with Octant I`],answer:`3 octants: II, IV, V`,answerLatex:`3\\text{ octants (II,IV,V)}`,tip:`Adjacent octants differ in exactly one sign. Three coordinate-plane walls → 3 face neighbours.`};
  },
  g3d_distance:(n)=>{
    const t=n%3;
    if(t===0){const dx=srI(n,1,5),dy=srI(n+1,1,4),dz=srI(n+2,1,3);const x1=srI(n+3,0,3),y1=srI(n+4,0,3),z1=srI(n+5,0,2);const x2=x1+dx,y2=y1+dy,z2=z1+dz;const d2=dx*dx+dy*dy+dz*dz;return{question:`Find d(A,B): A=(${x1},${y1},${z1}), B=(${x2},${y2},${z2}).`,questionLatex:`d=\\sqrt{${dx}^2+${dy}^2+${dz}^2}`,steps:[`Δx=${dx},Δy=${dy},Δz=${dz}`,`d=\\sqrt{${dx*dx}+${dy*dy}+${dz*dz}}=\\sqrt{${d2}}`],answer:`√${d2}`,answerLatex:`\\sqrt{${d2}}`,tip:`Compute squared differences, sum, then root.`};}
    if(t===1){const k=srI(n+6,1,4);return{question:`P=(k,k,k), d(O,P)=√${3*k*k}. Find k.`,questionLatex:`k\\sqrt{3}=\\sqrt{${3*k*k}}`,steps:[`d=\\sqrt{3k^2}=k\\sqrt{3}`,`k\\sqrt{3}=\\sqrt{3}\\cdot${k}\\Rightarrow k=${k}`],answer:`k=${k}`,answerLatex:`k=${k}`,tip:`For (k,k,k): d=k√3. Equate and solve.`};}
    const x=srI(n+7,1,6);return{question:`P=(${x},4,3). Find d(O,P) and its distance from the YZ-plane.`,questionLatex:`d(O,P)=\\sqrt{${x}^2+16+9}`,steps:[`d=\\sqrt{${x*x+25}}`,`Dist to YZ-plane=|x|=${x}`],answer:`d=√${x*x+25}; to YZ-plane=${x}`,answerLatex:`d=\\sqrt{${x*x+25}},\\;\\text{dist to YZ}=${x}`,tip:`Distance to YZ-plane = |x|, independent of y and z.`};
  },
  g3d_section:(n)=>{
    const t=n%3;
    const m=srI(n,1,4),nn_=srI(n+1,1,4),mnS=m+nn_;
    const x1=srI(n+2,0,4),y1=srI(n+3,0,4),z1=srI(n+4,0,3);
    const x2=x1+srI(n+5,2,6),y2=y1+srI(n+6,2,6),z2=z1+srI(n+7,2,5);
    if(t===0){const pxN=m*x2+nn_*x1,pyN=m*y2+nn_*y1,pzN=m*z2+nn_*z1;return{question:`Divide A=(${x1},${y1},${z1}) and B=(${x2},${y2},${z2}) internally in ${m}:${nn_}.`,questionLatex:`P=\\frac{${m}B+${nn_}A}{${mnS}}`,steps:[`Px=(${m}·${x2}+${nn_}·${x1})/${mnS}=${fmtF(pxN,mnS)}`,`Py=(${m}·${y2}+${nn_}·${y1})/${mnS}=${fmtF(pyN,mnS)}`,`Pz=(${m}·${z2}+${nn_}·${z1})/${mnS}=${fmtF(pzN,mnS)}`],answer:`P=(${fmtF(pxN,mnS)},${fmtF(pyN,mnS)},${fmtF(pzN,mnS)})`,answerLatex:`P=\\left(${fmtF(pxN,mnS)},${fmtF(pyN,mnS)},${fmtF(pzN,mnS)}\\right)`,tip:`Internal: weight m on B, weight n on A, divide by m+n.`};}
    if(t===1){return{question:`Find midpoint M of A=(${x1},${y1},${z1}) and B=(${x2},${y2},${z2}).`,questionLatex:`M=(A+B)/2`,steps:[`Mx=${fmtF(x1+x2,2)},My=${fmtF(y1+y2,2)},Mz=${fmtF(z1+z2,2)}`],answer:`M=(${fmtF(x1+x2,2)},${fmtF(y1+y2,2)},${fmtF(z1+z2,2)})`,answerLatex:`M=\\left(${fmtF(x1+x2,2)},${fmtF(y1+y2,2)},${fmtF(z1+z2,2)}\\right)`,tip:`Midpoint = section formula with m=n=1.`};}
    return{question:`What is the external section formula for the x-coordinate?`,questionLatex:`P_x=\\frac{mx_2-nx_1}{m-n}`,steps:[`External section uses minus signs`,`Px=(mx₂-nx₁)/(m-n)`,`Point lies outside segment AB`],answer:`Px=(mx₂-nx₁)/(m-n)`,answerLatex:`P_x=\\frac{mx_2-nx_1}{m-n}`,tip:`External: minus in numerator and denominator. m=n gives undefined (no external point).`};
  },
  g3d_centroid:(n)=>{
    const x1=srI(n,0,5),y1=srI(n+1,0,5),z1=srI(n+2,0,4);
    const x2=srI(n+3,1,6),y2=srI(n+4,1,6),z2=srI(n+5,1,5);
    const x3=srI(n+6,0,6),y3=srI(n+7,0,6),z3=srI(n+8,0,5);
    if(n%2===0){const sx=x1+x2+x3,sy=y1+y2+y3,sz=z1+z2+z3;return{question:`Find centroid G of △ A=(${x1},${y1},${z1}),B=(${x2},${y2},${z2}),C=(${x3},${y3},${z3}).`,questionLatex:`G=(A+B+C)/3`,steps:[`Gx=${sx}/3=${fmtF(sx,3)}`,`Gy=${sy}/3=${fmtF(sy,3)}`,`Gz=${sz}/3=${fmtF(sz,3)}`],answer:`G=(${fmtF(sx,3)},${fmtF(sy,3)},${fmtF(sz,3)})`,answerLatex:`G=\\left(${fmtF(sx,3)},${fmtF(sy,3)},${fmtF(sz,3)}\\right)`,tip:`Centroid = arithmetic mean. Sum coordinates, divide by 3.`};}
    const x4=srI(n+9,0,4),y4=srI(n+10,0,4),z4=srI(n+11,0,3);
    const sx=x1+x2+x3+x4,sy=y1+y2+y3+y4,sz=z1+z2+z3+z4;
    return{question:`Centroid of tetrahedron A=(${x1},${y1},${z1}),B=(${x2},${y2},${z2}),C=(${x3},${y3},${z3}),D=(${x4},${y4},${z4}).`,questionLatex:`G=(A+B+C+D)/4`,steps:[`Gx=${sx}/4=${fmtF(sx,4)},Gy=${sy}/4=${fmtF(sy,4)},Gz=${sz}/4=${fmtF(sz,4)}`],answer:`G=(${fmtF(sx,4)},${fmtF(sy,4)},${fmtF(sz,4)})`,answerLatex:`G=\\left(${fmtF(sx,4)},${fmtF(sy,4)},${fmtF(sz,4)}\\right)`,tip:`Divide by 4 for tetrahedron. Commandino: all 4 medians meet here.`};
  },
  g3d_dc:(n)=>{
    const sets=[[1,2,2,3],[3,4,0,5],[2,6,3,7],[4,4,2,6],[0,1,0,1]];
    const [a,b,c,r]=sets[n%5];
    if(n%2===0){return{question:`Find DCs of line with DRs (${a},${b},${c}).`,questionLatex:`|DR|=${r}`,steps:[`|DR|=\\sqrt{${a*a+b*b+c*c}}=${r}`,`l=${a}/${r},m=${b}/${r},n=${c}/${r}`,`Check: ${a*a}/${r*r}+${b*b}/${r*r}+${c*c}/${r*r}=1 ✓`],answer:`(${a}/${r},${b}/${r},${c}/${r})`,answerLatex:`\\left(\\frac{${a}}{${r}},\\frac{${b}}{${r}},\\frac{${c}}{${r}}\\right)`,tip:`DCs = DRs/|DRs|. Always verify l²+m²+n²=1.`};}
    return{question:`A line makes equal angles with all three axes. Find its DCs.`,questionLatex:`l=m=n`,steps:[`Equal angles → l=m=n=k`,`3k²=1 → k=1/√3`],answer:`l=m=n=1/√3`,answerLatex:`l=m=n=\\frac{1}{\\sqrt{3}}`,tip:`Body diagonal of cube direction. l=m=n → 3l²=1.`};
  },
  g3d_dr:(n)=>{
    const t=n%3;
    const dx=srI(n+3,1,5),dy=srI(n+4,1,5),dz=srI(n+5,1,4);
    const x1=srI(n,0,3),y1=srI(n+1,0,3),z1=srI(n+2,0,2);
    if(t===0){return{question:`DRs of line through A=(${x1},${y1},${z1}) and B=(${x1+dx},${y1+dy},${z1+dz}).`,questionLatex:`\\text{DRs}=B-A`,steps:[`DRs=(${dx},${dy},${dz})`],answer:`(${dx},${dy},${dz})`,answerLatex:`(${dx},${dy},${dz})`,tip:`DRs from two points = coordinate differences.`};}
    if(t===1){const a1=srI(n+6,1,4),b1=srI(n+7,1,4),c1=srI(n+8,1,3);return{question:`DRs (${a1},${b1},${c1}) and (${2*a1},${2*b1},${2*c1}) — parallel or perpendicular?`,questionLatex:`\\text{Check proportionality}`,steps:[`Ratios: ${2*a1}/${a1}=${2*b1}/${b1}=${2*c1}/${c1}=2`,`All equal → proportional → PARALLEL`],answer:`Parallel (ratio 1:2)`,answerLatex:`\\text{Parallel, ratio }1:2`,tip:`Parallel iff all DR ratios equal.`};}
    const a1=srI(n+9,1,4),b1=srI(n+10,1,3),a2=b1,b2=a1,c2=-(a1*b1-b1*a1);
    const dot=a1*a2+b1*b2+1*c2;
    return{question:`DRs (${a1},${b1},1) and (1,2,${-(2*a1+b1)}). Check perpendicularity.`,questionLatex:`a_1a_2+b_1b_2+c_1c_2=?`,steps:[`=${a1}·1+${b1}·2+1·(${-(2*a1+b1)})=${a1+2*b1-(2*a1+b1)}`],answer:a1+2*b1-(2*a1+b1)===0?`Perpendicular`:`Not perpendicular, dot=${a1+2*b1-(2*a1+b1)}`,answerLatex:a1+2*b1-(2*a1+b1)===0?`\\perp`:`\\text{dot}=${a1+2*b1-(2*a1+b1)}`,tip:`Perpendicular: dot=0. No need to normalize DRs.`};
  },
  g3d_vecline:(n)=>{
    const x1=srI(n,0,4),y1=srI(n+1,0,4),z1=srI(n+2,0,3);
    const a=srI(n+3,1,4),b=srI(n+4,-3,3)||1,c=srI(n+5,1,4);
    if(n%2===0){return{question:`Vector equation: line through A=(${x1},${y1},${z1}) with direction (${a},${b},${c}).`,questionLatex:`\\vec{r}=\\vec{a}+\\lambda\\vec{b}`,steps:[`r⃗=(${x1},${y1},${z1})+λ(${a},${b},${c})`],answer:`r⃗=(${x1},${y1},${z1})+λ(${a},${b},${c})`,answerLatex:`\\vec{r}=(${x1},${y1},${z1})+\\lambda(${a},${b},${c})`,tip:`One point + direction = vector line. λ sweeps all points.`};}
    return{question:`Vector eq. of line through A=(${x1},${y1},${z1}) and B=(${x1+a},${y1+b},${z1+c}). At λ=2?`,questionLatex:`\\vec{r}=A+\\lambda(B-A)`,steps:[`Direction B-A=(${a},${b},${c})`,`r⃗=(${x1},${y1},${z1})+λ(${a},${b},${c})`,`At λ=2: (${x1+2*a},${y1+2*b},${z1+2*c})`],answer:`r=(${x1},${y1},${z1})+λ(${a},${b},${c}); at λ=2: (${x1+2*a},${y1+2*b},${z1+2*c})`,answerLatex:`\\vec{r}=(${x1},${y1},${z1})+\\lambda(${a},${b},${c})`,tip:`Direction = B-A. Substitute λ=2 to find the specific point.`};
  },
  g3d_cartline:(n)=>{
    const x1=srI(n,0,4),y1=srI(n+1,0,4),z1=srI(n+2,0,3);
    const a=srI(n+3,1,5),b=srI(n+4,-4,4)||1,c=srI(n+5,1,4);
    if(n%2===0){return{question:`Symmetric form of line through (${x1},${y1},${z1}) with DRs (${a},${b},${c}).`,questionLatex:`\\frac{x-x_1}{a}=\\frac{y-y_1}{b}=\\frac{z-z_1}{c}`,steps:[`(x-${x1})/${a}=(y-${y1})/${b}=(z-${z1})/${c}`],answer:`(x-${x1})/${a}=(y-${y1})/${b}=(z-${z1})/${c}`,answerLatex:`\\frac{x-${x1}}{${a}}=\\frac{y-${y1}}{${b}}=\\frac{z-${z1}}{${c}}`,tip:`Subtract point, divide by DRs.`};}
    return{question:`Convert r⃗=(${x1},${y1},${z1})+λ(${a},${b},${c}) to symmetric form. Find point at t=2.`,questionLatex:`\\text{Symmetric form}`,steps:[`(x-${x1})/${a}=(y-${y1})/${b}=(z-${z1})/${c}`,`At t=2: (${x1+2*a},${y1+2*b},${z1+2*c})`],answer:`Sym form; at t=2: (${x1+2*a},${y1+2*b},${z1+2*c})`,answerLatex:`\\frac{x-${x1}}{${a}}=\\cdots;\\;t=2\\to(${x1+2*a},${y1+2*b},${z1+2*c})`,tip:`DRs are denominators. Parametric: add t times each DR to the starting point.`};
  },
  g3d_skew:(n)=>{
    if(n%2===0){return{question:`State the four possible relationships between two lines in 3D.`,questionLatex:`\\text{4 relationships}`,steps:[`1. Identical`,`2. Intersecting — coplanar, one common point`,`3. Parallel — coplanar, no common point`,`4. Skew — non-coplanar, neither parallel nor intersecting`],answer:`Identical, Intersecting, Parallel, Skew`,answerLatex:`\\text{Identical|Intersecting|Parallel|Skew}`,tip:`Skew is unique to 3D. All 2D line pairs are coplanar.`};}
    return{question:`Why is SD between skew lines always strictly positive?`,questionLatex:`SD>0\\text{ for skew lines}`,steps:[`Skew lines never intersect`,`No common point → no point at distance 0`,`SD=0 would mean intersecting → coplanar → contradiction`,`Therefore SD>0 always`],answer:`Skew lines never share a point → SD>0`,answerLatex:`\\text{Skew}\\Rightarrow\\text{no common point}\\Rightarrow SD>0`,tip:`SD=0 ↔ coplanar. Skew lines are non-coplanar by definition.`};
  },
  g3d_shdist:(n)=>{
    const k=srI(n+1,2,7);
    if(n%2===0){return{question:`SD between L₁: r⃗=λ(1,0,0) and L₂: r⃗=(0,${k},0)+μ(0,0,1).`,questionLatex:`SD=\\frac{|(\\vec{a}_2-\\vec{a}_1)\\cdot(\\vec{b}_1\\times\\vec{b}_2)|}{|\\vec{b}_1\\times\\vec{b}_2|}`,steps:[`b₁×b₂=(1,0,0)×(0,0,1)=(0,-1,0)`,`a₂-a₁=(0,${k},0)`,`STP=(0,${k},0)·(0,-1,0)=-${k}`,`SD=|-${k}|/1=${k}`],answer:`SD=${k}`,answerLatex:`SD=${k}`,tip:`Perpendicular X and Z axis lines: SD=Y-gap between them.`};}
    return{question:`SD=0 between two lines implies what?`,questionLatex:`SD=0\\Rightarrow?`,steps:[`SD=0 → STP=0 → lines coplanar`,`Coplanar lines: intersecting or parallel`,`Skew lines always have SD>0`],answer:`Lines are coplanar (intersecting or parallel)`,answerLatex:`SD=0\\Leftrightarrow\\text{coplanar}`,tip:`SD=0 is the coplanarity condition.`};
  },
  g3d_plane:(n)=>{
    const t=n%3;const a=srI(n,1,4),b=srI(n+1,1,4),c=srI(n+2,1,3);
    const x0=srI(n+3,1,4),y0=srI(n+4,1,4),z0=srI(n+5,1,3);const d=a*x0+b*y0+c*z0;
    if(t===0){return{question:`Plane through (${x0},${y0},${z0}) with normal (${a},${b},${c}).`,questionLatex:`${a}(x-${x0})+${b}(y-${y0})+${c}(z-${z0})=0`,steps:[`${a}x+${b}y+${c}z=${d}`],answer:`${a}x+${b}y+${c}z=${d}`,answerLatex:`${a}x+${b}y+${c}z=${d}`,tip:`d=ax₁+by₁+cz₁. Normal coefficients = plane coefficients.`};}
    if(t===1){const p=srI(n+6,2,5),q=srI(n+7,2,5),r=srI(n+8,2,4);return{question:`Convert x/${p}+y/${q}+z/${r}=1 to Cartesian. Normal vector?`,questionLatex:`\\frac{x}{${p}}+\\frac{y}{${q}}+\\frac{z}{${r}}=1`,steps:[`Multiply by ${p*q*r}: ${q*r}x+${p*r}y+${p*q}z=${p*q*r}`,`Normal=(${q*r},${p*r},${p*q})`],answer:`${q*r}x+${p*r}y+${p*q}z=${p*q*r}`,answerLatex:`${q*r}x+${p*r}y+${p*q}z=${p*q*r}`,tip:`Multiply by pqr to clear fractions.`};}
    const d2=a*a+b*b+c*c;return{question:`Distance from origin to ${a}x+${b}y+${c}z=${d}.`,questionLatex:`\\text{dist}=\\frac{${d}}{\\sqrt{${d2}}}`,steps:[`dist=|d|/√(a²+b²+c²)=${d}/√${d2}`],answer:`${d}/√${d2}`,answerLatex:`\\frac{${d}}{\\sqrt{${d2}}}`,tip:`Distance from O to ax+by+cz=d is |d|/|n⃗|.`};
  },
  g3d_foot:(n)=>{
    const t=n%3;const x1=srI(n+1,1,6),y1=srI(n+2,1,6),z1=srI(n+3,2,6);
    if(t===0){const k=srI(n+4,0,z1-1);return{question:`Foot F from P=(${x1},${y1},${z1}) to plane z=${k}.`,questionLatex:`\\vec{n}=(0,0,1)`,steps:[`Keep x,y; change z to k`,`F=(${x1},${y1},${k}), dist=${z1-k}`],answer:`F=(${x1},${y1},${k})`,answerLatex:`F=(${x1},${y1},${k}),\\;\\text{dist}=${z1-k}`,tip:`Foot on z=k: z changes to k, x and y unchanged.`};}
    if(t===1){const k=srI(n+5,0,x1-1);return{question:`Foot F from P=(${x1},${y1},${z1}) to plane x=${k}.`,questionLatex:`\\vec{n}=(1,0,0)`,steps:[`Keep y,z; change x to k`,`F=(${k},${y1},${z1}), dist=${x1-k}`],answer:`F=(${k},${y1},${z1})`,answerLatex:`F=(${k},${y1},${z1}),\\;\\text{dist}=${x1-k}`,tip:`Foot on x=k: change x to k.`};}
    const d0=srI(n+6,2,8);const num=x1+y1+z1-d0;
    return{question:`Foot from P=(${x1},${y1},${z1}) to plane x+y+z=${d0}.`,questionLatex:`t=-(${x1+y1+z1}-${d0})/3`,steps:[`t=-(${x1+y1+z1-d0})/3=${fmtF(-num,3)}`,`F=(${fmtF(3*x1-num,3)},${fmtF(3*y1-num,3)},${fmtF(3*z1-num,3)})`],answer:`F=(${fmtF(3*x1-num,3)},${fmtF(3*y1-num,3)},${fmtF(3*z1-num,3)})`,answerLatex:`F=\\left(${fmtF(3*x1-num,3)},${fmtF(3*y1-num,3)},${fmtF(3*z1-num,3)}\\right)`,tip:`For x+y+z=d: t=-(x₁+y₁+z₁-d)/3. Each foot coord = P_i+t.`};
  },
  g3d_mirror:(n)=>{
    const t=n%3;const x1=srI(n+1,1,6),y1=srI(n+2,1,6),z1=srI(n+3,1,5);
    if(t===0){return{question:`Mirror image of P=(${x1},${y1},${z1}) across XY-plane (z=0).`,questionLatex:`\\text{negate }z`,steps:[`Foot F=(${x1},${y1},0)`,`I=2F-P=(${x1},${y1},${-z1})`],answer:`I=(${x1},${y1},${-z1})`,answerLatex:`I=(${x1},${y1},${-z1})`,tip:`Across z=0: negate z-coordinate.`};}
    if(t===1){return{question:`Mirror image of P=(${x1},${y1},${z1}) across YZ-plane (x=0).`,questionLatex:`\\text{negate }x`,steps:[`Foot F=(0,${y1},${z1})`,`I=2F-P=(${-x1},${y1},${z1})`],answer:`I=(${-x1},${y1},${z1})`,answerLatex:`I=(-${x1},${y1},${z1})`,tip:`Across x=0: negate x-coordinate.`};}
    const k=srI(n+4,1,4);return{question:`Mirror image of P=(${x1},${y1},${z1}) across plane z=${k}.`,questionLatex:`I_z=2k-z_1`,steps:[`Foot F=(${x1},${y1},${k})`,`Iz=2·${k}-${z1}=${2*k-z1}`,`I=(${x1},${y1},${2*k-z1})`],answer:`I=(${x1},${y1},${2*k-z1})`,answerLatex:`I=(${x1},${y1},${2*k-z1})`,tip:`Across z=k: Iz=2k-z₁.`};
  },
  g3d_coplanar:(n)=>{
    if(n%2===0){return{question:`Coplanarity condition for lines r⃗=a₁+λb₁ and r⃗=a₂+μb₂.`,questionLatex:`(\\vec{a}_2-\\vec{a}_1)\\cdot(\\vec{b}_1\\times\\vec{b}_2)=0`,steps:[`Coplanar iff (a₂-a₁)·(b₁×b₂)=0`,`Equivalently: 3×3 determinant with rows Δa,b₁,b₂ equals 0`],answer:`(a₂-a₁)·(b₁×b₂)=0`,answerLatex:`(\\vec{a}_2-\\vec{a}_1)\\cdot(\\vec{b}_1\\times\\vec{b}_2)=0`,tip:`Zero STP = coplanar. Non-zero = skew.`};}
    return{question:`b₁=(1,2,3) and b₂=(2,4,6). Are the lines coplanar?`,questionLatex:`\\vec{b}_2=2\\vec{b}_1`,steps:[`b₂=2b₁ → parallel`,`Parallel lines are ALWAYS coplanar`],answer:`Yes, coplanar (parallel)`,answerLatex:`\\text{Parallel}\\Rightarrow\\text{coplanar always}`,tip:`Parallel and intersecting lines are always coplanar. Only skew lines are non-coplanar.`};
  },
  g3d_angle:(n)=>{
    const t=n%3;
    if(t===0){const a1=srI(n,1,3),b1=srI(n+1,1,3),c1=srI(n+2,1,2);const a2=srI(n+3,1,3),b2=srI(n+4,1,3),c2=srI(n+5,1,2);const dot=a1*a2+b1*b2+c1*c2;const m1=Math.sqrt(a1*a1+b1*b1+c1*c1),m2=Math.sqrt(a2*a2+b2*b2+c2*c2);return{question:`cosθ for lines with DRs (${a1},${b1},${c1}) and (${a2},${b2},${c2}).`,questionLatex:`\\cos\\theta=\\frac{|\\vec{b}_1\\cdot\\vec{b}_2|}{|\\vec{b}_1||\\vec{b}_2|}`,steps:[`dot=${dot}`,`cosθ=|${dot}|/(${m1.toFixed(3)}×${m2.toFixed(3)})=${(Math.abs(dot)/(m1*m2)).toFixed(4)}`],answer:`cosθ≈${(Math.abs(dot)/(m1*m2)).toFixed(4)}`,answerLatex:`\\cos\\theta\\approx${(Math.abs(dot)/(m1*m2)).toFixed(4)}`,tip:`Absolute value of dot product ensures acute angle.`};}
    if(t===1){return{question:`Why does line-plane angle use SINE, not COSINE?`,questionLatex:`\\sin\\theta=\\frac{|\\vec{b}\\cdot\\vec{n}|}{|\\vec{b}||\\vec{n}|}`,steps:[`θ = inclination FROM the plane (not from the normal)`,`When line is parallel to plane: b⊥n → sinθ=0 ✓`,`When line is ⊥ to plane: b∥n → sinθ=1 ✓`,`So sinθ=|b·n|/(|b||n|)`],answer:`Line-plane angle is inclination from plane → use SINE`,answerLatex:`\\sin\\theta=|\\vec{b}\\cdot\\vec{n}|/(|\\vec{b}||\\vec{n}|)`,tip:`Line-plane: SINE. Line-line or plane-plane: COSINE.`};}
    return{question:`Angle between X-axis (1,0,0) and XY-plane (normal 0,0,1).`,questionLatex:`\\sin\\theta=\\frac{|(1,0,0)\\cdot(0,0,1)|}{1}`,steps:[`sinθ=|1·0+0·0+0·1|/1=0`,`θ=0°`,`X-axis lies IN the XY-plane → angle=0°`],answer:`θ=0°`,answerLatex:`\\theta=0°`,tip:`Line lying in a plane has 0° inclination.`};
  },
  g3d_bisector:(n)=>{
    if(n%2===0){return{question:`Write bisector planes of x+2y+2z=9 and 4x-3y+12z=9.`,questionLatex:`\\frac{P_1}{|n_1|}=\\pm\\frac{P_2}{|n_2|}`,steps:[`|n₁|=√(1+4+4)=3,|n₂|=√(16+9+144)=13`,`(x+2y+2z-9)/3=±(4x-3y+12z-9)/13`,`(+): x+35y-10z=90`,`(-): 25x+17y+62z=144`],answer:`x+35y-10z=90 and 25x+17y+62z=144`,answerLatex:`x+35y-10z=90\\text{ and }25x+17y+62z=144`,tip:`Normalize each plane by |n|, then equate with ±.`};}
    return{question:`The two bisector planes of any pair of planes are always at what angle?`,questionLatex:`\\theta=?`,steps:[`One bisects acute dihedral angle θ/2`,`Other bisects obtuse: (180°-θ)/2`,`Sum: θ/2+(180°-θ)/2=90°`],answer:`90° always`,answerLatex:`\\theta=90°\\text{ always}`,tip:`Acute and obtuse bisectors are always perpendicular to each other.`};
  },
  g3d_family:(n)=>{
    if(n%2===0){return{question:`Find plane through intersection of x+y+z=3 and x-y+z=1, passing through origin.`,questionLatex:`P_1+\\lambda P_2=0`,steps:[`Family: (x+y+z-3)+λ(x-y+z-1)=0`,`Sub (0,0,0): -3+λ(-1)=0 → λ=-3`,`Plane: (x+y+z-3)-3(x-y+z-1)=0 → x-2y+z=0`],answer:`x-2y+z=0`,answerLatex:`x-2y+z=0`,tip:`Substitute origin into family, solve for λ, substitute back.`};}
    return{question:`What does λ=0 give in the family P₁+λP₂=0?`,questionLatex:`P_1+0\\cdot P_2=P_1`,steps:[`λ=0: P₁+0=P₁=0`,`This is the first original plane`],answer:`The first plane P₁=0`,answerLatex:`\\lambda=0\\Rightarrow P_1=0`,tip:`λ=0 gives P₁. As λ→∞, approaches P₂.`};
  },
  g3d_sphere:(n)=>{
    const a=srI(n,0,4),b=srI(n+1,0,4),c=srI(n+2,0,3),r=srI(n+3,2,5);
    if(n%2===0){return{question:`Sphere with centre (${a},${b},${c}) and radius ${r}.`,questionLatex:`(x-${a})^2+(y-${b})^2+(z-${c})^2=${r*r}`,steps:[`Standard: (x-a)²+(y-b)²+(z-c)²=r²`,`(x-${a})²+(y-${b})²+(z-${c})²=${r*r}`],answer:`(x-${a})²+(y-${b})²+(z-${c})²=${r*r}`,answerLatex:`(x-${a})^2+(y-${b})^2+(z-${c})^2=${r*r}`,tip:`Sphere = 3D distance formula squared = r².`};}
    const d0=a*a+b*b+c*c-r*r;return{question:`Centre and radius: x²+y²+z²-${2*a}x-${2*b}y-${2*c}z+${d0}=0.`,questionLatex:`C=(-g,-f,-h),\\;r=\\sqrt{g^2+f^2+h^2-d}`,steps:[`g=${-a},f=${-b},h=${-c},d=${d0}`,`C=(${a},${b},${c}), r=√(${a*a+b*b+c*c}-${d0})=${r}`],answer:`C=(${a},${b},${c}), r=${r}`,answerLatex:`C=(${a},${b},${c}),r=${r}`,tip:`Centre=(-g,-f,-h). Read g,f,h from halved coefficients.`};
  },
  g3d_triple:(n)=>{
    const a1=srI(n,1,3),a2=srI(n+1,0,2),a3=srI(n+2,0,2);
    const b1=srI(n+3,0,2),b2=srI(n+4,1,3),b3=srI(n+5,0,2);
    const c1=srI(n+6,0,2),c2=srI(n+7,0,2),c3=srI(n+8,1,3);
    if(n%2===0){const det=a1*(b2*c3-b3*c2)-a2*(b1*c3-b3*c1)+a3*(b1*c2-b2*c1);return{question:`Compute [a,b,c] for a=(${a1},${a2},${a3}),b=(${b1},${b2},${b3}),c=(${c1},${c2},${c3}).`,questionLatex:`\\begin{vmatrix}${a1}&${a2}&${a3}\\\\${b1}&${b2}&${b3}\\\\${c1}&${c2}&${c3}\\end{vmatrix}`,steps:[`=${a1}(${b2*c3-b3*c2})-${a2}(${b1*c3-b3*c1})+${a3}(${b1*c2-b2*c1})=${det}`],answer:`[a,b,c]=${det}`,answerLatex:`[\\vec{a},\\vec{b},\\vec{c}]=${det}`,tip:`STP=3×3 det. |STP|=parallelepiped volume. 0→coplanar.`};}
    return{question:`BAC-CAB: a=(1,0,0),b=(0,1,0),c=(0,0,1). Find a×(b×c).`,questionLatex:`(\\vec{a}\\cdot\\vec{c})\\vec{b}-(\\vec{a}\\cdot\\vec{b})\\vec{c}`,steps:[`a·c=0, a·b=0`,`a×(b×c)=0·b-0·c=(0,0,0)`],answer:`(0,0,0)`,answerLatex:`\\vec{0}`,tip:`BAC-CAB: a×(b×c)=(a·c)b-(a·b)c.`};
  },
  g3d_tetra:(n)=>{
    const ax=srI(n,1,4),by_=srI(n+1,1,4),cz=srI(n+2,1,4);
    if(n%2===0){return{question:`Volume of tet O,A=(${ax},0,0),B=(0,${by_},0),C=(0,0,${cz}).`,questionLatex:`V=\\frac{1}{6}|\\det|`,steps:[`det=${ax*by_*cz}`,`V=${ax*by_*cz}/6=${fmtF(ax*by_*cz,6)}`],answer:`V=${fmtF(ax*by_*cz,6)}`,answerLatex:`V=${fmtF(ax*by_*cz,6)}`,tip:`Right-angle tet at O: V=(1/6)abc.`};}
    return{question:`State Commandino's theorem for tetrahedra.`,questionLatex:`G=(A+B+C+D)/4`,steps:[`4 medians (vertex to opposite face centroid) are concurrent`,`They meet at G=(A+B+C+D)/4`,`Each median divided 3:1 from vertex`],answer:`4 medians concurrent at G, ratio 3:1`,answerLatex:`G=\\frac{A+B+C+D}{4},\\;3:1\\text{ from vertex}`,tip:`Analogy: triangle medians 2:1. Tetrahedron medians 3:1.`};
  },
  g3d_bary:(n)=>{
    if(n%2===0){return{question:`λ₁=λ₂=λ₃=λ₄=1/4 in barycentric coords of tetrahedron ABCD. What is P?`,questionLatex:`P=\\frac{A+B+C+D}{4}`,steps:[`P=(A+B+C+D)/4`,`This is the centroid G`],answer:`Centroid G of ABCD`,answerLatex:`P=G=\\frac{A+B+C+D}{4}`,tip:`Equal weights → centroid.`};}
    return{question:`If λ₁=0 in P=λ₁A+λ₂B+λ₃C+λ₄D, where does P lie?`,questionLatex:`\\lambda_1=0\\Rightarrow P\\in\\text{face }BCD`,steps:[`λ₁=0 removes contribution of A`,`P=λ₂B+λ₃C+λ₄D, on face BCD`],answer:`On face BCD (opposite A)`,answerLatex:`P\\in\\text{face }BCD`,tip:`One zero coord → on opposite face.`};
  },
  g3d_euler:(n)=>{
    if(n%2===0){return{question:`Verify 240²+117²=267² (Euler brick face diagonal).`,questionLatex:`240^2+117^2=267^2?`,steps:[`240²=57600, 117²=13689`,`Sum=71289`,`267²=71289 ✓`],answer:`71289=267² ✓`,answerLatex:`240^2+117^2=267^2\\;\\checkmark`,tip:`All three face diagonals must be integers for an Euler brick.`};}
    return{question:`Verify 117²+44²=125² for Euler brick (240,117,44).`,questionLatex:`117^2+44^2=125^2?`,steps:[`117²=13689, 44²=1936`,`Sum=15625=125² ✓`],answer:`15625=125² ✓`,answerLatex:`117^2+44^2=15625=125^2\\;\\checkmark`,tip:`Three pairs to check: (a,b), (a,c), (b,c). Space diagonal is the unsolved part.`};
  },
  g3d_rotation:(n)=>{
    const x=srI(n+1,1,4),y=srI(n+2,1,4),z=srI(n+3,1,3);
    if(n%2===0){return{question:`Apply Rz(90°) to P=(${x},${y},${z}).`,questionLatex:`R_z(90°):(x,y,z)\\to(-y,x,z)`,steps:[`Rz(90°): (x,y,z)→(-y,x,z)`,`P'=(-${y},${x},${z})`],answer:`P'=(${-y},${x},${z})`,answerLatex:`P'=(-${y},${x},${z})`,tip:`Rz(90°): negate y, promote x, z unchanged.`};}
    return{question:`Apply Rx(180°) to P=(${x},${y},${z}). State general rule.`,questionLatex:`R_x(180°):(x,y,z)\\to(x,-y,-z)`,steps:[`Rx(180°): negate y and z, keep x`,`P'=(${x},${-y},${-z})`],answer:`P'=(${x},${-y},${-z}); rule: negate y and z`,answerLatex:`P'=(${x},${-y},${-z})`,tip:`Rx(180°): flip YZ-plane. Rx(90°): (x,y,z)→(x,-z,y).`};
  },
};


// ── Quiz Generators ───────────────────────────────────────────
function shuffle(arr,seed){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(sr(seed*i+i)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

const QUIZ_GENERATORS = {
  g3d_axes:(n)=>{const T=[
    (s)=>{const a=srI(s,1,5),b=srI(s+1,1,5),c=srI(s+2,1,5);const d2=a*a+b*b+c*c;return{q:`d(O,(${a},${b},${c}))=?`,opts:shuffle([`√${d2}`,`${a+b+c}`,`√${a*a+b*b}`,`${a*b}`],s),correct:`√${d2}`,tip:`d=√(${a*a}+${b*b}+${c*c})=√${d2}.`};},
    (s)=>{return{q:`Point (3,0,5) lies on which coordinate plane?`,opts:shuffle(['XZ-plane (y=0)','XY-plane (z=0)','YZ-plane (x=0)','No plane'],s+1),correct:'XZ-plane (y=0)',tip:`y=0 → XZ-plane.`};},
    (s)=>{return{q:`Three coordinate planes divide 3D space into:`,opts:shuffle(['8 octants','4 regions','6 octants','12 sectors'],s+2),correct:'8 octants',tip:`2³=8 sign combos → 8 octants.`};},
    (s)=>{const x=srI(s+3,1,6);return{q:`Distance from P=(${x},0,0) to origin:`,opts:shuffle([`${x}`,`${x*x}`,`√${2*x*x}`,`0`],s+4),correct:`${x}`,tip:`On X-axis: d=|x|.`};}
  ];return T[n%T.length](n*67+13);},
  g3d_octants:(n)=>{const T=[
    (s)=>{return{q:`(−2,3,−1) is in which octant?`,opts:shuffle(['Octant VI (−,+,−)','Octant II (−,+,+)','Octant V (+,+,−)','Octant VII (−,−,−)'],s),correct:'Octant VI (−,+,−)',tip:`x<0,y>0,z<0 → VI.`};},
    (s)=>{return{q:`How many sign patterns (±,±,±) are possible?`,opts:shuffle(['8','4','6','3'],s+1),correct:'8',tip:`2³=8.`};},
    (s)=>{return{q:`Octant I sign convention:`,opts:shuffle(['(+,+,+)','(−,+,+)','(+,−,+)','(+,+,−)'],s+2),correct:'(+,+,+)',tip:`Octant I: all positive.`};},
    (s)=>{const y=srI(s+3,1,5),z=srI(s+4,1,5);return{q:`(3,−${y},${z}) is in which octant?`,opts:shuffle(['Octant IV (+,−,+)','Octant I (+,+,+)','Octant VIII (+,−,−)','Octant III (−,−,+)'],s+5),correct:'Octant IV (+,−,+)',tip:`x>0,y<0,z>0 → IV.`};}
  ];return T[n%T.length](n*71+17);},
  g3d_distance:(n)=>{const T=[
    (s)=>{const a=srI(s,1,4),b=srI(s+1,1,4),c=srI(s+2,0,3);const d2=a*a+b*b+c*c;return{q:`d(O,(${a},${b},${c}))=?`,opts:shuffle([`√${d2}`,`${a+b+c}`,`√${a*a+b*b}`,`${a*b*c}`],s+3),correct:`√${d2}`,tip:`d=√(${d2}).`};},
    (s)=>{return{q:`Distance from P=(x,y,z) to XY-plane (z=0):`,opts:shuffle(['|z|','|y|','|x|','√(x²+y²)'],s+4),correct:'|z|',tip:`Dist to XY=|z|.`};},
    (s)=>{const k=srI(s+5,1,4);return{q:`P=(k,k,k). Distance from O=?`,opts:shuffle([`k√3`,`3k`,`k√2`,`k`],s+6),correct:`k√3`,tip:`d=√(3k²)=k√3.`};},
    (s)=>{return{q:`d(A,B) for A=(0,0,0), B=(3,4,0):`,opts:shuffle(['5','7','√7','1'],s+7),correct:'5',tip:`d=√(9+16)=5.`};}
  ];return T[n%T.length](n*73+19);},
  g3d_section:(n)=>{const T=[
    (s)=>{const m=srI(s,1,4),nn_=srI(s+1,1,4),mnS=m+nn_;const x2=mnS;const pxN=m*x2;return{q:`Divide (0,0,0)–(${mnS},0,0) in ratio ${m}:${nn_}. x-coord?`,opts:shuffle([`${fmtF(pxN,mnS)}`,`${fmtF(nn_*mnS,mnS)}`,`${fmtF(mnS,2)}`,`${m}`],s+2),correct:`${fmtF(pxN,mnS)}`,tip:`Px=(m·${mnS})/${mnS}=${fmtF(pxN,mnS)}.`};},
    (s)=>{const x1=srI(s+3,1,5),x2=x1+srI(s+4,2,6);return{q:`Midpoint x-coord of ${x1} and ${x2}:`,opts:shuffle([`${fmtF(x1+x2,2)}`,`${x2-x1}`,`${x1+x2}`,`${x1}`],s+5),correct:`${fmtF(x1+x2,2)}`,tip:`(${x1}+${x2})/2=${fmtF(x1+x2,2)}.`};},
    (s)=>{return{q:`External division formula (x-coord):`,opts:shuffle(['(mx₂−nx₁)/(m−n)','(mx₂+nx₁)/(m+n)','(x₁+x₂)/2','(nx₂−mx₁)/(m+n)'],s+6),correct:'(mx₂−nx₁)/(m−n)',tip:`External: MINUS signs.`};},
    (s)=>{const g=srI(s+7,3,8);return{q:`Centroid Gx=${fmtF(g,3)}. Sum x₁+x₂+x₃=?`,opts:shuffle([`${g}`,`${fmtF(g,3)}`,`${2*g}`,`${g+1}`],s+8),correct:`${g}`,tip:`Gx=sum/3 → sum=3Gx=${g}.`};}
  ];return T[n%T.length](n*79+23);},
  g3d_centroid:(n)=>{const T=[
    (s)=>{const x1=srI(s,0,4),x2=srI(s+1,1,5),x3=srI(s+2,0,5);return{q:`Centroid x-coord of triangle: x-coords ${x1},${x2},${x3}:`,opts:shuffle([`${fmtF(x1+x2+x3,3)}`,`${x1+x2+x3}`,`${fmtF(x1+x2,2)}`,`${x3}`],s+3),correct:`${fmtF(x1+x2+x3,3)}`,tip:`(${x1}+${x2}+${x3})/3=${fmtF(x1+x2+x3,3)}.`};},
    (s)=>{return{q:`Tetrahedron centroid: divide coordinate sum by:`,opts:shuffle(['4','3','6','2'],s+4),correct:'4',tip:`4 vertices → divide by 4.`};},
    (s)=>{const g=srI(s+5,2,5);return{q:`G=(${g},${g},${g}), A=(0,0,0), B=(${g},${g},${g}). Find C.`,opts:shuffle([`(${2*g},${2*g},${2*g})`,`(${3*g},${3*g},${3*g})`,`(${g},0,0)`,`(0,${g},0)`],s+6),correct:`(${2*g},${2*g},${2*g})`,tip:`C=3G-A-B=(${3*g}-${g},…)=(${2*g},…).`};},
    (s)=>{return{q:`Tetrahedron centroid divides each median from vertex in ratio:`,opts:shuffle(['3:1','2:1','1:3','1:1'],s+7),correct:'3:1',tip:`Tetrahedron 3:1; triangle 2:1.`};}
  ];return T[n%T.length](n*83+29);},
  g3d_dc:(n)=>{const T=[
    (s)=>{return{q:`l²+m²+n²=?`,opts:shuffle(['1','0','2','√3'],s),correct:'1',tip:`Fundamental DC identity.`};},
    (s)=>{return{q:`DRs (1,2,2). First DC l=?`,opts:shuffle(['1/3','1/√5','1/2','2/3'],s+1),correct:'1/3',tip:`|DR|=3, l=1/3.`};},
    (s)=>{return{q:`Equal angles with all axes → l=m=n=?`,opts:shuffle(['1/√3','1/√2','1/3','1'],s+2),correct:'1/√3',tip:`3l²=1 → l=1/√3.`};},
    (s)=>{return{q:`X-axis DCs:`,opts:shuffle(['(1,0,0)','(0,1,0)','(0,0,1)','(1,1,0)'],s+3),correct:'(1,0,0)',tip:`Angle 0° with X, 90° with Y and Z.`};}
  ];return T[n%T.length](n*89+31);},
  g3d_dr:(n)=>{const T=[
    (s)=>{return{q:`DRs of line A=(1,2,3) to B=(4,6,3):`,opts:shuffle(['(3,4,0)','(1,2,3)','(4,6,3)','(5,8,6)'],s),correct:'(3,4,0)',tip:`B-A=(3,4,0).`};},
    (s)=>{return{q:`DRs (1,2,3) and (2,4,6) are:`,opts:shuffle(['Parallel','Perpendicular','Skew','Identical'],s+1),correct:'Parallel',tip:`2/1=4/2=6/3=2 → proportional → parallel.`};},
    (s)=>{return{q:`Perpendicularity condition for DRs (a₁,b₁,c₁),(a₂,b₂,c₂):`,opts:shuffle(['a₁a₂+b₁b₂+c₁c₂=0','a₁/a₂=b₁/b₂','a₁=a₂','a₁a₂=1'],s+2),correct:'a₁a₂+b₁b₂+c₁c₂=0',tip:`Dot product=0 for perpendicular.`};},
    (s)=>{const k=srI(s+3,2,5);return{q:`Are (1,2,3) and (${k},${2*k},${3*k}) proportional?`,opts:shuffle([`Yes (factor ${k})`,'No','Only if k=1','Cannot tell'],s+4),correct:`Yes (factor ${k})`,tip:`All ratios = ${k}.`};}
  ];return T[n%T.length](n*97+37);},
  g3d_vecline:(n)=>{const T=[
    (s)=>{return{q:`In r⃗=a⃗+λb⃗, a⃗ is:`,opts:shuffle(['Known point on line','Direction vector','Normal vector','Free parameter'],s),correct:'Known point on line',tip:`a⃗=anchor; b⃗=direction; λ=free parameter.`};},
    (s)=>{const x=srI(s+1,1,4),y=srI(s+2,1,4),z=srI(s+3,1,3);return{q:`r⃗=(${x},${y},${z})+λ(1,1,1). At λ=3:`,opts:shuffle([`(${x+3},${y+3},${z+3})`,`(3,3,3)`,`(${x+1},${y+1},${z+1})`,`(${x},${y},${z})`],s+4),correct:`(${x+3},${y+3},${z+3})`,tip:`Add 3×(1,1,1) to starting point.`};},
    (s)=>{return{q:`Two lines parallel iff:`,opts:shuffle(['b₁=kb₂ for scalar k','b₁·b₂=0','|b₁|=|b₂|','b₁=b₂'],s+5),correct:'b₁=kb₂ for scalar k',tip:`Proportional directions = parallel.`};},
    (s)=>{const a=srI(s+6,1,4),b=srI(s+7,1,4),c=srI(s+8,1,3);return{q:`r⃗=(${a},${b},${c})+λ(0,1,0). Parallel to which axis?`,opts:shuffle(['Y-axis','X-axis','Z-axis','None'],s+9),correct:'Y-axis',tip:`Direction (0,1,0) = Y-axis.`};}
  ];return T[n%T.length](n*101+41);},
  g3d_cartline:(n)=>{const T=[
    (s)=>{return{q:`Symmetric form through (1,2,3) with DRs (4,5,6):`,opts:shuffle(['(x−1)/4=(y−2)/5=(z−3)/6','(x−4)/1=(y−5)/2=(z−6)/3','x/4=y/5=z/6','(x+1)/4=(y+2)/5=(z+3)/6'],s),correct:'(x−1)/4=(y−2)/5=(z−3)/6',tip:`(x-x₁)/a=(y-y₁)/b=(z-z₁)/c.`};},
    (s)=>{const t=srI(s+1,1,5);return{q:`On (x−1)/2=(y)/1=(z)/4=t, at t=${t}: z=?`,opts:shuffle([`${4*t}`,`${t}`,`${2*t}`,`${4*t+1}`],s+2),correct:`${4*t}`,tip:`z=0+4t=${4*t}.`};},
    (s)=>{return{q:`Line (x−2)/3=(y−1)/4=(z+5)/0. All points have z=?`,opts:shuffle(['z=−5 (constant)','z=0','z=5','Any z'],s+3),correct:'z=−5 (constant)',tip:`DR=0 → that coord is constant = value in eq.`};},
    (s)=>{return{q:`DRs of line (x−3)/7=(y+2)/4=(z)/2:`,opts:shuffle(['(7,4,2)','(3,−2,0)','(7,−4,2)','(1/7,1/4,1/2)'],s+4),correct:'(7,4,2)',tip:`Denominators = DRs.`};}
  ];return T[n%T.length](n*103+43);},
  g3d_skew:(n)=>{const T=[
    (s)=>{return{q:`Skew lines are:`,opts:shuffle(['Non-parallel and non-intersecting','Parallel but different','Perpendicular','In the same plane'],s),correct:'Non-parallel and non-intersecting',tip:`Skew = neither parallel nor intersecting.`};},
    (s)=>{return{q:`Skew lines exist in:`,opts:shuffle(['3D only','2D only','Both 2D and 3D','Neither'],s+1),correct:'3D only',tip:`2D lines are always coplanar. Skew requires 3D.`};},
    (s)=>{return{q:`Classic example of skew lines:`,opts:shuffle(['Opposite edges of a box','Parallel walls','Floor and ceiling','Perpendicular walls'],s+2),correct:'Opposite edges of a box',tip:`Bottom-left and top-right box edges: not parallel, never meet.`};},
    (s)=>{return{q:`SD between skew lines is always:`,opts:shuffle(['Positive (>0)','Zero','Negative','Undefined'],s+3),correct:'Positive (>0)',tip:`SD>0 for skew. SD=0 → coplanar.`};}
  ];return T[n%T.length](n*107+47);},
  g3d_shdist:(n)=>{const T=[
    (s)=>{return{q:`SD between r⃗=λ(1,0,0) and r⃗=(0,4,0)+μ(0,0,1):`,opts:shuffle(['4','0','√10','1'],s),correct:'4',tip:`b₁×b₂=(0,-1,0). STP=(0,4,0)·(0,-1,0)=-4. SD=4.`};},
    (s)=>{return{q:`SD=0 implies the two lines are:`,opts:shuffle(['Coplanar','Skew','Identical','Undefined'],s+1),correct:'Coplanar',tip:`SD=0 → coplanar (intersecting or parallel).`};},
    (s)=>{return{q:`b₁×b₂ in SD formula gives:`,opts:shuffle(['Common perpendicular direction','Bisector direction','Sum of directions','Nothing useful'],s+2),correct:'Common perpendicular direction',tip:`Cross product ⊥ both directions → common perpendicular.`};},
    (s)=>{return{q:`For parallel lines, SD uses:`,opts:shuffle(['|(a₂−a₁)×b|/|b|','|(a₂−a₁)·(b₁×b₂)|/|b₁×b₂|','|a₂−a₁|','0'],s+3),correct:'|(a₂−a₁)×b|/|b|',tip:`Parallel → b₁×b₂=0⃗ so use the parallel formula.`};}
  ];return T[n%T.length](n*109+53);},
  g3d_plane:(n)=>{const T=[
    (s)=>{return{q:`Normal vector of 3x−2y+5z=7:`,opts:shuffle(['(3,−2,5)','(7,0,0)','(3,2,5)','(−2,5,3)'],s),correct:'(3,−2,5)',tip:`Normal=(a,b,c) from ax+by+cz=d.`};},
    (s)=>{const p=srI(s+1,2,5);return{q:`Plane x/${p}+y/4+z/3=1. X-intercept?`,opts:shuffle([`(${p},0,0)`,`(1,0,0)`,`(${p*4},0,0)`,`(0,0,0)`],s+2),correct:`(${p},0,0)`,tip:`Set y=z=0: x=p=${p}.`};},
    (s)=>{const a=srI(s+3,1,4),b=srI(s+4,1,4),c=srI(s+5,1,3),d=srI(s+6,3,9);return{q:`Dist from O to ${a}x+${b}y+${c}z=${d}:`,opts:shuffle([`${d}/√${a*a+b*b+c*c}`,`${d}`,`√${a*a+b*b+c*c}`,`${d}/${a+b+c}`],s+7),correct:`${d}/√${a*a+b*b+c*c}`,tip:`dist=${d}/√${a*a+b*b+c*c}.`};},
    (s)=>{return{q:`Plane through (x₀,y₀,z₀) with normal (a,b,c):`,opts:shuffle(['a(x−x₀)+b(y−y₀)+c(z−z₀)=0','ax₀+by₀+cz₀=0','ax+by+cz=0','x/a+y/b+z/c=1'],s+8),correct:'a(x−x₀)+b(y−y₀)+c(z−z₀)=0',tip:`Point-normal form.`};}
  ];return T[n%T.length](n*113+59);},
  g3d_foot:(n)=>{const T=[
    (s)=>{return{q:`Foot of perpendicular from P to plane lies:`,opts:shuffle(['On the plane','Same side as P','At origin','At midpoint of P and O'],s),correct:'On the plane',tip:`F is ON the plane. PF ⊥ plane.`};},
    (s)=>{const x=srI(s+1,1,5);return{q:`Foot from (${x},3,2) to plane x=0 (YZ):`,opts:shuffle([`(0,3,2)`,`(−${x},3,2)`,`(${x},3,2)`,`(0,0,0)`],s+2),correct:`(0,3,2)`,tip:`Foot on x=0: change x to 0.`};},
    (s)=>{return{q:`Perp distance from P=(x₁,y₁,z₁) to ax+by+cz+d=0:`,opts:shuffle(['|ax₁+by₁+cz₁+d|/√(a²+b²+c²)','|ax₁+by₁+cz₁|','√(a²+b²+c²)','|d|'],s+3),correct:'|ax₁+by₁+cz₁+d|/√(a²+b²+c²)',tip:`Standard perpendicular distance formula.`};},
    (s)=>{return{q:`Foot formula: t=−(ax₁+by₁+cz₁+d)/(a²+b²+c²). F=?`,opts:shuffle(['P+t(a,b,c)','P−t(a,b,c)','t(a,b,c)','P+|t|'],s+4),correct:'P+t(a,b,c)',tip:`F=(x₁+at,y₁+bt,z₁+ct)=P+t(a,b,c).`};}
  ];return T[n%T.length](n*127+61);},
  g3d_mirror:(n)=>{const T=[
    (s)=>{return{q:`Mirror image I uses foot F as:`,opts:shuffle(['Midpoint of P and I','Reflection of P','Same as I','Origin'],s),correct:'Midpoint of P and I',tip:`F=(P+I)/2 → I=2F−P.`};},
    (s)=>{const x=srI(s+1,1,6);return{q:`Mirror image of (${x},3,2) across YZ-plane (x=0):`,opts:shuffle([`(−${x},3,2)`,`(${x},−3,2)`,`(${x},3,−2)`,`(0,3,2)`],s+2),correct:`(−${x},3,2)`,tip:`Across x=0: negate x.`};},
    (s)=>{return{q:`|PI| (P to its mirror image) equals:`,opts:shuffle(['2 × perp dist','1 × perp dist','Perp dist²','0'],s+3),correct:'2 × perp dist',tip:`P is dist d from plane; I is d on other side → |PI|=2d.`};},
    (s)=>{const k=srI(s+4,1,4),z=srI(s+5,k+1,k+5);return{q:`Mirror of (3,2,${z}) across z=${k}. Image z-coord?`,opts:shuffle([`${2*k-z}`,`${z-k}`,`${k}`,`${-z}`],s+6),correct:`${2*k-z}`,tip:`Iz=2k−z₁=2·${k}−${z}=${2*k-z}.`};}
  ];return T[n%T.length](n*131+67);},
  g3d_coplanar:(n)=>{const T=[
    (s)=>{return{q:`Two lines coplanar iff:`,opts:shuffle(['(a₂−a₁)·(b₁×b₂)=0','DRs proportional','Same point','|b₁×b₂|=1'],s),correct:'(a₂−a₁)·(b₁×b₂)=0',tip:`Zero STP = coplanar.`};},
    (s)=>{return{q:`Parallel lines are always:`,opts:shuffle(['Coplanar','Skew','Perpendicular','Identical'],s+1),correct:'Coplanar',tip:`Parallel lines share a common plane.`};},
    (s)=>{return{q:`Skew lines are:`,opts:shuffle(['Never coplanar','Always perpendicular','Sometimes coplanar','Parallel'],s+2),correct:'Never coplanar',tip:`Skew by definition = non-coplanar.`};},
    (s)=>{return{q:`Coplanarity determinant has rows:`,opts:shuffle(['(a₂−a₁), b₁, b₂','b₁, b₂, (a₁−a₂)','a₁, a₂, b₁','b₁, b₂, b₁×b₂'],s+3),correct:'(a₂−a₁), b₁, b₂',tip:`3×3 det with rows Δa, b₁, b₂.`};}
  ];return T[n%T.length](n*137+71);},
  g3d_angle:(n)=>{const T=[
    (s)=>{return{q:`Angle between two lines uses:`,opts:shuffle(['cosθ=|b₁·b₂|/(|b₁||b₂|)','sinθ=|b₁·b₂|/(|b₁||b₂|)','cosθ=b₁·b₂/(|b₁||b₂|)','tanθ'],s),correct:'cosθ=|b₁·b₂|/(|b₁||b₂|)',tip:`Cosine with absolute value → acute angle.`};},
    (s)=>{return{q:`Line-plane angle formula uses:`,opts:shuffle(['sinθ=|b·n|/(|b||n|)','cosθ=|b·n|/(|b||n|)','sinθ=b·n/(|b||n|)','tanθ'],s+1),correct:'sinθ=|b·n|/(|b||n|)',tip:`Line-plane: SINE (measures from plane, not normal).`};},
    (s)=>{return{q:`Two planes perpendicular iff:`,opts:shuffle(['n₁·n₂=0','n₁×n₂=0⃗','n₁=kn₂','|n₁|=|n₂|'],s+2),correct:'n₁·n₂=0',tip:`Perpendicular normals → perpendicular planes.`};},
    (s)=>{return{q:`Angle between X-axis and Y-axis:`,opts:shuffle(['90°','0°','45°','60°'],s+3),correct:'90°',tip:`cosθ=|1·0+0·1|/(1·1)=0 → θ=90°.`};}
  ];return T[n%T.length](n*139+73);},
  g3d_bisector:(n)=>{const T=[
    (s)=>{return{q:`Bisector planes found by:`,opts:shuffle(['Setting (P₁/|n₁|)=±(P₂/|n₂|)','Adding the two planes','Subtracting the planes','Setting normals equal'],s),correct:'Setting (P₁/|n₁|)=±(P₂/|n₂|)',tip:`Normalize each plane by |n|, equate with ±.`};},
    (s)=>{return{q:`Two bisector planes of any pair are always:`,opts:shuffle(['Perpendicular (90°)','Parallel','At 45°','Identical'],s+1),correct:'Perpendicular (90°)',tip:`Acute + obtuse bisectors → always perpendicular.`};},
    (s)=>{return{q:`Points on a bisector plane are:`,opts:shuffle(['Equidistant from both planes','On both planes','On neither plane','At intersection line'],s+2),correct:'Equidistant from both planes',tip:`Bisector = equidistant locus.`};},
    (s)=>{return{q:`Before equating bisector planes, you must:`,opts:shuffle(['Normalize by |n|','Add them','Find intersection','Set d=0'],s+3),correct:'Normalize by |n|',tip:`Divide by normal magnitude first.`};}
  ];return T[n%T.length](n*149+79);},
  g3d_family:(n)=>{const T=[
    (s)=>{return{q:`P₁+λP₂=0 represents planes through:`,opts:shuffle(['Intersection line of P₁=0, P₂=0','Origin','Midplane','Normal to both'],s),correct:'Intersection line of P₁=0, P₂=0',tip:`Every plane in family passes through L=P₁∩P₂.`};},
    (s)=>{return{q:`λ=0 in P₁+λP₂=0 gives:`,opts:shuffle(['P₁=0','P₂=0','P₁+P₂=0','No plane'],s+1),correct:'P₁=0',tip:`λ=0: just P₁=0.`};},
    (s)=>{return{q:`To find specific λ, use:`,opts:shuffle(['Extra condition (e.g. given point)','Always λ=1','Angle between planes','Distance between planes'],s+2),correct:'Extra condition (e.g. given point)',tip:`Sub given point to find λ.`};},
    (s)=>{return{q:`Which plane is NOT captured by finite λ in P₁+λP₂=0?`,opts:shuffle(['P₂=0 (λ→∞)','P₁=0 (λ=0)','P₁+P₂=0 (λ=1)','P₁−P₂=0 (λ=−1)'],s+3),correct:'P₂=0 (λ→∞)',tip:`P₂ requires λ→∞. Write P₂+μP₁=0 to include it.`};}
  ];return T[n%T.length](n*151+83);},
  g3d_sphere:(n)=>{const T=[
    (s)=>{return{q:`Centre of x²+y²+z²−4x+6y−2z+9=0:`,opts:shuffle(['(2,−3,1)','(−2,3,−1)','(4,6,2)','(2,3,1)'],s),correct:'(2,−3,1)',tip:`C=(-g,-f,-h): g=-2,f=3,h=-1 → C=(2,-3,1).`};},
    (s)=>{const r=srI(s+1,2,5);return{q:`Sphere centre O, radius ${r}:`,opts:shuffle([`x²+y²+z²=${r*r}`,`x²+y²+z²=${r}`,`x+y+z=${r}`,`x²+y²=${r*r}`],s+2),correct:`x²+y²+z²=${r*r}`,tip:`Centre O: (x-0)²+...=r².`};},
    (s)=>{return{q:`Real sphere condition from x²+y²+z²+2gx+…+d=0:`,opts:shuffle(['g²+f²+h²>d','g²+f²+h²<d','g²+f²+h²=d','g=f=h=0'],s+3),correct:'g²+f²+h²>d',tip:`r=√(g²+f²+h²-d) must be real.`};},
    (s)=>{const R=srI(s+4,3,6),d0=srI(s+5,1,R-1);return{q:`Plane at dist ${d0} from centre, sphere radius ${R}. Circle radius?`,opts:shuffle([`√${R*R-d0*d0}`,`${R-d0}`,`${R}`,`√${R+d0}`],s+6),correct:`√${R*R-d0*d0}`,tip:`r'=√(R²-d²)=√${R*R-d0*d0}.`};}
  ];return T[n%T.length](n*157+89);},
  g3d_triple:(n)=>{const T=[
    (s)=>{return{q:`|Scalar triple product [a,b,c]| gives:`,opts:shuffle(['Volume of parallelepiped','Area of triangle','Length of diagonal','Volume of tetrahedron'],s),correct:'Volume of parallelepiped',tip:`|STP|=V_parallelepiped. V_tet=(1/6)|STP|.`};},
    (s)=>{return{q:`[a,b,c]=0 means vectors are:`,opts:shuffle(['Coplanar','Mutually perpendicular','All equal','Collinear'],s+1),correct:'Coplanar',tip:`STP=0 → det=0 → linearly dependent → coplanar.`};},
    (s)=>{const a=srI(s+2,1,3),b=srI(s+3,1,3),c=srI(s+4,1,3);return{q:`[a,b,c] for a=(${a},0,0),b=(0,${b},0),c=(0,0,${c}):`,opts:shuffle([`${a*b*c}`,`${2*a*b*c}`,`${a+b+c}`,`0`],s+5),correct:`${a*b*c}`,tip:`Diagonal matrix: det=a·b·c=${a*b*c}.`};},
    (s)=>{return{q:`BAC-CAB rule: a×(b×c)=?`,opts:shuffle(['(a·c)b−(a·b)c','(a·b)c−(a·c)b','(a×b)×c','a(b·c)'],s+6),correct:'(a·c)b−(a·b)c',tip:`BAC-CAB: a×(b×c)=(a·c)b−(a·b)c.`};}
  ];return T[n%T.length](n*163+97);},
  g3d_tetra:(n)=>{const T=[
    (s)=>{const a=srI(s,1,4),b=srI(s+1,1,4),c=srI(s+2,1,3);return{q:`Vol of tet O,A=(${a},0,0),B=(0,${b},0),C=(0,0,${c}):`,opts:shuffle([`${fmtF(a*b*c,6)}`,`${fmtF(a*b*c,3)}`,`${a*b*c}`,`${fmtF(a*b*c,2)}`],s+3),correct:`${fmtF(a*b*c,6)}`,tip:`V=(1/6)·${a}·${b}·${c}=${fmtF(a*b*c,6)}.`};},
    (s)=>{return{q:`Commandino's theorem: 4 medians of tetrahedron are:`,opts:shuffle(['Concurrent at G=(A+B+C+D)/4','All equal length','Perpendicular to faces','Not concurrent'],s+4),correct:'Concurrent at G=(A+B+C+D)/4',tip:`Concurrent at centroid G in ratio 3:1 from vertex.`};},
    (s)=>{return{q:`Tetrahedron has _ faces, _ edges, _ vertices:`,opts:shuffle(['4, 6, 4','4, 4, 6','6, 12, 8','3, 6, 4'],s+5),correct:'4, 6, 4',tip:`F=4,E=6,V=4. Euler: 4-6+4=2 ✓.`};},
    (s)=>{const k=srI(s+6,2,5);return{q:`V_parallelepiped=${6*k}. V_tetrahedron=?`,opts:shuffle([`${k}`,`${2*k}`,`${3*k}`,`${6*k}`],s+7),correct:`${k}`,tip:`V_tet=(1/6)·${6*k}=${k}.`};}
  ];return T[n%T.length](n*167+101);},
  g3d_bary:(n)=>{const T=[
    (s)=>{return{q:`Barycentric coordinates must satisfy:`,opts:shuffle(['λ₁+λ₂+λ₃+λ₄=1','λ₁+λ₂+λ₃+λ₄=0','All λᵢ=1/4','All λᵢ>0'],s),correct:'λ₁+λ₂+λ₃+λ₄=1',tip:`Normalisation: weights sum to 1.`};},
    (s)=>{return{q:`P inside tetrahedron ABCD iff:`,opts:shuffle(['All λᵢ>0','All λᵢ=1/4','Some λᵢ<0','All λᵢ=0'],s+1),correct:'All λᵢ>0',tip:`Interior = all coords strictly positive.`};},
    (s)=>{return{q:`λ₁=1, λ₂=λ₃=λ₄=0 gives P=?`,opts:shuffle(['Vertex A','Centroid G','Midpoint AB','Face centroid BCD'],s+2),correct:'Vertex A',tip:`P=1·A+0+0+0=A.`};},
    (s)=>{return{q:`λ₁=0 means P lies on:`,opts:shuffle(['Opposite face BCD','An edge','A vertex','Outside'],s+3),correct:'Opposite face BCD',tip:`One zero coord → on opposite face.`};}
  ];return T[n%T.length](n*173+107);},
  g3d_euler:(n)=>{const T=[
    (s)=>{return{q:`Euler brick requires all ___ to be integers:`,opts:shuffle(['Face diagonals','Space diagonal','Edges only','All diagonals'],s),correct:'Face diagonals',tip:`3 face diagonals must be integers.`};},
    (s)=>{return{q:`117²+44² equals:`,opts:shuffle(['15625=125²','71289=267²','59536=244²','10000'],s+1),correct:'15625=125²',tip:`13689+1936=15625=125².`};},
    (s)=>{return{q:`Perfect cuboid (space diagonal also integer) is:`,opts:shuffle(['An open problem (none found)','Impossible','Found by Euler','Same as Euler brick'],s+2),correct:'An open problem (none found)',tip:`Unsolved as of 2024.`};},
    (s)=>{return{q:`If (a,b,c) is an Euler brick, (2a,2b,2c) is:`,opts:shuffle(['Also an Euler brick','Not a brick','A perfect cuboid','Invalid'],s+3),correct:'Also an Euler brick',tip:`Scaling preserves integrality.`};}
  ];return T[n%T.length](n*179+113);},
  g3d_rotation:(n)=>{const T=[
    (s)=>{const x=srI(s,1,4),y=srI(s+1,1,4),z=srI(s+2,1,3);return{q:`Rz(90°) applied to (${x},${y},${z}):`,opts:shuffle([`(−${y},${x},${z})`,`(${x},−${y},${z})`,`(${y},−${x},${z})`,`(${z},${y},${x})`],s+3),correct:`(−${y},${x},${z})`,tip:`Rz(90°):(x,y,z)→(−y,x,z).`};},
    (s)=>{return{q:`Rotation matrices satisfy R⁻¹=?`,opts:shuffle(['Rᵀ (transpose)','−R','R²','1/det·R'],s+4),correct:'Rᵀ (transpose)',tip:`Orthogonal: RRᵀ=I → R⁻¹=Rᵀ.`};},
    (s)=>{return{q:`3D rotations about different axes:`,opts:shuffle(['Are non-commutative','Always commute','Commute at 90°','Only commute about parallel axes'],s+5),correct:'Are non-commutative',tip:`Rx·Ry≠Ry·Rx in general.`};},
    (s)=>{const x=srI(s+6,1,5),y=srI(s+7,1,5),z=srI(s+8,1,4);return{q:`Rx(180°) applied to (${x},${y},${z}):`,opts:shuffle([`(${x},−${y},−${z})`,`(−${x},${y},−${z})`,`(−${x},−${y},${z})`,`(${x},${y},−${z})`],s+9),correct:`(${x},−${y},−${z})`,tip:`Rx(180°):(x,y,z)→(x,−y,−z).`};}
  ];return T[n%T.length](n*181+117);},
};


// ── Global Styles ──────────────────────────────────────────────
function useGlobalStyles() {
  useEffect(() => {
    _initKaTeX();
    const link=document.createElement('link');link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=JetBrains+Mono:wght@400;600&display=swap';
    document.head.appendChild(link);
    const s=document.createElement('style');
    s.textContent=`*{box-sizing:border-box;margin:0;padding:0;}body{background:#07090f;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#07090f;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:4px;}@keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}@keyframes shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(8px);}60%{transform:translateX(-5px);}80%{transform:translateX(5px);}}@keyframes popIn{0%{transform:scale(0.7);opacity:0;}80%{transform:scale(1.05);}100%{transform:scale(1);opacity:1;}}.btn{transition:all 0.2s ease;cursor:pointer;}.btn:active{transform:scale(0.97);}.katex{color:inherit!important;}.katex-display{margin:0!important;}.fade-up{animation:fadeUp 0.5s ease both;}.fade-in{animation:fadeIn 0.4s ease both;}.shake{animation:shake 0.5s ease;}.pop-in{animation:popIn 0.4s ease both;}`;
    document.head.appendChild(s);
  },[]);
}

// ── Cover Screen ───────────────────────────────────────────────
function CoverScreen({ onNext }) {
  const [phase,setPhase]=useState(0);
  useEffect(()=>{const ts=[300,900,1600].map((d,i)=>setTimeout(()=>setPhase(i+1),d));return()=>ts.forEach(clearTimeout);},[]);
  const floaters=['(x,y,z)','l²+m²+n²=1','r⃗=a⃗+λb⃗','SD','octants','⊥plane','det','3D'];
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',background:`radial-gradient(ellipse at 50% 0%,rgba(56,189,248,0.09) 0%,transparent 65%),radial-gradient(ellipse at 80% 80%,rgba(129,140,248,0.06) 0%,transparent 55%),#07090f`,textAlign:'center'}}>
      {floaters.map((s,i)=>(
        <div key={s} style={{position:'fixed',pointerEvents:'none',fontSize:14+(i%3)*7,color:`rgba(56,189,248,${0.04+(i%4)*0.02})`,top:`${8+i*11}%`,left:i%2===0?`${2+i*4}%`:`${74+i*2}%`,fontFamily:'JetBrains Mono,monospace',animation:`pulse ${3+i*0.6}s ease-in-out infinite`,animationDelay:`${i*0.25}s`}}>{s}</div>
      ))}
      <div style={{opacity:phase>=1?1:0,transform:phase>=1?'translateY(0)':'translateY(12px)',transition:'all 0.6s ease',marginBottom:20,display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.25)',borderRadius:40}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:ACCENT,animation:'pulse 2s ease-in-out infinite'}}/>
        <span style={{fontSize:12,color:ACCENT,letterSpacing:'2px',textTransform:'uppercase',fontFamily:'Crimson Pro,serif'}}>Mathematics · Chapter 12</span>
      </div>
      <div style={{opacity:phase>=2?1:0,transform:phase>=2?'translateY(0)':'translateY(20px)',transition:'all 0.7s ease 0.1s',marginBottom:28}}>
        <h1 style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:'clamp(28px,9vw,76px)',color:'#fff',letterSpacing:'-2px',lineHeight:0.92}}>Introduction to<br/><span style={{color:ACCENT}}>3D Geometry</span></h1>
        <div style={{height:3,width:80,background:`linear-gradient(90deg,${ACCENT},#818CF8,transparent)`,margin:'16px auto 0',borderRadius:2}}/>
      </div>
      <div style={{opacity:phase>=3?1:0,transition:'all 0.6s ease',maxWidth:560,marginBottom:40}}>
        <p style={{fontFamily:'Crimson Pro,serif',fontSize:19,color:'rgba(255,255,255,0.7)',lineHeight:1.55,marginBottom:18,fontStyle:'italic'}}>"Space has three dimensions — and every point in it has a unique (x,y,z) address waiting to be found."</p>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 24px',textAlign:'left'}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:12,fontFamily:'JetBrains Mono,monospace'}}>Chapter Overview</div>
          <p style={{fontFamily:'Crimson Pro,serif',fontSize:16,color:'rgba(255,255,255,0.6)',lineHeight:1.75}}>From coordinate axes and octant sign conventions through distance, section and centroid formulas — to direction cosines, vector lines and planes — to JEE-level perpendicular projections, mirror images, coplanarity, angles, bisector planes and spheres — culminating in scalar triple products, tetrahedral geometry, barycentric coordinates, Euler's brick and spatial rotation matrices.</p>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginTop:20}}>
          {['Class 11 → Olympiad','22 Topics','4 Levels','Quiz-Gated Progress'].map(t=>(
            <span key={t} style={{padding:'4px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,fontSize:12,color:'rgba(255,255,255,0.5)',fontFamily:'Crimson Pro,serif'}}>{t}</span>
          ))}
        </div>
      </div>
      {phase>=3&&<button onClick={onNext} className="btn" style={{padding:'16px 48px',background:`linear-gradient(135deg,${ACCENT},#818CF8)`,color:'#fff',border:'none',borderRadius:50,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,boxShadow:`0 8px 30px ${ACCENT}44`,animation:'fadeUp 0.5s ease both'}}>Begin Chapter →</button>}
    </div>
  );
}

// ── Notation Screen ────────────────────────────────────────────
function NotationScreen({ onNext }) {
  const [revealed,setRevealed]=useState(false);
  useEffect(()=>{setTimeout(()=>setRevealed(true),100);},[]);
  const groups=[
    {title:'Coordinates & Distance',color:ACCENT,rows:NOTATION.slice(0,6)},
    {title:'Direction Vectors & Lines',color:'#818CF8',rows:NOTATION.slice(6,11)},
    {title:'Planes & Angles',color:'#F472B6',rows:NOTATION.slice(11,17)},
    {title:'Advanced & Olympiad Tools',color:'#FB923C',rows:NOTATION.slice(17)},
  ];
  return (
    <div style={{minHeight:'100vh',background:'#07090f',padding:'32px 16px 60px'}}>
      <div style={{maxWidth:680,margin:'0 auto'}}>
        <div style={{marginBottom:32,opacity:revealed?1:0,transition:'opacity 0.5s ease'}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'2px',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>Before We Begin</div>
          <h2 style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:34,color:'#fff',letterSpacing:'-1px',marginBottom:10}}>Notation Guide</h2>
          <p style={{fontFamily:'Crimson Pro,serif',fontSize:16,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>These symbols span the full range — from ordered triples and the distance formula to scalar triple products, barycentric coordinates, and spatial rotation matrices.</p>
        </div>
        {groups.map((g,gi)=>(
          <div key={g.title} style={{marginBottom:24,opacity:revealed?1:0,transform:revealed?'translateY(0)':'translateY(16px)',transition:`all 0.5s ease ${gi*0.1+0.2}s`}}>
            <div style={{fontSize:11,color:g.color,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:10,display:'flex',alignItems:'center',gap:8}}><div style={{width:20,height:2,background:g.color,borderRadius:1}}/>{g.title}</div>
            <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden'}}>
              {g.rows.map((row,ri)=>(
                <div key={ri} style={{display:'grid',gridTemplateColumns:'130px 1fr',borderBottom:ri<g.rows.length-1?'1px solid rgba(255,255,255,0.05)':'none',padding:'10px 16px',alignItems:'center',gap:8}}>
                  <div style={{color:g.color,overflowX:'auto'}}><KTex l={row.sym}/></div>
                  <div><div style={{fontFamily:'Crimson Pro,serif',fontWeight:600,fontSize:13,color:'#fff',marginBottom:2}}>{row.name}</div><div style={{fontFamily:'Crimson Pro,serif',fontSize:12,color:'rgba(255,255,255,0.4)',fontStyle:'italic'}}>{row.meaning}</div></div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{background:`linear-gradient(135deg,${ACCENT}10,${ACCENT}05)`,border:`1px solid ${ACCENT}25`,borderRadius:14,padding:'16px 20px',marginBottom:28}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>Quiz-Gated Progress</div>
          <p style={{fontFamily:'Crimson Pro,serif',fontSize:14,color:'rgba(255,255,255,0.55)',lineHeight:1.6}}>Click <strong style={{color:'#fff'}}>Done → Quiz</strong> on any topic to face <strong style={{color:ACCENT}}>4 questions</strong>. Answer all 4 correctly to unlock the next topic.</p>
        </div>
        <button onClick={onNext} className="btn" style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${ACCENT},#818CF8)`,color:'#fff',border:'none',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,boxShadow:`0 6px 24px ${ACCENT}44`}}>Start Learning →</button>
      </div>
    </div>
  );
}

// ── Section Menu ───────────────────────────────────────────────
function SectionMenuScreen({ onSelect, completedIds }) {
  const levels=['Foundation','Advanced','JEE','Olympiad'];
  const lColors={Foundation:'#38BDF8',Advanced:'#818CF8',JEE:'#F472B6',Olympiad:'#FB923C'};
  const lDesc={Foundation:'Class 11 · Core Coordinates & Distance',Advanced:'🚀 Lines, Planes & Direction Vectors',JEE:'🏆 JEE Advanced Spatial Analysis',Olympiad:'🌌 Math Olympiad · Vector Geometry'};
  return (
    <div style={{minHeight:'100vh',background:'#07090f',padding:'28px 16px 60px'}}>
      <div style={{maxWidth:660,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:ACCENT,textTransform:'uppercase',letterSpacing:'2px',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>Introduction to 3D Geometry</div>
          <h2 style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:30,color:'#fff',letterSpacing:'-0.8px',marginBottom:6}}>Choose a Topic</h2>
          <p style={{fontFamily:'Crimson Pro,serif',fontSize:15,color:'rgba(255,255,255,0.4)',marginBottom:14}}>Pass the quiz gate to unlock each next topic.</p>
          <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:4,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(completedIds.size/SECTIONS.length)*100}%`,background:`linear-gradient(90deg,${ACCENT},#818CF8,#F472B6,#FB923C)`,borderRadius:4,transition:'width 0.5s ease'}}/>
          </div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',marginTop:6,textAlign:'right'}}>{completedIds.size}/{SECTIONS.length} completed</div>
        </div>
        {levels.map(level=>(
          <div key={level} style={{marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:lColors[level]}}/>
              <span style={{fontSize:13,color:lColors[level],fontWeight:600,fontFamily:'Crimson Pro,serif',textTransform:'uppercase',letterSpacing:'1px'}}>{level}</span>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.3)',fontFamily:'Crimson Pro,serif'}}>— {lDesc[level]}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {SECTIONS.filter(s=>s.level===level).map((sec)=>{
                const done=completedIds.has(sec.id);
                const secIdx=SECTIONS.indexOf(sec);
                const locked=secIdx>0&&!completedIds.has(SECTIONS[secIdx-1].id);
                return (
                  <button key={sec.id} onClick={()=>!locked&&onSelect(sec)} className={locked?'':'btn'}
                    style={{background:done?`${lColors[level]}12`:locked?'rgba(255,255,255,0.015)':'rgba(255,255,255,0.025)',border:`1px solid ${done?lColors[level]+'44':locked?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.08)'}`,borderRadius:12,padding:'14px 18px',textAlign:'left',display:'flex',alignItems:'center',gap:14,opacity:locked?0.5:1,cursor:locked?'default':'pointer'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:done?`${lColors[level]}25`:locked?'rgba(255,255,255,0.05)':`${lColors[level]}15`,border:`1px solid ${done?lColors[level]+'55':locked?'rgba(255,255,255,0.08)':`${lColors[level]}30`}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:locked?20:11,color:done?lColors[level]:locked?'rgba(255,255,255,0.2)':lColors[level],fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>
                      {done?'✓':locked?'🔒':sec.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15,color:done?lColors[level]:locked?'rgba(255,255,255,0.3)':'#fff',marginBottom:2}}>{sec.title}</div>
                      <div style={{fontFamily:'Crimson Pro,serif',fontSize:13,color:locked?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.4)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{locked?'Complete previous topic to unlock':sec.shortDef}</div>
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

// ── Learn Screen ───────────────────────────────────────────────
function SectionLearnScreen({ section, onPractice, onBack }) {
  const [tab,setTab]=useState('learn');
  const lColors={Foundation:'#38BDF8',Advanced:'#818CF8',JEE:'#F472B6',Olympiad:'#FB923C'};
  const col=lColors[section.level]||ACCENT;
  return (
    <div style={{minHeight:'100vh',background:'#07090f',paddingBottom:80}}>
      <div style={{position:'sticky',top:0,zIndex:30,background:'rgba(7,9,15,0.96)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onBack} className="btn" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',borderRadius:8,padding:'6px 13px',fontSize:13}}>← Topics</button>
        <div style={{flex:1}}><div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{section.title}</div><div style={{fontSize:11,color:col,fontFamily:'JetBrains Mono,monospace'}}>{section.level}</div></div>
      </div>
      <div style={{maxWidth:660,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{display:'flex',gap:4,marginBottom:24,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:4}}>
          {['learn','keys'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="btn" style={{flex:1,padding:'9px',borderRadius:8,border:'none',background:tab===t?col:'transparent',color:tab===t?'#fff':'rgba(255,255,255,0.5)',fontFamily:'Crimson Pro,serif',fontWeight:600,fontSize:14}}>
              {t==='learn'?'📖 Explanation':'🔑 Key Facts'}
            </button>
          ))}
        </div>
        {tab==='learn'&&(
          <div className="fade-in">
            <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:22}}>
              <div style={{width:56,height:56,borderRadius:14,background:`${col}15`,border:`1px solid ${col}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:col,fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{section.icon}</div>
              <p style={{fontFamily:'Playfair Display,serif',fontSize:17,color:'#fff',fontStyle:'italic',lineHeight:1.5}}>"{section.shortDef}"</p>
            </div>
            {section.diagram==='axes3d'&&(
              <div style={{marginBottom:22,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:16,overflowX:'auto'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',textAlign:'center',marginBottom:10,textTransform:'uppercase',letterSpacing:'1px'}}>3D Coordinate System · Isometric View</div>
                <CoordAxesSVG color={col} size={300}/>
              </div>
            )}
            {section.diagram==='plane3d'&&(
              <div style={{marginBottom:22,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:16,overflowX:'auto'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'JetBrains Mono,monospace',textAlign:'center',marginBottom:10,textTransform:'uppercase',letterSpacing:'1px'}}>Plane in 3D Space · Intercept Form</div>
                <PlaneSVG color={col} size={300}/>
              </div>
            )}
            <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'20px 22px'}}>
              <div style={{fontSize:10,color:col,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>Full Explanation</div>
              <p style={{fontFamily:'Crimson Pro,serif',fontSize:17,color:'rgba(255,255,255,0.75)',lineHeight:1.8}}>{section.fullDef}</p>
            </div>
          </div>
        )}
        {tab==='keys'&&(
          <div className="fade-in">
            {section.keyFacts.map((fact,i)=>(
              <div key={i} style={{display:'flex',gap:12,marginBottom:14,alignItems:'flex-start',animation:`fadeUp 0.4s ease ${i*0.07}s both`}}>
                <div style={{width:26,height:26,borderRadius:8,background:`${col}18`,border:`1px solid ${col}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:col,fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'Crimson Pro,serif',fontSize:14,color:'rgba(255,255,255,0.55)',marginBottom:4}}>{fact.text}</div>
                  <div style={{background:`${col}0d`,border:`1px solid ${col}22`,borderRadius:8,padding:'8px 12px',overflowX:'auto'}}><KTex l={fact.l} style={{color:col,fontSize:15}}/></div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:32}}>
          <button onClick={onPractice} className="btn" style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${col},${col}bb)`,color:'#fff',border:'none',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,boxShadow:`0 6px 24px ${col}44`}}>⚡ Practice Questions →</button>
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
  const lColors={Foundation:'#38BDF8',Advanced:'#818CF8',JEE:'#F472B6',Olympiad:'#FB923C'};
  const col=lColors[section.level]||ACCENT;
  const gen=GENERATORS[section.genKey]||GENERATORS.g3d_axes;
  const seed=baseSeed+qIdx*97;
  const question=useCallback(()=>{try{return gen(seed);}catch(e){return{question:'Practice question loading…',steps:['Review the concept'],answer:'See explanation',answerLatex:'',tip:'Review the key facts for this topic.'};}},[seed])();
  const next=()=>{setQIdx(i=>i+1);setShowAnswer(false);setShowSteps(false);setCount(c=>c+1);};
  return (
    <div style={{minHeight:'100vh',background:'#07090f',paddingBottom:80}}>
      <div style={{position:'sticky',top:0,zIndex:30,background:'rgba(7,9,15,0.96)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <button onClick={onBack} className="btn" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',borderRadius:8,padding:'6px 13px',fontSize:13}}>← Learn</button>
          <div style={{flex:1,fontFamily:'Playfair Display,serif',fontSize:14,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{section.title}</div>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:col,background:`${col}15`,padding:'4px 10px',borderRadius:20,flexShrink:0}}>Q {count+1}</div>
          <button onClick={onStartQuiz} className="btn" style={{background:`${col}20`,border:`1px solid ${col}55`,color:col,borderRadius:8,padding:'6px 13px',fontSize:13,fontWeight:700,flexShrink:0}}>Done → Quiz ✓</button>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'Crimson Pro,serif',fontStyle:'italic'}}>Infinite practice · Click "Done → Quiz" when ready</div>
      </div>
      <div style={{maxWidth:660,margin:'0 auto',padding:'24px 16px'}}>
        <div key={qIdx} className="fade-up" style={{background:'rgba(255,255,255,0.025)',border:`1px solid ${col}30`,borderRadius:16,overflow:'hidden',marginBottom:18}}>
          <div style={{background:`${col}10`,borderBottom:`1px solid ${col}20`,padding:'10px 18px',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:col,animation:'pulse 2s ease-in-out infinite'}}/>
            <span style={{fontSize:11,color:col,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace'}}>Practice · {section.level}</span>
          </div>
          <div style={{padding:'20px 20px 22px'}}>
            <p style={{fontFamily:'Crimson Pro,serif',fontSize:17,color:'#e2e8f0',lineHeight:1.75,marginBottom:12}}>{question.question}</p>
            {question.questionLatex&&(<div style={{background:`${col}0d`,border:`1px solid ${col}20`,borderRadius:10,padding:'12px 16px',overflowX:'auto'}}><KTex l={question.questionLatex} style={{color:col,fontSize:15}}/></div>)}
          </div>
        </div>
        {!showAnswer&&(
          <div style={{display:'flex',gap:10,marginBottom:14}}>
            <button onClick={()=>setShowSteps(v=>!v)} className="btn" style={{flex:1,padding:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.7)',fontFamily:'Crimson Pro,serif',fontSize:15}}>{showSteps?'🙈 Hide Steps':'💡 Show Steps'}</button>
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
            {question.tip&&(<div style={{background:'rgba(255,209,102,0.06)',border:'1px solid rgba(255,209,102,0.2)',borderRadius:12,padding:'12px 16px',marginBottom:20,display:'flex',gap:10}}><span style={{fontSize:16,flexShrink:0}}>💡</span><p style={{fontFamily:'Crimson Pro,serif',fontStyle:'italic',fontSize:14,color:'rgba(255,209,102,0.85)',lineHeight:1.6}}>{question.tip}</p></div>)}
            <button onClick={next} className="btn" style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${col},${col}bb)`,color:'#fff',border:'none',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,boxShadow:`0 6px 24px ${col}40`}}>Next Question ⟶</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quiz Screen ────────────────────────────────────────────────
function QuizScreen({ section, onPass, onFail, onBack }) {
  const lColors={Foundation:'#38BDF8',Advanced:'#818CF8',JEE:'#F472B6',Olympiad:'#FB923C'};
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
  const quizGen=QUIZ_GENERATORS[section.genKey]||QUIZ_GENERATORS.g3d_axes;
  const qSeed=baseSeed+qIdx*113;
  const question=useCallback(()=>{let q;let tries=0;do{try{q=quizGen(qSeed+tries*7);}catch{q=null;}tries++;}while((!q||!q.q||!q.opts||q.opts.length<2)&&tries<10);if(!q||!q.q)return{q:`l²+m²+n²=?`,opts:['1','0','2','3'],correct:'1',tip:'Fundamental DC identity.'};return q;},[qSeed])();
  const opts=question.opts.slice(0,4);
  const confirm=()=>{if(selected===null)return;const isCorrect=String(selected)===String(question.correct);setConfirmed(true);if(isCorrect)setScore(s=>s+1);else setShakeKey(k=>k+1);setResults(r=>[...r,{correct:isCorrect,question:question.q}]);};
  const goNext=()=>{if(qIdx+1>=TOTAL)setFinished(true);else{setQIdx(i=>i+1);setSelected(null);setConfirmed(false);}};
  if(finished){
    const passed=score===TOTAL;
    return (
      <div style={{minHeight:'100vh',background:'#07090f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 20px',textAlign:'center'}}>
        <div className="pop-in" style={{maxWidth:420,width:'100%'}}>
          {passed?<TrophySVG col={col}/>:(
            <svg width="72" height="72" viewBox="0 0 72 72" style={{display:'block',margin:'0 auto'}}><defs><radialGradient id="fg3"><stop offset="0%" stopColor="#EF4444" stopOpacity="0.25"/><stop offset="100%" stopColor="#EF4444" stopOpacity="0"/></radialGradient></defs><circle cx="36" cy="36" r="36" fill="url(#fg3)"/><circle cx="36" cy="36" r="28" fill="none" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.4"/><text x="36" y="44" textAnchor="middle" fontSize="32" fontFamily="JetBrains Mono" fill="#EF4444">✗</text></svg>
          )}
          <div style={{marginTop:20,fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:28,color:passed?'#fff':'#EF4444',marginBottom:10}}>{passed?'Topic Mastered! 🎯':`${score}/4 Correct`}</div>
          <div style={{fontFamily:'Crimson Pro,serif',fontSize:16,color:'rgba(255,255,255,0.55)',marginBottom:24,lineHeight:1.6}}>{passed?`Perfect score! "${section.title}" mastered.`:`${score} of 4 correct. Need all 4. Review and retry.`}</div>
          {results.map((r,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:r.correct?'rgba(52,211,153,0.08)':'rgba(239,68,68,0.08)',border:`1px solid ${r.correct?'rgba(52,211,153,0.2)':'rgba(239,68,68,0.2)'}`,borderRadius:8,marginBottom:6,textAlign:'left'}}><span style={{fontSize:16}}>{r.correct?'✅':'❌'}</span><span style={{fontFamily:'Crimson Pro,serif',fontSize:13,color:'rgba(255,255,255,0.6)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Q{i+1}: {r.question.substring(0,55)}{r.question.length>55?'…':''}</span></div>))}
          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:20}}>
            {passed?(<button onClick={onPass} className="btn" style={{padding:'14px',background:`linear-gradient(135deg,${col},${col}bb)`,color:'#fff',border:'none',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16}}>Continue to Next Topic →</button>):(
              <button onClick={onFail} className="btn" style={{padding:'14px',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#FCA5A5',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16}}>Review Topic & Retry</button>
            )}
            <button onClick={onBack} className="btn" style={{padding:'12px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.6)',borderRadius:12,fontFamily:'Crimson Pro,serif',fontSize:15}}>← Back to Topics</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{minHeight:'100vh',background:'#07090f',paddingBottom:60}}>
      <div style={{position:'sticky',top:0,zIndex:30,background:'rgba(7,9,15,0.96)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <button onClick={onBack} className="btn" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',borderRadius:8,padding:'6px 13px',fontSize:13}}>✕ Exit</button>
          <div style={{flex:1,fontFamily:'Playfair Display,serif',fontSize:15,color:'#fff',fontWeight:700}}>Quiz: {section.title}</div>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:13,color:col}}>{qIdx+1}/{TOTAL}</div>
        </div>
        <div style={{display:'flex',gap:6,justifyContent:'center'}}>
          {Array.from({length:TOTAL},(_,i)=>(<div key={i} style={{width:i===qIdx?28:10,height:10,borderRadius:5,background:i<qIdx?col:i===qIdx?col:'rgba(255,255,255,0.12)',transition:'all 0.3s ease',opacity:i<=qIdx?1:0.5}}/>))}
        </div>
      </div>
      <div style={{maxWidth:600,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{background:`${col}10`,border:`1px solid ${col}30`,borderRadius:10,padding:'8px 14px',marginBottom:18,display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:16}}>🔐</span><span style={{fontFamily:'Crimson Pro,serif',fontSize:13,color:col,fontStyle:'italic'}}>Answer all {TOTAL} correctly to unlock the next topic.</span></div>
        <div key={qIdx} className="fade-up" style={{background:'rgba(255,255,255,0.025)',border:`1px solid ${col}30`,borderRadius:16,padding:'20px 20px 24px',marginBottom:18}}>
          <div style={{fontSize:10,color:`${col}99`,textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'JetBrains Mono,monospace',marginBottom:12}}>Question {qIdx+1} of {TOTAL}</div>
          <p style={{fontFamily:'Crimson Pro,serif',fontSize:17,color:'#e2e8f0',lineHeight:1.75}}>{question.q}</p>
        </div>
        <div key={`opts-${shakeKey}`} style={{display:'flex',flexDirection:'column',gap:10,marginBottom:18}} className={confirmed&&String(selected)!==String(question.correct)?'shake':''}>
          {opts.map((opt,i)=>{
            const isSel=String(selected)===String(opt);
            const isCorr=String(opt)===String(question.correct);
            let bg='rgba(255,255,255,0.04)',brd='1px solid rgba(255,255,255,0.1)',clr='rgba(255,255,255,0.8)';
            if(confirmed){if(isCorr){bg='rgba(52,211,153,0.12)';brd='1px solid rgba(52,211,153,0.5)';clr='#34D399';}else if(isSel){bg='rgba(239,68,68,0.12)';brd='1px solid rgba(239,68,68,0.5)';clr='#FCA5A5';}}
            else if(isSel){bg=`${col}18`;brd=`1px solid ${col}66`;clr=col;}
            return (
              <button key={i} onClick={()=>!confirmed&&setSelected(opt)} className={!confirmed?'btn':''} disabled={confirmed}
                style={{background:bg,border:brd,borderRadius:12,padding:'14px 18px',textAlign:'left',color:clr,fontFamily:'Crimson Pro,serif',fontSize:16,display:'flex',alignItems:'center',gap:12,cursor:confirmed?'default':'pointer',transition:'all 0.15s ease'}}>
                <div style={{width:28,height:28,borderRadius:8,background:isSel&&!confirmed?`${col}25`:confirmed&&isCorr?'rgba(52,211,153,0.2)':confirmed&&isSel?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)',border:`1px solid ${isSel&&!confirmed?col+'66':confirmed&&isCorr?'rgba(52,211,153,0.5)':confirmed&&isSel?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontFamily:'JetBrains Mono,monospace',flexShrink:0,color:isSel&&!confirmed?col:confirmed&&isCorr?'#34D399':confirmed&&isSel?'#FCA5A5':'rgba(255,255,255,0.4)'}}>{confirmed?(isCorr?'✓':isSel?'✗':['A','B','C','D'][i]):['A','B','C','D'][i]}</div>
                <span>{String(opt)}</span>
              </button>
            );
          })}
        </div>
        {confirmed&&question.tip&&(<div className="fade-up" style={{background:'rgba(255,209,102,0.06)',border:'1px solid rgba(255,209,102,0.2)',borderRadius:12,padding:'12px 16px',marginBottom:16,display:'flex',gap:10}}><span style={{fontSize:16,flexShrink:0}}>💡</span><p style={{fontFamily:'Crimson Pro,serif',fontStyle:'italic',fontSize:14,color:'rgba(255,209,102,0.85)',lineHeight:1.6}}>{question.tip}</p></div>)}
        {!confirmed?(<button onClick={confirm} disabled={selected===null} className="btn" style={{width:'100%',padding:'14px',background:selected!==null?`linear-gradient(135deg,${col},${col}bb)`:'rgba(255,255,255,0.06)',border:selected!==null?'none':'1px solid rgba(255,255,255,0.1)',color:selected!==null?'#fff':'rgba(255,255,255,0.3)',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16,opacity:selected===null?0.6:1,cursor:selected===null?'not-allowed':'pointer'}}>Submit Answer</button>):(<button onClick={goNext} className="btn" style={{width:'100%',padding:'14px',background:`linear-gradient(135deg,${col},${col}bb)`,color:'#fff',border:'none',borderRadius:12,fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16}}>{qIdx+1<TOTAL?`Next (${qIdx+2}/${TOTAL}) →`:'See Results →'}</button>)}
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
  const handleFail=()=>setScreen('learn');
  if(screen==='cover')    return <CoverScreen onNext={()=>setScreen('notation')}/>;
  if(screen==='notation') return <NotationScreen onNext={()=>setScreen('menu')}/>;
  if(screen==='menu')     return <SectionMenuScreen completedIds={completedIds} onSelect={sec=>{setActiveIdx(SECTIONS.indexOf(sec));setScreen('learn');}}/>;
  if(screen==='learn')    return <SectionLearnScreen section={activeSection} onBack={()=>setScreen('menu')} onPractice={()=>setScreen('practice')}/>;
  if(screen==='practice') return <PracticeScreen section={activeSection} onBack={()=>setScreen('learn')} onStartQuiz={()=>setScreen('quiz')}/>;
  if(screen==='quiz')     return <QuizScreen section={activeSection} onPass={handlePass} onFail={handleFail} onBack={()=>setScreen('menu')}/>;
  return <CoverScreen onNext={()=>setScreen('notation')}/>;
}


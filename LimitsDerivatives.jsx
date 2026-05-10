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
const ACCENT = '#3B82F6';

function fact(n){if(n<=1)return 1;let r=1;for(let i=2;i<=n;i++)r*=i;return r;}
function C(n,r){if(r<0||r>n)return 0;return Math.round(fact(n)/(fact(r)*fact(n-r)));}
function shuffle(arr,seed){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(sr(seed*i+i)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const deg2rad = d => d*Math.PI/180;
const gcd = (a,b) => b===0?Math.abs(a):gcd(b,a%b);

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

// ── Function Graph SVG ─────────────────────────────────────────
function FnGraphSVG({ fn, xRange=[-3,3], yRange=[-3,3], color=ACCENT, size=300, label='', vlines=[], hlines=[], dots=[] }) {
  const W=size, H=size*0.6, padL=28, padR=12, padT=12, padB=24;
  const gW=W-padL-padR, gH=H-padT-padB;
  const toSX=x=>padL+((x-xRange[0])/(xRange[1]-xRange[0]))*gW;
  const toSY=y=>padT+gH-((y-yRange[0])/(yRange[1]-yRange[0]))*gH;
  const xs=Array.from({length:300},(_,i)=>xRange[0]+i*(xRange[1]-xRange[0])/299);
  const segments=[]; let cur=[];
  xs.forEach(x=>{
    try{
      const y=fn(x);
      if(isFinite(y)&&y>=yRange[0]-0.5&&y<=yRange[1]+0.5) cur.push(`${toSX(x).toFixed(1)},${toSY(y).toFixed(1)}`);
      else{ if(cur.length>1) segments.push(cur); cur=[]; }
    }catch{ if(cur.length>1) segments.push(cur); cur=[]; }
  });
  if(cur.length>1) segments.push(cur);
  const x0=toSX(0), y0=toSY(0);
  return (
    <svg width={W} height={H+20} style={{display:'block',margin:'0 auto'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      <line x1={padL} y1={y0} x2={W-padR} y2={y0} stroke="rgba(255,255,255,0.18)" strokeWidth={1}/>
      <line x1={x0} y1={padT} x2={x0} y2={H-padB} stroke="rgba(255,255,255,0.18)" strokeWidth={1}/>
      {[-2,-1,1,2].map(v=>(<g key={v}><line x1={toSX(v)} y1={padT} x2={toSX(v)} y2={H-padB} stroke="rgba(255,255,255,0.05)" strokeWidth={1}/><line x1={padL} y1={toSY(v)} x2={W-padR} y2={toSY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1}/></g>))}
      {vlines.map((v,i)=><line key={i} x1={toSX(v)} y1={padT} x2={toSX(v)} y2={H-padB} stroke={`${color}66`} strokeWidth={1.5} strokeDasharray="5,3"/>)}
      {hlines.map((v,i)=><line key={i} x1={padL} y1={toSY(v)} x2={W-padR} y2={toSY(v)} stroke={`${color}44`} strokeWidth={1} strokeDasharray="4,3"/>)}
      {segments.map((seg,i)=><polyline key={i} points={seg.join(' ')} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>)}
      {dots.map((d,i)=><circle key={i} cx={toSX(d[0])} cy={toSY(d[1])} r={d[2]||5} fill={d[3]||color} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5}/>)}
      {label&&<text x={W/2} y={H+16} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={10} fontFamily="Crimson Pro,serif" fontStyle="italic">{label}</text>}
    </svg>
  );
}

// ── Tangent Line SVG ───────────────────────────────────────────
function TangentSVG({ fn, x0, color=ACCENT, size=280 }) {
  const h=1e-6, slope=(fn(x0+h)-fn(x0-h))/(2*h);
  const y0=fn(x0);
  const xRange=[x0-2,x0+2], yRange=[y0-3,y0+3];
  return (
    <FnGraphSVG fn={fn} xRange={xRange} yRange={yRange} color={color} size={size}
      label={`f'(${fmt(x0,2)}) = ${fmt(slope,4)}`}
      vlines={[x0]} dots={[[x0,y0,6,color]]}
      hlines={[]}
    />
  );
}

// ── Trophy SVG ────────────────────────────────────────────────
function TrophySVG({ col=ACCENT }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="bgGLD" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={col} stopOpacity="0.25"/><stop offset="100%" stopColor={col} stopOpacity="0"/></radialGradient>
        <linearGradient id="trGLD" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#93C5FD"/><stop offset="50%" stopColor="#3B82F6"/><stop offset="100%" stopColor="#1D4ED8"/></linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#bgGLD)"/>
      <circle cx="36" cy="36" r="32" fill="none" stroke={col} strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M24 18 h24 l-4 20 Q36 44 36 44 Q36 44 28 38 Z" fill="url(#trGLD)" opacity="0.95"/>
      <path d="M24 22 Q16 22 16 30 Q16 36 24 36" fill="none" stroke="url(#trGLD)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 22 Q56 22 56 30 Q56 36 48 36" fill="none" stroke="url(#trGLD)" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="33" y="44" width="6" height="8" rx="1" fill="#3B82F6" opacity="0.9"/>
      <rect x="27" y="52" width="18" height="4" rx="2" fill="url(#trGLD)"/>
      <polygon points="36,21 37.5,25.5 42,25.5 38.5,28 40,32.5 36,30 32,32.5 33.5,28 30,25.5 34.5,25.5" fill="#DBEAFE" opacity="0.95"/>
      <circle cx="16" cy="16" r="2.5" fill={col} opacity="0.9"/>
      <circle cx="56" cy="16" r="2" fill="#93C5FD" opacity="0.9"/>
      <circle cx="14" cy="48" r="1.8" fill="#1D4ED8" opacity="0.8"/>
      <circle cx="58" cy="48" r="2.2" fill={col} opacity="0.8"/>
      <circle cx="36" cy="10" r="2" fill="#93C5FD" opacity="0.7"/>
      <rect x="10" y="22" width="3" height="7" rx="1.5" fill="#BFDBFE" opacity="0.8" transform="rotate(-25 11.5 25.5)"/>
      <rect x="59" y="28" width="3" height="7" rx="1.5" fill="#60A5FA" opacity="0.8" transform="rotate(20 60.5 31.5)"/>
    </svg>
  );
}
// ── Notation Table
const NOTATION = [
  { sym:'\\lim_{x\\to a}f(x)', name:'Limit of f(x)', meaning:'Value f(x) approaches as x gets close to a', ex:'\\lim_{x\\to 2}(x^2)=4' },
  { sym:'\\lim_{x\\to a^-}f(x)', name:'Left-Hand Limit (LHL)', meaning:'Limit as x approaches a from the left', ex:'\\lim_{x\\to 0^-}|x|/x=-1' },
  { sym:'\\lim_{x\\to a^+}f(x)', name:'Right-Hand Limit (RHL)', meaning:'Limit as x approaches a from the right', ex:'\\lim_{x\\to 0^+}|x|/x=+1' },
  { sym:'\\lim_{x\\to 0}\\frac{\\sin x}{x}=1', name:'Standard Trig Limit', meaning:'Most important trigonometric limit', ex:'\\lim_{x\\to 0}\\frac{\\tan x}{x}=1' },
  { sym:'\\lim_{x\\to 0}\\frac{e^x-1}{x}=1', name:'Exponential Limit', meaning:'Fundamental exponential limit', ex:'\\lim_{x\\to 0}\\frac{\\ln(1+x)}{x}=1' },
  { sym:'\\lim_{x\\to\\infty}\\left(1+\\frac{1}{x}\\right)^x=e', name:'Definition of e', meaning:'Euler number as a limit', ex:'\\lim_{x\\to 0}(1+x)^{1/x}=e' },
  { sym:"f'(x)=\\lim_{h\\to 0}\\frac{f(x+h)-f(x)}{h}", name:'Derivative (First Principle)', meaning:'Rate of change at a point', ex:"f(x)=x^2\\Rightarrow f'(x)=2x" },
  { sym:"\\frac{d}{dx}[f(g(x))]=f'(g(x))\\cdot g'(x)", name:'Chain Rule', meaning:'Derivative of a composite function', ex:"\\frac{d}{dx}\\sin(x^2)=2x\\cos(x^2)" },
  { sym:"\\frac{d}{dx}[uv]=u'v+uv'", name:'Product Rule', meaning:'Derivative of a product of two functions', ex:"\\frac{d}{dx}[xe^x]=e^x+xe^x" },
  { sym:"\\frac{d}{dx}\\left[\\frac{u}{v}\\right]=\\frac{u'v-uv'}{v^2}", name:'Quotient Rule', meaning:'Derivative of a ratio of two functions', ex:"\\frac{d}{dx}\\frac{\\sin x}{x}" },
  { sym:"\\lim\\frac{f(x)}{g(x)}=\\lim\\frac{f'(x)}{g'(x)}", name:"L'Hopital's Rule", meaning:"For 0/0 or inf/inf forms", ex:'\\lim_{x\\to 0}\\frac{\\sin x}{x}=1' },
  { sym:"f''(x)=\\frac{d^2y}{dx^2}", name:'Second Derivative', meaning:'Rate of change of slope — concavity', ex:"f(x)=x^3\\Rightarrow f''(x)=6x" },
  { sym:"f'(c)=\\frac{f(b)-f(a)}{b-a}", name:'LMVT', meaning:'At some point, instantaneous = average rate', ex:'f(x)=x^2,\\;[1,3]\\Rightarrow c=2' },
  { sym:'f(x)=\\sum\\frac{f^{(n)}(0)}{n!}x^n', name:'Maclaurin Series', meaning:'Approximate f(x) near 0 with a polynomial', ex:'e^x=1+x+x^2/2!+\\cdots' },
  { sym:'\\sin x=x-x^3/6+x^5/120-\\cdots', name:'sin x expansion', meaning:'Maclaurin series for sine', ex:'\\cos x=1-x^2/2+x^4/24-\\cdots' },
  { sym:'\\ln(1+x)=x-x^2/2+x^3/3-\\cdots', name:'ln(1+x) expansion', meaning:'Valid for |x|<=1', ex:'(1+x)^n=1+nx+\\cdots' },
  { sym:"y-y_0=f'(x_0)(x-x_0)", name:'Equation of Tangent', meaning:'Tangent line to y=f(x) at point', ex:"y=x^2\\text{ at }(1,1):\\;y=2x-1" },
  { sym:"f''(c)>0\\Rightarrow\\text{local min}", name:'Second Derivative Test', meaning:'Sign of second derivative at critical point', ex:"f''(c)<0\\Rightarrow\\text{local max}" },
  { sym:"f'(x)>0\\Rightarrow\\text{increasing}", name:'Monotonicity', meaning:'Positive derivative means increasing function', ex:"f'(x)<0\\Rightarrow\\text{decreasing}" },
  { sym:'\\int_a^b f(x)dx=\\lim\\frac{1}{n}\\sum f(r/n)', name:'Limit as Integral', meaning:'Riemann sum limit equals definite integral', ex:'\\lim\\frac{1}{n}\\sum r/n=\\int_0^1 x\\,dx=1/2' },
  { sym:'g(x)\\leq f(x)\\leq h(x)', name:'Squeeze Theorem', meaning:'If lim g = lim h = L then lim f = L', ex:'x^2\\sin(1/x)\\to0' },
  { sym:"\\frac{dy}{dx}=\\frac{dy/dt}{dx/dt}", name:'Parametric Derivative', meaning:'dy/dx for parametric equations x=f(t), y=g(t)', ex:'x=\\cos t,\\;y=\\sin t\\Rightarrow dy/dx=-\\cot t' },
];

// ── Sections
const SECTIONS = [
  {
    id:'limits_basics', title:'Limits — Intuition, LHL & RHL', level:'Foundation', color:'#3B82F6', icon:'lim',
    shortDef:'A limit describes where f(x) heads as x approaches a, even if f(a) is undefined. LHL and RHL must agree.',
    fullDef:"The limit lim(x→a) f(x)=L means f(x) gets arbitrarily close to L as x approaches a (but never equals a). The Left-Hand Limit (LHL) approaches from below; the Right-Hand Limit (RHL) from above. The limit exists if and only if LHL=RHL=L. The limit at a does NOT require f(a) to be defined. The epsilon-delta definition: for every epsilon>0, there exists delta>0 such that |x-a|<delta implies |f(x)-L|<epsilon. This is the rigorous foundation of calculus.",
    keyFacts:[
      {text:'Limit exists iff LHL = RHL', l:'\\lim_{x\\to a}f(x)=L\\Leftrightarrow\\lim_{x\\to a^-}f(x)=\\lim_{x\\to a^+}f(x)=L'},
      {text:'Limit does not require f(a) defined', l:'\\lim_{x\\to a}f(x)\\text{ can exist even if }f(a)\\text{ undefined}'},
      {text:'Example: removable discontinuity', l:'\\lim_{x\\to1}\\frac{x^2-1}{x-1}=2'},
      {text:'Epsilon-delta definition', l:'\\forall\\varepsilon>0,\\;\\exists\\delta>0:|x-a|<\\delta\\Rightarrow|f(x)-L|<\\varepsilon'},
    ], genKey:'limits_basics', diagram:'graph',
  },
  {
    id:'algebra_limits', title:'Algebra of Limits', level:'Foundation', color:'#2563EB', icon:'lim+',
    shortDef:'Limits distribute over sums, products, and quotients — when each individual limit exists.',
    fullDef:"When both lim f(x) and lim g(x) exist as x approaches a, limits distribute over all algebraic operations. Sum/difference: limit of f+g = limit of f + limit of g. Product: limit of fg = (limit of f)·(limit of g). Quotient: limit of f/g = (limit of f)/(limit of g), provided lim g(x) is not 0. Power: limit of f^n = (limit of f)^n. These rules reduce complex limit problems to simple substitution for non-indeterminate forms. The Squeeze Theorem handles cases where direct methods fail.",
    keyFacts:[
      {text:'Sum rule', l:'\\lim[f(x)+g(x)]=\\lim f(x)+\\lim g(x)'},
      {text:'Product rule', l:'\\lim[f(x)\\cdot g(x)]=\\lim f(x)\\cdot\\lim g(x)'},
      {text:'Quotient rule', l:'\\lim\\frac{f(x)}{g(x)}=\\frac{\\lim f(x)}{\\lim g(x)}\\;(\\lim g\\neq0)'},
      {text:'Polynomial substitution', l:'\\lim_{x\\to a}p(x)=p(a)\\text{ for any polynomial }p'},
      {text:'Squeeze Theorem', l:'g(x)\\leq f(x)\\leq h(x),\\;\\lim g=\\lim h=L\\Rightarrow\\lim f=L'},
    ], genKey:'algebra_limits',
  },
  {
    id:'standard_limits', title:'Standard Limits (Trig, Exp, Log)', level:'Foundation', color:'#1D4ED8', icon:'sinx/x',
    shortDef:'sin(x)/x=1, (e^x-1)/x=1, ln(1+x)/x=1, (1+x)^(1/x)=e all as x tends to 0.',
    fullDef:"These standard limits are the building blocks for JEE limit problems. None can be resolved by simple substitution — all give indeterminate forms. sin(x)/x tends to 1 as x approaches 0, proved by the Squeeze Theorem. The exponential and logarithmic limits both equal 1 as x approaches 0. The limit (1+x)^(1/x) defines e as x approaches 0. Key variants: sin(ax)/(bx) tends to a/b. tan(x)/x tends to 1. The technique is always to convert the given expression into one of these standard forms.",
    keyFacts:[
      {text:'Fundamental trig limit', l:'\\lim_{x\\to 0}\\frac{\\sin x}{x}=1'},
      {text:'tan limit', l:'\\lim_{x\\to 0}\\frac{\\tan x}{x}=1'},
      {text:'Exponential limit', l:'\\lim_{x\\to 0}\\frac{e^x-1}{x}=1'},
      {text:'Log limit', l:'\\lim_{x\\to 0}\\frac{\\ln(1+x)}{x}=1'},
      {text:'Definition of e', l:'\\lim_{x\\to 0}(1+x)^{1/x}=e'},
      {text:'General scaling', l:'\\lim_{x\\to 0}\\frac{\\sin(ax)}{bx}=\\frac{a}{b}'},
    ], genKey:'standard_limits',
  },
  {
    id:'first_principles', title:'Derivatives — First Principles', level:'Foundation', color:'#0EA5E9', icon:"f'(x)",
    shortDef:"f'(x) = lim(h→0) [f(x+h)-f(x)]/h — the slope of the tangent line at each point.",
    fullDef:"The derivative f'(x) is defined as the limit of the difference quotient. Geometrically it is the slope of the tangent line to y=f(x). Standard results from first principles: d/dx(x^n) = nx^(n-1), d/dx(sin x) = cos x, d/dx(cos x) = -sin x, d/dx(e^x) = e^x, d/dx(ln x) = 1/x. The power rule, product rule, and chain rule all follow from this definition. JEE questions often ask you to differentiate specific functions from first principles — always set up the difference quotient carefully and simplify before taking the limit.",
    keyFacts:[
      {text:'Definition', l:"f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}"},
      {text:'Power rule', l:'\\frac{d}{dx}(x^n)=nx^{n-1}'},
      {text:'Trig derivatives', l:'\\frac{d}{dx}\\sin x=\\cos x,\\;\\frac{d}{dx}\\cos x=-\\sin x'},
      {text:'Exp and log', l:'\\frac{d}{dx}e^x=e^x,\\;\\frac{d}{dx}\\ln x=\\frac{1}{x}'},
      {text:'Geometric meaning', l:"f'(x_0)=\\text{slope of tangent at }(x_0,f(x_0))"},
    ], genKey:'first_principles', diagram:'tangent',
  },
  {
    id:'continuity', title:'Continuity & Differentiability', level:'JEE', color:'#6366F1', icon:'C & D',
    shortDef:'Continuous at a: lim(x→a) f(x) = f(a). Differentiable implies continuous, not vice versa.',
    fullDef:"A function is continuous at a if: f(a) exists, the limit as x approaches a exists, and they are equal. Differentiable at a means f'(a) exists via the limit definition. Key fact: differentiable implies continuous, but continuous does not imply differentiable. The function |x| is continuous at 0 but not differentiable there (the LHD is -1 and RHD is +1). For piecewise functions at junction points, check LHL=RHL=f(a) for continuity, and LHD=RHD for differentiability. The Intermediate Value Theorem states that a continuous function on [a,b] takes every value between f(a) and f(b).",
    keyFacts:[
      {text:'Continuity at a', l:'\\lim_{x\\to a^-}f(x)=\\lim_{x\\to a^+}f(x)=f(a)'},
      {text:'Differentiable implies continuous', l:'f\\text{ diff. at }a\\Rightarrow f\\text{ cont. at }a'},
      {text:'Converse is FALSE: |x|', l:'f(x)=|x|\\text{ cont. at 0, NOT diff. at 0}'},
      {text:'LHD and RHD', l:"LHD=\\lim_{h\\to0^-}\\frac{f(a+h)-f(a)}{h}"},
      {text:'Intermediate Value Theorem', l:'f\\text{ cont on }[a,b],\\;f(a)<k<f(b)\\Rightarrow\\exists c:f(c)=k'},
    ], genKey:'continuity', diagram:'graph',
  },
  {
    id:'lhopital', title:"L'Hopital's Rule & Indeterminate Forms", level:'JEE', color:'#7C3AED', icon:'0/0',
    shortDef:"For 0/0 or inf/inf: lim f/g = lim f'/g'. Convert other indeterminate forms first.",
    fullDef:"L'Hopital's Rule resolves indeterminate forms 0/0 or infinity/infinity by differentiating numerator and denominator separately. Other indeterminate forms (0 times infinity, infinity minus infinity, 0^0, 1^infinity, infinity^0) must first be converted. For 1^infinity form: [f(x)]^g(x) has limit equal to e raised to the power of lim (f(x)-1)g(x). The rule can be applied repeatedly if the result remains indeterminate. For JEE Advanced, Taylor/Maclaurin series expansions are often faster and more elegant than repeated application of L'Hopital.",
    keyFacts:[
      {text:"L'Hopital's Rule", l:"\\frac{0}{0}\\text{ or }\\frac{\\infty}{\\infty}:\\;\\lim\\frac{f(x)}{g(x)}=\\lim\\frac{f'(x)}{g'(x)}"},
      {text:'1^infinity form', l:'\\lim[f(x)]^{g(x)}=e^{\\lim(f(x)-1)g(x)}'},
      {text:'Convert 0 times infinity', l:'f\\cdot g=\\frac{f}{1/g}\\;\\text{(then 0/0 or inf/inf)}'},
      {text:'Apply repeatedly', l:'\\lim\\frac{x^2}{e^x}=\\lim\\frac{2x}{e^x}=\\lim\\frac{2}{e^x}=0'},
      {text:'Taylor often faster', l:'\\lim_{x\\to0}\\frac{\\sin x-x}{x^3}=-\\frac{1}{6}'},
    ], genKey:'lhopital',
  },
  {
    id:'chain_rule', title:'Chain, Product & Quotient Rules', level:'JEE', color:'#8B5CF6', icon:'circ',
    shortDef:"Chain: d/dx f(g(x)) = f'(g(x)) g'(x). Product: (uv)' = u'v+uv'. Quotient: (u/v)' = (u'v-uv')/v^2.",
    fullDef:"The Chain Rule is the most used differentiation rule in JEE. For f(g(x)): differentiate the outer function at g(x) and multiply by g'(x). Product Rule: d/dx(uv) = u'v + uv'. Quotient Rule: d/dx(u/v) = (u'v - uv')/v^2. For implicit differentiation, differentiate both sides with respect to x and apply the chain rule whenever y appears: d/dx(y^2) = 2y dy/dx. Logarithmic differentiation is powerful for products of many functions: take ln of both sides, differentiate, then solve for y'.",
    keyFacts:[
      {text:'Chain Rule', l:"\\frac{d}{dx}f(g(x))=f'(g(x))\\cdot g'(x)"},
      {text:'Product Rule', l:"(uv)'=u'v+uv'"},
      {text:'Quotient Rule', l:"\\left(\\frac{u}{v}\\right)'=\\frac{u'v-uv'}{v^2}"},
      {text:'Implicit differentiation', l:"\\frac{d}{dx}y^2=2y\\frac{dy}{dx}"},
      {text:'Log differentiation', l:"y=f_1\\cdots f_k\\Rightarrow\\frac{y'}{y}=\\frac{f_1'}{f_1}+\\cdots+\\frac{f_k'}{f_k}"},
    ], genKey:'chain_rule',
  },
  {
    id:'higher_order', title:"Higher Order Derivatives & Leibniz Rule", level:'JEE', color:'#A78BFA', icon:"f''",
    shortDef:"f''(x) measures concavity. Leibniz Rule: nth derivative of product uv uses binomial coefficients.",
    fullDef:"The second derivative f''(x) = d^2y/dx^2 measures the rate of change of the slope — the concavity. f''(x)>0 means concave up (bowl shape); f''(x)<0 means concave down. Points where f''(x)=0 and concavity changes are inflection points. The Leibniz Rule for the nth derivative of a product: (uv)^(n) = sum over r from 0 to n of C(n,r) times u^(n-r) times v^(r). This is analogous to the binomial theorem and is powerful for finding high-order derivatives of products like x^2 times sin(x).",
    keyFacts:[
      {text:'Second derivative', l:"f''(x)=\\frac{d^2y}{dx^2}"},
      {text:'Concavity', l:"f''(x)>0\\Rightarrow\\text{concave up},\\;f''(x)<0\\Rightarrow\\text{concave down}"},
      {text:'Inflection point', l:"f''(c)=0\\text{ and concavity changes}"},
      {text:'Leibniz Rule', l:'(uv)^{(n)}=\\sum_{r=0}^{n}\\binom{n}{r}u^{(n-r)}v^{(r)}'},
      {text:'Second derivative test', l:"f'(c)=0,\\;f''(c)>0\\Rightarrow\\text{local min}"},
    ], genKey:'higher_order',
  },
  {
    id:'mvt', title:"Rolle's Theorem & Mean Value Theorem", level:'JEE', color:'#C084FC', icon:'MVT',
    shortDef:"Rolle's: f(a)=f(b) implies f'(c)=0 for some c. LMVT: f'(c) equals [f(b)-f(a)]/(b-a).",
    fullDef:"Rolle's Theorem: if f is continuous on [a,b], differentiable on (a,b), and f(a)=f(b), then there exists c in (a,b) where f'(c)=0. LMVT generalises this: if f is continuous on [a,b] and differentiable on (a,b), then there exists c where f'(c) equals [f(b)-f(a)]/(b-a). Geometrically, the tangent at c is parallel to the chord from (a,f(a)) to (b,f(b)). Applications include proving inequalities such as x is greater than or equal to sin(x) for x greater than or equal to 0, establishing existence of roots, and bounding functions.",
    keyFacts:[
      {text:"Rolle's Theorem", l:"f(a)=f(b)\\Rightarrow\\exists c\\in(a,b):f'(c)=0"},
      {text:'LMVT', l:"\\exists c\\in(a,b):f'(c)=\\frac{f(b)-f(a)}{b-a}"},
      {text:'Geometric meaning', l:'\\text{Tangent at }c\\parallel\\text{chord from }a\\text{ to }b'},
      {text:'Inequality proof', l:"x\\geq\\sin x\\text{ for }x\\geq0\\text{ (via MVT)}"},
      {text:"Cauchy's MVT", l:"\\frac{f(b)-f(a)}{g(b)-g(a)}=\\frac{f'(c)}{g'(c)}"},
    ], genKey:'mvt',
  },
  {
    id:'aod', title:'Applications of Derivatives (AOD)', level:'JEE', color:'#EC4899', icon:'max/min',
    shortDef:"Tangent slope = f'(x0). Increasing: f'(x)>0. Critical points: f'=0. Test with f'' for max/min.",
    fullDef:"Derivatives power three key applications in JEE. First, tangents and normals: the tangent to y=f(x) at x0 has slope f'(x0) and the normal is perpendicular with slope -1/f'(x0). Second, monotonicity: f'(x)>0 on an interval means strictly increasing; f'(x)<0 means strictly decreasing. Third, maxima and minima: at critical points where f'(x)=0, use the second derivative test — f''(c)>0 gives a local minimum, f''(c)<0 gives a local maximum. For closed intervals [a,b], also evaluate f at endpoints.",
    keyFacts:[
      {text:'Tangent', l:"y-f(x_0)=f'(x_0)(x-x_0)"},
      {text:'Normal', l:"y-f(x_0)=-\\frac{1}{f'(x_0)}(x-x_0)"},
      {text:'Increasing on interval', l:"f'(x)>0\\;\\forall x\\in I"},
      {text:'Critical point', l:"f'(c)=0\\text{ or undefined}"},
      {text:'Second derivative test', l:"f'(c)=0,\\;f''(c)>0\\Rightarrow\\text{min};\\;f''(c)<0\\Rightarrow\\text{max}"},
    ], genKey:'aod', diagram:'tangent',
  },
  {
    id:'taylor', title:'Taylor & Maclaurin Series', level:'Olympiad', color:'#F59E0B', icon:'Snaxa^n',
    shortDef:"f(x) = f(0) + f'(0)x + f''(0)x^2/2! + ... — approximate any smooth function by polynomials.",
    fullDef:"The Maclaurin series writes f(x) as an infinite polynomial: sum of f^(n)(0)/n! times x^n. Key expansions: sin x = x - x^3/6 + x^5/120 - ..., cos x = 1 - x^2/2 + x^4/24 - ..., e^x = 1 + x + x^2/2! + ..., ln(1+x) = x - x^2/2 + x^3/3 - ... for |x| at most 1, and (1+x)^n = 1 + nx + n(n-1)x^2/2! + .... In JEE Advanced, Taylor series are faster than L'Hopital for limits. For limits as x approaches 0, expand numerator and denominator to the correct power and cancel the leading terms.",
    keyFacts:[
      {text:'Maclaurin series', l:"f(x)=\\sum_{n=0}^{\\infty}\\frac{f^{(n)}(0)}{n!}x^n"},
      {text:'e^x', l:'e^x=1+x+\\frac{x^2}{2!}+\\frac{x^3}{3!}+\\cdots'},
      {text:'sin x', l:'\\sin x=x-\\frac{x^3}{3!}+\\frac{x^5}{5!}-\\cdots'},
      {text:'cos x', l:'\\cos x=1-\\frac{x^2}{2!}+\\frac{x^4}{4!}-\\cdots'},
      {text:'ln(1+x)', l:'\\ln(1+x)=x-\\frac{x^2}{2}+\\frac{x^3}{3}-\\cdots'},
      {text:'(1+x)^n', l:'(1+x)^n=1+nx+\\frac{n(n-1)}{2!}x^2+\\cdots'},
    ], genKey:'taylor',
  },
  {
    id:'sandwich', title:'Squeeze Theorem & Advanced Limits', level:'Olympiad', color:'#EF4444', icon:'g<=f<=h',
    shortDef:"If g(x)<=f(x)<=h(x) and lim g=lim h=L, then lim f=L. Handles oscillating functions and series.",
    fullDef:"The Squeeze Theorem is the tool for limits of oscillating functions and complex sequences. The classic example: since -1 is at most sin(1/x) which is at most 1, we have -x^2 at most x^2 sin(1/x) which is at most x^2. Since both x^2 and -x^2 approach 0, so does x^2 sin(1/x). For limits of Riemann sums: lim (1/n) times sum of f(r/n) equals the integral from 0 to 1 of f(x) dx. Dominance hierarchy as x approaches infinity: (ln x)^a grows much slower than x^b which grows much slower than e^(cx) which grows much slower than x^x.",
    keyFacts:[
      {text:'Squeeze Theorem', l:'g(x)\\leq f(x)\\leq h(x),\\;\\lim g=\\lim h=L\\Rightarrow\\lim f=L'},
      {text:'Classic: x^2 sin(1/x)', l:'|x^2\\sin(1/x)|\\leq x^2\\to0'},
      {text:'Dominance hierarchy', l:'(\\ln x)^a\\ll x^b\\ll e^{cx}\\ll x^x'},
      {text:'Limit of Riemann sum', l:'\\lim_{n\\to\\infty}\\frac{1}{n}\\sum_{r=1}^{n}f\\!\\left(\\frac{r}{n}\\right)=\\int_0^1 f(x)\\,dx'},
      {text:"Stolz-Cesaro (discrete L'Hopital)", l:'\\lim a_n/b_n=\\lim(a_{n+1}-a_n)/(b_{n+1}-b_n)'},
    ], genKey:'sandwich',
  },
  {
    id:'ineq_calculus', title:"Inequalities via Calculus & Jensen's", level:'Olympiad', color:'#10B981', icon:"f'>=0",
    shortDef:"Set h(x)=LHS-RHS, show h(a)=0 and h'(x)>=0. Jensen: convex f gives f(mean)<=mean of f.",
    fullDef:"Calculus transforms inequality proofs into sign analysis. The method: define h(x) = LHS - RHS, show h equals 0 at the boundary, then show h' is non-negative (or use MVT), concluding h is non-negative. This proves x is at least sin(x), ln(1+x) is at most x, e^x is at least 1+x, and many others. Jensen's Inequality: if f is convex (f''>0), then f applied to the mean of inputs is at most the mean of f applied to each input. This unifies AM-GM, power mean inequalities, and many olympiad inequalities.",
    keyFacts:[
      {text:'Inequality via derivatives', l:"h(a)=0,\\;h'(x)\\geq0\\Rightarrow h(x)\\geq0\\text{ for }x\\geq a"},
      {text:'Prove x >= sin x', l:"h(x)=x-\\sin x,\\;h(0)=0,\\;h'(x)=1-\\cos x\\geq0"},
      {text:'Prove e^x >= 1+x', l:"h(x)=e^x-1-x,\\;h(0)=0,\\;h'(x)=e^x-1\\geq0"},
      {text:"Jensen's inequality", l:"f\\text{ convex}\\Rightarrow f\\!\\left(\\frac{\\sum x_i}{n}\\right)\\leq\\frac{\\sum f(x_i)}{n}"},
      {text:'Tangent below convex curve', l:"f(y)\\geq f(x)+f'(x)(y-x)"},
    ], genKey:'ineq_calculus',
  },
  {
    id:'parametric_implicit', title:'Parametric, Implicit & Inverse Trig', level:'Olympiad', color:'#06B6D4', icon:'dy/dx',
    shortDef:'Parametric: dy/dx=(dy/dt)/(dx/dt). Implicit: differentiate F(x,y)=0 wrt x. d/dx sin^-1 x = 1/sqrt(1-x^2).',
    fullDef:"Parametric differentiation: if x=f(t) and y=g(t), then dy/dx = g'(t)/f'(t). For the second derivative, differentiate dy/dx with respect to t, then divide by dx/dt. Implicit differentiation differentiates an equation F(x,y)=0 with respect to x, applying the chain rule when y appears: d/dx of y^2 equals 2y times dy/dx. Inverse trigonometric derivatives: d/dx of arcsin(x) equals 1 over the square root of (1-x^2), d/dx of arctan(x) equals 1/(1+x^2), d/dx of arccos(x) equals -1 over the square root of (1-x^2). These require the chain rule and appear constantly in JEE.",
    keyFacts:[
      {text:'Parametric dy/dx', l:'\\frac{dy}{dx}=\\frac{dy/dt}{dx/dt}'},
      {text:'Parametric d^2y/dx^2', l:"\\frac{d^2y}{dx^2}=\\frac{d}{dt}\\!\\left(\\frac{dy}{dx}\\right)\\div\\frac{dx}{dt}"},
      {text:'Implicit rule', l:"\\frac{dy}{dx}=-\\frac{F_x}{F_y}"},
      {text:'d/dx arcsin x', l:'\\frac{d}{dx}\\sin^{-1}x=\\frac{1}{\\sqrt{1-x^2}}'},
      {text:'d/dx arctan x', l:'\\frac{d}{dx}\\tan^{-1}x=\\frac{1}{1+x^2}'},
      {text:'d/dx arccos x', l:'\\frac{d}{dx}\\cos^{-1}x=-\\frac{1}{\\sqrt{1-x^2}}'},
    ], genKey:'parametric_implicit',
  },
];
// ── Practice Generators ────────────────────────────────────────
const GENERATORS = {
  limits_basics:(n)=>{
    const mode=n%3;
    if(mode===0){
      const a=srI(n,2,6),pw=srI(n+1,2,4);
      const val=Math.pow(a,pw);
      return{question:`Evaluate: lim(x→${a}) x^${pw}`,questionLatex:`\\lim_{x\\to${a}}x^{${pw}}=?`,steps:[`Polynomial limit: just substitute x=${a}`,`lim = ${a}^${pw} = ${val}`],answer:`${val}`,answerLatex:`${val}`,tip:'For polynomials, limits equal the function value at that point — just substitute.'};
    } else if(mode===1){
      const a=srI(n+1,2,5);
      return{question:`Find LHL and RHL of f(x)=|x-${a}|/(x-${a}) at x=${a}.`,questionLatex:`\\lim_{x\\to${a}^{\\pm}}\\frac{|x-${a}|}{x-${a}}`,steps:[`LHL (x<${a}): |x-${a}|=-(x-${a}), so f(x)=-1`,`RHL (x>${a}): |x-${a}|=(x-${a}), so f(x)=+1`,`LHL=-1, RHL=+1, LHL≠RHL → limit does NOT exist`],answer:`LHL=-1, RHL=+1, limit does not exist`,answerLatex:`\\text{LHL}=-1,\\text{RHL}=+1\\Rightarrow\\text{limit DNE}`,tip:'Check LHL and RHL separately for |x| and piecewise functions. They must be equal for the limit to exist.'};
    } else {
      const a=srI(n+2,2,5);
      return{question:`lim(x→${a}) (x^2-${a*a})/(x-${a})`,questionLatex:`\\lim_{x\\to${a}}\\frac{x^2-${a*a}}{x-${a}}=?`,steps:[`Direct substitution gives 0/0 — indeterminate`,`Factor: x^2-${a*a}=(x-${a})(x+${a})`,`Cancel (x-${a}): limit = lim(x→${a})(x+${a}) = ${2*a}`],answer:`${2*a}`,answerLatex:`${2*a}`,tip:'Factor and cancel. The limit exists even though f(${a}) is undefined — it\'s a removable discontinuity.'};
    }
  },
  algebra_limits:(n)=>{
    const a=srI(n,1,5),b=srI(n+1,1,4),c=srI(n+2,2,6);
    const mode=n%4;
    if(mode===0){
      const lf=a*c+b,lg=c*c-1;
      return{question:`lim(x→${c}) [(${a}x+${b})(x²-1)]`,questionLatex:`\\lim_{x\\to${c}}(${a}x+${b})(x^2-1)`,steps:[`Use product rule: lim(fg) = lim(f)·lim(g)`,`lim(${a}x+${b}) at x=${c} = ${a*c+b}`,`lim(x²-1) at x=${c} = ${c*c-1}`,`Product = ${(a*c+b)*(c*c-1)}`],answer:`${(a*c+b)*(c*c-1)}`,answerLatex:`${(a*c+b)*(c*c-1)}`,tip:'Product rule: limit of product = product of limits (when both exist).'};
    } else if(mode===1){
      const p=srI(n+3,2,4),q=srI(n+4,1,3);
      return{question:`If lim(x→2) f(x)=${p} and lim(x→2) g(x)=${q}, find lim(x→2) [${a}f(x)+g(x)].`,questionLatex:`\\lim_{x\\to2}[${a}f(x)+g(x)]=?`,steps:[`Sum rule: lim(af+g) = a·lim(f)+lim(g)`,`= ${a}×${p}+${q}`,`= ${a*p+q}`],answer:`${a*p+q}`,answerLatex:`${a*p+q}`,tip:'Algebra of limits: lim(af+bg) = a·lim(f)+b·lim(g) when both limits exist.'};
    } else if(mode===2){
      const lo=srI(n+5,1,3),hi=srI(n+6,2,5);
      return{question:`Use Squeeze Theorem: -x^2 ≤ x^2·sin(1/x) ≤ x^2. Find lim(x→0) x^2·sin(1/x).`,questionLatex:`\\lim_{x\\to0}x^2\\sin(1/x)=?`,steps:[`Since -1 ≤ sin(1/x) ≤ 1 for all x≠0:`,`-x² ≤ x²sin(1/x) ≤ x²`,`As x→0: lim(-x²)=0 and lim(x²)=0`,`By Squeeze Theorem: lim x²sin(1/x) = 0`],answer:`0`,answerLatex:`0`,tip:'Squeeze: bound the function above and below by functions with the same limit.'};
    } else {
      const k=srI(n+7,2,5);
      return{question:`lim(x→${k}) (x^2-${k*k})/(x^2-${2*k}x+${k*k})`,questionLatex:`\\lim_{x\\to${k}}\\frac{x^2-${k*k}}{(x-${k})^2}`,steps:[`Factor: x^2-${k*k}=(x-${k})(x+${k})`,`Denominator: (x-${k})^2`,`Simplify: (x+${k})/(x-${k})→∞ as x→${k}`,`Limit is ∞ (one-sided: +∞ or -∞)`],answer:`∞ (limit does not exist as finite)`,answerLatex:`\\infty`,tip:'After cancelling, if denominator still → 0 and numerator is finite and nonzero, the limit is ±∞.'};
    }
  },
  standard_limits:(n)=>{
    const mode=n%5;
    if(mode===0){
      const k=srI(n+1,2,6);
      return{question:`lim(x→0) sin(${k}x)/(${k}x)`,questionLatex:`\\lim_{x\\to0}\\frac{\\sin(${k}x)}{${k}x}=?`,steps:[`Let u = ${k}x, so as x→0, u→0`,`= lim(u→0) sin(u)/u = 1`],answer:`1`,answerLatex:`1`,tip:'sin(kx)/(kx) → 1. Always bring the factor inside — sin(kx)/(kx) is the standard form.'};
    } else if(mode===1){
      const a=srI(n+2,2,5),b=srI(n+3,2,5);
      return{question:`lim(x→0) sin(${a}x)/sin(${b}x)`,questionLatex:`\\lim_{x\\to0}\\frac{\\sin(${a}x)}{\\sin(${b}x)}=?`,steps:[`Multiply and divide: [sin(${a}x)/(${a}x)] × [${a}x] / { [sin(${b}x)/(${b}x)] × [${b}x] }`,`= (lim sin(${a}x)/(${a}x)) × ${a}/${b} × 1/(lim sin(${b}x)/(${b}x))`,`= 1 × ${a}/${b} × 1 = ${a}/${b} = ${fmt(a/b,4)}`],answer:`${a}/${b}`,answerLatex:`\\frac{${a}}{${b}}`,tip:'sin(ax)/sin(bx) → a/b as x→0. Use the fact that sin(kx)/(kx)→1.'};
    } else if(mode===2){
      return{question:`lim(x→0) (e^x - 1)/(sin x)`,questionLatex:`\\lim_{x\\to0}\\frac{e^x-1}{\\sin x}=?`,steps:[`Write as: [(e^x-1)/x] / [sin(x)/x]`,`Numerator: (e^x-1)/x → 1`,`Denominator: sin(x)/x → 1`,`Limit = 1/1 = 1`],answer:`1`,answerLatex:`1`,tip:'Combine standard limits by multiplying and dividing by x to create the standard forms.'};
    } else if(mode===3){
      const k=srI(n+4,2,5);
      return{question:`lim(x→0) (1+${k}x)^(1/x)`,questionLatex:`\\lim_{x\\to0}(1+${k}x)^{1/x}=?`,steps:[`Write as (1+${k}x)^(1/(${k}x) × ${k})`,`= [(1+${k}x)^(1/(${k}x))]^${k}`,`As x→0: (1+u)^(1/u) → e where u=${k}x→0`,`Limit = e^${k}`],answer:`e^${k}`,answerLatex:`e^{${k}}`,tip:'(1+kx)^(1/x) = [(1+kx)^(1/(kx))]^k → e^k as x→0.'};
    } else {
      return{question:`lim(x→0) (ln(1+3x))/x`,questionLatex:`\\lim_{x\\to0}\\frac{\\ln(1+3x)}{x}=?`,steps:[`Write as 3·[ln(1+3x)/(3x)]`,`Standard limit: ln(1+u)/u → 1 as u→0`,`Here u=3x→0 as x→0`,`Limit = 3×1 = 3`],answer:`3`,answerLatex:`3`,tip:'ln(1+kx)/x = k·ln(1+kx)/(kx) → k×1 = k.'};
    }
  },
  first_principles:(n)=>{
    const mode=n%4;
    if(mode===0){
      const pw=srI(n+1,2,5);
      return{question:`Find d/dx(x^${pw}) from first principles.`,questionLatex:`\\frac{d}{dx}x^{${pw}}=\\lim_{h\\to0}\\frac{(x+h)^{${pw}}-x^{${pw}}}{h}`,steps:[`f(x+h)-f(x) = (x+h)^${pw} - x^${pw}`,`Expand: x^${pw} + ${pw}x^${pw-1}h + O(h^2) - x^${pw}`,`= ${pw}x^${pw-1}h + O(h^2)`,`Divide by h: ${pw}x^${pw-1} + O(h)`,`As h→0: limit = ${pw}x^${pw-1}`],answer:`${pw}x^${pw-1}`,answerLatex:`${pw}x^{${pw-1}}`,tip:'Power rule from first principles: use the binomial expansion and keep only the h^1 term.'};
    } else if(mode===1){
      return{question:`Find d/dx(sin x) from first principles.`,questionLatex:`\\frac{d}{dx}\\sin x=\\lim_{h\\to0}\\frac{\\sin(x+h)-\\sin x}{h}`,steps:[`sin(x+h)-sin x = sin x cos h + cos x sin h - sin x`,`= sin x(cos h - 1) + cos x sin h`,`Divide by h: sin x·(cos h-1)/h + cos x·sin h/h`,`As h→0: (cos h-1)/h → 0, sin h/h → 1`,`Limit = cos x`],answer:`cos x`,answerLatex:`\\cos x`,tip:'Use sin(A+B) expansion then the standard limits sin(h)/h→1 and (cos h-1)/h→0.'};
    } else if(mode===2){
      const a=srI(n+2,2,5);
      return{question:`f(x) = ${a}x^2. Find f'(x) from first principles.`,questionLatex:`f'(x)=\\lim_{h\\to0}\\frac{${a}(x+h)^2-${a}x^2}{h}`,steps:[`${a}(x+h)^2-${a}x^2 = ${a}(x^2+2xh+h^2)-${a}x^2`,`= ${a}(2xh+h^2) = ${2*a}xh+${a}h^2`,`Divide by h: ${2*a}x+${a}h`,`As h→0: f'(x) = ${2*a}x`],answer:`${2*a}x`,answerLatex:`${2*a}x`,tip:'Expand (x+h)^2, subtract f(x), divide by h, then take limit h→0.'};
    } else {
      return{question:`Find d/dx(e^x) from first principles.`,questionLatex:`\\frac{d}{dx}e^x=\\lim_{h\\to0}\\frac{e^{x+h}-e^x}{h}`,steps:[`(e^(x+h) - e^x)/h = e^x(e^h - 1)/h`,`Standard limit: (e^h-1)/h → 1 as h→0`,`Limit = e^x × 1 = e^x`],answer:`e^x`,answerLatex:`e^x`,tip:'e^(x+h) = e^x · e^h. Factor out e^x and use the standard limit (e^h-1)/h → 1.'};
    }
  },
  continuity:(n)=>{
    const a=srI(n,1,4),b=srI(n+1,2,6);
    const mode=n%3;
    if(mode===0){
      return{question:`f(x) = |x|. Is f differentiable at x=0? Find LHD and RHD.`,questionLatex:`f(x)=|x|.\\;LHD=?,\\;RHD=?`,steps:[`LHD: lim(h→0⁻) (f(0+h)-f(0))/h = lim h/h... wait, |h|/h`,`For h<0: |h|=-h, so |h|/h = -1`,`LHD = -1`,`For h>0: |h|=h, so |h|/h = +1`,`RHD = +1`,`LHD≠RHD → NOT differentiable at 0`],answer:`LHD=-1, RHD=+1, not differentiable at 0`,answerLatex:`LHD=-1,\\;RHD=+1\\Rightarrow\\text{not diff.}`,tip:'Differentiability requires LHD=RHD. |x| is the classic example of continuity without differentiability.'};
    } else if(mode===1){
      return{question:`f(x) = x² for x≤${a}, and ${b}x-${b-a*a} for x>${a}. Is f continuous at x=${a}?`,questionLatex:`f(x)=\\begin{cases}x^2&x\\leq${a}\\\\${b}x-${b-a*a}&x>${a}\\end{cases}`,steps:[`f(${a}) = ${a}^2 = ${a*a} (from left piece)`,`LHL: lim(x→${a}⁻) x^2 = ${a*a}`,`RHL: lim(x→${a}⁺) (${b}x-${b-a*a}) = ${b*a-(b-a*a)}`,`LHL${a*a===b*a-(b-a*a)?'=':'≠'}RHL${a*a===b*a-(b-a*a)?', and equals f('+a+') → CONTINUOUS':'→ NOT continuous'}`],answer:a*a===b*a-(b-a*a)?`Continuous at x=${a}`:`NOT continuous at x=${a}`,answerLatex:a*a===b*a-(b-a*a)?`\\text{Continuous}\\;✓`:`\\text{NOT continuous}`,tip:'Check three conditions: f(a) exists, limit exists, and they are equal. All three must hold.'};
    } else {
      return{question:`Use IVT: Does f(x) = x^3 - x - ${a} have a root in [1,2]?`,questionLatex:`f(x)=x^3-x-${a}.\\text{ Root in }[1,2]?`,steps:[`f(1) = 1-1-${a} = ${-a}`,`f(2) = 8-2-${a} = ${6-a}`,`f(1)=${-a}${-a<0?' < 0':'≥ 0'}, f(2)=${6-a}${6-a>0?' > 0':'≤ 0'}`,a<=6&&a>=1?`Since f(1)<0<f(2) and f is continuous, by IVT there exists c∈(1,2) with f(c)=0`:`f(1) and f(2) have the same sign — IVT doesn't guarantee a root in [1,2]`],answer:a<=6&&a>=1?`Yes, by IVT a root exists in (1,2)`:`IVT conditions not met for this interval`,answerLatex:a<=6&&a>=1?`\\exists c\\in(1,2):f(c)=0\\;\\text{(IVT)}`:`\\text{IVT not applicable here}`,tip:'IVT: if f is continuous and f(a) and f(b) have opposite signs, there is a root in (a,b).'};
    }
  },
  lhopital:(n)=>{
    const mode=n%4;
    if(mode===0){
      return{question:`lim(x→0) (sin x - x)/x^3 using Taylor series.`,questionLatex:`\\lim_{x\\to0}\\frac{\\sin x-x}{x^3}=?`,steps:[`Expand sin x = x - x^3/6 + x^5/120 - ...`,`sin x - x = -x^3/6 + x^5/120 - ...`,`(sin x - x)/x^3 = -1/6 + x^2/120 - ...`,`As x→0: limit = -1/6`],answer:`-1/6`,answerLatex:`-\\frac{1}{6}`,tip:'Taylor series beats L\'Hopital here. Expand sin x to x^3 order, subtract x, divide by x^3.'};
    } else if(mode===1){
      return{question:`lim(x→0) (e^x - 1 - x)/x^2 using L'Hopital.`,questionLatex:`\\lim_{x\\to0}\\frac{e^x-1-x}{x^2}=?\\;(0/0)`,steps:[`0/0 form. Apply L'Hopital: differentiate top and bottom`,`Numerator': e^x - 1. Denominator': 2x. Still 0/0.`,`Apply again: Numerator'': e^x. Denominator'': 2`,`Limit = e^0/2 = 1/2`],answer:`1/2`,answerLatex:`\\frac{1}{2}`,tip:"L'Hopital can be applied repeatedly. Check for 0/0 or ∞/∞ each time before applying."};
    } else if(mode===2){
      return{question:`lim(x→0+) x ln(x)  (form: 0·(-∞))`,questionLatex:`\\lim_{x\\to0^+}x\\ln x=?\\;(0\\cdot(-\\infty))`,steps:[`Rewrite: x ln x = ln(x)/(1/x) → -∞/∞`,`Apply L'Hopital: (1/x)/(-1/x^2) = (1/x)·(-x^2) = -x`,`lim(x→0+) (-x) = 0`],answer:`0`,answerLatex:`0`,tip:'For 0·∞: rewrite as fraction. Here x·ln x = ln(x)/(1/x), giving -∞/∞ form.'};
    } else {
      return{question:`lim(x→0) (1 + 3x)^(1/x)  (form: 1^∞)`,questionLatex:`\\lim_{x\\to0}(1+3x)^{1/x}=?`,steps:[`1^∞ form. Use: lim [f(x)]^g(x) = e^{lim(f(x)-1)g(x)}`,`f(x)-1 = 3x, g(x) = 1/x`,`lim (f(x)-1)g(x) = lim 3x·(1/x) = 3`,`Limit = e^3`],answer:`e^3`,answerLatex:`e^3`,tip:'1^∞ shortcut: lim [1+u(x)]^v(x) = e^{lim u(x)·v(x)} when u(x)→0.'};
    }
  },
  chain_rule:(n)=>{
    const mode=n%4;
    const a=srI(n+1,2,5);
    if(mode===0){
      return{question:`Find d/dx [sin(x^${a})].`,questionLatex:`\\frac{d}{dx}\\sin(x^{${a}})=?`,steps:[`Outer function: sin(u), inner: u=x^${a}`,`Outer derivative: cos(u) = cos(x^${a})`,`Inner derivative: ${a}x^${a-1}`,`Chain rule: cos(x^${a})·${a}x^${a-1}`],answer:`${a}x^{${a-1}} cos(x^${a})`,answerLatex:`${a}x^{${a-1}}\\cos(x^{${a}})`,tip:'Chain rule: differentiate outer at inner, multiply by derivative of inner.'};
    } else if(mode===1){
      return{question:`Find d/dx [x^${a} · e^x].`,questionLatex:`\\frac{d}{dx}(x^{${a}}e^x)=?`,steps:[`Product rule: (uv)' = u'v + uv'`,`u = x^${a}, u' = ${a}x^${a-1}`,`v = e^x, v' = e^x`,`= ${a}x^${a-1}·e^x + x^${a}·e^x`,`= e^x(${a}x^${a-1}+x^${a}) = x^${a-1}·e^x(${a}+x)`],answer:`x^${a-1}·e^x(${a}+x)`,answerLatex:`x^{${a-1}}e^x(${a}+x)`,tip:'Product rule: (uv)\' = u\'v + uv\'. Factor out common terms at the end.'};
    } else if(mode===2){
      const b=srI(n+2,1,4);
      return{question:`Differentiate ln(x^${a}+${b}) w.r.t. x.`,questionLatex:`\\frac{d}{dx}\\ln(x^{${a}}+${b})=?`,steps:[`d/dx ln(u) = (1/u)·u'  (chain rule)`,`u = x^${a}+${b}, u' = ${a}x^${a-1}`,`= ${a}x^${a-1}/(x^${a}+${b})`],answer:`${a}x^${a-1}/(x^${a}+${b})`,answerLatex:`\\frac{${a}x^{${a-1}}}{x^{${a}}+${b}}`,tip:'d/dx ln(f(x)) = f\'(x)/f(x). Chain rule applied to the logarithm.'};
    } else {
      return{question:`Find d/dx [e^(sin x)].`,questionLatex:`\\frac{d}{dx}e^{\\sin x}=?`,steps:[`Chain rule: outer = e^u, inner = sin x`,`d/dx e^u = e^u · u'`,`u' = cos x`,`= e^(sin x) · cos x`],answer:`e^(sin x)·cos x`,answerLatex:`e^{\\sin x}\\cos x`,tip:'d/dx e^(f(x)) = e^(f(x))·f\'(x). The exponential keeps its exponent and multiplies by the derivative of the exponent.'};
    }
  },
  higher_order:(n)=>{
    const mode=n%3;
    if(mode===0){
      const pw=srI(n+1,3,6);
      return{question:`f(x) = x^${pw}. Find f''(x) and identify the inflection points.`,questionLatex:`f(x)=x^{${pw}},\\;f''(x)=?,\\text{ inflection?}`,steps:[`f'(x) = ${pw}x^${pw-1}`,`f''(x) = ${pw*(pw-1)}x^${pw-2}`,`f''(x)=0 when x=0 (if ${pw-2}>0)`,`Check sign change: concave down x<0, concave up x>0 (if ${pw} even, no inflection)`],answer:`f''(x)=${pw*(pw-1)}x^${pw-2}`,answerLatex:`f''(x)=${pw*(pw-1)}x^{${pw-2}}`,tip:'f\'\'=0 is necessary but not sufficient for inflection — check that concavity actually changes.'};
    } else if(mode===1){
      return{question:`Apply Leibniz Rule to find the 2nd derivative of f(x) = x^2·sin(x).`,questionLatex:`\\frac{d^2}{dx^2}(x^2\\sin x)=?\\;\\text{(Leibniz)}`,steps:[`Leibniz: (uv)'' = u''v + 2u'v' + uv''`,`u=x^2: u'=2x, u''=2`,`v=sin x: v'=cos x, v''=-sin x`,`= 2·sin x + 2·2x·cos x + x^2·(-sin x)`,`= (2-x^2)sin x + 4x cos x`],answer:`(2-x^2)sin x + 4x cos x`,answerLatex:`(2-x^2)\\sin x+4x\\cos x`,tip:'Leibniz: (uv)^(n) = sum C(n,r)·u^(n-r)·v^(r). For n=2: u\'\'v + 2u\'v\' + uv\'\'.'};
    } else {
      const a=srI(n+2,2,5);
      return{question:`f(x) = e^(${a}x). Find the nth derivative f^(n)(x).`,questionLatex:`f^{(n)}(x)=?\\text{ for }f(x)=e^{${a}x}`,steps:[`f'(x) = ${a}e^(${a}x)`,`f''(x) = ${a}^2 e^(${a}x)`,`Pattern: f^(n)(x) = ${a}^n · e^(${a}x)`],answer:`${a}^n · e^(${a}x)`,answerLatex:`${a}^n e^{${a}x}`,tip:'Each differentiation multiplies by the coefficient in the exponent. So (e^(ax))^(n) = a^n e^(ax).'};
    }
  },
  mvt:(n)=>{
    const a=srI(n,0,2),b=srI(n+1,3,6),pw=srI(n+2,2,4);
    const avg=(Math.pow(b,pw)-Math.pow(a,pw))/(b-a);
    const mode=n%3;
    if(mode===0){
      return{question:`Verify LMVT for f(x)=x^${pw} on [${a},${b}]. Find the value of c.`,questionLatex:`f'(c)=\\frac{f(${b})-f(${a})}{${b}-${a}},\\;f(x)=x^{${pw}}`,steps:[`f(${b})=${Math.pow(b,pw)}, f(${a})=${Math.pow(a,pw)}`,`Average rate = (${Math.pow(b,pw)}-${Math.pow(a,pw)})/(${b}-${a}) = ${fmt(avg,4)}`,`f'(x) = ${pw}x^${pw-1}, so f'(c) = ${fmt(avg,4)}`,`c = (${fmt(avg,4)}/${pw})^(1/${pw-1}) = ${fmt(Math.pow(avg/pw,1/(pw-1)),4)}`],answer:`c = ${fmt(Math.pow(avg/pw,1/(pw-1)),4)}`,answerLatex:`c=${fmt(Math.pow(avg/pw,1/(pw-1)),4)}`,tip:'LMVT: set f\'(c) equal to the average rate of change and solve for c.'};
    } else if(mode===1){
      return{question:`Prove: sin x < x for all x > 0 using the Mean Value Theorem.`,questionLatex:`\\text{Prove }\\sin x < x\\text{ for }x>0`,steps:[`Let f(x) = x - sin x. f(0) = 0.`,`f'(x) = 1 - cos x ≥ 0 for all x (since cos x ≤ 1)`,`f is non-decreasing, and f(0)=0`,`For x>0: f(x) ≥ f(0) = 0, so x-sin x ≥ 0`,`x ≥ sin x, with equality only at x=0 ✓`],answer:`sin x < x for x > 0 (proved via MVT/derivative)`,answerLatex:`x>0\\Rightarrow x>\\sin x\\;✓`,tip:'Inequality via calculus: set h(x)=LHS-RHS, show h(0)=0 and h\'(x)≥0.'};
    } else {
      return{question:`State Rolle's Theorem and apply it to f(x) = x^2 - 4 on [-2,2].`,questionLatex:`f(x)=x^2-4\\text{ on }[-2,2].\\text{ Apply Rolle.}`,steps:[`Check conditions: (1) f continuous on [-2,2] ✓`,`(2) f differentiable on (-2,2) ✓`,`(3) f(-2)=4-4=0=f(2) ✓`,`Rolle's: exists c in (-2,2) with f'(c)=0`,`f'(x)=2x=0 → c=0 ✓ (c=0 ∈ (-2,2))`],answer:`c = 0 (where f'(c)=0)`,answerLatex:`c=0\\in(-2,2)\\;✓`,tip:"Rolle's requires f(a)=f(b). Here 0=0 ✓. The critical point c=0 lies inside (-2,2)."};
    }
  },
  aod:(n)=>{
    const mode=n%4;
    if(mode===0){
      const a=srI(n+1,2,5),b=srI(n+2,1,4);
      const slope=2*a-b;
      return{question:`Find the equation of the tangent to y=x^2 at the point where x=${a}.`,questionLatex:`\\text{Tangent to }y=x^2\\text{ at }x=${a}`,steps:[`y(${a}) = ${a}^2 = ${a*a}. Point: (${a},${a*a})`,`y'=2x, slope at x=${a}: m = ${2*a}`,`Tangent: y-${a*a} = ${2*a}(x-${a})`,`y = ${2*a}x - ${2*a*a} + ${a*a} = ${2*a}x - ${a*a}`],answer:`y = ${2*a}x - ${a*a}`,answerLatex:`y=${2*a}x-${a*a}`,tip:'Tangent at x=a: find y(a), find m=f\'(a), use point-slope form y-y1=m(x-x1).'};
    } else if(mode===1){
      return{question:`Find where f(x) = x^3 - 3x is increasing and decreasing.`,questionLatex:`f(x)=x^3-3x.\\text{ Monotonicity?}`,steps:[`f'(x) = 3x^2 - 3 = 3(x^2-1) = 3(x-1)(x+1)`,`f'(x)>0: x<-1 or x>1 → INCREASING`,`f'(x)<0: -1<x<1 → DECREASING`,`Critical points: x=-1 (local max), x=1 (local min)`],answer:`Increasing: x<-1 and x>1. Decreasing: -1<x<1`,answerLatex:`\\text{Inc: }x<-1\\cup x>1,\\;\\text{Dec: }-1<x<1`,tip:'Find f\'(x)=0, make a sign chart. f\'>0 means increasing, f\'<0 means decreasing.'};
    } else if(mode===2){
      const a=srI(n+3,2,5);
      return{question:`Find local maxima and minima of f(x) = x^3 - ${3*a}x.`,questionLatex:`f(x)=x^3-${3*a}x.\\text{ Max/Min?}`,steps:[`f'(x) = 3x^2 - ${3*a} = 3(x^2-${a})`,`f'(x)=0: x=±√${a} = ±${fmt(Math.sqrt(a),4)}`,`f''(x) = 6x`,`At x=${fmt(Math.sqrt(a),3)}: f''=${fmt(6*Math.sqrt(a),3)}>0 → LOCAL MINIMUM`,`At x=${fmt(-Math.sqrt(a),3)}: f''=${fmt(-6*Math.sqrt(a),3)}<0 → LOCAL MAXIMUM`],answer:`Local max at x=-√${a}, local min at x=√${a}`,answerLatex:`\\text{Max: }x=-\\sqrt{${a}},\\;\\text{Min: }x=+\\sqrt{${a}}`,tip:'Second derivative test: f\'\'(c)>0 → min, f\'\'(c)<0 → max. Only works when f\'(c)=0.'};
    } else {
      const a=srI(n+4,2,4),b=srI(n+5,1,3);
      return{question:`Find the normal to y = x^2 + ${b} at x = ${a}.`,questionLatex:`\\text{Normal to }y=x^2+${b}\\text{ at }x=${a}`,steps:[`y(${a}) = ${a*a+b}. Point: (${a},${a*a+b})`,`y'=2x, slope of tangent m=${2*a}`,`Normal slope = -1/m = -1/${2*a} = ${fmt(-1/(2*a),4)}`,`Normal: y-${a*a+b} = ${fmt(-1/(2*a),4)}(x-${a})`],answer:`y - ${a*a+b} = -1/${2*a}·(x-${a})`,answerLatex:`y-${a*a+b}=-\\frac{1}{${2*a}}(x-${a})`,tip:'Normal is perpendicular to tangent. If tangent slope is m, normal slope is -1/m.'};
    }
  },
  taylor:(n)=>{
    const mode=n%4;
    if(mode===0){
      const order=srI(n+1,2,4);
      return{question:`Write the Maclaurin series for e^x up to x^${order} term.`,questionLatex:`e^x=?\\text{ (up to }x^{${order}}\\text{ term)}`,steps:[`f(x)=e^x, all derivatives are e^x`,`f(0)=f'(0)=f''(0)=...=1`,`e^x = 1 + x + x^2/2! + x^3/3! + ... + x^${order}/${order}! + ...`,`= ${Array.from({length:order+1},(_,k)=>k===0?'1':k===1?'x':`x^${k}/${fact(k)}`).join(' + ')} + ...`],answer:`1 + x + x²/2 + ... + x^${order}/${fact(order)}`,answerLatex:`e^x=1+x+\\frac{x^2}{2!}+\\cdots+\\frac{x^{${order}}}{${order}!}+\\cdots`,tip:'e^x: all coefficients f^(n)(0)/n! = 1/n!. The series converges for all x.'};
    } else if(mode===1){
      return{question:`Use Taylor series to find lim(x→0) (cos x - 1)/x^2.`,questionLatex:`\\lim_{x\\to0}\\frac{\\cos x-1}{x^2}=?\\text{ (Taylor)}`,steps:[`cos x = 1 - x^2/2 + x^4/24 - ...`,`cos x - 1 = -x^2/2 + x^4/24 - ...`,`(cos x - 1)/x^2 = -1/2 + x^2/24 - ...`,`As x→0: limit = -1/2`],answer:`-1/2`,answerLatex:`-\\frac{1}{2}`,tip:'Taylor is fastest: expand numerator to the order of the denominator.'};
    } else if(mode===2){
      return{question:`Use expansion to find lim(x→0) (e^x - e^(-x) - 2x)/x^3.`,questionLatex:`\\lim_{x\\to0}\\frac{e^x-e^{-x}-2x}{x^3}=?`,steps:[`e^x = 1+x+x^2/2+x^3/6+...`,`e^(-x) = 1-x+x^2/2-x^3/6+...`,`e^x-e^(-x) = 2x+2x^3/6+... = 2x+x^3/3+...`,`e^x-e^(-x)-2x = x^3/3+...`,`Divide by x^3: limit = 1/3`],answer:`1/3`,answerLatex:`\\frac{1}{3}`,tip:'Subtract series term by term. Many terms cancel for e^x - e^(-x) (even powers vanish).'};
    } else {
      return{question:`Write the first three non-zero terms of ln(1+x) and ln(1-x).`,questionLatex:`\\ln(1+x)=?,\\;\\ln(1-x)=?`,steps:[`ln(1+x) = x - x^2/2 + x^3/3 - x^4/4 + ...`,`ln(1-x) = -x - x^2/2 - x^3/3 - x^4/4 - ...`,`Note: ln((1+x)/(1-x)) = 2(x + x^3/3 + x^5/5 + ...)`],answer:`ln(1+x)=x-x²/2+x³/3-...`,answerLatex:`\\ln(1+x)=x-\\frac{x^2}{2}+\\frac{x^3}{3}-\\cdots`,tip:'ln(1+x) expansion: coefficients are 1/n with alternating signs. Valid for |x|≤1.'};
    }
  },
  sandwich:(n)=>{
    const mode=n%3;
    if(mode===0){
      return{question:`Evaluate lim(n→∞) (1/n)·(1+2+3+...+n) using limit as integral.`,questionLatex:`\\lim_{n\\to\\infty}\\frac{1}{n}\\sum_{r=1}^{n}\\frac{r}{n}=?`,steps:[`This is lim (1/n)Σ(r/n) = ∫₀¹ x dx`,`∫₀¹ x dx = [x^2/2]₀¹ = 1/2`],answer:`1/2`,answerLatex:`\\frac{1}{2}`,tip:'Recognise the Riemann sum pattern: (1/n)Σf(r/n) → ∫₀¹ f(x)dx.'};
    } else if(mode===1){
      const k=srI(n+1,2,4);
      return{question:`Use dominance hierarchy: lim(x→∞) x^${k}/e^x.`,questionLatex:`\\lim_{x\\to\\infty}\\frac{x^{${k}}}{e^x}=?`,steps:[`Dominance: e^x grows much faster than any polynomial`,`x^${k}/e^x → 0 as x→∞`,`Can verify with L'Hopital applied ${k} times:`,`Each step: ${k}!/e^x → 0`],answer:`0`,answerLatex:`0`,tip:'e^x dominates all polynomials: x^n/e^x → 0 for any fixed n.'};
    } else {
      return{question:`Apply Squeeze Theorem: lim(x→0) x·sin(1/x).`,questionLatex:`\\lim_{x\\to0}x\\sin(1/x)=?`,steps:[`|sin(1/x)| ≤ 1 for all x≠0`,`So |x·sin(1/x)| ≤ |x|`,`-|x| ≤ x·sin(1/x) ≤ |x|`,`As x→0: |x|→0, so by Squeeze: limit = 0`],answer:`0`,answerLatex:`0`,tip:'Squeeze: bound |f(x)| by a function going to 0. Here |x·sin(1/x)|≤|x|→0.'};
    }
  },
  ineq_calculus:(n)=>{
    const mode=n%3;
    if(mode===0){
      return{question:`Prove e^x ≥ 1+x for all real x using derivatives.`,questionLatex:`\\text{Prove }e^x\\geq1+x\\;\\forall x\\in\\mathbb{R}`,steps:[`Let h(x) = e^x - 1 - x`,`h(0) = 1-1-0 = 0`,`h'(x) = e^x - 1`,`h'(x) ≥ 0 iff e^x ≥ 1 iff x ≥ 0`,`For x≥0: h is increasing from 0, so h(x)≥0`,`For x<0: h'(x)<0 so h is decreasing from h(0)=0... wait`,`Better: h has global min at x=0 since h'(0)=0 and h''(0)=e^0=1>0`,`Global min value = 0, so h(x)≥0 for all x ✓`],answer:`e^x ≥ 1+x with equality iff x=0`,answerLatex:`e^x\\geq 1+x,\\;\\text{equality at }x=0`,tip:'Set h=difference, find min of h. If h\'\'(c)>0 at critical point and h(c)=0, done.'};
    } else if(mode===1){
      return{question:`Using Jensen's inequality with f(x)=-ln x (convex), prove AM ≥ GM for two numbers a,b>0.`,questionLatex:`a,b>0.\\text{ Prove }\\frac{a+b}{2}\\geq\\sqrt{ab}`,steps:[`f(x) = -ln(x) is convex since f''(x) = 1/x^2 > 0`,`Jensen's: f((a+b)/2) ≤ (f(a)+f(b))/2`,`-ln((a+b)/2) ≤ (-ln a - ln b)/2`,`-ln((a+b)/2) ≤ -ln(√(ab))`,`ln((a+b)/2) ≥ ln(√(ab))`,`(a+b)/2 ≥ √(ab) ✓`],answer:`AM ≥ GM proved via Jensen's inequality`,answerLatex:`\\frac{a+b}{2}\\geq\\sqrt{ab}\\;✓`,tip:"Jensen's with f=-ln: the concavity of ln gives AM≥GM. f(x)=-ln(x) is convex."};
    } else {
      return{question:`Prove ln(1+x) < x for all x > 0.`,questionLatex:`\\text{Prove }\\ln(1+x)<x\\text{ for }x>0`,steps:[`Let h(x) = x - ln(1+x)`,`h(0) = 0-ln(1) = 0`,`h'(x) = 1 - 1/(1+x) = x/(1+x)`,`For x>0: h'(x) > 0, so h is strictly increasing`,`h(x) > h(0) = 0 for all x>0`,`So x - ln(1+x) > 0, i.e., ln(1+x) < x ✓`],answer:`ln(1+x) < x for x > 0`,answerLatex:`\\ln(1+x)<x\\text{ for }x>0\\;✓`,tip:'Classic derivative proof. h(0)=0 and h\'(x)>0 for x>0 means h(x)>0 for x>0.'};
    }
  },
  parametric_implicit:(n)=>{
    const mode=n%4;
    if(mode===0){
      return{question:`x = cos t, y = sin t. Find dy/dx in terms of t.`,questionLatex:`x=\\cos t,\\;y=\\sin t.\\;\\frac{dy}{dx}=?`,steps:[`dy/dt = cos t`, `dx/dt = -sin t`,`dy/dx = (dy/dt)/(dx/dt) = cos t/(-sin t) = -cot t`],answer:`-cot t`,answerLatex:`-\\cot t`,tip:'Parametric: dy/dx = (dy/dt)/(dx/dt). This traces a circle; slope = -cot t = -cos t/sin t.'};
    } else if(mode===1){
      return{question:`Find dy/dx for x^2 + y^2 = 25 (implicit).`,questionLatex:`x^2+y^2=25.\\;\\frac{dy}{dx}=?`,steps:[`Differentiate both sides w.r.t. x:`,`2x + 2y(dy/dx) = 0`,`2y(dy/dx) = -2x`,`dy/dx = -x/y`],answer:`dy/dx = -x/y`,answerLatex:`\\frac{dy}{dx}=-\\frac{x}{y}`,tip:'Implicit: differentiate term by term, applying chain rule to y. Then solve for dy/dx.'};
    } else if(mode===2){
      return{question:`Find d/dx[sin^(-1)(x)].`,questionLatex:`\\frac{d}{dx}\\sin^{-1}x=?`,steps:[`Let y = sin^(-1)(x), so sin(y) = x`,`Differentiate: cos(y)·dy/dx = 1`,`dy/dx = 1/cos(y)`,`cos(y) = √(1-sin²y) = √(1-x²)`,`dy/dx = 1/√(1-x²)`],answer:`1/√(1-x²)`,answerLatex:`\\frac{1}{\\sqrt{1-x^2}}`,tip:'Inverse trig derivatives come from implicit differentiation. sin y=x → cos y·y\'=1.'};
    } else {
      return{question:`Find d/dx[tan^(-1)(x)].`,questionLatex:`\\frac{d}{dx}\\tan^{-1}x=?`,steps:[`Let y = tan^(-1)(x), so tan(y) = x`,`Differentiate: sec²(y)·dy/dx = 1`,`dy/dx = 1/sec²(y) = cos²(y)`,`Since tan y = x: sec²y = 1+tan²y = 1+x²`,`dy/dx = 1/(1+x²)`],answer:`1/(1+x²)`,answerLatex:`\\frac{1}{1+x^2}`,tip:'tan y = x → differentiate → sec²y·y\'=1 → y\' = 1/sec²y = 1/(1+tan²y) = 1/(1+x²).'};
    }
  },
};

// ── Quiz Generators ────────────────────────────────────────────
const QUIZ_GENERATORS = {
  limits_basics:(n)=>{
    const t=[
      (s)=>{const a=srI(s,2,7),pw=srI(s+1,2,4);const v=Math.pow(a,pw);return{q:`lim(x→${a}) x^${pw} = ?`,opts:shuffle([v,v+1,v-1,v*2].filter((x,i,arr)=>arr.indexOf(x)===i).slice(0,4),s),correct:v};},
      (s)=>{return{q:`For a limit to exist, LHL and RHL must be?`,opts:shuffle(['Equal to each other','Both infinite','Both zero','Equal to f(a)'],s),correct:'Equal to each other'};},
      (s)=>{const a=srI(s,2,5);return{q:`lim(x→${a}) (x^2-${a*a})/(x-${a}) = ?`,opts:shuffle([2*a,a,a*a,2*a+1],s),correct:2*a};},
      (s)=>{return{q:`If lim(x→a) f(x) exists but f(a) is undefined, this is a?`,opts:shuffle(['Removable discontinuity','Jump discontinuity','Infinite discontinuity','No discontinuity'],s),correct:'Removable discontinuity'};},
    ];
    const q=t[n%t.length](n*31+7);
    return{...q,tip:'Limit exists iff LHL=RHL. Factor to resolve 0/0.'};
  },
  algebra_limits:(n)=>{
    const t=[
      (s)=>{const a=srI(s,2,5),b=srI(s+1,1,4);const v=a*b;return{q:`lim(x→${a}) x × lim(x→${b}) x = ?`,opts:shuffle([v,a+b,a-b,a*a],s),correct:v};},
      (s)=>{return{q:`lim(x→0) x²sin(1/x) = ? (Squeeze Theorem)`,opts:shuffle(['0','1','undefined','∞'],s),correct:'0'};},
      (s)=>{const a=srI(s,1,3),b=srI(s+1,1,3);return{q:`lim f(x)=${a}, lim g(x)=${b}. lim[f(x)+g(x)]=?`,opts:shuffle([a+b,a*b,a-b,a/b],s),correct:a+b};},
      (s)=>{const a=srI(s,2,5);return{q:`lim(x→${a}) (x^2-${a*a})/(x-${a})^2 = ?`,opts:shuffle(['∞',a,'2','0'],s),correct:'∞'};},
    ];
    const q=t[n%t.length](n*37+11);
    return{...q,tip:'Product/sum rules for limits. Squeeze: bound by known limits.'};
  },
  standard_limits:(n)=>{
    const t=[
      (s)=>{const k=srI(s,2,5);return{q:`lim(x→0) sin(${k}x)/(${k}x) = ?`,opts:shuffle(['1',fmt(1/k,2),k,k+''],s),correct:'1'};},
      (s)=>{return{q:`lim(x→0) (e^x - 1)/x = ?`,opts:shuffle(['1','0','e','∞'],s),correct:'1'};},
      (s)=>{const a=srI(s,2,5),b=srI(s+1,2,5);return{q:`lim(x→0) sin(${a}x)/sin(${b}x) = ?`,opts:shuffle([fmt(a/b,4),fmt(b/a,4),'1','0'],s),correct:fmt(a/b,4)};},
      (s)=>{return{q:`lim(x→0) (1+x)^(1/x) = ?`,opts:shuffle(['e','1','0','2'],s),correct:'e'};},
    ];
    const q=t[n%t.length](n*41+13);
    return{...q,tip:'sin(kx)/(kx)→1. (e^x-1)/x→1. (1+x)^(1/x)→e.'};
  },
  first_principles:(n)=>{
    const t=[
      (s)=>{const pw=srI(s,2,5);return{q:`d/dx(x^${pw}) by power rule = ?`,opts:shuffle([`${pw}x^${pw-1}`,`x^${pw+1}`,`${pw-1}x^${pw}`,`x^${pw-1}`],s),correct:`${pw}x^${pw-1}`};},
      (s)=>{return{q:`d/dx(sin x) = ?`,opts:shuffle(['cos x','-cos x','sin x','-sin x'],s),correct:'cos x'};},
      (s)=>{return{q:`d/dx(e^x) = ?`,opts:shuffle(['e^x','xe^(x-1)','e^(x-1)','ln x'],s),correct:'e^x'};},
      (s)=>{return{q:`d/dx(ln x) = ?`,opts:shuffle(['1/x','ln x','1','x'],s),correct:'1/x'};},
    ];
    const q=t[n%t.length](n*43+17);
    return{...q,tip:'Power rule: d/dx x^n = nx^(n-1). d/dx sin=cos. d/dx e^x=e^x.'};
  },
  continuity:(n)=>{
    const t=[
      (s)=>{return{q:`f differentiable at a implies f is?`,opts:shuffle(['Continuous at a','Differentiable everywhere','Continuous everywhere','Not continuous'],s),correct:'Continuous at a'};},
      (s)=>{return{q:`f(x)=|x| at x=0: which is true?`,opts:shuffle(['Continuous but NOT differentiable','Neither continuous nor differentiable','Differentiable but not continuous','Both continuous and differentiable'],s),correct:'Continuous but NOT differentiable'};},
      (s)=>{return{q:`IVT guarantees: if f is continuous on [a,b] and f(a)<0<f(b), then?`,opts:shuffle(['A root exists in (a,b)','f is differentiable','f has a maximum','f(0)=0'],s),correct:'A root exists in (a,b)'};},
      (s)=>{return{q:`For differentiability at x=a, which must be equal?`,opts:shuffle(['LHD and RHD','LHL and RHL','f\'(a) and f(a)','f\'(a) and f\'\'(a)'],s),correct:'LHD and RHD'};},
    ];
    const q=t[n%t.length](n*47+19);
    return{...q,tip:'Diff ⟹ Cont. NOT vice versa. IVT: sign change implies root.'};
  },
  lhopital:(n)=>{
    const t=[
      (s)=>{return{q:`L'Hopital applies when the limit gives which form?`,opts:shuffle(['0/0 or ∞/∞','0×∞','1^∞','Any indeterminate form directly'],s),correct:'0/0 or ∞/∞'};},
      (s)=>{return{q:`lim(x→0) (sin x - x)/x^3 = ?`,opts:shuffle(['-1/6','1/6','0','1'],s),correct:'-1/6'};},
      (s)=>{return{q:`lim(x→0) (e^x-1-x)/x^2 = ?`,opts:shuffle(['1/2','1','0','2'],s),correct:'1/2'};},
      (s)=>{return{q:`For 1^∞ form: lim[f(x)]^g(x) = e^L where L = ?`,opts:shuffle(['lim(f(x)-1)g(x)','lim f(x)·lim g(x)','lim g(x)·ln f(x)','1'],s),correct:'lim(f(x)-1)g(x)'};},
    ];
    const q=t[n%t.length](n*53+23);
    return{...q,tip:"L'Hopital: 0/0 or ∞/∞ only. 1^∞: use e^{lim(f-1)g}."};
  },
  chain_rule:(n)=>{
    const t=[
      (s)=>{return{q:`d/dx sin(x^2) = ?`,opts:shuffle(['2x cos(x^2)','cos(2x)','2 cos(x^2)','x^2 cos(x^2)'],s),correct:'2x cos(x^2)'};},
      (s)=>{const a=srI(s,2,5);return{q:`d/dx e^(${a}x) = ?`,opts:shuffle([`${a}e^(${a}x)`,`e^(${a}x)`,`${a}xe^(${a}x-1)`,`${a}xe^(${a}x)`],s),correct:`${a}e^(${a}x)`};},
      (s)=>{return{q:`d/dx(x·e^x) using product rule = ?`,opts:shuffle(['e^x(1+x)','xe^x','e^x','x^2e^x'],s),correct:'e^x(1+x)'};},
      (s)=>{return{q:`d/dx ln(sin x) = ?`,opts:shuffle(['cot x','cos x','1/sin x','tan x'],s),correct:'cot x'};},
    ];
    const q=t[n%t.length](n*59+29);
    return{...q,tip:"Chain: multiply by inner derivative. Product: u'v+uv'."};
  },
  higher_order:(n)=>{
    const t=[
      (s)=>{const a=srI(s,2,5);return{q:`f(x)=x^${a+2}. f\'\'(x)=?`,opts:shuffle([`${(a+2)*(a+1)}x^${a}`,`${a+2}x^${a+1}`,`${(a+1)}x^${a}`,`${(a+2)}x^${a}`],s),correct:`${(a+2)*(a+1)}x^${a}`};},
      (s)=>{return{q:`f\'\'(x)>0 means the graph is?`,opts:shuffle(['Concave up','Concave down','Decreasing','At a maximum'],s),correct:'Concave up'};},
      (s)=>{return{q:`Leibniz Rule (uv)^(n) uses which coefficients?`,opts:shuffle(['Binomial C(n,r)','Fibonacci numbers','Catalan numbers','n!'],s),correct:'Binomial C(n,r)'};},
      (s)=>{return{q:`An inflection point requires?`,opts:shuffle(['f\'\'=0 AND concavity changes','f\'=0 only','f\'\'=0 only','f\'=0 and f\'\'=0'],s),correct:'f\'\'=0 AND concavity changes'};},
    ];
    const q=t[n%t.length](n*61+31);
    return{...q,tip:"f''(x)>0: concave up. Inflection: f''=0 AND sign change."};
  },
  mvt:(n)=>{
    const t=[
      (s)=>{return{q:"Rolle's Theorem requires which extra condition beyond LMVT?",opts:shuffle(["f(a)=f(b)","f'(a)=0","f''(c)>0","f is increasing"],s),correct:"f(a)=f(b)"};},
      (s)=>{const a=1,b=3;const avg=(b*b-a*a)/(b-a);return{q:`LMVT for f(x)=x^2 on [1,3]. f\'(c)=[f(3)-f(1)]/2=?`,opts:shuffle([avg,a+b,2,4],s),correct:avg};},
      (s)=>{return{q:`LMVT geometric meaning: the tangent at c is parallel to?`,opts:shuffle(['The chord from (a,f(a)) to (b,f(b))','The x-axis','The y-axis','The tangent at a'],s),correct:'The chord from (a,f(a)) to (b,f(b))'};},
      (s)=>{return{q:`x ≥ sin x for x≥0 can be proved by showing h(x)=x-sin x has?`,opts:shuffle(['h(0)=0 and h\'(x)≥0','h\'(0)=0','h\'\'(x)>0','h(x)=0'],s),correct:'h(0)=0 and h\'(x)≥0'};},
    ];
    const q=t[n%t.length](n*67+37);
    return{...q,tip:"Rolle's: f(a)=f(b) extra. LMVT: f'(c)=[f(b)-f(a)]/(b-a)."};
  },
  aod:(n)=>{
    const t=[
      (s)=>{const a=srI(s,2,5);return{q:`Tangent to y=x^2 at x=${a} has slope?`,opts:shuffle([2*a,a,a*a,2],s),correct:2*a};},
      (s)=>{return{q:`f(x)=x^3-3x. f is decreasing on?`,opts:shuffle(['(-1,1)','(-∞,-1)','(1,∞)','(0,∞)'],s),correct:'(-1,1)'};},
      (s)=>{return{q:`At critical point c with f\'\'(c)>0, f has a?`,opts:shuffle(['Local minimum','Local maximum','Inflection point','Saddle point'],s),correct:'Local minimum'};},
      (s)=>{const m=srI(s,2,5);return{q:`If tangent slope is ${m}, normal slope is?`,opts:shuffle([`-1/${m}`,`${m}`,`1/${m}`,`-${m}`],s),correct:`-1/${m}`};},
    ];
    const q=t[n%t.length](n*71+41);
    return{...q,tip:"Tangent slope = f'(x0). Normal slope = -1/f'(x0). Critical: f'=0."};
  },
  taylor:(n)=>{
    const t=[
      (s)=>{return{q:`The coefficient of x^3 in the Maclaurin series of e^x is?`,opts:shuffle(['1/6','1/3','1/2','1'],s),correct:'1/6'};},
      (s)=>{return{q:`lim(x→0) (cos x - 1)/x^2 using Taylor = ?`,opts:shuffle(['-1/2','1/2','0','1'],s),correct:'-1/2'};},
      (s)=>{return{q:`sin x - x ~ kx^3 as x→0. What is k?`,opts:shuffle(['-1/6','1/6','-1/2','1/2'],s),correct:'-1/6'};},
      (s)=>{return{q:`ln(1+x) = x - x^2/2 + x^3/3 - ... valid for?`,opts:shuffle(['|x|≤1 (x≠-1)','All x','|x|<2','x>0 only'],s),correct:'|x|≤1 (x≠-1)'};},
    ];
    const q=t[n%t.length](n*73+43);
    return{...q,tip:'e^x: 1/n! coefficients. sin x: odd terms. cos x: even terms. ln(1+x): 1/n alternating.'};
  },
  sandwich:(n)=>{
    const t=[
      (s)=>{return{q:`lim(x→0) x^2·sin(1/x) = ?`,opts:shuffle(['0','1','∞','does not exist'],s),correct:'0'};},
      (s)=>{const k=srI(s,2,4);return{q:`lim(x→∞) x^${k}/e^x = ? (dominance)`,opts:shuffle(['0','∞',`${k}!`,'1'],s),correct:'0'};},
      (s)=>{return{q:`lim(1/n)·Σ(r=1 to n) r/n as n→∞ = ?`,opts:shuffle(['1/2','1','1/3','2/3'],s),correct:'1/2'};},
      (s)=>{return{q:`Squeeze Theorem requires: g(x)≤f(x)≤h(x) and?`,opts:shuffle(['lim g = lim h = L','lim g = 0','lim h = ∞','f is continuous'],s),correct:'lim g = lim h = L'};},
    ];
    const q=t[n%t.length](n*79+47);
    return{...q,tip:'Squeeze: bound above and below by functions with same limit.'};
  },
  ineq_calculus:(n)=>{
    const t=[
      (s)=>{return{q:`To prove e^x ≥ 1+x via calculus, let h(x)=e^x-1-x. We need?`,opts:shuffle(['h(0)=0 and h\'(x)≥0','h\'(0)>0','h\'\'(x)>0 everywhere','h(x)=0'],s),correct:'h(0)=0 and h\'(x)≥0'};},
      (s)=>{return{q:`Jensen\'s inequality for CONVEX f states?`,opts:shuffle(['f(mean) ≤ mean of f','f(mean) ≥ mean of f','f(mean) = mean of f','Always an equality'],s),correct:'f(mean) ≤ mean of f'};},
      (s)=>{return{q:`Which function is convex on (0,∞)?`,opts:shuffle(['e^x','ln x','sin x (on [0,π])','√x'],s),correct:'e^x'};},
      (s)=>{return{q:`The tangent line to a convex function lies?`,opts:shuffle(['Below the function','Above the function','On the function','Parallel to x-axis'],s),correct:'Below the function'};},
    ];
    const q=t[n%t.length](n*83+53);
    return{...q,tip:'Jensen convex: f(mean)≤mean of f. Tangent below convex curve.'};
  },
  parametric_implicit:(n)=>{
    const t=[
      (s)=>{return{q:`x=cos t, y=sin t. dy/dx = ?`,opts:shuffle(['-cot t','cot t','-tan t','tan t'],s),correct:'-cot t'};},
      (s)=>{return{q:`For x^2+y^2=25, dy/dx by implicit differentiation = ?`,opts:shuffle(['-x/y','x/y','-y/x','y/x'],s),correct:'-x/y'};},
      (s)=>{return{q:`d/dx[sin^(-1)(x)] = ?`,opts:shuffle(['1/√(1-x^2)','-1/√(1-x^2)','1/(1+x^2)','1/√(1+x^2)'],s),correct:'1/√(1-x^2)'};},
      (s)=>{return{q:`d/dx[tan^(-1)(x)] = ?`,opts:shuffle(['1/(1+x^2)','1/√(1-x^2)','-1/(1+x^2)','1/(1-x^2)'],s),correct:'1/(1+x^2)'};},
    ];
    const q=t[n%t.length](n*89+59);
    return{...q,tip:'Parametric: (dy/dt)/(dx/dt). Implicit: chain rule on y. d/dx arcsin=1/√(1-x²).'};
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
      body{background:#060d1a;}
      ::-webkit-scrollbar{width:5px;}
      ::-webkit-scrollbar-track{background:#060d1a;}
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

function CoverScreen({ onNext }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [300,900,1600].map((d,i) => setTimeout(() => setPhase(i+1), d));
    return () => ts.forEach(clearTimeout);
  }, []);
  const floaters = ["lim","f'(x)","dx","d/dx","∂","→0","MVT","∞"];
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', background:`radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.09) 0%, transparent 65%), #060d1a`, textAlign:'center' }}>
      {floaters.map((s,i) => (
        <div key={s+i} style={{ position:'fixed', pointerEvents:'none', fontSize:14+(i%3)*7, color:`rgba(59,130,246,${0.04+(i%4)*0.02})`, top:`${8+i*11}%`, left:i%2===0?`${2+i*4}%`:`${74+i*2}%`, fontFamily:'JetBrains Mono,monospace', animation:`pulse ${3+i*0.6}s ease-in-out infinite`, animationDelay:`${i*0.25}s` }}>{s}</div>
      ))}
      <div style={{ opacity:phase>=1?1:0, transform:phase>=1?'translateY(0)':'translateY(12px)', transition:'all 0.6s ease', marginBottom:20, display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:40 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:ACCENT, animation:'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize:12, color:ACCENT, letterSpacing:'2px', textTransform:'uppercase', fontFamily:'Crimson Pro, serif' }}>Mathematics · Chapter 7</span>
      </div>
      <div style={{ opacity:phase>=2?1:0, transform:phase>=2?'translateY(0)':'translateY(20px)', transition:'all 0.7s ease 0.1s', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:'clamp(36px,10vw,84px)', color:'#fff', letterSpacing:'-3px', lineHeight:0.92, marginBottom:0 }}>
          Limits &<br /><span style={{ color:ACCENT }}>Derivatives</span>
        </h1>
        <div style={{ height:3, width:80, background:`linear-gradient(90deg, ${ACCENT}, transparent)`, margin:'16px auto 0', borderRadius:2 }} />
      </div>
      <div style={{ opacity:phase>=3?1:0, transition:'all 0.6s ease', maxWidth:560, marginBottom:40 }}>
        <p style={{ fontFamily:'Crimson Pro, serif', fontSize:19, color:'rgba(255,255,255,0.7)', lineHeight:1.55, marginBottom:18, fontStyle:'italic' }}>
          "The derivative is the instantaneous rate of change — the language with which nature writes its laws."
        </p>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 24px', textAlign:'left' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:12, fontFamily:'JetBrains Mono, monospace' }}>Chapter Overview</div>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>
            From the intuitive idea of limits and standard limits through continuity, differentiability, chain rule, and MVT — up to Olympiad-level Taylor series, Squeeze theorem, inequalities via calculus, and parametric differentiation.
          </p>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:20 }}>
          {['Class 11 → Olympiad','14 Topics','∞ Practice','Quiz-Gated Progress'].map(t => (
            <span key={t} style={{ padding:'4px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, fontSize:12, color:'rgba(255,255,255,0.5)', fontFamily:'Crimson Pro, serif' }}>{t}</span>
          ))}
        </div>
      </div>
      {phase >= 3 && (
        <button onClick={onNext} className="btn" style={{ padding:'16px 48px', background:ACCENT, color:'#fff', border:'none', borderRadius:50, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:`0 8px 30px ${ACCENT}55`, animation:'fadeUp 0.5s ease both' }}>
          Begin Chapter →
        </button>
      )}
    </div>
  );
}

function NotationScreen({ onNext }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setTimeout(() => setRevealed(true), 100); }, []);
  const groups = [
    { title:'Limits & Continuity', color:ACCENT, rows:NOTATION.slice(0,6) },
    { title:'Differentiation Rules', color:'#6366F1', rows:NOTATION.slice(6,11) },
    { title:'Theorems & Applications', color:'#EC4899', rows:NOTATION.slice(11,16) },
    { title:'Series & Advanced Tools', color:'#10B981', rows:NOTATION.slice(16) },
  ];
  return (
    <div style={{ minHeight:'100vh', background:'#060d1a', padding:'32px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:32, opacity:revealed?1:0, transition:'opacity 0.5s ease' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Before We Begin</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:34, color:'#fff', letterSpacing:'-1px', marginBottom:10 }}>Notation Guide</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>The complete notation of limits and derivatives — from Class 11 fundamentals to Olympiad tools.</p>
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
          <p style={{ fontFamily:'Crimson Pro,serif', fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>Click <strong style={{color:'#fff'}}>Done</strong> on any topic to face <strong style={{color:ACCENT}}>4 tough questions</strong>. Answer all 4 correctly to unlock the next topic.</p>
        </div>
        <button onClick={onNext} className="btn" style={{ width:'100%', padding:'16px', background:ACCENT, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${ACCENT}44` }}>
          Start Learning →
        </button>
      </div>
    </div>
  );
}

function SectionMenuScreen({ onSelect, completedIds }) {
  const levels = ['Foundation','JEE','Olympiad'];
  const lColors = { Foundation:'#3B82F6', JEE:'#6366F1', Olympiad:'#10B981' };
  const lDesc = { Foundation:'Class 11 · Limits & basic derivatives', JEE:'JEE Advanced · Deep calculus', Olympiad:'IMO · Olympiad techniques' };
  return (
    <div style={{ minHeight:'100vh', background:'#060d1a', padding:'28px 16px 60px' }}>
      <div style={{ maxWidth:660, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>Chapter · Limits & Derivatives</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:30, color:'#fff', letterSpacing:'-0.8px', marginBottom:6 }}>Choose a Topic</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:15, color:'rgba(255,255,255,0.4)', marginBottom:14 }}>Pass the quiz gate to unlock each next topic.</p>
          <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(completedIds.size/SECTIONS.length)*100}%`, background:`linear-gradient(90deg,${ACCENT},#6366F1)`, borderRadius:4, transition:'width 0.5s ease' }} />
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
                    <div style={{ width:40, height:40, borderRadius:10, background:done?`${lColors[level]}25`:locked?'rgba(255,255,255,0.05)':`${lColors[level]}15`, border:`1px solid ${done?lColors[level]+'55':locked?'rgba(255,255,255,0.08)':`${lColors[level]}30`}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:locked?20:13, color:done?lColors[level]:locked?'rgba(255,255,255,0.2)':lColors[level], fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>
                      {done?'✓':locked?'🔒':sec.icon}
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

function SectionLearnScreen({ section, onPractice, onBack }) {
  const [tab, setTab] = useState('learn');
  const lColors = { Foundation:'#3B82F6', JEE:'#6366F1', Olympiad:'#10B981' };
  const col = lColors[section.level] || ACCENT;
  const showGraph = section.diagram === 'graph';
  const showTangent = section.diagram === 'tangent';
  const graphFns = {
    limits_basics: x => (x*x-1)/(x-1),
    continuity: x => Math.abs(x),
  };
  const tangentFns = {
    first_principles: x => x*x,
    aod: x => x*x*x - 3*x,
  };
  return (
    <div style={{ minHeight:'100vh', background:'#060d1a', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(6,13,26,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px', display:'flex', alignItems:'center', gap:12 }}>
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
        {tab==='learn' && (
          <div className="fade-in">
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:22 }}>
              <div style={{ width:56, height:56, borderRadius:14, background:`${col}15`, border:`1px solid ${col}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:col, fontFamily:'JetBrains Mono,monospace', flexShrink:0, letterSpacing:'-1px' }}>{section.icon}</div>
              <p style={{ fontFamily:'Playfair Display, serif', fontSize:18, color:'#fff', fontStyle:'italic', lineHeight:1.5 }}>"{section.shortDef}"</p>
            </div>
            {showGraph && graphFns[section.id] && (
              <div style={{ marginBottom:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}>
                <FnGraphSVG fn={graphFns[section.id]} color={col} size={300} xRange={[-3,3]} yRange={[-1,6]} label={section.id==='limits_basics'?'f(x)=(x²-1)/(x-1)':'f(x)=|x|'} />
              </div>
            )}
            {showTangent && tangentFns[section.id] && (
              <div style={{ marginBottom:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}>
                <TangentSVG fn={tangentFns[section.id]} x0={section.id==='aod'?1:1} color={col} size={280} />
              </div>
            )}
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontSize:10, color:col, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Full Explanation</div>
              <p style={{ fontFamily:'Crimson Pro, serif', fontSize:17, color:'rgba(255,255,255,0.75)', lineHeight:1.8 }}>{section.fullDef}</p>
            </div>
          </div>
        )}
        {tab==='keys' && (
          <div className="fade-in">
            {section.keyFacts.map((fact,i) => (
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

function PracticeScreen({ section, onBack, onStartQuiz }) {
  const [qIdx, setQIdx] = useState(0);
  const [baseSeed] = useState(() => Math.floor(Math.random()*9999));
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [count, setCount] = useState(0);
  const lColors = { Foundation:'#3B82F6', JEE:'#6366F1', Olympiad:'#10B981' };
  const col = lColors[section.level] || ACCENT;
  const gen = GENERATORS[section.genKey] || GENERATORS.limits_basics;
  const seed = baseSeed + qIdx*97;
  const question = useCallback(()=>{ try{ return gen(seed); }catch{ return {question:'Loading…',steps:[],answer:'—',answerLatex:'—',tip:''}; } },[seed])();
  const next = () => { setQIdx(i=>i+1); setShowAnswer(false); setShowSteps(false); setCount(c=>c+1); };
  return (
    <div style={{ minHeight:'100vh', background:'#060d1a', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(6,13,26,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
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
            <p style={{ fontFamily:'Crimson Pro, serif', fontSize:17, color:'#e2e8f0', lineHeight:1.75, marginBottom:12, whiteSpace:'pre-wrap' }}>{question.question}</p>
            {question.questionLatex && <div style={{ background:`${col}0d`, border:`1px solid ${col}20`, borderRadius:10, padding:'12px 16px', overflowX:'auto' }}><KTex l={question.questionLatex} style={{ color:col, fontSize:15 }} /></div>}
          </div>
        </div>
        {!showAnswer && (
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <button onClick={()=>setShowSteps(v=>!v)} className="btn" style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.7)', fontFamily:'Crimson Pro,serif', fontSize:15 }}>{showSteps?'🙈 Hide Steps':'💡 Show Steps'}</button>
            <button onClick={()=>setShowAnswer(true)} className="btn" style={{ flex:1, padding:'12px', background:`${col}20`, border:`1px solid ${col}44`, borderRadius:10, color:col, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:15 }}>Reveal ▶</button>
          </div>
        )}
        {showSteps && !showAnswer && (
          <div className="fade-up" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
            {question.steps.map((step,i) => (
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
              {question.steps.map((step,i) => (
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
            {question.tip && <div style={{ background:'rgba(255,209,102,0.06)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:10 }}><span style={{fontSize:16,flexShrink:0}}>💡</span><p style={{ fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:14, color:'rgba(255,209,102,0.85)', lineHeight:1.6 }}>{question.tip}</p></div>}
            <button onClick={next} className="btn" style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${col}40` }}>Next Question ⟶</button>
          </div>
        )}
      </div>
    </div>
  );
}

function QuizScreen({ section, onPass, onFail, onBack }) {
  const lColors = { Foundation:'#3B82F6', JEE:'#6366F1', Olympiad:'#10B981' };
  const col = lColors[section.level] || ACCENT;
  const [baseSeed] = useState(()=>Math.floor(Math.random()*7777));
  const TOTAL=4;
  const [qIdx,setQIdx]=useState(0);
  const [selected,setSelected]=useState(null);
  const [confirmed,setConfirmed]=useState(false);
  const [score,setScore]=useState(0);
  const [shakeKey,setShakeKey]=useState(0);
  const [results,setResults]=useState([]);
  const [finished,setFinished]=useState(false);
  const quizGen=QUIZ_GENERATORS[section.genKey]||QUIZ_GENERATORS.limits_basics;
  const qSeed=baseSeed+qIdx*113;
  const question=useCallback(()=>{
    let q; let tries=0;
    do{ try{ q=quizGen(qSeed+tries*7); }catch{ q=null; } tries++; }
    while((!q||!q.q||!q.opts||q.opts.length<2)&&tries<10);
    if(!q||!q.q) return{q:'lim(x→2) x^2 = ?',opts:['4','2','8','1'],correct:'4',tip:'For polynomials, substitute directly.'};
    return q;
  },[qSeed])();
  const opts=(question.opts||[]).slice(0,4);
  const correctAnswer=question.correct;
  const confirm=()=>{
    if(selected===null) return;
    const isCorrect=String(selected)===String(correctAnswer);
    setConfirmed(true);
    if(isCorrect) setScore(s=>s+1); else setShakeKey(k=>k+1);
    setResults(r=>[...r,{correct:isCorrect,question:question.q}]);
  };
  const goNext=()=>{ if(qIdx+1>=TOTAL) setFinished(true); else{ setQIdx(i=>i+1); setSelected(null); setConfirmed(false); } };
  if(finished){
    const passed=score===TOTAL;
    return (
      <div style={{ minHeight:'100vh', background:'#060d1a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', textAlign:'center' }}>
        <div className="pop-in" style={{ maxWidth:420, width:'100%' }}>
          {passed?<TrophySVG col={col}/>:(
            <svg width="72" height="72" viewBox="0 0 72 72" style={{display:'block',margin:'0 auto'}}>
              <defs><radialGradient id="failGLD" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EF4444" stopOpacity="0.25"/><stop offset="100%" stopColor="#EF4444" stopOpacity="0"/></radialGradient></defs>
              <circle cx="36" cy="36" r="36" fill="url(#failGLD)"/>
              <circle cx="36" cy="36" r="28" fill="none" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.4"/>
              <text x="36" y="44" textAnchor="middle" fontSize="32" fontFamily="JetBrains Mono" fill="#EF4444">x</text>
            </svg>
          )}
          <div style={{ marginTop:20, fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:28, color:passed?'#fff':'#EF4444', marginBottom:10 }}>{passed?'Topic Mastered!':score+'/4 Correct'}</div>
          <div style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.55)', marginBottom:24, lineHeight:1.6 }}>{passed?'Perfect score! Unlocking next topic.':'Need all 4 correct. Review and retry.'}</div>
          {results.map((r,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:r.correct?'rgba(59,130,246,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${r.correct?'rgba(59,130,246,0.2)':'rgba(239,68,68,0.2)'}`, borderRadius:8, marginBottom:6, textAlign:'left' }}>
              <span style={{fontSize:16}}>{r.correct?'✅':'❌'}</span>
              <span style={{ fontFamily:'Crimson Pro,serif', fontSize:13, color:'rgba(255,255,255,0.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Q{i+1}: {r.question.substring(0,60)}{r.question.length>60?'…':''}</span>
            </div>
          ))}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20 }}>
            {passed?(
              <button onClick={onPass} className="btn" style={{ padding:'14px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>Continue to Next Topic →</button>
            ):(
              <button onClick={onFail} className="btn" style={{ padding:'14px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#FCA5A5', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>Review Topic & Retry</button>
            )}
            <button onClick={onBack} className="btn" style={{ padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', borderRadius:12, fontFamily:'Crimson Pro,serif', fontSize:15 }}>← Back to Topics</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ minHeight:'100vh', background:'#060d1a', paddingBottom:60 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(6,13,26,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>Exit Quiz</button>
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
          <span style={{fontSize:16}}>🔐</span>
          <span style={{ fontFamily:'Crimson Pro,serif', fontSize:13, color:col, fontStyle:'italic' }}>Answer all {TOTAL} correctly to unlock the next topic.</span>
        </div>
        <div key={qIdx} className="fade-up" style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${col}30`, borderRadius:16, padding:'20px 20px 24px', marginBottom:18 }}>
          <div style={{ fontSize:10, color:`${col}99`, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:12 }}>Question {qIdx+1} of {TOTAL}</div>
          <p style={{ fontFamily:'Crimson Pro,serif', fontSize:17, color:'#e2e8f0', lineHeight:1.75 }}>{question.q}</p>
        </div>
        <div key={'opts'+shakeKey} style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }} className={confirmed&&String(selected)!==String(correctAnswer)?'shake':''}>
          {opts.map((opt,i)=>{
            const isSel=String(selected)===String(opt);
            const isCorr=String(opt)===String(correctAnswer);
            let bg='rgba(255,255,255,0.04)',border='1px solid rgba(255,255,255,0.1)',color='rgba(255,255,255,0.8)';
            if(confirmed){ if(isCorr){bg='rgba(59,130,246,0.12)';border='1px solid rgba(59,130,246,0.5)';color='#93C5FD';} else if(isSel){bg='rgba(239,68,68,0.12)';border='1px solid rgba(239,68,68,0.5)';color='#FCA5A5';} } else if(isSel){bg=`${col}18`;border=`1px solid ${col}66`;color=col;}
            return (
              <button key={i} onClick={()=>!confirmed&&setSelected(opt)} className={!confirmed?'btn':''} disabled={confirmed}
                style={{ background:bg, border, borderRadius:12, padding:'14px 18px', textAlign:'left', color, fontFamily:'Crimson Pro,serif', fontSize:16, display:'flex', alignItems:'center', gap:12, cursor:confirmed?'default':'pointer', transition:'all 0.15s ease' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:isSel&&!confirmed?`${col}25`:confirmed&&isCorr?'rgba(59,130,246,0.2)':confirmed&&isSel?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)', border:`1px solid ${isSel&&!confirmed?col+'66':confirmed&&isCorr?'rgba(59,130,246,0.5)':confirmed&&isSel?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:'JetBrains Mono,monospace', flexShrink:0, color:isSel&&!confirmed?col:confirmed&&isCorr?'#93C5FD':confirmed&&isSel?'#FCA5A5':'rgba(255,255,255,0.4)' }}>
                  {confirmed?(isCorr?'✓':isSel?'✗':['A','B','C','D'][i]):['A','B','C','D'][i]}
                </div>
                <span>{String(opt)}</span>
              </button>
            );
          })}
        </div>
        {confirmed&&question.tip&&<div className="fade-up" style={{ background:'rgba(255,209,102,0.06)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:10 }}><span style={{fontSize:16,flexShrink:0}}>💡</span><p style={{ fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:14, color:'rgba(255,209,102,0.85)', lineHeight:1.6 }}>{question.tip}</p></div>}
        {!confirmed?(
          <button onClick={confirm} disabled={selected===null} className="btn" style={{ width:'100%', padding:'14px', background:selected!==null?`linear-gradient(135deg,${col},${col}bb)`:'rgba(255,255,255,0.06)', border:selected!==null?'none':'1px solid rgba(255,255,255,0.1)', color:selected!==null?'#fff':'rgba(255,255,255,0.3)', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16, opacity:selected===null?0.6:1, cursor:selected===null?'not-allowed':'pointer' }}>Submit Answer</button>
        ):(
          <button onClick={goNext} className="btn" style={{ width:'100%', padding:'14px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>{qIdx+1<TOTAL?'Next Question →':'See Results →'}</button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  useGlobalStyles();
  const [screen, setScreen] = useState('cover');
  const [activeIdx, setActiveIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState(new Set());
  const activeSection = SECTIONS[activeIdx];
  const nextSection = SECTIONS[activeIdx+1] || null;
  const handlePass = () => {
    setCompletedIds(prev => new Set([...prev, activeSection.id]));
    if(nextSection){ setActiveIdx(activeIdx+1); setScreen('learn'); }
    else setScreen('menu');
  };
  const handleFail = () => { setScreen('learn'); };
  if(screen==='cover')    return <CoverScreen onNext={()=>setScreen('notation')} />;
  if(screen==='notation') return <NotationScreen onNext={()=>setScreen('menu')} />;
  if(screen==='menu')     return <SectionMenuScreen completedIds={completedIds} onSelect={sec=>{ setActiveIdx(SECTIONS.indexOf(sec)); setScreen('learn'); }} />;
  if(screen==='learn')    return <SectionLearnScreen section={activeSection} onBack={()=>setScreen('menu')} onPractice={()=>setScreen('practice')} />;
  if(screen==='practice') return <PracticeScreen section={activeSection} onBack={()=>setScreen('learn')} onStartQuiz={()=>setScreen('quiz')} />;
  if(screen==='quiz')     return <QuizScreen section={activeSection} onPass={handlePass} onFail={handleFail} onBack={()=>setScreen('menu')} />;
  return <CoverScreen onNext={()=>setScreen('notation')} />;
}

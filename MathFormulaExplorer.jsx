import { useState, useEffect, useRef, useMemo } from "react";
import * as math from 'mathjs';
import * as Plotly from 'plotly';

// ─── KaTeX loader ─────────────────────────────────────────────
const _kCbs = []; let _kDone = false;
function _initKatex() {
  if (_kDone || window.katex || document.querySelector('[data-kx]')) return;
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.setAttribute('data-kx','1');
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
  document.head.appendChild(link);
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
  s.onload = () => { _kDone = true; _kCbs.forEach(f=>f()); _kCbs.length=0; };
  document.head.appendChild(s);
}
function onKatex(cb) { (_kDone||window.katex) ? cb() : _kCbs.push(cb); }

// ─── Utilities ────────────────────────────────────────────────
const safeEval = (expr) => {
  if (expr===''||expr==null) return 0;
  try {
    const r = math.evaluate(String(expr).trim());
    const n = typeof r==='number' ? r : r?.toNumber?.() ?? +r;
    return isFinite(n) ? n : NaN;
  } catch { return parseFloat(String(expr))||0; }
};
const evalArr = (vals) => String(vals).split(',').map(v=>safeEval(v.trim())).filter(v=>isFinite(v)&&!isNaN(v));
const fact = (n) => (n<=1?1:n*fact(n-1));
const d2r = (d) => (d*Math.PI)/180;
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const fmt = (n,d=4) => Number.isFinite(n) ? n.toFixed(d) : '—';
const lin = (a,b,n) => Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));

// ─── KaTeX Renderer ───────────────────────────────────────────
function KTex({ latex, block=false, style={} }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(!!window.katex);
  useEffect(() => { if (!ready) onKatex(()=>setReady(true)); }, []);
  useEffect(() => {
    if (ready&&ref.current&&latex) {
      try { window.katex.render(latex,ref.current,{throwOnError:false,displayMode:block,strict:false}); }
      catch { if(ref.current) ref.current.textContent=latex; }
    }
  }, [ready,latex,block]);
  if (!ready) return <span style={{fontFamily:'JetBrains Mono,monospace',opacity:0.8,...style}}>{latex}</span>;
  return <span ref={ref} style={style} />;
}

// ─── Plotly Graph ─────────────────────────────────────────────
function Graph({ data, layout }) {
  const divRef = useRef(null);
  useEffect(() => {
    if (!divRef.current||!data) return;
    const P = Plotly?.newPlot ? Plotly : Plotly?.default;
    if (!P) return;
    const ly = {
      paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(255,255,255,0.03)',
      font:{color:'#94a3b8',family:'Inter',size:11},
      margin:{t:40,b:36,l:46,r:16},
      legend:{bgcolor:'rgba(0,0,0,0)',font:{color:'#94a3b8'}},
      ...(layout||{}),
      xaxis:{gridcolor:'rgba(255,255,255,0.08)',zerolinecolor:'rgba(255,255,255,0.2)',linecolor:'rgba(255,255,255,0.08)',tickfont:{color:'#94a3b8'},...(layout?.xaxis||{})},
      yaxis:{gridcolor:'rgba(255,255,255,0.08)',zerolinecolor:'rgba(255,255,255,0.2)',linecolor:'rgba(255,255,255,0.08)',tickfont:{color:'#94a3b8'},...(layout?.yaxis||{})},
      ...(layout?.title?{title:{text:layout.title,font:{color:'#e2e8f0',size:14},x:0.5}}:{}),
    };
    P.newPlot(divRef.current,data,ly,{responsive:true,displayModeBar:false});
    return () => { try { P.purge?.(divRef.current); } catch {} };
  }, [data,layout]);
  return <div ref={divRef} style={{width:'100%',height:280}} />;
}
// ─── Topic Data ───────────────────────────────────────────────
const TOPICS = [
  { id:"algebra", name:"Algebra & Identities", classes:"Classes 9–10", icon:"x²", emoji:"⚡", color:"#FF6B6B", dim:"#7a1a1a",
    formulas:[
      { id:"ab2p", name:"(a+b)² Identity", formula:"(a+b)² = a²+2ab+b²", latex:"(a+b)^2 = a^2 + 2ab + b^2", desc:"Expand the square of a sum",
        inputs:[{id:"a",label:"a"},{id:"b",label:"b"}],
        compute:({a,b})=>{ [a,b]=[safeEval(a),safeEval(b)]; return { steps:[`Given: a=${a}, b=${b}`,`LHS: (${a}+${b})²=(${a+b})²=${(a+b)**2}`,`RHS: a²+2ab+b²=${a*a}+${2*a*b}+${b*b}=${a*a+2*a*b+b*b}`,`LHS=RHS ✓`], answer:`(${a}+${b})²=${(a+b)**2}` }; }
      },
      { id:"ab2m", name:"(a−b)² Identity", formula:"(a−b)²=a²−2ab+b²", latex:"(a-b)^2 = a^2 - 2ab + b^2", desc:"Expand the square of a difference",
        inputs:[{id:"a",label:"a"},{id:"b",label:"b"}],
        compute:({a,b})=>{ [a,b]=[safeEval(a),safeEval(b)]; return { steps:[`Given: a=${a}, b=${b}`,`LHS: (${a}−${b})²=(${a-b})²=${(a-b)**2}`,`RHS: ${a*a}−${2*a*b}+${b*b}=${a*a-2*a*b+b*b}`], answer:`(${a}−${b})²=${(a-b)**2}` }; }
      },
      { id:"diffsq", name:"Difference of Squares", formula:"a²−b²=(a−b)(a+b)", latex:"a^2-b^2=(a-b)(a+b)", desc:"Factorize a difference of two perfect squares",
        inputs:[{id:"a",label:"a"},{id:"b",label:"b"}],
        compute:({a,b})=>{ [a,b]=[safeEval(a),safeEval(b)]; return { steps:[`a²−b²=${a*a}−${b*b}=${a*a-b*b}`,`(a−b)(a+b)=(${a-b})(${a+b})=${(a-b)*(a+b)}`,`LHS=RHS ✓`], answer:`${a}²−${b}²=(${a-b})(${a+b})=${a*a-b*b}` }; }
      },
      { id:"quad", name:"Quadratic Formula", formula:"x=(−b±√(b²−4ac))/2a", latex:"x = \\dfrac{-b \\pm \\sqrt{b^2-4ac}}{2a}", desc:"Roots of ax²+bx+c=0",
        inputs:[{id:"a",label:"a (coeff x²)"},{id:"b",label:"b (coeff x)"},{id:"c",label:"c (constant)"}],
        compute:({a,b,c})=>{
          [a,b,c]=[safeEval(a),safeEval(b),safeEval(c)];
          if(!a) return {steps:["⚠ 'a' cannot be 0"],answer:"Invalid"};
          const disc=b*b-4*a*c;
          const steps=[`Equation: ${fmt(a,4)}x²+${fmt(b,4)}x+${fmt(c,4)}=0`,`Δ=b²−4ac=${fmt(disc,6)}`];
          let answer;
          if(disc>0){ const s=Math.sqrt(disc),x1=(-b+s)/(2*a),x2=(-b-s)/(2*a); steps.push(`Δ>0 → Two real roots`,`x=(${fmt(-b,4)}±${fmt(s,4)})/${fmt(2*a,4)}`,`x₁=${fmt(x1,8)}`,`x₂=${fmt(x2,8)}`); answer=`x₁=${fmt(x1,4)}, x₂=${fmt(x2,4)}`; }
          else if(disc===0){ const x=-b/(2*a); steps.push(`Δ=0 → Repeated root`,`x=${fmt(x,8)}`); answer=`x=${fmt(x,4)} (repeated)`; }
          else { const re=-b/(2*a),im=Math.sqrt(-disc)/(2*a); steps.push(`Δ<0 → Complex roots`,`Re=${fmt(re,6)}, Im=${fmt(im,6)}`); answer=`x=${fmt(re,4)}±${fmt(im,4)}i`; }
          return {steps,answer};
        }
      },
      { id:"vieta", name:"Sum & Product of Roots", formula:"α+β=−b/a, αβ=c/a", latex:"\\alpha+\\beta=\\dfrac{-b}{a},\\quad\\alpha\\beta=\\dfrac{c}{a}", desc:"Vieta's formulas",
        inputs:[{id:"a",label:"a"},{id:"b",label:"b"},{id:"c",label:"c"}],
        compute:({a,b,c})=>{ [a,b,c]=[safeEval(a),safeEval(b),safeEval(c)]; return {steps:[`For ${fmt(a,4)}x²+${fmt(b,4)}x+${fmt(c,4)}=0`,`Sum: α+β=−b/a=${fmt(-b/a,8)}`,`Product: αβ=c/a=${fmt(c/a,8)}`],answer:`α+β=${fmt(-b/a,4)}, αβ=${fmt(c/a,4)}`}; }
      },
      { id:"cube", name:"(a+b)³ Expansion", formula:"(a+b)³=a³+b³+3ab(a+b)", latex:"(a+b)^3=a^3+b^3+3ab(a+b)", desc:"Cube of a sum",
        inputs:[{id:"a",label:"a"},{id:"b",label:"b"}],
        compute:({a,b})=>{ [a,b]=[safeEval(a),safeEval(b)]; const lhs=(a+b)**3,rhs=a**3+b**3+3*a*b*(a+b); return {steps:[`(${fmt(a,4)}+${fmt(b,4)})³=${fmt(lhs,6)}`,`a³+b³+3ab(a+b)=${fmt(a**3,4)}+${fmt(b**3,4)}+${fmt(3*a*b*(a+b),4)}=${fmt(rhs,6)} ✓`],answer:`(${fmt(a,4)}+${fmt(b,4)})³=${fmt(lhs,4)}`}; }
      },
    ]
  },
  { id:"trig", name:"Trigonometry", classes:"Classes 10–12", icon:"sinθ", emoji:"📐", color:"#4ECDC4", dim:"#0d4a47",
    formulas:[
      { id:"pyth", name:"Pythagorean Identity", formula:"sin²θ+cos²θ=1", latex:"\\sin^2\\theta+\\cos^2\\theta=1", desc:"The most fundamental identity",
        inputs:[{id:"theta",label:"θ (degrees)"}],
        compute:({theta})=>{ const t=safeEval(theta),r=d2r(t),s=Math.sin(r),c=Math.cos(r); return {steps:[`θ=${fmt(t,4)}°`,`sin(θ)=${fmt(s,8)}`,`cos(θ)=${fmt(c,8)}`,`sin²θ+cos²θ=${fmt(s*s+c*c,10)}`],answer:`sin²(${fmt(t,2)}°)+cos²(${fmt(t,2)}°)=${fmt(s*s+c*c,8)} ≈1 ✓`}; }
      },
      { id:"sinab", name:"sin(A+B) Addition", formula:"sin(A+B)=sinA cosB+cosA sinB", latex:"\\sin(A+B)=\\sin A\\cos B+\\cos A\\sin B", desc:"Sine of sum of two angles",
        inputs:[{id:"A",label:"Angle A (degrees)"},{id:"B",label:"Angle B (degrees)"}],
        compute:({A,B})=>{ [A,B]=[safeEval(A),safeEval(B)]; const ar=d2r(A),br=d2r(B),lhs=Math.sin(d2r(A+B)),rhs=Math.sin(ar)*Math.cos(br)+Math.cos(ar)*Math.sin(br); return {steps:[`A=${fmt(A,4)}°, B=${fmt(B,4)}°`,`sin(A+B)=${fmt(lhs,6)}`,`sinA·cosB+cosA·sinB=${fmt(rhs,6)} ✓`],answer:`sin(${fmt(A,2)}°+${fmt(B,2)}°)=${fmt(lhs,6)}`}; }
      },
      { id:"cos2t", name:"cos(2θ) Double Angle", formula:"cos(2θ)=cos²θ−sin²θ=2cos²θ−1=1−2sin²θ", latex:"\\cos(2\\theta)=\\cos^2\\theta-\\sin^2\\theta=2\\cos^2\\theta-1=1-2\\sin^2\\theta", desc:"Three forms of the double angle formula",
        inputs:[{id:"theta",label:"θ (degrees)"}],
        compute:({theta})=>{ const t=safeEval(theta),r=d2r(t),c=Math.cos(r),s=Math.sin(r); return {steps:[`θ=${fmt(t,4)}°, 2θ=${fmt(2*t,4)}°`,`Direct: cos(2θ)=${fmt(Math.cos(2*r),8)}`,`Form1: cos²θ−sin²θ=${fmt(c*c-s*s,8)}`,`Form2: 2cos²θ−1=${fmt(2*c*c-1,8)}`,`Form3: 1−2sin²θ=${fmt(1-2*s*s,8)}`,`All equal ✓`],answer:`cos(2×${fmt(t,2)}°)=${fmt(Math.cos(2*r),6)}`}; }
      },
    ]
  },
  { id:"coordinate", name:"Coordinate Geometry", classes:"Classes 9–11", icon:"(x,y)", emoji:"📍", color:"#FFD166", dim:"#5a4200",
    formulas:[
      { id:"dist", name:"Distance Formula", formula:"d=√((x₂−x₁)²+(y₂−y₁)²)", latex:"d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}", desc:"Distance between two points",
        inputs:[{id:"x1",label:"x₁"},{id:"y1",label:"y₁"},{id:"x2",label:"x₂"},{id:"y2",label:"y₂"}],
        compute:({x1,y1,x2,y2})=>{ [x1,y1,x2,y2]=[x1,y1,x2,y2].map(safeEval); const dx=x2-x1,dy=y2-y1,d=Math.sqrt(dx*dx+dy*dy); return {steps:[`P₁(${fmt(x1,4)},${fmt(y1,4)})→P₂(${fmt(x2,4)},${fmt(y2,4)})`,`Δx=${fmt(dx,4)}, Δy=${fmt(dy,4)}`,`d=√(${fmt(dx*dx,4)}+${fmt(dy*dy,4)})=√${fmt(dx*dx+dy*dy,4)}`,`d=${fmt(d,8)}`],answer:`Distance=${fmt(d,6)} units`}; },
        buildGraph:(inp)=>{ const [x1,y1,x2,y2]=['x1','y1','x2','y2'].map(k=>safeEval(inp[k])); const mx=(x1+x2)/2,my=(y1+y2)/2,pad=Math.max(1,Math.abs(x2-x1),Math.abs(y2-y1))*0.4+1; return {data:[{x:[x1,x2],y:[y1,y2],type:'scatter',mode:'lines',name:'Segment',line:{color:'rgba(255,209,102,0.4)',width:2,dash:'dot'}},{x:[x1,x2],y:[y1,y2],type:'scatter',mode:'markers',name:'Points',marker:{color:'#4ECDC4',size:12}},{x:[mx],y:[my],type:'scatter',mode:'markers',name:'Midpoint',marker:{color:'#FF6B6B',size:10,symbol:'diamond'}}],layout:{title:'Distance Between Points',xaxis:{range:[Math.min(x1,x2)-pad,Math.max(x1,x2)+pad]},yaxis:{range:[Math.min(y1,y2)-pad,Math.max(y1,y2)+pad],scaleanchor:'x'}}}; }
      },
      { id:"slope", name:"Slope Formula", formula:"m=(y₂−y₁)/(x₂−x₁)", latex:"m=\\dfrac{y_2-y_1}{x_2-x_1}", desc:"Gradient of a straight line",
        inputs:[{id:"x1",label:"x₁"},{id:"y1",label:"y₁"},{id:"x2",label:"x₂"},{id:"y2",label:"y₂"}],
        compute:({x1,y1,x2,y2})=>{ [x1,y1,x2,y2]=[x1,y1,x2,y2].map(safeEval); if(x2===x1) return {steps:["x₁=x₂ → Vertical line","Slope undefined (∞)"],answer:"Slope=undefined"}; const m=(y2-y1)/(x2-x1); return {steps:[`Points:(${fmt(x1,4)},${fmt(y1,4)}) and (${fmt(x2,4)},${fmt(y2,4)})`,`m=(${fmt(y2,4)}−${fmt(y1,4)})/(${fmt(x2,4)}−${fmt(x1,4)})=${fmt(m,8)}`,m>0?"↗ Positive slope":m<0?"↘ Negative slope":"→ Zero slope"],answer:`Slope m=${fmt(m,6)}`}; },
        buildGraph:(inp)=>{ const [x1,y1,x2,y2]=['x1','y1','x2','y2'].map(k=>safeEval(inp[k])); if(x2===x1) return {data:[{x:[x1,x1],y:[Math.min(y1,y2)-2,Math.max(y1,y2)+2],type:'scatter',mode:'lines',name:'Vertical',line:{color:'#FFD166',width:2.5}}],layout:{title:'Vertical Line (Slope Undefined)'}}; const m=(y2-y1)/(x2-x1),bi=y1-m*x1,pad=Math.max(2,Math.abs(x2-x1)),xL=[x1-pad,x2+pad]; return {data:[{x:xL,y:xL.map(x=>m*x+bi),type:'scatter',mode:'lines',name:`y=${fmt(m,2)}x${bi>=0?'+':''}${fmt(bi,2)}`,line:{color:'#FFD166',width:2.5}},{x:[x1,x2],y:[y1,y2],type:'scatter',mode:'markers',name:'Points',marker:{color:'#FF6B6B',size:12}}],layout:{title:`Slope m=${fmt(m,4)}`}}; }
      },
      { id:"section", name:"Section Formula", formula:"P=((mx₂+nx₁)/(m+n),(my₂+ny₁)/(m+n))", latex:"P=\\left(\\dfrac{mx_2+nx_1}{m+n},\\dfrac{my_2+ny_1}{m+n}\\right)", desc:"Point dividing a segment in ratio m:n",
        inputs:[{id:"x1",label:"x₁"},{id:"y1",label:"y₁"},{id:"x2",label:"x₂"},{id:"y2",label:"y₂"},{id:"m",label:"m (ratio part 1)"},{id:"n",label:"n (ratio part 2)"}],
        compute:({x1,y1,x2,y2,m,n})=>{ [x1,y1,x2,y2,m,n]=[x1,y1,x2,y2,m,n].map(safeEval); if(m+n===0) return {steps:["m+n cannot be 0"],answer:"Invalid"}; const px=(m*x2+n*x1)/(m+n),py=(m*y2+n*y1)/(m+n); return {steps:[`A(${fmt(x1,4)},${fmt(y1,4)}) to B(${fmt(x2,4)},${fmt(y2,4)}), ratio ${fmt(m,2)}:${fmt(n,2)}`,`Px=(${fmt(m,2)}×${fmt(x2,2)}+${fmt(n,2)}×${fmt(x1,2)})/${fmt(m+n,2)}=${fmt(px,8)}`,`Py=(${fmt(m,2)}×${fmt(y2,2)}+${fmt(n,2)}×${fmt(y1,2)})/${fmt(m+n,2)}=${fmt(py,8)}`],answer:`P=(${fmt(px,4)},${fmt(py,4)})`}; }
      },
    ]
  },
  { id:"sequences", name:"Sequences & Series", classes:"Classes 10–11", icon:"aₙ", emoji:"🔢", color:"#A78BFA", dim:"#2d1a6e",
    formulas:[
      { id:"apn", name:"AP: nth Term", formula:"aₙ=a+(n−1)d", latex:"a_n=a+(n-1)d", desc:"nth term of Arithmetic Progression",
        inputs:[{id:"a",label:"a (1st term)"},{id:"d",label:"d (common diff)"},{id:"n",label:"n (term no.)"}],
        compute:({a,d,n})=>{ [a,d,n]=[safeEval(a),safeEval(d),safeEval(n)]; const an=a+(n-1)*d; return {steps:[`a=${fmt(a,4)}, d=${fmt(d,4)}, n=${fmt(n,4)}`,`aₙ=${fmt(a,4)}+(${fmt(n,4)}−1)×${fmt(d,4)}=${fmt(a,4)}+${fmt((n-1)*d,4)}`],answer:`a${Math.round(n)}=${fmt(an,6)}`}; }
      },
      { id:"aps", name:"AP: Sum of n Terms", formula:"Sₙ=(n/2)[2a+(n−1)d]", latex:"S_n=\\dfrac{n}{2}[2a+(n-1)d]", desc:"Sum of first n terms of AP",
        inputs:[{id:"a",label:"a"},{id:"d",label:"d"},{id:"n",label:"n"}],
        compute:({a,d,n})=>{ [a,d,n]=[safeEval(a),safeEval(d),safeEval(n)]; const sn=(n/2)*(2*a+(n-1)*d); return {steps:[`Sₙ=(${fmt(n,4)}/2)[2(${fmt(a,4)})+(${fmt(n,4)}−1)(${fmt(d,4)})]`,`=${fmt(n/2,4)}×[${fmt(2*a,4)}+${fmt((n-1)*d,4)}]`,`=${fmt(n/2,4)}×${fmt(2*a+(n-1)*d,4)}`],answer:`S${Math.round(n)}=${fmt(sn,6)}`}; }
      },
      { id:"gpn", name:"GP: nth Term", formula:"aₙ=arⁿ⁻¹", latex:"a_n=a\\cdot r^{n-1}", desc:"nth term of Geometric Progression",
        inputs:[{id:"a",label:"a (1st term)"},{id:"r",label:"r (common ratio)"},{id:"n",label:"n (term no.)"}],
        compute:({a,r,n})=>{ [a,r,n]=[safeEval(a),safeEval(r),safeEval(n)]; const an=a*r**(n-1); return {steps:[`a=${fmt(a,4)}, r=${fmt(r,4)}, n=${fmt(n,4)}`,`aₙ=${fmt(a,4)}×${fmt(r,4)}^${fmt(n-1,4)}=${fmt(a,4)}×${fmt(r**(n-1),6)}`],answer:`a${Math.round(n)}=${fmt(an,6)}`}; }
      },
      { id:"gps", name:"GP: Sum of n Terms", formula:"Sₙ=a(rⁿ−1)/(r−1)", latex:"S_n=\\dfrac{a(r^n-1)}{r-1}", desc:"Sum of n terms of GP (r≠1)",
        inputs:[{id:"a",label:"a"},{id:"r",label:"r (≠1)"},{id:"n",label:"n"}],
        compute:({a,r,n})=>{ [a,r,n]=[safeEval(a),safeEval(r),safeEval(n)]; if(r===1) return {steps:[`r=1, Sₙ=n×a=${fmt(n*a,4)}`],answer:`S${Math.round(n)}=${fmt(n*a,4)}`}; const sn=a*(r**n-1)/(r-1); return {steps:[`a=${fmt(a,4)}, r=${fmt(r,4)}, n=${fmt(n,4)}`,`Sₙ=${fmt(a,4)}(${fmt(r,4)}^${fmt(n,4)}−1)/(${fmt(r,4)}−1)`,`=${fmt(a,4)}(${fmt(r**n,6)}−1)/${fmt(r-1,4)}`],answer:`S${Math.round(n)}=${fmt(sn,6)}`}; }
      },
    ]
  },
  { id:"calculus", name:"Calculus", classes:"Classes 11–12", icon:"d/dx", emoji:"∫", color:"#F97316", dim:"#6b2a00",
    formulas:[
      { id:"pow", name:"Power Rule (Differentiation)", formula:"d/dx(xⁿ)=nxⁿ⁻¹", latex:"\\dfrac{d}{dx}(x^n)=nx^{n-1}", desc:"Derivative of a power of x",
        inputs:[{id:"coeff",label:"Coefficient (a in axⁿ)"},{id:"n",label:"Power n"},{id:"x",label:"Evaluate at x="}],
        compute:({coeff,n,x})=>{ [coeff,n,x]=[safeEval(coeff),safeEval(n),safeEval(x)]; const nc=coeff*n,np=n-1,val=nc*x**np; return {steps:[`f(x)=${fmt(coeff,4)}x^${fmt(n,4)}`,`f'(x)=${fmt(nc,4)}x^${fmt(np,4)}`,`At x=${fmt(x,4)}: f'(${fmt(x,4)})=${fmt(nc,4)}×${fmt(x,4)}^${fmt(np,4)}=${fmt(val,8)}`],answer:`f'(x)=${fmt(nc,4)}x^${fmt(np,4)}, f'(${fmt(x,4)})=${fmt(val,6)}`}; },
        buildGraph:(inp)=>{ const [coeff,n,xAt]=['coeff','n','x'].map(k=>safeEval(inp[k])); const nc=coeff*n,np=n-1,xRange=[xAt-3,xAt+3],xs=lin(xRange[0],xRange[1],200),ys=xs.map(x=>{try{return coeff*x**n;}catch{return null;}}),yAt=coeff*xAt**n,dyAt=nc*xAt**np,tanY=xs.map(x=>yAt+dyAt*(x-xAt)); return {data:[{x:xs,y:ys,type:'scatter',mode:'lines',name:`f(x)=${fmt(coeff,2)}x^${fmt(n,2)}`,line:{color:'#F97316',width:2.5}},{x:xs,y:tanY,type:'scatter',mode:'lines',name:`Tangent at x=${fmt(xAt,2)}`,line:{color:'#FFD166',width:1.5,dash:'dot'}},{x:[xAt],y:[yAt],type:'scatter',mode:'markers',name:`(${fmt(xAt,2)},${fmt(yAt,4)})`,marker:{color:'#FF6B6B',size:12}}],layout:{title:`f'(x)=${fmt(nc,2)}x^${fmt(np,2)}`}}; }
      },
      { id:"intp", name:"Integration (Power Rule)", formula:"∫xⁿdx=xⁿ⁺¹/(n+1)+C", latex:"\\int x^n\\,dx=\\dfrac{x^{n+1}}{n+1}+C\\quad(n\\ne-1)", desc:"Integral of a power (n≠−1)",
        inputs:[{id:"coeff",label:"Coefficient"},{id:"n",label:"Power n (n≠−1)"}],
        compute:({coeff,n})=>{ [coeff,n]=[safeEval(coeff),safeEval(n)]; if(Math.abs(n+1)<1e-10) return {steps:["n=−1: ∫(1/x)dx=ln|x|+C"],answer:`${fmt(coeff,4)}ln|x|+C`}; const nc=coeff/(n+1); return {steps:[`∫${fmt(coeff,4)}x^${fmt(n,4)}dx`,`=${fmt(coeff,4)}×x^${fmt(n+1,4)}/(${fmt(n+1,4)})+C`,`=${fmt(nc,4)}x^${fmt(n+1,4)}+C`],answer:`=${fmt(nc,4)}x^${fmt(n+1,4)}+C`}; }
      },
      { id:"prodrule", name:"Product Rule", formula:"d/dx(uv)=u·dv/dx+v·du/dx", latex:"\\dfrac{d}{dx}(uv)=u\\dfrac{dv}{dx}+v\\dfrac{du}{dx}", desc:"Derivative of a product",
        inputs:[{id:"un",label:"u=xᵃ — power a"},{id:"uc",label:"Coefficient of u"},{id:"vn",label:"v=xᵇ — power b"},{id:"vc",label:"Coefficient of v"},{id:"x",label:"Evaluate at x="}],
        compute:({un,uc,vn,vc,x})=>{ [un,uc,vn,vc,x]=[un,uc,vn,vc,x].map(safeEval); const u=uc*x**un,v=vc*x**vn,du=uc*un*x**(un-1),dv=vc*vn*x**(vn-1); return {steps:[`u=${fmt(uc,4)}x^${fmt(un,4)}, v=${fmt(vc,4)}x^${fmt(vn,4)}`,`du/dx=${fmt(uc*un,4)}x^${fmt(un-1,4)}, dv/dx=${fmt(vc*vn,4)}x^${fmt(vn-1,4)}`,`At x=${fmt(x,4)}: u=${fmt(u,4)}, v=${fmt(v,4)}, du=${fmt(du,4)}, dv=${fmt(dv,4)}`,`d/dx(uv)=${fmt(u*dv+v*du,6)}`],answer:`d/dx(uv) at x=${fmt(x,4)}=${fmt(u*dv+v*du,6)}`}; }
      },
    ]
  },
  { id:"mensuration", name:"Mensuration", classes:"Classes 9–10", icon:"πr²", emoji:"⭕", color:"#FB923C", dim:"#6b2a00",
    formulas:[
      { id:"ca", name:"Circle Area", formula:"A=πr²", latex:"A=\\pi r^2", desc:"Area enclosed by a circle",
        inputs:[{id:"r",label:"Radius r"}],
        compute:({r})=>{ r=safeEval(r); const a=Math.PI*r*r; return {steps:[`A=πr²=π×${fmt(r,4)}²=${fmt(a,8)}`],answer:`Area=${fmt(a,6)} sq. units`}; },
        buildGraph:(inp)=>{ const r=safeEval(inp.r); if(!isFinite(r)||r<=0) return null; const t=lin(0,2*Math.PI,400); return {data:[{x:t.map(th=>r*Math.cos(th)),y:t.map(th=>r*Math.sin(th)),type:'scatter',mode:'lines',fill:'toself',fillcolor:'rgba(251,146,60,0.15)',name:`Circle r=${fmt(r,4)}`,line:{color:'#FB923C',width:2.5}}],layout:{title:`Circle: r=${fmt(r,4)}`,xaxis:{range:[-r*1.4,r*1.4]},yaxis:{range:[-r*1.4,r*1.4],scaleanchor:'x'}}}; }
      },
      { id:"cv", name:"Cylinder Volume", formula:"V=πr²h", latex:"V=\\pi r^2 h", desc:"Volume of a right circular cylinder",
        inputs:[{id:"r",label:"Radius r"},{id:"h",label:"Height h"}],
        compute:({r,h})=>{ [r,h]=[safeEval(r),safeEval(h)]; const v=Math.PI*r*r*h; return {steps:[`V=πr²h=π×${fmt(r,4)}²×${fmt(h,4)}=${fmt(v,8)}`],answer:`Volume=${fmt(v,6)} cubic units`}; }
      },
      { id:"conv", name:"Cone Volume", formula:"V=(1/3)πr²h", latex:"V=\\dfrac{1}{3}\\pi r^2 h", desc:"Volume of a right circular cone",
        inputs:[{id:"r",label:"Radius r"},{id:"h",label:"Height h"}],
        compute:({r,h})=>{ [r,h]=[safeEval(r),safeEval(h)]; const v=(1/3)*Math.PI*r*r*h; return {steps:[`V=(1/3)πr²h=(1/3)×π×${fmt(r,4)}²×${fmt(h,4)}=${fmt(v,8)}`],answer:`Volume=${fmt(v,6)} cubic units`}; }
      },
      { id:"ssa", name:"Sphere Surface Area", formula:"SA=4πr²", latex:"SA=4\\pi r^2", desc:"Total surface area of a sphere",
        inputs:[{id:"r",label:"Radius r"}],
        compute:({r})=>{ r=safeEval(r); const sa=4*Math.PI*r*r; return {steps:[`SA=4πr²=4×π×${fmt(r,4)}²=${fmt(sa,8)}`],answer:`SA=${fmt(sa,6)} sq. units`}; }
      },
      { id:"sv", name:"Sphere Volume", formula:"V=(4/3)πr³", latex:"V=\\dfrac{4}{3}\\pi r^3", desc:"Volume enclosed by a sphere",
        inputs:[{id:"r",label:"Radius r"}],
        compute:({r})=>{ r=safeEval(r); const v=(4/3)*Math.PI*r**3; return {steps:[`V=(4/3)πr³=(4/3)×π×${fmt(r,4)}³=${fmt(v,8)}`],answer:`Volume=${fmt(v,6)} cubic units`}; }
      },
    ]
  },
  { id:"stats", name:"Statistics & Probability", classes:"Classes 9–12", icon:"P(E)", emoji:"🎲", color:"#34D399", dim:"#05422a",
    formulas:[
      { id:"prob", name:"Basic Probability", formula:"P(E)=Favourable/Total", latex:"P(E)=\\dfrac{\\text{Favourable}}{\\text{Total Outcomes}}", desc:"Classical probability of an event",
        inputs:[{id:"fav",label:"Favourable outcomes"},{id:"total",label:"Total outcomes"}],
        compute:({fav,total})=>{ [fav,total]=[safeEval(fav),safeEval(total)]; if(total<=0) return {steps:["Total must be > 0"],answer:"Invalid"}; const p=fav/total; return {steps:[`Favourable=${fmt(fav,4)}, Total=${fmt(total,4)}`,`P(E)=${fmt(fav,4)}/${fmt(total,4)}=${fmt(p,8)}`,`As %: ${fmt(p*100,4)}%`,p>=0&&p<=1?"Valid ✓":"⚠ Invalid!"],answer:`P(E)=${fmt(p,6)} ≈${fmt(p*100,2)}%`}; }
      },
      { id:"condp", name:"Conditional Probability", formula:"P(A|B)=P(A∩B)/P(B)", latex:"P(A|B)=\\dfrac{P(A\\cap B)}{P(B)}", desc:"Probability of A given B",
        inputs:[{id:"pAB",label:"P(A∩B)"},{id:"pB",label:"P(B)"}],
        compute:({pAB,pB})=>{ [pAB,pB]=[safeEval(pAB),safeEval(pB)]; if(pB===0) return {steps:["P(B)≠0"],answer:"Undefined"}; return {steps:[`P(A|B)=P(A∩B)/P(B)=${fmt(pAB,6)}/${fmt(pB,6)}`],answer:`P(A|B)=${fmt(pAB/pB,6)}`}; }
      },
      { id:"combstat", name:"Combination ⁿCᵣ", formula:"ⁿCᵣ=n!/(r!(n−r)!)", latex:"\\binom{n}{r}=\\dfrac{n!}{r!(n-r)!}", desc:"Ways to choose r from n",
        inputs:[{id:"n",label:"n (total)"},{id:"r",label:"r (chosen)"}],
        compute:({n,r})=>{ [n,r]=[Math.floor(safeEval(n)),Math.floor(safeEval(r))]; if(r>n||r<0||n<0||n>20) return {steps:["Need 0≤r≤n≤20"],answer:"Invalid"}; const res=fact(n)/(fact(r)*fact(n-r)); return {steps:[`${n}C${r}=${n}!/(${r}!×${n-r}!)=${fact(n)}/(${fact(r)}×${fact(n-r)})=${res}`],answer:`ⁿCᵣ=${res}`}; }
      },
    ]
  },
  { id:"logs", name:"Logarithms", classes:"Classes 10–12", icon:"log", emoji:"🔬", color:"#60A5FA", dim:"#1a3a6b",
    formulas:[
      { id:"lprod", name:"Product Rule", formula:"log(ab)=log a+log b", latex:"\\log(ab)=\\log a+\\log b", desc:"Log of a product equals sum of logs",
        inputs:[{id:"a",label:"a (>0)"},{id:"b",label:"b (>0)"},{id:"base",label:"Log Base (e.g. 10)"}],
        compute:({a,b,base})=>{ [a,b,base]=[safeEval(a),safeEval(b),safeEval(base)]; if(a<=0||b<=0||base<=0||base===1) return {steps:["Invalid"],answer:"Invalid"}; const L=x=>Math.log(x)/Math.log(base); return {steps:[`log₍${fmt(base,2)}₎(${fmt(a*b,4)})=${fmt(L(a*b),8)}`,`log₍${fmt(base,2)}₎(${fmt(a,4)})+log₍${fmt(base,2)}₎(${fmt(b,4)})=${fmt(L(a)+L(b),8)} ✓`],answer:`log₍${fmt(base,2)}₎(${fmt(a*b,4)})=${fmt(L(a*b),4)}`}; }
      },
      { id:"lpow", name:"Power Rule", formula:"log(aⁿ)=n×log a", latex:"\\log(a^n)=n\\cdot\\log a", desc:"Log of a power",
        inputs:[{id:"a",label:"a (>0)"},{id:"n",label:"n (exponent)"},{id:"base",label:"Base"}],
        compute:({a,n,base})=>{ [a,n,base]=[safeEval(a),safeEval(n),safeEval(base)]; if(a<=0||base<=0||base===1) return {steps:["Invalid"],answer:"Invalid"}; const L=x=>Math.log(x)/Math.log(base); return {steps:[`log₍${fmt(base,2)}₎(${fmt(a,4)}^${fmt(n,4)})=${fmt(L(a**n),8)}`,`n×log₍${fmt(base,2)}₎(${fmt(a,4)})=${fmt(n,4)}×${fmt(L(a),6)}=${fmt(n*L(a),8)} ✓`],answer:`log₍${fmt(base,2)}₎(${fmt(a,4)}^${fmt(n,4)})=${fmt(L(a**n),4)}`}; }
      },
      { id:"lcob", name:"Change of Base", formula:"log_b(a)=log_c(a)/log_c(b)", latex:"\\log_b a=\\dfrac{\\log_c a}{\\log_c b}", desc:"Convert logarithm from one base to another",
        inputs:[{id:"a",label:"a (argument)"},{id:"b",label:"b (target base)"},{id:"c",label:"c (bridge base)"}],
        compute:({a,b,c})=>{ [a,b,c]=[safeEval(a),safeEval(b),safeEval(c)]; if(a<=0||b<=0||c<=0||b===1||c===1) return {steps:["Invalid"],answer:"Invalid"}; const Lc=x=>Math.log(x)/Math.log(c),res=Lc(a)/Lc(b); return {steps:[`log₍${fmt(c,2)}₎(${fmt(a,4)})=${fmt(Lc(a),6)}`,`log₍${fmt(c,2)}₎(${fmt(b,4)})=${fmt(Lc(b),6)}`,`log₍${fmt(b,2)}₎(${fmt(a,4)})=${fmt(res,6)}`],answer:`log₍${fmt(b,2)}₎(${fmt(a,4)})=${fmt(res,4)}`}; }
      },
    ]
  },
  { id:"vectors", name:"Vectors & 3D Geometry", classes:"Class 12 / JEE", icon:"a⃗·b⃗", emoji:"🧭", color:"#F472B6", dim:"#6b0a3e",
    formulas:[
      { id:"mag", name:"Vector Magnitude", formula:"|a⃗|=√(x²+y²+z²)", latex:"|\\vec{a}|=\\sqrt{x^2+y^2+z^2}", desc:"Length of a 3D vector",
        inputs:[{id:"x",label:"x component"},{id:"y",label:"y component"},{id:"z",label:"z component"}],
        compute:({x,y,z})=>{ [x,y,z]=[x,y,z].map(safeEval); const m=Math.sqrt(x*x+y*y+z*z); return {steps:[`Vector:(${fmt(x,4)},${fmt(y,4)},${fmt(z,4)})`,`|a⃗|=√(${fmt(x*x+y*y+z*z,4)})`],answer:`|a⃗|=${fmt(m,6)}`}; }
      },
      { id:"dot", name:"Dot Product", formula:"a⃗·b⃗=axbx+ayby+azbz=|a⃗||b⃗|cosθ", latex:"\\vec{a}\\cdot\\vec{b}=a_xb_x+a_yb_y+a_zb_z=|\\vec{a}||\\vec{b}|\\cos\\theta", desc:"Scalar product and angle between vectors",
        inputs:[{id:"ax",label:"a⃗: x"},{id:"ay",label:"a⃗: y"},{id:"az",label:"a⃗: z"},{id:"bx",label:"b⃗: x"},{id:"by",label:"b⃗: y"},{id:"bz",label:"b⃗: z"}],
        compute:({ax,ay,az,bx,by,bz})=>{ [ax,ay,az,bx,by,bz]=[ax,ay,az,bx,by,bz].map(safeEval); const dot=ax*bx+ay*by+az*bz,mA=Math.sqrt(ax*ax+ay*ay+az*az),mB=Math.sqrt(bx*bx+by*by+bz*bz),cosT=clamp(dot/(mA*mB),-1,1),theta=Math.acos(cosT)*180/Math.PI; return {steps:[`a⃗=(${fmt(ax,4)},${fmt(ay,4)},${fmt(az,4)}), b⃗=(${fmt(bx,4)},${fmt(by,4)},${fmt(bz,4)})`,`a⃗·b⃗=${fmt(ax*bx,4)}+${fmt(ay*by,4)}+${fmt(az*bz,4)}=${fmt(dot,6)}`,`|a⃗|=${fmt(mA,4)}, |b⃗|=${fmt(mB,4)}`,`cosθ=${fmt(cosT,6)}`,`θ=${fmt(theta,4)}°`],answer:`a⃗·b⃗=${fmt(dot,4)}, Angle=${fmt(theta,2)}°`}; }
      },
    ]
  },
  { id:"limits", name:"Limits & Continuity", classes:"Classes 11–12", icon:"lim", emoji:"→", color:"#FCD34D", dim:"#5a4200",
    formulas:[
      { id:"sinlim", name:"lim sin(x)/x=1", formula:"lim(x→0) sin(x)/x=1", latex:"\\lim_{x\\to 0}\\dfrac{\\sin x}{x}=1", desc:"Most important trig limit (x in radians)",
        inputs:[{id:"x",label:"x (small value near 0, radians)"}],
        compute:({x})=>{ x=safeEval(x); if(x===0) return {steps:["Limiting case: value=1 exactly"],answer:"lim=1 (exact)"}; const v=Math.sin(x)/x; return {steps:[`x=${fmt(x,6)} rad`,`sin(x)=${fmt(Math.sin(x),8)}`,`sin(x)/x=${fmt(v,8)}`,`As x→0, sin(x)/x→1`],answer:`sin(x)/x at x=${fmt(x,4)} ≈${fmt(v,6)}`}; }
      },
      { id:"explim", name:"lim (eˣ−1)/x=1", formula:"lim(x→0) (eˣ−1)/x=1", latex:"\\lim_{x\\to 0}\\dfrac{e^x-1}{x}=1", desc:"Fundamental exponential limit",
        inputs:[{id:"x",label:"x (small value near 0)"}],
        compute:({x})=>{ x=safeEval(x); if(x===0) return {steps:["Limiting case: value=1"],answer:"lim=1 (exact)"}; const v=(Math.exp(x)-1)/x; return {steps:[`x=${fmt(x,6)}`,`eˣ=${fmt(Math.exp(x),8)}`,`(eˣ−1)/x=${fmt(v,8)}`,`As x→0→1`],answer:`(e^x−1)/x at x=${fmt(x,4)} ≈${fmt(v,6)}`}; }
      },
      { id:"powlim", name:"lim (xⁿ−aⁿ)/(x−a)", formula:"lim(x→a) (xⁿ−aⁿ)/(x−a)=naⁿ⁻¹", latex:"\\lim_{x\\to a}\\dfrac{x^n-a^n}{x-a}=na^{n-1}", desc:"Algebraic limit — very common in JEE",
        inputs:[{id:"a",label:"a (limit point)"},{id:"n",label:"n (power)"}],
        compute:({a,n})=>{ [a,n]=[safeEval(a),safeEval(n)]; const result=n*a**(n-1); return {steps:[`a=${fmt(a,4)}, n=${fmt(n,4)}`,`=n×a^(n−1)=${fmt(n,4)}×${fmt(a**(n-1),6)}=${fmt(result,8)}`],answer:`Limit=${fmt(result,6)}`}; }
      },
    ]
  },
  { id:"permcomb", name:"Permutations & Combinations", classes:"Classes 11–12", icon:"ⁿPᵣ", emoji:"🔀", color:"#A3E635", dim:"#2a3d00",
    formulas:[
      { id:"factrl", name:"Factorial n!", formula:"n!=n×(n−1)×…×1", latex:"n!=n\\times(n-1)\\times\\cdots\\times 1", desc:"Product of all integers from 1 to n",
        inputs:[{id:"n",label:"n (integer ≤20)"}],
        compute:({n})=>{ n=Math.floor(safeEval(n)); if(n<0||n>20) return {steps:["n must be 0–20"],answer:"Invalid"}; const res=fact(n),exp=n===0?"1":Array.from({length:n},(_,i)=>n-i).join("×"); return {steps:[`${n}!=${exp}`,`${n}!=${res}`],answer:`${n}!=${res}`}; }
      },
      { id:"perm", name:"Permutation ⁿPᵣ", formula:"ⁿPᵣ=n!/(n−r)!", latex:"{}^nP_r=\\dfrac{n!}{(n-r)!}", desc:"Arrangements of r from n (order matters)",
        inputs:[{id:"n",label:"n (total)"},{id:"r",label:"r (chosen)"}],
        compute:({n,r})=>{ [n,r]=[Math.floor(safeEval(n)),Math.floor(safeEval(r))]; if(r>n||r<0||n<0||n>20) return {steps:["Need 0≤r≤n≤20"],answer:"Invalid"}; const res=fact(n)/fact(n-r); return {steps:[`ⁿPᵣ=n!/(n−r)!=${n}!/${n-r}!=${fact(n)}/${fact(n-r)}`],answer:`${n}P${r}=${res}`}; }
      },
      { id:"comb2", name:"Combination ⁿCᵣ", formula:"ⁿCᵣ=n!/(r!(n−r)!)", latex:"{}^nC_r=\\dfrac{n!}{r!(n-r)!}", desc:"Selections of r from n (order does NOT matter)",
        inputs:[{id:"n",label:"n"},{id:"r",label:"r"}],
        compute:({n,r})=>{ [n,r]=[Math.floor(safeEval(n)),Math.floor(safeEval(r))]; if(r>n||r<0||n<0||n>20) return {steps:["Need 0≤r≤n≤20"],answer:"Invalid"}; const res=fact(n)/(fact(r)*fact(n-r)); return {steps:[`${n}C${r}=${n}!/(${r}!×${n-r}!)=${res}`],answer:`${n}C${r}=${res}`}; }
      },
    ]
  },
  { id:"conics", name:"Conic Sections", classes:"Classes 11–12", icon:"y²=4ax", emoji:"🌐", color:"#E879F9", dim:"#4a0a6b",
    formulas:[
      { id:"parab", name:"Parabola y²=4ax", formula:"Focus(a,0), Directrix x=−a", latex:"y^2=4ax,\\quad F(a,0),\\quad x=-a", desc:"Key properties of the standard parabola",
        inputs:[{id:"a",label:"a"}],
        compute:({a})=>{ a=safeEval(a); return {steps:[`Parabola: y²=${fmt(4*a,4)}x`,`Vertex:(0,0)`,`Focus:(${fmt(a,4)},0)`,`Directrix:x=${fmt(-a,4)}`,`Latus Rectum:4a=${fmt(4*a,4)}`],answer:`Focus=(${fmt(a,4)},0), Directrix:x=${fmt(-a,4)}`}; },
        buildGraph:(inp)=>{ const a=safeEval(inp.a); if(!isFinite(a)||a===0) return null; const maxY=Math.max(5,3*Math.abs(a)),ys=lin(-maxY,maxY,400),xs=ys.map(y=>y*y/(4*a)),xExtent=maxY*maxY/(4*Math.abs(a)),xRange=a>0?[-xExtent*0.35,xExtent*1.2]:[-xExtent*1.2,xExtent*0.35]; return {data:[{x:xs,y:ys,type:'scatter',mode:'lines',name:'Parabola',line:{color:'#E879F9',width:2.5}},{x:[a],y:[0],type:'scatter',mode:'markers',name:`Focus(${fmt(a,2)},0)`,marker:{color:'#FFD166',size:14,symbol:'star'}},{x:[-a,-a],y:[-maxY,maxY],type:'scatter',mode:'lines',name:`Directrix x=${fmt(-a,2)}`,line:{color:'#FF6B6B',width:2,dash:'dash'}},{x:[0],y:[0],type:'scatter',mode:'markers',name:'Vertex',marker:{color:'#4ECDC4',size:10}}],layout:{title:`Parabola y²=${fmt(4*a,2)}x`,xaxis:{range:xRange},yaxis:{range:[-maxY,maxY],scaleanchor:'x'}}}; }
      },
      { id:"ellip", name:"Ellipse x²/a²+y²/b²=1", formula:"e=√(1−b²/a²)", latex:"\\dfrac{x^2}{a^2}+\\dfrac{y^2}{b^2}=1,\\quad e=\\sqrt{1-\\dfrac{b^2}{a^2}}", desc:"Eccentricity and foci of ellipse (b<a)",
        inputs:[{id:"a",label:"a (semi-major axis)"},{id:"b",label:"b (semi-minor, b<a)"}],
        compute:({a,b})=>{ [a,b]=[safeEval(a),safeEval(b)]; if(b>=a||a<=0||b<=0) return {steps:["Need a>b>0"],answer:"Invalid"}; const c=Math.sqrt(a*a-b*b),e=c/a; return {steps:[`a=${fmt(a,4)}, b=${fmt(b,4)}`,`c=√(a²−b²)=${fmt(c,6)}`,`e=c/a=${fmt(e,8)}`,`Foci:(±${fmt(c,4)},0)`,`0<e<1 ✓`],answer:`e=${fmt(e,4)}, Foci:(±${fmt(c,4)},0)`}; },
        buildGraph:(inp)=>{ const [a,b]=['a','b'].map(k=>safeEval(inp[k])); if(!isFinite(a)||!isFinite(b)||a<=0||b<=0||b>=a) return null; const t=lin(0,2*Math.PI,400),c=Math.sqrt(a*a-b*b); return {data:[{x:t.map(th=>a*Math.cos(th)),y:t.map(th=>b*Math.sin(th)),type:'scatter',mode:'lines',name:'Ellipse',line:{color:'#E879F9',width:2.5}},{x:[-c,c],y:[0,0],type:'scatter',mode:'markers',name:'Foci',marker:{color:'#FFD166',size:14,symbol:'star'}}],layout:{title:`Ellipse: e=${fmt(c/a,4)}`,xaxis:{range:[-a*1.4,a*1.4]},yaxis:{range:[-a*1.4,a*1.4],scaleanchor:'x'}}}; }
      },
      { id:"hyper", name:"Hyperbola x²/a²−y²/b²=1", formula:"e=√(1+b²/a²)", latex:"\\dfrac{x^2}{a^2}-\\dfrac{y^2}{b^2}=1,\\quad e=\\sqrt{1+\\dfrac{b^2}{a^2}}", desc:"Eccentricity and foci of hyperbola",
        inputs:[{id:"a",label:"a"},{id:"b",label:"b"}],
        compute:({a,b})=>{ [a,b]=[safeEval(a),safeEval(b)]; if(a<=0||b<=0) return {steps:["a,b must be >0"],answer:"Invalid"}; const c=Math.sqrt(a*a+b*b),e=c/a; return {steps:[`a=${fmt(a,4)}, b=${fmt(b,4)}`,`c=√(a²+b²)=${fmt(c,6)}`,`e=c/a=${fmt(e,8)}`,`Foci:(±${fmt(c,4)},0)`,`e>1 ✓`],answer:`e=${fmt(e,4)}, Foci:(±${fmt(c,4)},0)`}; },
        buildGraph:(inp)=>{ const [a,b]=['a','b'].map(k=>safeEval(inp[k])); if(!isFinite(a)||!isFinite(b)||a<=0||b<=0) return null; const c=Math.sqrt(a*a+b*b),t=lin(-2.8,2.8,300),xR=t.map(ti=>a*Math.cosh(ti)),yR=t.map(ti=>b*Math.sinh(ti)),xL=t.map(ti=>-a*Math.cosh(ti)),xA=[-c*1.6,c*1.6]; return {data:[{x:xR,y:yR,type:'scatter',mode:'lines',name:'Branch 1',line:{color:'#E879F9',width:2.5}},{x:xL,y:yR,type:'scatter',mode:'lines',name:'Branch 2',line:{color:'#E879F9',width:2.5}},{x:xA,y:xA.map(x=>(b/a)*x),type:'scatter',mode:'lines',name:'Asymptotes',line:{color:'rgba(255,255,255,0.25)',dash:'dot',width:1.5}},{x:xA,y:xA.map(x=>-(b/a)*x),type:'scatter',mode:'lines',showlegend:false,line:{color:'rgba(255,255,255,0.25)',dash:'dot',width:1.5}},{x:[-c,c],y:[0,0],type:'scatter',mode:'markers',name:'Foci',marker:{color:'#FFD166',size:14,symbol:'star'}}],layout:{title:`Hyperbola: e=${fmt(c/a,4)}`,xaxis:{range:[-c*1.8,c*1.8]},yaxis:{range:[-c*1.1,c*1.1],scaleanchor:'x'}}}; }
      },
    ]
  },
  { id:"matrices", name:"Determinants & Matrices", classes:"Class 12", icon:"[M]", emoji:"🟦", color:"#F87171", dim:"#6b0a0a",
    formulas:[
      { id:"det2", name:"2×2 Determinant", formula:"|A|=ad−bc", latex:"\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}=ad-bc", desc:"Determinant of a 2×2 matrix",
        inputs:[{id:"a",label:"a (row1,col1)"},{id:"b",label:"b (row1,col2)"},{id:"c",label:"c (row2,col1)"},{id:"d",label:"d (row2,col2)"}],
        compute:({a,b,c,d})=>{ [a,b,c,d]=[a,b,c,d].map(safeEval); const det=a*d-b*c; return {steps:[`Matrix: ⎡${fmt(a,4)} ${fmt(b,4)}⎤ ⎣${fmt(c,4)} ${fmt(d,4)}⎦`,`|A|=(${fmt(a,4)})(${fmt(d,4)})−(${fmt(b,4)})(${fmt(c,4)})=${fmt(a*d,4)}−${fmt(b*c,4)}=${fmt(det,6)}`,det!==0?"Det≠0 → Invertible ✓":"Det=0 → Singular (not invertible)"],answer:`|A|=${fmt(det,6)}`}; }
      },
      { id:"triang", name:"Triangle Area (Coordinate)", formula:"Area=½|x₁(y₂−y₃)+x₂(y₃−y₁)+x₃(y₁−y₂)|", latex:"\\text{Area}=\\dfrac{1}{2}|x_1(y_2-y_3)+x_2(y_3-y_1)+x_3(y_1-y_2)|", desc:"Area of triangle using vertex coordinates",
        inputs:[{id:"x1",label:"x₁"},{id:"y1",label:"y₁"},{id:"x2",label:"x₂"},{id:"y2",label:"y₂"},{id:"x3",label:"x₃"},{id:"y3",label:"y₃"}],
        compute:({x1,y1,x2,y2,x3,y3})=>{ [x1,y1,x2,y2,x3,y3]=[x1,y1,x2,y2,x3,y3].map(safeEval); const inner=x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2),area=Math.abs(inner)/2; return {steps:[`Vertices:(${fmt(x1,4)},${fmt(y1,4)}),(${fmt(x2,4)},${fmt(y2,4)}),(${fmt(x3,4)},${fmt(y3,4)})`,`=½|${fmt(inner,6)}|=${fmt(area,6)}`],answer:`Area=${fmt(area,6)} sq. units`}; },
        buildGraph:(inp)=>{ const [x1,y1,x2,y2,x3,y3]=['x1','y1','x2','y2','x3','y3'].map(k=>safeEval(inp[k])); const pad=Math.max(1,Math.abs(x2-x1),Math.abs(x3-x1),Math.abs(y2-y1),Math.abs(y3-y1))*0.25+1; return {data:[{x:[x1,x2,x3,x1],y:[y1,y2,y3,y1],type:'scatter',mode:'lines+markers',fill:'toself',fillcolor:'rgba(248,113,113,0.12)',name:'Triangle',line:{color:'#F87171',width:2.5},marker:{size:10,color:'#FFD166'}}],layout:{title:'Triangle',xaxis:{range:[Math.min(x1,x2,x3)-pad,Math.max(x1,x2,x3)+pad]},yaxis:{range:[Math.min(y1,y2,y3)-pad,Math.max(y1,y2,y3)+pad],scaleanchor:'x'}}}; }
      },
    ]
  },
  { id:"complex", name:"Complex Numbers", classes:"Class 11", icon:"i²=−1", emoji:"🌀", color:"#C084FC", dim:"#3a0a6b",
    formulas:[
      { id:"cmod", name:"Modulus |z|", formula:"|z|=√(a²+b²)", latex:"|z|=\\sqrt{a^2+b^2}", desc:"Distance of z=a+bi from origin",
        inputs:[{id:"a",label:"Real part a"},{id:"b",label:"Imaginary part b"}],
        compute:({a,b})=>{ [a,b]=[safeEval(a),safeEval(b)]; const mod=Math.sqrt(a*a+b*b),arg=Math.atan2(b,a)*180/Math.PI; return {steps:[`z=${fmt(a,4)}+${fmt(b,4)}i`,`|z|=√(${fmt(a*a+b*b,4)})=${fmt(mod,8)}`,`arg(z)=${fmt(arg,4)}°`],answer:`|z|=${fmt(mod,4)}, arg=${fmt(arg,2)}°`}; },
        buildGraph:(inp)=>{ const [a,b]=['a','b'].map(k=>safeEval(inp[k])); const mod=Math.sqrt(a*a+b*b),t=lin(0,2*Math.PI,300),pad=Math.max(mod*1.4,2); return {data:[{x:t.map(th=>mod*Math.cos(th)),y:t.map(th=>mod*Math.sin(th)),type:'scatter',mode:'lines',name:`|z|=${fmt(mod,4)}`,line:{color:'rgba(192,132,252,0.3)',width:1.5,dash:'dot'}},{x:[0,a],y:[0,b],type:'scatter',mode:'lines',name:'z vector',line:{color:'#C084FC',width:3}},{x:[a],y:[b],type:'scatter',mode:'markers',name:`z(${fmt(a,2)},${fmt(b,2)})`,marker:{color:'#FFD166',size:14,symbol:'diamond'}},{x:[0],y:[0],type:'scatter',mode:'markers',name:'Origin',marker:{color:'#94a3b8',size:8}}],layout:{title:`Argand Plane:|z|=${fmt(mod,4)}`,xaxis:{range:[-pad,pad],title:'Real'},yaxis:{range:[-pad,pad],scaleanchor:'x',title:'Imaginary'}}}; }
      },
      { id:"ipow", name:"Powers of i", formula:"i¹=i,i²=−1,i³=−i,i⁴=1", latex:"i^1=i,\\;i^2=-1,\\;i^3=-i,\\;i^4=1", desc:"Imaginary unit cycles with period 4",
        inputs:[{id:"n",label:"Exponent n (any integer)"}],
        compute:({n})=>{ n=Math.floor(safeEval(n)); const vals=["1","i","−1","−i"],rem=((n%4)+4)%4; return {steps:[`Cycle: i⁰=1,i¹=i,i²=−1,i³=−i,...`,`n=${n}`,`${n} mod 4=${rem}`,`i^${n}=i^${rem}=${vals[rem]}`],answer:`i^${n}=${vals[rem]}`}; }
      },
    ]
  },
  { id:"binomial", name:"Binomial Theorem", classes:"Classes 11–12", icon:"Tᵣ₊₁", emoji:"🔭", color:"#2DD4BF", dim:"#033a34",
    formulas:[
      { id:"gterm", name:"General Term Tᵣ₊₁", formula:"Tᵣ₊₁=ⁿCᵣ×aⁿ⁻ʳ×bʳ", latex:"T_{r+1}={}^nC_r\\cdot a^{n-r}\\cdot b^r", desc:"Specific term in (a+b)ⁿ expansion",
        inputs:[{id:"a",label:"a"},{id:"b",label:"b"},{id:"n",label:"n (power, ≤20)"},{id:"r",label:"r (0-indexed)"}],
        compute:({a,b,n,r})=>{ [a,b,n,r]=[safeEval(a),safeEval(b),Math.floor(safeEval(n)),Math.floor(safeEval(r))]; if(r>n||r<0||n>20) return {steps:["Need 0≤r≤n≤20"],answer:"Invalid"}; const nCr=fact(n)/(fact(r)*fact(n-r)),term=nCr*a**(n-r)*b**r; return {steps:[`(${fmt(a,4)}+${fmt(b,4)})^${n}, r=${r}`,`T${r+1}=${n}C${r}×${fmt(a,4)}^${n-r}×${fmt(b,4)}^${r}`,`=${nCr}×${fmt(a**(n-r),6)}×${fmt(b**r,6)}`],answer:`T${r+1}=${fmt(term,6)}`}; }
      },
      { id:"tterms", name:"Total Terms in Expansion", formula:"(a+b)ⁿ has n+1 terms", latex:"(a+b)^n\\text{ has }n+1\\text{ terms}", desc:"Count terms in a binomial expansion",
        inputs:[{id:"n",label:"n (power)"}],
        compute:({n})=>{ n=Math.floor(safeEval(n)); return {steps:[`(a+b)^${n}`,`Total terms=n+1=${n}+1=${n+1}`,`T₁(r=0) through T${n+1}(r=${n})`],answer:`Total terms=${n+1}`}; }
      },
    ]
  },
  { id:"settheory", name:"Set Theory & Relations", classes:"Class 11", icon:"A∪B", emoji:"🔴", color:"#38BDF8", dim:"#0a2e4a",
    formulas:[
      { id:"u2", name:"Union — 2 Sets", formula:"n(A∪B)=n(A)+n(B)−n(A∩B)", latex:"n(A\\cup B)=n(A)+n(B)-n(A\\cap B)", desc:"Count elements in union of 2 sets",
        inputs:[{id:"nA",label:"n(A)"},{id:"nB",label:"n(B)"},{id:"nAB",label:"n(A∩B)"}],
        compute:({nA,nB,nAB})=>{ [nA,nB,nAB]=[nA,nB,nAB].map(safeEval); const res=nA+nB-nAB; return {steps:[`n(A∪B)=${fmt(nA,2)}+${fmt(nB,2)}−${fmt(nAB,2)}=${fmt(res,2)}`],answer:`n(A∪B)=${fmt(res,2)}`}; }
      },
      { id:"u3", name:"Union — 3 Sets", formula:"n(A∪B∪C)=Σn(A)−Σn(A∩B)+n(A∩B∩C)", latex:"n(A\\cup B\\cup C)=\\sum n(X)-\\sum n(X\\cap Y)+n(A\\cap B\\cap C)", desc:"Inclusion-Exclusion for 3 sets",
        inputs:[{id:"nA",label:"n(A)"},{id:"nB",label:"n(B)"},{id:"nC",label:"n(C)"},{id:"nAB",label:"n(A∩B)"},{id:"nBC",label:"n(B∩C)"},{id:"nAC",label:"n(A∩C)"},{id:"nABC",label:"n(A∩B∩C)"}],
        compute:({nA,nB,nC,nAB,nBC,nAC,nABC})=>{ [nA,nB,nC,nAB,nBC,nAC,nABC]=[nA,nB,nC,nAB,nBC,nAC,nABC].map(safeEval); const res=nA+nB+nC-nAB-nBC-nAC+nABC; return {steps:[`=${fmt(nA,2)}+${fmt(nB,2)}+${fmt(nC,2)}−${fmt(nAB,2)}−${fmt(nBC,2)}−${fmt(nAC,2)}+${fmt(nABC,2)}`,`=${fmt(res,2)}`],answer:`n(A∪B∪C)=${fmt(res,2)}`}; }
      },
    ]
  },
  { id:"circthm", name:"Circle Theorems", classes:"Classes 9–10", icon:"○", emoji:"⭕", color:"#67E8F9", dim:"#063344",
    formulas:[
      { id:"eqchord", name:"Equal Chords Theorem", formula:"Equal chords ↔ Equal central angles", latex:"\\text{Equal chords}\\leftrightarrow\\text{Equal central angles}", desc:"Equal chords subtend equal angles at the centre.",
        inputs:[{id:"r",label:"Radius r"},{id:"d",label:"Chord length d (≤2r)"}],
        compute:({r,d})=>{ [r,d]=[safeEval(r),safeEval(d)]; if(d>2*r||r<=0||d<=0) return {steps:["Chord cannot exceed diameter"],answer:"Invalid"}; const halfAngle=Math.asin(d/(2*r)),centralAngle=2*halfAngle*180/Math.PI,distFromCentre=Math.sqrt(r*r-(d/2)**2); return {steps:[`r=${fmt(r,4)}, chord=${fmt(d,4)}`,`Central angle=2×arcsin(d/2r)=${fmt(centralAngle,6)}°`,`Distance from centre=√(r²−(d/2)²)=${fmt(distFromCentre,6)}`],answer:`Central angle=${fmt(centralAngle,2)}°, Distance=${fmt(distFromCentre,4)}`}; },
        buildGraph:(inp)=>{ const [r,d]=['r','d'].map(k=>safeEval(inp[k])); if(!isFinite(r)||!isFinite(d)||d>2*r||r<=0||d<=0) return null; const t=lin(0,2*Math.PI,400),halfA=Math.asin(d/(2*r)),x1c=r*Math.cos(Math.PI/2+halfA),y1c=r*Math.sin(Math.PI/2+halfA),x2c=r*Math.cos(Math.PI/2-halfA),y2c=r*Math.sin(Math.PI/2-halfA),mx=(x1c+x2c)/2,my=(y1c+y2c)/2; return {data:[{x:t.map(th=>r*Math.cos(th)),y:t.map(th=>r*Math.sin(th)),type:'scatter',mode:'lines',name:'Circle',line:{color:'#67E8F9',width:2.5}},{x:[x1c,x2c],y:[y1c,y2c],type:'scatter',mode:'lines+markers',name:`Chord(len=${fmt(d,2)})`,line:{color:'#FFD166',width:2.5},marker:{size:10,color:'#FFD166'}},{x:[0,mx],y:[0,my],type:'scatter',mode:'lines',name:'Perp. bisector',line:{color:'rgba(255,255,255,0.35)',dash:'dot',width:1.5}},{x:[0],y:[0],type:'scatter',mode:'markers',name:'Centre',marker:{color:'#FF6B6B',size:12}}],layout:{title:`Chord in Circle: r=${fmt(r,2)}`,xaxis:{range:[-r*1.4,r*1.4]},yaxis:{range:[-r*1.4,r*1.4],scaleanchor:'x'}}}; }
      },
      { id:"angcentre", name:"Angle at Centre=2×Angle at Circumference", formula:"∠AOB=2×∠ACB (same arc AB)", latex:"\\angle AOB=2\\times\\angle ACB", desc:"Central angle is twice any inscribed angle on the same arc.",
        inputs:[{id:"inscribed",label:"Inscribed angle ∠ACB (degrees)"}],
        compute:({inscribed})=>{ inscribed=safeEval(inscribed); if(inscribed<=0||inscribed>=180) return {steps:["Inscribed angle must be 0°–180°"],answer:"Invalid"}; return {steps:[`Inscribed ∠ACB=${fmt(inscribed,4)}°`,`Central=2×Inscribed`,`∠AOB=2×${fmt(inscribed,4)}°=${fmt(2*inscribed,4)}°`],answer:`Central ∠AOB=${fmt(2*inscribed,4)}°`}; }
      },
      { id:"semicircle", name:"Angle in Semicircle=90°", formula:"If AB is diameter → ∠ACB=90°", latex:"\\text{AB is diameter}\\Rightarrow\\angle ACB=90^\\circ", desc:"Any angle inscribed in a semicircle is a right angle.",
        inputs:[{id:"r",label:"Radius r (for verification)"}],
        compute:({r})=>{ r=safeEval(r); return {steps:[`r=${fmt(r,4)}, Diameter=2r=${fmt(2*r,4)}`,`Central angle subtended by diameter=180°`,`Inscribed angle=180°/2=90°`,`∠ACB=90° always ✓`],answer:`∠ACB=90° always`}; }
      },
      { id:"cyclicquad", name:"Cyclic Quadrilateral", formula:"Opposite angles sum=180°", latex:"\\angle A+\\angle C=180^\\circ,\\;\\angle B+\\angle D=180^\\circ", desc:"In a cyclic quad ABCD, opposite angles are supplementary.",
        inputs:[{id:"angleA",label:"∠A (degrees)"}],
        compute:({angleA})=>{ angleA=safeEval(angleA); if(angleA<=0||angleA>=360) return {steps:["Angle must be 0°–360°"],answer:"Invalid"}; const angleC=180-angleA; return {steps:[`∠A=${fmt(angleA,4)}°`,`∠A+∠C=180°`,`∠C=180°−${fmt(angleA,4)}°=${fmt(angleC,4)}°`],answer:`∠A=${fmt(angleA,4)}°, Opposite ∠C=${fmt(angleC,4)}°`}; }
      },
    ]
  },
  { id:"geom3d", name:"Advanced 3D Geometry", classes:"Class 12", icon:"ax+d", emoji:"🧊", color:"#86EFAC", dim:"#063a14",
    formulas:[
      { id:"planeeq", name:"Equation of a Plane", formula:"ax+by+cz+d=0", latex:"ax+by+cz+d=0", desc:"General plane equation — (a,b,c) is the normal vector",
        inputs:[{id:"a",label:"a (normal x)"},{id:"b",label:"b (normal y)"},{id:"c",label:"c (normal z)"},{id:"d",label:"d (constant)"}],
        compute:({a,b,c,d})=>{ [a,b,c,d]=[a,b,c,d].map(safeEval); const normMag=Math.sqrt(a*a+b*b+c*c),dist=Math.abs(d)/normMag; return {steps:[`Plane:${fmt(a,4)}x+${fmt(b,4)}y+${fmt(c,4)}z+${fmt(d,4)}=0`,`Normal n⃗=(${fmt(a,4)},${fmt(b,4)},${fmt(c,4)})`,`|n⃗|=${fmt(normMag,6)}`,`Unit normal=(${fmt(a/normMag,4)},${fmt(b/normMag,4)},${fmt(c/normMag,4)})`,`Dist from origin=${fmt(dist,6)}`],answer:`Dist from origin=${fmt(dist,4)}`}; }
      },
      { id:"ptplane", name:"Distance: Point to Plane", formula:"d=|ax₁+by₁+cz₁+d|/√(a²+b²+c²)", latex:"d=\\dfrac{|ax_1+by_1+cz_1+d|}{\\sqrt{a^2+b^2+c^2}}", desc:"Perpendicular distance from a point to a plane",
        inputs:[{id:"a",label:"a"},{id:"b",label:"b"},{id:"c",label:"c"},{id:"d",label:"d"},{id:"x1",label:"Point x₁"},{id:"y1",label:"Point y₁"},{id:"z1",label:"Point z₁"}],
        compute:({a,b,c,d,x1,y1,z1})=>{ [a,b,c,d,x1,y1,z1]=[a,b,c,d,x1,y1,z1].map(safeEval); const num=Math.abs(a*x1+b*y1+c*z1+d),den=Math.sqrt(a*a+b*b+c*c),dist=num/den; return {steps:[`Plane:${fmt(a,4)}x+${fmt(b,4)}y+${fmt(c,4)}z+${fmt(d,4)}=0`,`Point P=(${fmt(x1,4)},${fmt(y1,4)},${fmt(z1,4)})`,`Num=|${fmt(a*x1+b*y1+c*z1+d,6)}|=${fmt(num,6)}`,`Den=${fmt(den,6)}`,`Dist=${fmt(dist,6)}`],answer:`Distance=${fmt(dist,4)} units`}; }
      },
    ]
  },
  { id:"dispersion", name:"Statistics – Dispersion", classes:"Class 11", icon:"σ²", emoji:"📊", color:"#FCA5A5", dim:"#5a0a0a",
    formulas:[
      { id:"variance", name:"Variance σ²", formula:"σ²=Σ(xᵢ−x̄)²/n", latex:"\\sigma^2=\\dfrac{\\sum(x_i-\\bar{x})^2}{n}", desc:"Average of squared deviations from the mean",
        inputs:[{id:"vals",label:"Data values (comma-separated)",type:"text"}],
        compute:({vals})=>{ const arr=evalArr(vals); if(arr.length<2) return {steps:["Enter at least 2 values"],answer:"Invalid"}; const n=arr.length,mean=arr.reduce((s,v)=>s+v,0)/n,devSq=arr.map(v=>(v-mean)**2),variance=devSq.reduce((s,v)=>s+v,0)/n,sd=Math.sqrt(variance); return {steps:[`Data:[${arr.join(",")}]`,`n=${n}, Mean x̄=${fmt(mean,6)}`,`Deviations:[${arr.map(v=>fmt(v-mean,4)).join(",")}]`,`Variance σ²=${fmt(variance,6)}, σ=${fmt(sd,6)}`],answer:`σ²=${fmt(variance,4)}, σ=${fmt(sd,4)}`}; }
      },
      { id:"stddev", name:"Standard Deviation σ", formula:"σ=√(Σ(xᵢ−x̄)²/n)", latex:"\\sigma=\\sqrt{\\dfrac{\\sum(x_i-\\bar{x})^2}{n}}", desc:"Measure of spread of data around the mean",
        inputs:[{id:"vals",label:"Data values (comma-separated)",type:"text"}],
        compute:({vals})=>{ const arr=evalArr(vals); if(arr.length<2) return {steps:["Enter at least 2 values"],answer:"Invalid"}; const n=arr.length,mean=arr.reduce((s,v)=>s+v,0)/n,variance=arr.reduce((s,v)=>s+(v-mean)**2,0)/n,sd=Math.sqrt(variance); return {steps:[`Data:[${arr.join(",")}]`,`Mean=${fmt(mean,4)}`,`σ²=${fmt(variance,6)}`,`σ=${fmt(sd,6)}`,`~68% in [${fmt(mean-sd,2)}, ${fmt(mean+sd,2)}]`],answer:`σ=${fmt(sd,4)}`}; }
      },
      { id:"cv", name:"Coefficient of Variation", formula:"CV=(σ/x̄)×100", latex:"CV=\\dfrac{\\sigma}{\\bar{x}}\\times 100", desc:"Relative measure of dispersion",
        inputs:[{id:"vals",label:"Data values (comma-separated)",type:"text"}],
        compute:({vals})=>{ const arr=evalArr(vals); if(arr.length<2) return {steps:["Enter at least 2 values"],answer:"Invalid"}; const n=arr.length,mean=arr.reduce((s,v)=>s+v,0)/n; if(mean===0) return {steps:["Mean is 0 — CV undefined"],answer:"Undefined"}; const variance=arr.reduce((s,v)=>s+(v-mean)**2,0)/n,sd=Math.sqrt(variance),cv=(sd/Math.abs(mean))*100; return {steps:[`Data:[${arr.join(",")}]`,`Mean=${fmt(mean,4)}, σ=${fmt(sd,4)}`,`CV=(${fmt(sd,4)}/${fmt(mean,4)})×100=${fmt(cv,4)}%`,cv<15?"CV<15% → Low variability":cv<30?"CV 15–30% → Moderate":"CV>30% → High variability"],answer:`CV=${fmt(cv,2)}%`}; }
      },
    ]
  },
  { id:"diffeq", name:"Differential Equations", classes:"Class 12", icon:"dy/dx", emoji:"🌊", color:"#FDBA74", dim:"#5a2a00",
    formulas:[
      { id:"ifactor", name:"Integrating Factor Method", formula:"I.F.=e^(∫P dx), y·(I.F.)=∫Q·(I.F.)dx+C", latex:"\\text{I.F.}=e^{\\int P\\,dx},\\quad y\\cdot(\\text{I.F.})=\\int Q\\cdot(\\text{I.F.})\\,dx+C", desc:"Solve the linear ODE dy/dx+Py=Q",
        inputs:[{id:"P_const",label:"P (constant)"},{id:"Q_val",label:"Q (constant)"},{id:"x",label:"x (evaluate I.F. at)"}],
        compute:({P_const,Q_val,x})=>{ [P_const,Q_val,x]=[safeEval(P_const),safeEval(Q_val),safeEval(x)]; const IF=Math.exp(P_const*x); return {steps:[`ODE: dy/dx+(${fmt(P_const,4)})y=${fmt(Q_val,4)}`,`I.F.=e^(${fmt(P_const,4)}x)`,`At x=${fmt(x,4)}: I.F.=${fmt(IF,6)}`,P_const!==0?`General Solution: y=${fmt(Q_val/P_const,4)}+C·e^(−${fmt(P_const,4)}x)`:`General Solution: y=${fmt(Q_val,4)}x+C`],answer:P_const!==0?`y=${fmt(Q_val/P_const,4)}+C·e^(−${fmt(P_const,4)}x), I.F.(${fmt(x,2)})=${fmt(IF,4)}`:`y=${fmt(Q_val,4)}x+C`}; }
      },
      { id:"sepvar", name:"Separation of Variables", formula:"∫g(y)dy=∫f(x)dx+C", latex:"\\int g(y)\\,dy=\\int f(x)\\,dx+C", desc:"Solve dy/dx=f(x)/g(y)",
        inputs:[{id:"fx_n",label:"f(x)=xⁿ — power n"},{id:"gy_n",label:"g(y)=yᵐ — power m"}],
        compute:({fx_n,gy_n})=>{ [fx_n,gy_n]=[safeEval(fx_n),safeEval(gy_n)]; const xNew=fx_n+1,yNew=gy_n+1,showX=Math.abs(fx_n+1)<1e-10?"ln|x|":`x^${fmt(xNew,4)}/${fmt(xNew,4)}`,showY=Math.abs(gy_n+1)<1e-10?"ln|y|":`y^${fmt(yNew,4)}/${fmt(yNew,4)}`; return {steps:[`Equation: dy/dx=x^${fmt(fx_n,4)}/y^${fmt(gy_n,4)}`,`Separate: y^${fmt(gy_n,4)}dy=x^${fmt(fx_n,4)}dx`,`Integrate: ${showY}=${showX}+C`],answer:`${showY}=${showX}+C`}; }
      },
    ]
  },
  { id:"expderiv", name:"Exponential & Special Derivatives", classes:"Classes 11–12", icon:"aˣ", emoji:"🚀", color:"#A5F3FC", dim:"#063344",
    formulas:[
      { id:"axderiv", name:"d/dx(aˣ)=aˣ ln(a)", formula:"d/dx(aˣ)=aˣ·ln(a)", latex:"\\dfrac{d}{dx}(a^x)=a^x\\cdot\\ln(a)", desc:"Derivative of exponential with arbitrary base",
        inputs:[{id:"a",label:"Base a (>0, ≠1)"},{id:"x",label:"x (evaluate at)"}],
        compute:({a,x})=>{ [a,x]=[safeEval(a),safeEval(x)]; if(a<=0||a===1) return {steps:["Base must be >0 and ≠1"],answer:"Invalid"}; const lna=Math.log(a),val=a**x*lna; return {steps:[`f(x)=${fmt(a,4)}^x`,`f'(x)=a^x×ln(a)`,`ln(${fmt(a,4)})=${fmt(lna,8)}`,`At x=${fmt(x,4)}: ${fmt(a**x,6)}×${fmt(lna,6)}=${fmt(val,8)}`],answer:`d/dx(${fmt(a,4)}^x) at x=${fmt(x,4)}=${fmt(val,4)}`}; }
      },
      { id:"lnderiv", name:"d/dx(ln x)=1/x", formula:"d/dx(logₑ x)=1/x (x>0)", latex:"\\dfrac{d}{dx}(\\ln x)=\\dfrac{1}{x}\\quad(x>0)", desc:"Derivative of the natural logarithm",
        inputs:[{id:"x",label:"x (>0)"}],
        compute:({x})=>{ x=safeEval(x); if(x<=0) return {steps:["x must be >0"],answer:"Invalid"}; return {steps:[`f(x)=ln(x)`,`f'(x)=1/x`,`At x=${fmt(x,4)}: 1/${fmt(x,4)}=${fmt(1/x,8)}`,`Note: ln(${fmt(x,4)})=${fmt(Math.log(x),6)}`],answer:`d/dx(ln x) at x=${fmt(x,4)}=${fmt(1/x,4)}`}; }
      },
      { id:"absderiv", name:"d/dx(|x|)=x/|x|", formula:"d/dx(|x|)=x/|x| (x≠0)", latex:"\\dfrac{d}{dx}|x|=\\dfrac{x}{|x|}\\quad(x\\ne 0)", desc:"Derivative of the absolute value function",
        inputs:[{id:"x",label:"x (≠0)"}],
        compute:({x})=>{ x=safeEval(x); if(x===0) return {steps:["Not defined at x=0 (sharp corner)"],answer:"Undefined at x=0"}; const deriv=x/Math.abs(x); return {steps:[`f(x)=|x|`,`f'(x)=x/|x|`,`At x=${fmt(x,4)}: |x|=${fmt(Math.abs(x),4)}`,`f'=${fmt(deriv,4)}`,x>0?"x>0: d/dx(|x|)=+1":"x<0: d/dx(|x|)=−1"],answer:`d/dx(|x|) at x=${fmt(x,4)}=${fmt(deriv,4)}`}; }
      },
    ]
  },
  { id:"commercial", name:"Commercial Math Basics", classes:"Classes 9–10", icon:"₹%", emoji:"💰", color:"#FDE68A", dim:"#5a4200",
    formulas:[
      { id:"si", name:"Simple Interest", formula:"I=P×R×T/100", latex:"I=\\dfrac{P\\times R\\times T}{100}", desc:"Interest only on the principal",
        inputs:[{id:"P",label:"P (Principal)"},{id:"R",label:"R (Rate % per annum)"},{id:"T",label:"T (Time in years)"}],
        compute:({P,R,T})=>{ [P,R,T]=[safeEval(P),safeEval(R),safeEval(T)]; if(P<=0||R<0||T<0) return {steps:["P>0; R,T≥0"],answer:"Invalid"}; const I=P*R*T/100,A=P+I; return {steps:[`P=${fmt(P,4)}, R=${fmt(R,4)}%, T=${fmt(T,4)} years`,`I=P×R×T/100=${fmt(P*R*T,4)}/100=${fmt(I,4)}`,`Amount A=P+I=${fmt(A,4)}`],answer:`Interest=${fmt(I,4)}, Amount=${fmt(A,4)}`}; }
      },
      { id:"ci", name:"Compound Interest", formula:"A=P(1+r/100)ⁿ", latex:"A=P\\left(1+\\dfrac{r}{100}\\right)^n", desc:"Interest on interest included",
        inputs:[{id:"P",label:"P (Principal)"},{id:"r",label:"r (Rate % per annum)"},{id:"n",label:"n (Number of years)"}],
        compute:({P,r,n})=>{ [P,r,n]=[safeEval(P),safeEval(r),safeEval(n)]; if(P<=0||r<0||n<0) return {steps:["Invalid"],answer:"Invalid"}; const A=P*(1+r/100)**n,CI=A-P,SI=P*r*n/100; return {steps:[`P=${fmt(P,4)}, r=${fmt(r,4)}%, n=${fmt(n,4)} years`,`A=${fmt(P,4)}×(1+${fmt(r,4)}/100)^${fmt(n,4)}=${fmt(A,4)}`,`CI=A−P=${fmt(CI,4)}`,`SI(same)=${fmt(SI,4)}, Extra=${fmt(CI-SI,4)}`],answer:`Amount=${fmt(A,2)}, CI=${fmt(CI,2)}`}; }
      },
      { id:"midpt", name:"Midpoint Formula", formula:"M=((x₁+x₂)/2,(y₁+y₂)/2)", latex:"M=\\left(\\dfrac{x_1+x_2}{2},\\dfrac{y_1+y_2}{2}\\right)", desc:"Midpoint of a line segment",
        inputs:[{id:"x1",label:"x₁"},{id:"y1",label:"y₁"},{id:"x2",label:"x₂"},{id:"y2",label:"y₂"}],
        compute:({x1,y1,x2,y2})=>{ [x1,y1,x2,y2]=[x1,y1,x2,y2].map(safeEval); const mx=(x1+x2)/2,my=(y1+y2)/2; return {steps:[`A(${fmt(x1,4)},${fmt(y1,4)}) and B(${fmt(x2,4)},${fmt(y2,4)})`,`Mx=(${fmt(x1,4)}+${fmt(x2,4)})/2=${fmt(mx,4)}`,`My=(${fmt(y1,4)}+${fmt(y2,4)})/2=${fmt(my,4)}`],answer:`Midpoint M=(${fmt(mx,4)},${fmt(my,4)})`}; }
      },
    ]
  },
  { id:"triglims", name:"Trigonometric Limits", classes:"Class 11", icon:"tan x/x", emoji:"📉", color:"#D8B4FE", dim:"#3a0a6b",
    formulas:[
      { id:"tanlim", name:"lim(x→0) tan(x)/x=1", formula:"lim(x→0) tan(x)/x=1", latex:"\\lim_{x\\to 0}\\dfrac{\\tan x}{x}=1", desc:"Analogous to sin(x)/x limit",
        inputs:[{id:"x",label:"x (small value near 0, radians)"}],
        compute:({x})=>{ x=safeEval(x); if(x===0) return {steps:["Limiting case: value=1 exactly"],answer:"lim=1 (exact)"}; const val=Math.tan(x)/x; return {steps:[`x=${fmt(x,6)} rad`,`tan(x)=${fmt(Math.tan(x),8)}`,`tan(x)/x=${fmt(val,8)}`,`As x→0→1`],answer:`tan(x)/x at x=${fmt(x,4)} ≈${fmt(val,6)}`}; }
      },
      { id:"coslim0", name:"lim(x→0) cos(x)=1", formula:"lim(x→0) cos(x)=1", latex:"\\lim_{x\\to 0}\\cos(x)=1", desc:"Cosine is continuous at x=0",
        inputs:[{id:"x",label:"x (small value near 0, radians)"}],
        compute:({x})=>{ x=safeEval(x); if(x===0) return {steps:["cos(0)=1 exactly"],answer:"cos(0)=1"}; const val=Math.cos(x); return {steps:[`x=${fmt(x,6)} rad`,`cos(x)=${fmt(val,8)}`,`As x→0, cos(x)→1 ✓`],answer:`cos(${fmt(x,4)})=${fmt(val,6)} →1 as x→0`}; }
      },
      { id:"onemincos", name:"lim(x→0) (1−cos x)/x=0", formula:"lim(x→0) (1−cos x)/x=0", latex:"\\lim_{x\\to 0}\\dfrac{1-\\cos x}{x}=0", desc:"Important limit that appears in proofs",
        inputs:[{id:"x",label:"x (small value near 0, radians)"}],
        compute:({x})=>{ x=safeEval(x); if(x===0) return {steps:["Result=0 exactly"],answer:"lim=0 (exact)"}; const val=(1-Math.cos(x))/x; return {steps:[`x=${fmt(x,6)} rad`,`1−cos(x)=${fmt(1-Math.cos(x),8)}`,`(1−cosx)/x=${fmt(val,8)}`,`As x→0→0`,`Proof: (1−cosx)/x=2sin²(x/2)/x→x/2→0 ✓`],answer:`(1−cosx)/x at x=${fmt(x,4)} ≈${fmt(val,6)}`}; }
      },
    ]
  },
];
// ─── Search Hook ──────────────────────────────────────────────
function useSearch(query) {
  return useMemo(() => {
    if (!query.trim()) return TOPICS;
    const q = query.toLowerCase();
    return TOPICS.map(t => {
      const tMatch = t.name.toLowerCase().includes(q) || t.classes.toLowerCase().includes(q);
      const matchedFormulas = t.formulas.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        (f.desc||'').toLowerCase().includes(q)
      );
      if (tMatch) return t;
      if (matchedFormulas.length) return { ...t, formulas: matchedFormulas, _filtered: true };
      return null;
    }).filter(Boolean);
  }, [query]);
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('topic') ? 'topic' : 'home';
  });
  const [topic, setTopic] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const tid = p.get('topic');
    return tid ? TOPICS.find(t => t.id === tid) || null : null;
  });
  const [calcFormula, setCalcFormula] = useState(null);
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [graphData, setGraphData] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    _initKatex();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=JetBrains+Mono:wght@400;600&family=Inter:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
    const s = document.createElement('style');
    s.textContent = `
      *{box-sizing:border-box;margin:0;padding:0;}
      ::-webkit-scrollbar{width:6px;}
      ::-webkit-scrollbar-track{background:#0a0a1a;}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:3px;}
      @keyframes fadeSlideUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
      @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      @keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
      .card-hover{transition:transform 0.2s ease,box-shadow 0.2s ease,border-color 0.2s ease;}
      .card-hover:hover{transform:translateY(-2px);}
      .btn-hover{transition:all 0.15s ease;}
      .btn-hover:active{transform:scale(0.97);}
      .search-input::placeholder{color:rgba(255,255,255,0.25);}
      .search-input:focus{outline:none;}
      .katex{color:inherit!important;}
      .katex-display{margin:0!important;}
      input[type=text]{caret-color:#FF6B6B;}
    `;
    document.head.appendChild(s);
  }, []);

  const updateURL = (tid) => {
    const url = new URL(window.location.href);
    if (tid) url.searchParams.set('topic', tid);
    else url.searchParams.delete('topic');
    window.history.pushState({}, '', url.toString());
  };

  const nav = (newPage, t = null) => {
    setTransitioning(true);
    setTimeout(() => {
      setPage(newPage); if (t) setTopic(t);
      setCalcFormula(null); setResult(null);
      setTransitioning(false); updateURL(t?.id || null);
      if (newPage === 'home') setSearchQuery('');
    }, 180);
  };

  const openCalc = (f) => {
    setCalcFormula(f); setInputs({}); setResult(null); setGraphData(null);
    setTimeout(() => modalRef.current?.scrollTo(0, 0), 50);
  };
  const closeCalc = () => { setCalcFormula(null); setResult(null); setGraphData(null); };

  const compute = () => {
    try {
      const r = calcFormula.compute(inputs);
      setResult(r);
      if (calcFormula.buildGraph) {
        try { setGraphData(calcFormula.buildGraph(inputs)); }
        catch { setGraphData(null); }
      } else { setGraphData(null); }
      setTimeout(() => document.getElementById('calc-result')?.scrollIntoView({behavior:'smooth',block:'nearest'}), 100);
    } catch (e) {
      setResult({ steps: ['Error: ' + e.message], answer: 'Calculation Error' });
    }
  };

  const accent = topic?.color || '#FF6B6B';

  return (
    <div style={{minHeight:'100vh',background:'#080818',color:'#e2e8f0',fontFamily:"'Inter',sans-serif",overflowX:'hidden'}}>
      {/* Header */}
      <div style={{position:'sticky',top:0,zIndex:40,background:'rgba(8,8,24,0.94)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 20px',height:60,display:'flex',alignItems:'center',gap:12}}>
        {page === 'topic' && (
          <button onClick={() => nav('home')} className="btn-hover" style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'#e2e8f0',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:13,flexShrink:0}}>
            ← Back
          </button>
        )}
        <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,color:'#fff',letterSpacing:'-0.3px',flexShrink:0}}>
          {page === 'home'
            ? <span>Math<span style={{color:'#FF6B6B'}}>Forge</span></span>
            : <span style={{color:accent}}>{topic?.emoji} {topic?.name}</span>}
        </div>
        {page === 'home' && (
          <div style={{flex:1,display:'flex',alignItems:'center',background:'rgba(255,255,255,0.05)',border:`1px solid ${searchQuery?'rgba(255,107,107,0.5)':'rgba(255,255,255,0.1)'}`,borderRadius:10,padding:'0 12px',gap:8,transition:'border-color 0.2s',maxWidth:360}}>
            <span style={{color:'rgba(255,255,255,0.3)',fontSize:14}}>🔍</span>
            <input
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search formulas, topics…"
              style={{flex:1,background:'none',border:'none',color:'#fff',fontSize:13,fontFamily:"'Inter',sans-serif",height:36}}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:16,lineHeight:1}}>✕</button>
            )}
          </div>
        )}
        <div style={{marginLeft:'auto',fontSize:11,color:'rgba(255,255,255,0.3)',letterSpacing:'0.5px',textTransform:'uppercase',flexShrink:0}}>
          {page === 'home' ? `${TOPICS.length} topics` : <span style={{color:`${accent}99`,background:`${accent}15`,border:`1px solid ${accent}33`,padding:'3px 10px',borderRadius:20}}>{topic?.classes}</span>}
        </div>
      </div>

      {/* Page Content */}
      <div style={{animation:transitioning?'none':'fadeSlideUp 0.35s ease',opacity:transitioning?0:1,transition:'opacity 0.18s'}}>
        {page === 'home'
          ? <Home topics={TOPICS} onSelect={t => nav('topic', t)} searchQuery={searchQuery} />
          : <TopicPage topic={topic} onCalc={openCalc} />}
      </div>

      {/* Calculator Modal */}
      {calcFormula && (
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',flexDirection:'column',justifyContent:'flex-end',background:'rgba(0,0,0,0.75)',animation:'fadeIn 0.2s ease'}}
          onClick={e => e.target === e.currentTarget && closeCalc()}>
          <div ref={modalRef} style={{background:'#0f0f24',borderTop:`2px solid ${accent}`,borderRadius:'20px 20px 0 0',padding:'0 0 40px',maxHeight:'90vh',overflowY:'auto',animation:'slideUp 0.28s cubic-bezier(0.34,1.26,0.64,1)'}}>
            {/* Modal Header */}
            <div style={{position:'sticky',top:0,background:'#0f0f24',zIndex:2,padding:'18px 24px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:'#fff',marginBottom:8}}>
                    {calcFormula.name}
                  </div>
                  {calcFormula.latex ? (
                    <div style={{padding:'8px 12px',background:`${accent}10`,border:`1px solid ${accent}22`,borderRadius:8,display:'inline-block'}}>
                      <KTex latex={calcFormula.latex} block={false} style={{color:accent,fontSize:15}} />
                    </div>
                  ) : (
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:accent}}>{calcFormula.formula}</div>
                  )}
                  {calcFormula.desc && <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:8}}>{calcFormula.desc}</div>}
                </div>
                <button onClick={closeCalc} className="btn-hover" style={{background:'rgba(255,255,255,0.08)',border:'none',color:'#94a3b8',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:18,lineHeight:1,marginLeft:12}}>✕</button>
              </div>
            </div>

            {/* Inputs */}
            <div style={{padding:'20px 24px 0'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:12}}>
                Supports expressions:&nbsp;
                <span style={{color:'rgba(255,255,255,0.55)',fontFamily:'JetBrains Mono,monospace'}}>2*pi</span>
                ,&nbsp;<span style={{color:'rgba(255,255,255,0.55)',fontFamily:'JetBrains Mono,monospace'}}>sqrt(2)</span>
                ,&nbsp;<span style={{color:'rgba(255,255,255,0.55)',fontFamily:'JetBrains Mono,monospace'}}>3/4</span>
                ,&nbsp;<span style={{color:'rgba(255,255,255,0.55)',fontFamily:'JetBrains Mono,monospace'}}>pi/3</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
                {calcFormula.inputs.map(inp => (
                  <div key={inp.id}>
                    <label style={{fontSize:11,color:'rgba(255,255,255,0.5)',display:'block',marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>
                      {inp.label}
                    </label>
                    <input
                      type="text"
                      value={inputs[inp.id] ?? ''}
                      onChange={e => { setInputs({...inputs,[inp.id]:e.target.value}); setResult(null); setGraphData(null); }}
                      onKeyDown={e => e.key === 'Enter' && compute()}
                      placeholder={inp.type === 'text' ? 'e.g. 1,2,3,4' : '0'}
                      style={{width:'100%',background:'rgba(255,255,255,0.05)',border:`1px solid ${inputs[inp.id]?accent+'66':'rgba(255,255,255,0.12)'}`,borderRadius:10,padding:'10px 12px',color:'#fff',fontSize:14,fontFamily:"'JetBrains Mono',monospace",outline:'none',transition:'border-color 0.2s'}}
                    />
                  </div>
                ))}
              </div>
              <button onClick={compute} className="btn-hover" style={{marginTop:20,width:'100%',padding:'14px 20px',background:`linear-gradient(135deg,${accent},${accent}bb)`,border:'none',borderRadius:12,color:'#000',fontWeight:700,fontSize:15,cursor:'pointer',letterSpacing:'0.3px',boxShadow:`0 4px 20px ${accent}44`}}>
                ⚡ Calculate
              </button>
            </div>

            {/* Result */}
            {result && (
              <div id="calc-result" style={{margin:'20px 24px 0',animation:'fadeSlideUp 0.3s ease'}}>
                <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,overflow:'hidden'}}>
                  <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'1.2px'}}>
                    Step-by-Step Solution
                  </div>
                  <div style={{padding:'14px 16px'}}>
                    {result.steps.map((step, i) => (
                      <div key={i} style={{display:'flex',gap:10,marginBottom:i<result.steps.length-1?10:0,animation:`fadeSlideUp 0.3s ease ${i*0.06}s both`}}>
                        <span style={{color:`${accent}88`,fontSize:11,minWidth:18,paddingTop:2,fontFamily:"'JetBrains Mono'"}}>{i+1}.</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:'#cbd5e1',lineHeight:1.65}}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Answer box */}
                <div style={{marginTop:12,padding:'16px 20px',background:`linear-gradient(135deg,${accent}18,${accent}08)`,border:`1px solid ${accent}44`,borderRadius:14,textAlign:'center'}}>
                  <div style={{fontSize:10,color:`${accent}99`,textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:8}}>Answer</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,color:accent,fontWeight:600,letterSpacing:'-0.5px'}}>{result.answer}</div>
                </div>
                {/* Graph */}
                {graphData && (
                  <div style={{marginTop:14,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,overflow:'hidden'}}>
                    <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'1.2px'}}>
                      📊 Interactive Graph
                    </div>
                    <div style={{padding:'8px'}}>
                      <Graph data={graphData.data} layout={graphData.layout} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────
function Home({ topics, onSelect, searchQuery }) {
  const filtered = useSearch(searchQuery);
  return (
    <div style={{padding:'28px 16px 40px',maxWidth:700,margin:'0 auto'}}>
      {!searchQuery && (
        <div style={{marginBottom:32,textAlign:'center'}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:36,color:'#fff',lineHeight:1.15,marginBottom:10}}>
            Every Formula.<br/><span style={{color:'#FF6B6B',fontStyle:'italic'}}>Solved Instantly.</span>
          </div>
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:14,lineHeight:1.6}}>
            Classes 9–12 · JEE · Natural expressions · LaTeX rendering · Interactive graphs
          </div>
        </div>
      )}
      {searchQuery && (
        <div style={{marginBottom:20,fontSize:13,color:'rgba(255,255,255,0.45)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <span>Results for</span>
          <span style={{color:'#FF6B6B',fontFamily:'JetBrains Mono,monospace',fontSize:12}}>"{searchQuery}"</span>
          <span>— {filtered.reduce((acc,t)=>acc+t.formulas.length,0)} formula{filtered.reduce((acc,t)=>acc+t.formulas.length,0)!==1?'s':''}</span>
        </div>
      )}
      {filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,0.3)'}}>
          <div style={{fontSize:36,marginBottom:12}}>🔍</div>
          <div style={{fontSize:15}}>No formulas found for "{searchQuery}"</div>
          <div style={{fontSize:12,marginTop:6}}>Try "quadratic", "derivative", "circle", "probability"…</div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14}}>
          {filtered.map((t, i) => <TopicCard key={t.id} topic={t} onSelect={onSelect} delay={i*0.04} searchQuery={searchQuery} />)}
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic, onSelect, delay, searchQuery }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      className="card-hover"
      onClick={() => onSelect(topic)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{background:hov?`${topic.color}12`:'rgba(255,255,255,0.03)',border:`1px solid ${hov?topic.color+'55':'rgba(255,255,255,0.08)'}`,borderRadius:16,padding:'20px 18px',cursor:'pointer',textAlign:'left',animation:`fadeSlideUp 0.4s ease ${delay}s both`,boxShadow:hov?`0 4px 24px ${topic.color}22`:'none'}}
    >
      <div style={{marginBottom:14,width:52,height:52,borderRadius:14,background:`${topic.color}18`,border:`1px solid ${topic.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:topic.color,fontSize:13,letterSpacing:'-1px'}}>
        {topic.icon}
      </div>
      <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:'#fff',marginBottom:4,lineHeight:1.3}}>{topic.name}</div>
      <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:10}}>{topic.classes}</div>
      {searchQuery && topic._filtered && (
        <div style={{fontSize:10,color:topic.color,marginBottom:6,fontFamily:'JetBrains Mono,monospace'}}>
          {topic.formulas.length} match{topic.formulas.length!==1?'es':''} found
        </div>
      )}
      <div style={{fontSize:11,color:topic.color}}>{topic.formulas.length} formula{topic.formulas.length!==1?'s':''} →</div>
    </button>
  );
}

// ─── Topic Page ───────────────────────────────────────────────
function TopicPage({ topic, onCalc }) {
  return (
    <div style={{padding:'24px 16px 60px',maxWidth:700,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:44,marginBottom:10}}>{topic.emoji}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:30,color:'#fff',marginBottom:6}}>{topic.name}</div>
        <div style={{color:'rgba(255,255,255,0.4)',fontSize:13}}>{topic.classes}</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {topic.formulas.map((f, i) => <FormulaCard key={f.id} formula={f} color={topic.color} delay={i*0.05} onCalc={onCalc} />)}
      </div>
    </div>
  );
}

function FormulaCard({ formula, color, delay, onCalc }) {
  const [hov, setHov] = useState(false);
  const [tryHov, setTryHov] = useState(false);
  return (
    <div
      className="card-hover"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setTryHov(false); }}
      style={{background:hov?`${color}0a`:'rgba(255,255,255,0.025)',border:`1px solid ${hov?color+'44':'rgba(255,255,255,0.08)'}`,borderRadius:16,padding:'20px',animation:`fadeSlideUp 0.35s ease ${delay}s both`,transition:'background 0.2s,border-color 0.2s,box-shadow 0.2s',boxShadow:hov?`0 2px 16px ${color}18`:'none'}}
    >
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:15,color:'#fff',marginBottom:8}}>{formula.name}</div>
          {formula.latex ? (
            <div style={{background:`${color}10`,border:`1px solid ${color}22`,borderRadius:8,padding:'10px 14px',marginBottom:formula.desc?10:0,overflowX:'auto'}}>
              <KTex latex={formula.latex} block={false} style={{color}} />
            </div>
          ) : (
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,color,background:`${color}10`,border:`1px solid ${color}22`,borderRadius:8,padding:'8px 12px',marginBottom:formula.desc?10:0,wordBreak:'break-all',lineHeight:1.7}}>
              {formula.formula}
            </div>
          )}
          {formula.desc && <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',lineHeight:1.5}}>{formula.desc}</div>}
          {formula.buildGraph && (
            <div style={{fontSize:10,color:`${color}88`,marginTop:6,display:'flex',alignItems:'center',gap:4}}>
              <span>📊</span><span>Includes interactive graph</span>
            </div>
          )}
        </div>
        <button
          className="btn-hover"
          onClick={() => onCalc(formula)}
          onMouseEnter={() => setTryHov(true)}
          onMouseLeave={() => setTryHov(false)}
          style={{background:tryHov?color:`${color}22`,border:`1px solid ${color}55`,borderRadius:10,color:tryHov?'#000':color,fontWeight:700,fontSize:12,padding:'8px 14px',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,transition:'all 0.15s ease',letterSpacing:'0.3px'}}
        >
          Try It →
        </button>
      </div>
    </div>
  );
}

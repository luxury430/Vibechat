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
const ACCENT = '#F59E0B';

function fact(n){if(n<=1)return 1;let r=1;for(let i=2;i<=n;i++)r*=i;return r;}
function C(n,r){if(r<0||r>n)return 0;return Math.round(fact(n)/(fact(r)*fact(n-r)));}
function shuffle(arr,seed){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(sr(seed*i+i)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function mean(arr){return arr.reduce((a,b)=>a+b,0)/arr.length;}
function variance(arr){const m=mean(arr);return arr.reduce((a,b)=>a+(b-m)**2,0)/arr.length;}
function sd(arr){return Math.sqrt(variance(arr));}
function genData(seed,n,lo,hi){return Array.from({length:n},(_,i)=>srI(seed+i*37,lo,hi));}

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

// ── Bar Chart SVG ──────────────────────────────────────────────
function BarChartSVG({ data=[], color=ACCENT, size=300, title='' }) {
  const W=size, H=size*0.55, padL=32, padB=28, padT=14, padR=8;
  const gW=W-padL-padR, gH=H-padB-padT;
  const maxV=Math.max(...data.map(d=>d.v),0.001);
  return (
    <svg width={W} height={H+20} style={{display:'block',margin:'0 auto'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      <line x1={padL} y1={padT} x2={padL} y2={H-padB} stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
      {data.map((d,i)=>{
        const bW=gW/data.length*0.72, bX=padL+gW*i/data.length+gW/data.length*0.14;
        const bH=gH*(d.v/maxV), bY=padT+gH-bH;
        return(<g key={i}>
          <rect x={bX} y={bY} width={bW} height={bH} rx={3} fill={`${color}60`} stroke={color} strokeWidth={1}/>
          <text x={bX+bW/2} y={H-padB+12} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9} fontFamily="JetBrains Mono,monospace">{d.l}</text>
          <text x={bX+bW/2} y={bY-3} textAnchor="middle" fill={color} fontSize={9} fontFamily="JetBrains Mono,monospace">{fmt(d.v,1)}</text>
        </g>);
      })}
      {title&&<text x={W/2} y={H+16} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={10} fontFamily="Crimson Pro,serif" fontStyle="italic">{title}</text>}
    </svg>
  );
}

// ── Normal Curve SVG ──────────────────────────────────────────
function NormalCurveSVG({ mu=0, sigma=1, color=ACCENT, size=300, shade=null }) {
  const W=size, H=size*0.5, padL=20, padR=20, padT=12, padB=24;
  const gW=W-padL-padR, gH=H-padT-padB;
  const xMin=mu-4*sigma, xMax=mu+4*sigma;
  const toSX=x=>padL+((x-xMin)/(xMax-xMin))*gW;
  const normal=x=>Math.exp(-0.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
  const yMax=normal(mu)*1.1;
  const toSY=y=>padT+gH-y/yMax*gH;
  const pts=Array.from({length:200},(_,i)=>{const x=xMin+i*(xMax-xMin)/199;return `${toSX(x).toFixed(1)},${toSY(normal(x)).toFixed(1)}`;});
  const x0=toSX(0), y0=toSY(0), baseline=padT+gH;
  return (
    <svg width={W} height={H+10} style={{display:'block',margin:'0 auto'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      <line x1={padL} y1={baseline} x2={W-padR} y2={baseline} stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
      <line x1={toSX(mu)} y1={padT} x2={toSX(mu)} y2={baseline} stroke={`${color}55`} strokeWidth={1} strokeDasharray="4,3"/>
      {[-2,-1,1,2].map(k=><line key={k} x1={toSX(mu+k*sigma)} y1={padT} x2={toSX(mu+k*sigma)} y2={baseline} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="3,4"/>)}
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round"/>
      <text x={toSX(mu)} y={baseline+12} textAnchor="middle" fill={`${color}99`} fontSize={9} fontFamily="JetBrains Mono,monospace">μ</text>
      {[-1,1].map(k=><text key={k} x={toSX(mu+k*sigma)} y={baseline+12} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9} fontFamily="JetBrains Mono,monospace">{k>0?'+':''}{k}σ</text>)}
    </svg>
  );
}

// ── Box Plot SVG ───────────────────────────────────────────────
function BoxPlotSVG({ data=[], color=ACCENT, size=300 }) {
  if(!data.length) return null;
  const sorted=[...data].sort((a,b)=>a-b);
  const n=sorted.length, q1=sorted[Math.floor(n*0.25)], median=sorted[Math.floor(n*0.5)], q3=sorted[Math.floor(n*0.75)];
  const iqr=q3-q1, lo=Math.max(sorted[0],q1-1.5*iqr), hi=Math.min(sorted[n-1],q3+1.5*iqr);
  const mn=sorted[0], mx=sorted[n-1];
  const W=size, H=80, pad=24;
  const sc=x=>pad+((x-mn)/(mx-mn||1))*(W-2*pad);
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto'}}>
      <line x1={sc(lo)} y1={H/2} x2={sc(q1)} y2={H/2} stroke={`${color}77`} strokeWidth={1.5}/>
      <line x1={sc(q3)} y1={H/2} x2={sc(hi)} y2={H/2} stroke={`${color}77`} strokeWidth={1.5}/>
      <rect x={sc(q1)} y={H*0.25} width={sc(q3)-sc(q1)} height={H*0.5} fill={`${color}20`} stroke={color} strokeWidth={2}/>
      <line x1={sc(median)} y1={H*0.25} x2={sc(median)} y2={H*0.75} stroke={color} strokeWidth={2.5}/>
      {[lo,hi].map((v,i)=><line key={i} x1={sc(v)} y1={H*0.3} x2={sc(v)} y2={H*0.7} stroke={`${color}88`} strokeWidth={1.5}/>)}
      {[mn,q1,median,q3,mx].map((v,i)=><text key={i} x={sc(v)} y={H*0.9+8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily="JetBrains Mono,monospace">{v}</text>)}
      <text x={sc(median)} y={H*0.18} textAnchor="middle" fill={color} fontSize={9} fontFamily="JetBrains Mono,monospace">Med</text>
    </svg>
  );
}

// ── Scatter Plot SVG ──────────────────────────────────────────
function ScatterSVG({ pts=[], color=ACCENT, size=260, regLine=null }) {
  const W=size, H=size*0.75, pad=28;
  if(!pts.length) return null;
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const xMin=Math.min(...xs), xMax=Math.max(...xs), yMin=Math.min(...ys), yMax=Math.max(...ys);
  const sx=x=>pad+((x-xMin)/(xMax-xMin||1))*(W-2*pad);
  const sy=y=>H-pad-((y-yMin)/(yMax-yMin||1))*(H-2*pad);
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto'}}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      <line x1={pad} y1={H-pad} x2={W-pad} y2={H-pad} stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
      <line x1={pad} y1={pad} x2={pad} y2={H-pad} stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
      {regLine&&<line x1={sx(xMin)} y1={sy(regLine(xMin))} x2={sx(xMax)} y2={sy(regLine(xMax))} stroke={`${color}88`} strokeWidth={1.5} strokeDasharray="5,3"/>}
      {pts.map((p,i)=><circle key={i} cx={sx(p[0])} cy={sy(p[1])} r={4} fill={`${color}88`} stroke={color} strokeWidth={1}/>)}
    </svg>
  );
}

// ── Trophy SVG ────────────────────────────────────────────────
function TrophySVG({ col=ACCENT }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="bgGS" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={col} stopOpacity="0.25"/><stop offset="100%" stopColor={col} stopOpacity="0"/></radialGradient>
        <linearGradient id="trGS" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FDE68A"/><stop offset="50%" stopColor="#F59E0B"/><stop offset="100%" stopColor="#D97706"/></linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#bgGS)"/>
      <circle cx="36" cy="36" r="32" fill="none" stroke={col} strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M24 18 h24 l-4 20 Q36 44 36 44 Q36 44 28 38 Z" fill="url(#trGS)" opacity="0.95"/>
      <path d="M24 22 Q16 22 16 30 Q16 36 24 36" fill="none" stroke="url(#trGS)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 22 Q56 22 56 30 Q56 36 48 36" fill="none" stroke="url(#trGS)" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="33" y="44" width="6" height="8" rx="1" fill="#F59E0B" opacity="0.9"/>
      <rect x="27" y="52" width="18" height="4" rx="2" fill="url(#trGS)"/>
      <polygon points="36,21 37.5,25.5 42,25.5 38.5,28 40,32.5 36,30 32,32.5 33.5,28 30,25.5 34.5,25.5" fill="#FFFBEB" opacity="0.95"/>
      <circle cx="16" cy="16" r="2.5" fill={col} opacity="0.9"/>
      <circle cx="56" cy="16" r="2" fill="#FDE68A" opacity="0.9"/>
      <circle cx="14" cy="48" r="1.8" fill="#D97706" opacity="0.8"/>
      <circle cx="58" cy="48" r="2.2" fill={col} opacity="0.8"/>
      <circle cx="36" cy="10" r="2" fill="#FDE68A" opacity="0.7"/>
      <rect x="10" y="22" width="3" height="7" rx="1.5" fill="#FCD34D" opacity="0.8" transform="rotate(-25 11.5 25.5)"/>
      <rect x="59" y="28" width="3" height="7" rx="1.5" fill="#FEF3C7" opacity="0.8" transform="rotate(20 60.5 31.5)"/>
    </svg>
  );
}
// ── Notation Table ─────────────────────────────────────────────
const NOTATION = [
  { sym:'\\bar{x}', name:'Sample Mean', meaning:'Arithmetic average of data values', ex:'\\bar{x}=\\dfrac{\\sum x_i}{n}' },
  { sym:'\\mu', name:'Population Mean', meaning:'True mean of the entire population', ex:'\\mu=\\dfrac{\\sum x_i}{N}' },
  { sym:'\\sigma^2', name:'Population Variance', meaning:'Average squared deviation from the mean', ex:'\\sigma^2=\\dfrac{\\sum(x_i-\\mu)^2}{N}' },
  { sym:'s^2', name:'Sample Variance', meaning:'Unbiased estimate of population variance', ex:'s^2=\\dfrac{\\sum(x_i-\\bar{x})^2}{n-1}' },
  { sym:'\\sigma', name:'Standard Deviation', meaning:'Square root of variance — same units as data', ex:'\\sigma=\\sqrt{\\dfrac{\\sum(x_i-\\mu)^2}{N}}' },
  { sym:'CV=\\dfrac{\\sigma}{\\mu}\\times100', name:'Coefficient of Variation', meaning:'Relative measure of dispersion (in %)', ex:'CV=\\dfrac{10}{50}\\times100=20\\%' },
  { sym:'r', name:"Pearson's Correlation", meaning:'Linear association between two variables, r∈[−1,1]', ex:'r=\\dfrac{\\sum(x_i-\\bar{x})(y_i-\\bar{y})}{n\\sigma_x\\sigma_y}' },
  { sym:'r_s', name:"Spearman's Rank Correlation", meaning:'Rank-based correlation coefficient', ex:"r_s=1-\\dfrac{6\\sum d_i^2}{n(n^2-1)}" },
  { sym:'\\hat{y}=a+bx', name:'Regression Line', meaning:'Best-fit line predicting y from x', ex:'b=\\dfrac{\\sum(x-\\bar{x})(y-\\bar{y})}{\\sum(x-\\bar{x})^2}' },
  { sym:'\\mu_r', name:"r-th Central Moment", meaning:'E[(X−μ)^r] measuring shape around mean', ex:'\\mu_2=\\sigma^2,\\;\\mu_3\\text{ (skewness)}' },
  { sym:'\\beta_1', name:'Skewness Coefficient', meaning:'Asymmetry: β₁=μ₃²/μ₂³', ex:'\\beta_1=0\\text{ (symmetric)}' },
  { sym:'\\beta_2', name:'Kurtosis Coefficient', meaning:'Peakedness: β₂=μ₄/μ₂². Normal=3', ex:'\\beta_2>3\\text{ (leptokurtic)}' },
  { sym:'H_0,\\;H_1', name:'Null & Alternative Hypothesis', meaning:'H₀: no effect. H₁: claim we want to prove', ex:'H_0:\\mu=50\\text{ vs }H_1:\\mu>50' },
  { sym:'p\\text{-value}', name:'p-value', meaning:'P(observed result | H₀ true). Reject H₀ if p<α', ex:'p<0.05\\Rightarrow\\text{significant}' },
  { sym:'\\alpha', name:'Significance Level', meaning:'Threshold for rejecting H₀ (typ. 0.05 or 0.01)', ex:'\\alpha=0.05\\Rightarrow 5\\%\\text{ risk}' },
  { sym:'Z=\\dfrac{\\bar{X}-\\mu}{\\sigma/\\sqrt{n}}', name:'Z Test Statistic', meaning:'Standardised sample mean for large n', ex:'Z\\sim N(0,1)\\text{ under }H_0' },
  { sym:'\\chi^2=\\sum\\dfrac{(O-E)^2}{E}', name:'Chi-Square Statistic', meaning:'Test of independence or goodness of fit', ex:'\\text{df}=(r-1)(c-1)' },
  { sym:'F=\\dfrac{MS_B}{MS_W}', name:'F Statistic (ANOVA)', meaning:'Ratio of between-group to within-group variance', ex:'F\\sim F(k-1,N-k)\\text{ under }H_0' },
  { sym:'\\hat{\\theta}_{MLE}', name:'MLE Estimator', meaning:'Parameter value maximising the likelihood L(θ)', ex:'\\hat{\\mu}_{MLE}=\\bar{x}' },
  { sym:'E\\sim N(0,\\sigma^2)', name:'Regression Error Term', meaning:'Residuals assumed Normal with mean 0', ex:'y=\\beta_0+\\beta_1 x+\\varepsilon' },
  { sym:'R^2', name:'Coefficient of Determination', meaning:'Fraction of variance explained by regression', ex:'R^2=1-\\dfrac{SS_{res}}{SS_{tot}}' },
  { sym:'\\Phi(z)', name:'Standard Normal CDF', meaning:'P(Z≤z) for Z~N(0,1)', ex:'\\Phi(1.96)\\approx0.975' },
];

// ── Sections ───────────────────────────────────────────────────
const SECTIONS = [
  {
    id:'central_tendency', title:'Measures of Central Tendency', level:'Foundation', color:'#F59E0B', icon:'x̄',
    shortDef:'Mean, Median, and Mode summarise where data is centred. Each has specific strengths and weaknesses.',
    fullDef:"Central tendency measures locate the 'centre' of a distribution. The Arithmetic Mean (x̄ = Σxᵢ/n) is sensitive to outliers but uses all data. The Median (middle value) is robust to outliers. The Mode (most frequent value) works for categorical data. For grouped data, the Assumed Mean method and Step Deviation method simplify arithmetic. Key relationship: Mean − Mode ≈ 3(Mean − Median) for moderately skewed data (Karl Pearson's empirical formula).",
    keyFacts:[
      {text:'Arithmetic Mean (ungrouped)', l:'\\bar{x}=\\dfrac{\\sum x_i}{n}'},
      {text:'Assumed Mean method', l:'\\bar{x}=A+\\dfrac{\\sum f_i d_i}{\\sum f_i},\\;d_i=x_i-A'},
      {text:'Step Deviation method', l:'\\bar{x}=A+h\\cdot\\dfrac{\\sum f_i u_i}{\\sum f_i},\\;u_i=\\dfrac{x_i-A}{h}'},
      {text:'Median (odd n)', l:'M=\\text{value at position }\\dfrac{n+1}{2}'},
      {text:'Median (grouped)', l:'M=L+\\dfrac{\\frac{n}{2}-F}{f}\\cdot h'},
      {text:"Pearson's empirical relation", l:'\\text{Mean}-\\text{Mode}\\approx3(\\text{Mean}-\\text{Median})'},
    ], genKey:'central_tendency', diagram:'bar',
  },
  {
    id:'dispersion', title:'Measures of Dispersion', level:'Foundation', color:'#D97706', icon:'σ',
    shortDef:'Range, Mean Deviation, Variance, Standard Deviation, and CV measure how spread out data is.',
    fullDef:"Dispersion measures tell us how scattered data is around the central value. Range = Max − Min (simplest but not robust). Mean Deviation = Σ|xᵢ−A|/n (about mean or median). Variance σ² = Σ(xᵢ−μ)²/N averages squared deviations. Standard Deviation σ = √variance has same units as data. Coefficient of Variation CV = (σ/μ)×100% allows comparison of variability between datasets with different units or scales. The most informative single measure is σ.",
    keyFacts:[
      {text:'Range', l:'R = x_{\\max} - x_{\\min}'},
      {text:'Mean Deviation about mean', l:'MD_\\bar{x}=\\dfrac{\\sum|x_i-\\bar{x}|}{n}'},
      {text:'Population Variance', l:'\\sigma^2=\\dfrac{\\sum(x_i-\\mu)^2}{N}'},
      {text:'Sample Variance (unbiased)', l:'s^2=\\dfrac{\\sum(x_i-\\bar{x})^2}{n-1}'},
      {text:'Standard Deviation', l:'\\sigma=\\sqrt{\\dfrac{\\sum(x_i-\\mu)^2}{N}}'},
      {text:'Coefficient of Variation', l:'CV=\\dfrac{\\sigma}{\\bar{x}}\\times100\\%'},
    ], genKey:'dispersion', diagram:'boxplot',
  },
  {
    id:'data_rep', title:'Data Representation', level:'Foundation', color:'#B45309', icon:'Hist',
    shortDef:'Bar charts, histograms, frequency polygons, pie charts, and ogives (cumulative frequency curves) visualise data.',
    fullDef:"Data representation converts raw numbers into visual insight. Histograms show frequency distribution of continuous data — bars touch (unlike bar charts where they are separated). Frequency polygons connect midpoints of histogram bars. Cumulative frequency curves (Ogives) plot cumulative frequency vs class boundary — useful for finding quartiles and percentiles graphically. A pie chart shows proportions of a whole. For comparing two or more groups, back-to-back stem-and-leaf or side-by-side box plots are powerful.",
    keyFacts:[
      {text:'Histogram class width', l:'h=\\dfrac{\\text{Range}}{\\text{Number of classes}}'},
      {text:'Frequency density', l:'f_d=\\dfrac{f_i}{h_i}\\text{ (for unequal class widths)}'},
      {text:'Cumulative frequency', l:'CF_k=\\sum_{i=1}^{k} f_i'},
      {text:'Ogive: median from graph', l:'\\text{Read x-value at CF}=N/2'},
      {text:'Pie chart angle', l:'\\theta_i=\\dfrac{f_i}{N}\\times360°'},
    ], genKey:'data_rep',
  },
  {
    id:'correlation', title:'Correlation & Regression', level:'Foundation', color:'#92400E', icon:'r',
    shortDef:"Pearson's r measures linear correlation. Spearman's rank correlation handles ranked data. Regression finds the best-fit line.",
    fullDef:"Correlation measures the strength and direction of association between two variables. Pearson's r ∈ [−1,1]: r=1 (perfect positive), r=−1 (perfect negative), r=0 (no linear correlation). Spearman's rank correlation rₛ applies when data is ranked or non-normal. Linear regression finds ŷ = a + bx where b = Σ(x−x̄)(y−ȳ)/Σ(x−x̄)² and a = ȳ − bx̄. R² = r² is the coefficient of determination — the fraction of variance in y explained by x. Key caveat: correlation ≠ causation.",
    keyFacts:[
      {text:"Pearson's correlation", l:'r=\\dfrac{\\sum(x_i-\\bar{x})(y_i-\\bar{y})}{\\sqrt{\\sum(x_i-\\bar{x})^2\\sum(y_i-\\bar{y})^2}}'},
      {text:"Spearman's rank", l:"r_s=1-\\dfrac{6\\sum d_i^2}{n(n^2-1)}"},
      {text:'Regression slope', l:'b=\\dfrac{n\\sum xy-\\sum x\\sum y}{n\\sum x^2-(\\sum x)^2}'},
      {text:'Regression intercept', l:'a=\\bar{y}-b\\bar{x}'},
      {text:'Coefficient of determination', l:'R^2=r^2\\in[0,1]'},
      {text:'Interpretation of R²', l:'R^2=0.8\\Rightarrow80\\%\\text{ of variance explained}'},
    ], genKey:'correlation', diagram:'scatter',
  },
  {
    id:'moments', title:'Moments, Skewness & Kurtosis', level:'Foundation', color:'#78350F', icon:'μᵣ',
    shortDef:"Raw moments μ'ᵣ and central moments μᵣ describe shape. Skewness=asymmetry; Kurtosis=peakedness.",
    fullDef:"Moments characterise a distribution's shape beyond just mean and variance. The r-th raw moment = Σxʳ/n. The r-th central moment μᵣ = Σ(x−μ)ʳ/n. μ₁=0, μ₂=σ² (variance), μ₃ measures asymmetry, μ₄ measures peakedness. Skewness β₁ = μ₃²/μ₂³: β₁>0 right-skewed, β₁<0 left-skewed. Kurtosis β₂ = μ₄/μ₂²: normal=3, >3 leptokurtic (peaked), <3 platykurtic (flat). Karl Pearson's skewness = 3(Mean−Median)/σ.",
    keyFacts:[
      {text:'r-th central moment', l:'\\mu_r=\\dfrac{\\sum(x_i-\\bar{x})^r}{n}'},
      {text:'Skewness coefficient', l:'\\beta_1=\\dfrac{\\mu_3^2}{\\mu_2^3}\\;(=0\\text{ for symmetric})'},
      {text:"Pearson's skewness", l:'\\text{Sk}=\\dfrac{3(\\bar{x}-M)}{\\sigma}\\in[-3,3]'},
      {text:'Kurtosis', l:'\\beta_2=\\dfrac{\\mu_4}{\\mu_2^2}\\;(=3\\text{ for normal})'},
      {text:'Excess kurtosis', l:'\\gamma_2=\\beta_2-3\\;(=0\\text{ for normal})'},
      {text:'Right skew', l:'\\text{Mean}>\\text{Median}>\\text{Mode}'},
    ], genKey:'moments',
  },
  {
    id:'distributions', title:'Probability Distributions', level:'Competitive', color:'#EF4444', icon:'N(μ,σ²)',
    shortDef:'Binomial, Poisson, Normal, Exponential, Gamma — each models a specific real-world data-generating process.',
    fullDef:"Probability distributions model random phenomena. Binomial: n trials, k successes, prob p. Poisson: rare events at average rate λ. Normal N(μ,σ²): the bell curve — symmetric, defined by just μ and σ. The Standard Normal Z~N(0,1) is used with tables. For large n, Binomial and Poisson converge to Normal (CLT). Exponential: waiting time between Poisson events. Gamma: waiting time for k events. Beta: models probabilities bounded in [0,1]. The Normal is the most important due to the CLT.",
    keyFacts:[
      {text:'Normal distribution', l:'X\\sim N(\\mu,\\sigma^2):\\;f(x)=\\dfrac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}'},
      {text:'Standard Normal', l:'Z=\\dfrac{X-\\mu}{\\sigma}\\sim N(0,1)'},
      {text:'68-95-99.7 rule', l:'P(\\mu-\\sigma<X<\\mu+\\sigma)\\approx68\\%,\\;95\\%,\\;99.7\\%'},
      {text:'Binomial → Normal (large n)', l:'\\text{Bin}(n,p)\\approx N(np,npq)'},
      {text:'Exponential', l:'f(x)=\\lambda e^{-\\lambda x},\\;E[X]=1/\\lambda'},
      {text:'Normal CDF', l:'P(X\\leq x)=\\Phi\\left(\\frac{x-\\mu}{\\sigma}\\right)'},
    ], genKey:'distributions', diagram:'normal',
  },
  {
    id:'sampling', title:'Sampling & Central Limit Theorem', level:'Competitive', color:'#DC2626', icon:'CLT',
    shortDef:'The CLT: sample mean X̄ ~ N(μ, σ²/n) for large n, regardless of the original distribution.',
    fullDef:"Sampling theory studies how sample statistics estimate population parameters. The sampling distribution of X̄ has mean μ and standard error σ/√n. The Central Limit Theorem (CLT) says: for large n (≥30), X̄ is approximately Normal, whatever the population distribution. This is the theoretical justification for using Z-tests and confidence intervals. Standard error = σ/√n decreases as n grows — larger samples give more precise estimates. The CLT is why Normal distributions appear everywhere in practice.",
    keyFacts:[
      {text:'Standard Error of Mean', l:'SE=\\dfrac{\\sigma}{\\sqrt{n}}'},
      {text:'CLT: distribution of sample mean', l:'\\bar{X}\\sim N\\left(\\mu,\\dfrac{\\sigma^2}{n}\\right)\\text{ (large }n)'},
      {text:'Standardised sample mean', l:'Z=\\dfrac{\\bar{X}-\\mu}{\\sigma/\\sqrt{n}}\\sim N(0,1)'},
      {text:'Rule of thumb for CLT', l:'n\\geq30\\text{ usually sufficient}'},
      {text:'Population vs sample variance', l:'E[s^2]=\\sigma^2\\text{ (unbiased with }n-1)'},
      {text:'Confidence interval (known σ)', l:'\\bar{x}\\pm z_{\\alpha/2}\\cdot\\dfrac{\\sigma}{\\sqrt{n}}'},
    ], genKey:'sampling',
  },
  {
    id:'hypothesis', title:'Hypothesis Testing', level:'Competitive', color:'#B91C1C', icon:'H₀',
    shortDef:'Set up H₀ and H₁, compute a test statistic, compare to critical value or find the p-value.',
    fullDef:"Hypothesis testing is the formal procedure for using data to make decisions about population parameters. Steps: (1) State H₀ (null: no effect) and H₁ (alternative: our claim). (2) Choose significance level α (usually 0.05). (3) Compute test statistic (Z, t, χ², F). (4) Find p-value or compare to critical value. (5) Reject H₀ if p < α. Type I error: reject true H₀ (probability = α). Type II error: fail to reject false H₀ (probability = β). Power = 1−β is the probability of correctly rejecting a false H₀.",
    keyFacts:[
      {text:'Z-test statistic', l:'Z=\\dfrac{\\bar{X}-\\mu_0}{\\sigma/\\sqrt{n}}\\sim N(0,1)\\text{ under }H_0'},
      {text:'t-test (σ unknown)', l:'t=\\dfrac{\\bar{X}-\\mu_0}{s/\\sqrt{n}}\\sim t_{n-1}\\text{ under }H_0'},
      {text:'Type I error', l:'P(\\text{reject }H_0|H_0\\text{ true})=\\alpha'},
      {text:'Type II error', l:'P(\\text{fail to reject }H_0|H_1\\text{ true})=\\beta'},
      {text:'Power of test', l:'\\text{Power}=1-\\beta=P(\\text{reject }H_0|H_1\\text{ true})'},
      {text:'Decision rule', l:'\\text{Reject }H_0\\text{ if }|Z|>z_{\\alpha/2}\\text{ (two-tailed)}'},
    ], genKey:'hypothesis',
  },
  {
    id:'chi_anova', title:'Chi-Square Test & ANOVA', level:'Competitive', color:'#7C3AED', icon:'χ²',
    shortDef:'Chi-square: test independence of categorical variables. ANOVA: compare means of 3+ groups.',
    fullDef:"Chi-square test for independence: given a contingency table of observed frequencies O, expected E = (row total × column total)/grand total, χ² = Σ(O−E)²/E with df=(r−1)(c−1). Reject independence if χ² > critical value. ANOVA (Analysis of Variance) tests whether k group means are equal. It partitions total variation into Between-group (SS_B) and Within-group (SS_W). F = MS_B/MS_W where MS = SS/df. If F > F_critical, at least one group mean differs. One-way ANOVA extends the two-sample t-test to k≥3 groups.",
    keyFacts:[
      {text:'Chi-square statistic', l:'\\chi^2=\\sum\\dfrac{(O_{ij}-E_{ij})^2}{E_{ij}}'},
      {text:'Expected frequency', l:'E_{ij}=\\dfrac{R_i\\times C_j}{N}'},
      {text:'Degrees of freedom (χ²)', l:'df=(r-1)(c-1)'},
      {text:'ANOVA F statistic', l:'F=\\dfrac{MS_B}{MS_W}=\\dfrac{SS_B/(k-1)}{SS_W/(N-k)}'},
      {text:'ANOVA partition', l:'SS_T=SS_B+SS_W'},
      {text:'Reject H₀ if', l:'F>F_{\\alpha,k-1,N-k}\\text{ (F-table)}'},
    ], genKey:'chi_anova',
  },
  {
    id:'regression', title:'Linear Regression & R²', level:'Competitive', color:'#5B21B6', icon:'ŷ=a+bx',
    shortDef:'Fit ŷ = a + bx by minimising Σ(yᵢ − ŷᵢ)² (Ordinary Least Squares). R² measures goodness of fit.',
    fullDef:"Simple Linear Regression finds the line ŷ = a + bx that minimises the sum of squared residuals (OLS). Formulas: b = [nΣxy − ΣxΣy]/[nΣx² − (Σx)²], a = ȳ − bx̄. The residuals eᵢ = yᵢ − ŷᵢ should be random, with mean 0 and constant variance. R² = SS_reg/SS_tot ∈ [0,1] measures the proportion of variance explained. Multiple Linear Regression extends to k predictors: y = β₀ + β₁x₁ + … + βₖxₖ + ε. Normal equations or matrix form (β̂ = (XᵀX)⁻¹Xᵀy) solve for coefficients.",
    keyFacts:[
      {text:'OLS slope', l:'b=\\dfrac{n\\sum xy-\\sum x\\sum y}{n\\sum x^2-(\\sum x)^2}'},
      {text:'OLS intercept', l:'a=\\bar{y}-b\\bar{x}'},
      {text:'Sum of Squares Total', l:'SS_T=\\sum(y_i-\\bar{y})^2'},
      {text:'R² formula', l:'R^2=1-\\dfrac{\\sum(y_i-\\hat{y}_i)^2}{\\sum(y_i-\\bar{y})^2}'},
      {text:'Multiple regression (matrix)', l:'\\hat{\\boldsymbol{\\beta}}=(\\mathbf{X}^T\\mathbf{X})^{-1}\\mathbf{X}^T\\mathbf{y}'},
      {text:'Residual assumption', l:'\\varepsilon_i\\sim N(0,\\sigma^2)\\text{ i.i.d.}'},
    ], genKey:'regression',
  },
  {
    id:'inequalities', title:'Statistical Inequalities', level:'Olympiad', color:'#1D4ED8', icon:'≤',
    shortDef:"Chebyshev: P(|X−μ|≥kσ)≤1/k². Jensen: f(E[X])≤E[f(X)] for convex f. Cauchy-Schwarz bounds correlations.",
    fullDef:"Statistical inequalities provide distribution-free bounds. Chebyshev's inequality: P(|X−μ|≥kσ) ≤ 1/k² — works for ANY distribution with finite mean and variance. Jensen's inequality: for convex f, f(E[X]) ≤ E[f(X)]. For concave f, inequality reverses. This is used to prove AM ≥ GM, and that E[X²] ≥ (E[X])². Cauchy-Schwarz: (Σaᵢbᵢ)² ≤ (Σaᵢ²)(Σbᵢ²) — used to prove |r| ≤ 1 and many other bounds. Markov's inequality: P(X ≥ a) ≤ E[X]/a for non-negative X.",
    keyFacts:[
      {text:"Chebyshev's inequality", l:'P(|X-\\mu|\\geq k\\sigma)\\leq\\dfrac{1}{k^2}'},
      {text:"Jensen's inequality (convex f)", l:'f(E[X])\\leq E[f(X)]'},
      {text:"Jensen's (concave f, e.g. log)", l:'E[\\log X]\\leq\\log(E[X])'},
      {text:'Cauchy-Schwarz', l:'\\left(\\sum a_ib_i\\right)^2\\leq\\left(\\sum a_i^2\\right)\\left(\\sum b_i^2\\right)'},
      {text:"Markov's inequality", l:'P(X\\geq a)\\leq\\dfrac{E[X]}{a}\\;(X\\geq0,a>0)'},
      {text:'AM-GM from Jensen', l:'\\dfrac{x_1+\\cdots+x_n}{n}\\geq(x_1\\cdots x_n)^{1/n}'},
    ], genKey:'inequalities',
  },
  {
    id:'estimation', title:'Estimation Theory (MLE & MOM)', level:'Olympiad', color:'#0E7490', icon:'θ̂',
    shortDef:'MLE: maximise L(θ|data). Method of Moments: equate sample moments to population moments and solve for θ.',
    fullDef:"Point estimation produces a single best guess for an unknown parameter. Maximum Likelihood Estimation (MLE): find θ̂ that maximises L(θ) = Πf(xᵢ;θ) — equivalently, maximise the log-likelihood ℓ(θ) = Σlog f(xᵢ;θ). Setting ∂ℓ/∂θ = 0 gives the MLE. For Normal: μ̂_MLE = x̄, σ̂²_MLE = Σ(xᵢ−x̄)²/n (biased). Method of Moments: set theoretical moments equal to sample moments. For Binomial: p̂ = x̄/n. MLE is the most widely used estimator — it is consistent, asymptotically normal, and (often) efficient.",
    keyFacts:[
      {text:'Likelihood function', l:'L(\\theta)=\\prod_{i=1}^n f(x_i;\\theta)'},
      {text:'Log-likelihood', l:'\\ell(\\theta)=\\sum_{i=1}^n\\log f(x_i;\\theta)'},
      {text:'MLE equation', l:'\\dfrac{\\partial\\ell}{\\partial\\theta}=0\\Rightarrow\\hat{\\theta}_{MLE}'},
      {text:'MLE for Normal mean', l:'\\hat{\\mu}_{MLE}=\\bar{x}'},
      {text:'MLE for Normal variance', l:'\\hat{\\sigma}^2_{MLE}=\\dfrac{1}{n}\\sum(x_i-\\bar{x})^2\\;(\\text{biased})'},
      {text:'Method of Moments', l:'\\text{Set }\\hat{\\mu}_k^{\\prime}=m_k^{\\prime},\\text{ solve for }\\theta'},
    ], genKey:'estimation',
  },
  {
    id:'nonparametric', title:'Non-Parametric Methods', level:'Olympiad', color:'#047857', icon:'Rank',
    shortDef:"Wilcoxon, Mann-Whitney, Kruskal-Wallis tests don't require Normality — they work on ranks.",
    fullDef:"Non-parametric tests make no assumption about the population distribution — they work on ranks or signs rather than raw values. Wilcoxon Signed-Rank Test: one-sample or paired test for the median (alternative to t-test). Mann-Whitney U Test: compares two independent samples (alternative to two-sample t-test). Kruskal-Wallis Test: compares k independent samples (alternative to one-way ANOVA). These tests are more robust but generally less powerful than their parametric counterparts when normality holds. They are essential for small samples or heavily skewed data.",
    keyFacts:[
      {text:'Wilcoxon signed-rank', l:'W=\\sum_{i:d_i>0}R_i,\\;d_i=x_i-\\mu_0'},
      {text:'Mann-Whitney U', l:'U=n_1n_2+\\dfrac{n_1(n_1+1)}{2}-R_1'},
      {text:'Kruskal-Wallis H statistic', l:'H=\\dfrac{12}{N(N+1)}\\sum_{i=1}^k\\dfrac{R_i^2}{n_i}-3(N+1)'},
      {text:'H ~ χ² approximation', l:'H\\sim\\chi^2_{k-1}\\text{ under }H_0'},
      {text:'Trade-off', l:'\\text{Less powerful than param. tests, but robust}'},
    ], genKey:'nonparametric',
  },
  {
    id:'joint_dist', title:'Joint & Conditional Distributions', level:'Olympiad', color:'#065F46', icon:'f(x,y)',
    shortDef:'Joint PDF f(x,y); marginal fₓ(x)=∫f(x,y)dy; conditional f(x|y)=f(x,y)/fᵧ(y). Bivariate Normal.',
    fullDef:"Joint distributions describe two random variables simultaneously. For continuous (X,Y): joint PDF f(x,y), marginals fₓ(x)=∫f(x,y)dy and fᵧ(y)=∫f(x,y)dx, and conditional f(x|y)=f(x,y)/fᵧ(y). X and Y are independent iff f(x,y)=fₓ(x)·fᵧ(y). Covariance Cov(X,Y)=E[(X−μₓ)(Y−μᵧ)] and correlation ρ=Cov(X,Y)/(σₓσᵧ). The Bivariate Normal distribution is characterised by (μₓ,μᵧ,σₓ,σᵧ,ρ). For Bivariate Normal, zero correlation implies independence.",
    keyFacts:[
      {text:'Marginal from joint', l:'f_X(x)=\\int_{-\\infty}^{\\infty}f(x,y)\\,dy'},
      {text:'Conditional PDF', l:'f(x|y)=\\dfrac{f(x,y)}{f_Y(y)}'},
      {text:'Independence condition', l:'f(x,y)=f_X(x)\\cdot f_Y(y)'},
      {text:'Covariance', l:'\\text{Cov}(X,Y)=E[XY]-E[X]E[Y]'},
      {text:'Correlation coefficient', l:'\\rho=\\dfrac{\\text{Cov}(X,Y)}{\\sigma_X\\sigma_Y}\\in[-1,1]'},
      {text:'Bivariate Normal: ρ=0 ⟹ indep.', l:'\\text{Only for bivariate normal: }\\rho=0\\Leftrightarrow X\\perp Y'},
    ], genKey:'joint_dist',
  },
];
// ── Practice Generators ────────────────────────────────────────
const GENERATORS = {
  central_tendency:(n)=>{
    const mode=n%3;
    if(mode===0){
      const data=genData(n,srI(n+1,5,8),10,50);
      const m=mean(data);
      return{question:`Find the arithmetic mean of: ${data.join(', ')}`,questionLatex:`\\bar{x}=\\dfrac{\\sum x_i}{n}=?`,steps:[`n = ${data.length}`,`Σxᵢ = ${data.reduce((a,b)=>a+b,0)}`,`x̄ = ${data.reduce((a,b)=>a+b,0)}/${data.length} = ${fmt(m,4)}`],answer:`${fmt(m,4)}`,answerLatex:`\\bar{x}=${fmt(m,4)}`,tip:'Mean = sum/count. For assumed mean method: choose A near centre, find dᵢ=xᵢ-A, mean=A+Σdᵢ/n.'};
    } else if(mode===1){
      const data=genData(n,srI(n+1,5,9),5,30).sort((a,b)=>a-b);
      const odd=data.length%2===1;
      const med=odd?data[Math.floor(data.length/2)]:(data[data.length/2-1]+data[data.length/2])/2;
      return{question:`Find the median of: ${data.join(', ')}`,questionLatex:`\\text{Median}=?\\;(n=${data.length})`,steps:[`Sort: ${data.join(', ')}`,`n=${data.length} (${odd?'odd':'even'})`,odd?`Median = value at position ${Math.floor(data.length/2)+1} = ${med}`:`Median = avg of positions ${data.length/2} and ${data.length/2+1} = (${data[data.length/2-1]}+${data[data.length/2]})/2 = ${med}`],answer:`${med}`,answerLatex:`M=${med}`,tip:'Always sort first! n odd: middle value. n even: average of two middle values.'};
    } else {
      const A=srI(n,20,40),h=srI(n+1,5,10);
      const freqs=[srI(n+2,3,8),srI(n+3,5,12),srI(n+4,8,15),srI(n+5,5,10),srI(n+6,2,6)];
      const mids=Array.from({length:5},(_,i)=>A-2*h+i*h);
      const N=freqs.reduce((a,b)=>a+b,0);
      const sumfx=mids.reduce((s,x,i)=>s+x*freqs[i],0);
      const xbar=sumfx/N;
      return{question:`Compute the mean using direct method. Classes centred at: ${mids.join(', ')} with frequencies: ${freqs.join(', ')}.`,questionLatex:`\\bar{x}=\\dfrac{\\sum f_i x_i}{\\sum f_i}=?`,steps:[`Σf = ${N}`,`Σfx = ${mids.map((x,i)=>`${x}×${freqs[i]}`).join('+')} = ${sumfx}`,`x̄ = ${sumfx}/${N} = ${fmt(xbar,4)}`],answer:`${fmt(xbar,4)}`,answerLatex:`\\bar{x}=${fmt(xbar,4)}`,tip:'Direct method for grouped data: use class midpoints. Assumed mean method reduces arithmetic.'};
    }
  },
  dispersion:(n)=>{
    const mode=n%4;
    if(mode===0){
      const data=genData(n,6,10,50);
      const v=variance(data);const s=sd(data);
      return{question:`Find variance and SD for: ${data.join(', ')}`,questionLatex:`\\sigma^2=\\dfrac{\\sum(x_i-\\bar{x})^2}{n}=?`,steps:[`x̄ = ${fmt(mean(data),4)}`,`Deviations²: ${data.map(x=>fmt((x-mean(data))**2,2)).join(', ')}`,`Σ(xᵢ-x̄)² = ${fmt(data.reduce((s,x)=>s+(x-mean(data))**2,0),4)}`,`σ² = ${fmt(v,4)}, σ = ${fmt(s,4)}`],answer:`σ²=${fmt(v,4)}, σ=${fmt(s,4)}`,answerLatex:`\\sigma^2=${fmt(v,4)},\\;\\sigma=${fmt(s,4)}`,tip:'Variance = average squared deviation. SD = √variance. Sample variance uses n-1.'};
    } else if(mode===1){
      const data=genData(n,6,5,40);
      const m=mean(data);const md=data.reduce((s,x)=>s+Math.abs(x-m),0)/data.length;
      return{question:`Find Mean Deviation about mean for: ${data.join(', ')}`,questionLatex:`MD_{\\bar{x}}=\\dfrac{\\sum|x_i-\\bar{x}|}{n}=?`,steps:[`x̄ = ${fmt(m,2)}`,`|xᵢ-x̄|: ${data.map(x=>fmt(Math.abs(x-m),2)).join(', ')}`,`Σ|xᵢ-x̄| = ${fmt(data.reduce((s,x)=>s+Math.abs(x-m),0),4)}`,`MD = ${fmt(md,4)}`],answer:`${fmt(md,4)}`,answerLatex:`MD_{\\bar{x}}=${fmt(md,4)}`,tip:'Mean Deviation uses absolute values (not squares). Always positive.'};
    } else if(mode===2){
      const mu1=srI(n,30,60),s1=srI(n+1,5,12),mu2=srI(n+2,40,80),s2=srI(n+3,8,20);
      const cv1=s1/mu1*100,cv2=s2/mu2*100;
      return{question:`Compare variability: Dataset A (mean=${mu1}, SD=${s1}) vs Dataset B (mean=${mu2}, SD=${s2}).`,questionLatex:`CV=\\dfrac{\\sigma}{\\bar{x}}\\times100\\%`,steps:[`CV_A = ${s1}/${mu1} × 100 = ${fmt(cv1,2)}%`,`CV_B = ${s2}/${mu2} × 100 = ${fmt(cv2,2)}%`,`${cv1<cv2?'A':'B'} has lower CV → ${cv1<cv2?'A':'B'} is more consistent`],answer:`CV_A=${fmt(cv1,2)}%, CV_B=${fmt(cv2,2)}%. ${cv1<cv2?'A':'B'} more consistent.`,answerLatex:`CV_A=${fmt(cv1,2)}\\%,\\;CV_B=${fmt(cv2,2)}\\%`,tip:'CV compares variability regardless of scale/units. Lower CV = more consistent.'};
    } else {
      const data=genData(n,7,10,60);
      const rng=Math.max(...data)-Math.min(...data);
      return{question:`Find Range and CV for: ${data.join(', ')}`,questionLatex:`R=x_{\\max}-x_{\\min},\\;CV=\\dfrac{\\sigma}{\\bar{x}}\\times100\\%`,steps:[`Min=${Math.min(...data)}, Max=${Math.max(...data)}`,`Range = ${rng}`,`x̄ = ${fmt(mean(data),4)}, σ = ${fmt(sd(data),4)}`,`CV = ${fmt(sd(data)/mean(data)*100,2)}%`],answer:`Range=${rng}, CV=${fmt(sd(data)/mean(data)*100,2)}%`,answerLatex:`R=${rng},\\;CV=${fmt(sd(data)/mean(data)*100,2)}\\%`,tip:'Range is simplest but not robust. CV is unit-free — useful for comparison.'};
    }
  },
  data_rep:(n)=>{
    const classes=['0-10','10-20','20-30','30-40','40-50'];
    const freqs=Array.from({length:5},(_,i)=>srI(n+i,3,15));
    const N=freqs.reduce((a,b)=>a+b,0);
    const cf=freqs.reduce((arr,f)=>[...arr,(arr[arr.length-1]||0)+f],[]);
    const medIdx=N/2, medClass=cf.findIndex(c=>c>=medIdx);
    const L=medClass*10, F=medClass>0?cf[medClass-1]:0, f=freqs[medClass], h=10;
    const med=L+(medIdx-F)/f*h;
    return{question:`For the frequency distribution: Classes ${classes.join(', ')}, Frequencies ${freqs.join(', ')}. Find the median using ogive formula.`,questionLatex:`M=L+\\dfrac{\\frac{N}{2}-F}{f}\\cdot h=?`,steps:[`N = ${N}, N/2 = ${N/2}`,`Cumulative frequencies: ${cf.join(', ')}`,`Median class: ${classes[medClass]} (CF first ≥ N/2)`,`L=${L}, F=${F}, f=${f}, h=${h}`,`Median = ${L} + (${N/2}-${F})/${f} × ${h} = ${fmt(med,4)}`],answer:`${fmt(med,4)}`,answerLatex:`M=${fmt(med,4)}`,tip:'Median from ogive: draw CF curve, read x at y=N/2. Formula: L+(N/2-F)/f×h.'};
  },
  correlation:(n)=>{
    const sz=srI(n,4,6);
    const xs=Array.from({length:sz},(_,i)=>srI(n+i*7,5,20));
    const slope=srI(n+1,1,3)/2, noise=srI(n+2,0,3);
    const ys=xs.map((x,i)=>Math.round(slope*x+srI(n+i*11,0,noise*2)));
    const xbar=mean(xs),ybar=mean(ys);
    const num=xs.reduce((s,x,i)=>s+(x-xbar)*(ys[i]-ybar),0);
    const den=Math.sqrt(xs.reduce((s,x)=>s+(x-xbar)**2,0)*ys.reduce((s,y)=>s+(y-ybar)**2,0));
    const r=num/den;
    const b=num/xs.reduce((s,x)=>s+(x-xbar)**2,0);
    const a=ybar-b*xbar;
    return{question:`Given x: ${xs.join(', ')} and y: ${ys.join(', ')}. Find Pearson's r and the regression line ŷ = a + bx.`,questionLatex:`r=\\dfrac{\\sum(x_i-\\bar{x})(y_i-\\bar{y})}{n\\sigma_x\\sigma_y},\\;\\hat{y}=a+bx`,steps:[`x̄=${fmt(xbar,2)}, ȳ=${fmt(ybar,2)}`,`Σ(x-x̄)(y-ȳ) = ${fmt(num,4)}`,`r = ${fmt(num,4)}/√(...)= ${fmt(r,4)}`,`b = ${fmt(b,4)}, a = ${fmt(ybar,4)}-${fmt(b,4)}×${fmt(xbar,4)} = ${fmt(a,4)}`,`Regression line: ŷ = ${fmt(a,4)} + ${fmt(b,4)}x`],answer:`r = ${fmt(r,4)}, ŷ = ${fmt(a,4)} + ${fmt(b,4)}x`,answerLatex:`r=${fmt(r,4)},\\;\\hat{y}=${fmt(a,4)}+${fmt(b,4)}x`,tip:'r>0: positive correlation, r<0: negative. |r|>0.8: strong. b=Σ(x-x̄)(y-ȳ)/Σ(x-x̄)².'};
  },
  moments:(n)=>{
    const data=genData(n,6,10,40);
    const m=mean(data);
    const mu2=data.reduce((s,x)=>s+(x-m)**2,0)/data.length;
    const mu3=data.reduce((s,x)=>s+(x-m)**3,0)/data.length;
    const mu4=data.reduce((s,x)=>s+(x-m)**4,0)/data.length;
    const beta1=mu3**2/mu3**3||0;
    const beta2=mu4/mu2**2;
    const skPearson=3*(m-data.sort((a,b)=>a-b)[Math.floor(data.length/2)])/Math.sqrt(mu2);
    return{question:`For data ${data.join(', ')}, find σ², μ₃, β₂ (kurtosis), and Pearson's skewness.`,questionLatex:`\\beta_2=\\dfrac{\\mu_4}{\\mu_2^2}=?,\\;\\text{Sk}=\\dfrac{3(\\bar{x}-M)}{\\sigma}=?`,steps:[`x̄=${fmt(m,4)}, μ₂=σ²=${fmt(mu2,4)}`,`μ₃=${fmt(mu3,4)}, μ₄=${fmt(mu4,4)}`,`β₂=μ₄/μ₂²=${fmt(beta2,4)} (${beta2>3?'leptokurtic >3':'platykurtic <3'})`,`Median=${data[Math.floor(data.length/2)]}`,`Pearson Sk = 3(${fmt(m,2)}-${data[Math.floor(data.length/2)]})/${fmt(Math.sqrt(mu2),4)} = ${fmt(skPearson,4)}`],answer:`σ²=${fmt(mu2,4)}, β₂=${fmt(beta2,4)}, Sk=${fmt(skPearson,4)}`,answerLatex:`\\sigma^2=${fmt(mu2,4)},\\;\\beta_2=${fmt(beta2,4)},\\;\\text{Sk}=${fmt(skPearson,4)}`,tip:'β₂=3: normal. β₂>3: leptokurtic (heavy tails). Skewness: right skew → mean>median>mode.'};
  },
  distributions:(n)=>{
    const mode=n%3;
    if(mode===0){
      const mu=srI(n,40,70),sig=srI(n+1,5,15),x=mu+srI(n+2,1,2)*sig;
      const z=(x-mu)/sig;
      return{question:`X~N(${mu},${sig}²). Find P(X≤${x}) by standardising to Z.`,questionLatex:`P(X\\leq${x})=\\Phi\\left(\\frac{${x}-${mu}}{${sig}}\\right)=?`,steps:[`Z = (X-μ)/σ = (${x}-${mu})/${sig} = ${fmt(z,4)}`,`P(X≤${x}) = Φ(${fmt(z,4)})`,`From Z-table: Φ(${fmt(z,1)}) ≈ ${fmt(0.5+0.5*Math.sign(z)*Math.min(0.49865,Math.abs(z)*0.34),4)}`,`For Z=1: 0.8413; Z=2: 0.9772; Z=-1: 0.1587`],answer:`Φ(${fmt(z,4)}) — use Z-table`,answerLatex:`P(X\\leq${x})=\\Phi(${fmt(z,4)})`,tip:'Always standardise: Z=(X-μ)/σ. Φ(z) from the standard normal table.'};
    } else if(mode===1){
      const lam=srI(n,2,6),k=srI(n+1,0,lam+2);
      const prob=Math.exp(-lam)*Math.pow(lam,k)/fact(Math.min(k,15));
      return{question:`X~Poisson(${lam}). Find P(X=${k}).`,questionLatex:`P(X=${k})=\\dfrac{e^{-${lam}}\\cdot${lam}^{${k}}}{${k}!}=?`,steps:[`P(X=${k}) = e^{-${lam}}·${lam}^${k}/${k}!`,`= ${fmt(Math.exp(-lam),6)} × ${fmt(Math.pow(lam,k),4)} / ${fact(Math.min(k,15))}`,`= ${fmt(prob,6)}`],answer:`${fmt(prob,6)}`,answerLatex:`P(X=${k})=${fmt(prob,4)}`,tip:'Poisson models rare events. Mean=Variance=λ.'};
    } else {
      const lam=srI(n+1,1,4)/2,x=srI(n+2,1,4);
      const prob=1-Math.exp(-lam*x);
      return{question:`X~Exponential(λ=${lam}). Find P(X≤${x}).`,questionLatex:`P(X\\leq${x})=1-e^{-${lam}\\cdot${x}}=?`,steps:[`CDF: F(x) = 1 − e^{-λx}`,`P(X≤${x}) = 1 − e^{-${lam}×${x}} = 1 − e^{-${lam*x}}`,`= 1 − ${fmt(Math.exp(-lam*x),6)} = ${fmt(prob,6)}`],answer:`${fmt(prob,6)}`,answerLatex:`P(X\\leq${x})=${fmt(prob,4)}`,tip:'Exponential: memoryless property — P(X>s+t|X>s)=P(X>t).'};
    }
  },
  sampling:(n)=>{
    const mu=srI(n,40,70),sig=srI(n+1,8,20),sampleN=srI(n+2,25,100);
    const se=sig/Math.sqrt(sampleN);
    const xbar=mu+srI(n+3,1,3)*(sig/Math.sqrt(sampleN));
    const z=(xbar-mu)/se;
    const ci95_lo=xbar-1.96*se,ci95_hi=xbar+1.96*se;
    return{question:`Population: μ=${mu}, σ=${sig}. Sample size n=${sampleN}. (a) Find SE. (b) Sample mean x̄=${fmt(xbar,2)} — find Z. (c) Find 95% CI for μ.`,questionLatex:`SE=\\dfrac{\\sigma}{\\sqrt{n}},\\;Z=\\dfrac{\\bar{x}-\\mu}{SE},\\;\\bar{x}\\pm1.96\\cdot SE`,steps:[`SE = ${sig}/√${sampleN} = ${fmt(se,4)}`,`Z = (${fmt(xbar,2)}-${mu})/${fmt(se,4)} = ${fmt(z,4)}`,`95% CI: ${fmt(xbar,2)} ± 1.96×${fmt(se,4)}`,`= (${fmt(ci95_lo,4)}, ${fmt(ci95_hi,4)})`],answer:`SE=${fmt(se,4)}, Z=${fmt(z,4)}, 95% CI=(${fmt(ci95_lo,2)},${fmt(ci95_hi,2)})`,answerLatex:`SE=${fmt(se,4)},\\;Z=${fmt(z,4)},\\;CI=(${fmt(ci95_lo,2)},${fmt(ci95_hi,2)})`,tip:'SE=σ/√n. 95% CI uses z=1.96. 99% CI uses z=2.576.'};
  },
  hypothesis:(n)=>{
    const mu0=srI(n,40,70),sig=srI(n+1,8,18),sampleN=srI(n+2,30,100);
    const xbar=mu0+srI(n+3,2,5)*(sig/Math.sqrt(sampleN))*(n%2===0?1:-1);
    const se=sig/Math.sqrt(sampleN);
    const z=(xbar-mu0)/se;
    const reject=Math.abs(z)>1.96;
    return{question:`Test H₀: μ=${mu0} vs H₁: μ≠${mu0} at α=0.05. Given: x̄=${fmt(xbar,2)}, σ=${sig}, n=${sampleN}.`,questionLatex:`Z=\\dfrac{\\bar{x}-\\mu_0}{\\sigma/\\sqrt{n}}=?\\;(\\text{critical value}\\pm1.96)`,steps:[`SE = ${sig}/√${sampleN} = ${fmt(se,4)}`,`Z = (${fmt(xbar,2)}-${mu0})/${fmt(se,4)} = ${fmt(z,4)}`,`|Z| = ${fmt(Math.abs(z),4)}, critical value = 1.96 (α=0.05, two-tailed)`,`Decision: ${reject?'REJECT H₀ (|Z|>1.96)':'FAIL TO REJECT H₀ (|Z|≤1.96)'}`],answer:`Z=${fmt(z,4)}. ${reject?'Reject H₀':'Do not reject H₀'} at α=0.05.`,answerLatex:`Z=${fmt(z,4)},\\;${reject?'\\text{Reject }H_0':'\\text{Fail to reject }H_0'}`,tip:'Two-tailed test: reject if |Z|>1.96 (α=0.05). One-tailed: use z=1.645.'};
  },
  chi_anova:(n)=>{
    const r=srI(n,2,3),c=2;
    const O=Array.from({length:r},(_,i)=>Array.from({length:c},(_,j)=>srI(n+i*7+j*13,5,30)));
    const rowSums=O.map(row=>row.reduce((a,b)=>a+b,0));
    const colSums=Array.from({length:c},(_,j)=>O.reduce((s,row)=>s+row[j],0));
    const N=rowSums.reduce((a,b)=>a+b,0);
    const E=O.map((row,i)=>row.map((_,j)=>rowSums[i]*colSums[j]/N));
    const chi2=O.reduce((s,row,i)=>s+row.reduce((ss,o,j)=>ss+(o-E[i][j])**2/E[i][j],0),0);
    const df=(r-1)*(c-1);
    const crit95=[3.841,5.991,7.815];
    const reject=chi2>crit95[df-1];
    return{question:`Chi-square test: Observed O = ${O.map(r=>r.join(',')).join(' | ')}. Test independence at α=0.05.`,questionLatex:`\\chi^2=\\sum\\dfrac{(O-E)^2}{E},\\;df=${df}`,steps:[`N=${N}, Row sums: ${rowSums.join(', ')}`,`Expected E: ${E.map(r=>r.map(v=>fmt(v,2)).join(',')).join(' | ')}`,`χ² = ${O.map((row,i)=>row.map((_,j)=>fmt((O[i][j]-E[i][j])**2/E[i][j],4))).flat().join('+')} = ${fmt(chi2,4)}`,`df=${df}, critical value=${crit95[df-1]} (α=0.05)`,`Decision: ${reject?'REJECT H₀ (dependent)':'Fail to reject (may be independent)'}`],answer:`χ²=${fmt(chi2,4)}, df=${df}. ${reject?'Reject H₀':'Do not reject H₀'}`,answerLatex:`\\chi^2=${fmt(chi2,4)},\\;df=${df}`,tip:'E=row total × col total / N. df=(r-1)(c-1). Large χ² → reject independence.'};
  },
  regression:(n)=>{
    const k=srI(n,4,7);
    const xs=Array.from({length:k},(_,i)=>srI(n+i*9,5,25));
    const a0=srI(n+1,2,8),b0=srI(n+2,1,4)/2;
    const ys=xs.map((x,i)=>Math.round(a0+b0*x+srI(n+i*13,-3,3)));
    const xbar=mean(xs),ybar=mean(ys);
    const num=xs.reduce((s,x,i)=>s+(x-xbar)*(ys[i]-ybar),0);
    const denx=xs.reduce((s,x)=>s+(x-xbar)**2,0);
    const b=num/denx,a=ybar-b*xbar;
    const ssr=xs.reduce((s,x,i)=>s+(ys[i]-(a+b*x))**2,0);
    const sst=ys.reduce((s,y)=>s+(y-ybar)**2,0);
    const R2=1-ssr/sst;
    return{question:`x: ${xs.join(', ')}\ny: ${ys.join(', ')}\nFind regression line and R².`,questionLatex:`b=\\dfrac{\\sum(x-\\bar{x})(y-\\bar{y})}{\\sum(x-\\bar{x})^2},\\;R^2=1-\\dfrac{SS_{res}}{SS_{tot}}`,steps:[`x̄=${fmt(xbar,4)}, ȳ=${fmt(ybar,4)}`,`Σ(x-x̄)(y-ȳ)=${fmt(num,4)}, Σ(x-x̄)²=${fmt(denx,4)}`,`b=${fmt(b,4)}, a=${fmt(a,4)}`,`ŷ = ${fmt(a,4)} + ${fmt(b,4)}x`,`SS_res=${fmt(ssr,4)}, SS_tot=${fmt(sst,4)}`,`R² = 1-${fmt(ssr,4)}/${fmt(sst,4)} = ${fmt(R2,4)}`],answer:`ŷ=${fmt(a,4)}+${fmt(b,4)}x, R²=${fmt(R2,4)}`,answerLatex:`\\hat{y}=${fmt(a,4)}+${fmt(b,4)}x,\\;R^2=${fmt(R2,4)}`,tip:'b=Σ(x-x̄)(y-ȳ)/Σ(x-x̄)². R²=1-SS_res/SS_tot. R²=0.8 means 80% variance explained.'};
  },
  inequalities:(n)=>{
    const templates=[
      (s)=>{const k=srI(s,2,5);const bound=fmt(1/(k*k),4);return{q:`Chebyshev: P(|X-μ|≥${k}σ)≤?`,steps:[`Chebyshev: P(|X-μ|≥kσ)≤1/k²`,`k=${k}: bound = 1/${k}² = ${bound}`],ans:bound,ansL:`\\leq\\frac{1}{${k}^2}=${bound}`};},
      (s)=>{const a=srI(s,3,10);return{q:`Markov: X≥0 with E[X]=4. Bound P(X≥${a}).`,steps:[`Markov: P(X≥a)≤E[X]/a`,`P(X≥${a})≤4/${a}=${fmt(4/a,4)}`],ans:fmt(4/a,4),ansL:`P(X\\geq${a})\\leq\\frac{4}{${a}}=${fmt(4/a,4)}`};},
      (s)=>{return{q:`Jensen: f(x)=x² (convex). Is f(E[X])≤E[f(X)] or ≥?`,steps:[`f(x)=x² is convex (f''(x)=2>0)`,`Jensen for convex: f(E[X])≤E[f(X)]`,`(E[X])² ≤ E[X²] — equivalent to Var(X)≥0`],ans:`f(E[X])≤E[f(X)], i.e., (E[X])²≤E[X²]`,ansL:`f(E[X])\\leq E[f(X)]\\;(\\text{convex})`};},
      (s)=>{const n_=srI(s,4,8);const eps=srI(s+1,1,3)/10;const sig=srI(s+2,2,5);return{q:`How large must n be so Chebyshev gives P(|X̄-μ|≥${eps})≤0.05?`,steps:[`By CLT: X̄ has Var=${sig}²/n`,`Chebyshev: P(|X̄-μ|≥${eps})≤σ²/(n×${eps}²)`,`Need σ²/(n×${eps}²)≤0.05`,`n≥${sig}²/(0.05×${eps}²)=${fmt(sig**2/(0.05*eps**2),0)}`],ans:`n≥${Math.ceil(sig**2/(0.05*eps**2))}`,ansL:`n\\geq${Math.ceil(sig**2/(0.05*eps**2))}`};},
    ];
    const t=templates[n%templates.length](n*37+17);
    return{question:t.q,questionLatex:t.q,steps:t.steps,answer:t.ans,answerLatex:t.ansL,tip:"Chebyshev is weak but universal. Jensen: convex → inequality one way, concave → other."};
  },
  estimation:(n)=>{
    const templates=[
      (s)=>{const data=genData(s,5,5,20);const xbar=mean(data);return{q:`Find MLE for μ of a Normal distribution given data: ${data.join(', ')}.`,steps:[`For Normal, MLE of μ is the sample mean`,`μ̂_MLE = x̄ = Σxᵢ/n = ${data.reduce((a,b)=>a+b,0)}/${data.length} = ${fmt(xbar,4)}`],ans:fmt(xbar,4),ansL:`\\hat{\\mu}_{MLE}=\\bar{x}=${fmt(xbar,4)}`};},
      (s)=>{const n_=srI(s,30,100),k=srI(s+1,10,n_-5);const phat=k/n_;return{q:`Binomial: ${k} successes in ${n_} trials. Find MLE of p.`,steps:[`L(p) = C(${n_},${k})p^${k}(1-p)^${n_-k}`,`Log-likelihood: ℓ=k·log p+(n-k)·log(1-p)`,`dℓ/dp=0: ${k}/p=${n_-k}/(1-p) → p̂=${k}/${n_}=${fmt(phat,4)}`],ans:fmt(phat,4),ansL:`\\hat{p}_{MLE}=\\frac{${k}}{${n_}}=${fmt(phat,4)}`};},
      (s)=>{const data=genData(s,6,5,30);const m=mean(data);const v=variance(data);return{q:`Method of Moments: find μ and σ² estimators from data ${data.join(', ')}.`,steps:[`1st moment: E[X]=μ → μ̂=x̄=${fmt(m,4)}`,`2nd central moment: E[(X-μ)²]=σ² → σ̂²=${fmt(v,4)}`],ans:`μ̂=${fmt(m,4)}, σ̂²=${fmt(v,4)}`,ansL:`\\hat{\\mu}=${fmt(m,4)},\\;\\hat{\\sigma}^2=${fmt(v,4)}`};},
    ];
    const t=templates[n%templates.length](n*41+19);
    return{question:t.q,questionLatex:t.q,steps:t.steps,answer:t.ans,answerLatex:t.ansL,tip:'MLE: differentiate log-likelihood, set to 0. MOM: equate sample to theoretical moments.'};
  },
  nonparametric:(n)=>{
    const n1=srI(n,4,7),n2=srI(n+1,4,7);
    const g1=Array.from({length:n1},(_,i)=>srI(n+i*7,5,20)).sort((a,b)=>a-b);
    const g2=Array.from({length:n2},(_,i)=>srI(n+i*11+30,10,30)).sort((a,b)=>a-b);
    const all=[...g1.map(v=>({v,g:1})),...g2.map(v=>({v,g:2}))].sort((a,b)=>a.v-b.v);
    all.forEach((x,i)=>x.rank=i+1);
    const R1=all.filter(x=>x.g===1).reduce((s,x)=>s+x.rank,0);
    const U1=n1*n2+n1*(n1+1)/2-R1;
    const U2=n1*n2-U1;
    const U=Math.min(U1,U2);
    return{question:`Mann-Whitney test: Group1=${g1.join(',')}, Group2=${g2.join(',')}. Find U statistic.`,questionLatex:`U=n_1n_2+\\dfrac{n_1(n_1+1)}{2}-R_1`,steps:[`Rank all ${n1+n2} values together`,`Ranks for Group 1: R₁=${R1}`,`U₁ = ${n1}×${n2}+${n1}(${n1}+1)/2-${R1} = ${U1}`,`U₂ = ${n1*n2}-${U1} = ${U2}`,`U = min(U₁,U₂) = ${U}`],answer:`U = ${U}`,answerLatex:`U=${U}`,tip:'Mann-Whitney: compare ranks of two independent groups. Equivalent to Wilcoxon rank-sum.'};
  },
  joint_dist:(n)=>{
    const templates=[
      (s)=>{const rho=srI(s,-4,4)/5;const sigX=srI(s+1,2,6),sigY=srI(s+2,2,6);const cov=rho*sigX*sigY;return{q:`σ_X=${sigX}, σ_Y=${sigY}, ρ=${fmt(rho,1)}. Find Cov(X,Y).`,steps:[`ρ=Cov(X,Y)/(σ_X·σ_Y)`,`Cov(X,Y)=ρ·σ_X·σ_Y=${fmt(rho,1)}×${sigX}×${sigY}=${fmt(cov,4)}`],ans:fmt(cov,4),ansL:`\\text{Cov}(X,Y)=${fmt(cov,4)}`};},
      (s)=>{const mu1=srI(s,2,5),mu2=srI(s+1,3,8);const a=srI(s+2,1,3),b=srI(s+3,1,3);const s12=srI(s+4,1,3);return{q:`E[X]=${mu1}, E[Y]=${mu2}, Cov(X,Y)=${s12}. Find E[${a}X+${b}Y] and Var(${a}X+${b}Y) if Var(X)=${srI(s+5,4,16)}, Var(Y)=${srI(s+6,4,16)}.`,steps:[`E[aX+bY]=aE[X]+bE[Y]=${a}×${mu1}+${b}×${mu2}=${a*mu1+b*mu2}`,`Var(aX+bY)=a²Var(X)+b²Var(Y)+2ab·Cov(X,Y)`],ans:`E=${a*mu1+b*mu2}, Var=a²V(X)+b²V(Y)+2ab·Cov`,ansL:`E[${a}X+${b}Y]=${a*mu1+b*mu2}`};},
      (s)=>{return{q:`If X and Y are independent, what is Cov(X,Y)?`,steps:[`Independence: E[XY]=E[X]·E[Y]`,`Cov(X,Y)=E[XY]-E[X]E[Y]=0`],ans:`Cov(X,Y)=0`,ansL:`\\text{Cov}(X,Y)=0`};},
    ];
    const t=templates[n%templates.length](n*43+23);
    return{question:t.q,questionLatex:t.q,steps:t.steps,answer:t.ans,answerLatex:t.ansL,tip:'Cov=ρσ_Xσ_Y. Independent → Cov=0 but Cov=0 does NOT imply independence (except bivariate normal).'};
  },
};

// ── Quiz Generators (tough MCQ) ────────────────────────────────
const QUIZ_GENERATORS = {
  central_tendency:(n)=>{
    const t=[
      (s)=>{const data=genData(s,5,10,40);const m=mean(data);const wrong=[fmt(m+1,2),fmt(m-1,2),fmt(m*1.1,2)];return{q:`Mean of ${data.join(', ')} = ?`,opts:shuffle([fmt(m,2),...wrong],s),correct:fmt(m,2)};},
      (s)=>{const data=genData(s,7,5,35).sort((a,b)=>a-b);const med=data[3];return{q:`Median of sorted data: ${data.join(', ')} = ?`,opts:shuffle([med,data[2],data[4],Math.round(mean(data))],s),correct:med};},
      (s)=>{return{q:`In a moderately skewed distribution, which relation holds?`,opts:shuffle(['Mean-Mode≈3(Mean-Median)','Mean=Median=Mode','Mode-Mean=3σ','Median=Mean+Mode'],s),correct:'Mean-Mode≈3(Mean-Median)'};},
      (s)=>{const data=genData(s,6,10,50);const m=mean(data);const A=Math.round(m/5)*5;const di=data.map(x=>x-A);const sumdi=di.reduce((a,b)=>a+b,0);return{q:`Assumed mean A=${A}, Σdᵢ=${sumdi}, n=${data.length}. x̄=?`,opts:shuffle([fmt(A+sumdi/data.length,2),fmt(A,2),fmt(sumdi/data.length,2),fmt(A+sumdi,2)],s),correct:fmt(A+sumdi/data.length,2)};},
    ];
    const q=t[n%t.length](n*31+7);
    return{...q,tip:'x̄=A+Σdᵢ/n. Median: middle value of sorted data.'};
  },
  dispersion:(n)=>{
    const t=[
      (s)=>{const data=genData(s,6,10,50);const v=variance(data);return{q:`σ² for ${data.join(', ')} ≈ ?`,opts:shuffle([fmt(v,2),fmt(v+5,2),fmt(v-3,2),fmt(Math.sqrt(v),2)],s),correct:fmt(v,2)};},
      (s)=>{const mu=srI(s,30,60),sig=srI(s+1,5,15);const cv=sig/mu*100;return{q:`μ=${mu}, σ=${sig}. CV = ?`,opts:shuffle([fmt(cv,2)+'%',fmt(sig*mu,0)+'',fmt(sig/mu,4),''+mu/sig+'%'],s),correct:fmt(cv,2)+'%'};},
      (s)=>{return{q:`Which measure of dispersion is unitless?`,opts:shuffle(['Coefficient of Variation','Standard Deviation','Variance','Range'],s),correct:'Coefficient of Variation'};},
      (s)=>{const data=genData(s,5,10,30);const rng=Math.max(...data)-Math.min(...data);return{q:`Range of ${data.join(', ')} = ?`,opts:shuffle([rng,rng+2,rng-1,Math.round(sd(data))],s),correct:rng};},
    ];
    const q=t[n%t.length](n*37+11);
    return{...q,tip:'CV=σ/μ×100%. Range=max-min. σ=√variance.'};
  },
  data_rep:(n)=>{
    const t=[
      (s)=>{return{q:`In a histogram (equal class widths), the height of each bar represents?`,opts:shuffle(['Frequency','Cumulative frequency','Frequency density','Class width'],s),correct:'Frequency'};},
      (s)=>{const freqs=[4,8,12,6,3];const N=freqs.reduce((a,b)=>a+b,0);const cf=freqs.reduce((arr,f)=>[...arr,(arr[arr.length-1]||0)+f],[]);return{q:`CFs: ${cf.join(', ')}. Which class contains the median?`,opts:shuffle([3,2,4,1],s),correct:cf.findIndex(c=>c>=N/2)+1};},
      (s)=>{const f=srI(s,5,15);const total=srI(s+1,40,80);const angle=Math.round(f/total*360);return{q:`In a pie chart, frequency=${f}, total=${total}. Sector angle=?`,opts:shuffle([angle,angle+10,Math.round(f/total*180),Math.round(total/f*360)],s),correct:angle};},
      (s)=>{return{q:`An ogive is a plot of?`,opts:shuffle(['Cumulative frequency vs class boundary','Frequency vs class midpoint','Frequency density vs width','Frequency vs class number'],s),correct:'Cumulative frequency vs class boundary'};},
    ];
    const q=t[n%t.length](n*41+13);
    return{...q,tip:'Ogive: cumulative frequency curve. Read median at N/2. Pie angle = f/N×360°.'};
  },
  correlation:(n)=>{
    const t=[
      (s)=>{const r=srI(s,-9,9)/10;return{q:`Pearson's r=${fmt(r,1)}. Coefficient of determination R²=?`,opts:shuffle([fmt(r*r,2),fmt(Math.abs(r),2),fmt(r,2),fmt(1-r*r,2)],s),correct:fmt(r*r,2)};},
      (s)=>{return{q:`Spearman's rₛ uses which type of data?`,opts:shuffle(['Ranks/ordinal data','Only interval data','Categorical data','Normally distributed data'],s),correct:'Ranks/ordinal data'};},
      (s)=>{const n_=srI(s,4,7);const di2=srI(s+1,4,20);const rs=1-6*di2/(n_*(n_*n_-1));return{q:`n=${n_}, Σd²=${di2}. Spearman rₛ=?`,opts:shuffle([fmt(rs,4),fmt(1-rs,4),fmt(rs*rs,4),fmt(6*di2/(n_*(n_*n_-1)),4)],s),correct:fmt(rs,4)};},
      (s)=>{return{q:`r=0 implies?`,opts:shuffle(['No LINEAR correlation (may have non-linear)','No correlation of any kind','Variables are independent','Regression slope=0'],s),correct:'No LINEAR correlation (may have non-linear)'};},
    ];
    const q=t[n%t.length](n*43+17);
    return{...q,tip:'R²=r². rₛ=1-6Σd²/n(n²-1). r=0 means no LINEAR correlation, not independence.'};
  },
  moments:(n)=>{
    const t=[
      (s)=>{return{q:`For a normal distribution, β₂ (kurtosis) = ?`,opts:shuffle(['3','0','1','depends on σ'],s),correct:'3'};},
      (s)=>{return{q:`Right-skewed distribution: which ordering is correct?`,opts:shuffle(['Mode<Median<Mean','Mean<Median<Mode','Mode=Median=Mean','Median<Mode<Mean'],s),correct:'Mode<Median<Mean'};},
      (s)=>{const mu2=srI(s,4,16),mu3=srI(s+1,2,8);const beta1=mu3**2/mu2**3;return{q:`μ₂=${mu2}, μ₃=${mu3}. β₁=μ₃²/μ₂³=?`,opts:shuffle([fmt(beta1,4),fmt(mu3/mu2,4),fmt(mu2/mu3,4),fmt(mu3**2/mu2**2,4)],s),correct:fmt(beta1,4)};},
      (s)=>{return{q:`Leptokurtic distribution has β₂?`,opts:shuffle(['>3 (heavier tails than normal)','<3','=3','=0'],s),correct:'>3 (heavier tails than normal)'};},
    ];
    const q=t[n%t.length](n*47+19);
    return{...q,tip:'Normal: β₂=3. Leptokurtic β₂>3 (peaked). Right skew: mean>median>mode.'};
  },
  distributions:(n)=>{
    const t=[
      (s)=>{const mu=srI(s,40,70),sig=srI(s+1,5,15),x=mu+sig;const z=1;return{q:`X~N(${mu},${sig}²). P(X≤${x})=Φ(z). z=?`,opts:shuffle(['1','2',fmt((x-mu)/sig,2),'0.5'],s),correct:'1'};},
      (s)=>{const lam=srI(s,2,6);return{q:`X~Poi(${lam}). E[X] and Var(X)=?`,opts:shuffle([`Both = ${lam}`,`E=${lam}, Var=${lam**2}`,`E=${lam**2}, Var=${lam}`,`E=1/${lam}, Var=${lam}`],s),correct:`Both = ${lam}`};},
      (s)=>{return{q:`68-95-99.7 rule: P(μ-2σ < X < μ+2σ) ≈ ?`,opts:shuffle(['95%','68%','99.7%','50%'],s),correct:'95%'};},
      (s)=>{const mu=srI(s,30,60),sig=srI(s+1,5,15);const z=srI(s+2,1,2);const x=mu+z*sig;return{q:`X~N(${mu},${sig}²). Z=(X-${mu})/${sig}. If X=${x}, Z=?`,opts:shuffle([z,z+1,z-1,fmt((x-mu)/sig+0.5,2)],s),correct:z};},
    ];
    const q=t[n%t.length](n*53+23);
    return{...q,tip:'Normal: Z=(X-μ)/σ. Poisson: E=Var=λ. 68-95-99.7 rule for 1,2,3 sigma.'};
  },
  sampling:(n)=>{
    const t=[
      (s)=>{const sig=srI(s,8,20),nv=srI(s+1,25,100);const se=sig/Math.sqrt(nv);return{q:`σ=${sig}, n=${nv}. Standard Error=?`,opts:shuffle([fmt(se,4),fmt(sig*Math.sqrt(nv),4),fmt(sig**2/nv,4),fmt(sig/nv,4)],s),correct:fmt(se,4)};},
      (s)=>{return{q:`CLT states that for large n, X̄ ~ ?`,opts:shuffle(['N(μ, σ²/n)','N(0,1)','N(μ,σ²)','t(n-1)'],s),correct:'N(μ, σ²/n)'};},
      (s)=>{const mu=srI(s,40,70),se=srI(s+1,2,6);const lo=mu-1.96*se,hi=mu+1.96*se;return{q:`x̄=${mu}, SE=${se}. 95% CI=?`,opts:shuffle([`(${fmt(lo,2)},${fmt(hi,2)})`,`(${mu-se},${mu+se})`,`(${fmt(mu-2.576*se,2)},${fmt(mu+2.576*se,2)})`,`(${mu-2*se},${mu+2*se})`],s),correct:`(${fmt(lo,2)},${fmt(hi,2)})`};},
      (s)=>{return{q:`Which n is generally sufficient for CLT to apply?`,opts:shuffle(['n≥30','n≥5','n≥100','n≥10'],s),correct:'n≥30'};},
    ];
    const q=t[n%t.length](n*59+29);
    return{...q,tip:'SE=σ/√n. 95% CI: x̄±1.96·SE. CLT needs n≥30 typically.'};
  },
  hypothesis:(n)=>{
    const t=[
      (s)=>{return{q:`Type I error is?`,opts:shuffle(['Rejecting a true H₀','Accepting a false H₀','Rejecting a false H₀','Accepting a true H₀'],s),correct:'Rejecting a true H₀'};},
      (s)=>{const mu0=50,sig=10,n_=100,xbar=52;const z=(xbar-mu0)/(sig/Math.sqrt(n_));return{q:`H₀:μ=${mu0}, x̄=${xbar}, σ=${sig}, n=${n_}. Z=?`,opts:shuffle([fmt(z,2),fmt(z*2,2),fmt((xbar-mu0)/sig,2),fmt(z/2,2)],s),correct:fmt(z,2)};},
      (s)=>{return{q:`p-value<α means?`,opts:shuffle(['Reject H₀ (result is statistically significant)','Accept H₀','Accept H₁ definitely','Increase sample size'],s),correct:'Reject H₀ (result is statistically significant)'};},
      (s)=>{return{q:`Power of a test = ?`,opts:shuffle(['P(reject H₀ | H₁ true) = 1-β','P(reject H₀ | H₀ true) = α','1-α','P(fail to reject | H₁ true)'],s),correct:'P(reject H₀ | H₁ true) = 1-β'};},
    ];
    const q=t[n%t.length](n*61+31);
    return{...q,tip:'Type I: α=P(reject true H₀). Type II: β=P(fail to reject false H₀). Power=1-β.'};
  },
  chi_anova:(n)=>{
    const t=[
      (s)=>{const r=srI(s,2,4),c=srI(s+1,2,4);const df=(r-1)*(c-1);return{q:`Contingency table ${r}×${c}. df for chi-square=?`,opts:shuffle([df,df+1,df-1,r*c-1],s),correct:df};},
      (s)=>{return{q:`Chi-square test: expected E=row×col/N. Under H₀ (independence)?`,opts:shuffle(['E=R×C/N','E=observed','E=row+col','E=N/(R×C)'],s),correct:'E=R×C/N'};},
      (s)=>{const k=srI(s,3,6),N=srI(s+1,50,200);const dfB=k-1,dfW=N-k;return{q:`ANOVA: k=${k} groups, N=${N} total. df_Between=?, df_Within=?`,opts:shuffle([`${dfB} and ${dfW}`,`${k} and ${N-1}`,`${dfB} and ${N-1}`,`${k-2} and ${N-k}`],s),correct:`${dfB} and ${dfW}`};},
      (s)=>{return{q:`ANOVA tests?`,opts:shuffle(['Equality of means across k groups','Equality of two variances','Independence of categorical variables','Normality of data'],s),correct:'Equality of means across k groups'};},
    ];
    const q=t[n%t.length](n*67+37);
    return{...q,tip:'Chi-square df=(r-1)(c-1). ANOVA: F=MS_B/MS_W, df_B=k-1, df_W=N-k.'};
  },
  regression:(n)=>{
    const t=[
      (s)=>{const r=srI(s,2,9)/10;const R2=r*r;return{q:`r=${fmt(r,2)}. What is R²?`,opts:shuffle([fmt(R2,4),fmt(r,2),fmt(1-R2,4),fmt(2*r,2)],s),correct:fmt(R2,4)};},
      (s)=>{return{q:`In OLS regression, residuals are minimised by?`,opts:shuffle(['Minimising Σeᵢ²','Minimising Σ|eᵢ|','Minimising Σeᵢ','Maximising R²'],s),correct:'Minimising Σeᵢ²'};},
      (s)=>{const xbar=srI(s,10,30),ybar=srI(s+1,20,50),b=srI(s+2,1,4)/2;const a=ybar-b*xbar;return{q:`b=${fmt(b,2)}, x̄=${xbar}, ȳ=${ybar}. Intercept a=?`,opts:shuffle([fmt(a,2),fmt(ybar+b*xbar,2),fmt(ybar*b,2),fmt(b*xbar,2)],s),correct:fmt(a,2)};},
      (s)=>{return{q:`R²=0.85 means?`,opts:shuffle(['85% of variance in y explained by x','r=0.85','15% explained','85% of data on the line'],s),correct:'85% of variance in y explained by x'};},
    ];
    const q=t[n%t.length](n*71+41);
    return{...q,tip:'a=ȳ-bx̄. R²=1-SS_res/SS_tot. R²=0.85: 85% of variance explained.'};
  },
  inequalities:(n)=>{
    const t=[
      (s)=>{const k=srI(s,2,5);return{q:`Chebyshev: P(|X-μ|≥${k}σ)≤?`,opts:shuffle([`1/${k}²=`+fmt(1/k**2,4),`1/${k}`,`${k}/n`,`σ/${k}`],s),correct:`1/${k}²=`+fmt(1/k**2,4)};},
      (s)=>{return{q:`Jensen's inequality for CONVEX f states?`,opts:shuffle(['f(E[X])≤E[f(X)]','f(E[X])≥E[f(X)]','f(E[X])=E[f(X)]','f(E[X])=0'],s),correct:'f(E[X])≤E[f(X)]'};},
      (s)=>{const a=srI(s,5,15),ex=srI(s+1,2,4);return{q:`X≥0, E[X]=${ex}. Markov: P(X≥${a})≤?`,opts:shuffle([fmt(ex/a,4),fmt(a/ex,4),fmt(ex*a,4),fmt(1/a,4)],s),correct:fmt(ex/a,4)};},
      (s)=>{return{q:`Cauchy-Schwarz: (Σaᵢbᵢ)² ≤ ?`,opts:shuffle(['(Σaᵢ²)(Σbᵢ²)','(Σaᵢ+Σbᵢ)²','Σaᵢ²+Σbᵢ²','(Σaᵢbᵢ)²'],s),correct:'(Σaᵢ²)(Σbᵢ²)'};},
    ];
    const q=t[n%t.length](n*73+43);
    return{...q,tip:"Chebyshev:≤1/k². Jensen convex: f(E[X])≤E[f(X)]. Markov: P(X≥a)≤E[X]/a."};
  },
  estimation:(n)=>{
    const t=[
      (s)=>{return{q:`MLE for μ of a Normal distribution is?`,opts:shuffle(['Sample mean x̄','Sample median','Sample mode','n×x̄'],s),correct:'Sample mean x̄'};},
      (s)=>{const n_=srI(s,20,80),k=srI(s+1,5,n_-2);return{q:`Binomial: ${k} successes, ${n_} trials. MLE of p=?`,opts:shuffle([fmt(k/n_,4),fmt(k/(n_-1),4),fmt((k+1)/n_,4),fmt(k/n_+0.1,4)],s),correct:fmt(k/n_,4)};},
      (s)=>{return{q:`MLE of σ² for Normal (n obs) is biased because it uses?`,opts:shuffle(['n in denominator (not n-1)','n-1 in denominator','n+1 in denominator','The wrong formula for x̄'],s),correct:'n in denominator (not n-1)'};},
      (s)=>{return{q:`Method of Moments equates?`,opts:shuffle(['Sample moments to theoretical moments','Likelihood to 0','Sample mean to 0','Variance to 1'],s),correct:'Sample moments to theoretical moments'};},
    ];
    const q=t[n%t.length](n*79+47);
    return{...q,tip:'MLE Normal: μ̂=x̄, σ̂²=Σ(x-x̄)²/n (biased). Unbiased: use n-1.'};
  },
  nonparametric:(n)=>{
    const t=[
      (s)=>{return{q:`Non-parametric tests are used when?`,opts:shuffle(['Normality cannot be assumed','Data is always normal','Sample size is very large','Variance is known'],s),correct:'Normality cannot be assumed'};},
      (s)=>{return{q:`Wilcoxon signed-rank test is the non-parametric alternative to?`,opts:shuffle(['One-sample or paired t-test','Two-sample t-test','One-way ANOVA','Chi-square test'],s),correct:'One-sample or paired t-test'};},
      (s)=>{return{q:`Kruskal-Wallis test compares?`,opts:shuffle(['Medians of k≥3 independent groups','Means of two groups','Variances of k groups','Single population median to a constant'],s),correct:'Medians of k≥3 independent groups'};},
      (s)=>{return{q:`Mann-Whitney U test works on?`,opts:shuffle(['Ranks of combined sample','Raw difference of means','Sum of squared deviations','Normal scores'],s),correct:'Ranks of combined sample'};},
    ];
    const q=t[n%t.length](n*83+53);
    return{...q,tip:'Wilcoxon→t-test alt. Mann-Whitney→2-sample t alt. Kruskal-Wallis→ANOVA alt.'};
  },
  joint_dist:(n)=>{
    const t=[
      (s)=>{const rho=srI(s,-4,4)/5,sx=srI(s+1,2,5),sy=srI(s+2,2,5);const cov=rho*sx*sy;return{q:`ρ=${fmt(rho,1)}, σ_X=${sx}, σ_Y=${sy}. Cov(X,Y)=?`,opts:shuffle([fmt(cov,4),fmt(rho/sx/sy,4),fmt(rho*sx,4),fmt(cov+1,4)],s),correct:fmt(cov,4)};},
      (s)=>{return{q:`X,Y independent implies Cov(X,Y)=?`,opts:shuffle(['0','1','-1','undefined'],s),correct:'0'};},
      (s)=>{return{q:`Marginal PDF f_X(x) is obtained from joint f(x,y) by?`,opts:shuffle(['Integrating over all y','Integrating over all x','Differentiating w.r.t. y','Setting y=0'],s),correct:'Integrating over all y'};},
      (s)=>{return{q:`For bivariate Normal, ρ=0 implies?`,opts:shuffle(['X and Y are independent','X and Y are correlated','Var(X)=Var(Y)','Both have mean 0'],s),correct:'X and Y are independent'};},
    ];
    const q=t[n%t.length](n*89+59);
    return{...q,tip:'Cov=ρσ_Xσ_Y. Marginal: integrate joint. Bivariate normal: ρ=0 ↔ independence.'};
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
      body{background:#0c0a06;}
      ::-webkit-scrollbar{width:5px;}
      ::-webkit-scrollbar-track{background:#0c0a06;}
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
    const ts = [300,900,1600].map((d,i) => setTimeout(() => setPhase(i+1), d));
    return () => ts.forEach(clearTimeout);
  }, []);
  const floaters = ['x̄','σ²','r','H₀','CLT','R²','β₂','MLE'];
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', background:`radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.09) 0%, transparent 65%), #0c0a06`, textAlign:'center' }}>
      {floaters.map((s,i) => (
        <div key={s} style={{ position:'fixed', pointerEvents:'none', fontSize:14+(i%3)*7, color:`rgba(245,158,11,${0.04+(i%4)*0.02})`, top:`${8+i*11}%`, left:i%2===0?`${2+i*4}%`:`${74+i*2}%`, fontFamily:'JetBrains Mono,monospace', animation:`pulse ${3+i*0.6}s ease-in-out infinite`, animationDelay:`${i*0.25}s` }}>{s}</div>
      ))}
      <div style={{ opacity:phase>=1?1:0, transform:phase>=1?'translateY(0)':'translateY(12px)', transition:'all 0.6s ease', marginBottom:20, display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:40 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:ACCENT, animation:'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize:12, color:ACCENT, letterSpacing:'2px', textTransform:'uppercase', fontFamily:'Crimson Pro, serif' }}>Mathematics · Chapter 6</span>
      </div>
      <div style={{ opacity:phase>=2?1:0, transform:phase>=2?'translateY(0)':'translateY(20px)', transition:'all 0.7s ease 0.1s', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:'clamp(40px,10vw,88px)', color:'#fff', letterSpacing:'-3px', lineHeight:0.92, marginBottom:0 }}>
          Statis<span style={{ color:ACCENT }}>tics</span>
        </h1>
        <div style={{ height:3, width:80, background:`linear-gradient(90deg, ${ACCENT}, transparent)`, margin:'16px auto 0', borderRadius:2 }} />
      </div>
      <div style={{ opacity:phase>=3?1:0, transition:'all 0.6s ease', maxWidth:560, marginBottom:40 }}>
        <p style={{ fontFamily:'Crimson Pro, serif', fontSize:19, color:'rgba(255,255,255,0.7)', lineHeight:1.55, marginBottom:18, fontStyle:'italic' }}>
          "Statistics is the grammar of science — the discipline of learning from data and making decisions under uncertainty."
        </p>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 24px', textAlign:'left' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:12, fontFamily:'JetBrains Mono, monospace' }}>Chapter Overview</div>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>
            From descriptive statistics (mean, median, standard deviation, correlation, regression) through inferential statistics (hypothesis testing, chi-square, ANOVA, CLT) to Olympiad-level topics: statistical inequalities, MLE, non-parametric methods, and joint distributions.
          </p>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:20 }}>
          {['Class 11 → Research Level','14 Topics','∞ Practice','Quiz-Gated Progress'].map(t => (
            <span key={t} style={{ padding:'4px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, fontSize:12, color:'rgba(255,255,255,0.5)', fontFamily:'Crimson Pro, serif' }}>{t}</span>
          ))}
        </div>
      </div>
      {phase >= 3 && (
        <button onClick={onNext} className="btn" style={{ padding:'16px 48px', background:ACCENT, color:'#0c0a06', border:'none', borderRadius:50, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, letterSpacing:'-0.3px', boxShadow:`0 8px 30px ${ACCENT}55`, animation:'fadeUp 0.5s ease both' }}>
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
    { title:'Descriptive Statistics', color:ACCENT, rows:NOTATION.slice(0,6) },
    { title:'Correlation & Regression', color:'#D97706', rows:NOTATION.slice(6,11) },
    { title:'Inferential Statistics', color:'#EF4444', rows:NOTATION.slice(11,17) },
    { title:'Advanced & Olympiad', color:'#7C3AED', rows:NOTATION.slice(17) },
  ];
  return (
    <div style={{ minHeight:'100vh', background:'#0c0a06', padding:'32px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:32, opacity:revealed?1:0, transition:'opacity 0.5s ease' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Before We Begin</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:34, color:'#fff', letterSpacing:'-1px', marginBottom:10 }}>Notation Guide</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>These symbols form the language of statistics — from descriptive measures to advanced inference.</p>
        </div>
        {groups.map((g, gi) => (
          <div key={g.title} style={{ marginBottom:24, opacity:revealed?1:0, transform:revealed?'translateY(0)':'translateY(16px)', transition:`all 0.5s ease ${gi*0.1+0.2}s` }}>
            <div style={{ fontSize:11, color:g.color, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:20, height:2, background:g.color, borderRadius:1 }} />
              {g.title}
            </div>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
              {g.rows.map((row,ri) => (
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
          <p style={{ fontFamily:'Crimson Pro,serif', fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>When you click <strong style={{color:'#fff'}}>Done</strong> on any topic, you face <strong style={{color:ACCENT}}>4 tough questions</strong>. Answer all 4 correctly to unlock the next topic.</p>
        </div>
        <button onClick={onNext} className="btn" style={{ width:'100%', padding:'16px', background:ACCENT, color:'#0c0a06', border:'none', borderRadius:12, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${ACCENT}44` }}>
          Start Learning Statistics →
        </button>
      </div>
    </div>
  );
}

// ── Section Menu ───────────────────────────────────────────────
function SectionMenuScreen({ onSelect, completedIds }) {
  const levels = ['Foundation','Competitive','Olympiad'];
  const lColors = { Foundation:'#F59E0B', Competitive:'#EF4444', Olympiad:'#7C3AED' };
  const lDesc = { Foundation:'Class 11–12 · Descriptive Statistics', Competitive:'JEE · Inference & Distributions', Olympiad:'Research · Advanced Theory' };
  return (
    <div style={{ minHeight:'100vh', background:'#0c0a06', padding:'28px 16px 60px' }}>
      <div style={{ maxWidth:660, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>Chapter · Statistics</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:30, color:'#fff', letterSpacing:'-0.8px', marginBottom:6 }}>Choose a Topic</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:15, color:'rgba(255,255,255,0.4)', marginBottom:14 }}>Pass the quiz gate to unlock each next topic.</p>
          <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(completedIds.size/SECTIONS.length)*100}%`, background:`linear-gradient(90deg,${ACCENT},#EF4444)`, borderRadius:4, transition:'width 0.5s ease' }} />
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

// ── Learn Screen ───────────────────────────────────────────────
function SectionLearnScreen({ section, onPractice, onBack }) {
  const [tab, setTab] = useState('learn');
  const lColors = { Foundation:'#F59E0B', Competitive:'#EF4444', Olympiad:'#7C3AED' };
  const col = lColors[section.level] || ACCENT;
  const barData = section.id==='central_tendency'?[{l:'10-20',v:5},{l:'20-30',v:9},{l:'30-40',v:12},{l:'40-50',v:8},{l:'50-60',v:4}]:null;
  const boxData = section.id==='dispersion'?genData(42,12,10,60):null;
  const scatterPts = section.id==='correlation'?Array.from({length:10},(_,i)=>[i*2+srI(i*7,0,4),i*3+srI(i*11,0,6)]):null;
  return (
    <div style={{ minHeight:'100vh', background:'#0c0a06', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(12,10,6,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>← Topics</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:15, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{section.title}</div>
          <div style={{ fontSize:11, color:col, fontFamily:'JetBrains Mono,monospace' }}>{section.level}</div>
        </div>
      </div>
      <div style={{ maxWidth:660, margin:'0 auto', padding:'24px 16px' }}>
        <div style={{ display:'flex', gap:4, marginBottom:24, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4 }}>
          {['learn','keys'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn" style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:tab===t?col:'transparent', color:tab===t?'#0c0a06':'rgba(255,255,255,0.5)', fontFamily:'Crimson Pro, serif', fontWeight:600, fontSize:14 }}>
              {t==='learn'?'📖 Explanation':'🔑 Key Facts'}
            </button>
          ))}
        </div>
        {tab==='learn' && (
          <div className="fade-in">
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:22 }}>
              <div style={{ width:56, height:56, borderRadius:14, background:`${col}15`, border:`1px solid ${col}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:col, fontFamily:'JetBrains Mono,monospace', flexShrink:0, letterSpacing:'-1px' }}>{section.icon}</div>
              <p style={{ fontFamily:'Playfair Display, serif', fontSize:18, color:'#fff', fontStyle:'italic', lineHeight:1.5 }}>"{section.shortDef}"</p>
            </div>
            {barData&&<div style={{ marginBottom:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}><BarChartSVG data={barData} color={col} size={300} title="Frequency Distribution Example" /></div>}
            {boxData&&<div style={{ marginBottom:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}><BoxPlotSVG data={boxData} color={col} size={300} /></div>}
            {section.diagram==='normal'&&<div style={{ marginBottom:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}><NormalCurveSVG color={col} size={300} /></div>}
            {scatterPts&&<div style={{ marginBottom:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}><ScatterSVG pts={scatterPts} color={col} size={260} /></div>}
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
          <button onClick={onPractice} className="btn" style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#0c0a06', border:'none', borderRadius:12, fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${col}44` }}>
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
  const [baseSeed] = useState(() => Math.floor(Math.random()*9999));
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [count, setCount] = useState(0);
  const lColors = { Foundation:'#F59E0B', Competitive:'#EF4444', Olympiad:'#7C3AED' };
  const col = lColors[section.level] || ACCENT;
  const gen = GENERATORS[section.genKey] || GENERATORS.central_tendency;
  const seed = baseSeed + qIdx*97;
  const question = useCallback(()=>{ try{ return gen(seed); } catch{ return {question:'Loading…',steps:[],answer:'—',answerLatex:'—',tip:''}; } },[seed])();
  const next = () => { setQIdx(i=>i+1); setShowAnswer(false); setShowSteps(false); setCount(c=>c+1); };
  return (
    <div style={{ minHeight:'100vh', background:'#0c0a06', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(12,10,6,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
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
            {question.questionLatex&&<div style={{ background:`${col}0d`, border:`1px solid ${col}20`, borderRadius:10, padding:'12px 16px', overflowX:'auto' }}><KTex l={question.questionLatex} style={{ color:col, fontSize:15 }} /></div>}
          </div>
        </div>
        {!showAnswer&&(
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <button onClick={()=>setShowSteps(v=>!v)} className="btn" style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.7)', fontFamily:'Crimson Pro,serif', fontSize:15 }}>{showSteps?'🙈 Hide Steps':'💡 Show Steps'}</button>
            <button onClick={()=>setShowAnswer(true)} className="btn" style={{ flex:1, padding:'12px', background:`${col}20`, border:`1px solid ${col}44`, borderRadius:10, color:col, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:15 }}>Reveal ▶</button>
          </div>
        )}
        {showSteps&&!showAnswer&&(
          <div className="fade-up" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
            {question.steps.map((step,i)=>(
              <div key={i} style={{ display:'flex', gap:10, marginBottom:i<question.steps.length-1?10:0 }}>
                <span style={{ color:`${col}77`, fontSize:11, fontFamily:'JetBrains Mono,monospace', minWidth:20, paddingTop:2 }}>{i+1}.</span>
                <span style={{ fontFamily:'Crimson Pro,serif', fontSize:15, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{step}</span>
              </div>
            ))}
          </div>
        )}
        {showAnswer&&(
          <div className="fade-up">
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
              {question.steps.map((step,i)=>(
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
            {question.tip&&<div style={{ background:'rgba(255,209,102,0.06)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:10 }}><span style={{ fontSize:16, flexShrink:0 }}>💡</span><p style={{ fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:14, color:'rgba(255,209,102,0.85)', lineHeight:1.6 }}>{question.tip}</p></div>}
            <button onClick={next} className="btn" style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#0c0a06', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:17, boxShadow:`0 6px 24px ${col}40` }}>Next Question ⟶</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quiz Screen ────────────────────────────────────────────────
function QuizScreen({ section, onPass, onFail, onBack }) {
  const lColors = { Foundation:'#F59E0B', Competitive:'#EF4444', Olympiad:'#7C3AED' };
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
  const quizGen=QUIZ_GENERATORS[section.genKey]||QUIZ_GENERATORS.central_tendency;
  const qSeed=baseSeed+qIdx*113;
  const question=useCallback(()=>{
    let q; let tries=0;
    do{ try{ q=quizGen(qSeed+tries*7); }catch{ q=null; } tries++; }
    while((!q||!q.q||!q.opts||q.opts.length<2)&&tries<10);
    if(!q||!q.q) return{q:`x̄ for {10,20,30}=?`,opts:['20','15','25','30'],correct:'20',tip:'Mean=sum/n.'};
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
      <div style={{ minHeight:'100vh', background:'#0c0a06', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', textAlign:'center' }}>
        <div className="pop-in" style={{ maxWidth:420, width:'100%' }}>
          {passed?<TrophySVG col={col}/>:(
            <svg width="72" height="72" viewBox="0 0 72 72" style={{display:'block',margin:'0 auto'}}>
              <defs><radialGradient id="failGSt" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EF4444" stopOpacity="0.25"/><stop offset="100%" stopColor="#EF4444" stopOpacity="0"/></radialGradient></defs>
              <circle cx="36" cy="36" r="36" fill="url(#failGSt)"/>
              <circle cx="36" cy="36" r="28" fill="none" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.4"/>
              <text x="36" y="44" textAnchor="middle" fontSize="32" fontFamily="JetBrains Mono" fill="#EF4444">✗</text>
            </svg>
          )}
          <div style={{ marginTop:20, fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:28, color:passed?'#fff':'#EF4444', marginBottom:10 }}>{passed?'Topic Mastered! 🎯':`${score}/4 Correct`}</div>
          <div style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.55)', marginBottom:24, lineHeight:1.6 }}>{passed?`Perfect! Unlocking next topic.`:`Need all 4 correct to advance. Review and retry.`}</div>
          {results.map((r,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:r.correct?'rgba(245,158,11,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${r.correct?'rgba(245,158,11,0.2)':'rgba(239,68,68,0.2)'}`, borderRadius:8, marginBottom:6, textAlign:'left' }}>
              <span style={{fontSize:16}}>{r.correct?'✅':'❌'}</span>
              <span style={{ fontFamily:'Crimson Pro,serif', fontSize:13, color:'rgba(255,255,255,0.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Q{i+1}: {r.question.substring(0,60)}{r.question.length>60?'…':''}</span>
            </div>
          ))}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20 }}>
            {passed?(
              <button onClick={onPass} className="btn" style={{ padding:'14px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#0c0a06', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>Continue to Next Topic →</button>
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
    <div style={{ minHeight:'100vh', background:'#0c0a06', paddingBottom:60 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(12,10,6,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
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
          <span style={{fontSize:16}}>🔐</span>
          <span style={{ fontFamily:'Crimson Pro,serif', fontSize:13, color:col, fontStyle:'italic' }}>Answer all {TOTAL} correctly to unlock the next topic.</span>
        </div>
        <div key={qIdx} className="fade-up" style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${col}30`, borderRadius:16, padding:'20px 20px 24px', marginBottom:18 }}>
          <div style={{ fontSize:10, color:`${col}99`, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:12 }}>Question {qIdx+1} of {TOTAL}</div>
          <p style={{ fontFamily:'Crimson Pro,serif', fontSize:17, color:'#e2e8f0', lineHeight:1.75, marginBottom:question.questionLatex&&question.questionLatex!==question.q?14:0 }}>{question.q}</p>
          {question.questionLatex&&question.questionLatex!==question.q&&<div style={{ background:`${col}0d`, border:`1px solid ${col}20`, borderRadius:10, padding:'10px 14px', overflowX:'auto' }}><KTex l={question.questionLatex} style={{ color:col, fontSize:15 }} /></div>}
        </div>
        <div key={`opts-${shakeKey}`} style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }} className={confirmed&&String(selected)!==String(correctAnswer)?'shake':''}>
          {opts.map((opt,i)=>{
            const isSel=String(selected)===String(opt);
            const isCorr=String(opt)===String(correctAnswer);
            let bg='rgba(255,255,255,0.04)',border='1px solid rgba(255,255,255,0.1)',color='rgba(255,255,255,0.8)';
            if(confirmed){ if(isCorr){bg='rgba(245,158,11,0.12)';border='1px solid rgba(245,158,11,0.5)';color='#FCD34D';} else if(isSel&&!isCorr){bg='rgba(239,68,68,0.12)';border='1px solid rgba(239,68,68,0.5)';color='#FCA5A5';} } else if(isSel){bg=`${col}18`;border=`1px solid ${col}66`;color=col;}
            return (
              <button key={i} onClick={()=>!confirmed&&setSelected(opt)} className={!confirmed?'btn':''} disabled={confirmed}
                style={{ background:bg, border, borderRadius:12, padding:'14px 18px', textAlign:'left', color, fontFamily:'Crimson Pro,serif', fontSize:16, display:'flex', alignItems:'center', gap:12, cursor:confirmed?'default':'pointer', transition:'all 0.15s ease' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:isSel&&!confirmed?`${col}25`:confirmed&&isCorr?'rgba(245,158,11,0.2)':confirmed&&isSel?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)', border:`1px solid ${isSel&&!confirmed?col+'66':confirmed&&isCorr?'rgba(245,158,11,0.5)':confirmed&&isSel?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:'JetBrains Mono,monospace', flexShrink:0, color:isSel&&!confirmed?col:confirmed&&isCorr?'#FCD34D':confirmed&&isSel?'#FCA5A5':'rgba(255,255,255,0.4)' }}>
                  {confirmed?(isCorr?'✓':isSel?'✗':['A','B','C','D'][i]):['A','B','C','D'][i]}
                </div>
                <span>{String(opt)}</span>
              </button>
            );
          })}
        </div>
        {confirmed&&question.tip&&<div className="fade-up" style={{ background:'rgba(255,209,102,0.06)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:10 }}><span style={{fontSize:16,flexShrink:0}}>💡</span><p style={{ fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:14, color:'rgba(255,209,102,0.85)', lineHeight:1.6 }}>{question.tip}</p></div>}
        {!confirmed?(
          <button onClick={confirm} disabled={selected===null} className="btn" style={{ width:'100%', padding:'14px', background:selected!==null?`linear-gradient(135deg,${col},${col}bb)`:'rgba(255,255,255,0.06)', border:selected!==null?'none':'1px solid rgba(255,255,255,0.1)', color:selected!==null?'#0c0a06':'rgba(255,255,255,0.3)', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16, opacity:selected===null?0.6:1, cursor:selected===null?'not-allowed':'pointer' }}>Submit Answer</button>
        ):(
          <button onClick={goNext} className="btn" style={{ width:'100%', padding:'14px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#0c0a06', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>{qIdx+1<TOTAL?`Next Question (${qIdx+2}/${TOTAL}) →`:'See Results →'}</button>
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

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
const fmt = (n,d=4) => Number.isFinite(n)?+n.toFixed(d)===0?'0':n.toFixed(d):'—';
const ACCENT = '#6366F1';

function fact(n) { if(n<=1) return 1; let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function C(n,r) { if(r<0||r>n) return 0; return Math.round(fact(n)/(fact(r)*fact(n-r))); }
function gcd(a,b) { return b===0?Math.abs(a):gcd(b,a%b); }

// Pascal's triangle rows
function pascalRow(n) { const r=[1]; for(let k=1;k<=n;k++) r.push(r[k-1]*(n-k+1)/k); return r.map(Math.round); }

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

// ── Pascal's Triangle SVG ──────────────────────────────────────
function PascalSVG({ rows=6, highlight=null, color=ACCENT, size=300 }) {
  const W=size, cellW=34, cellH=36, padTop=20;
  const H = rows*cellH + padTop + 20;
  const triangle = Array.from({length:rows},(_,i)=>pascalRow(i));
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto',overflow:'visible'}}>
      {triangle.map((row,i)=>{
        const startX = W/2 - (row.length-1)*cellW/2;
        return row.map((val,j)=>{
          const x=startX+j*cellW, y=padTop+i*cellH;
          const isHL = highlight && highlight[0]===i && highlight[1]===j;
          const isEdge = j===0||j===row.length-1;
          return (
            <g key={`${i}-${j}`}>
              <circle cx={x} cy={y} r={cellW*0.42}
                fill={isHL?color:isEdge?`${color}25`:`${color}10`}
                stroke={isHL?color:`${color}${isEdge?'55':'33'}`}
                strokeWidth={isHL?2:1}/>
              <text x={x} y={y+4} textAnchor="middle"
                fill={isHL?'#070a12':isEdge?color:'rgba(255,255,255,0.7)'}
                fontSize={val>99?9:val>9?11:13}
                fontFamily="JetBrains Mono,monospace"
                fontWeight={isHL?'bold':'normal'}>
                {val}
              </text>
              {/* connecting lines to children */}
              {i<rows-1 && j<row.length-1 && (
                <>
                  <line x1={x} y1={y+cellW*0.44} x2={x+cellW/2*(1)} y2={y+cellH-cellW*0.44}
                    stroke={`${color}22`} strokeWidth={1}/>
                  <line x1={x} y1={y+cellW*0.44} x2={x-cellW/2} y2={y+cellH-cellW*0.44}
                    stroke={`${color}22`} strokeWidth={1}/>
                </>
              )}
            </g>
          );
        });
      })}
      {/* Row labels */}
      {triangle.map((_,i)=>(
        <text key={`r${i}`} x={W/2-(i)*cellW/2-22} y={padTop+i*cellH+4}
          fill={`${color}44`} fontSize={9} fontFamily="JetBrains Mono,monospace"
          textAnchor="end">n={i}</text>
      ))}
    </svg>
  );
}

// ── Binomial Expansion Visual ──────────────────────────────────
function ExpansionSVG({ n=4, color=ACCENT, size=300 }) {
  const W=size, H=60;
  const row = pascalRow(n);
  const cellW = Math.min(48, (W-20)/row.length);
  const startX = (W - row.length*cellW)/2 + cellW/2;
  return (
    <svg width={W} height={H} style={{display:'block',margin:'0 auto'}}>
      {row.map((c,r)=>{
        const x = startX + r*cellW;
        const power_a = n-r, power_b = r;
        return (
          <g key={r}>
            <rect x={x-cellW/2+2} y={6} width={cellW-4} height={48} rx={8}
              fill={`${color}15`} stroke={`${color}40`} strokeWidth={1}/>
            <text x={x} y={22} textAnchor="middle" fill={color}
              fontSize={11} fontFamily="JetBrains Mono,monospace" fontWeight="600">{c}</text>
            <text x={x} y={36} textAnchor="middle" fill="rgba(255,255,255,0.5)"
              fontSize={9} fontFamily="JetBrains Mono,monospace">a^{power_a}</text>
            <text x={x} y={48} textAnchor="middle" fill="rgba(255,255,255,0.4)"
              fontSize={9} fontFamily="JetBrains Mono,monospace">b^{power_b}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Trophy SVG (Done modal icon) ──────────────────────────────
function TrophySVG({ col=ACCENT }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgG2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={col} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={col} stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="trG2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700"/><stop offset="50%" stopColor="#FFA500"/><stop offset="100%" stopColor="#FF6B35"/>
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#bgG2)"/>
      <circle cx="36" cy="36" r="32" fill="none" stroke={col} strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M24 18 h24 l-4 20 Q36 44 36 44 Q36 44 28 38 Z" fill="url(#trG2)" opacity="0.95"/>
      <path d="M24 22 Q16 22 16 30 Q16 36 24 36" fill="none" stroke="url(#trG2)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 22 Q56 22 56 30 Q56 36 48 36" fill="none" stroke="url(#trG2)" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="33" y="44" width="6" height="8" rx="1" fill="#FFA500" opacity="0.9"/>
      <rect x="27" y="52" width="18" height="4" rx="2" fill="url(#trG2)"/>
      <polygon points="36,21 37.5,25.5 42,25.5 38.5,28 40,32.5 36,30 32,32.5 33.5,28 30,25.5 34.5,25.5" fill="#FFF8DC" opacity="0.95"/>
      <circle cx="16" cy="16" r="2.5" fill={col} opacity="0.9"/>
      <circle cx="56" cy="16" r="2" fill="#FFD700" opacity="0.9"/>
      <circle cx="14" cy="48" r="1.8" fill="#FF6B35" opacity="0.8"/>
      <circle cx="58" cy="48" r="2.2" fill={col} opacity="0.8"/>
      <circle cx="36" cy="10" r="2" fill="#FFD700" opacity="0.7"/>
      <rect x="10" y="22" width="3" height="7" rx="1.5" fill="#4ECDC4" opacity="0.8" transform="rotate(-25 11.5 25.5)"/>
      <rect x="59" y="28" width="3" height="7" rx="1.5" fill="#FF6B6B" opacity="0.8" transform="rotate(20 60.5 31.5)"/>
      <rect x="18" y="54" width="2.5" height="6" rx="1.25" fill="#FFD700" opacity="0.7" transform="rotate(15 19.25 57)"/>
      <rect x="51" y="52" width="2.5" height="6" rx="1.25" fill="#A78BFA" opacity="0.7" transform="rotate(-20 52.25 55)"/>
    </svg>
  );
}
// ── Notation Table ─────────────────────────────────────────────
const NOTATION = [
  { sym:'\\binom{n}{r}', name:'Binomial Coefficient', meaning:'= nCr = n!/(r!(n−r)!)', ex:'\\binom{5}{2}=10' },
  { sym:'{}^nC_r', name:'Combination (alt. notation)', meaning:'Same as C(n,r) = n!/(r!(n-r)!)', ex:'{}^5C_2=10' },
  { sym:'T_{r+1}', name:'General Term', meaning:'(r+1)th term in expansion of (a+b)ⁿ', ex:'T_{r+1}=\\binom{n}{r}a^{n-r}b^r' },
  { sym:'(a+b)^n', name:'Binomial Expression', meaning:'Sum of two terms raised to power n', ex:'(x+1)^4=x^4+4x^3+6x^2+4x+1' },
  { sym:'2^n', name:'Sum of all Binomial Coefficients', meaning:'C₀+C₁+…+Cₙ = 2ⁿ', ex:'\\sum_{r=0}^{n}\\binom{n}{r}=2^n' },
  { sym:'\\binom{n}{r}=\\binom{n}{n-r}', name:'Symmetry Property', meaning:'Coefficients read same from both ends', ex:'\\binom{6}{2}=\\binom{6}{4}=15' },
  { sym:'\\binom{n}{r}+\\binom{n}{r-1}=\\binom{n+1}{r}', name:"Pascal's Identity", meaning:'Each entry = sum of two above it', ex:'\\binom{4}{2}+\\binom{4}{3}=\\binom{5}{3}' },
  { sym:'\\sum_{r=0}^{n}(-1)^r\\binom{n}{r}=0', name:'Alternating Sum = 0', meaning:'Coefficients alternate-sum to zero', ex:'1-4+6-4+1=0\\;(n=4)' },
  { sym:'\\sum_{r=0}^{n}r\\binom{n}{r}=n\\cdot2^{n-1}', name:'Weighted Sum Identity', meaning:'Obtained by differentiating (1+x)ⁿ at x=1', ex:'\\sum r\\binom{5}{r}=5\\cdot2^4=80' },
  { sym:'(1+x)^n=\\sum_{r=0}^{n}\\binom{n}{r}x^r', name:'Binomial Series (finite)', meaning:'Exact for positive integer n', ex:'(1+x)^3=1+3x+3x^2+x^3' },
  { sym:'(1+x)^n\\approx 1+nx', name:'Binomial Approximation', meaning:'For |x|≪1 and any n', ex:'(1.01)^{100}\\approx 1+100(0.01)=2' },
  { sym:'(1+x)^{-1}=1-x+x^2-\\cdots', name:'Negative Index Expansion', meaning:'Infinite series valid for |x|<1', ex:'(1+x)^{-1}\\approx 1-x+x^2-x^3' },
  { sym:'\\sum_{k=0}^{r}\\binom{m}{k}\\binom{n}{r-k}=\\binom{m+n}{r}', name:"Vandermonde's Identity", meaning:'Convolving two sets of combinations', ex:'\\sum_{k=0}^{2}\\binom{3}{k}\\binom{3}{2-k}=\\binom{6}{2}=15' },
  { sym:'\\omega=e^{2\\pi i/3}', name:'Cube Root of Unity', meaning:'Used to extract every 3rd term of expansion', ex:'1+\\omega+\\omega^2=0' },
  { sym:'\\frac{d}{dx}(1+x)^n', name:'Derivative of Binomial', meaning:'Used to prove weighted coefficient identities', ex:'n(1+x)^{n-1}=\\sum r\\binom{n}{r}x^{r-1}' },
  { sym:'\\int_0^1(1+x)^n dx', name:'Integral of Binomial', meaning:'Used to prove sum identities involving 1/(r+1)', ex:'\\frac{2^{n+1}-1}{n+1}=\\sum\\frac{\\binom{n}{r}}{r+1}' },
  { sym:'\\binom{p}{k}\\equiv 0\\pmod{p}', name:'Prime Divisibility', meaning:'For prime p and 0<k<p, p|C(p,k)', ex:'\\binom{7}{3}=35,\\;7\\mid35' },
  { sym:'\\binom{n}{r}\\equiv\\prod\\binom{n_i}{r_i}\\pmod{p}', name:"Lucas's Theorem", meaning:'Base-p digits determine binomial mod p', ex:'\\binom{10}{4}\\equiv\\binom{1}{0}\\binom{0}{4}\\pmod{2}' },
  { sym:'n!', name:'Factorial', meaning:'n! = 1×2×3×…×n, with 0!=1', ex:'5!=120,\\;0!=1' },
  { sym:'\\text{nPr}=\\frac{n!}{(n-r)!}', name:'Permutation', meaning:'Ordered selections; nPr = r! × nCr', ex:'{}^5P_2=20' },
  { sym:'(x+y+z)^n', name:'Multinomial Expression', meaning:'Expanded via multinomial theorem', ex:'\\text{Terms}: \\binom{n+2}{2}\\text{ for 3 variables}' },
  { sym:'\\frac{n!}{p!\\,q!\\,r!}', name:'Multinomial Coefficient', meaning:'Coefficient of xᵖyqzʳ in (x+y+z)ⁿ, p+q+r=n', ex:'\\frac{3!}{1!1!1!}=6' },
];

// ── Sections ───────────────────────────────────────────────────
const SECTIONS = [
  {
    id:'pascal', title:"Pascal's Triangle & Binomial Basics", level:'Foundation', color:'#6366F1', icon:'▽',
    shortDef:"Pascal's Triangle gives the coefficients of (a+b)ⁿ row by row — each entry is the sum of the two directly above it.",
    fullDef:"Pascal's Triangle is named after Blaise Pascal (1623–1662) but was known centuries earlier. Row n (starting from row 0) gives the coefficients of (a+b)ⁿ. The triangle has remarkable properties: every row is symmetric, every row sums to a power of 2, and diagonal entries give triangular numbers, Fibonacci numbers, and more. The triangle is both a visualisation tool and a proving ground for the Binomial Theorem itself.",
    keyFacts:[
      {text:"Row 0 to Row 4", l:'1;\\quad 1\\;1;\\quad 1\\;2\\;1;\\quad 1\\;3\\;3\\;1;\\quad 1\\;4\\;6\\;4\\;1'},
      {text:'Entry rule: sum of two above', l:'\\binom{n}{r}=\\binom{n-1}{r-1}+\\binom{n-1}{r}'},
      {text:'Row sum = power of 2', l:'\\text{Sum of row }n = 2^n'},
      {text:'Symmetry in every row', l:'\\binom{n}{r}=\\binom{n}{n-r}'},
      {text:'Diagonal = triangular numbers', l:'1,3,6,10,15,\\ldots\\;\\text{(diagonal 2)}'},
    ], genKey:'pascal', diagram:'pascal',
  },
  {
    id:'theorem', title:'Binomial Theorem (Positive Integer n)', level:'Foundation', color:'#8B5CF6', icon:'Σ',
    shortDef:'(a + b)ⁿ = Σ ⁿCᵣ · aⁿ⁻ʳ · bʳ for r = 0, 1, …, n.',
    fullDef:"The Binomial Theorem gives a compact formula for expanding (a+b)ⁿ without multiplying repeatedly. The coefficient of each term is a binomial coefficient ⁿCᵣ. Key features: there are (n+1) terms total; the powers of a decrease from n to 0 while the powers of b increase from 0 to n; the sum of the powers in every term always equals n; and the coefficients are symmetric (ⁿCᵣ = ⁿCₙ₋ᵣ). The theorem is proved by mathematical induction.",
    keyFacts:[
      {text:'Statement', l:'(a+b)^n=\\sum_{r=0}^{n}\\binom{n}{r}a^{n-r}b^r'},
      {text:'Number of terms', l:'n+1\\text{ terms in the expansion}'},
      {text:'Powers always sum to n', l:'\\text{Power of }a+\\text{power of }b=n'},
      {text:'Special case b=1', l:'(1+x)^n=\\sum_{r=0}^{n}\\binom{n}{r}x^r'},
      {text:'Special case a=1, b=−1', l:'(1-x)^n=\\sum_{r=0}^{n}(-1)^r\\binom{n}{r}x^r'},
      {text:'Proof method', l:'\\text{Mathematical induction on }n'},
    ], genKey:'theorem', diagram:'expansion',
  },
  {
    id:'general_term', title:'General Term  T_{r+1}', level:'Foundation', color:'#A78BFA', icon:'T_{r+1}',
    shortDef:'The (r+1)th term of (a+b)ⁿ is T_{r+1} = ⁿCᵣ · aⁿ⁻ʳ · bʳ.',
    fullDef:"The General Term formula lets you find any specific term without expanding the whole expression. Given (a+b)ⁿ, to find the (r+1)th term: plug r into T_{r+1} = ⁿCᵣ · aⁿ⁻ʳ · bʳ. Note carefully: the FIRST term corresponds to r=0 (T₁), the SECOND to r=1 (T₂), etc. If a question asks for the 5th term, set r=4. This formula is the single most tested result in binomial theorem problems.",
    keyFacts:[
      {text:'General Term formula', l:'T_{r+1}=\\binom{n}{r}\\cdot a^{n-r}\\cdot b^r'},
      {text:'First term (r=0)', l:'T_1=\\binom{n}{0}a^n b^0=a^n'},
      {text:'Last term (r=n)', l:'T_{n+1}=\\binom{n}{n}a^0 b^n=b^n'},
      {text:'For (x+y)ⁿ', l:'T_{r+1}=\\binom{n}{r}x^{n-r}y^r'},
      {text:'REMEMBER: T_{r+1} means r-th from 0', l:'T_5\\Rightarrow r=4'},
    ], genKey:'general_term',
  },
  {
    id:'middle_term', title:'Middle Term(s)', level:'Foundation', color:'#7C3AED', icon:'T_{mid}',
    shortDef:'If n is even: one middle term T_{n/2+1}. If n is odd: two middle terms T_{(n+1)/2} and T_{(n+3)/2}.',
    fullDef:"In an expansion of (a+b)ⁿ with n+1 terms: if n is even, there is exactly one middle term at position (n/2)+1. If n is odd, there are two middle terms at positions (n+1)/2 and (n+3)/2. The middle term has the largest binomial coefficient ⁿC_{n/2} (for even n), making it potentially the numerically greatest term when a=b=1. Middle terms appear frequently in problems about symmetry and maximum coefficients.",
    keyFacts:[
      {text:'n even: one middle term', l:'n\\text{ even}\\Rightarrow T_{\\frac{n}{2}+1}\\text{ is the middle term}'},
      {text:'n odd: two middle terms', l:'n\\text{ odd}\\Rightarrow T_{\\frac{n+1}{2}}\\text{ and }T_{\\frac{n+3}{2}}'},
      {text:'For (x+y)⁶', l:'\\text{Middle term: }T_4=\\binom{6}{3}x^3y^3=20x^3y^3'},
      {text:'For (x+y)⁵', l:'\\text{Middle terms: }T_3=10x^3y^2\\text{ and }T_4=10x^2y^3'},
      {text:'Middle term has largest coeff.', l:'\\binom{n}{n/2}\\text{ is largest when }a=b=1'},
    ], genKey:'middle_term',
  },
  {
    id:'term_indep', title:'Term Independent of x', level:'JEE', color:'#06B6D4', icon:'x⁰',
    shortDef:"Set the power of x to zero in T_{r+1} and solve for r — that term is the constant (independent of x).",
    fullDef:"When expanding expressions like (x² + 1/x)ⁿ, different terms have different powers of x. The term independent of x (the constant term) is found by setting the total power of x to zero and solving for r. This gives a specific value of r; then substitute back into T_{r+1} to find the actual term. Always write out the power of x explicitly as a function of r before solving. Ensure r is a non-negative integer.",
    keyFacts:[
      {text:'Method: set power of x = 0', l:'\\text{Write power of }x\\text{ as }f(r),\\text{ set }f(r)=0,\\text{ solve }r'},
      {text:'Example: }(x+\\frac{1}{x})^6', l:'T_{r+1}=\\binom{6}{r}x^{6-r}\\cdot x^{-r}=\\binom{6}{r}x^{6-2r}'},
      {text:'Set power 0', l:'6-2r=0\\Rightarrow r=3,\\;T_4=\\binom{6}{3}=20'},
      {text:'Check r is a non-neg integer', l:'r\\in\\{0,1,...,n\\}\\text{ — if not, no constant term}'},
      {text:'Fractional powers: same method', l:'(x^{2/3}+x^{-1/3})^n\\text{ — collect power of }x'},
    ], genKey:'term_indep',
  },
  {
    id:'greatest_term', title:'Numerically Greatest Term', level:'JEE', color:'#0891B2', icon:'max|T|',
    shortDef:"Find r where |T_{r+1}|/|T_r| ≥ 1 changes to < 1 — that transition point gives the greatest term.",
    fullDef:"The magnitude of terms in a binomial expansion first increases then decreases. To find the greatest term: compute the ratio |T_{r+1}|/|T_r| = |(n−r+1)/r · b/a|. Set this ≥ 1 and solve for r. The greatest term occurs at the largest r satisfying this. If the expression equals exactly 1, there are two equal greatest terms. For (1+x)ⁿ with x > 0, the transition happens at r = floor((n+1)|x|/(1+|x|)).",
    keyFacts:[
      {text:'Ratio of consecutive terms', l:'\\frac{T_{r+1}}{T_r}=\\frac{n-r+1}{r}\\cdot\\frac{b}{a}'},
      {text:'Greatest term condition', l:'\\frac{|T_{r+1}|}{|T_r|}\\geq 1\\Rightarrow\\text{ still increasing}'},
      {text:'Find transition r', l:'\\text{Largest }r\\text{ with }|T_{r+1}|\\geq|T_r|'},
      {text:'For (1+x)ⁿ', l:'r_{\\max}=\\left\\lfloor\\frac{(n+1)|x|}{1+|x|}\\right\\rfloor'},
      {text:'If ratio = 1 exactly', l:'\\text{Two consecutive equal greatest terms}'},
    ], genKey:'greatest_term',
  },
  {
    id:'binom_coeffs', title:'Properties of Binomial Coefficients', level:'JEE', color:'#0EA5E9', icon:'ΣCᵣ',
    shortDef:'Key identities: C₀+C₁+…+Cₙ=2ⁿ, alternating sum=0, ΣrCᵣ=n·2ⁿ⁻¹, and more.',
    fullDef:"Binomial coefficients satisfy dozens of beautiful identities, most proved by substituting specific values into (1+x)ⁿ or by differentiating/integrating the series. Setting x=1 gives sum=2ⁿ. Setting x=−1 gives alternating sum=0. Differentiating and setting x=1 gives the weighted sum n·2ⁿ⁻¹. Squaring both sides of (1+x)ⁿ and comparing coefficients gives Vandermonde's identity. These properties are fundamental for JEE and Olympiad problems.",
    keyFacts:[
      {text:'Sum of all coefficients', l:'C_0+C_1+\\cdots+C_n=2^n'},
      {text:'Alternating sum = 0', l:'C_0-C_1+C_2-\\cdots=0'},
      {text:'Sum of odd-indexed', l:'C_1+C_3+C_5+\\cdots=2^{n-1}'},
      {text:'Sum of even-indexed', l:'C_0+C_2+C_4+\\cdots=2^{n-1}'},
      {text:'Weighted sum (differentiate)', l:'\\sum_{r=0}^{n}r\\binom{n}{r}=n\\cdot2^{n-1}'},
      {text:'Sum of squares (Vandermonde)', l:'\\sum_{r=0}^{n}\\binom{n}{r}^2=\\binom{2n}{n}'},
    ], genKey:'binom_coeffs',
  },
  {
    id:'multinomial', title:'Multinomial Theorem', level:'JEE', color:'#2563EB', icon:'(x+y+z)ⁿ',
    shortDef:'(x₁+x₂+…+xₖ)ⁿ = Σ n!/(r₁!r₂!…rₖ!) · x₁^r₁ · x₂^r₂ · … · xₖ^rₖ where Σrᵢ=n.',
    fullDef:"The Multinomial Theorem generalises the Binomial Theorem to any number of terms. The coefficient of x₁^r₁ · x₂^r₂ · … · xₖ^rₖ (where r₁+r₂+…+rₖ=n) is the multinomial coefficient n!/(r₁!r₂!…rₖ!). The total number of distinct terms in (x+y+z)ⁿ is C(n+2,2) = (n+1)(n+2)/2. These coefficients count the number of ways to arrange r₁ copies of x, r₂ copies of y, etc., and they arise naturally in probability and combinatorics.",
    keyFacts:[
      {text:'Multinomial expansion', l:'(x_1+x_2+\\cdots+x_k)^n=\\sum_{r_1+\\cdots+r_k=n}\\frac{n!}{r_1!\\cdots r_k!}x_1^{r_1}\\cdots x_k^{r_k}'},
      {text:'Coefficient formula', l:'\\text{Coeff of }x^p y^q z^r=\\frac{n!}{p!\\,q!\\,r!},\\;p+q+r=n'},
      {text:'Number of terms in (x+y+z)ⁿ', l:'\\binom{n+2}{2}=\\frac{(n+1)(n+2)}{2}'},
      {text:'Number of terms in k-variable', l:'\\binom{n+k-1}{k-1}'},
      {text:'Sum of all coefficients', l:'\\text{Set all }x_i=1:\\;k^n'},
    ], genKey:'multinomial',
  },
  {
    id:'any_index', title:'Binomial Theorem for Any Index', level:'JEE', color:'#3B82F6', icon:'(1+x)^α',
    shortDef:'For any real/rational n and |x| < 1: (1+x)ⁿ = 1 + nx + n(n−1)x²/2! + n(n−1)(n−2)x³/3! + …',
    fullDef:"When n is not a positive integer (fractional or negative), the binomial expansion becomes an infinite series, valid only when |x| < 1. The coefficients are generalised: the coefficient of xʳ is n(n−1)(n−2)…(n−r+1)/r! — the 'generalised binomial coefficient' which may be negative or fractional. Key cases: (1+x)^{−1} = 1−x+x²−x³+…, (1+x)^{−2} = 1−2x+3x²−4x³+…, (1+x)^{1/2} ≈ 1+x/2−x²/8+… These series are vital for approximations.",
    keyFacts:[
      {text:'General formula (|x|<1)', l:'(1+x)^n=\\sum_{r=0}^{\\infty}\\binom{n}{r}x^r,\\;|x|<1'},
      {text:'Generalised coefficient', l:'\\binom{n}{r}=\\frac{n(n-1)(n-2)\\cdots(n-r+1)}{r!}'},
      {text:'(1+x)^{−1}', l:'1-x+x^2-x^3+\\cdots,\\;|x|<1'},
      {text:'(1+x)^{−2}', l:'1-2x+3x^2-4x^3+\\cdots,\\;|x|<1'},
      {text:'(1+x)^{1/2}', l:'1+\\frac{x}{2}-\\frac{x^2}{8}+\\frac{x^3}{16}-\\cdots'},
      {text:'(1−x)^{−1}', l:'1+x+x^2+x^3+\\cdots,\\;|x|<1\\;(\\text{geometric})'},
    ], genKey:'any_index',
  },
  {
    id:'remainder', title:'Remainder & Divisibility Problems', level:'JEE', color:'#6366F1', icon:'mod N',
    shortDef:'Split aⁿ = (k·N±1)^m to isolate a remainder; use the binomial expansion where most terms are divisible by N.',
    fullDef:"These problems ask for the remainder when large numbers like 7^{100} or 3^{50} are divided by integers. The key trick: write the base as (multiple of divisor ± 1), then expand. For example, 7^{100} = (7)^{100} = (8−1)^{100}; when divided by 8, all terms except the last (which is (−1)^{100}=1) are divisible by 8. So the remainder is 1. More generally, (kN+1)^n ≡ 1 (mod N) and (kN−1)^n ≡ (−1)^n (mod N). Fermat's Little Theorem and Euler's theorem are higher-level tools for the same goal.",
    keyFacts:[
      {text:'Core trick', l:'(kN\\pm 1)^n=\\sum_{r=0}^{n}\\binom{n}{r}(kN)^r(\\pm 1)^{n-r}'},
      {text:'Only last term survives mod N', l:'\\text{All terms with }r\\geq 1\\text{ are divisible by }N'},
      {text:'(1+kN)ⁿ mod N', l:'(1+kN)^n\\equiv 1\\pmod{N}'},
      {text:'(−1+kN)ⁿ mod N', l:'(-1+kN)^n\\equiv(-1)^n\\pmod{N}'},
      {text:"Fermat's Little Theorem", l:'a^{p-1}\\equiv 1\\pmod{p}\\;(p\\text{ prime},\\gcd(a,p)=1)'},
    ], genKey:'remainder',
  },
  {
    id:'vandermonde', title:"Vandermonde's Identity", level:'Olympiad', color:'#8B5CF6', icon:'Σ CₖCᵣ₋ₖ',
    shortDef:'Σ C(m,k)·C(n,r−k) = C(m+n,r). Proved by comparing coefficients in (1+x)^m · (1+x)^n = (1+x)^{m+n}.',
    fullDef:"Vandermonde's Identity (1772) is one of the most powerful combinatorial identities. The proof is elegant: multiply (1+x)^m by (1+x)^n to get (1+x)^{m+n}, then compare the coefficient of xʳ on both sides. The left side gives the convolution sum Σ C(m,k)·C(n,r−k), while the right side gives C(m+n,r). Special case m=n, r=n gives Σ C(n,k)² = C(2n,n). This identity is the basis for many combinatorial counting arguments in Olympiads.",
    keyFacts:[
      {text:"Vandermonde's Identity", l:'\\sum_{k=0}^{r}\\binom{m}{k}\\binom{n}{r-k}=\\binom{m+n}{r}'},
      {text:'Proof: compare coefficients', l:'(1+x)^m(1+x)^n=(1+x)^{m+n}'},
      {text:'Special case m=n, r=n', l:'\\sum_{k=0}^{n}\\binom{n}{k}^2=\\binom{2n}{n}'},
      {text:'Another special case', l:'\\sum_{k=0}^{r}\\binom{r}{k}^2=\\binom{2r}{r}'},
      {text:'Symmetry variant', l:'\\sum_k\\binom{m}{k}\\binom{n}{p-k}=\\binom{m+n}{p}'},
    ], genKey:'vandermonde',
  },
  {
    id:'calculus_binom', title:'Calculus & Binomial Series', level:'Olympiad', color:'#7C3AED', icon:"d/dx",
    shortDef:'Differentiate or integrate (1+x)ⁿ to derive weighted sum identities like ΣrCᵣ = n·2ⁿ⁻¹.',
    fullDef:"Calculus gives powerful tools for binomial coefficient identities. Differentiating (1+x)ⁿ = ΣCᵣxʳ gives n(1+x)^{n-1} = ΣrCᵣxʳ⁻¹; setting x=1 gives ΣrCᵣ = n·2^{n-1}. Multiplying by x then differentiating again gives higher-order moments. Integrating (1+x)ⁿ from 0 to 1 gives (2^{n+1}−1)/(n+1) = ΣCᵣ/(r+1). These are the 'analytic' proofs — Olympiad solutions often also require purely combinatorial proofs (counting two ways).",
    keyFacts:[
      {text:'Differentiate at x=1', l:'\\frac{d}{dx}(1+x)^n\\big|_{x=1}\\Rightarrow n\\cdot2^{n-1}=\\sum_{r=1}^{n}r\\binom{n}{r}'},
      {text:'Multiply x, differentiate at x=1', l:'\\sum r^2\\binom{n}{r}=n(n+1)2^{n-2}'},
      {text:'Integrate 0 to 1', l:'\\int_0^1(1+x)^n dx=\\frac{2^{n+1}-1}{n+1}=\\sum_{r=0}^{n}\\frac{\\binom{n}{r}}{r+1}'},
      {text:'Differentiate at x=−1', l:'n\\cdot0^{n-1}\\Rightarrow\\sum_{r=1}^{n}(-1)^{r-1}r\\binom{n}{r}=0\\;(n>1)'},
      {text:'Higher derivative identity', l:'\\frac{d^k}{dx^k}(1+x)^n\\big|_{x=0}=\\frac{n!}{(n-k)!}'},
    ], genKey:'calculus_binom',
  },
  {
    id:'complex_binom', title:'Complex Numbers & Roots of Unity', level:'Olympiad', color:'#5B21B6', icon:'ω=e^{2πi/3}',
    shortDef:'Use ωᵏ = 1 filters to extract sums of every kth term: C₀+C₃+C₆+… = (2ⁿ+2cos(nπ/3))/3.',
    fullDef:"Roots of unity act as 'filters' for binomial coefficients. If ω = e^{2πi/k} is a primitive kth root of unity, then (1+1)ⁿ + (1+ω)ⁿ + (1+ω²)ⁿ + … averages out most terms, leaving only those whose index is divisible by k. For k=3 with ω = e^{2πi/3}: the sum C₀+C₃+C₆+… = (2ⁿ + (1+ω)ⁿ + (1+ω²)ⁿ)/3. Evaluating (1+ω) = e^{iπ/3} in polar form gives expressions involving cos(nπ/3). This technique is an elegant application of De Moivre's theorem.",
    keyFacts:[
      {text:'Root of unity filter (mod k)', l:'\\sum_{j\\equiv 0(\\bmod k)}\\binom{n}{j}=\\frac{1}{k}\\sum_{t=0}^{k-1}(1+\\omega^t)^n'},
      {text:'Sum of every 3rd term (k=3)', l:'C_0+C_3+C_6+\\cdots=\\frac{2^n+2\\cos(n\\pi/3)}{3}'},
      {text:'Key: 1+ω in polar form', l:'1+\\omega=e^{i\\pi/3},\\;|1+\\omega|=1,\\;\\arg=\\pi/3'},
      {text:'Cube root property', l:'1+\\omega+\\omega^2=0,\\;\\omega^3=1'},
      {text:'Sum of alternating (k=2)', l:'C_0+C_2+C_4+\\cdots=2^{n-1}\\;(\\omega=-1)'},
    ], genKey:'complex_binom',
  },
  {
    id:'double_count', title:'Combinatorial Interpretations (Double Counting)', level:'Olympiad', color:'#4F46E5', icon:'↔',
    shortDef:'Prove binomial identities by counting the same set two different ways.',
    fullDef:"Double counting is one of the most elegant proof techniques in combinatorics. The idea: describe a set or quantity, count it one way to get one expression, count it a different way to get another — equating them proves the identity. Classic example: C(n,r) counts subsets of size r from {1,…,n}. Also counts: choosing 1 element (to be 'special') and r−1 from the rest gives n·C(n−1,r−1). Setting equal: C(n,r) = (n/r)·C(n−1,r−1). The combinatorial proof of the Vandermonde identity and the hockey stick identity are must-knows.",
    keyFacts:[
      {text:"Hockey Stick Identity", l:'\\sum_{k=0}^{r}\\binom{k+n}{k}=\\binom{n+r+1}{r}'},
      {text:'Absorption/Extraction', l:'r\\binom{n}{r}=n\\binom{n-1}{r-1}'},
      {text:'Symmetry (double counting subsets)', l:'\\binom{n}{r}=\\binom{n}{n-r}'},
      {text:'Choosing a committee with a chair', l:'n\\binom{n-1}{r-1}=\\binom{n}{r}\\cdot r'},
      {text:'Upper summation identity', l:'\\sum_{k=0}^{n}\\binom{k}{r}=\\binom{n+1}{r+1}'},
    ], genKey:'double_count',
  },
  {
    id:'number_theory', title:'Number Theory & Prime Applications', level:'Olympiad', color:'#3730A3', icon:'p|C(p,k)',
    shortDef:'For prime p: p divides C(p,k) for 0<k<p. Lucas\'s theorem: C(n,k) mod p via base-p digits.',
    fullDef:"Primes interact beautifully with binomial coefficients. The fundamental result: for prime p and 0<k<p, p | C(p,k). Proof: C(p,k) = p!/(k!(p-k)!). Since p is prime, p appears in the numerator but not in k! or (p-k)!, so p divides C(p,k). Consequence: (1+x)^p ≡ 1+xᵖ (mod p) — Freshman's Dream. Lucas's Theorem: if n = n_s·pˢ+…+n₁·p+n₀ and k = k_s·pˢ+…+k₀ in base p, then C(n,k) ≡ C(n_s,k_s)·…·C(n₀,k₀) (mod p).",
    keyFacts:[
      {text:'Prime divisibility', l:'p\\text{ prime},\\;0<k<p\\Rightarrow p\\mid\\binom{p}{k}'},
      {text:"Freshman's Dream", l:'(1+x)^p\\equiv 1+x^p\\pmod{p}'},
      {text:"Lucas's Theorem (mod prime p)", l:'\\binom{n}{k}\\equiv\\prod_{i}\\binom{n_i}{k_i}\\pmod{p}'},
      {text:'where n=Σnᵢpⁱ in base p', l:'n_i,k_i\\text{ are base-}p\\text{ digits of }n,k'},
      {text:"Kummer's Theorem", l:'v_p\\binom{m+n}{m}=\\text{carries when adding }m,n\\text{ in base }p'},
    ], genKey:'number_theory',
  },
  {
    id:'approximation', title:'Binomial Approximation', level:'Olympiad', color:'#1D4ED8', icon:'≈1+nx',
    shortDef:'For |x| ≪ 1 and any n: (1+x)ⁿ ≈ 1 + nx. Higher-order: 1 + nx + n(n−1)x²/2! + …',
    fullDef:"Binomial approximation is used constantly in physics and competition problems. For |x| ≪ 1, the higher powers of x are negligible: (1+x)ⁿ ≈ 1+nx. Including the next term: ≈ 1+nx+n(n−1)x²/2. This works for any real n. Applications: (1.001)^{1000} ≈ e ≈ 2.718 using (1+1/1000)^{1000}; bounding values like 2^{100}/3^{60}; relativistic corrections in physics. In Olympiad problems, it helps bound complicated expressions or estimate large powers of numbers close to 1.",
    keyFacts:[
      {text:'First-order approximation', l:'(1+x)^n\\approx 1+nx,\\;|x|\\ll 1'},
      {text:'Second-order', l:'(1+x)^n\\approx 1+nx+\\frac{n(n-1)}{2}x^2'},
      {text:'Example: √(1+x) for small x', l:'(1+x)^{1/2}\\approx 1+\\frac{x}{2}-\\frac{x^2}{8}'},
      {text:'Example: 1/(1+x) for small x', l:'(1+x)^{-1}\\approx 1-x+x^2'},
      {text:'Bounding application', l:'\\left(1+\\frac{1}{n}\\right)^n\\to e\\approx 2.718\\text{ as }n\\to\\infty'},
    ], genKey:'approximation',
  },
];
// ── Practice Question Generators ──────────────────────────────
const GENERATORS = {
  pascal:(n)=>{
    const row=srI(n,3,8);const pr=pascalRow(row);
    const r=srI(n+1,1,row-1);const val=pr[r];
    return{question:`In Pascal's Triangle, what is the value at row ${row}, position ${r} (0-indexed)?`,questionLatex:`\\text{Row }${row},\\text{ position }${r}\\text{ in Pascal's Triangle}=?`,steps:[`Pascal's Triangle row ${row}: [${pr.join(', ')}]`,`Each entry = sum of two directly above it`,`Position ${r} in row ${row} = C(${row},${r}) = ${val}`],answer:`${val}`,answerLatex:`\\binom{${row}}{${r}}=${val}`,tip:`Row n, position r in Pascal's Triangle = C(n,r) = n!/(r!(n-r)!).`};
  },
  theorem:(n)=>{
    const pw=srI(n,3,6);const a=srP(['x','a','p','y'],n),b=srP(['y','b','q','1'],n+3);
    const r_ask=srI(n+2,1,pw-1);const coeff=C(pw,r_ask);
    return{question:`In the expansion of (${a}+${b})^${pw}, find the coefficient of ${a}^${pw-r_ask}${b}^${r_ask}.`,questionLatex:`(${a}+${b})^{${pw}},\\text{ coefficient of }${a}^{${pw-r_ask}}${b}^{${r_ask}}=?`,steps:[`General term: T_{r+1} = C(${pw},r)·${a}^{${pw}-r}·${b}^r`,`Need power of ${b} = ${r_ask}, so r = ${r_ask}`,`T_{${r_ask+1}} = C(${pw},${r_ask})·${a}^{${pw-r_ask}}·${b}^{${r_ask}}`,`Coefficient = C(${pw},${r_ask}) = ${coeff}`],answer:`${coeff}`,answerLatex:`\\binom{${pw}}{${r_ask}}=${coeff}`,tip:`Match the power of b to find r, then compute C(n,r).`};
  },
  general_term:(n)=>{
    const pw=srI(n,4,8);const r=srI(n+1,1,pw-1);const coeff=C(pw,r);
    const pA=pw-r,pB=r;
    return{question:`Find T_${r+1} in the expansion of (a+b)^${pw}.`,questionLatex:`T_{${r+1}}\\text{ in }(a+b)^{${pw}}=?`,steps:[`T_{r+1} = C(n,r)·a^{n-r}·b^r`,`Here n=${pw}, r=${r}`,`T_{${r+1}} = C(${pw},${r})·a^${pA}·b^${pB}`,`= ${coeff}a^{${pA}}b^{${pB}}`],answer:`${coeff}a^{${pA}}b^{${pB}}`,answerLatex:`T_{${r+1}}=${coeff}a^{${pA}}b^{${pB}}`,tip:`T_{r+1}: r starts from 0. T_5 means r=4.`};
  },
  middle_term:(n)=>{
    const pw=srI(n,3,9);const isEven=pw%2===0;
    const pr=pascalRow(pw);
    if(isEven){const mid=pw/2;const c=C(pw,mid);return{question:`Find the middle term in (x+y)^${pw}.`,questionLatex:`\\text{Middle term of }(x+y)^{${pw}}=?`,steps:[`n=${pw} is EVEN → one middle term`,`Middle term = T_{n/2+1} = T_{${mid+1}}`,`T_{${mid+1}} = C(${pw},${mid})·x^{${pw-mid}}·y^{${mid}}`,`= ${c}x^${pw-mid}y^${mid}`],answer:`${c}x^{${pw-mid}}y^{${mid}}`,answerLatex:`T_{${mid+1}}=${c}x^{${pw-mid}}y^{${mid}}`,tip:`n even → 1 middle term at position T_{n/2+1}.`};}
    else{const m1=(pw+1)/2,m2=(pw+3)/2;const c1=C(pw,m1-1),c2=C(pw,m2-1);return{question:`Find both middle terms in (x+y)^${pw}.`,questionLatex:`\\text{Middle terms of }(x+y)^{${pw}}=?`,steps:[`n=${pw} is ODD → two middle terms`,`T_{(n+1)/2} = T_{${m1}} = C(${pw},${m1-1})x^{${pw-m1+1}}y^{${m1-1}} = ${c1}x^${pw-m1+1}y^${m1-1}`,`T_{(n+3)/2} = T_{${m2}} = C(${pw},${m2-1})x^{${pw-m2+1}}y^{${m2-1}} = ${c2}x^${pw-m2+1}y^${m2-1}`],answer:`${c1}x^${pw-m1+1}y^${m1-1} and ${c2}x^${pw-m2+1}y^${m2-1}`,answerLatex:`${c1}x^{${pw-m1+1}}y^{${m1-1}}\\text{ and }${c2}x^{${pw-m2+1}}y^{${m2-1}}`,tip:`n odd → 2 middle terms at positions (n+1)/2 and (n+3)/2.`};}
  },
  term_indep:(n)=>{
    const pw=srI(n,4,9);const pa=srI(n+1,1,3),pb=srI(n+2,1,2);
    // (x^pa + x^(-pb))^pw → power = pa*(pw-r) - pb*r = pa*pw - (pa+pb)*r = 0 → r = pa*pw/(pa+pb)
    const rSol=pa*pw/(pa+pb);const rInt=Number.isInteger(rSol)?rSol:-1;
    if(rInt<0||rInt>pw){return GENERATORS.term_indep(n+7);}
    const coeff=C(pw,rInt);
    return{question:`Find the term independent of x in (x^${pa} + x^{-${pb}})^${pw}.`,questionLatex:`\\text{Term independent of }x\\text{ in }(x^{${pa}}+x^{-${pb}})^{${pw}}`,steps:[`General term: T_{r+1} = C(${pw},r)·(x^${pa})^{${pw}-r}·(x^{-${pb}})^r`,`= C(${pw},r)·x^{${pa}(${pw}-r)-${pb}r}`,`= C(${pw},r)·x^{${pa*pw}-(${pa}+${pb})r}`,`For x⁰: ${pa*pw}-(${pa+pb})r=0 → r=${rInt}`,`T_{${rInt+1}} = C(${pw},${rInt}) = ${coeff}`],answer:`${coeff}`,answerLatex:`\\text{Constant term}=${coeff}`,tip:`Write power of x as f(r), set f(r)=0, verify r is a non-negative integer ≤ n.`};
  },
  greatest_term:(n)=>{
    const pw=srI(n,4,8);const xNum=srI(n+1,1,4),xDen=srI(n+2,2,6);
    const x=xNum/xDen;const ratioExpr=`(${pw}+1)×${xNum}/${xDen}/(1+${xNum}/${xDen})`;
    const rawR=(pw+1)*x/(1+x);const rFloor=Math.floor(rawR);
    const Tr=C(pw,rFloor)*x**rFloor,Tr1=C(pw,rFloor+1)*x**(rFloor+1);
    return{question:`For (1+${xNum}/${xDen})^${pw}, find the numerically greatest term.`,questionLatex:`(1+\\frac{${xNum}}{${xDen}})^{${pw}},\\text{ greatest term?}`,steps:[`Use ratio: T_{r+1}/T_r = (n-r+1)/r · x`,`x = ${xNum}/${xDen} = ${fmt(x,4)}`,`Set ratio ≥ 1: (${pw}-r+1)/r × ${fmt(x,4)} ≥ 1`,`→ r ≤ (n+1)x/(1+x) = ${fmt(rawR,4)}`,`Greatest term at r = ⌊${fmt(rawR,4)}⌋ = ${rFloor}`,`T_{${rFloor+1}} = C(${pw},${rFloor})×(${fmt(x,4)})^${rFloor} = ${fmt(Tr,4)}`],answer:`T_${rFloor+1} ≈ ${fmt(Tr,4)}`,answerLatex:`T_{${rFloor+1}}=\\binom{${pw}}{${rFloor}}\\left(\\frac{${xNum}}{${xDen}}\\right)^{${rFloor}}\\approx ${fmt(Tr,4)}`,tip:`r_max = floor((n+1)|x|/(1+|x|)). If this is an integer, check if T_{r+1} = T_{r+2} (two equal greatest terms).`};
  },
  binom_coeffs:(n)=>{
    const pw=srI(n,4,9);const templates=[
      ()=>{const s=Math.pow(2,pw);return{q:`Find C(${pw},0)+C(${pw},1)+...+C(${pw},${pw}).`,steps:[`Sum of all binomial coefficients = 2ⁿ`,`Set x=1 in (1+x)^${pw} = ΣC(${pw},r)x^r`,`2^${pw} = ${s}`],ans:`${s}`,ansL:`2^{${pw}}=${s}`};},
      ()=>{const s=Math.pow(2,pw-1);return{q:`Find C(${pw},1)+C(${pw},3)+C(${pw},5)+... (sum of odd-indexed terms).`,steps:[`Add (1+1)^${pw} and (1-1)^${pw}:`,`2·(C_0+C_2+C_4+...) = 2^${pw}+0 → even sum = 2^${pw-1}`,`Similarly, odd sum = 2^${pw-1} = ${s}`],ans:`${s}`,ansL:`2^{${pw-1}}=${s}`};},
      ()=>{const s=pw*Math.pow(2,pw-1);return{q:`Find the sum: ΣrC(${pw},r) for r=0 to ${pw}.`,steps:[`Differentiate (1+x)^${pw}=ΣC(${pw},r)x^r`,`${pw}(1+x)^${pw-1}=ΣrC(${pw},r)x^{r-1}`,`Set x=1: ${pw}·2^${pw-1} = ${s}`],ans:`${s}`,ansL:`${pw}\\cdot 2^{${pw-1}}=${s}`};},
      ()=>{const s=C(2*pw,pw);return{q:`Find Σ[C(${pw},r)]² for r=0 to ${pw}.`,steps:[`By Vandermonde: Σ C(n,r)² = C(2n,n)`,`= C(${2*pw},${pw}) = ${s}`],ans:`${s}`,ansL:`\\binom{${2*pw}}{${pw}}=${s}`};},
    ];
    const t=templates[n%templates.length]();
    return{question:t.q,questionLatex:t.q,steps:t.steps,answer:t.ans,answerLatex:t.ansL,tip:'Key: sub x=1 for sum=2ⁿ; x=−1 for alternating=0; differentiate for weighted sum.'};
  },
  multinomial:(n)=>{
    const pw=srI(n,2,5);const p=srI(n+1,0,pw),q=srI(n+2,0,pw-p),r=pw-p-q;
    const coeff=Math.round(fact(pw)/(fact(p)*fact(q)*fact(r)));
    return{question:`Find the coefficient of x^${p}y^${q}z^${r} in (x+y+z)^${pw}.`,questionLatex:`\\text{Coefficient of }x^{${p}}y^{${q}}z^{${r}}\\text{ in }(x+y+z)^{${pw}}`,steps:[`Multinomial coefficient = n!/(p!q!r!)`,`= ${pw}!/(${p}!×${q}!×${r}!)`,`= ${fact(pw)}/(${fact(p)}×${fact(q)}×${fact(r)})`,`= ${coeff}`],answer:`${coeff}`,answerLatex:`\\frac{${pw}!}{${p}!\\,${q}!\\,${r}!}=${coeff}`,tip:'The multinomial coefficient counts arrangements of p copies of x, q of y, r of z.'};
  },
  any_index:(n)=>{
    const alphas=[{n:'-1',coeff:(r)=>Math.pow(-1,r),sign:'-'},{n:'-2',coeff:(r)=>(r+1)*Math.pow(-1,r),sign:'-'},{n:'1/2',coeff:(r)=>{let v=1;for(let i=0;i<r;i++)v*=(0.5-i)/( i+1);return v;},sign:''}];
    const alph=alphas[n%alphas.length];const order=srI(n+2,2,5);
    const terms=Array.from({length:order+1},(_,r)=>{const c=alph.coeff(r);return `${r===0?'':(c>=0?'+':'')}${fmt(c,4)}x^${r}`;}).join(' ');
    return{question:`Write the first ${order+1} terms of (1+x)^{${alph.n}} as a power series.`,questionLatex:`(1+x)^{${alph.n}}=?\\text{ (first ${order+1} terms)}`,steps:[`For any index n, (1+x)^n = Σ n(n-1)...(n-r+1)/r! · xr`,`Valid for |x| < 1`,`n = ${alph.n}:`,...Array.from({length:order+1},(_,r)=>`  r=${r}: ${fmt(alph.coeff(r),6)}`)],answer:terms,answerLatex:`${terms.replace(/\^(\d+)/g,'\\^{$1}')}+\\cdots`,tip:'Generalised binomial: coefficient of xʳ = n(n-1)…(n-r+1)/r! — may be negative/fractional.'};
  },
  remainder:(n)=>{
    const base=srP([3,7,9,11,13],n),pw=srI(n+1,50,200),divisor=srP([8,4,9,7,10],n+3);
    // find nearest multiple + offset
    let offset=base%divisor,multiple=base-offset;
    if(multiple===0){multiple=divisor;offset=base-divisor;}
    const rem=Math.pow(offset,pw)%divisor;
    return{question:`Find the remainder when ${base}^${pw} is divided by ${divisor}.`,questionLatex:`${base}^{${pw}}\\pmod{${divisor}}`,steps:[`Write ${base} = ${multiple} + ${offset} = ${Math.round(multiple/divisor)}×${divisor} + ${offset}`,`So ${base}^${pw} = (${Math.round(multiple/divisor)}×${divisor}+${offset})^${pw}`,`Expand: all terms except ${offset}^${pw} are divisible by ${divisor}`,`Remainder = ${offset}^${pw} mod ${divisor}`,`${offset}^${pw} mod ${divisor}: ${offset}^1≡${offset%divisor}, ${offset}^2≡${(offset*offset)%divisor}... (find cycle)`,`Remainder = ${rem}`],answer:`Remainder = ${rem}`,answerLatex:`${base}^{${pw}}\\equiv ${rem}\\pmod{${divisor}}`,tip:`Split base into (kN+r), expand, and note all terms with kN are divisible by N.`};
  },
  vandermonde:(n)=>{
    const m=srI(n,2,6),nv=srI(n+1,2,6),r=srI(n+2,1,Math.min(m,nv));
    const lhs=Array.from({length:r+1},(_,k)=>C(m,k)*C(nv,r-k)).reduce((a,b)=>a+b,0);
    const rhs=C(m+nv,r);
    return{question:`Verify Vandermonde's Identity: Σ C(${m},k)·C(${nv},${r}−k) for k=0 to ${r}.`,questionLatex:`\\sum_{k=0}^{${r}}\\binom{${m}}{k}\\binom{${nv}}{${r}-k}=?`,steps:[`Vandermonde: Σ C(m,k)C(n,r-k) = C(m+n,r)`,...Array.from({length:r+1},(_,k)=>`  k=${k}: C(${m},${k})×C(${nv},${r-k}) = ${C(m,k)}×${C(nv,r-k)} = ${C(m,k)*C(nv,r-k)}`),`Sum = ${lhs}`,`C(${m+nv},${r}) = ${rhs}`,`${lhs} = ${rhs} ✓`],answer:`${rhs}`,answerLatex:`\\binom{${m+nv}}{${r}}=${rhs}\\;✓`,tip:'Proof: expand (1+x)^m · (1+x)^n = (1+x)^{m+n} and compare coefficient of xʳ.'};
  },
  calculus_binom:(n)=>{
    const pw=srI(n,3,8);const templates=[
      ()=>{const ans=pw*Math.pow(2,pw-1);return{q:`Using differentiation of (1+x)^${pw}, find Σ r·C(${pw},r).`,steps:[`Differentiate both sides of (1+x)^${pw}=ΣC(${pw},r)x^r`,`${pw}(1+x)^${pw-1}=ΣrC(${pw},r)x^{r-1}`,`Set x=1: ${pw}·2^${pw-1} = ${ans}`],ans:`${ans}`,ansL:`${pw}\\cdot2^{${pw-1}}=${ans}`};},
      ()=>{const ans=(2**(pw+1)-1)/(pw+1);return{q:`Using integration of (1+x)^${pw} from 0 to 1, find Σ C(${pw},r)/(r+1).`,steps:[`∫₀¹(1+x)^${pw}dx = ΣC(${pw},r)·∫₀¹x^r dx = ΣC(${pw},r)/(r+1)`,`LHS = [(1+x)^${pw+1}/${pw+1}]₀¹ = (2^${pw+1}-1)/${pw+1}`,`= ${fmt(ans,6)}`],ans:fmt(ans,4),ansL:`\\frac{2^{${pw+1}}-1}{${pw+1}}=${fmt(ans,4)}`};},
      ()=>{const ans=pw*(pw+1)*Math.pow(2,pw-2);return{q:`Find Σ r²·C(${pw},r) by differentiating twice.`,steps:[`From xd/dx[(1+x)^${pw}] = ${pw}x(1+x)^${pw-1} = Σ rC(${pw},r)x^r`,`Differentiate again and set x=1`,`Σ r²C(${pw},r) = n(n-1)2^{n-2} + n·2^{n-1} = ${pw}(${pw-1})·2^${pw-2}+${pw}·2^${pw-1} = ${ans}`],ans:`${ans}`,ansL:`${ans}`};},
    ];
    const t=templates[n%templates.length]();
    return{question:t.q,questionLatex:t.q,steps:t.steps,answer:t.ans,answerLatex:t.ansL,tip:'Diff at x=1 → sum; integrate 0→1 → 1/(r+1) sum; diff at x=-1 → alternating.'};
  },
  complex_binom:(n)=>{
    const pw=srI(n,3,8);
    const cos_val=Math.cos(pw*Math.PI/3);const total=Math.pow(2,pw);
    const s0=(total+2*cos_val)/3;
    return{question:`Find C(${pw},0)+C(${pw},3)+C(${pw},6)+... using cube roots of unity.`,questionLatex:`\\text{Find }\\sum_{k\\equiv 0\\,(\\text{mod }3)}\\binom{${pw}}{k}`,steps:[`Use ω=e^{2πi/3}, 1+ω+ω²=0`,`(1+1)^${pw}+(1+ω)^${pw}+(1+ω²)^${pw} = 3·[C₀+C₃+C₆+...]`,`|1+ω| = 1, arg(1+ω)=π/3, so (1+ω)^${pw} = e^{i${pw}π/3}`,`Real part = cos(${pw}π/3) = ${fmt(cos_val,4)}`,`Sum = (2^${pw} + 2cos(${pw}π/3))/3 = (${total} + ${fmt(2*cos_val,4)})/3 = ${fmt(s0,4)}`],answer:fmt(Math.round(s0),0),answerLatex:`\\frac{2^{${pw}}+2\\cos(${pw}\\pi/3)}{3}=${fmt(Math.round(s0),0)}`,tip:'Root of unity filter: (1+1)^n+(1+ω)^n+(1+ω²)^n = 3(C₀+C₃+C₆+…).'};
  },
  double_count:(n)=>{
    const nv=srI(n,4,9),rv=srI(n+1,1,nv-1);
    const identities=[
      ()=>{const ans=C(nv+1,rv+1);return{q:`Verify hockey stick: C(${rv},${rv})+C(${rv+1},${rv})+...+C(${nv},${rv}) = ?`,steps:[`Hockey stick: Σ_{k=r}^{n} C(k,r) = C(n+1,r+1)`,...Array.from({length:nv-rv+1},(_,i)=>`  C(${rv+i},${rv}) = ${C(rv+i,rv)}`),`Sum = ${Array.from({length:nv-rv+1},(_,i)=>C(rv+i,rv)).reduce((a,b)=>a+b,0)}`,`C(${nv+1},${rv+1}) = ${ans} ✓`],ans:`${ans}`,ansL:`\\binom{${nv+1}}{${rv+1}}=${ans}`};},
      ()=>{const ans=nv*C(nv-1,rv-1);return{q:`Verify absorption: ${rv}·C(${nv},${rv}) = ${nv}·C(${nv-1},${rv-1}).`,steps:[`LHS: ${rv}·C(${nv},${rv}) = ${rv}·${C(nv,rv)} = ${rv*C(nv,rv)}`,`RHS: ${nv}·C(${nv-1},${rv-1}) = ${nv}·${C(nv-1,rv-1)} = ${ans}`,`Both = ${ans} ✓`,`Proof: ${rv}·n!/(r!(n-r)!) = n·(n-1)!/((r-1)!(n-r)!)`],ans:`${ans}`,ansL:`${ans}\\;✓`};},
      ()=>{const ans=C(2*nv,2);return{q:`Compute Σ_{k=0}^{${nv}} k² using combinatorial identity.`,steps:[`k² = k(k-1) + k = 2·C(k,2)+C(k,1)`,`Σk² = 2·ΣC(k,2)+ΣC(k,1) = 2·C(${nv+1},3)+C(${nv+1},2)`,`= 2·${C(nv+1,3)}+${C(nv+1,2)} = ${2*C(nv+1,3)+C(nv+1,2)}`,`Check: ${nv}(${nv}+1)(2·${nv}+1)/6 = ${Math.round(nv*(nv+1)*(2*nv+1)/6)} ✓`],ans:`${Math.round(nv*(nv+1)*(2*nv+1)/6)}`,ansL:`\\frac{${nv}\\cdot${nv+1}\\cdot${2*nv+1}}{6}=${Math.round(nv*(nv+1)*(2*nv+1)/6)}`};},
    ];
    const t=identities[n%identities.length]();
    return{question:t.q,questionLatex:t.q,steps:t.steps,answer:t.ans,answerLatex:t.ansL,tip:'Double counting: describe the same set two ways. Hockey stick, absorption, Vandermonde all have elegant two-way proofs.'};
  },
  number_theory:(n)=>{
    const primes=[5,7,11,13];const p=srP(primes,n);const k=srI(n+1,1,p-1);
    const val=C(p,k);const div=val%p===0;
    const luca_n=srI(n+2,p,p*p+p-1),luca_k=srI(n+3,1,p-1);
    const n0=luca_n%p,n1=Math.floor(luca_n/p);const k0=luca_k%p,k1=0;
    const lucaAns=(C(n1,k1)*C(n0,k0))%p;
    return{question:`(a) Show ${p} | C(${p},${k}). (b) Using Lucas: C(${luca_n},${luca_k}) mod ${p} = ?`,questionLatex:`(a)\\;${p}\\mid\\binom{${p}}{${k}},\\;(b)\\;\\binom{${luca_n}}{${luca_k}}\\pmod{${p}}`,steps:[`(a) C(${p},${k}) = ${val}. Is ${p}|${val}? ${val}/${p} = ${val/p} → ${div?'YES ✓':'No'} `,`Proof: p! in numerator, k!·(p-k)! in denominator`,`p is prime → p appears in numerator only → p | C(p,k) ✓`,`(b) Lucas: ${luca_n} in base ${p}: ${n1}·${p}+${n0}`,`${luca_k} in base ${p}: 0·${p}+${luca_k}`,`C(${luca_n},${luca_k}) ≡ C(${n1},0)·C(${n0},${luca_k}) = ${C(n1,0)}·${C(n0,luca_k)} = ${lucaAns} (mod ${p})`],answer:`(a) ${val} = ${p}×${val/p} ✓. (b) ${lucaAns} mod ${p}`,answerLatex:`\\binom{${luca_n}}{${luca_k}}\\equiv${lucaAns}\\pmod{${p}}`,tip:"Lucas: write n and k in base p. C(n,k) mod p = product of C(nᵢ,kᵢ) mod p."};
  },
  approximation:(n)=>{
    const templates=[
      (s)=>{const b=srI(s,1,5)/100;const ans=1+b;return{q:`Approximate (1+${b.toFixed(2)})^1 to 1st order.`,steps:[`(1+x)¹ ≈ 1+x exactly`,`= ${ans.toFixed(4)}`],ans:fmt(ans,4),ansL:`1+${b.toFixed(2)}=${ans.toFixed(4)}`};},
      (s)=>{const b=srI(s,1,5)/1000;const nv=-1;const ans=1+nv*b;return{q:`Approximate (1+${b.toFixed(3)})^{-1} to first order.`,steps:[`(1+x)^{-1} ≈ 1-x for small x`,`≈ 1-${b.toFixed(3)} = ${ans.toFixed(4)}`],ans:ans.toFixed(4),ansL:`\\approx${ans.toFixed(4)}`};},
      (s)=>{const b=srI(s,1,3)/100;const nv=0.5;const ans=1+nv*b-b*b/8;return{q:`Approximate √(1+${b.toFixed(2)}) to 2nd order.`,steps:[`(1+x)^{1/2} ≈ 1+x/2-x²/8`,`x=${b.toFixed(2)}`,`≈ 1+${(b/2).toFixed(4)}-${(b*b/8).toFixed(6)} ≈ ${ans.toFixed(4)}`],ans:ans.toFixed(4),ansL:`\\approx${ans.toFixed(4)}`};},
      (s)=>{const k=srI(s,50,200);return{q:`Estimate (1+1/${k})^${k} to 2 decimal places.`,steps:[`(1+x)^n with x=1/${k}=small`,`Use: (1+1/n)^n → e as n→∞`,`For n=${k}: (1+1/${k})^${k} ≈ e ≈ 2.718`,`More precise: e(1-1/(2n)) ≈ ${fmt(Math.pow(1+1/k,k),4)}`],ans:fmt(Math.pow(1+1/k,k),4),ansL:`\\approx ${fmt(Math.pow(1+1/k,k),4)}\\approx e`};},
    ];
    const t=templates[n%templates.length](n*13+5);
    return{question:t.q,questionLatex:t.q,steps:t.steps,answer:t.ans,answerLatex:t.ansL,tip:'First order: (1+x)^n ≈ 1+nx. Second order adds n(n-1)x²/2. Valid only for |x|≪1.'};
  },
};

// ── QUIZ Generators — Tough MCQ (4 options, 1 correct) ─────────
const QUIZ_GENERATORS = {
  pascal:(n)=>{
    const templates=[
      (s)=>{const row=srI(s,5,10);const r=srI(s+1,2,row-2);const correct=C(row,r);const wrong=[correct+1,correct-1,C(row,r+1),C(row+1,r)].filter(x=>x!==correct).slice(0,3);return{q:`What is C(${row},${r}) — the entry at row ${row}, position ${r} in Pascal's Triangle?`,opts:shuffle([correct,...wrong.slice(0,3)],s),correct};},
      (s)=>{const n=srI(s,4,9);const sum=Math.pow(2,n);const wrong=[sum-1,sum+1,Math.pow(2,n-1),n*(n+1)/2];return{q:`What is the sum of ALL entries in row ${n} of Pascal's Triangle?`,opts:shuffle([sum,...wrong.filter(x=>x!==sum).slice(0,3)],s),correct:sum};},
      (s)=>{const n=srI(s,4,8),r=srI(s+1,1,n-1);const correct=C(n,r);const id=C(n-1,r-1)+C(n-1,r);return{q:`Pascal's Identity: C(${n-1},${r-1}) + C(${n-1},${r}) = ?`,opts:shuffle([id,id-1,id+2,C(n+1,r)],s),correct:id};},
      (s)=>{const n=srI(s,5,8);const correct=C(n,Math.floor(n/2));return{q:`Which binomial coefficient C(${n},r) is the LARGEST in row ${n}?`,opts:shuffle([correct,C(n,Math.floor(n/2)-1),C(n,Math.floor(n/2)+1),C(n,1)],s),correct};},
    ];
    const t=templates[n%templates.length](n*31+17);
    return{...t,tip:`Pascal: C(n,r)=C(n-1,r-1)+C(n-1,r). Row n sums to 2ⁿ.`};
  },
  theorem:(n)=>{
    const templates=[
      (s)=>{const pw=srI(s,4,8);const correct=pw+1;return{q:`How many terms are in the expansion of (a+b)^${pw}?`,opts:shuffle([pw+1,pw,pw-1,pw+2],s),correct};},
      (s)=>{const pw=srI(s,4,7);const r=srI(s+1,1,pw-1);const correct=C(pw,r);return{q:`The coefficient of a^${pw-r}b^${r} in (a+b)^${pw} is?`,opts:shuffle([correct,C(pw,r+1),C(pw,r-1),C(pw+1,r)],s),correct};},
      (s)=>{const pw=srI(s,3,6);return{q:`In (x−y)^${pw}, the sum of all coefficients (set x=y=1) equals?`,opts:shuffle([0,Math.pow(2,pw),Math.pow(2,pw-1),pw],s),correct:0};},
      (s)=>{const pw=srI(s,4,7);const r=srI(s+1,2,pw-2);const a=srP([2,3],s+2),b=srP([1,2],s+3);const correct=C(pw,r)*Math.pow(a,pw-r)*Math.pow(b,r);return{q:`Find the coefficient of x^${pw-r}y^${r} in (${a}x+${b}y)^${pw}.`,opts:shuffle([correct,C(pw,r)*Math.pow(a,r)*Math.pow(b,pw-r),C(pw,r+1)*Math.pow(a,pw-r-1)*Math.pow(b,r+1),C(pw,r)*a*b],s),correct};},
    ];
    const t=templates[n%templates.length](n*37+11);
    return{...t,tip:`T_{r+1}=C(n,r)a^{n-r}b^r. Number of terms = n+1.`};
  },
  general_term:(n)=>{
    const templates=[
      (s)=>{const pw=srI(s,5,9);const term=srI(s+1,2,pw);const correct=C(pw,term-1);return{q:`In (a+b)^${pw}, what is the coefficient in T_${term}?`,opts:shuffle([correct,C(pw,term),C(pw,term-2),C(pw+1,term-1)],s),correct};},
      (s)=>{const pw=srI(s,4,8);const r=srI(s+1,1,pw-1);return{q:`For the term T_{${r+1}} in (x+y)^${pw}, what is the power of y?`,opts:shuffle([r,r-1,r+1,pw-r],s),correct:r};},
      (s)=>{const pw=srI(s,5,8);const pa=2,pb=1;const rSol=pa*pw/(pa+pb);const rInt=Number.isInteger(rSol)?rSol:null;if(!rInt)return QUIZ_GENERATORS.general_term(n+1).templates?.[0]?.(n*13)||{q:'',opts:[],correct:0};const correct=C(pw,rInt);return{q:`Find the constant term in (x^2 + 1/x)^${pw}.`,opts:shuffle([correct,C(pw,rInt+1),C(pw,rInt-1),C(pw,rInt)*2],s),correct};},
      (s)=>{const pw=srI(s,4,7);const r=srI(s+1,1,pw-1);return{q:`In (a+b)^${pw}, what value of r gives T_${r+1} with equal powers of a and b (if pw even)?`,opts:shuffle([pw/2|0,pw/2+1|0,r,pw],s),correct:pw/2|0};},
    ];
    const t=templates[n%templates.length](n*41+13);
    return{...t,tip:`T_{r+1}=C(n,r)a^{n-r}b^r. Power of b=r, power of a=n-r.`};
  },
  middle_term:(n)=>{
    const templates=[
      (s)=>{const pw=srI(s,4,10)*2;const mid=pw/2;const correct=C(pw,mid);return{q:`What is the coefficient of the middle term in (x+y)^${pw}?`,opts:shuffle([correct,C(pw,mid-1),C(pw,mid+1),C(pw+2,mid)],s),correct};},
      (s)=>{const pw=srI(s,3,7)*2+1;const m1=(pw+1)/2,m2=(pw+3)/2;return{q:`How many middle terms does (a+b)^${pw} have?`,opts:shuffle([2,1,3,0],s),correct:2};},
      (s)=>{const pw=srI(s,4,8)*2;const mid=pw/2;const pos=mid+1;return{q:`The middle term of (a+b)^${pw} is T_?`,opts:shuffle([pos,pos-1,pos+1,pw+1-pos],s),correct:pos};},
      (s)=>{const pw=6;const correct=20;return{q:`Find the middle term of (x+y)^6 (value of C(6,3)).`,opts:shuffle([20,15,10,6],s),correct};},
    ];
    const t=templates[n%templates.length](n*43+7);
    return{...t,tip:`n even → 1 middle term at T_{n/2+1}. n odd → 2 middle terms.`};
  },
  term_indep:(n)=>{
    const templates=[
      (s)=>{const pw=srI(s,4,8);const pa=srI(s+1,1,3),pb=srI(s+2,1,2);const rSol=pa*pw/(pa+pb);const rInt=Number.isInteger(rSol)?rSol:-1;if(rInt<0||rInt>pw)return{q:'',opts:[0,1,2,3],correct:0};const correct=C(pw,rInt);return{q:`The constant term in (x^${pa}+x^{-${pb}})^${pw} is?`,opts:shuffle([correct,C(pw,rInt+1)||0,C(pw,Math.max(0,rInt-1)),C(pw+1,rInt)],s),correct};},
      (s)=>{const pw=srI(s,4,9);const r=srI(s+1,2,pw-2);const correct=r;return{q:`For (x^2+1/x)^${pw}, we set the power of x to 0. What value of r gives the constant term? (2(${pw}-r)-r=0)`,opts:shuffle([Math.round(2*pw/3),Math.round(2*pw/3)+1,Math.round(2*pw/3)-1,pw-r],s),correct:Math.round(2*pw/3)};},
      (s)=>{const pw=8;const correct=C(8,4);return{q:`In (x+1/x)^8, the term independent of x equals C(8,r). What is r?`,opts:shuffle([4,3,5,2],s),correct:4};},
      (s)=>{const pw=srI(s,5,9);const correct=C(pw,pw/2|0);return{q:`If the constant term in (x^2+1/x)^${pw} exists and equals C(${pw},r), then the constant term value is?`,opts:shuffle([correct,correct+C(pw,1),C(pw,(pw/2|0)+1),C(pw,(pw/2|0)-1)],s),correct};},
    ];
    const t=templates[n%templates.length](n*47+19);
    return{...t,tip:`Write power of x as f(r), set f(r)=0, solve for r.`};
  },
  greatest_term:(n)=>{
    const templates=[
      (s)=>{const pw=srI(s,4,8),x=srI(s+1,1,3)/4;const rawR=(pw+1)*x/(1+x);const rF=Math.floor(rawR);return{q:`For (1+${x})^${pw}, the greatest term occurs at r=?`,opts:shuffle([rF,rF+1,rF-1,Math.ceil(rawR)],s),correct:rF};},
      (s)=>{const pw=srI(s,5,8);const x=0.5;const rawR=(pw+1)*x/(1+x);const rF=Math.floor(rawR);const correct=C(pw,rF)*Math.pow(x,rF);return{q:`What is |T_{${rF+1}}| in (1+0.5)^${pw}? (Greatest term)`,opts:shuffle([Math.round(correct*100)/100,Math.round(C(pw,rF+1)*Math.pow(x,rF+1)*100)/100,Math.round(C(pw,rF-1)*Math.pow(x,rF-1)*100)/100,Math.round(correct*1.5*100)/100],s),correct:Math.round(correct*100)/100};},
      (s)=>{return{q:`The formula for greatest term position in (1+x)^n is r_max = floor((n+1)|x|/(1+|x|)). For n=10, x=1/2, r_max=?`,opts:shuffle([Math.floor(11*0.5/1.5),Math.ceil(11*0.5/1.5),Math.floor(10*0.5/1.5),Math.floor(11*0.5/2)],s),correct:Math.floor(11*0.5/1.5)};},
      (s)=>{const pw=srI(s,5,9);return{q:`When does a binomial expansion have two equal greatest terms?`,opts:shuffle(['When r_max is an exact integer','When n is even','When x=1','When n is odd'],s),correct:'When r_max is an exact integer'};},
    ];
    const t=templates[n%templates.length](n*53+23);
    return{...t,tip:`r_max = floor((n+1)|x|/(1+|x|)). Integer r_max → two equal greatest terms.`};
  },
  binom_coeffs:(n)=>{
    const templates=[
      (s)=>{const pw=srI(s,4,9);const correct=Math.pow(2,pw);return{q:`C(${pw},0)+C(${pw},1)+…+C(${pw},${pw}) = ?`,opts:shuffle([correct,correct/2,correct*2,correct-1],s),correct};},
      (s)=>{const pw=srI(s,4,9);const correct=pw*Math.pow(2,pw-1);return{q:`Σ r·C(${pw},r) for r=0..${pw} = ?`,opts:shuffle([correct,Math.pow(2,pw),correct/2,(pw+1)*Math.pow(2,pw-1)],s),correct};},
      (s)=>{const pw=srI(s,4,8);const correct=C(2*pw,pw);return{q:`Σ [C(${pw},r)]² for r=0..${pw} = ?`,opts:shuffle([correct,Math.pow(2,pw),C(2*pw,pw+1),C(2*pw-1,pw)],s),correct};},
      (s)=>{const pw=srI(s,5,9);const correct=Math.pow(2,pw-1);return{q:`C(${pw},1)+C(${pw},3)+C(${pw},5)+… (odd-indexed) = ?`,opts:shuffle([correct,Math.pow(2,pw),correct*2,correct-1],s),correct};},
    ];
    const t=templates[n%templates.length](n*59+29);
    return{...t,tip:`Sum=2ⁿ (x=1), Alt=0 (x=-1), Weighted=n·2^{n-1} (diff+x=1).`};
  },
  multinomial:(n)=>{
    const templates=[
      (s)=>{const pw=srI(s,3,6);const p=srI(s+1,0,pw),q=srI(s+2,0,pw-p),r=pw-p-q;const correct=Math.round(fact(pw)/(fact(p)*fact(q)*fact(r)));return{q:`Coefficient of x^${p}y^${q}z^${r} in (x+y+z)^${pw}?`,opts:shuffle([correct,correct+1,C(pw,p),Math.round(fact(pw)/(fact(p+1)*fact(q)*fact(r-1)))],s),correct};},
      (s)=>{const pw=srI(s,3,7);const correct=Math.round((pw+1)*(pw+2)/2);return{q:`Total distinct terms in (x+y+z)^${pw} = ?`,opts:shuffle([correct,pw*pw,pw+1,(pw+1)*(pw+2)],s),correct};},
      (s)=>{const k=srI(s,2,5),pw=srI(s+1,2,5);const correct=Math.pow(k,pw);return{q:`Sum of all coefficients in (x₁+x₂+…+x_${k})^${pw} (set all xᵢ=1)?`,opts:shuffle([correct,Math.pow(2,pw*k),Math.pow(k,pw-1),k*pw],s),correct};},
      (s)=>{const pw=5,p=2,q=2,r=1;const correct=Math.round(fact(pw)/(fact(p)*fact(q)*fact(r)));return{q:`In (a+b+c)^5, find coefficient of a²b²c.`,opts:shuffle([correct,C(5,2),Math.round(fact(5)/(fact(2)*fact(3))),20],s),correct};},
    ];
    const t=templates[n%templates.length](n*61+31);
    return{...t,tip:`Multinomial coeff = n!/(p!q!r!). Terms in (x+y+z)^n = C(n+2,2).`};
  },
  any_index:(n)=>{
    const templates=[
      (s)=>{const r=srI(s,2,4);const nv=srP(['-1','-2','1/2'],s);const coeff=nv==='-1'?Math.pow(-1,r):nv==='-2'?(r+1)*Math.pow(-1,r):nv==='1/2'&&r===2?-1/8:nv==='1/2'&&r===3?1/16:NaN;if(isNaN(coeff))return{q:'',opts:[0,1,2,3],correct:0};const correct=fmt(coeff,4);return{q:`Coefficient of x^${r} in (1+x)^{${nv}}?`,opts:shuffle([correct,fmt(coeff*2,4),fmt(Math.abs(coeff),4),fmt(coeff+1,4)],s),correct};},
      (s)=>{return{q:`For (1+x)^{-1}=1-x+x²-x³+…, what is the coefficient of x^5?`,opts:shuffle(['-1','1','-2','2'],s),correct:'-1'};},
      (s)=>{return{q:`(1+x)^n as infinite series is valid when?`,opts:shuffle(['|x|<1','|x|≤1','|x|>1','n is negative'],s),correct:'|x|<1'};},
      (s)=>{const nv=srI(s,2,5);return{q:`In the expansion of (1-x)^{-${nv}}, the coefficient of xʳ is?`,opts:shuffle([`C(r+${nv}-1,r)`,`C(r+${nv},r)`,`C(r,${nv})`,`(-1)^r·C(r+${nv}-1,r)`],s),correct:`C(r+${nv}-1,r)`};},
    ];
    const t=templates[n%templates.length](n*67+37);
    return{...t,tip:`Any index: coeff of xʳ = n(n-1)…(n-r+1)/r!. Valid |x|<1.`};
  },
  remainder:(n)=>{
    const templates=[
      (s)=>{const base=srP([3,7,9,11],s),div=srP([8,4,9],s+1);const pw=srI(s+2,20,100);const offset=base%div;const rem=Math.pow(offset,pw)%div;return{q:`Remainder when ${base}^${pw} ÷ ${div}?`,opts:shuffle([rem,(rem+1)%div,(rem+div-1)%div,(rem+2)%div],s),correct:rem};},
      (s)=>{return{q:`(1+8)^{100} mod 64. What is the remainder?`,opts:shuffle([1,0,8,64],s),correct:1};},
      (s)=>{return{q:`6^n mod 5 for any positive integer n is always?`,opts:shuffle([1,6,0,4],s),correct:1};},
      (s)=>{const pw=srI(s,10,50);const rem=Math.pow(2,pw)%3===1?1:Math.pow(2,pw)%3;return{q:`2^${pw} mod 3 = ? (Note: 2≡-1 mod 3)`,opts:shuffle([Math.pow(2,pw)%3,0,1,2].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4),s),correct:Math.pow(2,pw)%3};},
    ];
    const t=templates[n%templates.length](n*71+41);
    return{...t,tip:`Write base=(kN+r), expand, all terms with kN divisible by N.`};
  },
  vandermonde:(n)=>{
    const templates=[
      (s)=>{const m=srI(s,2,5),nv=srI(s+1,2,5),r=srI(s+2,1,Math.min(m,nv));const correct=C(m+nv,r);return{q:`Vandermonde: Σ C(${m},k)C(${nv},${r}-k) = ?`,opts:shuffle([correct,C(m+nv,r+1),C(m+nv-1,r),C(m+nv,r-1)],s),correct};},
      (s)=>{const nv=srI(s,2,6);const correct=C(2*nv,nv);return{q:`Σ [C(${nv},k)]² for k=0..${nv} = C(?,?)`,opts:shuffle([`C(${2*nv},${nv})`,`C(${2*nv},${nv+1})`,`C(${nv+1},${nv})`,`C(${2*nv-1},${nv})`],s),correct:`C(${2*nv},${nv})`};},
      (s)=>{return{q:`Vandermonde's Identity is proved by comparing coefficients in?`,opts:shuffle(['(1+x)^m·(1+x)^n=(1+x)^{m+n}','(1+x+y)^n','Differentiating (1+x)^n','Pascal\'s Identity'],s),correct:'(1+x)^m·(1+x)^n=(1+x)^{m+n}'};},
      (s)=>{const r=3,m=4,nv=4;const correct=C(m+nv,r);return{q:`Σ C(4,k)·C(4,3-k) for k=0..3 = ?`,opts:shuffle([correct,C(8,4),C(7,3),C(9,3)],s),correct};},
    ];
    const t=templates[n%templates.length](n*73+43);
    return{...t,tip:`Vandermonde: Σ C(m,k)C(n,r-k)=C(m+n,r). Special: Σ C(n,k)²=C(2n,n).`};
  },
  calculus_binom:(n)=>{
    const templates=[
      (s)=>{const pw=srI(s,4,9);const correct=pw*Math.pow(2,pw-1);return{q:`Σ r·C(${pw},r) for r=0..${pw} = ?`,opts:shuffle([correct,Math.pow(2,pw),pw*Math.pow(2,pw),correct/2],s),correct};},
      (s)=>{const pw=srI(s,3,7);const correct=fmt((Math.pow(2,pw+1)-1)/(pw+1),4);return{q:`∫₀¹(1+x)^${pw}dx = ?`,opts:shuffle([correct,fmt((Math.pow(2,pw+1))/(pw+1),4),fmt((Math.pow(2,pw)-1)/(pw+1),4),fmt(1/(pw+1),4)],s),correct};},
      (s)=>{return{q:`Differentiating (1+x)^n = ΣC(n,r)xʳ and setting x=1 gives?`,opts:shuffle(['n·2^{n-1}=ΣrC(n,r)','n=ΣrC(n,r)','2^n=ΣrC(n,r)','n·2^n=ΣrC(n,r)'],s),correct:'n·2^{n-1}=ΣrC(n,r)'};},
      (s)=>{const pw=srI(s,4,8);const correct=pw*(pw+1)*Math.pow(2,pw-2);return{q:`Σ r²·C(${pw},r) = n(n+1)2^{n-2}. For n=${pw}, answer?`,opts:shuffle([correct,pw*(pw-1)*Math.pow(2,pw-2),pw*pw*Math.pow(2,pw-1),correct+Math.pow(2,pw-1)],s),correct};},
    ];
    const t=templates[n%templates.length](n*79+47);
    return{...t,tip:`Diff at x=1 → n·2^{n-1}=ΣrCᵣ. Int 0→1 → (2^{n+1}-1)/(n+1)=Σ Cᵣ/(r+1).`};
  },
  complex_binom:(n)=>{
    const templates=[
      (s)=>{const pw=srI(s,3,9);const cos_v=Math.cos(pw*Math.PI/3);const correct=Math.round((Math.pow(2,pw)+2*cos_v)/3);return{q:`C(${pw},0)+C(${pw},3)+C(${pw},6)+… = ?`,opts:shuffle([correct,correct+1,correct-1,Math.round(Math.pow(2,pw)/3)],s),correct};},
      (s)=>{return{q:`For ω = e^{2πi/3}, what is 1+ω+ω²?`,opts:shuffle([0,1,-1,3],s),correct:0};},
      (s)=>{const pw=srI(s,4,9);const cos_v=Math.cos(pw*Math.PI/3);const s1=Math.round((Math.pow(2,pw)+2*cos_v)/3);const s0=Math.pow(2,pw)-s1*2;return{q:`Using roots of unity, C(${pw},1)+C(${pw},4)+C(${pw},7)+… = ?`,opts:shuffle([s0,s0+1,s0-1,Math.round(Math.pow(2,pw)/3)],s),correct:s0};},
      (s)=>{return{q:`The root of unity filter for extracting every 3rd term uses ω where ω³=?`,opts:shuffle([1,-1,0,'i'],s),correct:1};},
    ];
    const t=templates[n%templates.length](n*83+53);
    return{...t,tip:`Sum of every kth term via ωᵏ=1 filter: (1+1)^n+(1+ω)^n+…, divide by k.`};
  },
  double_count:(n)=>{
    const templates=[
      (s)=>{const nv=srI(s,4,9),r=srI(s+1,1,nv-1);const correct=C(nv+1,r+1);return{q:`Hockey Stick: Σ_{k=0}^{${nv}} C(k,${r}) = ?`,opts:shuffle([correct,C(nv+1,r),C(nv,r+1),C(nv+2,r+1)],s),correct};},
      (s)=>{const nv=srI(s,4,9),r=srI(s+1,1,nv-1);const lhs=r*C(nv,r);const rhs=nv*C(nv-1,r-1);return{q:`Absorption identity: ${r}·C(${nv},${r}) = ${nv}·C(?,?)`,opts:shuffle([`C(${nv-1},${r-1})`,`C(${nv},${r-1})`,`C(${nv-1},${r})`,`C(${nv+1},${r})`],s),correct:`C(${nv-1},${r-1})`};},
      (s)=>{const nv=srI(s,3,6);const correct=C(2*nv,nv+1);return{q:`Upper summation: Σ_{k=0}^{${nv}} C(k+${nv-1},k) = ?`,opts:shuffle([correct,C(2*nv,nv),C(2*nv-1,nv),correct+1],s),correct};},
      (s)=>{return{q:`Double counting means proving an identity by?`,opts:shuffle(['Counting the same set two different ways','Differentiating twice','Using complex numbers','Applying induction'],s),correct:'Counting the same set two different ways'};},
    ];
    const t=templates[n%templates.length](n*89+59);
    return{...t,tip:`Hockey: Σ C(k,r)=C(n+1,r+1). Absorption: r·C(n,r)=n·C(n-1,r-1).`};
  },
  number_theory:(n)=>{
    const templates=[
      (s)=>{const p=srP([5,7,11,13],s),k=srI(s+1,1,p-1);const val=C(p,k);return{q:`Is C(${p},${k})=${val} divisible by ${p}?`,opts:shuffle(['Yes, always for prime p and 0<k<p','No','Only if k<p/2','Only if p>7'],s),correct:'Yes, always for prime p and 0<k<p'};},
      (s)=>{return{q:`(1+x)^p ≡ ? (mod p) for prime p — Freshman's Dream`,opts:shuffle(['1+xᵖ','1+px','(1+x)','xᵖ'],s),correct:'1+xᵖ'};},
      (s)=>{const p=7,n_=13,k_=6;const n0=n_%p,n1=Math.floor(n_/p);const k0=k_%p,k1=Math.floor(k_/p);const correct=C(n0,k0)*C(n1,k1)%p;return{q:`Lucas: C(${n_},${k_}) mod ${p}. Write in base ${p}: ${n_}=${n1}·${p}+${n0}, ${k_}=0·${p}+${k_}. Answer?`,opts:shuffle([correct,(correct+1)%p,(correct+2)%p,(correct+p-1)%p],s),correct};},
      (s)=>{return{q:`For prime p, how many of C(p,1), C(p,2), …, C(p,p-1) are divisible by p?`,opts:shuffle(['All of them (p-1 terms)','None','Half of them','Only C(p,(p-1)/2)'],s),correct:'All of them (p-1 terms)'};},
    ];
    const t=templates[n%templates.length](n*97+61);
    return{...t,tip:`p prime → p|C(p,k) for 0<k<p. Lucas: C(n,k)≡∏C(nᵢ,kᵢ) mod p.`};
  },
  approximation:(n)=>{
    const templates=[
      (s)=>{const b=0.01;const nv=3;const correct=1+nv*b;return{q:`First-order approximation of (1.01)^3?`,opts:shuffle([fmt(correct,4),fmt(1+3*0.01+3*0.0001+0.000001,6),fmt(1+2*b,4),fmt(correct+0.01,4)],s),correct:fmt(correct,4)};},
      (s)=>{const b=0.002;const nv=-1;const correct=1-b;return{q:`(1+0.002)^{-1} ≈ ? (first order)`,opts:shuffle([fmt(correct,4),fmt(1+b,4),fmt(1-2*b,4),fmt(correct-b,4)],s),correct:fmt(correct,4)};},
      (s)=>{return{q:`Binomial approximation (1+x)^n≈1+nx is valid when?`,opts:shuffle(['|x|≪1 and any n','x<0','n is integer only','|x|>1'],s),correct:'|x|≪1 and any n'};},
      (s)=>{return{q:`√(1+x) ≈ 1+x/2 is the approximation for small x. Second order correction is?`,opts:shuffle(['-x²/8','+x²/8','-x²/4','+x²/4'],s),correct:'-x²/8'};},
    ];
    const t=templates[n%templates.length](n*101+67);
    return{...t,tip:`(1+x)^n≈1+nx for |x|≪1. Second order: add n(n-1)x²/2.`};
  },
};

function shuffle(arr,seed){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(sr(seed*i+i)*( i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
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
  }, []);
}

// ── Cover Screen ───────────────────────────────────────────────
function CoverScreen({ onNext }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [300, 900, 1600].map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => ts.forEach(clearTimeout);
  }, []);
  const floaters = ['C(n,r)','2ⁿ','T_{r+1}','∑Cᵣ','nCr','(a+b)ⁿ','Pascal','ω'];
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', background:`radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.09) 0%, transparent 65%), #07090f`, textAlign:'center' }}>
      {floaters.map((s, i) => (
        <div key={s} style={{ position:'fixed', pointerEvents:'none', fontSize:14+(i%3)*7, color:`rgba(99,102,241,${0.04+(i%4)*0.02})`, top:`${8+i*11}%`, left:i%2===0?`${2+i*4}%`:`${74+i*2}%`, fontFamily:'JetBrains Mono,monospace', animation:`pulse ${3+i*0.6}s ease-in-out infinite`, animationDelay:`${i*0.25}s` }}>{s}</div>
      ))}
      <div style={{ opacity:phase>=1?1:0, transform:phase>=1?'translateY(0)':'translateY(12px)', transition:'all 0.6s ease', marginBottom:20, display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:40 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:ACCENT, animation:'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize:12, color:ACCENT, letterSpacing:'2px', textTransform:'uppercase', fontFamily:'Crimson Pro, serif' }}>Mathematics · Chapter 4</span>
      </div>
      <div style={{ opacity:phase>=2?1:0, transform:phase>=2?'translateY(0)':'translateY(20px)', transition:'all 0.7s ease 0.1s', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:'clamp(36px, 10vw, 88px)', color:'#fff', letterSpacing:'-3px', lineHeight:0.92, marginBottom:0 }}>
          Binomial<br /><span style={{ color:ACCENT }}>Theorem</span>
        </h1>
        <div style={{ height:3, width:80, background:`linear-gradient(90deg, ${ACCENT}, transparent)`, margin:'16px auto 0', borderRadius:2 }} />
      </div>
      <div style={{ opacity:phase>=3?1:0, transition:'all 0.6s ease', maxWidth:560, marginBottom:40 }}>
        <p style={{ fontFamily:'Crimson Pro, serif', fontSize:19, color:'rgba(255,255,255,0.7)', lineHeight:1.55, marginBottom:18, fontStyle:'italic' }}>
          "(a+b)ⁿ = ΣC(n,r)aⁿ⁻ʳbʳ — a single formula that unlocks combinatorics, number theory, and analysis."
        </p>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 24px', textAlign:'left' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:12, fontFamily:'JetBrains Mono, monospace' }}>Chapter Overview</div>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>
            From Pascal's Triangle and the Binomial Theorem through JEE-level manipulation — greatest terms, divisibility tricks, multinomial theorem — to Olympiad territory: Vandermonde's Identity, calculus proofs, complex number filters, double counting, Lucas's theorem, and approximation techniques.
          </p>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:20 }}>
          {['Class 11 → Olympiad','16 Topics','∞ Practice','Quiz-Gated Progress'].map(t => (
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
    { title:'Core Binomial Symbols', color:ACCENT, rows:NOTATION.slice(0,6) },
    { title:'Coefficient Identities', color:'#8B5CF6', rows:NOTATION.slice(6,12) },
    { title:'Olympiad Tools', color:'#06B6D4', rows:NOTATION.slice(12,17) },
    { title:'Number Theory & Series', color:'#34D399', rows:NOTATION.slice(17) },
  ];
  return (
    <div style={{ minHeight:'100vh', background:'#07090f', padding:'32px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:32, opacity:revealed?1:0, transition:'opacity 0.5s ease' }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:10 }}>Before We Begin</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:34, color:'#fff', letterSpacing:'-1px', marginBottom:10 }}>Notation Guide</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>These symbols form the complete language of the Binomial Theorem — from basic C(n,r) to advanced roots-of-unity filters.</p>
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
          <p style={{ fontFamily:'Crimson Pro,serif', fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>When you click <strong style={{color:'#fff'}}>Done</strong> on any topic, you'll face <strong style={{color:ACCENT}}>4 tough questions</strong>. Answer all 4 correctly to unlock the next topic. Wrong answer? Review and retry — mastery is required to advance.</p>
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
  const levels = ['Foundation','JEE','Olympiad'];
  const lColors = { Foundation:'#6366F1', JEE:'#06B6D4', Olympiad:'#8B5CF6' };
  const lDesc = { Foundation:'Class 11 · Core concepts', JEE:'JEE Mains & Advanced', Olympiad:'RMO · INMO · IMO' };
  return (
    <div style={{ minHeight:'100vh', background:'#07090f', padding:'28px 16px 60px' }}>
      <div style={{ maxWidth:660, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:ACCENT, textTransform:'uppercase', letterSpacing:'2px', fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>Chapter · Binomial Theorem</div>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:30, color:'#fff', letterSpacing:'-0.8px', marginBottom:6 }}>Choose a Topic</h2>
          <p style={{ fontFamily:'Crimson Pro, serif', fontSize:15, color:'rgba(255,255,255,0.4)', marginBottom:14 }}>Pass the quiz gate to unlock each next topic.</p>
          <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(completedIds.size/SECTIONS.length)*100}%`, background:`linear-gradient(90deg,${ACCENT},#8B5CF6)`, borderRadius:4, transition:'width 0.5s ease' }} />
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
              {SECTIONS.filter(s => s.level === level).map((sec, si) => {
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
  const lColors = { Foundation:'#6366F1', JEE:'#06B6D4', Olympiad:'#8B5CF6' };
  const col = lColors[section.level] || ACCENT;
  return (
    <div style={{ minHeight:'100vh', background:'#07090f', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(7,9,15,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px', display:'flex', alignItems:'center', gap:12 }}>
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
            {section.diagram === 'pascal' && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:12, overflowX:'auto' }}>
                <PascalSVG rows={7} color={col} size={320} />
              </div>
            )}
            {section.diagram === 'expansion' && (
              <div style={{ marginBottom:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'JetBrains Mono,monospace', textAlign:'center', marginBottom:8, textTransform:'uppercase', letterSpacing:'1px' }}>Expansion of (a+b)⁴</div>
                <ExpansionSVG n={4} color={col} size={320} />
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
  const lColors = { Foundation:'#6366F1', JEE:'#06B6D4', Olympiad:'#8B5CF6' };
  const col = lColors[section.level] || ACCENT;
  const gen = GENERATORS[section.genKey] || GENERATORS.pascal;
  const seed = baseSeed + qIdx * 97;
  const question = useCallback(() => { try { return gen(seed); } catch { return { question:'Loading…', steps:[], answer:'—', answerLatex:'—', tip:'' }; } }, [seed])();
  const next = () => { setQIdx(i => i+1); setShowAnswer(false); setShowSteps(false); setCount(c => c+1); };
  return (
    <div style={{ minHeight:'100vh', background:'#07090f', paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(7,9,15,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>← Learn</button>
          <div style={{ flex:1, fontFamily:'Playfair Display, serif', fontSize:14, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{section.title}</div>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:col, background:`${col}15`, padding:'4px 10px', borderRadius:20, flexShrink:0 }}>Q {count+1}</div>
          <button onClick={onStartQuiz} className="btn" style={{ background:`${col}20`, border:`1px solid ${col}55`, color:col, borderRadius:8, padding:'6px 13px', fontSize:13, fontWeight:700, flexShrink:0 }}>Done → Quiz ✓</button>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'Crimson Pro,serif', fontStyle:'italic' }}>Infinite practice · Click "Done → Quiz" when ready to unlock next topic</div>
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
  const lColors = { Foundation:'#6366F1', JEE:'#06B6D4', Olympiad:'#8B5CF6' };
  const col = lColors[section.level] || ACCENT;
  const [baseSeed] = useState(() => Math.floor(Math.random() * 7777));
  const TOTAL = 4;
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);

  const quizGen = QUIZ_GENERATORS[section.genKey] || QUIZ_GENERATORS.pascal;
  const qSeed = baseSeed + qIdx * 113;
  const question = useCallback(() => {
    let q; let tries = 0;
    do { try { q = quizGen(qSeed + tries * 7); } catch { q = null; } tries++; } while ((!q || !q.q || q.opts.length < 2) && tries < 10);
    if (!q || !q.q) return { q: `What is C(${3+qIdx},${1+qIdx%2})`, opts: [C(3+qIdx,1+qIdx%2), C(3+qIdx,1+qIdx%2)+1, C(3+qIdx,1+qIdx%2)-1, C(3+qIdx+1,1+qIdx%2)].filter((v,i,a)=>a.indexOf(v)===i), correct: C(3+qIdx,1+qIdx%2), tip: 'Use C(n,r) = n!/(r!(n-r)!).' };
    return q;
  }, [qSeed])();

  const opts = question.opts.slice(0, 4);
  const correctAnswer = question.correct;

  const confirm = () => {
    if (selected === null) return;
    const isCorrect = String(selected) === String(correctAnswer);
    setConfirmed(true);
    if (isCorrect) setScore(s => s + 1);
    else setShakeKey(k => k + 1);
    setResults(r => [...r, { correct: isCorrect, question: question.q }]);
  };

  const goNext = () => {
    if (qIdx + 1 >= TOTAL) {
      setFinished(true);
    } else {
      setQIdx(i => i + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  if (finished) {
    const passed = score === TOTAL;
    return (
      <div style={{ minHeight:'100vh', background:'#07090f', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', textAlign:'center' }}>
        <div className="pop-in" style={{ maxWidth:420, width:'100%' }}>
          {passed ? <TrophySVG col={col} /> : (
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ display:'block', margin:'0 auto' }}>
              <defs><radialGradient id="failG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EF4444" stopOpacity="0.25"/><stop offset="100%" stopColor="#EF4444" stopOpacity="0"/></radialGradient></defs>
              <circle cx="36" cy="36" r="36" fill="url(#failG)"/>
              <circle cx="36" cy="36" r="28" fill="none" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.4"/>
              <text x="36" y="44" textAnchor="middle" fontSize="32" fontFamily="JetBrains Mono" fill="#EF4444">✗</text>
            </svg>
          )}
          <div style={{ marginTop:20, fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:28, color:passed?'#fff':'#EF4444', marginBottom:10 }}>
            {passed ? 'Topic Mastered! 🎯' : `${score}/4 Correct`}
          </div>
          <div style={{ fontFamily:'Crimson Pro, serif', fontSize:16, color:'rgba(255,255,255,0.55)', marginBottom:24, lineHeight:1.6 }}>
            {passed ? `Perfect score! You've demonstrated mastery of "${section.title}". Advancing to the next topic.` : `You got ${score} out of ${TOTAL}. You need all 4 correct to advance. Review the topic and try again.`}
          </div>
          {results.map((r, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:r.correct?'rgba(52,211,153,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${r.correct?'rgba(52,211,153,0.2)':'rgba(239,68,68,0.2)'}`, borderRadius:8, marginBottom:6, textAlign:'left' }}>
              <span style={{ fontSize:16 }}>{r.correct?'✅':'❌'}</span>
              <span style={{ fontFamily:'Crimson Pro,serif', fontSize:13, color:'rgba(255,255,255,0.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Q{i+1}: {r.question.substring(0,60)}{r.question.length>60?'…':''}</span>
            </div>
          ))}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20 }}>
            {passed ? (
              <button onClick={onPass} className="btn" style={{ padding:'14px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>
                Continue to Next Topic →
              </button>
            ) : (
              <button onClick={onFail} className="btn" style={{ padding:'14px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#FCA5A5', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>
                Review Topic & Retry
              </button>
            )}
            <button onClick={onBack} className="btn" style={{ padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', borderRadius:12, fontFamily:'Crimson Pro,serif', fontSize:15 }}>
              ← Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#07090f', paddingBottom:60 }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(7,9,15,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <button onClick={onBack} className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 13px', fontSize:13 }}>✕ Exit Quiz</button>
          <div style={{ flex:1, fontFamily:'Playfair Display,serif', fontSize:15, color:'#fff', fontWeight:700 }}>Mastery Quiz: {section.title}</div>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, color:col }}>{qIdx+1}/{TOTAL}</div>
        </div>
        {/* Progress dots */}
        <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
          {Array.from({length:TOTAL},(_,i)=>(
            <div key={i} style={{ width:i===qIdx?28:10, height:10, borderRadius:5, background:i<qIdx?col:i===qIdx?col:'rgba(255,255,255,0.12)', transition:'all 0.3s ease', opacity:i<=qIdx?1:0.5 }} />
          ))}
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'24px 16px' }}>
        {/* Warning badge */}
        <div style={{ background:`${col}10`, border:`1px solid ${col}30`, borderRadius:10, padding:'8px 14px', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>🔐</span>
          <span style={{ fontFamily:'Crimson Pro,serif', fontSize:13, color:`${col}`, fontStyle:'italic' }}>Answer all {TOTAL} correctly to unlock the next topic. All questions are required.</span>
        </div>

        {/* Question */}
        <div key={qIdx} className="fade-up" style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${col}30`, borderRadius:16, padding:'20px 20px 24px', marginBottom:18 }}>
          <div style={{ fontSize:10, color:`${col}99`, textTransform:'uppercase', letterSpacing:'1.5px', fontFamily:'JetBrains Mono,monospace', marginBottom:12 }}>Question {qIdx+1} of {TOTAL}</div>
          <p style={{ fontFamily:'Crimson Pro,serif', fontSize:17, color:'#e2e8f0', lineHeight:1.75, marginBottom: question.questionLatex ? 14 : 0 }}>{question.q}</p>
          {question.questionLatex && question.questionLatex !== question.q && (
            <div style={{ background:`${col}0d`, border:`1px solid ${col}20`, borderRadius:10, padding:'10px 14px', overflowX:'auto' }}>
              <KTex l={question.questionLatex} style={{ color:col, fontSize:15 }} />
            </div>
          )}
        </div>

        {/* Options */}
        <div key={`opts-${shakeKey}`} style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }} className={confirmed && selected !== null && String(selected) !== String(correctAnswer) ? 'shake' : ''}>
          {opts.map((opt, i) => {
            const isSelected = String(selected) === String(opt);
            const isCorrect = String(opt) === String(correctAnswer);
            let bg = 'rgba(255,255,255,0.04)', border = '1px solid rgba(255,255,255,0.1)', color = 'rgba(255,255,255,0.8)';
            if (confirmed) {
              if (isCorrect) { bg = 'rgba(52,211,153,0.12)'; border = '1px solid rgba(52,211,153,0.5)'; color = '#34D399'; }
              else if (isSelected && !isCorrect) { bg = 'rgba(239,68,68,0.12)'; border = '1px solid rgba(239,68,68,0.5)'; color = '#FCA5A5'; }
            } else if (isSelected) { bg = `${col}18`; border = `1px solid ${col}66`; color = col; }
            return (
              <button key={i} onClick={() => !confirmed && setSelected(opt)} className={!confirmed ? 'btn' : ''} disabled={confirmed}
                style={{ background:bg, border, borderRadius:12, padding:'14px 18px', textAlign:'left', color, fontFamily:'Crimson Pro,serif', fontSize:16, display:'flex', alignItems:'center', gap:12, cursor:confirmed?'default':'pointer', transition:'all 0.15s ease' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:isSelected&&!confirmed?`${col}25`:confirmed&&isCorrect?'rgba(52,211,153,0.2)':confirmed&&isSelected?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)', border:`1px solid ${isSelected&&!confirmed?col+'66':confirmed&&isCorrect?'rgba(52,211,153,0.5)':confirmed&&isSelected?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:'JetBrains Mono,monospace', flexShrink:0, color:isSelected&&!confirmed?col:confirmed&&isCorrect?'#34D399':confirmed&&isSelected?'#FCA5A5':'rgba(255,255,255,0.4)' }}>
                  {confirmed ? (isCorrect ? '✓' : isSelected ? '✗' : ['A','B','C','D'][i]) : ['A','B','C','D'][i]}
                </div>
                <span>{String(opt)}</span>
              </button>
            );
          })}
        </div>

        {/* Tip after confirming */}
        {confirmed && question.tip && (
          <div className="fade-up" style={{ background:'rgba(255,209,102,0.06)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:10 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
            <p style={{ fontFamily:'Crimson Pro,serif', fontStyle:'italic', fontSize:14, color:'rgba(255,209,102,0.85)', lineHeight:1.6 }}>{question.tip}</p>
          </div>
        )}

        {/* Confirm / Next */}
        {!confirmed ? (
          <button onClick={confirm} disabled={selected === null} className="btn" style={{ width:'100%', padding:'14px', background:selected!==null?`linear-gradient(135deg,${col},${col}bb)`:'rgba(255,255,255,0.06)', border:selected!==null?'none':'1px solid rgba(255,255,255,0.1)', color:selected!==null?'#fff':'rgba(255,255,255,0.3)', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16, opacity:selected===null?0.6:1, cursor:selected===null?'not-allowed':'pointer' }}>
            Submit Answer
          </button>
        ) : (
          <button onClick={goNext} className="btn" style={{ width:'100%', padding:'14px', background:`linear-gradient(135deg,${col},${col}bb)`, color:'#fff', border:'none', borderRadius:12, fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>
            {qIdx+1 < TOTAL ? `Next Question (${qIdx+2}/${TOTAL}) →` : 'See Results →'}
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
  const nextSection = SECTIONS[activeIdx + 1] || null;

  const handlePass = () => {
    setCompletedIds(prev => new Set([...prev, activeSection.id]));
    if (nextSection) { setActiveIdx(activeIdx + 1); setScreen('learn'); }
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

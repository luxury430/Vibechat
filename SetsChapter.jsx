import { useState, useEffect, useRef, useCallback } from "react";

// ── KaTeX CDN ─────────────────────────────────────────────────
let _kDone = false; const _kCbs = [];
function _initKaTeX() {
  if (_kDone || window.katex || document.querySelector('[data-kx]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.setAttribute('data-kx','1');
  l.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
  document.head.appendChild(l);
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
  s.onload = () => { _kDone = true; _kCbs.forEach(f => f()); _kCbs.length = 0; };
  document.head.appendChild(s);
}
function onKaTeX(cb) { (_kDone || window.katex) ? cb() : _kCbs.push(cb); }

// ── Seeded Random Helpers ─────────────────────────────────────
const sr  = (n) => Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
const srI = (n, lo, hi) => Math.floor(sr(n) * (hi - lo + 1)) + lo;
const srP = (arr, n) => arr[Math.floor(sr(n) * arr.length)];
function genNums(seed, count, lo, hi) {
  const pool = Array.from({ length: hi - lo + 1 }, (_, i) => i + lo);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(sr(seed * 17 + i * 31) * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length)).sort((a, b) => a - b);
}
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const setStr = (arr) => `\\{${arr.join(', ')}\\}`;
const setTxt = (arr) => `{${arr.join(', ')}}`;

// ── KaTeX Renderer ────────────────────────────────────────────
function KTex({ l, block = false, style = {} }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(!!window.katex);
  useEffect(() => { if (!ready) onKaTeX(() => setReady(true)); }, []);
  useEffect(() => {
    if (ready && ref.current && l) {
      try { window.katex.render(l, ref.current, { throwOnError: false, displayMode: block, strict: false }); }
      catch { if (ref.current) ref.current.textContent = l; }
    }
  }, [ready, l, block]);
  if (!ready) return <span style={{ fontFamily: 'monospace', opacity: 0.8, ...style }}>{l}</span>;
  return <span ref={ref} style={style} />;
}

// ── Venn Diagram SVG ──────────────────────────────────────────
function VennSVG({ shade = 'union', labelA = 'A', labelB = 'B', size = 280 }) {
  const W = size, H = Math.round(size * 0.72);
  const cx1 = Math.round(W * 0.38), cx2 = Math.round(W * 0.62);
  const cy = Math.round(H * 0.5), r = Math.round(H * 0.38);
  const uid = shade + labelA + labelB;
  const hi = 'rgba(99,216,200,0.55)', dim = 'rgba(99,216,200,0.1)';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <mask id={`mA_${uid}`}>
          <rect x="0" y="0" width={W} height={H} fill="black" />
          <circle cx={cx1} cy={cy} r={r} fill="white" />
        </mask>
        <mask id={`mB_${uid}`}>
          <rect x="0" y="0" width={W} height={H} fill="black" />
          <circle cx={cx2} cy={cy} r={r} fill="white" />
        </mask>
        <mask id={`mAnotB_${uid}`}>
          <rect x="0" y="0" width={W} height={H} fill="black" />
          <circle cx={cx1} cy={cy} r={r} fill="white" />
          <circle cx={cx2} cy={cy} r={r} fill="black" />
        </mask>
        <mask id={`mBnotA_${uid}`}>
          <rect x="0" y="0" width={W} height={H} fill="black" />
          <circle cx={cx2} cy={cy} r={r} fill="white" />
          <circle cx={cx1} cy={cy} r={r} fill="black" />
        </mask>
        <mask id={`mComp_${uid}`}>
          <rect x="0" y="0" width={W} height={H} fill="white" />
          <circle cx={cx1} cy={cy} r={r} fill="black" />
        </mask>
        <mask id={`mSymDiff_${uid}`}>
          <rect x="0" y="0" width={W} height={H} fill="black" />
          <circle cx={cx1} cy={cy} r={r} fill="white" />
          <circle cx={cx2} cy={cy} r={r} fill="white" />
          <rect x="0" y="0" width={W} height={H} fill="black" mask={`url(#mA_${uid})`} />
        </mask>
      </defs>
      {/* Universal set border */}
      <rect x="4" y="4" width={W-8} height={H-8}
        fill={shade === 'complement' ? hi : 'rgba(255,255,255,0.02)'}
        stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" rx="10" />
      {/* Base circles (dim) */}
      <circle cx={cx1} cy={cy} r={r} fill={dim} />
      <circle cx={cx2} cy={cy} r={r} fill={dim} />
      {/* Shaded region */}
      {shade === 'union' && <>
        <circle cx={cx1} cy={cy} r={r} fill={hi} />
        <circle cx={cx2} cy={cy} r={r} fill={hi} />
      </>}
      {shade === 'intersection' && (
        <rect x="0" y="0" width={W} height={H} fill={hi} mask={`url(#mB_${uid})`}
          style={{ clipPath: `circle(${r}px at ${cx1}px ${cy}px)` }} />
      )}
      {shade === 'intersection' && (
        <circle cx={cx2} cy={cy} r={r} fill={hi} mask={`url(#mA_${uid})`} />
      )}
      {shade === 'diff_a' && (
        <rect x="0" y="0" width={W} height={H} fill={hi} mask={`url(#mAnotB_${uid})`} />
      )}
      {shade === 'diff_b' && (
        <rect x="0" y="0" width={W} height={H} fill={hi} mask={`url(#mBnotA_${uid})`} />
      )}
      {shade === 'complement' && (
        <circle cx={cx1} cy={cy} r={r} fill="rgba(10,14,30,0.7)" />
      )}
      {shade === 'sym_diff' && <>
        <rect x="0" y="0" width={W} height={H} fill={hi} mask={`url(#mAnotB_${uid})`} />
        <rect x="0" y="0" width={W} height={H} fill={hi} mask={`url(#mBnotA_${uid})`} />
      </>}
      {/* Circle outlines */}
      <circle cx={cx1} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      <circle cx={cx2} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      {/* Labels */}
      <text x={cx1 - r * 0.62} y={cy + 5} textAnchor="middle" fill="rgba(255,255,255,0.9)"
        fontSize={Math.round(r*0.32)} fontFamily="Playfair Display,serif" fontWeight="bold">{labelA}</text>
      <text x={cx2 + r * 0.62} y={cy + 5} textAnchor="middle" fill="rgba(255,255,255,0.9)"
        fontSize={Math.round(r*0.32)} fontFamily="Playfair Display,serif" fontWeight="bold">{labelB}</text>
      <text x={W - 14} y={18} textAnchor="end" fill="rgba(255,255,255,0.4)"
        fontSize={Math.round(r*0.24)} fontFamily="serif" fontStyle="italic">U</text>
    </svg>
  );
}
// ── Notation Table ────────────────────────────────────────────
const NOTATION = [
  { sym: '\\in',        name: 'Element of',        meaning: 'x belongs to set A', ex: '3 \\in \\{1,2,3\\}' },
  { sym: '\\notin',     name: 'Not element of',     meaning: 'x does NOT belong to A', ex: '5 \\notin \\{1,2,3\\}' },
  { sym: '\\subset',    name: 'Proper Subset',       meaning: 'A is inside B, A ≠ B', ex: '\\{1\\} \\subset \\{1,2\\}' },
  { sym: '\\subseteq',  name: 'Subset',              meaning: 'A is inside B (or equals B)', ex: '\\{1,2\\} \\subseteq \\{1,2\\}' },
  { sym: '\\supset',    name: 'Proper Superset',     meaning: 'A strictly contains B', ex: '\\{1,2\\} \\supset \\{1\\}' },
  { sym: '\\supseteq',  name: 'Superset',            meaning: 'A contains B (or equals B)', ex: '\\{1,2\\} \\supseteq \\{1,2\\}' },
  { sym: '\\cup',       name: 'Union',               meaning: 'Elements in A OR B (or both)', ex: '\\{1,2\\}\\cup\\{2,3\\}=\\{1,2,3\\}' },
  { sym: '\\cap',       name: 'Intersection',        meaning: 'Elements in BOTH A and B', ex: '\\{1,2\\}\\cap\\{2,3\\}=\\{2\\}' },
  { sym: "A'",          name: 'Complement',          meaning: 'Elements in U but NOT in A', ex: "\\text{If }U=\\{1..5\\}, A=\\{1,2\\}\\Rightarrow A'=\\{3,4,5\\}" },
  { sym: 'A - B',       name: 'Set Difference',      meaning: 'Elements in A but NOT in B', ex: '\\{1,2,3\\}-\\{2,3,4\\}=\\{1\\}' },
  { sym: '\\phi',       name: 'Empty Set',           meaning: 'A set with no elements', ex: '\\phi = \\{\\}' },
  { sym: 'n(A)',        name: 'Cardinality',         meaning: 'Number of elements in A', ex: 'n(\\{a,b,c\\})=3' },
  { sym: 'P(A)',        name: 'Power Set',           meaning: 'Set of ALL subsets of A', ex: 'P(\\{1,2\\})=\\{\\phi,\\{1\\},\\{2\\},\\{1,2\\}\\}' },
  { sym: 'A \\times B', name: 'Cartesian Product',   meaning: 'All ordered pairs (a, b)', ex: '\\{1,2\\}\\times\\{x,y\\}=\\{(1,x),(1,y),(2,x),(2,y)\\}' },
  { sym: '|A|',         name: 'Absolute Value (Set)','meaning': 'Same as n(A), cardinality', ex: '|\\{a,b,c\\}|=3' },
  { sym: '\\mathbb{N}', name: 'Natural Numbers',     meaning: 'Set {1, 2, 3, …}', ex: '\\mathbb{N}=\\{1,2,3,...\\}' },
  { sym: '\\mathbb{Z}', name: 'Integers',            meaning: 'Set {…, −2, −1, 0, 1, 2, …}', ex: '\\mathbb{Z}=\\{...,-1,0,1,...\\}' },
  { sym: '\\forall',    name: 'For All',             meaning: 'For every element', ex: '\\forall x \\in A' },
  { sym: '\\exists',    name: 'There Exists',        meaning: 'At least one element exists', ex: '\\exists x \\in A' },
  { sym: ':',           name: 'Such That',           meaning: 'Condition on elements (in set-builder)', ex: '\\{x : x > 0\\}' },
  { sym: '\\mid',       name: 'Such That (alt.)',    meaning: 'Condition on elements (alternative)', ex: '\\{x \\mid x \\in \\mathbb{N}\\}' },
  { sym: '\\sim',       name: 'Is Similar To / ~',  meaning: 'Equivalence relation (A~B: A relates to B)', ex: 'A \\sim B \\Leftrightarrow |A|=|B|' },
  { sym: '\\cong',      name: 'Is Congruent To',    meaning: 'Isomorphic / same structure', ex: 'A \\cong B' },
  { sym: '\\Rightarrow','name': 'Implies',           meaning: 'If ... then ...', ex: 'x \\in A \\Rightarrow x \\in A \\cup B' },
  { sym: '\\Leftrightarrow', name: 'If and Only If', meaning: 'Biconditional (iff)', ex: 'A=B \\Leftrightarrow A \\subseteq B \\text{ and } B \\subseteq A' },
];

// ── Sections Definition ───────────────────────────────────────
const SECTIONS = [
  {
    id: 'elements', title: 'Elements & Membership', level: 'Beginner', color: '#4ECDC4', icon: '∈',
    shortDef: 'Every object inside a set is called an element (or member) of that set.',
    fullDef: 'We write a ∈ A to say "a is an element of A," and b ∉ A to say "b is NOT in A." This ∈ symbol, introduced by Giuseppe Peano in 1889, comes from the Greek letter epsilon (ε) — the first letter of the Greek word for "is."',
    keyFacts: [
      { text: 'If a belongs to A', l: 'a \\in A' },
      { text: 'If b does NOT belong to A', l: 'b \\notin A' },
      { text: 'Example: A = {1,2,3,4}', l: '2 \\in A,\\; 5 \\notin A' },
      { text: 'Order does NOT matter in sets', l: '\\{1,2,3\\} = \\{3,1,2\\} = \\{2,3,1\\}' },
      { text: 'Repetitions are ignored', l: '\\{1,1,2,3,3\\} = \\{1,2,3\\}' },
    ],
    genKey: 'membership',
  },
  {
    id: 'roster', title: 'Roster (Tabular) Form', level: 'Beginner', color: '#FF6B6B', icon: '{ }',
    shortDef: 'List all elements of the set inside curly braces, separated by commas.',
    fullDef: 'In Roster (Tabular) Form, we explicitly write every element of the set. This is the simplest way to describe a set when it has a small or specific number of elements. The order of listing does not matter, and each element is written only once.',
    keyFacts: [
      { text: 'All vowels in English', l: 'V = \\{a, e, i, o, u\\}' },
      { text: 'Even numbers 2–10', l: 'E = \\{2, 4, 6, 8, 10\\}' },
      { text: 'Perfect squares up to 25', l: 'S = \\{1, 4, 9, 16, 25\\}' },
      { text: 'Primes less than 10', l: 'P = \\{2, 3, 5, 7\\}' },
      { text: 'Infinite: natural numbers', l: '\\mathbb{N} = \\{1, 2, 3, 4, ...\\}' },
    ],
    genKey: 'roster',
  },
  {
    id: 'setbuilder', title: 'Set-Builder Form', level: 'Beginner', color: '#F97316', icon: ':',
    shortDef: 'Describe the set by stating the property that its elements must satisfy.',
    fullDef: 'Set-Builder notation writes {x : P(x)} or {x | P(x)}, read as "the set of all x such that x satisfies property P." This is powerful for describing large or infinite sets without listing every element.',
    keyFacts: [
      { text: 'Even numbers', l: 'E = \\{x : x \\text{ is even}\\}' },
      { text: 'Multiples of 3 up to 30', l: 'M = \\{x : 3 \\mid x,\\; 1 \\leq x \\leq 30\\}' },
      { text: 'Positive integers', l: '\\mathbb{N} = \\{x : x \\in \\mathbb{Z},\\; x > 0\\}' },
      { text: 'Real solutions of x² = 4', l: 'S = \\{x : x^2 = 4,\\; x \\in \\mathbb{R}\\} = \\{-2, 2\\}' },
    ],
    genKey: 'setbuilder',
  },
  {
    id: 'types', title: 'Types of Sets', level: 'Beginner', color: '#A78BFA', icon: '∅',
    shortDef: 'Sets are classified by how many elements they have and by special properties.',
    fullDef: 'Understanding types of sets is foundational. The empty set is the most special — it has no elements yet it is a subset of every set. Finite vs. infinite is about countability. Equal and equivalent sets look at the elements themselves vs. just the count.',
    keyFacts: [
      { text: 'Empty Set: no elements', l: '\\phi = \\{\\},\\quad n(\\phi) = 0' },
      { text: 'Singleton: exactly 1 element', l: 'A = \\{7\\},\\quad n(A) = 1' },
      { text: 'Finite: countable elements', l: 'F = \\{1,2,...,100\\},\\quad n(F) = 100' },
      { text: 'Infinite: unending elements', l: '\\mathbb{N} = \\{1,2,3,...\\}' },
      { text: 'Equal: A=B (same elements)', l: '\\{1,2,3\\} = \\{3,1,2\\}' },
      { text: 'Equivalent: |A|=|B| (same count)', l: '\\{a,b,c\\} \\sim \\{1,2,3\\}\\text{ since }n=3' },
    ],
    genKey: 'types',
  },
  {
    id: 'subsets', title: 'Subsets & Proper Subsets', level: 'Beginner', color: '#34D399', icon: '⊆',
    shortDef: 'A is a subset of B if every element of A is also in B.',
    fullDef: 'If every single element of set A also belongs to set B, then A is a subset of B (A ⊆ B). A "proper" subset (A ⊂ B) additionally requires A ≠ B. Every set is a subset of itself, and the empty set ∅ is a subset of every set.',
    keyFacts: [
      { text: 'Subset definition', l: 'A \\subseteq B \\Leftrightarrow (x \\in A \\Rightarrow x \\in B)' },
      { text: 'Proper subset', l: 'A \\subset B \\Leftrightarrow A \\subseteq B \\text{ and } A \\neq B' },
      { text: 'Every set is its own subset', l: 'A \\subseteq A \\text{ (always)}' },
      { text: 'Empty set is subset of all', l: '\\phi \\subseteq A \\text{ for every set } A' },
      { text: 'Number of subsets', l: '\\text{If }|A|=n,\\text{ A has }2^n\\text{ subsets}' },
      { text: 'Example', l: '\\{1,3\\} \\subset \\{1,2,3,4\\}' },
    ],
    genKey: 'subsets',
  },
  {
    id: 'universal', title: 'Universal Set & Complement', level: 'Beginner', color: '#60A5FA', icon: 'U',
    shortDef: 'The Universal Set U contains ALL objects under consideration. The Complement A′ is everything in U but not in A.',
    fullDef: 'The Universal set is context-dependent — when we talk about natural numbers, U = ℕ; when discussing a classroom, U = all students. The complement A′ (or Aᶜ) = U − A is the set of everything that is NOT in A.',
    keyFacts: [
      { text: 'Complement definition', l: "A' = \\{x : x \\in U \\text{ and } x \\notin A\\}" },
      { text: 'Double complement', l: "(A')' = A" },
      { text: 'Complement of U', l: "U' = \\phi" },
      { text: 'Complement of ∅', l: "\\phi' = U" },
      { text: 'A and A′ are disjoint', l: "A \\cap A' = \\phi" },
      { text: 'Together they cover U', l: "A \\cup A' = U" },
    ],
    genKey: 'complement',
    vennType: 'complement',
  },
  {
    id: 'powerset', title: 'Power Set', level: 'Intermediate', color: '#F59E0B', icon: 'P(A)',
    shortDef: 'The Power Set P(A) is the set of ALL subsets of A, including ∅ and A itself.',
    fullDef: 'If A has n elements, its power set P(A) has exactly 2ⁿ elements. This is because for each element of A, we independently choose whether to include it (2 choices per element, n elements → 2ⁿ subsets). The power set of any set is always larger than the set itself — this is the essence of Cantor\'s Theorem.',
    keyFacts: [
      { text: 'Power set of {a}', l: 'P(\\{a\\}) = \\{\\phi, \\{a\\}\\},\\quad |P|=2' },
      { text: 'Power set of {a,b}', l: 'P(\\{a,b\\}) = \\{\\phi,\\{a\\},\\{b\\},\\{a,b\\}\\},\\quad |P|=4' },
      { text: 'Size formula', l: '|P(A)| = 2^{n(A)}' },
      { text: 'Empty set is always member', l: '\\phi \\in P(A) \\text{ for any } A' },
      { text: 'A itself is always member', l: 'A \\in P(A)' },
    ],
    genKey: 'powerset',
  },
  {
    id: 'union', title: 'Union  A ∪ B', level: 'Intermediate', color: '#EC4899', icon: '∪',
    shortDef: 'The union A ∪ B contains every element that is in A, or in B, or in both.',
    fullDef: 'Think of union as "OR" — an element is in A ∪ B if it belongs to at least one of the sets. Union is commutative (A ∪ B = B ∪ A), associative, and has the identity property (A ∪ ∅ = A).',
    keyFacts: [
      { text: 'Definition', l: 'A \\cup B = \\{x : x \\in A \\text{ or } x \\in B\\}' },
      { text: 'Example', l: '\\{1,2,3\\}\\cup\\{3,4,5\\} = \\{1,2,3,4,5\\}' },
      { text: 'Commutative', l: 'A \\cup B = B \\cup A' },
      { text: 'Associative', l: '(A \\cup B) \\cup C = A \\cup (B \\cup C)' },
      { text: 'Identity', l: 'A \\cup \\phi = A' },
      { text: 'With universal', l: 'A \\cup U = U' },
    ],
    genKey: 'union', vennType: 'union',
  },
  {
    id: 'intersection', title: 'Intersection  A ∩ B', level: 'Intermediate', color: '#8B5CF6', icon: '∩',
    shortDef: 'The intersection A ∩ B contains only the elements that are in BOTH A and B.',
    fullDef: 'Think of intersection as "AND" — an element must satisfy both conditions simultaneously. If A ∩ B = ∅, the sets are called disjoint. Intersection distributes over union, giving us the distributive laws.',
    keyFacts: [
      { text: 'Definition', l: 'A \\cap B = \\{x : x \\in A \\text{ and } x \\in B\\}' },
      { text: 'Example', l: '\\{1,2,3,4\\}\\cap\\{3,4,5,6\\} = \\{3,4\\}' },
      { text: 'Disjoint sets', l: 'A \\cap B = \\phi \\Rightarrow A, B \\text{ are disjoint}' },
      { text: 'With empty set', l: 'A \\cap \\phi = \\phi' },
      { text: 'With universal', l: 'A \\cap U = A' },
      { text: 'Idempotent', l: 'A \\cap A = A' },
    ],
    genKey: 'intersection', vennType: 'intersection',
  },
  {
    id: 'difference', title: 'Set Difference  A − B', level: 'Intermediate', color: '#14B8A6', icon: '−',
    shortDef: 'A − B contains elements that are in A but NOT in B. Also written A \\ B.',
    fullDef: 'The set difference A − B (also written A \\ B) "removes" B from A. Unlike union and intersection, difference is NOT commutative — A − B ≠ B − A in general. It measures how much of A lies outside B.',
    keyFacts: [
      { text: 'Definition', l: 'A - B = \\{x : x \\in A \\text{ and } x \\notin B\\}' },
      { text: 'Example', l: '\\{1,2,3,4\\}-\\{3,4,5\\} = \\{1,2\\}' },
      { text: 'Not commutative', l: 'A - B \\neq B - A \\text{ (generally)}' },
      { text: 'Via complement', l: 'A - B = A \\cap B\'',  },
      { text: 'Self-difference', l: 'A - A = \\phi' },
      { text: 'With empty set', l: 'A - \\phi = A' },
    ],
    genKey: 'difference', vennType: 'diff_a',
  },
  {
    id: 'demorgan', title: "De Morgan's Laws", level: 'Intermediate', color: '#F87171', icon: "≡",
    shortDef: 'The complement of a union equals the intersection of complements, and vice versa.',
    fullDef: 'De Morgan\'s Laws are duality principles that connect union, intersection, and complement. Named after mathematician Augustus De Morgan (1806–1871), these laws are fundamental in logic, set theory, and digital circuit design.',
    keyFacts: [
      { text: 'First Law', l: "(A \\cup B)' = A' \\cap B'" },
      { text: 'Second Law', l: "(A \\cap B)' = A' \\cup B'" },
      { text: 'Intuition (1st)', l: "\\text{NOT(A or B) = NOT-A AND NOT-B}" },
      { text: 'Intuition (2nd)', l: "\\text{NOT(A and B) = NOT-A OR NOT-B}" },
      { text: 'Extended (3 sets)', l: "(A\\cup B\\cup C)' = A'\\cap B'\\cap C'" },
    ],
    genKey: 'demorgan',
  },
  {
    id: 'distributive', title: 'Distributive Laws', level: 'Intermediate', color: '#FB923C', icon: '⊕',
    shortDef: 'Intersection distributes over union, and union distributes over intersection.',
    fullDef: 'Like how multiplication distributes over addition in algebra (a(b+c) = ab+ac), intersection distributes over union in set theory. Both distributive laws hold, making sets a distributive lattice.',
    keyFacts: [
      { text: '∩ over ∪', l: 'A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)' },
      { text: '∪ over ∩', l: 'A \\cup (B \\cap C) = (A \\cup B) \\cap (A \\cup C)' },
      { text: 'Analogy to algebra', l: 'a(b+c)=ab+ac \\;\\longleftrightarrow\\; A\\cap(B\\cup C)=(A\\cap B)\\cup(A\\cap C)' },
    ],
    genKey: 'distributive',
  },
  {
    id: 'cartesian', title: 'Cartesian Product  A × B', level: 'Intermediate', color: '#2DD4BF', icon: '×',
    shortDef: 'A × B is the set of all ordered pairs (a, b) where a ∈ A and b ∈ B.',
    fullDef: 'Named after René Descartes, the Cartesian product creates "all combinations" as ordered pairs. If |A| = m and |B| = n, then |A × B| = mn. Ordered pairs (a,b) and (b,a) are different. This is the foundation of relations and functions.',
    keyFacts: [
      { text: 'Definition', l: 'A \\times B = \\{(a,b) : a \\in A,\\; b \\in B\\}' },
      { text: 'Example', l: '\\{1,2\\}\\times\\{x,y\\} = \\{(1,x),(1,y),(2,x),(2,y)\\}' },
      { text: 'Size formula', l: '|A \\times B| = |A| \\cdot |B|' },
      { text: 'NOT commutative', l: 'A \\times B \\neq B \\times A \\text{ (generally)}' },
      { text: 'With empty set', l: 'A \\times \\phi = \\phi' },
      { text: 'Self-product gives coordinates', l: '\\mathbb{R} \\times \\mathbb{R} = \\mathbb{R}^2 \\text{ (the plane)}' },
    ],
    genKey: 'cartesian',
  },
  {
    id: 'inclexcl2', title: 'Inclusion-Exclusion (2 Sets)', level: 'Olympiad', color: '#C084FC', icon: '∪',
    shortDef: 'To find |A ∪ B|, add the individual sizes then subtract the overcounted intersection.',
    fullDef: 'When we add |A| and |B|, we count A ∩ B twice (once in each). So we subtract it once. This Principle of Inclusion-Exclusion (PIE) is one of the most powerful counting tools in combinatorics.',
    keyFacts: [
      { text: 'Formula for 2 sets', l: 'n(A \\cup B) = n(A) + n(B) - n(A \\cap B)' },
      { text: 'For disjoint sets', l: 'n(A \\cup B) = n(A) + n(B) \\quad (\\text{if }A \\cap B = \\phi)' },
      { text: 'Solving for intersection', l: 'n(A \\cap B) = n(A) + n(B) - n(A \\cup B)' },
    ],
    genKey: 'inclexcl2',
  },
  {
    id: 'inclexcl3', title: 'Inclusion-Exclusion (3 Sets)', level: 'Olympiad', color: '#818CF8', icon: 'PIE',
    shortDef: 'For three sets, alternately add and subtract: add individuals, subtract pairs, add triple.',
    fullDef: 'The pattern of PIE continues: for n sets, we add sets of odd size and subtract sets of even size. For 3 sets, we add A, B, C (size 1), subtract A∩B, B∩C, A∩C (size 2), and add back A∩B∩C (size 3).',
    keyFacts: [
      { text: 'Formula for 3 sets', l: 'n(A\\cup B\\cup C) = n(A)+n(B)+n(C)-n(A\\cap B)-n(B\\cap C)-n(A\\cap C)+n(A\\cap B\\cap C)' },
      { text: 'Mnemonic', l: '\\text{Add singles, subtract pairs, add triple}' },
    ],
    genKey: 'inclexcl3',
  },
  {
    id: 'partitions', title: 'Partitions of a Set', level: 'Olympiad', color: '#34D399', icon: 'Π',
    shortDef: 'A partition divides a set into non-empty, non-overlapping subsets that together cover the whole set.',
    fullDef: 'A partition {A₁, A₂, ..., Aₖ} of set S satisfies: (1) each Aᵢ ≠ ∅, (2) Aᵢ ∩ Aⱼ = ∅ for i≠j, and (3) A₁ ∪ A₂ ∪ ... ∪ Aₖ = S. The number of partitions of an n-element set is given by Bell numbers (B₁=1, B₂=2, B₃=5, B₄=15, ...).',
    keyFacts: [
      { text: 'Example: partitions of {1,2,3}', l: '\\{1,2,3\\},\\;\\{1,2\\}\\{3\\},\\;\\{1,3\\}\\{2\\},\\;\\{2,3\\}\\{1\\},\\;\\{1\\}\\{2\\}\\{3\\}' },
      { text: 'Bell numbers', l: 'B_1=1,\\; B_2=2,\\; B_3=5,\\; B_4=15,\\; B_5=52' },
      { text: 'Equivalence relations ↔ Partitions', l: '\\text{Every equivalence relation defines a partition}' },
    ],
    genKey: 'partitions',
  },
  {
    id: 'cantor', title: "Cantor's Theorem & Infinite Sets", level: 'Olympiad', color: '#FCD34D', icon: '∞',
    shortDef: '|P(A)| > |A| for any set A — even infinite ones. There is no "largest" infinity.',
    fullDef: 'Georg Cantor proved in 1891 that for ANY set A, its power set P(A) always has strictly larger cardinality than A. This means there are infinitely many "sizes" of infinity: |ℕ| < |P(ℕ)| < |P(P(ℕ))| < ... Cantor also showed |ℕ| < |ℝ| (real numbers are "more infinite" than naturals). These results were revolutionary and initially controversial.',
    keyFacts: [
      { text: "Cantor's Theorem", l: '|P(A)| > |A| \\text{ for every set } A' },
      { text: 'Proof idea (diagonal)', l: '\\text{Assume a bijection } f:A\\to P(A)\\text{; derive contradiction via } D=\\{x\\in A: x\\notin f(x)\\}' },
      { text: 'Countable vs Uncountable', l: '|\\mathbb{N}| = \\aleph_0 < |\\mathbb{R}| = \\mathfrak{c}' },
      { text: 'Chain of infinities', l: '|\\mathbb{N}| < |P(\\mathbb{N})| < |P(P(\\mathbb{N}))| < \\cdots' },
      { text: 'Continuum Hypothesis', l: '\\text{No set has cardinality between }|\\mathbb{N}|\\text{ and }|\\mathbb{R}|\\text{ (unprovable)}' },
    ],
    genKey: 'cantor',
  },
  {
    id: 'olympiad', title: 'Olympiad Challenge Problems', level: 'Olympiad', color: '#F59E0B', icon: '★',
    shortDef: 'Competition-style problems combining multiple set theory concepts.',
    fullDef: 'These problems require deep insight: recognizing hidden set structure, clever use of PIE, double counting, or constructing specific sets as counterexamples or proofs. They appear in RMO, INMO, IMO, and Putnam competitions.',
    keyFacts: [
      { text: 'Double counting trick', l: '|A \\cup B| = |A| + |B| - |A \\cap B| \\Rightarrow |A \\cap B| = |A| + |B| - |A \\cup B|' },
      { text: 'Pigeonhole via sets', l: '\\text{If }|A| > n\\text{ and A partitioned into n parts, some part has }\\geq 2\\text{ elements}' },
      { text: 'Symmetric difference', l: 'A \\triangle B = (A-B)\\cup(B-A) = (A\\cup B)-(A\\cap B)' },
    ],
    genKey: 'olympiad',
  },
];
// ── Procedural Question Generators ────────────────────────────
const GENERATORS = {
  membership: (n) => {
    const size = srI(n, 4, 7);
    const set = genNums(n, size, 1, 20);
    const inside = srP(set, n + 50);
    const outside = (() => { let v; do { v = srI(n + 99, 1, 30); } while (set.includes(v)); return v; })();
    const check = genNums(n + 7, 5, 1, 30);
    return {
      question: `Let A = ${setTxt(set)}. For each element, determine if it belongs to A:  ${check.join(', ')}`,
      questionLatex: `A = ${setStr(set)}\\quad\\text{Is each of these in A?}\\quad ${check.join(',\\;')}`,
      steps: check.map(x => `${x} ${set.includes(x) ? '∈' : '∉'} A — ${set.includes(x) ? `yes, ${x} is listed in A` : `no, ${x} does not appear in A`}`),
      answer: check.map(x => `${x} ${set.includes(x) ? '∈' : '∉'} A`).join(',  '),
      answerLatex: check.map(x => `${x} ${set.includes(x) ? '\\in' : '\\notin'} A`).join(',\\quad'),
      tip: 'Scan the set carefully. Remember: order and repetition do NOT change membership.'
    };
  },
  roster: (n) => {
    const templates = [
      (s) => { const k = srI(s, 2, 9); const cnt = srI(s+1, 4, 7); const nums = Array.from({length:cnt},(_,i)=>k*(i+1)); return { rule: `multiples of ${k} from ${nums[0]} to ${nums[nums.length-1]}`, elems: nums, propLatex: `x : k \\mid x,\\; ${nums[0]} \\leq x \\leq ${nums[nums.length-1]},\\; k=${k}` }; },
      (s) => { const st = srI(s,1,4)*2; const cnt = srI(s+1,4,6); const nums = Array.from({length:cnt},(_,i)=>st+i*2); return { rule: `even numbers from ${nums[0]} to ${nums[nums.length-1]}`, elems: nums, propLatex: `x : x \\text{ is even},\\; ${nums[0]} \\leq x \\leq ${nums[nums.length-1]}` }; },
      (s) => { const cnt = srI(s,3,5); const nums = PRIMES.slice(0, cnt); return { rule: `first ${cnt} prime numbers`, elems: nums, propLatex: `x : x \\text{ is prime},\\; x \\leq ${nums[nums.length-1]}` }; },
      (s) => { const cnt = srI(s,3,5); const nums = Array.from({length:cnt},(_,i)=>(i+1)**2); return { rule: `perfect squares from 1 to ${nums[nums.length-1]}`, elems: nums, propLatex: `x : x = n^2,\\; n \\in \\mathbb{N},\\; 1 \\leq n \\leq ${cnt}` }; },
      (s) => { const st = srI(s,1,5)*2-1; const cnt = srI(s+1,3,5); const nums = Array.from({length:cnt},(_,i)=>st+i*2); return { rule: `odd numbers from ${nums[0]} to ${nums[nums.length-1]}`, elems: nums, propLatex: `x : x \\text{ is odd},\\; ${nums[0]} \\leq x \\leq ${nums[nums.length-1]}` }; },
      (s) => { const base = srI(s,2,4); const cnt = srI(s+1,3,5); const nums = Array.from({length:cnt},(_,i)=>base**(i+1)); return { rule: `powers of ${base} from ${base} to ${nums[nums.length-1]}`, elems: nums, propLatex: `x : x = ${base}^n,\\; 1 \\leq n \\leq ${cnt}` }; },
    ];
    const tmpl = templates[n % templates.length](n * 7 + 3);
    return {
      question: `Write the set A = {${tmpl.rule}} in Roster Form.`,
      questionLatex: `\\text{Write in Roster Form: A = \\{${tmpl.rule}\\}}`,
      steps: [`Identify elements satisfying the rule: "${tmpl.rule}"`, `Elements: ${tmpl.elems.join(', ')}`, `Write inside curly braces without repetition`],
      answer: setTxt(tmpl.elems),
      answerLatex: `A = ${setStr(tmpl.elems)}`,
      tip: 'In Roster form: list every element once, separated by commas, inside { }.'
    };
  },
  setbuilder: (n) => {
    const templates = [
      (s) => { const k = srI(s,2,8); const cnt = srI(s+1,4,6); const nums = Array.from({length:cnt},(_,i)=>k*(i+1)); return { roster: setTxt(nums), answer: `\\{x : x \\text{ is a multiple of }${k},\\; x \\leq ${nums[nums.length-1]}\\}`, hint: `All elements are multiples of ${k}` }; },
      (s) => { const cnt = srI(s,3,5); const sq = Array.from({length:cnt},(_,i)=>(i+1)**2); return { roster: setTxt(sq), answer: `\\{x : x = n^2,\\; n \\in \\mathbb{N},\\; 1 \\leq n \\leq ${cnt}\\}`, hint: 'These are 1², 2², 3², … — perfect squares' }; },
      (s) => { const cnt = srI(s,3,5); const prms = PRIMES.slice(0,cnt); return { roster: setTxt(prms), answer: `\\{x : x \\text{ is prime},\\; x \\leq ${prms[prms.length-1]}\\}`, hint: 'All elements are prime numbers' }; },
      (s) => { const start = srI(s,1,3)*2; const cnt = srI(s+1,4,6); const evens = Array.from({length:cnt},(_,i)=>start+i*2); return { roster: setTxt(evens), answer: `\\{x : x \\text{ is even},\\; ${evens[0]} \\leq x \\leq ${evens[evens.length-1]}\\}`, hint: 'All elements are even' }; },
    ];
    const t = templates[n % templates.length](n * 11 + 7);
    return {
      question: `Write ${t.roster} in Set-Builder form.`,
      questionLatex: `\\text{Write in Set-Builder form: }${t.roster.replace('{','\\{').replace('}','\\}')}`,
      steps: [`Observe the pattern: ${t.hint}`, `Express as a property: all x such that [property]`, `Standard notation: {x : property}`],
      answer: t.answer,
      answerLatex: t.answer,
      tip: 'Look for the PATTERN among elements: arithmetic? geometric? prime? square?'
    };
  },
  types: (n) => {
    const typeTemplates = [
      (s) => { const size = srI(s,0,0); return { set: '∅ or {}', isType: 'Empty Set', reason: 'Contains no elements, n(A) = 0', latex: '\\phi = \\{\\},\\; n(A)=0' }; },
      (s) => { const x = srI(s,1,100); return { set: `{${x}}`, isType: 'Singleton Set', reason: `Contains exactly one element: ${x}`, latex: `A=\\{${x}\\},\\; n(A)=1` }; },
      (s) => { const nums = genNums(s,srI(s+1,4,8),1,50); return { set: setTxt(nums), isType: 'Finite Set', reason: `Contains ${nums.length} elements — countable`, latex: `n(A)=${nums.length}` }; },
      (s) => { const options = ['all even positive integers','all natural numbers','all integers','all real numbers in [0,1]']; const o = srP(options, s); return { set: `{${o}}`, isType: 'Infinite Set', reason: 'Cannot list all elements — they go on forever', latex: '|A| = \\infty' }; },
      (s) => { const a = genNums(s,4,1,20); const b = [...a].sort((x,y)=>x-y); return { set: `A=${setTxt(a)}, B=${setTxt(b)}`, isType: 'Equal Sets', reason: 'Both contain exactly the same elements (order doesn\'t matter)', latex: `A=B=${setStr(a)}` }; },
    ];
    const t = typeTemplates[n % typeTemplates.length](n * 13 + 5);
    return {
      question: `Classify the set: ${t.set}. What type is it?`,
      questionLatex: `\\text{Classify: }${t.set.replace(/{/g,'\\{').replace(/}/g,'\\}')}`,
      steps: [`Examine the set: ${t.set}`, `Count or describe elements`, `Apply definitions: empty/singleton/finite/infinite/equal`],
      answer: `${t.isType}. ${t.reason}.`,
      answerLatex: `\\text{Type: }\\textbf{${t.isType}}\\quad ${t.latex}`,
      tip: 'To classify: first count elements (0? 1? finite? infinite?), then check if equal to another given set.'
    };
  },
  subsets: (n) => {
    const B = genNums(n, srI(n, 5, 8), 1, 20);
    const subSize = srI(n + 1, 1, Math.min(4, B.length - 1));
    const A = B.slice(0, subSize);
    const notSub = (() => {
      let x; do { x = srI(n + 77, 1, 30); } while (B.includes(x)); return x;
    })();
    const C = [...A.slice(0, subSize-1), notSub];
    const isSubset = A.every(x => B.includes(x));
    return {
      question: `A = ${setTxt(A)}, B = ${setTxt(B)}. Is A ⊆ B? Is A ⊂ B? How many subsets does A have?`,
      questionLatex: `A=${setStr(A)},\\; B=${setStr(B)}\\quad\\text{Is }A\\subseteq B?\\text{ Is }A\\subset B?`,
      steps: [
        `Check every element of A against B:`,
        ...A.map(x => `  ${x} ∈ B? ${B.includes(x) ? 'Yes ✓' : 'No ✗'}`),
        `A ⊆ B: ${isSubset ? 'YES — all elements of A are in B' : 'NO — some element of A is not in B'}`,
        isSubset ? `A ⊂ B (proper): ${A.length < B.length ? 'YES — A ≠ B since B has more elements' : 'NO — A = B'}` : '',
        `Number of subsets of A = 2^${A.length} = ${2**A.length}`,
      ].filter(Boolean),
      answer: `A ⊆ B: ${isSubset ? 'YES' : 'NO'}. Subsets of A: ${2**A.length}`,
      answerLatex: `A\\subseteq B:\\;\\textbf{${isSubset ? 'YES' : 'NO'}},\\quad |P(A)|=2^{${A.length}}=${2**A.length}`,
      tip: 'Subset check: is every element of A found in B? If even ONE element fails, A ⊄ B.'
    };
  },
  complement: (n) => {
    const uMax = srI(n, 12, 20);
    const U = Array.from({ length: uMax }, (_, i) => i + 1);
    const aSize = srI(n + 1, 3, 7);
    const A = genNums(n + 50, aSize, 1, uMax);
    const Ac = U.filter(x => !A.includes(x));
    return {
      question: `U = {1, 2, …, ${uMax}}, A = ${setTxt(A)}. Find A′ (complement of A).`,
      questionLatex: `U=\\{1,2,...,${uMax}\\},\\; A=${setStr(A)}.\\text{ Find }A'.`,
      steps: [
        `A′ = U − A = {x : x ∈ U and x ∉ A}`,
        `U = {1, 2, …, ${uMax}}`,
        `Elements of U NOT in A: ${Ac.join(', ')}`,
        `Verify: A ∩ A′ = ∅ ✓,  A ∪ A′ = U ✓`,
        `n(A) = ${A.length}, n(A′) = ${Ac.length}, n(A) + n(A′) = ${uMax} = n(U) ✓`
      ],
      answer: setTxt(Ac),
      answerLatex: `A' = ${setStr(Ac)}`,
      tip: "A′ depends on U. Always state the universal set — the same A can have different complements in different U."
    };
  },
  powerset: (n) => {
    const size = srI(n, 2, 4);
    const A = genNums(n + 1, size, 1, 15);
    const subs = [];
    for (let mask = 0; mask < (1 << size); mask++) {
      const sub = A.filter((_, i) => mask & (1 << i));
      subs.push(sub);
    }
    subs.sort((a, b) => a.length - b.length);
    return {
      question: `A = ${setTxt(A)}. List all elements of P(A) (power set). How many subsets are there?`,
      questionLatex: `A = ${setStr(A)}.\\text{ Find }P(A).`,
      steps: [
        `|A| = ${size}, so |P(A)| = 2^${size} = ${1<<size}`,
        `Size 0 (∅): {∅}`,
        ...Array.from({ length: size }, (_, k) => {
          const atK = subs.filter(s => s.length === k + 1);
          return `Size ${k+1}: ${atK.map(setTxt).join(', ')}`;
        }),
        `Total: ${1<<size} subsets ✓`
      ],
      answer: `P(A) = { ${subs.map(setTxt).join(', ')} }`,
      answerLatex: `P(A) = \\{${subs.map(setStr).join(',\\;')}\\}`,
      tip: 'Systematic method: list subsets by SIZE (0 elements, then 1, then 2…). Use ⁿCᵣ to count subsets of each size.'
    };
  },
  union: (n) => {
    const A = genNums(n, srI(n+1, 3, 6), 1, 15);
    const B = genNums(n + 30, srI(n+2, 3, 6), 1, 15);
    const AuB = [...new Set([...A, ...B])].sort((a,b) => a-b);
    return {
      question: `A = ${setTxt(A)}, B = ${setTxt(B)}. Find A ∪ B.`,
      questionLatex: `A=${setStr(A)},\\; B=${setStr(B)}.\\text{ Find }A\\cup B.`,
      steps: [
        `A ∪ B = elements in A OR B (no repeats)`,
        `From A: ${A.join(', ')}`,
        `From B: ${B.join(', ')} — skip duplicates: ${A.filter(x => B.includes(x)).join(', ') || 'none'}`,
        `Combined (sorted): ${AuB.join(', ')}`,
        `n(A) = ${A.length}, n(B) = ${B.length}, n(A∩B) = ${A.filter(x=>B.includes(x)).length}, n(A∪B) = ${AuB.length} ✓`
      ],
      answer: setTxt(AuB),
      answerLatex: `A\\cup B = ${setStr(AuB)}`,
      tip: 'Union = merge both sets, then remove duplicates. Think "A OR B."'
    };
  },
  intersection: (n) => {
    const A = genNums(n, srI(n+1, 4, 7), 1, 20);
    const B = genNums(n + 40, srI(n+2, 4, 7), 1, 20);
    const AiB = A.filter(x => B.includes(x));
    return {
      question: `A = ${setTxt(A)}, B = ${setTxt(B)}. Find A ∩ B.`,
      questionLatex: `A=${setStr(A)},\\; B=${setStr(B)}.\\text{ Find }A\\cap B.`,
      steps: [
        `A ∩ B = elements in BOTH A and B`,
        ...A.map(x => `  ${x} ∈ B? ${B.includes(x) ? 'YES — include' : 'No'}`),
        `Common elements: ${AiB.length > 0 ? AiB.join(', ') : 'none → disjoint sets'}`
      ],
      answer: AiB.length > 0 ? setTxt(AiB) : '∅',
      answerLatex: `A\\cap B = ${AiB.length > 0 ? setStr(AiB) : '\\phi'}`,
      tip: 'Intersection = only the elements both sets share. Think "A AND B."'
    };
  },
  difference: (n) => {
    const A = genNums(n, srI(n+1, 4, 7), 1, 20);
    const B = genNums(n + 55, srI(n+2, 4, 7), 1, 20);
    const AmB = A.filter(x => !B.includes(x));
    const BmA = B.filter(x => !A.includes(x));
    return {
      question: `A = ${setTxt(A)}, B = ${setTxt(B)}. Find both A − B and B − A.`,
      questionLatex: `A=${setStr(A)},\\; B=${setStr(B)}.\\text{ Find }A-B\\text{ and }B-A.`,
      steps: [
        `A − B = elements in A but NOT in B`,
        `Check each element of A: ${A.map(x => `${x}${B.includes(x) ? '(in B, skip)' : '(keep)'}`).join(', ')}`,
        `A − B = ${setTxt(AmB)}`,
        `B − A = elements in B but NOT in A`,
        `B − A = ${setTxt(BmA)}`,
        `Notice: A−B ≠ B−A (difference is NOT commutative)`
      ],
      answer: `A−B = ${setTxt(AmB)}, B−A = ${setTxt(BmA)}`,
      answerLatex: `A-B=${setStr(AmB)},\\quad B-A=${setStr(BmA)}`,
      tip: 'A−B means: start with A, then REMOVE anything that B contains.'
    };
  },
  demorgan: (n) => {
    const uMax = srI(n, 10, 16);
    const U = Array.from({ length: uMax }, (_, i) => i + 1);
    const A = genNums(n + 1, srI(n+2, 3, 6), 1, uMax);
    const B = genNums(n + 60, srI(n+3, 3, 6), 1, uMax);
    const Ac = U.filter(x => !A.includes(x));
    const Bc = U.filter(x => !B.includes(x));
    const AuB = [...new Set([...A, ...B])].sort((a,b)=>a-b);
    const AiB = A.filter(x=>B.includes(x));
    const AuBc = U.filter(x => !AuB.includes(x));
    const AiBc = U.filter(x => !AiB.includes(x));
    const AciBc = Ac.filter(x=>Bc.includes(x));
    const AcuBc = [...new Set([...Ac,...Bc])].sort((a,b)=>a-b);
    const law1OK = JSON.stringify(AuBc) === JSON.stringify(AciBc);
    const law2OK = JSON.stringify(AiBc) === JSON.stringify(AcuBc);
    return {
      question: `U={1..${uMax}}, A=${setTxt(A)}, B=${setTxt(B)}. Verify BOTH De Morgan's Laws.`,
      questionLatex: `U=\\{1..${uMax}\\},\\;A=${setStr(A)},\\;B=${setStr(B)}.\\text{ Verify De Morgan's Laws.}`,
      steps: [
        `A′ = ${setTxt(Ac)}, B′ = ${setTxt(Bc)}`,
        `Law 1: (A∪B)′ = A′∩B′`,
        `  A∪B = ${setTxt(AuB)}`,
        `  (A∪B)′ = ${setTxt(AuBc)}`,
        `  A′∩B′ = ${setTxt(AciBc)}`,
        `  Equal? ${law1OK ? 'YES ✓' : 'Check calculation!'}`,
        `Law 2: (A∩B)′ = A′∪B′`,
        `  A∩B = ${setTxt(AiB)}`,
        `  (A∩B)′ = ${setTxt(AiBc)}`,
        `  A′∪B′ = ${setTxt(AcuBc)}`,
        `  Equal? ${law2OK ? 'YES ✓' : 'Check calculation!'}`
      ],
      answer: `Both laws verified ✓`,
      answerLatex: `(A\\cup B)'=A'\\cap B'=${setStr(AuBc)}\\quad\\text{✓}\\qquad(A\\cap B)'=A'\\cup B'=${setStr(AiBc)}\\quad\\text{✓}`,
      tip: "De Morgan's: 'Break the line, change the sign' — complement of union becomes intersection of complements."
    };
  },
  distributive: (n) => {
    const A = genNums(n, srI(n+1,3,5), 1, 15);
    const B = genNums(n+10, srI(n+2,3,5), 1, 15);
    const C = genNums(n+20, srI(n+3,3,5), 1, 15);
    const BuC = [...new Set([...B,...C])].sort((a,b)=>a-b);
    const LHS = A.filter(x=>BuC.includes(x));
    const AiB = A.filter(x=>B.includes(x));
    const AiC = A.filter(x=>C.includes(x));
    const RHS = [...new Set([...AiB,...AiC])].sort((a,b)=>a-b);
    return {
      question: `A=${setTxt(A)}, B=${setTxt(B)}, C=${setTxt(C)}. Verify: A∩(B∪C) = (A∩B)∪(A∩C).`,
      questionLatex: `A=${setStr(A)},\\;B=${setStr(B)},\\;C=${setStr(C)}.\\text{ Verify }A\\cap(B\\cup C)=(A\\cap B)\\cup(A\\cap C)`,
      steps: [
        `LHS: A∩(B∪C)`, `  B∪C = ${setTxt(BuC)}`, `  A∩(B∪C) = ${setTxt(LHS)}`,
        `RHS: (A∩B)∪(A∩C)`, `  A∩B = ${setTxt(AiB)}`, `  A∩C = ${setTxt(AiC)}`,
        `  (A∩B)∪(A∩C) = ${setTxt(RHS)}`,
        `LHS = RHS = ${setTxt(LHS)}  ${JSON.stringify(LHS)===JSON.stringify(RHS)?'✓':'Check!'}`,
      ],
      answer: `A∩(B∪C) = (A∩B)∪(A∩C) = ${setTxt(LHS)} ✓`,
      answerLatex: `A\\cap(B\\cup C)=(A\\cap B)\\cup(A\\cap C)=${setStr(LHS)}\\quad\\checkmark`,
      tip: 'Think of it as factoring: A "distributed" into (B∪C) gives (A∩B)∪(A∩C) — just like a(b+c) = ab+ac.'
    };
  },
  cartesian: (n) => {
    const aElems = [['a','b','c','d'],['1','2','3','4'],['x','y','z'],['p','q','r'],['α','β','γ']];
    const bElems = [['1','2','3'],['x','y'],['A','B','C'],['◆','●'],['i','ii','iii']];
    const A = srP(aElems, n).slice(0, srI(n+1, 2, 3));
    const B = srP(bElems, n+7).slice(0, srI(n+2, 2, 3));
    const AxB = A.flatMap(a => B.map(b => `(${a},${b})`));
    return {
      question: `A = {${A.join(', ')}}, B = {${B.join(', ')}}. Find A × B and verify |A×B| = |A|·|B|.`,
      questionLatex: `A=\\{${A.join(',')}\\},\\;B=\\{${B.join(',')}\\}.\\text{ Find }A\\times B.`,
      steps: [
        `For each element of A, pair with every element of B:`,
        ...A.map(a => `  ${a} × B: ${B.map(b=>`(${a},${b})`).join(', ')}`),
        `|A×B| = |A|·|B| = ${A.length}×${B.length} = ${AxB.length} ✓`
      ],
      answer: `{${AxB.join(', ')}}`,
      answerLatex: `A\\times B = \\{${AxB.join(',\\;')}\\}`,
      tip: 'Draw a grid: rows = elements of A, columns = elements of B. Each cell is one ordered pair.'
    };
  },
  inclexcl2: (n) => {
    const subjects = ['Mathematics','Science','English','Hindi','History','Geography','Computer Science','Art'];
    const sA = subjects[n % subjects.length];
    const sB = subjects[(n + 3) % subjects.length] !== sA ? subjects[(n+3)%subjects.length] : subjects[(n+4)%subjects.length];
    const nA = srI(n, 20, 45);
    const nB = srI(n+1, 20, 40);
    const nAB = srI(n+2, 5, Math.min(nA, nB) - 3);
    const nAuB = nA + nB - nAB;
    const total = nAuB + srI(n+3, 10, 30);
    const nNeither = total - nAuB;
    return {
      question: `In a school of ${total} students, ${nA} study ${sA}, ${nB} study ${sB}, and ${nAB} study both. Find: (a) students studying at least one subject, (b) students studying neither.`,
      questionLatex: `n(${sA.slice(0,3)})=${nA},\\;n(${sB.slice(0,3)})=${nB},\\;n(\\text{both})=${nAB}.\\text{ Find }n(A\\cup B).`,
      steps: [
        `Given: n(A) = ${nA}, n(B) = ${nB}, n(A∩B) = ${nAB}, total = ${total}`,
        `Formula: n(A∪B) = n(A) + n(B) − n(A∩B)`,
        `n(A∪B) = ${nA} + ${nB} − ${nAB} = ${nAuB}`,
        `Students studying at least one: ${nAuB}`,
        `Students studying neither = Total − n(A∪B) = ${total} − ${nAuB} = ${nNeither}`
      ],
      answer: `At least one: ${nAuB},  Neither: ${nNeither}`,
      answerLatex: `n(A\\cup B)=${nAuB},\\quad\\text{Neither}=${nNeither}`,
      tip: 'Draw a Venn diagram. Fill A∩B first (center), then fill A-only and B-only regions.'
    };
  },
  inclexcl3: (n) => {
    const sports = ['Cricket','Football','Basketball','Tennis','Badminton','Swimming','Volleyball'];
    const sA = sports[n % sports.length], sB = sports[(n+2)%sports.length], sC = sports[(n+4)%sports.length];
    const nA=srI(n,20,40), nB=srI(n+1,18,38), nC=srI(n+2,15,35);
    const nAB=srI(n+3,5,12), nBC=srI(n+4,4,10), nAC=srI(n+5,4,10);
    const nABC=srI(n+6,2,Math.min(nAB,nBC,nAC)-1);
    const nAuBuC = nA+nB+nC-nAB-nBC-nAC+nABC;
    const total = nAuBuC + srI(n+7,10,25);
    return {
      question: `In a survey of ${total} students: ${nA} play ${sA}, ${nB} play ${sB}, ${nC} play ${sC}. ${nAB} play both ${sA}&${sB}, ${nBC} play ${sB}&${sC}, ${nAC} play ${sA}&${sC}. ${nABC} play all three. Find how many play at least one sport.`,
      questionLatex: `n(A)=${nA},n(B)=${nB},n(C)=${nC},n(A\\cap B)=${nAB},n(B\\cap C)=${nBC},n(A\\cap C)=${nAC},n(A\\cap B\\cap C)=${nABC}`,
      steps: [
        `n(A∪B∪C) = n(A)+n(B)+n(C)−n(A∩B)−n(B∩C)−n(A∩C)+n(A∩B∩C)`,
        `= ${nA}+${nB}+${nC}−${nAB}−${nBC}−${nAC}+${nABC}`,
        `= ${nA+nB+nC} − ${nAB+nBC+nAC} + ${nABC}`,
        `= ${nAuBuC}`,
        `Students playing at least one: ${nAuBuC}`,
        `Students playing none: ${total}−${nAuBuC} = ${total-nAuBuC}`
      ],
      answer: `At least one sport: ${nAuBuC}, None: ${total-nAuBuC}`,
      answerLatex: `n(A\\cup B\\cup C)=${nAuBuC}`,
      tip: 'PIE pattern: add singles (×3) → subtract pairs (×3) → add triple (×1). Alternating signs!'
    };
  },
  partitions: (n) => {
    const size = srI(n, 3, 5);
    const S = Array.from({ length: size }, (_, i) => i + 1);
    const k = srI(n + 1, 2, Math.min(size, 3));
    const bellNums = [1, 1, 2, 5, 15, 52, 203];
    // Generate one valid partition
    const parts = [];
    const assigned = [...S];
    for (let p = 0; p < k; p++) {
      if (p === k - 1) { parts.push([...assigned]); break; }
      const take = srI(n + p * 7, 1, assigned.length - (k - p - 1));
      parts.push(assigned.splice(0, take));
    }
    return {
      question: `S = ${setTxt(S)}. (a) Show a valid partition of S into ${k} parts. (b) How many total partitions of S exist?`,
      questionLatex: `S=${setStr(S)}.\\text{ Give a ${k}-part partition. Total partitions?}`,
      steps: [
        `A partition must satisfy: non-empty parts, pairwise disjoint, union = S`,
        `Valid ${k}-partition: { ${parts.map(setTxt).join(', ')} }`,
        `Verify: ${parts.map(setTxt).join(' ∪ ')} = ${setTxt(S)} ✓`,
        `All parts non-empty ✓, All parts disjoint ✓`,
        `Total partitions of ${size}-element set = Bell number B_${size} = ${bellNums[size]}`
      ],
      answer: `Example: {${parts.map(setTxt).join(', ')}}. Total partitions: B_${size} = ${bellNums[size]}`,
      answerLatex: `\\{${parts.map(setStr).join(',\\;')}\\},\\quad B_{${size}}=${bellNums[size]}`,
      tip: `Bell numbers: B₁=1, B₂=2, B₃=5, B₄=15, B₅=52. Each Bₙ counts all partitions of an n-element set.`
    };
  },
  cantor: (n) => {
    const size = srI(n, 2, 4);
    const A = Array.from({ length: size }, (_, i) => srP(['a','b','c','d','e','f'], n + i));
    const pa = 1 << size;
    const examples = [
      { claim: `|A| = ${size} < ${pa} = |P(A)|`, explanation: 'power set is strictly larger' },
      { claim: `|ℕ| < |P(ℕ)| = |ℝ| (Cantor 1874)`, explanation: 'real numbers outnumber naturals' },
      { claim: `|ℝ| < |P(ℝ)|`, explanation: 'hierarchy continues without end' },
    ];
    const ex = examples[n % examples.length];
    return {
      question: `A = ${setTxt(A)}. Verify Cantor's Theorem: |P(A)| > |A|. Then describe the infinite case.`,
      questionLatex: `A=${setStr(A)}.\\text{ Verify }|P(A)|>|A|.`,
      steps: [
        `|A| = ${size}`,
        `|P(A)| = 2^|A| = 2^${size} = ${pa}`,
        `${pa} > ${size} ✓ — Cantor's theorem holds`,
        `Infinite case: A = ℕ (natural numbers)`,
        `P(ℕ) contains ALL subsets of ℕ — uncountably many!`,
        `Diagonal argument: assume f: ℕ → P(ℕ), let D = {n ∈ ℕ : n ∉ f(n)}`,
        `D ∈ P(ℕ) but D ≠ f(n) for any n — contradiction!`,
        `Therefore no bijection ℕ → P(ℕ) exists: |P(ℕ)| > |ℕ|`
      ],
      answer: `|P(A)| = ${pa} > ${size} = |A| ✓. Infinite case: |P(ℕ)| > |ℕ| (proven by diagonal argument)`,
      answerLatex: `|P(A)| = 2^{${size}} = ${pa} > ${size} = |A|\\quad\\checkmark`,
      tip: "Cantor's diagonal trick: construct an element that DIFFERS from every element in the assumed bijection. This forces contradiction."
    };
  },
  olympiad: (n) => {
    const problems = [
      (s) => {
        const nA = srI(s, 15, 30), nB = srI(s+1, 12, 28), nAuB = srI(s+2, Math.max(nA,nB), nA+nB-2);
        const nAiB = nA + nB - nAuB;
        return {
          question: `In a class, |A| = ${nA}, |B| = ${nB}, |A∪B| = ${nAuB}. Find |A∩B|, |A−B|, |B−A|.`,
          questionLatex: `|A|=${nA},|B|=${nB},|A\\cup B|=${nAuB}.\\text{ Find }|A\\cap B|,|A-B|,|B-A|.`,
          steps: [
            `|A∩B| = |A| + |B| − |A∪B| = ${nA} + ${nB} − ${nAuB} = ${nAiB}`,
            `|A−B| = |A| − |A∩B| = ${nA} − ${nAiB} = ${nA-nAiB}`,
            `|B−A| = |B| − |A∩B| = ${nB} − ${nAiB} = ${nB-nAiB}`,
            `Check: |A−B| + |A∩B| + |B−A| = ${nA-nAiB}+${nAiB}+${nB-nAiB} = ${nAuB} = |A∪B| ✓`
          ],
          answer: `|A∩B|=${nAiB}, |A−B|=${nA-nAiB}, |B−A|=${nB-nAiB}`,
          answerLatex: `|A\\cap B|=${nAiB},\\;|A-B|=${nA-nAiB},\\;|B-A|=${nB-nAiB}`
        };
      },
      (s) => {
        const n_ = srI(s, 3, 6);
        const total = 2 ** n_;
        const odd = srI(s+1, 1, n_) * 2 - 1;
        return {
          question: `A set A has ${n_} elements. (a) How many total subsets? (b) How many subsets of size ${odd} (odd)? (c) How many subsets have at least 1 element?`,
          questionLatex: `|A|=${n_}.\\text{ Subsets of size }${odd}?\\text{ Subsets with }\\geq 1\\text{ element?}`,
          steps: [
            `Total subsets = 2^${n_} = ${total}`,
            `Subsets of size ${odd}: C(${n_},${odd}) = ${n_}!/(${odd}!·${n_-odd}!) = ${fact(n_)/(fact(odd)*fact(n_-odd))}`,
            `Subsets with ≥1 element = Total − ∅ = ${total} − 1 = ${total-1}`,
          ],
          answer: `Total: ${total}, Size-${odd}: ${fact(n_)/(fact(odd)*fact(n_-odd))}, Non-empty: ${total-1}`,
          answerLatex: `2^{${n_}}=${total},\\;\\binom{${n_}}{${odd}}=${fact(n_)/(fact(odd)*fact(n_-odd))},\\;\\text{non-empty: }${total-1}`
        };
      },
      (s) => {
        const a = srI(s, 10, 30), b = srI(s+1, 8, 25), c = srI(s+2, 8, 25);
        const ab = srI(s+3, 3, Math.min(a,b)-2), bc = srI(s+4, 3, Math.min(b,c)-2), ac = srI(s+5, 3, Math.min(a,c)-2);
        const abc = srI(s+6, 1, Math.min(ab,bc,ac)-1);
        const union = a+b+c-ab-bc-ac+abc;
        return {
          question: `|A|=${a}, |B|=${b}, |C|=${c}, |A∩B|=${ab}, |B∩C|=${bc}, |A∩C|=${ac}, |A∩B∩C|=${abc}. Find |A∪B∪C|.`,
          questionLatex: `|A|=${a},|B|=${b},|C|=${c},|A\\cap B|=${ab},|B\\cap C|=${bc},|A\\cap C|=${ac},|A\\cap B\\cap C|=${abc}.`,
          steps: [
            `|A∪B∪C| = |A|+|B|+|C| − |A∩B| − |B∩C| − |A∩C| + |A∩B∩C|`,
            `= ${a}+${b}+${c} − ${ab} − ${bc} − ${ac} + ${abc}`,
            `= ${a+b+c} − ${ab+bc+ac} + ${abc}`,
            `= ${union}`
          ],
          answer: `|A∪B∪C| = ${union}`,
          answerLatex: `|A\\cup B\\cup C|=${union}`
        };
      },
    ];
    const p = problems[n % problems.length](n * 17 + 13);
    return { ...p, tip: 'Draw a 3-circle Venn diagram and fill innermost region first, then work outward.' };
  },
};

// Helper factorial for olympiad generator
function fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
// ── Global Styles ─────────────────────────────────────────────
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
      @keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
      @keyframes slideRight{from{width:0;}to{width:100%;}}
      @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(78,205,196,0.15);}50%{box-shadow:0 0 40px rgba(78,205,196,0.4);}}
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

// ── Progress Bar ──────────────────────────────────────────────
function ProgressBar({ current, total, color }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono,monospace', minWidth: 36 }}>
        {current}/{total}
      </span>
    </div>
  );
}

// ── SCREEN 1: Cover Page ──────────────────────────────────────
function CoverScreen({ onNext }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1600);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);
  const tags = ['Class 6 → Olympiad', '17 Topics', '∞ Practice Questions', 'RMO · INMO · IMO'];
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'radial-gradient(ellipse at 50% 0%, rgba(78,205,196,0.08) 0%, transparent 65%), #07090f', textAlign: 'center' }}>
      {/* Decorative floating symbols */}
      {['∈','∪','∩','⊆','∅','∞','∘','×'].map((sym, i) => (
        <div key={sym} style={{ position: 'fixed', pointerEvents: 'none', fontSize: 18 + (i % 3) * 8, color: `rgba(78,205,196,${0.04 + (i % 4) * 0.02})`, top: `${10 + i * 11}%`, left: i % 2 === 0 ? `${3 + i * 4}%` : `${75 + i * 2}%`, fontFamily: 'serif', animation: `pulse ${3 + i * 0.7}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}>
          {sym}
        </div>
      ))}
      {/* Chapter tag */}
      <div style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(78,205,196,0.08)', border: '1px solid rgba(78,205,196,0.25)', borderRadius: 40 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ECDC4', animation: 'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 12, color: '#4ECDC4', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Crimson Pro, serif' }}>Mathematics · Chapter 1</span>
      </div>
      {/* Main title */}
      <div style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.7s ease 0.1s', marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 'clamp(72px, 14vw, 130px)', color: '#fff', letterSpacing: '-4px', lineHeight: 0.9, marginBottom: 0 }}>
          S<span style={{ color: '#4ECDC4' }}>ets</span>
        </h1>
        <div style={{ height: 3, width: 80, background: 'linear-gradient(90deg, #4ECDC4, transparent)', margin: '16px auto 0', borderRadius: 2 }} />
      </div>
      {/* Definitions */}
      <div style={{ opacity: phase >= 3 ? 1 : 0, transition: 'all 0.6s ease', maxWidth: 560, marginBottom: 40 }}>
        <p style={{ fontFamily: 'Crimson Pro, serif', fontSize: 20, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: 18, fontStyle: 'italic' }}>
          "A well-defined collection of distinct objects."
        </p>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>Long Definition</div>
          <p style={{ fontFamily: 'Crimson Pro, serif', fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75 }}>
            A <strong style={{ color: '#fff' }}>set</strong> is a fundamental concept in mathematics — a collection of objects called <em>elements</em> or <em>members</em>, described with enough precision that we can always determine whether any given object belongs to it or not. Sets are the language in which nearly all of modern mathematics is written, from numbers and functions to geometry and logic. Two sets are equal if and only if they contain exactly the same elements, regardless of order or repetition.
          </p>
        </div>
        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          {tags.map(t => (
            <span key={t} style={{ padding: '4px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Crimson Pro, serif' }}>{t}</span>
          ))}
        </div>
      </div>
      {/* CTA */}
      {phase >= 3 && (
        <button onClick={onNext} className="btn" style={{ padding: '16px 48px', background: '#4ECDC4', color: '#07090f', border: 'none', borderRadius: 50, fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px', boxShadow: '0 8px 30px rgba(78,205,196,0.35)', animation: 'fadeUp 0.5s ease both' }}>
          Begin Chapter →
        </button>
      )}
    </div>
  );
}

// ── SCREEN 2: Notation Reference ──────────────────────────────
function NotationScreen({ onNext }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setTimeout(() => setRevealed(true), 100); }, []);
  const groups = [
    { title: 'Membership & Relations', color: '#4ECDC4', rows: NOTATION.slice(0, 6) },
    { title: 'Set Operations', color: '#FF6B6B', rows: NOTATION.slice(6, 10) },
    { title: 'Special Sets', color: '#A78BFA', rows: NOTATION.slice(10, 14) },
    { title: 'Advanced Notation', color: '#F59E0B', rows: NOTATION.slice(14, 19) },
    { title: 'Logic & Relations', color: '#34D399', rows: NOTATION.slice(19) },
  ];
  return (
    <div style={{ minHeight: '100vh', background: '#07090f', padding: '32px 16px 60px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32, opacity: revealed ? 1 : 0, transition: 'opacity 0.5s ease' }}>
          <div style={{ fontSize: 11, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'JetBrains Mono,monospace', marginBottom: 10 }}>Before We Begin</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 34, color: '#fff', letterSpacing: '-1px', marginBottom: 10 }}>
            Notation Guide
          </h2>
          <p style={{ fontFamily: 'Crimson Pro, serif', fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            These symbols are the language of sets. Study them once — you'll see them throughout the entire chapter and beyond.
          </p>
        </div>
        {/* Groups */}
        {groups.map((g, gi) => (
          <div key={g.title} style={{ marginBottom: 24, opacity: revealed ? 1 : 0, transform: revealed ? 'translateY(0)' : 'translateY(16px)', transition: `all 0.5s ease ${gi * 0.1 + 0.2}s` }}>
            <div style={{ fontSize: 11, color: g.color, textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono,monospace', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 2, background: g.color, borderRadius: 1 }} />
              {g.title}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              {g.rows.map((row, ri) => (
                <div key={row.sym} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 0, borderBottom: ri < g.rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', padding: '12px 16px', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'serif', fontSize: 20, color: g.color }}>
                    <KTex l={row.sym} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Crimson Pro, serif', fontWeight: 600, fontSize: 14, color: '#fff', marginBottom: 2 }}>{row.name}</div>
                    <div style={{ fontFamily: 'Crimson Pro, serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{row.meaning}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono,monospace', paddingLeft: 8 }}>
                    <KTex l={row.ex} style={{ fontSize: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* Quick Reference Card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(78,205,196,0.08), rgba(78,205,196,0.03))', border: '1px solid rgba(78,205,196,0.2)', borderRadius: 14, padding: '18px 20px', marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono,monospace', marginBottom: 12 }}>Quick Memory Aid</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {[['∈  reads as', '"is an element of"'], ['∪  looks like', '"U" for Union'], ['∩  flipped ∪', '"∩" for iNtersection'], ['⊆  like ≤', '"subset or equal"'], ['∅  or {}', '"nothing inside"'], ['P(A)', '"all Possibilities"']].map(([sym, hint]) => (
              <div key={sym} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#4ECDC4', minWidth: 90 }}>{sym}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'Crimson Pro,serif', fontStyle: 'italic' }}>{hint}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onNext} className="btn" style={{ width: '100%', padding: '16px', background: '#4ECDC4', color: '#07090f', border: 'none', borderRadius: 12, fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 17, boxShadow: '0 6px 24px rgba(78,205,196,0.3)' }}>
          Start Learning Sets →
        </button>
      </div>
    </div>
  );
}
// ── SCREEN 3: Section Menu ────────────────────────────────────
function SectionMenuScreen({ onSelect, completedIds }) {
  const levels = ['Beginner', 'Intermediate', 'Olympiad'];
  const levelColors = { Beginner: '#4ECDC4', Intermediate: '#F59E0B', Olympiad: '#C084FC' };
  const levelDesc = {
    Beginner: 'Class 6–10 · Core fundamentals',
    Intermediate: 'Class 11–12 · CBSE & State boards',
    Olympiad: 'RMO · INMO · IMO · Putnam',
  };
  return (
    <div style={{ minHeight: '100vh', background: '#07090f', padding: '28px 16px 60px' }}>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'JetBrains Mono,monospace', marginBottom: 8 }}>Chapter · Sets</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 30, color: '#fff', letterSpacing: '-0.8px', marginBottom: 6 }}>Choose a Topic</h2>
          <p style={{ fontFamily: 'Crimson Pro, serif', fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>
            Topics flow from beginner to olympiad — follow them in order for best results.
          </p>
        </div>
        {levels.map(level => (
          <div key={level} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: levelColors[level] }} />
              <span style={{ fontSize: 13, color: levelColors[level], fontWeight: 600, fontFamily: 'Crimson Pro, serif', textTransform: 'uppercase', letterSpacing: '1px' }}>{level}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Crimson Pro, serif' }}>— {levelDesc[level]}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SECTIONS.filter(s => s.level === level).map(sec => {
                const done = completedIds.has(sec.id);
                return (
                  <button key={sec.id} onClick={() => onSelect(sec)} className="btn"
                    style={{ background: done ? `${levelColors[level]}10` : 'rgba(255,255,255,0.025)', border: `1px solid ${done ? levelColors[level]+'44' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '14px 18px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${levelColors[level]}15`, border: `1px solid ${levelColors[level]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: levelColors[level], fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>
                      {done ? '✓' : sec.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 15, color: done ? levelColors[level] : '#fff', marginBottom: 2 }}>{sec.title}</div>
                      <div style={{ fontFamily: 'Crimson Pro, serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.shortDef}</div>
                    </div>
                    <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>→</div>
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

// ── SCREEN 4: Section Learn Screen ────────────────────────────
function SectionLearnScreen({ section, onPractice, onBack }) {
  const [tab, setTab] = useState('learn');
  const levelColors = { Beginner: '#4ECDC4', Intermediate: '#F59E0B', Olympiad: '#C084FC' };
  const col = levelColors[section.level] || '#4ECDC4';
  return (
    <div style={{ minHeight: '100vh', background: '#07090f', padding: '0 0 80px' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(7,9,15,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} className="btn" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 8, padding: '6px 13px', fontSize: 13 }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>{section.title}</div>
          <div style={{ fontSize: 11, color: col, fontFamily: 'JetBrains Mono,monospace' }}>{section.level}</div>
        </div>
      </div>
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '24px 16px' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
          {['learn', 'keys'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn"
              style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: tab === t ? col : 'transparent', color: tab === t ? '#07090f' : 'rgba(255,255,255,0.5)', fontFamily: 'Crimson Pro, serif', fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>
              {t === 'learn' ? '📖 Explanation' : '🔑 Key Facts'}
            </button>
          ))}
        </div>
        {tab === 'learn' && (
          <div className="fade-in">
            {/* Icon + short def */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: `${col}15`, border: `1px solid ${col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: col, fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>{section.icon}</div>
              <div>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 19, color: '#fff', fontStyle: 'italic', lineHeight: 1.45 }}>"{section.shortDef}"</p>
              </div>
            </div>
            {/* Venn if applicable */}
            {section.vennType && (
              <div style={{ marginBottom: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, display: 'flex', justifyContent: 'center' }}>
                <VennSVG shade={section.vennType} size={280} />
              </div>
            )}
            {/* Long definition */}
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: col, textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono,monospace', marginBottom: 10 }}>Full Explanation</div>
              <p style={{ fontFamily: 'Crimson Pro, serif', fontSize: 17, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>{section.fullDef}</p>
            </div>
          </div>
        )}
        {tab === 'keys' && (
          <div className="fade-in">
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono,monospace', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 14 }}>Key Results & Formulas</div>
            {section.keyFacts.map((fact, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start', animation: `fadeUp 0.4s ease ${i * 0.07}s both` }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `${col}18`, border: `1px solid ${col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: col, fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Crimson Pro, serif', fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>{fact.text}</div>
                  <div style={{ background: `${col}0d`, border: `1px solid ${col}22`, borderRadius: 8, padding: '8px 12px' }}>
                    <KTex l={fact.l} style={{ color: col, fontSize: 15 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Practice CTA */}
        <div style={{ marginTop: 32, position: 'sticky', bottom: 24 }}>
          <button onClick={onPractice} className="btn" style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${col}, ${col}cc)`, color: '#07090f', border: 'none', borderRadius: 12, fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 17, boxShadow: `0 6px 24px ${col}40` }}>
            ⚡ Practice Questions →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SCREEN 5: Practice Question ───────────────────────────────
function PracticeScreen({ section, onBack, onDone }) {
  const [qIdx, setQIdx] = useState(0);
  const [baseSeed] = useState(() => Math.floor(Math.random() * 10000));
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [count, setCount] = useState(0);

  const levelColors = { Beginner: '#4ECDC4', Intermediate: '#F59E0B', Olympiad: '#C084FC' };
  const col = levelColors[section.level] || '#4ECDC4';

  const gen = GENERATORS[section.genKey] || GENERATORS.membership;
  const seed = baseSeed + qIdx * 97;
  const q = useCallback(() => {
    try { return gen(seed); }
    catch { return { question: 'Question loading...', steps: [], answer: '—', answerLatex: '—', tip: '' }; }
  }, [seed, gen]);
  const question = q();

  const next = () => {
    setQIdx(i => i + 1);
    setShowAnswer(false);
    setShowSteps(false);
    setCount(c => c + 1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', paddingBottom: 80 }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(7,9,15,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button onClick={onBack} className="btn" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 8, padding: '6px 13px', fontSize: 13 }}>← Learn</button>
          <div style={{ flex: 1, fontFamily: 'Playfair Display, serif', fontSize: 14, color: '#fff' }}>{section.title}</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: col, background: `${col}15`, padding: '4px 10px', borderRadius: 20 }}>Q {count + 1}</div>
          <button onClick={onDone} className="btn" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 8, padding: '6px 13px', fontSize: 13 }}>Done ✓</button>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Crimson Pro,serif', fontStyle: 'italic' }}>
          Infinite practice · Each question is uniquely generated
        </div>
      </div>

      <div style={{ maxWidth: 660, margin: '0 auto', padding: '24px 16px' }}>
        {/* Question card */}
        <div key={qIdx} className="fade-up" style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${col}30`, borderRadius: 16, overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ background: `${col}10`, borderBottom: `1px solid ${col}20`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, color: col, textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono,monospace' }}>Question {count + 1} · {section.level}</span>
          </div>
          <div style={{ padding: '20px 20px 22px' }}>
            <p style={{ fontFamily: 'Crimson Pro, serif', fontSize: 17, color: '#e2e8f0', lineHeight: 1.7, marginBottom: 12 }}>{question.question}</p>
            {question.questionLatex && (
              <div style={{ background: `${col}0d`, border: `1px solid ${col}20`, borderRadius: 10, padding: '12px 16px', overflowX: 'auto' }}>
                <KTex l={question.questionLatex} style={{ color: col, fontSize: 15 }} />
              </div>
            )}
          </div>
        </div>

        {/* Reveal buttons */}
        {!showAnswer && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button onClick={() => setShowSteps(v => !v)} className="btn"
              style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'Crimson Pro,serif', fontSize: 15 }}>
              {showSteps ? '🙈 Hide Steps' : '💡 Show Steps'}
            </button>
            <button onClick={() => setShowAnswer(true)} className="btn"
              style={{ flex: 1, padding: '12px', background: `${col}20`, border: `1px solid ${col}44`, borderRadius: 10, color: col, fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 15 }}>
              Reveal Answer ▶
            </button>
          </div>
        )}

        {/* Steps */}
        {showSteps && !showAnswer && (
          <div className="fade-up" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono,monospace', marginBottom: 12 }}>Step-by-Step Approach</div>
            {question.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < question.steps.length - 1 ? 10 : 0, animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                <span style={{ color: `${col}77`, fontSize: 11, fontFamily: 'JetBrains Mono,monospace', minWidth: 20, paddingTop: 2 }}>{i + 1}.</span>
                <span style={{ fontFamily: 'Crimson Pro,serif', fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Answer */}
        {showAnswer && (
          <div className="fade-up">
            {/* All steps */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono,monospace', marginBottom: 12 }}>Solution</div>
              {question.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < question.steps.length - 1 ? 10 : 0, animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                  <span style={{ color: `${col}77`, fontSize: 11, fontFamily: 'JetBrains Mono,monospace', minWidth: 20, paddingTop: 2 }}>{i + 1}.</span>
                  <span style={{ fontFamily: 'Crimson Pro,serif', fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{step}</span>
                </div>
              ))}
            </div>
            {/* Answer box */}
            <div style={{ background: `linear-gradient(135deg, ${col}18, ${col}08)`, border: `1px solid ${col}44`, borderRadius: 14, padding: '16px 20px', marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: `${col}99`, textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono,monospace', marginBottom: 8 }}>Answer</div>
              <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                <KTex l={question.answerLatex || question.answer} style={{ color: col, fontSize: 16 }} />
              </div>
            </div>
            {/* Tip */}
            {question.tip && (
              <div style={{ background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                <p style={{ fontFamily: 'Crimson Pro,serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(255,209,102,0.85)', lineHeight: 1.6 }}>{question.tip}</p>
              </div>
            )}
            {/* Next */}
            <button onClick={next} className="btn" style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${col}, ${col}cc)`, color: '#07090f', border: 'none', borderRadius: 12, fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 17, boxShadow: `0 6px 24px ${col}40` }}>
              Next Question ⟶
            </button>
            <p style={{ textAlign: 'center', marginTop: 10, fontFamily: 'Crimson Pro,serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
              Questions are procedurally generated — they never repeat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
// ── Main App ──────────────────────────────────────────────────
export default function App() {
  useGlobalStyles();
  const [screen, setScreen] = useState('cover');
  const [activeSection, setActiveSection] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [completedIds, setCompletedIds] = useState(new Set());

  const markDone = (id) => setCompletedIds(prev => new Set([...prev, id]));

  // cover → notation → menu → (learn → practice) loop
  if (screen === 'cover') {
    return <CoverScreen onNext={() => setScreen('notation')} />;
  }
  if (screen === 'notation') {
    return <NotationScreen onNext={() => setScreen('menu')} />;
  }
  if (screen === 'menu') {
    return (
      <SectionMenuScreen
        completedIds={completedIds}
        onSelect={(sec) => { setActiveSection(sec); setPracticeMode(false); setScreen('learn'); }}
      />
    );
  }
  if (screen === 'learn' && activeSection) {
    return (
      <SectionLearnScreen
        section={activeSection}
        onBack={() => setScreen('menu')}
        onPractice={() => { setPracticeMode(true); setScreen('practice'); }}
      />
    );
  }
  if (screen === 'practice' && activeSection) {
    return (
      <PracticeScreen
        section={activeSection}
        onBack={() => setScreen('learn')}
        onDone={() => {
          markDone(activeSection.id);
          setScreen('menu');
        }}
      />
    );
  }
  return <CoverScreen onNext={() => setScreen('notation')} />;
}

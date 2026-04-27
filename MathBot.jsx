import { useState, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════════
//  MATH ENGINE — 100% OFFLINE, PURE PROCEDURAL GENERATION
// ════════════════════════════════════════════════════════════════

const rng  = (mn, mx) => Math.floor(Math.random() * (mx - mn + 1)) + mn;
const pick = (arr)    => arr[Math.floor(Math.random() * arr.length)];
const gcd  = (a, b)   => b === 0 ? Math.abs(a) : gcd(b, a % b);
const lcm  = (a, b)   => Math.abs(a * b) / gcd(a, b);
const fact = (n)      => n <= 1 ? 1 : n * fact(n - 1);
const nCr  = (n, r)   => fact(n) / (fact(r) * fact(n - r));
const nPr  = (n, r)   => fact(n) / fact(n - r);

// Unicode superscripts — renders exponents without HTML tags
const SUP_MAP = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','+':'⁺'};
const toSup = (n) => String(n).split('').map(c => SUP_MAP[c] ?? c).join('');

// ── BEGINNER ─────────────────────────────────────────────────────

const genLinear = (lv) => {
  const x = rng(1, 6 + lv * 2) * (lv > 2 && Math.random() > 0.5 ? -1 : 1);
  const a = rng(2, 4 + lv);
  const b = rng(1, 10 + lv * 3);
  const c = a * x + b;
  return {
    question: `Solve for x:   ${a}x + ${b} = ${c}`,
    answer:   `x = ${x}`,
    hint:     `Isolate x by subtracting ${b} from both sides, then divide by ${a}.`,
    steps: [
      `Start:  ${a}x + ${b} = ${c}`,
      `Subtract ${b} from both sides:  ${a}x = ${c - b}`,
      `Divide both sides by ${a}:  x = ${(c - b) / a}`,
      `Answer:  x = ${x}`,
    ],
    topic: "Linear Equations",
  };
};

const genRatio = (lv) => {
  const a = rng(2, 5), b = rng(2, 6);
  const m = rng(3, 7 + lv * 3);
  const total = (a + b) * m;
  return {
    question: `Two quantities are in the ratio ${a} : ${b}.\nTheir sum is ${total}. Find each quantity.`,
    answer:   `${a * m} and ${b * m}`,
    hint:     `Find the value of 1 part: divide the total by (${a} + ${b}).`,
    steps: [
      `Total parts = ${a} + ${b} = ${a + b}`,
      `Value of 1 part = ${total} ÷ ${a + b} = ${m}`,
      `First quantity = ${a} × ${m} = ${a * m}`,
      `Second quantity = ${b} × ${m} = ${b * m}`,
    ],
    topic: "Ratios",
  };
};

const genPercent = (lv) => {
  const p    = pick([10, 15, 20, 25, 30, 40, 50]);
  const base = rng(10, 25 + lv * 15) * 10;
  const res  = (p / 100) * base;
  return pick([
    {
      question: `What is ${p}% of ${base}?`,
      answer:   `${res}`,
      hint:     `Multiply ${base} by ${p}/100.`,
      steps: [
        `Formula:  (${p}/100) × ${base}`,
        `= 0.${p < 10 ? '0' + p : p} × ${base}`,
        `= ${res}`,
      ],
      topic: "Percentages",
    },
    {
      question: `${res} is ${p}% of which number?`,
      answer:   `${base}`,
      hint:     `If ${p}% of x = ${res}, then x = ${res} × (100/${p}).`,
      steps: [
        `Let the number = x`,
        `${p}% of x = ${res}`,
        `x = ${res} × 100 / ${p}`,
        `x = ${base}`,
      ],
      topic: "Percentages",
    },
    {
      question: `A value increases from ${base} to ${base + res}.\nWhat is the percentage increase?`,
      answer:   `${p}%`,
      hint:     `% increase = (increase ÷ original) × 100.`,
      steps: [
        `Increase = ${base + res} − ${base} = ${res}`,
        `% increase = (${res} / ${base}) × 100`,
        `= ${p}%`,
      ],
      topic: "Percentages",
    },
  ]);
};

const genSI = (lv) => {
  const P  = pick([1000, 2000, 5000, 8000, 10000]);
  const R  = pick([5, 8, 10, 12, 15]);
  const T  = rng(1, 4);
  const SI = (P * R * T) / 100;
  const A  = P + SI;
  return {
    question: `Find the Simple Interest on ₹${P}\nat ${R}% per annum for ${T} year${T > 1 ? "s" : ""}.`,
    answer:   `SI = ₹${SI}, Amount = ₹${A}`,
    hint:     `Use SI = (P × R × T) / 100.`,
    steps: [
      `Formula: SI = P × R × T / 100`,
      `SI = ${P} × ${R} × ${T} / 100`,
      `SI = ₹${SI}`,
      `Amount = P + SI = ₹${P} + ₹${SI} = ₹${A}`,
    ],
    topic: "Simple Interest",
  };
};

const genCI = (lv) => {
  const P = pick([1000, 2000, 5000, 10000]);
  const R = pick([5, 10, 20]);
  const T = rng(1, 3);
  const A  = +(P * Math.pow(1 + R / 100, T)).toFixed(2);
  const CI = +(A - P).toFixed(2);
  return {
    question: `Find the Compound Interest on ₹${P}\nat ${R}% p.a. for ${T} year${T > 1 ? "s" : ""}, compounded annually.`,
    answer:   `CI = ₹${CI}, Amount = ₹${A}`,
    hint:     `Use A = P(1 + R/100)^T, then CI = A − P.`,
    steps: [
      `Formula: A = P(1 + R/100)^T`,
      `A = ${P} × (1 + ${R}/100)${toSup(T)}`,
      `A = ${P} × ${(1 + R / 100).toFixed(2)}${toSup(T)} = ₹${A}`,
      `CI = A − P = ₹${A} − ₹${P} = ₹${CI}`,
    ],
    topic: "Compound Interest",
  };
};

const genSTD = (lv) => {
  const s = pick([30, 40, 50, 60, 80, 100]);
  const t = rng(1, 4 + lv);
  const d = s * t;
  return pick([
    {
      question: `A vehicle travels at ${s} km/h for ${t} hour${t > 1 ? "s" : ""}.\nHow far does it travel?`,
      answer:   `${d} km`,
      hint:     `Distance = Speed × Time.`,
      steps: [
        `Formula: Distance = Speed × Time`,
        `Distance = ${s} × ${t}`,
        `= ${d} km`,
      ],
      topic: "Speed, Time & Distance",
    },
    {
      question: `A train covers ${d} km in ${t} hour${t > 1 ? "s" : ""}.\nFind its speed.`,
      answer:   `${s} km/h`,
      hint:     `Speed = Distance / Time.`,
      steps: [
        `Formula: Speed = Distance / Time`,
        `Speed = ${d} / ${t}`,
        `= ${s} km/h`,
      ],
      topic: "Speed, Time & Distance",
    },
    {
      question: `How long does it take to cover ${d} km at ${s} km/h?`,
      answer:   `${t} hour${t > 1 ? "s" : ""}`,
      hint:     `Time = Distance / Speed.`,
      steps: [
        `Formula: Time = Distance / Speed`,
        `Time = ${d} / ${s}`,
        `= ${t} hour${t > 1 ? "s" : ""}`,
      ],
      topic: "Speed, Time & Distance",
    },
  ]);
};

const genGeometry = (lv) => {
  const ang = rng(15, 74);
  const a1  = rng(30, 65), a2 = rng(20, 50), a3 = 180 - a1 - a2;
  return pick([
    {
      question: `Find the supplement of ${ang}°.`,
      answer:   `${180 - ang}°`,
      hint:     `Supplementary angles add up to 180°.`,
      steps: [
        `Supplementary angles sum to 180°`,
        `Supplement = 180° − ${ang}°`,
        `= ${180 - ang}°`,
      ],
      topic: "Geometry",
    },
    {
      question: `Find the complement of ${ang < 90 ? ang : 45}°.`,
      answer:   `${90 - (ang < 90 ? ang : 45)}°`,
      hint:     `Complementary angles add up to 90°.`,
      steps: [
        `Complementary angles sum to 90°`,
        `Complement = 90° − ${ang < 90 ? ang : 45}°`,
        `= ${90 - (ang < 90 ? ang : 45)}°`,
      ],
      topic: "Geometry",
    },
    {
      question: `A triangle has angles ${a1}° and ${a2}°.\nFind the third angle.`,
      answer:   `${a3}°`,
      hint:     `All three angles of a triangle sum to 180°.`,
      steps: [
        `Angles in a triangle sum to 180°`,
        `Third angle = 180° − ${a1}° − ${a2}°`,
        `= ${a3}°`,
      ],
      topic: "Geometry",
    },
    {
      question: `Two angles are supplementary and one is ${ang}° more than the other.\nFind both angles.`,
      answer:   `${(180 - ang) / 2}° and ${(180 + ang) / 2}°`,
      hint:     `Let angles be x and x+${ang}. They sum to 180°.`,
      steps: [
        `Let the angles be x and x + ${ang}`,
        `x + (x + ${ang}) = 180°`,
        `2x = ${180 - ang},  x = ${(180 - ang) / 2}°`,
        `Other angle = ${(180 - ang) / 2}° + ${ang}° = ${(180 + ang) / 2}°`,
      ],
      topic: "Geometry",
    },
  ]);
};

// ── NEW BEGINNER GENERATORS ───────────────────────────────────────

const genFractions = (lv) => {
  const makeF = () => {
    const d = pick([2, 3, 4, 5, 6, 8, 10]);
    const n = rng(1, d - 1);
    return { n, d, s: `${n}/${d}` };
  };
  const a = makeF(), b = makeF();
  const lcd = lcm(a.d, b.d);
  const sumN = a.n * (lcd / a.d) + b.n * (lcd / b.d);
  const g2 = gcd(sumN, lcd);
  const mulN = a.n * b.n, mulD = a.d * b.d, mg = gcd(mulN, mulD);
  return pick([
    {
      question: `Add the fractions:\n\n${a.s}  +  ${b.s}`,
      answer:   g2 === lcd ? `${sumN / g2}` : `${sumN / g2}/${lcd / g2}`,
      hint:     `Find the LCD of ${a.d} and ${b.d}, which is ${lcd}.`,
      steps: [
        `LCD of ${a.d} and ${b.d} = ${lcd}`,
        `${a.s} = ${a.n * (lcd / a.d)}/${lcd}`,
        `${b.s} = ${b.n * (lcd / b.d)}/${lcd}`,
        `Sum = ${sumN}/${lcd}${g2 > 1 ? ` = ${sumN / g2}/${lcd / g2}` : ""}`,
      ],
      topic: "Fractions & Decimals",
    },
    {
      question: `Multiply the fractions:\n\n${a.s}  ×  ${b.s}`,
      answer:   mg === mulD ? `${mulN / mg}` : `${mulN / mg}/${mulD / mg}`,
      hint:     `Multiply numerators together and denominators together, then simplify.`,
      steps: [
        `Numerator: ${a.n} × ${b.n} = ${mulN}`,
        `Denominator: ${a.d} × ${b.d} = ${mulD}`,
        `Result: ${mulN}/${mulD}${mg > 1 ? ` = ${mulN / mg}/${mulD / mg}` : ""}`,
      ],
      topic: "Fractions & Decimals",
    },
    (() => {
      const whole = rng(1, 5);
      const dec = pick([0.25, 0.5, 0.75, 0.1, 0.2]);
      const total = +(whole + dec).toFixed(2);
      const [n2, d2] = dec === 0.25 ? [1,4] : dec === 0.5 ? [1,2] : dec === 0.75 ? [3,4] : dec === 0.1 ? [1,10] : [1,5];
      return {
        question: `Convert the decimal  ${total}  to a mixed number (fraction).`,
        answer:   `${whole} and ${n2}/${d2}`,
        hint:     `Separate the whole part (${whole}) from the decimal (${dec}).`,
        steps: [
          `Whole number part = ${whole}`,
          `Decimal part = ${dec} = ${n2}/${d2}`,
          `Mixed number = ${whole} ${n2}/${d2}`,
        ],
        topic: "Fractions & Decimals",
      };
    })(),
  ]);
};

const genProportions = (lv) => {
  const w1 = rng(3, 8), d1 = rng(6, 15), d2 = rng(4, 12);
  const w2 = Math.round((w1 * d2) / d1 * 10) / 10;
  const k  = rng(2, 8), x1v = rng(2, 6);
  const y1v = k * x1v, x2v = rng(2, 8), y2v = k * x2v;
  return pick([
    {
      question: `If ${w1} workers can build a wall in ${d1} days,\nhow many days will ${w2 % 1 === 0 ? w2 : w1 * 2} workers take?\n(Inverse Variation)`,
      answer:   `${Math.round(w1 * d1 / (w1 * 2))} days`,
      hint:     `More workers → fewer days. workers × days = constant.`,
      steps: [
        `Inverse variation: workers × days = constant`,
        `${w1} × ${d1} = ${w1 * d1}`,
        `New workers = ${w1 * 2}`,
        `Days = ${w1 * d1} ÷ ${w1 * 2} = ${Math.round(w1 * d1 / (w1 * 2))} days`,
      ],
      topic: "Proportions & Variations",
    },
    {
      question: `y varies directly with x.\nWhen x = ${x1v}, y = ${y1v}.\nFind y when x = ${x2v}.`,
      answer:   `y = ${y2v}`,
      hint:     `Direct variation: y = kx. Find k first.`,
      steps: [
        `y = kx  (direct variation)`,
        `k = y/x = ${y1v}/${x1v} = ${k}`,
        `When x = ${x2v}: y = ${k} × ${x2v} = ${y2v}`,
      ],
      topic: "Proportions & Variations",
    },
    (() => {
      const speed1 = rng(40, 80), time1 = rng(2, 5);
      const time2  = rng(2, 6);
      const speed2 = Math.round((speed1 * time1) / time2);
      return {
        question: `A car travels ${speed1 * time1} km.\nAt ${speed1} km/h it takes ${time1} hrs.\nAt what speed covers the same in ${time2} hrs?`,
        answer:   `${speed2} km/h`,
        hint:     `Distance is constant. Speed × Time = Distance.`,
        steps: [
          `Distance = ${speed1} × ${time1} = ${speed1 * time1} km`,
          `New speed = Distance ÷ New time`,
          `= ${speed1 * time1} ÷ ${time2} = ${speed2} km/h`,
        ],
        topic: "Proportions & Variations",
      };
    })(),
  ]);
};

const genExponents = (lv) => {
  const base = pick([2, 3, 4, 5]);
  const e1 = rng(2, 4), e2 = rng(1, 3);
  return pick([
    {
      question: `Evaluate:\n\n${base}${toSup(e1)}  ×  ${base}${toSup(e2)}`,
      answer:   `${base ** (e1 + e2)}`,
      hint:     `When multiplying same bases, add the exponents: aᵐ × aⁿ = aᵐ⁺ⁿ.`,
      steps: [
        `Rule: aᵐ × aⁿ = aᵐ⁺ⁿ`,
        `${base}${toSup(e1)} × ${base}${toSup(e2)} = ${base}^(${e1}+${e2})`,
        `= ${base}${toSup(e1 + e2)}`,
        `= ${base ** (e1 + e2)}`,
      ],
      topic: "Exponents & Radicals",
    },
    {
      question: `Simplify:\n\n${base}${toSup(e1 + e2)}  ÷  ${base}${toSup(e2)}`,
      answer:   `${base ** e1}`,
      hint:     `When dividing same bases, subtract exponents: aᵐ ÷ aⁿ = aᵐ⁻ⁿ.`,
      steps: [
        `Rule: aᵐ ÷ aⁿ = aᵐ⁻ⁿ`,
        `${base}${toSup(e1 + e2)} ÷ ${base}${toSup(e2)} = ${base}^(${e1 + e2}−${e2})`,
        `= ${base}${toSup(e1)} = ${base ** e1}`,
      ],
      topic: "Exponents & Radicals",
    },
    (() => {
      const perfect = pick([[4,2],[9,3],[16,4],[25,5],[36,6],[49,7],[64,8]]);
      const coeff   = pick([3, 4, 5, 12]);
      const inner   = perfect[0] * coeff;
      return {
        question: `Simplify:\n\n√${inner}`,
        answer:   `${perfect[1]}√${coeff}`,
        hint:     `Factor out the largest perfect square from ${inner}.`,
        steps: [
          `Factor: ${inner} = ${perfect[0]} × ${coeff}`,
          `√${inner} = √${perfect[0]} × √${coeff}`,
          `= ${perfect[1]}√${coeff}`,
        ],
        topic: "Exponents & Radicals",
      };
    })(),
    (() => {
      const b2 = pick([2, 3, 4, 5]);
      const exp = rng(2, 4);
      const ans = b2 ** exp;
      return {
        question: `Evaluate:\n\n(${b2}${toSup(exp)})⁰`,
        answer:   `1`,
        hint:     `Any nonzero number raised to the power 0 equals 1.`,
        steps: [
          `Rule: a⁰ = 1  for any a ≠ 0`,
          `(${b2}${toSup(exp)})⁰ = 1`,
        ],
        topic: "Exponents & Radicals",
      };
    })(),
  ]);
};

const genBasicStats = (lv) => {
  const count = rng(5, 7);
  const nums  = Array.from({ length: count }, () => rng(1, 20 + lv * 5));
  const sorted = [...nums].sort((a, b) => a - b);
  const sum    = nums.reduce((a, b) => a + b, 0);
  const mean   = +(sum / count).toFixed(2);
  const mid    = Math.floor(count / 2);
  const median = count % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const range  = sorted[sorted.length - 1] - sorted[0];
  const freq   = {};
  nums.forEach(n => freq[n] = (freq[n] || 0) + 1);
  const maxF   = Math.max(...Object.values(freq));
  const modes  = Object.entries(freq).filter(([,f]) => f === maxF).map(([v]) => v);
  const modeStr = maxF === 1 ? "No mode" : modes.join(" and ");
  const setStr  = nums.join(",  ");
  return pick([
    {
      question: `Find the MEAN of this data set:\n\n{${setStr}}`,
      answer:   `Mean = ${mean}`,
      hint:     `Mean = Sum of all values ÷ Number of values.`,
      steps: [
        `Sum = ${nums.join(" + ")} = ${sum}`,
        `Count = ${count}`,
        `Mean = ${sum} ÷ ${count} = ${mean}`,
      ],
      topic: "Basic Statistics",
    },
    {
      question: `Find the MEDIAN of this data set:\n\n{${setStr}}`,
      answer:   `Median = ${median}`,
      hint:     `Sort the values, then find the middle one.`,
      steps: [
        `Sorted: {${sorted.join(", ")}}`,
        `Count = ${count} (${count % 2 === 1 ? "odd" : "even"})`,
        count % 2 === 1
          ? `Middle value (position ${mid + 1}) = ${median}`
          : `Average of positions ${mid} and ${mid + 1}: (${sorted[mid-1]} + ${sorted[mid]}) / 2 = ${median}`,
      ],
      topic: "Basic Statistics",
    },
    {
      question: `Find the RANGE of this data set:\n\n{${setStr}}`,
      answer:   `Range = ${range}`,
      hint:     `Range = Highest value − Lowest value.`,
      steps: [
        `Sorted: {${sorted.join(", ")}}`,
        `Highest = ${sorted[sorted.length - 1]},  Lowest = ${sorted[0]}`,
        `Range = ${sorted[sorted.length - 1]} − ${sorted[0]} = ${range}`,
      ],
      topic: "Basic Statistics",
    },
    {
      question: `Find the MODE of this data set:\n\n{${setStr}}`,
      answer:   modeStr,
      hint:     `Mode = the value that appears most often.`,
      steps: [
        `Count the frequency of each value`,
        maxF === 1
          ? `All values appear once → No mode`
          : `Highest frequency = ${maxF}`,
        `Mode: ${modeStr}`,
      ],
      topic: "Basic Statistics",
    },
  ]);
};

// ── INTERMEDIATE ──────────────────────────────────────────────────

const genQuadratic = (lv) => {
  const r1 = rng(-7, 7), r2 = rng(-8, 8);
  const b  = -(r1 + r2), c = r1 * r2;
  const bS = b === 0 ? "" : b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  const cS = c === 0 ? "" : c > 0 ? ` + ${c}` : ` − ${Math.abs(c)}`;
  return {
    question: `Find the roots of:\n\nx²${bS}${cS} = 0`,
    answer:   `x = ${r1} and x = ${r2}`,
    hint:     `Factor the quadratic. Find two numbers that multiply to ${c} and add to ${b}.`,
    steps: [
      `x²${bS}${cS} = 0`,
      `Factor as  (x ${r1 >= 0 ? "−" : "+"} ${Math.abs(r1)})(x ${r2 >= 0 ? "−" : "+"} ${Math.abs(r2)}) = 0`,
      `Setting each factor to zero:`,
      `x = ${r1}  or  x = ${r2}`,
    ],
    topic: "Quadratic Equations",
  };
};

const genIdentity = (lv) => {
  const a = rng(2, 8 + lv * 2), b = rng(1, 6 + lv);
  const ap = a + b, am = Math.abs(a - b), ab = a * b;
  return pick([
    {
      question: `Expand:\n\n(${a} + ${b})²`,
      answer:   `${(a + b) ** 2}`,
      hint:     `Use (a+b)² = a² + 2ab + b².`,
      steps: [
        `Identity: (a+b)² = a² + 2ab + b²`,
        `= ${a}² + 2×${a}×${b} + ${b}²`,
        `= ${a ** 2} + ${2 * ab} + ${b ** 2}`,
        `= ${(a + b) ** 2}`,
      ],
      topic: "Algebraic Identities",
    },
    {
      question: `If  a + b = ${ap}  and  ab = ${ab},\nfind  a² + b².`,
      answer:   `${a ** 2 + b ** 2}`,
      hint:     `Use a² + b² = (a+b)² − 2ab.`,
      steps: [
        `Identity: a² + b² = (a+b)² − 2ab`,
        `= ${ap}² − 2(${ab})`,
        `= ${ap ** 2} − ${2 * ab}`,
        `= ${a ** 2 + b ** 2}`,
      ],
      topic: "Algebraic Identities",
    },
    {
      question: `Evaluate:\n\n(${ap})² − (${am})²`,
      answer:   `${ap ** 2 - am ** 2}`,
      hint:     `Use the difference of squares: a² − b² = (a+b)(a−b).`,
      steps: [
        `Identity: a² − b² = (a+b)(a−b)`,
        `= (${ap} + ${am})(${ap} − ${am})`,
        `= ${ap + am} × ${ap - am}`,
        `= ${(ap + am) * (ap - am)}`,
      ],
      topic: "Algebraic Identities",
    },
  ]);
};

const genProgression = (lv) => {
  const type = pick(["AP", "AP", "GP"]);
  if (type === "AP") {
    const a = rng(1, 10), d = rng(1, 6), n = rng(5, 10);
    const nth = a + (n - 1) * d;
    const sn  = (n * (2 * a + (n - 1) * d)) / 2;
    return pick([
      {
        question: `Find the ${n}th term of the AP:\n${a},  ${a + d},  ${a + 2 * d},  ...`,
        answer:   `a_${n} = ${nth}`,
        hint:     `Use aₙ = a + (n−1)d. Here a=${a}, d=${d}.`,
        steps: [
          `Formula: aₙ = a + (n−1)d`,
          `a = ${a},  d = ${d},  n = ${n}`,
          `a_${n} = ${a} + (${n}−1) × ${d}`,
          `= ${a} + ${(n - 1) * d} = ${nth}`,
        ],
        topic: "AP/GP",
      },
      {
        question: `Find the sum of first ${n} terms of AP:\n${a},  ${a + d},  ${a + 2 * d},  ...`,
        answer:   `S_${n} = ${sn}`,
        hint:     `Use Sₙ = n/2 × [2a + (n−1)d].`,
        steps: [
          `Formula: Sₙ = n/2 × [2a + (n−1)d]`,
          `= ${n}/2 × [2×${a} + (${n}−1)×${d}]`,
          `= ${n}/2 × [${2 * a} + ${(n - 1) * d}]`,
          `= ${n}/2 × ${2 * a + (n - 1) * d} = ${sn}`,
        ],
        topic: "AP/GP",
      },
    ]);
  } else {
    const a = rng(1, 4), r = pick([2, 3]), n = rng(3, 6);
    const nth = a * r ** (n - 1);
    return {
      question: `Find the ${n}th term of the GP:\n${a},  ${a * r},  ${a * r ** 2},  ...`,
      answer:   `a_${n} = ${nth}`,
      hint:     `Use aₙ = a × r^(n−1). Here a=${a}, r=${r}.`,
      steps: [
        `Formula: aₙ = a × r^(n−1)`,
        `a = ${a},  r = ${r},  n = ${n}`,
        `a_${n} = ${a} × ${r}${toSup(n - 1)}`,
        `= ${a} × ${r ** (n - 1)} = ${nth}`,
      ],
      topic: "AP/GP",
    };
  }
};

const genProbability = (lv) => {
  const r = rng(2, 5), b = rng(2, 5), total = r + b;
  const g = gcd(r, total);
  return pick([
    {
      question: `A bag has ${r} red and ${b} blue balls.\nOne ball is drawn at random.\nFind P(red ball).`,
      answer:   `${r / g}/${total / g}`,
      hint:     `P = Favorable outcomes / Total outcomes.`,
      steps: [
        `Favorable (red) = ${r}`,
        `Total balls = ${r} + ${b} = ${total}`,
        `P(red) = ${r}/${total}${g > 1 ? ` = ${r / g}/${total / g}` : ""}`,
      ],
      topic: "Probability",
    },
    {
      question: `A fair die is rolled once.\nFind P(number > 4).`,
      answer:   `1/3`,
      hint:     `List the outcomes greater than 4.`,
      steps: [
        `Outcomes > 4: {5, 6} → 2 favorable outcomes`,
        `Total outcomes = 6`,
        `P = 2/6 = 1/3`,
      ],
      topic: "Probability",
    },
    {
      question: `Two fair coins are tossed together.\nFind P(exactly one Head).`,
      answer:   `1/2`,
      hint:     `Sample space: {HH, HT, TH, TT}.`,
      steps: [
        `Sample space: {HH, HT, TH, TT} → 4 total outcomes`,
        `Exactly 1 Head: {HT, TH} → 2 favorable`,
        `P = 2/4 = 1/2`,
      ],
      topic: "Probability",
    },
    (() => {
      const fav = pick([4, 13, 26]);
      const nm  = { 4: "an ace", 13: "a spade", 26: "a red card" };
      const gf  = gcd(fav, 52);
      return {
        question: `A card is drawn from a standard 52-card deck.\nFind P(drawing ${nm[fav]}).`,
        answer:   `${fav / gf}/${52 / gf}`,
        hint:     `Count the favorable cards in a standard deck.`,
        steps: [
          `Favorable cards (${nm[fav]}) = ${fav}`,
          `Total cards = 52`,
          `P = ${fav}/52${gf > 1 ? ` = ${fav / gf}/${52 / gf}` : ""}`,
        ],
        topic: "Probability",
      };
    })(),
  ]);
};

const genMensuration = (lv) => {
  return pick([
    (() => {
      const l = rng(4, 14), w = rng(3, 10);
      return {
        question: `Rectangle: length ${l} cm, width ${w} cm.\nFind its area and perimeter.`,
        answer:   `Area = ${l * w} cm², Perimeter = ${2 * (l + w)} cm`,
        hint:     `Area = l×w, Perimeter = 2(l+w).`,
        steps: [
          `Area = l × w = ${l} × ${w} = ${l * w} cm²`,
          `Perimeter = 2(l + w) = 2(${l} + ${w}) = ${2 * (l + w)} cm`,
        ],
        topic: "Mensuration",
      };
    })(),
    (() => {
      const r = rng(3, 9);
      return {
        question: `Circle with radius ${r} cm.\nFind area and circumference.  (Use π = 3.14)`,
        answer:   `Area ≈ ${(3.14 * r * r).toFixed(2)} cm², Circumference ≈ ${(2 * 3.14 * r).toFixed(2)} cm`,
        hint:     `Area = πr², Circumference = 2πr.`,
        steps: [
          `Area = πr² = 3.14 × ${r}² = 3.14 × ${r * r}`,
          `Area ≈ ${(3.14 * r * r).toFixed(2)} cm²`,
          `Circumference = 2πr = 2 × 3.14 × ${r}`,
          `Circumference ≈ ${(2 * 3.14 * r).toFixed(2)} cm`,
        ],
        topic: "Mensuration",
      };
    })(),
    (() => {
      const b = rng(5, 14), h = rng(4, 10);
      return {
        question: `Triangle with base ${b} cm and height ${h} cm.\nFind its area.`,
        answer:   `${(b * h) / 2} cm²`,
        hint:     `Area of triangle = ½ × base × height.`,
        steps: [
          `Formula: Area = ½ × base × height`,
          `= ½ × ${b} × ${h}`,
          `= ${(b * h) / 2} cm²`,
        ],
        topic: "Mensuration",
      };
    })(),
    (() => {
      const l = rng(3, 8), w = rng(3, 7), h = rng(3, 7);
      return {
        question: `Cuboid with dimensions ${l} cm × ${w} cm × ${h} cm.\nFind its volume.`,
        answer:   `${l * w * h} cm³`,
        hint:     `Volume of cuboid = l × w × h.`,
        steps: [
          `Formula: Volume = l × w × h`,
          `= ${l} × ${w} × ${h}`,
          `= ${l * w * h} cm³`,
        ],
        topic: "Mensuration",
      };
    })(),
  ]);
};

const genCoordGeo = (lv) => {
  const x1 = rng(-5, 5), y1 = rng(-5, 5);
  const x2 = rng(-5, 5), y2 = rng(-5, 5);
  const dx = x2 - x1, dy = y2 - y1;
  const dsq = dx ** 2 + dy ** 2;
  const d   = Math.sqrt(dsq);
  const mx  = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return pick([
    {
      question: `Find the distance between:\nA(${x1}, ${y1})  and  B(${x2}, ${y2}).`,
      answer:   `√${dsq} ≈ ${d.toFixed(2)} units`,
      hint:     `Use d = √[(x₂−x₁)² + (y₂−y₁)²].`,
      steps: [
        `Formula: d = √[(x₂−x₁)² + (y₂−y₁)²]`,
        `= √[(${dx})² + (${dy})²]`,
        `= √[${dx ** 2} + ${dy ** 2}]`,
        `= √${dsq} ≈ ${d.toFixed(2)} units`,
      ],
      topic: "Coordinate Geometry",
    },
    {
      question: `Find the midpoint of segment joining:\nA(${x1}, ${y1})  and  B(${x2}, ${y2}).`,
      answer:   `(${mx}, ${my})`,
      hint:     `Midpoint = ((x₁+x₂)/2, (y₁+y₂)/2).`,
      steps: [
        `Formula: Midpoint = ((x₁+x₂)/2, (y₁+y₂)/2)`,
        `x-coord = (${x1} + ${x2}) / 2 = ${mx}`,
        `y-coord = (${y1} + ${y2}) / 2 = ${my}`,
        `Midpoint = (${mx}, ${my})`,
      ],
      topic: "Coordinate Geometry",
    },
  ]);
};

// ── NEW INTERMEDIATE GENERATORS ───────────────────────────────────

const genSystems = (lv) => {
  // Generate clean integer solutions first, then compute constants
  const x = rng(-5, 5), y = rng(-5, 5);
  const a1 = rng(1, 3), b1 = pick([-2,-1,1,2]);
  const a2 = rng(1, 3), b2 = pick([-2,-1,1,2]);
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  const fmtCoef = (c, v, first) => {
    if (c === 0) return "";
    const sign = c > 0 ? (first ? "" : " + ") : " − ";
    const abs  = Math.abs(c);
    return `${first && c < 0 ? "−" : sign}${abs === 1 ? "" : abs}${v}`;
  };
  const eq1 = `${fmtCoef(a1,"x",true)}${fmtCoef(b1,"y",false)} = ${c1}`;
  const eq2 = `${fmtCoef(a2,"x",true)}${fmtCoef(b2,"y",false)} = ${c2}`;
  return {
    question: `Solve the system of equations:\n\n${eq1}\n${eq2}`,
    answer:   `x = ${x},  y = ${y}`,
    hint:     `Use elimination or substitution. Multiply one equation to match coefficients.`,
    steps: [
      `Equation 1: ${eq1}`,
      `Equation 2: ${eq2}`,
      `Use elimination — multiply and subtract to cancel one variable`,
      `Solve for x, then substitute back to find y`,
      `Solution: x = ${x},  y = ${y}`,
    ],
    topic: "Systems of Equations",
  };
};

const genPolynomials = (lv) => {
  // Remainder theorem: f(x) divided by (x - a) → remainder = f(a)
  const a  = rng(1, 4);
  const c0 = rng(1, 8), c1 = rng(0, 6), c2 = rng(1, 5);
  const rem = c2 * a * a + c1 * a + c0;
  const c1s = c1 === 0 ? "" : ` + ${c1}x`;
  return pick([
    {
      question: `Find the remainder when\n\np(x) = ${c2}x² ${c1 > 0 ? "+" : "−"} ${Math.abs(c1)}x + ${c0}\n\nis divided by (x − ${a}).`,
      answer:   `Remainder = ${rem}`,
      hint:     `Remainder Theorem: remainder = p(${a}). Substitute x = ${a} into p(x).`,
      steps: [
        `Remainder Theorem: divide by (x − ${a}) → find p(${a})`,
        `p(${a}) = ${c2}(${a})² + ${c1}(${a}) + ${c0}`,
        `= ${c2 * a * a} + ${c1 * a} + ${c0}`,
        `= ${rem}`,
      ],
      topic: "Polynomials & Remainders",
    },
    (() => {
      const r = rng(1, 4);
      const poly_a = rng(1, 4), poly_b = rng(0, 6);
      const result = poly_a * r + poly_b;
      return {
        question: `Is (x − ${r}) a factor of\n\np(x) = ${poly_a}x + ${poly_b}?`,
        answer:   result === 0 ? `Yes, it is a factor` : `No, since p(${r}) = ${result} ≠ 0`,
        hint:     `Factor theorem: (x − ${r}) is a factor iff p(${r}) = 0.`,
        steps: [
          `Factor Theorem: (x − ${r}) is a factor iff p(${r}) = 0`,
          `p(${r}) = ${poly_a}(${r}) + ${poly_b} = ${poly_a * r} + ${poly_b} = ${result}`,
          result === 0 ? `p(${r}) = 0  →  (x − ${r}) IS a factor ✓` : `p(${r}) = ${result} ≠ 0  →  NOT a factor`,
        ],
        topic: "Polynomials & Remainders",
      };
    })(),
  ]);
};

const genLogarithms = (lv) => {
  const bases = [2, 3, 5, 10];
  const b     = pick(bases);
  const exp   = rng(2, 5);
  const val   = b ** exp;
  return pick([
    {
      question: `Evaluate:\n\nlog_${b}(${val})`,
      answer:   `${exp}`,
      hint:     `Ask: "${b} to the power of what equals ${val}?"`,
      steps: [
        `log_${b}(${val}) = x  means  ${b}^x = ${val}`,
        `${b}${toSup(exp)} = ${val}`,
        `∴ log_${b}(${val}) = ${exp}`,
      ],
      topic: "Logarithms",
    },
    {
      question: `Solve for x:\n\nlog_${b}(x) = ${exp}`,
      answer:   `x = ${val}`,
      hint:     `Convert from log form to exponential form: log_b(x) = n → x = b^n.`,
      steps: [
        `log_${b}(x) = ${exp}`,
        `Convert: x = ${b}${toSup(exp)}`,
        `x = ${val}`,
      ],
      topic: "Logarithms",
    },
    (() => {
      const b2 = pick([2, 3, 5]);
      const e1 = rng(2, 4), e2 = rng(1, 3);
      const v1 = b2 ** e1, v2 = b2 ** e2;
      return {
        question: `Simplify:\n\nlog_${b2}(${v1}) + log_${b2}(${v2})`,
        answer:   `${e1 + e2}`,
        hint:     `Use: log_b(m) + log_b(n) = log_b(m × n).`,
        steps: [
          `log_${b2}(${v1}) + log_${b2}(${v2}) = log_${b2}(${v1} × ${v2})`,
          `= log_${b2}(${v1 * v2})`,
          `= log_${b2}(${b2}${toSup(e1 + e2)})`,
          `= ${e1 + e2}`,
        ],
        topic: "Logarithms",
      };
    })(),
  ]);
};

const genSlopeLines = (lv) => {
  const x1 = rng(-4, 4), y1 = rng(-4, 4);
  const x2 = rng(-4, 4), y2 = rng(-4, 4);
  const dx  = x2 - x1, dy = y2 - y1;
  const g   = dx !== 0 ? gcd(Math.abs(dy), Math.abs(dx)) : 1;
  const slopeStr = dx === 0 ? "undefined (vertical)" : dy === 0 ? "0" : `${dy / g}/${dx / g}`;
  const slope    = dx !== 0 ? dy / dx : null;
  const yInt     = slope !== null ? y1 - slope * x1 : null;
  return pick([
    {
      question: `Find the slope of the line passing through:\nA(${x1}, ${y1})  and  B(${x2}, ${y2}).`,
      answer:   `Slope = ${slopeStr}`,
      hint:     `Slope m = (y₂ − y₁) / (x₂ − x₁).`,
      steps: [
        `m = (y₂ − y₁) / (x₂ − x₁)`,
        `= (${y2} − ${y1}) / (${x2} − ${x1})`,
        `= ${dy} / ${dx}`,
        `= ${slopeStr}`,
      ],
      topic: "Slope & Lines",
    },
    ...(slope !== null && yInt !== null ? [{
      question: `A line passes through (${x1}, ${y1}) with slope ${slopeStr}.\nWrite its equation in slope-intercept form.`,
      answer:   `y = ${slopeStr}x ${yInt >= 0 ? "+" : "−"} ${Math.abs(yInt)}`,
      hint:     `Use y − y₁ = m(x − x₁), then rearrange to y = mx + b.`,
      steps: [
        `y − ${y1} = ${slopeStr}(x − ${x1})`,
        `y = ${slopeStr}x − ${slopeStr}×${x1} + ${y1}`,
        `y = ${slopeStr}x + ${yInt}`,
      ],
      topic: "Slope & Lines",
    }] : []),
  ]);
};

// ── ADVANCED ──────────────────────────────────────────────────────

const SIN = { 0: "0", 30: "1/2", 45: "1/√2", 60: "√3/2", 90: "1" };
const COS = { 0: "1", 30: "√3/2", 45: "1/√2", 60: "1/2", 90: "0" };

const genTrig = (lv) => {
  return pick([
    (() => {
      const pairs = [[30, 60], [45, 45], [0, 90], [30, 30], [60, 30]];
      const [A, B] = pick(pairs);
      return {
        question: `Evaluate:\n\nsin(${A}°)·cos(${B}°) + cos(${A}°)·sin(${B}°)`,
        answer:   `sin(${A + B}°) = ${SIN[A + B]}`,
        hint:     `Recognize the compound angle identity: sin(A+B) = sinA·cosB + cosA·sinB.`,
        steps: [
          `Identity: sin(A+B) = sinA·cosB + cosA·sinB`,
          `This expression equals sin(${A}° + ${B}°)`,
          `= sin(${A + B}°)`,
          `= ${SIN[A + B]}`,
        ],
        topic: "Trigonometry",
      };
    })(),
    (() => {
      const pairs = [[60, 30], [90, 45], [90, 30]];
      const [A, B] = pick(pairs);
      return {
        question: `Evaluate:\n\ncos(${A}°)·cos(${B}°) + sin(${A}°)·sin(${B}°)`,
        answer:   `cos(${A - B}°) = ${COS[A - B]}`,
        hint:     `Recognize: cos(A−B) = cosA·cosB + sinA·sinB.`,
        steps: [
          `Identity: cos(A−B) = cosA·cosB + sinA·sinB`,
          `This expression equals cos(${A}° − ${B}°)`,
          `= cos(${A - B}°)`,
          `= ${COS[A - B]}`,
        ],
        topic: "Trigonometry",
      };
    })(),
    (() => {
      const ang = pick([30, 45, 60]);
      return {
        question: `Verify the Pythagorean identity at θ = ${ang}°:\n\nsin²(${ang}°) + cos²(${ang}°) = ?`,
        answer:   `1`,
        hint:     `sin²θ + cos²θ = 1 is always true. Verify with known values.`,
        steps: [
          `sin(${ang}°) = ${SIN[ang]},  cos(${ang}°) = ${COS[ang]}`,
          `Square each and add them together`,
          `By the Pythagorean identity, the result is always 1`,
          `∴ sin²(${ang}°) + cos²(${ang}°) = 1`,
        ],
        topic: "Trigonometry",
      };
    })(),
    (() => {
      const ang = pick([30, 45, 60]);
      return {
        question: `If sin(θ) = ${SIN[ang]},\nfind cos(θ).  (θ is acute)`,
        answer:   `cos(θ) = ${COS[ang]}`,
        hint:     `Use sin²θ + cos²θ = 1 → cos²θ = 1 − sin²θ.`,
        steps: [
          `Using: sin²θ + cos²θ = 1`,
          `cos²θ = 1 − sin²θ = 1 − (${SIN[ang]})²`,
          `Solving for cos(θ) with θ acute`,
          `cos(θ) = ${COS[ang]}`,
        ],
        topic: "Trigonometry",
      };
    })(),
  ]);
};

const genPermComb = (lv) => {
  return pick([
    (() => {
      const n = rng(4, 7), r = rng(2, Math.min(n - 1, 4));
      return {
        question: `In how many ways can ${r} people be arranged\nin a row chosen from ${n} people?`,
        answer:   `P(${n},${r}) = ${nPr(n, r)}`,
        hint:     `Order matters → Permutations. Use P(n,r) = n!/(n−r)!`,
        steps: [
          `Order matters → use Permutations`,
          `P(n,r) = n! / (n−r)!`,
          `P(${n},${r}) = ${n}! / ${n - r}!`,
          `= ${nPr(n, r)}`,
        ],
        topic: "Permutations & Combinations",
      };
    })(),
    (() => {
      const n = rng(5, 8), r = rng(2, Math.min(n - 1, 4));
      return {
        question: `In how many ways can a committee of ${r}\nbe chosen from ${n} people?`,
        answer:   `C(${n},${r}) = ${nCr(n, r)}`,
        hint:     `Order doesn't matter → Combinations. Use C(n,r) = n!/(r!(n−r)!)`,
        steps: [
          `Order doesn't matter → use Combinations`,
          `C(n,r) = n! / (r!(n−r)!)`,
          `C(${n},${r}) = ${n}! / (${r}! × ${n - r}!)`,
          `= ${fact(n)} / (${fact(r)} × ${fact(n - r)}) = ${nCr(n, r)}`,
        ],
        topic: "Permutations & Combinations",
      };
    })(),
    (() => {
      const n = rng(3, 6);
      return {
        question: `In how many ways can ${n} distinct books\nbe arranged on a shelf?`,
        answer:   `${fact(n)} ways`,
        hint:     `Arrange all n objects in all positions → n!`,
        steps: [
          `All ${n} books, all positions matter`,
          `= n! = ${n} × ${n - 1} × ... × 1`,
          `= ${fact(n)} ways`,
        ],
        topic: "Permutations & Combinations",
      };
    })(),
    (() => {
      const n = rng(4, 7), r = rng(2, 3);
      return {
        question: `Find  C(${n}, ${r}).`,
        answer:   `${nCr(n, r)}`,
        hint:     `C(n,r) = n! / (r! × (n−r)!).`,
        steps: [
          `C(${n},${r}) = ${n}! / (${r}! × ${n - r}!)`,
          `= ${fact(n)} / (${fact(r)} × ${fact(n - r)})`,
          `= ${nCr(n, r)}`,
        ],
        topic: "Permutations & Combinations",
      };
    })(),
  ]);
};

const genInequality = (lv) => {
  const a = rng(2, 5), b = rng(1, 15);
  const xBound = rng(2, 10);
  const dir = pick(["<", ">"]);
  const c = a * xBound + b;
  return {
    question: `Solve the inequality:\n\n${a}x + ${b}  ${dir}  ${c}`,
    answer:   `x  ${dir}  ${xBound}`,
    hint:     `Treat it like an equation — subtract ${b} then divide by ${a}.`,
    steps: [
      `${a}x + ${b}  ${dir}  ${c}`,
      `Subtract ${b}:  ${a}x  ${dir}  ${c - b}`,
      `Divide by ${a}:  x  ${dir}  ${xBound}`,
    ],
    topic: "Inequalities",
  };
};

const genFunctions = (lv) => {
  const a = rng(1, 5), b = rng(0, 10), xv = rng(1, 8);
  return pick([
    {
      question: `If  f(x) = ${a}x + ${b},  find  f(${xv}).`,
      answer:   `f(${xv}) = ${a * xv + b}`,
      hint:     `Substitute x = ${xv} directly into f(x).`,
      steps: [
        `f(x) = ${a}x + ${b}`,
        `f(${xv}) = ${a}(${xv}) + ${b}`,
        `= ${a * xv} + ${b}`,
        `= ${a * xv + b}`,
      ],
      topic: "Functions",
    },
    {
      question: `If  f(x) = x² − ${b},  find  f(${xv}).`,
      answer:   `f(${xv}) = ${xv ** 2 - b}`,
      hint:     `Substitute x = ${xv} into f(x) = x² − ${b}.`,
      steps: [
        `f(x) = x² − ${b}`,
        `f(${xv}) = (${xv})² − ${b}`,
        `= ${xv ** 2} − ${b}`,
        `= ${xv ** 2 - b}`,
      ],
      topic: "Functions",
    },
    (() => {
      const k = rng(2, 7);
      return {
        question: `If  f(x) = ${a}x + ${b},\nfind x such that f(x) = ${a * k + b}.`,
        answer:   `x = ${k}`,
        hint:     `Set f(x) = ${a * k + b} and solve for x.`,
        steps: [
          `Set f(x) = ${a * k + b}`,
          `${a}x + ${b} = ${a * k + b}`,
          `${a}x = ${a * k}`,
          `x = ${k}`,
        ],
        topic: "Functions",
      };
    })(),
  ]);
};

const genAdvGeo = (lv) => {
  const r = rng(5, 12);
  const d = rng(2, r - 2);
  const halfChord = Math.sqrt(r ** 2 - d ** 2);
  const chord = (2 * halfChord).toFixed(2);
  const deg = pick([60, 90, 120]);
  const arcLen = (3.14 * r * deg / 180).toFixed(2);
  return pick([
    {
      question: `A chord is ${d} cm from the centre of a circle\nwith radius ${r} cm.\nFind the length of the chord.`,
      answer:   `≈ ${chord} cm`,
      hint:     `Draw the perpendicular from centre to chord. Use Pythagoras.`,
      steps: [
        `Perpendicular from centre bisects the chord`,
        `Half-chord² + d² = r²`,
        `Half-chord = √(${r}² − ${d}²) = √${r ** 2 - d ** 2}`,
        `Chord = 2 × √${r ** 2 - d ** 2} ≈ ${chord} cm`,
      ],
      topic: "Advanced Geometry",
    },
    {
      question: `An arc subtends an angle of ${deg}° at the centre\nof a circle with radius ${r} cm.\nFind arc length.  (π = 3.14)`,
      answer:   `≈ ${arcLen} cm`,
      hint:     `Arc length = (θ/360°) × 2πr.`,
      steps: [
        `Formula: Arc length = (θ/360°) × 2πr`,
        `= (${deg}/360) × 2 × 3.14 × ${r}`,
        `≈ ${arcLen} cm`,
      ],
      topic: "Advanced Geometry",
    },
    {
      question: `Two tangents drawn from an external point to a circle\nhave lengths (3k+1) cm and (5k−7) cm.\nFind k, then find the tangent length.`,
      answer:   `k = 4, length = 13 cm`,
      hint:     `Tangents from the same external point are equal in length.`,
      steps: [
        `Tangents from an external point are equal`,
        `3k + 1 = 5k − 7`,
        `2k = 8  →  k = 4`,
        `Length = 3(4) + 1 = 13 cm`,
      ],
      topic: "Advanced Geometry",
    },
  ]);
};

// ── NEW ADVANCED GENERATORS ───────────────────────────────────────

const genTrigEquations = (lv) => {
  const cases = [
    { val: "1/2", ang: 30, fn: "sin" },
    { val: "√3/2", ang: 60, fn: "sin" },
    { val: "1/√2", ang: 45, fn: "sin" },
    { val: "1/2", ang: 60, fn: "cos" },
    { val: "√3/2", ang: 30, fn: "cos" },
    { val: "1/√2", ang: 45, fn: "cos" },
  ];
  const c = pick(cases);
  return {
    question: `Solve for θ  (0° < θ < 90°):\n\n${c.fn}(θ) = ${c.val}`,
    answer:   `θ = ${c.ang}°`,
    hint:     `Recall the exact values table for ${c.fn} at standard angles.`,
    steps: [
      `Look up standard angles for ${c.fn}`,
      `${c.fn}(${c.ang}°) = ${c.val}`,
      `∴ θ = ${c.ang}°`,
    ],
    topic: "Trig Equations",
  };
};

const genComplexNumbers = (lv) => {
  const a = rng(1, 6), b = rng(1, 5);
  const c = rng(1, 6), d = rng(1, 5);
  const sumR = a + c, sumI = b + d;
  const mulR = a * c - b * d, mulI = a * d + b * c;
  const mod  = +Math.sqrt(a * a + b * b).toFixed(3);
  return pick([
    {
      question: `Add the complex numbers:\n\n(${a} + ${b}i) + (${c} + ${d}i)`,
      answer:   `${sumR} + ${sumI}i`,
      hint:     `Add real parts and imaginary parts separately.`,
      steps: [
        `Real: ${a} + ${c} = ${sumR}`,
        `Imaginary: ${b} + ${d} = ${sumI}`,
        `Result: ${sumR} + ${sumI}i`,
      ],
      topic: "Complex Numbers",
    },
    {
      question: `Multiply the complex numbers:\n\n(${a} + ${b}i)(${c} + ${d}i)`,
      answer:   `${mulR} + ${mulI}i`,
      hint:     `Use FOIL and remember i² = −1.`,
      steps: [
        `(${a} + ${b}i)(${c} + ${d}i)`,
        `= ${a*c} + ${a*d}i + ${b*c}i + ${b*d}i²`,
        `= ${a*c} + ${a*d + b*c}i + ${b*d}(−1)`,
        `= ${mulR} + ${mulI}i`,
      ],
      topic: "Complex Numbers",
    },
    {
      question: `Find the modulus |z| of:\n\nz = ${a} + ${b}i`,
      answer:   `|z| = √${a*a + b*b} ≈ ${mod}`,
      hint:     `|z| = √(a² + b²) for z = a + bi.`,
      steps: [
        `|z| = √(a² + b²)`,
        `= √(${a}² + ${b}²)`,
        `= √(${a*a} + ${b*b})`,
        `= √${a*a + b*b} ≈ ${mod}`,
      ],
      topic: "Complex Numbers",
    },
    {
      question: `Find the conjugate of:\n\nz = ${a} + ${b}i`,
      answer:   `z̄ = ${a} − ${b}i`,
      hint:     `The conjugate flips the sign of the imaginary part.`,
      steps: [
        `z = ${a} + ${b}i`,
        `Conjugate: flip the sign of the imaginary part`,
        `z̄ = ${a} − ${b}i`,
      ],
      topic: "Complex Numbers",
    },
  ]);
};

const genMatrices = (lv) => {
  const a11=rng(1,4), a12=rng(0,3), a21=rng(0,3), a22=rng(1,4);
  const b11=rng(1,3), b12=rng(0,3), b21=rng(0,3), b22=rng(1,3);
  const det = a11*a22 - a12*a21;
  const trace = a11 + a22;
  const s11=a11+b11, s12=a12+b12, s21=a21+b21, s22=a22+b22;
  const m11=a11*b11+a12*b21, m12=a11*b12+a12*b22;
  const m21=a21*b11+a22*b21, m22=a21*b12+a22*b22;
  const fmt = m => `[${m[0]} ${m[1]}]\n[${m[2]} ${m[3]}]`;
  return pick([
    {
      question: `Find the determinant of the matrix:\n\n[${a11}  ${a12}]\n[${a21}  ${a22}]`,
      answer:   `det = ${det}`,
      hint:     `det(A) = ad − bc for a 2×2 matrix.`,
      steps: [
        `det = (${a11})(${a22}) − (${a12})(${a21})`,
        `= ${a11*a22} − ${a12*a21}`,
        `= ${det}`,
      ],
      topic: "Matrices & Determinants",
    },
    {
      question: `Find the trace of the matrix:\n\n[${a11}  ${a12}]\n[${a21}  ${a22}]`,
      answer:   `Trace = ${trace}`,
      hint:     `Trace = sum of diagonal elements.`,
      steps: [
        `Trace = sum of main diagonal entries`,
        `= ${a11} + ${a22}`,
        `= ${trace}`,
      ],
      topic: "Matrices & Determinants",
    },
    {
      question: `Add the matrices:\n\nA = [${a11}  ${a12}]\n    [${a21}  ${a22}]\n\nB = [${b11}  ${b12}]\n    [${b21}  ${b22}]`,
      answer:   `[${s11}  ${s12}]\n[${s21}  ${s22}]`,
      hint:     `Add corresponding elements.`,
      steps: [
        `Add element-by-element:`,
        `Top row: [${a11}+${b11}, ${a12}+${b12}] = [${s11}, ${s12}]`,
        `Bottom row: [${a21}+${b21}, ${a22}+${b22}] = [${s21}, ${s22}]`,
      ],
      topic: "Matrices & Determinants",
    },
  ]);
};

const genVectors = (lv) => {
  const ax=rng(-4,4), ay=rng(-4,4), az=rng(-3,3);
  const bx=rng(-4,4), by=rng(-4,4), bz=rng(-3,3);
  const dot2d = ax*bx + ay*by;
  const dot3d = ax*bx + ay*by + az*bz;
  const magA  = +Math.sqrt(ax*ax + ay*ay).toFixed(3);
  const cross = {x: ay*bz - az*by, y: az*bx - ax*bz, z: ax*by - ay*bx};
  return pick([
    {
      question: `Find the dot product of vectors:\n\nA = (${ax}, ${ay})  and  B = (${bx}, ${by})`,
      answer:   `A · B = ${dot2d}`,
      hint:     `Dot product = multiply matching components and sum them.`,
      steps: [
        `A · B = (${ax})(${bx}) + (${ay})(${by})`,
        `= ${ax*bx} + ${ay*by}`,
        `= ${dot2d}`,
      ],
      topic: "Vectors",
    },
    {
      question: `Find the magnitude |A| of vector:\n\nA = (${ax}, ${ay})`,
      answer:   `|A| = √${ax*ax + ay*ay} ≈ ${magA}`,
      hint:     `|A| = √(x² + y²).`,
      steps: [
        `|A| = √(${ax}² + ${ay}²)`,
        `= √(${ax*ax} + ${ay*ay})`,
        `= √${ax*ax + ay*ay} ≈ ${magA}`,
      ],
      topic: "Vectors",
    },
    {
      question: `Find the dot product of 3D vectors:\n\nA = (${ax}, ${ay}, ${az})  and  B = (${bx}, ${by}, ${bz})`,
      answer:   `A · B = ${dot3d}`,
      hint:     `A · B = AxBx + AyBy + AzBz.`,
      steps: [
        `A · B = (${ax})(${bx}) + (${ay})(${by}) + (${az})(${bz})`,
        `= ${ax*bx} + ${ay*by} + ${az*bz}`,
        `= ${dot3d}`,
      ],
      topic: "Vectors",
    },
    {
      question: `Find the cross product A × B:\n\nA = (${ax}, ${ay}, ${az})  and  B = (${bx}, ${by}, ${bz})`,
      answer:   `(${cross.x}, ${cross.y}, ${cross.z})`,
      hint:     `Use the 3×3 determinant formula for cross product.`,
      steps: [
        `i component: ${ay}×${bz} − ${az}×${by} = ${cross.x}`,
        `j component: ${az}×${bx} − ${ax}×${bz} = ${cross.y}`,
        `k component: ${ax}×${by} − ${ay}×${bx} = ${cross.z}`,
        `A × B = (${cross.x}, ${cross.y}, ${cross.z})`,
      ],
      topic: "Vectors",
    },
  ]);
};

const genFunctionsInverse = (lv) => {
  const a = rng(1, 4), b = rng(0, 8);
  const c = rng(1, 4), d = rng(0, 6);
  const xv = rng(1, 5);
  const gxv = c * xv + d;
  const fgxv = a * gxv + b;
  return pick([
    {
      question: `If f(x) = ${a}x + ${b},\nfind the inverse f⁻¹(x).`,
      answer:   `f⁻¹(x) = (x − ${b}) / ${a}`,
      hint:     `Swap x and y, then solve for y.`,
      steps: [
        `Let y = ${a}x + ${b}`,
        `Swap x and y: x = ${a}y + ${b}`,
        `Solve for y: ${a}y = x − ${b}`,
        `f⁻¹(x) = (x − ${b}) / ${a}`,
      ],
      topic: "Functions & Inverses",
    },
    {
      question: `f(x) = ${a}x + ${b}  and  g(x) = ${c}x + ${d}.\n\nFind f(g(${xv})).`,
      answer:   `f(g(${xv})) = ${fgxv}`,
      hint:     `First compute g(${xv}), then plug that into f.`,
      steps: [
        `g(${xv}) = ${c}(${xv}) + ${d} = ${gxv}`,
        `f(g(${xv})) = f(${gxv})`,
        `= ${a}(${gxv}) + ${b}`,
        `= ${a*gxv} + ${b} = ${fgxv}`,
      ],
      topic: "Functions & Inverses",
    },
    (() => {
      const av = rng(2, 5);
      const bv = rng(1, 8);
      const test = rng(2, 6);
      const invRes = (test - bv) / av;
      return {
        question: `If f(x) = ${av}x + ${bv},\nevaluate f⁻¹(${test}).`,
        answer:   Number.isInteger(invRes) ? `${invRes}` : `${test - bv}/${av}`,
        hint:     `Find f⁻¹(x) first, then substitute x = ${test}.`,
        steps: [
          `f⁻¹(x) = (x − ${bv}) / ${av}`,
          `f⁻¹(${test}) = (${test} − ${bv}) / ${av}`,
          `= ${test - bv} / ${av}`,
          `= ${Number.isInteger(invRes) ? invRes : `${test - bv}/${av}`}`,
        ],
        topic: "Functions & Inverses",
      };
    })(),
  ]);
};

const genAbsInequality = (lv) => {
  const a = rng(1, 3), b = rng(1, 8), c = rng(5, 15);
  const lo = +((c - b) / a).toFixed(2), hi = +((c + b) / a).toFixed(2);  // |ax - b| < c  →  (b-c)/a < x < (b+c)/a? No wait...
  // |ax - b| < c  → -c < ax - b < c → (b-c)/a < x < (b+c)/a
  const loReal = +((b - c) / a).toFixed(2), hiReal = +((b + c) / a).toFixed(2);
  return {
    question: `Solve the absolute value inequality:\n\n|${a}x − ${b}| < ${c}`,
    answer:   `${loReal} < x < ${hiReal}`,
    hint:     `|expression| < c  means  −c < expression < c.`,
    steps: [
      `|${a}x − ${b}| < ${c}`,
      `Split: −${c} < ${a}x − ${b} < ${c}`,
      `Add ${b}: ${b - c} < ${a}x < ${b + c}`,
      `Divide by ${a}: ${loReal} < x < ${hiReal}`,
    ],
    topic: "Inequalities (Abs. Value)",
  };
};

const genConics = (lv) => {
  const h = rng(-4, 4), k = rng(-4, 4), r = rng(2, 7);
  const r2 = r * r;
  const hs = h === 0 ? "" : h > 0 ? ` − ${h}` : ` + ${Math.abs(h)}`;
  const ks = k === 0 ? "" : k > 0 ? ` − ${k}` : ` + ${Math.abs(k)}`;
  return pick([
    {
      question: `Identify the center and radius of:\n\n(x${hs})² + (y${ks})² = ${r2}`,
      answer:   `Center: (${h}, ${k}),  Radius: ${r}`,
      hint:     `Standard form: (x − h)² + (y − k)² = r². Read off h, k, r.`,
      steps: [
        `Standard form: (x − h)² + (y − k)² = r²`,
        `h = ${h},  k = ${k}`,
        `r² = ${r2}  →  r = ${r}`,
        `Center: (${h}, ${k}),  Radius: ${r}`,
      ],
      topic: "Conic Sections",
    },
    (() => {
      const a2 = pick([4, 9, 16]), b2 = pick([4, 9, 25]);
      return {
        question: `Classify the conic section:\n\nx²/${a2} + y²/${b2} = 1`,
        answer:   a2 === b2 ? `Circle (special ellipse)` : `Ellipse`,
        hint:     `If both terms are positive and the denominators are different, it's an ellipse.`,
        steps: [
          `Standard form: x²/a² + y²/b² = 1`,
          `a² = ${a2},  b² = ${b2}`,
          a2 === b2
            ? `a² = b²  →  This is a circle`
            : `a² ≠ b²  →  This is an ellipse`,
          `a = ${Math.sqrt(a2)},  b = ${Math.sqrt(b2)}`,
        ],
        topic: "Conic Sections",
      };
    })(),
  ]);
};

// ── OLYMPIAD ──────────────────────────────────────────────────────

const genNumberTheory = (lv) => {
  return pick([
    (() => {
      const n  = rng(100, 999);
      const ds = String(n).split("").map(Number);
      const s  = ds.reduce((a, b) => a + b, 0);
      return {
        question: `Is  ${n}  divisible by 3?\nUse the divisibility rule to justify.`,
        answer:   s % 3 === 0 ? `Yes` : `No`,
        hint:     `A number is divisible by 3 if the sum of its digits is divisible by 3.`,
        steps: [
          `Divisibility rule: sum of digits must be divisible by 3`,
          `Sum of digits of ${n} = ${ds.join(" + ")} = ${s}`,
          `${s} ${s % 3 === 0 ? "IS" : "is NOT"} divisible by 3`,
          `Therefore ${n} ${s % 3 === 0 ? "IS" : "is NOT"} divisible by 3`,
        ],
        topic: "Number Theory",
      };
    })(),
    (() => {
      const a = rng(4, 15), b = rng(3, 12);
      const g = gcd(a, b), l = lcm(a, b);
      return {
        question: `Find the GCD and LCM of  ${a}  and  ${b}.`,
        answer:   `GCD = ${g}, LCM = ${l}`,
        hint:     `Use prime factorization or the Euclidean algorithm for GCD.`,
        steps: [
          `GCD(${a}, ${b}) = ${g}  (using Euclidean algorithm)`,
          `LCM = (${a} × ${b}) / GCD`,
          `= ${a * b} / ${g} = ${l}`,
          `Verify: GCD × LCM = ${g} × ${l} = ${a} × ${b} ✓`,
        ],
        topic: "Number Theory",
      };
    })(),
    (() => {
      const p   = pick([7, 11, 13, 17, 19]);
      const a   = rng(2, 9);
      const rem = (a ** 2) % p;
      return {
        question: `Find the remainder when  ${a}²  is divided by  ${p}.\n\n(Modular Arithmetic)`,
        answer:   `${rem}`,
        hint:     `Compute ${a}² = ${a**2} then find ${a**2} mod ${p}.`,
        steps: [
          `Compute: ${a}² = ${a ** 2}`,
          `Divide: ${a ** 2} ÷ ${p} = ${Math.floor(a ** 2 / p)} remainder ${rem}`,
          `∴  ${a}² ≡ ${rem}  (mod ${p})`,
        ],
        topic: "Number Theory",
      };
    })(),
    (() => {
      const n = pick([5, 7, 11, 13, 17, 19, 23]);
      return {
        question: `Is  ${n}  a prime number?\nList ALL its factors.`,
        answer:   `Yes`,
        hint:     `Check divisibility by all primes up to √${n} ≈ ${Math.sqrt(n).toFixed(1)}.`,
        steps: [
          `A prime has exactly 2 factors: 1 and itself`,
          `Check primes up to √${n} ≈ ${Math.sqrt(n).toFixed(1)}`,
          `No integer factor found in that range`,
          `∴ ${n} is prime. Factors: 1 and ${n} only`,
        ],
        topic: "Number Theory",
      };
    })(),
  ]);
};

const genCombinatorics = (lv) => {
  return pick([
    (() => {
      const n  = rng(5, 10);
      const hs = (n * (n - 1)) / 2;
      return {
        question: `${n} people at a party.\nEach person shakes hands with every other exactly once.\nTotal handshakes?`,
        answer:   `${hs} handshakes`,
        hint:     `Each unique pair = 1 handshake. Use C(n, 2).`,
        steps: [
          `Each unique pair of people = 1 handshake`,
          `Total pairs = C(${n}, 2) = ${n} × ${n - 1} / 2`,
          `= ${hs} handshakes`,
        ],
        topic: "Combinatorics",
      };
    })(),
    (() => {
      const m = rng(2, 5), n = rng(2, 4);
      const w = nCr(m + n, n);
      return {
        question: `How many paths lead from top-left to bottom-right\nof a ${m}×${n} grid,\nmoving only Right or Down?`,
        answer:   `${w} paths`,
        hint:     `Total moves = ${m+n}. Choose which ${n} moves are "right".`,
        steps: [
          `Total moves needed = ${m} down + ${n} right = ${m + n}`,
          `Choose which ${n} of the ${m + n} moves are "right"`,
          `C(${m + n}, ${n}) = ${w} paths`,
        ],
        topic: "Combinatorics",
      };
    })(),
    (() => {
      const n = rng(4, 7);
      const w = fact(n - 1);
      return {
        question: `In how many distinct ways can ${n} people\nsit around a circular table?`,
        answer:   `${w} ways`,
        hint:     `In circular arrangements, fix one person; arrange the rest.`,
        steps: [
          `Fix one person to eliminate rotational duplicates`,
          `Arrange remaining ${n - 1} people in a line`,
          `= (${n}−1)! = ${n - 1}! = ${w} ways`,
        ],
        topic: "Combinatorics",
      };
    })(),
  ]);
};

const genAdvAlgebra = (lv) => {
  return pick([
    (() => {
      const s = pick([3, 4, 5, 6]);
      return {
        question: `If  x + 1/x = ${s},\nfind  x² + 1/x².`,
        answer:   `${s ** 2 - 2}`,
        hint:     `Square both sides: (x + 1/x)² = x² + 2 + 1/x².`,
        steps: [
          `Square both sides: (x + 1/x)² = x² + 2 + 1/x²`,
          `${s}² = x² + 2 + 1/x²`,
          `x² + 1/x² = ${s ** 2} − 2`,
          `= ${s ** 2 - 2}`,
        ],
        topic: "Advanced Algebra",
      };
    })(),
    (() => {
      const e = rng(2, 5);
      return {
        question: `Factorize completely:\n\nx${toSup(2 * e)} − 1`,
        answer:   `(x${toSup(e)} − 1)(x${toSup(e)} + 1)`,
        hint:     `Use difference of squares: a² − b² = (a−b)(a+b) with a = x${toSup(e)}.`,
        steps: [
          `Recognize: a² − b² = (a−b)(a+b)`,
          `Set a = x${toSup(e)},  b = 1`,
          `x${toSup(2 * e)} − 1 = (x${toSup(e)} − 1)(x${toSup(e)} + 1)`,
        ],
        topic: "Advanced Algebra",
      };
    })(),
    (() => {
      const a = rng(2, 5), b = rng(2, 5);
      const result = 2 * b * (3 * a ** 2 + b ** 2);
      return {
        question: `Simplify:\n\n(${a}+${b})³ − (${a}−${b})³`,
        answer:   `${result}`,
        hint:     `Use the identity: (a+b)³ − (a−b)³ = 2b(3a²+b²).`,
        steps: [
          `Identity: (a+b)³ − (a−b)³ = 2b(3a²+b²)`,
          `= 2×${b}×(3×${a}²+${b}²)`,
          `= ${2 * b}×(${3 * a ** 2}+${b ** 2})`,
          `= ${2 * b} × ${3 * a ** 2 + b ** 2} = ${result}`,
        ],
        topic: "Advanced Algebra",
      };
    })(),
    {
      question: `Prove that for any integer n,\nthe product  n(n+1)  is always even.`,
      answer:   `Always even`,
      hint:     `Consider two cases: n is even, or n is odd.`,
      steps: [
        `Consecutive integers always include one even number`,
        `Case 1: n is even → n(n+1) is even`,
        `Case 2: n is odd → (n+1) is even → n(n+1) is even`,
        `∴ n(n+1) is always divisible by 2 ∎`,
      ],
      topic: "Advanced Algebra",
    },
  ]);
};

const OLYMPIAD_CLASSICS = [
  {
    question: `Find  1 + 2 + 3 + ... + 100\nwithout adding each term individually.`,
    answer:   `5050`,
    hint:     `Pair the first and last terms: 1+100 = 101. How many such pairs?`,
    steps: [
      `Pair opposite ends: (1+100) = (2+99) = ... = 101`,
      `There are 50 such pairs`,
      `Sum = 50 × 101 = 5050`,
    ],
    topic: "Classic Puzzles",
  },
  {
    question: `A number is ≡ 3 (mod 7).\nWhat is its square (mod 7)?`,
    answer:   `2`,
    hint:     `Square the residue: 3² = 9. Now reduce 9 mod 7.`,
    steps: [
      `n ≡ 3 (mod 7)`,
      `n² ≡ 3² = 9 (mod 7)`,
      `9 = 7 + 2  →  9 ≡ 2 (mod 7)`,
      `∴ n² ≡ 2 (mod 7)`,
    ],
    topic: "Classic Puzzles",
  },
  {
    question: `Which is larger:  2¹⁰⁰  or  3⁶⁰ ?\nJustify without a calculator.`,
    answer:   `2¹⁰⁰ is larger`,
    hint:     `Compare using logarithms: log(2¹⁰⁰) vs log(3⁶⁰).`,
    steps: [
      `log(2¹⁰⁰) = 100 × log2 ≈ 100 × 0.301 = 30.1`,
      `log(3⁶⁰)  =  60 × log3 ≈ 60  × 0.477 = 28.6`,
      `30.1 > 28.6`,
      `∴ 2¹⁰⁰ > 3⁶⁰`,
    ],
    topic: "Classic Puzzles",
  },
  {
    question: `Find ALL twin prime pairs (p, p+2)\nwhere both are prime and p < 20.`,
    answer:   `(3,5), (5,7), (11,13), (17,19)`,
    hint:     `Check each pair systematically. Remember a prime has no factors except 1 and itself.`,
    steps: [
      `Check pairs: (3,5)✓  (5,7)✓  (7,9)✗ — 9=3²`,
      `(11,13)✓  (13,15)✗ — 15=3×5`,
      `(17,19)✓`,
      `Twin prime pairs: (3,5), (5,7), (11,13), (17,19)`,
    ],
    topic: "Classic Puzzles",
  },
  {
    question: `How many trailing zeros does  100!  end with?\n(zeros at the end of 100! written out)`,
    answer:   `24`,
    hint:     `Trailing zeros come from factors of 10 = 2×5. Count factors of 5.`,
    steps: [
      `Trailing zeros = factors of 10 = min(factors of 2, factors of 5)`,
      `Factors of 5 are the bottleneck`,
      `⌊100/5⌋ = 20,  ⌊100/25⌋ = 4`,
      `Total = 20 + 4 = 24 trailing zeros`,
    ],
    topic: "Classic Puzzles",
  },
  {
    question: `For what value of n does  n² + n + 41\nfail to be prime?\n\n(Euler's prime-generating polynomial)`,
    answer:   `n = 40`,
    hint:     `Try n = 40. Notice that n² + n + 41 = 41(n+1) when n = 40.`,
    steps: [
      `For n = 0 to 39, the formula generates primes`,
      `When n = 40: 40² + 40 + 41 = 1681`,
      `1681 = 41 × 41  (composite!)`,
      `∴ n = 40 is the first failure`,
    ],
    topic: "Classic Puzzles",
  },
];

const genClassic = () => pick(OLYMPIAD_CLASSICS);

// ── NEW OLYMPIAD GENERATORS ───────────────────────────────────────

const genDerivatives = (lv) => {
  const a = rng(1, 6), n = rng(2, 5), b = rng(1, 5), c = rng(0, 8);
  // f(x) = ax^n + bx + c  →  f'(x) = n*a*x^(n-1) + b
  const deriv = `${a * n}x${n - 1 > 1 ? `${toSup(n - 1)}` : n - 1 === 0 ? "" : ""}${b > 0 ? ` + ${b}` : b < 0 ? ` − ${Math.abs(b)}` : ""}`;
  return pick([
    {
      question: `Find the derivative of:\n\nf(x) = ${a}x${toSup(n)} + ${b}x + ${c}`,
      answer:   `f'(x) = ${a * n}x${n - 1 > 1 ? `${toSup(n - 1)}` : ""} + ${b}`,
      hint:     `Apply the power rule: d/dx[axⁿ] = n·axⁿ⁻¹.`,
      steps: [
        `Power rule: d/dx[axⁿ] = n·axⁿ⁻¹`,
        `d/dx[${a}x${toSup(n)}] = ${a * n}x${toSup(n - 1)}`,
        `d/dx[${b}x] = ${b}`,
        `d/dx[${c}] = 0  (constant rule)`,
        `f'(x) = ${a * n}x${n - 1 > 1 ? `${toSup(n - 1)}` : ""} + ${b}`,
      ],
      topic: "Calculus — Derivatives",
    },
    (() => {
      const p = rng(2, 4), q = rng(1, 4), r2 = rng(1, 5), s = rng(1, 4);
      // f(x) = (px + q)(rx + s)  →  expand, then differentiate
      const A = p * r2, B = p * s + q * r2, C = q * s;
      const dA = 2 * A, dB = B;
      return {
        question: `Find d/dx of:\n\nf(x) = (${p}x + ${q})(${r2}x + ${s})`,
        answer:   `f'(x) = ${dA}x + ${dB}`,
        hint:     `Expand first, then differentiate each term using the power rule.`,
        steps: [
          `Expand: f(x) = ${A}x² + ${B}x + ${C}`,
          `d/dx[${A}x²] = ${dA}x`,
          `d/dx[${B}x] = ${dB}`,
          `d/dx[${C}] = 0`,
          `f'(x) = ${dA}x + ${dB}`,
        ],
        topic: "Calculus — Derivatives",
      };
    })(),
  ]);
};

const genIntegrals = (lv) => {
  const a = rng(1, 5), n = rng(1, 4);
  // ∫₀^b (ax^n) dx = [ax^(n+1)/(n+1)] from 0 to b
  const lo = 0, hi = rng(1, 4);
  const val = +(a * hi ** (n + 1) / (n + 1)).toFixed(3);
  return pick([
    {
      question: `Evaluate the definite integral:\n\n∫₀${toSup(hi)} ${a}x${toSup(n)} dx`,
      answer:   `${val}`,
      hint:     `Use ∫xⁿ dx = xⁿ⁺¹/(n+1). Then evaluate at the bounds.`,
      steps: [
        `∫${a}x${toSup(n)} dx = ${a}x${toSup(n + 1)}/${n + 1}`,
        `Evaluate from 0 to ${hi}:`,
        `= ${a}(${hi})${toSup(n + 1)}/${n + 1} − 0`,
        `= ${a} × ${hi ** (n + 1)} / ${n + 1}`,
        `= ${val}`,
      ],
      topic: "Calculus — Integrals",
    },
    (() => {
      const c = rng(1, 6);
      const lo2 = rng(0, 3), hi2 = lo2 + rng(1, 3);
      const ans = c * (hi2 - lo2);
      return {
        question: `Evaluate the definite integral:\n\n∫_${lo2}${toSup(hi2)} ${c} dx`,
        answer:   `${ans}`,
        hint:     `The integral of a constant c over [a,b] = c(b − a).`,
        steps: [
          `∫${c} dx = ${c}x  (antiderivative of a constant)`,
          `Evaluate from ${lo2} to ${hi2}:`,
          `= ${c}(${hi2}) − ${c}(${lo2})`,
          `= ${c * hi2} − ${c * lo2} = ${ans}`,
        ],
        topic: "Calculus — Integrals",
      };
    })(),
  ]);
};

const genDiophantine = (lv) => {
  // Find integer solution to ax + by = gcd(a, b)
  // Extended Euclidean gives us a solution
  const a = pick([3, 5, 7, 4, 6]);
  const b = pick([2, 3, 5, 7, 11]);
  const g = gcd(a, b);
  // Simple brute-force for small values
  let x0 = 0, y0 = 0;
  outer: for (let xx = -20; xx <= 20; xx++) {
    for (let yy = -20; yy <= 20; yy++) {
      if (a * xx + b * yy === g) { x0 = xx; y0 = yy; break outer; }
    }
  }
  return {
    question: `Find an integer solution to:\n\n${a}x + ${b}y = ${g}`,
    answer:   `x = ${x0},  y = ${y0}  (one valid solution)`,
    hint:     `Use the Extended Euclidean Algorithm. Note gcd(${a}, ${b}) = ${g}.`,
    steps: [
      `gcd(${a}, ${b}) = ${g}  (by Euclidean algorithm)`,
      `Since the RHS = ${g} = gcd, a solution exists`,
      `By inspection or extended Euclidean:`,
      `x = ${x0},  y = ${y0}  →  ${a}(${x0}) + ${b}(${y0}) = ${a*x0 + b*y0} ✓`,
    ],
    topic: "Diophantine Equations",
  };
};

const genPigeonhole = (lv) => {
  return pick([
    (() => {
      const colors = rng(3, 6);
      const min    = colors + 1;
      return {
        question: `Socks are in ${colors} different colors.\nWhat is the minimum number of socks to draw\n(in the dark) to guarantee a matching pair?`,
        answer:   `${min} socks`,
        hint:     `Pigeonhole Principle: worst case, you pick one of each color first.`,
        steps: [
          `There are ${colors} colors (pigeonholes)`,
          `Worst case: first ${colors} picks are all different colors`,
          `The (${colors}+1)th pick must match one of them`,
          `Minimum = ${colors} + 1 = ${min} socks`,
        ],
        topic: "Pigeonhole & Combinatorics",
      };
    })(),
    (() => {
      const n = rng(3, 5), r = rng(2, 4);
      // Stars and bars: ways to put n identical balls in r distinct boxes
      const ways = nCr(n + r - 1, r - 1);
      return {
        question: `In how many ways can ${n} identical balls\nbe placed into ${r} distinct boxes?\n(boxes can be empty — Stars & Bars)`,
        answer:   `C(${n+r-1}, ${r-1}) = ${ways} ways`,
        hint:     `Stars and Bars: place (n + r − 1) items, choose (r − 1) dividers.`,
        steps: [
          `Stars & Bars formula: C(n+r−1, r−1)`,
          `n = ${n} balls,  r = ${r} boxes`,
          `= C(${n}+${r}−1, ${r}−1) = C(${n+r-1}, ${r-1})`,
          `= ${ways} ways`,
        ],
        topic: "Pigeonhole & Combinatorics",
      };
    })(),
  ]);
};

const genVieta = (lv) => {
  const r1 = rng(-5, 5), r2 = rng(-5, 5);
  const sum = r1 + r2, prod = r1 * r2;
  const b   = -sum, c = prod;
  const bS  = b === 0 ? "" : b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  const cS  = c === 0 ? "" : c > 0 ? ` + ${c}` : ` − ${Math.abs(c)}`;
  return pick([
    {
      question: `For the equation:  x²${bS}${cS} = 0\n\nWithout finding the roots, find:\n(a) Sum of roots\n(b) Product of roots`,
      answer:   `Sum = ${sum},  Product = ${prod}`,
      hint:     `Vieta's: for x² + bx + c = 0, Sum = −b, Product = c.`,
      steps: [
        `Equation: x²${bS}${cS} = 0`,
        `Vieta's Formulas: Sum of roots = −(coeff of x) / (coeff of x²)`,
        `Sum = −(${b}) / 1 = ${sum}`,
        `Product of roots = constant / coeff of x²  = ${c} / 1 = ${prod}`,
      ],
      topic: "Vieta's Formulas",
    },
    (() => {
      const s = rng(2, 8), p = rng(1, 12);
      return {
        question: `The roots of x² − ${s}x + ${p} = 0\nare α and β.\n\nFind  α² + β².`,
        answer:   `${s*s - 2*p}`,
        hint:     `By Vieta's: α + β = ${s}, αβ = ${p}. Use α² + β² = (α+β)² − 2αβ.`,
        steps: [
          `By Vieta's: α + β = ${s},  αβ = ${p}`,
          `α² + β² = (α + β)² − 2αβ`,
          `= ${s}² − 2(${p})`,
          `= ${s*s} − ${2*p} = ${s*s - 2*p}`,
        ],
        topic: "Vieta's Formulas",
      };
    })(),
  ]);
};

const genAMGM = (lv) => {
  const a = rng(1, 5), b = rng(1, 5);
  const sum = a + b, prod = a * b;
  const sqprod = +Math.sqrt(prod).toFixed(3);
  return pick([
    {
      question: `Show AM ≥ GM for a = ${a}, b = ${b}.\nCompute AM and GM and verify.`,
      answer:   `AM = ${sum/2}, GM ≈ ${sqprod}. AM ≥ GM ✓`,
      hint:     `AM = (a+b)/2, GM = √(ab). AM−GM ≥ 0 always.`,
      steps: [
        `AM = (${a} + ${b}) / 2 = ${sum/2}`,
        `GM = √(${a} × ${b}) = √${prod} ≈ ${sqprod}`,
        `AM − GM = ${sum/2} − ${sqprod} = ${+(sum/2 - sqprod).toFixed(3)} ≥ 0 ✓`,
        `Equality holds only when a = b`,
      ],
      topic: "AM-GM Inequality",
    },
    (() => {
      const x = rng(2, 6);
      const ans = 2 * x;
      return {
        question: `By AM-GM inequality, what is the\nminimum value of:\n\nx + ${x*x}/x   for x > 0?`,
        answer:   `Minimum = ${ans}`,
        hint:     `AM-GM: x + k/x ≥ 2√(x · k/x) = 2√k. Find k here.`,
        steps: [
          `Let a = x,  b = ${x*x}/x`,
          `AM-GM: a + b ≥ 2√(ab)`,
          `= 2√(x · ${x*x}/x) = 2√${x*x} = 2×${x}`,
          `Minimum value = ${ans}  (achieved at x = ${x})`,
        ],
        topic: "AM-GM Inequality",
      };
    })(),
  ]);
};

// ── MASTER GENERATORS TABLE ───────────────────────────────────────

const GENERATORS = {
  beginner:     [genLinear, genRatio, genPercent, genSI, genCI, genSTD, genGeometry, genFractions, genProportions, genExponents, genBasicStats],
  intermediate: [genQuadratic, genIdentity, genProgression, genProbability, genMensuration, genCoordGeo, genSystems, genPolynomials, genLogarithms, genSlopeLines],
  advanced:     [genTrig, genPermComb, genInequality, genFunctions, genAdvGeo, genTrigEquations, genComplexNumbers, genMatrices, genVectors, genFunctionsInverse, genAbsInequality, genConics],
  olympiad:     [genNumberTheory, genCombinatorics, genAdvAlgebra, genClassic, genDerivatives, genIntegrals, genDiophantine, genPigeonhole, genVieta, genAMGM],
};

// ════════════════════════════════════════════════════════════════
//  🧠 ADAPTIVE LEARNING ENGINE  (NEW)
// ════════════════════════════════════════════════════════════════

// Maps each generator index to its topic name for adaptive weighting
const GTOPICS = {
  beginner:     ["Linear Equations","Ratios","Percentages","Simple Interest","Compound Interest","Speed, Time & Distance","Geometry","Fractions & Decimals","Proportions & Variations","Exponents & Radicals","Basic Statistics"],
  intermediate: ["Quadratic Equations","Algebraic Identities","AP/GP","Probability","Mensuration","Coordinate Geometry","Systems of Equations","Polynomials & Remainders","Logarithms","Slope & Lines"],
  advanced:     ["Trigonometry","Permutations & Combinations","Inequalities","Functions","Advanced Geometry","Trig Equations","Complex Numbers","Matrices & Determinants","Vectors","Functions & Inverses","Inequalities (Abs. Value)","Conic Sections"],
  olympiad:     ["Number Theory","Combinatorics","Advanced Algebra","Classic Puzzles","Calculus — Derivatives","Calculus — Integrals","Diophantine Equations","Pigeonhole & Combinatorics","Vieta's Formulas","AM-GM Inequality"],
};

// Weighted question selection — weak topics get more practice
const genAdaptive = (mode, topicStats, lv) => {
  const gens   = GENERATORS[mode];
  const topics = GTOPICS[mode];
  const weights = topics.map(t => {
    const s = topicStats[t];
    if (!s || s.total < 2) return 1.5;         // unseen → elevated
    const acc = s.correct / s.total;
    if (acc < 0.30) return 7;                  // very weak
    if (acc < 0.50) return 4;                  // weak
    if (acc < 0.65) return 2;                  // below average
    if (acc < 0.80) return 1;                  // average
    return 0.5;                                 // strong → deprioritize
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < gens.length; i++) {
    r -= weights[i];
    if (r <= 0) return gens[i](lv);
  }
  return gens[gens.length - 1](lv);
};

// ════════════════════════════════════════════════════════════════
//  ✅ EVALUATION ENGINE  (NEW)
// ════════════════════════════════════════════════════════════════

const extractNums = (s) => {
  const c = s.replace(/[₹°%,!]/g, " ");
  const fracs = [...c.matchAll(/(-?\d+)\s*\/\s*(\d+)/g)].map(m => +m[1] / +m[2]);
  const rest  = c.replace(/(-?\d+)\s*\/\s*(\d+)/g, " ");
  const nums  = [...rest.matchAll(/-?\d+\.?\d*/g)].map(m => parseFloat(m[0]));
  return [...fracs, ...nums];
};

const near = (a, b) => Math.abs(a - b) <= Math.max(Math.abs(b) * 0.02, 0.6);

const evalAnswer = (userInput, correctAnswer) => {
  if (!userInput?.trim()) return "empty";
  const norm = s => s.trim().toLowerCase().replace(/[₹°%,\s!.]/g, "");
  const u = norm(userInput), c = norm(correctAnswer);

  if (u === c) return "correct";
  if (c.includes(u) && u.length >= 1) return "correct";

  const ul = userInput.trim().toLowerCase();
  const cl = correctAnswer.trim().toLowerCase();
  if (["yes","y"].includes(ul) && cl.startsWith("yes")) return "correct";
  if (["no","n"].includes(ul)  && cl.startsWith("no"))  return "correct";

  const uN = extractNums(userInput), cN = extractNums(correctAnswer);
  if (uN.length > 0 && cN.length > 0) {
    if (cN.length === 1) return uN.some(n => near(n, cN[0])) ? "correct" : "wrong";
    const allMatch  = cN.every(cn => uN.some(un => near(un, cn)));
    if (allMatch) return "correct";
    const someMatch = cN.some(cn => uN.some(un => near(un, cn)));
    if (someMatch) return "partial";
  }

  return "wrong";
};

// ════════════════════════════════════════════════════════════════
//  ⭐ XP & RANK SYSTEM  (NEW)
// ════════════════════════════════════════════════════════════════

const RANKS = [
  { name: "Novice",     xp: 0,    next: 60,   color: "#9ca3af" },
  { name: "Apprentice", xp: 60,   next: 180,  color: "#10b981" },
  { name: "Scholar",    xp: 180,  next: 420,  color: "#3b82f6" },
  { name: "Expert",     xp: 420,  next: 800,  color: "#f59e0b" },
  { name: "Master",     xp: 800,  next: 1400, color: "#ef4444" },
  { name: "Legend",     xp: 1400, next: null, color: "#a855f7" },
];

const MODE_XP = { beginner: 1, intermediate: 1.4, advanced: 2, olympiad: 3 };

const getRank = (xp) => {
  let r = RANKS[0];
  for (const rank of RANKS) if (xp >= rank.xp) r = rank;
  const pct = r.next ? Math.min(((xp - r.xp) / (r.next - r.xp)) * 100, 100) : 100;
  return { ...r, pct };
};

const calcXP = (streak, lv, mode) => {
  const base = 10 + lv * 3;
  const sm   = streak >= 7 ? 2.5 : streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
  return Math.round(base * sm * (MODE_XP[mode] || 1));
};

const streakMsg = (streak) => {
  if (streak >= 7) return "🌟 Legendary!";
  if (streak >= 5) return "⚡ Unstoppable!";
  if (streak >= 3) return "🔥 On fire!";
  return null;
};

// ════════════════════════════════════════════════════════════════
//  UI CONFIG
// ════════════════════════════════════════════════════════════════

const MODES = [
  { id:"beginner",     label:"Beginner",     glyph:"I",   desc:"Foundations & Confidence",    topics:"Fractions · Ratios · Percentages · Interest · Linear Equations · Exponents · Stats · Geometry",         accent:"#10b981", dim:"rgba(16,185,129,0.10)", border:"rgba(16,185,129,0.28)" },
  { id:"intermediate", label:"Intermediate", glyph:"II",  desc:"Multi-step Thinking",          topics:"Quadratics · Systems · Logs · Identities · AP/GP · Probability · Mensuration · Coord Geo · Slope",      accent:"#f59e0b", dim:"rgba(245,158,11,0.10)",  border:"rgba(245,158,11,0.28)" },
  { id:"advanced",     label:"Advanced",     glyph:"III", desc:"Problem Solving & Logic",      topics:"Trig · Complex Numbers · Matrices · Vectors · Functions & Inverses · Conics · P&C · Inequalities",      accent:"#ef4444", dim:"rgba(239,68,68,0.10)",   border:"rgba(239,68,68,0.28)" },
  { id:"olympiad",     label:"Olympiad",     glyph:"IV",  desc:"Deep Thinking & Creativity",   topics:"Calculus · Diophantine · Vieta's · AM-GM · Number Theory · Pigeonhole · Combinatorics · Puzzles",       accent:"#a855f7", dim:"rgba(168,85,247,0.10)",  border:"rgba(168,85,247,0.28)" },
];

// ════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&family=JetBrains+Mono:wght@400;600;700&display=swap');

  /* ── DESIGN TOKENS ─────────────────────────────── */
  :root {
    --bg:          #07090f;
    --bg-raised:   #0d1117;
    --bg-sunken:   #060810;
    --bg-input:    #0b0e17;
    --surface:     #111827;
    --border:      #1d2535;
    --border-soft: #151d2b;
    --text:        #f0f4ff;
    --text-2:      #8b9ab5;
    --text-3:      #3d4f6a;
    --grid-line:   rgba(255,255,255,0.024);
    --shadow-card: 0 2px 16px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03);
    --shadow-sm:   0 1px 6px rgba(0,0,0,0.35);
    --radius-lg:   16px;
    --radius-md:   12px;
    --radius-sm:   8px;
    --transition:  0.22s cubic-bezier(.4,0,.2,1);
  }
  [data-theme="light"] {
    --bg:          #f5f7fc;
    --bg-raised:   #ffffff;
    --bg-sunken:   #eef1f8;
    --bg-input:    #ffffff;
    --surface:     #f0f3fb;
    --border:      #dde2ef;
    --border-soft: #e8ecf5;
    --text:        #0d1526;
    --text-2:      #4a5578;
    --text-3:      #9ba6bf;
    --grid-line:   rgba(0,0,0,0.032);
    --shadow-card: 0 2px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);
    --shadow-sm:   0 1px 4px rgba(0,0,0,0.08);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg); color: var(--text);
    font-family: 'Inter', system-ui, sans-serif;
    min-height: 100vh;
    transition: background var(--transition), color var(--transition);
    -webkit-font-smoothing: antialiased;
  }

  .grid-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(var(--grid-line) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
    background-size: 44px 44px;
    transition: background-image var(--transition);
  }

  .app {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; padding: 24px 16px 72px;
    position: relative; z-index: 1;
  }

  /* ── THEME TOGGLE ── */
  .theme-toggle {
    position: fixed; top: 18px; right: 18px; z-index: 100;
    display: flex; align-items: center; gap: 6px;
    background: var(--bg-raised); border: 1px solid var(--border);
    color: var(--text-2); padding: 7px 14px; border-radius: 24px;
    font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: 'Inter', sans-serif; letter-spacing: 0.3px;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition);
  }
  .theme-toggle:hover { color: var(--text); border-color: var(--text-3); }
  .theme-toggle:active { transform: scale(0.97); }

  /* ── MENU ── */
  .menu-wrap { width: 100%; max-width: 460px; }

  .logo { text-align: center; margin-bottom: 36px; padding-top: 12px; }
  .logo-icon {
    font-size: 40px; margin-bottom: 10px; display: block;
    filter: drop-shadow(0 0 24px rgba(96,165,250,0.35));
  }
  .logo-title {
    font-size: 32px; font-weight: 800; letter-spacing: -1.5px;
    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    line-height: 1.1;
  }
  .logo-sub {
    font-size: 10px; color: var(--text-3); letter-spacing: 3.5px;
    text-transform: uppercase; margin-top: 6px;
    font-family: 'JetBrains Mono', monospace;
  }
  .logo-rank {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 12px; font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    padding: 5px 14px; border-radius: 24px; border: 1px solid currentColor; opacity: 0.9;
  }

  .mode-card {
    width: 100%; border-radius: var(--radius-lg); border: 1px solid var(--border);
    padding: 20px 22px; cursor: pointer; text-align: left; margin-bottom: 10px;
    background: var(--bg-raised);
    box-shadow: var(--shadow-card);
    transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
    position: relative; overflow: hidden;
  }
  .mode-card::before {
    content: ''; position: absolute; inset: 0; opacity: 0;
    transition: opacity var(--transition);
    background: linear-gradient(135deg, var(--accent-raw, transparent) 0%, transparent 60%);
  }
  .mode-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04); }
  .mode-card:hover::before { opacity: 0.04; }
  .mode-card:active { transform: scale(0.99) translateY(0); }
  .mode-card-top { display: flex; align-items: center; gap: 14px; margin-bottom: 9px; position: relative; }
  .mode-glyph {
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; color: var(--text-3);
    background: var(--bg-sunken); border: 1px solid var(--border-soft);
    padding: 3px 7px; border-radius: 5px;
  }
  .mode-label { font-size: 17px; font-weight: 700; letter-spacing: -0.3px; }
  .mode-sub { font-size: 11px; color: var(--text-2); font-weight: 400; margin-top: 1px; }
  .mode-icon { font-size: 16px; margin-left: auto; opacity: 0.5; transition: opacity var(--transition); }
  .mode-card:hover .mode-icon { opacity: 1; }
  .mode-topics {
    font-size: 10.5px; color: var(--text-3); letter-spacing: 0.1px;
    font-family: 'JetBrains Mono', monospace; line-height: 1.6; position: relative;
  }
  .mode-divider { height: 1px; background: var(--border-soft); margin: 10px 0; }

  /* ── GAME ── */
  .game-wrap { width: 100%; max-width: 460px; }
  .fade-wrap { transition: opacity 0.14s ease; }

  .top-bar {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px; padding-top: 2px;
  }
  .back-btn {
    font-size: 12px; color: var(--text-3); cursor: pointer;
    background: var(--bg-raised); border: 1px solid var(--border);
    font-family: 'Inter', sans-serif; font-weight: 600;
    padding: 6px 12px; border-radius: 20px;
    transition: all var(--transition); box-shadow: var(--shadow-sm);
  }
  .back-btn:hover { color: var(--text); border-color: var(--text-3); }
  .mode-badge {
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; font-family: 'JetBrains Mono', monospace;
    background: var(--bg-raised); border: 1px solid var(--border);
    padding: 5px 12px; border-radius: 20px; box-shadow: var(--shadow-sm);
  }
  .level-badge {
    margin-left: auto;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
    color: var(--text-3); letter-spacing: 1px;
    background: var(--bg-raised); border: 1px solid var(--border);
    padding: 5px 10px; border-radius: 20px;
  }

  /* ── XP Bar ── */
  .xp-section {
    background: var(--bg-raised); border: 1px solid var(--border);
    border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 12px;
    box-shadow: var(--shadow-sm);
  }
  .xp-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .rank-name {
    font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; font-family: 'JetBrains Mono', monospace;
  }
  .xp-nums { font-size: 10px; color: var(--text-3); font-family: 'JetBrains Mono', monospace; }
  .xp-bar-bg {
    height: 4px; background: var(--bg-sunken); border-radius: 3px;
    overflow: hidden; border: 1px solid var(--border-soft);
  }
  .xp-bar-fill { height: 100%; border-radius: 3px; transition: width 0.7s cubic-bezier(.4,0,.2,1); }

  /* ── Stats ── */
  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .stat-box {
    border-radius: var(--radius-sm); border: 1px solid var(--border);
    padding: 11px 8px; text-align: center;
    background: var(--bg-raised); box-shadow: var(--shadow-sm);
  }
  .stat-num { font-size: 22px; font-weight: 700; font-family: 'JetBrains Mono', monospace; line-height: 1; }
  .stat-label { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; font-weight: 600; }

  /* ── History dots ── */
  .progress-dots { display: flex; justify-content: center; gap: 5px; margin-bottom: 12px; flex-wrap: wrap; }
  .dot { width: 7px; height: 7px; border-radius: 50%; transition: background var(--transition); }

  /* ── Weak topics ── */
  .weak-section { margin-bottom: 12px; }
  .weak-label {
    font-size: 9px; color: var(--text-3); letter-spacing: 2px; text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace; margin-bottom: 6px; font-weight: 600;
  }
  .weak-row { display: flex; gap: 5px; flex-wrap: wrap; }
  .weak-chip {
    font-size: 10px; font-family: 'JetBrains Mono', monospace; padding: 4px 10px;
    border-radius: 6px; background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.18);
    color: #f87171; letter-spacing: 0.2px;
  }

  /* ── Question card ── */
  .q-card {
    border-radius: var(--radius-lg); border: 1px solid var(--border);
    padding: 24px 22px; margin-bottom: 14px;
    background: var(--bg-raised);
    box-shadow: var(--shadow-card);
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .q-card.ev-correct { border-color: rgba(16,185,129,0.45); box-shadow: 0 0 0 1px rgba(16,185,129,0.1), var(--shadow-card); }
  .q-card.ev-wrong   { border-color: rgba(239,68,68,0.4);   box-shadow: 0 0 0 1px rgba(239,68,68,0.08), var(--shadow-card); }
  .q-card.ev-partial { border-color: rgba(251,191,36,0.4);  box-shadow: 0 0 0 1px rgba(251,191,36,0.08), var(--shadow-card); }
  .q-topic {
    font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace; margin-bottom: 16px; opacity: 0.9;
    display: flex; align-items: center; gap: 8px;
  }
  .q-topic::after { content: ''; flex: 1; height: 1px; background: currentColor; opacity: 0.12; }
  .q-text {
    font-size: 16px; line-height: 1.85; font-weight: 500; white-space: pre-wrap;
    color: var(--text); letter-spacing: -0.1px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Hint ── */
  .hint-row { margin-bottom: 10px; }
  .hint-btn {
    background: none; border: none; font-size: 11px; color: var(--text-3);
    cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600;
    padding: 4px 0; transition: color var(--transition); letter-spacing: 0.2px;
  }
  .hint-btn:hover { color: var(--text-2); }
  .hint-box {
    margin-top: 8px; background: rgba(251,191,36,0.05); border: 1px solid rgba(251,191,36,0.18);
    border-radius: var(--radius-sm); padding: 12px 16px;
    font-size: 12.5px; color: #f0c040; font-family: 'JetBrains Mono', monospace; line-height: 1.65;
    animation: bannerIn 0.2s ease;
  }
  [data-theme="light"] .hint-box { color: #a06a00; background: rgba(251,191,36,0.07); border-color: rgba(251,191,36,0.25); }

  /* ── Answer input ── */
  .answer-row { display: flex; gap: 8px; margin-bottom: 8px; }
  .answer-input {
    flex: 1; background: var(--bg-input); border: 1px solid var(--border);
    border-radius: var(--radius-md); padding: 13px 16px;
    font-family: 'JetBrains Mono', monospace; font-size: 14px; color: var(--text);
    outline: none; box-shadow: var(--shadow-sm);
    transition: border-color var(--transition), box-shadow var(--transition);
  }
  .answer-input::placeholder { color: var(--text-3); }
  .answer-input:focus { border-color: var(--text-3); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .answer-input:disabled { opacity: 0.45; }

  .submit-btn {
    padding: 13px 18px; border-radius: var(--radius-md);
    background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.28);
    color: #818cf8; font-size: 13px; font-weight: 700;
    font-family: 'Inter', sans-serif; cursor: pointer;
    transition: all var(--transition); white-space: nowrap;
    box-shadow: var(--shadow-sm);
  }
  .submit-btn:hover:not(:disabled) { background: rgba(99,102,241,0.22); border-color: rgba(99,102,241,0.45); }
  .submit-btn:active { transform: scale(0.97); }
  .submit-btn:disabled { opacity: 0.22; cursor: default; }

  /* ── Feedback banner ── */
  .feedback-banner {
    border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 12px;
    display: flex; align-items: center; gap: 10px;
    font-weight: 700; font-size: 13px; font-family: 'Inter', sans-serif;
    animation: bannerIn 0.25s cubic-bezier(.4,0,.2,1);
    letter-spacing: 0.1px;
  }
  @keyframes bannerIn {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  .feedback-banner.ev-correct { background: rgba(16,185,129,0.09); border: 1px solid rgba(16,185,129,0.3); color: #10b981; }
  .feedback-banner.ev-wrong   { background: rgba(239,68,68,0.09);  border: 1px solid rgba(239,68,68,0.28); color: #f87171; }
  .feedback-banner.ev-partial { background: rgba(251,191,36,0.07); border: 1px solid rgba(251,191,36,0.3); color: #fbbf24; }
  [data-theme="light"] .feedback-banner.ev-correct { color: #059669; background: rgba(16,185,129,0.07); }
  [data-theme="light"] .feedback-banner.ev-wrong   { color: #dc2626; background: rgba(239,68,68,0.07); }
  [data-theme="light"] .feedback-banner.ev-partial { color: #b45309; background: rgba(251,191,36,0.07); }
  .feedback-xp { margin-left: auto; font-size: 11px; font-family: 'JetBrains Mono', monospace; opacity: 0.9; }

  /* ── Answer card ── */
  .ans-card {
    border-radius: var(--radius-lg); background: var(--bg-raised);
    border: 1px solid var(--border); padding: 20px 22px; margin-bottom: 12px;
    box-shadow: var(--shadow-card); animation: bannerIn 0.22s ease;
  }
  .ans-label {
    font-size: 9px; color: var(--text-3); letter-spacing: 2.5px; text-transform: uppercase;
    margin-bottom: 8px; font-family: 'JetBrains Mono', monospace; font-weight: 700;
  }
  .ans-value { font-size: 19px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-bottom: 16px; line-height: 1.3; }
  .ans-divider { height: 1px; background: var(--border); margin-bottom: 16px; }
  .ans-exp-label {
    font-size: 9px; color: var(--text-3); letter-spacing: 2.5px; text-transform: uppercase;
    margin-bottom: 12px; font-family: 'JetBrains Mono', monospace; font-weight: 700;
  }

  /* ── Steps ── */
  .step-list { display: flex; flex-direction: column; gap: 8px; }
  .step-row { display: flex; gap: 12px; align-items: flex-start; }
  .step-num {
    min-width: 20px; height: 20px; border-radius: 50%;
    background: var(--bg-sunken); border: 1px solid var(--border-soft);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: var(--text-3);
    font-family: 'JetBrains Mono', monospace; flex-shrink: 0; margin-top: 1px;
  }
  .step-text {
    font-size: 13px; color: var(--text-2); line-height: 1.75;
    font-family: 'JetBrains Mono', monospace; letter-spacing: -0.1px;
  }

  /* ── Action buttons ── */
  .btn-row { display: flex; gap: 8px; margin-bottom: 10px; }
  .btn {
    flex: 1; padding: 14px; border-radius: var(--radius-md);
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; border: 1px solid; transition: all var(--transition);
    box-shadow: var(--shadow-sm);
  }
  .btn:hover { filter: brightness(1.1); }
  .btn:active { transform: scale(0.98); }
  .verdict-bar {
    text-align: center; font-size: 10px; color: var(--text-3); margin-bottom: 10px;
    font-family: 'JetBrains Mono', monospace; letter-spacing: 2px; text-transform: uppercase;
    display: flex; align-items: center; gap: 10px;
  }
  .verdict-bar::before, .verdict-bar::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .btn-next {
    width: 100%; padding: 15px; border-radius: var(--radius-md); cursor: pointer;
    font-size: 14px; font-weight: 700; font-family: 'Inter', sans-serif;
    transition: all var(--transition); border: 1px solid;
    animation: bannerIn 0.2s ease; box-shadow: var(--shadow-sm);
    letter-spacing: 0.2px;
  }
  .btn-next:hover { filter: brightness(1.12); transform: translateY(-1px); }
  .btn-next:active { transform: scale(0.99); }
  .btn-skip {
    background: none; border: none; width: 100%; color: var(--text-3);
    font-size: 12px; font-family: 'Inter', sans-serif; font-weight: 500;
    cursor: pointer; padding: 9px; transition: color var(--transition);
    letter-spacing: 0.2px;
  }
  .btn-skip:hover { color: var(--text-2); }

  /* ── Accuracy ── */
  .accuracy-line {
    text-align: center; margin-top: 18px; font-size: 11px; color: var(--text-3);
    font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px;
  }
`;

// ════════════════════════════════════════════════════════════════
//  COMPONENT
// ════════════════════════════════════════════════════════════════

export default function MathBot() {
  const [theme,      setTheme]      = useState("dark");
  const [mode,       setMode]       = useState(null);
  const [question,   setQuestion]   = useState(null);
  const [userInput,  setUserInput]  = useState("");
  const [evaluation, setEvaluation] = useState(null);   // null | correct | wrong | partial
  const [showAns,    setShowAns]    = useState(false);
  const [showHint,   setShowHint]   = useState(false);
  const [answered,   setAnswered]   = useState(false);
  const [userLv,     setUserLv]     = useState(1);
  const [score,      setScore]      = useState({ correct: 0, wrong: 0, streak: 0 });
  const [totalXP,    setTotalXP]    = useState(() => parseInt(localStorage.getItem('userXP') || '0', 10));
  const [xpGained,   setXpGained]   = useState(null);
  const [history,    setHistory]    = useState([]);
  const [topicStats, setTopicStats] = useState({});
  const [anim,       setAnim]       = useState(false);
  const inputRef = useRef(null);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  const m = MODES.find(x => x.id === mode);

  // Derived
  const rankInfo  = getRank(totalXP);
  const total     = score.correct + score.wrong;
  const weakTopics = Object.entries(topicStats)
    .filter(([, s]) => s.total >= 3 && s.correct / s.total < 0.6)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .slice(0, 3);

  const startMode = (id) => {
    setMode(id);
    setScore({ correct: 0, wrong: 0, streak: 0 });
    setUserLv(1);
    setHistory([]);
    setTopicStats({});
    setShowAns(false);
    setShowHint(false);
    setAnswered(false);
    setEvaluation(null);
    setUserInput("");
    setXpGained(null);
    setQuestion(genAdaptive(id, {}, 1));
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const nextQ = useCallback(() => {
    setAnim(true);
    setTimeout(() => {
      setQuestion(genAdaptive(mode, topicStats, userLv));
      setShowAns(false);
      setShowHint(false);
      setAnswered(false);
      setEvaluation(null);
      setUserInput("");
      setXpGained(null);
      setAnim(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 120);
  }, [mode, topicStats, userLv]);

  // Persist XP to localStorage and broadcast to the parent app
  const awardXP = useCallback((amount) => {
    const current = parseInt(localStorage.getItem('userXP') || '0', 10);
    const newTotal = current + amount;
    localStorage.setItem('userXP', String(newTotal));
    window.dispatchEvent(new CustomEvent('xpUpdated', { detail: { xp: newTotal } }));
  }, []);

  // Record outcome (shared by both flows)
  const recordOutcome = useCallback((topic, isCorrect, currentStreak, currentScore) => {
    setTopicStats(ts => ({
      ...ts,
      [topic]: {
        total:   (ts[topic]?.total   || 0) + 1,
        correct: (ts[topic]?.correct || 0) + (isCorrect ? 1 : 0),
      }
    }));
    setHistory(h => [...h.slice(-9), isCorrect]);

    if (isCorrect) {
      const newStreak = currentStreak + 1;
      const xp = calcXP(newStreak, userLv, mode);
      setScore({ correct: currentScore.correct + 1, wrong: currentScore.wrong, streak: newStreak });
      setTotalXP(t => t + xp);
      setXpGained(xp);
      awardXP(xp);   // persist to localStorage + broadcast to profile
      if (newStreak >= 3) setUserLv(l => Math.min(l + 1, 5));
    } else {
      setScore({ correct: currentScore.correct, wrong: currentScore.wrong + 1, streak: 0 });
      setXpGained(0);
      setUserLv(l => Math.max(l - 1, 1));
    }
  }, [userLv, mode, awardXP]);

  // Auto-evaluate (typing flow)
  const handleSubmit = useCallback(() => {
    if (answered || !userInput.trim() || !question) return;
    const result = evalAnswer(userInput, question.answer);
    const isCorrect = result === "correct";
    setEvaluation(result);
    setShowAns(true);
    setAnswered(true);
    recordOutcome(question.topic, isCorrect, score.streak, score);
  }, [answered, userInput, question, score, recordOutcome]);

  // Self-assess (show-answer flow)
  const handleResult = useCallback((isCorrect) => {
    if (answered || !question) return;
    setAnswered(true);
    recordOutcome(question.topic, isCorrect, score.streak, score);
  }, [answered, question, score, recordOutcome]);

  // ── MENU ──────────────────────────────────────────────────────
  if (!mode) {
    return (
      <>
        <style>{STYLE}</style>
        <div data-theme={theme}>
          <div className="grid-bg" />
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
          <div className="app">
            <div className="menu-wrap">
              <div className="logo">
                <span className="logo-icon">𝕄</span>
                <div className="logo-title">MathBot</div>
                <div className="logo-sub">Adaptive · Offline · Intelligent</div>
                {totalXP > 0 && (
                  <div className="logo-rank" style={{ color: rankInfo.color }}>
                    {rankInfo.name} · {totalXP} XP
                  </div>
                )}
              </div>
              {MODES.map(md => (
                <button
                  key={md.id}
                  className="mode-card"
                  onClick={() => startMode(md.id)}
                >
                  <div className="mode-card-top">
                    <span className="mode-glyph">{md.glyph}</span>
                    <div>
                      <div className="mode-label" style={{ color: md.accent }}>{md.label}</div>
                      <div className="mode-sub">{md.desc}</div>
                    </div>
                    <span className="mode-icon" style={{ color: md.accent }}>→</span>
                  </div>
                  <div className="mode-divider" />
                  <div className="mode-topics" style={{ color: md.accent, opacity: 0.5 }}>{md.topics}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── GAME ──────────────────────────────────────────────────────
  const evClass = evaluation ? `ev-${evaluation}` : "";
  const streakLabel = streakMsg(score.streak);

  return (
    <>
      <style>{STYLE}</style>
      <div data-theme={theme}>
        <div className="grid-bg" />
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
        <div className="app">
          <div className="game-wrap fade-wrap" style={{ opacity: anim ? 0.25 : 1 }}>

            {/* Top bar */}
            <div className="top-bar">
              <button className="back-btn" onClick={() => setMode(null)}>← Modes</button>
              <div className="mode-badge" style={{ color: m.accent }}>{m.label}</div>
              <div className="level-badge">LV {userLv}/5</div>
            </div>

            {/* XP Bar */}
            <div className="xp-section">
              <div className="xp-top">
                <span className="rank-name" style={{ color: rankInfo.color }}>{rankInfo.name}</span>
                <span className="xp-nums">
                  {totalXP} XP
                  {rankInfo.next ? ` → ${rankInfo.next} for ${RANKS.find(r => r.xp === rankInfo.next)?.name}` : " · MAX RANK"}
                </span>
              </div>
              <div className="xp-bar-bg">
                <div className="xp-bar-fill" style={{ width: `${rankInfo.pct}%`, background: rankInfo.color }} />
              </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
              <div className="stat-box" style={{ borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.06)" }}>
                <div className="stat-num" style={{ color: "#10b981" }}>{score.correct}</div>
                <div className="stat-label">Correct</div>
              </div>
              <div className="stat-box" style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
                <div className="stat-num" style={{ color: "#ef4444" }}>{score.wrong}</div>
                <div className="stat-label">Wrong</div>
              </div>
              <div className="stat-box" style={{ borderColor: "rgba(251,191,36,0.25)", background: "rgba(251,191,36,0.06)" }}>
                <div className="stat-num" style={{ color: "#fbbf24" }}>🔥{score.streak}</div>
                <div className="stat-label">Streak</div>
              </div>
            </div>

            {/* History dots */}
            {history.length > 0 && (
              <div className="progress-dots">
                {history.map((h, i) => (
                  <div key={i} className="dot" style={{ background: h ? "#10b981" : "#ef4444" }} />
                ))}
              </div>
            )}

            {/* Weak topics */}
            {weakTopics.length > 0 && (
              <div className="weak-section">
                <div className="weak-label">⚠ Focus Areas — adaptive engine is boosting these</div>
                <div className="weak-row">
                  {weakTopics.map(([topic, s]) => (
                    <div key={topic} className="weak-chip">
                      {topic} · {Math.round((s.correct / s.total) * 100)}%
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question card */}
            {question && (
              <div className={`q-card ${evClass}`} style={{ borderColor: !evaluation ? m.border : undefined }}>
                <div className="q-topic" style={{ color: m.accent }}>{question.topic}</div>
                <div className="q-text">{question.question}</div>
              </div>
            )}

            {/* Input area — only before answer revealed */}
            {!showAns && !answered && question && (
              <>
                <div className="hint-row">
                  <button className="hint-btn" onClick={() => setShowHint(h => !h)}>
                    {showHint ? "▲ Hide hint" : "💡 Show hint"}
                  </button>
                  {showHint && <div className="hint-box">{question.hint}</div>}
                </div>

                <div className="answer-row">
                  <input
                    ref={inputRef}
                    className={`answer-input${evaluation ? ` ev-${evaluation}` : ""}`}
                    type="text"
                    placeholder="Type your answer…"
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={!userInput.trim()}
                  >
                    Check →
                  </button>
                </div>
                <button className="btn-skip" onClick={() => setShowAns(true)}>
                  Show Answer
                </button>
              </>
            )}

            {/* Answer + explanation revealed */}
            {showAns && question && (
              <>
                {/* Feedback banner */}
                {evaluation && (
                  <div className={`feedback-banner ${evClass}`}>
                    <span>
                      {evaluation === "correct" && `✓ Correct!${streakLabel ? "  " + streakLabel : ""}`}
                      {evaluation === "wrong"   && "✗ Not quite — study the explanation below"}
                      {evaluation === "partial" && "◑ Partially correct — check all parts"}
                    </span>
                    {evaluation === "correct" && xpGained != null && (
                      <span className="feedback-xp">+{xpGained} XP {score.streak >= 3 ? `· 🔥×${score.streak}` : ""}</span>
                    )}
                  </div>
                )}

                {/* Answer card */}
                <div className="ans-card">
                  <div className="ans-label">Answer</div>
                  <div className="ans-value" style={{ color: m.accent }}>{question.answer}</div>
                  <div className="ans-divider" />
                  <div className="ans-exp-label">Step-by-Step Solution</div>
                  <div className="step-list">
                    {(question.steps || question.explanation?.split("\n").filter(l => l.trim()) || []).map((step, i) => (
                      <div key={i} className="step-row">
                        <div className="step-num">{i + 1}</div>
                        <div className="step-text">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Self-assess buttons */}
                {!answered && !evaluation && (
                  <>
                    <div className="verdict-bar">Did you get it right?</div>
                    <div className="btn-row">
                      <button
                        className="btn"
                        style={{ background: "rgba(16,185,129,0.10)", borderColor: "rgba(16,185,129,0.3)", color: "#10b981" }}
                        onClick={() => handleResult(true)}
                      >
                        ✓  Got it
                      </button>
                      <button
                        className="btn"
                        style={{ background: "rgba(239,68,68,0.10)", borderColor: "rgba(239,68,68,0.3)", color: "#ef4444" }}
                        onClick={() => handleResult(false)}
                      >
                        ✗  Missed it
                      </button>
                    </div>
                  </>
                )}

                {/* Next button */}
                {answered && (
                  <button
                    className="btn-next"
                    style={{
                      background: `linear-gradient(135deg, ${m.accent}15, ${m.accent}28)`,
                      borderColor: m.border,
                      color: m.accent,
                    }}
                    onClick={nextQ}
                  >
                    Next Question →
                  </button>
                )}
              </>
            )}

            {/* Accuracy footer */}
            {total > 0 && (
              <div className="accuracy-line">
                {total} solved · {Math.round((score.correct / total) * 100)}% accuracy
                {weakTopics.length > 0 ? " · adaptive mode active" : ""}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

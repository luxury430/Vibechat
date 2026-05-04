import { useState, useCallback, useRef, useEffect, useMemo } from "react";

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



// ═══════════════════════════════════════════════════════════════════
//  NCERT CLASS XI — ALL 16 CHAPTERS  (ported from Math Trainer)
// ═══════════════════════════════════════════════════════════════════

// ── Utilities (prefixed to avoid conflicts) ────────────────────────
const mt_sh      = a => [...a].sort(() => Math.random() - 0.5);
const mt_isPrime = n => { if (n < 2) return false; for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false; return true; };
const mt_primes  = max => { const p = []; for (let i = 2; i <= max; i++) if (mt_isPrime(i)) p.push(i); return p; };
const mt_factors = n => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };
const mt_subsets = arr => { const res = []; for (let mask = 0; mask < (1 << arr.length); mask++) { const sub = arr.filter((_, i) => mask & (1 << i)); res.push(sub.length === 0 ? "∅" : `{${sub.join(",")}}`); } return res; };
const mt_w3      = (correct, spread = [1,2,3]) => { const s = new Set(); for (const d of spread) { s.add(correct+d); s.add(correct-d); } return [...s].filter(x => x !== correct && x > 0).slice(0,3); };
const mt_mcq     = (correctStr, wrongStrs) => { const opts = mt_sh([correctStr, ...wrongStrs.slice(0,3)]); return { options: opts, answerIndex: opts.indexOf(correctStr) }; };

const MT_DEG     = ["30","45","60","90","120","135","150","180","210","240","270","300","330","360"];
const MT_RAD     = ["π/6","π/4","π/3","π/2","2π/3","3π/4","5π/6","π","7π/6","4π/3","3π/2","5π/3","11π/6","2π"];
const MT_SIN_ARR = ["1/2","1/√2","√3/2","1","√3/2","1/√2","1/2","0","−1/2","−√3/2","−1","−√3/2","−1/2","0"];
const MT_COS_ARR = ["√3/2","1/√2","1/2","0","−1/2","−1/√2","−√3/2","−1","−√3/2","−1/2","0","1/2","√3/2","1"];

// ── Adapters: convert math-trainer format → MathBot format ─────────
const mt_adaptCheck = (raw) => ({
  question:    raw.question,
  answer:      raw.options[raw.answerIndex],
  hint:        raw.explanation,
  steps:       raw.explanation.split('\n').filter(l => l.trim()),
  topic:       "NCERT · " + raw.title,
});
const mt_adaptTeach = (raw) => ({
  question:    raw.problem,
  answer:      raw.solution.split('\n').find(l => l.trim()) || raw.solution,
  hint:        raw.concept,
  steps:       raw.solution.split('\n').filter(l => l.trim()),
  topic:       "NCERT · " + raw.title,
});
const mt_gen = (ch) => (_lv) => {
  const useCheck = Math.random() < 0.6;
  const pool = useCheck ? ch.check : ch.teach;
  const fn   = pool[Math.floor(Math.random() * pool.length)];
  const raw  = fn();
  return useCheck ? mt_adaptCheck(raw) : mt_adaptTeach(raw);
};

const NCERT_ENGINE = {

  ch1: {
    title: "Sets",
    teach: [
      () => {
        const kinds = ["multiples", "squares", "factors", "primes"];
        const kind = pick(kinds);
        let desc, elems, sbf;
        if (kind === "multiples") {
          const m = rng(3, 8), lim = rng(30, 60);
          elems = []; for (let x = m; x < lim; x += m) elems.push(x);
          desc = `multiples of ${m} less than ${lim}`;
          sbf = `{ x : x = ${m}k, k ∈ ℕ, x < ${lim} }`;
        } else if (kind === "squares") {
          const lim = rng(50, 120);
          elems = []; for (let i = 1; i * i < lim; i++) elems.push(i * i);
          desc = `perfect squares less than ${lim}`;
          sbf = `{ x : x = n², n ∈ ℕ, x < ${lim} }`;
        } else if (kind === "factors") {
          const n = pick([12, 18, 24, 30, 36, 48, 60]);
          elems = mt_factors(n);
          desc = `factors of ${n}`;
          sbf = `{ x : x | ${n}, x ∈ ℕ }`;
        } else {
          const lim = rng(20, 40);
          elems = mt_primes(lim);
          desc = `prime numbers less than ${lim}`;
          sbf = `{ x : x is prime, x < ${lim} }`;
        }
        return {
          title: "Roster Form from Set-Builder",
          concept: `In roster form, list every element inside { } separated by commas. Order doesn't matter; no element is repeated.`,
          problem: `Write the set of all ${desc} in roster form.`,
          solution: `{ ${elems.join(", ")} }\n\nSet-builder form: ${sbf}\nNumber of elements: ${elems.length}`,
        };
      },
      () => {
        const size = rng(2, 4);
        const base = sh([1,2,3,4,5,6,7,8,9]).slice(0, size).sort((a,b)=>a-b);
        const subs = mt_subsets(base);
        const pw = 1 << size;
        return {
          title: "Power Set Enumeration",
          concept: `The Power Set P(A) is the set of ALL subsets of A — including ∅ and A itself. If |A| = n, then |P(A)| = 2ⁿ.`,
          problem: `List all subsets of A = {${base.join(",")}} and find |P(A)|.`,
          solution: `Subsets: ${subs.join("  ")}\n\n|P(A)| = 2^${size} = ${pw}`,
        };
      },
      () => {
        const total = rng(50, 100);
        const a = rng(20, 40), b = rng(20, 40);
        const both = rng(5, Math.min(a, b) - 5);
        const either = a + b - both;
        const neither = total - either;
        const sport = pick(["cricket","football","badminton","chess","tennis"]);
        const art   = pick(["painting","dancing","singing","coding","reading"]);
        return {
          title: "Practical Problem — Union & Intersection",
          concept: `n(A ∪ B) = n(A) + n(B) − n(A ∩ B).  Neither = Total − n(A ∪ B).`,
          problem: `In a school of ${total} students, ${a} play ${sport} and ${b} practice ${art}. ${both} do both. How many do (a) at least one, (b) neither?`,
          solution: `n(A ∪ B) = ${a} + ${b} − ${both} = ${either}\n\n(a) At least one: ${either}\n(b) Neither: ${total} − ${either} = ${neither < 0 ? 0 : neither}`,
        };
      },
      () => {
        const A = sh([1,2,3,4,5,6,7,8,9,10]).slice(0,rng(3,5)).sort((a,b)=>a-b);
        const B = sh([2,4,6,8,10,12,14]).slice(0,rng(3,5)).sort((a,b)=>a-b);
        const union = [...new Set([...A,...B])].sort((a,b)=>a-b);
        const inter = A.filter(x=>B.includes(x));
        const Aminus = A.filter(x=>!B.includes(x));
        return {
          title: "Set Operations — A∪B, A∩B, A−B",
          concept: `A∪B: all in A OR B.\nA∩B: only in BOTH.\nA−B: in A but NOT in B.\n|A−B| = |A| − |A∩B|.`,
          problem: `A={${A.join(",")}}, B={${B.join(",")}}.\nFind (i) A∪B  (ii) A∩B  (iii) A−B.`,
          solution: `(i) A∪B = {${union.join(",")}}\n(ii) A∩B = {${inter.length?inter.join(","):"∅"}}\n(iii) A−B = {${Aminus.length?Aminus.join(","):"∅"}}\n\n|A|=${A.length}, |B|=${B.length}, |A∩B|=${inter.length}, |A∪B|=${union.length}`,
        };
      },
      () => {
        const U = Array.from({length:10},(_,i)=>i+1);
        const A = mt_sh(U).slice(0,rng(3,6)).sort((a,b)=>a-b);
        const B = mt_sh(U).slice(0,rng(3,6)).sort((a,b)=>a-b);
        const Ac = U.filter(x=>!A.includes(x));
        const Bc = U.filter(x=>!B.includes(x));
        const AuBc = U.filter(x=>!(A.includes(x)||B.includes(x)));
        const AcnBc = Ac.filter(x=>Bc.includes(x));
        return {
          title: "De Morgan's Laws",
          concept: `(A∪B)' = A' ∩ B'\n(A∩B)' = A' ∪ B'\nThese laws connect complements with union/intersection.`,
          problem: `U={1..10}, A={${A.join(",")}}, B={${B.join(",")}}.\nVerify (A∪B)' = A'∩B'.`,
          solution: `A' = {${Ac.join(",")}}\nB' = {${Bc.join(",")}}\n\nA∪B = {${[...new Set([...A,...B])].sort((a,b)=>a-b).join(",")}}\n(A∪B)' = {${AuBc.length?AuBc.join(","):"∅"}}\n\nA'∩B' = {${AcnBc.length?AcnBc.join(","):"∅"}}\n\n(A∪B)' = A'∩B'  ✓`,
        };
      },
      () => {
        const n1=rng(3,6), n2=rng(3,6);
        const total=rng(40,80);
        const a=rng(15,30), b=rng(15,30), c=rng(10,20);
        const ab=rng(3,8), bc=rng(3,8), ac=rng(3,8);
        const abc=rng(1,3);
        const union = a+b+c - ab-bc-ac + abc;
        const neither = total - union;
        return {
          title: "Three-Set Formula",
          concept: `n(A∪B∪C) = n(A)+n(B)+n(C) − n(A∩B)−n(B∩C)−n(A∩C) + n(A∩B∩C)\nNone of three = Total − n(A∪B∪C)`,
          problem: `In ${total} students: ${a} study Maths, ${b} Physics, ${c} Chemistry. Both M&P=${ab}, P&C=${bc}, M&C=${ac}, all three=${abc}.\n(i) How many study at least one? (ii) None?`,
          solution: `n(M∪P∪C) = ${a}+${b}+${c} − ${ab}−${bc}−${ac} + ${abc}\n= ${a+b+c} − ${ab+bc+ac} + ${abc}\n= ${union}\n\n(i) At least one: ${union}\n(ii) None: ${total} − ${union} = ${Math.max(0,neither)}`,
        };
      },
    ],
    check: [
      () => {
        const n = rng(2, 5);
        const ans = 1 << n;
        const { options, answerIndex } = mcq(`${ans}`, mt_w3(ans, [1,2,4]).map(String));
        return { title: "Power Set Size", question: `Set A has ${n} elements. How many elements does P(A) have?`, options, answerIndex, explanation: `|P(A)| = 2ⁿ = 2^${n} = ${ans}.` };
      },
      () => {
        const total = rng(40, 80);
        const a = rng(15, 30), b = rng(15, 30);
        const both = rng(3, Math.min(a,b)/2|0);
        const neither = Math.max(0, total - a - b + both);
        const { options, answerIndex } = mcq(`${neither}`, [neither+5, neither-5 < 0 ? neither+8 : neither-5, neither+3].map(String));
        return {
          title: "Neither Count",
          question: `${total} people; ${a} like tea, ${b} like coffee, ${both} like both. How many like neither?`,
          options, answerIndex,
          explanation: `n(T∪C) = ${a}+${b}−${both} = ${a+b-both}. Neither = ${total}−${a+b-both} = ${neither}.`,
        };
      },
      () => {
        const n = rng(20, 64);
        const maxX = Math.floor(Math.sqrt(n - 1));
        const { options, answerIndex } = mcq(`${maxX}`, [maxX+1, maxX-1, maxX+2].map(String));
        return {
          title: "Roster — Count Elements",
          question: `How many elements are in { x : x ∈ ℕ, x² < ${n} }?`,
          options, answerIndex,
          explanation: `Largest x is ${maxX} since ${maxX}²=${maxX*maxX}<${n} but ${maxX+1}²=${(maxX+1)**2}≥${n}.`,
        };
      },
      () => {
        const A=[rng(1,4),rng(5,7),rng(8,10)];
        const B=[A[0],rng(11,14),rng(15,18)];
        const inter=[A[0]];
        const union=[...new Set([...A,...B])];
        const ans=`{${union.sort((a,b)=>a-b).join(",")}}`;
        const wrong1=`{${A.join(",")}}`;
        const wrong2=`{${B.join(",")}}`;
        const wrong3=`{${inter.join(",")}}`;
        const { options, answerIndex } = mt_mcq(ans,[wrong1,wrong2,wrong3]);
        return { title: "A∪B Value", question: `A={${A.join(",")}}, B={${B.join(",")}}. Find A∪B.`, options, answerIndex, explanation: `A∪B contains all elements from both: ${ans}.` };
      },
    ],
  },

  ch2: {
    title: "Relations & Functions",
    teach: [
      () => {
        const p = rng(2, 4), q = rng(2, 4);
        const A = sh([1,2,3,4,5]).slice(0,p);
        const B = sh(["a","b","c","d","e"]).slice(0,q);
        const prod = [];
        A.forEach(a => B.forEach(b => prod.push(`(${a},${b})`)));
        return {
          title: "Cartesian Product A × B",
          concept: `A × B = {(a,b) : a ∈ A, b ∈ B}. n(A×B) = n(A)×n(B). Note: A×B ≠ B×A in general.`,
          problem: `A = {${A.join(",")}}  B = {${B.join(",")}}. Find A × B and |A × B|.`,
          solution: `A × B = { ${prod.join(", ")} }\n\n|A × B| = ${p} × ${q} = ${p*q}`,
        };
      },
      () => {
        const A = [rng(1,3), rng(4,6), rng(7,9)];
        const d = rng(1, 3);
        const rel = A.map(x => [x, x + d]).filter(([x,y]) => y <= 10);
        const domain = rel.map(r => r[0]);
        const range  = rel.map(r => r[1]);
        return {
          title: "Relation — Domain & Range",
          concept: `Domain = set of all first elements. Range = set of all second elements. Range ⊆ Codomain.`,
          problem: `Let A = {${A.join(",")}} and R = {(x,y) : y = x + ${d}, x,y ∈ A}. Find R, domain, and range.`,
          solution: "R = { " + rel.map(([a,b])=>"("+a+","+b+")").join(", ") + " }\nDomain = {" + domain.join(",") + "}\nRange  = {" + range.join(",") + "}",
        };
      },
      () => {
        const n = rng(3, 5);
        const A = Array.from({length:n},(_,i)=>i+1);
        const type = pick(["one-one","constant","quadratic"]);
        let fDef, pairs, isOneOne, isOnto;
        const B = [1,2,3,4,5,6,7,8,9];
        if (type === "one-one") {
          pairs = A.map(x => [x, x * rng(1,2)]);
          fDef = `f(x) = ${pairs[0][1]/pairs[0][0]}x`;
          isOneOne = true; isOnto = false;
        } else if (type === "constant") {
          const c = rng(2,5);
          pairs = A.map(x => [x, c]);
          fDef = `f(x) = ${c}`;
          isOneOne = false; isOnto = false;
        } else {
          pairs = A.map(x => [x, x*x]);
          fDef = `f(x) = x²`;
          isOneOne = A.every((v,i,a) => a.every((v2,j)=>i===j||v!==v2));
          isOnto = false;
        }
        return {
          title: "Function — One-One & Onto",
          concept: `A function assigns exactly ONE image to each domain element. One-one: no two inputs share an image. Onto: every codomain element is hit.`,
          problem: `f: {${A.join(",")}} → ℕ defined by ${fDef}. Is f one-one? Onto?`,
          solution: "Pairs: { " + pairs.map(([a,b])=>"("+a+","+b+")").join(", ") + " }\nOne-one: " + (isOneOne ? "YES — all images distinct" : "NO — some images repeat") + "\nOnto: " + (isOnto ? "YES" : "NO — not all of \u2115 is covered"),
        };
      },
      () => {
        const m = rng(2,4), n = rng(2,4);
        const A = Array.from({length:m},(_,i)=>i+1);
        const B = Array.from({length:n},(_,i)=>String.fromCharCode(97+i));
        const totalRel = Math.pow(2, m*n);
        const totalFunc = Math.pow(n, m);
        return {
          title: "Number of Relations vs Functions",
          concept: `From A to B:\n• Total relations = 2^(|A|×|B|)  (every subset of A×B)\n• Total functions = |B|^|A|  (each element of A → any of B)\n• Functions are special relations but not vice versa.`,
          problem: `A={${A.join(",")}}, B={${B.join(",")}}. Count total relations and total functions from A to B.`,
          solution: `|A|=${m}, |B|=${n}\n|A×B| = ${m*n}\n\nTotal relations = 2^${m*n} = ${totalRel}\nTotal functions = ${n}^${m} = ${totalFunc}\n\nEvery function is a relation, but not every relation is a function.`,
        };
      },
      () => {
        const ops = [
          {name:"addition",sym:"+",fn:(a,b)=>a+b},
          {name:"subtraction",sym:"−",fn:(a,b)=>a-b},
          {name:"multiplication",sym:"×",fn:(a,b)=>a*b},
        ];
        const op = pick(ops);
        const a=rng(1,5),b=rng(1,4);
        const x=rng(2,6),y=rng(2,6);
        const fv=op.fn(x,a), gv=op.fn(y,b);
        const fg=op.fn(fv,gv);
        let combined;
        if (op.sym === "+") combined = "2x+" + (a+b);
        else if (op.sym === "−") combined = (a-b === 0 ? "" : (a-b));
        else combined = "x\u00B2+" + (a+b) + "x+" + (a*b);
        return {
          title: "Algebra of Functions",
          concept: "For f,g: A\u2192R:\n(f+g)(x)=f(x)+g(x)\n(f\u2212g)(x)=f(x)\u2212g(x)\n(f\u00B7g)(x)=f(x)\u00B7g(x)",
          problem: "f(x)=x+" + a + ", g(x)=x+" + b + ". Find (f " + op.sym + " g)(x), then evaluate at x=" + x + " and x=" + y + ".",
          solution: "(f " + op.sym + " g)(x) = (x+" + a + ") " + op.sym + " (x+" + b + ") = " + combined + "\n\nf(" + x + ") = " + fv + ",  g(" + y + ") = " + gv + "\nResult = " + fv + " " + op.sym + " " + gv + " = " + fg,
        };
      },
    ],
    check: [
      () => {
        const p = rng(2,5), q = rng(2,5);
        const ans = p * q;
        const { options, answerIndex } = mcq(`${ans}`, [p+q, ans+1, ans-1].map(String));
        return { title: "Cartesian Product Size", question: `|A| = ${p}, |B| = ${q}. How many elements in A × B?`, options, answerIndex, explanation: `n(A×B) = ${p}×${q} = ${ans}.` };
      },
      () => {
        const A = [rng(1,3), rng(4,6), rng(7,9)];
        const d = rng(1,3);
        const rel = A.map(x=>x+d).filter(y=>y<=10);
        const wrongDomain = [...A, rng(1,9)].slice(0,4);
        const { options, answerIndex } = mcq(`{${A.join(",")}}`, [`{${rel.join(",")}}`,`{${wrongDomain.join(",")}}`,`{${A.slice(0,2).join(",")}}`]);
        return { title: "Domain of Relation", question: `R = {(x,y) : y = x+${d}}, x ∈ {${A.join(",")}}. What is the domain of R?`, options, answerIndex, explanation: `Domain = set of all first elements = {${A.join(",")}}.` };
      },
      () => {
        const m=rng(2,5), n=rng(2,4);
        const ans = Math.pow(n,m);
        const { options, answerIndex } = mcq(`${ans}`, [Math.pow(2,m*n), m*n, m+n].map(String));
        return { title: "Count Functions", question: `How many functions exist from a set of ${m} elements to a set of ${n} elements?`, options, answerIndex, explanation: `Each of ${m} elements can map to any of ${n} images → ${n}^${m} = ${ans}.` };
      },
      () => {
        const a=rng(1,5),b=rng(1,5),x=rng(2,8);
        const sum=x+a+x+b;
        const ans=`${sum}`;
        const { options, answerIndex } = mt_mcq(ans,[`${sum+1}`,`${sum-1}`,`${x+a}`].map(String));
        return { title: "Algebra of Functions", question: `f(x)=x+${a}, g(x)=x+${b}. Find (f+g)(${x}).`, options, answerIndex, explanation: `(f+g)(${x})=f(${x})+g(${x})=(${x+a})+(${x+b})=${sum}.` };
      },
    ],
  },

  ch3: {
    title: "Trigonometric Functions",
    teach: [
      () => {
        const idx = rng(0, MT_DEG.length - 1);
        const dir = pick(["toRad","toDeg"]);
        if (dir === "toRad") {
          return { title: "Degree → Radian Conversion", concept: `Radians = Degrees × (π/180).  Full circle: 360° = 2π rad.`, problem: `Convert ${MT_DEG[idx]}° to radians.`, solution: `${MT_DEG[idx]}° × π/180 = ${MT_RAD[idx]} rad\n\nsin(${MT_DEG[idx]}°) = ${MT_SIN_ARR[idx]},  cos(${MT_DEG[idx]}°) = ${MT_COS_ARR[idx]}` };
        } else {
          return { title: "Radian → Degree Conversion", concept: `Degrees = Radians × (180/π).`, problem: `Convert ${MT_RAD[idx]} radians to degrees.`, solution: `${MT_RAD[idx]} × 180/π = ${MT_DEG[idx]}°\n\nsin(${MT_RAD[idx]}) = ${MT_SIN_ARR[idx]},  cos(${MT_RAD[idx]}) = ${MT_COS_ARR[idx]}` };
        }
      },
      () => {
        const idx = rng(0, 3); // use 30,45,60,90 only
        const quadrant = rng(1, 4);
        const baseAngle = [30,45,60,90][idx];
        const angle = baseAngle + (quadrant-1)*90;
        const sinSigns = [1,1,-1,-1];
        const cosSigns = [1,-1,-1,1];
        const baseSin = ["1/2","1/√2","√3/2","1"][idx];
        const baseCos = ["√3/2","1/√2","1/2","0"][idx];
        return {
          title: "Trigonometric Identity Application",
          concept: `sin²θ + cos²θ = 1.  Use this to find one ratio given another. Signs depend on quadrant.`,
          problem: `If sin θ = ${baseSin} and θ is in quadrant ${quadrant}, find cos θ.`,
          solution: `sin²θ + cos²θ = 1\ncos²θ = 1 − (${baseSin})² = 1 − ${idx===0?"1/4":idx===1?"1/2":"3/4"} = ${idx===0?"3/4":idx===1?"1/2":"1/4"}\ncos θ = ${cosSigns[quadrant-1] > 0 ? "+" : "−"}${baseCos}\n(${quadrant > 2 ? "negative" : "positive"} in Q${quadrant})`,
        };
      },
      () => {
        const idx = rng(0, 3);
        const pairs = [[30,45],[45,60],[30,60],[45,30]];
        const [A, B] = pick(pairs);
        const sinA = {30:"1/2",45:"1/√2",60:"√3/2"}[A];
        const cosA = {30:"√3/2",45:"1/√2",60:"1/2"}[A];
        const sinB = {30:"1/2",45:"1/√2",60:"√3/2"}[B];
        const cosB = {30:"√3/2",45:"1/√2",60:"1/2"}[B];
        return {
          title: "Addition Formula",
          concept: `sin(A+B) = sinA·cosB + cosA·sinB\ncos(A+B) = cosA·cosB − sinA·sinB`,
          problem: `Find the exact value of sin(${A}° + ${B}°) = sin(${A+B}°) using the addition formula.`,
          solution: `sin(${A}°+${B}°) = sin${A}°·cos${B}° + cos${A}°·sin${B}°\n= (${sinA})(${cosB}) + (${cosA})(${sinB})\n= [combine to get] sin${A+B}° = ${MT_SIN_ARR[MT_DEG.indexOf(String(A+B))]}`,
        };
      },
      () => {
        const angles = [30,45,60];
        const A = pick(angles);
        const sin2A = {30:"√3/2",45:"1",60:"√3/2"}[A];
        const cos2A = {30:"1/2",45:"0",60:"-1/2"}[A];
        return {
          title: "Double Angle Formulas",
          concept: `sin 2A = 2 sinA cosA\ncos 2A = cos²A − sin²A = 1−2sin²A = 2cos²A−1`,
          problem: `Find sin(2×${A}°) and cos(2×${A}°) using double angle formulas.`,
          solution: `sin(${2*A}°) = 2·sin${A}°·cos${A}°\n= 2 × ${({30:"1/2",45:"1/√2",60:"√3/2"})[A]} × ${({30:"√3/2",45:"1/√2",60:"1/2"})[A]}\n= ${sin2A}\n\ncos(${2*A}°) = cos²${A}°−sin²${A}°\n= (${({30:"√3/2",45:"1/√2",60:"1/2"})[A]})² − (${({30:"1/2",45:"1/√2",60:"√3/2"})[A]})²\n= ${cos2A}`,
        };
      },
      () => {
        const r = rng(3,8);
        const arcLen = rng(4,12);
        const theta = (arcLen/r).toFixed(3);
        const deg = (arcLen/r * 180/Math.PI).toFixed(2);
        return {
          title: "Arc Length & Sector Area",
          concept: `For a circle of radius r, angle θ (in radians):\n• Arc length  l = rθ\n• Sector area  A = ½r²θ\n• Perimeter of sector = 2r + l`,
          problem: `A circle has radius ${r} cm and arc length ${arcLen} cm. Find the central angle in radians and the area of the sector.`,
          solution: `θ = l/r = ${arcLen}/${r} = ${theta} rad\n≈ ${deg}°\n\nSector area = ½r²θ = ½×${r}²×${theta}\n= ½×${r*r}×${theta}\n= ${(0.5*r*r*arcLen/r).toFixed(2)} cm²`,
        };
      },
    ],
    check: [
      () => {
        const idx = rng(0, MT_DEG.length - 1);
        const { options, answerIndex } = mt_mcq(MT_RAD[idx], mt_sh(MT_RAD.filter((_,i)=>i!==idx)).slice(0,3));
        return { title: "Degree to Radian", question: `Convert ${MT_DEG[idx]}° to radians.`, options, answerIndex, explanation: `${MT_DEG[idx]}° × π/180 = ${MT_RAD[idx]}.` };
      },
      () => {
        const idx = rng(0, 3);
        const sinVals = ["1/2","1/√2","√3/2","1"];
        const cosVals = ["√3/2","1/√2","1/2","0"];
        const angles  = [30,45,60,90];
        const sinV = sinVals[idx], cosV = cosVals[idx];
        const { options, answerIndex } = mt_mcq(cosV, mt_sh(cosVals.filter((_,i)=>i!==idx)).slice(0,3));
        return { title: "Pythagorean Identity", question: `If sin θ = ${sinV} (first quadrant), find cos θ using sin²θ + cos²θ = 1.`, options, answerIndex, explanation: `cos²θ = 1−(${sinV})². cos θ = ${cosV}.` };
      },
    ],
  },

  ch4: {
    title: "Principle of Mathematical Induction",
    teach: [
      () => {
        const n = rng(5, 15);
        const sumAP = n*(n+1)/2;
        const k = rng(3, 8);
        return {
          title: "Verify Sum Formula (Base + Inductive)",
          concept: `P(n): 1+2+...+n = n(n+1)/2.\nBase: P(1): 1 = 1(2)/2 = 1 ✓\nInductive: Assume P(k), prove P(k+1).`,
          problem: `Verify P(${n}): 1+2+3+...+${n} = ${n}(${n+1})/2, and also state P(${k}) for the inductive hypothesis.`,
          solution: `LHS = ${n}(${n}+1)/2 = ${sumAP}\nRHS = Sum from 1 to ${n} = ${sumAP} ✓\n\nP(${k}) inductive hypothesis: 1+2+...+${k} = ${k*(k+1)/2}\nFor P(${k+1}): add (${k+1}) both sides → ${k*(k+1)/2}+${k+1} = ${(k+1)*(k+2)/2} = ${k+1}(${k+2})/2 ✓`,
        };
      },
      () => {
        const n = rng(4, 12);
        const sumSq = n*(n+1)*(2*n+1)/6;
        return {
          title: "Sum of Squares Formula",
          concept: `P(n): 1²+2²+...+n² = n(n+1)(2n+1)/6.\nProve by checking base case n=1 and then the inductive step.`,
          problem: `Verify the sum-of-squares formula for n = ${n}.`,
          solution: `LHS = 1²+2²+...+${n}² = ${n}(${n}+1)(${2*n+1})/6\n= ${n}×${n+1}×${2*n+1} / 6\n= ${n*(n+1)*(2*n+1)} / 6\n= ${sumSq}\n\nVerify directly: sum = ${Array.from({length:n},(_,i)=>(i+1)**2).join("+")} = ${sumSq} ✓`,
        };
      },
      () => {
        const n = rng(3, 10);
        const base = Math.pow(2, n);
        return {
          title: "Inequality Proof: 2ⁿ > n",
          concept: `P(n): 2ⁿ > n for all n ∈ ℕ.\nBase: 2¹ = 2 > 1 ✓\nInductive step: Assume 2ᵏ > k. Multiply by 2: 2^(k+1) > 2k ≥ k+1 ✓`,
          problem: `Verify P(${n}): 2^${n} > ${n}, and outline the inductive step for P(${n+1}).`,
          solution: `P(${n}): 2^${n} = ${base} > ${n} ✓\n\nInductive step:\nAssume 2^k > k.\nMultiply by 2: 2^(k+1) = 2·2^k > 2k = k+k ≥ k+1\nTherefore P(k+1) follows. ✓\n\nBy induction, 2ⁿ > n for all n ∈ ℕ.`,
        };
      },
    ],
    check: [
      () => {
        const n = rng(10, 50);
        const ans = n*(n+1)/2;
        const { options, answerIndex } = mcq(`${ans}`, mt_w3(ans, [n, n+1, 2*n]).map(String));
        return { title: "AP Sum Formula", question: `Using 1+2+...+n = n(n+1)/2, find the sum 1+2+...+${n}.`, options, answerIndex, explanation: `${n}×${n+1}/2 = ${ans}.` };
      },
      () => {
        const n = rng(3, 8);
        const ans = n*(n+1)*(2*n+1)/6;
        const { options, answerIndex } = mcq(`${ans}`, mt_w3(ans, [n, n*n, n*(n+1)/2]).map(String));
        return { title: "Sum of Squares", question: `Find 1²+2²+...+${n}² using the formula n(n+1)(2n+1)/6.`, options, answerIndex, explanation: `${n}×${n+1}×${2*n+1}/6 = ${ans}.` };
      },
    ],
  },

  ch5: {
    title: "Complex Numbers & Quadratic Equations",
    teach: [
      () => {
        const a1=rng(1,6),b1=rng(1,6),a2=rng(1,6),b2=rng(1,6);
        const s1=pick([1,-1]),s2=pick([1,-1]);
        const realProd = a1*a2 - s1*b1*s2*b2;
        const imagProd = a1*(s2*b2) + (s1*b1)*a2;
        return {
          title: "Multiplication of Complex Numbers",
          concept: `(a+bi)(c+di) = (ac−bd) + (ad+bc)i,  using i² = −1.`,
          problem: `Multiply z₁ = ${a1}${s1>0?"+":"-"}${b1}i  and  z₂ = ${a2}${s2>0?"+":"-"}${b2}i.`,
          solution: `(${a1}${s1>0?"+":"-"}${b1}i)(${a2}${s2>0?"+":"-"}${b2}i)\n= ${a1}×${a2} + ${a1}×(${s2>0?"+":"-"}${b2}i) + (${s1>0?"+":"-"}${b1}i)×${a2} + (${s1>0?"+":"-"}${b1}i)(${s2>0?"+":"-"}${b2}i)\n= ${a1*a2} ${s2*a1*b2>=0?"+":""}${s2*a1*b2}i ${s1*a2*b1>=0?"+":""}${s1*a2*b1}i ${s1*s2*b1*b2>=0?"+":""}${s1*s2*b1*b2}i²\n= (${realProd}) + (${imagProd})i`,
        };
      },
      () => {
        const a=rng(1,8),b=rng(1,8);
        const mod = Math.sqrt(a*a+b*b);
        const modStr = Number.isInteger(mod) ? `${mod}` : `√${a*a+b*b}`;
        return {
          title: "Modulus & Conjugate",
          concept: `For z = a+bi:\n• Conjugate z̄ = a−bi\n• Modulus |z| = √(a²+b²)\n• z·z̄ = |z|² = a²+b²`,
          problem: `Find the modulus and conjugate of z = ${a}+${b}i.`,
          solution: `Conjugate: z̄ = ${a}−${b}i\nModulus: |z| = √(${a}²+${b}²) = √${a*a+b*b} = ${modStr}\n|z|² = z·z̄ = (${a}+${b}i)(${a}−${b}i) = ${a*a}+${b*b} = ${a*a+b*b}`,
        };
      },
      () => {
        const a=1, b=rng(1,4), c=rng(1,4)*rng(1,3);
        const D = b*b - 4*a*c;
        if (D < 0) {
          const realPart = -b; const imagSq = -D;
          return {
            title: "Quadratic with Complex Roots",
            concept: `When discriminant D = b²−4ac < 0, roots are complex: x = (−b ± i√(−D)) / 2a.`,
            problem: `Solve: x² + ${b}x + ${c} = 0.`,
            solution: `D = ${b}² − 4(1)(${c}) = ${b*b} − ${4*c} = ${D} < 0\n\nRoots = (−${b} ± i√${-D}) / 2\n     = (${realPart} ± i√${-D}) / 2\n     = ${realPart/2} ± (√${-D}/2)i`,
          };
        } else {
          const r1 = (-b + Math.sqrt(D))/2, r2 = (-b - Math.sqrt(D))/2;
          return {
            title: "Quadratic with Real Roots",
            concept: `D = b²−4ac. D > 0: two real roots. D = 0: one repeated root. D < 0: two complex roots.`,
            problem: `Solve: x² + ${b}x + ${c} = 0.`,
            solution: `D = ${D} > 0 (real roots)\nx = (−${b} ± √${D}) / 2\n  = (${-b} ± ${Math.sqrt(D).toFixed(2)}) / 2\nx₁ = ${r1.toFixed(2)},  x₂ = ${r2.toFixed(2)}`,
          };
        }
      },
    ],
    check: [
      () => {
        const a=rng(1,8),b=rng(1,8);
        const ans = Math.sqrt(a*a+b*b);
        const ansStr = Number.isInteger(ans)?`${ans}`:`√${a*a+b*b}`;
        const { options, answerIndex } = mt_mcq(ansStr, [`${a+b}`,`${a*b}`,`√${a*a+b*b+1}`]);
        return { title: "Modulus", question: `|z| for z = ${a}+${b}i?`, options, answerIndex, explanation: `|z| = √(${a}²+${b}²) = √${a*a+b*b} = ${ansStr}.` };
      },
      () => {
        const a=rng(1,5),b=rng(1,5),c=rng(1,5),d=rng(1,5);
        const real=a*c-b*d, imag=a*d+b*c;
        const ans=`${real}+${imag}i`;
        const { options, answerIndex } = mt_mcq(ans, [`${a+c}+${b+d}i`,`${real-1}+${imag+1}i`,`${a*c}+${b*d}i`]);
        return { title: "Complex Multiplication", question: `(${a}+${b}i)(${c}+${d}i) = ?`, options, answerIndex, explanation: `Real part: ${a}×${c}−${b}×${d}=${real}. Imaginary part: ${a}×${d}+${b}×${c}=${imag}.` };
      },
    ],
  },

  ch6: {
    title: "Linear Inequalities",
    teach: [
      () => {
        const a=rng(2,8), b=rng(1,10), c=rng(5,20);
        const neg = pick([true,false]);
        const coeff = neg ? -a : a;
        const rhs = c;
        const sol = neg ? `x ≤ ${(rhs-b)/coeff}` : `x ≤ ${(rhs-b)/coeff}`;
        const ans = (rhs - b) / coeff;
        const sign = neg ? "\u2265" : "\u2264";
        const interval = neg ? ans.toFixed(2) + ", +\u221E" : "-\u221E, " + ans.toFixed(2);
        const flipNote = neg ? " (sign flipped \u2014 divided by negative)" : "";
        return {
          title: "Solving a Linear Inequality",
          concept: "Treat like an equation EXCEPT: multiplying/dividing by a NEGATIVE number REVERSES the inequality sign.",
          problem: "Solve: " + coeff + "x + " + b + " \u2264 " + rhs,
          solution: coeff + "x \u2264 " + (rhs-b) + "\nx " + sign + " " + ans.toFixed(2) + flipNote + "\n\nSolution set: (" + interval + ")",
        };
      },
      () => {
        const a=rng(2,5),b=rng(1,8),c=rng(10,25);
        const ans = (c-b)/a;
        return {
          title: "Inequality in One Variable — Number Line",
          concept: `For ax+b > c (a>0): x > (c−b)/a. Use open circle ○ for strict, filled ● for ≤ or ≥.`,
          problem: `Solve and represent on number line: ${a}x + ${b} > ${c}`,
          solution: `${a}x > ${c-b}\nx > ${ans}\n\nSolution set: (${ans}, +∞)\nOn number line: ○—→  (open circle at ${ans}, shaded right)`,
        };
      },
      () => {
        const a=rng(1,4),b=rng(1,4);
        return {
          title: "System of Two Inequalities",
          concept: `Solve each separately, then take intersection (the overlapping region).`,
          problem: `Solve: ${a}x − ${b} < ${a*3} AND x + ${b} > ${b-1}`,
          solution: `Inequality 1: ${a}x < ${a*3+b}  →  x < ${3+b/a}\nInequality 2: x > ${b-1-b} = ${-1}\n\nIntersection: ${-1} < x < ${3+b/a}\nSolution set: (${-1}, ${3+b/a})`,
        };
      },
    ],
    check: [
      () => {
        const a=rng(2,6),b=rng(2,8),c=rng(10,20);
        const ans = (c+b)/a;
        const ansStr = Number.isInteger(ans)?`x ≤ ${ans}`:`x ≤ ${ans.toFixed(1)}`;
        const { options, answerIndex } = mt_mcq(ansStr, [`x ≥ ${ans.toFixed(1)}`,`x < ${ans.toFixed(1)}`,`x ≤ ${(ans+1).toFixed(1)}`]);
        return { title: "Solve Inequality", question: `Solve: ${a}x − ${b} ≤ ${c}`, options, answerIndex, explanation: `${a}x ≤ ${c+b}  →  x ≤ ${ans.toFixed(1)}.` };
      },
      () => {
        const a=rng(2,5),b=rng(1,6);
        const ans = (b)/a;
        const ansStr = `x ≥ ${ans.toFixed(2)}`;
        const { options, answerIndex } = mt_mcq(ansStr, [`x ≤ ${ans.toFixed(2)}`,`x ≥ ${(ans+1).toFixed(2)}`,`x ≥ ${(ans-0.5).toFixed(2)}`]);
        return { title: "Negative Coefficient", question: `Solve: −${a}x + ${b} ≤ 0`, options, answerIndex, explanation: `−${a}x ≤ −${b}  →  x ≥ ${b}/${a} = ${ans.toFixed(2)} (sign flips).` };
      },
    ],
  },

  ch7: {
    title: "Permutations & Combinations",
    teach: [
      () => {
        const n=rng(5,9), r=rng(2,4);
        const ans = nPr(n,r);
        const stepsArr = [];
        for(let i=n;i>n-r;i--) stepsArr.push(i);
        return {
          title: "Permutations P(n,r)",
          concept: `P(n,r) = n!/(n−r)! = n×(n−1)×...×(n−r+1). Ordered arrangement of r from n distinct objects.`,
          problem: `Find P(${n}, ${r}) — the number of ways to arrange ${r} objects chosen from ${n} distinct objects.`,
          solution: `P(${n},${r}) = ${n}!/${n-r}!\n= ${stepsArr.join(" × ")}\n= ${ans}`,
        };
      },
      () => {
        const n=rng(6,12), r=rng(2,5);
        const ans = nCr(n,r);
        return {
          title: "Combinations C(n,r)",
          concept: `C(n,r) = n! / (r!(n−r)!). Selection of r from n — ORDER DOES NOT MATTER.`,
          problem: `In how many ways can a committee of ${r} be chosen from a group of ${n} people?`,
          solution: `C(${n},${r}) = ${n}! / (${r}! × ${n-r}!)\n= ${Array.from({length:r},(_,i)=>n-i).join("×")} / ${Array.from({length:r},(_,i)=>r-i).join("×")}\n= ${ans} ways`,
        };
      },
      () => {
        const word = pick(["MATHS","INDIA","DELTA","PLANE","CURVE","PRIME"]);
        const n = word.length;
        const freq = {};
        for(const c of word) freq[c] = (freq[c]||0)+1;
        const denom = Object.values(freq).map(f=>f>1? f+"!" : "").filter(Boolean).join("\u00D7") || "1";
        const total = fact(n) / Object.values(freq).reduce((acc,f)=>acc*fact(f),1);
        const repeatInfo = Object.entries(freq).filter(([,v])=>v>1).map(([k,v])=>"'"+k+"' repeats "+v+" times").join(", ") || "All letters distinct";
        const denomProd = Object.values(freq).reduce((a,f)=>a*fact(f),1);
        return {
          title: "Arrangements of Letters in a Word",
          concept: "If a word has n letters with some repeated (freq f\u2081,f\u2082,...), arrangements = n! / (f\u2081!\u00D7f\u2082!\u00D7...).",
          problem: "How many distinct arrangements are possible using all letters of '" + word + "'?",
          solution: "Letters: " + word.split("").join(", ") + "\nLength: n = " + n + "\n" + repeatInfo + "\n\nArrangements = " + n + "! / " + denom + " = " + fact(n) + " / " + denomProd + " = " + total,
        };
      },
      () => {
        const n=rng(5,10), boys=rng(3,5);
        const girls=n-boys;
        const mixWays=fact(n);
        const altWays=fact(boys)*fact(girls)*2;
        return {
          title: "Circular & Constrained Arrangements",
          concept: `Circular arrangements of n objects = (n−1)!\nWhen boys & girls alternate (equal numbers): 2·(k!)² ways.`,
          problem: `${boys} boys and ${girls} girls sit in a row. How many ways if (i) no restriction, (ii) all boys together?`,
          solution: `(i) No restriction: ${n}! = ${fact(n)} ways\n\n(ii) All boys together:\nTreat ${boys} boys as 1 block → ${girls+1} units\nArrange ${girls+1} units: (${girls+1})! = ${fact(girls+1)} ways\nArrange boys within block: ${boys}! = ${fact(boys)} ways\nTotal = ${fact(girls+1)} × ${fact(boys)} = ${fact(girls+1)*fact(boys)}`,
        };
      },
      () => {
        const n=rng(8,15), r=rng(3,6);
        const crn=nCr(n,r), crn1=nCr(n,r-1);
        const sum=crn+crn1;
        return {
          title: "Pascal's Identity: C(n,r) + C(n,r-1) = C(n+1,r)",
          concept: `Pascal's Rule: nCr(n,r) + nCr(n,r−1) = nCr(n+1,r)\nThis explains how Pascal's triangle is built — each entry is the sum of the two above it.`,
          problem: `Verify Pascal's Identity: C(${n},${r}) + C(${n},${r-1}) = C(${n+1},${r}).`,
          solution: `C(${n},${r}) = ${crn}\nC(${n},${r-1}) = ${crn1}\nSum = ${crn} + ${crn1} = ${sum}\n\nC(${n+1},${r}) = ${nCr(n+1,r)}\n\n${sum} = ${nCr(n+1,r)} ✓  (Pascal's Identity verified)`,
        };
      },
    ],
    check: [
      () => {
        const n=rng(5,8),r=rng(2,3);
        const ans = nPr(n,r);
        const { options, answerIndex } = mcq(`${ans}`, mt_w3(ans,[nCr(n,r),nPr(n,r-1),nPr(n-1,r)]).map(String));
        return { title: "P(n,r) Value", question: `Calculate P(${n}, ${r}).`, options, answerIndex, explanation: `P(${n},${r}) = ${Array.from({length:r},(_,i)=>n-i).join("×")} = ${ans}.` };
      },
      () => {
        const n=rng(7,12),r=rng(2,4);
        const ans = nCr(n,r);
        const { options, answerIndex } = mcq(`${ans}`, mt_w3(ans,[nCr(n,r-1),nCr(n-1,r),nPr(n,r)]).map(String));
        return { title: "nCr(n,r) Value", question: `A team of ${r} is chosen from ${n} people. How many ways? (C(${n},${r}) = ?)`, options, answerIndex, explanation: `C(${n},${r}) = ${n}!/(${r}!×${n-r}!) = ${ans}.` };
      },
    ],
  },

  ch8: {
    title: "Binomial Theorem",
    teach: [
      () => {
        const n = rng(3,5);
        const a = pick([1,1,2,2,1]);
        const b = rng(1,3);
        const terms = Array.from({length:n+1},(_,r)=>{
          const coeff = nCr(n,r) * Math.pow(a,n-r) * Math.pow(b,r);
          const xpow = n-r;
          const ypow = r;
          const xpart = xpow === 0 ? "" : xpow === 1 ? "x" : "x^" + xpow;
          const ypart = ypow === 0 ? "" : ypow === 1 ? "y" : "y^" + ypow;
          return coeff + xpart + ypart;
        });
        return {
          title: "Expanding via Binomial Theorem",
          concept: `(a+b)ⁿ = Σ nCr(n,r)·aⁿ⁻ʳ·bʳ for r=0 to n.\nTotal terms = n+1.`,
          problem: `Expand (${a>1?a:""}x + ${b})^${n}.`,
          solution: `${terms.join(" + ")}\n\n(n+1 = ${n+1} terms total)`,
        };
      },
      () => {
        const n=rng(6,10), t=rng(2,n);
        const r=t-1;
        const coeff = nCr(n,r);
        return {
          title: "General Term T(r+1)",
          concept: `T(r+1) = nCr(n,r) · aⁿ⁻ʳ · bʳ.  To find the ${t}th term, use r = ${t-1}.`,
          problem: `Find the ${t}th term in the expansion of (x + y)^${n}.`,
          solution: `T(${t}) = T(${r}+1) = C(${n},${r}) · x^${n-r} · y^${r}\n= ${coeff} · x^${n-r} · y^${r}\n= ${coeff}x^${n-r}y^${r}`,
        };
      },
      () => {
        const n=rng(4,8);
        const mid = n%2===0 ? [n/2+1] : [(n+1)/2,(n+3)/2];
        const parity = n%2===0 ? "even, ONE middle term" : "odd, TWO middle terms";
        const midLines = mid.map(m => "T("+m+") = C("+n+","+(m-1)+")\u00B7x^"+(n-m+1)+"\u00B7y^"+(m-1)+" = "+nCr(n,m-1)+"x^"+(n-m+1)+"y^"+(m-1)).join("\n");
        return {
          title: "Middle Term of Binomial Expansion",
          concept: "In (a+b)\u207F:\n\u2022 n even \u2192 1 middle term: T(n/2+1)\n\u2022 n odd \u2192 2 middle terms: T((n+1)/2) and T((n+3)/2)",
          problem: "Find the middle term(s) of (x+y)^" + n + ".",
          solution: "n = " + n + " \u2192 " + parity + "\nMiddle term(s): T(" + mid.join(") and T(") + ")\n" + midLines,
        };
      },
    ],
    check: [
      () => {
        const n=rng(5,12);
        const ans = n+1;
        const { options, answerIndex } = mcq(`${ans}`, [n, n+2, 2*n].map(String));
        return { title: "Number of Terms", question: `How many terms does (a+b)^${n} have when expanded?`, options, answerIndex, explanation: `Number of terms = n+1 = ${n}+1 = ${ans}.` };
      },
      () => {
        const n=rng(6,10), r=rng(1,4);
        const ans = nCr(n,r);
        const { options, answerIndex } = mcq(`${ans}`, mt_w3(ans,[nCr(n,r-1),nCr(n,r+1),nCr(n-1,r)]).map(String));
        return { title: "Coefficient in Expansion", question: `What is the coefficient of x^${n-r}·y^${r} in (x+y)^${n}?`, options, answerIndex, explanation: `T(${r+1}) has coefficient C(${n},${r}) = ${ans}.` };
      },
    ],
  },

  ch9: {
    title: "Sequences & Series",
    teach: [
      () => {
        const a=rng(2,15), d=pick([-3,-2,-1,1,2,3,4,5]), n=rng(10,25);
        const an = a + (n-1)*d;
        const Sn = n*(2*a+(n-1)*d)/2;
        return {
          title: "Arithmetic Progression — nth Term & Sum",
          concept: `aₙ = a + (n−1)d.   Sₙ = n/2 · [2a + (n−1)d] = n/2 · (a₁ + aₙ).`,
          problem: `AP: ${a}, ${a+d}, ${a+2*d}, ... Find the ${n}th term and the sum of ${n} terms.`,
          solution: `a = ${a},  d = ${d}\na_${n} = ${a} + (${n}−1)(${d}) = ${a} + ${(n-1)*d} = ${an}\n\nS_${n} = ${n}/2 × [2(${a}) + (${n}−1)(${d})]\n= ${n}/2 × [${2*a} + ${(n-1)*d}]\n= ${n}/2 × ${2*a+(n-1)*d}\n= ${Sn}`,
        };
      },
      () => {
        const a=rng(2,6), r_ratio=pick([2,3,-2,1/2]), n=rng(5,8);
        const rStr = r_ratio===0.5?"1/2":`${r_ratio}`;
        const an = a * Math.pow(r_ratio,n-1);
        const Sn = r_ratio===1 ? a*n : a*(Math.pow(r_ratio,n)-1)/(r_ratio-1);
        return {
          title: "Geometric Progression — nth Term & Sum",
          concept: `aₙ = a·rⁿ⁻¹.   Sₙ = a(rⁿ−1)/(r−1) for r≠1.`,
          problem: `GP: ${a}, ${a*r_ratio}, ${a*r_ratio*r_ratio}, ... Find the ${n}th term and sum of ${n} terms.`,
          solution: `a = ${a},  r = ${rStr}\na_${n} = ${a} × (${rStr})^${n-1} = ${an}\n\nS_${n} = ${a}×((${rStr})^${n}−1)/(${rStr}−1) = ${Sn.toFixed(2)}`,
        };
      },
      () => {
        const a=rng(2,10), b=rng(11,20);
        const AM = (a+b)/2;
        const GM = Math.sqrt(a*b);
        return {
          title: "AM–GM Inequality",
          concept: `For positive reals a,b:\nAM = (a+b)/2,   GM = √(ab)\nAM ≥ GM, with equality iff a = b.`,
          problem: `Find AM and GM of ${a} and ${b}. Verify AM ≥ GM.`,
          solution: `AM = (${a}+${b})/2 = ${AM}\nGM = √(${a}×${b}) = √${a*b} ≈ ${GM.toFixed(3)}\n\n${AM} ≥ ${GM.toFixed(3)}  ✓  (AM ≥ GM confirmed)`,
        };
      },
      () => {
        const a=rng(2,8),d=rng(1,5),n=rng(6,15);
        const last=a+(n-1)*d;
        const Sn=n*(a+last)/2;
        const APterms=Array.from({length:Math.min(n,5)},(_,i)=>a+i*d);
        return {
          title: "Sum of AP using First & Last Term",
          concept: `Sₙ = n/2 × (first + last)\nThis form is useful when you know both endpoints.`,
          problem: `Find the sum of the AP: ${APterms.join(", ")}, ... up to ${n} terms.`,
          solution: `a=${a}, d=${d}, n=${n}\nLast term aₙ = ${a}+(${n}-1)(${d}) = ${last}\n\nSₙ = ${n}/2 × (${a}+${last})\n= ${n}/2 × ${a+last}\n= ${Sn}`,
        };
      },
      () => {
        // Infinite GP sum
        const a=rng(1,5), rFrac=pick([{n:1,d:2},{n:1,d:3},{n:2,d:3},{n:1,d:4}]);
        const rStr=`${rFrac.n}/${rFrac.d}`;
        const S=a/(1-rFrac.n/rFrac.d);
        return {
          title: "Sum of Infinite Geometric Progression",
          concept: `For |r|<1, S∞ = a/(1−r).\nThe series converges to a finite value when the ratio is between −1 and 1.`,
          problem: `Find the sum of the infinite GP: ${a}, ${a}×${rStr}, ${a}×(${rStr})², ...`,
          solution: `a = ${a},  r = ${rStr}  (|r|<1 ✓)\n\nS∞ = a/(1−r) = ${a} / (1 − ${rStr})\n= ${a} / (${rFrac.d-rFrac.n}/${rFrac.d})\n= ${a} × ${rFrac.d}/${rFrac.d-rFrac.n}\n= ${S.toFixed(4)}`,
        };
      },
    ],
    check: [
      () => {
        const a=rng(3,10),d=rng(2,6),n=rng(8,20);
        const ans = a+(n-1)*d;
        const { options, answerIndex } = mcq(`${ans}`, mt_w3(ans,[a+n*d, a+(n-2)*d, a+n*d+d]).map(String));
        return { title: "AP nth Term", question: `In AP: first term=${a}, d=${d}. Find the ${n}th term.`, options, answerIndex, explanation: `a_${n} = ${a}+(${n}-1)(${d}) = ${ans}.` };
      },
      () => {
        const a=rng(1,4),rat=rng(2,4),n=rng(4,7);
        const ans = Math.round(a*(Math.pow(rat,n)-1)/(rat-1));
        const { options, answerIndex } = mcq(`${ans}`, mt_w3(ans,[ans-1,ans+1,a*(n+1)]).map(String));
        return { title: "GP Sum", question: `GP: first term=${a}, r=${rat}. Find sum of ${n} terms.`, options, answerIndex, explanation: `S_${n} = ${a}(${rat}^${n}−1)/(${rat}−1) = ${ans}.` };
      },
    ],
  },

  ch10: {
    title: "Straight Lines",
    teach: [
      () => {
        const x1=ri(-5,3),y1=ri(-5,3),x2=rng(4,9),y2=ri(-5,9);
        const dy=y2-y1, dx=x2-x1;
        const g=gcd(Math.Math.abs(dy),Math.Math.abs(dx));
        const mStr = `${dy/g}/${dx/g}`;
        const angle = Math.atan2(dy,dx)*180/Math.PI;
        return {
          title: "Slope of a Line",
          concept: `m = (y₂−y₁)/(x₂−x₁) = tanθ, where θ is angle with positive x-axis.\nParallel lines: m₁=m₂.  Perpendicular: m₁·m₂=−1.`,
          problem: `Find the slope of the line through A(${x1},${y1}) and B(${x2},${y2}).`,
          solution: `m = (${y2}−${y1}) / (${x2}−${x1})\n= ${dy} / ${dx}\n= ${mStr}\n\nAngle with x-axis θ = arctan(${dy}/${dx}) ≈ ${angle.toFixed(1)}°`,
        };
      },
      () => {
        const x1=ri(-3,3),y1=ri(-3,3);
        const m=pick([-3,-2,-1,1,2,3]);
        const c=y1-m*x1;
        const cStr=c>=0?`+${c}`:String(c);
        return {
          title: "Equation of a Line",
          concept: `Point-slope: y−y₁ = m(x−x₁).\nSlope-intercept: y = mx + c.\nGeneral form: ax + by + c = 0.`,
          problem: `Find the equation of the line through (${x1},${y1}) with slope ${m}.`,
          solution: `y − ${y1} = ${m}(x − ${x1})\ny − ${y1} = ${m}x − ${m*x1}\ny = ${m}x ${cStr}\n\nGeneral form: ${-m}x + y ${-c>=0?"+"+(-c):String(-c)} = 0`,
        };
      },
      () => {
        const A=rng(1,5),B=rng(1,5),C=ri(-10,10);
        const x0=ri(-4,4),y0=ri(-4,4);
        const num=Math.Math.abs(A*x0+B*y0+C);
        const den=Math.sqrt(A*A+B*B);
        const dist=(num/den).toFixed(3);
        return {
          title: "Distance from a Point to a Line",
          concept: `Distance from (x₀,y₀) to line Ax+By+C=0:\nd = |Ax₀ + By₀ + C| / √(A²+B²)`,
          problem: `Find distance from (${x0},${y0}) to the line ${A}x+${B}y+${C}=0.`,
          solution: `d = |${A}(${x0})+${B}(${y0})+(${C})| / √(${A}²+${B}²)\n= |${A*x0+B*y0+C}| / √${A*A+B*B}\n= ${num} / ${den.toFixed(3)}\n= ${dist}`,
        };
      },
    ],
    check: [
      () => {
        const x1=ri(-3,2),y1=ri(-3,2),x2=rng(3,7),y2=rng(3,8);
        const dy=y2-y1,dx=x2-x1;
        const g=gcd(Math.abs(dy),Math.abs(dx));
        const ans=`${dy/g}/${dx/g}`;
        const { options, answerIndex } = mt_mcq(ans,[`${dx/g}/${dy/g}`,`${(dy+1)/g}/${dx/g}`,`${-dy/g}/${dx/g}`]);
        return { title: "Slope Calculation", question: `Slope of line through (${x1},${y1}) and (${x2},${y2})?`, options, answerIndex, explanation: `m=(${y2}−${y1})/(${x2}−${x1})=${dy}/${dx}=${ans}.` };
      },
      () => {
        const A=rng(3,6),B=rng(4,8),C=ri(-8,8);
        const num=Math.abs(C),den=Math.sqrt(A*A+B*B);
        const ans=(num/den).toFixed(2);
        const { options, answerIndex } = mt_mcq(ans,[((num+1)/den).toFixed(2),((num-1)/den).toFixed(2),(num/den+1).toFixed(2)]);
        return { title: "Distance from Origin", question: `Distance from (0,0) to line ${A}x+${B}y+${C}=0?`, options, answerIndex, explanation: `d=|${C}|/√(${A}²+${B}²)=${num}/${den.toFixed(2)}≈${ans}.` };
      },
    ],
  },

  ch11: {
    title: "Conic Sections",
    teach: [
      () => {
        const a=rng(2,8), type=pick(["right","left","up","down"]);
        const fourA=4*a;
        let eq,focus,dir;
        if(type==="right"){eq=`y²=${fourA}x`,focus=`(${a},0)`,dir=`x=−${a}`}
        else if(type==="left"){eq=`y²=−${fourA}x`,focus=`(−${a},0)`,dir=`x=${a}`}
        else if(type==="up"){eq=`x²=${fourA}y`,focus=`(0,${a})`,dir=`y=−${a}`}
        else{eq=`x²=−${fourA}y`,focus=`(0,−${a})`,dir=`y=${a}`}
        return {
          title: "Parabola — Focus & Directrix",
          concept: `Standard parabolas (vertex at origin):\ny²=4ax → opens right, focus (a,0)\ny²=−4ax → opens left, focus (−a,0)\nx²=4ay → opens up, focus (0,a)\nx²=−4ay → opens down, focus (0,−a)`,
          problem: `For the parabola ${eq}, find the focus and directrix.`,
          solution: `4a = ${fourA}  →  a = ${a}\nFocus: ${focus}\nDirectrix: ${dir}\n\nThe parabola opens ${type}.`,
        };
      },
      () => {
        const a2=rng(16,36),b2=rng(4,a2-4);
        const c2=a2-b2;
        const c=Math.sqrt(c2);
        const cStr=Number.isInteger(c)?String(c):`√${c2}`;
        const a=Math.sqrt(a2);
        const e=(c/a).toFixed(3);
        return {
          title: "Ellipse — Foci & Eccentricity",
          concept: `Ellipse: x²/a²+y²/b²=1 (a>b>0).\nc²=a²−b². Foci at (±c,0). Eccentricity e=c/a, 0<e<1.`,
          problem: `Find the foci and eccentricity of x²/${a2}+y²/${b2}=1.`,
          solution: `a²=${a2}, b²=${b2}\nc²=a²−b²=${a2}−${b2}=${c2}\nc=${cStr}\n\nFoci: (${cStr},0) and (−${cStr},0)\nEccentricity e = ${cStr}/${a===Math.round(a)?a:a.toFixed(2)} ≈ ${e}`,
        };
      },
      () => {
        const h=ri(-3,3),k=ri(-3,3),r=rng(2,7);
        return {
          title: "Equation of a Circle",
          concept: `Circle with centre (h,k) and radius r:\n(x−h)²+(y−k)²=r²`,
          problem: `Find the equation of the circle with centre (${h},${k}) and radius ${r}.`,
          solution: `(x−${h})²+(y−(${k}))²=${r}²\n(x−${h})²+(y−${k})²=${r*r}\n\nExpanded: x²+y²${-2*h>=0?"+"+(-2*h):String(-2*h)}x${-2*k>=0?"+"+(-2*k):String(-2*k)}y+${h*h+k*k-r*r}=0`,
        };
      },
    ],
    check: [
      () => {
        const a=rng(2,7);
        const opts=[`Opens right, focus (${a},0)`,`Opens left, focus (−${a},0)`,`Opens up, focus (0,${a})`,`Opens down, focus (0,−${a})`];
        const correct=opts[0];
        const { options, answerIndex } = mt_mcq(correct,mt_sh(opts.slice(1)));
        return { title: "Parabola y²=4ax", question: `For parabola y²=${4*a}x, which statement is correct?`, options, answerIndex, explanation: `y²=4ax opens right with focus (a,0)=(${a},0).` };
      },
      () => {
        const a2=rng(16,49),b2=rng(4,a2-4);
        const a=Math.sqrt(a2);
        const ans=Number.isInteger(a)?`${2*a}`:`2√${a2}`;
        const { options, answerIndex } = mt_mcq(ans,[`${2*Math.sqrt(b2).toFixed(0)}`,`${a2}`,`${a.toFixed(0)}`]);
        return { title: "Major Axis Length", question: `Length of the major axis of x²/${a2}+y²/${b2}=1?`, options, answerIndex, explanation: `a=√${a2}. Major axis length = 2a = ${ans}.` };
      },
    ],
  },

  ch12: {
    title: "Introduction to Three Dimensional Geometry",
    teach: [
      () => {
        const x1=ri(-5,5),y1=ri(-5,5),z1=ri(-5,5);
        const x2=ri(-5,5),y2=ri(-5,5),z2=ri(-5,5);
        const dx=x2-x1,dy=y2-y1,dz=z2-z1;
        const d2=dx*dx+dy*dy+dz*dz;
        const d=Math.sqrt(d2);
        const dStr=Number.isInteger(d)?`${d}`:`√${d2}`;
        return {
          title: "Distance Formula in 3D",
          concept: `d = √[(x₂−x₁)²+(y₂−y₁)²+(z₂−z₁)²]\nExtension of 2D distance formula with a third coordinate.`,
          problem: `Find the distance between A(${x1},${y1},${z1}) and B(${x2},${y2},${z2}).`,
          solution: `d = √[(${x2}−${x1})²+(${y2}−${y1})²+(${z2}−${z1})²]\n= √[${dx}²+${dy}²+${dz}²]\n= √[${dx*dx}+${dy*dy}+${dz*dz}]\n= √${d2} = ${dStr}`,
        };
      },
      () => {
        const x1=ri(-4,4),y1=ri(-4,4),z1=ri(-4,4);
        const x2=ri(-4,4),y2=ri(-4,4),z2=ri(-4,4);
        const mx=(x1+x2)/2,my=(y1+y2)/2,mz=(z1+z2)/2;
        return {
          title: "Midpoint & Section Formula",
          concept: `Midpoint of P(x₁,y₁,z₁) and Q(x₂,y₂,z₂):\nM = ((x₁+x₂)/2, (y₁+y₂)/2, (z₁+z₂)/2)`,
          problem: `Find the midpoint of segment joining P(${x1},${y1},${z1}) and Q(${x2},${y2},${z2}).`,
          solution: `M = ((${x1}+${x2})/2, (${y1}+${y2})/2, (${z1}+${z2})/2)\n= (${mx}, ${my}, ${mz})`,
        };
      },
    ],
    check: [
      () => {
        const x=rng(1,6),y=rng(1,6),z=rng(1,6);
        const d2=x*x+y*y+z*z;
        const d=Math.sqrt(d2);
        const ans=Number.isInteger(d)?`${d}`:`√${d2}`;
        const { options, answerIndex } = mt_mcq(ans,[`${x+y+z}`,`√${d2+1}`,`√${d2-1}`]);
        return { title: "Distance from Origin", question: `Distance from (0,0,0) to point (${x},${y},${z})?`, options, answerIndex, explanation: `d=√(${x}²+${y}²+${z}²)=√${d2}=${ans}.` };
      },
      () => {
        const x1=ri(-4,2),y1=ri(-4,2),z1=ri(-4,2);
        const x2=rng(3,8),y2=rng(3,8),z2=rng(3,8);
        const ans=`(${(x1+x2)/2}, ${(y1+y2)/2}, ${(z1+z2)/2})`;
        const { options, answerIndex } = mt_mcq(ans,[`(${x1+x2}, ${y1+y2}, ${z1+z2})`,`(${x2-x1}, ${y2-y1}, ${z2-z1})`,`(${(x1+x2)/2+1}, ${(y1+y2)/2}, ${(z1+z2)/2})`]);
        return { title: "Midpoint", question: `Midpoint of (${x1},${y1},${z1}) and (${x2},${y2},${z2})?`, options, answerIndex, explanation: `M=((${x1}+${x2})/2,(${y1}+${y2})/2,(${z1}+${z2})/2)=${ans}.` };
      },
    ],
  },

  ch13: {
    title: "Limits & Derivatives",
    teach: [
      () => {
        const a=rng(2,7);
        const n=rng(2,4);
        const val=Math.pow(a,n);
        return {
          title: "Limit by Direct Substitution & Factoring",
          concept: `If direct substitution gives 0/0, factor the numerator and cancel.\nlim(x→a) (xⁿ−aⁿ)/(x−a) = n·aⁿ⁻¹`,
          problem: `Evaluate: lim(x→${a}) (x²−${a*a}) / (x−${a})`,
          solution: `Direct sub: (${a}²−${a*a})/(${a}−${a}) = 0/0 (indeterminate)\nFactor: (x²−${a*a}) = (x+${a})(x−${a})\nlim = (x+${a}) as x→${a} = ${a}+${a} = ${2*a}\n\nAlternative: d/dx(x²) at x=${a} = 2×${a} = ${2*a} ✓`,
        };
      },
      () => {
        const k=rng(2,6);
        return {
          title: "Standard Trigonometric Limit",
          concept: `lim(x→0) sin(x)/x = 1  [x in radians]\nlim(x→0) sin(kx)/x = k (multiply numerator and denominator by k)`,
          problem: `Evaluate: lim(x→0) sin(${k}x) / x`,
          solution: `Rewrite: sin(${k}x)/x = ${k} · sin(${k}x)/(${k}x)\n\nAs x→0, ${k}x→0, so sin(${k}x)/(${k}x) → 1\n\nTherefore: lim = ${k} × 1 = ${k}`,
        };
      },
      () => {
        const coeffs = [rng(1,5),rng(1,4),rng(1,6),rng(0,5)];
        const [a,b,c,d] = coeffs;
        return {
          title: "Derivative by Power Rule",
          concept: `d/dx(xⁿ) = n·xⁿ⁻¹\nd/dx(sin x) = cos x,  d/dx(cos x) = −sin x\nDerivative is linear: d/dx[af+bg] = af'+bg'`,
          problem: `Find f'(x) if f(x) = ${a}x³ + ${b}x² + ${c}x + ${d}.`,
          solution: `f'(x) = ${a}·3x² + ${b}·2x + ${c}·1 + 0\n= ${3*a}x² + ${2*b}x + ${c}`,
        };
      },
      () => {
        const a=rng(1,5),b=rng(1,5),x0=rng(1,4);
        const fVal=a*x0+b, gVal=x0*x0+a;
        const fPrime=a, gPrime=2*x0;
        const prodPrime=fPrime*gVal+fVal*gPrime;
        return {
          title: "Product Rule for Derivatives",
          concept: `If h(x) = f(x)·g(x), then:\nh'(x) = f'(x)·g(x) + f(x)·g'(x)\nThis is the product rule.`,
          problem: `Find h'(x) if h(x) = (${a}x+${b})(x²+${a}). Also find h'(${x0}).`,
          solution: `f(x)=${a}x+${b},  f'(x)=${a}\ng(x)=x²+${a},  g'(x)=2x\n\nh'(x) = ${a}(x²+${a}) + (${a}x+${b})(2x)\n= ${a}x²+${a*a} + ${2*a}x²+${2*b}x\n= ${3*a}x²+${2*b}x+${a*a}\n\nh'(${x0}) = ${3*a}(${x0}²)+${2*b}(${x0})+${a*a} = ${prodPrime}`,
        };
      },
      () => {
        const a=rng(2,6), b=rng(1,4);
        return {
          title: "Left Hand & Right Hand Limits",
          concept: `Limit exists iff LHL = RHL.\nLHL: lim(x→a⁻)  RHL: lim(x→a⁺)\nFor piecewise functions, check both sides separately.`,
          problem: `f(x) = { ${a}x+${b}  if x≤${a};\n         ${a*a+b}    if x>${a} }\nDoes lim(x→${a}) f(x) exist?`,
          solution: `LHL = lim(x→${a}⁻) (${a}x+${b}) = ${a*a+b}\nRHL = lim(x→${a}⁺) (${a*a+b}) = ${a*a+b}\n\nLHL = RHL = ${a*a+b}  →  Limit EXISTS = ${a*a+b}\n\nNote: f(${a}) = ${a*a+b} (function is also continuous here).`,
        };
      },
    ],
    check: [
      () => {
        const a=rng(2,8);
        const ans=2*a;
        const { options, answerIndex } = mcq(`${ans}`, [a,ans+1,ans-2].map(String));
        return { title: "Limit by Factoring", question: `lim(x→${a}) (x²−${a*a})/(x−${a}) = ?`, options, answerIndex, explanation: `Factor: (x+${a})(x−${a})/(x−${a}) = x+${a}. At x=${a}: ${ans}.` };
      },
      () => {
        const a=rng(2,5),b=rng(1,4),c=rng(1,6);
        const ans=`${3*a}x²+${2*b}x+${c}`;
        const { options, answerIndex } = mt_mcq(ans,[`${3*a}x²+${2*b}x`,`${a}x²+${b}x+${c}`,`${3*a}x²+${b}x+${c}`]);
        return { title: "Derivative", question: `d/dx [${a}x³+${b}x²+${c}x] = ?`, options, answerIndex, explanation: `Power rule: ${3*a}x²+${2*b}x+${c}.` };
      },
    ],
  },

  ch14: {
    title: "Mathematical Reasoning",
    teach: [
      () => {
        const stmts = [
          {s:"The square of every real number is positive.",truth:false,reason:"0²=0, which is not positive."},
          {s:"Every prime number is odd.",truth:false,reason:"2 is prime and even."},
          {s:"The sum of two odd numbers is even.",truth:true,reason:"(2m+1)+(2n+1)=2(m+n+1), which is even."},
          {s:"All triangles are equilateral.",truth:false,reason:"A scalene triangle has all sides different."},
          {s:"There exists a real number whose square is negative.",truth:false,reason:"For any real x, x²≥0."},
        ];
        const {s,truth,reason} = pick(stmts);
        return {
          title: "Truth Value of a Statement",
          concept: `A mathematical statement is a declarative sentence that is either TRUE or FALSE (not both). We must justify our answer with proof or counterexample.`,
          problem: `Determine the truth value of: "${s}"`,
          solution: `The statement is ${truth?"TRUE":"FALSE"}.\nReason: ${reason}`,
        };
      },
      () => {
        const implications = [
          {p:"a number is divisible by 6",q:"it is divisible by 2",contra:"if a number is not divisible by 2, then it is not divisible by 6"},
          {p:"it is raining",q:"the ground is wet",contra:"if the ground is not wet, then it is not raining"},
          {p:"x² = 4",q:"x = 2 or x = −2",contra:"if x ≠ 2 and x ≠ −2, then x² ≠ 4"},
          {p:"a triangle is equilateral",q:"it is isosceles",contra:"if a triangle is not isosceles, then it is not equilateral"},
        ];
        const {p,q,contra} = pick(implications);
        return {
          title: "Implication & Contrapositive",
          concept: `If p then q (p→q). Logically equivalent: Contrapositive (¬q → ¬p).\nConverse (q→p) is NOT equivalent to the original.`,
          problem: `Write the contrapositive of: "If ${p}, then ${q}."`,
          solution: `Original: p → q\nContrapositive (¬q → ¬p):\n"${contra.charAt(0).toUpperCase()+contra.slice(1)}"\n\nThis is logically equivalent to the original.`,
        };
      },
    ],
    check: [
      () => {
        const opts=["x > 5 is a statement","All students are intelligent is a statement","Is 2 a prime? is a statement","Come here is a statement"];
        const ansIdx=0;
        const { options, answerIndex } = mt_mcq(opts[0],opts.slice(1));
        return { title: "Identify a Statement", question: `Which of the following is a valid mathematical statement?`, options, answerIndex, explanation: `"x>5" has a definite truth value (T or F for each x). The rest are a question, command, or vague. However, without a specific x it's open — note that open sentences are studied in predicate logic; this question uses the textbook context.` };
      },
      () => {
        const opts=["If q, then p (converse)","If not p, then not q (inverse)","If not q, then not p (contrapositive)","p if and only if q"];
        const { options, answerIndex } = mt_mcq(opts[2],mt_sh(opts.slice(0,2).concat([opts[3]])));
        return { title: "Contrapositive", question: `The contrapositive of "If p then q" is:`, options, answerIndex, explanation: `Contrapositive flips AND negates: ¬q → ¬p = "If not q, then not p".` };
      },
    ],
  },

  ch15: {
    title: "Statistics",
    teach: [
      () => {
        const n=rng(5,8);
        const data=Array.from({length:n},()=>rng(5,25));
        const mean=data.reduce((s,x)=>s+x,0)/n;
        const md=(data.reduce((s,x)=>s+Math.Math.abs(x-mean),0)/n).toFixed(2);
        return {
          title: "Mean Deviation about Mean",
          concept: `MD = (1/n)·Σ|xᵢ − x̄|.  First find mean, then average of absolute deviations.`,
          problem: `Find the mean deviation about the mean for: ${data.join(", ")}.`,
          solution: "Mean x\u0305 = (" + data.join("+") + ")/n = " + data.reduce((s,x)=>s+x,0) + "/" + n + " = " + mean.toFixed(2) + "\n\nDeviations: " + data.map(x=>"|"+x+"\u2212"+mean.toFixed(1)+"|="+Math.Math.abs(x-mean).toFixed(1)).join(", ") + "\n\nMD = " + data.reduce((s,x)=>s+Math.Math.abs(x-mean),0).toFixed(2) + "/" + n + " = " + md,
        };
      },
      () => {
        const n=rng(5,8);
        const data=Array.from({length:n},()=>rng(4,20));
        const mean=data.reduce((s,x)=>s+x,0)/n;
        const variance=data.reduce((s,x)=>s+(x-mean)**2,0)/n;
        const sd=Math.sqrt(variance);
        const cv=(sd/mean*100).toFixed(1);
        return {
          title: "Variance, Standard Deviation & CV",
          concept: "\u03C3\u00B2 = (1/n)\u03A3(x\u1D62\u2212x\u0305)\u00B2.  \u03C3 = \u221A(\u03C3\u00B2).  CV = (\u03C3/x\u0305)\u00D7100%.",
          problem: "Find variance, SD, and coefficient of variation for: " + data.join(", ") + ".",
          solution: "x\u0305 = " + mean.toFixed(2) + "\nSquared deviations: " + data.map(x=>((x-mean)**2).toFixed(1)).join(", ") + "\n\u03C3\u00B2 = " + variance.toFixed(2) + "\n\u03C3 = " + sd.toFixed(3) + "\nCV = " + cv + "%",
        };
      },
    ],
    check: [
      () => {
        const v=rng(9,64);
        const ans=Math.sqrt(v);
        const ansStr=Number.isInteger(ans)?`${ans}`:`√${v}`;
        const { options, answerIndex } = mt_mcq(ansStr,[`${v}`,`${v*2}`,`${ans+1}`].map(String));
        return { title: "SD from Variance", question: `If variance = ${v}, what is the standard deviation?`, options, answerIndex, explanation: `SD = √(variance) = √${v} = ${ansStr}.` };
      },
      () => {
        const m1=rng(40,60),s1=rng(5,12),m2=rng(80,120),s2=rng(8,20);
        const cv1=(s1/m1*100).toFixed(1),cv2=(s2/m2*100).toFixed(1);
        const more=parseFloat(cv1)>parseFloat(cv2)?"Dataset A":"Dataset B";
        const { options, answerIndex } = mt_mcq(more,[more==="Dataset A"?"Dataset B":"Dataset A","Both equal","Cannot determine"]);
        return { title: "Comparing Variability", question: `Dataset A: mean=${m1}, SD=${s1}. Dataset B: mean=${m2}, SD=${s2}. Which has MORE relative variability?`, options, answerIndex, explanation: `CV(A)=${cv1}%, CV(B)=${cv2}%. Higher CV = more variable → ${more}.` };
      },
    ],
  },

  ch16: {
    title: "Probability",
    teach: [
      () => {
        const type=pick(["coin2","coin3","dice1","dice2"]);
        let exp,n,sample;
        if(type==="coin2"){exp="2 coins tossed";n=4;sample=["HH","HT","TH","TT"]}
        else if(type==="coin3"){exp="3 coins tossed";n=8;sample=["HHH","HHT","HTH","HTT","THH","THT","TTH","TTT"]}
        else if(type==="dice1"){exp="one die rolled";n=6;sample=["1","2","3","4","5","6"]}
        else{exp="two dice rolled";n=36;sample=["(1,1)","(1,2)","...","(6,6)"]}
        return {
          title: "Sample Space",
          concept: `Sample Space S = set of ALL possible outcomes. |S| = total equally likely outcomes. An Event A ⊆ S.`,
          problem: `Write the sample space when ${exp}, and find |S|.`,
          solution: `S = { ${sample.join(", ")} }\n|S| = ${n}\n\nEach outcome is equally likely with probability 1/${n}.`,
        };
      },
      () => {
        const total=rng(30,60);
        const fav=rng(5,total-5);
        const pStr=`${fav}/${total}`;
        const g=gcd(fav,total);
        const pRed=`${fav/g}/${total/g}`;
        const pComp=`${(total-fav)/g}/${total/g}`;
        const event=pick(["drawing a red ball","getting a head","picking a prime","selecting a vowel"]);
        return {
          title: "Basic Probability & Complement",
          concept: `P(A) = n(A)/n(S).  P(A') = 1 − P(A).  0 ≤ P(A) ≤ 1.`,
          problem: `In an experiment with ${total} equally likely outcomes, ${fav} are favourable to event A (${event}). Find P(A) and P(A').`,
          solution: `P(A) = ${fav}/${total} = ${pRed}\nP(A') = 1 − ${pRed} = ${pComp}`,
        };
      },
      () => {
        const pA=(rng(3,6)/10), pB=(rng(2,5)/10);
        const pAB=Math.min(pA,pB)*0.5;
        const pAuB=(pA+pB-pAB);
        return {
          title: "Addition Rule of Probability",
          concept: `P(A∪B) = P(A) + P(B) − P(A∩B)\nFor mutually exclusive events: P(A∩B)=0 → P(A∪B)=P(A)+P(B).`,
          problem: `P(A)=${pA.toFixed(1)}, P(B)=${pB.toFixed(1)}, P(A∩B)=${pAB.toFixed(2)}. Find P(A∪B).`,
          solution: `P(A∪B) = P(A) + P(B) − P(A∩B)\n= ${pA.toFixed(1)} + ${pB.toFixed(1)} − ${pAB.toFixed(2)}\n= ${pAuB.toFixed(2)}`,
        };
      },
      () => {
        const total=52;
        const suit=pick(["hearts","clubs","diamonds","spades"]);
        const face=pick(["king","queen","jack","ace"]);
        const suitCount=13, faceCount=4, both=1;
        const pSuit=suitCount/total, pFace=faceCount/total, pBoth=both/total;
        const pEither=(suitCount+faceCount-both)/total;
        return {
          title: "Probability with Cards",
          concept: `Standard deck: 52 cards, 4 suits of 13 each.\nP(A∪B) = P(A)+P(B)−P(A∩B).`,
          problem: `One card drawn from 52. Find P(${suit}) and P(${face}), then P(${suit} OR ${face}).`,
          solution: `P(${suit}) = 13/52 = 1/4\nP(${face}) = 4/52 = 1/13\nP(${suit} AND ${face}) = 1/52\n\nP(${suit} OR ${face}) = 13/52 + 4/52 − 1/52\n= 16/52 = 4/13 ≈ ${(16/52).toFixed(3)}`,
        };
      },
      () => {
        const n=rng(2,3);
        const total=Math.pow(6,n);
        const sum=rng(3+n-1, 4+n);
        // count ways to get that sum with n dice
        let count=0;
        if(n===2){
          for(let i=1;i<=6;i++) for(let j=1;j<=6;j++) if(i+j===sum) count++;
        } else {
          for(let i=1;i<=6;i++) for(let j=1;j<=6;j++) for(let k=1;k<=6;k++) if(i+j+k===sum) count++;
        }
        const gRed = gcd(count, total); const reduced = gRed > 1 ? " = " + (count/gRed) + "/" + (total/gRed) : "";
        return {
          title: "Probability with " + n + " Dice",
          concept: "When rolling " + n + " dice, each outcome is equally likely.\n|S| = 6^" + n + " = " + total + "\nCount favourable outcomes systematically.",
          problem: n + " dice are rolled. Find P(sum = " + sum + ").",
          solution: "|S| = 6^" + n + " = " + total + "\nFavourable outcomes (sum=" + sum + "): " + count + "\n\nP(sum=" + sum + ") = " + count + "/" + total + reduced,
        };
      },
    ],
    check: [
      () => {
        const n=pick([2,3]);
        const ans=Math.pow(2,n);
        const { options, answerIndex } = mcq(`${ans}`,[`${n*2}`,`${ans+2}`,`${ans-1}`].map(String));
        return { title: "Sample Space Size", question: `${n} coins are tossed. How many outcomes are in the sample space?`, options, answerIndex, explanation: `|S| = 2^${n} = ${ans}.` };
      },
      () => {
        const p=rng(1,5)/10, q=rng(1,4)/10;
        const inter=Math.round(Math.min(p,q)*5)/10;
        const ans=(p+q-inter).toFixed(1);
        const { options, answerIndex } = mt_mcq(ans,[(p+q).toFixed(1),(p+q-inter+0.1).toFixed(1),inter.toFixed(1)]);
        return { title: "Addition Rule", question: `P(A)=${p.toFixed(1)}, P(B)=${q.toFixed(1)}, P(A∩B)=${inter.toFixed(1)}. P(A∪B)?`, options, answerIndex, explanation: `P(A∪B)=${p.toFixed(1)}+${q.toFixed(1)}−${inter.toFixed(1)}=${ans}.` };
      },
    ],
  },
};

// ── 16 chapter generators ─────────────────────────────────────────
const genNCERT_Ch1  = mt_gen(NCERT_ENGINE.ch1);
const genNCERT_Ch2  = mt_gen(NCERT_ENGINE.ch2);
const genNCERT_Ch3  = mt_gen(NCERT_ENGINE.ch3);
const genNCERT_Ch4  = mt_gen(NCERT_ENGINE.ch4);
const genNCERT_Ch5  = mt_gen(NCERT_ENGINE.ch5);
const genNCERT_Ch6  = mt_gen(NCERT_ENGINE.ch6);
const genNCERT_Ch7  = mt_gen(NCERT_ENGINE.ch7);
const genNCERT_Ch8  = mt_gen(NCERT_ENGINE.ch8);
const genNCERT_Ch9  = mt_gen(NCERT_ENGINE.ch9);
const genNCERT_Ch10 = mt_gen(NCERT_ENGINE.ch10);
const genNCERT_Ch11 = mt_gen(NCERT_ENGINE.ch11);
const genNCERT_Ch12 = mt_gen(NCERT_ENGINE.ch12);
const genNCERT_Ch13 = mt_gen(NCERT_ENGINE.ch13);
const genNCERT_Ch14 = mt_gen(NCERT_ENGINE.ch14);
const genNCERT_Ch15 = mt_gen(NCERT_ENGINE.ch15);
const genNCERT_Ch16 = mt_gen(NCERT_ENGINE.ch16);


const GENERATORS = {
  beginner:     [genLinear, genRatio, genPercent, genSI, genCI, genSTD, genGeometry, genFractions, genProportions, genExponents, genBasicStats],
  intermediate: [genQuadratic, genIdentity, genProgression, genProbability, genMensuration, genCoordGeo, genSystems, genPolynomials, genLogarithms, genSlopeLines],
  advanced:     [genTrig, genPermComb, genInequality, genFunctions, genAdvGeo, genTrigEquations, genComplexNumbers, genMatrices, genVectors, genFunctionsInverse, genAbsInequality, genConics],
  olympiad:     [genNumberTheory, genCombinatorics, genAdvAlgebra, genClassic, genDerivatives, genIntegrals, genDiophantine, genPigeonhole, genVieta, genAMGM],
  ncert:        [genNCERT_Ch1, genNCERT_Ch2, genNCERT_Ch3, genNCERT_Ch4, genNCERT_Ch5, genNCERT_Ch6, genNCERT_Ch7, genNCERT_Ch8, genNCERT_Ch9, genNCERT_Ch10, genNCERT_Ch11, genNCERT_Ch12, genNCERT_Ch13, genNCERT_Ch14, genNCERT_Ch15, genNCERT_Ch16],
};

// Maps each generator index to its topic name
const GTOPICS = {
  beginner:     ["Linear Equations","Ratios","Percentages","Simple Interest","Compound Interest","Speed, Time & Distance","Geometry","Fractions & Decimals","Proportions & Variations","Exponents & Radicals","Basic Statistics"],
  intermediate: ["Quadratic Equations","Algebraic Identities","AP/GP","Probability","Mensuration","Coordinate Geometry","Systems of Equations","Polynomials & Remainders","Logarithms","Slope & Lines"],
  advanced:     ["Trigonometry","Permutations & Combinations","Inequalities","Functions","Advanced Geometry","Trig Equations","Complex Numbers","Matrices & Determinants","Vectors","Functions & Inverses","Inequalities (Abs. Value)","Conic Sections"],
  olympiad:     ["Number Theory","Combinatorics","Advanced Algebra","Classic Puzzles","Calculus — Derivatives","Calculus — Integrals","Diophantine Equations","Pigeonhole & Combinatorics","Vieta's Formulas","AM-GM Inequality"],
  ncert:        ["Sets","Relations & Functions","Trigonometric Functions","Mathematical Induction","Complex Numbers & Quadratics","Linear Inequalities","Permutations & Combinations","Binomial Theorem","Sequences & Series","Straight Lines","Conic Sections","3D Geometry","Limits & Derivatives","Mathematical Reasoning","Statistics","Probability"],
};

// ════════════════════════════════════════════════════════════════
//  🧠 ADAPTIVE LEARNING ENGINE
// ════════════════════════════════════════════════════════════════
//
//  DIFFICULTY LEVELS  1 – 10  (per mode session)
//  ─────────────────────────────────────────────
//  Lv 1–2  → generator param 1  (smallest numbers / simplest variants)
//  Lv 3–4  → generator param 2
//  Lv 5–6  → generator param 3
//  Lv 7–8  → generator param 4
//  Lv 9–10 → generator param 5  (hardest variants generators can produce)
//
//  LEVEL PROGRESSION
//  ─────────────────
//  ✓  3 correct in a row (at any level)  →  level +1  (max 10)
//  ✗  2 wrong in a row on same topic     →  level –1  (min 1)
//  ✗  1 wrong answer                     →  retry same topic (level held)
//
//  TOPIC RETRY
//  ───────────
//  Wrong answer  →  next question is FORCED from same topic
//  Correct on forced retry  →  retry cleared, normal flow resumes
//  2nd wrong on forced topic  →  level –1, still retry same topic once more
//  3rd wrong on same topic    →  level –1 again, retry clears (move on, not frustrating)

// Map difficulty level 1-10 → generator lv param 1-5
const diffLvParam = (lv) => Math.min(5, Math.ceil(lv / 2));

// Generate from a specific named topic (used for retry mode)
const genForTopic = (mode, topicName, lv) => {
  const topics = GTOPICS[mode];
  const gens   = GENERATORS[mode];
  const idx    = topics.indexOf(topicName);
  if (idx === -1) return genAdaptive(mode, {}, lv);
  return gens[idx](diffLvParam(lv));
};

// Weighted selection — weak topics pulled more, respects difficulty level
const genAdaptive = (mode, topicStats, lv) => {
  const gens   = GENERATORS[mode];
  const topics = GTOPICS[mode];
  const weights = topics.map(t => {
    const s = topicStats[t];
    if (!s || s.total < 2) return 1.8;     // unseen → elevated
    const acc = s.correct / s.total;
    if (acc < 0.30) return 8;              // very weak  → heavy pull
    if (acc < 0.50) return 4.5;            // weak
    if (acc < 0.65) return 2.5;            // below average
    if (acc < 0.80) return 1.2;            // average
    return 0.4;                             // strong → deprioritize
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < gens.length; i++) {
    r -= weights[i];
    if (r <= 0) return gens[i](diffLvParam(lv));
  }
  return gens[gens.length - 1](diffLvParam(lv));
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

const MODE_XP = { beginner: 1, intermediate: 1.4, advanced: 2, olympiad: 3, ncert: 2 };

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
  { id:"ncert",        label:"NCERT XI",     glyph:"📘", desc:"All 16 Class XI Chapters",     topics:"Sets · Relations · Trig · Induction · Complex Nos · Inequalities · P&C · Binomial · Sequences · Lines · Conics · 3D · Limits · Reasoning · Statistics · Probability", accent:"#06b6d4", dim:"rgba(6,182,212,0.10)", border:"rgba(6,182,212,0.28)" },
];

// ════════════════════════════════════════════════════════════════
//  OPTIONS BUILDER (MCQ)
// ════════════════════════════════════════════════════════════════

const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const makeDistractors = (answer) => {
  const nums = extractNums(answer);
  const distractors = new Set();

  if (nums.length > 0) {
    const n    = nums[0];
    const abs  = Math.abs(n);
    const step = abs < 5 ? 1 : abs < 20 ? 2 : abs < 100 ? Math.round(abs * 0.15) : Math.round(abs * 0.25);
    const candidates = [n + step, n - step, n * 2, Math.round(n * 0.5), n + step * 2, n - step * 2];
    for (const c of candidates) {
      if (c === n || distractors.size >= 3) continue;
      const formatted = c % 1 !== 0 ? c.toFixed(2) : String(c);
      const dist = answer.replace(/(-?\d+\.?\d*)/, formatted);
      if (dist !== answer) distractors.add(dist);
    }
  }

  const fallbacks = ["+ 1", "− 1", "× 2"];
  let fi = 0;
  while (distractors.size < 3) {
    distractors.add(answer + " " + fallbacks[fi % fallbacks.length]);
    fi++;
  }
  return Array.from(distractors).slice(0, 3);
};

const buildOptions = (question) => {
  const correct = question.answer;
  const distractors = makeDistractors(correct);
  return shuffle([correct, ...distractors]);
};


// ════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

  /* ── DESIGN TOKENS ─────────────────────────────────────────────────────────── */
  :root, [data-theme="dark"] {
    --bg-app:      #07090f;
    --bg-card:     #0d1117;
    --bg-surface:  #060810;
    --bg-input:    #0b0e17;
    --bg-hover:    #111827;
    --border:      #1d2535;
    --border2:     #151d2b;
    --tp:          #eef2ff;
    --ts:          #94a3c4;
    --tm:          #3d4f6a;
    --accent:      #3b82f6;
    --accent2:     #60a5fa;
    --font-b:      'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
    --font-d:      'Outfit', 'Inter', system-ui, sans-serif;
    --font-math:   'STIX Two Text', 'Cambria Math', 'Georgia', serif;
    --r-xl:        16px;
    --r-l:         12px;
    --r-m:         8px;
    --r-f:         999px;
    --dur:         0.22s;
    --ease:        cubic-bezier(.4,0,.2,1);
    --shadow-s:    0 2px 16px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03);
    --grid-line:   rgba(255,255,255,0.025);
    --bg-raised:   #0d1117;
    --bg-sunken:   #060810;
    --border-soft: #151d2b;
    --text:        #eef2ff;
    --text-2:      #94a3c4;
    --text-3:      #3d4f6a;
    --shadow-card: 0 2px 16px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03);
    --shadow-sm:   0 2px 8px rgba(0,0,0,0.2);
    --radius-lg:   16px;
    --radius-md:   12px;
    --radius-sm:   8px;
    --transition:  0.22s cubic-bezier(.4,0,.2,1);
    /* step colours */
    --step-bg:     rgba(59,130,246,0.06);
    --step-border: rgba(59,130,246,0.18);
    --step-num-bg: rgba(59,130,246,0.15);
    --step-num-c:  #60a5fa;
    --formula-bg:  rgba(168,85,247,0.08);
    --formula-bd:  rgba(168,85,247,0.22);
    --formula-c:   #c084fc;
    --result-bg:   rgba(16,185,129,0.07);
    --result-bd:   rgba(16,185,129,0.22);
    --result-c:    #34d399;
  }

  [data-theme="light"] {
    --bg-app:      #f0f4ff;
    --bg-card:     #ffffff;
    --bg-surface:  #e8edf8;
    --bg-input:    #eef2fb;
    --bg-hover:    #e2e8f5;
    --border:      #c8d2e8;
    --border2:     #dae0f0;
    --tp:          #0d1526;
    --ts:          #3a4a6b;
    --tm:          #8898bb;
    --accent:      #2563eb;
    --accent2:     #3b82f6;
    --grid-line:   rgba(0,0,0,0.035);
    --bg-raised:   #ffffff;
    --bg-sunken:   #e8edf8;
    --border-soft: #dae0f0;
    --text:        #0d1526;
    --text-2:      #3a4a6b;
    --text-3:      #8898bb;
    --shadow-card: 0 2px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
    --shadow-sm:   0 1px 4px rgba(0,0,0,0.08);
    /* step colours */
    --step-bg:     rgba(37,99,235,0.05);
    --step-border: rgba(37,99,235,0.15);
    --step-num-bg: rgba(37,99,235,0.12);
    --step-num-c:  #2563eb;
    --formula-bg:  rgba(124,58,237,0.06);
    --formula-bd:  rgba(124,58,237,0.18);
    --formula-c:   #7c3aed;
    --result-bg:   rgba(5,150,105,0.06);
    --result-bd:   rgba(5,150,105,0.18);
    --result-c:    #059669;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html { height: 100%; overflow-y: auto; scroll-behavior: smooth; }

  body {
    background: var(--bg-app); color: var(--text);
    font-family: var(--font-b);
    min-height: 100%; height: auto;
    overflow-y: auto; overflow-x: hidden;
    transition: background var(--transition), color var(--transition);
  }

  [data-theme] { min-height: 100%; overflow-y: auto; overflow-x: hidden; }

  /* NeuroForge subtle dot grid */
  .grid-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: radial-gradient(circle, var(--grid-line) 1.5px, transparent 1.5px);
    background-size: 22px 22px;
  }

  .app {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; padding: 24px 16px 72px;
    position: relative; z-index: 1;
    overflow: visible; width: 100%;
  }

  /* ── THEME TOGGLE ── */
  .theme-toggle { display: none; }
  .top-controls {
    position: fixed; top: 14px; right: 14px; z-index: 100;
    display: flex; align-items: center; gap: 8px;
  }
  .ctrl-btn {
    display: flex; align-items: center; gap: 5px;
    background: var(--bg-input); border: 1px solid var(--border2);
    color: var(--ts); padding: 7px 12px; border-radius: var(--r-f);
    font-size: 11px; font-weight: 600; cursor: pointer;
    font-family: var(--font-b); letter-spacing: 0.3px;
    transition: all var(--transition);
  }
  .ctrl-btn:hover { color: var(--tp); border-color: var(--accent); background: var(--bg-hover); }

  /* ── MENU ── */
  .menu-wrap { width: 100%; max-width: 560px; }

  .streak-banner {
    width: 100%; margin-bottom: 16px;
    background: var(--bg-card);
    border: 1px solid var(--border2);
    border-radius: var(--radius-md); padding: 13px 18px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .streak-left { display: flex; align-items: center; gap: 12px; }
  .streak-fire { font-size: 20px; line-height: 1; filter: grayscale(0.2); }
  .streak-title { font-size: 10px; color: var(--ts); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; font-family: var(--font-b); }
  .streak-days { font-size: 16px; font-weight: 700; color: var(--tp); letter-spacing: -0.2px; font-family: var(--font-d); }
  .streak-right { font-size: 11px; color: var(--tm); font-family: var(--font-b); text-align: right; line-height: 1.5; font-weight: 500; }

  .daily-card {
    width: 100%; margin-bottom: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border2);
    border-radius: var(--radius-md); padding: 16px 18px;
    display: flex; align-items: center; justify-content: space-between;
    cursor: pointer; transition: all var(--transition);
  }
  .daily-card:hover { transform: translateY(-2px); border-color: var(--accent); background: var(--bg-hover); }
  .daily-card.completed { opacity: 0.6; cursor: default; }
  .daily-card:hover.completed { transform: none; border-color: var(--border2); background: var(--bg-card); }
  .daily-left { display: flex; align-items: center; gap: 12px; }
  .daily-icon { font-size: 18px; opacity: 0.8; }
  .daily-title { font-size: 11px; font-weight: 700; color: var(--tp); letter-spacing: 1px; text-transform: uppercase; font-family: var(--font-b); }
  .daily-desc { font-size: 11.5px; color: var(--ts); margin-top: 2px; font-family: var(--font-b); }
  .daily-badge {
    font-size: 10px; font-weight: 700; font-family: var(--font-b);
    padding: 5px 12px; border-radius: var(--r-f); letter-spacing: 0.5px;
    background: var(--bg-input); border: 1px solid var(--border); color: var(--accent2);
  }
  .daily-badge.done { color: var(--tm); }

  .logo { text-align: center; margin-bottom: 32px; padding-top: 12px; }
  .logo-icon { display: none; }
  .logo-title {
    font-family: var(--font-d); font-size: 1.6rem; font-weight: 800;
    color: var(--tp); letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 4px;
  }
  .logo-sub {
    font-size: 0.72rem; color: var(--ts); letter-spacing: 0.1em;
    text-transform: uppercase; font-family: var(--font-b); font-weight: 600;
  }
  .logo-rank {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 12px;
    font-family: var(--font-b); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.5px;
    padding: 5px 14px; border-radius: var(--r-f); border: 1px solid var(--border2); background: var(--bg-input);
  }

  .solved-meter {
    width: 100%; margin-bottom: 16px;
    display: flex; align-items: center; gap: 12px;
    font-family: var(--font-b); font-size: 11px; color: var(--ts); font-weight: 600;
  }
  .solved-meter-bar { flex: 1; height: 4px; background: var(--bg-input); border-radius: 2px; overflow: hidden; }
  .solved-meter-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.6s var(--ease); }

  /* ── Mode cards — bigger, more visual ── */
  .mode-card {
    width: 100%; border-radius: var(--radius-md); border: 1px solid var(--border2);
    padding: 22px 24px; cursor: pointer; text-align: left; margin-bottom: 10px;
    background: var(--bg-card); transition: all var(--transition);
    position: relative; overflow: hidden;
  }
  .mode-card::before {
    content: ''; position: absolute; top: 0; left: 0;
    width: 3px; height: 100%; border-radius: 3px 0 0 3px;
    background: currentColor; opacity: 0;
    transition: opacity var(--transition);
  }
  .mode-card:hover::before { opacity: 0.8; }
  .mode-card:hover { border-color: var(--accent); background: var(--bg-hover); transform: translateY(-2px); box-shadow: var(--shadow-card); }
  .mode-card-top { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
  .mode-glyph { display: none; }
  .mode-label { font-family: var(--font-d); font-size: 1.1rem; font-weight: 700; letter-spacing: -0.2px; color: var(--tp) !important; }
  .mode-sub { font-size: 0.82rem; color: var(--ts); font-weight: 500; margin-top: 3px; font-family: var(--font-b); }
  .mode-icon { font-size: 18px; margin-left: auto; opacity: 0.45; color: var(--ts) !important; transition: transform var(--transition); }
  .mode-card:hover .mode-icon { opacity: 1; color: var(--accent) !important; transform: translateX(5px); }
  .mode-topics {
    font-size: 0.73rem; letter-spacing: 0.2px;
    font-family: var(--font-b); line-height: 1.65;
  }
  .mode-divider { display: none; }

  /* ── STUDY SESSION ── */
  .game-wrap { width: 100%; max-width: 600px; padding-bottom: 40px; }
  .fade-wrap { transition: opacity 0.14s ease; }

  .top-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  .back-btn {
    font-size: 0.8rem; color: var(--ts); cursor: pointer;
    background: var(--bg-input); border: 1px solid var(--border2);
    font-family: var(--font-b); font-weight: 600; padding: 8px 16px; border-radius: var(--r-f);
    transition: all var(--transition);
  }
  .back-btn:hover { color: var(--tp); background: var(--bg-hover); border-color: var(--accent); }
  .mode-badge {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; font-family: var(--font-b);
    background: transparent; color: var(--ts) !important; padding: 5px 0; border: none; box-shadow: none;
  }
  .level-badge {
    font-family: var(--font-b); font-size: 0.7rem; font-weight: 700; color: var(--accent2); letter-spacing: 0.5px;
    background: var(--bg-input); border: 1px solid var(--border2); padding: 5px 12px; border-radius: var(--r-f);
  }
  .game-streak-pill {
    margin-left: auto; display: flex; align-items: center; gap: 6px;
    font-family: var(--font-b); font-size: 0.7rem; font-weight: 700; padding: 5px 12px; border-radius: var(--r-f);
    background: var(--bg-input); border: 1px solid var(--border2); color: var(--ts);
  }

  .today-bar {
    width: 100%; margin-bottom: 16px; background: var(--bg-card); border: 1px solid var(--border2);
    border-radius: var(--radius-sm); padding: 10px 14px; display: flex; align-items: center; gap: 12px;
    font-family: var(--font-b); font-size: 0.75rem;
  }
  .today-bar-label { color: var(--ts); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .today-bar-track { flex: 1; height: 4px; background: var(--bg-input); border-radius: 2px; overflow: hidden; }
  .today-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.5s var(--ease); }
  .today-bar-count { color: var(--tp); font-weight: 700; }

  /* ── XP / Rank progress ── */
  .xp-section {
    background: var(--bg-card); border: 1px solid var(--border2);
    border-radius: var(--radius-md); padding: 16px 20px; margin-bottom: 16px;
  }
  .xp-section::after { display: none; }
  .xp-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .rank-name { font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; font-family: var(--font-b); color: var(--tp) !important; }
  .xp-nums { font-size: 0.75rem; color: var(--ts); font-family: var(--font-b); font-weight: 500; }
  .xp-bar-bg { height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden; border: none; margin-bottom: 6px; }
  .xp-bar-fill { height: 100%; border-radius: 3px; background: var(--accent) !important; transition: width 0.8s var(--ease); }
  .xp-bar-fill::after { display: none; }
  .next-rank-pill { font-size: 0.7rem; font-family: var(--font-b); color: var(--tm); font-weight: 500; }
  .next-rank-pill strong { color: var(--ts); }

  /* ── Stats row ── */
  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .stat-box {
    border-radius: var(--radius-sm); border: 1px solid var(--border2) !important;
    padding: 14px 10px; text-align: center; background: var(--bg-card) !important;
    transition: transform 0.15s ease;
  }
  .stat-num { font-size: 1.4rem; font-weight: 800; font-family: var(--font-d); line-height: 1; color: var(--tp) !important; }
  .stat-label { font-size: 0.65rem; color: var(--ts); text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; font-weight: 700; }

  /* ── Focus areas ── */
  .weak-section { margin-bottom: 16px; padding: 14px; background: var(--bg-input); border-radius: var(--radius-sm); border: 1px solid var(--border2); }
  .weak-label { font-size: 0.65rem; color: var(--tm); letter-spacing: 1px; text-transform: uppercase; font-family: var(--font-b); margin-bottom: 8px; font-weight: 700; }
  .weak-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .weak-chip {
    font-size: 0.75rem; font-family: var(--font-b); font-weight: 600; padding: 5px 12px;
    border-radius: var(--r-f); background: var(--bg-card); border: 1px solid var(--border2);
    color: var(--ts);
  }

  /* ═══════════════════════════════════════════════════
     ██  QUESTION CARD  — center of attraction
     ═══════════════════════════════════════════════════ */
  .q-card {
    border-radius: var(--radius-md); border: 1.5px solid var(--border2) !important;
    padding: 28px 28px 22px; margin-bottom: 18px; background: var(--bg-card);
    transition: border-color 0.3s, box-shadow 0.3s; position: relative;
    box-shadow: var(--shadow-sm);
  }
  .q-card.ev-correct { border-color: #10b981 !important; box-shadow: 0 0 0 2px rgba(16,185,129,0.12); }
  .q-card.ev-wrong   { border-color: #f87171 !important; box-shadow: 0 0 0 2px rgba(239,68,68,0.12); }

  .q-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
  .q-topic {
    font-size: 0.62rem; font-weight: 800; letter-spacing: 2px;
    text-transform: uppercase; font-family: var(--font-b); color: var(--ts) !important;
    padding: 3px 10px; border-radius: var(--r-f);
    background: var(--bg-input); border: 1px solid var(--border2);
  }

  /* The question text itself — large, math-quality font */
  .q-text {
    font-size: 1.18rem;
    font-weight: 500;
    line-height: 1.75;
    letter-spacing: 0.01em;
    white-space: pre-wrap;
    color: var(--tp);
    font-family: var(--font-math);
  }
  /* Larger on bigger screens */
  @media (min-width: 480px) { .q-text { font-size: 1.28rem; } }
  @media (min-width: 768px) { .q-text { font-size: 1.36rem; } }

  /* Inline math expression spans inside question */
  .math-expr {
    font-family: var(--font-math);
    font-style: italic;
    color: var(--accent2);
    font-size: 1.08em;
    letter-spacing: 0.02em;
  }

  /* ── Timer (inside question card) ── */
  .timer-wrap { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .timer-ring { transform: rotate(-90deg); }
  .timer-ring-bg   { fill: none; stroke: var(--border); stroke-width: 2.5; }
  .timer-ring-fill { fill: none; stroke-width: 2.5; stroke-linecap: round; transition: stroke-dashoffset 1s linear, stroke 0.4s; }
  .timer-num { font-size: 0.78rem; font-weight: 800; font-family: var(--font-b); position: absolute; }
  .timer-num.urgent { color: #f87171; animation: timerPulse 0.7s ease-in-out infinite; }
  .timer-label { font-size: 0.55rem; color: var(--tm); font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; }
  @keyframes timerPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

  /* ── MCQ Options ── */
  .options-toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; background: var(--bg-card); border: 1px solid var(--border2);
    border-radius: var(--radius-sm); margin-bottom: 16px;
  }
  .options-toggle-label { font-size: 0.85rem; font-weight: 700; font-family: var(--font-b); color: var(--tp); }
  .options-toggle-desc { font-size: 0.75rem; color: var(--ts); margin-top: 2px; font-family: var(--font-b); font-weight: 500; }

  .toggle-switch { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .toggle-track { position: absolute; inset: 0; background: var(--bg-input); border: 1px solid var(--border2); border-radius: 999px; cursor: pointer; transition: background 0.2s ease; }
  .toggle-track::before { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: var(--ts); left: 3px; top: 3px; transition: transform 0.2s ease, background 0.2s ease; }
  .toggle-switch input:checked + .toggle-track { background: var(--accent); border-color: var(--accent); }
  .toggle-switch input:checked + .toggle-track::before { transform: translateX(18px); background: #fff; }

  .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .option-btn {
    display: flex; align-items: center; gap: 12px; text-align: left;
    padding: 15px 16px; border-radius: var(--radius-sm); cursor: pointer;
    background: var(--bg-input); border: 1px solid var(--border2);
    color: var(--tp); font-size: 0.95rem; font-family: var(--font-math);
    font-weight: 400; transition: all var(--transition); line-height: 1.4;
  }
  .option-btn:not(:disabled):hover { border-color: var(--accent); background: var(--bg-hover); transform: translateY(-1px); }
  .option-btn.opt-correct { border-color: #10b981 !important; background: rgba(16,185,129,0.1) !important; color: #10b981 !important; }
  .option-btn.opt-wrong   { border-color: #f87171 !important; background: rgba(239,68,68,0.1) !important;  color: #f87171 !important; }
  .option-label {
    flex-shrink: 0; width: 26px; height: 26px; border-radius: 7px;
    background: var(--bg-surface); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.72rem; font-weight: 700; color: var(--ts); font-family: var(--font-b);
  }

  /* ── Answer input ── */
  .answer-row { display: flex; gap: 10px; margin-bottom: 8px; }
  .answer-input {
    flex: 1; padding: 14px 18px; border-radius: var(--radius-sm);
    border: 1.5px solid var(--border2); background: var(--bg-input);
    color: var(--tp); font-size: 1rem; font-family: var(--font-math); font-weight: 400;
    outline: none; transition: border-color var(--transition), box-shadow var(--transition);
  }
  .answer-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
  .answer-input::placeholder { color: var(--tm); font-style: italic; }
  .submit-btn {
    padding: 14px 26px; border-radius: var(--radius-sm); border: none;
    background: var(--accent); color: #fff; font-size: 0.92rem; font-weight: 700;
    font-family: var(--font-b); cursor: pointer; transition: all var(--transition);
    white-space: nowrap;
  }
  .submit-btn:not(:disabled):hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(59,130,246,0.35); }
  .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Feedback banner ── */
  .feedback-banner {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-radius: var(--radius-sm); margin-bottom: 18px;
    font-size: 0.88rem; font-weight: 700; font-family: var(--font-b);
  }
  .ev-correct { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981; }
  .ev-wrong   { background: rgba(239,68,68,0.1);  border: 1px solid rgba(239,68,68,0.3);  color: #f87171; }
  .ev-partial { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.3); color: #fbbf24; }
  .feedback-xp { font-family: var(--font-b); font-size: 0.82rem; font-weight: 800; }
  .feedback-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }

  /* ═══════════════════════════════════════════════════
     ██  ANSWER CARD  — step-by-step solution
     ═══════════════════════════════════════════════════ */
  .ans-card {
    background: var(--bg-card);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: 16px;
    box-shadow: var(--shadow-card);
  }

  /* Answer value section at the top */
  .ans-header {
    padding: 20px 24px 18px;
    border-bottom: 1px solid var(--border2);
    background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-input) 100%);
  }
  .ans-label {
    font-size: 0.6rem; color: var(--ts); letter-spacing: 2px;
    text-transform: uppercase; font-family: var(--font-b); font-weight: 800;
    margin-bottom: 8px; display: flex; align-items: center; gap: 8px;
  }
  .ans-label::after {
    content: ''; flex: 1; height: 1px; background: var(--border2);
  }
  .ans-value {
    font-size: 1.6rem; font-weight: 700;
    font-family: var(--font-math);
    color: var(--tp) !important;
    line-height: 1.3;
    letter-spacing: 0.01em;
  }
  @media (min-width: 480px) { .ans-value { font-size: 1.8rem; } }

  /* Steps section */
  .steps-section { padding: 20px 24px 24px; }
  .ans-exp-label {
    font-size: 0.6rem; color: var(--ts); letter-spacing: 2px;
    text-transform: uppercase; font-family: var(--font-b); font-weight: 800;
    margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
  }
  .ans-exp-label::after { content: ''; flex: 1; height: 1px; background: var(--border2); }

  /* The step list container */
  .step-list {
    display: flex; flex-direction: column; gap: 10px;
  }

  /* Each step row — now a proper card */
  .step-row {
    display: flex; gap: 14px; align-items: flex-start;
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--step-bg);
    border: 1px solid var(--step-border);
    transition: background 0.15s ease;
  }
  .step-row:hover { background: rgba(59,130,246,0.09); }

  /* Formula-like step gets a purple tint */
  .step-row.step-formula {
    background: var(--formula-bg);
    border-color: var(--formula-bd);
  }
  .step-row.step-formula:hover { background: rgba(168,85,247,0.12); }

  /* Final result step gets a green tint */
  .step-row.step-result {
    background: var(--result-bg);
    border-color: var(--result-bd);
  }
  .step-row.step-result:hover { background: rgba(16,185,129,0.1); }

  /* Numbered circle */
  .step-num {
    flex-shrink: 0;
    width: 26px; height: 26px;
    border-radius: 50%;
    background: var(--step-num-bg);
    border: 1.5px solid var(--step-border);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.68rem; font-weight: 800;
    font-family: var(--font-b);
    color: var(--step-num-c);
    margin-top: 1px;
  }
  .step-row.step-formula .step-num {
    background: var(--formula-bg);
    border-color: var(--formula-bd);
    color: var(--formula-c);
  }
  .step-row.step-result .step-num {
    background: var(--result-bg);
    border-color: var(--result-bd);
    color: var(--result-c);
  }

  /* Step text */
  .step-text {
    font-size: 1rem; line-height: 1.7;
    font-family: var(--font-math);
    color: var(--tp);
    font-weight: 400;
    flex: 1; min-width: 0;
  }
  @media (min-width: 480px) { .step-text { font-size: 1.05rem; } }

  /* Keyword labels inside step text ("Formula:", "Rule:", "Answer:") */
  .step-keyword {
    font-family: var(--font-b);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-right: 6px;
    opacity: 0.7;
  }
  /* Inline math highlight */
  .step-math {
    font-family: var(--font-math);
    font-style: italic;
    letter-spacing: 0.02em;
    color: var(--formula-c);
    background: var(--formula-bg);
    border-radius: 4px;
    padding: 0 4px;
    white-space: nowrap;
  }

  /* ── Next / Discuss buttons ── */
  .btn-next {
    width: 100%; padding: 16px; border-radius: var(--radius-sm);
    font-size: 0.95rem; font-weight: 700; font-family: var(--font-b);
    cursor: pointer; border: 1.5px solid var(--border2);
    background: var(--bg-input); color: var(--tp);
    transition: all var(--transition); margin-bottom: 12px;
  }
  .btn-next:hover { background: var(--bg-hover); border-color: var(--accent); color: var(--accent2); transform: translateY(-1px); }

  /* ── Hint row ── */
  .hint-row { margin-bottom: 14px; }
  .hint-btn {
    font-size: 0.78rem; color: var(--ts); background: var(--bg-input);
    border: 1px solid var(--border2); border-radius: var(--r-f);
    padding: 7px 16px; cursor: pointer; font-family: var(--font-b);
    font-weight: 600; transition: all var(--transition);
  }
  .hint-btn:hover { color: var(--tp); background: var(--bg-hover); border-color: var(--ts); }
  .hint-box {
    margin-top: 12px; padding: 14px 18px;
    background: rgba(59,130,246,0.07); border: 1px solid rgba(59,130,246,0.22);
    border-radius: var(--radius-sm);
    font-size: 1rem; color: var(--accent2); line-height: 1.65;
    font-family: var(--font-math); font-weight: 400;
  }

  /* ── Misc ── */
  .enter-hint { font-size: 0.68rem; color: var(--tm); font-family: var(--font-b); margin-bottom: 12px; letter-spacing: 0.2px; }
  .speed-badge {
    font-size: 0.7rem; font-family: var(--font-b); font-weight: 700;
    color: var(--accent2); background: var(--bg-input); border: 1px solid var(--border2);
    padding: 3px 9px; border-radius: var(--r-f); letter-spacing: 0.3px;
  }
  .accuracy-line {
    text-align: center; margin-top: 18px; font-size: 0.7rem; color: var(--tm);
    font-family: var(--font-b); letter-spacing: 0.3px;
  }

  /* ── Screen transitions ── */
  @keyframes slideInRight  { from { opacity:0; transform:translateX(48px)  scale(0.98); } to { opacity:1; transform:translateX(0)    scale(1); } }
  @keyframes slideOutLeft  { from { opacity:1; transform:translateX(0)     scale(1);    } to { opacity:0; transform:translateX(-48px) scale(0.98); } }
  @keyframes slideInLeft   { from { opacity:0; transform:translateX(-48px) scale(0.98); } to { opacity:1; transform:translateX(0)     scale(1); } }
  @keyframes slideOutRight { from { opacity:1; transform:translateX(0)     scale(1);    } to { opacity:0; transform:translateX(48px)  scale(0.98); } }
  .screen-enter-forward { animation: slideInRight  0.32s cubic-bezier(.25,.8,.25,1) both; }
  .screen-exit-forward  { animation: slideOutLeft  0.22s cubic-bezier(.4,0,1,1)     both; }
  .screen-enter-back    { animation: slideInLeft   0.32s cubic-bezier(.25,.8,.25,1) both; }
  .screen-exit-back     { animation: slideOutRight 0.22s cubic-bezier(.4,0,1,1)     both; }

  @keyframes cardDrop { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  .mode-card { animation: cardDrop 0.35s cubic-bezier(.25,.8,.25,1) both; }
  .mode-card:nth-child(1) { animation-delay: 0.05s; }
  .mode-card:nth-child(2) { animation-delay: 0.10s; }
  .mode-card:nth-child(3) { animation-delay: 0.15s; }
  .mode-card:nth-child(4) { animation-delay: 0.20s; }

  /* ── Daily challenge banner ── */
  .dc-active-banner {
    width: 100%; margin-bottom: 12px; padding: 9px 14px;
    background: var(--bg-card); border: 1px solid var(--border2); border-radius: var(--radius-sm);
    display: flex; align-items: center; gap: 8px;
    font-size: 0.78rem; font-weight: 600; color: var(--accent2);
    font-family: var(--font-b); letter-spacing: 0.2px;
  }

  /* ── Responsive ── */
  @media (max-width: 479px) {
    .q-card { padding: 20px 18px 16px; }
    .ans-header { padding: 16px 18px 14px; }
    .steps-section { padding: 16px 14px 18px; }
    .step-row { padding: 12px 12px; gap: 10px; }
    .options-grid { grid-template-columns: 1fr; }
    .game-wrap { max-width: 100%; }
    .ans-value { font-size: 1.35rem; }
  }
  @media (min-width: 769px) {
    .game-wrap { max-width: 640px; }
    .menu-wrap { max-width: 580px; }
  }

  /* ── Hide arcadey elements that break academic immersion ── */
  .combo-display, .rankup-overlay,
  .toast-container, .xp-burst-portal, .particles-canvas,
  .rank-pass-banner { display: none !important; }
`;

// ════════════════════════════════════════════════════════════════
//  COMPONENT
// ════════════════════════════════════════════════════════════════

// ── Leaderboard ghost names for "you passed X" notifications ──
const GHOST_NAMES = [
  "Rahul M", "Priya S", "Arjun K", "Sneha R", "Vikram T",
  "Ananya D", "Rohan G", "Divya N", "Aditya P", "Kavya L",
  "Siddharth B", "Meera J", "Aarav C", "Pooja V", "Harsh W",
  "Simran A", "Nikhil F", "Ishaan H", "Ritika E", "Karan O",
];

// Web Audio sound engine
const createSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'correct') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(523.25, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.14, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      o.start(); o.stop(ctx.currentTime + 0.3);
    } else if (type === 'wrong') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(240, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.09, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      o.start(); o.stop(ctx.currentTime + 0.25);
    } else if (type === 'xp') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.07, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
      o.start(); o.stop(ctx.currentTime + 0.15);
    } else if (type === 'rankup') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        const t = ctx.currentTime + i * 0.11;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        o.start(t); o.stop(t + 0.35);
      });
    }
  } catch (_) {}
};

export default function MathBot() {
  const [theme,      setTheme]      = useState(() => {
    // Sync with parent app theme on first render
    if (typeof window !== 'undefined' && window._mbInitialTheme) return window._mbInitialTheme;
    try { const t = localStorage.getItem('nf_theme'); if (t) return t; } catch(_) {}
    if (typeof document !== 'undefined') {
      const t = document.documentElement.getAttribute('data-theme');
      if (t) return t;
    }
    return "dark";
  });
  const [mode,       setMode]       = useState(null);
  const [question,   setQuestion]   = useState(null);
  const [userInput,  setUserInput]  = useState("");
  const [evaluation, setEvaluation] = useState(null);
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
  const [screenState,  setScreenState]  = useState("idle");   // "idle" | "exit" | "enter"
  const [animDir,      setAnimDir]      = useState("forward"); // "forward" | "back"
  const [useOptions, setUseOptions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_useOptions') || 'false'); } catch { return false; }
  });
  const [options,    setOptions]    = useState([]);
  const [pickedOpt,  setPickedOpt]  = useState(null);

  // ── ADDICTIVE MECHANICS STATE ──────────────────────────────────
  const [timerSec,   setTimerSec]   = useState(null);
  const [maxTimeSec, setMaxTimeSec] = useState(45);
  const [speedBonus, setSpeedBonus] = useState(null);
  const [rankUpInfo, setRankUpInfo] = useState(null);
  const [toasts,     setToasts]     = useState([]);
  const [xpBursts,   setXpBursts]   = useState([]);
  const [dailyStreak,    setDailyStreak]    = useState(0);
  const [questionsToday, setQuestionsToday] = useState(0);
  const [totalSolved,    setTotalSolved]    = useState(() => parseInt(localStorage.getItem('mb_total_solved') || '0', 10));
  const [isDailyQ,       setIsDailyQ]       = useState(false);
  const [dcDone,         setDcDone]         = useState(false);
  const [soundEnabled,   setSoundEnabled]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_sound') ?? 'true'); } catch { return true; }
  });
  const [rankPassBanner, setRankPassBanner] = useState(null);
  const [pulseStat,      setPulseStat]      = useState(null); // 'correct'|'wrong'|'streak'
  const [showParticles,  setShowParticles]  = useState(false);

  const inputRef        = useRef(null);
  const timerRef        = useRef(null);
  const qStartRef       = useRef(Date.now()); // tracks when current question appeared
  const burstIdRef      = useRef(0);
  const toastIdRef      = useRef(0);
  const prevRankRef     = useRef(null);
  const prevXPRef       = useRef(null);
  const ghostIdxRef     = useRef(0);
  const canvasRef       = useRef(null);
  const particlesRef    = useRef([]);
  const rafRef          = useRef(null);
  // ── Adaptive engine refs (no re-render needed) ────────────────
  const consecCorrectRef = useRef(0);   // consecutive correct answers
  const consecWrongRef   = useRef(0);   // consecutive wrong on retry topic
  const retryTopicRef    = useRef(null);// topic name to retry, or null
  // ── Adaptive UI state ─────────────────────────────────────────
  const [retryTopic,    setRetryTopic]   = useState(null);   // shown in UI
  const [lvFeedback,    setLvFeedback]   = useState(null);   // "up"|"down"|null

  // ── INIT: daily streak + question count ───────────────────────
  useEffect(() => {
    const today = new Date().toDateString();
    // Streak
    const lastLogin = localStorage.getItem('mb_last_login');
    const streak    = parseInt(localStorage.getItem('mb_streak') || '0', 10);
    if (lastLogin === today) {
      setDailyStreak(streak || 1);
    } else {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const ns = lastLogin === yesterday ? streak + 1 : 1;
      setDailyStreak(ns);
      localStorage.setItem('mb_streak', String(ns));
      localStorage.setItem('mb_last_login', today);
    }
    // Daily question count
    const qDate = localStorage.getItem('mb_q_date');
    if (qDate === today) {
      setQuestionsToday(parseInt(localStorage.getItem('mb_q_count') || '0', 10));
    } else {
      localStorage.setItem('mb_q_date', today);
      localStorage.setItem('mb_q_count', '0');
    }
    // Daily challenge
    const dcDate = localStorage.getItem('mb_dc_date');
    setDcDone(dcDate === today);
    // Init prevRank
    const xp = parseInt(localStorage.getItem('userXP') || '0', 10);
    prevRankRef.current = getRank(xp).name;
    prevXPRef.current   = xp;
    // Init ghost rank index from XP (rough leaderboard position)
    ghostIdxRef.current = Math.floor(Math.max(0, 100 - xp / 20));
  }, []);

  // ── HELPERS ───────────────────────────────────────────────────
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  const m = MODES.find(x => x.id === mode);

  // Expose setTheme to parent app so toggleTheme in chat.html syncs us live
  useEffect(() => {
    window._mbSetTheme = setTheme;
    return () => { try { delete window._mbSetTheme; } catch(_) {} };
  }, [setTheme]);

  const handleToggleOptions = (val) => {
    setUseOptions(val);
    try { localStorage.setItem('mb_useOptions', JSON.stringify(val)); } catch {}
  };

  const toggleSound = () => {
    setSoundEnabled(s => {
      const v = !s;
      try { localStorage.setItem('mb_sound', JSON.stringify(v)); } catch {}
      return v;
    });
  };

  const playSound = useCallback((type) => {
    if (!soundEnabled) return;
    createSound(type);
  }, [soundEnabled]);

  const rankInfo = getRank(totalXP);
  const total    = score.correct + score.wrong;
  const weakTopics = Object.entries(topicStats)
    .filter(([, s]) => s.total >= 3 && s.correct / s.total < 0.6)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .slice(0, 3);

  // ── XP BURST ──────────────────────────────────────────────────
  const triggerXPBurst = useCallback((amount, isCorrect) => {
    const id = ++burstIdRef.current;
    const x = 40 + Math.random() * 25;
    const y = 45 + Math.random() * 15;
    setXpBursts(prev => [...prev, { id, amount, isCorrect, x, y }]);
    setTimeout(() => setXpBursts(prev => prev.filter(b => b.id !== id)), 1300);
  }, []);

  // ── TOAST ────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3600);
  }, []);

  // ── PARTICLE BURST (canvas) ───────────────────────────────────
  const launchParticles = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.55;
    const colors = ['#10b981','#3b82f6','#a855f7','#fbbf24','#34d399','#60a5fa'];
    particlesRef.current = Array.from({ length: 24 }, () => ({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      r:  Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }));
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy + 0.6,
        vy: p.vy + 0.55,
        life: p.life - 0.025,
      })).filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // ── TIMER ─────────────────────────────────────────────────────
  useEffect(() => {
    if (answered || !question || !mode) return;
    const TIMES = { beginner: 45, intermediate: 60, advanced: 90, olympiad: 120 };
    const t = TIMES[mode] || 45;
    setMaxTimeSec(t);
    setTimerSec(t);
    setSpeedBonus(null);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSec(s => {
        if (s === null || s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [question?.question, mode, answered]);

  // Stop timer when answered
  useEffect(() => {
    if (answered) clearInterval(timerRef.current);
  }, [answered]);

  // MCQ options rebuild
  useEffect(() => {
    if (question && useOptions) setOptions(buildOptions(question));
    else setOptions([]);
  }, [question, useOptions]);

  const _setQuestion = (q) => { setQuestion(q); setPickedOpt(null); };

  // ── RANK PASS notification helpers ───────────────────────────
  const maybeRankPass = useCallback((gainedXP) => {
    if (gainedXP <= 0) return;
    // Roughly: every 15 XP gained = pass 1 ghost
    const passes = Math.floor(gainedXP / 15);
    if (passes < 1) return;
    const idx = ghostIdxRef.current;
    if (idx <= 0) return;
    const name = GHOST_NAMES[idx % GHOST_NAMES.length];
    ghostIdxRef.current = Math.max(0, idx - passes);
    setRankPassBanner(`⬆ You passed ${name}!`);
    setTimeout(() => setRankPassBanner(null), 2800);
  }, []);

  // ── CORE: startMode ───────────────────────────────────────────
  const startMode = (id) => {
    setAnimDir("forward");
    setScreenState("exit");
    setTimeout(() => {
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
      setPickedOpt(null);
      setSpeedBonus(null);
      setIsDailyQ(false);
      // Reset adaptive tracking
      consecCorrectRef.current = 0;
      consecWrongRef.current   = 0;
      retryTopicRef.current    = null;
      setRetryTopic(null);
      setLvFeedback(null);
      clearInterval(timerRef.current);
      _setQuestion(genAdaptive(id, {}, 1));
      qStartRef.current = Date.now();
      setScreenState("enter");
      setTimeout(() => { setScreenState("idle"); inputRef.current?.focus(); }, 350);
    }, 230);
  };

  // ── CORE: nextQ ───────────────────────────────────────────────
  const nextQ = useCallback(() => {
    setAnim(true);
    setSpeedBonus(null);
    setIsDailyQ(false);
    clearInterval(timerRef.current);
    setTimeout(() => {
      // Pick next question: retry topic if set, else adaptive weighted
      const forceTopicName = retryTopicRef.current;
      const nextQuestion = forceTopicName
        ? genForTopic(mode, forceTopicName, userLv)
        : genAdaptive(mode, topicStats, userLv);
      _setQuestion(nextQuestion);
      qStartRef.current = Date.now();
      setShowAns(false);
      setShowHint(false);
      setAnswered(false);
      setEvaluation(null);
      setUserInput("");
      setXpGained(null);
      setLvFeedback(null);
      setAnim(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 120);
  }, [mode, topicStats, userLv]);

  // ── CORE: awardXP ─────────────────────────────────────────────
  const awardXP = useCallback((amount) => {
    const current = parseInt(localStorage.getItem('userXP') || '0', 10);
    const newTotal = Math.max(0, current + amount);
    localStorage.setItem('userXP', String(newTotal));
    window.dispatchEvent(new CustomEvent('xpUpdated', { detail: { xp: newTotal } }));
  }, []);

  // ── CORE: recordOutcome — drives adaptive engine ──────────────
  const recordOutcome = useCallback((topic, isCorrect, currentStreak, currentScore, elapsedMs) => {
    setTopicStats(ts => {
      const updated = {
        ...ts,
        [topic]: {
          total:     (ts[topic]?.total     || 0) + 1,
          correct:   (ts[topic]?.correct   || 0) + (isCorrect ? 1 : 0),
          totalTime: (ts[topic]?.totalTime || 0) + (elapsedMs  || 0),
        }
      };
      // ── Persist to localStorage so the homepage panel can read it ──
      try {
        const existing = JSON.parse(localStorage.getItem('mbTopicStats') || '{}');
        const merged   = { ...existing };
        Object.entries(updated).forEach(([t, s]) => {
          merged[t] = {
            total:     (existing[t]?.total     || 0) + (s.total     - (ts[t]?.total     || 0)),
            correct:   (existing[t]?.correct   || 0) + (s.correct   - (ts[t]?.correct   || 0)),
            totalTime: (existing[t]?.totalTime || 0) + ((s.totalTime || 0) - (ts[t]?.totalTime || 0)),
          };
        });
        localStorage.setItem('mbTopicStats', JSON.stringify(merged));
        const allT  = Object.values(merged).reduce((a, s) => a + s.total,     0);
        const allC  = Object.values(merged).reduce((a, s) => a + s.correct,   0);
        const allMs = Object.values(merged).reduce((a, s) => a + (s.totalTime || 0), 0);
        if (allT > 0) {
          localStorage.setItem('mbAccuracy',      String(Math.round((allC / allT) * 100)));
          localStorage.setItem('mbTotalAnswered', String(allT));
          localStorage.setItem('mbTotalCorrect',  String(allC));
          localStorage.setItem('mbAvgTimeMs',     String(Math.round(allMs / allT)));
        }
      } catch (_) {}
      return updated;
    });
    setHistory(h => [...h.slice(-9), isCorrect]);

    // ── Daily questions counter ────────────────────────────────
    const today = new Date().toDateString();
    const qDate = localStorage.getItem('mb_q_date');
    let todayCount = 0;
    if (qDate === today) {
      todayCount = parseInt(localStorage.getItem('mb_q_count') || '0', 10) + 1;
    } else {
      localStorage.setItem('mb_q_date', today);
      todayCount = 1;
    }
    localStorage.setItem('mb_q_count', String(todayCount));
    setQuestionsToday(todayCount);

    // Total solved
    const newSolved = totalSolved + 1;
    setTotalSolved(newSolved);
    localStorage.setItem('mb_total_solved', String(newSolved));
    if ([5, 10, 25, 50, 100, 250, 500].includes(newSolved)) {
      addToast(`🎯 ${newSolved} questions completed!`, 'milestone');
    }
    if (todayCount === 5)  addToast('⚡ 5 questions today — daily goal reached!', 'success');
    if (todayCount === 10) addToast('🔥 10 today! You\'re unstoppable!', 'fire');
    if (todayCount === 20) addToast('🌟 20 questions today! Absolute grinder!', 'milestone');

    if (isCorrect) {
      // ── CORRECT path ──────────────────────────────────────────
      const newStreak = currentStreak + 1;

      // Adaptive: clear retry, increment consecutive correct
      retryTopicRef.current  = null;
      setRetryTopic(null);
      consecWrongRef.current = 0;
      consecCorrectRef.current += 1;

      // Level up: every 3 consecutive correct answers
      let newLv = userLv;
      if (consecCorrectRef.current >= 3) {
        consecCorrectRef.current = 0;
        newLv = Math.min(userLv + 1, 10);
        setUserLv(newLv);
        if (newLv > userLv) {
          setLvFeedback('up');
          addToast(`📈 Difficulty increased to Level ${newLv}!`, 'success');
        }
      }

      const xp = calcXP(newStreak, newLv, mode);
      let bonus = 0;
      if (timerSec !== null && maxTimeSec > 0 && timerSec > maxTimeSec * 0.5) {
        bonus = Math.round(xp * 0.15);
        setSpeedBonus(bonus);
      }
      const totalEarned = xp + bonus;

      const currentXP = parseInt(localStorage.getItem('userXP') || '0', 10);
      const newXP     = Math.max(0, currentXP + totalEarned);
      const oldRank   = getRank(currentXP).name;
      const newRank   = getRank(newXP).name;
      if (oldRank !== newRank) {
        const newRankData = getRank(newXP);
        setRankUpInfo({ from: oldRank, to: newRank, color: newRankData.color });
        playSound('rankup');
      } else {
        playSound('correct');
      }
      playSound('xp');

      setScore({ correct: currentScore.correct + 1, wrong: currentScore.wrong, streak: newStreak });
      setTotalXP(t => t + totalEarned);
      setXpGained(totalEarned);
      awardXP(totalEarned);

      triggerXPBurst(totalEarned, true);
      launchParticles();

      if (newStreak === 3)  addToast('🔥 3 in a row! On fire!', 'fire');
      if (newStreak === 5)  addToast('⚡ 5-streak! Unstoppable!', 'fire');
      if (newStreak === 7)  addToast('🌟 7-streak! Legendary! ×2.5 XP!', 'milestone');
      if (newStreak === 10) addToast('👑 10 streak! You\'re a LEGEND!', 'milestone');

      maybeRankPass(totalEarned);
      setPulseStat('correct');
      setTimeout(() => setPulseStat(null), 500);

      if (isDailyQ && !dcDone) {
        const dcBonus = 50;
        setDcDone(true);
        localStorage.setItem('mb_dc_date', today);
        setTimeout(() => {
          setTotalXP(t => t + dcBonus);
          awardXP(dcBonus);
          triggerXPBurst(dcBonus, true);
          addToast('🌟 Daily Challenge Complete! +50 XP bonus!', 'daily');
        }, 1200);
      }

    } else {
      // ── WRONG path ────────────────────────────────────────────
      const penalty = Math.round(calcXP(1, userLv, mode) / 4);
      playSound('wrong');

      // Reset consecutive correct
      consecCorrectRef.current = 0;

      // Adaptive: set / increment retry counter on this topic
      const wasAlreadyRetrying = retryTopicRef.current === topic;
      consecWrongRef.current = wasAlreadyRetrying ? consecWrongRef.current + 1 : 1;

      let newLv = userLv;

      if (consecWrongRef.current >= 2) {
        // 2+ wrong on same topic → lower difficulty
        newLv = Math.max(userLv - 1, 1);
        setUserLv(newLv);
        if (newLv < userLv) {
          setLvFeedback('down');
          addToast(`📉 Difficulty reduced to Level ${newLv} — keep practising!`, 'info');
        }
        if (consecWrongRef.current >= 3) {
          // 3 wrong in a row → clear retry (prevent infinite frustration loop)
          retryTopicRef.current  = null;
          setRetryTopic(null);
          consecWrongRef.current = 0;
          addToast(`💡 Moving on — review ${topic} in your next session.`, 'info');
        } else {
          // Still retry (but now at lower level)
          retryTopicRef.current = topic;
          setRetryTopic(topic);
          addToast(`🔁 Let's try ${topic} again at a lower level.`, 'info');
        }
      } else {
        // First wrong → set retry same topic
        retryTopicRef.current = topic;
        setRetryTopic(topic);
        addToast(`🔁 Let's practise ${topic} once more.`, 'info');
      }

      setScore({ correct: currentScore.correct, wrong: currentScore.wrong + 1, streak: 0 });
      setTotalXP(t => Math.max(0, t - penalty));
      setXpGained(-penalty);
      awardXP(-penalty);
      triggerXPBurst(-penalty, false);
      setPulseStat('wrong');
      setTimeout(() => setPulseStat(null), 500);
    }
  }, [userLv, mode, awardXP, triggerXPBurst, addToast, launchParticles, playSound, maybeRankPass, totalSolved, timerSec, maxTimeSec, isDailyQ, dcDone]);

  // ── SUBMIT handlers ──────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (answered || !userInput.trim() || !question) return;
    const result = evalAnswer(userInput, question.answer);
    const isCorrect = result === "correct";
    setEvaluation(result);
    setShowAns(true);
    setAnswered(true);
    recordOutcome(question.topic, isCorrect, score.streak, score, Date.now() - qStartRef.current);
  }, [answered, userInput, question, score, recordOutcome]);

  const handleOptionPick = useCallback((opt) => {
    if (answered || !question) return;
    setPickedOpt(opt);
    const isCorrect = evalAnswer(opt, question.answer) === "correct";
    setEvaluation(isCorrect ? "correct" : "wrong");
    setShowAns(true);
    setAnswered(true);
    recordOutcome(question.topic, isCorrect, score.streak, score, Date.now() - qStartRef.current);
  }, [answered, question, score, recordOutcome]);

  // ── DAILY CHALLENGE launcher ──────────────────────────────────
  const launchDailyChallenge = () => {
    if (!mode) {
      // Pick a random mode for daily challenge
      const dailyMode = MODES[new Date().getDate() % MODES.length].id;
      startMode(dailyMode);
      setTimeout(() => {
        setIsDailyQ(true);
      }, 100);
    } else {
      // Already in a mode — set the current question as daily
      setIsDailyQ(true);
      addToast('🌟 Daily Challenge active! Solve for 3× bonus XP!', 'daily');
    }
  };

  // ── DERIVED ──────────────────────────────────────────────────
  const nextRank       = RANKS.find(r => r.xp > totalXP);
  const xpToNextRank   = nextRank ? nextRank.xp - totalXP : 0;
  const todayGoal      = 10; // questions per day
  const todayPct       = Math.min((questionsToday / todayGoal) * 100, 100);
  const timerPct       = maxTimeSec > 0 && timerSec !== null ? (timerSec / maxTimeSec) * 100 : 100;
  const timerUrgent    = timerSec !== null && timerSec <= 10;
  const CIRCUMFERENCE  = 2 * Math.PI * 15;

  // Timer stroke color
  const timerColor = timerUrgent
    ? '#ef4444'
    : timerSec !== null && timerSec < maxTimeSec * 0.4
      ? '#fbbf24'
      : '#3b82f6';

  // Combo class
  const streak = score.streak;
  const comboClass = streak >= 7 ? 'combo-7' : streak >= 5 ? 'combo-5' : streak >= 3 ? 'combo-3' : null;

  // ── MENU ─────────────────────────────────────────────────────
  if (!mode) {
    const solvedNextMile = (() => {
      const MILES = [5,10,25,50,100,250,500,1000];
      return MILES.find(m => m > totalSolved) || 1000;
    })();
    const milesPct = Math.min((totalSolved / solvedNextMile) * 100, 100);

    return (
      <>
        <style>{STYLE}</style>
        <div data-theme={theme}>
          <div className="grid-bg" />
          {/* Controls: theme + sound */}
          <div className="top-controls">
            <button className={`ctrl-btn${soundEnabled ? '' : ' sound-off'}`} onClick={toggleSound}>
              {soundEnabled ? '🔔' : '🔕'} {soundEnabled ? 'SFX ON' : 'SFX OFF'}
            </button>
            <button className="ctrl-btn" onClick={toggleTheme}>
              {theme === "dark" ? "☀ LIGHT" : "☾ DARK"}
            </button>
          </div>

          {/* Particles canvas */}
          <canvas ref={canvasRef} className="particles-canvas" />

          {/* XP burst overlay */}
          <div className="xp-burst-portal">
            {xpBursts.map(b => (
              <div key={b.id} className="xp-burst"
                style={{
                  left: `${b.x}%`, top: `${b.y}%`,
                  color: b.isCorrect ? '#10b981' : '#f87171',
                  fontSize: b.amount > 30 ? '28px' : '22px',
                }}>
                {b.isCorrect ? `+${b.amount} XP` : `${b.amount} XP`}
              </div>
            ))}
          </div>

          {/* Toasts */}
          <div className="toast-container">
            {toasts.map(t => (
              <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
            ))}
          </div>

          <div className="app">
            <div className={`menu-wrap ${
              screenState === "exit" ? `screen-exit-${animDir}` :
              screenState === "enter" ? `screen-enter-${animDir}` : ""
            }`}>
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

              {/* Daily login streak */}
              {dailyStreak > 0 && (
                <div className="streak-banner">
                  <div className="streak-left">
                    <span className="streak-fire">🔥</span>
                    <div className="streak-info">
                      <div className="streak-title">Daily Streak</div>
                      <div className="streak-days">{dailyStreak} {dailyStreak === 1 ? 'day' : 'days'}</div>
                    </div>
                  </div>
                  <div className="streak-right">
                    {dailyStreak >= 7 ? '🏆 On fire!' : dailyStreak >= 3 ? '⚡ Keep going!' : '✔ Great start!'}<br />
                    {totalSolved} total completed
                  </div>
                </div>
              )}

              {/* Daily Challenge card */}
              <div
                className={`daily-card${dcDone ? ' completed' : ''}`}
                onClick={() => !dcDone && launchDailyChallenge()}
              >
                <div className="daily-left">
                  <span className="daily-icon">{dcDone ? '✅' : '⭐'}</span>
                  <div>
                    <div className="daily-title">Daily Challenge</div>
                    <div className="daily-desc">{dcDone ? 'Completed today — come back tomorrow!' : 'Solve for +50 XP bonus · Resets midnight'}</div>
                  </div>
                </div>
                <div className={`daily-badge${dcDone ? ' done' : ''}`}>
                  {dcDone ? '✓ DONE' : '+50 XP'}
                </div>
              </div>

              {/* Solved milestone meter */}
              <div className="solved-meter">
                <span>{totalSolved} completed</span>
                <div className="solved-meter-bar">
                  <div className="solved-meter-fill" style={{ width: `${milesPct}%` }} />
                </div>
                <span>goal: {solvedNextMile}</span>
              </div>

              {/* Mode cards */}
              {MODES.map(md => (
                <button
                  key={md.id}
                  className="mode-card"
                  style={{ color: md.accent }}
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
                  <div className="mode-topics" style={{ color: md.accent, opacity: 0.55 }}>{md.topics}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── GAME ──────────────────────────────────────────────────────
  const evClass     = evaluation ? `ev-${evaluation}` : "";
  const streakLabel = streakMsg(score.streak);

  return (
    <>
      <style>{STYLE}</style>
      <div data-theme={theme}>
        <div className="grid-bg" />

        {/* Controls */}
        <div className="top-controls">
          <button className={`ctrl-btn${soundEnabled ? '' : ' sound-off'}`} onClick={toggleSound}>
            {soundEnabled ? '🔔' : '🔕'}
          </button>
          <button className="ctrl-btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>

        {/* Particles canvas */}
        <canvas ref={canvasRef} className="particles-canvas" />

        {/* XP burst portal */}
        <div className="xp-burst-portal">
          {xpBursts.map(b => (
            <div key={b.id} className="xp-burst"
              style={{
                left: `${b.x}%`, top: `${b.y}%`,
                color: b.isCorrect ? '#10b981' : '#f87171',
                fontSize: b.amount > 30 ? '28px' : '22px',
              }}>
              {b.isCorrect ? `+${b.amount} XP` : `${b.amount} XP`}
            </div>
          ))}
        </div>

        {/* Toast container */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
          ))}
        </div>

        {/* Rank pass banner */}
        {rankPassBanner && (
          <div className="rank-pass-banner">{rankPassBanner}</div>
        )}

        {/* Rank-up modal */}
        {rankUpInfo && (
          <div className="rankup-overlay" onClick={() => setRankUpInfo(null)}>
            <div className="rankup-card" onClick={e => e.stopPropagation()}>
              {/* Particle decorations */}
              <div className="ru-particles">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="ru-particle" style={{
                    left: '50%', top: '40%',
                    background: rankUpInfo.color,
                    '--dx': `${(Math.random() - 0.5) * 200}px`,
                    '--dy': `${-(Math.random() * 160 + 40)}px`,
                    animationDelay: `${i * 0.04}s`,
                    opacity: Math.random() * 0.6 + 0.4,
                  }} />
                ))}
              </div>
              <span className="rankup-emoji">🏆</span>
              <div className="rankup-label">Rank Up!</div>
              <div className="rankup-title" style={{ color: rankUpInfo.color }}>
                {rankUpInfo.to}
              </div>
              <div className="rankup-sub">
                You leveled up from <strong>{rankUpInfo.from}</strong> to <strong style={{ color: rankUpInfo.color }}>{rankUpInfo.to}</strong>!<br />
                Your dedication is paying off. Keep solving! 🚀
              </div>
              <button
                className="rankup-close"
                style={{
                  background: `${rankUpInfo.color}14`,
                  borderColor: `${rankUpInfo.color}44`,
                  color: rankUpInfo.color,
                }}
                onClick={() => setRankUpInfo(null)}
              >
                Let's keep going →
              </button>
            </div>
          </div>
        )}

        <div className="app">
          <div className={`game-wrap fade-wrap ${
            screenState === "exit" ? `screen-exit-${animDir}` :
            screenState === "enter" ? `screen-enter-${animDir}` : ""
          }`} style={{ opacity: anim ? 0.25 : 1 }}>

            {/* Top bar */}
            <div className="top-bar">
              <button className="back-btn" onClick={() => {
                setAnimDir("back");
                setScreenState("exit");
                setTimeout(() => {
                  setMode(null);
                  setScreenState("enter");
                  setTimeout(() => setScreenState("idle"), 350);
                }, 230);
              }}>← Modes</button>
              <div className="mode-badge" style={{ color: m.accent }}>{m.label}</div>
              {/* Difficulty level pill — colour shifts green→amber→red as level rises */}
              <div className="level-badge" style={{
                color:       userLv <= 3 ? '#10b981' : userLv <= 6 ? '#f59e0b' : userLv <= 8 ? '#ef4444' : '#a855f7',
                borderColor: userLv <= 3 ? 'rgba(16,185,129,0.3)' : userLv <= 6 ? 'rgba(245,158,11,0.3)' : userLv <= 8 ? 'rgba(239,68,68,0.3)' : 'rgba(168,85,247,0.3)',
                background:  userLv <= 3 ? 'rgba(16,185,129,0.08)' : userLv <= 6 ? 'rgba(245,158,11,0.08)' : userLv <= 8 ? 'rgba(239,68,68,0.08)' : 'rgba(168,85,247,0.08)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {lvFeedback === 'up'   && <span style={{fontSize:'0.7rem'}}>📈</span>}
                {lvFeedback === 'down' && <span style={{fontSize:'0.7rem'}}>📉</span>}
                LV {userLv}/10
              </div>
              {dailyStreak > 1 && (
                <div className="game-streak-pill">🔥 {dailyStreak}d</div>
              )}
            </div>

            {/* Adaptive status bar — shows when retrying a topic */}
            {retryTopic && (
              <div style={{
                width: '100%', marginBottom: 12, padding: '10px 16px',
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: 'var(--font-b)', fontSize: '0.8rem', color: '#f87171',
              }}>
                <span style={{fontSize:'1rem'}}>🔁</span>
                <div>
                  <span style={{fontWeight:800}}>Reinforcing: </span>
                  <span style={{fontWeight:600}}>{retryTopic}</span>
                  <span style={{opacity:0.7, marginLeft:6}}>— answer correctly to continue</span>
                </div>
                <div style={{
                  marginLeft:'auto', fontSize:'0.68rem', fontWeight:700,
                  background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)',
                  padding:'2px 8px', borderRadius:99,
                }}>
                  {consecWrongRef.current >= 2 ? `${consecWrongRef.current} misses` : '1 miss'}
                </div>
              </div>
            )}

            {/* Daily questions today bar */}
            <div className="today-bar">
              <span className="today-bar-label">Today</span>
              <div className="today-bar-track">
                <div className="today-bar-fill" style={{ width: `${todayPct}%` }} />
              </div>
              <span className="today-bar-count">{questionsToday}/{todayGoal} questions</span>
            </div>

            {/* XP Bar */}
            <div className="xp-section">
              <div className="xp-top">
                <span className="rank-name" style={{ color: rankInfo.color }}>{rankInfo.name}</span>
                <span className="xp-nums">{totalXP} XP total</span>
              </div>
              <div className="xp-bar-bg">
                <div className="xp-bar-fill" style={{ width: `${rankInfo.pct}%`, background: rankInfo.color }} />
              </div>
              <div className="next-rank-pill">
                {nextRank ? (
                  <>
                    <span><strong>{xpToNextRank} XP</strong> to reach <strong style={{ color: getRank(nextRank.xp).color }}>{nextRank.name}</strong></span>
                    <span>{Math.round(rankInfo.pct)}%</span>
                  </>
                ) : (
                  <span style={{ color: '#a855f7' }}>👑 MAX RANK — Legend</span>
                )}
              </div>
            </div>

            {/* Combo display */}
            {comboClass && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <div className={`combo-display ${comboClass}`}>
                  {streak >= 7 ? '🌟' : streak >= 5 ? '⚡' : '🔥'} ×{streak} COMBO
                  {streak >= 3 && ` · ×${streak >= 7 ? '2.5' : streak >= 5 ? '2' : '1.5'} XP`}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="stats-row">
              <div
                className={`stat-box${pulseStat === 'correct' ? ' pulse' : ''}`}
                style={{ borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.06)" }}>
                <div className="stat-num" style={{ color: "#10b981" }}>{score.correct}</div>
                <div className="stat-label">Mastered</div>
              </div>
              <div
                className={`stat-box${pulseStat === 'wrong' ? ' pulse' : ''}`}
                style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
                <div className="stat-num" style={{ color: "#ef4444" }}>{score.wrong}</div>
                <div className="stat-label">Review</div>
              </div>
              <div className="stat-box" style={{ borderColor: "rgba(251,191,36,0.25)", background: "rgba(251,191,36,0.06)" }}>
                <div className="stat-num" style={{ color: "#fbbf24" }}>
                  {score.streak > 0 ? `🔥${score.streak}` : score.streak}
                </div>
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

            {/* Options toggle */}
            <div className="options-toggle-row">
              <div>
                <div className="options-toggle-label">Options (MCQ)</div>
                <div className="options-toggle-desc">
                  {useOptions ? "4-choice MCQ · −¼ XP on wrong" : "Free-type answer mode"}
                </div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={useOptions} onChange={e => handleToggleOptions(e.target.checked)} />
                <span className="toggle-track" />
              </label>
            </div>

            {/* Daily challenge active banner */}
            {isDailyQ && !dcDone && (
              <div className="dc-active-banner">
                ⭐ Daily Challenge · Earn +50 XP bonus for completing this!
              </div>
            )}

            {/* Question card */}
            {question && (
              <div className={`q-card ${evClass}${isDailyQ && !dcDone ? ' daily-glow' : ''}`}
                   style={{ borderColor: !evaluation ? m.border : undefined }}>
                <div className="q-card-header">
                  <div>
                    <div className="q-topic" style={{ color: m.accent }}>{question.topic}</div>
                  </div>
                  {/* Timer ring */}
                  {!answered && timerSec !== null && (
                    <div className="timer-wrap">
                      <div className="timer-ring">
                        <svg viewBox="0 0 36 36" width="38" height="38">
                          <circle className="timer-ring-bg" cx="18" cy="18" r="15" />
                          <circle
                            className="timer-ring-fill"
                            cx="18" cy="18" r="15"
                            stroke={timerColor}
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={CIRCUMFERENCE * (1 - timerPct / 100)}
                          />
                        </svg>
                        <span className={`timer-num${timerUrgent ? ' urgent' : ''}`}>
                          {timerSec}
                        </span>
                      </div>
                      <div className="timer-label">secs</div>
                    </div>
                  )}
                </div>
                <div className="q-text">{question.question}</div>
              </div>
            )}

            {/* Input area */}
            {!answered && question && (
              <>
                <div className="hint-row">
                  <button className="hint-btn" onClick={() => setShowHint(h => !h)}>
                    {showHint ? "▲ Hide hint" : "💡 Show hint"}
                  </button>
                  {showHint && <div className="hint-box">{question.hint}</div>}
                </div>

                {useOptions ? (
                  <div className="options-grid">
                    {options.map((opt, i) => (
                      <button key={opt + i} className="option-btn" onClick={() => handleOptionPick(opt)} disabled={answered}>
                        <span className="option-label">{["A","B","C","D"][i]}</span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="answer-row">
                      <input
                        ref={inputRef}
                        className={`answer-input${evaluation ? ` ev-${evaluation}` : ""}`}
                        type="text"
                        placeholder="Type your answer…"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        autoComplete="off" spellCheck={false}
                      />
                      <button className="submit-btn" onClick={handleSubmit} disabled={!userInput.trim()}>
                        Check →
                      </button>
                    </div>
                    <div className="enter-hint">↵ Press Enter to submit</div>
                  </>
                )}
              </>
            )}

            {/* Answer revealed */}
            {showAns && question && (
              <>
                {evaluation && (
                  <div className={`feedback-banner ${evClass}`}>
                    <span>
                      {evaluation === "correct" && `✓ Mastered!${streakLabel ? "  " + streakLabel : ""}`}
                      {evaluation === "wrong"   && "✗ Needs Review — study the steps below"}
                      {evaluation === "partial" && "◑ Partially correct — check all parts"}
                    </span>
                    <div className="feedback-right">
                      <span className="feedback-xp">
                        {evaluation === "correct" && xpGained != null && (
                          <span style={{ color: '#10b981' }}>+{xpGained} XP{score.streak >= 3 ? ` · 🔥×${score.streak}` : ""}</span>
                        )}
                        {evaluation === "wrong" && xpGained != null && xpGained < 0 && (
                          <span style={{ color: "#f87171" }}>{xpGained} XP</span>
                        )}
                      </span>
                      {speedBonus && speedBonus > 0 && (
                        <span className="speed-badge">⚡ +{speedBonus} speed bonus</span>
                      )}
                    </div>
                  </div>
                )}

                {/* MCQ highlight */}
                {useOptions && options.length > 0 && (
                  <div className="options-grid" style={{ marginBottom: 12 }}>
                    {options.map((opt, i) => {
                      const isCorrectOpt = evalAnswer(opt, question.answer) === "correct";
                      const isPickedOpt  = opt === pickedOpt;
                      let cls = "option-btn";
                      if (isCorrectOpt) cls += " opt-correct";
                      else if (isPickedOpt && !isCorrectOpt) cls += " opt-wrong";
                      return (
                        <button key={opt + i} className={cls} disabled>
                          <span className="option-label">{["A","B","C","D"][i]}</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Answer card */}
                <div className="ans-card">
                  {/* ── Answer header ── */}
                  <div className="ans-header">
                    <div className="ans-label">Correct Answer</div>
                    <div className="ans-value" style={{ color: m.accent }}>{question.answer}</div>
                  </div>

                  {/* ── Step-by-step solution ── */}
                  <div className="steps-section">
                    <div className="ans-exp-label">Step-by-Step Solution</div>
                    <div className="step-list">
                      {(question.steps || question.explanation?.split("\n").filter(l => l.trim()) || []).map((step, i, arr) => {
                        // Classify step type for colour-coding
                        const isLast    = i === arr.length - 1;
                        const isFormula = /formula|rule|identity|law|property|use |let |definition/i.test(step);
                        const isResult  = isLast || /^(answer|∴|therefore|=\s*[^=]+$|result)/i.test(step.trim());
                        const cls = isResult
                          ? "step-row step-result"
                          : isFormula
                          ? "step-row step-formula"
                          : "step-row";
                        return (
                          <div key={i} className={cls}>
                            <div className="step-num">{i + 1}</div>
                            <div className="step-text">{step}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

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
                    Next Question → <span style={{ opacity: 0.5, fontSize: '11px' }}>Enter</span>
                  </button>
                )}

                {/* Discuss with Others — only shown on wrong/partial answer */}
                {answered && (evaluation === "wrong" || evaluation === "partial") && (
                  <button
                    className="btn-discuss"
                    onClick={() => {
                      if (question && typeof window !== 'undefined' && window.openDiscussModal) {
                        window.openDiscussModal({
                          question:   question.question,
                          answer:     question.answer,
                          topic:      question.topic,
                          hint:       question.hint,
                          steps:      question.steps || [],
                          options:    options.length ? options : null,
                          userAnswer: pickedOpt || userInput || null,
                        });
                      } else {
                        alert("Open the NeuroForge chat to use Discuss!");
                      }
                    }}
                    style={{
                      marginTop: 10,
                      width: "100%",
                      padding: "13px 18px",
                      background: "linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.15))",
                      border: "1.5px solid rgba(139,92,246,.4)",
                      borderRadius: 14,
                      color: "#A78BFA",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      letterSpacing: "0.01em",
                      transition: "all .2s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.25))"; e.currentTarget.style.borderColor = "rgba(139,92,246,.7)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.15))"; e.currentTarget.style.borderColor = "rgba(139,92,246,.4)"; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Discuss with Others
                  </button>
                )}
              </>
            )}


            {/* Adaptive progress footer */}
            {total > 0 && (
              <div style={{
                marginTop: 16,
                background: 'var(--bg-card)',
                border: '1px solid var(--border2)',
                borderRadius: 12,
                padding: '14px 18px',
              }}>
                {/* Level-up progress bar */}
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  fontFamily:'var(--font-b)', fontSize:'0.7rem',
                  color:'var(--ts)', marginBottom: 8, fontWeight:700,
                }}>
                  <span>Level-up progress</span>
                  <span style={{
                    color: userLv <= 3 ? '#10b981' : userLv <= 6 ? '#f59e0b' : userLv <= 8 ? '#ef4444' : '#a855f7',
                    fontWeight: 800,
                  }}>
                    {consecCorrectRef.current}/3 correct in a row needed
                  </span>
                </div>
                <div style={{ height: 5, background:'var(--bg-input)', borderRadius: 3, overflow:'hidden', marginBottom: 12 }}>
                  <div style={{
                    height:'100%', borderRadius: 3,
                    width: `${(Math.min(consecCorrectRef.current, 3) / 3) * 100}%`,
                    background: userLv <= 3 ? '#10b981' : userLv <= 6 ? '#f59e0b' : userLv <= 8 ? '#ef4444' : '#a855f7',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                {/* Stats row */}
                <div style={{
                  display:'flex', gap:16, flexWrap:'wrap',
                  fontFamily:'var(--font-b)', fontSize:'0.7rem', color:'var(--tm)',
                }}>
                  <span><b style={{color:'var(--ts)'}}>{total}</b> completed</span>
                  <span><b style={{color:'var(--ts)'}}>{Math.round((score.correct / total) * 100)}%</b> accuracy</span>
                  <span><b style={{color:'var(--ts)'}}>Lv {userLv}/10</b> difficulty</span>
                  {weakTopics.length > 0 && <span>🧠 adaptive focus: {weakTopics.length} topic{weakTopics.length>1?'s':''}</span>}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

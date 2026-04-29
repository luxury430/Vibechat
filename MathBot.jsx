import { useState, useCallback, useRef, useEffect } from "react";

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
  const b = rng(2, 8), d = rng(2, 6);
  const x = rng(10, 25);
  const sumNum = d * (x - b);
  const a = rng(1, sumNum - 1);
  const c = sumNum - a;
  return {
    question: `Solve for x:\n\n${a}/(x − ${b})  +  ${c}/(x − ${b})  =  ${d}`,
    answer:   `x = ${x}`,
    hint:     `Combine the fractions since they share a common denominator, then cross-multiply.`,
    steps: [
      `Since denominators are the same, combine numerators:`,
      `(${a} + ${c}) / (x − ${b}) = ${d}`,
      `${sumNum} / (x − ${b}) = ${d}`,
      `${sumNum} = ${d}(x − ${b})`,
      `${sumNum / d} = x − ${b}`,
      `x = ${(sumNum / d) + b}`,
    ],
    topic: "Rational Equations",
  };
};

const genRatio = (lv) => {
  const a = rng(2, 5), b = rng(3, 7), c = rng(4, 9);
  const diff = Math.abs(a - c);
  const m = rng(4, 12);
  const realDiff = diff * m;
  const total = (a + b + c) * m;
  return {
    question: `A sum of money is divided between A, B, and C in the ratio ${a}:${b}:${c}.\nIf the difference between A's share and C's share is ${realDiff},\nwhat is the TOTAL amount of money?`,
    answer:   `${total}`,
    hint:     `The difference in ratio parts is ${diff}. This equals ${realDiff}. Find the value of 1 part.`,
    steps: [
      `Ratio is ${a}x : ${b}x : ${c}x`,
      `Difference between A and C = |${a}x − ${c}x| = ${diff}x`,
      `${diff}x = ${realDiff}  →  x = ${m}`,
      `Total parts = ${a} + ${b} + ${c} = ${a + b + c}`,
      `Total amount = ${a + b + c} × ${m} = ${total}`,
    ],
    topic: "Compound Ratios",
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
  const P = pick([5000, 10000, 25000]);
  const R = pick([8, 12, 16, 20]);
  const A = +(P * Math.pow(1 + R / 200, 3)).toFixed(2); // 1.5 years semi-annually
  return {
    question: `A principal of ₹${P} is invested at ${R}% p.a.\ncompounded HALF-YEARLY for 1.5 years.\nFind the final Amount.`,
    answer:   `${A}`,
    hint:     `Rate per half-year is ${R/2}%. Number of periods (1.5 years) is 3. Use A = P(1 + r/100)^n.`,
    steps: [
      `Half-yearly rate = ${R}% / 2 = ${R / 2}%`,
      `Time periods (n) in 1.5 years = 3`,
      `A = ${P} × (1 + ${R / 2}/100)³`,
      `A = ${P} × ${(1 + R / 200).toFixed(4)}³ = ${A}`,
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
  const n = rng(8, 15);
  const mean1 = rng(40, 80);
  const sum1 = n * mean1;
  const dropped = rng(mean1 + 10, mean1 + 40);
  const sum2 = sum1 - dropped;
  const mean2 = +(sum2 / (n - 1)).toFixed(2);
  return {
    question: `The mean of ${n} numbers is ${mean1}.\nIf one number, ${dropped}, is removed from the set,\nwhat is the exact new mean?`,
    answer:   `${mean2}`,
    hint:     `Find the original sum, subtract the removed number, and divide by the new count (${n-1}).`,
    steps: [
      `Original Sum = ${n} × ${mean1} = ${sum1}`,
      `New Sum = ${sum1} − ${dropped} = ${sum2}`,
      `New Count = ${n} − 1 = ${n - 1}`,
      `New Mean = ${sum2} ÷ ${n - 1} = ${mean2}`,
    ],
    topic: "Weighted Statistics",
  };
};

// ── INTERMEDIATE ──────────────────────────────────────────────────

const genQuadratic = (lv) => {
  // Vieta's on Cubics
  const r1 = rng(-3, 4), r2 = rng(-4, 3), r3 = rng(1, 5);
  const sum = r1 + r2 + r3;
  const prodPair = r1*r2 + r2*r3 + r3*r1;
  const prod = r1 * r2 * r3;
  if (prod === 0) {
    // fallback: safe static cubic
    const [s1,s2,s3] = [2,3,1];
    const sf = s1+s2+s3, pp = s1*s2+s2*s3+s3*s1, pr = s1*s2*s3;
    return {
      question: `Let α, β, γ be the roots of:\n\nx³ − ${sf}x² + ${pp}x − ${pr} = 0\n\nFind the exact value of:  1/α + 1/β + 1/γ`,
      answer:   `${pp}/${pr}`,
      hint:     `Use Vieta's Formulas for a cubic. 1/α + 1/β + 1/γ = (αβ + βγ + γα) / (αβγ).`,
      steps: [
        `From Vieta's formulas for x³ − ${sf}x² + ${pp}x − ${pr} = 0:`,
        `Sum of pairwise products (αβ + βγ + γα) = ${pp}`,
        `Product of roots (αβγ) = ${pr}`,
        `1/α + 1/β + 1/γ = ${pp} / ${pr}`,
      ],
      topic: "Vieta's Formulas (Cubics)",
    };
  }
  const b = -sum, c = prodPair, d = -prod;
  const fmtT = (coef, pwr) => coef === 0 ? "" : (coef > 0 ? `+${coef}${pwr}` : `${coef}${pwr}`);
  const eq = `x³ ${fmtT(b,'x²')} ${fmtT(c,'x')} ${fmtT(d,'')} = 0`.replace(/^\+/, '').replace(/  +/g,' ');
  const num = c, den = -d;
  const g = gcd(Math.abs(num), Math.abs(den));
  const ansStr = (den !== 0) ? (g === Math.abs(den) ? `${num/den}` : `${num/g}/${den/g}`) : "undefined";
  return {
    question: `Let α, β, γ be the roots of the cubic equation:\n\n${eq}\n\nFind the exact value of:  1/α + 1/β + 1/γ`,
    answer:   ansStr,
    hint:     `Use Vieta's Formulas for a cubic. 1/α + 1/β + 1/γ = (αβ + βγ + γα) / (αβγ).`,
    steps: [
      `From Vieta's formulas for x³ + bx² + cx + d = 0:`,
      `Sum of pairwise products (αβ + βγ + γα) = c/a = ${c}`,
      `Product of roots (αβγ) = −d/a = ${-d}`,
      `1/α + 1/β + 1/γ = (αβ + βγ + γα) / (αβγ)`,
      `= ${c} / ${-d} = ${ansStr}`,
    ],
    topic: "Vieta's Formulas (Cubics)",
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
  // Bayes' Theorem (False Positives)
  const prevalence = pick([1, 2, 5]);
  const sensitivity = pick([90, 95, 99]);
  const falsePos = pick([5, 10]);
  const pDisease = prevalence / 100;
  const pNoDisease = 1 - pDisease;
  const pPosGivenDisease = sensitivity / 100;
  const pPosGivenNoDisease = falsePos / 100;
  const pPos = (pDisease * pPosGivenDisease) + (pNoDisease * pPosGivenNoDisease);
  const pDiseaseGivenPos = (pDisease * pPosGivenDisease) / pPos;
  const ansPct = +(pDiseaseGivenPos * 100).toFixed(2);
  return {
    question: `A disease affects ${prevalence}% of a population.\nA test is ${sensitivity}% accurate for those who have it (True Positive).\nHowever, it has a ${falsePos}% False Positive rate for healthy people.\nIf a person tests POSITIVE, what is the probability (in %) they actually have the disease?`,
    answer:   `${ansPct}%`,
    hint:     `Use Bayes' Theorem: P(D|+) = P(+|D)P(D) / [P(+|D)P(D) + P(+|No D)P(No D)]`,
    steps: [
      `P(Disease) = ${pDisease}, P(No Disease) = ${pNoDisease}`,
      `P(+ | Disease) = ${pPosGivenDisease}, P(+ | No Disease) = ${pPosGivenNoDisease}`,
      `Total P(+) = (${pDisease} × ${pPosGivenDisease}) + (${pNoDisease} × ${pPosGivenNoDisease}) = ${pPos.toFixed(4)}`,
      `P(Disease | +) = (${(pDisease * pPosGivenDisease).toFixed(4)}) / ${pPos.toFixed(4)} = ${pDiseaseGivenPos.toFixed(4)}`,
      `Convert to percentage = ${ansPct}%`,
    ],
    topic: "Bayesian Probability",
  };
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
  // Remainder theorem with two divisors → linear remainder via simultaneous equations
  const a  = rng(2, 5);
  const rem1 = rng(3, 10);
  const rem2 = rng(1, rem1 - 1);
  // Ensure integer slope: (rem1 - rem2) must be even w.r.t. 2a
  // We'll use 2*a as denominator; for cleaner answers pick rem1 - rem2 divisible by 2
  const rem1adj = rem1 % 2 === 0 ? rem1 : rem1 + 1;
  const rem2adj = rem2 % 2 === 0 ? rem2 : rem2 - 1 < 0 ? rem2 + 1 : rem2;
  const slope = (rem1adj - rem2adj) / (2 * a);
  const intercept = (rem1adj + rem2adj) / 2;
  return {
    question: `When a polynomial P(x) is divided by (x − ${a}), the remainder is ${rem1adj}.\nWhen P(x) is divided by (x + ${a}), the remainder is ${rem2adj}.\nFind the remainder when P(x) is divided by (x² − ${a*a}).\n(Express your answer in the form: mx + b)`,
    answer:   `${slope}x + ${intercept}`,
    hint:     `The remainder on dividing by a quadratic is linear: R(x) = mx + c. Set up a system: R(${a}) = ${rem1adj} and R(−${a}) = ${rem2adj}.`,
    steps: [
      `By the Remainder Theorem: P(${a}) = ${rem1adj} and P(−${a}) = ${rem2adj}.`,
      `Since we divide by a quadratic (x² − ${a*a}), the remainder is linear: R(x) = mx + c.`,
      `Two equations:`,
      `① m(${a}) + c = ${rem1adj}`,
      `② m(−${a}) + c = ${rem2adj}`,
      `Subtract ② from ①: ${2*a}m = ${rem1adj - rem2adj} → m = ${slope}`,
      `Add ① and ②: 2c = ${rem1adj + rem2adj} → c = ${intercept}`,
      `R(x) = ${slope}x + ${intercept}`,
    ],
    topic: "Advanced Polynomials",
  };
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
  // De Moivre's Theorem: (1+i)^n using polar form
  const n = pick([4, 6, 8]);
  // r = sqrt(2), theta = pi/4. r^n = 2^(n/2), angle = n*pi/4
  const r_n = Math.pow(Math.sqrt(2), n);
  const angle = (n * Math.PI) / 4;
  const real = Math.round(r_n * Math.cos(angle));
  const imag = Math.round(r_n * Math.sin(angle));
  const ansStr = imag === 0
    ? `${real}`
    : real === 0
      ? `${imag}i`
      : `${real} ${imag > 0 ? "+" : "−"} ${Math.abs(imag)}i`;
  return {
    question: `Using De Moivre's Theorem, evaluate:\n\n(1 + i)${toSup(n)}`,
    answer:   ansStr,
    hint:     `Convert 1+i to polar form: r = √2, θ = π/4. Then apply (r∠θ)ⁿ = rⁿ∠(nθ).`,
    steps: [
      `z = 1 + i.  Modulus r = √(1² + 1²) = √2.  Argument θ = tan⁻¹(1/1) = π/4`,
      `By De Moivre's Theorem: zⁿ = rⁿ(cos(nθ) + i sin(nθ))`,
      `rⁿ = (√2)${toSup(n)} = 2${toSup(n/2)} = ${r_n}`,
      `nθ = ${n} × π/4 = ${n}/4 · π`,
      `z${toSup(n)} = ${r_n}(cos(${n}π/4) + i sin(${n}π/4))`,
      `= ${r_n}(${Math.cos(angle).toFixed(3)} + i·${Math.sin(angle).toFixed(3)})`,
      `= ${ansStr}`,
    ],
    topic: "De Moivre's Theorem",
  };
};

const genMatrices = (lv) => {
  // 3x3 Determinant via cofactor expansion
  const a = rng(1,3), b = rng(-2,2), c = rng(0,2);
  const d = rng(-2,2), e = rng(1,4), f = rng(-1,2);
  const g = rng(0,3), h = rng(-2,2), ii = rng(1,3);
  const det = a*(e*ii - f*h) - b*(d*ii - f*g) + c*(d*h - e*g);
  return {
    question: `Calculate the determinant of the 3×3 matrix:\n\n[ ${a}   ${b}   ${c} ]\n[ ${d}   ${e}   ${f} ]\n[ ${g}   ${h}   ${ii} ]`,
    answer:   `${det}`,
    hint:     `Use cofactor expansion along the top row: a(ei−fh) − b(di−fg) + c(dh−eg).`,
    steps: [
      `Expand along the first row:`,
      `= ${a} × det([${e} ${f} | ${h} ${ii}]) − (${b}) × det([${d} ${f} | ${g} ${ii}]) + ${c} × det([${d} ${e} | ${g} ${h}])`,
      `= ${a}(${e*ii} − ${f*h}) − (${b})(${d*ii} − ${f*g}) + ${c}(${d*h} − ${e*g})`,
      `= ${a*(e*ii - f*h)} − (${b*(d*ii - f*g)}) + ${c*(d*h - e*g)}`,
      `= ${det}`,
    ],
    topic: "3×3 Determinants",
  };
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
  // Legendre's Formula: trailing zeros in N!
  const n = pick([100, 250, 500, 1000]);
  let zeros = 0;
  let temp = n;
  const steps_arr = [];
  let pw = 5;
  while (temp >= 5) {
    const fl = Math.floor(temp / 5);
    zeros += fl;
    steps_arr.push(`⌊${n}/${pw}⌋ = ${fl}`);
    temp = Math.floor(temp / 5);
    pw *= 5;
  }
  return {
    question: `Using Legendre's Formula, find the exact number of trailing zeros\nin the decimal expansion of  ${n}!  (${n} factorial).`,
    answer:   `${zeros}`,
    hint:     `Trailing zeros come from factors of 10 = 2 × 5. Since 2s are plentiful, count the total powers of 5 using: ⌊N/5⌋ + ⌊N/25⌋ + ⌊N/125⌋ + ...`,
    steps: [
      `Trailing zeros = total factors of 5 in ${n}! (Legendre's Formula)`,
      ...steps_arr,
      `Total = ${steps_arr.map((s,i) => Math.floor(n / Math.pow(5, i+1))).join(" + ")} = ${zeros} trailing zeros`,
    ],
    topic: "Legendre's Formula",
  };
};

const genCombinatorics = (lv) => {
  // Derangements (Subfactorials) — no one gets their own item back
  const n = pick([4, 5, 6]);
  const derangements = { 4: 9, 5: 44, 6: 265 }[n];
  return {
    question: `${n} mathematicians each write their name on a card and place it in a hat.\nEach person draws one card at random.\nIn how many ways can it happen that NOBODY draws their own name? (Derangement, !${n})`,
    answer:   `${derangements}`,
    hint:     `Use the Derangement formula: !n = n! × Σ(k=0 to n) [(-1)^k / k!] = n! × (1/0! − 1/1! + 1/2! − 1/3! + ... ± 1/n!).`,
    steps: [
      `This is a Derangement problem: !${n} (subfactorial of ${n}).`,
      `!n = n! × (1/0! − 1/1! + 1/2! − 1/3! + ... + (−1)^n/n!)`,
      `!${n} = ${fact(n)} × (1 − 1 + 1/2 − 1/6 + 1/24${n >= 5 ? " − 1/120" : ""}${n >= 6 ? " + 1/720" : ""})`,
      `= ${fact(n)} × ${(derangements / fact(n)).toFixed(6)}`,
      `= ${derangements}`,
    ],
    topic: "Derangements",
  };
};

const genAdvAlgebra = (lv) => {
  // Infinite nested radical: x = √(c + √(c + ...)) → x² = c + x → x² - x - c = 0
  const a = rng(2, 10);
  const c = a * (a + 1); // ensures integer answer a+1
  return {
    question: `Evaluate the infinite nested radical expression:\n\nx = √( ${c} + √( ${c} + √( ${c} + ··· ) ) )`,
    answer:   `${a + 1}`,
    hint:     `Let the whole expression equal x. Then notice x = √(${c} + x). Square both sides and solve the resulting quadratic.`,
    steps: [
      `Let x = √( ${c} + √( ${c} + ··· ) )`,
      `The nested expression inside equals x itself (self-similar structure):`,
      `x = √( ${c} + x )`,
      `Square both sides: x² = ${c} + x`,
      `Rearrange: x² − x − ${c} = 0`,
      `Factor: (x − ${a+1})(x + ${a}) = 0`,
      `x = ${a+1} or x = −${a}`,
      `Since the principal square root is positive: x = ${a + 1}`,
    ],
    topic: "Infinite Nested Radicals",
  };
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
  // Area bounded by y = ax^2 and y = mx (intersection at x = m/a, integer)
  const a = rng(1, 3);
  const m = pick([2, 3, 4, 6]) * a; // ensures integer intersection x = m/a
  const x_int = m / a;
  // Area = ∫₀^x_int (mx - ax²) dx = [m/2 x² - a/3 x³] from 0 to x_int
  const area = +((m / 2) * Math.pow(x_int, 2) - (a / 3) * Math.pow(x_int, 3)).toFixed(4);
  return {
    question: `Find the exact area of the region enclosed between\nthe parabola  y = ${a}x²  and the line  y = ${m}x.`,
    answer:   `${area}`,
    hint:     `Set ${a}x² = ${m}x to find intersection points. Then integrate (Line − Parabola) from 0 to that x-value.`,
    steps: [
      `Find intersections: ${a}x² = ${m}x  →  x(${a}x − ${m}) = 0`,
      `Intersections at x = 0 and x = ${x_int}`,
      `Area = ∫₀^{${x_int}} (${m}x − ${a}x²) dx`,
      `Antiderivative: [ ${m}/2 · x² − ${a}/3 · x³ ]₀^{${x_int}}`,
      `= (${m}/2)(${x_int})² − (${a}/3)(${x_int})³`,
      `= ${(m / 2) * Math.pow(x_int, 2).toFixed(2)} − ${((a / 3) * Math.pow(x_int, 3)).toFixed(2)}`,
      `= ${area}`,
    ],
    topic: "Calculus — Area Between Curves",
  };
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
  // Catalan Numbers: valid parenthesization
  const n = pick([4, 5, 6]);
  const cat = nCr(2*n, n) / (n + 1);
  return {
    question: `How many distinct sequences of ${n} pairs of perfectly matched parentheses exist?\n(e.g. for n=2: ()() and (()) are the only 2 valid sequences)\n\nThis is the ${n}th Catalan Number.`,
    answer:   `${cat}`,
    hint:     `The nth Catalan Number: Cₙ = (1/(n+1)) × C(2n, n) = (2n)! / [n! × (n+1)!].`,
    steps: [
      `This count is given by the ${n}th Catalan Number: C_${n}`,
      `Formula: C_n = (1 / (n+1)) × (2n choose n)`,
      `C_${n} = (1 / ${n+1}) × C(${2*n}, ${n})`,
      `C(${2*n}, ${n}) = ${fact(2*n)} / (${fact(n)} × ${fact(n)}) = ${nCr(2*n,n)}`,
      `C_${n} = ${nCr(2*n,n)} / ${n+1} = ${cat}`,
    ],
    topic: "Catalan Numbers",
  };
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
  beginner:     [genLinear, genRatio, genBasicStats, genCI],
  intermediate: [genQuadratic, genProbability, genPolynomials],
  advanced:     [genMatrices, genComplexNumbers, genIntegrals],
  olympiad:     [genCombinatorics, genNumberTheory, genAdvAlgebra, genPigeonhole],
};

// ════════════════════════════════════════════════════════════════
//  🧠 ADAPTIVE LEARNING ENGINE  (NEW)
// ════════════════════════════════════════════════════════════════

// Maps each generator index to its topic name for adaptive weighting
const GTOPICS = {
  beginner:     ["Rational Equations", "Compound Ratios", "Weighted Statistics", "Compound Interest"],
  intermediate: ["Vieta's Formulas (Cubics)", "Bayesian Probability", "Advanced Polynomials"],
  advanced:     ["3×3 Determinants", "De Moivre's Theorem", "Calculus — Area Between Curves"],
  olympiad:     ["Derangements", "Legendre's Formula", "Infinite Nested Radicals", "Catalan Numbers"],
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

  /* ── Options Toggle ── */
  .options-toggle-row {
    display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
    padding: 12px 16px; border-radius: var(--radius-md);
    background: var(--bg-raised); border: 1px solid var(--border);
  }
  .options-toggle-label {
    font-size: 12px; font-family: 'JetBrains Mono', monospace; font-weight: 700;
    color: var(--text); letter-spacing: 0.3px;
  }
  .options-toggle-desc {
    font-size: 11px; color: var(--text-3); margin-top: 2px;
    font-family: 'Inter', sans-serif;
  }
  .toggle-switch { position: relative; width: 42px; height: 24px; flex-shrink: 0; margin-left: auto; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-track {
    position: absolute; inset: 0; background: var(--border); border-radius: 999px;
    cursor: pointer; transition: background 0.22s ease;
  }
  .toggle-track::after {
    content: ''; position: absolute; top: 3px; left: 3px;
    width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.22s;
  }
  .toggle-switch input:checked + .toggle-track { background: #6366f1; }
  .toggle-switch input:checked + .toggle-track::after { transform: translateX(18px); }

  /* ── Options Grid (MCQ) ── */
  .options-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; width: 100%;
  }
  @media (max-width: 480px) { .options-grid { grid-template-columns: 1fr; } }
  .option-btn {
    padding: 13px 14px; border-radius: var(--radius-md); background: var(--bg-raised);
    border: 1px solid var(--border); color: var(--text); font-size: 13px;
    font-family: 'JetBrains Mono', monospace; cursor: pointer; text-align: left;
    transition: all 0.18s ease; display: flex; align-items: flex-start; gap: 9px;
  }
  .option-btn:not(:disabled):hover { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.3); color: #a5b4fc; }
  .option-btn:active:not(:disabled) { transform: scale(0.98); }
  .option-btn:disabled { cursor: default; }
  .option-btn.opt-correct { background: rgba(16,185,129,0.09) !important; border-color: rgba(16,185,129,0.4) !important; color: #10b981 !important; }
  .option-btn.opt-wrong   { background: rgba(239,68,68,0.09) !important;  border-color: rgba(239,68,68,0.3) !important;  color: #f87171 !important; }
  .option-label {
    min-width: 20px; height: 20px; border-radius: 50%; background: var(--bg-sunken);
    border: 1px solid var(--border-soft); display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: var(--text-3); font-family: 'JetBrains Mono', monospace;
    flex-shrink: 0; margin-top: 1px;
  }

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
  // ── Options toggle (MCQ mode) ──
  const [useOptions, setUseOptions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_useOptions') || 'false'); } catch { return false; }
  });
  const [options,    setOptions]    = useState([]);
  const [pickedOpt,  setPickedOpt]  = useState(null);
  const inputRef = useRef(null);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  const m = MODES.find(x => x.id === mode);

  // Persist options-toggle preference
  const handleToggleOptions = (val) => {
    setUseOptions(val);
    try { localStorage.setItem('mb_useOptions', JSON.stringify(val)); } catch {}
  };

  // Derived
  const rankInfo  = getRank(totalXP);
  const total     = score.correct + score.wrong;
  const weakTopics = Object.entries(topicStats)
    .filter(([, s]) => s.total >= 3 && s.correct / s.total < 0.6)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .slice(0, 3);

  // Rebuild MCQ options whenever question changes or toggle switches
  useEffect(() => {
    if (question && useOptions) setOptions(buildOptions(question));
    else setOptions([]);
  }, [question, useOptions]);

  const _setQuestion = (q) => { setQuestion(q); setPickedOpt(null); };

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
    setPickedOpt(null);
    _setQuestion(genAdaptive(id, {}, 1));
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const nextQ = useCallback(() => {
    setAnim(true);
    setTimeout(() => {
      _setQuestion(genAdaptive(mode, topicStats, userLv));
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

  const awardXP = useCallback((amount) => {
    const current = parseInt(localStorage.getItem('userXP') || '0', 10);
    const newTotal = Math.max(0, current + amount);
    localStorage.setItem('userXP', String(newTotal));
    window.dispatchEvent(new CustomEvent('xpUpdated', { detail: { xp: newTotal } }));
  }, []);

  // Record outcome — with negative marking (−¼ XP on wrong)
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
      awardXP(xp);
      if (newStreak >= 3) setUserLv(l => Math.min(l + 1, 5));
    } else {
      // ── NEGATIVE MARKING: −¼ of base XP ──
      const penalty = Math.round(calcXP(1, userLv, mode) / 4);
      setScore({ correct: currentScore.correct, wrong: currentScore.wrong + 1, streak: 0 });
      setTotalXP(t => Math.max(0, t - penalty));
      setXpGained(-penalty);
      awardXP(-penalty);
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

  // Pick an option in MCQ mode
  const handleOptionPick = useCallback((opt) => {
    if (answered || !question) return;
    setPickedOpt(opt);
    const isCorrect = evalAnswer(opt, question.answer) === "correct";
    setEvaluation(isCorrect ? "correct" : "wrong");
    setShowAns(true);
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

            {/* ── OPTIONS TOGGLE ── */}
            <div className="options-toggle-row">
              <div>
                <div className="options-toggle-label">Options (MCQ)</div>
                <div className="options-toggle-desc">
                  {useOptions ? "4-choice MCQ · −¼ XP on wrong" : "Free-type answer mode"}
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={useOptions}
                  onChange={e => handleToggleOptions(e.target.checked)}
                />
                <span className="toggle-track" />
              </label>
            </div>

            {/* Question card */}
            {question && (
              <div className={`q-card ${evClass}`} style={{ borderColor: !evaluation ? m.border : undefined }}>
                <div className="q-topic" style={{ color: m.accent }}>{question.topic}</div>
                <div className="q-text">{question.question}</div>
              </div>
            )}

            {/* Input area — only before answer revealed */}
            {!answered && question && (
              <>
                <div className="hint-row">
                  <button className="hint-btn" onClick={() => setShowHint(h => !h)}>
                    {showHint ? "▲ Hide hint" : "💡 Show hint"}
                  </button>
                  {showHint && <div className="hint-box">{question.hint}</div>}
                </div>

                {useOptions ? (
                  /* ── MCQ OPTIONS ── */
                  <div className="options-grid">
                    {options.map((opt, i) => (
                      <button
                        key={opt + i}
                        className="option-btn"
                        onClick={() => handleOptionPick(opt)}
                        disabled={answered}
                      >
                        <span className="option-label">{["A","B","C","D"][i]}</span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* ── FREE-TYPE ── */
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
                  </>
                )}
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
                      {evaluation === "wrong"   && "✗ Wrong — study the explanation below"}
                      {evaluation === "partial" && "◑ Partially correct — check all parts"}
                    </span>
                    <span className="feedback-xp">
                      {evaluation === "correct" && xpGained != null && (
                        `+${xpGained} XP${score.streak >= 3 ? ` · 🔥×${score.streak}` : ""}`
                      )}
                      {evaluation === "wrong" && xpGained != null && xpGained < 0 && (
                        <span style={{ color: "#f87171" }}>{xpGained} XP</span>
                      )}
                    </span>
                  </div>
                )}

                {/* MCQ: highlight correct/wrong after answer */}
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
                {" · −¼ XP on wrong"}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

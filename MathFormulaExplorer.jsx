/* globals: React is set by the importmap in chat.html */
const { useState, useEffect, useRef } = React;

// ─── Utilities ────────────────────────────────────────────────
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const d2r = (d) => (d * Math.PI) / 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Topic Data ───────────────────────────────────────────────
const TOPICS = [
  {
    id: "algebra", name: "Algebra & Identities", classes: "Classes 9–10",
    icon: "x²", emoji: "⚡", color: "#FF6B6B", dim: "#7a1a1a",
    formulas: [
      {
        id: "ab2p", name: "(a+b)² Identity", formula: "(a + b)² = a² + 2ab + b²",
        desc: "Expand the square of a sum of two terms",
        inputs: [{ id: "a", label: "a" }, { id: "b", label: "b" }],
        compute: ({ a, b }) => {
          [a, b] = [+a, +b];
          return {
            steps: [
              `Given: a = ${a}, b = ${b}`,
              `LHS: (a + b)² = (${a} + ${b})² = (${a + b})² = ${(a + b) ** 2}`,
              `RHS: a² + 2ab + b²`,
              `  = ${a}² + 2(${a})(${b}) + ${b}²`,
              `  = ${a * a} + ${2 * a * b} + ${b * b}`,
              `  = ${a * a + 2 * a * b + b * b}`,
              `LHS = RHS ✓`
            ],
            answer: `(${a} + ${b})² = ${(a + b) ** 2}`
          };
        }
      },
      {
        id: "ab2m", name: "(a−b)² Identity", formula: "(a − b)² = a² − 2ab + b²",
        desc: "Expand the square of a difference",
        inputs: [{ id: "a", label: "a" }, { id: "b", label: "b" }],
        compute: ({ a, b }) => {
          [a, b] = [+a, +b];
          return {
            steps: [
              `Given: a = ${a}, b = ${b}`,
              `LHS: (${a} − ${b})² = (${a - b})² = ${(a - b) ** 2}`,
              `RHS: a² − 2ab + b² = ${a * a} − ${2 * a * b} + ${b * b} = ${a * a - 2 * a * b + b * b}`,
            ],
            answer: `(${a} − ${b})² = ${(a - b) ** 2}`
          };
        }
      },
      {
        id: "diffsq", name: "Difference of Squares", formula: "a² − b² = (a − b)(a + b)",
        desc: "Factorize a difference of two perfect squares",
        inputs: [{ id: "a", label: "a" }, { id: "b", label: "b" }],
        compute: ({ a, b }) => {
          [a, b] = [+a, +b];
          return {
            steps: [
              `Given: a = ${a}, b = ${b}`,
              `LHS: a² − b² = ${a * a} − ${b * b} = ${a * a - b * b}`,
              `RHS: (a−b)(a+b) = (${a}−${b})(${a}+${b}) = ${a - b} × ${a + b} = ${(a - b) * (a + b)}`,
              `LHS = RHS ✓`
            ],
            answer: `${a}² − ${b}² = (${a - b})(${a + b}) = ${a * a - b * b}`
          };
        }
      },
      {
        id: "quad", name: "Quadratic Formula", formula: "x = (−b ± √(b²−4ac)) / 2a",
        desc: "Find roots of the equation ax² + bx + c = 0",
        inputs: [
          { id: "a", label: "a  (coeff of x²)" },
          { id: "b", label: "b  (coeff of x)" },
          { id: "c", label: "c  (constant)" }
        ],
        compute: ({ a, b, c }) => {
          [a, b, c] = [+a, +b, +c];
          if (!a) return { steps: ["⚠  'a' cannot be 0 — not a quadratic equation!"], answer: "Invalid" };
          const disc = b * b - 4 * a * c;
          const steps = [
            `Equation: ${a}x² + ${b}x + ${c} = 0`,
            `Discriminant Δ = b² − 4ac`,
            `  = (${b})² − 4(${a})(${c})`,
            `  = ${b * b} − ${4 * a * c}`,
            `  = ${disc}`,
          ];
          let answer;
          if (disc > 0) {
            const s = Math.sqrt(disc);
            const x1 = (-b + s) / (2 * a), x2 = (-b - s) / (2 * a);
            steps.push(`Δ > 0 → Two distinct real roots`);
            steps.push(`x = (−b ± √Δ) / 2a = (−(${b}) ± √${disc}) / 2(${a})`);
            steps.push(`x = (${-b} ± ${s.toFixed(4)}) / ${2 * a}`);
            steps.push(`x₁ = (${-b} + ${s.toFixed(4)}) / ${2 * a} = ${x1.toFixed(6)}`);
            steps.push(`x₂ = (${-b} − ${s.toFixed(4)}) / ${2 * a} = ${x2.toFixed(6)}`);
            answer = `x₁ = ${x1.toFixed(4)},  x₂ = ${x2.toFixed(4)}`;
          } else if (disc === 0) {
            const x = -b / (2 * a);
            steps.push(`Δ = 0 → One repeated real root`);
            steps.push(`x = −b / 2a = ${-b} / ${2 * a} = ${x.toFixed(6)}`);
            answer = `x = ${x.toFixed(4)}  (repeated root)`;
          } else {
            const re = -b / (2 * a), im = Math.sqrt(-disc) / (2 * a);
            steps.push(`Δ < 0 → No real roots — Complex roots`);
            steps.push(`x = (${-b} ± i√${-disc}) / ${2 * a}`);
            steps.push(`Real part = ${-b} / ${2 * a} = ${re.toFixed(4)}`);
            steps.push(`Imaginary part = √${-disc} / ${2 * a} = ${im.toFixed(4)}`);
            answer = `x = ${re.toFixed(4)} ± ${im.toFixed(4)}i`;
          }
          return { steps, answer };
        }
      },
      {
        id: "vieta", name: "Sum & Product of Roots", formula: "α+β = −b/a,  αβ = c/a",
        desc: "Vieta's formulas — without solving the equation",
        inputs: [{ id: "a", label: "a" }, { id: "b", label: "b" }, { id: "c", label: "c" }],
        compute: ({ a, b, c }) => {
          [a, b, c] = [+a, +b, +c];
          return {
            steps: [
              `For equation: ${a}x² + ${b}x + ${c} = 0`,
              `Sum of roots:  α + β = −b/a = −(${b})/${a} = ${(-b / a).toFixed(6)}`,
              `Product of roots:  αβ = c/a = ${c}/${a} = ${(c / a).toFixed(6)}`,
            ],
            answer: `α + β = ${(-b / a).toFixed(4)},   αβ = ${(c / a).toFixed(4)}`
          };
        }
      },
      {
        id: "cube", name: "(a+b)³ Expansion", formula: "(a + b)³ = a³ + b³ + 3ab(a + b)",
        desc: "Cube of a sum — expanded form",
        inputs: [{ id: "a", label: "a" }, { id: "b", label: "b" }],
        compute: ({ a, b }) => {
          [a, b] = [+a, +b];
          const lhs = (a + b) ** 3;
          const rhs = a ** 3 + b ** 3 + 3 * a * b * (a + b);
          return {
            steps: [
              `(${a} + ${b})³ = ${lhs}`,
              `a³ + b³ + 3ab(a+b)`,
              `= ${a ** 3} + ${b ** 3} + 3(${a})(${b})(${a + b})`,
              `= ${a ** 3} + ${b ** 3} + ${3 * a * b * (a + b)}`,
              `= ${rhs}  ✓`
            ],
            answer: `(${a} + ${b})³ = ${lhs}`
          };
        }
      },
    ]
  },
  {
    id: "trig", name: "Trigonometry", classes: "Classes 10–12",
    icon: "sinθ", emoji: "📐", color: "#4ECDC4", dim: "#0d4a47",
    formulas: [
      {
        id: "pyth", name: "Pythagorean Identity", formula: "sin²θ + cos²θ = 1",
        desc: "The most fundamental identity in trigonometry",
        inputs: [{ id: "theta", label: "θ  (in degrees)" }],
        compute: ({ theta }) => {
          const r = d2r(+theta), s = Math.sin(r), c = Math.cos(r);
          return {
            steps: [
              `θ = ${theta}°`,
              `sin(θ) = sin(${theta}°) = ${s.toFixed(8)}`,
              `cos(θ) = cos(${theta}°) = ${c.toFixed(8)}`,
              `sin²θ = ${(s * s).toFixed(8)}`,
              `cos²θ = ${(c * c).toFixed(8)}`,
              `sin²θ + cos²θ = ${(s * s + c * c).toFixed(10)}`
            ],
            answer: `sin²(${theta}°) + cos²(${theta}°) = ${(s * s + c * c).toFixed(8)}  ≈ 1 ✓`
          };
        }
      },
      {
        id: "sinab", name: "sin(A+B) Addition", formula: "sin(A+B) = sinA cosB + cosA sinB",
        desc: "Sine of the sum of two angles",
        inputs: [{ id: "A", label: "Angle A  (degrees)" }, { id: "B", label: "Angle B  (degrees)" }],
        compute: ({ A, B }) => {
          [A, B] = [+A, +B];
          const ar = d2r(A), br = d2r(B);
          const lhs = Math.sin(d2r(A + B));
          const rhs = Math.sin(ar) * Math.cos(br) + Math.cos(ar) * Math.sin(br);
          return {
            steps: [
              `A = ${A}°, B = ${B}°, A+B = ${A + B}°`,
              `sin(A+B) = sin(${A + B}°) = ${lhs.toFixed(6)}`,
              `sinA·cosB = sin(${A}°)·cos(${B}°) = ${Math.sin(ar).toFixed(4)} × ${Math.cos(br).toFixed(4)} = ${(Math.sin(ar) * Math.cos(br)).toFixed(6)}`,
              `cosA·sinB = cos(${A}°)·sin(${B}°) = ${Math.cos(ar).toFixed(4)} × ${Math.sin(br).toFixed(4)} = ${(Math.cos(ar) * Math.sin(br)).toFixed(6)}`,
              `Sum = ${rhs.toFixed(6)}  ✓`
            ],
            answer: `sin(${A}° + ${B}°) = ${lhs.toFixed(6)}`
          };
        }
      },
      {
        id: "cos2t", name: "cos(2θ) — Double Angle", formula: "cos(2θ) = cos²θ − sin²θ = 2cos²θ−1 = 1−2sin²θ",
        desc: "Three equivalent forms of the double angle formula",
        inputs: [{ id: "theta", label: "θ  (degrees)" }],
        compute: ({ theta }) => {
          const r = d2r(+theta), c = Math.cos(r), s = Math.sin(r);
          return {
            steps: [
              `θ = ${theta}°,  2θ = ${2 * (+theta)}°`,
              `Direct: cos(2θ) = cos(${2 * (+theta)}°) = ${Math.cos(2 * r).toFixed(8)}`,
              `Form 1: cos²θ − sin²θ = ${(c * c).toFixed(4)} − ${(s * s).toFixed(4)} = ${(c * c - s * s).toFixed(8)}`,
              `Form 2: 2cos²θ − 1 = 2(${(c * c).toFixed(4)}) − 1 = ${(2 * c * c - 1).toFixed(8)}`,
              `Form 3: 1 − 2sin²θ = 1 − 2(${(s * s).toFixed(4)}) = ${(1 - 2 * s * s).toFixed(8)}`,
              `All three forms are equal ✓`
            ],
            answer: `cos(2 × ${theta}°) = ${Math.cos(2 * r).toFixed(6)}`
          };
        }
      },
    ]
  },
  {
    id: "coordinate", name: "Coordinate Geometry", classes: "Classes 9–11",
    icon: "(x,y)", emoji: "📍", color: "#FFD166", dim: "#5a4200",
    formulas: [
      {
        id: "dist", name: "Distance Formula", formula: "d = √( (x₂−x₁)² + (y₂−y₁)² )",
        desc: "Distance between any two points in a plane",
        inputs: [{ id: "x1", label: "x₁" }, { id: "y1", label: "y₁" }, { id: "x2", label: "x₂" }, { id: "y2", label: "y₂" }],
        compute: ({ x1, y1, x2, y2 }) => {
          [x1, y1, x2, y2] = [+x1, +y1, +x2, +y2];
          const dx = x2 - x1, dy = y2 - y1, d = Math.sqrt(dx * dx + dy * dy);
          return {
            steps: [
              `Points: P₁(${x1}, ${y1})  →  P₂(${x2}, ${y2})`,
              `Δx = x₂ − x₁ = ${x2} − ${x1} = ${dx}`,
              `Δy = y₂ − y₁ = ${y2} − ${y1} = ${dy}`,
              `d = √(Δx² + Δy²) = √(${dx}² + ${dy}²) = √(${dx * dx} + ${dy * dy}) = √${dx * dx + dy * dy}`,
              `d = ${d.toFixed(8)}`
            ],
            answer: `Distance = ${d.toFixed(6)} units`
          };
        }
      },
      {
        id: "section", name: "Section Formula", formula: "P = ( (mx₂+nx₁)/(m+n),  (my₂+ny₁)/(m+n) )",
        desc: "Point dividing a line segment in ratio m:n",
        inputs: [
          { id: "x1", label: "x₁" }, { id: "y1", label: "y₁" },
          { id: "x2", label: "x₂" }, { id: "y2", label: "y₂" },
          { id: "m", label: "m (ratio part 1)" }, { id: "n", label: "n (ratio part 2)" }
        ],
        compute: ({ x1, y1, x2, y2, m, n }) => {
          [x1, y1, x2, y2, m, n] = [+x1, +y1, +x2, +y2, +m, +n];
          if (m + n === 0) return { steps: ["m + n cannot be 0"], answer: "Invalid" };
          const px = (m * x2 + n * x1) / (m + n), py = (m * y2 + n * y1) / (m + n);
          return {
            steps: [
              `From A(${x1},${y1}) to B(${x2},${y2}), ratio ${m}:${n}`,
              `Px = (mx₂ + nx₁)/(m+n) = (${m}×${x2} + ${n}×${x1})/(${m + n}) = ${m * x2 + n * x1}/${m + n} = ${px.toFixed(6)}`,
              `Py = (my₂ + ny₁)/(m+n) = (${m}×${y2} + ${n}×${y1})/(${m + n}) = ${m * y2 + n * y1}/${m + n} = ${py.toFixed(6)}`,
            ],
            answer: `P = (${px.toFixed(4)}, ${py.toFixed(4)})`
          };
        }
      },
      {
        id: "slope", name: "Slope Formula", formula: "m = (y₂ − y₁) / (x₂ − x₁)",
        desc: "Gradient (steepness) of a straight line",
        inputs: [{ id: "x1", label: "x₁" }, { id: "y1", label: "y₁" }, { id: "x2", label: "x₂" }, { id: "y2", label: "y₂" }],
        compute: ({ x1, y1, x2, y2 }) => {
          [x1, y1, x2, y2] = [+x1, +y1, +x2, +y2];
          if (x2 === x1) return { steps: ["x₁ = x₂ → Vertical line", "Slope is undefined (∞)"], answer: "Slope = undefined" };
          const m = (y2 - y1) / (x2 - x1);
          const dir = m > 0 ? "↗ Positive slope (line rises)" : m < 0 ? "↘ Negative slope (line falls)" : "→ Zero slope (horizontal)";
          return {
            steps: [
              `Points: (${x1},${y1}) and (${x2},${y2})`,
              `m = (y₂−y₁)/(x₂−x₁) = (${y2}−${y1})/(${x2}−${x1}) = ${y2 - y1}/${x2 - x1}`,
              `m = ${m.toFixed(8)}`,
              dir
            ],
            answer: `Slope m = ${m.toFixed(4)}`
          };
        }
      },
    ]
  },
  {
    id: "sequences", name: "Sequences & Series", classes: "Classes 10–11",
    icon: "aₙ", emoji: "🔢", color: "#A78BFA", dim: "#2d1a6e",
    formulas: [
      {
        id: "apn", name: "AP: nth Term", formula: "aₙ = a + (n−1)d",
        desc: "Find any term of an Arithmetic Progression",
        inputs: [{ id: "a", label: "a  (1st term)" }, { id: "d", label: "d  (common diff)" }, { id: "n", label: "n  (term no.)" }],
        compute: ({ a, d, n }) => {
          [a, d, n] = [+a, +d, +n];
          const an = a + (n - 1) * d;
          return {
            steps: [`a=${a}, d=${d}, n=${n}`, `aₙ = a + (n−1)d = ${a} + (${n}−1)×${d} = ${a} + ${(n - 1) * d}`],
            answer: `a${n} = ${an}`
          };
        }
      },
      {
        id: "aps", name: "AP: Sum of n Terms", formula: "Sₙ = (n/2)[2a + (n−1)d]",
        desc: "Sum of first n terms of an Arithmetic Progression",
        inputs: [{ id: "a", label: "a" }, { id: "d", label: "d" }, { id: "n", label: "n" }],
        compute: ({ a, d, n }) => {
          [a, d, n] = [+a, +d, +n];
          const sn = (n / 2) * (2 * a + (n - 1) * d);
          return {
            steps: [`Sₙ = (n/2)[2a + (n−1)d]`, `= (${n}/2)[2(${a}) + (${n}−1)(${d})]`, `= ${n / 2} × [${2 * a} + ${(n - 1) * d}]`, `= ${n / 2} × ${2 * a + (n - 1) * d}`],
            answer: `S${n} = ${sn}`
          };
        }
      },
      {
        id: "gpn", name: "GP: nth Term", formula: "aₙ = arⁿ⁻¹",
        desc: "Find any term of a Geometric Progression",
        inputs: [{ id: "a", label: "a  (1st term)" }, { id: "r", label: "r  (common ratio)" }, { id: "n", label: "n  (term no.)" }],
        compute: ({ a, r, n }) => {
          [a, r, n] = [+a, +r, +n];
          const an = a * r ** (n - 1);
          return {
            steps: [`a=${a}, r=${r}, n=${n}`, `aₙ = a×rⁿ⁻¹ = ${a} × ${r}^${n - 1} = ${a} × ${r ** (n - 1)}`],
            answer: `a${n} = ${an}`
          };
        }
      },
      {
        id: "gps", name: "GP: Sum of n Terms", formula: "Sₙ = a(rⁿ − 1) / (r − 1)",
        desc: "Sum of first n terms of a Geometric Progression (r ≠ 1)",
        inputs: [{ id: "a", label: "a" }, { id: "r", label: "r  (≠ 1)" }, { id: "n", label: "n" }],
        compute: ({ a, r, n }) => {
          [a, r, n] = [+a, +r, +n];
          if (r === 1) return { steps: [`r = 1, so Sₙ = n × a = ${n} × ${a}`], answer: `S${n} = ${n * a}` };
          const sn = a * (r ** n - 1) / (r - 1);
          return {
            steps: [`a=${a}, r=${r}, n=${n}`, `Sₙ = a(rⁿ−1)/(r−1) = ${a}(${r}^${n}−1)/(${r}−1)`, `= ${a}(${r ** n}−1)/${r - 1} = ${a * (r ** n - 1)}/${r - 1}`],
            answer: `S${n} = ${sn.toFixed(4)}`
          };
        }
      },
    ]
  },
  {
    id: "calculus", name: "Calculus", classes: "Classes 11–12",
    icon: "d/dx", emoji: "∫", color: "#F97316", dim: "#6b2a00",
    formulas: [
      {
        id: "pow", name: "Power Rule (Differentiation)", formula: "d/dx(xⁿ) = nxⁿ⁻¹",
        desc: "Derivative of a power of x — most used differentiation rule",
        inputs: [{ id: "coeff", label: "Coefficient (a in axⁿ)" }, { id: "n", label: "Power n" }, { id: "x", label: "Evaluate at x =" }],
        compute: ({ coeff, n, x }) => {
          [coeff, n, x] = [+coeff, +n, +x];
          const nc = coeff * n, np = n - 1, val = nc * x ** np;
          return {
            steps: [
              `f(x) = ${coeff}x^${n}`,
              `Apply power rule: d/dx(xⁿ) = nxⁿ⁻¹`,
              `f'(x) = ${coeff} × ${n} × x^${n - 1} = ${nc}x^${np}`,
              `At x = ${x}:`,
              `f'(${x}) = ${nc} × (${x})^${np} = ${nc} × ${x ** np} = ${val}`
            ],
            answer: `f'(x) = ${nc}x^${np},   f'(${x}) = ${val}`
          };
        }
      },
      {
        id: "intp", name: "Integration (Power Rule)", formula: "∫xⁿ dx = xⁿ⁺¹/(n+1) + C",
        desc: "Integral of a power of x (n ≠ −1)",
        inputs: [{ id: "coeff", label: "Coefficient" }, { id: "n", label: "Power n  (n ≠ −1)" }],
        compute: ({ coeff, n }) => {
          [coeff, n] = [+coeff, +n];
          if (n === -1) return { steps: ["n = −1: ∫(1/x)dx = ln|x| + C"], answer: `${coeff}ln|x| + C` };
          const nc = coeff / (n + 1);
          return {
            steps: [`∫${coeff}x^${n} dx`, `= ${coeff} × x^${n + 1}/(${n + 1}) + C`, `= ${nc.toFixed(4)} x^${n + 1} + C`],
            answer: `= ${nc.toFixed(4)} x^${n + 1} + C`
          };
        }
      },
      {
        id: "prodrule", name: "Product Rule", formula: "d/dx(uv) = u(dv/dx) + v(du/dx)",
        desc: "Derivative of a product of two functions",
        inputs: [
          { id: "un", label: "u = xᵃ  — power a" }, { id: "uc", label: "Coefficient of u" },
          { id: "vn", label: "v = xᵇ  — power b" }, { id: "vc", label: "Coefficient of v" },
          { id: "x", label: "Evaluate at x =" }
        ],
        compute: ({ un, uc, vn, vc, x }) => {
          [un, uc, vn, vc, x] = [+un, +uc, +vn, +vc, +x];
          const u = uc * x ** un, v = vc * x ** vn;
          const du = uc * un * x ** (un - 1), dv = vc * vn * x ** (vn - 1);
          const deriv = u * dv + v * du;
          return {
            steps: [
              `u = ${uc}x^${un},  v = ${vc}x^${vn}`,
              `du/dx = ${uc * un}x^${un - 1}`,
              `dv/dx = ${vc * vn}x^${vn - 1}`,
              `d/dx(uv) = u(dv/dx) + v(du/dx)`,
              `At x = ${x}:  u=${u}, v=${v}, du/dx=${du}, dv/dx=${dv}`,
              `= ${u}×${dv} + ${v}×${du} = ${u * dv} + ${v * du}`
            ],
            answer: `d/dx(uv) at x=${x} = ${deriv}`
          };
        }
      },
    ]
  },
  {
    id: "mensuration", name: "Mensuration", classes: "Classes 9–10",
    icon: "πr²", emoji: "⭕", color: "#FB923C", dim: "#6b2a00",
    formulas: [
      {
        id: "ca", name: "Circle Area", formula: "A = πr²",
        desc: "Area enclosed by a circle",
        inputs: [{ id: "r", label: "Radius r" }],
        compute: ({ r }) => { r = +r; const a = Math.PI * r * r; return { steps: [`A = πr² = π × ${r}² = π × ${r * r} = ${a.toFixed(8)}`], answer: `Area = ${a.toFixed(4)} sq. units` }; }
      },
      {
        id: "cv", name: "Cylinder Volume", formula: "V = πr²h",
        desc: "Volume of a right circular cylinder",
        inputs: [{ id: "r", label: "Radius r" }, { id: "h", label: "Height h" }],
        compute: ({ r, h }) => { [r, h] = [+r, +h]; const v = Math.PI * r * r * h; return { steps: [`V = πr²h = π × ${r}² × ${h} = π × ${r * r * h} = ${v.toFixed(8)}`], answer: `Volume = ${v.toFixed(4)} cubic units` }; }
      },
      {
        id: "conv", name: "Cone Volume", formula: "V = (1/3)πr²h",
        desc: "Volume of a right circular cone",
        inputs: [{ id: "r", label: "Radius r" }, { id: "h", label: "Height h" }],
        compute: ({ r, h }) => { [r, h] = [+r, +h]; const v = (1 / 3) * Math.PI * r * r * h; return { steps: [`V = (1/3)πr²h = (1/3) × π × ${r}² × ${h} = ${v.toFixed(8)}`], answer: `Volume = ${v.toFixed(4)} cubic units` }; }
      },
      {
        id: "ssa", name: "Sphere Surface Area", formula: "SA = 4πr²",
        desc: "Total surface area of a sphere",
        inputs: [{ id: "r", label: "Radius r" }],
        compute: ({ r }) => { r = +r; const sa = 4 * Math.PI * r * r; return { steps: [`SA = 4πr² = 4 × π × ${r}² = 4 × π × ${r * r} = ${sa.toFixed(8)}`], answer: `SA = ${sa.toFixed(4)} sq. units` }; }
      },
      {
        id: "sv", name: "Sphere Volume", formula: "V = (4/3)πr³",
        desc: "Volume enclosed by a sphere",
        inputs: [{ id: "r", label: "Radius r" }],
        compute: ({ r }) => { r = +r; const v = (4 / 3) * Math.PI * r ** 3; return { steps: [`V = (4/3)πr³ = (4/3) × π × ${r}³ = (4/3) × π × ${r ** 3} = ${v.toFixed(8)}`], answer: `Volume = ${v.toFixed(4)} cubic units` }; }
      },
    ]
  },
  {
    id: "stats", name: "Statistics & Probability", classes: "Classes 9–12",
    icon: "P(E)", emoji: "🎲", color: "#34D399", dim: "#05422a",
    formulas: [
      {
        id: "prob", name: "Basic Probability", formula: "P(E) = Favourable / Total Outcomes",
        desc: "Classical probability of an event",
        inputs: [{ id: "fav", label: "Favourable outcomes" }, { id: "total", label: "Total outcomes" }],
        compute: ({ fav, total }) => {
          [fav, total] = [+fav, +total];
          if (total <= 0) return { steps: ["Total outcomes must be > 0"], answer: "Invalid" };
          const p = fav / total;
          return {
            steps: [`Favourable = ${fav},  Total = ${total}`, `P(E) = ${fav} / ${total} = ${p.toFixed(8)}`, `As percentage: ${(p * 100).toFixed(4)}%`, p >= 0 && p <= 1 ? "Valid probability ✓  (0 ≤ P ≤ 1)" : "⚠ Invalid probability!"],
            answer: `P(E) = ${p.toFixed(6)}  ≈ ${(p * 100).toFixed(2)}%`
          };
        }
      },
      {
        id: "condp", name: "Conditional Probability", formula: "P(A|B) = P(A∩B) / P(B)",
        desc: "Probability of A given that B has occurred",
        inputs: [{ id: "pAB", label: "P(A∩B)" }, { id: "pB", label: "P(B)" }],
        compute: ({ pAB, pB }) => {
          [pAB, pB] = [+pAB, +pB];
          if (pB === 0) return { steps: ["P(B) cannot be 0"], answer: "Undefined" };
          const p = pAB / pB;
          return { steps: [`P(A|B) = P(A∩B)/P(B) = ${pAB}/${pB}`], answer: `P(A|B) = ${p.toFixed(6)}` };
        }
      },
      {
        id: "combstat", name: "Combination ⁿCᵣ", formula: "ⁿCᵣ = n! / (r!(n−r)!)",
        desc: "Number of ways to choose r from n (order doesn't matter)",
        inputs: [{ id: "n", label: "n  (total)" }, { id: "r", label: "r  (chosen)" }],
        compute: ({ n, r }) => {
          [n, r] = [+n, +r];
          if (r > n || r < 0 || n < 0 || n > 20) return { steps: ["Invalid: need 0 ≤ r ≤ n ≤ 20"], answer: "Invalid" };
          const res = fact(n) / (fact(r) * fact(n - r));
          return { steps: [`${n}C${r} = ${n}! / (${r}! × ${n - r}!) = ${fact(n)} / (${fact(r)} × ${fact(n - r)}) = ${fact(n) / (fact(r) * fact(n - r))}`], answer: `ⁿCᵣ = ${res}` };
        }
      },
    ]
  },
  {
    id: "logs", name: "Logarithms", classes: "Classes 10–12",
    icon: "log", emoji: "🔬", color: "#60A5FA", dim: "#1a3a6b",
    formulas: [
      {
        id: "lprod", name: "Product Rule", formula: "log(ab) = log a + log b",
        desc: "Logarithm of a product equals sum of logs",
        inputs: [{ id: "a", label: "a  (> 0)" }, { id: "b", label: "b  (> 0)" }, { id: "base", label: "Log Base  (e.g. 10)" }],
        compute: ({ a, b, base }) => {
          [a, b, base] = [+a, +b, +base];
          if (a <= 0 || b <= 0 || base <= 0 || base === 1) return { steps: ["Invalid: a, b > 0; base > 0 and ≠ 1"], answer: "Invalid" };
          const L = (x) => Math.log(x) / Math.log(base);
          return {
            steps: [`a=${a}, b=${b}, base=${base}`, `log₍${base}₎(ab) = log₍${base}₎(${a * b}) = ${L(a * b).toFixed(8)}`, `log₍${base}₎(${a}) = ${L(a).toFixed(6)}`, `log₍${base}₎(${b}) = ${L(b).toFixed(6)}`, `Sum = ${(L(a) + L(b)).toFixed(8)}  ✓`],
            answer: `log₍${base}₎(${a * b}) = ${L(a * b).toFixed(4)}`
          };
        }
      },
      {
        id: "lpow", name: "Power Rule", formula: "log(aⁿ) = n × log a",
        desc: "Logarithm of a power equals n times the log",
        inputs: [{ id: "a", label: "a  (> 0)" }, { id: "n", label: "n  (exponent)" }, { id: "base", label: "Base" }],
        compute: ({ a, n, base }) => {
          [a, n, base] = [+a, +n, +base];
          if (a <= 0 || base <= 0 || base === 1) return { steps: ["Invalid inputs"], answer: "Invalid" };
          const L = (x) => Math.log(x) / Math.log(base);
          return {
            steps: [`a=${a}, n=${n}, base=${base}`, `log₍${base}₎(${a}^${n}) = ${L(a ** n).toFixed(8)}`, `n × log₍${base}₎(${a}) = ${n} × ${L(a).toFixed(6)} = ${(n * L(a)).toFixed(8)}  ✓`],
            answer: `log₍${base}₎(${a}^${n}) = ${L(a ** n).toFixed(4)}`
          };
        }
      },
      {
        id: "lcob", name: "Change of Base", formula: "log_b(a) = log_c(a) / log_c(b)",
        desc: "Convert a logarithm from one base to another",
        inputs: [{ id: "a", label: "a  (argument)" }, { id: "b", label: "b  (target base)" }, { id: "c", label: "c  (bridge base, e.g. 10)" }],
        compute: ({ a, b, c }) => {
          [a, b, c] = [+a, +b, +c];
          if (a <= 0 || b <= 0 || c <= 0 || b === 1 || c === 1) return { steps: ["Invalid inputs"], answer: "Invalid" };
          const Lc = (x) => Math.log(x) / Math.log(c);
          const res = Lc(a) / Lc(b);
          return {
            steps: [`log₍${c}₎(${a}) = ${Lc(a).toFixed(6)}`, `log₍${c}₎(${b}) = ${Lc(b).toFixed(6)}`, `log₍${b}₎(${a}) = ${Lc(a).toFixed(6)} / ${Lc(b).toFixed(6)} = ${res.toFixed(6)}`],
            answer: `log₍${b}₎(${a}) = ${res.toFixed(4)}`
          };
        }
      },
    ]
  },
  {
    id: "vectors", name: "Vectors & 3D Geometry", classes: "Class 12 / JEE",
    icon: "a⃗·b⃗", emoji: "🧭", color: "#F472B6", dim: "#6b0a3e",
    formulas: [
      {
        id: "mag", name: "Vector Magnitude", formula: "|a⃗| = √(x² + y² + z²)",
        desc: "Length/magnitude of a 3D vector",
        inputs: [{ id: "x", label: "x component" }, { id: "y", label: "y component" }, { id: "z", label: "z component" }],
        compute: ({ x, y, z }) => {
          [x, y, z] = [+x, +y, +z];
          const m = Math.sqrt(x * x + y * y + z * z);
          return { steps: [`Vector: (${x}, ${y}, ${z})`, `|a⃗| = √(${x}²+${y}²+${z}²) = √(${x * x}+${y * y}+${z * z}) = √${x * x + y * y + z * z}`], answer: `|a⃗| = ${m.toFixed(6)}` };
        }
      },
      {
        id: "dot", name: "Dot Product", formula: "a⃗·b⃗ = axbx + ayby + azbz = |a⃗||b⃗|cosθ",
        desc: "Scalar product of two vectors and angle between them",
        inputs: [
          { id: "ax", label: "a⃗: x" }, { id: "ay", label: "a⃗: y" }, { id: "az", label: "a⃗: z" },
          { id: "bx", label: "b⃗: x" }, { id: "by", label: "b⃗: y" }, { id: "bz", label: "b⃗: z" }
        ],
        compute: ({ ax, ay, az, bx, by, bz }) => {
          [ax, ay, az, bx, by, bz] = [+ax, +ay, +az, +bx, +by, +bz];
          const dot = ax * bx + ay * by + az * bz;
          const mA = Math.sqrt(ax * ax + ay * ay + az * az), mB = Math.sqrt(bx * bx + by * by + bz * bz);
          const cosT = clamp(dot / (mA * mB), -1, 1);
          const theta = Math.acos(cosT) * 180 / Math.PI;
          return {
            steps: [
              `a⃗ = (${ax}, ${ay}, ${az}),  b⃗ = (${bx}, ${by}, ${bz})`,
              `a⃗·b⃗ = ${ax}×${bx} + ${ay}×${by} + ${az}×${bz} = ${ax * bx} + ${ay * by} + ${az * bz} = ${dot}`,
              `|a⃗| = ${mA.toFixed(4)},  |b⃗| = ${mB.toFixed(4)}`,
              `cosθ = ${dot}/(${mA.toFixed(4)} × ${mB.toFixed(4)}) = ${cosT.toFixed(6)}`,
              `θ = arccos(${cosT.toFixed(4)}) = ${theta.toFixed(4)}°`
            ],
            answer: `a⃗·b⃗ = ${dot},  Angle = ${theta.toFixed(2)}°`
          };
        }
      },
    ]
  },
  {
    id: "limits", name: "Limits & Continuity", classes: "Classes 11–12",
    icon: "lim", emoji: "→", color: "#FCD34D", dim: "#5a4200",
    formulas: [
      {
        id: "sinlim", name: "lim sin(x)/x = 1", formula: "lim(x→0) sin(x)/x = 1",
        desc: "The most important trigonometric limit (x in radians)",
        inputs: [{ id: "x", label: "x  (small value near 0, in radians)" }],
        compute: ({ x }) => {
          x = +x;
          if (x === 0) return { steps: ["This IS the limiting case: value = 1"], answer: "lim = 1 (exact)" };
          const v = Math.sin(x) / x;
          return {
            steps: [`x = ${x} rad`, `sin(${x}) = ${Math.sin(x).toFixed(8)}`, `sin(x)/x = ${Math.sin(x).toFixed(8)} / ${x} = ${v.toFixed(8)}`, `As x → 0, sin(x)/x → 1`],
            answer: `sin(x)/x at x=${x} ≈ ${v.toFixed(6)}  (approaches 1 as x→0)`
          };
        }
      },
      {
        id: "explim", name: "lim (eˣ−1)/x = 1", formula: "lim(x→0) (eˣ−1)/x = 1",
        desc: "Fundamental exponential limit",
        inputs: [{ id: "x", label: "x  (small value near 0)" }],
        compute: ({ x }) => {
          x = +x;
          if (x === 0) return { steps: ["Limiting case: value = 1"], answer: "lim = 1 (exact)" };
          const v = (Math.exp(x) - 1) / x;
          return {
            steps: [`x = ${x}`, `eˣ = e^${x} = ${Math.exp(x).toFixed(8)}`, `(eˣ−1) = ${(Math.exp(x) - 1).toFixed(8)}`, `(eˣ−1)/x = ${v.toFixed(8)}`, `As x→0, (eˣ−1)/x → 1`],
            answer: `(e^x−1)/x at x=${x} ≈ ${v.toFixed(6)}  (→1 as x→0)`
          };
        }
      },
      {
        id: "powlim", name: "lim (xⁿ−aⁿ)/(x−a) = naⁿ⁻¹", formula: "lim(x→a) (xⁿ−aⁿ)/(x−a) = naⁿ⁻¹",
        desc: "Algebraic limit — very common in JEE",
        inputs: [{ id: "a", label: "a  (limit point)" }, { id: "n", label: "n  (power)" }],
        compute: ({ a, n }) => {
          [a, n] = [+a, +n];
          const result = n * a ** (n - 1);
          return {
            steps: [`a=${a}, n=${n}`, `lim(x→${a}) (x^${n} − ${a}^${n})/(x − ${a})`, `= n × a^(n−1) = ${n} × ${a}^${n - 1} = ${n} × ${a ** (n - 1)}`],
            answer: `Limit = ${result}`
          };
        }
      },
    ]
  },
  {
    id: "permcomb", name: "Permutations & Combinations", classes: "Classes 11–12",
    icon: "ⁿPᵣ", emoji: "🔀", color: "#A3E635", dim: "#2a3d00",
    formulas: [
      {
        id: "factrl", name: "Factorial n!", formula: "n! = n × (n−1) × … × 1",
        desc: "Product of all integers from 1 to n",
        inputs: [{ id: "n", label: "n  (integer ≤ 20)" }],
        compute: ({ n }) => {
          n = Math.floor(+n);
          if (n < 0 || n > 20) return { steps: ["n must be 0–20"], answer: "Invalid" };
          const res = fact(n);
          const exp = n === 0 ? "1" : Array.from({ length: n }, (_, i) => n - i).join(" × ");
          return { steps: [`${n}! = ${exp}`, `${n}! = ${res}`], answer: `${n}! = ${res}` };
        }
      },
      {
        id: "perm", name: "Permutation ⁿPᵣ", formula: "ⁿPᵣ = n! / (n−r)!",
        desc: "Arrangements of r items chosen from n (order matters)",
        inputs: [{ id: "n", label: "n  (total)" }, { id: "r", label: "r  (chosen)" }],
        compute: ({ n, r }) => {
          [n, r] = [+n, +r];
          if (r > n || r < 0 || n < 0 || n > 20) return { steps: ["Need 0 ≤ r ≤ n ≤ 20"], answer: "Invalid" };
          const res = fact(n) / fact(n - r);
          return { steps: [`ⁿPᵣ = n!/(n−r)! = ${n}!/${n - r}! = ${fact(n)}/${fact(n - r)}`], answer: `${n}P${r} = ${res}` };
        }
      },
      {
        id: "comb2", name: "Combination ⁿCᵣ", formula: "ⁿCᵣ = n! / (r!(n−r)!)",
        desc: "Selections of r from n (order does NOT matter)",
        inputs: [{ id: "n", label: "n" }, { id: "r", label: "r" }],
        compute: ({ n, r }) => {
          [n, r] = [+n, +r];
          if (r > n || r < 0 || n < 0 || n > 20) return { steps: ["Need 0 ≤ r ≤ n ≤ 20"], answer: "Invalid" };
          const res = fact(n) / (fact(r) * fact(n - r));
          return { steps: [`${n}C${r} = ${n}!/(${r}!×${n - r}!) = ${fact(n)}/(${fact(r)}×${fact(n - r)}) = ${res}`], answer: `${n}C${r} = ${res}` };
        }
      },
    ]
  },
  {
    id: "settheory", name: "Set Theory & Relations", classes: "Class 11",
    icon: "A∪B", emoji: "🔴", color: "#38BDF8", dim: "#0a2e4a",
    formulas: [
      {
        id: "u2", name: "Union — 2 Sets", formula: "n(A∪B) = n(A) + n(B) − n(A∩B)",
        desc: "Count elements in the union of 2 sets",
        inputs: [{ id: "nA", label: "n(A)" }, { id: "nB", label: "n(B)" }, { id: "nAB", label: "n(A∩B)" }],
        compute: ({ nA, nB, nAB }) => {
          [nA, nB, nAB] = [+nA, +nB, +nAB];
          const res = nA + nB - nAB;
          return { steps: [`n(A∪B) = n(A)+n(B)−n(A∩B) = ${nA}+${nB}−${nAB} = ${res}`], answer: `n(A∪B) = ${res}` };
        }
      },
      {
        id: "u3", name: "Union — 3 Sets", formula: "n(A∪B∪C) = Σn(A)−Σn(A∩B)+n(A∩B∩C)",
        desc: "Inclusion-Exclusion principle for 3 sets",
        inputs: [
          { id: "nA", label: "n(A)" }, { id: "nB", label: "n(B)" }, { id: "nC", label: "n(C)" },
          { id: "nAB", label: "n(A∩B)" }, { id: "nBC", label: "n(B∩C)" }, { id: "nAC", label: "n(A∩C)" },
          { id: "nABC", label: "n(A∩B∩C)" }
        ],
        compute: ({ nA, nB, nC, nAB, nBC, nAC, nABC }) => {
          [nA, nB, nC, nAB, nBC, nAC, nABC] = [nA, nB, nC, nAB, nBC, nAC, nABC].map(Number);
          const res = nA + nB + nC - nAB - nBC - nAC + nABC;
          return { steps: [`= ${nA}+${nB}+${nC}−${nAB}−${nBC}−${nAC}+${nABC}`, `= ${res}`], answer: `n(A∪B∪C) = ${res}` };
        }
      },
    ]
  },
  {
    id: "conics", name: "Conic Sections", classes: "Classes 11–12",
    icon: "y²=4ax", emoji: "🌐", color: "#E879F9", dim: "#4a0a6b",
    formulas: [
      {
        id: "parab", name: "Parabola y² = 4ax", formula: "Focus (a,0), Directrix x = −a",
        desc: "Key properties of the standard parabola",
        inputs: [{ id: "a", label: "a" }],
        compute: ({ a }) => {
          a = +a;
          return { steps: [`Parabola: y² = 4(${a})x = ${4 * a}x`, `Vertex: (0, 0)`, `Focus: (${a}, 0)`, `Directrix: x = ${-a}`, `Latus Rectum length: 4a = ${4 * a}`, `Axis of symmetry: y = 0 (x-axis)`], answer: `Focus=(${a},0),  Directrix: x=${-a}` };
        }
      },
      {
        id: "ellip", name: "Ellipse x²/a² + y²/b² = 1", formula: "e = √(1 − b²/a²)",
        desc: "Eccentricity and foci of standard ellipse (b < a)",
        inputs: [{ id: "a", label: "a  (semi-major axis)" }, { id: "b", label: "b  (semi-minor, b < a)" }],
        compute: ({ a, b }) => {
          [a, b] = [+a, +b];
          if (b >= a || a <= 0 || b <= 0) return { steps: ["Need a > b > 0"], answer: "Invalid" };
          const c = Math.sqrt(a * a - b * b), e = c / a;
          return { steps: [`a=${a}, b=${b}`, `c = √(a²−b²) = √${a * a - b * b} = ${c.toFixed(4)}`, `e = c/a = ${c.toFixed(4)}/${a} = ${e.toFixed(6)}`, `Foci: (±${c.toFixed(4)}, 0)`, `0 < e < 1 for ellipse: ${e.toFixed(4)} ✓`], answer: `e = ${e.toFixed(4)},  Foci: (±${c.toFixed(4)}, 0)` };
        }
      },
      {
        id: "hyper", name: "Hyperbola x²/a² − y²/b² = 1", formula: "e = √(1 + b²/a²)",
        desc: "Eccentricity and foci of standard hyperbola",
        inputs: [{ id: "a", label: "a" }, { id: "b", label: "b" }],
        compute: ({ a, b }) => {
          [a, b] = [+a, +b];
          if (a <= 0 || b <= 0) return { steps: ["a, b must be > 0"], answer: "Invalid" };
          const c = Math.sqrt(a * a + b * b), e = c / a;
          return { steps: [`a=${a}, b=${b}`, `c = √(a²+b²) = √${a * a + b * b} = ${c.toFixed(4)}`, `e = c/a = ${e.toFixed(6)}`, `Foci: (±${c.toFixed(4)}, 0)`, `e > 1 for hyperbola: ${e.toFixed(4)} > 1 ✓`], answer: `e = ${e.toFixed(4)},  Foci: (±${c.toFixed(4)}, 0)` };
        }
      },
    ]
  },
  {
    id: "matrices", name: "Determinants & Matrices", classes: "Class 12",
    icon: "[M]", emoji: "🟦", color: "#F87171", dim: "#6b0a0a",
    formulas: [
      {
        id: "det2", name: "2×2 Determinant", formula: "|A| = ad − bc",
        desc: "Determinant of a 2×2 matrix [[a,b],[c,d]]",
        inputs: [
          { id: "a", label: "a  (row 1, col 1)" }, { id: "b", label: "b  (row 1, col 2)" },
          { id: "c", label: "c  (row 2, col 1)" }, { id: "d", label: "d  (row 2, col 2)" }
        ],
        compute: ({ a, b, c, d }) => {
          [a, b, c, d] = [+a, +b, +c, +d];
          const det = a * d - b * c;
          return {
            steps: [`Matrix: ⎡ ${a}  ${b} ⎤`, `        ⎣ ${c}  ${d} ⎦`, `|A| = (${a})(${d}) − (${b})(${c}) = ${a * d} − ${b * c} = ${det}`, det !== 0 ? "Det ≠ 0 → Matrix is invertible ✓" : "Det = 0 → Singular matrix (not invertible)"],
            answer: `|A| = ${det}`
          };
        }
      },
      {
        id: "triang", name: "Triangle Area (Coordinate)", formula: "Area = ½|x₁(y₂−y₃)+x₂(y₃−y₁)+x₃(y₁−y₂)|",
        desc: "Area of triangle using vertex coordinates",
        inputs: [
          { id: "x1", label: "x₁" }, { id: "y1", label: "y₁" },
          { id: "x2", label: "x₂" }, { id: "y2", label: "y₂" },
          { id: "x3", label: "x₃" }, { id: "y3", label: "y₃" }
        ],
        compute: ({ x1, y1, x2, y2, x3, y3 }) => {
          [x1, y1, x2, y2, x3, y3] = [x1, y1, x2, y2, x3, y3].map(Number);
          const inner = x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2);
          const area = Math.abs(inner) / 2;
          return {
            steps: [`Vertices: (${x1},${y1}), (${x2},${y2}), (${x3},${y3})`, `= ½|${x1}(${y2}−${y3}) + ${x2}(${y3}−${y1}) + ${x3}(${y1}−${y2})|`, `= ½|${x1 * (y2 - y3)} + ${x2 * (y3 - y1)} + ${x3 * (y1 - y2)}|`, `= ½|${inner}| = ${area}`],
            answer: `Area = ${area.toFixed(4)} sq. units`
          };
        }
      },
    ]
  },
  {
    id: "complex", name: "Complex Numbers", classes: "Class 11",
    icon: "i²=−1", emoji: "🌀", color: "#C084FC", dim: "#3a0a6b",
    formulas: [
      {
        id: "cmod", name: "Modulus |z|", formula: "|z| = √(a² + b²)",
        desc: "Distance of complex number z = a+bi from the origin",
        inputs: [{ id: "a", label: "Real part a" }, { id: "b", label: "Imaginary part b" }],
        compute: ({ a, b }) => {
          [a, b] = [+a, +b];
          const mod = Math.sqrt(a * a + b * b), arg = Math.atan2(b, a) * 180 / Math.PI;
          return { steps: [`z = ${a} + ${b}i`, `|z| = √(${a}²+${b}²) = √(${a * a}+${b * b}) = √${a * a + b * b} = ${mod.toFixed(6)}`, `arg(z) = arctan(${b}/${a}) = ${arg.toFixed(4)}°`], answer: `|z| = ${mod.toFixed(4)},  arg = ${arg.toFixed(2)}°` };
        }
      },
      {
        id: "ipow", name: "Powers of i", formula: "i¹=i, i²=−1, i³=−i, i⁴=1",
        desc: "The imaginary unit cycles with period 4",
        inputs: [{ id: "n", label: "Exponent n  (any integer)" }],
        compute: ({ n }) => {
          n = Math.floor(+n);
          const vals = ["1", "i", "−1", "−i"], rem = ((n % 4) + 4) % 4;
          return { steps: [`Cycle: i⁰=1, i¹=i, i²=−1, i³=−i, i⁴=1, ...`, `n = ${n}`, `${n} mod 4 = ${rem}`, `i^${n} = i^${rem} = ${vals[rem]}`], answer: `i^${n} = ${vals[rem]}` };
        }
      },
    ]
  },
  {
    id: "binomial", name: "Binomial Theorem", classes: "Classes 11–12",
    icon: "Tᵣ₊₁", emoji: "🔭", color: "#2DD4BF", dim: "#033a34",
    formulas: [
      {
        id: "gterm", name: "General Term Tᵣ₊₁", formula: "Tᵣ₊₁ = ⁿCᵣ × aⁿ⁻ʳ × bʳ",
        desc: "Find any specific term in the expansion of (a+b)ⁿ",
        inputs: [
          { id: "a", label: "a" }, { id: "b", label: "b" },
          { id: "n", label: "n  (power, ≤ 20)" }, { id: "r", label: "r  (0-indexed from T₁)" }
        ],
        compute: ({ a, b, n, r }) => {
          [a, b, n, r] = [+a, +b, +n, +r];
          if (r > n || r < 0 || n > 20) return { steps: ["Need 0 ≤ r ≤ n ≤ 20"], answer: "Invalid" };
          const nCr = fact(n) / (fact(r) * fact(n - r));
          const term = nCr * a ** (n - r) * b ** r;
          return {
            steps: [
              `(${a} + ${b})^${n},  r = ${r}`,
              `Tᵣ₊₁ = T${r + 1} = ⁿCᵣ × a^(n−r) × b^r`,
              `= ${n}C${r} × ${a}^${n - r} × ${b}^${r}`,
              `= ${nCr} × ${a ** (n - r)} × ${b ** r}`,
              `= ${nCr * a ** (n - r)} × ${b ** r}`
            ],
            answer: `T${r + 1} = ${term}`
          };
        }
      },
      {
        id: "tterms", name: "Total Terms in Expansion", formula: "(a+b)ⁿ has n+1 terms",
        desc: "Count terms in a binomial expansion",
        inputs: [{ id: "n", label: "n  (power)" }],
        compute: ({ n }) => { n = +n; return { steps: [`(a+b)^${n}`, `Total terms = n+1 = ${n}+1 = ${n + 1}`, `Terms: T₁ (r=0) through T${n + 1} (r=${n})`], answer: `Total terms = ${n + 1}` }; }
      },
    ]
  },
  // ── 20. Circle Theorems ───────────────────────────────────────
  {
    id: "circthm", name: "Circle Theorems", classes: "Classes 9–10",
    icon: "○", emoji: "⭕", color: "#67E8F9", dim: "#063344",
    formulas: [
      {
        id: "eqchord", name: "Equal Chords Theorem",
        formula: "Equal chords ↔ Equal angles at centre",
        desc: "Equal chords of a circle subtend equal angles at the centre — and vice versa.",
        inputs: [{ id: "r", label: "Radius r" }, { id: "d", label: "Chord length d  (≤ 2r)" }],
        compute: ({ r, d }) => {
          [r, d] = [+r, +d];
          if (d > 2 * r || r <= 0 || d <= 0) return { steps: ["Chord cannot exceed diameter (2r)"], answer: "Invalid" };
          const halfAngle = Math.asin(d / (2 * r));
          const centralAngle = 2 * halfAngle * 180 / Math.PI;
          const distFromCentre = Math.sqrt(r * r - (d / 2) ** 2);
          return {
            steps: [
              `Circle radius r = ${r},  Chord length = ${d}`,
              `Half-chord = d/2 = ${d / 2}`,
              `Central angle: 2 × arcsin(d/2r) = 2 × arcsin(${d / 2}/${r})`,
              `= 2 × arcsin(${(d / (2 * r)).toFixed(6)}) = 2 × ${(halfAngle * 180 / Math.PI).toFixed(4)}°`,
              `Central angle θ = ${centralAngle.toFixed(4)}°`,
              `Perpendicular distance from centre to chord = √(r² − (d/2)²)`,
              `= √(${r * r} − ${(d / 2) ** 2}) = ${distFromCentre.toFixed(6)}`,
              `Any equal chord will subtend the same angle of ${centralAngle.toFixed(2)}° ✓`
            ],
            answer: `Central angle = ${centralAngle.toFixed(2)}°,  Distance from centre = ${distFromCentre.toFixed(4)}`
          };
        }
      },
      {
        id: "angcentre", name: "Angle at Centre = 2 × Angle at Circumference",
        formula: "∠AOB = 2 × ∠ACB  (same arc AB)",
        desc: "The central angle is twice any inscribed angle subtending the same arc.",
        inputs: [{ id: "inscribed", label: "Inscribed angle ∠ACB  (degrees)" }],
        compute: ({ inscribed }) => {
          inscribed = +inscribed;
          if (inscribed <= 0 || inscribed >= 180) return { steps: ["Inscribed angle must be between 0° and 180°"], answer: "Invalid" };
          const central = 2 * inscribed;
          return {
            steps: [
              `Inscribed angle ∠ACB = ${inscribed}°  (C is any point on remaining arc)`,
              `Theorem: Central angle = 2 × Inscribed angle`,
              `∠AOB = 2 × ${inscribed}° = ${central}°`,
              `This holds for any position of C on the major arc ✓`,
              central === 180 ? `Note: If ∠ACB = 90°, AB is a diameter (angle in semicircle)` : ""
            ].filter(Boolean),
            answer: `Central angle ∠AOB = ${central}°`
          };
        }
      },
      {
        id: "semicircle", name: "Angle in a Semicircle = 90°",
        formula: "If AB is diameter → ∠ACB = 90°",
        desc: "Any angle inscribed in a semicircle is always a right angle.",
        inputs: [{ id: "r", label: "Radius r  (for verification)" }],
        compute: ({ r }) => {
          r = +r;
          return {
            steps: [
              `Circle with radius r = ${r}`,
              `Diameter = 2r = ${2 * r}`,
              `Central angle subtended by diameter = 180°`,
              `Inscribed angle = Central angle / 2 = 180° / 2 = 90°`,
              `∴ Angle in semicircle = 90° always — regardless of where C is on the arc`,
              `This is a special case of the Central Angle Theorem ✓`
            ],
            answer: `∠ACB = 90° always (for any C on the semicircle)`
          };
        }
      },
      {
        id: "cyclicquad", name: "Cyclic Quadrilateral",
        formula: "Opposite angles sum = 180°",
        desc: "In a cyclic quadrilateral ABCD, opposite angles are supplementary.",
        inputs: [{ id: "angleA", label: "∠A  (degrees)" }],
        compute: ({ angleA }) => {
          angleA = +angleA;
          if (angleA <= 0 || angleA >= 360) return { steps: ["Angle must be between 0° and 360°"], answer: "Invalid" };
          const angleC = 180 - angleA;
          return {
            steps: [
              `In cyclic quadrilateral ABCD:`,
              `∠A = ${angleA}°`,
              `Theorem: ∠A + ∠C = 180°  and  ∠B + ∠D = 180°`,
              `∠C = 180° − ∠A = 180° − ${angleA}° = ${angleC}°`,
              `If ∠B is known, ∠D = 180° − ∠B`,
              `Reason: Each pair of opposite angles subtends arcs that together form the full circle (360°), and inscribed angles are half the central angle ✓`
            ],
            answer: `∠A = ${angleA}°,  Opposite ∠C = ${angleC}°`
          };
        }
      },
    ]
  },

  // ── 21. Advanced 3D Geometry ──────────────────────────────────
  {
    id: "geom3d", name: "Advanced 3D Geometry", classes: "Class 12",
    icon: "ax+d", emoji: "🧊", color: "#86EFAC", dim: "#063a14",
    formulas: [
      {
        id: "planeeq", name: "Equation of a Plane", formula: "ax + by + cz + d = 0",
        desc: "General equation of a plane — (a, b, c) is the normal vector",
        inputs: [
          { id: "a", label: "a  (normal x-comp)" }, { id: "b", label: "b  (normal y-comp)" },
          { id: "c", label: "c  (normal z-comp)" }, { id: "d", label: "d  (constant)" }
        ],
        compute: ({ a, b, c, d }) => {
          [a, b, c, d] = [+a, +b, +c, +d];
          const normMag = Math.sqrt(a * a + b * b + c * c);
          const distFromOrigin = Math.abs(d) / normMag;
          return {
            steps: [
              `Plane equation: ${a}x + ${b}y + ${c}z + ${d} = 0`,
              `Normal vector n⃗ = (${a}, ${b}, ${c})`,
              `|n⃗| = √(${a}²+${b}²+${c}²) = √${a * a + b * b + c * c} = ${normMag.toFixed(6)}`,
              `Unit normal = n⃗/|n⃗| = (${(a / normMag).toFixed(4)}, ${(b / normMag).toFixed(4)}, ${(c / normMag).toFixed(4)})`,
              `Distance from origin to plane = |d| / |n⃗| = ${Math.abs(d)} / ${normMag.toFixed(4)} = ${distFromOrigin.toFixed(6)}`
            ],
            answer: `Plane: ${a}x+${b}y+${c}z+${d}=0,  Dist from origin = ${distFromOrigin.toFixed(4)}`
          };
        }
      },
      {
        id: "ptplane", name: "Distance: Point to Plane",
        formula: "d = |ax₁+by₁+cz₁+d| / √(a²+b²+c²)",
        desc: "Perpendicular distance from a point to a plane",
        inputs: [
          { id: "a", label: "a" }, { id: "b", label: "b" }, { id: "c", label: "c" }, { id: "d", label: "d" },
          { id: "x1", label: "Point x₁" }, { id: "y1", label: "Point y₁" }, { id: "z1", label: "Point z₁" }
        ],
        compute: ({ a, b, c, d, x1, y1, z1 }) => {
          [a, b, c, d, x1, y1, z1] = [a, b, c, d, x1, y1, z1].map(Number);
          const num = Math.abs(a * x1 + b * y1 + c * z1 + d);
          const den = Math.sqrt(a * a + b * b + c * c);
          const dist = num / den;
          return {
            steps: [
              `Plane: ${a}x + ${b}y + ${c}z + ${d} = 0`,
              `Point P = (${x1}, ${y1}, ${z1})`,
              `Numerator = |ax₁+by₁+cz₁+d|`,
              `= |${a}(${x1})+${b}(${y1})+${c}(${z1})+${d}|`,
              `= |${a * x1}+${b * y1}+${c * z1}+${d}|`,
              `= |${a * x1 + b * y1 + c * z1 + d}| = ${num}`,
              `Denominator = √(${a}²+${b}²+${c}²) = √${a * a + b * b + c * c} = ${den.toFixed(6)}`,
              `Distance = ${num} / ${den.toFixed(4)} = ${dist.toFixed(6)}`
            ],
            answer: `Distance = ${dist.toFixed(4)} units`
          };
        }
      },
      {
        id: "intplane", name: "Intercept Form of Plane",
        formula: "x/a + y/b + z/c = 1",
        desc: "Plane with x-intercept a, y-intercept b, z-intercept c",
        inputs: [
          { id: "a", label: "x-intercept a  (≠0)" },
          { id: "b", label: "y-intercept b  (≠0)" },
          { id: "c", label: "c  (z-intercept, ≠0)" }
        ],
        compute: ({ a, b, c }) => {
          [a, b, c] = [+a, +b, +c];
          if (!a || !b || !c) return { steps: ["None of a, b, c can be zero"], answer: "Invalid" };
          // Convert to general form: bcx + acy + abz = abc
          const A = b * c, B = a * c, C = a * b, D = -(a * b * c);
          const normMag = Math.sqrt(A * A + B * B + C * C);
          return {
            steps: [
              `Intercept form: x/${a} + y/${b} + z/${c} = 1`,
              `Intercepts: A(${a},0,0),  B(0,${b},0),  C(0,0,${c})`,
              `General form: multiply through by ${a * b * c}:`,
              `${b * c}x + ${a * c}y + ${a * b}z = ${a * b * c}`,
              `Or: ${A}x + ${B}y + ${C}z + ${D} = 0`,
              `Normal vector: (${A}, ${B}, ${C})`,
              `Dist from origin = |${D}| / √(${A}²+${B}²+${C}²) = ${Math.abs(D)} / ${normMag.toFixed(4)} = ${(Math.abs(D) / normMag).toFixed(4)}`
            ],
            answer: `x/${a} + y/${b} + z/${c} = 1  →  ${A}x+${B}y+${C}z+${D}=0`
          };
        }
      },
    ]
  },

  // ── 22. Statistics – Dispersion ───────────────────────────────
  {
    id: "dispersion", name: "Statistics – Dispersion", classes: "Class 11",
    icon: "σ²", emoji: "📊", color: "#FCA5A5", dim: "#5a0a0a",
    formulas: [
      {
        id: "variance", name: "Variance σ²",
        formula: "σ² = Σ(xᵢ − x̄)² / n",
        desc: "Average of squared deviations from the mean",
        inputs: [{ id: "vals", label: "Data values  (comma-separated, e.g. 2,4,6,8)", type: "text" }],
        compute: ({ vals }) => {
          const arr = String(vals).split(",").map(Number).filter((v) => !isNaN(v));
          if (arr.length < 2) return { steps: ["Enter at least 2 comma-separated numbers"], answer: "Invalid" };
          const n = arr.length;
          const mean = arr.reduce((s, v) => s + v, 0) / n;
          const devSq = arr.map((v) => (v - mean) ** 2);
          const variance = devSq.reduce((s, v) => s + v, 0) / n;
          const sd = Math.sqrt(variance);
          return {
            steps: [
              `Data: [${arr.join(", ")}]`,
              `n = ${n}`,
              `Mean x̄ = (${arr.join("+")}) / ${n} = ${arr.reduce((s, v) => s + v, 0)} / ${n} = ${mean.toFixed(6)}`,
              `Deviations (xᵢ − x̄): [${arr.map(v => (v - mean).toFixed(4)).join(", ")}]`,
              `Squared deviations: [${devSq.map(v => v.toFixed(4)).join(", ")}]`,
              `Σ(xᵢ−x̄)² = ${devSq.reduce((s, v) => s + v, 0).toFixed(6)}`,
              `Variance σ² = ${devSq.reduce((s, v) => s + v, 0).toFixed(6)} / ${n} = ${variance.toFixed(6)}`,
              `Standard Deviation σ = √${variance.toFixed(4)} = ${sd.toFixed(6)}`
            ],
            answer: `Variance σ² = ${variance.toFixed(4)},   σ = ${sd.toFixed(4)}`
          };
        }
      },
      {
        id: "stddev", name: "Standard Deviation σ",
        formula: "σ = √Variance = √(Σ(xᵢ−x̄)²/n)",
        desc: "Measure of spread of data around the mean",
        inputs: [{ id: "vals", label: "Data values  (comma-separated)", type: "text" }],
        compute: ({ vals }) => {
          const arr = String(vals).split(",").map(Number).filter((v) => !isNaN(v));
          if (arr.length < 2) return { steps: ["Enter at least 2 values"], answer: "Invalid" };
          const n = arr.length;
          const mean = arr.reduce((s, v) => s + v, 0) / n;
          const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
          const sd = Math.sqrt(variance);
          const cv = (sd / Math.abs(mean)) * 100;
          return {
            steps: [
              `Data: [${arr.join(", ")}]`,
              `Mean x̄ = ${mean.toFixed(4)}`,
              `Variance σ² = ${variance.toFixed(6)}`,
              `σ = √${variance.toFixed(4)} = ${sd.toFixed(6)}`,
              `Min = ${Math.min(...arr)},  Max = ${Math.max(...arr)}`,
              `Range = ${Math.max(...arr) - Math.min(...arr)}`,
              `~68% of data lies within x̄ ± σ = [${(mean - sd).toFixed(2)},  ${(mean + sd).toFixed(2)}]`
            ],
            answer: `σ = ${sd.toFixed(4)}`
          };
        }
      },
      {
        id: "cv", name: "Coefficient of Variation",
        formula: "CV = (σ / x̄) × 100",
        desc: "Relative measure of dispersion — useful to compare variability of different datasets",
        inputs: [{ id: "vals", label: "Data values  (comma-separated)", type: "text" }],
        compute: ({ vals }) => {
          const arr = String(vals).split(",").map(Number).filter((v) => !isNaN(v));
          if (arr.length < 2) return { steps: ["Enter at least 2 values"], answer: "Invalid" };
          const n = arr.length;
          const mean = arr.reduce((s, v) => s + v, 0) / n;
          if (mean === 0) return { steps: ["Mean is 0 — CV is undefined"], answer: "Undefined" };
          const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
          const sd = Math.sqrt(variance);
          const cv = (sd / Math.abs(mean)) * 100;
          return {
            steps: [
              `Data: [${arr.join(", ")}]`,
              `Mean x̄ = ${mean.toFixed(4)}`,
              `Standard Deviation σ = ${sd.toFixed(4)}`,
              `CV = (σ / x̄) × 100 = (${sd.toFixed(4)} / ${mean.toFixed(4)}) × 100`,
              `CV = ${cv.toFixed(4)}%`,
              cv < 15 ? "CV < 15% → Low variability (consistent data)" :
              cv < 30 ? "CV 15–30% → Moderate variability" :
                        "CV > 30% → High variability (spread out data)"
            ],
            answer: `CV = ${cv.toFixed(2)}%`
          };
        }
      },
    ]
  },

  // ── 23. Differential Equations ────────────────────────────────
  {
    id: "diffeq", name: "Differential Equations", classes: "Class 12",
    icon: "dy/dx", emoji: "🌊", color: "#FDBA74", dim: "#5a2a00",
    formulas: [
      {
        id: "ifactor", name: "Integrating Factor Method",
        formula: "I.F. = e^(∫P dx),  then y·(I.F.) = ∫Q·(I.F.) dx + C",
        desc: "Solve the linear ODE dy/dx + Py = Q  (P, Q functions of x only)",
        inputs: [
          { id: "P_const", label: "P  (constant, if P = constant)" },
          { id: "Q_val", label: "Q  (constant value)" },
          { id: "x", label: "x  (evaluate I.F. at x =)" }
        ],
        compute: ({ P_const, Q_val, x }) => {
          [P_const, Q_val, x] = [+P_const, +Q_val, +x];
          const IF = Math.exp(P_const * x);
          return {
            steps: [
              `Linear ODE: dy/dx + (${P_const})y = ${Q_val}`,
              `Here P = ${P_const}  (constant),  Q = ${Q_val}  (constant)`,
              `Step 1: Find Integrating Factor`,
              `I.F. = e^(∫P dx) = e^(∫${P_const} dx) = e^(${P_const}x)`,
              `At x = ${x}: I.F. = e^(${P_const}×${x}) = e^${P_const * x} = ${IF.toFixed(6)}`,
              `Step 2: Multiply both sides by I.F.:`,
              `d/dx [y × e^(${P_const}x)] = ${Q_val} × e^(${P_const}x)`,
              `Step 3: Integrate both sides:`,
              P_const !== 0
                ? `y × e^(${P_const}x) = (${Q_val}/${P_const}) e^(${P_const}x) + C`
                : `y = ${Q_val}x + C`,
              P_const !== 0
                ? `General Solution: y = ${Q_val / P_const} + C × e^(−${P_const}x)`
                : `General Solution: y = ${Q_val}x + C`
            ],
            answer: P_const !== 0
              ? `y = ${(Q_val / P_const).toFixed(4)} + C·e^(−${P_const}x),   I.F.(${x}) = ${IF.toFixed(4)}`
              : `y = ${Q_val}x + C`
          };
        }
      },
      {
        id: "sepvar", name: "Separation of Variables",
        formula: "∫g(y) dy = ∫f(x) dx + C",
        desc: "Solve dy/dx = f(x)/g(y) — most common DE technique",
        inputs: [
          { id: "fx_n", label: "f(x) = xⁿ  — power n" },
          { id: "gy_n", label: "g(y) = yᵐ  — power m" }
        ],
        compute: ({ fx_n, gy_n }) => {
          [fx_n, gy_n] = [+fx_n, +gy_n];
          const xNew = fx_n + 1, yNew = gy_n + 1;
          const showX = fx_n === -1 ? "ln|x|" : `x^${xNew}/${xNew}`;
          const showY = gy_n === -1 ? "ln|y|" : `y^${yNew}/${yNew}`;
          return {
            steps: [
              `Equation: dy/dx = x^${fx_n} / y^${gy_n}`,
              `Separate: y^${gy_n} dy = x^${fx_n} dx`,
              `Integrate both sides:`,
              `∫y^${gy_n} dy = ∫x^${fx_n} dx`,
              `${showY} = ${showX} + C`,
              `This is the general implicit solution.`,
              `Tip: To get explicit y, isolate y from the equation above.`
            ],
            answer: `${showY} = ${showX} + C`
          };
        }
      },
    ]
  },

  // ── 24. Hyperbolic & Exponential Derivatives ──────────────────
  {
    id: "expderiv", name: "Exponential & Special Derivatives", classes: "Classes 11–12",
    icon: "aˣ", emoji: "🚀", color: "#A5F3FC", dim: "#063344",
    formulas: [
      {
        id: "axderiv", name: "d/dx(aˣ) = aˣ log a",
        formula: "d/dx(aˣ) = aˣ · ln(a)",
        desc: "Derivative of an exponential with arbitrary base a",
        inputs: [{ id: "a", label: "Base a  (> 0, ≠ 1)" }, { id: "x", label: "x  (evaluate at)" }],
        compute: ({ a, x }) => {
          [a, x] = [+a, +x];
          if (a <= 0 || a === 1) return { steps: ["Base a must be > 0 and ≠ 1"], answer: "Invalid" };
          const lna = Math.log(a);
          const val = a ** x * lna;
          return {
            steps: [
              `f(x) = a^x = ${a}^x`,
              `d/dx(a^x) = a^x × ln(a)`,
              `ln(${a}) = ${lna.toFixed(8)}`,
              `At x = ${x}:`,
              `f'(${x}) = ${a}^${x} × ln(${a})`,
              `= ${a ** x} × ${lna.toFixed(6)}`,
              `= ${val.toFixed(8)}`
            ],
            answer: `d/dx(${a}^x) at x=${x} = ${val.toFixed(4)}`
          };
        }
      },
      {
        id: "lnderiv", name: "d/dx(ln x) = 1/x",
        formula: "d/dx(logₑ x) = 1/x  (x > 0)",
        desc: "Derivative of the natural logarithm",
        inputs: [{ id: "x", label: "x  (> 0)" }],
        compute: ({ x }) => {
          x = +x;
          if (x <= 0) return { steps: ["x must be > 0"], answer: "Invalid" };
          return {
            steps: [
              `f(x) = ln(x) = log_e(x)`,
              `f'(x) = 1/x  (fundamental derivative)`,
              `At x = ${x}:`,
              `f'(${x}) = 1/${x} = ${(1 / x).toFixed(8)}`,
              `Note: ln(${x}) = ${Math.log(x).toFixed(6)}`
            ],
            answer: `d/dx(ln x) at x=${x} = 1/${x} = ${(1 / x).toFixed(4)}`
          };
        }
      },
      {
        id: "absderiv", name: "d/dx(|x|) = x/|x|",
        formula: "d/dx(|x|) = x/|x|  (x ≠ 0)",
        desc: "Derivative of the absolute value function — not defined at x = 0",
        inputs: [{ id: "x", label: "x  (≠ 0)" }],
        compute: ({ x }) => {
          x = +x;
          if (x === 0) return { steps: ["Derivative of |x| is NOT defined at x = 0  (sharp corner)"], answer: "Undefined at x = 0" };
          const deriv = x / Math.abs(x);
          return {
            steps: [
              `f(x) = |x|`,
              `f'(x) = x / |x|`,
              `At x = ${x}:`,
              `|x| = ${Math.abs(x)}`,
              `f'(${x}) = ${x} / ${Math.abs(x)} = ${deriv}`,
              x > 0 ? "x > 0, so d/dx(|x|) = +1  (slope of y=x)" : "x < 0, so d/dx(|x|) = −1  (slope of y=−x)"
            ],
            answer: `d/dx(|x|) at x=${x} = ${deriv}`
          };
        }
      },
    ]
  },

  // ── 25. Commercial Math Basics ────────────────────────────────
  {
    id: "commercial", name: "Commercial Math Basics", classes: "Classes 9–10",
    icon: "₹%", emoji: "💰", color: "#FDE68A", dim: "#5a4200",
    formulas: [
      {
        id: "si", name: "Simple Interest",
        formula: "I = P × R × T / 100",
        desc: "Interest calculated only on the principal amount",
        inputs: [
          { id: "P", label: "P  (Principal)" },
          { id: "R", label: "R  (Rate % per annum)" },
          { id: "T", label: "T  (Time in years)" }
        ],
        compute: ({ P, R, T }) => {
          [P, R, T] = [+P, +R, +T];
          if (P <= 0 || R < 0 || T < 0) return { steps: ["P must be > 0; R, T ≥ 0"], answer: "Invalid" };
          const I = P * R * T / 100;
          const A = P + I;
          return {
            steps: [
              `Principal P = ${P}`,
              `Rate R = ${R}% per annum`,
              `Time T = ${T} years`,
              `I = P×R×T / 100`,
              `= ${P} × ${R} × ${T} / 100`,
              `= ${P * R * T} / 100`,
              `= ${I}`,
              `Total Amount A = P + I = ${P} + ${I} = ${A}`
            ],
            answer: `Interest = ${I},   Amount = ${A}`
          };
        }
      },
      {
        id: "ci", name: "Compound Interest",
        formula: "A = P(1 + r/100)ⁿ",
        desc: "Amount after compound interest — interest on interest included",
        inputs: [
          { id: "P", label: "P  (Principal)" },
          { id: "r", label: "r  (Rate % per annum)" },
          { id: "n", label: "n  (Number of years)" }
        ],
        compute: ({ P, r, n }) => {
          [P, r, n] = [+P, +r, +n];
          if (P <= 0 || r < 0 || n < 0) return { steps: ["Invalid inputs"], answer: "Invalid" };
          const A = P * (1 + r / 100) ** n;
          const CI = A - P;
          const SI = P * r * n / 100;
          return {
            steps: [
              `P = ${P},  r = ${r}%,  n = ${n} years`,
              `A = P(1 + r/100)^n`,
              `= ${P} × (1 + ${r}/100)^${n}`,
              `= ${P} × (${1 + r / 100})^${n}`,
              `= ${P} × ${(1 + r / 100) ** n}`,
              `A = ${A.toFixed(4)}`,
              `Compound Interest CI = A − P = ${CI.toFixed(4)}`,
              `Simple Interest (same P,r,n) = ${SI.toFixed(4)}`,
              `Extra earned due to compounding = ${(CI - SI).toFixed(4)}`
            ],
            answer: `Amount = ${A.toFixed(2)},   CI = ${CI.toFixed(2)}`
          };
        }
      },
      {
        id: "midpt", name: "Midpoint Formula",
        formula: "M = ( (x₁+x₂)/2,  (y₁+y₂)/2 )",
        desc: "Midpoint of a line segment — special case of section formula with m:n = 1:1",
        inputs: [{ id: "x1", label: "x₁" }, { id: "y1", label: "y₁" }, { id: "x2", label: "x₂" }, { id: "y2", label: "y₂" }],
        compute: ({ x1, y1, x2, y2 }) => {
          [x1, y1, x2, y2] = [+x1, +y1, +x2, +y2];
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          return {
            steps: [
              `Points: A(${x1}, ${y1})  and  B(${x2}, ${y2})`,
              `Mx = (x₁+x₂)/2 = (${x1}+${x2})/2 = ${x1 + x2}/2 = ${mx}`,
              `My = (y₁+y₂)/2 = (${y1}+${y2})/2 = ${y1 + y2}/2 = ${my}`,
              `(Special case of section formula with ratio 1:1)`
            ],
            answer: `Midpoint M = (${mx}, ${my})`
          };
        }
      },
    ]
  },

  // ── 26. Trigonometric Limits ──────────────────────────────────
  {
    id: "triglims", name: "Trigonometric Limits", classes: "Class 11",
    icon: "tan x/x", emoji: "📉", color: "#D8B4FE", dim: "#3a0a6b",
    formulas: [
      {
        id: "tanlim", name: "lim(x→0) tan(x)/x = 1",
        formula: "lim(x→0) tan(x)/x = 1",
        desc: "Analogous to the sin(x)/x limit — verify numerically",
        inputs: [{ id: "x", label: "x  (small value near 0, radians)" }],
        compute: ({ x }) => {
          x = +x;
          if (x === 0) return { steps: ["Limiting case: value = 1 exactly"], answer: "lim = 1 (exact)" };
          const val = Math.tan(x) / x;
          return {
            steps: [
              `x = ${x} rad`,
              `tan(${x}) = sin(${x})/cos(${x}) = ${Math.sin(x).toFixed(8)} / ${Math.cos(x).toFixed(8)} = ${Math.tan(x).toFixed(8)}`,
              `tan(x)/x = ${Math.tan(x).toFixed(8)} / ${x} = ${val.toFixed(8)}`,
              `As x → 0:  tan(x)/x → 1`,
              `Proof hint: tan(x) = sin(x)/cos(x), and cos(x)→1 as x→0, so tan(x)/x → sin(x)/x → 1`
            ],
            answer: `tan(x)/x at x=${x} ≈ ${val.toFixed(6)}  (→ 1 as x→0)`
          };
        }
      },
      {
        id: "coslim0", name: "lim(x→0) cos(x) = 1",
        formula: "lim(x→0) cos(x) = 1",
        desc: "Cosine is continuous at x = 0 — its limit equals its value",
        inputs: [{ id: "x", label: "x  (small value near 0, radians)" }],
        compute: ({ x }) => {
          x = +x;
          if (x === 0) return { steps: ["cos(0) = 1 exactly"], answer: "cos(0) = 1" };
          const val = Math.cos(x);
          return {
            steps: [
              `x = ${x} rad`,
              `cos(x) = cos(${x}) = ${val.toFixed(8)}`,
              `1 − cos(x) = ${(1 - val).toFixed(8)}`,
              `As x → 0, cos(x) → 1  (cosine is continuous everywhere)`,
              `Also: lim(x→0) (1−cos x)/x = 0  (shown next)`
            ],
            answer: `cos(${x}) = ${val.toFixed(6)}  → 1 as x→0`
          };
        }
      },
      {
        id: "onemincos", name: "lim(x→0) (1−cos x)/x = 0",
        formula: "lim(x→0) (1−cos x)/x = 0",
        desc: "An important limit that often appears as a sub-result in proofs",
        inputs: [{ id: "x", label: "x  (small value near 0, radians)" }],
        compute: ({ x }) => {
          x = +x;
          if (x === 0) return { steps: ["Direct substitution gives 0/0 — use L'Hôpital or identity", "Result = 0 exactly"], answer: "lim = 0 (exact)" };
          const val = (1 - Math.cos(x)) / x;
          return {
            steps: [
              `x = ${x} rad`,
              `cos(x) = ${Math.cos(x).toFixed(8)}`,
              `1 − cos(x) = ${(1 - Math.cos(x)).toFixed(8)}`,
              `(1−cos x)/x = ${(1 - Math.cos(x)).toFixed(8)} / ${x} = ${val.toFixed(8)}`,
              `As x→0: numerically → 0`,
              `Proof: (1−cosx)/x = 2sin²(x/2)/x → 2(x/2)²/x = x/2 → 0 ✓`
            ],
            answer: `(1−cos x)/x at x=${x} ≈ ${val.toFixed(6)}  (→ 0 as x→0)`
          };
        }
      },
    ]
  },
];

// ─── Main App ─────────────────────────────────────────────────
function MathFormulaExplorer() {
  const [page, setPage] = useState("home");
  const [topic, setTopic] = useState(null);
  const [calcFormula, setCalcFormula] = useState(null);
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=JetBrains+Mono:wght@400;600&family=Inter:wght@300;400;500;600&display=swap";
    document.head.appendChild(l);

    const s = document.createElement("style");
    s.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #0a0a1a; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
      @keyframes fadeSlideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
      .card-hover:hover { transform: translateY(-2px); }
      .btn-hover { transition: all 0.15s ease; }
      .btn-hover:active { transform: scale(0.97); }
    `;
    document.head.appendChild(s);
  }, []);

  const nav = (newPage, t = null) => {
    setTransitioning(true);
    setTimeout(() => {
      setPage(newPage);
      if (t) setTopic(t);
      setCalcFormula(null);
      setResult(null);
      setTransitioning(false);
    }, 180);
  };

  const openCalc = (f) => {
    setCalcFormula(f);
    setInputs({});
    setResult(null);
    setTimeout(() => modalRef.current?.scrollTo(0, 0), 50);
  };

  const closeCalc = () => { setCalcFormula(null); setResult(null); };

  const compute = () => {
    try {
      const r = calcFormula.compute(inputs);
      setResult(r);
      setTimeout(() => {
        document.getElementById("calc-result")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    } catch (e) {
      setResult({ steps: ["Error: " + e.message], answer: "Calculation Error" });
    }
  };

  const accent = topic?.color || "#FF6B6B";

  return (
    <div style={{ minHeight: "100vh", background: "#080818", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40, background: "rgba(8,8,24,0.92)",
        backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {page === "topic" && (
            <button onClick={() => nav("home")} className="btn-hover" style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
              color: "#e2e8f0", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6
            }}>← Back</button>
          )}
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: "#fff", letterSpacing: "-0.3px" }}>
            {page === "home" ? (
              <span>Math<span style={{ color: "#FF6B6B" }}>Forge</span></span>
            ) : (
              <span style={{ color: accent }}>{topic?.emoji} {topic?.name}</span>
            )}
          </div>
        </div>
        {page === "home" && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            {TOPICS.length} topics · 100% offline
          </div>
        )}
        {page === "topic" && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", background: `${accent}22`, border: `1px solid ${accent}44`, padding: "3px 10px", borderRadius: 20 }}>
            {topic?.classes}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div style={{ animation: transitioning ? "none" : "fadeSlideUp 0.35s ease", opacity: transitioning ? 0 : 1, transition: "opacity 0.18s" }}>
        {page === "home" ? (
          <Home topics={TOPICS} onSelect={(t) => nav("topic", t)} />
        ) : (
          <TopicPage topic={topic} onCalc={openCalc} />
        )}
      </div>

      {/* Calculator Modal */}
      {calcFormula && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end",
          background: "rgba(0,0,0,0.72)", animation: "fadeIn 0.2s ease"
        }} onClick={(e) => e.target === e.currentTarget && closeCalc()}>
          <div ref={modalRef} style={{
            background: "#0f0f24", borderTop: `2px solid ${accent}`,
            borderRadius: "20px 20px 0 0", padding: "0 0 40px", maxHeight: "88vh",
            overflowY: "auto", animation: "slideUp 0.28s cubic-bezier(0.34,1.26,0.64,1)"
          }}>
            {/* Modal Header */}
            <div style={{ position: "sticky", top: 0, background: "#0f0f24", zIndex: 2, padding: "18px 24px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 4 }}>
                    {calcFormula.name}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: accent, letterSpacing: "-0.3px" }}>
                    {calcFormula.formula}
                  </div>
                </div>
                <button onClick={closeCalc} className="btn-hover" style={{
                  background: "rgba(255,255,255,0.08)", border: "none", color: "#94a3b8",
                  borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 18, lineHeight: 1
                }}>✕</button>
              </div>
              {calcFormula.desc && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>{calcFormula.desc}</div>
              )}
            </div>

            {/* Inputs */}
            <div style={{ padding: "20px 24px 0" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Enter Values</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {calcFormula.inputs.map((inp) => (
                  <div key={inp.id}>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                      {inp.label}
                    </label>
                    <input
                      type={inp.type || "number"}
                      step="any"
                      value={inputs[inp.id] ?? ""}
                      onChange={(e) => { setInputs({ ...inputs, [inp.id]: e.target.value }); setResult(null); }}
                      placeholder="0"
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${inputs[inp.id] ? accent + "66" : "rgba(255,255,255,0.12)"}`,
                        borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 15,
                        fontFamily: "'JetBrains Mono', monospace", outline: "none",
                        transition: "border-color 0.2s"
                      }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={compute} className="btn-hover" style={{
                marginTop: 20, width: "100%", padding: "14px 20px",
                background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
                border: "none", borderRadius: 12, color: "#000", fontWeight: 700,
                fontSize: 15, cursor: "pointer", letterSpacing: "0.3px",
                boxShadow: `0 4px 20px ${accent}44`
              }}>
                ⚡ Calculate
              </button>
            </div>

            {/* Result */}
            {result && (
              <div id="calc-result" style={{ margin: "20px 24px 0", animation: "fadeSlideUp 0.3s ease" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Step-by-Step Solution
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    {result.steps.map((step, i) => (
                      <div key={i} style={{
                        display: "flex", gap: 10, marginBottom: i < result.steps.length - 1 ? 10 : 0,
                        animation: `fadeSlideUp 0.3s ease ${i * 0.06}s both`
                      }}>
                        <span style={{ color: `${accent}88`, fontSize: 12, minWidth: 18, paddingTop: 1, fontFamily: "'JetBrains Mono'" }}>{i + 1}.</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{
                  marginTop: 12, padding: "16px 20px", background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
                  border: `1px solid ${accent}44`, borderRadius: 14, textAlign: "center"
                }}>
                  <div style={{ fontSize: 11, color: `${accent}99`, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Answer</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: accent, fontWeight: 600, letterSpacing: "-0.5px" }}>
                    {result.answer}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────
function Home({ topics, onSelect }) {
  return (
    <div style={{ padding: "28px 16px 40px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 36, color: "#fff", lineHeight: 1.15, marginBottom: 10 }}>
          Every Formula.<br />
          <span style={{ color: "#FF6B6B", fontStyle: "italic" }}>Solved Instantly.</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.6 }}>
          Classes 9–12 · JEE · 100% offline · Step-by-step solutions
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {topics.map((t, i) => (
          <TopicCard key={t.id} topic={t} onSelect={onSelect} delay={i * 0.04} />
        ))}
      </div>
    </div>
  );
}

function TopicCard({ topic, onSelect, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      className="card-hover"
      onClick={() => onSelect(topic)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${topic.color}12` : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? topic.color + "55" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16, padding: "20px 18px", cursor: "pointer", textAlign: "left",
        animation: `fadeSlideUp 0.4s ease ${delay}s both`,
        boxShadow: hov ? `0 4px 24px ${topic.color}22` : "none",
      }}
    >
      <div style={{
        fontSize: 28, marginBottom: 14, width: 52, height: 52, borderRadius: 14,
        background: `${topic.color}18`, border: `1px solid ${topic.color}33`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
        color: topic.color, fontSize: 13, letterSpacing: "-1px"
      }}>
        {topic.icon}
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 4, lineHeight: 1.3 }}>
        {topic.name}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>{topic.classes}</div>
      <div style={{ fontSize: 11, color: topic.color, display: "flex", alignItems: "center", gap: 4 }}>
        {topic.formulas.length} formula{topic.formulas.length !== 1 ? "s" : ""} →
      </div>
    </button>
  );
}

// ─── Topic Page ───────────────────────────────────────────────
function TopicPage({ topic, onCalc }) {
  return (
    <div style={{ padding: "24px 16px 60px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>{topic.emoji}</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 30, color: "#fff", marginBottom: 6 }}>
          {topic.name}
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{topic.classes}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {topic.formulas.map((f, i) => (
          <FormulaCard key={f.id} formula={f} color={topic.color} delay={i * 0.05} onCalc={onCalc} />
        ))}
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
      style={{
        background: hov ? `${color}0a` : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? color + "44" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16, padding: "20px", animation: `fadeSlideUp 0.35s ease ${delay}s both`,
        transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
        boxShadow: hov ? `0 2px 16px ${color}18` : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#fff", marginBottom: 8 }}>{formula.name}</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: color,
            background: `${color}10`, border: `1px solid ${color}22`,
            borderRadius: 8, padding: "8px 12px", marginBottom: formula.desc ? 10 : 0,
            wordBreak: "break-all", lineHeight: 1.7
          }}>
            {formula.formula}
          </div>
          {formula.desc && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{formula.desc}</div>
          )}
        </div>
        <button
          className="btn-hover"
          onClick={() => onCalc(formula)}
          onMouseEnter={() => setTryHov(true)}
          onMouseLeave={() => setTryHov(false)}
          style={{
            background: tryHov ? color : `${color}22`,
            border: `1px solid ${color}55`, borderRadius: 10,
            color: tryHov ? "#000" : color, fontWeight: 700, fontSize: 12,
            padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap",
            flexShrink: 0, transition: "all 0.15s ease", letterSpacing: "0.3px"
          }}
        >
          Try It →
        </button>
      </div>
    </div>
  );
}

// Register for chat.html's overlay loader
window._MathFormulaExplorerComponent = MathFormulaExplorer;

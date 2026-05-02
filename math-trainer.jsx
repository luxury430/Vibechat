import { useState, useEffect, useRef } from "react";

/* =====================================================================
   GOOGLE FONTS INJECTION
   ===================================================================== */
const injectFonts = () => {
  if (!document.getElementById("math-trainer-fonts")) {
    const link = document.createElement("link");
    link.id = "math-trainer-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
};

/* =====================================================================
   COLOUR TOKENS
   ===================================================================== */
const C = {
  bg: "#08080D",
  surface: "#111118",
  surface2: "#1A1A24",
  border: "#252532",
  borderBright: "#35354A",
  primary: "#FFE449",      // yellow-gold
  primaryDim: "#3D360A",
  success: "#3DFF8F",
  successDim: "#0A2E1A",
  error: "#FF4D6A",
  errorDim: "#2E0A10",
  hint: "#8B8BFF",
  hintDim: "#12122E",
  text: "#F0F0FF",
  muted: "#6B6B8A",
  beginner: "#3DFF8F",
  intermediate: "#FFE449",
  advanced: "#FF9B43",
  olympiad: "#FF4D6A",
};

/* =====================================================================
   ASSESSMENT QUESTIONS  (auto-place user into a level)
   ===================================================================== */
const ASSESSMENT_QS = [
  { q: "15 + 28 = ?", opts: ["41","43","44","42"], ans: "43", diff: "beginner" },
  { q: "25% of 80 = ?", opts: ["15","20","25","40"], ans: "20", diff: "beginner" },
  { q: "Solve: 4x − 3 = 13.  x = ?", opts: ["3","4","5","6"], ans: "4", diff: "intermediate" },
  { q: "A bought for ₹400, sold for ₹500. Profit% = ?", opts: ["20%","25%","30%","15%"], ans: "25%", diff: "intermediate" },
  { q: "Roots of x² − 5x + 6 = 0?", opts: ["2, 3","1, 6","−2, −3","2, −3"], ans: "2, 3", diff: "advanced" },
];

/* =====================================================================
   LEVELS
   ===================================================================== */
const LEVELS = [
  { id: "beginner",     label: "Beginner",     icon: "🌱", desc: "Foundation & Basics",      color: C.beginner },
  { id: "intermediate", label: "Intermediate", icon: "📚", desc: "School Level Core",         color: C.intermediate },
  { id: "advanced",     label: "Advanced",     icon: "🔬", desc: "Deep Understanding",        color: C.advanced },
  { id: "olympiad",     label: "Olympiad",     icon: "🏆", desc: "Competition Level",         color: C.olympiad },
];

/* =====================================================================
   TOPICS PER LEVEL
   ===================================================================== */
const TOPICS = {
  beginner: [
    { id: "arithmetic",      name: "Arithmetic",     icon: "➕",    desc: "+ − × ÷ operations" },
    { id: "fractions",       name: "Fractions",      icon: "½",     desc: "Parts of a whole" },
    { id: "percentages",     name: "Percentages",    icon: "%",     desc: "Parts of 100" },
    { id: "algebra_basics",  name: "Algebra",        icon: "x",     desc: "Simple equations" },
    { id: "geometry_basics", name: "Geometry",       icon: "△",    desc: "Shapes & angles" },
    { id: "numbers",         name: "Number Theory",  icon: "#",     desc: "Primes & factors" },
  ],
  intermediate: [
    { id: "profit_loss",       name: "Profit & Loss",     icon: "💹",    desc: "Business math" },
    { id: "simple_interest",   name: "Simple Interest",   icon: "🏦",    desc: "Money over time" },
    { id: "linear_equations",  name: "Linear Equations",  icon: "=",     desc: "Two variables" },
    { id: "speed_time",        name: "Speed & Distance",  icon: "⚡",    desc: "Motion problems" },
    { id: "geometry_inter",    name: "Geometry",          icon: "⭕",    desc: "Circles & triangles" },
    { id: "statistics",        name: "Statistics",        icon: "📊",    desc: "Mean, median, mode" },
  ],
  advanced: [
    { id: "quadratics",       name: "Quadratics",          icon: "x²",   desc: "Quadratic equations" },
    { id: "compound_interest",name: "Compound Interest",   icon: "💰",   desc: "Exponential growth" },
    { id: "number_system",    name: "Number System",       icon: "∞",    desc: "LCM, HCF, remainders" },
    { id: "coordinate_geo",   name: "Coordinate Geometry", icon: "📍",   desc: "Lines on a graph" },
    { id: "trigonometry",     name: "Trigonometry",        icon: "θ",    desc: "sin, cos, tan" },
    { id: "mensuration",      name: "Mensuration",         icon: "📦",   desc: "3D shapes & volumes" },
  ],
  olympiad: [
    { id: "number_theory",    name: "Number Theory",     icon: "∣",     desc: "Modular arithmetic" },
    { id: "olympiad_algebra", name: "Advanced Algebra",  icon: "f(x)",  desc: "Functional equations" },
    { id: "olympiad_geometry",name: "Proof Geometry",    icon: "∠",    desc: "Euclidean proofs" },
    { id: "combinatorics",    name: "Combinatorics",     icon: "C(n,r)",desc: "Counting techniques" },
    { id: "adv_trig",         name: "Advanced Trig",     icon: "π",     desc: "Identities & equations" },
    { id: "calculus_intro",   name: "Calculus Intro",    icon: "∫",    desc: "Limits & derivatives" },
  ],
};

/* =====================================================================
   LESSON + QUESTION CONTENT  (all topics)
   ===================================================================== */
const CONTENT = {
  arithmetic: {
    title: "Basic Arithmetic",
    concept: "The four operations:\n\n➕  Addition — combining amounts\n➖  Subtraction — finding difference\n✖️  Multiplication — repeated addition\n➗  Division — equal splitting\n\nBODMAS rule:\nBrackets → Orders → ÷× → +−",
    example: "8 × 7 = 56\n(because 7+7+7+7+7+7+7+7 = 56)\n\n3 × 4 + 6 ÷ 2\n= 12 + 3\n= 15   ← multiply & divide first!",
    tip: "Multiplication and division come BEFORE addition and subtraction.",
    practice: { q: "What is 14 × 6?", ans: "84", hint: "14×6 = 14×5 + 14×1 = 70 + 14", steps: "14 × 5 = 70\n14 × 1 = 14\n70 + 14 = 84" },
    questions: [
      { q: "23 + 48 = ?", opts: ["69","70","71","72"], ans: "71", hint: "3+8=11, carry 1", exp: "Ones: 3+8=11 (write 1, carry 1). Tens: 2+4+1=7. Answer: 71", diff: "easy" },
      { q: "156 − 89 = ?", opts: ["67","77","57","87"], ans: "67", hint: "Borrow from the tens place", exp: "16−9=7, (4−1)−8 borrow → 14−8=6. Answer: 67", diff: "easy" },
      { q: "12 × 14 = ?", opts: ["148","158","168","178"], ans: "168", hint: "12×14 = 12×10 + 12×4", exp: "12×10=120, 12×4=48, 120+48=168", diff: "medium" },
      { q: "252 ÷ 12 = ?", opts: ["18","19","21","22"], ans: "21", hint: "12×20=240, 252−240=12, so one more 12", exp: "12×21=252. Answer: 21", diff: "medium" },
      { q: "3 × 4 + 6 ÷ 2 = ?", opts: ["9","14","15","18"], ans: "15", hint: "Do × and ÷ first (BODMAS)", exp: "3×4=12, 6÷2=3, then 12+3=15", diff: "medium" },
      { q: "(5+3) × (10−4) = ?", opts: ["40","42","48","56"], ans: "48", hint: "Solve brackets first", exp: "(5+3)=8, (10−4)=6, 8×6=48", diff: "hard" },
      { q: "If a × b=72 and a=8, b=?", opts: ["7","8","9","10"], ans: "9", hint: "b = 72 ÷ 8", exp: "b = 72 ÷ 8 = 9", diff: "hard" },
      { q: "1000 − 357 = ?", opts: ["543","633","643","743"], ans: "643", hint: "1000−300=700, 700−57=643", exp: "Borrow carefully: 1000−357 = 643", diff: "hard" },
    ],
  },
  fractions: {
    title: "Fractions",
    concept: "Fraction = numerator / denominator\n\nTop = how many parts you have\nBottom = total equal parts\n\nSame denominator → just add tops:\n1/5 + 2/5 = 3/5\n\nDifferent denominator → find LCD first:\n1/3 + 1/4  → LCD=12\n= 4/12 + 3/12 = 7/12",
    example: "2/3 + 1/6 = ?\nLCD of 3 and 6 is 6\n2/3 = 4/6\n4/6 + 1/6 = 5/6\n\n3/4 × 2/5 = 6/20 = 3/10",
    tip: "Always simplify! Multiply fractions top×top, bottom×bottom. Divide? Flip & multiply.",
    practice: { q: "Find 3/4 of 48", ans: "36", hint: "3/4 × 48 = 3 × 12", steps: "48 ÷ 4 = 12 (one quarter)\n12 × 3 = 36 (three quarters)" },
    questions: [
      { q: "1/2 + 1/4 = ?", opts: ["2/6","3/4","2/4","1/6"], ans: "3/4", hint: "LCD=4, so 2/4+1/4", exp: "1/2=2/4, 2/4+1/4=3/4", diff: "easy" },
      { q: "3/4 − 1/4 = ?", opts: ["2/4","1/2","Both A & B are equal","4/4"], ans: "Both A & B are equal", hint: "2/4 simplifies to 1/2", exp: "3/4−1/4=2/4=1/2. Both 2/4 and 1/2 are the same!", diff: "easy" },
      { q: "2/3 × 3/4 = ?", opts: ["5/7","6/12","1/2","6/7"], ans: "1/2", hint: "Multiply tops and bottoms, then simplify", exp: "2×3=6, 3×4=12, 6/12=1/2", diff: "medium" },
      { q: "3/5 of 25 = ?", opts: ["10","12","15","18"], ans: "15", hint: "3/5 × 25 = 3 × 5", exp: "25÷5=5, 5×3=15", diff: "medium" },
      { q: "5/6 ÷ 5/3 = ?", opts: ["25/18","1/2","3/6","2/3"], ans: "1/2", hint: "Flip the divisor: 5/6 × 3/5", exp: "5/6 × 3/5 = 15/30 = 1/2", diff: "hard" },
      { q: "Which is larger: 5/7 or 7/10?", opts: ["5/7","7/10","Equal","Cannot tell"], ans: "5/7", hint: "Convert to LCD=70", exp: "5/7=50/70, 7/10=49/70. So 5/7 is larger.", diff: "hard" },
    ],
  },
  percentages: {
    title: "Percentages",
    concept: "Percent means 'per hundred'\n10% = 10/100 = 0.10\n\nX% of Y = (X ÷ 100) × Y\n\nKey shortcuts:\n50% → divide by 2\n25% → divide by 4\n10% → divide by 10\n1%  → divide by 100",
    example: "30% of 150:\n= 30/100 × 150\n= 0.3 × 150 = 45\n\nWhat % is 12 out of 60?\n= 12/60 × 100 = 20%",
    tip: "For % increase: (new − old)/old × 100. Always divide by the original!",
    practice: { q: "A shirt costs ₹500. After 20% discount, price = ?", ans: "400", hint: "20% of 500 = 100, so 500−100", steps: "20% of 500 = 100\n500 − 100 = ₹400" },
    questions: [
      { q: "10% of 70 = ?", opts: ["5","7","10","14"], ans: "7", hint: "Divide by 10", exp: "70÷10=7", diff: "easy" },
      { q: "25% of 200 = ?", opts: ["25","40","50","75"], ans: "50", hint: "25% = 1/4", exp: "200÷4=50", diff: "easy" },
      { q: "What % is 15 out of 75?", opts: ["15%","20%","25%","30%"], ans: "20%", hint: "15/75 × 100", exp: "15/75=1/5=0.2=20%", diff: "medium" },
      { q: "₹400 shirt, 20% off. Price = ?", opts: ["₹300","₹320","₹340","₹380"], ans: "₹320", hint: "20% of 400 = 80", exp: "80 discount, 400−80=₹320", diff: "medium" },
      { q: "Price: ₹500 → ₹600. % increase?", opts: ["10%","15%","20%","25%"], ans: "20%", hint: "Increase=100, divide by original 500", exp: "100/500×100=20%", diff: "hard" },
      { q: "40% of x = 60. x = ?", opts: ["100","120","140","150"], ans: "150", hint: "x = 60 × 100/40", exp: "x = 6000/40 = 150", diff: "hard" },
    ],
  },
  algebra_basics: {
    title: "Algebra Basics",
    concept: "Variables represent unknown values.\n\nExpression: 3x + 5\nEquation:    3x + 5 = 14\n\nGolden rule:\nWhatever you do to one side,\ndo the SAME to the other side.",
    example: "Solve: 2x − 3 = 7\n\nStep 1:  2x = 7 + 3 = 10\nStep 2:  x = 10 ÷ 2 = 5\n\nCheck: 2(5)−3 = 10−3 = 7 ✓",
    tip: "Move terms to one side by doing the opposite operation.",
    practice: { q: "Solve: 3x + 4 = 19", ans: "5", hint: "First subtract 4 from both sides", steps: "3x + 4 = 19\n3x = 19 − 4 = 15\nx = 15 ÷ 3 = 5" },
    questions: [
      { q: "x + 5 = 12. x = ?", opts: ["5","7","8","17"], ans: "7", hint: "x = 12 − 5", exp: "x = 7", diff: "easy" },
      { q: "2x = 18. x = ?", opts: ["7","8","9","10"], ans: "9", hint: "x = 18 ÷ 2", exp: "x = 9", diff: "easy" },
      { q: "3x + 4 = 19. x = ?", opts: ["3","4","5","6"], ans: "5", hint: "3x = 19 − 4 = 15", exp: "3x=15, x=5", diff: "medium" },
      { q: "5x − 7 = 28. x = ?", opts: ["5","6","7","8"], ans: "7", hint: "5x = 28 + 7 = 35", exp: "5x=35, x=7", diff: "medium" },
      { q: "4(x + 2) = 24. x = ?", opts: ["3","4","5","6"], ans: "4", hint: "x+2 = 24÷4 = 6", exp: "x+2=6, x=4", diff: "hard" },
      { q: "Sum of two numbers = 30. One is twice the other. Smaller number?", opts: ["8","10","12","15"], ans: "10", hint: "Let smaller=x, then x+2x=30", exp: "3x=30, x=10 (larger=20)", diff: "hard" },
    ],
  },
  geometry_basics: {
    title: "Geometry Basics",
    concept: "Angles:\nAcute < 90°   Right = 90°   Obtuse > 90°\nStraight = 180°   Full = 360°\n\nTriangle: sum of angles = 180°\n\nArea formulas:\nRectangle = length × width\nTriangle = ½ × base × height\nCircle = π × r²",
    example: "Rectangle: l=8, w=5\nPerimeter = 2(8+5) = 26\nArea = 8×5 = 40\n\nTriangle: base=6, height=4\nArea = ½ × 6 × 4 = 12",
    tip: "Triangle area = HALF of base × height. Don't forget the ½!",
    practice: { q: "Find the area of a triangle with base=10 and height=8", ans: "40", hint: "Area = ½ × base × height", steps: "½ × 10 × 8\n= 5 × 8\n= 40" },
    questions: [
      { q: "Area of rectangle: 7 × 4 = ?", opts: ["22","24","26","28"], ans: "28", hint: "length × width", exp: "7×4=28", diff: "easy" },
      { q: "Triangle angles: 60°, 80°, ? = ?", opts: ["30°","40°","50°","60°"], ans: "40°", hint: "All angles sum to 180°", exp: "180−60−80=40°", diff: "easy" },
      { q: "Perimeter of square, side=6?", opts: ["18","24","30","36"], ans: "24", hint: "4 sides × 6", exp: "4×6=24", diff: "easy" },
      { q: "Area of triangle: base=10, height=6?", opts: ["30","40","60","15"], ans: "30", hint: "½ × 10 × 6", exp: "½×10×6=30", diff: "medium" },
      { q: "Right triangle legs: 3 and 4. Hypotenuse = ?", opts: ["5","6","7","√7"], ans: "5", hint: "a² + b² = c²", exp: "9+16=25, √25=5 (3-4-5 triangle!)", diff: "hard" },
      { q: "Radius=7cm. Circle circumference ≈ ? (π≈22/7)", opts: ["22cm","44cm","66cm","154cm"], ans: "44cm", hint: "C = 2πr", exp: "2×22/7×7 = 44cm", diff: "hard" },
    ],
  },
  numbers: {
    title: "Number Theory",
    concept: "Prime: divisible only by 1 and itself\n2, 3, 5, 7, 11, 13, 17, 19, 23...\n\nEven: divisible by 2 → 2,4,6,8...\nOdd:  not divisible by 2 → 1,3,5,7...\n\nFactors of 12: 1, 2, 3, 4, 6, 12\nMultiples of 3: 3, 6, 9, 12, 15...",
    example: "Is 37 prime?\nCheck primes up to √37 ≈ 6\nNot divisible by 2, 3, 5 → YES!\n\nLCM(4, 6) = 12\nHCF(12, 18) = 6",
    tip: "To check if prime: test all primes ≤ √n only.",
    practice: { q: "Find HCF of 24 and 36", ans: "12", hint: "List factors of both and find the largest common one", steps: "Factors of 24: 1,2,3,4,6,8,12,24\nFactors of 36: 1,2,3,4,6,9,12,18,36\nLargest common = 12" },
    questions: [
      { q: "Which is prime?", opts: ["9","15","17","21"], ans: "17", hint: "Check divisibility by 2,3,5", exp: "17 is not divisible by 2,3,5. It is prime!", diff: "easy" },
      { q: "LCM of 4 and 6 = ?", opts: ["2","12","24","48"], ans: "12", hint: "Smallest divisible by both 4 and 6", exp: "Multiples of 6: 6,12... 12 is divisible by 4. LCM=12", diff: "medium" },
      { q: "HCF of 24 and 36 = ?", opts: ["4","6","8","12"], ans: "12", hint: "Largest number dividing both", exp: "Common factors: 1,2,3,4,6,12. HCF=12", diff: "medium" },
      { q: "How many primes between 10 and 30?", opts: ["4","5","6","7"], ans: "5", hint: "List them: 11, 13, 17, 19, 23", exp: "11, 13, 17, 19, 23 → 5 primes", diff: "hard" },
      { q: "Sum of first 5 prime numbers?", opts: ["26","28","30","32"], ans: "28", hint: "2+3+5+7+11", exp: "2+3+5+7+11=28", diff: "hard" },
    ],
  },

  // ---- INTERMEDIATE ----
  profit_loss: {
    title: "Profit & Loss",
    concept: "CP = Cost Price (what you paid)\nSP = Selling Price (what you sold for)\n\nProfit = SP − CP  (when SP > CP)\nLoss = CP − SP  (when CP > SP)\n\nProfit% = Profit/CP × 100\nLoss%   = Loss/CP × 100",
    example: "Bought for ₹200, sold for ₹250:\nProfit = 50\nProfit% = 50/200 × 100 = 25%\n\nBought ₹300, sold ₹270:\nLoss = 30\nLoss% = 30/300 × 100 = 10%",
    tip: "Profit% and Loss% are ALWAYS calculated on Cost Price.",
    practice: { q: "CP=₹500, SP=₹600. Find Profit%", ans: "20", hint: "Profit = SP−CP = 100", steps: "Profit = 600−500 = ₹100\nProfit% = 100/500 × 100 = 20%" },
    questions: [
      { q: "CP=₹100, SP=₹120. Profit%?", opts: ["10%","15%","20%","25%"], ans: "20%", hint: "Profit=20, CP=100", exp: "20/100×100=20%", diff: "easy" },
      { q: "CP=₹500, SP=₹450. Loss%?", opts: ["5%","10%","15%","20%"], ans: "10%", hint: "Loss=50, CP=500", exp: "50/500×100=10%", diff: "easy" },
      { q: "CP=₹240, Profit%=25%. SP=?", opts: ["₹280","₹290","₹300","₹310"], ans: "₹300", hint: "SP = CP + 25% of CP", exp: "25% of 240=60, SP=300", diff: "medium" },
      { q: "SP=₹780, Profit=30%. CP=?", opts: ["₹550","₹600","₹650","₹680"], ans: "₹600", hint: "CP = SP × 100/(100+P%)", exp: "780×100/130=600", diff: "hard" },
      { q: "Sold at 20% loss for ₹400. CP=?", opts: ["₹400","₹450","₹480","₹500"], ans: "₹500", hint: "SP = CP × 80/100", exp: "CP=400×100/80=₹500", diff: "hard" },
    ],
  },
  simple_interest: {
    title: "Simple Interest",
    concept: "SI = (P × R × T) / 100\n\nP = Principal (initial amount)\nR = Rate per year (%)\nT = Time (in years)\n\nTotal Amount = P + SI",
    example: "P=₹1000, R=5%, T=3 yrs\nSI = 1000×5×3/100 = ₹150\nAmount = 1000+150 = ₹1150",
    tip: "If months given, convert to years! 6 months = 0.5 years.",
    practice: { q: "P=₹3000, R=4%, T=2 years. Find SI.", ans: "240", hint: "SI = P×R×T/100", steps: "SI = 3000×4×2/100\n= 24000/100 = ₹240" },
    questions: [
      { q: "P=₹2000, R=5%, T=2yr. SI=?", opts: ["₹150","₹200","₹250","₹300"], ans: "₹200", hint: "2000×5×2/100", exp: "=₹200", diff: "easy" },
      { q: "P=₹5000, R=10%, T=1yr. Amount=?", opts: ["₹5200","₹5400","₹5500","₹5800"], ans: "₹5500", hint: "SI=500, Amount=P+SI", exp: "SI=500, Amount=5500", diff: "easy" },
      { q: "SI=₹400, P=₹2000, T=4yr. Rate=?", opts: ["3%","4%","5%","6%"], ans: "5%", hint: "R = SI×100/(P×T)", exp: "400×100/(2000×4)=5%", diff: "medium" },
      { q: "P=₹3000, R=6%, SI=₹540. T=?", opts: ["2yr","3yr","4yr","5yr"], ans: "3yr", hint: "T = SI×100/(P×R)", exp: "540×100/(3000×6)=3yr", diff: "hard" },
    ],
  },
  linear_equations: {
    title: "Linear Equations (2 Variables)",
    concept: "Two equations, two unknowns:\n\nElimination method:\n  2x + y = 10  ...(1)\n  x + y = 7   ...(2)\n  Subtract: x = 3\n  Sub back: y = 4\n\nSubstitution: isolate one variable, then substitute.",
    example: "x + 2y = 8\n2x − y = 1\n\nFrom eq1: x = 8−2y\nSub: 2(8−2y)−y=1\n16−5y=1 → y=3 → x=2",
    tip: "Choose elimination when coefficients are similar, substitution when one variable is isolated.",
    practice: { q: "Solve: x+y=10, x−y=4. Find x.", ans: "7", hint: "Add both equations to eliminate y", steps: "Add: 2x=14\nx=7\nSub: 7+y=10, y=3" },
    questions: [
      { q: "x+y=10, x−y=4. x=?", opts: ["5","6","7","8"], ans: "7", hint: "Add equations: 2x=14", exp: "x=7, y=3", diff: "easy" },
      { q: "2x+y=11, x+y=8. y=?", opts: ["3","4","5","6"], ans: "5", hint: "Subtract eq2 from eq1", exp: "x=3, y=5", diff: "medium" },
      { q: "3x+2y=16, x+y=6. (x,y)=?", opts: ["4,2","3,3","2,4","5,1"], ans: "4,2", hint: "From eq2: x=6−y, substitute", exp: "3(6−y)+2y=16 → y=2 → x=4", diff: "hard" },
    ],
  },
  speed_time: {
    title: "Speed, Time & Distance",
    concept: "The master formula:\n\nDistance = Speed × Time\nSpeed = Distance ÷ Time\nTime = Distance ÷ Speed\n\nUnits must match!\nkm/h × hours = km\nm/s × seconds = m",
    example: "Car: 60km/h for 3 hours\nDistance = 60×3 = 180km\n\nConvert 72 km/h to m/s:\n= 72 × 5/18 = 20 m/s",
    tip: "km/h → m/s: multiply by 5/18.  m/s → km/h: multiply by 18/5.",
    practice: { q: "Distance=240km, Time=4hrs. Speed=?", ans: "60", hint: "Speed = Distance ÷ Time", steps: "Speed = 240 ÷ 4 = 60 km/h" },
    questions: [
      { q: "Speed=60km/h, Time=3hr. Distance=?", opts: ["150km","160km","170km","180km"], ans: "180km", hint: "D=S×T", exp: "60×3=180", diff: "easy" },
      { q: "Distance=200km, Time=4hr. Speed=?", opts: ["40","50","60","70"], ans: "50", hint: "S=D/T", exp: "200/4=50km/h", diff: "easy" },
      { q: "Speed=45km/h, Distance=270km. Time=?", opts: ["4hr","5hr","6hr","7hr"], ans: "6hr", hint: "T=D/S", exp: "270/45=6hr", diff: "medium" },
      { q: "Two trains 300km apart, speeds 60 & 90 km/h towards each other. Meet in?", opts: ["1hr","2hr","2.5hr","3hr"], ans: "2hr", hint: "Relative speed=60+90=150", exp: "300/150=2hr", diff: "hard" },
    ],
  },
  geometry_inter: {
    title: "Circles & Triangles",
    concept: "Circle (radius r):\nArea = π r²\nCircumference = 2πr\n\nTriangle theorems:\nPythagoras: a² + b² = c²\nSimilar triangles: ratios equal\n\nAngle in semicircle = 90°",
    example: "Circle r=7: Area=π×49≈154cm²\nCircle r=7: Circumference=44cm\n\nRight △: legs=5,12 → hyp=13\n(5²+12²=25+144=169=13²)",
    tip: "Area uses r². Circumference uses r (not r²). Don't mix them up!",
    practice: { q: "Find area of circle with radius=5 (use π=3.14)", ans: "78.5", hint: "Area = π × r²", steps: "Area = 3.14 × 5²\n= 3.14 × 25 = 78.5" },
    questions: [
      { q: "Circle r=7cm. Area? (π=22/7)", opts: ["44cm²","88cm²","154cm²","176cm²"], ans: "154cm²", hint: "π×r²=22/7×49", exp: "22/7×49=154", diff: "easy" },
      { q: "Right △: legs=6,8. Hypotenuse=?", opts: ["9","10","12","14"], ans: "10", hint: "6²+8²=c²", exp: "36+64=100, √100=10", diff: "medium" },
      { q: "Isoceles △: two angles=65°. Third angle=?", opts: ["40°","50°","60°","65°"], ans: "50°", hint: "180−65−65", exp: "180−130=50°", diff: "medium" },
      { q: "Chord length=16cm, radius=10cm. Distance from centre=?", opts: ["4cm","6cm","8cm","10cm"], ans: "6cm", hint: "half-chord=8, 10²−8²=?", exp: "100−64=36, √36=6cm", diff: "hard" },
    ],
  },
  statistics: {
    title: "Mean, Median, Mode",
    concept: "Mean   = sum ÷ count\nMedian = middle value (when sorted)\nMode   = most frequent value\n\nFor even count:\nMedian = average of middle two",
    example: "Data: 3,7,5,7,2,8\nMean=(3+7+5+7+2+8)/6=32/6≈5.33\nSorted: 2,3,5,7,7,8\nMedian=(5+7)/2=6\nMode=7",
    tip: "Always sort the data before finding median!",
    practice: { q: "Find mean of: 4, 8, 12, 16, 20", ans: "12", hint: "Sum all and divide by count", steps: "Sum = 4+8+12+16+20 = 60\nCount = 5\nMean = 60÷5 = 12" },
    questions: [
      { q: "Mean of 2,4,6,8,10?", opts: ["5","6","7","8"], ans: "6", hint: "Sum=30, count=5", exp: "30/5=6", diff: "easy" },
      { q: "Mode of 2,3,3,4,5,3,6?", opts: ["2","3","4","6"], ans: "3", hint: "Which appears most?", exp: "3 appears 3 times", diff: "easy" },
      { q: "Median of 1,1,2,3,4,5,6,9?", opts: ["3","3.5","4","4.5"], ans: "3.5", hint: "8 values, middle two: 4th and 5th", exp: "(3+4)/2=3.5", diff: "medium" },
      { q: "Mean of 5 numbers=12. One removed, mean=10. Removed number=?", opts: ["16","18","20","22"], ans: "20", hint: "Sum of 5=60, sum of 4=40", exp: "60−40=20", diff: "hard" },
    ],
  },

  // ---- ADVANCED ----
  quadratics: {
    title: "Quadratic Equations",
    concept: "Form: ax² + bx + c = 0\n\nFactoring:\nx² − 5x + 6 = 0\n→ (x−2)(x−3) = 0\n→ x = 2 or x = 3\n\nQuadratic formula:\nx = [−b ± √(b²−4ac)] / 2a",
    example: "2x² + 5x − 3 = 0\na=2, b=5, c=−3\nDisc = 25+24 = 49\nx = (−5±7)/4\nx = ½  or  x = −3",
    tip: "Discriminant (b²−4ac): >0 means 2 roots, =0 means 1 root, <0 means no real roots.",
    practice: { q: "Solve: x² − 7x + 12 = 0", ans: "3,4", hint: "Find two numbers: product=12, sum=7", steps: "3 × 4 = 12 ✓\n3 + 4 = 7 ✓\n(x−3)(x−4)=0\nx=3 or x=4" },
    questions: [
      { q: "Roots of x²−7x+12=0?", opts: ["3,4","2,6","3,−4","1,12"], ans: "3,4", hint: "Product=12, sum=7", exp: "(x−3)(x−4)=0", diff: "easy" },
      { q: "Roots of x²−x−6=0?", opts: ["2,−3","3,−2","−2,3","2,3"], ans: "3,−2", hint: "Product=−6, sum=1: try 3 and −2", exp: "(x−3)(x+2)=0", diff: "medium" },
      { q: "Discriminant of 2x²+3x−2. Real roots?", opts: ["Yes, 2 roots","Yes, 1 root","No real roots","Cannot tell"], ans: "Yes, 2 roots", hint: "b²−4ac = 9+16 = 25 > 0", exp: "25>0 → 2 distinct real roots", diff: "medium" },
      { q: "Sum of roots of 3x²−5x+2=0?", opts: ["2/3","5/3","3/5","5"], ans: "5/3", hint: "Sum of roots = −b/a", exp: "−(−5)/3 = 5/3", diff: "hard" },
      { q: "Roots of x² − 4 = 0?", opts: ["±1","±2","±3","±4"], ans: "±2", hint: "x² = 4", exp: "x = ±√4 = ±2", diff: "easy" },
    ],
  },
  compound_interest: {
    title: "Compound Interest",
    concept: "A = P(1 + R/100)ⁿ\n\nA = Final Amount\nP = Principal\nR = Rate per year (%)\nn = Number of years\n\nCI = A − P",
    example: "P=₹1000, R=10%, n=2 yr\nA = 1000 × (1.1)²\n= 1000 × 1.21 = ₹1210\nCI = 1210−1000 = ₹210\n\nVs SI = 1000×10×2/100 = ₹200\n↑ CI is more! (interest on interest)",
    tip: "CI > SI always (for n > 1). The difference is the 'interest on interest'.",
    practice: { q: "P=₹5000, R=20%, n=2 yrs. Find Amount.", ans: "7200", hint: "A = P × (1 + R/100)²", steps: "1 + 20/100 = 1.2\n1.2² = 1.44\nA = 5000 × 1.44 = ₹7200" },
    questions: [
      { q: "P=₹2000, R=10%, n=2. Amount=?", opts: ["₹2200","₹2400","₹2420","₹2440"], ans: "₹2420", hint: "2000×(1.1)²", exp: "2000×1.21=₹2420", diff: "easy" },
      { q: "P=₹5000, R=20%, n=2. CI=?", opts: ["₹1800","₹2000","₹2200","₹2400"], ans: "₹2200", hint: "A=5000×1.44=7200", exp: "CI=7200−5000=₹2200", diff: "medium" },
      { q: "CI=₹1261 on ₹8000 at 5%/yr. Years=?", opts: ["1","2","3","4"], ans: "3", hint: "(1.05)³=1.157625", exp: "8000×1.157625=9261, CI=1261 → 3 years", diff: "hard" },
    ],
  },
  number_system: {
    title: "Number System",
    concept: "LCM (Least Common Multiple)\nHCF (Highest Common Factor)\n\nKey relation:\nLCM × HCF = Product of two numbers\n\nDivisibility rules:\n2: last digit even\n3: sum of digits ÷ 3\n9: sum of digits ÷ 9\n11: alternating sum = 0 or ±11",
    example: "LCM(12,18) and HCF(12,18)?\n12 = 2² × 3\n18 = 2 × 3²\nHCF = 2 × 3 = 6\nLCM = 2² × 3² = 36\n\nCheck: 6×36 = 216 = 12×18 ✓",
    tip: "LCM × HCF = a × b. This is a powerful shortcut!",
    practice: { q: "LCM of two numbers=180, HCF=12, one number=36. Find other.", ans: "60", hint: "LCM × HCF = a × b", steps: "180 × 12 = 36 × other\n2160 = 36 × other\nother = 60" },
    questions: [
      { q: "LCM of 8 and 12 = ?", opts: ["12","24","36","48"], ans: "24", hint: "8=2³, 12=2²×3. LCM=2³×3", exp: "2³×3=24", diff: "easy" },
      { q: "HCF of 36 and 48 = ?", opts: ["6","8","12","18"], ans: "12", hint: "36=2²×3², 48=2⁴×3", exp: "Common: 2²×3=12", diff: "medium" },
      { q: "LCM × HCF = 360. One number=24. HCF=6. Other number=?", opts: ["10","12","15","18"], ans: "15", hint: "24 × other = LCM × HCF", exp: "other = 360/24 = 15", diff: "hard" },
      { q: "Which is divisible by 11: 121, 132, 143, all?", opts: ["121 only","132 only","143 only","All three"], ans: "All three", hint: "Check alternating digit sum", exp: "121: 1−2+1=0 ✓ 132: 1−3+2=0 ✓ 143: 1−4+3=0 ✓", diff: "hard" },
    ],
  },
  coordinate_geo: {
    title: "Coordinate Geometry",
    concept: "Point P(x, y) on a plane.\n\nDistance between (x₁,y₁) and (x₂,y₂):\nd = √[(x₂−x₁)² + (y₂−y₁)²]\n\nMidpoint = ((x₁+x₂)/2, (y₁+y₂)/2)\n\nSlope m = (y₂−y₁)/(x₂−x₁)\n\nLine equation: y = mx + c",
    example: "A(1,2) and B(4,6)\nDistance = √[(4−1)²+(6−2)²]\n= √[9+16] = √25 = 5\n\nMidpoint = (2.5, 4)",
    tip: "Distance formula = extended Pythagoras. Draw the triangle to see why!",
    practice: { q: "Find midpoint of A(2,4) and B(8,10)", ans: "(5,7)", hint: "Average the x-coords, average the y-coords", steps: "x: (2+8)/2 = 5\ny: (4+10)/2 = 7\nMidpoint = (5, 7)" },
    questions: [
      { q: "Distance between (0,0) and (3,4)?", opts: ["5","6","7","√14"], ans: "5", hint: "√(3²+4²)", exp: "√(9+16)=√25=5 (3-4-5 triangle!)", diff: "easy" },
      { q: "Midpoint of (2,4) and (8,10)?", opts: ["(4,6)","(5,7)","(6,8)","(3,5)"], ans: "(5,7)", hint: "Average x and y", exp: "((2+8)/2,(4+10)/2)=(5,7)", diff: "easy" },
      { q: "Slope of line through (1,2) and (4,8)?", opts: ["1","2","3","4"], ans: "2", hint: "(y2−y1)/(x2−x1)", exp: "(8−2)/(4−1)=6/3=2", diff: "medium" },
      { q: "Line y=2x+3. When x=4, y=?", opts: ["9","10","11","12"], ans: "11", hint: "Substitute x=4", exp: "y=2(4)+3=11", diff: "hard" },
    ],
  },
  trigonometry: {
    title: "Trigonometry",
    concept: "In a right triangle (angle θ):\n\nsin θ = opposite/hypotenuse\ncos θ = adjacent/hypotenuse\ntan θ = opposite/adjacent\n\nRemember: SOH CAH TOA\n\nKey values:\nsin 30°=½   cos 30°=√3/2   tan 30°=1/√3\nsin 45°=1/√2  cos 45°=1/√2   tan 45°=1\nsin 60°=√3/2  cos 60°=½      tan 60°=√3\nsin 90°=1     cos 90°=0",
    example: "Right △, hyp=10, angle=30°\nopposite = 10 × sin30° = 10×½ = 5\nadjacent = 10 × cos30° = 5√3\n\nIdentity: sin²θ + cos²θ = 1",
    tip: "sin²θ + cos²θ = 1 always. Use this to find one from the other.",
    practice: { q: "If sinθ = 3/5, find cosθ", ans: "4/5", hint: "Use sin²θ + cos²θ = 1", steps: "cos²θ = 1 − sin²θ = 1 − 9/25 = 16/25\ncosθ = 4/5" },
    questions: [
      { q: "sin 30° = ?", opts: ["½","√3/2","1/√2","1"], ans: "½", hint: "Standard value to memorize", exp: "sin 30° = ½", diff: "easy" },
      { q: "tan 45° = ?", opts: ["0","½","1","√3"], ans: "1", hint: "At 45°, opposite = adjacent", exp: "sin45°/cos45°=1", diff: "easy" },
      { q: "sinθ=3/5. cosθ=?", opts: ["3/4","4/5","5/3","4/3"], ans: "4/5", hint: "sin²θ+cos²θ=1", exp: "cos²θ=1−9/25=16/25, cosθ=4/5", diff: "medium" },
      { q: "Right △: adjacent=4, hyp=5. sinθ=?", opts: ["4/5","3/5","3/4","4/3"], ans: "3/5", hint: "Find opposite first: 3²+4²=5²", exp: "opposite=3, sinθ=3/5", diff: "hard" },
    ],
  },
  mensuration: {
    title: "Mensuration (3D)",
    concept: "Cuboid (l×w×h):\nVolume = l×w×h\nSurface Area = 2(lw+lh+wh)\n\nCylinder (r, h):\nVolume = πr²h\nCurved SA = 2πrh\n\nCone (r, h, l=slant):\nVolume = ⅓πr²h\n\nSphere (r):\nVolume = 4/3 πr³",
    example: "Cylinder: r=7, h=10\nVolume = π×49×10 = 1540 cm³\nCurved SA = 2π×7×10 = 440 cm²",
    tip: "Cone volume = ⅓ of cylinder! Sphere volume = 4/3 πr³.",
    practice: { q: "Find volume of cuboid: 5×4×3 cm", ans: "60", hint: "V = length × width × height", steps: "V = 5 × 4 × 3 = 60 cm³" },
    questions: [
      { q: "Cuboid 4×3×2. Volume=?", opts: ["18","24","30","36"], ans: "24", hint: "l×w×h", exp: "4×3×2=24", diff: "easy" },
      { q: "Cylinder r=7, h=10. Volume≈? (π=22/7)", opts: ["1440","1540","1640","1320"], ans: "1540", hint: "πr²h", exp: "22/7×49×10=1540", diff: "medium" },
      { q: "Sphere r=3. Volume=? (π=3.14)", opts: ["100.5","108.7","113.04","120.3"], ans: "113.04", hint: "4/3 × π × r³", exp: "4/3×3.14×27=113.04", diff: "hard" },
    ],
  },

  // ---- OLYMPIAD ----
  number_theory: {
    title: "Modular Arithmetic",
    concept: "a mod n = remainder when a÷n\n17 mod 5 = 2  (17=3×5+2)\n\nModular rules:\n(a+b) mod n = ((a mod n)+(b mod n)) mod n\n(a×b) mod n = ((a mod n)×(b mod n)) mod n\n\nFermat's Little Theorem:\nIf p is prime: aᵖ⁻¹ ≡ 1 (mod p)",
    example: "Find 2¹⁰ mod 7\n2¹=2, 2²=4, 2³=8≡1 (mod 7)\nPattern period = 3\n10 = 3×3+1 → 2¹⁰ ≡ 2¹ = 2 (mod 7)\n\nLast digit of 3⁸:\n3¹=3, 3²=9, 3³=7, 3⁴=1 (last digits)\nPeriod=4. 8 mod 4=0 → last digit=1",
    tip: "Find the cycle of powers mod n. It always repeats!",
    practice: { q: "Find the last digit of 7²⁰", ans: "1", hint: "Find the cycle of last digits of powers of 7", steps: "7¹=7, 7²=49(→9), 7³=...3, 7⁴=...1\nPeriod=4. 20÷4=5 remainder 0\nSo last digit = 7⁴'s last digit = 1" },
    questions: [
      { q: "17 mod 5 = ?", opts: ["1","2","3","4"], ans: "2", hint: "17=3×5+2", exp: "Remainder is 2", diff: "easy" },
      { q: "2¹⁰ mod 3 = ?", opts: ["0","1","2","3"], ans: "1", hint: "2 mod 3=2, 4 mod 3=1, pattern: 2,1,2,1...", exp: "10 is even → 2¹⁰ mod 3 = 1", diff: "medium" },
      { q: "Last digit of 7²⁰²³ = ?", opts: ["1","3","7","9"], ans: "3", hint: "7¹=7,7²=9,7³=3,7⁴=1 (period=4)", exp: "2023 mod 4 = 3, so last digit = 3", diff: "hard" },
      { q: "Find x: 3x ≡ 1 (mod 7)", opts: ["3","4","5","6"], ans: "5", hint: "Try 3×5=15, 15 mod 7=?", exp: "3×5=15=2×7+1 → 3×5≡1(mod 7)", diff: "hard" },
    ],
  },
  olympiad_algebra: {
    title: "Functional Equations",
    concept: "f(x) = some expression involving x\n\nCommon approach:\nPlug in x=0, x=1, x=−1 first\nTry f(x+y) or f(xy) forms\nUse substitution tricks\n\nExample: If f(x)+f(1−x)=1\nWhat is f(0)+f(1)?",
    example: "f(x+y) = f(x)+f(y) for all x,y\n→ f is linear: f(x) = cx\n\nIf f(x)·f(1/x)=1 and f(2)=3\nThen f(1/2)=1/3",
    tip: "Try x=0 first. Then x=y. Then x=1. Often that reveals the pattern.",
    practice: { q: "f(x)=x²+1. What is f(3)−f(2)?", ans: "5", hint: "Calculate each separately", steps: "f(3) = 9+1 = 10\nf(2) = 4+1 = 5\n10−5 = 5" },
    questions: [
      { q: "f(x)=2x+3. f(5)=?", opts: ["11","12","13","14"], ans: "13", hint: "Substitute x=5", exp: "2(5)+3=13", diff: "easy" },
      { q: "f(x)+f(−x)=4 for all x. f(3)+f(−3)=?", opts: ["2","4","6","8"], ans: "4", hint: "Directly apply the given rule", exp: "The rule says f(x)+f(−x)=4 for any x", diff: "medium" },
      { q: "f(x·y)=f(x)+f(y). f(1)=?", opts: ["0","1","2","Cannot tell"], ans: "0", hint: "Try x=y=1", exp: "f(1)=f(1·1)=f(1)+f(1)→f(1)=0", diff: "hard" },
    ],
  },
  olympiad_geometry: {
    title: "Proof-Based Geometry",
    concept: "Key theorems:\n\nVertically opposite angles are equal\nCorresponding angles (parallel lines) are equal\nExterior angle = sum of two interior opposite angles\n\nCircle theorems:\n• Angle at centre = 2× angle at circumference\n• Angles in same segment are equal\n• Angle in semicircle = 90°",
    example: "Exterior angle theorem:\nExterior ∠ = 70°\nThe two non-adjacent interior ∠s sum = 70°\n\nProof sketch:\nExterior ∠ + interior ∠ = 180° (straight line)\nSum of all 3 angles = 180°\n∴ Exterior = sum of other two",
    tip: "In olympiad problems, always look for angle chasing, cyclic quadrilaterals, and congruence.",
    practice: { q: "In △ABC, exterior angle at C = 130°. A=50°. Find B.", ans: "80", hint: "Exterior angle = sum of two opposite interior angles", steps: "Exterior at C = A + B\n130 = 50 + B\nB = 80°" },
    questions: [
      { q: "Angle at centre = 80°. Angle at circumference on same arc = ?", opts: ["40°","80°","160°","Cannot tell"], ans: "40°", hint: "Angle at centre = 2 × angle at circumference", exp: "80°/2 = 40°", diff: "easy" },
      { q: "Exterior angle of triangle = 120°. One opposite interior angle = 50°. Other = ?", opts: ["60°","70°","80°","90°"], ans: "70°", hint: "Exterior = sum of two opposite interior angles", exp: "120−50=70°", diff: "medium" },
      { q: "Quadrilateral ABCD is cyclic. A=75°. C=?", opts: ["75°","90°","105°","115°"], ans: "105°", hint: "Opposite angles in cyclic quad sum to 180°", exp: "A+C=180°, C=180−75=105°", diff: "hard" },
    ],
  },
  combinatorics: {
    title: "Combinatorics",
    concept: "Permutations (ORDER matters):\nP(n,r) = n!/(n−r)!\n\nCombinations (ORDER doesn't matter):\nC(n,r) = n!/(r!(n−r)!)\n\nn! = 1×2×3×...×n\n\nPigeonhole Principle:\nIf n items in k boxes, at least one box has ⌈n/k⌉ items.",
    example: "Arrange 3 from 5 letters:\nP(5,3) = 5×4×3 = 60\n\nChoose 3 from 5:\nC(5,3) = 10\n\nP(n,r) = C(n,r) × r!",
    tip: "The key question: Does ORDER matter? Yes→Permutation, No→Combination.",
    practice: { q: "How many ways to choose a team of 3 from 8 people?", ans: "56", hint: "Order doesn't matter → use C(8,3)", steps: "C(8,3) = 8!/(3!×5!)\n= (8×7×6)/(3×2×1)\n= 336/6 = 56" },
    questions: [
      { q: "C(6,2) = ?", opts: ["10","12","15","18"], ans: "15", hint: "(6×5)/(2×1)", exp: "30/2=15", diff: "easy" },
      { q: "5 people can line up in how many ways?", opts: ["24","60","120","720"], ans: "120", hint: "5! = 5×4×3×2×1", exp: "120", diff: "easy" },
      { q: "Committee of 3 from 8. How many ways?", opts: ["24","56","120","336"], ans: "56", hint: "C(8,3)", exp: "56", diff: "medium" },
      { q: "Pigeonhole: 13 people, 12 months. Minimum sharing a birth month?", opts: ["1","2","3","4"], ans: "2", hint: "13 items, 12 boxes", exp: "By pigeonhole: at least ⌈13/12⌉=2 share a month", diff: "hard" },
    ],
  },
  adv_trig: {
    title: "Advanced Trigonometry",
    concept: "Pythagorean identities:\nsin²θ + cos²θ = 1\n1 + tan²θ = sec²θ\n1 + cot²θ = csc²θ\n\nDouble angle:\nsin 2θ = 2 sinθ cosθ\ncos 2θ = cos²θ − sin²θ = 1−2sin²θ\n\nSum formula:\nsin(A+B) = sinA cosB + cosA sinB\ncos(A+B) = cosA cosB − sinA sinB",
    example: "Prove: sin 2θ = 2 sinθ cosθ\n\nsin(θ+θ) = sinθ cosθ + cosθ sinθ\n= 2 sinθ cosθ ✓\n\nGiven sinθ=3/5, find sin2θ:\ncosθ=4/5\nsin2θ=2×(3/5)×(4/5)=24/25",
    tip: "Memorise sin²+cos²=1. Everything else follows from it.",
    practice: { q: "If sinθ=5/13, find cos2θ", ans: "119/169", hint: "cos2θ = 1−2sin²θ", steps: "sin²θ = 25/169\n2sin²θ = 50/169\ncos2θ = 1 − 50/169 = 119/169" },
    questions: [
      { q: "1 + tan²θ = ?", opts: ["sec²θ","csc²θ","cot²θ","cos²θ"], ans: "sec²θ", hint: "Pythagorean identity", exp: "1+tan²θ=sec²θ (standard identity)", diff: "easy" },
      { q: "sin2θ = ? (in terms of sinθ, cosθ)", opts: ["sinθ+cosθ","2sinθcosθ","sin²θ−cos²θ","2cos²θ"], ans: "2sinθcosθ", hint: "Double angle formula", exp: "sin(θ+θ)=2sinθcosθ", diff: "medium" },
      { q: "sinθ=3/5. sin2θ=?", opts: ["6/25","24/25","12/25","18/25"], ans: "24/25", hint: "cosθ=4/5, then 2×(3/5)×(4/5)", exp: "2×3/5×4/5=24/25", diff: "hard" },
    ],
  },
  calculus_intro: {
    title: "Calculus Introduction",
    concept: "Limit: value a function approaches\nlim(x→2) x² = 4\n\nDerivative = rate of change (slope)\n\nPower rule:\nd/dx (xⁿ) = n·xⁿ⁻¹\n\nd/dx (constant) = 0\nd/dx (x) = 1\nd/dx (x²) = 2x\nd/dx (x³) = 3x²",
    example: "f(x) = x³ + 2x² + 5\nf'(x) = 3x² + 4x + 0 = 3x² + 4x\n\nAt x=1: slope = 3+4 = 7\n\nlim(x→3) (x²−9)/(x−3)\n= lim (x+3)(x−3)/(x−3)\n= lim (x+3) = 6",
    tip: "Derivative tells you the slope at any point. Positive slope = going up.",
    practice: { q: "Find f'(x) if f(x) = 4x³ + 3x²", ans: "12x² + 6x", hint: "Apply power rule to each term", steps: "d/dx(4x³) = 4×3x² = 12x²\nd/dx(3x²) = 3×2x = 6x\nf'(x) = 12x² + 6x" },
    questions: [
      { q: "d/dx (x⁴) = ?", opts: ["4x³","4x⁴","x³","3x³"], ans: "4x³", hint: "Power rule: bring down power, reduce by 1", exp: "4x⁴⁻¹=4x³", diff: "easy" },
      { q: "f(x)=3x²+2x+1. f'(x)=?", opts: ["6x+2","6x+1","3x+2","6x"], ans: "6x+2", hint: "Differentiate each term", exp: "6x+2+0=6x+2", diff: "medium" },
      { q: "lim(x→3) (x²−9)/(x−3) = ?", opts: ["0","3","6","9"], ans: "6", hint: "Factor x²−9=(x+3)(x−3)", exp: "(x+3)(x−3)/(x−3)=x+3 → 3+3=6", diff: "hard" },
    ],
  },
};

/* =====================================================================
   STYLES HELPERS
   ===================================================================== */
const S = {
  app: {
    minHeight: "100vh",
    background: C.bg,
    fontFamily: "'Syne', 'Segoe UI', sans-serif",
    color: C.text,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "20px",
    padding: "32px 28px",
    width: "100%",
    maxWidth: "460px",
    boxSizing: "border-box",
  },
  btn: (color = C.primary, textColor = "#000") => ({
    background: color,
    color: textColor,
    border: "none",
    borderRadius: "12px",
    padding: "14px 24px",
    fontSize: "15px",
    fontWeight: "700",
    fontFamily: "'Syne', sans-serif",
    cursor: "pointer",
    width: "100%",
    marginTop: "10px",
    letterSpacing: "0.02em",
    transition: "transform 0.1s, opacity 0.1s",
  }),
  outlineBtn: (color = C.primary) => ({
    background: "transparent",
    color: color,
    border: `2px solid ${color}`,
    borderRadius: "12px",
    padding: "13px 24px",
    fontSize: "14px",
    fontWeight: "700",
    fontFamily: "'Syne', sans-serif",
    cursor: "pointer",
    width: "100%",
    marginTop: "8px",
    letterSpacing: "0.02em",
  }),
  mono: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  tag: (color) => ({
    background: color + "22",
    color: color,
    border: `1px solid ${color}55`,
    borderRadius: "6px",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    display: "inline-block",
  }),
};

/* =====================================================================
   SUB-COMPONENTS
   ===================================================================== */
function ProgressBar({ current, total, color = C.primary }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ background: C.surface2, borderRadius: "999px", height: "6px", margin: "0 0 24px 0" }}>
      <div style={{ background: color, width: `${pct}%`, height: "100%", borderRadius: "999px", transition: "width 0.4s ease" }} />
    </div>
  );
}

function XPBadge({ xp }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: C.primaryDim, border: `1px solid ${C.primary}44`, borderRadius: "999px", padding: "4px 12px" }}>
      <span style={{ fontSize: "13px" }}>⚡</span>
      <span style={{ color: C.primary, fontWeight: "800", fontSize: "13px" }}>{xp} XP</span>
    </div>
  );
}

function FlashFeedback({ correct, message, visible }) {
  if (!visible) return null;
  const bg = correct ? C.successDim : C.errorDim;
  const border = correct ? C.success : C.error;
  const color = correct ? C.success : C.error;
  return (
    <div style={{ background: bg, border: `1px solid ${border}44`, borderRadius: "12px", padding: "14px 18px", marginTop: "16px", transition: "opacity 0.3s", opacity: visible ? 1 : 0 }}>
      <div style={{ color, fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>{correct ? "✓ Correct!" : "✗ Not quite"}</div>
      <div style={{ color: C.muted, fontSize: "13px", lineHeight: "1.5", ...S.mono }}>{message}</div>
    </div>
  );
}

/* =====================================================================
   SCREENS
   ===================================================================== */

// 1. WELCOME
function WelcomeScreen({ onStart }) {
  return (
    <div style={{ textAlign: "center", maxWidth: "460px", padding: "20px" }}>
      <div style={{ fontSize: "56px", marginBottom: "20px" }}>🧮</div>
      <h1 style={{ fontSize: "38px", fontWeight: "900", margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
        Math<span style={{ color: C.primary }}>Trainer</span>
      </h1>
      <p style={{ color: C.muted, fontSize: "16px", margin: "0 0 36px", lineHeight: "1.6" }}>
        Learn maths the smart way.<br />Adaptive. Fast. No fluff.
      </p>
      <button style={{ ...S.btn(), fontSize: "17px", padding: "16px", borderRadius: "14px" }} onClick={onStart}>
        Start Learning →
      </button>
    </div>
  );
}

// 2. LEVEL SELECT
function LevelSelectScreen({ onSelect }) {
  return (
    <div style={S.card}>
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "900", margin: "0 0 6px" }}>Choose your level</h2>
        <p style={{ color: C.muted, fontSize: "14px", margin: 0 }}>Or take the quick assessment to find out.</p>
      </div>
      {LEVELS.map((lvl) => (
        <button
          key={lvl.id}
          onClick={() => onSelect(lvl)}
          style={{
            display: "flex", alignItems: "center", gap: "16px",
            background: C.surface2, border: `1px solid ${C.border}`,
            borderRadius: "14px", padding: "16px 20px", width: "100%",
            marginBottom: "10px", cursor: "pointer", textAlign: "left",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = lvl.color}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          <span style={{ fontSize: "28px" }}>{lvl.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: lvl.color, fontWeight: "800", fontSize: "16px" }}>{lvl.label}</div>
            <div style={{ color: C.muted, fontSize: "13px", marginTop: "2px" }}>{lvl.desc}</div>
          </div>
          <span style={{ color: C.muted, fontSize: "18px" }}>›</span>
        </button>
      ))}
    </div>
  );
}

// 3. ASSESSMENT
function AssessmentScreen({ onComplete }) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const q = ASSESSMENT_QS[idx];

  const handleOption = (opt) => {
    if (chosen !== null) return;
    setChosen(opt);
    const isCorrect = opt === q.ans;
    if (isCorrect) setCorrect((c) => c + 1);
    setFeedback(isCorrect);
    setTimeout(() => {
      setFeedback(null);
      setChosen(null);
      if (idx + 1 >= ASSESSMENT_QS.length) {
        const total = correct + (isCorrect ? 1 : 0);
        let level = "beginner";
        if (total >= 5) level = "olympiad";
        else if (total >= 4) level = "advanced";
        else if (total >= 2) level = "intermediate";
        onComplete(level);
      } else {
        setIdx((i) => i + 1);
      }
    }, 1200);
  };

  return (
    <div style={S.card}>
      <div style={{ marginBottom: "6px" }}>
        <div style={{ color: C.muted, fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
          Quick Assessment · Q{idx + 1}/{ASSESSMENT_QS.length}
        </div>
        <ProgressBar current={idx} total={ASSESSMENT_QS.length} />
      </div>

      <div style={{ background: C.surface2, borderRadius: "14px", padding: "22px", marginBottom: "20px" }}>
        <p style={{ fontSize: "20px", fontWeight: "700", margin: 0, lineHeight: "1.4", ...S.mono }}>{q.q}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {q.opts.map((opt) => {
          let bg = C.surface2;
          let border = C.border;
          let color = C.text;
          if (chosen === opt) {
            bg = feedback ? C.successDim : C.errorDim;
            border = feedback ? C.success : C.error;
            color = feedback ? C.success : C.error;
          }
          return (
            <button
              key={opt}
              onClick={() => handleOption(opt)}
              style={{ background: bg, border: `2px solid ${border}`, borderRadius: "12px", padding: "14px 18px", color, fontWeight: "600", fontSize: "15px", fontFamily: "'Syne',sans-serif", cursor: "pointer", textAlign: "left", ...S.mono }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 4. ASSESSMENT RESULT
function AssessmentResultScreen({ level, onContinue }) {
  const lvlData = LEVELS.find((l) => l.id === level);
  return (
    <div style={{ ...S.card, textAlign: "center" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>{lvlData.icon}</div>
      <div style={S.tag(lvlData.color)}>{lvlData.label}</div>
      <h2 style={{ fontSize: "28px", fontWeight: "900", margin: "16px 0 8px" }}>
        You're at <span style={{ color: lvlData.color }}>{lvlData.label}</span>
      </h2>
      <p style={{ color: C.muted, fontSize: "15px", margin: "0 0 32px", lineHeight: "1.6" }}>
        {lvlData.desc} — let's build from here.
      </p>
      <button style={S.btn(lvlData.color)} onClick={onContinue}>Continue →</button>
    </div>
  );
}

// 5. TOPIC SELECT
function TopicSelectScreen({ level, totalXP, onSelect }) {
  const topics = TOPICS[level] || [];
  const lvlData = LEVELS.find((l) => l.id === level);
  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "900", margin: "0 0 4px" }}>Choose a topic</h2>
          <div style={S.tag(lvlData.color)}>{lvlData.label}</div>
        </div>
        <XPBadge xp={totalXP} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelect(topic)}
            style={{
              background: C.surface2, border: `1px solid ${C.border}`, borderRadius: "14px",
              padding: "18px 14px", cursor: "pointer", textAlign: "left",
              transition: "border-color 0.2s, transform 0.1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = lvlData.color; e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "scale(1)"; }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>{topic.icon}</div>
            <div style={{ fontWeight: "800", fontSize: "13px", marginBottom: "4px" }}>{topic.name}</div>
            <div style={{ color: C.muted, fontSize: "11px", lineHeight: "1.4" }}>{topic.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// 6. LEARN SCREEN
function LearnScreen({ topic, onTryNow, level }) {
  const content = CONTENT[topic.id];
  const lvlData = LEVELS.find((l) => l.id === level);
  if (!content) return <div style={S.card}><p>Content coming soon!</p><button style={S.btn()} onClick={onTryNow}>Continue</button></div>;

  return (
    <div style={{ ...S.card, maxHeight: "88vh", overflowY: "auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={S.tag(lvlData.color)}>{topic.name}</div>
        <h2 style={{ fontSize: "24px", fontWeight: "900", margin: "10px 0 0" }}>{content.title}</h2>
      </div>

      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px", marginBottom: "14px" }}>
        <div style={{ color: C.muted, fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Concept</div>
        <pre style={{ margin: 0, fontFamily: "inherit", fontSize: "14px", lineHeight: "1.8", color: C.text, whiteSpace: "pre-wrap" }}>
          {content.concept}
        </pre>
      </div>

      <div style={{ background: C.primaryDim, border: `1px solid ${C.primary}33`, borderRadius: "14px", padding: "18px", marginBottom: "14px" }}>
        <div style={{ color: C.primary, fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Example</div>
        <pre style={{ margin: 0, fontSize: "14px", lineHeight: "1.9", color: C.text, whiteSpace: "pre-wrap", ...S.mono }}>
          {content.example}
        </pre>
      </div>

      <div style={{ background: C.hintDim, border: `1px solid ${C.hint}33`, borderRadius: "10px", padding: "14px 16px", marginBottom: "20px" }}>
        <span style={{ color: C.hint, fontWeight: "700", fontSize: "12px" }}>💡 TIP: </span>
        <span style={{ color: C.text, fontSize: "13px" }}>{content.tip}</span>
      </div>

      <button style={S.btn(lvlData.color)} onClick={onTryNow}>Try Now →</button>
    </div>
  );
}

// 7. PRACTICE SCREEN (guided)
function PracticeScreen({ topic, onStartQuiz, level }) {
  const content = CONTENT[topic.id];
  const lvlData = LEVELS.find((l) => l.id === level);
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'

  const pr = content?.practice;
  if (!pr) return <div style={S.card}><button style={S.btn()} onClick={onStartQuiz}>Start Quiz</button></div>;

  const checkAnswer = () => {
    const clean = input.trim().toLowerCase().replace(/[₹,\s]/g, "");
    const correctClean = pr.ans.toLowerCase().replace(/[₹,\s]/g, "");
    setResult(clean === correctClean ? "correct" : "wrong");
  };

  return (
    <div style={S.card}>
      <div style={{ marginBottom: "20px" }}>
        <div style={S.tag(lvlData.color)}>Guided Practice</div>
        <h3 style={{ fontSize: "18px", fontWeight: "800", margin: "10px 0 0" }}>{topic.name}</h3>
      </div>

      <div style={{ background: C.surface2, borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
        <div style={{ color: C.muted, fontSize: "12px", fontWeight: "700", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Solve this</div>
        <p style={{ fontSize: "18px", fontWeight: "700", margin: 0, lineHeight: "1.5", ...S.mono }}>{pr.q}</p>
      </div>

      {!result && (
        <>
          <input
            type="text"
            placeholder="Your answer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
            style={{
              background: C.surface2, border: `2px solid ${C.border}`, borderRadius: "12px",
              padding: "14px 18px", color: C.text, fontSize: "16px", fontFamily: "'Syne', sans-serif",
              fontWeight: "600", width: "100%", boxSizing: "border-box", marginBottom: "10px",
              outline: "none", ...S.mono,
            }}
          />
          <button style={S.btn(lvlData.color)} onClick={checkAnswer}>Check Answer</button>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button style={{ ...S.outlineBtn(C.hint), width: "50%" }} onClick={() => setShowHint((h) => !h)}>
              {showHint ? "Hide Hint" : "💡 Hint"}
            </button>
            <button style={{ ...S.outlineBtn(C.muted), width: "50%" }} onClick={() => setShowSteps((s) => !s)}>
              {showSteps ? "Hide Steps" : "📋 Show Steps"}
            </button>
          </div>
        </>
      )}

      {showHint && !result && (
        <div style={{ background: C.hintDim, border: `1px solid ${C.hint}33`, borderRadius: "10px", padding: "12px 16px", marginTop: "12px" }}>
          <span style={{ color: C.hint, fontWeight: "700" }}>Hint: </span>
          <span style={{ color: C.text, fontSize: "13px" }}>{pr.hint}</span>
        </div>
      )}

      {showSteps && !result && (
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 16px", marginTop: "10px" }}>
          <div style={{ color: C.muted, fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Step by Step</div>
          <pre style={{ margin: 0, fontSize: "13px", color: C.primary, lineHeight: "1.9", whiteSpace: "pre-wrap", ...S.mono }}>{pr.steps}</pre>
        </div>
      )}

      {result === "correct" && (
        <div style={{ background: C.successDim, border: `1px solid ${C.success}44`, borderRadius: "12px", padding: "18px", marginTop: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎉</div>
          <div style={{ color: C.success, fontWeight: "800", fontSize: "16px" }}>Correct!</div>
          <p style={{ color: C.muted, fontSize: "13px", margin: "6px 0 0" }}>Great work! Ready for the quiz?</p>
          <button style={{ ...S.btn(C.success), marginTop: "16px" }} onClick={onStartQuiz}>Start Quiz ⚡</button>
        </div>
      )}

      {result === "wrong" && (
        <div style={{ background: C.errorDim, border: `1px solid ${C.error}44`, borderRadius: "12px", padding: "18px", marginTop: "12px" }}>
          <div style={{ color: C.error, fontWeight: "800", fontSize: "15px", marginBottom: "6px" }}>Not quite — correct answer: <span style={S.mono}>{pr.ans}</span></div>
          <pre style={{ margin: "8px 0 0", fontSize: "13px", color: C.primary, lineHeight: "1.9", whiteSpace: "pre-wrap", ...S.mono }}>{pr.steps}</pre>
          <button style={{ ...S.btn(lvlData.color), marginTop: "16px" }} onClick={onStartQuiz}>Try the Quiz Anyway →</button>
        </div>
      )}
    </div>
  );
}

// 8. QUIZ ENGINE (adaptive)
function QuizScreen({ topic, level, onComplete }) {
  const content = CONTENT[topic.id];
  const lvlData = LEVELS.find((l) => l.id === level);
  const allQs = content?.questions || [];

  const [diffLevel, setDiffLevel] = useState("medium"); // easy | medium | hard
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [answered, setAnswered] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const usedIds = useRef(new Set());

  const TOTAL_QS = 5;

  const getQuestion = () => {
    const pool = allQs.filter((q) => {
      if (usedIds.current.has(q.q)) return false;
      if (diffLevel === "hard") return q.diff === "hard" || q.diff === "medium";
      if (diffLevel === "easy") return q.diff === "easy" || q.diff === "medium";
      return true; // medium: any
    });
    if (pool.length === 0) {
      const fallback = allQs.filter((q) => !usedIds.current.has(q.q));
      return fallback[Math.floor(Math.random() * fallback.length)] || allQs[0];
    }
    // prefer matching difficulty
    const best = pool.filter((q) => q.diff === diffLevel);
    const source = best.length > 0 ? best : pool;
    return source[Math.floor(Math.random() * source.length)];
  };

  const [currentQ, setCurrentQ] = useState(() => getQuestion());

  const handleOption = (opt) => {
    if (chosen !== null) return;
    setChosen(opt);
    const isCorrect = opt === currentQ.ans;
    setFeedbackVisible(true);

    let earnedXp = isCorrect ? (diffLevel === "hard" ? 30 : diffLevel === "medium" ? 20 : 10) : 0;
    const newStreak = isCorrect ? streak + 1 : 0;
    if (isCorrect && newStreak % 3 === 0 && newStreak > 0) earnedXp += 15; // streak bonus

    const newAnswered = [...answered, { q: currentQ, chosen: opt, correct: isCorrect, xp: earnedXp }];

    // adaptive logic
    let newDiff = diffLevel;
    let newCC = isCorrect ? consecutiveCorrect + 1 : 0;
    let newCW = !isCorrect ? consecutiveWrong + 1 : 0;
    if (newCC >= 3) { newDiff = diffLevel === "easy" ? "medium" : "hard"; newCC = 0; }
    if (newCW >= 2) { newDiff = diffLevel === "hard" ? "medium" : "easy"; newCW = 0; }

    setTimeout(() => {
      setFeedbackVisible(false);
      setChosen(null);
      if (newAnswered.length >= TOTAL_QS) {
        const totalXp = newAnswered.reduce((s, a) => s + a.xp, 0);
        const correctCount = newAnswered.filter((a) => a.correct).length;
        // find weak area
        onComplete({ answers: newAnswered, xp: totalXp, score: correctCount, total: TOTAL_QS, topic });
      } else {
        setAnswered(newAnswered);
        setXp((x) => x + earnedXp);
        setStreak(newStreak);
        setConsecutiveCorrect(newCC);
        setConsecutiveWrong(newCW);
        setDiffLevel(newDiff);
        setQIdx((i) => i + 1);
        const nextQ = getQuestion();
        usedIds.current.add(currentQ.q);
        setCurrentQ(nextQ);
      }
    }, 1400);
  };

  if (!currentQ) return <div style={S.card}><p style={{ color: C.muted }}>No questions available for this topic yet.</p><button style={S.btn()} onClick={() => onComplete({ answers: [], xp: 0, score: 0, total: 5, topic })}>Back</button></div>;

  const diffColor = diffLevel === "hard" ? C.error : diffLevel === "easy" ? C.success : C.intermediate;

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ color: C.muted, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>Q{qIdx + 1}/{TOTAL_QS}</div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={S.tag(diffColor)}>{diffLevel === "hard" ? "🔥 Hard" : diffLevel === "easy" ? "Easy" : "Medium"}</span>
          {streak >= 2 && <span style={{ fontSize: "12px", color: C.primary }}>🔥 ×{streak}</span>}
        </div>
      </div>
      <ProgressBar current={qIdx} total={TOTAL_QS} color={lvlData.color} />

      <div style={{ background: C.surface2, borderRadius: "14px", padding: "22px", marginBottom: "18px", minHeight: "80px", display: "flex", alignItems: "center" }}>
        <p style={{ fontSize: "19px", fontWeight: "700", margin: 0, lineHeight: "1.5", ...S.mono }}>{currentQ.q}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {currentQ.opts.map((opt) => {
          let bg = C.surface2;
          let border = C.border;
          let color = C.text;
          if (chosen === opt) {
            const correct = opt === currentQ.ans;
            bg = correct ? C.successDim : C.errorDim;
            border = correct ? C.success : C.error;
            color = correct ? C.success : C.error;
          } else if (chosen !== null && opt === currentQ.ans) {
            // show correct answer after wrong pick
            bg = C.successDim; border = C.success; color = C.success;
          }
          return (
            <button
              key={opt}
              onClick={() => handleOption(opt)}
              style={{ background: bg, border: `2px solid ${border}`, borderRadius: "12px", padding: "14px 18px", color, fontWeight: "600", fontSize: "15px", fontFamily: "'Syne',sans-serif", cursor: chosen ? "default" : "pointer", textAlign: "left", transition: "all 0.2s", ...S.mono }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {feedbackVisible && chosen && (
        <div style={{ background: chosen === currentQ.ans ? C.successDim : C.errorDim, border: `1px solid ${chosen === currentQ.ans ? C.success : C.error}44`, borderRadius: "10px", padding: "12px 16px", marginTop: "14px" }}>
          <div style={{ color: chosen === currentQ.ans ? C.success : C.error, fontWeight: "700", fontSize: "13px", marginBottom: "4px" }}>
            {chosen === currentQ.ans ? "✓ Correct!" : "✗ Answer: " + currentQ.ans}
          </div>
          <div style={{ color: C.muted, fontSize: "12px", lineHeight: "1.5", ...S.mono }}>{currentQ.exp}</div>
        </div>
      )}
    </div>
  );
}

// 9. RESULT SCREEN
function ResultScreen({ results, topic, level, onTopicSelect, onQuizAgain, onChangeLevel }) {
  const { score, total, xp, answers } = results;
  const lvlData = LEVELS.find((l) => l.id === level);
  const pct = Math.round((score / total) * 100);

  const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "🎉" : pct >= 40 ? "💪" : "📚";
  const msg = pct >= 80 ? "Excellent!" : pct >= 60 ? "Great job!" : pct >= 40 ? "Keep going!" : "Need more practice!";

  const wrongTopics = answers.filter((a) => !a.correct);
  const weakMsg = wrongTopics.length === 0 ? null : `Review: ${wrongTopics.map((a) => a.q.q.slice(0, 20) + "...").slice(0, 2).join(", ")}`;

  return (
    <div style={S.card}>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>{emoji}</div>
        <h2 style={{ fontSize: "30px", fontWeight: "900", margin: "0 0 6px" }}>{msg}</h2>
        <div style={S.tag(lvlData.color)}>{topic.name}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: C.surface2, borderRadius: "14px", padding: "18px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "900", color: pct >= 60 ? C.success : C.error }}>{score}/{total}</div>
          <div style={{ color: C.muted, fontSize: "12px", marginTop: "4px" }}>Score</div>
        </div>
        <div style={{ background: C.primaryDim, border: `1px solid ${C.primary}33`, borderRadius: "14px", padding: "18px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "900", color: C.primary }}>+{xp}</div>
          <div style={{ color: C.muted, fontSize: "12px", marginTop: "4px" }}>XP Earned</div>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ color: C.muted, fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Breakdown</div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {answers.map((a, i) => (
            <div key={i} style={{ background: a.correct ? C.successDim : C.errorDim, border: `1px solid ${a.correct ? C.success : C.error}44`, borderRadius: "8px", padding: "6px 10px", fontSize: "12px", color: a.correct ? C.success : C.error, fontWeight: "700" }}>
              Q{i + 1} {a.correct ? "✓" : "✗"}
            </div>
          ))}
        </div>
      </div>

      {weakMsg && (
        <div style={{ background: C.errorDim, border: `1px solid ${C.error}33`, borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }}>
          <div style={{ color: C.error, fontWeight: "700", fontSize: "12px", marginBottom: "4px" }}>⚠️ Weak area</div>
          <div style={{ color: C.muted, fontSize: "12px" }}>{weakMsg}</div>
        </div>
      )}

      <button style={S.btn(lvlData.color)} onClick={onQuizAgain}>🔁 Quiz Again</button>
      <button style={S.outlineBtn(C.primary)} onClick={onTopicSelect}>📚 Change Topic</button>
      <button style={S.outlineBtn(C.muted)} onClick={onChangeLevel}>🎚️ Change Level</button>
    </div>
  );
}

/* =====================================================================
   MAIN APP
   ===================================================================== */
export default function MathTrainer() {
  injectFonts();

  const [screen, setScreen] = useState("welcome");
  const [level, setLevel] = useState("beginner");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [totalXP, setTotalXP] = useState(0);

  const handleLevelSelect = (lvl) => {
    setLevel(lvl.id);
    setScreen("assessment");
  };

  const handleAssessmentComplete = (suggestedLevel) => {
    setLevel(suggestedLevel);
    setScreen("assessmentResult");
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setScreen("learn");
  };

  const handleQuizComplete = (results) => {
    setQuizResults(results);
    setTotalXP((prev) => prev + results.xp);
    setScreen("result");
  };

  const renderScreen = () => {
    switch (screen) {
      case "welcome":
        return <WelcomeScreen onStart={() => setScreen("levelSelect")} />;
      case "levelSelect":
        return <LevelSelectScreen onSelect={handleLevelSelect} />;
      case "assessment":
        return <AssessmentScreen onComplete={handleAssessmentComplete} />;
      case "assessmentResult":
        return <AssessmentResultScreen level={level} onContinue={() => setScreen("topicSelect")} />;
      case "topicSelect":
        return <TopicSelectScreen level={level} totalXP={totalXP} onSelect={handleTopicSelect} />;
      case "learn":
        return <LearnScreen topic={selectedTopic} level={level} onTryNow={() => setScreen("practice")} />;
      case "practice":
        return <PracticeScreen topic={selectedTopic} level={level} onStartQuiz={() => setScreen("quiz")} />;
      case "quiz":
        return <QuizScreen topic={selectedTopic} level={level} onComplete={handleQuizComplete} />;
      case "result":
        return (
          <ResultScreen
            results={quizResults}
            topic={selectedTopic}
            level={level}
            onQuizAgain={() => setScreen("quiz")}
            onTopicSelect={() => setScreen("topicSelect")}
            onChangeLevel={() => setScreen("levelSelect")}
          />
        );
      default:
        return <WelcomeScreen onStart={() => setScreen("levelSelect")} />;
    }
  };

  // Top nav bar (shown after welcome)
  const showNav = screen !== "welcome";

  return (
    <div style={S.app}>
      {showNav && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, background: C.surface + "EE", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.border}`, padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100 }}>
          <button
            onClick={() => setScreen("topicSelect")}
            style={{ background: "none", border: "none", color: C.primary, fontWeight: "800", fontFamily: "'Syne',sans-serif", fontSize: "15px", cursor: "pointer", letterSpacing: "-0.02em" }}
          >
            🧮 MathTrainer
          </button>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {totalXP > 0 && <XPBadge xp={totalXP} />}
            <button
              onClick={() => setScreen("levelSelect")}
              style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: "8px", color: C.muted, fontSize: "12px", fontFamily: "'Syne',sans-serif", padding: "5px 10px", cursor: "pointer" }}
            >
              Level
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: showNav ? "56px" : "0", width: "100%", display: "flex", justifyContent: "center" }}>
        {renderScreen()}
      </div>
    </div>
  );
}

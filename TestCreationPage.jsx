// ═══════════════════════════════════════════════════════════════════════
//  TestCreationPage.jsx  —  NeuroForge Question Builder
//
//  Loaded by chat.html via:
//    <script type="text/babel" src="TestCreationPage.jsx" data-presets="react">
//
//  Globals required (set before this file loads):
//    window.React           — from ESM React module script in chat.html
//    window.ReactCreateRoot — from ESM react-dom/client module script
//    window.katex           — from KaTeX UMD CDN
// ═══════════════════════════════════════════════════════════════════════

(() => {

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ═══════════════════════════════════════════════════════════════════════
   CHAPTER NOTATION TABLES
   Symbols extracted from every chapter — these are the notation marks
   (operators, symbols, function forms) NOT identities/formulas.
════════════════════════════════════════════════════════════════════════ */
const CHAPTER_NOTATIONS = {

  'Sets': [
    { sym:'\\in',             name:'Element of'         },
    { sym:'\\notin',          name:'Not element of'     },
    { sym:'\\subset',         name:'Proper Subset'      },
    { sym:'\\subseteq',       name:'Subset or Equal'    },
    { sym:'\\supset',         name:'Proper Superset'    },
    { sym:'\\supseteq',       name:'Superset or Equal'  },
    { sym:'\\cup',            name:'Union'              },
    { sym:'\\cap',            name:'Intersection'       },
    { sym:"A'",               name:'Complement'         },
    { sym:'A - B',            name:'Set Difference'     },
    { sym:'\\phi',            name:'Empty Set'          },
    { sym:'n(A)',             name:'Cardinality'        },
    { sym:'P(A)',             name:'Power Set'          },
    { sym:'A \\times B',      name:'Cartesian Product'  },
    { sym:'\\mathbb{N}',      name:'Natural Numbers'    },
    { sym:'\\mathbb{Z}',      name:'Integers'           },
    { sym:'\\mathbb{R}',      name:'Real Numbers'       },
    { sym:'\\mathbb{Q}',      name:'Rational Numbers'   },
    { sym:'\\forall',         name:'For All'            },
    { sym:'\\exists',         name:'There Exists'       },
    { sym:':',                name:'Such That'          },
    { sym:'\\mid',            name:'Such That (alt.)'   },
    { sym:'\\sim',            name:'Equivalence ~'      },
    { sym:'\\cong',           name:'Congruent to'       },
    { sym:'\\Rightarrow',     name:'Implies'            },
    { sym:'\\Leftrightarrow', name:'If and Only If'     },
    { sym:'|A|',              name:'Absolute Value/Size'},
  ],

  'Relations and Functions': [
    { sym:'A \\times B',          name:'Cartesian Product'     },
    { sym:'(a, b)',               name:'Ordered Pair'          },
    { sym:'R \\subseteq A\\times B', name:'Relation R'         },
    { sym:'aRb',                  name:'a relates to b'        },
    { sym:'\\text{Dom}(R)',        name:'Domain'                },
    { sym:'\\text{Ran}(R)',        name:'Range'                 },
    { sym:'\\text{Codom}(f)',      name:'Codomain'              },
    { sym:'R^{-1}',               name:'Inverse Relation'      },
    { sym:'f: A \\to B',          name:'Function'              },
    { sym:'f(x)',                 name:'Image of x'            },
    { sym:'f^{-1}(x)',            name:'Inverse Function'      },
    { sym:'(f\\circ g)(x)',       name:'Composite Function'    },
    { sym:'f+g',                  name:'Sum of Functions'      },
    { sym:'fg',                   name:'Product of Functions'  },
    { sym:'|x|',                  name:'Absolute Value'        },
    { sym:'\\lfloor x \\rfloor',  name:'Floor / GIF'           },
    { sym:'\\{x\\}',              name:'Fractional Part'       },
    { sym:'\\text{sgn}(x)',        name:'Signum Function'       },
    { sym:'f(x)=f(-x)',           name:'Even Function'         },
    { sym:'f(-x)=-f(x)',          name:'Odd Function'          },
    { sym:'f(x+T)=f(x)',          name:'Periodic Function'     },
    { sym:'\\phi(n)',              name:"Euler's Totient"       },
    { sym:'\\to',                 name:'Maps to'               },
    { sym:'\\mapsto',             name:'Element maps to'       },
  ],

  'Trigonometry': [
    { sym:'\\sin\\theta',         name:'Sine'                   },
    { sym:'\\cos\\theta',         name:'Cosine'                 },
    { sym:'\\tan\\theta',         name:'Tangent'                },
    { sym:'\\cot\\theta',         name:'Cotangent'              },
    { sym:'\\sec\\theta',         name:'Secant'                 },
    { sym:'\\csc\\theta',         name:'Cosecant'               },
    { sym:'\\theta',              name:'Theta (angle)'          },
    { sym:'\\alpha',              name:'Alpha'                  },
    { sym:'\\beta',               name:'Beta'                   },
    { sym:'\\gamma',              name:'Gamma'                  },
    { sym:'\\pi',                 name:'Pi'                     },
    { sym:'°',                    name:'Degree symbol'          },
    { sym:'\\text{rad}',          name:'Radian'                 },
    { sym:'\\sin^{-1}x',         name:'Arcsine'                },
    { sym:'\\cos^{-1}x',         name:'Arccosine'              },
    { sym:'\\tan^{-1}x',         name:'Arctangent'             },
    { sym:'\\sin^2\\theta',       name:'Sine squared'           },
    { sym:'\\cos^2\\theta',       name:'Cosine squared'         },
    { sym:'\\sin(A\\pm B)',       name:'Sum/Difference (sin)'   },
    { sym:'\\cos(A\\pm B)',       name:'Sum/Difference (cos)'   },
    { sym:'\\sin 2\\theta',       name:'Double angle (sin)'     },
    { sym:'\\cos 2\\theta',       name:'Double angle (cos)'     },
    { sym:'\\tan 2\\theta',       name:'Double angle (tan)'     },
    { sym:'\\pm',                 name:'Plus or Minus'          },
    { sym:'e^{i\\theta}',         name:"Euler's form"           },
    { sym:'2R',                   name:'Circumradius (2R)'      },
  ],

  'Complex Numbers': [
    { sym:'i',                      name:'Imaginary unit'        },
    { sym:'i^2=-1',                 name:'i squared'             },
    { sym:'z=a+bi',                 name:'Complex number form'   },
    { sym:'\\text{Re}(z)',           name:'Real part'             },
    { sym:'\\text{Im}(z)',           name:'Imaginary part'        },
    { sym:'\\mathbb{C}',            name:'Complex field'         },
    { sym:'\\bar{z}',               name:'Conjugate'             },
    { sym:'|z|',                    name:'Modulus'               },
    { sym:'z\\bar{z}=|z|^2',        name:'Modulus squared'       },
    { sym:'\\arg(z)',               name:'Argument'              },
    { sym:'re^{i\\theta}',          name:'Polar/Euler form'      },
    { sym:'e^{i\\theta}',           name:"Euler's formula"       },
    { sym:'(\\cos\\theta+i\\sin\\theta)^n', name:"De Moivre's"  },
    { sym:'\\omega_k=e^{2\\pi ik/n}',name:'nth Roots of Unity'  },
    { sym:'|z_1+z_2|',             name:'Modulus of sum'        },
    { sym:'|z-a|=r',               name:'Circle locus'          },
    { sym:'|z-a|=|z-b|',           name:'Perp. bisector locus'  },
    { sym:'z\\mapsto e^{i\\alpha}z', name:'Rotation map'         },
    { sym:'\\omega',                name:'Omega (cube root)'     },
    { sym:'\\omega^2',              name:'Omega squared'         },
    { sym:'1+\\omega+\\omega^2=0',  name:'Cube root identity'   },
  ],

  'Linear Inequalities': [
    { sym:'<',                      name:'Strictly less than'    },
    { sym:'>',                      name:'Strictly greater than' },
    { sym:'\\leq',                  name:'Less than or equal'    },
    { sym:'\\geq',                  name:'Greater than or equal' },
    { sym:'\\neq',                  name:'Not equal'             },
    { sym:'a<x<b',                  name:'Compound inequality'   },
    { sym:'[a,b]',                  name:'Closed interval'       },
    { sym:'(a,b)',                   name:'Open interval'         },
    { sym:'[a,b)',                   name:'Half-open interval'    },
    { sym:'(-\\infty,a)',            name:'Unbounded left'        },
    { sym:'(a,+\\infty)',            name:'Unbounded right'       },
    { sym:'|x|<a',                  name:'|x| less than a'       },
    { sym:'|x|>a',                  name:'|x| greater than a'    },
    { sym:'|x|\\leq a',             name:'|x| ≤ a'               },
    { sym:'ax+by\\leq c',           name:'Linear ineq. 2-var'    },
    { sym:'z=cx+dy',                name:'Objective function'    },
    { sym:'\\infty',                name:'Infinity'              },
    { sym:'-\\infty',               name:'Negative infinity'     },
    { sym:'\\therefore',            name:'Therefore'             },
    { sym:'\\because',              name:'Because'               },
  ],

  'Permutations and Combinations': [
    { sym:'n!',                         name:'Factorial'           },
    { sym:'0!=1',                       name:'Zero factorial'      },
    { sym:'{}^nP_r',                    name:'Permutation nPr'     },
    { sym:'{}^nC_r',                    name:'Combination nCr'     },
    { sym:'\\binom{n}{r}',              name:'Binomial coefficient' },
    { sym:'\\binom{n}{r}=\\binom{n}{n-r}', name:'Symmetry'        },
    { sym:'\\binom{n}{r}+\\binom{n}{r-1}', name:"Pascal's Identity"},
    { sym:'\\sum_{r=0}^n\\binom{n}{r}=2^n', name:'Row sum = 2^n'  },
    { sym:'(n-1)!',                     name:'Circular permutation'},
    { sym:'\\frac{n!}{p!\\,q!\\,r!}',  name:'Repeated items'      },
    { sym:'{}^{n+r-1}C_r',             name:'Selection w/ repeat' },
    { sym:'\\binom{n+k-1}{k-1}',       name:'Stars and bars'      },
    { sym:'D_n=(n-1)(D_{n-1}+D_{n-2})',name:'Derangements'         },
    { sym:'C_n=\\frac{1}{n+1}\\binom{2n}{n}', name:'Catalan number'},
    { sym:'\\binom{m+n}{m}',           name:'Lattice paths'        },
    { sym:'|A\\cup B|',                name:'PIE (union size)'     },
    { sym:'S(n,k)',                     name:'Stirling no. 2nd kind'},
  ],

  'Binomial Theorem': [
    { sym:'\\binom{n}{r}',              name:'Binomial coefficient' },
    { sym:'{}^nC_r',                    name:'Combination alt.'     },
    { sym:'T_{r+1}',                    name:'General term'         },
    { sym:'(a+b)^n',                    name:'Binomial expression'  },
    { sym:'2^n',                        name:'Sum of all coeffs.'   },
    { sym:'\\binom{n}{r}=\\binom{n}{n-r}', name:'Symmetry property' },
    { sym:'\\binom{n}{r}+\\binom{n}{r-1}=\\binom{n+1}{r}', name:"Pascal's identity" },
    { sym:'\\sum_{r=0}^{n}(-1)^r\\binom{n}{r}=0', name:'Alternating sum'},
    { sym:'\\sum_{r=0}^{n}\\binom{n}{r}=2^n', name:'Sum = 2^n'     },
    { sym:'(1+x)^n\\approx 1+nx',       name:'Binomial approx.'    },
    { sym:'n!',                          name:'Factorial'            },
    { sym:'\\omega=e^{2\\pi i/3}',       name:'Cube root of unity'  },
    { sym:'\\omega^2',                   name:'Omega squared'        },
    { sym:'\\frac{n!}{p!\\,q!\\,r!}',   name:'Multinomial coeff.'  },
    { sym:'\\text{nPr}=\\frac{n!}{(n-r)!}', name:'Permutation'     },
  ],

  'Sequences and Series': [
    { sym:'a_n',                    name:'n-th term'           },
    { sym:'S_n',                    name:'Sum of first n terms'},
    { sym:'a_1',                    name:'First term'          },
    { sym:'d',                      name:'Common difference AP'},
    { sym:'r',                      name:'Common ratio GP'     },
    { sym:'\\sum_{k=1}^{n}',        name:'Sigma notation'      },
    { sym:'\\sum_{k=1}^{\\infty}',  name:'Infinite sum'        },
    { sym:'AM = \\frac{a+b}{2}',    name:'Arithmetic mean'     },
    { sym:'GM = \\sqrt{ab}',        name:'Geometric mean'      },
    { sym:'HM = \\frac{2ab}{a+b}',  name:'Harmonic mean'       },
    { sym:'\\sum_{k=1}^{n} k',      name:'Sum of first n'      },
    { sym:'\\sum_{k=1}^{n} k^2',    name:'Sum of squares'      },
    { sym:'\\sum_{k=1}^{n} k^3',    name:'Sum of cubes'        },
    { sym:'\\phi = \\frac{1+\\sqrt5}{2}', name:'Golden ratio'   },
    { sym:'\\lim_{n\\to\\infty} a_n', name:'Sequence limit'    },
    { sym:'\\Delta a_n = a_{n+1}-a_n', name:'Forward difference'},
    { sym:'\\infty',                name:'Infinity'             },
    { sym:'\\cdots',                name:'Ellipsis (and so on)' },
    { sym:'\\ldots',                name:'Ellipsis (lower)'     },
  ],

  'Straight Lines': [
    { sym:'(x_1, y_1)',             name:'Point coordinates'    },
    { sym:'(x_2, y_2)',             name:'Point coordinates 2'  },
    { sym:'m',                      name:'Slope'                },
    { sym:'m = \\frac{y_2-y_1}{x_2-x_1}', name:'Slope formula' },
    { sym:'\\tan\\theta',           name:'tan of angle'         },
    { sym:'y = mx + c',             name:'Slope-intercept form' },
    { sym:'y - y_1 = m(x - x_1)',   name:'Point-slope form'     },
    { sym:'\\frac{x}{a}+\\frac{y}{b}=1', name:'Intercept form' },
    { sym:'Ax + By + C = 0',        name:'General form'         },
    { sym:'x\\cos\\alpha+y\\sin\\alpha=p', name:'Normal form'   },
    { sym:'d = \\frac{|Ax_1+By_1+C|}{\\sqrt{A^2+B^2}}', name:'Point to line dist.' },
    { sym:'m_1 = m_2',              name:'Parallel condition'   },
    { sym:'m_1 m_2 = -1',           name:'Perpendicular cond.'  },
    { sym:'L_1 + \\lambda L_2 = 0', name:'Family of lines'      },
    { sym:'\\lambda',               name:'Lambda parameter'     },
    { sym:'\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}', name:'Distance formula' },
    { sym:'\\frac{1}{2}|x_1(y_2-y_3)+\\cdots|', name:'Triangle area' },
  ],

  'Conic Sections': [
    { sym:'x^2+y^2=r^2',            name:'Circle (origin)'      },
    { sym:'(x-h)^2+(y-k)^2=r^2',   name:'Circle (centre h,k)'  },
    { sym:'y^2=4ax',                name:'Parabola (rightward)'  },
    { sym:'y^2=-4ax',               name:'Parabola (leftward)'   },
    { sym:'x^2=4ay',                name:'Parabola (upward)'     },
    { sym:'x^2=-4ay',               name:'Parabola (downward)'   },
    { sym:'\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1', name:'Ellipse'  },
    { sym:'\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1', name:'Hyperbola'},
    { sym:'e=\\frac{c}{a}',         name:'Eccentricity'          },
    { sym:'b^2=a^2(1-e^2)',         name:'b² for ellipse'        },
    { sym:'b^2=a^2(e^2-1)',         name:'b² for hyperbola'      },
    { sym:'l=\\frac{b^2}{a}',       name:'Semi-latus rectum'     },
    { sym:'xy=c^2',                 name:'Rectangular hyperbola' },
    { sym:'a',                      name:'Semi-major axis'       },
    { sym:'b',                      name:'Semi-minor axis'       },
    { sym:'c',                      name:'Focal distance'        },
    { sym:'ae',                     name:'Focal distance (ae)'   },
  ],

  'Introduction to Three Dimensional Geometry': [
    { sym:'(x, y, z)',              name:'Point in 3D'           },
    { sym:'d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}', name:'Distance 3D' },
    { sym:'l, m, n',                name:'Direction cosines'     },
    { sym:'l^2+m^2+n^2=1',         name:'DC relation'           },
    { sym:'a, b, c',                name:'Direction ratios'      },
    { sym:'\\cos\\alpha',           name:'DC w.r.t. x-axis'      },
    { sym:'\\cos\\beta',            name:'DC w.r.t. y-axis'      },
    { sym:'\\cos\\gamma',           name:'DC w.r.t. z-axis'      },
    { sym:'\\cos\\theta=l_1l_2+m_1m_2+n_1n_2', name:'Angle between lines' },
    { sym:'\\hat{i},\\hat{j},\\hat{k}', name:'Unit vectors'      },
    { sym:'OX, OY, OZ',            name:'Coordinate axes'       },
    { sym:'\\left(\\frac{x_1+x_2}{2},\\frac{y_1+y_2}{2},\\frac{z_1+z_2}{2}\\right)', name:'Midpoint 3D' },
    { sym:'\\frac{mx_2+nx_1}{m+n}', name:'Section formula x'    },
    { sym:'XOY,\\;YOZ,\\;XOZ',     name:'Coordinate planes'     },
    { sym:'r=\\sqrt{x^2+y^2+z^2}', name:'Distance from origin'  },
  ],

  'Limits and Derivatives': [
    { sym:'\\lim_{x\\to a}f(x)',    name:'Limit of f(x)'         },
    { sym:'\\lim_{x\\to a^-}f(x)', name:'Left-Hand Limit'        },
    { sym:'\\lim_{x\\to a^+}f(x)', name:'Right-Hand Limit'       },
    { sym:'\\lim_{x\\to 0}',       name:'Limit as x→0'           },
    { sym:'\\lim_{x\\to\\infty}',  name:'Limit as x→∞'           },
    { sym:"f'(x)",                 name:'First derivative'        },
    { sym:'\\frac{dy}{dx}',        name:'Leibniz notation'        },
    { sym:"\\frac{d^2y}{dx^2}",    name:'Second derivative'       },
    { sym:"f''(x)",                name:'f double prime'          },
    { sym:'\\frac{d}{dx}',         name:'Differential operator'   },
    { sym:'\\Delta x',             name:'Change in x'             },
    { sym:'\\delta',               name:'Delta (small change)'    },
    { sym:'\\epsilon',             name:'Epsilon'                 },
    { sym:'h\\to 0',               name:'h tends to 0'            },
    { sym:'\\frac{\\sin x}{x}',    name:'sin x over x'            },
    { sym:'\\frac{e^x-1}{x}',      name:'(eˣ−1)/x'               },
    { sym:'\\to',                  name:'Tends to'                },
    { sym:'\\infty',               name:'Infinity'                },
    { sym:'\\pm\\varepsilon',      name:'±epsilon'                },
  ],

  'Statistics': [
    { sym:'\\bar{x}',              name:'Sample mean'            },
    { sym:'\\mu',                  name:'Population mean'        },
    { sym:'\\sigma^2',             name:'Population variance'    },
    { sym:'s^2',                   name:'Sample variance'        },
    { sym:'\\sigma',               name:'Std. deviation'         },
    { sym:'CV',                    name:'Coefficient of variation'},
    { sym:'r',                     name:"Pearson's correlation"  },
    { sym:'r_s',                   name:"Spearman's rank corr."  },
    { sym:'\\hat{y}=a+bx',         name:'Regression line'        },
    { sym:'\\mu_r',                name:'r-th central moment'    },
    { sym:'\\beta_1',              name:'Skewness coefficient'   },
    { sym:'\\beta_2',              name:'Kurtosis coefficient'   },
    { sym:'H_0',                   name:'Null hypothesis'        },
    { sym:'H_1',                   name:'Alternative hypothesis' },
    { sym:'\\alpha',               name:'Significance level'     },
    { sym:'\\chi^2',               name:'Chi-square statistic'   },
    { sym:'\\sum',                 name:'Summation'              },
    { sym:'\\sum x_i',             name:'Sum of x values'        },
    { sym:'\\sum f_i x_i',         name:'Weighted sum'           },
    { sym:'n',                     name:'Sample size'            },
    { sym:'N',                     name:'Population size'        },
    { sym:'\\bar{d}',              name:'Mean deviation'         },
    { sym:'\\Phi(z)',              name:'Standard normal CDF'    },
    { sym:'R^2',                   name:'R-squared'              },
  ],

  'Probability': [
    { sym:'S',                      name:'Sample space'          },
    { sym:'\\Omega',                name:'Omega (sample space)'  },
    { sym:'P(A)',                   name:'Probability of A'      },
    { sym:"A'",                     name:'Complement of A'       },
    { sym:'A^c',                    name:'Complement (alt.)'     },
    { sym:'A\\cup B',               name:'Union (A OR B)'        },
    { sym:'A\\cap B',               name:'Intersection'          },
    { sym:'A\\perp B',              name:'Independence'          },
    { sym:'P(A|B)',                 name:'Conditional prob.'     },
    { sym:'P(A\\cap B)',            name:'P of intersection'     },
    { sym:'P(A\\cup B)',            name:'Addition rule'         },
    { sym:'\\binom{n}{k}',          name:'Binomial coefficient'  },
    { sym:'p^k(1-p)^{n-k}',        name:'Binomial PMF term'     },
    { sym:'X\\sim\\text{Bin}(n,p)', name:'Binomial distribution' },
    { sym:'X\\sim\\text{Poi}(\\lambda)', name:'Poisson dist.'   },
    { sym:'E[X]',                   name:'Expected value'        },
    { sym:'\\text{Var}(X)',         name:'Variance of X'         },
    { sym:'\\sigma_X',              name:'Std. deviation of X'   },
    { sym:'F(x)=P(X\\leq x)',       name:'CDF'                   },
    { sym:'D_n',                    name:'Derangements count'    },
    { sym:'\\lambda',               name:'Lambda (Poisson rate)' },
    { sym:'e^{-\\lambda}',          name:'e to −lambda'          },
  ],

  'Calculus': [
    { sym:'f(x)',                    name:'Function'              },
    { sym:'\\lim_{x\\to a}f(x)',     name:'Limit'                 },
    { sym:'\\frac{dy}{dx}',          name:'Derivative'            },
    { sym:"f'(x)",                   name:'f prime'               },
    { sym:'\\int f(x)\\,dx',         name:'Indefinite integral'   },
    { sym:'\\int_a^b f(x)\\,dx',     name:'Definite integral'     },
    { sym:'\\frac{\\partial f}{\\partial x}', name:'Partial derivative' },
    { sym:'\\nabla f',               name:'Gradient'              },
    { sym:'\\oint',                  name:'Contour integral'      },
    { sym:'\\Gamma(z)',              name:'Gamma function'         },
    { sym:'B(x,y)',                  name:'Beta function'          },
    { sym:'\\sum_{n=0}^{\\infty}',   name:'Infinite sum'          },
    { sym:'\\mathcal{L}\\{f(t)\\}',  name:'Laplace transform'     },
    { sym:'\\Delta f',               name:'Laplacian'             },
    { sym:'\\delta_{ij}',            name:'Kronecker delta'        },
    { sym:'\\epsilon_{ijk}',         name:'Levi-Civita symbol'    },
    { sym:'\\mathcal{O}(x^n)',       name:'Big-O notation'         },
    { sym:'\\frac{\\partial(u,v)}{\\partial(x,y)}', name:'Jacobian' },
    { sym:'R_n(x)',                  name:'Taylor remainder'       },
    { sym:'\\limsup',                name:'Limit superior'         },
    { sym:'\\liminf',                name:'Limit inferior'         },
    { sym:'\\int\\!\\int',           name:'Double integral'        },
    { sym:'\\int\\!\\int\\!\\int',   name:'Triple integral'        },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════
   CSS INJECTION  (runs once at module load)
════════════════════════════════════════════════════════════════════════ */
(function injectCSS() {
  if (document.getElementById('tcp-css')) return;
  const s = document.createElement('style');
  s.id = 'tcp-css';
  s.textContent = `
/* ── Page slide-in ── */
@keyframes tcp-slideIn {
  from { transform: translateX(100%); opacity: .6; }
  to   { transform: translateX(0);    opacity: 1;  }
}
/* ── Card stagger entry ── */
@keyframes tcp-cardIn {
  from { transform: translateY(20px) scale(.98); opacity: 0; }
  to   { transform: translateY(0)    scale(1);   opacity: 1; }
}
/* ── Notation panel from right ── */
@keyframes tcp-panelSlide {
  from { transform: translateX(100%); }
  to   { transform: translateX(0);    }
}
/* ── Overlay fade ── */
@keyframes tcp-fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
/* ── Pulse badge ── */
@keyframes tcp-pulse {
  0%,100% { opacity: 1;   }
  50%      { opacity: .55; }
}

/* ── Scrollbar ── */
.tcp-scroll::-webkit-scrollbar        { width: 3px; }
.tcp-scroll::-webkit-scrollbar-track  { background: transparent; }
.tcp-scroll::-webkit-scrollbar-thumb  { background: rgba(255,255,255,.1); border-radius: 3px; }

/* ── Card hover border glow ── */
.tcp-card { transition: border-color .2s, box-shadow .2s; }
.tcp-card:hover {
  border-color: rgba(99,102,241,.35) !important;
  box-shadow: 0 0 0 1px rgba(99,102,241,.1), var(--shadow-s) !important;
}

/* ── Option input focus ── */
.tcp-opt-inp:focus {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 2px rgba(59,130,246,.13) !important;
  outline: none;
}

/* ── Textarea focus ── */
.tcp-q-inp:focus {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 2px rgba(59,130,246,.1) !important;
  outline: none;
}

/* ── Symbol item hover ── */
.tcp-sym:hover {
  background: rgba(255,255,255,.05) !important;
  border-color: rgba(99,102,241,.3) !important;
}

/* ── Correct toggle button ── */
.tcp-correct:hover { transform: scale(1.08); }

/* ── Publish button hover ── */
.tcp-pub:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(37,99,235,.5) !important;
}
.tcp-pub:active { transform: scale(.96); }

/* ── Back button hover ── */
.tcp-back:hover { background: var(--bg-hover) !important; color: var(--tp) !important; }

/* ── KaTeX override for dark theme ── */
.katex { color: var(--tp); }
.katex-display { margin: 0; }
  `;
  document.head.appendChild(s);
})();

/* ═══════════════════════════════════════════════════════════════════════
   KATEX UTILITIES
════════════════════════════════════════════════════════════════════════ */
function renderKatex(latex, display = false) {
  if (!latex || !window.katex) return escHtml(latex);
  try {
    return window.katex.renderToString(String(latex), {
      throwOnError: false,
      displayMode:  display,
      strict:       false,
    });
  } catch (_) {
    return escHtml(latex);
  }
}

/** Parse a string containing $...$ (inline) and $$...$$ (display) blocks */
function parseMath(text) {
  if (!text) return { __html: '' };
  if (!window.katex) return { __html: escHtml(text) };

  let html = '';
  let i = 0;
  const T = text;

  while (i < T.length) {
    // Display math $$...$$
    if (T[i] === '$' && T[i + 1] === '$') {
      const end = T.indexOf('$$', i + 2);
      if (end === -1) { html += escHtml(T.slice(i)); break; }
      html += renderKatex(T.slice(i + 2, end), true);
      i = end + 2;
      continue;
    }
    // Inline math $...$
    if (T[i] === '$') {
      const end = T.indexOf('$', i + 1);
      if (end === -1) { html += escHtml(T.slice(i)); break; }
      html += renderKatex(T.slice(i + 1, end), false);
      i = end + 1;
      continue;
    }
    // Plain text (handle newlines)
    if (T[i] === '\n') { html += '<br>'; i++; continue; }
    html += escHtml(T[i]);
    i++;
  }
  return { __html: html };
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ═══════════════════════════════════════════════════════════════════════
   NOTATION PANEL
════════════════════════════════════════════════════════════════════════ */
function NotationPanel({ chapter, onInsert, onClose }) {
  const items = CHAPTER_NOTATIONS[chapter] || [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.38)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 3100,
          animation: 'tcp-fadeIn .2s ease both',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 'min(300px, 88vw)',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border2)',
        boxShadow: '-6px 0 36px rgba(0,0,0,.55)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 3200,
        animation: 'tcp-panelSlide .28s cubic-bezier(.22,.1,.36,1) both',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 14px 10px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
          background: 'var(--bg-sidebar)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-d)', fontSize: '.88rem',
              fontWeight: 800, color: 'var(--tp)',
            }}>
              Notation
            </div>
            <div style={{
              fontSize: '.62rem', color: 'var(--accent2)',
              fontWeight: 700, marginTop: 1, letterSpacing: '.3px',
            }}>
              {chapter}
            </div>
          </div>
          <button onClick={onClose} className="tcp-back" style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '1px solid var(--border2)',
            background: 'var(--bg-input)',
            color: 'var(--ts)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.82rem', outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}>✕</button>
        </div>

        {/* Hint */}
        <div style={{
          padding: '7px 14px 4px',
          fontSize: '.6rem', color: 'var(--tm)',
          lineHeight: 1.5, flexShrink: 0,
        }}>
          Tap a symbol to insert{' '}
          <span style={{
            background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.2)',
            borderRadius: 3, padding: '0 4px', fontFamily: 'monospace', fontSize: '.65rem',
            color: 'var(--accent2)',
          }}>$symbol$</span>
          {' '}at cursor
        </div>

        {/* Symbol grid */}
        <div className="tcp-scroll" style={{
          flex: 1, overflowY: 'auto',
          padding: '6px 10px 20px',
        }}>
          {items.map((item, idx) => (
            <button
              key={idx}
              className="tcp-sym"
              onClick={() => onInsert(item.sym)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 8px',
                border: '1px solid transparent',
                borderRadius: 9,
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: 2,
                transition: 'background .12s, border-color .12s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* KaTeX rendered symbol */}
              <div
                style={{
                  minWidth: 52, height: 34,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 6px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  fontSize: '.78rem',
                }}
                dangerouslySetInnerHTML={{ __html: renderKatex(item.sym, false) }}
              />
              {/* Name */}
              <span style={{
                fontSize: '.73rem', color: 'var(--ts)',
                fontWeight: 500, lineHeight: 1.3,
              }}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   OPTION ROW
════════════════════════════════════════════════════════════════════════ */
function OptionRow({ label, value, onChange, onFocus, isCorrect, onToggleCorrect, inputRef }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      {/* Correct-answer circle */}
      <button
        className="tcp-correct"
        onClick={onToggleCorrect}
        title={isCorrect ? 'Marked correct' : 'Mark as correct'}
        style={{
          width: 26, height: 26, borderRadius: '50%',
          border: `2px solid ${isCorrect ? 'var(--accent)' : 'var(--border2)'}`,
          background: isCorrect
            ? 'linear-gradient(135deg, var(--accent3), var(--accent))'
            : 'transparent',
          color: isCorrect ? '#fff' : 'var(--tm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all .16s ease',
          outline: 'none',
          fontFamily: 'var(--font-d)', fontSize: '.65rem', fontWeight: 800,
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {label}
      </button>

      {/* Text input */}
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={`Option ${label} — use $LaTeX$ for math`}
        className="tcp-opt-inp"
        style={{
          flex: 1,
          padding: '7px 11px',
          background: 'var(--bg-input)',
          border: `1px solid ${isCorrect ? 'rgba(99,102,241,.4)' : 'var(--border2)'}`,
          borderRadius: 8,
          color: 'var(--tp)',
          fontFamily: 'var(--font-b)',
          fontSize: '.83rem',
          transition: 'border-color .15s, box-shadow .15s',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   QUESTION CARD
════════════════════════════════════════════════════════════════════════ */
function QuestionCard({ index, total, chapter, data, onChange, entryDelay, onOpenNotation }) {
  const [preview, setPreview] = useState(false);

  const qRef  = useRef(null);
  const aRef  = useRef(null);
  const bRef  = useRef(null);
  const cRef  = useRef(null);
  const dRef  = useRef(null);
  const refMap = { question: qRef, A: aRef, B: bRef, C: cRef, D: dRef };

  const hasQuestion  = data.question.trim().length > 0;
  const filledOpts   = Object.values(data.options).filter(Boolean).length;
  const isComplete   = hasQuestion && data.correct && filledOpts >= 2;

  const handleFocus = useCallback((field) => {
    onOpenNotation(index, field, refMap[field]);
  }, [index, onOpenNotation]);

  return (
    <div
      className="tcp-card"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isComplete ? 'rgba(34,197,94,.25)' : 'var(--border)'}`,
        borderRadius: 16,
        padding: '16px 14px 13px',
        marginBottom: 12,
        boxShadow: 'var(--shadow-s)',
        animation: `tcp-cardIn .38s cubic-bezier(.22,.1,.36,1) ${entryDelay}ms both`,
      }}
    >
      {/* ── Card top row ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 11,
      }}>
        {/* Index badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: isComplete
              ? 'linear-gradient(135deg,#16a34a,#22c55e)'
              : 'linear-gradient(135deg,var(--accent3),var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-d)', fontSize: '.7rem', fontWeight: 800, color: '#fff',
            transition: 'background .3s',
          }}>
            {isComplete
              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : index + 1
            }
          </div>
          <span style={{ fontSize: '.7rem', color: 'var(--ts)', fontWeight: 600 }}>
            Q {index + 1}
            <span style={{ color: 'var(--tm)' }}> / {total}</span>
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 5 }}>
          {/* Preview toggle */}
          {hasQuestion && (
            <button
              onClick={() => setPreview(p => !p)}
              style={{
                padding: '3px 9px', borderRadius: 99,
                border: `1px solid ${preview ? 'rgba(99,102,241,.35)' : 'var(--border2)'}`,
                background: preview ? 'rgba(99,102,241,.12)' : 'transparent',
                color: preview ? 'var(--accent2)' : 'var(--ts)',
                fontSize: '.6rem', fontWeight: 700, letterSpacing: '.6px',
                cursor: 'pointer', transition: 'all .15s', outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {preview ? 'EDIT' : 'PREVIEW'}
            </button>
          )}

          {/* Notation button */}
          <button
            onClick={() => { onOpenNotation(index, 'question', qRef); }}
            style={{
              padding: '3px 9px', borderRadius: 99,
              border: '1px solid var(--border2)',
              background: 'transparent',
              color: 'var(--ts)',
              fontSize: '.6rem', fontWeight: 700, letterSpacing: '.6px',
              cursor: 'pointer', transition: 'all .15s', outline: 'none',
              display: 'flex', alignItems: 'center', gap: 4,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* T with subscript icon */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
            </svg>
            NOTATION
          </button>
        </div>
      </div>

      {/* ── Question area ── */}
      {preview ? (
        /* KaTeX preview */
        <div
          style={{
            minHeight: 62,
            padding: '10px 12px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: '.86rem', lineHeight: 1.75,
            color: 'var(--tp)',
            marginBottom: 13,
            overflowX: 'auto',
          }}
          dangerouslySetInnerHTML={parseMath(data.question)}
        />
      ) : (
        /* Text input */
        <textarea
          ref={qRef}
          value={data.question}
          onChange={e => onChange({ ...data, question: e.target.value })}
          onFocus={() => handleFocus('question')}
          placeholder={`Question ${index + 1} — type here, use $LaTeX$ for math notation`}
          rows={3}
          className="tcp-q-inp"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border2)',
            borderRadius: 10,
            color: 'var(--tp)',
            fontFamily: 'var(--font-b)',
            fontSize: '.86rem', lineHeight: 1.6,
            resize: 'vertical',
            display: 'block',
            marginBottom: 13,
            transition: 'border-color .15s, box-shadow .15s',
          }}
        />
      )}

      {/* ── Options ── */}
      {['A','B','C','D'].map(label => (
        <OptionRow
          key={label}
          label={label}
          inputRef={refMap[label]}
          value={data.options[label]}
          onChange={val => onChange({ ...data, options: { ...data.options, [label]: val } })}
          onFocus={() => handleFocus(label)}
          isCorrect={data.correct === label}
          onToggleCorrect={() => onChange({ ...data, correct: data.correct === label ? null : label })}
        />
      ))}

      {/* ── Correct answer indicator ── */}
      <div style={{ marginTop: 5 }}>
        {data.correct ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.22)',
            borderRadius: 99, padding: '3px 10px',
            fontSize: '.62rem', fontWeight: 700, color: '#4ade80',
          }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Correct answer: Option {data.correct}
          </div>
        ) : (
          <div style={{
            fontSize: '.6rem', color: 'var(--tm)',
            animation: 'tcp-pulse 2s ease infinite',
          }}>
            ○ Tap a letter circle to mark the correct answer
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PROGRESS BAR
════════════════════════════════════════════════════════════════════════ */
function ProgressBar({ filled, total }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 3, borderRadius: 2,
        background: 'rgba(255,255,255,.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: pct === 100
            ? 'linear-gradient(90deg,#16a34a,#22c55e)'
            : 'linear-gradient(90deg,var(--accent3),var(--accent))',
          width: `${pct}%`,
          transition: 'width .45s cubic-bezier(.22,.1,.36,1), background .3s',
        }}/>
      </div>
      <span style={{
        fontSize: '.6rem', fontWeight: 700, color: pct === 100 ? '#4ade80' : 'var(--ts)',
        whiteSpace: 'nowrap', minWidth: 54, textAlign: 'right',
        transition: 'color .3s',
      }}>
        {filled}/{total} done
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   META CHIP
════════════════════════════════════════════════════════════════════════ */
function MetaChip({ label, value }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-input)',
      border: '1px solid var(--border)',
      borderRadius: 9, padding: '5px 11px',
      minWidth: 72,
    }}>
      <span style={{
        fontSize: '.52rem', color: 'var(--ts)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '.9px',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '.85rem', color: 'var(--tp)',
        fontWeight: 700, fontFamily: 'var(--font-d)',
        marginTop: 2,
      }}>
        {value}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN  —  TEST CREATION PAGE
════════════════════════════════════════════════════════════════════════ */
function TestCreationPage({ config, onClose }) {
  const {
    chapter   = '',
    title     = 'Untitled Test',
    numQ      = 5,
    xpPerQ    = 10,
    createdBy = 'You',
  } = config;

  const totalMarks = numQ * xpPerQ;

  /* questions state */
  const [questions, setQuestions] = useState(() =>
    Array.from({ length: numQ }, (_, i) => ({
      id: i,
      question: '',
      options: { A: '', B: '', C: '', D: '' },
      correct: null,
    }))
  );

  /* notation panel state */
  const [panelOpen, setPanelOpen]       = useState(false);
  /* track which card+field is active for notation insertion */
  const activeRef = useRef({ cardIdx: 0, field: 'question', elRef: null });

  /* page slide-in */
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t); }, []);

  /* completion count */
  const completedCount = useMemo(() =>
    questions.filter(q =>
      q.question.trim() &&
      q.correct &&
      Object.values(q.options).filter(Boolean).length >= 2
    ).length,
    [questions]
  );

  /* ── called by each card when a field is focused ── */
  const handleFocusField = useCallback((cardIdx, field, elRef) => {
    activeRef.current = { cardIdx, field, elRef };
  }, []);

  /* ── called by each card's NOTATION button ── */
  const handleOpenNotation = useCallback((cardIdx, field, elRef) => {
    activeRef.current = { cardIdx, field, elRef };
    setPanelOpen(true);
  }, []);

  /* ── insert LaTeX wrapped in $...$ at cursor ── */
  const handleInsert = useCallback((sym) => {
    const { cardIdx, field, elRef } = activeRef.current;
    const el = elRef?.current;
    const wrap = `$${sym}$`;

    if (el) {
      const start = el.selectionStart ?? el.value.length;
      const end   = el.selectionEnd   ?? el.value.length;
      const newVal = el.value.slice(0, start) + wrap + el.value.slice(end);

      setQuestions(qs => qs.map((q, i) => {
        if (i !== cardIdx) return q;
        if (field === 'question') return { ...q, question: newVal };
        return { ...q, options: { ...q.options, [field]: newVal } };
      }));

      /* restore cursor after React re-render */
      setTimeout(() => {
        if (!el) return;
        el.focus();
        const pos = start + wrap.length;
        el.selectionStart = el.selectionEnd = pos;
      }, 16);
    } else {
      /* fallback: append */
      setQuestions(qs => qs.map((q, i) => {
        if (i !== cardIdx) return q;
        if (field === 'question') return { ...q, question: (q.question || '') + wrap };
        return { ...q, options: { ...q.options, [field]: (q.options[field] || '') + wrap } };
      }));
    }
  }, []);

  /* ── update a single question ── */
  const handleChange = useCallback((idx, updated) => {
    setQuestions(qs => qs.map((q, i) => i === idx ? updated : q));
  }, []);

  /* ── close page with slide-out ── */
  const handleClose = useCallback(() => {
    setMounted(false);
    setTimeout(onClose, 330);
  }, [onClose]);

  /* ── publish ── */
  const handlePublish = useCallback(() => {
    console.log('[NeuroForge] Test published:', { chapter, title, numQ, xpPerQ, totalMarks, questions });
    // TODO: persist to Firestore
    handleClose();
  }, [questions, chapter, title, numQ, xpPerQ, totalMarks, handleClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-chat)',
      zIndex: 2100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transform: mounted ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform .32s cubic-bezier(.22,.1,.36,1)',
    }}>

      {/* ════════════════ HEADER ════════════════ */}
      <div style={{
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 14px 11px',
        flexShrink: 0,
        boxShadow: '0 2px 14px rgba(0,0,0,.3)',
      }}>

        {/* Row 1: back · label · publish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
          <button
            onClick={handleClose}
            className="tcp-back"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '1px solid var(--border2)',
              background: 'var(--bg-input)',
              color: 'var(--ts)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              outline: 'none', flexShrink: 0,
              transition: 'all .18s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '.58rem', fontWeight: 800, color: 'var(--ts)',
              textTransform: 'uppercase', letterSpacing: 1.3,
              fontFamily: 'var(--font-b)',
            }}>
              Creation Page
            </div>
            <div style={{
              fontSize: '.94rem', fontWeight: 800,
              fontFamily: 'var(--font-d)', color: 'var(--tp)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              marginTop: 1, letterSpacing: '-.01em',
            }}>
              {title}
            </div>
          </div>

          <button
            onClick={handlePublish}
            className="tcp-pub"
            style={{
              padding: '8px 18px', borderRadius: 99,
              border: 'none',
              background: 'linear-gradient(135deg,var(--accent3),var(--accent))',
              color: '#fff',
              fontFamily: 'var(--font-b)', fontSize: '.8rem', fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 3px 16px rgba(37,99,235,.38)',
              transition: 'transform .18s, box-shadow .18s',
              outline: 'none', letterSpacing: '.3px',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
          >
            Publish →
          </button>
        </div>

        {/* Row 2: meta chips */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
          <MetaChip label="Created by"      value={createdBy}   />
          <MetaChip label="Total Marks"     value={totalMarks}  />
          <MetaChip label="XP / Question"   value={`${xpPerQ} XP`} />
          <MetaChip label="Total Questions" value={numQ}        />
        </div>

        {/* Row 3: chapter badge + progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(99,102,241,.1)',
            border: '1px solid rgba(99,102,241,.22)',
            borderRadius: 99, padding: '4px 10px',
            fontSize: '.64rem', fontWeight: 700, color: 'var(--accent2)',
            flexShrink: 0,
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            {chapter}
          </div>
          <div style={{ flex: 1 }}>
            <ProgressBar filled={completedCount} total={numQ} />
          </div>
        </div>
      </div>

      {/* ════════════════ QUESTION LIST ════════════════ */}
      <div
        className="tcp-scroll"
        style={{
          flex: 1, overflowY: 'auto',
          padding: '14px 13px 90px',
        }}
      >
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i}
            total={numQ}
            chapter={chapter}
            data={q}
            onChange={updated => handleChange(i, updated)}
            entryDelay={i * 45}
            onOpenNotation={handleOpenNotation}
          />
        ))}

        {/* Bottom spacer hint */}
        <div style={{
          textAlign: 'center', padding: '10px 0 4px',
          fontSize: '.65rem', color: 'var(--tm)',
        }}>
          {completedCount === numQ
            ? '🎉 All questions complete — ready to publish!'
            : `${numQ - completedCount} question${numQ - completedCount !== 1 ? 's' : ''} remaining`}
        </div>
      </div>

      {/* ════════════════ NOTATION PANEL ════════════════ */}
      {panelOpen && (
        <NotationPanel
          chapter={chapter}
          onInsert={sym => { handleInsert(sym); }}
          onClose={() => setPanelOpen(false)}
        />
      )}

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MOUNT / UNMOUNT  BRIDGE
   Called from chat.html's DONE button handler.
════════════════════════════════════════════════════════════════════════ */
window.mountTestCreation = function(config) {
  /* Ensure root element exists */
  let root = document.getElementById('testCreationRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'testCreationRoot';
    document.body.appendChild(root);
  }

  /* Use ReactCreateRoot (exposed by the module script in chat.html) */
  const createRoot = window.ReactCreateRoot;
  if (!createRoot) {
    console.error('[NeuroForge] window.ReactCreateRoot not found — add the module script to chat.html');
    return;
  }

  if (!window._tcRoot) {
    window._tcRoot = createRoot(root);
  }

  window._tcRoot.render(
    React.createElement(TestCreationPage, {
      config,
      onClose: window.unmountTestCreation,
    })
  );
};

window.unmountTestCreation = function() {
  if (window._tcRoot) {
    window._tcRoot.unmount();
    window._tcRoot = null;
  }
  const root = document.getElementById('testCreationRoot');
  if (root) root.remove();
};

})(); // end IIFE

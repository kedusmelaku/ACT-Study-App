// Math lessons. Original explanations and examples (no official ACT text).

export default {
  'Number and quantity': {
    summary:
      "These questions test arithmetic fluency: fractions, percents, ratios, exponents, absolute value, number properties, and unit conversions. Most misses here are setup or reading errors, so write each step and check that your answer has the units and form the question asks for.",
    sections: [
      {
        h: 'Core skills',
        list: [
          'Percent change = (new minus old) / old. A rise from 40 to 50 is 25 percent, not 20.',
          'Successive percents multiply: 20 percent off then 10 percent off is 0.8 × 0.9 = 0.72, so 28 percent off total, not 30.',
          'Ratios: a ratio of 3:5 means 3 parts and 5 parts out of 8 total parts. Find the size of one part first.',
          'Unit conversion: multiply by fractions equal to 1 so units cancel. Square units convert by the square of the factor (1 ft² = 144 in²).',
          'Number types: integers, rationals (fractions of integers), irrationals (like √2 and π). Even and odd rules, primes, factors, and multiples (LCM for "every 24th and every 60th" questions).',
          'Absolute value is distance from zero, so |x| = 5 means x = 5 or x = -5.',
          'Radicals: simplify by pulling out perfect squares, √72 = 6√2. Only like radicals add: 3√2 + 5√2 = 8√2.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Expect word problems that hide a simple calculation behind a long setup. Underline what is asked, especially units (inches vs. feet, hours vs. minutes) and words like "remaining," "total," or "difference."',
          'Rational/irrational and "which must be true" questions are fastest by testing numbers: try 0, 1, a negative, and a fraction.',
        ],
      },
    ],
    example: {
      prompt: 'A jacket costs $80. It is marked down 25%, and then a 10% coupon is applied to the sale price. What is the final price?',
      choices: ['A. $52.00', 'B. $54.00', 'C. $56.00', 'D. $60.00'],
      answer: 'B',
      steps: [
        'After 25% off, the price is 80 × 0.75 = $60.',
        'The 10% coupon applies to $60: 60 × 0.90 = $54.',
        'A comes from taking 35% off the original price. Percents applied one after another multiply, they do not add.',
      ],
    },
    check: [
      { q: 'A price rises from $50 to $60. What is the percent increase?', a: '(60 - 50) / 50 = 20%.' },
      { q: 'Simplify √50 + √8.', a: '5√2 + 2√2 = 7√2.' },
      { q: 'How many square inches are in 3 square feet?', a: '3 × 144 = 432.' },
    ],
  },

  'Linear equations and systems': {
    summary:
      "Linear questions ask you to solve equations and inequalities, work with slope and lines, or solve two equations at once. Know slope-intercept form cold, and pick the fastest system method: substitution, elimination, or graphing on your calculator.",
    sections: [
      {
        h: 'Equations and inequalities',
        list: [
          'Do the same thing to both sides. When you multiply or divide an inequality by a negative number, flip the sign.',
          'Absolute value inequalities: |x - 3| < 5 means -5 < x - 3 < 5, so -2 < x < 8. Greater than splits into two separate pieces.',
          'Literal equations: solve for one letter by treating the others as numbers.',
        ],
      },
      {
        h: 'Lines',
        list: [
          'Slope = rise / run = (y₂ - y₁) / (x₂ - x₁).',
          'Slope-intercept form: y = mx + b, where m is slope and b is the y-intercept.',
          'Rewrite Ax + By = C as y = (-A/B)x + C/B to read its slope.',
          'Parallel lines have equal slopes. Perpendicular slopes are negative reciprocals (2 and -1/2).',
        ],
      },
      {
        h: 'Systems',
        list: [
          'Substitution: solve one equation for a variable and plug it into the other.',
          'Elimination: add or subtract the equations to cancel a variable. Multiply first if needed.',
          'Number of solutions: different slopes give one solution. Same slope with a different intercept gives none (parallel). The same line gives infinitely many.',
          'Word problems: name two variables, write one equation for each fact (often a count and a total value).',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'When a question asks for only y, use elimination to remove x directly instead of solving for both.',
          'For "no solution" questions, set the slopes equal and make sure the intercepts differ.',
        ],
      },
    ],
    example: {
      prompt: 'A theater sold 200 tickets. Adult tickets cost $12 and student tickets cost $8. Total sales were $2,000. How many adult tickets were sold?',
      choices: ['A. 50', 'B. 80', 'C. 100', 'D. 120'],
      answer: 'C',
      steps: [
        'Let a = adult tickets and s = student tickets. Then a + s = 200 and 12a + 8s = 2000.',
        'Multiply the first equation by 8: 8a + 8s = 1600. Subtract from the second: 4a = 400, so a = 100.',
        'Check: 100 adult and 100 student tickets give 1200 + 800 = $2,000.',
      ],
    },
    check: [
      { q: 'What is the slope of 3x + 4y = 12?', a: '-3/4.' },
      { q: 'When does a system of two lines have no solution?', a: 'When the lines have the same slope and different intercepts, so they are parallel.' },
      { q: 'Solve -2x > 6.', a: 'x < -3. The sign flips when you divide by a negative.' },
    ],
  },

  'Quadratics and polynomials': {
    summary:
      "Quadratics show up as factoring, solving, vertex and intercept questions, and polynomial operations. Know the three forms of a parabola, what each one shows at a glance, and how roots, factors, and x-intercepts are the same idea.",
    sections: [
      {
        h: 'Three forms',
        list: [
          'Standard: y = ax² + bx + c. The y-intercept is c and the vertex is at x = -b / (2a).',
          'Factored: y = a(x - r)(x - s). The roots (x-intercepts) are r and s.',
          'Vertex: y = a(x - h)² + k. The vertex is (h, k). If a > 0 it opens up and k is the minimum.',
        ],
      },
      {
        h: 'Solving and factoring',
        list: [
          'Factor when you can: x² - 5x + 6 = (x - 2)(x - 3).',
          'Special patterns: a² - b² = (a - b)(a + b), and (a + b)² = a² + 2ab + b².',
          'Quadratic formula: x = (-b ± √(b² - 4ac)) / (2a).',
          'Discriminant b² - 4ac: positive means 2 real roots, zero means 1, negative means 2 complex roots.',
          'Sum of roots = -b/a and product of roots = c/a. These are handy shortcuts.',
        ],
      },
      {
        h: 'Polynomials',
        list: [
          'If x = r is a root, then (x - r) is a factor, and the reverse is also true.',
          'Expanding: (x + 5)² = x² + 10x + 25, not x² + 25. For a binomial to a higher power, use the pattern of coefficients (1, 4, 6, 4, 1 for the 4th power).',
          'Matching coefficients: if (x + k)² = x² + 10x + k², then 2k = 10, so k = 5.',
          'Rational expressions: factor top and bottom, then cancel common factors.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Many questions give one form and ask for a feature shown by another form. Choose the form that shows the feature: factored for roots, vertex form for the max or min.',
          'Projectile questions (h = -16t² + vt + s or -4.9t² + ...) ask for the max height (the vertex) or when it hits the ground (a root).',
        ],
      },
    ],
    example: {
      prompt: 'What is the minimum value of f(x) = x² - 6x + 13?',
      choices: ['A. 3', 'B. 4', 'C. 6', 'D. 13'],
      answer: 'B',
      steps: [
        'The vertex x-value is -b/(2a) = 6/2 = 3.',
        'f(3) = 9 - 18 + 13 = 4.',
        'Or complete the square: x² - 6x + 9 + 4 = (x - 3)² + 4, so the minimum is 4 at x = 3. A is the x-value of the vertex, a common trap.',
      ],
    },
    check: [
      { q: 'What are the roots of x² - 9 = 0?', a: 'x = 3 and x = -3, since x² - 9 = (x - 3)(x + 3).' },
      { q: 'Expand (x - 4)².', a: 'x² - 8x + 16.' },
      { q: 'What does a negative discriminant tell you?', a: 'There are no real roots. The two roots are complex.' },
    ],
  },

  Functions: {
    summary:
      "Function questions test notation, evaluation, composition, inverses, domain and range, graphs, and transformations. Treat f(x) as a machine: whatever goes in the parentheses replaces every x in the rule.",
    sections: [
      {
        h: 'Notation and evaluation',
        list: [
          'f(3) means replace x with 3. f(a + 1) means replace every x with (a + 1), using parentheses.',
          'Composition: f(g(x)) means do g first, then f. Work from the inside out.',
          'Inverse: swap x and y, then solve for y. f(f⁻¹(x)) = x. On a graph, the inverse is the reflection over y = x.',
          'Tables of values: to find f(g(2)), look up g(2) in the table, then look up f of that result.',
        ],
      },
      {
        h: 'Domain, range, and graphs',
        list: [
          'Domain problems: no division by zero, and no even root of a negative number.',
          'f(x) = 0 at the x-intercepts. f(0) is the y-intercept.',
          'Piecewise functions: check which interval the input falls in before using a rule.',
        ],
      },
      {
        h: 'Transformations',
        list: [
          'f(x) + k moves up k. f(x) - k moves down.',
          'f(x - h) moves right h. f(x + h) moves left. (Inside the parentheses works opposite to what you expect.)',
          '-f(x) reflects over the x-axis. f(-x) reflects over the y-axis.',
          'a·f(x) stretches vertically by a factor of a.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Most function misses are substitution slips. Write the substitution with parentheses before simplifying, especially with negatives: if f(x) = x², then f(-3) = (-3)² = 9.',
          'For transformations, test one point: if (0, 0) is on f, find where it goes under the new rule.',
        ],
      },
    ],
    example: {
      prompt: 'If f(x) = 2x + 3 and g(x) = x² - 1, what is f(g(3))?',
      choices: ['A. 9', 'B. 17', 'C. 19', 'D. 80'],
      answer: 'C',
      steps: [
        'Inside first: g(3) = 3² - 1 = 8.',
        'Then f(8) = 2(8) + 3 = 19.',
        'D is g(f(3)) = g(9) = 80, the result of doing them in the wrong order.',
      ],
    },
    check: [
      { q: 'How does the graph of y = f(x + 2) compare to y = f(x)?', a: 'It shifts 2 units left.' },
      { q: 'What is the domain of f(x) = 1 / (x - 5)?', a: 'All real numbers except 5.' },
      { q: 'Find the inverse of f(x) = 3x - 6.', a: 'Swap and solve: x = 3y - 6, so y = (x + 6) / 3.' },
    ],
  },

  'Exponents and logarithms': {
    summary:
      "Exponent rules let you combine powers with the same base, and logarithms are just exponents written another way: log_b(x) = y means b^y = x. Most questions reduce to rewriting everything with the same base or converting between log and exponent form.",
    sections: [
      {
        h: 'Exponent rules',
        list: [
          'Multiply: add exponents. x³ · x⁴ = x⁷.',
          'Divide: subtract exponents. x⁷ / x² = x⁵.',
          'Power of a power: multiply exponents. (x³)² = x⁶.',
          'x⁰ = 1, and x⁻ⁿ = 1 / xⁿ.',
          'Fractional exponents: x^(1/2) = √x, and x^(2/3) = (cube root of x)².',
          'Rewrite with a common base: 8^x = 2^(3x), so 8^x = 4^(x+1) means 3x = 2(x + 1).',
        ],
      },
      {
        h: 'Logarithms',
        list: [
          'log_b(x) = y means b^y = x. Example: log₂(32) = 5 because 2⁵ = 32.',
          'log(x) with no base means base 10. ln(x) means base e.',
          'Product rule: log(ab) = log a + log b. Quotient: log(a/b) = log a - log b. Power: log(aⁿ) = n log a.',
          'To solve e^(3x) = 12, take ln of both sides: 3x = ln 12, so x = (ln 12) / 3.',
        ],
      },
      {
        h: 'Growth and decay',
        list: [
          'Exponential growth: y = a(1 + r)^t. Decay: y = a(1 - r)^t.',
          'An exponential function has the variable in the exponent (3^t). A power function does not (t³).',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'If you see different bases that are powers of the same number (2, 4, 8, 16), convert everything to that base and set the exponents equal.',
          'For log questions, convert to exponential form first. It turns most of them into simple arithmetic.',
        ],
      },
    ],
    example: {
      prompt: 'If 4^(x+1) = 8^x, what is x?',
      choices: ['A. 1', 'B. 2', 'C. 3', 'D. 4'],
      answer: 'B',
      steps: [
        'Write both sides as powers of 2: 4^(x+1) = 2^(2x+2) and 8^x = 2^(3x).',
        'Set the exponents equal: 2x + 2 = 3x, so x = 2.',
        'Check: 4³ = 64 and 8² = 64.',
      ],
    },
    check: [
      { q: 'Simplify (x²)³ · x⁻⁴.', a: 'x⁶ · x⁻⁴ = x².' },
      { q: 'What is log₃(81)?', a: '4, because 3⁴ = 81.' },
      { q: 'Solve 10^x = 1000.', a: 'x = 3.' },
    ],
  },

  'Plane geometry': {
    summary:
      "Plane geometry covers angles, triangles, polygons, circles, area, perimeter, and volume. Most problems come down to a few facts: angle sums, special right triangles, similar triangles, and circle formulas, so draw the figure and label everything you know.",
    sections: [
      {
        h: 'Angles and triangles',
        list: [
          'A straight line is 180°. Vertical angles are equal. Parallel lines cut by a transversal make equal corresponding and alternate interior angles.',
          'Triangle angles sum to 180°. A polygon with n sides has interior angles summing to (n - 2) × 180°.',
          'Isosceles triangles have two equal sides opposite two equal angles.',
          'Pythagorean theorem: a² + b² = c². Common triples: 3-4-5, 5-12-13, 8-15-17, and their multiples.',
          'Special right triangles: 45-45-90 sides are x, x, x√2. 30-60-90 sides are x, x√3, 2x.',
          'Similar triangles have equal angles and proportional sides. Areas scale by the square of the side ratio, and volumes by the cube.',
        ],
      },
      {
        h: 'Circles',
        list: [
          'Area = πr². Circumference = 2πr.',
          'Arc length = (central angle / 360) × 2πr. Sector area = (central angle / 360) × πr².',
          'An inscribed angle is half the central angle that intercepts the same arc.',
          'A tangent line is perpendicular to the radius at the point of contact.',
          'A regular hexagon inscribed in a circle has sides equal to the radius.',
        ],
      },
      {
        h: 'Area and volume',
        list: [
          'Triangle: (1/2)bh. Trapezoid: (1/2)(b₁ + b₂)h. Rectangle: lw.',
          'Rectangular box: lwh. Cylinder: πr²h. Cone: (1/3)πr²h. Sphere: (4/3)πr³.',
          'Rising water problems: the volume of the object equals the volume of water displaced.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Draw and label the figure, even when one is given. Mark equal sides and right angles. Many hard questions are two easy steps: find a missing side, then use it in an area formula.',
          'Figures are not always drawn to scale, so do not estimate from the picture when the numbers can tell you the answer.',
        ],
      },
    ],
    example: {
      prompt: 'Triangle A has an area of 18 square inches. Triangle B is similar to Triangle A, with sides 3 times as long. What is the area of Triangle B?',
      choices: ['A. 54', 'B. 81', 'C. 108', 'D. 162'],
      answer: 'D',
      steps: [
        'When lengths scale by 3, areas scale by 3² = 9.',
        '18 × 9 = 162 square inches.',
        'A multiplies by 3, which is the most common trap. Area grows with the square of the scale factor.',
      ],
    },
    check: [
      { q: 'A 30-60-90 triangle has a short leg of 5. How long is the hypotenuse?', a: '10, which is twice the short leg.' },
      { q: 'What is the sum of the interior angles of a hexagon?', a: '(6 - 2) × 180 = 720°.' },
      { q: 'What is the area of a 90° sector of a circle with radius 4?', a: '(90/360) × 16π = 4π.' },
    ],
  },

  'Coordinate geometry': {
    summary:
      "Coordinate geometry puts shapes on the (x, y) plane: distance, midpoint, slope, equations of lines, and transformations of points. Draw a quick sketch, and use the formulas only after you know which one the question needs.",
    sections: [
      {
        h: 'Formulas',
        list: [
          'Midpoint: ((x₁ + x₂)/2, (y₁ + y₂)/2). To find a missing endpoint from the midpoint, double the midpoint and subtract the known endpoint.',
          'Distance: √((x₂ - x₁)² + (y₂ - y₁)²). It is the Pythagorean theorem on the grid.',
          'Slope: (y₂ - y₁)/(x₂ - x₁). Horizontal lines have slope 0. Vertical lines have undefined slope.',
          'Point-slope form: y - y₁ = m(x - x₁).',
        ],
      },
      {
        h: 'Transformations of points',
        list: [
          'Reflect over the x-axis: (x, y) → (x, -y). Over the y-axis: (x, y) → (-x, y). Over y = x: (x, y) → (y, x).',
          'Translate: add to x to move right and add to y to move up.',
          'Rotate 90° counterclockwise about the origin: (x, y) → (-y, x). Rotate 180°: (x, y) → (-x, -y).',
        ],
      },
      {
        h: 'Shapes on the grid',
        list: [
          'Area of a shape with horizontal and vertical sides: count units directly.',
          'Points a fixed distance from the origin lie on a circle: x² + y² = r².',
          'Counting intersections, like "points 5 units from the origin and 2 units from y = 0," is easiest with a quick sketch.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'A fast sketch catches sign errors. If the answer should be in the second quadrant, its x must be negative.',
          'Questions often combine steps, such as reflecting a figure and then finding its new area or a new vertex.',
        ],
      },
    ],
    example: {
      prompt: 'Point M(4, -1) is the midpoint of segment AB. If A is (1, 3), what are the coordinates of B?',
      choices: ['A. (2.5, 1)', 'B. (5, 2)', 'C. (7, -5)', 'D. (-2, 7)'],
      answer: 'C',
      steps: [
        'The midpoint is the average, so B = 2M - A.',
        'x: 2(4) - 1 = 7. y: 2(-1) - 3 = -5.',
        'B is (7, -5). A is the midpoint of A and M, a common slip.',
      ],
    },
    check: [
      { q: 'What is the distance between (1, 2) and (4, 6)?', a: '√(9 + 16) = 5.' },
      { q: 'Reflect (3, -2) over the y-axis.', a: '(-3, -2).' },
      { q: 'What is the slope of a line perpendicular to y = 4x - 1?', a: '-1/4.' },
    ],
  },

  'Conic sections': {
    summary:
      "Conic sections are circles, ellipses, parabolas, and hyperbolas written as equations. On the ACT you mostly need to read the center, radius, or axes from standard form, and sometimes complete the square to get there.",
    sections: [
      {
        h: 'Standard forms',
        list: [
          'Circle: (x - h)² + (y - k)² = r². Center (h, k), radius r. Watch the signs: (x + 2)² means h = -2.',
          'Ellipse: (x - h)²/a² + (y - k)²/b² = 1. Center (h, k), horizontal half-axis a, vertical half-axis b.',
          'Hyperbola: (x - h)²/a² - (y - k)²/b² = 1. Center (h, k). The asymptotes cross at the center.',
          'Parabola: y = a(x - h)² + k, vertex (h, k).',
        ],
      },
      {
        h: 'Completing the square',
        list: [
          'Group the x terms and the y terms. Take half the x coefficient, square it, and add it to both sides. Do the same for y.',
          'Example: x² + 6x + y² - 4y = 12 → (x + 3)² + (y - 2)² = 12 + 9 + 4 = 25. Center (-3, 2), radius 5.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Most questions ask for the center, the radius, or whether a point lies on the curve. Plug the point in to check.',
          'If an equation has an x² and a y² with the same positive coefficient, it is a circle. Different positive coefficients make an ellipse. A minus sign between them makes a hyperbola.',
          'Remember that the number on the right side of a circle equation is r², not r.',
        ],
      },
    ],
    example: {
      prompt: 'What is the radius of the circle x² + y² - 8x + 2y = 8?',
      choices: ['A. 2√2', 'B. 5', 'C. 8', 'D. 25'],
      answer: 'B',
      steps: [
        'Group and complete the square: (x² - 8x + 16) + (y² + 2y + 1) = 8 + 16 + 1.',
        'That gives (x - 4)² + (y + 1)² = 25.',
        'r² = 25, so r = 5. D is r², and A forgets the added constants.',
      ],
    },
    check: [
      { q: 'What is the center of (x + 1)² + (y - 7)² = 9?', a: '(-1, 7).' },
      { q: 'Is the point (3, 4) on x² + y² = 25?', a: 'Yes, since 9 + 16 = 25.' },
      { q: 'How can you tell an ellipse from a hyperbola in standard form?', a: 'An ellipse adds the two squared terms. A hyperbola subtracts them.' },
    ],
  },

  'Trigonometry and the unit circle': {
    summary:
      "Trig on the ACT starts with SOHCAHTOA in right triangles and extends to the unit circle, radians, graphs of sine and cosine, and the laws of sines and cosines. Know the special angle values and the identity sin²θ + cos²θ = 1, and most questions become quick.",
    sections: [
      {
        h: 'Right triangles',
        list: [
          'SOHCAHTOA: sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent.',
          'Given one ratio, draw the triangle, find the third side with the Pythagorean theorem, then read off any other ratio.',
          'Reciprocals: csc = 1/sin, sec = 1/cos, cot = 1/tan.',
          'sin²θ + cos²θ = 1, and tan θ = sin θ / cos θ.',
        ],
      },
      {
        h: 'The unit circle and radians',
        list: [
          'Radians = degrees × π/180. So 180° = π and 40° = 2π/9.',
          'On the unit circle, a point is (cos θ, sin θ).',
          'Special values: sin 30° = 1/2, sin 45° = √2/2, sin 60° = √3/2. Cosine reverses those.',
          'Signs by quadrant: all positive in I, sine positive in II, tangent positive in III, cosine positive in IV.',
        ],
      },
      {
        h: 'Graphs and other triangles',
        list: [
          'y = A sin(Bx + C) + D: amplitude |A|, period 2π/|B|, vertical shift D.',
          'Law of sines: a/sin A = b/sin B = c/sin C.',
          'Law of cosines: c² = a² + b² - 2ab cos C.',
          'Inverse trig: cos(arcsin(8/17)) means build a triangle with opposite 8 and hypotenuse 17, so the adjacent side is 15 and the answer is 15/17.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'The ACT often gives the law of sines or cosines in the question if it is needed, but you must know SOHCAHTOA and the special angles.',
          'For "which expression equals the height" questions, label opposite, adjacent, and hypotenuse relative to the given angle before choosing sin, cos, or tan.',
        ],
      },
    ],
    example: {
      prompt: 'In a right triangle, sin θ = 5/13 and θ is acute. What is tan θ?',
      choices: ['A. 5/12', 'B. 12/13', 'C. 12/5', 'D. 13/5'],
      answer: 'A',
      steps: [
        'sin = opposite/hypotenuse, so opposite = 5 and hypotenuse = 13.',
        'The adjacent side is √(169 - 25) = 12.',
        'tan θ = opposite/adjacent = 5/12. B is cos θ, and C flips the tangent.',
      ],
    },
    check: [
      { q: 'What is the period of y = 3 cos(2x)?', a: '2π/2 = π. The amplitude is 3.' },
      { q: 'Convert 135° to radians.', a: '135 × π/180 = 3π/4.' },
      { q: 'If cos θ = 0.6 and θ is acute, what is sin θ?', a: '0.8, since sin²θ = 1 - 0.36 = 0.64.' },
    ],
  },

  Statistics: {
    summary:
      "Statistics questions test mean, median, mode, range, standard deviation, and reading data from tables and graphs. Know how each measure responds to changes in the data, because the ACT often asks what happens when a value is added, removed, or changed.",
    sections: [
      {
        h: 'Measures of center and spread',
        list: [
          'Mean = sum / count. If you know the mean and the count, you know the sum, which unlocks most missing-value problems.',
          'Median: the middle value in sorted order. For an even count, average the two middle values.',
          'Mode: the most frequent value. Range: max minus min.',
          'Standard deviation measures spread from the mean. Data bunched together has a small SD. Adding the same number to every value does not change the SD.',
          'Outliers pull the mean much more than the median.',
        ],
      },
      {
        h: 'Frequency tables and weighted averages',
        list: [
          'In a frequency table, multiply each value by how often it appears before adding.',
          'Weighted average: (sum of value × weight) / (sum of weights).',
          'To find the median from a frequency table, count to the middle position.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Missing-score problems: "The mean of 5 tests is 80. What score on the 6th test makes the mean 82?" Total needed is 6 × 82 = 492, and the current total is 400, so 92.',
          '"Which dataset has the largest standard deviation" means "which values are farthest from their own mean." Compare spread, not size.',
          'Sampling questions ask whether a sample is random and represents the group the conclusion is about.',
        ],
      },
    ],
    example: {
      prompt: 'The mean of four numbers is 45. Three of the numbers are 26, 39, and 58. What is the fourth number?',
      choices: ['A. 41', 'B. 45', 'C. 57', 'D. 123'],
      answer: 'C',
      steps: [
        'The four numbers must sum to 4 × 45 = 180.',
        'The three known numbers sum to 26 + 39 + 58 = 123.',
        '180 - 123 = 57. D is the sum of the three known numbers.',
      ],
    },
    check: [
      { q: 'Find the median of 3, 9, 4, 12.', a: 'Sorted: 3, 4, 9, 12. Median = (4 + 9)/2 = 6.5.' },
      { q: 'Every value in a set increases by 10. What happens to the standard deviation?', a: 'Nothing. Shifting all values does not change the spread.' },
      { q: 'Which is more affected by an outlier, the mean or the median?', a: 'The mean.' },
    ],
  },

  'Probability and counting': {
    summary:
      "Probability is favorable outcomes over total outcomes, and counting tells you how many outcomes there are. Decide whether order matters and whether events are independent, then multiply or add accordingly.",
    sections: [
      {
        h: 'Probability',
        list: [
          'P(event) = favorable outcomes / total outcomes.',
          'P(not A) = 1 - P(A). "At least one" is often easiest as 1 - P(none).',
          'Independent events (and): multiply. P(A and B) = P(A) × P(B).',
          'Mutually exclusive events (or): add. P(A or B) = P(A) + P(B). If they can overlap, subtract the overlap.',
          'Without replacement, the second probability changes: drawing 2 red from 5 red and 5 blue is (5/10)(4/9).',
          'Two-way tables: for "given that" questions, the denominator is only the row or column you are given.',
          'Expected value = sum of (each value × its probability).',
        ],
      },
      {
        h: 'Counting',
        list: [
          'Fundamental counting principle: multiply the number of choices at each step.',
          'Permutations (order matters): nPr = n! / (n - r)!. Choosing a president and vice president from 10 people is 10 × 9 = 90.',
          'Combinations (order does not matter): nCr = n! / (r!(n - r)!). Choosing 2 committee members from 10 is 45.',
          'Venn diagrams: count each region once, and do not double count the overlap.',
          'Complements help with "at least one digit is a 5": total minus none.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Read for "given that," "without replacement," and "at least." Those words change the denominator or the method.',
          'Ask whether swapping two picks gives a different result. If yes, order matters.',
        ],
      },
    ],
    example: {
      prompt: 'A bag has 4 red and 6 blue marbles. Two marbles are drawn without replacement. What is the probability both are red?',
      choices: ['A. 4/25', 'B. 2/15', 'C. 1/5', 'D. 2/5'],
      answer: 'B',
      steps: [
        'First draw: 4/10 red.',
        'Without replacement, 3 red remain out of 9: 3/9.',
        '(4/10)(3/9) = 12/90 = 2/15. A assumes replacement: (4/10)².',
      ],
    },
    check: [
      { q: 'How many ways can 5 runners finish first, second, and third?', a: '5 × 4 × 3 = 60. Order matters.' },
      { q: 'How many 3-person teams can be chosen from 6 people?', a: '6C3 = 20.' },
      { q: 'P(rain) = 0.3. What is P(no rain)?', a: '0.7.' },
    ],
  },

  Matrices: {
    summary:
      "Matrix questions test addition, scalar multiplication, matrix multiplication, and sometimes determinants. The key rules are matching dimensions and the row-times-column method for multiplication.",
    sections: [
      {
        h: 'The rules',
        list: [
          'Dimensions are rows × columns. A 2 × 3 matrix has 2 rows and 3 columns.',
          'Add or subtract only matrices with the same dimensions, entry by entry.',
          'Scalar multiplication: multiply every entry by the number.',
          'Matrix multiplication AB works only if the columns of A equal the rows of B. The result has A\'s rows and B\'s columns.',
          'Each entry of AB is a row of A times a column of B: multiply matching entries and add.',
          'AB usually does not equal BA.',
          'The determinant of a 2 × 2 matrix with rows (a b) and (c d) is ad - bc. If it is 0, the matrix has no inverse.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Expect one matrix question per test at most, usually addition, scalar multiplication, or a product of small matrices. Your calculator can multiply matrices if you are comfortable entering them.',
          'Equation questions like "a times matrix equals matrix" mean matching entries one at a time: set each entry equal and solve.',
        ],
      },
    ],
    example: {
      prompt: 'What is the product [1 2] × [3; 4], where the second matrix is a column with entries 3 and 4?',
      choices: ['A. [3 8]', 'B. [11]', 'C. [4 6]', 'D. [10]'],
      answer: 'B',
      steps: [
        'A 1 × 2 matrix times a 2 × 1 matrix gives a 1 × 1 matrix.',
        'Row times column: 1(3) + 2(4) = 3 + 8 = 11.',
        'A multiplies entry by entry without adding, which is not matrix multiplication.',
      ],
    },
    check: [
      { q: 'Can a 2 × 3 matrix be multiplied by a 2 × 3 matrix?', a: 'No. The first matrix has 3 columns but the second has 2 rows.' },
      { q: 'What is the determinant of the matrix with rows (2 5) and (1 3)?', a: '2(3) - 5(1) = 1.' },
      { q: 'Multiply the matrix with rows (1 -2) and (0 4) by 3.', a: 'Rows (3 -6) and (0 12). Every entry is tripled.' },
    ],
  },

  'Complex numbers': {
    summary:
      "Complex numbers have the form a + bi, where i² = -1. Add and multiply them like binomials, replace i² with -1, and use the four-step cycle of powers of i.",
    sections: [
      {
        h: 'The rules',
        list: [
          'i = √(-1), so i² = -1.',
          'Powers of i repeat every 4: i, -1, -i, 1. For iⁿ, divide n by 4 and use the remainder. i²³ has remainder 3, so it equals -i.',
          'Add: combine real parts and imaginary parts. (3 + 2i) + (1 - 5i) = 4 - 3i.',
          'Multiply: FOIL, then replace i² with -1. (2 + i)(3 - i) = 6 - 2i + 3i - i² = 7 + i.',
          'Square roots of negatives: √(-16) = 4i. √(-3) · √(-12) = (i√3)(i√12) = i²(6) = -6, not 6.',
          'Conjugate of a + bi is a - bi, and (a + bi)(a - bi) = a² + b², a real number.',
          'To divide, multiply the top and bottom by the conjugate of the bottom.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Most questions are one FOIL away from the answer. The common trap is forgetting that i² is negative, which flips a sign.',
          'Quadratics with a negative discriminant have complex roots in the form a ± bi.',
        ],
      },
    ],
    example: {
      prompt: 'What is (7 + 4i)²?',
      choices: ['A. 33', 'B. 65', 'C. 49 + 16i', 'D. 33 + 56i'],
      answer: 'D',
      steps: [
        '(7 + 4i)² = 49 + 2(7)(4i) + (4i)² = 49 + 56i + 16i².',
        'i² = -1, so 16i² = -16.',
        '49 - 16 + 56i = 33 + 56i. C squares each term separately, and A drops the middle term.',
      ],
    },
    check: [
      { q: 'What is i⁴⁰?', a: '1, since 40 divided by 4 leaves remainder 0.' },
      { q: 'Simplify (3 - 2i)(3 + 2i).', a: '9 + 4 = 13.' },
      { q: 'What is √(-25)?', a: '5i.' },
    ],
  },

  Vectors: {
    summary:
      "A vector has a size (magnitude) and a direction, usually written in components like ⟨3, 4⟩ or 3i + 4j. Add vectors by adding components, and find magnitude with the Pythagorean theorem.",
    sections: [
      {
        h: 'The rules',
        list: [
          'Component form ⟨a, b⟩: a units horizontally and b units vertically.',
          'The vector from point P to point Q is Q minus P: from (1, 2) to (4, 6) is ⟨3, 4⟩.',
          'Magnitude: |⟨a, b⟩| = √(a² + b²). So |⟨3, 4⟩| = 5.',
          'Add or subtract component by component: ⟨1, 2⟩ + ⟨3, -5⟩ = ⟨4, -3⟩.',
          'Scalar multiplication scales each component: 2⟨1, 3⟩ = ⟨2, 6⟩.',
          'i and j notation: 3i + 4j means ⟨3, 4⟩.',
          'Components from magnitude and angle: ⟨r cos θ, r sin θ⟩.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Vectors are rare on the ACT. When they appear, they are usually a component addition or a magnitude question. Draw the arrows tip to tail if the setup is visual.',
        ],
      },
    ],
    example: {
      prompt: 'Vector u = ⟨2, -1⟩ and vector v = ⟨1, 5⟩. What is the magnitude of u + v?',
      choices: ['A. 3', 'B. 5', 'C. 7', 'D. √31'],
      answer: 'B',
      steps: [
        'u + v = ⟨2 + 1, -1 + 5⟩ = ⟨3, 4⟩.',
        'Magnitude: √(9 + 16) = 5.',
        'C adds the components (3 + 4) instead of using the Pythagorean theorem.',
      ],
    },
    check: [
      { q: 'What is the vector from (2, 3) to (5, -1)?', a: '⟨3, -4⟩.' },
      { q: 'What is the magnitude of ⟨5, 12⟩?', a: '13.' },
      { q: 'What is 3⟨2, -1⟩ - ⟨1, 1⟩?', a: '⟨6, -3⟩ - ⟨1, 1⟩ = ⟨5, -4⟩.' },
    ],
  },

  Sequences: {
    summary:
      "Arithmetic sequences add the same amount each step, and geometric sequences multiply by the same amount. Identify which kind you have, find the first term and the common difference or ratio, and use the nth-term formula.",
    sections: [
      {
        h: 'Arithmetic',
        list: [
          'Common difference d: subtract any term from the next.',
          'nth term: aₙ = a₁ + (n - 1)d. The 21st term of 3, 7, 11, ... is 3 + 20(4) = 83.',
          'Sum of the first n terms: n(a₁ + aₙ)/2.',
          'Linear growth problems (a raise of the same dollar amount each year) are arithmetic sequences.',
        ],
      },
      {
        h: 'Geometric',
        list: [
          'Common ratio r: divide any term by the previous one.',
          'nth term: aₙ = a₁ · r^(n - 1).',
          'Sum of an infinite geometric series, when |r| < 1: a₁ / (1 - r).',
          'Percent growth each year is geometric with r = 1 + rate.',
        ],
      },
      {
        h: 'Recursive and other sequences',
        list: [
          'A recursive rule defines each term from earlier ones: aₙ = aₙ₋₁ + (n - 1). Just compute term by term.',
          'Fibonacci-style sequences add the two previous terms.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Watch the off-by-one: the 10th term is 9 steps after the first, not 10.',
          'If the question asks for a far-off term, use the formula. If it asks for the 5th or 6th term, listing them may be faster and safer.',
        ],
      },
    ],
    example: {
      prompt: 'The first four terms of a geometric sequence are 3, -6, 12, -24. What is the 7th term?',
      choices: ['A. -192', 'B. 96', 'C. 192', 'D. -384'],
      answer: 'C',
      steps: [
        'The common ratio is -6/3 = -2.',
        'a₇ = 3 · (-2)⁶ = 3 · 64 = 192.',
        'The 7th term is 6 multiplications past the first term. D uses 7 multiplications, and A has the wrong sign.',
      ],
    },
    check: [
      { q: 'What is the 10th term of 5, 8, 11, ...?', a: '5 + 9(3) = 32.' },
      { q: 'What is the sum of the infinite series 8 + 4 + 2 + ...?', a: '8 / (1 - 1/2) = 16.' },
      { q: 'Is 2, 6, 18, 54 arithmetic or geometric?', a: 'Geometric, with ratio 3.' },
    ],
  },

  'Word problems and modeling': {
    summary:
      "Word problems test whether you can turn a situation into math: define variables, write equations, and interpret what a number or expression means in context. Slow down on the setup, because most misses come from answering a different question than the one asked.",
    sections: [
      {
        h: 'Setting up',
        list: [
          'Underline the final question before you start. Many wrong answers are the right value for a step along the way.',
          'Name variables with letters that remind you what they stand for (a for adults, s for students).',
          'Translate: "is" means =, "of" means ×, "per" means ÷, "more than" adds, "less than" subtracts in reverse order ("5 less than x" is x - 5).',
          'Rate × time = distance (or work). Combined rates add: if one pipe fills 1/3 of a tank per hour and another 1/6, together they fill 1/2 per hour.',
          'For mixtures and ratios, keep a table of amounts.',
        ],
      },
      {
        h: 'Interpreting models',
        list: [
          'In a linear model y = mx + b, m is the change per unit and b is the starting value.',
          'In y = a(1 + r)^t, a is the starting amount and r is the growth rate per period.',
          '"What does the 25 represent in C = 25h + 40?" The cost per hour, since it multiplies hours.',
        ],
      },
      {
        h: 'Backsolving',
        list: [
          'When answer choices are numbers and the setup is messy, plug the choices in. Start with a middle value so you know whether to go higher or lower.',
          'Picking numbers works for questions with variables in the answers: choose simple values, compute, and see which choice matches.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Check that your answer is reasonable and in the right units. A speed of 900 miles per hour for a cyclist means a setup error.',
        ],
      },
    ],
    example: {
      prompt: 'A gym charges a $40 sign-up fee plus $25 per month. Which expression gives the total cost, in dollars, for m months?',
      choices: ['A. 40m + 25', 'B. 25m + 40', 'C. 65m', 'D. 25(m + 40)'],
      answer: 'B',
      steps: [
        'The $25 repeats every month, so it multiplies m.',
        'The $40 is paid once, so it is added once.',
        'Total = 25m + 40. Check with m = 1: $65, which matches one month plus the fee.',
      ],
    },
    check: [
      { q: 'Translate "7 less than twice a number."', a: '2x - 7.' },
      { q: 'In C = 12t + 30, what does 30 represent?', a: 'The starting or fixed cost, when t = 0.' },
      { q: 'When is plugging in the answers a good idea?', a: 'When the choices are numbers and setting up the algebra is slow or confusing.' },
    ],
  },
};

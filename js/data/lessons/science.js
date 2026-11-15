// Science lessons. Original explanations and invented data (no official ACT text).

export default {
  'Data representation': {
    summary:
      "Data representation passages give tables and graphs with little text, and most questions ask you to read a value or a pattern straight from the figure. Find the right figure, the right variable, and the right units, and the answer is usually right there.",
    sections: [
      {
        h: 'The method',
        list: [
          'Skip the long introduction at first. Go to the question and note which table or figure it names.',
          'Read the figure\'s labels: what is on each axis or in each column, and the units.',
          'Put your finger on the exact row, column, or point the question asks about, then read across or up.',
          'If the question names a value not in the table, it is a trend question: estimate between or beyond the given values.',
        ],
      },
      {
        h: 'Common question types',
        list: [
          'Read a value: "According to Table 2, what was X when Y was 5?"',
          'Compare: "Which trial had the greatest...?"',
          'Combine two figures: use one figure to find a value, then look it up in the other.',
          'Simple calculations: differences, ratios, or "how many times as great." Estimate when the choices are far apart.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'Wrong figure: Table 1 and Table 2 often have similar labels.',
          'Wrong units or scales: a graph might use a log scale or units like mM vs. M.',
          'Reading the wrong line on a graph with several lines. Check the key.',
        ],
      },
    ],
    example: {
      prompt: 'Table 1 shows the average height of bean plants after 4 weeks: 0% compost: 18 cm; 25% compost: 26 cm; 50% compost: 31 cm; 75% compost: 29 cm. Based on Table 1, which compost level produced the tallest plants?',
      choices: ['A. 0%', 'B. 25%', 'C. 50%', 'D. 75%'],
      answer: 'C',
      steps: [
        'Read the heights column: 18, 26, 31, 29.',
        'The largest is 31 cm, at 50% compost.',
        'D is a trap if you assume "more compost is always better." The data rises and then falls.',
      ],
    },
    check: [
      { q: 'What do you read before any number in a figure?', a: 'The labels and units on the axes or column headers.' },
      { q: 'A question asks about a value between two table entries. What kind of question is it?', a: 'A trend question. Estimate between the two neighbors.' },
      { q: 'Do you need to read the whole passage introduction first?', a: 'Usually not. Go to the figure the question names.' },
    ],
  },

  'Research summaries': {
    summary:
      "Research summary passages describe one or more experiments and their results, and questions ask how the experiments were set up, how results compare across them, and what the results show. Track what changed from one experiment to the next, because that change is the point of each experiment.",
    sections: [
      {
        h: 'Reading the experiments',
        list: [
          'For each experiment, note in a few words: what was changed (independent variable), what was measured (dependent variable), and what was kept the same.',
          'Compare experiments: "Experiment 2 was like Experiment 1 except..." That exception is what Experiment 2 tests.',
          'Results are usually in a table or figure. Read them with the same care as a data representation passage.',
        ],
      },
      {
        h: 'Common question types',
        list: [
          'Setup: "How did Study 2 differ from Study 1?" or "Which variable was held constant?"',
          'Results: "In which trial was X greatest?"',
          'Supports or contradicts: "Do the results support the claim that...?" Check the claim against the actual data.',
          'Prediction: "If another trial were run at X, the result would most likely be..." Use the trend.',
          'Procedure details: "How many trials were performed?" Count carefully from the description and tables.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'Using results from the wrong experiment.',
          'Claiming a cause when only one variable was not actually controlled.',
          'Supports or contradicts questions where the data supports only part of the claim.',
        ],
      },
    ],
    example: {
      prompt: 'In Experiment 1, students measured how fast sugar dissolved in 100 mL of water at 20°C, 40°C, and 60°C, stirring each beaker for 30 seconds. In Experiment 2, they repeated the procedure at 40°C only, but varied stirring time: 0, 30, and 60 seconds. What was the independent variable in Experiment 2?',
      choices: ['A. Water temperature', 'B. Volume of water', 'C. Stirring time', 'D. Dissolving rate'],
      answer: 'C',
      steps: [
        'Experiment 2 kept temperature at 40°C and changed stirring time.',
        'The variable the experimenters change on purpose is the independent variable: stirring time.',
        'A was the independent variable in Experiment 1. D is what was measured, the dependent variable.',
      ],
    },
    check: [
      { q: 'What should you note for each experiment?', a: 'What changed, what was measured, and what was kept the same.' },
      { q: 'What does "Experiment 2 was the same as Experiment 1 except..." tell you?', a: 'The exception is the variable Experiment 2 tests.' },
      { q: 'What is the dependent variable?', a: 'What is measured as the result.' },
    ],
  },

  'Conflicting viewpoints': {
    summary:
      "Conflicting viewpoints passages present two or more scientists or students with different explanations for the same phenomenon, and questions ask what each believes, where they agree, and what evidence would support or weaken each view. Keep a one-line summary of each viewpoint and focus on how they differ.",
    sections: [
      {
        h: 'The method',
        list: [
          'Read the introduction carefully. It describes the phenomenon everyone agrees on.',
          'For each viewpoint, write one line: their main claim and their key reason.',
          'Note where they agree. Questions often ask what every viewpoint accepts.',
          'Answer questions about one viewpoint using only that viewpoint\'s text.',
          'Consider doing this passage last if you are short on time. It is reading-heavy and has few figures.',
        ],
      },
      {
        h: 'Common question types',
        list: [
          'What does Scientist 2 believe about X?',
          'Which scientists would agree that...? Check each viewpoint one at a time.',
          'Which finding would strengthen or weaken a viewpoint? Strengthen means it fits the claim. Weaken means it contradicts the claim or its reason.',
          'How do Student 1\'s and Student 3\'s explanations differ?',
          'Apply a viewpoint to a new case: use that viewpoint\'s logic even if you think it is wrong.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'Mixing up which scientist said what.',
          'Using your own outside knowledge to judge who is "right." The questions ask what each viewpoint says, not which is true.',
          'Assuming viewpoints disagree on everything. They usually share some facts.',
        ],
      },
    ],
    example: {
      prompt: 'Scientist 1 says a lake\'s fish population fell because warmer water holds less oxygen. Scientist 2 says it fell because a new dam blocked fish from reaching their spawning streams. Which finding would most weaken Scientist 2\'s view?',
      choices: [
        'A. The lake\'s water temperature rose by 3°C over the same period.',
        'B. Fish populations also fell in a nearby lake that has no dam.',
        'C. Fewer young fish were found in the spawning streams after the dam was built.',
        'D. The dam was built five years before the population began to fall.',
      ],
      answer: 'B',
      steps: [
        'Scientist 2 blames the dam. Evidence that the drop happened without a dam would weaken that explanation.',
        'B shows the same decline where no dam exists.',
        'A supports Scientist 1 but does not rule out the dam. C supports Scientist 2. D is unclear, since effects could lag behind the dam.',
      ],
    },
    check: [
      { q: 'What should you write for each viewpoint?', a: 'One line with its main claim and key reason.' },
      { q: 'Should you decide which scientist is correct?', a: 'No. Answer based on what each viewpoint says.' },
      { q: 'What kind of evidence weakens a viewpoint?', a: 'Evidence that contradicts its claim or the reason behind it.' },
    ],
  },

  'Graph reading': {
    summary:
      "Graph reading questions ask you to pull values and relationships from line graphs, bar graphs, and scatter plots. Check the axes, the scale, and the key, then trace from the axis to the line and over to the value.",
    sections: [
      {
        h: 'The method',
        list: [
          'Identify the variables: x-axis (usually what was changed) and y-axis (what was measured), with units.',
          'Check the scale. Gridlines may count by 2s, 5s, or 0.1s, and some axes do not start at zero.',
          'With multiple lines or bars, use the key to match each one to its condition.',
          'Trace with a straight edge (the side of your pencil or answer sheet) to avoid drifting to a neighboring line.',
        ],
      },
      {
        h: 'Relationships',
        list: [
          'Direct: as x increases, y increases. Inverse: as x increases, y decreases.',
          'Rate of change is the steepness. "Changed the most between" means the steepest segment.',
          'Where two lines cross, the two conditions have equal values.',
          'A linear region is a part of the graph you could approximate with a straight line.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'Reading the wrong line or the wrong axis on graphs with two y-axes.',
          'Misreading the scale or the units.',
          'Assuming a trend continues when the graph shows it leveling off.',
        ],
      },
    ],
    example: {
      prompt: 'A graph shows the temperature of a cup of tea over time: 90°C at 0 min, 70°C at 5 min, 58°C at 10 min, 50°C at 15 min. During which 5-minute interval did the temperature drop the most?',
      choices: ['A. 0 to 5 min', 'B. 5 to 10 min', 'C. 10 to 15 min', 'D. The drops were equal.'],
      answer: 'A',
      steps: [
        'Compute each drop: 90 to 70 is 20, 70 to 58 is 12, 58 to 50 is 8.',
        'The largest drop, 20°C, is from 0 to 5 min.',
        'The graph is steepest at the start and flattens, which matches cooling slowing down over time.',
      ],
    },
    check: [
      { q: 'What should you check on the axes besides the labels?', a: 'The scale and whether the axis starts at zero.' },
      { q: 'How can you tell where a quantity changed fastest?', a: 'The steepest part of the graph.' },
      { q: 'What does it mean when two lines cross?', a: 'The two conditions have the same value there.' },
    ],
  },

  'Trends and extrapolation': {
    summary:
      "Trend questions ask you to describe how one variable changes with another, and to predict values between the data points (interpolation) or beyond them (extrapolation). Find the pattern in the given data, then extend it the same way.",
    sections: [
      {
        h: 'Describing trends',
        list: [
          'Increases, decreases, increases then decreases, or stays constant. Check the whole range, not just two points.',
          'Look at every column or line the question mentions. A trend can differ between conditions.',
          'Answer choices like "increased only" vs. "increased, then decreased" hinge on one data point. Check each one.',
        ],
      },
      {
        h: 'Predicting values',
        list: [
          'Interpolation: the value must fall between its two neighbors in the table. If x = 25 is between 20 and 30, y is between their y-values.',
          'Extrapolation: continue the pattern past the last point. Note whether it rises steadily, speeds up, or levels off.',
          'Many prediction choices are ranges ("between 0.51 and 1.01"). Pick the range that brackets your estimate.',
          'Combining variables: "at 40°C and pH 7" means find the row or line that matches both.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'Assuming a straight-line trend when the data curves or levels off.',
          'Using the trend from the wrong condition or line.',
          'Choosing a range that is too narrow or on the wrong side of the data.',
        ],
      },
    ],
    example: {
      prompt: 'Table: Reaction time at different temperatures: 10°C: 80 s; 20°C: 40 s; 30°C: 20 s; 40°C: 10 s. Based on the trend, the reaction time at 50°C would most likely be:',
      choices: ['A. less than 10 s.', 'B. between 10 s and 20 s.', 'C. between 20 s and 40 s.', 'D. more than 80 s.'],
      answer: 'A',
      steps: [
        'Each 10°C increase halves the reaction time: 80, 40, 20, 10.',
        'Continuing the pattern, 50°C gives about 5 s.',
        'That is less than 10 s. B would mean the trend reversed, which nothing suggests.',
      ],
    },
    check: [
      { q: 'What is the difference between interpolation and extrapolation?', a: 'Interpolation estimates between data points. Extrapolation estimates beyond them.' },
      { q: 'An interpolated value at x = 15 must fall between which values?', a: 'The y-values at the nearest listed x-values on each side, such as 10 and 20.' },
      { q: 'What should you check before extending a trend?', a: 'Whether it is steady, speeding up, or leveling off.' },
    ],
  },

  'Experimental design': {
    summary:
      "Experimental design questions ask why an experiment was set up a certain way: which variables were controlled, what a control group is for, why a step was included, and how to improve or extend a test. Think like the scientist: every step exists to make the results fair and measurable.",
    sections: [
      {
        h: 'Key ideas',
        list: [
          'Independent variable: what the experimenter changes on purpose.',
          'Dependent variable: what is measured as the result.',
          'Controlled variables: everything kept the same so only the independent variable can explain differences.',
          'Control group or control sample: a baseline that does not get the treatment, used for comparison.',
          'Repeated trials and averaging reduce the effect of random error.',
          'More precise tools reduce measurement error. Pick the tool that measures the right quantity with the finest scale.',
        ],
      },
      {
        h: 'Common question types',
        list: [
          'Why did the scientists do step X? To keep a variable constant, to have a baseline, or to make a measurement possible.',
          'Which was held constant in Experiment 2 but not in Experiment 1?',
          'Which sample was the control?',
          'How should the experiment be changed to test a new question? Change only the variable of interest.',
          'What was the purpose of a piece of equipment? Read the procedure for what it measures or controls.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'Calling the measured result the independent variable.',
          'Proposing changes that alter more than one variable at once.',
          'Answers that sound scientific but do not address the specific step asked about.',
        ],
      },
    ],
    example: {
      prompt: 'Researchers tested whether a fertilizer increases tomato yield. They grew 10 plants with fertilizer and 10 plants without it, using the same soil, water, and sunlight for all 20. What was the purpose of the 10 plants without fertilizer?',
      choices: [
        'A. To increase the total yield of the experiment.',
        'B. To serve as a control for comparison.',
        'C. To test a different type of soil.',
        'D. To measure the amount of sunlight.',
      ],
      answer: 'B',
      steps: [
        'Without a group that gets no fertilizer, there is nothing to compare the fertilized plants to.',
        'Those plants are the control group: same conditions except the treatment.',
        'C is wrong because the soil was the same. A and D do not describe why the group exists.',
      ],
    },
    check: [
      { q: 'What is a controlled variable?', a: 'A condition kept the same in every trial so it cannot explain the results.' },
      { q: 'Why repeat trials?', a: 'To reduce the effect of random error and make the results more reliable.' },
      { q: 'How should you change an experiment to test one new factor?', a: 'Change only that factor and keep everything else the same.' },
    ],
  },

  'Outside knowledge': {
    summary:
      "A few ACT Science questions per test need basic science facts not given in the passage, usually from introductory biology, chemistry, physics, or earth science. You only need the fundamentals, so learn a short list of common facts and use them to eliminate choices.",
    sections: [
      {
        h: 'Facts worth knowing',
        list: [
          'Chemistry: pH below 7 is acidic, 7 is neutral, above 7 is basic. Water freezes at 0°C and boils at 100°C at 1 atm. A solution is a uniform mixture where particles are dissolved, not suspended. The number of protons defines the element, and most of an atom\'s mass is in its nucleus.',
          'Physics: speed = distance / time. Weight depends on gravity, but mass does not. Kinetic energy depends on mass and speed. Higher frequency light means higher energy and shorter wavelength.',
          'Biology: DNA is in the nucleus. Mitochondria release energy. Photosynthesis uses CO₂ and water to make sugar and O₂. Alleles are different versions of the same gene. Endotherms keep a steady body temperature internally, ectotherms rely on the environment.',
          'Earth and space: Earth\'s rotation makes day and night, and its tilt makes seasons. Greenhouse gases trap heat. Density = mass / volume, and less dense things float.',
          'Units: know metric prefixes (milli, centi, kilo, micro, nano) and that 1 mL = 1 cm³.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'These questions often look like the others but cannot be answered from the figures alone. If you cannot find the information anywhere, it is probably outside knowledge.',
          'The fact needed is usually basic. Use it to eliminate, then pick the remaining choice that also fits the passage.',
        ],
      },
    ],
    example: {
      prompt: 'A table lists solutions with pH values of 3.2, 6.8, 7.0, 8.5, and 11.1. How many of these solutions are basic?',
      choices: ['A. 1', 'B. 2', 'C. 3', 'D. 4'],
      answer: 'B',
      steps: [
        'Basic means a pH above 7. Exactly 7 is neutral.',
        'The basic solutions are 8.5 and 11.1.',
        'That is 2. C counts 7.0 as basic, which is the trap.',
      ],
    },
    check: [
      { q: 'Is a pH of 7 acidic, neutral, or basic?', a: 'Neutral.' },
      { q: 'At 1 atm, what is the boiling point of water in °C?', a: '100°C.' },
      { q: 'How can you tell a question needs outside knowledge?', a: 'The information is not in the passage or the figures anywhere.' },
    ],
  },
};

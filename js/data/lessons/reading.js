// Reading lessons. Original explanations and short invented passages (no official ACT text).

export default {
  'Main idea': {
    summary:
      "Main idea questions ask what a whole passage, or one paragraph, is mostly about. The right answer covers the entire scope, not one detail, and it matches the author's actual point, not just the topic.",
    sections: [
      {
        h: 'What the right answer looks like',
        list: [
          'It is as broad as the passage or paragraph in question, and no broader.',
          'It reflects the author\'s point or attitude, not just the subject. "Bees" is a topic. "Bee populations are declining for several connected reasons" is a main idea.',
          'It is often restated in the first or last paragraph, and in the first or last sentence of a body paragraph.',
        ],
      },
      {
        h: 'Wrong answer patterns',
        list: [
          'Too narrow: a true detail from one paragraph presented as the whole point.',
          'Too broad: a claim bigger than what the passage covers ("the history of all science").',
          'Right topic, wrong point: mentions the subject but misstates the author\'s view.',
          'Extreme language: "always," "completely," "proves," when the passage is measured.',
        ],
      },
      {
        h: 'The method',
        list: [
          'As you read, write a few words for the point of each paragraph. Two or three words is enough.',
          'Before looking at the choices, say the main idea in one sentence from your notes.',
          'Answer main idea questions last for each passage. By then you know the passage well.',
          'For a paragraph question, read only that paragraph again and check its first and last sentences.',
        ],
      },
    ],
    example: {
      prompt: 'Passage: "Most visitors to the coastal marsh see only mud and reeds. But the marsh filters runoff before it reaches the bay, shelters young fish, and absorbs storm surges that would otherwise flood nearby towns. Planners who once proposed draining it for housing now cite it as the region\'s cheapest flood defense." The main idea of this passage is that:',
      choices: [
        'A. the marsh is home to many kinds of young fish.',
        'B. the marsh provides important benefits that are easy to overlook.',
        'C. coastal towns should stop building new housing.',
        'D. all wetlands should be protected from development.',
      ],
      answer: 'B',
      steps: [
        'The passage moves from "people see only mud" to a list of hidden benefits to planners changing their minds.',
        'A is one detail (too narrow). C misstates a detail. D is too broad: the passage is about one marsh.',
        'B covers the whole passage: overlooked, but valuable.',
      ],
    },
    check: [
      { q: 'What makes a main idea answer "too narrow"?', a: 'It describes only one detail or one paragraph instead of the whole passage.' },
      { q: 'When should you answer main idea questions?', a: 'After the other questions on that passage, when you know it best.' },
      { q: 'What should you do before reading the choices?', a: 'Say the main idea in your own words from your paragraph notes.' },
    ],
  },

  Detail: {
    summary:
      "Detail questions ask what the passage directly states, usually signaled by \"according to the passage\" or a line reference. The answer is in the text, so find the exact lines and match them instead of relying on memory.",
    sections: [
      {
        h: 'The method',
        list: [
          'Find a keyword from the question (a name, number, or unusual term) and scan for it.',
          'Read a few lines before and after where it appears. The answer often sits in the sentence right after the keyword.',
          'Put the answer in your own words, then find the choice that matches. Expect a paraphrase, not the exact words.',
          'With a line reference, read the whole sentence it points to plus one before and one after.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'Recycled language: a choice that reuses exact words from the passage but changes the meaning.',
          'Right detail, wrong part of the passage: true elsewhere, but not what this question asks about.',
          'Half right: the first half matches and the second half adds something the passage never says.',
          'Memory answers: what seemed true on the first read. Always go back and check.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Detail questions are the most common type, and they reward going back to the text. If you miss them, it is usually because you answered from memory or read too few lines.',
          'Questions with "NOT" or "EXCEPT" ask for the one choice the passage does not support. Check each choice against the text and cross off the ones you find.',
        ],
      },
    ],
    example: {
      prompt: 'Passage: "The first glass greenhouse in the town was built in 1891 by a pharmacist, not a farmer. He needed a steady supply of medicinal herbs through the winter, and only later did neighbors begin renting space to grow vegetables." According to the passage, the greenhouse was originally built to:',
      choices: [
        'A. grow vegetables for the town\'s farmers.',
        'B. provide herbs for medicine during the winter.',
        'C. earn money by renting space to neighbors.',
        'D. test new methods of glass construction.',
      ],
      answer: 'B',
      steps: [
        'The keyword is "built." The next sentence gives the reason: a steady supply of medicinal herbs through the winter.',
        'A and C happened "only later." D is never mentioned.',
        'B paraphrases the reason given.',
      ],
    },
    check: [
      { q: 'What is the first step on a detail question?', a: 'Find a keyword and go back to the exact lines.' },
      { q: 'Why is a choice with the passage\'s exact words risky?', a: 'Recycled language often changes the meaning slightly.' },
      { q: 'How many lines should you read around a line reference?', a: 'The full sentence, plus one before and one after.' },
    ],
  },

  Inference: {
    summary:
      "Inference questions ask what the passage suggests or implies rather than states outright. The correct answer is a small, safe step from the text that must be true based on what is written, not a creative leap.",
    sections: [
      {
        h: 'What an ACT inference is',
        list: [
          'It is almost stated. You should be able to point to the line that proves it.',
          'It is the least extreme reasonable conclusion. If a choice needs an assumption the passage does not support, it is wrong.',
          'Signal words: suggests, implies, most likely, can reasonably be inferred, would most likely agree.',
          'Character questions ("the narrator most likely feels") rely on actions and word choice, not on what you would feel.',
        ],
      },
      {
        h: 'The method',
        list: [
          'Find the relevant lines, just like a detail question.',
          'Ask what must be true given these lines.',
          'Test each choice: can you underline the evidence for it? If not, cross it off.',
          'Prefer modest wording (some, may, often) over sweeping claims.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'Could be true but is not supported.',
          'Too extreme: "the author despises" when the passage shows mild doubt.',
          'Outside knowledge: true in real life but not in the passage.',
          'Reversed relationships: swapping cause and effect.',
        ],
      },
    ],
    example: {
      prompt: 'Passage: "When the new manager arrived, she rearranged the kitchen so the cooks no longer crossed paths at the stove. Within a month, the restaurant was serving twenty more tables each night, and the head cook stopped talking about quitting." It can reasonably be inferred that before the manager arrived, the kitchen:',
      choices: [
        'A. was the worst in the city.',
        'B. had a layout that slowed the cooks down.',
        'C. needed a larger stove.',
        'D. was about to close permanently.',
      ],
      answer: 'B',
      steps: [
        'The change was the layout, and the result was more tables served. That suggests the old layout slowed things down.',
        'A and D are extreme claims with no support. C is never mentioned.',
        'B is a small step directly supported by the text.',
      ],
    },
    check: [
      { q: 'How is an inference different from a guess?', a: 'You can point to the lines that support it.' },
      { q: 'Between "the author dislikes" and "the author has doubts about," which is safer when the tone is mild?', a: '"Has doubts about." Pick the least extreme choice the text supports.' },
      { q: 'Can you use outside knowledge?', a: 'No. Everything must come from the passage.' },
    ],
  },

  'Vocabulary in context': {
    summary:
      "These questions ask what a word or phrase \"most nearly means\" as it is used in a specific line. The answer depends on the sentence around it, and the most common meaning of the word is usually the trap.",
    sections: [
      {
        h: 'The method',
        list: [
          'Go to the line and read the whole sentence, plus one before it.',
          'Cover the word and think of your own word that fits the blank.',
          'Compare your word to the choices and pick the closest match.',
          'Plug your choice back into the sentence to confirm it reads naturally.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'The dictionary meaning that does not fit this sentence. If a common word like "sharp," "address," or "abandon" is being tested, the answer is probably a less common meaning.',
          'A word that is related to the topic but not to the specific meaning.',
          'For phrases or figurative language ("redraw the map"), decide whether it is literal or figurative from context.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'These are some of the fastest points on the Reading test if you go back to the line. Missing them usually means answering from the word alone.',
        ],
      },
    ],
    example: {
      prompt: 'Passage: "Rather than ignore the complaints, the mayor chose to address them at the next public meeting, answering each question in turn." As used here, "address" most nearly means:',
      choices: ['A. write on an envelope.', 'B. deal with.', 'C. give a formal speech to.', 'D. locate.'],
      answer: 'B',
      steps: [
        'Cover "address": "the mayor chose to ___ them... answering each question." A word like "respond to" fits.',
        'A is the common mail meaning. C is close but the mayor addressed the complaints, not an audience.',
        'B matches "respond to."',
      ],
    },
    check: [
      { q: 'What do you do before looking at the choices?', a: 'Cover the word and supply your own word from context.' },
      { q: 'Why is the most common meaning often wrong?', a: 'The ACT tests words used in a less common sense in that sentence.' },
      { q: 'How do you confirm your answer?', a: 'Plug it back into the sentence.' },
    ],
  },

  'Author purpose and tone': {
    summary:
      "Purpose questions ask why the author wrote the passage or included something, and tone questions ask for the author's attitude. Base both on the author's actual word choices, and pick moderate answers over extreme ones.",
    sections: [
      {
        h: 'Purpose',
        list: [
          'Purpose answers start with verbs: to explain, argue, describe, compare, challenge, recount, illustrate.',
          'Ask what the author is doing, not what the passage is about. Is it informing, persuading, telling a story, or criticizing a view?',
          'For narrative passages, the purpose is often to reveal a character, a relationship, or a change.',
        ],
      },
      {
        h: 'Tone',
        list: [
          'Look at loaded words: adjectives, adverbs, and verbs that carry feeling ("reckless," "remarkably," "insists").',
          'Most ACT authors are measured. Tones like "appreciative," "skeptical," "reflective," or "cautiously optimistic" are more common than "furious" or "ecstatic."',
          'Split the choice: an answer like "nostalgic but critical" must be fully right. If either half is wrong, eliminate it.',
          'Narrators can have a different attitude than characters. Track whose attitude the question asks about.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'Extreme tones for mild passages.',
          'Neutral answers for clearly opinionated passages, or opinionated answers for neutral ones.',
          'Purpose answers that describe a detail instead of the overall aim.',
        ],
      },
    ],
    example: {
      prompt: 'Passage: "The new transit plan promises faster commutes, and some of its ideas are genuinely clever. Still, its budget assumes ridership numbers the city has never come close to reaching, and no one has explained where the shortfall will be covered." The author\'s attitude toward the transit plan is best described as:',
      choices: ['A. enthusiastic support.', 'B. complete rejection.', 'C. qualified skepticism.', 'D. indifference.'],
      answer: 'C',
      steps: [
        'The author grants that some ideas are "genuinely clever," then raises a serious doubt about the budget.',
        'That is skepticism with a concession, which is "qualified skepticism."',
        'A ignores the doubt, B ignores the praise, and D ignores the clear opinion.',
      ],
    },
    check: [
      { q: 'What kind of word does a purpose answer usually start with?', a: 'A verb, like explain, argue, describe, or illustrate.' },
      { q: 'An author praises one part of an idea and doubts another. What kind of tone is that?', a: 'Mixed or qualified, such as "cautiously critical."' },
      { q: 'A choice has two tone words and one is wrong. Keep it?', a: 'No. Both halves must be right.' },
    ],
  },

  'Function of a part': {
    summary:
      "Function questions ask why a sentence, paragraph, quotation, or detail is there: what job it does in the passage. Look at what comes right before and after it, because its role is defined by how it connects to those parts.",
    sections: [
      {
        h: 'Common jobs',
        list: [
          'Introduce a topic or a claim.',
          'Give an example or evidence for a claim made nearby.',
          'Shift the focus: from past to present, from one view to another, from general to specific.',
          'Contrast, qualify, or concede a point.',
          'Conclude, sum up, or connect back to the opening.',
          'In narratives: reveal character, set the scene, or create tension.',
        ],
      },
      {
        h: 'The method',
        list: [
          'Reread the part plus the sentences around it.',
          'Ask what the paragraph would lose without it. That loss is its function.',
          'Name the job in a few words (gives an example, signals a shift), then find the choice that says that.',
          'For "the paragraph marks a shift from X to Y" questions, check both halves: what came before and what comes after.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'A choice that summarizes what the part says instead of what it does.',
          'A job that the nearby text does not set up, such as "refutes" when nothing is being refuted.',
          'The right job attached to the wrong claim.',
        ],
      },
    ],
    example: {
      prompt: 'Passage: "Many people assume that octopuses are solitary and simple. In one aquarium, however, an octopus learned to unscrew a jar from the inside after watching a keeper do it once. Observations like this have pushed researchers to rethink animal intelligence." The second sentence mainly serves to:',
      choices: [
        'A. describe how aquariums care for octopuses.',
        'B. provide an example that challenges a common assumption.',
        'C. explain why octopuses prefer to live alone.',
        'D. summarize the researchers\' final conclusions.',
      ],
      answer: 'B',
      steps: [
        'The first sentence states an assumption. The second, starting with "however," gives a case that cuts against it.',
        'Its job is to give a counterexample. That is B.',
        'A describes the setting, not the job. C and D are not what the sentence does.',
      ],
    },
    check: [
      { q: 'What question helps you find a part\'s function?', a: 'What would the passage lose without it?' },
      { q: 'What is the difference between what a sentence says and what it does?', a: 'What it says is its content. What it does is its role, like giving an example or making a shift.' },
      { q: 'Where should you look besides the part itself?', a: 'The sentences just before and after it.' },
    ],
  },

  'Comparing paired passages': {
    summary:
      "Paired passage questions ask how two short passages on a related topic agree, differ, or would respond to each other. Read and answer Passage A's questions first, then Passage B's, then the questions about both, so you only juggle both passages once.",
    sections: [
      {
        h: 'The method',
        list: [
          'Read Passage A and answer the questions about only A.',
          'Read Passage B and answer the questions about only B.',
          'Then do the "both passages" questions. Before them, write one line on each author\'s main point and attitude.',
          'Ask: what topic do they share? Where do they agree? Where do they differ in focus, tone, or opinion?',
        ],
      },
      {
        h: 'Question types',
        list: [
          'Both authors would agree: the answer must be supported by both passages, not just one.',
          'Main difference: often a difference in focus (one personal, one historical) or in attitude.',
          'How would author A respond to a claim in B: use A\'s stated views and stay modest.',
          'Shared element or element only in one: check each passage for it.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'A choice true for only one passage, on a "both" question.',
          'Choices that swap which passage said what.',
          'Exaggerated disagreement when the passages simply focus on different things.',
        ],
      },
    ],
    example: {
      prompt: 'Passage A describes a scientist\'s excitement about a new solar panel design that doubles efficiency in lab tests. Passage B, by an engineer, notes that most lab breakthroughs in solar power take a decade to reach homes because of manufacturing costs. Both authors would most likely agree that:',
      choices: [
        'A. the new design will be in homes within a year.',
        'B. improving solar technology is worth pursuing.',
        'C. lab tests are unreliable.',
        'D. manufacturing costs make solar power impossible.',
      ],
      answer: 'B',
      steps: [
        'A is excited about progress. B is cautious about timing but still discusses breakthroughs as real progress.',
        'A contradicts Passage B. C is not said by either. D is too extreme even for B.',
        'B is the modest point both support.',
      ],
    },
    check: [
      { q: 'In what order should you handle paired passages?', a: 'A questions, then B questions, then questions about both.' },
      { q: 'On a "both would agree" question, what must be true of the answer?', a: 'Both passages must support it.' },
      { q: 'What should you write before the "both" questions?', a: 'One line on each author\'s main point and attitude.' },
    ],
  },

  'Data or graphs in reading': {
    summary:
      "Some enhanced ACT Reading passages include a table, chart, or graph, and questions ask what the data shows or whether it supports a claim in the passage. Read the labels and units first, then match exactly what the question asks to the right row, column, or bar.",
    sections: [
      {
        h: 'Reading the visual',
        list: [
          'Start with the title, axis labels, column headers, and units. Know what each number measures before using it.',
          'Find the exact row and column the question names. Many misses are reading the neighboring row.',
          'For comparisons ("most different," "greatest increase"), compute the differences rather than eyeballing.',
        ],
      },
      {
        h: 'Data and the passage together',
        list: [
          '"Does the table support the claim in lines X to Y?" Find the claim, restate it as something measurable, then check the data.',
          'The correct answer gives an accurate reason tied to the actual numbers. Two choices will say yes and two will say no, and the reason decides it.',
          'The data may support only part of a claim. Read the claim\'s exact scope.',
          'Questions about the visual\'s purpose ("one main function of the table is to...") ask what it adds to the passage\'s argument.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'Answers that cite real numbers from the wrong row or column.',
          'Reasons that go beyond what the data measures.',
          'Confusing correlation in the data with a cause the passage never establishes.',
        ],
      },
    ],
    example: {
      prompt: 'A passage claims that a spider\'s silk "stretches farther than steel before breaking." A table lists how far each material stretches before breaking: steel 1%, silkworm silk 18%, spider silk 30%. Does the table support the passage\'s claim?',
      choices: [
        'A. Yes, because spider silk stretches 30% while steel stretches only 1%.',
        'B. Yes, because silkworm silk stretches more than steel.',
        'C. No, because steel is stronger than spider silk.',
        'D. No, because the table does not include steel.',
      ],
      answer: 'A',
      steps: [
        'The claim compares how far spider silk and steel stretch.',
        'The table shows 30% for spider silk and 1% for steel, so yes.',
        'B is true but compares the wrong material. C brings in strength, which the table does not measure. D is false.',
      ],
    },
    check: [
      { q: 'What should you read first on any graph or table?', a: 'The title, labels, headers, and units.' },
      { q: 'On a "does the data support" question, what decides between the two "yes" choices?', a: 'Which reason accurately cites the right data.' },
      { q: 'What is the most common data-reading slip?', a: 'Reading the wrong row, column, or bar.' },
    ],
  },
};

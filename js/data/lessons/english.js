// English lessons. Original explanations and examples (no official ACT text).
// In examples, [[...]] marks the underlined part. A dash is shown as "–" (UI copy avoids the em dash).

export default {
  Commas: {
    summary:
      "Commas set off extra information, separate items, and follow introductory pieces, but they can never join two complete sentences by themselves. The ACT tests unnecessary commas far more often than missing ones, so when in doubt, fewer is usually right.",
    sections: [
      {
        h: 'The rules that matter',
        list: [
          'Nonessential information gets a comma on both sides. Test it: if you can delete the phrase and the sentence still makes sense and means the same thing, it is extra and needs the pair of commas.',
          'Essential information gets no commas. "The student who studied passed" needs "who studied" to say which student.',
          'An introductory phrase or dependent clause gets one comma after it: "After the storm passed, we walked home."',
          'Items in a list of three or more get commas between them, and the ACT includes the comma before "and."',
          'Two complete sentences can be joined by a comma only with a FANBOYS word (for, and, nor, but, or, yet, so).',
          'Two adjectives get a comma between them only if "and" would fit there: "a cold, dark night" but "a bright red car."',
        ],
      },
      {
        h: 'Where commas never go',
        list: [
          'Between a subject and its verb: "The results of the survey, were clear" is wrong.',
          'Between a verb and its object, or a preposition and its object.',
          'Right before or after a single word or short phrase that is essential, like a short name: "the author Toni Morrison" has no commas because it says which author.',
          'Before "that" introducing an essential clause.',
          'After a FANBOYS word that starts the second clause ("but, the" is wrong).',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Most comma questions show the same words with commas in different places. Read the sentence once with no commas at all. Add a comma only where a rule above demands it. Answers that sprinkle in extra commas to "add a pause" are almost always wrong, because pauses are not a rule.',
          'A favorite trap is a nonessential phrase with only one comma: "My brother, a pilot flies to Denver." Commas around extra information come in pairs, unless the phrase starts or ends the sentence.',
        ],
      },
    ],
    example: {
      prompt: 'The bridge [[which was built in 1932, still carries]] more than ten thousand cars each day.',
      choices: ['A. No Change', 'B. which was built in 1932 still carries', 'C. , which was built in 1932, still carries', 'D. , which was built in 1932 still carries'],
      answer: 'C',
      steps: [
        '"Which was built in 1932" is extra: delete it and you still know which bridge we mean.',
        'Extra information needs a comma on both sides, so we need a comma before "which" and after "1932."',
        'A has only the closing comma, B has none, and D has only the opening comma. Only C has the pair.',
      ],
    },
    check: [
      { q: 'Can a comma alone join "The rain stopped" and "the game resumed"?', a: 'No. That is a comma splice. Add a FANBOYS word ("The rain stopped, and the game resumed") or use a period or semicolon.' },
      { q: 'Does "My friend Ana" need commas around Ana?', a: 'Only if you have one friend. If the name tells which friend, it is essential and takes no commas.' },
      { q: 'What is the quick test for an extra phrase?', a: 'Delete it. If the sentence still works and means the same thing, it is nonessential and gets a pair of commas.' },
    ],
  },

  'Semicolons and colons': {
    summary:
      "A semicolon works exactly like a period: it needs a complete sentence on both sides. A colon needs a complete sentence before it, and what follows explains, lists, or names something the first part set up.",
    sections: [
      {
        h: 'Semicolons',
        list: [
          'Use a semicolon only where a period would also be correct. Both sides must be able to stand alone as sentences.',
          'A transition like "however," "therefore," or "for example" after a semicolon is fine, and it takes a comma after it: "We left early; however, we missed the bus."',
          'A semicolon can also separate list items that already contain commas, but the ACT rarely tests this.',
          'Never use a semicolon before a dependent clause or a phrase: "We stayed inside; because it rained" is wrong.',
        ],
      },
      {
        h: 'Colons',
        list: [
          'The part before the colon must be a complete sentence. "My favorite foods are: pizza and tacos" is wrong because "My favorite foods are" is not complete.',
          'What comes after can be a list, a single word, a phrase, or a full sentence, as long as it explains or delivers what the first part promised.',
          'Never put a colon right after a verb or a preposition, or after "such as," "including," or "for example."',
          'Use only one colon per sentence.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'If two answer choices differ only by a period versus a semicolon, they are equally right, so neither is the answer. Look for the choice that changes the meaning or the structure instead.',
          'For any semicolon or colon, cover what comes after it and ask if the first part is a full sentence. For a semicolon, also check the second part.',
        ],
      },
    ],
    example: {
      prompt: 'For the cake, the recipe [[calls for: flour,]] sugar, eggs, and butter.',
      choices: ['A. No Change', 'B. calls for flour,', 'C. calls for; flour,', 'D. calls, for flour,'],
      answer: 'B',
      steps: [
        'Cover everything after the colon. "For the cake, the recipe calls for" is not a complete sentence, so a colon cannot go there.',
        'A semicolon (C) needs complete sentences on both sides, and a list is not one. D splits the verb from its preposition.',
        'With no punctuation (B), the verb flows straight into its list. If you wanted a colon, you would need a complete sentence first: "the recipe calls for four ingredients: flour, sugar..."',
      ],
    },
    check: [
      { q: 'What is the period test for a semicolon?', a: 'If a period would work in the same spot, a semicolon works. If not, the semicolon is wrong.' },
      { q: 'Is "She packed three things: a map, a flashlight, and water" correct?', a: 'Yes. "She packed three things" is a complete sentence and the list delivers the three things.' },
      { q: 'Is "The recipe includes: flour and sugar" correct?', a: 'No. "The recipe includes" is not a complete sentence, so no colon. Remove it.' },
    ],
  },

  'Dashes and parentheses': {
    summary:
      "Dashes and parentheses set off extra information, just like a pair of commas, and a dash can also work like a colon to introduce an explanation. The key rule is consistency: whatever mark opens the extra information must also close it.",
    sections: [
      {
        h: 'The rules',
        list: [
          'Pairs must match. Open with a dash, close with a dash. Open with a parenthesis, close with one. Never open with a comma and close with a dash.',
          'The sentence must still work if you delete everything between the pair.',
          'A single dash can introduce an explanation or a list at the end of a sentence, the same way a colon would. The part before it must be a complete sentence.',
          'Do not put a comma right before an opening dash or parenthesis.',
          'Punctuation that belongs to the main sentence goes after a closing parenthesis: "We left (finally), and it rained."',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Most of these questions are really "find the matching mark" questions. Look back in the sentence for an opening dash, comma, or parenthesis, and make the closing mark match it.',
          'When dashes and commas would both be correct for an aside, the ACT will not make you choose between them. It will make one of them break the pairing rule.',
        ],
      },
    ],
    example: {
      prompt: 'The old lighthouse, a landmark since the 1800s [[– now houses]] a small museum.',
      choices: ['A. No Change', 'B. , now houses', 'C. now houses', 'D. ; now houses'],
      answer: 'B',
      steps: [
        'The aside "a landmark since the 1800s" opens with a comma.',
        'An aside must close with the same mark it opened with, so it needs a closing comma.',
        'A mixes a comma with a dash, C leaves the aside open, and D puts a semicolon where no complete sentence comes before it. B closes the pair with a comma.',
      ],
    },
    check: [
      { q: 'An aside opens with a dash. What must close it?', a: 'Another dash, unless the aside runs to the end of the sentence.' },
      { q: 'Can a single dash replace a colon?', a: 'Yes, when it introduces an explanation after a complete sentence: "She had one goal – finish first."' },
      { q: 'How do you check that the aside is placed correctly?', a: 'Delete everything between the pair. What is left must still be a correct sentence.' },
    ],
  },

  Apostrophes: {
    summary:
      "Apostrophes show possession or mark a contraction, and they never make a word plural. The most tested pairs are its versus it's, their versus they're, and whose versus who's, where the possessive pronoun never has an apostrophe.",
    sections: [
      {
        h: 'Possession',
        list: [
          "Singular owner: add 's. The dog's bowl, the class's project.",
          "Plural owner ending in s: add only the apostrophe. The dogs' bowls, the students' grades.",
          "Plural owner not ending in s: add 's. The children's books, the women's team.",
          'Decide the owner first, then decide where the apostrophe goes. Ask: one owner or many?',
        ],
      },
      {
        h: 'Pronouns and contractions',
        list: [
          "Possessive pronouns never have apostrophes: its, their, whose, yours, ours, hers.",
          "it's = it is or it has. they're = they are. who's = who is or who has. you're = you are.",
          "Test by expanding: if \"it is\" or \"it has\" fits, use it's. Otherwise use its.",
          "There is a place or a sentence starter. Their is possessive. They're is they are.",
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          "Expect choices that differ only in apostrophes, sometimes on two words at once, like \"the team's coaches\" versus \"the teams' coaches'.\" Handle one word at a time: is it owning something, and is the owner singular or plural?",
          "A plain plural with no ownership never gets an apostrophe. \"The 1990's\" and \"three book's\" are wrong.",
        ],
      },
    ],
    example: {
      prompt: 'After the storm, the [[neighbors cleared their]] driveways together.',
      choices: ["A. No Change", "B. neighbor's cleared they're", "C. neighbors' cleared their", "D. neighbors cleared there"],
      answer: 'A',
      steps: [
        '"Neighbors" is doing the clearing, not owning anything, so it is a plain plural with no apostrophe.',
        'The driveways belong to them, so we need the possessive pronoun "their," which has no apostrophe.',
        'B uses a possessive and "they are." C makes "neighbors" possessive for no reason. D uses the place word "there." A is correct.',
      ],
    },
    check: [
      { q: 'The tail belongs to the dog. Its tail or it\'s tail?', a: "Its tail. It is tail makes no sense, so no apostrophe." },
      { q: 'Books owned by several authors: authors\' books or author\'s books?', a: "The authors' books. Plural owner ending in s gets just the apostrophe." },
      { q: 'Does "whose" or "who\'s" fit: "The girl ___ bike was stolen"?', a: 'Whose. It shows possession. "Who is bike" makes no sense.' },
    ],
  },

  'Sentence boundaries': {
    summary:
      "Every sentence needs at least one complete, independent clause, and two independent clauses need the right link between them. Fragments are missing a subject or main verb, and run-ons or comma splices jam two sentences together without a period, semicolon, or comma plus FANBOYS.",
    sections: [
      {
        h: 'Independent vs. dependent',
        list: [
          'An independent clause has a subject and a main verb and can stand alone: "The tide rose."',
          'A dependent clause starts with a word like because, although, when, since, if, while, which, or who, and cannot stand alone: "Because the tide rose."',
          'An -ing verb by itself is not a main verb. "The tide rising quickly" is a fragment.',
        ],
      },
      {
        h: 'The legal ways to join two independent clauses',
        list: [
          'Period: The tide rose. We moved the towels.',
          'Semicolon: The tide rose; we moved the towels.',
          'Comma plus FANBOYS: The tide rose, so we moved the towels.',
          'Make one dependent: Because the tide rose, we moved the towels.',
          'Colon or dash, when the second explains the first.',
          'Never a comma alone, and never nothing at all.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Find each subject and verb pair, then count independent clauses. One independent clause needs no link. Two need one of the legal links above.',
          'Words like however, therefore, and moreover are not FANBOYS. "It rained, however we played" is a comma splice. It needs a semicolon before "however."',
          'Watch for answers that fix a splice by turning the sentence into a fragment, like changing "it was" to "being."',
        ],
      },
    ],
    example: {
      prompt: 'The trail was steep and [[rocky, most hikers]] turned back before the summit.',
      choices: ['A. No Change', 'B. rocky most hikers', 'C. rocky; most hikers', 'D. rocky, however, most hikers'],
      answer: 'C',
      steps: [
        '"The trail was steep and rocky" is a complete sentence. "Most hikers turned back before the summit" is also complete.',
        'Two complete sentences joined by a comma alone is a comma splice (A). No punctuation at all is a run-on (B).',
        'D still splices, because "however" is not a FANBOYS word. The semicolon in C correctly joins two complete sentences.',
      ],
    },
    check: [
      { q: 'Is "Although the test was hard." a sentence?', a: 'No. "Although" makes it dependent, so it is a fragment.' },
      { q: 'Name three correct ways to join two complete sentences.', a: 'A period, a semicolon, or a comma plus a FANBOYS word. Making one clause dependent also works.' },
      { q: 'Is "It was late, therefore we left" correct?', a: 'No. "Therefore" is not a FANBOYS word. Use "It was late; therefore, we left."' },
    ],
  },

  'Subject-verb agreement': {
    summary:
      "A verb must match its subject in number: singular subjects take singular verbs and plural subjects take plural verbs. The ACT hides the real subject behind long phrases, so find the subject before you look at the verb.",
    sections: [
      {
        h: 'Finding the true subject',
        list: [
          'Cross out prepositional phrases (of, in, on, with, from...). The subject is never inside one. "The box of old letters [is] in the attic."',
          'Cross out asides set off by commas, dashes, or parentheses.',
          'Phrases like "along with," "as well as," and "together with" do not make a subject plural: "The coach, along with the players, is here."',
          'In "there is / there are" sentences and inverted sentences, the subject comes after the verb: "There are three reasons."',
        ],
      },
      {
        h: 'Tricky subjects',
        list: [
          'Each, every, either, neither, everyone, anybody, nobody: singular.',
          'Two subjects joined by "and" are plural. With "or" or "nor," match the verb to the closer subject.',
          'Collective nouns like team, family, committee, and jury are usually singular.',
          'A gerund subject is singular: "Running long distances builds endurance."',
          'In a "who/that/which" clause, the verb matches the noun the pronoun refers to: "one of the students who are..." refers to students.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'When the choices show is/are, has/have, or a verb with and without an s, it is an agreement question. Strip the sentence down to subject plus verb and read just those two words together.',
          'Do not match the verb to the nearest noun. That nearest noun is usually the trap.',
        ],
      },
    ],
    example: {
      prompt: 'The collection of rare stamps that my grandparents gathered over forty years [[are]] now on display.',
      choices: ['A. No Change', 'B. is', 'C. were', 'D. have been'],
      answer: 'B',
      steps: [
        'Cross out "of rare stamps" and "that my grandparents gathered over forty years."',
        'The subject is "collection," which is singular.',
        '"Collection is on display." A, C, and D are plural verbs that match "stamps" or "grandparents," the traps.',
      ],
    },
    check: [
      { q: 'Subject of: "The list of chores on the fridge ___ long"?', a: '"List," so the verb is "is."' },
      { q: '"Neither the cat nor the dogs ___ hungry." Is or are?', a: 'Are. With "nor," match the closer subject, "dogs."' },
      { q: 'Does "as well as" make a subject plural?', a: 'No. "The teacher, as well as her students, is late."' },
    ],
  },

  'Pronoun agreement and case': {
    summary:
      "A pronoun must match the noun it replaces in number and person, and it must clearly refer to one specific noun. It also has to be in the right case: subject forms (I, he, she, we, they, who) do the action, and object forms (me, him, her, us, them, whom) receive it.",
    sections: [
      {
        h: 'Agreement and clarity',
        list: [
          'Singular nouns take singular pronouns: "The company released its report," not "their report."',
          'Collective nouns (team, school, committee) are usually singular: "its."',
          'A pronoun needs one clear antecedent. If "it," "they," or "this" could mean two things, the answer that names the noun is better.',
          'Stay consistent with person. Do not switch from "one" to "you" or from "students" to "we" mid-passage.',
        ],
      },
      {
        h: 'Case',
        list: [
          'Subject case: I, he, she, we, they, who. Object case: me, him, her, us, them, whom.',
          'In pairs, drop the other person: "Mia and (I/me) left" becomes "I left." "Between you and me" because "between" takes an object.',
          'Who vs. whom: answer the question with he or him. If "he" fits, use who. If "him" fits, use whom. ("Whom did you call?" "I called him.")',
          'After "than" or "as," finish the thought: "She is taller than I (am)."',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'When choices swap its/their, who/whom/which, or he/him, identify the noun the pronoun stands for or what the pronoun is doing in its clause.',
          '"Which" refers to things, "who" to people, "that" to either in essential clauses. "Where" only refers to places, not to situations or time.',
        ],
      },
    ],
    example: {
      prompt: 'After months of debate, the city council finally published [[their]] plan for the new park.',
      choices: ['A. No Change', 'B. its', "C. it's", "D. they're"],
      answer: 'B',
      steps: [
        'The pronoun stands for "the city council," one group acting as a unit, so it is singular.',
        'A is plural. C means "it is" and D means "they are."',
        'B is the singular possessive with no apostrophe.',
      ],
    },
    check: [
      { q: '"The coach gave the trophy to Ben and (I/me)." Which?', a: 'Me. Drop "Ben and": "gave the trophy to me."' },
      { q: '"The scientist (who/whom) won the prize spoke." Which?', a: 'Who. "She won the prize," so it is the subject form.' },
      { q: 'What is wrong with "The city council changed their rules"?', a: '"Council" is singular, so it should be "its rules."' },
    ],
  },

  'Verb tense': {
    summary:
      "Verb tense shows when something happens, and the right tense is set by the time clues around the sentence. Keep tenses consistent within a passage unless the timeline actually changes, and use correct forms for past participles.",
    sections: [
      {
        h: 'Reading the timeline',
        list: [
          'Find time clues: dates, "last year," "currently," "by then," and the tense of nearby verbs.',
          'If the passage is in past tense, stay in past tense unless something is still true now.',
          'Present perfect (has/have walked) connects the past to now: "She has lived here since 2015."',
          'Past perfect (had walked) shows an action finished before another past action: "By the time we arrived, the show had started."',
          'Would/could/might for conditions: "If it rained, we would stay inside."',
        ],
      },
      {
        h: 'Forms that trip people up',
        list: [
          'Past participle after has/have/had: "had gone," not "had went." "Has swum," "had written," "have begun," "had drunk."',
          'Past vs. past participle: went/gone, ran/run, swam/swum, saw/seen, began/begun.',
          '"Could have," "should have," "would have," never "could of."',
          'Lie (rest) vs. lay (put): "I lie down," "I lay the book down." Past of lie is lay, which is why it is confusing.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'If the choices are the same verb in different tenses, look at the verbs in the sentences around it. The answer almost always matches the surrounding tense.',
          'If two choices are in the same tense and only one uses a correct form, the form is the point.',
        ],
      },
    ],
    example: {
      prompt: 'By the time the rescue team reached the cabin, the snow [[covers]] the road completely.',
      choices: ['A. No Change', 'B. had covered', 'C. will cover', 'D. has covered'],
      answer: 'B',
      steps: [
        '"Reached" is past tense, and the covering happened before the team reached the cabin.',
        'An action finished before another past action takes past perfect: "had covered."',
        'A is present, C is future, and D connects to the present. Only B fits the timeline.',
      ],
    },
    check: [
      { q: '"She should of called." What is wrong?', a: 'It should be "should have called."' },
      { q: 'Which shows an action finished before another past action: "has finished" or "had finished"?', a: '"Had finished," the past perfect.' },
      { q: 'How do you choose a tense when nothing in the sentence shows time?', a: 'Match the tense of the verbs in the surrounding sentences.' },
    ],
  },

  Modifiers: {
    summary:
      "A modifier must sit right next to the word it describes, and an opening descriptive phrase must be followed immediately by the person or thing doing it. Misplaced and dangling modifiers make sentences say something absurd, and the ACT rewards the choice that puts the right noun in the right spot.",
    sections: [
      {
        h: 'The rules',
        list: [
          'Dangling modifier: an opening phrase with no doer, or the wrong doer, right after the comma. "Walking to school, the rain started" says the rain walked.',
          'Fix: put the doer right after the comma. "Walking to school, I got caught in the rain."',
          'Misplaced modifier: a phrase too far from what it describes. "She served sandwiches to the kids on paper plates" puts the kids on plates.',
          'Limiting words (only, just, almost, nearly) go right before what they limit. "I only ate two" vs. "I ate only two."',
          'Adjectives describe nouns. Adverbs (often ending in -ly) describe verbs, adjectives, and other adverbs: "She ran quickly," "a really good idea." After linking verbs (feel, seem, look, taste) use an adjective: "I feel bad."',
          'Comparatives (-er, more) for two things. Superlatives (-est, most) for three or more. Never "more better."',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'When a sentence starts with an -ing phrase, a past participle phrase, or a description like "A former teacher," ask: who or what is doing this? That noun must come right after the comma.',
          'The answer choices often rearrange the main clause. Pick the one that starts with the doer, even if it seems wordier.',
        ],
      },
    ],
    example: {
      prompt: 'Exhausted after the long flight, [[the hotel bed looked]] wonderful to Marcus.',
      choices: ['A. No Change', 'B. the hotel bed, to Marcus, looked', 'C. Marcus thought the hotel bed looked', 'D. the hotel bed was looking'],
      answer: 'C',
      steps: [
        'Who was exhausted after the flight? Marcus, not the bed.',
        'The doer must come right after the opening phrase, so the main clause must start with "Marcus."',
        'Only C does that. A, B, and D all say the bed was exhausted.',
      ],
    },
    check: [
      { q: 'What is wrong with "Covered in mud, Mom washed the dog"?', a: 'It says Mom was covered in mud. Better: "Mom washed the dog, which was covered in mud."' },
      { q: '"She almost read the whole book" vs. "She read almost the whole book." Which means she read most of it?', a: 'The second. "Almost" limits "the whole book."' },
      { q: 'Feel bad or feel badly, when you are sad?', a: 'Feel bad. "Feel" is a linking verb, so it takes an adjective.' },
    ],
  },

  Parallelism: {
    summary:
      "Items in a list, a comparison, or a paired construction must use the same grammatical form, so if the first item is an -ing verb, the others are too. When you compare two things, they must be the same kind of thing, like an essay to an essay rather than an essay to a person.",
    sections: [
      {
        h: 'Where it shows up',
        list: [
          'Lists: "She likes hiking, swimming, and to bike" should be "hiking, swimming, and biking."',
          'Paired conjunctions: either...or, neither...nor, both...and, not only...but also, whether...or. What follows each half must match: "not only in the lab but also in the field."',
          'Comparisons: compare like to like. "Her essay was better than Tom" compares an essay to a person. Fix: "better than Tom\'s" or "better than that of Tom."',
          'Repeated words: if you repeat "to" or "by" for one item, repeat it for all, or for none after the first.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Look at the parts of the sentence that are not underlined. They usually set the pattern, and the underlined part must copy it.',
          'Comparison questions often use "than" or "as," and the error is comparing a thing to a person or a quality to a thing. Ask: what exactly is being compared?',
        ],
      },
    ],
    example: {
      prompt: 'The new library is designed for reading quietly, meeting with study groups, and [[to borrow]] laptops.',
      choices: ['A. No Change', 'B. borrowing', 'C. for borrowing of', 'D. people borrow'],
      answer: 'B',
      steps: [
        'The list pattern is "reading quietly, meeting with study groups," which uses -ing verbs.',
        'The last item must match: "borrowing laptops."',
        'A breaks the pattern with "to," C adds "for" and "of," and D adds a new subject. B keeps the list parallel.',
      ],
    },
    check: [
      { q: 'Fix: "The goal is not only to win but also having fun."', a: '"not only to win but also to have fun."' },
      { q: 'What is wrong with "The population of Tokyo is larger than Paris"?', a: 'It compares a population to a city. Use "than that of Paris."' },
      { q: 'Where do you look to find the pattern a list should follow?', a: 'The items that are not underlined.' },
    ],
  },

  'Word choice and idioms': {
    summary:
      "Word choice questions ask for the word that is precise, fits the tone, and makes sense in context, while idiom questions test which preposition or phrase goes with a word. Plug each choice into the sentence and pick the one that says exactly what the writer means with no change in tone.",
    sections: [
      {
        h: 'Precision and tone',
        list: [
          'Choose the word whose exact meaning fits the context, not just a word that sounds close. Several choices may be synonyms in general, but only one fits this sentence.',
          'Match the passage\'s tone. Formal passages reject slang ("a ton of," "kind of a big deal"). Casual narratives can be relaxed but not sloppy.',
          'Commonly confused words: affect (verb) / effect (noun), than (comparison) / then (time), accept / except, fewer (countable) / less (amount), amount (uncountable) / number (countable), principal / principle, complement / compliment.',
        ],
      },
      {
        h: 'Idioms',
        list: [
          'Some words need specific prepositions: interested in, capable of, different from, comply with, consistent with, responsible for, prefer A to B.',
          'Some verbs take a specific form: "allows us to see" (not "allows us seeing"), "insisted on going."',
          'Read each option aloud in your head. Idioms are about what sounds standard in formal writing, so trust a careful ear.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'Questions often ask which choice is "clearest and most precise" or "most effectively maintains the essay\'s tone." For tone, eliminate choices that are too casual or too dramatic for the passage.',
          'If a choice uses a fancy word that does not quite fit, it is a trap. The plain, exact word usually wins.',
        ],
      },
    ],
    example: {
      prompt: 'The engineers had to [[comply to]] strict safety rules during construction.',
      choices: ['A. No Change', 'B. comply with', 'C. comply about', 'D. comply for'],
      answer: 'B',
      steps: [
        '"Comply" is always followed by "with" in standard English.',
        'A, C, and D use prepositions that do not pair with "comply."',
        'B is the standard idiom.',
      ],
    },
    check: [
      { q: 'Fewer or less: "___ students than last year"?', a: 'Fewer. Students can be counted.' },
      { q: 'Affect or effect: "The rain will ___ the schedule"?', a: 'Affect. It is the verb here.' },
      { q: 'In a formal essay, is "a whole bunch of data" a good choice?', a: 'No. It is too casual. "A large amount of data" fits the tone.' },
    ],
  },

  'Concision and redundancy': {
    summary:
      "The ACT prefers the shortest choice that is grammatically correct and keeps the meaning. Redundant answers say the same thing twice, and wordy answers use five words where two would do.",
    sections: [
      {
        h: 'What to cut',
        list: [
          'Redundancy: words that repeat an idea already in the sentence. "Advance planning," "past history," "end result," "return back," "each and every," "annually every year."',
          'Look outside the underlined part. If the sentence already says "in 2020," the choice "at that time in 2020" is redundant.',
          'Wordy phrases: "due to the fact that" (because), "at this point in time" (now), "in order to" (to), "the reason is because" (because).',
          'Passive voice is often wordier: "The ball was thrown by Sam" vs. "Sam threw the ball."',
          '"DELETE the underlined portion" is often right when the underlined part adds nothing. Check that the sentence is still complete and the meaning is unchanged.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'If all four choices are grammatically fine and say the same thing, choose the shortest. Then reread to make sure the shortest one did not drop needed meaning or break the grammar.',
          'Shorter is not always right: if the short choice creates a fragment or loses information the sentence needs, eliminate it.',
        ],
      },
    ],
    example: {
      prompt: 'Every morning, the baker [[rises early at dawn before sunrise]] to prepare the bread.',
      choices: ['A. No Change', 'B. rises at dawn', 'C. rises early, at dawn,', 'D. rises in the morning at dawn'],
      answer: 'B',
      steps: [
        '"Early," "at dawn," and "before sunrise" all say the same thing. The sentence also already starts with "Every morning."',
        'B keeps one time phrase and loses no meaning.',
        'A, C, and D all repeat the idea.',
      ],
    },
    check: [
      { q: 'What is the shortcut when all choices are correct and mean the same thing?', a: 'Pick the shortest one, then reread to confirm.' },
      { q: 'What is redundant in "the final outcome"?', a: 'An outcome is already final. Just "the outcome."' },
      { q: 'When is DELETE wrong?', a: 'When removing the underlined part breaks the grammar or removes information the sentence needs.' },
    ],
  },

  Transitions: {
    summary:
      "Transition questions test the logical relationship between two ideas: contrast, continuation, cause and effect, or example. Read the sentence before and the sentence with the transition, name the relationship in your own words, then pick the word that signals it.",
    sections: [
      {
        h: 'The four relationships',
        list: [
          'Contrast: however, but, yet, nevertheless, on the other hand, instead, still, although, even so.',
          'Continuation or addition: furthermore, moreover, in addition, also, similarly, likewise.',
          'Cause and effect: therefore, thus, consequently, as a result, so, accordingly.',
          'Example or clarification: for example, for instance, specifically, in other words, indeed.',
          'Sequence or time: then, later, meanwhile, finally, subsequently.',
        ],
      },
      {
        h: 'The method',
        list: [
          'Cover the transition word.',
          'Read the previous sentence and the current one, and ask how they connect. Does the second agree, disagree, result from, or illustrate the first?',
          'Say the relationship in one word (contrast, addition, result, example), then find it in the choices.',
          'If two choices mean the same thing (for example "however" and "nevertheless"), both are probably wrong.',
          'NO CHANGE and DELETE are real options. If the ideas connect without a transition, deleting can be best.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'The trap is choosing a word that sounds smart but signals the wrong relationship, like "therefore" when nothing caused anything.',
          'Always read at least the full previous sentence. The relationship lives between sentences, not inside one.',
        ],
      },
    ],
    example: {
      prompt: 'Most of the town expected the new factory to bring jobs. [[Therefore,]] it closed within two years, and unemployment rose.',
      choices: ['A. No Change', 'B. Instead,', 'C. Similarly,', 'D. For example,'],
      answer: 'B',
      steps: [
        'The first sentence sets an expectation: jobs. The second says the opposite happened.',
        'That is a contrast. "Instead" signals that what happened replaced what was expected.',
        '"Therefore" signals cause, "similarly" signals agreement, and "for example" signals an illustration. None fit.',
      ],
    },
    check: [
      { q: 'Name the relationship: "She trained for months. ___, she won the race."', a: 'Cause and effect: "As a result."' },
      { q: 'Two choices mean the same thing. What does that suggest?', a: 'Both are likely wrong, since there can only be one answer.' },
      { q: 'What must you read before choosing a transition?', a: 'The previous sentence and the current sentence.' },
    ],
  },

  'Add, delete, or revise': {
    summary:
      "These rhetorical questions ask whether a sentence or phrase should be added, kept, deleted, or changed to accomplish a specific goal. Answer by asking what the paragraph is about and what the question says the writer wants, then judge the reason given in each choice.",
    sections: [
      {
        h: 'Question types',
        list: [
          'Add: "Should the writer add this sentence here?" Yes if it supports the paragraph\'s point and fits where it would go. No if it is off topic, repeats something, or interrupts the flow.',
          'Delete: "If the writer deleted this, the paragraph would lose..." Identify what the part actually does: a detail, an example, an explanation, a transition.',
          'Goal questions: "Which choice best accomplishes the goal of..." The question tells you the goal. Pick the choice that does exactly that goal, not just a true or interesting statement.',
          'Introduce or conclude: the best opener sets up what the paragraph is about. The best closer wraps up or links to the next paragraph or the essay\'s main idea.',
        ],
      },
      {
        h: 'The method',
        list: [
          'Reread the question for its exact goal, and underline the key words (for example "emphasize the danger" or "illustrate the contrast").',
          'Summarize the paragraph in a few words before looking at choices.',
          'For yes/no questions, decide yes or no first, then pick the choice whose reason is accurate. Two choices will say yes and two will say no, and only one reason will be true.',
          'Eliminate reasons that describe the sentence incorrectly, even if the yes or no is right.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'True but irrelevant details, especially ones that sound interesting or impressive.',
          'Choices that match the topic but not the specific goal in the question.',
          'Reasons that overstate what the sentence does ("proves," "explains why all...").',
        ],
      },
    ],
    example: {
      prompt: 'A paragraph describes how a city planted 5,000 trees to cool its streets during heat waves. The writer considers adding: "The city\'s mayor once worked as a high school chemistry teacher." Should the writer add this sentence?',
      choices: [
        'A. Yes, because it explains why the city chose to plant trees.',
        'B. Yes, because it adds an interesting detail about a city leader.',
        'C. No, because it distracts from the paragraph\'s focus on cooling the streets with trees.',
        'D. No, because it contradicts the information about the heat waves.',
      ],
      answer: 'C',
      steps: [
        'The paragraph is about trees cooling the streets. The mayor\'s old job has nothing to do with that, so the answer is no.',
        'D is "no" but gives a false reason: the sentence does not contradict anything.',
        'C gives the true reason: it is off topic.',
      ],
    },
    check: [
      { q: 'What do you decide first on an add or delete question?', a: 'Yes or no, based on whether the sentence fits the paragraph\'s point. Then check the reasons.' },
      { q: 'A choice is true and interesting but does not do the stated goal. Is it right?', a: 'No. Goal questions reward the choice that does the exact goal.' },
      { q: 'What should you do before reading the choices?', a: 'Summarize the paragraph in a few words and pin down the question\'s goal.' },
    ],
  },

  'Organization and sentence order': {
    summary:
      "Organization questions ask where a sentence or paragraph belongs so the ideas flow logically. Use the clues inside the sentence, like pronouns, transitions, time words, and new versus already-mentioned ideas, to find the only spot where it connects to what comes before and after.",
    sections: [
      {
        h: 'Clues to look for',
        list: [
          'Pronouns (he, she, it, they, this, these) must come after the noun they refer to. A sentence starting "This discovery" goes after the discovery is described.',
          'Transitions point backward: "However" contrasts with the sentence before. "Also" adds to a similar idea.',
          'Time and sequence words: first, then, after, later, finally, years before.',
          'New information is introduced before it is discussed. A name with a full description ("Dr. Amy Lin, a geologist,") comes before mentions of just "Lin."',
          'The first sentence of a paragraph usually introduces the topic. The last usually concludes or transitions.',
        ],
      },
      {
        h: 'The method',
        list: [
          'Read the sentence to be placed and circle its clue words.',
          'Test the most promising spot by reading the sentence before, the inserted sentence, and the sentence after.',
          'For "which order is most logical" questions, find the sentence that must come first (it introduces something) and eliminate orders that start elsewhere.',
          'Plug in the answer instead of reordering everything in your head.',
        ],
      },
      {
        h: 'How the ACT tests it',
        p: [
          'These often appear as "The best placement for Sentence 3 would be..." or ask where to add a new sentence in the passage as a whole. Skip them until you finish the paragraph, since you need the full context.',
        ],
      },
    ],
    example: {
      prompt: '[1] The volunteers first cleared the empty lot of trash. [2] By summer, the garden was producing more vegetables than the neighborhood could eat. [3] Then they built raised beds and planted seeds. Which order is most logical?',
      choices: ['A. 1, 2, 3 (No Change)', 'B. 1, 3, 2', 'C. 2, 1, 3', 'D. 3, 1, 2'],
      answer: 'B',
      steps: [
        '"First" in Sentence 1 marks the start.',
        '"Then they built raised beds" must follow clearing the lot, and the harvest "by summer" must come last.',
        'The order is 1, 3, 2.',
      ],
    },
    check: [
      { q: 'A sentence begins "These changes..." Where can it go?', a: 'Right after the sentence that describes the changes.' },
      { q: 'What usually belongs at the start of a paragraph?', a: 'The sentence that introduces the topic or something new.' },
      { q: 'When should you answer placement questions?', a: 'After reading the whole paragraph, since you need the context.' },
    ],
  },

  "Writer's purpose": {
    summary:
      "Writer's purpose questions ask whether the essay, or a paragraph, would accomplish a stated goal, and why or why not. Decide what the essay is actually about, compare it to the goal in the question, then choose the reason that describes the essay accurately.",
    sections: [
      {
        h: 'How the question works',
        list: [
          'Format: "Suppose the writer\'s primary purpose had been to... Would this essay accomplish that purpose?" Two choices say yes, two say no, and each gives a reason.',
          'These come at the end of a passage and ask about the passage as a whole, or about one paragraph if the question says so.',
          'The goal in the question is usually close to the essay\'s topic but not exactly the same. The test is whether it matches the essay\'s main focus, not just whether the essay mentions it.',
        ],
      },
      {
        h: 'The method',
        list: [
          'Before reading the choices, say in one sentence what the essay is mostly about. A good habit: jot a few words after each paragraph as you go.',
          'Compare that sentence to the stated goal. Is the goal the essay\'s main focus? If it is only a side detail, the answer is no.',
          'Pick yes or no, then choose between the two matching choices by checking the reason against the essay. The correct reason is accurate and usually describes the essay\'s real focus.',
        ],
      },
      {
        h: 'Traps',
        list: [
          'A "yes" reason that describes something the essay does mention, but only briefly.',
          'A "no" reason that is false, such as claiming the essay never mentions something it does.',
          'Goals that are much broader ("the history of all art") or narrower than the essay.',
        ],
      },
    ],
    example: {
      prompt: 'An essay tells how a teenager learned to repair bicycles in her uncle\'s shop and later opened her own repair business. Suppose the writer\'s primary purpose had been to explain the history of bicycle design. Would this essay accomplish that purpose?',
      choices: [
        'A. Yes, because it describes several types of bicycles the teenager repaired.',
        'B. Yes, because it explains how bicycles are built and maintained.',
        'C. No, because it focuses on one person\'s experience learning a trade and starting a business.',
        'D. No, because it never mentions bicycles in any detail.',
      ],
      answer: 'C',
      steps: [
        'The essay is about one person learning repairs and starting a business.',
        'The history of bicycle design is not its focus, so the answer is no.',
        'D is "no" but false, since bicycles are clearly mentioned. C states the essay\'s actual focus.',
      ],
    },
    check: [
      { q: 'What should you write down before reading the choices?', a: 'A one-sentence summary of what the essay is mostly about.' },
      { q: 'The essay mentions the stated goal in one paragraph. Does it accomplish the purpose?', a: 'Usually no. The goal has to be the essay\'s main focus.' },
      { q: 'After choosing yes or no, how do you pick between the two matching choices?', a: 'Check which reason describes the essay accurately.' },
    ],
  },
};

// Read a question's answer choices out of booklet text, and match a results-page answer to one. Pure.

const TO_AD = { A: 'A', B: 'B', C: 'C', D: 'D', F: 'A', G: 'B', H: 'C', J: 'D' };

/** Find "q." and the four lettered choices after it in booklet text (with "¶" where the text jumps). */
export function parseChoices(text, q) {
  const letters = Number(q) % 2 === 0 ? ['F', 'G', 'H', 'J'] : ['A', 'B', 'C', 'D'];
  const startRe = new RegExp(`\\s${q}\\.\\s`, 'g');
  let m;
  while ((m = startRe.exec(text))) {
    const rest = text.slice(m.index + m[0].length, m.index + m[0].length + 1500);
    const next = rest.search(new RegExp(`\\s${Number(q) + 1}\\.\\s`));
    const block = next > 0 ? rest.slice(0, next) : rest;
    const pos = [];
    let from = 0;
    for (const L of letters) {
      const i = block.indexOf(` ${L}. `, from);
      if (i < 0) break;
      pos.push(i);
      from = i + 3;
    }
    if (pos.length !== 4) continue;
    return pos.map((i, k) => ({
      letter: TO_AD[letters[k]],
      // A "¶" marks a jump to other text (another column, page, or block): the choice ends there.
      text: block.slice(i + 4, k < 3 ? pos[k + 1] : undefined).split('¶')[0].replace(/GO ON TO THE NEXT PAGE\.?/g, '').trim().slice(0, 160),
    }));
  }
  return null;
}

/** Which choice an answer string matches (answers from the results page are the choice's text). */
export function matchChoice(choices, answer) {
  if (!choices || !answer) return null;
  // NFKC turns math italic letters (𝑎) into plain ones.
  const norm = (str) => String(str).normalize('NFKC').toLowerCase().replace(/\.\.\.$/, '').replace(/[^a-z0-9]/g, '');
  const a = norm(answer);
  if (!a) return null;
  if (/^[a-dfghj]$/.test(a)) return choices.find((c) => c.letter === TO_AD[a.toUpperCase()]) || null;
  const exact = choices.find((c) => norm(c.text) === a) || choices.find((c) => norm(c.text).startsWith(a) || a.startsWith(norm(c.text)));
  if (exact) return exact;
  // Subscripts and superscripts land in different places in the two files (H2O read as "H O ... 2").
  // Compare letters only, and accept it only when exactly one choice fits.
  const letters = (str) => norm(str).replace(/[0-9]/g, '');
  const la = letters(answer);
  if (la.length < 3) return null;
  const hits = choices.filter((c) => {
    const lc = letters(c.text);
    return lc === la || lc.startsWith(la) || la.startsWith(lc);
  });
  return hits.length === 1 ? hits[0] : null;
}

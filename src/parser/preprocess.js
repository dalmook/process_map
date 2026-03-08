/**
 * @param {string} source
 * @returns {import('./schema.js').TextSegment[]}
 */
export function splitIntoSegments(source) {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  /** @type {import('./schema.js').TextSegment[]} */
  const segments = [];
  let order = 0;

  lines.forEach((line, index) => {
    const cleaned = line.replace(/^\s*(?:\d+\.\s*|[-•]\s*)/, '').trim();
    if (!cleaned) return;

    const sentenceLike = cleaned
      .split(/(?<=[.!?。])\s+|\s*;\s*/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!sentenceLike.length) return;

    sentenceLike.forEach((text) => {
      segments.push({ text, line: index + 1, order: order++ });
    });
  });

  return segments;
}

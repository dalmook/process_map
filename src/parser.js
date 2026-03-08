import { parseTextToTasks } from './parser/index.js';

/**
 * @param {string} sourceText
 * @returns {import('./parser/schema.js').ParseResult}
 */
export function parseTasksFromText(sourceText) {
  return parseTextToTasks(sourceText);
}

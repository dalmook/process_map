/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} task_name
 * @property {string} parent_task
 * @property {string} owner
 * @property {string} start_date
 * @property {string} end_date
 * @property {number} duration_days
 * @property {'high'|'medium'|'low'} priority
 * @property {'todo'|'in_progress'|'done'|'blocked'} status
 * @property {string} dependency
 * @property {string} note
 * @property {number} confidence
 * @property {string} source_text
 */

/** @type {Array<keyof Task>} */
export const TASK_COLUMNS = [
  'id',
  'task_name',
  'parent_task',
  'owner',
  'start_date',
  'end_date',
  'duration_days',
  'priority',
  'status',
  'dependency',
  'note',
  'confidence',
];

/**
 * @param {Task} task
 * @returns {Task}
 */
export function normalizeTask(task) {
  const normalized = { ...task };
  normalized.owner = normalized.owner || '미지정';
  normalized.start_date = normalized.start_date || '';
  normalized.end_date = normalized.end_date || '';
  normalized.dependency = normalized.dependency || '';
  normalized.note = normalized.note || '';
  normalized.source_text = normalized.source_text || '';
  normalized.duration_days = calcDurationDays(normalized.start_date, normalized.end_date);
  normalized.confidence = clampNumber(Number(normalized.confidence), 0, 1);
  return normalized;
}

/**
 * @param {string} startDate
 * @param {string} endDate
 * @returns {number}
 */
export function calcDurationDays(startDate, endDate) {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return 0;
  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / 86400000) + 1;
  return Math.max(days, 0);
}

/**
 * @param {string} value
 * @returns {Date | null}
 */
export function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampNumber(num, min, max) {
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

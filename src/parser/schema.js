/**
 * @typedef {Object} TextSegment
 * @property {string} text
 * @property {number} line
 * @property {number} order
 */

/**
 * @typedef {Object} DateExtraction
 * @property {string} start_date
 * @property {string} end_date
 * @property {string[]} notes
 */

/**
 * @typedef {Object} ParserTaskCandidate
 * @property {string} task_name
 * @property {string} owner
 * @property {string} start_date
 * @property {string} end_date
 * @property {'high'|'medium'|'low'} priority
 * @property {'todo'|'in_progress'|'done'|'blocked'} status
 * @property {string} dependency
 * @property {string} note
 * @property {number} confidence
 * @property {string} source_text
 * @property {string} parent_task
 */

/**
 * @typedef {Object} ParseResult
 * @property {ParserTaskCandidate[]} tasks
 * @property {string | null} message
 */

export const STATUS_KEYWORDS = {
  done: ['완료'],
  in_progress: ['진행중', '검토중', '진행 중', '검토 중', '진행'],
  blocked: ['보류'],
  todo: ['예정', '진행 예정', '착수 예정', '대기'],
};

export const PRIORITY_KEYWORDS = {
  high: ['긴급', '우선', '높음'],
  medium: ['보통'],
  low: ['낮음'],
};

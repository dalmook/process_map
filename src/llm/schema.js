import { normalizeTask } from '../model.js';

const REQUIRED_STRING_FIELDS = [
  'id',
  'task_name',
  'parent_task',
  'owner',
  'source_text',
];
const NULLABLE_STRING_FIELDS = ['start_date', 'end_date', 'dependency', 'note'];

const ALLOWED_PRIORITY = new Set(['high', 'medium', 'low']);
const ALLOWED_STATUS = new Set(['todo', 'in_progress', 'done', 'blocked']);

/**
 * @param {unknown} payload
 * @returns {{ ok: true, tasks: import('../model.js').Task[] } | { ok: false, reason: string }}
 */
export function validateRefinerPayload(payload) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.tasks)) {
    return { ok: false, reason: 'LLM JSON 구조 불일치(tasks 누락)' };
  }

  /** @type {import('../model.js').Task[]} */
  const tasks = [];

  for (const raw of payload.tasks) {
    if (!raw || typeof raw !== 'object') return { ok: false, reason: 'task 원소 타입 오류' };

    for (const field of REQUIRED_STRING_FIELDS) {
      if (typeof raw[field] !== 'string') return { ok: false, reason: `필수 문자열 필드 누락: ${field}` };
    }
    for (const field of NULLABLE_STRING_FIELDS) {
      if (typeof raw[field] !== 'string' && raw[field] !== null) {
        return { ok: false, reason: `필드 타입 오류: ${field}` };
      }
    }

    if (!ALLOWED_PRIORITY.has(raw.priority)) return { ok: false, reason: 'priority 값 오류' };
    if (!ALLOWED_STATUS.has(raw.status)) return { ok: false, reason: 'status 값 오류' };
    if (!Array.isArray(raw.refinement_flags)) return { ok: false, reason: 'refinement_flags 배열 누락' };
    if (!Array.isArray(raw.ai_touched_fields)) return { ok: false, reason: 'ai_touched_fields 배열 누락' };

    const parsed = normalizeTask({
      ...raw,
      start_date: raw.start_date || '',
      end_date: raw.end_date || '',
      dependency: raw.dependency || '',
      note: raw.note || '',
      duration_days: Number(raw.duration_days) || 0,
      confidence: Number(raw.confidence),
      refinement_flags: raw.refinement_flags.map((item) => String(item)),
      ai_touched_fields: raw.ai_touched_fields.map((item) => String(item)),
    });

    tasks.push(parsed);
  }

  return { ok: true, tasks };
}

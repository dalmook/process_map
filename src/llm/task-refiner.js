import { APP_CONFIG } from '../config.js';
import { normalizeTask } from '../model.js';
import { callOpenAIJSON } from './openai-adapter.js';
import { buildRefinerUserPrompt, REFINER_SYSTEM_PROMPT } from './prompts.js';
import { validateRefinerPayload } from './schema.js';

/**
 * @typedef {'applied'|'disabled'|'no_api_key'|'timeout'|'request_failed'|'invalid_json'|'schema_invalid'|'skipped'} RefinerStatus
 */

/**
 * @param {Object} params
 * @param {string} params.sourceText
 * @param {import('../model.js').Task[]} params.parserTasks
 * @param {Date} params.baseDate
 * @returns {Promise<{tasks: import('../model.js').Task[], status: RefinerStatus, message: string}>}
 */
export async function refineTasksWithLLM({ sourceText, parserTasks, baseDate }) {
  if (!APP_CONFIG.enableLLMRefinement) {
    return { tasks: parserTasks, status: 'disabled', message: '규칙 기반 결과만 표시 중 (LLM 비활성화)' };
  }

  if (!APP_CONFIG.openAIApiKey) {
    return { tasks: parserTasks, status: 'no_api_key', message: '규칙 기반 결과만 표시 중 (API 키 없음)' };
  }

  if (!parserTasks.length) {
    return { tasks: parserTasks, status: 'skipped', message: '규칙 기반 결과가 없어 LLM 보정을 건너뜀' };
  }

  const cappedTasks = parserTasks.slice(0, APP_CONFIG.maxTasksForRefinement);
  const untouchedTasks = parserTasks.slice(APP_CONFIG.maxTasksForRefinement);
  const clippedText = sourceText.slice(0, APP_CONFIG.maxSourceCharsForLLM);
  const userPrompt = buildRefinerUserPrompt({
    sourceText: clippedText,
    parserTasks: cappedTasks,
    baseDate: formatDate(baseDate),
  });

  let content;
  try {
    content = await callOpenAIJSON({
      baseUrl: APP_CONFIG.openAIBaseUrl,
      apiKey: APP_CONFIG.openAIApiKey,
      model: APP_CONFIG.llmModel,
      systemPrompt: REFINER_SYSTEM_PROMPT,
      userPrompt,
      timeoutMs: APP_CONFIG.llmTimeoutMs,
    });
  } catch (error) {
    if (String(error).includes('timeout') || String(error).includes('AbortError')) {
      return { tasks: parserTasks, status: 'timeout', message: 'LLM 보정 실패(timeout), 규칙 기반 결과로 대체' };
    }
    return { tasks: parserTasks, status: 'request_failed', message: 'LLM 보정 실패, 규칙 기반 결과로 대체' };
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { tasks: parserTasks, status: 'invalid_json', message: 'LLM JSON 파싱 실패, 규칙 기반 결과로 대체' };
  }

  const validated = validateRefinerPayload(parsed);
  if (!validated.ok) {
    return { tasks: parserTasks, status: 'schema_invalid', message: `LLM 스키마 검증 실패(${validated.reason}), 규칙 기반 결과로 대체` };
  }

  const merged = mergeWithUntouched(validated.tasks, untouchedTasks);
  return { tasks: merged.map(normalizeTask), status: 'applied', message: 'LLM 보정 적용됨' };
}

/**
 * @param {import('../model.js').Task[]} refined
 * @param {import('../model.js').Task[]} untouched
 */
function mergeWithUntouched(refined, untouched) {
  if (!untouched.length) return refined;
  return [...refined, ...untouched.map((task) => ({ ...task, note: appendNote(task.note, 'LLM 상한 초과로 규칙 결과 유지') }))];
}

function appendNote(note, extra) {
  if (!note) return extra;
  if (note.includes(extra)) return note;
  return `${note} | ${extra}`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

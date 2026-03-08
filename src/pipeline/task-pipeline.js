import { APP_CONFIG } from '../config.js';
import { normalizeTask } from '../model.js';
import { parseTasksFromText } from '../parser.js';
import { refineTasksWithLLM } from '../llm/task-refiner.js';

/**
 * @param {string} sourceText
 */
export async function buildTaskPipeline(sourceText) {
  const parsed = parseTasksFromText(sourceText);
  const parserTasks = parsed.tasks.map((task) =>
    normalizeTask({
      ...task,
      refinement_flags: task.refinement_flags || [],
      ai_touched_fields: task.ai_touched_fields || [],
    }),
  );

  if (!parserTasks.length) {
    return {
      parserTasks,
      refinedTasks: parserTasks,
      llmStatus: 'skipped',
      llmMessage: '규칙 기반 추출 결과 없음',
      message: parsed.message,
      warnings: [],
    };
  }

  const warnings = [];
  if (parserTasks.length > APP_CONFIG.maxTasksForRefinement) {
    warnings.push(
      `작업 수가 많아 상위 ${APP_CONFIG.maxTasksForRefinement}개만 LLM 보정하고 나머지는 규칙 결과를 유지합니다.`,
    );
  }
  if (sourceText.length > APP_CONFIG.maxSourceCharsForLLM) {
    warnings.push(`원문이 길어 상위 ${APP_CONFIG.maxSourceCharsForLLM}자만 LLM 입력에 사용했습니다.`);
  }

  const refined = await refineTasksWithLLM({
    sourceText,
    parserTasks,
    baseDate: new Date(),
  });

  return {
    parserTasks,
    refinedTasks: refined.tasks,
    llmStatus: refined.status,
    llmMessage: refined.message,
    message: parsed.message,
    warnings,
  };
}

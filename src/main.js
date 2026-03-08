import { APP_CONFIG } from './config.js';
import { SAMPLE_INPUT } from './sample-input.js';
import { renderGantt } from './gantt.js';
import { buildTaskPipeline } from './pipeline/task-pipeline.js';
import { clearMessages, getState, getVisibleTasks, setError, setPipelineState, setViewMode, subscribe, updateTask } from './state.js';
import { renderTaskTable } from './table.js';

const sourceTextEl = document.querySelector('#sourceText');
const generateBtnEl = document.querySelector('#generateBtn');
const viewParserBtnEl = document.querySelector('#viewParserBtn');
const viewRefinedBtnEl = document.querySelector('#viewRefinedBtn');
const modeBadgeEl = document.querySelector('#modeBadge');
const llmStatusBadgeEl = document.querySelector('#llmStatusBadge');
const tableBodyEl = document.querySelector('#taskTable tbody');
const ganttRootEl = document.querySelector('#ganttRoot');
const feedbackMessageEl = document.querySelector('#feedbackMessage');

const expandedTaskIds = new Set();

sourceTextEl.value = SAMPLE_INPUT;

generateBtnEl.addEventListener('click', async () => {
  clearMessages();
  expandedTaskIds.clear();

  const sourceText = sourceTextEl.value.trim();
  generateBtnEl.disabled = true;
  generateBtnEl.textContent = '생성 중...';

  try {
    const pipelineResult = await buildTaskPipeline(sourceText);
    setPipelineState(pipelineResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 처리 오류';
    setError(`처리 중 오류가 발생했습니다: ${message}`);
  } finally {
    generateBtnEl.disabled = false;
    generateBtnEl.textContent = '일정표 생성';
  }
});

viewParserBtnEl.addEventListener('click', () => setViewMode('parser'));
viewRefinedBtnEl.addEventListener('click', () => setViewMode('refined'));

subscribe((state) => {
  const visibleTasks = getVisibleTasks();
  const parserTaskMap = new Map(state.parserTasks.map((task) => [task.id, task]));
  const parserSourceMap = new Map(state.parserTasks.map((task) => [task.source_text, task]));

  renderTaskTable(tableBodyEl, visibleTasks, {
    onCellChange: (taskId, field, value) => updateTask(taskId, field, value),
    onToggleEvidence: toggleEvidence,
    expandedTaskIds,
    parserTaskMap,
    parserSourceMap,
    compareModeEnabled: APP_CONFIG.compareModeEnabled,
  });

  renderGantt(ganttRootEl, visibleTasks);
  renderBadges(state);
  renderFeedback(state, visibleTasks.length);
  syncViewToggleUI(state.viewMode);
});

function toggleEvidence(taskId) {
  if (expandedTaskIds.has(taskId)) expandedTaskIds.delete(taskId);
  else expandedTaskIds.add(taskId);

  const state = getState();
  const visibleTasks = getVisibleTasks();
  const parserTaskMap = new Map(state.parserTasks.map((task) => [task.id, task]));
  const parserSourceMap = new Map(state.parserTasks.map((task) => [task.source_text, task]));

  renderTaskTable(tableBodyEl, visibleTasks, {
    onCellChange: (id, field, value) => updateTask(id, field, value),
    onToggleEvidence: toggleEvidence,
    expandedTaskIds,
    parserTaskMap,
    parserSourceMap,
    compareModeEnabled: APP_CONFIG.compareModeEnabled,
  });
}

function renderBadges(state) {
  modeBadgeEl.textContent = state.viewMode === 'parser' ? '현재: 규칙 기반 결과' : '현재: LLM 보정 결과';

  let llmText = 'LLM 상태: 미실행';
  let badgeClass = 'mode-neutral';

  if (state.llmStatus === 'applied') {
    llmText = 'LLM 상태: 보정 적용';
    badgeClass = 'mode-success';
  } else if (['timeout', 'request_failed', 'invalid_json', 'schema_invalid'].includes(state.llmStatus)) {
    llmText = 'LLM 상태: 실패 후 규칙 결과 대체';
    badgeClass = 'mode-warn';
  } else if (['no_api_key', 'disabled'].includes(state.llmStatus)) {
    llmText = 'LLM 상태: 규칙 기반 결과만 표시 중';
    badgeClass = 'mode-neutral';
  } else if (state.llmStatus === 'skipped') {
    llmText = 'LLM 상태: 보정 건너뜀';
  }

  llmStatusBadgeEl.textContent = llmText;
  llmStatusBadgeEl.className = `mode-badge ${badgeClass}`;
}

function renderFeedback(state, visibleCount) {
  if (state.error) {
    feedbackMessageEl.textContent = state.error;
    feedbackMessageEl.className = 'feedback feedback-error';
    return;
  }

  const lines = [];
  if (state.message) lines.push(state.message);
  if (state.llmMessage) lines.push(state.llmMessage);
  if (state.warnings.length) lines.push(...state.warnings);
  if (!state.message && visibleCount > 0) lines.push(`현재 화면에 ${visibleCount}개 일정 항목이 표시됩니다.`);

  feedbackMessageEl.textContent = lines.join(' | ');
  if (state.message || state.warnings.length) {
    feedbackMessageEl.className = 'feedback feedback-warn';
  } else {
    feedbackMessageEl.className = 'feedback feedback-ok';
  }
}

function syncViewToggleUI(viewMode) {
  viewParserBtnEl.classList.toggle('active', viewMode === 'parser');
  viewRefinedBtnEl.classList.toggle('active', viewMode === 'refined');
}

renderTaskTable(tableBodyEl, [], {
  onCellChange: () => {},
  onToggleEvidence: () => {},
  expandedTaskIds,
  parserTaskMap: new Map(),
  parserSourceMap: new Map(),
  compareModeEnabled: APP_CONFIG.compareModeEnabled,
});
renderGantt(ganttRootEl, []);
syncViewToggleUI('refined');

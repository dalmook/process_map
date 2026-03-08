import { SAMPLE_INPUT } from './sample-input.js';
import { parseTasksFromText } from './parser.js';
import { clearMessages, getState, setError, setTasks, subscribe, updateTask } from './state.js';
import { renderTaskTable } from './table.js';
import { renderGantt } from './gantt.js';

const sourceTextEl = document.querySelector('#sourceText');
const generateBtnEl = document.querySelector('#generateBtn');
const tableBodyEl = document.querySelector('#taskTable tbody');
const ganttRootEl = document.querySelector('#ganttRoot');
const feedbackMessageEl = document.querySelector('#feedbackMessage');

const expandedTaskIds = new Set();

sourceTextEl.value = SAMPLE_INPUT;

generateBtnEl.addEventListener('click', () => {
  clearMessages();
  expandedTaskIds.clear();

  try {
    const sourceText = sourceTextEl.value.trim();
    const result = parseTasksFromText(sourceText);
    setTasks(result.tasks, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 파서 오류';
    setTasks([], null);
    setError(`파서 처리 중 오류가 발생했습니다: ${message}`);
  }
});

subscribe((state) => {
  renderTaskTable(
    tableBodyEl,
    state.tasks,
    (taskId, field, value) => updateTask(taskId, field, value),
    toggleEvidence,
    expandedTaskIds,
  );

  renderGantt(ganttRootEl, state.tasks);

  if (state.error) {
    feedbackMessageEl.textContent = state.error;
    feedbackMessageEl.className = 'feedback feedback-error';
  } else if (state.message) {
    feedbackMessageEl.textContent = state.message;
    feedbackMessageEl.className = 'feedback feedback-warn';
  } else if (state.tasks.length > 0) {
    feedbackMessageEl.textContent = `총 ${state.tasks.length}개 일정 항목이 추출되었습니다.`;
    feedbackMessageEl.className = 'feedback feedback-ok';
  } else {
    feedbackMessageEl.textContent = '';
    feedbackMessageEl.className = 'feedback';
  }
});

function toggleEvidence(taskId) {
  if (expandedTaskIds.has(taskId)) expandedTaskIds.delete(taskId);
  else expandedTaskIds.add(taskId);

  const state = getState();
  renderTaskTable(
    tableBodyEl,
    state.tasks,
    (id, field, value) => updateTask(id, field, value),
    toggleEvidence,
    expandedTaskIds,
  );
}

renderTaskTable(
  tableBodyEl,
  getState().tasks,
  (taskId, field, value) => updateTask(taskId, field, value),
  toggleEvidence,
  expandedTaskIds,
);
renderGantt(ganttRootEl, getState().tasks);

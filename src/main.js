import { SAMPLE_INPUT } from './sample-input.js';
import { parseTasksFromText } from './parser.js';
import { getState, setTasks, subscribe, updateTask } from './state.js';
import { renderTaskTable } from './table.js';
import { renderGantt } from './gantt.js';

const sourceTextEl = document.querySelector('#sourceText');
const generateBtnEl = document.querySelector('#generateBtn');
const tableBodyEl = document.querySelector('#taskTable tbody');
const ganttRootEl = document.querySelector('#ganttRoot');

sourceTextEl.value = SAMPLE_INPUT;

generateBtnEl.addEventListener('click', () => {
  const sourceText = sourceTextEl.value.trim();
  const tasks = parseTasksFromText(sourceText);
  setTasks(tasks);
});

subscribe((state) => {
  renderTaskTable(tableBodyEl, state.tasks, (taskId, field, value) => {
    updateTask(taskId, field, value);
  });
  renderGantt(ganttRootEl, state.tasks);
});

renderTaskTable(tableBodyEl, getState().tasks, (taskId, field, value) => {
  updateTask(taskId, field, value);
});
renderGantt(ganttRootEl, getState().tasks);

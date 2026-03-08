import { normalizeTask } from './model.js';

const state = {
  parserTasks: [],
  refinedTasks: [],
  viewMode: 'refined',
  llmStatus: 'skipped',
  llmMessage: '',
  message: null,
  warnings: [],
  error: null,
};

const listeners = new Set();

export function getState() {
  return state;
}

export function getVisibleTasks() {
  return state.viewMode === 'parser' ? state.parserTasks : state.refinedTasks;
}

export function setPipelineState(result) {
  state.parserTasks = (result.parserTasks || []).map(normalizeTask);
  state.refinedTasks = (result.refinedTasks || []).map(normalizeTask);
  state.llmStatus = result.llmStatus || 'skipped';
  state.llmMessage = result.llmMessage || '';
  state.message = result.message || null;
  state.warnings = result.warnings || [];
  state.error = null;

  if (!state.refinedTasks.length && state.parserTasks.length) {
    state.viewMode = 'parser';
  }

  emitChange();
}

export function setViewMode(mode) {
  if (mode !== 'parser' && mode !== 'refined') return;
  state.viewMode = mode;
  emitChange();
}

export function setError(errorMessage) {
  state.error = errorMessage;
  emitChange();
}

export function clearMessages() {
  state.message = null;
  state.error = null;
  state.warnings = [];
  state.llmMessage = '';
}

export function updateTask(taskId, key, value) {
  const target = state.viewMode === 'parser' ? state.parserTasks : state.refinedTasks;
  const task = target.find((item) => item.id === taskId);
  if (!task) return;

  task[key] = value;
  Object.assign(task, normalizeTask(task));
  emitChange();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener(state));
}

import { normalizeTask } from './model.js';

const state = {
  tasks: [],
  message: null,
  error: null,
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setTasks(tasks, message = null) {
  state.tasks = tasks.map(normalizeTask);
  state.message = message;
  state.error = null;
  emitChange();
}

export function setError(errorMessage) {
  state.error = errorMessage;
  emitChange();
}

export function clearMessages() {
  state.message = null;
  state.error = null;
}

export function updateTask(taskId, key, value) {
  const task = state.tasks.find((item) => item.id === taskId);
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

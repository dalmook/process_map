import { normalizeTask } from './model.js';

const state = {
  tasks: [],
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setTasks(tasks) {
  state.tasks = tasks.map(normalizeTask);
  emitChange();
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

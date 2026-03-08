import { TASK_COLUMNS } from './model.js';

const NON_EDITABLE_COLUMNS = new Set(['id', 'duration_days']);

export function renderTaskTable(tbody, tasks, onCellChange) {
  tbody.innerHTML = '';

  tasks.forEach((task) => {
    const tr = document.createElement('tr');

    TASK_COLUMNS.forEach((column) => {
      const td = document.createElement('td');
      const value = task[column] ?? '';

      if (NON_EDITABLE_COLUMNS.has(column)) {
        td.textContent = String(value);
      } else {
        const input = document.createElement('input');
        input.value = String(value);
        input.dataset.taskId = task.id;
        input.dataset.field = column;
        input.addEventListener('change', (event) => {
          onCellChange(task.id, column, event.target.value);
        });
        td.appendChild(input);
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

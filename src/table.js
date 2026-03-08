import { TASK_COLUMNS } from './model.js';

const NON_EDITABLE_COLUMNS = new Set(['id', 'duration_days']);

/**
 * @param {HTMLTableSectionElement} tbody
 * @param {import('./model.js').Task[]} tasks
 * @param {(taskId: string, field: string, value: string) => void} onCellChange
 * @param {(taskId: string) => void} onToggleEvidence
 * @param {Set<string>} expandedTaskIds
 */
export function renderTaskTable(tbody, tasks, onCellChange, onToggleEvidence, expandedTaskIds) {
  tbody.innerHTML = '';

  tasks.forEach((task) => {
    const tr = document.createElement('tr');
    if (task.confidence < 0.45) tr.classList.add('low-confidence-row');

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

        if (column === 'confidence' && task.confidence < 0.45) {
          const badge = document.createElement('span');
          badge.className = 'confidence-badge';
          badge.textContent = 'low';
          td.appendChild(badge);
        }
      }

      tr.appendChild(td);
    });

    const evidenceTd = document.createElement('td');
    const evidenceBtn = document.createElement('button');
    evidenceBtn.type = 'button';
    evidenceBtn.className = 'ghost-btn';
    evidenceBtn.textContent = expandedTaskIds.has(task.id) ? '근거 닫기' : '근거 보기';
    evidenceBtn.addEventListener('click', () => onToggleEvidence(task.id));
    evidenceTd.appendChild(evidenceBtn);
    tr.appendChild(evidenceTd);

    tbody.appendChild(tr);

    if (expandedTaskIds.has(task.id)) {
      const sourceTr = document.createElement('tr');
      sourceTr.className = 'source-row';
      const sourceTd = document.createElement('td');
      sourceTd.colSpan = TASK_COLUMNS.length + 1;
      sourceTd.innerHTML = `
        <strong>source_text</strong>
        <pre>${escapeHtml(task.source_text || '근거 문장이 없습니다.')}</pre>
      `;
      sourceTr.appendChild(sourceTd);
      tbody.appendChild(sourceTr);
    }
  });
}

function escapeHtml(raw) {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

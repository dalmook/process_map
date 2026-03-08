import { TASK_COLUMNS } from './model.js';

const NON_EDITABLE_COLUMNS = new Set(['id', 'duration_days']);

/**
 * @param {HTMLTableSectionElement} tbody
 * @param {import('./model.js').Task[]} tasks
 * @param {Object} options
 * @param {(taskId: string, field: string, value: string) => void} options.onCellChange
 * @param {(taskId: string) => void} options.onToggleEvidence
 * @param {Set<string>} options.expandedTaskIds
 * @param {Map<string, import('./model.js').Task>} options.parserTaskMap
 * @param {Map<string, import('./model.js').Task>} options.parserSourceMap
 * @param {boolean} options.compareModeEnabled
 */
export function renderTaskTable(tbody, tasks, options) {
  const {
    onCellChange,
    onToggleEvidence,
    expandedTaskIds,
    parserTaskMap,
    parserSourceMap,
    compareModeEnabled,
  } = options;
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

      if (column === 'task_name' && task.ai_touched_fields.length) {
        const aiBadge = document.createElement('span');
        aiBadge.className = 'ai-badge';
        aiBadge.textContent = 'AI 보정';
        aiBadge.title = `수정 필드: ${task.ai_touched_fields.join(', ')}`;
        td.appendChild(aiBadge);
      }

      tr.appendChild(td);
    });

    const evidenceTd = document.createElement('td');
    const evidenceBtn = document.createElement('button');
    evidenceBtn.type = 'button';
    evidenceBtn.className = 'ghost-btn';
    evidenceBtn.textContent = expandedTaskIds.has(task.id) ? '상세 닫기' : '근거/변경';
    evidenceBtn.addEventListener('click', () => onToggleEvidence(task.id));
    evidenceTd.appendChild(evidenceBtn);
    tr.appendChild(evidenceTd);

    tbody.appendChild(tr);

    if (expandedTaskIds.has(task.id)) {
      const sourceTr = document.createElement('tr');
      sourceTr.className = 'source-row';
      const sourceTd = document.createElement('td');
      sourceTd.colSpan = TASK_COLUMNS.length + 1;

      const parserRef = parserTaskMap.get(task.id) || parserSourceMap.get(task.source_text);
      const diffHtml = compareModeEnabled ? renderDiffSummary(task, parserRef) : '';
      sourceTd.innerHTML = `
        <strong>source_text</strong>
        <pre>${escapeHtml(task.source_text || '근거 문장이 없습니다.')}</pre>
        ${diffHtml}
      `;
      sourceTr.appendChild(sourceTd);
      tbody.appendChild(sourceTr);
    }
  });
}

function renderDiffSummary(task, parserTask) {
  if (!parserTask) return '<div class="diff-box"><strong>변경 필드</strong><div>없음</div></div>';

  const diffFields = [];
  const fieldsToCompare = [
    'task_name',
    'parent_task',
    'owner',
    'start_date',
    'end_date',
    'priority',
    'status',
    'dependency',
    'note',
    'confidence',
  ];

  fieldsToCompare.forEach((field) => {
    const before = String(parserTask[field] ?? '');
    const after = String(task[field] ?? '');
    if (before !== after) {
      diffFields.push(`<li>${escapeHtml(field)}: ${escapeHtml(before || '(empty)')} -> ${escapeHtml(after || '(empty)')}</li>`);
    }
  });

  const touched = task.ai_touched_fields.length ? task.ai_touched_fields.join(', ') : '없음';
  const flags = task.refinement_flags.length ? task.refinement_flags.join(', ') : '없음';

  return `
    <div class="diff-box">
      <strong>변경 필드</strong>
      ${diffFields.length ? `<ul>${diffFields.join('')}</ul>` : '<div>없음</div>'}
      <div class="diff-meta">ai_touched_fields: ${escapeHtml(touched)}</div>
      <div class="diff-meta">refinement_flags: ${escapeHtml(flags)}</div>
    </div>
  `;
}

function escapeHtml(raw) {
  return String(raw)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

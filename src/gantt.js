import { toDate } from './model.js';

const DAY_MS = 86400000;

export function renderGantt(container, tasks) {
  container.innerHTML = '';

  if (!tasks.length) {
    container.innerHTML = '<p class="empty">일정표를 생성하면 간트차트가 표시됩니다.</p>';
    return;
  }

  const parsed = tasks
    .map((task) => ({ task, start: toDate(task.start_date), end: toDate(task.end_date) }))
    .filter((item) => item.start && item.end)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (!parsed.length) {
    container.innerHTML = '<p class="empty">유효한 start_date/end_date를 입력해주세요.</p>';
    return;
  }

  const minStart = parsed[0].start;
  const maxEnd = parsed.reduce((max, item) => (item.end > max ? item.end : max), parsed[0].end);
  const totalDays = Math.max(1, Math.floor((maxEnd.getTime() - minStart.getTime()) / DAY_MS) + 1);

  const chart = document.createElement('div');
  chart.className = 'gantt-chart';

  parsed.forEach(({ task, start, end }) => {
    const row = document.createElement('div');
    row.className = 'gantt-row';

    const label = document.createElement('div');
    label.className = 'gantt-label';
    label.textContent = `${task.id} ${task.task_name}`;

    const track = document.createElement('div');
    track.className = 'gantt-track';

    const bar = document.createElement('div');
    bar.className = `gantt-bar status-${task.status}`;
    const offsetDays = Math.floor((start.getTime() - minStart.getTime()) / DAY_MS);
    const durationDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1);

    bar.style.left = `${(offsetDays / totalDays) * 100}%`;
    bar.style.width = `${(durationDays / totalDays) * 100}%`;
    bar.title = `${task.start_date} ~ ${task.end_date}`;

    track.appendChild(bar);
    row.append(label, track);
    chart.appendChild(row);
  });

  const axis = document.createElement('div');
  axis.className = 'gantt-axis';
  axis.innerHTML = `
    <span>${formatDate(minStart)}</span>
    <span>${formatDate(maxEnd)}</span>
  `;

  container.append(chart, axis);
}

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

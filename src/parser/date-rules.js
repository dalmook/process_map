const MONTH_END_DAY = { 2: 28, 4: 30, 6: 30, 9: 30, 11: 30 };

/**
 * @param {string} text
 * @param {Date} baseDate
 * @returns {import('./schema.js').DateExtraction}
 */
export function extractDates(text, baseDate = new Date()) {
  const notes = [];
  const rangeByFromTo = /(.+?)부터\s*(.+?)까지/.exec(text);
  if (rangeByFromTo) {
    const start = parseDateToken(rangeByFromTo[1], baseDate, notes);
    const end = parseDateToken(rangeByFromTo[2], baseDate, notes);
    return { start_date: start, end_date: end, notes };
  }

  const explicitRange = /(\d{1,2}월\s*\d{1,2}일)\s*[~-]\s*(\d{1,2}월\s*\d{1,2}일)/.exec(text);
  if (explicitRange) {
    return {
      start_date: parseDateToken(explicitRange[1], baseDate, notes),
      end_date: parseDateToken(explicitRange[2], baseDate, notes),
      notes,
    };
  }

  const tokens = collectDateTokens(text);
  if (tokens.length >= 2) {
    const start = parseDateToken(tokens[0], baseDate, notes);
    const end = parseDateToken(tokens[1], baseDate, notes);
    return { start_date: start, end_date: end, notes };
  }

  if (tokens.length === 1) {
    const single = parseDateToken(tokens[0], baseDate, notes);
    if (/(까지|목표|완료|마감)/.test(text)) {
      return { start_date: '', end_date: single, notes };
    }
    return { start_date: '', end_date: single, notes };
  }

  if (/이번주|금주/.test(text)) {
    const [start, end] = getWeekRange(baseDate, 0);
    notes.push('상대 일정 해석: 이번주/금주');
    return { start_date: formatDate(start), end_date: formatDate(end), notes };
  }

  if (/다음주|차주/.test(text)) {
    const [start, end] = getWeekRange(baseDate, 1);
    notes.push('상대 일정 해석: 다음주/차주');
    return { start_date: formatDate(start), end_date: formatDate(end), notes };
  }

  return { start_date: '', end_date: '', notes };
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function collectDateTokens(text) {
  const patterns = [
    /\d{4}[-.]\d{1,2}[-.]\d{1,2}/g,
    /\d{1,2}\/\d{1,2}/g,
    /\d{1,2}월\s*\d{1,2}일/g,
    /\d{1,2}월\s*\d주차/g,
    /\d{1,2}월\s*(?:초|중|말)/g,
    /\d{1,2}월\s*말/g,
  ];

  const tokens = [];
  patterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) tokens.push(...matches);
  });
  return dedupe(tokens).sort((a, b) => text.indexOf(a) - text.indexOf(b));
}

function dedupe(items) {
  return [...new Set(items)];
}

/**
 * @param {string} token
 * @param {Date} baseDate
 * @param {string[]} notes
 * @returns {string}
 */
function parseDateToken(token, baseDate, notes) {
  const extracted = collectDateTokens(token)[0];
  const normalized = (extracted || token).trim();

  if (/^\d{4}[-.]\d{1,2}[-.]\d{1,2}$/.test(normalized)) {
    const [y, m, d] = normalized.replaceAll('.', '-').split('-').map(Number);
    return toDateString(y, m, d);
  }

  if (/^\d{1,2}\/\d{1,2}$/.test(normalized)) {
    const [m, d] = normalized.split('/').map(Number);
    notes.push('연도 미표기 날짜: 기준연도 적용');
    return toDateString(baseDate.getFullYear(), m, d);
  }

  if (/^\d{1,2}월\s*\d{1,2}일$/.test(normalized)) {
    const [m, d] = normalized.replace('월', ' ').replace('일', '').trim().split(/\s+/).map(Number);
    notes.push('연도 미표기 날짜: 기준연도 적용');
    return toDateString(baseDate.getFullYear(), m, d);
  }

  if (/^\d{1,2}월\s*\d주차$/.test(normalized)) {
    const [month, week] = normalized.replace('월', ' ').replace('주차', '').trim().split(/\s+/).map(Number);
    const approxStartDay = (week - 1) * 7 + 1;
    const start = new Date(baseDate.getFullYear(), month - 1, approxStartDay);
    notes.push('모호한 일정 표현: 월 주차를 주간 범위로 해석');
    return formatDate(start);
  }

  if (/^\d{1,2}월\s*초$/.test(normalized)) {
    const month = Number(normalized.replace(/[월초\s]/g, ''));
    notes.push('모호한 일정 표현: 월 초를 1~10일로 해석');
    return toDateString(baseDate.getFullYear(), month, 10);
  }

  if (/^\d{1,2}월\s*중$/.test(normalized)) {
    const month = Number(normalized.replace(/[월중\s]/g, ''));
    notes.push('모호한 일정 표현: 월 중을 20일로 해석');
    return toDateString(baseDate.getFullYear(), month, 20);
  }

  if (/^\d{1,2}월\s*(말)$/.test(normalized)) {
    const month = Number(normalized.replace(/[월말\s]/g, ''));
    notes.push('모호한 일정 표현: 월 말을 월말일로 해석');
    return toDateString(baseDate.getFullYear(), month, getMonthEndDay(baseDate.getFullYear(), month));
  }

  return '';
}

function getMonthEndDay(year, month) {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return MONTH_END_DAY[month] || 31;
}

function toDateString(year, month, day) {
  const safe = new Date(year, month - 1, day);
  if (Number.isNaN(safe.getTime())) return '';
  return formatDate(safe);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekRange(baseDate, offsetWeek) {
  const base = new Date(baseDate);
  const day = base.getDay();
  const mondayDiff = day === 0 ? -6 : 1 - day;
  const start = new Date(base);
  start.setDate(base.getDate() + mondayDiff + offsetWeek * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return [start, end];
}

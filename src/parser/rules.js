import { PRIORITY_KEYWORDS, STATUS_KEYWORDS } from './schema.js';

/**
 * @param {string} text
 * @returns {string}
 */
export function extractOwner(text) {
  if (/담당자\s*미정/.test(text)) return '미지정';

  const keywordMatch = /(?:owner\s*:\s*|담당\s*:\s*)([가-힣A-Za-z]{2,20})/.exec(text);
  if (keywordMatch) return normalizeOwner(keywordMatch[1]);

  const progressMatch = /([가-힣]{2,4})가\s*담당/.exec(text);
  if (progressMatch && isLikelyPersonName(progressMatch[1])) return normalizeOwner(progressMatch[1]);

  const ownerPatterns = [
    /([가-힣]{2,4})(?:이|가)?\s*담당/,
    /([가-힣]{2,4})(?:이|가)?\s*책임/,
    /([가-힣]{2,4})(?:이|가)\s*진행/,
    /([가-힣]{2,4})(?:이|가)\s*검토/,
  ];
  for (const pattern of ownerPatterns) {
    const match = pattern.exec(text);
    if (match && isLikelyPersonName(match[1])) return normalizeOwner(match[1]);
  }

  return '미지정';
}

/**
 * @param {string} text
 * @returns {'todo'|'in_progress'|'done'|'blocked'}
 */
export function extractStatus(text) {
  for (const keyword of STATUS_KEYWORDS.done) {
    if (text.includes(keyword)) return 'done';
  }
  for (const keyword of STATUS_KEYWORDS.blocked) {
    if (text.includes(keyword)) return 'blocked';
  }
  for (const keyword of STATUS_KEYWORDS.todo) {
    if (text.includes(keyword)) return 'todo';
  }
  for (const keyword of STATUS_KEYWORDS.in_progress) {
    if (text.includes(keyword)) return 'in_progress';
  }
  return 'todo';
}

/**
 * @param {string} text
 * @returns {'high'|'medium'|'low'}
 */
export function extractPriority(text) {
  if (/우선순위\s*(상|높음)/.test(text)) return 'high';
  if (/우선순위\s*(중|보통)/.test(text)) return 'medium';
  if (/우선순위\s*(하|낮음)/.test(text)) return 'low';
  if (PRIORITY_KEYWORDS.high.some((keyword) => text.includes(keyword))) return 'high';
  if (PRIORITY_KEYWORDS.low.some((keyword) => text.includes(keyword))) return 'low';
  if (PRIORITY_KEYWORDS.medium.some((keyword) => text.includes(keyword))) return 'medium';
  return 'medium';
}

/**
 * @param {string} text
 * @returns {string}
 */
export function extractDependency(text) {
  const clauses = text.split(/[,.]/).map((clause) => clause.trim()).filter(Boolean);
  const patterns = [
    /(.+?)\s*이후\s*시작/,
    /(.+?)\s*완료\s*후\s*진행/,
    /(.+?)\s*끝나면\s*시작/,
    /선행\s*[:은는]?\s*(.+)/,
    /후속\s*[:은는]?\s*(.+)/,
  ];

  for (const clause of clauses) {
    for (const pattern of patterns) {
      const match = pattern.exec(clause);
      if (match && match[1]) {
        const dep = normalizePhrase(match[1]);
        if (dep && dep.length <= 30) return dep;
      }
    }
  }

  if (/다음 단계/.test(text)) return '다음 단계';
  if (/먼저/.test(text)) return '선행 작업 필요';
  return '';
}

/**
 * @param {string} text
 * @returns {string}
 */
export function extractTaskName(text) {
  let candidate = text;

  const focus = /(.*?)\s*(?:은|는|이|가)\s/.exec(text);
  if (focus && focus[1]) {
    candidate = focus[1];
  }

  candidate = candidate
    .replace(/[\[\]]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d{4}[-.]\d{1,2}[-.]\d{1,2}/g, ' ')
    .replace(/\d{1,2}\/\d{1,2}/g, ' ')
    .replace(/\d{1,2}월\s*\d{1,2}일/g, ' ')
    .replace(/\d{1,2}월\s*(?:\d주차|초|중|말)/g, ' ')
    .replace(/(?:담당|진행|완료|예정|착수|필요|목표|기능|항목|이번주|다음주|금주|차주|우선순위)/g, ' ')
    .replace(/(?:합니다|입니다|하십시오|해주세요|하고|하며|으로|까지|부터|내)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  candidate = candidate.replace(/[,:]/g, '').trim();

  if (!candidate || candidate.length < 2) return '';
  if (candidate.length > 30) return `${candidate.slice(0, 28).trim()}..`;
  return candidate;
}

/**
 * @param {string} taskName
 * @returns {string}
 */
export function inferParentTask(taskName) {
  if (/요구사항|기획/.test(taskName)) return '기획';
  if (/화면|디자인|UI|UX/.test(taskName)) return '디자인';
  if (/백엔드|API|개발|로그인|권한/.test(taskName)) return '개발';
  if (/QA|테스트|검토/.test(taskName)) return '검증';
  if (/배포|운영/.test(taskName)) return '배포';
  return '기타';
}

/**
 * @param {Object} fields
 * @param {string} fields.task_name
 * @param {string} fields.owner
 * @param {string} fields.start_date
 * @param {string} fields.end_date
 * @param {string} fields.dependency
 * @param {'todo'|'in_progress'|'done'|'blocked'} fields.status
 * @returns {number}
 */
export function calcConfidence(fields) {
  let score = 0;
  if (fields.task_name) score += 0.35;
  if (fields.start_date || fields.end_date) score += 0.25;
  if (fields.owner && fields.owner !== '미지정') score += 0.15;
  if (fields.status && fields.status !== 'todo') score += 0.1;
  if (fields.dependency) score += 0.05;
  if (fields.end_date && fields.start_date) score += 0.1;
  return Math.min(1, Number(score.toFixed(2)));
}

function normalizePhrase(input) {
  return input
    .replace(/(?:은|는|이|가|을|를|에서)\s*$/g, '')
    .replace(/[,.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeOwner(owner) {
  return owner.replace(/(은|는|이|가)$/g, '').trim();
}

function isLikelyPersonName(name) {
  if (!name || name.length < 2 || name.length > 4) return false;
  if (
    /(일|월|주|팀|항목|기능|화면|검토|테스트|개발|배포|디자인|운영|요구사항|로그인|권한)$/.test(name)
  ) {
    return false;
  }
  if (name.includes('까지')) return false;
  return true;
}

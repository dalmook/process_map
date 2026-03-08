import { normalizeTask } from '../model.js';
import { extractDates } from './date-rules.js';
import { splitIntoSegments } from './preprocess.js';
import {
  calcConfidence,
  extractDependency,
  extractOwner,
  extractPriority,
  extractStatus,
  extractTaskName,
  inferParentTask,
} from './rules.js';

/**
 * @param {string} sourceText
 * @returns {import('./schema.js').ParseResult}
 */
export function parseTextToTasks(sourceText) {
  if (!sourceText || sourceText.trim().length < 10) {
    return {
      tasks: [],
      message: '입력 텍스트가 너무 짧습니다. 회의록/업무메모를 1~2문장 이상 넣어주세요.',
    };
  }

  const segments = splitIntoSegments(sourceText);
  /** @type {import('../model.js').Task[]} */
  const tasks = [];

  segments.forEach((segment) => {
    if (!isLikelyTaskSegment(segment.text)) return;

    const taskName = extractTaskName(segment.text);
    if (!taskName) return;

    const dateResult = extractDates(segment.text, new Date());
    const owner = extractOwner(segment.text);
    const status = extractStatus(segment.text);
    const priority = extractPriority(segment.text);
    const dependency = extractDependency(segment.text);

    const notes = [...dateResult.notes];
    if (owner === '미지정') notes.push('담당자 정보 없음');

    const confidence = calcConfidence({
      task_name: taskName,
      owner,
      start_date: dateResult.start_date,
      end_date: dateResult.end_date,
      status,
      dependency,
    });

    tasks.push(
      normalizeTask({
        id: `T-${String(tasks.length + 1).padStart(3, '0')}`,
        task_name: taskName,
        parent_task: inferParentTask(taskName),
        owner,
        start_date: dateResult.start_date,
        end_date: dateResult.end_date,
        duration_days: 0,
        priority,
        status,
        dependency,
        note: notes.join(' | '),
        confidence,
        source_text: segment.text,
      }),
    );
  });

  if (!tasks.length) {
    return {
      tasks: [],
      message: '추출된 일정 항목이 없습니다. 날짜/담당자/업무명이 포함된 문장을 넣어보세요.',
    };
  }

  return { tasks, message: null };
}

function isLikelyTaskSegment(text) {
  if (/^\[.*\]$/.test(text)) return false;
  if (/회의록|공지|안건/.test(text) && text.length < 20) return false;

  return /(담당|진행|완료|예정|검토|목표|필요|시작|우선|긴급|주차|이번주|다음주|금주|차주|\d{1,2}월|\d{1,2}\/\d{1,2}|\d{4}[-.]\d{1,2}[-.]\d{1,2})/.test(
    text,
  );
}

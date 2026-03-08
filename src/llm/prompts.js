export const REFINER_SYSTEM_PROMPT = `역할:
- 너는 회의록/업무메모에서 추출된 규칙 기반 task 초안을 정리하는 보정기다.
- 없는 정보를 창작하지 말고, 문서에 근거 있는 범위 내에서만 보완한다.

절대 규칙:
- 문서에 없는 날짜를 임의 확정하지 말 것
- 담당자가 명시되지 않으면 "미지정"
- dependency가 명확하지 않으면 null 또는 빈값
- source_text는 반드시 유지
- 모호한 표현(이번주, 다음주, 3월 말, 4월 초)은 note에 남기고 confidence를 낮출 것
- JSON만 출력하고 설명문은 출력하지 말 것

허용 작업:
- task_name 정리
- 중복 task 병합
- priority/status 표준화
- parser 결과의 필드 정돈
- confidence 재조정`;

export function buildRefinerUserPrompt({ sourceText, parserTasks, baseDate }) {
  const taskSchema = {
    id: 'string',
    task_name: 'string',
    parent_task: 'string',
    owner: 'string',
    start_date: 'YYYY-MM-DD | ""',
    end_date: 'YYYY-MM-DD | ""',
    duration_days: 'number',
    priority: '"high" | "medium" | "low"',
    status: '"todo" | "in_progress" | "done" | "blocked"',
    dependency: 'string',
    note: 'string',
    confidence: 'number 0~1',
    source_text: 'string',
    refinement_flags: 'string[]',
    ai_touched_fields: 'string[]',
  };

  return JSON.stringify(
    {
      instruction: [
        '규칙 기반 task 후보를 정돈해 tasks 배열(JSON)만 반환하세요.',
        '문서 근거 없는 날짜/담당자/dependency 생성 금지.',
        '모호한 일정 표현은 note에 남기고 confidence를 낮게 유지.',
      ],
      base_date: baseDate,
      source_text: sourceText,
      parser_tasks: parserTasks,
      required_output_shape: { tasks: [taskSchema] },
    },
    null,
    2,
  );
}

import { normalizeTask } from './model.js';

/**
 * Mock parser for the first MVP phase.
 * @param {string} sourceText
 */
export function parseTasksFromText(sourceText) {
  const hasRisk = sourceText.includes('리스크') || sourceText.toLowerCase().includes('risk');

  const tasks = [
    {
      id: 'T-001',
      task_name: '요구사항 확정',
      parent_task: '기획',
      owner: '기획팀',
      start_date: '2026-03-10',
      end_date: '2026-03-13',
      duration_days: 0,
      priority: 'high',
      status: 'in_progress',
      dependency: '',
      note: '핵심 범위 동결',
      confidence: 0.88,
    },
    {
      id: 'T-002',
      task_name: '디자인 시안 1차',
      parent_task: '디자인',
      owner: '디자인팀',
      start_date: '2026-03-11',
      end_date: '2026-03-14',
      duration_days: 0,
      priority: 'medium',
      status: 'todo',
      dependency: 'T-001',
      note: '메인 플로우 우선',
      confidence: 0.83,
    },
    {
      id: 'T-003',
      task_name: '백엔드 API 개발',
      parent_task: '개발',
      owner: '개발팀',
      start_date: '2026-03-15',
      end_date: '2026-03-29',
      duration_days: 0,
      priority: 'high',
      status: 'todo',
      dependency: 'T-001',
      note: '인증/업무 API 포함',
      confidence: 0.8,
    },
    {
      id: 'T-004',
      task_name: '프론트엔드 통합',
      parent_task: '개발',
      owner: 'FE팀',
      start_date: '2026-03-30',
      end_date: '2026-04-03',
      duration_days: 0,
      priority: 'high',
      status: 'todo',
      dependency: 'T-002,T-003',
      note: '핵심 화면 연결',
      confidence: 0.78,
    },
    {
      id: 'T-005',
      task_name: 'QA 집중 테스트',
      parent_task: '검증',
      owner: 'QA팀',
      start_date: '2026-04-01',
      end_date: '2026-04-05',
      duration_days: 0,
      priority: 'medium',
      status: 'todo',
      dependency: 'T-004',
      note: '회귀/시나리오 테스트',
      confidence: 0.76,
    },
    {
      id: 'T-006',
      task_name: '배포 리허설 및 정식 배포',
      parent_task: '배포',
      owner: '플랫폼팀',
      start_date: '2026-04-06',
      end_date: '2026-04-08',
      duration_days: 0,
      priority: 'high',
      status: hasRisk ? 'blocked' : 'todo',
      dependency: 'T-005',
      note: hasRisk ? '외부 연동 지연 리스크 점검 필요' : '배포 체크리스트 완료 필요',
      confidence: hasRisk ? 0.68 : 0.74,
    },
  ];

  return tasks.map(normalizeTask);
}

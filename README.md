# process_map

붙여넣기 기반 AI 프로젝트 일정관리 MVP입니다.

## 실행
```bash
python3 -m http.server 5173
```

브라우저에서 `http://localhost:5173` 접속.

## 3단계 파이프라인
- 입력 텍스트
- 규칙 기반 parser(`src/parser/*`) 실행
- task 후보 생성
- LLM 보정(`src/llm/task-refiner.js`) 시도
- 성공 시 LLM 보정 결과, 실패 시 규칙 결과 fallback

## 핵심 동작
- 파일 업로드 없이 textarea 입력만 사용
- 규칙 기반 결과 / LLM 보정 결과 토글
- LLM 상태 배지 및 fallback 메시지 표시
- 행별 `AI 보정` 배지 + `근거/변경` 상세에서 변경 필드 diff 확인
- `source_text` 근거 유지
- editable 테이블 + 날짜 변경 시 간트 동기 갱신

## 설정 (`src/config.js`)
- `enableLLMRefinement`
- `llmTimeoutMs`
- `maxTasksForRefinement`
- `maxSourceCharsForLLM`
- `compareModeEnabled`
- `llmModel`
- `openAIBaseUrl`
- `openAIApiKey` (또는 `localStorage.OPENAI_API_KEY`)

## LLM 스키마/안전장치
- LLM 출력은 JSON only 요청
- 필수 필드: `id, task_name, parent_task, owner, start_date, end_date, duration_days, priority, status, dependency, note, confidence, source_text, refinement_flags, ai_touched_fields`
- JSON parse 실패/스키마 실패/timeout/API키 없음 등은 자동 fallback

## 구조
- `src/parser/`: 규칙 기반 추출
- `src/llm/`: 프롬프트, OpenAI 어댑터, 스키마 검증, 리파이너
- `src/pipeline/task-pipeline.js`: parser -> llm_refiner 파이프라인
- `src/model.js`: Task 타입/정규화
- `src/state.js`: parser/refined 상태 분리
- `src/table.js`: editable 테이블 + 근거/변경 표시
- `src/main.js`: UI 이벤트/토글/배지/렌더 연결

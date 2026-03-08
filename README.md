# process_map

붙여넣기 기반 AI 프로젝트 일정관리 MVP입니다.

## 실행
```bash
python3 -m http.server 5173
```

브라우저에서 `http://localhost:5173` 접속.

## 1단계 + 2단계 포함 기능
- 파일 업로드 없이 textarea 붙여넣기 입력
- 규칙 기반 parser(정규식/문장 분해)로 task 자동 추출
- 날짜/담당자/상태/우선순위/dependency 추출 및 confidence 계산
- `source_text` 근거 저장 + 테이블에서 `근거 보기`
- editable task 테이블
- start/end 변경 시 duration 재계산 및 간트차트 즉시 갱신
- 입력 짧음/무추출/파서오류 안내 메시지

## 구조
- `src/model.js`: Task 타입/정규화
- `src/parser/`: 규칙 기반 parser 모듈
  - `preprocess.js`: 줄/문장 분해
  - `date-rules.js`: 날짜 규칙
  - `rules.js`: owner/status/priority/dependency/task명 규칙
  - `index.js`: parser orchestration
  - `schema.js`: parser 스키마 타입
- `src/state.js`: 상태 저장소
- `src/table.js`: editable 테이블 + 근거 확장행
- `src/gantt.js`: 간트 렌더
- `src/main.js`: UI 이벤트/메시지/렌더 연결

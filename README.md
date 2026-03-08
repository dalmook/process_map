# process_map

붙여넣기 기반 AI 프로젝트 일정관리 MVP 1차 골격입니다.

## 실행
정적 파일 기반이라 별도 빌드 없이 실행 가능합니다.

```bash
python3 -m http.server 5173
```

브라우저에서 `http://localhost:5173` 접속.

## 포함 기능
- 큰 textarea + `일정표 생성` 버튼
- mock parser 기반 task 6개 생성
- editable task 테이블
- start_date/end_date 기반 간트차트 렌더링
- 셀 수정 시 상태 즉시 반영 (날짜 변경 시 duration_days, 간트 동기 갱신)

## 구조
- `src/model.js`: Task 타입/컬럼/정규화
- `src/parser.js`: mock parser
- `src/state.js`: 상태 저장소 및 구독
- `src/table.js`: editable 테이블 렌더
- `src/gantt.js`: 간트 렌더
- `src/main.js`: UI 이벤트 및 모듈 연결

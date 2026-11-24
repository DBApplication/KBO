# DIAMOND / KBO

날짜별 경기 결과와 박스스코어, 시즌별 선수 기록과 팀 순위, 두 선수의 같은 시즌 기록을 조회하는 반응형 웹 앱입니다. 홈은 일별 출전 기록이 있는 2025년 6월 1일로 열립니다.

모든 화면은 백엔드 API(Spring Boot)를 거쳐 **PostgreSQL에서** 데이터를 읽습니다.

## 실행

1. 백엔드를 켜고 데이터를 넣습니다 (처음 한 번). 저장소 루트에서:

   ```sh
   cd backend && ./gradlew bootRun          # Docker Desktop 켜고. Flyway V1~V3 자동 적용
   # 다른 터미널, 저장소 루트에서
   scripts/db/load_csv.sh frontend/public/data frontend/public/data/daily
   ```

2. 화면을 켭니다. Node.js 22.12 이상과 pnpm(10 이상, `corepack enable` 로 켤 수 있음), `frontend` 폴더에서:

   ```sh
   pnpm install
   pnpm dev
   ```

터미널에 출력된 로컬 주소를 엽니다. 개발 서버는 `/api` 요청을 `http://localhost:8080`으로 넘깁니다 (`vite.config.js`, 다른 주소면 `KBO_API_URL`). `pnpm build`는 정적 배포본을 `dist/`에 만들고 `pnpm preview`도 같은 방식으로 API를 넘깁니다.

`pnpm test`(Vitest + Testing Library)는 화면을 실제로 그려 보고 API 응답 변환을 검사합니다. 백엔드 응답을 녹화한 `src/test-fixtures/api.json`으로 돌기 때문에 서버 없이 실행됩니다. 데이터가 바뀌면 서버를 켠 상태에서 `KBO_RECORD_API=http://localhost:8080 pnpm test`로 다시 녹화합니다.

## 구조

React 19 · TypeScript · React Router 7 · TanStack Query 5 · Vite. 주소는 해시 방식(`#/players?season=2025`)이라 `dist/`를 어느 정적 서버에 올려도 새로고침이 됩니다.

```
src/
  main.tsx            진입점 (QueryClientProvider + 해시 라우터)
  routes.tsx          화면 주소 ↔ 화면 모듈. 루트 로더가 팀·시즌 목록을 한 번 받는다
  api/types.ts        백엔드 DTO 타입 (backend/**/dto 와 1:1, 백엔드를 바꾸면 같이 고친다)
  api/client.ts       엔드포인트별 fetch 함수와 ApiError
  api/queries.ts      TanStack Query 옵션(queryKey + queryFn)과 QueryClient 설정
  hooks.ts            useUrl (주소의 조회 조건), useReference (팀·시즌 목록)
  lib/query.ts        주소 읽기·만들기, 페이지 계산
  lib/format.ts       기록 표시 형식, 날짜, 정렬
  lib/stats.ts        기록표 열 정의 (머리글·값·형식·서버 정렬 키)
  components/         Layout(머리글·메뉴·오류), common(표·빈 상태·링크), controls(필터·탭·검색·페이지)
  pages/              화면마다 loader(쿼리를 미리 채움) + 컴포넌트(useSuspenseQuery 로 읽음)
```

데이터 흐름: 주소가 바뀌면 그 화면의 로더가 필요한 쿼리를 `queryClient.ensureQueryData`로 채우고, 컴포넌트는 같은 쿼리 옵션으로 `useSuspenseQuery`를 불러 캐시에서 바로 읽습니다. 받은 응답은 5분 동안 다시 요청하지 않고(팀·시즌 목록은 계속), 4xx 오류는 재시도하지 않습니다. 필터·정렬·페이지는 모두 주소에 남으므로 뒤로 가기와 새로고침에도 유지됩니다.

`pnpm typecheck`로 타입 검사만 따로 할 수 있고, `pnpm build`는 타입 검사 후 빌드합니다.

## 화면별 API

| 화면 | API |
|---|---|
| 처음 한 번 | `GET /api/teams`, `GET /api/standings/seasons`(팀 기록 시즌), `GET /api/records/seasons`(선수 기록·비교 시즌) |
| 홈 · 일별 선수 기록 | `GET /api/matches?date=`, `GET /api/matches/player-records?date=` |
| 경기 기록 | `GET /api/matches?date=&teamId=&status=`, 주간 달력의 경기 있는 날은 `GET /api/matches/dates?from=&to=` |
| 경기 상세 | `GET /api/matches/{id}` (점수판·하이라이트·주요 기록·출전 선수) |
| 선수 기록 | `GET /api/records/batters`·`/pitchers` (시즌·팀·이름·최소 타석/이닝·정렬·페이지) |
| 선수 상세 | `GET /api/players/{id}`, `/api/players/{id}/records/batter`·`/pitcher` |
| 팀 기록 | `GET /api/standings?season=` |
| 선수 비교 | `GET /api/records/batters/compare`·`/pitchers/compare`, 선수 선택은 `/api/records/...?keyword=` |
| 검색 | `GET /api/players?keyword=` (팀은 처음 받은 팀 목록에서) |

API 호출과 응답 변환은 `api.js` 한 곳에 있습니다. 같은 주소는 한 번만 요청합니다.

## 데이터 범위

- `public/data/`의 2024~2026시즌 CSV는 화면이 직접 읽지 않고, `scripts/db/load_csv.sh`로 DB에 넣을 때 씁니다.
- 경기별 박스스코어(이닝 점수·출전 선수·주요 기록)는 2025년 6월 1일 하루치만 있습니다. 다른 날짜에 종료 경기가 있어도 박스스코어가 없으면 미수집 상태가 표시됩니다.
- 선수 ID가 확정되지 않은 일별 출전 기록(동명이인 등)은 이름과 경기 성적만 표시하고 선수 상세로 연결하지 않습니다. 비어 있는 값은 —로, 기록된 0은 0으로 표시합니다.
- 선수 사진과 영상은 DB에 저장된 외부 주소를 사용합니다.

[팀 Figma 시안](https://www.figma.com/design/u3TEgDETr63vpLlDWwZUqJ/)

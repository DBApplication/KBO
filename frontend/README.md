# DIAMOND / KBO

날짜별 경기 결과와 박스스코어, 시즌별 선수 기록과 팀 순위, 두 선수의 같은 시즌 기록을 조회하는 반응형 웹 앱입니다. 홈은 일별 출전 기록이 있는 2025년 6월 1일로 열립니다.

모든 화면은 백엔드 API(Spring Boot)를 거쳐 **PostgreSQL에서** 데이터를 읽습니다.

## 실행

1. 백엔드를 켜고 데이터를 넣습니다 (처음 한 번). 저장소 루트에서:

   ```sh
   cd backend && ./gradlew bootRun          # Docker Desktop 켜고. Flyway V1~V3 자동 적용
   # 다른 터미널, 저장소 루트에서
   scripts/db/load_csv.sh                   # data/ 의 CSV 를 DB 에 넣음
   ```

2. 화면을 켭니다. Node.js 22.12 이상과 pnpm(10 이상, `corepack enable` 로 켤 수 있음), `frontend` 폴더에서:

   ```sh
   pnpm install
   pnpm dev
   ```

터미널에 출력된 로컬 주소를 엽니다. 개발 서버는 `/api` 요청을 `http://localhost:8080`으로 넘깁니다 (`vite.config.js`, 다른 주소면 `KBO_API_URL`). `pnpm build`는 정적 배포본을 `dist/`에 만들고 `pnpm preview`도 같은 방식으로 API를 넘깁니다.

`pnpm test`(Vitest + Testing Library)는 화면을 실제로 그려 보고 API 응답 변환을 검사합니다. 백엔드 응답을 녹화한 `tests/fixtures/api.json`으로 돌기 때문에 서버 없이 실행됩니다. 데이터가 바뀌면 서버를 켠 상태에서 `KBO_RECORD_API=http://localhost:8080 pnpm test`로 다시 녹화합니다.

## 구조

React 19 · TypeScript · React Router 7 · TanStack Query 5 · axios · Vite. 주소는 해시 방식(`#/players?season=2025`)이라 `dist/`를 어느 정적 서버에 올려도 새로고침이 됩니다.

```
src/
├── api/           # 백엔드 API 호출 함수 — 엔드포인트 하나에 함수 하나 (team·player·match·record·standing)
├── components/    # 공통 컴포넌트 (표·빈 상태·링크·필터 드롭다운·페이지 이동), layout/ (머리글·메뉴·오류 화면)
├── constants/     # 라우트(ROUTES·메뉴) · API 엔드포인트(ENDPOINTS) · 기본값
├── features/      # 기능 단위 모듈
│   ├── team/ player/ match/ record/ standing/   # 도메인별 TanStack 쿼리(queries.ts) + 도메인 컴포넌트
│   ├── filters/   # 팀·시즌·타자/투수·날짜 선택
│   ├── search/    # 검색 폼
│   └── compare/   # 선수 비교 데이터 조합 · 선수 선택 창
├── hooks/         # 커스텀 훅 (useUrl, useTeams, useRecordSeasons, useStandingSeasons, useDebounced)
├── lib/           # axios 클라이언트(baseURL /api, 에러 → ApiError) · QueryClient 설정
├── pages/         # 화면마다 폴더: <이름>Page.tsx + loader.ts (+ 화면 전용 파일)
│   ├── Home/ Daily/ Games/ Game/ Players/ Player/ Teams/ Compare/ Search/ NotFound/
├── types/         # 백엔드 DTO 타입 (도메인별 파일)
├── utils/         # 표시 형식 · 주소 만들기/읽기
├── main.tsx       # 진입점
└── router.tsx     # 화면 경로 ↔ 페이지·로더
tests/             # Vitest 화면 테스트와 녹화된 API 응답(fixtures/api.json)
```

- 각 폴더는 `index.ts`로 내보내고, 다른 폴더에서는 `@/components`, `@/features/match`처럼 가져옵니다 (`@/` = `src/`). 같은 폴더 안에서는 상대 경로를 씁니다.
- 백엔드 API 경로는 `constants/endpoints.ts`, 화면 경로는 `constants/routes.ts`의 `ROUTES`로만 씁니다.
- API 호출 흐름: `api/<도메인>.ts`(axios 로 엔드포인트 호출) → `features/<도메인>/queries.ts`(TanStack `queryOptions`) → 화면. 화면 컴포넌트에서 `api/`를 직접 부르지 않습니다. 화면은 `loader.ts`에서 `queryClient.ensureQueryData`로 미리 받고, 컴포넌트에서 같은 쿼리를 `useSuspenseQuery`로 읽습니다. 받은 응답은 5분 동안 다시 요청하지 않고(팀·시즌 목록은 계속), 4xx 오류는 재시도하지 않습니다.

`pnpm typecheck`로 타입 검사만, `pnpm build`는 타입 검사 후 빌드합니다.

## API 연결 목록

백엔드 엔드포인트 16개를 모두 `src/api/`에서 호출합니다 (Swagger: http://localhost:8080/swagger-ui.html).

| 엔드포인트 | 호출 함수 (`src/api/`) | Swagger 설명 |
|---|---|---|
| `GET /api/teams` | `fetchTeams` (team.ts) | 있음 |
| `GET /api/standings?season=` | `fetchStandings` (standing.ts) | 없음 (StandingsController) |
| `GET /api/standings/seasons` | `fetchStandingSeasons` (standing.ts) | 없음 (StandingsController) |
| `GET /api/matches?date=&teamId=&status=` | `fetchMatches` (match.ts) | 없음 (MatchController) |
| `GET /api/matches/dates?from=&to=&teamId=` | `fetchMatchDates` (match.ts) | 없음 (MatchController) |
| `GET /api/matches/{id}` | `fetchMatch` (match.ts) | 없음 (MatchController) |
| `GET /api/matches/player-records?date=` | `fetchDailyRecords` (match.ts) | 없음 (MatchController) |
| `GET /api/players?keyword=&teamId=&type=&page=&size=` | `fetchPlayers` (player.ts) | 있음 |
| `GET /api/players/{id}` | `fetchPlayer` (player.ts) | 있음 |
| `GET /api/players/{id}/records/batter` · `/pitcher` | `fetchPlayerHistory` (record.ts) | 있음 |
| `GET /api/records/seasons` | `fetchRecordSeasons` (record.ts) | 있음 |
| `GET /api/records/batters` · `/pitchers` | `fetchRanking` (record.ts) | 있음 |
| `GET /api/records/batters/compare` · `/pitchers/compare` | `fetchComparison` (record.ts) | 있음 |

"없음"은 컨트롤러에 `@Tag`/`@Operation`이 없어 Swagger 에 설명 없이 경로만 나오는 API 입니다. 코드(`backend/.../controller`, DTO)를 기준으로 연결했습니다.

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

- 원본 CSV(2024~2026시즌)는 저장소 루트의 `data/`에 있고 `scripts/db/load_csv.sh`로 DB에 넣습니다. 프론트엔드는 CSV를 갖고 있지 않고, 모든 화면이 백엔드 API 응답만 표시합니다.
- 경기별 박스스코어(이닝 점수·출전 선수·주요 기록)는 2025년 6월 1일 하루치만 있습니다. 다른 날짜에 종료 경기가 있어도 박스스코어가 없으면 미수집 상태가 표시됩니다.
- 선수 ID가 확정되지 않은 일별 출전 기록(동명이인 등)은 이름과 경기 성적만 표시하고 선수 상세로 연결하지 않습니다. 비어 있는 값은 —로, 기록된 0은 0으로 표시합니다.
- 선수 사진과 영상은 DB에 저장된 외부 주소를 사용합니다.

[팀 Figma 시안](https://www.figma.com/design/u3TEgDETr63vpLlDWwZUqJ/)

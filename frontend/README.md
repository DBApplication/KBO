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

2. 화면을 켭니다. Node.js 22.12 이상, `frontend` 폴더에서:

   ```sh
   npm ci
   npm run dev
   ```

터미널에 출력된 로컬 주소를 엽니다. 개발 서버는 `/api` 요청을 `http://localhost:8080`으로 넘깁니다 (`vite.config.js`, 다른 주소면 `KBO_API_URL`). `npm run build`는 정적 배포본을 `dist/`에 만들고 `npm run preview`도 같은 방식으로 API를 넘깁니다.

`npm test`는 화면 상태와 API 응답 변환을 검사합니다. 백엔드 응답을 녹화한 `test/fixtures/api.json`으로 돌기 때문에 서버 없이 실행됩니다. 데이터가 바뀌면 서버를 켠 상태에서 `KBO_RECORD_API=http://localhost:8080 npm test`로 다시 녹화합니다.

## 화면별 API

| 화면 | API |
|---|---|
| 처음 한 번 | `GET /api/teams`, `GET /api/standings/seasons` |
| 홈 · 일별 선수 기록 | `GET /api/matches?date=`, `GET /api/matches/player-records?date=` |
| 경기 기록 | `GET /api/matches?date=&teamId=&status=` |
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

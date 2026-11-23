# CSV → DB 적재

2024~2026 KBO CSV 를 Flyway V1·V2 가 적용된 PostgreSQL 에 넣는 스크립트입니다.

```bash
# 1) 서버를 한 번 띄워서 V1·V2 마이그레이션을 적용 (compose 의 PostgreSQL 이 자동으로 뜸)
cd backend && ./gradlew bootRun

# 2) 다른 터미널에서 저장소 루트 기준으로 적재
scripts/db/load_csv.sh <CSV 폴더> [박스스코어 폴더]
# 예) frontend 브랜치의 CSV 를 쓰는 경우
scripts/db/load_csv.sh frontend/public/data frontend/public/data/daily
```

- 넣는 순서: team → player → matches → match_highlight → 타자·투수 시즌 기록 → 팀 순위 → (박스스코어 폴더를 주면) 경기별 R/H/E·이닝 득점
- KBO 원본 키(`team.code`, `player.kbo_player_id`, `matches.kbo_game_id`)로 **UPSERT** 하므로 몇 번을 돌려도 행 수가 같습니다.
- 전체가 **한 트랜잭션**입니다. 끝에 `check.sql` 이 아래를 검사하고, 하나라도 틀리면 전부 롤백합니다.
  - 팀 코드·선수 ID 매핑에 실패한 CSV 행이 없는지
  - 시즌·기준일마다 순위표가 10개 팀인지
  - 이닝 득점 합 = R = 경기 점수인지
- 맥에 `psql` 이 없으면 compose 의 `kbo-postgres` 컨테이너 안의 psql 로 자동 실행합니다.
- 접속 정보는 `PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD` (기본 localhost:5434, kbo/kbo).

필요한 CSV: `team, player, matches, match_highlight, batter_season_record, pitcher_season_record, team_season_record` (.csv)
박스스코어 폴더: `team_game_stats.csv, team_innings.csv` (지금은 2025-06-01 하루치만 있음)

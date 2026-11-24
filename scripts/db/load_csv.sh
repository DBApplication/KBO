#!/usr/bin/env bash
# CSV(2024~2026 KBO 데이터) → PostgreSQL 적재.
#   Flyway V1~V3 가 적용된 DB(서버를 한 번 띄우면 자동 적용)에 실행한다.
#   KBO 원본 키(team.code, kbo_player_id, kbo_game_id)로 UPSERT 하므로 여러 번 돌려도 중복이 생기지 않는다.
#   전체가 한 트랜잭션이라 중간에 하나라도 실패하면 아무것도 바뀌지 않는다.
#
# 사용법:
#   scripts/db/load_csv.sh <CSV 폴더> [일별 박스스코어 폴더]
#   예) scripts/db/load_csv.sh frontend/public/data frontend/public/data/daily
# 접속 정보는 PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD 환경변수 (기본: localhost:5434 kbo/kbo).
set -euo pipefail

DATA_DIR="$(cd "${1:?CSV 폴더를 넣어 주세요}" && pwd)"
DAILY_DIR="${2:-}"
[ -n "$DAILY_DIR" ] && DAILY_DIR="$(cd "$DAILY_DIR" && pwd)"

export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5434}" PGDATABASE="${PGDATABASE:-kbo}"
export PGUSER="${PGUSER:-kbo}" PGPASSWORD="${PGPASSWORD:-kbo}"

for f in team player matches match_highlight batter_season_record pitcher_season_record team_season_record; do
  [ -f "$DATA_DIR/$f.csv" ] || { echo "없음: $DATA_DIR/$f.csv" >&2; exit 1; }
done

SQL_DIR="$(cd "$(dirname "$0")" && pwd)"

# psql 이 없으면(맥 기본 상태) compose 의 kbo-postgres 컨테이너 안의 psql 을 쓴다.
CONTAINER="${KBO_PG_CONTAINER:-kbo-postgres}"
if command -v psql >/dev/null 2>&1; then
  RUN=(psql -X -q -1 -v ON_ERROR_STOP=1)
  SRC_DATA="$DATA_DIR"; SRC_DAILY="$DAILY_DIR"
else
  echo "psql 이 없어서 $CONTAINER 컨테이너 안에서 실행합니다."
  docker exec "$CONTAINER" rm -rf /tmp/kbo_load
  docker exec "$CONTAINER" mkdir -p /tmp/kbo_load/daily
  docker cp "$DATA_DIR/." "$CONTAINER:/tmp/kbo_load/"
  [ -n "$DAILY_DIR" ] && docker cp "$DAILY_DIR/." "$CONTAINER:/tmp/kbo_load/daily/"
  RUN=(docker exec -i "$CONTAINER" psql -X -q -1 -v ON_ERROR_STOP=1 -U "$PGUSER" -d "$PGDATABASE")
  SRC_DATA=/tmp/kbo_load; SRC_DAILY=/tmp/kbo_load/daily
fi

{
  echo "\\set ON_ERROR_STOP on"
  sed "s#__DATA_DIR__#${SRC_DATA}#g" "$SQL_DIR/load_season.sql"
  if [ -n "$DAILY_DIR" ]; then
    sed "s#__DAILY_DIR__#${SRC_DAILY}#g" "$SQL_DIR/load_boxscore.sql"
  fi
  cat "$SQL_DIR/check.sql"
} | "${RUN[@]}"

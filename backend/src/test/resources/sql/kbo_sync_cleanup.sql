-- KboSyncTest 뒤 정리: 같은 컨테이너 DB 를 쓰는 다른 테스트에 수집 결과가 남지 않게 한다.
-- team_ticket_site 는 V5 마이그레이션이 넣는 기준 데이터라 지우지 않는다.
TRUNCATE kbo_sync_run, match_event, batter_match_record, pitcher_match_record, match_inning_score,
    match_team_record, match_highlight, team_season_record, batter_season_record, pitcher_season_record,
    matches, player, team RESTART IDENTITY CASCADE;

-- MatchAndStandingsApiTest 뒤 정리: 같은 컨테이너 DB 를 쓰는 다른 테스트(ScreenApiTest 등)에
-- 시드 데이터와 고정 id 가 남지 않도록 비우고 시퀀스를 처음으로 돌린다.
TRUNCATE match_inning_score, match_team_record, match_highlight, team_season_record,
    batter_season_record, pitcher_season_record, matches, player, team RESTART IDENTITY CASCADE;

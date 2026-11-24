-- KboSyncTest: 수집 대상 경기에 나오는 팀만 넣는다 (선수는 넣지 않아 경기 기록은 이름으로만 남는다).
TRUNCATE kbo_sync_run, match_event, batter_match_record, pitcher_match_record, match_inning_score,
    match_team_record, match_highlight, team_season_record, matches, player, team RESTART IDENTITY CASCADE;

INSERT INTO team (code, name, short_name, home_stadium) VALUES
    ('OB', '두산 베어스', '두산', '잠실야구장'),
    ('WO', '키움 히어로즈', '키움', '고척스카이돔'),
    ('HT', 'KIA 타이거즈', 'KIA', '광주-기아 챔피언스 필드'),
    ('LG', 'LG 트윈스', 'LG', '잠실야구장');

TRUNCATE match_event, batter_match_record, pitcher_match_record, match_inning_score, match_team_record, match_highlight, team_season_record,
    batter_season_record, pitcher_season_record, matches, player, team RESTART IDENTITY CASCADE;

INSERT INTO team (id, code, name, short_name, home_stadium) VALUES
    (1, 'OB', '두산 베어스', '두산', '잠실야구장'),
    (2, 'WO', '키움 히어로즈', '키움', '고척스카이돔');

INSERT INTO matches (id, kbo_game_id, season, match_date, match_time, home_team_id, away_team_id,
                     home_score, away_score, stadium, status, ticket_url, sequence, doubleheader) VALUES
    (10, '20250601_OBWO0', 2025, '2025-06-01', '14:00', 2, 1, 1, 0, '고척', 'FINISHED', NULL, 3, 0),
    (11, '20250601_WOOB0', 2025, '2025-06-01', '18:30', 1, 2, NULL, NULL, '잠실', 'CANCELED', NULL, NULL, 0),
    (12, '20250602_OBWO0', 2025, '2025-06-02', '18:30', 2, 1, NULL, NULL, '고척', 'SCHEDULED', 'https://ticket.example.com/12', 1, 0),
    (14, '20250603_OBWO0', 2025, '2025-06-03', '18:30', 2, 1, 3, 3, '고척', 'FINISHED', NULL, 2, 0);

INSERT INTO match_highlight (match_id, title, url) VALUES
    (10, '[두산 vs 키움] 6/1 하이라이트', 'https://www.youtube.com/watch?v=a'),
    (14, '[두산 vs 키움] 6/3 하이라이트', 'https://www.youtube.com/watch?v=b'),
    (14, '[두산 vs 키움] 6/3 주요 장면', 'https://www.youtube.com/watch?v=c');

INSERT INTO match_team_record (match_id, team_id, home_away, runs, hits, errors, bb_hbp) VALUES
    (10, 1, 'AWAY', 0, 9, 2, 3),
    (10, 2, 'HOME', 1, 5, 1, 0);

INSERT INTO match_inning_score (match_id, home_away, inning, runs)
SELECT 10, 'AWAY', i, 0 FROM generate_series(1, 9) i
UNION ALL
SELECT 10, 'HOME', i, CASE WHEN i = 2 THEN 1 ELSE 0 END FROM generate_series(1, 8) i;

INSERT INTO team_season_record (team_id, season, as_of_date, team_rank, games, wins, losses, draws,
                                win_pct, games_behind, last10, streak) VALUES
    (2, 2025, '2025-06-01', 1, 60, 35, 25, 0, 0.583, 0.0, '6승0무4패', '1승'),
    (1, 2025, '2025-06-01', 2, 60, 30, 30, 0, 0.500, 5.0, '5승0무5패', '1패'),
    (1, 2025, '2025-10-31', 1, 144, 80, 60, 4, 0.571, 0.0, '7승0무3패', '2승'),
    (2, 2025, '2025-10-31', 2, 144, 47, 93, 4, 0.336, 33.0, '3승0무7패', '5패'),
    (1, 2024, '2024-10-31', 1, 144, 74, 68, 2, 0.521, 0.0, '5승0무5패', '1승'),
    (2, 2024, '2024-10-31', 2, 144, 58, 86, 0, 0.403, 17.0, '4승0무6패', '2패');

-- V3 경기별 선수 기록 (6/1 두산-키움). 김민석은 동명이인이라 선수 연결 없음(player_id NULL).
INSERT INTO player (id, kbo_player_id, team_id, name, position) VALUES
    (100, 51264, 1, '최승용', '투수'),
    (101, 67341, 2, '김재현', '포수');

INSERT INTO batter_match_record (match_id, team_id, home_away, seq, player_id, player_name, batting_order, position,
                                 pa, ab, hits, doubles, triples, home_runs, rbi, runs, walks, hit_by_pitch,
                                 strikeouts, sac_flies) VALUES
    (10, 1, 'AWAY', 1, NULL, '김민석', 1, '좌', 5, 4, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0),
    (10, 2, 'HOME', 1, 101, '김재현', 8, '포', 4, 3, 2, 1, 0, 0, 1, 0, 1, 0, 0, 0);

INSERT INTO pitcher_match_record (match_id, team_id, home_away, seq, player_id, player_name, is_starter, decision,
                                  outs, batters_faced, pitches, hits_allowed, home_runs_allowed, bb_hbp,
                                  strikeouts, runs_allowed, earned_runs) VALUES
    (10, 1, 'AWAY', 1, 100, '최승용', true, 'L', 19, 25, 95, 5, 0, 0, 6, 1, 1);

INSERT INTO match_event (match_id, event_type, item_no, description) VALUES
    (10, '결승타', 1, '김재현(2회 2사 1,2루서 중전 안타)');

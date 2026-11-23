TRUNCATE match_inning_score, match_team_record, match_highlight, team_season_record,
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

-- 경기별 R/H/E 와 이닝별 득점 적재 (박스스코어를 수집한 날짜만). load_csv.sh 가 __DAILY_DIR__ 을 바꿔 넣는다.
-- 입력: team_game_stats.csv(팀 합계), team_innings.csv(이닝별) — game_id 는 matches.kbo_game_id 와 같다.

CREATE TEMP TABLE s_team_game (
    game_id text, team_side text, team_name text, source_team_idx text, runs text, hits text,
    errors text, walks_plus_hit_by_pitch text, result_source text) ON COMMIT DROP;
\copy s_team_game FROM '__DAILY_DIR__/team_game_stats.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO match_team_record (match_id, team_id, home_away, runs, hits, errors, bb_hbp)
SELECT m.id,
       CASE WHEN s.team_side = 'home' THEN m.home_team_id ELSE m.away_team_id END,
       upper(s.team_side), s.runs::int, s.hits::int, s.errors::int,
       NULLIF(s.walks_plus_hit_by_pitch, '')::int
FROM s_team_game s
JOIN matches m ON m.kbo_game_id = s.game_id
ON CONFLICT (match_id, home_away) DO UPDATE
    SET team_id = EXCLUDED.team_id, runs = EXCLUDED.runs, hits = EXCLUDED.hits,
        errors = EXCLUDED.errors, bb_hbp = EXCLUDED.bb_hbp;

CREATE TEMP TABLE s_inning (
    game_id text, team_side text, team_name text, inning text, runs text, raw_value text,
    status text) ON COMMIT DROP;
\copy s_inning FROM '__DAILY_DIR__/team_innings.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

-- 공격하지 않은 이닝(status = not_played, '-')은 넣지 않는다.
INSERT INTO match_inning_score (match_id, home_away, inning, runs)
SELECT m.id, upper(s.team_side), s.inning::int, s.runs::int
FROM s_inning s
JOIN matches m ON m.kbo_game_id = s.game_id
WHERE s.status = 'recorded'
ON CONFLICT (match_id, home_away, inning) DO UPDATE SET runs = EXCLUDED.runs;

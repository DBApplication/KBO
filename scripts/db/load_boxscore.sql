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

-- ---------------------------------------------------------------------
-- 경기별 선수 기록 (V3). 입력: batting.csv, pitching.csv, game_events.csv
--   선수는 KBO 선수 ID(player_id 열)가 있을 때만 player 와 연결하고, 없으면 이름만 둔다.
--   타율·OPS·경기 ERA 같은 비율 기록은 넣지 않는다 (API 가 계산).
-- ---------------------------------------------------------------------
CREATE TEMP TABLE s_bat_game (
    game_id text, team_side text, team_name text, source_team_idx text, player_name text,
    position_raw text, at_bats text, hits text, rbi text, runs text, source_row_no text,
    player_id text, player_id_status text, batting_order text, position_text text,
    plate_appearances text, singles text, doubles text, triples text, home_runs text, walks text,
    intentional_walks text, hit_by_pitch text, strikeouts text, sacrifice_bunts text,
    sacrifice_flies text, grounded_into_double_plays text, total_bases text, batting_average text,
    on_base_percentage text, slugging_percentage text, ops text, events_status text) ON COMMIT DROP;
\copy s_bat_game FROM '__DAILY_DIR__/batting.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO batter_match_record (match_id, team_id, home_away, seq, player_id, player_name, batting_order,
                                 position, pa, ab, hits, doubles, triples, home_runs, rbi, runs, walks,
                                 hit_by_pitch, strikeouts, sac_flies)
SELECT m.id,
       CASE WHEN s.team_side = 'home' THEN m.home_team_id ELSE m.away_team_id END,
       upper(s.team_side), s.source_row_no::int, p.id, s.player_name, NULLIF(s.batting_order, '')::int,
       NULLIF(s.position_text, ''), s.plate_appearances::int, s.at_bats::int, s.hits::int,
       s.doubles::int, s.triples::int, s.home_runs::int, s.rbi::int, s.runs::int, s.walks::int,
       s.hit_by_pitch::int, s.strikeouts::int, s.sacrifice_flies::int
FROM s_bat_game s
JOIN matches m ON m.kbo_game_id = s.game_id
LEFT JOIN player p ON p.kbo_player_id = NULLIF(s.player_id, '')::int
ON CONFLICT (match_id, home_away, seq) DO UPDATE
    SET team_id = EXCLUDED.team_id, player_id = EXCLUDED.player_id, player_name = EXCLUDED.player_name,
        batting_order = EXCLUDED.batting_order, position = EXCLUDED.position, pa = EXCLUDED.pa,
        ab = EXCLUDED.ab, hits = EXCLUDED.hits, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples,
        home_runs = EXCLUDED.home_runs, rbi = EXCLUDED.rbi, runs = EXCLUDED.runs, walks = EXCLUDED.walks,
        hit_by_pitch = EXCLUDED.hit_by_pitch, strikeouts = EXCLUDED.strikeouts, sac_flies = EXCLUDED.sac_flies;

CREATE TEMP TABLE s_pit_game (
    game_id text, team_side text, team_name text, source_team_idx text, player_name text,
    is_starter text, outs_recorded text, decision_raw text, strikeouts text,
    walks_plus_hit_by_pitch text, runs_allowed text, earned_runs text, pitches text,
    hits_allowed text, home_runs_allowed text, at_bats_against text, batters_faced text,
    source_row_no text, player_id text, player_id_status text, innings_raw text, decision text,
    decision_text text, decision_status text, appearance_raw text, source_season_wins text,
    source_season_losses text, source_season_saves text, source_season_era text,
    game_era text) ON COMMIT DROP;
\copy s_pit_game FROM '__DAILY_DIR__/pitching.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO pitcher_match_record (match_id, team_id, home_away, seq, player_id, player_name, is_starter,
                                  decision, outs, batters_faced, pitches, hits_allowed, home_runs_allowed,
                                  bb_hbp, strikeouts, runs_allowed, earned_runs)
SELECT m.id,
       CASE WHEN s.team_side = 'home' THEN m.home_team_id ELSE m.away_team_id END,
       upper(s.team_side), s.source_row_no::int, p.id, s.player_name, s.is_starter::boolean,
       NULLIF(NULLIF(s.decision, 'ND'), ''), s.outs_recorded::int, s.batters_faced::int,
       NULLIF(s.pitches, '')::int, s.hits_allowed::int, s.home_runs_allowed::int,
       s.walks_plus_hit_by_pitch::int, s.strikeouts::int, s.runs_allowed::int, s.earned_runs::int
FROM s_pit_game s
JOIN matches m ON m.kbo_game_id = s.game_id
LEFT JOIN player p ON p.kbo_player_id = NULLIF(s.player_id, '')::int
ON CONFLICT (match_id, home_away, seq) DO UPDATE
    SET team_id = EXCLUDED.team_id, player_id = EXCLUDED.player_id, player_name = EXCLUDED.player_name,
        is_starter = EXCLUDED.is_starter, decision = EXCLUDED.decision, outs = EXCLUDED.outs,
        batters_faced = EXCLUDED.batters_faced, pitches = EXCLUDED.pitches,
        hits_allowed = EXCLUDED.hits_allowed, home_runs_allowed = EXCLUDED.home_runs_allowed,
        bb_hbp = EXCLUDED.bb_hbp, strikeouts = EXCLUDED.strikeouts,
        runs_allowed = EXCLUDED.runs_allowed, earned_runs = EXCLUDED.earned_runs;

CREATE TEMP TABLE s_event (
    game_id text, event_type text, item_no text, description text, text_source text) ON COMMIT DROP;
\copy s_event FROM '__DAILY_DIR__/game_events.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO match_event (match_id, event_type, item_no, description)
SELECT m.id, s.event_type, s.item_no::int, s.description
FROM s_event s
JOIN matches m ON m.kbo_game_id = s.game_id
ON CONFLICT (match_id, event_type, item_no) DO UPDATE SET description = EXCLUDED.description;

-- 박스스코어 검사: 빠진 행이 없고, 팀 이름이 홈/원정 쪽 팀과 같고, KBO 선수 ID 는 전부 연결됐고,
-- 타자 안타·득점 합이 팀 H·R 과 같아야 한다. 어긋나면 전체 롤백.
DO $$
DECLARE
    bad int;
BEGIN
    IF (SELECT count(*) FROM s_bat_game) <> (SELECT count(*) FROM s_bat_game s JOIN matches m ON m.kbo_game_id = s.game_id)
       OR (SELECT count(*) FROM s_pit_game) <> (SELECT count(*) FROM s_pit_game s JOIN matches m ON m.kbo_game_id = s.game_id)
       OR (SELECT count(*) FROM s_event) <> (SELECT count(*) FROM s_event s JOIN matches m ON m.kbo_game_id = s.game_id) THEN
        RAISE EXCEPTION '경기별 선수 기록 일부가 경기 매핑에 실패했습니다.';
    END IF;

    SELECT count(*) INTO bad FROM (
        SELECT s.game_id, s.team_side, s.team_name FROM s_bat_game s
        UNION ALL SELECT s.game_id, s.team_side, s.team_name FROM s_pit_game s) s
    JOIN matches m ON m.kbo_game_id = s.game_id
    JOIN team t ON t.id = CASE WHEN s.team_side = 'home' THEN m.home_team_id ELSE m.away_team_id END
    WHERE t.short_name IS DISTINCT FROM s.team_name;
    IF bad > 0 THEN
        RAISE EXCEPTION '홈/원정 팀 이름이 경기와 맞지 않는 선수 기록이 %개 있습니다.', bad;
    END IF;

    SELECT count(*) INTO bad FROM (
        SELECT player_id FROM s_bat_game UNION ALL SELECT player_id FROM s_pit_game) s
    WHERE NULLIF(s.player_id, '') IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM player p WHERE p.kbo_player_id = s.player_id::int);
    IF bad > 0 THEN
        RAISE EXCEPTION 'player.csv 에 없는 KBO 선수 ID 가 %개 있습니다.', bad;
    END IF;

    SELECT count(*) INTO bad
    FROM match_team_record r
    JOIN (SELECT match_id, home_away, sum(hits) AS hits, sum(runs) AS runs
          FROM batter_match_record GROUP BY 1, 2) b USING (match_id, home_away)
    WHERE b.hits <> r.hits OR b.runs <> r.runs;
    IF bad > 0 THEN
        RAISE EXCEPTION '타자 안타·득점 합이 팀 H·R 과 다른 팀 기록이 %개 있습니다.', bad;
    END IF;
END $$;

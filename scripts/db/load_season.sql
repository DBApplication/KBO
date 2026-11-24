-- 시즌 데이터(팀·선수·경기·하이라이트·시즌 기록·순위) 적재. load_csv.sh 가 __DATA_DIR__ 을 바꿔 넣는다.
-- CSV 는 모두 text 로 임시 테이블에 받은 뒤, KBO 키 → 내부 id 로 바꿔서 UPSERT 한다.

-- ---------- team ----------
CREATE TEMP TABLE s_team (code text, name text, short_name text, home_stadium text, logo_url text) ON COMMIT DROP;
\copy s_team FROM '__DATA_DIR__/team.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO team (code, name, short_name, home_stadium, logo_url)
SELECT code, name, NULLIF(short_name, ''), NULLIF(home_stadium, ''), NULLIF(logo_url, '')
FROM s_team
ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name, short_name = EXCLUDED.short_name,
        home_stadium = EXCLUDED.home_stadium, logo_url = EXCLUDED.logo_url;

-- ---------- player ----------
CREATE TEMP TABLE s_player (
    kbo_player_id text, team_code text, name text, position text, throw_bat text, birth_date text,
    height text, weight text, image_url text, uniform_no text, profile_team_name text, is_retired text,
    team_basis text, position_source text, throw_bat_source text) ON COMMIT DROP;
\copy s_player FROM '__DATA_DIR__/player.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO player (kbo_player_id, team_id, name, position, throw_bat, birth_date, height, weight, image_url)
SELECT p.kbo_player_id::int, t.id, p.name, NULLIF(p.position, ''), NULLIF(p.throw_bat, ''),
       NULLIF(p.birth_date, '')::date, NULLIF(p.height, '')::int, NULLIF(p.weight, '')::int,
       NULLIF(p.image_url, '')
FROM s_player p
LEFT JOIN team t ON t.code = NULLIF(p.team_code, '')
ON CONFLICT (kbo_player_id) DO UPDATE
    SET team_id = EXCLUDED.team_id, name = EXCLUDED.name, position = EXCLUDED.position,
        throw_bat = EXCLUDED.throw_bat, birth_date = EXCLUDED.birth_date, height = EXCLUDED.height,
        weight = EXCLUDED.weight, image_url = EXCLUDED.image_url;

-- ---------- matches ----------
CREATE TEMP TABLE s_matches (
    kbo_game_id text, season text, match_date text, match_time text, home_team_code text,
    away_team_code text, home_score text, away_score text, stadium text, status text,
    ticket_url text, sequence text, doubleheader text) ON COMMIT DROP;
\copy s_matches FROM '__DATA_DIR__/matches.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO matches (kbo_game_id, season, match_date, match_time, home_team_id, away_team_id,
                     home_score, away_score, stadium, status, ticket_url, sequence, doubleheader)
SELECT m.kbo_game_id, m.season::int, m.match_date::date, NULLIF(m.match_time, '')::time, h.id, a.id,
       NULLIF(m.home_score, '')::int, NULLIF(m.away_score, '')::int, NULLIF(m.stadium, ''),
       NULLIF(m.status, ''), NULLIF(m.ticket_url, ''), NULLIF(m.sequence, '')::int,
       COALESCE(NULLIF(m.doubleheader, '')::int, 0)
FROM s_matches m
JOIN team h ON h.code = m.home_team_code
JOIN team a ON a.code = m.away_team_code
ON CONFLICT (kbo_game_id) DO UPDATE
    SET season = EXCLUDED.season, match_date = EXCLUDED.match_date, match_time = EXCLUDED.match_time,
        home_team_id = EXCLUDED.home_team_id, away_team_id = EXCLUDED.away_team_id,
        home_score = EXCLUDED.home_score, away_score = EXCLUDED.away_score, stadium = EXCLUDED.stadium,
        status = EXCLUDED.status, ticket_url = EXCLUDED.ticket_url, sequence = EXCLUDED.sequence,
        doubleheader = EXCLUDED.doubleheader;

-- ---------- match_highlight ----------
CREATE TEMP TABLE s_highlight (kbo_game_id text, title text, url text) ON COMMIT DROP;
\copy s_highlight FROM '__DATA_DIR__/match_highlight.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO match_highlight (match_id, title, url)
SELECT m.id, NULLIF(s.title, ''), s.url
FROM s_highlight s
JOIN matches m ON m.kbo_game_id = s.kbo_game_id
ON CONFLICT (match_id, url) DO UPDATE SET title = EXCLUDED.title;

-- ---------- batter_season_record ----------
CREATE TEMP TABLE s_bat (
    kbo_player_id text, team_code text, season text, bat_avg text, bat_games text, bat_pa text,
    bat_ab text, bat_r text, bat_h text, bat_2b text, bat_3b text, bat_hr text, bat_tb text,
    bat_rbi text, bat_sb text, bat_cs text, bat_bb text, bat_hbp text, bat_so text, bat_gdp text,
    bat_slg text, bat_obp text, bat_e text, bat_ops text, bat_sh text, bat_sf text, bat_ibb text,
    split text) ON COMMIT DROP;
\copy s_bat FROM '__DATA_DIR__/batter_season_record.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO batter_season_record (player_id, team_id, season, bat_avg, bat_games, bat_pa, bat_ab, bat_r,
    bat_h, bat_2b, bat_3b, bat_hr, bat_tb, bat_rbi, bat_sb, bat_cs, bat_bb, bat_hbp, bat_so, bat_gdp,
    bat_slg, bat_obp, bat_e, bat_ops)
SELECT p.id, t.id, b.season::int, NULLIF(b.bat_avg, '')::numeric, NULLIF(b.bat_games, '')::int,
       NULLIF(b.bat_pa, '')::int, NULLIF(b.bat_ab, '')::int, NULLIF(b.bat_r, '')::int, NULLIF(b.bat_h, '')::int,
       NULLIF(b.bat_2b, '')::int, NULLIF(b.bat_3b, '')::int, NULLIF(b.bat_hr, '')::int, NULLIF(b.bat_tb, '')::int,
       NULLIF(b.bat_rbi, '')::int, NULLIF(b.bat_sb, '')::int, NULLIF(b.bat_cs, '')::int, NULLIF(b.bat_bb, '')::int,
       NULLIF(b.bat_hbp, '')::int, NULLIF(b.bat_so, '')::int, NULLIF(b.bat_gdp, '')::int,
       NULLIF(b.bat_slg, '')::numeric, NULLIF(b.bat_obp, '')::numeric, NULLIF(b.bat_e, '')::int,
       NULLIF(b.bat_ops, '')::numeric
FROM s_bat b
JOIN player p ON p.kbo_player_id = b.kbo_player_id::int
JOIN team t ON t.code = b.team_code
ON CONFLICT (player_id, season, team_id) DO UPDATE
    SET bat_avg = EXCLUDED.bat_avg, bat_games = EXCLUDED.bat_games, bat_pa = EXCLUDED.bat_pa,
        bat_ab = EXCLUDED.bat_ab, bat_r = EXCLUDED.bat_r, bat_h = EXCLUDED.bat_h, bat_2b = EXCLUDED.bat_2b,
        bat_3b = EXCLUDED.bat_3b, bat_hr = EXCLUDED.bat_hr, bat_tb = EXCLUDED.bat_tb,
        bat_rbi = EXCLUDED.bat_rbi, bat_sb = EXCLUDED.bat_sb, bat_cs = EXCLUDED.bat_cs,
        bat_bb = EXCLUDED.bat_bb, bat_hbp = EXCLUDED.bat_hbp, bat_so = EXCLUDED.bat_so,
        bat_gdp = EXCLUDED.bat_gdp, bat_slg = EXCLUDED.bat_slg, bat_obp = EXCLUDED.bat_obp,
        bat_e = EXCLUDED.bat_e, bat_ops = EXCLUDED.bat_ops;

-- ---------- pitcher_season_record ----------
CREATE TEMP TABLE s_pit (
    kbo_player_id text, team_code text, season text, pit_era text, pit_games text, pit_cg text,
    pit_sho text, pit_w text, pit_l text, pit_sv text, pit_hld text, pit_wpct text, pit_tbf text,
    pit_outs text, pit_h text, pit_hr text, pit_bb text, pit_hbp text, pit_so text, pit_r text,
    pit_er text, pit_pitches text, pit_qs text, split text) ON COMMIT DROP;
\copy s_pit FROM '__DATA_DIR__/pitcher_season_record.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO pitcher_season_record (player_id, team_id, season, pit_era, pit_games, pit_cg, pit_sho, pit_w,
    pit_l, pit_sv, pit_hld, pit_wpct, pit_tbf, pit_outs, pit_h, pit_hr, pit_bb, pit_hbp, pit_so, pit_r, pit_er)
SELECT p.id, t.id, s.season::int, NULLIF(s.pit_era, '')::numeric, NULLIF(s.pit_games, '')::int,
       NULLIF(s.pit_cg, '')::int, NULLIF(s.pit_sho, '')::int, NULLIF(s.pit_w, '')::int, NULLIF(s.pit_l, '')::int,
       NULLIF(s.pit_sv, '')::int, NULLIF(s.pit_hld, '')::int, NULLIF(s.pit_wpct, '')::numeric,
       NULLIF(s.pit_tbf, '')::int, NULLIF(s.pit_outs, '')::int, NULLIF(s.pit_h, '')::int,
       NULLIF(s.pit_hr, '')::int, NULLIF(s.pit_bb, '')::int, NULLIF(s.pit_hbp, '')::int,
       NULLIF(s.pit_so, '')::int, NULLIF(s.pit_r, '')::int, NULLIF(s.pit_er, '')::int
FROM s_pit s
JOIN player p ON p.kbo_player_id = s.kbo_player_id::int
JOIN team t ON t.code = s.team_code
ON CONFLICT (player_id, season, team_id) DO UPDATE
    SET pit_era = EXCLUDED.pit_era, pit_games = EXCLUDED.pit_games, pit_cg = EXCLUDED.pit_cg,
        pit_sho = EXCLUDED.pit_sho, pit_w = EXCLUDED.pit_w, pit_l = EXCLUDED.pit_l, pit_sv = EXCLUDED.pit_sv,
        pit_hld = EXCLUDED.pit_hld, pit_wpct = EXCLUDED.pit_wpct, pit_tbf = EXCLUDED.pit_tbf,
        pit_outs = EXCLUDED.pit_outs, pit_h = EXCLUDED.pit_h, pit_hr = EXCLUDED.pit_hr,
        pit_bb = EXCLUDED.pit_bb, pit_hbp = EXCLUDED.pit_hbp, pit_so = EXCLUDED.pit_so,
        pit_r = EXCLUDED.pit_r, pit_er = EXCLUDED.pit_er;

-- ---------- team_season_record ----------
CREATE TEMP TABLE s_standing (
    team_code text, season text, as_of_date text, team_rank text, games text, wins text, losses text,
    draws text, win_pct text, games_behind text, last10 text, streak text) ON COMMIT DROP;
\copy s_standing FROM '__DATA_DIR__/team_season_record.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

INSERT INTO team_season_record (team_id, season, as_of_date, team_rank, games, wins, losses, draws,
                                win_pct, games_behind, last10, streak)
SELECT t.id, s.season::int, s.as_of_date::date, s.team_rank::int, s.games::int, s.wins::int,
       s.losses::int, COALESCE(NULLIF(s.draws, '')::int, 0), NULLIF(s.win_pct, '')::numeric,
       NULLIF(s.games_behind, '')::numeric, NULLIF(s.last10, ''), NULLIF(s.streak, '')
FROM s_standing s
JOIN team t ON t.code = s.team_code
ON CONFLICT (team_id, season, as_of_date) DO UPDATE
    SET team_rank = EXCLUDED.team_rank, games = EXCLUDED.games, wins = EXCLUDED.wins,
        losses = EXCLUDED.losses, draws = EXCLUDED.draws, win_pct = EXCLUDED.win_pct,
        games_behind = EXCLUDED.games_behind, last10 = EXCLUDED.last10, streak = EXCLUDED.streak;

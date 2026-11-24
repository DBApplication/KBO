-- =====================================================================
-- V2: 경기 기록 · 경기 상세 · 팀 순위 화면에 필요한 칼럼과 테이블 추가
--   - V1(팀 ERD)의 테이블·칼럼 이름은 그대로 두고 추가만 한다.
--   - KBO 원본 키(team.code, player.kbo_player_id, matches.kbo_game_id)를
--     UNIQUE 로 보관해서 CSV 를 다시 넣어도 같은 행을 찾을 수 있게 한다.
--   - 기존 데이터가 있어도 실패하지 않도록 새 키 칼럼은 NULL 허용 + UNIQUE.
-- =====================================================================

-- ------------------------------ team ------------------------------
ALTER TABLE team
    ADD COLUMN code       VARCHAR(2),   -- KBO 팀 코드: OB WO LT SS HH LG HT SK NC KT
    ADD COLUMN short_name VARCHAR(20),  -- 화면 표시용 약칭: 두산, KIA ...
    ADD CONSTRAINT uq_team_code UNIQUE (code);

-- ------------------------------ player ----------------------------
-- 동명이인이 있어서 이름으로는 같은 선수인지 알 수 없다 → KBO playerId 보관
ALTER TABLE player
    ADD COLUMN kbo_player_id INTEGER,
    ADD CONSTRAINT uq_player_kbo_player_id UNIQUE (kbo_player_id);

-- ------------------------------ matches ---------------------------
-- kbo_game_id = 날짜_원정코드+홈코드+더블헤더 (예: 20250601_OBWO0)
ALTER TABLE matches
    ADD COLUMN kbo_game_id  VARCHAR(20),
    ADD COLUMN doubleheader INTEGER NOT NULL DEFAULT 0,
    ADD CONSTRAINT uq_matches_kbo_game_id UNIQUE (kbo_game_id),
    ADD CONSTRAINT ck_matches_teams CHECK (home_team_id <> away_team_id),
    ADD CONSTRAINT ck_matches_doubleheader CHECK (doubleheader BETWEEN 0 AND 2),
    ADD CONSTRAINT ck_matches_status
        CHECK (status IS NULL OR status IN ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELED'));

-- 경기 기록 화면: 시즌·날짜 조회
CREATE INDEX idx_matches_season_match_date ON matches (season, match_date);

-- ------------------------------ 시즌 기록 · 하이라이트 후보키 -------
-- 같은 CSV 를 두 번 넣어도 중복 행이 생기지 않게 한다.
-- 시즌 중 트레이드된 선수는 한 시즌에 팀별로 행이 따로 있으므로 team_id 까지 포함.
ALTER TABLE batter_season_record
    ADD CONSTRAINT uq_batter_season_record_key UNIQUE (player_id, season, team_id);
ALTER TABLE pitcher_season_record
    ADD CONSTRAINT uq_pitcher_season_record_key UNIQUE (player_id, season, team_id);
ALTER TABLE match_highlight
    ADD CONSTRAINT uq_match_highlight_match_url UNIQUE (match_id, url);

-- ------------------------------ 팀 시즌 순위 -----------------------
-- 순위는 기준일(as_of_date)마다 바뀌므로 (팀, 시즌, 기준일)이 후보키
CREATE TABLE team_season_record
(
    id           BIGSERIAL PRIMARY KEY,
    team_id      BIGINT        NOT NULL,
    season       INT           NOT NULL,
    as_of_date   DATE          NOT NULL,
    team_rank    INT           NOT NULL,
    games        INT           NOT NULL,
    wins         INT           NOT NULL,
    losses       INT           NOT NULL,
    draws        INT           NOT NULL DEFAULT 0,
    win_pct      DECIMAL(4, 3),            -- 승 ÷ (승 + 패), KBO 공식값 보존
    games_behind DECIMAL(4, 1),
    last10       VARCHAR(20),              -- 예: 4승0무6패
    streak       VARCHAR(10),              -- 예: 3패
    CONSTRAINT fk_team_season_record_team FOREIGN KEY (team_id) REFERENCES team (id),
    CONSTRAINT uq_team_season_record_key UNIQUE (team_id, season, as_of_date),
    CONSTRAINT ck_team_season_record_rank CHECK (team_rank BETWEEN 1 AND 10),
    CONSTRAINT ck_team_season_record_games CHECK (wins + losses + draws = games)
);

CREATE INDEX idx_team_season_record_season ON team_season_record (season, as_of_date);

-- ------------------------------ 경기별 팀 기록 (R/H/E) -------------
CREATE TABLE match_team_record
(
    id         BIGSERIAL PRIMARY KEY,
    match_id   BIGINT     NOT NULL,
    team_id    BIGINT     NOT NULL,
    home_away  VARCHAR(4) NOT NULL,        -- HOME / AWAY
    runs       INT        NOT NULL,
    hits       INT        NOT NULL,
    errors     INT        NOT NULL,
    bb_hbp     INT,                        -- 4사구 (박스스코어 합계)
    CONSTRAINT fk_match_team_record_match FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
    CONSTRAINT fk_match_team_record_team FOREIGN KEY (team_id) REFERENCES team (id),
    CONSTRAINT uq_match_team_record_key UNIQUE (match_id, home_away),
    CONSTRAINT ck_match_team_record_home_away CHECK (home_away IN ('HOME', 'AWAY')),
    CONSTRAINT ck_match_team_record_values CHECK (runs >= 0 AND hits >= 0 AND errors >= 0)
);

-- ------------------------------ 이닝별 득점 ------------------------
-- 실제로 공격한 이닝만 저장한다. 공격하지 않은 이닝(9회말 X 등)은 행이 없다.
CREATE TABLE match_inning_score
(
    id        BIGSERIAL PRIMARY KEY,
    match_id  BIGINT     NOT NULL,
    home_away VARCHAR(4) NOT NULL,
    inning    INT        NOT NULL,
    runs      INT        NOT NULL,
    CONSTRAINT fk_match_inning_score_match FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
    CONSTRAINT uq_match_inning_score_key UNIQUE (match_id, home_away, inning),
    CONSTRAINT ck_match_inning_score_home_away CHECK (home_away IN ('HOME', 'AWAY')),
    CONSTRAINT ck_match_inning_score_inning CHECK (inning BETWEEN 1 AND 15),
    CONSTRAINT ck_match_inning_score_runs CHECK (runs >= 0)
);

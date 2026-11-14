CREATE TABLE team
(
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(50) NOT NULL,
    home_stadium VARCHAR(100),
    logo_url     VARCHAR(500)
);

CREATE TABLE player
(
    id         BIGSERIAL PRIMARY KEY,
    team_id    BIGINT,
    name       VARCHAR(50) NOT NULL,
    position   VARCHAR(20),
    throw_bat  VARCHAR(20),
    birth_date DATE,
    height     INT,
    weight     INT,
    image_url  VARCHAR(500),
    CONSTRAINT fk_player_team FOREIGN KEY (team_id) REFERENCES team (id)
);

CREATE INDEX idx_player_team_id ON player (team_id);

CREATE TABLE matches
(
    id           BIGSERIAL PRIMARY KEY,
    season       INT,
    match_date   DATE,
    match_time   TIME,
    home_team_id BIGINT,
    away_team_id BIGINT,
    home_score   INT,
    away_score   INT,
    stadium      VARCHAR(100),
    status       VARCHAR(20),
    ticket_url   VARCHAR(500),
    sequence     INT,
    CONSTRAINT fk_matches_home_team FOREIGN KEY (home_team_id) REFERENCES team (id),
    CONSTRAINT fk_matches_away_team FOREIGN KEY (away_team_id) REFERENCES team (id)
);

CREATE INDEX idx_matches_match_date ON matches (match_date);
CREATE INDEX idx_matches_home_team_id ON matches (home_team_id);
CREATE INDEX idx_matches_away_team_id ON matches (away_team_id);

CREATE TABLE match_highlight
(
    id       BIGSERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL,
    title    VARCHAR(200),
    url      VARCHAR(500),
    CONSTRAINT fk_match_highlight_match FOREIGN KEY (match_id) REFERENCES matches (id)
);

CREATE INDEX idx_match_highlight_match_id ON match_highlight (match_id);

CREATE TABLE batter_season_record
(
    id        BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    team_id   BIGINT,
    season    INT,
    bat_avg   DECIMAL(4, 3),
    bat_games INT,
    bat_pa    INT,
    bat_ab    INT,
    bat_r     INT,
    bat_h     INT,
    bat_2b    INT,
    bat_3b    INT,
    bat_hr    INT,
    bat_tb    INT,
    bat_rbi   INT,
    bat_sb    INT,
    bat_cs    INT,
    bat_bb    INT,
    bat_hbp   INT,
    bat_so    INT,
    bat_gdp   INT,
    bat_slg   DECIMAL(4, 3),
    bat_obp   DECIMAL(4, 3),
    bat_e     INT,
    bat_ops   DECIMAL(4, 3),
    CONSTRAINT fk_batter_season_record_player FOREIGN KEY (player_id) REFERENCES player (id),
    CONSTRAINT fk_batter_season_record_team FOREIGN KEY (team_id) REFERENCES team (id)
);

CREATE INDEX idx_batter_season_record_player_id ON batter_season_record (player_id);
CREATE INDEX idx_batter_season_record_team_id ON batter_season_record (team_id);
CREATE INDEX idx_batter_season_record_season ON batter_season_record (season);

CREATE TABLE pitcher_season_record
(
    id        BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    team_id   BIGINT,
    season    INT,
    pit_era   DECIMAL(5, 2),
    pit_games INT,
    pit_cg    INT,
    pit_sho   INT,
    pit_w     INT,
    pit_l     INT,
    pit_sv    INT,
    pit_hld   INT,
    pit_wpct  DECIMAL(4, 3),
    pit_tbf   INT,
    pit_outs  INT,
    pit_h     INT,
    pit_hr    INT,
    pit_bb    INT,
    pit_hbp   INT,
    pit_so    INT,
    pit_r     INT,
    pit_er    INT,
    CONSTRAINT fk_pitcher_season_record_player FOREIGN KEY (player_id) REFERENCES player (id),
    CONSTRAINT fk_pitcher_season_record_team FOREIGN KEY (team_id) REFERENCES team (id)
);

CREATE INDEX idx_pitcher_season_record_player_id ON pitcher_season_record (player_id);
CREATE INDEX idx_pitcher_season_record_team_id ON pitcher_season_record (team_id);
CREATE INDEX idx_pitcher_season_record_season ON pitcher_season_record (season);

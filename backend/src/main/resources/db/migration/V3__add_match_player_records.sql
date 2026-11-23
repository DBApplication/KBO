-- =====================================================================
-- V3: 경기별 선수 기록 (홈 "일별 선수 기록", 경기 상세 "출전 선수 기록·경기 주요 기록")
--   - 박스스코어를 수집한 경기에만 행이 있다.
--   - 타율·출루율·장타율·OPS·경기 ERA·루타는 저장하지 않고 조회할 때 계산한다 (파생 속성).
--   - player_id 는 KBO 선수 ID 로 확인된 경우만 채운다. 동명이인 등으로 확인 못 하면 NULL 이고
--     이름(player_name)만 보여 준다.
-- =====================================================================

-- ------------------------------ 경기별 타자 기록 -------------------
CREATE TABLE batter_match_record
(
    id             BIGSERIAL PRIMARY KEY,
    match_id       BIGINT      NOT NULL,
    team_id        BIGINT      NOT NULL,
    home_away      VARCHAR(4)  NOT NULL,
    seq            INT         NOT NULL,   -- 박스스코어 표의 줄 순서 (팀별 1부터)
    player_id      BIGINT,
    player_name    VARCHAR(50) NOT NULL,
    batting_order  INT,
    position       VARCHAR(20),
    pa             INT         NOT NULL,   -- 타석
    ab             INT         NOT NULL,   -- 타수
    hits           INT         NOT NULL,
    doubles        INT         NOT NULL,
    triples        INT         NOT NULL,
    home_runs      INT         NOT NULL,
    rbi            INT         NOT NULL,
    runs           INT         NOT NULL,
    walks          INT         NOT NULL,
    hit_by_pitch   INT         NOT NULL,
    strikeouts     INT         NOT NULL,
    sac_flies      INT         NOT NULL,
    CONSTRAINT fk_batter_match_record_match FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
    CONSTRAINT fk_batter_match_record_team FOREIGN KEY (team_id) REFERENCES team (id),
    CONSTRAINT fk_batter_match_record_player FOREIGN KEY (player_id) REFERENCES player (id),
    CONSTRAINT uq_batter_match_record_key UNIQUE (match_id, home_away, seq),
    CONSTRAINT ck_batter_match_record_home_away CHECK (home_away IN ('HOME', 'AWAY')),
    CONSTRAINT ck_batter_match_record_counts CHECK (
        ab >= 0 AND pa >= ab AND hits BETWEEN 0 AND ab
        AND doubles + triples + home_runs <= hits
        AND rbi >= 0 AND runs >= 0 AND walks >= 0 AND hit_by_pitch >= 0
        AND strikeouts >= 0 AND sac_flies >= 0)
);

CREATE INDEX idx_batter_match_record_match ON batter_match_record (match_id);
CREATE INDEX idx_batter_match_record_player ON batter_match_record (player_id);

-- ------------------------------ 경기별 투수 기록 -------------------
CREATE TABLE pitcher_match_record
(
    id               BIGSERIAL PRIMARY KEY,
    match_id         BIGINT      NOT NULL,
    team_id          BIGINT      NOT NULL,
    home_away        VARCHAR(4)  NOT NULL,
    seq              INT         NOT NULL,   -- 등판 순서 (팀별 1부터)
    player_id        BIGINT,
    player_name      VARCHAR(50) NOT NULL,
    is_starter       BOOLEAN     NOT NULL,
    decision         VARCHAR(2),             -- W 승 / L 패 / S 세이브 / H 홀드 / NULL 기록 없음
    outs             INT         NOT NULL,   -- 잡은 아웃 수 (이닝 = outs / 3)
    batters_faced    INT         NOT NULL,
    pitches          INT,
    hits_allowed     INT         NOT NULL,
    home_runs_allowed INT        NOT NULL,
    bb_hbp           INT         NOT NULL,   -- 4사구
    strikeouts       INT         NOT NULL,
    runs_allowed     INT         NOT NULL,
    earned_runs      INT         NOT NULL,
    CONSTRAINT fk_pitcher_match_record_match FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
    CONSTRAINT fk_pitcher_match_record_team FOREIGN KEY (team_id) REFERENCES team (id),
    CONSTRAINT fk_pitcher_match_record_player FOREIGN KEY (player_id) REFERENCES player (id),
    CONSTRAINT uq_pitcher_match_record_key UNIQUE (match_id, home_away, seq),
    CONSTRAINT ck_pitcher_match_record_home_away CHECK (home_away IN ('HOME', 'AWAY')),
    CONSTRAINT ck_pitcher_match_record_decision CHECK (decision IS NULL OR decision IN ('W', 'L', 'S', 'H')),
    CONSTRAINT ck_pitcher_match_record_counts CHECK (
        outs >= 0 AND batters_faced >= 0 AND hits_allowed >= 0 AND home_runs_allowed <= hits_allowed
        AND bb_hbp >= 0 AND strikeouts >= 0 AND earned_runs BETWEEN 0 AND runs_allowed)
);

CREATE INDEX idx_pitcher_match_record_match ON pitcher_match_record (match_id);
CREATE INDEX idx_pitcher_match_record_player ON pitcher_match_record (player_id);

-- ------------------------------ 경기 주요 기록 ---------------------
-- 결승타, 홈런, 2루타, 도루, 실책, 심판 등 박스스코어 아래의 문장형 기록
CREATE TABLE match_event
(
    id          BIGSERIAL PRIMARY KEY,
    match_id    BIGINT       NOT NULL,
    event_type  VARCHAR(20)  NOT NULL,
    item_no     INT          NOT NULL,
    description VARCHAR(500) NOT NULL,
    CONSTRAINT fk_match_event_match FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
    CONSTRAINT uq_match_event_key UNIQUE (match_id, event_type, item_no)
);

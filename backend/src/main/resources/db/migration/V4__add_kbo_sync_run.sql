-- =====================================================================
-- V4: KBO 경기 데이터 자동 수집 실행 기록
--   백엔드의 수집 작업(매일 예약 실행 또는 관리자 API 수동 실행)이
--   날짜별로 몇 경기를 찾고, 몇 경기를 적재하고, 몇 경기를 검증 실패로 건너뛰었는지 남긴다.
--   실제 경기 기록은 기존 테이블(matches, match_team_record, match_inning_score,
--   batter_match_record, pitcher_match_record, match_event)에 들어간다.
-- =====================================================================
CREATE TABLE kbo_sync_run
(
    id            BIGSERIAL PRIMARY KEY,
    target_date   DATE         NOT NULL,              -- 수집한 경기 날짜
    trigger_type  VARCHAR(10)  NOT NULL,              -- SCHEDULE(매일 예약) / MANUAL(관리자 API)
    started_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    finished_at   TIMESTAMPTZ,
    status        VARCHAR(10)  NOT NULL,
    games_found   INT          NOT NULL DEFAULT 0,    -- KBO 일정에 있는 경기 수
    games_loaded  INT          NOT NULL DEFAULT 0,    -- 박스스코어까지 적재한 경기 수
    games_updated INT          NOT NULL DEFAULT 0,    -- 예정·취소 등 경기 정보만 갱신한 경기 수
    games_failed  INT          NOT NULL DEFAULT 0,    -- 수집·검증 실패로 적재하지 않은 경기 수
    message       TEXT,                               -- 실패 경기와 이유
    CONSTRAINT ck_kbo_sync_run_trigger CHECK (trigger_type IN ('SCHEDULE', 'MANUAL')),
    CONSTRAINT ck_kbo_sync_run_status CHECK (status IN ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'NO_GAMES')),
    CONSTRAINT ck_kbo_sync_run_counts CHECK (
        games_found >= 0 AND games_loaded >= 0 AND games_updated >= 0 AND games_failed >= 0
        AND games_loaded + games_updated + games_failed <= games_found)
);

CREATE INDEX idx_kbo_sync_run_target_date ON kbo_sync_run (target_date, started_at DESC);

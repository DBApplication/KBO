-- 적재 후 정합성 검사. 하나라도 어긋나면 예외 → 트랜잭션 전체 롤백.
DO $$
DECLARE
    bad int;
BEGIN
    -- 1) CSV 행이 하나도 빠지지 않았는지 (키 매핑 실패 = JOIN 에서 사라진 행)
    IF (SELECT count(*) FROM s_matches) <> (SELECT count(*) FROM s_matches s JOIN team h ON h.code = s.home_team_code JOIN team a ON a.code = s.away_team_code) THEN
        RAISE EXCEPTION '경기 일부가 팀 코드 매핑에 실패했습니다.';
    END IF;
    IF (SELECT count(*) FROM s_bat) <> (SELECT count(*) FROM s_bat b JOIN player p ON p.kbo_player_id = b.kbo_player_id::int JOIN team t ON t.code = b.team_code) THEN
        RAISE EXCEPTION '타자 시즌 기록 일부가 선수/팀 매핑에 실패했습니다.';
    END IF;
    IF (SELECT count(*) FROM s_pit) <> (SELECT count(*) FROM s_pit b JOIN player p ON p.kbo_player_id = b.kbo_player_id::int JOIN team t ON t.code = b.team_code) THEN
        RAISE EXCEPTION '투수 시즌 기록 일부가 선수/팀 매핑에 실패했습니다.';
    END IF;
    IF (SELECT count(*) FROM s_highlight) <> (SELECT count(*) FROM s_highlight s JOIN matches m USING (kbo_game_id)) THEN
        RAISE EXCEPTION '하이라이트 일부가 경기 매핑에 실패했습니다.';
    END IF;

    IF EXISTS (SELECT 1 FROM s_player p WHERE NULLIF(p.team_code, '') IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM team t WHERE t.code = p.team_code)) THEN
        RAISE EXCEPTION '선수 일부의 팀 코드가 team.csv 에 없습니다.';
    END IF;

    -- 2) 순위표의 승패무 합 = 경기 수 (CHECK 로도 막지만 시즌별 10팀인지까지)
    SELECT count(*) INTO bad FROM (
        SELECT season, as_of_date FROM team_season_record GROUP BY season, as_of_date HAVING count(*) <> 10) x;
    IF bad > 0 THEN
        RAISE EXCEPTION '순위표에 10개 팀이 아닌 시즌·기준일이 %개 있습니다.', bad;
    END IF;

    -- 3) 박스스코어: 이닝 득점 합 = R = 경기 점수
    SELECT count(*) INTO bad
    FROM match_team_record r
    JOIN matches m ON m.id = r.match_id
    LEFT JOIN (SELECT match_id, home_away, sum(runs) AS runs FROM match_inning_score GROUP BY 1, 2) i
           ON i.match_id = r.match_id AND i.home_away = r.home_away
    WHERE r.runs <> COALESCE(i.runs, -1)
       OR r.runs <> CASE r.home_away WHEN 'HOME' THEN m.home_score ELSE m.away_score END;
    IF bad > 0 THEN
        RAISE EXCEPTION '이닝 득점 합·R·경기 점수가 맞지 않는 팀 기록이 %개 있습니다.', bad;
    END IF;
END $$;

-- 결과 요약
SELECT 'team' AS 테이블, count(*) AS 행 FROM team
UNION ALL SELECT 'player', count(*) FROM player
UNION ALL SELECT 'matches', count(*) FROM matches
UNION ALL SELECT 'match_highlight', count(*) FROM match_highlight
UNION ALL SELECT 'batter_season_record', count(*) FROM batter_season_record
UNION ALL SELECT 'pitcher_season_record', count(*) FROM pitcher_season_record
UNION ALL SELECT 'team_season_record', count(*) FROM team_season_record
UNION ALL SELECT 'match_team_record', count(*) FROM match_team_record
UNION ALL SELECT 'match_inning_score', count(*) FROM match_inning_score
UNION ALL SELECT 'batter_match_record', count(*) FROM batter_match_record
UNION ALL SELECT 'pitcher_match_record', count(*) FROM pitcher_match_record
UNION ALL SELECT 'match_event', count(*) FROM match_event;

package com.dbapplication.kbo.domain.collect.clean;

import com.dbapplication.kbo.domain.collect.source.KboGame;
import java.util.ArrayList;
import java.util.List;
import java.util.function.ToIntFunction;
import org.springframework.stereotype.Component;

/**
 * 정제한 박스스코어가 스스로 맞는지 검사한다. 하나라도 어긋나면 그 경기는 DB 에 넣지 않는다.
 * (scripts/db/load_boxscore.sql 의 적재 검사와 같은 기준 + 이닝·투수 합계 검사)
 */
@Component
public class BoxScoreValidator {

    public List<String> validate(KboGame game, CleanGame g) {
        List<String> errors = new ArrayList<>();
        check(errors, g.away(), game.awayScore(), "원정");
        check(errors, g.home(), game.homeScore(), "홈");
        for (CleanGame.TeamTotal t : List.of(g.away(), g.home())) {
            String side = t.side();
            String other = side.equals("HOME") ? "AWAY" : "HOME";
            CleanGame.TeamTotal opponent = side.equals("HOME") ? g.away() : g.home();
            List<CleanGame.Batter> bats = g.batters().stream().filter(b -> b.side().equals(side)).toList();
            List<CleanGame.Pitcher> pits = g.pitchers().stream().filter(p -> p.side().equals(other)).toList();
            if (bats.isEmpty()) errors.add(side + " 타자 기록이 없습니다");
            if (pits.isEmpty()) errors.add(other + " 투수 기록이 없습니다");
            equal(errors, side + " 타자 안타 합 = 팀 H", sum(bats, CleanGame.Batter::hits), t.hits());
            equal(errors, side + " 타자 득점 합 = 팀 R", sum(bats, CleanGame.Batter::runs), t.runs());
            equal(errors, other + " 투수 피안타 합 = 상대 H", sum(pits, CleanGame.Pitcher::hitsAllowed), t.hits());
            equal(errors, other + " 투수 실점 합 = 상대 R", sum(pits, CleanGame.Pitcher::runsAllowed), t.runs());
            long starters = pits.stream().filter(CleanGame.Pitcher::starter).count();
            if (starters != 1) errors.add(other + " 선발 투수가 " + starters + "명입니다");
            if (opponent == null) errors.add("상대 팀 기록이 없습니다");
        }
        return errors;
    }

    private void check(List<String> errors, CleanGame.TeamTotal t, Integer score, String label) {
        int inningSum = t.innings().stream().mapToInt(CleanGame.Inning::runs).sum();
        equal(errors, label + " 이닝 득점 합 = R", inningSum, t.runs());
        if (score == null) errors.add(label + " 경기 점수가 없습니다");
        else equal(errors, label + " R = 경기 점수", t.runs(), score);
    }

    private static <T> int sum(List<T> rows, ToIntFunction<T> f) {
        return rows.stream().mapToInt(f).sum();
    }

    private static void equal(List<String> errors, String rule, int actual, int expected) {
        if (actual != expected) errors.add(rule + " 불일치 (" + actual + " ≠ " + expected + ")");
    }
}

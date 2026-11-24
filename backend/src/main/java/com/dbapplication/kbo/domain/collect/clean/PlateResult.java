package com.dbapplication.kbo.domain.collect.clean;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * KBO 박스스코어 이닝 칸의 타석 결과 글자(예: 좌안, 우중2, 삼진, 4구, 중희비)를 기록 종류로 바꾼다.
 * 모르는 글자가 나오면 추측하지 않고 예외를 던진다 → 그 경기는 적재하지 않는다.
 */
public enum PlateResult {
    SINGLE, DOUBLE, TRIPLE, HOME_RUN,
    WALK, INTENTIONAL_WALK, HIT_BY_PITCH, STRIKEOUT,
    SAC_BUNT, SAC_FLY, INTERFERENCE,
    OUT, REACHED_ON_ERROR, FIELDERS_CHOICE;

    // 한 칸에 타석이 둘 이상이면 (타자 일순) 글자 사이에 / 나 공백이 들어간다.
    private static final Pattern SEPARATOR = Pattern.compile("[^가-힣0-9A-Za-z一二三]+");
    private static final Pattern OUT_SUFFIX = Pattern.compile(".*(비|땅|직|파|병|번|삼중)$");

    public boolean isHit() {
        return this == SINGLE || this == DOUBLE || this == TRIPLE || this == HOME_RUN;
    }

    /** 타수에 들어가지 않는 타석: 볼넷·고의4구·몸에 맞는 공·희생번트·희생플라이·타격방해 */
    public boolean countsAsAtBat() {
        return switch (this) {
            case WALK, INTENTIONAL_WALK, HIT_BY_PITCH, SAC_BUNT, SAC_FLY, INTERFERENCE -> false;
            default -> true;
        };
    }

    /** 이닝 칸 하나 → 타석 결과 목록. 빈 칸·"-" 는 타석 없음. */
    public static List<PlateResult> parseCell(String cell) {
        List<PlateResult> results = new ArrayList<>();
        if (cell == null) return results;
        for (String token : SEPARATOR.split(cell.trim())) {
            if (token.isEmpty() || token.equals("0")) continue;
            results.add(of(token));
        }
        return results;
    }

    /** 타석 결과 글자 하나 → 기록 종류 */
    public static PlateResult of(String raw) {
        String t = raw.replace('一', '1').replace('二', '2').replace('三', '3');
        if (t.equals("삼진") || t.equals("스낫")) return STRIKEOUT;
        if (t.equals("4구")) return WALK;
        if (t.equals("고4")) return INTENTIONAL_WALK;
        if (t.equals("사구")) return HIT_BY_PITCH;
        if (t.equals("타방")) return INTERFERENCE;
        if (t.endsWith("희비")) return SAC_FLY;
        // 희생번트, 희생번트 후 실책(희실)·야수선택(희선)은 모두 희생타로 타수에서 뺀다
        if (t.endsWith("희번") || t.endsWith("희실") || t.endsWith("희선")) return SAC_BUNT;
        if (t.endsWith("홈")) return HOME_RUN;
        if (t.endsWith("안")) return SINGLE;
        if (t.equals("야선") || t.endsWith("선")) return FIELDERS_CHOICE;
        if (t.endsWith("실")) return REACHED_ON_ERROR;
        if (OUT_SUFFIX.matcher(t).matches()) return OUT;
        // 끝 글자 2·3 은 2루타·3루타 (예: 좌2, 우중3, 122). 병살(유2병)은 위에서 이미 걸렀다.
        if (t.length() >= 2 && t.endsWith("2")) return DOUBLE;
        if (t.length() >= 2 && t.endsWith("3")) return TRIPLE;
        throw new IllegalArgumentException("알 수 없는 타석 결과: " + raw);
    }
}

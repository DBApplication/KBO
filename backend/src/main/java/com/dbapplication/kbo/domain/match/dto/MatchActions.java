package com.dbapplication.kbo.domain.match.dto;

import com.dbapplication.kbo.domain.match.entity.MatchStatus;
import java.net.URI;
import java.util.List;
import java.util.Locale;

/**
 * 경기 카드에 보여 줄 버튼. 피그마 "예매·하이라이트 · 상태와 연결 규칙" 을 그대로 옮긴 것.
 *
 * <ul>
 *   <li>예정 + 예매 URL 있음 → 예매하기 (취소·진행·종료 경기는 예매 버튼 숨김)</li>
 *   <li>진행 중·종료 → 경기 기록</li>
 *   <li>종료 + 영상 1개 → 하이라이트(새 탭), 2개 이상 → 경기 상세의 영상 목록</li>
 *   <li>주소가 없거나 http(s) 가 아니면 그 버튼은 숨김</li>
 *   <li>예매 버튼과 하이라이트 버튼은 함께 나오지 않음</li>
 * </ul>
 *
 * @param ticketUrl     예매하기 버튼 주소. null 이면 숨김
 * @param showRecord    경기 기록(상세) 버튼 표시 여부
 * @param highlightUrl  하이라이트 버튼 주소(영상이 1개일 때). null 이면 숨김
 * @param highlightList 영상이 2개 이상이라 상세의 영상 목록으로 보낼지
 */
public record MatchActions(
        String ticketUrl,
        boolean showRecord,
        String highlightUrl,
        boolean highlightList
) {

    public static MatchActions of(MatchStatus status, String ticketUrl, List<String> highlightUrls) {
        if (status == MatchStatus.SCHEDULED) {
            return new MatchActions(safeLink(ticketUrl), false, null, false);
        }
        boolean played = status == MatchStatus.IN_PROGRESS || status == MatchStatus.FINISHED;
        if (status != MatchStatus.FINISHED) {
            return new MatchActions(null, played, null, false);
        }
        List<String> links = highlightUrls.stream()
                .map(MatchActions::safeLink)
                .filter(link -> link != null)
                .toList();
        String single = links.size() == 1 ? links.getFirst() : null;
        return new MatchActions(null, true, single, links.size() > 1);
    }

    /** 외부로 여는 주소는 절대 http·https 만 허용한다. */
    static String safeLink(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            URI uri = URI.create(value.trim());
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            return (scheme.equals("http") || scheme.equals("https")) && uri.getHost() != null
                    ? uri.toString()
                    : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}

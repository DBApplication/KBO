package com.dbapplication.kbo.domain.match.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.dbapplication.kbo.domain.match.entity.MatchStatus;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** 피그마 "예매·하이라이트 · 상태와 연결 규칙" 표의 줄마다 하나씩. */
class MatchActionsTest {

    private static final String TICKET = "https://ticket.example.com/game/1";
    private static final String VIDEO = "https://www.youtube.com/watch?v=abc";

    @Test
    @DisplayName("예정 + 예매 URL 있음 → 예매하기만")
    void scheduledWithTicket() {
        MatchActions actions = MatchActions.of(MatchStatus.SCHEDULED, TICKET, List.of(VIDEO));
        assertThat(actions).isEqualTo(new MatchActions(TICKET, false, null, false));
    }

    @Test
    @DisplayName("예정 + 예매 URL 없음 → 버튼 모두 숨김")
    void scheduledWithoutTicket() {
        assertThat(MatchActions.of(MatchStatus.SCHEDULED, "  ", List.of()))
                .isEqualTo(new MatchActions(null, false, null, false));
    }

    @Test
    @DisplayName("진행 중 → 경기 기록만 (예매 숨김)")
    void inProgress() {
        assertThat(MatchActions.of(MatchStatus.IN_PROGRESS, TICKET, List.of()))
                .isEqualTo(new MatchActions(null, true, null, false));
    }

    @Test
    @DisplayName("종료 + 영상 1개 → 경기 기록 + 하이라이트(새 탭)")
    void finishedWithOneVideo() {
        assertThat(MatchActions.of(MatchStatus.FINISHED, TICKET, List.of(VIDEO)))
                .isEqualTo(new MatchActions(null, true, VIDEO, false));
    }

    @Test
    @DisplayName("종료 + 영상 없음 → 경기 기록만")
    void finishedWithoutVideo() {
        assertThat(MatchActions.of(MatchStatus.FINISHED, null, List.of()))
                .isEqualTo(new MatchActions(null, true, null, false));
    }

    @Test
    @DisplayName("종료 + 영상 2개 이상 → 상세의 영상 목록으로")
    void finishedWithManyVideos() {
        assertThat(MatchActions.of(MatchStatus.FINISHED, null, List.of(VIDEO, VIDEO + "2")))
                .isEqualTo(new MatchActions(null, true, null, true));
    }

    @Test
    @DisplayName("취소 → 아무 버튼도 없음")
    void canceled() {
        assertThat(MatchActions.of(MatchStatus.CANCELED, TICKET, List.of(VIDEO)))
                .isEqualTo(new MatchActions(null, false, null, false));
    }

    @Test
    @DisplayName("http(s) 가 아닌 주소는 숨김")
    void unsafeLinksAreHidden() {
        assertThat(MatchActions.safeLink("javascript:alert(1)")).isNull();
        assertThat(MatchActions.safeLink("/relative/path")).isNull();
        assertThat(MatchActions.safeLink("not a url")).isNull();
        assertThat(MatchActions.safeLink(VIDEO)).isEqualTo(VIDEO);
    }
}

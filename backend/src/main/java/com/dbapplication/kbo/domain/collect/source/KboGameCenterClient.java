package com.dbapplication.kbo.domain.collect.source;

import com.dbapplication.kbo.domain.collect.KboSyncProperties;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

/**
 * KBO 홈페이지 게임센터가 화면을 그릴 때 부르는 조회용 웹서비스(ws)를 똑같이 호출한다.
 * 읽기 전용 POST 요청 3개만 쓰고, 응답은 가공하지 않은 JSON 문자열로 돌려준다 (해석은 KboResponseParser).
 */
@Component
public class KboGameCenterClient {

    private static final DateTimeFormatter YYYYMMDD = DateTimeFormatter.BASIC_ISO_DATE;
    // 정규시즌 0, 시범경기 1, 포스트시즌 3·4·5·7, 올스타 9 — 게임센터 화면과 같은 값
    private static final String ALL_SERIES = "0,1,3,4,5,7,9";

    private final RestClient http;

    public KboGameCenterClient(RestClient.Builder builder, KboSyncProperties props) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(props.timeout());
        factory.setReadTimeout(props.timeout());
        this.http = builder.clone()
                .baseUrl(props.baseUrl())
                .requestFactory(factory)
                .defaultHeader("X-Requested-With", "XMLHttpRequest")
                .defaultHeader("Referer", props.baseUrl() + "/Schedule/GameCenter/Main.aspx")
                .build();
    }

    /** 날짜별 경기 목록 */
    public String gameList(LocalDate date) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("leId", "1");
        form.add("srId", ALL_SERIES);
        form.add("date", date.format(YYYYMMDD));
        return post("/ws/Main.asmx/GetKboGameList", form);
    }

    /** 스코어보드 (이닝별 득점, R/H/E/B) */
    public String scoreBoard(KboGame game) {
        return post("/ws/Schedule.asmx/GetScoreBoardScroll", gameForm(game));
    }

    /** 박스스코어 (타자·투수 기록, 경기 주요 기록) */
    public String boxScore(KboGame game) {
        return post("/ws/Schedule.asmx/GetBoxScoreScroll", gameForm(game));
    }

    private MultiValueMap<String, String> gameForm(KboGame game) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("leId", "1");
        form.add("srId", String.valueOf(game.seriesId()));
        form.add("seasonId", String.valueOf(game.seasonId()));
        form.add("gameId", game.gameId());
        return form;
    }

    private String post(String path, MultiValueMap<String, String> form) {
        String body = http.post().uri(path)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(String.class);
        if (body == null || body.isBlank()) throw new KboSourceException(path + " 응답이 비어 있습니다");
        return body;
    }
}

package com.dbapplication.kbo.domain.collect.source;

/** KBO 응답을 받지 못했거나 형식이 예상과 다를 때. 해당 경기(또는 날짜)는 적재하지 않는다. */
public class KboSourceException extends RuntimeException {

    public KboSourceException(String message) {
        super(message);
    }

    public KboSourceException(String message, Throwable cause) {
        super(message, cause);
    }
}

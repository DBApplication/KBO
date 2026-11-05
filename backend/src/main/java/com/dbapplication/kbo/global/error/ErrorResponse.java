package com.dbapplication.kbo.global.error;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse(
        String code,
        String message,
        int status,
        List<FieldError> errors,
        LocalDateTime timestamp
) {

    public record FieldError(String field, String value, String reason) {
    }

    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(errorCode.getCode(), errorCode.getMessage(),
                errorCode.getStatus().value(), List.of(), LocalDateTime.now());
    }

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        return new ErrorResponse(errorCode.getCode(), message,
                errorCode.getStatus().value(), List.of(), LocalDateTime.now());
    }

    public static ErrorResponse of(ErrorCode errorCode, List<FieldError> errors) {
        return new ErrorResponse(errorCode.getCode(), errorCode.getMessage(),
                errorCode.getStatus().value(), errors, LocalDateTime.now());
    }
}

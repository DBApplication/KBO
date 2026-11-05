package com.dbapplication.kbo.global.error;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    protected ResponseEntity<ErrorResponse> handleBusiness(BusinessException e) {
        ErrorCode code = e.getErrorCode();
        log.warn("BusinessException: {} - {}", code.getCode(), e.getMessage());
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code, e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        List<ErrorResponse.FieldError> errors = e.getBindingResult().getFieldErrors().stream()
                .map(f -> new ErrorResponse.FieldError(
                        f.getField(),
                        f.getRejectedValue() == null ? "" : f.getRejectedValue().toString(),
                        f.getDefaultMessage()))
                .toList();
        return build(ErrorCode.INVALID_INPUT_VALUE, errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    protected ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException e) {
        List<ErrorResponse.FieldError> errors = e.getConstraintViolations().stream()
                .map(v -> new ErrorResponse.FieldError(
                        v.getPropertyPath().toString(),
                        String.valueOf(v.getInvalidValue()),
                        v.getMessage()))
                .toList();
        return build(ErrorCode.INVALID_INPUT_VALUE, errors);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    protected ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return build(ErrorCode.INVALID_TYPE_VALUE, List.of(new ErrorResponse.FieldError(
                e.getName(), String.valueOf(e.getValue()), "타입이 올바르지 않습니다.")));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    protected ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException e) {
        return build(ErrorCode.MISSING_PARAMETER, List.of(new ErrorResponse.FieldError(
                e.getParameterName(), "", "필수 파라미터입니다.")));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    protected ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException e) {
        return build(ErrorCode.INVALID_INPUT_VALUE, List.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    protected ResponseEntity<ErrorResponse> handleMethodNotAllowed(HttpRequestMethodNotSupportedException e) {
        return build(ErrorCode.METHOD_NOT_ALLOWED, List.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    protected ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException e) {
        return build(ErrorCode.RESOURCE_NOT_FOUND, List.of());
    }

    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
        log.error("Unhandled exception", e);
        return build(ErrorCode.INTERNAL_SERVER_ERROR, List.of());
    }

    private ResponseEntity<ErrorResponse> build(ErrorCode code, List<ErrorResponse.FieldError> errors) {
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code, errors));
    }
}

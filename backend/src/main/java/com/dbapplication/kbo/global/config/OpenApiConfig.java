package com.dbapplication.kbo.global.config;

import com.dbapplication.kbo.global.error.ErrorResponse;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import java.util.Arrays;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * 모든 API 에 공통 에러 응답(400/404)을 문서화한다. 성공(200) 응답 스키마는 springdoc 이 반환 타입에서 만든다.
 * 404 는 경로 변수로 대상을 지정하거나 비교(compare) API 처럼 대상이 없을 수 있는 경우에만 붙인다.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    OperationCustomizer errorResponseCustomizer() {
        return (operation, handlerMethod) -> {
            addError(operation, "400", "잘못된 요청 (정렬 키·파라미터 오류 등)");
            boolean targetLookup = handlerMethod.getMethod().getName().startsWith("compare")
                    || Arrays.stream(handlerMethod.getMethodParameters())
                    .anyMatch(p -> p.hasParameterAnnotation(PathVariable.class));
            if (targetLookup) {
                addError(operation, "404", "대상 선수 또는 시즌 기록 없음");
            }
            return operation;
        };
    }

    /** 에러 응답 스키마를 components 에 등록한다 ($ref 대상). */
    @Bean
    OpenApiCustomizer errorSchemaCustomizer() {
        return openApi -> ModelConverters.getInstance().readAll(ErrorResponse.class)
                .forEach((name, schema) -> openApi.getComponents().addSchemas(name, schema));
    }

    private static void addError(Operation operation, String code, String description) {
        Schema<?> schema = new Schema<>().$ref("#/components/schemas/ErrorResponse");
        operation.getResponses().addApiResponse(code, new ApiResponse().description(description)
                .content(new Content().addMediaType("application/json", new MediaType().schema(schema))));
    }
}

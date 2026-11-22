package com.dbapplication.kbo.domain.record.service;

import com.dbapplication.kbo.global.error.BusinessException;
import com.dbapplication.kbo.global.error.ErrorCode;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

/** 타자/투수 기록 목록 조회가 공유하는 필터·정렬·페이징 조립 로직. */
final class RecordQuerySupport {

    static final int MAX_SIZE = 100;

    private RecordQuerySupport() {
    }

    /** null 조건(미지정 필터)은 건너뛰고 AND 로 결합한다. */
    @SafeVarargs
    static <T> Specification<T> allOf(Specification<T>... specs) {
        return Specification.allOf(java.util.Arrays.stream(specs).filter(java.util.Objects::nonNull).toList());
    }

    static <T> Specification<T> season(int season) {
        return (root, q, cb) -> cb.equal(root.get("season"), season);
    }

    static <T> Specification<T> team(Long teamId) {
        return teamId == null ? null : (root, q, cb) -> cb.equal(root.get("team").get("id"), teamId);
    }

    static <T> Specification<T> playerName(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String pattern = "%" + keyword.trim().toLowerCase().replace("\\", "\\\\")
                .replace("%", "\\%").replace("_", "\\_") + "%";
        return (root, q, cb) -> cb.like(cb.lower(root.get("player").get("name")), pattern, '\\');
    }

    static <T> Specification<T> atLeast(String property, Integer min) {
        return min == null ? null : (root, q, cb) -> cb.greaterThanOrEqualTo(root.get(property), min);
    }

    /** 허용된 정렬 키만 엔티티 프로퍼티로 변환한다. 동점은 id 로 안정 정렬한다. */
    static Pageable pageable(Map<String, String> sortable, String sort, boolean desc, int page, int size) {
        String property = sortable.get(sort);
        if (property == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "지원하지 않는 정렬 기준입니다: " + sort);
        }
        Sort.Order order = (desc ? Sort.Order.desc(property) : Sort.Order.asc(property)).nullsLast();
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_SIZE),
                Sort.by(order, Sort.Order.asc("id")));
    }
}

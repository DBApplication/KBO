# AGENTS.md

AI 코딩 에이전트(Claude Code 등)와 사람이 함께 지켜야 하는 프로젝트 규칙입니다.

## 프로젝트 개요

KBO 경기 결과 · 팀별 기록 · 선수별 기록 조회 서비스 (모노레포).

| 경로 | 내용 |
|------|------|
| `backend/` | Spring Boot 4.1 · Java 21 · Gradle · PostgreSQL 16 · Flyway · JPA |
| `frontend/` | 프론트엔드 (미정) |

## 자주 쓰는 명령어

```bash
cd backend
./gradlew bootRun     # 서버 실행 (Docker 필요, compose.yaml 의 PostgreSQL 자동 기동, 호스트 포트 5434)
./gradlew build       # 빌드 + 테스트 (Testcontainers 사용, Docker 필요)
./gradlew test
```

- Swagger: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/actuator/health

## 작업 규칙 (필수)

- 모든 변경은 **브랜치 → PR → 리뷰 → 머지** 순서로 진행한다. 사용자의 명시적 지시 없이 `main`에 직접 커밋·푸시하지 않는다.
- 브랜치: `<type>/<kebab-case 설명>` (예: `feat/12-player-search-api`). type은 `feat|fix|refactor|docs|test|chore|ci`.
- 커밋: Conventional Commits — `type(scope): 제목` (제목 50자 이내, 한글 가능). 커밋 하나에 논리적 변경 하나.
- PR: 제목은 커밋 형식과 동일, `.github/pull_request_template.md` 양식을 채운다. 작게 유지하고 Squash merge 한다.
- 자세한 내용은 [README.md](README.md)의 "협업 컨벤션"을 따른다.
- 푸시, PR 생성, 레포 설정 변경 등 외부에 영향을 주는 작업은 사용자 확인 후 진행한다.
- 비밀 값(비밀번호, 토큰, `.env`)은 커밋하지 않는다.

## 백엔드 코드 구조 · 규칙

패키지 루트: `com.dbapplication.kbo`

```
global/error/    ErrorCode, BusinessException, ErrorResponse, GlobalExceptionHandler
global/config/   SecurityConfig, RestClientConfig, JpaConfig
domain/{player,team,match}/{entity,repository,service,controller,dto}
```

- 도메인별 패키지 안에서 `controller → service → repository` 계층을 지키고, 컨트롤러에서 엔티티를 직접 반환하지 않는다 (`dto` 사용).
- 예외는 `BusinessException(ErrorCode)` 로 던지고, 새 에러는 `ErrorCode`에 도메인 접두어(`P`/`T`/`M`/`C`)와 함께 추가한다. 응답 형식은 `GlobalExceptionHandler`가 통일한다.
- DB 스키마는 **Flyway 마이그레이션**(`src/main/resources/db/migration/V{번호}__{설명}.sql`)으로만 변경한다. `ddl-auto`는 `validate`이므로 엔티티와 스키마가 일치해야 한다. 이미 머지된 마이그레이션 파일은 수정하지 않는다.
- Lombok 사용 가능. 엔티티에는 `@Data`/`@Setter`를 쓰지 않는다.
- 설정은 `application.yml`(공통) + `application-{local,prod}.yml`. 환경별 값은 환경변수(`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `CORS_ALLOWED_ORIGINS`)로 주입한다.
- 새 기능에는 테스트를 함께 추가하고, PR 전에 `./gradlew build`가 통과해야 한다.

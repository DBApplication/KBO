# KBO

KBO 경기 결과 · 팀별 기록 · 선수별 기록 조회 서비스 (모노레포)

- `backend/`  Spring Boot 4 / Java 21 / PostgreSQL
- `frontend/` 프론트엔드

## Backend 실행
```bash
cd backend
./gradlew bootRun   # compose.yaml 의 PostgreSQL 을 자동으로 띄움 (Docker 필요)
```
- Swagger: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/actuator/health

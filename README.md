# KBO

KBO 경기 결과 · 팀별 기록 · 선수별 기록 조회 서비스 (모노레포)

- `backend/`  Spring Boot 4 / Java 21 / PostgreSQL
- `frontend/` 프론트엔드

## Backend 실행
```bash
cd backend
./gradlew bootRun   # compose.yaml 의 PostgreSQL(호스트 포트 5434)을 자동으로 띄움 (Docker 필요)
```
- Swagger: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/actuator/health

## 협업 컨벤션

모든 작업은 **이슈/작업 단위 브랜치 → PR → 리뷰 → `main` 머지** 순서로 진행합니다. `main`에 직접 푸시하지 않습니다.

### 브랜치

`main`에서 분기하고, 이름은 `<type>/<설명>` 형식의 소문자 kebab-case로 씁니다. 이슈가 있으면 번호를 붙입니다.

```
feat/12-player-search-api
fix/match-score-null
docs/readme-conventions
```

| type | 용도 |
|------|------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변경 없는 구조 개선 |
| `docs` | 문서 변경 |
| `test` | 테스트 추가·수정 |
| `chore` | 빌드, 의존성, 설정 등 기타 |
| `ci` | CI/CD 설정 |

### 커밋 메시지 ([Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/))

```
<type>(<scope>): <제목>

<본문 - 선택, 무엇을/왜 바꿨는지>
```

- `scope`는 `backend`, `frontend`, `player`, `team`, `match`, `global` 등 변경 범위 (선택)
- 제목은 50자 이내, 마침표 없이, 명령형 현재 시제로 작성 (한글 가능)
- 커밋 하나는 하나의 논리적 변경만 담습니다

```
feat(player): 선수 이름 검색 API 추가
fix(match): 경기 결과 점수가 null일 때 500 오류 수정
chore(backend): springdoc 버전 업데이트
```

### Pull Request

1. 최신 `main`에서 브랜치를 만들어 작업하고 push 합니다.
2. PR 제목은 커밋 컨벤션과 같은 형식으로 씁니다. (`feat(player): 선수 이름 검색 API 추가`)
3. PR 템플릿(`.github/pull_request_template.md`)의 항목을 채웁니다.
4. 리뷰어 1명 이상의 승인을 받고, 모든 리뷰 코멘트가 해결되어야 머지합니다.
5. **Squash and merge**로 머지하고, 머지된 브랜치는 삭제합니다.
6. PR은 가능한 작게(리뷰 가능한 크기) 유지합니다. 큰 작업은 나누어 올립니다.

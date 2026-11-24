/**
 * 백엔드 API 호출 함수 (엔드포인트 하나에 함수 하나). Swagger: http://localhost:8080/swagger-ui.html
 * 경로는 constants/endpoints.ts, 응답 타입은 types/, HTTP 클라이언트(axios)는 lib/axios.ts.
 * 화면에서는 직접 부르지 않고 features/<도메인>/queries.ts 의 TanStack 쿼리로 쓴다.
 */
export { fetchDailyRecords, fetchMatch, fetchMatchDates, fetchMatches, type MatchFilter } from "./match";
export { fetchPlayer, fetchPlayers, type PlayerSearchParams } from "./player";
export {
  fetchComparison,
  fetchPlayerHistory,
  fetchRanking,
  fetchRecordSeasons,
  type RankingParams,
} from "./record";
export { fetchStandingSeasons, fetchStandings } from "./standing";
export { fetchTeams } from "./team";

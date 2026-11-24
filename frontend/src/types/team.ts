/** team/dto/TeamSummary */
export interface TeamSummary {
  id: number;
  /** KBO 팀 코드 (예: HT). 주소의 team 값 */
  code: string | null;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
}

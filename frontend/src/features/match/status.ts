/** 경기 상태 표시명 */
export const statusLabels: Record<string, string> = {
  FINISHED: "경기 종료",
  CANCELED: "경기 취소",
  SCHEDULED: "경기 예정",
  IN_PROGRESS: "경기 중",
};

export function statusLabel(status: string): string {
  return statusLabels[status] || status;
}

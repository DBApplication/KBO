import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./apiError";

/** 기록은 조회만 하는 데이터라 한 번 받으면 오래 쓴다. 4xx 는 다시 시도해도 같으므로 재시도하지 않는다. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
      },
    },
  });
}

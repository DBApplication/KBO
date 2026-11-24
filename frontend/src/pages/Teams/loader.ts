import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { standingsQuery } from "@/features/standing";
import { requestQuery } from "@/utils";

/** 시즌 기준일의 팀 순위. */
export const teamsLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    await qc.ensureQueryData(standingsQuery(requestQuery(request).season));
    return null;
  };

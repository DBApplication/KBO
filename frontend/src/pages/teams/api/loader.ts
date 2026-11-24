import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { standingsQuery } from "@/entities/standing";
import { requestQuery } from "@/shared/lib";

/** 시즌 기준일의 팀 순위. */
export const teamsLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    await qc.ensureQueryData(standingsQuery(requestQuery(request).season));
    return null;
  };

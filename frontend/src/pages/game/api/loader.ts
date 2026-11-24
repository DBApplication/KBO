import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { matchQuery } from "@/entities/match";
import { isNotFound } from "@/shared/api";
import { requestQuery } from "@/shared/lib";

/** 경기 상세. 없는 경기(M001)나 잘못된 id 면 notFound. */
export const gameLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    try {
      await qc.ensureQueryData(matchQuery(requestQuery(request).get("id")));
      return { notFound: false };
    } catch (e) {
      if (isNotFound(e)) return { notFound: true };
      throw e;
    }
  };

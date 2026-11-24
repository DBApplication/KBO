import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { requestQuery } from "@/shared/lib";
import { compareQuery } from "../model/compare-query";

export const compareLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    await qc.ensureQueryData(compareQuery(requestQuery(request)));
    return null;
  };

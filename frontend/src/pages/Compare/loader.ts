import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { compareQuery } from "@/features/compare";
import { requestQuery } from "@/utils";

export const compareLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    await qc.ensureQueryData(compareQuery(requestQuery(request)));
    return null;
  };

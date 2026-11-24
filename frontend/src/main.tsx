import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createHashRouter } from "react-router";
import { createQueryClient } from "./api/queries.ts";
import { createRoutes } from "./routes.tsx";
import "./styles.css";

const queryClient = createQueryClient();
// 정적 배포(dist/)에서도 새로고침이 되도록 주소는 #/players?season=2025 같은 해시 방식을 쓴다.
const router = createHashRouter(createRoutes(queryClient));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

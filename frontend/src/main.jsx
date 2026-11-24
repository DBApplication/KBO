import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router";
import { routes } from "./routes.jsx";
import "./styles.css";

// 정적 배포(dist/)에서도 새로고침이 되도록 주소는 #/players?season=2025 같은 해시 방식을 쓴다.
const router = createHashRouter(routes);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

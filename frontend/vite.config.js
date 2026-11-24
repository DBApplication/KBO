import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 화면은 /api 로 백엔드(Spring Boot, 기본 localhost:8080)를 부른다.
// 개발 서버와 미리보기 서버가 같은 주소로 넘겨 주므로 CORS 설정이 필요 없다.
const backend = process.env.KBO_API_URL || "http://localhost:8080";
// 키 끝의 / 를 붙여 /api/... 요청만 넘긴다 ("/api" 로 두면 /api.js 같은 파일 경로까지 백엔드로 넘어간다).
const proxy = { "/api/": { target: backend, changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
  test: {
    environment: "jsdom",
    testTimeout: 15000,
    setupFiles: ["./src/test-setup.js"],
  },
});

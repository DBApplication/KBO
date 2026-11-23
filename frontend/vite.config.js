import { defineConfig } from "vite";

// 화면은 /api 로 백엔드(Spring Boot, 기본 localhost:8080)를 부른다.
// 개발 서버와 미리보기 서버가 같은 주소로 넘겨 주므로 CORS 설정이 필요 없다.
const backend = process.env.KBO_API_URL || "http://localhost:8080";
const proxy = { "/api": { target: backend, changeOrigin: true } };

export default defineConfig({
  server: { proxy },
  preview: { proxy },
});

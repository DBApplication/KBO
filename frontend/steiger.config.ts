import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

// FSD 구조 검사 (pnpm lint:fsd). 규칙: https://github.com/feature-sliced/steiger
export default defineConfig([...fsd.configs.recommended]);

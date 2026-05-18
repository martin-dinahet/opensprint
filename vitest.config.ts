import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias,
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["src/shared/ui/**", "drizzle/**", ".next/**", "coverage/**", "src/test/**"],
    },
    projects: [
      {
        plugins: [react()],
        resolve: {
          alias,
        },
        test: {
          name: "backend",
          environment: "node",
          include: ["src/test/server/**/*.test.ts"],
          setupFiles: ["src/test/setup/backend.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: {
          alias,
        },
        test: {
          name: "frontend",
          environment: "jsdom",
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          exclude: ["src/server/**", "src/test/server/**"],
          setupFiles: ["src/test/setup/frontend.ts"],
        },
      },
    ],
  },
});

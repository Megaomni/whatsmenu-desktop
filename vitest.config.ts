/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    reporters: ["default", "html"],
    outputFile: "reporters/test-results.html",
    coverage: {
      reporter: ["text", "html"],
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // thresholds: {
      //   branches: 100,
      //   functions: 100,
      //   lines: 100,
      //   statements: 100,
      // },
    },
  },
});

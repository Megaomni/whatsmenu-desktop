/// <reference types="vitest" />
import { defineConfig } from "vite";

import { config } from "dotenv";

export default defineConfig({
  test: {
    reporters: ["default", "html"],
    outputFile: "reporters/test-results.html",
    env: {
      ...config({ path: "./.env.test" }).parsed,
    },
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

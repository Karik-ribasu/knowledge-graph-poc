import { defineWorkspace } from "vitest/config";

const coreCoverageExclude = [
  "packages/core/src/**/*.test.ts",
  "packages/core/src/index.ts",
  "packages/core/src/domain/types.ts",
  "packages/core/src/ports/**",
  "packages/core/dist/**",
];

export default defineWorkspace([
  {
    extends: "./vitest.config.ts",
    test: {
      name: "unit",
      include: ["packages/*/src/**/*.test.ts"],
      exclude: [
        "packages/**/*.integration.test.ts",
        "packages/**/*.slow.test.ts",
        "**/node_modules/**",
      ],
    },
  },
  {
    extends: "./vitest.config.ts",
    test: {
      name: "core-coverage",
      include: ["packages/core/src/**/*.test.ts"],
      exclude: ["**/node_modules/**"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json-summary", "json", "lcov"],
        reportsDirectory: "./coverage",
        include: ["packages/core/src/**/*.ts"],
        exclude: coreCoverageExclude,
        all: true,
        thresholds: {
          "packages/core/src/**": {
            lines: 100,
            branches: 100,
            functions: 100,
            statements: 100,
          },
        },
      },
    },
  },
  {
    extends: "./vitest.config.ts",
    test: {
      name: "integration",
      include: ["packages/*/src/**/*.integration.test.ts"],
      exclude: ["**/node_modules/**"],
      testTimeout: 120_000,
      hookTimeout: 120_000,
      fileParallelism: false,
      maxWorkers: 1,
    },
  },
]);

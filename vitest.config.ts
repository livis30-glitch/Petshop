import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            exclude: ["src/server.ts", "src/config/**"],
            reporter: ["text", "html"],
            thresholds: {
                lines: 60,
                functions: 60,
                branches: 60,
                statements: 60
            }
        }
    }
});
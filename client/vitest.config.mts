import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Auth.js imports Next's extensionless server entrypoints; let Vite resolve them.
    server: { deps: { inline: ["next-auth"] } },
  },
});

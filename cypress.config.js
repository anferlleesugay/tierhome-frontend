import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "https://tierhome.live",
    setupNodeEvents(on, config) {
      // implement node event listeners here if needed later
      return config;
    },
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
  },
});
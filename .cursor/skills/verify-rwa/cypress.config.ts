import { defineConfig } from "cypress";
import projectConfig from "../../../cypress.config";

const evidence = process.env.VERIFY_RWA_EVIDENCE;

if (!evidence) {
  throw new Error(
    "VERIFY_RWA_EVIDENCE is not set. Run .cursor/skills/verify-rwa/bin/verify-rwa drive <feature>."
  );
}

export default defineConfig({
  ...projectConfig,
  viewportWidth: 1280,
  viewportHeight: 1000,
  retries: {
    runMode: 0,
    openMode: 0,
  },
  expose: {
    ...projectConfig.expose,
    VERIFY_RWA_EVIDENCE: evidence,
  },
  screenshotsFolder: `${evidence}/screenshots`,
  videosFolder: `${evidence}/videos`,
  trashAssetsBeforeRuns: false,
  video: true,
  videoCompression: false,
  e2e: {
    ...projectConfig.e2e,
    viewportWidth: 1280,
    viewportHeight: 1000,
    specPattern: ".cursor/skills/verify-rwa/specs/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    baseUrl: "http://localhost:3000",
  },
});

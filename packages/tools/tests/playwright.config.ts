import { defineConfig, devices } from "@playwright/test";
import { getCdpEndpoint } from "./browserstack.config";

import { populateEnvironment } from "@dev/build-tools";
populateEnvironment();

const isCI = !!process.env.CI;
const browserType = process.env.BROWSER || (isCI ? "Firefox" : "Chrome");
const numberOfWorkers = process.env.CIWORKERS ? +process.env.CIWORKERS : process.env.CI ? 1 : browserType === "BrowserStack" ? 1 : undefined;
const customFlags = process.env.CUSTOM_FLAGS ? process.env.CUSTOM_FLAGS.split(" ") : [];
const headless = process.env.HEADLESS !== "false";
const forceChrome = process.env.FORCE_CHROME === "true";

const args = browserType === "Chrome" ? ["--use-angle=default", "--js-flags=--expose-gc"] : ["-wait-for-browser"];
args.push(...customFlags);

const browserStackBrowser = process.env.BROWSERSTACK_BROWSER || "chrome@latest:OSX Sonoma";

export default defineConfig({
    testDir: "./test/playwright",
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 1,
    /* Opt out of parallel tests on CI. */
    workers: numberOfWorkers,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: process.env.CI ? [["line"], ["junit", { outputFile: "junit.xml" }], ["html", { open: "never" }]] : [["list"], ["html"]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",
        ignoreHTTPSErrors: true,
    },

    globalSetup: browserType === "BrowserStack" ? require.resolve("./globalSetup.ts") : undefined,
    globalTeardown: browserType === "BrowserStack" ? require.resolve("./globalTeardown.ts") : undefined,

    /* Project configuration */
    projects: [
        {
            name: "webgl2",
            testMatch: "**/*webgl2.test.ts",
            use: forceChrome
                ? {
                      // use real chrome (not chromium) for webgpu tests
                      channel: "chrome",
                      headless,
                      launchOptions: {
                          args,
                      },
                  }
                : browserType === "BrowserStack"
                  ? {
                        connectOptions: { wsEndpoint: getCdpEndpoint(browserStackBrowser, "WebGL2") },
                    }
                  : {
                        ...devices["Desktop " + browserType],
                        headless,
                        launchOptions: {
                            args,
                        },
                    },
        },
        {
            name: "webgl1",
            testMatch: "**/*webgl1.test.ts",
            use: forceChrome
                ? {
                      // use real chrome (not chromium) for webgpu tests
                      channel: "chrome",
                      headless,
                      launchOptions: {
                          args,
                      },
                  }
                : browserType === "BrowserStack"
                  ? {
                        connectOptions: { wsEndpoint: getCdpEndpoint(browserStackBrowser, "WebGL1") },
                    }
                  : {
                        ...devices["Desktop " + browserType],
                        headless,
                        launchOptions: {
                            args,
                        },
                    },
        },
        {
            name: "webgpu",
            testMatch: "**/*webgpu.test.ts",
            use:
                browserType === "BrowserStack"
                    ? {
                          connectOptions: { wsEndpoint: getCdpEndpoint(browserStackBrowser, "WebGPU") },
                      }
                    : {
                          // use real chrome (not chromium) for webgpu tests
                          channel: "chrome",
                          headless,
                          launchOptions: {
                              args,
                          },
                      },
        },
        {
            name: "interaction",
            testMatch: "**/interaction.test.ts",
            use: {
                ...devices["Desktop Safari"],
                headless,
                launchOptions: {
                    args,
                },
            },
        },
        {
            name: "performance",
            testMatch: "**/performance.test.ts",
            use: forceChrome
                ? {
                      // use real chrome (not chromium) for webgpu tests
                      channel: "chrome",
                      headless,
                      launchOptions: {
                          args,
                      },
                  }
                : browserType === "BrowserStack"
                  ? {
                        connectOptions: { wsEndpoint: getCdpEndpoint(browserStackBrowser, "WebGL2") },
                    }
                  : {
                        ...devices["Desktop " + browserType],
                        headless,
                        launchOptions: {
                            args,
                        },
                    },
        },
    ],

    snapshotPathTemplate: "test/visualization/ReferenceImages/{arg}{ext}",
});

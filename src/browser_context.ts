import { BrowserContext } from "playwright";
import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir } from "fs/promises";
import { isPathAvailable } from "./utils";
import { writeFile } from "node:fs/promises";

export async function addStealthToContext(context: BrowserContext) {
  await context.addInitScript(() => {
    // Override the navigator.webdriver property
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    // Mock languages and plugins to mimic a real browser
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    const playwrightProperties = [
      "__playwright",
      "__pw_manual",
      "__PW_inspect",
    ];

    // Remove Playwright-specific properties
    for (const property of playwrightProperties) {
      delete (window as any)[property];
    }

    // Redefine the headless property
    Object.defineProperty(navigator, "headless", {
      get: () => false,
    });

    // Override the permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
          } as PermissionStatus)
        : originalQuery(parameters);
  });
}

export const createPersistentBrowserContext = async () => {
  const tempDirPath = path.join(os.tmpdir(), "browser-operator");
  const isTempDirPathAvailable = await isPathAvailable(tempDirPath);
  if (!isTempDirPathAvailable) {
    await mkdir(tempDirPath, { recursive: true });
  }
  const tempDir = await mkdtemp(path.join(tempDirPath, "context_"));
  await mkdir(path.join(tempDir, "user/Default"), {
    recursive: true,
  });

  await writeFile(
    path.join(tempDir, "user/Default/Preferences"),
    JSON.stringify({})
  );
  const downloadsPath = path.join(process.cwd(), "downloads");
  await mkdir(downloadsPath, { recursive: true });

  const context = await chromium.launchPersistentContext(
    path.join(tempDir, "user"),
    {
      acceptDownloads: true,
      headless: false,
      viewport: {
        width: 1280,
        height: 720,
      },
      locale: "en-US",
      timezoneId: "America/New_York",
      deviceScaleFactor: 1,
      args: [
        "--enable-webgl",
        "--use-gl=swiftshader",
        "--enable-accelerated-2d-canvas",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
      ],

      bypassCSP: true,
    }
  );

  await addStealthToContext(context);
  return {
    context,
    contextPath: tempDir,
  };
};

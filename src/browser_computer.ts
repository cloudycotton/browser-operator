import { Page } from "playwright";
import { ComputerAction, ComputerActionParams } from "./computer_types";
import {
  formatBrowserComputerKey,
  BrowserComputerError,
  formatBrowserComputerError,
} from "./utils";
import { anthropic } from "@ai-sdk/anthropic";

export type BrowserComputerActionParams = ComputerActionParams & {
  page: Page;
};

export type BrowserComputerActionResult =
  | string
  | {
      data: string;
      type: string;
    };

interface BrowserComputerActionHandler {
  type: ComputerAction;
  execute: (
    params: BrowserComputerActionParams
  ) => Promise<BrowserComputerActionResult>;
}

export const browserComputerActionHandlers: BrowserComputerActionHandler[] = [
  {
    type: "screenshot",
    execute: async ({ page }) => {
      return takeScreenshot(page);
    },
  },
  {
    type: "key",
    execute: async (params) => {
      const { page } = params;
      const key = formatBrowserComputerKey(validateText(params));
      await page.keyboard.press(key);
      await waitReady(page);
      return await takeScreenshot(page);
    },
  },
  {
    type: "type",
    execute: async (params) => {
      const { page } = params;
      await page.keyboard.type(validateText(params));
      await waitReady(page);
      return await takeScreenshot(page);
    },
  },
  {
    type: "mouse_move",
    execute: async (params) => {
      const { page } = params;
      const [x, y] = validatecoordinate(params);
      await page.mouse.move(x, y);
      await waitReady(page);
      return await takeScreenshot(page);
    },
  },
  {
    type: "left_click",
    execute: async (params) => {
      const { page } = params;
      const [x, y] = validatecoordinate(params);
      await page.mouse.click(x, y);
      await waitReady(page);
      return await takeScreenshot(page);
    },
  },
  {
    type: "left_click_drag",
    execute: async (params) => {
      const { page } = params;
      const [x, y] = validatecoordinate(params);
      await page.mouse.down();
      await page.mouse.move(x, y);
      await page.mouse.up();
      await waitReady(page);
      return await takeScreenshot(page);
    },
  },
  {
    type: "right_click",
    execute: async (params) => {
      const { page } = params;
      const [x, y] = validatecoordinate(params);
      await page.mouse.click(x, y, { button: "right" });
      await waitReady(page);
      return await takeScreenshot(page);
    },
  },
  {
    type: "middle_click",
    execute: async (params) => {
      const { page } = params;
      const [x, y] = validatecoordinate(params);
      await page.mouse.click(x, y, { button: "middle" });
      await waitReady(page);
      return await takeScreenshot(page);
    },
  },
  {
    type: "double_click",
    execute: async (params) => {
      const { page } = params;
      const [x, y] = validatecoordinate(params);
      await page.mouse.dblclick(x, y);
      await waitReady(page);
      return await takeScreenshot(page);
    },
  },
  {
    type: "cursor_position",
    execute: async ({ page }) => {
      const response = await page.evaluate(() => {
        const mousePosition = {
          x: 0,
          y: 0,
        };
        const mouseMove = (e: MouseEvent) => {
          mousePosition.x = e.clientX;
          mousePosition.y = e.clientY;
        };
        document.addEventListener("mousemove", mouseMove);
        return mousePosition;
      });
      return `Current cursor position: ${response.x}, ${response.y}`;
    },
  },
];

export const validatecoordinate = ({
  page,
  action,
  coordinate,
}: BrowserComputerActionParams) => {
  const viewportSize = page.viewportSize();

  if (!viewportSize) {
    throw new BrowserComputerError("Viewport size is not defined.");
  }

  if (!coordinate) {
    throw new BrowserComputerError(
      `Coordinate is required for ${action} action.`
    );
  }
  const [x, y] = coordinate;

  if (x < 0 || x > viewportSize.width) {
    throw new BrowserComputerError("X coordinate is out of bounds.");
  }
  if (y < 0 || y > viewportSize.height) {
    throw new BrowserComputerError("Y coordinate is out of bounds.");
  }

  return [x, y];
};

export function validateText({ action, text }: BrowserComputerActionParams) {
  if (!text) {
    throw new BrowserComputerError(`Text is required for ${action} action.`);
  }
  return text;
}

export async function waitReady(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("domcontentloaded");
  return true;
}

export async function takeScreenshot(page: Page) {
  const screenshot = await page.screenshot();
  return {
    data: screenshot.toString("base64"),
    type: "image/png",
  };
}

export class BrowserComputer {
  public actionHandlers: Map<
    ComputerAction,
    (
      params: BrowserComputerActionParams
    ) => Promise<BrowserComputerActionResult>
  > = new Map();

  #actionHistory: ComputerActionParams[] = [];

  get actionHistory() {
    return this.#actionHistory;
  }

  constructor(public page: Page) {
    for (const handler of browserComputerActionHandlers) {
      this.actionHandlers.set(handler.type, handler.execute);
    }
  }
  public async execute(
    params: BrowserComputerActionParams
  ): Promise<BrowserComputerActionResult> {
    const { action } = params;
    const actionHandler = this.actionHandlers.get(action);
    if (!actionHandler) {
      throw new BrowserComputerError(`Action ${action} not supported.`);
    }
    const result = await actionHandler(params);
    this.#actionHistory.push(params);
    return result;
  }
}

export const createBrowserComputer = (page: Page) => {
  const viewportSize = page.viewportSize();
  if (!viewportSize) {
    throw new BrowserComputerError("Viewport size is not defined.");
  }
  const browserComputer = new BrowserComputer(page);
  const browserComputerTool = anthropic.tools.computer_20241022({
    displayHeightPx: viewportSize.height,
    displayWidthPx: viewportSize.width,
    displayNumber: 0,
    async execute(params) {
      try {
        const response = await browserComputer.execute({
          page,
          ...params,
        });
        return response;
      } catch (error) {
        return formatBrowserComputerError(error);
      }
    },
    experimental_toToolResultContent(result) {
      return typeof result === "string"
        ? [{ type: "text", text: result }]
        : [{ type: "image", data: result?.data, mimeType: "image/png" }];
    },
  });
  return browserComputerTool;
};

import { Page } from "playwright";
import { createBrowserComputer } from "./browser_computer";
import { CoreMessage, tool, generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { BROWSER_OPERATOR_PROMPT } from "./prompts";
import { recordMethodCalls } from "./proxies";

export interface BrowserOperatorPage extends Page {
  act(content: string): Promise<string>;
  _generateScript(): string;
}

export const createBrowserOperatorPage = (page: Page) => {
  const { proxied, history } = recordMethodCalls(page);

  const result: BrowserOperatorPage = Object.create(proxied, {
    act: {
      value: async (content: string) => {
        const browserComputer = createBrowserComputer(proxied);
        const messages: CoreMessage[] = [
          {
            role: "system",
            content: BROWSER_OPERATOR_PROMPT,
          },
          {
            role: "user",
            content,
          },
        ];

        const tools = {
          computer: browserComputer,
          currentUrl: tool({
            description: "Get the current URL of the page.",
            parameters: z.object({}),
            execute: async () => {
              return proxied.url();
            },
          }),
          navigate: tool({
            description: "Navigate to a URL.",
            parameters: z.object({
              url: z.string().url(),
            }),
            execute: async ({ url }) => {
              await proxied.goto(url);
              return `Successfully navigated to ${url}.`;
            },
          }),
        };

        const response = await generateText({
          model: anthropic("claude-3-5-sonnet-latest"),
          messages: messages,
          tools,
          maxRetries: 3,
          maxSteps: 100,
        });

        return response.text;
      },
    },

    _generateScript: {
      value: () => {
        const actionLines = history
          .map((action) => {
            const args = action.arguments
              .map((argument) => {
                if (typeof argument === "string")
                  return `'${argument.replace(/'/g, "\\'")}'`;
                return JSON.stringify(argument);
              })
              .join(", ");
            return `  await page.${action.method}(${args});`;
          })
          .join("\n");

        return `
    import { createPersistentBrowserContext } from "browser-operator";
    
    async function runScript() {
      const { context } = await createPersistentBrowserContext();
    
      let page = context.pages()[0];
      if (!page) {
        page = await context.newPage();
      }
    
      try {
    ${actionLines}
      } finally {
        await context.close();
      }
    }
    
    runScript().catch(console.error);
    `;
      },
    },
  });

  return result;
};

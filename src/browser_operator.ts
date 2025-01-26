import {
  BrowserOperatorPage,
  createBrowserOperatorPage,
} from "./browser_operator_page";
import { createPersistentBrowserContext } from "./browser_context";
import { BrowserContext } from "playwright";
import { rm } from "fs/promises";

export class BrowserOperator {
  #page: BrowserOperatorPage;
  #context: BrowserContext;
  #contextPath: string;

  static async create() {
    const operator = new BrowserOperator();
    await operator.init();
    return operator;
  }

  public get page() {
    return this.#page;
  }

  async init() {
    const { context, contextPath } = await createPersistentBrowserContext();
    this.#context = context;
    this.#contextPath = contextPath;
    const [page] = this.#context.pages();
    this.#page = createBrowserOperatorPage(page);
  }

  async stop() {
    await this.#context.close();
    if (!this.#contextPath) return;
    await rm(this.#contextPath, { recursive: true, force: true });
  }
}

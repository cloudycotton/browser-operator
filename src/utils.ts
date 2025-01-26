import { access } from "fs/promises";
import { constants } from "fs";
import pino from "pino";
import crypto from "node:crypto";

export const logger = pino();

// Differences in keys between claude and playwright:
export const BROWSER_COMPUTER_KEY_FIXES: Record<string, string> = {
  Ctrl: "Control",
  Return: "Enter",
};

export function formatBrowserComputerKey(text: string): string {
  if (!text) return text;
  return text
    .split("+")
    .map((key) => key.charAt(0).toUpperCase() + key.slice(1).toLowerCase())
    .map((item) => {
      return BROWSER_COMPUTER_KEY_FIXES[item] ?? item;
    })
    .join("+");
}

export const formatBrowserComputerError = (error: any) => {
  if (error instanceof Error) {
    return error.message;
  }
  return error;
};

export class BrowserComputerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserComputerError";
  }
}

export async function isPathAvailable(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function createMd5Hash(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

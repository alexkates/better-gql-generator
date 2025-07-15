import fs from "fs/promises";
import path from "path";

/**
 * Write a GraphQL operation to a file
 */
export async function writeOperationToFile(
  filePath: string,
  content: string
): Promise<void> {
  try {
    await fs.writeFile(filePath, content, "utf-8");
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error}`);
  }
}

/**
 * Format an operation name to match GraphQL conventions
 * (camelCase for field names)
 */
export function formatOperationName(name: string): string {
  // Already camelCase, return as is
  return name;
}

/**
 * Ensure a directory exists, creating it recursively if needed
 */
export async function ensureDirectoryExists(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dir}: ${error}`);
  }
}

/**
 * Log a debug message if verbose is enabled and not silent
 */
export function logDebug(
  message: string,
  verbose: boolean,
  silent: boolean
): void {
  if (verbose && !silent) {
    console.log(`[DEBUG] ${message}`);
  }
}

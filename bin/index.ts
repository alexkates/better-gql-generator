#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { generateOperations } from "../src/generator.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Define the type for commander options
interface CommandOptions {
  schema: string;
  out: string;
  queries: boolean;
  mutations: boolean;
  subscriptions: boolean;
  silent: boolean;
  verbose: boolean;
}

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we're running from source or from dist
// The path will be either /dist/bin or /bin
const isRunningFromDist = __dirname.includes('/dist/') || __dirname.includes('\\dist\\');
const rootDir = isRunningFromDist ? resolve(__dirname, '../..') : resolve(__dirname, '..');
const packageJsonPath = resolve(rootDir, 'package.json');

let version: string;
try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  version = packageJson.version;
} catch (error) {
  // Only show the warning if in verbose mode
  console.error(`Warning: Could not read package.json for version: ${error}`);
  version = "1.0.0"; // Default fallback version
}

const program = new Command();

program
  .name("better-gql-generator")
  .description("Generate GraphQL operations from a local schema file")
  .version(version)
  .requiredOption(
    "-s, --schema <path>",
    "Path to GraphQL schema file (SDL format)"
  )
  .option(
    "-o, --out <dir>",
    "Output directory for generated files",
    "generated-gql"
  )
  .option("--queries", "Generate Query operations", true)
  .option("--mutations", "Generate Mutation operations", true)
  .option("--subscriptions", "Generate Subscription operations", false)
  .option("--silent", "Suppress logs", false)
  .option("--verbose", "Show debug output", false)
  .action(async (options: CommandOptions) => {
    try {
      if (!options.silent) {
        console.log(chalk.cyan("⚡ better-gql-generator"));
        console.log(chalk.gray("Generating GraphQL operations..."));
      }

      const startTime = Date.now();

      const result = await generateOperations({
        schemaPath: options.schema,
        outDir: options.out,
        generateQueries: options.queries,
        generateMutations: options.mutations,
        generateSubscriptions: options.subscriptions,
        verbose: options.verbose,
        silent: options.silent,
      });

      const duration = Date.now() - startTime;

      if (!options.silent) {
        console.log(chalk.green("✅ Done!"), chalk.gray(`(${duration}ms)`));
        console.log(chalk.gray(`Output directory: ${options.out}`));
        console.log(chalk.gray(`Generated ${result.length} operation files`));
      }
    } catch (error) {
      if (!options.silent) {
        console.error(
          chalk.red("❌ Error:"),
          error instanceof Error ? error.message : String(error)
        );
      }
      if (options.verbose && error instanceof Error) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();

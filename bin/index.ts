#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { generateOperations } from "../src/generator.js";
import { VERSION } from "../src/version.js";

const program = new Command();

program
  .name("better-gql-generator")
  .description("Generate GraphQL operations from a local schema file")
  .version(VERSION)
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
  .action(async (options) => {
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

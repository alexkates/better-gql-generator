#!/usr/bin/env bun
import { Command } from "commander";
import { generateOperations } from "./generator";
import { logger } from "./logger";
import process from "node:process";

async function main() {
  try {
    const program = new Command();

    program
      .name("better-gql-generator")
      .description("Generate GraphQL operations from a local SDL schema")
      .version("1.0.3") // Hardcoded version - update when changing package.json version
      .requiredOption("--schema <path>", "Path to GraphQL schema file (SDL format)")
      .option("--out <dir>", "Output directory for generated files", "generated-gql")
      .option("--queries", "Generate Query operations", true)
      .option("--mutations", "Generate Mutation operations", true)
      .option("--subscriptions", "Generate Subscription operations", false)
      .option("--silent", "Suppress logs", false)
      .option("--verbose", "Show debug output", false);

    program.parse();

    const options = program.opts();

    // Configure logger based on silent/verbose flags
    logger.configure({
      silent: Boolean(options.silent),
      verbose: Boolean(options.verbose),
    });

    logger.info(`Using schema from ${options.schema}`);
    logger.info(`Output directory: ${options.out}`);
    logger.info("AWS AppSync directives will be automatically stripped from generated operations");

    const result = await generateOperations({
      schemaPath: options.schema,
      outDir: options.out,
      generateQueries: Boolean(options.queries),
      generateMutations: Boolean(options.mutations),
      generateSubscriptions: Boolean(options.subscriptions),
    });

    logger.success(`Generated operations: ${result}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error: ${errorMessage}`);
    process.exit(1);
  }
}

main();

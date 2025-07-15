import { buildSchema, GraphQLSchema, GraphQLObjectType, GraphQLField } from "graphql";
import { mkdir, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { formatOperationName, formatArgumentsAsVariables, formatSelectionSet, processSchemaWithCustomDirectives } from "./utils";
import { logger } from "./logger";

export interface GenerateOperationsOptions {
  schemaPath: string;
  outDir: string;
  generateQueries?: boolean;
  generateMutations?: boolean;
  generateSubscriptions?: boolean;
}

/**
 * Generates GraphQL operations from a schema file
 */
export async function generateOperations(options: GenerateOperationsOptions): Promise<string> {
  const { schemaPath, outDir, generateQueries = true, generateMutations = true, generateSubscriptions = false } = options;

  logger.info("Loading schema...");

  // Read schema from file
  const schemaContent = await Bun.file(schemaPath).text();

  // Process schema with custom directives (e.g., AWS AppSync directives)
  const processedSchema = processSchemaWithCustomDirectives(schemaContent);

  // Parse schema
  const schema = buildSchema(processedSchema);

  const results: string[] = [];

  // Create output directory
  try {
    mkdirSync(outDir, { recursive: true });
  } catch (err: any) {
    logger.error(`Failed to create output directory: ${err.message}`);
    throw err;
  }

  // Generate queries if requested and Query type exists
  if (generateQueries && schema.getQueryType()) {
    logger.info("Generating queries...");
    const queryResults = await generateQueriesFromSchema(schema, outDir);
    results.push(`${queryResults.length} queries`);
  }

  // Generate mutations if requested and Mutation type exists
  if (generateMutations && schema.getMutationType()) {
    logger.info("Generating mutations...");
    const mutationResults = await generateMutationsFromSchema(schema, outDir);
    results.push(`${mutationResults.length} mutations`);
  }

  // Generate subscriptions if requested and Subscription type exists
  if (generateSubscriptions && schema.getSubscriptionType()) {
    logger.info("Generating subscriptions...");
    const subscriptionResults = await generateSubscriptionsFromSchema(schema, outDir);
    results.push(`${subscriptionResults.length} subscriptions`);
  }

  return results.join(", ");
}

/**
 * Generates query operations from schema
 */
async function generateQueriesFromSchema(schema: GraphQLSchema, outDir: string): Promise<string[]> {
  const queryType = schema.getQueryType();
  if (!queryType) return [];

  return generateOperationsFromType(queryType, "query", join(outDir, "queries"));
}

/**
 * Generates mutation operations from schema
 */
async function generateMutationsFromSchema(schema: GraphQLSchema, outDir: string): Promise<string[]> {
  const mutationType = schema.getMutationType();
  if (!mutationType) return [];

  return generateOperationsFromType(mutationType, "mutation", join(outDir, "mutations"));
}

/**
 * Generates subscription operations from schema
 */
async function generateSubscriptionsFromSchema(schema: GraphQLSchema, outDir: string): Promise<string[]> {
  const subscriptionType = schema.getSubscriptionType();
  if (!subscriptionType) return [];

  return generateOperationsFromType(subscriptionType, "subscription", join(outDir, "subscriptions"));
}

/**
 * Generates operations from a specific GraphQL object type
 */
async function generateOperationsFromType(type: GraphQLObjectType, operationType: "query" | "mutation" | "subscription", outDir: string): Promise<string[]> {
  const fields = type.getFields();
  const fileNames: string[] = [];

  // Create directory if it doesn't exist
  try {
    mkdirSync(outDir, { recursive: true });
  } catch (err: any) {
    logger.error(`Failed to create directory ${outDir}: ${err.message}`);
    throw err;
  }

  // Generate an operation file for each field
  for (const fieldName in fields) {
    const field = fields[fieldName];

    // Format the operation content
    const operationContent = formatOperation(operationType, fieldName, field);

    // Write to file
    const fileName = `${fieldName}.graphql`;
    const filePath = join(outDir, fileName);

    try {
      writeFileSync(filePath, operationContent);
      logger.verbose(`Generated ${operationType} operation: ${fileName}`);
      fileNames.push(fileName);
    } catch (err: any) {
      logger.error(`Failed to write ${fileName}: ${err.message}`);
    }
  }

  return fileNames;
}

/**
 * Formats a GraphQL operation string
 */
function formatOperation(operationType: "query" | "mutation" | "subscription", fieldName: string, field: GraphQLField<any, any>): string {
  const operationName = formatOperationName(fieldName);
  const variables = formatArgumentsAsVariables(field.args);
  const selectionSet = formatSelectionSet(field.type);

  return `${operationType} ${operationName}${variables ? `(${variables})` : ""} {
  ${fieldName}${variables ? `(${formatArgumentsForOperation(field.args as any)})` : ""} ${selectionSet}
}`;
}

/**
 * Formats field arguments for operation use (without types)
 */
function formatArgumentsForOperation(args: any[]): string {
  if (!args || args.length === 0) {
    return "";
  }

  return args.map((arg) => `${arg.name}: $${arg.name}`).join(", ");
}

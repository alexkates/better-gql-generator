import { buildSchema, GraphQLSchema, GraphQLObjectType } from "graphql";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  writeOperationToFile,
  formatOperationName,
  logDebug,
  ensureDirectoryExists,
} from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface GeneratorOptions {
  schemaPath: string;
  outDir: string;
  generateQueries?: boolean;
  generateMutations?: boolean;
  generateSubscriptions?: boolean;
  verbose?: boolean;
  silent?: boolean;
}

/**
 * Generate GraphQL operations from a schema file
 */
export async function generateOperations(
  options: GeneratorOptions
): Promise<string[]> {
  const {
    schemaPath,
    outDir,
    generateQueries = true,
    generateMutations = true,
    generateSubscriptions = false,
    verbose = false,
    silent = false,
  } = options;

  // Read schema file
  const schemaContent = await fs.readFile(schemaPath, "utf-8");
  logDebug(`Read schema file: ${schemaPath}`, verbose, silent);

  // Parse schema
  const schema = buildSchema(schemaContent);
  logDebug("Parsed GraphQL schema", verbose, silent);

  const generatedFiles: string[] = [];

  // Generate operation files
  if (generateQueries) {
    const queryFiles = await generateQueriesFromSchema(
      schema,
      outDir,
      verbose,
      silent
    );
    generatedFiles.push(...queryFiles);
  }

  if (generateMutations) {
    const mutationFiles = await generateMutationsFromSchema(
      schema,
      outDir,
      verbose,
      silent
    );
    generatedFiles.push(...mutationFiles);
  }

  if (generateSubscriptions) {
    const subscriptionFiles = await generateSubscriptionsFromSchema(
      schema,
      outDir,
      verbose,
      silent
    );
    generatedFiles.push(...subscriptionFiles);
  }

  return generatedFiles;
}

/**
 * Generate Query operations from schema
 */
async function generateQueriesFromSchema(
  schema: GraphQLSchema,
  outDir: string,
  verbose: boolean,
  silent: boolean
): Promise<string[]> {
  const queryType = schema.getQueryType();
  if (!queryType) {
    logDebug("No Query type found in schema", verbose, silent);
    return [];
  }

  return generateOperationsByType(
    queryType,
    "query",
    outDir,
    schema,
    verbose,
    silent
  );
}

/**
 * Generate Mutation operations from schema
 */
async function generateMutationsFromSchema(
  schema: GraphQLSchema,
  outDir: string,
  verbose: boolean,
  silent: boolean
): Promise<string[]> {
  const mutationType = schema.getMutationType();
  if (!mutationType) {
    logDebug("No Mutation type found in schema", verbose, silent);
    return [];
  }

  return generateOperationsByType(
    mutationType,
    "mutation",
    outDir,
    schema,
    verbose,
    silent
  );
}

/**
 * Generate Subscription operations from schema
 */
async function generateSubscriptionsFromSchema(
  schema: GraphQLSchema,
  outDir: string,
  verbose: boolean,
  silent: boolean
): Promise<string[]> {
  const subscriptionType = schema.getSubscriptionType();
  if (!subscriptionType) {
    logDebug("No Subscription type found in schema", verbose, silent);
    return [];
  }

  return generateOperationsByType(
    subscriptionType,
    "subscription",
    outDir,
    schema,
    verbose,
    silent
  );
}

/**
 * Generate operations by type (Query, Mutation, Subscription)
 */
async function generateOperationsByType(
  type: GraphQLObjectType,
  operationType: "query" | "mutation" | "subscription",
  outDir: string,
  schema: GraphQLSchema,
  verbose: boolean,
  silent: boolean
): Promise<string[]> {
  const fields = type.getFields();
  const operationTypePlural =
    operationType === "query" ? "queries" : `${operationType}s`; // queries, mutations, subscriptions
  const typeDir = path.join(outDir, operationTypePlural);

  await ensureDirectoryExists(typeDir);
  logDebug(`Created directory: ${typeDir}`, verbose, silent);

  const generatedFiles: string[] = [];

  for (const fieldName of Object.keys(fields)) {
    const field = fields[fieldName];
    const operationName = formatOperationName(fieldName);
    const capitalizedOperationName =
      operationName.charAt(0).toUpperCase() + operationName.slice(1);

    // Get field arguments for operation variables
    const args = field.args
      .map((arg) => {
        const typeStr = arg.type.toString();
        return `$${arg.name}: ${typeStr}`;
      })
      .join(", ");

    // Get field arguments for operation call
    const fieldArgs = field.args
      .map((arg) => {
        return `${arg.name}: $${arg.name}`;
      })
      .join(", ");

    // Generate the selection set recursively
    const selectionSet = generateSelectionSet(field.type, schema);

    // Build the operation string
    let operationString = `${operationType} ${capitalizedOperationName}`;
    if (args) {
      operationString += `(${args})`;
    }
    operationString += ` {
  ${fieldName}`;
    if (fieldArgs) {
      operationString += `(${fieldArgs})`;
    }
    operationString += ` {${selectionSet}
  }
}`;

    // Write to file
    const fileName = `${fieldName}.graphql`;
    const filePath = path.join(typeDir, fileName);
    await writeOperationToFile(filePath, operationString);

    logDebug(`Generated ${operationType}: ${fieldName}`, verbose, silent);
    generatedFiles.push(filePath);
  }

  return generatedFiles;
}

/**
 * Generate selection set for a GraphQL type
 */
function generateSelectionSet(
  type: any,
  schema: GraphQLSchema,
  depth = 0,
  indentLevel = 2
): string {
  // Prevent infinite recursion by limiting depth
  if (depth > 3) {
    return "";
  }

  // Handle non-null and list types
  if (type.ofType) {
    return generateSelectionSet(type.ofType, schema, depth, indentLevel);
  }

  const typeName = type.name;

  // Skip scalars and enums
  if (
    typeName === "String" ||
    typeName === "Int" ||
    typeName === "Float" ||
    typeName === "Boolean" ||
    typeName === "ID" ||
    schema.getType(typeName)?.astNode?.kind === "EnumTypeDefinition"
  ) {
    return "";
  }

  // Get the actual type from the schema
  const namedType = schema.getType(typeName);
  if (!namedType || namedType.astNode?.kind !== "ObjectTypeDefinition") {
    return "";
  }

  // Cast to object type to get fields
  const objectType = namedType as GraphQLObjectType;
  const fields = objectType.getFields();

  // Build selection set
  const baseIndent = " ".repeat(indentLevel);
  const nestedIndent = " ".repeat(indentLevel + 2);

  const selections = Object.keys(fields)
    .map((fieldName) => {
      const field = fields[fieldName];
      const fieldType = field.type;
      const nestedSelection = generateSelectionSet(
        fieldType,
        schema,
        depth + 1,
        indentLevel + 4
      );

      if (nestedSelection) {
        return `\n${nestedIndent}${fieldName} {${nestedSelection}\n${nestedIndent}}`;
      }

      return `\n${nestedIndent}${fieldName}`;
    })
    .join("");

  return selections;
}

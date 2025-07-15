import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { existsSync, rmSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";

// Import the generator functions
import * as generator from "../src/generator";

const TEST_OUT_DIR = "./tmp/complex-test-output";

// Store the original function for later
const originalGenerateOperations = generator.generateOperations;

// Create a patched version that accepts a schema string directly
async function generateWithSchemaString(
  schemaString: string,
  outDir: string,
  options: {
    generateQueries?: boolean;
    generateMutations?: boolean;
    generateSubscriptions?: boolean;
  } = {},
): Promise<string> {
  // Create a temporary file for the test
  const tempFilePath = "./tmp/temp-schema.graphql";
  mkdirSync("./tmp", { recursive: true });
  Bun.write(tempFilePath, schemaString);

  try {
    // Call the original function with the temporary file
    return await originalGenerateOperations({
      schemaPath: tempFilePath,
      outDir,
      ...options,
    });
  } finally {
    // Clean up the temporary file
    rmSync(tempFilePath, { force: true });
  }
}

describe("Complex Types Generator", () => {
  // Set up and clean up test directory
  beforeAll(() => {
    if (existsSync(TEST_OUT_DIR)) {
      rmSync(TEST_OUT_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_OUT_DIR, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(TEST_OUT_DIR)) {
      rmSync(TEST_OUT_DIR, { recursive: true, force: true });
    }
  });

  test("union types should generate valid operations with fragments", async () => {
    // Hard-coded schema with a union type
    const schemaString = `
      type Query {
        searchResults(query: String!): [SearchResult!]!
      }
      
      type User {
        id: ID!
        name: String!
        email: String!
      }
      
      type Post {
        id: ID!
        title: String!
        content: String
      }
      
      union SearchResult = User | Post
    `;

    const result = await generateWithSchemaString(schemaString, TEST_OUT_DIR, {
      generateQueries: true,
      generateMutations: false,
      generateSubscriptions: false,
    });

    // Check that results string mentions queries
    expect(result).toContain("queries");

    // Verify output directory was created
    expect(existsSync(join(TEST_OUT_DIR, "queries"))).toBe(true);

    // Check for specific operation files
    expect(existsSync(join(TEST_OUT_DIR, "queries", "searchResults.graphql"))).toBe(true);

    // Validate contents of query to ensure unions are properly handled
    const searchResultsQuery = readFileSync(join(TEST_OUT_DIR, "queries", "searchResults.graphql"), "utf8");
    expect(searchResultsQuery).toContain("query SearchResults($query: String!)");
    expect(searchResultsQuery).toContain("searchResults(query: $query)");
    expect(searchResultsQuery).toContain("__typename");
    expect(searchResultsQuery).toContain("... on User {");
    expect(searchResultsQuery).toContain("... on Post {");
  });

  test("interface types should generate valid operations with fragments", async () => {
    // Hard-coded schema with an interface type
    const schemaString = `
      type Query {
        node(id: ID!): Node
      }
      
      interface Node {
        id: ID!
      }
      
      type User implements Node {
        id: ID!
        name: String!
        email: String!
      }
      
      type Post implements Node {
        id: ID!
        title: String!
        content: String
      }
    `;

    const result = await generateWithSchemaString(schemaString, TEST_OUT_DIR, {
      generateQueries: true,
      generateMutations: false,
      generateSubscriptions: false,
    });

    // Verify output directory was created
    expect(existsSync(join(TEST_OUT_DIR, "queries"))).toBe(true);

    // Check for specific operation files
    expect(existsSync(join(TEST_OUT_DIR, "queries", "node.graphql"))).toBe(true);

    // Interface query
    const nodeQuery = readFileSync(join(TEST_OUT_DIR, "queries", "node.graphql"), "utf8");
    expect(nodeQuery).toContain("query Node($id: ID!)");
    expect(nodeQuery).toContain("node(id: $id)");
    expect(nodeQuery).toContain("__typename");
    expect(nodeQuery).toContain("id");
  });

  test("complex union of types implementing interfaces should generate correctly", async () => {
    // Hard-coded schema with a complex type structure
    const schemaString = `
      type Query {
        cartStrategy: CartStrategy
      }
      
      interface Strategy {
        name: String!
      }
      
      type CollectionStrategy implements Strategy {
        name: String!
        collectionId: ID!
      }
      
      type GridStrategy implements Strategy {
        name: String!
        gridColumns: Int!
      }
      
      union CartStrategy = CollectionStrategy | GridStrategy
    `;

    const result = await generateWithSchemaString(schemaString, TEST_OUT_DIR, {
      generateQueries: true,
      generateMutations: false,
      generateSubscriptions: false,
    });

    // Verify output directory was created
    expect(existsSync(join(TEST_OUT_DIR, "queries"))).toBe(true);

    // Check for specific operation files
    expect(existsSync(join(TEST_OUT_DIR, "queries", "cartStrategy.graphql"))).toBe(true);

    // Union with interface implementations
    const cartStrategyQuery = readFileSync(join(TEST_OUT_DIR, "queries", "cartStrategy.graphql"), "utf8");
    expect(cartStrategyQuery).toContain("query CartStrategy");
    expect(cartStrategyQuery).toContain("__typename");
    expect(cartStrategyQuery).toContain("... on CollectionStrategy {");
    expect(cartStrategyQuery).toContain("... on GridStrategy {");
  });
});

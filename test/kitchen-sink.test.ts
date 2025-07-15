import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { generateOperations } from "../src/generator";
import { existsSync, rmSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";

const TEST_OUT_DIR = "./tmp/test-output";

describe("GraphQL Operation Generator", () => {
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

  test("kitchen sink schema should generate valid operations", async () => {
    const result = await generateOperations({
      schemaPath: "./schema/kitchen-sink.graphql",
      outDir: TEST_OUT_DIR,
      generateQueries: true,
      generateMutations: true,
      generateSubscriptions: true,
    });

    // Check that results string mentions all operation types
    expect(result).toContain("queries");
    expect(result).toContain("mutations");
    expect(result).toContain("subscriptions");

    // Verify output directories were created
    expect(existsSync(join(TEST_OUT_DIR, "queries"))).toBe(true);
    expect(existsSync(join(TEST_OUT_DIR, "mutations"))).toBe(true);
    expect(existsSync(join(TEST_OUT_DIR, "subscriptions"))).toBe(true);

    // Check for specific operation files
    expect(existsSync(join(TEST_OUT_DIR, "queries", "getUser.graphql"))).toBe(
      true
    );
    expect(
      existsSync(join(TEST_OUT_DIR, "mutations", "createUser.graphql"))
    ).toBe(true);
    expect(
      existsSync(join(TEST_OUT_DIR, "subscriptions", "userUpdated.graphql"))
    ).toBe(true);

    // Validate contents of one query file
    const getUserQuery = readFileSync(
      join(TEST_OUT_DIR, "queries", "getUser.graphql"),
      "utf8"
    );
    expect(getUserQuery).toContain("query GetUser($id: ID!)");
    expect(getUserQuery).toContain("getUser(id: $id)");
  });

  test("should only generate requested operations", async () => {
    const queriesOnlyDir = join(TEST_OUT_DIR, "queries-only");

    await generateOperations({
      schemaPath: "./schema/kitchen-sink.graphql",
      outDir: queriesOnlyDir,
      generateQueries: true,
      generateMutations: false,
      generateSubscriptions: false,
    });

    // Check that only queries directory was created
    expect(existsSync(join(queriesOnlyDir, "queries"))).toBe(true);
    expect(existsSync(join(queriesOnlyDir, "mutations"))).toBe(false);
    expect(existsSync(join(queriesOnlyDir, "subscriptions"))).toBe(false);
  });
});

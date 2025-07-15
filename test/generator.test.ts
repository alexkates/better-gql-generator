import test from "node:test";
import assert from "node:assert/strict";
import { generateOperations } from "../src/generator.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper function to clean output directory
async function cleanupOutputDir(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors if directory doesn't exist
  }
}

test("generates basic query", async () => {
  const outDir = path.join(__dirname, "out");
  await cleanupOutputDir(outDir);

  const result = await generateOperations({
    schemaPath: path.join(__dirname, "fixtures/schema.graphql"),
    outDir,
    generateQueries: true,
    generateMutations: false,
    generateSubscriptions: false,
    silent: true,
  });

  // Check that files were generated
  assert.ok(result.length > 0, "Should generate at least one query file");

  // Check that query directory exists
  const queriesDir = path.join(outDir, "queries");
  const dirExists = await fs
    .stat(queriesDir)
    .then(() => true)
    .catch(() => false);
  assert.ok(dirExists, "Query directory should exist");

  // Check that query files exist
  const files = await fs.readdir(queriesDir);
  assert.ok(
    files.includes("getUser.graphql"),
    "Should generate getUser.graphql"
  );
  assert.ok(
    files.includes("getUsers.graphql"),
    "Should generate getUsers.graphql"
  );

  // Check content of getUser.graphql
  const getUserContent = await fs.readFile(
    path.join(queriesDir, "getUser.graphql"),
    "utf-8"
  );
  assert.ok(
    getUserContent.includes("query GetUser($id: ID!)"),
    "Should have proper operation name and variables"
  );
  assert.ok(
    getUserContent.includes("getUser(id: $id)"),
    "Should have proper field arguments"
  );
  assert.ok(getUserContent.includes("id"), "Should include id field");
  assert.ok(getUserContent.includes("name"), "Should include name field");

  await cleanupOutputDir(outDir);
});

test("generates mutations", async () => {
  const outDir = path.join(__dirname, "out");
  await cleanupOutputDir(outDir);

  const result = await generateOperations({
    schemaPath: path.join(__dirname, "fixtures/schema.graphql"),
    outDir,
    generateQueries: false,
    generateMutations: true,
    generateSubscriptions: false,
    silent: true,
  });

  // Check that files were generated
  assert.ok(result.length > 0, "Should generate at least one mutation file");

  // Check that mutations directory exists
  const mutationsDir = path.join(outDir, "mutations");
  const dirExists = await fs
    .stat(mutationsDir)
    .then(() => true)
    .catch(() => false);
  assert.ok(dirExists, "Mutations directory should exist");

  // Check that mutation files exist
  const files = await fs.readdir(mutationsDir);
  assert.ok(
    files.includes("createUser.graphql"),
    "Should generate createUser.graphql"
  );
  assert.ok(
    files.includes("updateUser.graphql"),
    "Should generate updateUser.graphql"
  );
  assert.ok(
    files.includes("deleteUser.graphql"),
    "Should generate deleteUser.graphql"
  );

  await cleanupOutputDir(outDir);
});

test("generates subscriptions", async () => {
  const outDir = path.join(__dirname, "out");
  await cleanupOutputDir(outDir);

  const result = await generateOperations({
    schemaPath: path.join(__dirname, "fixtures/schema.graphql"),
    outDir,
    generateQueries: false,
    generateMutations: false,
    generateSubscriptions: true,
    silent: true,
  });

  // Check that files were generated
  assert.ok(
    result.length > 0,
    "Should generate at least one subscription file"
  );

  // Check that subscriptions directory exists
  const subscriptionsDir = path.join(outDir, "subscriptions");
  const dirExists = await fs
    .stat(subscriptionsDir)
    .then(() => true)
    .catch(() => false);
  assert.ok(dirExists, "Subscriptions directory should exist");

  // Check that subscription files exist
  const files = await fs.readdir(subscriptionsDir);
  assert.ok(
    files.includes("userUpdated.graphql"),
    "Should generate userUpdated.graphql"
  );

  await cleanupOutputDir(outDir);
});

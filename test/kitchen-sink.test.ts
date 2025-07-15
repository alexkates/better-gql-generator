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

test("kitchen-sink - complex schema with interfaces, unions, and various types", async () => {
  const outDir = path.join(__dirname, "kitchen-sink-out");
  await cleanupOutputDir(outDir);

  const result = await generateOperations({
    schemaPath: path.join(__dirname, "fixtures/kitchen-sink-schema.graphql"),
    outDir,
    generateQueries: true,
    generateMutations: true,
    generateSubscriptions: true,
    verbose: true,
    silent: false,
  });

  // Check that files were generated
  assert.ok(result.length > 0, "Should generate operations");

  // Test queries
  const queriesDir = path.join(outDir, "queries");
  const queriesDirExists = await fs
    .stat(queriesDir)
    .then(() => true)
    .catch(() => false);
  assert.ok(queriesDirExists, "Queries directory should exist");

  // Verify key query files exist
  const queryFiles = await fs.readdir(queriesDir);
  const expectedQueries = [
    "node",
    "user",
    "users",
    "post",
    "posts",
    "search",
    "product",
    "products",
  ];
  for (const query of expectedQueries) {
    assert.ok(
      queryFiles.includes(`${query}.graphql`),
      `Should generate ${query}.graphql query`
    );
  }

  // Test node query with interface
  const nodeQueryContent = await fs.readFile(
    path.join(queriesDir, "node.graphql"),
    "utf-8"
  );
  assert.ok(
    nodeQueryContent.includes("query Node($id: ID!)"),
    "Should have proper node query operation name and variables"
  );
  assert.ok(
    nodeQueryContent.includes("node(id: $id)"),
    "Should have proper node query field arguments"
  );
  assert.ok(
    nodeQueryContent.includes("id"),
    "Should include id field from Node interface"
  );

  // Test search query with union type
  const searchQueryContent = await fs.readFile(
    path.join(queriesDir, "search.graphql"),
    "utf-8"
  );
  assert.ok(
    searchQueryContent.includes("query Search($input: SearchInput!)"),
    "Should have proper search query operation name and variables"
  );
  assert.ok(
    searchQueryContent.includes("search(input: $input)"),
    "Should have proper search query field arguments"
  );
  // Union types should include fields from all possible types
  assert.ok(
    searchQueryContent.includes("User") &&
      searchQueryContent.includes("Post") &&
      searchQueryContent.includes("Comment") &&
      searchQueryContent.includes("Product"),
    "Should handle union types correctly in search query"
  );

  // Test mutations
  const mutationsDir = path.join(outDir, "mutations");
  const mutationsDirExists = await fs
    .stat(mutationsDir)
    .then(() => true)
    .catch(() => false);
  assert.ok(mutationsDirExists, "Mutations directory should exist");

  // Verify key mutation files exist
  const mutationFiles = await fs.readdir(mutationsDir);
  const expectedMutations = [
    "createUser",
    "updateUser",
    "deleteUser",
    "login",
    "createPost",
    "updatePost",
    "addComment",
    "uploadFile",
  ];
  for (const mutation of expectedMutations) {
    assert.ok(
      mutationFiles.includes(`${mutation}.graphql`),
      `Should generate ${mutation}.graphql mutation`
    );
  }

  // Test createUser mutation with input type
  const createUserContent = await fs.readFile(
    path.join(mutationsDir, "createUser.graphql"),
    "utf-8"
  );
  assert.ok(
    createUserContent.includes("mutation CreateUser($input: UserInput!)"),
    "Should have proper createUser mutation operation name and variables"
  );
  assert.ok(
    createUserContent.includes("createUser(input: $input)"),
    "Should have proper createUser mutation field arguments"
  );
  assert.ok(
    createUserContent.includes("id") &&
      createUserContent.includes("name") &&
      createUserContent.includes("email"),
    "Should include basic User fields in createUser mutation"
  );

  // Test uploadFile mutation with custom scalar
  const uploadFileContent = await fs.readFile(
    path.join(mutationsDir, "uploadFile.graphql"),
    "utf-8"
  );
  assert.ok(
    uploadFileContent.includes("mutation UploadFile($file: Upload!)"),
    "Should handle custom scalar Upload in mutation variables"
  );
  assert.ok(
    uploadFileContent.includes("uploadFile(file: $file)"),
    "Should have proper uploadFile mutation field arguments"
  );
  assert.ok(
    uploadFileContent.includes("id") && uploadFileContent.includes("url"),
    "Should include MediaItem fields in uploadFile mutation"
  );

  // Test subscriptions
  const subscriptionsDir = path.join(outDir, "subscriptions");
  const subscriptionsDirExists = await fs
    .stat(subscriptionsDir)
    .then(() => true)
    .catch(() => false);
  assert.ok(subscriptionsDirExists, "Subscriptions directory should exist");

  // Verify subscription files exist
  const subscriptionFiles = await fs.readdir(subscriptionsDir);
  const expectedSubscriptions = [
    "userUpdated",
    "postCreated",
    "commentAdded",
    "notification",
  ];
  for (const subscription of expectedSubscriptions) {
    assert.ok(
      subscriptionFiles.includes(`${subscription}.graphql`),
      `Should generate ${subscription}.graphql subscription`
    );
  }

  // Test userUpdated subscription
  const userUpdatedContent = await fs.readFile(
    path.join(subscriptionsDir, "userUpdated.graphql"),
    "utf-8"
  );
  assert.ok(
    userUpdatedContent.includes("subscription UserUpdated($id: ID)"),
    "Should have proper userUpdated subscription operation name and variables"
  );
  assert.ok(
    userUpdatedContent.includes("userUpdated(id: $id)"),
    "Should have proper userUpdated subscription field arguments"
  );
  assert.ok(
    userUpdatedContent.includes("id") &&
      userUpdatedContent.includes("name") &&
      userUpdatedContent.includes("email"),
    "Should include User fields in userUpdated subscription"
  );

  // Clean up
  await cleanupOutputDir(outDir);
});

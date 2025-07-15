# Product Requirements Document (PRD)

**Project Name:** `better-gql-generator`  
**Version:** 1.0.0  
**Owner:** Alex Kates  
**Description:** A Bun + TypeScript-powered CLI tool that generates GraphQL operations (queries, mutations, subscriptions) from a local SDL schema. Designed to be fast, lightweight, and easily distributed as a binary using Bun's bundler.

---

## Overview

`better-gql-generator` is a CLI utility built with [Bun](https://bun.sh) and TypeScript that generates `.graphql` operation files (queries, mutations, and subscriptions) based on a local GraphQL schema (SDL format). It features high performance, a slick developer experience, and bundling into a single executable with Bun's binary compiler.

---

## Features

- ⚡ Blazing fast with Bun runtime
- 🧠 Written in TypeScript with type safety
- 🧰 CLI-only configuration using Bun's native argument parser
- 📁 Outputs `.graphql` files grouped by operation type
- 🧪 Built-in test suite using `bun test`
- 📦 Compiles into a single binary using Bun's `bun build`

---

## CLI Usage

```bash
bun run src/index.ts --schema ./schema.graphql --out ./generated --queries --mutations
```

Or as a compiled binary:

```bash
./better-gql-generator --schema ./schema.graphql --out ./generated --queries --mutations
```

### CLI Options

| Flag              | Description                              | Default         |
| ----------------- | ---------------------------------------- | --------------- |
| `--schema <path>` | Path to GraphQL schema file (SDL format) | _required_      |
| `--out <dir>`     | Output directory for generated files     | `generated-gql` |
| `--queries`       | Generate Query operations                | true            |
| `--mutations`     | Generate Mutation operations             | true            |
| `--subscriptions` | Generate Subscription operations         | false           |
| `--silent`        | Suppress logs                            | false           |
| `--verbose`       | Show debug output                        | false           |
| `--help`          | Show help output                         |                 |
| `--version`       | Show version number                      |                 |

---

## Output Structure

Generated files are saved in separate folders per operation type:

```
generated-gql/
├── queries/
│   └── getUser.graphql
├── mutations/
│   └── updateUser.graphql
├── subscriptions/
```

---

## Example Output

Given:

```graphql
type Query {
  getUser(id: ID!): User
}

type User {
  id: ID!
  name: String
}
```

Generated file `queries/getUser.graphql`:

```graphql
query GetUser($id: ID!) {
  getUser(id: $id) {
    id
    name
  }
}
```

---

## Stack

| Tool           | Purpose                          |
| -------------- | -------------------------------- |
| **Bun**        | Runtime, bundler, test runner    |
| **TypeScript** | Safe, typed code                 |
| `graphql`      | Schema parsing and AST traversal |

---

## Project Structure

```
better-gql-generator/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── generator.ts          # Core logic for generation
│   ├── logger.ts             # Optional verbose/silent logging
│   └── utils.ts              # Helpers for formatting and I/O
├── test/
│   └── kitchen-sink.test.ts  # Complex schema test
├── schema/
│   └── kitchen-sink.graphql  # Full-featured SDL schema for testing
├── bunfig.toml               # Bun config
├── tsconfig.json
├── README.md
```

---

## Testing

Tests are written using [`bun test`](https://bun.sh/docs/cli/test), Bun’s built-in test runner.

### Kitchen Sink Test

A single, comprehensive test (`kitchen-sink.test.ts`) validates support for:

- Interfaces
- Unions
- Enums
- Input types with nesting
- Custom scalars
- Directives
- Deep nesting and fragments

#### Example Test

```ts
import { test } from "bun:test";
import { generateOperations } from "../src/generator";
import { strict as assert } from "assert";

test("kitchen sink schema should generate valid operations", async () => {
  const result = await generateOperations({
    schemaPath: "./schema/kitchen-sink.graphql",
    outDir: "./tmp",
    generateQueries: true,
    generateMutations: true,
    generateSubscriptions: true,
  });

  assert.ok(result.includes("query"));
  assert.ok(result.includes("mutation"));
  assert.ok(result.includes("subscription"));
});
```

Run with:

```bash
bun test
```

---

## Building a Binary

Compile to a binary using Bun:

```bash
bun build src/index.ts --compile --outfile=better-gql-generator
```

Then run:

```bash
./better-gql-generator --schema schema.graphql --out out --queries
```

---

## Future Enhancements

- [ ] Add support for `.gqlgenrc.json`
- [ ] Customizable output file naming
- [ ] Remote schema support via introspection
- [ ] Watch mode
- [ ] Output TypeScript variable typings

---

## License

MIT

# Product Requirements Document (PRD)

**Project Name:** `better-gql-generator`  
**Version:** 1.0.0  
**Owner:** Alex Kates  
**Description:** A modern CLI tool that generates GraphQL operations (queries, mutations, subscriptions) from a local schema using TypeScript. Designed for simplicity, speed, and developer happiness.

---

## Overview

`better-gql-generator` is a TypeScript-based CLI that helps developers bootstrap GraphQL operation files (`.graphql`) from a local SDL schema. It offers a zero-config setup powered by CLI flags and includes stylish output using `chalk`, flexible controls via `commander`, and a native test suite using `node:test`.

---

## Features

- ✅ Generate `.graphql` operation files from a local SDL schema  
- ✅ Supports `Query`, `Mutation`, and `Subscription` generation  
- ✅ Grouped output into directories by operation type  
- ✅ CLI interface only — no config files or project setup required  
- ✅ Native unit tests via Node.js’s `node:test`  
- ✅ Developer-friendly, colorful CLI output via `chalk`

---

## CLI Usage

```bash
npx better-gql-generator --schema ./schema.graphql --out ./generated --queries --mutations
```

### CLI Options

| Flag                      | Description                                              | Default             |
|---------------------------|----------------------------------------------------------|---------------------|
| `-s, --schema <path>`     | Path to GraphQL schema file (SDL format)                 | _required_          |
| `-o, --out <dir>`         | Output directory for generated files                     | `generated-gql`     |
| `--queries`               | Generate Query operations                                | true                |
| `--mutations`             | Generate Mutation operations                             | true                |
| `--subscriptions`         | Generate Subscription operations                         | false               |
| `--silent`                | Suppress logs                                            | false               |
| `--verbose`               | Show debug output                                        | false               |
| `-h, --help`              | Display usage                                            |                     |
| `-v, --version`           | Show version                                             |                     |

> Note: All options are passed via CLI flags. No support for `.gqlgenrc.json` or similar files in MVP.

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

| Tool           | Purpose                        |
|----------------|--------------------------------|
| **TypeScript** | Safe, maintainable codebase    |
| `commander`    | Argument parsing for CLI       |
| `chalk`        | Stylized CLI output            |
| `graphql`      | Schema parsing and AST         |
| `fs/promises`  | File output                    |
| `node:test`    | Built-in test framework        |
| `assert`       | Node.js assertion library      |

---

## Project Structure

```
better-gql-generator/
├── bin/
│   └── index.ts           # CLI entry
├── src/
│   ├── generator.ts       # Core logic
│   ├── utils.ts           # Helpers (e.g., formatting, file I/O)
├── test/
│   ├── generator.test.ts  # Tests using node:test
│   └── fixtures/          # Sample schema files
├── package.json
├── tsconfig.json
├── README.md
```

---

## Testing

Use Node’s built-in `node:test` module to validate:

- Schema parsing  
- Operation generation logic  
- File writing behavior  
- CLI flag handling  
- Silent/verbose logging behavior  

### Sample Test

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOperations } from '../src/generator';

test('generates basic query', async () => {
  const operations = await generateOperations({
    schemaPath: './test/fixtures/schema.graphql',
    outDir: './test/out',
    generateQueries: true,
    generateMutations: false,
    generateSubscriptions: false
  });
  assert.ok(operations.includes('query'));
});
```

Run tests:

```bash
node --test
```

---

## Future Enhancements

- [ ] Add support for `.gqlgenrc.json`  
- [ ] Custom output naming templates  
- [ ] Remote schema introspection  
- [ ] TypeScript typings for variables  
- [ ] Watch mode for auto-generation  

---

## License

MIT

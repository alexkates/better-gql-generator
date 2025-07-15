# Better GraphQL Generator

A modern CLI tool that generates GraphQL operations (queries, mutations, subscriptions) from a local schema using TypeScript. Designed for simplicity, speed, and developer happiness.

## Features

- ✅ Generate `.graphql` operation files from a local SDL schema
- ✅ Supports `Query`, `Mutation`, and `Subscription` generation
- ✅ Grouped output into directories by operation type
- ✅ CLI interface only — no config files or project setup required
- ✅ Native unit tests via Node.js's `node:test`
- ✅ Developer-friendly, colorful CLI output via `chalk`

## Installation

```bash
# Install globally
npm install -g better-gql-generator

# Or run with npx
npx better-gql-generator --schema ./schema.graphql
```

## Usage

```bash
npx better-gql-generator --schema ./schema.graphql --out ./generated --queries --mutations
```

### CLI Options

| Flag                  | Description                              | Default         |
| --------------------- | ---------------------------------------- | --------------- |
| `-s, --schema <path>` | Path to GraphQL schema file (SDL format) | _required_      |
| `-o, --out <dir>`     | Output directory for generated files     | `generated-gql` |
| `--queries`           | Generate Query operations                | true            |
| `--mutations`         | Generate Mutation operations             | true            |
| `--subscriptions`     | Generate Subscription operations         | false           |
| `--silent`            | Suppress logs                            | false           |
| `--verbose`           | Show debug output                        | false           |
| `-h, --help`          | Display usage                            |                 |
| `-v, --version`       | Show version                             |                 |

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

Note that the generator automatically creates a properly formatted GraphQL operation with:

- Properly named operations (capitalized field name)
- Variables derived from input arguments
- Fields selected recursively to a reasonable depth
- Proper indentation for readability

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Run locally
npm run dev -- --schema ./test/fixtures/schema.graphql
```

## License

MIT

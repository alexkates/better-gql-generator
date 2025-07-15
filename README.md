# better-gql-generator

[![npm version](https://img.shields.io/npm/v/better-gql-generator.svg)](https://www.npmjs.com/package/better-gql-generator)
[![CI](https://github.com/alexkates/better-gql-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/alexkates/better-gql-generator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/better-gql-generator.svg)](https://www.npmjs.com/package/better-gql-generator)

A Bun + TypeScript-powered CLI tool that generates GraphQL operations (queries, mutations, subscriptions) from a local SDL schema. Designed to be fast, lightweight, and easily distributed as a binary using Bun's bundler.

## Features

- ⚡ Blazing fast with Bun runtime
- 🧠 Written in TypeScript with type safety
- 🧰 CLI-only configuration using Bun's native argument parser
- 📁 Outputs `.graphql` files grouped by operation type
- 🧪 Built-in test suite using `bun test`
- 📦 Compiles into a single binary using Bun's `bun build`

## Installation

### As a Development Dependency

```bash
# Using npm
npm install better-gql-generator --save-dev

# Using yarn
yarn add better-gql-generator --dev

# Using bun
bun add better-gql-generator --dev
```

### Globally

```bash
# Using npm
npm install -g better-gql-generator

# Using yarn
yarn global add better-gql-generator

# Using bun
bun add -g better-gql-generator
```

## Usage

### Using the CLI

```bash
better-gql-generator --schema ./schema.graphql --out ./generated --queries --mutations
```

Or if you're using it locally in a project:

```bash
npx better-gql-generator --schema ./schema.graphql --out ./generated --queries --mutations
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

## AWS AppSync Directives

This tool includes support for AWS AppSync directives in GraphQL schemas. It automatically:

1. Recognizes common AWS directives like `@aws_cognito_user_pools`, `@aws_api_key`, etc.
2. Strips these directives from the generated operations

### Example of Directive Stripping

Given a schema with AWS directives:

```graphql
type CustomerImport @aws_cognito_user_pools {
  completedAt: String
  createdAt: String!
  source: CustomerImportSource!
  status: CustomerImportStatus!
}
```

The generated operation will have the directive removed:

```graphql
query GetCustomerImport($id: ID!) {
  getCustomerImport(id: $id) {
    completedAt
    createdAt
    source
    status
  }
}
```

## Development

### Setup

```bash
# Clone the repo
git clone https://github.com/alexkates/better-gql-generator.git
cd better-gql-generator

# Install dependencies
bun install
```

### Running Tests

```bash
bun test
```

The tests create and use a temporary directory (`tmp/test-output`) which is automatically cleaned up after the tests complete.

### Building a Binary

```bash
bun run build
```

This will create a `better-gql-generator` executable in the `bin` directory.

### Publishing to NPM

This package is set up for NPM publishing. When you publish it, the binary will be included and made available to users:

```bash
# Bump the version (patch, minor, or major)
npm version patch # or minor or major

# Publish to npm
npm publish
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

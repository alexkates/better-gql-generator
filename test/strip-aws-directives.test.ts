import { describe, expect, it } from "bun:test";
import { stripAwsDirectives } from "../src/utils";

describe("stripAwsDirectives", () => {
  it("removes AWS directives from type definitions", () => {
    const input = `
type CustomerImport @aws_cognito_user_pools {
  completedAt: String
  createdAt: String!
  source: CustomerImportSource!
  status: CustomerImportStatus!
}`;

    const expected = `
type CustomerImport {
  completedAt: String
  createdAt: String!
  source: CustomerImportSource!
  status: CustomerImportStatus!
}`;

    expect(stripAwsDirectives(input)).toEqual(expected);
  });

  it("removes AWS directives with parameters", () => {
    const input = `
type Post @aws_auth(cognito_groups: ["Admins", "Editors"]) {
  id: ID!
  title: String!
  content: String!
  publishedAt: String @aws_api_key
}`;

    const expected = `
type Post {
  id: ID!
  title: String!
  content: String!
  publishedAt: String
}`;

    expect(stripAwsDirectives(input)).toEqual(expected);
  });

  it("removes AWS directives from multiple types", () => {
    const input = `
type User @aws_cognito_user_pools {
  id: ID!
  name: String!
}

type Post @aws_iam {
  id: ID!
  title: String!
}`;

    const expected = `
type User {
  id: ID!
  name: String!
}

type Post {
  id: ID!
  title: String!
}`;

    expect(stripAwsDirectives(input)).toEqual(expected);
  });

  it("removes AWS subscribe directive with mutations parameter", () => {
    const input = `
type Subscription {
  onCreatePost: Post @aws_subscribe(mutations: ["createPost"])
}`;

    const expected = `
type Subscription {
  onCreatePost: Post
}`;

    expect(stripAwsDirectives(input)).toEqual(expected);
  });
});

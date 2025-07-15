import { GraphQLType, isObjectType, isListType, isNonNullType, GraphQLInputType, isScalarType, isEnumType, isInterfaceType, isUnionType } from "graphql";

/**
 * Formats a field name as an operation name (camelCase to PascalCase)
 */
export function formatOperationName(fieldName: string): string {
  return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
}

/**
 * Formats GraphQL arguments as variables string
 */
export function formatArgumentsAsVariables(args: readonly any[]): string {
  if (!args || args.length === 0) {
    return "";
  }

  return args
    .map((arg) => {
      const typeString = printType(arg.type);
      return `$${arg.name}: ${typeString}`;
    })
    .join(", ");
}

/**
 * Formats a GraphQL selection set based on the field's type
 */
export function formatSelectionSet(type: GraphQLType): string {
  // Unwrap non-null and list types to get to the base object type
  let unwrappedType = unwrapType(type);

  // For scalar or enum types, we don't need a selection set
  if (isScalarType(unwrappedType) || isEnumType(unwrappedType)) {
    return "";
  }

  // For object, interface, or union types, create a selection set
  if (isObjectType(unwrappedType) || isInterfaceType(unwrappedType) || isUnionType(unwrappedType)) {
    const fields = isObjectType(unwrappedType) || isInterfaceType(unwrappedType) ? unwrappedType.getFields() : {};

    const fieldStrings: string[] = [];

    // If it's an object or interface, get all scalar fields
    if (isObjectType(unwrappedType) || isInterfaceType(unwrappedType)) {
      for (const fieldName in fields) {
        const field = fields[fieldName];
        const fieldType = unwrapType(field.type);

        // Only include scalar and enum fields directly
        if (isScalarType(fieldType) || isEnumType(fieldType)) {
          fieldStrings.push(fieldName);
        } else if (isObjectType(fieldType) || isInterfaceType(fieldType)) {
          // For object types, create a nested selection with just ID field to keep it simple
          fieldStrings.push(`${fieldName} {
      id
    }`);
        }
      }
    }

    // If it's a union type, we'd need to handle each possible type
    // This is simplified to just include the __typename field
    if (isUnionType(unwrappedType)) {
      fieldStrings.push("__typename");
    }

    return `{
    ${fieldStrings.join("\n    ")}
  }`;
  }

  // Default to empty selection set
  return "";
}

/**
 * Unwraps non-null and list types to get the base type
 */
function unwrapType(type: GraphQLType): GraphQLType {
  if (isNonNullType(type)) {
    return unwrapType(type.ofType);
  }
  if (isListType(type)) {
    return unwrapType(type.ofType);
  }
  return type;
}

/**
 * Prints a GraphQL type as a string
 */
function printType(type: GraphQLInputType): string {
  if (isNonNullType(type)) {
    return `${printType(type.ofType)}!`;
  }
  if (isListType(type)) {
    return `[${printType(type.ofType)}]`;
  }
  return type.toString();
}

/**
 * Process schema content to handle custom directives
 * This adds directive definitions for AWS AppSync and other common custom directives
 */
export function processSchemaWithCustomDirectives(schemaContent: string): string {
  // Add directive definitions for AWS AppSync directives if they don't already exist
  const directiveDefinitions = `
# AWS AppSync directives
directive @aws_api_key on FIELD_DEFINITION | OBJECT
directive @aws_cognito_user_pools on FIELD_DEFINITION | OBJECT
directive @aws_iam on FIELD_DEFINITION | OBJECT
directive @aws_lambda on FIELD_DEFINITION | OBJECT
directive @aws_subscribe(mutations: [String!]!) on FIELD_DEFINITION
directive @aws_auth(cognito_groups: [String!]) on FIELD_DEFINITION | OBJECT
directive @aws_oidc on FIELD_DEFINITION | OBJECT
# Add any other custom directives you need here
`;

  // Check if schema already has these directives defined
  if (!schemaContent.includes("directive @aws_cognito_user_pools")) {
    return directiveDefinitions + schemaContent;
  }

  return schemaContent;
}

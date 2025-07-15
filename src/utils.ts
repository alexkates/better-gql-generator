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
export function formatSelectionSet(type: GraphQLType, depth: number = 0): string {
  // Prevent infinite recursion with a max depth
  if (depth > 3) {
    return `{
    id
  }`;
  }

  // Unwrap non-null and list types to get to the base object type
  let unwrappedType = unwrapType(type);

  // For scalar or enum types, we don't need a selection set
  if (isScalarType(unwrappedType) || isEnumType(unwrappedType)) {
    return "";
  }

  // For object, interface, or union types, create a selection set
  if (isObjectType(unwrappedType) || isInterfaceType(unwrappedType) || isUnionType(unwrappedType)) {
    const fieldStrings: string[] = [];

    // If it's a union type, add __typename and handle each possible type
    if (isUnionType(unwrappedType)) {
      fieldStrings.push("__typename");

      // Get all possible types in the union
      const possibleTypes = unwrappedType.getTypes();

      // Add fragments for each possible type
      for (const possibleType of possibleTypes) {
        // Get fields of this possible type
        const fields = possibleType.getFields();
        const fragmentFields: string[] = [];

        // Get scalar and simple fields for this type
        for (const fieldName in fields) {
          const field = fields[fieldName];
          const fieldType = unwrapType(field.type);

          if (isScalarType(fieldType) || isEnumType(fieldType)) {
            fragmentFields.push(`      ${fieldName}`);
          } else if (isObjectType(fieldType) || isInterfaceType(fieldType)) {
            // Add a simple nested selection with ID for complex fields
            fragmentFields.push(`      ${fieldName} {
        id
      }`);
          }
        }

        // Add the fragment for this type
        fieldStrings.push(`    ... on ${possibleType.name} {
${fragmentFields.join("\n")}
    }`);
      }
    }
    // If it's an object or interface, get all fields
    else if (isObjectType(unwrappedType) || isInterfaceType(unwrappedType)) {
      // Always include __typename for interfaces
      if (isInterfaceType(unwrappedType)) {
        fieldStrings.push("__typename");
      }

      const fields = unwrappedType.getFields();

      for (const fieldName in fields) {
        const field = fields[fieldName];
        const fieldType = unwrapType(field.type);

        // Include scalar and enum fields directly
        if (isScalarType(fieldType) || isEnumType(fieldType)) {
          fieldStrings.push(fieldName);
        } else if (isObjectType(fieldType)) {
          // Create a nested selection for object types
          const nestedSelectionSet = formatSelectionSet(fieldType, depth + 1);
          fieldStrings.push(`${fieldName} ${nestedSelectionSet}`);
        } else if (isInterfaceType(fieldType)) {
          // For interface types, include the interface fields
          const nestedSelectionSet = formatSelectionSet(fieldType, depth + 1);
          fieldStrings.push(`${fieldName} ${nestedSelectionSet}`);
        } else if (isUnionType(fieldType)) {
          // For union types, include type-specific fragments
          const nestedSelectionSet = formatSelectionSet(fieldType, depth + 1);
          fieldStrings.push(`${fieldName} ${nestedSelectionSet}`);
        }
      }
    }

    // Create selection set and strip any AWS directives
    const selectionSet = `{
    ${fieldStrings.join("\n    ")}
  }`;

    return stripAwsDirectives(selectionSet);
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
 * Currently just passes through the schema content
 */
export function processSchemaWithCustomDirectives(schemaContent: string): string {
  // In this simplified version, we just pass through the schema
  // since we're now only stripping AWS directives rather than adding definitions
  return schemaContent;
}

/**
 * Strips AWS directives from GraphQL type definitions
 * This removes directives like @aws_cognito_user_pools from types
 */
export function stripAwsDirectives(content: string): string {
  // List of AWS directives to remove
  const awsDirectives = [
    "@aws_api_key",
    "@aws_cognito_user_pools",
    "@aws_iam",
    "@aws_lambda",
    "@aws_subscribe(mutations: [String!]!)",
    "@aws_auth(cognito_groups: [String!])",
    "@aws_oidc",
    // Add any other AWS directives you want to strip
  ];

  // Create a regex pattern that matches any of the AWS directives
  // This handles directives with optional parameters as well
  let processedContent = content;

  // Remove AWS directives from types and fields
  // Handle both parameterized directives like @aws_subscribe(mutations: ["createItem"])
  // and simple directives like @aws_cognito_user_pools
  awsDirectives.forEach((directive) => {
    // Get the directive name without parameters
    const directiveName = directive.split("(")[0];

    // Create regex to match the directive with any parameters
    const regex = new RegExp(`\\s*${directiveName}(\\([^)]*\\))?`, "g");
    processedContent = processedContent.replace(regex, "");
  });

  return processedContent;
}

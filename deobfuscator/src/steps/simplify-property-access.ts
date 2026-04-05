import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";

const traverse = (_traverse as any).default || _traverse;
const generate = (_generate as any).default || _generate;

export interface SimplifyPropertyResult {
  code: string;
  success: boolean;
  error?: string;
  stats?: {
    totalBracketAccesses: number;
    convertedToDot: number;
    keptAsBracket: number;
  };
}

// Valid JavaScript identifier pattern
const VALID_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

// Reserved words that cannot be used as property names without quotes
const RESERVED_WORDS = new Set([
  'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do',
  'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new',
  'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
  'with', 'class', 'const', 'enum', 'export', 'extends', 'import', 'super',
  'implements', 'interface', 'let', 'package', 'private', 'protected', 'public',
  'static', 'yield', 'await', 'true', 'false', 'null', 'undefined'
]);

export function simplifyPropertyAccess(code: string): SimplifyPropertyResult {
  let totalBracketAccesses = 0;
  let convertedToDot = 0;
  let keptAsBracket = 0;

  try {
    const ast = parse(code, {
      sourceType: "script",
      allowReturnOutsideFunction: true,
    });

    traverse(ast, {
      MemberExpression(path: any) {
        const { node } = path;

        // Only process bracket notation: obj["property"]
        if (!node.computed) return;

        // Must be a string literal
        if (!t.isStringLiteral(node.property)) return;

        totalBracketAccesses++;

        const propertyName = node.property.value;

        // Check if it's a valid identifier
        if (!VALID_IDENTIFIER.test(propertyName)) {
          keptAsBracket++;
          return;
        }

        // Check if it's not a reserved word
        if (RESERVED_WORDS.has(propertyName)) {
          keptAsBracket++;
          return;
        }

        // Convert to dot notation
        node.computed = false;
        node.property = t.identifier(propertyName);
        convertedToDot++;
      },
    });

    const output = generate(ast, { retainLines: true }).code;

    return {
      code: output,
      success: true,
      stats: {
        totalBracketAccesses,
        convertedToDot,
        keptAsBracket,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      code,
      success: false,
      error: `simplifyPropertyAccess failed: ${message}`,
    };
  }
}

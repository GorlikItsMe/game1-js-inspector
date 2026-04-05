import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";

const traverse = (_traverse as any).default || _traverse;
const generate = (_generate as any).default || _generate;

export interface InlineStringResult {
  code: string;
  success: boolean;
  error?: string;
  stats?: {
    totalCalls: number;
    inlinedCalls: number;
    skippedVariableCalls: number;
    skippedUnresolved: number;
  };
}

interface DecoderInfo {
  name: string;
  arrayName: string;
  offset: number;
  aliases: Set<string>;
}

export function inlineStringDecoder(code: string): InlineStringResult {
  let totalCalls = 0;
  let inlinedCalls = 0;
  let skippedVariableCalls = 0;
  let skippedUnresolved = 0;

  try {
    const ast = parse(code, {
      sourceType: "script",
      allowReturnOutsideFunction: true,
    });

    // Step 1: Find all decoder functions
    const decoders = findDecoderFunctions(ast);

    if (decoders.length === 0) {
      return {
        code,
        success: true,
        stats: { totalCalls: 0, inlinedCalls: 0, skippedVariableCalls: 0, skippedUnresolved: 0 },
      };
    }

    // Step 2: Find all aliases for each decoder
    findAliases(ast, decoders);

    // Step 3: Extract string arrays for each decoder
    const decoderArrays = new Map<string, string[]>();
    for (const decoder of decoders) {
      const array = extractStringArray(ast, decoder.arrayName);
      if (array) {
        decoderArrays.set(decoder.name, array);
      }
    }

    // Step 4: Replace all decoder calls with actual strings
    traverse(ast, {
      CallExpression(path: any) {
        const { node } = path;

        // Check if this is a decoder call
        const decoderInfo = getDecoderForCall(node, decoders);
        if (!decoderInfo) return;

        totalCalls++;

        // Get the argument
        const arg = node.arguments[0];
        if (!arg || !t.isNumericLiteral(arg)) {
          skippedVariableCalls++;
          console.warn(
            `Warning: Skipping decoder call with non-literal argument at line ${node.loc?.start.line}`
          );
          return;
        }

        const index = arg.value - decoderInfo.offset;
        const array = decoderArrays.get(decoderInfo.name);

        if (!array || index < 0 || index >= array.length) {
          skippedUnresolved++;
          console.warn(
            `Warning: Cannot resolve decoder call at line ${node.loc?.start.line}: index ${index} out of bounds`
          );
          return;
        }

        const actualString = array[index];
        path.replaceWith(t.stringLiteral(actualString));
        inlinedCalls++;
      },
    });

    const output = generate(ast, { retainLines: true }).code;

    return {
      code: output,
      success: true,
      stats: {
        totalCalls,
        inlinedCalls,
        skippedVariableCalls,
        skippedUnresolved,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      code,
      success: false,
      error: `inlineStringDecoder failed: ${message}`,
    };
  }
}

function findDecoderFunctions(ast: t.File): DecoderInfo[] {
  const decoders: DecoderInfo[] = [];
  let functionCount = 0;

  // Simple visitor pattern
  const visitor = {
    FunctionDeclaration(path: any) {
      const { node } = path;
      functionCount++;
      
      if (!node.id) return;

      const body = node.body.body;
      if (body.length < 3) return;

      // Look for: _0x4cc654 = _0x4cc654 - 0x12f
      const offsetMatch = findOffsetSubtraction(body);
      if (!offsetMatch) return;

      // Look for: const _0x259908 = a0_0x2599()
      const arrayCall = findArrayFunctionCall(body);
      if (!arrayCall) return;

      // Look for pattern: let x = array[index]; return x;
      // OR: return array[index];
      let returnVarName: string | null = null;
      let arrayVarName: string | null = null;
      let indexVarName: string | null = null;

      // First, check for direct return: return _0x259908[_0x4cc654]
      const returnStmt = body.find((stmt: t.Statement) => t.isReturnStatement(stmt)) as t.ReturnStatement | undefined;
      if (returnStmt) {
        if (t.isMemberExpression(returnStmt.argument)) {
          // Direct return: return _0x259908[_0x4cc654]
          const memberExpr = returnStmt.argument;
          if (t.isIdentifier(memberExpr.object) && t.isIdentifier(memberExpr.property)) {
            arrayVarName = memberExpr.object.name;
            indexVarName = memberExpr.property.name;
            returnVarName = null; // Direct return, no intermediate variable
          }
        } else if (t.isIdentifier(returnStmt.argument)) {
          // Return variable: return _0x5afda5
          // Find where this variable is assigned from array
          returnVarName = returnStmt.argument.name;
          const assignment = findVariableAssignmentFromArray(body, returnVarName, arrayCall.variableName);
          if (assignment) {
            arrayVarName = assignment.arrayVar;
            indexVarName = assignment.indexVar;
          }
        }
      }

      if (!arrayVarName || !indexVarName) {
        return;
      }

      // Verify the array variable matches
      if (arrayVarName !== arrayCall.variableName) {
        return;
      }

      decoders.push({
        name: node.id.name,
        arrayName: arrayCall.arrayFunctionName,
        offset: offsetMatch.offset,
        aliases: new Set(),
      });
    }
  };

  traverse(ast, visitor);

  return decoders;
}

function findVariableAssignmentFromArray(
  body: t.Statement[],
  varName: string,
  expectedArrayVar: string
): { arrayVar: string; indexVar: string } | null {
  for (const stmt of body) {
    if (!t.isVariableDeclaration(stmt)) continue;
    
    for (const decl of stmt.declarations) {
      if (!t.isIdentifier(decl.id) || decl.id.name !== varName) continue;
      if (!decl.init) continue;
      
      // Check if initialized from: _0x259908[_0x4cc654]
      if (t.isMemberExpression(decl.init)) {
        if (t.isIdentifier(decl.init.object) && t.isIdentifier(decl.init.property)) {
          if (decl.init.object.name === expectedArrayVar) {
            return {
              arrayVar: decl.init.object.name,
              indexVar: decl.init.property.name
            };
          }
        }
      }
    }
  }
  return null;
}

function findOffsetSubtraction(body: t.Statement[]): { offset: number } | null {
  for (const stmt of body) {
    if (!t.isExpressionStatement(stmt)) continue;
    const { expression } = stmt;

    // Pattern: _0x4cc654 = _0x4cc654 - 0x12f
    if (!t.isAssignmentExpression(expression)) continue;
    if (expression.operator !== "=") continue;
    if (!t.isBinaryExpression(expression.right)) continue;
    if (expression.right.operator !== "-") continue;

    const left = expression.left;
    const rightLeft = expression.right.left;
    const rightRight = expression.right.right;

    // Check that both sides use the same identifier
    if (!t.isIdentifier(left) || !t.isIdentifier(rightLeft)) continue;
    if (left.name !== rightLeft.name) continue;

    // Check that the right side is a numeric literal
    if (!t.isNumericLiteral(rightRight)) continue;

    return { offset: rightRight.value };
  }

  return null;
}

function findArrayFunctionCall(body: t.Statement[]): { variableName: string; arrayFunctionName: string } | null {
  for (const stmt of body) {
    if (!t.isVariableDeclaration(stmt)) continue;

    for (const decl of stmt.declarations) {
      if (!t.isIdentifier(decl.id)) continue;
      if (!decl.init) continue;

      // Pattern: const _0x259908 = a0_0x2599()
      if (!t.isCallExpression(decl.init)) continue;
      if (!t.isIdentifier(decl.init.callee)) continue;
      if (decl.init.arguments.length !== 0) continue;

      return {
        variableName: decl.id.name,
        arrayFunctionName: decl.init.callee.name,
      };
    }
  }

  return null;
}

function findAliases(ast: t.File, decoders: DecoderInfo[]): void {
  const decoderNames = new Set(decoders.map((d) => d.name));

  traverse(ast, {
    VariableDeclarator(path: any) {
      const { node } = path;
      if (!t.isIdentifier(node.id)) return;
      if (!node.init) return;

      // Pattern: const a0_0x2f1e8a = a0_0x5afd
      if (!t.isIdentifier(node.init)) return;

      const targetName = node.init.name;
      const aliasName = node.id.name;

      // Check if this is an alias for any decoder
      for (const decoder of decoders) {
        if (decoderNames.has(targetName)) {
          decoder.aliases.add(aliasName);
          decoderNames.add(aliasName);
        }
      }
    },
  });
}

function getDecoderForCall(node: t.CallExpression, decoders: DecoderInfo[]): DecoderInfo | null {
  if (!t.isIdentifier(node.callee)) return null;

  const callName = node.callee.name;

  for (const decoder of decoders) {
    if (decoder.name === callName || decoder.aliases.has(callName)) {
      return decoder;
    }
  }

  return null;
}

function extractStringArray(ast: t.File, arrayFunctionName: string): string[] | null {
  let strings: string[] | null = null;

  traverse(ast, {
    FunctionDeclaration(path: any) {
      const { node } = path;
      if (!node.id || node.id.name !== arrayFunctionName) return;

      // Look for: const _0x557293 = ['renderedBuffer', 'fillText', ...]
      const body = node.body.body;

      for (const stmt of body) {
        if (!t.isVariableDeclaration(stmt)) continue;

        for (const decl of stmt.declarations) {
          if (!t.isIdentifier(decl.id)) continue;
          if (!decl.init) continue;

          // Pattern: const _0x557293 = ['a', 'b', 'c']
          if (t.isArrayExpression(decl.init)) {
            const elements = decl.init.elements;
            strings = [];

            for (const elem of elements) {
              if (t.isStringLiteral(elem)) {
                strings.push(elem.value);
              } else {
                // Skip non-string elements (like other decoder calls)
                strings.push("");
              }
            }

            return;
          }
        }
      }
    },
  });

  return strings;
}

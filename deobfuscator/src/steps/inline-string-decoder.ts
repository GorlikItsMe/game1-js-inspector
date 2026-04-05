import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";
import { createContext, runInContext } from "node:vm";

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
  dependencies: string[]; // Names of functions this decoder calls
  functionCode: string;
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

    console.log(`[Debug] Found ${decoders.length} decoder functions`);
    for (const d of decoders) {
      console.log(`[Debug] Decoder: ${d.name}, deps: [${d.dependencies.join(', ')}]`);
    }

    // Step 2: Extract complete code for all decoders and their dependencies
    extractCompleteCode(ast, decoders);

    // Step 3: Create VM context with all decoder functions
    const vmContext = createDecoderVM(code, decoders);
    if (!vmContext) {
      return {
        code,
        success: false,
        error: "Failed to create VM context",
      };
    }

    // Step 4: Replace all decoder calls with actual strings
    let callCount = 0;
    traverse(ast, {
      CallExpression(path: any) {
        const { node } = path;
        
        callCount++;
        if (callCount <= 5) {
          console.log(`[Debug] Call #${callCount}: ${node.callee?.name || 'unknown'}(${node.arguments[0]?.value || '?'})`);
        }

        // Check if this is a decoder call
        const decoderName = getDecoderName(node, decoders);
        if (!decoderName) return;
        
        if (callCount <= 5) {
          console.log(`[Debug] -> Recognized as decoder call to ${decoderName}`);
        }

        totalCalls++;

        // Get the argument
        const arg = node.arguments[0];
        if (!arg || !t.isNumericLiteral(arg)) {
          skippedVariableCalls++;
          return;
        }

        const argValue = arg.value;

        // Execute decoder in VM to get the actual string
        try {
          const result = runInContext(`${decoderName}(${argValue})`, vmContext);
          
          // Debug specific values
          if (argValue === 569 || argValue === 409) {
            console.log(`[Debug] VM ${decoderName}(${argValue}) = "${result}"`);
          }

          if (typeof result !== "string") {
            skippedUnresolved++;
            return;
          }

          path.replaceWith(t.stringLiteral(result));
          inlinedCalls++;
        } catch (err) {
          skippedUnresolved++;
        }
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

  traverse(ast, {
    FunctionDeclaration(path: any) {
      const { node } = path;
      if (!node.id) return;

      const body = node.body.body;
      if (body.length < 3) return;

      // Look for: _0x4cc654 = _0x4cc654 - 0x12f (offset pattern)
      const offsetMatch = findOffsetSubtraction(body);
      if (!offsetMatch) return;

      // Look for: const _0x259908 = a0_0x2599() (array call)
      const arrayCall = findArrayFunctionCall(body);
      if (!arrayCall) return;

      // Find all function calls in the body (dependencies)
      const dependencies = findFunctionCallsInBody(body);

      decoders.push({
        name: node.id.name,
        dependencies: [...dependencies], // All functions this decoder calls
        functionCode: "",
      });
    },
  });

  return decoders;
}

function findFunctionCallsInBody(body: t.Statement[]): Set<string> {
  const calls = new Set<string>();

  for (const stmt of body) {
    traverseFunctionCalls(stmt, calls);
  }

  return calls;
}

function traverseFunctionCalls(node: any, calls: Set<string>): void {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'CallExpression' && t.isIdentifier(node.callee)) {
    calls.add(node.callee.name);
  }

  // Recursively check all properties
  for (const key in node) {
    if (key === 'type' || key === 'loc' || key === 'start' || key === 'end') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach(item => traverseFunctionCalls(item, calls));
    } else {
      traverseFunctionCalls(value, calls);
    }
  }
}

function extractCompleteCode(ast: t.File, decoders: DecoderInfo[]): void {
  // Collect ALL function names we need (decoders + ALL their dependencies)
  const allFunctionNames = new Set<string>();
  for (const decoder of decoders) {
    allFunctionNames.add(decoder.name);
    for (const dep of decoder.dependencies) {
      allFunctionNames.add(dep);
    }
  }

  // Extract code for ALL functions, not just decoders
  const functionCodes = new Map<string, string>();

  traverse(ast, {
    FunctionDeclaration(path: any) {
      const { node } = path;
      if (!node.id) return;

      const funcName = node.id.name;
      
      // Only extract functions we need (decoders and their dependencies)
      if (!allFunctionNames.has(funcName)) return;

      // Extract complete function including all statements
      const funcAst = t.file(t.program([node as t.Statement]));
      const code = generate(funcAst).code;
      functionCodes.set(funcName, code);
      
      console.log(`[Debug] Extracted code for ${funcName} (${code.length} chars)`);
    },
  });

  // Assign codes to decoders
  for (const decoder of decoders) {
    const code = functionCodes.get(decoder.name);
    if (code) {
      decoder.functionCode = code;
    }
  }
  
  // Store all dependency codes too - we'll use them in createDecoderVM
  (decoders as any).allFunctionCodes = functionCodes;
}

function createDecoderVM(code: string, decoders: DecoderInfo[]): any {
  try {
    const context = createContext({
      console: { log: () => {}, error: () => {}, warn: () => {} },
    });

    // Execute the FULL code in VM first (including anti-tamper rotation)
    // This is critical - the anti-tamper code at the top rotates the array
    try {
      runInContext(code, context);
      console.log(`[Debug] Full code executed in VM (including anti-tamper)`);
    } catch (err) {
      console.warn(`[Debug] Error executing full code:`, err);
      // Continue anyway - the functions might still be defined
    }

    // Verify decoder is available
    const decoder = decoders[0];
    if (decoder) {
      try {
        const testResult = runInContext(`typeof ${decoder.name}`, context);
        console.log(`[Debug] Decoder ${decoder.name} type: ${testResult}`);
      } catch (e) {
        console.warn(`[Debug] Decoder ${decoder.name} not available`);
      }
    }

    return context;
  } catch (err) {
    console.error("Failed to create VM context:", err);
    return null;
  }
}

function getDecoderName(node: t.CallExpression, decoders: DecoderInfo[]): string | null {
  if (!t.isIdentifier(node.callee)) return null;

  const callName = node.callee.name;

  for (const decoder of decoders) {
    if (decoder.name === callName) {
      return decoder.name;
    }
    // Also check if this is a call to a dependency (which might also be a decoder)
    if (decoder.dependencies.includes(callName)) {
      return callName;
    }
  }

  return null;
}

function findOffsetSubtraction(body: t.Statement[]): { offset: number } | null {
  for (const stmt of body) {
    if (!t.isExpressionStatement(stmt)) continue;
    const { expression } = stmt;

    if (!t.isAssignmentExpression(expression)) continue;
    if (expression.operator !== "=") continue;
    if (!t.isBinaryExpression(expression.right)) continue;
    if (expression.right.operator !== "-") continue;

    const left = expression.left;
    const rightLeft = expression.right.left;
    const rightRight = expression.right.right;

    if (!t.isIdentifier(left) || !t.isIdentifier(rightLeft)) continue;
    if (left.name !== rightLeft.name) continue;
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

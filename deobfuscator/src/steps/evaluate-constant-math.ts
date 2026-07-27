import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";

const traverse = (_traverse as any).default || _traverse;
const generate = (_generate as any).default || _generate;

export interface EvaluateConstantMathResult {
  code: string;
  success: boolean;
  error?: string;
  stats?: {
    expressionsEvaluated: number;
  };
}

export function evaluateConstantMath(code: string): EvaluateConstantMathResult {
  try {
    const ast = parse(code, {
      sourceType: "script",
      allowReturnOutsideFunction: true,
      errorRecovery: true,
    });

    let expressionsEvaluated = 0;

    traverse(ast, {
      UnaryExpression: {
        exit(path: any) {
          const { node } = path;
          if (
            t.isNumericLiteral(node.argument) &&
            (node.operator === "-" || node.operator === "+")
          ) {
            const value = node.operator === "-"
              ? -node.argument.value
              : +node.argument.value;
            path.replaceWith(t.numericLiteral(value));
            expressionsEvaluated++;
          }
        }
      },
      BinaryExpression: {
        exit(path: any) {
          const { node } = path;
          if (t.isNumericLiteral(node.left) && t.isNumericLiteral(node.right)) {
            let value: number;
            switch (node.operator) {
              case "+": value = node.left.value + node.right.value; break;
              case "-": value = node.left.value - node.right.value; break;
              case "*": value = node.left.value * node.right.value; break;
              case "/": value = node.left.value / node.right.value; break;
              case "%": value = node.left.value % node.right.value; break;
              case "**": value = node.left.value ** node.right.value; break;
              default: return;
            }
            path.replaceWith(t.numericLiteral(value));
            expressionsEvaluated++;
          }
        }
      },
    });

    if (expressionsEvaluated === 0) {
      return { code, success: true, stats: { expressionsEvaluated: 0 } };
    }

    const output = generate(ast, {
      retainLines: false,
      compact: false,
    });

    return {
      code: output.code,
      success: true,
      stats: { expressionsEvaluated },
    };
  } catch (error) {
    return {
      code,
      success: true,
      stats: { expressionsEvaluated: 0 },
    };
  }
}

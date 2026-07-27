import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";

const traverse = (_traverse as any).default || _traverse;
const generate = (_generate as any).default || _generate;

export interface RenameRule {
  name: string;
  keywords: string[];
  optional?: boolean;
  canBeOverwritten?: boolean;
}

export interface RenameIdentifiersResult {
  code: string;
  success: boolean;
  error?: string;
  stats?: {
    renamesApplied: number;
  };
}

export function validateRules(rules: RenameRule[]): void {
  const seenNames = new Set<string>();
  const seenKeywords = new Set<string>();

  for (const rule of rules) {
    if (seenNames.has(rule.name)) {
      throw new Error(`Duplicate rule name: "${rule.name}"`);
    }
    seenNames.add(rule.name);

    const key = [...rule.keywords].sort().join('|');
    if (seenKeywords.has(key)) {
      throw new Error(`Duplicate keywords: ${rule.keywords.map(k => `"${k}"`).join(', ')}`);
    }
    seenKeywords.add(key);
  }
}

function isLargeArray(init: any): boolean {
  return t.isArrayExpression(init) && init.elements.length > 50;
}

function isStringArrayFunctionBody(bodyNode: any): boolean {
  if (!t.isBlockStatement(bodyNode)) return false;
  const firstStmt = bodyNode.body[0];
  if (!t.isVariableDeclaration(firstStmt)) return false;
  const decl = firstStmt.declarations[0];
  if (!t.isArrayExpression(decl?.init)) return false;
  return decl.init.elements.length > 50;
}

export function renameIdentifiers(
  code: string,
  rules?: RenameRule[]
): RenameIdentifiersResult {
  const activeRules = (rules && rules.length > 0) ? rules : [];
  if (activeRules.length === 0) {
    return { code, success: true, stats: { renamesApplied: 0 } };
  }

  try {
    validateRules(activeRules);
    const ast = parse(code, {
      sourceType: "script",
      allowReturnOutsideFunction: true,
      errorRecovery: true,
    });

    let totalRenames = 0;
    const usedTargetNames = new Set<string>();

    for (const rule of activeRules) {
      const candidates: Array<{ oldName: string; scope: any; path: any }> = [];

      traverse(ast, {
        FunctionDeclaration(path: any) {
          const name = path.node.id?.name;
          if (!name) return;
          if (isStringArrayFunctionBody(path.node.body)) return;
          try {
            const bodyCode = generate(path.node.body).code;
            if (rule.keywords.every((kw: string) => bodyCode.includes(kw))) {
              candidates.push({ oldName: name, scope: path.scope, path });
            }
          } catch { /* skip */ }
        },
        VariableDeclarator(path: any) {
          const name = (path.node.id as any)?.name;
          if (!name) return;
          if (t.isFunctionExpression(path.node.init) || t.isArrowFunctionExpression(path.node.init)) {
            const body = path.node.init.body;
            if (isStringArrayFunctionBody(body)) return;
            try {
              const bodyCode = generate(body).code;
              if (rule.keywords.every((kw: string) => bodyCode.includes(kw))) {
                candidates.push({ oldName: name, scope: path.scope, path });
              }
            } catch { /* skip */ }
          } else {
            if (isLargeArray(path.node.init)) return;
            try {
              const declCode = generate(path.node).code;
              if (rule.keywords.every((kw: string) => declCode.includes(kw))) {
                candidates.push({ oldName: name, scope: path.scope, path });
              }
            } catch { /* skip */ }
          }
        },
      });

      if (candidates.length === 0 && !rule.optional) {
        return {
          code,
          success: false,
          error: `Rule "${rule.name}" did not match any identifier.`,
        };
      }

      if (candidates.length > 1) {
        const filtered = candidates.filter((c) =>
          !candidates.some((other) => c.path !== other.path && c.path.isAncestor?.(other.path))
        );

        if (filtered.length === 1) {
          candidates.length = 0;
          candidates.push(filtered[0]);
        } else {
          const dataDecl = filtered.filter((c) =>
            t.isVariableDeclarator(c.path.node) &&
            !t.isFunctionExpression(c.path.node.init) &&
            !t.isArrowFunctionExpression(c.path.node.init)
          );
          if (dataDecl.length === 1) {
            candidates.length = 0;
            candidates.push(dataDecl[0]);
          } else {
            const names = filtered.map((c) => c.oldName).join(', ');
            return {
              code,
              success: false,
              error: `Rule "${rule.name}" matched ${filtered.length} identifiers: ${names}. Make keywords more specific.`,
            };
          }
        }
      }

      if (candidates.length === 1) {
        const { oldName, scope } = candidates[0];
        if (usedTargetNames.has(oldName)) {
          if (rule.canBeOverwritten) {
            continue;
          }
          return {
            code,
            success: false,
            error: `Rule "${rule.name}" matched "${oldName}", which was already renamed by a previous rule.`,
          };
        }
        if (scope.getBinding(rule.name)) {
          return {
            code,
            success: false,
            error: `Cannot rename "${oldName}" to "${rule.name}": "${rule.name}" already exists in scope.`,
          };
        }
        scope.rename(oldName, rule.name);
        usedTargetNames.add(rule.name);
        totalRenames++;
      }
    }

    const output = generate(ast, { retainLines: false, compact: false });

    return {
      code: totalRenames > 0 ? output.code : code,
      success: true,
      stats: { renamesApplied: totalRenames },
    };
  } catch (error) {
    return {
      code,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

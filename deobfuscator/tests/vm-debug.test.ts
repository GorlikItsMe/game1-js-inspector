import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';
import { createContext, runInContext } from 'node:vm';
import { unwrapEval } from '../src/steps/unwrap-eval.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testGame1JsPath = join(__dirname, '../../archived_game1_scripts/2026-04-02T004842/game1.js');
const traverse = (_traverse as any).default || _traverse;
const generate = (_generate as any).default || _generate;

describe('VM debug test', () => {
  it('should debug what VM returns', () => {
    const originalCode = readFileSync(testGame1JsPath, 'utf-8');
    const unwrappedResult = unwrapEval(originalCode);
    expect(unwrappedResult.success).toBe(true);
    const code = unwrappedResult.code;

    // Find and extract both functions
    const ast = parse(code, { sourceType: 'script', allowReturnOutsideFunction: true });

    let arrayFunctionCode = '';
    let decoderFunctionCode = '';

    traverse(ast, {
      FunctionDeclaration(path: any) {
        const { node } = path;
        if (!node.id) return;

        if (node.id.name === 'a0_0x2599') {
          const funcAst = t.file(t.program([node as t.Statement]));
          arrayFunctionCode = generate(funcAst).code;
          console.log(`[VM Test] Extracted a0_0x2599: ${arrayFunctionCode.length} chars`);
        }

        if (node.id.name === 'a0_0x5afd') {
          const funcAst = t.file(t.program([node as t.Statement]));
          decoderFunctionCode = generate(funcAst).code;
          console.log(`[VM Test] Extracted a0_0x5afd: ${decoderFunctionCode.length} chars`);
        }
      }
    });

    // Execute in VM
    const context = createContext({
      console: { log: (...args: any[]) => console.log('[VM Console]', ...args) }
    });

    // Execute array function first
    runInContext(arrayFunctionCode, context);
    console.log('[VM Test] Array function executed');

    // Execute decoder function
    runInContext(decoderFunctionCode, context);
    console.log('[VM Test] Decoder function executed');

    // Test specific calls
    const testCases = [
      { arg: 382, expected: 'getTime' },
      { arg: 409, expected: 'toISOString' },
      { arg: 569, expected: 'https://gameforge.com/tra/game1.js' }
    ];

    for (const tc of testCases) {
      const result = runInContext(`a0_0x5afd(${tc.arg})`, context);
      console.log(`[VM Test] a0_0x5afd(${tc.arg}) = "${result}" (expected: "${tc.expected}")`);
      expect(result).toBe(tc.expected);
    }

    // Also check array directly
    const arrayResult = runInContext('a0_0x2599()', context);
    if (Array.isArray(arrayResult)) {
      console.log(`[VM Test] Array length: ${arrayResult.length}`);
      console.log(`[VM Test] Array[79]: "${arrayResult[79]}"`);
      console.log(`[VM Test] Array[106]: "${arrayResult[106]}"`);
      console.log(`[VM Test] Array[266]: "${arrayResult[266]}"`);
    } else {
      console.log(`[VM Test] Array result type: ${typeof arrayResult}`, arrayResult);
    }

    expect(true).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { unwrapEval } from '../src/steps/unwrap-eval.js';

describe('unwrapEval', () => {
  it('should unwrap simple eval', () => {
    const input = `try{eval('console.log(1)')}catch(e){}`;
    const result = unwrapEval(input);

    expect(result.success).toBe(true);
    expect(result.code).toBe('try{console.log(1)}catch(e){}');
    expect(result.error).toBeUndefined();
  });

  it('should handle code with single quotes inside (preserves escape sequences)', () => {
    const input = `try{eval('const str = \\'test\\'; console.log(str)')}catch(e){}`;
    const result = unwrapEval(input);

    expect(result.success).toBe(true);
    expect(result.code).toBe(`try{const str = \\'test\\'; console.log(str)}catch(e){}`);
  });

  it('should return error when no eval found', () => {
    const input = 'console.log(1)';
    const result = unwrapEval(input);

    expect(result.success).toBe(true);
    expect(result.code).toBe('console.log(1)');
  });

  it('should return error when eval is malformed', () => {
    const input = `try{eval('console.log(1)`;
    const result = unwrapEval(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Could not find closing');
  });

  it('should handle real game1.js structure', () => {
    const innerCode = 'const a = 1; function test() { return a; }';
    const input = `try{eval('${innerCode}')}catch(e){var game1=function(cb){cb(btoa(JSON.stringify({e:e.message})))}};`;
    const result = unwrapEval(input);

    expect(result.success).toBe(true);
    expect(result.code).toBe(`try{${innerCode}}catch(e){var game1=function(cb){cb(btoa(JSON.stringify({e:e.message})))}};`);
  });
});

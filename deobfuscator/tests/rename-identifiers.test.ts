import { describe, it, expect } from 'vitest';
import { renameIdentifiers } from '../src/steps/rename-identifiers.js';

describe('renameIdentifiers', () => {
  it('should error on duplicate rule names', () => {
    const result = renameIdentifiers('const x = 1;', [
      { name: 'foo', keywords: ['x'] },
      { name: 'foo', keywords: ['y'] },
    ]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Duplicate rule name');
  });

  it('should error on duplicate keywords', () => {
    const result = renameIdentifiers('const x = 1;', [
      { name: 'foo', keywords: ['a', 'b'] },
      { name: 'bar', keywords: ['b', 'a'] },
    ]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Duplicate keywords');
  });

  it('should error when target name already exists in scope', () => {
    const input = `function foo() { return 1; } function _0x1234() { return foo(); }`;
    const result = renameIdentifiers(input, [
      { name: 'foo', keywords: ['return foo'] },
    ]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('should rename function by matching keywords in body', () => {
    const input = `function a0_0x1234() { return new XMLHttpRequest(); }`;
    const result = renameIdentifiers(input, [
      { name: 'createXHR', keywords: ['XMLHttpRequest'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.code).toContain('function createXHR');
    expect(result.code).not.toContain('a0_0x1234');
    expect(result.stats?.renamesApplied).toBe(1);
  });

  it('should update all references after function rename', () => {
    const input = `function a0_0x1234() { return 42; } let x = a0_0x1234(); let y = a0_0x1234();`;
    const result = renameIdentifiers(input, [
      { name: 'getAnswer', keywords: ['return 42'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.code).toContain('function getAnswer');
    expect(result.code).toContain('let x = getAnswer()');
    expect(result.code).toContain('let y = getAnswer()');
    expect(result.stats?.renamesApplied).toBe(1);
  });

  it('should rename arrow function assigned to variable', () => {
    const input = `const a0_0x1234 = () => { console.log("hello"); }; a0_0x1234();`;
    const result = renameIdentifiers(input, [
      { name: 'greet', keywords: ['console.log', 'hello'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.code).toContain('const greet =');
    expect(result.code).toContain('greet()');
    expect(result.stats?.renamesApplied).toBe(1);
  });

  it('should rename function expression assigned to variable', () => {
    const input = `const a0_0x1234 = function() { return Math.random(); };`;
    const result = renameIdentifiers(input, [
      { name: 'getRandom', keywords: ['Math.random'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.code).toContain('const getRandom =');
    expect(result.stats?.renamesApplied).toBe(1);
  });

  it('should rename variable by matching keywords in declaration', () => {
    const input = `const a0_0x1234 = "https://example.com/script.js";`;
    const result = renameIdentifiers(input, [
      { name: 'SCRIPT_URL', keywords: ['example.com', 'script.js'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.code).toContain('const SCRIPT_URL =');
    expect(result.stats?.renamesApplied).toBe(1);
  });

  it('should update all references after variable rename', () => {
    const input = `const _0x1234 = "hello"; console.log(_0x1234); fn(_0x1234);`;
    const result = renameIdentifiers(input, [
      { name: 'GREETING', keywords: ['"hello"'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.code).toContain('const GREETING =');
    expect(result.code).toContain('console.log(GREETING)');
    expect(result.code).toContain('fn(GREETING)');
    expect(result.stats?.renamesApplied).toBe(1);
  });

  // ─── Error cases ────────────────────────────────────────

  it('should error when rule matches multiple identifiers at same level', () => {
    const input = `
function a0_0x1() { useFoo(); return 1; }
function a0_0x2() { useFoo(); return 2; }
    `.trim();
    const result = renameIdentifiers(input, [
      { name: 'doSomething', keywords: ['useFoo'] },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toContain('matched 2 identifiers');
  });

  // ─── Parent-child disambiguation ────────────────────────

  it('should prefer innermost function when parent also matches keywords', () => {
    const input = `
function a0_0x1() {
  function a0_0x2() {
    return new XMLHttpRequest();
  }
  a0_0x2();
}
    `.trim();
    const result = renameIdentifiers(input, [
      { name: 'createXHR', keywords: ['XMLHttpRequest'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.stats?.renamesApplied).toBe(1);
    expect(result.code).toContain('function createXHR');
    expect(result.code).not.toContain('function a0_0x2');
    expect(result.code).toContain('function a0_0x1');
    expect(result.code).toContain('createXHR()');
  });

  it('should disambiguate nested function expression in variable', () => {
    const input = `
var game1 = async function() {
  async function _0x20e0b3() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    return xhr.getResponseHeader("date");
  }
  await _0x20e0b3();
};
    `.trim();
    const result = renameIdentifiers(input, [
      { name: 'fetchServerTime', keywords: ['XMLHttpRequest', 'getResponseHeader'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.stats?.renamesApplied).toBe(1);
    expect(result.code).toContain('async function fetchServerTime');
    expect(result.code).toContain('var game1');
    expect(result.code).toContain('await fetchServerTime()');
  });

  // ─── Optional rules ─────────────────────────────────────

  it('should error when non-optional rule matches nothing', () => {
    const input = `const x = 1;`;
    const result = renameIdentifiers(input, [
      { name: 'NON_EXISTENT', keywords: ['nonexistent'] },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toContain('did not match any identifier');
  });

  it('should skip optional rule when it matches nothing', () => {
    const input = `const x = 1;`;
    const result = renameIdentifiers(input, [
      { name: 'MAYBE', keywords: ['nonexistent'], optional: true },
    ]);

    expect(result.success).toBe(true);
    expect(result.stats?.renamesApplied).toBe(0);
  });

  it('should still apply optional rule when it does match', () => {
    const input = `const _0x1234 = "hello";`;
    const result = renameIdentifiers(input, [
      { name: 'MSG', keywords: ['"hello"'], optional: true },
    ]);

    expect(result.success).toBe(true);
    expect(result.stats?.renamesApplied).toBe(1);
    expect(result.code).toContain('const MSG =');
  });

  // ─── Sequential renames using previously renamed names ──

  it('should rename in steps, using previously renamed names in keywords', () => {
    const input = `
const _0xouter = () => {
  const _0xinner = Math.PI;
  return _0xinner + 1;
};
    `.trim();
    const result = renameIdentifiers(input, [
      { name: 'PI', keywords: ['Math.PI'] },
      { name: 'piPlusOne', keywords: ['PI', '+ 1'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.stats?.renamesApplied).toBe(2);
    expect(result.code).toContain('const PI = Math.PI');
    expect(result.code).toContain('return PI');
    expect(result.code).toContain('const piPlusOne');
  });

  it('should rename across 3 nested function levels', () => {
    const input = `
const _0x1 = () => {
  const _0x2 = () => {
    const _0x3 = () => {
      const _0x4 = Math.PI;
      return _0x4;
    };
    return _0x3() + 1;
  };
  return _0x2();
};
    `.trim();
    const result = renameIdentifiers(input, [
      { name: 'PI', keywords: ['Math.PI'] },
      { name: 'getPi', keywords: ['PI', 'return PI'] },
      { name: 'getPiPlusOne', keywords: ['getPi', '+ 1'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.stats?.renamesApplied).toBe(3);
    expect(result.code).toContain('const PI = Math.PI');
    expect(result.code).toContain('return PI');
    expect(result.code).toContain('const getPi');
    expect(result.code).toContain('return getPi()');
    expect(result.code).toContain('const getPiPlusOne');
    expect(result.code).toContain('return getPiPlusOne()');
  });

  // ─── Override protection ─────────────────────────────────

  it('should error when a rule tries to rename an already-renamed identifier', () => {
    const input = `
const _0xurl = "https://example.com/script.js";
function _0xfetch() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", _0xurl, true);
  return xhr.getResponseHeader("date");
}
    `.trim();
    const result = renameIdentifiers(input, [
      { name: 'fetchServerTime', keywords: ['XMLHttpRequest', 'getResponseHeader'] },
      { name: 'SCRIPT_URL', keywords: ['example.com', 'script.js'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.stats?.renamesApplied).toBe(2);
    expect(result.code).toContain('function fetchServerTime');
    expect(result.code).toContain('const SCRIPT_URL =');
  });

  it('should error when second rule matches already-renamed identifier', () => {
    const input = `
function _0xfetch() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "https://gameforge.com/tra/game1.js", true);
  return xhr.getResponseHeader("date");
}
    `.trim();
    const result = renameIdentifiers(input, [
      { name: 'fetchServerTime', keywords: ['XMLHttpRequest', 'getResponseHeader'] },
      { name: 'GAME1_URL', keywords: ['gameforge.com', 'game1.js'] },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already renamed');
  });

  it('should allow overwrite when previous rule has allowOverwrite', () => {
    const input = `
function _0xfetch() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "https://gameforge.com/tra/game1.js", true);
  return xhr.getResponseHeader("date");
}
    `.trim();
    const result = renameIdentifiers(input, [
      { name: 'fetchServerTime', keywords: ['XMLHttpRequest', 'getResponseHeader'], allowOverwrite: true },
      { name: 'GAME1_URL', keywords: ['gameforge.com', 'game1.js'] },
    ]);

    expect(result.success).toBe(true);
    expect(result.stats?.renamesApplied).toBe(2);
    expect(result.code).toContain('function GAME1_URL');
    expect(result.code).not.toContain('function fetchServerTime');
  });

  it('should return unchanged code with empty rules', () => {
    const input = `const x = 1;`;
    const result = renameIdentifiers(input);

    expect(result.success).toBe(true);
    expect(result.code).toBe(input);
    expect(result.stats?.renamesApplied).toBe(0);
  });
});

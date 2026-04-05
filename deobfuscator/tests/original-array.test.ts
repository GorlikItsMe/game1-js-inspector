import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { unwrapEval } from '../src/steps/unwrap-eval.js';
import { deobfuscateObfuscatorIo } from '../src/steps/obfuscator-io.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDataDir = join(__dirname, '../../archived_game1_scripts/2026-04-02T004842');

describe('Original array test', () => {
  it('should array be the same', () => {
    const originalCode = readFileSync(join(testDataDir, 'game1.js'), 'utf-8');
    const unwrappedCode = unwrapEval(originalCode);
    expect(unwrappedCode.success).toBe(true);

    const code = unwrappedCode.code;
    // Od `['renderedBuffer'` do pierwszego `]` (non-greedy — nie łapie reszty pliku).
    const arrayRegex = /\['renderedBuffer'[\s\S]*?\]/;
    const arrayMatch = code.match(arrayRegex);
    if (!arrayMatch) {
      console.log('[RAW] Could not find array');
      throw new Error('Could not find array');
    }
    
    const arrayBefore = eval(arrayMatch[0]) as string[];

    const obfuscatedCodeResult = deobfuscateObfuscatorIo(code);
    expect(obfuscatedCodeResult.success).toBe(true);

    const obfuscatedCode = obfuscatedCodeResult.code;
    const newArrayMatch = obfuscatedCode.match(arrayRegex);
    if (!newArrayMatch) {
      console.log('[OBF] Could not find array');
      throw new Error('Could not find array');
    }

    const arrayAfter = eval(newArrayMatch[0]) as string[];

    expect(arrayBefore.length).toEqual(arrayAfter.length);
    expect(arrayBefore).toEqual(arrayAfter);
    for (let i = 0; i < arrayBefore.length; i++) {
      expect(arrayBefore[i]).toEqual(arrayAfter[i]);
    }
  })
});

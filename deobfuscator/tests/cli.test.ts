import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { program } from '../src/cli.js';
import { unwrapEval } from '../src/steps/unwrap-eval.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const game1JsPath = join(
  __dirname,
  '../../archived_game1_scripts/2026-04-02T004842/game1.js',
);

describe('CLI', () => {
  it('exposes unwrap-eval command', () => {
    const commands = program.commands.map((cmd) => cmd.name());
    expect(commands).toContain('unwrap-eval');
  });

  it('unwrap-eval succeeds on archived game1.js (eval payload extracted)', () => {
    const source = readFileSync(game1JsPath, 'utf-8');
    const result = unwrapEval(source);

    if (!result.success) {
      expect.fail(result.error ?? 'unwrapEval failed');
    }
    expect(result.code.length).toBeGreaterThan(10_000);
    expect(result.code).toMatch(/^const a0_0x2f1e8a=/);
    expect(result.stats?.originalSize).toBe(source.length);
    expect(result.stats?.unwrappedSize).toBeLessThan(result.stats!.originalSize);
  });
});

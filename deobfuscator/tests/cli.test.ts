import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { program } from '../src/cli.js';
import { unwrapEval } from '../src/steps/unwrap-eval.js';
import { runAllSteps } from '../src/pipeline.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const archivedGame1Root = join(__dirname, '../../archived_game1_scripts');

function discoverGame1JsPaths(): string[] {
  if (!existsSync(archivedGame1Root)) return [];
  const paths: string[] = [];
  for (const ent of readdirSync(archivedGame1Root, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const p = join(archivedGame1Root, ent.name, 'game1.js');
    if (existsSync(p)) paths.push(p);
  }
  return paths.sort();
}

/** Single “latest” path for tests that assume one canonical bundle (sorted folder names). */
const game1JsPath = discoverGame1JsPaths().at(-1) ?? join(archivedGame1Root, 'game1.js');

describe('CLI', () => {
  it('exposes unwrap-eval command', () => {
    const commands = program.commands.map((cmd) => cmd.name());
    expect(commands).toContain('unwrap-eval');
    expect(commands).toContain('obfuscator-io');
    expect(commands).toContain('deobfuscate');
  });

  it('unwrap-eval succeeds on archived game1.js (eval payload extracted)', () => {
    const source = readFileSync(game1JsPath, 'utf-8');
    const result = unwrapEval(source);

    if (!result.success) {
      expect.fail(result.error ?? 'unwrapEval failed');
    }
    expect(result.code.length).toBeGreaterThan(10_000);
  });

  describe('full pipeline on each archived game1.js', () => {
    const variants = discoverGame1JsPaths();

    it('discovers at least one archived game1.js', () => {
      expect(variants.length).toBeGreaterThan(0);
    });

    for (const path of variants) {
      const label = relative(archivedGame1Root, path);
      it(`works on ${label}`, () => {
        const source = readFileSync(path, 'utf-8');
        const result = runAllSteps(source);
        expect(result).toBeDefined();

        // this is not how Date() can be called
        expect(result).not.contain('new Date()["https://gameforge.com/tra/game1.js"]()')
        expect(result).contain('new Date().getTime()');
      });
    }
  });
});

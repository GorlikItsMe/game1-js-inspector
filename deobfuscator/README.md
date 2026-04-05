# Deobfuscator (game1.js)

A CLI tool for **partial** deobfuscation of the bundled `game1.js`: it strips the outer `eval` wrapper, runs the `obfuscator-io-deobfuscator` package, then applies custom passes (hex literals, string-decoder inlining, simplifying property access).

## Requirements

- [Node.js](https://nodejs.org/) (any version the project supports; current LTS is recommended)

## Setup

From the `deobfuscator` directory:

```bash
npm install
npm run build
```

After building, run the compiled entry (`dist/index.js`) or use `npm run dev` with [tsx](https://github.com/privatenumber/tsx) without a separate build step.

## Usage

### Full pipeline (recommended)

```bash
npm run dev -- deobfuscate path/to/game1.js
npm run dev -- deobfuscate path/to/game1.js output.js
```

After `npm run build`:

```bash
npm start -- deobfuscate path/to/game1.js
node dist/index.js deobfuscate path/to/game1.js output.js
```

If you omit the second argument, output goes to `<input>.deobfuscated.js` (e.g. `game1.js` → `game1.deobfuscated.js`).

### Individual steps

| Command | Description | Default output |
|--------|-------------|----------------|
| `unwrap-eval` | Extract code from an `eval()` wrapper | `<input>.unwrapped.js` |
| `obfuscator-io` | Run only `obfuscator-io-deobfuscator` | `<input>.obfuscator-io.js` |
| `deobfuscate` | Run all steps in order | `<input>.deobfuscated.js` |

Examples:

```bash
npm run dev -- unwrap-eval input.js
npm run dev -- obfuscator-io input.js intermediate.js
```

### Help

```bash
npm run dev -- --help
npm run dev -- deobfuscate --help
```

## What `deobfuscate` does (order)

1. **Unwrap eval** — removes the outer `eval` and keeps the real payload.
2. **Obfuscator.io** — deobfuscation via the `obfuscator-io-deobfuscator` package.
3. **Convert hex literals** — turns hex numeric literals into decimal where appropriate.
4. **Inline string decoder** — inlines string-decoder call results when arguments are constant.
5. **Simplify property access** — `obj["foo"]` → `obj.foo` where that is syntactically valid.

The console prints logs for each step and a size summary at the end.

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run dev` | Run `src/index.ts` (pass CLI args after `--`) |
| `npm start` | `node dist/index.js` |
| `npm run test` | Vitest (watch mode) |
| `npm run test:run` | Vitest (single run) |
| `npm run test:game1` | Example `deobfuscate` against an archived path (edit the path in `package.json` if yours differs) |

## Notes

- The tool targets the specific obfuscation style used in `game1.js`; on other files, steps may be no-ops or fail.
- Output can still be hard to read — this is **partial** deobfuscation, not a full game reverse-engineering pass.
- made by ai

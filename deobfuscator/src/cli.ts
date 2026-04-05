import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { unwrapEval } from './steps/unwrap-eval.js';

export const program = new Command();

program
  .name('deobfuscator')
  .description('CLI tool for deobfuscating game1.js')
  .version('1.0.0');

program
  .command('unwrap-eval')
  .description('Extract code from eval() wrapper')
  .argument('<input>', 'Input file path')
  .argument('<output>', 'Output file path')
  .action((input: string, output: string) => {
    console.log(`Reading: ${input}`);
    const code = readFileSync(input, 'utf-8');

    console.log('Unwrapping eval...');
    const result = unwrapEval(code);

    if (!result.success) {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }

    console.log('Writing output...');
    writeFileSync(output, result.code, 'utf-8');

    if (result.stats) {
      console.log('\nStats:');
      console.log(`  Original size:   ${result.stats.originalSize.toLocaleString()} bytes`);
      console.log(`  Unwrapped size:  ${result.stats.unwrappedSize.toLocaleString()} bytes`);
      console.log(`  Bytes removed:   ${result.stats.bytesRemoved.toLocaleString()} bytes`);
    }

    console.log(`\nSuccess! Output written to: ${output}`);
  });

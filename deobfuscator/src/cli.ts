import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { unwrapEval } from './steps/unwrap-eval.js';
import { deobfuscateObfuscatorIo } from './steps/obfuscator-io.js';
import { runAllSteps } from './pipeline.js';

export const program = new Command();

program
  .name('deobfuscator')
  .description('CLI tool for deobfuscating game1.js')
  .version('1.0.0');


function runSingleCommand<T extends object>(
  input: string,
  output: string | undefined,
  defaultSuffix: string,
  stepFn: (code: string) => { code: string; success: boolean; error?: string; stats?: T },
  showStats: (stats: T) => void
): void {
  const outputPath = output || `${input}${defaultSuffix}`;
  console.log(`Reading: ${input}`);
  
  const code = readFileSync(input, 'utf-8');
  const result = stepFn(code);
  
  if (!result.success) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }
  
  console.log('Writing output...');
  writeFileSync(outputPath, result.code, 'utf-8');
  
  if (result.stats) {
    console.log('\nStats:');
    showStats(result.stats);
  }
  
  console.log(`\nSuccess! Output written to: ${outputPath}`);
}

program
  .command('unwrap-eval')
  .description('Extract code from eval() wrapper')
  .argument('<input>', 'Input file path')
  .argument('[output]', 'Output file path (default: <input>.unwrapped.js)')
  .action((input: string, output?: string) => {
    runSingleCommand(
      input,
      output,
      '.unwrapped.js',
      unwrapEval,
      (stats) => {
        console.log(`  Original size:   ${stats.originalSize.toLocaleString()} bytes`);
        console.log(`  Unwrapped size:  ${stats.unwrappedSize.toLocaleString()} bytes`);
        console.log(`  Bytes removed:   ${stats.bytesRemoved.toLocaleString()} bytes`);
      }
    );
  });

program
  .command('obfuscator-io')
  .description('Run obfuscator-io-deobfuscator on the file')
  .argument('<input>', 'Input file path')
  .argument('[output]', 'Output file path (default: <input>.obfuscator-io.js)')
  .action((input: string, output?: string) => {
    runSingleCommand(
      input,
      output,
      '.obfuscator-io.js',
      deobfuscateObfuscatorIo,
      (stats) => {
        console.log(`  Original size:      ${stats.originalSize.toLocaleString()} bytes`);
        console.log(`  Deobfuscated size:  ${stats.deobfuscatedSize.toLocaleString()} bytes`);
        console.log(`  Bytes delta:        ${stats.bytesDelta.toLocaleString()} bytes`);
      }
    );
  });

program
  .command('deobfuscate')
  .description('Run all deobfuscation steps')
  .argument('<input>', 'Input file path')
  .argument('[output]', 'Output file path (default: <input>.deobfuscated.js)')
  .action((input: string, output?: string) => {
    const outputPath = output || `${input}.deobfuscated.js`;
    console.log(`Reading: ${input}`);
    
    const originalSize = readFileSync(input, 'utf-8').length;
    let code = readFileSync(input, 'utf-8');
    console.log(`Original size: ${originalSize.toLocaleString()} bytes`);
    
    code = runAllSteps(code);
    
    console.log('\n=== Writing Output ===');
    writeFileSync(outputPath, code, 'utf-8');
    
    console.log('\n=== Summary ===');
    console.log(`  Original size:       ${originalSize.toLocaleString()} bytes`);
    console.log(`  Final size:          ${code.length.toLocaleString()} bytes`);
    console.log(`  Total bytes removed: ${(originalSize - code.length).toLocaleString()} bytes`);
    console.log(`\nSuccess! Output written to: ${outputPath}`);
  });

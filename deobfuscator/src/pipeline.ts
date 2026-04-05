import { unwrapEval } from "./steps/unwrap-eval.js";
import { deobfuscateObfuscatorIo } from "./steps/obfuscator-io.js";
import { convertHexLiterals } from "./steps/convert-hex-literals.js";

export function runStep<T extends object>(
    stepName: string,
    stepFn: (code: string) => { code: string; success: boolean; error?: string; stats?: T },
    inputCode: string,
    logStats?: (stats: T) => void
): string {
    console.log(`\n=== ${stepName} ===`);
    const result = stepFn(inputCode);

    if (!result.success) {
        console.error(`Error: ${result.error}`);
        process.exit(1);
    }

    if (logStats && result.stats) {
        logStats(result.stats);
    }

    return result.code;
}


export function runAllSteps(code: string): string {
    code = runStep('Step 1: Unwrap Eval', unwrapEval, code, (stats) => {
        console.log(`  Removed ${stats.bytesRemoved.toLocaleString()} bytes`);
    });

    code = runStep('Step 2: Obfuscator.io (library)', deobfuscateObfuscatorIo, code, (stats) => {
        console.log(
            `  ${stats.originalSize.toLocaleString()} → ${stats.deobfuscatedSize.toLocaleString()} bytes (Δ ${stats.bytesDelta.toLocaleString()}, positive = shorter)`
        );
    });

    code = runStep('Step 3: Convert Hex Literals', convertHexLiterals, code, (stats) => {
        console.log(`  Converted ${stats.convertedCount}/${stats.originalCount} hex literals (threshold: 4096)`);
    });

    return code;
}
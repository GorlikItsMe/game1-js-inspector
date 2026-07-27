import { unwrapEval } from "./steps/unwrap-eval.js";
import { deobfuscateObfuscatorIo } from "./steps/obfuscator-io.js";
import { evaluateParseInt } from "./steps/evaluate-parseint.js";
import { convertHexLiterals } from "./steps/convert-hex-literals.js";
import { inlineStringDecoder } from "./steps/inline-string-decoder.js";
import { evaluateConstantMath } from "./steps/evaluate-constant-math.js";
import { simplifyPropertyAccess } from "./steps/simplify-property-access.js";

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
        console.log(`  Converted ${stats.convertedCount}/${stats.originalCount} hex literals`);
    });

    code = runStep('Step 4: Inline String Decoder', inlineStringDecoder, code, (stats) => {
        console.log(`  Inlined ${stats.inlinedCalls}/${stats.totalCalls} decoder calls (${stats.skippedVariableCalls} skipped - variable args)`);
    });

    code = runStep('Step 5: Evaluate parseInt', evaluateParseInt, code, (stats) => {
        console.log(`  Evaluated ${stats.evaluatedCalls}/${stats.totalCalls} parseInt calls`);
    });

    code = runStep('Step 6: Evaluate Constant Math', evaluateConstantMath, code, (stats) => {
        console.log(`  Evaluated ${stats.expressionsEvaluated} constant math expressions`);
    });

    code = runStep('Step 7: Simplify Property Access', simplifyPropertyAccess, code, (stats) => {
        console.log(`  Converted ${stats.convertedToDot}/${stats.totalBracketAccesses} bracket accesses to dot notation`);
    });

    return code;
}
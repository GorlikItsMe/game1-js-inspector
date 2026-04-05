import { deobfuscate as obfuscatorIoDeobfuscate } from "obfuscator-io-deobfuscator";

export interface ObfuscatorIoResult {
  code: string;
  success: boolean;
  error?: string;
  stats?: {
    originalSize: number;
    deobfuscatedSize: number;
    bytesDelta: number;
  };
}

export function deobfuscateObfuscatorIo(code: string): ObfuscatorIoResult {
  const originalSize = code.length;
  try {
    // No config: obfuscator-io-deobfuscator uses defaultConfig (all transformations enabled).
    const deobfuscated = obfuscatorIoDeobfuscate(code);
    const deobfuscatedSize = deobfuscated.length;
    return {
      code: deobfuscated,
      success: true,
      stats: {
        originalSize,
        deobfuscatedSize,
        bytesDelta: originalSize - deobfuscatedSize,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      code,
      success: false,
      error: `obfuscator-io-deobfuscator failed: ${message}`,
    };
  }
}

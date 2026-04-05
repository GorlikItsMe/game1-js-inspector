export interface UnwrapEvalResult {
  code: string;
  success: boolean;
  error?: string;
  stats?: {
    originalSize: number;
    unwrappedSize: number;
    bytesRemoved: number;
  };
}

function findMatchingQuote(code: string, start: number): number {
  const quote = code[start];
  for (let i = start + 1; i < code.length; i++) {
    if (code[i] === '\\' && i + 1 < code.length) {
      i++;
      continue;
    }
    if (code[i] === quote) return i;
  }
  return -1;
}

export function unwrapEval(code: string): UnwrapEvalResult {
  const originalSize = code.length;
  const evalStart = code.indexOf('eval(');
  
  if (evalStart === -1) {
    return { code, success: true, stats: { originalSize, unwrappedSize: originalSize, bytesRemoved: 0 } };
  }

  const quotePos = evalStart + 5;
  const quote = code[quotePos];
  
  if (quote !== '\'' && quote !== '"') {
    return { code, success: false, error: 'Expected string literal inside eval()' };
  }

  const endQuotePos = findMatchingQuote(code, quotePos);
  if (endQuotePos === -1) {
    return { code, success: false, error: 'Could not find closing quote for eval string' };
  }

  if (code[endQuotePos + 1] !== ')') {
    return { code, success: false, error: 'Could not find closing ) for eval' };
  }

  const contentWithQuotes = code.substring(quotePos, endQuotePos + 1);

  const unwrappedCode = code.substring(0, evalStart) + eval(contentWithQuotes) + code.substring(endQuotePos + 2);
  const unwrappedSize = unwrappedCode.length;

  return {
    code: unwrappedCode,
    success: true,
    stats: { originalSize, unwrappedSize, bytesRemoved: originalSize - unwrappedSize }
  };
}

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

function findMatchingQuote(code: string, startQuotePos: number): number {
  const quote = code[startQuotePos];
  let i = startQuotePos + 1;
  let escaped = false;

  while (i < code.length) {
    const char = code[i];

    if (escaped) {
      escaped = false;
      i++;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      i++;
      continue;
    }

    if (char === quote) {
      return i;
    }

    i++;
  }

  return -1;
}

export function unwrapEval(code: string): UnwrapEvalResult {
  const originalSize = code.length;

  const evalCallStart = code.indexOf('eval(');
  if (evalCallStart === -1) {
    return {
      code: code,
      success: true,
      stats: {
        originalSize,
        unwrappedSize: originalSize,
        bytesRemoved: 0,
      },
    };
  }

  const openParenPos = evalCallStart + 4;
  const afterParenPos = openParenPos + 1;

  if (afterParenPos >= code.length) {
    return {
      code: code,
      success: false,
      error: 'Malformed eval call - no content after eval(',
    };
  }

  const quoteChar = code[afterParenPos];
  if (quoteChar !== '\'' && quoteChar !== '"') {
    return {
      code: code,
      success: false,
      error: 'Expected string literal inside eval()',
    };
  }

  const closingQuotePos = findMatchingQuote(code, afterParenPos);
  if (closingQuotePos === -1) {
    return {
      code: code,
      success: false,
      error: 'Could not find closing quote for eval string',
    };
  }

  const closingParenPos = closingQuotePos + 1;
  if (code[closingParenPos] !== ')') {
    return {
      code: code,
      success: false,
      error: 'Could not find closing ) for eval',
    };
  }

  const evalContent = code.substring(afterParenPos + 1, closingQuotePos);

  const beforeEval = code.substring(0, evalCallStart);
  const afterEval = code.substring(closingParenPos + 1);
  const unwrappedCode = beforeEval + evalContent + afterEval;

  const unwrappedSize = unwrappedCode.length;
  const bytesRemoved = originalSize - unwrappedSize;

  return {
    code: unwrappedCode,
    success: true,
    stats: {
      originalSize,
      unwrappedSize,
      bytesRemoved,
    },
  };
}

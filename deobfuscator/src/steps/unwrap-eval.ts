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

export function unwrapEval(code: string): UnwrapEvalResult {
  const originalSize = code.length;

  const evalStart = 'try{eval(\'';
  const evalEnd = '\')}';

  const startIndex = code.indexOf(evalStart);
  if (startIndex === -1) {
    return {
      code: code,
      success: false,
      error: 'No eval wrapper found (expected try{eval(\'...\')})',
    };
  }

  const contentStart = startIndex + evalStart.length;

  const endIndex = code.lastIndexOf(evalEnd);
  if (endIndex === -1 || endIndex <= contentStart) {
    return {
      code: code,
      success: false,
      error: 'Could not find closing \')} for eval',
    };
  }

  const unwrappedCode = code.substring(contentStart, endIndex);
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

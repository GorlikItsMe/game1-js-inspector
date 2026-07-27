export interface EvaluateParseIntResult {
  code: string;
  success: boolean;
  error?: string;
  stats?: {
    totalCalls: number;
    evaluatedCalls: number;
  };
}

export function evaluateParseInt(code: string): EvaluateParseIntResult {
  const pattern = /parseInt\((["'])(\d[^"']*?)\1\)/g;

  let match;
  let totalCalls = 0;
  let evaluatedCalls = 0;
  const replacements: Array<{ start: number; end: number; replacement: string }> = [];

  while ((match = pattern.exec(code)) !== null) {
    totalCalls++;
    const stringContent = match[2];
    const numericValue = parseInt(stringContent, 10);

    if (!isNaN(numericValue)) {
      replacements.push({
        start: match.index,
        end: match.index + match[0].length,
        replacement: numericValue.toString()
      });
      evaluatedCalls++;
    }
  }

  let result = code;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, replacement } = replacements[i];
    result = result.slice(0, start) + replacement + result.slice(end);
  }

  return {
    code: result,
    success: true,
    stats: {
      totalCalls,
      evaluatedCalls
    }
  };
}

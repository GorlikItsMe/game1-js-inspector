export interface ConvertHexResult {
  code: string;
  success: boolean;
  error?: string;
  stats?: {
    originalCount: number;
    convertedCount: number;
    unchangedCount: number;
  };
}

// Threshold for converting hex to decimal (4096 = 0x1000)
// Change this value to adjust which hex literals get converted
// const HEX_CONVERT_THRESHOLD = 0x1000;
const HEX_CONVERT_THRESHOLD = 9000000;

export function convertHexLiterals(code: string): ConvertHexResult {
  const hexPattern = /\b0x[0-9a-fA-F]+\b/g;
  
  let convertedCount = 0;
  let unchangedCount = 0;
  let match;
  const matches: Array<{ start: number; end: number; hex: string; decimal: number }> = [];
  
  // Find all hex literals
  while ((match = hexPattern.exec(code)) !== null) {
    const hexStr = match[0];
    const decimalValue = parseInt(hexStr, 16);
    
    if (decimalValue < HEX_CONVERT_THRESHOLD) {
      matches.push({
        start: match.index,
        end: match.index + hexStr.length,
        hex: hexStr,
        decimal: decimalValue
      });
      convertedCount++;
    } else {
      unchangedCount++;
    }
  }
  
  // Replace from end to beginning to maintain correct indices
  let result = code;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { start, end, decimal } = matches[i];
    result = result.slice(0, start) + decimal + result.slice(end);
  }
  
  return {
    code: result,
    success: true,
    stats: {
      originalCount: convertedCount + unchangedCount,
      convertedCount,
      unchangedCount
    }
  };
}

export interface DecryptionStage {
  name: string;
  input: string;
  output: string;
  description: string;
}

export interface DecryptionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  stages?: DecryptionStage[];
}

/**
 * Convert URL-safe base64 to standard base64
 */
function urlSafeToStandard(urlSafe: string): string {
  let standard = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = (4 - (standard.length % 4)) % 4;
  standard += '='.repeat(paddingNeeded);
  return standard;
}

/**
 * Convert standard base64 to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Reverse the XOR-like transformation used in game1
 *
 * Encoding: encoded[i] = (encoded[i-1] + original[i]) % 256
 * Decoding: original[i] = (encoded[i] - encoded[i-1] + 256) % 256
 */
function reverseTransform(encoded: Uint8Array): string {
  if (encoded.length === 0) return '';

  const result: number[] = [];
  let prev = encoded[0];
  result.push(prev);

  for (let i = 1; i < encoded.length; i++) {
    const current = encoded[i];
    const original = (current - prev + 256) % 256;
    result.push(original);
    prev = (prev + original) % 256;
  }

  return String.fromCharCode(...result);
}

/**
 * Decrypt game1 fingerprint with detailed stages
 */
export function decryptFingerprint(encrypted: string): DecryptionResult {
  const stages: DecryptionStage[] = [];

  try {
    // Stage 1: URL-safe Base64 to Standard Base64
    const standardB64 = urlSafeToStandard(encrypted);
    stages.push({
      name: 'URL-safe Base64 → Standard Base64',
      input: encrypted,
      output: standardB64,
      description: 'Convert URL-safe characters (-, _) to standard (+, /) and add padding'
    });

    // Stage 2: Base64 decode to bytes
    const decoded = base64ToUint8Array(standardB64);
    stages.push({
      name: 'Base64 Decode → Bytes',
      input: standardB64,
      output: `Uint8Array(${decoded.length} bytes): [${Array.from(decoded).join(', ')}]`,
      description: 'Decode base64 string to Uint8Array of bytes'
    });

    // Stage 3: Reverse XOR-like transformation
    const uriEncoded = reverseTransform(decoded);
    stages.push({
      name: 'Reverse XOR-like Transform',
      input: `Uint8Array(${decoded.length} bytes): [${Array.from(decoded).join(', ')}]`,
      output: uriEncoded,
      description: 'Apply reverse transformation: original[i] = (encoded[i] - encoded[i-1] + 256) % 256'
    });

    // Stage 4: URI decode
    const jsonStr = decodeURIComponent(uriEncoded);
    stages.push({
      name: 'URI Decode',
      input: uriEncoded,
      output: jsonStr,
      description: 'Decode percent-encoded characters'
    });

    // Stage 5: JSON parse
    const data = JSON.parse(jsonStr);
    stages.push({
      name: 'JSON Parse',
      input: jsonStr,
      output: JSON.stringify(data, null, 2),
      description: 'Parse JSON string to JavaScript object'
    });

    return {
      success: true,
      data,
      stages
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stages
    };
  }
}

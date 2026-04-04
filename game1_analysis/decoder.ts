/**
 * Game1.js Fingerprint Decoder - TypeScript Version
 * Maps numeric indices (0-29) to field names and categories
 */

export interface DecodedFingerprint {
  raw: Record<string, unknown>;
  categories: {
    metadata: Array<{ name: string; displayName: string; value: unknown; index: number }>;
    hardware: Array<{ name: string; displayName: string; value: unknown; index: number }>;
    browser: Array<{ name: string; displayName: string; value: unknown; index: number }>;
    screen: Array<{ name: string; displayName: string; value: unknown; index: number }>;
    canvas: Array<{ name: string; displayName: string; value: unknown; index: number }>;
    webgl: Array<{ name: string; displayName: string; value: unknown; index: number }>;
    audio: Array<{ name: string; displayName: string; value: unknown; index: number }>;
    botDetection: Array<{ name: string; displayName: string; value: unknown; index: number }>;
    media: Array<{ name: string; displayName: string; value: unknown; index: number }>;
    os: Array<{ name: string; displayName: string; value: unknown; index: number }>;
  };
  unknownFields: Array<{ index: string; value: unknown }>;
  metadata: {
    fieldCount: number;
    dataSize: number;
    timestamp?: string;
    generationTimeMs?: number;
  };
}

// Index mapping: numeric index (as string) -> [field name, display name, category]
// Based on the 30 fields in order provided by user
const INDEX_MAPPING: Record<string, [string, string, string]> = {
  // 0-9
  '0': ['v', 'Version', 'metadata'],
  '1': ['tz', 'Timezone', 'screen'],
  '2': ['osType', 'OS Type', 'os'],
  '3': ['app', 'Browser App', 'browser'],
  '4': ['vendor', 'GPU Vendor', 'hardware'],
  '5': ['mem', 'Memory (GB)', 'hardware'],
  '6': ['con', 'CPU Cores', 'hardware'],
  '7': ['lang', 'Language', 'browser'],
  '8': ['plugins', 'Plugins Hash', 'browser'],
  '9': ['gpu', 'GPU Info', 'hardware'],
  
  // 10-19
  '10': ['fonts', 'Font Hash', 'canvas'],
  '11': ['audioC', 'Audio Context', 'audio'],
  '12': ['width', 'Screen Width', 'screen'],
  '13': ['height', 'Screen Height', 'screen'],
  '14': ['video', 'Video Capabilities', 'media'],
  '15': ['audio', 'Audio Capabilities', 'audio'],
  '16': ['media', 'Media Devices', 'media'],
  '17': ['permissions', 'Permissions', 'media'],
  '18': ['audioFP', 'Audio Fingerprint', 'audio'],
  '19': ['webglFP', 'WebGL Fingerprint', 'webgl'],
  
  // 20-29
  '20': ['canvasFP', 'Canvas Fingerprint', 'canvas'],
  '21': ['creation', 'Creation Timestamp', 'metadata'],
  '22': ['uuid', 'UUID', 'metadata'],
  '23': ['d', 'Date/Day', 'metadata'],
  '24': ['osVersion', 'OS Version', 'os'],
  '25': ['vector', 'Feature Vector', 'botDetection'],
  '26': ['userAgent', 'User Agent', 'browser'],
  '27': ['serverTimeInMS', 'Server Time', 'metadata'],
  '28': ['request', 'Request Info', 'metadata'],
  '29': ['browserEnvMask', 'Browser Env Mask', 'botDetection'],
};

/**
 * Decode and categorize a fingerprint
 */
export function decodeFingerprint(fingerprint: string): DecodedFingerprint {
  // First decrypt to get the raw data (with numeric keys)
  const decrypted = decryptFingerprintData(fingerprint);
  
  const categories: DecodedFingerprint['categories'] = {
    metadata: [],
    hardware: [],
    browser: [],
    screen: [],
    canvas: [],
    webgl: [],
    audio: [],
    botDetection: [],
    media: [],
    os: [],
  };
  
  const unknownFields: Array<{ index: string; value: unknown }> = [];
  const rawWithNames: Record<string, unknown> = {};
  
  // Categorize each field by index (maintaining original order)
  for (let i = 0; i < 30; i++) {
    const indexKey = String(i);
    const value = decrypted[indexKey];
    if (value === undefined) continue;
    
    const mapping = INDEX_MAPPING[indexKey];
    if (mapping) {
      const [fieldName, displayName, category] = mapping;
      rawWithNames[fieldName] = value;
      
      const fieldEntry = { name: fieldName, displayName, value, index: i };
      
      if (categories[category as keyof typeof categories]) {
        categories[category as keyof typeof categories].push(fieldEntry);
      } else {
        unknownFields.push({ index: indexKey, value });
      }
    } else {
      unknownFields.push({ index: indexKey, value });
    }
  }
  
  return {
    raw: rawWithNames,
    categories,
    unknownFields,
    metadata: {
      fieldCount: Object.keys(decrypted).length,
      dataSize: fingerprint.length,
      timestamp: parseTimestamp(decrypted['21']),
      generationTimeMs: parseServerTime(decrypted['27']),
    },
  };
}

/**
 * Parse timestamp value (handles both ISO strings and numeric timestamps)
 */
function parseTimestamp(value: unknown): string | undefined {
  if (!value) return undefined;
  try {
    if (typeof value === 'string') {
      // Already an ISO string
      if (value.includes('T') || value.includes('-')) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date.toISOString();
      }
      // Try parsing as number
      const num = Number(value);
      if (!isNaN(num)) {
        const date = new Date(num);
        if (!isNaN(date.getTime())) return date.toISOString();
      }
    } else if (typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date.toISOString();
    }
  } catch {
    // Ignore parsing errors
  }
  return undefined;
}

/**
 * Parse server time value
 */
function parseServerTime(value: unknown): number | undefined {
  if (!value) return undefined;
  try {
    if (typeof value === 'string') {
      // If it's an ISO date string, convert to timestamp
      if (value.includes('T') || value.includes('-')) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date.getTime();
      }
      // Try parsing as number
      const num = Number(value);
      if (!isNaN(num)) return num;
    } else if (typeof value === 'number') {
      return value;
    }
  } catch {
    // Ignore parsing errors
  }
  return undefined;
}

/**
 * Decrypt fingerprint data (same algorithm as Python version)
 */
function decryptFingerprintData(encoded: string): Record<string, unknown> {
  try {
    // Stage 1: URL-safe base64 to standard base64
    const standardB64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    
    // Stage 2: Base64 decode to bytes
    const decodedBytes = Uint8Array.from(atob(standardB64), c => c.charCodeAt(0));
    
    // Stage 3: Reverse XOR-like transform
    const result = new Uint8Array(decodedBytes.length);
    let prev = 0;
    for (let i = 0; i < decodedBytes.length; i++) {
      const original = (decodedBytes[i] - prev + 256) % 256;
      result[i] = original;
      prev = decodedBytes[i];
    }
    
    // Stage 4: UTF-8 decode
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const decodedStr = decoder.decode(result);
    
    // Stage 5: URL decode
    const urlDecoded = decodeURIComponent(decodedStr);
    
    // Stage 6: JSON parse
    return JSON.parse(urlDecoded);
  } catch (e) {
    throw new Error(`Failed to decrypt fingerprint: ${e}`);
  }
}

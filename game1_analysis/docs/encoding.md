# How Game1.js Encoding Works

## Overview

Game1.js uses a **5-stage custom encoding scheme** to obfuscate fingerprint data before transmission. Understanding this encoding is key to decoding fingerprints.

---

## The 5-Stage Encoding Process

### Stage 1: JSON Stringification
```javascript
const jsonString = JSON.stringify(fingerprintObject);
// Result: '{"0":1920,"1":1080,"2":24,...}'
```

### Stage 2: URI Component Encoding
```javascript
const uriEncoded = encodeURIComponent(jsonString);
// Escapes special characters: { → %7B, " → %22, } → %7D, etc.
// Result: %7B%220%22%3A1920%2C%221%22%3A1080...%7D
```

### Stage 3: XOR-like Cumulative Transform
This is the critical obfuscation step:

```javascript
let transformed = uriEncoded[0];  // First character unchanged
let prev = uriEncoded.charCodeAt(0);

for (let i = 1; i < uriEncoded.length; i++) {
    const original = uriEncoded.charCodeAt(i);
    const encoded = (prev + original) % 256;
    transformed += String.fromCharCode(encoded);
    prev = encoded;
}
```

**What this does:** Each byte becomes dependent on all previous bytes, making the output appear random.

### Stage 4: Base64 Encoding (URL-Safe)
```javascript
const base64 = btoa(transformed)
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
// Standard Base64 → URL-safe Base64
```

### Stage 5: Transmission Ready
The final encoded string is sent to the server via:
- HTTP header
- POST body
- Or stored in cookie/localStorage

---

## Decoding Process (Reverse)

To decode a fingerprint, reverse the stages:

```python
import base64
import urllib.parse
import json

def decode(encoded_string):
    # Stage 1: URL-safe base64 → standard base64
    standard = encoded_string.replace('-', '+').replace('_', '/')
    bytes_data = base64.b64decode(standard)
    
    # Stage 2: Reverse XOR-like transform
    result = bytearray()
    prev = 0
    for byte in bytes_data:
        original = (byte - prev) % 256
        result.append(original)
        prev = byte
    
    # Stage 3: UTF-8 decode
    decoded_str = result.decode('utf-8')
    
    # Stage 4: URL decode
    url_decoded = urllib.parse.unquote(decoded_str)
    
    # Stage 5: JSON parse
    return json.loads(url_decoded)
```

---

## Why This Encoding?

1. **Obfuscation**: Makes casual inspection difficult
2. **Compression**: Base64 is more compact than raw JSON
3. **URL Safety**: No special characters that break URLs
4. **Speed**: Fast enough for real-time fingerprinting

---

## Security Note

This encoding is **not encryption** - it's obfuscation. Anyone with the algorithm (like you now!) can decode it. The library uses this to avoid trivial detection, not for security.

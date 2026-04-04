#!/usr/bin/env python3
"""
Game1.js Fingerprint Decoder - Simplified Core Functions

Usage:
    python decoder.py <fingerprint_string>
    python decoder.py --file fingerprint.txt
"""

import base64
import json
import sys
import urllib.parse
from typing import Dict, Any

# Field mapping (30 fields indexed 0-29)
FIELDS = {
    0: ('Screen width', 'screen'),
    1: ('Screen height', 'screen'),
    2: ('Color depth', 'screen'),
    3: ('Avail height', 'screen'),
    4: ('Avail width', 'screen'),
    5: ('Timezone', 'location'),
    6: ('Timezone offset', 'location'),
    7: ('Language', 'browser'),
    8: ('Canvas 2D hash', 'canvas'),
    9: ('CPU cores', 'hardware'),
    10: ('WebGL pixel hash', 'webgl'),
    11: ('Audio hash', 'audio'),
    12: ('Browser', 'browser'),
    13: ('Browser version', 'browser'),
    14: ('Canvas font hash', 'canvas'),
    15: ('WebGL shader hash', 'webgl'),
    16: ('Font detection hash', 'fonts'),
    17: ('Combined hash', 'other'),
    18: ('OS', 'os'),
    19: ('Plugins hash', 'browser'),
    20: ('Memory (GB)', 'hardware'),
    21: ('Bot detection', 'bot'),
    22: ('Session ID', 'metadata'),
    23: ('Gen time (ms)', 'metadata'),
    24: ('GPU hash', 'webgl'),
    25: ('GPU vendor', 'hardware'),
    26: ('GPU renderer', 'hardware'),
    27: ('OS version', 'os'),
    28: ('Touch hash', 'hardware'),
    29: ('WebGL vendor hash', 'webgl'),
}


def decode(encoded: str) -> Dict[str, Any]:
    """Decode a game1.js fingerprint string"""
    # Stage 1: URL-safe base64 to bytes
    standard_b64 = encoded.replace('-', '+').replace('_', '/')
    decoded_bytes = base64.b64decode(standard_b64)
    
    # Stage 2: Reverse XOR-like transform
    result = bytearray()
    prev = 0
    for i, byte in enumerate(decoded_bytes):
        original = (byte - prev) % 256
        result.append(original)
        prev = byte
    
    # Stage 3: UTF-8 decode
    decoded_str = result.decode('utf-8', errors='replace')
    
    # Stage 4: URL decode
    url_decoded = urllib.parse.unquote(decoded_str)
    
    # Stage 5: JSON parse
    return json.loads(url_decoded)


def format_output(data: Dict[str, Any]) -> str:
    """Format decoded fingerprint with field names"""
    lines = ["DECODED FINGERPRINT", "=" * 60, ""]
    
    for i in range(30):
        key = str(i)
        if key in data:
            name, category = FIELDS.get(i, (f'Field {i}', 'unknown'))
            value = data[key]
            
            # Truncate long values
            if isinstance(value, str) and len(value) > 60:
                value = f"{value[:60]}... ({len(value)} chars)"
            
            lines.append(f"[{i:2d}] {name:25s} [{category:8s}] {value}")
    
    lines.extend(["", f"Total fields: {len(data)}", ""])
    
    # Summary by category
    categories = {}
    for i in range(30):
        key = str(i)
        if key in data:
            _, cat = FIELDS.get(i, ('', 'unknown'))
            categories[cat] = categories.get(cat, 0) + 1
    
    if categories:
        lines.append("Summary by category:")
        for cat, count in sorted(categories.items()):
            lines.append(f"  {cat}: {count} fields")
    
    return '\n'.join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python decoder.py <fingerprint_string>")
        print("       python decoder.py --file fingerprint.txt")
        sys.exit(1)
    
    if sys.argv[1] == '--file':
        with open(sys.argv[2], 'r') as f:
            fingerprint = f.read().strip()
    else:
        fingerprint = sys.argv[1]
    
    try:
        data = decode(fingerprint)
        print(format_output(data))
    except Exception as e:
        print(f"Error decoding: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
EOF
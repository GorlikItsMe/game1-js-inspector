# How Game1.js Fingerprinting Works

## Overview

Game1.js is a sophisticated browser fingerprinting library that collects **30 distinct data fields** across **12+ fingerprinting techniques** to create a unique identifier for tracking users.

**Key Stats:**
- **113.37 bits of entropy** (measured from 100 realistic samples)
- **99.95% uniqueness** in populations of 100,000 users
- **8 cryptographic hashes** (SHA-256) for hardware identification
- **500+ fonts** detected for system fingerprinting
- **21+ bot detection checks** for automation identification

---

## What Data Is Collected

### 30 Indexed Fields (0-29)

The fingerprint consists of 30 fields stored as a JSON object with numeric keys:

```json
{
  "0": 1920,                    // Screen width
  "1": 1080,                    // Screen height  
  "2": 24,                      // Color depth
  "5": "Europe/Warsaw",         // Timezone
  "8": "sha256_a1b2c3d4...",    // Canvas 2D fingerprint
  "9": 12,                      // CPU cores
  "10": "sha256_e5f6g7h8...",   // WebGL pixel hash
  "25": "NVIDIA",               // GPU vendor
  "26": "GeForce GTX 980"       // GPU model
}
```

See [data-collected.md](data-collected.md) for complete field reference.

---

## Fingerprinting Techniques

### 1. Canvas Fingerprinting (Fields 8, 14)

**How it works:**
```javascript
// Creates invisible canvas element
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Renders text with specific fonts
ctx.font = '14px Arial';
ctx.fillText('Hello World', 10, 50);

// Gets pixel data hash
const dataUrl = canvas.toDataURL();
const hash = sha256(dataUrl);  // Field 8
```

**Why it's unique:** Font rendering varies by:
- GPU (graphics card)
- OS (Windows vs macOS vs Linux)
- Browser (Chrome vs Firefox)
- Installed fonts
- Anti-aliasing settings

### 2. WebGL Fingerprinting (Fields 10, 15, 24, 25, 26)

**How it works:**
```javascript
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');

// Gets GPU vendor and renderer
const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);      // Field 25
const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);  // Field 26

// Creates shaders and hashes pixel buffer
const pixels = new Uint8Array(width * height * 4);
gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
const hash = sha256(pixels);  // Field 10
```

**What it reveals:**
- Exact GPU model (e.g., "NVIDIA GeForce GTX 980")
- GPU vendor (NVIDIA, AMD, Intel, Apple)
- Driver versions (through shader compilation)
- Graphics capabilities

### 3. Audio Fingerprinting (Field 11)

**How it works:**
```javascript
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const oscillator = audioCtx.createOscillator();
const compressor = audioCtx.createDynamicsCompressor();

// Generates audio signal and analyzes
oscillator.connect(compressor);
compressor.connect(audioCtx.destination);
oscillator.start();

// Gets audio processing fingerprint
const fingerprint = analyzeAudioOutput();  // Field 11
```

**Why it works:** Audio processing is hardware-accelerated and varies by:
- Sound card / audio chip
- CPU (software fallback)
- Browser implementation

### 4. Font Detection (Field 16)

**How it works:**
```javascript
const baseFonts = ['monospace', 'sans-serif', 'serif'];
const testFonts = ['Arial', 'Times New Roman', 'Courier', ...500+ more];

// Measures text width for each font
for (const font of testFonts) {
    const width = measureText('Test String', `12px ${font}`);
    // If width differs from base, font is installed
}
const fontHash = sha256(installedFonts);  // Field 16
```

**What it detects:**
- System fonts (Windows: Calibri, macOS: San Francisco)
- Installed font packages
- Office suites (presence of specific fonts)
- Design software

### 5. Hardware Specs (Fields 9, 20, 25, 26)

Direct hardware information:
- **Field 9:** `navigator.hardwareConcurrency` (CPU cores: 2-32+)
- **Field 20:** `navigator.deviceMemory` (RAM: 4-128 GB)
- **Field 25-26:** WebGL GPU vendor and model

### 6. Screen Properties (Fields 0-4, 6)

Display characteristics:
- Resolution (1920x1080, 2560x1440, etc.)
- Color depth (24-bit, 30-bit)
- Available screen area (minus taskbar)
- Timezone offset (geolocation hint)

### 7. Bot Detection (Field 21)

Checks for automation tools:
- Selenium (WebDriver property)
- Playwright/Puppeteer (specific properties)
- Headless Chrome (window.chrome missing)
- PhantomJS (specific global objects)
- Virtual machines (timing analysis)

Result: "CLEAN" or flags indicating suspicious behavior.

### 8. Session Tracking (Field 22)

Uses localStorage to persist across page reloads:
```javascript
const sessionId = localStorage.getItem('game1_session');
if (!sessionId) {
    localStorage.setItem('game1_session', generateUUID());  // Field 22
}
```

**Survives:**
- Page reloads
- Session restore
- Tab closing/reopening

**Doesn't survive:**
- Private/Incognito mode
- localStorage clearing
- Different browsers

---

## How Fingerprints Are Unique

### Entropy Calculation (Shannon Entropy)

From our analysis of 100 realistic fingerprints:

| Category | Entropy | Source |
|----------|---------|--------|
| **Hash fields** (8, 10, 11, 14, 15, 16, 17, 19, 24) | 6.64 bits each | Canvas, WebGL, Audio, Fonts |
| **Timezone + Language** (5, 6, 7) | 3.5 bits each | Geographic/linguistic diversity |
| **Hardware specs** (9, 20, 25, 26) | 2-4 bits each | CPU, RAM, GPU combinations |
| **Screen properties** (0-4) | 3 bits each | Resolution variations |
| **Total** | **113.37 bits** | All 30 fields combined |

### Uniqueness by Population

Using the birthday paradox formula:

| Population Size | Collision Probability | Uniqueness |
|-----------------|----------------------|------------|
| 10,000 | 0.0002% | 99.9998% |
| 100,000 | 0.05% | 99.95% |
| 500,000 | 5.82% | 94.18% |
| 1,000,000 | 33.47% | 66.53% |

**Conclusion:** Game1.js can uniquely identify users in populations exceeding 100,000 users.

---

## Cross-Browser Tracking

### The Hardware Fingerprint Problem

Even if you switch browsers, **7 fields remain identical** on the same device:

| Field | Name | Persistence |
|-------|------|-------------|
| 8 | Canvas 2D hash | GPU-dependent (varies ±2%) |
| 10 | WebGL pixel hash | GPU-dependent (constant) |
| 15 | WebGL shader hash | GPU-dependent (constant) |
| 16 | Font detection hash | OS-dependent (varies ±3%) |
| 24 | GPU hash | GPU-dependent (constant) |
| 25 | GPU vendor | **Constant** |
| 26 | GPU renderer | **Constant** |

### Cross-Browser Tracking Scenario

```
User Device:
├── Chrome → Fingerprint A
├── Firefox → Fingerprint B  
├── Safari → Fingerprint C
└── Edge → Fingerprint D

Tracking Server Analysis:
"Fields 25+26 match: NVIDIA GeForce GTX 980
 Fields 10, 15, 24 match: Same GPU processing
 Conclusion: A, B, C, D = Same Device"
```

**Implication:** You cannot escape tracking by switching browsers on the same device.

---

## How To Decode Fingerprints

### Method 1: Use Our React App

The easiest way - the app includes a live decoder:
1. Open the app
2. Click "GENERATE FINGERPRINT" 
3. See decoded output in real-time

### Method 2: Python Decoder

```python
from tools.decoder import decode

fingerprint = "MTAwMHgxMDAwLDI0LEV1cm9wZS9XYXJzYXcs..."
data = decode(fingerprint)
print(data)
```

### Method 3: Manual Decoding

See [encoding.md](encoding.md) for the complete algorithm.

---

## Privacy Implications

### What This Means For You

🔴 **Critical:**
- Hardware fingerprint persists across all browsers
- 113 bits of entropy = unique identification in large populations
- Bot detection can flag automation attempts

🟡 **High:**
- GPU model reveals device age and value
- Timezone + language = approximate location
- Font list reveals installed software

🟢 **Medium:**
- Session tracking (can be cleared via localStorage)
- Screen resolution (changes with display)

### Protection Strategies

See [protection.md](protection.md) for complete guide.

**Quick Recommendations:**
1. **Firefox with privacy.resistFingerprinting** (best balance)
2. **Tor Browser** (maximum anonymity)
3. **Disable WebGL** (breaks many sites)
4. **Use VMs** for sensitive activities

---

## Technical Summary

| Property | Value |
|----------|-------|
| Library Size | 62KB (obfuscated) |
| String Table | 308 obfuscated strings |
| Data Fields | 30 indexed fields (0-29) |
| Hash Fields | 8 SHA-256 hashes |
| Bot Checks | 21+ automation indicators |
| Fonts Checked | 500+ system fonts |
| Encoding | 5-stage custom scheme |
| Entropy | 113.37 bits |
| Uniqueness (100K users) | 99.95% |

---

## Further Reading

- [Data Collection Reference](data-collected.md) - Complete field documentation
- [Encoding Algorithm](encoding.md) - How encoding/decoding works
- [Protection Guide](protection.md) - How to defend against fingerprinting
- [Technical Details](technical-details.md) - Deep dive implementation notes
- [String Table](references.md) - All 308 obfuscated strings

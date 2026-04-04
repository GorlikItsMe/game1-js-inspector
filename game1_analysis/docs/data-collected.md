# Data Collected by Game1.js

## 30 Indexed Fields (Complete Reference)

Game1.js collects data in a JSON object with numeric keys (0-29). Here's what each field means:

---

## Screen Properties (Fields 0-4)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 0 | Screen width | `1920` | Total screen width in pixels |
| 1 | Screen height | `1080` | Total screen height in pixels |
| 2 | Color depth | `24` | Bits per pixel (24, 30, 32 typical) |
| 3 | Avail height | `1080` | Available height (minus taskbar) |
| 4 | Avail width | `1920` | Available width |

**Used for:** Device identification, mobile vs desktop detection, multi-monitor setups.

---

## Location & Locale (Fields 5-7)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 5 | Timezone | `"Europe/Warsaw"` | IANA timezone identifier |
| 6 | Timezone offset | `-60` | Minutes from UTC (negative = east) |
| 7 | Language | `"pl"` | Primary browser language (RFC 5646) |

**Used for:** Geographic tracking, localization, user profiling.

---

## Canvas Fingerprints (Fields 8, 14)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 8 | Canvas 2D hash | `"sha256_a1b2c3d4..."` | SHA-256 of rendered canvas pixels |
| 14 | Canvas font hash | `"sha256_e5f6g7h8..."` | SHA-256 of font rendering test |

**How generated:**
1. Create invisible canvas
2. Render text with various fonts/colors
3. Extract pixel data via `toDataURL()` or `getImageData()`
4. Compute SHA-256 hash

**Varies by:** GPU, OS, browser, installed fonts, anti-aliasing.

---

## Hardware Specs (Fields 9, 20, 25, 26)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 9 | CPU cores | `12` | `navigator.hardwareConcurrency` |
| 20 | Memory (GB) | `32` | `navigator.deviceMemory` (0 if unavailable) |
| 25 | GPU vendor | `"NVIDIA"` | WebGL UNMASKED_VENDOR |
| 26 | GPU renderer | `"GeForce GTX 980"` | WebGL UNMASKED_RENDERER |

**GPU Vendors detected:**
- NVIDIA (GeForce series)
- AMD (Radeon series)
- Intel (HD Graphics, Iris Xe)
- Apple (M1, M2, M3 series)
- ARM (Mali series - mobile)
- Qualcomm (Adreno - mobile)

---

## Browser Identity (Fields 12-13, 19)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 12 | Browser | `"Firefox"` | Detected browser name |
| 13 | Browser version | `"149.0"` | Version string |
| 19 | Plugins hash | `"sha256_i9j0k1l2..."` | SHA-256 of installed plugins |

**Browser detection:**
- Chrome: `"Chrome"` in userAgent + chrome object
- Firefox: `"Firefox"` in userAgent
- Safari: `"Safari"` (no Chrome) + webkit object
- Edge: `"Edg"` in userAgent
- Opera: `"OPR"` or `"Opera"` in userAgent

---

## WebGL Fingerprints (Fields 10, 15, 24, 29)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 10 | WebGL pixel hash | `"sha256_m3n4o5p6..."` | Pixel buffer from WebGL rendering |
| 15 | WebGL shader hash | `"sha256_q7r8s9t0..."` | Shader execution result hash |
| 24 | GPU hash | `"sha256_u1v2w3x4..."` | Combined GPU fingerprint |
| 29 | WebGL vendor hash | `"sha256_y5z6a7b8..."` | WebGL vendor-specific fingerprint |

**WebGL tests:**
1. Creates WebGL context
2. Renders simple 3D scene
3. Reads pixel buffer with `gl.readPixels()`
4. Creates custom shaders
5. Compiles and executes them
6. Hashes all results

**Reveals:** GPU model, driver version, graphics capabilities, floating-point precision quirks.

---

## Audio Fingerprint (Field 11)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 11 | Audio hash | `"sha256_c9d0e1f2..."` | AudioContext processing fingerprint |

**How generated:**
1. Creates `AudioContext`
2. Generates oscillator (sine wave)
3. Applies dynamics compression
4. Analyzes output with `AnalyserNode`
5. Hashes frequency response

**Varies by:** Audio hardware, sound drivers, CPU (software processing).

---

## Font Detection (Field 16)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 16 | Font detection hash | `"sha256_g3h4i5j6..."` | Installed system fonts fingerprint |

**Process:**
1. Tests 500+ font names
2. Measures text width for each
3. Compares to baseline (generic fonts)
4. Creates list of installed fonts
5. Hashes the list

**Example detected fonts:**
- Windows: Arial, Calibri, Times New Roman, Segoe UI
- macOS: San Francisco, Helvetica Neue, Menlo
- Linux: DejaVu Sans, Liberation Sans, Ubuntu
- Office: Cambria, Consolas (indicates MS Office)

---

## OS Information (Fields 18, 27, 28)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 18 | OS | `"Windows"` | Operating system name |
| 27 | OS version | `"10"` or `"22.04"` | OS version |
| 28 | Touch hash | `"sha256_k7l8m9n0..."` | Touch support fingerprint |

**OS Detection:**
- Windows: `"Windows"` in userAgent
- macOS: `"Mac"` in userAgent + platform
- Linux: `"Linux"` in userAgent
- Android: `"Android"` in userAgent
- iOS: `"iPhone"` or `"iPad"` in userAgent

---

## Security & Tracking (Fields 21-23)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 21 | Bot detection | `"CLEAN"` | Automation check result |
| 22 | Session ID | `"abc123def456"` | localStorage-based tracking ID |
| 23 | Gen time (ms) | `75` | Time to generate fingerprint |

**Bot Detection Checks:**
1. `window.webdriver` → Selenium indicator
2. `window.callPhantom` → PhantomJS
3. `window._phantom` → PhantomJS
4. `window.Buffer` → Node.js/Electron
5. `window.emit` → CommonJS
6. Chrome plugins check → Headless detection
7. WebDriver property detection
8. Timing analysis (humans are slower)

**Result:**
- `"CLEAN"` - No bot indicators detected
- `"SUSPICIOUS"` - Some indicators present
- `"BOT"` - Clear automation detected

---

## Aggregate Fingerprints (Fields 17)

| Field | Name | Example | Description |
|-------|------|---------|-------------|
| 17 | Combined hash | `"sha256_p1q2r3s4..."` | Secondary/aggregate fingerprint |

**Usage:** Backup fingerprint if primary fields change.

---

## Field Categories Summary

| Category | Fields | Purpose |
|----------|--------|---------|
| **Hardware** | 9, 20, 25, 26, 28 | CPU, RAM, GPU identification |
| **Screen** | 0-4 | Display characteristics |
| **Location** | 5-7 | Geographic/linguistic tracking |
| **Canvas** | 8, 14 | 2D rendering fingerprint |
| **WebGL** | 10, 15, 24, 29 | 3D/GPU fingerprint |
| **Audio** | 11 | Audio processing fingerprint |
| **Fonts** | 16 | Installed font detection |
| **Browser** | 12-13, 19 | Browser identification |
| **OS** | 18, 27 | Operating system detection |
| **Security** | 21 | Bot detection |
| **Tracking** | 22-23 | Session/persistence |
| **Aggregate** | 17 | Combined fingerprint |

---

## Example Decoded Fingerprint

```json
{
  "0": 1920,
  "1": 1080,
  "2": 24,
  "3": 1080,
  "4": 1920,
  "5": "Europe/Warsaw",
  "6": -60,
  "7": "pl",
  "8": "sha256_29ab7b66cb4e8565774143747d2389903c02662bca42225aa927a36fdadd8597",
  "9": 12,
  "10": "sha256_740864b6e71d26714a8166ee40b4a4849b3d8ec64113f9128309eabae5a48235",
  "11": "sha256_b66cb4e8565774143747d2389903c02662bca42225aa927a36fdadd85974086",
  "12": "Firefox",
  "13": "149.0",
  "14": "sha256_4b6e71d26714a8166ee40b4a4849b3d8ec64113f9128309eabae5a48235",
  "15": "sha256_71d26714a8166ee40b4a4849b3d8ec64113f9128309eabae5a48235",
  "16": "sha256_26714a8166ee40b4a4849b3d8ec64113f9128309eabae5a48235",
  "17": "sha256_14a8166ee40b4a4849b3d8ec64113f9128309eabae5a48235",
  "18": "Windows",
  "19": "sha256_a8166ee40b4a4849b3d8ec64113f9128309eabae5a48235",
  "20": 32,
  "21": "CLEAN",
  "22": "abc123def4567890",
  "23": 75,
  "24": "sha256_166ee40b4a4849b3d8ec64113f9128309eabae5a48235",
  "25": "NVIDIA",
  "26": "GeForce GTX 980",
  "27": "10",
  "28": "sha256_66ee40b4a4849b3d8ec64113f9128309eabae5a48235",
  "29": "sha256_6ee40b4a4849b3d8ec64113f9128309eabae5a48235"
}
```

**Profile from this fingerprint:**
- Location: Poland (Europe/Warsaw timezone, Polish language)
- Device: Windows 10, 1920x1080 display
- Hardware: 12-core CPU, 32GB RAM, NVIDIA GTX 980 GPU
- Browser: Firefox 149.0
- Status: Human user (CLEAN), 75ms generation time

---

## See Also

- [How It Works](how-it-works.md) - Fingerprinting techniques explained
- [Encoding](encoding.md) - How data is encoded
- [Protection](protection.md) - How to defend against tracking

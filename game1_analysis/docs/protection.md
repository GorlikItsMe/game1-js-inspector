# Protection Guide: Defending Against Fingerprinting

## Quick Start

**Recommended for most users:**
1. Install Firefox
2. Enable `privacy.resistFingerprinting` in `about:config`
3. Use uBlock Origin to block tracking scripts

**For maximum anonymity:** Use Tor Browser (disables fingerprinting + anonymizes traffic)

---

## Protection Levels

### Level 1: Basic (Firefox + Settings)

**Setup:**
```
1. Install Firefox
2. Type about:config in address bar
3. Set privacy.resistFingerprinting = true
4. Install uBlock Origin extension
```

**What it blocks:**
- ✅ Canvas fingerprinting (spoofed/standardized)
- ✅ Timezone (spoofed to UTC)
- ✅ Screen resolution (standardized)
- ✅ Font detection (limited)
- ⚠️ Some sites may break (rare)

**Effectiveness:** 70-80% reduction in fingerprinting accuracy

---

### Level 2: Advanced (Firefox Hardened)

**Additional settings:**
```javascript
// about:config
privacy.resistFingerprinting = true
webgl.disabled = true                    // Disable WebGL completely
browser.cache.disk.enable = false        // No disk cache
places.history.enabled = false           // No history
browser.download.start_downloads_in_tmp_dir = true
```

**Extensions:**
- uBlock Origin (block tracking scripts)
- CanvasBlocker (extra canvas protection)
- ClearURLs (remove tracking parameters)

**Effectiveness:** 85-90% reduction

**Trade-offs:** 
- Some sites break (WebGL games, maps)
- Slower browsing (no caching)
- Less convenient

---

### Level 3: Maximum (Tor Browser)

**Download:** [torproject.org](https://www.torproject.org)

**What Tor Browser does:**
- Standardizes ALL fingerprints to match other Tor users
- Routes traffic through anonymity network
- Disables WebGL, Canvas access by default
- Uses only safe browser window size
- Clears all data on exit

**Effectiveness:** 95-99% anonymity (when used correctly)

**Trade-offs:**
- Much slower browsing
- Many sites block Tor exit nodes
- No logins (unless you want to be tracked)
- No downloads

---

## Protection By Technique

### Canvas Fingerprinting

**Best defense:** Firefox RFP or Tor Browser

**Alternative:** CanvasBlocker extension
- Firefox: `CanvasBlocker` by kkapsner
- Chrome: `Canvas Fingerprint Defender`

**Effect:** Canvas returns empty or standardized pixels

---

### WebGL Fingerprinting

**Best defense:** Disable WebGL entirely

**Firefox:**
```javascript
about:config → webgl.disabled = true
```

**Chrome:**
```javascript
chrome://flags/#disable-webgl → Enabled
```

**Effect:** GPU information unavailable

**Downside:** Breaks Google Maps, online games, 3D visualization

---

### Audio Fingerprinting

**Best defense:** Firefox RFP

**Alternative:** AudioContext blocker extensions

**Effect:** Audio processing returns standard values

---

### Font Detection

**Best defense:** Limit font exposure

**Firefox RFP:** Reports minimal font set

**Alternative:** Block font loading with uBlock Origin

**Effect:** Cannot detect installed fonts

---

### Hardware Specs (GPU, CPU, RAM)

**The hard problem:** These are legitimate APIs

**Best defenses:**
1. **Tor Browser** - Standardizes values
2. **VMs** - Run browser in virtual machine
3. **Cloud browsers** - Use remote browser

**Reality check:** Hardware fingerprinting is the hardest to defeat

---

## Cross-Browser Tracking Protection

### The Problem

Hardware fingerprints (GPU, screen resolution) persist across browsers:

```
Same Device:
├── Chrome → Fingerprint A (NVIDIA GTX 980, 1920x1080)
├── Firefox → Fingerprint B (NVIDIA GTX 980, 1920x1080)  
└── Safari → Fingerprint C (NVIDIA GTX 980, 1920x1080)

Tracking server: "Same GPU + resolution = Same device"
```

### Solutions

**Option 1: Single Privacy Browser**
- Use ONLY Tor Browser for sensitive activities
- Never use regular browsers for same sites

**Option 2: Virtual Machines**
- Run Chrome in VM1, Firefox in VM2, etc.
- Each VM has different hardware profile
- **Tools:** VirtualBox, VMware, Parallels

**Option 3: Containers (Advanced)**
- Firefox Multi-Account Containers
- Chrome Profile isolation
- Different profiles = different fingerprints

**Option 4: Hardware Separation**
- Different devices for different activities
- Most effective but expensive

---

## Testing Your Protection

### Test Sites

1. **browserleaks.com/canvas** - Canvas fingerprinting test
2. **amiunique.org** - Overall fingerprint uniqueness
3. **coveryourtracks.eff.org** - EFF's tracking test
4. **fingerprintjs.com** - Commercial fingerprinting demo

### What To Look For

**Good signs:**
- Canvas/WebGL hashes change between visits
- Screen resolution reported as standard (e.g., 1920x1080 even on 4K monitor)
- Timezone shows UTC or generic location
- Plugins list is empty or minimal

**Bad signs:**
- Same hash every visit
- Unique screen resolution
- Accurate timezone
- Lots of plugins detected

---

## Effectiveness Summary

| Method | Canvas | WebGL | Audio | Fonts | Hardware | Session |
|--------|--------|-------|-------|-------|----------|---------|
| Firefox RFP | 🟢 | 🟡 | 🟢 | 🟢 | 🔴 | 🔴 |
| Tor Browser | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| Brave Shields | 🟢 | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 |
| CanvasBlocker | 🟢 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| Disable WebGL | 🔴 | 🟢 | 🔴 | 🔴 | 🔴 | 🔴 |
| VMs | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |

**Legend:** 🟢 Protected | 🟡 Partial | 🔴 Vulnerable

---

## Realistic Expectations

### What Works
✅ Firefox RFP - Significant protection with minimal breakage  
✅ Tor Browser - Near-perfect anonymity for careful users  
✅ VMs - Complete isolation (if configured properly)  

### What Doesn't
❌ VPN alone - Hides IP, not fingerprint  
❌ Incognito mode - Same fingerprint, just no cookies  
❌ Clearing cookies - Fingerprint persists  
❌ Single extension - Game1.js uses 12+ techniques  

### The Reality

Game1.js and similar libraries are **commercial-grade**:
- Used by banks, fraud detection, advertising
- Constantly evolving
- Hard to completely defeat

**Best strategy:** Layered defense
1. Firefox RFP (baseline)
2. uBlock Origin (block scripts)
3. Tor Browser (sensitive activities)
4. VMs (maximum isolation)

---

## Quick Reference

### Enable Firefox RFP
```
1. about:config
2. privacy.resistFingerprinting → true
3. Restart browser
```

### Check If Working
```
1. Visit browserleaks.com/canvas
2. Refresh page 3 times
3. Canvas hash should change each time
```

### Emergency Anonymity
```
1. Download Tor Browser
2. Don't maximize window (keep default size)
3. Don't install extensions
4. Don't log into accounts
```

---

## Further Reading

- [EFF: Browser Fingerprinting](https://coveryourtracks.eff.org)
- [Mozilla: Privacy Guide](https://support.mozilla.org/en-US/kb/firefox-protection-against-fingerprinting)
- [Tor Project: Anonymous Browsing](https://tb-manual.torproject.org)

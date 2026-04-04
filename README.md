# game1.js Inspector

Clean room research tool for reverse engineering and inspecting game1.js browser fingerprinting.

**Live Demo**: https://opencodegames.github.io/gf-game1-playground/

## Overview

This is a static, client-side only application that decrypts and displays game1.js fingerprinting data. The entire decryption logic runs in your browser - no data is sent to any server.

## Features

- 🔓 **Real-time decryption** - Decrypt game1 fingerprints client-side
- 🔍 **Visual inspection** - See exactly what browser data is collected
- 📱 **Responsive design** - Works on desktop and mobile
- ⚡ **Fast & lightweight** - React + Vite, no server required

## Tech Stack

- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [GitHub Pages](https://pages.github.com/) - Free static hosting

## Local Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Deployment

This project is automatically deployed to GitHub Pages via GitHub Actions. On every push to `main`, the site is rebuilt and redeployed.

To enable GitHub Pages:
1. Go to repository Settings → Pages
2. Under "Build and deployment", select:
   - Source: GitHub Actions
3. Push to `main` branch to trigger first deployment

## Clean Room Implementation

The decryption algorithm was reverse-engineered from obfuscated game1.js code:

1. Analyzed the obfuscated source
2. Identified the algorithm through reverse engineering
3. Implemented from scratch in TypeScript
4. Verified with roundtrip tests

### Algorithm

```
Encryption:
  1. JSON.stringify(data)
  2. encodeURIComponent()
  3. XOR-like: each char = (prev + current) % 256
  4. URL-safe Base64 (-_ instead of +/)

Decryption:
  Reverse the process
```

## Data Fields

| Field | Description |
|-------|-------------|
| `YdFB` | User Agent string |
| `dg` | Device memory (GB) |
| `d-BEuCA` | CPU cores |
| `dttJrRyO` | Canvas fingerprint |
| `aM02nQV5` | WebGL vendor |
| `c9hKwCWX61TBJm_dKn0` | WebGL renderer |
| `b-I4nQ-C61rI` | Detected fonts |
| `bdI_` | Audio compressor threshold |
| `cNxRuCGPAg` | WebDriver detection |
| `Y9JA` | PhantomJS detection |
| `ZA` | Generation time (ms) |
| `bM07og` | Server timestamp |

## Project Structure

```
gf-game1-playground/
├── .github/workflows/deploy.yml  # GitHub Actions workflow
├── src/
│   ├── components/
│   │   ├── FingerprintDecoder.tsx   # Main UI component
│   │   └── FingerprintDecoder.css   # Component styles
│   ├── utils/
│   │   └── decryption.ts            # Decryption algorithm
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── index.html
├── vite.config.ts                # Vite config with GitHub Pages base URL
├── tsconfig.json
└── package.json
```

## License

MIT - For educational and security research purposes only.

## Credits

- OpenCode with Kimi K2.5

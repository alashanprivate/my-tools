# Developer Tools

> A modern developer tools collection built with TDD methodology, supporting Web and Desktop applications.

[English](README-en.md) | [中文](README.md)

## Features

| Tool | Route | Description |
|------|-------|-------------|
| **JSON Formatter** | `/json` | Format, minify, validate, auto-fix |
| **Base64** | `/base64` | Base64 encode and decode |
| **Hash** | `/hash` | MD5, SHA-1, SHA-256, SHA-512 |
| **AES** | `/aes` | AES symmetric encryption/decryption |
| **SM2** | `/sm2` | Chinese SM2 keygen, sign/verify, encrypt/decrypt |
| **SM3** | `/sm3` | Chinese SM3 hash algorithm |
| **SM4** | `/sm4` | Chinese SM4 block cipher |
| **Cron Expression** | `/cron` | Generate, explain, validate, test |
| **JWT Tools** | `/jwt` | Sign, decode, verify JWT tokens |
| **Regex** | `/regex` | Test, templates, code generation |
| **Diff Tool** | `/diff` | Line diff, split/unified views, copy patch |
| **Timestamp** | `/time` | Convert, timezone, date calc |
| **QR Code** | `/qrcode` | Generate, decode QR codes |
| **ID Card** | `/idcard` | Generate, validate Chinese ID |

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite 5.x
- Tailwind CSS + custom components
- React Router DOM v6
- Vitest + React Testing Library

**Desktop:**
- Tauri 2.x (Rust backend)
- WebView2 (Windows)

**Core Libraries:**
- crypto-js - Encryption
- js-base64 - Base64 encoding
- sm-crypto - Chinese crypto
- jose - JWT handling
- date-fns - Date utilities
- qrcode - QR code generation

## Quick Start

### Install Dependencies

```bash
npm install
```

### Web Development

```bash
npm run dev
```

Visit http://localhost:5173

### Desktop App (Windows)

```bash
npm run tauri:dev
```

### Build

```bash
# Desktop frontend (invoked automatically by Tauri; root-based asset paths)
npm run build

# Web build (static assets with /my-tools/ prefix, see "Web Deployment" below)
npm run build:web

# Desktop app installer
npm run tauri:build
```

### Test

```bash
# Run all tests
npm test

# Coverage report
npm run test:coverage
```

## Desktop Application

Native Windows desktop app built with Tauri 2.x.

**Advantages:**
- Lightweight (~3-5 MB) vs Electron (100MB+)
- Fast startup (native performance)
- All data processed locally
- WebView2 rendering, near-native experience

**Build outputs:**
```
src-tauri/target/release/bundle/msi/    # MSI installer
src-tauri/target/release/bundle/nsis/  # NSIS installer
src-tauri/target/release/my-tools.exe  # Executable
```

**Note:** First build takes 5-10 minutes to compile Rust dependencies.

## Web Deployment

The web version is a pure static SPA deployed under the `my-tools/` prefix of an Aliyun OSS bucket, served via a custom domain.

### Build mechanism

The sub-path prefix is controlled by `VITE_BASE_PATH` in `.env.web` (currently `/my-tools/`) and only applies to `build:web` (`vite build --mode web`):

- `npm run build:web` → asset URLs carry the `/my-tools/` prefix, for OSS sub-path deployment
- `npm run build` / `npm run tauri:build` → root-based asset URLs for the desktop app; the two do not interfere
- The router `basename` (`src/App.tsx`) reads the same variable and stays in sync with the Vite `base`

### Release steps

```bash
# 1. Build (output in dist/)
npm run build:web

# 2. Upload via ossutil (replace <bucket> with the actual bucket name)
ossutil cp -rf dist/ oss://<bucket>/my-tools/ --update
# index.html must not be cached so new versions take effect immediately
ossutil cp -f dist/index.html oss://<bucket>/my-tools/index.html --meta Cache-Control:no-cache
```

### OSS console setup (one-time)

Bucket → Data Management → Static Website Hosting:

| Setting | Value | Purpose |
|---------|-------|---------|
| Default homepage | `index.html` | Bucket root entry |
| Subdirectory homepage | Enabled, 404 rule **Index** | `/my-tools` directly serves the subdirectory `index.html` (200, URL unchanged) |
| Default 404 page | `my-tools/index.html` | SPA fallback for deep routes (e.g. `/my-tools/jwt`) on refresh / direct access |

**Notes:**

- Entry URL is `https://<domain>/my-tools/` — **without** `index.html` (after basename stripping, `/index.html` matches no route and renders blank)
- HTML served via the default OSS domain is force-downloaded; a custom domain is required. Static hosting is bucket-level config and changes 404 behavior for the whole bucket (evaluate for shared buckets)
- AI requests go directly from the browser to each provider; availability depends on the provider allowing CORS
- After uploading a new version, hard-refresh (Ctrl+F5) if the old page persists (browser-cached `index.html`)

## Project Structure

```
src/
├── components/
│   ├── ui/              # Base components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Select.tsx
│   │   ├── Tabs.tsx
│   │   ├── Toast.tsx
│   │   ├── JsonTree.tsx
│   │   ├── JsonHighlight.tsx
│   │   ├── DropdownMenu.tsx
│   │   └── RegionSelector.tsx
│   ├── layout/          # Layout components
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── tools/           # Tool pages
│       ├── JsonFormatter.tsx
│       ├── Base64Tool.tsx
│       ├── HashTool.tsx
│       ├── AesTool.tsx
│       ├── Sm2Tool.tsx
│       ├── Sm3Tool.tsx
│       ├── Sm4Tool.tsx
│       ├── CronTools.tsx
│       ├── JwtTool.tsx
│       ├── RegexTool.tsx
│       ├── DiffTool.tsx
│       ├── TimeTool.tsx
│       ├── QRCodeTool.tsx
│       └── IdCardTool.tsx
└── lib/                 # Utility libraries
    ├── utils.ts         # Common utilities
    ├── json/            # JSON handling
    ├── crypto/          # Encryption
    ├── gm/              # Chinese crypto
    ├── text/            # Text processing
    ├── cron/            # Cron expression
    ├── jwt/             # JWT
    ├── regex/           # Regex
    ├── diff/            # Text diff (Myers algorithm)
    ├── time/            # Timestamp
    ├── qrcode/          # QR code
    └── idCard/          # ID card
```

```
src-tauri/               # Tauri desktop app
├── src/
│   ├── main.rs         # Rust entry
│   └── lib.rs          # Tauri config
├── Cargo.toml          # Rust dependencies
├── tauri.conf.json    # App config
└── icons/             # App icons
```

## Tool Details

### JSON Formatter (/json)

- Format (custom indent 2/4/8)
- Minify
- Validate (error line location)
- Auto-fix (quotes, trailing commas, comments)
- Key sorting

### Crypto (/base64, /hash, /aes, /sm2, /sm3, /sm4)

Each algorithm has its own page:

- **Base64** (/base64) - Encode/decode
- **Hash** (/hash) - MD5, SHA-1, SHA-256, SHA-512
- **AES** (/aes) - Encrypt/decrypt
- **SM2** (/sm2) - Keygen, sign/verify, encrypt/decrypt
- **SM3** (/sm3) - Hash
- **SM4** (/sm4) - Encrypt/decrypt (hex/Base64/string key formats)

### Cron Expression (/cron)

- Parse (5-part/6-part format)
- Validate
- Explain in plain text
- Calculate next run times
- Generator (preset modes)

### JWT Tools (/jwt)

- Generate JWT (HS256/384/512, RS256)
- Decode JWT
- Verify signature and expiration

### Regex (/regex)

- Real-time test
- Common templates
- Code generation

### Diff Tool (/diff)

- Real-time line diff (Myers algorithm, computed locally)
- Split view (aligned removals/additions with inline highlights)
- Unified view (git diff style)
- Ignore whitespace / ignore case
- Copy unified diff text (applicable with `git apply`)

### Timestamp (/time)

- Timestamp conversion
- Timezone conversion
- Date calculation
- Date difference

### QR Code (/qrcode)

- Generate QR code
- Decode QR code

### ID Card (/idcard)

- Generate test ID cards
- Validate ID card info

## Design Principles

- **SOLID** - Single responsibility, open/closed, liskov substitution, interface segregation, dependency inversion
- **KISS** - Keep it simple
- **DRY** - Don't repeat yourself
- **YAGNI** - Only implement what you need
- **TDD** - Red → Green → Refactor

## Privacy

- All data processing happens locally
- No data sent to any server
- No user tracking
- Open source, auditable

## License

MIT

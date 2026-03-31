# Developer Tools

> A modern developer tools collection built with TDD methodology, supporting Web and Desktop applications.

[English](README-en.md) | [中文](README.md)

## Features

| Tool | Route | Description |
|------|-------|-------------|
| **JSON Formatter** | `/json` | Format, minify, validate, auto-fix |
| **Crypto** | `/crypto` | Base64, Hash, AES, SM2/SM3/SM4 |
| **Cron Expression** | `/cron` | Generate, explain, validate, test |
| **JWT Tools** | `/jwt` | Sign, decode, verify JWT tokens |
| **Regex** | `/regex` | Test, templates, code generation |
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
# Web app
npm run build

# Desktop app
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
│       ├── CryptoTools.tsx
│       ├── CronTools.tsx
│       ├── JwtTool.tsx
│       ├── RegexTool.tsx
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

### Crypto (/crypto)

- **Base64** - Encode/decode
- **Hash** - MD5, SHA-1, SHA-256, SHA-512
- **AES** - Encrypt/decrypt
- **SM2** - Sign/verify
- **SM3** - Hash
- **SM4** - Encrypt/decrypt

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

# 🎯 Microtask Platform

A modern Web3-enabled browser extension for distributed microtask management, built with WXT, React, and Neo-Brutalism design principles.

## 📋 Overview

Microtask Platform is a browser extension that enables users to:
- Complete microtasks for social media platforms (Twitter, Reddit)
- Authenticate using Web3 wallets via Privy
- Earn rewards for task completion
- Track progress with a modern, accessible UI

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development mode (uses wxt dev server)
bun run dev

# Build for production
npm run build

# Run E2E tests
npm run e2e
```

## 📚 Documentation

- **[Project Structure](./docs/project-structure.md)** - Understanding the WXT-based architecture
- **[Components Guide](./docs/components.md)** - Detailed component documentation
- **[Theming System](./docs/theming.md)** - Neo-Brutalism theme implementation
- **[E2E Testing](./docs/e2e-coverage.md)** - Current test coverage and testing strategy
- **[Development Roadmap](./docs/roadmap.md)** - Future features and enhancements

## ✨ Key Features

### Current Implementation

- **🔐 Web3 Authentication**: Secure wallet-based authentication using Privy
- **📱 Task Management**: Browse, claim, and complete microtasks
- **💰 Reward System**: Track earnings and cashout progress
- **🎨 Neo-Brutalism UI**: Bold, accessible design with strong visual hierarchy
- **🧪 E2E Testing**: Playwright-based test coverage for critical flows
- **⚡ State Management**: XState-powered state machines for complex flows

### Tech Stack

- **Framework**: WXT (Web Extension Toolkit)
- **Frontend**: React 19 + TypeScript
- **Styling**: TailwindCSS v4 with custom Neo-Brutalism theme
- **Authentication**: Privy.io React Auth
- **State Management**: XState v5
- **Testing**: Playwright
- **UI Components**: Custom shadcn/ui integration

## 🏗️ Architecture

The platform follows WXT's strict project structure:

```
📂 xad/
├── 📁 components/      # React components
├── 📁 entrypoints/     # Extension entry points
├── 📁 lib/            # Core logic and utilities
├── 📁 public/         # Static assets
├── 📁 e2e/           # End-to-end tests
└── 📁 docs/          # Documentation
```

## 🎯 Current Capabilities

### Supported Platforms
- **Twitter**: Likes


## 🔧 Development

### Prerequisites
- Node.js 18+
- bun
- Chrome/Firefox browser

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your `.env` file:
```env
# Required: Get from https://dashboard.privy.io/apps
VITE_PRIVY_APP_ID=your_privy_app_id

# Optional: API Configuration
# For local development (default): leave commented out
# For production API: uncomment and use
# VITE_API_BASE_URL=https://api.xad.workers.dev
```

### Running the Extension

**Local Development (connects to localhost:3001):**
```bash
bun run dev
```

**Production API (connects to https://api.xad.workers.dev):**
```bash
# Uncomment VITE_API_BASE_URL in .env first
bun run dev
```

### Browser Extension Development

1. Run development server: `bun run dev`
2. Load extension in Chrome:
   - Navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `.output/chrome-mv3-dev` directory

## 🧪 Testing

```bash
# Run all E2E tests
npm run e2e

# Run with UI mode
npm run e2e:ui

# Type checking
npm run compile
```

## 📈 Metrics

- **Component Count**: 25+ custom components
- **E2E Coverage**: Authentication, Task Management flows
- **Theme Variants**: Light/Dark mode support
- **Platform Support**: Chrome, Firefox (via WXT)

## 🤝 Contributing

Please read our contributing guidelines in [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting PRs.

## 📄 License

[MIT License](./LICENSE)

## 🔗 Links

- [WXT Documentation](https://wxt.dev)
- [Project Roadmap](./docs/roadmap.md)
- [Component Storybook](#) (Coming Soon)

---

Built with ❤️ using WXT, React, and Neo-Brutalism design principles

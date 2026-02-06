# astro-gravatar

Modern, type-safe Astro components for Gravatar integration with Bun-powered performance optimizations.

[![npm version](https://badge.fury.io/js/astro-gravatar.svg)](https://badge.fury.io/js/astro-gravatar)
[![Bun](https://img.shields.io/badge/Bun-1.0%2B-black.svg)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- **🎨 Three Component Types**: GravatarAvatar, GravatarProfileCard, and GravatarQR
- **⚡ Bun-Powered**: Built with Bun for maximum performance
- **🔒 Type-Safe**: Full TypeScript support with strict typing
- **📱 Responsive**: Automatic responsive images and layouts
- **🔄 Lazy Loading**: Built-in lazy loading with skeleton animations
- **🎯 Flexible Templates**: Multiple display templates for profile cards
- **🧪 Well-Tested**: 78.44% test coverage with 315 passing tests
- **📖 Comprehensive Docs**: Full documentation site with examples

## 📦 Installation

```bash
# Using Bun (recommended)
bun add astro-gravatar

# Using npm
npm install astro-gravatar

# Using yarn
yarn add astro-gravatar

# Using pnpm
pnpm add astro-gravatar
```

## 🎯 Quick Start

### Basic Avatar

```astro
---
import GravatarAvatar from 'astro-gravatar/GravatarAvatar';
---

<GravatarAvatar email="user@example.com" size={80} />
```

### Profile Card

```astro
---
import GravatarProfileCard from 'astro-gravatar/GravatarProfileCard';
---

<GravatarProfileCard
  email="developer@example.com"
  template="detailed"
  layout="card"
  showVerified={true}
  showLinks={true}
/>
```

### QR Code

```astro
---
import GravatarQR from 'astro-gravatar/GravatarQR';
---

<GravatarQR email="user@example.com" size={200} level="H" />
```

## 🏗️ Project Structure

This is a monorepo with the following structure:

```
astro-gravatar-bun/
├── packages/
│   └── astro-gravatar/          # Main npm package
│       ├── src/
│       │   ├── components/      # Astro components
│       │   ├── lib/            # Utilities and types
│       │   └── __tests__/      # Test files
│       ├── package.json
│       └── README.md
├── apps/
│   └── astro-gravatar.and.guide/ # Documentation site
├── scripts/                     # Build and deployment scripts
├── _refs/                       # Reference documentation
├── .github/workflows/           # CI/CD automation
└── package.json                 # Monorepo configuration
```

## 🔧 Development

### Prerequisites

- **Bun**: v1.0.0+
- **Node.js**: v22.0.0+ (for TypeScript types)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/astro-gravatar-bun.git
cd astro-gravatar-bun

# Install dependencies
bun install

# Start development server (documentation site)
bun run dev

# Run tests
bun run test

# Type checking
bun run typecheck

# Build package
bun run build
```

### Available Scripts

```bash
# Testing
bun run test                    # Run all tests
bun run test:watch              # Watch mode testing
bun run test:coverage           # Run tests with coverage

# Development
bun run dev                     # Start documentation site
bun run build                   # Build the package
bun run typecheck               # Run TypeScript type checking

# Package Management
bun run pack:preview            # Preview package creation
bun run pkg:get                 # Get package information
bun run pkg:fix                 # Auto-fix package issues

# Release Management
bun run changeset               # Create a new changeset
bun run changeset:pre           # Enter/exit pre-release mode
bun run release:prepare         # Prepare release (dry run)
```

## 📚 Documentation

For comprehensive documentation, examples, and API reference, visit:

**[📖 Documentation Site](https://astro-gravatar.and.guide)**

### Key Documentation Sections

- [Getting Started](https://astro-gravatar.and.guide/guides/quick-start)
- [Component API](https://astro-gravatar.and.guide/reference/components)
- [Performance Optimization](https://astro-gravatar.and.guide/guides/performance)
- [Advanced Examples](https://astro-gravatar.and.guide/guides/advanced-examples)
- [Troubleshooting](https://astro-gravatar.and.guide/guides/troubleshooting)

## 🧪 Testing

This project uses Bun's built-in test runner:

```bash
# Run all tests
bun test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Test Statistics

- **Total Tests**: 315
- **Coverage**: 78.44%
- **Test Files**: 7
- **Components Tested**: 3
- **Utilities Tested**: 8

## 🚀 Deployment & Release Workflow

This project uses **[Sampo](https://github.com/bruits/sampo)** for automated versioning, changelog generation, and publishing.

### 1. Creating Changesets

All PRs that affect the published package should include a changeset file. This file describes the changes and the type of version bump (patch, minor, major).

```bash
# Run this command and follow the interactive prompts
bun run changeset
```

Alternatively, you can install the [Sampo GitHub App](https://github.com/apps/sampo) to get reminders on your PRs.

### 2. Release Process (Automated)

1.  When a PR with a changeset is merged to `main`, Sampo automatically creates a **"Release PR"**.
2.  This Release PR accumulates changesets and updates the `CHANGELOG.md` and version numbers.
3.  **Review and Merge** the Release PR when you are ready to publish.
4.  Upon merging the Release PR, the CI workflow triggers `sampo release` and publishes the package to npm.

### 3. Pre-releases

Pre-releases are managed via branches:
- Push/Merge to `beta` branch → Automatically publishes a `beta` release.
- Push/Merge to `alpha` branch → Automatically publishes an `alpha` release.

### CI/CD

- **GitHub Actions**: Automated testing and deployment via `.github/workflows/release.yml`
- **Multi-Node Testing**: Tests on Node.js 18, 20, 22
- **Coverage Reporting**: Codecov integration
- **Automated Releases**: Sampo-driven release workflow

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./_refs/개발_가이드라인_및_모범_사례.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`bun test`)
6. Commit your changes
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **Testing**: All new features must include tests
- **Documentation**: Update docs for API changes
- **Bun First**: Use Bun for all development tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **[NPM Package](https://www.npmjs.com/package/astro-gravatar)**
- **[Documentation](https://astro-gravatar.and.guide)**
- **[GitHub Repository](https://github.com/your-username/astro-gravatar-bun)**
- **[Issues & Feature Requests](https://github.com/your-username/astro-gravatar-bun/issues)**
- **[Bun](https://bun.sh)** - JavaScript Runtime
- **[Astro](https://astro.build)** - Web Framework

## 🙏 Acknowledgments

- [Gravatar](https://gravatar.com) for the avatar service
- [Bun](https://bun.sh) for the amazing JavaScript runtime
- [Astro](https://astro.build) for the web framework
- The open source community for inspiration and tools

---

**Built with ❤️ using Bun and Astro**

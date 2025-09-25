# Contributing to Shii!

Thank you for your interest in contributing to Shii! 🎉

## How to Contribute

### 🐛 Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/GabrielBaiano/shii/issues)
2. Create a new issue with:
   - Clear title describing the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - System information (OS, version)

### ✨ Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear title describing the feature
   - Detailed description of the functionality
   - Use cases and benefits
   - Any mockups or examples

### 🔧 Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m "Add amazing feature"`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Create a Pull Request

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Getting Started
```bash
# Clone the repository
git clone https://github.com/GabrielBaiano/shii-study-assistant.git
cd shii-study-assistant

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build:win  # Windows
npm run build:mac  # macOS
npm run build:linux # Linux
```

### Project Structure
```
shii/
├── src/
│   ├── pages/          # Application pages
│   ├── banners/        # Banner system
│   ├── native/         # Native C++ modules
│   └── assets/         # Static assets
├── main.js             # Main Electron process
├── preload.js          # Preload scripts
└── package.json        # Project configuration
```

## Code Style

- Use meaningful variable and function names
- Add comments for complex logic
- Follow existing code patterns
- Test your changes thoroughly

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Pull Request Guidelines

- Keep PRs focused on a single feature/fix
- Include tests for new functionality
- Update documentation if needed
- Ensure all tests pass
- Add screenshots for UI changes

## License

By contributing to Shii!, you agree that your contributions will be licensed under the ISC License.

## Questions?

Feel free to open an issue or reach out to [GabrielBaiano](https://github.com/GabrielBaiano) if you have any questions!

---

Thank you for helping make Shii! better! 🚀

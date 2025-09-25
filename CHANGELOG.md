# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2024-09-25

### Added
- **Windows Auto-Start**: New option to start Shii! automatically with Windows
- Auto-start configuration in Settings page with clear instructions
- Tray menu integration for auto-start toggle
- Automatic synchronization between app settings and Windows registry
- Enhanced user experience for seamless startup

### Improved
- Settings UI with better labeling and descriptions
- Auto-start functionality with proper Windows integration
- User guidance for enabling auto-start feature
- Registry management for reliable auto-start behavior

### Technical Details
- Implemented `app.setLoginItemSettings()` for Windows auto-start
- Added registry synchronization on app startup
- Enhanced IPC handlers for real-time settings updates
- Improved error handling for auto-start operations

## [1.0.0] - 2024-09-25

### Added
- Initial release of Shii! desktop application
- Secure Google Gemini API integration
- Screen protection (stealth mode) functionality
- Custom website integration for study tools
- Clean, minimalist interface optimized for students
- Native desktop experience with Electron
- Banner system for developer promotion
- Settings management with tray integration
- Global keyboard shortcuts
- Multi-language support (English/Portuguese)
- Comprehensive documentation

### Features
- **Privacy-First Design**: No data collection, all AI conversations stay local
- **Stealth Mode**: Window invisible to screen recording and sharing software
- **Student-Focused**: Optimized interface for study sessions and academic work
- **Custom Integration**: Add personal study websites and productivity tools
- **Cross-Platform**: Windows, macOS, and Linux support
- **Open Source**: Fully auditable codebase

### Technical Details
- Built with Electron framework
- Native C++ module for stealth functionality
- JavaScript/HTML/CSS frontend
- Google Gemini API integration
- Modular banner system
- Comprehensive error handling and logging

## [0.9.0] - 2024-09-25

### Added
- Project rebranding from "Stealth App" to "Shii!"
- Separated CSS and JavaScript files for better code organization
- Enhanced path resolution for development and production builds
- Improved error handling and debugging capabilities
- Bilingual documentation (English/Portuguese)
- Custom website integration guide

### Fixed
- Page loading issues in production builds
- Banner path resolution problems
- File path duplication errors
- Build configuration issues

### Improved
- Code organization and maintainability
- Error messages and debugging information
- Project structure and documentation
- Build process reliability

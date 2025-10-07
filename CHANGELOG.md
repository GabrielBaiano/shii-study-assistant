# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2024-12-29

### Added
- **Auto-Start with Windows**: Complete auto-start functionality with tray control
- **Simplified System Tray**: Clean tray menu with only essential functions
- **Enhanced App Termination**: Proper cleanup and force quit functionality
- **Build Resource Management**: HTML pages now properly included in builds
- **Project Restructuring**: Reorganized from `src/main` to `src/core` for better clarity

### Improved
- **System Tray UX**: Streamlined menu with stealth status toggle and quit option
- **App Architecture**: Better file organization and removed unused components
- **Build Process**: Fixed resource inclusion for production builds
- **Code Quality**: Removed test dependencies and unused files
- **Page Interaction**: Disabled dragging on pages for better user experience

### Removed
- **Unused Dependencies**: Removed vitest and testing-related packages
- **Empty Directories**: Cleaned up unused `src/components` and `src/settings` folders
- **Banner System**: Removed unused banner functionality
- **Test Files**: Removed all test-related files and configurations
- **Redundant Files**: Cleaned up duplicate and unused HTML files

### Fixed
- **Build Issues**: Fixed missing HTML pages in production builds
- **App Quit**: Resolved incomplete app termination from system tray
- **Resource Management**: Proper cleanup of webContents and native modules
- **File Organization**: Corrected path references after folder restructuring
- **Page Dragging**: Disabled unwanted page dragging behavior

### Technical Details
- Updated `package.json` with `extraResources` configuration
- Implemented `forceQuit()` function for complete app termination
- Added auto-launch functionality with `auto-launch` package
- Reorganized project structure for better maintainability
- Enhanced error handling and logging throughout the application

## [1.1.0] - 2024-12-29

### Added
- **Redesigned Settings Menu**: Complete UI overhaul inspired by Gemini Chat interface
- **Modular Architecture**: Separated CSS and JavaScript from HTML for better maintainability
- **Global Configuration Variables**: Centralized configuration system for easier customization
- **Dynamic Configuration Reload**: Settings changes apply instantly without app restart
- **Enhanced Stealth Mode**: Improved native module compilation and functionality
- **Centralized Window Positioning**: Settings window now opens in the center of the screen

### Improved
- **Settings Interface**: Modern, clean design with better organization and visual hierarchy
- **Banner System**: Reduced banner height to 15px for better visual balance
- **Auto-Start Functionality**: Simplified to use only registry method (more reliable)
- **Build System**: Optimized for ZIP distribution with better resource management
- **Code Organization**: Better separation of concerns and maintainability

### Removed
- **Startup Method Selection**: Removed confusing startup folder option, keeping only registry method
- **Redundant UI Elements**: Cleaned up unused configuration options
- **Complex Auto-Start Logic**: Simplified to single, reliable method

### Fixed
- **Syntax Errors**: Resolved JavaScript syntax issues in main process
- **Module Compilation**: Fixed native module compilation for stealth functionality
- **Configuration Loading**: Improved settings loading and validation
- **Memory Management**: Better cleanup of resources when pages are removed

### Technical Details
- Refactored settings menu with modern CSS variables and responsive design
- Implemented debounced configuration updates for better performance
- Enhanced error handling and logging throughout the application
- Improved build configuration for better distribution and packaging

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

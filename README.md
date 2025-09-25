<p align="center">
  <img src="/build/icon-256.png" alt="Shii! App Logo" width="200"/>
</p>

<h1 align="center">Shii!</h1>

<p align="center">
  <a href="/README.pt.md" target="_blank">Português</a>
  &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/GabrielBaiano/shii/issues/new?title=Suggestion%20or%20Bug%20in%20Shii!&body=**Describe%20your%20idea%20or%20problem%20here:**%0A%0A%0A**Steps%20to%20reproduce%20(if%20it's%20a%20bug):**%0A1.%20...%0A2.%20...%0A%0A**Any%20other%20relevant%20information?**%0A" target="_blank">Report Bug / Suggestion</a>
  &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="https://www.linkedin.com/in/gabriel-nascimento-gama-5b0b30185/" target="_blank">LinkedIn</a>
</p>

---

<p align="center">
  <img src="https://i.imgur.com/your-showcase-image.gif" alt="Shii! App Showcase"/>
</p>

**Shii!** is a minimalist and secure desktop client for Google Gemini API, designed with a focus on privacy and productivity for students. Chat with AI directly from your computer with the unique screen protection feature that makes the window invisible to screen recording and screen sharing software.

## 🎓 Main Features

* **Screen Sharing Protection**: Activate protection mode so that window content cannot be captured by recording tools or live streams. Perfect for privacy during study sessions.
* **Native Desktop Experience**: Clean and distraction-free interface, built with Electron to run perfectly on your operating system.
* **Student-Focused Design**: Optimized for students who need quick access to AI assistance while maintaining privacy.
* **Custom Website Integration**: Add your own study websites and tools to the app for a personalized experience.

## 🛠️ Technologies Used

* **Framework**: Electron
* **Language**: JavaScript
* **Native Module**: C++ with `node-addon-api` for screen protection functionality.
* **Interface**: HTML, CSS
* **Packaging**: electron-builder
* **Libraries**: `marked.js` (Markdown), `highlight.js` (Code Highlighting)

## 📖 How to Use and Install

Installation is simple and straightforward.

1. Go to the **[Releases page here](https://github.com/GabrielBaiano/shii/tags)**.
2. Download the latest installer for your operating system (e.g., `Shii-Setup-X.X.X.exe` for Windows).
3. Run the installer.
   * **Note for Windows:** SmartScreen may display a warning about "Unknown Publisher". This is normal. Click "More info" and then "Run anyway".
4. Get your API key from **[Google AI Studio](https://aistudio.google.com/)**.

## 🌐 Adding Your Own Websites

Shii! allows you to add your own study websites and tools in two ways:

### Method 1: Developer Mode (Advanced Users)

1. Clone the repository and navigate to the project folder
2. Open `src/pages/` directory
3. Create a new folder for your website (e.g., `my-study-site/`)
4. Create an `index.html` file with your website content
5. Update the main application configuration to include your new page
6. Build and run the application

### Method 2: Quick Links (Easy Method)

1. Open Shii! application
2. Go to Settings
3. Add website URLs in the "Custom Links" section
4. Your websites will appear as quick-access buttons in the main interface

### Supported Website Types:
- Study platforms (Coursera, Khan Academy, etc.)
- Note-taking apps (Notion, Obsidian, etc.)
- Research tools (Google Scholar, PubMed, etc.)
- Productivity apps (Todoist, Trello, etc.)
- Any website that works in a web browser

## 💻 For Developers

If you want to clone the repository and run the project locally:

```bash
# 1. Clone the repository
git clone https://github.com/GabrielBaiano/shii.git

# 2. Navigate to the project folder
cd shii

# 3. Install dependencies
npm install

# 4. Run in development mode
npm start

# 5. To create installers
npm run package
```

## 🔒 Privacy and Security

Shii! is built with student privacy in mind:
- No data collection or tracking
- All AI conversations stay on your device
- Screen protection prevents accidental sharing during presentations
- Open source - you can verify what the app does

## 📚 Perfect for Students

- **Study Sessions**: Chat with AI for help with homework and research
- **Presentations**: Screen protection ensures your AI conversations stay private
- **Research**: Quick access to study tools and websites
- **Productivity**: Integrated tools for note-taking and task management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/GabrielBaiano" target="_blank">GabrielBaiano</a>
</p>

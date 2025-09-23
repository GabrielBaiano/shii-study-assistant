// Tiny, focused helpers for settings persistence.

import fs from 'fs';
import path from 'path';
import { app } from 'electron';

function getSettingsFilePath() {
  try {
    const dir = app.getPath('userData');
    return path.join(dir, 'settings.json');
  } catch {
    return path.join(__dirname, '..', 'settings.json');
  }
}

function loadSettingsFromDisk() {
  try {
    const p = getSettingsFilePath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
  } catch (e) {
    // If reading settings is dramatic today, we default quietly.
    console.warn('Failed to load settings:', e);
  }
  return {};
}

function saveSettingsToDisk(settings) {
  try {
    const p = getSettingsFilePath();
    fs.writeFileSync(p, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

export {
  getSettingsFilePath,
  loadSettingsFromDisk,
  saveSettingsToDisk,
};



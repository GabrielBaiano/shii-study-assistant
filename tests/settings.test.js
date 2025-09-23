import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import * as settings from '../utils/settings.js';

describe('settings persistence', () => {
  const mockPath = 'settings.test.json';

  beforeEach(() => {
    // Mock the getSettingsFilePath function
    vi.spyOn(settings, 'getSettingsFilePath').mockReturnValue(mockPath);
    if (fs.existsSync(mockPath)) fs.unlinkSync(mockPath);
  });

  afterEach(() => {
    if (fs.existsSync(mockPath)) fs.unlinkSync(mockPath);
    vi.restoreAllMocks();
  });

  it('saves and loads settings', () => {
    const data = { scrollSpeed: 200, alwaysOnTop: false };
    settings.saveSettingsToDisk(data);
    const loaded = settings.loadSettingsFromDisk();
    expect(loaded.scrollSpeed).toBe(200);
    expect(loaded.alwaysOnTop).toBe(false);
  });
});



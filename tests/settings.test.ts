import { describe, it, expect } from 'vitest';
import {
  migrateLegacySettingsFromStorage,
  LEGACY_STORAGE_KEYS,
} from '../src/store/settings';

function createMemoryStorage(initial: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    map,
    getItem(key: string): string | null {
      return map.has(key) ? map.get(key)! : null;
    },
    removeItem(key: string): void {
      map.delete(key);
    },
  };
}

describe('settings store legacy dt_* migration', () => {
  it('copies valid legacy dt_* keys into the settings object and deletes the old keys', () => {
    const mockStorage = createMemoryStorage({
      [LEGACY_STORAGE_KEYS.theme]: 'cyberpunk',
      [LEGACY_STORAGE_KEYS.uiStyle]: 'neobrutalism',
      [LEGACY_STORAGE_KEYS.caretShape]: 'beam',
      [LEGACY_STORAGE_KEYS.caretSmoothness]: 'spring',
      [LEGACY_STORAGE_KEYS.errorMode]: 'strict',
      [LEGACY_STORAGE_KEYS.fontSize]: '20',
      [LEGACY_STORAGE_KEYS.showKeyboard]: 'false',
      [LEGACY_STORAGE_KEYS.lastLang]: 'python',
    });

    const migrated = migrateLegacySettingsFromStorage(mockStorage);

    expect(migrated).toEqual({
      theme: 'cyberpunk',
      uiStyle: 'neobrutalism',
      caretShape: 'beam',
      caretSmoothness: 'spring',
      errorMode: 'strict',
      fontSize: 20,
      showKeyboard: false,
      lastLang: 'python',
    });

    // Verify all legacy keys were removed
    for (const key of Object.values(LEGACY_STORAGE_KEYS)) {
      expect(mockStorage.map.has(key)).toBe(false);
    }
  });

  it('ignores disabled languages in dt_last_lang while still removing the legacy key', () => {
    const mockStorage = createMemoryStorage({
      [LEGACY_STORAGE_KEYS.lastLang]: 'rust', // disabled language
    });

    const migrated = migrateLegacySettingsFromStorage(mockStorage);
    expect(migrated.lastLang).toBeUndefined();
    expect(mockStorage.map.has(LEGACY_STORAGE_KEYS.lastLang)).toBe(false);
  });
});

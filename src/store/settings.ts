/**
 * ============================================================================
 * DEVTYPE SETTINGS STORE — STATE FLOW DIAGRAM
 * ============================================================================
 *
 *   [Legacy localStorage Keys]
 *   (dt_theme, dt_ui_style, dt_shape, dt_smoothness,
 *    dt_error_mode, dt_font_size, dt_show_keyboard, dt_last_lang)
 *               │
 *               ▼  (One-time boot migration: migrateLegacySettingsFromStorage)
 *   ┌───────────────────────────────────────────────────────────────┐
 *   │  Zustand Persist Store: useSettingsStore ("dt_settings", v1)  │
 *   │  { version: 1, theme, uiStyle, caretShape, caretSmoothness,   │
 *   │    errorMode, fontSize, showKeyboard, lastLang }              │
 *   └───────────┬───────────────────────────────┬───────────────────┘
 *               │                               │
 *     Reads &   │                               │  Reads & Updates via Actions
 *     Renders   ▼                               ▼
 *   ┌───────────────────────────┐   ┌────────────────────────────────────────┐
 *   │ TypingTest & ProfilePage  │   │ StudioModalsHost & StudioHeaderDock    │
 *   │ (IDE viewport, theme,     │   │ (Settings modal, Command Palette,      │
 *   │  language, font & deck)   │   │  Theme/UI style/Deck toggles)          │
 *   └───────────────────────────┘   └────────────────────────────────────────┘
 * ============================================================================
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CaretShape,
  CaretSmoothness,
  ErrorMode,
  LANGUAGES,
} from '@/constants/languages';
import { STUDIO_THEMES } from '@/constants/themes';
import { UI_STYLES, UIStyleId } from '@/constants/uiStyles';

export const SETTINGS_VERSION = 1;
export const SETTINGS_STORAGE_KEY = 'dt_settings';

export const LEGACY_STORAGE_KEYS = {
  theme: 'dt_theme',
  uiStyle: 'dt_ui_style',
  caretShape: 'dt_shape',
  caretSmoothness: 'dt_smoothness',
  errorMode: 'dt_error_mode',
  fontSize: 'dt_font_size',
  showKeyboard: 'dt_show_keyboard',
  lastLang: 'dt_last_lang',
} as const;

export interface StudioSettings {
  version: number;
  theme: string;
  uiStyle: UIStyleId;
  caretShape: CaretShape;
  caretSmoothness: CaretSmoothness;
  errorMode: ErrorMode;
  fontSize: number;
  showKeyboard: boolean;
  lastLang: string;
}

export interface StudioSettingsActions {
  setTheme: (theme: string) => void;
  setUiStyle: (uiStyle: UIStyleId) => void;
  setCaretShape: (caretShape: CaretShape) => void;
  setCaretSmoothness: (caretSmoothness: CaretSmoothness) => void;
  setErrorMode: (errorMode: ErrorMode) => void;
  setFontSize: (fontSize: number) => void;
  setShowKeyboard: (showKeyboard: boolean) => void;
  toggleShowKeyboard: () => void;
  setLastLang: (lastLang: string) => void;
  cycleTheme: () => void;
  cycleUiStyle: () => void;
  hydrateAndMigrateLegacy: () => void;
}

export type SettingsStore = StudioSettings & StudioSettingsActions;

export const DEFAULT_SETTINGS: StudioSettings = {
  version: SETTINGS_VERSION,
  theme: 'obsidian',
  uiStyle: 'bento_matte',
  caretShape: 'block',
  caretSmoothness: 'butter',
  errorMode: 'forgiving',
  fontSize: 18,
  showKeyboard: true,
  lastLang: 'typescript',
};

const VALID_SHAPES: readonly CaretShape[] = ['block', 'beam', 'underline', 'outline'];
const VALID_SMOOTHNESS: readonly CaretSmoothness[] = [
  'instant',
  'snappy',
  'butter',
  'liquid',
  'spring',
];
const VALID_ERROR_MODES: readonly ErrorMode[] = ['forgiving', 'strict', 'no-backspace'];

/**
 * Pure migration helper: reads legacy `dt_*` keys from any Storage-compatible
 * object, returns the migrated partial settings, and removes the old keys.
 */
export function migrateLegacySettingsFromStorage(
  storage: Pick<Storage, 'getItem' | 'removeItem'>
): Partial<StudioSettings> {
  const migrated: Partial<StudioSettings> = {};

  const rawTheme = storage.getItem(LEGACY_STORAGE_KEYS.theme);
  if (rawTheme && STUDIO_THEMES.some((t) => t.id === rawTheme)) {
    migrated.theme = rawTheme;
  }

  const rawUiStyle = storage.getItem(LEGACY_STORAGE_KEYS.uiStyle) as UIStyleId | null;
  if (rawUiStyle && UI_STYLES.some((s) => s.id === rawUiStyle)) {
    migrated.uiStyle = rawUiStyle;
  }

  const rawShape = storage.getItem(LEGACY_STORAGE_KEYS.caretShape) as CaretShape | null;
  if (rawShape && VALID_SHAPES.includes(rawShape)) {
    migrated.caretShape = rawShape;
  }

  const rawSmooth = storage.getItem(
    LEGACY_STORAGE_KEYS.caretSmoothness
  ) as CaretSmoothness | null;
  if (rawSmooth && VALID_SMOOTHNESS.includes(rawSmooth)) {
    migrated.caretSmoothness = rawSmooth;
  }

  const rawErrorMode = storage.getItem(LEGACY_STORAGE_KEYS.errorMode) as ErrorMode | null;
  if (rawErrorMode && VALID_ERROR_MODES.includes(rawErrorMode)) {
    migrated.errorMode = rawErrorMode;
  }

  const rawFontSize = storage.getItem(LEGACY_STORAGE_KEYS.fontSize);
  if (rawFontSize !== null) {
    const parsed = parseInt(rawFontSize, 10);
    if (!Number.isNaN(parsed) && parsed >= 10 && parsed <= 36) {
      migrated.fontSize = parsed;
    }
  }

  const rawShowKb = storage.getItem(LEGACY_STORAGE_KEYS.showKeyboard);
  if (rawShowKb === 'true' || rawShowKb === 'false') {
    migrated.showKeyboard = rawShowKb === 'true';
  }

  const rawLang = storage.getItem(LEGACY_STORAGE_KEYS.lastLang);
  if (rawLang && LANGUAGES.some((l) => l.id === rawLang && l.enabled)) {
    migrated.lastLang = rawLang;
  }

  // Always remove legacy keys after reading them once
  for (const key of Object.values(LEGACY_STORAGE_KEYS)) {
    storage.removeItem(key);
  }

  return migrated;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),
      setUiStyle: (uiStyle) => set({ uiStyle }),
      setCaretShape: (caretShape) => set({ caretShape }),
      setCaretSmoothness: (caretSmoothness) => set({ caretSmoothness }),
      setErrorMode: (errorMode) => set({ errorMode }),
      setFontSize: (fontSize) => set({ fontSize }),
      setShowKeyboard: (showKeyboard) => set({ showKeyboard }),
      toggleShowKeyboard: () => set((state) => ({ showKeyboard: !state.showKeyboard })),
      setLastLang: (lastLang) => set({ lastLang }),

      cycleTheme: () => {
        const current = get().theme;
        const idx = STUDIO_THEMES.findIndex((t) => t.id === current);
        const next = STUDIO_THEMES[(idx + 1) % STUDIO_THEMES.length];
        set({ theme: next.id });
      },

      cycleUiStyle: () => {
        const current = get().uiStyle;
        const idx = UI_STYLES.findIndex((s) => s.id === current);
        const next = UI_STYLES[(idx + 1) % UI_STYLES.length];
        set({ uiStyle: next.id });
      },

      hydrateAndMigrateLegacy: () => {
        if (typeof window === 'undefined') return;
        try {
          const patch = migrateLegacySettingsFromStorage(window.localStorage);
          if (Object.keys(patch).length > 0) {
            set((state) => ({
              ...state,
              ...patch,
              version: SETTINGS_VERSION,
            }));
          }
        } catch {}
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: SETTINGS_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        const base =
          persistedState && typeof persistedState === 'object'
            ? (persistedState as Partial<StudioSettings>)
            : {};
        if (typeof window !== 'undefined') {
          try {
            const legacyPatch = migrateLegacySettingsFromStorage(window.localStorage);
            return {
              ...DEFAULT_SETTINGS,
              ...base,
              ...legacyPatch,
              version: SETTINGS_VERSION,
            };
          } catch {}
        }
        return {
          ...DEFAULT_SETTINGS,
          ...base,
          version: SETTINGS_VERSION,
        };
      },
    }
  )
);

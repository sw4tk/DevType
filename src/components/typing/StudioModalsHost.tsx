'use client';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import StudioSettingsModal from '@/components/typing/StudioSettingsModal';
import CommandPaletteModal, { ModalTab } from '@/components/typing/CommandPaletteModal';
import DeveloperProfileModal from '@/components/typing/DeveloperProfileModal';
import { useSettingsStore } from '@/store/settings';
import { StudioTheme } from '@/constants/themes';
import { DeveloperUser, HistoryRecord } from '@/constants/languages';
import { SwitchProfile } from '@/hooks/useMechanicalAudio';

interface StudioModalsHostProps {
  theme: StudioTheme;
  settingsModalOpen: boolean;
  onCloseSettingsModal: () => void;
  paletteOpen: boolean;
  paletteTab: ModalTab;
  onClosePalette: () => void;
  profileModalOpen: boolean;
  onCloseProfileModal: () => void;
  selectedLang: string;
  onSelectLanguage: (langId: string) => void;
  onTriggerRandom: () => void;
  onStartDailyChallenge: () => void;
  onSubmitCustomChunks: (title: string, chunks: string[], badge: string) => void;
  velocityStretch: boolean;
  onChangeVelocityStretch: (val: boolean) => void;
  caretGlow: boolean;
  onChangeCaretGlow: (val: boolean) => void;
  focusZenDim: boolean;
  onChangeFocusZenDim: (val: boolean) => void;
  pacemakerWpm: number;
  onChangePacemaker: (val: number) => void;
  soundProfile: SwitchProfile;
  onChangeSoundProfile: (val: SwitchProfile) => void;
  user: DeveloperUser | null;
  onChangeUser: (user: DeveloperUser | null) => void;
  sessionLogs: HistoryRecord[];
  todayStr: string;
  dailyBestWpm: number;
}

export default function StudioModalsHost({
  theme,
  settingsModalOpen,
  onCloseSettingsModal,
  paletteOpen,
  paletteTab,
  onClosePalette,
  profileModalOpen,
  onCloseProfileModal,
  selectedLang,
  onSelectLanguage,
  onTriggerRandom,
  onStartDailyChallenge,
  onSubmitCustomChunks,
  velocityStretch,
  onChangeVelocityStretch,
  caretGlow,
  onChangeCaretGlow,
  focusZenDim,
  onChangeFocusZenDim,
  pacemakerWpm,
  onChangePacemaker,
  soundProfile,
  onChangeSoundProfile,
  user,
  onChangeUser,
  sessionLogs,
  todayStr,
  dailyBestWpm,
}: StudioModalsHostProps) {
  const {
    theme: themeId,
    uiStyle: uiStyleId,
    caretShape,
    caretSmoothness,
    errorMode,
    fontSize,
    showKeyboard,
    setTheme,
    setUiStyle,
    setCaretShape,
    setCaretSmoothness,
    setErrorMode,
    setFontSize,
    setShowKeyboard,
  } = useSettingsStore();

  return (
    <>
      <StudioSettingsModal
        isOpen={settingsModalOpen}
        onClose={onCloseSettingsModal}
        theme={theme}
        uiStyleId={uiStyleId}
        onSelectUiStyle={setUiStyle}
        showKeyboard={showKeyboard}
        onChangeShowKeyboard={setShowKeyboard}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        caretSmoothness={caretSmoothness}
        onChangeCaretSmoothness={setCaretSmoothness}
        caretShape={caretShape}
        onChangeCaretShape={setCaretShape}
        errorMode={errorMode}
        onChangeErrorMode={setErrorMode}
        velocityStretch={velocityStretch}
        onChangeVelocityStretch={onChangeVelocityStretch}
        caretGlow={caretGlow}
        onChangeCaretGlow={onChangeCaretGlow}
        focusZenDim={focusZenDim}
        onChangeFocusZenDim={onChangeFocusZenDim}
        pacemakerWpm={pacemakerWpm}
        onChangePacemaker={onChangePacemaker}
        soundProfile={soundProfile}
        onChangeSoundProfile={onChangeSoundProfile}
      />

      <CommandPaletteModal
        isOpen={paletteOpen}
        initialTab={paletteTab}
        onClose={onClosePalette}
        selectedLang={selectedLang}
        onSelectLanguage={onSelectLanguage}
        selectedThemeId={themeId}
        onSelectTheme={setTheme}
        uiStyleId={uiStyleId}
        onSelectUiStyle={setUiStyle}
        errorMode={errorMode}
        onChangeErrorMode={setErrorMode}
        onTriggerRandom={onTriggerRandom}
        onStartDailyChallenge={onStartDailyChallenge}
        onSubmitCustomChunks={onSubmitCustomChunks}
        currentCaretShape={caretShape}
        onChangeCaretShape={setCaretShape}
        caretSmoothness={caretSmoothness}
        onChangeCaretSmoothness={setCaretSmoothness}
        velocityStretch={velocityStretch}
        onChangeVelocityStretch={onChangeVelocityStretch}
        caretGlow={caretGlow}
        onChangeCaretGlow={onChangeCaretGlow}
        focusZenDim={focusZenDim}
        onChangeFocusZenDim={onChangeFocusZenDim}
        pacemakerWpm={pacemakerWpm}
        onChangePacemaker={onChangePacemaker}
        sessionLogs={sessionLogs}
        todayStr={todayStr}
        dailyBestWpm={dailyBestWpm}
      />

      <DeveloperProfileModal
        isOpen={profileModalOpen}
        onClose={onCloseProfileModal}
        user={user}
        onLoginUser={(u) => {
          onChangeUser(u);
          try {
            localStorage.setItem('dt_user_profile', JSON.stringify(u));
          } catch {}
        }}
        onLogoutUser={async () => {
          try {
            const supabase = createClient();
            await supabase.auth.signOut();
            localStorage.removeItem('dt_user_profile');
          } catch {}
          onChangeUser(null);
        }}
        sessionLogs={sessionLogs}
        todayStr={todayStr}
        accentColor={theme.accent}
        theme={theme}
      />
    </>
  );
}

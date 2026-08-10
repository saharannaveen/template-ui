import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface VoiceState {
  voiceEnabled: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  ttsSpeed: number;
  sttLanguage: string;
  autoSubmit: boolean;
}

const STORAGE_KEY = 'template-ui-voice-settings';

function loadVoiceSettings(): VoiceState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        voiceEnabled: parsed.voiceEnabled ?? false,
        isListening: parsed.isListening ?? false,
        isSpeaking: parsed.isSpeaking ?? false,
        ttsSpeed: parsed.ttsSpeed ?? 1.0,
        sttLanguage: parsed.sttLanguage ?? 'en-US',
        autoSubmit: parsed.autoSubmit ?? true,
      };
    }
  } catch {
    // ignore
  }
  return {
    voiceEnabled: false,
    isListening: false,
    isSpeaking: false,
    ttsSpeed: 1.0,
    sttLanguage: 'en-US',
    autoSubmit: true,
  };
}

function persistVoiceSettings(settings: VoiceState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

const voiceSlice = createSlice({
  name: 'voice',
  initialState: loadVoiceSettings(),
  reducers: {
    toggleVoice(state) {
      state.voiceEnabled = !state.voiceEnabled;
      persistVoiceSettings(state);
    },
    setVoiceEnabled(state, action: PayloadAction<boolean>) {
      state.voiceEnabled = action.payload;
      persistVoiceSettings(state);
    },
    setListening(state, action: PayloadAction<boolean>) {
      state.isListening = action.payload;
      persistVoiceSettings(state);
    },
    setSpeaking(state, action: PayloadAction<boolean>) {
      state.isSpeaking = action.payload;
      persistVoiceSettings(state);
    },
    setTtsSpeed(state, action: PayloadAction<number>) {
      state.ttsSpeed = Math.max(0.5, Math.min(2.0, action.payload));
      persistVoiceSettings(state);
    },
    setSttLanguage(state, action: PayloadAction<string>) {
      state.sttLanguage = action.payload;
      persistVoiceSettings(state);
    },
    setAutoSubmit(state, action: PayloadAction<boolean>) {
      state.autoSubmit = action.payload;
      persistVoiceSettings(state);
    },
  },
});

export const {
  toggleVoice,
  setVoiceEnabled,
  setListening,
  setSpeaking,
  setTtsSpeed,
  setSttLanguage,
  setAutoSubmit,
} = voiceSlice.actions;

export const selectVoiceEnabled = (state: { voice: VoiceState }) => state.voice.voiceEnabled;
export const selectIsListening = (state: { voice: VoiceState }) => state.voice.isListening;
export const selectIsSpeaking = (state: { voice: VoiceState }) => state.voice.isSpeaking;
export const selectTtsSpeed = (state: { voice: VoiceState }) => state.voice.ttsSpeed;
export const selectSttLanguage = (state: { voice: VoiceState }) => state.voice.sttLanguage;
export const selectAutoSubmit = (state: { voice: VoiceState }) => state.voice.autoSubmit;

export default voiceSlice.reducer;

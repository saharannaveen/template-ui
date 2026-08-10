import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  selectVoiceEnabled,
  selectTtsSpeed,
  selectSttLanguage,
  selectAutoSubmit,
  toggleVoice,
  setTtsSpeed,
  setSttLanguage,
  setAutoSubmit,
} from '../../redux/slices/voice';
import { Mic, Volume2, AlertCircle } from 'lucide-react';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useSpeechToText } from '../../hooks/useSpeechToText';

const STT_LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'es-MX', label: 'Spanish (Mexico)' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
];

export function VoiceSettings() {
  const dispatch = useAppDispatch();
  const voiceEnabled = useAppSelector(selectVoiceEnabled);
  const ttsSpeed = useAppSelector(selectTtsSpeed);
  const sttLanguage = useAppSelector(selectSttLanguage);
  const autoSubmit = useAppSelector(selectAutoSubmit);

  const { isSupported: ttsSupported, speak } = useTextToSpeech(ttsSpeed);
  const { isSupported: sttSupported } = useSpeechToText(sttLanguage);

  const handleTestVoice = () => {
    speak('Voice is working correctly.');
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = parseFloat(e.target.value);
    dispatch(setTtsSpeed(speed));
  };

  const isSupported = ttsSupported && sttSupported;

  return (
    <div className="space-y-6">
      {!isSupported && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive mb-1">Voice features not supported</p>
            <p className="text-xs text-muted-foreground">
              Your browser doesn&apos;t support {!ttsSupported && 'text-to-speech'}
              {!ttsSupported && !sttSupported && ' or '}
              {!sttSupported && 'speech recognition'}. Try using Chrome, Edge, or Safari.
            </p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">Voice Interaction</h3>
            <p className="text-xs text-muted-foreground">
              Speak your questions and hear responses aloud
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(toggleVoice())}
            disabled={!isSupported}
            role="switch"
            aria-checked={voiceEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              !isSupported
                ? 'bg-muted cursor-not-allowed opacity-50'
                : voiceEnabled
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                voiceEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {voiceEnabled && isSupported && (
        <>
          <div>
            <label htmlFor="tts-speed" className="text-sm font-medium text-foreground mb-2 block">
              <Volume2 className="w-4 h-4 inline-block mr-1.5" />
              Speaking Speed: {ttsSpeed.toFixed(1)}x
            </label>
            <input
              id="tts-speed"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={ttsSpeed}
              onChange={handleSpeedChange}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.5x (Slower)</span>
              <span>2.0x (Faster)</span>
            </div>
          </div>

          <div>
            <label htmlFor="stt-language" className="text-sm font-medium text-foreground mb-2 block">
              <Mic className="w-4 h-4 inline-block mr-1.5" />
              Recognition Language
            </label>
            <select
              id="stt-language"
              value={sttLanguage}
              onChange={(e) => dispatch(setSttLanguage(e.target.value))}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              {STT_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-foreground">Auto-submit after speaking</h4>
                <p className="text-xs text-muted-foreground">
                  Automatically send message when you finish speaking
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch(setAutoSubmit(!autoSubmit))}
                role="switch"
                aria-checked={autoSubmit}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSubmit ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSubmit ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleTestVoice}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Volume2 className="w-4 h-4 inline-block mr-2" />
              Test Voice
            </button>
          </div>
        </>
      )}
    </div>
  );
}

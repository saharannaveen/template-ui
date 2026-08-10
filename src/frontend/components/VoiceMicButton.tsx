import { useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { VoiceWaveform } from './VoiceWaveform';
import { useAppSelector } from '../redux/hooks';
import { selectSttLanguage } from '../redux/slices/voice';

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceMicButton({ onTranscript, disabled = false }: VoiceMicButtonProps) {
  const sttLanguage = useAppSelector(selectSttLanguage);
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    error,
    isSupported,
  } = useSpeechToText(sttLanguage);

  // Auto-submit when user stops speaking
  useEffect(() => {
    if (!isListening && transcript) {
      onTranscript(transcript);
    }
  }, [isListening, transcript, onTranscript]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground cursor-not-allowed"
        aria-label="Voice input not supported"
        title="Your browser doesn't support speech recognition"
      >
        <MicOff className="h-4 w-4" />
      </button>
    );
  }

  if (error) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        aria-label="Voice input error - click to retry"
        title={`Error: ${error}. Click to retry.`}
      >
        <MicOff className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
          disabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : isListening
              ? 'bg-destructive text-destructive-foreground shadow-md animate-pulse'
              : 'bg-muted text-foreground hover:bg-muted/80 hover:shadow-sm'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        title={isListening ? 'Stop listening' : 'Click to speak'}
      >
        {isListening ? <Mic className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>

      {isListening && interimTranscript && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-card border border-border rounded-lg shadow-elevated max-w-xs z-10">
          <div className="flex items-center gap-2 mb-1">
            <VoiceWaveform />
            <span className="text-xs text-muted-foreground">Listening...</span>
          </div>
          <p className="text-sm text-foreground">{interimTranscript}</p>
        </div>
      )}
    </div>
  );
}

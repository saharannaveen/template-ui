import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useAppSelector } from '../redux/hooks';
import { selectTtsSpeed } from '../redux/slices/voice';

interface VoicePlayButtonProps {
  text: string;
  disabled?: boolean;
}

export function VoicePlayButton({ text, disabled = false }: VoicePlayButtonProps) {
  const ttsSpeed = useAppSelector(selectTtsSpeed);
  const { isSpeaking, speak, stop, isSupported } = useTextToSpeech(ttsSpeed);
  const [isPlayingThis, setIsPlayingThis] = useState(false);

  useEffect(() => {
    if (!isSpeaking && isPlayingThis) {
      setIsPlayingThis(false);
    }
  }, [isSpeaking, isPlayingThis]);

  const handleToggle = () => {
    if (isPlayingThis) {
      stop();
      setIsPlayingThis(false);
    } else {
      speak(text);
      setIsPlayingThis(true);
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 cursor-not-allowed"
        aria-label="Text-to-speech not supported"
        title="Your browser doesn't support text-to-speech"
      >
        <VolumeX className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || !text.trim()}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
        disabled || !text.trim()
          ? 'text-muted-foreground/40 cursor-not-allowed'
          : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      }`}
      aria-label={isPlayingThis ? 'Stop reading' : 'Read message aloud'}
      title={isPlayingThis ? 'Stop reading' : 'Read message aloud'}
    >
      {isPlayingThis ? (
        <Volume2 className="h-3.5 w-3.5 animate-pulse" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

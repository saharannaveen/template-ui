import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSupported: boolean;
}

export function useTextToSpeech(rate = 1.0, pitch = 1.0): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const queueRef = useRef<string[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPausedRef = useRef(false);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const splitIntoSentences = (text: string): string[] => {
    // Split on sentence boundaries (. ? ! \n) but keep them
    return text
      .split(/([.?!\n]+)/)
      .reduce((acc: string[], part, i, arr) => {
        if (i % 2 === 0) {
          const sentence = (part + (arr[i + 1] || '')).trim();
          if (sentence) acc.push(sentence);
        }
        return acc;
      }, []);
  };

  const speakNext = useCallback(() => {
    if (!isSupported || queueRef.current.length === 0) {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      return;
    }

    const sentence = queueRef.current.shift()!;
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => {
      speakNext();
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      queueRef.current = [];
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, rate, pitch]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) {
        console.warn('Text-to-speech not supported');
        return;
      }

      // Stop and clear any current speech
      window.speechSynthesis.cancel();
      queueRef.current = [];
      isPausedRef.current = false;

      // Split into sentences and queue
      const sentences = splitIntoSentences(text);
      queueRef.current = sentences;

      setIsSpeaking(true);
      speakNext();
    },
    [isSupported, speakNext],
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    currentUtteranceRef.current = null;
    isPausedRef.current = false;
    setIsSpeaking(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    isPausedRef.current = true;
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    isPausedRef.current = false;
  }, [isSupported]);

  // Update speaking state based on actual speechSynthesis state
  useEffect(() => {
    if (!isSupported) return;

    const checkSpeaking = setInterval(() => {
      const actuallySpeak = window.speechSynthesis.speaking;
      if (!actuallySpeak && isSpeaking && !isPausedRef.current) {
        setIsSpeaking(false);
      }
    }, 100);

    return () => clearInterval(checkSpeaking);
  }, [isSupported, isSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    isSpeaking,
    speak,
    stop,
    pause,
    resume,
    isSupported,
  };
}

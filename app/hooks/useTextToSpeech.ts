import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeakParams {
  text: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
}

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const speak = useCallback(
    ({ text, voiceName, rate = 1.2, pitch = 1 }: SpeakParams) => {
      const synth = synthRef.current;
      if (!synth || !text) {
        return;
      }

      if (synth.speaking) {
        console.warn('Speech synthesis is already active.');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      const selectedVoice = voices.find(
        (voice) => voice.name === voiceName,
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.pitch = pitch;
      utterance.rate = rate;

      // Set state and log errors
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        setIsSpeaking(false);
      };

      synth.speak(utterance);
    },
    [voices],
  );

  // Effect to initialize speech synthesis and get voices
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        if (synthRef.current) {
          setVoices(synthRef.current.getVoices());
        }
      };

      // Get voices initially and set up a listener for when they change
      updateVoices();
      synthRef.current.onvoiceschanged = updateVoices;

      // Cleanup on component unmount
      return () => {
        if (synthRef.current) {
          synthRef.current.onvoiceschanged = null;
        }
      };
    }
  }, []);

  return {
    speak,
    isSpeaking,
    voices,
  };
};

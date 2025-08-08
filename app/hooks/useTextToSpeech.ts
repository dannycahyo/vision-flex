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
  // Use a ref to hold a stable reference to the synthesis object
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Effect to initialize speech synthesis and get voices
  useEffect(() => {
    // Ensure this runs only on the client
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

  const speak = useCallback(
    ({ text, voiceName, rate = 1.2, pitch = 1 }: SpeakParams) => {
      const synth = synthRef.current;
      if (!synth || !text) {
        return; // Speech synthesis not supported or no text provided
      }

      // Prevent spamming new speech requests if one is already active
      if (synth.speaking) {
        console.warn('Speech synthesis is already active.');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Find and set the selected voice
      const selectedVoice = voices.find(
        (voice) => voice.name === voiceName,
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.pitch = pitch;
      utterance.rate = rate; // A slightly faster rate often sounds more natural for feedback

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

  return {
    speak,
    isSpeaking,
    voices,
  };
};

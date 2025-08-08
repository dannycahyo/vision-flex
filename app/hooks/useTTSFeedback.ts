import { useCallback, useRef, useEffect } from 'react';
import type { FormFeedback } from '~/types/exercise';

interface UseTTSFeedbackOptions {
  enabled?: boolean;
  rate?: number; // Speech rate (0.1 to 10)
  pitch?: number; // Speech pitch (0 to 2)
  volume?: number; // Speech volume (0 to 1)
  voice?: string; // Preferred voice name
  announceReps?: boolean; // Whether to announce rep counts
  announceFormFeedback?: boolean; // Whether to announce form feedback
}

interface UseTTSFeedbackReturn {
  speak: (text: string) => void;
  speakFeedback: (feedback: FormFeedback) => void;
  announceRep: (repCount: number, exerciseName: string) => void; // New method for rep announcements
  isSpeaking: boolean;
  stopSpeaking: () => void;
  isSupported: boolean;
}

export function useTTSFeedback(
  options: UseTTSFeedbackOptions = {},
): UseTTSFeedbackReturn {
  const {
    enabled = true,
    rate = 1,
    pitch = 1,
    volume = 1,
    voice,
    announceReps = true,
    announceFormFeedback = true,
  } = options;

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(
    null,
  );
  const isSpeakingRef = useRef(false);
  const lastSpokenFeedbackRef = useRef<string | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const isSupported = synthRef.current !== null;

  const stopSpeaking = useCallback(() => {
    if (synthRef.current && isSpeakingRef.current) {
      synthRef.current.cancel();
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !synthRef.current || !text.trim()) {
        return;
      }

      // Stop any current speech
      stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Set preferred voice if specified
      if (voice) {
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find((v) =>
          v.name.includes(voice),
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        isSpeakingRef.current = true;
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
        console.error('Speech synthesis error occurred');
      };

      currentUtteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    [enabled, rate, pitch, volume, voice, stopSpeaking],
  );

  const speakFeedback = useCallback(
    (feedback: FormFeedback) => {
      if (
        !enabled ||
        !announceFormFeedback ||
        !feedback.message.trim()
      ) {
        return;
      }

      // Prevent repeating the same feedback message
      if (lastSpokenFeedbackRef.current === feedback.message) {
        return;
      }

      // Only speak if not currently speaking or if the new feedback has higher priority
      if (isSpeakingRef.current && currentUtteranceRef.current) {
        // Check priority levels
        const currentPriority = getPriorityLevel(feedback.priority);
        // If new feedback is not higher priority, don't interrupt
        if (currentPriority <= 2) {
          // Only interrupt for important/critical feedback
          return;
        }
      }

      lastSpokenFeedbackRef.current = feedback.message;
      speak(feedback.message);
    },
    [enabled, announceFormFeedback, speak],
  );

  const announceRep = useCallback(
    (repCount: number, exerciseName: string) => {
      if (!enabled || !announceReps) {
        return;
      }

      // Create rep announcement message
      let message: string;
      if (repCount === 1) {
        message = `1 rep!`;
      } else if (repCount % 5 === 0) {
        // Special announcement for multiples of 5
        message = `${repCount} reps! Great job!`;
      } else {
        message = `${repCount}`;
      }

      // Rep announcements have high priority but don't interrupt critical safety feedback
      if (isSpeakingRef.current && currentUtteranceRef.current) {
        // Only announce if not speaking critical feedback
        // We'll check if the current speech is likely a safety message (longer text)
        if (
          lastSpokenFeedbackRef.current &&
          lastSpokenFeedbackRef.current.length > 30
        ) {
          return; // Don't interrupt longer safety messages
        }
      }

      speak(message);
    },
    [enabled, announceReps, speak],
  );

  return {
    speak,
    speakFeedback,
    announceRep,
    isSpeaking: isSpeakingRef.current,
    stopSpeaking,
    isSupported,
  };
}

function getPriorityLevel(priority: string): number {
  switch (priority) {
    case 'critical':
      return 4;
    case 'important':
      return 3;
    case 'helpful':
      return 2;
    case 'encouragement':
      return 1;
    default:
      return 0;
  }
}

/**
 * Hook that combines rep counting with TTS feedback
 */
export function useRepCountingWithTTS(
  repCountingHook: any, // The return value from useRepCounting
  ttsOptions: UseTTSFeedbackOptions = {},
) {
  const tts = useTTSFeedback(ttsOptions);
  const lastFeedbackRef = useRef<string | null>(null);

  // Create a new rep counting hook with rep announcement callback
  const enhancedRepCounting = useCallback(() => {
    // We need to recreate the rep counting hook with the announceRep callback
    // This will be handled in the workout component
    return repCountingHook;
  }, [repCountingHook]);

  // Monitor feedback changes and speak when stable
  useEffect(() => {
    const currentFeedback = repCountingHook.getCurrentFeedback();

    if (
      currentFeedback &&
      repCountingHook.isFeedbackStable() &&
      currentFeedback.message !== lastFeedbackRef.current &&
      ttsOptions.announceFormFeedback !== false // Only speak if form feedback is enabled
    ) {
      tts.speakFeedback(currentFeedback);
      lastFeedbackRef.current = currentFeedback.message;
    }
  }, [repCountingHook, tts, ttsOptions.announceFormFeedback]);

  return {
    ...repCountingHook,
    tts,
  };
}

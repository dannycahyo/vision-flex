import { useRef, useCallback, useEffect } from 'react';
import type { TextToSpeechHook } from '~/types/speech';

interface SpeechQueueItem {
  text: string;
  priority: number;
  rate?: number;
}

export function useSpeechQueue(
  isAudioEnabled: boolean,
  isWorkoutActive: boolean,
  speak: TextToSpeechHook['speak'],
  isSpeaking: boolean,
  repCount: number,
  getFormFeedback: () => string | null,
) {
  const speechQueueRef = useRef<SpeechQueueItem[]>([]);
  const processingQueueRef = useRef(false);
  const prevRepCountRef = useRef(repCount);
  const prevFeedbackRef = useRef<string | null>(null);

  const processSpeechQueue = useCallback(() => {
    if (
      !isAudioEnabled ||
      speechQueueRef.current.length === 0 ||
      processingQueueRef.current ||
      isSpeaking
    ) {
      return;
    }

    processingQueueRef.current = true;

    // Sort by priority (higher number = higher priority)
    speechQueueRef.current.sort((a, b) => b.priority - a.priority);
    const nextSpeech = speechQueueRef.current.shift();

    if (nextSpeech) {
      speak({
        text: nextSpeech.text,
        rate: nextSpeech.rate || 1,
      });

      // Check queue again after speech completes
      const checkQueueAgain = () => {
        processingQueueRef.current = false;
        if (speechQueueRef.current.length > 0 && !isSpeaking) {
          setTimeout(() => {
            processSpeechQueue();
          }, 800);
        }
      };

      setTimeout(checkQueueAgain, 100);
    } else {
      processingQueueRef.current = false;
    }
  }, [speak, isAudioEnabled, isSpeaking]);

  const queueSpeech = useCallback(
    (text: string, priority: number, rate?: number) => {
      if (!text) return;

      speechQueueRef.current.push({ text, priority, rate });

      if (!processingQueueRef.current && !isSpeaking) {
        processSpeechQueue();
      }
    },
    [processSpeechQueue, isSpeaking],
  );

  // Handle workout feedback announcements
  useEffect(() => {
    if (!isWorkoutActive || !isAudioEnabled) return;

    if (repCount > prevRepCountRef.current) {
      queueSpeech(`${repCount}`, 10);
    }
    prevRepCountRef.current = repCount;

    const currentFeedback = getFormFeedback();
    if (
      currentFeedback &&
      currentFeedback !== prevFeedbackRef.current
    ) {
      queueSpeech(currentFeedback, 5, 1);
    }
    prevFeedbackRef.current = currentFeedback;
  }, [
    repCount,
    getFormFeedback,
    isWorkoutActive,
    isAudioEnabled,
    queueSpeech,
  ]);

  const resetSpeechQueue = useCallback(() => {
    speechQueueRef.current = [];
    prevRepCountRef.current = 0;
    prevFeedbackRef.current = null;
  }, []);

  return {
    queueSpeech,
    resetSpeechQueue,
  };
}

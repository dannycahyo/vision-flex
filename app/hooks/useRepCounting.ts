import { useState, useCallback, useRef } from 'react';
import type {
  Pose,
  RepCounterState,
  Exercise,
  EnhancedRepCounterState,
  FormFeedback,
} from '~/types/exercise';
import {
  processSquatRep,
  processBicepCurlRep,
} from '~/utils/poseAnalysis';
import { shouldExpireFeedback } from '~/utils/feedbackManager';

interface UseRepCountingReturn {
  repState: RepCounterState;
  processFrame: (poses: Pose[]) => void;
  resetCounter: () => void;
  getFormFeedback: () => string | null;
  getCurrentFeedback: () => FormFeedback | null; // New method for enhanced feedback
  isFeedbackStable: () => boolean; // Method to check if feedback is stable for TTS
}

interface UseRepCountingOptions {
  enableEnhancedFeedback?: boolean;
  minFeedbackStability?: number; // minimum time feedback should be stable before TTS
  onRepCompleted?: (repCount: number, exerciseName: string) => void; // Callback for rep completion
}

export function useRepCounting(
  exercise: Exercise,
  options: UseRepCountingOptions = {},
): UseRepCountingReturn {
  const {
    enableEnhancedFeedback = true,
    minFeedbackStability = 1000,
    onRepCompleted,
  } = options;

  const [repState, setRepState] = useState<RepCounterState>({
    currentState: exercise.initialState,
    repCount: 0,
    lastStateChange: Date.now(),
    formFeedback: null,
  });

  // Enhanced state for tracking feedback history and stability
  const enhancedStateRef = useRef<EnhancedRepCounterState>({
    ...repState,
    activeFeedback: null,
    feedbackHistory: [],
    lastFeedbackChange: Date.now(),
  });

  const processFrame = useCallback(
    (poses: Pose[]) => {
      if (poses.length === 0) return;
      const pose = poses[0];

      setRepState((currentRepState) => {
        let nextState: RepCounterState;

        // Process based on exercise type
        switch (exercise.id) {
          case 'squats':
            nextState = processSquatRep(pose, currentRepState);
            break;
          case 'bicep-curls':
            nextState = processBicepCurlRep(pose, currentRepState);
            break;
          default:
            return currentRepState;
        }

        // Update enhanced state reference
        if (enableEnhancedFeedback) {
          enhancedStateRef.current = {
            ...nextState,
            activeFeedback: nextState.formFeedback
              ? {
                  message: nextState.formFeedback,
                  priority: 'helpful',
                  timestamp: Date.now(),
                }
              : null,
            feedbackHistory: enhancedStateRef.current.feedbackHistory,
            lastFeedbackChange:
              nextState.formFeedback !== currentRepState.formFeedback
                ? Date.now()
                : enhancedStateRef.current.lastFeedbackChange,
          };
        }

        if (nextState.currentState !== currentRepState.currentState) {
          console.log('New rep state:', nextState);
        }

        // Check if rep count increased and trigger callback
        if (
          nextState.repCount > currentRepState.repCount &&
          onRepCompleted
        ) {
          onRepCompleted(nextState.repCount, exercise.name);
        }

        return nextState;
      });
    },
    [exercise.id, enableEnhancedFeedback],
  );

  const getFormFeedback = useCallback(() => {
    // Check if feedback should expire
    if (
      enableEnhancedFeedback &&
      enhancedStateRef.current.activeFeedback
    ) {
      if (
        shouldExpireFeedback(enhancedStateRef.current.activeFeedback)
      ) {
        return null;
      }
    }
    return repState.formFeedback;
  }, [repState.formFeedback, enableEnhancedFeedback]);

  const getCurrentFeedback = useCallback((): FormFeedback | null => {
    if (!enableEnhancedFeedback) return null;

    const feedback = enhancedStateRef.current.activeFeedback;
    if (feedback && shouldExpireFeedback(feedback)) {
      return null;
    }
    return feedback;
  }, [enableEnhancedFeedback]);

  const isFeedbackStable = useCallback((): boolean => {
    if (
      !enableEnhancedFeedback ||
      !enhancedStateRef.current.activeFeedback
    ) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastChange =
      now - enhancedStateRef.current.lastFeedbackChange;

    return timeSinceLastChange >= minFeedbackStability;
  }, [enableEnhancedFeedback, minFeedbackStability]);

  const resetCounter = useCallback(() => {
    const resetState = {
      currentState: exercise.initialState,
      repCount: 0,
      lastStateChange: Date.now(),
      formFeedback: null,
    };

    setRepState(resetState);

    if (enableEnhancedFeedback) {
      enhancedStateRef.current = {
        ...resetState,
        activeFeedback: null,
        feedbackHistory: [],
        lastFeedbackChange: Date.now(),
      };
    }
  }, [exercise.initialState, enableEnhancedFeedback]);

  return {
    repState,
    processFrame,
    resetCounter,
    getFormFeedback,
    getCurrentFeedback,
    isFeedbackStable,
  };
}

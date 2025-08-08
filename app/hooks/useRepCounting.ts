import { useState, useCallback } from 'react';
import type {
  Pose,
  RepCounterState,
  Exercise,
} from '~/types/exercise';
import { processBicepCurlRep } from '~/utils/poseAnalysis/processBicepCurlRep';
import { processSquatRep } from '~/utils/poseAnalysis/processSquatRep';

interface UseRepCountingReturn {
  repState: RepCounterState;
  processFrame: (poses: Pose[]) => void;
  resetCounter: () => void;
  getFormFeedback: () => string | null;
}

export function useRepCounting(
  exercise: Exercise,
): UseRepCountingReturn {
  const [repState, setRepState] = useState<RepCounterState>({
    currentState: exercise.initialState,
    repCount: 0,
    lastStateChange: Date.now(),
    formFeedback: null,
  });

  const processFrame = useCallback(
    (poses: Pose[]) => {
      if (poses.length === 0) return;
      const pose = poses[0];

      setRepState((currentRepState) => {
        let nextState: RepCounterState;

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

        if (nextState.currentState !== currentRepState.currentState) {
          console.log('New rep state:', nextState);
        }

        return nextState;
      });
    },
    [exercise.id],
  );

  const getFormFeedback = useCallback(() => {
    return repState.formFeedback;
  }, [repState.formFeedback]);

  const resetCounter = useCallback(() => {
    setRepState({
      currentState: exercise.initialState,
      repCount: 0,
      lastStateChange: Date.now(),
      formFeedback: null,
    });
  }, [exercise.id]);

  return {
    repState,
    processFrame,
    resetCounter,
    getFormFeedback,
  };
}

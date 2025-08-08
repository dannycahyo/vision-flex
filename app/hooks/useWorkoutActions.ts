import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import type { Exercise } from '~/types/exercise';

interface UseWorkoutActionsProps {
  exercise: Exercise;
  stream: MediaStream | null;
  hasPermission: boolean;
  ensureStream: () => Promise<boolean>;
  loadModel: () => Promise<void>;
  modelError: string | null;
  startLoop: (callback: () => void) => void;
  stopLoop: () => void;
  processPoseData: () => Promise<void>;
  resetWorkoutState: () => void;
  setMessage: (message: string) => void;
  startWorkout: () => void;
  finishLoading: () => void;
  stopStream: () => void;
  reset: () => void;
  start: () => void;
  pause: () => void;
  seconds: number;
  repCount: number;
}

export function useWorkoutActions({
  exercise,
  stream,
  hasPermission,
  ensureStream,
  loadModel,
  modelError,
  startLoop,
  stopLoop,
  processPoseData,
  resetWorkoutState,
  setMessage,
  startWorkout: startWorkoutState,
  finishLoading,
  stopStream,
  reset,
  start,
  pause,
  seconds,
  repCount,
}: UseWorkoutActionsProps) {
  const navigate = useNavigate();

  const startWorkout = useCallback(async () => {
    if (!hasPermission) {
      const streamRestored = await ensureStream();
      if (!streamRestored) {
        setMessage('Camera permission required to start workout');
        console.log('Requesting camera permission...');
        return;
      }
    }

    try {
      await loadModel();

      if (modelError) {
        throw new Error(modelError);
      }

      if (!stream) {
        const streamRestored = await ensureStream();
        if (!streamRestored) {
          throw new Error(
            'Camera stream lost during AI model loading',
          );
        }
      }

      resetWorkoutState();
      startLoop(processPoseData);
      startWorkoutState();
      start();
    } catch (error) {
      console.error('Error starting workout:', error);
      setMessage(
        `Failed to load AI model: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      );
    } finally {
      finishLoading();
    }
  }, [
    hasPermission,
    ensureStream,
    loadModel,
    modelError,
    stream,
    resetWorkoutState,
    startLoop,
    processPoseData,
    startWorkoutState,
    start,
    setMessage,
    finishLoading,
  ]);

  const pauseWorkout = useCallback(() => {
    stopLoop();
    pause();
  }, [stopLoop, pause]);

  const resumeWorkout = useCallback(async () => {
    if (!stream) {
      const streamRestored = await ensureStream();
      if (!streamRestored) {
        setMessage('Camera permission required to resume workout');
        return;
      }
    }

    startLoop(processPoseData);
    start();
  }, [
    stream,
    ensureStream,
    startLoop,
    processPoseData,
    start,
    setMessage,
  ]);

  const endWorkout = useCallback(() => {
    const endTime = new Date();
    stopLoop();
    stopStream();
    reset();

    navigate('/summary', {
      state: {
        workoutData: {
          exercise,
          reps: repCount,
          duration: seconds,
          startTime: new Date(Date.now() - seconds * 1000),
          endTime,
        },
      },
    });
  }, [
    exercise,
    repCount,
    seconds,
    stopLoop,
    stopStream,
    reset,
    navigate,
  ]);

  return {
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    endWorkout,
  };
}

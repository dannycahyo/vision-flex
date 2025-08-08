import { useReducer, useCallback } from 'react';

type WorkoutState = {
  isWorkoutActive: boolean;
  isAILoading: boolean;
  currentMessage: string;
  disableStreamCleanup: boolean;
};

type WorkoutAction =
  | { type: 'START_LOADING' }
  | { type: 'FINISH_LOADING' }
  | { type: 'START_WORKOUT' }
  | { type: 'PAUSE_WORKOUT' }
  | { type: 'RESUME_WORKOUT' }
  | { type: 'SET_MESSAGE'; message: string }
  | { type: 'SET_STREAM_CLEANUP'; disable: boolean };

const initialWorkoutState: WorkoutState = {
  isWorkoutActive: false,
  isAILoading: false,
  currentMessage: 'Get ready to start!',
  disableStreamCleanup: false,
};

function workoutReducer(
  state: WorkoutState,
  action: WorkoutAction,
): WorkoutState {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...state,
        isAILoading: true,
        currentMessage: 'Loading AI model...',
      };
    case 'FINISH_LOADING':
      return {
        ...state,
        isAILoading: false,
      };
    case 'START_WORKOUT':
      return {
        ...state,
        isWorkoutActive: true,
        currentMessage:
          'Start exercising! Stand in front of the camera.',
      };
    case 'PAUSE_WORKOUT':
      return {
        ...state,
        isWorkoutActive: false,
        currentMessage: 'Workout paused',
      };
    case 'RESUME_WORKOUT':
      return {
        ...state,
        isWorkoutActive: true,
        currentMessage: 'Workout resumed - keep going!',
      };
    case 'SET_MESSAGE':
      return {
        ...state,
        currentMessage: action.message,
      };
    case 'SET_STREAM_CLEANUP':
      return {
        ...state,
        disableStreamCleanup: action.disable,
      };
    default:
      return state;
  }
}

export function useWorkoutState() {
  const [state, dispatch] = useReducer(
    workoutReducer,
    initialWorkoutState,
  );

  const setMessage = useCallback((message: string) => {
    dispatch({ type: 'SET_MESSAGE', message });
  }, []);

  const startLoading = useCallback(() => {
    dispatch({ type: 'START_LOADING' });
  }, []);

  const finishLoading = useCallback(() => {
    dispatch({ type: 'FINISH_LOADING' });
  }, []);

  const startWorkout = useCallback(() => {
    dispatch({ type: 'START_WORKOUT' });
  }, []);

  const pauseWorkout = useCallback(() => {
    dispatch({ type: 'PAUSE_WORKOUT' });
  }, []);

  const resumeWorkout = useCallback(() => {
    dispatch({ type: 'RESUME_WORKOUT' });
  }, []);

  const setStreamCleanup = useCallback((disable: boolean) => {
    dispatch({ type: 'SET_STREAM_CLEANUP', disable });
  }, []);

  return {
    ...state,
    setMessage,
    startLoading,
    finishLoading,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    setStreamCleanup,
  };
}

import { Button } from './Button';
import type { Exercise } from '~/types/exercise';

interface WorkoutControlPanelProps {
  exercise: Exercise;
  currentMessage: string;
  isWorkoutActive: boolean;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (enabled: boolean) => void;
  isPoseModelLoading: boolean;
  isAILoading: boolean;
  isLoading: boolean;
  hasPermission: boolean;
  modelError: string | null;
  repCount: number;
  seconds: number;
  formatTime: (seconds: number) => string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

export function WorkoutControlPanel({
  exercise,
  currentMessage,
  isWorkoutActive,
  isAudioEnabled,
  setIsAudioEnabled,
  isPoseModelLoading,
  isAILoading,
  isLoading,
  hasPermission,
  modelError,
  repCount,
  seconds,
  formatTime,
  onStart,
  onPause,
  onResume,
  onEnd,
}: WorkoutControlPanelProps) {
  return (
    <div className="lg:w-80 bg-gray-800 text-white flex flex-col max-h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Audio Settings */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Audio Feedback
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Voice Feedback</span>
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`${
                  isAudioEnabled ? 'bg-blue-500' : 'bg-gray-600'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
              >
                <span
                  className={`${
                    isAudioEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {repCount}
            </div>
            <div className="text-sm text-gray-300">Reps</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {formatTime(seconds)}
            </div>
            <div className="text-sm text-gray-300">Time</div>
          </div>
        </div>

        {/* Status Message */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2">Status</h3>
          <p className="text-blue-400">{currentMessage}</p>
        </div>

        {/* Model Error */}
        {modelError && (
          <div className="bg-red-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">AI Error</h3>
            <p className="text-red-200 text-sm">{modelError}</p>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3 mb-6">
          {!isWorkoutActive && seconds === 0 ? (
            <Button
              onClick={onStart}
              disabled={
                !hasPermission ||
                isLoading ||
                isAILoading ||
                isPoseModelLoading ||
                !!modelError
              }
              className="w-full"
            >
              {isAILoading || isPoseModelLoading
                ? 'Loading AI...'
                : modelError
                  ? 'AI Error - Check Settings'
                  : 'Start Workout'}
            </Button>
          ) : isWorkoutActive ? (
            <Button onClick={onPause} className="w-full">
              Pause
            </Button>
          ) : (
            <Button onClick={onResume} className="w-full">
              Resume
            </Button>
          )}

          {seconds > 0 && (
            <Button
              onClick={onEnd}
              variant="secondary"
              className="w-full"
            >
              End Workout
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Instructions</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            {exercise.instructions?.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

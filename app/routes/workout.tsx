import type { Route } from './+types/workout';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '~/components/Button';
import { useWebcam } from '~/hooks/useWebcam';
import { usePoseDetection } from '~/hooks/usePoseDetection';
import { useRepCounting } from '~/hooks/useRepCounting';
import { useAnimationLoop } from '~/hooks/useAnimationLoop';
import { useTextToSpeech } from '~/hooks/useTextToSpeech';
import { useTimer } from '~/hooks/useTimer';
import { getExerciseById } from '~/constants/exercises';
import { useWorkoutState } from '~/hooks/useWorkoutState';
import { useWorkoutCanvas } from '~/hooks/useWorkoutCanvas';
import { useSpeechQueue } from '~/hooks/useSpeechQueue';
import { useWorkoutActions } from '~/hooks/useWorkoutActions';
import { WorkoutVideo } from '~/components/WorkoutVideo';
import { WorkoutControlPanel } from '~/components/WorkoutControlPanel';
import { drawPose } from '~/utils/canvasUtils';

export function meta({ params }: Route.MetaArgs) {
  const exercise = getExerciseById(params.exercise);
  return [
    { title: `VisionFlex - ${exercise?.name || 'Workout'}` },
    {
      name: 'description',
      content: `AI-guided ${exercise?.name || 'workout'} session`,
    },
  ];
}

export default function Workout({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { exercise: exerciseId } = params;
  const exercise = getExerciseById(exerciseId);

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Core hooks
  const webcam = useWebcam();
  const poseDetection = usePoseDetection();
  const speech = useTextToSpeech();
  const timer = useTimer();
  const animation = useAnimationLoop();

  // Workout state management
  const workoutState = useWorkoutState();

  // Exercise specific hooks
  const repCounting = useRepCounting(exercise!);
  const canvas = useWorkoutCanvas(
    webcam.hasPermission,
    webcam.stream,
  );
  const speechQueue = useSpeechQueue(
    isAudioEnabled,
    workoutState.isWorkoutActive,
    speech.speak,
    speech.isSpeaking,
    repCounting.repState.repCount,
    repCounting.getFormFeedback,
  );

  // Pose processing function
  const processPoseData = async () => {
    if (!webcam.videoRef.current || !canvas.canvasRef.current) return;

    try {
      if (!webcam.videoRef.current.srcObject && webcam.stream) {
        webcam.videoRef.current.srcObject = webcam.stream;
      }

      const poses = await poseDetection.detectPose(
        webcam.videoRef.current,
      );
      const ctx = canvas.canvasRef.current.getContext('2d');

      if (!ctx) return;

      ctx.clearRect(
        0,
        0,
        canvas.canvasRef.current.width,
        canvas.canvasRef.current.height,
      );

      if (poses.length > 0) {
        const pose = poses[0];
        repCounting.processFrame(poses);

        if (workoutState.isWorkoutActive) {
          const feedback = repCounting.getFormFeedback();
          workoutState.setMessage(
            feedback ||
              `Keep going! Reps: ${repCounting.repState.repCount}`,
          );
        }

        if (
          !canvas.canvasResizedRef.current &&
          webcam.videoRef.current
        ) {
          drawPose(
            ctx,
            pose,
            canvas.canvasRef.current.width,
            canvas.canvasRef.current.height,
          );
        }
      } else if (workoutState.isWorkoutActive) {
        workoutState.setMessage('Step into view of the camera');
      }
    } catch (error) {
      console.error('Error processing pose:', error);
      if (workoutState.isWorkoutActive) {
        workoutState.setMessage(
          'AI processing error - please continue',
        );
      }
    }
  };

  // Reset workout state helper
  const resetWorkoutState = () => {
    repCounting.resetCounter();
    speechQueue.resetSpeechQueue();
  };

  // Workout action handlers
  const workoutActions = useWorkoutActions({
    exercise: exercise!,
    stream: webcam.stream,
    hasPermission: webcam.hasPermission,
    ensureStream: webcam.ensureStream,
    loadModel: poseDetection.loadModel,
    modelError: poseDetection.modelError,
    startLoop: animation.startLoop,
    stopLoop: animation.stopLoop,
    processPoseData,
    resetWorkoutState,
    setMessage: workoutState.setMessage,
    startWorkout: workoutState.startWorkout,
    finishLoading: workoutState.finishLoading,
    stopStream: webcam.stopStream,
    reset: timer.reset,
    start: timer.start,
    pause: timer.pause,
    seconds: timer.seconds,
    repCount: repCounting.repState.repCount,
  });

  // Cleanup effect
  useEffect(() => {
    if (!exercise) {
      navigate('/');
      return;
    }

    return () => {
      if (!workoutState.disableStreamCleanup) {
        webcam.stopStream();
      }
    };
  }, [
    exercise,
    navigate,
    workoutState.disableStreamCleanup,
    webcam.stopStream,
  ]);

  if (!exercise) return null;

  if (webcam.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Camera Access Required
          </h2>
          <p className="text-gray-600 mb-4">{webcam.error}</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{exercise.name}</h1>
            <p className="text-gray-300">AI-Guided Workout</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="text-gray-900"
          >
            Exit Workout
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        <WorkoutVideo
          videoRef={webcam.videoRef}
          canvasRef={canvas.canvasRef}
          stream={webcam.stream}
          isLoading={webcam.isLoading}
          isAILoading={workoutState.isAILoading}
          isPoseModelLoading={poseDetection.isModelLoading}
          isWorkoutActive={workoutState.isWorkoutActive}
          repCount={repCounting.repState.repCount}
          requestPermission={webcam.requestPermission}
        />

        <WorkoutControlPanel
          exercise={exercise}
          currentMessage={workoutState.currentMessage}
          isWorkoutActive={workoutState.isWorkoutActive}
          isAudioEnabled={isAudioEnabled}
          setIsAudioEnabled={setIsAudioEnabled}
          isPoseModelLoading={poseDetection.isModelLoading}
          isAILoading={workoutState.isAILoading}
          isLoading={webcam.isLoading}
          hasPermission={webcam.hasPermission}
          modelError={poseDetection.modelError}
          repCount={repCounting.repState.repCount}
          seconds={timer.seconds}
          formatTime={timer.formatTime}
          onStart={workoutActions.startWorkout}
          onPause={workoutActions.pauseWorkout}
          onResume={workoutActions.resumeWorkout}
          onEnd={workoutActions.endWorkout}
        />
      </div>
    </div>
  );
}

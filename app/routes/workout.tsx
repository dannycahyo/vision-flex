import type { Route } from './+types/workout';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '~/components/Button';
import { LoadingSpinner } from '~/components/LoadingSpinner';
import { useWebcam } from '~/hooks/useWebcam';
import { useTimer } from '~/hooks/useTimer';
import { usePoseDetection } from '~/hooks/usePoseDetection';
import { useRepCounting } from '~/hooks/useRepCounting';
import {
  useRepCountingWithTTS,
  useTTSFeedback,
} from '~/hooks/useTTSFeedback';
import { useAnimationLoop } from '~/hooks/useAnimationLoop';
import { getExerciseById } from '~/constants/exercises';
import { drawPose, resizeCanvas } from '~/utils/canvasUtils';
import type { WorkoutSession } from '~/types/exercise';

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

// Helper function to get priority color
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'text-red-400';
    case 'important':
      return 'text-orange-400';
    case 'helpful':
      return 'text-blue-400';
    case 'encouragement':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
};

export default function Workout({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { exercise: exerciseId } = params;
  const exercise = getExerciseById(exerciseId);

  const {
    videoRef,
    stream,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    stopStream,
    ensureStream,
  } = useWebcam();

  const {
    isModelLoading: isPoseModelLoading,
    modelError,
    detectPose,
    loadModel,
  } = usePoseDetection();

  // State declarations
  const [currentMessage, setCurrentMessage] = useState(
    'Get ready to start!',
  );
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [ttsEnabled, setTTSEnabled] = useState(true); // TTS control state
  const [repAnnouncementsEnabled, setRepAnnouncementsEnabled] =
    useState(true); // Rep announcements control
  const [formFeedbackEnabled, setFormFeedbackEnabled] =
    useState(true); // Form feedback control

  // Create TTS instance first
  const tts = useTTSFeedback({
    enabled: ttsEnabled,
    rate: 1,
    volume: 1,
    pitch: 1,
    voice: 'en',
    announceReps: repAnnouncementsEnabled,
    announceFormFeedback: formFeedbackEnabled,
  });

  // Enhanced rep counting with TTS
  const baseRepCountingHook = useRepCounting(exercise!, {
    enableEnhancedFeedback: true,
    minFeedbackStability: 1500, // 1.5 seconds before TTS kicks in
    onRepCompleted: (repCount: number, exerciseName: string) => {
      // Announce rep completion
      if (ttsEnabled && repAnnouncementsEnabled) {
        tts.announceRep(repCount, exerciseName);
      }
    },
  });

  const repCountingWithTTS = useRepCountingWithTTS(
    baseRepCountingHook,
    {
      enabled: ttsEnabled, // Controlled by user preference
      rate: 1,
      volume: 1,
      pitch: 1,
      voice: 'en',
      announceReps: repAnnouncementsEnabled,
      announceFormFeedback: formFeedbackEnabled,
    },
  );

  const { startLoop, stopLoop } = useAnimationLoop();

  // Animation loop for pose detection and rep counting
  const processPoseData = async () => {
    if (videoRef.current && canvasRef.current) {
      try {
        // Log video element status for debugging
        if (!videoRef.current.srcObject) {
          console.log('Video has no srcObject during pose detection');
          if (stream) {
            console.log('Reconnecting stream to video');
            videoRef.current.srcObject = stream;
          }
        }

        const poses = await detectPose(videoRef.current);

        // Clear canvas first to ensure we don't leave artifacts
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height,
          );
        }

        if (poses.length > 0) {
          console.log(
            `Detected ${poses.length} poses, processing first one`,
          );
          const pose = poses[0];

          // Process the pose for rep counting (this will handle feedback internally)
          repCountingWithTTS.processFrame(poses);

          // Update message based on pose detection
          if (isWorkoutActive) {
            const feedback = repCountingWithTTS.getFormFeedback();
            if (feedback) {
              setCurrentMessage(feedback);
            } else {
              setCurrentMessage(
                `Keep going! Reps: ${repCountingWithTTS.repState.repCount}`,
              );
            }
          }

          // Draw pose visualization on canvas
          if (ctx) {
            // Ensure canvas matches video dimensions (only resize once)
            if (!canvasResizedRef.current && videoRef.current) {
              resizeCanvas(canvasRef.current, videoRef.current);
              canvasResizedRef.current = true;
            }

            // Draw the pose skeleton and keypoints
            drawPose(
              ctx,
              pose,
              canvasRef.current.width,
              canvasRef.current.height,
            );
          }
        } else {
          // Clear canvas if no pose detected
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height,
            );
          }

          // Update message for no pose detection
          if (isWorkoutActive) {
            setCurrentMessage('Step into view of the camera');
          }
        }
      } catch (error) {
        console.error('Error processing pose:', error);
        if (isWorkoutActive) {
          setCurrentMessage('AI processing error - please continue');
        }
      }
    }
  };

  const { seconds, isRunning, start, pause, reset, formatTime } =
    useTimer();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<Date | null>(null);
  const canvasResizedRef = useRef<boolean>(false);

  // Add this near the top of your component
  const [disableStreamCleanup, setDisableStreamCleanup] =
    useState(false);

  useEffect(() => {
    if (!exercise) {
      navigate('/');
      return;
    }

    return () => {
      console.log(
        'Workout component cleanup - disableCleanup:',
        disableStreamCleanup,
      );
      if (!disableStreamCleanup) {
        stopStream();
      }
    };
  }, [exercise, navigate, disableStreamCleanup]); // Remove stopStream from dependencies

  // Add debug logging to track when stopStream is called
  const debugStopStream = () => {
    console.log('Explicitly calling stopStream');
    stopStream();
  };

  const endWorkout = () => {
    const endTime = new Date();

    // Stop pose detection and animation loop
    stopLoop();

    // Use the debug version to track calls
    debugStopStream();
    reset();

    const workoutData: WorkoutSession = {
      exercise: exercise!,
      reps: repCountingWithTTS.repState.repCount,
      duration: seconds,
      startTime: startTimeRef.current || endTime,
      endTime,
    };

    navigate('/summary', { state: { workoutData } });
  };

  // Request camera permission on initial load
  useEffect(() => {
    if (!hasPermission && !isLoading && !error) {
      requestPermission();
    }
  }, []); // Only run once on mount

  // Resize canvas when video dimensions change
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const handleLoadedMetadata = () => {
        resizeCanvas(canvas, video);
        canvasResizedRef.current = true;
      };

      const handleResize = () => {
        resizeCanvas(canvas, video);
        canvasResizedRef.current = true;
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      window.addEventListener('resize', handleResize);

      return () => {
        video.removeEventListener(
          'loadedmetadata',
          handleLoadedMetadata,
        );
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [hasPermission, stream]);

  // Reset canvas resize flag when stream changes
  useEffect(() => {
    canvasResizedRef.current = false;
  }, [stream]);

  const startWorkout = async () => {
    // Temporarily disable stream cleanup to prevent issues
    setDisableStreamCleanup(true);

    // Try to ensure we have an active stream if permission was previously granted
    if (!hasPermission) {
      const streamRestored = await ensureStream();

      if (!streamRestored) {
        setCurrentMessage(
          'Camera permission required to start workout',
        );
        console.log('Requesting camera permission...');
        return;
      }
    }

    setIsAILoading(true);
    setCurrentMessage('Loading AI model...');

    try {
      // Load the pose detection model
      await loadModel();

      // Check if model loaded successfully
      if (modelError) {
        throw new Error(modelError);
      }

      // Verify we still have permission and stream after model loading
      if (!stream) {
        // Try to restore the stream if it was lost during model loading
        const streamRestored = await ensureStream();
        if (!streamRestored) {
          throw new Error(
            'Camera stream lost during AI model loading',
          );
        }
      }

      // Reset the rep counter for new workout
      repCountingWithTTS.resetCounter();

      // Start the animation loop with pose detection
      startLoop(processPoseData);

      setIsAILoading(false);
      setIsWorkoutActive(true);
      setCurrentMessage(
        'Start exercising! Stand in front of the camera.',
      );
      startTimeRef.current = new Date();
      start();
    } catch (error) {
      console.error('Error starting workout:', error);
      setIsAILoading(false);
      setCurrentMessage(
        `Failed to load AI model: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      );
    } finally {
      // Re-enable cleanup after workout is started
      setTimeout(() => setDisableStreamCleanup(false), 1000);
    }
  };

  const pauseWorkout = () => {
    setIsWorkoutActive(false);
    stopLoop(); // Stop pose detection when paused
    pause();
    setCurrentMessage('Workout paused');
  };

  const resumeWorkout = async () => {
    // Ensure we have an active stream before resuming
    if (!stream) {
      const streamRestored = await ensureStream();
      if (!streamRestored) {
        setCurrentMessage(
          'Camera permission required to resume workout',
        );
        return;
      }
    }

    setIsWorkoutActive(true);
    startLoop(processPoseData); // Resume pose detection
    start();
    setCurrentMessage('Workout resumed - keep going!');
  };

  if (!exercise) {
    return null; // Will redirect in useEffect
  }

  if (error) {
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
          <p className="text-gray-600 mb-4">{error}</p>
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
            <p className="text-gray-300">
              AI-Guided Workout with Voice Feedback
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* TTS Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm">Voice:</span>
              <button
                onClick={() => {
                  setTTSEnabled(!ttsEnabled);
                  if (repCountingWithTTS.tts.isSpeaking) {
                    repCountingWithTTS.tts.stopSpeaking();
                  }
                }}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  ttsEnabled && repCountingWithTTS.tts.isSupported
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
                disabled={!repCountingWithTTS.tts.isSupported}
                title={
                  repCountingWithTTS.tts.isSupported
                    ? ttsEnabled
                      ? 'Disable voice feedback'
                      : 'Enable voice feedback'
                    : 'Voice feedback not supported in this browser'
                }
              >
                {ttsEnabled ? '🔊 ON' : '🔇 OFF'}
              </button>

              {/* TTS Mode Controls */}
              {ttsEnabled && repCountingWithTTS.tts.isSupported && (
                <>
                  {/* Form Feedback Toggle */}
                  <button
                    onClick={() =>
                      setFormFeedbackEnabled(!formFeedbackEnabled)
                    }
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      formFeedbackEnabled
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                    title={
                      formFeedbackEnabled
                        ? 'Disable form feedback announcements'
                        : 'Enable form feedback announcements'
                    }
                  >
                    {formFeedbackEnabled ? '📋 Form' : '📋 No Form'}
                  </button>

                  {/* Rep Announcements Toggle */}
                  <button
                    onClick={() =>
                      setRepAnnouncementsEnabled(
                        !repAnnouncementsEnabled,
                      )
                    }
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      repAnnouncementsEnabled
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                    title={
                      repAnnouncementsEnabled
                        ? 'Disable rep count announcements'
                        : 'Enable rep count announcements'
                    }
                  >
                    {repAnnouncementsEnabled
                      ? '🔢 Reps'
                      : '🔢 No Reps'}
                  </button>
                </>
              )}

              {repCountingWithTTS.tts.isSpeaking && (
                <button
                  onClick={repCountingWithTTS.tts.stopSpeaking}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  title="Stop current speech"
                >
                  ⏹ Stop
                </button>
              )}
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
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {isLoading || isAILoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center text-center text-white">
                <LoadingSpinner size="lg" />
                <p className="mt-4">
                  {isAILoading
                    ? 'Loading AI model...'
                    : 'Starting camera...'}
                </p>
                {isPoseModelLoading && (
                  <p className="text-sm text-gray-300 mt-2">
                    This may take a moment on first load
                  </p>
                )}
              </div>
            </div>
          ) : stream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain video-container"
                style={{
                  backgroundColor: 'black',
                  display: 'block',
                  transform: 'scaleX(-1)', // Mirror the video horizontally
                }}
                onLoadedMetadata={() => {
                  console.log('Video metadata loaded');
                  // Ensure video plays when metadata is loaded with proper promise handling
                  if (videoRef.current) {
                    const playPromise = videoRef.current.play();
                    if (playPromise !== undefined) {
                      playPromise
                        .then(() => {
                          console.log('Video playing successfully');
                        })
                        .catch((error) => {
                          console.warn(
                            'Video autoplay failed:',
                            error,
                          );
                          // Don't reset permission, just log the warning
                        });
                    }
                  }
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{
                  backgroundColor: 'transparent',
                  transform: 'scaleX(-1)', // Mirror the canvas to match video
                }}
              />

              {/* AI Status Indicator */}
              {isWorkoutActive && (
                <div className="absolute top-4 left-12 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>AI Active</span>
                    {repCountingWithTTS.tts.isSpeaking && (
                      <>
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-400 text-xs">
                          Speaking
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Rep Count Overlay */}
              {isWorkoutActive && (
                <div className="absolute top-4 right-16 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {repCountingWithTTS.repState.repCount}
                    </div>
                    <div className="text-xs text-gray-300">REPS</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="mb-4">Camera permission is required</p>
                <Button
                  onClick={requestPermission}
                  disabled={isLoading}
                >
                  {isLoading ? 'Requesting...' : 'Grant Permission'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="lg:w-80 bg-gray-800 text-white flex flex-col max-h-[calc(100vh-80px)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {repCountingWithTTS.repState.repCount}
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

            {/* Current Message */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-2">Status</h3>
              <p className="text-blue-400">{currentMessage}</p>
            </div>

            {/* Form Feedback */}
            {isWorkoutActive && (
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">
                    Smart Feedback
                  </h3>
                  {repCountingWithTTS.tts.isSpeaking && (
                    <div className="flex items-center text-green-400 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                      Speaking
                    </div>
                  )}
                </div>

                {(() => {
                  const currentFeedback =
                    repCountingWithTTS.getCurrentFeedback();
                  if (currentFeedback) {
                    const isStable =
                      repCountingWithTTS.isFeedbackStable();
                    const timeRemaining = Math.max(
                      0,
                      (currentFeedback.minDisplayDuration || 0) -
                        (Date.now() - currentFeedback.timestamp),
                    );

                    return (
                      <div className="space-y-2">
                        <p
                          className={`text-sm font-medium ${getPriorityColor(currentFeedback.priority)}`}
                        >
                          {currentFeedback.message}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="capitalize">
                            Priority: {currentFeedback.priority}
                          </span>
                          {isStable ? (
                            <span className="text-green-400">
                              ✓ Stable
                            </span>
                          ) : (
                            <span>
                              Stabilizing... (
                              {Math.ceil(timeRemaining / 1000)}s)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <p className="text-gray-400 text-sm">
                      {repCountingWithTTS.getFormFeedback() ||
                        'Monitoring your form...'}
                    </p>
                  );
                })()}
              </div>
            )}

            {/* TTS Status Panel */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-2">
                Voice Assistant
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span
                    className={
                      repCountingWithTTS.tts.isSupported
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {repCountingWithTTS.tts.isSupported
                      ? 'Available'
                      : 'Not Supported'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Enabled:</span>
                  <span
                    className={
                      ttsEnabled ? 'text-green-400' : 'text-gray-400'
                    }
                  >
                    {ttsEnabled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Speaking:</span>
                  <span
                    className={
                      repCountingWithTTS.tts.isSpeaking
                        ? 'text-blue-400'
                        : 'text-gray-400'
                    }
                  >
                    {repCountingWithTTS.tts.isSpeaking ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Form feedback:</span>
                  <span
                    className={
                      formFeedbackEnabled && ttsEnabled
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }
                  >
                    {formFeedbackEnabled && ttsEnabled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rep announcements:</span>
                  <span
                    className={
                      repAnnouncementsEnabled && ttsEnabled
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }
                  >
                    {repAnnouncementsEnabled && ttsEnabled
                      ? 'Yes'
                      : 'No'}
                  </span>
                </div>
                {!repCountingWithTTS.tts.isSupported && (
                  <p className="text-red-300 text-xs mt-2">
                    Voice feedback requires a modern browser with
                    speech synthesis support.
                  </p>
                )}
              </div>
            </div>

            {/* AI Model Error */}
            {modelError && (
              <div className="bg-red-700 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-2">
                  AI Error
                </h3>
                <p className="text-red-200 text-sm">{modelError}</p>
              </div>
            )}

            {/* Controls */}
            <div className="space-y-3 mb-6">
              {!isWorkoutActive && seconds === 0 ? (
                <Button
                  onClick={startWorkout}
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
                <Button
                  onClick={pauseWorkout}
                  variant="secondary"
                  className="w-full"
                >
                  Pause Workout
                </Button>
              ) : (
                <Button onClick={resumeWorkout} className="w-full">
                  Resume Workout
                </Button>
              )}

              {seconds > 0 && (
                <Button
                  onClick={endWorkout}
                  variant="danger"
                  className="w-full"
                >
                  End Workout
                </Button>
              )}
            </div>

            {/* Exercise Instructions */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">
                Instructions
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                {exercise.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-400 mr-2">
                      {index + 1}.
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

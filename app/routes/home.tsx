import type { Route } from './+types/home';
import { useEffect, useState } from 'react';
import { ExerciseCard } from '~/components/ExerciseCard';
import { LoadingSpinner } from '~/components/LoadingSpinner';
import { Button } from '~/components/Button';
import { EXERCISES } from '~/constants/exercises';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'VisionFlex - Personal Trainer AI' },
    {
      name: 'description',
      content: 'AI-powered personal trainer for home workouts',
    },
  ];
}

export default function Home() {
  const [cameraPermission, setCameraPermission] = useState<
    'granted' | 'denied' | 'prompt' | 'checking'
  >('checking');
  const [isRequestingPermission, setIsRequestingPermission] =
    useState(false);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraPermission('denied');
        return;
      }

      const permission = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });
      setCameraPermission(
        permission.state as 'granted' | 'denied' | 'prompt',
      );
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      setCameraPermission('prompt');
    }
  };

  const requestCameraPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      // Stop the stream immediately, we just wanted to check permission
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission('granted');
    } catch (error) {
      setCameraPermission('denied');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  if (cameraPermission === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            Checking camera permissions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              VisionFlex
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Your AI-Powered Personal Trainer
            </p>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Get real-time form feedback and automatic rep counting
              using your webcam. No equipment needed - just you and
              your determination.
            </p>
          </div>
        </div>
      </div>

      {/* Camera Permission Section */}
      {cameraPermission !== 'granted' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center mb-3">
                <svg
                  className="h-5 w-5 text-yellow-400 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-yellow-700">
                  {cameraPermission === 'denied'
                    ? 'Camera access is required for pose detection. Please enable camera access in your browser settings and refresh the page.'
                    : 'Camera access is required for the workout experience. Click the button below to grant permission.'}
                </p>
              </div>
              {cameraPermission === 'prompt' && (
                <Button
                  onClick={requestCameraPermission}
                  disabled={isRequestingPermission}
                  size="sm"
                >
                  {isRequestingPermission ? (
                    <div className="flex items-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      <span>Requesting...</span>
                    </div>
                  ) : (
                    'Grant Camera Access'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Selection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Exercise
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select an exercise to start your AI-guided workout. Our
            pose detection technology will track your movements and
            count your reps automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {EXERCISES.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Camera Detection
              </h3>
              <p className="text-gray-600">
                Uses your webcam to track your body movements in
                real-time
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Rep Counting
              </h3>
              <p className="text-gray-600">
                Automatically counts your repetitions with high
                accuracy
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Form Feedback
              </h3>
              <p className="text-gray-600">
                Provides real-time feedback to improve your exercise
                form
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Route } from './+types/summary';
import { useLocation, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Button } from '~/components/Button';
import type { WorkoutSession } from '~/types/exercise';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'VisionFlex - Workout Summary' },
    { name: 'description', content: 'Your workout session summary' },
  ];
}

export default function Summary() {
  const navigate = useNavigate();
  const location = useLocation();
  const [workoutData, setWorkoutData] =
    useState<WorkoutSession | null>(null);

  useEffect(() => {
    const data = location.state?.workoutData as WorkoutSession;
    if (!data) {
      navigate('/');
      return;
    }
    setWorkoutData(data);
  }, [location.state, navigate]);

  if (!workoutData) {
    return null; // Will redirect in useEffect
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPerformanceMessage = (
    reps: number,
  ): { message: string; color: string } => {
    if (reps >= 20) {
      return {
        message: "Outstanding! You're crushing it! 🔥",
        color: 'text-green-600',
      };
    } else if (reps >= 15) {
      return {
        message: 'Great job! Keep up the excellent work! 💪',
        color: 'text-blue-600',
      };
    } else if (reps >= 10) {
      return {
        message: "Good effort! You're making progress! 👍",
        color: 'text-yellow-600',
      };
    } else if (reps >= 5) {
      return {
        message: 'Nice start! Every rep counts! 🌟',
        color: 'text-orange-600',
      };
    } else {
      return {
        message: 'Every journey starts with a single step! 🚀',
        color: 'text-purple-600',
      };
    }
  };

  const performance = getPerformanceMessage(workoutData.reps);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Workout Complete!
            </h1>
            <p className="text-xl text-green-100">
              You've successfully completed your{' '}
              {workoutData.exercise.name} session
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Performance Message */}
        <div className="text-center mb-12">
          <h2
            className={`text-2xl font-bold ${performance.color} mb-2`}
          >
            {performance.message}
          </h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Exercise Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Exercise
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {workoutData.exercise.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {workoutData.exercise.difficulty} level
              </p>
            </div>
          </div>

          {/* Reps Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Total Reps
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {workoutData.reps}
              </p>
            </div>
          </div>

          {/* Duration Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Duration
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatDuration(workoutData.duration)}
              </p>
            </div>
          </div>
        </div>

        {/* Exercise Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Exercise Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Description
              </h4>
              <p className="text-gray-600">
                {workoutData.exercise.description}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Target Muscles
              </h4>
              <div className="flex flex-wrap gap-2">
                {workoutData.exercise.targetMuscles.map((muscle) => (
                  <span
                    key={muscle}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() =>
              navigate(`/workout/${workoutData.exercise.id}`)
            }
            size="lg"
            className="px-8"
          >
            Do Another Set
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="secondary"
            size="lg"
            className="px-8"
          >
            Choose Different Exercise
          </Button>
        </div>

        {/* Motivational Quote */}
        <div className="text-center mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <blockquote className="text-lg italic text-gray-700 mb-2">
            "Success is the sum of small efforts repeated day in and
            day out."
          </blockquote>
          <cite className="text-sm text-gray-500">
            - Robert Collier
          </cite>
        </div>
      </div>
    </div>
  );
}

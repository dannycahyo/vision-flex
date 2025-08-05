import { Link } from 'react-router';
import type { Exercise } from '~/types/exercise';

interface ExerciseCardProps {
  exercise: Exercise;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {exercise.name}
        </h3>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[exercise.difficulty]}`}
        >
          {exercise.difficulty}
        </span>
      </div>

      <p className="text-gray-600 mb-4">{exercise.description}</p>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Target Muscles:
        </h4>
        <div className="flex flex-wrap gap-2">
          {exercise.targetMuscles.map((muscle) => (
            <span
              key={muscle}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {muscle}
            </span>
          ))}
        </div>
      </div>

      <Link
        to={`/workout/${exercise.id}`}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 inline-block text-center"
      >
        Start Workout
      </Link>
    </div>
  );
}

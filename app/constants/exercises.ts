import type { Exercise } from '~/types/exercise';

export const EXERCISES: Exercise[] = [
  {
    id: 'squats',
    name: 'Squats',
    description:
      'Lower body strength exercise targeting quadriceps, glutes, and hamstrings',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    difficulty: 'beginner',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower your body by bending your knees and hips',
      'Keep your chest up and knees behind your toes',
      'Lower until thighs are parallel to the floor',
      'Push through your heels to return to starting position',
    ],
  },
  {
    id: 'bicep-curls',
    name: 'Bicep Curls',
    description: 'Upper body exercise targeting the biceps',
    targetMuscles: ['Biceps', 'Forearms'],
    difficulty: 'beginner',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold weights with arms extended down',
      'Keep elbows close to your sides',
      'Curl weights up by contracting biceps',
      'Slowly lower weights back to starting position',
    ],
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    description: 'Upper body and core exercise',
    targetMuscles: ['Chest', 'Shoulders', 'Triceps', 'Core'],
    difficulty: 'intermediate',
    instructions: [
      'Start in plank position with hands shoulder-width apart',
      'Keep body in straight line from head to heels',
      'Lower body until chest nearly touches the floor',
      'Push back up to starting position',
      'Keep core engaged throughout the movement',
    ],
  },
];

export const getExerciseById = (id: string): Exercise | undefined => {
  return EXERCISES.find((exercise) => exercise.id === id);
};

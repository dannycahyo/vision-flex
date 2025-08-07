import type { Exercise } from '~/types/exercise';

export const EXERCISES: Exercise[] = [
  {
    id: 'squats',
    name: 'Squats',
    initialState: 'up',
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
    initialState: 'extended',
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
];

export const getExerciseById = (id: string): Exercise | undefined => {
  return EXERCISES.find((exercise) => exercise.id === id);
};

export interface Exercise {
  id: string;
  name: string;
  description: string;
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  initialState: ExerciseState;
}

export interface WorkoutSession {
  exercise: Exercise;
  reps: number;
  duration: number; // in seconds
  startTime: Date;
  endTime?: Date;
}

export interface PoseKeypoint {
  x: number;
  y: number;
  confidence: number;
}

export interface Pose {
  keypoints: PoseKeypoint[];
  score: number;
}

export type ExerciseState = 'up' | 'down' | 'extended' | 'contracted';

export interface RepCounterState {
  currentState: ExerciseState;
  repCount: number;
  lastStateChange: number;
  formFeedback: string | null;
}

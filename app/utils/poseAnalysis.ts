import type {
  Pose,
  RepCounterState,
  ExerciseState,
} from '~/types/exercise';

/**
 * Calculate angle between three points using law of cosines
 */
export function calculateAngle(
  point1: { x: number; y: number },
  point2: { x: number; y: number },
  point3: { x: number; y: number },
): number {
  const a = Math.sqrt(
    Math.pow(point2.x - point3.x, 2) +
      Math.pow(point2.y - point3.y, 2),
  );
  const b = Math.sqrt(
    Math.pow(point1.x - point3.x, 2) +
      Math.pow(point1.y - point3.y, 2),
  );
  const c = Math.sqrt(
    Math.pow(point1.x - point2.x, 2) +
      Math.pow(point1.y - point2.y, 2),
  );

  const angle = Math.acos(
    (Math.pow(a, 2) + Math.pow(c, 2) - Math.pow(b, 2)) / (2 * a * c),
  );
  return (angle * 180) / Math.PI;
}

/**
 * Squat rep counter logic
 */
export function processSquatRep(
  pose: Pose,
  state: RepCounterState,
): RepCounterState {
  // MoveNet keypoint indices
  const LEFT_HIP = 11;
  const RIGHT_HIP = 12;
  const LEFT_KNEE = 13;
  const RIGHT_KNEE = 14;

  const leftHip = pose.keypoints[LEFT_HIP];
  const rightHip = pose.keypoints[RIGHT_HIP];
  const leftKnee = pose.keypoints[LEFT_KNEE];
  const rightKnee = pose.keypoints[RIGHT_KNEE];

  // Check if keypoints are visible
  if (
    leftHip.confidence < 0.5 ||
    rightHip.confidence < 0.5 ||
    leftKnee.confidence < 0.5 ||
    rightKnee.confidence < 0.5
  ) {
    return state;
  }

  // Calculate average hip and knee heights
  const avgHipY = (leftHip.y + rightHip.y) / 2;
  const avgKneeY = (leftKnee.y + rightKnee.y) / 2;

  const now = Date.now();
  const timeSinceLastChange = now - state.lastStateChange;

  // Prevent state changes too frequently (debounce)
  if (timeSinceLastChange < 500) {
    return state;
  }

  let newState = state.currentState;
  let newRepCount = state.repCount;

  // Check for state transitions
  if (state.currentState === 'up' && avgHipY > avgKneeY + 0.05) {
    // Hip is significantly below knee level - squat down
    newState = 'down';
  } else if (
    state.currentState === 'down' &&
    avgHipY < avgKneeY - 0.02
  ) {
    // Hip is back above knee level - complete rep
    newState = 'up';
    newRepCount = state.repCount + 1;
  }

  return {
    currentState: newState as ExerciseState,
    repCount: newRepCount,
    lastStateChange:
      newState !== state.currentState ? now : state.lastStateChange,
  };
}

/**
 * Bicep curl rep counter logic
 */
export function processBicepCurlRep(
  pose: Pose,
  state: RepCounterState,
): RepCounterState {
  // MoveNet keypoint indices
  const LEFT_SHOULDER = 5;
  const LEFT_ELBOW = 7;
  const LEFT_WRIST = 9;
  const RIGHT_SHOULDER = 6;
  const RIGHT_ELBOW = 8;
  const RIGHT_WRIST = 10;

  // Use right arm for simplicity (can be extended to use both arms)
  const shoulder = pose.keypoints[RIGHT_SHOULDER];
  const elbow = pose.keypoints[RIGHT_ELBOW];
  const wrist = pose.keypoints[RIGHT_WRIST];

  // Check if keypoints are visible
  if (
    shoulder.confidence < 0.5 ||
    elbow.confidence < 0.5 ||
    wrist.confidence < 0.5
  ) {
    return state;
  }

  const angle = calculateAngle(shoulder, elbow, wrist);
  const now = Date.now();
  const timeSinceLastChange = now - state.lastStateChange;

  // Prevent state changes too frequently (debounce)
  if (timeSinceLastChange < 300) {
    return state;
  }

  let newState = state.currentState;
  let newRepCount = state.repCount;

  // Check for state transitions
  if (state.currentState === 'extended' && angle < 50) {
    // Arm is contracted
    newState = 'contracted';
  } else if (state.currentState === 'contracted' && angle > 160) {
    // Arm is extended - complete rep
    newState = 'extended';
    newRepCount = state.repCount + 1;
  }

  return {
    currentState: newState as ExerciseState,
    repCount: newRepCount,
    lastStateChange:
      newState !== state.currentState ? now : state.lastStateChange,
  };
}

/**
 * Push-up rep counter logic (simplified)
 */
export function processPushUpRep(
  pose: Pose,
  state: RepCounterState,
): RepCounterState {
  // MoveNet keypoint indices
  const LEFT_SHOULDER = 5;
  const RIGHT_SHOULDER = 6;
  const LEFT_ELBOW = 7;
  const RIGHT_ELBOW = 8;

  const leftShoulder = pose.keypoints[LEFT_SHOULDER];
  const rightShoulder = pose.keypoints[RIGHT_SHOULDER];
  const leftElbow = pose.keypoints[LEFT_ELBOW];
  const rightElbow = pose.keypoints[RIGHT_ELBOW];

  // Check if keypoints are visible
  if (
    leftShoulder.confidence < 0.5 ||
    rightShoulder.confidence < 0.5 ||
    leftElbow.confidence < 0.5 ||
    rightElbow.confidence < 0.5
  ) {
    return state;
  }

  // Calculate average shoulder and elbow heights
  const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const avgElbowY = (leftElbow.y + rightElbow.y) / 2;

  const now = Date.now();
  const timeSinceLastChange = now - state.lastStateChange;

  // Prevent state changes too frequently (debounce)
  if (timeSinceLastChange < 500) {
    return state;
  }

  let newState = state.currentState;
  let newRepCount = state.repCount;

  // Check for state transitions (simplified logic)
  if (
    state.currentState === 'up' &&
    avgElbowY > avgShoulderY + 0.03
  ) {
    // Elbows below shoulders - push-up down
    newState = 'down';
  } else if (
    state.currentState === 'down' &&
    avgElbowY < avgShoulderY + 0.01
  ) {
    // Elbows back in line with shoulders - complete rep
    newState = 'up';
    newRepCount = state.repCount + 1;
  }

  return {
    currentState: newState as ExerciseState,
    repCount: newRepCount,
    lastStateChange:
      newState !== state.currentState ? now : state.lastStateChange,
  };
}

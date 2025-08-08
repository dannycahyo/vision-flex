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
  const LEFT_ANKLE = 15;
  const RIGHT_ANKLE = 16;

  const leftHip = pose.keypoints[LEFT_HIP];
  const rightHip = pose.keypoints[RIGHT_HIP];
  const leftKnee = pose.keypoints[LEFT_KNEE];
  const rightKnee = pose.keypoints[RIGHT_KNEE];
  const leftAnkle = pose.keypoints[LEFT_ANKLE];
  const rightAnkle = pose.keypoints[RIGHT_ANKLE];

  // Check if keypoints are visible
  if (
    leftHip.confidence < 0.5 ||
    rightHip.confidence < 0.5 ||
    leftKnee.confidence < 0.5 ||
    rightKnee.confidence < 0.5
  ) {
    console.log('Squat: Key body points not visible');
    return {
      ...state,
      formFeedback:
        'Position yourself so your hips and knees are visible',
    };
  }

  // Calculate average hip and knee heights
  const avgHipY = (leftHip.y + rightHip.y) / 2;
  const avgKneeY = (leftKnee.y + rightKnee.y) / 2;

  // Calculate knee width for stance feedback
  const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);

  console.log(
    `Squat: Hip height: ${avgHipY.toFixed(3)}, Knee height: ${avgKneeY.toFixed(3)}, Knee width: ${kneeWidth.toFixed(3)}`,
  );

  const now = Date.now();
  const timeSinceLastChange = now - state.lastStateChange;

  // Prevent state changes too frequently (debounce) - increased to reduce feedback frequency
  if (timeSinceLastChange < 800) {
    return state;
  }

  // Add minimum time between form feedback updates (3 seconds)
  // Using the lastStateChange as a proxy for lastFeedbackTime to avoid modifying interfaces
  const timeSinceLastFeedback = now - state.lastStateChange;
  const shouldUpdateFeedback = timeSinceLastFeedback > 3000;

  let newState = state.currentState;
  let newRepCount = state.repCount;
  let formFeedback = '';

  // Check for knee alignment issues - only provide feedback if it's time to update
  if (kneeWidth < 0.08 && shouldUpdateFeedback) {
    formFeedback =
      'Keep your knees aligned with your feet, slightly wider stance';
  }

  // Improved thresholds for squat detection
  const SQUAT_DOWN_THRESHOLD = 0.05; // Hip is below knee
  const SQUAT_UP_THRESHOLD = 0.02; // Hip is back above knee

  // Check ankle visibility for depth feedback
  const anklesVisible =
    leftAnkle.confidence > 0.5 && rightAnkle.confidence > 0.5;

  // Check for state transitions
  if (
    state.currentState === 'up' &&
    avgHipY > avgKneeY + SQUAT_DOWN_THRESHOLD
  ) {
    // Hip is significantly below knee level - squat down
    newState = 'down';
    console.log(
      `Squat: Transitioning to DOWN state, hip-knee diff: ${(avgHipY - avgKneeY).toFixed(3)}`,
    );

    // Add form feedback for proper depth - only if it's time to update
    if (anklesVisible && shouldUpdateFeedback) {
      const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
      const hipToAnkleRatio =
        (avgHipY - avgAnkleY) / (avgKneeY - avgAnkleY);

      if (hipToAnkleRatio < 0.7) {
        formFeedback =
          'Try to squat deeper, aim for thighs parallel to ground';
      } else {
        formFeedback = 'Good depth! Hold for a moment at the bottom';
      }
    }
  } else if (
    state.currentState === 'down' &&
    avgHipY < avgKneeY - SQUAT_UP_THRESHOLD
  ) {
    // Hip is back above knee level - complete rep
    newState = 'up';
    newRepCount = state.repCount + 1;
    console.log(`Squat rep completed! Count: ${newRepCount}`);

    // Provide feedback on the completed rep
    formFeedback = 'Good! Keep your back straight for the next rep';
  } else {
    // In-between states, provide guidance - only if it's time to update
    if (shouldUpdateFeedback) {
      if (state.currentState === 'up' && avgHipY > avgKneeY - 0.03) {
        formFeedback =
          'Begin lowering into your squat, keep chest up';
      } else if (state.currentState === 'down') {
        formFeedback = 'Push through your heels to stand back up';
      }
    }
  }

  return {
    currentState: newState as ExerciseState,
    repCount: newRepCount,
    lastStateChange:
      newState !== state.currentState ? now : state.lastStateChange,
    formFeedback: formFeedback || state.formFeedback,
  };
}

/**
 * Bicep curl rep counter logic & form feedback
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

  // Track both arms for better detection
  const leftShoulder = pose.keypoints[LEFT_SHOULDER];
  const leftElbow = pose.keypoints[LEFT_ELBOW];
  const leftWrist = pose.keypoints[LEFT_WRIST];
  const rightShoulder = pose.keypoints[RIGHT_SHOULDER];
  const rightElbow = pose.keypoints[RIGHT_ELBOW];
  const rightWrist = pose.keypoints[RIGHT_WRIST];

  // Check if keypoints are visible for at least one arm
  const leftArmVisible =
    leftShoulder.confidence > 0.5 &&
    leftElbow.confidence > 0.5 &&
    leftWrist.confidence > 0.5;

  const rightArmVisible =
    rightShoulder.confidence > 0.5 &&
    rightElbow.confidence > 0.5 &&
    rightWrist.confidence > 0.5;

  if (!leftArmVisible && !rightArmVisible) {
    return {
      ...state,
      formFeedback: 'Position yourself so your arms are visible',
    };
  }

  // Calculate angles for both arms
  const leftAngle = leftArmVisible
    ? calculateAngle(leftShoulder, leftElbow, leftWrist)
    : 999;
  const rightAngle = rightArmVisible
    ? calculateAngle(rightShoulder, rightElbow, rightWrist)
    : 999;

  // Use the best visible arm or the one with more bend
  let primaryAngle: number;
  let activeArm: string;

  if (leftArmVisible && rightArmVisible) {
    // If both arms visible, use the one that's more bent (smaller angle)
    primaryAngle = Math.min(leftAngle, rightAngle);
    activeArm = leftAngle <= rightAngle ? 'left' : 'right';
  } else if (leftArmVisible) {
    primaryAngle = leftAngle;
    activeArm = 'left';
  } else {
    primaryAngle = rightAngle;
    activeArm = 'right';
  }

  const now = Date.now();
  const timeSinceLastChange = now - state.lastStateChange;

  // Prevent state changes too frequently (debounce) - increased for smoother detection
  if (timeSinceLastChange < 500) {
    return state;
  }

  // Add minimum time between form feedback updates (3 seconds)
  const timeSinceLastFeedback = now - state.lastStateChange;
  const shouldUpdateFeedback = timeSinceLastFeedback > 3000;

  let newState = state.currentState;
  let newRepCount = state.repCount;
  let formFeedback = '';

  // Form feedback based on arm position - only if it's time to update
  if (shouldUpdateFeedback) {
    if (leftArmVisible && rightArmVisible) {
      const angleDifference = Math.abs(leftAngle - rightAngle);
      if (angleDifference > 30) {
        formFeedback =
          'Try to keep both arms moving at the same pace';
      }
    }

    // Check elbow positioning
    if (leftArmVisible || rightArmVisible) {
      const elbow = leftArmVisible ? leftElbow : rightElbow;
      const shoulder = leftArmVisible ? leftShoulder : rightShoulder;

      // Check if elbow is wandering forward or backward too much
      if (Math.abs(elbow.x - shoulder.x) > 0.15) {
        formFeedback = 'Keep your elbow close to your body';
      }
    }
  }

  // More tolerant thresholds for state detection
  const CONTRACTED_ANGLE = 80; // More forgiving - was 70
  const EXTENDED_ANGLE = 140; // More forgiving - was 150

  // Check for state transitions
  if (
    state.currentState === 'extended' &&
    primaryAngle < CONTRACTED_ANGLE
  ) {
    // Arm is contracted
    newState = 'contracted';

    // Add form feedback for contracted position - only on major state transitions or timed updates
    if (primaryAngle < 40 && shouldUpdateFeedback) {
      formFeedback = 'Good contraction! Hold briefly at the top';
    }
  } else if (
    state.currentState === 'contracted' &&
    primaryAngle > EXTENDED_ANGLE
  ) {
    // Arm is extended - complete rep
    newState = 'extended';
    newRepCount = state.repCount + 1;

    // Add form feedback for extended position
    // Always provide feedback after completing a rep
    formFeedback = 'Good extension! Control the downward movement';
  } else {
    // In-between states, provide guidance - only if it's time to update
    if (shouldUpdateFeedback) {
      if (state.currentState === 'extended' && primaryAngle < 110) {
        formFeedback = 'Continue curling upward';
      } else if (
        state.currentState === 'contracted' &&
        primaryAngle > 100
      ) {
        formFeedback = 'Slowly lower your arm';
      }
    }
  }

  return {
    currentState: newState as ExerciseState,
    repCount: newRepCount,
    lastStateChange:
      newState !== state.currentState ? now : state.lastStateChange,
    formFeedback: formFeedback || null, // Reset feedback if no new feedback
  };
}

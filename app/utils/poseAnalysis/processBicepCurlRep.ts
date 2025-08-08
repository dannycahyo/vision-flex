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

  const leftShoulder = pose.keypoints[LEFT_SHOULDER];
  const leftElbow = pose.keypoints[LEFT_ELBOW];
  const leftWrist = pose.keypoints[LEFT_WRIST];
  const rightShoulder = pose.keypoints[RIGHT_SHOULDER];
  const rightElbow = pose.keypoints[RIGHT_ELBOW];
  const rightWrist = pose.keypoints[RIGHT_WRIST];

  // Check if keypoints are visible for at least one arm
  // Lower confidence threshold to 0.3 and count how many points are visible
  const leftPointsVisible = [
    leftShoulder.confidence > 0.3,
    leftElbow.confidence > 0.3,
    leftWrist.confidence > 0.3,
  ].filter(Boolean).length;

  const rightPointsVisible = [
    rightShoulder.confidence > 0.3,
    rightElbow.confidence > 0.3,
    rightWrist.confidence > 0.3,
  ].filter(Boolean).length;

  // Consider arm visible if at least 2 key points are detected with reasonable confidence
  const leftArmVisible = leftPointsVisible >= 2;
  const rightArmVisible = rightPointsVisible >= 2;

  // Only show warning if both arms are completely invisible (less than 2 points each)
  // We'll use the existing shouldUpdateFeedback logic for debouncing
  const timeCheck = Date.now();
  const shouldShowVisibilityWarning =
    timeCheck - state.lastStateChange > 3000; // Reuse existing timing logic

  if (
    !leftArmVisible &&
    !rightArmVisible &&
    shouldShowVisibilityWarning
  ) {
    return {
      ...state,
      formFeedback: 'Position yourself so your arms are visible',
    };
  }

  // Calculate angles for both arms with safety checks
  // Only calculate if we have the minimum required points with reasonable confidence
  let leftAngle = 999;
  let rightAngle = 999;

  // Additional confidence check specifically for angle calculation
  // We need all three points to have at least minimal confidence
  const canCalculateLeftAngle =
    leftPointsVisible >= 2 &&
    leftShoulder.confidence > 0.2 &&
    leftElbow.confidence > 0.2 &&
    leftWrist.confidence > 0.2;

  const canCalculateRightAngle =
    rightPointsVisible >= 2 &&
    rightShoulder.confidence > 0.2 &&
    rightElbow.confidence > 0.2 &&
    rightWrist.confidence > 0.2;

  // Only calculate if we have minimum confidence in all needed points
  if (canCalculateLeftAngle) {
    try {
      leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      // Sanity check on the calculated angle
      if (isNaN(leftAngle) || leftAngle < 0 || leftAngle > 180) {
        leftAngle = 999;
      }
    } catch (e) {
      console.log('Error calculating left arm angle');
      leftAngle = 999;
    }
  }

  if (canCalculateRightAngle) {
    try {
      rightAngle = calculateAngle(
        rightShoulder,
        rightElbow,
        rightWrist,
      );
      // Sanity check on the calculated angle
      if (isNaN(rightAngle) || rightAngle < 0 || rightAngle > 180) {
        rightAngle = 999;
      }
    } catch (e) {
      console.log('Error calculating right arm angle');
      rightAngle = 999;
    }
  }

  // Use the best visible arm or the one with more bend
  let primaryAngle: number;
  let activeArm: string = 'unknown';

  if (leftAngle !== 999 && rightAngle !== 999) {
    // If both arms have valid angles, use the one that's more bent (smaller angle)
    primaryAngle = Math.min(leftAngle, rightAngle);
    activeArm = leftAngle <= rightAngle ? 'left' : 'right';
  } else if (leftAngle !== 999) {
    primaryAngle = leftAngle;
    activeArm = 'left';
  } else if (rightAngle !== 999) {
    primaryAngle = rightAngle;
    activeArm = 'right';
  } else {
    // If no valid angles, default to a neutral value
    // This avoids false rep counts when arms aren't clearly visible
    primaryAngle = 120; // Neutral position between contracted and extended
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
    // Only provide feedback if we have reliable measurements for both arms
    if (leftAngle !== 999 && rightAngle !== 999) {
      const angleDifference = Math.abs(leftAngle - rightAngle);
      if (angleDifference > 50) {
        formFeedback =
          'Try to keep both arms moving at the same pace';
      }
    }

    // Check elbow positioning - using the active arm for feedback
    if (activeArm === 'left' || activeArm === 'right') {
      const elbow = activeArm === 'left' ? leftElbow : rightElbow;
      const shoulder =
        activeArm === 'left' ? leftShoulder : rightShoulder;

      // Only provide feedback if both points have good confidence
      if (elbow.confidence > 0.4 && shoulder.confidence > 0.4) {
        // Check if elbow is wandering forward or backward too much
        if (Math.abs(elbow.x - shoulder.x) > 0.15) {
          formFeedback = 'Keep your elbow close to your body';
        }
      }
    }
  }

  // More tolerant thresholds for state detection
  const CONTRACTED_ANGLE = 80;
  const EXTENDED_ANGLE = 140;

  // Check if we have a reliable angle measurement before processing state transitions
  const hasReliableAngle = primaryAngle !== 999;

  // Check for state transitions - only if we have reliable angles
  if (hasReliableAngle) {
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
  } else {
    // If we don't have reliable angles, don't change the state
    console.log(
      'Skipping state transition due to unreliable angle measurement',
    );
  }

  return {
    currentState: newState as ExerciseState,
    repCount: newRepCount,
    lastStateChange:
      newState !== state.currentState ? now : state.lastStateChange,
    formFeedback: formFeedback || null,
  };
}

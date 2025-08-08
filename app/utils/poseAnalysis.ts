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

  // Check if keypoints are visible with a more lenient approach
  // Count visible points for each side
  const leftPointsVisible = [
    leftHip.confidence > 0.3,
    leftKnee.confidence > 0.3,
    leftAnkle.confidence > 0.3,
  ].filter(Boolean).length;

  const rightPointsVisible = [
    rightHip.confidence > 0.3,
    rightKnee.confidence > 0.3,
    rightAnkle.confidence > 0.3,
  ].filter(Boolean).length;

  // Consider each side visible if at least 2 of 3 points are detected
  const leftSideVisible = leftPointsVisible >= 2;
  const rightSideVisible = rightPointsVisible >= 2;

  // Only show warning if neither side is sufficiently visible
  // Add debounce to prevent too frequent visibility warnings
  const timeCheck = Date.now();
  const shouldShowVisibilityWarning =
    timeCheck - state.lastStateChange > 3000;

  if (
    !leftSideVisible &&
    !rightSideVisible &&
    shouldShowVisibilityWarning
  ) {
    console.log('Squat: Key body points not visible');
    return {
      ...state,
      formFeedback:
        'Position yourself so your hips and knees are visible',
    };
  }

  // Calculate average hip and knee heights with confidence weighting
  // Initialize with default values to avoid TypeScript errors
  let avgHipY = 0;
  let avgKneeY = 0;
  let kneeWidth = 0.15; // Default reasonable knee width
  let hasReliablePositions = true;

  try {
    // Use confidence as weights when calculating averages
    const leftHipWeight = Math.max(0.1, leftHip.confidence);
    const rightHipWeight = Math.max(0.1, rightHip.confidence);
    const totalHipWeight = leftHipWeight + rightHipWeight;

    const leftKneeWeight = Math.max(0.1, leftKnee.confidence);
    const rightKneeWeight = Math.max(0.1, rightKnee.confidence);
    const totalKneeWeight = leftKneeWeight + rightKneeWeight;

    // Weighted averages - gives more importance to higher confidence points
    avgHipY =
      (leftHip.y * leftHipWeight + rightHip.y * rightHipWeight) /
      totalHipWeight;
    avgKneeY =
      (leftKnee.y * leftKneeWeight + rightKnee.y * rightKneeWeight) /
      totalKneeWeight;

    // Calculate knee width for stance feedback - only if both knees have reasonable confidence
    if (leftKnee.confidence > 0.3 && rightKnee.confidence > 0.3) {
      kneeWidth = Math.abs(leftKnee.x - rightKnee.x);
    } else {
      // If one knee is poorly detected, use a default reasonable width
      kneeWidth = 0.15; // Default reasonable width to avoid false feedback
      console.log(
        'Using default knee width due to low confidence detection',
      );
    }

    // Sanity check - ensure the values make sense
    if (
      isNaN(avgHipY) ||
      isNaN(avgKneeY) ||
      avgHipY <= 0 ||
      avgKneeY <= 0
    ) {
      console.log('Invalid position calculations detected');
      hasReliablePositions = false;

      // Reset to safe values to prevent errors
      avgHipY = 0.5; // Neutral position
      avgKneeY = 0.6; // Neutral position
    }
  } catch (e) {
    console.error('Error calculating positions:', e);
    hasReliablePositions = false;
    avgHipY = 0.5; // Neutral position
    avgKneeY = 0.6; // Neutral position
    kneeWidth = 0.15;
  }

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

  // Check for knee alignment issues - only if positions are reliable and it's time to update
  if (
    hasReliablePositions &&
    kneeWidth < 0.08 &&
    shouldUpdateFeedback
  ) {
    formFeedback =
      'Keep your knees aligned with your feet, slightly wider stance';
  }

  // More tolerant thresholds for squat detection
  const SQUAT_DOWN_THRESHOLD = 0.02; // Hip is below knee - reduced from 0.05 for shallower squats
  const SQUAT_UP_THRESHOLD = 0.01; // Hip is back above knee - reduced from 0.02 for easier rep counting

  // Check ankle visibility for depth feedback - more lenient threshold
  const anklesVisible =
    leftAnkle.confidence > 0.3 && rightAnkle.confidence > 0.3;

  // Only proceed with state transitions if we have reliable position data
  if (!hasReliablePositions) {
    console.log(
      'Skipping squat state transition due to unreliable position data',
    );
    return state;
  }

  // Check for state transitions - more tolerant for partial squats
  if (
    state.currentState === 'up' &&
    (avgHipY > avgKneeY + SQUAT_DOWN_THRESHOLD ||
      // This alternative condition allows for detecting a squat even with minimal movement
      (avgHipY > avgKneeY - 0.02 && avgHipY < avgKneeY + 0.01))
  ) {
    // Hip is significantly below knee level - squat down
    newState = 'down';
    console.log(
      `Squat: Transitioning to DOWN state, hip-knee diff: ${(avgHipY - avgKneeY).toFixed(3)} (partial squat detection enabled)`,
    );

    // Add form feedback for proper depth - only if it's time to update
    if (anklesVisible && shouldUpdateFeedback) {
      try {
        // Use confidence-weighted average for ankle position
        const leftAnkleWeight = Math.max(0.1, leftAnkle.confidence);
        const rightAnkleWeight = Math.max(0.1, rightAnkle.confidence);
        const totalAnkleWeight = leftAnkleWeight + rightAnkleWeight;

        const avgAnkleY =
          (leftAnkle.y * leftAnkleWeight +
            rightAnkle.y * rightAnkleWeight) /
          totalAnkleWeight;

        // Safety check for division by zero
        if (Math.abs(avgKneeY - avgAnkleY) > 0.01) {
          const hipToAnkleRatio =
            (avgHipY - avgAnkleY) / (avgKneeY - avgAnkleY);

          // Sanity check on the ratio
          if (!isNaN(hipToAnkleRatio) && isFinite(hipToAnkleRatio)) {
            // More encouraging feedback for any depth of squat
            if (hipToAnkleRatio < 0.5) {
              formFeedback = 'Excellent depth! Great form!';
            } else if (hipToAnkleRatio < 0.7) {
              formFeedback =
                'Good depth! Hold for a moment at the bottom';
            } else {
              // More positive feedback even for partial squats
              formFeedback =
                'Good! Go as deep as comfortable for you';
            }
          }
        }
      } catch (e) {
        console.error('Error calculating squat depth:', e);
      }
    }
  } else if (
    state.currentState === 'down' &&
    (avgHipY < avgKneeY - SQUAT_UP_THRESHOLD ||
      // This makes it easier to complete a rep - just detecting upward movement
      avgHipY < avgKneeY + 0.01)
  ) {
    // Hip is back above knee level - complete rep
    newState = 'up';
    newRepCount = state.repCount + 1;
    console.log(
      `Squat rep completed! Count: ${newRepCount} (simplified up detection)`,
    );

    // Provide feedback on the completed rep
    formFeedback = 'Good! Keep your back straight for the next rep';
  } else {
    // In-between states, provide guidance - only if positions are reliable and it's time to update
    if (hasReliablePositions && shouldUpdateFeedback) {
      // Much more tolerant threshold for detecting the beginning of a squat
      const BEGINNING_SQUAT_THRESHOLD = 0.05; // Increased from 0.03

      // Detect any slight movement toward squat position
      if (
        state.currentState === 'up' &&
        avgHipY > avgKneeY - BEGINNING_SQUAT_THRESHOLD
      ) {
        formFeedback =
          'Begin lowering into your squat, keep chest up';
      } else if (state.currentState === 'down') {
        // Less frequent feedback when in the down position waiting to rise
        const MIN_TIME_IN_DOWN_STATE = 2000; // 2 seconds
        const timeInCurrentState = now - state.lastStateChange;

        if (timeInCurrentState > MIN_TIME_IN_DOWN_STATE) {
          formFeedback = 'Push through your heels to stand back up';
        }
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

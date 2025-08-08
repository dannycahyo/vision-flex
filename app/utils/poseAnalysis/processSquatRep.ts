import type {
  Pose,
  RepCounterState,
  ExerciseState,
} from '~/types/exercise';

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

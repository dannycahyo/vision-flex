import { useState, useCallback } from 'react';
import type {
  Pose,
  RepCounterState,
  Exercise,
} from '~/types/exercise';
import {
  processSquatRep,
  processBicepCurlRep,
  processPushUpRep,
} from '~/utils/poseAnalysis';

interface UseRepCountingReturn {
  repState: RepCounterState;
  processFrame: (poses: Pose[]) => void;
  resetCounter: () => void;
  getFormFeedback: () => string | null;
}

export function useRepCounting(
  exercise: Exercise,
): UseRepCountingReturn {
  const [repState, setRepState] = useState<RepCounterState>({
    currentState: exercise.id === 'bicep-curls' ? 'extended' : 'up',
    repCount: 0,
    lastStateChange: Date.now(),
  });

  const [lastFormCheck, setLastFormCheck] = useState<number>(
    Date.now(),
  );
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const processFrame = useCallback(
    (poses: Pose[]) => {
      if (poses.length === 0) return;

      const pose = poses[0]; // Use the first detected pose
      let newState: RepCounterState;

      // Process based on exercise type
      switch (exercise.id) {
        case 'squats':
          newState = processSquatRep(pose, repState);
          break;
        case 'bicep-curls':
          newState = processBicepCurlRep(pose, repState);
          break;
        case 'push-ups':
          newState = processPushUpRep(pose, repState);
          break;
        default:
          return;
      }

      // Update state if changed
      if (
        newState.repCount !== repState.repCount ||
        newState.currentState !== repState.currentState
      ) {
        setRepState(newState);

        // Clear form message when rep is completed
        if (newState.repCount > repState.repCount) {
          setFormMessage(null);
        }
      }

      // Form feedback (check every 2 seconds)
      const now = Date.now();
      if (now - lastFormCheck > 2000) {
        setLastFormCheck(now);
        updateFormFeedback(pose, newState);
      }
    },
    [exercise.id, repState, lastFormCheck],
  );

  const updateFormFeedback = useCallback(
    (pose: Pose, state: RepCounterState) => {
      if (exercise.id === 'squats') {
        // Check if user is going down but not deep enough
        const leftHip = pose.keypoints[11];
        const rightHip = pose.keypoints[12];
        const leftKnee = pose.keypoints[13];
        const rightKnee = pose.keypoints[14];

        if (
          leftHip.confidence > 0.5 &&
          rightHip.confidence > 0.5 &&
          leftKnee.confidence > 0.5 &&
          rightKnee.confidence > 0.5
        ) {
          const avgHipY = (leftHip.y + rightHip.y) / 2;
          const avgKneeY = (leftKnee.y + rightKnee.y) / 2;

          // If user is in down position but not deep enough
          if (
            state.currentState === 'down' &&
            avgHipY < avgKneeY + 0.02
          ) {
            setFormMessage('Go lower for a complete squat');
          }

          // Check knee alignment
          const kneeDistance = Math.abs(leftKnee.x - rightKnee.x);
          if (kneeDistance < 0.05) {
            setFormMessage('Keep your knees apart');
          }
        }
      } else if (exercise.id === 'bicep-curls') {
        // Check elbow position
        const leftShoulder = pose.keypoints[5];
        const rightShoulder = pose.keypoints[6];
        const leftElbow = pose.keypoints[7];
        const rightElbow = pose.keypoints[8];

        if (
          rightShoulder.confidence > 0.5 &&
          rightElbow.confidence > 0.5
        ) {
          const elbowMovement = Math.abs(
            rightElbow.x - rightShoulder.x,
          );
          if (elbowMovement > 0.1) {
            setFormMessage('Keep your elbows close to your body');
          }
        }
      }
    },
    [exercise.id],
  );

  const resetCounter = useCallback(() => {
    setRepState({
      currentState: exercise.id === 'bicep-curls' ? 'extended' : 'up',
      repCount: 0,
      lastStateChange: Date.now(),
    });
    setFormMessage(null);
  }, [exercise.id]);

  const getFormFeedback = useCallback(() => {
    return formMessage;
  }, [formMessage]);

  return {
    repState,
    processFrame,
    resetCounter,
    getFormFeedback,
  };
}

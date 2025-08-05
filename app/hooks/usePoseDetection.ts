import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import type { Pose } from '~/types/exercise';

interface UsePoseDetectionReturn {
  detector: poseDetection.PoseDetector | null;
  isModelLoading: boolean;
  modelError: string | null;
  detectPose: (video: HTMLVideoElement) => Promise<Pose[]>;
  loadModel: () => Promise<void>;
}

export function usePoseDetection(): UsePoseDetectionReturn {
  const [detector, setDetector] =
    useState<poseDetection.PoseDetector | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);

  const loadModel = useCallback(async () => {
    // Prevent loading if already loading or loaded
    if (isModelLoading || detector) {
      console.log('Model already loading or loaded');
      return;
    }

    setIsModelLoading(true);
    setModelError(null);

    try {
      console.log('Loading TensorFlow.js...');

      // Add a small delay to ensure video is stable
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Set backend to CPU initially to avoid WebGL conflicts with video
      try {
        await tf.setBackend('webgl');
      } catch (webglError) {
        console.warn(
          'WebGL backend failed, falling back to CPU:',
          webglError,
        );
        await tf.setBackend('cpu');
      }
      await tf.ready();

      console.log('TensorFlow.js ready, loading MoveNet...');

      // Create detector with optimized settings
      const detectorConfig = {
        modelType:
          poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        multiPoseMaxDimension: 256,
        enableTracking: false,
        trackerType: poseDetection.TrackerType.BoundingBox,
      };

      const poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig,
      );

      detectorRef.current = poseDetector;
      setDetector(poseDetector);
      console.log('MoveNet model loaded successfully');
    } catch (error) {
      console.error('Error loading pose detection model:', error);
      setModelError(
        error instanceof Error
          ? error.message
          : 'Failed to load AI model',
      );
    } finally {
      setIsModelLoading(false);
    }
  }, [isModelLoading, detector]);

  const detectPose = useCallback(
    async (video: HTMLVideoElement): Promise<Pose[]> => {
      if (
        !detectorRef.current ||
        !video.videoWidth ||
        !video.videoHeight
      ) {
        return [];
      }

      try {
        const poses = await detectorRef.current.estimatePoses(video);

        // Convert to our Pose format
        return poses.map((pose) => ({
          keypoints: pose.keypoints.map((kp) => ({
            x: kp.x / video.videoWidth,
            y: kp.y / video.videoHeight,
            confidence: kp.score || 0,
          })),
          score: pose.score || 0,
        }));
      } catch (error) {
        console.error('Error detecting pose:', error);
        return [];
      }
    },
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectorRef.current) {
        console.log('Cleaning up pose detector');
        detectorRef.current.dispose?.();
        detectorRef.current = null;
      }
    };
  }, []);

  return {
    detector,
    isModelLoading,
    modelError,
    detectPose,
    loadModel,
  };
}

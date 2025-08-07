import type { Pose } from '~/types/exercise';

/**
 * Draw pose keypoints and skeleton on canvas
 */
export function drawPose(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  canvasWidth: number,
  canvasHeight: number,
): void {
  // MoveNet keypoint connections (skeleton)
  const connections = [
    [5, 6], // left_shoulder to right_shoulder
    [5, 7], // left_shoulder to left_elbow
    [7, 9], // left_elbow to left_wrist
    [6, 8], // right_shoulder to right_elbow
    [8, 10], // right_elbow to right_wrist
    [5, 11], // left_shoulder to left_hip
    [6, 12], // right_shoulder to right_hip
    [11, 12], // left_hip to right_hip
    [11, 13], // left_hip to left_knee
    [13, 15], // left_knee to left_ankle
    [12, 14], // right_hip to right_knee
    [14, 16], // right_knee to right_ankle
  ];

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Save context state
  ctx.save();

  // Draw skeleton
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;

  connections.forEach(([startIdx, endIdx]) => {
    const startPoint = pose.keypoints[startIdx];
    const endPoint = pose.keypoints[endIdx];

    if (startPoint.confidence > 0.5 && endPoint.confidence > 0.5) {
      ctx.beginPath();
      ctx.moveTo(
        startPoint.x * canvasWidth,
        startPoint.y * canvasHeight,
      );
      ctx.lineTo(endPoint.x * canvasWidth, endPoint.y * canvasHeight);
      ctx.stroke();
    }
  });

  // Draw keypoints
  pose.keypoints.forEach((keypoint, index) => {
    if (keypoint.confidence > 0.5) {
      const x = keypoint.x * canvasWidth;
      const y = keypoint.y * canvasHeight;

      // Different colors for different body parts
      if (index <= 4) {
        ctx.fillStyle = '#ff0000'; // Head/face - red
      } else if (index <= 10) {
        ctx.fillStyle = '#0000ff'; // Arms - blue
      } else {
        ctx.fillStyle = '#ffff00'; // Legs - yellow
      }

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  // Restore context state
  ctx.restore();
}

/**
 * Resize canvas to match video dimensions
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
): void {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.style.width = `${video.offsetWidth}px`;
  canvas.style.height = `${video.offsetHeight}px`;
}

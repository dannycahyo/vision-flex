import { useRef, useEffect } from 'react';
import { resizeCanvas } from '~/utils/canvasUtils';

export function useWorkoutCanvas(
  hasPermission: boolean,
  stream: MediaStream | null,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasResizedRef = useRef<boolean>(false);

  // Resize canvas when video dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const video = document.querySelector('video');
      if (video) {
        resizeCanvas(canvas, video);
        canvasResizedRef.current = true;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasPermission, stream]);

  // Reset canvas resize flag when stream changes
  useEffect(() => {
    canvasResizedRef.current = false;
  }, [stream]);

  return {
    canvasRef,
    canvasResizedRef,
  };
}

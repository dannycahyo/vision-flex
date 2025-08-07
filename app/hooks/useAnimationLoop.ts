import { useRef, useEffect, useCallback } from 'react';

interface UseAnimationLoopReturn {
  startLoop: (callback: () => void) => void;
  stopLoop: () => void;
  isRunning: boolean;
}

export function useAnimationLoop(): UseAnimationLoopReturn {
  const animationIdRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const callbackRef = useRef<(() => void) | null>(null);

  const loop = useCallback(() => {
    if (isRunningRef.current && callbackRef.current) {
      callbackRef.current();
      animationIdRef.current = requestAnimationFrame(loop);
    }
  }, []);

  const startLoop = useCallback(
    (callback: () => void) => {
      if (isRunningRef.current) {
        stopLoop();
      }

      callbackRef.current = callback;
      isRunningRef.current = true;
      animationIdRef.current = requestAnimationFrame(loop);
    },
    [loop],
  );

  const stopLoop = useCallback(() => {
    isRunningRef.current = false;
    callbackRef.current = null;

    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, [stopLoop]);

  return {
    startLoop,
    stopLoop,
    isRunning: isRunningRef.current,
  };
}

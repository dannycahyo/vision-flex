import { useState, useEffect, useRef } from 'react';

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<void>;
  stopStream: () => void;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = async () => {
    // Prevent multiple simultaneous requests
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      setStream(mediaStream);
      setHasPermission(true);
    } catch (err) {
      console.error('Webcam access error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to access webcam';
      setError(errorMessage);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to connect stream to video element when both are available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;

      // Ensure video plays with proper promise handling
      const playVideo = async () => {
        try {
          const playPromise = videoRef.current?.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (err) {
          console.warn('Video autoplay failed:', err);
          // Don't reset permission on autoplay failure
        }
      };

      playVideo();
    }
  }, [stream]);

  const stopStream = () => {
    console.log('Stopping stream - called from:', new Error().stack);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setHasPermission(false);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    videoRef,
    stream,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    stopStream,
  };
}

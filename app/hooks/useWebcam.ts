import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<void>;
  stopStream: () => void;
  ensureStream: () => Promise<boolean>;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      const videoTrack = mediaStream.getVideoTracks()[0];
      console.log(
        'Video track constraints:',
        videoTrack.getConstraints(),
      );
      console.log('Video track settings:', videoTrack.getSettings());

      setStream(mediaStream);
      setHasPermission(true);
      setPermissionGranted(true);
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

  // Make stopStream stable by using useCallback
  const stopStream = useCallback(() => {
    console.log('Stopping stream - called from:', new Error().stack);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);

      // Don't mark hasPermission as false if we know permission was granted
      // This keeps the UI from showing "Camera permission required" unnecessarily
      if (!permissionGranted) {
        setHasPermission(false);
      }
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream, permissionGranted]);

  const ensureStream = useCallback(async (): Promise<boolean> => {
    if (stream) {
      // We already have an active stream
      return true;
    }

    // If permission was previously granted, try to get the stream again
    if (permissionGranted) {
      try {
        setIsLoading(true);
        const mediaStream = await navigator.mediaDevices.getUserMedia(
          {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            },
          },
        );

        setStream(mediaStream);
        setHasPermission(true);
        setIsLoading(false);
        return true;
      } catch (err) {
        console.error('Failed to restore webcam stream:', err);
        setIsLoading(false);
        return false;
      }
    }

    return false;
  }, [
    stream,
    permissionGranted,
    setIsLoading,
    setStream,
    setHasPermission,
  ]);

  // Effect to connect stream to video element when both are available
  // This is now managed in the component directly, so we'll make this one
  // simpler to avoid conflicting behaviors
  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      console.log('Setting stream from useWebcam hook');
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Only run this cleanup when the component using useWebcam unmounts
  // not on every stream change
  useEffect(() => {
    return () => {
      console.log('useWebcam cleanup - component unmounting');
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // Empty dependency array means this only runs on unmount

  return {
    videoRef,
    stream,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    stopStream,
    ensureStream,
  };
}

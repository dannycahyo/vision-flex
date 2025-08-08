import { LoadingSpinner } from './LoadingSpinner';

interface WorkoutVideoProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  stream: MediaStream | null;
  isLoading: boolean;
  isAILoading: boolean;
  isPoseModelLoading: boolean;
  isWorkoutActive: boolean;
  repCount: number;
  requestPermission: () => void;
}

export function WorkoutVideo({
  videoRef,
  canvasRef,
  stream,
  isLoading,
  isAILoading,
  isPoseModelLoading,
  isWorkoutActive,
  repCount,
  requestPermission,
}: WorkoutVideoProps) {
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log('Video playing successfully'))
          .catch((error) =>
            console.warn('Video autoplay failed:', error),
          );
      }
    }
  };

  return (
    <div className="flex-1 relative bg-black">
      {isLoading || isAILoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center text-center text-white">
            <LoadingSpinner size="lg" />
            <p className="mt-4">
              {isAILoading
                ? 'Loading AI model...'
                : 'Starting camera...'}
            </p>
            {isPoseModelLoading && (
              <p className="text-sm text-gray-300 mt-2">
                This may take a moment on first load
              </p>
            )}
          </div>
        </div>
      ) : stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain video-container"
            style={{
              backgroundColor: 'black',
              display: 'block',
              transform: 'scaleX(-1)',
            }}
            onLoadedMetadata={handleLoadedMetadata}
            onError={(e) => console.error('Video error:', e)}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
              backgroundColor: 'transparent',
              transform: 'scaleX(-1)',
            }}
          />

          {isWorkoutActive && (
            <>
              <div className="absolute top-4 left-12 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>AI Active</span>
                </div>
              </div>

              <div className="absolute top-4 right-16 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {repCount}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="mb-4">Camera permission is required</p>
            <button
              onClick={requestPermission}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Enable Camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DebugInfoProps {
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  stream: MediaStream | null;
}

export function DebugInfo({
  hasPermission,
  isLoading,
  error,
  stream,
}: DebugInfoProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Debug Info:</div>
      <div>Permission: {hasPermission ? '✅' : '❌'}</div>
      <div>Loading: {isLoading ? '⏳' : '✅'}</div>
      <div>Error: {error ? '❌' : '✅'}</div>
      <div>Stream: {stream ? '✅' : '❌'}</div>
      {error && (
        <div className="text-red-400 mt-1">Error: {error}</div>
      )}
      {stream && (
        <div className="text-green-400 mt-1">
          Tracks: {stream.getVideoTracks().length}
        </div>
      )}
    </div>
  );
}

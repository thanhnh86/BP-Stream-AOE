import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ url, muted = true, autoPlay = true, poster = '' }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    let hls;
    if (url) {
      if (url.endsWith('.mp4')) {
        // Direct MP4 playback
        videoRef.current.src = url;
      } else if (Hls.isSupported()) {
        hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
        });
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url;
      }
    }
    
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      <video
        ref={videoRef}
        muted={muted}
        autoPlay={autoPlay}
        poster={poster}
        controls
        className="w-full h-full object-contain"
      />
      {/* Subtle Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  );
};

export default VideoPlayer;

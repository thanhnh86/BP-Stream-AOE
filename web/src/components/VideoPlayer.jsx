import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ url, muted = true, autoPlay = true, poster = '' }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    let hls;
    if (url) {
      if (Hls.isSupported()) {
        hls = new Hls();
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
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden border border-gray-800 shadow-lg group">
      <video
        ref={videoRef}
        muted={muted}
        autoPlay={autoPlay}
        poster={poster}
        controls
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default VideoPlayer;

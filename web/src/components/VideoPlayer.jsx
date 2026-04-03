import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayer = ({ url, muted = true, autoPlay = true, poster = '' }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");

      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        autoplay: autoPlay,
        controls: true,
        responsive: true,
        fluid: true,
        muted: muted,
        poster: poster,
        sources: [{
          src: url,
          type: url.endsWith('.mp4') ? 'video/mp4' : 'application/x-mpegURL'
        }],
        html5: {
          vhs: {
            overrideNative: true
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false
        },
        controlBar: {
            children: [
                'playToggle',
                'volumePanel',
                'currentTimeDisplay',
                'timeDivider',
                'durationDisplay',
                'progressControl',
                'liveDisplay',
                'playbackRateMenuButton',
                'fullscreenToggle',
            ],
        },
      }, () => {
        // Player is ready
      });

    } else if (playerRef.current) {
      // Update existing player when url changes
      const player = playerRef.current;
      player.autoplay(autoPlay);
      player.src({
        src: url,
        type: url.endsWith('.mp4') ? 'video/mp4' : 'application/x-mpegURL'
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [url]);

  return (
    <div className="w-full h-full bg-black custom-videojs-theme">
      <div data-vjs-player className="w-full h-full">
        <div ref={videoRef} className="w-full h-full" />
      </div>

      <style>{`
        .custom-videojs-theme .video-js {
          background-color: #000;
          font-family: 'Roboto', sans-serif;
        }
        .custom-videojs-theme .vjs-big-play-button {
          background-color: rgba(201, 160, 80, 0.8) !important;
          border-color: #C9A050 !important;
          border-radius: 50% !important;
          width: 2em !important;
          height: 2em !important;
          line-height: 2em !important;
          margin-top: -1em !important;
          margin-left: -1em !important;
        }
        .custom-videojs-theme .vjs-play-progress {
          background-color: #C9A050 !important;
        }
        .custom-videojs-theme .vjs-volume-level {
          background-color: #C9A050 !important;
        }
        .custom-videojs-theme .vjs-control-bar {
          background-color: rgba(11, 14, 20, 0.8) !important;
          backdrop-filter: blur(8px);
        }
        .video-js.vjs-fluid {
            padding-top: 56.25% !important; /* 16:9 */
            height: 0 !important;
        }
        .vjs-poster {
            background-size: cover !important;
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;



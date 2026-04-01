import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';

/**
 * VideoPlayer component supporting:
 * - Live FLV streams via mpegts.js (lowest latency for SRS)
 * - HLS VOD playback via hls.js (robust seeking & duration)
 * - Native HLS on Safari
 *
 * Props:
 *   src      - URL to play (.flv or .m3u8)
 *   mode     - 'live' | 'vod' (determines player behavior)
 *   controls - show native controls
 *   autoplay - auto start playback
 *   muted    - start muted
 */
export const VideoPlayer = ({ src, mode = 'live', controls = true, autoplay = true, muted = false }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const lastSrcRef = useRef(null);

  useEffect(() => {
    if (lastSrcRef.current === src) return;
    lastSrcRef.current = src;

    // Cleanup previous player
    destroyPlayer();

    if (!containerRef.current) return;

    // Create fresh <video> element each time to avoid stale decoder state
    const video = document.createElement('video');
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    video.style.background = '#000';
    video.controls = controls;
    video.autoplay = autoplay;
    video.muted = muted;
    video.playsInline = true;

    // Clear container and append new video
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(video);
    videoRef.current = video;

    const isFLV = src.includes('.flv');
    const isHLS = src.includes('.m3u8');

    if (isFLV && mpegts.isSupported()) {
      // ===== LIVE FLV via mpegts.js =====
      const player = mpegts.createPlayer({
        type: 'flv',
        isLive: true,
        url: src
      }, {
        enableWorker: true,
        enableStashBuffer: false,
        stashInitialSize: 128,
        lazyLoad: false,
        lazyLoadMaxDuration: 3 * 60,
        autoCleanupSourceBuffer: true,
        autoCleanupMaxBackwardDuration: 3 * 60,
        autoCleanupMinBackwardDuration: 2 * 60
      });

      player.attachMediaElement(video);
      player.load();
      if (autoplay) {
        video.play().catch(e => console.warn('FLV autoplay blocked:', e));
      }

      playerRef.current = { type: 'mpegts', instance: player };

    } else if (isHLS) {
      if (Hls.isSupported()) {
        // ===== HLS via hls.js (Chrome, Firefox, Edge) =====
        const isVOD = mode === 'vod';

        const hls = new Hls({
          // For VOD: load entire playlist, allow seeking
          // For Live: stay near live edge
          maxBufferLength: isVOD ? 60 : 10,
          maxMaxBufferLength: isVOD ? 120 : 30,
          liveSyncDurationCount: isVOD ? 0 : 3,
          liveMaxLatencyDurationCount: isVOD ? 0 : 6,
          liveDurationInfinity: !isVOD,
          enableWorker: true,
          lowLatencyMode: !isVOD,
          backBufferLength: isVOD ? Infinity : 30,
          startPosition: isVOD ? 0 : -1,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoplay) {
            video.play().catch(e => console.warn('HLS autoplay blocked:', e));
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS network error, attempting recovery...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS media error, attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                console.error('HLS fatal error, cannot recover:', data);
                hls.destroy();
                break;
            }
          }
        });

        playerRef.current = { type: 'hls', instance: hls };

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // ===== Safari native HLS =====
        video.src = src;
        if (autoplay) {
          video.play().catch(e => console.warn('Native HLS autoplay blocked:', e));
        }
        playerRef.current = { type: 'native', instance: null };
      }
    } else {
      // ===== Regular MP4 =====
      video.src = src;
      if (autoplay) {
        video.play().catch(e => console.warn('MP4 autoplay blocked:', e));
      }
      playerRef.current = { type: 'native', instance: null };
    }
  }, [src, mode, controls, autoplay, muted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => destroyPlayer();
  }, []);

  function destroyPlayer() {
    if (playerRef.current) {
      const { type, instance } = playerRef.current;
      try {
        if (type === 'mpegts' && instance) {
          instance.pause();
          instance.unload();
          instance.detachMediaElement();
          instance.destroy();
        } else if (type === 'hls' && instance) {
          instance.destroy();
        }
      } catch (e) {
        console.warn('Error destroying player:', e);
      }
      playerRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
      videoRef.current = null;
    }
    lastSrcRef.current = null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#000',
        position: 'relative'
      }}
    />
  );
};

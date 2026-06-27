import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useIntroAnimation } from '../hooks/useIntroAnimation';
import '../styles/intro.css';

const TARGET_FPS = 30;
const POST_DELAY_MS = 500;
const FADE_DURATION = 800;

export const IntroScreen = React.memo(function IntroScreen({ onComplete }) {
  const { loadProgress, isLoaded, finishIntro, imagesRef, totalFrames } = useIntroAnimation();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // Lock scrollbars during intro playback
  useEffect(() => {
    document.body.classList.add('intro-playing');
    return () => {
      document.body.classList.remove('intro-playing');
    };
  }, []);

  // Play frame-by-frame animation at 30 FPS using requestAnimationFrame & Canvas API
  const startPlayback = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const images = imagesRef.current;
    const interval = 1000 / TARGET_FPS;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    setIsPlaying(true);
    startTimeRef.current = performance.now();
    let lastFrameIndex = -1;

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const frameIndex = Math.min(Math.floor(elapsed / interval), totalFrames - 1);

      if (frameIndex !== lastFrameIndex) {
        lastFrameIndex = frameIndex;
        const img = images[frameIndex];

        if (img && img.complete && img.naturalWidth > 0) {
          const cw = canvas.width;
          const ch = canvas.height;
          const iw = img.naturalWidth;
          const ih = img.naturalHeight;

          const scale = Math.max(cw / iw, ch / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          const dx = (cw - dw) / 2;
          const dy = (ch - dh) / 2;

          ctx.clearRect(0, 0, cw, ch);
          ctx.drawImage(img, dx, dy, dw, dh);
        }
      }

      if (frameIndex < totalFrames - 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Last frame reached: pause 500ms, fade out, then reveal Login
        window.removeEventListener('resize', resizeCanvas);
        setTimeout(() => {
          setFadingOut(true);
          setTimeout(() => {
            document.body.classList.remove('intro-playing');
            finishIntro();
            if (onComplete) onComplete();
          }, FADE_DURATION);
        }, POST_DELAY_MS);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [totalFrames, finishIntro, onComplete]);

  // Trigger video playback once preloading reaches 100%
  useEffect(() => {
    if (!isLoaded) return;
    const cleanup = startPlayback();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (cleanup) cleanup();
    };
  }, [isLoaded, startPlayback]);

  return (
    <div className={`intro-overlay ${fadingOut ? 'intro-fade-out' : ''}`}>
      {/* Loading Screen */}
      {!isPlaying && (
        <div className="intro-loading-container">
          <span className="intro-loading-title">Loading CyberShield AI...</span>
          <div className="intro-loading-bar-track">
            <div
              className="intro-loading-bar-fill"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <span className="intro-loading-percent">{loadProgress}%</span>
        </div>
      )}

      {/* Animation Canvas */}
      <canvas
        ref={canvasRef}
        className={`intro-canvas ${isPlaying ? 'intro-playing-active' : ''}`}
      />
    </div>
  );
});

export default IntroScreen;

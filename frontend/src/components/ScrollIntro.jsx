import React, { useEffect, useRef, useCallback } from 'react';
import useScrollFrames from '../hooks/useScrollFrames';
import '../styles/scrollIntro.css';

export const ScrollIntro = React.memo(function ScrollIntro() {
  const { loadProgress, isLoaded, imagesRef, totalFrames } = useScrollFrames();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastFrameIndexRef = useRef(-1);
  const hintRef = useRef(null);

  // Manage body scrollbar during loading
  useEffect(() => {
    if (!isLoaded) {
      document.body.classList.add('scroll-intro-loading');
    } else {
      document.body.classList.remove('scroll-intro-loading');
    }
    return () => {
      document.body.classList.remove('scroll-intro-loading');
    };
  }, [isLoaded]);

  // Render a specific frame onto canvas with object-fit: cover scaling
  const renderFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const images = imagesRef.current;
    const img = images[frameIndex];

    if (!img || !img.complete || img.naturalWidth === 0) return;

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
  }, []);

  // Update canvas size to match viewport
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (lastFrameIndexRef.current >= 0) {
        renderFrame(lastFrameIndexRef.current);
      }
    }
  }, [renderFrame]);

  // Calculate scroll progress and render corresponding frame via requestAnimationFrame
  const updateScrollFrame = useCallback(() => {
    if (!containerRef.current || !isLoaded) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const containerTop = rect.top + window.scrollY;
    const totalScrollable = container.offsetHeight - window.innerHeight;

    if (totalScrollable <= 0) return;

    const currentScroll = window.scrollY - containerTop;
    const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));

    const frameIndex = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));

    // Fade out sticky canvas near the very end of the scroll container to seamlessly reveal Login page
    const stickyEl = container.querySelector('.scroll-intro-sticky');
    if (stickyEl) {
      if (progress > 0.92) {
        const fadeProgress = (progress - 0.92) / 0.08;
        stickyEl.style.opacity = String(1 - fadeProgress);
      } else {
        stickyEl.style.opacity = '1';
      }
    }

    // Hide scroll hint once user starts scrolling
    if (hintRef.current) {
      hintRef.current.style.opacity = progress > 0.02 ? '0' : '1';
    }

    if (frameIndex !== lastFrameIndexRef.current) {
      lastFrameIndexRef.current = frameIndex;
      renderFrame(frameIndex);
    }
  }, [isLoaded, totalFrames, renderFrame]);

  // Attach passive scroll listener and handle animation frame loop
  useEffect(() => {
    if (!isLoaded) return;

    handleResize();
    updateScrollFrame();

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        rafRef.current = requestAnimationFrame(() => {
          updateScrollFrame();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isLoaded, handleResize, updateScrollFrame]);

  return (
    <>
      {/* Preloading Screen */}
      {!isLoaded && (
        <div className="scroll-intro-loader">
          <span className="scroll-intro-loader-title">Initializing CyberShield AI...</span>
          <div className="scroll-intro-loader-bar-track">
            <div
              className="scroll-intro-loader-bar-fill"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <span className="scroll-intro-loader-percent">{loadProgress}%</span>
        </div>
      )}

      {/* Scroll-driven Animation Track */}
      <div ref={containerRef} className="scroll-intro-container">
        <div className="scroll-intro-sticky">
          <canvas ref={canvasRef} className="scroll-intro-canvas" />

          {/* Scroll Hint Overlay */}
          <div ref={hintRef} className="scroll-intro-hint">
            <div className="scroll-intro-mouse">
              <div className="scroll-intro-wheel" />
            </div>
            <span>Scroll Down to Initialize</span>
          </div>
        </div>
      </div>
    </>
  );
});

export default ScrollIntro;

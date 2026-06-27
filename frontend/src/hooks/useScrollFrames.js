import { useState, useEffect, useRef, useMemo } from 'react';

const TOTAL_FRAMES = 240;

export function useScrollFrames() {
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const imagesRef = useRef([]);

  const frameUrls = useMemo(() => {
    const urls = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      urls.push(`/intro-frames/ezgif-frame-${String(i).padStart(3, '0')}.jpg`);
    }
    return urls;
  }, []);

  useEffect(() => {
    let loadedCount = 0;
    let isCancelled = false;
    const images = new Array(TOTAL_FRAMES);

    const handleSingleLoad = () => {
      loadedCount++;
      if (!isCancelled) {
        const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        setLoadProgress(pct);
        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = images;
          setIsLoaded(true);
        }
      }
    };

    frameUrls.forEach((url, idx) => {
      const img = new Image();
      img.src = url;
      img.onload = handleSingleLoad;
      img.onerror = handleSingleLoad; // prevent getting stuck if any single frame fails
      images[idx] = img;
    });

    return () => {
      isCancelled = true;
    };
  }, [frameUrls]);

  return {
    loadProgress,
    isLoaded,
    imagesRef,
    totalFrames: TOTAL_FRAMES
  };
}

export default useScrollFrames;

import { useState, useCallback } from 'react';

/**
 * useIntro – Controls whether the cinematic intro should play.
 *
 * Rules:
 *  • Plays once per browser session (sessionStorage gate).
 *  • Page refresh → plays again.
 *  • In-app navigation → never replays.
 */
export default function useIntro() {
  const SESSION_KEY = 'cybershield_intro_played';

  const [introComplete, setIntroComplete] = useState(() => {
    // If sessionStorage already has the flag, skip the intro entirely
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });

  const markIntroComplete = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // sessionStorage unavailable (e.g. incognito in some browsers)
    }
    setIntroComplete(true);
  }, []);

  return {
    shouldShowIntro: !introComplete,
    markIntroComplete,
  };
}

import { useCallback, useEffect, useState } from 'react';

/** Simple seconds countdown with restart. Ticks only while running. */
export function useCountdown(seconds: number, autoStart = true) {
  const [secondsLeft, setSecondsLeft] = useState(autoStart ? seconds : 0);
  const isRunning = secondsLeft > 0;

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const restart = useCallback(() => setSecondsLeft(seconds), [seconds]);

  return { secondsLeft, isRunning, restart };
}

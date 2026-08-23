import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * Pauses playback when the internet connection is lost and resumes it
 * automatically once the connection is restored.
 *
 * Handles two cases:
 * 1. Browser `offline` / `online` events.
 * 2. Streams that stall mid-buffer while navigator.onLine is already false.
 */
export function useNetworkPlaybackGuard(
  audioRef: React.RefObject<HTMLAudioElement>,
  isPlaying: boolean,
  togglePlay: () => void
) {
  const isPlayingRef = useRef(isPlaying);
  const pausedByNetworkRef = useRef(false);
  const resumeTimeRef = useRef(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const pauseForNetwork = () => {
      const audio = audioRef.current;
      if (!audio || pausedByNetworkRef.current) return;
      if (!isPlayingRef.current) return;

      pausedByNetworkRef.current = true;
      resumeTimeRef.current = audio.currentTime || 0;
      try { audio.pause(); } catch { void 0; }
      togglePlay(); // reflect paused state in the UI/store
      toast({
        title: 'Connection lost',
        description: 'Playback paused. It will resume when you are back online.',
      });
    };

    const resumeAfterNetwork = () => {
      const audio = audioRef.current;
      if (!audio || !pausedByNetworkRef.current) return;
      pausedByNetworkRef.current = false;

      const restore = () => {
        if (resumeTimeRef.current > 0 && Math.abs(audio.currentTime - resumeTimeRef.current) > 1) {
          try { audio.currentTime = resumeTimeRef.current; } catch { void 0; }
        }
        audio.play().catch(() => {
          // Media may have been evicted while offline: reload then retry once.
          try {
            audio.load();
            audio.addEventListener(
              'loadedmetadata',
              () => {
                try { audio.currentTime = resumeTimeRef.current; } catch { void 0; }
                audio.play().catch(() => {});
              },
              { once: true }
            );
          } catch { void 0; }
        });
      };

      // Flip the store back to playing, then actually resume.
      if (!isPlayingRef.current) togglePlay();
      setTimeout(restore, 150);

      toast({
        title: 'Back online',
        description: 'Resuming playback.',
      });
    };

    const handleStall = () => {
      if (navigator.onLine) return;
      pauseForNetwork();
    };

    window.addEventListener('offline', pauseForNetwork);
    window.addEventListener('online', resumeAfterNetwork);

    const audio = audioRef.current;
    audio?.addEventListener('stalled', handleStall);
    audio?.addEventListener('error', handleStall);
    audio?.addEventListener('waiting', handleStall);

    return () => {
      window.removeEventListener('offline', pauseForNetwork);
      window.removeEventListener('online', resumeAfterNetwork);
      audio?.removeEventListener('stalled', handleStall);
      audio?.removeEventListener('error', handleStall);
      audio?.removeEventListener('waiting', handleStall);
    };
  }, [audioRef, togglePlay]);
}

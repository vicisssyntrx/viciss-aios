import { useEffect, useRef } from "react";

/**
 * useTouchSound
 *
 * Plays a whisper-soft synthetic tap on every mobile touchstart event.
 * Uses the Web Audio API — no audio files, no network requests.
 *
 * The AudioContext is lazily created on the first touch (browsers require
 * a user gesture before audio can play). Subsequent taps reuse the same
 * context so there is zero latency overhead.
 */
export function useTouchSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Only register on actual touch devices to avoid running on desktop.
    if (!("ontouchstart" in window)) return;

    function playTap() {
      // Lazily initialise AudioContext on first gesture.
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }

      const ctx = ctxRef.current;

      // Resume if suspended (e.g., after page visibility change).
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // ── Primary tone: a short, airy click ──────────────────────────────
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      // Slight pitch drop for a natural feel
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);

      // ── Noise burst: adds texture so it sounds tactile, not synthetic ──
      const bufferSize = ctx.sampleRate * 0.035; // 35 ms of noise
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.06, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      // High-pass the noise so it sounds like a surface click, not a thump
      const highPass = ctx.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = 3000;

      noiseSource.connect(highPass);
      highPass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 0.04);
    }

    // Use capture phase so the sound fires before any React handler
    document.addEventListener("touchstart", playTap, { passive: true, capture: true });

    return () => {
      document.removeEventListener("touchstart", playTap, { capture: true });
    };
  }, []);
}

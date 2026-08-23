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

    function playTap(e: TouchEvent) {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Filter: only play sound for toggle buttons, switches, inputs, links, or custom clickables
      if (target.closest(".no-sound")) return;
      const isInteractive = target.closest(
        "button, a, input, select, textarea, [role='button'], .cursor-pointer, [data-state], .clickable, .switch"
      );
      if (!isInteractive) return;

      // Lazily initialise AudioContext on first gesture.
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = ctxRef.current;

      // Resume if suspended (e.g., after page visibility change).
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // ── Tone 1: Liquid Bloop (Rising Pitch) ──────────────────────────────
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(180, now);
      osc1.frequency.exponentialRampToValueAtTime(1000, now + 0.04);

      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.06);

      // ── Tone 2: High Water Pop Click (Decaying Pitch) ───────────────────
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1500, now);
      osc2.frequency.exponentialRampToValueAtTime(700, now + 0.015);

      gain2.gain.setValueAtTime(0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now);
      osc2.stop(now + 0.025);
    }

    // Use capture phase so the sound fires before any React handler
    document.addEventListener("touchstart", playTap, { passive: true, capture: true });

    return () => {
      document.removeEventListener("touchstart", playTap, { capture: true });
    };
  }, []);
}

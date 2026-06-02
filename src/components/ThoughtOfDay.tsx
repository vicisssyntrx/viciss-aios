import { useMemo } from "react";
import { RotateCcw } from "lucide-react";

const BUILT_IN_QUOTES: { text: string; author: string }[] = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "You'll never change your life until you change something you do daily.", author: "John C. Maxwell" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
];

interface Props {
  onFlipBack: () => void;
}

export default function ThoughtOfDay({ onFlipBack }: Props) {
  const quote = useMemo(() => {
    const stored = localStorage.getItem("vicissometer-quotes");
    let pool = BUILT_IN_QUOTES;
    if (stored) {
      try {
        const parsed: { text: string; author: string }[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) pool = parsed;
      } catch {
        // fall back to built-in
      }
    }
    const start = new Date(new Date().getFullYear(), 0, 1);
    const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86_400_000);
    return pool[dayOfYear % pool.length];
  }, []);

  return (
    <div
      className="glass rounded-2xl p-5 flex flex-col items-center justify-center gap-4 cursor-pointer select-none h-full"
      onClick={onFlipBack}
    >
      <span className="text-4xl">💭</span>
      <blockquote className="text-center text-foreground/90 text-sm md:text-base italic leading-relaxed font-medium max-w-[320px]">
        "{quote.text}"
      </blockquote>
      <p className="text-xs md:text-sm text-muted-foreground font-semibold">— {quote.author}</p>
      <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1 mt-auto">
        <RotateCcw className="w-2.5 h-2.5" /> tap to flip back
      </p>
    </div>
  );
}

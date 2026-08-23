import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export default function Greeting() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const name = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();

  let greeting = "";
  let message = "";

  if (hour >= 5 && hour < 12) {
    greeting = `Good Morning,\n${name} ☀️`;
    message = "Rise and grind. Today's 1% starts now.";
  } else if (hour >= 12 && hour < 17) {
    greeting = `Good Afternoon,\n${name} 🌤️`;
    message = "Halfway through. Keep the momentum alive.";
  } else if (hour >= 17 && hour < 21) {
    greeting = `Good Evening,\n${name} 🌙`;
    message = "Reflect and finish strong. Every rep counts.";
  } else {
    greeting = `Good Night,\n${name} 🌌`;
    message = "Rest well. Tomorrow is another 1%.";
  }

  const fullGreeting = useMemo(() => greeting, [greeting]);
  const [typedGreeting, setTypedGreeting] = useState(fullGreeting);

  useEffect(() => {
    const key = "viciss_greeting_typed_once";
    const alreadyTyped = sessionStorage.getItem(key) === "true";
    if (alreadyTyped) {
      setTypedGreeting(fullGreeting);
      return;
    }

    let idx = 0;
    setTypedGreeting("");
    const timer = window.setInterval(() => {
      idx += 1;
      setTypedGreeting(fullGreeting.slice(0, idx));
      if (idx >= fullGreeting.length) {
        window.clearInterval(timer);
        sessionStorage.setItem(key, "true");
      }
    }, 24);

    return () => window.clearInterval(timer);
  }, [fullGreeting]);

  return (
    <div className="relative px-5 sm:px-6 pt-6 pb-4 rounded-b-3xl">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        {hour >= 5 && hour < 12 && (
          /* Morning: Sunlight Glowing */
          <div className="absolute right-0 -top-10 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        )}
        {hour >= 12 && hour < 17 && (
          /* Afternoon: Floating Clouds */
          <div className="absolute right-0 top-0 w-full h-full opacity-40 overflow-hidden">
            <div className="absolute top-2 right-[10%] w-24 h-8 bg-slate-300/30 rounded-full blur-xl animate-[translate-x_20s_linear_infinite]" />
            <div className="absolute top-6 right-[40%] w-32 h-10 bg-slate-300/20 rounded-full blur-xl animate-[translate-x_25s_linear_infinite_reverse]" />
          </div>
        )}
        {hour >= 17 && hour < 21 && (
          /* Evening: Sunset Hue */
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full max-w-lg h-32 bg-orange-500/15 blur-3xl rounded-full animate-[pulse_6s_ease-in-out_infinite]" />
        )}
        {hour >= 21 || hour < 5 ? (
          /* Night: Moon Glow */
          <div className="absolute right-8 top-4 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl animate-[pulse_5s_ease-in-out_infinite]" />
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-[860px] relative z-10">
        <h2 className="text-5xl md:text-6xl font-black text-foreground leading-tight whitespace-pre-wrap">{typedGreeting}</h2>
        <p className="text-base md:text-lg text-muted-foreground mt-0.5">{message}</p>
      </div>
    </div>
  );
}

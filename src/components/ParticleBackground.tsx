import { useEffect, useState } from "react";

export default function ParticleBackground() {
  const [bgStyle, setBgStyle] = useState(() => {
    return localStorage.getItem("vicissometer-bg-style") || "solid";
  });

  useEffect(() => {
    const handleChanged = () => {
      setBgStyle(localStorage.getItem("vicissometer-bg-style") || "solid");
    };
    window.addEventListener("vicissometer-bg-changed", handleChanged);
    return () => {
      window.removeEventListener("vicissometer-bg-changed", handleChanged);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
      {bgStyle === "aura" && (
        <>
          <div className="absolute inset-0 bg-style-aura animate-fade-in" />
          <div className="absolute bottom-16 left-0 right-0 bg-style-horizon-line" />
        </>
      )}
      {bgStyle === "waves" && (
        <>
          <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-style-waves-1" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-style-waves-2" />
        </>
      )}
      {bgStyle === "beam" && (
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-style-beam-glow" />
      )}
    </div>
  );
}



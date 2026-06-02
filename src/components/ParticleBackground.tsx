import { useEffect, useRef, useState } from "react";

export default function ParticleBackground() {
  const [bgStyle, setBgStyle] = useState(() => {
    return localStorage.getItem("vicissometer-bg-style") || "solid";
  });

  // Physics animation frame reference
  const requestRef = useRef<number | null>(null);

  // DOM references for Moving Orbits (Zero-re-render high performance updates)
  const orbit1Ref = useRef<HTMLDivElement>(null);
  const orbit2Ref = useRef<HTMLDivElement>(null);

  const physicsRef = useRef({
    r: { x: 20, y: 30, vx: 0.035, vy: 0.045 }, // Red drift velocities
    b: { x: 70, y: 60, vx: -0.045, vy: 0.025 } // Blue drift velocities
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

  useEffect(() => {
    if (bgStyle !== "orbit-moving") {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    const state = physicsRef.current;

    const updatePhysics = () => {
      // Step Red position
      state.r.x += state.r.vx;
      state.r.y += state.r.vy;

      // Step Blue position
      state.b.x += state.b.vx;
      state.b.y += state.b.vy;

      // Boundary Collisions (Red)
      if (state.r.x <= 15) {
        state.r.x = 15;
        state.r.vx = Math.abs(state.r.vx); // Bounce right
      } else if (state.r.x >= 85) {
        state.r.x = 85;
        state.r.vx = -Math.abs(state.r.vx); // Bounce left
      }

      if (state.r.y <= 15) {
        state.r.y = 15;
        state.r.vy = Math.abs(state.r.vy); // Bounce down
      } else if (state.r.y >= 85) {
        state.r.y = 85;
        state.r.vy = -Math.abs(state.r.vy); // Bounce up
      }

      // Boundary Collisions (Blue)
      if (state.b.x <= 15) {
        state.b.x = 15;
        state.b.vx = Math.abs(state.b.vx); // Bounce right
      } else if (state.b.x >= 85) {
        state.b.x = 85;
        state.b.vx = -Math.abs(state.b.vx); // Bounce left
      }

      if (state.b.y <= 15) {
        state.b.y = 15;
        state.b.vy = Math.abs(state.b.vy); // Bounce down
      } else if (state.b.y >= 85) {
        state.b.y = 85;
        state.b.vy = -Math.abs(state.b.vy); // Bounce up
      }

      // High performance DOM updates - bypassed React VDOM rendering completely!
      if (orbit1Ref.current) {
        orbit1Ref.current.style.left = `${state.r.x}vw`;
        orbit1Ref.current.style.top = `${state.r.y}vh`;
      }
      if (orbit2Ref.current) {
        orbit2Ref.current.style.left = `${state.b.x}vw`;
        orbit2Ref.current.style.top = `${state.b.y}vh`;
      }

      requestRef.current = requestAnimationFrame(updatePhysics);
    };

    requestRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [bgStyle]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
      {bgStyle === "pulse" && (
        <div className="absolute inset-0 bg-style-horizon-pulse" />
      )}
      {bgStyle === "orbit-static" && (
        <div className="absolute bg-style-orbit-static" />
      )}
      {bgStyle === "orbit-moving" && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Red Orbit */}
          <div
            ref={orbit1Ref}
            className="absolute rounded-full filter blur-[50px] transition-transform duration-75 select-none pointer-events-none bg-orbit-red"
            style={{
              left: `${physicsRef.current.r.x}vw`,
              top: `${physicsRef.current.r.y}vh`,
              transform: "translate(-50%, -50%)",
              width: "min(480px, 70vw)",
              height: "min(480px, 70vw)",
              mixBlendMode: "screen",
            }}
          />
          {/* Blue Orbit */}
          <div
            ref={orbit2Ref}
            className="absolute rounded-full filter blur-[50px] transition-transform duration-75 select-none pointer-events-none bg-orbit-blue"
            style={{
              left: `${physicsRef.current.b.x}vw`,
              top: `${physicsRef.current.b.y}vh`,
              transform: "translate(-50%, -50%)",
              width: "min(480px, 70vw)",
              height: "min(480px, 70vw)",
              mixBlendMode: "screen",
            }}
          />
        </div>
      )}
    </div>
  );
}



import { useEffect } from "react";

export function useLiquidPhysics() {
  useEffect(() => {
    let activeCard: HTMLElement | null = null;
    let cachedRect: DOMRect | null = null;
    let transitionTimeout: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      // Find the closest parent glass card
      const target = e.target as HTMLElement;
      const card = target.closest(".glass, .glass-strong") as HTMLElement | null;

      // Handle card change (mouse enters a new card, or leaves the active one)
      if (card !== activeCard) {
        if (activeCard) {
          resetCard(activeCard);
        }
        activeCard = card;
        if (card) {
          cachedRect = card.getBoundingClientRect(); // Query ONCE when mouse enters the card!
          
          // Apply active card transition for the initial springy tilt entry
          card.style.transition = "transform 280ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 280ms cubic-bezier(0.16, 1, 0.3, 1)";
          
          if (transitionTimeout) {
            clearTimeout(transitionTimeout);
          }
          
          const currentCard = card;
          transitionTimeout = window.setTimeout(() => {
            if (activeCard === currentCard) {
              // Once scaled/tilted into place, disable transform transition to ensure 120 FPS tracking
              currentCard.style.transition = "box-shadow 280ms cubic-bezier(0.16, 1, 0.3, 1)";
            }
          }, 280);
        } else {
          cachedRect = null;
          if (transitionTimeout) {
            clearTimeout(transitionTimeout);
            transitionTimeout = null;
          }
        }
      }

      if (!card || !cachedRect) return;

      // Use cached bounds - completely prevents layout thrashing on mousemove!
      const rect = cachedRect;

      // 1. Calculate local coordinates relative to top-left of the card
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to percentages
      const xp = (x / rect.width) * 100;
      const yp = (y / rect.height) * 100;

      // Set CSS variables for liquid light reflections
      card.style.setProperty("--mouse-x", `${xp}%`);
      card.style.setProperty("--mouse-y", `${yp}%`);
      card.style.setProperty("--mouse-px", `${x}px`);
      card.style.setProperty("--mouse-py", `${y}px`);

      // 2. Compute 3D tilt angles (Tactile Physics)
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const maxTilt = 5.5; // Subtle and premium
      const ry = (deltaX / (rect.width / 2)) * maxTilt;
      const rx = -(deltaY / (rect.height / 2)) * maxTilt;

      // Set 3D transform with slight scale up
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.018, 1.018, 1.018)`;
      
      // Make dark shadows deeper on tilt
      if (document.documentElement.classList.contains("dark")) {
        card.style.boxShadow = "0 22px 50px rgba(0, 0, 0, 0.45)";
      } else {
        card.style.boxShadow = "0 18px 40px rgba(0, 0, 0, 0.08)";
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      // If cursor leaves the document body entirely
      if (activeCard) {
        resetCard(activeCard);
        activeCard = null;
        cachedRect = null;
      }
    };

    const resetCard = (card: HTMLElement) => {
      if (transitionTimeout) {
        clearTimeout(transitionTimeout);
        transitionTimeout = null;
      }
      
      // Apply exit transition for card returning to rest
      card.style.transition = "transform 320ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 320ms cubic-bezier(0.16, 1, 0.3, 1)";
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      card.style.removeProperty("--mouse-x");
      card.style.removeProperty("--mouse-y");
      card.style.removeProperty("--mouse-px");
      card.style.removeProperty("--mouse-py");
      card.style.boxShadow = "";
      
      const currentCard = card;
      setTimeout(() => {
        if (currentCard && currentCard.style.transform === "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)") {
          currentCard.style.removeProperty("transition");
        }
      }, 330);
    };

    // Bind listeners
    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
      if (activeCard) {
        resetCard(activeCard);
      }
    };
  }, []);
}

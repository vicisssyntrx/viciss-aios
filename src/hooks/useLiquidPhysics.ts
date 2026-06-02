import { useEffect } from "react";

export function useLiquidPhysics() {
  useEffect(() => {
    // Only initialize and track cursor physics on desktop viewports/pointer devices
    const isHoverSupported = window.matchMedia("(hover: hover)").matches;
    if (!isHoverSupported) return;

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
          
          // Apply transition for a smooth scale-up entry
          card.style.transition = "transform 240ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 240ms cubic-bezier(0.16, 1, 0.3, 1)";
          
          if (transitionTimeout) {
            clearTimeout(transitionTimeout);
          }
          
          const currentCard = card;
          transitionTimeout = window.setTimeout(() => {
            if (activeCard === currentCard) {
              // Disable transition once scaled to ensure 120 FPS cursor tracking
              currentCard.style.transition = "box-shadow 240ms cubic-bezier(0.16, 1, 0.3, 1)";
            }
          }, 240);
        } else {
          cachedRect = null;
          if (transitionTimeout) {
            clearTimeout(transitionTimeout);
            transitionTimeout = null;
          }
        }
      }

      if (!card || !cachedRect) return;

      // Use cached bounds to prevent layout thrashing
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

      // 2. Scale up purely in 2D to keep the 1px border outline razor-sharp and intact!
      card.style.transform = "scale3d(1.015, 1.015, 1.015)";
      
      // Make dark shadows deeper on hover
      if (document.documentElement.classList.contains("dark")) {
        card.style.boxShadow = "0 18px 45px rgba(0, 0, 0, 0.45)";
      } else {
        card.style.boxShadow = "0 14px 35px rgba(0, 0, 0, 0.08)";
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
      
      // Apply smooth exit transition back to rest state
      card.style.transition = "transform 280ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 280ms cubic-bezier(0.16, 1, 0.3, 1)";
      card.style.transform = "scale3d(1, 1, 1)";
      card.style.removeProperty("--mouse-x");
      card.style.removeProperty("--mouse-y");
      card.style.removeProperty("--mouse-px");
      card.style.removeProperty("--mouse-py");
      card.style.boxShadow = "";
      
      const currentCard = card;
      setTimeout(() => {
        if (currentCard && currentCard.style.transform === "scale3d(1, 1, 1)") {
          currentCard.style.removeProperty("transition");
        }
      }, 290);
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

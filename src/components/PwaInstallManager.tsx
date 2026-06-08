import { useEffect } from "react";
import { toast } from "sonner";
import {
  DeferredInstallPromptEvent,
  getInstallLabel,
  isRunningStandalone,
} from "@/lib/pwa";

const INSTALL_NUDGE_KEY = "viciss_install_nudged";

export default function PwaInstallManager() {
  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as DeferredInstallPromptEvent;
      promptEvent.preventDefault();
      window.__vicissInstallPromptEvent = promptEvent;

      if (isRunningStandalone() || localStorage.getItem(INSTALL_NUDGE_KEY) === "true") {
        return;
      }
      
      // Store event silently, remove annoying popup
      localStorage.setItem(INSTALL_NUDGE_KEY, "true");
    };

    const onInstalled = () => {
      window.__vicissInstallPromptEvent = undefined;
      toast.success("Viciss AIOS installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}

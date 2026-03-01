import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

if ("serviceWorker" in navigator) {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1";

  window.addEventListener("load", () => {
    if (import.meta.env.DEV || isLocalhost) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {
            // no-op
          });
        });
      });
      if ("caches" in window) {
        caches.keys().then((cacheKeys) => {
          cacheKeys.forEach((key) => {
            caches.delete(key).catch(() => {
              // no-op
            });
          });
        });
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // no-op: keep app functional even when SW registration fails
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

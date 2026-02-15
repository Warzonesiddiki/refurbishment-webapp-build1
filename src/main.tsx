import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { registerServiceWorker } from "@/utils/pwa";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register PWA worker (non-blocking)
void registerServiceWorker();

if (import.meta.env.DEV) {
  // Debug breadcrumb for local PWA/lifecycle verification
  // eslint-disable-next-line no-console
  console.info("PWA lifecycle bootstrap complete");
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import PiwikPro from "@piwikpro/react-piwik-pro";
import "./index.css";

PiwikPro.initialize(
  "ac075102-eefb-4bea-b73c-b7670783c6d6",
  "https://marvelous-zuccutto-69c422.piwik.pro"
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

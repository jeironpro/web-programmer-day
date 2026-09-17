// Entry point: montamos React, importamos estilos globales y la fuente variable.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/jetbrains-mono";
import "@/styles/tokens.css";
import "@/styles/global.css";
import App from "./App";

const container = document.getElementById("root");
if (!container) throw new Error("No se encontró #root en index.html");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

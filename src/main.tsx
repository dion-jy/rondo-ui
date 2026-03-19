import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./components/ThemeProvider";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);

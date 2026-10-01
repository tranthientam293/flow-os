import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "@fontsource-variable/inter";
import "@fontsource/source-code-pro/400.css";
import "@fontsource/source-code-pro/500.css";
import "./styles/index.css";
import { AppProviders } from "@/providers";
import { router } from "@/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);

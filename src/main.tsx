
  import { createRoot } from "react-dom/client";
  import { GoogleOAuthProvider } from '@react-oauth/google';
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/globals.css";

  const GOOGLE_CLIENT_ID = "566749054982-pg3osu14147gs0amg2lpgqlquu1a62pj.apps.googleusercontent.com";

  createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );
  
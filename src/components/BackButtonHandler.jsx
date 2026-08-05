import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

// Routes considered "root" screens — pressing back here shows an exit
// confirmation (double-back-to-exit) instead of navigating further back,
// since there's nowhere meaningful left to go within the app.
const ROOT_ROUTES = ["/", "/browse", "/tenant/dashboard", "/landlord/dashboard", "/admin/dashboard"];

export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  const lastBackPressRef = useRef(0);

  // Keep a ref of the current location so the listener (registered once)
  // always reads the latest path instead of a stale closure value.
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return; // web browser — nothing to do

    let listener;

    const setup = async () => {
      listener = await App.addListener("backButton", () => {
        const currentPath = locationRef.current.pathname;
        const isRoot = ROOT_ROUTES.includes(currentPath);

        if (!isRoot) {
          // Not on a root screen — just go back within the app's history
          navigate(-1);
          return;
        }

        // On a root screen — require a second back-press within 2 seconds to actually exit
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          App.exitApp();
        } else {
          lastBackPressRef.current = now;
          // Lightweight, non-blocking feedback — reuses whatever toast/alert
          // pattern feels right; a simple browser-native fallback for now.
          window.dispatchEvent(new CustomEvent("tierhome:back-to-exit-hint"));
        }
      });
    };

    setup();

    return () => {
      if (listener) listener.remove();
    };
  }, [navigate]);

  return null; // renders nothing — purely a side-effect handler
}

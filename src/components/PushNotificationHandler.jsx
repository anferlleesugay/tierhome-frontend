import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

/**
 * Handles push notification permission + device token registration.
 * Only does anything when running inside the native Capacitor app —
 * on a regular web browser, Capacitor.isNativePlatform() is false and this
 * component silently does nothing, so it's safe to include in the web build too.
 */
export default function PushNotificationHandler() {
  const { token, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    if (!Capacitor.isNativePlatform()) return; // web browser — nothing to do

    let listeners = [];

    const setup = async () => {
      try {
        // Request permission
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== "granted") {
          return; // user declined — nothing more to do
        }

        // Register with FCM (native side handles getting the actual token)
        await PushNotifications.register();

        // Fired once the native side successfully gets a token from FCM
        const regListener = await PushNotifications.addListener("registration", async (tokenData) => {
          try {
            await axios.post(`${API}/device-token`,
              { token: tokenData.value, platform: "android" },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (err) {
            console.warn("Failed to register device token with backend:", err);
          }
        });
        listeners.push(regListener);

        const errListener = await PushNotifications.addListener("registrationError", (err) => {
          console.warn("Push registration error:", err);
        });
        listeners.push(errListener);

        // Fired when a push notification is tapped while the app is open/backgrounded
        const actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            const link = action.notification?.data?.link;
            if (link) navigate(link);
          }
        );
        listeners.push(actionListener);

      } catch (err) {
        console.warn("Push notification setup failed:", err);
      }
    };

    setup();

    return () => {
      listeners.forEach((l) => l.remove());
    };
  }, [isLoggedIn, token]);

  return null; // renders nothing — purely a side-effect handler
}
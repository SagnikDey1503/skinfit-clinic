import { useEffect } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { registerForPushAndSyncToken } from "@/lib/pushNotifications";

/**
 * When a saved session loads, POST the Expo push token again if notifications
 * are already allowed (handles token rotation and fresh installs).
 * Does not show the OS permission dialog (use sign-in or Notifications screen for that).
 */
export function PushTokenSync() {
  const { token, ready } = useAuth();

  useEffect(() => {
    if (!ready || !token || Platform.OS === "web") return;
    void registerForPushAndSyncToken(token, {
      verboseAlerts: false,
      requestPermission: false,
    });
  }, [ready, token]);

  return null;
}

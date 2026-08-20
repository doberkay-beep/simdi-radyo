// ŞİMDİ — Push bildirim kaydı (mobil). Uygulama açılışta jetonu alır ve
// siteye kaydeder. Sessizce başarısız olur; izin yoksa hiçbir şey olmaz.
//
// Gerçekte çalışması için: `expo install expo-notifications expo-device` ve
// bir EAS build (Expo Go push jetonu üretmez). Detaylar mobile/README.md.

import { Platform } from "react-native";

const API = "https://necaliyor.co";

// Dinamik import: paket kurulu değilse uygulama çökmeden geçer.
export async function pushKaydet(favoriler: string[] = []): Promise<void> {
  try {
    const Notifications = await import("expo-notifications").catch(() => null);
    if (!Notifications) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const izin = await Notifications.getPermissionsAsync();
    let durum = izin.status;
    if (durum !== "granted") {
      const iste = await Notifications.requestPermissionsAsync();
      durum = iste.status;
    }
    if (durum !== "granted") return;

    // EAS projectId (app.json extra.eas.projectId) gerekebilir.
    let projectId: string | undefined;
    try {
      const Constants = (await import("expo-constants")).default as {
        expoConfig?: { extra?: { eas?: { projectId?: string } } };
        easConfig?: { projectId?: string };
      };
      projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    } catch {
      // yoksay
    }

    const tokenRes = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenRes?.data;
    if (!token) return;

    await fetch(`${API}/api/push/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: Platform.OS, favoriler }),
    }).catch(() => {});
  } catch {
    // her durumda sessiz
  }
}

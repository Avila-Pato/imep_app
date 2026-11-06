// Notificaciones locales: se programan en el mismo telefono (sin servidor).
// Cuando haya backend, los avisos nuevos (ej: un anuncio recien publicado)
// llegaran como push; esto queda para los recordatorios.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// En web no hay notificaciones del sistema
export const NOTIS_DISPONIBLES = Platform.OS !== "web";

const CANAL = "iglesia";
const MAXIMO = 40; // iOS permite 64 programadas: dejamos margen

export type Aviso = { titulo: string; cuerpo: string; fecha: Date };

// Una vez al abrir la app: como mostrarlas y el canal de Android
export async function configurarNotificaciones() {
  if (!NOTIS_DISPONIBLES) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true, // en Android sin sonido no aparece el aviso
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: "Iglesia",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function tienePermiso() {
  if (!NOTIS_DISPONIBLES) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function pedirPermiso() {
  if (!NOTIS_DISPONIBLES) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

// Reemplaza todos los recordatorios por estos (solo los que aun no pasan)
export async function programarAvisos(avisos: Aviso[]) {
  if (!(await tienePermiso())) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const ahora = Date.now();
  const futuros = avisos
    .filter((a) => a.fecha.getTime() > ahora)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .slice(0, MAXIMO);
  for (const a of futuros) {
    await Notifications.scheduleNotificationAsync({
      content: { title: a.titulo, body: a.cuerpo },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: a.fecha,
        channelId: CANAL,
      },
    });
  }
}

// Para que la persona vea como llegan (en unos segundos)
export async function enviarPrueba() {
  if (!(await tienePermiso())) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "¡Así te avisaremos! 🔔",
      body: "Recibirás recordatorios de cultos, turnos y anuncios.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: CANAL,
    },
  });
}

// Notificaciones locales: se programan en el mismo telefono (sin servidor).
// Cuando haya backend, los avisos nuevos (ej: un anuncio recien publicado)
// llegaran como push; esto queda para los recordatorios.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// En web no hay notificaciones del sistema
export const NOTIS_DISPONIBLES = Platform.OS !== "web";

const CANAL = "iglesia";
const MAXIMO = 40; // iOS permite 64 programadas: dejamos margen

// url: pantalla que se abre al tocar la notificacion (ej. "/eventos")
export type Aviso = {
  titulo: string;
  cuerpo: string;
  fecha: Date;
  url?: string;
};

// Quien quiera enterarse cuando se activa el permiso (para programar ya)
const oyentesPermiso = new Set<() => void>();
export function alActivarPermiso(f: () => void) {
  oyentesPermiso.add(f);
  return () => {
    oyentesPermiso.delete(f);
  };
}

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

// Al entrar a la app (despues de la bienvenida): pregunta UNA vez. Si ya
// respondio (si o no), no insiste: puede cambiarlo en Perfil → Notificaciones
export async function pedirPermisoAlEntrar() {
  if (!NOTIS_DISPONIBLES) return;
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted || actual.status !== "undetermined") return;
  await pedirPermiso();
}

export async function pedirPermiso() {
  if (!NOTIS_DISPONIBLES) return false;
  const ok = (await Notifications.requestPermissionsAsync()).granted;
  if (ok) oyentesPermiso.forEach((f) => f());
  return ok;
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
      content: {
        title: a.titulo,
        body: a.cuerpo,
        data: a.url ? { url: a.url } : {},
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: a.fecha,
        channelId: CANAL,
      },
    });
  }
}

// Aviso inmediato (ej: el lider publica un aviso o devocional).
// Sin backend llega solo a este telefono; con push llegara a todo el grupo
export async function avisarAhora(
  titulo: string,
  cuerpo: string,
  url?: string,
) {
  if (!(await tienePermiso())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: cuerpo, data: url ? { url } : {} },
    trigger: null,
  });
}

// Para que la persona vea como llegan (en unos segundos)
export async function enviarPrueba() {
  if (!(await tienePermiso())) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "¡Así te avisaremos! 🔔",
      body: "Recibirás recordatorios de cultos, turnos, anuncios y tu sala.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: CANAL,
    },
  });
}

// Al tocar una notificacion se abre su pantalla (tambien si la app estaba
// cerrada). Devuelve la funcion para dejar de escuchar
// iglesiaId: el aviso es de esa iglesia (push de anuncios): se cambia a ella
export function escucharToques(
  abrir: (url: string, iglesiaId?: string) => void,
) {
  if (!NOTIS_DISPONIBLES) return () => {};
  const datos = (r: Notifications.NotificationResponse | null) =>
    r?.notification.request.content.data;
  const urlDe = (r: Notifications.NotificationResponse | null) => {
    const url = datos(r)?.url;
    return typeof url === "string" ? url : null;
  };
  const iglesiaDe = (r: Notifications.NotificationResponse | null) => {
    const id = datos(r)?.iglesia_id;
    return typeof id === "string" ? id : undefined;
  };
  // la app se abrio desde una notificacion
  Notifications.getLastNotificationResponseAsync()
    .then((r) => {
      const url = urlDe(r);
      if (url) {
        abrir(url, iglesiaDe(r));
        Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
      }
    })
    .catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const url = urlDe(r);
    if (url) abrir(url, iglesiaDe(r));
  });
  return () => sub.remove();
}

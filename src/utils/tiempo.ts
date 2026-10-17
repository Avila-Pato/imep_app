import { DURACION_ORACION_HORAS } from "@/constants/constans";

// "hace 5 min" | "hace 3 h" | "hace 2 d" | "12 oct"
export function haceCuanto(iso: string, ahora = new Date()) {
  const fecha = new Date(iso);
  const min = Math.max(
    0,
    Math.round((ahora.getTime() - fecha.getTime()) / 60000),
  );
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 7) return `hace ${dias} d`;
  return fecha
    .toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    .replace(".", "");
}

// Hora del mensaje dentro del chat: "14:32"
export const horaMensaje = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

const HORA_MS = 60 * 60 * 1000;

// ¿La peticion sigue en el muro? (dura DURACION_ORACION_HORAS)
export const oracionVigente = (iso: string, ahora = Date.now()) =>
  ahora - new Date(iso).getTime() < DURACION_ORACION_HORAS * HORA_MS;

// "Quedan 5 h" | "Quedan 20 min"
export function tiempoRestante(iso: string, ahora = Date.now()) {
  const fin = new Date(iso).getTime() + DURACION_ORACION_HORAS * HORA_MS;
  const min = Math.max(0, Math.round((fin - ahora) / 60000));
  return min >= 60 ? `Quedan ${Math.floor(min / 60)} h` : `Quedan ${min} min`;
}

// Fecha ISO de hace N horas (para datos de ejemplo)
export const haceHoras = (horas: number) =>
  new Date(Date.now() - horas * HORA_MS).toISOString();

import { HORARIOS_CULTO } from "@/assets/data/configMocks";
import { HorarioCulto } from "@/types/typesAnuncios";

export type ProximoCulto = {
  horario: HorarioCulto;
  fecha: Date; // dia y hora exactos
  cuando: string; // "Hoy" | "Mañana" | "Jueves"
};

const aMinutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

// El proximo culto segun la configuracion (si el de hoy ya paso, el siguiente)
export function proximoCulto(ahora = new Date()): ProximoCulto | null {
  const minutosHoy = ahora.getHours() * 60 + ahora.getMinutes();
  const candidatos = HORARIOS_CULTO.map((h) => {
    let dias = (h.dia - ahora.getDay() + 7) % 7;
    if (dias === 0 && aMinutos(h.hora) <= minutosHoy) dias = 7;
    return { h, dias };
  }).sort((a, b) => a.dias - b.dias || aMinutos(a.h.hora) - aMinutos(b.h.hora));

  const primero = candidatos[0];
  if (!primero) return null;

  const fecha = new Date(ahora);
  fecha.setDate(fecha.getDate() + primero.dias);
  const [h, m] = primero.h.hora.split(":").map(Number);
  fecha.setHours(h, m, 0, 0);

  const diaSemana = fecha.toLocaleDateString("es-ES", { weekday: "long" });
  const cuando =
    primero.dias === 0
      ? "Hoy"
      : primero.dias === 1
        ? "Mañana"
        : diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

  return { horario: primero.h, fecha, cuando };
}

// Hora de inicio del culto de esa fecha ("YYYY-MM-DD"); todos los turnos
// del dia comienzan a esa hora
export function horaCulto(fechaKey: string) {
  const [y, m, d] = fechaKey.split("-").map(Number);
  const dia = new Date(y, m - 1, d).getDay();
  return HORARIOS_CULTO.find((h) => h.dia === dia)?.hora;
}

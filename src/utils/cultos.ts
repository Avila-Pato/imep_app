import { HORARIOS_CULTO } from "@/assets/data/configMocks";
import { HorarioCulto } from "@/types/typesAnuncios";
import { Turno } from "@/types/typesCronogramas";

// Horarios de la iglesia activa (los pone el store al cambiar de iglesia).
// Sin configurar se usan unos de ejemplo; [] = la iglesia no tiene cultos fijos
let actuales: HorarioCulto[] = HORARIOS_CULTO;
export function usarHorarios(horarios?: HorarioCulto[]) {
  actuales = horarios ?? HORARIOS_CULTO;
}
export const horariosActuales = () => actuales;

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
  const candidatos = actuales.map((h) => {
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
  // si hay varios cultos ese dia, el primero
  return actuales
    .filter((h) => h.dia === dia)
    .sort((a, b) => a.hora.localeCompare(b.hora))[0]?.hora;
}

// Hora de un turno: la que puso el admin o, si no, la del culto
export const horaTurno = (t: Pick<Turno, "fecha" | "hora">) =>
  t.hora ?? horaCulto(t.fecha);

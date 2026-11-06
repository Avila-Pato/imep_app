import { TURNOS } from "@/assets/data/cronogramasMocks";
import { Turno } from "@/types/typesCronogramas";

// Turnos de ejemplo + los que asigno el administrador.
// Si el admin edito un dia, ese dia usa solo su version.
export function unirTurnos(editados: Record<string, Turno[]>) {
  return [
    ...TURNOS.filter((t) => !(t.fecha in editados)),
    ...Object.values(editados).flat(),
  ];
}

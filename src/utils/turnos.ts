import { Turno } from "@/types/typesCronogramas";

// Todos los turnos que asigno el administrador (sin turnos de prueba)
export function unirTurnos(editados: Record<string, Turno[]>) {
  return Object.values(editados).flat();
}

import { unirseConCodigo } from "@/services/iglesias";
import {
  aceptarInvitacion,
  unirseAIglesia,
  useEstudios,
  useGrupos,
} from "@/store/estudios";
import { leerInvitacion } from "@/utils/invitacion";

export type Unido = { grupo?: string; sala?: string; iglesia?: string };

// Unirse a la iglesia (y a una sala) con un codigo o enlace del pastor.
// Primero pregunta al servidor (codigos reales de cualquier iglesia); si no
// esta conectado o no lo conoce, prueba con los codigos de este telefono.
// Devuelve a que se unio, o null si el codigo no sirve
export function useUnirse() {
  const grupos = useGrupos();
  const { codigos, nombre } = useEstudios();

  return async (texto: string): Promise<Unido | null> => {
    try {
      const r = await unirseConCodigo(texto, nombre);
      if (r) {
        unirseAIglesia(r.iglesia, r.sala);
        return {
          grupo: r.sala,
          sala: grupos.find((g) => g.id === r.sala)?.label,
          iglesia: r.iglesia.sede,
        };
      }
    } catch (e) {
      console.warn("[supabase]", (e as Error)?.message ?? e);
    }

    const { valida, grupo, codigo } = leerInvitacion(texto, grupos, codigos);
    if (!valida) return null;
    aceptarInvitacion(grupo, codigo);
    return { grupo, sala: grupos.find((g) => g.id === grupo)?.label };
  };
}

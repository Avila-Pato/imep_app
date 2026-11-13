import { conectado, unirseConCodigo } from "@/services/iglesias";
import {
  aceptarInvitacion,
  unirseAIglesia,
  useEstudios,
  useGrupos,
} from "@/store/estudios";
import { leerInvitacion } from "@/utils/invitacion";

export type Unido = { grupo?: string; sala?: string; iglesia?: string };

// Unirse a la iglesia (y a una sala) con un codigo o enlace del pastor.
// Con servidor manda el servidor: un codigo que no existe no sirve. Sin
// servidor (modo de prueba) se usan los codigos de este telefono.
// Devuelve a que se unio, o null si el codigo no sirve
export function useUnirse() {
  const grupos = useGrupos();
  const { codigos, nombre } = useEstudios();

  return async (texto: string): Promise<Unido | null> => {
    if (conectado()) {
      try {
        const r = await unirseConCodigo(texto, nombre);
        if (!r) return null; // no existe: no se deja pasar
        unirseAIglesia(r.iglesia, r.sala);
        return {
          grupo: r.sala,
          sala: grupos.find((g) => g.id === r.sala)?.label,
          iglesia: r.iglesia.sede,
        };
      } catch (e) {
        console.warn("[supabase]", (e as Error)?.message ?? e);
        return null;
      }
    }

    const { valida, grupo, codigo } = leerInvitacion(texto, grupos, codigos);
    if (!valida) return null;
    aceptarInvitacion(grupo, codigo);
    return { grupo, sala: grupos.find((g) => g.id === grupo)?.label };
  };
}

import { aceptarInvitacion, useEstudios, useGrupos } from "@/store/estudios";
import { leerInvitacion } from "@/utils/invitacion";

// Unirse a la iglesia (y a una sala) con un codigo o enlace del pastor.
// Devuelve a que se unio, o null si el codigo no sirve
export function useUnirse() {
  const grupos = useGrupos();
  const { codigos } = useEstudios();

  return (texto: string) => {
    const { valida, grupo, codigo } = leerInvitacion(texto, grupos, codigos);
    if (!valida) return null;
    aceptarInvitacion(grupo, codigo);
    return { grupo, sala: grupos.find((g) => g.id === grupo)?.label };
  };
}

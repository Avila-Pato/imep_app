import { GRUPOS } from "@/constants/constans";
import { GrupoId } from "@/types/typesComunidad";

// Busca el grupo dentro del enlace o codigo (ej: imepapp://sala/jovenes).
// Mock: luego el enlace lo valida el servidor.
export function grupoDeInvitacion(texto: string): GrupoId | undefined {
  const limpio = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return GRUPOS.find((g) => g.id !== "general" && limpio.includes(g.id))?.id;
}

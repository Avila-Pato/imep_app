import { GRUPOS } from "@/constants/constans";
import type { CodigoInvitacion } from "@/store/estudios";
import { Grupo, GrupoId } from "@/types/typesComunidad";

const limpiar = (texto: string) =>
  texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Busca la sala dentro del enlace o codigo (ej: imepapp://sala/jovenes).
// "grupos": todas las salas (las de base y las que creo el pastor).
// Mock: luego el enlace lo valida el servidor.
export function grupoDeInvitacion(
  texto: string,
  grupos: Grupo[] = GRUPOS,
): GrupoId | undefined {
  const limpio = limpiar(texto);
  // la mas larga primero (para que "jovenes-2" gane sobre "jovenes")
  return [...grupos]
    .filter((g) => g.id !== "general")
    .sort((a, b) => b.id.length - a.id.length)
    .find((g) => limpio.includes(g.id))?.id;
}

// Invitacion del pastor: a la iglesia (ej: imepapp://iglesia) o a la iglesia
// y un grupo (ej: imepapp://sala/jovenes). Mock: sin backend
export function leerInvitacion(
  texto: string,
  grupos: Grupo[] = GRUPOS,
  codigos: Partial<Record<GrupoId, CodigoInvitacion>> = {},
): { valida: boolean; grupo?: GrupoId; codigo?: string } {
  // 1) codigo generado por el pastor: "IMEP-4K7Q", "4K7Q" o
  //    "imepapp://unirse/4K7Q" (el de la iglesia no trae sala)
  const mayus = texto.toUpperCase();
  const deCodigo = (Object.keys(codigos) as GrupoId[]).find((g) => {
    const c = codigos[g]?.codigo;
    return !!c && mayus.includes(c);
  });
  if (deCodigo) {
    return {
      valida: true,
      grupo: deCodigo === "general" ? undefined : deCodigo,
      codigo: codigos[deCodigo]?.codigo,
    };
  }

  // 2) enlaces de prueba con el nombre de la sala o la palabra "iglesia"
  const grupo = grupoDeInvitacion(texto, grupos);
  const limpio = limpiar(texto);
  const valida =
    !!grupo ||
    ["iglesia", "imep", "invitacion"].some((p) => limpio.includes(p));
  return { valida, grupo };
}

// Como se muestra y comparte un codigo
export const codigoVisible = (codigo: string) => `IMEP-${codigo}`;
export const enlaceDeCodigo = (codigo: string) => `imepapp://unirse/${codigo}`;

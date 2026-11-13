import { GRUPOS } from "@/constants/constans";
import type { CodigoInvitacion } from "@/store/estudios";
import { Grupo, GrupoId } from "@/types/typesComunidad";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Linking from "expo-linking";

const limpiar = (texto: string) =>
  texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Busca la sala dentro del enlace o codigo (ej: congrega://sala/jovenes).
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

// Invitacion del pastor: a la iglesia (ej: congrega://iglesia) o a la iglesia
// y un grupo (ej: congrega://sala/jovenes). Mock: sin backend
export function leerInvitacion(
  texto: string,
  grupos: Grupo[] = GRUPOS,
  codigos: Partial<Record<GrupoId, CodigoInvitacion>> = {},
): { valida: boolean; grupo?: GrupoId; codigo?: string } {
  // 1) codigo generado por el pastor: "CONGREGA-4K7Q", "4K7Q" o
  //    "congrega://unirse/4K7Q" (el de la iglesia no trae sala)
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
    ["iglesia", "congrega", "invitacion"].some((p) => limpio.includes(p));
  return { valida, grupo };
}

// Como se muestra y comparte un codigo
export const codigoVisible = (codigo: string) => `CONGREGA-${codigo}`;
// Enlace web: se puede tocar en WhatsApp. Con la app instalada, Android la
// abre directo (App Links); sin la app, muestra la pagina para descargarla
export const SITIO = "https://congrega.expo.app";
// ?codigo= (no /unirse/4K7Q): la web es estatica y solo sirve paginas fijas.
// Probando en Expo Go: el enlace lleva tambien la direccion del servidor de
// desarrollo (&dev=exp://...) y la pagina muestra "Abrir en Expo Go"
const EN_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const enlaceDeCodigo = (codigo: string) => {
  const enlace = `${SITIO}/unirse?codigo=${codigo}`;
  if (!EN_EXPO_GO) return enlace;
  const dev = Linking.createURL("unirse", { queryParams: { codigo } });
  return `${enlace}&dev=${encodeURIComponent(dev)}`;
};
export const PLAY_STORE =
  "https://play.google.com/store/apps/details?id=com.avilapato.congrega";

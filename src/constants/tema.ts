import { reloadAppAsync } from "expo";
import { escribir, leer } from "./almacenTema";
import { DevSettings, Platform } from "react-native";

// Temas de color: cambian el color principal de toda la app (botones,
// detalles, iconos activos). Se elige en Editar perfil
export const TEMAS = {
  rojo: { label: "Rojo", primario: "#E5484D" },
  azul: { label: "Azul", primario: "#3E8EF7" },
  verde: { label: "Verde", primario: "#30A46C" },
  morado: { label: "Morado", primario: "#8E4EC6" },
  naranja: { label: "Naranja", primario: "#F76B15" },
  rosa: { label: "Rosa", primario: "#D6409F" },
  turquesa: { label: "Turquesa", primario: "#12A594" },
  indigo: { label: "Índigo", primario: "#5B5BD6" },
} as const;
export type TemaId = keyof typeof TEMAS;

// Fondo de la app: oscuro (el de siempre) o claro
export const PALETAS = {
  oscuro: {
    label: "Oscuro",
    fondo: "#121212",
    superficie: "#1E1E1E",
    elevado: "#242424", // un poco mas claro que la superficie
    borde: "#2A2A2A",
    texto: "#F2F2F2",
    tenue: "#9A9A9A",
    lectura: "#E9E4DA", // texto de la Biblia (blanco calido)
    barra: "#161616",
    barraBorde: "#262626",
    linea: "#3A3A3A", // asas de las hojas, bordes marcados
    radio: "#4A4A4A", // bordes de opciones sin elegir
    placeholder: "#555555", // texto de ayuda dentro de los campos
    inactivo: "#7A7A7A", // iconos de la barra sin elegir
  },
  claro: {
    label: "Claro",
    fondo: "#F6F4F0",
    superficie: "#FFFFFF",
    elevado: "#EFEBE4",
    borde: "#E3DED6",
    texto: "#1B1B1B",
    tenue: "#6F6B66",
    lectura: "#2A2622", // tinta calida, como papel
    barra: "#FFFFFF",
    barraBorde: "#E3DED6",
    linea: "#D3CCC1",
    radio: "#BDB6AB",
    placeholder: "#A8A39C",
    inactivo: "#8C877F",
  },
} as const;
export type ModoId = keyof typeof PALETAS;

const CLAVE = "imep:tema";
const CLAVE_MODO = "imep:modo";
const CLAVE_REGRESO = "imep:regreso"; // pantalla a abrir despues de reiniciar

export function leerModo(): ModoId {
  try {
    const v = leer(CLAVE_MODO);
    return v && v in PALETAS ? (v as ModoId) : "oscuro";
  } catch {
    return "oscuro";
  }
}

// Se lee sin esperar (al abrir la app, antes de dibujar) para que todos los
// estilos ya salgan con el color elegido
export function leerTema(): TemaId {
  try {
    const v = leer(CLAVE);
    return v && v in TEMAS ? (v as TemaId) : "rojo";
  } catch {
    return "rojo";
  }
}

// Guarda el color y el fondo, y reinicia la app para pintarla entera.
// "regreso": la pantalla que se abre al volver (ej. "/perfil").
// Devuelve el error si algo falla (para mostrarlo), o null si todo bien
export async function elegirTema(
  id: TemaId,
  modo: ModoId,
  regreso?: string,
): Promise<string | null> {
  // 1) guardar y comprobar que quedo guardado
  try {
    escribir(CLAVE, id);
    escribir(CLAVE_MODO, modo);
    if (regreso) escribir(CLAVE_REGRESO, regreso);
    if (leer(CLAVE) !== id || leer(CLAVE_MODO) !== modo) {
      return "No se pudo guardar el color en el teléfono.";
    }
  } catch (e) {
    return `No se pudo guardar el color: ${String(e)}`;
  }
  // un instante para que termine de guardarse el resto del perfil
  await new Promise((r) => setTimeout(r, 300));
  // 2) reiniciar para pintar la app entera
  if (Platform.OS === "web") {
    globalThis.location?.reload();
    return null;
  }
  // en desarrollo (Expo Go) el reinicio confiable es el de la tecla "r";
  // en la app instalada, el de Expo
  if (__DEV__) {
    DevSettings.reload("Cambio de colores");
    return null;
  }
  try {
    await reloadAppAsync("Cambio de colores");
    return null;
  } catch (e) {
    return `Se guardó, pero no se pudo reiniciar: ${String(e)}`;
  }
}

// Al abrir: la pantalla pendiente despues de un reinicio (y se borra)
export function tomarRegreso(): string | null {
  try {
    const v = leer(CLAVE_REGRESO);
    if (v) escribir(CLAVE_REGRESO, "");
    return v || null;
  } catch {
    return null;
  }
}

// "#E5484D" + 0.12 -> "rgba(229, 72, 77, 0.12)"
export const conAlfa = (hex: string, alfa: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
};

export const TEMA_ACTUAL = leerTema();
export const MODO_ACTUAL = leerModo();

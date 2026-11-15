import { supabase } from "@/lib/supabase";
import * as Application from "expo-application";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

// ¿Hay que actualizar la app? Compara la version instalada (la "version" de
// app.json) con la que pide el servidor (tabla version_app):
// - menor que "minima"   -> obligatorio (no se puede seguir)
// - menor que "sugerida" -> se sugiere ("Mas tarde")
export type EstadoVersion =
  | { tipo: "ok" }
  | {
      tipo: "obligatoria" | "sugerida";
      nueva: string; // la version que se pide
      mensaje?: string; // que trae (lo escribe el pastor/desarrollador)
    };

const PAQUETE = "com.avilapato.congrega";

// "1.10.0" > "1.9.3" (numero por numero, no como texto)
export function compararVersiones(a: string, b: string) {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

export async function revisarVersion(): Promise<EstadoVersion> {
  // en la web siempre es la ultima; en Expo Go la version es la de Expo Go
  if (
    !supabase ||
    Platform.OS === "web" ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return { tipo: "ok" };
  }
  const instalada = Application.nativeApplicationVersion;
  if (!instalada) return { tipo: "ok" };
  const { data, error } = await supabase
    .from("version_app")
    .select("minima, sugerida, mensaje")
    .eq("plataforma", Platform.OS)
    .maybeSingle();
  // sin conexion o sin la tabla: no se molesta a nadie
  if (error || !data) return { tipo: "ok" };
  const mensaje = data.mensaje ?? undefined;
  if (compararVersiones(instalada, data.minima) < 0) {
    return {
      tipo: "obligatoria",
      // la mas nueva de las dos
      nueva:
        compararVersiones(data.sugerida, data.minima) > 0
          ? data.sugerida
          : data.minima,
      mensaje,
    };
  }
  if (compararVersiones(instalada, data.sugerida) < 0) {
    return { tipo: "sugerida", nueva: data.sugerida, mensaje };
  }
  return { tipo: "ok" };
}

// Abre la app en la tienda (la app de Play Store; si no, la pagina web)
export function urlTienda() {
  if (Platform.OS === "android") {
    return {
      app: `market://details?id=${PAQUETE}`,
      web: `https://play.google.com/store/apps/details?id=${PAQUETE}`,
    };
  }
  const ios = Constants.expoConfig?.ios?.appStoreUrl;
  return ios ? { app: ios, web: ios } : null;
}

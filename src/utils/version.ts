import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

// Version de la app (sale de "version" en app.json; es la que ve Google Play)
export const VERSION_APP = Constants.expoConfig?.version ?? "1.0.0";

// Que tiene este telefono: la version de Play (su numero de build) y la
// ultima actualizacion que aplico. Sirve para saber si a un hermano ya le
// llego un arreglo ("sin actualizar" = usa lo que trajo la instalacion)
const build = Platform.OS === "web" ? null : Application.nativeBuildVersion;
const actualizacion = (() => {
  if (Platform.OS === "web" || !Updates.isEnabled) return "";
  if (Updates.isEmbeddedLaunch || !Updates.createdAt) return " · sin actualizar";
  const f = Updates.createdAt;
  const dia = f.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const hora = f.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return ` · act. ${dia} ${hora}`;
})();

export const TEXTO_VERSION = `Congrega · Versión ${VERSION_APP}${
  build ? ` (${build})` : ""
}${actualizacion}`;

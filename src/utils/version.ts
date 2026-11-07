import Constants from "expo-constants";

// Version de la app (sale de "version" en app.json; es la que ve Google Play)
export const VERSION_APP = Constants.expoConfig?.version ?? "1.0.0";
export const TEXTO_VERSION = `IMEP · Versión ${VERSION_APP}`;

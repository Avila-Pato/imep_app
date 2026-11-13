import { asegurarSesion, supabase } from "@/lib/supabase";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { NOTIS_DISPONIBLES, tienePermiso } from "./notificaciones";

// Push de otros telefonos (anuncios nuevos, turnos de mañana): este telefono
// le da su token a Supabase junto con los avisos que quiere recibir.
// Expo Go no recibe push remotas: hace falta un development build
const PROJECT_ID: string | undefined =
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
const EN_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function registrarDispositivo(
  avisos: Partial<Record<string, boolean>>,
) {
  if (!supabase || !NOTIS_DISPONIBLES || !PROJECT_ID || EN_EXPO_GO) return;
  if (!(await tienePermiso())) return;
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: PROJECT_ID,
  });
  await asegurarSesion();
  const { error } = await supabase.rpc("registrar_dispositivo", {
    p_token: token,
    p_plataforma: Platform.OS,
    p_avisos: avisos,
  });
  if (error) throw error;
}

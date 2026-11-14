import { TurboModuleRegistry } from "react-native";

// Inicio de sesion con Google "nativo" (Android/iOS): la ventanita del sistema
// que dice "Congrega", sin abrir el navegador. Devuelve el id_token de Google
// para entregarselo a Supabase.
//
// El cliente WEB es el mismo que esta en Supabase (Authentication > Google);
// el token sale "para" ese cliente y Supabase lo acepta. En Google Cloud
// (mismo proyecto) tiene que existir un cliente Android con el paquete
// com.avilapato.congrega y la huella SHA-1 de la firma de EAS
// (.env.local y variables de EAS: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)
const CLIENTE_WEB = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export type RespuestaNativa =
  | { tipo: "token"; idToken: string }
  | { tipo: "cancelado" }
  | { tipo: "no-disponible" }; // Expo Go, o falta configurar Google Cloud

// En Expo Go el modulo nativo no existe: ahi se usa el navegador
const hayModulo = () => TurboModuleRegistry.get("RNGoogleSignin") != null;

let configurado = false;

export async function googleNativo(): Promise<RespuestaNativa> {
  if (!hayModulo() || !CLIENTE_WEB) return { tipo: "no-disponible" };
  const { GoogleSignin, isErrorWithCode, statusCodes } =
    await import("@react-native-google-signin/google-signin");
  if (!configurado) {
    GoogleSignin.configure({ webClientId: CLIENTE_WEB });
    configurado = true;
  }
  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    // siempre deja elegir la cuenta (no entra solo con la de la vez pasada)
    await GoogleSignin.signOut().catch(() => null);
    const r = await GoogleSignin.signIn();
    if (r.type !== "success") return { tipo: "cancelado" };
    const idToken = r.data.idToken;
    if (!idToken) return { tipo: "no-disponible" };
    return { tipo: "token", idToken };
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return { tipo: "cancelado" };
      if (e.code === statusCodes.IN_PROGRESS) return { tipo: "cancelado" };
    }
    // DEVELOPER_ERROR (falta el cliente Android / SHA-1), sin Play Services...
    console.warn("[google]", (e as Error)?.message ?? e);
    return { tipo: "no-disponible" };
  }
}

// Al cerrar sesion (Reiniciar app) tambien se olvida en Google
export async function salirGoogleNativo() {
  if (!hayModulo()) return;
  const { GoogleSignin } =
    await import("@react-native-google-signin/google-signin");
  await GoogleSignin.signOut().catch(() => null);
}

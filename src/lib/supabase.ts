import "./instalarAlmacen"; // localStorage (telefono: expo-sqlite)
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

// Cliente de Supabase. Sin las variables de .env.local queda en null y la app
// sigue funcionando solo con lo guardado en el telefono (modo de prueba)
// solo https://xxxx.supabase.co: si se pego con /rest/v1/ u otra ruta, las
// llamadas fallan con "Invalid path specified in request URL"
const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.match(/^https?:\/\/[^/]+/)?.[0];
const clave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Al armar la web (paginas estaticas en Node) no hay localStorage ni sesion:
// ahi no se crea el cliente; en el navegador si
const armandoWeb = Platform.OS === "web" && typeof window === "undefined";

export const supabase =
  url && clave && !armandoWeb
    ? createClient(url, clave, {
        auth: {
          storage: localStorage, // la sesion queda guardada en el telefono
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// Renueva la sesion solo mientras la app esta abierta
if (supabase) {
  AppState.addEventListener("change", (estado) => {
    if (estado === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

// Mientras no haya cuentas (PasoCuenta), cada telefono entra como usuario
// anonimo: asi las reglas RLS saben quien es. Luego se vincula a su email.
// Se revisa la sesion cada vez (es local, no va a internet): si se cerro
// (Reiniciar app) o vencio, entra de nuevo. "entrando" solo evita que dos
// llamadas al mismo tiempo creen dos usuarios
let entrando: Promise<string | null> | null = null;
export async function asegurarSesion(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  entrando ??= (async () => {
    const { data: nueva, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return nueva.user?.id ?? null;
  })().finally(() => {
    entrando = null;
  });
  return entrando;
}

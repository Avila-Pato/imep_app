import { asegurarSesion, supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import type { CuentaConectada } from "@/store/estudios";
import * as WebBrowser from "expo-web-browser";

// Cuentas con Google (Supabase Auth).
// Quien venia como anonimo VINCULA Google a su mismo usuario: conserva sus
// iglesias y su rol de pastor. Si ese Google ya tenia cuenta (reinstalo la
// app, otro telefono), entra a esa cuenta

export type Resultado = "ok" | "cancelado";

// A donde vuelve el navegador: congrega://auth (en Expo Go exp://.../--/auth
// y en web http://localhost:8081/auth). Debe estar en Redirect URLs de Supabase
const volverA = () => Linking.createURL("auth");

// Los tokens llegan en el #fragmento (o los errores en ?query)
function leerRetorno(url: string) {
  const [sinHash, hash = ""] = url.split("#");
  const query = sinHash.split("?")[1] ?? "";
  return new URLSearchParams(`${query}&${hash}`);
}

// Abre Google en el navegador y aplica la sesion que vuelve
async function abrir(url: string): Promise<URLSearchParams | null> {
  const r = await WebBrowser.openAuthSessionAsync(url, volverA());
  if (r.type !== "success") return null;
  return leerRetorno(r.url);
}

async function aplicar(p: URLSearchParams) {
  const access_token = p.get("access_token");
  const refresh_token = p.get("refresh_token");
  if (!access_token || !refresh_token) return;
  const { error } = await supabase!.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
}

async function iniciarSesion(): Promise<Resultado> {
  const { data, error } = await supabase!.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: volverA(), skipBrowserRedirect: true },
  });
  if (error) throw error;
  const p = await abrir(data.url);
  if (!p) return "cancelado";
  if (p.get("error")) throw new Error(p.get("error_description") ?? "error");
  await aplicar(p);
  return "ok";
}

export async function entrarConGoogle(): Promise<Resultado> {
  if (!supabase) throw new Error("La app no está conectada al servidor");
  await asegurarSesion();
  const { data: yo } = await supabase.auth.getUser();

  // ya tiene cuenta de verdad (no anonima): solo entra
  if (!yo.user?.is_anonymous) return iniciarSesion();

  // anonimo: vincula Google a este mismo usuario
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: volverA(), skipBrowserRedirect: true },
  });
  if (error) throw error;
  const p = await abrir(data.url);
  if (!p) return "cancelado";

  if (p.get("error_code") === "identity_already_exists") {
    // ese Google ya tiene su cuenta: entra a ella
    return iniciarSesion();
  }
  if (p.get("error")) throw new Error(p.get("error_description") ?? "error");
  await aplicar(p);
  return "ok";
}

// Datos de la cuenta para mostrar (nombre y foto de Google)
export async function miCuenta(): Promise<CuentaConectada | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u || u.is_anonymous) return null;
  const m = u.user_metadata ?? {};
  return {
    proveedor: "google",
    correo: u.email,
    nombre: m.full_name ?? m.name,
    foto: m.avatar_url ?? m.picture,
  };
}

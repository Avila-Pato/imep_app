import { asegurarSesion, supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import type { CuentaConectada } from "@/store/estudios";
import * as WebBrowser from "expo-web-browser";
import { googleNativo } from "./googleNativo";

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

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Abre Google en el navegador y aplica la sesion que vuelve.
// En Android el navegador anterior tarda un momento en "cerrarse" despues de
// volver a la app: si se abre otro enseguida (vincular -> ya existia -> entrar)
// falla con "WebBrowser is already open". Se espera y se reintenta
async function abrir(url: string): Promise<URLSearchParams | null> {
  for (let intento = 0; ; intento++) {
    try {
      const r = await WebBrowser.openAuthSessionAsync(url, volverA());
      if (r.type !== "success") return null;
      return leerRetorno(r.url);
    } catch (e) {
      const ocupado = /already open|invalid state/i.test(
        (e as Error)?.message ?? "",
      );
      if (!ocupado || intento >= 15) throw e;
      await esperar(300);
    }
  }
}

// ese Google ya es la cuenta de otro usuario (la creo antes, en este u otro
// telefono): el codigo cambia segun la version del servidor
const yaExiste = (p: URLSearchParams) =>
  p.get("error_code") === "identity_already_exists" ||
  /already (linked|exists)|already registered/i.test(
    p.get("error_description") ?? "",
  );

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

// Ese Google ya tenia su cuenta: al entrar a ella, lo que hizo como anonimo
// (iglesias, salas, cronograma, anuncios...) se pasa a esa cuenta.
// Se pide el codigo SIEMPRE antes de cambiar de sesion (como anonimo)
async function prepararFusion(): Promise<string | null> {
  const { data, error } = await supabase!.rpc("preparar_fusion");
  if (error) {
    console.warn("[google] preparar_fusion", error.message);
    return null;
  }
  return (data as string) ?? null;
}

async function fusionar(codigo: string | null) {
  if (!codigo) return;
  const { error } = await supabase!.rpc("fusionar_cuenta", {
    p_codigo: codigo,
  });
  if (error) console.warn("[google] fusionar_cuenta", error.message);
}

async function iniciarSesion(codigo: string | null = null): Promise<Resultado> {
  const { data, error } = await supabase!.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: volverA(), skipBrowserRedirect: true },
  });
  if (error) throw error;
  const p = await abrir(data.url);
  if (!p) return "cancelado";
  if (p.get("error")) throw new Error(p.get("error_description") ?? "error");
  await aplicar(p);
  await fusionar(codigo);
  return "ok";
}

// Con Google nativo: el token de Google se entrega a Supabase (sin navegador).
// Anonimo: se vincula a su mismo usuario; si ese Google ya tenia cuenta, entra
// a ella con el mismo token (sin pedirle elegir otra vez)
async function conToken(idToken: string, anonimo: boolean) {
  const auth = supabase!.auth;
  if (anonimo) {
    const { error } = await auth.linkIdentity({
      provider: "google",
      token: idToken,
    });
    if (!error) return;
    const yaTenia =
      error.code === "identity_already_exists" ||
      /already (linked|exists)|already registered/i.test(error.message);
    if (!yaTenia) throw error;
  }
  const codigo = anonimo ? await prepararFusion() : null;
  const { error } = await auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;
  await fusionar(codigo);
}

export async function entrarConGoogle(): Promise<Resultado> {
  if (!supabase) throw new Error("La app no está conectada al servidor");
  await asegurarSesion();
  const { data: yo } = await supabase.auth.getUser();

  // 1) la ventanita de Google del telefono (dice "Congrega")
  const nativo = await googleNativo();
  if (nativo.tipo === "cancelado") return "cancelado";
  if (nativo.tipo === "token") {
    try {
      await conToken(nativo.idToken, !!yo.user?.is_anonymous);
      return "ok";
    } catch (e) {
      // el servidor no acepto el token: se intenta por el navegador
      console.warn("[google]", (e as Error)?.message ?? e);
    }
  }

  // 2) por el navegador (web, Expo Go, o si lo nativo no esta configurado)

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

  if (yaExiste(p)) {
    // ese Google ya tiene su cuenta: entra a ella y le pasa lo de aqui
    return iniciarSesion(await prepararFusion());
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

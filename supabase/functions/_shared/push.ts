// Envio a Expo Push (https://docs.expo.dev/push-notifications/sending-notifications/)
// Expo acepta hasta 100 mensajes por llamada
import { createClient } from "npm:@supabase/supabase-js@2";

export type Mensaje = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string; // Android: el canal "iglesia" que crea la app
  sound?: "default";
};

// Cliente con permisos de servidor (las variables las pone Supabase solo)
export const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

export async function enviar(mensajes: Mensaje[]) {
  let enviados = 0;
  const muertos: string[] = [];
  for (let i = 0; i < mensajes.length; i += 100) {
    const lote = mensajes.slice(i, i + 100).map((m) => ({
      sound: "default",
      channelId: "iglesia",
      ...m,
    }));
    const r = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(Deno.env.get("EXPO_ACCESS_TOKEN")
          ? { Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}` }
          : {}),
      },
      body: JSON.stringify(lote),
    });
    const json = await r.json().catch(() => ({}));
    const tickets: { status: string; details?: { error?: string } }[] =
      json.data ?? [];
    tickets.forEach((t, k) => {
      if (t.status === "ok") enviados++;
      // la app se desinstalo o el token cambio: no volver a usarlo
      else if (t.details?.error === "DeviceNotRegistered") {
        muertos.push(lote[k].to);
      }
    });
  }
  if (muertos.length) {
    await admin().rpc("borrar_tokens", { p_tokens: muertos });
  }
  return { enviados, borrados: muertos.length };
}

export const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });

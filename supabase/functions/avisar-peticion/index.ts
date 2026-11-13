// La app la llama justo despues de pedir oracion:
//   supabase.functions.invoke("avisar-peticion", { body: { peticion_id } })
// Comprueba que la peticion es de quien llama y que sigue pendiente, y avisa
// a quienes la aprueban (pastor y lideres) para que la acepten o rechacen
import { createClient } from "npm:@supabase/supabase-js@2";
import { admin, enviar, json } from "../_shared/push.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "solo POST" }, 405);
  const { peticion_id } = await req.json().catch(() => ({}));
  if (typeof peticion_id !== "string") {
    return json({ error: "falta peticion_id" }, 400);
  }

  // como la persona que llama: RLS solo le deja ver las suyas (o aprobadas)
  const usuario = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  );
  const { data: yo } = await usuario.auth.getUser();
  if (!yo.user) return json({ error: "sin sesion" }, 401);

  const { data: p } = await usuario
    .from("peticiones")
    .select("id, iglesia_id, autor_id, autor, texto, estado, iglesias(nombre)")
    .eq("id", peticion_id)
    .maybeSingle();
  if (!p) return json({ error: "peticion no encontrada" }, 404);
  // solo quien la pidio avisa, y solo si aun espera (no se repite)
  if (p.autor_id !== yo.user.id) return json({ error: "sin permiso" }, 403);
  if (p.estado !== "pendiente") return json({ enviados: 0 });

  const { data: tokens, error } = await admin().rpc("tokens_que_revisan", {
    p_iglesia: p.iglesia_id,
    p_excluir: yo.user.id,
  });
  if (error) return json({ error: error.message }, 500);

  const iglesia =
    (p.iglesias as unknown as { nombre: string } | null)?.nombre ?? "";
  const resultado = await enviar(
    (tokens ?? []).map((t: { token: string }) => ({
      to: t.token,
      title: `🙏 ${p.autor} pide oración`,
      body: [p.texto.slice(0, 120), iglesia, "Toca para aprobarla o rechazarla"]
        .filter(Boolean)
        .join(" · "),
      data: { url: "/sala/general?vista=oracion", iglesia_id: p.iglesia_id },
    })),
  );
  return json(resultado);
});

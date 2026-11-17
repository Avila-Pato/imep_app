// La app del pastor la llama cuando crea OTRA iglesia (ya guardada):
//   supabase.functions.invoke("avisar-iglesia", { body: { iglesia_id } })
// El servidor ya sumo a sus hermanos (de sus otras iglesias) a la nueva.
// Comprueba que quien llama es el pastor de esa iglesia y les avisa:
//   "⛪ Te sumaron a Otra Iglesia" · "Tu pastor Carlos abrió esta iglesia en
//   Congrega. Toca para verla"
import { createClient } from "npm:@supabase/supabase-js@2";
import { admin, enviar, json, preflight } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const previa = preflight(req); // navegador (web)
  if (previa) return previa;
  if (req.method !== "POST") return json({ error: "solo POST" }, 405);
  const { iglesia_id } = await req.json().catch(() => ({}));
  if (typeof iglesia_id !== "string") {
    return json({ error: "falta iglesia_id" }, 400);
  }

  // como la persona que llama: las reglas RLS deciden que puede ver
  const usuario = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  );
  const { data: yo } = await usuario.auth.getUser();
  if (!yo.user) return json({ error: "sin sesion" }, 401);

  const { data: esPastor } = await usuario.rpc("es_pastor", {
    p_iglesia: iglesia_id,
  });
  if (!esPastor) return json({ error: "sin permiso" }, 403);

  const { data: iglesia } = await usuario
    .from("iglesias")
    .select("nombre")
    .eq("id", iglesia_id)
    .maybeSingle();
  if (!iglesia) return json({ error: "iglesia no encontrada" }, 404);

  // el nombre del pastor (el de su perfil)
  const { data: perfil } = await usuario
    .from("perfiles")
    .select("nombre")
    .eq("id", yo.user.id)
    .maybeSingle();
  const pastor = (perfil?.nombre as string | undefined)?.trim();

  // todos los de la iglesia nueva menos el pastor (los que quieren avisos
  // de la iglesia: los de "Anuncios y eventos")
  const { data: tokens, error } = await admin().rpc("tokens_de_iglesia", {
    p_iglesia: iglesia_id,
    p_tipo: "anuncios",
    p_excluir: yo.user.id,
  });
  if (error) return json({ error: error.message }, 500);

  const resultado = await enviar(
    (tokens ?? []).map((t: { token: string }) => ({
      to: t.token,
      title: `⛪ Te sumaron a ${iglesia.nombre}`,
      body: `${pastor ? `Tu pastor ${pastor}` : "Tu pastor"} abrió esta iglesia en Congrega. Toca para verla`,
      data: { url: "/eventos?vista=anuncios", iglesia_id },
    })),
  );
  return json(resultado);
});

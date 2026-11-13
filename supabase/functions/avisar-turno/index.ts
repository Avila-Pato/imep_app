// La app la llama cuando el admin asigna a alguien en el cronograma:
//   supabase.functions.invoke("avisar-turno", { body: { iglesia_id, fecha,
//     rol, hora, persona } })
// Comprueba que quien llama puede editar el cronograma de esa iglesia y le
// avisa a esa persona: "Te asignaron un turno · Palabra · dom 23 nov · 19:30"
// o, si la sacaron (tipo "quitado"): "Te quitaron de un turno · Palabra · ..."
import { createClient } from "npm:@supabase/supabase-js@2";
import { admin, enviar, json } from "../_shared/push.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "solo POST" }, 405);
  const b = await req.json().catch(() => ({}));
  const { tipo, iglesia_id, fecha, rol, hora, persona } = b as Record<
    string,
    string
  >;
  const quitado = tipo === "quitado";
  if (!iglesia_id || !fecha || !rol || !persona) {
    return json({ error: "faltan datos" }, 400);
  }

  const usuario = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
  );
  const { data: yo } = await usuario.auth.getUser();
  if (!yo.user) return json({ error: "sin sesion" }, 401);

  const { data: puede } = await usuario.rpc("puede", {
    p_iglesia: iglesia_id,
    p_permiso: "cronograma",
  });
  if (!puede) return json({ error: "sin permiso" }, 403);

  const { data: iglesia } = await usuario
    .from("iglesias")
    .select("nombre")
    .eq("id", iglesia_id)
    .maybeSingle();

  const { data: tokens, error } = await admin().rpc("tokens_de_persona", {
    p_iglesia: iglesia_id,
    p_nombre: persona,
    p_excluir: yo.user.id, // si el admin se asigna a si mismo, no se avisa
  });
  if (error) return json({ error: error.message }, 500);

  const dia = new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const resultado = await enviar(
    (tokens ?? []).map((t: { token: string }) => ({
      to: t.token,
      title: quitado ? "Te quitaron de un turno" : "Te asignaron un turno 📋",
      body: [rol, dia, quitado ? undefined : hora, iglesia?.nombre]
        .filter(Boolean)
        .join(" · "),
      data: { url: "/eventos?vista=cronograma", iglesia_id },
    })),
  );
  return json(resultado);
});

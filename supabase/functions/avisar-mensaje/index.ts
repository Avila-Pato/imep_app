// La app la llama despues de publicar un aviso o devocional en una sala:
//   supabase.functions.invoke("avisar-mensaje", { body: { mensaje_id } })
// Comprueba que el mensaje es de quien llama, que es un aviso/devocional con
// "notificar" y que quien llama dirige la sala (pastor, lider con permiso o
// el lider de esa sala). Avisa a la sala o solo a los que eligio ("para")
import { createClient } from "npm:@supabase/supabase-js@2";
import { admin, enviar, json, preflight } from "../_shared/push.ts";

type Datos = {
  tipo?: "aviso" | "devocional";
  titulo?: string;
  notificar?: boolean;
  para?: string[];
};

Deno.serve(async (req) => {
  const previa = preflight(req); // navegador (web)
  if (previa) return previa;
  if (req.method !== "POST") return json({ error: "solo POST" }, 405);
  const { mensaje_id } = await req.json().catch(() => ({}));
  if (typeof mensaje_id !== "string") {
    return json({ error: "falta mensaje_id" }, 400);
  }

  const usuario = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  );
  const { data: yo } = await usuario.auth.getUser();
  if (!yo.user) return json({ error: "sin sesion" }, 401);

  const { data: m } = await usuario
    .from("mensajes")
    .select(
      "id, iglesia_id, sala, autor_id, autor, texto, datos, iglesias(nombre)",
    )
    .eq("id", mensaje_id)
    .maybeSingle();
  if (!m) return json({ error: "mensaje no encontrado" }, 404);
  const datos = (m.datos ?? {}) as Datos;
  if (m.autor_id !== yo.user.id) return json({ error: "sin permiso" }, 403);
  if (!datos.tipo || !datos.notificar) return json({ enviados: 0 });

  // quien dirige la sala: pastor / lider con permiso, o el lider elegido
  const { data: puede } = await usuario.rpc("puede", {
    p_iglesia: m.iglesia_id,
    p_permiso: "salas",
  });
  const { data: sala } = await usuario
    .from("salas")
    .select("label, lider")
    .eq("iglesia_id", m.iglesia_id)
    .eq("id", m.sala)
    .maybeSingle();
  const esSuLider =
    !!sala?.lider && sala.lider.trim() === (m.autor ?? "").trim();
  if (!puede && !esSuLider) return json({ error: "sin permiso" }, 403);

  const para = (datos.para ?? []).filter((n) => typeof n === "string");
  const { data: tokens, error } = await admin().rpc("tokens_de_sala", {
    p_iglesia: m.iglesia_id,
    p_sala: m.sala,
    p_nombres: para.length ? para : null,
    p_excluir: yo.user.id,
  });
  if (error) return json({ error: error.message }, 500);

  const nombreSala =
    m.sala === "general" ? "Iglesia" : (sala?.label ?? "tu sala");
  const iglesia =
    (m.iglesias as unknown as { nombre: string } | null)?.nombre ?? "";
  // "Aviso de la iglesia" (sala general) o "Aviso de Jovenes"
  const titulo =
    datos.tipo === "devocional"
      ? `📖 ${datos.titulo ?? "Devocional"}`
      : m.sala === "general"
        ? "📣 Aviso de la iglesia"
        : `📣 Aviso de ${nombreSala}`;

  const resultado = await enviar(
    (tokens ?? []).map((t: { token: string }) => ({
      to: t.token,
      title: titulo,
      body: [m.texto.slice(0, 150), iglesia].filter(Boolean).join(" · "),
      data: { url: `/sala/${m.sala}`, iglesia_id: m.iglesia_id },
    })),
  );
  return json(resultado);
});

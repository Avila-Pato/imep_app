// La app la llama cuando nombran (o quitan) a alguien como lider o ayudante
// de una sala:
//   supabase.functions.invoke("avisar-sala", { body: { iglesia_id, sala,
//     persona, cargo: "lider" | "ayudante", quitado?: true } })
// Comprueba que quien llama puede nombrarlo (pastor / permiso "salas"; los
// ayudantes tambien el lider de la sala) y que la sala YA lo dice (o ya no):
// asi nadie manda avisos inventados. Le avisa a esa persona:
//   "Te nombraron líder de Niños 🛡" · "Ya puedes entrar y administrarla"
import { createClient } from "npm:@supabase/supabase-js@2";
import { admin, enviar, json, preflight } from "../_shared/push.ts";

const igual = (a = "", b = "") =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

Deno.serve(async (req) => {
  const previa = preflight(req); // navegador (web)
  if (previa) return previa;
  if (req.method !== "POST") return json({ error: "solo POST" }, 405);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const iglesia_id = b.iglesia_id as string | undefined;
  const salaId = b.sala as string | undefined;
  const persona = b.persona as string | undefined;
  // su cuenta (la app nueva la manda): asi no se confunde con otro del mismo
  // nombre. Sin ella (app vieja), por el nombre como antes
  const personaId =
    typeof b.persona_id === "string" && /^[0-9a-f-]{36}$/i.test(b.persona_id)
      ? b.persona_id
      : undefined;
  const cargo = b.cargo === "ayudante" ? "ayudante" : "lider";
  const quitado = b.quitado === true;
  if (!iglesia_id || !salaId || !persona?.trim()) {
    return json({ error: "faltan datos" }, 400);
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

  // quien nombra: el pastor o quien tiene "salas"; a los ayudantes, tambien
  // el lider de esa sala
  const { data: puede } = await usuario.rpc("puede", {
    p_iglesia: iglesia_id,
    p_permiso: "salas",
  });
  let permitido = !!puede;
  if (!permitido && cargo === "ayudante") {
    const { data: guia } = await usuario.rpc("guia_la_sala", {
      p_iglesia: iglesia_id,
      p_sala: salaId,
      p_ayudantes: false,
    });
    permitido = !!guia;
  }
  if (!permitido) return json({ error: "sin permiso" }, 403);

  // la sala tiene que decirlo ya (nombrado) o ya no (quitado)
  const { data: sala } = await usuario
    .from("salas")
    .select("label, lider, ayudantes, lider_id, ayudantes_ids, iglesias(nombre)")
    .eq("iglesia_id", iglesia_id)
    .eq("id", salaId)
    .maybeSingle();
  if (!sala) return json({ error: "sala no encontrada" }, 404);
  const loTiene = personaId
    ? cargo === "lider"
      ? sala.lider_id === personaId
      : ((sala.ayudantes_ids as string[] | null) ?? []).includes(personaId)
    : cargo === "lider"
      ? igual(sala.lider ?? "", persona)
      : ((sala.ayudantes as string[] | null) ?? []).some((n) =>
          igual(n, persona),
        );
  if (loTiene === quitado) return json({ enviados: 0 });

  // si se nombra a si mismo, no se avisa
  const { data: tokens, error } = personaId
    ? await admin().rpc("tokens_de_usuario", {
        p_iglesia: iglesia_id,
        p_usuario: personaId,
        p_excluir: yo.user.id,
      })
    : await admin().rpc("tokens_de_persona", {
        p_iglesia: iglesia_id,
        p_nombre: persona.trim(),
        p_excluir: yo.user.id,
      });
  if (error) return json({ error: error.message }, 500);

  const nombreSala = sala.label;
  const iglesia =
    (sala.iglesias as unknown as { nombre: string } | null)?.nombre ?? "";
  const titulo = quitado
    ? cargo === "lider"
      ? `Ya no eres líder de ${nombreSala}`
      : `Ya no ayudas a administrar ${nombreSala}`
    : cargo === "lider"
      ? `Te nombraron líder de ${nombreSala} 🛡️`
      : `Ahora ayudas a administrar ${nombreSala} 🛡️`;
  const cuerpo = quitado
    ? "Gracias por tu servicio"
    : cargo === "lider"
      ? "Ya puedes entrar a la sala: publicar avisos, encuentros y aprobar peticiones"
      : "Ya puedes entrar a la sala y ayudar a tu líder: avisos, encuentros y peticiones";

  const resultado = await enviar(
    (tokens ?? []).map((t: { token: string }) => ({
      to: t.token,
      title: titulo,
      body: [cuerpo, iglesia].filter(Boolean).join(" · "),
      data: {
        url: quitado ? "/comunidad" : `/sala/${salaId}`,
        iglesia_id,
      },
    })),
  );
  return json(resultado);
});

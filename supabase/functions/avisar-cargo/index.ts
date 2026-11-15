// La app la llama cuando el pastor (o quien tiene el permiso "roles") da o
// quita un rol a un hermano:
//   supabase.functions.invoke("avisar-cargo", { body: { iglesia_id,
//     usuario_id, cargo, quitado?: true } })
// Comprueba que quien llama puede dar roles y que el rol YA esta (o ya no):
// asi nadie manda avisos inventados. Le avisa a ese hermano:
//   "Te dieron el rol de Secretario/a ✨" · "Ahora puedes: editar el cronograma..."
import { createClient } from "npm:@supabase/supabase-js@2";
import { admin, enviar, json, preflight } from "../_shared/push.ts";

// lo mismo que CARGOS en la app (nombre y que le deja hacer)
const CARGOS: Record<string, { label: string; puede: string }> = {
  secretaria: {
    label: "Secretario/a",
    puede: "editar el cronograma, publicar anuncios y asignar roles",
  },
  servicio: {
    label: "Coordinador/a de servicio",
    puede: "editar el cronograma",
  },
  comunicaciones: { label: "Comunicaciones", puede: "publicar anuncios" },
  lider: { label: "Líder de sala", puede: "cuidar las salas" },
};

Deno.serve(async (req) => {
  const previa = preflight(req); // navegador (web)
  if (previa) return previa;
  if (req.method !== "POST") return json({ error: "solo POST" }, 405);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const iglesia_id = b.iglesia_id as string | undefined;
  const usuario_id = b.usuario_id as string | undefined;
  const cargo = b.cargo as string | undefined;
  const quitado = b.quitado === true;
  const info = cargo ? CARGOS[cargo] : undefined;
  if (!iglesia_id || !usuario_id || !info) {
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
  if (yo.user.id === usuario_id) return json({ enviados: 0 });

  const { data: puede } = await usuario.rpc("puede", {
    p_iglesia: iglesia_id,
    p_permiso: "roles",
  });
  if (!puede) return json({ error: "sin permiso" }, 403);

  // el rol tiene que estar ya (dado) o ya no (quitado)
  const { data: fila } = await usuario
    .from("cargos")
    .select("cargo")
    .eq("iglesia_id", iglesia_id)
    .eq("usuario_id", usuario_id)
    .eq("cargo", cargo)
    .maybeSingle();
  if (!!fila === quitado) return json({ enviados: 0 });

  const { data: iglesia } = await usuario
    .from("iglesias")
    .select("nombre")
    .eq("id", iglesia_id)
    .maybeSingle();

  const { data: dispositivos, error } = await admin()
    .from("dispositivos")
    .select("token")
    .eq("usuario_id", usuario_id);
  if (error) return json({ error: error.message }, 500);

  const resultado = await enviar(
    (dispositivos ?? []).map((d: { token: string }) => ({
      to: d.token,
      title: quitado
        ? `Ya no tienes el rol de ${info.label}`
        : `Te dieron el rol de ${info.label} ✨`,
      body: [
        quitado ? "Gracias por tu servicio" : `Ahora puedes ${info.puede}`,
        iglesia?.nombre,
      ]
        .filter(Boolean)
        .join(" · "),
      data: { url: "/perfil", iglesia_id },
    })),
  );
  return json(resultado);
});

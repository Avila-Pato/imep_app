// "Eliminar mi cuenta" (Perfil). Lo exige Google Play: la persona borra su
// cuenta y sus datos desde la app.
//   supabase.functions.invoke("borrar-cuenta", { body: {} })
// Borra:
// - sus archivos: su foto (y las que subio: logo, salas), sus notas de voz
// - si es pastor: sus iglesias y TODO lo de ellas (y sus archivos)
// - la cuenta: la base de datos borra en cascada su perfil, sus membresias,
//   cargos, mensajes, privados, peticiones, reacciones, respuestas y
//   dispositivos (las iglesias que creo tambien caen en cascada)
import { createClient } from "npm:@supabase/supabase-js@2";
import { admin, json, preflight } from "../_shared/push.ts";

type Cliente = ReturnType<typeof admin>;

// Todo lo que hay dentro de una carpeta de Storage (con subcarpetas)
async function archivosDe(a: Cliente, bucket: string, carpeta: string) {
  const rutas: string[] = [];
  const pendientes = [carpeta];
  while (pendientes.length) {
    const actual = pendientes.pop()!;
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await a.storage
        .from(bucket)
        .list(actual, { limit: 1000, offset: desde });
      if (error || !data?.length) break;
      for (const f of data) {
        const ruta = `${actual}/${f.name}`;
        // sin id = es una carpeta
        if (f.id) rutas.push(ruta);
        else pendientes.push(ruta);
      }
      if (data.length < 1000) break;
    }
  }
  return rutas;
}

async function borrarArchivos(a: Cliente, bucket: string, rutas: string[]) {
  for (let i = 0; i < rutas.length; i += 100) {
    const { error } = await a.storage
      .from(bucket)
      .remove(rutas.slice(i, i + 100));
    if (error) console.warn("[borrar-cuenta]", bucket, error.message);
  }
}

// "https://.../object/public/chat/<iglesia>/<id>.m4a" -> "<iglesia>/<id>.m4a"
const rutaDe = (url: unknown, bucket: string) =>
  typeof url === "string"
    ? decodeURIComponent(url.split(`/object/public/${bucket}/`)[1] ?? "") ||
      null
    : null;

Deno.serve(async (req) => {
  const previa = preflight(req); // navegador (web)
  if (previa) return previa;
  if (req.method !== "POST") return json({ error: "solo POST" }, 405);

  const usuario = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  );
  const { data: yo } = await usuario.auth.getUser();
  if (!yo.user) return json({ error: "sin sesion" }, 401);
  const id = yo.user.id;
  const a = admin();

  // 1) sus iglesias (las que creo o donde es pastor) y sus archivos
  const { data: creadas } = await a
    .from("iglesias")
    .select("id")
    .eq("creada_por", id);
  const { data: pastor } = await a
    .from("miembros")
    .select("iglesia_id")
    .eq("usuario_id", id)
    .eq("rol", "pastor");
  const iglesias = [
    ...new Set([
      ...(creadas ?? []).map((i: { id: string }) => i.id),
      ...(pastor ?? []).map((m: { iglesia_id: string }) => m.iglesia_id),
    ]),
  ];
  for (const iglesia of iglesias) {
    await borrarArchivos(
      a,
      "anuncios",
      await archivosDe(a, "anuncios", iglesia),
    );
    await borrarArchivos(a, "chat", await archivosDe(a, "chat", iglesia));
  }

  // 2) sus notas de voz en otras iglesias
  const { data: conAudio } = await a
    .from("mensajes")
    .select("datos")
    .eq("autor_id", id)
    .not("datos->audio", "is", null);
  const { data: privados } = await a
    .from("privados")
    .select("datos")
    .eq("de", id)
    .not("datos->audio", "is", null);
  const audios = [...(conAudio ?? []), ...(privados ?? [])]
    .map((m: { datos: { audio?: { uri?: string } } | null }) =>
      rutaDe(m.datos?.audio?.uri, "chat"),
    )
    .filter((r): r is string => !!r);
  await borrarArchivos(a, "chat", audios);

  // 3) su carpeta de fotos (perfil, y las que subio para su iglesia o sala)
  await borrarArchivos(a, "avatares", await archivosDe(a, "avatares", id));

  // 4) sus iglesias (todo lo de ellas cae en cascada) y la cuenta
  if (iglesias.length) {
    const { error } = await a.from("iglesias").delete().in("id", iglesias);
    if (error) return json({ error: error.message }, 500);
  }
  const { error } = await a.auth.admin.deleteUser(id);
  if (error) return json({ error: error.message }, 500);
  return json({ borrada: true, iglesias: iglesias.length });
});

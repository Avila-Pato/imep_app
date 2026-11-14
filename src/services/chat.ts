import { asegurarSesion, supabase } from "@/lib/supabase";
import { Mensaje } from "@/types/typesComunidad";
import { File } from "expo-file-system";
import { Platform } from "react-native";
import { esUuid } from "./iglesias";

// Chat de las salas en Supabase: lo que escribe un hermano le llega a todos
// los de su iglesia (RLS: solo los miembros leen y escriben).
// Los chats privados NO se suben: la tabla la leen todos los miembros

type FilaMensaje = {
  id: string;
  sala: string;
  autor_id: string;
  autor: string;
  texto: string;
  datos: Partial<Mensaje> | null;
  creado: string;
};

// lo que no es id, sala, autor, texto ni fecha va en "datos"
const datosDe = (m: Mensaje) => ({
  ...(m.cita ? { cita: m.cita } : {}),
  ...(m.versiculo ? { versiculo: m.versiculo } : {}),
  ...(m.audio ? { audio: m.audio } : {}),
  ...(m.desafio ? { desafio: m.desafio } : {}),
  ...(m.tipo ? { tipo: m.tipo } : {}),
  ...(m.titulo ? { titulo: m.titulo } : {}),
  ...(m.notificar ? { notificar: true } : {}),
  ...(m.para?.length ? { para: m.para } : {}),
});

const esLocal = (uri?: string) => !!uri && !uri.startsWith("https://");

// Nota de voz: chat/<iglesia>/<mensaje>.<ext>
async function subirAudio(iglesiaId: string, id: string, uri: string) {
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase() || "m4a";
  const datos =
    Platform.OS === "web"
      ? await fetch(uri).then((r) => r.arrayBuffer())
      : await new File(uri).arrayBuffer();
  if (datos.byteLength < 512) throw new Error("La nota de voz llegó vacía");
  const ruta = `${iglesiaId}/${id}.${ext}`;
  const { error } = await supabase!.storage.from("chat").upload(ruta, datos, {
    contentType: ext === "m4a" || ext === "mp4" ? "audio/mp4" : `audio/${ext}`,
    upsert: true,
  });
  if (error) throw error;
  return supabase!.storage.from("chat").getPublicUrl(ruta).data.publicUrl;
}

// Devuelve el mensaje como quedo arriba (la nota de voz con su enlace)
export async function subirMensaje(
  iglesiaId: string,
  m: Mensaje,
): Promise<Mensaje | null> {
  if (!supabase || !esUuid(iglesiaId) || !esUuid(m.id)) return null;
  await asegurarSesion();
  const audio =
    m.audio && esLocal(m.audio.uri)
      ? { ...m.audio, uri: await subirAudio(iglesiaId, m.id, m.audio.uri) }
      : m.audio;
  const arriba: Mensaje = { ...m, ...(audio ? { audio } : {}) };
  const { error } = await supabase.from("mensajes").upsert({
    id: m.id,
    iglesia_id: iglesiaId,
    sala: m.grupo,
    autor: m.autor,
    texto: m.texto,
    datos: datosDe(arriba),
    creado: m.fecha,
  });
  if (error) throw error;
  return arriba;
}

// Los ultimos mensajes de todas las salas de la iglesia (mio: lo escribi yo)
export async function bajarMensajes(iglesiaId: string) {
  if (!supabase || !esUuid(iglesiaId)) return null;
  const yo = await asegurarSesion();
  const { data, error } = await supabase
    .from("mensajes")
    .select("id, sala, autor_id, autor, texto, datos, creado")
    .eq("iglesia_id", iglesiaId)
    .order("creado", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as FilaMensaje[]).map((f): Mensaje => ({
    ...(f.datos ?? {}),
    id: f.id,
    grupo: f.sala,
    autor: f.autor,
    texto: f.texto,
    fecha: f.creado,
    mio: f.autor_id === yo,
  }));
}

// ───────────── Chats privados ─────────────
// Solo los ven quien envia y quien recibe (tabla privados). La conversacion
// se arma con los dos nombres, igual que en el telefono ("dm:Ana|Pedro")

type FilaPrivado = {
  id: string;
  autor: string;
  para_nombre: string;
  texto: string;
  datos: Partial<Mensaje> | null;
  creado: string;
};

export async function subirPrivado(
  iglesiaId: string,
  m: Mensaje,
  para: { id: string; nombre: string },
): Promise<Mensaje | null> {
  if (!supabase || !esUuid(iglesiaId) || !esUuid(m.id)) return null;
  await asegurarSesion();
  const audio =
    m.audio && esLocal(m.audio.uri)
      ? { ...m.audio, uri: await subirAudio(iglesiaId, m.id, m.audio.uri) }
      : m.audio;
  const arriba: Mensaje = { ...m, ...(audio ? { audio } : {}) };
  const { error } = await supabase.from("privados").insert({
    id: m.id,
    iglesia_id: iglesiaId,
    para: para.id,
    autor: m.autor,
    para_nombre: para.nombre,
    texto: m.texto,
    datos: datosDe(arriba),
    creado: m.fecha,
  });
  // ya estaba arriba (reintento)
  if (error && error.code !== "23505") throw error;
  return arriba;
}

export async function bajarPrivados(
  iglesiaId: string,
  grupoDe: (autor: string, para: string) => string,
) {
  if (!supabase || !esUuid(iglesiaId)) return null;
  const yo = await asegurarSesion();
  const { data, error } = await supabase
    .from("privados")
    .select("id, de, autor, para_nombre, texto, datos, creado")
    .eq("iglesia_id", iglesiaId)
    .order("creado", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as (FilaPrivado & { de: string })[]).map((f): Mensaje => ({
    ...(f.datos ?? {}),
    id: f.id,
    grupo: grupoDe(f.autor, f.para_nombre),
    autor: f.autor,
    texto: f.texto,
    fecha: f.creado,
    mio: f.de === yo,
  }));
}

// ───────────── Reacciones ─────────────
export const EMOJIS_REACCION = ["👍", "❤️", "🙏", "😂", "😮", "🙌"] as const;

// Las reacciones de la iglesia: cuantas de cada emoji por mensaje y la mia
export async function bajarReacciones(iglesiaId: string) {
  if (!supabase || !esUuid(iglesiaId)) return null;
  const yo = await asegurarSesion();
  const { data, error } = await supabase
    .from("reacciones")
    .select("mensaje_id, usuario_id, emoji")
    .eq("iglesia_id", iglesiaId);
  if (error) throw error;
  const cuantas: Record<string, Record<string, number>> = {};
  const mias: Record<string, string> = {};
  for (const r of (data ?? []) as {
    mensaje_id: string;
    usuario_id: string;
    emoji: string;
  }[]) {
    const m = (cuantas[r.mensaje_id] ??= {});
    m[r.emoji] = (m[r.emoji] ?? 0) + 1;
    if (r.usuario_id === yo) mias[r.mensaje_id] = r.emoji;
  }
  return { cuantas, mias };
}

// Poner (o cambiar) mi reaccion; null = quitarla
export async function reaccionarRemoto(
  iglesiaId: string,
  mensajeId: string,
  emoji: string | null,
) {
  if (!supabase || !esUuid(iglesiaId) || !esUuid(mensajeId)) return;
  const yo = await asegurarSesion();
  if (!yo) return;
  const { error } = emoji
    ? await supabase
        .from("reacciones")
        .upsert(
          {
            mensaje_id: mensajeId,
            usuario_id: yo,
            iglesia_id: iglesiaId,
            emoji,
          },
          { onConflict: "mensaje_id,usuario_id" },
        )
    : await supabase
        .from("reacciones")
        .delete()
        .eq("mensaje_id", mensajeId)
        .eq("usuario_id", yo);
  if (error) throw error;
}

import { asegurarSesion, supabase } from "@/lib/supabase";
import { esUuid } from "./iglesias";

// Denunciar y bloquear (Google Play lo exige a las apps con chat).
// Bloquear: no ves sus mensajes y no te puede escribir en privado.
// Denunciar: le llega al pastor de la iglesia para que lo revise

export type Bloqueado = { id: string; nombre: string };

export type Denuncia = {
  id: string;
  tipo: "mensaje" | "privado";
  refId: string;
  autorId?: string;
  autor?: string;
  denunciante?: string;
  sala?: string;
  texto?: string;
  motivo: string;
  creada: string;
};

export const MOTIVOS_DENUNCIA = [
  "Ofensivo o irrespetuoso",
  "Acoso o amenazas",
  "Contenido sexual o violento",
  "Spam o estafa",
  "Otro",
] as const;

export async function bajarBloqueos(): Promise<Bloqueado[] | null> {
  if (!supabase) return null;
  if (!(await asegurarSesion())) return null;
  const { data, error } = await supabase
    .from("bloqueos")
    .select("bloqueado, nombre")
    .order("creado", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((f) => ({
    id: f.bloqueado as string,
    nombre: (f.nombre as string | null) ?? "Alguien",
  }));
}

export async function bloquearRemoto(b: Bloqueado) {
  if (!supabase || !esUuid(b.id)) return;
  await asegurarSesion();
  const { error } = await supabase
    .from("bloqueos")
    .insert({ bloqueado: b.id, nombre: b.nombre });
  // ya estaba bloqueado
  if (error && error.code !== "23505") throw error;
}

export async function desbloquearRemoto(id: string) {
  if (!supabase || !esUuid(id)) return;
  await asegurarSesion();
  const { error } = await supabase
    .from("bloqueos")
    .delete()
    .eq("bloqueado", id);
  if (error) throw error;
}

export async function denunciarRemoto(
  tipo: Denuncia["tipo"],
  refId: string,
  motivo: string,
): Promise<boolean> {
  if (!supabase || !esUuid(refId)) return false;
  await asegurarSesion();
  const { data, error } = await supabase.rpc("denunciar", {
    p_tipo: tipo,
    p_ref: refId,
    p_motivo: motivo,
  });
  if (error) throw error;
  return !!data;
}

// Las denuncias sin revisar de la iglesia (solo el pastor las ve)
export async function bajarDenuncias(
  iglesiaId: string,
): Promise<Denuncia[] | null> {
  if (!supabase || !esUuid(iglesiaId)) return null;
  await asegurarSesion();
  const { data, error } = await supabase
    .from("denuncias")
    .select(
      "id, tipo, ref_id, autor_id, autor, denunciante_nombre, sala, texto, motivo, creada",
    )
    .eq("iglesia_id", iglesiaId)
    .eq("revisada", false)
    .order("creada", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((f) => ({
    id: f.id,
    tipo: f.tipo,
    refId: f.ref_id,
    autorId: f.autor_id ?? undefined,
    autor: f.autor ?? undefined,
    denunciante: f.denunciante_nombre ?? undefined,
    sala: f.sala ?? undefined,
    texto: f.texto ?? undefined,
    motivo: f.motivo,
    creada: f.creada,
  }));
}

// El pastor la resuelve; con borrar = true tambien borra el mensaje
export async function resolverDenunciaRemoto(id: string, borrar: boolean) {
  if (!supabase) return false;
  await asegurarSesion();
  const { data, error } = await supabase.rpc("resolver_denuncia", {
    p_id: id,
    p_borrar: borrar,
  });
  if (error) throw error;
  return !!data;
}

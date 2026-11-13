import { asegurarSesion, supabase } from "@/lib/supabase";
import { Publicacion, Revision } from "@/types/typesComunidad";
import { esUuid } from "./iglesias";

// Peticiones de oracion en Supabase: el hermano la pide, el pastor (o un
// lider) la aprueba o rechaza y la aprobada la ve toda su sala

type FilaPeticion = {
  id: string;
  sala: string;
  autor_id: string;
  autor: string;
  cita: string;
  mostrar_cita: boolean;
  texto: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  revisado: string | null;
  orando: number;
  creado: string;
};

export async function subirPeticion(iglesiaId: string, p: Publicacion) {
  if (!supabase || !esUuid(iglesiaId) || !esUuid(p.id)) return false;
  await asegurarSesion();
  const { error } = await supabase.from("peticiones").insert({
    id: p.id,
    iglesia_id: iglesiaId,
    sala: p.grupo ?? "general",
    autor: p.autor,
    cita: p.cita,
    mostrar_cita: !!p.mostrarCita,
    texto: p.texto,
    creado: p.fecha,
  });
  // ya estaba arriba (reintento): cuenta como subida
  if (error && error.code !== "23505") throw error;
  return true;
}

// Las de la ultima semana (el muro dura 24 h desde que se aprueba).
// Devuelve las peticiones y las decisiones (para el muro y "por aprobar")
export async function bajarPeticiones(iglesiaId: string) {
  if (!supabase || !esUuid(iglesiaId)) return null;
  const yo = await asegurarSesion();
  const desde = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data, error } = await supabase
    .from("peticiones")
    .select(
      "id, sala, autor_id, autor, cita, mostrar_cita, texto, estado, revisado, orando, creado",
    )
    .eq("iglesia_id", iglesiaId)
    .gte("creado", desde)
    .order("creado", { ascending: false });
  if (error) throw error;
  const filas = data as FilaPeticion[];
  const revisiones: Record<string, Revision> = {};
  for (const f of filas) {
    if (f.estado !== "pendiente") {
      revisiones[f.id] = { estado: f.estado, fecha: f.revisado ?? f.creado };
    }
  }
  const peticiones = filas.map((f): Publicacion => ({
    id: f.id,
    autor: f.autor,
    grupo: f.sala,
    cita: f.cita,
    ...(f.mostrar_cita ? { mostrarCita: true } : {}),
    texto: f.texto,
    fecha: f.creado,
    orando: f.orando,
    estado: f.estado,
    mia: f.autor_id === yo,
  }));
  return { peticiones, revisiones };
}

export async function revisarPeticionRemota(
  id: string,
  estado: Revision["estado"],
) {
  if (!supabase || !esUuid(id)) return;
  await asegurarSesion();
  const { error } = await supabase.rpc("revisar_peticion", {
    p_id: id,
    p_estado: estado,
  });
  if (error) throw error;
}

// Devuelve cuantos estan orando ahora
export async function orarPor(id: string, orando: boolean) {
  if (!supabase || !esUuid(id)) return null;
  await asegurarSesion();
  const { data, error } = await supabase.rpc("orar_por", {
    p_id: id,
    p_orando: orando,
  });
  if (error) throw error;
  return data as number;
}

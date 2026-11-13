import { asegurarSesion, supabase } from "@/lib/supabase";
import { Anuncio, CategoriaId } from "@/types/typesAnuncios";
import { Turno } from "@/types/typesCronogramas";
import { esUuid } from "./iglesias";

// Anuncios y turnos de cada iglesia en Supabase (lo que ve toda la iglesia).
// Sin conexion o con iglesias antiguas (sin uuid) no hacen nada

const listo = async (iglesiaId?: string) => {
  if (!supabase || !esUuid(iglesiaId)) return false;
  await asegurarSesion();
  return true;
};

// ───────────── Anuncios ─────────────

type FilaAnuncio = {
  id: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string | null;
  lugar: string | null;
  detalle: string | null;
  imagen: string | null;
  imagen_aspecto: number | null;
  autor: string | null;
};

const aAnuncio = (f: FilaAnuncio): Anuncio => ({
  id: f.id,
  categoria: f.categoria as CategoriaId,
  titulo: f.titulo,
  descripcion: f.descripcion,
  fecha: f.fecha,
  ...(f.hora ? { hora: f.hora } : {}),
  ...(f.lugar ? { lugar: f.lugar } : {}),
  ...(f.detalle ? { detalle: f.detalle } : {}),
  ...(f.imagen ? { imagen: f.imagen } : {}),
  ...(f.imagen_aspecto ? { imagenAspecto: f.imagen_aspecto } : {}),
  ...(f.autor ? { autor: f.autor } : {}),
});

export async function subirAnuncio(iglesiaId: string, a: Anuncio) {
  if (!(await listo(iglesiaId)) || !esUuid(a.id)) return false;
  const { error } = await supabase!.from("anuncios").upsert({
    id: a.id,
    iglesia_id: iglesiaId,
    categoria: a.categoria,
    titulo: a.titulo,
    descripcion: a.descripcion,
    fecha: a.fecha,
    hora: a.hora ?? null,
    lugar: a.lugar ?? null,
    detalle: a.detalle ?? null,
    // las fotos de la galeria aun no se suben (Storage): solo URLs
    imagen: a.imagen?.startsWith("https://") ? a.imagen : null,
    imagen_aspecto: a.imagen?.startsWith("https://")
      ? (a.imagenAspecto ?? null)
      : null,
    autor: a.autor ?? null,
  });
  if (error) throw error;
  return true;
}

export async function borrarAnuncioRemoto(id: string) {
  if (!supabase || !esUuid(id)) return;
  await asegurarSesion();
  const { error } = await supabase.from("anuncios").delete().eq("id", id);
  if (error) throw error;
}

export async function bajarAnuncios(iglesiaId: string) {
  if (!(await listo(iglesiaId))) return null;
  const { data, error } = await supabase!
    .from("anuncios")
    .select("*")
    .eq("iglesia_id", iglesiaId)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return (data as FilaAnuncio[]).map(aAnuncio);
}

// Push a toda la iglesia (la Edge Function revisa que pueda publicar)
export async function avisarAnuncio(id: string) {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("avisar-anuncio", {
    body: { anuncio_id: id },
  });
  if (error) throw error;
}

// ───────────── Turnos ─────────────

// Reemplaza los turnos de un dia (asi tambien se borran los que se quitaron)
export async function subirTurnosDelDia(
  iglesiaId: string,
  fecha: string,
  turnos: (Turno & { rolNombre?: string })[],
) {
  if (!(await listo(iglesiaId))) return;
  const { error: e1 } = await supabase!
    .from("turnos")
    .delete()
    .eq("iglesia_id", iglesiaId)
    .eq("fecha", fecha);
  if (e1) throw e1;
  if (!turnos.length) return;
  const { error: e2 } = await supabase!.from("turnos").insert(
    turnos.map((t) => ({
      iglesia_id: iglesiaId,
      fecha,
      rol: t.rol,
      rol_nombre: t.rolNombre ?? null,
      persona: t.persona,
      hora: t.hora ?? null,
    })),
  );
  if (e2) throw e2;
}

// Turnos desde una fecha, agrupados por dia (como turnosEditados)
export async function bajarTurnos(iglesiaId: string, desde: string) {
  if (!(await listo(iglesiaId))) return null;
  const { data, error } = await supabase!
    .from("turnos")
    .select("fecha, rol, persona, hora")
    .eq("iglesia_id", iglesiaId)
    .gte("fecha", desde);
  if (error) throw error;
  const porDia: Record<string, Turno[]> = {};
  for (const t of data ?? []) {
    (porDia[t.fecha] ??= []).push({
      id: `${t.fecha}-${t.rol}`,
      fecha: t.fecha,
      rol: t.rol,
      persona: t.persona,
      ...(t.hora ? { hora: t.hora } : {}),
    });
  }
  return porDia;
}

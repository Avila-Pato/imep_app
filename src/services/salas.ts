import { asegurarSesion, supabase } from "@/lib/supabase";
import { Grupo } from "@/types/typesComunidad";
import { esUuid } from "./iglesias";

// Salas de cada iglesia en Supabase: las crea y cambia el pastor (o quien
// tiene el permiso "salas") y las ven todos los miembros

type FilaSala = {
  id: string;
  label: string;
  descripcion: string;
  icono: string;
  tono: string | null;
  lider: string | null;
  funciones: Grupo["funciones"] | null;
};

export async function subirSala(iglesiaId: string, g: Grupo) {
  if (!supabase || !esUuid(iglesiaId)) return;
  await asegurarSesion();
  const { error } = await supabase.from("salas").upsert({
    iglesia_id: iglesiaId,
    id: g.id,
    label: g.label,
    descripcion: g.descripcion ?? "",
    icono: g.icono,
    tono: g.tono ?? null,
    lider: g.lider ?? null,
    funciones: g.funciones ?? {},
  });
  if (error) throw error;
}

export async function borrarSalaRemota(iglesiaId: string, id: string) {
  if (!supabase || !esUuid(iglesiaId)) return;
  await asegurarSesion();
  const { error } = await supabase
    .from("salas")
    .delete()
    .eq("iglesia_id", iglesiaId)
    .eq("id", id);
  if (error) throw error;
}

export async function bajarSalas(iglesiaId: string) {
  if (!supabase || !esUuid(iglesiaId)) return null;
  await asegurarSesion();
  const { data, error } = await supabase
    .from("salas")
    .select("id, label, descripcion, icono, tono, lider, funciones")
    .eq("iglesia_id", iglesiaId)
    .order("creado");
  if (error) throw error;
  return (data as FilaSala[]).map((f): Grupo => ({
    id: f.id,
    label: f.label,
    descripcion: f.descripcion,
    icono: f.icono as Grupo["icono"],
    ...(f.tono ? { tono: f.tono } : {}),
    ...(f.lider ? { lider: f.lider } : {}),
    ...(f.funciones && Object.keys(f.funciones).length
      ? { funciones: f.funciones }
      : {}),
  }));
}

import { asegurarSesion, supabase } from "@/lib/supabase";
import { Grupo } from "@/types/typesComunidad";
import { esUuid } from "./iglesias";
import { subirImagen } from "./perfil";

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
  tipo: string | null;
  foto: string | null;
  solo_lider: boolean | null;
  letra_grande: boolean | null;
  ayudantes: string[] | null;
};

// Devuelve la URL de la foto si se subio una nueva (la del telefono)
export async function subirSala(iglesiaId: string, g: Grupo) {
  if (!supabase || !esUuid(iglesiaId)) return;
  await asegurarSesion();
  const foto =
    g.foto && !g.foto.startsWith("https://")
      ? await subirImagen(g.foto)
      : g.foto;
  const fila = {
    iglesia_id: iglesiaId,
    id: g.id,
    label: g.label,
    descripcion: g.descripcion ?? "",
    icono: g.icono,
    tono: g.tono ?? null,
    lider: g.lider ?? null,
    funciones: g.funciones ?? {},
    tipo: g.tipo ?? null,
    foto: foto || null,
    solo_lider: !!g.soloLider,
    letra_grande: !!g.letraGrande,
    ayudantes: g.ayudantes ?? [],
  };
  const { error } = await supabase.from("salas").upsert(fila);
  // el lider de la sala no puede editarla entera (no es administrador): va
  // por la funcion que solo cambia lo suyo (no el lider, no borrar)
  if (error?.code === "42501") {
    const { error: e2 } = await supabase.rpc("editar_mi_sala", {
      p_iglesia: iglesiaId,
      p_sala: g.id,
      p_datos: {
        label: fila.label,
        descripcion: fila.descripcion,
        icono: fila.icono,
        tono: fila.tono,
        funciones: fila.funciones,
        tipo: fila.tipo,
        foto: fila.foto ?? "",
        solo_lider: fila.solo_lider,
        letra_grande: fila.letra_grande,
      },
    });
    if (e2) throw e2;
  } else if (error) throw error;
  return foto !== g.foto ? foto : undefined;
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
    .select(
      "id, label, descripcion, icono, tono, lider, funciones, tipo, foto, solo_lider, letra_grande, ayudantes",
    )
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
    ...(f.tipo ? { tipo: f.tipo as Grupo["tipo"] } : {}),
    ...(f.foto ? { foto: f.foto } : {}),
    ...(f.solo_lider ? { soloLider: true } : {}),
    ...(f.letra_grande ? { letraGrande: true } : {}),
    ...(f.ayudantes?.length ? { ayudantes: f.ayudantes } : {}),
  }));
}

// El lider (o el pastor) elige quienes le ayudan a administrar la sala.
// Va por una funcion del servidor: el lider no puede editar la sala entera
export async function cambiarAyudantesRemoto(
  iglesiaId: string,
  sala: string,
  nombres: string[],
) {
  if (!supabase || !esUuid(iglesiaId)) return;
  await asegurarSesion();
  const { error } = await supabase.rpc("cambiar_ayudantes", {
    p_iglesia: iglesiaId,
    p_sala: sala,
    p_nombres: nombres,
  });
  if (error) throw error;
}

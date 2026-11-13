import { asegurarSesion, supabase } from "@/lib/supabase";
import { HorarioCulto } from "@/types/typesAnuncios";
import { Iglesia } from "@/types/typesHome";

// Iglesias, miembros e invitaciones en Supabase.
// Todas devuelven null / no hacen nada si la app no esta conectada

type FilaIglesia = {
  id: string;
  nombre: string;
  lugar: string;
  direccion: string;
  lat: number;
  lng: number;
  horarios: HorarioCulto[] | null;
};

const aIglesia = (f: FilaIglesia): Iglesia => ({
  id: f.id,
  sede: f.nombre,
  lugar: f.lugar,
  direccion: f.direccion,
  lat: f.lat,
  lng: f.lng,
  ...(Array.isArray(f.horarios) ? { horarios: f.horarios } : {}),
});

// Solo las iglesias con id uuid estan (o pueden estar) en el servidor;
// las antiguas del telefono tenian otro id
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const esUuid = (id?: string): id is string => !!id && UUID.test(id);

// uuid v4 para crear la iglesia en el telefono antes de subirla
export const nuevoUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

export const conectado = () => !!supabase;

// Crea la iglesia (quien la sube queda como pastor) o la actualiza
export async function subirIglesia(iglesia: Iglesia) {
  if (!supabase || !esUuid(iglesia.id)) return null;
  await asegurarSesion();
  const { data, error } = await supabase.rpc("guardar_iglesia", {
    p_id: iglesia.id,
    p_nombre: iglesia.sede,
    p_lugar: iglesia.lugar,
    p_direccion: iglesia.direccion,
    p_lat: iglesia.lat,
    p_lng: iglesia.lng,
    p_horarios: iglesia.horarios ?? null, // null: no los cambia
  });
  if (error) throw error;
  return aIglesia(data as FilaIglesia);
}

export async function borrarIglesia(id?: string) {
  if (!supabase || !esUuid(id)) return;
  await asegurarSesion();
  const { error } = await supabase.from("iglesias").delete().eq("id", id);
  if (error) throw error;
}

export type MiIglesia = {
  iglesia: Iglesia;
  rol: "pastor" | "hermano";
  sala?: string;
};

// Las iglesias de esta persona (como pastor o como hermano)
export async function misIglesias(): Promise<MiIglesia[] | null> {
  if (!supabase) return null;
  const yo = await asegurarSesion();
  if (!yo) return null;
  const { data, error } = await supabase
    .from("miembros")
    .select("rol, sala, unido, iglesias(*)")
    .eq("usuario_id", yo)
    .order("unido");
  if (error) throw error;
  return (data ?? []).flatMap((m) => {
    const f = m.iglesias as unknown as FilaIglesia | null;
    return f
      ? [
          {
            iglesia: { ...aIglesia(f), unido: m.unido ?? undefined },
            rol: m.rol,
            sala: m.sala ?? undefined,
          },
        ]
      : [];
  });
}

// El pastor crea (o renueva) el codigo de la iglesia o de una sala
export async function crearCodigo(iglesiaId: string, sala: string) {
  if (!supabase || !esUuid(iglesiaId)) return null;
  await asegurarSesion();
  const { data, error } = await supabase.rpc("generar_codigo", {
    p_iglesia: iglesiaId,
    p_sala: sala,
  });
  if (error) throw error;
  const fila = data as { codigo: string; creado: string; usos: number };
  return { codigo: fila.codigo, creado: fila.creado, usos: fila.usos };
}

// Codigos de la iglesia con cuantos se unieron (para el panel del pastor)
export async function codigosDe(iglesiaId: string) {
  if (!supabase || !esUuid(iglesiaId)) return null;
  await asegurarSesion();
  const { data, error } = await supabase
    .from("invitaciones")
    .select("codigo, sala, usos, creado")
    .eq("iglesia_id", iglesiaId);
  if (error) throw error;
  return data;
}

// "CONGREGA-4K7Q", "4K7Q", "congrega://unirse/4K7Q" o
// "https://congrega.expo.app/unirse?codigo=4K7Q" -> "4K7Q"
export function extraerCodigo(texto: string) {
  const t = texto.trim().toUpperCase();
  const m =
    t.match(/(?:CONGREGA-|UNIRSE\/|CODIGO=)([A-Z0-9]{4})\b/) ??
    t.match(/^([A-Z0-9]{4})$/);
  return m?.[1] ?? null;
}

// Revisa el codigo sin unirse: a que iglesia (y sala) lleva.
// null = no existe; undefined = no se pudo preguntar (sin servidor)
export async function verificarCodigo(texto: string) {
  const codigo = extraerCodigo(texto);
  if (!supabase) return undefined;
  if (!codigo) return null;
  await asegurarSesion();
  const { data, error } = await supabase.rpc("verificar_codigo", {
    p_codigo: codigo,
  });
  if (error) throw error;
  const fila = (data as { iglesia: string; sala: string | null }[])?.[0];
  return fila ? { iglesia: fila.iglesia, sala: fila.sala ?? undefined } : null;
}

// Un hermano se une con el codigo del pastor. null si el codigo no existe
export async function unirseConCodigo(texto: string, nombre?: string) {
  const codigo = extraerCodigo(texto);
  if (!supabase || !codigo) return null;
  await asegurarSesion();
  const { data, error } = await supabase.rpc("unirse_con_codigo", {
    p_codigo: codigo,
    p_nombre: nombre ?? null,
  });
  if (error) throw error;
  const fila = (data as { iglesia: FilaIglesia; sala: string | null }[])?.[0];
  return fila
    ? { iglesia: aIglesia(fila.iglesia), sala: fila.sala ?? undefined }
    : null;
}

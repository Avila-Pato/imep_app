import { asegurarSesion, supabase } from "@/lib/supabase";

// Nombre y foto de la persona en el servidor (tabla perfiles), para que su
// iglesia sepa quien es. Las fotos de la galeria quedan solo en el telefono:
// se sube la foto solo si es una URL (ej: la de Google)
export async function subirPerfil(datos: { nombre?: string; foto?: string }) {
  if (!supabase) return;
  const yo = await asegurarSesion();
  if (!yo) return;
  const fila: Record<string, string> = {
    id: yo,
    actualizado: new Date().toISOString(),
  };
  if (datos.nombre?.trim()) fila.nombre = datos.nombre.trim().slice(0, 80);
  if (datos.foto?.startsWith("https://")) fila.foto = datos.foto;
  const { error } = await supabase.from("perfiles").upsert(fila);
  if (error) throw error;
}

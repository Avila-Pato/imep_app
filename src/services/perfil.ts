import { asegurarSesion, supabase } from "@/lib/supabase";
import type { AvatarElegido } from "@/store/estudios";
import { File } from "expo-file-system";
import { Platform } from "react-native";

// Nombre y avatar de la persona en el servidor (tabla perfiles), para que su
// iglesia sepa quien es y vea su foto o chibi (cronograma, salas).
// Una foto de la galeria se sube a Storage; devuelve el avatar como quedo
// arriba (con el enlace de la foto) para no volver a subirla
export async function subirPerfil(datos: {
  nombre?: string;
  avatar?: AvatarElegido;
}): Promise<AvatarElegido | undefined> {
  if (!supabase) return;
  const yo = await asegurarSesion();
  if (!yo) return;

  let avatar = datos.avatar;
  if (avatar?.tipo === "foto" && !avatar.uri.startsWith("https://")) {
    avatar = { tipo: "foto", uri: await subirFoto(yo, avatar.uri) };
  }

  const fila: Record<string, unknown> = {
    id: yo,
    actualizado: new Date().toISOString(),
  };
  if (datos.nombre?.trim()) fila.nombre = datos.nombre.trim().slice(0, 80);
  if (avatar) {
    fila.avatar = avatar;
    fila.foto = avatar.tipo === "foto" ? avatar.uri : null;
  }
  const { error } = await supabase.from("perfiles").upsert(fila);
  if (error) throw error;
  return avatar;
}

// avatares/<usuario>/<archivo> (cada uno solo puede subir a su carpeta)
async function subirFoto(yo: string, uri: string) {
  const datos =
    Platform.OS === "web"
      ? await fetch(uri).then((r) => r.arrayBuffer())
      : await new File(uri).arrayBuffer();
  if (datos.byteLength < 1024) throw new Error("La foto llegó vacía");
  const png = uri.split("?")[0].toLowerCase().endsWith(".png");
  const ruta = `${yo}/${Date.now()}.${png ? "png" : "jpg"}`;
  const { error } = await supabase!.storage
    .from("avatares")
    .upload(ruta, datos, { contentType: png ? "image/png" : "image/jpeg" });
  if (error) throw error;
  return supabase!.storage.from("avatares").getPublicUrl(ruta).data.publicUrl;
}

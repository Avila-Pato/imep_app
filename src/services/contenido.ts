import { asegurarSesion, supabase } from "@/lib/supabase";
import { File } from "expo-file-system";
import { Platform } from "react-native";
import { Anuncio, CategoriaId } from "@/types/typesAnuncios";
import type { AvatarElegido } from "@/store/estudios";
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

// Sube una foto de la galeria a Storage (anuncios/<iglesia>/<archivo>) y
// devuelve su enlace publico: asi la ven los hermanos en su telefono
async function subirImagen(iglesiaId: string, anuncioId: string, uri: string) {
  const extension =
    uri.split("?")[0].split(".").pop()?.toLowerCase() === "png" ? "png" : "jpg";
  const tipo = extension === "png" ? "image/png" : "image/jpeg";
  // en el telefono fetch(file://) devuelve casi nada (subia 14 bytes):
  // se lee el archivo con expo-file-system. En la web, fetch sirve
  const datos =
    Platform.OS === "web"
      ? await fetch(uri).then((r) => r.arrayBuffer())
      : await new File(uri).arrayBuffer();
  if (datos.byteLength < 1024) throw new Error("La imagen llegó vacía");
  // nombre nuevo cada vez: si se cambia la imagen, no queda la vieja en cache
  const ruta = `${iglesiaId}/${anuncioId}-${Date.now()}.${extension}`;
  const { error } = await supabase!.storage
    .from("anuncios")
    .upload(ruta, datos, { contentType: tipo });
  if (error) throw error;
  return supabase!.storage.from("anuncios").getPublicUrl(ruta).data.publicUrl;
}

const esLocal = (uri?: string) => !!uri && !uri.startsWith("https://");

// Devuelve el anuncio como quedo arriba (con el enlace de la imagen), o
// null si no se subio (sin servidor o anuncio antiguo)
// alGuardar: la foto ya subio y empieza a guardar el anuncio (para el estado)
export async function subirAnuncio(
  iglesiaId: string,
  a: Anuncio,
  alGuardar?: () => void,
): Promise<Anuncio | null> {
  if (!(await listo(iglesiaId)) || !esUuid(a.id)) return null;
  const imagen = esLocal(a.imagen)
    ? await subirImagen(iglesiaId, a.id, a.imagen!)
    : a.imagen;
  alGuardar?.();
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
    imagen: imagen ?? null,
    imagen_aspecto: imagen ? (a.imagenAspecto ?? null) : null,
    autor: a.autor ?? null,
  });
  if (error) throw error;
  return { ...a, ...(imagen ? { imagen } : {}) };
}

// Borra el anuncio y su foto (si esta en Storage, no queda ocupando espacio)
export async function borrarAnuncioRemoto(id: string, imagen?: string) {
  if (!supabase || !esUuid(id)) return;
  await asegurarSesion();
  const { error } = await supabase.from("anuncios").delete().eq("id", id);
  if (error) throw error;
  const ruta = imagen?.split("/object/public/anuncios/")[1];
  if (ruta) {
    const { error: e2 } = await supabase.storage
      .from("anuncios")
      .remove([decodeURIComponent(ruta)]);
    if (e2) throw e2;
  }
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

// Llama a una Edge Function; si falla, el error dice cual y por que
// (ej: "avisar-turno 404: Requested function was not found")
async function llamarFuncion(nombre: string, body: object) {
  const { error } = await supabase!.functions.invoke(nombre, { body });
  if (!error) return;
  const r = (error as { context?: Response }).context;
  const detalle = r
    ? `${r.status}: ${await r
        .json()
        .then((j) => j.error ?? j.message ?? JSON.stringify(j))
        .catch(() => r.statusText)}`
    : error.message;
  throw new Error(`${nombre} ${detalle}`);
}

// Push a toda la iglesia (la Edge Function revisa que pueda publicar)
export async function avisarAnuncio(id: string) {
  if (!supabase) return;
  await llamarFuncion("avisar-anuncio", { anuncio_id: id });
}

// Pidio oracion: avisa al pastor y a los lideres (para aprobarla)
export async function avisarPeticion(id: string) {
  if (!supabase) return;
  await llamarFuncion("avisar-peticion", { peticion_id: id });
}

// El pastor la aprobo: avisa a quien la pidio
export async function avisarPeticionAprobada(id: string) {
  if (!supabase) return;
  await llamarFuncion("avisar-peticion", { peticion_id: id, aprobada: true });
}

// Aviso o devocional del lider: notifica a la sala (o a los elegidos)
export async function avisarMensaje(id: string) {
  if (!supabase) return;
  await llamarFuncion("avisar-mensaje", { mensaje_id: id });
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

// ───────────── Miembros ─────────────

export type MiembroIglesia = {
  id: string; // usuario
  nombre: string; // el de su perfil
  rol: "pastor" | "hermano";
  sala?: string; // sala a la que entro con su invitacion
  avatar?: AvatarElegido; // su foto o chibi
  unido?: string; // ISO: desde cuando esta en la iglesia
  sinChat?: boolean; // el pastor no lo deja escribir en el chat
  sinOracion?: boolean; // ni pedir oracion
  esYo?: boolean; // esta persona (por su usuario, no por el nombre)
};

// Los hermanos reales de la iglesia (los que se unieron con la invitacion)
export async function bajarMiembros(iglesiaId: string) {
  if (!(await listo(iglesiaId))) return null;
  const yo = await asegurarSesion();
  const { data, error } = await supabase!.rpc("miembros_de_iglesia", {
    p_iglesia: iglesiaId,
  });
  if (error) throw error;
  return (
    (data ?? []) as {
      usuario_id: string;
      nombre: string;
      rol: "pastor" | "hermano";
      sala: string | null;
      avatar: AvatarElegido | null;
      unido: string | null;
      sin_chat?: boolean;
      sin_oracion?: boolean;
    }[]
  ).map((m): MiembroIglesia => ({
    id: m.usuario_id,
    nombre: m.nombre,
    rol: m.rol,
    ...(m.sala ? { sala: m.sala } : {}),
    ...(m.avatar ? { avatar: m.avatar } : {}),
    ...(m.unido ? { unido: m.unido } : {}),
    ...(m.sin_chat ? { sinChat: true } : {}),
    ...(m.sin_oracion ? { sinOracion: true } : {}),
    ...(m.usuario_id === yo ? { esYo: true } : {}),
  }));
}

// El pastor (o quien tiene el permiso "roles") restringe a un hermano
export async function restringirMiembro(
  iglesiaId: string,
  usuarioId: string,
  sinChat: boolean,
  sinOracion: boolean,
) {
  if (!(await listo(iglesiaId))) return;
  const { error } = await supabase!.rpc("restringir_miembro", {
    p_iglesia: iglesiaId,
    p_usuario: usuarioId,
    p_sin_chat: sinChat,
    p_sin_oracion: sinOracion,
  });
  if (error) throw error;
}

// Push a la persona que asignaron en el cronograma (la Edge Function revisa
// que quien llama pueda editar el cronograma)
export async function avisarTurno(datos: {
  tipo: "asignado" | "quitado";
  iglesiaId: string;
  fecha: string;
  rol: string;
  hora?: string;
  persona: string;
}) {
  if (!supabase || !esUuid(datos.iglesiaId)) return;
  await llamarFuncion("avisar-turno", {
    tipo: datos.tipo,
    iglesia_id: datos.iglesiaId,
    fecha: datos.fecha,
    rol: datos.rol,
    hora: datos.hora,
    persona: datos.persona,
  });
}

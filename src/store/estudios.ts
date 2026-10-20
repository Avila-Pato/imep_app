import {
  EstudioGuardado,
  GrupoId,
  Mensaje,
  Publicacion,
  Revision,
  VersiculoGuardado,
} from "@/types/typesComunidad";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sigueGuardada } from "@/utils/peticiones";
import { useSyncExternalStore } from "react";

// Estado compartido entre pantallas (Estudio y Comunidad), guardado en el telefono.
// Cuando exista un backend, "publicar" y "alternarOrando" deberan llamar a la API.

type Estado = {
  guardados: EstudioGuardado[];
  publicaciones: Publicacion[]; // las que compartio esta persona
  orando: string[]; // ids de publicaciones donde marco "Orando"
  mensajes: Mensaje[]; // los que envio esta persona en los chats
  vistos: Partial<Record<GrupoId, string>>; // ultima vez que abrio cada sala (ISO)
  habitos: Record<string, string[]>; // "YYYY-MM-DD" -> ids de habitos cumplidos
  revisiones: Record<string, Revision>; // decisiones del lider sobre peticiones
  resaltados: Record<string, string>; // "libro-capitulo-verso" -> color
  versiculos: VersiculoGuardado[]; // guardados desde la Biblia
  grupo?: GrupoId; // grupo al que se unio (varones, jovenes, dorcas, ninos)
};

// v2: se reinicio todo (sin grupo) para probar desde cero
const CLAVE = "imep:estudios:v2";

let estado: Estado = {
  guardados: [],
  publicaciones: [],
  orando: [],
  mensajes: [],
  vistos: {},
  habitos: {},
  revisiones: {},
  resaltados: {},
  versiculos: [],
};
const oyentes = new Set<() => void>();

const avisar = () => oyentes.forEach((f) => f());

const cambiar = (nuevo: Estado) => {
  estado = nuevo;
  avisar();
  AsyncStorage.setItem(CLAVE, JSON.stringify(estado)).catch(() => {});
};

// Carga lo guardado al abrir la app (sin pisar cambios hechos mientras cargaba)
AsyncStorage.getItem(CLAVE)
  .then((texto) => {
    if (!texto) return;
    const previo: Estado = JSON.parse(texto);
    const unir = <T extends { id: string }>(a: T[], b: T[]) => [
      ...a,
      ...b.filter((x) => !a.some((y) => y.id === x.id)),
    ];
    estado = {
      ...estado,
      guardados: unir(estado.guardados, previo.guardados ?? []),
      revisiones: { ...(previo.revisiones ?? {}), ...estado.revisiones },
      // las peticiones vencidas (mas de 24 h) se borran del telefono
      publicaciones: unir(
        estado.publicaciones,
        previo.publicaciones ?? [],
      ).filter((p) =>
        sigueGuardada(p, { ...previo.revisiones, ...estado.revisiones }),
      ),
      orando: [...new Set([...estado.orando, ...(previo.orando ?? [])])],
      mensajes: unir(estado.mensajes, previo.mensajes ?? []),
      vistos: { ...(previo.vistos ?? {}), ...estado.vistos },
      habitos: { ...(previo.habitos ?? {}), ...estado.habitos },
      grupo: estado.grupo ?? previo.grupo,
      resaltados: { ...(previo.resaltados ?? {}), ...estado.resaltados },
      versiculos: unir(estado.versiculos, previo.versiculos ?? []),
    };
    avisar();
  })
  .catch(() => {});

const suscribir = (f: () => void) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};

export function useEstudios() {
  return useSyncExternalStore(suscribir, () => estado);
}

export function guardarEstudio(e: EstudioGuardado) {
  cambiar({
    ...estado,
    guardados: [e, ...estado.guardados.filter((x) => x.id !== e.id)],
  });
}

export function publicar(p: Publicacion) {
  cambiar({
    ...estado,
    publicaciones: [
      p,
      ...estado.publicaciones.filter(
        (x) => x.id !== p.id && sigueGuardada(x, estado.revisiones),
      ),
    ],
  });
}

export function alternarOrando(id: string) {
  cambiar({
    ...estado,
    orando: estado.orando.includes(id)
      ? estado.orando.filter((x) => x !== id)
      : [...estado.orando, id],
  });
}

export function enviarMensaje(m: Mensaje) {
  cambiar({ ...estado, mensajes: [...estado.mensajes, m] });
}

// Marca la sala como leida (para el contador de no leidos)
export function marcarVisto(grupo: GrupoId) {
  cambiar({
    ...estado,
    vistos: { ...estado.vistos, [grupo]: new Date().toISOString() },
  });
}

// Marca o desmarca un habito del dia ("Tu dia con Dios")
export function alternarHabito(fecha: string, id: string) {
  const hechos = estado.habitos[fecha] ?? [];
  cambiar({
    ...estado,
    habitos: {
      ...estado.habitos,
      [fecha]: hechos.includes(id)
        ? hechos.filter((x) => x !== id)
        : [...hechos, id],
    },
  });
}

// Unirse a un grupo (define el estudio de la semana y el muro de su sala).
// Sin grupo = salir. Luego esto lo hara el onboarding.
export function elegirGrupo(grupo?: GrupoId) {
  cambiar({ ...estado, grupo });
}

// El lider aprueba o rechaza una peticion (desde ahi corren las 24 h)
export function revisarPeticion(id: string, decision: Revision["estado"]) {
  cambiar({
    ...estado,
    revisiones: {
      ...estado.revisiones,
      [id]: { estado: decision, fecha: new Date().toISOString() },
    },
  });
}

// Resalta versiculos con un color (null = quitar el resaltado)
export function resaltar(claves: string[], color: string | null) {
  const resaltados = { ...estado.resaltados };
  claves.forEach((k) => {
    if (color) resaltados[k] = color;
    else delete resaltados[k];
  });
  cambiar({ ...estado, resaltados });
}

// Guarda un versiculo (o varios seguidos) en el perfil
export function guardarVersiculo(v: VersiculoGuardado) {
  cambiar({
    ...estado,
    versiculos: [v, ...estado.versiculos.filter((x) => x.id !== v.id)],
  });
}

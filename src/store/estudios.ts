import {
  EstudioGuardado,
  GrupoId,
  Mensaje,
  Publicacion,
} from "@/types/typesComunidad";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { oracionVigente } from "@/utils/tiempo";
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
  grupo?: GrupoId; // grupo al que se unio (varones, jovenes, dorcas, ninos)
};

const CLAVE = "imep:estudios:v1";

let estado: Estado = {
  guardados: [],
  publicaciones: [],
  orando: [],
  mensajes: [],
  vistos: {},
  habitos: {},
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
      // las peticiones vencidas (mas de 24 h) se borran del telefono
      publicaciones: unir(
        estado.publicaciones,
        previo.publicaciones ?? [],
      ).filter((p) => oracionVigente(p.fecha)),
      orando: [...new Set([...estado.orando, ...(previo.orando ?? [])])],
      mensajes: unir(estado.mensajes, previo.mensajes ?? []),
      vistos: { ...(previo.vistos ?? {}), ...estado.vistos },
      habitos: { ...(previo.habitos ?? {}), ...estado.habitos },
      grupo: estado.grupo ?? previo.grupo,
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
        (x) => x.id !== p.id && oracionVigente(x.fecha),
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

// Unirse a un grupo (define el estudio de la semana y el muro de su sala)
export function elegirGrupo(grupo: GrupoId) {
  cambiar({ ...estado, grupo });
}

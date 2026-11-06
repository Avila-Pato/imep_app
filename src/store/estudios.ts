import {
  EstudioGuardado,
  GrupoId,
  Mensaje,
  Publicacion,
  Revision,
  VersiculoGuardado,
} from "@/types/typesComunidad";
import { RolId, Turno } from "@/types/typesCronogramas";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sigueGuardada } from "@/utils/peticiones";
import { unirTurnos } from "@/utils/turnos";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { PersistStorage, persist } from "zustand/middleware";

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
  turnosEditados: Record<string, Turno[]>; // "YYYY-MM-DD" -> turnos que asigno el admin
  bienvenida?: boolean; // ya vio el onboarding (solo se muestra la primera vez)
  letra?: number; // tamaño de letra de la Biblia (1 = normal)
};

// v2: se reinicio todo (sin grupo) para probar desde cero
const CLAVE = "imep:estudios:v2";

// Guarda el estado tal cual (sin el envoltorio { state, version } de zustand)
// para seguir leyendo lo que ya estaba guardado en el telefono.
const almacen: PersistStorage<Estado> = {
  getItem: async (clave) => {
    const texto = await AsyncStorage.getItem(clave);
    return texto ? { state: JSON.parse(texto) } : null;
  },
  setItem: (clave, valor) =>
    AsyncStorage.setItem(clave, JSON.stringify(valor.state)),
  removeItem: (clave) => AsyncStorage.removeItem(clave),
};

const unir = <T extends { id: string }>(a: T[], b: T[]) => [
  ...a,
  ...b.filter((x) => !a.some((y) => y.id === x.id)),
];

const useStore = create<Estado>()(
  persist(
    (): Estado => ({
      guardados: [],
      publicaciones: [],
      orando: [],
      mensajes: [],
      vistos: {},
      habitos: {},
      revisiones: {},
      resaltados: {},
      versiculos: [],
      turnosEditados: {},
    }),
    {
      name: CLAVE,
      storage: almacen,
      // Carga lo guardado al abrir la app (sin pisar cambios hechos mientras cargaba)
      merge: (guardado, estado) => {
        const previo = (guardado ?? {}) as Partial<Estado>;
        const revisiones = {
          ...(previo.revisiones ?? {}),
          ...estado.revisiones,
        };
        return {
          ...estado,
          guardados: unir(estado.guardados, previo.guardados ?? []),
          revisiones,
          // las peticiones vencidas (mas de 24 h) se borran del telefono
          publicaciones: unir(
            estado.publicaciones,
            previo.publicaciones ?? [],
          ).filter((p) => sigueGuardada(p, revisiones)),
          orando: [...new Set([...estado.orando, ...(previo.orando ?? [])])],
          mensajes: unir(estado.mensajes, previo.mensajes ?? []),
          vistos: { ...(previo.vistos ?? {}), ...estado.vistos },
          habitos: { ...(previo.habitos ?? {}), ...estado.habitos },
          grupo: estado.grupo ?? previo.grupo,
          bienvenida: estado.bienvenida || previo.bienvenida,
          letra: estado.letra ?? previo.letra,
          resaltados: { ...(previo.resaltados ?? {}), ...estado.resaltados },
          versiculos: unir(estado.versiculos, previo.versiculos ?? []),
          turnosEditados: {
            ...(previo.turnosEditados ?? {}),
            ...estado.turnosEditados,
          },
        };
      },
    },
  ),
);

const cambiar = useStore.setState;

export function useEstudios() {
  return useStore();
}

// true cuando ya se cargo lo guardado en el telefono (evita mostrar
// el onboarding un instante a quien ya lo vio)
export function useCargado() {
  return useSyncExternalStore(
    (avisar) => useStore.persist.onFinishHydration(avisar),
    () => useStore.persist.hasHydrated(),
  );
}

// Agranda o achica la letra de la Biblia (para quienes ven poco)
export const LETRA_MIN = 0.8;
export const LETRA_MAX = 1.8;
export function fijarLetra(valor: number) {
  // pasos de 0.1, dentro del rango
  const nueva = Math.round(valor * 10) / 10;
  cambiar({ letra: Math.min(LETRA_MAX, Math.max(LETRA_MIN, nueva)) });
}

// Termina el onboarding (false = volver a verlo, para probar)
export function verBienvenida(vista: boolean) {
  cambiar({ bienvenida: vista });
}

export function guardarEstudio(e: EstudioGuardado) {
  cambiar((s) => ({
    guardados: [e, ...s.guardados.filter((x) => x.id !== e.id)],
  }));
}

export function publicar(p: Publicacion) {
  cambiar((s) => ({
    publicaciones: [
      p,
      ...s.publicaciones.filter(
        (x) => x.id !== p.id && sigueGuardada(x, s.revisiones),
      ),
    ],
  }));
}

export function alternarOrando(id: string) {
  cambiar((s) => ({
    orando: s.orando.includes(id)
      ? s.orando.filter((x) => x !== id)
      : [...s.orando, id],
  }));
}

export function enviarMensaje(m: Mensaje) {
  cambiar((s) => ({ mensajes: [...s.mensajes, m] }));
}

// Marca la sala como leida (para el contador de no leidos)
export function marcarVisto(grupo: GrupoId) {
  cambiar((s) => ({
    vistos: { ...s.vistos, [grupo]: new Date().toISOString() },
  }));
}

// Marca o desmarca un habito del dia ("Tu dia con Dios")
export function alternarHabito(fecha: string, id: string) {
  cambiar((s) => {
    const hechos = s.habitos[fecha] ?? [];
    return {
      habitos: {
        ...s.habitos,
        [fecha]: hechos.includes(id)
          ? hechos.filter((x) => x !== id)
          : [...hechos, id],
      },
    };
  });
}

// Unirse a un grupo (define el estudio de la semana y el muro de su sala).
// Sin grupo = salir. Luego esto lo hara el onboarding.
export function elegirGrupo(grupo?: GrupoId) {
  cambiar({ grupo });
}

// El lider aprueba o rechaza una peticion (desde ahi corren las 24 h)
export function revisarPeticion(id: string, decision: Revision["estado"]) {
  cambiar((s) => ({
    revisiones: {
      ...s.revisiones,
      [id]: { estado: decision, fecha: new Date().toISOString() },
    },
  }));
}

// Resalta versiculos con un color (null = quitar el resaltado)
export function resaltar(claves: string[], color: string | null) {
  cambiar((s) => {
    const resaltados = { ...s.resaltados };
    claves.forEach((k) => {
      if (color) resaltados[k] = color;
      else delete resaltados[k];
    });
    return { resaltados };
  });
}

// El admin asigna (o quita, con null) a la persona de un rol en un culto.
// Luego esto lo guardara la API para que lo vea toda la iglesia.
export function asignarTurno(
  fecha: string,
  rol: RolId,
  persona: string | null,
) {
  cambiar((s) => {
    const otros = unirTurnos(s.turnosEditados).filter(
      (t) => t.fecha === fecha && t.rol !== rol,
    );
    const turnos = persona
      ? [...otros, { id: `${fecha}-${rol}`, fecha, rol, persona }]
      : otros;
    return { turnosEditados: { ...s.turnosEditados, [fecha]: turnos } };
  });
}

// Guarda un versiculo (o varios seguidos) en el perfil
export function guardarVersiculo(v: VersiculoGuardado) {
  cambiar((s) => ({
    versiculos: [v, ...s.versiculos.filter((x) => x.id !== v.id)],
  }));
}

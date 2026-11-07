import {
  Desafio,
  EstudioGuardado,
  Grupo,
  GrupoId,
  Mensaje,
  Publicacion,
  Revision,
  VersiculoGuardado,
} from "@/types/typesComunidad";
import { IGLESIA } from "@/assets/data/homeMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import { Iglesia } from "@/types/typesHome";
import {
  BIBLIA_VERSION,
  CARGOS,
  GRUPOS,
  ROL_GENERICO,
  ROLES,
} from "@/constants/constans";
import { CargoId, Permiso } from "@/types/typesCargos";
import { Anuncio } from "@/types/typesAnuncios";
import { Predicacion } from "@/types/typesOraciones";
import { Rol, RolId, Turno } from "@/types/typesCronogramas";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { esLider, sigueGuardada } from "@/utils/peticiones";
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
  desafios: Desafio[]; // "Palabra de la semana" de cada sala
  salasEditadas: Record<string, Partial<Grupo>>; // cambios a las salas de base (Iglesia)
  meGusta: string[]; // versiculos con "me gusta" ("libro-capitulo-verso")
  vistos: Partial<Record<GrupoId, string>>; // ultima vez que abrio cada sala (ISO)
  habitos: Record<string, string[]>; // "YYYY-MM-DD" -> ids de habitos cumplidos
  revisiones: Record<string, Revision>; // decisiones del lider sobre peticiones
  resaltados: Record<string, string>; // "libro-capitulo-verso" -> color
  versiculos: VersiculoGuardado[]; // guardados desde la Biblia
  grupo?: GrupoId; // sala de grupo a la que se unio (una que creo el pastor)
  turnosEditados: Record<string, Turno[]>; // "YYYY-MM-DD" -> turnos que asigno el admin
  bienvenida?: boolean; // ya vio el onboarding (solo se muestra la primera vez)
  letra?: number; // tamaño de letra de la Biblia (1 = normal)
  version?: string; // version de la Biblia elegida (RV1960, NTV, LBLA)
  nombre?: string; // como quiere que la llamemos (onboarding)
  motivos?: string[]; // que la trae a la app (onboarding)
  rol?: RolIglesia; // quien es en la iglesia (el pastor administra)
  cargos: Record<string, CargoId[]>; // nombre -> roles que le dio el pastor
  salas: Grupo[]; // salas nuevas que creo el pastor (ademas de las de base)
  iglesia?: Iglesia; // la puso el pastor, o llega al unirse con una invitacion
  codigos: Partial<Record<GrupoId, CodigoInvitacion>>; // del pastor: "general" = iglesia
  avisos: Partial<Record<TipoAviso, boolean>>; // notificaciones que quiere (sin dato = si)
  invitados: string[]; // nombres agregados a mano en el cronograma (sin cuenta en la app)
  rolesExtra: Record<string, Rol>; // casillas nuevas del cronograma (ej: Devocional)
  anuncios: Anuncio[]; // los que publico el pastor / secretaria / comunicaciones
  predicaciones: Predicacion[]; // las sube el pastor (o quien publica anuncios)
};

// Notificaciones que la persona puede activar o apagar
export type TipoAviso = "cultos" | "turnos" | "anuncios";

// Codigo que reparte el pastor (de la iglesia o de una sala)
export type CodigoInvitacion = {
  codigo: string; // ej: "4K7Q" (se muestra como IMEP-4K7Q)
  creado: string; // ISO
  usos: number; // cuantos se unieron con el
};

export type RolIglesia = "pastor" | "hermano";

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

// Estado de una app recien instalada
const inicial = (): Estado => ({
  guardados: [],
  publicaciones: [],
  orando: [],
  mensajes: [],
  desafios: [],
  salasEditadas: {},
  meGusta: [],
  vistos: {},
  habitos: {},
  revisiones: {},
  resaltados: {},
  versiculos: [],
  turnosEditados: {},
  cargos: {},
  salas: [],
  codigos: {},
  avisos: {},
  invitados: [],
  rolesExtra: {},
  anuncios: [],
  predicaciones: [],
});

const useStore = create<Estado>()(
  persist(inicial, {
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
        desafios: unir(estado.desafios, previo.desafios ?? []),
        meGusta: [...new Set([...estado.meGusta, ...(previo.meGusta ?? [])])],
        salasEditadas: {
          ...(previo.salasEditadas ?? {}),
          ...estado.salasEditadas,
        },
        vistos: { ...(previo.vistos ?? {}), ...estado.vistos },
        habitos: { ...(previo.habitos ?? {}), ...estado.habitos },
        grupo: estado.grupo ?? previo.grupo,
        bienvenida: estado.bienvenida || previo.bienvenida,
        letra: estado.letra ?? previo.letra,
        version: estado.version ?? previo.version,
        nombre: estado.nombre ?? previo.nombre,
        motivos: estado.motivos ?? previo.motivos,
        rol: estado.rol ?? previo.rol,
        cargos: { ...(previo.cargos ?? {}), ...estado.cargos },
        salas: unir(estado.salas, previo.salas ?? []),
        iglesia: estado.iglesia ?? previo.iglesia,
        codigos: { ...(previo.codigos ?? {}), ...estado.codigos },
        avisos: { ...(previo.avisos ?? {}), ...estado.avisos },
        rolesExtra: { ...(previo.rolesExtra ?? {}), ...estado.rolesExtra },
        anuncios: unir(estado.anuncios, previo.anuncios ?? []),
        predicaciones: unir(estado.predicaciones, previo.predicaciones ?? []),
        invitados: [
          ...new Set([...estado.invitados, ...(previo.invitados ?? [])]),
        ],
        resaltados: { ...(previo.resaltados ?? {}), ...estado.resaltados },
        versiculos: unir(estado.versiculos, previo.versiculos ?? []),
        turnosEditados: {
          ...(previo.turnosEditados ?? {}),
          ...estado.turnosEditados,
        },
      };
    },
  }),
);

const cambiar = useStore.setState;

// Deja la app como recien instalada (rol, iglesia, mapa, salas, todo)
// y vuelve a mostrar la bienvenida para elegir pastor o hermano
export function reiniciarApp() {
  useStore.setState(inicial(), true);
}

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

// Version de la Biblia que se lee en toda la app
export function useVersion() {
  return useStore((s) => s.version) ?? BIBLIA_VERSION;
}
export function elegirVersion(version: string) {
  cambiar({ version });
}

// Datos del onboarding (luego iran a la cuenta en el backend)
export function guardarPerfil(datos: {
  nombre?: string;
  motivos?: string[];
  rol?: RolIglesia;
}) {
  cambiar(datos);
}

// El pastor administra la app (turnos, roles...). Mock: lo elige en el
// onboarding; con backend habra que verificarlo
export function useEsPastor() {
  return useStore((s) => s.rol) === "pastor";
}

// ¿Esta persona puede editar esto? El pastor siempre; el resto si alguno
// de sus roles lo permite. Mock: se revisa con el nombre de esta persona
export function usePuede(permiso: Permiso) {
  return useStore(
    (s) =>
      s.rol === "pastor" ||
      (s.cargos[s.nombre ?? USUARIO.nombre] ?? []).some((c) =>
        CARGOS[c].permisos.includes(permiso),
      ),
  );
}

// ¿Maneja esta sala? (palabra de la semana, aprobar peticiones)
// El pastor, los administradores (quien asigna roles) y el lider de la sala
export function useEsLider(grupo: GrupoId) {
  const esPastor = useEsPastor();
  const admin = usePuede("roles");
  const yo = useStore((s) => s.nombre ?? USUARIO.nombre);
  const lider = useStore((s) => s.salas.find((g) => g.id === grupo)?.lider);
  return (
    esPastor ||
    admin ||
    (!!lider && (lider === yo || lider === USUARIO.nombre)) ||
    esLider(USUARIO.nombre, grupo)
  );
}

// Iglesia de esta persona (sin iglesia = hermano que aun no se une)
export function useIglesia() {
  return useStore((s) => s.iglesia);
}

// El pastor guarda o cambia la ubicacion de su iglesia
export function fijarIglesia(iglesia: Iglesia) {
  cambiar({ iglesia });
}

// Un hermano se une con la invitacion del pastor: llega la iglesia (con la
// ubicacion que marco el pastor) y, si la invitacion es de un grupo, su sala.
// Mock: sin backend, la iglesia es la de ejemplo
export function aceptarInvitacion(grupo?: GrupoId, codigo?: string) {
  cambiar((s) => {
    // suma un uso al codigo con el que entro (para el panel del pastor)
    const usado = (Object.keys(s.codigos) as GrupoId[]).find(
      (g) => s.codigos[g]?.codigo === codigo,
    );
    const actual = usado ? s.codigos[usado] : undefined;
    return {
      iglesia: s.iglesia ?? IGLESIA,
      grupo: grupo ?? s.grupo,
      codigos:
        usado && actual
          ? { ...s.codigos, [usado]: { ...actual, usos: actual.usos + 1 } }
          : s.codigos,
    };
  });
}

// Sin letras que se confunden (0/O, 1/I/L)
const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// El pastor crea (o renueva) el codigo de la iglesia ("general") o de una
// sala. Renovar invalida el anterior. Mock: luego lo generara el servidor
export function generarCodigo(grupo: GrupoId) {
  cambiar((s) => {
    const usados = Object.values(s.codigos).map((c) => c?.codigo);
    let codigo = "";
    do {
      codigo = Array.from(
        { length: 4 },
        () => LETRAS[Math.floor(Math.random() * LETRAS.length)],
      ).join("");
    } while (usados.includes(codigo));
    return {
      codigos: {
        ...s.codigos,
        [grupo]: { codigo, creado: new Date().toISOString(), usos: 0 },
      },
    };
  });
}

// Todas las salas: las de base y las que creo el pastor
export function useGrupos(): Grupo[] {
  const creadas = useStore((s) => s.salas);
  const editadas = useStore((s) => s.salasEditadas);
  return [...GRUPOS.map((g) => ({ ...g, ...editadas[g.id] })), ...creadas];
}

// El pastor cambia una sala ya creada (nombre, lider, que tiene...)
export function editarSala(id: GrupoId, cambios: Partial<Omit<Grupo, "id">>) {
  cambiar((s) =>
    s.salas.some((g) => g.id === id)
      ? {
          salas: s.salas.map((g) => (g.id === id ? { ...g, ...cambios } : g)),
        }
      : {
          salasEditadas: {
            ...s.salasEditadas,
            [id]: { ...s.salasEditadas[id], ...cambios },
          },
        },
  );
}

// Borra una sala creada (la de toda la iglesia no se puede borrar)
export function borrarSala(id: GrupoId) {
  cambiar((s) => ({
    salas: s.salas.filter((g) => g.id !== id),
    desafios: s.desafios.filter((d) => d.grupo !== id),
    grupo: s.grupo === id ? undefined : s.grupo,
  }));
}

// El pastor crea una sala nueva (ej: "Alabanza", "Matrimonios")
// "Matrimonios Jóvenes" -> "matrimonios-jovenes"
const aSlug = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function crearSala(sala: Omit<Grupo, "id">) {
  const base = aSlug(sala.label);
  cambiar((s) => {
    // id unico aunque se repita el nombre
    const usados = [...GRUPOS, ...s.salas].map((g) => g.id);
    let id = base || "sala";
    for (let n = 2; usados.includes(id); n++) id = `${base}-${n}`;
    return { salas: [...s.salas, { ...sala, id }] };
  });
}

// El pastor da o quita un rol a un hermano (puede tener varios)
export function alternarCargo(persona: string, cargo: CargoId) {
  cambiar((s) => {
    const actuales = s.cargos[persona] ?? [];
    return {
      cargos: {
        ...s.cargos,
        [persona]: actuales.includes(cargo)
          ? actuales.filter((c) => c !== cargo)
          : [...actuales, cargo],
      },
    };
  });
}

// Prende o apaga un tipo de notificacion
export function alternarAviso(tipo: TipoAviso) {
  cambiar((s) => ({
    avisos: { ...s.avisos, [tipo]: !(s.avisos[tipo] ?? true) },
  }));
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

// El lider da la "Palabra de la semana" (reemplaza la que hubiera en la sala)
export function crearDesafio(d: Omit<Desafio, "id" | "desde">) {
  cambiar((s) => ({
    desafios: [
      ...s.desafios.filter((x) => x.grupo !== d.grupo),
      { ...d, id: `d-${Date.now()}`, desde: new Date().toISOString() },
    ],
  }));
}

export function terminarDesafio(id: string) {
  cambiar((s) => ({ desafios: s.desafios.filter((d) => d.id !== id) }));
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
// Publica un anuncio nuevo o guarda los cambios de uno existente
export function guardarAnuncio(a: Omit<Anuncio, "id"> & { id?: string }) {
  cambiar((s) => {
    if (a.id && s.anuncios.some((x) => x.id === a.id)) {
      return {
        anuncios: s.anuncios.map((x) =>
          x.id === a.id ? { ...a, id: x.id } : x,
        ),
      };
    }
    return { anuncios: [{ ...a, id: `a-${Date.now()}` }, ...s.anuncios] };
  });
}

// Predicaciones: las que ya ocurrieron, la mas reciente primero
export function usePredicaciones() {
  const todas = useStore((s) => s.predicaciones);
  const hoy = aKeyHoy();
  return [...todas]
    .filter((p) => p.fecha <= hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

const aKeyHoy = () => {
  const f = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())}`;
};

export function guardarPredicacion(
  p: Omit<Predicacion, "id"> & { id?: string },
) {
  cambiar((s) =>
    p.id && s.predicaciones.some((x) => x.id === p.id)
      ? {
          predicaciones: s.predicaciones.map((x) =>
            x.id === p.id ? { ...x, ...p, id: x.id } : x,
          ),
        }
      : {
          predicaciones: [{ ...p, id: `p-${Date.now()}` }, ...s.predicaciones],
        },
  );
}

export function borrarPredicacion(id: string) {
  cambiar((s) => ({
    predicaciones: s.predicaciones.filter((p) => p.id !== id),
  }));
}

export function borrarAnuncio(id: string) {
  cambiar((s) => ({ anuncios: s.anuncios.filter((a) => a.id !== id) }));
}

// Casillas del cronograma: las de la app + las que agrego la iglesia
export function useRoles() {
  const extra = useStore((s) => s.rolesExtra);
  const todos: Record<string, Rol> = { ...ROLES, ...extra };
  return {
    lista: Object.keys(todos) as RolId[],
    de: (id: RolId) => todos[id] ?? ROL_GENERICO,
    esNueva: (id: RolId) => id in extra, // solo esas se pueden borrar
  };
}

// Agrega una casilla al cronograma de todos los cultos
export function crearRol(rol: Rol) {
  const base = aSlug(rol.label) || "casilla";
  cambiar((s) => {
    const usados = [...Object.keys(ROLES), ...Object.keys(s.rolesExtra)];
    let id = base;
    for (let n = 2; usados.includes(id); n++) id = `${base}-${n}`;
    return { rolesExtra: { ...s.rolesExtra, [id]: rol } };
  });
}

// Borra una casilla nueva y los turnos que tenia asignados
export function quitarRol(id: RolId) {
  cambiar((s) => {
    const { [id]: _, ...resto } = s.rolesExtra;
    const turnosEditados = Object.fromEntries(
      Object.entries(s.turnosEditados).map(([f, ts]) => [
        f,
        ts.filter((t) => t.rol !== id),
      ]),
    );
    return { rolesExtra: resto, turnosEditados };
  });
}

// Guarda un nombre escrito a mano para volver a elegirlo despues
export function agregarInvitado(nombre: string) {
  const limpio = nombre.trim().replace(/\s+/g, " ");
  if (!limpio) return;
  cambiar((s) =>
    s.invitados.includes(limpio) ? s : { invitados: [...s.invitados, limpio] },
  );
}

export function quitarInvitado(nombre: string) {
  cambiar((s) => ({ invitados: s.invitados.filter((n) => n !== nombre) }));
}

export function asignarTurno(
  fecha: string,
  rol: RolId,
  persona: string | null,
  hora?: string, // sin hora: mantiene la que tenia (o la del culto)
) {
  cambiar((s) => {
    const delDia = unirTurnos(s.turnosEditados).filter(
      (t) => t.fecha === fecha,
    );
    const otros = delDia.filter((t) => t.rol !== rol);
    const antes = delDia.find((t) => t.rol === rol);
    const nuevaHora = hora ?? antes?.hora;
    const turnos = persona
      ? [
          ...otros,
          {
            id: `${fecha}-${rol}`,
            fecha,
            rol,
            persona,
            ...(nuevaHora ? { hora: nuevaHora } : {}),
          },
        ]
      : otros;
    return { turnosEditados: { ...s.turnosEditados, [fecha]: turnos } };
  });
}

// Cambia solo la hora de un turno ya asignado
export function fijarHoraTurno(fecha: string, rol: RolId, hora: string) {
  cambiar((s) => {
    const delDia = unirTurnos(s.turnosEditados).filter(
      (t) => t.fecha === fecha,
    );
    if (!delDia.some((t) => t.rol === rol)) return s;
    return {
      turnosEditados: {
        ...s.turnosEditados,
        [fecha]: delDia.map((t) => (t.rol === rol ? { ...t, hora } : t)),
      },
    };
  });
}

// Guarda un versiculo (o varios seguidos) en el perfil
// "Me gusta" de un versiculo: el doble toque solo lo da; el boton lo quita
export function darMeGusta(clave: string) {
  cambiar((s) =>
    s.meGusta.includes(clave) ? s : { meGusta: [...s.meGusta, clave] },
  );
}
export function alternarMeGusta(clave: string) {
  cambiar((s) => ({
    meGusta: s.meGusta.includes(clave)
      ? s.meGusta.filter((c) => c !== clave)
      : [...s.meGusta, clave],
  }));
}

export function guardarVersiculo(v: VersiculoGuardado) {
  cambiar((s) => ({
    versiculos: [v, ...s.versiculos.filter((x) => x.id !== v.id)],
  }));
}

import { HORARIOS_CULTO as HORARIOS_POR_DEFECTO } from "@/assets/data/configMocks";
import { IGLESIA } from "@/assets/data/homeMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BIBLIA_VERSION,
  CARGOS,
  GRUPOS,
  ROL_GENERICO,
  ROLES,
} from "@/constants/constans";
import { Anuncio, HorarioCulto } from "@/types/typesAnuncios";
import { CargoId, Permiso } from "@/types/typesCargos";
import {
  Desafio,
  EstudioGuardado,
  Grupo,
  GrupoId,
  Mensaje,
  Publicacion,
  Revision,
  ValorRespuesta,
  VersiculoGuardado,
} from "@/types/typesComunidad";
import { Rol, RolId, Turno } from "@/types/typesCronogramas";
import { Iglesia } from "@/types/typesHome";
import { Predicacion } from "@/types/typesOraciones";
import { subirPerfil } from "@/services/perfil";
import {
  borrarDelServidor,
  eliminarCuentaDelServidor,
} from "@/services/reinicio";
import { registrarDispositivo } from "@/services/push";
import { horaTurno, usarHorarios } from "@/utils/cultos";
import {
  avisarAnuncio,
  avisarMensaje,
  avisarPeticion,
  avisarPeticionAprobada,
  avisarSala,
  avisarCargo,
  bajarCargos,
  cambiarCargoRemoto,
  quitarMiembroRemoto,
  avisarTurno,
  bajarAnuncios,
  bajarMiembros,
  type MiembroIglesia,
  bajarTurnos,
  borrarAnuncioRemoto,
  restringirMiembro,
  subirAnuncio,
  subirTurnosDelDia,
} from "@/services/contenido";
import {
  borrarIglesia,
  conectado,
  crearCodigo,
  esUuid,
  misIglesias,
  nuevoUuid,
  subirIglesia,
} from "@/services/iglesias";
import {
  bajarMensajes,
  bajarPrivados,
  bajarReacciones,
  reaccionarRemoto,
  bajarRespuestas,
  responderRemoto,
  subirMensaje,
  subirPrivado,
} from "@/services/chat";
import { pedirResena } from "@/services/resena";
import {
  bajarSalas,
  borrarSalaRemota,
  cambiarAyudantesRemoto,
  subirSala,
} from "@/services/salas";
import {
  bajarPeticiones,
  borrarPeticionRemota,
  fijarPeticionRemota,
  orarPor,
  revisarPeticionRemota,
  subirPeticion,
} from "@/services/peticiones";
import { esPrivado, idPrivado, otroDe } from "@/utils/privado";
import { esLider, sigueGuardada } from "@/utils/peticiones";
import { unirTurnos } from "@/utils/turnos";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";

// Estado compartido entre pantallas (Estudio y Comunidad), guardado en el telefono.
// Cuando exista un backend, "publicar" y "alternarOrando" deberan llamar a la API.

type Estado = {
  guardados: EstudioGuardado[];
  publicaciones: Publicacion[]; // las que compartio esta persona
  orando: string[]; // ids de publicaciones donde marco "Orando"
  mensajes: Mensaje[]; // los que envio esta persona en los chats
  // "Vaciar chat": desde cuando ve cada sala o privado (solo en su telefono)
  vaciados?: Record<string, string>;
  desafios: Desafio[]; // "Palabra de la semana" de cada sala
  salasEditadas: Record<string, Partial<Grupo>>; // cambios a las salas de base (Iglesia)
  meGusta: string[]; // versiculos con "me gusta" ("libro-capitulo-verso")
  meGustaTextos: Record<string, MeGustaInfo>; // cita y texto de cada uno (para el perfil)
  ayudasVistas: string[]; // explicaciones que ya vio (salen solo una vez)
  // versiculos que ya salieron en "Para ti" (para no repetirlos)
  versosVistos?: string[];
  turnosAvisados?: string[]; // turnos suyos ya avisados (sin dato = primera vez)
  anunciosAvisados?: string[]; // anuncios ya avisados (sin dato = primera vez)
  subidas?: Record<string, Subida>; // lo que se esta subiendo (o fallo): anuncios y dias del cronograma
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
  avatar?: AvatarElegido; // chibi o foto (Editar perfil); sin esto, sus iniciales
  cuenta?: CuentaConectada; // con que cuenta entro (Google); sin esto, anonimo
  invitacion?: string; // codigo del enlace que abrio antes del onboarding
  portada?: string; // imagen de fondo arriba del perfil (galeria)
  fuenteBiblia?: FuenteBiblia; // letra para leer la Biblia
  codigoVisto?: boolean; // pastor: ya le mostramos donde esta su codigo
  resena?: Resena; // cuando pedirle estrellas en la tienda
  versionPospuesta?: string; // "Mas tarde" a esta version nueva (sugerida)
  motivos?: string[]; // que la trae a la app (onboarding)
  rol?: RolIglesia; // quien es en la iglesia (el pastor administra)
  cargos: Record<string, CargoId[]>; // nombre -> roles que le dio el pastor
  salas: Grupo[]; // salas nuevas que creo el pastor (ademas de las de base)
  iglesia?: Iglesia; // la activa: la puso el pastor, o llega al unirse con una invitacion
  iglesias?: Iglesia[]; // todas las suyas (sin dato = solo "iglesia")
  porIglesia?: Record<string, DatosIglesia>; // lo de las iglesias que no estan activas
  codigos: Partial<Record<GrupoId, CodigoInvitacion>>; // del pastor: "general" = iglesia
  avisos: Partial<Record<TipoAviso, boolean>>; // notificaciones que quiere (sin dato = si)
  invitados: string[]; // nombres agregados a mano en el cronograma (sin cuenta en la app)
  rolesExtra: Record<string, Rol>; // casillas nuevas del cronograma (ej: Devocional)
  anuncios: Anuncio[]; // los que publico el pastor / secretaria / comunicaciones
  predicaciones: Predicacion[]; // las sube el pastor (o quien publica anuncios)
  miembros: MiembroIglesia[]; // los hermanos reales de la iglesia (del servidor)
};

// La cuenta de Google con la que entro (para mostrarla en el Perfil)
export type CuentaConectada = {
  proveedor: "google";
  correo?: string;
  nombre?: string; // nombre completo en Google
  foto?: string; // URL de su foto de Google
};

// Estado de una subida al servidor (para mostrar "Subiendo…" y reintentar).
// Clave: el id del anuncio, o "dia:<iglesia>:<fecha>" para el cronograma
export type EtapaSubida = "foto" | "guardando" | "avisando" | "listo" | "error";
export type Subida = {
  etapa: EtapaSubida;
  desde: string; // ISO: cuando empezo (para mostrar los segundos)
  iglesiaId: string;
  // avisar a la iglesia al terminar: anuncio nuevo (true, como antes) o
  // "cambio" (se edito el dia, la hora o el lugar)
  avisar?: boolean | "cambio";
  error?: string;
};

// Notificaciones que la persona puede activar o apagar
export type TipoAviso = "cultos" | "turnos" | "anuncios" | "salas";

// Codigo que reparte el pastor (de la iglesia o de una sala)
export type CodigoInvitacion = {
  codigo: string; // ej: "4K7Q" (se muestra como CONGREGA-4K7Q)
  creado: string; // ISO
  usos: number; // cuantos se unieron con el
  enServidor?: boolean; // lo creo Supabase (los demas solo existen en el telefono)
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
// "Para ti": cuantos versiculos vistos se recuerdan; con mas se olvidan los
// mas viejos (la Biblia tiene ~31.000). Arriba: se usa al cargar lo guardado
const MAX_VERSOS_VISTOS = 5000;

const inicial = (): Estado => ({
  guardados: [],
  publicaciones: [],
  orando: [],
  mensajes: [],
  desafios: [],
  salasEditadas: {},
  meGusta: [],
  meGustaTextos: {},
  ayudasVistas: [],
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
  miembros: [],
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
        meGustaTextos: {
          ...(previo.meGustaTextos ?? {}),
          ...estado.meGustaTextos,
        },
        turnosAvisados: estado.turnosAvisados ?? previo.turnosAvisados,
        anunciosAvisados: estado.anunciosAvisados ?? previo.anunciosAvisados,
        subidas: { ...(previo.subidas ?? {}), ...estado.subidas },
        ayudasVistas: [
          ...new Set([...estado.ayudasVistas, ...(previo.ayudasVistas ?? [])]),
        ],
        versosVistos: [
          ...new Set([
            ...(previo.versosVistos ?? []),
            ...(estado.versosVistos ?? []),
          ]),
        ].slice(-MAX_VERSOS_VISTOS),
        salasEditadas: {
          ...(previo.salasEditadas ?? {}),
          ...estado.salasEditadas,
        },
        vistos: { ...(previo.vistos ?? {}), ...estado.vistos },
        vaciados: { ...(previo.vaciados ?? {}), ...(estado.vaciados ?? {}) },
        habitos: { ...(previo.habitos ?? {}), ...estado.habitos },
        grupo: estado.grupo ?? previo.grupo,
        bienvenida: estado.bienvenida || previo.bienvenida,
        letra: estado.letra ?? previo.letra,
        version: estado.version ?? previo.version,
        nombre: estado.nombre ?? previo.nombre,
        avatar: estado.avatar ?? previo.avatar,
        cuenta: estado.cuenta ?? previo.cuenta,
        invitacion: estado.invitacion ?? previo.invitacion,
        portada: estado.portada ?? previo.portada,
        fuenteBiblia: estado.fuenteBiblia ?? previo.fuenteBiblia,
        codigoVisto: estado.codigoVisto ?? previo.codigoVisto,
        resena: estado.resena ?? previo.resena,
        versionPospuesta: estado.versionPospuesta ?? previo.versionPospuesta,
        motivos: estado.motivos ?? previo.motivos,
        rol: estado.rol ?? previo.rol,
        cargos: { ...(previo.cargos ?? {}), ...estado.cargos },
        salas: unir(estado.salas, previo.salas ?? []),
        iglesia: estado.iglesia ?? previo.iglesia,
        iglesias: estado.iglesias ?? previo.iglesias,
        porIglesia: { ...(previo.porIglesia ?? {}), ...estado.porIglesia },
        codigos: { ...(previo.codigos ?? {}), ...estado.codigos },
        avisos: { ...(previo.avisos ?? {}), ...estado.avisos },
        rolesExtra: { ...(previo.rolesExtra ?? {}), ...estado.rolesExtra },
        anuncios: unir(estado.anuncios, previo.anuncios ?? []),
        predicaciones: unir(estado.predicaciones, previo.predicaciones ?? []),
        miembros: estado.miembros.length
          ? estado.miembros
          : (previo.miembros ?? []),
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

// Los horarios de culto siguen a la iglesia activa (antes de que se dibujen
// las pantallas: este aviso se registra primero)
usarHorarios(useStore.getState().iglesia?.horarios);
useStore.subscribe((s, antes) => {
  if (s.iglesia?.horarios !== antes.iglesia?.horarios) {
    usarHorarios(s.iglesia?.horarios);
  }
});

// Dias y horarios de culto de la iglesia activa (para las pantallas)
export function useHorarios(): HorarioCulto[] {
  return useStore((s) => s.iglesia?.horarios) ?? HORARIOS_POR_DEFECTO;
}
// ¿Ya configuro sus horarios? (si no, se usan los de ejemplo)
export function useHorariosConfigurados() {
  return useStore((s) => !!s.iglesia?.horarios);
}

// El pastor guarda los dias y horarios de una iglesia (la activa si no dice)
export function fijarHorarios(horarios: HorarioCulto[], iglesiaId?: string) {
  const s = useStore.getState();
  const id = iglesiaId ?? s.iglesia?.id;
  const lista = listaIglesias(s);
  const destino = lista.find((x) => x.id === id);
  if (!destino) return;
  const nueva = { ...destino, horarios };
  cambiar({
    iglesias: lista.map((x) => (x.id === id ? nueva : x)),
    iglesia: s.iglesia?.id === id ? nueva : s.iglesia,
  });
  subir(nueva);
}

// Deja la app como recien instalada (rol, iglesia, mapa, salas, todo)
// y vuelve a mostrar la bienvenida para elegir pastor o hermano
export function reiniciarApp() {
  useStore.setState(inicial(), true);
}

// Reinicio completo: primero borra lo del servidor (si falla, no se toca el
// telefono, para no dejar datos a medias) y luego deja la app como nueva
export async function reiniciarTodo() {
  await borrarDelServidor();
  reiniciarApp();
}

// Elimina la cuenta y sus datos (servidor y telefono). Lo exige Google Play
export async function eliminarCuenta() {
  await eliminarCuentaDelServidor();
  reiniciarApp();
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
  avatar?: AvatarElegido;
  portada?: string;
  fuenteBiblia?: FuenteBiblia;
}) {
  cambiar(datos);
  // su iglesia ve su nombre (y su foto, si es una URL)
  // su iglesia ve su nombre y su foto o chibi (cronograma, salas)
  if (datos.nombre || datos.avatar) subirMiPerfil();
}

// Sube nombre y avatar; si era una foto de la galeria, el telefono pasa a
// usar el enlace de arriba (asi no se vuelve a subir)
function subirMiPerfil() {
  const { nombre, avatar } = useStore.getState();
  enFondo(
    subirPerfil({ nombre, avatar }).then((arriba) => {
      if (
        arriba?.tipo === "foto" &&
        avatar?.tipo === "foto" &&
        arriba.uri !== avatar.uri &&
        useStore.getState().avatar === avatar
      ) {
        cambiar({ avatar: arriba });
      }
    }),
  );
}

// Entro con Google: guarda la cuenta y completa lo que falte del perfil
// (el nombre que escribio se respeta; la foto de Google solo si no eligio)
export function conectarCuenta(cuenta: CuentaConectada) {
  cambiar((s) => ({
    cuenta,
    nombre: s.nombre ?? cuenta.nombre,
    avatar:
      s.avatar ??
      (cuenta.foto ? { tipo: "foto", uri: cuenta.foto } : undefined),
  }));
  subirMiPerfil();
}

// Foto del perfil: un chibi (por su semilla) o una foto de la galeria
export type AvatarElegido =
  | { tipo: "chibi"; semilla: string; estilo?: string } // estilo de DiceBear
  | { tipo: "foto"; uri: string };

// Letra para leer la Biblia (Editar perfil)
export type FuenteBiblia = "clasica" | "moderna" | "legible" | "libro";
export const FUENTES_BIBLIA: Record<
  FuenteBiblia,
  { label: string; sub: string; normal: string; fuerte: string }
> = {
  clasica: {
    label: "Clásica",
    sub: "Como una Biblia impresa",
    normal: "EBGaramond_400Regular",
    fuerte: "EBGaramond_600SemiBold",
  },
  moderna: {
    label: "Moderna",
    sub: "Limpia, como en el celular",
    normal: "Inter_500Medium",
    fuerte: "Inter_600SemiBold",
  },
  // hecha para personas con baja vision: letras que no se confunden
  legible: {
    label: "Muy legible",
    sub: "Clara y grande, para ver mejor",
    normal: "AtkinsonHyperlegible_400Regular",
    fuerte: "AtkinsonHyperlegible_700Bold",
  },
  libro: {
    label: "De libro",
    sub: "Firme y cómoda para leer mucho",
    normal: "Merriweather_400Regular",
    fuerte: "Merriweather_700Bold",
  },
};
// ───────────── Reseña en la tienda ─────────────
// Se le piden estrellas solo despues de un buen momento (termino el juego de
// memorizar, dijo "Voy", oro por alguien, guardo un versiculo), cuando ya
// lleva unos dias usando la app y nunca seguido
type Resena = {
  desde: string; // ISO: primer buen momento (cuenta los dias de uso)
  momentos: number; // buenos momentos desde la ultima vez
  pedida?: string; // ISO: la ultima vez que se pidio
  veces: number; // cuantas veces se pidio (en total)
};
const DIA_MS = 24 * 60 * 60 * 1000;
const RESENA = { dias: 3, momentos: 3, cadaDias: 60, maximo: 3 };

export function buenMomento() {
  const ahora = new Date();
  const r: Resena = useStore.getState().resena ?? {
    desde: ahora.toISOString(),
    momentos: 0,
    veces: 0,
  };
  const momentos = r.momentos + 1;
  const toca =
    r.veces < RESENA.maximo &&
    momentos >= RESENA.momentos &&
    ahora.getTime() - Date.parse(r.desde) >= RESENA.dias * DIA_MS &&
    (!r.pedida ||
      ahora.getTime() - Date.parse(r.pedida) >= RESENA.cadaDias * DIA_MS);
  cambiar({
    resena: toca
      ? { ...r, momentos: 0, pedida: ahora.toISOString(), veces: r.veces + 1 }
      : { ...r, momentos },
  });
  // un momento despues: que primero vea lo que hizo (el ✓, la celebracion)
  if (toca) setTimeout(() => pedirResena(), 1500);
}

// "Mas tarde" a una version nueva: no se vuelve a sugerir hasta otra version
export function posponerVersion(version: string) {
  cambiar({ versionPospuesta: version });
}
export function useVersionPospuesta() {
  return useStore((s) => s.versionPospuesta);
}

// El pastor ya vio donde esta su codigo de invitacion (se muestra una vez)
export function marcarCodigoVisto() {
  cambiar({ codigoVisto: true });
}
export function useCodigoVisto() {
  return !!useStore((s) => s.codigoVisto);
}

// Cambia la letra de la Biblia (desde el boton Aa de la lectura)
export function elegirFuenteBiblia(fuente: FuenteBiblia) {
  cambiar({ fuenteBiblia: fuente });
}
export function useFuenteBibliaId(): FuenteBiblia {
  return useStore((s) => s.fuenteBiblia) ?? "clasica";
}

export function useFuenteBiblia() {
  return FUENTES_BIBLIA[useStore((s) => s.fuenteBiblia) ?? "clasica"];
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
  const principal = useEsLiderPrincipal(grupo);
  const yo = useStore((s) => s.nombre ?? USUARIO.nombre);
  const miId = useMiId();
  const sala = useStore((s) => s.salas.find((g) => g.id === grupo));
  return principal || (!!sala && esAyudanteDe(sala, yo, miId));
}

const igual = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();
const mismoNombre = (lista: string[], yo: string) =>
  lista.some((n) => igual(n, yo));

// Mi cuenta en la iglesia activa (sin servidor: no hay)
export const useMiId = () =>
  useStore((s) => s.miembros.find((m) => m.esYo)?.id);

// ¿Es el lider / un ayudante de la sala? Por su CUENTA si la sala la tiene
// (asi no se confunde con otro del mismo nombre); si no, por el nombre
// (salas viejas o sin servidor). Igual que en el servidor (es_guia)
export const esLiderDe = (g: Grupo, nombre: string, id?: string) =>
  g.liderId && id ? g.liderId === id : !!g.lider && igual(g.lider, nombre);
export const esAyudanteDe = (g: Grupo, nombre: string, id?: string) =>
  (!!id && (g.ayudantesIds ?? []).includes(id)) ||
  // algun ayudante sin cuenta conocida (o no se sabe la mia): por nombre
  ((!id || (g.ayudantesIds?.length ?? 0) < (g.ayudantes?.length ?? 0)) &&
    mismoNombre(g.ayudantes ?? [], nombre));

// Quien elige a los ayudantes de la sala: el pastor, el administrador o el
// lider de la sala (un ayudante no nombra a otros)
export function useEsLiderPrincipal(grupo: GrupoId) {
  const esPastor = useEsPastor();
  const admin = usePuede("roles");
  const yo = useStore((s) => s.nombre ?? USUARIO.nombre);
  const miId = useMiId();
  const sala = useStore((s) => s.salas.find((g) => g.id === grupo));
  return (
    esPastor ||
    admin ||
    (!!sala && (esLiderDe(sala, yo, miId) || sala.lider === USUARIO.nombre)) ||
    esLider(USUARIO.nombre, grupo)
  );
}

// El lider y los ayudantes entran a su sala sin la invitacion (el pastor
// ya los eligio). Por su cuenta (o su nombre, si la sala no la tiene)
// ¿Este turno es mio? Por mi cuenta si el turno la tiene; si no, por nombre
export const esMiTurno = (
  t: { persona: string; personaId?: string },
  nombre: string,
  id?: string,
) => (t.personaId && id ? t.personaId === id : t.persona === nombre);

export const guiaLaSala = (g: Grupo, nombre: string, id?: string) =>
  esLiderDe(g, nombre, id) || esAyudanteDe(g, nombre, id);

// Las salas que guia esta persona (para entrar y verlas en "Tus salas")
export function useSalasQueGuio(): GrupoId[] {
  const yo = useStore((s) => s.nombre ?? USUARIO.nombre);
  const miId = useMiId();
  return useGrupos()
    .filter((g) => g.id !== "general" && guiaLaSala(g, yo, miId))
    .map((g) => g.id);
}

// ¿Esta persona guia esa sala? Sin hook (listas de miembros)
export function guiaSalaAhora(grupo: GrupoId, nombre: string, id?: string) {
  const sala = useStore.getState().salas.find((g) => g.id === grupo);
  return !!sala && guiaLaSala(sala, nombre, id);
}

// Da o quita a alguien como ayudante de la sala. Se ve al instante y se
// guarda en el servidor (si falla, vuelve a lo de alla). id: su cuenta
export function alternarAyudante(grupo: GrupoId, nombre: string, id?: string) {
  const s = useStore.getState();
  const sala = s.salas.find((g) => g.id === grupo);
  if (!sala) return;
  const actuales = sala.ayudantes ?? [];
  const actualesIds = sala.ayudantesIds ?? [];
  const lo = esAyudanteDe(sala, nombre, id);
  // al quitar: su nombre una vez (puede haber otro ayudante que se llame
  // igual) y su cuenta
  const i = actuales.findIndex((n) => igual(n, nombre));
  const ayudantes = lo
    ? [...actuales.slice(0, i), ...actuales.slice(i + 1)]
    : [...actuales, nombre];
  const ayudantesIds = lo
    ? actualesIds.filter((x) => x !== id)
    : id
      ? [...actualesIds, id]
      : actualesIds;
  editarSalaLocal(grupo, { ayudantes, ayudantesIds });
  const iglesiaId = s.iglesia?.id;
  if (!esUuid(iglesiaId)) return;
  const quitado = lo;
  // las cuentas solo si se saben todas (si no, el servidor las busca)
  const ids = ayudantesIds.length === ayudantes.length ? ayudantesIds : undefined;
  enFondo(
    cambiarAyudantesRemoto(iglesiaId, grupo, ayudantes, ids)
      .then(() => avisarCargoSala(grupo, nombre, "ayudante", quitado, id))
      .catch((e) => {
        sincronizarSalas();
        throw e;
      }),
  );
}

// Hermanos de la iglesia activa (los que se unieron, con su nombre de
// perfil). Siempre incluye a esta persona. Sin servidor: solo ella
export function useMiembros(): MiembroIglesia[] {
  const miembros = useStore((s) => s.miembros);
  const yo = useStore((s) => s.nombre) ?? USUARIO.nombre;
  const esPastor = useStore((s) => s.rol === "pastor");
  return conYo(miembros, yo, esPastor);
}
// Mis proximos turnos en TODAS mis iglesias (la activa + las guardadas),
// cada uno con el nombre de su iglesia y la hora segun SUS horarios
export type MiTurno = Turno & { iglesia?: string; horaFinal?: string };
export function useMisTurnos(): MiTurno[] {
  const s = useStore();
  // nombre exacto: "pato" y "Pato" pueden ser dos hermanos distintos
  const yo = (s.nombre ?? USUARIO.nombre).trim();
  // mi cuenta (la misma en todas mis iglesias): manda sobre el nombre
  const miId = s.miembros.find((m) => m.esYo)?.id;
  const hoy = aKeyHoy();
  const deIglesia = (
    iglesia: Iglesia | undefined,
    editados?: Record<string, Turno[]>,
  ) =>
    unirTurnos(editados ?? {})
      .filter(
        (t) =>
          esMiTurno({ ...t, persona: t.persona.trim() }, yo, miId) &&
          t.fecha >= hoy,
      )
      .map((t) => {
        const [y, m, d] = t.fecha.split("-").map(Number);
        const dia = new Date(y, m - 1, d).getDay();
        const horaCultoDia = (iglesia?.horarios ?? HORARIOS_POR_DEFECTO)
          .filter((h) => h.dia === dia)
          .sort((a, b) => a.hora.localeCompare(b.hora))[0]?.hora;
        return {
          ...t,
          iglesia: iglesia?.sede,
          horaFinal: t.hora ?? horaCultoDia,
        };
      });
  const lista = listaIglesias(s);
  return [
    ...deIglesia(s.iglesia, s.turnosEditados),
    ...lista
      .filter((i) => !misma(i, s.iglesia))
      .flatMap((i) =>
        deIglesia(i, s.porIglesia?.[idIglesia(i)]?.turnosEditados),
      ),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Avatar (foto o chibi) de alguien de la iglesia por su nombre (el turno y
// las salas guardan el nombre). El propio sale de este telefono
export function useAvatarDe() {
  const miembros = useStore((s) => s.miembros);
  const yo = useStore((s) => s.nombre) ?? USUARIO.nombre;
  const miAvatar = useStore((s) => s.avatar);
  // Primero el nombre exacto: "Pato" y "pato" pueden ser dos personas
  // distintas (antes los dos mostraban la misma foto). Si no hay uno exacto,
  // se acepta sin mayusculas (ej: lo escribieron distinto en el cronograma)
  return (nombre?: string): AvatarElegido | undefined => {
    if (!nombre) return undefined;
    const exacto = nombre.trim();
    if (exacto === yo.trim()) return miAvatar;
    const mismo = miembros.find((m) => m.nombre.trim() === exacto);
    if (mismo) return mismo.avatar;
    const n = exacto.toLowerCase();
    if (n === yo.trim().toLowerCase()) return miAvatar;
    return miembros.find((m) => m.nombre.trim().toLowerCase() === n)?.avatar;
  };
}

// Restricciones que el pastor le puso a esta persona (en la iglesia activa)
export function useMisRestricciones() {
  const yo = useStore((s) => s.miembros.find((m) => m.esYo));
  return { sinChat: !!yo?.sinChat, sinOracion: !!yo?.sinOracion };
}

// El pastor restringe (o libera) a un hermano: se ve al instante y se guarda
// en el servidor, que es quien lo hace cumplir
export function restringir(
  usuarioId: string,
  cambios: { sinChat: boolean; sinOracion: boolean },
) {
  const iglesiaId = useStore.getState().iglesia?.id;
  if (!esUuid(iglesiaId) || !esUuid(usuarioId)) return;
  cambiar((s) => ({
    miembros: s.miembros.map((m) =>
      m.id === usuarioId ? { ...m, ...cambios } : m,
    ),
  }));
  enFondo(
    restringirMiembro(
      iglesiaId,
      usuarioId,
      cambios.sinChat,
      cambios.sinOracion,
    ).catch((e) => {
      sincronizarContenido(); // no se pudo: vuelve a lo del servidor
      throw e;
    }),
  );
}

// lo mismo, fuera de un componente (lee el estado de ahora)
export function miembrosActuales(): MiembroIglesia[] {
  const s = useStore.getState();
  return conYo(s.miembros, s.nombre ?? USUARIO.nombre, s.rol === "pastor");
}
const conYo = (
  lista: MiembroIglesia[],
  yo: string,
  esPastor: boolean,
): MiembroIglesia[] =>
  lista.some((m) => m.nombre === yo)
    ? lista
    : [
        ...lista,
        { id: "yo", nombre: yo, rol: esPastor ? "pastor" : "hermano" },
      ];

// Iglesia de esta persona (sin iglesia = hermano que aun no se une)
export function useIglesia() {
  return useStore((s) => s.iglesia);
}

// Iglesias de esta persona (el pastor puede dirigir mas de una). La activa
// es "iglesia": la del mapa, las invitaciones y todo lo de la congregacion.
// Lo de cada iglesia (anuncios, cronograma, salas...) se guarda aparte: al
// cambiar de iglesia se guarda lo de la activa y se carga lo de la otra, asi
// las pantallas siguen leyendo los mismos campos
const CAMPOS_IGLESIA = [
  "anuncios",
  "predicaciones",
  "salas",
  "salasEditadas",
  "desafios",
  "publicaciones",
  "mensajes",
  "revisiones",
  "vistos",
  "vaciados",
  "turnosEditados",
  "invitados",
  "rolesExtra",
  "cargos",
  "codigos",
  "grupo",
  "miembros",
  "turnosAvisados",
  "anunciosAvisados",
] as const satisfies readonly (keyof Estado)[];
type DatosIglesia = Partial<Pick<Estado, (typeof CAMPOS_IGLESIA)[number]>>;

const tomar = (s: Estado): DatosIglesia =>
  Object.fromEntries(CAMPOS_IGLESIA.map((c) => [c, s[c]])) as DatosIglesia;
const vacios = () => tomar(inicial());

// sin id (iglesias antiguas o la de ejemplo): nombre y ubicacion
const idIglesia = (i: Iglesia) => i.id ?? `${i.sede}|${i.lat}|${i.lng}`;
// Iglesias que se estan subiendo: antes de crear un codigo hay que esperar
// a que exista en el servidor (si no, el servidor dice "no eres el pastor")
const subiendo = new Map<string, Promise<unknown>>();
function subir(iglesia: Iglesia) {
  const p = subirIglesia(iglesia).then((r) => {
    // el logo ya subido queda con su URL (la foto local era temporal)
    if (r) marcarSubida(iglesia.id, r.logo);
    return r;
  });
  if (iglesia.id)
    subiendo.set(
      iglesia.id,
      p.catch(() => {}),
    );
  enFondo(p);
  return p;
}
// la iglesia ya esta en el servidor
function marcarSubida(id?: string, logo?: string) {
  if (!id) return;
  const cambios = { subida: true, ...(logo ? { logo } : {}) };
  cambiar((s) => ({
    iglesias: listaIglesias(s).map((x) =>
      x.id === id ? { ...x, ...cambios } : x,
    ),
    iglesia: s.iglesia?.id === id ? { ...s.iglesia, ...cambios } : s.iglesia,
  }));
}

// lo que va al servidor corre aparte: si falla, el telefono ya lo guardo
const enFondo = (p: Promise<unknown>) =>
  p.catch((e) => console.warn("[supabase]", e?.message ?? e));
const misma = (a?: Iglesia, b?: Iglesia) =>
  !!a && !!b && idIglesia(a) === idIglesia(b);
const listaIglesias = (s: Estado) =>
  s.iglesias ?? (s.iglesia ? [s.iglesia] : []);

// Guarda lo de la iglesia activa y carga lo de "destino"
function pasarA(s: Estado, destino?: Iglesia): Partial<Estado> {
  if (misma(s.iglesia, destino)) return { iglesia: destino };
  const porIglesia = s.iglesia
    ? { ...s.porIglesia, [idIglesia(s.iglesia)]: tomar(s) }
    : (s.porIglesia ?? {});
  return {
    porIglesia,
    iglesia: destino,
    ...vacios(),
    ...(destino ? porIglesia[idIglesia(destino)] : undefined),
  };
}

export function useIglesias() {
  const iglesias = useStore((s) => s.iglesias);
  const activa = useStore((s) => s.iglesia);
  return iglesias ?? (activa ? [activa] : []);
}

// Las salas de cada iglesia de esta persona (para "Mis ministerios" del
// pastor). La activa usa las de ahora; las demas, las guardadas de ellas
export function useSalasDeTodas() {
  const iglesias = useStore((s) => s.iglesias);
  const activa = useStore((s) => s.iglesia);
  const salas = useStore((s) => s.salas);
  const salasEditadas = useStore((s) => s.salasEditadas);
  const porIglesia = useStore((s) => s.porIglesia);
  const lista = iglesias ?? (activa ? [activa] : []);
  return lista.map((iglesia) => {
    const esActiva = misma(iglesia, activa);
    const datos = esActiva
      ? { salas, salasEditadas }
      : (porIglesia?.[idIglesia(iglesia)] ?? {});
    return {
      iglesia,
      activa: esActiva,
      salas: [
        ...GRUPOS.map((g) => ({ ...g, ...datos.salasEditadas?.[g.id] })),
        ...(datos.salas ?? []),
      ],
    };
  });
}

// Todas las iglesias de esta persona con su cronograma guardado en el
// telefono (la activa usa lo de ahora; las demas, lo que se guardo de ellas).
// Para el resumen "Todas" del cronograma del pastor
export function useCronogramasDeTodas() {
  const s = useStore();
  return listaIglesias(s).map((iglesia) => {
    const activa = misma(iglesia, s.iglesia);
    const datos = activa ? s : s.porIglesia?.[idIglesia(iglesia)];
    return {
      iglesia,
      activa,
      turnos: datos?.turnosEditados ?? {},
      rolesExtra: datos?.rolesExtra ?? {},
    };
  });
}

// Nombre de la iglesia activa, solo si tiene varias: en anuncios y
// cronograma se muestra de que iglesia es (con una sola no hace falta)
export function useNombreIglesiaSiVarias() {
  const nombre = useStore((s) => s.iglesia?.sede);
  const varias = useStore((s) => listaIglesias(s).length > 1);
  return varias ? nombre : undefined;
}

// ¿Es esta la iglesia activa?
export function esActiva(iglesia: Iglesia, activa?: Iglesia) {
  return misma(iglesia, activa);
}

// El pastor guarda o cambia el nombre y la ubicacion de la iglesia activa
// (sigue siendo la misma: conserva su id y sus datos)
export function fijarIglesia(datos: Iglesia) {
  const s = useStore.getState();
  const iglesia = {
    ...datos,
    // las antiguas (sin uuid) reciben uno para poder subirse
    id: esUuid(s.iglesia?.id) ? s.iglesia.id : nuevoUuid(),
  };
  const lista = listaIglesias(s);
  const i = lista.findIndex((x) => misma(x, s.iglesia));
  cambiar({
    iglesia,
    iglesias:
      i >= 0
        ? lista.map((x, k) => (k === i ? iglesia : x))
        : [...lista, iglesia],
  });
  subir(iglesia);
}

// El pastor cambia una de sus iglesias (nombre, ubicacion, logo) sin
// cambiar cual esta activa
export function actualizarIglesia(id: string, datos: Iglesia) {
  const s = useStore.getState();
  if (s.iglesia?.id === id) return fijarIglesia(datos);
  const iglesia = { ...datos, id };
  cambiar({
    iglesias: listaIglesias(s).map((x) => (x.id === id ? iglesia : x)),
  });
  subir(iglesia);
}

// El pastor suma otra iglesia: queda como la activa y parte vacia
// (la primera se queda con lo que ya habia)
export function agregarIglesia(datos: Iglesia) {
  const iglesia = { ...datos, id: nuevoUuid() };
  cambiar((s) => {
    const iglesias = [...listaIglesias(s), iglesia];
    return s.iglesia
      ? { ...pasarA(s, iglesia), iglesias }
      : { iglesia, iglesias };
  });
  subir(iglesia);
}

// Toco un aviso de otra de sus iglesias: se cambia a esa (si es suya)
export function irAIglesia(id: string) {
  const s = useStore.getState();
  if (s.iglesia?.id === id) return;
  const destino = listaIglesias(s).find((i) => i.id === id);
  if (destino) elegirIglesia(destino);
}

// Cambia de iglesia: el mapa, los anuncios, el cronograma, las salas...
export function elegirIglesia(iglesia: Iglesia) {
  cambiar((s) => pasarA(s, iglesia));
  sincronizarContenido();
}

// Quita una iglesia y lo suyo; si era la activa, pasa a la primera que queda
export function quitarIglesia(iglesia: Iglesia) {
  enFondo(borrarIglesia(iglesia.id));
  cambiar((s) => {
    const id = idIglesia(iglesia);
    const iglesias = listaIglesias(s).filter((x) => !misma(x, iglesia));
    const porIglesia = Object.fromEntries(
      Object.entries(s.porIglesia ?? {}).filter(([k]) => k !== id),
    );
    if (!misma(s.iglesia, iglesia)) return { iglesias, porIglesia };
    const siguiente = iglesias[0];
    return {
      iglesias,
      porIglesia,
      iglesia: siguiente,
      ...vacios(),
      ...(siguiente ? porIglesia[idIglesia(siguiente)] : undefined),
    };
  });
}

// Se unio con un codigo del servidor: suma esa iglesia (o vuelve a ella si
// ya la tenia), la deja activa y entra a la sala del codigo
export function unirseAIglesia(iglesia: Iglesia, grupo?: GrupoId) {
  cambiar((s) => {
    const lista = listaIglesias(s);
    const ya = lista.some((x) => misma(x, iglesia));
    const iglesias = ya
      ? lista.map((x) => (misma(x, iglesia) ? iglesia : x))
      : [...lista, iglesia];
    const base = s.iglesia ? pasarA(s, iglesia) : { iglesia };
    return { ...base, iglesias, grupo: grupo ?? base.grupo ?? s.grupo };
  });
  sincronizarContenido();
}

// Al abrir la app: trae del servidor las iglesias de esta persona y las
// junta con las del telefono (las del servidor mandan en nombre y ubicacion)
// Con servidor: las iglesias antiguas (sin uuid, de antes de conectar
// Supabase) reciben uno y se suben, y se descartan los codigos que solo
// existian en el telefono (nadie mas podria usarlos). El panel crea otros
function ponerAlDiaConServidor() {
  const s = useStore.getState();
  if (!conectado() || s.rol !== "pastor") return;
  const soloServidor = (c: DatosIglesia["codigos"] = {}) =>
    Object.fromEntries(
      Object.entries(c).filter(([, v]) => v?.enServidor),
    ) as DatosIglesia["codigos"];

  const lista = listaIglesias(s);
  const nuevos = new Map(
    lista
      .filter((i) => !esUuid(i.id))
      .map((i) => [idIglesia(i), { ...i, id: nuevoUuid() }] as const),
  );
  const iglesias = lista.map((i) => nuevos.get(idIglesia(i)) ?? i);
  const iglesia = s.iglesia
    ? (nuevos.get(idIglesia(s.iglesia)) ?? s.iglesia)
    : undefined;
  const porIglesia = Object.fromEntries(
    Object.entries(s.porIglesia ?? {}).map(([k, v]) => [
      nuevos.get(k)?.id ?? k,
      { ...v, codigos: soloServidor(v.codigos) },
    ]),
  );
  cambiar({
    iglesias,
    iglesia,
    porIglesia,
    codigos: soloServidor(s.codigos) ?? {},
  });
  nuevos.forEach((i) => subir(i));
}

export async function sincronizarIglesias() {
  ponerAlDiaConServidor();
  const remotas = await misIglesias().catch((e) => {
    console.warn("[supabase]", e?.message ?? e);
    return null;
  });
  if (!remotas) return; // sin servidor o sin conexion: no se toca nada
  // su foto de la galeria aun no esta arriba (fallo o no habia servidor):
  // se reintenta, para que su iglesia la vea sin que la vuelva a elegir
  const { avatar } = useStore.getState();
  if (avatar?.tipo === "foto" && !avatar.uri.startsWith("https://")) {
    subirMiPerfil();
  }
  const ids = new Set(remotas.map((r) => r.iglesia.id));
  const reintentar: Iglesia[] = [];
  cambiar((s) => {
    // el servidor manda: las que estaban arriba y ya no estan, se borraron
    // (desde otro telefono o en pruebas). Las que nunca subieron, se reintentan
    let iglesias = listaIglesias(s).filter((x) => {
      if (!esUuid(x.id) || ids.has(x.id)) return true;
      if (!x.subida) reintentar.push(x);
      return !x.subida;
    });
    for (const { iglesia } of remotas) {
      const arriba = { ...iglesia, subida: true };
      iglesias = iglesias.some((x) => misma(x, arriba))
        ? iglesias.map((x) => (misma(x, arriba) ? arriba : x))
        : [...iglesias, arriba];
    }
    const borradas = listaIglesias(s)
      .filter((x) => !iglesias.some((y) => misma(x, y)))
      .map((x) => idIglesia(x));
    const porIglesia = Object.fromEntries(
      Object.entries(s.porIglesia ?? {}).filter(([k]) => !borradas.includes(k)),
    );
    const sigue = iglesias.find((x) => misma(x, s.iglesia));
    if (s.iglesia && !sigue) {
      // la activa se borro: pasa a la primera que queda (sin guardar la otra)
      const siguiente = iglesias[0];
      return {
        iglesias,
        porIglesia,
        iglesia: siguiente,
        ...vacios(),
        ...(siguiente ? porIglesia[idIglesia(siguiente)] : undefined),
      };
    }
    const activa = sigue ?? iglesias[0];
    // sin activa (telefono nuevo): entra a la primera con su sala
    const grupo = s.iglesia ? s.grupo : (remotas[0]?.sala ?? s.grupo);
    return { iglesias, porIglesia, iglesia: activa, grupo };
  });
  reintentar.forEach((x) => subir(x));
}

// Trae los anuncios y turnos de la iglesia activa (lo que publico el pastor).
// Lo que solo esta en el telefono (anuncios antiguos sin uuid) se conserva
export async function sincronizarContenido() {
  const id = useStore.getState().iglesia?.id;
  if (!esUuid(id)) return;
  sincronizarSalas(); // las salas que creo el pastor
  sincronizarMensajes(); // el chat de las salas, aparte
  sincronizarPeticiones(); // y el muro de oracion
  const desde = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const [anuncios, turnos, miembros] = await Promise.all([
    bajarAnuncios(id),
    bajarTurnos(id, desde),
    bajarMiembros(id),
  ]).catch((e) => {
    console.warn("[supabase]", e?.message ?? e);
    return [null, null, null] as const;
  });
  // los roles (si falla, se quedan los de antes)
  const filasCargos = await bajarCargos(id).catch((e) => {
    console.warn("[supabase]", e?.message ?? e);
    return null;
  });
  // si mientras tanto cambio de iglesia, no mezclar
  if (useStore.getState().iglesia?.id !== id) return;
  cambiar((s) => ({
    ...(anuncios
      ? {
          // + los que solo estan en el telefono: antiguos o aun subiendo
          anuncios: [
            ...anuncios,
            ...s.anuncios.filter(
              (a) =>
                !esUuid(a.id) ||
                (pendiente(s, a.id) && !anuncios.some((r) => r.id === a.id)),
            ),
          ],
        }
      : {}),
    // desde "desde" manda el servidor: si un dia quedo vacio (el admin
    // quito a todos), aqui tambien se vacia
    ...(turnos
      ? {
          turnosEditados: {
            ...Object.fromEntries(
              Object.entries(s.turnosEditados).filter(([f]) => f < desde),
            ),
            ...turnos,
            // los dias que aun se estan subiendo: manda el telefono
            ...Object.fromEntries(
              Object.entries(s.turnosEditados).filter(([f]) =>
                pendiente(s, `dia:${id}:${f}`),
              ),
            ),
          },
        }
      : {}),
    ...(miembros ? { miembros } : {}),
    // manda el servidor: cada rol con el nombre de su hermano
    ...(filasCargos
      ? { cargos: cargosPorNombre(filasCargos, miembros ?? s.miembros) }
      : {}),
  }));
  // Primera descarga (app nueva o reiniciada): lo que ya habia se anota como
  // visto, asi no avisa lo viejo pero si TODO lo que llegue despues (antes,
  // si no habia nada, el primer anuncio o turno nuevo se anotaba sin avisar)
  cambiar((s) => {
    const yo = s.nombre ?? USUARIO.nombre;
    return {
      ...(anuncios && s.anunciosAvisados === undefined
        ? { anunciosAvisados: s.anuncios.map((a) => a.id) }
        : {}),
      ...(turnos && s.turnosAvisados === undefined
        ? {
            turnosAvisados: unirTurnos(s.turnosEditados)
              .filter((t) =>
                esMiTurno(t, yo, s.miembros.find((m) => m.esYo)?.id),
              )
              .map((t) => `${t.fecha}|${t.rol}|${horaTurno(t) ?? ""}`),
          }
        : {}),
    };
  });
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
  // sin servidor (modo de prueba): codigo inventado en el telefono
  if (!conectado()) return generarCodigoLocal(grupo);
  const iglesia = useStore.getState().iglesia;
  if (!esUuid(iglesia?.id)) return; // ponerAlDiaConServidor le da uno
  const id = iglesia.id;
  (async () => {
    await subiendo.get(id); // que la iglesia ya este en el servidor
    const nuevo = await crearCodigo(id, grupo).catch(async (e) => {
      // la iglesia aun no estaba arriba: se sube y se intenta otra vez
      console.warn("[supabase]", e?.message ?? e);
      await subirIglesia(iglesia);
      return crearCodigo(id, grupo);
    });
    if (!nuevo || useStore.getState().iglesia?.id !== id) return;
    cambiar((s) => ({
      codigos: { ...s.codigos, [grupo]: { ...nuevo, enServidor: true } },
    }));
  })().catch((e) => console.warn("[supabase]", e?.message ?? e));
  // con servidor NUNCA se inventa uno local: nadie mas podria usarlo
}

function generarCodigoLocal(grupo: GrupoId) {
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

// Cuantas salas hay en TODAS las iglesias de esta persona (las de base +
// las creadas de cada una). Para el panel del pastor con varias iglesias
export function useTotalSalas(): number {
  return useStore((s) => {
    const lista = listaIglesias(s);
    if (!lista.length) return GRUPOS.length + s.salas.length;
    return lista.reduce((total, i) => {
      const salas = misma(i, s.iglesia)
        ? s.salas
        : (s.porIglesia?.[idIglesia(i)]?.salas ?? []);
      return total + GRUPOS.length + salas.length;
    }, 0);
  });
}

// El pastor cambia una sala ya creada (nombre, lider, que tiene...)
export function editarSala(
  id: GrupoId,
  cambiosPedidos: Partial<Omit<Grupo, "id">>,
) {
  const s0 = useStore.getState();
  const previa: Partial<Grupo> =
    s0.salas.find((g) => g.id === id) ?? { ...s0.salasEditadas[id] };
  const antes = previa.lider;
  const antesId = previa.liderId;
  // otro lider sin su cuenta (escrito a mano): la cuenta vieja ya no vale
  const cambios =
    "lider" in cambiosPedidos && !("liderId" in cambiosPedidos)
      ? { ...cambiosPedidos, liderId: undefined }
      : cambiosPedidos;
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
  // cambio el lider: se le avisa al nuevo (y al que deja de serlo), despues
  // de guardar (el servidor revisa que la sala ya lo diga)
  const nuevo = "lider" in cambios ? cambios.lider : antes;
  const nuevoId = "lider" in cambios ? cambios.liderId : antesId;
  // por cuenta si se saben las dos (dos "Pato" no son el mismo)
  const cambio =
    antesId && nuevoId ? antesId !== nuevoId : !igual(antes ?? "", nuevo ?? "");
  subirSalaActual(id, () =>
    cambio
      ? Promise.all([
          nuevo && avisarCargoSala(id, nuevo, "lider", false, nuevoId),
          antes && avisarCargoSala(id, antes, "lider", true, antesId),
        ])
      : undefined,
  );
}

// Aviso a la persona que nombraron (o quitaron) en la sala
function avisarCargoSala(
  sala: GrupoId,
  persona: string,
  cargo: "lider" | "ayudante",
  quitado?: boolean,
  personaId?: string, // su cuenta (si se sabe): no se confunde con otro
) {
  const iglesiaId = useStore.getState().iglesia?.id;
  if (!esUuid(iglesiaId)) return;
  return avisarSala({ iglesiaId, sala, persona, personaId, cargo, quitado });
}

// Sube la sala (como quedo) a la iglesia activa: asi la ven los hermanos
// despues: lo que se hace cuando ya quedo arriba (ej: avisar al nuevo lider)
function subirSalaActual(id: GrupoId, despues?: () => unknown) {
  const s = useStore.getState();
  const iglesiaId = s.iglesia?.id;
  if (!esUuid(iglesiaId)) return;
  const base = GRUPOS.find((g) => g.id === id);
  const sala = base
    ? { ...base, ...s.salasEditadas[id] }
    : s.salas.find((g) => g.id === id);
  if (!sala) return;
  enFondo(
    subirSala(iglesiaId, sala).then(async (foto) => {
      // la foto ya esta arriba: el telefono usa ese enlace
      if (foto) editarSalaLocal(id, { foto });
      await despues?.();
    }),
  );
}

// cambia la sala solo en el telefono (sin volver a subirla)
function editarSalaLocal(id: GrupoId, cambios: Partial<Omit<Grupo, "id">>) {
  cambiar((s) =>
    s.salas.some((g) => g.id === id)
      ? { salas: s.salas.map((g) => (g.id === id ? { ...g, ...cambios } : g)) }
      : {
          salasEditadas: {
            ...s.salasEditadas,
            [id]: { ...s.salasEditadas[id], ...cambios },
          },
        },
  );
}

// Trae las salas de la iglesia activa (el servidor manda). La primera vez,
// si el pastor tenia salas solo en su telefono, las sube
export async function sincronizarSalas() {
  const s0 = useStore.getState();
  const id = s0.iglesia?.id;
  if (!esUuid(id)) return;
  const remotas = await bajarSalas(id).catch((e) => {
    console.warn("[supabase]", e?.message ?? e);
    return null;
  });
  if (!remotas || useStore.getState().iglesia?.id !== id) return;
  const s = useStore.getState();
  if (!remotas.length && s.rol === "pastor") {
    const locales = [
      ...s.salas,
      ...(s.salasEditadas.general
        ? [{ ...GRUPOS[0], ...s.salasEditadas.general }]
        : []),
    ];
    for (const g of locales) enFondo(subirSala(id, g));
    return;
  }
  const general = remotas.find((g) => g.id === "general");
  cambiar((x) => ({
    salas: remotas.filter((g) => !GRUPOS.some((b) => b.id === g.id)),
    salasEditadas: general
      ? { ...x.salasEditadas, general: { ...general, id: undefined } }
      : x.salasEditadas,
  }));
}

// Borra una sala creada (la de toda la iglesia no se puede borrar)
export function borrarSala(id: GrupoId) {
  const iglesiaId = useStore.getState().iglesia?.id;
  if (esUuid(iglesiaId)) enFondo(borrarSalaRemota(iglesiaId, id));
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
  let nueva: string | undefined;
  cambiar((s) => {
    // id unico aunque se repita el nombre
    const usados = [...GRUPOS, ...s.salas].map((g) => g.id);
    let id = base || "sala";
    for (let n = 2; usados.includes(id); n++) id = `${base}-${n}`;
    nueva = id;
    return { salas: [...s.salas, { ...sala, id }] };
  });
  const id = nueva;
  if (!id) return;
  subirSalaActual(id, () =>
    sala.lider
      ? avisarCargoSala(id, sala.lider, "lider", false, sala.liderId)
      : undefined,
  );
}

// El pastor da o quita un rol a un hermano (puede tener varios)
// Se ve al instante y se guarda en el servidor (asi el hermano lo tiene en
// SU telefono y el servidor lo deja editar). Devuelve como le fue:
// "listo" | "error" (se deshizo) | "local" (sin servidor: solo aqui)
export async function alternarCargo(
  persona: string,
  cargo: CargoId,
): Promise<"listo" | "error" | "local"> {
  const s = useStore.getState();
  const tenia = (s.cargos[persona] ?? []).includes(cargo);
  const poner = (dar: boolean) =>
    cambiar((x) => {
      const actuales = (x.cargos[persona] ?? []).filter((c) => c !== cargo);
      return {
        cargos: {
          ...x.cargos,
          [persona]: dar ? [...actuales, cargo] : actuales,
        },
      };
    });
  poner(!tenia);
  const iglesiaId = s.iglesia?.id;
  const hermano = s.miembros.find((m) => m.nombre === persona);
  if (!esUuid(iglesiaId) || !hermano) return "local";
  try {
    await cambiarCargoRemoto(iglesiaId, hermano.id, cargo, !tenia);
  } catch (e) {
    console.warn("[supabase]", (e as Error)?.message ?? e);
    poner(tenia); // no se pudo: vuelve como estaba
    return "error";
  }
  enFondo(avisarCargo(iglesiaId, hermano.id, cargo, tenia));
  return "listo";
}

// El pastor saca a un hermano de la iglesia: se quita al instante de la
// lista y se borra en el servidor (si falla, vuelve lo del servidor)
export async function quitarMiembro(usuarioId: string): Promise<boolean> {
  const s = useStore.getState();
  const iglesiaId = s.iglesia?.id;
  if (!esUuid(iglesiaId) || s.rol !== "pastor") return false;
  const nombre = s.miembros.find((m) => m.id === usuarioId)?.nombre;
  cambiar((x) => ({
    miembros: x.miembros.filter((m) => m.id !== usuarioId),
    ...(nombre && x.cargos[nombre]
      ? {
          cargos: Object.fromEntries(
            Object.entries(x.cargos).filter(([n]) => n !== nombre),
          ),
        }
      : {}),
  }));
  try {
    await quitarMiembroRemoto(iglesiaId, usuarioId);
    return true;
  } catch (e) {
    console.warn("[supabase]", (e as Error)?.message ?? e);
    sincronizarContenido();
    return false;
  }
}

// Filas del servidor -> { nombre: [roles] } (con el nombre de su perfil)
function cargosPorNombre(
  filas: { usuario_id: string; cargo: string }[],
  miembros: MiembroIglesia[],
): Record<string, CargoId[]> {
  const nombres = new Map(miembros.map((m) => [m.id, m.nombre]));
  const r: Record<string, CargoId[]> = {};
  for (const f of filas) {
    const nombre = nombres.get(f.usuario_id);
    if (nombre) (r[nombre] ??= []).push(f.cargo as CargoId);
  }
  return r;
}

// Prende o apaga un tipo de notificacion
export function alternarAviso(tipo: TipoAviso) {
  cambiar((s) => ({
    avisos: { ...s.avisos, [tipo]: !(s.avisos[tipo] ?? true) },
  }));
  registrarPush(); // el servidor tambien respeta lo que eligio
}

// Le da a Supabase el token push de este telefono y los avisos que quiere
// (al abrir la app, al dar permiso y al cambiar los avisos)
export function registrarPush() {
  enFondo(registrarDispositivo(useStore.getState().avisos));
}

// Abrio un enlace de invitacion antes de terminar el onboarding: se guarda
// para que en "Unete a tu iglesia" ya este escrito (null = ya se uso)
export function guardarInvitacion(codigo: string | null) {
  cambiar({ invitacion: codigo ?? undefined });
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

// Pedir oracion: queda pendiente hasta que el pastor (o el lider) la
// apruebe. Va a la iglesia activa o a las que elija (una copia en cada una,
// siempre en la sala de toda la iglesia). La de la activa se ve aqui al
// instante y, si falla, se reintenta al sincronizar
export function publicar(p: Publicacion, iglesiaIds?: string[]) {
  const s = useStore.getState();
  const activa = s.iglesia?.id;
  // las otras iglesias elegidas: se suben aparte (se ven al cambiar a ellas)
  for (const otra of (iglesiaIds ?? []).filter(
    (x) => x !== activa && esUuid(x),
  )) {
    subirPeticionPendiente(otra, {
      ...p,
      id: nuevoUuid(),
      autor: s.nombre?.trim() || p.autor,
    });
  }
  if (iglesiaIds && activa && !iglesiaIds.includes(activa)) return;
  const iglesiaId = activa;
  const sube = esUuid(iglesiaId);
  const nueva: Publicacion = {
    ...p,
    id: sube ? nuevoUuid() : p.id,
    autor: s.nombre?.trim() || p.autor,
    mia: true,
    ...(sube ? { porSubir: true } : {}),
  };
  cambiar((x) => ({
    publicaciones: [
      nueva,
      ...x.publicaciones.filter(
        (y) => y.id !== nueva.id && sigueGuardada(y, x.revisiones),
      ),
    ],
  }));
  if (sube) subirPeticionPendiente(iglesiaId!, nueva);
}

function subirPeticionPendiente(iglesiaId: string, p: Publicacion) {
  enFondo(
    subirPeticion(iglesiaId, p).then(async (ok) => {
      if (!ok) return;
      // la pidio quien aprueba (pastor o lider): va directo al muro
      if (p.estado === "aprobada") {
        await revisarPeticionRemota(p.id, "aprobada");
      } else {
        // notificacion al pastor (aunque tenga la app cerrada)
        enFondo(avisarPeticion(p.id));
      }
      cambiar((s) => ({
        publicaciones: s.publicaciones.map((x) =>
          x.id === p.id ? { ...x, porSubir: undefined } : x,
        ),
      }));
    }),
  );
}

// Trae las peticiones de la iglesia activa: las aprobadas (muro), las mias
// y, si revisa peticiones, las que esperan su aprobacion
export async function sincronizarPeticiones() {
  const id = useStore.getState().iglesia?.id;
  if (!esUuid(id)) return;
  const r = await bajarPeticiones(id).catch((e) => {
    console.warn("[supabase]", e?.message ?? e);
    return null;
  });
  if (!r || useStore.getState().iglesia?.id !== id) return;
  const ids = new Set(r.peticiones.map((p) => p.id));
  const locales = useStore
    .getState()
    .publicaciones.filter(
      (p) => !esUuid(p.id) || (p.porSubir && !ids.has(p.id)),
    );
  cambiar((s) => {
    const revisiones = { ...s.revisiones, ...r.revisiones };
    return {
      revisiones,
      publicaciones: [...r.peticiones, ...locales].filter((p) =>
        sigueGuardada(p, revisiones),
      ),
    };
  });
  for (const p of locales) if (p.porSubir) subirPeticionPendiente(id, p);
}

// El pastor la mantiene en el muro (no vence) o la suelta: desde que la
// suelta corren 24 h
export function fijarPeticion(id: string, fijada: boolean) {
  cambiar((s) => ({
    publicaciones: s.publicaciones.map((p) =>
      p.id === id ? { ...p, fijada } : p,
    ),
    revisiones:
      !fijada && s.revisiones[id]
        ? {
            ...s.revisiones,
            [id]: { ...s.revisiones[id], fecha: new Date().toISOString() },
          }
        : s.revisiones,
  }));
  enFondo(fijarPeticionRemota(id, fijada));
}

// Quitar una peticion del muro (el pastor, por si acaso): se borra aqui y
// en el servidor, asi desaparece para todos
export function borrarPeticion(id: string) {
  cambiar((s) => ({
    publicaciones: s.publicaciones.filter((p) => p.id !== id),
  }));
  enFondo(borrarPeticionRemota(id));
}

// "Estoy orando": se marca al instante y el servidor devuelve cuantos son
export function alternarOrando(id: string) {
  const ahora = !useStore.getState().orando.includes(id);
  if (ahora) buenMomento();
  cambiar((s) => ({
    orando: ahora ? [...s.orando, id] : s.orando.filter((x) => x !== id),
  }));
  enFondo(
    orarPor(id, ahora).then((total) => {
      if (total == null) return;
      cambiar((s) => ({
        publicaciones: s.publicaciones.map((p) =>
          p.id === id ? { ...p, orando: total } : p,
        ),
      }));
    }),
  );
}

// Se ve al instante en este telefono y se sube a la iglesia activa (los
// chats privados quedan solo aqui). Si falla, queda "pendiente" y se
// reintenta en la proxima sincronizacion
export function enviarMensaje(m: Mensaje) {
  const s = useStore.getState();
  const iglesiaId = s.iglesia?.id;
  const sube = esUuid(iglesiaId);
  const nuevo: Mensaje = {
    ...m,
    id: sube ? nuevoUuid() : m.id,
    autor: s.nombre?.trim() || m.autor,
    mio: true,
    ...(sube ? { pendiente: true } : {}),
  };
  cambiar((x) => ({ mensajes: [...x.mensajes, nuevo] }));
  if (sube) subirMensajePendiente(iglesiaId!, nuevo);
}

function subirMensajePendiente(iglesiaId: string, m: Mensaje) {
  enFondo(
    subirUnMensaje(iglesiaId, m).then((arriba) => {
      if (!arriba) return;
      const listo = { ...arriba, pendiente: undefined };
      cambiar((s) =>
        s.iglesia?.id === iglesiaId
          ? { mensajes: s.mensajes.map((x) => (x.id === m.id ? listo : x)) }
          : {},
      );
      // aviso o devocional del lider: la notificacion a la sala
      if (m.tipo && m.notificar && !esPrivado(m.grupo)) {
        enFondo(avisarMensaje(m.id));
      }
    }),
  );
}

// Privado: va solo a la otra persona (se busca entre los miembros por su
// nombre). Si aun no esta en la lista, queda pendiente
function subirUnMensaje(iglesiaId: string, m: Mensaje) {
  if (!esPrivado(m.grupo)) return subirMensaje(iglesiaId, m);
  const s = useStore.getState();
  const yo = s.nombre?.trim() || USUARIO.nombre;
  const nombre = otroDe(m.grupo, yo);
  // el nombre exacto primero ("pato" y "Pato" pueden ser dos personas)
  const otro =
    s.miembros.find((x) => x.nombre.trim() === nombre.trim()) ??
    s.miembros.find(
      (x) => x.nombre.trim().toLowerCase() === nombre.trim().toLowerCase(),
    );
  if (!otro) return Promise.resolve(null);
  return subirPrivado(iglesiaId, m, { id: otro.id, nombre: otro.nombre });
}

// Reaccionar a un mensaje (como WhatsApp): una por persona; tocar la misma
// la quita. Se ve al instante y se guarda en el servidor
export function reaccionar(mensajeId: string, emoji: string) {
  const s = useStore.getState();
  const iglesiaId = s.iglesia?.id;
  const m = s.mensajes.find((x) => x.id === mensajeId);
  if (!m || !esUuid(iglesiaId)) return;
  const nueva = m.miReaccion === emoji ? null : emoji;
  const cuantas = { ...(m.reacciones ?? {}) };
  if (m.miReaccion) {
    cuantas[m.miReaccion] = (cuantas[m.miReaccion] ?? 1) - 1;
    if (cuantas[m.miReaccion] <= 0) delete cuantas[m.miReaccion];
  }
  if (nueva) cuantas[nueva] = (cuantas[nueva] ?? 0) + 1;
  cambiar((x) => ({
    mensajes: x.mensajes.map((y) =>
      y.id === mensajeId
        ? { ...y, reacciones: cuantas, miReaccion: nueva ?? undefined }
        : y,
    ),
  }));
  enFondo(
    reaccionarRemoto(iglesiaId, mensajeId, nueva).catch((e) => {
      sincronizarMensajes(); // no se pudo: vuelve a lo del servidor
      throw e;
    }),
  );
}

// Responder a un encuentro (Voy / No puedo) o marcar un versiculo como
// aprendido. Una por persona; la misma otra vez la quita (menos "aprendido").
// Se ve al instante y se guarda en el servidor
export function responder(mensajeId: string, valor: ValorRespuesta) {
  const s = useStore.getState();
  const iglesiaId = s.iglesia?.id;
  const m = s.mensajes.find((x) => x.id === mensajeId);
  if (!m || !esUuid(iglesiaId)) return;
  const yo = s.nombre?.trim() || USUARIO.nombre;
  const nueva = m.miRespuesta === valor && valor !== "aprendido" ? null : valor;
  if (nueva === m.miRespuesta) return;
  const otras = (m.respuestas ?? []).filter((r) => r.nombre !== yo);
  // va a un encuentro o aprendio un versiculo: buen momento
  if (nueva === "voy" || nueva === "aprendido") buenMomento();
  cambiar((x) => ({
    mensajes: x.mensajes.map((y) =>
      y.id === mensajeId
        ? {
            ...y,
            respuestas: nueva
              ? [...otras, { nombre: yo, valor: nueva }]
              : otras,
            miRespuesta: nueva ?? undefined,
          }
        : y,
    ),
  }));
  enFondo(
    responderRemoto(iglesiaId, mensajeId, yo, nueva).catch((e) => {
      sincronizarMensajes(); // no se pudo: vuelve a lo del servidor
      throw e;
    }),
  );
}

// Trae el chat de la iglesia activa: lo del servidor + lo que solo esta en
// este telefono (privados, antiguos y los que aun no suben, que se reintentan)
export async function sincronizarMensajes() {
  const id = useStore.getState().iglesia?.id;
  if (!esUuid(id)) return;
  const falla = (e: { message?: string }) => {
    console.warn("[supabase]", e?.message ?? e);
    return null;
  };
  const [salas, privados, reacciones, respuestas] = await Promise.all([
    bajarMensajes(id).catch(falla),
    bajarPrivados(id, idPrivado).catch(falla),
    bajarReacciones(id).catch(falla),
    bajarRespuestas(id).catch(falla),
  ]);
  if (!salas || useStore.getState().iglesia?.id !== id) return;
  // cada mensaje con sus reacciones (cuantas de cada emoji y la mia)
  const conReacciones = salas.map((m) => {
    const cuantas = reacciones?.cuantas[m.id];
    const mia = reacciones?.mias[m.id];
    const todas = respuestas?.todas[m.id];
    const miRespuesta = respuestas?.mias[m.id];
    return {
      ...m,
      ...(cuantas ? { reacciones: cuantas } : {}),
      ...(mia ? { miReaccion: mia } : {}),
      ...(todas ? { respuestas: todas } : {}),
      ...(miRespuesta ? { miRespuesta } : {}),
    };
  });
  const remotos = [...conReacciones, ...(privados ?? [])];
  const ids = new Set(remotos.map((m) => m.id));
  const locales = useStore.getState().mensajes.filter(
    (m) =>
      !esUuid(m.id) ||
      (m.pendiente && !ids.has(m.id)) ||
      // sin la tabla de privados aun: los privados no se pierden
      (!privados && esPrivado(m.grupo)),
  );
  cambiar({ mensajes: [...remotos, ...locales] });
  for (const m of locales) if (m.pendiente) subirMensajePendiente(id, m);
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
// Vaciar chat (como WhatsApp): esta persona deja de ver los mensajes de
// antes de ahora en esa sala o privado. Solo en su telefono: los demas
// siguen viendo la conversacion completa
export function vaciarChat(grupo: GrupoId) {
  cambiar((s) => ({
    vaciados: { ...(s.vaciados ?? {}), [grupo]: new Date().toISOString() },
    // los que solo estaban en este telefono (privados sin subir, antiguos)
    // se borran de verdad; los del servidor quedan ocultos por la fecha
    mensajes: s.mensajes.filter((m) => m.grupo !== grupo || m.pendiente),
  }));
}

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
  enFondo(
    revisarPeticionRemota(id, decision).then(
      // aprobada: le llega un aviso a quien la pidio
      () => (decision === "aprobada" ? avisarPeticionAprobada(id) : undefined),
    ),
  );
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
// (y lo sube: si es nuevo, avisa por push a toda la iglesia)
export function guardarAnuncio(
  a: Omit<Anuncio, "id"> & { id?: string },
  // el pastor con varias iglesias: tambien se publica en estas (una copia
  // en cada una, cada iglesia recibe su aviso). Solo al crear
  otras: Iglesia[] = [],
) {
  publicarEnOtras(a, otras);
  const s = useStore.getState();
  const previo = a.id ? s.anuncios.find((x) => x.id === a.id) : undefined;
  const existe = !!previo;
  const anuncio: Anuncio = { ...a, id: existe ? a.id! : nuevoUuid() };
  // editado: si cambio cuando o donde es, se avisa a la iglesia
  const cambioHorario =
    !!previo &&
    (previo.fecha !== anuncio.fecha ||
      (previo.hora ?? "") !== (anuncio.hora ?? "") ||
      (previo.lugar ?? "").trim() !== (anuncio.lugar ?? "").trim());
  cambiar({
    anuncios: existe
      ? s.anuncios.map((x) => (x.id === anuncio.id ? anuncio : x))
      : [anuncio, ...s.anuncios],
    // lo publico (o edito) esta persona: a ella no se le avisa
    anunciosAvisados: [
      ...(s.anunciosAvisados ?? []).filter(
        (k) => !k.startsWith(`h:${anuncio.id}=`),
      ),
      anuncio.id,
      firmaHorario(anuncio),
    ],
  });
  const iglesiaId = s.iglesia?.id;
  if (!conectado() || !esUuid(iglesiaId)) return;
  subirAnuncioConEstado(
    iglesiaId,
    anuncio,
    !existe ? "nuevo" : cambioHorario ? "cambio" : false,
  );
}

// Cuando y donde es un anuncio (para notar si lo cambiaron): se guarda con
// los anuncios avisados como "h:<id>=<fecha>|<hora>|<lugar>"
export const firmaHorario = (a: Pick<Anuncio, "id" | "fecha" | "hora" | "lugar">) =>
  `h:${a.id}=${a.fecha}|${a.hora ?? ""}|${(a.lugar ?? "").trim()}`;

// Copia de un anuncio NUEVO en otras iglesias del pastor (no la activa)
function publicarEnOtras(
  a: Omit<Anuncio, "id"> & { id?: string },
  otras: Iglesia[],
) {
  const s = useStore.getState();
  if (a.id && s.anuncios.some((x) => x.id === a.id)) return; // editando
  for (const otra of otras) {
    if (misma(otra, s.iglesia)) continue;
    const copia: Anuncio = { ...a, id: nuevoUuid() };
    const k = idIglesia(otra);
    cambiar((st) => {
      const datos = st.porIglesia?.[k] ?? {};
      return {
        porIglesia: {
          ...st.porIglesia,
          [k]: {
            ...datos,
            anuncios: [copia, ...(datos.anuncios ?? [])],
            // lo publico esta persona: a ella no se le avisa
            anunciosAvisados: [...(datos.anunciosAvisados ?? []), copia.id],
          },
        },
      };
    });
    if (conectado() && esUuid(otra.id))
      subirAnuncioConEstado(otra.id, copia, "nuevo");
  }
}

// ───────────── Estado de las subidas ─────────────

// La subida del cronograma que conviene mostrar (iglesia activa): primero
// la que fallo, si no la mas reciente
export function useClaveSubidaCronograma() {
  return useStore((s) => {
    const id = s.iglesia?.id;
    if (!id) return undefined;
    const del = Object.entries(s.subidas ?? {}).filter(([k]) =>
      k.startsWith(`dia:${id}:`),
    );
    del.sort(
      ([, a], [, b]) =>
        Number(b.etapa === "error") - Number(a.etapa === "error") ||
        b.desde.localeCompare(a.desde),
    );
    return del[0]?.[0];
  });
}

export function useSubida(clave?: string) {
  return useStore((s) => (clave ? s.subidas?.[clave] : undefined));
}

function ponerSubida(clave: string, cambios: Partial<Subida>) {
  cambiar((s) => {
    const antes = s.subidas?.[clave];
    const nueva = { ...antes, ...cambios } as Subida;
    return { subidas: { ...s.subidas, [clave]: nueva } };
  });
}

function quitarSubida(clave: string) {
  cambiar((s) => {
    const { [clave]: _, ...resto } = s.subidas ?? {};
    return { subidas: resto };
  });
}

// "Publicado ✓" se ve un momento y se va
function terminarSubida(clave: string) {
  ponerSubida(clave, { etapa: "listo", error: undefined });
  setTimeout(() => {
    if (useStore.getState().subidas?.[clave]?.etapa === "listo") {
      quitarSubida(clave);
    }
  }, 4000);
}

const mensajeDe = (e: unknown) => {
  const m = (e as Error)?.message ?? String(e);
  return /network|fetch|internet/i.test(m) ? "Sin conexión" : m;
};

// Sube el anuncio contando cada etapa: foto → guardando → avisando → listo.
// No depende de la pantalla: sigue aunque el admin cambie de vista
function subirAnuncioConEstado(
  iglesiaId: string,
  anuncio: Anuncio,
  avisar: "nuevo" | "cambio" | false,
) {
  const clave = anuncio.id;
  const conFoto = !!anuncio.imagen && !anuncio.imagen.startsWith("https://");
  ponerSubida(clave, {
    etapa: conFoto ? "foto" : "guardando",
    desde: new Date().toISOString(),
    iglesiaId,
    avisar: avisar === "cambio" ? "cambio" : !!avisar,
    error: undefined,
  });
  subirAnuncio(iglesiaId, anuncio, () =>
    ponerSubida(clave, { etapa: "guardando" }),
  )
    .then(async (subido) => {
      if (!subido) throw new Error("No se pudo subir");
      // la foto de la galeria ya esta arriba: el telefono usa ese enlace
      if (subido.imagen !== anuncio.imagen)
        reemplazarAnuncio(iglesiaId, subido);
      // el aviso sale despues de subir la imagen (el hermano ya la ve). Si
      // el aviso falla, el anuncio igual quedo publicado
      if (avisar) {
        ponerSubida(clave, { etapa: "avisando" });
        await avisarAnuncio(anuncio.id, avisar === "cambio").catch((e) =>
          console.warn("[supabase]", e?.message ?? e),
        );
      }
      terminarSubida(clave);
    })
    .catch((e) => {
      console.warn("[supabase]", e?.message ?? e);
      ponerSubida(clave, { etapa: "error", error: mensajeDe(e) });
    });
}

// El anuncio puede estar en la iglesia activa o guardado en otra
function reemplazarAnuncio(iglesiaId: string, nuevo: Anuncio) {
  cambiar((s) => {
    if (s.iglesia?.id === iglesiaId) {
      return {
        anuncios: s.anuncios.map((x) => (x.id === nuevo.id ? nuevo : x)),
      };
    }
    const datos = s.porIglesia?.[iglesiaId];
    if (!datos?.anuncios) return s;
    return {
      porIglesia: {
        ...s.porIglesia,
        [iglesiaId]: {
          ...datos,
          anuncios: datos.anuncios.map((x) => (x.id === nuevo.id ? nuevo : x)),
        },
      },
    };
  });
}

// Reintenta una subida que fallo (o que quedo a medias al cerrar la app)
export function reintentarSubida(clave: string) {
  const s = useStore.getState();
  const sub = s.subidas?.[clave];
  if (!sub) return;
  if (clave.startsWith("dia:")) {
    const fecha = clave.split(":")[2];
    // el cronograma solo se sube desde la iglesia activa
    if (s.iglesia?.id === sub.iglesiaId) subirDia(fecha);
    return;
  }
  const anuncio = (
    s.iglesia?.id === sub.iglesiaId
      ? s.anuncios
      : (s.porIglesia?.[sub.iglesiaId]?.anuncios ?? [])
  ).find((a) => a.id === clave);
  if (!anuncio) return quitarSubida(clave); // ya no existe
  subirAnuncioConEstado(
    sub.iglesiaId,
    anuncio,
    sub.avisar === "cambio" ? "cambio" : sub.avisar ? "nuevo" : false,
  );
}

// Al abrir la app: lo que quedo a medias o fallo se reintenta solo
export function reintentarPendientes() {
  const subidas = useStore.getState().subidas ?? {};
  for (const [clave, sub] of Object.entries(subidas)) {
    if (sub.etapa === "listo") quitarSubida(clave);
    else reintentarSubida(clave);
  }
}

const pendiente = (s: Estado, clave: string) => {
  const e = s.subidas?.[clave]?.etapa;
  return !!e && e !== "listo";
};

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
  const imagen = useStore.getState().anuncios.find((a) => a.id === id)?.imagen;
  cambiar((s) => ({ anuncios: s.anuncios.filter((a) => a.id !== id) }));
  enFondo(borrarAnuncioRemoto(id, imagen));
}

// Casillas del cronograma: las de la app + las que agrego la iglesia
export function useRoles() {
  const extra = useStore((s) => s.rolesExtra);
  const todos: Record<string, Rol> = { ...ROLES, ...extra };
  return {
    // las casillas nuevas arriba (la ultima creada primero), luego las de
    // siempre: asi el admin no tiene que buscarla al final
    lista: [...Object.keys(extra).reverse(), ...Object.keys(ROLES)] as RolId[],
    de: (id: RolId) => todos[id] ?? ROL_GENERICO,
    esNueva: (id: RolId) => id in extra, // solo esas se pueden borrar
  };
}

// Agrega una casilla al cronograma de todos los cultos
// Devuelve el id de la casilla nueva (para llevar la vista hasta ella)
export function crearRol(rol: Rol): RolId {
  const base = aSlug(rol.label) || "casilla";
  const s = useStore.getState();
  const usados = [...Object.keys(ROLES), ...Object.keys(s.rolesExtra)];
  let id = base;
  for (let n = 2; usados.includes(id); n++) id = `${base}-${n}`;
  cambiar({ rolesExtra: { ...s.rolesExtra, [id]: rol } });
  return id;
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
  personaId?: string, // su cuenta (elegido de la lista de hermanos)
) {
  const previo = unirTurnos(useStore.getState().turnosEditados).find(
    (t) => t.fecha === fecha && t.rol === rol,
  );
  const antesPersona = previo?.persona;
  const antesId = previo?.personaId;
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
            ...(personaId ? { personaId } : {}),
            ...(nuevaHora ? { hora: nuevaHora } : {}),
          },
        ]
      : otros;
    return { turnosEditados: { ...s.turnosEditados, [fecha]: turnos } };
  });
  // a quien asignaron (o cambiaron) le llega "Te asignaron un turno", y a
  // quien sacaron (o reemplazaron) "Te quitaron de un turno", despues de
  // que el dia ya este arriba
  // otra persona: por su cuenta si se saben las dos (dos "Pato" no son el
  // mismo); si no, por el nombre
  const otra =
    antesId && personaId ? antesId !== personaId : persona !== antesPersona;
  const nuevo = !!persona && otra;
  const quitado = !!antesPersona && (otra || !persona) ? antesPersona : undefined;
  subirDia(
    fecha,
    nuevo ? rol : undefined,
    quitado ? { rol, persona: quitado, personaId: antesId } : undefined,
  );
}

// Sube el dia completo (con el nombre visible de cada rol, para el aviso)
function subirDia(
  fecha: string,
  avisarRol?: RolId,
  quitado?: { rol: RolId; persona: string; personaId?: string },
  cambioHora?: RolId, // se cambio la hora de este turno (ya con persona)
) {
  const s = useStore.getState();
  const iglesiaId = s.iglesia?.id;
  if (!iglesiaId) return;
  const nombres: Record<string, Rol> = { ...ROLES, ...s.rolesExtra };
  const turnos = (s.turnosEditados[fecha] ?? []).map((t) => ({
    ...t,
    rolNombre: nombres[t.rol]?.label,
  }));
  const avisar = turnos.find((t) => t.rol === avisarRol);
  const conHoraNueva = turnos.find((t) => t.rol === cambioHora);
  // estado "Guardando cronograma…" (el aviso a la persona va aparte: si
  // falla, el cronograma igual quedo guardado)
  const clave = `dia:${iglesiaId}:${fecha}`;
  ponerSubida(clave, {
    etapa: "guardando",
    desde: new Date().toISOString(),
    iglesiaId,
    error: undefined,
  });
  enFondo(
    subirTurnosDelDia(iglesiaId, fecha, turnos)
      .then(
        () => terminarSubida(clave),
        (e) => {
          ponerSubida(clave, { etapa: "error", error: mensajeDe(e) });
          throw e;
        },
      )
      .then(() =>
        Promise.all([
          avisar &&
            avisarTurno({
              tipo: "asignado",
              iglesiaId,
              fecha,
              rol: avisar.rolNombre ?? avisar.rol,
              hora: horaTurno(avisar),
              persona: avisar.persona,
              personaId: avisar.personaId,
            }),
          quitado &&
            avisarTurno({
              tipo: "quitado",
              iglesiaId,
              fecha,
              rol: nombres[quitado.rol]?.label ?? quitado.rol,
              persona: quitado.persona,
              personaId: quitado.personaId,
            }),
          conHoraNueva &&
            avisarTurno({
              tipo: "hora",
              iglesiaId,
              fecha,
              rol: conHoraNueva.rolNombre ?? conHoraNueva.rol,
              hora: horaTurno(conHoraNueva),
              persona: conHoraNueva.persona,
              personaId: conHoraNueva.personaId,
            }),
        ]),
      ),
  );
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
  // a la persona del turno: "Cambió la hora de tu turno"
  subirDia(fecha, undefined, undefined, rol);
}

// Guarda un versiculo (o varios seguidos) en el perfil
// "Me gusta" de un versiculo: el doble toque solo lo da; el boton lo quita
// (se guarda la cita y el texto para mostrarlos en el Perfil)
export type MeGustaInfo = { cita: string; texto: string; fecha: string };

export function darMeGusta(clave: string, info: Omit<MeGustaInfo, "fecha">) {
  cambiar((s) =>
    s.meGusta.includes(clave)
      ? s
      : {
          meGusta: [...s.meGusta, clave],
          meGustaTextos: {
            ...s.meGustaTextos,
            [clave]: { ...info, fecha: new Date().toISOString() },
          },
        },
  );
}
export function alternarMeGusta(
  clave: string,
  info: Omit<MeGustaInfo, "fecha">,
) {
  cambiar((s) => {
    if (!s.meGusta.includes(clave)) {
      return {
        meGusta: [...s.meGusta, clave],
        meGustaTextos: {
          ...s.meGustaTextos,
          [clave]: { ...info, fecha: new Date().toISOString() },
        },
      };
    }
    const resto = { ...s.meGustaTextos };
    delete resto[clave];
    return {
      meGusta: s.meGusta.filter((c) => c !== clave),
      meGustaTextos: resto,
    };
  });
}

// Anuncios ya avisados ("Nuevo evento"), para no repetir
export function marcarAnunciosAvisados(ids: string[]) {
  cambiar((s) => ({
    anunciosAvisados: [...new Set([...(s.anunciosAvisados ?? []), ...ids])],
  }));
}

// Ya no es lider de esa sala: se olvida (si lo vuelven a nombrar, se avisa)
export function olvidarAnunciosAvisados(claves: string[]) {
  cambiar((s) => ({
    anunciosAvisados: (s.anunciosAvisados ?? []).filter(
      (k) => !claves.includes(k),
    ),
  }));
}

// Ya no tiene esos turnos (lo quitaron): se olvidan para no avisar de nuevo
export function olvidarTurnosAvisados(claves: string[]) {
  cambiar((s) => ({
    turnosAvisados: (s.turnosAvisados ?? []).filter((k) => !claves.includes(k)),
  }));
}

// Turnos suyos que ya se avisaron (para no repetir el "te asignaron")
export function marcarTurnosAvisados(claves: string[]) {
  cambiar((s) => ({
    turnosAvisados: [...new Set([...(s.turnosAvisados ?? []), ...claves])],
  }));
}

// Una explicacion ya vista (no vuelve a salir)
// lo visto en "Para ti", leido en el momento (sin re-dibujar la pantalla)
export const versosVistosAhora = () => useStore.getState().versosVistos;

// "Para ti": recuerda los ultimos versiculos vistos para no repetirlos
export function marcarVersoVisto(clave: string) {
  cambiar((s) => {
    const vistos = s.versosVistos ?? [];
    if (vistos.includes(clave)) return s;
    return { versosVistos: [...vistos, clave].slice(-MAX_VERSOS_VISTOS) };
  });
}

export function marcarAyuda(id: string) {
  cambiar((s) =>
    s.ayudasVistas.includes(id) ? s : { ayudasVistas: [...s.ayudasVistas, id] },
  );
}

// Quita un versiculo (y su oracion) de los guardados del perfil
export function borrarVersiculo(id: string) {
  cambiar((s) => ({ versiculos: s.versiculos.filter((v) => v.id !== id) }));
}

export function guardarVersiculo(v: VersiculoGuardado) {
  buenMomento();
  cambiar((s) => ({
    versiculos: [v, ...s.versiculos.filter((x) => x.id !== v.id)],
  }));
}

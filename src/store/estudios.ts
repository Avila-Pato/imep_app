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
  VersiculoGuardado,
} from "@/types/typesComunidad";
import { Rol, RolId, Turno } from "@/types/typesCronogramas";
import { Iglesia } from "@/types/typesHome";
import { Predicacion } from "@/types/typesOraciones";
import { subirPerfil } from "@/services/perfil";
import { borrarDelServidor } from "@/services/reinicio";
import { registrarDispositivo } from "@/services/push";
import { horaTurno, usarHorarios } from "@/utils/cultos";
import {
  avisarAnuncio,
  avisarTurno,
  bajarAnuncios,
  bajarMiembros,
  type MiembroIglesia,
  bajarTurnos,
  borrarAnuncioRemoto,
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
  desafios: Desafio[]; // "Palabra de la semana" de cada sala
  salasEditadas: Record<string, Partial<Grupo>>; // cambios a las salas de base (Iglesia)
  meGusta: string[]; // versiculos con "me gusta" ("libro-capitulo-verso")
  meGustaTextos: Record<string, MeGustaInfo>; // cita y texto de cada uno (para el perfil)
  ayudasVistas: string[]; // explicaciones que ya vio (salen solo una vez)
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
  avisar?: boolean; // anuncio nuevo: avisar a la iglesia al terminar
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
        avatar: estado.avatar ?? previo.avatar,
        cuenta: estado.cuenta ?? previo.cuenta,
        invitacion: estado.invitacion ?? previo.invitacion,
        portada: estado.portada ?? previo.portada,
        fuenteBiblia: estado.fuenteBiblia ?? previo.fuenteBiblia,
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
export type FuenteBiblia = "clasica" | "moderna";
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
};
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
  const yo = (s.nombre ?? USUARIO.nombre).trim().toLowerCase();
  const hoy = aKeyHoy();
  const deIglesia = (
    iglesia: Iglesia | undefined,
    editados?: Record<string, Turno[]>,
  ) =>
    unirTurnos(editados ?? {})
      .filter((t) => t.persona.trim().toLowerCase() === yo && t.fecha >= hoy)
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
  return (nombre?: string): AvatarElegido | undefined => {
    if (!nombre) return undefined;
    const n = nombre.trim().toLowerCase();
    if (n === yo.trim().toLowerCase()) return miAvatar;
    return miembros.find((m) => m.nombre.trim().toLowerCase() === n)?.avatar;
  };
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
    if (r) marcarSubida(iglesia.id);
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
function marcarSubida(id?: string) {
  if (!id) return;
  cambiar((s) => ({
    iglesias: listaIglesias(s).map((x) =>
      x.id === id ? { ...x, subida: true } : x,
    ),
    iglesia: s.iglesia?.id === id ? { ...s.iglesia, subida: true } : s.iglesia,
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
  const desde = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const [anuncios, turnos, miembros] = await Promise.all([
    bajarAnuncios(id),
    bajarTurnos(id, desde),
    bajarMiembros(id),
  ]).catch((e) => {
    console.warn("[supabase]", e?.message ?? e);
    return [null, null, null] as const;
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
  }));
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
// (y lo sube: si es nuevo, avisa por push a toda la iglesia)
export function guardarAnuncio(a: Omit<Anuncio, "id"> & { id?: string }) {
  const s = useStore.getState();
  const existe = !!a.id && s.anuncios.some((x) => x.id === a.id);
  const anuncio: Anuncio = { ...a, id: existe ? a.id! : nuevoUuid() };
  cambiar({
    anuncios: existe
      ? s.anuncios.map((x) => (x.id === anuncio.id ? anuncio : x))
      : [anuncio, ...s.anuncios],
    // lo publico esta persona: a ella no se le avisa
    anunciosAvisados: [...(s.anunciosAvisados ?? []), anuncio.id],
  });
  const iglesiaId = s.iglesia?.id;
  if (!conectado() || !esUuid(iglesiaId)) return;
  subirAnuncioConEstado(iglesiaId, anuncio, !existe);
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
  avisar: boolean,
) {
  const clave = anuncio.id;
  const conFoto = !!anuncio.imagen && !anuncio.imagen.startsWith("https://");
  ponerSubida(clave, {
    etapa: conFoto ? "foto" : "guardando",
    desde: new Date().toISOString(),
    iglesiaId,
    avisar,
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
        await avisarAnuncio(anuncio.id).catch((e) =>
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
  subirAnuncioConEstado(sub.iglesiaId, anuncio, !!sub.avisar);
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
) {
  const antesPersona = unirTurnos(useStore.getState().turnosEditados).find(
    (t) => t.fecha === fecha && t.rol === rol,
  )?.persona;
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
  // a quien asignaron (o cambiaron) le llega "Te asignaron un turno", y a
  // quien sacaron (o reemplazaron) "Te quitaron de un turno", despues de
  // que el dia ya este arriba
  const nuevo = !!persona && persona !== antesPersona;
  const quitado =
    !!antesPersona && antesPersona !== persona ? antesPersona : undefined;
  subirDia(
    fecha,
    nuevo ? rol : undefined,
    quitado ? { rol, persona: quitado } : undefined,
  );
}

// Sube el dia completo (con el nombre visible de cada rol, para el aviso)
function subirDia(
  fecha: string,
  avisarRol?: RolId,
  quitado?: { rol: RolId; persona: string },
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
            }),
          quitado &&
            avisarTurno({
              tipo: "quitado",
              iglesiaId,
              fecha,
              rol: nombres[quitado.rol]?.label ?? quitado.rol,
              persona: quitado.persona,
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
  subirDia(fecha);
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
  cambiar((s) => ({
    versiculos: [v, ...s.versiculos.filter((x) => x.id !== v.id)],
  }));
}

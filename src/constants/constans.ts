import { conAlfa, MODO_ACTUAL, PALETAS, TEMA_ACTUAL, TEMAS } from "./tema";

import { Categoria, CategoriaId } from "@/types/typesAnuncios";
import { Cargo, CargoId } from "@/types/typesCargos";
import { Grupo } from "@/types/typesComunidad";
import { Rol, RolBase } from "@/types/typesCronogramas";
import { Habito } from "@/types/typesOraciones";
import { OpcionMenu } from "@/types/typesPerfil";
import { Dimensions, Platform } from "react-native";

const { width } = Dimensions.get("window");

// colores base segun el fondo elegido (oscuro o claro)
const PALETA = PALETAS[MODO_ACTUAL];
export const ES_CLARO = MODO_ACTUAL === "claro";

export const TABBAR_WIDTH = width * 0.8; // espaciado de la barra de navegacion
export const SPACING = 10;
export const TAB_ITEM_SIZE = 50;

export const CARD_WIDTH = width - 4 * SPACING;
export const CARD_HEIGHT = CARD_WIDTH * 1.8;
export const SWIPE_THRESHOLD = width * 0.3;
export const SCREEN_WIDTH = width;
export const TEXT_FONT_SIZE = 32;

export const ACCENT = "#8980B8";
export const TEXT_COLOR = "#464343ff";
export const BG_COLOR = "#edf2f5";
export const GREEN = "#34D59A";
export const TABBAR_BG: string = PALETA.barra;
export const TABBAR_BORDER: string = PALETA.barraBorde;

export const BACKGROUND_TRANSLATE_Y = -2;
export const BADGE_HEIGHT = 44;
export const BADGE_WIDTH = 120;
export const INACTIVE_ROTATION = "8deg";

// Paleta oscura
export const DARK_BG: string = PALETA.fondo;
export const SURFACE: string = PALETA.superficie;
export const ELEVADO: string = PALETA.elevado;
export const LECTURA: string = PALETA.lectura;
export const BORDER: string = PALETA.borde;
export const TEXT: string = PALETA.texto;
export const MUTED: string = PALETA.tenue;
// color principal segun el tema elegido (Editar perfil)
export const PRIMARY: string = TEMAS[TEMA_ACTUAL].primario;
// el principal transparente (fondos suaves, bordes)
export const primarioAlfa = (alfa: number) => conAlfa(PRIMARY, alfa);
// barra de pestañas: en oscuro el icono activo es blanco; en claro, del color
export const ACTIVE_COLOR: string = ES_CLARO ? PRIMARY : "#FFFFFF";
export const INACTIVE_COLOR: string = PALETA.inactivo;
// grises que cambian con el fondo
export const LINEA: string = PALETA.linea;
export const RADIO_BORDE: string = PALETA.radio;
export const PLACEHOLDER: string = PALETA.placeholder;

// Onboarding: false = no se muestra nunca (mientras se termina la app)
export const MOSTRAR_BIENVENIDA = true;

// Home
export const SERIF = Platform.select({ ios: "Georgia", default: "serif" });
export const HOME_PADDING = SPACING * 2.4;
export const HOME_CARD_W = width - HOME_PADDING * 2;

// Roles que asigna el pastor (cada uno con lo que puede editar)
export const CARGOS: Record<CargoId, Cargo> = {
  secretaria: {
    label: "Secretario/a",
    texto:
      "Administra el cronograma (quién predica, pasillo, puerta, ofrenda…), publica los anuncios y eventos y asigna roles a los hermanos.",
    icono: "briefcase",
    permisos: ["cronograma", "anuncios", "roles"],
  },
  servicio: {
    label: "Coordinador/a de servicio",
    texto:
      "Organiza los turnos del cronograma: quién sirve en cada culto y en qué lugar.",
    icono: "calendar",
    permisos: ["cronograma"],
  },
  comunicaciones: {
    label: "Comunicaciones",
    texto:
      "Publica anuncios, eventos y avisos para que toda la iglesia esté informada.",
    icono: "megaphone",
    permisos: ["anuncios"],
  },
  lider: {
    label: "Líder de sala",
    texto:
      "Guía a su grupo: aprueba las peticiones de oración y acompaña la conversación de la sala.",
    icono: "people",
    permisos: ["salas"],
  },
};

// Cronogramas (turnos del ministerio)
export const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
export const ROLES: Record<RolBase, Rol> = {
  palabra: { label: "Palabra", icon: "book" },
  pasillo: { label: "Pasillo", icon: "people" },
  alabanza: { label: "Alabanza", icon: "unmute" },
  ofrenda: { label: "Ofrenda", icon: "gift" },
  recepcion: { label: "Puerta", icon: "sign-in" },
};
// por si una casilla se borro y quedo algun turno viejo
export const ROL_GENERICO: Rol = { label: "Turno", icon: "dot-fill" };

// Anuncios (eventos de la iglesia y de cada grupo)
export const MESES_CORTOS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];
export const CATEGORIAS: Record<CategoriaId, Categoria> = {
  evento: { label: "Eventos", icon: "star" },
  jovenes: { label: "Jóvenes", icon: "flame" },
  varones: { label: "Varones", icon: "shield" },
  ninos: { label: "Niños", icon: "smiley" },
};

// Biblia (API publica bolls.life). La persona elige la version; RV1960 por defecto
export const BIBLIA_API = "https://bolls.life";
export const BIBLIA_VERSION = "RV1960";
// Las mas usadas. Ojo: NVI no se puede (Biblica la prohibio en esta API)
export const VERSIONES_BIBLIA = [
  { id: "RV1960", nombre: "Reina-Valera 1960" },
  { id: "NTV", nombre: "Nueva Traducción Viviente" },
  { id: "LBLA", nombre: "La Biblia de las Américas" },
];
// El indice + 1 es el id del libro en la API
export const LIBROS_BIBLIA = [
  "Génesis",
  "Éxodo",
  "Levítico",
  "Números",
  "Deuteronomio",
  "Josué",
  "Jueces",
  "Rut",
  "1 Samuel",
  "2 Samuel",
  "1 Reyes",
  "2 Reyes",
  "1 Crónicas",
  "2 Crónicas",
  "Esdras",
  "Nehemías",
  "Ester",
  "Job",
  "Salmos",
  "Proverbios",
  "Eclesiastés",
  "Cantares",
  "Isaías",
  "Jeremías",
  "Lamentaciones",
  "Ezequiel",
  "Daniel",
  "Oseas",
  "Joel",
  "Amós",
  "Abdías",
  "Jonás",
  "Miqueas",
  "Nahúm",
  "Habacuc",
  "Sofonías",
  "Hageo",
  "Zacarías",
  "Malaquías",
  "Mateo",
  "Marcos",
  "Lucas",
  "Juan",
  "Hechos",
  "Romanos",
  "1 Corintios",
  "2 Corintios",
  "Gálatas",
  "Efesios",
  "Filipenses",
  "Colosenses",
  "1 Tesalonicenses",
  "2 Tesalonicenses",
  "1 Timoteo",
  "2 Timoteo",
  "Tito",
  "Filemón",
  "Hebreos",
  "Santiago",
  "1 Pedro",
  "2 Pedro",
  "1 Juan",
  "2 Juan",
  "3 Juan",
  "Judas",
  "Apocalipsis",
];
// Grupos de libros (desde/hasta = numero de libro, 1 = Genesis)
export const GENEROS_BIBLIA = [
  { nombre: "Ley", desde: 1, hasta: 5 },
  { nombre: "Historia", desde: 6, hasta: 17 },
  { nombre: "Poesía", desde: 18, hasta: 22 },
  { nombre: "Profetas", desde: 23, hasta: 39 },
  { nombre: "Evangelios", desde: 40, hasta: 43 },
  { nombre: "Historia de la Iglesia", desde: 44, hasta: 44 },
  { nombre: "Cartas de Pablo", desde: 45, hasta: 57 },
  { nombre: "Cartas generales", desde: 58, hasta: 65 },
  { nombre: "Profecía", desde: 66, hasta: 66 },
];
// Colores para resaltar versiculos (apagados, se ven con transparencia)
export const COLORES_RESALTADO = [
  "#C9B24A", // amarillo
  "#D98C4A", // naranja
  "#C95F5F", // rojo
  "#C27A9E", // rosa
  "#9278C2", // morado
  "#5B7FC4", // azul
  "#3F8FA8", // celeste
  "#4FA59A", // turquesa
  "#5FA36A", // verde
  "#9AA85A", // oliva
];
// Cantidad de capitulos de cada libro (mismo orden que LIBROS_BIBLIA)
export const CAPITULOS_BIBLIA = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150,
  31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16,
  24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1,
  22,
];

// Perfil
export const MENU_PERFIL: { titulo: string; opciones: OpcionMenu[] }[] = [
  {
    titulo: "Cuenta",
    opciones: [
      { id: "editar", label: "Editar perfil", icon: "pencil" },
      { id: "codigo", label: "Tengo un código", icon: "key" },
      { id: "ministerios", label: "Mi ministerio", icon: "people" },
      { id: "notificaciones", label: "Notificaciones", icon: "bell" },
    ],
  },
  {
    titulo: "App",
    opciones: [
      { id: "privacidad", label: "Privacidad", icon: "lock" },
      { id: "ayuda", label: "Ayuda", icon: "question" },
      { id: "reiniciar", label: "Reiniciar app", icon: "sync", peligro: true },
      { id: "salir", label: "Cerrar sesión", icon: "sign-out", peligro: true },
    ],
  },
];

// Mapa (teselas "Dark Gray" de Esri, sin API key). Ojo: el orden es zoom/y/x
export const mapaTesela = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${z}/${y}/${x}`;
export const MAPA_ZOOM = 16; // maximo de este mapa
export const MAPA_ATRIBUCION = "Esri, HERE, Garmin · © OpenStreetMap";
// Mapa claro con nombres de calles (para elegir la ubicacion: se lee mejor)
export const mapaTeselaClara = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`;
export const MAPA_CLARO_ZOOM = 19;

// Fuentes (Inter, cargada en src/app/_layout.tsx)
export const FUENTE = {
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  mano: "Caveat_600SemiBold", // estilo escrito a mano
  // Biblia: letra de libro impreso (EB Garamond)
  biblia: "EBGaramond_400Regular",
  bibliaCursiva: "EBGaramond_400Regular_Italic",
  bibliaFuerte: "EBGaramond_600SemiBold",
};

// Muro de oracion: papelitos en tonos suaves (no llamativos)
export const NOTAS_COLORES = ["#E9E3D6", "#D9DFE4", "#DCE3D7", "#E6DCDA"];
export const NOTA_TINTA = "#2A2A2A";

// Comunidad: salas por grupo
// Solo la sala de toda la iglesia; las de cada grupo las crea el pastor
export const GRUPOS: Grupo[] = [
  {
    id: "general",
    label: "Iglesia",
    descripcion: "Toda la congregación",
    icono: "home",
  },
];

// Estudio: "Tu dia con Dios" (un habito por momento del dia)
export const HABITOS_DIA: Habito[] = [
  {
    id: "orar",
    momento: "Mañana",
    icono: "sun",
    titulo: "Orar al despertar",
    minutos: 5,
  },
  {
    id: "leer",
    momento: "Día",
    icono: "book",
    titulo: "Leer la Biblia",
    minutos: 10,
  },
  {
    id: "estudio",
    momento: "Noche",
    icono: "moon",
    titulo: "Estudio guiado",
    minutos: 15,
  },
];

// Las peticiones del muro de oracion duran 24 horas
export const DURACION_ORACION_HORAS = 24;

// Versiculos conocidos para autocompletar la busqueda (sin internet)
export const VERSICULOS_POPULARES = [
  "Génesis 1:1",
  "Josué 1:9",
  "Deuteronomio 31:6",
  "Salmos 1:1",
  "Salmos 23:1",
  "Salmos 27:1",
  "Salmos 37:4",
  "Salmos 46:1",
  "Salmos 91:1",
  "Salmos 119:105",
  "Salmos 121:1",
  "Salmos 139:14",
  "Proverbios 3:5-6",
  "Proverbios 16:3",
  "Proverbios 22:6",
  "Eclesiastés 3:1",
  "Isaías 40:31",
  "Isaías 41:10",
  "Isaías 53:5",
  "Jeremías 29:11",
  "Jeremías 33:3",
  "Lamentaciones 3:22-23",
  "Miqueas 6:8",
  "Sofonías 3:17",
  "Mateo 5:16",
  "Mateo 6:33",
  "Mateo 11:28",
  "Mateo 28:19-20",
  "Marcos 16:15",
  "Lucas 1:37",
  "Juan 1:1",
  "Juan 3:16",
  "Juan 8:32",
  "Juan 10:10",
  "Juan 14:6",
  "Juan 15:5",
  "Juan 16:33",
  "Hechos 1:8",
  "Romanos 5:8",
  "Romanos 8:28",
  "Romanos 10:9",
  "Romanos 12:2",
  "1 Corintios 13:4",
  "2 Corintios 5:17",
  "Gálatas 2:20",
  "Gálatas 5:22-23",
  "Efesios 2:8",
  "Efesios 6:10",
  "Filipenses 4:6-7",
  "Filipenses 4:13",
  "Colosenses 3:23",
  "2 Timoteo 1:7",
  "2 Timoteo 3:16",
  "Hebreos 11:1",
  "Hebreos 13:8",
  "Santiago 1:5",
  "1 Pedro 5:7",
  "1 Juan 1:9",
  "1 Juan 4:8",
  "Apocalipsis 3:20",
  "Apocalipsis 21:4",
];

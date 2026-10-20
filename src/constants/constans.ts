import { Categoria, CategoriaId } from "@/types/typesAnuncios";
import { Grupo } from "@/types/typesComunidad";
import { Rol, RolId } from "@/types/typesCronogramas";
import { Habito } from "@/types/typesOraciones";
import { OpcionMenu } from "@/types/typesPerfil";
import { Dimensions, Platform } from "react-native";

const { width } = Dimensions.get("window");

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
export const ACTIVE_COLOR = "#FFFFFF";
export const INACTIVE_COLOR = "#7A7A7A";
export const TABBAR_BG = "#161616";
export const TABBAR_BORDER = "#262626";

export const BACKGROUND_TRANSLATE_Y = -2;
export const BADGE_HEIGHT = 44;
export const BADGE_WIDTH = 120;
export const INACTIVE_ROTATION = "8deg";

// Paleta oscura
export const DARK_BG = "#121212";
export const SURFACE = "#1E1E1E";
export const BORDER = "#2A2A2A";
export const TEXT = "#F2F2F2";
export const MUTED = "#9A9A9A";
export const PRIMARY = "#E5484D";

// Home
export const SERIF = Platform.select({ ios: "Georgia", default: "serif" });
export const HOME_PADDING = SPACING * 2.4;
export const HOME_CARD_W = width - HOME_PADDING * 2;

// Cronogramas (turnos del ministerio)
export const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
export const ROLES: Record<RolId, Rol> = {
  palabra: { label: "Palabra", icon: "book" },
  pasillo: { label: "Pasillo", icon: "people" },
  alabanza: { label: "Alabanza", icon: "unmute" },
  ofrenda: { label: "Ofrenda", icon: "gift" },
  recepcion: { label: "Recepción", icon: "home" },
};

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

// Biblia (API publica bolls.life, Reina-Valera 1960)
export const BIBLIA_API = "https://bolls.life";
export const BIBLIA_VERSION = "RV1960";
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
      { id: "ministerios", label: "Mis ministerios", icon: "people" },
      { id: "notificaciones", label: "Notificaciones", icon: "bell" },
    ],
  },
  {
    titulo: "App",
    opciones: [
      { id: "privacidad", label: "Privacidad", icon: "lock" },
      { id: "ayuda", label: "Ayuda", icon: "question" },
      { id: "salir", label: "Cerrar sesión", icon: "sign-out", peligro: true },
    ],
  },
];

// Mapa (teselas "Dark Gray" de Esri, sin API key). Ojo: el orden es zoom/y/x
export const mapaTesela = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${z}/${y}/${x}`;
export const MAPA_ZOOM = 16; // maximo de este mapa
export const MAPA_ATRIBUCION = "Esri, HERE, Garmin · © OpenStreetMap";

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
export const GRUPOS: Grupo[] = [
  {
    id: "general",
    label: "Iglesia",
    descripcion: "Toda la congregación",
    icono: "home",
  },
  {
    id: "jovenes",
    label: "Jóvenes",
    descripcion: "Grupo de jóvenes",
    icono: "flame",
    tono: "#D8C8A8",
  },
  {
    id: "varones",
    label: "Varones",
    descripcion: "Hermanos varones",
    icono: "shield",
    tono: "#B8C4CC",
  },
  {
    id: "dorcas",
    label: "Dorcas",
    descripcion: "Hermanas de Dorcas",
    icono: "heart",
    tono: "#D5C1BF",
  },
  {
    id: "ninos",
    label: "Niños",
    descripcion: "Escuela dominical",
    icono: "smiley",
    tono: "#C2CCB6",
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

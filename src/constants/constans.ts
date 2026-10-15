import { Categoria, CategoriaId } from "@/types/typesAnuncios";
import { Rol, RolId } from "@/types/typesCronogramas";
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
export const HOME_TABS = ["Inicio", "Devocionales"];
export const SERIF = Platform.select({ ios: "Georgia", default: "serif" });
export const HOME_PADDING = SPACING * 2.4;
export const HOME_CARD_W = width - HOME_PADDING * 2;
export const DEVO_W = HOME_CARD_W * 0.8;
export const DEVO_GAP = SPACING * 1.2;

// Cronogramas (turnos del ministerio)
export const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
// Dias de culto (como Date.getDay(): 0 = domingo ... 6 = sabado)
export const DIAS_CULTO = [2, 4, 0]; // martes, jueves, domingo
export const ROLES: Record<RolId, Rol> = {
  palabra: { label: "Palabra", icon: "book", color: "#E5484D" },
  pasillo: { label: "Pasillo", icon: "people", color: "#3B9EFF" },
  alabanza: { label: "Alabanza", icon: "unmute", color: "#A78BFA" },
  ofrenda: { label: "Ofrenda", icon: "gift", color: "#F5A524" },
  recepcion: { label: "Recepción", icon: "home", color: "#30C48D" },
};

// Anuncios (eventos y avisos generales)
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
  aviso: { label: "Avisos", icon: "megaphone" },
  jovenes: { label: "Jóvenes", icon: "flame" },
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

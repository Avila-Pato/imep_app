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

import { Dimensions } from "react-native";

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
export const INACTIVE_COLOR = "#6B7280";
export const TABBAR_BG = "#0b0d13";
export const TABBAR_BORDER = "#4a515a";

export const BACKGROUND_TRANSLATE_Y = -2;
export const BADGE_HEIGHT = 44;
export const BADGE_WIDTH = 120;
export const INACTIVE_ROTATION = "8deg";

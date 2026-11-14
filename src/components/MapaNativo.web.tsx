import type { Ref } from "react";
import type { StyleProp, ViewStyle } from "react-native";

// En la web no hay mapa nativo: las pantallas usan las teselas de siempre
export const HAY_MAPA_NATIVO = false;

export type MapaNativoRef = {
  irA: (lat: number, lng: number, zoom?: number) => void;
};

export default function MapaNativo(_: {
  ref?: Ref<MapaNativoRef>;
  lat: number;
  lng: number;
  zoom: number;
  lite?: boolean;
  onMovido?: (lat: number, lng: number, zoom: number) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return null;
}

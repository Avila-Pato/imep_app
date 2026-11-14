import Constants, { ExecutionEnvironment } from "expo-constants";
import { Ref, useImperativeHandle, useRef, useState } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import MapView, { MapStyleElement, PROVIDER_GOOGLE } from "react-native-maps";

// Mapa de Google del telefono (en iPhone, el de Apple). Liviano:
//  - "lite": una imagen fija del mapa (tarjetas), casi no gasta
//  - sin "lite": se mueve con el dedo (elegir la ubicacion)
// En la web no existe (MapaNativo.web.tsx): ahi se usan las teselas
// Solo en la app compilada (lleva nuestra clave, firmada con nuestra huella).
// En Expo Go el mapa de Google sale vacio (no tiene la clave): ahi se siguen
// usando las teselas, para poder probar mientras se desarrolla
export const HAY_MAPA_NATIVO =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

export type MapaNativoRef = {
  irA: (lat: number, lng: number, zoom?: number) => void;
};

// Google "como es", con menos ruido: sin negocios ni iconos de micro/metro
const ESTILO: MapStyleElement[] = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
];

// zoom de Google a partir de lo que se ve (ancho en grados y en pantalla)
const zoomDe = (longitudeDelta: number, ancho: number) =>
  Math.log2((360 * (ancho / 256)) / longitudeDelta);

export default function MapaNativo({
  ref,
  lat,
  lng,
  zoom,
  lite,
  onMovido,
  style,
}: {
  ref?: Ref<MapaNativoRef>;
  lat: number;
  lng: number;
  zoom: number;
  lite?: boolean; // imagen fija (sin gestos)
  onMovido?: (lat: number, lng: number, zoom: number) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const mapa = useRef<MapView>(null);
  const [ancho, setAncho] = useState(0);
  const camara = {
    center: { latitude: lat, longitude: lng },
    zoom,
    heading: 0,
    pitch: 0,
  };

  useImperativeHandle(ref, () => ({
    irA: (la, ln, z) =>
      mapa.current?.animateCamera(
        { center: { latitude: la, longitude: ln }, ...(z ? { zoom: z } : {}) },
        { duration: 450 },
      ),
  }));

  return (
    <View
      style={[StyleSheet.absoluteFill, style]}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      pointerEvents={lite ? "none" : "auto"}
    >
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        // fija: sigue a lat/lng; movible: parte ahi y despues manda el dedo
        {...(lite ? { camera: camara } : { initialCamera: camara })}
        liteMode={lite}
        customMapStyle={ESTILO}
        showsPointsOfInterests={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        scrollEnabled={!lite}
        zoomEnabled={!lite}
        moveOnMarkerPress={false}
        onRegionChangeComplete={(r) => {
          if (!onMovido || !ancho) return;
          onMovido(r.latitude, r.longitude, zoomDe(r.longitudeDelta, ancho));
        }}
      />
    </View>
  );
}

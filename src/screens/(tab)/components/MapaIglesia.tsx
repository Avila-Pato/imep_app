import {
  MAPA_ATRIBUCION,
  MAPA_ZOOM,
  mapaTesela,
  PRIMARY,
  SPACING,
  TEXT,
  ELEVADO,
} from "@/constants/constans";
import { teselasVisibles } from "@/utils/mapa";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Esqueleto from "./Esqueleto";

type Props = {
  lat: number;
  lng: number;
  ancho: number;
  alto: number;
  onComoLlegar?: () => void; // sin esto no se muestra el boton (vista previa)
  etiqueta?: string; // nombre en un globo sobre el pin
  focoY?: number; // altura del pin (0 arriba, 1 abajo)
};

// El pin queda un poco arriba del centro para que no lo tape el panel inferior
const PIN = 44;

export default function MapaIglesia({
  lat,
  lng,
  ancho,
  alto,
  onComoLlegar,
  etiqueta,
  focoY = 0.38,
}: Props) {
  const FOCO = { x: 0.5, y: focoY };
  const { teselas, tamano } = teselasVisibles(
    lat,
    lng,
    MAPA_ZOOM,
    ancho,
    alto,
    FOCO,
  );
  // teselas que ya llegaron (si una falla tambien cuenta: no se queda cargando)
  const [listas, setListas] = useState<Set<string>>(new Set());
  const marcar = (clave: string) =>
    setListas((l) => (l.has(clave) ? l : new Set(l).add(clave)));
  const cargado = teselas.every((t) => listas.has(`${t.x}-${t.y}`));

  // el esqueleto se desvanece cuando el mapa esta completo
  const esqueletoStyle = useAnimatedStyle(() => ({
    opacity: withTiming(cargado ? 0 : 1, { duration: 350 }),
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {teselas.map((t) => (
        <Image
          key={`${t.x}-${t.y}`}
          source={mapaTesela(MAPA_ZOOM, t.x, t.y)}
          style={{
            position: "absolute",
            left: t.left,
            top: t.top,
            width: tamano,
            height: tamano,
          }}
          cachePolicy="disk"
          onLoad={() => marcar(`${t.x}-${t.y}`)}
          onError={() => marcar(`${t.x}-${t.y}`)}
        />
      ))}

      {/* Mientras carga: esqueleto que late (sin pedazos apareciendo) */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.esqueleto, esqueletoStyle]}
      >
        <Esqueleto alto="100%" radio={0} />
      </Animated.View>

      {/* Pin de la iglesia */}
      <View
        pointerEvents="none"
        style={[
          styles.pin,
          { left: ancho * FOCO.x - PIN / 2, top: alto * FOCO.y - PIN / 2 },
        ]}
      >
        <View style={styles.pinHalo} />
        <View style={styles.pinPunto}>
          <Octicons name="home-fill" size={12} color="#FFFFFF" />
        </View>
      </View>

      {/* Globo con el nombre de la iglesia sobre el pin */}
      {!!etiqueta && (
        <View
          pointerEvents="none"
          style={[styles.globo, { top: alto * FOCO.y - PIN / 2 - 34 }]}
        >
          <View style={styles.globoCaja}>
            <Octicons name="heart-fill" size={10} color={PRIMARY} />
            <Text style={styles.globoTexto} numberOfLines={1}>
              {etiqueta}
            </Text>
          </View>
          <View style={styles.globoPunta} />
        </View>
      )}

      {onComoLlegar && (
        <Pressable
          onPress={onComoLlegar}
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
          accessibilityLabel="Cómo llegar a la iglesia"
        >
          <Octicons name="arrow-up-right" size={12} color={TEXT} />
          <Text style={styles.botonTexto}>Cómo llegar</Text>
        </Pressable>
      )}

      <Text style={styles.atribucion}>{MAPA_ATRIBUCION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  esqueleto: {
    backgroundColor: ELEVADO,
  },
  pin: {
    position: "absolute",
    width: PIN,
    height: PIN,
    alignItems: "center",
    justifyContent: "center",
  },
  pinHalo: {
    ...StyleSheet.absoluteFill,
    borderRadius: PIN / 2,
    backgroundColor: PRIMARY,
    opacity: 0.25,
  },
  pinPunto: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  globo: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  globoCaja: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: 200,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  globoTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: "#121212",
  },
  globoPunta: {
    width: 8,
    height: 8,
    marginTop: -4,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  boton: {
    position: "absolute",
    top: SPACING * 1.4,
    right: SPACING * 1.4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING * 1.2,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  presionado: {
    opacity: 0.7,
  },
  botonTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT,
  },
  atribucion: {
    position: "absolute",
    top: SPACING * 1.4 + 32,
    right: SPACING * 1.4,
    fontSize: 8,
    color: "rgba(255,255,255,0.4)",
  },
});

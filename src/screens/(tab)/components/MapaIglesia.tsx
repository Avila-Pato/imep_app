import {
  MAPA_ATRIBUCION,
  MAPA_ZOOM,
  mapaTesela,
  PRIMARY,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { teselasVisibles } from "@/utils/mapa";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  lat: number;
  lng: number;
  ancho: number;
  alto: number;
  onComoLlegar: () => void;
};

// El pin queda un poco arriba del centro para que no lo tape el panel inferior
const FOCO = { x: 0.5, y: 0.38 };
const PIN = 44;

export default function MapaIglesia({
  lat,
  lng,
  ancho,
  alto,
  onComoLlegar,
}: Props) {
  const { teselas, tamano } = teselasVisibles(
    lat,
    lng,
    MAPA_ZOOM,
    ancho,
    alto,
    FOCO,
  );

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
          transition={200}
        />
      ))}

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

      <Pressable
        onPress={onComoLlegar}
        style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
        accessibilityLabel="Cómo llegar a la iglesia"
      >
        <Octicons name="arrow-up-right" size={12} color={TEXT} />
        <Text style={styles.botonTexto}>Cómo llegar</Text>
      </Pressable>

      <Text style={styles.atribucion}>{MAPA_ATRIBUCION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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

import {
  BORDER,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  TEXT,
  primarioAlfa,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const MENSAJES = [
  "Preparando tu Biblia…",
  "Abriendo las salas…",
  "Construyendo tu perfil…",
];
const DURACION = 2800;

// Pantalla de carga final: anima y despues entra a la app
export default function PasoCargando({
  nombre,
  onListo,
}: {
  nombre?: string;
  onListo: () => void;
}) {
  const [mensaje, setMensaje] = useState(0);
  const barra = useSharedValue(0);
  const latido = useSharedValue(1);
  const giro = useSharedValue(0);

  useEffect(() => {
    barra.set(
      withTiming(1, { duration: DURACION, easing: Easing.inOut(Easing.cubic) }),
    );
    latido.set(
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 700 }),
          withTiming(1, { duration: 700 }),
        ),
        -1,
      ),
    );
    giro.set(
      withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1),
    );

    // cambia el texto y al final entra
    const cambio = setInterval(
      () => setMensaje((m) => Math.min(m + 1, MENSAJES.length - 1)),
      DURACION / MENSAJES.length,
    );
    const fin = setTimeout(onListo, DURACION + 300);
    return () => {
      clearInterval(cambio);
      clearTimeout(fin);
    };
  }, [barra, latido, giro, onListo]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: latido.get() }],
  }));
  const aroStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${giro.get() * 360}deg` }],
  }));
  const barraStyle = useAnimatedStyle(() => ({
    width: `${barra.get() * 100}%`,
  }));

  return (
    <View style={styles.centro}>
      <View style={styles.logoZona}>
        {/* aro punteado que gira alrededor */}
        <Animated.View style={[styles.aro, aroStyle]} />
        <Animated.View style={[styles.logo, logoStyle]}>
          <Octicons name="book" size={36} color="#FFFFFF" />
        </Animated.View>
      </View>

      {nombre && <Text style={styles.hola}>Hola, {nombre}</Text>}
      <Text style={styles.mensaje}>{MENSAJES[mensaje]}</Text>

      <View style={styles.barra}>
        <Animated.View style={[styles.barraLlena, barraStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING * 1.4,
    paddingHorizontal: SPACING * 4,
  },
  logoZona: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING * 2,
  },
  aro: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: primarioAlfa(0.5),
  },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },
  hola: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    letterSpacing: 1,
    color: MUTED,
  },
  mensaje: {
    fontFamily: FUENTE.semibold,
    fontSize: 17,
    color: TEXT,
  },
  barra: {
    width: "70%",
    height: 3,
    marginTop: SPACING,
    borderRadius: 2,
    backgroundColor: BORDER,
    overflow: "hidden",
  },
  barraLlena: {
    height: 3,
    borderRadius: 2,
    backgroundColor: PRIMARY,
  },
});

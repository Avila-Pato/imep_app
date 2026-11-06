import { BORDER, FUENTE, MUTED, TEXT } from "@/constants/constans";
import {
  fijarLetra,
  LETRA_MAX,
  LETRA_MIN,
  useEstudios,
} from "@/store/estudios";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const PUNTO = 20; // diametro del punto que se arrastra
const RANGO = LETRA_MAX - LETRA_MIN;

// Nivelador del tamaño de letra de la Biblia: A chica ── ● ── A grande.
// Se arrastra el punto (o se toca la barra) y la letra cambia en vivo.
export default function TamanoLetra() {
  const letra = useEstudios().letra ?? 1;
  const [ancho, setAncho] = useState(0); // ancho util de la barra
  const x = useSharedValue(0); // posicion del punto
  const arrastrando = useSharedValue(false);

  // la letra guardada ubica el punto (sin pelear con el dedo)
  useEffect(() => {
    if (arrastrando.get() || !ancho) return;
    x.set(
      withTiming(((letra - LETRA_MIN) / RANGO) * ancho, {
        duration: 160,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [letra, ancho, x, arrastrando]);

  // posicion del dedo -> tamaño (solo guarda si cambio el paso)
  const mover = (px: number) => {
    if (!ancho) return;
    const p = Math.min(ancho, Math.max(0, px - PUNTO / 2));
    x.set(p);
    const valor = LETRA_MIN + (p / ancho) * RANGO;
    if (Math.round(valor * 10) !== Math.round(letra * 10)) fijarLetra(valor);
  };

  const gesto = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0) // un toque en la barra tambien sirve
    .onBegin((e) => {
      arrastrando.set(true);
      mover(e.x);
    })
    .onUpdate((e) => mover(e.x))
    .onFinalize(() => {
      arrastrando.set(false);
      // se acomoda justo en el paso elegido
      x.set(
        withTiming(((letra - LETRA_MIN) / RANGO) * ancho, { duration: 120 }),
      );
    });

  const puntoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));
  const rellenoStyle = useAnimatedStyle(() => ({
    width: x.get() + PUNTO / 2,
  }));

  return (
    <View
      style={styles.fila}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Tamaño de letra"
      accessibilityValue={{ text: `${Math.round(letra * 100)}%` }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) =>
        fijarLetra(
          letra + (e.nativeEvent.actionName === "increment" ? 0.1 : -0.1),
        )
      }
    >
      <Text style={styles.chica}>A</Text>

      <GestureDetector gesture={gesto}>
        <View
          style={styles.zona}
          onLayout={(e) => setAncho(e.nativeEvent.layout.width - PUNTO)}
        >
          <View style={styles.barra} />
          <Animated.View style={[styles.relleno, rellenoStyle]} />
          <Animated.View style={[styles.punto, puntoStyle]} />
        </View>
      </GestureDetector>

      <Text style={styles.grande}>A</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // ocupa el espacio libre al lado del otro boton (sin bajar de linea)
  fila: {
    flex: 1,
    minWidth: 120,
    maxWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  chica: {
    fontFamily: FUENTE.biblia,
    fontSize: 13,
    color: MUTED,
  },
  grande: {
    fontFamily: FUENTE.biblia,
    fontSize: 22,
    color: TEXT,
  },
  // zona tocable mas alta que la barra (facil de agarrar)
  zona: {
    flex: 1,
    height: 36,
    justifyContent: "center",
  },
  barra: {
    position: "absolute",
    left: PUNTO / 2,
    right: PUNTO / 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: BORDER,
  },
  relleno: {
    position: "absolute",
    left: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: MUTED,
  },
  punto: {
    position: "absolute",
    left: 0,
    width: PUNTO,
    height: PUNTO,
    borderRadius: PUNTO / 2,
    backgroundColor: TEXT,
  },
});

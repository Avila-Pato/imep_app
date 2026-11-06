import { HISTORIAS } from "@/assets/data/bienvenidaMocks";
import {
  DARK_BG,
  FUENTE,
  HOME_PADDING as PADDING,
  PRIMARY,
  SERIF,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { partirTitulo } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ULTIMA = HISTORIAS.length - 1;

// Degradados con franjas (sin otra libreria)
const ABAJO = [0.1, 0.3, 0.5, 0.7, 0.85, 0.95, 1];
const ARRIBA = [0.55, 0.3, 0.12, 0];

// Presentacion tipo "historias". No avanzan solas: cada uno lee a su ritmo.
// Se cambia deslizando (izquierda = siguiente) o tocando: a la izquierda
// vuelve, al centro o a la derecha avanza
export default function PasoHistorias({ onSeguir }: { onSeguir: () => void }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [actual, setActual] = useState(0);
  const zoom = useSharedValue(1);

  const siguiente = () =>
    actual < ULTIMA ? setActual(actual + 1) : onSeguir();
  const anterior = () => setActual(Math.max(0, actual - 1));

  // cada foto se acerca despacio (solo decorativo, no cambia de historia)
  useEffect(() => {
    zoom.set(1);
    zoom.set(withTiming(1.08, { duration: 9000, easing: Easing.linear }));
  }, [actual, zoom]);

  const deslizar = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-15, 15])
    .failOffsetY([-30, 30])
    .onEnd((e) => {
      if (e.translationX < -50 || e.velocityX < -500) siguiente();
      else if (e.translationX > 50 || e.velocityX > 500) anterior();
    });
  const tocar = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      if (e.x < width / 3) anterior();
      else siguiente();
    });
  // un gesto a la vez: si desliza no cuenta como toque
  const gestos = Gesture.Exclusive(deslizar, tocar);

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoom.get() }],
  }));

  const h = HISTORIAS[actual];
  const { inicio, final } = partirTitulo(h.titulo);

  return (
    <View style={styles.flex}>
      {/* Foto a pantalla completa */}
      <Animated.View
        key={actual}
        entering={FadeIn.duration(450)}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
          <Image
            source={h.imagen}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
        </Animated.View>
        <View style={styles.sombraArriba} pointerEvents="none">
          {ARRIBA.map((o, i) => (
            <View key={i} style={[styles.franja, { opacity: o }]} />
          ))}
        </View>
        <View style={styles.sombraAbajo} pointerEvents="none">
          {ABAJO.map((o, i) => (
            <View key={i} style={[styles.franja, { opacity: o }]} />
          ))}
        </View>
      </Animated.View>

      {/* Zona para deslizar o tocar (detras de los botones) */}
      <GestureDetector gesture={gestos}>
        <View
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Historia ${actual + 1} de ${HISTORIAS.length}`}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) =>
            e.nativeEvent.actionName === "increment" ? siguiente() : anterior()
          }
        />
      </GestureDetector>

      {/* Arriba: barras, logo y saltar */}
      <View
        style={[styles.arriba, { paddingTop: insets.top + SPACING }]}
        pointerEvents="box-none"
      >
        <View style={styles.barras} pointerEvents="none">
          {HISTORIAS.map((_, i) => (
            <Barra key={i} llena={i <= actual} />
          ))}
        </View>
        <View style={styles.marcaFila} pointerEvents="box-none">
          <View style={styles.marca} pointerEvents="none">
            <View style={styles.marcaIcono}>
              <Octicons name="home" size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.marcaTexto}>IMEP</Text>
          </View>
          <Pressable
            onPress={onSeguir}
            hitSlop={10}
            style={styles.saltar}
            accessibilityLabel="Saltar presentación"
          >
            <Text style={styles.saltarTexto}>Saltar</Text>
          </Pressable>
        </View>
      </View>

      {/* Texto de la historia */}
      <View
        style={[styles.texto, { paddingBottom: insets.bottom + SPACING * 3 }]}
        pointerEvents="box-none"
      >
        <Animated.View
          key={`t${actual}`}
          entering={FadeInDown.duration(500).delay(150)}
          style={styles.textoInterno}
          pointerEvents="none"
        >
          <View style={styles.etiquetaFila}>
            <View style={styles.etiquetaLinea} />
            <Text style={styles.etiqueta}>{h.etiqueta}</Text>
          </View>
          <Text style={styles.titulo}>
            {inicio}
            <Text style={styles.cursiva}>{final}</Text>
          </Text>
          <Text style={styles.descripcion}>{h.texto}</Text>
        </Animated.View>

        {actual === ULTIMA ? (
          <Pressable
            onPress={onSeguir}
            style={({ pressed }) => [
              styles.boton,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.botonTexto}>Comenzar</Text>
            <Octicons name="arrow-right" size={16} color={DARK_BG} />
          </Pressable>
        ) : (
          <View style={styles.pistaFila} pointerEvents="none">
            <Text style={styles.pista}>Desliza o toca para continuar</Text>
            <Octicons name="chevron-right" size={14} color="#8A8A8A" />
          </View>
        )}
      </View>
    </View>
  );
}

// Una barra: llena hasta la historia actual (se llena con animacion)
function Barra({ llena }: { llena: boolean }) {
  const estilo = useAnimatedStyle(() => ({
    width: withTiming(llena ? "100%" : "0%", { duration: 300 }),
  }));
  return (
    <View style={styles.barra}>
      <Animated.View style={[styles.barraLlena, estilo]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: DARK_BG,
    overflow: "hidden",
  },
  presionado: {
    opacity: 0.8,
  },
  franja: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  sombraArriba: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "22%",
  },
  sombraAbajo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "62%",
  },

  // Arriba
  arriba: {
    position: "absolute",
    top: 0,
    left: PADDING,
    right: PADDING,
    gap: SPACING * 1.4,
  },
  barras: {
    flexDirection: "row",
    gap: 4,
  },
  barra: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  barraLlena: {
    height: 3,
    backgroundColor: "#FFFFFF",
  },
  marcaFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  marca: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  marcaIcono: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },
  marcaTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    letterSpacing: 2,
    color: "#FFFFFF",
  },
  saltar: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  saltarTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
  },

  // Texto
  texto: {
    position: "absolute",
    left: PADDING,
    right: PADDING,
    bottom: 0,
    gap: SPACING * 2,
  },
  textoInterno: {
    gap: SPACING * 1.2,
  },
  etiquetaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  etiquetaLinea: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: PRIMARY,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 2.4,
    color: PRIMARY,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 42,
    lineHeight: 48,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  descripcion: {
    fontSize: 16,
    lineHeight: 25,
    color: "#CFCFCF",
  },
  pistaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pista: {
    fontSize: 12,
    color: "#8A8A8A",
  },
  boton: {
    flexDirection: "row",
    gap: 8,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
});

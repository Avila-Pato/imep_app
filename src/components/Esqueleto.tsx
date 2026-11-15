import { BORDER } from "@/constants/constans";
import { useEffect } from "react";
import { DimensionValue, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Mientras llega algo de internet: la forma de lo que viene, latiendo suave
// (en vez de una ruedita). Sin animacion si la persona la desactivo
export function Esqueleto({
  ancho = "100%",
  alto = 14,
  radio = 7,
  style,
}: {
  ancho?: DimensionValue;
  alto?: number;
  radio?: number;
  style?: ViewStyle;
}) {
  const quieto = useReducedMotion();
  const opacidad = useSharedValue(1);
  useEffect(() => {
    if (quieto) return;
    opacidad.set(
      withRepeat(
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
    );
  }, [opacidad, quieto]);
  const animado = useAnimatedStyle(() => ({ opacity: opacidad.get() }));

  return (
    <Animated.View
      style={[
        styles.bloque,
        { width: ancho, height: alto, borderRadius: radio },
        animado,
        style,
      ]}
    />
  );
}

// Varias lineas de texto (la ultima mas corta, como un parrafo)
export function EsqueletoTexto({
  lineas = 4,
  alto = 14,
  separacion = 12,
  centrado,
}: {
  lineas?: number;
  alto?: number;
  separacion?: number;
  centrado?: boolean; // un versiculo al centro (Para ti)
}) {
  // anchos fijos (no al azar: no cambian en cada render)
  const anchos: DimensionValue[] = ["100%", "94%", "97%", "88%", "92%", "96%"];
  return (
    <View
      style={[{ gap: separacion }, centrado && styles.centrado]}
      accessibilityLabel="Cargando"
      accessibilityRole="progressbar"
    >
      {Array.from({ length: lineas }, (_, i) => (
        <Esqueleto
          key={i}
          alto={alto}
          ancho={
            i === lineas - 1
              ? centrado
                ? "45%"
                : "60%"
              : centrado
                ? anchos[(i + 1) % anchos.length]
                : anchos[i % anchos.length]
          }
        />
      ))}
    </View>
  );
}

// Un versiculo a pantalla completa (Para ti, elegir versiculo): lineas al
// centro y la cita abajo
export function EsqueletoVersiculo() {
  return (
    <View style={styles.versiculo}>
      <EsqueletoTexto lineas={5} alto={20} separacion={16} centrado />
      <Esqueleto ancho="32%" alto={11} style={styles.cita} />
    </View>
  );
}

// Un capitulo: el numero grande al lado y los parrafos
export function EsqueletoCapitulo() {
  return (
    <View style={styles.capitulo}>
      <View style={styles.inicio}>
        <Esqueleto ancho={44} alto={52} radio={10} />
        <View style={styles.flex}>
          <EsqueletoTexto lineas={3} alto={15} />
        </View>
      </View>
      <EsqueletoTexto lineas={6} alto={15} />
      <EsqueletoTexto lineas={5} alto={15} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  versiculo: {
    width: "84%",
    alignItems: "center",
  },
  cita: {
    marginTop: 28,
  },
  capitulo: {
    gap: 22,
    paddingVertical: 8,
  },
  inicio: {
    flexDirection: "row",
    gap: 14,
  },
  bloque: {
    backgroundColor: BORDER,
  },
  centrado: {
    alignSelf: "stretch", // si no, dentro de algo centrado el % no tiene base
    alignItems: "center",
  },
});

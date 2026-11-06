import {
  BORDER,
  FUENTE,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Props<T extends string> = {
  opciones: { id: T; label: string }[];
  activo: T;
  onCambiar: (id: T) => void;
};

type Medida = { x: number; ancho: number };

const SUAVE = { duration: 260, easing: Easing.out(Easing.cubic) };

// Tabs de texto con linea roja bajo el activo (para cambiar de vista en una pantalla).
// La linea se desliza de un tab al otro.
export default function TabsSuperiores<T extends string>({
  opciones,
  activo,
  onCambiar,
}: Props<T>) {
  // posicion y ancho de cada tab (se miden al dibujarse)
  const [medidas, setMedidas] = useState<Partial<Record<T, Medida>>>({});
  const x = useSharedValue(0);
  const ancho = useSharedValue(0);
  const visible = useSharedValue(0);

  useEffect(() => {
    const m = medidas[activo];
    if (!m) return;
    // la primera vez se ubica sin animar; despues se desliza
    const primera = visible.get() === 0;
    x.set(primera ? m.x : withTiming(m.x, SUAVE));
    ancho.set(primera ? m.ancho : withTiming(m.ancho, SUAVE));
    visible.set(1);
  }, [activo, medidas, x, ancho, visible]);

  const lineaStyle = useAnimatedStyle(() => ({
    opacity: visible.get(),
    width: ancho.get(),
    transform: [{ translateX: x.get() }],
  }));

  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {opciones.map((o) => {
        const esActivo = o.id === activo;
        return (
          <Pressable
            key={o.id}
            onPress={() => onCambiar(o.id)}
            onLayout={(e) => {
              const { x: px, width } = e.nativeEvent.layout;
              setMedidas((prev) => ({
                ...prev,
                [o.id]: { x: px, ancho: width },
              }));
            }}
            // area de toque mas grande que el texto
            hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: esActivo }}
          >
            <Text style={[styles.texto, esActivo && styles.textoActivo]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
      <Animated.View pointerEvents="none" style={[styles.linea, lineaStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: SPACING * 2.6,
    paddingHorizontal: PADDING,
    paddingTop: SPACING / 2,
    marginBottom: SPACING / 2,
    // linea fina de base: los tabs se leen como un grupo
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  tab: {
    paddingTop: 6,
    paddingBottom: 2, // lugar para la linea roja
  },
  texto: {
    fontFamily: FUENTE.medium,
    fontSize: 14,
    color: MUTED,
    paddingBottom: 10,
  },
  textoActivo: {
    fontFamily: FUENTE.semibold,
    color: TEXT,
  },
  // linea roja que se desliza (queda sobre la linea de base)
  linea: {
    position: "absolute",
    left: 0,
    bottom: -StyleSheet.hairlineWidth,
    height: 2,
    borderRadius: 1,
    backgroundColor: PRIMARY,
  },
});

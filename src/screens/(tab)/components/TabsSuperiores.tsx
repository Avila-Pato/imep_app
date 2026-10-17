import {
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props<T extends string> = {
  opciones: { id: T; label: string }[];
  activo: T;
  onCambiar: (id: T) => void;
};

// Tabs de texto con linea roja bajo el activo (para cambiar de vista en una pantalla)
export default function TabsSuperiores<T extends string>({
  opciones,
  activo,
  onCambiar,
}: Props<T>) {
  return (
    <View style={styles.tabs}>
      {opciones.map((o) => {
        const esActivo = o.id === activo;
        return (
          <Pressable
            key={o.id}
            onPress={() => onCambiar(o.id)}
            hitSlop={8}
            accessibilityRole="tab"
            accessibilityState={{ selected: esActivo }}
          >
            <Text style={[styles.texto, esActivo && styles.textoActivo]}>
              {o.label}
            </Text>
            <View style={[styles.linea, esActivo && styles.lineaActiva]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: SPACING * 2.4,
    paddingHorizontal: PADDING,
    paddingTop: SPACING / 2,
    paddingBottom: SPACING / 2,
  },
  texto: {
    fontSize: 14,
    fontWeight: "500",
    color: MUTED,
    paddingBottom: 8,
  },
  textoActivo: {
    color: TEXT,
  },
  linea: {
    height: 2,
    borderRadius: 1,
  },
  lineaActiva: {
    backgroundColor: PRIMARY,
  },
});

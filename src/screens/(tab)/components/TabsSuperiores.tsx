import {
  BORDER,
  FUENTE,
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
    <View style={styles.tabs} accessibilityRole="tablist">
      {opciones.map((o) => {
        const esActivo = o.id === activo;
        return (
          <Pressable
            key={o.id}
            onPress={() => onCambiar(o.id)}
            // area de toque mas grande que el texto
            hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
            style={styles.tab}
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
  linea: {
    height: 2,
    marginBottom: -StyleSheet.hairlineWidth, // queda sobre la linea de base
    borderRadius: 1,
  },
  lineaActiva: {
    backgroundColor: PRIMARY,
  },
});

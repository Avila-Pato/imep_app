import {
  BORDER,
  HOME_PADDING as PADDING,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

// "Viernes, 6 nov"
const FECHA_HOY = (() => {
  const t = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  return t.charAt(0).toUpperCase() + t.slice(1).replace(".", "");
})();

// Arriba de Anuncios (la primera pestaña): fecha y campana
export default function CabeceraHoy() {
  return (
    <View style={styles.contenedor}>
      <View style={styles.fila}>
        <View style={styles.fecha}>
          <Octicons name="calendar" size={13} color={PRIMARY} />
          <Text style={styles.fechaTexto}>{FECHA_HOY}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/notificaciones" as Href)}
          style={({ pressed }) => [
            styles.campana,
            pressed && styles.presionado,
          ]}
          hitSlop={8}
          accessibilityLabel="Notificaciones"
        >
          <Octicons name="bell" size={18} color={TEXT} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING * 1.2,
    paddingHorizontal: PADDING,
    paddingTop: SPACING / 2,
    paddingBottom: SPACING,
  },
  presionado: {
    opacity: 0.7,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fecha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: SPACING * 1.2,
    height: 34,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  fechaTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
  campana: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  badge: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
    borderWidth: 1.5,
    borderColor: SURFACE,
  },
});

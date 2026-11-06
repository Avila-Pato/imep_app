import { DARK_BG, FUENTE, SURFACE, TEXT } from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Pastilla "📖 Génesis 3 ⌄": abre el selector de libro y capitulo
export default function BotonLibro({
  titulo,
  onPress,
}: {
  titulo: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.pastilla, pressed && styles.presionado]}
      accessibilityLabel={`${titulo}. Cambiar libro o capítulo`}
    >
      <Octicons name="book" size={14} color={TEXT} />
      <Text style={styles.titulo}>{titulo}</Text>
      <View style={styles.flecha}>
        <Octicons name="chevron-down" size={12} color={DARK_BG} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pastilla: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  presionado: {
    opacity: 0.6,
  },
  titulo: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 18,
    color: TEXT,
  },
  flecha: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
});

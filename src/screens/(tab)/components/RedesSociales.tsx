import {
  BORDER,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { RedSocial } from "@/types/typesHome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

// Los links https abren la app de cada red si esta instalada
export default function RedesSociales({ redes }: { redes: RedSocial[] }) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>Síguenos</Text>
        <Text style={styles.subtitulo}>Mantente al día con la iglesia</Text>
      </View>

      <View style={styles.redes}>
        {redes.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => Linking.openURL(r.url)}
            style={({ pressed }) => [styles.red, pressed && styles.presionado]}
            accessibilityLabel={`Abrir ${r.nombre}`}
          >
            <View style={styles.icono}>
              <FontAwesome6 name={r.icono} brand size={20} color={TEXT} />
            </View>
            <Text style={styles.nombre}>{r.nombre}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING * 1.4,
  },
  cabecera: {
    gap: 2,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 22,
    color: TEXT,
  },
  subtitulo: {
    fontSize: 13,
    color: MUTED,
  },
  redes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  red: {
    alignItems: "center",
    gap: 8,
  },
  presionado: {
    opacity: 0.6,
  },
  icono: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  nombre: {
    fontSize: 12,
    color: MUTED,
  },
});

import {
  BORDER,
  GRUPOS,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { StyleSheet, Text, View } from "react-native";

// Grupos de la iglesia (la iglesia general es de todos)
const OPCIONES = GRUPOS.filter((g) => g.id !== "general");

// Bloqueado: el grupo se define en el onboarding (registro), no aqui
export default function ElegirGrupoView() {
  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Text style={styles.meta}>MI GRUPO</Text>
        <Text style={styles.titulo}>
          Aún sin <Text style={styles.cursiva}>grupo</Text>
        </Text>
        <Text style={styles.sub}>
          Cada grupo estudia su propio pasaje cada semana. Tu grupo se definirá
          cuando completes tu registro.
        </Text>
      </View>

      <View style={styles.card}>
        {OPCIONES.map((g, i) => (
          <View
            key={g.id}
            style={[styles.fila, i > 0 && styles.conLinea]}
            accessibilityState={{ disabled: true }}
          >
            <View style={styles.icono}>
              <Octicons name={g.icono} size={16} color={MUTED} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.filaTitulo}>{g.label}</Text>
              <Text style={styles.filaSub}>{g.descripcion}</Text>
            </View>
            <Octicons name="lock" size={14} color={MUTED} />
          </View>
        ))}
      </View>

      <View style={styles.aviso}>
        <Octicons name="lock" size={14} color={MUTED} />
        <Text style={styles.avisoTexto}>
          Bloqueado hasta definir tu grupo en el registro
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING * 2,
    paddingTop: SPACING,
  },
  flex: {
    flex: 1,
  },
  cabecera: {
    gap: 6,
  },
  meta: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 30,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
  },
  card: {
    paddingHorizontal: SPACING * 1.6,
    paddingVertical: SPACING / 2,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
  },
  icono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  // las opciones se ven apagadas (bloqueadas)
  filaTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: MUTED,
  },
  filaSub: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: SPACING * 1.4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  avisoTexto: {
    fontSize: 13,
    color: MUTED,
  },
});

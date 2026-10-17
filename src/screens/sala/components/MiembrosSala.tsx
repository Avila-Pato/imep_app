import { MIEMBROS } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  HOME_PADDING as PADDING,
  MUTED,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { GrupoId, Miembro } from "@/types/typesComunidad";
import { iniciales } from "@/utils/texto";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// Miembros de la sala; el usuario actual siempre aparece (como "Tú")
export function miembrosDe(grupo: GrupoId): Miembro[] {
  const lista = MIEMBROS[grupo] ?? [];
  return lista.some((m) => m.nombre === USUARIO.nombre)
    ? lista
    : [...lista, { nombre: USUARIO.nombre }];
}

export default function MiembrosSala({ grupo }: { grupo: GrupoId }) {
  const miembros = miembrosDe(grupo);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>{miembros.length} MIEMBROS</Text>
      {miembros.map((m, i) => {
        const yo = m.nombre === USUARIO.nombre;
        return (
          <View key={m.nombre} style={[styles.fila, i > 0 && styles.conLinea]}>
            <View style={[styles.avatar, yo && styles.avatarYo]}>
              <Text style={styles.avatarTexto}>{iniciales(m.nombre)}</Text>
            </View>
            <Text style={styles.nombre}>
              {m.nombre}
              {yo && <Text style={styles.tu}> · Tú</Text>}
            </Text>
            {m.rol && <Text style={styles.rol}>{m.rol}</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
    paddingBottom: SPACING * 4,
  },
  titulo: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING / 2,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  avatarYo: {
    borderWidth: 1,
    borderColor: TEXT,
  },
  avatarTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
  },
  nombre: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  tu: {
    color: MUTED,
  },
  rol: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: MUTED,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
});

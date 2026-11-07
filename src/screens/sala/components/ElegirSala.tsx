import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { useEsPastor, useEstudios, useGrupos } from "@/store/estudios";
import { Grupo } from "@/types/typesComunidad";
import { puedeVerSala } from "@/utils/peticiones";
import Octicons from "@expo/vector-icons/Octicons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

// Hoja corta para elegir a que chat mandar algo (ej: un versiculo de la Biblia)
export default function ElegirSala({
  titulo,
  onElegir,
  onCerrar,
}: {
  titulo: string; // ej: "Juan 3:16"
  onElegir: (sala: Grupo) => void;
  onCerrar: () => void;
}) {
  const { grupo: miGrupo } = useEstudios();
  const esPastor = useEsPastor();
  // las salas donde puede escribir (con el chat abierto)
  const salas = useGrupos().filter(
    (g) =>
      (esPastor || puedeVerSala(g.id, miGrupo)) && g.funciones?.chat !== false,
  );

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
    >
      <ConBordes>
        {(insets) => (
          <>
            <Pressable style={styles.fondo} onPress={onCerrar} />
            <View
              style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}
            >
              <View style={styles.asa} />
              <Text style={styles.titulo}>Compartir en el chat</Text>
              <Text style={styles.sub}>
                {titulo} · elige la sala donde quieres compartirlo
              </Text>
              <View style={styles.lista}>
                {salas.map((g, i) => (
                  <Pressable
                    key={g.id}
                    onPress={() => onElegir(g)}
                    style={({ pressed }) => [
                      styles.fila,
                      i > 0 && styles.linea,
                      pressed && styles.presionado,
                    ]}
                  >
                    <View
                      style={[
                        styles.icono,
                        { backgroundColor: g.tono ?? TEXT },
                      ]}
                    >
                      <Octicons name={g.icono} size={14} color={DARK_BG} />
                    </View>
                    <Text style={styles.nombre}>
                      {g.id === "general" ? "Mi iglesia" : g.label}
                    </Text>
                    <Octicons name="chevron-right" size={16} color={MUTED} />
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </ConBordes>
    </Modal>
  );
}

const styles = StyleSheet.create({
  presionado: {
    opacity: 0.6,
  },
  fondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  hoja: {
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    gap: SPACING,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: "#3A3A3A",
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4A4A4A",
  },
  titulo: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 22,
    color: TEXT,
  },
  sub: {
    fontSize: 13,
    color: MUTED,
  },
  lista: {
    borderRadius: 16,
    backgroundColor: DARK_BG,
    paddingHorizontal: SPACING * 1.2,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
  },
  linea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  icono: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  nombre: {
    flex: 1,
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
});

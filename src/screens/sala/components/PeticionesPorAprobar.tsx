import { PUBLICACIONES } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { revisarPeticion, useEstudios } from "@/store/estudios";
import { GrupoId } from "@/types/typesComunidad";
import { esLider, estadoPeticion } from "@/utils/peticiones";
import { haceCuanto } from "@/utils/tiempo";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Barra arriba de la sala: solo la ve el lider cuando hay peticiones pendientes
export default function PeticionesPorAprobar({ grupo }: { grupo: GrupoId }) {
  const { publicaciones, revisiones } = useEstudios();
  const [abierto, setAbierto] = useState(false);
  const insets = useSafeAreaInsets();

  const pendientes = [...publicaciones, ...PUBLICACIONES]
    .filter(
      (p) =>
        (p.grupo ?? "general") === grupo &&
        estadoPeticion(p, revisiones) === "pendiente",
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha)); // la mas antigua primero

  if (!esLider(USUARIO.nombre, grupo) || pendientes.length === 0) return null;

  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        style={({ pressed }) => [styles.barra, pressed && styles.presionado]}
        accessibilityRole="button"
      >
        <View style={styles.punto} />
        <Text style={styles.barraTexto}>
          {pendientes.length === 1
            ? "1 petición espera tu aprobación"
            : `${pendientes.length} peticiones esperan tu aprobación`}
        </Text>
        <Text style={styles.revisar}>Revisar</Text>
        <Octicons name="chevron-right" size={14} color={MUTED} />
      </Pressable>

      <Modal
        visible={abierto}
        transparent
        animationType="slide"
        onRequestClose={() => setAbierto(false)}
        statusBarTranslucent
      >
        <View style={styles.fondo}>
          <Pressable
            style={styles.cerrarFondo}
            onPress={() => setAbierto(false)}
          />
          <View
            style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}
          >
            <View style={styles.asa} />
            <View style={styles.cabecera}>
              <View style={styles.flex}>
                <Text style={styles.meta}>
                  POR APROBAR · {pendientes.length}
                </Text>
                <Text style={styles.titulo}>
                  Peticiones de <Text style={styles.cursiva}>oración</Text>
                </Text>
              </View>
              <Pressable
                onPress={() => setAbierto(false)}
                hitSlop={10}
                style={styles.cerrar}
                accessibilityLabel="Cerrar"
              >
                <Octicons name="x" size={16} color={TEXT} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.lista}
              showsVerticalScrollIndicator={false}
            >
              {pendientes.map((p) => (
                <View key={p.id} style={styles.pendiente}>
                  <Text style={styles.pendienteMeta}>
                    {p.autor} · {haceCuanto(p.fecha)}
                  </Text>
                  <Text style={styles.pendienteTexto}>{p.texto}</Text>
                  <View style={styles.acciones}>
                    <Pressable
                      onPress={() => revisarPeticion(p.id, "rechazada")}
                      style={({ pressed }) => [
                        styles.accion,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Text style={styles.accionTexto}>Rechazar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => revisarPeticion(p.id, "aprobada")}
                      style={({ pressed }) => [
                        styles.accion,
                        styles.accionPrincipal,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Text
                        style={[
                          styles.accionTexto,
                          styles.accionTextoPrincipal,
                        ]}
                      >
                        Aprobar
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.nota}>
              Al aprobarla se publica en el muro de oración por 24 horas.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.6,
  },

  // Barra
  barra: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    marginHorizontal: PADDING,
    marginBottom: SPACING,
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: SPACING * 1.1,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  barraTexto: {
    flex: 1,
    fontSize: 13,
    color: TEXT,
  },
  revisar: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },

  // Hoja
  fondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  cerrarFondo: {
    flex: 1,
  },
  hoja: {
    maxHeight: "85%",
    paddingHorizontal: PADDING,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    marginTop: SPACING,
    marginBottom: SPACING * 1.4,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING,
    marginBottom: SPACING * 1.6,
  },
  meta: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 26,
    color: TEXT,
    marginTop: 4,
  },
  cursiva: {
    fontStyle: "italic",
  },
  cerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  lista: {
    gap: SPACING,
    paddingBottom: SPACING,
  },
  pendiente: {
    gap: SPACING,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  pendienteMeta: {
    fontSize: 12,
    color: MUTED,
  },
  pendienteTexto: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
  },
  acciones: {
    flexDirection: "row",
    gap: SPACING,
  },
  accion: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  accionPrincipal: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  accionTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: MUTED,
  },
  accionTextoPrincipal: {
    fontWeight: "600",
    color: DARK_BG,
  },
  nota: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    paddingTop: SPACING,
  },
});

import ConBordes from "@/components/ConBordes";
import IconoSala from "@/components/IconoSala";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  LINEA,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { elegirIglesia, useSalasDeTodas } from "@/store/estudios";
import { GrupoId } from "@/types/typesComunidad";
import { Iglesia } from "@/types/typesHome";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

// "Mis ministerios" del pastor: cada iglesia suya con todas sus salas.
// Tocar una sala la abre (si es de otra iglesia, primero cambia a esa)
export default function HojaMinisterios({
  onCerrar,
}: {
  onCerrar: () => void;
}) {
  const todas = useSalasDeTodas();

  const abrir = (iglesia: Iglesia, activa: boolean, sala: GrupoId) => {
    if (!activa) elegirIglesia(iglesia);
    onCerrar();
    router.push(`/sala/${sala}` as Href);
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <ConBordes>
        {(insets) => (
          <View style={styles.fondo}>
            <Pressable style={styles.flex} onPress={onCerrar} />
            <View
              style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}
            >
              <View style={styles.asa} />
              <View style={styles.cabecera}>
                <View style={styles.flex}>
                  <Text style={styles.titulo}>Mis ministerios</Text>
                  <Text style={styles.sub}>
                    {todas.length === 1
                      ? "Tu iglesia y sus salas"
                      : `Tus ${todas.length} iglesias y sus salas`}
                  </Text>
                </View>
                <Pressable
                  onPress={onCerrar}
                  hitSlop={10}
                  accessibilityLabel="Cerrar"
                >
                  <Octicons name="x" size={18} color={MUTED} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.lista}
                showsVerticalScrollIndicator={false}
              >
                {todas.map(({ iglesia, activa, salas }) => (
                  <View key={iglesia.id ?? iglesia.sede} style={styles.bloque}>
                    <View style={styles.iglesiaFila}>
                      <Text style={styles.iglesia} numberOfLines={1}>
                        {iglesia.sede}
                      </Text>
                      {activa && todas.length > 1 && (
                        <Text style={styles.activa}>Abierta ahora</Text>
                      )}
                    </View>
                    {salas.map((sala, i) => (
                      <Pressable
                        key={sala.id}
                        onPress={() => abrir(iglesia, activa, sala.id)}
                        style={({ pressed }) => [
                          styles.sala,
                          i > 0 && styles.conLinea,
                          pressed && styles.presionado,
                        ]}
                        accessibilityLabel={`Abrir la sala ${sala.label} de ${iglesia.sede}`}
                      >
                        <IconoSala sala={sala} tamano={36} />
                        <View style={styles.flex}>
                          <Text style={styles.salaNombre} numberOfLines={1}>
                            {sala.id === "general"
                              ? "Toda la iglesia"
                              : sala.label}
                          </Text>
                          <Text style={styles.salaDetalle} numberOfLines={1}>
                            {sala.id === "general"
                              ? "La sala de todos"
                              : sala.lider
                                ? `Líder: ${sala.lider}`
                                : "Sin líder aún"}
                          </Text>
                        </View>
                        <Octicons name="chevron-right" size={16} color={MUTED} />
                      </Pressable>
                    ))}
                    {salas.length === 1 && (
                      <Text style={styles.vacio}>
                        Aún no hay salas de grupo. Créalas desde Comunidad.
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </ConBordes>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  fondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  hoja: {
    gap: SPACING,
    maxHeight: "85%",
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: LINEA,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  titulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 18,
    color: TEXT,
  },
  sub: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  lista: {
    flexGrow: 0,
  },
  bloque: {
    marginBottom: SPACING * 1.5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: DARK_BG,
    overflow: "hidden",
  },
  iglesiaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: SPACING * 1.5,
    paddingTop: SPACING * 1.25,
    paddingBottom: SPACING / 2,
  },
  iglesia: {
    flex: 1,
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: MUTED,
    textTransform: "uppercase",
  },
  activa: {
    fontFamily: FUENTE.medium,
    fontSize: 11,
    color: MUTED,
  },
  sala: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SPACING * 1.5,
    paddingVertical: 10,
  },
  conLinea: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  presionado: {
    opacity: 0.6,
  },
  salaNombre: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  salaDetalle: {
    fontFamily: FUENTE.regular,
    fontSize: 12,
    color: MUTED,
  },
  vacio: {
    fontFamily: FUENTE.regular,
    fontSize: 12,
    color: MUTED,
    paddingHorizontal: SPACING * 1.5,
    paddingBottom: SPACING,
  },
});

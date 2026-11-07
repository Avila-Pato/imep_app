import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  HOME_PADDING as PADDING,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { borrarVersiculo, useEstudios } from "@/store/estudios";
import { confirmar } from "@/utils/confirmar";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Versiculos guardados y oraciones escritas con ellos (desde el Perfil).
// Lista virtual: aunque sean muchos, solo se dibujan los que se ven
export default function GuardadosScreen() {
  const { versiculos } = useEstudios();
  const lista = [...versiculos].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.cabecera}>
        <Pressable
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/perfil" as Href)
          }
          hitSlop={10}
          accessibilityLabel="Volver"
        >
          <Octicons name="arrow-left" size={20} color={TEXT} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.titulo}>Versículos y oraciones</Text>
          <Text style={styles.sub}>
            {lista.length} {lista.length === 1 ? "guardado" : "guardados"}
          </Text>
        </View>
      </View>

      <FlatList
        data={lista}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Octicons name="bookmark" size={22} color={MUTED} />
            <Text style={styles.vacioTexto}>
              Toca «Guardar» u «Orar» en un versículo de la Biblia y aparecerá
              aquí.
            </Text>
          </View>
        }
        renderItem={({ item: v }) => {
          const [libro, capitulo] = v.id.split("-");
          return (
            <Pressable
              onPress={() =>
                router.push(
                  `/versiculos?libro=${libro}&capitulo=${capitulo}` as Href,
                )
              }
              style={({ pressed }) => [
                styles.tarjeta,
                pressed && styles.presionado,
              ]}
            >
              <View style={styles.fila}>
                <View style={styles.citaFila}>
                  <Octicons
                    name={v.oracion ? "flame" : "bookmark-filled"}
                    size={12}
                    color={PRIMARY}
                  />
                  <Text style={styles.cita}>{v.cita}</Text>
                </View>
                <Pressable
                  onPress={() =>
                    confirmar(
                      "Quitar de guardados",
                      `${v.cita} dejará de estar en tu Perfil.`,
                      "Quitar",
                      () => borrarVersiculo(v.id),
                    )
                  }
                  hitSlop={10}
                  accessibilityLabel="Quitar de guardados"
                >
                  <Octicons name="trash" size={14} color={MUTED} />
                </Pressable>
              </View>
              <Text style={styles.texto}>«{v.texto}»</Text>
              {!!v.oracion && (
                <View style={styles.oracion}>
                  <Text style={styles.oracionEtiqueta}>MI ORACIÓN</Text>
                  <Text style={styles.oracionTexto}>{v.oracion}</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.4,
    paddingHorizontal: PADDING,
    paddingVertical: SPACING,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  titulo: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
  },
  sub: {
    fontSize: 12,
    color: MUTED,
  },
  lista: {
    padding: PADDING,
    gap: SPACING,
  },
  tarjeta: {
    gap: SPACING * 0.8,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  citaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cita: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: MUTED,
  },
  texto: {
    fontFamily: SERIF,
    fontSize: 16,
    lineHeight: 24,
    color: TEXT,
  },
  oracion: {
    gap: 4,
    paddingTop: SPACING,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  oracionEtiqueta: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: PRIMARY,
  },
  oracionTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
  },
  vacio: {
    alignItems: "center",
    gap: SPACING,
    paddingVertical: SPACING * 4,
    paddingHorizontal: SPACING * 2,
  },
  vacioTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    textAlign: "center",
  },
});

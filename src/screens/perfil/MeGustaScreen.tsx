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
import { alternarMeGusta, useEstudios } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Todos los versiculos con "me gusta" (desde el Perfil). Lista virtual:
// aunque sean miles, solo se dibujan los que se ven
export default function MeGustaScreen() {
  const { meGusta, meGustaTextos } = useEstudios();
  const gustados = meGusta
    .map((clave) => ({ clave, ...meGustaTextos[clave] }))
    .filter((g) => !!g.texto)
    .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));

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
          <Text style={styles.titulo}>Mis me gusta</Text>
          <Text style={styles.sub}>
            {gustados.length}{" "}
            {gustados.length === 1 ? "versículo" : "versículos"}
          </Text>
        </View>
      </View>

      <FlatList
        data={gustados}
        keyExtractor={(g) => g.clave}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Octicons name="heart" size={22} color={MUTED} />
            <Text style={styles.vacioTexto}>
              Da doble toque a un versículo en «Versículo por versículo» y
              aparecerá aquí.
            </Text>
          </View>
        }
        renderItem={({ item: g }) => {
          const [libro, capitulo] = g.clave.split("-");
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
                <Text style={styles.cita}>{g.cita}</Text>
                {/* quitar el me gusta */}
                <Pressable
                  onPress={() =>
                    alternarMeGusta(g.clave, { cita: g.cita, texto: g.texto })
                  }
                  hitSlop={10}
                  accessibilityLabel="Quitar me gusta"
                >
                  <Octicons name="heart-fill" size={16} color={PRIMARY} />
                </Pressable>
              </View>
              <Text style={styles.texto}>«{g.texto}»</Text>
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

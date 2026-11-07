import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  SPACING,
  TEXT,
} from "@/constants/constans";
import AnunciosView from "@/screens/(tab)/components/AnunciosView";
import CronogramaView from "@/screens/(tab)/components/CronogramaView";
import IglesiaView from "@/screens/(tab)/components/IglesiaView";
import { useEsPastor, usePuede } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, Redirect, router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tipo = "cronograma" | "anuncios" | "salas";

const TITULOS: Record<Tipo, string> = {
  cronograma: "Cronograma",
  anuncios: "Anuncios",
  salas: "Salas",
};

// Desde el panel del Perfil: se administra aqui mismo, encima del perfil,
// sin saltar a otra pestaña (al volver queda en el Perfil)
export default function GestionScreen() {
  const { tipo } = useLocalSearchParams<{ tipo: Tipo }>();
  const esPastor = useEsPastor();
  const puedeCronograma = usePuede("cronograma");
  const puedeAnuncios = usePuede("anuncios");

  const permitido =
    tipo === "cronograma"
      ? puedeCronograma
      : tipo === "anuncios"
        ? puedeAnuncios
        : tipo === "salas" && esPastor;
  if (!permitido) return <Redirect href={"/perfil" as Href} />;

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
          accessibilityLabel="Volver al perfil"
        >
          <Octicons name="arrow-left" size={20} color={TEXT} />
        </Pressable>
        <Text style={styles.titulo}>{TITULOS[tipo]}</Text>
      </View>

      {tipo === "cronograma" ? (
        <View style={styles.flex}>
          <CronogramaView />
        </View>
      ) : tipo === "anuncios" ? (
        <AnunciosView />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <IglesiaView />
        </ScrollView>
      )}
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
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
    paddingBottom: SPACING * 4,
  },
});

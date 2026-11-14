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
import {
  elegirIglesia,
  esActiva,
  useEsPastor,
  useIglesia,
  useIglesias,
  usePuede,
} from "@/store/estudios";
import { Iglesia } from "@/types/typesHome";
import { useState } from "react";
import CronogramaTodas from "./CronogramaTodas";
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
  // pastor con varias iglesias: "Todas" (resumen) o una para editar
  const iglesias = useIglesias().filter((i) => !!i.id);
  const activa = useIglesia();
  const varias = esPastor && iglesias.length > 1;
  const [todas, setTodas] = useState(varias);
  const abrir = (i: Iglesia) => {
    if (!esActiva(i, activa)) elegirIglesia(i);
    setTodas(false);
  };

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
          {/* de que iglesia: Todas o una (solo con varias) */}
          {varias && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsCaja}
              contentContainerStyle={styles.chips}
            >
              <Chip
                texto="Todas"
                activo={todas}
                onPress={() => setTodas(true)}
              />
              {iglesias.map((i) => (
                <Chip
                  key={i.id}
                  texto={i.sede}
                  activo={!todas && esActiva(i, activa)}
                  onPress={() => abrir(i)}
                />
              ))}
            </ScrollView>
          )}
          {varias && todas ? (
            <CronogramaTodas onAbrir={abrir} />
          ) : (
            <CronogramaView />
          )}
        </View>
      ) : tipo === "anuncios" ? (
        <AnunciosView />
      ) : (
        <View style={styles.flex}>
          {/* con varias iglesias: de cual son las salas */}
          {varias && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsCaja}
              contentContainerStyle={styles.chips}
            >
              {iglesias.map((i) => (
                <Chip
                  key={i.id}
                  texto={i.sede}
                  activo={esActiva(i, activa)}
                  onPress={() => abrir(i)}
                />
              ))}
            </ScrollView>
          )}
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <IglesiaView />
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

function Chip({
  texto,
  activo,
  onPress,
}: {
  texto: string;
  activo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, activo && styles.chipActivo]}
      accessibilityState={{ selected: activo }}
    >
      <Text
        style={[styles.chipTexto, activo && styles.chipTextoActivo]}
        numberOfLines={1}
      >
        {texto}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipsCaja: {
    flexGrow: 0,
  },
  chips: {
    gap: 6,
    paddingHorizontal: PADDING,
    paddingVertical: SPACING,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
  chipTextoActivo: {
    color: DARK_BG,
  },
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

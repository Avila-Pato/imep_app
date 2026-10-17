import { ANUNCIOS } from "@/assets/data/anunciosMocks";
import {
  BORDER,
  CATEGORIAS,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SPACING,
} from "@/constants/constans";
import { CategoriaId } from "@/types/typesAnuncios";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnuncioCard from "./components/AnuncioCard";
import CronogramaView from "./components/CronogramaView";
import TabsSuperiores from "./components/TabsSuperiores";

type Filtro = "todos" | CategoriaId;
type Vista = "anuncios" | "cronograma";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "anuncios", label: "Anuncios" },
  { id: "cronograma", label: "Cronograma" },
];

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  ...(Object.keys(CATEGORIAS) as CategoriaId[]).map((id) => ({
    id,
    label: CATEGORIAS[id].label,
  })),
];

// Destacados primero; el resto por fecha
const ORDENADOS = [...ANUNCIOS].sort(
  (a, b) =>
    Number(!!b.destacado) - Number(!!a.destacado) ||
    a.fecha.localeCompare(b.fecha),
);

export default function EventosScreen() {
  const [vista, setVista] = useState<Vista>("anuncios");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const visibles =
    filtro === "todos"
      ? ORDENADOS
      : ORDENADOS.filter((a) => a.categoria === filtro);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TabsSuperiores opciones={VISTAS} activo={vista} onCambiar={setVista} />

      {vista === "cronograma" ? (
        <CronogramaView />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Filtros */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtros}
            contentContainerStyle={styles.filtrosContent}
          >
            {FILTROS.map((f) => {
              const activo = f.id === filtro;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFiltro(f.id)}
                  style={[styles.filtro, activo && styles.filtroActivo]}
                >
                  <Text
                    style={[
                      styles.filtroTexto,
                      activo && styles.filtroTextoActivo,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Anuncios: cada uno con su banner */}
          {visibles.length === 0 ? (
            <View style={styles.vacio}>
              <Octicons name="inbox" size={22} color={MUTED} />
              <Text style={styles.vacioTexto}>
                No hay anuncios en esta categoría
              </Text>
            </View>
          ) : (
            visibles.map((a) => (
              <AnuncioCard key={a.id} anuncio={a} grande={!!a.destacado} />
            ))
          )}
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
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
    paddingBottom: 120, // espacio para el tabbar flotante
    gap: SPACING * 1.6,
  },

  // Filtros
  filtros: {
    // los chips llegan hasta los bordes de la pantalla
    marginHorizontal: -PADDING,
  },
  filtrosContent: {
    paddingHorizontal: PADDING,
    gap: 8,
  },
  filtro: {
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filtroActivo: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  filtroTexto: {
    fontSize: 13,
    fontWeight: "500",
    color: MUTED,
  },
  filtroTextoActivo: {
    color: "#FFFFFF",
  },

  vacio: {
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING * 3,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  vacioTexto: {
    fontSize: 13,
    color: MUTED,
  },
});

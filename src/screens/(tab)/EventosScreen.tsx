import { ANUNCIOS } from "@/assets/data/anunciosMocks";
import {
  BORDER,
  CATEGORIAS,
  DARK_BG,
  HOME_CARD_W as CARD_W,
  HOME_PADDING as PADDING,
  MESES_CORTOS,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { Anuncio, CategoriaId } from "@/types/typesAnuncios";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Filtro = "todos" | CategoriaId;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  ...(Object.keys(CATEGORIAS) as CategoriaId[]).map((id) => ({
    id,
    label: CATEGORIAS[id].label,
  })),
];

// "2026-10-25" -> { dia: "25", mes: "OCT" }
const partesFecha = (fecha: string) => {
  const [, m, d] = fecha.split("-").map(Number);
  return { dia: String(d), mes: MESES_CORTOS[m - 1] };
};

const detalle = (a: Anuncio) =>
  [a.hora && `${a.hora} hrs`, a.lugar].filter(Boolean).join(" · ");

const DESTACADO = ANUNCIOS.find((a) => a.destacado);
const LISTA = ANUNCIOS.filter((a) => !a.destacado).sort((a, b) =>
  a.fecha.localeCompare(b.fecha),
);

export default function EventosScreen() {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const visibles =
    filtro === "todos" ? LISTA : LISTA.filter((a) => a.categoria === filtro);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.titulo}>Anuncios</Text>
          <Text style={styles.subtitulo}>Eventos y avisos de la iglesia</Text>
        </View>

        {/* Evento destacado */}
        {DESTACADO && (
          <View style={styles.destacado}>
            {DESTACADO.imagen ? (
              <Image
                source={DESTACADO.imagen}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <Octicons
                name={CATEGORIAS[DESTACADO.categoria].icon}
                size={44}
                color={MUTED}
              />
            )}

            <View style={styles.chip}>
              <Octicons name="star-fill" size={11} color={PRIMARY} />
              <Text style={styles.chipTexto}>DESTACADO</Text>
            </View>

            <View style={styles.panel}>
              <View style={styles.fechaBadge}>
                <Text style={styles.fechaDia}>
                  {partesFecha(DESTACADO.fecha).dia}
                </Text>
                <Text style={styles.fechaMes}>
                  {partesFecha(DESTACADO.fecha).mes}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.panelTitulo} numberOfLines={1}>
                  {DESTACADO.titulo}
                </Text>
                <Text style={styles.panelSub} numberOfLines={1}>
                  {detalle(DESTACADO)}
                </Text>
              </View>
            </View>
          </View>
        )}

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

        {/* Lista */}
        {visibles.length === 0 ? (
          <View style={styles.vacio}>
            <Octicons name="inbox" size={22} color={MUTED} />
            <Text style={styles.vacioTexto}>
              No hay anuncios en esta categoría
            </Text>
          </View>
        ) : (
          visibles.map((a) => {
            const { dia, mes } = partesFecha(a.fecha);
            const cat = CATEGORIAS[a.categoria];
            const sub = detalle(a);
            return (
              <View
                key={a.id}
                style={[styles.card, a.urgente && styles.cardUrgente]}
              >
                <View style={styles.cardFecha}>
                  <Text style={styles.cardDia}>{dia}</Text>
                  <Text style={styles.cardMes}>{mes}</Text>
                </View>

                <View style={styles.flex}>
                  <View style={styles.cardTags}>
                    <Octicons name={cat.icon} size={11} color={MUTED} />
                    <Text style={styles.cardCategoria}>
                      {cat.label.toUpperCase()}
                    </Text>
                    {a.urgente && <Text style={styles.urgente}>URGENTE</Text>}
                  </View>
                  <Text style={styles.cardTitulo}>{a.titulo}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {a.descripcion}
                  </Text>
                  {!!sub && <Text style={styles.cardSub}>{sub}</Text>}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  flex: {
    flex: 1,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 28,
    color: TEXT,
  },
  subtitulo: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },

  // Destacado
  destacado: {
    height: CARD_W * 0.75,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#262626", // placeholder hasta poner imagen
  },
  chip: {
    position: "absolute",
    top: SPACING * 1.4,
    left: SPACING * 1.4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING * 1.2,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  chipTexto: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: TEXT,
  },
  panel: {
    position: "absolute",
    left: SPACING * 1.2,
    right: SPACING * 1.2,
    bottom: SPACING * 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.2,
    borderRadius: 18,
    backgroundColor: "rgba(22,22,22,0.92)",
  },
  fechaBadge: {
    width: 44,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },
  fechaDia: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  fechaMes: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  panelTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
  },
  panelSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
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

  // Cards
  card: {
    flexDirection: "row",
    gap: SPACING * 1.4,
    padding: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: SURFACE,
  },
  cardUrgente: {
    borderColor: PRIMARY,
  },
  cardFecha: {
    width: 44,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  cardDia: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT,
  },
  cardMes: {
    fontSize: 10,
    fontWeight: "600",
    color: MUTED,
  },
  cardTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardCategoria: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: MUTED,
  },
  urgente: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: PRIMARY,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
    marginTop: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: MUTED,
    marginTop: 2,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: "500",
    color: TEXT,
    marginTop: 6,
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

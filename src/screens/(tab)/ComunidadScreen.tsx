import { MENSAJES } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  DARK_BG,
  GRUPOS,
  HOME_CARD_W,
  HOME_PADDING as PADDING,
  MUTED,
  SERIF,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { useEstudios } from "@/store/estudios";
import { Href, router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MuroOracion from "../sala/components/MuroOracion";
import RuedaSalas from "./components/RuedaSalas";
import TabsSuperiores from "./components/TabsSuperiores";

type Vista = "salas" | "muro";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "salas", label: "Salas" },
  { id: "muro", label: "Muro de oración" },
];

export default function ComunidadScreen() {
  const [vista, setVista] = useState<Vista>("salas");
  const { mensajes, vistos } = useEstudios();
  const todos = [...MENSAJES, ...mensajes];

  // Cada sala con sus mensajes no leidos (se muestran en la rueda)
  const salas = GRUPOS.map((g) => {
    const visto = vistos[g.id] ?? "";
    const noLeidos = todos.filter(
      (m) => m.grupo === g.id && m.autor !== USUARIO.nombre && m.fecha > visto,
    ).length;
    return { ...g, noLeidos };
  });
  // Rueda: la iglesia al centro y los grupos alrededor
  const centro = salas.find((s) => s.id === "general") ?? salas[0];
  const grupos = salas.filter((s) => s.id !== centro.id);
  const abrir = (id: string) => router.push(`/sala/${id}` as Href);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TabsSuperiores opciones={VISTAS} activo={vista} onCambiar={setVista} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          vista === "salas" && styles.contentCentrado,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Rueda de salas: somos una iglesia, unidos */}
        {vista === "salas" && (
          <View style={styles.rueda}>
            <Text style={styles.ruedaTitulo}>
              Somos <Text style={styles.cursiva}>una iglesia</Text>
            </Text>
            <Text style={styles.ruedaSub}>Toca una sala para entrar</Text>
            <RuedaSalas
              centro={centro}
              salas={grupos}
              tamano={HOME_CARD_W}
              onAbrir={abrir}
            />
          </View>
        )}

        {/* Peticiones de todas las salas */}
        {vista === "muro" && <MuroOracion />}
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

  // La rueda queda al centro de la pantalla
  contentCentrado: {
    flexGrow: 1,
    justifyContent: "center",
  },

  // Rueda
  rueda: {
    alignItems: "center",
    gap: 6,
  },
  ruedaTitulo: {
    fontFamily: SERIF,
    fontSize: 32,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  ruedaSub: {
    fontSize: 13,
    color: MUTED,
    marginBottom: SPACING * 2.4,
  },
});

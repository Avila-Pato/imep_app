import {
  BORDER,
  DARK_BG,
  GRUPOS,
  HOME_PADDING as PADDING,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { marcarVisto } from "@/store/estudios";
import { GrupoId } from "@/types/typesComunidad";
import Octicons from "@expo/vector-icons/Octicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TabsSuperiores from "../(tab)/components/TabsSuperiores";
import ChatSala from "./components/ChatSala";
import MiembrosSala, { miembrosDe } from "./components/MiembrosSala";
import MuroOracion from "./components/MuroOracion";

type Vista = "chat" | "oracion" | "miembros";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "oracion", label: "Oración" },
  { id: "miembros", label: "Miembros" },
];

export default function SalaScreen() {
  const params = useLocalSearchParams<{ id: GrupoId; vista?: Vista }>();
  const grupo = GRUPOS.find((g) => g.id === params.id) ?? GRUPOS[0];
  const [vista, setVista] = useState<Vista>(params.vista ?? "chat");

  // Al entrar y al salir, la sala queda como leida
  useEffect(() => {
    marcarVisto(grupo.id);
    return () => marcarVisto(grupo.id);
  }, [grupo.id]);

  const cantidad = miembrosDe(grupo.id).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Encabezado de la sala */}
      <View style={styles.cabecera}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityLabel="Volver"
        >
          <Octicons name="arrow-left" size={20} color={TEXT} />
        </Pressable>
        <View style={styles.icono}>
          <Octicons name={grupo.icono} size={18} color={TEXT} />
        </View>
        <Pressable style={styles.flex} onPress={() => setVista("miembros")}>
          <Text style={styles.nombre}>{grupo.label}</Text>
          <Text style={styles.sub}>
            {cantidad} miembros · {grupo.descripcion}
          </Text>
        </Pressable>
      </View>

      <TabsSuperiores opciones={VISTAS} activo={vista} onCambiar={setVista} />

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {vista === "chat" && <ChatSala grupo={grupo.id} />}
        {vista === "oracion" && (
          <ScrollView
            contentContainerStyle={styles.muro}
            showsVerticalScrollIndicator={false}
          >
            <MuroOracion grupo={grupo.id} />
          </ScrollView>
        )}
        {vista === "miembros" && <MiembrosSala grupo={grupo.id} />}
      </KeyboardAvoidingView>
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
    gap: SPACING * 1.2,
    paddingHorizontal: PADDING,
    paddingVertical: SPACING,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    marginBottom: SPACING / 2,
  },
  muro: {
    paddingHorizontal: PADDING,
    paddingBottom: SPACING * 4,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  nombre: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
  },
  sub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },
});

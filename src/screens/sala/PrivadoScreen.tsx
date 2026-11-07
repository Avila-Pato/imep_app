import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { marcarVisto } from "@/store/estudios";
import { Grupo } from "@/types/typesComunidad";
import { idPrivado } from "@/utils/privado";
import { iniciales } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ChatSala from "./components/ChatSala";

// Chat privado entre el lider (o pastor) y un hermano
export default function PrivadoScreen() {
  const { persona } = useLocalSearchParams<{ persona: string }>();
  const nombre = decodeURIComponent(persona ?? "");
  const id = idPrivado(USUARIO.nombre, nombre);
  // el teclado se mide desde arriba de la pantalla: se suma la barra de estado
  const { top } = useSafeAreaInsets();
  // se usa el mismo chat de las salas, con una "sala" de dos personas
  const sala: Grupo = {
    id,
    label: nombre.split(" ")[0] || nombre,
    descripcion: "Chat privado",
    icono: "person",
  };

  useEffect(() => {
    marcarVisto(id);
    return () => marcarVisto(id);
  }, [id]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.cabecera}>
        <Pressable
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/comunidad" as Href)
          }
          hitSlop={10}
          accessibilityLabel="Volver"
        >
          <Octicons name="arrow-left" size={20} color={TEXT} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciales(nombre)}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.nombre}>{nombre}</Text>
          <View style={styles.privado}>
            <Octicons name="lock" size={10} color={MUTED} />
            <Text style={styles.sub}>Chat privado · solo ustedes dos</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={top}
      >
        <ChatSala sala={sala} privado />
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
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  avatarTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
  },
  nombre: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
  },
  privado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  sub: {
    fontSize: 12,
    color: MUTED,
  },
});

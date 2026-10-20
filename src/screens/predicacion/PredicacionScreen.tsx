import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  SPACING,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PredicacionView from "../(tab)/components/PredicacionView";

// Pantalla de la predicacion (se abre desde la card de Inicio)
export default function PredicacionScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.cabecera}>
        <Pressable
          // si se entro directo (sin historial), vuelve a Inicio
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/" as Href)
          }
          hitSlop={10}
          accessibilityLabel="Volver"
        >
          <Octicons name="arrow-left" size={20} color={TEXT} />
        </Pressable>
        <Text style={styles.titulo}>Predicación</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PredicacionView />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
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
    paddingBottom: SPACING * 4,
  },
});

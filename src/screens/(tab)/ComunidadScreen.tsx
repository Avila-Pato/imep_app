import { useEspacioBarra } from "@/hooks/useEspacioBarra";
import {
  DARK_BG,
  HOME_PADDING as PADDING,
  SPACING,
} from "@/constants/constans";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IglesiaView from "./components/IglesiaView";

// Comunidad: solo las salas (el muro de oracion vive dentro de cada sala)
export default function ComunidadScreen() {
  // espacio para la barra flotante y los botones del telefono
  const espacio = useEspacioBarra();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: espacio }]}
        showsVerticalScrollIndicator={false}
      >
        <IglesiaView />
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
    paddingTop: SPACING * 2,
  },
});

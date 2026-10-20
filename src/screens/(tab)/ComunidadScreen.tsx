import {
  DARK_BG,
  HOME_PADDING as PADDING,
  SPACING,
} from "@/constants/constans";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MuroOracion from "../sala/components/MuroOracion";
import IglesiaView from "./components/IglesiaView";
import TabsSuperiores from "./components/TabsSuperiores";

type Vista = "muro" | "salas";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "muro", label: "Muro de oración" },
  { id: "salas", label: "Salas" },
];

// Comunidad: el muro de oracion y las salas de cada grupo
export default function ComunidadScreen() {
  const [vista, setVista] = useState<Vista>("muro");
  const scrollRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TabsSuperiores
        opciones={VISTAS}
        activo={vista}
        onCambiar={(v) => {
          setVista(v);
          scrollRef.current?.scrollTo({ y: 0, animated: false });
        }}
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {vista === "muro" ? <MuroOracion /> : <IglesiaView />}
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
  },
});

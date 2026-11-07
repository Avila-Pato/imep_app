import { DARK_BG } from "@/constants/constans";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnunciosView from "./components/AnunciosView";
import CronogramaView from "./components/CronogramaView";
import TabsSuperiores from "./components/TabsSuperiores";
import VistaAnimada from "./components/VistaAnimada";

type Vista = "anuncios" | "cronograma";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "cronograma", label: "Cronograma" },
  { id: "anuncios", label: "Anuncios" },
];

export default function EventosScreen() {
  // ?vista=anuncios: abre esa vista directamente
  const { vista: pedida } = useLocalSearchParams<{ vista?: Vista }>();
  const [vista, setVista] = useState<Vista>(pedida ?? "cronograma");
  const [ultimaPedida, setUltimaPedida] = useState(pedida);
  // si llega otro pedido con la pestaña ya abierta, se cambia de vista
  if (pedida !== ultimaPedida) {
    setUltimaPedida(pedida);
    if (pedida) setVista(pedida);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TabsSuperiores opciones={VISTAS} activo={vista} onCambiar={setVista} />

      <VistaAnimada vista={vista} style={styles.flex}>
        {vista === "cronograma" ? <CronogramaView /> : <AnunciosView />}
      </VistaAnimada>
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
});

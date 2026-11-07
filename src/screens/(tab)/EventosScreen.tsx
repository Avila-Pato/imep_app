import { DARK_BG } from "@/constants/constans";
import { IconName } from "@/types/typesCronogramas";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BlurTargetView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import AnunciosView from "./components/AnunciosView";
import AyudaAnuncios from "./components/AyudaAnuncios";
import AyudaCronograma from "./components/AyudaCronograma";
import CabeceraHoy from "./components/CabeceraHoy";
import CronogramaView from "./components/CronogramaView";
import TabsSuperiores from "./components/TabsSuperiores";
import VistaAnimada from "./components/VistaAnimada";

type Vista = "anuncios" | "cronograma";

const VISTAS: { id: Vista; label: string; icono: IconName }[] = [
  { id: "anuncios", label: "Anuncios", icono: "megaphone" },
  { id: "cronograma", label: "Cronograma", icono: "calendar" },
];

export default function EventosScreen() {
  // ?vista=anuncios: abre esa vista directamente
  const { vista: pedida } = useLocalSearchParams<{ vista?: Vista }>();
  const [vista, setVista] = useState<Vista>(pedida ?? "anuncios");
  const [ultimaPedida, setUltimaPedida] = useState(pedida);
  // si llega otro pedido con la pestaña ya abierta, se cambia de vista
  if (pedida !== ultimaPedida) {
    setUltimaPedida(pedida);
    if (pedida) setVista(pedida);
  }

  // Pop up de ayuda del cronograma (sale solo la primera vez)
  // lo de abajo de las pestañas (se ve borroso detras del pop up)
  const objetivo = useRef<View>(null);
  const [arriba, setArriba] = useState(0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* cabecera y pestañas: quedan nitidas sobre el pop up */}
      <View
        onLayout={(e) =>
          setArriba(e.nativeEvent.layout.y + e.nativeEvent.layout.height)
        }
      >
        <CabeceraHoy />
        <TabsSuperiores
          opciones={VISTAS}
          activo={vista}
          onCambiar={setVista}
          variante="pastilla"
        />
      </View>

      <BlurTargetView ref={objetivo} style={styles.flex}>
        <VistaAnimada vista={vista} style={styles.flex}>
          {vista === "cronograma" ? (
            <CronogramaView />
          ) : (
            <AnunciosView conIglesia />
          )}
        </VistaAnimada>
      </BlurTargetView>

      {/* ayuda de cada pestaña (solo la primera vez) */}
      {arriba > 0 &&
        (vista === "cronograma" ? (
          <AyudaCronograma objetivo={objetivo} arriba={arriba} />
        ) : (
          <AyudaAnuncios objetivo={objetivo} arriba={arriba} />
        ))}
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

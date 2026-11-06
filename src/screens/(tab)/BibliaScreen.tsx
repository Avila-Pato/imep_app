import {
  DARK_BG,
  HOME_PADDING as PADDING,
  SPACING,
} from "@/constants/constans";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AccionesVersiculo, {
  SeleccionBiblia,
} from "./components/AccionesVersiculo";
import BibliaView from "./components/BibliaView";

// Pestaña Biblia: abre directo en la lectura (el libro y sus versiculos).
// Sin titulo arriba: el tabbar ya dice "Biblia".
// El estudio guiado y lo guardado van en el Perfil.
export default function BibliaScreen() {
  const insets = useSafeAreaInsets();
  // ?libro=1&capitulo=3: abre ese capitulo (al venir de "Leer capítulo completo").
  // Sin parametros empieza en Génesis 1
  const params = useLocalSearchParams<{ libro?: string; capitulo?: string }>();
  const inicio = {
    libro: Number(params.libro) || 1,
    capitulo: Number(params.capitulo) || 1,
  };
  const scrollRef = useRef<ScrollView>(null);
  // versiculos tocados (muestran la barra de acciones)
  const [seleccion, setSeleccion] = useState<SeleccionBiblia | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BibliaView
          // otro capitulo pedido = empieza de nuevo en ese capitulo
          key={`${params.libro}-${params.capitulo}`}
          inicio={inicio}
          onNavegar={() =>
            scrollRef.current?.scrollTo({ y: 0, animated: false })
          }
          seleccion={seleccion}
          onSeleccion={setSeleccion}
        />
      </ScrollView>

      {/* Acciones de los versiculos tocados (flota sobre el tabbar) */}
      {seleccion && (
        <View style={[styles.barra, { bottom: insets.bottom + 74 }]}>
          <AccionesVersiculo
            seleccion={seleccion}
            onListo={() => setSeleccion(null)}
          />
        </View>
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
  },
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});

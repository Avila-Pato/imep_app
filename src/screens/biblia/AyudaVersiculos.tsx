import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { marcarAyuda, useCargado, useEstudios } from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
import Octicons from "@expo/vector-icons/Octicons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

const PUNTOS: {
  icono: IconName;
  tono: string;
  titulo: string;
  texto: string;
}[] = [
  {
    icono: "arrow-up",
    tono: TEXT,
    titulo: "Desliza hacia arriba",
    texto: "Un versículo por pantalla. Desliza para ver el siguiente.",
  },
  {
    icono: "heart-fill",
    tono: PRIMARY,
    titulo: "Doble toque = Me gusta",
    texto:
      "Toca dos veces el versículo. Se guarda en tu Perfil, en «Mis me gusta», para volver a leerlo cuando quieras.",
  },
  {
    icono: "bookmark",
    tono: "#F5A524",
    titulo: "Guardar y Orar",
    texto:
      "Guárdalo en «Versículos y oraciones» de tu Perfil, o escribe una oración con él.",
  },
  {
    icono: "paintbrush",
    tono: "#46A758",
    titulo: "Resaltar y Compartir",
    texto: "Márcalo con un color o compártelo por WhatsApp o en tu sala.",
  },
  {
    icono: "typography",
    tono: "#4C9AFF",
    titulo: "Tamaño de letra",
    texto:
      "Arriba ajustas la letra. «Leer capítulo completo» vuelve a la lectura normal.",
  },
];

// Explicacion de como funciona "versiculo por versiculo".
// Sale solo la primera vez que se entra
export default function AyudaVersiculos() {
  const cargado = useCargado();
  const { ayudasVistas = [] } = useEstudios();
  // hasta saber lo guardado no se muestra (asi no aparece de mas)
  if (!cargado || ayudasVistas.includes("versiculos")) return null;

  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.fondo}>
      <View style={styles.tarjeta}>
        <ScrollView
          contentContainerStyle={styles.contenido}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.etiqueta}>CÓMO FUNCIONA</Text>
          <Text style={styles.titulo}>
            La Palabra, <Text style={styles.cursiva}>de a un versículo</Text>
          </Text>

          {PUNTOS.map((p, i) => (
            <Animated.View
              key={p.titulo}
              entering={FadeInDown.delay(120 + i * 80).duration(320)}
              style={styles.punto}
            >
              <View style={[styles.icono, { backgroundColor: `${p.tono}1F` }]}>
                <Octicons name={p.icono} size={18} color={p.tono} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.puntoTitulo}>{p.titulo}</Text>
                <Text style={styles.puntoTexto}>{p.texto}</Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        <Pressable
          onPress={() => marcarAyuda("versiculos")}
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
        >
          <Text style={styles.botonTexto}>¡Entendido!</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fondo: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    padding: SPACING * 2,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  tarjeta: {
    maxHeight: "90%",
    borderRadius: 26,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  contenido: {
    padding: SPACING * 2,
    gap: SPACING * 1.4,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: PRIMARY,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 26,
    lineHeight: 32,
    color: TEXT,
    marginBottom: SPACING / 2,
  },
  cursiva: {
    fontStyle: "italic",
  },
  punto: {
    flexDirection: "row",
    gap: SPACING * 1.2,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  puntoTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  puntoTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    marginTop: 2,
  },
  boton: {
    height: 52,
    margin: SPACING * 2,
    marginTop: 0,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
});

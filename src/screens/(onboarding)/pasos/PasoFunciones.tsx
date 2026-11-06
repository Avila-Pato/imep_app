import { FUNCIONES } from "@/assets/data/bienvenidaMocks";
import { FUENTE, SPACING, SURFACE, TEXT } from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

// "Todo en un lugar": mosaico de colores con lo que trae la app.
// Columna derecha corrida hacia abajo (como en la referencia)
export default function PasoFunciones({ onSeguir }: { onSeguir: () => void }) {
  const izquierda = FUNCIONES.filter((_, i) => i % 2 === 0);
  const derecha = FUNCIONES.filter((_, i) => i % 2 === 1);

  const tarjeta = (f: (typeof FUNCIONES)[number], i: number) => (
    <Animated.View
      key={f.titulo}
      // aparecen una tras otra
      entering={FadeInDown.delay(i * 90).duration(380)}
      style={styles.tarjeta}
    >
      {/* mancha de color suave detras del icono */}
      <View style={[styles.mancha, { backgroundColor: f.tono }]} />
      <View style={[styles.manchaChica, { backgroundColor: f.tono }]} />
      <Octicons name={f.icono} size={40} color={f.tono} style={styles.icono} />
      <Text style={[styles.titulo, { color: f.tono }]}>{f.titulo}</Text>
      <Text style={styles.texto}>{f.texto}</Text>
    </Animated.View>
  );

  return (
    <Paso pie={<BotonPrincipal texto="Continuar" onPress={onSeguir} />}>
      <Titulo texto="Todo en un " destacado="lugar" centrado />
      <Subtitulo centrado>
        La vida de la iglesia, toda la semana y en tu bolsillo.
      </Subtitulo>

      <View style={styles.mosaico}>
        <View style={styles.columna}>
          {izquierda.map((f, i) => tarjeta(f, i * 2))}
        </View>
        <View style={[styles.columna, styles.corrida]}>
          {derecha.map((f, i) => tarjeta(f, i * 2 + 1))}
        </View>
      </View>
    </Paso>
  );
}

const styles = StyleSheet.create({
  mosaico: {
    flexDirection: "row",
    gap: SPACING * 1.2,
    marginTop: SPACING,
  },
  columna: {
    flex: 1,
    gap: SPACING * 1.2,
  },
  corrida: {
    marginTop: SPACING * 2.6,
  },
  tarjeta: {
    height: 150,
    justifyContent: "flex-end",
    padding: SPACING * 1.4,
    borderRadius: 22,
    backgroundColor: SURFACE,
    overflow: "hidden",
  },
  // manchas tipo acuarela (circulos de color muy suaves)
  mancha: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.14,
  },
  manchaChica: {
    position: "absolute",
    bottom: -20,
    left: -24,
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.08,
  },
  icono: {
    position: "absolute",
    top: SPACING * 1.6,
    right: SPACING * 1.6,
  },
  titulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 16,
  },
  texto: {
    fontSize: 12,
    color: TEXT,
    opacity: 0.6,
    marginTop: 2,
  },
});

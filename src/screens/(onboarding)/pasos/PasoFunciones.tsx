import { FUNCIONES } from "@/assets/data/bienvenidaMocks";
import {
  BORDER,
  FUENTE,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

// "Todo en un lugar": lo que trae la app, en una grilla pareja de 2 columnas.
// Cada tarjeta: icono en un cuadrado de su color, titulo y para que sirve
export default function PasoFunciones({ onSeguir }: { onSeguir: () => void }) {
  return (
    <Paso pie={<BotonPrincipal texto="Continuar" onPress={onSeguir} />}>
      <Titulo texto="Todo en un " destacado="lugar" centrado />
      <Subtitulo centrado>
        La vida de tu iglesia, toda la semana y en tu bolsillo.
      </Subtitulo>

      <View style={styles.grilla}>
        {FUNCIONES.map((f, i) => (
          <Animated.View
            key={f.titulo}
            // aparecen una tras otra
            entering={FadeInDown.delay(i * 70).duration(340)}
            style={styles.tarjeta}
          >
            <View style={[styles.icono, { backgroundColor: `${f.tono}22` }]}>
              <Octicons name={f.icono} size={20} color={f.tono} />
            </View>
            <Text style={styles.titulo}>{f.titulo}</Text>
            <Text style={styles.texto}>{f.texto}</Text>
            {/* linea de color abajo: da identidad sin recargar */}
            <View style={[styles.acento, { backgroundColor: f.tono }]} />
          </Animated.View>
        ))}
      </View>
    </Paso>
  );
}

const styles = StyleSheet.create({
  grilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SPACING * 1.2,
    marginTop: SPACING * 1.6,
  },
  // 2 por fila, todas del mismo alto
  tarjeta: {
    width: "48.5%",
    minHeight: 148,
    padding: SPACING * 1.4,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: "hidden",
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING * 1.2,
  },
  titulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 16,
    color: TEXT,
  },
  texto: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 17,
    color: MUTED,
  },
  acento: {
    position: "absolute",
    left: SPACING * 1.4,
    bottom: 0,
    width: 28,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});

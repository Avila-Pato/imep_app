import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { RolIglesia, useEstudios, verBienvenida } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import PasoCargando from "./pasos/PasoCargando";
import PasoCuenta from "./pasos/PasoCuenta";
import PasoFunciones from "./pasos/PasoFunciones";
import PasoGrupo from "./pasos/PasoGrupo";
import PasoHistorias from "./pasos/PasoHistorias";
import PasoIglesia from "./pasos/PasoIglesia";
import PasoMotivos from "./pasos/PasoMotivos";
import PasoNombre from "./pasos/PasoNombre";
import PasoRol from "./pasos/PasoRol";
import PasoVersiones from "./pasos/PasoVersiones";

// Orden del onboarding: bienvenida (historias), conocer a la persona y
// presentar la app, al final crear la cuenta (la carga va aparte, despues).
// Despues de elegir el rol cambia un paso: el pastor ubica su iglesia y el
// hermano se une con la invitacion
const pasosPara = (rol?: RolIglesia) => {
  const pastor = rol === "pastor";
  return [
    PasoHistorias,
    PasoNombre,
    PasoRol,
    ...(pastor ? [PasoIglesia] : []),
    // "¿Qué te trae aquí?" no aplica al pastor
    ...(pastor ? [] : [PasoMotivos]),
    PasoFunciones,
    PasoVersiones,
    ...(pastor ? [] : [PasoGrupo]),
    PasoCuenta,
  ];
};

// al terminar, el layout raiz lleva a la app
const terminar = () => verBienvenida(true);

// Entrada de un paso: aparece y se corre un poco desde el lado
const SUAVE = { duration: 320, easing: Easing.out(Easing.cubic) };
const entrada = (desde: number) => () => {
  "worklet";
  return {
    initialValues: { opacity: 0, transform: [{ translateX: desde }] },
    animations: {
      opacity: withTiming(1, SUAVE),
      transform: [{ translateX: withTiming(0, SUAVE) }],
    },
  };
};
const entraDerecha = entrada(40); // al avanzar
const entraIzquierda = entrada(-40); // al volver

// Onboarding por pasos (solo la primera vez): crear cuenta, conocer a la
// persona, presentar la app y entrar a su grupo
export default function BienvenidaScreen() {
  const { nombre, rol } = useEstudios();
  const PASOS = pasosPara(rol);
  const [paso, setPaso] = useState(0);
  // hacia donde se mueve (para que el paso entre del lado correcto)
  const [avanza, setAvanza] = useState(true);
  const cargando = paso === PASOS.length;

  const ir = (nuevo: number) => {
    setAvanza(nuevo > paso);
    setPaso(nuevo);
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.flex}>
          <PasoCargando nombre={nombre} onListo={terminar} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  const PasoActual = PASOS[paso];

  // Bienvenida: historias a pantalla completa, tambien detras de la barra
  // de estado (traen sus propias barras y margenes)
  if (paso === 0) {
    return <PasoHistorias onSeguir={() => ir(1)} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Arriba: volver + segmentos de progreso */}
        <View style={styles.arriba}>
          {/* desde el primer paso, volver lleva a las historias */}
          <Pressable
            onPress={() => ir(paso - 1)}
            hitSlop={10}
            style={styles.volver}
            accessibilityLabel="Paso anterior"
          >
            <Octicons name="arrow-left" size={18} color={TEXT} />
          </Pressable>
          {/* un segmento por pregunta (las historias no cuentan) */}
          <View style={styles.segmentos}>
            {PASOS.slice(1).map((_, i) => (
              <Segmento key={i} lleno={i + 1 <= paso} />
            ))}
          </View>
        </View>

        {/* Paso actual: entra deslizandose del lado al que se avanza */}
        <Animated.View
          key={paso}
          entering={avanza ? entraDerecha : entraIzquierda}
          style={styles.flex}
        >
          <PasoActual onSeguir={() => ir(paso + 1)} />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Un tramo de la barra de progreso (se llena con animacion)
function Segmento({ lleno }: { lleno: boolean }) {
  const estilo = useAnimatedStyle(() => ({
    width: withTiming(lleno ? "100%" : "0%", { duration: 350 }),
  }));
  return (
    <View style={styles.segmento}>
      <Animated.View style={[styles.segmentoLleno, estilo]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
    overflow: "hidden",
  },
  arriba: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
  },
  volver: {
    width: 24,
  },
  segmentos: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  segmento: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    overflow: "hidden",
  },
  segmentoLleno: {
    height: 4,
    borderRadius: 2,
    backgroundColor: TEXT,
  },
});

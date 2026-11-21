import { HISTORIAS } from "@/assets/data/bienvenidaMocks";
import {
  DARK_BG,
  FUENTE,
  HOME_PADDING as PADDING,
  PRIMARY,
  SERIF,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { entrarConGoogle, miCuenta } from "@/services/cuenta";
import { conectado } from "@/services/iglesias";
import { conectarCuenta, recuperarCuenta } from "@/store/estudios";
import { partirTitulo } from "@/utils/texto";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ULTIMA = HISTORIAS.length - 1;

// Degradados con franjas (sin otra libreria)
const ABAJO = [0.1, 0.3, 0.5, 0.7, 0.85, 0.95, 1];
const ARRIBA = [0.55, 0.3, 0.12, 0];

// Presentacion tipo "historias". No avanzan solas: cada uno lee a su ritmo.
// Se cambia deslizando (izquierda = siguiente) o tocando: a la izquierda
// vuelve, al centro o a la derecha avanza
export default function PasoHistorias({
  onSeguir,
  onYaTiene,
}: {
  onSeguir: () => void;
  // entro con su cuenta y ya tenia iglesia: no repite el onboarding
  onYaTiene?: () => void;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [actual, setActual] = useState(0);
  const zoom = useSharedValue(1);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState(false);

  // "Ya tengo cuenta": entra con Google y recupera su perfil y su iglesia
  const yaTengoCuenta = async () => {
    if (entrando) return;
    setError(false);
    setEntrando(true);
    try {
      if ((await entrarConGoogle()) === "cancelado") return;
      const cuenta = await miCuenta();
      if (cuenta) await conectarCuenta(cuenta);
      if ((await recuperarCuenta()) && onYaTiene) return onYaTiene();
      // cuenta sin iglesia: sigue los pasos (ya con su cuenta guardada)
      const titulo = "Tu cuenta aún no tiene iglesia";
      const texto =
        "Entraste con Google, pero no encontramos una iglesia en tu cuenta. Sigue los pasos para crear la tuya o unirte con una invitación.";
      if (Platform.OS === "web") window.alert(`${titulo}

${texto}`);
      else Alert.alert(titulo, texto);
      onSeguir();
    } catch (e) {
      console.warn("[supabase]", (e as Error)?.message ?? e);
      setError(true);
    } finally {
      setEntrando(false);
    }
  };

  const siguiente = () =>
    actual < ULTIMA ? setActual(actual + 1) : onSeguir();
  const anterior = () => setActual(Math.max(0, actual - 1));

  // cada foto se acerca despacio (solo decorativo, no cambia de historia)
  useEffect(() => {
    zoom.set(1);
    zoom.set(withTiming(1.08, { duration: 9000, easing: Easing.linear }));
  }, [actual, zoom]);

  const deslizar = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-15, 15])
    .failOffsetY([-30, 30])
    .onEnd((e) => {
      if (e.translationX < -50 || e.velocityX < -500) siguiente();
      else if (e.translationX > 50 || e.velocityX > 500) anterior();
    });
  const tocar = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      if (e.x < width / 3) anterior();
      else siguiente();
    });
  // un gesto a la vez: si desliza no cuenta como toque
  const gestos = Gesture.Exclusive(deslizar, tocar);

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoom.get() }],
  }));

  const h = HISTORIAS[actual];
  const { inicio, final } = partirTitulo(h.titulo);

  return (
    <View style={styles.flex}>
      {/* Foto a pantalla completa */}
      <Animated.View
        key={actual}
        entering={FadeIn.duration(450)}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
          <Image
            source={h.imagen}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
        </Animated.View>
        <View style={styles.sombraArriba} pointerEvents="none">
          {ARRIBA.map((o, i) => (
            <View key={i} style={[styles.franja, { opacity: o }]} />
          ))}
        </View>
        <View style={styles.sombraAbajo} pointerEvents="none">
          {ABAJO.map((o, i) => (
            <View key={i} style={[styles.franja, { opacity: o }]} />
          ))}
        </View>
      </Animated.View>

      {/* Zona para deslizar o tocar (detras de los botones) */}
      <GestureDetector gesture={gestos}>
        <View
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Historia ${actual + 1} de ${HISTORIAS.length}`}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) =>
            e.nativeEvent.actionName === "increment" ? siguiente() : anterior()
          }
        />
      </GestureDetector>

      {/* Arriba: barras, logo y saltar */}
      <View
        style={[styles.arriba, { paddingTop: insets.top + SPACING }]}
        pointerEvents="box-none"
      >
        <View style={styles.barras} pointerEvents="none">
          {HISTORIAS.map((_, i) => (
            <Barra key={i} llena={i <= actual} />
          ))}
        </View>
        <View style={styles.marcaFila} pointerEvents="box-none">
          <View style={styles.marca} pointerEvents="none">
            <View style={styles.marcaIcono}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.marcaLogo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.marcaTexto}>CONGREGA</Text>
          </View>
          <Pressable
            onPress={onSeguir}
            hitSlop={10}
            style={styles.saltar}
            accessibilityLabel="Saltar presentación"
          >
            <Text style={styles.saltarTexto}>Saltar</Text>
          </Pressable>
        </View>
      </View>

      {/* Texto de la historia */}
      <View
        style={[styles.texto, { paddingBottom: insets.bottom + SPACING * 3 }]}
        pointerEvents="box-none"
      >
        <Animated.View
          key={`t${actual}`}
          entering={FadeInDown.duration(500).delay(150)}
          style={styles.textoInterno}
          pointerEvents="none"
        >
          <View style={styles.etiquetaFila}>
            <View style={styles.etiquetaLinea} />
            <Text style={styles.etiqueta}>{h.etiqueta}</Text>
          </View>
          <Text style={styles.titulo}>
            {inicio}
            <Text style={styles.cursiva}>{final}</Text>
          </Text>
          <Text style={styles.descripcion}>{h.texto}</Text>
        </Animated.View>

        {actual === ULTIMA ? (
          <Pressable
            onPress={onSeguir}
            style={({ pressed }) => [
              styles.boton,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.botonTexto}>Comenzar</Text>
            <Octicons name="arrow-right" size={16} color={DARK_BG} />
          </Pressable>
        ) : (
          <View style={styles.pistaFila} pointerEvents="none">
            <Text style={styles.pista}>Desliza o toca para continuar</Text>
            <Octicons name="chevron-right" size={14} color="#8A8A8A" />
          </View>
        )}

        {/* quien ya uso la app (reinstalo o cambio de telefono) no repite
            todo: entra con su cuenta y vuelve su perfil y su iglesia */}
        {conectado() && (
          <View style={styles.cuentaCaja}>
            <Pressable
              onPress={yaTengoCuenta}
              disabled={entrando}
              hitSlop={8}
              style={({ pressed }) => [
                styles.cuenta,
                (pressed || entrando) && styles.presionado,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ya tengo cuenta, entrar con Google"
            >
              {entrando ? (
                <ActivityIndicator size="small" color={TEXT} />
              ) : (
                <FontAwesome name="google" size={14} color={TEXT} />
              )}
              <Text style={styles.cuentaTexto}>
                {entrando ? "Buscando tu cuenta…" : "¿Ya tienes cuenta? "}
                {!entrando && (
                  <Text style={styles.cuentaFuerte}>Entra con Google</Text>
                )}
              </Text>
            </Pressable>
            {error && (
              <Text style={styles.cuentaError}>
                No se pudo entrar con Google. Inténtalo de nuevo.
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// Una barra: llena hasta la historia actual (se llena con animacion)
function Barra({ llena }: { llena: boolean }) {
  const estilo = useAnimatedStyle(() => ({
    width: withTiming(llena ? "100%" : "0%", { duration: 300 }),
  }));
  return (
    <View style={styles.barra}>
      <Animated.View style={[styles.barraLlena, estilo]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: DARK_BG,
    overflow: "hidden",
  },
  presionado: {
    opacity: 0.8,
  },
  franja: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  sombraArriba: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "22%",
  },
  sombraAbajo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "62%",
  },

  // Arriba
  arriba: {
    position: "absolute",
    top: 0,
    left: PADDING,
    right: PADDING,
    gap: SPACING * 1.4,
  },
  barras: {
    flexDirection: "row",
    gap: 4,
  },
  barra: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  barraLlena: {
    height: 3,
    backgroundColor: "#FFFFFF",
  },
  marcaFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  marca: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // el logo sobre un circulo blanco (se lee sobre cualquier foto)
  marcaIcono: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  marcaLogo: {
    width: 26,
    height: 26,
  },
  marcaTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    letterSpacing: 2,
    color: "#FFFFFF",
  },
  saltar: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  saltarTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
  },

  // Texto
  texto: {
    position: "absolute",
    left: PADDING,
    right: PADDING,
    bottom: 0,
    gap: SPACING * 2,
  },
  textoInterno: {
    gap: SPACING * 1.2,
  },
  etiquetaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  etiquetaLinea: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: PRIMARY,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 2.4,
    color: PRIMARY,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 42,
    lineHeight: 48,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  descripcion: {
    fontSize: 16,
    lineHeight: 25,
    color: "#CFCFCF",
  },
  pistaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pista: {
    fontSize: 12,
    color: "#8A8A8A",
  },
  cuentaCaja: {
    alignItems: "center",
    gap: 6,
    marginTop: -SPACING / 2,
  },
  cuenta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING / 2,
  },
  cuentaTexto: {
    fontSize: 14,
    color: "#CFCFCF",
  },
  cuentaFuerte: {
    fontFamily: FUENTE.semibold,
    color: TEXT,
    textDecorationLine: "underline",
  },
  cuentaError: {
    fontSize: 12,
    color: PRIMARY,
    textAlign: "center",
  },
  boton: {
    flexDirection: "row",
    gap: 8,
    height: 54,
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

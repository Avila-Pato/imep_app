import { PRIMARY } from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { StyleSheet } from "react-native";
import Animated, { Keyframe } from "react-native-reanimated";

export const TAMANO_CORAZON = 96;
export const DURACION_CORAZON = 950;

// Corazon que salta donde se dio el doble toque y se va hacia arriba
// (como el "me gusta" de TikTok). Cada uno sale un poco inclinado
export default function CorazonMeGusta({
  x,
  y,
  giro,
}: {
  x: number;
  y: number;
  giro: number; // grados (-20 a 20)
}) {
  const rot = `${giro}deg`;
  const salto = new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateY: 0 }, { rotate: rot }, { scale: 0.2 }],
    },
    18: {
      opacity: 1,
      transform: [{ translateY: 0 }, { rotate: rot }, { scale: 1.25 }],
    },
    30: {
      opacity: 1,
      transform: [{ translateY: 0 }, { rotate: rot }, { scale: 0.92 }],
    },
    40: {
      opacity: 1,
      transform: [{ translateY: 0 }, { rotate: rot }, { scale: 1 }],
    },
    70: {
      opacity: 1,
      transform: [{ translateY: -12 }, { rotate: rot }, { scale: 1 }],
    },
    100: {
      opacity: 0,
      transform: [{ translateY: -140 }, { rotate: rot }, { scale: 1.5 }],
    },
  }).duration(DURACION_CORAZON);

  return (
    <Animated.View
      entering={salto}
      pointerEvents="none"
      style={[
        styles.corazon,
        { left: x - TAMANO_CORAZON / 2, top: y - TAMANO_CORAZON / 2 },
      ]}
    >
      <Octicons name="heart-fill" size={TAMANO_CORAZON} color={PRIMARY} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  corazon: {
    position: "absolute",
    width: TAMANO_CORAZON,
    height: TAMANO_CORAZON,
    alignItems: "center",
    justifyContent: "center",
    // sombra suave para que se despegue del texto
    textShadowColor: "rgba(0,0,0,0.4)",
  },
});

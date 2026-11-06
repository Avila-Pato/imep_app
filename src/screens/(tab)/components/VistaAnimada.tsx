import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, withTiming } from "react-native-reanimated";

const SUAVE = { duration: 240, easing: Easing.out(Easing.cubic) };

// Aparece y sube un poquito (sin salto brusco al cambiar de vista)
const entrada = () => {
  "worklet";
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 12 }] },
    animations: {
      opacity: withTiming(1, SUAVE),
      transform: [{ translateY: withTiming(0, SUAVE) }],
    },
  };
};

// Contenido de una vista (Salas, Muro, Anuncios...): al cambiar "vista"
// se monta de nuevo con una entrada suave
export default function VistaAnimada({
  vista,
  style,
  children,
}: {
  vista: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Animated.View key={vista} entering={entrada} style={style}>
      {children}
    </Animated.View>
  );
}

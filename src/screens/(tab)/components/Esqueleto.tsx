import { ELEVADO } from "@/constants/constans";
import { useEffect } from "react";
import { DimensionValue, StyleProp, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Bloque gris que late mientras carga algo (evita saltos al aparecer)
export default function Esqueleto({
  ancho = "100%",
  alto,
  radio = 8,
  style,
}: {
  ancho?: DimensionValue;
  alto: DimensionValue;
  radio?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const latido = useSharedValue(0.45);

  useEffect(() => {
    latido.set(
      withRepeat(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [latido]);

  const estilo = useAnimatedStyle(() => ({ opacity: latido.get() }));

  return (
    <View style={style}>
      <Animated.View
        style={[
          {
            width: ancho,
            height: alto,
            borderRadius: radio,
            backgroundColor: ELEVADO,
          },
          estilo,
        ]}
      />
    </View>
  );
}

import { ACTIVE_COLOR, INACTIVE_COLOR, PRIMARY } from "@/constants/constans";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { TabBarIcon } from "@/types/typesBar";

type PropsTabbarItem = {
  tabBarIcon?: TabBarIcon;
  label: string;
  onPress: () => void;
  isFocused: boolean;
};

const TabbarItem = ({
  tabBarIcon,
  label,
  onPress,
  isFocused,
}: PropsTabbarItem) => {
  // 0 = inactivo, 1 = activo
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused, progress]);

  // Pastilla detras del icono: se abre a lo ancho al activarse
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: 0.2 * progress.value,
    transform: [{ scaleX: 0.4 + 0.6 * progress.value }],
  }));

  const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      hitSlop={6}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.indicator, indicatorStyle]} />
        {tabBarIcon?.({ focused: isFocused, color, size: 24 })}
      </View>

      <Animated.Text style={[styles.label, { color }]}>{label}</Animated.Text>
    </Pressable>
  );
};

export default TabbarItem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 10,
    paddingBottom: 6,
  },
  iconWrap: {
    width: 56,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    backgroundColor: PRIMARY,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});

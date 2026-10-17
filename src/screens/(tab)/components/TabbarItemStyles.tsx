import {
  ACTIVE_COLOR,
  FUENTE,
  INACTIVE_COLOR,
  PRIMARY,
} from "@/constants/constans";
import { TabBarIcon } from "@/types/typesBar";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

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
    progress.set(withTiming(isFocused ? 1 : 0, { duration: 200 }));
  }, [isFocused, progress]);

  // Pastilla detras del icono: se abre a lo ancho al activarse
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: 0.2 * progress.get(),
    transform: [{ scaleX: 0.4 + 0.6 * progress.get() }],
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

      <Animated.Text
        numberOfLines={1}
        style={[styles.label, isFocused && styles.labelActivo, { color }]}
      >
        {label}
      </Animated.Text>
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
    fontFamily: FUENTE.medium,
    fontSize: 9,
  },
  labelActivo: {
    fontFamily: FUENTE.semibold,
  },
});

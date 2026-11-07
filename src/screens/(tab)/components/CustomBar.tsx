import { SPACING, TABBAR_BG, TABBAR_BORDER } from "@/constants/constans";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@/types/typesBar";
import TabbarItem from "./TabbarItemStyles";

export default function CustomBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  //   useSafeAreaInsets sirve para saber el tamaño de la pantalla
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: bottom + SPACING }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        // pestañas ocultas: Inicio (index, solo redirige a Anuncios) o las
        // marcadas con href: null (expo-router las esconde con display none)
        const oculta =
          route.name === "index" ||
          (options as { href?: unknown }).href === null ||
          (options.tabBarItemStyle as { display?: string } | undefined)
            ?.display === "none";
        if (oculta) return null;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // tabBarLabel puede ser string, funcion o undefined
        const label =
          typeof options.tabBarLabel === "string"
            ? options.tabBarLabel
            : (options.title ?? route.name);

        return (
          <TabbarItem
            key={route.key}
            tabBarIcon={options.tabBarIcon}
            label={label}
            onPress={onPress}
            isFocused={isFocused}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: SPACING,
    backgroundColor: TABBAR_BG,
    borderTopWidth: 2,
    borderTopColor: TABBAR_BORDER,
  },
});

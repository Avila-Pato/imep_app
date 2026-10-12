import { Tabs } from "expo-router";
import { ComponentProps } from "react";

// Tipos sacados del propio <Tabs> de expo-router (sin importar rutas internas)
export type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

export type TabBarIcon = BottomTabBarProps["descriptors"][string]["options"]["tabBarIcon"];

import CustomBar from "@/screens/(tab)/components/CustomBar";
import Octicons from "@expo/vector-icons/Octicons";
import { Tabs } from "expo-router";
import { BottomTabBarProps } from "@/types/typesBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props: BottomTabBarProps) => <CustomBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused, size }) =>
            !focused ? (
              <Octicons name="home" size={size} color={color} />
            ) : (
              <Octicons name="home-fill" size={size} color={color} />
            ),
        }}
      />

      {/* Anuncios */}

      <Tabs.Screen
        name="eventos"
        options={{
          title: "Anuncios",
          tabBarIcon: ({ color, focused, size }) =>
            !focused ? (
              <Octicons name="calendar" size={size} color={color} />
            ) : (
              <Octicons name="calendar" size={size} color={color} />
            ),
        }}
      />

      {/*  Cronograma */}

      <Tabs.Screen
        name="cronogramas"
        options={{
          title: "Cronogramas",
          tabBarIcon: ({ color, focused, size }) =>
            !focused ? (
              <Octicons name="clock" size={size} color={color} />
            ) : (
              <Octicons name="clock" size={size} color={color} />
            ),
        }}
      />

      {/* Estudio (predicaciones y estudio guiado) */}

      <Tabs.Screen
        name="oraciones"
        options={{
          title: "Estudio",
          tabBarIcon: ({ color, focused, size }) =>
            !focused ? (
              <Octicons name="book" size={size} color={color} />
            ) : (
              <Octicons name="book" size={size} color={color} />
            ),
        }}
      />

      {/* Perfil */}

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused, size }) =>
            !focused ? (
              <Octicons name="person" size={size} color={color} />
            ) : (
              <Octicons name="person" size={size} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

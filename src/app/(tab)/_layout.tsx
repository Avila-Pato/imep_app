import CustomBar from "@/screens/(tab)/components/CustomBar";
import Octicons from "@expo/vector-icons/Octicons";
import { Tabs } from "expo-router";
import { BottomTabBarProps } from "@/types/typesBar";
import { DARK_BG } from "@/constants/constans";

// la app abre en Anuncios (Inicio se quito)
export const unstable_settings = { initialRouteName: "eventos" };

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props: BottomTabBarProps) => <CustomBar {...props} />}
      screenOptions={{
        headerShown: false,
        // fundido al cambiar de pestaña (sin salto brusco)
        animation: "fade",
        // fondo de cada pestaña oscuro (sin destello blanco durante el fundido)
        sceneStyle: { backgroundColor: DARK_BG },
      }}
    >
      {/* Inicio ya no es pestaña: lleva a Anuncios */}
      <Tabs.Screen name="index" options={{ href: null }} />

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

      {/* Comunidad */}

      <Tabs.Screen
        name="comunidad"
        options={{
          title: "Comunidad",
          tabBarIcon: ({ color, size }) => (
            <Octicons name="people" size={size} color={color} />
          ),
        }}
      />

      {/* Biblia */}

      <Tabs.Screen
        name="oraciones"
        options={{
          title: "Biblia",
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

// Solo los pesos que usamos (importar el paquete completo trae las 18 variantes)
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Caveat_600SemiBold } from "@expo-google-fonts/caveat/600SemiBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// La pantalla de carga se queda hasta que esten las fuentes
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fuentesListas, error] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Caveat_600SemiBold, // letra a mano del muro de oracion
  });

  useEffect(() => {
    if (fuentesListas || error) SplashScreen.hideAsync();
  }, [fuentesListas, error]);

  if (!fuentesListas && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Hora e iconos del celular en claro (la app es oscura) */}
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}

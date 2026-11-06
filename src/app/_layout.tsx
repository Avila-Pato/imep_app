// Solo los pesos que usamos (importar el paquete completo trae las 18 variantes)
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Caveat_600SemiBold } from "@expo-google-fonts/caveat/600SemiBold";
import { EBGaramond_400Regular } from "@expo-google-fonts/eb-garamond/400Regular";
import { EBGaramond_400Regular_Italic } from "@expo-google-fonts/eb-garamond/400Regular_Italic";
import { EBGaramond_600SemiBold } from "@expo-google-fonts/eb-garamond/600SemiBold";
import { MOSTRAR_BIENVENIDA } from "@/constants/constans";
import { useCargado, useEstudios } from "@/store/estudios";
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
    // letra de libro para la Biblia
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    EBGaramond_600SemiBold,
  });

  // Lo guardado en el telefono (para saber si ya vio el onboarding)
  const cargado = useCargado();
  const { bienvenida: vista } = useEstudios();
  const bienvenida = vista || !MOSTRAR_BIENVENIDA;
  const listo = (fuentesListas || !!error) && cargado;

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Hora e iconos del celular en claro (la app es oscura) */}
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Primera vez: solo el onboarding */}
        <Stack.Protected guard={!bienvenida}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={!!bienvenida}>
          <Stack.Screen name="(tab)" />
          <Stack.Screen name="sala/[id]" />
          <Stack.Screen name="predicacion" />
          {/* entra y sale desde abajo, como una hoja */}
          <Stack.Screen
            name="versiculos"
            options={{ animation: "slide_from_bottom" }}
          />
        </Stack.Protected>
      </Stack>
    </GestureHandlerRootView>
  );
}

// Primero: oculta avisos conocidos (antes de que se carguen los modulos)
import "@/utils/silenciarAvisos";
// Solo los pesos que usamos (importar el paquete completo trae las 18 variantes)
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Caveat_600SemiBold } from "@expo-google-fonts/caveat/600SemiBold";
import { EBGaramond_400Regular } from "@expo-google-fonts/eb-garamond/400Regular";
import { EBGaramond_400Regular_Italic } from "@expo-google-fonts/eb-garamond/400Regular_Italic";
import { EBGaramond_600SemiBold } from "@expo-google-fonts/eb-garamond/600SemiBold";
import {
  DARK_BG,
  MOSTRAR_BIENVENIDA,
  TEXT,
  ES_CLARO,
} from "@/constants/constans";
import { useRecordatorios } from "@/hooks/useRecordatorios";
import { useEnVivo } from "@/hooks/useEnVivo";
import {
  irAIglesia,
  reintentarPendientes,
  registrarPush,
  sincronizarContenido,
  sincronizarIglesias,
  useCargado,
  useEstudios,
} from "@/store/estudios";
import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  Href,
  router,
  Stack,
  ThemeProvider,
} from "expo-router";
import {
  alActivarPermiso,
  escucharToques,
  pedirPermisoAlEntrar,
} from "@/services/notificaciones";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// La pantalla de carga se queda hasta que esten las fuentes
SplashScreen.preventAutoHideAsync();

// Fondo oscuro detras de todas las vistas: al cambiar de pestaña o de
// pantalla no se asoma el blanco por defecto
SystemUI.setBackgroundColorAsync(DARK_BG).catch(() => {});
const BASE = ES_CLARO ? DefaultTheme : DarkTheme;
const TEMA = {
  ...BASE,
  colors: {
    ...BASE.colors,
    background: DARK_BG,
    card: DARK_BG,
    text: TEXT,
  },
};

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
  // recordatorios de cultos, turnos y anuncios (notificaciones locales)
  useRecordatorios();
  // cronograma, anuncios y miembros al instante (Supabase Realtime)
  useEnVivo();
  const { bienvenida: vista } = useEstudios();
  const bienvenida = vista || !MOSTRAR_BIENVENIDA;
  const listo = (fuentesListas || !!error) && cargado;

  useEffect(() => {
    if (!listo) return;
    SplashScreen.hideAsync();
  }, [listo]);

  // Con servidor: trae sus iglesias, anuncios y turnos, y registra este
  // telefono para recibir push. Al volver a la app, trae lo nuevo
  useEffect(() => {
    if (!cargado) return;
    sincronizarIglesias().then(() => {
      sincronizarContenido();
      // lo que quedo subiendose o fallo (ej: se cerro la app): de nuevo
      reintentarPendientes();
    });
    registrarPush();
    const quitarPermiso = alActivarPermiso(registrarPush);
    const sub = AppState.addEventListener("change", (estado) => {
      // al volver: iglesias nuevas del pastor y lo nuevo de la activa
      if (estado === "active") sincronizarIglesias().then(sincronizarContenido);
    });
    return () => {
      quitarPermiso();
      sub.remove();
    };
  }, [cargado]);

  // Recien entra a la app: pide permiso para avisarle (una sola vez)
  useEffect(() => {
    if (listo && bienvenida) pedirPermisoAlEntrar().catch(() => {});
  }, [listo, bienvenida]);

  // Tocar una notificacion abre su pantalla (cuando la app ya esta lista)
  useEffect(() => {
    if (!listo || !bienvenida) return;
    return escucharToques((url, iglesiaId) => {
      if (iglesiaId) irAIglesia(iglesiaId); // el aviso es de esa iglesia
      router.push(url as Href);
    });
  }, [listo, bienvenida]);

  if (!listo) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: DARK_BG }}>
      <ThemeProvider value={TEMA}>
        {/* Hora e iconos del celular en claro (la app es oscura) */}
        <StatusBar style={ES_CLARO ? "dark" : "light"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: DARK_BG },
          }}
        >
          {/* Primera vez: solo el onboarding */}
          <Stack.Protected guard={!bienvenida}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>
          <Stack.Protected guard={!!bienvenida}>
            <Stack.Screen name="(tab)" />
            <Stack.Screen name="sala/[id]" />
            <Stack.Screen name="privado/[persona]" />
            <Stack.Screen name="predicacion" />
            <Stack.Screen name="permisos" />
            <Stack.Screen name="gestion/[tipo]" />
            <Stack.Screen name="notificaciones" />
            <Stack.Screen name="megusta" />
            <Stack.Screen name="guardados" />
            <Stack.Screen name="editar-perfil" />
            {/* entra y sale desde abajo, como una hoja */}
            <Stack.Screen
              name="versiculos"
              options={{ animation: "slide_from_bottom" }}
            />
          </Stack.Protected>
          {/* Siempre abiertas: son paginas publicas (enlace de Google Play).
              Van al final: si quedan primero, Expo Router las usa como
              pantalla inicial cuando "/" esta protegida (antes del onboarding) */}
          <Stack.Screen name="privacidad" />
          <Stack.Screen name="ayuda" />
          {/* enlace de invitacion: abre antes del onboarding (guarda el
              codigo) y en la web muestra como descargar la app */}
          <Stack.Screen name="unirse/[codigo]" />
          <Stack.Screen name="unirse/index" />
          {/* vuelta del login con Google */}
          <Stack.Screen name="auth" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

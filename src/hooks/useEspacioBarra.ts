import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Alto de la barra de pestañas flotante (sin el borde del telefono)
const BARRA = 92;

// Espacio al final de cada pestaña para que nada quede detras de la barra
// flotante ni de los botones / la raya del telefono (Android o iPhone)
export function useEspacioBarra() {
  const { bottom } = useSafeAreaInsets();
  return BARRA + bottom;
}

// ¿Esta abierto el teclado? (para esconder lo que estorba mientras se escribe)
export function useTecladoAbierto() {
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const sube = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      () => setAbierto(true),
    );
    const baja = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setAbierto(false),
    );
    return () => {
      sube.remove();
      baja.remove();
    };
  }, []);
  return abierto;
}

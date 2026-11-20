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

// Alto del teclado (0 = cerrado), para hojas dentro de un Modal: ahi Android
// no achica la ventana y KeyboardAvoidingView podia quedar con el alto de un
// teclado que ya se cerro (la hoja quedaba subida, sin llegar abajo). Al
// abrir la hoja (activa) se parte de lo que de verdad hay en pantalla
const tecladoAhora = () =>
  Keyboard.isVisible() ? (Keyboard.metrics()?.height ?? 0) : 0;

export function useAltoTeclado(activa = true) {
  const [alto, setAlto] = useState(0);
  // al abrir la hoja: se parte de lo que de verdad hay en pantalla (sin
  // arrastrar el teclado del chat)
  const [antes, setAntes] = useState(activa);
  if (antes !== activa) {
    setAntes(activa);
    setAlto(activa ? tecladoAhora() : 0);
  }
  useEffect(() => {
    if (!activa) return;
    const ios = Platform.OS === "ios";
    const sube = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setAlto(e.endCoordinates.height),
    );
    const baja = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setAlto(0),
    );
    return () => {
      sube.remove();
      baja.remove();
    };
  }, [activa]);
  return activa ? alto : 0;
}

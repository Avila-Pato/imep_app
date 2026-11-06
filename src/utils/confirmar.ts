import { Alert, Platform } from "react-native";

// Pregunta antes de algo que no se puede deshacer.
// En web no hay Alert con botones: se usa la ventana del navegador
export function confirmar(
  titulo: string,
  texto: string,
  boton: string,
  accion: () => void,
) {
  if (Platform.OS === "web") {
    if (window.confirm(`${titulo}\n\n${texto}`)) accion();
    return;
  }
  Alert.alert(titulo, texto, [
    { text: "Cancelar", style: "cancel" },
    { text: boton, style: "destructive", onPress: accion },
  ]);
}

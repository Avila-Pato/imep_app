import { MUTED } from "@/constants/constans";
import { vaciarChat } from "@/store/estudios";
import { GrupoId } from "@/types/typesComunidad";
import Octicons from "@expo/vector-icons/Octicons";
import { Alert, Platform, Pressable } from "react-native";

// "Vaciar chat" como en WhatsApp: borra la conversacion solo para esta
// persona. Los demas siguen viendo todos los mensajes
export default function BotonVaciarChat({
  grupo,
  nombre,
}: {
  grupo: GrupoId;
  nombre: string; // de la sala o de la persona (para el mensaje)
}) {
  const confirmar = () => {
    const texto = `Se borrarán los mensajes de «${nombre}» solo en tu teléfono. Los demás seguirán viendo la conversación.`;
    if (Platform.OS === "web") {
      if (window.confirm(`Vaciar chat\n\n${texto}`)) vaciarChat(grupo);
      return;
    }
    Alert.alert("¿Vaciar este chat?", texto, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Vaciar",
        style: "destructive",
        onPress: () => vaciarChat(grupo),
      },
    ]);
  };

  return (
    <Pressable
      onPress={confirmar}
      hitSlop={10}
      accessibilityLabel="Vaciar chat"
      style={({ pressed }) => pressed && { opacity: 0.6 }}
    >
      <Octicons name="trash" size={18} color={MUTED} />
    </Pressable>
  );
}

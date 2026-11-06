import {
  BORDER,
  FUENTE,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { fijarIglesia, useIglesia } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FormIglesia from "./FormIglesia";

// Hoja para que el pastor ponga o cambie la ubicacion de la iglesia
export default function ModalIglesia({
  visible,
  onCerrar,
}: {
  visible: boolean;
  onCerrar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const iglesia = useIglesia();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
    >
      <Pressable style={styles.fondo} onPress={onCerrar} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.zona}
        pointerEvents="box-none"
      >
        <View style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}>
          <View style={styles.asa} />
          <ScrollView
            contentContainerStyle={styles.contenido}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cabecera}>
              <Text style={styles.titulo}>
                {iglesia ? "Cambiar ubicación" : "Ubicación de tu iglesia"}
              </Text>
              <Pressable
                onPress={onCerrar}
                hitSlop={10}
                accessibilityLabel="Cerrar"
              >
                <Octicons name="x" size={18} color={MUTED} />
              </Pressable>
            </View>
            {/* key: al abrir de nuevo parte con lo guardado */}
            <FormIglesia
              key={String(visible)}
              inicial={iglesia}
              textoBoton="Guardar"
              onGuardar={(i) => {
                fijarIglesia(i);
                onCerrar();
              }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  zona: {
    flex: 1,
    justifyContent: "flex-end",
  },
  hoja: {
    maxHeight: "90%",
    paddingTop: SPACING,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3A",
  },
  contenido: {
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    gap: SPACING * 1.4,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titulo: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 22,
    color: TEXT,
  },
});

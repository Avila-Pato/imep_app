import {
  BORDER,
  DARK_BG,
  FUENTE,
  HOME_PADDING as PADDING,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  cita: string;
  texto: string; // el versiculo
  onCerrar: () => void;
  onGuardar: (oracion: string) => void;
  onCompartir: (oracion: string) => void;
};

// Orar con un versiculo: escribir la oracion y guardarla o compartirla
// (es personal: no va al muro de oracion)
export default function ModalOracion({
  visible,
  cita,
  texto,
  onCerrar,
  onGuardar,
  onCompartir,
}: Props) {
  const insets = useSafeAreaInsets();
  const [oracion, setOracion] = useState("");
  const lista = !!oracion.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.fondo}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.cerrarFondo} onPress={onCerrar} />
        <View style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}>
          <View style={styles.asa} />
          <ScrollView
            contentContainerStyle={styles.contenido}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cabecera}>
              <Text style={styles.titulo}>
                Ora con <Text style={styles.cursiva}>este versículo</Text>
              </Text>
              <Pressable
                onPress={onCerrar}
                hitSlop={10}
                style={styles.cerrar}
                accessibilityLabel="Cerrar"
              >
                <Octicons name="x" size={16} color={TEXT} />
              </Pressable>
            </View>

            {/* el versiculo */}
            <View style={styles.verso}>
              <Text style={styles.versoTexto}>«{texto}»</Text>
              <Text style={styles.versoCita}>{cita.toUpperCase()}</Text>
            </View>

            <TextInput
              value={oracion}
              onChangeText={setOracion}
              placeholder="Señor, hoy te pido…"
              placeholderTextColor="#555555"
              multiline
              style={styles.input}
            />

            <Pressable
              onPress={() => onGuardar(oracion.trim())}
              disabled={!lista}
              style={({ pressed }) => [
                styles.boton,
                styles.botonPrincipal,
                !lista && styles.apagado,
                pressed && styles.presionado,
              ]}
            >
              <Octicons name="bookmark" size={16} color={DARK_BG} />
              <Text style={[styles.botonTexto, styles.botonTextoPrincipal]}>
                Guardar en mi perfil
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onCompartir(oracion.trim())}
              disabled={!lista}
              style={({ pressed }) => [
                styles.boton,
                !lista && styles.apagado,
                pressed && styles.presionado,
              ]}
            >
              <Octicons name="share-android" size={16} color={TEXT} />
              <Text style={styles.botonTexto}>Compartir con amigos</Text>
            </Pressable>
            <Text style={styles.nota}>
              Tu oración es personal: no se publica en el muro.
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  cerrarFondo: {
    flex: 1,
  },
  hoja: {
    maxHeight: "90%",
    paddingHorizontal: PADDING,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    marginTop: SPACING,
    marginBottom: SPACING * 1.4,
  },
  contenido: {
    gap: SPACING * 1.4,
    paddingBottom: SPACING,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titulo: {
    fontFamily: FUENTE.biblia,
    fontSize: 26,
    color: TEXT,
  },
  cursiva: {
    fontFamily: FUENTE.bibliaCursiva,
  },
  cerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  verso: {
    gap: 6,
    paddingLeft: SPACING * 1.2,
    borderLeftWidth: 2,
    borderLeftColor: BORDER,
  },
  versoTexto: {
    fontFamily: FUENTE.bibliaCursiva,
    fontSize: 17,
    lineHeight: 25,
    color: TEXT,
  },
  versoCita: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: MUTED,
  },
  input: {
    minHeight: 120,
    padding: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    fontFamily: FUENTE.biblia,
    fontSize: 17,
    lineHeight: 24,
    color: TEXT,
    textAlignVertical: "top",
    outlineWidth: 0,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: SPACING * 1.3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  botonPrincipal: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  botonTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  botonTextoPrincipal: {
    color: DARK_BG,
  },
  apagado: {
    opacity: 0.4,
  },
  presionado: {
    opacity: 0.6,
  },
  nota: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
});

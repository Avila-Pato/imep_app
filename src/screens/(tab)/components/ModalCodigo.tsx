import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { useUnirse } from "@/hooks/useUnirse";
import { useIglesia } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ConBordes from "@/components/ConBordes";

// "Tengo un código": unirse a la iglesia (y a un grupo) con el codigo o
// enlace que envio el pastor
export default function ModalCodigo({
  visible,
  onCerrar,
}: {
  visible: boolean;
  onCerrar: () => void;
}) {
  const unirse = useUnirse();
  const iglesia = useIglesia();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState(false);
  // al aceptar: a que se unio (para el mensaje de listo)
  const [unido, setUnido] = useState<string | null>(null);

  const cerrar = () => {
    setCodigo("");
    setError(false);
    setUnido(null);
    onCerrar();
  };

  const usar = () => {
    const r = unirse(codigo);
    if (!r) return setError(true);
    setUnido(r.sala ? `tu iglesia y a ${r.sala}` : "tu iglesia");
  };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={cerrar}
    >
      <ConBordes>
        {(insets) => (
          <>
            <Pressable style={styles.fondo} onPress={cerrar} />
            <KeyboardAvoidingView
              // en Android la hoja (pantalla completa) no se achica sola: se sube aqui
              behavior="padding"
              style={styles.zona}
              pointerEvents="box-none"
            >
              <View
                style={[
                  styles.hoja,
                  { paddingBottom: insets.bottom + SPACING },
                ]}
              >
                <View style={styles.asa} />

                {unido ? (
                  // Listo: ya se unio
                  <View style={styles.listo}>
                    <View style={styles.listoIcono}>
                      <Octicons name="check" size={26} color="#FFFFFF" />
                    </View>
                    <Text style={styles.titulo}>¡Bienvenido!</Text>
                    <Text style={styles.texto}>
                      Te uniste a {unido}. En Anuncios ya puedes ver la
                      ubicación de {iglesia?.sede ?? "tu iglesia"}.
                    </Text>
                    <Pressable
                      onPress={cerrar}
                      style={({ pressed }) => [
                        styles.boton,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Text style={styles.botonTexto}>Listo</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View style={styles.cabecera}>
                      <Text style={styles.titulo}>Tengo un código</Text>
                      <Pressable
                        onPress={cerrar}
                        hitSlop={10}
                        accessibilityLabel="Cerrar"
                      >
                        <Octicons name="x" size={18} color={MUTED} />
                      </Pressable>
                    </View>
                    <Text style={styles.texto}>
                      Escribe o pega el código que te envió tu pastor para
                      unirte a tu iglesia. Si es de un grupo, también entrarás a
                      su sala.
                    </Text>

                    <View style={[styles.input, error && styles.inputError]}>
                      <Octicons name="key" size={14} color={MUTED} />
                      <TextInput
                        value={codigo}
                        onChangeText={(t) => {
                          setCodigo(t);
                          setError(false);
                        }}
                        onSubmitEditing={usar}
                        placeholder="Código o enlace"
                        placeholderTextColor="#555555"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                        style={styles.inputTexto}
                      />
                    </View>
                    {error && (
                      <Text style={styles.error}>
                        Ese código no es válido. Pídele uno nuevo a tu pastor.
                      </Text>
                    )}

                    <Pressable
                      onPress={usar}
                      disabled={!codigo.trim()}
                      style={({ pressed }) => [
                        styles.boton,
                        !codigo.trim() && styles.botonApagado,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Text style={styles.botonTexto}>Unirme</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </>
        )}
      </ConBordes>
    </Modal>
  );
}

const styles = StyleSheet.create({
  presionado: {
    opacity: 0.7,
  },
  fondo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  zona: {
    flex: 1,
    justifyContent: "flex-end",
  },
  hoja: {
    gap: SPACING * 1.2,
    paddingHorizontal: SPACING * 2,
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
  texto: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    height: 50,
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 14,
    backgroundColor: DARK_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  inputError: {
    borderColor: PRIMARY,
  },
  inputTexto: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  error: {
    fontSize: 12,
    color: PRIMARY,
  },
  boton: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonApagado: {
    opacity: 0.3,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
  listo: {
    alignItems: "center",
    gap: SPACING,
    paddingVertical: SPACING,
  },
  listoIcono: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    marginBottom: SPACING / 2,
  },
});

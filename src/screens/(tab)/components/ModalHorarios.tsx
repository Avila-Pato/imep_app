import ConBordes from "@/components/ConBordes";
import EditorHorarios, { ordenarHorarios } from "@/components/EditorHorarios";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  LINEA,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { fijarHorarios, useHorarios, useIglesia } from "@/store/estudios";
import { HorarioCulto } from "@/types/typesAnuncios";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Hoja del cronograma (solo admin): cambiar los dias y horarios de culto
// de la iglesia activa. Se monta al abrirse, asi parte con lo guardado
export default function ModalHorarios({
  visible,
  onCerrar,
}: {
  visible: boolean;
  onCerrar: () => void;
}) {
  if (!visible) return null;
  return <Hoja onCerrar={onCerrar} />;
}

function Hoja({ onCerrar }: { onCerrar: () => void }) {
  const iglesia = useIglesia();
  const guardados = useHorarios();
  const [horarios, setHorarios] = useState<HorarioCulto[]>(guardados);

  const guardar = () => {
    fijarHorarios(ordenarHorarios(horarios));
    onCerrar();
  };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
    >
      <ConBordes>
        {(insets) => (
          <>
            <Pressable style={styles.fondo} onPress={onCerrar} />
            <KeyboardAvoidingView
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
                <ScrollView
                  contentContainerStyle={styles.contenido}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.cabecera}>
                    <View style={styles.flex}>
                      <Text style={styles.titulo}>Días de culto</Text>
                      {!!iglesia && (
                        <Text style={styles.subtitulo}>{iglesia.sede}</Text>
                      )}
                    </View>
                    <Pressable
                      onPress={onCerrar}
                      hitSlop={10}
                      accessibilityLabel="Cerrar"
                    >
                      <Octicons name="x" size={18} color={MUTED} />
                    </Pressable>
                  </View>
                  <Text style={styles.ayuda}>
                    El cronograma muestra estos días, y los turnos empiezan a
                    esta hora (si no les pones otra).
                  </Text>
                  <EditorHorarios horarios={horarios} onCambiar={setHorarios} />
                  <Pressable
                    onPress={guardar}
                    style={({ pressed }) => [
                      styles.boton,
                      pressed && styles.presionado,
                    ]}
                  >
                    <Text style={styles.botonTexto}>Guardar</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </>
        )}
      </ConBordes>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    maxHeight: "92%",
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
    backgroundColor: LINEA,
  },
  contenido: {
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    gap: SPACING * 1.2,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
  },
  titulo: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 22,
    color: TEXT,
  },
  subtitulo: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  ayuda: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  boton: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
    marginTop: SPACING / 2,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
});

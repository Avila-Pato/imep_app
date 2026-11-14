import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
  LINEA,
} from "@/constants/constans";
import {
  actualizarIglesia,
  agregarIglesia,
  fijarIglesia,
  useIglesia,
  useIglesias,
} from "@/store/estudios";
import { useState } from "react";
import Octicons from "@expo/vector-icons/Octicons";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ConBordes from "@/components/ConBordes";
import FormIglesia from "./FormIglesia";

// Hoja para que el pastor ponga o cambie la ubicacion de la iglesia,
// o sume otra (nueva) si dirige mas de una
export default function ModalIglesia({
  visible,
  onCerrar,
  nueva = false,
}: {
  visible: boolean;
  onCerrar: () => void;
  nueva?: boolean;
}) {
  const actual = useIglesia();
  // con varias iglesias: cual se esta editando (parte en la activa)
  const todas = useIglesias().filter((i) => !!i.id);
  const [elegidaId, setElegidaId] = useState<string | undefined>();
  const elegida =
    todas.find((i) => i.id === (elegidaId ?? actual?.id)) ?? actual;
  const iglesia = nueva ? undefined : elegida;
  const varias = !nueva && todas.length > 1;

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
    >
      <ConBordes>
        {(insets) => (
          <>
            <Pressable style={styles.fondo} onPress={onCerrar} />
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
                <ScrollView
                  contentContainerStyle={styles.contenido}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.cabecera}>
                    <Text style={styles.titulo}>
                      {nueva
                        ? "Agregar otra iglesia"
                        : iglesia
                          ? "Cambiar ubicación"
                          : "Ubicación de tu iglesia"}
                    </Text>
                    <Pressable
                      onPress={onCerrar}
                      hitSlop={10}
                      accessibilityLabel="Cerrar"
                    >
                      <Octicons name="x" size={18} color={MUTED} />
                    </Pressable>
                  </View>
                  {/* con varias: cual iglesia se cambia */}
                  {varias && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chips}
                    >
                      {todas.map((i) => {
                        const activo = i.id === iglesia?.id;
                        return (
                          <Pressable
                            key={i.id}
                            onPress={() => setElegidaId(i.id)}
                            style={[styles.chip, activo && styles.chipActivo]}
                            accessibilityState={{ selected: activo }}
                          >
                            <Text
                              style={[
                                styles.chipTexto,
                                activo && styles.chipTextoActivo,
                              ]}
                              numberOfLines={1}
                            >
                              {i.sede}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                  {/* key: al abrir de nuevo (o cambiar de iglesia) parte con lo guardado */}
                  <FormIglesia
                    key={`${visible}-${iglesia?.id ?? "nueva"}`}
                    inicial={iglesia}
                    textoBoton="Guardar"
                    onGuardar={(i) => {
                      if (nueva) agregarIglesia(i);
                      else if (iglesia?.id) actualizarIglesia(iglesia.id, i);
                      else fijarIglesia(i);
                      setElegidaId(undefined);
                      onCerrar();
                    }}
                  />
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
  chips: {
    gap: 6,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
  chipTextoActivo: {
    color: DARK_BG,
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
    backgroundColor: LINEA,
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

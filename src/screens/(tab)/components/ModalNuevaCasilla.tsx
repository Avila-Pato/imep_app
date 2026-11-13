import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
  PRIMARY,
  ELEVADO,
  PLACEHOLDER,
  LINEA,
} from "@/constants/constans";
import { crearRol, useRoles } from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ConBordes from "@/components/ConBordes";

const ICONOS: IconName[] = [
  "flame",
  "heart",
  "book",
  "megaphone",
  "mortar-board",
  "smiley",
  "device-camera-video",
  "light-bulb",
  "star",
  "hubot",
  "person",
  "shield",
];

// Hoja para agregar una casilla nueva al cronograma (ej: Devocional)
export default function ModalNuevaCasilla({
  visible,
  onCerrar,
  onCreada,
}: {
  visible: boolean;
  onCerrar: () => void;
  onCreada?: (id: string) => void; // para llevar la vista hasta la nueva
}) {
  const roles = useRoles();
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState<IconName>(ICONOS[0]);
  const limpio = nombre.trim().replace(/\s+/g, " ");
  // no repetir una que ya existe
  const repetida = roles.lista.some(
    (id) => roles.de(id).label.toLowerCase() === limpio.toLowerCase(),
  );
  const listo = limpio.length >= 2 && !repetida;

  const cerrar = () => {
    setNombre("");
    setIcono(ICONOS[0]);
    onCerrar();
  };

  const crear = () => {
    if (!listo) return;
    const id = crearRol({ label: limpio, icon: icono });
    cerrar();
    onCreada?.(id);
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
                <ScrollView
                  contentContainerStyle={styles.contenido}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.cabecera}>
                    <Text style={styles.titulo}>Nueva casilla</Text>
                    <Pressable
                      onPress={cerrar}
                      hitSlop={10}
                      accessibilityLabel="Cerrar"
                    >
                      <Octicons name="x" size={18} color={MUTED} />
                    </Pressable>
                  </View>
                  <Text style={styles.sub}>
                    Aparecerá en el cronograma de todos los cultos. Los días que
                    no haya, déjala sin asignar.
                  </Text>

                  {/* Vista previa, igual que en el cronograma */}
                  <View style={styles.previa}>
                    <View style={styles.previaIcono}>
                      <Octicons name={icono} size={16} color={TEXT} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.previaRol}>
                        {(limpio || "Devocional").toUpperCase()}
                      </Text>
                      <Text style={styles.previaPersona}>Sin asignar</Text>
                    </View>
                  </View>

                  <Text style={styles.etiqueta}>NOMBRE</Text>
                  <TextInput
                    value={nombre}
                    onChangeText={setNombre}
                    onSubmitEditing={crear}
                    placeholder="Ej: Devocional, Sonido, Niños"
                    placeholderTextColor={PLACEHOLDER}
                    autoCapitalize="sentences"
                    autoFocus
                    style={[styles.input, repetida && styles.inputError]}
                  />
                  {repetida && (
                    <Text style={styles.error}>Esa casilla ya existe.</Text>
                  )}

                  <Text style={styles.etiqueta}>ÍCONO</Text>
                  <View style={styles.opciones}>
                    {ICONOS.map((i) => (
                      <Pressable
                        key={i}
                        onPress={() => setIcono(i)}
                        style={[
                          styles.opcion,
                          i === icono && styles.opcionActiva,
                        ]}
                        accessibilityState={{ selected: i === icono }}
                      >
                        <Octicons
                          name={i}
                          size={18}
                          color={i === icono ? DARK_BG : TEXT}
                        />
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    onPress={crear}
                    disabled={!listo}
                    style={({ pressed }) => [
                      styles.boton,
                      !listo && styles.botonApagado,
                      pressed && styles.presionado,
                    ]}
                  >
                    <Text style={styles.botonTexto}>Agregar casilla</Text>
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
    maxHeight: "88%",
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
    gap: SPACING,
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
  sub: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  previa: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.2,
    marginVertical: SPACING / 2,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: LINEA,
  },
  previaIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ELEVADO,
  },
  previaRol: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: MUTED,
  },
  previaPersona: {
    fontSize: 15,
    fontWeight: "500",
    color: MUTED,
    marginTop: 2,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginTop: SPACING / 2,
  },
  input: {
    height: 46,
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 14,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    fontSize: 15,
    color: TEXT,
  },
  inputError: {
    borderColor: PRIMARY,
  },
  error: {
    fontSize: 12,
    color: PRIMARY,
  },
  opciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  opcion: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
  },
  opcionActiva: {
    backgroundColor: TEXT,
  },
  boton: {
    height: 52,
    marginTop: SPACING,
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
});

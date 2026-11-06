import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { crearSala } from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
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

// Opciones para la sala nueva
const ICONOS: IconName[] = [
  "people",
  "unmute",
  "heart",
  "book",
  "flame",
  "star",
  "globe",
  "home",
  "gift",
  "rocket",
];
const TONOS = [
  "#D8C8A8",
  "#B8C4CC",
  "#D5C1BF",
  "#C2CCB6",
  "#C9B7D6",
  "#E0B9A0",
];

// Hoja para que el pastor cree una sala (ej: Alabanza, Matrimonios)
export default function ModalNuevaSala({
  visible,
  onCerrar,
}: {
  visible: boolean;
  onCerrar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [icono, setIcono] = useState<IconName>(ICONOS[0]);
  const [tono, setTono] = useState(TONOS[0]);
  const listo = nombre.trim().length >= 2;

  const cerrar = () => {
    setNombre("");
    setDescripcion("");
    setIcono(ICONOS[0]);
    setTono(TONOS[0]);
    onCerrar();
  };

  const crear = () => {
    if (!listo) return;
    crearSala({
      label: nombre.trim(),
      descripcion: descripcion.trim() || `Sala de ${nombre.trim()}`,
      icono,
      tono,
    });
    cerrar();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={cerrar}
    >
      <Pressable style={styles.fondo} onPress={cerrar} />
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
              <Text style={styles.titulo}>Nueva sala</Text>
              <Pressable
                onPress={cerrar}
                hitSlop={10}
                accessibilityLabel="Cerrar"
              >
                <Octicons name="x" size={18} color={MUTED} />
              </Pressable>
            </View>

            {/* Vista previa */}
            <View style={styles.previa}>
              <View style={[styles.previaIcono, { backgroundColor: tono }]}>
                <Octicons name={icono} size={20} color={DARK_BG} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.previaNombre}>
                  {nombre.trim() || "Nombre de la sala"}
                </Text>
                <Text style={styles.meta}>
                  {descripcion.trim() || "Descripción corta"}
                </Text>
              </View>
            </View>

            <Text style={styles.etiqueta}>NOMBRE</Text>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Alabanza, Matrimonios"
              placeholderTextColor="#555555"
              autoCapitalize="sentences"
              style={styles.input}
            />

            <Text style={styles.etiqueta}>DESCRIPCIÓN</Text>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Ej: Equipo de música del culto"
              placeholderTextColor="#555555"
              style={styles.input}
            />

            <Text style={styles.etiqueta}>ÍCONO</Text>
            <View style={styles.opciones}>
              {ICONOS.map((i) => (
                <Pressable
                  key={i}
                  onPress={() => setIcono(i)}
                  style={[styles.opcion, i === icono && styles.opcionActiva]}
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

            <Text style={styles.etiqueta}>COLOR</Text>
            <View style={styles.opciones}>
              {TONOS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTono(t)}
                  style={[
                    styles.color,
                    { backgroundColor: t },
                    t === tono && styles.colorActivo,
                  ]}
                  accessibilityState={{ selected: t === tono }}
                />
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
              <Text style={styles.botonTexto}>Crear sala</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: "#3A3A3A",
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
  previa: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    marginVertical: SPACING / 2,
    borderRadius: 18,
    backgroundColor: DARK_BG,
  },
  previaIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  previaNombre: {
    fontFamily: FUENTE.semibold,
    fontSize: 16,
    color: TEXT,
  },
  meta: {
    fontSize: 12,
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
  color: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorActivo: {
    borderWidth: 3,
    borderColor: TEXT,
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

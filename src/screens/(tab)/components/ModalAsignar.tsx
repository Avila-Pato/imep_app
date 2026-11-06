import { MIEMBROS } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  MUTED,
  PRIMARY,
  ROLES,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { RolId } from "@/types/typesCronogramas";
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

// Toda la congregacion (sin repetir) para elegir quien sirve
const PERSONAS = [
  ...new Set([USUARIO.nombre, ...MIEMBROS.general.map((m) => m.nombre)]),
].sort((a, b) => a.localeCompare(b, "es"));

const sinTildes = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

type Props = {
  rol: RolId | null; // null = cerrado
  fecha: string; // "Domingo, 1 de noviembre"
  actual?: string; // persona asignada ahora
  onElegir: (persona: string | null) => void;
  onCerrar: () => void;
};

// Hoja para que el admin elija a la persona de un rol
export default function ModalAsignar({
  rol,
  fecha,
  actual,
  onElegir,
  onCerrar,
}: Props) {
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState("");
  const texto = busqueda.trim();
  const lista = PERSONAS.filter((p) => sinTildes(p).includes(sinTildes(texto)));
  // permite escribir a alguien que no esta en la lista (ej: predicador invitado)
  const nuevo =
    !!texto && !PERSONAS.some((p) => sinTildes(p) === sinTildes(texto));

  const elegir = (persona: string | null) => {
    onElegir(persona);
    setBusqueda("");
  };
  const cerrar = () => {
    onCerrar();
    setBusqueda("");
  };

  return (
    <Modal
      visible={!!rol}
      transparent
      animationType="slide"
      onRequestClose={cerrar}
    >
      <Pressable style={styles.fondo} onPress={cerrar} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.hojaZona}
      >
        {rol && (
          <View
            style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}
          >
            <View style={styles.asa} />

            <View style={styles.cabecera}>
              <View style={styles.icono}>
                <Octicons name={ROLES[rol].icon} size={16} color={TEXT} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.titulo}>{ROLES[rol].label}</Text>
                <Text style={styles.sub}>{fecha}</Text>
              </View>
              <Pressable
                onPress={cerrar}
                hitSlop={10}
                accessibilityLabel="Cerrar"
              >
                <Octicons name="x" size={18} color={MUTED} />
              </Pressable>
            </View>

            <View style={styles.buscador}>
              <Octicons name="search" size={14} color={MUTED} />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar o escribir un nombre"
                placeholderTextColor={MUTED}
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <ScrollView
              style={styles.lista}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {nuevo && (
                <Pressable
                  onPress={() => elegir(texto)}
                  style={({ pressed }) => [
                    styles.fila,
                    pressed && styles.presionado,
                  ]}
                >
                  <View style={styles.avatar}>
                    <Octicons name="plus" size={14} color={TEXT} />
                  </View>
                  <Text style={styles.nombre}>Asignar a “{texto}”</Text>
                </Pressable>
              )}
              {lista.map((p) => {
                const elegido = p === actual;
                return (
                  <Pressable
                    key={p}
                    onPress={() => elegir(p)}
                    style={({ pressed }) => [
                      styles.fila,
                      pressed && styles.presionado,
                    ]}
                    accessibilityState={{ selected: elegido }}
                  >
                    <View style={[styles.avatar, elegido && styles.avatarSel]}>
                      <Text
                        style={[
                          styles.avatarTexto,
                          elegido && styles.avatarTextoSel,
                        ]}
                      >
                        {p.charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.nombre}>{p}</Text>
                    {elegido && (
                      <Octicons name="check" size={16} color={TEXT} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {actual && (
              <Pressable
                onPress={() => elegir(null)}
                style={({ pressed }) => [
                  styles.quitar,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.quitarTexto}>Quitar a {actual}</Text>
              </Pressable>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.6,
  },
  fondo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  hojaZona: {
    flex: 1,
    justifyContent: "flex-end",
  },
  hoja: {
    maxHeight: "80%",
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    gap: SPACING * 1.4,
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
    gap: SPACING * 1.2,
  },
  icono: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
  },
  titulo: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
  },
  sub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    height: 44,
    paddingHorizontal: SPACING * 1.2,
    borderRadius: 12,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
  },
  lista: {
    flexGrow: 0,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  avatarSel: {
    backgroundColor: TEXT,
  },
  avatarTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
  },
  avatarTextoSel: {
    color: DARK_BG,
  },
  nombre: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  quitar: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  quitarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY,
  },
});

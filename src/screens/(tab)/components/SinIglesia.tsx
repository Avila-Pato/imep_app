import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
  PLACEHOLDER,
} from "@/constants/constans";
import { useUnirse } from "@/hooks/useUnirse";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

// En Inicio, cuando todavia no hay iglesia:
// - pastor: invita a poner la ubicacion de su iglesia
// - hermano: cuando se una con la invitacion vera aqui su iglesia
export default function SinIglesia({
  esPastor,
  alto,
  onAgregar,
}: {
  esPastor: boolean;
  alto: number;
  onAgregar: () => void;
}) {
  const unirse = useUnirse();
  const [invitando, setInvitando] = useState(false);
  const [enlace, setEnlace] = useState("");
  const [error, setError] = useState(false);

  const usar = async () => {
    if (!(await unirse(enlace))) setError(true);
  };

  return (
    <View style={[styles.tarjeta, { minHeight: alto }]}>
      {/* "mapa" de fondo: cuadricula suave */}
      <View style={styles.cuadricula} pointerEvents="none">
        {Array.from({ length: 6 }, (_, i) => (
          <View
            key={`h${i}`}
            style={[styles.lineaH, { top: `${(i + 1) * 15}%` }]}
          />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <View
            key={`v${i}`}
            style={[styles.lineaV, { left: `${(i + 1) * 15}%` }]}
          />
        ))}
      </View>

      <View style={styles.pin}>
        <View style={styles.pinHalo} />
        <View style={styles.pinPunto}>
          <Octicons
            name={esPastor ? "plus" : "home-fill"}
            size={14}
            color="#FFFFFF"
          />
        </View>
      </View>

      <Text style={styles.titulo}>
        {esPastor ? "¿Dónde está tu " : "Aquí verás tu "}
        <Text style={styles.cursiva}>iglesia</Text>
        {esPastor ? "?" : ""}
      </Text>
      <Text style={styles.texto}>
        {esPastor
          ? "Agrega la dirección para que los hermanos la vean en el mapa y sepan cómo llegar."
          : "Cuando te unas con la invitación de tu pastor, aparecerá la ubicación de tu iglesia."}
      </Text>

      {esPastor ? (
        <Pressable
          onPress={onAgregar}
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
        >
          <Octicons name="location" size={14} color={DARK_BG} />
          <Text style={styles.botonTexto}>Agregar ubicación</Text>
        </Pressable>
      ) : invitando ? (
        <View style={styles.form}>
          <View style={[styles.input, error && styles.inputError]}>
            <Octicons name="link" size={14} color={MUTED} />
            <TextInput
              value={enlace}
              onChangeText={(t) => {
                setEnlace(t);
                setError(false);
              }}
              onSubmitEditing={usar}
              placeholder="Pega el enlace o código"
              placeholderTextColor={PLACEHOLDER}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              style={styles.inputTexto}
            />
          </View>
          {error && (
            <Text style={styles.error}>
              Ese enlace no es válido. Pídele uno nuevo a tu pastor.
            </Text>
          )}
          <Pressable
            onPress={usar}
            disabled={!enlace.trim()}
            style={({ pressed }) => [
              styles.boton,
              !enlace.trim() && styles.botonApagado,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.botonTexto}>Unirme a mi iglesia</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setInvitando(true)}
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
        >
          <Octicons name="link" size={14} color={DARK_BG} />
          <Text style={styles.botonTexto}>Tengo una invitación</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING,
    padding: SPACING * 2.2,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
    overflow: "hidden",
  },
  presionado: {
    opacity: 0.7,
  },
  cuadricula: {
    ...StyleSheet.absoluteFill,
    opacity: 0.5,
  },
  lineaH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
  },
  lineaV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
  },
  pin: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING / 2,
  },
  pinHalo: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    opacity: 0.2,
  },
  pinPunto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 24,
    color: TEXT,
    textAlign: "center",
  },
  cursiva: {
    fontStyle: "italic",
    color: PRIMARY,
  },
  texto: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    textAlign: "center",
    marginBottom: SPACING / 2,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    paddingHorizontal: SPACING * 2,
    borderRadius: 14,
    backgroundColor: TEXT,
  },
  botonApagado: {
    opacity: 0.3,
  },
  botonTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: DARK_BG,
  },
  form: {
    alignSelf: "stretch",
    gap: SPACING,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    height: 46,
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
    fontSize: 14,
    color: TEXT,
  },
  error: {
    fontSize: 12,
    color: PRIMARY,
    textAlign: "center",
  },
});

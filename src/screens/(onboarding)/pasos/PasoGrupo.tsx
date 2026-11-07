import {
  BORDER,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { useUnirse } from "@/hooks/useUnirse";
import { useEstudios, useGrupos } from "@/store/estudios";
import { leerInvitacion } from "@/utils/invitacion";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

// Hermanos: unirse a su iglesia con la invitacion del pastor (opcional).
// Al unirse, en Inicio aparece el mapa con la ubicacion de la iglesia; si la
// invitacion es de un grupo, tambien entra a su sala
export default function PasoGrupo({ onSeguir }: { onSeguir: () => void }) {
  const [enlace, setEnlace] = useState("");
  const [error, setError] = useState(false);
  const grupos = useGrupos();
  const { codigos } = useEstudios();
  const unirse = useUnirse();
  // vista previa mientras escribe (a que iglesia/sala lo lleva)
  const { valida, grupo } = leerInvitacion(enlace, grupos, codigos);
  const nombreGrupo = grupos.find((g) => g.id === grupo)?.label;

  const usar = () => {
    if (!unirse(enlace)) return setError(true);
    onSeguir();
  };

  return (
    <Paso
      pie={
        <>
          <BotonPrincipal
            texto="Unirme a mi iglesia"
            onPress={usar}
            deshabilitado={!enlace.trim()}
          />
          <Pressable
            onPress={onSeguir}
            hitSlop={8}
            style={({ pressed }) => [
              styles.despues,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.despuesTexto}>Aún no tengo invitación</Text>
          </Pressable>
        </>
      }
    >
      <Titulo texto="Únete a tu " destacado="iglesia" />
      <Subtitulo>
        Si tu pastor o tu líder te envió un enlace de invitación, pégalo aquí.
        Verás la ubicación de tu iglesia y, si es de un grupo, entrarás a su
        sala.
      </Subtitulo>

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
          placeholderTextColor="#555555"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.inputTexto}
        />
      </View>
      {error ? (
        <Text style={styles.error}>
          Ese enlace no es válido. Pídele uno nuevo a tu pastor.
        </Text>
      ) : (
        valida && (
          <Text style={styles.ok}>
            {nombreGrupo
              ? `Invitación a tu iglesia y a ${nombreGrupo} ✓`
              : "Invitación a tu iglesia ✓"}
          </Text>
        )
      )}
    </Paso>
  );
}

const styles = StyleSheet.create({
  presionado: {
    opacity: 0.7,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    height: 52,
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: SURFACE,
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
  ok: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT,
  },
  despues: {
    alignItems: "center",
    paddingVertical: SPACING / 2,
  },
  despuesTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: MUTED,
  },
});

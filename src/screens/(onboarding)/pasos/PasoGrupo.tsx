import {
  BORDER,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  PLACEHOLDER,
} from "@/constants/constans";
import { useUnirse } from "@/hooks/useUnirse";
import { useVerificarCodigo } from "@/hooks/useVerificarCodigo";
import { guardarInvitacion, useEstudios } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

// Hermanos: unirse a su iglesia con la invitacion del pastor (opcional).
// Al unirse, en Inicio aparece el mapa con la ubicacion de la iglesia; si la
// invitacion es de un grupo, tambien entra a su sala
// El codigo se revisa en el servidor: si no existe, no deja unirse
export default function PasoGrupo({ onSeguir }: { onSeguir: () => void }) {
  // si llego por un enlace de invitacion, el codigo ya viene escrito
  const { invitacion } = useEstudios();
  const [enlace, setEnlace] = useState(invitacion ?? "");
  const [error, setError] = useState(false);
  const [uniendo, setUniendo] = useState(false);
  const unirse = useUnirse();
  // vista previa mientras escribe (a que iglesia/sala lo lleva)
  const revision = useVerificarCodigo(enlace);
  const valida = revision.estado === "valido";

  const usar = async () => {
    if (!valida || uniendo) return;
    setUniendo(true);
    const r = await unirse(enlace);
    setUniendo(false);
    if (!r) return setError(true);
    guardarInvitacion(null);
    onSeguir();
  };

  return (
    <Paso
      pie={
        <>
          <BotonPrincipal
            texto={uniendo ? "Uniéndote…" : "Unirme a mi iglesia"}
            onPress={usar}
            deshabilitado={!valida || uniendo}
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

      <View
        style={[
          styles.input,
          (error || revision.estado === "invalido") && styles.inputError,
        ]}
      >
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
          style={styles.inputTexto}
        />
      </View>
      {revision.estado === "revisando" ? (
        <View style={styles.fila}>
          <ActivityIndicator size="small" color={MUTED} />
          <Text style={styles.revisando}>Revisando el código…</Text>
        </View>
      ) : error || revision.estado === "invalido" ? (
        <Text style={styles.error}>
          Este código no existe. Revisa que esté bien escrito o pídele uno nuevo
          a tu pastor.
        </Text>
      ) : (
        valida && (
          <Text style={styles.ok}>
            {`Te unirás a ${revision.iglesia ?? "tu iglesia"}${
              revision.sala ? ` y a la sala ${revision.sala}` : ""
            } ✓`}
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
    lineHeight: 17,
    color: PRIMARY,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  revisando: {
    fontSize: 12,
    color: MUTED,
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

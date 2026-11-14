import {
  BORDER,
  FUENTE,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { entrarConGoogle, miCuenta } from "@/services/cuenta";
import { conectado } from "@/services/iglesias";
import { conectarCuenta, sincronizarIglesias } from "@/store/estudios";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Perfil, para quien eligio "Crear mi cuenta después": una fila discreta para
// guardar su progreso con Google. Vincula lo que ya hizo (sus iglesias, su
// rol); si ese Google ya tenia cuenta, entra a ella
export default function TarjetaGoogle() {
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState(false);

  // sin servidor (modo de prueba) no hay cuentas
  if (!conectado()) return null;

  const google = async () => {
    setError(false);
    setEntrando(true);
    try {
      if ((await entrarConGoogle()) === "cancelado") return;
      const cuenta = await miCuenta();
      if (cuenta) conectarCuenta(cuenta);
      await sincronizarIglesias();
    } catch (e) {
      console.warn("[supabase]", (e as Error)?.message ?? e);
      setError(true);
    } finally {
      setEntrando(false);
    }
  };

  return (
    <View style={styles.caja}>
      <Pressable
        onPress={google}
        disabled={entrando}
        style={({ pressed }) => [
          styles.fila,
          (pressed || entrando) && styles.presionado,
        ]}
        accessibilityLabel="Guardar mi cuenta con Google"
      >
        <View style={styles.icono}>
          {entrando ? (
            <ActivityIndicator size="small" color="#121212" />
          ) : (
            <FontAwesome name="google" size={14} color="#121212" />
          )}
        </View>
        <View style={styles.flex}>
          <Text style={styles.titulo}>Guarda tu cuenta con Google</Text>
          <Text style={styles.texto} numberOfLines={1}>
            Para no perder tu iglesia si cambias de teléfono
          </Text>
        </View>
        <Text style={styles.accion}>Entrar</Text>
      </Pressable>
      {error && (
        <Text style={styles.error}>
          No se pudo entrar con Google. Inténtalo de nuevo.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // el mismo margen a los lados que el resto del Perfil
  caja: {
    marginHorizontal: PADDING,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingVertical: SPACING,
    paddingHorizontal: SPACING * 1.2,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  icono: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  titulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
  },
  texto: {
    fontFamily: FUENTE.medium,
    fontSize: 11,
    color: MUTED,
  },
  accion: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: TEXT,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: PRIMARY,
    textAlign: "center",
  },
});

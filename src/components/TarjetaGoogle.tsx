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
  // el texto completo se despliega con "Ver más"
  const [abierto, setAbierto] = useState(false);

  // sin servidor (modo de prueba) no hay cuentas
  if (!conectado()) return null;

  const google = async () => {
    setError(false);
    setEntrando(true);
    try {
      if ((await entrarConGoogle()) === "cancelado") return;
      const cuenta = await miCuenta();
      if (cuenta) await conectarCuenta(cuenta);
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
      <View style={styles.fila}>
        <View style={styles.icono}>
          {entrando ? (
            <ActivityIndicator size="small" color="#121212" />
          ) : (
            <FontAwesome name="google" size={14} color="#121212" />
          )}
        </View>
        {/* tocar el texto lo despliega (sin entrar a Google) */}
        <Pressable
          onPress={() => setAbierto((a) => !a)}
          style={styles.flex}
          accessibilityRole="button"
          accessibilityState={{ expanded: abierto }}
          accessibilityLabel={abierto ? "Ver menos" : "Ver más"}
        >
          <Text style={styles.titulo}>Guarda tu cuenta con Google</Text>
          <Text style={styles.texto} numberOfLines={abierto ? undefined : 1}>
            Guarda tu perfil y tu iglesia: si reinicias o cambias de teléfono,
            entras con Google y vuelve todo.
            {abierto &&
              "\n\nSin una cuenta guardada, al reiniciar la app se borra todo: tu nombre, tu foto y tu iglesia, y tendrás que unirte otra vez con una invitación."}
          </Text>
          <Text style={styles.verMas}>{abierto ? "Ver menos" : "Ver más"}</Text>
        </Pressable>
        <Pressable
          onPress={google}
          disabled={entrando}
          hitSlop={8}
          style={({ pressed }) => [
            styles.boton,
            (pressed || entrando) && styles.presionado,
          ]}
          accessibilityLabel="Guardar mi cuenta con Google"
        >
          <Text style={styles.accion}>Entrar</Text>
        </Pressable>
      </View>
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
  verMas: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    color: TEXT,
    marginTop: 2,
    textDecorationLine: "underline",
  },
  boton: {
    alignSelf: "center",
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

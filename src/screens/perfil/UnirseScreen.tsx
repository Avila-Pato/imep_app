import {
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  TEXT,
  LINEA,
} from "@/constants/constans";
import { Unido, useUnirse } from "@/hooks/useUnirse";
import { useIglesia } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Se abre con el enlace del pastor: congrega://unirse/4K7Q
export default function UnirseScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const unirse = useUnirse();
  const iglesia = useIglesia();
  // undefined = preguntando al servidor; null = el codigo no sirve
  const [unido, setUnido] = useState<Unido | null>();
  const ok = !!unido;
  const sala = unido?.sala;

  // se une una sola vez al abrir el enlace
  useEffect(() => {
    let vivo = true;
    unirse(codigo ?? "").then((r) => vivo && setUnido(r));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir
  }, [codigo]);

  if (unido === undefined) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centro}>
          <ActivityIndicator color={MUTED} />
          <Text style={styles.texto}>Uniéndote a tu iglesia…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centro}>
        <View style={[styles.icono, !ok && styles.iconoError]}>
          <Octicons name={ok ? "check" : "x"} size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.titulo}>
          {ok ? "¡Bienvenido!" : "Código no válido"}
        </Text>
        <Text style={styles.texto}>
          {ok
            ? `Te uniste a ${unido.iglesia ?? iglesia?.sede ?? "tu iglesia"}${
                sala ? ` y a la sala de ${sala}` : ""
              }.`
            : "Este enlace ya no sirve o está incompleto. Pídele uno nuevo a tu pastor."}
        </Text>
        <Pressable
          onPress={() => router.replace("/" as Href)}
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
        >
          <Text style={styles.botonTexto}>Ir al inicio</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING * 1.2,
    paddingHorizontal: SPACING * 3,
  },
  icono: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    marginBottom: SPACING,
  },
  iconoError: {
    backgroundColor: LINEA,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 30,
    color: TEXT,
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    textAlign: "center",
  },
  boton: {
    marginTop: SPACING * 1.6,
    paddingHorizontal: SPACING * 3,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 16,
    color: DARK_BG,
  },
  presionado: {
    opacity: 0.7,
  },
});

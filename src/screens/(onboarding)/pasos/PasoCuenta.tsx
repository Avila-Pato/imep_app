import {
  BORDER,
  DARK_BG,
  MUTED,
  SPACING,
  TEXT,
  PLACEHOLDER,
} from "@/constants/constans";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BotonPrincipal, estilosPaso, Paso, Subtitulo, Titulo } from "./ui";

const correoValido = (c: string) => /^\S+@\S+\.\S+$/.test(c.trim());

// Crear cuenta. Mock: todavia no hay backend, los tres caminos siguen al
// proximo paso (luego: registro real, login con Google y modo invitado)
export default function PasoCuenta({ onSeguir }: { onSeguir: () => void }) {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const listo = correoValido(correo) && clave.length >= 6;

  return (
    <Paso>
      <Titulo texto="Crea tu " destacado="cuenta." centrado />
      <Subtitulo centrado>
        Guarda tu progreso y mantente conectado con tu iglesia.
      </Subtitulo>

      <View style={styles.campos}>
        <View style={styles.campo}>
          <Text style={estilosPaso.etiqueta}>CORREO ELECTRÓNICO</Text>
          <TextInput
            value={correo}
            onChangeText={setCorreo}
            placeholder="hola@ejemplo.com"
            placeholderTextColor={PLACEHOLDER}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
          />
        </View>

        <View style={styles.campo}>
          <Text style={estilosPaso.etiqueta}>CONTRASEÑA</Text>
          <View style={styles.fila}>
            <TextInput
              value={clave}
              onChangeText={setClave}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={PLACEHOLDER}
              secureTextEntry={!verClave}
              autoCapitalize="none"
              autoComplete="new-password"
              style={[styles.input, styles.flex, styles.sinLinea]}
            />
            <Pressable
              onPress={() => setVerClave((v) => !v)}
              hitSlop={10}
              accessibilityLabel={
                verClave ? "Ocultar contraseña" : "Ver contraseña"
              }
            >
              <Octicons
                name={verClave ? "eye-closed" : "eye"}
                size={18}
                color={MUTED}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <BotonPrincipal
        texto="Crear cuenta"
        onPress={onSeguir}
        deshabilitado={!listo}
      />

      <View style={styles.separador}>
        <View style={styles.linea} />
        <Text style={styles.o}>o</Text>
        <View style={styles.linea} />
      </View>

      <Pressable
        onPress={onSeguir}
        style={({ pressed }) => [styles.google, pressed && styles.presionado]}
      >
        <FontAwesome name="google" size={16} color={DARK_BG} />
        <Text style={styles.googleTexto}>Continuar con Google</Text>
      </Pressable>

      <Pressable
        onPress={onSeguir}
        hitSlop={8}
        style={({ pressed }) => [styles.invitado, pressed && styles.presionado]}
      >
        <Octicons name="person" size={15} color={MUTED} />
        <Text style={styles.invitadoTexto}>Entrar como invitado</Text>
      </Pressable>
    </Paso>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  campos: {
    gap: SPACING * 2.2,
    marginVertical: SPACING * 2,
  },
  campo: {
    gap: 6,
  },
  // campo con linea abajo (como en la referencia)
  input: {
    paddingVertical: 10,
    fontSize: 16,
    color: TEXT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  // la linea la pone la fila (incluye el ojo)
  sinLinea: {
    borderBottomWidth: 0,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  separador: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    marginVertical: SPACING / 2,
  },
  linea: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
  },
  o: {
    fontSize: 12,
    color: MUTED,
  },
  google: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  googleTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: "#121212",
  },
  invitado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: SPACING,
  },
  invitadoTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: MUTED,
  },
});

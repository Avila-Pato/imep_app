import {
  DARK_BG,
  FUENTE,
  MUTED,
  HOME_PADDING as PADDING,
  PRIMARY,
  SERIF,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

// Titulo del paso: "Crea tu " + palabra destacada en rojo y cursiva
export function Titulo({
  texto,
  destacado,
  centrado,
}: {
  texto: string;
  destacado: string;
  centrado?: boolean;
}) {
  return (
    <Text style={[styles.titulo, centrado && styles.centrado]}>
      {texto}
      <Text style={styles.destacado}>{destacado}</Text>
    </Text>
  );
}

export function Subtitulo({
  children,
  centrado,
}: {
  children: ReactNode;
  centrado?: boolean;
}) {
  return (
    <Text style={[styles.subtitulo, centrado && styles.centrado]}>
      {children}
    </Text>
  );
}

// Boton grande blanco (el principal de cada paso)
export function BotonPrincipal({
  texto,
  onPress,
  deshabilitado,
}: {
  texto: string;
  onPress: () => void;
  deshabilitado?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        styles.boton,
        deshabilitado && styles.botonApagado,
        pressed && styles.presionado,
      ]}
    >
      <Text style={styles.botonTexto}>{texto}</Text>
    </Pressable>
  );
}

// Contenedor de un paso: contenido arriba (con scroll) y el boton abajo
export function Paso({
  children,
  pie,
}: {
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <View style={styles.paso}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {pie && <View style={styles.pie}>{pie}</View>}
    </View>
  );
}

export const estilosPaso = StyleSheet.create({
  // texto chico en mayusculas sobre los campos ("CORREO ELECTRÓNICO")
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
});

const styles = StyleSheet.create({
  paso: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    paddingHorizontal: PADDING,
    paddingTop: SPACING * 3,
    paddingBottom: SPACING * 2,
    gap: SPACING * 1.2,
  },
  pie: {
    paddingHorizontal: PADDING,
    paddingBottom: SPACING * 1.6,
    gap: SPACING * 1.2,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 34,
    lineHeight: 40,
    color: TEXT,
  },
  destacado: {
    fontStyle: "italic",
    color: PRIMARY,
  },
  centrado: {
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
  },
  boton: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonApagado: {
    opacity: 0.25,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
  presionado: {
    opacity: 0.7,
  },
});

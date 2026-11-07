import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  HOME_PADDING as PADDING,
  SERIF,
  SPACING,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TEXTO_VERSION } from "@/utils/version";

// Pagina de informacion (Privacidad, Ayuda): cabecera con volver,
// titulo grande, bajada y el contenido con scroll
export default function PaginaInfo({
  titulo,
  etiqueta,
  bajada,
  children,
}: {
  titulo: string;
  etiqueta: string;
  bajada: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.cabecera}>
        <Pressable
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/perfil" as Href)
          }
          hitSlop={10}
          accessibilityLabel="Volver"
        >
          <Octicons name="arrow-left" size={20} color={TEXT} />
        </Pressable>
        <Text style={styles.cabeceraTitulo}>{titulo}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.bajada}>{bajada}</Text>
        {children}
        <Text style={styles.version}>{TEXTO_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Un apartado: titulo chico + parrafos o lista
export function Apartado({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.apartado}>
      <Text style={styles.apartadoTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

export function Parrafo({ children }: { children: ReactNode }) {
  return <Text style={styles.parrafo}>{children}</Text>;
}

// Punto de una lista, con titulo opcional en negrita
export function Punto({
  titulo,
  children,
}: {
  titulo?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.punto}>
      <View style={styles.vineta} />
      <Text style={[styles.parrafo, styles.flex]}>
        {titulo && <Text style={styles.negrita}>{titulo} </Text>}
        {children}
      </Text>
    </View>
  );
}

export const estilosInfo = StyleSheet.create({
  negrita: {
    fontFamily: FUENTE.semibold,
    color: TEXT,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.4,
    paddingHorizontal: PADDING,
    paddingVertical: SPACING,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  cabeceraTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
  },
  contenido: {
    padding: PADDING,
    paddingBottom: SPACING * 6,
    gap: SPACING * 1.2,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 32,
    lineHeight: 38,
    color: TEXT,
  },
  bajada: {
    fontSize: 15,
    lineHeight: 23,
    color: MUTED,
    marginBottom: SPACING,
  },
  apartado: {
    gap: SPACING,
    paddingTop: SPACING * 1.6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  apartadoTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 17,
    color: TEXT,
  },
  parrafo: {
    fontSize: 14,
    lineHeight: 22,
    color: MUTED,
  },
  negrita: {
    fontFamily: FUENTE.semibold,
    color: TEXT,
  },
  punto: {
    flexDirection: "row",
    gap: SPACING,
  },
  version: {
    marginTop: SPACING * 3,
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
  vineta: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 9,
    backgroundColor: MUTED,
  },
});

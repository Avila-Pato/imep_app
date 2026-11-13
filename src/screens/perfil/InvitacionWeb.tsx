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
} from "@/constants/constans";
import { extraerCodigo } from "@/services/iglesias";
import { codigoVisible, PLAY_STORE } from "@/utils/invitacion";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

// Pagina web del enlace de invitacion (quien aun no tiene la app, o abrio
// el enlace en el computador): abrir la app, descargarla o copiar el codigo
export default function InvitacionWeb() {
  const { codigo: crudo, dev } = useLocalSearchParams<{
    codigo: string;
    dev?: string;
  }>();
  const codigo = extraerCodigo(crudo ?? "");
  // modo prueba: el pastor compartio desde Expo Go (solo enlaces exp://)
  const expoGo = dev?.startsWith("exp://") ? dev : null;
  const [copiado, setCopiado] = useState(false);

  const abrirApp = () => {
    if (!codigo) return;
    const android = /android/i.test(navigator.userAgent);
    // Android: abre la app si esta; si no, va a Google Play
    const url = android
      ? `intent://unirse/${codigo}#Intent;scheme=congrega;package=com.avilapato.congrega;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE)};end`
      : `congrega://unirse/${codigo}`;
    window.location.href = url;
  };

  const copiar = async () => {
    if (!codigo) return;
    await Clipboard.setStringAsync(codigoVisible(codigo));
    setCopiado(true);
  };

  return (
    <View style={styles.pagina}>
      <View style={styles.tarjeta}>
        <View style={styles.icono}>
          <Octicons name="people" size={26} color="#FFFFFF" />
        </View>
        <Text style={styles.titulo}>
          Te invitaron a <Text style={styles.cursiva}>tu iglesia</Text>
        </Text>
        <Text style={styles.texto}>
          {codigo
            ? "Abre Congrega para unirte: verás los anuncios, tus turnos de servicio y las salas de tu iglesia."
            : "Este enlace está incompleto. Pídele uno nuevo a tu pastor."}
        </Text>

        {codigo && (
          <>
            {expoGo && (
              <Pressable
                onPress={() => {
                  window.location.href = expoGo;
                }}
                style={({ pressed }) => [
                  styles.boton,
                  styles.botonPrueba,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={[styles.botonTexto, styles.botonPruebaTexto]}>
                  Abrir en Expo Go (prueba)
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={abrirApp}
              style={({ pressed }) => [
                styles.boton,
                pressed && styles.presionado,
              ]}
            >
              <Text style={styles.botonTexto}>Abrir en la app</Text>
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL(PLAY_STORE)}
              style={({ pressed }) => [
                styles.botonSecundario,
                pressed && styles.presionado,
              ]}
            >
              <FontAwesome name="play" size={13} color={TEXT} />
              <Text style={styles.botonSecundarioTexto}>
                Descargar en Google Play
              </Text>
            </Pressable>

            <View style={styles.separador} />

            <Text style={styles.ayuda}>
              ¿Ya instalaste la app? Escribe este código en el paso «Únete a tu
              iglesia» o en Perfil → Tengo un código:
            </Text>
            <Pressable
              onPress={copiar}
              style={({ pressed }) => [
                styles.codigo,
                pressed && styles.presionado,
              ]}
              accessibilityLabel="Copiar código"
            >
              <Text style={styles.codigoTexto}>{codigoVisible(codigo)}</Text>
              <Octicons
                name={copiado ? "check" : "copy"}
                size={16}
                color={copiado ? PRIMARY : MUTED}
              />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: {
    flex: 1,
    minHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING * 1.6,
    backgroundColor: DARK_BG,
  },
  tarjeta: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: SPACING * 1.4,
    padding: SPACING * 2.4,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  presionado: {
    opacity: 0.7,
  },
  icono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 28,
    color: TEXT,
    textAlign: "center",
  },
  cursiva: {
    fontStyle: "italic",
    color: PRIMARY,
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    textAlign: "center",
  },
  boton: {
    alignSelf: "stretch",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
    marginTop: SPACING / 2,
  },
  botonPrueba: {
    backgroundColor: PRIMARY,
  },
  botonPruebaTexto: {
    color: "#FFFFFF",
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
  botonSecundario: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: SPACING,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  botonSecundarioTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
  separador: {
    alignSelf: "stretch",
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginVertical: SPACING / 2,
  },
  ayuda: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    textAlign: "center",
  },
  codigo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 1.6,
    paddingVertical: SPACING,
    borderRadius: 14,
    backgroundColor: DARK_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  codigoTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 18,
    letterSpacing: 2,
    color: TEXT,
  },
});

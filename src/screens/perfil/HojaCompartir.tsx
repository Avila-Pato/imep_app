import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  LINEA,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { capturarWeb, compartirImagenWeb } from "@/utils/compartirImagen";
import TarjetaInvitacion from "./TarjetaInvitacion";

// Al tocar "Compartir" una invitacion: elegir como mandarla
//  - el codigo (mensaje con el enlace, las 4 letras y donde escribirlas)
//  - la tarjeta de invitacion como imagen: el QR, el codigo y un dibujo de
//    donde se escribe (para WhatsApp, imprimir o mostrar en el culto)
export default function HojaCompartir({
  codigo,
  mensaje,
  titulo,
  iglesia,
  sala,
  onCerrar,
}: {
  codigo: string;
  mensaje: string; // texto con el enlace y el codigo
  titulo: string; // "Imep" o "Imep · sala Jóvenes"
  iglesia: string; // su nombre (va en la tarjeta)
  sala?: string; // invitacion a una sala
  onCerrar: () => void;
}) {
  const tarjeta = useRef<View>(null);
  const [preparando, setPreparando] = useState(false);
  const [error, setError] = useState(false);
  const enWeb = Platform.OS === "web";
  // en la web del computador la tarjeta se descarga (no hay menu de compartir)
  const [descargada, setDescargada] = useState(false);

  const enviarCodigo = () => {
    onCerrar();
    Share.share({ message: mensaje }).catch(() => {});
  };

  // la tarjeta de la vista previa se "fotografia" en alta calidad (1080 px)
  const enviarTarjeta = async () => {
    if (!tarjeta.current) return;
    setError(false);
    setPreparando(true);
    try {
      if (enWeb) {
        // web: la imagen y el texto juntos en el telefono; descarga en el PC
        const dataUrl = await capturarWeb(tarjeta.current);
        const r = await compartirImagenWeb(
          dataUrl,
          `invitacion-${codigo}.png`,
          mensaje,
        );
        if (r === "compartido") onCerrar();
        if (r === "descargado") setDescargada(true);
        return;
      }
      const uri = await captureRef(tarjeta, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: 1080 / PixelRatio.get(),
      });
      // la imagen con el mensaje (enlace + codigo) como texto: en WhatsApp
      // llega en un solo mensaje. Sin el modulo (Expo Go): solo la imagen
      let Compartir: typeof import("react-native-share").default | null = null;
      try {
        Compartir = (await import("react-native-share")).default;
      } catch {}
      if (Compartir) {
        const r = await Compartir.open({
          url: uri.startsWith("file://") ? uri : `file://${uri}`,
          type: "image/png",
          message: mensaje,
          title: `Invitación a ${titulo}`,
          failOnCancel: false,
        });
        if (!r.dismissedAction) onCerrar();
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Invitación a ${titulo}`,
      });
      onCerrar();
    } catch (e) {
      console.warn("[compartir tarjeta]", (e as Error)?.message ?? e);
      setError(true);
    } finally {
      setPreparando(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <ConBordes>
        {(insets) => (
          <View style={styles.fondo}>
            <Pressable style={styles.flex} onPress={onCerrar} />
            <View
              style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}
            >
              <View style={styles.asa} />
              <Text style={styles.titulo}>Compartir invitación</Text>
              <Text style={styles.sub}>{titulo}</Text>

              {/* la tarjeta (es la imagen que se manda) */}
              <ScrollView
                style={styles.previa}
                contentContainerStyle={styles.previaContenido}
                showsVerticalScrollIndicator={false}
              >
                <TarjetaInvitacion
                  ref={tarjeta}
                  codigo={codigo}
                  iglesia={iglesia}
                  sala={sala}
                />
              </ScrollView>

              <Opcion
                icono="link"
                titulo="Enviar el código"
                texto="Un mensaje con el enlace, las 4 letras y dónde escribirlas"
                onPress={enviarCodigo}
              />
              <Opcion
                icono="image"
                titulo="Enviar la tarjeta de invitación"
                texto={
                  enWeb
                    ? "Esta imagen junto al mensaje con el código"
                    : "Esta imagen junto al mensaje con el código"
                }
                onPress={enviarTarjeta}
                cargando={preparando}
              />
              {descargada && (
                <Text style={styles.aviso}>
                  Imagen descargada. Adjúntala en WhatsApp junto al código.
                </Text>
              )}
              {error && (
                <Text style={styles.error}>
                  No se pudo preparar la imagen. Inténtalo de nuevo.
                </Text>
              )}
            </View>
          </View>
        )}
      </ConBordes>
    </Modal>
  );
}

function Opcion({
  icono,
  titulo,
  texto,
  onPress,
  cargando,
}: {
  icono: "link" | "image";
  titulo: string;
  texto: string;
  onPress: () => void;
  cargando?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      style={({ pressed }) => [styles.opcion, pressed && styles.presionado]}
    >
      <View style={styles.opcionIcono}>
        {cargando ? (
          <ActivityIndicator size="small" color={TEXT} />
        ) : (
          <Octicons name={icono} size={18} color={TEXT} />
        )}
      </View>
      <View style={styles.flex}>
        <Text style={styles.opcionTitulo}>{titulo}</Text>
        <Text style={styles.opcionTexto}>{texto}</Text>
      </View>
      <Octicons name="chevron-right" size={14} color={MUTED} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  fondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  hoja: {
    gap: SPACING,
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: LINEA,
  },
  titulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 18,
    color: TEXT,
  },
  sub: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: MUTED,
    marginTop: -6,
  },
  // la vista previa no tapa las opciones en telefonos chicos
  previa: {
    maxHeight: 420,
    marginVertical: SPACING / 2,
  },
  previaContenido: {
    alignItems: "center",
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.2,
    borderRadius: 16,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  opcionIcono: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  opcionTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  opcionTexto: {
    marginTop: 2,
    fontFamily: FUENTE.medium,
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
  },
  error: {
    fontSize: 12,
    color: PRIMARY,
    textAlign: "center",
  },
  aviso: {
    fontFamily: FUENTE.medium,
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
});

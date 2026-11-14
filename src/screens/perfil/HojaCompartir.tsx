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
import { enlaceDeCodigo } from "@/utils/invitacion";
import Octicons from "@expo/vector-icons/Octicons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

type QrRef = { toDataURL: (cb: (base64: string) => void) => void };

// Al tocar "Compartir" una invitacion: elegir como mandarla
//  - el codigo (mensaje con el enlace y las 4 letras)
//  - la imagen del codigo QR (para imprimir o mostrar en el culto)
export default function HojaCompartir({
  codigo,
  mensaje,
  titulo,
  onCerrar,
}: {
  codigo: string;
  mensaje: string; // texto con el enlace y el codigo
  titulo: string; // "Imep" o "Imep · sala Jóvenes"
  onCerrar: () => void;
}) {
  const qr = useRef<QrRef | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [error, setError] = useState(false);
  // la imagen del QR solo en el telefono (en la web no hay archivo que mandar)
  const conImagen = Platform.OS !== "web";

  const enviarCodigo = () => {
    onCerrar();
    Share.share({ message: mensaje }).catch(() => {});
  };

  const enviarQr = () => {
    if (!qr.current) return;
    setError(false);
    setPreparando(true);
    qr.current.toDataURL(async (base64) => {
      try {
        const archivo = new File(Paths.cache, `invitacion-${codigo}.png`);
        if (archivo.exists) archivo.delete();
        archivo.create();
        archivo.write(base64, { encoding: "base64" });
        await Sharing.shareAsync(archivo.uri, {
          mimeType: "image/png",
          dialogTitle: `Invitación a ${titulo}`,
        });
        onCerrar();
      } catch (e) {
        console.warn("[compartir qr]", (e as Error)?.message ?? e);
        setError(true);
      } finally {
        setPreparando(false);
      }
    });
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

              {/* el QR (tambien es lo que se manda como imagen) */}
              <View style={styles.qrCaja}>
                <QRCode
                  value={enlaceDeCodigo(codigo)}
                  size={150}
                  color="#121212"
                  backgroundColor="#FFFFFF"
                  quietZone={12}
                  getRef={(r) => {
                    qr.current = r as unknown as QrRef;
                  }}
                />
                <Text style={styles.codigo}>{codigo}</Text>
              </View>

              <Opcion
                icono="link"
                titulo="Enviar el código"
                texto="Un mensaje con el enlace y las 4 letras (WhatsApp, SMS…)"
                onPress={enviarCodigo}
              />
              {conImagen && (
                <Opcion
                  icono="image"
                  titulo="Enviar el código QR"
                  texto="Como imagen: para imprimir o mostrar en el culto"
                  onPress={enviarQr}
                  cargando={preparando}
                />
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
  qrCaja: {
    alignSelf: "center",
    alignItems: "center",
    gap: 6,
    padding: SPACING,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    marginVertical: SPACING / 2,
  },
  codigo: {
    fontFamily: FUENTE.semibold,
    fontSize: 18,
    letterSpacing: 4,
    color: "#121212",
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
});

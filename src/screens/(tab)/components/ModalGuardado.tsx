import {
  BORDER,
  DARK_BG,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  cita: string;
  mensaje?: string; // por defecto: "Tu estudio de {cita} quedó guardado…"
  textoCerrar?: string; // por defecto: "Seguir aquí"
  onCerrar: () => void;
  onVerPerfil: () => void;
};

// Aviso despues de guardar un estudio en el perfil
export default function ModalGuardado({
  visible,
  cita,
  mensaje,
  textoCerrar = "Seguir aquí",
  onCerrar,
  onVerPerfil,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <Pressable style={styles.fondo} onPress={onCerrar}>
        {/* evita que tocar la tarjeta cierre el modal */}
        <Pressable style={styles.tarjeta} onPress={() => {}}>
          <View style={styles.icono}>
            <Octicons name="check" size={22} color={DARK_BG} />
          </View>
          <Text style={styles.titulo}>
            Guardado <Text style={styles.cursiva}>correctamente</Text>
          </Text>
          <Text style={styles.sub}>
            {mensaje ?? `Tu estudio de ${cita} quedó guardado en tu perfil.`}
          </Text>

          <Pressable
            onPress={onVerPerfil}
            style={({ pressed }) => [
              styles.boton,
              styles.botonPrincipal,
              pressed && styles.presionado,
            ]}
          >
            <Text style={[styles.botonTexto, styles.botonTextoPrincipal]}>
              Ver mi perfil
            </Text>
          </Pressable>
          <Pressable
            onPress={onCerrar}
            style={({ pressed }) => [
              styles.boton,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.botonTexto}>{textoCerrar}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING * 2.4,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  tarjeta: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: SPACING,
    padding: SPACING * 2.4,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  icono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
    marginBottom: SPACING / 2,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 24,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    textAlign: "center",
    marginBottom: SPACING,
  },
  boton: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: SPACING * 1.3,
    borderRadius: 999,
  },
  botonPrincipal: {
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: "500",
    color: MUTED,
  },
  botonTextoPrincipal: {
    fontWeight: "600",
    color: DARK_BG,
  },
  presionado: {
    opacity: 0.6,
  },
});

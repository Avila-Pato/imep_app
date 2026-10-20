import {
  BORDER,
  DARK_BG,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { Mensaje } from "@/types/typesComunidad";
import { Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import PasajeTexto from "../../(tab)/components/PasajeTexto";

type Props = {
  mensaje: Mensaje | null; // mensaje del chat con su versiculo
  onCerrar: () => void;
};

// Al tocar la cita de un mensaje: muestra la palabra que eligio el hermano
export default function ModalVersiculo({ mensaje, onCerrar }: Props) {
  const cita = mensaje?.cita ?? "";
  const pasaje = usePasaje(cita);
  // sin internet: el texto que se guardo al enviar
  const sinConexion = !!pasaje.error && !!mensaje?.versiculo;

  return (
    <Modal
      visible={!!mensaje}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <Pressable style={styles.fondo} onPress={onCerrar}>
        {/* tocar dentro de la tarjeta no la cierra */}
        <Pressable style={styles.tarjeta} onPress={() => {}}>
          <Text style={styles.etiqueta}>
            {mensaje?.autor.toUpperCase()} ELIGIÓ
          </Text>
          <ScrollView style={styles.texto} showsVerticalScrollIndicator={false}>
            {sinConexion ? (
              <Text style={styles.respaldo}>{mensaje?.versiculo}</Text>
            ) : (
              <PasajeTexto
                cita={cita}
                versos={pasaje.versos}
                cargando={pasaje.cargando}
                error={pasaje.error}
              />
            )}
          </ScrollView>
          <Pressable
            onPress={onCerrar}
            style={({ pressed }) => [
              styles.boton,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.botonTexto}>Cerrar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING * 2.4,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  tarjeta: {
    maxHeight: "80%",
    gap: SPACING * 1.6,
    padding: SPACING * 2,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: MUTED,
  },
  texto: {
    flexGrow: 0,
  },
  respaldo: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 25,
    color: TEXT,
  },
  boton: {
    alignItems: "center",
    paddingVertical: SPACING * 1.2,
    borderRadius: 999,
    backgroundColor: DARK_BG,
  },
  botonTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },
  presionado: {
    opacity: 0.6,
  },
});

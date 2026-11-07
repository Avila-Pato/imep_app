import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { tamanoVerso } from "@/screens/biblia/tamanoVerso";
import { useEstudios } from "@/store/estudios";
import { Mensaje } from "@/types/typesComunidad";
import { iniciales } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  mensaje: Mensaje | null; // mensaje del chat con su versiculo
  onCerrar: () => void;
};

// Al tocar la cita de un mensaje: la palabra que eligio el hermano a
// pantalla completa (como TikTok), con lo que escribio abajo
export default function ModalVersiculo({ mensaje, onCerrar }: Props) {
  const { letra = 1 } = useEstudios();
  const cita = mensaje?.cita ?? "";
  const pasaje = usePasaje(cita);
  // sin internet: el texto que se guardo al enviar
  const texto =
    pasaje.versos?.map((v) => v.texto).join(" ") ?? mensaje?.versiculo ?? "";
  const t = tamanoVerso(texto, letra);
  const nota = mensaje?.titulo ?? mensaje?.texto;

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible={!!mensaje}
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <ConBordes>
        {(insets) => (
          <View
            style={[
              styles.pantalla,
              {
                paddingTop: insets.top + SPACING,
                paddingBottom: insets.bottom + SPACING,
              },
            ]}
          >
            {/* Arriba: quien la eligio y cerrar */}
            <View style={styles.cabecera}>
              <Text style={styles.etiqueta}>
                {mensaje?.autor.toUpperCase()} ELIGIÓ
              </Text>
              <Pressable
                onPress={onCerrar}
                hitSlop={10}
                style={styles.cerrar}
                accessibilityLabel="Cerrar"
              >
                <Octicons name="x" size={18} color={TEXT} />
              </Pressable>
            </View>

            {/* El versiculo grande, al centro */}
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.centro}
              showsVerticalScrollIndicator={false}
            >
              {pasaje.cargando && !texto ? (
                <ActivityIndicator color={MUTED} />
              ) : (
                <>
                  <Text
                    style={[styles.verso, { fontSize: t, lineHeight: t * 1.3 }]}
                  >
                    “{texto || "No se pudo cargar el versículo"}”
                  </Text>
                  <Text style={styles.cita}>{cita.toUpperCase()}</Text>
                </>
              )}
            </ScrollView>

            {/* Abajo, como la descripcion de un video: quien y que entendio */}
            {mensaje && (
              <View style={styles.pie}>
                <View style={styles.autor}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarTexto}>
                      {iniciales(mensaje.autor)}
                    </Text>
                  </View>
                  <Text style={styles.nombre}>{mensaje.autor}</Text>
                  {!!mensaje.desafio && (
                    <Text style={styles.chip}>★ PALABRA DE LA SEMANA</Text>
                  )}
                </View>
                {!!nota && (
                  <Text style={styles.nota} numberOfLines={5}>
                    {nota}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </ConBordes>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING * 2,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: MUTED,
  },
  cerrar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  centro: {
    flexGrow: 1,
    justifyContent: "center",
    gap: SPACING * 1.6,
    paddingHorizontal: SPACING * 2.6,
    paddingVertical: SPACING * 2,
  },
  verso: {
    fontFamily: FUENTE.biblia,
    color: TEXT,
    textAlign: "center",
  },
  cita: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    letterSpacing: 1,
    color: MUTED,
    textAlign: "center",
  },
  pie: {
    gap: SPACING,
    marginHorizontal: SPACING * 2,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  autor: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  avatarTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: TEXT,
  },
  nombre: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
  },
  chip: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: PRIMARY,
  },
  nota: {
    fontSize: 15,
    lineHeight: 21,
    color: TEXT,
  },
});

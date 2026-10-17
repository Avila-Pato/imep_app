import { PREGUNTAS } from "@/assets/data/oracionesMocks";
import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { EstudioGuardado } from "@/types/typesComunidad";
import { haceCuanto } from "@/utils/tiempo";
import Octicons from "@expo/vector-icons/Octicons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PasajeTexto from "./PasajeTexto";

type Props = {
  estudio: EstudioGuardado | null; // null = cerrado
  onCerrar: () => void;
};

// Ver un estudio guardado (pasaje + respuestas) sin salir del perfil
export default function ModalEstudio({ estudio, onCerrar }: Props) {
  const insets = useSafeAreaInsets();
  const pasaje = usePasaje(estudio?.cita ?? "");

  return (
    <Modal
      visible={!!estudio}
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <View style={styles.fondo}>
        <Pressable style={styles.cerrarFondo} onPress={onCerrar} />
        <View style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}>
          <View style={styles.asa} />

          {estudio && (
            <>
              <View style={styles.cabecera}>
                <View style={styles.flex}>
                  <Text style={styles.meta}>
                    MI ESTUDIO · {haceCuanto(estudio.fecha).toUpperCase()}
                  </Text>
                  <Text style={styles.titulo}>{estudio.cita}</Text>
                </View>
                <Pressable
                  onPress={onCerrar}
                  hitSlop={10}
                  style={styles.cerrar}
                  accessibilityLabel="Cerrar"
                >
                  <Octicons name="x" size={16} color={TEXT} />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.contenido}
                showsVerticalScrollIndicator={false}
              >
                <View>
                  <Text style={styles.seccion}>PASAJE</Text>
                  <View style={styles.card}>
                    <PasajeTexto
                      cita={estudio.cita}
                      versos={pasaje.versos}
                      cargando={pasaje.cargando}
                      error={pasaje.error}
                    />
                  </View>
                </View>

                <View>
                  <Text style={styles.seccion}>MIS RESPUESTAS</Text>
                  <View style={[styles.card, styles.cardLista]}>
                    {PREGUNTAS.map((q, i) => {
                      const r = estudio.respuestas[q.id]?.trim();
                      return (
                        <View
                          key={q.id}
                          style={[styles.respuesta, i > 0 && styles.conLinea]}
                        >
                          <Text style={styles.respuestaTitulo}>
                            {q.titulo.toUpperCase()}
                          </Text>
                          <Text
                            style={[
                              styles.respuestaTexto,
                              q.id === "oracion" && styles.respuestaOracion,
                              !r && styles.sinRespuesta,
                            ]}
                          >
                            {r || "Sin respuesta"}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  cerrarFondo: {
    flex: 1,
  },
  hoja: {
    maxHeight: "88%",
    paddingHorizontal: PADDING,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    marginTop: SPACING,
    marginBottom: SPACING * 1.4,
  },
  flex: {
    flex: 1,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING,
    marginBottom: SPACING * 1.6,
  },
  meta: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 28,
    color: TEXT,
    marginTop: 4,
  },
  cerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  contenido: {
    gap: SPACING * 2,
    paddingBottom: SPACING,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING,
  },
  card: {
    padding: SPACING * 1.6,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  cardLista: {
    paddingVertical: SPACING / 2,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  respuesta: {
    gap: 6,
    paddingVertical: SPACING * 1.2,
  },
  respuestaTitulo: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: MUTED,
  },
  respuestaTexto: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
  },
  respuestaOracion: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 26,
  },
  sinRespuesta: {
    color: MUTED,
    fontStyle: "italic",
  },
});

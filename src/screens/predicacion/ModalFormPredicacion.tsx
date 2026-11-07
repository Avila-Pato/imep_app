import { HORARIOS_CULTO } from "@/assets/data/configMocks";
import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import ElegirVersiculoTikTok from "@/screens/biblia/ElegirVersiculoTikTok";
import { guardarPredicacion } from "@/store/estudios";
import { Predicacion } from "@/types/typesOraciones";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const pad = (n: number) => String(n).padStart(2, "0");
const aKey = (f: Date) =>
  `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;

// Los ultimos 60 dias (la predicacion se sube el dia del culto o despues)
const DIAS = Array.from({ length: 60 }, (_, i) => {
  const f = new Date();
  f.setDate(f.getDate() - i);
  return {
    key: aKey(f),
    arriba:
      i === 0
        ? "HOY"
        : i === 1
          ? "AYER"
          : f
              .toLocaleDateString("es-ES", { weekday: "short" })
              .replace(".", "")
              .toUpperCase(),
    numero: f.getDate(),
    mes: f
      .toLocaleDateString("es-ES", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
  };
});

// nombres de los cultos configurados, sin repetir
const CULTOS = [
  ...new Set(
    HORARIOS_CULTO.map((h) => h.nombre).filter((n): n is string => !!n),
  ),
];

type Props = {
  predicacion?: Predicacion | null; // con predicacion = editar; sin = nueva
  predicador: string; // por defecto, quien la sube
  onCerrar: () => void;
};

// Subir o editar una predicacion (pastor o quien publica anuncios).
// Se monta cada vez que se abre, asi parte con los datos correctos
export default function ModalFormPredicacion({
  predicacion,
  predicador: yo,
  onCerrar,
}: Props) {
  const [titulo, setTitulo] = useState(predicacion?.titulo ?? "");
  const [predicador, setPredicador] = useState(predicacion?.predicador ?? yo);
  const [cita, setCita] = useState(predicacion?.cita ?? "");
  const [fecha, setFecha] = useState(predicacion?.fecha ?? DIAS[0].key);
  const [culto, setCulto] = useState(predicacion?.culto ?? CULTOS[0] ?? "");
  const [resumen, setResumen] = useState(predicacion?.resumen ?? "");
  const [enBiblia, setEnBiblia] = useState(false);

  const listo = !!titulo.trim() && !!predicador.trim() && !!cita.trim();

  // si se edita una con fecha fuera de la lista, se agrega al inicio
  const dias = DIAS.some((d) => d.key === fecha)
    ? DIAS
    : [
        {
          key: fecha,
          arriba: "ACTUAL",
          numero: Number(fecha.slice(8)),
          mes: "",
        },
        ...DIAS,
      ];

  const guardar = () => {
    if (!listo) return;
    guardarPredicacion({
      id: predicacion?.id,
      titulo: titulo.trim(),
      predicador: predicador.trim(),
      cita: cita.trim(),
      fecha,
      culto: culto.trim() || "Culto",
      resumen: resumen.trim() || undefined,
    });
    onCerrar();
  };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
    >
      <ConBordes>
        {(insets) => (
          <>
            <Pressable style={styles.fondo} onPress={onCerrar} />
            <KeyboardAvoidingView
              behavior="padding"
              style={styles.zona}
              pointerEvents="box-none"
            >
              <View
                style={[
                  styles.hoja,
                  { paddingBottom: insets.bottom + SPACING },
                ]}
              >
                <View style={styles.asa} />
                <View style={styles.cabecera}>
                  <Text style={styles.titulo}>
                    {predicacion ? "Editar predicación" : "Nueva predicación"}
                  </Text>
                  <Pressable
                    onPress={onCerrar}
                    hitSlop={10}
                    accessibilityLabel="Cerrar"
                  >
                    <Octicons name="x" size={18} color={MUTED} />
                  </Pressable>
                </View>

                <ScrollView
                  contentContainerStyle={styles.contenido}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.etiqueta}>TÍTULO</Text>
                  <TextInput
                    value={titulo}
                    onChangeText={setTitulo}
                    placeholder="Ej: La fe que mueve montañas"
                    placeholderTextColor={MUTED}
                    style={styles.input}
                  />

                  <Text style={styles.etiqueta}>PASAJE</Text>
                  <View style={styles.fila}>
                    <TextInput
                      value={cita}
                      onChangeText={setCita}
                      placeholder="Ej: Marcos 11:22-24"
                      placeholderTextColor={MUTED}
                      style={[styles.input, styles.flex]}
                    />
                    <Pressable
                      onPress={() => setEnBiblia(true)}
                      style={({ pressed }) => [
                        styles.biblia,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Octicons name="book" size={14} color={TEXT} />
                      <Text style={styles.bibliaTexto}>Biblia</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.ayuda}>
                    Puedes escribir varios versículos (Juan 3:16-18) o elegir
                    uno en la Biblia.
                  </Text>

                  <Text style={styles.etiqueta}>PREDICADOR</Text>
                  <TextInput
                    value={predicador}
                    onChangeText={setPredicador}
                    placeholder="Quién predicó"
                    placeholderTextColor={MUTED}
                    style={styles.input}
                  />

                  <Text style={styles.etiqueta}>CULTO</Text>
                  <View style={styles.chips}>
                    {CULTOS.map((c) => {
                      const activo = c === culto;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => setCulto(c)}
                          style={[styles.chip, activo && styles.chipActivo]}
                        >
                          <Text
                            style={[styles.chipTexto, activo && styles.oscuro]}
                          >
                            {c}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.etiqueta}>FECHA</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.dias}
                    contentContainerStyle={styles.diasContent}
                  >
                    {dias.map((d) => {
                      const activo = d.key === fecha;
                      return (
                        <Pressable
                          key={d.key}
                          onPress={() => setFecha(d.key)}
                          style={[styles.dia, activo && styles.diaActivo]}
                          accessibilityState={{ selected: activo }}
                        >
                          <Text
                            style={[styles.diaArriba, activo && styles.oscuro]}
                          >
                            {d.arriba}
                          </Text>
                          <Text
                            style={[styles.diaNumero, activo && styles.oscuro]}
                          >
                            {d.numero}
                          </Text>
                          <Text
                            style={[styles.diaArriba, activo && styles.oscuro]}
                          >
                            {d.mes}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.etiqueta}>RESUMEN (OPCIONAL)</Text>
                  <TextInput
                    value={resumen}
                    onChangeText={setResumen}
                    placeholder="Lo principal del mensaje, para quien no pudo venir…"
                    placeholderTextColor={MUTED}
                    style={[styles.input, styles.inputLargo]}
                    multiline
                    textAlignVertical="top"
                  />
                </ScrollView>

                <Pressable
                  onPress={guardar}
                  disabled={!listo}
                  style={({ pressed }) => [
                    styles.boton,
                    !listo && styles.botonApagado,
                    pressed && styles.presionado,
                  ]}
                >
                  <Octicons name="check" size={16} color={DARK_BG} />
                  <Text style={styles.botonTexto}>
                    {predicacion ? "Guardar cambios" : "Publicar"}
                  </Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </>
        )}
      </ConBordes>

      {/* Elegir el pasaje deslizando de a uno, como TikTok */}
      {enBiblia && (
        <ElegirVersiculoTikTok
          onElegir={(c) => {
            setCita(c);
            setEnBiblia(false);
          }}
          onCerrar={() => setEnBiblia(false)}
        />
      )}
    </Modal>
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
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  zona: {
    flex: 1,
    justifyContent: "flex-end",
  },
  hoja: {
    maxHeight: "92%",
    paddingTop: SPACING,
    gap: SPACING,
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
    backgroundColor: "#3A3A3A",
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING * 2,
  },
  titulo: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 22,
    color: TEXT,
  },
  contenido: {
    paddingHorizontal: SPACING * 2,
    paddingBottom: SPACING,
    gap: SPACING,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginTop: SPACING / 2,
  },
  ayuda: {
    fontSize: 12,
    color: MUTED,
  },
  fila: {
    flexDirection: "row",
    gap: SPACING,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: SPACING,
    borderRadius: 14,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    fontSize: 15,
    color: TEXT,
  },
  inputLargo: {
    minHeight: 110,
  },
  biblia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING * 1.2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  bibliaTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  chipTexto: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: MUTED,
  },
  dias: {
    marginHorizontal: -SPACING * 2,
  },
  diasContent: {
    paddingHorizontal: SPACING * 2,
    gap: 8,
  },
  dia: {
    width: 58,
    paddingVertical: SPACING,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  diaActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  diaArriba: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: MUTED,
  },
  diaNumero: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT,
    marginVertical: 2,
  },
  oscuro: {
    color: DARK_BG,
  },
  boton: {
    flexDirection: "row",
    gap: 8,
    height: 52,
    marginHorizontal: SPACING * 2,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonApagado: {
    opacity: 0.3,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
});

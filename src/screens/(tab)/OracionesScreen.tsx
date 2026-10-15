import { PASAJES, PREGUNTAS } from "@/assets/data/oracionesMocks";
import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { partirTitulo } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PasajeTexto from "./components/PasajeTexto";
import PredicacionView from "./components/PredicacionView";

type Paso = 1 | 2 | 3;
type Vista = "predicacion" | "estudio";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "predicacion", label: "Predicación" },
  { id: "estudio", label: "Estudio guiado" },
];

// Encabezado centrado: etiqueta pequeña + titulo serif con la ultima palabra en cursiva
function Encabezado({ meta, titulo }: { meta: string; titulo: string }) {
  const { inicio, final } = partirTitulo(titulo);
  return (
    <View style={styles.cabecera}>
      <Text style={styles.meta}>{meta}</Text>
      <Text style={styles.titulo}>
        {inicio}
        <Text style={styles.tituloCursiva}>{final}</Text>
      </Text>
    </View>
  );
}

function Boton({
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
        deshabilitado && styles.botonDeshabilitado,
        pressed && styles.presionado,
      ]}
    >
      <Text style={styles.botonTexto}>{texto} →</Text>
    </Pressable>
  );
}

const Separador = () => <View style={styles.separador} />;

export default function OracionesScreen() {
  const [vista, setVista] = useState<Vista>("predicacion");
  const [paso, setPaso] = useState<Paso>(1);
  const [cita, setCita] = useState("");
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);

  // Texto del pasaje: desde la API de la Biblia (o el de ejemplo si falla)
  const pasaje = PASAJES.find(
    (p) => p.cita.toLowerCase() === cita.trim().toLowerCase(),
  );
  const api = usePasaje(cita);
  const versosPasaje =
    api.versos ??
    (api.cargando || !pasaje
      ? undefined
      : [{ numero: 0, texto: pasaje.texto }]);

  const irA = (p: Paso) => {
    setPaso(p);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // Desde la predicacion: abre el estudio con ese pasaje
  const estudiar = (c: string) => {
    setCita(c);
    setRespuestas({});
    setVista("estudio");
    irA(2);
  };

  const nuevoEstudio = () => {
    setCita("");
    setRespuestas({});
    irA(1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Tabs */}
        <View style={styles.tabs}>
          {VISTAS.map((v) => {
            const activo = v.id === vista;
            return (
              <Pressable
                key={v.id}
                onPress={() => {
                  setVista(v.id);
                  scrollRef.current?.scrollTo({ y: 0, animated: false });
                }}
                hitSlop={8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activo }}
              >
                <Text style={[styles.tabTexto, activo && styles.tabActivo]}>
                  {v.label}
                </Text>
                <View
                  style={[styles.tabLinea, activo && styles.tabLineaActiva]}
                />
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {vista === "predicacion" && <PredicacionView onEstudiar={estudiar} />}

          {vista === "estudio" && (
            <>
              {/* Progreso: atras + paso actual */}
              <View style={styles.progreso}>
                <Pressable
                  onPress={() => irA((paso - 1) as Paso)}
                  disabled={paso === 1}
                  hitSlop={10}
                  style={[styles.atras, paso === 1 && styles.oculto]}
                  accessibilityLabel="Atrás"
                >
                  <Octicons name="arrow-left" size={16} color={MUTED} />
                </Pressable>
                <Text style={styles.pasoTexto}>
                  {String(paso).padStart(2, "0")}
                  <Text style={styles.pasoTotal}> / 03</Text>
                </Text>
                <View style={styles.atras} />
              </View>

              {/* Paso 1: elegir pasaje */}
              {paso === 1 && (
                <>
                  <Encabezado
                    meta="ESTUDIO GUIADO"
                    titulo="¿Qué pasaje quieres estudiar?"
                  />

                  <View style={styles.chips}>
                    {PASAJES.map((p) => {
                      const activo = p.cita === pasaje?.cita;
                      return (
                        <Pressable
                          key={p.cita}
                          onPress={() => setCita(p.cita)}
                          style={[styles.chip, activo && styles.chipActivo]}
                        >
                          <Text
                            style={[
                              styles.chipTexto,
                              activo && styles.chipTextoActivo,
                            ]}
                          >
                            {p.cita}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    value={cita}
                    onChangeText={setCita}
                    placeholder="o escribe un pasaje…"
                    placeholderTextColor="#555555"
                    style={styles.inputCita}
                  />

                  {!!cita.trim() && (
                    <>
                      <Separador />
                      <PasajeTexto
                        cita={cita}
                        versos={versosPasaje}
                        cargando={api.cargando}
                      />
                    </>
                  )}

                  <Boton
                    texto="Comenzar estudio"
                    onPress={() => irA(2)}
                    deshabilitado={!cita.trim()}
                  />
                </>
              )}

              {/* Paso 2: preguntas guiadas */}
              {paso === 2 && (
                <>
                  <Encabezado meta="PREGUNTAS GUIADAS" titulo={cita} />
                  <PasajeTexto
                    cita={cita}
                    versos={versosPasaje}
                    cargando={api.cargando}
                  />
                  <Separador />

                  <View>
                    {PREGUNTAS.map((q, i) => (
                      <View
                        key={q.id}
                        style={[styles.pregunta, i > 0 && styles.conLinea]}
                      >
                        <View style={styles.preguntaCabecera}>
                          <Text style={styles.numero}>
                            {String(i + 1).padStart(2, "0")}
                          </Text>
                          <View style={styles.flex}>
                            <Text style={styles.preguntaTitulo}>
                              {q.titulo}
                            </Text>
                            <Text style={styles.preguntaAyuda}>{q.ayuda}</Text>
                          </View>
                        </View>
                        <TextInput
                          value={respuestas[q.id] ?? ""}
                          onChangeText={(txt) =>
                            setRespuestas((r) => ({ ...r, [q.id]: txt }))
                          }
                          placeholder="Escribe aquí…"
                          placeholderTextColor="#555555"
                          multiline
                          style={styles.inputRespuesta}
                        />
                      </View>
                    ))}
                  </View>

                  <Boton texto="Crear mi estudio" onPress={() => irA(3)} />
                </>
              )}

              {/* Paso 3: estudio terminado */}
              {paso === 3 && (
                <>
                  <Encabezado meta="MI ESTUDIO DE" titulo={cita} />
                  <PasajeTexto
                    cita={cita}
                    versos={versosPasaje}
                    cargando={api.cargando}
                  />
                  <Separador />

                  <View>
                    {PREGUNTAS.map((q, i) => {
                      const r = respuestas[q.id]?.trim();
                      const esOracion = q.id === "oracion";
                      return (
                        <View
                          key={q.id}
                          style={[styles.seccion, i > 0 && styles.conLinea]}
                        >
                          <Text
                            style={[
                              styles.seccionTitulo,
                              esOracion && styles.seccionTituloOracion,
                            ]}
                          >
                            {q.titulo.toUpperCase()}
                          </Text>
                          <Text
                            style={[
                              styles.seccionTexto,
                              esOracion && styles.seccionTextoOracion,
                              !r && styles.sinRespuesta,
                            ]}
                          >
                            {r || "Sin respuesta"}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <Boton texto="Nuevo estudio" onPress={nuevoEstudio} />
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
    paddingBottom: 120, // espacio para el tabbar flotante
    gap: SPACING * 2.4,
  },

  // Tabs
  tabs: {
    flexDirection: "row",
    gap: SPACING * 2.4,
    paddingHorizontal: PADDING,
    paddingTop: SPACING / 2,
    paddingBottom: SPACING / 2,
  },
  tabTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: MUTED,
    paddingBottom: 8,
  },
  tabActivo: {
    color: TEXT,
  },
  tabLinea: {
    height: 2,
    borderRadius: 1,
  },
  tabLineaActiva: {
    backgroundColor: PRIMARY,
  },

  // Progreso
  progreso: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SPACING,
  },
  atras: {
    width: 24,
  },
  oculto: {
    opacity: 0,
  },
  pasoTexto: {
    fontFamily: SERIF,
    fontSize: 15,
    color: TEXT,
  },
  pasoTotal: {
    color: MUTED,
  },

  // Encabezado
  cabecera: {
    alignItems: "center",
    gap: SPACING,
  },
  meta: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 30,
    lineHeight: 36,
    color: TEXT,
    textAlign: "center",
  },
  tituloCursiva: {
    fontStyle: "italic",
    color: PRIMARY,
  },
  separador: {
    alignSelf: "center",
    width: 32,
    height: 1,
    backgroundColor: BORDER,
  },

  // Chips
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  chip: {
    paddingHorizontal: SPACING * 1.2,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  chipActivo: {
    borderColor: PRIMARY,
  },
  chipTexto: {
    fontSize: 13,
    color: MUTED,
  },
  chipTextoActivo: {
    color: TEXT,
  },

  // Inputs (solo linea inferior)
  inputCita: {
    alignSelf: "center",
    minWidth: "70%",
    paddingVertical: SPACING,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    fontFamily: SERIF,
    fontSize: 18,
    color: TEXT,
    textAlign: "center",
    outlineWidth: 0, // sin recuadro al enfocar (web)
  },
  inputRespuesta: {
    minHeight: 64,
    paddingVertical: SPACING,
    paddingLeft: 24 + SPACING * 1.4, // alineado con el titulo de la pregunta
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
    textAlignVertical: "top",
    outlineWidth: 0,
  },

  // Preguntas
  pregunta: {
    gap: SPACING / 2,
    paddingVertical: SPACING * 1.4,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  preguntaCabecera: {
    flexDirection: "row",
    gap: SPACING * 1.4,
  },
  numero: {
    width: 24,
    fontFamily: SERIF,
    fontSize: 15,
    color: MUTED,
  },
  preguntaTitulo: {
    fontFamily: SERIF,
    fontSize: 18,
    color: TEXT,
  },
  preguntaAyuda: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },

  // Boton
  boton: {
    alignSelf: "center",
    paddingHorizontal: SPACING * 2.4,
    paddingVertical: SPACING * 1.2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  botonDeshabilitado: {
    opacity: 0.35,
  },
  presionado: {
    opacity: 0.6,
  },
  botonTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT,
  },

  // Estudio final
  seccion: {
    gap: 6,
    paddingVertical: SPACING * 1.4,
  },
  seccionTitulo: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: MUTED,
  },
  seccionTituloOracion: {
    color: PRIMARY,
  },
  seccionTexto: {
    fontSize: 15,
    lineHeight: 23,
    color: TEXT,
  },
  seccionTextoOracion: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 26,
  },
  sinRespuesta: {
    color: "#555555",
    fontStyle: "italic",
  },
});

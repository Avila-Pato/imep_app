import { PASAJES } from "@/assets/data/oracionesMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  PLACEHOLDER,
  LINEA,
  RADIO_BORDE,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { sugerirCitas, versiculoAlAzar } from "@/services/biblia";
import { enviarMensaje } from "@/store/estudios";
import { Desafio, Grupo, NotaDeVoz } from "@/types/typesComunidad";
import Octicons from "@expo/vector-icons/Octicons";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useRef, useState } from "react";
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
import Animated, { Easing, SlideInDown } from "react-native-reanimated";
import ConBordes from "@/components/ConBordes";
import { useTecladoAbierto } from "@/hooks/useEspacioBarra";
import ElegirVersiculoTikTok from "@/screens/biblia/ElegirVersiculoTikTok";
import PasajeTexto from "../../(tab)/components/PasajeTexto";
import NotaVoz, { minutos } from "./NotaVoz";

type Forma = "texto" | "audio";

const FORMAS: { id: Forma; label: string; icono: "pencil" | "unmute" }[] = [
  { id: "texto", label: "Escribir", icono: "pencil" },
  { id: "audio", label: "Audio", icono: "unmute" },
];

const nuevoId = () => `m${Date.now()}`;

type Props = {
  sala: Grupo;
  visible: boolean;
  onCerrar: () => void;
  desafio?: Desafio; // respondiendo la "Palabra de la semana"
  citaInicial?: string; // desde la Biblia: el versiculo ya elegido
};

// Desde el chat de la sala: compartir lo que entendi de un versiculo,
// escrito o en audio (el versiculo lo elige la persona; "Inspírame" sugiere uno)
export default function CompartirVersiculo({
  sala,
  visible,
  onCerrar,
  desafio,
  citaInicial,
}: Props) {
  // si el lider fijo un versiculo, ya viene puesto
  const [cita, setCita] = useState(desafio?.cita ?? citaInicial ?? "");
  const [forma, setForma] = useState<Forma>("texto");
  const [texto, setTexto] = useState("");
  const [audio, setAudio] = useState<NotaDeVoz | null>(null);
  const [sinPermiso, setSinPermiso] = useState(false);
  const teclado = useTecladoAbierto();
  const pasaje = usePasaje(cita);
  // Autocompletado: solo mientras escribe (al elegir una cita se oculta)
  const [sugerir, setSugerir] = useState(false);
  const sugerencias = sugerir ? sugerirCitas(cita) : [];
  const elegirCita = (c: string) => {
    setCita(c);
    setSugerir(false);
  };
  // Elegir el versiculo deslizando de a uno (vista TikTok)
  const [enBiblia, setEnBiblia] = useState(false);
  // al tocar "lo que entendi" se baja hasta el cuadro (el teclado no lo tapa)
  const hojaRef = useRef<ScrollView>(null);
  const mostrarAbajo = () =>
    setTimeout(() => hojaRef.current?.scrollToEnd({ animated: true }), 250);

  // Grabacion (se guarda en documentos para que no se borre con la cache)
  const grabadora = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    directory: "document",
  });
  const grabando = useAudioRecorderState(grabadora);

  // Versiculo al azar de toda la Biblia para inspirarse
  // (sin internet, uno de los pasajes sugeridos)
  const [buscando, setBuscando] = useState(false);
  const inspirar = async () => {
    setBuscando(true);
    try {
      elegirCita(await versiculoAlAzar());
    } catch {
      const otros = PASAJES.filter((p) => p.cita !== cita.trim());
      elegirCita(otros[Math.floor(Math.random() * otros.length)].cita);
    } finally {
      setBuscando(false);
    }
  };

  const grabar = async () => {
    const permiso = await AudioModule.requestRecordingPermissionsAsync();
    setSinPermiso(!permiso.granted);
    if (!permiso.granted) return;
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await grabadora.prepareToRecordAsync();
    grabadora.record();
  };

  const detener = async () => {
    const duracion = grabando.durationMillis / 1000;
    await grabadora.stop();
    await setAudioModeAsync({ allowsRecording: false });
    if (grabadora.uri) setAudio({ uri: grabadora.uri, duracion });
  };

  // el versiculo y lo que entendi (escrito o en audio)
  const listo = !!cita.trim() && (forma === "texto" ? !!texto.trim() : !!audio);

  const enviar = () => {
    if (!listo) return;
    enviarMensaje({
      id: nuevoId(),
      grupo: sala.id,
      autor: USUARIO.nombre,
      cita: cita.trim(),
      versiculo: pasaje.versos?.map((v) => v.texto).join(" "),
      texto: forma === "texto" ? texto.trim() : "",
      audio: forma === "audio" && audio ? audio : undefined,
      desafio: desafio?.id,
      fecha: new Date().toISOString(),
    });
    setCita("");
    setTexto("");
    setAudio(null);
    onCerrar(); // ya estamos en el chat: se ve el mensaje enviado
  };

  const cerrar = () => {
    if (grabando.isRecording) return; // no cerrar a mitad de una grabacion
    onCerrar();
  };

  return (
    <Modal
      navigationBarTranslucent
      visible={visible}
      transparent
      // el fondo oscuro aparece en su lugar (no sube junto con la hoja)
      animationType="fade"
      onRequestClose={cerrar}
      statusBarTranslucent
    >
      <ConBordes>
        {(insets) => (
          <>
            <KeyboardAvoidingView
              style={styles.fondo}
              // en Android la hoja (pantalla completa) no se achica sola: se
              // sube aqui. Solo con el teclado abierto: cerrado, Android
              // sumaba la barra de navegacion y la hoja quedaba separada abajo
              behavior={teclado ? "padding" : undefined}
            >
              <Pressable style={styles.cerrarFondo} onPress={cerrar} />
              <Animated.View
                // solo la hoja sube desde abajo, sobre el chat oscurecido
                entering={SlideInDown.duration(320).easing(
                  Easing.out(Easing.cubic),
                )}
                style={[
                  styles.hoja,
                  { paddingBottom: insets.bottom + SPACING },
                ]}
              >
                <View style={styles.asa} />
                <ScrollView
                  ref={hojaRef}
                  contentContainerStyle={styles.contenedor}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Encabezado */}
                  <View style={styles.cabecera}>
                    <View style={styles.etiquetas}>
                      <Text style={styles.chip}>
                        {desafio
                          ? "★ PALABRA DE LA SEMANA"
                          : sala.label.toUpperCase()}
                      </Text>
                      <Pressable
                        onPress={cerrar}
                        hitSlop={10}
                        style={styles.cerrar}
                        accessibilityLabel="Cerrar"
                      >
                        <Octicons name="x" size={16} color={TEXT} />
                      </Pressable>
                    </View>
                    <Text style={styles.sub}>
                      {desafio
                        ? desafio.consigna
                        : `Elige un versículo y cuéntale al chat de ${sala.label} lo que entendiste.`}
                    </Text>
                  </View>

                  {/* Versiculo */}
                  <View>
                    <View style={styles.seccionFila}>
                      <Text style={styles.seccion}>VERSÍCULO</Text>
                      <View style={styles.atajos}>
                        <Pressable
                          onPress={() => setEnBiblia(true)}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.inspirar,
                            pressed && styles.presionado,
                          ]}
                        >
                          <Octicons name="book" size={12} color={TEXT} />
                          <Text style={styles.inspirarTexto}>Biblia</Text>
                        </Pressable>
                        <Pressable
                          onPress={inspirar}
                          disabled={buscando}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.inspirar,
                            pressed && styles.presionado,
                          ]}
                        >
                          <Octicons name="sync" size={12} color={TEXT} />
                          <Text style={styles.inspirarTexto}>
                            {buscando ? "Buscando…" : "Inspírame"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.campo}>
                      <Octicons name="search" size={14} color={MUTED} />
                      <TextInput
                        value={cita}
                        onChangeText={(t) => {
                          setCita(t);
                          setSugerir(true);
                        }}
                        placeholder="Ej: Juan 3:16"
                        placeholderTextColor={PLACEHOLDER}
                        style={styles.inputCita}
                      />
                    </View>
                    {sugerencias.length > 0 && (
                      <View style={styles.sugerencias}>
                        {sugerencias.map((c, i) => (
                          <Pressable
                            key={c}
                            onPress={() => elegirCita(c)}
                            style={({ pressed }) => [
                              styles.sugerencia,
                              i > 0 && styles.sugerenciaBorde,
                              pressed && styles.presionado,
                            ]}
                          >
                            <Octicons name="book" size={13} color={MUTED} />
                            <Text style={styles.sugerenciaTexto}>{c}</Text>
                            <Octicons
                              name="chevron-right"
                              size={13}
                              color={MUTED}
                            />
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  {pasaje.valida && (
                    <View style={styles.card}>
                      <PasajeTexto
                        cita={cita}
                        versos={pasaje.versos}
                        cargando={pasaje.cargando}
                        error={pasaje.error}
                      />
                    </View>
                  )}

                  {/* Lo que entendi: escrito o en audio */}
                  <View>
                    <Text style={styles.seccion}>LO QUE ENTENDÍ</Text>
                    <View style={styles.card}>
                      <View style={styles.formas}>
                        {FORMAS.map((f) => {
                          const activo = f.id === forma;
                          return (
                            <Pressable
                              key={f.id}
                              onPress={() => setForma(f.id)}
                              disabled={grabando.isRecording}
                              style={[
                                styles.forma,
                                activo && styles.formaActiva,
                              ]}
                            >
                              <Octicons
                                name={f.icono}
                                size={13}
                                color={activo ? DARK_BG : MUTED}
                              />
                              <Text
                                style={[
                                  styles.formaTexto,
                                  activo && styles.formaTextoActivo,
                                ]}
                              >
                                {f.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {forma === "texto" && (
                        <TextInput
                          value={texto}
                          onChangeText={setTexto}
                          onFocus={mostrarAbajo}
                          placeholder="Escribe lo que entendiste…"
                          placeholderTextColor={PLACEHOLDER}
                          multiline
                          style={styles.inputTexto}
                        />
                      )}

                      {forma === "audio" && (
                        <View style={styles.audio}>
                          {audio && !grabando.isRecording ? (
                            <>
                              <NotaVoz audio={audio} />
                              <Pressable
                                onPress={() => setAudio(null)}
                                hitSlop={8}
                              >
                                <Text style={styles.regrabar}>
                                  Volver a grabar
                                </Text>
                              </Pressable>
                            </>
                          ) : (
                            <>
                              <Pressable
                                onPress={
                                  grabando.isRecording ? detener : grabar
                                }
                                style={({ pressed }) => [
                                  styles.mic,
                                  grabando.isRecording && styles.micGrabando,
                                  pressed && styles.presionado,
                                ]}
                                accessibilityLabel={
                                  grabando.isRecording
                                    ? "Detener grabación"
                                    : "Grabar audio"
                                }
                              >
                                <Octicons
                                  name={
                                    grabando.isRecording
                                      ? "square-fill"
                                      : "unmute"
                                  }
                                  size={22}
                                  color={grabando.isRecording ? TEXT : DARK_BG}
                                />
                              </Pressable>
                              <Text style={styles.micTexto}>
                                {grabando.isRecording
                                  ? `Grabando · ${minutos(grabando.durationMillis / 1000)}`
                                  : sinPermiso
                                    ? "Permite el micrófono en los ajustes"
                                    : "Toca para grabar"}
                              </Text>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  </View>

                  <Pressable
                    onPress={enviar}
                    disabled={!listo}
                    style={({ pressed }) => [
                      styles.boton,
                      !listo && styles.botonDeshabilitado,
                      pressed && styles.presionado,
                    ]}
                  >
                    <Text style={styles.botonTexto}>
                      {desafio
                        ? "Enviar mi respuesta"
                        : `Enviar al chat de ${sala.label}`}
                    </Text>
                  </Pressable>
                </ScrollView>
              </Animated.View>
            </KeyboardAvoidingView>
          </>
        )}
      </ConBordes>

      {/* Elegir el versiculo deslizando de a uno, como TikTok */}
      {enBiblia && (
        <ElegirVersiculoTikTok
          onElegir={(c) => {
            elegirCita(c);
            setEnBiblia(false);
          }}
          onCerrar={() => setEnBiblia(false)}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING * 2,
    paddingBottom: SPACING,
  },
  fondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  cerrarFondo: {
    flex: 1,
  },
  hoja: {
    maxHeight: "90%",
    paddingHorizontal: PADDING,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DARK_BG,
    // borde de arriba mas claro: la hoja se separa bien del chat de atras
    borderTopWidth: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: LINEA,
    boxShadow: "0px -12px 32px rgba(0,0,0,0.6)",
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: RADIO_BORDE,
    marginTop: SPACING,
    marginBottom: SPACING * 1.4,
  },
  cerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  presionado: {
    opacity: 0.6,
  },

  // Encabezado
  cabecera: {
    gap: 6,
  },
  etiquetas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chip: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    color: TEXT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: "hidden",
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
  },

  // Elegir desde la Biblia
  flex: {
    flex: 1,
  },
  atajos: {
    flexDirection: "row",
    gap: 8,
  },

  // Secciones
  seccionFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING,
  },
  inspirar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: -SPACING,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  inspirarTexto: {
    fontSize: 12,
    fontWeight: "500",
    color: TEXT,
  },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  inputCita: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: TEXT,
    outlineWidth: 0,
  },
  sugerencias: {
    marginTop: SPACING * 0.6,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: "hidden",
  },
  sugerencia: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: 12,
  },
  sugerenciaBorde: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  sugerenciaTexto: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  card: {
    padding: SPACING * 1.6,
    gap: SPACING * 1.4,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },

  // Escribir / Audio
  formas: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 999,
    backgroundColor: DARK_BG,
  },
  forma: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 999,
  },
  formaActiva: {
    backgroundColor: TEXT,
  },
  formaTexto: {
    fontSize: 13,
    color: MUTED,
  },
  formaTextoActivo: {
    color: DARK_BG,
    fontWeight: "600",
  },
  inputTexto: {
    minHeight: 110,
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
    textAlignVertical: "top",
    outlineWidth: 0,
  },
  audio: {
    alignItems: "center",
    gap: SPACING,
    paddingVertical: SPACING,
  },
  mic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  micGrabando: {
    backgroundColor: PRIMARY,
  },
  micTexto: {
    fontSize: 13,
    color: MUTED,
    fontVariant: ["tabular-nums"],
  },
  regrabar: {
    fontSize: 13,
    color: MUTED,
    textDecorationLine: "underline",
  },

  boton: {
    alignItems: "center",
    paddingVertical: SPACING * 1.4,
    borderRadius: 999,
    backgroundColor: TEXT,
  },
  botonDeshabilitado: {
    opacity: 0.4,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: DARK_BG,
  },
});

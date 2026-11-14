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
  primarioAlfa,
  PLACEHOLDER,
  LINEA,
  RADIO_BORDE,
} from "@/constants/constans";
import { sugerirCitas } from "@/services/biblia";
import {
  publicar,
  useEstudios,
  useIglesias,
  useMisRestricciones,
  usePuede,
} from "@/store/estudios";
import { GrupoId } from "@/types/typesComunidad";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

// Pedir oracion: se escribe la peticion, se elige a que iglesia va (o a
// todas, si esta en varias) y el pastor la aprueba antes de publicarse en el
// muro de toda la iglesia (dura 24 horas)
export default function ModalPedirOracion({
  onCerrar,
}: {
  grupo?: GrupoId; // (ya no se usa: siempre va al muro de toda la iglesia)
  onCerrar: () => void;
}) {
  const { iglesia, nombre } = useEstudios();
  const iglesias = useIglesias().filter((i) => !!i.id);
  // varias iglesias: "todas" o una
  const [destino, setDestino] = useState<string>(iglesia?.id ?? "todas");
  const [texto, setTexto] = useState("");
  const [cita, setCita] = useState("");
  const [sugerir, setSugerir] = useState(false);
  const [mostrarCita, setMostrarCita] = useState(true);
  const [enviada, setEnviada] = useState(false);
  // si quien pide es quien aprueba (pastor o lider), se publica directo
  const esLider = usePuede("salas");
  // el pastor no lo deja pedir oracion (el servidor tambien lo impide)
  const bloqueado = useMisRestricciones().sinOracion && !esLider;

  const sugerencias = sugerir ? sugerirCitas(cita) : [];
  const listo = texto.trim().length >= 5;
  const destinos = destino === "todas" ? iglesias.map((i) => i.id!) : [destino];

  const enviar = () => {
    if (!listo) return;
    const ahora = new Date();
    publicar(
      {
        id: `o${ahora.getTime()}`,
        autor: nombre?.trim() || "Hermano/a",
        grupo: "general",
        cita: cita.trim(),
        mostrarCita: !!cita.trim() && mostrarCita,
        texto: texto.trim(),
        fecha: ahora.toISOString(),
        orando: 0,
        estado: esLider ? "aprobada" : "pendiente",
      },
      iglesias.length > 1 ? destinos : undefined,
    );
    setEnviada(true);
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
                    {esLider ? "Hacer oración" : "Pedir oración"}
                  </Text>
                  <Pressable
                    onPress={onCerrar}
                    hitSlop={10}
                    accessibilityLabel="Cerrar"
                  >
                    <Octicons name="x" size={18} color={MUTED} />
                  </Pressable>
                </View>

                {bloqueado ? (
                  <View style={styles.listo}>
                    <Octicons name="lock" size={22} color={MUTED} />
                    <Text style={styles.ayuda}>
                      Tu pastor desactivó tus peticiones de oración. Si crees
                      que es un error, conversa con él.
                    </Text>
                  </View>
                ) : enviada ? (
                  // Confirmacion
                  <View style={styles.listo}>
                    <View style={styles.listoIcono}>
                      <Octicons name="heart-fill" size={22} color={PRIMARY} />
                    </View>
                    <Text style={styles.listoTitulo}>
                      {esLider
                        ? "Tu oración ya está en el muro"
                        : "Tu petición fue enviada"}
                    </Text>
                    <Text style={styles.ayuda}>
                      {esLider
                        ? "Los hermanos ya pueden orar contigo durante 24 horas."
                        : "Tu pastor la revisará. Cuando la apruebe, estará 24 horas en el muro de la iglesia."}
                    </Text>
                    <Pressable
                      onPress={onCerrar}
                      style={({ pressed }) => [
                        styles.boton,
                        styles.botonListo,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Text style={styles.botonTexto}>Listo</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <ScrollView
                      contentContainerStyle={styles.contenido}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                    >
                      <Text style={styles.ayuda}>
                        {esLider
                          ? "Escribe la oración o el motivo por el que la iglesia orará. Se publica directo y queda 24 horas en el muro."
                          : "Comparte por qué quieres que oren. Tu pastor la revisa antes de publicarse y queda 24 horas en el muro."}
                      </Text>

                      <TextInput
                        value={texto}
                        onChangeText={setTexto}
                        placeholder={
                          esLider
                            ? "Ej: Oremos por las familias de nuestra iglesia…"
                            : "Ej: Pido oración por la salud de mi mamá…"
                        }
                        placeholderTextColor={PLACEHOLDER}
                        autoCapitalize="sentences"
                        multiline
                        autoFocus
                        textAlignVertical="top"
                        maxLength={400}
                        style={[styles.input, styles.inputLargo]}
                      />

                      {/* A que iglesia (solo si esta en varias) */}
                      {iglesias.length > 1 && (
                        <>
                          <Text style={styles.etiqueta}>¿A QUÉ IGLESIA?</Text>
                          <View style={styles.chips}>
                            {[
                              { id: "todas", nombre: "Todas" },
                              ...iglesias.map((i) => ({
                                id: i.id!,
                                nombre: i.sede,
                              })),
                            ].map((o) => {
                              const activo = o.id === destino;
                              return (
                                <Pressable
                                  key={o.id}
                                  onPress={() => setDestino(o.id)}
                                  style={[
                                    styles.chip,
                                    activo && styles.chipActivo,
                                  ]}
                                  accessibilityState={{ selected: activo }}
                                >
                                  <Octicons
                                    name={o.id === "todas" ? "globe" : "home"}
                                    size={12}
                                    color={activo ? DARK_BG : MUTED}
                                  />
                                  <Text
                                    style={[
                                      styles.chipTexto,
                                      activo && styles.oscuro,
                                    ]}
                                  >
                                    {o.nombre}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </>
                      )}

                      {/* Versiculo que lo acompaña (opcional) */}
                      <Text style={styles.etiqueta}>VERSÍCULO (OPCIONAL)</Text>
                      <TextInput
                        value={cita}
                        onChangeText={(t) => {
                          setCita(t);
                          setSugerir(true);
                        }}
                        placeholder="Ej: Filipenses 4:6"
                        placeholderTextColor={PLACEHOLDER}
                        style={styles.input}
                      />
                      {sugerencias.length > 0 && (
                        <View style={styles.sugerencias}>
                          {sugerencias.map((c) => (
                            <Pressable
                              key={c}
                              onPress={() => {
                                setCita(c);
                                setSugerir(false);
                              }}
                              style={styles.sugerencia}
                            >
                              <Octicons name="book" size={12} color={MUTED} />
                              <Text style={styles.sugerenciaTexto}>{c}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                      {!!cita.trim() && (
                        <View style={styles.fila}>
                          <Text style={[styles.ayuda, styles.flex]}>
                            Mostrar el versículo en el muro
                          </Text>
                          <Switch
                            value={mostrarCita}
                            onValueChange={setMostrarCita}
                            trackColor={{ false: BORDER, true: PRIMARY }}
                            thumbColor="#FFFFFF"
                          />
                        </View>
                      )}
                    </ScrollView>

                    <Pressable
                      onPress={enviar}
                      disabled={!listo}
                      style={({ pressed }) => [
                        styles.boton,
                        !listo && styles.apagado,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Octicons name="heart" size={16} color={DARK_BG} />
                      <Text style={styles.botonTexto}>
                        {esLider ? "Publicar en el muro" : "Enviar petición"}
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </>
        )}
      </ConBordes>
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
  apagado: {
    opacity: 0.35,
  },
  fondo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.6)",
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
    borderColor: LINEA,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: RADIO_BORDE,
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
  ayuda: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginTop: SPACING / 2,
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
    minHeight: 130,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  oscuro: {
    color: DARK_BG,
  },
  sugerencias: {
    borderRadius: 14,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  sugerencia: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: 10,
  },
  sugerenciaTexto: {
    fontSize: 14,
    color: TEXT,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
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
  botonListo: {
    alignSelf: "stretch",
    marginHorizontal: 0,
    marginTop: SPACING,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: DARK_BG,
  },
  listo: {
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 2,
    paddingVertical: SPACING * 2,
  },
  listoIcono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primarioAlfa(0.12),
  },
  listoTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 17,
    color: TEXT,
    textAlign: "center",
  },
});

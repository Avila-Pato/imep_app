import { USUARIO } from "@/assets/data/perfilMocks";
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
import { sugerirCitas } from "@/services/biblia";
import { avisarAhora } from "@/services/notificaciones";
import { enviarMensaje } from "@/store/estudios";
import { Grupo } from "@/types/typesComunidad";
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
import ConBordes from "@/components/ConBordes";

type Tipo = "aviso" | "devocional";

const TIPOS: { id: Tipo; label: string; icono: "megaphone" | "book" }[] = [
  { id: "aviso", label: "Aviso", icono: "megaphone" },
  { id: "devocional", label: "Devocional", icono: "book" },
];

// El lider del grupo publica para toda su sala: un aviso corto o un
// devocional (titulo, versiculo y reflexion), y puede notificar a todos
export default function ModalPublicarLider({
  sala,
  onCerrar,
}: {
  sala: Grupo;
  onCerrar: () => void;
}) {
  const [tipo, setTipo] = useState<Tipo>("aviso");
  const [titulo, setTitulo] = useState("");
  const [cita, setCita] = useState("");
  const [sugerir, setSugerir] = useState(false);
  const [texto, setTexto] = useState("");
  const [notificar, setNotificar] = useState(true);

  const sugerencias = sugerir ? sugerirCitas(cita) : [];
  const listo =
    texto.trim().length >= 3 && (tipo === "aviso" || titulo.trim().length >= 3);

  const publicar = () => {
    if (!listo) return;
    const esDevocional = tipo === "devocional";
    enviarMensaje({
      id: `m${Date.now()}`,
      grupo: sala.id,
      autor: USUARIO.nombre,
      tipo,
      titulo: esDevocional ? titulo.trim() : undefined,
      cita: esDevocional ? cita.trim() || undefined : undefined,
      texto: texto.trim(),
      fecha: new Date().toISOString(),
    });
    if (notificar) {
      avisarAhora(
        esDevocional
          ? `Devocional en ${sala.label}: ${titulo.trim()} 📖`
          : `Aviso de ${sala.label} 📣`,
        esDevocional ? cita.trim() || texto.trim() : texto.trim(),
      ).catch(() => {});
    }
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
                  <Text style={styles.titulo}>Publicar en {sala.label}</Text>
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
                  {/* Aviso o devocional */}
                  <View style={styles.tipos}>
                    {TIPOS.map((t) => {
                      const activo = t.id === tipo;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => setTipo(t.id)}
                          style={[styles.tipo, activo && styles.tipoActivo]}
                          accessibilityRole="tab"
                          accessibilityState={{ selected: activo }}
                        >
                          <Octicons
                            name={t.icono}
                            size={13}
                            color={activo ? DARK_BG : MUTED}
                          />
                          <Text
                            style={[styles.tipoTexto, activo && styles.oscuro]}
                          >
                            {t.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.ayuda}>
                    {tipo === "aviso"
                      ? "Un mensaje corto para todo el grupo: un cambio de horario, una reunión, algo que deben saber."
                      : "Una palabra para todo el grupo: un versículo y lo que Dios te mostró en él."}
                  </Text>

                  {tipo === "devocional" && (
                    <>
                      <Text style={styles.etiqueta}>TÍTULO</Text>
                      <TextInput
                        value={titulo}
                        onChangeText={setTitulo}
                        placeholder="Ej: Confiar en medio de la tormenta"
                        placeholderTextColor="#555555"
                        autoCapitalize="sentences"
                        maxLength={70}
                        style={styles.input}
                      />

                      <Text style={styles.etiqueta}>VERSÍCULO</Text>
                      <TextInput
                        value={cita}
                        onChangeText={(t) => {
                          setCita(t);
                          setSugerir(true);
                        }}
                        placeholder="Ej: Marcos 4:39"
                        placeholderTextColor="#555555"
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
                    </>
                  )}

                  <Text style={styles.etiqueta}>
                    {tipo === "aviso" ? "AVISO" : "REFLEXIÓN"}
                  </Text>
                  <TextInput
                    value={texto}
                    onChangeText={setTexto}
                    placeholder={
                      tipo === "aviso"
                        ? "Ej: Este jueves la reunión es a las 20:00"
                        : "Escribe la reflexión para el grupo…"
                    }
                    placeholderTextColor="#555555"
                    autoCapitalize="sentences"
                    multiline
                    textAlignVertical="top"
                    style={[
                      styles.input,
                      tipo === "devocional"
                        ? styles.inputLargo
                        : styles.inputMedio,
                    ]}
                  />

                  {/* Notificar */}
                  <View style={styles.notificar}>
                    <Octicons name="bell" size={16} color={TEXT} />
                    <View style={styles.flex}>
                      <Text style={styles.notificarTitulo}>
                        Notificar a todos
                      </Text>
                      <Text style={styles.ayuda}>
                        Les llega un aviso al teléfono, además del chat.
                      </Text>
                    </View>
                    <Switch
                      value={notificar}
                      onValueChange={setNotificar}
                      trackColor={{ false: BORDER, true: PRIMARY }}
                      thumbColor="#FFFFFF"
                      accessibilityLabel="Notificar a todos"
                    />
                  </View>
                </ScrollView>

                <Pressable
                  onPress={publicar}
                  disabled={!listo}
                  style={({ pressed }) => [
                    styles.boton,
                    !listo && styles.apagado,
                    pressed && styles.presionado,
                  ]}
                >
                  <Octicons
                    name={tipo === "aviso" ? "megaphone" : "book"}
                    size={16}
                    color={DARK_BG}
                  />
                  <Text style={styles.botonTexto}>
                    {tipo === "aviso" ? "Enviar aviso" : "Publicar devocional"}
                  </Text>
                </Pressable>
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
    borderColor: "#3A3A3A",
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4A4A4A",
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
  tipos: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 999,
    backgroundColor: DARK_BG,
  },
  tipo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 999,
  },
  tipoActivo: {
    backgroundColor: TEXT,
  },
  tipoTexto: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: MUTED,
  },
  oscuro: {
    color: DARK_BG,
  },
  ayuda: {
    fontSize: 12,
    lineHeight: 17,
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
  inputMedio: {
    minHeight: 90,
  },
  inputLargo: {
    minHeight: 140,
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
  notificar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    marginTop: SPACING / 2,
    padding: SPACING * 1.2,
    borderRadius: 14,
    backgroundColor: DARK_BG,
  },
  notificarTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
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
  botonTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: DARK_BG,
  },
});

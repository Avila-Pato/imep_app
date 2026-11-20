import {
  BORDER,
  DARK_BG,
  FUENTE,
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
import SelectorHora from "@/screens/(tab)/components/SelectorHora";
import { sugerirCitas } from "@/services/biblia";
import { MAX_PALABRAS_MEMORIZAR, palabrasDe } from "@/utils/memorizar";
import { diaKey } from "@/utils/tiempo";
import { enviarMensaje, useEstudios, useMiembros } from "@/store/estudios";
import { miembrosDe } from "./MiembrosSala";
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

type Tipo = "aviso" | "devocional" | "encuentro" | "memorizar";

const TIPOS: {
  id: Tipo;
  label: string;
  icono: "megaphone" | "book" | "calendar" | "mortar-board";
  ayuda: string;
  boton: string;
}[] = [
  {
    id: "aviso",
    label: "Aviso",
    icono: "megaphone",
    ayuda:
      "Un mensaje corto para todo el grupo: un cambio de horario, una reunión, algo que deben saber.",
    boton: "Enviar aviso",
  },
  {
    id: "devocional",
    label: "Devocional",
    icono: "book",
    ayuda:
      "Una palabra para todo el grupo: un versículo y lo que Dios te mostró en él.",
    boton: "Publicar devocional",
  },
  {
    id: "encuentro",
    label: "Encuentro",
    icono: "calendar",
    ayuda:
      "Un desayuno, una salida, una reunión especial. Cada uno responde Voy o No puedo y tú ves cuántos van.",
    boton: "Invitar al encuentro",
  },
  {
    id: "memorizar",
    label: "Para memorizar",
    icono: "mortar-board",
    ayuda:
      "Un versículo para aprender de memoria con un juego (completar y ordenar). Ves quiénes ya lo aprendieron.",
    boton: "Publicar versículo",
  },
];

// Los proximos 60 dias para el encuentro
const DIAS = Array.from({ length: 60 }, (_, i) => {
  const f = new Date();
  f.setDate(f.getDate() + i);
  return {
    key: diaKey(f),
    arriba:
      i === 0
        ? "HOY"
        : i === 1
          ? "MAÑANA"
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

// El lider del grupo publica para toda su sala: un aviso corto, un
// devocional (titulo, versiculo y reflexion), un encuentro (Voy / No puedo)
// o un versiculo para memorizar (con juego). Puede notificar a todos
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
  // encuentro
  const [fecha, setFecha] = useState(DIAS[0].key);
  const [conHora, setConHora] = useState(true);
  const [hora, setHora] = useState("19:00");
  const [lugar, setLugar] = useState("");
  // a quien le llega la notificacion: vacio = a toda la sala
  const [para, setPara] = useState<string[]>([]);
  const { nombre } = useEstudios("nombre");
  useMiembros(); // se actualiza cuando llegan del servidor
  const yo = nombre?.trim() ?? "";
  const personas = miembrosDe(sala.id)
    .map((m) => m.nombre)
    .filter((n) => n.trim() !== yo);
  const alternar = (n: string) =>
    setPara((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  const sugerencias = sugerir ? sugerirCitas(cita) : [];
  const info = TIPOS.find((t) => t.id === tipo)!;
  // para memorizar: el texto del versiculo (se guarda con el mensaje, asi
  // todos juegan con el mismo)
  const pasaje = usePasaje(tipo === "memorizar" ? cita : "");
  const versiculo = pasaje.versos?.map((v) => v.texto).join(" ") ?? "";
  const largo = palabrasDe(versiculo).length > MAX_PALABRAS_MEMORIZAR;
  const listo =
    tipo === "aviso"
      ? texto.trim().length >= 3
      : tipo === "devocional"
        ? texto.trim().length >= 3 && titulo.trim().length >= 3
        : tipo === "encuentro"
          ? titulo.trim().length >= 3
          : !!versiculo && !largo;

  const publicar = () => {
    if (!listo) return;
    const conTitulo = tipo === "devocional" || tipo === "encuentro";
    const conCita = tipo === "devocional" || tipo === "memorizar";
    enviarMensaje({
      id: `m${Date.now()}`,
      grupo: sala.id,
      autor: yo || "Líder",
      tipo,
      titulo: conTitulo ? titulo.trim() : undefined,
      cita: conCita ? cita.trim() || undefined : undefined,
      ...(tipo === "memorizar" ? { versiculo } : {}),
      ...(tipo === "encuentro"
        ? {
            encuentro: {
              fecha,
              ...(conHora ? { hora } : {}),
              ...(lugar.trim() ? { lugar: lugar.trim() } : {}),
            },
          }
        : {}),
      texto: texto.trim(),
      fecha: new Date().toISOString(),
      // el servidor avisa a la sala (o solo a los elegidos)
      notificar,
      ...(notificar && para.length ? { para } : {}),
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
                  <Text style={styles.ayuda}>{info.ayuda}</Text>

                  {(tipo === "devocional" || tipo === "encuentro") && (
                    <>
                      <Text style={styles.etiqueta}>
                        {tipo === "encuentro" ? "¿QUÉ HAREMOS?" : "TÍTULO"}
                      </Text>
                      <TextInput
                        value={titulo}
                        onChangeText={setTitulo}
                        placeholder={
                          tipo === "encuentro"
                            ? "Ej: Desayuno de mujeres"
                            : "Ej: Confiar en medio de la tormenta"
                        }
                        placeholderTextColor={PLACEHOLDER}
                        autoCapitalize="sentences"
                        maxLength={70}
                        style={styles.input}
                      />
                    </>
                  )}

                  {tipo === "encuentro" && (
                    <>
                      <Text style={styles.etiqueta}>¿CUÁNDO?</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.dias}
                        contentContainerStyle={styles.diasContent}
                        keyboardShouldPersistTaps="handled"
                      >
                        {DIAS.map((d) => {
                          const activo = d.key === fecha;
                          return (
                            <Pressable
                              key={d.key}
                              onPress={() => setFecha(d.key)}
                              style={[styles.dia, activo && styles.diaActivo]}
                              accessibilityState={{ selected: activo }}
                            >
                              <Text
                                style={[
                                  styles.diaArriba,
                                  activo && styles.oscuro,
                                ]}
                              >
                                {d.arriba}
                              </Text>
                              <Text
                                style={[
                                  styles.diaNumero,
                                  activo && styles.oscuro,
                                ]}
                              >
                                {d.numero}
                              </Text>
                              <Text
                                style={[
                                  styles.diaArriba,
                                  activo && styles.oscuro,
                                ]}
                              >
                                {d.mes}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                      <View style={styles.filaHora}>
                        <View style={styles.flex}>
                          <Text style={styles.etiqueta}>HORA</Text>
                          {!conHora && (
                            <Text style={styles.ayuda}>Sin hora fija</Text>
                          )}
                        </View>
                        {conHora && (
                          <SelectorHora hora={hora} onCambiar={setHora} />
                        )}
                        <Switch
                          value={conHora}
                          onValueChange={setConHora}
                          trackColor={{ false: BORDER, true: PRIMARY }}
                          thumbColor="#FFFFFF"
                          accessibilityLabel="Con hora"
                        />
                      </View>
                      <Text style={styles.etiqueta}>¿DÓNDE? (OPCIONAL)</Text>
                      <TextInput
                        value={lugar}
                        onChangeText={setLugar}
                        placeholder="Ej: En la iglesia, salón de abajo"
                        placeholderTextColor={PLACEHOLDER}
                        autoCapitalize="sentences"
                        maxLength={90}
                        style={styles.input}
                      />
                    </>
                  )}

                  {(tipo === "devocional" || tipo === "memorizar") && (
                    <>
                      <Text style={styles.etiqueta}>VERSÍCULO</Text>
                      <TextInput
                        value={cita}
                        onChangeText={(t) => {
                          setCita(t);
                          setSugerir(true);
                        }}
                        placeholder={
                          tipo === "memorizar"
                            ? "Ej: Filipenses 4:13"
                            : "Ej: Marcos 4:39"
                        }
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
                      {/* para memorizar: asi se vera (y se jugara) */}
                      {tipo === "memorizar" && pasaje.valida && (
                        <View style={styles.previa}>
                          {pasaje.cargando ? (
                            <Text style={styles.ayuda}>Buscando…</Text>
                          ) : versiculo ? (
                            <>
                              <Text style={styles.previaTexto}>
                                “{versiculo}”
                              </Text>
                              {largo && (
                                <Text style={styles.aviso}>
                                  Es muy largo para memorizar. Elige uno o dos
                                  versículos.
                                </Text>
                              )}
                            </>
                          ) : (
                            <Text style={styles.aviso}>
                              {pasaje.error ?? "No se encontró el versículo"}
                            </Text>
                          )}
                        </View>
                      )}
                    </>
                  )}

                  <Text style={styles.etiqueta}>
                    {tipo === "aviso"
                      ? "AVISO"
                      : tipo === "devocional"
                        ? "REFLEXIÓN"
                        : tipo === "encuentro"
                          ? "DETALLES (OPCIONAL)"
                          : "UNA NOTA (OPCIONAL)"}
                  </Text>
                  <TextInput
                    value={texto}
                    onChangeText={setTexto}
                    placeholder={
                      tipo === "aviso"
                        ? "Ej: Este jueves la reunión es a las 20:00"
                        : tipo === "devocional"
                          ? "Escribe la reflexión para el grupo…"
                          : tipo === "encuentro"
                            ? "Ej: Cada una trae algo para compartir 🥐"
                            : "Ej: ¡El domingo lo decimos juntos!"
                    }
                    placeholderTextColor={PLACEHOLDER}
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
                        Enviar notificación
                      </Text>
                      <Text style={styles.ayuda}>
                        Les llega al teléfono, además de verse en el chat.
                      </Text>
                    </View>
                    <Switch
                      value={notificar}
                      onValueChange={setNotificar}
                      trackColor={{ false: BORDER, true: PRIMARY }}
                      thumbColor="#FFFFFF"
                      accessibilityLabel="Enviar notificación"
                    />
                  </View>

                  {/* A quien: toda la sala o personas elegidas */}
                  {notificar && personas.length > 0 && (
                    <>
                      <Text style={styles.etiqueta}>¿A QUIÉN?</Text>
                      <View style={styles.chips}>
                        <Pressable
                          onPress={() => setPara([])}
                          style={[
                            styles.chip,
                            para.length === 0 && styles.chipActivo,
                          ]}
                          accessibilityState={{ selected: para.length === 0 }}
                        >
                          <Octicons
                            name="people"
                            size={12}
                            color={para.length === 0 ? DARK_BG : MUTED}
                          />
                          <Text
                            style={[
                              styles.chipTexto,
                              para.length === 0 && styles.chipTextoActivo,
                            ]}
                          >
                            Toda la sala
                          </Text>
                        </Pressable>
                        {personas.map((n) => {
                          const activo = para.includes(n);
                          return (
                            <Pressable
                              key={n}
                              onPress={() => alternar(n)}
                              style={[styles.chip, activo && styles.chipActivo]}
                              accessibilityState={{ selected: activo }}
                            >
                              <Text
                                style={[
                                  styles.chipTexto,
                                  activo && styles.chipTextoActivo,
                                ]}
                              >
                                {n}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      <Text style={styles.ayuda}>
                        {para.length
                          ? `Solo le llega a ${para.join(", ")}. En el chat lo ven todos.`
                          : "Les llega a todos los de la sala."}
                      </Text>
                    </>
                  )}
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
                  <Octicons name={info.icono} size={16} color={DARK_BG} />
                  <Text style={styles.botonTexto}>{info.boton}</Text>
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
  tipos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 4,
    borderRadius: 18,
    backgroundColor: DARK_BG,
  },
  tipo: {
    flexGrow: 1,
    flexBasis: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
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
  previa: {
    gap: 6,
    padding: SPACING * 1.4,
    borderRadius: 14,
    backgroundColor: DARK_BG,
  },
  previaTexto: {
    fontFamily: FUENTE.biblia,
    fontSize: 17,
    lineHeight: 24,
    color: TEXT,
  },
  aviso: {
    fontSize: 12,
    lineHeight: 17,
    color: "#E5484D",
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
  filaHora: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
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
  chipTextoActivo: {
    color: DARK_BG,
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

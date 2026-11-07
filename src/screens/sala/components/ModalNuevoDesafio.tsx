import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { sugerirCitas } from "@/services/biblia";
import { crearDesafio, enviarMensaje } from "@/store/estudios";
import { Grupo } from "@/types/typesComunidad";
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
import ConBordes from "@/components/ConBordes";
import { miembrosDe } from "./MiembrosSala";

const CONSIGNA =
  "Elige un versículo de la Biblia y cuéntanos qué te enseñó esta semana.";

const pad = (n: number) => String(n).padStart(2, "0");
const enDias = (n: number) => {
  const f = new Date();
  f.setDate(f.getDate() + n);
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
};
// Las proximas dos semanas para repartir los dias (desde mañana)
const DIAS = Array.from({ length: 14 }, (_, i) => {
  const key = enDias(i + 1);
  const [y, m, d] = key.split("-").map(Number);
  const f = new Date(y, m - 1, d);
  return {
    key,
    dia: f
      .toLocaleDateString("es-ES", { weekday: "short" })
      .replace(".", "")
      .toUpperCase(),
    numero: d,
  };
});

// "Ana, Pedro y Juan"
const unirNombres = (n: string[]) =>
  n.length <= 1 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} y ${n.at(-1)}`;

// El lider elige a quienes les toca y que deben hacer
export default function ModalNuevoDesafio({
  sala,
  visible,
  onCerrar,
}: {
  sala: Grupo;
  visible: boolean;
  onCerrar: () => void;
}) {
  const [elegidos, setElegidos] = useState<string[]>([]);
  // el dia que le toca hablar a cada uno
  const [dias, setDias] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState<string[]>([]); // escritos a mano
  const [nombre, setNombre] = useState("");
  const [consigna, setConsigna] = useState(CONSIGNA);
  const [cita, setCita] = useState("");
  const [sugerir, setSugerir] = useState(false);

  const miembros = [
    ...new Set([...miembrosDe(sala.id).map((m) => m.nombre), ...extra]),
  ];
  const sugerencias = sugerir ? sugerirCitas(cita) : [];
  const listo = elegidos.length > 0 && consigna.trim().length >= 5;

  // al elegir a alguien se le da el primer dia libre (luego se puede cambiar)
  const sumar = (n: string) => {
    setElegidos((e) => (e.includes(n) ? e : [...e, n]));
    setDias((d) => {
      if (d[n]) return d;
      const usados = Object.values(d);
      const libre = DIAS.find((x) => !usados.includes(x.key)) ?? DIAS[0];
      return { ...d, [n]: libre.key };
    });
  };
  const alternar = (n: string) => {
    if (!elegidos.includes(n)) return sumar(n);
    setElegidos((e) => e.filter((x) => x !== n));
    setDias((d) => {
      const resto = { ...d };
      delete resto[n];
      return resto;
    });
  };

  const agregar = () => {
    const limpio = nombre.trim().replace(/\s+/g, " ");
    if (!limpio) return;
    if (!miembros.includes(limpio)) setExtra((x) => [...x, limpio]);
    sumar(limpio);
    setNombre("");
  };

  const cerrar = () => {
    setElegidos([]);
    setDias({});
    setExtra([]);
    setNombre("");
    setConsigna(CONSIGNA);
    setCita("");
    onCerrar();
  };

  const dar = () => {
    if (!listo) return;
    const fija = cita.trim() || undefined;
    crearDesafio({
      grupo: sala.id,
      autor: USUARIO.nombre,
      consigna: consigna.trim(),
      cita: fija,
      elegidos,
      dias,
      // se ve hasta el dia del ultimo que habla
      hasta:
        elegidos
          .map((n) => dias[n])
          .sort()
          .at(-1) ?? enDias(7),
    });
    // aviso en el chat para que todos lo vean
    enviarMensaje({
      id: `m${Date.now()}`,
      grupo: sala.id,
      autor: USUARIO.nombre,
      cita: fija,
      texto: `📖 Palabra de la semana para ${unirNombres(elegidos)}: ${consigna.trim()}`,
      fecha: new Date().toISOString(),
    });
    cerrar();
  };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={cerrar}
    >
      <ConBordes>
        {(insets) => (
          <>
            <Pressable style={styles.fondo} onPress={cerrar} />
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
                  <Text style={styles.titulo}>Palabra de la semana</Text>
                  <Pressable
                    onPress={cerrar}
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
                  <Text style={styles.sub}>
                    Elige a los hermanos y el día que le toca a cada uno. Ese
                    día les llegará un aviso para compartir su palabra en{" "}
                    {sala.label}.
                  </Text>

                  {/* A quienes */}
                  <Text style={styles.etiqueta}>
                    ¿A QUIÉNES?
                    {elegidos.length > 0 ? ` · ${elegidos.length}` : ""}
                  </Text>
                  <View style={styles.chips}>
                    {miembros.map((n) => {
                      const activo = elegidos.includes(n);
                      return (
                        <Pressable
                          key={n}
                          onPress={() => alternar(n)}
                          style={[styles.chip, activo && styles.chipActivo]}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: activo }}
                        >
                          {activo && (
                            <Octicons name="check" size={12} color={DARK_BG} />
                          )}
                          <Text
                            style={[
                              styles.chipTexto,
                              activo && styles.chipTextoActivo,
                            ]}
                          >
                            {n === USUARIO.nombre ? `${n} (tú)` : n}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.agregar}>
                    <TextInput
                      value={nombre}
                      onChangeText={setNombre}
                      onSubmitEditing={agregar}
                      placeholder="Agregar otro nombre"
                      placeholderTextColor="#555555"
                      autoCapitalize="words"
                      returnKeyType="done"
                      style={[styles.input, styles.flex]}
                    />
                    <Pressable
                      onPress={agregar}
                      disabled={!nombre.trim()}
                      style={[styles.mas, !nombre.trim() && styles.apagado]}
                      accessibilityLabel="Agregar nombre"
                    >
                      <Octicons name="plus" size={16} color={DARK_BG} />
                    </Pressable>
                  </View>

                  {/* El dia de cada uno */}
                  {elegidos.length > 0 && (
                    <>
                      <Text style={styles.etiqueta}>
                        ¿QUÉ DÍA LE TOCA A CADA UNO?
                      </Text>
                      {elegidos.map((n) => (
                        <View key={n} style={styles.turno}>
                          <Text style={styles.turnoNombre} numberOfLines={1}>
                            {n === USUARIO.nombre ? "Tú" : n}
                          </Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.diasContent}
                          >
                            {DIAS.map((d) => {
                              const activo = dias[n] === d.key;
                              return (
                                <Pressable
                                  key={d.key}
                                  onPress={() =>
                                    setDias((x) => ({ ...x, [n]: d.key }))
                                  }
                                  style={[
                                    styles.dia,
                                    activo && styles.chipActivo,
                                  ]}
                                  accessibilityState={{ selected: activo }}
                                >
                                  <Text
                                    style={[
                                      styles.diaTexto,
                                      activo && styles.chipTextoActivo,
                                    ]}
                                  >
                                    {d.dia}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.diaNumero,
                                      activo && styles.chipTextoActivo,
                                    ]}
                                  >
                                    {d.numero}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </ScrollView>
                        </View>
                      ))}
                    </>
                  )}

                  {/* Que hacer */}
                  <Text style={styles.etiqueta}>¿QUÉ DEBEN HACER?</Text>
                  <TextInput
                    value={consigna}
                    onChangeText={setConsigna}
                    multiline
                    textAlignVertical="top"
                    style={[styles.input, styles.inputLargo]}
                  />

                  <Text style={styles.etiqueta}>VERSÍCULO (OPCIONAL)</Text>
                  <TextInput
                    value={cita}
                    onChangeText={(t) => {
                      setCita(t);
                      setSugerir(true);
                    }}
                    placeholder="Vacío = cada uno elige el suyo"
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
                </ScrollView>

                <Pressable
                  onPress={dar}
                  disabled={!listo}
                  style={({ pressed }) => [
                    styles.boton,
                    !listo && styles.apagado,
                    pressed && styles.presionado,
                  ]}
                >
                  <Text style={styles.botonTexto}>
                    {elegidos.length === 0
                      ? "Elige al menos a un hermano"
                      : `Dar a ${elegidos.length} ${elegidos.length === 1 ? "hermano" : "hermanos"}`}
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
  sub: {
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
  turno: {
    gap: 6,
  },
  turnoNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },
  diasContent: {
    gap: 6,
  },
  dia: {
    width: 46,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  diaTexto: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: MUTED,
  },
  diaNumero: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
  },
  agregar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  mas: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  input: {
    minHeight: 44,
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
    minHeight: 84,
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
  boton: {
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

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
} from "@/constants/constans";
import { MIEMBROS } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  borrarSala,
  crearSala,
  editarSala,
  useEstudios,
} from "@/store/estudios";
import { FuncionSala, Grupo } from "@/types/typesComunidad";
import { confirmar } from "@/utils/confirmar";
import { IconName } from "@/types/typesCronogramas";
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

// Lo que puede tener cada sala (se elige al crearla)
const FUNCIONES: {
  id: FuncionSala;
  titulo: string;
  texto: string;
  icono: IconName;
}[] = [
  {
    id: "chat",
    titulo: "Chat",
    texto: "Conversar y compartir versículos",
    icono: "comment-discussion",
  },
  {
    id: "oracion",
    titulo: "Muro de oración",
    texto: "Peticiones que el líder aprueba",
    icono: "heart",
  },
  {
    id: "palabra",
    titulo: "Palabra de la semana",
    texto: "El líder elige hermanos para compartir un versículo",
    icono: "book",
  },
];
const TODAS: Record<FuncionSala, boolean> = {
  chat: true,
  oracion: true,
  palabra: true,
};

// Opciones para la sala nueva
const ICONOS: IconName[] = [
  "people",
  "unmute",
  "heart",
  "book",
  "flame",
  "star",
  "globe",
  "home",
  "gift",
  "rocket",
];
const TONOS = [
  "#D8C8A8",
  "#B8C4CC",
  "#D5C1BF",
  "#C2CCB6",
  "#C9B7D6",
  "#E0B9A0",
];

// Hoja para que el pastor cree una sala (ej: Alabanza, Matrimonios)
// o, con `sala`, edite una que ya existe (se monta al abrirla)
export default function ModalNuevaSala({
  visible,
  onCerrar,
  sala,
  onBorrada,
}: {
  visible: boolean;
  onCerrar: () => void;
  sala?: Grupo;
  onBorrada?: () => void;
}) {
  const [nombre, setNombre] = useState(sala?.label ?? "");
  const [descripcion, setDescripcion] = useState(sala?.descripcion ?? "");
  const [icono, setIcono] = useState<IconName>(sala?.icono ?? ICONOS[0]);
  const [tono, setTono] = useState(sala?.tono ?? TONOS[0]);
  // lider: tendra las opciones de la sala (palabra de la semana, aprobar)
  const [lider, setLider] = useState<string | null>(sala?.lider ?? null);
  const [funciones, setFunciones] = useState({
    ...TODAS,
    ...sala?.funciones,
  });
  // la de toda la iglesia no se puede borrar
  const sePuedeBorrar = !!sala && sala.id !== "general";
  const [otro, setOtro] = useState("");
  const { nombre: miNombre, invitados } = useEstudios();
  const personas = [
    ...new Set([
      ...MIEMBROS.general.map((m) => m.nombre),
      ...invitados,
      ...(lider ? [lider] : []),
    ]),
  ].filter((n) => n !== (miNombre ?? USUARIO.nombre));
  const listo = nombre.trim().length >= 2;

  const cerrar = () => {
    setNombre("");
    setDescripcion("");
    setIcono(ICONOS[0]);
    setTono(TONOS[0]);
    setLider(null);
    setOtro("");
    setFunciones(TODAS);
    onCerrar();
  };

  const crear = () => {
    if (!listo) return;
    const datos = {
      label: nombre.trim(),
      descripcion: descripcion.trim() || `Sala de ${nombre.trim()}`,
      icono,
      tono,
      lider: lider ?? undefined,
      funciones,
    };
    if (sala) editarSala(sala.id, datos);
    else crearSala(datos);
    cerrar();
  };

  const borrar = () =>
    sala &&
    confirmar(
      `¿Borrar la sala ${sala.label}?`,
      "Se quitará para todos, con su palabra de la semana. Esto no se puede deshacer.",
      "Borrar",
      () => {
        borrarSala(sala.id);
        cerrar();
        onBorrada?.();
      },
    );

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
              // en Android la hoja (pantalla completa) no se achica sola: se sube aqui
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
                <ScrollView
                  contentContainerStyle={styles.contenido}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.cabecera}>
                    <Text style={styles.titulo}>
                      {sala ? "Editar sala" : "Nueva sala"}
                    </Text>
                    <Pressable
                      onPress={cerrar}
                      hitSlop={10}
                      accessibilityLabel="Cerrar"
                    >
                      <Octicons name="x" size={18} color={MUTED} />
                    </Pressable>
                  </View>

                  {/* Vista previa */}
                  <View style={styles.previa}>
                    <View
                      style={[styles.previaIcono, { backgroundColor: tono }]}
                    >
                      <Octicons name={icono} size={20} color={DARK_BG} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.previaNombre}>
                        {nombre.trim() || "Nombre de la sala"}
                      </Text>
                      <Text style={styles.meta}>
                        {descripcion.trim() || "Descripción corta"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.etiqueta}>NOMBRE</Text>
                  <TextInput
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Ej: Alabanza, Matrimonios"
                    placeholderTextColor={PLACEHOLDER}
                    autoCapitalize="sentences"
                    style={styles.input}
                  />

                  <Text style={styles.etiqueta}>DESCRIPCIÓN</Text>
                  <TextInput
                    value={descripcion}
                    onChangeText={setDescripcion}
                    placeholder="Ej: Equipo de música del culto"
                    placeholderTextColor={PLACEHOLDER}
                    style={styles.input}
                  />

                  {/* Que tendra la sala */}
                  <Text style={styles.etiqueta}>¿QUÉ TENDRÁ LA SALA?</Text>
                  <View style={styles.funciones}>
                    {FUNCIONES.map((f, i) => (
                      <View
                        key={f.id}
                        style={[styles.funcion, i > 0 && styles.funcionLinea]}
                      >
                        <Octicons name={f.icono} size={16} color={TEXT} />
                        <View style={styles.flex}>
                          <Text style={styles.funcionTitulo}>{f.titulo}</Text>
                          <Text style={styles.meta}>{f.texto}</Text>
                        </View>
                        <Switch
                          value={funciones[f.id]}
                          onValueChange={(v) =>
                            setFunciones((x) => ({ ...x, [f.id]: v }))
                          }
                          trackColor={{ false: BORDER, true: PRIMARY }}
                          thumbColor="#FFFFFF"
                          accessibilityLabel={f.titulo}
                        />
                      </View>
                    ))}
                  </View>

                  {/* Quien guia la sala */}
                  <Text style={styles.etiqueta}>
                    LÍDER DE LA SALA (OPCIONAL)
                  </Text>
                  <Text style={styles.ayuda}>
                    Podrá dar la palabra de la semana y aprobar las peticiones
                    de oración. Tú siempre puedes hacerlo.
                  </Text>
                  <View style={styles.opciones}>
                    {personas.map((n) => {
                      const activo = n === lider;
                      return (
                        <Pressable
                          key={n}
                          onPress={() => setLider(activo ? null : n)}
                          style={[
                            styles.persona,
                            activo && styles.personaActiva,
                          ]}
                          accessibilityState={{ selected: activo }}
                        >
                          {activo && (
                            <Octicons name="check" size={12} color={DARK_BG} />
                          )}
                          <Text
                            style={[
                              styles.personaTexto,
                              activo && styles.personaTextoActiva,
                            ]}
                          >
                            {n}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <TextInput
                    value={otro}
                    onChangeText={setOtro}
                    onSubmitEditing={() => {
                      const limpio = otro.trim().replace(/\s+/g, " ");
                      if (limpio) setLider(limpio);
                      setOtro("");
                    }}
                    placeholder="U escribe su nombre"
                    placeholderTextColor={PLACEHOLDER}
                    autoCapitalize="words"
                    returnKeyType="done"
                    style={styles.input}
                  />

                  <Text style={styles.etiqueta}>ÍCONO</Text>
                  <View style={styles.opciones}>
                    {ICONOS.map((i) => (
                      <Pressable
                        key={i}
                        onPress={() => setIcono(i)}
                        style={[
                          styles.opcion,
                          i === icono && styles.opcionActiva,
                        ]}
                        accessibilityState={{ selected: i === icono }}
                      >
                        <Octicons
                          name={i}
                          size={18}
                          color={i === icono ? DARK_BG : TEXT}
                        />
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.etiqueta}>COLOR</Text>
                  <View style={styles.opciones}>
                    {TONOS.map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => setTono(t)}
                        style={[
                          styles.color,
                          { backgroundColor: t },
                          t === tono && styles.colorActivo,
                        ]}
                        accessibilityState={{ selected: t === tono }}
                      />
                    ))}
                  </View>

                  <Pressable
                    onPress={crear}
                    disabled={!listo}
                    style={({ pressed }) => [
                      styles.boton,
                      !listo && styles.botonApagado,
                      pressed && styles.presionado,
                    ]}
                  >
                    <Text style={styles.botonTexto}>
                      {sala ? "Guardar cambios" : "Crear sala"}
                    </Text>
                  </Pressable>
                  {sePuedeBorrar && (
                    <Pressable
                      onPress={borrar}
                      style={({ pressed }) => [
                        styles.borrar,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Octicons name="trash" size={14} color={PRIMARY} />
                      <Text style={styles.borrarTexto}>Borrar sala</Text>
                    </Pressable>
                  )}
                </ScrollView>
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
  fondo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  zona: {
    flex: 1,
    justifyContent: "flex-end",
  },
  hoja: {
    maxHeight: "88%",
    paddingTop: SPACING,
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
    backgroundColor: LINEA,
  },
  contenido: {
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    gap: SPACING,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titulo: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 22,
    color: TEXT,
  },
  previa: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    marginVertical: SPACING / 2,
    borderRadius: 18,
    backgroundColor: DARK_BG,
  },
  previaIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  previaNombre: {
    fontFamily: FUENTE.semibold,
    fontSize: 16,
    color: TEXT,
  },
  meta: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginTop: SPACING / 2,
  },
  input: {
    height: 46,
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 14,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    fontSize: 15,
    color: TEXT,
  },
  funciones: {
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: DARK_BG,
  },
  funcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
  },
  funcionLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  funcionTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
  },
  borrar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
  },
  borrarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY,
  },
  ayuda: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    marginTop: -4,
  },
  persona: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  personaActiva: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  personaTexto: {
    fontSize: 13,
    color: MUTED,
  },
  personaTextoActiva: {
    color: DARK_BG,
    fontWeight: "600",
  },
  opciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  opcion: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
  },
  opcionActiva: {
    backgroundColor: TEXT,
  },
  color: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorActivo: {
    borderWidth: 3,
    borderColor: TEXT,
  },
  boton: {
    height: 52,
    marginTop: SPACING,
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

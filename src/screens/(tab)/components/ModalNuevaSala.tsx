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
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  borrarSala,
  crearSala,
  editarSala,
  useEstudios,
  useMiembros,
} from "@/store/estudios";
import IconoSala from "@/components/IconoSala";
import { TIPOS_SALA, TipoDeSala } from "@/constants/tiposSala";
import { FuncionSala, Grupo, TipoSala } from "@/types/typesComunidad";
import { confirmar } from "@/utils/confirmar";
import { IconName } from "@/types/typesCronogramas";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
  "smiley",
  "shield",
  "sun",
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
  "#E8C47A",
  "#9FC2E0",
  "#E7A07E",
  "#D9A9B8",
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
  // "Lo elijo despues": la sala se crea sin lider (el pastor la guia mientras)
  const [despues, setDespues] = useState(
    !!sala && sala.id !== "general" && !sala.lider,
  );
  const elegirLider = (n: string | null) => {
    setLider(n);
    setDespues(false);
  };
  const [funciones, setFunciones] = useState({
    ...TODAS,
    ...sala?.funciones,
  });
  // sala nueva: primero "¿para quien es?" (cada tipo la deja lista)
  const [paso, setPaso] = useState<"tipo" | "datos">(sala ? "datos" : "tipo");
  const [tipo, setTipo] = useState<TipoSala | undefined>(sala?.tipo);
  const [foto, setFoto] = useState(sala?.foto ?? "");
  const [soloLider, setSoloLider] = useState(!!sala?.soloLider);
  const [letraGrande, setLetraGrande] = useState(!!sala?.letraGrande);

  const elegirTipo = (t: TipoDeSala) => {
    setTipo(t.id);
    setNombre(t.nombre);
    setDescripcion(t.descripcion);
    setIcono(t.icono);
    setTono(t.tono);
    setFunciones(t.funciones);
    setSoloLider(!!t.soloLider);
    setLetraGrande(!!t.letraGrande);
    setPaso("datos");
  };

  const elegirFoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1], // va en un circulo
      quality: 0.7,
    });
    if (!r.canceled && r.assets[0]) setFoto(r.assets[0].uri);
  };
  // la de toda la iglesia no se puede borrar
  const sePuedeBorrar = !!sala && sala.id !== "general";
  const [otro, setOtro] = useState("");
  const { nombre: miNombre, invitados } = useEstudios();
  const hermanos = useMiembros();
  const personas = [
    ...new Set([
      ...hermanos.map((m) => m.nombre),
      ...invitados,
      ...(lider ? [lider] : []),
    ]),
  ].filter((n) => n !== (miNombre ?? USUARIO.nombre));
  // toda sala tiene un lider que la administra (la de toda la iglesia la
  // guia el pastor)
  const pideLider = sala?.id !== "general";
  const sinNombre = nombre.trim().length < 2;
  const sinLider = pideLider && !lider && !despues;
  const listo = !sinNombre && !sinLider;
  // toco el boton sin completar: se le dice que falta
  const [falta, setFalta] = useState(false);

  const cerrar = () => {
    setNombre("");
    setDescripcion("");
    setIcono(ICONOS[0]);
    setTono(TONOS[0]);
    setLider(null);
    setDespues(false);
    setOtro("");
    setFunciones(TODAS);
    setPaso(sala ? "datos" : "tipo");
    setTipo(sala?.tipo);
    setFoto(sala?.foto ?? "");
    setSoloLider(!!sala?.soloLider);
    setLetraGrande(!!sala?.letraGrande);
    onCerrar();
  };

  const crear = () => {
    if (!listo) return setFalta(true);
    const datos = {
      label: nombre.trim(),
      descripcion: descripcion.trim() || `Sala de ${nombre.trim()}`,
      icono,
      tono,
      lider: lider ?? undefined,
      funciones,
      tipo,
      foto: foto || undefined,
      soloLider,
      letraGrande,
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
                      {sala
                        ? "Editar sala"
                        : paso === "tipo"
                          ? "¿Para quién es la sala?"
                          : "Nueva sala"}
                    </Text>
                    <Pressable
                      onPress={cerrar}
                      hitSlop={10}
                      accessibilityLabel="Cerrar"
                    >
                      <Octicons name="x" size={18} color={MUTED} />
                    </Pressable>
                  </View>

                  {paso === "tipo" ? (
                    <View style={styles.tipos}>
                      {/* Otra: bien a la vista (puede crear el grupo que quiera) */}
                      <Pressable
                        onPress={() =>
                          elegirTipo(TIPOS_SALA.find((t) => t.id === "otra")!)
                        }
                        style={({ pressed }) => [
                          styles.otra,
                          pressed && styles.presionado,
                        ]}
                        accessibilityLabel="Otro grupo: ponle el nombre que quieras"
                      >
                        <View style={styles.otraMas}>
                          <Octicons name="plus" size={20} color={TEXT} />
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.funcionTitulo}>Otro grupo</Text>
                          <Text style={styles.meta}>
                            ¿No está en la lista? Ponle el nombre que quieras
                            (ej: Intercesión, Ujieres, Célula norte)
                          </Text>
                        </View>
                        <Octicons
                          name="chevron-right"
                          size={14}
                          color={MUTED}
                        />
                      </Pressable>

                      <Text style={styles.separador}>O ELIGE UNO DE ESTOS</Text>
                      <Text style={styles.ayuda}>
                        La sala queda lista. Después puedes cambiar lo que
                        quieras.
                      </Text>
                      {TIPOS_SALA.filter((t) => t.id !== "otra").map((t) => (
                        <Pressable
                          key={t.id}
                          onPress={() => elegirTipo(t)}
                          style={({ pressed }) => [
                            styles.tipo,
                            pressed && styles.presionado,
                          ]}
                        >
                          <IconoSala
                            sala={{ icono: t.icono, tono: t.tono }}
                            tamano={42}
                          />
                          <View style={styles.flex}>
                            <Text style={styles.funcionTitulo}>{t.titulo}</Text>
                            <Text style={styles.meta}>{t.explica}</Text>
                          </View>
                          <Octicons
                            name="chevron-right"
                            size={14}
                            color={MUTED}
                          />
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <>
                      {/* volver a elegir el tipo (solo al crear) */}
                      {!sala && (
                        <Pressable
                          onPress={() => setPaso("tipo")}
                          hitSlop={8}
                          style={styles.cambiarTipo}
                        >
                          <Octicons name="arrow-left" size={12} color={MUTED} />
                          <Text style={styles.meta}>
                            Cambiar el tipo de grupo
                          </Text>
                        </Pressable>
                      )}

                      {/* Paso 1 */}
                      <View style={styles.seccion}>
                        <View style={styles.seccionNumero}>
                          <Text style={styles.seccionNumeroTexto}>1</Text>
                        </View>
                        <Text style={styles.seccionTitulo}>El grupo</Text>
                      </View>

                      {/* Vista previa (con la foto si tiene) */}
                      <View style={styles.previa}>
                        <IconoSala
                          sala={{ icono, tono, foto: foto || undefined }}
                          tamano={44}
                        />
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

                      {/* Paso 2 */}
                      <View style={styles.seccion}>
                        <View style={styles.seccionNumero}>
                          <Text style={styles.seccionNumeroTexto}>2</Text>
                        </View>
                        <Text style={styles.seccionTitulo}>Cómo se ve</Text>
                      </View>

                      {/* Foto de la sala (opcional) */}
                      <Text style={styles.etiqueta}>FOTO (OPCIONAL)</Text>
                      <View style={styles.fotoFila}>
                        <Pressable
                          onPress={elegirFoto}
                          style={({ pressed }) => [
                            styles.fotoCaja,
                            pressed && styles.presionado,
                          ]}
                          accessibilityLabel={
                            foto ? "Cambiar la foto" : "Elegir una foto"
                          }
                        >
                          {foto ? (
                            <Image
                              source={{ uri: foto }}
                              style={styles.fotoImagen}
                              contentFit="cover"
                            />
                          ) : (
                            <Octicons name="image" size={20} color={MUTED} />
                          )}
                        </Pressable>
                        <View style={styles.flex}>
                          <Text style={styles.funcionTitulo}>
                            {foto ? "Foto lista" : "Una foto del grupo"}
                          </Text>
                          <Text style={styles.meta}>
                            Se verá en lugar del ícono.
                          </Text>
                          <View style={styles.fotoAcciones}>
                            <Pressable onPress={elegirFoto} hitSlop={6}>
                              <Text style={styles.fotoAccion}>
                                {foto ? "Cambiar" : "Elegir foto"}
                              </Text>
                            </Pressable>
                            {!!foto && (
                              <Pressable
                                onPress={() => setFoto("")}
                                hitSlop={6}
                              >
                                <Text
                                  style={[styles.fotoAccion, styles.quitar]}
                                >
                                  Quitar
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* con foto no hace falta el icono (la foto lo reemplaza) */}
                      {!foto && (
                        <>
                          <Text style={styles.etiqueta}>O UN ÍCONO</Text>
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
                        </>
                      )}

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

                      {/* Paso 3 */}
                      <View style={styles.seccion}>
                        <View style={styles.seccionNumero}>
                          <Text style={styles.seccionNumeroTexto}>3</Text>
                        </View>
                        <Text style={styles.seccionTitulo}>
                          {pideLider ? "Líder de la sala" : "Líder (opcional)"}
                        </Text>
                      </View>

                      {/* Quien guia la sala */}
                      <Text style={styles.ayuda}>
                        Administra la sala: publica avisos, da la palabra de la
                        semana y aprueba las peticiones de oración. Tú siempre
                        puedes hacerlo también. Después, el líder puede elegir
                        ayudantes desde Miembros.
                      </Text>
                      <View style={styles.opciones}>
                        {pideLider && (
                          <Pressable
                            onPress={() => {
                              setLider(null);
                              setDespues(true);
                            }}
                            style={[
                              styles.persona,
                              despues && styles.personaActiva,
                            ]}
                            accessibilityState={{ selected: despues }}
                          >
                            <Octicons
                              name="clock"
                              size={12}
                              color={despues ? DARK_BG : MUTED}
                            />
                            <Text
                              style={[
                                styles.personaTexto,
                                despues && styles.personaTextoActiva,
                              ]}
                            >
                              Lo elijo después
                            </Text>
                          </Pressable>
                        )}
                        {personas.map((n) => {
                          const activo = n === lider;
                          return (
                            <Pressable
                              key={n}
                              onPress={() => elegirLider(activo ? null : n)}
                              style={[
                                styles.persona,
                                activo && styles.personaActiva,
                              ]}
                              accessibilityState={{ selected: activo }}
                            >
                              {activo && (
                                <Octicons
                                  name="check"
                                  size={12}
                                  color={DARK_BG}
                                />
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
                          if (limpio) elegirLider(limpio);
                          setOtro("");
                        }}
                        placeholder="U escribe su nombre"
                        placeholderTextColor={PLACEHOLDER}
                        autoCapitalize="words"
                        returnKeyType="done"
                        style={styles.input}
                      />

                      {/* Paso 4 */}
                      <View style={styles.seccion}>
                        <View style={styles.seccionNumero}>
                          <Text style={styles.seccionNumeroTexto}>4</Text>
                        </View>
                        <Text style={styles.seccionTitulo}>Qué tendrá</Text>
                      </View>

                      {/* Que tendra la sala */}
                      <View style={styles.funciones}>
                        {FUNCIONES.map((f, i) => (
                          <View
                            key={f.id}
                            style={[
                              styles.funcion,
                              i > 0 && styles.funcionLinea,
                            ]}
                          >
                            <Octicons name={f.icono} size={16} color={TEXT} />
                            <View style={styles.flex}>
                              <Text style={styles.funcionTitulo}>
                                {f.titulo}
                              </Text>
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
                        {/* Ajustes del grupo (en la misma tarjeta) */}
                        <View style={[styles.funcion, styles.funcionLinea]}>
                          <Octicons name="megaphone" size={16} color={TEXT} />
                          <View style={styles.flex}>
                            <Text style={styles.funcionTitulo}>
                              Solo el líder escribe
                            </Text>
                            <Text style={styles.meta}>
                              El chat queda para avisos del líder y el pastor
                              (ej: niños, avisos a los papás)
                            </Text>
                          </View>
                          <Switch
                            value={soloLider}
                            onValueChange={setSoloLider}
                            trackColor={{ false: BORDER, true: PRIMARY }}
                            thumbColor="#FFFFFF"
                            accessibilityLabel="Solo el líder escribe"
                          />
                        </View>
                        <View style={[styles.funcion, styles.funcionLinea]}>
                          <Octicons name="typography" size={16} color={TEXT} />
                          <View style={styles.flex}>
                            <Text style={styles.funcionTitulo}>
                              Letra grande
                            </Text>
                            <Text style={styles.meta}>
                              Los mensajes se ven más grandes (adultos mayores)
                            </Text>
                          </View>
                          <Switch
                            value={letraGrande}
                            onValueChange={setLetraGrande}
                            trackColor={{ false: BORDER, true: PRIMARY }}
                            thumbColor="#FFFFFF"
                            accessibilityLabel="Letra grande"
                          />
                        </View>
                      </View>

                      {falta && !listo && (
                        <Text style={styles.falta}>
                          {sinNombre
                            ? "Escribe el nombre de la sala para continuar."
                            : "Elige al líder que administrará la sala, o toca «Lo elijo después»."}
                        </Text>
                      )}
                      <Pressable
                        onPress={crear}
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
                    </>
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
  tipos: {
    gap: SPACING * 0.8,
  },
  tipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.2,
    borderRadius: 16,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  otra: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: DARK_BG,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: MUTED,
  },
  otraMas: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  separador: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginTop: SPACING,
  },
  seccion: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    marginTop: SPACING * 1.6,
    paddingTop: SPACING * 1.4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  seccionNumero: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  seccionNumeroTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: DARK_BG,
  },
  seccionTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 16,
    color: TEXT,
  },
  cambiarTipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fotoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.2,
    borderRadius: 16,
    backgroundColor: DARK_BG,
  },
  fotoCaja: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "dashed",
  },
  fotoImagen: {
    width: 64,
    height: 64,
  },
  fotoAcciones: {
    flexDirection: "row",
    gap: SPACING * 1.6,
    marginTop: 6,
  },
  fotoAccion: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
    textDecorationLine: "underline",
  },
  quitar: {
    color: MUTED,
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
    fontFamily: FUENTE.regular,
    fontSize: 12,
    lineHeight: 16,
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
    fontFamily: FUENTE.regular,
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
  falta: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: PRIMARY,
    textAlign: "center",
  },
  borrar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
  },
  borrarTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: PRIMARY,
  },
  ayuda: {
    fontFamily: FUENTE.regular,
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
    fontFamily: FUENTE.medium,
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
    fontFamily: FUENTE.semibold,
    fontSize: 16,
    color: DARK_BG,
  },
});

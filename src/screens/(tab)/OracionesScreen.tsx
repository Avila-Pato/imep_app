import { PASAJES, PREGUNTAS } from "@/assets/data/oracionesMocks";
import {
  BORDER,
  GRUPOS,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
  SURFACE,
  SERIF,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { USUARIO } from "@/assets/data/perfilMocks";
import { usePasaje } from "@/hooks/usePasaje";
import { guardarEstudio, publicar, useEstudios } from "@/store/estudios";
import { GrupoId } from "@/types/typesComunidad";
import { partirTitulo } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AccionesVersiculo, {
  SeleccionBiblia,
} from "./components/AccionesVersiculo";
import BibliaView from "./components/BibliaView";
import ModalGuardado from "./components/ModalGuardado";
import PasajeTexto from "./components/PasajeTexto";
import TabsSuperiores from "./components/TabsSuperiores";

type Paso = 1 | 2 | 3;
type Vista = "estudio" | "biblia";
type Modo = "estudio" | "oracion";

// Dentro de "Guiado": estudiar un pasaje o pedir oracion
const MODOS: { id: Modo; label: string }[] = [
  { id: "estudio", label: "Estudio guiado" },
  { id: "oracion", label: "Pedir oración" },
];

const VISTAS: { id: Vista; label: string }[] = [
  { id: "biblia", label: "Biblia" },
  { id: "estudio", label: "Mi estudio" },
];

// Encabezado: etiqueta pequeña + titulo serif con la ultima palabra en cursiva
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
  principal,
  flecha = true,
}: {
  texto: string;
  onPress: () => void;
  deshabilitado?: boolean;
  principal?: boolean; // relleno blanco (accion principal)
  flecha?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        styles.boton,
        principal && styles.botonPrincipal,
        deshabilitado && styles.botonDeshabilitado,
        pressed && styles.presionado,
      ]}
    >
      <Text
        style={[styles.botonTexto, principal && styles.botonTextoPrincipal]}
      >
        {texto}
        {flecha && " →"}
      </Text>
    </Pressable>
  );
}

// Id unico para cada estudio guardado
const nuevoId = () => `e${Date.now()}`;

// Etiqueta chica sobre cada bloque
const Seccion = ({ texto }: { texto: string }) => (
  <Text style={styles.seccionEtiqueta}>{texto}</Text>
);

export default function OracionesScreen() {
  const [vista, setVista] = useState<Vista>("biblia");
  const [paso, setPaso] = useState<Paso>(1);
  const [cita, setCita] = useState("");
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [estudioId, setEstudioId] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("estudio");
  const [peticion, setPeticion] = useState("");
  const [enviada, setEnviada] = useState(false);
  // Biblia: versiculos tocados y el que se adjunta a una peticion
  const [seleccion, setSeleccion] = useState<SeleccionBiblia | null>(null);
  const insets = useSafeAreaInsets();
  // a donde va la peticion: muro general (Iglesia) o la sala de su grupo
  const [destino, setDestino] = useState<GrupoId>("general");
  const scrollRef = useRef<ScrollView>(null);
  const { guardados, grupo } = useEstudios();
  // Aviso "Guardado correctamente" despues de guardar
  const [avisoGuardado, setAvisoGuardado] = useState(false);
  // Sala de la persona segun el grupo que eligio (varones, jovenes, dorcas...)
  const miSala = GRUPOS.find((g) => g.id === grupo && g.id !== "general");
  const opcionesDestino = [
    { sala: GRUPOS[0], titulo: "Muro general", sub: "Toda la iglesia" },
    ...(miSala
      ? [{ sala: miSala, titulo: miSala.label, sub: "Solo tu grupo" }]
      : []),
  ];
  const salaPeticion =
    opcionesDestino.find((o) => o.sala.id === destino)?.sala ?? GRUPOS[0];

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

  const nuevoEstudio = () => {
    setCita("");
    setRespuestas({});
    setEstudioId(null);
    irA(1);
  };

  // Guardar / compartir el estudio terminado
  const guardado = guardados.find((e) => e.id === estudioId);
  const alDia =
    !!guardado &&
    guardado.cita === cita.trim() &&
    JSON.stringify(guardado.respuestas) === JSON.stringify(respuestas);

  const terminar = () => {
    if (!estudioId) setEstudioId(nuevoId());
    irA(3);
  };

  const guardar = () => {
    if (!estudioId) return;
    guardarEstudio({
      id: estudioId,
      cita: cita.trim(),
      respuestas,
      fecha: new Date().toISOString(),
      compartido: false,
    });
    setAvisoGuardado(true);
  };

  // Pedir oracion: va a la sala de su grupo (o a Iglesia si no tiene) y la aprueba su lider
  const pedirOracion = () => {
    const texto = peticion.trim();
    if (!texto) return;
    const ahora = new Date();
    publicar({
      id: `o${ahora.getTime()}`,
      autor: USUARIO.nombre,
      grupo: salaPeticion.id,
      cita: "",
      texto,
      fecha: ahora.toISOString(),
      orando: 0,
      estado: "pendiente", // la aprueba el lider de la sala
    });
    setPeticion("");
    setEnviada(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Tabs */}
        <TabsSuperiores
          opciones={VISTAS}
          activo={vista}
          onCambiar={(v) => {
            setVista(v);
            setSeleccion(null);
            scrollRef.current?.scrollTo({ y: 0, animated: false });
          }}
        />

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Biblia completa */}
          {vista === "biblia" && (
            <BibliaView
              onNavegar={() =>
                scrollRef.current?.scrollTo({ y: 0, animated: false })
              }
              seleccion={seleccion}
              onSeleccion={setSeleccion}
            />
          )}

          {vista === "estudio" && (
            <View style={styles.modos}>
              {MODOS.map((m) => {
                const activo = m.id === modo;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setModo(m.id)}
                    style={[styles.modo, activo && styles.modoActivo]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activo }}
                  >
                    <Text
                      style={[
                        styles.modoTexto,
                        activo && styles.modoTextoActivo,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Pedir oracion: solo la peticion, sin pasaje ni pasos */}
          {/* Peticion enviada: espera la aprobacion del lider */}
          {vista === "estudio" && modo === "oracion" && enviada && (
            <View style={[styles.card, styles.enviada]}>
              <View style={styles.enviadaIcono}>
                <Octicons name="clock" size={20} color={DARK_BG} />
              </View>
              <Text style={styles.enviadaTitulo}>
                Enviada al <Text style={styles.tituloCursiva}>líder</Text>
              </Text>
              <Text style={styles.enviadaSub}>
                Tu petición aparecerá en el muro de {salaPeticion.label} cuando
                el líder de la sala la apruebe. Desde ahí estará visible por 24
                horas.
              </Text>
              <Pressable
                onPress={() => setEnviada(false)}
                hitSlop={8}
                style={styles.nuevo}
              >
                <Text style={styles.nuevoTexto}>Escribir otra petición →</Text>
              </Pressable>
            </View>
          )}

          {vista === "estudio" && modo === "oracion" && !enviada && (
            <>
              <Encabezado
                meta="MURO DE ORACIÓN"
                titulo="¿Por qué quieres que oremos?"
              />
              <View style={styles.card}>
                <TextInput
                  value={peticion}
                  onChangeText={setPeticion}
                  placeholder="Escribe tu petición…"
                  placeholderTextColor="#555555"
                  multiline
                  style={[styles.inputRespuesta, styles.inputPeticion]}
                />
              </View>

              {/* Enviar al muro general o a su grupo */}
              <View>
                <Seccion texto="ENVIAR A" />
                <View style={[styles.card, styles.cardLista]}>
                  {opcionesDestino.map((o, i) => {
                    const activo = o.sala.id === salaPeticion.id;
                    return (
                      <Pressable
                        key={o.sala.id}
                        onPress={() => setDestino(o.sala.id)}
                        style={[styles.destino, i > 0 && styles.conLinea]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: activo }}
                      >
                        <View style={styles.destinoIcono}>
                          <Octicons
                            name={o.sala.icono}
                            size={16}
                            color={TEXT}
                          />
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.destinoTitulo}>{o.titulo}</Text>
                          <Text style={styles.destinoSub}>{o.sub}</Text>
                        </View>
                        <View
                          style={[styles.radio, activo && styles.radioActivo]}
                        >
                          {activo && <View style={styles.radioPunto} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Boton
                principal
                texto="Enviar petición"
                flecha={false}
                onPress={pedirOracion}
                deshabilitado={!peticion.trim()}
              />
              <Text style={styles.aviso}>
                El líder de {salaPeticion.label} la revisará antes de publicarla
                en el muro.
              </Text>
            </>
          )}

          {vista === "estudio" && modo === "estudio" && (
            <>
              {/* Progreso: atras + paso actual + barra */}
              <View style={styles.progreso}>
                <View style={styles.progresoFila}>
                  {paso > 1 ? (
                    <Pressable
                      onPress={() => irA((paso - 1) as Paso)}
                      hitSlop={10}
                      style={styles.atras}
                      accessibilityLabel="Atrás"
                    >
                      <Octicons name="arrow-left" size={14} color={MUTED} />
                      <Text style={styles.atrasTexto}>Atrás</Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}
                  <Text style={styles.pasoTexto}>PASO {paso} DE 3</Text>
                </View>
                <View style={styles.barra}>
                  {[1, 2, 3].map((n) => (
                    <View
                      key={n}
                      style={[
                        styles.segmento,
                        n <= paso && styles.segmentoActivo,
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Paso 1: elegir pasaje */}
              {paso === 1 && (
                <>
                  <Encabezado
                    meta="MAPA DEL VERSÍCULO"
                    titulo="¿Qué pasaje quieres estudiar?"
                  />

                  <View>
                    <Seccion texto="PASAJES SUGERIDOS" />
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
                  </View>

                  <View>
                    <Seccion texto="O ESCRIBE UNO" />
                    <View style={styles.campo}>
                      <Octicons name="search" size={14} color={MUTED} />
                      <TextInput
                        value={cita}
                        onChangeText={setCita}
                        placeholder="Ej: Juan 3:16"
                        placeholderTextColor="#555555"
                        style={styles.inputCita}
                      />
                    </View>
                  </View>

                  {!!cita.trim() && (
                    <View>
                      <Seccion texto="PASAJE" />
                      <View style={styles.card}>
                        <PasajeTexto
                          cita={cita}
                          versos={versosPasaje}
                          cargando={api.cargando}
                        />
                      </View>
                    </View>
                  )}

                  <Boton
                    principal
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

                  <View>
                    <Seccion texto="PASAJE" />
                    <View style={styles.card}>
                      <PasajeTexto
                        cita={cita}
                        versos={versosPasaje}
                        cargando={api.cargando}
                      />
                    </View>
                  </View>

                  <View style={styles.preguntas}>
                    <Seccion texto="RESPONDE" />
                    {PREGUNTAS.map((q, i) => (
                      <View key={q.id} style={styles.card}>
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

                  <Boton
                    principal
                    texto="Crear mi estudio"
                    onPress={terminar}
                  />
                </>
              )}

              {/* Paso 3: estudio terminado */}
              {paso === 3 && (
                <>
                  <Encabezado meta="MI ESTUDIO DE" titulo={cita} />

                  <View>
                    <Seccion texto="PASAJE" />
                    <View style={styles.card}>
                      <PasajeTexto
                        cita={cita}
                        versos={versosPasaje}
                        cargando={api.cargando}
                      />
                    </View>
                  </View>

                  <View>
                    <Seccion texto="MIS RESPUESTAS" />
                    <View style={[styles.card, styles.cardLista]}>
                      {PREGUNTAS.map((q, i) => {
                        const r = respuestas[q.id]?.trim();
                        const esOracion = q.id === "oracion";
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
                                esOracion && styles.respuestaOracion,
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

                  {/* Guardar en el perfil */}
                  <Boton
                    principal
                    texto={
                      alDia ? "Guardado en tu perfil ✓" : "Guardar en mi perfil"
                    }
                    flecha={false}
                    onPress={guardar}
                    deshabilitado={alDia}
                  />

                  <Pressable
                    onPress={nuevoEstudio}
                    hitSlop={8}
                    style={styles.nuevo}
                  >
                    <Text style={styles.nuevoTexto}>Nuevo estudio →</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Acciones de los versiculos tocados (flota sobre el tabbar) */}
      {vista === "biblia" && seleccion && (
        <View style={[styles.barraBiblia, { bottom: insets.bottom + 74 }]}>
          <AccionesVersiculo
            seleccion={seleccion}
            onListo={() => setSeleccion(null)}
          />
        </View>
      )}

      <ModalGuardado
        visible={avisoGuardado}
        cita={cita.trim()}
        onCerrar={() => setAvisoGuardado(false)}
        onVerPerfil={() => {
          setAvisoGuardado(false);
          router.push("/perfil" as Href);
        }}
      />
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

  // Bloques
  seccionEtiqueta: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING,
  },
  card: {
    padding: SPACING * 1.6,
    gap: SPACING,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  cardLista: {
    paddingVertical: SPACING / 2,
    gap: 0,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  presionado: {
    opacity: 0.6,
  },

  // Progreso
  progreso: {
    gap: SPACING,
    paddingTop: SPACING,
  },
  progresoFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  atras: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  atrasTexto: {
    fontSize: 13,
    color: MUTED,
  },
  pasoTexto: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: MUTED,
  },
  barra: {
    flexDirection: "row",
    gap: 6,
  },
  segmento: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: BORDER,
  },
  segmentoActivo: {
    backgroundColor: TEXT,
  },

  // Encabezado
  cabecera: {
    gap: 6,
  },
  meta: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 28,
    lineHeight: 34,
    color: TEXT,
  },
  tituloCursiva: {
    fontStyle: "italic",
  },

  // Chips
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: SPACING * 1.2,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  chipActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  chipTexto: {
    fontSize: 13,
    color: MUTED,
  },
  chipTextoActivo: {
    color: DARK_BG,
    fontWeight: "600",
  },

  // Campos
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  inputCita: {
    flex: 1,
    paddingVertical: SPACING * 1.2,
    fontSize: 15,
    color: TEXT,
    outlineWidth: 0, // sin recuadro al enfocar (web)
  },

  // Preguntas
  preguntas: {
    gap: SPACING * 1.2,
  },
  preguntaCabecera: {
    flexDirection: "row",
    gap: SPACING * 1.2,
  },
  numero: {
    width: 22,
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
  inputRespuesta: {
    minHeight: 72,
    padding: SPACING * 1.2,
    borderRadius: 12,
    backgroundColor: DARK_BG,
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
    textAlignVertical: "top",
    outlineWidth: 0,
  },

  // Botones
  boton: {
    alignItems: "center",
    paddingVertical: SPACING * 1.4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  botonPrincipal: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  botonDeshabilitado: {
    opacity: 0.35,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
  botonTextoPrincipal: {
    color: DARK_BG,
  },
  acciones: {
    gap: SPACING,
  },
  // Selector Estudio guiado / Pedir oracion
  modos: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  modo: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 999,
  },
  modoActivo: {
    backgroundColor: TEXT,
  },
  modoTexto: {
    fontSize: 13,
    fontWeight: "500",
    color: MUTED,
  },
  modoTextoActivo: {
    color: DARK_BG,
    fontWeight: "600",
  },
  destino: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
  },
  destinoIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  destinoTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
  destinoSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: MUTED,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActivo: {
    borderColor: TEXT,
  },
  radioPunto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: TEXT,
  },
  barraBiblia: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  enviada: {
    alignItems: "center",
    paddingVertical: SPACING * 2.4,
  },
  enviadaIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  enviadaTitulo: {
    fontFamily: SERIF,
    fontSize: 24,
    color: TEXT,
  },
  enviadaSub: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    textAlign: "center",
  },
  inputPeticion: {
    minHeight: 140,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  aviso: {
    marginTop: -SPACING / 2,
    fontSize: 12,
    color: MUTED,
  },
  nuevo: {
    alignSelf: "center",
  },
  nuevoTexto: {
    fontSize: 13,
    color: MUTED,
  },

  // Mis estudios

  // Respuestas (paso 3)
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
    lineHeight: 23,
    color: TEXT,
  },
  respuestaOracion: {
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

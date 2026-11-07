import {
  BORDER,
  CATEGORIAS,
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { guardarAnuncio } from "@/store/estudios";
import { Anuncio, CategoriaId } from "@/types/typesAnuncios";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
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
import SelectorHora from "./SelectorHora";

const pad = (n: number) => String(n).padStart(2, "0");
const aKey = (f: Date) =>
  `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;

// Los proximos 60 dias para elegir la fecha
const DIAS = Array.from({ length: 60 }, (_, i) => {
  const f = new Date();
  f.setDate(f.getDate() + i);
  return {
    key: aKey(f),
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

const IDS_CATEGORIA = Object.keys(CATEGORIAS) as CategoriaId[];

type Props = {
  anuncio?: Anuncio | null; // con anuncio = editar; sin = nuevo
  autor: string;
  onCerrar: () => void;
};

// Escribir o editar un anuncio (pastor, secretaria, comunicaciones).
// Se monta cada vez que se abre, asi parte con los datos correctos
export default function ModalFormAnuncio({ anuncio, autor, onCerrar }: Props) {
  const [categoria, setCategoria] = useState<CategoriaId>(
    anuncio?.categoria ?? "evento",
  );
  const [titulo, setTitulo] = useState(anuncio?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(anuncio?.descripcion ?? "");
  const [fecha, setFecha] = useState(anuncio?.fecha ?? DIAS[0].key);
  const [conHora, setConHora] = useState(!!anuncio?.hora || !anuncio);
  const [hora, setHora] = useState(anuncio?.hora ?? "19:30");
  const [lugar, setLugar] = useState(anuncio?.lugar ?? "");
  const [detalle, setDetalle] = useState(anuncio?.detalle ?? "");
  const [imagen, setImagen] = useState(anuncio?.imagen);
  // los campos de abajo: al escribir se baja para que el teclado no los tape
  const scrollRef = useRef<ScrollView>(null);
  const mostrarAbajo = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  const [aspecto, setAspecto] = useState(anuncio?.imagenAspecto);

  // con texto, o solo la imagen (un afiche); la fecha y hora siempre van
  const conTexto = titulo.trim().length >= 3 && descripcion.trim().length >= 3;
  const listo = conTexto || !!imagen;

  const elegirImagen = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    setImagen(a.uri);
    setAspecto(a.width && a.height ? a.width / a.height : undefined);
  };
  // si se edita uno con fecha fuera de la lista, se agrega al inicio
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

  const publicar = () => {
    if (!listo) return;
    guardarAnuncio({
      id: anuncio?.id,
      categoria,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      fecha,
      hora: conHora ? hora : undefined,
      lugar: lugar.trim() || undefined,
      detalle: detalle.trim() || undefined,
      imagen,
      imagenAspecto: imagen ? aspecto : undefined,
      autor: anuncio?.autor ?? autor,
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
                <View style={styles.cabecera}>
                  <Text style={styles.titulo}>
                    {anuncio ? "Editar anuncio" : "Nuevo anuncio"}
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
                  ref={scrollRef}
                  contentContainerStyle={styles.contenido}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Imagen o afiche (opcional; tambien puede ir sola) */}
                  {imagen ? (
                    <View style={styles.imagenZona}>
                      <Image
                        source={{ uri: imagen }}
                        style={[
                          styles.imagen,
                          { aspectRatio: aspecto ?? 16 / 10 },
                        ]}
                        contentFit="cover"
                      />
                      <View style={styles.imagenBotones}>
                        <Pressable
                          onPress={elegirImagen}
                          style={({ pressed }) => [
                            styles.imagenBoton,
                            pressed && styles.presionado,
                          ]}
                        >
                          <Octicons name="image" size={13} color={TEXT} />
                          <Text style={styles.imagenBotonTexto}>Cambiar</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setImagen(undefined);
                            setAspecto(undefined);
                          }}
                          style={({ pressed }) => [
                            styles.imagenBoton,
                            pressed && styles.presionado,
                          ]}
                          accessibilityLabel="Quitar imagen"
                        >
                          <Octicons name="trash" size={13} color={TEXT} />
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      onPress={elegirImagen}
                      style={({ pressed }) => [
                        styles.agregarImagen,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Octicons name="image" size={20} color={MUTED} />
                      <Text style={styles.agregarImagenTitulo}>
                        Agregar imagen
                      </Text>
                      <Text style={styles.ayuda}>
                        Una foto o el afiche del evento. Puedes publicar solo la
                        imagen.
                      </Text>
                    </Pressable>
                  )}

                  {/* Para quien es */}
                  <Text style={styles.etiqueta}>CATEGORÍA</Text>
                  <View style={styles.chips}>
                    {IDS_CATEGORIA.map((id) => {
                      const activo = id === categoria;
                      return (
                        <Pressable
                          key={id}
                          onPress={() => setCategoria(id)}
                          style={[styles.chip, activo && styles.chipActivo]}
                          accessibilityState={{ selected: activo }}
                        >
                          <Octicons
                            name={CATEGORIAS[id].icon}
                            size={12}
                            color={activo ? DARK_BG : MUTED}
                          />
                          <Text
                            style={[
                              styles.chipTexto,
                              activo && styles.chipTextoActivo,
                            ]}
                          >
                            {CATEGORIAS[id].label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.etiqueta}>
                    TÍTULO{imagen ? " (OPCIONAL CON IMAGEN)" : ""}
                  </Text>
                  <TextInput
                    value={titulo}
                    onChangeText={setTitulo}
                    placeholder="Ej: Noche de alabanza"
                    placeholderTextColor="#555555"
                    autoCapitalize="sentences"
                    maxLength={60}
                    style={styles.input}
                  />

                  <Text style={styles.etiqueta}>
                    RESUMEN{imagen ? " (OPCIONAL CON IMAGEN)" : ""}
                  </Text>
                  <TextInput
                    value={descripcion}
                    onChangeText={setDescripcion}
                    placeholder="Una línea que se ve en la lista"
                    placeholderTextColor="#555555"
                    autoCapitalize="sentences"
                    maxLength={120}
                    style={styles.input}
                  />

                  {/* Cuando */}
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

                  <View style={styles.filaHora}>
                    <View style={styles.flex}>
                      <Text style={styles.etiqueta}>HORA</Text>
                      {!conHora && (
                        <Text style={styles.ayuda}>
                          Todo el día / sin hora fija
                        </Text>
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
                      accessibilityLabel="Tiene hora"
                    />
                  </View>

                  <Text style={styles.etiqueta}>LUGAR (OPCIONAL)</Text>
                  <TextInput
                    value={lugar}
                    onChangeText={setLugar}
                    onFocus={mostrarAbajo}
                    placeholder="Ej: Templo principal"
                    placeholderTextColor="#555555"
                    autoCapitalize="sentences"
                    style={styles.input}
                  />

                  <Text style={styles.etiqueta}>DETALLE (OPCIONAL)</Text>
                  <TextInput
                    value={detalle}
                    onChangeText={setDetalle}
                    onFocus={mostrarAbajo}
                    placeholder="Todo lo que los hermanos deben saber: qué llevar, a quién preguntar…"
                    placeholderTextColor="#555555"
                    autoCapitalize="sentences"
                    multiline
                    textAlignVertical="top"
                    style={[styles.input, styles.inputLargo]}
                  />
                </ScrollView>

                <Pressable
                  onPress={publicar}
                  disabled={!listo}
                  style={({ pressed }) => [
                    styles.boton,
                    !listo && styles.botonApagado,
                    pressed && styles.presionado,
                  ]}
                >
                  <Octicons name="megaphone" size={16} color={DARK_BG} />
                  <Text style={styles.botonTexto}>
                    {anuncio ? "Guardar cambios" : "Publicar anuncio"}
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
    marginTop: 2,
  },
  agregarImagen: {
    alignItems: "center",
    gap: 4,
    paddingVertical: SPACING * 2,
    paddingHorizontal: SPACING * 2,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
    backgroundColor: DARK_BG,
  },
  agregarImagenTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
    marginTop: 4,
  },
  imagenZona: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: DARK_BG,
  },
  imagen: {
    width: "100%",
    maxHeight: 320,
  },
  imagenBotones: {
    position: "absolute",
    top: SPACING,
    right: SPACING,
    flexDirection: "row",
    gap: 6,
  },
  imagenBoton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  imagenBotonTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT,
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
  // los dias llegan hasta los bordes de la hoja
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
  filaHora: {
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
  botonApagado: {
    opacity: 0.3,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
});

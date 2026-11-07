import { USUARIO } from "@/assets/data/perfilMocks";
import AvatarPersona, {
  CHIBIS,
  ESTILOS_AVATAR,
  urlChibi,
} from "@/components/AvatarPersona";
import {
  elegirTema,
  MODO_ACTUAL,
  ModoId,
  PALETAS,
  TEMA_ACTUAL,
  TemaId,
  TEMAS,
} from "@/constants/tema";
import { FUENTE, HOME_PADDING as PADDING, SPACING } from "@/constants/constans";
import {
  AvatarElegido,
  FUENTES_BIBLIA,
  FuenteBiblia,
  guardarPerfil,
  useEstudios,
} from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Href, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

const FUENTES = Object.keys(FUENTES_BIBLIA) as FuenteBiblia[];
const IDS_TEMA = Object.keys(TEMAS) as TemaId[];

// Editar perfil: elegir un chibi o una foto, el nombre y la letra de la
// Biblia. Los cambios se guardan al tocar "Guardar"
export default function EditarPerfilScreen() {
  const estado = useEstudios();
  const { top } = useSafeAreaInsets();
  const [avatar, setAvatar] = useState<AvatarElegido | undefined>(
    estado.avatar,
  );
  const [nombre, setNombre] = useState(estado.nombre ?? USUARIO.nombre);
  const [fuente, setFuente] = useState<FuenteBiblia>(
    estado.fuenteBiblia ?? "clasica",
  );
  const [portada, setPortada] = useState(estado.portada);
  const [tema, setTema] = useState<TemaId>(TEMA_ACTUAL);
  const [modo, setModo] = useState<ModoId>(MODO_ACTUAL);
  // colores de la vista previa (lo que se esta eligiendo, aun sin guardar)
  const color = TEMAS[tema].primario;
  const pal = PALETAS[modo];
  const cambiaColores = tema !== TEMA_ACTUAL || modo !== MODO_ACTUAL;
  // toda esta pantalla se pinta con lo elegido, antes de guardar
  const c = { ...pal, primario: color };
  const styles = useMemo(
    () => crearEstilos({ ...pal, primario: color }),
    [pal, color],
  );
  // al guardar con otro color: "aplicando..." y la app se reinicia
  const [aplicando, setAplicando] = useState(false);
  // estilo de dibujos que se esta mirando (empieza en el del avatar actual)
  const [estilo, setEstilo] = useState<string>(
    estado.avatar?.tipo === "chibi"
      ? (estado.avatar.estilo ?? "adventurer")
      : "adventurer",
  );
  const licencia = ESTILOS_AVATAR.find((e) => e.id === estilo)?.licencia;
  const listo = !!nombre.trim();

  const elegirPortada = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 7],
      quality: 0.8,
    });
    if (!r.canceled && r.assets[0]) setPortada(r.assets[0].uri);
  };

  const volver = () =>
    router.canGoBack() ? router.back() : router.replace("/perfil" as Href);

  const elegirFoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!r.canceled && r.assets[0]) {
      setAvatar({ tipo: "foto", uri: r.assets[0].uri });
    }
  };

  const guardar = () => {
    if (!listo) return;
    guardarPerfil({
      nombre: nombre.trim(),
      avatar,
      // vacio = sin imagen (asi se borra tambien lo guardado)
      portada: portada ?? "",
      fuenteBiblia: fuente,
    });
    if (!cambiaColores) {
      volver();
      return;
    }
    // otro color: se avisa que la app se recarga y se pide confirmar
    Alert.alert(
      "Se recargará la app",
      "Para pintar toda la app con tus nuevos colores, se cerrará y volverá a abrir en unos segundos. Te dejaremos en tu Perfil.",
      [
        { text: "Ahora no", style: "cancel" },
        { text: "Aplicar", onPress: aplicarColores },
      ],
    );
  };

  // muestra "aplicando..." y reinicia la app ya pintada
  const aplicarColores = () => {
    setAplicando(true);
    // si el reinicio no llega (o tarda mucho), no se queda esperando
    // (en Expo Go recargar tarda: vuelve a bajar la app desde el computador)
    const plazo = setTimeout(
      () => {
        setAplicando(false);
        Alert.alert(
          "Casi listo",
          "Los colores quedaron guardados. Si no cambiaron, cierra y abre la app.",
        );
        volver();
      },
      __DEV__ ? 20000 : 8000,
    );
    elegirTema(tema, modo, "/perfil").then((error) => {
      if (!error) return;
      clearTimeout(plazo);
      setAplicando(false);
      Alert.alert("No se aplicaron los colores", error);
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style={modo === "claro" ? "dark" : "light"} />
      <View style={styles.cabecera}>
        <Pressable onPress={volver} hitSlop={10} accessibilityLabel="Volver">
          <Octicons name="arrow-left" size={20} color={c.texto} />
        </Pressable>
        <Text style={styles.titulo}>Editar perfil</Text>
        <Pressable
          onPress={guardar}
          disabled={!listo}
          hitSlop={10}
          style={({ pressed }) => [
            styles.guardar,
            !listo && styles.apagado,
            pressed && styles.presionado,
          ]}
        >
          <Text style={styles.guardarTexto}>Guardar</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={top}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Vista previa: el perfil en miniatura con los colores elegidos */}
          <View
            style={[
              styles.previa,
              { backgroundColor: pal.fondo, borderColor: pal.borde },
            ]}
          >
            <View style={styles.previaPortada}>
              {portada ? (
                <Image
                  source={{ uri: portada }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : (
                <>
                  <View
                    style={[styles.previaCirculo, { backgroundColor: color }]}
                  />
                  <View
                    style={[
                      styles.previaCirculoChico,
                      { backgroundColor: pal.superficie },
                    ]}
                  />
                </>
              )}
            </View>
            <View
              style={[
                styles.previaAro,
                { borderColor: color, backgroundColor: pal.fondo },
              ]}
            >
              <AvatarPersona
                nombre={nombre || "?"}
                avatar={avatar}
                tamano={84}
              />
            </View>
            <Text style={[styles.previaNombre, { color: pal.texto }]}>
              {nombre || "Tu nombre"}
            </Text>
            {/* un boton y una pestaña de ejemplo */}
            <View style={styles.previaFila}>
              <View style={[styles.previaBoton, { backgroundColor: color }]}>
                <Octicons name="heart-fill" size={12} color="#FFFFFF" />
                <Text style={styles.previaBotonTexto}>Me gusta</Text>
              </View>
              <View
                style={[
                  styles.previaChip,
                  { backgroundColor: pal.superficie, borderColor: pal.borde },
                ]}
              >
                <Text style={[styles.previaChipTexto, { color: pal.tenue }]}>
                  Anuncios
                </Text>
              </View>
            </View>
          </View>

          {/* Portada: la imagen de fondo arriba del perfil */}
          <Text style={styles.etiqueta}>PORTADA</Text>
          <Pressable
            onPress={elegirPortada}
            style={({ pressed }) => [
              styles.portada,
              pressed && styles.presionado,
            ]}
          >
            {portada ? (
              <Image
                source={{ uri: portada }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <>
                <View style={styles.portadaCirculo} />
                <Octicons name="image" size={20} color={c.texto} />
                <Text style={styles.portadaTexto}>Elegir una imagen</Text>
              </>
            )}
          </Pressable>
          {portada && (
            <View style={styles.portadaBotones}>
              <Pressable onPress={elegirPortada} hitSlop={8}>
                <Text style={styles.enlace}>Cambiar</Text>
              </Pressable>
              <Pressable onPress={() => setPortada(undefined)} hitSlop={8}>
                <Text style={styles.enlace}>Quitar imagen</Text>
              </Pressable>
            </View>
          )}

          {/* Avatar */}
          <Text style={styles.etiqueta}>TU AVATAR</Text>
          {/* estilos de dibujo */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.estilos}
            contentContainerStyle={styles.estilosContenido}
          >
            {ESTILOS_AVATAR.map((e) => {
              const activo = e.id === estilo;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => setEstilo(e.id)}
                  style={[styles.estilo, activo && styles.estiloActivo]}
                >
                  <Text
                    style={[
                      styles.estiloTexto,
                      activo && styles.estiloTextoActivo,
                    ]}
                  >
                    {e.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.grilla}>
            {/* sin avatar: sus iniciales */}
            <Opcion
              styles={styles}
              activo={!avatar}
              onPress={() => setAvatar(undefined)}
            >
              <AvatarPersona nombre={nombre || "?"} tamano={58} />
            </Opcion>
            {/* foto de la galeria */}
            <Opcion
              styles={styles}
              activo={avatar?.tipo === "foto"}
              onPress={elegirFoto}
            >
              {avatar?.tipo === "foto" ? (
                <Image source={{ uri: avatar.uri }} style={styles.mini} />
              ) : (
                <View style={[styles.mini, styles.subir]}>
                  <Octicons name="image" size={18} color={c.texto} />
                  <Text style={styles.subirTexto}>Foto</Text>
                </View>
              )}
            </Opcion>
            {CHIBIS.map((semilla) => (
              <Opcion
                styles={styles}
                key={semilla}
                activo={
                  avatar?.tipo === "chibi" &&
                  avatar.semilla === semilla &&
                  (avatar.estilo ?? "adventurer") === estilo
                }
                onPress={() => setAvatar({ tipo: "chibi", semilla, estilo })}
              >
                <Image
                  source={{ uri: urlChibi(semilla, estilo) }}
                  style={styles.mini}
                  cachePolicy="disk"
                  transition={150}
                />
              </Opcion>
            ))}
          </View>
          <Text style={styles.ayuda}>
            Los dibujos necesitan internet la primera vez. Dibujos de DiceBear (
            {licencia}).
          </Text>

          {/* Nombre */}
          <Text style={styles.etiqueta}>NOMBRE</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Cómo quieres que te llamen"
            placeholderTextColor={c.tenue}
            style={styles.input}
            maxLength={40}
          />

          {/* Fondo: oscuro o claro */}
          <Text style={styles.etiqueta}>FONDO</Text>
          <View style={styles.modos}>
            {(Object.keys(PALETAS) as ModoId[]).map((id) => {
              const m = PALETAS[id];
              const activo = id === modo;
              return (
                <Pressable
                  key={id}
                  onPress={() => setModo(id)}
                  style={[
                    styles.modo,
                    { backgroundColor: m.fondo, borderColor: m.borde },
                    activo && { borderColor: color, borderWidth: 2 },
                  ]}
                  accessibilityState={{ selected: activo }}
                >
                  <View
                    style={[
                      styles.modoBarra,
                      { backgroundColor: m.superficie },
                    ]}
                  />
                  <View
                    style={[
                      styles.modoBarra,
                      styles.modoBarraCorta,
                      { backgroundColor: color },
                    ]}
                  />
                  <Text style={[styles.modoTexto, { color: m.texto }]}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Color de la app */}
          <Text style={styles.etiqueta}>COLOR DE LA APP</Text>
          <View style={styles.colores}>
            {IDS_TEMA.map((id) => {
              const t = TEMAS[id];
              const activo = id === tema;
              return (
                <Pressable
                  key={id}
                  onPress={() => setTema(id)}
                  style={styles.color}
                  accessibilityLabel={t.label}
                  accessibilityState={{ selected: activo }}
                >
                  <View
                    style={[
                      styles.colorAro,
                      activo && { borderColor: t.primario },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorPunto,
                        { backgroundColor: t.primario },
                      ]}
                    >
                      {activo && (
                        <Octicons name="check" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                  <Text
                    style={[styles.colorTexto, activo && styles.colorActivo]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {cambiaColores && (
            <Text style={styles.ayuda}>
              Al guardar, la app se recargará unos segundos para pintarse con
              los nuevos colores.
            </Text>
          )}

          {/* Letra de la Biblia */}
          <Text style={styles.etiqueta}>LETRA DE LA BIBLIA</Text>
          <View style={styles.fuentes}>
            {FUENTES.map((id) => {
              const f = FUENTES_BIBLIA[id];
              const activo = id === fuente;
              return (
                <Pressable
                  key={id}
                  onPress={() => setFuente(id)}
                  style={[styles.fuente, activo && styles.fuenteActiva]}
                  accessibilityState={{ selected: activo }}
                >
                  <Text style={[styles.muestra, { fontFamily: f.normal }]}>
                    En el principio era el Verbo
                  </Text>
                  <View style={styles.fuenteFila}>
                    <View style={styles.flex}>
                      <Text style={styles.fuenteNombre}>{f.label}</Text>
                      <Text style={styles.ayuda}>{f.sub}</Text>
                    </View>
                    <View style={[styles.radio, activo && styles.radioActivo]}>
                      {activo && <View style={styles.radioPunto} />}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Aplicando el nuevo color: espera un momento */}
      {aplicando && (
        <View style={styles.aplicando}>
          <ActivityIndicator size="large" color={color} />
          <Text style={styles.aplicandoTitulo}>Aplicando tus colores</Text>
          <Text style={styles.aplicandoTexto}>
            La app se está recargando. En unos segundos vuelve a abrirse en tu
            Perfil, ya con los nuevos colores.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Una opcion de avatar (circulo con borde rojo si esta elegida)
function Opcion({
  activo,
  onPress,
  children,
  styles,
}: {
  activo: boolean;
  onPress: () => void;
  children: React.ReactNode;
  styles: Estilos;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.opcion,
        activo && styles.opcionActiva,
        pressed && styles.presionado,
      ]}
      accessibilityState={{ selected: activo }}
    >
      {children}
      {activo && (
        <View style={styles.check}>
          <Octicons name="check" size={10} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
}

// estilos pintados con los colores que se estan eligiendo (se ven al instante)
type Colores = {
  fondo: string;
  superficie: string;
  borde: string;
  texto: string;
  tenue: string;
  radio: string;
  primario: string;
};
type Estilos = ReturnType<typeof crearEstilos>;

const crearEstilos = (c: Colores) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.fondo,
    },
    flex: {
      flex: 1,
    },
    presionado: {
      opacity: 0.7,
    },
    apagado: {
      opacity: 0.35,
    },
    cabecera: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING * 1.4,
      paddingHorizontal: PADDING,
      paddingVertical: SPACING,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borde,
    },
    titulo: {
      flex: 1,
      fontSize: 17,
      fontWeight: "700",
      color: c.texto,
    },
    guardar: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: c.texto,
    },
    guardarTexto: {
      fontSize: 13,
      fontWeight: "700",
      color: c.fondo,
    },
    contenido: {
      padding: PADDING,
      gap: SPACING,
      paddingBottom: SPACING * 6,
    },
    aplicando: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING,
      padding: SPACING * 4,
      backgroundColor: c.fondo,
    },
    aplicandoTitulo: {
      marginTop: SPACING,
      fontFamily: FUENTE.semibold,
      fontSize: 18,
      color: c.texto,
    },
    aplicandoTexto: {
      fontSize: 13,
      lineHeight: 19,
      color: c.tenue,
      textAlign: "center",
    },
    previa: {
      alignItems: "center",
      gap: SPACING,
      paddingBottom: SPACING * 1.6,
      marginBottom: SPACING,
      borderRadius: 22,
      borderWidth: 1,
      overflow: "hidden",
    },
    previaPortada: {
      alignSelf: "stretch",
      height: 80,
      overflow: "hidden",
    },
    previaCirculo: {
      position: "absolute",
      top: -110,
      right: -50,
      width: 210,
      height: 210,
      borderRadius: 105,
      opacity: 0.9,
    },
    previaCirculoChico: {
      position: "absolute",
      top: 24,
      left: -24,
      width: 70,
      height: 70,
      borderRadius: 35,
    },
    previaAro: {
      marginTop: -52,
      padding: 4,
      borderRadius: 999,
      borderWidth: 2,
    },
    previaNombre: {
      fontFamily: FUENTE.semibold,
      fontSize: 17,
    },
    previaFila: {
      flexDirection: "row",
      gap: SPACING,
    },
    previaBoton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      height: 34,
      borderRadius: 12,
    },
    previaBotonTexto: {
      fontSize: 12,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    previaChip: {
      justifyContent: "center",
      paddingHorizontal: 14,
      height: 34,
      borderRadius: 12,
      borderWidth: 1,
    },
    previaChipTexto: {
      fontSize: 12,
      fontWeight: "600",
    },
    modos: {
      flexDirection: "row",
      gap: SPACING,
    },
    modo: {
      flex: 1,
      gap: 6,
      padding: SPACING * 1.2,
      borderRadius: 16,
      borderWidth: 1,
    },
    modoBarra: {
      height: 10,
      borderRadius: 5,
    },
    modoBarraCorta: {
      width: "45%",
    },
    modoTexto: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: "600",
    },
    etiqueta: {
      fontFamily: FUENTE.semibold,
      fontSize: 11,
      letterSpacing: 1.4,
      color: c.tenue,
      marginTop: SPACING,
    },
    ayuda: {
      fontSize: 12,
      lineHeight: 17,
      color: c.tenue,
    },
    grilla: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING,
    },
    opcion: {
      padding: 3,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: "transparent",
    },
    opcionActiva: {
      borderColor: c.primario,
    },
    mini: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: c.superficie,
    },
    subir: {
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: c.borde,
    },
    subirTexto: {
      fontSize: 10,
      color: c.tenue,
    },
    check: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primario,
      borderWidth: 2,
      borderColor: c.fondo,
    },
    input: {
      minHeight: 48,
      paddingHorizontal: SPACING * 1.4,
      borderRadius: 14,
      backgroundColor: c.superficie,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borde,
      fontSize: 15,
      color: c.texto,
    },
    portada: {
      height: 120,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      overflow: "hidden",
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: c.borde,
    },
    portadaCirculo: {
      position: "absolute",
      top: -90,
      right: -60,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: c.primario,
      opacity: 0.5,
    },
    portadaTexto: {
      fontSize: 13,
      fontWeight: "600",
      color: c.texto,
    },
    portadaBotones: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    enlace: {
      fontSize: 13,
      color: c.tenue,
      textDecorationLine: "underline",
    },
    estilos: {
      marginHorizontal: -PADDING,
    },
    estilosContenido: {
      paddingHorizontal: PADDING,
      gap: 8,
    },
    estilo: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.borde,
    },
    estiloActivo: {
      backgroundColor: c.texto,
      borderColor: c.texto,
    },
    estiloTexto: {
      fontSize: 13,
      fontWeight: "600",
      color: c.tenue,
    },
    estiloTextoActivo: {
      color: c.fondo,
    },
    colores: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: SPACING * 1.2,
    },
    color: {
      width: "25%",
      alignItems: "center",
      gap: 4,
    },
    colorAro: {
      padding: 3,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: "transparent",
    },
    colorPunto: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },
    colorTexto: {
      fontSize: 11,
      color: c.tenue,
    },
    colorActivo: {
      color: c.texto,
      fontWeight: "600",
    },
    fuentes: {
      gap: SPACING,
    },
    fuente: {
      gap: SPACING,
      padding: SPACING * 1.4,
      borderRadius: 18,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    fuenteActiva: {
      borderColor: c.primario,
    },
    muestra: {
      fontSize: 20,
      lineHeight: 28,
      color: c.texto,
    },
    fuenteFila: {
      flexDirection: "row",
      alignItems: "center",
    },
    fuenteNombre: {
      fontSize: 14,
      fontWeight: "600",
      color: c.texto,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: c.radio,
    },
    radioActivo: {
      borderColor: c.texto,
    },
    radioPunto: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.texto,
    },
  });

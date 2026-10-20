import {
  BIBLIA_VERSION,
  BORDER,
  CAPITULOS_BIBLIA,
  FUENTE,
  GENEROS_BIBLIA,
  LIBROS_BIBLIA,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { Verso } from "@/services/biblia";
import { useEstudios } from "@/store/estudios";
import { claveVerso, SeleccionBiblia } from "./AccionesVersiculo";
import Octicons from "@expo/vector-icons/Octicons";
import { ReactNode, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Lado = "izquierda" | "derecha";

// Grupo de un libro (Ley, Historia, Evangelios...)
const generoDe = (libro: number) =>
  GENEROS_BIBLIA.find((g) => libro >= g.desde && libro <= g.hasta) ??
  GENEROS_BIBLIA[0];

// Transicion entre pantallas: entra deslizandose desde el lado y aparece
// "izquierda" = avanza (entra desde la derecha), "derecha" = retrocede
function Pagina({ lado, children }: { lado: Lado; children: ReactNode }) {
  const entrada = useSharedValue(0);

  useEffect(() => {
    entrada.set(
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
  }, [entrada]);

  const desde = lado === "izquierda" ? 40 : -40;
  const estilo = useAnimatedStyle(() => ({
    opacity: entrada.get(),
    transform: [{ translateX: desde * (1 - entrada.get()) }],
  }));

  return <Animated.View style={estilo}>{children}</Animated.View>;
}

// Versiculo tocable. Si esta resaltado, cada linea lleva su propia franja
// de color con esquinas redondas (se miden las lineas del texto)
type Linea = { x: number; y: number; width: number; height: number };

function VersoTexto({
  color,
  onPress,
  style,
  children,
}: {
  color?: string;
  onPress: () => void;
  style?: object;
  children: ReactNode;
}) {
  const [lineas, setLineas] = useState<Linea[]>([]);
  // en web no se miden las lineas: se pinta el bloque completo
  const sinLineas = !!color && lineas.length === 0;

  return (
    <Pressable
      onPress={onPress}
      style={[
        style,
        sinLineas && { backgroundColor: `${color}55`, borderRadius: 8 },
      ]}
    >
      {color &&
        lineas.map((l, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.franja,
              {
                left: l.x - 4,
                top: l.y + 2,
                width: l.width + 8,
                height: l.height - 4,
                backgroundColor: `${color}55`,
              },
            ]}
          />
        ))}
      <Text
        style={styles.parrafo}
        onTextLayout={(e) =>
          setLineas(
            e.nativeEvent.lines.map((l) => ({
              x: l.x,
              y: l.y,
              width: l.width,
              height: l.height,
            })),
          )
        }
      >
        {children}
      </Text>
    </Pressable>
  );
}

// Los primeros 39 libros son del Antiguo Testamento
const FIN_AT = 39;

// Sin acentos ni mayusculas, para buscar libros
const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Props = {
  onNavegar?: () => void; // para volver arriba al cambiar de pantalla
  seleccion: SeleccionBiblia | null; // versiculos tocados
  onSeleccion: (s: SeleccionBiblia | null) => void;
};

// Biblia completa: libros -> capitulos -> lectura del capitulo
export default function BibliaView({
  onNavegar,
  seleccion,
  onSeleccion,
}: Props) {
  const [libro, setLibro] = useState<number | null>(null); // 1..66
  const [capitulo, setCapitulo] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  // hacia donde se da vuelta la pagina
  const [lado, setLado] = useState<Lado>("izquierda");

  const ir = (
    l: number | null,
    c: number | null,
    hacia: Lado = "izquierda",
  ) => {
    setLibro(l);
    setCapitulo(c);
    setLado(hacia);
    onSeleccion(null);
    onNavegar?.();
  };

  // Volver un nivel: lectura -> capitulos -> indice (false = ya esta arriba)
  const volver = useCallback(() => {
    if (!libro) return false;
    if (capitulo) setCapitulo(null);
    else setLibro(null);
    setLado("derecha");
    onSeleccion(null);
    onNavegar?.();
    return true;
  }, [libro, capitulo, onNavegar, onSeleccion]);

  // Boton "atras" del telefono (Android), solo con esta pantalla a la vista
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", volver);
      return () => sub.remove();
    }, [volver]),
  );

  // Deslizar a la derecha = volver, como pasar la hoja hacia atras
  const deslizar = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX(30)
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (e.translationX > 80) volver();
    });
  const conGesto = (contenido: ReactNode) => (
    <GestureDetector gesture={deslizar}>
      <View collapsable={false}>{contenido}</View>
    </GestureDetector>
  );

  // ---------- Lectura de un capitulo ----------
  if (libro && capitulo) {
    return conGesto(
      // key: cada capitulo es una pagina nueva que se abre
      <Pagina key={`${libro}-${capitulo}`} lado={lado}>
        <Lectura
          libro={libro}
          capitulo={capitulo}
          onIr={(c) => ir(libro, c, c > capitulo ? "izquierda" : "derecha")}
          seleccionados={
            seleccion?.libro === libro && seleccion.capitulo === capitulo
              ? seleccion.versos.map((v) => v.numero)
              : []
          }
          onTocar={(v) => {
            // tocar un versiculo lo marca o desmarca
            const actuales =
              seleccion?.libro === libro && seleccion.capitulo === capitulo
                ? seleccion.versos
                : [];
            const versos = actuales.some((x) => x.numero === v.numero)
              ? actuales.filter((x) => x.numero !== v.numero)
              : [...actuales, v].sort((a, b) => a.numero - b.numero);
            onSeleccion(versos.length ? { libro, capitulo, versos } : null);
          }}
        />
      </Pagina>,
    );
  }

  // ---------- Capitulos de un libro ----------
  if (libro) {
    const total = CAPITULOS_BIBLIA[libro - 1];
    return conGesto(
      <Pagina key={`libro-${libro}`} lado={lado}>
        <View style={styles.contenedor}>
          <View style={styles.libro}>
            <View style={styles.hoja}>
              <Text style={styles.cornisa}>
                {generoDe(libro).nombre.toUpperCase()}
              </Text>
              <Text style={styles.libroTitulo}>{LIBROS_BIBLIA[libro - 1]}</Text>
              <View style={styles.adorno}>
                <View style={styles.adornoLinea} />
                <Text style={styles.adornoTexto}>
                  {total} {total === 1 ? "CAPÍTULO" : "CAPÍTULOS"}
                </Text>
                <View style={styles.adornoLinea} />
              </View>
              <View style={styles.grilla}>
                {Array.from({ length: total }, (_, i) => i + 1).map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => ir(libro, c)}
                    style={styles.capitulo}
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.capituloCirculo,
                          pressed && styles.capituloPresionado,
                        ]}
                      >
                        <Text style={styles.capituloTexto}>{c}</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Pagina>,
    );
  }

  // ---------- Lista de libros ----------
  const filtro = normalizar(busqueda.trim());
  const libros = LIBROS_BIBLIA.map((nombre, i) => ({
    nombre,
    id: i + 1,
  })).filter((l) => !filtro || normalizar(l.nombre).includes(filtro));
  const secciones = [
    {
      titulo: "ANTIGUO TESTAMENTO",
      lista: libros.filter((l) => l.id <= FIN_AT),
    },
    { titulo: "NUEVO TESTAMENTO", lista: libros.filter((l) => l.id > FIN_AT) },
  ].filter((s) => s.lista.length > 0);

  return (
    <View style={styles.contenedor}>
      {/* Solo el buscador: la pestaña ya dice "Biblia" */}
      <View style={styles.campo}>
        <Octicons name="search" size={14} color={MUTED} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar libro"
          placeholderTextColor="#555555"
          style={styles.input}
        />
      </View>

      {/* Indice */}
      <View>
        <View style={styles.libro}>
          <View style={styles.hoja}>
            {secciones.length === 0 && (
              <Text style={styles.vacio}>No hay libros con ese nombre</Text>
            )}

            {secciones.map((s) => (
              <View key={s.titulo} style={styles.indiceSeccion}>
                <View style={styles.adorno}>
                  <View style={styles.adornoLinea} />
                  <Text style={styles.adornoTexto}>{s.titulo}</Text>
                  <View style={styles.adornoLinea} />
                </View>
                {s.lista.map((l, i) => (
                  <View key={l.id}>
                    {/* subtitulo cuando empieza un grupo (Ley, Historia...) */}
                    {(i === 0 ||
                      generoDe(l.id) !== generoDe(s.lista[i - 1].id)) && (
                      <Text style={styles.grupo}>{generoDe(l.id).nombre}</Text>
                    )}
                    <Pressable
                      onPress={() => ir(l.id, null)}
                      style={({ pressed }) => [
                        styles.indiceFila,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Text style={styles.indiceLibro}>{l.nombre}</Text>
                      {/* puntos guia, como en el indice de un libro */}
                      <View style={styles.puntos}>
                        <View style={styles.puntosBorde} />
                      </View>
                      <Text style={styles.indiceCap}>
                        {CAPITULOS_BIBLIA[l.id - 1]}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// Texto completo de un capitulo, con anterior / siguiente
function Lectura({
  libro,
  capitulo,
  onIr,
  seleccionados,
  onTocar,
}: {
  libro: number;
  capitulo: number;
  onIr: (c: number) => void;
  seleccionados: number[];
  onTocar: (v: Verso) => void;
}) {
  const { resaltados } = useEstudios();
  // estilo de un versiculo: resaltado (color) y/o seleccionado (subrayado)
  // color del resaltado de un versiculo
  const colorDe = (n: number) =>
    resaltados[claveVerso(libro, capitulo, n)] as string | undefined;
  // subrayado punteado si esta seleccionado
  const marca = (n: number) => seleccionados.includes(n) && styles.seleccionado;
  const nombre = LIBROS_BIBLIA[libro - 1];
  const total = CAPITULOS_BIBLIA[libro - 1];
  const { versos, cargando, error } = usePasaje(`${nombre} ${capitulo}`);

  return (
    <View style={styles.contenedor}>
      <View style={styles.libro}>
        <View style={styles.hoja}>
          {/* Encabezado: solo el libro (el numero va grande junto al texto) */}
          <Text style={styles.cornisa}>{nombre.toUpperCase()}</Text>

          {cargando && (
            <View style={styles.estado}>
              <ActivityIndicator color={MUTED} />
            </View>
          )}
          {error && <Text style={styles.vacio}>{error}</Text>}

          {versos && versos.length > 0 && (
            <View style={styles.texto}>
              {/* Capitular: numero grande al lado del primer versiculo */}
              <View style={styles.inicio}>
                <Text style={styles.capitular}>{capitulo}</Text>
                <VersoTexto
                  color={colorDe(versos[0].numero)}
                  onPress={() => onTocar(versos[0])}
                  style={styles.flex}
                >
                  <Text style={marca(versos[0].numero)}>{versos[0].texto}</Text>
                </VersoTexto>
              </View>

              {/* Cada versiculo en su propio parrafo, con su numero pequeño */}
              {versos.slice(1).map((v) => (
                <VersoTexto
                  key={v.numero}
                  color={colorDe(v.numero)}
                  onPress={() => onTocar(v)}
                >
                  <Text style={styles.numeroVerso}>{v.numero} </Text>
                  <Text style={marca(v.numero)}>{v.texto}</Text>
                </VersoTexto>
              ))}
            </View>
          )}

          {/* Pie de pagina */}
          <Text style={styles.pie}>
            — {capitulo} de {total} · {BIBLIA_VERSION} —
          </Text>
        </View>
      </View>

      {/* Navegacion entre capitulos: ‹ Génesis 1 › */}
      <View style={styles.navegador}>
        <Pressable
          onPress={() => onIr(capitulo - 1)}
          disabled={capitulo <= 1}
          hitSlop={8}
          style={({ pressed }) => [
            styles.navBoton,
            capitulo <= 1 && styles.navApagado,
            pressed && styles.presionado,
          ]}
          accessibilityLabel="Capítulo anterior"
        >
          <Octicons name="chevron-left" size={18} color={TEXT} />
        </Pressable>
        <Text style={styles.navTexto}>
          {nombre} {capitulo}
        </Text>
        <Pressable
          onPress={() => onIr(capitulo + 1)}
          disabled={capitulo >= total}
          hitSlop={8}
          style={({ pressed }) => [
            styles.navBoton,
            capitulo >= total && styles.navApagado,
            pressed && styles.presionado,
          ]}
          accessibilityLabel="Capítulo siguiente"
        >
          <Octicons name="chevron-right" size={18} color={TEXT} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING * 2,
    paddingTop: SPACING,
  },
  presionado: {
    opacity: 0.6,
  },
  cabecera: {
    gap: 4,
  },
  meta: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  titulo: {
    fontFamily: FUENTE.biblia,
    fontSize: 30,
    color: TEXT,
  },
  cursiva: {
    fontFamily: FUENTE.bibliaCursiva,
  },
  sub: {
    fontSize: 13,
    color: MUTED,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING,
  },
  vacio: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    paddingVertical: SPACING * 2,
  },

  // Buscador
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 1.6,
    borderRadius: 999, // pildora
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT,
    outlineWidth: 0,
  },

  // Lista de libros
  card: {
    paddingHorizontal: SPACING * 1.6,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingVertical: SPACING * 1.3,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  filaTitulo: {
    flex: 1,
    fontFamily: FUENTE.biblia,
    fontSize: 17,
    color: TEXT,
  },
  filaCap: {
    fontSize: 12,
    color: MUTED,
  },

  // Capitulos
  grilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: SPACING,
  },
  capitulo: {
    width: "20%", // 5 por fila, parejos
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  capituloCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  capituloPresionado: {
    backgroundColor: "rgba(237, 230, 218, 0.12)",
  },
  capituloTexto: {
    fontFamily: FUENTE.biblia,
    fontSize: 20,
    color: TEXT,
  },
  libroTitulo: {
    fontFamily: FUENTE.biblia,
    fontSize: 36,
    color: TEXT,
    textAlign: "center",
    marginTop: SPACING / 2,
  },

  // Lectura
  estado: {
    paddingVertical: SPACING * 3,
  },
  // Indice
  indiceSeccion: {
    marginTop: SPACING * 1.4,
  },
  indiceFila: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingVertical: 9,
  },
  indiceLibro: {
    fontFamily: FUENTE.biblia,
    fontSize: 17,
    color: TEXT,
  },
  grupo: {
    fontFamily: FUENTE.bibliaCursiva,
    fontSize: 13,
    color: MUTED,
    marginTop: SPACING * 1.2,
    marginBottom: 2,
  },
  // iOS no dibuja un borde punteado de un solo lado: se dibuja el borde
  // completo y se recorta a 1px
  puntos: {
    flex: 1,
    height: 1,
    marginBottom: 6,
    overflow: "hidden",
  },
  puntosBorde: {
    height: 4,
    borderWidth: 1,
    borderStyle: "dotted",
    borderColor: BORDER,
  },
  indiceCap: {
    fontFamily: FUENTE.bibliaCursiva,
    fontSize: 14,
    color: MUTED,
  },

  // Libro
  libro: {},
  // sin tarjeta: el texto va directo sobre el fondo
  hoja: {},
  cornisa: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 3,
    color: MUTED,
    textAlign: "center",
  },
  adorno: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: SPACING * 1.6,
  },
  adornoLinea: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
  },
  adornoTexto: {
    fontSize: 10,
    letterSpacing: 2,
    color: MUTED,
  },
  pie: {
    fontFamily: FUENTE.bibliaCursiva,
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    marginTop: SPACING * 2,
  },
  flex: {
    flex: 1,
  },
  texto: {
    marginTop: SPACING * 1.6,
    gap: SPACING * 0.8, // aire entre versiculos
  },
  inicio: {
    flexDirection: "row",
    gap: SPACING,
  },
  capitular: {
    fontFamily: FUENTE.biblia,
    fontSize: 62,
    lineHeight: 62,
    color: TEXT,
    marginTop: -2,
  },
  parrafo: {
    fontFamily: FUENTE.biblia,
    fontSize: 20,
    lineHeight: 30,
    color: TEXT,
  },
  // franja de color detras de cada linea de un versiculo resaltado
  franja: {
    position: "absolute",
    borderRadius: 7,
  },
  seleccionado: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    textDecorationColor: MUTED,
  },
  numeroVerso: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    color: MUTED,
  },
  navegador: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 6,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  navBoton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  navApagado: {
    opacity: 0.25,
  },
  navTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
  },
});

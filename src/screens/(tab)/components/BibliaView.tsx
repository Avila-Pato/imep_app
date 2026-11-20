import { EsqueletoCapitulo } from "@/components/Esqueleto";
import {
  BORDER,
  CAPITULOS_BIBLIA,
  FUENTE,
  GENEROS_BIBLIA,
  LIBROS_BIBLIA,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  LECTURA,
  PLACEHOLDER,
  primarioAlfa,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { Verso } from "@/services/biblia";
import { useEstudios, useFuenteBiblia, useVersion } from "@/store/estudios";
import { claveVerso, SeleccionBiblia } from "./AccionesVersiculo";
import TamanoLetra from "./TamanoLetra";
import BotonLibro from "@/screens/biblia/BotonLibro";
import BotonLetra from "@/screens/biblia/BotonLetra";
import BotonVersion from "@/screens/biblia/BotonVersion";
import SelectorLibro from "@/screens/biblia/SelectorLibro";
import Octicons from "@expo/vector-icons/Octicons";
import {
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Href, router, useFocusEffect } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// "quieto" = aparece sin deslizarse (al entrar o volver de los versiculos)
type Lado = "izquierda" | "derecha" | "quieto";

// Grupo de un libro (Ley, Historia, Evangelios...)
const generoDe = (libro: number) =>
  GENEROS_BIBLIA.find((g) => libro >= g.desde && libro <= g.hasta) ??
  GENEROS_BIBLIA[0];

// Transicion entre pantallas: entra deslizandose desde el lado y aparece
// "izquierda" = avanza (entra desde la derecha), "derecha" = retrocede
function Pagina({ lado, children }: { lado: Lado; children: ReactNode }) {
  const entrada = useSharedValue(lado === "quieto" ? 1 : 0);

  useEffect(() => {
    entrada.set(
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
  }, [entrada]);

  const desde = lado === "izquierda" ? 40 : lado === "derecha" ? -40 : 0;
  const estilo = useAnimatedStyle(() => ({
    opacity: entrada.get(),
    transform: [{ translateX: desde * (1 - entrada.get()) }],
  }));

  return <Animated.View style={estilo}>{children}</Animated.View>;
}

// Versiculo tocable. Resaltado: el color cubre el versiculo completo (un
// solo bloque redondeado). Tocado: un fondo suave del color de la app
function VersoTexto({
  color,
  seleccionado,
  onUbicar,
  onPress,
  style,
  tamano,
  children,
}: {
  color?: string;
  seleccionado?: boolean;
  // el versiculo que se vino a leer: dice donde quedo (para bajar hasta el)
  onUbicar?: (yEnPantalla: number) => void;
  onPress: () => void;
  style?: object;
  tamano?: { fontSize: number; lineHeight: number }; // letra elegida
  children: ReactNode;
}) {
  // letra elegida en Editar perfil (clasica o moderna)
  const fuente = useFuenteBiblia();
  const caja = useRef<View>(null);
  const avisado = useRef(false);

  return (
    <Pressable
      ref={caja}
      onLayout={() => {
        if (!onUbicar || avisado.current) return;
        avisado.current = true;
        // se mide ya dibujado (en pantalla) para bajar justo hasta el
        requestAnimationFrame(() =>
          caja.current?.measureInWindow((_x, y) => onUbicar(y)),
        );
      }}
      onPress={onPress}
      style={[
        style,
        styles.versoCaja,
        seleccionado && styles.versoSeleccionado,
        color && { backgroundColor: `${color}55` },
        // con color y tocado: un borde para que se note la seleccion
        color && seleccionado && { borderColor: color },
      ]}
    >
      <Text style={[styles.parrafo, { fontFamily: fuente.normal }, tamano]}>
        {children}
      </Text>
    </Pressable>
  );
}

// Un versiculo por pantalla (deslizando, como videos)
// "Para ti" (al azar) o el capitulo elegido, de a un versiculo
const abrirVersiculos = (
  libro: number,
  capitulo: number,
  modo: "paraTi" | "capitulo",
) =>
  router.push(
    `/versiculos?libro=${libro}&capitulo=${capitulo}&modo=${modo}` as Href,
  );

// Los primeros 39 libros son del Antiguo Testamento
const FIN_AT = 39;

// Sin acentos ni mayusculas, para buscar libros
const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Props = {
  onNavegar?: () => void; // para volver arriba al cambiar de pantalla
  seleccion: SeleccionBiblia | null; // versiculos tocados
  onSeleccion: (s: SeleccionBiblia | null) => void;
  inicio?: { libro: number; capitulo: number }; // capitulo abierto al entrar
  verso?: number; // versiculo a mostrar al entrar (viene de "Para ti")
  onUbicarVerso?: (yEnPantalla: number) => void; // donde quedo ese versiculo
  // el capitulo que se esta leyendo (null = en el indice): la barra fija
  // "‹ Génesis 1 ›" de la pantalla lo muestra y cambia con ref.irCapitulo
  onCapitulo?: (c: { libro: number; capitulo: number } | null) => void;
  ref?: Ref<{ irCapitulo: (capitulo: number) => void }>;
};

// Biblia completa: libros -> capitulos -> lectura del capitulo
export default function BibliaView({
  onNavegar,
  seleccion,
  onSeleccion,
  inicio,
  verso,
  onUbicarVerso,
  onCapitulo,
  ref,
}: Props) {
  const [libro, setLibro] = useState<number | null>(inicio?.libro ?? null); // 1..66
  const [capitulo, setCapitulo] = useState<number | null>(
    inicio?.capitulo ?? null,
  );
  const [busqueda, setBusqueda] = useState("");
  // hacia donde se da vuelta la pagina
  // al abrir la pestaña (o volver de los versiculos) no se desliza
  const [lado, setLado] = useState<Lado>("quieto");

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

  // la barra fija de afuera: que capitulo se lee, y como cambiarlo
  useEffect(() => {
    onCapitulo?.(libro && capitulo ? { libro, capitulo } : null);
  }, [libro, capitulo, onCapitulo]);
  useImperativeHandle(ref, () => ({
    irCapitulo: (c: number) => {
      if (!libro || !capitulo) return;
      if (c < 1 || c > CAPITULOS_BIBLIA[libro - 1]) return;
      ir(libro, c, c > capitulo ? "izquierda" : "derecha");
    },
  }));

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
          // solo en el capitulo con el que se entro
          destacado={
            inicio && libro === inicio.libro && capitulo === inicio.capitulo
              ? verso
              : undefined
          }
          onUbicarVerso={onUbicarVerso}
          onIr={(c) => ir(libro, c, c > capitulo ? "izquierda" : "derecha")}
          onElegir={(l, c) => ir(l, c)}
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
                    onPress={() => {
                      // abre los versiculos uno a uno; al volver queda la lectura
                      ir(libro, c);
                      abrirVersiculos(libro, c, "capitulo");
                    }}
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
          placeholderTextColor={PLACEHOLDER}
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
  onElegir,
  seleccionados,
  onTocar,
  destacado,
  onUbicarVerso,
}: {
  destacado?: number; // versiculo que se vino a leer (marcado y a la vista)
  onUbicarVerso?: (yEnPantalla: number) => void;
  onElegir: (libro: number, capitulo: number) => void; // otro libro / capitulo
  libro: number;
  capitulo: number;
  onIr: (c: number) => void;
  seleccionados: number[];
  onTocar: (v: Verso) => void;
}) {
  const { resaltados, letra = 1 } = useEstudios("resaltados", "letra");
  const [eligiendo, setEligiendo] = useState(false); // selector de libro abierto
  const fuente = useFuenteBiblia();
  // tamaño elegido con A− / A+
  // interlineado amplio (1.7) para leer sin cansarse
  const tamano = { fontSize: 19 * letra, lineHeight: 32 * letra };
  // estilo de un versiculo: resaltado (color) y/o seleccionado (subrayado)
  // color del resaltado de un versiculo
  const colorDe = (n: number) =>
    resaltados[claveVerso(libro, capitulo, n)] as string | undefined;
  // seleccionado: fondo suave detras del versiculo
  const marca = (n: number) => seleccionados.includes(n);
  const nombre = LIBROS_BIBLIA[libro - 1];
  const total = CAPITULOS_BIBLIA[libro - 1];
  const { versos, cargando, error } = usePasaje(`${nombre} ${capitulo}`);
  const version = useVersion();

  return (
    <View style={styles.contenedor}>
      <View style={styles.libro}>
        <View style={styles.hoja}>
          {/* Encabezado: solo el libro (el numero va grande junto al texto) */}
          {/* Libro y capitulo: tocar para cambiar */}
          {/* libro y version, uno al lado del otro */}
          <View style={styles.titulos}>
            <BotonLibro
              titulo={`${nombre} ${capitulo}`}
              onPress={() => setEligiendo(true)}
            />
            <BotonVersion />
          </View>
          <SelectorLibro
            visible={eligiendo}
            libro={libro}
            capitulo={capitulo}
            onElegir={onElegir}
            onCerrar={() => setEligiendo(false)}
          />
          {/* Versiculo por versiculo: tarjeta destacada (leer de a uno) */}
          <Pressable
            onPress={() => abrirVersiculos(libro, capitulo, "paraTi")}
            style={({ pressed }) => [
              styles.modoVersos,
              pressed && styles.presionado,
            ]}
            accessibilityLabel="Para ti: versículos al azar"
          >
            <View style={styles.modoVersosIcono}>
              <Octicons name="versions" size={16} color={PRIMARY} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.modoVersosTitulo}>Para ti</Text>
              <Text style={styles.modoVersosSub}>
                Desliza y descubre versículos nuevos
              </Text>
            </View>
            <Octicons name="chevron-right" size={16} color={PRIMARY} />
          </Pressable>

          <View style={styles.herramientas}>
            <TamanoLetra />
            <BotonLetra />
          </View>

          {cargando && (
            <View style={styles.estado}>
              <EsqueletoCapitulo />
            </View>
          )}
          {error && <Text style={styles.vacio}>{error}</Text>}

          {versos && versos.length > 0 && (
            <View style={styles.texto}>
              {/* Capitular: numero grande al lado del primer versiculo */}
              <View style={styles.inicio}>
                <Text
                  style={[
                    styles.capitular,
                    { fontFamily: fuente.normal },
                    { fontSize: 62 * letra, lineHeight: 62 * letra },
                  ]}
                >
                  {capitulo}
                </Text>
                <VersoTexto
                  color={colorDe(versos[0].numero)}
                  seleccionado={
                    marca(versos[0].numero) || versos[0].numero === destacado
                  }
                  onPress={() => onTocar(versos[0])}
                  style={styles.flex}
                  tamano={tamano}
                >
                  <Text>{versos[0].texto}</Text>
                </VersoTexto>
              </View>

              {/* Cada versiculo en su propio parrafo, con su numero pequeño */}
              {versos.slice(1).map((v) => (
                <VersoTexto
                  key={v.numero}
                  color={colorDe(v.numero)}
                  seleccionado={marca(v.numero) || v.numero === destacado}
                  onUbicar={v.numero === destacado ? onUbicarVerso : undefined}
                  onPress={() => onTocar(v)}
                  tamano={tamano}
                >
                  <Text style={[styles.numeroVerso, { fontSize: 12 * letra }]}>
                    {v.numero}
                    {"  "}
                  </Text>
                  <Text>{v.texto}</Text>
                </VersoTexto>
              ))}
            </View>
          )}

          {/* Pie de pagina */}
          <Text style={styles.pie}>
            — {capitulo} de {total} · {version} —
          </Text>
        </View>
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
  // al tocar: del color del tema (se ve en claro y en oscuro)
  capituloPresionado: {
    backgroundColor: primarioAlfa(0.16),
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
    paddingVertical: SPACING * 2,
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
  // boton de versiculos y nivelador de letra, siempre en una fila
  titulos: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  herramientas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING,
    marginTop: SPACING,
  },
  modoVersos: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    marginTop: SPACING * 1.4,
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: SPACING * 1.1,
    borderRadius: 16,
    backgroundColor: primarioAlfa(0.08),
    borderWidth: 1,
    borderColor: primarioAlfa(0.35),
  },
  modoVersosIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primarioAlfa(0.15),
  },
  modoVersosTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
  },
  modoVersosSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
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
    gap: SPACING * 1.6, // aire entre versiculos: cada uno se lee aparte
  },
  inicio: {
    flexDirection: "row",
    gap: SPACING,
  },
  capitular: {
    fontFamily: FUENTE.biblia,
    fontSize: 62,
    lineHeight: 62,
    color: PRIMARY,
    marginTop: -2,
  },
  parrafo: {
    fontFamily: FUENTE.biblia,
    fontSize: 19,
    lineHeight: 32,
    letterSpacing: 0.15,
    color: LECTURA, // blanco calido (o tinta en modo claro)
  },
  versoCaja: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  // versiculo tocado: un fondo suave del color de la app
  versoSeleccionado: {
    backgroundColor: primarioAlfa(0.14),
  },
  // numero del versiculo en rojo suave: se ubica rapido sin estorbar
  numeroVerso: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: PRIMARY,
    opacity: 0.85,
  },
});

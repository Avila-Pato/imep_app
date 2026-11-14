import {
  BORDER,
  CAPITULOS_BIBLIA,
  COLORES_RESALTADO,
  DARK_BG,
  FUENTE,
  LIBROS_BIBLIA,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { claveVerso } from "@/screens/(tab)/components/AccionesVersiculo";
import ModalOracion from "@/screens/(tab)/components/ModalOracion";
import TamanoLetra from "@/screens/(tab)/components/TamanoLetra";
import { Verso } from "@/services/biblia";
import { masVersiculos, VersoFeed } from "@/services/feedVersiculos";
import {
  alternarMeGusta,
  darMeGusta,
  marcarAyuda,
  marcarVersoVisto,
  versosVistosAhora,
  useFuenteBiblia,
  guardarVersiculo,
  resaltar,
  useEstudios,
  useVersion,
} from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  GestureResponderEvent,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AyudaVersiculos from "./AyudaVersiculos";
import BotonLetra from "./BotonLetra";
import BotonLibro from "./BotonLibro";
import BotonVersion from "./BotonVersion";
import CorazonMeGusta, { DURACION_CORAZON } from "./CorazonMeGusta";
import SelectorLibro from "./SelectorLibro";
import { tamanoVerso } from "./tamanoVerso";

// En el telefono se desliza con el dedo; en web hay flechas para el mouse
const WEB = Platform.OS === "web";

// Lo que muestra cada pantalla (de un capitulo o del feed "Para ti")
type Item = {
  clave: string;
  libro: number;
  capitulo: number;
  cita: string;
  verso: Verso;
};
type Modo = "paraTi" | "capitulo";

const ERROR_FEED = "No se pudieron cargar versículos. Revisa tu conexión.";

// Feed "Para ti": versiculos al azar que no se repiten. Carga de a pocos y
// pide mas cuando faltan 3 por ver
function useFeed(activo: boolean, version: string) {
  const [items, setItems] = useState<VersoFeed[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pidiendo = useRef(false);

  // lo ya visto (leido en el momento, sin re-dibujar al marcar cada uno)
  const vistosCon = (actuales: VersoFeed[]) =>
    new Set([...(versosVistosAhora() ?? []), ...actuales.map((v) => v.clave)]);

  const pedirMas = () => {
    if (pidiendo.current) return;
    pidiendo.current = true;
    masVersiculos(5, vistosCon(items), version)
      .then((nuevos) => {
        setError(null);
        setItems((a) => [...a, ...nuevos]);
      })
      .catch(() => setError(ERROR_FEED))
      .finally(() => {
        pidiendo.current = false;
      });
  };

  // al abrir (o al cambiar de version) empieza un feed nuevo
  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    pidiendo.current = true;
    masVersiculos(5, new Set(versosVistosAhora() ?? []), version)
      .then((nuevos) => {
        if (!vivo) return;
        setError(null);
        setItems(nuevos);
        // el primero ya se esta viendo
        if (nuevos[0]) marcarVersoVisto(nuevos[0].clave);
      })
      .catch(() => {
        if (vivo) setError(ERROR_FEED);
      })
      .finally(() => {
        pidiendo.current = false;
      });
    return () => {
      vivo = false;
    };
  }, [activo, version]);

  return { items, error, pedirMas };
}

// Un versiculo por pantalla, como deslizar videos.
//  - "Para ti": versiculos al azar de toda la Biblia, sin repetir
//  - "Capítulo": el capitulo de a un versiculo (?libro=43&capitulo=3)
export default function VersiculosScreen() {
  const params = useLocalSearchParams<{
    libro: string;
    capitulo: string;
    modo?: string;
  }>();
  const libro = Number(params.libro) || 1;
  const capitulo = Number(params.capitulo) || 1;
  const nombre = LIBROS_BIBLIA[libro - 1];
  const total = CAPITULOS_BIBLIA[libro - 1];
  const [modo, setModo] = useState<Modo>(
    params.modo === "capitulo" ? "capitulo" : "paraTi",
  );
  const paraTi = modo === "paraTi";
  const { versos, cargando, error } = usePasaje(`${nombre} ${capitulo}`);
  const version = useVersion();
  const feed = useFeed(paraTi, version);

  const [alto, setAlto] = useState(0); // alto de cada pagina = alto de la lista
  const [actual, setActual] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [orando, setOrando] = useState<Item | null>(null);
  const [paleta, setPaleta] = useState(false);
  const listaRef = useRef<FlatList<Item>>(null);

  const irA = (i: number) =>
    listaRef.current?.scrollToIndex({ index: i, animated: true });

  // el aviso se va solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 1800);
    return () => clearTimeout(t);
  }, [aviso]);

  // Cambia de capitulo (o de libro) sin salir de esta pantalla
  const irCapitulo = (l: number, c: number) => {
    setActual(0);
    setModo("capitulo");
    router.setParams({ libro: String(l), capitulo: String(c) });
  };
  const siguienteCapitulo = () => irCapitulo(libro, capitulo + 1);
  const [eligiendo, setEligiendo] = useState(false);

  const lista: Item[] = paraTi
    ? feed.items.map((v) => ({
        clave: v.clave,
        libro: v.libro,
        capitulo: v.capitulo,
        cita: v.cita,
        verso: { numero: v.numero, texto: v.texto },
      }))
    : (versos ?? []).map((v) => ({
        clave: claveVerso(libro, capitulo, v.numero),
        libro,
        capitulo,
        cita: `${nombre} ${capitulo}:${v.numero}`,
        verso: v,
      }));
  const visto = lista[actual];

  // Lectura normal del capitulo que se esta viendo (vuelve a la pestaña Biblia).
  // En "Para ti": el capitulo del versiculo de ahora (y baja hasta el)
  const leerCapitulo = (item?: Item) =>
    router.navigate({
      pathname: "/oraciones",
      params: {
        libro: String(item?.libro ?? libro),
        capitulo: String(item?.capitulo ?? capitulo),
        ...(paraTi && item ? { verso: String(item.verso.numero) } : {}),
      },
    } as Href);
  const leerCompleto = () => leerCapitulo(visto);

  const progreso = lista.length ? (actual + 1) / lista.length : 0;
  const cargandoLista = paraTi ? !feed.items.length && !feed.error : cargando;
  const errorLista = paraTi ? (feed.items.length ? null : feed.error) : error;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Cabecera: (en capitulo) el libro, la version y leer el capitulo */}
      <View style={styles.cabecera}>
        <View style={styles.titulos}>
          {!paraTi && (
            <BotonLibro
              titulo={`${nombre} ${capitulo}`}
              onPress={() => setEligiendo(true)}
            />
          )}
          <BotonVersion />
          <Pressable
            onPress={leerCompleto}
            hitSlop={6}
            style={({ pressed }) => [styles.leer, pressed && styles.presionado]}
            accessibilityLabel="Leer el capítulo completo"
          >
            <Octicons name="list-unordered" size={13} color={TEXT} />
            <Text style={styles.leerTexto}>Capítulo completo</Text>
          </Pressable>
        </View>
      </View>
      {/* Progreso del capitulo: barra + "3/25" */}
      {!paraTi && (
        <View style={styles.progreso}>
          <View style={styles.barra}>
            <View
              style={[styles.barraLlena, { width: `${progreso * 100}%` }]}
            />
          </View>
          <Text style={styles.contador}>
            {lista.length
              ? `${Math.min(actual + 1, lista.length)}/${lista.length}`
              : ""}
          </Text>
        </View>
      )}

      {/* Tamaño y tipo de letra: su propia fila, a lo ancho */}
      <View style={styles.herramientas}>
        <TamanoLetra />
        <BotonLetra />
      </View>

      <View
        style={styles.flex}
        onLayout={(e) => setAlto(e.nativeEvent.layout.height)}
      >
        {cargandoLista && (
          <View style={styles.centro}>
            <ActivityIndicator color={MUTED} />
          </View>
        )}
        {errorLista && (
          <View style={styles.centro}>
            <Text style={styles.ayuda}>{errorLista}</Text>
          </View>
        )}

        {alto > 0 && lista.length > 0 && (
          <FlatList
            ref={listaRef}
            key={paraTi ? `paraTi-${version}` : `${libro}-${capitulo}`}
            // alto fijo: en web la lista solo se desliza si tiene limite
            style={styles.lista}
            data={lista}
            keyExtractor={(v) => v.clave}
            pagingEnabled
            snapToInterval={alto}
            snapToAlignment="start"
            disableIntervalMomentum // un versiculo por gesto, como en TikTok
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            getItemLayout={(_, i) => ({
              length: alto,
              offset: alto * i,
              index: i,
            })}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.y / alto);
              if (i !== actual) {
                setActual(i);
                setPaleta(false);
                if (paraTi) {
                  if (lista[i]) marcarVersoVisto(lista[i].clave);
                  // faltan pocos: trae mas (el feed no se acaba)
                  if (i >= lista.length - 3) feed.pedirMas();
                }
              }
            }}
            renderItem={({ item, index }) => (
              <Pagina
                verso={item.verso}
                libro={item.libro}
                capitulo={item.capitulo}
                cita={item.cita}
                alto={alto}
                primera={index === 0}
                ultima={!paraTi && index === lista.length - 1}
                hayMas={capitulo < total}
                paleta={paleta && index === actual}
                onPaleta={() => setPaleta((p) => !p)}
                onAviso={setAviso}
                onOrar={() => setOrando(item)}
                // Para ti: seguir leyendo ese capitulo desde este versiculo
                onLeerMas={paraTi ? () => leerCapitulo(item) : undefined}
                onSiguiente={siguienteCapitulo}
              />
            )}
          />
        )}

        {/* Flechas para pasar de versiculo (util con mouse en web) */}
        {WEB && lista.length > 1 && (
          <View style={styles.flechas}>
            <Pressable
              onPress={() => irA(actual - 1)}
              disabled={actual <= 0}
              hitSlop={6}
              style={[styles.flecha, actual <= 0 && styles.flechaApagada]}
              accessibilityLabel="Versículo anterior"
            >
              <Octicons name="chevron-up" size={18} color={TEXT} />
            </Pressable>
            <Pressable
              onPress={() => irA(actual + 1)}
              disabled={actual >= lista.length - 1}
              hitSlop={6}
              style={[
                styles.flecha,
                actual >= lista.length - 1 && styles.flechaApagada,
              ]}
              accessibilityLabel="Versículo siguiente"
            >
              <Octicons name="chevron-down" size={18} color={TEXT} />
            </Pressable>
          </View>
        )}

        {/* La primera vez: como funciona esta vista */}
        <AyudaVersiculos />

        {/* Aviso corto (guardado, resaltado...) */}
        {aviso && (
          <View style={styles.aviso} pointerEvents="none">
            <Text style={styles.avisoTexto}>{aviso}</Text>
          </View>
        )}
      </View>

      <SelectorLibro
        visible={eligiendo}
        libro={libro}
        capitulo={capitulo}
        onElegir={irCapitulo}
        onCerrar={() => setEligiendo(false)}
      />

      <ModalOracion
        visible={!!orando}
        cita={orando?.cita ?? ""}
        texto={orando?.verso.texto ?? ""}
        onCerrar={() => setOrando(null)}
        onGuardar={(oracion) => {
          if (!orando) return;
          guardarVersiculo({
            id: `${orando.clave}-oracion`,
            cita: orando.cita,
            texto: orando.verso.texto,
            oracion,
            fecha: new Date().toISOString(),
          });
          setOrando(null);
          setAviso("Oración guardada en tu perfil");
        }}
        onCompartir={(oracion) => {
          if (!orando) return;
          Share.share({
            message: `«${orando.verso.texto}»\n— ${orando.cita} (${version})\n\n🙏 ${oracion}`,
          }).catch(() => {});
          setOrando(null);
        }}
      />
    </SafeAreaView>
  );
}

type PaginaProps = {
  verso: Verso;
  libro: number;
  capitulo: number;
  cita: string; // "Juan 3:16" (o "Proverbios 3:5-6" en Para ti)
  alto: number;
  primera: boolean;
  ultima: boolean;
  hayMas: boolean; // hay un capitulo siguiente
  paleta: boolean;
  onPaleta: () => void;
  onAviso: (texto: string) => void;
  onOrar: () => void;
  onSiguiente: () => void;
  onLeerMas?: () => void; // "Leer Juan 3 completo"
};

// Una pantalla: el versiculo grande al centro y las acciones abajo
function Pagina({
  verso,
  libro,
  capitulo,
  cita,
  alto,
  primera,
  ultima,
  hayMas,
  paleta,
  onPaleta,
  onAviso,
  onOrar,
  onSiguiente,
  onLeerMas,
}: PaginaProps) {
  const {
    resaltados,
    versiculos,
    meGusta,
    ayudasVistas = [],
    letra = 1,
  } = useEstudios();
  const version = useVersion();
  const tamanoTexto = tamanoVerso(verso.texto, letra);
  const fuente = useFuenteBiblia(); // letra elegida en Editar perfil
  const clave = claveVerso(libro, capitulo, verso.numero);
  const color = resaltados[clave];
  const guardado = versiculos.some((v) => v.id === clave);
  const gusta = meGusta.includes(clave);
  // donde quedo el "me gusta": se avisa solo la primera vez
  const avisarMeGusta = () => {
    if (ayudasVistas.includes("aviso-megusta")) return;
    onAviso("❤ Guardado en tu Perfil › Mis me gusta");
    marcarAyuda("aviso-megusta");
  };
  // corazones que estan saltando (uno por cada doble toque)
  const [corazones, setCorazones] = useState<
    { id: number; x: number; y: number; giro: number }[]
  >([]);

  const guardar = () => {
    guardarVersiculo({
      id: clave,
      cita,
      texto: verso.texto,
      fecha: new Date().toISOString(),
    });
    onAviso("Guardado en tu perfil");
  };

  // Doble toque = "me gusta" con un corazon donde se toco (como TikTok)
  // (con Pressable y no con un gesto, para no frenar el deslizar en web)
  const ultimoToque = useRef(0);
  const tocar = (e: GestureResponderEvent) => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < 300) {
      // la primera vez avisa donde quedo
      if (!gusta) avisarMeGusta();
      darMeGusta(clave, { cita, texto: verso.texto });
      const id = ahora;
      const { locationX: x, locationY: y } = e.nativeEvent;
      const giro = Math.round(Math.random() * 40 - 20);
      setCorazones((c) => [...c, { id, x, y, giro }]);
      // se quita cuando termina de salir
      setTimeout(
        () => setCorazones((c) => c.filter((k) => k.id !== id)),
        DURACION_CORAZON + 50,
      );
      ultimoToque.current = 0; // un tercer toque empieza de nuevo
      return;
    }
    ultimoToque.current = ahora;
  };

  const acciones = [
    {
      id: "megusta",
      label: "Me gusta",
      icono: gusta ? ("heart-fill" as const) : ("heart" as const),
      color: gusta ? PRIMARY : TEXT,
      onPress: () => {
        if (!gusta) avisarMeGusta();
        alternarMeGusta(clave, { cita, texto: verso.texto });
      },
    },
    {
      id: "guardar",
      label: guardado ? "Guardado" : "Guardar",
      icono: guardado ? ("bookmark-filled" as const) : ("bookmark" as const),
      onPress: guardar,
    },
    {
      id: "resaltar",
      label: "Resaltar",
      icono: "paintbrush" as const,
      onPress: onPaleta,
    },
    { id: "orar", label: "Orar", icono: "flame" as const, onPress: onOrar },
    {
      id: "compartir",
      label: "Compartir",
      icono: "share-android" as const,
      onPress: () => {
        Share.share({
          message: `«${verso.texto}»\n— ${cita} (${version})`,
        }).catch(() => {});
      },
    },
  ];

  return (
    <View style={[styles.pagina, { height: alto }]}>
      <Pressable onPress={tocar} style={styles.cuerpo}>
        <Text
          style={[
            styles.verso,
            { fontFamily: fuente.normal },
            {
              fontSize: tamanoTexto,
              lineHeight: tamanoTexto * 1.3,
            },
            color && {
              textDecorationLine: "underline",
              textDecorationColor: color,
            },
          ]}
        >
          “{verso.texto}”
        </Text>
        <View style={styles.citaFila}>
          {color && (
            <View style={[styles.citaPunto, { backgroundColor: color }]} />
          )}
          <Text style={styles.cita}>{cita}</Text>
        </View>
        {/* seguir leyendo: abre el capitulo en este versiculo */}
        {onLeerMas && (
          <Pressable
            onPress={onLeerMas}
            hitSlop={8}
            style={({ pressed }) => [
              styles.leerMas,
              pressed && styles.presionado,
            ]}
            accessibilityLabel={`Leer ${LIBROS_BIBLIA[libro - 1]} ${capitulo} completo`}
          >
            <Text style={styles.leerMasTexto}>
              Leer {LIBROS_BIBLIA[libro - 1]} {capitulo} completo
            </Text>
            <Octicons name="chevron-right" size={13} color={TEXT} />
          </Pressable>
        )}
        {corazones.map((k) => (
          <CorazonMeGusta key={k.id} x={k.x} y={k.y} giro={k.giro} />
        ))}
      </Pressable>

      {/* Colores para resaltar */}
      {paleta && (
        <View style={styles.paleta}>
          {COLORES_RESALTADO.map((c) => (
            <Pressable
              key={c}
              onPress={() => {
                resaltar([clave], c === color ? null : c);
                onPaleta();
              }}
              style={[styles.color, { backgroundColor: c }]}
              accessibilityLabel={c === color ? "Quitar resaltado" : "Resaltar"}
            >
              {c === color && <Octicons name="x" size={14} color={DARK_BG} />}
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.acciones}>
        {acciones.map((a) => (
          <Pressable
            key={a.id}
            onPress={a.onPress}
            hitSlop={6}
            style={({ pressed }) => [
              styles.accion,
              pressed && styles.presionado,
            ]}
          >
            <Octicons
              name={a.icono}
              size={20}
              color={"color" in a && a.color ? a.color : TEXT}
            />
            <Text style={styles.accionTexto}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Pie: pista al inicio, siguiente capitulo al final */}
      <View style={styles.pie}>
        {ultima && hayMas ? (
          <Pressable
            onPress={onSiguiente}
            style={({ pressed }) => [
              styles.siguiente,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.siguienteTexto}>
              Siguiente capítulo · {LIBROS_BIBLIA[libro - 1]} {capitulo + 1}
            </Text>
            <Octicons name="arrow-right" size={14} color={DARK_BG} />
          </Pressable>
        ) : (
          <Text style={styles.ayuda}>
            {primera
              ? "Desliza hacia arriba · Doble toque para dar me gusta"
              : ultima
                ? "Fin del libro"
                : " "}
          </Text>
        )}
      </View>
    </View>
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
  presionado: {
    opacity: 0.6,
  },
  lista: {
    ...StyleSheet.absoluteFill,
  },
  flechas: {
    position: "absolute",
    right: SPACING,
    top: "40%",
    gap: SPACING,
  },
  flecha: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  flechaApagada: {
    opacity: 0.3,
  },
  centro: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },

  // Cabecera
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING * 2,
    paddingVertical: SPACING,
  },
  progreso: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 2,
  },
  contador: {
    fontFamily: FUENTE.medium,
    fontSize: 12,
    color: MUTED,
  },
  barra: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: BORDER,
    overflow: "hidden",
  },
  barraLlena: {
    height: 2,
    backgroundColor: TEXT,
  },

  // Pagina
  pagina: {
    // en web deja lugar a las flechas (parejo, para que el texto siga centrado)
    paddingHorizontal: WEB ? SPACING * 5.6 : SPACING * 2.6,
    paddingBottom: SPACING * 1.6,
  },
  cuerpo: {
    flex: 1,
    justifyContent: "center",
    gap: SPACING * 1.6,
  },
  verso: {
    fontFamily: FUENTE.biblia,
    color: TEXT,
    textAlign: "center",
  },
  leerMas: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  leerMasTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: TEXT,
  },
  citaFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  citaPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cita: {
    fontFamily: FUENTE.bibliaCursiva,
    fontSize: 17,
    color: MUTED,
  },

  // Acciones
  acciones: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: SPACING,
  },
  accion: {
    alignItems: "center",
    gap: 6,
    minWidth: 64,
  },
  accionTexto: {
    fontFamily: FUENTE.medium,
    fontSize: 11,
    color: MUTED,
  },
  paleta: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    padding: SPACING * 1.2,
    marginBottom: SPACING / 2,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  color: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Pie
  pie: {
    alignItems: "center",
    gap: SPACING,
    paddingTop: SPACING / 2,
  },
  ayuda: {
    fontFamily: FUENTE.medium,
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
  },
  siguiente: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: SPACING * 1.6,
    paddingVertical: SPACING,
    borderRadius: 999,
    backgroundColor: TEXT,
  },
  siguienteTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: DARK_BG,
  },
  titulos: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  herramientas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
  },
  leer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  leerTexto: {
    fontFamily: FUENTE.medium,
    fontSize: 12,
    color: TEXT,
  },

  aviso: {
    position: "absolute",
    top: SPACING * 2,
    alignSelf: "center",
    paddingHorizontal: SPACING * 1.6,
    paddingVertical: SPACING,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  avisoTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: TEXT,
  },
});

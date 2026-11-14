import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  MAPA_CLARO_ZOOM,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  mapaTeselaClara,
} from "@/constants/constans";
import {
  buscarDireccion,
  Lugar,
  lugarEn,
  ubicacionActual,
} from "@/services/direcciones";
import { aLatLng, aPixel, teselasVisibles } from "@/utils/mapa";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

// Sin ubicacion aun: se parte en Santiago, a la vista de la ciudad
const INICIO = { lat: -33.4489, lng: -70.6693 };
const ZOOM_MIN = 4;
const ZOOM_MAX = MAPA_CLARO_ZOOM; // mapa claro: hasta ver cada casa
const BORDE = 512; // teselas de mas alrededor: al arrastrar no se ve vacio

// Elegir la iglesia en el mapa: se arrastra el mapa hasta dejar el pin en el
// templo y se confirma. Debajo se ve la direccion de ese punto
export default function SelectorMapa({
  inicial,
  onElegir,
  onCerrar,
}: {
  inicial?: { lat: number; lng: number };
  onElegir: (l: Lugar) => void;
  onCerrar: () => void;
}) {
  const [centro, setCentro] = useState(inicial ?? INICIO);
  const [zoom, setZoom] = useState(inicial ? 17 : 11);
  const [tam, setTam] = useState({ ancho: 0, alto: 0 });
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [ubicando, setUbicando] = useState(false);
  // buscador del mapa (direcciones y lugares de referencia: plaza, colegio...)
  const [texto, setTexto] = useState("");
  const [encontrados, setEncontrados] = useState<Lugar[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [sinResultados, setSinResultados] = useState(false);
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);

  // busca cuando deja de escribir, primero cerca de lo que se ve en el mapa
  useEffect(() => {
    const q = texto.trim();
    if (q.length < 3) return;
    const ctrl = new AbortController();
    const espera = setTimeout(() => {
      setBuscando(true);
      buscarDireccion(q, ctrl.signal, centro)
        .then((r) => {
          setEncontrados(r);
          setSinResultados(!r.length);
        })
        .catch(() => {})
        .finally(() => !ctrl.signal.aborted && setBuscando(false));
    }, 700);
    return () => {
      clearTimeout(espera);
      ctrl.abort();
    };
    // el centro solo orienta la busqueda: no se repite al mover el mapa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const irA = (l: Lugar) => {
    Keyboard.dismiss();
    setCentro({ lat: l.lat, lng: l.lng });
    setZoom(17);
    setLugar(l);
    setEncontrados([]);
    setTexto("");
  };

  // la direccion del punto, cuando deja de mover el mapa
  useEffect(() => {
    const ctrl = new AbortController();
    const espera = setTimeout(() => {
      lugarEn(centro.lat, centro.lng, ctrl.signal)
        .then((l) => !ctrl.signal.aborted && setLugar(l))
        .catch(() => {});
    }, 900);
    return () => {
      clearTimeout(espera);
      ctrl.abort();
    };
  }, [centro]);

  // Computador: la rueda del mouse acerca y aleja (una vez por "clic" de
  // rueda, para que no salte varios niveles de golpe)
  const mapaRef = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const nodo = mapaRef.current as unknown as HTMLElement | null;
    if (!nodo?.addEventListener) return;
    let ultimo = 0;
    const rueda = (e: WheelEvent) => {
      e.preventDefault(); // que no se mueva la pagina
      const ahora = Date.now();
      if (ahora - ultimo < 250 || e.deltaY === 0) return;
      ultimo = ahora;
      setZoom((z) =>
        e.deltaY < 0 ? Math.min(ZOOM_MAX, z + 1) : Math.max(ZOOM_MIN, z - 1),
      );
    };
    nodo.addEventListener("wheel", rueda, { passive: false });
    return () => nodo.removeEventListener("wheel", rueda);
  }, [tam.ancho]);

  // arrastrar: el mapa se mueve con el dedo (o el mouse) y al soltar queda el nuevo centro
  const mover = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      dx.set(e.translationX);
      dy.set(e.translationY);
    })
    .onEnd((e) => {
      const p = aPixel(centro.lat, centro.lng, zoom);
      setLugar(null);
      setCentro(aLatLng(p.x - e.translationX, p.y - e.translationY, zoom));
      dx.set(0);
      dy.set(0);
    });
  // doble toque: acercar
  const acercarToque = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onEnd(() => setZoom((z) => Math.min(ZOOM_MAX, z + 1)));
  const gestos = Gesture.Simultaneous(mover, acercarToque);

  const capa = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.get() }, { translateY: dy.get() }],
  }));

  const { teselas, tamano } = teselasVisibles(
    centro.lat,
    centro.lng,
    zoom,
    tam.ancho + BORDE * 2,
    tam.alto + BORDE * 2,
  );

  const irAMiUbicacion = async () => {
    setUbicando(true);
    try {
      const l = await ubicacionActual();
      if (l) {
        setCentro({ lat: l.lat, lng: l.lng });
        setZoom(17);
        setLugar(l);
      }
    } finally {
      setUbicando(false);
    }
  };

  const confirmar = () => {
    onElegir(
      lugar && lugar.lat === centro.lat && lugar.lng === centro.lng
        ? lugar
        : {
            direccion:
              lugar?.direccion ??
              `Ubicación ${centro.lat.toFixed(5)}, ${centro.lng.toFixed(5)}`,
            lat: centro.lat,
            lng: centro.lng,
          },
    );
  };

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={onCerrar}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {/* dentro de un Modal los gestos necesitan su propia raiz (Android) */}
      <GestureHandlerRootView style={styles.contenedor}>
        <ConBordes>
          {(insets) => (
            <View style={styles.contenedor}>
              {/* Mapa */}
              <GestureDetector gesture={gestos}>
                <View
                  ref={mapaRef}
                  style={[styles.mapa, Platform.OS === "web" && CURSOR_MANO]}
                  onLayout={(e) =>
                    setTam({
                      ancho: e.nativeEvent.layout.width,
                      alto: e.nativeEvent.layout.height,
                    })
                  }
                >
                  {tam.ancho > 0 && (
                    // las teselas no reciben el mouse: asi el navegador no
                    // intenta "arrastrar la imagen" en vez de mover el mapa
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.capa,
                        {
                          left: -BORDE,
                          top: -BORDE,
                          width: tam.ancho + BORDE * 2,
                          height: tam.alto + BORDE * 2,
                        },
                        capa,
                      ]}
                    >
                      {teselas.map((t) => (
                        <Image
                          key={`${zoom}-${t.x}-${t.y}`}
                          source={mapaTeselaClara(zoom, t.x, t.y)}
                          style={{
                            position: "absolute",
                            left: t.left,
                            top: t.top,
                            width: tamano,
                            height: tamano,
                          }}
                          cachePolicy="disk"
                        />
                      ))}
                    </Animated.View>
                  )}

                  {/* Pin fijo al centro: se mueve el mapa, no el pin */}
                  <View pointerEvents="none" style={styles.pinZona}>
                    <View style={styles.pin}>
                      <Octicons name="home-fill" size={14} color="#FFFFFF" />
                    </View>
                    <View style={styles.pinPunta} />
                    <View style={styles.pinSombra} />
                  </View>
                </View>
              </GestureDetector>

              {/* Arriba: volver y buscador (como Google Maps) */}
              <View
                style={[styles.arriba, { top: insets.top + SPACING }]}
                pointerEvents="box-none"
              >
                <View style={styles.barraBusqueda}>
                  <Pressable
                    onPress={onCerrar}
                    hitSlop={8}
                    accessibilityLabel="Cerrar mapa"
                  >
                    <Octicons name="arrow-left" size={18} color={OSCURO} />
                  </Pressable>
                  <TextInput
                    value={texto}
                    onChangeText={(t) => {
                      setTexto(t);
                      setSinResultados(false);
                      if (t.trim().length < 3) setEncontrados([]);
                    }}
                    placeholder="Busca una calle o un lugar cercano"
                    placeholderTextColor="#80868B"
                    autoCorrect={false}
                    returnKeyType="search"
                    style={styles.buscarInput}
                  />
                  {buscando ? (
                    <ActivityIndicator size="small" color={OSCURO} />
                  ) : texto ? (
                    <Pressable
                      onPress={() => {
                        setTexto("");
                        setEncontrados([]);
                        setSinResultados(false);
                      }}
                      hitSlop={8}
                      accessibilityLabel="Borrar búsqueda"
                    >
                      <Octicons name="x" size={16} color={GRIS} />
                    </Pressable>
                  ) : (
                    <Octicons name="search" size={16} color={GRIS} />
                  )}
                </View>

                {(encontrados.length > 0 || sinResultados) && (
                  <View style={styles.lista}>
                    {encontrados.map((l, i) => {
                      const [nombre, ...resto] = l.direccion.split(", ");
                      return (
                        <Pressable
                          key={`${l.lat}-${l.lng}-${i}`}
                          onPress={() => irA(l)}
                          style={({ pressed }) => [
                            styles.item,
                            i > 0 && styles.itemLinea,
                            pressed && styles.itemPresionado,
                          ]}
                        >
                          <View style={styles.itemIcono}>
                            <Octicons name="location" size={14} color={GRIS} />
                          </View>
                          <View style={styles.flex}>
                            <Text style={styles.itemTitulo} numberOfLines={1}>
                              {nombre}
                            </Text>
                            <Text style={styles.itemSub} numberOfLines={1}>
                              {resto.slice(0, 3).join(", ")}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                    {sinResultados && (
                      <Text style={styles.vacio}>
                        No encontramos ese lugar. Prueba con otra referencia o
                        mueve el mapa.
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Derecha: acercar, alejar, mi ubicacion */}
              <View style={[styles.controles, { top: insets.top + 84 }]}>
                <Pressable
                  onPress={() => setZoom((z) => Math.min(ZOOM_MAX, z + 1))}
                  style={styles.redondo}
                  accessibilityLabel="Acercar"
                >
                  <Octicons name="plus" size={18} color={OSCURO} />
                </Pressable>
                <Pressable
                  onPress={() => setZoom((z) => Math.max(ZOOM_MIN, z - 1))}
                  style={styles.redondo}
                  accessibilityLabel="Alejar"
                >
                  <Octicons name="dash" size={18} color={OSCURO} />
                </Pressable>
                <Pressable
                  onPress={irAMiUbicacion}
                  style={styles.redondo}
                  accessibilityLabel="Ir a mi ubicación"
                >
                  {ubicando ? (
                    <ActivityIndicator size="small" color={OSCURO} />
                  ) : (
                    <Octicons name="location" size={18} color={OSCURO} />
                  )}
                </Pressable>
              </View>

              {/* Abajo: la direccion del punto y confirmar */}
              <View
                style={[
                  styles.panel,
                  { paddingBottom: insets.bottom + SPACING * 1.6 },
                ]}
              >
                <View style={styles.fila}>
                  <Octicons name="location" size={15} color={PRIMARY} />
                  <Text style={styles.direccion} numberOfLines={2}>
                    {lugar?.direccion ?? "Buscando la dirección…"}
                  </Text>
                </View>
                {zoom < 15 && (
                  <Text style={styles.nota}>
                    Acércate más para marcar el lugar exacto.
                  </Text>
                )}
                <Pressable
                  onPress={confirmar}
                  style={({ pressed }) => [
                    styles.boton,
                    pressed && styles.presionado,
                  ]}
                >
                  <Text style={styles.botonTexto}>Usar esta ubicación</Text>
                </Pressable>
                <Text style={styles.atribucion}>
                  Esri, HERE, Garmin, USGS · © OpenStreetMap
                </Text>
              </View>
            </View>
          )}
        </ConBordes>
      </GestureHandlerRootView>
    </Modal>
  );
}

const PIN = 34;
// sobre el mapa claro: blanco con iconos oscuros (como Google Maps)
const OSCURO = "#202124";
const GRIS = "#5F6368";

// Computador: mano para arrastrar y sin seleccionar texto al mover
// (RN solo tipa "auto" y "pointer"; react-native-web acepta cualquiera)
const CURSOR_MANO = {
  cursor: "grab",
  userSelect: "none",
} as unknown as ViewStyle;

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  mapa: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#F2EFE9", // color del mapa claro mientras carga
  },
  capa: {
    position: "absolute",
  },
  pinZona: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: PIN,
    marginLeft: -PIN / 2,
    // la punta del pin queda justo en el centro
    marginTop: -(PIN + 8),
    alignItems: "center",
  },
  pin: {
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  pinPunta: {
    width: 10,
    height: 10,
    marginTop: -6,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  pinSombra: {
    width: 10,
    height: 4,
    marginTop: 2,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  arriba: {
    position: "absolute",
    left: SPACING * 1.6,
    right: SPACING * 1.6,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  barraBusqueda: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    height: 48,
    paddingHorizontal: SPACING * 1.6,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  buscarInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: OSCURO,
    outlineWidth: 0,
  },
  lista: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingHorizontal: SPACING * 1.6,
    paddingVertical: 12,
  },
  itemLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E8EAED",
  },
  itemPresionado: {
    backgroundColor: "#F1F3F4",
  },
  itemIcono: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F3F4",
  },
  itemTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: OSCURO,
  },
  itemSub: {
    fontSize: 12,
    color: GRIS,
    marginTop: 1,
  },
  vacio: {
    padding: SPACING * 1.6,
    fontSize: 13,
    color: GRIS,
  },
  flex: {
    flex: 1,
  },
  controles: {
    position: "absolute",
    right: SPACING * 1.6,
    gap: SPACING,
  },
  redondo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  panel: {
    gap: SPACING,
    paddingTop: SPACING * 1.6,
    paddingHorizontal: SPACING * 2,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  direccion: {
    flex: 1,
    fontFamily: FUENTE.medium,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
  },
  nota: {
    fontSize: 12,
    color: MUTED,
  },
  boton: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  presionado: {
    opacity: 0.8,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
  atribucion: {
    fontSize: 9,
    color: MUTED,
    textAlign: "center",
  },
});

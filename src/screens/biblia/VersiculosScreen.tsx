import {
  BORDER,
  CAPITULOS_BIBLIA,
  COLORES_RESALTADO,
  DARK_BG,
  FUENTE,
  LIBROS_BIBLIA,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { claveVerso } from "@/screens/(tab)/components/AccionesVersiculo";
import ModalOracion from "@/screens/(tab)/components/ModalOracion";
import TamanoLetra from "@/screens/(tab)/components/TamanoLetra";
import { Verso } from "@/services/biblia";
import {
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
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BotonLibro from "./BotonLibro";
import BotonVersion from "./BotonVersion";
import SelectorLibro from "./SelectorLibro";

// En el telefono se desliza con el dedo; en web hay flechas para el mouse
const WEB = Platform.OS === "web";

// Letra mas chica para los versiculos largos (que quepan en la pantalla).
// "letra" es el tamaño elegido con A− / A+; el tope evita que un versiculo
// largo se salga de la pantalla
const tamano = (texto: string, letra: number) => {
  const n = texto.length;
  const base = n < 90 ? 34 : n < 170 ? 29 : n < 280 ? 25 : 21;
  const tope = n < 90 ? 56 : n < 170 ? 42 : n < 280 ? 33 : 27;
  return Math.min(base * letra, tope);
};

// Un versiculo por pantalla, como deslizar videos.
// Se abre desde la Biblia con ?libro=43&capitulo=3
export default function VersiculosScreen() {
  const params = useLocalSearchParams<{ libro: string; capitulo: string }>();
  const libro = Number(params.libro) || 1;
  const capitulo = Number(params.capitulo) || 1;
  const nombre = LIBROS_BIBLIA[libro - 1];
  const total = CAPITULOS_BIBLIA[libro - 1];
  const { versos, cargando, error } = usePasaje(`${nombre} ${capitulo}`);
  const version = useVersion();

  const [alto, setAlto] = useState(0); // alto de cada pagina = alto de la lista
  const [actual, setActual] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [orando, setOrando] = useState<Verso | null>(null);
  const [paleta, setPaleta] = useState(false);
  const listaRef = useRef<FlatList<Verso>>(null);

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
    router.setParams({ libro: String(l), capitulo: String(c) });
  };
  const siguienteCapitulo = () => irCapitulo(libro, capitulo + 1);
  const [eligiendo, setEligiendo] = useState(false);

  // Lectura normal del capitulo que se esta viendo (vuelve a la pestaña Biblia).
  // La usan la flecha de volver y "Leer capítulo completo"
  const leerCompleto = () =>
    router.navigate({
      pathname: "/oraciones",
      params: { libro: String(libro), capitulo: String(capitulo) },
    } as Href);

  const lista = versos ?? [];
  const progreso = lista.length ? (actual + 1) / lista.length : 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Cabecera: cita y progreso (se vuelve con "Leer capítulo completo") */}
      <View style={styles.cabecera}>
        {/* Tocar el titulo abre el selector de libro y capitulo */}
        <View style={styles.cabeceraCentro}>
          <Text style={styles.eyebrow}>SAGRADA ESCRITURA</Text>
          {/* libro y version, uno al lado del otro */}
          <View style={styles.titulos}>
            <BotonLibro
              titulo={`${nombre} ${capitulo}`}
              onPress={() => setEligiendo(true)}
            />
            <BotonVersion />
          </View>
        </View>
      </View>
      {/* Progreso: barra + "3/25" */}
      <View style={styles.progreso}>
        <View style={styles.barra}>
          <View style={[styles.barraLlena, { width: `${progreso * 100}%` }]} />
        </View>
        <Text style={styles.contador}>
          {lista.length
            ? `${Math.min(actual + 1, lista.length)}/${lista.length}`
            : ""}
        </Text>
      </View>

      {/* Leer el capitulo normal y tamaño de letra */}
      <View style={styles.herramientas}>
        <Pressable
          onPress={leerCompleto}
          hitSlop={6}
          style={({ pressed }) => [styles.leer, pressed && styles.presionado]}
        >
          <Octicons name="list-unordered" size={13} color={TEXT} />
          <Text style={styles.leerTexto}>Leer capítulo completo</Text>
        </Pressable>
        <TamanoLetra />
      </View>

      <View
        style={styles.flex}
        onLayout={(e) => setAlto(e.nativeEvent.layout.height)}
      >
        {cargando && (
          <View style={styles.centro}>
            <ActivityIndicator color={MUTED} />
          </View>
        )}
        {error && (
          <View style={styles.centro}>
            <Text style={styles.ayuda}>{error}</Text>
          </View>
        )}

        {alto > 0 && lista.length > 0 && (
          <FlatList
            ref={listaRef}
            key={`${libro}-${capitulo}`}
            // alto fijo: en web la lista solo se desliza si tiene limite
            style={styles.lista}
            data={lista}
            keyExtractor={(v) => String(v.numero)}
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
              }
            }}
            renderItem={({ item, index }) => (
              <Pagina
                verso={item}
                libro={libro}
                capitulo={capitulo}
                alto={alto}
                primera={index === 0}
                ultima={index === lista.length - 1}
                hayMas={capitulo < total}
                paleta={paleta && index === actual}
                onPaleta={() => setPaleta((p) => !p)}
                onAviso={setAviso}
                onOrar={() => setOrando(item)}
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
        cita={orando ? `${nombre} ${capitulo}:${orando.numero}` : ""}
        texto={orando?.texto ?? ""}
        onCerrar={() => setOrando(null)}
        onGuardar={(oracion) => {
          if (!orando) return;
          guardarVersiculo({
            id: `${claveVerso(libro, capitulo, orando.numero)}-oracion`,
            cita: `${nombre} ${capitulo}:${orando.numero}`,
            texto: orando.texto,
            oracion,
            fecha: new Date().toISOString(),
          });
          setOrando(null);
          setAviso("Oración guardada en tu perfil");
        }}
        onCompartir={(oracion) => {
          if (!orando) return;
          Share.share({
            message: `«${orando.texto}»\n— ${nombre} ${capitulo}:${orando.numero} (${version})\n\n🙏 ${oracion}`,
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
  alto: number;
  primera: boolean;
  ultima: boolean;
  hayMas: boolean; // hay un capitulo siguiente
  paleta: boolean;
  onPaleta: () => void;
  onAviso: (texto: string) => void;
  onOrar: () => void;
  onSiguiente: () => void;
};

// Una pantalla: el versiculo grande al centro y las acciones abajo
function Pagina({
  verso,
  libro,
  capitulo,
  alto,
  primera,
  ultima,
  hayMas,
  paleta,
  onPaleta,
  onAviso,
  onOrar,
  onSiguiente,
}: PaginaProps) {
  const { resaltados, versiculos, letra = 1 } = useEstudios();
  const version = useVersion();
  const tamanoVerso = tamano(verso.texto, letra);
  const clave = claveVerso(libro, capitulo, verso.numero);
  const cita = `${LIBROS_BIBLIA[libro - 1]} ${capitulo}:${verso.numero}`;
  const color = resaltados[clave];
  const guardado = versiculos.some((v) => v.id === clave);

  const guardar = () => {
    guardarVersiculo({
      id: clave,
      cita,
      texto: verso.texto,
      fecha: new Date().toISOString(),
    });
    onAviso("Guardado en tu perfil");
  };

  // Doble toque = guardar (como dar "me gusta")
  // (con Pressable y no con un gesto, para no frenar el deslizar en web)
  const ultimoToque = useRef(0);
  const tocar = () => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < 300 && !guardado) guardar();
    ultimoToque.current = ahora;
  };

  const acciones = [
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
    { id: "orar", label: "Orar", icono: "heart" as const, onPress: onOrar },
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
            {
              fontSize: tamanoVerso,
              lineHeight: tamanoVerso * 1.3,
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
            <Octicons name={a.icono} size={20} color={TEXT} />
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
              ? "Desliza hacia arriba · Doble toque para guardar"
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
  cabeceraCentro: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  eyebrow: {
    fontFamily: FUENTE.semibold,
    fontSize: 10,
    letterSpacing: 2.4,
    color: MUTED,
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
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  herramientas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

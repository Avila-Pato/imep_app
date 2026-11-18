import { useEspacioBarra } from "@/hooks/useEspacioBarra";
import {
  CAPITULOS_BIBLIA,
  DARK_BG,
  ELEVADO,
  LINEA,
  PRIMARY,
  primarioAlfa,
  FUENTE,
  HOME_PADDING as PADDING,
  LIBROS_BIBLIA,
  SPACING,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AccionesVersiculo, {
  SeleccionBiblia,
} from "./components/AccionesVersiculo";
import BibliaView from "./components/BibliaView";

// Alto aprox. de las opciones de arriba (libro, version, Para ti, letra)
const ALTO_OPCIONES = 240;

// Pestaña Biblia: abre directo en la lectura (el libro y sus versiculos).
// Sin titulo arriba: el tabbar ya dice "Biblia".
// El estudio guiado y lo guardado van en el Perfil.
export default function BibliaScreen() {
  // espacio para la barra flotante y los botones del telefono
  const espacio = useEspacioBarra();
  const insets = useSafeAreaInsets();
  // ?libro=1&capitulo=3: abre ese capitulo (al venir de "Leer capítulo completo").
  // Sin parametros empieza en Génesis 1
  const params = useLocalSearchParams<{
    libro?: string;
    capitulo?: string;
    verso?: string; // desde "Para ti": baja hasta ese versiculo
  }>();
  const inicio = {
    libro: Number(params.libro) || 1,
    capitulo: Number(params.capitulo) || 1,
  };
  const scrollRef = useRef<ScrollView>(null);
  // bajo bastante (capitulos largos, ej: Salmo 119): aparece "volver arriba"
  const [lejos, setLejos] = useState(false);
  // las opciones de arriba (libro, version, Para ti, letra) quedaron fuera
  // de la pantalla (ej: al entrar desde "Para ti" directo a un versiculo):
  // aparece una barrita fija para volver a ellas
  const [sinOpciones, setSinOpciones] = useState(false);
  const arriba = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  // versiculos tocados (muestran la barra de acciones)
  const [seleccion, setSeleccion] = useState<SeleccionBiblia | null>(null);
  // capitulo que se lee (para la barra fija) y como cambiarlo
  const [leyendo, setLeyendo] = useState<{
    libro: number;
    capitulo: number;
  } | null>(null);
  const biblia = useRef<{ irCapitulo: (c: number) => void }>(null);
  const total = leyendo ? CAPITULOS_BIBLIA[leyendo.libro - 1] : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          // con la barra fija: espacio para que no tape el ultimo versiculo
          { paddingBottom: espacio + (leyendo ? 84 : 0) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={100}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const ahora = y > 900;
          if (ahora !== lejos) setLejos(ahora);
          const escondidas = y > ALTO_OPCIONES;
          if (escondidas !== sinOpciones) setSinOpciones(escondidas);
        }}
      >
        <BibliaView
          // otro capitulo pedido = empieza de nuevo en ese capitulo
          key={`${params.libro}-${params.capitulo}-${params.verso}`}
          ref={biblia}
          onCapitulo={setLeyendo}
          inicio={inicio}
          verso={Number(params.verso) || undefined}
          // posicion del versiculo en pantalla -> en la lista (un poco
          // arriba, para que se vea lo anterior)
          onUbicarVerso={(y) =>
            scrollRef.current?.scrollTo({
              y: Math.max(0, y - 160),
              animated: true,
            })
          }
          onNavegar={() =>
            scrollRef.current?.scrollTo({ y: 0, animated: false })
          }
          seleccion={seleccion}
          onSeleccion={setSeleccion}
        />
      </ScrollView>

      {/* Opciones fuera de la pantalla: barrita fija arriba para volver */}
      {leyendo && sinOpciones && !seleccion && (
        <Pressable
          onPress={arriba}
          style={({ pressed }) => [
            styles.opciones,
            pressed && styles.presionado,
          ]}
          accessibilityLabel="Ver las opciones: libro, versión y letra"
        >
          <Octicons name="book" size={13} color={TEXT} />
          <Text style={styles.opcionesTexto} numberOfLines={1}>
            {LIBROS_BIBLIA[leyendo.libro - 1]} {leyendo.capitulo}
          </Text>
          <Text style={styles.opcionesMas}>· Opciones</Text>
          <Octicons name="chevron-up" size={14} color={TEXT} />
        </Pressable>
      )}

      {/* Volver arriba: solo cuando bajo bastante leyendo */}
      {leyendo && !seleccion && lejos && (
        <Pressable
          onPress={arriba}
          style={({ pressed }) => [
            styles.subir,
            { bottom: insets.bottom + 92 + 72 },
            pressed && styles.presionado,
          ]}
          accessibilityLabel="Volver al principio del capítulo"
        >
          <Octicons name="arrow-up" size={20} color="#FFFFFF" />
        </Pressable>
      )}

      {/* ‹ Génesis 1 ›: fija abajo mientras se lee (no hay que bajar hasta
          el final para cambiar de capitulo). Con versiculos tocados se
          esconde: ahi va la barra de acciones */}
      {leyendo && !seleccion && (
        <View
          style={[styles.navegador, { bottom: insets.bottom + 92 }]}
          pointerEvents="box-none"
        >
          <View style={styles.navCaja}>
            <Pressable
              onPress={() => biblia.current?.irCapitulo(leyendo.capitulo - 1)}
              disabled={leyendo.capitulo <= 1}
              hitSlop={8}
              style={({ pressed }) => [
                styles.navBoton,
                leyendo.capitulo <= 1 && styles.navApagado,
                pressed && styles.presionado,
              ]}
              accessibilityLabel="Capítulo anterior"
            >
              <Octicons name="chevron-left" size={22} color={PRIMARY} />
            </Pressable>
            {/* tocar el nombre: vuelve al principio del capitulo */}
            <Pressable
              onPress={arriba}
              style={styles.flex}
              accessibilityLabel="Volver al principio del capítulo"
            >
              <Text style={styles.navTexto} numberOfLines={1}>
                {LIBROS_BIBLIA[leyendo.libro - 1]} {leyendo.capitulo}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => biblia.current?.irCapitulo(leyendo.capitulo + 1)}
              disabled={leyendo.capitulo >= total}
              hitSlop={8}
              style={({ pressed }) => [
                styles.navBoton,
                leyendo.capitulo >= total && styles.navApagado,
                pressed && styles.presionado,
              ]}
              accessibilityLabel="Capítulo siguiente"
            >
              <Octicons name="chevron-right" size={22} color={PRIMARY} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Acciones de los versiculos tocados (flota sobre el tabbar) */}
      {seleccion && (
        <View style={[styles.barra, { bottom: insets.bottom + 74 }]}>
          <AccionesVersiculo
            seleccion={seleccion}
            onListo={() => setSeleccion(null)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  presionado: {
    opacity: 0.6,
  },
  // barrita fija arriba (cuando las opciones quedaron fuera de la pantalla)
  opciones: {
    position: "absolute",
    top: SPACING,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ELEVADO,
    borderWidth: 1,
    borderColor: LINEA,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  opcionesTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
  },
  opcionesMas: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: TEXT,
    opacity: 0.6,
  },
  // a lo ancho (con el mismo margen que la lectura)
  navegador: {
    position: "absolute",
    left: PADDING,
    right: PADDING,
  },
  navCaja: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING,
    padding: 6,
    borderRadius: 999,
    // mas claro que el fondo y con borde: se nota en el modo oscuro
    backgroundColor: ELEVADO,
    borderWidth: 1,
    borderColor: LINEA,
    // flota sobre el texto
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  navBoton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: primarioAlfa(0.18),
    alignItems: "center",
    justifyContent: "center",
  },
  navApagado: {
    opacity: 0.25,
  },
  flex: {
    flex: 1,
  },
  subir: {
    position: "absolute",
    right: PADDING,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  navTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 16,
    color: TEXT,
    textAlign: "center",
  },
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
  },
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});

import {
  DEVOCIONALES,
  IGLESIA,
  NOTIFICACIONES,
  PALABRA,
  REDES,
} from "@/assets/data/homeMocks";
import {
  BORDER,
  HOME_CARD_W as CARD_W,
  DARK_BG,
  DEVO_GAP,
  DEVO_W,
  MUTED,
  HOME_PADDING as PADDING,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { abrirComoLlegar } from "@/utils/mapa";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RedesSociales from "./components/RedesSociales";
import MapaIglesia from "./components/MapaIglesia";

const IGLESIA_ALTO = CARD_W * 0.95;

// Encabezado: "VIERNES" + "16 de octubre"
const hoy = new Date();
const DIA_SEMANA = hoy
  .toLocaleDateString("es-ES", { weekday: "long" })
  .toUpperCase();
const FECHA_HOY = hoy.toLocaleDateString("es-ES", {
  day: "numeric",
  month: "long",
});

export default function HomeScreen() {
  // slide es el devocional visible en el carrusel
  const [slide, setSlide] = useState(0);

  // en que vista se encuentra el usuario delizando
  // e.nativeEvent.contentOffset.x indica cuantos pixeles se han desplazado
  // actuliza el estado horizonatlmente
  // DEVO_W: ancho de cada elemento.
  // DEVO_GAP: espacio entre elementos.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setSlide(Math.round(e.nativeEvent.contentOffset.x / (DEVO_W + DEVO_GAP)));
  };

  return (
    //edges es para que no se muestre la barra de notificaciones
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Encabezado fijo: fecha + notificaciones */}
      <View style={styles.header}>
        <View>
          <Text style={styles.diaSemana}>{DIA_SEMANA}</Text>
          <Text style={styles.fechaGrande}>{FECHA_HOY}</Text>
        </View>

        <Pressable
          style={styles.campana}
          hitSlop={8}
          accessibilityLabel="Notificaciones"
        >
          <Octicons name="bell" size={18} color={TEXT} />
          {NOTIFICACIONES > 0 && <View style={styles.badge} />}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Palabra del dia */}
        <View style={styles.palabra}>
          <View style={styles.palabraLinea} />
          <View style={styles.flex}>
            <Text style={styles.palabraTexto}>“{PALABRA.texto}”</Text>
            <Text style={styles.palabraCita}>{PALABRA.cita}</Text>
          </View>
        </View>

        {/* Iglesia / proximo culto */}
        <View style={styles.iglesiaCard}>
          <MapaIglesia
            lat={IGLESIA.lat}
            lng={IGLESIA.lng}
            ancho={CARD_W}
            alto={IGLESIA_ALTO}
            onComoLlegar={() =>
              abrirComoLlegar(IGLESIA.lat, IGLESIA.lng, IGLESIA.direccion)
            }
          />

          <View style={styles.chip}>
            <Octicons name="location" size={12} color={TEXT} />
            <Text style={styles.chipTexto}>{IGLESIA.sede}</Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelIcono}>
              <Octicons name="bell" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.panelTitulo}>{IGLESIA.culto}</Text>
              <Text style={styles.panelSub}>{IGLESIA.detalle}</Text>
            </View>
            <View style={styles.panelEstado}>
              <Text style={styles.estado}>{IGLESIA.estado}</Text>
              <Text style={styles.estadoSub}>{IGLESIA.cuando}</Text>
            </View>
          </View>
        </View>

        {/* Devocionales */}
        <Text style={styles.seccion}>Devocionales de la semana</Text>
        <FlatList
          data={DEVOCIONALES}
          keyExtractor={(d) => d.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={DEVO_W + DEVO_GAP}
          decelerationRate="fast"
          onMomentumScrollEnd={onScroll}
          style={styles.carrusel}
          contentContainerStyle={styles.carruselContent}
          renderItem={({ item }) => (
            <View style={styles.devoCard}>
              <Text style={styles.etiqueta}>{item.dia.toUpperCase()}</Text>
              <Text style={styles.devoTitulo}>{item.titulo}</Text>
              <View style={styles.devoPie}>
                <View style={styles.enfoqueChip}>
                  <Text style={styles.enfoqueTexto}>{item.enfoque}</Text>
                </View>
                <Text style={styles.leer}>Leer →</Text>
              </View>
            </View>
          )}
        />

        <View style={styles.indicadores}>
          {DEVOCIONALES.map((d, i) => (
            <View
              key={d.id}
              style={[styles.indicador, i === slide && styles.indicadorActivo]}
            />
          ))}
        </View>

        {/* Redes sociales (al final) */}
        <View style={styles.redes}>
          <RedesSociales redes={REDES} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING / 2,
    paddingBottom: 120, // espacio para el tabbar flotante
    gap: SPACING * 1.6,
  },

  // Textos

  // Encabezado
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING,
    paddingTop: SPACING / 2,
    paddingBottom: SPACING / 2,
  },
  diaSemana: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: PRIMARY,
  },
  fechaGrande: {
    fontFamily: SERIF,
    fontSize: 26,
    color: TEXT,
    marginTop: 2,
  },
  campana: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  badge: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
    borderWidth: 1.5,
    borderColor: SURFACE,
  },

  // Palabra del dia
  palabra: {
    flexDirection: "row",
    gap: SPACING * 1.2,
  },
  palabraLinea: {
    width: 2,
    borderRadius: 1,
    backgroundColor: PRIMARY,
  },
  palabraTexto: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 16,
    lineHeight: 23,
    color: TEXT,
  },
  palabraCita: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
  },
  bloque: {
    gap: 6,
  },
  etiqueta: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: MUTED,
  },

  // Card iglesia
  iglesiaCard: {
    height: IGLESIA_ALTO,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#262626", // mientras cargan las teselas del mapa
  },
  chip: {
    position: "absolute",
    top: SPACING * 1.4,
    left: SPACING * 1.4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING * 1.2,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  chipTexto: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: TEXT,
  },
  panel: {
    position: "absolute",
    left: SPACING * 1.2,
    right: SPACING * 1.2,
    bottom: SPACING * 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.2,
    borderRadius: 18,
    backgroundColor: "rgba(22,22,22,0.92)",
  },
  panelIcono: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },
  flex: {
    flex: 1,
  },
  panelTitulo: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: TEXT,
  },
  panelSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  panelEstado: {
    alignItems: "flex-end",
  },
  estado: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: PRIMARY,
  },
  estadoSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },

  // Boton
  boton: {
    alignSelf: "flex-start",
    backgroundColor: PRIMARY,
    paddingHorizontal: SPACING * 2,
    paddingVertical: SPACING * 1.4,
    borderRadius: 14,
  },
  presionado: {
    opacity: 0.8,
  },
  botonTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },

  // Devocionales
  seccion: {
    fontFamily: SERIF,
    fontSize: 22,
    color: TEXT,
    marginTop: SPACING,
  },
  carrusel: {
    // el carrusel llega hasta los bordes de la pantalla
    marginHorizontal: -PADDING,
  },
  carruselContent: {
    paddingHorizontal: PADDING,
    gap: DEVO_GAP,
  },
  devoCard: {
    width: DEVO_W,
    padding: SPACING * 1.8,
    gap: SPACING,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  devoTitulo: {
    fontFamily: SERIF,
    fontSize: 20,
    lineHeight: 26,
    color: TEXT,
    minHeight: 52,
  },
  devoPie: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING / 2,
  },
  enfoqueChip: {
    paddingHorizontal: SPACING,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(229, 72, 77, 0.15)",
  },
  enfoqueTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: PRIMARY,
  },
  leer: {
    fontSize: 13,
    fontWeight: "500",
    color: TEXT,
  },
  redes: {
    marginTop: SPACING * 1.6,
    paddingTop: SPACING * 2.4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  indicadores: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  indicador: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BORDER,
  },
  indicadorActivo: {
    backgroundColor: PRIMARY,
  },
});

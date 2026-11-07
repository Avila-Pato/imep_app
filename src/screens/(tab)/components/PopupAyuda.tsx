import {
  DARK_BG,
  ES_CLARO,
  FUENTE,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
  primarioAlfa,
} from "@/constants/constans";
import { useEspacioBarra } from "@/hooks/useEspacioBarra";
import { marcarAyuda, useCargado, useEstudios } from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
import Octicons from "@expo/vector-icons/Octicons";
import { BlurView } from "expo-blur";
import { RefObject } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type PuntoAyuda = { icono: IconName; texto: string };

// Pop up de ayuda de una seccion: sale solo la primera vez (se recuerda por
// "id"). El fondo queda borroso; puede llevar una flechita que señala algo
export default function PopupAyuda({
  id,
  objetivo,
  arriba = 0,
  flecha,
  titulo,
  sub,
  icono,
  minis,
  puntos,
}: {
  id: string; // se marca como vista al tocar "Entendido"
  objetivo: RefObject<View | null>; // lo que se ve borroso detras (Android)
  arriba?: number; // desde donde empieza el borroso (lo de arriba queda nitido)
  flecha?: `${number}%`; // separacion de la flechita desde la derecha
  titulo: string; // va en el cartel: "Cronograma"
  sub: string; // debajo del cartel
  icono: IconName; // dibujo principal
  minis: [IconName, IconName, IconName]; // iconitos alrededor
  puntos: PuntoAyuda[];
}) {
  const cargado = useCargado();
  const { ayudasVistas = [] } = useEstudios();
  const espacio = useEspacioBarra(); // barra de pestañas de abajo
  if (!cargado || ayudasVistas.includes(id)) return null;

  return (
    <View style={[styles.capa, { top: arriba }]}>
      {/* fondo borroso (en Android difumina lo que esta en "objetivo") */}
      <BlurView
        intensity={45}
        tint={ES_CLARO ? "light" : "dark"}
        blurTarget={objetivo}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.oscurecer]} />

      <ScrollView
        contentContainerStyle={[
          styles.zona,
          !flecha && styles.zonaCentro,
          { paddingBottom: espacio },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {flecha && <View style={[styles.flecha, { marginRight: flecha }]} />}

        <View style={styles.tarjeta}>
          {/* cabecera de color con el dibujo */}
          <View style={styles.cabecera}>
            <View style={[styles.burbuja, styles.burbuja1]} />
            <View style={[styles.burbuja, styles.burbuja2]} />
            <Text style={styles.cabeceraEtiqueta}>NUEVO PARA TI</Text>
            <Text style={styles.cabeceraTitulo}>Así funciona</Text>

            {/* placa blanca, como un cartel */}
            <View style={styles.placa}>
              <Text style={styles.placaTitulo}>{titulo}</Text>
              <Text style={styles.placaSub}>{sub}</Text>
            </View>

            {/* dibujo: icono grande con iconitos alrededor */}
            <View style={styles.dibujo}>
              <View style={styles.dibujoCirculo}>
                <Octicons name={icono} size={30} color={PRIMARY} />
              </View>
              <View style={[styles.mini, styles.mini1]}>
                <Octicons name={minis[0]} size={14} color={PRIMARY} />
              </View>
              <View style={[styles.mini, styles.mini2]}>
                <Octicons name={minis[1]} size={14} color={PRIMARY} />
              </View>
              <View style={[styles.mini, styles.mini3]}>
                <Octicons name={minis[2]} size={14} color={PRIMARY} />
              </View>
            </View>
          </View>

          {/* explicacion */}
          <View style={styles.cuerpo}>
            {puntos.map((p) => (
              <View key={p.texto} style={styles.punto}>
                <View style={styles.puntoIcono}>
                  <Octicons name={p.icono} size={14} color={PRIMARY} />
                </View>
                <Text style={styles.puntoTexto}>{p.texto}</Text>
              </View>
            ))}

            <Pressable
              onPress={() => marcarAyuda(id)}
              style={({ pressed }) => [
                styles.boton,
                pressed && styles.presionado,
              ]}
            >
              <Text style={styles.botonTexto}>¡Entendido!</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  oscurecer: {
    backgroundColor: ES_CLARO ? "rgba(40, 32, 24, 0.22)" : "rgba(0,0,0,0.35)",
  },
  zona: {
    flexGrow: 1,
    paddingHorizontal: SPACING * 2.4,
    paddingTop: 2,
  },
  zonaCentro: {
    justifyContent: "center",
    paddingTop: SPACING * 2,
  },
  flecha: {
    alignSelf: "flex-end",
    width: 18,
    height: 18,
    marginBottom: -10,
    borderRadius: 3,
    backgroundColor: PRIMARY,
    transform: [{ rotate: "45deg" }],
  },
  tarjeta: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: SURFACE,
  },
  cabecera: {
    alignItems: "center",
    paddingTop: SPACING * 1.4,
    paddingHorizontal: SPACING * 2,
    backgroundColor: PRIMARY,
    overflow: "hidden",
  },
  burbuja: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  burbuja1: {
    width: 160,
    height: 160,
    top: -70,
    left: -50,
  },
  burbuja2: {
    width: 110,
    height: 110,
    bottom: 10,
    right: -40,
  },
  cabeceraEtiqueta: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.8)",
  },
  cabeceraTitulo: {
    marginTop: 4,
    fontFamily: FUENTE.semibold,
    fontSize: 18,
    color: "#FFFFFF",
  },
  placa: {
    marginTop: SPACING * 0.8,
    alignItems: "center",
    paddingHorizontal: SPACING * 2,
    paddingVertical: SPACING * 0.7,
    borderRadius: 14,
    backgroundColor: "#FFF8EE",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.12)",
    transform: [{ rotate: "-2deg" }],
  },
  placaTitulo: {
    fontFamily: SERIF,
    fontSize: 24,
    fontWeight: "700",
    color: "#1B1B1B",
  },
  placaSub: {
    fontSize: 12,
    color: "#5A554F",
  },
  dibujo: {
    width: 140,
    height: 80,
    marginTop: SPACING * 0.8,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  dibujoCirculo: {
    width: 68,
    height: 64,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  mini: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  mini1: {
    top: 8,
    left: 8,
  },
  mini2: {
    top: 0,
    right: 16,
  },
  mini3: {
    bottom: 14,
    right: 0,
  },
  cuerpo: {
    gap: SPACING * 0.9,
    padding: SPACING * 1.5,
  },
  punto: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  puntoIcono: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primarioAlfa(0.14),
  },
  puntoTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: TEXT,
  },
  boton: {
    height: 46,
    marginTop: SPACING / 2,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: DARK_BG,
  },
  presionado: {
    opacity: 0.7,
  },
});

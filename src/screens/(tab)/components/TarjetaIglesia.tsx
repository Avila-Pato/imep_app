import {
  DARK_BG,
  HOME_CARD_W as ANCHO,
  PRIMARY,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { useEsPastor, useIglesia } from "@/store/estudios";
import { proximoCulto } from "@/utils/cultos";
import { abrirComoLlegar } from "@/utils/mapa";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import MapaIglesia from "./MapaIglesia";
import ModalIglesia from "./ModalIglesia";
import SinIglesia from "./SinIglesia";

const ALTO = 190;

// Arriba de Anuncios: el mapa de la iglesia con el proximo culto encima.
// Sin iglesia: el pastor la ubica y el hermano se une con su invitacion
export default function TarjetaIglesia() {
  const iglesia = useIglesia();
  const esPastor = useEsPastor();
  const [editando, setEditando] = useState(false);
  const culto = proximoCulto();

  if (!iglesia) {
    return (
      <>
        <SinIglesia
          esPastor={esPastor}
          alto={ALTO + 40}
          onAgregar={() => setEditando(true)}
        />
        <ModalIglesia visible={editando} onCerrar={() => setEditando(false)} />
      </>
    );
  }

  const invitar = () =>
    Share.share({
      message: `Te invito a ${iglesia.sede}${
        culto
          ? ` · ${culto.horario.nombre ?? "Culto"} ${culto.cuando.toLowerCase()} a las ${culto.horario.hora}`
          : ""
      }\n${iglesia.direccion}`,
    });

  return (
    <View style={styles.tarjeta}>
      <MapaIglesia
        lat={iglesia.lat}
        lng={iglesia.lng}
        ancho={ANCHO}
        alto={ALTO}
        etiqueta={iglesia.sede}
        focoY={0.56}
      />

      {/* Arriba: cambiar ubicacion (pastor) y botones */}
      <View style={styles.arriba}>
        {esPastor ? (
          <Pressable
            onPress={() => setEditando(true)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.redondo,
              pressed && styles.presionado,
            ]}
            accessibilityLabel="Cambiar ubicación de la iglesia"
          >
            <Octicons name="pencil" size={13} color={TEXT} />
          </Pressable>
        ) : (
          <View />
        )}
        <View style={styles.botones}>
          <Pressable
            onPress={invitar}
            hitSlop={8}
            style={({ pressed }) => [
              styles.redondo,
              pressed && styles.presionado,
            ]}
            accessibilityLabel="Invitar a alguien"
          >
            <Octicons name="share-android" size={13} color={TEXT} />
          </Pressable>
          <Pressable
            onPress={() =>
              abrirComoLlegar(iglesia.lat, iglesia.lng, iglesia.direccion)
            }
            style={({ pressed }) => [
              styles.llegar,
              pressed && styles.presionado,
            ]}
          >
            <Octicons name="arrow-up-right" size={12} color="#FFFFFF" />
            <Text style={styles.llegarTexto}>Cómo llegar</Text>
          </Pressable>
        </View>
      </View>

      {/* Abajo: el proximo culto */}
      {culto && (
        <View style={styles.ficha}>
          <Text style={styles.fichaHora}>{culto.horario.hora}</Text>
          <View style={styles.flex}>
            <Text style={styles.fichaEtiqueta}>
              PRÓXIMO CULTO · {culto.cuando.toUpperCase()}
            </Text>
            <Text style={styles.fichaLugar} numberOfLines={1}>
              {culto.horario.nombre ?? iglesia.lugar}
            </Text>
          </View>
        </View>
      )}

      <ModalIglesia visible={editando} onCerrar={() => setEditando(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    height: ALTO,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#262626", // mientras cargan las teselas del mapa
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  arriba: {
    position: "absolute",
    top: SPACING,
    left: SPACING,
    right: SPACING,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  botones: {
    flexDirection: "row",
    gap: 6,
  },
  redondo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  llegar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: PRIMARY,
  },
  llegarTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ficha: {
    position: "absolute",
    left: SPACING,
    right: SPACING,
    bottom: SPACING,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingHorizontal: SPACING * 1.2,
    paddingVertical: SPACING * 0.8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  fichaHora: {
    fontSize: 22,
    fontWeight: "700",
    color: DARK_BG,
  },
  fichaEtiqueta: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: PRIMARY,
  },
  fichaLugar: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK_BG,
    marginTop: 1,
  },
});

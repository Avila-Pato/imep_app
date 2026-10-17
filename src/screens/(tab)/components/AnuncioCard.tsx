import {
  BORDER,
  CATEGORIAS,
  HOME_CARD_W as CARD_W,
  MESES_CORTOS,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { Anuncio } from "@/types/typesAnuncios";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

// "2026-10-25" -> { dia: "25", mes: "OCT" }
const partesFecha = (fecha: string) => {
  const [, m, d] = fecha.split("-").map(Number);
  return { dia: String(d), mes: MESES_CORTOS[m - 1] };
};

const detalle = (a: Anuncio) =>
  [a.hora && `${a.hora} hrs`, a.lugar].filter(Boolean).join(" · ");

// Tarjeta de anuncio con su propio banner (imagen) arriba y la info abajo.
// "grande" se usa para el anuncio destacado.
export default function AnuncioCard({
  anuncio,
  grande = false,
}: {
  anuncio: Anuncio;
  grande?: boolean;
}) {
  const cat = CATEGORIAS[anuncio.categoria];
  const { dia, mes } = partesFecha(anuncio.fecha);
  const sub = detalle(anuncio);

  return (
    <View style={[styles.card, anuncio.urgente && styles.cardUrgente]}>
      {/* Banner */}
      <View
        style={[
          styles.banner,
          { height: grande ? CARD_W * 0.6 : CARD_W * 0.38 },
        ]}
      >
        {anuncio.imagen ? (
          <Image
            source={anuncio.imagen}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <Octicons name={cat.icon} size={grande ? 40 : 28} color={MUTED} />
        )}

        <View style={styles.chip}>
          <Octicons
            name={grande ? "star-fill" : cat.icon}
            size={11}
            color={TEXT}
          />
          <Text style={styles.chipTexto}>
            {grande ? "DESTACADO" : cat.label.toUpperCase()}
          </Text>
        </View>

        {anuncio.urgente && (
          <View style={[styles.chip, styles.chipUrgente]}>
            <Text style={[styles.chipTexto, styles.urgenteTexto]}>URGENTE</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={[styles.fecha, grande && styles.fechaDestacada]}>
          <Text style={[styles.fechaDia, grande && styles.fechaTextoDestacada]}>
            {dia}
          </Text>
          <Text style={[styles.fechaMes, grande && styles.fechaTextoDestacada]}>
            {mes}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={[styles.titulo, grande && styles.tituloGrande]}>
            {anuncio.titulo}
          </Text>
          <Text style={styles.descripcion} numberOfLines={2}>
            {anuncio.descripcion}
          </Text>
          {!!sub && <Text style={styles.sub}>{sub}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  cardUrgente: {
    borderColor: PRIMARY,
  },

  // Banner
  banner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#262626", // placeholder hasta poner imagen
  },
  chip: {
    position: "absolute",
    top: SPACING * 1.2,
    left: SPACING * 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  chipUrgente: {
    left: undefined,
    right: SPACING * 1.2,
  },
  chipTexto: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: TEXT,
  },
  urgenteTexto: {
    color: PRIMARY,
  },

  // Info
  info: {
    flexDirection: "row",
    gap: SPACING * 1.4,
    padding: SPACING * 1.4,
  },
  fecha: {
    width: 44,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  fechaDestacada: {
    backgroundColor: PRIMARY,
  },
  fechaDia: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT,
  },
  fechaMes: {
    fontSize: 10,
    fontWeight: "600",
    color: MUTED,
  },
  fechaTextoDestacada: {
    color: "#FFFFFF",
  },
  titulo: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
  },
  tituloGrande: {
    fontSize: 17,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 18,
    color: MUTED,
    marginTop: 2,
  },
  sub: {
    fontSize: 12,
    fontWeight: "500",
    color: TEXT,
    marginTop: 6,
  },
});

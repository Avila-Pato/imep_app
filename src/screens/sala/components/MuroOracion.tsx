import { PUBLICACIONES } from "@/assets/data/comunidadMocks";
import {
  FUENTE,
  GRUPOS,
  MUTED,
  NOTA_TINTA,
  NOTAS_COLORES,
  PRIMARY,
  SERIF,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { alternarOrando, useEstudios } from "@/store/estudios";
import { GrupoId, Publicacion } from "@/types/typesComunidad";
import { oracionVigente, tiempoRestante } from "@/utils/tiempo";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Inclinacion de cada papelito (se repite) para que no se vean alineados
const GIROS = ["-2deg", "1.5deg", "-1deg", "2deg", "-1.5deg", "1deg"];

type Props = {
  grupo?: GrupoId; // con grupo: solo esa sala; sin grupo: todas
};

// Muro de peticiones de oracion, como papelitos pegados en una pared
export default function MuroOracion({ grupo }: Props) {
  const { publicaciones, orando } = useEstudios();

  // las publicaciones antiguas sin sala cuentan como "Iglesia"
  // solo las peticiones de las ultimas 24 horas
  const muro = [...publicaciones, ...PUBLICACIONES]
    .filter((p) => oracionVigente(p.fecha))
    .filter((p) => !grupo || (p.grupo ?? "general") === grupo)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Dos columnas alternadas (tipo "masonry")
  const izquierda = muro.filter((_, i) => i % 2 === 0);
  const derecha = muro.filter((_, i) => i % 2 === 1);

  const nota = (p: Publicacion, i: number) => {
    const marcado = orando.includes(p.id);
    const total = p.orando + (marcado ? 1 : 0);
    const propia = publicaciones.some((x) => x.id === p.id);
    const sala = GRUPOS.find((g) => g.id === (p.grupo ?? "general"));
    // el indice global decide color e inclinacion
    const n = muro.indexOf(p);
    return (
      <View
        key={p.id}
        style={[
          styles.nota,
          {
            backgroundColor: NOTAS_COLORES[n % NOTAS_COLORES.length],
            transform: [{ rotate: GIROS[n % GIROS.length] }],
            marginTop: i === 0 ? SPACING * 1.4 : SPACING * 2.2,
          },
        ]}
      >
        {/* Cinta adhesiva */}
        <View
          style={[
            styles.cinta,
            { transform: [{ rotate: n % 2 ? "4deg" : "-4deg" }] },
          ]}
        />

        {p.mostrarCita && (
          <Text style={styles.citaNota}>{p.cita.toUpperCase()}</Text>
        )}
        <Text style={styles.texto}>{p.texto}</Text>
        <Text style={styles.restante}>{tiempoRestante(p.fecha)}</Text>

        <View style={styles.pie}>
          <Text style={styles.autor} numberOfLines={1}>
            {propia ? "Tú" : p.autor.split(" ")[0]}
            {!grupo && sala && ` · ${sala.label}`}
          </Text>
          <Pressable
            onPress={() => alternarOrando(p.id)}
            hitSlop={10}
            style={({ pressed }) => [
              styles.orar,
              marcado && styles.orarActivo,
              pressed && styles.presionado,
            ]}
            accessibilityLabel={marcado ? "Dejar de orar" : "Estoy orando"}
          >
            <Octicons
              name={marcado ? "heart-fill" : "heart"}
              size={11}
              color={PRIMARY}
            />
            <Text style={styles.orarTexto}>{total}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View>
      {/* Encabezado del muro */}
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>
          Oramos <Text style={styles.cursiva}>unos por otros</Text>
        </Text>
        <Text style={styles.subtitulo}>
          Toca el corazón cuando ores · Cada petición dura 24 horas
        </Text>
      </View>

      {muro.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTexto}>
            Aún no hay peticiones. Termina un estudio guiado y compártelo.
          </Text>
          <Pressable
            onPress={() => router.navigate("/oraciones" as Href)}
            hitSlop={8}
          >
            <Text style={styles.vacioLink}>Ir al estudio guiado →</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.columnas}>
          <View style={styles.columna}>{izquierda.map(nota)}</View>
          <View style={[styles.columna, styles.columnaDerecha]}>
            {derecha.map(nota)}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    alignItems: "center",
    gap: 4,
    paddingTop: SPACING,
    paddingBottom: SPACING,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 26,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  subtitulo: {
    fontSize: 12,
    color: MUTED,
  },

  // Columnas
  columnas: {
    flexDirection: "row",
    gap: SPACING * 1.4,
  },
  columna: {
    flex: 1,
  },
  columnaDerecha: {
    marginTop: SPACING * 2.4, // desfase para que se vea desordenado
  },

  // Papelito
  nota: {
    padding: SPACING * 1.2,
    paddingTop: SPACING * 1.8,
    borderRadius: 3,
    gap: SPACING,
    // sombra suave, como papel pegado
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cinta: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    width: 46,
    height: 16,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  texto: {
    fontFamily: FUENTE.mano,
    fontSize: 19,
    lineHeight: 23,
    color: NOTA_TINTA,
  },
  pie: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  citaNota: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(42,42,42,0.65)",
  },
  restante: {
    fontSize: 10,
    letterSpacing: 0.4,
    color: "rgba(42,42,42,0.5)",
    marginTop: -4,
  },
  autor: {
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "rgba(42,42,42,0.6)",
  },
  orar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(42,42,42,0.35)",
  },
  orarActivo: {
    backgroundColor: "rgba(229, 72, 77, 0.12)",
    borderColor: PRIMARY,
  },
  presionado: {
    opacity: 0.6,
  },
  orarTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: NOTA_TINTA,
  },

  vacio: {
    alignItems: "center",
    gap: 6,
    paddingVertical: SPACING * 4,
  },
  vacioTexto: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
  },
  vacioLink: {
    marginTop: SPACING,
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
});

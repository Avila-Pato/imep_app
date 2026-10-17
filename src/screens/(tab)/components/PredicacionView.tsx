import { PREDICACIONES } from "@/assets/data/predicacionesMocks";
import {
  BORDER,
  MESES_CORTOS,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { iniciales, partirTitulo } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import PasajeTexto from "./PasajeTexto";

const deKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// "2026-10-13" -> "MAR 13 OCT"
const fechaCorta = (key: string) => {
  const f = deKey(key);
  const dia = f
    .toLocaleDateString("es-ES", { weekday: "short" })
    .replace(".", "");
  return `${dia} ${f.getDate()} ${MESES_CORTOS[f.getMonth()]}`.toUpperCase();
};

// Mas reciente primero, sin las que aun no ocurren
const hoyKey = new Date().toISOString().slice(0, 10);
const LISTA = PREDICACIONES.filter((p) => p.fecha <= hoyKey).sort((a, b) =>
  b.fecha.localeCompare(a.fecha),
);

export default function PredicacionView() {
  const [actualId, setActualId] = useState(LISTA[0]?.id);
  const actual = LISTA.find((p) => p.id === actualId);
  const pasaje = usePasaje(actual?.cita ?? "");

  if (!actual) {
    return (
      <View style={styles.vacio}>
        <Octicons name="book" size={22} color={MUTED} />
        <Text style={styles.vacioTexto}>Aún no hay predicaciones</Text>
      </View>
    );
  }

  const anteriores = LISTA.filter((p) => p.id !== actual.id);
  const { inicio, final } = partirTitulo(actual.titulo);
  const esUltima = actual.id === LISTA[0]?.id;

  return (
    <View style={styles.contenedor}>
      {/* Encabezado */}
      <View style={styles.card}>
        <View style={styles.etiquetas}>
          <Text style={styles.chip}>
            {esUltima ? "ÚLTIMA PREDICACIÓN" : "PREDICACIÓN"}
          </Text>
          <Text style={styles.meta}>{fechaCorta(actual.fecha)}</Text>
        </View>

        <Text style={styles.titulo}>
          {inicio}
          <Text style={styles.cursiva}>{final}</Text>
        </Text>

        <View style={styles.predicador}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>
              {iniciales(actual.predicador)}
            </Text>
          </View>
          <View>
            <Text style={styles.predicadorNombre}>{actual.predicador}</Text>
            <Text style={styles.predicadorRol}>{actual.culto}</Text>
          </View>
        </View>
      </View>

      {/* Pasaje (desde la API de la Biblia) */}
      <View>
        <Text style={styles.seccion}>PASAJE</Text>
        <View style={styles.card}>
          <PasajeTexto
            cita={actual.cita}
            versos={pasaje.versos}
            cargando={pasaje.cargando}
            error={pasaje.error}
          />
        </View>
      </View>

      {/* Anteriores */}
      {anteriores.length > 0 && (
        <View>
          <Text style={styles.seccion}>ANTERIORES</Text>
          <View style={[styles.card, styles.cardLista]}>
            {anteriores.map((p, i) => {
              const f = deKey(p.fecha);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setActualId(p.id)}
                  style={({ pressed }) => [
                    styles.fila,
                    i > 0 && styles.conLinea,
                    pressed && styles.presionado,
                  ]}
                >
                  <View style={styles.fecha}>
                    <Text style={styles.fechaDia}>{f.getDate()}</Text>
                    <Text style={styles.fechaMes}>
                      {MESES_CORTOS[f.getMonth()]}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.filaTitulo} numberOfLines={1}>
                      {p.titulo}
                    </Text>
                    <Text style={styles.filaSub} numberOfLines={1}>
                      {p.predicador} · {p.cita}
                    </Text>
                  </View>
                  <Octicons name="chevron-right" size={16} color={MUTED} />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING * 2,
    paddingTop: SPACING,
  },
  flex: {
    flex: 1,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING,
  },
  card: {
    padding: SPACING * 1.6,
    gap: SPACING * 1.4,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  cardLista: {
    paddingVertical: SPACING / 2,
    gap: 0,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  presionado: {
    opacity: 0.6,
  },

  // Encabezado
  etiquetas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chip: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    color: TEXT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: "hidden",
  },
  meta: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: MUTED,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 28,
    lineHeight: 34,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  predicador: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingTop: SPACING * 1.2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  avatarTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: TEXT,
  },
  predicadorNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },
  predicadorRol: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },

  // Anteriores
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
  },
  fecha: {
    width: 40,
    alignItems: "center",
  },
  fechaDia: {
    fontFamily: SERIF,
    fontSize: 20,
    color: TEXT,
  },
  fechaMes: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: MUTED,
  },
  filaTitulo: {
    fontFamily: SERIF,
    fontSize: 16,
    color: TEXT,
  },
  filaSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  vacio: {
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING * 3,
  },
  vacioTexto: {
    fontSize: 13,
    color: MUTED,
  },
});

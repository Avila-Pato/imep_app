import { PREDICACIONES } from "@/assets/data/predicacionesMocks";
import {
  BORDER,
  MESES_CORTOS,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { partirTitulo } from "@/utils/texto";
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

type Props = {
  onEstudiar: (cita: string) => void;
};

export default function PredicacionView({ onEstudiar }: Props) {
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

  return (
    <View style={styles.contenedor}>
      {/* Encabezado */}
      <View style={styles.cabecera}>
        <Text style={styles.meta}>
          {fechaCorta(actual.fecha)} · {actual.culto.toUpperCase()}
        </Text>
        <Text style={styles.titulo}>
          {inicio}
          <Text style={styles.tituloCursiva}>{final}</Text>
        </Text>
        <Text style={styles.predicador}>
          <Text style={styles.predicadorLabel}>Predicador </Text>
          {actual.predicador}
        </Text>
      </View>

      <View style={styles.separador} />

      {/* Pasaje (desde la API de la Biblia) */}
      <PasajeTexto
        cita={actual.cita}
        versos={pasaje.versos}
        cargando={pasaje.cargando}
        error={pasaje.error}
      />

      <View style={styles.separador} />

      {/* Puntos principales */}
      <View>
        {actual.puntos.map((punto, i) => (
          <View key={i} style={[styles.punto, i > 0 && styles.conLinea]}>
            <Text style={styles.numero}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={styles.puntoTexto}>{punto}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => onEstudiar(actual.cita)}
        style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
      >
        <Text style={styles.botonTexto}>Estudiar este pasaje →</Text>
      </Pressable>

      {/* Anteriores */}
      {anteriores.length > 0 && (
        <View style={styles.anteriores}>
          <Text style={styles.seccion}>ANTERIORES</Text>
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
                <Text style={styles.filaFecha}>
                  {f.getDate()} {MESES_CORTOS[f.getMonth()].toLowerCase()}
                </Text>
                <View style={styles.flex}>
                  <Text style={styles.filaTitulo} numberOfLines={1}>
                    {p.titulo}
                  </Text>
                  <Text style={styles.filaSub} numberOfLines={1}>
                    {p.predicador} · {p.cita}
                  </Text>
                </View>
                <Octicons name="arrow-right" size={14} color={MUTED} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING * 2.4,
    paddingTop: SPACING,
  },
  flex: {
    flex: 1,
  },

  // Encabezado
  cabecera: {
    alignItems: "center",
    gap: SPACING,
  },
  meta: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 32,
    lineHeight: 38,
    color: TEXT,
    textAlign: "center",
  },
  tituloCursiva: {
    fontStyle: "italic",
    color: PRIMARY,
  },
  predicador: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
  predicadorLabel: {
    fontWeight: "400",
    color: MUTED,
  },
  separador: {
    alignSelf: "center",
    width: 32,
    height: 1,
    backgroundColor: BORDER,
  },

  // Puntos
  punto: {
    flexDirection: "row",
    gap: SPACING * 1.4,
    paddingVertical: SPACING * 1.4,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  numero: {
    fontFamily: SERIF,
    fontSize: 15,
    color: MUTED,
    width: 24,
  },
  puntoTexto: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
  },

  // Boton
  boton: {
    alignSelf: "center",
    paddingHorizontal: SPACING * 2.4,
    paddingVertical: SPACING * 1.2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  presionado: {
    opacity: 0.6,
  },
  botonTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT,
  },

  // Anteriores
  anteriores: {
    marginTop: SPACING,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING / 2,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.4,
    paddingVertical: SPACING * 1.4,
  },
  filaFecha: {
    width: 48,
    fontSize: 13,
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

import { MUTED, SERIF, SPACING, TEXT } from "@/constants/constans";
import { Verso } from "@/services/biblia";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Props = {
  cita: string;
  versos?: Verso[];
  cargando?: boolean;
  error?: string;
};

// Hasta este largo se muestra como cita centrada; si es mas, como lectura
const LARGO_CITA = 280;

export default function PasajeTexto({ cita, versos, cargando, error }: Props) {
  const referencia = `${cita.trim().toUpperCase()} · RVR1960`;

  if (cargando) return <ActivityIndicator color={MUTED} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!versos?.length) return null;

  const largo = versos.reduce((n, v) => n + v.texto.length, 0);

  // Corto: cita centrada en cursiva
  if (largo <= LARGO_CITA) {
    return (
      <View style={styles.cita}>
        <Text style={styles.citaTexto}>
          “{versos.map((v) => v.texto).join(" ")}”
        </Text>
        <Text style={styles.referencia}>{referencia}</Text>
      </View>
    );
  }

  // Largo: lectura alineada a la izquierda con numero de versiculo
  return (
    <View style={styles.lectura}>
      <Text style={styles.referencia}>{referencia}</Text>
      <Text style={styles.lecturaTexto}>
        {versos.map((v) => (
          <Text key={v.numero}>
            {v.numero > 0 && <Text style={styles.numero}>{v.numero} </Text>}
            {v.texto}{" "}
          </Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cita: {
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingHorizontal: SPACING,
  },
  citaTexto: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 18,
    lineHeight: 28,
    color: TEXT,
    textAlign: "center",
  },
  referencia: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: MUTED,
  },
  lectura: {
    gap: SPACING * 1.2,
  },
  lecturaTexto: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 30,
    color: TEXT,
  },
  numero: {
    fontFamily: undefined,
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },
  error: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
  },
});

import { BORDER, MUTED, SURFACE, TEXT } from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const pad = (n: number) => String(n).padStart(2, "0");

type Props = {
  hora: string; // "HH:MM"
  onCambiar: (hora: string) => void;
};

// Hora exacta (ej: 18:09): flechas de a 1 (manteniendo apretado avanza solo)
// o se toca el numero y se escribe
export default function SelectorHora({ hora, onCambiar }: Props) {
  const [h, m] = hora.split(":").map(Number);
  const fijar = (hh: number, mm: number) =>
    onCambiar(`${pad((hh + 24) % 24)}:${pad((mm + 60) % 60)}`);

  return (
    <View style={styles.fila}>
      <Columna
        valor={h}
        max={23}
        etiqueta="Hora"
        onCambiar={(v) => fijar(v, m)}
      />
      <Text style={styles.dosPuntos}>:</Text>
      <Columna
        valor={m}
        max={59}
        etiqueta="Minutos"
        onCambiar={(v) => fijar(h, v)}
      />
    </View>
  );
}

function Columna({
  valor,
  max,
  etiqueta,
  onCambiar,
}: {
  valor: number;
  max: number;
  etiqueta: string;
  onCambiar: (v: number) => void;
}) {
  // texto mientras se escribe (null = mostrando el valor)
  const [borrador, setBorrador] = useState<string | null>(null);
  // valor al dia para el "mantener apretado" (el intervalo no ve renders nuevos)
  const actual = useRef(valor);
  useEffect(() => {
    actual.current = valor;
  }, [valor]);
  const repetir = useRef<ReturnType<typeof setInterval> | null>(null);

  const parar = () => {
    if (repetir.current) clearInterval(repetir.current);
    repetir.current = null;
  };
  useEffect(() => parar, []);

  // con vuelta: despues de 59 viene 00
  const mover = (delta: number) =>
    onCambiar((actual.current + delta + max + 1) % (max + 1));
  const mantener = (delta: number) => {
    parar();
    repetir.current = setInterval(() => mover(delta), 90);
  };

  const confirmar = () => {
    const n = parseInt(borrador ?? "", 10);
    if (!Number.isNaN(n)) onCambiar(Math.min(max, Math.max(0, n)));
    setBorrador(null);
  };

  const flecha = (delta: number) => (
    <Pressable
      onPress={() => mover(delta)}
      onLongPress={() => mantener(delta)}
      onPressOut={parar}
      delayLongPress={300}
      hitSlop={4}
      style={({ pressed }) => [styles.flecha, pressed && styles.presionado]}
      accessibilityLabel={`${delta > 0 ? "Subir" : "Bajar"} ${etiqueta.toLowerCase()}`}
    >
      <Octicons
        name={delta > 0 ? "chevron-up" : "chevron-down"}
        size={16}
        color={TEXT}
      />
    </Pressable>
  );

  return (
    <View style={styles.columna}>
      {flecha(1)}
      <TextInput
        value={borrador ?? pad(valor)}
        onFocus={() => setBorrador("")}
        onChangeText={(t) => setBorrador(t.replace(/\D/g, "").slice(0, 2))}
        onBlur={confirmar}
        onSubmitEditing={confirmar}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        placeholder={pad(valor)}
        placeholderTextColor={MUTED}
        style={styles.valor}
        accessibilityLabel={etiqueta}
      />
      {flecha(-1)}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  columna: {
    alignItems: "center",
    gap: 2,
  },
  flecha: {
    width: 44,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  presionado: {
    backgroundColor: BORDER,
  },
  valor: {
    width: 52,
    height: 44,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: TEXT,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 0,
  },
  dosPuntos: {
    fontSize: 22,
    fontWeight: "700",
    color: MUTED,
    marginHorizontal: 2,
    marginTop: -2,
  },
});

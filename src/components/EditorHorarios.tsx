import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  PLACEHOLDER,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import SelectorHora from "@/screens/(tab)/components/SelectorHora";
import { HorarioCulto } from "@/types/typesAnuncios";
import Octicons from "@expo/vector-icons/Octicons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

// Lunes primero (como el calendario); el valor es Date.getDay()
const DIAS = [
  { dia: 1, corto: "L", largo: "Lunes" },
  { dia: 2, corto: "M", largo: "Martes" },
  { dia: 3, corto: "M", largo: "Miércoles" },
  { dia: 4, corto: "J", largo: "Jueves" },
  { dia: 5, corto: "V", largo: "Viernes" },
  { dia: 6, corto: "S", largo: "Sábado" },
  { dia: 0, corto: "D", largo: "Domingo" },
];
export const nombreDia = (dia: number) =>
  DIAS.find((d) => d.dia === dia)?.largo ?? "";

// orden: lunes a domingo, y por hora dentro del dia
export const ordenarHorarios = (lista: HorarioCulto[]) =>
  [...lista].sort(
    (a, b) =>
      ((a.dia + 6) % 7) - ((b.dia + 6) % 7) || a.hora.localeCompare(b.hora),
  );

// Dias y horarios de culto de una iglesia: cada culto es un dia + hora
// (+ nombre opcional, ej: "Culto de oración"). Lo usan el onboarding del
// pastor y el cronograma
export default function EditorHorarios({
  horarios,
  onCambiar,
}: {
  horarios: HorarioCulto[];
  onCambiar: (horarios: HorarioCulto[]) => void;
}) {
  const cambiarUno = (i: number, cambios: Partial<HorarioCulto>) =>
    onCambiar(horarios.map((h, k) => (k === i ? { ...h, ...cambios } : h)));
  const quitar = (i: number) => onCambiar(horarios.filter((_, k) => k !== i));
  const agregar = () => {
    // sugiere el siguiente dia que aun no tiene culto (o domingo)
    const usados = horarios.map((h) => h.dia);
    const libre = DIAS.find((d) => !usados.includes(d.dia))?.dia ?? 0;
    onCambiar([...horarios, { dia: libre, hora: "19:30" }]);
  };

  return (
    <View style={styles.contenedor}>
      {horarios.length === 0 && (
        <Text style={styles.vacio}>
          Aún no hay cultos. Agrega el primero (ej: Domingo 11:00).
        </Text>
      )}

      {horarios.map((h, i) => (
        <View key={i} style={styles.tarjeta}>
          <View style={styles.cabecera}>
            <Text style={styles.titulo}>
              {nombreDia(h.dia)} · {h.hora}
            </Text>
            <Pressable
              onPress={() => quitar(i)}
              hitSlop={10}
              accessibilityLabel={`Quitar culto del ${nombreDia(h.dia)}`}
            >
              <Octicons name="trash" size={15} color={MUTED} />
            </Pressable>
          </View>

          {/* dia */}
          <View style={styles.dias}>
            {DIAS.map((d) => {
              const activo = d.dia === h.dia;
              return (
                <Pressable
                  key={d.dia}
                  onPress={() => cambiarUno(i, { dia: d.dia })}
                  style={[styles.dia, activo && styles.diaActivo]}
                  accessibilityLabel={d.largo}
                  accessibilityState={{ selected: activo }}
                >
                  <Text
                    style={[styles.diaTexto, activo && styles.diaTextoActivo]}
                  >
                    {d.corto}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* hora */}
          <SelectorHora
            hora={h.hora}
            onCambiar={(hora) => cambiarUno(i, { hora })}
          />

          {/* nombre (opcional) */}
          <TextInput
            value={h.nombre ?? ""}
            onChangeText={(t) => cambiarUno(i, { nombre: t || undefined })}
            placeholder="Nombre (opcional): Culto de oración"
            placeholderTextColor={PLACEHOLDER}
            maxLength={40}
            style={styles.nombre}
          />
        </View>
      ))}

      <Pressable
        onPress={agregar}
        style={({ pressed }) => [styles.agregar, pressed && styles.presionado]}
      >
        <Octicons name="plus" size={15} color={TEXT} />
        <Text style={styles.agregarTexto}>Agregar culto</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING,
  },
  presionado: {
    opacity: 0.7,
  },
  vacio: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  tarjeta: {
    gap: SPACING,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  dias: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dia: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
  },
  diaActivo: {
    backgroundColor: TEXT,
  },
  diaTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: MUTED,
  },
  diaTextoActivo: {
    color: DARK_BG,
  },
  nombre: {
    paddingVertical: 8,
    fontSize: 14,
    color: TEXT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  agregar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING,
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  agregarTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
});

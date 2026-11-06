import {
  BORDER,
  CAPITULOS_BIBLIA,
  DARK_BG,
  FUENTE,
  LIBROS_BIBLIA,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Sin acentos ni mayusculas, para buscar libros
const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Props = {
  visible: boolean;
  libro: number; // el que se esta leyendo (1..66)
  capitulo: number;
  onElegir: (libro: number, capitulo: number) => void;
  onCerrar: () => void;
};

// Hoja para cambiar de libro y capitulo sin salir de los versiculos
export default function SelectorLibro({
  visible,
  libro,
  capitulo,
  onElegir,
  onCerrar,
}: Props) {
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState("");
  // libro elegido en la hoja (null = mostrando la lista de libros)
  const [elegido, setElegido] = useState<number | null>(null);

  const cerrar = () => {
    setBusqueda("");
    setElegido(null);
    onCerrar();
  };

  const filtro = normalizar(busqueda.trim());
  const libros = LIBROS_BIBLIA.map((nombre, i) => ({
    nombre,
    id: i + 1,
  })).filter((l) => !filtro || normalizar(l.nombre).includes(filtro));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={cerrar}
    >
      <Pressable style={styles.fondo} onPress={cerrar} />
      <View style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}>
        <View style={styles.asa} />

        <View style={styles.cabecera}>
          {elegido ? (
            <Pressable
              onPress={() => setElegido(null)}
              hitSlop={10}
              accessibilityLabel="Volver a los libros"
            >
              <Octicons name="arrow-left" size={18} color={TEXT} />
            </Pressable>
          ) : null}
          <Text style={styles.titulo}>
            {elegido ? LIBROS_BIBLIA[elegido - 1] : "Elige un libro"}
          </Text>
          <Pressable onPress={cerrar} hitSlop={10} accessibilityLabel="Cerrar">
            <Octicons name="x" size={18} color={MUTED} />
          </Pressable>
        </View>

        {elegido ? (
          // Capitulos del libro elegido
          <ScrollView contentContainerStyle={styles.grilla}>
            {Array.from(
              { length: CAPITULOS_BIBLIA[elegido - 1] },
              (_, i) => i + 1,
            ).map((c) => {
              const actual = elegido === libro && c === capitulo;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    onElegir(elegido, c);
                    cerrar();
                  }}
                  style={styles.capitulo}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.circulo,
                        actual && styles.circuloActual,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Text
                        style={[
                          styles.capituloTexto,
                          actual && styles.capituloTextoActual,
                        ]}
                      >
                        {c}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <>
            <View style={styles.buscador}>
              <Octicons name="search" size={14} color={MUTED} />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar libro"
                placeholderTextColor={MUTED}
                autoCorrect={false}
                style={styles.input}
              />
            </View>
            <FlatList
              data={libros}
              keyExtractor={(l) => String(l.id)}
              keyboardShouldPersistTaps="handled"
              // abre con el libro actual a la vista
              initialScrollIndex={filtro ? undefined : Math.max(0, libro - 3)}
              getItemLayout={(_, i) => ({
                length: FILA_ALTO,
                offset: FILA_ALTO * i,
                index: i,
              })}
              renderItem={({ item }) => {
                const actual = item.id === libro;
                return (
                  <Pressable
                    onPress={() => setElegido(item.id)}
                    style={({ pressed }) => [
                      styles.fila,
                      pressed && styles.presionado,
                    ]}
                  >
                    <Text style={[styles.libro, actual && styles.libroActual]}>
                      {item.nombre}
                    </Text>
                    {actual && <Text style={styles.leyendo}>Leyendo</Text>}
                    <Text style={styles.caps}>
                      {CAPITULOS_BIBLIA[item.id - 1]}
                    </Text>
                    <Octicons name="chevron-right" size={14} color={MUTED} />
                  </Pressable>
                );
              }}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const FILA_ALTO = 48;

const styles = StyleSheet.create({
  presionado: {
    opacity: 0.6,
  },
  fondo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  hoja: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "75%",
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    gap: SPACING * 1.2,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3A",
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
  },
  titulo: {
    flex: 1,
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 20,
    color: TEXT,
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    height: 44,
    paddingHorizontal: SPACING * 1.2,
    borderRadius: 999,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
  },
  fila: {
    height: FILA_ALTO,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  libro: {
    flex: 1,
    fontFamily: FUENTE.biblia,
    fontSize: 18,
    color: TEXT,
  },
  libroActual: {
    fontFamily: FUENTE.bibliaFuerte,
  },
  leyendo: {
    fontFamily: FUENTE.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: DARK_BG,
    backgroundColor: TEXT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  caps: {
    fontFamily: FUENTE.bibliaCursiva,
    fontSize: 14,
    color: MUTED,
  },
  grilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: SPACING * 2,
  },
  capitulo: {
    width: "20%", // 5 por fila
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circulo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  circuloActual: {
    backgroundColor: TEXT,
  },
  capituloTexto: {
    fontFamily: FUENTE.biblia,
    fontSize: 20,
    color: TEXT,
  },
  capituloTextoActual: {
    color: DARK_BG,
    fontFamily: FUENTE.bibliaFuerte,
  },
});

import {
  BORDER,
  CAPITULOS_BIBLIA,
  DARK_BG,
  FUENTE,
  GENEROS_BIBLIA,
  LIBROS_BIBLIA,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
  LINEA,
} from "@/constants/constans";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ConBordes from "@/components/ConBordes";

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
  const [busqueda, setBusqueda] = useState("");
  // libro elegido en la hoja (null = mostrando la lista de libros)
  const [elegido, setElegido] = useState<number | null>(null);
  // Antiguo o Nuevo Testamento (abre en el del libro que se esta leyendo)
  const [nuevo, setNuevo] = useState(libro > FIN_AT);

  const cerrar = () => {
    setBusqueda("");
    setElegido(null);
    setNuevo(libro > FIN_AT);
    onCerrar();
  };

  const filtro = normalizar(busqueda.trim());
  // buscando: en toda la Biblia. Si no: los grupos del testamento elegido
  const encontrados = LIBROS_BIBLIA.map((nombre, i) => ({
    nombre,
    id: i + 1,
  })).filter((l) => filtro && normalizar(l.nombre).includes(filtro));
  const grupos = GENEROS_BIBLIA.filter((g) =>
    nuevo ? g.desde > FIN_AT : g.hasta <= FIN_AT,
  );

  // una ficha de libro (3 por fila)
  const ficha = (id: number) => {
    const actual = id === libro;
    return (
      <Pressable
        key={id}
        onPress={() => setElegido(id)}
        style={({ pressed }) => [
          styles.ficha,
          actual && styles.fichaActual,
          pressed && styles.presionado,
        ]}
        accessibilityLabel={`${LIBROS_BIBLIA[id - 1]}, ${CAPITULOS_BIBLIA[id - 1]} capítulos`}
      >
        <Text
          style={[styles.fichaTexto, actual && styles.fichaTextoActual]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {LIBROS_BIBLIA[id - 1]}
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={cerrar}
    >
      <ConBordes>
        {(insets) => (
          <>
            <Pressable style={styles.fondo} onPress={cerrar} />
            <View
              style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}
            >
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
                <Pressable
                  onPress={cerrar}
                  hitSlop={10}
                  accessibilityLabel="Cerrar"
                >
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
                  {/* Antiguo / Nuevo Testamento */}
                  {!filtro && (
                    <View style={styles.testamentos}>
                      {(
                        [
                          [false, "Antiguo Testamento"],
                          [true, "Nuevo Testamento"],
                        ] as const
                      ).map(([n, label]) => (
                        <Pressable
                          key={label}
                          onPress={() => setNuevo(n)}
                          style={[
                            styles.testamento,
                            nuevo === n && styles.testamentoActivo,
                          ]}
                          accessibilityRole="tab"
                          accessibilityState={{ selected: nuevo === n }}
                        >
                          <Text
                            style={[
                              styles.testamentoTexto,
                              nuevo === n && styles.testamentoTextoActivo,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.libros}
                  >
                    {filtro ? (
                      encontrados.length ? (
                        <View style={styles.fichas}>
                          {encontrados.map((l) => ficha(l.id))}
                        </View>
                      ) : (
                        <Text style={styles.vacio}>
                          No hay ningún libro con ese nombre.
                        </Text>
                      )
                    ) : (
                      grupos.map((g) => (
                        <View key={g.nombre} style={styles.grupo}>
                          <Text style={styles.grupoTitulo}>
                            {g.nombre.toUpperCase()}
                          </Text>
                          <View style={styles.fichas}>
                            {Array.from(
                              { length: g.hasta - g.desde + 1 },
                              (_, k) => g.desde + k,
                            ).map(ficha)}
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </>
              )}
            </View>
          </>
        )}
      </ConBordes>
    </Modal>
  );
}

// los primeros 39 libros son del Antiguo Testamento
const FIN_AT = 39;

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
    backgroundColor: LINEA,
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
  testamentos: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  testamento: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 999,
  },
  testamentoActivo: {
    backgroundColor: TEXT,
  },
  testamentoTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: MUTED,
  },
  testamentoTextoActivo: {
    color: DARK_BG,
  },
  libros: {
    gap: SPACING * 1.4,
    paddingBottom: SPACING * 2,
  },
  grupo: {
    gap: SPACING * 0.7,
  },
  grupoTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: MUTED,
  },
  fichas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  // 3 por fila (con 2 espacios de 8 entre ellas)
  ficha: {
    width: "31.6%",
    height: 42,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  fichaActual: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  fichaTexto: {
    fontFamily: FUENTE.biblia,
    fontSize: 15,
    color: TEXT,
  },
  fichaTextoActual: {
    fontFamily: FUENTE.bibliaFuerte,
    color: DARK_BG,
  },
  vacio: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    paddingTop: SPACING * 2,
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

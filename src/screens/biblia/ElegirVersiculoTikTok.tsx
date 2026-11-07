import ConBordes from "@/components/ConBordes";
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
import { usePasaje } from "@/hooks/usePasaje";
import { Verso } from "@/services/biblia";
import { useEstudios } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BotonLibro from "./BotonLibro";
import SelectorLibro from "./SelectorLibro";
import { tamanoVerso } from "./tamanoVerso";

// Elegir un versiculo deslizando de a uno (como TikTok) y tocando "Elegir".
// Se usa al compartir en el chat de una sala
export default function ElegirVersiculoTikTok({
  onElegir,
  onCerrar,
}: {
  onElegir: (cita: string, texto: string) => void;
  onCerrar: () => void;
}) {
  const { letra = 1 } = useEstudios();
  const [pos, setPos] = useState({ libro: 43, capitulo: 3 }); // Juan 3
  const nombre = LIBROS_BIBLIA[pos.libro - 1];
  const { versos, cargando, error } = usePasaje(`${nombre} ${pos.capitulo}`);
  const [alto, setAlto] = useState(0);
  const [actual, setActual] = useState(0);
  const [selector, setSelector] = useState(false);

  const lista = versos ?? [];
  const verso: Verso | undefined = lista[actual];
  const cita = verso ? `${nombre} ${pos.capitulo}:${verso.numero}` : "";
  const hayMas = pos.capitulo < CAPITULOS_BIBLIA[pos.libro - 1];

  const irCapitulo = (libro: number, capitulo: number) => {
    setActual(0);
    setPos({ libro, capitulo });
  };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible
      animationType="slide"
      onRequestClose={onCerrar}
    >
      <ConBordes>
        {(insets) => (
          <View
            style={[
              styles.pantalla,
              { paddingTop: insets.top, paddingBottom: insets.bottom },
            ]}
          >
            {/* Cabecera: cerrar, libro y capitulo, progreso */}
            <View style={styles.cabecera}>
              <Pressable
                onPress={onCerrar}
                hitSlop={10}
                accessibilityLabel="Cerrar"
                style={styles.cerrar}
              >
                <Octicons name="x" size={18} color={TEXT} />
              </Pressable>
              <BotonLibro
                titulo={`${nombre} ${pos.capitulo}`}
                onPress={() => setSelector(true)}
              />
              <Text style={styles.contador}>
                {lista.length ? `${actual + 1}/${lista.length}` : ""}
              </Text>
            </View>

            {/* Un versiculo por pantalla */}
            <View
              style={styles.flex}
              onLayout={(e) => setAlto(e.nativeEvent.layout.height)}
            >
              {cargando && (
                <View style={styles.centro}>
                  <ActivityIndicator color={MUTED} />
                </View>
              )}
              {error && (
                <View style={styles.centro}>
                  <Text style={styles.ayuda}>{error}</Text>
                </View>
              )}
              {alto > 0 && lista.length > 0 && (
                <FlatList
                  key={`${pos.libro}-${pos.capitulo}`}
                  style={{ height: alto }}
                  data={lista}
                  keyExtractor={(v) => String(v.numero)}
                  pagingEnabled
                  snapToInterval={alto}
                  snapToAlignment="start"
                  disableIntervalMomentum
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  getItemLayout={(_, i) => ({
                    length: alto,
                    offset: alto * i,
                    index: i,
                  })}
                  scrollEventThrottle={16}
                  onScroll={(e) => {
                    const i = Math.round(e.nativeEvent.contentOffset.y / alto);
                    if (i !== actual) setActual(i);
                  }}
                  renderItem={({ item, index }) => {
                    const t = tamanoVerso(item.texto, letra);
                    return (
                      <View style={[styles.pagina, { height: alto }]}>
                        <Text
                          style={[
                            styles.verso,
                            { fontSize: t, lineHeight: t * 1.3 },
                          ]}
                        >
                          “{item.texto}”
                        </Text>
                        <Text style={styles.cita}>
                          {nombre} {pos.capitulo}:{item.numero}
                        </Text>
                        {index === 0 && (
                          <Text style={styles.ayuda}>
                            Desliza hacia arriba para ver otro versículo
                          </Text>
                        )}
                        {index === lista.length - 1 && hayMas && (
                          <Pressable
                            onPress={() =>
                              irCapitulo(pos.libro, pos.capitulo + 1)
                            }
                            style={styles.siguiente}
                          >
                            <Text style={styles.siguienteTexto}>
                              Siguiente capítulo · {nombre} {pos.capitulo + 1}
                            </Text>
                            <Octicons
                              name="arrow-right"
                              size={13}
                              color={TEXT}
                            />
                          </Pressable>
                        )}
                      </View>
                    );
                  }}
                />
              )}
            </View>

            {/* Elegir el que se esta viendo */}
            <Pressable
              onPress={() => verso && onElegir(cita, verso.texto)}
              disabled={!verso}
              style={({ pressed }) => [
                styles.boton,
                !verso && styles.apagado,
                pressed && styles.presionado,
              ]}
            >
              <Octicons name="check" size={16} color={DARK_BG} />
              <Text style={styles.botonTexto}>
                {verso ? `Elegir ${cita}` : "Cargando…"}
              </Text>
            </Pressable>

            <SelectorLibro
              visible={selector}
              libro={pos.libro}
              capitulo={pos.capitulo}
              onElegir={irCapitulo}
              onCerrar={() => setSelector(false)}
            />
          </View>
        )}
      </ConBordes>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  apagado: {
    opacity: 0.4,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING,
    paddingHorizontal: SPACING * 2,
    paddingVertical: SPACING,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  cerrar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  contador: {
    minWidth: 34,
    textAlign: "right",
    fontSize: 12,
    color: MUTED,
    fontVariant: ["tabular-nums"],
  },
  centro: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  pagina: {
    justifyContent: "center",
    gap: SPACING * 1.6,
    paddingHorizontal: SPACING * 2.6,
  },
  verso: {
    fontFamily: FUENTE.biblia,
    color: TEXT,
    textAlign: "center",
  },
  cita: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    letterSpacing: 1,
    color: MUTED,
    textAlign: "center",
  },
  ayuda: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
  siguiente: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  siguienteTexto: {
    fontSize: 13,
    color: TEXT,
  },
  boton: {
    flexDirection: "row",
    gap: 8,
    height: 52,
    marginHorizontal: SPACING * 2,
    marginVertical: SPACING,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: DARK_BG,
  },
});

import { useNombreIglesiaSiVarias } from "@/store/estudios";
import {
  BORDER,
  CATEGORIAS,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { Anuncio } from "@/types/typesAnuncios";
import { partirTitulo } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ConBordes from "@/components/ConBordes";

type Props = {
  anuncio: Anuncio | null; // null = cerrado
  onCerrar: () => void;
  // solo para quien puede publicar
  onEditar?: () => void;
  onBorrar?: () => void;
};

// "2026-10-25" -> "Sábado 25 de octubre"
const fechaLarga = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  const texto = new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// Dato con icono (fecha, hora, lugar)
const Dato = ({
  icono,
  texto,
}: {
  icono: "calendar" | "clock" | "location";
  texto: string;
}) => (
  <View style={styles.dato}>
    <View style={styles.datoIcono}>
      <Octicons name={icono} size={14} color={TEXT} />
    </View>
    <Text style={styles.datoTexto}>{texto}</Text>
  </View>
);

// La imagen del detalle no pasa de 4:5 (ancho / alto)
const ASPECTO_MINIMO = 4 / 5;

// Detalle de un anuncio: imagen (si tiene) y toda la informacion
export default function ModalAnuncio({
  anuncio,
  onCerrar,
  onEditar,
  onBorrar,
}: Props) {
  const nombreIglesia = useNombreIglesiaSiVarias();
  return (
    <Modal
      navigationBarTranslucent
      visible={!!anuncio}
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <ConBordes>
        {(insets) => (
          <>
            <View style={styles.fondo}>
              <Pressable style={styles.cerrarFondo} onPress={onCerrar} />
              <View
                style={[
                  styles.hoja,
                  { paddingBottom: insets.bottom + SPACING },
                ]}
              >
                {anuncio && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {anuncio.imagen ? (
                      <Image
                        source={{ uri: anuncio.imagen }}
                        // con su forma, pero nunca mas alta que 4:5 (una
                        // foto vertical llenaba toda la pantalla): lo que
                        // sobra se recorta al centro
                        style={[
                          styles.imagen,
                          !!anuncio.imagenAspecto && {
                            aspectRatio: Math.max(
                              anuncio.imagenAspecto,
                              ASPECTO_MINIMO,
                            ),
                          },
                        ]}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={styles.asa} />
                    )}

                    <Pressable
                      onPress={onCerrar}
                      hitSlop={10}
                      style={[
                        styles.cerrar,
                        anuncio.imagen && styles.cerrarSobre,
                      ]}
                      accessibilityLabel="Cerrar"
                    >
                      <Octicons name="x" size={16} color={TEXT} />
                    </Pressable>

                    <View style={styles.cuerpo}>
                      <View style={styles.etiquetas}>
                        <View style={styles.categoria}>
                          <Octicons
                            name={CATEGORIAS[anuncio.categoria].icon}
                            size={11}
                            color={MUTED}
                          />
                          <Text style={styles.categoriaTexto}>
                            {CATEGORIAS[anuncio.categoria].label.toUpperCase()}
                          </Text>
                        </View>
                        {/* de que iglesia es (si tiene varias) */}
                        {!!nombreIglesia && (
                          <View style={styles.categoria}>
                            <Octicons name="location" size={11} color={MUTED} />
                            <Text style={styles.categoriaTexto}>
                              {nombreIglesia.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>

                      {!!anuncio.titulo && (
                        <Text style={styles.titulo}>
                          {partirTitulo(anuncio.titulo).inicio}
                          <Text style={styles.cursiva}>
                            {partirTitulo(anuncio.titulo).final}
                          </Text>
                        </Text>
                      )}

                      <View style={styles.datos}>
                        <Dato
                          icono="calendar"
                          texto={fechaLarga(anuncio.fecha)}
                        />
                        {anuncio.hora && (
                          <Dato icono="clock" texto={`${anuncio.hora} hrs`} />
                        )}
                        {anuncio.lugar && (
                          <Dato icono="location" texto={anuncio.lugar} />
                        )}
                      </View>

                      {!!(anuncio.detalle || anuncio.descripcion) && (
                        <Text style={styles.texto}>
                          {anuncio.detalle ?? anuncio.descripcion}
                        </Text>
                      )}

                      {anuncio.autor && (
                        <Text style={styles.autor}>
                          Publicado por {anuncio.autor}
                        </Text>
                      )}

                      {/* Administrar (pastor, secretaria, comunicaciones) */}
                      {(onEditar || onBorrar) && (
                        <View style={styles.botones}>
                          {onEditar && (
                            <Pressable
                              onPress={onEditar}
                              style={({ pressed }) => [
                                styles.boton,
                                styles.flex,
                                pressed && styles.presionado,
                              ]}
                            >
                              <Octicons name="pencil" size={14} color={TEXT} />
                              <Text style={styles.botonTexto}>Editar</Text>
                            </Pressable>
                          )}
                          {onBorrar && (
                            <Pressable
                              onPress={onBorrar}
                              style={({ pressed }) => [
                                styles.boton,
                                pressed && styles.presionado,
                              ]}
                              accessibilityLabel="Borrar anuncio"
                            >
                              <Octicons
                                name="trash"
                                size={14}
                                color={PRIMARY}
                              />
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </>
        )}
      </ConBordes>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  cerrarFondo: {
    flex: 1,
  },
  hoja: {
    maxHeight: "88%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  imagen: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: SURFACE,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    marginTop: SPACING,
    marginBottom: SPACING,
  },
  cerrar: {
    position: "absolute",
    top: SPACING * 1.4,
    right: PADDING,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  cerrarSobre: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cuerpo: {
    gap: SPACING * 1.6,
    paddingHorizontal: PADDING,
    paddingTop: SPACING * 1.6,
    paddingBottom: SPACING,
  },
  etiquetas: {
    flexDirection: "row",
    gap: SPACING,
  },
  categoria: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  categoriaTexto: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    color: MUTED,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 28,
    lineHeight: 34,
    color: TEXT,
    paddingRight: 40, // espacio para la X cuando no hay imagen
  },
  cursiva: {
    fontStyle: "italic",
  },
  datos: {
    gap: SPACING,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  dato: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  datoIcono: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  datoTexto: {
    fontSize: 14,
    color: TEXT,
  },
  texto: {
    fontSize: 15,
    lineHeight: 23,
    color: TEXT,
  },
  autor: {
    fontSize: 12,
    color: MUTED,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.6,
  },
  botones: {
    flexDirection: "row",
    gap: SPACING,
    marginTop: SPACING / 2,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    paddingHorizontal: SPACING * 1.6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  botonTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },
});

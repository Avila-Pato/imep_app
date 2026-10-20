import {
  BORDER,
  CATEGORIAS,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  anuncio: Anuncio | null; // null = cerrado
  onCerrar: () => void;
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

// Detalle de un anuncio: imagen (si tiene) y toda la informacion
export default function ModalAnuncio({ anuncio, onCerrar }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={!!anuncio}
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <View style={styles.fondo}>
        <Pressable style={styles.cerrarFondo} onPress={onCerrar} />
        <View style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}>
          {anuncio && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {anuncio.imagen ? (
                <Image
                  source={{ uri: anuncio.imagen }}
                  style={styles.imagen}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.asa} />
              )}

              <Pressable
                onPress={onCerrar}
                hitSlop={10}
                style={[styles.cerrar, anuncio.imagen && styles.cerrarSobre]}
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
                </View>

                <Text style={styles.titulo}>
                  {partirTitulo(anuncio.titulo).inicio}
                  <Text style={styles.cursiva}>
                    {partirTitulo(anuncio.titulo).final}
                  </Text>
                </Text>

                <View style={styles.datos}>
                  <Dato icono="calendar" texto={fechaLarga(anuncio.fecha)} />
                  {anuncio.hora && (
                    <Dato icono="clock" texto={`${anuncio.hora} hrs`} />
                  )}
                  {anuncio.lugar && (
                    <Dato icono="location" texto={anuncio.lugar} />
                  )}
                </View>

                <Text style={styles.texto}>
                  {anuncio.detalle ?? anuncio.descripcion}
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
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
});

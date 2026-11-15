import { DARK_BG, TEXT } from "@/constants/constans";
import { Grupo } from "@/types/typesComunidad";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

// El circulo de una sala: su foto si tiene, si no su icono sobre su color
export default function IconoSala({
  sala,
  tamano = 40,
  claro,
}: {
  sala: Pick<Grupo, "icono" | "tono" | "foto">;
  tamano?: number;
  claro?: string; // color del fondo (si no, el de la sala)
}) {
  const caja = {
    width: tamano,
    height: tamano,
    borderRadius: tamano / 2,
  };
  if (sala.foto) {
    return (
      <Image
        source={{ uri: sala.foto }}
        style={[caja, styles.foto]}
        contentFit="cover"
        cachePolicy="disk"
      />
    );
  }
  return (
    <View
      style={[
        caja,
        styles.centro,
        { backgroundColor: claro ?? sala.tono ?? TEXT },
      ]}
    >
      <Octicons
        name={sala.icono}
        size={Math.round(tamano * 0.45)}
        color={DARK_BG}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    alignItems: "center",
    justifyContent: "center",
  },
  foto: {
    backgroundColor: DARK_BG,
  },
});

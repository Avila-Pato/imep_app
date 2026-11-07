import { SERIF, SURFACE, TEXT } from "@/constants/constans";
import { AvatarElegido } from "@/store/estudios";
import { iniciales } from "@/utils/texto";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

// Avatares dibujados (DiceBear). Se piden por internet con una semilla:
// cada semilla es un personaje distinto dentro de cada estilo
export const ESTILOS_AVATAR = [
  { id: "adventurer", label: "Chibi", licencia: "Lisa Wischofsky, CC BY 4.0" },
  { id: "lorelei", label: "Lorelei", licencia: "Lisa Wischofsky, CC0" },
  { id: "big-smile", label: "Sonrisas", licencia: "Ashley Seo, CC BY 4.0" },
  { id: "notionists", label: "Bocetos", licencia: "Zoish, CC0" },
  { id: "fun-emoji", label: "Emojis", licencia: "Davis Uche, CC BY 4.0" },
] as const;

export const CHIBIS = [
  "Sofia",
  "Mateo",
  "Valentina",
  "Lucas",
  "Isabella",
  "Gabriel",
  "Camila",
  "Samuel",
  "Martina",
  "David",
  "Emilia",
  "Daniel",
  "Lucia",
  "Tomas",
  "Renata",
  "Elias",
  "Julieta",
  "Benjamin",
  "Abril",
  "Josue",
];
const FONDOS = ["ffd5dc", "c0aede", "b6e3f4", "d1d4f9", "ffdfbf"];
export const urlChibi = (semilla: string, estilo = "adventurer") => {
  const fondo = FONDOS[semilla.length % FONDOS.length];
  return `https://api.dicebear.com/9.x/${estilo}/png?seed=${encodeURIComponent(semilla)}&backgroundColor=${fondo}&size=256`;
};

// La foto de la persona: chibi, foto propia o sus iniciales
export default function AvatarPersona({
  nombre,
  avatar,
  tamano,
}: {
  nombre: string;
  avatar?: AvatarElegido;
  tamano: number;
}) {
  const redondo = {
    width: tamano,
    height: tamano,
    borderRadius: tamano / 2,
  };
  const uri =
    avatar?.tipo === "chibi"
      ? urlChibi(avatar.semilla, avatar.estilo)
      : avatar?.tipo === "foto"
        ? avatar.uri
        : undefined;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.imagen, redondo]}
        contentFit="cover"
        transition={200}
        cachePolicy="disk"
      />
    );
  }
  return (
    <View style={[styles.iniciales, redondo]}>
      <Text style={[styles.texto, { fontSize: tamano * 0.36 }]}>
        {iniciales(nombre)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imagen: {
    backgroundColor: SURFACE,
  },
  iniciales: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  texto: {
    fontFamily: SERIF,
    color: TEXT,
  },
});

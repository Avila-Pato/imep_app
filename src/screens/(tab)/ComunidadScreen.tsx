import { useEspacioBarra } from "@/hooks/useEspacioBarra";
import {
  DARK_BG,
  HOME_PADDING as PADDING,
  SPACING,
} from "@/constants/constans";
import { useEsPastor, useIglesia, usePuede } from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
import { BlurTargetView } from "expo-blur";
import { useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IglesiaView from "./components/IglesiaView";
import PopupAyuda, { PuntoAyuda } from "./components/PopupAyuda";

// Comunidad: solo las salas (el muro de oracion vive dentro de cada sala)
export default function ComunidadScreen() {
  // espacio para la barra flotante y los botones del telefono
  const espacio = useEspacioBarra();
  const esPastor = useEsPastor();
  const administra = usePuede("roles");
  // lo que se ve borroso detras del pop up de ayuda
  const objetivo = useRef<View>(null);

  // que es Comunidad (el primer paso solo si aun no tiene iglesia)
  const sinIglesia = !useIglesia() && !esPastor;
  const puntos: PuntoAyuda[] = [
    ...(sinIglesia
      ? [
          {
            icono: "key" as IconName,
            texto:
              "Primero únete a tu iglesia con el código que te da tu pastor (Perfil › Tengo un código).",
          },
        ]
      : []),
    {
      icono: "home",
      texto:
        "«Mi iglesia» es la sala de todos: avisos y oración de toda la iglesia.",
    },
    {
      icono: "people",
      texto:
        "Tu sala de grupo (jóvenes, varones, damas…) es solo para sus miembros. A otras salas se entra con su código.",
    },
    {
      icono: "comment-discussion",
      texto:
        "En cada sala hay chat, muro de oración y Palabra de la semana. En el muro pides oración y tu líder la revisa.",
    },
    {
      icono: "shield-check",
      texto:
        "Las salas las maneja el pastor o el administrador: crea salas nuevas, elige a su líder y decide qué tiene cada una.",
    },
    ...(esPastor || administra
      ? [
          {
            icono: "plus" as IconName,
            texto:
              "Tú puedes hacerlo desde tu Perfil › Nueva sala, y entras a todas sin código.",
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <BlurTargetView ref={objetivo} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: espacio }]}
          showsVerticalScrollIndicator={false}
        >
          <IglesiaView />
        </ScrollView>
      </BlurTargetView>

      {/* Ayuda de la seccion (solo la primera vez) */}
      <PopupAyuda
        id="comunidad"
        objetivo={objetivo}
        titulo="Comunidad"
        sub="tus salas para conversar y orar"
        icono="people"
        minis={["comment-discussion", "heart-fill", "home-fill"]}
        puntos={puntos}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING * 2,
  },
});

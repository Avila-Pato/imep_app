import {
  BORDER,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { IconName } from "@/types/typesCronogramas";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { BotonPrincipal, Paso, estilosPaso } from "./ui";

type Tema = {
  icono: IconName;
  tono: string;
  titulo: string;
  que: string; // que es y para que sirve
  donde: string[]; // camino dentro de la app
  pasos: string[]; // como se usa, paso a paso
  nota?: string;
};

// Guia del pastor: cada parte de la administracion explicada con detalle
const TEMAS: Tema[] = [
  {
    icono: "shield-check",
    tono: PRIMARY,
    titulo: "Tú administras la iglesia",
    que: "Como pastor tienes un panel para manejar todo: cronograma, anuncios, roles, salas y ubicación. No necesitas ir de pestaña en pestaña.",
    donde: ["Perfil", "Panel de administración"],
    pasos: [
      "Abre la pestaña Perfil (abajo a la derecha).",
      "Verás los números de tu iglesia: miembros, salas, peticiones por aprobar y turnos sin asignar.",
      "Debajo están los accesos rápidos: tócalos para administrar cada cosa desde ahí mismo.",
    ],
  },
  {
    icono: "person-add",
    tono: "#4C9AFF",
    titulo: "Invita a los hermanos",
    que: "Los hermanos entran a tu iglesia con un código de invitación. Sin código no ven nada de tu iglesia.",
    donde: ["Perfil", "Código de la iglesia"],
    pasos: [
      "En el panel copia o comparte el código general (por WhatsApp, por ejemplo).",
      "El hermano descarga la app y escribe el código al registrarse o en Perfil › Tengo un código.",
      "Cada sala tiene también su propio código: une a la iglesia y además a esa sala.",
      "Si un código se compartió de más, genera uno nuevo: el anterior deja de funcionar.",
    ],
  },
  {
    icono: "briefcase",
    tono: "#F5A524",
    titulo: "Roles y permisos",
    que: "No tienes que hacerlo todo tú. Dale un cargo a un hermano y podrá ayudarte con una parte de la administración.",
    donde: ["Perfil", "Roles y permisos"],
    pasos: [
      "Elige al hermano y asígnale un cargo.",
      "Secretario/a: cronograma, anuncios y también asignar roles.",
      "Coordinador/a de servicio: solo el cronograma.",
      "Comunicaciones: solo los anuncios.",
      "Líder de sala: guía a su grupo (ver más adelante).",
    ],
    nota: "Cada uno ve en su Perfil el mismo panel, pero solo con lo que le diste permiso.",
  },
  {
    icono: "calendar",
    tono: "#46A758",
    titulo: "El cronograma",
    que: "Quién sirve en cada culto: Palabra, Pasillo, Alabanza, Ofrenda, Puerta… Cada hermano ve sus turnos y recibe un recordatorio.",
    donde: ["Perfil", "Cronograma"],
    pasos: [
      "Elige el culto y toca la casilla que quieres llenar (por ejemplo, Palabra).",
      "Elige a un hermano registrado o escribe un nombre si todavía no usa la app.",
      "Ajusta la hora exacta del turno (por ejemplo, 18:09).",
      "¿Tu iglesia tiene algo más, como un Devocional? Agrega una casilla nueva.",
    ],
    nota: "También lo ves en la pestaña Anuncios, junto al próximo culto.",
  },
  {
    icono: "megaphone",
    tono: "#E54666",
    titulo: "Anuncios",
    que: "Avisos y eventos para toda la iglesia. Aparecen en la pestaña Anuncios de todos los hermanos.",
    donde: ["Perfil", "Nuevo anuncio"],
    pasos: [
      "Escribe un título y el texto del anuncio.",
      "Si quieres, agrega una imagen (o publica solo la imagen, como un afiche).",
      "Elige la fecha y la hora: siempre van, para que nadie se pierda.",
      "Para cambiarlo o borrarlo entra a Perfil › Anuncios.",
      "Después de cada culto sube la predicación (Perfil › Predicación): título, pasaje y un resumen. Sale en Biblia › Predicaciones.",
    ],
  },
  {
    icono: "comment-discussion",
    tono: "#8E4EC6",
    titulo: "Salas",
    que: "Espacios para cada grupo de la iglesia (jóvenes, varones, damas…). Tú decides quién la guía y qué tiene cada una.",
    donde: ["Perfil", "Nueva sala"],
    pasos: [
      "Ponle nombre, ícono y color, y elige a su líder.",
      "Elige qué tiene: chat, muro de oración y Palabra de la semana.",
      "Para cambiar algo después, entra a la sala y toca el engranaje ⚙.",
      "Tú entras a todas las salas; los hermanos, solo a la suya o con su código.",
    ],
    nota: "Todas las salas están en la pestaña Comunidad.",
  },
  {
    icono: "people",
    tono: "#12A594",
    titulo: "Los líderes de sala",
    que: "El líder (o tú) cuida su sala. Estas son sus herramientas dentro de la sala:",
    donde: ["Comunidad", "La sala"],
    pasos: [
      "Aprueba las peticiones de oración antes de que se vean en el muro.",
      "Manda avisos o devocionales con 📣: a todos les llega una notificación.",
      "Palabra de la semana: elige a unos hermanos y un día para cada uno; ese día les llega «te toca compartir tu palabra».",
      "Puede escribirle a un hermano en un chat privado desde Miembros.",
      "Si apagas el chat en la configuración de la sala (⚙), nadie puede escribir y se avisa que el chat está cerrado.",
    ],
  },
  {
    icono: "location",
    tono: "#4C9AFF",
    titulo: "Ubicación de la iglesia",
    que: "La dirección que pusiste antes. Los hermanos la ven en el mapa, arriba de Anuncios.",
    donde: ["Perfil", "Ubicación"],
    pasos: [
      "Cámbiala cuando quieras desde el panel.",
      "Los hermanos la verán al unirse con su código.",
    ],
    nota: "¿Quieres repasar esta guía? Perfil › Ver bienvenida.",
  },
];

// Solo el pastor: explica, tema por tema, como administrar la iglesia
export default function PasoGuiaPastor({ onSeguir }: { onSeguir: () => void }) {
  const [i, setI] = useState(0);
  const tema = TEMAS[i];
  const ultimo = i === TEMAS.length - 1;

  return (
    <Paso
      pie={
        <>
          {/* puntos de avance */}
          <View style={styles.puntos}>
            {TEMAS.map((t, k) => (
              <View
                key={t.titulo}
                style={[styles.punto, k === i && styles.puntoActivo]}
              />
            ))}
          </View>
          <BotonPrincipal
            texto={ultimo ? "Entendido" : "Siguiente"}
            onPress={() => (ultimo ? onSeguir() : setI(i + 1))}
          />
          <View style={styles.fila}>
            <Pressable
              onPress={() => setI(i - 1)}
              disabled={i === 0}
              hitSlop={10}
            >
              <Text style={[styles.enlace, i === 0 && styles.oculto]}>
                Anterior
              </Text>
            </Pressable>
            {!ultimo && (
              <Pressable onPress={onSeguir} hitSlop={10}>
                <Text style={styles.enlace}>Saltar guía</Text>
              </Pressable>
            )}
          </View>
        </>
      }
    >
      <Animated.View
        key={i}
        entering={FadeIn.duration(300)}
        style={styles.tema}
      >
        <Text style={estilosPaso.etiqueta}>
          GUÍA DEL PASTOR · {i + 1} DE {TEMAS.length}
        </Text>

        <View style={styles.cabecera}>
          <View style={[styles.icono, { backgroundColor: `${tema.tono}22` }]}>
            <Octicons name={tema.icono} size={26} color={tema.tono} />
          </View>
          <Text style={styles.titulo}>{tema.titulo}</Text>
        </View>

        <Text style={styles.que}>{tema.que}</Text>

        {/* donde esta */}
        <View style={styles.donde}>
          <Octicons name="location" size={12} color={MUTED} />
          <Text style={styles.dondeEtiqueta}>DÓNDE</Text>
          <Text style={styles.dondeTexto}>{tema.donde.join("  ›  ")}</Text>
        </View>

        {/* como se usa */}
        <View style={styles.pasos}>
          {tema.pasos.map((p, k) => (
            <Animated.View
              key={p}
              entering={FadeInDown.delay(80 + k * 70).duration(300)}
              style={styles.pasoFila}
            >
              <View style={[styles.numero, { borderColor: tema.tono }]}>
                <Text style={[styles.numeroTexto, { color: tema.tono }]}>
                  {k + 1}
                </Text>
              </View>
              <Text style={styles.pasoTexto}>{p}</Text>
            </Animated.View>
          ))}
        </View>

        {!!tema.nota && (
          <View style={styles.nota}>
            <Octicons name="info" size={13} color={MUTED} />
            <Text style={styles.notaTexto}>{tema.nota}</Text>
          </View>
        )}
      </Animated.View>
    </Paso>
  );
}

const styles = StyleSheet.create({
  tema: {
    gap: SPACING * 1.4,
  },
  cabecera: {
    gap: SPACING * 1.2,
  },
  icono: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 26,
    lineHeight: 32,
    color: TEXT,
  },
  que: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
    opacity: 0.85,
  },
  donde: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: SPACING * 1.2,
    paddingVertical: SPACING,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  dondeEtiqueta: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: MUTED,
  },
  dondeTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
  },
  pasos: {
    gap: SPACING * 1.1,
  },
  pasoFila: {
    flexDirection: "row",
    gap: SPACING * 1.1,
  },
  numero: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  numeroTexto: {
    fontSize: 12,
    fontWeight: "700",
  },
  pasoTexto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: TEXT,
  },
  nota: {
    flexDirection: "row",
    gap: 8,
    padding: SPACING * 1.2,
    borderRadius: 14,
    backgroundColor: SURFACE,
  },
  notaTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  puntos: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BORDER,
  },
  puntoActivo: {
    width: 18,
    backgroundColor: TEXT,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  enlace: {
    fontSize: 14,
    color: MUTED,
  },
  oculto: {
    opacity: 0,
  },
});

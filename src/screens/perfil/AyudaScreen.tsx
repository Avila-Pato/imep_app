import {
  BORDER,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  primarioAlfa,
} from "@/constants/constans";
import { IconName } from "@/types/typesCronogramas";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import PaginaInfo from "./PaginaInfo";

type Pregunta = { p: string; r: string };
type Tema = {
  id: string;
  titulo: string;
  icono: IconName;
  preguntas: Pregunta[];
};

// Preguntas frecuentes por tema (se abren tocando la pregunta)
const TEMAS: Tema[] = [
  {
    id: "inicio",
    titulo: "Primeros pasos",
    icono: "rocket",
    preguntas: [
      {
        p: "¿Cómo me uno a mi iglesia?",
        r: "Pídele a tu pastor el código de invitación. Luego ve a Perfil › Tengo un código y escríbelo. También puedes abrir el enlace que te compartan.",
      },
      {
        p: "Me uní, pero no veo «Mi iglesia» en Comunidad",
        r: "Revisa que el código sea el correcto y que siga vigente: si el pastor genera uno nuevo, el anterior deja de funcionar.",
      },
    ],
  },
  {
    id: "anuncios",
    titulo: "Anuncios y cronograma",
    icono: "megaphone",
    preguntas: [
      {
        p: "¿Dónde veo el próximo culto?",
        r: "En la pestaña Anuncios, arriba, junto al mapa de tu iglesia. Desde ahí también puedes abrir «Cómo llegar».",
      },
      {
        p: "¿Cómo sé si me toca servir?",
        r: "En Anuncios › Cronograma ves quién sirve en cada culto, y en tu Perfil aparecen tus próximos turnos. El día anterior te llega un recordatorio.",
      },
    ],
  },
  {
    id: "comunidad",
    titulo: "Salas y oración",
    icono: "people",
    preguntas: [
      {
        p: "¿Cómo pido oración?",
        r: "Entra a tu sala, abre el Muro de oración y toca «Pedir oración». Tu líder la revisa antes de que se vea en el muro.",
      },
      {
        p: "¿Qué es la Palabra de la semana?",
        r: "Tu líder elige a algunos hermanos y un día para cada uno. Ese día recibes un aviso para compartir un versículo y lo que entendiste en el chat de la sala.",
      },
      {
        p: "¿Puedo compartir un versículo en el chat?",
        r: "Sí. En el chat toca el libro 📖, elige el versículo y escribe lo que entendiste.",
      },
    ],
  },
  {
    id: "biblia",
    titulo: "Biblia",
    icono: "book",
    preguntas: [
      {
        p: "¿Qué es «Versículo por versículo»?",
        r: "Una forma de leer de a un versículo por pantalla. Desliza hacia arriba para avanzar y da doble toque para marcar «me gusta».",
      },
      {
        p: "¿Dónde quedan mis «me gusta» y guardados?",
        r: "En tu Perfil, en «Mis me gusta» y en «Versículos y oraciones».",
      },
      {
        p: "La letra es muy chica o muy grande",
        r: "Usa el control A− / A+ arriba de la lectura. También puedes cambiar el tipo de letra en Perfil › Editar perfil.",
      },
    ],
  },
  {
    id: "perfil",
    titulo: "Perfil y apariencia",
    icono: "person",
    preguntas: [
      {
        p: "¿Cómo cambio mi foto, portada o colores?",
        r: "En Perfil › Editar perfil puedes elegir avatar, portada, color de la app, fondo claro u oscuro y tipo de letra. Al cambiar los colores, la app se recarga unos segundos.",
      },
      {
        p: "No me llegan las notificaciones",
        r: "Revisa Perfil › Notificaciones y que el permiso esté activado en los ajustes de tu teléfono.",
      },
    ],
  },
  {
    id: "lideres",
    titulo: "Pastores y administradores",
    icono: "shield-check",
    preguntas: [
      {
        p: "¿Dónde administro la iglesia?",
        r: "En tu Perfil, en el Panel de administración: cronograma, anuncios, predicaciones, roles, salas, ubicación y códigos de invitación.",
      },
      {
        p: "¿Cómo doy permisos a otra persona?",
        r: "En Perfil › Roles y permisos, asigna un cargo: Secretario/a, Coordinador/a de servicio, Comunicaciones o Líder de sala.",
      },
    ],
  },
];

export default function AyudaScreen() {
  // pregunta abierta ("tema-indice")
  const [abierta, setAbierta] = useState<string | null>(null);

  return (
    <PaginaInfo
      titulo="Ayuda"
      etiqueta="CENTRO DE AYUDA"
      bajada="Respuestas rápidas a lo más común. Toca una pregunta para ver la respuesta."
    >
      {TEMAS.map((t) => (
        <View key={t.id} style={styles.tema}>
          <View style={styles.temaCabecera}>
            <View style={styles.temaIcono}>
              <Octicons name={t.icono} size={15} color={PRIMARY} />
            </View>
            <Text style={styles.temaTitulo}>{t.titulo}</Text>
          </View>
          <View style={styles.tarjeta}>
            {t.preguntas.map((q, i) => {
              const id = `${t.id}-${i}`;
              const abiertaAqui = abierta === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setAbierta(abiertaAqui ? null : id)}
                  style={[styles.pregunta, i > 0 && styles.conLinea]}
                  accessibilityState={{ expanded: abiertaAqui }}
                >
                  <View style={styles.preguntaFila}>
                    <Text style={styles.preguntaTexto}>{q.p}</Text>
                    <Octicons
                      name={abiertaAqui ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={MUTED}
                    />
                  </View>
                  {abiertaAqui && (
                    <Animated.Text
                      entering={FadeIn.duration(200)}
                      style={styles.respuesta}
                    >
                      {q.r}
                    </Animated.Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {/* Accesos utiles */}
      <View style={styles.accesos}>
        <Acceso
          icono="lock"
          texto="Política de privacidad"
          onPress={() => router.push("/privacidad" as Href)}
        />
      </View>

      <View style={styles.contacto}>
        <Octicons name="comment-discussion" size={18} color={TEXT} />
        <View style={styles.flex}>
          <Text style={styles.contactoTitulo}>
            ¿No encontraste tu respuesta?
          </Text>
          <Text style={styles.contactoTexto}>
            Habla con el pastor o el administrador de tu iglesia: ellos pueden
            ayudarte con tu cuenta, tus salas y tus turnos.
          </Text>
        </View>
      </View>
    </PaginaInfo>
  );
}

function Acceso({
  icono,
  texto,
  onPress,
}: {
  icono: IconName;
  texto: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.acceso, pressed && styles.presionado]}
    >
      <Octicons name={icono} size={15} color={TEXT} />
      <Text style={styles.accesoTexto}>{texto}</Text>
      <Octicons name="chevron-right" size={14} color={MUTED} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  tema: {
    gap: SPACING,
    marginTop: SPACING,
  },
  temaCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  temaIcono: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primarioAlfa(0.14),
  },
  temaTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 16,
    color: TEXT,
  },
  tarjeta: {
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  pregunta: {
    gap: SPACING,
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: SPACING * 1.3,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  preguntaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  preguntaTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },
  respuesta: {
    fontSize: 14,
    lineHeight: 21,
    color: MUTED,
  },
  accesos: {
    gap: SPACING,
    marginTop: SPACING * 2,
  },
  acceso: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: SURFACE,
  },
  accesoTexto: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
  },
  contacto: {
    flexDirection: "row",
    gap: SPACING * 1.2,
    marginTop: SPACING,
    padding: SPACING * 1.6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  contactoTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  contactoTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    marginTop: 4,
  },
});

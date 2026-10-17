import { ESTUDIOS_SALA } from "@/assets/data/comunidadMocks";
import { PREGUNTAS } from "@/assets/data/oracionesMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  MESES_CORTOS,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { usePasaje } from "@/hooks/usePasaje";
import { guardarEstudio, publicar, useEstudios } from "@/store/estudios";
import { Grupo } from "@/types/typesComunidad";
import { partirTitulo } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import PasajeTexto from "./PasajeTexto";

// "2026-10-12" -> "12 OCT"
const fechaCorta = (key: string) => {
  const [, m, d] = key.split("-").map(Number);
  return `${d} ${MESES_CORTOS[m - 1]}`.toUpperCase();
};

type Props = {
  sala: Grupo; // la sala de la persona segun su rol
};

// Estudio de la semana de la sala: todos estudian el mismo pasaje
// y cada uno comparte lo que entendio en el muro de su sala
export default function EstudioSalaView({ sala }: Props) {
  const estudio = ESTUDIOS_SALA.filter((e) => e.grupo === sala.id).sort(
    (a, b) => b.semana.localeCompare(a.semana),
  )[0];
  const { guardados, publicaciones } = useEstudios();
  const idGuardado = `sala-${estudio?.id}`;
  const previo = guardados.find((e) => e.id === idGuardado);
  const [respuestas, setRespuestas] = useState<Record<string, string>>(
    previo?.respuestas ?? {},
  );
  const pasaje = usePasaje(estudio?.cita ?? "");

  if (!estudio) {
    return (
      <View style={styles.vacio}>
        <Octicons name="book" size={22} color={MUTED} />
        <Text style={styles.vacioTexto}>
          {sala.label} aún no tiene estudio esta semana
        </Text>
      </View>
    );
  }

  const { inicio, final } = partirTitulo(estudio.titulo);
  // Lo que se comparte: lo que me dice a mi, o si no, lo que dice el texto
  const texto = (
    respuestas.significa ||
    respuestas.dice ||
    respuestas.oracion ||
    ""
  ).trim();
  const compartido = publicaciones.some((p) => p.id === `p-${idGuardado}`);

  const compartir = () => {
    if (!texto) return;
    const fecha = new Date().toISOString();
    guardarEstudio({
      id: idGuardado,
      cita: estudio.cita,
      respuestas,
      fecha,
      compartido: true,
    });
    publicar({
      id: `p-${idGuardado}`,
      autor: USUARIO.nombre,
      grupo: sala.id,
      cita: estudio.cita,
      mostrarCita: true,
      texto,
      fecha,
      orando: 0,
    });
    router.push(`/sala/${sala.id}?vista=oracion` as Href);
  };

  return (
    <View style={styles.contenedor}>
      {/* Encabezado */}
      <View style={styles.card}>
        <View style={styles.etiquetas}>
          <Text style={styles.chip}>{sala.label.toUpperCase()}</Text>
          <Text style={styles.meta}>
            SEMANA DEL {fechaCorta(estudio.semana)}
          </Text>
        </View>
        <Text style={styles.titulo}>
          {inicio}
          <Text style={styles.cursiva}>{final}</Text>
        </Text>
        <Text style={styles.guia}>Guía: {estudio.guia}</Text>
      </View>

      {/* Pasaje */}
      <View>
        <Text style={styles.seccion}>PASAJE</Text>
        <View style={styles.card}>
          <PasajeTexto
            cita={estudio.cita}
            versos={pasaje.versos}
            cargando={pasaje.cargando}
            error={pasaje.error}
          />
        </View>
      </View>

      {/* Preguntas */}
      <View style={styles.preguntas}>
        <Text style={styles.seccion}>LO QUE ENTENDÍ</Text>
        {PREGUNTAS.map((q, i) => (
          <View key={q.id} style={styles.card}>
            <View style={styles.preguntaCabecera}>
              <Text style={styles.numero}>
                {String(i + 1).padStart(2, "0")}
              </Text>
              <View style={styles.flex}>
                <Text style={styles.preguntaTitulo}>{q.titulo}</Text>
                <Text style={styles.preguntaAyuda}>{q.ayuda}</Text>
              </View>
            </View>
            <TextInput
              value={respuestas[q.id] ?? ""}
              onChangeText={(txt) =>
                setRespuestas((r) => ({ ...r, [q.id]: txt }))
              }
              placeholder="Escribe aquí…"
              placeholderTextColor="#555555"
              multiline
              style={styles.inputRespuesta}
            />
          </View>
        ))}
      </View>

      {/* Compartir en el muro de la sala */}
      <View style={[styles.card, styles.compartirCard]}>
        <View>
          <Text style={styles.compartirTitulo}>Comparte con {sala.label}</Text>
          <Text style={styles.compartirSub}>
            Lo que entendiste se verá en el muro de {sala.label} junto al
            pasaje. Estará visible por 24 horas.
          </Text>
        </View>
        <Pressable
          onPress={compartir}
          disabled={!texto || compartido}
          style={({ pressed }) => [
            styles.boton,
            (!texto || compartido) && styles.botonDeshabilitado,
            pressed && styles.presionado,
          ]}
        >
          <Text style={styles.botonTexto}>
            {compartido ? "Compartido ✓" : `Publicar en ${sala.label}`}
          </Text>
        </Pressable>
        {!texto && (
          <Text style={styles.aviso}>
            Escribe al menos una respuesta para compartir
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING * 2,
    paddingTop: SPACING,
  },
  flex: {
    flex: 1,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING,
  },
  card: {
    padding: SPACING * 1.6,
    gap: SPACING * 1.4,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  presionado: {
    opacity: 0.6,
  },

  // Encabezado
  etiquetas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chip: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    color: TEXT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: "hidden",
  },
  meta: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: MUTED,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 28,
    lineHeight: 34,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  guia: {
    fontSize: 13,
    color: MUTED,
    paddingTop: SPACING * 1.2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },

  // Preguntas
  preguntas: {
    gap: SPACING,
  },
  preguntaCabecera: {
    flexDirection: "row",
    gap: SPACING,
  },
  numero: {
    fontFamily: SERIF,
    fontSize: 16,
    color: MUTED,
  },
  preguntaTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
  preguntaAyuda: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  inputRespuesta: {
    minHeight: 70,
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
    textAlignVertical: "top",
    paddingTop: SPACING,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },

  // Compartir
  compartirCard: {
    gap: SPACING * 1.6,
    borderColor: "#3A3A3A",
  },
  compartirTitulo: {
    fontFamily: SERIF,
    fontSize: 21,
    color: TEXT,
  },
  compartirSub: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    marginTop: 4,
  },
  boton: {
    alignItems: "center",
    paddingVertical: SPACING * 1.4,
    borderRadius: 999,
    backgroundColor: TEXT,
  },
  botonDeshabilitado: {
    opacity: 0.4,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: "#121212",
  },
  aviso: {
    marginTop: -SPACING / 2,
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },

  vacio: {
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING * 3,
  },
  vacioTexto: {
    fontSize: 13,
    color: MUTED,
  },
});

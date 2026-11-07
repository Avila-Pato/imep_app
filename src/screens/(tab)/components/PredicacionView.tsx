import {
  BORDER,
  DARK_BG,
  MESES_CORTOS,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { USUARIO } from "@/assets/data/perfilMocks";
import { usePasaje } from "@/hooks/usePasaje";
import ModalFormPredicacion from "@/screens/predicacion/ModalFormPredicacion";
import {
  borrarPredicacion,
  useEstudios,
  usePredicaciones,
  usePuede,
} from "@/store/estudios";
import { Predicacion } from "@/types/typesOraciones";
import { confirmar } from "@/utils/confirmar";
import { iniciales, partirTitulo } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import PasajeTexto from "./PasajeTexto";

const deKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// "2026-10-13" -> "MAR 13 OCT"
export const fechaCorta = (key: string) => {
  const f = deKey(key);
  const dia = f
    .toLocaleDateString("es-ES", { weekday: "short" })
    .replace(".", "");
  return `${dia} ${f.getDate()} ${MESES_CORTOS[f.getMonth()]}`.toUpperCase();
};

export default function PredicacionView({ inicialId }: { inicialId?: string }) {
  const lista = usePredicaciones();
  // el pastor (o quien publica anuncios) sube, edita y borra
  const puede = usePuede("anuncios");
  const { nombre } = useEstudios();
  const [actualId, setActualId] = useState(inicialId);
  // null = cerrado; undefined dentro del objeto = nueva
  const [form, setForm] = useState<{ p?: Predicacion } | null>(null);
  const actual = lista.find((p) => p.id === actualId) ?? lista[0];
  const pasaje = usePasaje(actual?.cita ?? "");

  const formulario = form && (
    <ModalFormPredicacion
      predicacion={form.p}
      predicador={nombre ?? USUARIO.nombre}
      onCerrar={() => setForm(null)}
    />
  );

  if (!actual) {
    return (
      <View style={styles.vacio}>
        <Octicons name="book" size={22} color={MUTED} />
        <Text style={styles.vacioTexto}>Aún no hay predicaciones</Text>
        {puede && (
          <Pressable
            onPress={() => setForm({})}
            style={({ pressed }) => [
              styles.nueva,
              pressed && styles.presionado,
            ]}
          >
            <Octicons name="plus" size={14} color={DARK_BG} />
            <Text style={styles.nuevaTexto}>Subir la primera</Text>
          </Pressable>
        )}
        {formulario}
      </View>
    );
  }

  const anteriores = lista.filter((p) => p.id !== actual.id);
  const { inicio, final } = partirTitulo(actual.titulo);
  const esUltima = actual.id === lista[0]?.id;

  return (
    <View style={styles.contenedor}>
      {/* Encabezado */}
      <View style={styles.card}>
        <View style={styles.etiquetas}>
          <Text style={styles.chip}>
            {esUltima ? "ÚLTIMA PREDICACIÓN" : "PREDICACIÓN"}
          </Text>
          <Text style={styles.meta}>{fechaCorta(actual.fecha)}</Text>
        </View>

        <Text style={styles.titulo}>
          {inicio}
          <Text style={styles.cursiva}>{final}</Text>
        </Text>

        <View style={styles.predicador}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>
              {iniciales(actual.predicador)}
            </Text>
          </View>
          <View>
            <Text style={styles.predicadorNombre}>{actual.predicador}</Text>
            <Text style={styles.predicadorRol}>{actual.culto}</Text>
          </View>
        </View>
      </View>

      {/* Pastor / admin: subir otra, editar o borrar esta */}
      {puede && (
        <View style={styles.acciones}>
          <Pressable
            onPress={() => setForm({})}
            style={({ pressed }) => [
              styles.nueva,
              pressed && styles.presionado,
            ]}
          >
            <Octicons name="plus" size={14} color={DARK_BG} />
            <Text style={styles.nuevaTexto}>Nueva</Text>
          </Pressable>
          <Pressable
            onPress={() => setForm({ p: actual })}
            style={({ pressed }) => [
              styles.accion,
              pressed && styles.presionado,
            ]}
          >
            <Octicons name="pencil" size={14} color={TEXT} />
            <Text style={styles.accionTexto}>Editar</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              confirmar(
                "Borrar predicación",
                `Se quitará «${actual.titulo}» para todos.`,
                "Borrar",
                () => {
                  borrarPredicacion(actual.id);
                  setActualId(undefined);
                },
              )
            }
            style={({ pressed }) => [
              styles.accion,
              pressed && styles.presionado,
            ]}
            accessibilityLabel="Borrar predicación"
          >
            <Octicons name="trash" size={14} color={TEXT} />
          </Pressable>
        </View>
      )}

      {/* Resumen que escribio el pastor */}
      {!!actual.resumen && (
        <View>
          <Text style={styles.seccion}>RESUMEN</Text>
          <View style={styles.card}>
            <Text style={styles.resumen}>{actual.resumen}</Text>
          </View>
        </View>
      )}

      {/* Pasaje (desde la API de la Biblia) */}
      <View>
        <Text style={styles.seccion}>PASAJE</Text>
        <View style={styles.card}>
          <PasajeTexto
            cita={actual.cita}
            versos={pasaje.versos}
            cargando={pasaje.cargando}
            error={pasaje.error}
          />
        </View>
      </View>

      {/* Anteriores */}
      {anteriores.length > 0 && (
        <View>
          <Text style={styles.seccion}>ANTERIORES</Text>
          <View style={[styles.card, styles.cardLista]}>
            {anteriores.map((p, i) => {
              const f = deKey(p.fecha);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setActualId(p.id)}
                  style={({ pressed }) => [
                    styles.fila,
                    i > 0 && styles.conLinea,
                    pressed && styles.presionado,
                  ]}
                >
                  <View style={styles.fecha}>
                    <Text style={styles.fechaDia}>{f.getDate()}</Text>
                    <Text style={styles.fechaMes}>
                      {MESES_CORTOS[f.getMonth()]}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.filaTitulo} numberOfLines={1}>
                      {p.titulo}
                    </Text>
                    <Text style={styles.filaSub} numberOfLines={1}>
                      {p.predicador} · {p.cita}
                    </Text>
                  </View>
                  <Octicons name="chevron-right" size={16} color={MUTED} />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
      {formulario}
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
  cardLista: {
    paddingVertical: SPACING / 2,
    gap: 0,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
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
  predicador: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingTop: SPACING * 1.2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  avatarTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: TEXT,
  },
  predicadorNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },
  predicadorRol: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },

  // Anteriores
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
  },
  fecha: {
    width: 40,
    alignItems: "center",
  },
  fechaDia: {
    fontFamily: SERIF,
    fontSize: 20,
    color: TEXT,
  },
  fechaMes: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: MUTED,
  },
  filaTitulo: {
    fontFamily: SERIF,
    fontSize: 16,
    color: TEXT,
  },
  filaSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  acciones: {
    flexDirection: "row",
    gap: SPACING,
    marginTop: -SPACING,
  },
  nueva: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 12,
    backgroundColor: TEXT,
  },
  nuevaTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK_BG,
  },
  accion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  accionTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
  resumen: {
    fontSize: 15,
    lineHeight: 23,
    color: TEXT,
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

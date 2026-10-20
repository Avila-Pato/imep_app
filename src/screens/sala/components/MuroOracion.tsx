import { PUBLICACIONES } from "@/assets/data/comunidadMocks";
import {
  BORDER,
  FUENTE,
  GRUPOS,
  MUTED,
  NOTA_TINTA,
  NOTAS_COLORES,
  PRIMARY,
  SERIF,
  SPACING,
  TEXT,
} from "@/constants/constans";
import { alternarOrando, useEstudios } from "@/store/estudios";
import { GrupoId, Publicacion } from "@/types/typesComunidad";
import {
  enMuro,
  estadoPeticion,
  inicioPeticion,
  puedeVerSala,
} from "@/utils/peticiones";
import { tiempoRestante } from "@/utils/tiempo";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Inclinacion de cada papelito (se repite) para que no se vean alineados
const GIROS = ["-2deg", "1.5deg", "-1deg", "2deg", "-1.5deg", "1deg"];

// Lineas visibles en el papelito; el resto se lee al abrirlo
const LINEAS_NOTA = 6;

type Props = {
  grupo?: GrupoId; // con grupo: solo esa sala; sin grupo: todas
};

// Muro de peticiones de oracion, como papelitos pegados en una pared
export default function MuroOracion({ grupo }: Props) {
  const { publicaciones, orando, revisiones, grupo: miGrupo } = useEstudios();
  const [abiertaId, setAbiertaId] = useState<string | null>(null);

  // las publicaciones antiguas sin sala cuentan como "Iglesia"
  const todas = [...publicaciones, ...PUBLICACIONES].filter(
    (p) =>
      puedeVerSala(p.grupo ?? "general", miGrupo) &&
      (!grupo || (p.grupo ?? "general") === grupo),
  );

  // Solo las aprobadas por el lider y dentro de las 24 horas
  const muro = todas
    .filter((p) => enMuro(p, revisiones))
    .sort((a, b) =>
      inicioPeticion(b, revisiones).localeCompare(
        inicioPeticion(a, revisiones),
      ),
    );

  // Mis peticiones que aun esperan aprobacion
  const misPendientes = publicaciones.filter(
    (p) =>
      estadoPeticion(p, revisiones) === "pendiente" &&
      (!grupo || p.grupo === grupo),
  ).length;

  const abierta = muro.find((p) => p.id === abiertaId);

  // Dos columnas alternadas (tipo "masonry")
  const izquierda = muro.filter((_, i) => i % 2 === 0);
  const derecha = muro.filter((_, i) => i % 2 === 1);

  const salaDe = (p: Publicacion) =>
    GRUPOS.find((g) => g.id === (p.grupo ?? "general"));
  const colorDe = (p: Publicacion) =>
    NOTAS_COLORES[muro.indexOf(p) % NOTAS_COLORES.length];

  // Boton de "estoy orando" (corazon)
  const corazon = (p: Publicacion, grande?: boolean) => {
    const marcado = orando.includes(p.id);
    const total = p.orando + (marcado ? 1 : 0);
    return (
      <Pressable
        onPress={() => alternarOrando(p.id)}
        hitSlop={10}
        style={({ pressed }) => [
          styles.orar,
          grande && styles.orarGrande,
          marcado && styles.orarActivo,
          pressed && styles.presionado,
        ]}
        accessibilityLabel={marcado ? "Dejar de orar" : "Estoy orando"}
      >
        <Octicons
          name={marcado ? "heart-fill" : "heart"}
          size={grande ? 14 : 11}
          color={PRIMARY}
        />
        <Text style={[styles.orarTexto, grande && styles.orarTextoGrande]}>
          {grande ? `${total} orando` : total}
        </Text>
      </Pressable>
    );
  };

  const nota = (p: Publicacion, i: number) => {
    const propia = publicaciones.some((x) => x.id === p.id);
    const sala = salaDe(p);
    // el indice global decide color e inclinacion
    const n = muro.indexOf(p);
    return (
      <Pressable
        key={p.id}
        onPress={() => setAbiertaId(p.id)}
        style={[
          styles.nota,
          {
            backgroundColor: colorDe(p),
            transform: [{ rotate: GIROS[n % GIROS.length] }],
            marginTop: i === 0 ? SPACING * 1.4 : SPACING * 2.2,
          },
        ]}
        accessibilityHint="Abre la petición completa"
      >
        {/* Cinta adhesiva */}
        <View
          style={[
            styles.cinta,
            { transform: [{ rotate: n % 2 ? "4deg" : "-4deg" }] },
          ]}
        />

        {p.mostrarCita && !!p.cita && (
          <Text style={styles.citaNota}>{p.cita.toUpperCase()}</Text>
        )}
        <Text style={styles.texto} numberOfLines={LINEAS_NOTA}>
          {p.texto}
        </Text>
        <Text style={styles.restante}>
          {tiempoRestante(inicioPeticion(p, revisiones))}
        </Text>

        <View style={styles.pie}>
          <Text style={styles.autor} numberOfLines={1}>
            {propia ? "Tú" : p.autor.split(" ")[0]}
            {!grupo && sala && ` · ${sala.label}`}
          </Text>
          {corazon(p)}
        </View>
      </Pressable>
    );
  };

  return (
    <View>
      {/* Encabezado del muro */}
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>
          Oramos <Text style={styles.cursiva}>unos por otros</Text>
        </Text>
        <Text style={styles.subtitulo}>
          Toca una petición para leerla · Cada una dura 24 horas
        </Text>
      </View>

      {/* Mis peticiones en espera */}
      {misPendientes > 0 && (
        <View style={styles.espera}>
          <Octicons name="clock" size={14} color={MUTED} />
          <Text style={styles.esperaTexto}>
            {misPendientes === 1
              ? "Tu petición espera la aprobación del líder"
              : `${misPendientes} peticiones tuyas esperan aprobación`}
          </Text>
        </View>
      )}

      {muro.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTexto}>
            Aún no hay peticiones en el muro.
          </Text>
          <Pressable
            onPress={() => router.navigate("/oraciones" as Href)}
            hitSlop={8}
          >
            <Text style={styles.vacioLink}>Pedir oración →</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.columnas}>
          <View style={styles.columna}>{izquierda.map(nota)}</View>
          <View style={[styles.columna, styles.columnaDerecha]}>
            {derecha.map(nota)}
          </View>
        </View>
      )}

      {/* Peticion abierta en grande */}
      <Modal
        visible={!!abierta}
        transparent
        animationType="fade"
        onRequestClose={() => setAbiertaId(null)}
        statusBarTranslucent
      >
        <Pressable style={styles.fondo} onPress={() => setAbiertaId(null)}>
          {abierta && (
            <Pressable
              onPress={() => {}}
              style={[styles.notaGrande, { backgroundColor: colorDe(abierta) }]}
            >
              <View style={styles.cinta} />
              <ScrollView
                style={styles.notaGrandeScroll}
                contentContainerStyle={styles.notaGrandeContenido}
                showsVerticalScrollIndicator={false}
              >
                {abierta.mostrarCita && !!abierta.cita && (
                  <Text style={styles.citaNota}>
                    {abierta.cita.toUpperCase()}
                  </Text>
                )}
                <Text style={styles.textoGrande}>{abierta.texto}</Text>
              </ScrollView>
              <Text style={styles.restante}>
                {tiempoRestante(inicioPeticion(abierta, revisiones))}
              </Text>
              <View style={styles.pie}>
                <Text style={styles.autorGrande} numberOfLines={1}>
                  {publicaciones.some((x) => x.id === abierta.id)
                    ? "Tú"
                    : abierta.autor}
                  {` · ${salaDe(abierta)?.label}`}
                </Text>
                {corazon(abierta, true)}
              </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    alignItems: "center",
    gap: 4,
    paddingTop: SPACING,
    paddingBottom: SPACING,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 26,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  subtitulo: {
    fontSize: 12,
    color: MUTED,
  },

  // Aviso de mis peticiones en espera
  espera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: SPACING,
    marginTop: SPACING,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  esperaTexto: {
    fontSize: 13,
    color: MUTED,
  },

  // Columnas
  columnas: {
    flexDirection: "row",
    gap: SPACING * 1.4,
  },
  columna: {
    flex: 1,
  },
  columnaDerecha: {
    marginTop: SPACING * 2.4, // desfase para que se vea desordenado
  },

  // Papelito
  nota: {
    padding: SPACING * 1.2,
    paddingTop: SPACING * 1.8,
    borderRadius: 3,
    gap: SPACING,
    // sombra suave, como papel pegado
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cinta: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    width: 46,
    height: 16,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  texto: {
    fontFamily: FUENTE.mano,
    fontSize: 19,
    lineHeight: 23,
    color: NOTA_TINTA,
  },
  pie: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  citaNota: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(42,42,42,0.65)",
  },
  restante: {
    fontSize: 10,
    letterSpacing: 0.4,
    color: "rgba(42,42,42,0.5)",
    marginTop: -4,
  },
  autor: {
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "rgba(42,42,42,0.6)",
  },
  orar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(42,42,42,0.35)",
  },
  orarGrande: {
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  orarActivo: {
    backgroundColor: "rgba(229, 72, 77, 0.12)",
    borderColor: PRIMARY,
  },
  presionado: {
    opacity: 0.6,
  },
  orarTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: NOTA_TINTA,
  },
  orarTextoGrande: {
    fontSize: 13,
  },

  // Papelito abierto (modal)
  fondo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING * 2.4,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  notaGrande: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "75%",
    gap: SPACING * 1.2,
    padding: SPACING * 2,
    paddingTop: SPACING * 2.6,
    borderRadius: 4,
    transform: [{ rotate: "-1deg" }],
  },
  notaGrandeScroll: {
    flexGrow: 0,
  },
  notaGrandeContenido: {
    gap: SPACING,
  },
  textoGrande: {
    fontFamily: FUENTE.mano,
    fontSize: 26,
    lineHeight: 32,
    color: NOTA_TINTA,
  },
  autorGrande: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "rgba(42,42,42,0.7)",
  },

  vacio: {
    alignItems: "center",
    gap: 6,
    paddingVertical: SPACING * 4,
  },
  vacioTexto: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
  },
  vacioLink: {
    marginTop: SPACING,
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
});

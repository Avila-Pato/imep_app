import { ANUNCIOS } from "@/assets/data/anunciosMocks";
import {
  BORDER,
  CATEGORIAS,
  DARK_BG,
  HOME_PADDING as PADDING,
  MESES_CORTOS,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { Anuncio, CategoriaId } from "@/types/typesAnuncios";
import { proximoCulto } from "@/utils/cultos";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CronogramaView from "./components/CronogramaView";
import ModalAnuncio from "./components/ModalAnuncio";
import TabsSuperiores from "./components/TabsSuperiores";

type Filtro = "todos" | CategoriaId;
type Vista = "anuncios" | "cronograma";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "anuncios", label: "Anuncios" },
  { id: "cronograma", label: "Cronograma" },
];

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  ...(Object.keys(CATEGORIAS) as CategoriaId[]).map((id) => ({
    id,
    label: CATEGORIAS[id].label,
  })),
];

// "YYYY-MM-DD" de hoy + N dias (hora local)
const pad = (n: number) => String(n).padStart(2, "0");
const diaKey = (n = 0) => {
  const f = new Date();
  f.setDate(f.getDate() + n);
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
};
const HOY = diaKey();
const EN_UNA_SEMANA = diaKey(7);

const deKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Proximo culto segun el horario que configura el lider
const CULTO = proximoCulto();
const FECHA_CULTO = CULTO?.fecha.toLocaleDateString("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

// Lo que viene, por fecha (lo pasado ya no se muestra)
const PROXIMOS = ANUNCIOS.filter((a) => a.fecha >= HOY).sort((a, b) =>
  a.fecha.localeCompare(b.fecha),
);

// Una fila: fecha a la izquierda, texto a la derecha
function Fila({
  a,
  primera,
  onAbrir,
}: {
  a: Anuncio;
  primera: boolean;
  onAbrir: () => void;
}) {
  const f = deKey(a.fecha);
  const dia = f
    .toLocaleDateString("es-ES", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  const meta = [a.hora && `${a.hora} hrs`, a.lugar].filter(Boolean).join(" · ");
  return (
    <Pressable
      onPress={onAbrir}
      style={({ pressed }) => [
        styles.fila,
        !primera && styles.conLinea,
        pressed && styles.presionado,
      ]}
    >
      <View style={styles.fecha}>
        <Text style={styles.fechaDiaSemana}>{dia}</Text>
        <Text style={styles.fechaNumero}>{f.getDate()}</Text>
        <Text style={styles.fechaMes}>{MESES_CORTOS[f.getMonth()]}</Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.categoria}>
          <Octicons
            name={CATEGORIAS[a.categoria].icon}
            size={11}
            color={MUTED}
          />
          <Text style={styles.categoriaTexto}>
            {CATEGORIAS[a.categoria].label.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.titulo}>{a.titulo}</Text>
        <Text style={styles.descripcion}>{a.descripcion}</Text>
        {!!meta && <Text style={styles.meta}>{meta}</Text>}
      </View>
      <Octicons
        name="chevron-right"
        size={16}
        color={MUTED}
        style={styles.flecha}
      />
    </Pressable>
  );
}

export default function EventosScreen() {
  const [vista, setVista] = useState<Vista>("anuncios");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [abierto, setAbierto] = useState<Anuncio | null>(null);

  const visibles = PROXIMOS.filter(
    (a) => filtro === "todos" || a.categoria === filtro,
  );
  const secciones = [
    {
      titulo: "ESTA SEMANA",
      lista: visibles.filter((a) => a.fecha < EN_UNA_SEMANA),
    },
    {
      titulo: "PRÓXIMAMENTE",
      lista: visibles.filter((a) => a.fecha >= EN_UNA_SEMANA),
    },
  ].filter((s) => s.lista.length > 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TabsSuperiores opciones={VISTAS} activo={vista} onCambiar={setVista} />

      {vista === "cronograma" ? (
        <CronogramaView />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Proximo culto (horario configurado por el lider) */}
          {CULTO && (
            <View style={styles.culto}>
              <View style={styles.cultoIcono}>
                <Octicons name="bell" size={16} color={DARK_BG} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.cultoEtiqueta}>PRÓXIMO CULTO</Text>
                <Text style={styles.cultoTitulo}>
                  {CULTO.cuando} · {CULTO.horario.hora} hrs
                </Text>
                <Text style={styles.cultoFecha}>
                  {CULTO.horario.nombre ?? FECHA_CULTO}
                </Text>
              </View>
            </View>
          )}

          {/* Filtros */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtros}
            contentContainerStyle={styles.filtrosContent}
          >
            {FILTROS.map((f) => {
              const activo = f.id === filtro;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFiltro(f.id)}
                  style={[styles.filtro, activo && styles.filtroActivo]}
                >
                  <Text
                    style={[
                      styles.filtroTexto,
                      activo && styles.filtroTextoActivo,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Anuncios agrupados por cuando ocurren */}
          {secciones.length === 0 ? (
            <View style={styles.vacio}>
              <Octicons name="inbox" size={22} color={MUTED} />
              <Text style={styles.vacioTexto}>
                No hay anuncios próximos en esta categoría
              </Text>
            </View>
          ) : (
            secciones.map((s) => (
              <View key={s.titulo}>
                <Text style={styles.seccion}>{s.titulo}</Text>
                <View style={styles.card}>
                  {s.lista.map((a, i) => (
                    <Fila
                      key={a.id}
                      a={a}
                      primera={i === 0}
                      onAbrir={() => setAbierto(a)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <ModalAnuncio anuncio={abierto} onCerrar={() => setAbierto(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
    paddingBottom: 120, // espacio para el tabbar flotante
    gap: SPACING * 1.6,
  },
  flex: {
    flex: 1,
  },

  // Proximo culto
  culto: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  cultoIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  cultoEtiqueta: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: MUTED,
  },
  cultoTitulo: {
    fontFamily: SERIF,
    fontSize: 20,
    color: TEXT,
    marginTop: 2,
  },
  cultoFecha: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },

  // Filtros
  filtros: {
    // los chips llegan hasta los bordes de la pantalla
    marginHorizontal: -PADDING,
  },
  filtrosContent: {
    paddingHorizontal: PADDING,
    gap: 8,
  },
  filtro: {
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  filtroActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  filtroTexto: {
    fontSize: 13,
    fontWeight: "500",
    color: MUTED,
  },
  filtroTextoActivo: {
    color: DARK_BG,
    fontWeight: "600",
  },

  // Secciones
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING,
  },
  card: {
    paddingHorizontal: SPACING * 1.6,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  presionado: {
    opacity: 0.6,
  },
  flecha: {
    alignSelf: "center",
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },

  // Fila
  fila: {
    flexDirection: "row",
    gap: SPACING * 1.4,
    paddingVertical: SPACING * 1.6,
  },
  fecha: {
    width: 40,
    alignItems: "center",
  },
  fechaDiaSemana: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: MUTED,
  },
  fechaNumero: {
    fontFamily: SERIF,
    fontSize: 24,
    color: TEXT,
  },
  fechaMes: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: MUTED,
  },
  categoria: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  categoriaTexto: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    color: MUTED,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    marginTop: 3,
  },
  meta: {
    fontSize: 12,
    fontWeight: "500",
    color: TEXT,
    marginTop: 6,
  },

  vacio: {
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING * 3,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  vacioTexto: {
    fontSize: 13,
    color: MUTED,
  },
});

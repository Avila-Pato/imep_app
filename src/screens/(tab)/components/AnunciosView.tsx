import { categoriaDe, categoriasUsadas } from "@/utils/categorias";
import EstadoSubida from "@/components/EstadoSubida";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  MESES_CORTOS,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
  LINEA,
} from "@/constants/constans";
import {
  borrarAnuncio,
  useEstudios,
  useNombreIglesiaSiVarias,
  usePuede,
} from "@/store/estudios";
import { Anuncio } from "@/types/typesAnuncios";
import { confirmar } from "@/utils/confirmar";
import { proximoCulto } from "@/utils/cultos";
import { useEspacioBarra } from "@/hooks/useEspacioBarra";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ModalAnuncio from "./ModalAnuncio";
import ModalFormAnuncio from "./ModalFormAnuncio";
import TarjetaIglesia from "./TarjetaIglesia";

type Filtro = "todos" | (string & {});

// "YYYY-MM-DD" de hoy + N dias (hora local)
const pad = (n: number) => String(n).padStart(2, "0");
const diaKey = (n = 0) => {
  const f = new Date();
  f.setDate(f.getDate() + n);
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
};

const deKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Una fila: fecha a la izquierda, texto a la derecha
function Fila({
  a,
  iglesia,
  onAbrir,
}: {
  a: Anuncio;
  iglesia?: string; // de que iglesia es (si tiene varias)
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
        styles.tarjeta,
        a.imagen && styles.tarjetaConImagen,
        pressed && styles.presionado,
      ]}
    >
      {/* Imagen o afiche arriba */}
      {a.imagen && (
        <Image
          source={{ uri: a.imagen }}
          style={styles.imagen}
          contentFit="cover"
          transition={150}
        />
      )}
      <View style={styles.fila}>
        <View style={styles.fecha}>
          <Text style={styles.fechaDiaSemana}>{dia}</Text>
          <Text style={styles.fechaNumero}>{f.getDate()}</Text>
          <Text style={styles.fechaMes}>{MESES_CORTOS[f.getMonth()]}</Text>
        </View>
        <View style={styles.flex}>
          <View style={styles.categoria}>
            <Octicons
              name={categoriaDe(a.categoria).icon}
              size={11}
              color={MUTED}
            />
            <Text style={styles.categoriaTexto} numberOfLines={1}>
              {categoriaDe(a.categoria).label.toUpperCase()}
              {iglesia ? ` · ${iglesia.toUpperCase()}` : ""}
            </Text>
          </View>
          {!!a.titulo && <Text style={styles.titulo}>{a.titulo}</Text>}
          {!!a.descripcion && (
            <Text style={styles.descripcion}>{a.descripcion}</Text>
          )}
          {!!meta && <Text style={styles.meta}>{meta}</Text>}
        </View>
        <Octicons
          name="chevron-right"
          size={16}
          color={MUTED}
          style={styles.flecha}
        />
      </View>
      {/* quien lo publico ve si termino de subir (o reintenta) */}
      <EstadoSubida clave={a.id} />
    </Pressable>
  );
}

// Anuncios de la iglesia: el proximo culto (sale del horario, igual que el
// cronograma) y lo que publican el pastor, la secretaria o comunicaciones
export default function AnunciosView({
  conIglesia,
}: {
  conIglesia?: boolean; // en la pestaña: el mapa y el proximo culto arriba
}) {
  const nombreIglesia = useNombreIglesiaSiVarias();
  // espacio para la barra flotante y los botones del telefono
  const espacio = useEspacioBarra();
  const { anuncios, nombre } = useEstudios();
  const puedePublicar = usePuede("anuncios");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  // formulario: null = cerrado, "nuevo" o el anuncio a editar
  const [form, setForm] = useState<Anuncio | "nuevo" | null>(null);

  const hoy = diaKey();
  const enUnaSemana = diaKey(7);
  const culto = proximoCulto();
  const fechaCulto = culto?.fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Lo que viene, por fecha (lo pasado ya no se muestra)
  const proximos = anuncios
    .filter((a) => a.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  // Filtros: Todos, Eventos y las categorias que tienen anuncios
  // (las que crea el admin aparecen solas al publicar)
  const FILTROS: { id: Filtro; label: string }[] = [
    { id: "todos", label: "Todos" },
    ...categoriasUsadas(proximos).map((id) => ({
      id,
      label: categoriaDe(id).label,
    })),
  ];
  // si se fue el ultimo anuncio de ese filtro, vuelve a "Todos"
  const filtroActual = FILTROS.some((f) => f.id === filtro) ? filtro : "todos";
  const visibles = proximos.filter(
    (a) => filtroActual === "todos" || a.categoria === filtroActual,
  );
  const secciones = [
    {
      titulo: "ESTA SEMANA",
      lista: visibles.filter((a) => a.fecha < enUnaSemana),
    },
    {
      titulo: "PRÓXIMAMENTE",
      lista: visibles.filter((a) => a.fecha >= enUnaSemana),
    },
  ].filter((s) => s.lista.length > 0);
  const abierto = anuncios.find((a) => a.id === abiertoId) ?? null;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: espacio }]}
      showsVerticalScrollIndicator={false}
    >
      {/* La iglesia: mapa con el proximo culto encima */}
      {conIglesia && <TarjetaIglesia />}

      {/* Proximo culto (horario de la iglesia, igual que el cronograma) */}
      {!conIglesia && culto && (
        <View style={styles.culto}>
          <View style={styles.cultoIcono}>
            <Octicons name="bell" size={16} color={DARK_BG} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cultoEtiqueta}>PRÓXIMO CULTO</Text>
            <Text style={styles.cultoTitulo}>
              {culto.cuando} · {culto.horario.hora} hrs
            </Text>
            <Text style={styles.cultoFecha}>
              {culto.horario.nombre ?? fechaCulto}
            </Text>
          </View>
        </View>
      )}

      {/* Escribir un anuncio (pastor, secretaria, comunicaciones) */}
      {puedePublicar && (
        <Pressable
          onPress={() => setForm("nuevo")}
          style={({ pressed }) => [
            styles.escribir,
            pressed && styles.presionado,
          ]}
        >
          <View style={styles.escribirIcono}>
            <Octicons name="pencil" size={16} color={DARK_BG} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.escribirTitulo}>Escribir un anuncio</Text>
            <Text style={styles.escribirTexto}>
              Lo verá toda la iglesia y les llegará un recordatorio ese día.
            </Text>
          </View>
          <Octicons name="plus" size={16} color={MUTED} />
        </Pressable>
      )}

      {/* Filtros (solo si hay algo que filtrar) */}
      {proximos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtros}
          contentContainerStyle={styles.filtrosContent}
        >
          {FILTROS.map((f) => {
            const activo = f.id === filtroActual;
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
      )}

      {/* Anuncios agrupados por cuando ocurren */}
      {secciones.length === 0 ? (
        <View style={styles.vacio}>
          <Octicons name="megaphone" size={22} color={MUTED} />
          <Text style={styles.vacioTexto}>
            {proximos.length > 0
              ? "No hay anuncios próximos en esta categoría"
              : puedePublicar
                ? "Aún no hay anuncios. Escribe el primero."
                : "Aún no hay anuncios. Aquí verás los eventos y avisos de tu iglesia."}
          </Text>
        </View>
      ) : (
        secciones.map((s) => (
          <View key={s.titulo}>
            <Text style={styles.seccion}>{s.titulo}</Text>
            <View style={styles.lista}>
              {s.lista.map((a) => (
                <Fila
                  key={a.id}
                  a={a}
                  iglesia={nombreIglesia}
                  onAbrir={() => setAbiertoId(a.id)}
                />
              ))}
            </View>
          </View>
        ))
      )}

      <ModalAnuncio
        anuncio={abierto}
        onCerrar={() => setAbiertoId(null)}
        onEditar={
          puedePublicar && abierto
            ? () => {
                setAbiertoId(null);
                setForm(abierto);
              }
            : undefined
        }
        onBorrar={
          puedePublicar && abierto
            ? () =>
                confirmar(
                  "¿Borrar este anuncio?",
                  `"${abierto.titulo}" dejará de verse para toda la iglesia.`,
                  "Borrar",
                  () => {
                    setAbiertoId(null);
                    borrarAnuncio(abierto.id);
                  },
                )
            : undefined
        }
      />
      {form && (
        <ModalFormAnuncio
          anuncio={form === "nuevo" ? null : form}
          autor={nombre ?? USUARIO.nombre}
          onCerrar={() => setForm(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
    gap: SPACING * 2.4,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.6,
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

  // Escribir
  escribir: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  escribirIcono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  escribirTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
  escribirTexto: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    marginTop: 2,
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
  // cada anuncio en su propia tarjeta, separadas
  lista: {
    gap: SPACING * 1.2,
  },
  flecha: {
    alignSelf: "center",
  },

  // Tarjeta (imagen opcional arriba + fila)
  tarjeta: {
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: "hidden",
  },
  tarjetaConImagen: {
    borderColor: LINEA,
  },
  imagen: {
    width: "100%",
    height: 170,
    backgroundColor: DARK_BG,
  },
  fila: {
    flexDirection: "row",
    gap: SPACING * 1.4,
    paddingVertical: SPACING * 1.8,
    paddingHorizontal: SPACING * 1.6,
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
    paddingHorizontal: SPACING * 2,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  vacioTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    textAlign: "center",
  },
});

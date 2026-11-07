import { NOTIFICACIONES, PALABRAS, REDES } from "@/assets/data/homeMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  HOME_CARD_W as CARD_W,
  DARK_BG,
  MUTED,
  HOME_PADDING as PADDING,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { useEsPastor, useEstudios, useIglesia } from "@/store/estudios";
import { proximoCulto } from "@/utils/cultos";
import { abrirComoLlegar } from "@/utils/mapa";
import { iniciales, partirTitulo } from "@/utils/texto";
import { useEspacioBarra } from "@/hooks/useEspacioBarra";
import { IconName } from "@/types/typesCronogramas";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RedesSociales from "./components/RedesSociales";
import MapaIglesia from "./components/MapaIglesia";
import ModalIglesia from "./components/ModalIglesia";
import SinIglesia from "./components/SinIglesia";
import {
  fechaCorta,
  PREDICACIONES_PASADAS,
} from "./components/PredicacionView";

// el mapa va dentro de un marco claro (como una postal)
const MARCO = 6;
const MAPA_W = CARD_W - MARCO * 2;
const IGLESIA_ALTO = CARD_W * 0.78;

// Versiculo al azar cada vez que se abre la app
const PALABRA = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];

// Proximo culto segun el horario configurado
const CULTO = proximoCulto();

// La predicacion mas reciente destacada y un par de las anteriores
const [ULTIMA, ...RESTO] = PREDICACIONES_PASADAS;
const ANTERIORES = RESTO.slice(0, 2);
const abrirPredicaciones = (id?: string) =>
  router.push((id ? `/predicacion?id=${id}` : "/predicacion") as Href);

// Encabezado: chip con la fecha ("Viernes, 6 nov") y saludo segun la hora
const hoy = new Date();
const FECHA_HOY = (() => {
  const t = hoy.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  return t.charAt(0).toUpperCase() + t.slice(1).replace(".", "");
})();
const h = hoy.getHours();
const SALUDO =
  h < 12 ? "Buenos días," : h < 20 ? "Buenas tardes," : "Buenas noches,";

export default function HomeScreen() {
  // espacio para la barra flotante y los botones del telefono
  const espacio = useEspacioBarra();
  // la iglesia la ubica el pastor; el hermano la recibe al unirse
  const iglesia = useIglesia();
  const esPastor = useEsPastor();
  const { nombre } = useEstudios();
  const miNombre = nombre ?? USUARIO.nombre;
  const [editando, setEditando] = useState(false);

  return (
    //edges es para que no se muestre la barra de notificaciones
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Barra de arriba: fecha a la izquierda; campana y avatar a la derecha */}
      <View style={styles.header}>
        <View style={styles.fecha}>
          <Octicons name="calendar" size={13} color={PRIMARY} />
          <Text style={styles.fechaTexto}>{FECHA_HOY}</Text>
        </View>

        <View style={styles.headerDerecha}>
          <Pressable
            onPress={() => router.push("/notificaciones" as Href)}
            style={({ pressed }) => [
              styles.campana,
              pressed && styles.presionado,
            ]}
            hitSlop={8}
            accessibilityLabel="Notificaciones"
          >
            <Octicons name="bell" size={18} color={TEXT} />
            {NOTIFICACIONES > 0 && <View style={styles.badge} />}
          </Pressable>
          <Pressable
            onPress={() => router.push("/perfil" as Href)}
            style={({ pressed }) => [styles.yo, pressed && styles.presionado]}
            hitSlop={8}
            accessibilityLabel="Mi perfil"
          >
            <Text style={styles.yoTexto}>{iniciales(miNombre)}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: espacio }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Saludo grande: "Buenos días, / Patricio" */}
        <Text style={styles.saludo}>
          {SALUDO}
          {"\n"}
          <Text style={styles.saludoNombre}>{miNombre.split(" ")[0]}</Text>
        </Text>

        {/* Palabra del dia */}
        <View style={styles.palabra}>
          <View style={styles.palabraLinea} />
          <View style={styles.flex}>
            <Text style={styles.palabraTexto}>“{PALABRA.texto}”</Text>
            <Text style={styles.palabraCita}>{PALABRA.cita}</Text>
          </View>
        </View>

        {/* Iglesia / proximo culto (sin iglesia: invitacion a ubicarla o unirse) */}
        {iglesia ? (
          <View style={styles.iglesia}>
            {/* Titulo grande sobre el mapa: "Nos vemos en / Sede" */}
            <View style={styles.iglesiaCabecera}>
              <View style={styles.flex}>
                <Text style={styles.iglesiaAntes}>Nos vemos en</Text>
                <Text style={styles.iglesiaNombre} numberOfLines={2}>
                  {iglesia.sede}
                </Text>
              </View>
              {/* el pastor cambia la ubicacion desde aqui */}
              {esPastor && (
                <Pressable
                  onPress={() => setEditando(true)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.iglesiaEditar,
                    pressed && styles.presionado,
                  ]}
                  accessibilityLabel="Cambiar ubicación de la iglesia"
                >
                  <Octicons name="pencil" size={14} color={TEXT} />
                </Pressable>
              )}
            </View>

            {/* Mapa con marco claro, como una postal */}
            <View style={styles.marco}>
              <View style={styles.iglesiaCard}>
                <MapaIglesia
                  lat={iglesia.lat}
                  lng={iglesia.lng}
                  ancho={MAPA_W}
                  alto={IGLESIA_ALTO}
                  etiqueta={iglesia.sede}
                />

                {/* Ficha flotante: el proximo culto */}
                {CULTO && (
                  <View style={styles.ficha}>
                    <Text style={styles.fichaHora}>{CULTO.horario.hora}</Text>
                    <View>
                      <Text style={styles.fichaEstado}>PRÓXIMO</Text>
                      <Text style={styles.fichaCuando}>{CULTO.cuando}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Datos en chips (2 x 2) */}
            <View style={styles.datos}>
              <Dato
                icono="bell"
                texto={CULTO?.horario.nombre ?? "Culto"}
                sub={
                  CULTO
                    ? `${CULTO.cuando} · ${CULTO.horario.hora} hrs`
                    : undefined
                }
              />
              <Dato
                icono="location"
                texto={iglesia.lugar}
                sub={iglesia.direccion}
              />
              <Dato
                icono="arrow-up-right"
                texto="Cómo llegar"
                sub="Abrir en el mapa"
                destacado
                onPress={() =>
                  abrirComoLlegar(iglesia.lat, iglesia.lng, iglesia.direccion)
                }
              />
              <Dato
                icono="share-android"
                texto="Invitar a alguien"
                sub="Comparte la dirección"
                onPress={() =>
                  Share.share({
                    message: `Te invito a ${iglesia.sede}${CULTO ? ` · ${CULTO.horario.nombre} ${CULTO.cuando.toLowerCase()} a las ${CULTO.horario.hora}` : ""}\n${iglesia.direccion}`,
                  })
                }
              />
            </View>
          </View>
        ) : (
          <SinIglesia
            esPastor={esPastor}
            alto={IGLESIA_ALTO}
            onAgregar={() => setEditando(true)}
          />
        )}
        <ModalIglesia visible={editando} onCerrar={() => setEditando(false)} />

        {/* Predicaciones: la ultima destacada + las anteriores */}
        {ULTIMA && (
          <View style={styles.seccionPred}>
            <View style={styles.seccionCabecera}>
              <View>
                <Text style={styles.seccionTitulo}>Predicaciones</Text>
                <Text style={styles.seccionSub}>Vuelve a leer la Palabra</Text>
              </View>
              <Pressable
                onPress={() => abrirPredicaciones()}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.verTodas,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.verTodasTexto}>Ver todas</Text>
                <Octicons name="chevron-right" size={12} color={TEXT} />
              </Pressable>
            </View>

            <Pressable
              onPress={() => abrirPredicaciones()}
              style={({ pressed }) => [
                styles.predicacion,
                pressed && styles.presionado,
              ]}
            >
              <View style={styles.predicacionFila}>
                <Text style={styles.etiqueta}>ÚLTIMA</Text>
                <Text style={styles.etiqueta}>{fechaCorta(ULTIMA.fecha)}</Text>
              </View>
              <Text style={styles.predicacionTitulo}>
                {partirTitulo(ULTIMA.titulo).inicio}
                <Text style={styles.cursiva}>
                  {partirTitulo(ULTIMA.titulo).final}
                </Text>
              </Text>
              <View style={styles.predicador}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>
                    {iniciales(ULTIMA.predicador)}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.predicadorNombre}>
                    {ULTIMA.predicador}
                  </Text>
                  <Text style={styles.predicadorSub}>{ULTIMA.cita}</Text>
                </View>
                <Text style={styles.leer}>Ver →</Text>
              </View>
            </Pressable>

            {/* Anteriores (compactas) */}
            {ANTERIORES.length > 0 && (
              <View style={styles.anteriores}>
                {ANTERIORES.map((p, i) => (
                  <Pressable
                    key={p.id}
                    onPress={() => abrirPredicaciones(p.id)}
                    style={({ pressed }) => [
                      styles.anterior,
                      i > 0 && styles.conLinea,
                      pressed && styles.presionado,
                    ]}
                  >
                    <View style={styles.flex}>
                      <Text style={styles.anteriorTitulo} numberOfLines={1}>
                        {p.titulo}
                      </Text>
                      <Text style={styles.predicadorSub} numberOfLines={1}>
                        {p.predicador} · {fechaCorta(p.fecha)}
                      </Text>
                    </View>
                    <Octicons name="chevron-right" size={14} color={MUTED} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Redes sociales (al final) */}
        <View style={styles.redes}>
          <RedesSociales redes={REDES} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Chip de dato bajo el mapa: icono en circulo + texto (algunos se tocan)
function Dato({
  icono,
  texto,
  sub,
  destacado,
  onPress,
}: {
  icono: IconName;
  texto: string;
  sub?: string;
  destacado?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.dato, pressed && styles.presionado]}
    >
      <View style={[styles.datoIcono, destacado && styles.datoIconoDestacado]}>
        <Octicons name={icono} size={14} color={destacado ? "#FFFFFF" : TEXT} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.datoTexto} numberOfLines={1}>
          {texto}
        </Text>
        {!!sub && (
          <Text style={styles.datoSub} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING / 2,
    gap: SPACING * 1.6,
  },

  // Textos

  // Encabezado
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING,
    paddingTop: SPACING / 2,
    paddingBottom: SPACING / 2,
  },
  headerDerecha: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  fecha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: SPACING * 1.2,
    height: 34,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  fechaTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
  yo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },
  yoTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  saludo: {
    fontFamily: SERIF,
    fontSize: 30,
    lineHeight: 36,
    color: MUTED,
    marginTop: SPACING,
  },
  saludoNombre: {
    fontStyle: "italic",
    fontSize: 38,
    color: TEXT,
  },
  campana: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  badge: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
    borderWidth: 1.5,
    borderColor: SURFACE,
  },

  // Palabra del dia
  palabra: {
    flexDirection: "row",
    gap: SPACING * 1.2,
  },
  palabraLinea: {
    width: 2,
    borderRadius: 1,
    backgroundColor: PRIMARY,
  },
  palabraTexto: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 16,
    lineHeight: 23,
    color: TEXT,
  },
  palabraCita: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
  },
  bloque: {
    gap: 6,
  },
  etiqueta: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: MUTED,
  },

  // Iglesia: titulo, mapa enmarcado y datos
  iglesia: {
    gap: SPACING * 1.4,
  },
  iglesiaCabecera: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING,
  },
  iglesiaAntes: {
    fontFamily: SERIF,
    fontSize: 26,
    lineHeight: 30,
    color: MUTED,
  },
  iglesiaNombre: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 30,
    lineHeight: 36,
    color: TEXT,
  },
  iglesiaEditar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 4,
  },
  marco: {
    padding: MARCO,
    borderRadius: 28,
    backgroundColor: "#EDE6DA",
    transform: [{ rotate: "-1deg" }],
  },
  iglesiaCard: {
    height: IGLESIA_ALTO,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#262626", // mientras cargan las teselas del mapa
  },
  ficha: {
    position: "absolute",
    left: SPACING * 1.2,
    bottom: SPACING * 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: SPACING,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "1deg" }],
  },
  fichaHora: {
    fontFamily: SERIF,
    fontSize: 24,
    color: DARK_BG,
  },
  fichaEstado: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: PRIMARY,
  },
  fichaCuando: {
    fontSize: 12,
    fontWeight: "600",
    color: DARK_BG,
  },
  datos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING,
  },
  dato: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    padding: SPACING,
    borderRadius: 16,
    backgroundColor: SURFACE,
  },
  datoIcono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  datoIconoDestacado: {
    backgroundColor: PRIMARY,
  },
  datoTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
  datoSub: {
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  flex: {
    flex: 1,
  },

  // Boton
  boton: {
    alignSelf: "flex-start",
    backgroundColor: PRIMARY,
    paddingHorizontal: SPACING * 2,
    paddingVertical: SPACING * 1.4,
    borderRadius: 14,
  },
  presionado: {
    opacity: 0.8,
  },
  botonTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },

  // Seccion predicaciones
  seccionPred: {
    gap: SPACING,
    marginTop: SPACING,
  },
  seccionCabecera: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  seccionTitulo: {
    fontFamily: SERIF,
    fontSize: 22,
    color: TEXT,
  },
  seccionSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  verTodas: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  verTodasTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT,
  },
  anteriores: {
    paddingHorizontal: SPACING * 1.6,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  anterior: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingVertical: SPACING * 1.2,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  anteriorTitulo: {
    fontFamily: SERIF,
    fontSize: 16,
    color: TEXT,
  },

  // Ultima predicacion
  predicacion: {
    padding: SPACING * 1.6,
    gap: SPACING * 1.2,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  predicacionFila: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  predicacionTitulo: {
    fontFamily: SERIF,
    fontSize: 24,
    lineHeight: 30,
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
    width: 34,
    height: 34,
    borderRadius: 17,
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
  predicadorSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },
  leer: {
    fontSize: 13,
    fontWeight: "500",
    color: TEXT,
  },
  redes: {
    marginTop: SPACING * 1.6,
    paddingTop: SPACING * 2.4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
});

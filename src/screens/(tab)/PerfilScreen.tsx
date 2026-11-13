import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  CARGOS,
  DARK_BG,
  MENU_PERFIL,
  MESES_CORTOS,
  MUTED,
  HOME_PADDING as PADDING,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
  primarioAlfa,
  ELEVADO,
  LINEA,
} from "@/constants/constans";
import { useEspacioBarra } from "@/hooks/useEspacioBarra";
import AvatarPersona from "@/components/AvatarPersona";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import PanelAdmin from "@/screens/perfil/PanelAdmin";
import {
  reiniciarApp,
  useEsPastor,
  useEstudios,
  useGrupos,
  useIglesia,
  usePuede,
  useRoles,
  verBienvenida,
  guardarPerfil,
} from "@/store/estudios";
import { horaTurno } from "@/utils/cultos";
import { unirTurnos } from "@/utils/turnos";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ModalCodigo from "./components/ModalCodigo";
import { TEXTO_VERSION } from "@/utils/version";
import ModalEstudio from "./components/ModalEstudio";

const pad = (n: number) => String(n).padStart(2, "0");
const hoy = new Date();
const HOY_KEY = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;

// "2026-10-20" -> { dia: "Mar", numero: 20, mes: "oct" }
const partesFecha = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  const f = new Date(y, m - 1, d);
  const dia = f
    .toLocaleDateString("es-ES", { weekday: "short" })
    .replace(".", "");
  return {
    dia: dia.charAt(0).toUpperCase() + dia.slice(1),
    numero: d,
    mes: MESES_CORTOS[m - 1].toLowerCase(),
  };
};

// Pide confirmacion antes de borrar todo (en web no hay Alert con botones)
const confirmarReinicio = () => {
  const titulo = "¿Reiniciar la app?";
  const texto =
    "Se borrará tu rol, la iglesia, el mapa, las salas y todo lo guardado. Volverás a la bienvenida para empezar de cero.";
  if (Platform.OS === "web") {
    if (
      window.confirm(`${titulo}

${texto}`)
    )
      reiniciarApp();
    return;
  }
  Alert.alert(titulo, texto, [
    { text: "Cancelar", style: "cancel" },
    { text: "Reiniciar", style: "destructive", onPress: reiniciarApp },
  ]);
};

export default function PerfilScreen() {
  // espacio para la barra flotante y los botones del telefono
  const espacio = useEspacioBarra();
  const {
    grupo,
    guardados,
    versiculos,
    turnosEditados,
    nombre,
    cargos,
    meGusta,
    meGustaTextos,
    avatar,
    portada,
    cuenta,
  } = useEstudios();
  const esPastor = useEsPastor();
  const iglesia = useIglesia();
  const miNombre = nombre ?? USUARIO.nombre;
  const misCargos = cargos[miNombre] ?? [];
  // panel de administracion: el pastor y quien tenga roles con permisos
  const puedeCronograma = usePuede("cronograma");
  const puedeAnuncios = usePuede("anuncios");
  const puedeRoles = usePuede("roles");
  const roles = useRoles();
  const administra = esPastor || puedeCronograma || puedeAnuncios || puedeRoles;
  const grupos = useGrupos();
  // Turnos del usuario desde hoy en adelante (incluye los que asigno el admin)
  const proximos = unirTurnos(turnosEditados)
    .filter((t) => t.persona === miNombre && t.fecha >= HOY_KEY)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const MIS_TURNOS = proximos.slice(0, 3);
  // versiculos con "me gusta", el ultimo primero
  const gustados = meGusta
    .map((clave) => ({ clave, ...meGustaTextos[clave] }))
    .filter((g) => !!g.texto)
    .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));
  // los 3 numeros del perfil: cada uno es una seccion de abajo
  const ESTADISTICAS = [
    {
      valor: proximos.length,
      label: "Turnos",
      sub: "por servir",
      ruta: undefined as string | undefined,
    },
    {
      valor: gustados.length,
      label: "Me gusta",
      sub: "versículos",
      ruta: "/megusta",
    },
    {
      valor: versiculos.length,
      label: "Guardados",
      sub: "y oraciones",
      ruta: "/guardados",
    },
  ];
  // estudio abierto en el modal (sin cambiar de vista)
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  // "Tengo un código": unirse a la iglesia con el codigo del pastor
  const [conCodigo, setConCodigo] = useState(false);
  const abierto = guardados.find((e) => e.id === abiertoId) ?? null;
  const miGrupo = grupos.find((g) => g.id === grupo);
  // portada: imagen de la galeria (ancha); sin imagen quedan las formas de color
  const cambiarPortada = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 7],
      quality: 0.8,
    });
    if (!r.canceled && r.assets[0]) guardarPerfil({ portada: r.assets[0].uri });
  };
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: espacio }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Portada con forma decorativa */}
        <View style={styles.portada}>
          {/* imagen elegida en Editar perfil; sin imagen, las formas de color */}
          {portada ? (
            <Image
              source={{ uri: portada }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <>
              <View style={styles.circuloGrande} />
              <View style={styles.circuloChico} />
            </>
          )}
          {/* lapiz: cambiar la imagen de la portada (lo demas, en Editar perfil) */}
          <Pressable
            onPress={cambiarPortada}
            style={({ pressed }) => [
              styles.ajustes,
              pressed && styles.presionado,
            ]}
            hitSlop={8}
            accessibilityLabel="Cambiar imagen de portada"
          >
            <Octicons name="pencil" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Avatar y datos */}
        <View style={styles.perfil}>
          <Pressable
            onPress={() => router.push("/editar-perfil" as Href)}
            style={styles.avatar}
            accessibilityLabel="Editar perfil"
          >
            <AvatarPersona
              nombre={miNombre}
              avatar={avatar}
              tamano={AVATAR - 8}
            />
            <View style={styles.editar}>
              <Octicons name="pencil" size={12} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={styles.nombre}>{miNombre}</Text>
          <Text style={styles.ministerio}>
            {/* el rol en la iglesia: pastor, roles que le dieron o su ministerio */}
            {esPastor
              ? `Pastor${iglesia ? ` · ${iglesia.sede}` : ""}`
              : misCargos.length > 0
                ? misCargos.map((c) => CARGOS[c].label).join(" · ")
                : USUARIO.ministerio}
            {!esPastor && miGrupo && ` · ${miGrupo.label}`}
          </Text>
          <Text style={styles.meta}>MIEMBRO DESDE {USUARIO.miembroDesde}</Text>
          {/* la cuenta con la que entro */}
          {cuenta && (
            <View style={styles.cuenta}>
              <FontAwesome name="google" size={11} color={MUTED} />
              <Text style={styles.cuentaTexto} numberOfLines={1}>
                {[cuenta.nombre, cuenta.correo].filter(Boolean).join(" · ")}
              </Text>
            </View>
          )}
        </View>

        {/* Pastor / secretaria: panel de administracion arriba */}
        {administra && <PanelAdmin esPastor={esPastor} />}

        {/* Estadisticas (el pastor ve su resumen en el panel) */}
        {!esPastor && (
          <View style={styles.stats}>
            {ESTADISTICAS.map((s, i) => (
              <Pressable
                key={s.label}
                onPress={s.ruta ? () => router.push(s.ruta as Href) : undefined}
                disabled={!s.ruta}
                style={({ pressed }) => [
                  styles.stat,
                  i > 0 && styles.statLinea,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.statValor}>{s.valor}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statSub}>{s.sub}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Estudios guardados desde el Estudio guiado */}
        {/* <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>MIS ESTUDIOS</Text>
          {guardados.length === 0 ? (
            <Text style={styles.vacio}>Aún no guardas estudios</Text>
          ) : (
            <View>
              {guardados.map((e, i) => (
                <Pressable
                  key={e.id}
                  onPress={() => setAbiertoId(e.id)}
                  style={({ pressed }) => [
                    styles.opcion,
                    i > 0 && styles.conLinea,
                    pressed && styles.presionado,
                  ]}
                >
                  <View style={styles.opcionIcono}>
                    <Octicons name="book" size={16} color={TEXT} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.estudioCita}>{e.cita}</Text>
                    <Text style={styles.estudioFecha}>
                      {haceCuanto(e.fecha)}
                    </Text>
                  </View>
                  <Octicons name="chevron-right" size={16} color={MUTED} />
                </Pressable>
              ))}
            </View>
          )}
        </View> */}

        {/* Me gusta: un boton que lleva a la lista completa */}
        <Pressable
          onPress={() => router.push("/megusta" as Href)}
          style={({ pressed }) => [
            styles.botonGusta,
            pressed && styles.presionado,
          ]}
        >
          <View style={styles.botonGustaIcono}>
            <Octicons name="heart-fill" size={18} color={PRIMARY} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.botonGustaTitulo}>Mis me gusta</Text>
            <Text style={styles.botonGustaSub}>
              {gustados.length === 0
                ? "Doble toque a un versículo para guardarlo aquí"
                : `Ver ${gustados.length === 1 ? "el versículo" : `los ${gustados.length} versículos`} que te gustaron`}
            </Text>
          </View>
          <Octicons name="chevron-right" size={16} color={MUTED} />
        </Pressable>

        {/* Versiculos y oraciones: un boton que lleva a la lista completa */}
        <Pressable
          onPress={() => router.push("/guardados" as Href)}
          style={({ pressed }) => [
            styles.botonGusta,
            pressed && styles.presionado,
          ]}
        >
          <View style={styles.botonGustaIcono}>
            <Octicons name="bookmark-filled" size={18} color={PRIMARY} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.botonGustaTitulo}>Versículos y oraciones</Text>
            <Text style={styles.botonGustaSub}>
              {versiculos.length === 0
                ? "Guarda un versículo u ora con él desde la Biblia"
                : `Ver ${versiculos.length === 1 ? "tu guardado" : `tus ${versiculos.length} guardados`}`}
            </Text>
          </View>
          <Octicons name="chevron-right" size={16} color={MUTED} />
        </Pressable>

        {/* Proximos turnos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>MIS PRÓXIMOS TURNOS</Text>
          {MIS_TURNOS.length === 0 ? (
            <Text style={styles.vacio}>No tienes turnos asignados</Text>
          ) : (
            MIS_TURNOS.map((t) => {
              const rol = roles.de(t.rol);
              const f = partesFecha(t.fecha);
              return (
                <View key={t.id} style={styles.turno}>
                  <View style={styles.turnoFecha}>
                    <Text style={styles.turnoDia}>{f.dia}</Text>
                    <Text style={styles.turnoNumero}>{f.numero}</Text>
                    <Text style={styles.turnoDia}>{f.mes}</Text>
                  </View>
                  <View style={styles.bloque}>
                    <View style={styles.bloqueIcono}>
                      <Octicons name={rol.icon} size={16} color={TEXT} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.bloqueRol}>
                        {rol.label.toUpperCase()}
                      </Text>
                      <Text style={styles.bloqueHora}>
                        {horaTurno(t) ?? "—"} hrs
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Menu */}
        {MENU_PERFIL.map((grupo) => (
          <View key={grupo.titulo} style={styles.seccion}>
            <Text style={styles.seccionTitulo}>
              {grupo.titulo.toUpperCase()}
            </Text>
            <View>
              {grupo.opciones.map((op, i) => (
                <Pressable
                  key={op.id}
                  // por ahora solo estas opciones hacen algo
                  onPress={
                    op.id === "privacidad"
                      ? () => router.push("/privacidad" as Href)
                      : op.id === "ayuda"
                        ? () => router.push("/ayuda" as Href)
                        : op.id === "ministerios"
                          ? // con iglesia: sus salas; sin iglesia: unirse con el codigo
                            iglesia
                            ? () => router.push("/comunidad" as Href)
                            : () => setConCodigo(true)
                          : op.id === "editar"
                            ? () => router.push("/editar-perfil" as Href)
                            : op.id === "bienvenida"
                              ? () => verBienvenida(false)
                              : op.id === "codigo"
                                ? () => setConCodigo(true)
                                : op.id === "notificaciones"
                                  ? () => router.push("/notificaciones" as Href)
                                  : op.id === "reiniciar"
                                    ? confirmarReinicio
                                    : undefined
                  }
                  style={({ pressed }) => [
                    styles.opcion,
                    i > 0 && styles.conLinea,
                    pressed && styles.presionado,
                  ]}
                >
                  <View
                    style={[
                      styles.opcionIcono,
                      op.peligro && styles.opcionIconoPeligro,
                    ]}
                  >
                    <Octicons
                      name={op.icon}
                      size={16}
                      color={op.peligro ? PRIMARY : TEXT}
                    />
                  </View>
                  {op.id === "ministerios" ? (
                    // su iglesia (es una sola) o el aviso de que aun no se une
                    <View style={styles.flex}>
                      <Text style={styles.ministerioLabel}>{op.label}</Text>
                      <Text
                        style={[
                          styles.ministerioIglesia,
                          !iglesia && styles.ministerioSin,
                        ]}
                        numberOfLines={1}
                      >
                        {iglesia
                          ? iglesia.sede
                          : "Aún no te has unido a tu ministerio"}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.opcionTexto,
                        op.peligro && styles.opcionTextoPeligro,
                      ]}
                    >
                      {op.label}
                    </Text>
                  )}
                  {!op.peligro && (
                    <Octicons name="chevron-right" size={16} color={MUTED} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        {/* version de la app (la de Google Play) */}
        <Text style={styles.version}>{TEXTO_VERSION}</Text>
      </ScrollView>

      <ModalEstudio estudio={abierto} onCerrar={() => setAbiertoId(null)} />
      <ModalCodigo visible={conCodigo} onCerrar={() => setConCodigo(false)} />
    </SafeAreaView>
  );
}

const AVATAR = 96;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  content: {
    gap: SPACING * 2.4,
  },

  // Portada
  portada: {
    height: 140,
    overflow: "hidden",
  },
  circuloGrande: {
    position: "absolute",
    top: -160,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: PRIMARY,
    opacity: 0.9,
  },
  circuloChico: {
    position: "absolute",
    top: 40,
    left: -40,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: SURFACE,
  },
  ajustes: {
    position: "absolute",
    top: SPACING,
    right: PADDING,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  // Perfil
  perfil: {
    alignItems: "center",
    marginTop: -AVATAR / 2 - SPACING * 2.4, // el avatar monta sobre la portada
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 4,
    borderColor: DARK_BG,
    marginBottom: SPACING * 1.2,
  },
  avatarTexto: {
    fontFamily: SERIF,
    fontSize: 32,
    color: TEXT,
  },
  editar: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: DARK_BG,
  },
  nombre: {
    fontFamily: SERIF,
    fontSize: 26,
    color: TEXT,
  },
  ministerio: {
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
  },
  cuenta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "90%",
    marginTop: SPACING / 2,
  },
  cuentaTexto: {
    fontSize: 12,
    color: MUTED,
  },
  meta: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: "#5A5A5A",
    marginTop: SPACING,
  },

  // Estadisticas
  stats: {
    flexDirection: "row",
    marginHorizontal: PADDING,
    paddingVertical: SPACING * 1.4,
    borderRadius: 20,
    backgroundColor: SURFACE,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statLinea: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: BORDER,
  },
  statValor: {
    fontFamily: SERIF,
    fontSize: 24,
    color: TEXT,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT,
  },
  statSub: {
    fontSize: 10,
    color: MUTED,
  },

  // Secciones
  seccion: {
    paddingHorizontal: PADDING,
    gap: SPACING,
  },
  seccionTitulo: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  vacio: {
    fontSize: 14,
    color: MUTED,
  },
  versiculo: {
    gap: 6,
    padding: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  versiculoTexto: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
  },
  versiculoOracion: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  versiculoCita: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: MUTED,
  },
  estudioCita: {
    fontSize: 15,
    color: TEXT,
  },
  estudioFecha: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  // Turnos
  turno: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
  },
  turnoFecha: {
    width: 40,
    alignItems: "center",
  },
  turnoDia: {
    fontSize: 11,
    color: MUTED,
  },
  turnoNumero: {
    fontFamily: SERIF,
    fontSize: 20,
    color: TEXT,
  },
  bloque: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingHorizontal: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
    borderRadius: 14,
    backgroundColor: ELEVADO,
    borderWidth: 1,
    borderColor: LINEA,
  },
  bloqueIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ELEVADO,
  },
  bloqueRol: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: MUTED,
  },
  bloqueHora: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
    marginTop: 2,
  },

  // Menu
  botonGusta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    marginHorizontal: PADDING,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
  },
  botonGustaIcono: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primarioAlfa(0.15),
  },
  botonGustaTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT,
  },
  botonGustaSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  version: {
    marginTop: SPACING,
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.4,
    paddingVertical: SPACING * 1.2,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  presionado: {
    opacity: 0.6,
  },
  opcionIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  opcionIconoPeligro: {
    backgroundColor: primarioAlfa(0.15),
  },
  ministerioLabel: {
    fontSize: 15,
    color: TEXT,
  },
  ministerioIglesia: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },
  ministerioSin: {
    color: PRIMARY,
  },
  opcionTexto: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  opcionTextoPeligro: {
    color: PRIMARY,
  },
});

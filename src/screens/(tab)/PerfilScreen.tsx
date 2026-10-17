import { TURNOS } from "@/assets/data/cronogramasMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  GRUPOS,
  HOME_PADDING as PADDING,
  MENU_PERFIL,
  MESES_CORTOS,
  MUTED,
  PRIMARY,
  ROLES,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { useEstudios } from "@/store/estudios";
import { haceCuanto } from "@/utils/tiempo";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ModalEstudio from "./components/ModalEstudio";

const pad = (n: number) => String(n).padStart(2, "0");
const hoy = new Date();
const HOY_KEY = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

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

// Turnos del usuario desde hoy en adelante
const MIS_TURNOS = TURNOS.filter(
  (t) => t.persona === USUARIO.nombre && t.fecha >= HOY_KEY,
)
  .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
  .slice(0, 3);

const ESTADISTICAS = [
  { valor: USUARIO.turnosRealizados, label: "Turnos" },
  { valor: USUARIO.estudios, label: "Estudios" },
  { valor: hoy.getFullYear() - USUARIO.miembroDesde, label: "Años" },
];

export default function PerfilScreen() {
  const { grupo, guardados } = useEstudios();
  // estudio abierto en el modal (sin cambiar de vista)
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const abierto = guardados.find((e) => e.id === abiertoId) ?? null;
  const miGrupo = GRUPOS.find((g) => g.id === grupo);
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Portada con forma decorativa */}
        <View style={styles.portada}>
          <View style={styles.circuloGrande} />
          <View style={styles.circuloChico} />
          <Pressable
            style={styles.ajustes}
            hitSlop={8}
            accessibilityLabel="Ajustes"
          >
            <Octicons name="gear" size={18} color={TEXT} />
          </Pressable>
        </View>

        {/* Avatar y datos */}
        <View style={styles.perfil}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciales(USUARIO.nombre)}</Text>
            <Pressable
              style={styles.editar}
              hitSlop={6}
              accessibilityLabel="Cambiar foto"
            >
              <Octicons name="pencil" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={styles.nombre}>{USUARIO.nombre}</Text>
          <Text style={styles.ministerio}>
            {USUARIO.ministerio}
            {miGrupo && ` · ${miGrupo.label}`}
          </Text>
          <Text style={styles.meta}>MIEMBRO DESDE {USUARIO.miembroDesde}</Text>
        </View>

        {/* Estadisticas */}
        <View style={styles.stats}>
          {ESTADISTICAS.map((s, i) => (
            <View
              key={s.label}
              style={[styles.stat, i > 0 && styles.statLinea]}
            >
              <Text style={styles.statValor}>{s.valor}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Estudios guardados desde el Estudio guiado */}
        <View style={styles.seccion}>
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
        </View>

        {/* Proximos turnos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>MIS PRÓXIMOS TURNOS</Text>
          {MIS_TURNOS.length === 0 ? (
            <Text style={styles.vacio}>No tienes turnos asignados</Text>
          ) : (
            MIS_TURNOS.map((t) => {
              const rol = ROLES[t.rol];
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
                        {t.hora} – {t.horaFin}
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
                  <Text
                    style={[
                      styles.opcionTexto,
                      op.peligro && styles.opcionTextoPeligro,
                    ]}
                  >
                    {op.label}
                  </Text>
                  {!op.peligro && (
                    <Octicons name="chevron-right" size={16} color={MUTED} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <ModalEstudio estudio={abierto} onCerrar={() => setAbiertoId(null)} />
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
    paddingBottom: 120, // espacio para el tabbar flotante
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
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "#333333",
  },
  bloqueIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
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
    backgroundColor: "rgba(229, 72, 77, 0.15)",
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

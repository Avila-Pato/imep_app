import { MENSAJES } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  GRUPOS,
  MUTED,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { miembrosDe } from "@/screens/sala/components/MiembrosSala";
import { useEstudios } from "@/store/estudios";
import { Grupo } from "@/types/typesComunidad";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Sala = Grupo & { noLeidos: number };

// Contador de mensajes sin leer
const Badge = ({ n }: { n: number }) =>
  n > 0 ? (
    <View style={styles.badge}>
      <Text style={styles.badgeTexto}>{n > 9 ? "9+" : n}</Text>
    </View>
  ) : null;

// Salas: la iglesia arriba y los grupos debajo
export default function IglesiaView() {
  const { mensajes, vistos, grupo: miGrupo } = useEstudios();
  const todos = [...MENSAJES, ...mensajes];

  // Cada sala con sus mensajes no leidos
  const salas: Sala[] = GRUPOS.map((g) => {
    const visto = vistos[g.id] ?? "";
    const noLeidos = todos.filter(
      (m) => m.grupo === g.id && m.autor !== USUARIO.nombre && m.fecha > visto,
    ).length;
    return { ...g, noLeidos };
  });
  const iglesia = salas.find((s) => s.id === "general") ?? salas[0];
  const grupos = salas.filter((s) => s.id !== iglesia.id);
  const abrir = (id: string) => router.push(`/sala/${id}` as Href);

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>
          Somos <Text style={styles.cursiva}>una iglesia</Text>
        </Text>
        <Text style={styles.sub}>Entra a una sala para conversar y orar.</Text>
      </View>

      {/* Iglesia: la sala de todos */}
      <Pressable
        onPress={() => abrir(iglesia.id)}
        style={({ pressed }) => [styles.iglesia, pressed && styles.presionado]}
      >
        <View style={styles.iconoGrande}>
          <Octicons name={iglesia.icono} size={20} color={DARK_BG} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.iglesiaTitulo}>Mi iglesia</Text>
          <Text style={styles.meta}>
            {iglesia.descripcion} · {miembrosDe(iglesia.id).length} miembros
          </Text>
        </View>
        <Badge n={iglesia.noLeidos} />
        <Octicons name="chevron-right" size={16} color={MUTED} />
      </Pressable>

      {/* Grupos */}
      <View>
        <Text style={styles.seccion}>GRUPOS</Text>
        <View style={styles.grilla}>
          {grupos.map((g) => {
            // solo se entra al grupo propio (lo elige la persona en su registro)
            const mio = g.id === miGrupo;
            return (
              <Pressable
                key={g.id}
                onPress={() => abrir(g.id)}
                disabled={!mio}
                style={({ pressed }) => [
                  styles.grupo,
                  !mio && styles.bloqueado,
                  pressed && styles.presionado,
                ]}
                accessibilityState={{ disabled: !mio }}
              >
                <View style={styles.grupoArriba}>
                  <View style={styles.icono}>
                    <Octicons
                      name={g.icono}
                      size={16}
                      color={mio ? TEXT : MUTED}
                    />
                  </View>
                  {mio ? (
                    <Badge n={g.noLeidos} />
                  ) : (
                    <Octicons name="lock" size={14} color={MUTED} />
                  )}
                </View>
                <View>
                  <Text style={[styles.grupoTitulo, !mio && styles.apagado]}>
                    {g.label}
                  </Text>
                  <Text style={styles.meta}>
                    {miembrosDe(g.id).length} miembros
                  </Text>
                </View>
                {mio && <Text style={styles.tuGrupo}>TU GRUPO</Text>}
              </Pressable>
            );
          })}
        </View>
        {!miGrupo && (
          <Text style={styles.nota}>
            Aún no perteneces a un grupo. Podrás unirte a uno al completar tu
            registro.
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
  presionado: {
    opacity: 0.6,
  },
  cabecera: {
    gap: 6,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 30,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  sub: {
    fontSize: 14,
    color: MUTED,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING,
  },
  meta: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  // Iglesia
  iglesia: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.6,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  iconoGrande: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  iglesiaTitulo: {
    fontFamily: SERIF,
    fontSize: 22,
    color: TEXT,
  },

  // Grupos (2 columnas)
  grilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING,
  },
  grupo: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: SPACING * 1.4,
    padding: SPACING * 1.4,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  grupoArriba: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  grupoTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT,
  },
  // grupos a los que no pertenece
  bloqueado: {
    backgroundColor: DARK_BG,
  },
  apagado: {
    color: MUTED,
  },
  nota: {
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
    textAlign: "center",
    marginTop: SPACING * 1.4,
  },
  tuGrupo: {
    position: "absolute",
    right: SPACING * 1.4,
    bottom: SPACING * 1.4,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: MUTED,
  },

  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: DARK_BG,
  },
});

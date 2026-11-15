import AvatarPersona from "@/components/AvatarPersona";
import {
  alternarAyudante,
  esAyudanteDe,
  esLiderDe,
  guiaSalaAhora,
  miembrosActuales,
  useAvatarDe,
  useEsLiderPrincipal,
  useGrupos,
  useMiembros,
  usePuede,
} from "@/store/estudios";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SPACING,
  TEXT,
  primarioAlfa,
} from "@/constants/constans";
import { GrupoId, Miembro } from "@/types/typesComunidad";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PerfilMiembro from "./PerfilMiembro";

// Miembros reales de la sala: en "general" toda la iglesia; en las demas,
// quienes entraron con la invitacion de esa sala. Esta persona siempre aparece
export function miembrosDe(grupo: GrupoId): Miembro[] {
  return miembrosActuales()
    .filter(
      (m) =>
        grupo === "general" ||
        m.sala === grupo ||
        m.id === "yo" ||
        // el lider y sus ayudantes estan aunque no usaron la invitacion
        guiaSalaAhora(grupo, m.nombre, m.id !== "yo" ? m.id : undefined),
    )
    .map((m) => ({
      nombre: m.nombre,
      ...(m.rol === "pastor" ? { rol: "Pastor", esPastor: true } : {}),
      ...(m.id !== "yo" ? { id: m.id } : {}),
      ...(m.esYo || m.id === "yo" ? { esYo: true } : {}),
      ...(m.sinChat ? { sinChat: true } : {}),
      ...(m.sinOracion ? { sinOracion: true } : {}),
    }));
}

// lider: puede escribirle en privado a cada hermano. El lider de la sala (o
// el pastor) ademas elige quienes le ayudan a administrarla
export default function MiembrosSala({
  grupo,
  lider,
}: {
  grupo: GrupoId;
  lider?: boolean;
}) {
  useMiembros(); // se actualiza cuando llegan del servidor
  const avatarDe = useAvatarDe();
  const miembros = miembrosDe(grupo);
  const admin = usePuede("roles"); // ve quien esta restringido
  const [viendo, setViendo] = useState<Miembro | null>(null);
  const sala = useGrupos().find((g) => g.id === grupo);
  // la de toda la iglesia la guia el pastor (sin ayudantes)
  const eligeAyudantes = useEsLiderPrincipal(grupo) && grupo !== "general";

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>{miembros.length} MIEMBROS</Text>
      {eligeAyudantes && miembros.length > 1 && (
        <View style={styles.ayuda}>
          <Octicons name="shield" size={14} color={PRIMARY} />
          <Text style={styles.ayudaTexto}>
            Toca <Text style={styles.fuerte}>Ayudante</Text> para que alguien
            te ayude a administrar la sala: publicar avisos y encuentros, dar
            la palabra y aprobar peticiones.
          </Text>
        </View>
      )}
      {miembros.map((m, i) => {
        const yo = !!m.esYo;
        // por su cuenta (dos "Pato" no son el mismo); sin ella, por nombre
        const esLiderSala = !!sala && esLiderDe(sala, m.nombre, m.id);
        const esAyudante = !!sala && esAyudanteDe(sala, m.nombre, m.id);
        const etiqueta =
          m.rol ?? (esLiderSala ? "Líder" : esAyudante ? "Ayudante" : null);
        // el pastor y el lider ya administran; uno no se nombra a si mismo
        const puedeNombrar =
          eligeAyudantes && !yo && !m.esPastor && !esLiderSala;
        return (
          <Pressable
            key={m.id ?? m.nombre}
            // tocarla abre su perfil
            onPress={() => setViendo(m)}
            style={({ pressed }) => [
              styles.fila,
              i > 0 && styles.conLinea,
              pressed && styles.presionado,
            ]}
            accessibilityLabel={`Ver el perfil de ${m.nombre}`}
          >
            <AvatarPersona
              nombre={m.nombre}
              avatar={avatarDe(m.nombre)}
              tamano={40}
            />
            <View style={styles.flex}>
              <Text style={styles.nombre}>
                {m.nombre}
                {yo && <Text style={styles.tu}> · Tú</Text>}
              </Text>
              {admin && (m.sinChat || m.sinOracion) && (
                <Text style={styles.restringido}>
                  {[m.sinChat && "Sin chat", m.sinOracion && "Sin oración"]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              )}
            </View>
            {puedeNombrar ? (
              <Pressable
                onPress={() => alternarAyudante(grupo, m.nombre, m.id)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.ayudante,
                  esAyudante && styles.ayudanteActivo,
                  pressed && styles.presionado,
                ]}
                accessibilityRole="switch"
                accessibilityState={{ checked: esAyudante }}
                accessibilityLabel={`${m.nombre} ayuda a administrar la sala`}
              >
                <Octicons
                  name={esAyudante ? "shield-check" : "shield"}
                  size={12}
                  color={esAyudante ? DARK_BG : MUTED}
                />
                <Text
                  style={[
                    styles.ayudanteTexto,
                    esAyudante && styles.ayudanteTextoActivo,
                  ]}
                >
                  Ayudante
                </Text>
              </Pressable>
            ) : (
              etiqueta && <Text style={styles.rol}>{etiqueta}</Text>
            )}
            {lider && !yo && (
              <Pressable
                onPress={() =>
                  router.push(
                    `/privado/${encodeURIComponent(m.nombre)}` as Href,
                  )
                }
                hitSlop={8}
                style={({ pressed }) => [
                  styles.mensaje,
                  pressed && styles.presionado,
                ]}
                accessibilityLabel={`Escribirle a ${m.nombre} en privado`}
              >
                <Octicons name="comment" size={14} color={TEXT} />
              </Pressable>
            )}
          </Pressable>
        );
      })}
      {viendo && (
        <PerfilMiembro
          miembro={viendo}
          lider={lider}
          onCerrar={() => setViendo(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
    paddingBottom: SPACING * 4,
  },
  titulo: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING / 2,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  avatarYo: {
    borderWidth: 1,
    borderColor: TEXT,
  },
  avatarTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
  },
  flex: {
    flex: 1,
  },
  nombre: {
    fontSize: 15,
    color: TEXT,
  },
  restringido: {
    fontSize: 12,
    color: PRIMARY,
    marginTop: 2,
  },
  tu: {
    color: MUTED,
  },
  mensaje: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  presionado: {
    opacity: 0.6,
  },
  ayuda: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING,
    padding: SPACING * 1.2,
    marginVertical: SPACING / 2,
    borderRadius: 14,
    backgroundColor: primarioAlfa(0.1),
  },
  ayudaTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: TEXT,
  },
  fuerte: {
    fontFamily: FUENTE.semibold,
  },
  ayudante: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  ayudanteActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  ayudanteTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: MUTED,
  },
  ayudanteTextoActivo: {
    color: DARK_BG,
  },
  rol: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: MUTED,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
});

import AvatarPersona from "@/components/AvatarPersona";
import {
  miembrosActuales,
  useAvatarDe,
  useMiembros,
  usePuede,
} from "@/store/estudios";
import {
  BORDER,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SPACING,
  TEXT,
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
    .filter((m) => grupo === "general" || m.sala === grupo || m.id === "yo")
    .map((m) => ({
      nombre: m.nombre,
      ...(m.rol === "pastor" ? { rol: "Pastor", esPastor: true } : {}),
      ...(m.id !== "yo" ? { id: m.id } : {}),
      ...(m.esYo || m.id === "yo" ? { esYo: true } : {}),
      ...(m.sinChat ? { sinChat: true } : {}),
      ...(m.sinOracion ? { sinOracion: true } : {}),
    }));
}

// lider: puede escribirle en privado a cada hermano
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

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>{miembros.length} MIEMBROS</Text>
      {miembros.map((m, i) => {
        const yo = !!m.esYo;
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
            {m.rol && <Text style={styles.rol}>{m.rol}</Text>}
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

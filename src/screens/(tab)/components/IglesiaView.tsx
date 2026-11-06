import { MENSAJES } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  GRUPOS,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { miembrosDe } from "@/screens/sala/components/MiembrosSala";
import { elegirGrupo, useEstudios } from "@/store/estudios";
import { Grupo } from "@/types/typesComunidad";
import { grupoDeInvitacion } from "@/utils/invitacion";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Sala = Grupo & { noLeidos: number };

// Contador de mensajes sin leer
const Badge = ({ n }: { n: number }) =>
  n > 0 ? (
    <View style={styles.badge}>
      <Text style={styles.badgeTexto}>{n > 9 ? "9+" : n}</Text>
    </View>
  ) : null;

// Sala con acceso: tarjeta grande que abre el chat
function SalaAbierta({
  titulo,
  meta,
  sala,
  claro,
  onPress,
}: {
  titulo: string;
  meta: string;
  sala: Sala;
  claro: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.abierta, pressed && styles.presionado]}
    >
      <View style={[styles.iconoGrande, { backgroundColor: claro }]}>
        <Octicons name={sala.icono} size={20} color={DARK_BG} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.abiertaTitulo}>{titulo}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <Badge n={sala.noLeidos} />
      <Octicons name="chevron-right" size={16} color={MUTED} />
    </Pressable>
  );
}

// Salas: la iglesia, la sala de tu grupo y el resto (solo con invitacion)
export default function IglesiaView() {
  const { mensajes, vistos, grupo: miGrupo } = useEstudios();
  const [invitando, setInvitando] = useState(false);
  const [enlace, setEnlace] = useState("");
  const [error, setError] = useState(false);
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
  const mia = salas.find((s) => s.id === miGrupo && s.id !== iglesia.id);
  const otras = salas.filter((s) => s.id !== iglesia.id && s.id !== mia?.id);
  const abrir = (id: string) => router.push(`/sala/${id}` as Href);

  const usarInvitacion = () => {
    const id = grupoDeInvitacion(enlace);
    if (!id) return setError(true);
    elegirGrupo(id);
    setEnlace("");
    setInvitando(false);
    abrir(id);
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>
          Somos <Text style={styles.cursiva}>una iglesia</Text>
        </Text>
        <Text style={styles.sub}>Entra a una sala para conversar y orar.</Text>
      </View>

      {/* Salas a las que tiene acceso */}
      <View style={styles.bloque}>
        <Text style={styles.seccion}>TUS SALAS</Text>
        <SalaAbierta
          titulo="Mi iglesia"
          meta={`${iglesia.descripcion} · ${miembrosDe(iglesia.id).length} miembros`}
          sala={iglesia}
          claro={TEXT}
          onPress={() => abrir(iglesia.id)}
        />
        {mia ? (
          <SalaAbierta
            titulo={mia.label}
            meta={`Tu grupo · ${miembrosDe(mia.id).length} miembros`}
            sala={mia}
            claro={mia.tono ?? TEXT}
            onPress={() => abrir(mia.id)}
          />
        ) : (
          // Sin grupo: entra con el enlace que le envia su lider
          <View style={styles.invitacion}>
            <View style={styles.invitacionFila}>
              <View style={styles.iconoInvitacion}>
                <Octicons name="link" size={16} color={TEXT} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.invitacionTitulo}>Tu sala de grupo</Text>
                <Text style={styles.meta}>
                  Tu líder te enviará un enlace para entrar a la sala de tu
                  grupo.
                </Text>
              </View>
            </View>

            {invitando ? (
              <View style={styles.invitacionForm}>
                <TextInput
                  value={enlace}
                  onChangeText={(t) => {
                    setEnlace(t);
                    setError(false);
                  }}
                  onSubmitEditing={usarInvitacion}
                  placeholder="Pega el enlace o código"
                  placeholderTextColor={MUTED}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  style={[styles.input, error && styles.inputError]}
                />
                {error && (
                  <Text style={styles.error}>
                    Ese enlace no es válido. Pídele uno nuevo a tu líder.
                  </Text>
                )}
                <Pressable
                  onPress={usarInvitacion}
                  disabled={!enlace.trim()}
                  style={({ pressed }) => [
                    styles.boton,
                    !enlace.trim() && styles.botonApagado,
                    pressed && styles.presionado,
                  ]}
                >
                  <Text style={styles.botonTexto}>Entrar a la sala</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setInvitando(true)}
                style={({ pressed }) => [
                  styles.botonSecundario,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.botonSecundarioTexto}>
                  Tengo una invitación
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Resto de grupos: solo se entra con invitacion */}
      <View style={styles.bloque}>
        <Text style={styles.seccion}>OTROS GRUPOS</Text>
        <View style={styles.lista}>
          {otras.map((g, i) => (
            <View
              key={g.id}
              style={[styles.fila, i > 0 && styles.filaBorde]}
              accessibilityLabel={`${g.label}, solo con invitación`}
            >
              <View style={styles.icono}>
                <Octicons name={g.icono} size={14} color={MUTED} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.filaTitulo}>{g.label}</Text>
                <Text style={styles.meta}>
                  {miembrosDe(g.id).length} miembros
                </Text>
              </View>
              <View style={styles.chip}>
                <Octicons name="lock" size={11} color={MUTED} />
                <Text style={styles.chipTexto}>Con invitación</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING * 2.4,
    paddingTop: SPACING,
  },
  bloque: {
    gap: SPACING,
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
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    marginTop: 2,
  },

  // Salas con acceso
  abierta: {
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
  },
  abiertaTitulo: {
    fontFamily: SERIF,
    fontSize: 22,
    color: TEXT,
  },

  // Invitacion (sin grupo)
  invitacion: {
    gap: SPACING * 1.4,
    padding: SPACING * 1.6,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  invitacionFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
  },
  iconoInvitacion: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  invitacionTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT,
  },
  invitacionForm: {
    gap: SPACING,
  },
  input: {
    height: 46,
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    color: TEXT,
    fontSize: 14,
  },
  inputError: {
    borderColor: PRIMARY,
  },
  error: {
    fontSize: 12,
    color: PRIMARY,
  },
  boton: {
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonApagado: {
    opacity: 0.4,
  },
  botonTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: DARK_BG,
  },
  botonSecundario: {
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  botonSecundarioTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },

  // Otros grupos (lista compacta)
  lista: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: "hidden",
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING * 1.2,
    paddingHorizontal: SPACING * 1.4,
  },
  filaBorde: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  icono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  filaTitulo: {
    fontSize: 15,
    fontWeight: "500",
    color: TEXT,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: SURFACE,
  },
  chipTexto: {
    fontSize: 11,
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

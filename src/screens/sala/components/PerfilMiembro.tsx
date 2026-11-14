import AvatarPersona from "@/components/AvatarPersona";
import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  LINEA,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import {
  restringir,
  useAvatarDe,
  useEstudios,
  useGrupos,
  useMiembros,
  usePuede,
  useRoles,
} from "@/store/estudios";
import { Miembro } from "@/types/typesComunidad";
import { horaTurno } from "@/utils/cultos";
import { unirTurnos } from "@/utils/turnos";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

const hoyKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Perfil de una persona de la iglesia (al tocarla en Miembros): su foto,
// rol, desde cuando esta, su sala y sus proximos turnos. El pastor (o quien
// administra roles) ademas puede restringirla: sin chat o sin pedir oracion
export default function PerfilMiembro({
  miembro,
  lider,
  onCerrar,
}: {
  miembro: Miembro;
  lider?: boolean; // puede escribirle en privado
  onCerrar: () => void;
}) {
  const avatarDe = useAvatarDe();
  const todos = useMiembros();
  const grupos = useGrupos();
  const roles = useRoles();
  const { turnosEditados } = useEstudios();
  const admin = usePuede("roles");

  // los datos completos (los que vienen del servidor)
  const datos =
    todos.find((m) => miembro.id && m.id === miembro.id) ??
    todos.find((m) => m.nombre === miembro.nombre);
  const sala =
    datos?.sala && datos.sala !== "general"
      ? grupos.find((g) => g.id === datos.sala)?.label
      : undefined;
  const desde = datos?.unido
    ? new Date(datos.unido).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : undefined;

  // sus proximos turnos (por su nombre exacto, como en el cronograma)
  const hoy = hoyKey();
  const turnos = unirTurnos(turnosEditados)
    .filter((t) => t.persona.trim() === miembro.nombre.trim() && t.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 3);

  // se puede restringir a un hermano (no al pastor ni a uno mismo)
  const restringible =
    admin && !miembro.esYo && !miembro.esPastor && !!datos?.id;
  const sinChat = !!datos?.sinChat;
  const sinOracion = !!datos?.sinOracion;
  const cambiar = (c: Partial<{ sinChat: boolean; sinOracion: boolean }>) =>
    datos?.id && restringir(datos.id, { sinChat, sinOracion, ...c });

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <ConBordes>
        {(insets) => (
          <View style={styles.fondo}>
            <Pressable style={styles.flex} onPress={onCerrar} />
            <View
              style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}
            >
              <View style={styles.asa} />
              <ScrollView
                contentContainerStyle={styles.contenido}
                showsVerticalScrollIndicator={false}
              >
                {/* Quien es */}
                <View style={styles.cabecera}>
                  <AvatarPersona
                    nombre={miembro.nombre}
                    avatar={avatarDe(miembro.nombre)}
                    tamano={88}
                  />
                  <Text style={styles.nombre}>
                    {miembro.nombre}
                    {miembro.esYo && <Text style={styles.tu}> · Tú</Text>}
                  </Text>
                  <View style={styles.etiquetas}>
                    <View style={styles.etiqueta}>
                      <Text style={styles.etiquetaTexto}>
                        {miembro.esPastor ? "Pastor" : "Hermano/a"}
                      </Text>
                    </View>
                    {!!sala && (
                      <View style={styles.etiqueta}>
                        <Octicons name="people" size={11} color={MUTED} />
                        <Text style={styles.etiquetaTexto}>{sala}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Datos */}
                <View style={styles.tarjeta}>
                  <Fila
                    icono="calendar"
                    titulo="Miembro desde"
                    valor={desde ?? "—"}
                  />
                  <Fila
                    icono="checklist"
                    titulo="Próximos turnos"
                    valor={turnos.length ? String(turnos.length) : "Ninguno"}
                    linea
                  />
                  {turnos.map((t) => (
                    <Text key={`${t.fecha}-${t.rol}`} style={styles.turno}>
                      •{" "}
                      {new Date(`${t.fecha}T12:00:00`).toLocaleDateString(
                        "es-ES",
                        { weekday: "short", day: "numeric", month: "short" },
                      )}{" "}
                      · {roles.de(t.rol).label}
                      {horaTurno(t) ? ` · ${horaTurno(t)} hrs` : ""}
                    </Text>
                  ))}
                </View>

                {/* Escribirle en privado */}
                {lider && !miembro.esYo && (
                  <Pressable
                    onPress={() => {
                      onCerrar();
                      router.push(
                        `/privado/${encodeURIComponent(miembro.nombre)}` as Href,
                      );
                    }}
                    style={({ pressed }) => [
                      styles.boton,
                      pressed && styles.presionado,
                    ]}
                  >
                    <Octicons name="comment" size={15} color={DARK_BG} />
                    <Text style={styles.botonTexto}>Escribirle en privado</Text>
                  </Pressable>
                )}

                {/* Solo el admin: restringir */}
                {restringible && (
                  <View style={styles.tarjeta}>
                    <Text style={styles.seccion}>PERMISOS EN LA IGLESIA</Text>
                    <Interruptor
                      titulo="Puede escribir en el chat"
                      texto="Si lo apagas, solo podrá leer los chats de las salas."
                      valor={!sinChat}
                      onCambiar={(v) => cambiar({ sinChat: !v })}
                    />
                    <Interruptor
                      titulo="Puede pedir oración"
                      texto="Si lo apagas, no podrá enviar peticiones al muro."
                      valor={!sinOracion}
                      onCambiar={(v) => cambiar({ sinOracion: !v })}
                      linea
                    />
                  </View>
                )}
                {/* el hermano restringido lo ve en su propio perfil */}
                {miembro.esYo && (sinChat || sinOracion) && (
                  <Text style={styles.aviso}>
                    {[
                      sinChat && "Tu pastor desactivó tus mensajes en el chat.",
                      sinOracion &&
                        "Tu pastor desactivó tus peticiones de oración.",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </ConBordes>
    </Modal>
  );
}

function Fila({
  icono,
  titulo,
  valor,
  linea,
}: {
  icono: "calendar" | "checklist";
  titulo: string;
  valor: string;
  linea?: boolean;
}) {
  return (
    <View style={[styles.fila, linea && styles.conLinea]}>
      <Octicons name={icono} size={15} color={MUTED} />
      <Text style={styles.filaTitulo}>{titulo}</Text>
      <Text style={styles.filaValor}>{valor}</Text>
    </View>
  );
}

function Interruptor({
  titulo,
  texto,
  valor,
  onCambiar,
  linea,
}: {
  titulo: string;
  texto: string;
  valor: boolean;
  onCambiar: (v: boolean) => void;
  linea?: boolean;
}) {
  return (
    <View style={[styles.fila, linea && styles.conLinea]}>
      <View style={styles.flex}>
        <Text style={styles.filaTitulo}>{titulo}</Text>
        <Text style={styles.ayuda}>{texto}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={onCambiar}
        trackColor={{ false: BORDER, true: PRIMARY }}
        thumbColor="#FFFFFF"
        accessibilityLabel={titulo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  fondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  hoja: {
    maxHeight: "88%",
    paddingTop: SPACING,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: LINEA,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: LINEA,
  },
  contenido: {
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING * 1.6,
    gap: SPACING * 1.4,
  },
  cabecera: {
    alignItems: "center",
    gap: SPACING,
  },
  nombre: {
    fontFamily: SERIF,
    fontSize: 26,
    color: TEXT,
    textAlign: "center",
  },
  tu: {
    color: MUTED,
  },
  etiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  etiqueta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  etiquetaTexto: {
    fontSize: 12,
    color: MUTED,
  },
  tarjeta: {
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: SPACING / 2,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingVertical: SPACING,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  filaTitulo: {
    flex: 1,
    fontFamily: FUENTE.medium,
    fontSize: 14,
    color: TEXT,
  },
  filaValor: {
    fontSize: 14,
    color: MUTED,
  },
  turno: {
    fontSize: 13,
    color: MUTED,
    paddingLeft: SPACING * 2.5,
    paddingBottom: 4,
  },
  ayuda: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    marginTop: 2,
  },
  boton: {
    flexDirection: "row",
    gap: 8,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: DARK_BG,
  },
  aviso: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    textAlign: "center",
  },
});

import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  HOME_PADDING as PADDING,
  MUTED,
  DARK_BG,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
  ELEVADO,
  ES_CLARO,
  LINEA,
  PLACEHOLDER,
  primarioAlfa,
} from "@/constants/constans";
import AvatarPersona from "@/components/AvatarPersona";
import {
  enviarMensaje,
  reaccionar,
  useAvatarDe,
  useEsLider,
  useEstudios,
  useMisRestricciones,
} from "@/store/estudios";
import { EMOJIS_REACCION } from "@/services/chat";
import { esUuid } from "@/services/iglesias";
import { Grupo, Mensaje } from "@/types/typesComunidad";
import { horaMensaje } from "@/utils/tiempo";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import CompartirVersiculo from "./CompartirVersiculo";
import ModalPublicarLider from "./ModalPublicarLider";
import ModalVersiculo from "./ModalVersiculo";
import NotaVoz from "./NotaVoz";

const nuevoId = () => `m${Date.now()}`;

// Como WhatsApp: cada persona con su color de nombre (siempre el mismo).
// En fondo claro, tonos mas oscuros para que se lean
const COLORES_NOMBRE = ES_CLARO
  ? [
      "#1A73B8",
      "#C2364A",
      "#B5560F",
      "#3F7D20",
      "#7B3FB0",
      "#0F7F73",
      "#B0306F",
      "#8A6A00",
    ]
  : [
      "#53BDEB",
      "#F15C6D",
      "#FFB86C",
      "#A5D86E",
      "#C792EA",
      "#4FD1C5",
      "#F78FB3",
      "#FFD166",
    ];
const colorDe = (nombre: string) => {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES_NOMBRE[h % COLORES_NOMBRE.length];
};
// mis mensajes: el color del tema que eligio (rojo, azul, verde...)
const MIO = primarioAlfa(ES_CLARO ? 0.16 : 0.3);
const AVATAR = 28;

export default function ChatSala({
  sala,
  cerrado,
  privado,
}: {
  sala: Grupo;
  cerrado?: boolean; // el pastor apago el chat: solo el lider publica avisos
  privado?: boolean; // chat de dos personas (sin avisos para todos)
}) {
  const grupo = sala.id;
  const { mensajes, nombre, vaciados } = useEstudios();
  // vacio el chat: solo ve lo que llego despues
  const desde = vaciados?.[sala.id] ?? "";
  const yo = nombre?.trim() || USUARIO.nombre;
  const [texto, setTexto] = useState("");
  // hoja para compartir un versiculo (texto o audio)
  const [compartir, setCompartir] = useState(false);
  // mensaje cuyo versiculo se esta leyendo
  const [leyendo, setLeyendo] = useState<Mensaje | null>(null);
  // mensaje al que se le esta eligiendo una reaccion (mantener presionado)
  const [reaccionando, setReaccionando] = useState<Mensaje | null>(null);
  // lider del grupo (o pastor/administrador): avisos y devocionales
  const lider = useEsLider(grupo) && !privado;
  const avatarDe = useAvatarDe();
  // el pastor no lo deja escribir en las salas (el servidor tambien lo impide)
  const { sinChat } = useMisRestricciones();
  const silenciado = !privado && !lider && sinChat;
  const [publicando, setPublicando] = useState(false);

  // Mas nuevo primero: la lista va invertida (el ultimo queda abajo)
  const lista = [...mensajes]
    .filter((m) => m.grupo === grupo && m.fecha > desde)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const enviar = () => {
    const limpio = texto.trim();
    if (!limpio) return;
    enviarMensaje({
      id: nuevoId(),
      grupo,
      autor: yo,
      texto: limpio,
      fecha: new Date().toISOString(),
    });
    setTexto("");
  };

  return (
    <View style={styles.flex}>
      <FlatList
        data={lista}
        keyExtractor={(m) => m.id}
        inverted
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => {
          // Aviso o devocional del lider: tarjeta a lo ancho
          if (item.tipo) {
            const devocional = item.tipo === "devocional";
            return (
              <View
                style={[styles.lider, devocional && styles.liderDevocional]}
              >
                <View style={styles.liderCabecera}>
                  <Octicons
                    name={devocional ? "book" : "megaphone"}
                    size={12}
                    color={PRIMARY}
                  />
                  <Text style={styles.liderEtiqueta}>
                    {devocional ? "DEVOCIONAL" : "AVISO"} · {item.autor}
                  </Text>
                </View>
                {!!item.para?.length && (
                  <Text style={styles.liderPara}>
                    Para: {item.para.join(", ")}
                  </Text>
                )}
                {!!item.titulo && (
                  <Text style={styles.liderTitulo}>{item.titulo}</Text>
                )}
                {!!item.cita && (
                  <Pressable
                    onPress={() => setLeyendo(item)}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.cita,
                      pressed && styles.presionado,
                    ]}
                    accessibilityLabel={`Leer ${item.cita}`}
                  >
                    <Octicons name="book" size={11} color={MUTED} />
                    <Text style={styles.citaTexto}>
                      {item.cita.toUpperCase()}
                    </Text>
                    <Octicons name="chevron-right" size={11} color={MUTED} />
                  </Pressable>
                )}
                <Text style={styles.texto}>{item.texto}</Text>
                <Text style={styles.hora}>{horaMensaje(item.fecha)}</Text>
              </View>
            );
          }
          const mio = item.mio ?? item.autor === yo;
          // en la lista invertida, el mensaje anterior es el siguiente indice
          const anterior = lista[index + 1];
          const primero = anterior?.autor !== item.autor || !!anterior?.tipo;
          const mostrarNombre = !mio && !privado && primero;
          // reacciones: solo en las salas y en mensajes que ya llegaron
          const reaccionable = !privado && !item.pendiente && esUuid(item.id);
          const reacciones = Object.entries(item.reacciones ?? {}).filter(
            ([, n]) => n > 0,
          );
          const burbuja = (
            <Pressable
              onLongPress={
                reaccionable ? () => setReaccionando(item) : undefined
              }
              delayLongPress={300}
              style={[
                styles.burbuja,
                mio ? styles.burbujaMia : styles.burbujaOtra,
                !primero && (mio ? styles.seguidoMio : styles.seguido),
              ]}
              accessibilityHint={
                reaccionable ? "Mantén presionado para reaccionar" : undefined
              }
            >
              {mostrarNombre && (
                <Text style={[styles.autor, { color: colorDe(item.autor) }]}>
                  {item.autor}
                </Text>
              )}
              {!!item.desafio && (
                <Text style={styles.desafio}>★ PALABRA DE LA SEMANA</Text>
              )}
              {/* versiculo sobre el que comparte */}
              {/* tocarla abre la palabra que eligio */}
              {!!item.cita && (
                <Pressable
                  onPress={() => setLeyendo(item)}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.cita,
                    pressed && styles.presionado,
                  ]}
                  accessibilityLabel={`Leer ${item.cita}`}
                >
                  <Octicons name="book" size={11} color={MUTED} />
                  <Text style={styles.citaTexto}>
                    {item.cita.toUpperCase()}
                  </Text>
                  <Octicons name="chevron-right" size={11} color={MUTED} />
                </Pressable>
              )}
              {item.audio && <NotaVoz audio={item.audio} />}
              {item.audioVencido && (
                <Text style={styles.vencido}>
                  🎤 Nota de voz (ya no está disponible)
                </Text>
              )}
              {!!item.texto && <Text style={styles.texto}>{item.texto}</Text>}
              <Text style={styles.hora}>
                {horaMensaje(item.fecha)}
                {/* reloj: aun no llega a los demas (se reintenta solo) */}
                {mio ? (item.pendiente ? "  🕓" : "  ✓") : ""}
              </Text>
              {/* reacciones (tocar una pone o quita la mia) */}
              {reacciones.length > 0 && (
                <View style={[styles.reacciones, mio && styles.reaccionesMias]}>
                  {reacciones.map(([emoji, n]) => (
                    <Pressable
                      key={emoji}
                      onPress={() => reaccionar(item.id, emoji)}
                      hitSlop={4}
                      style={[
                        styles.reaccion,
                        item.miReaccion === emoji && styles.reaccionMia,
                      ]}
                      accessibilityLabel={`${emoji} ${n}`}
                    >
                      <Text style={styles.reaccionTexto}>
                        {emoji}
                        {n > 1 ? ` ${n}` : ""}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Pressable>
          );
          if (mio || privado) return burbuja;
          // de otro: su foto a la izquierda (solo en el primero de la tanda)
          return (
            <View style={styles.filaOtro}>
              {primero ? (
                <AvatarPersona
                  nombre={item.autor}
                  avatar={avatarDe(item.autor)}
                  tamano={AVATAR}
                />
              ) : (
                <View style={styles.sinAvatar} />
              )}
              {burbuja}
            </View>
          );
        }}
      />

      {/* Chat cerrado: nadie escribe (el lider aun puede publicar avisos) */}
      {cerrado && (
        <View style={styles.cerrado}>
          <Octicons name="lock" size={14} color={MUTED} />
          <Text style={styles.cerradoTexto}>
            {lider
              ? "El chat está cerrado. Solo tú puedes publicar avisos y devocionales."
              : "En esta sala no se puede hablar. Aquí verás los avisos y devocionales del líder."}
          </Text>
          {lider && (
            <Pressable
              onPress={() => setPublicando(true)}
              style={({ pressed }) => [
                styles.versiculo,
                styles.publicar,
                pressed && styles.presionado,
              ]}
              accessibilityLabel="Publicar aviso o devocional"
            >
              <Octicons name="megaphone" size={17} color={DARK_BG} />
            </Pressable>
          )}
        </View>
      )}

      {/* Silenciado por el pastor: puede leer, no escribir */}
      {silenciado && !cerrado && (
        <View style={styles.cerrado}>
          <Octicons name="mute" size={14} color={MUTED} />
          <Text style={styles.cerradoTexto}>
            Tu pastor desactivó tus mensajes en el chat. Puedes seguir leyendo
            la conversación.
          </Text>
        </View>
      )}

      {/* Escribir */}
      {!cerrado && !silenciado && (
        <View style={styles.barra}>
          {lider && (
            <Pressable
              onPress={() => setPublicando(true)}
              style={({ pressed }) => [
                styles.versiculo,
                styles.publicar,
                pressed && styles.presionado,
              ]}
              accessibilityLabel="Publicar aviso o devocional"
            >
              <Octicons name="megaphone" size={17} color={DARK_BG} />
            </Pressable>
          )}
          <Pressable
            onPress={() => setCompartir(true)}
            style={({ pressed }) => [
              styles.versiculo,
              pressed && styles.presionado,
            ]}
            accessibilityLabel="Compartir un versículo"
          >
            <Octicons name="book" size={18} color={TEXT} />
          </Pressable>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Mensaje"
            placeholderTextColor={PLACEHOLDER}
            multiline
            numberOfLines={1} // empieza en una sola linea (en web era de 2)
            style={styles.input}
          />
          <Pressable
            onPress={enviar}
            disabled={!texto.trim()}
            style={({ pressed }) => [
              styles.enviar,
              !texto.trim() && styles.enviarApagado,
              pressed && styles.presionado,
            ]}
            accessibilityLabel="Enviar mensaje"
          >
            <Octicons name="paper-airplane" size={16} color={DARK_BG} />
          </Pressable>
        </View>
      )}

      <CompartirVersiculo
        sala={sala}
        visible={compartir}
        onCerrar={() => setCompartir(false)}
      />
      <ModalVersiculo mensaje={leyendo} onCerrar={() => setLeyendo(null)} />
      {/* Elegir reaccion (como WhatsApp) */}
      <Modal
        visible={!!reaccionando}
        transparent
        animationType="fade"
        onRequestClose={() => setReaccionando(null)}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <Pressable
          style={styles.reaccionFondo}
          onPress={() => setReaccionando(null)}
        >
          <View style={styles.reaccionBarra}>
            {EMOJIS_REACCION.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  if (reaccionando) reaccionar(reaccionando.id, emoji);
                  setReaccionando(null);
                }}
                style={({ pressed }) => [
                  styles.reaccionOpcion,
                  reaccionando?.miReaccion === emoji && styles.reaccionMia,
                  pressed && styles.presionado,
                ]}
                accessibilityLabel={`Reaccionar con ${emoji}`}
              >
                <Text style={styles.reaccionGrande}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
          {!!reaccionando?.texto && (
            <Text style={styles.reaccionCita} numberOfLines={2}>
              «{reaccionando.texto}»
            </Text>
          )}
        </Pressable>
      </Modal>
      {publicando && (
        <ModalPublicarLider sala={sala} onCerrar={() => setPublicando(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  lista: {
    paddingHorizontal: PADDING,
    paddingVertical: SPACING,
    gap: 6,
  },
  burbuja: {
    maxWidth: "80%",
    paddingHorizontal: SPACING * 1.2,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 16,
  },
  burbujaMia: {
    alignSelf: "flex-end",
    backgroundColor: MIO,
    borderTopRightRadius: 4,
  },
  burbujaOtra: {
    alignSelf: "flex-start",
    backgroundColor: ELEVADO,
    borderTopLeftRadius: 4,
  },
  // los siguientes de la misma persona: sin "colita"
  seguido: {
    borderTopLeftRadius: 16,
  },
  seguidoMio: {
    borderTopRightRadius: 16,
  },
  filaOtro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  sinAvatar: {
    width: AVATAR,
  },
  autor: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  cerrado: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: PADDING,
    paddingVertical: SPACING * 1.2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  cerradoTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: MUTED,
  },
  publicar: {
    backgroundColor: TEXT,
  },
  // aviso / devocional del lider
  lider: {
    alignSelf: "stretch",
    gap: 6,
    marginVertical: 6,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINEA,
  },
  liderDevocional: {
    borderColor: PRIMARY,
  },
  liderCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liderEtiqueta: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: PRIMARY,
  },
  liderPara: {
    fontSize: 12,
    fontWeight: "600",
    color: MUTED,
  },
  liderTitulo: {
    fontFamily: SERIF,
    fontSize: 20,
    color: TEXT,
  },
  desafio: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: PRIMARY,
    marginBottom: 4,
  },
  cita: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  citaTexto: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: MUTED,
  },
  reacciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  reaccionesMias: {
    justifyContent: "flex-end",
  },
  reaccion: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: DARK_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  reaccionMia: {
    borderColor: PRIMARY,
    backgroundColor: primarioAlfa(0.15),
  },
  reaccionTexto: {
    fontSize: 12,
    color: TEXT,
  },
  reaccionFondo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING * 1.4,
    padding: SPACING * 2,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  reaccionBarra: {
    flexDirection: "row",
    gap: 6,
    padding: 8,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  reaccionOpcion: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  reaccionGrande: {
    fontSize: 26,
  },
  reaccionCita: {
    maxWidth: 300,
    fontSize: 13,
    color: "#E0E0E0",
    textAlign: "center",
  },
  vencido: {
    fontSize: 13,
    fontStyle: "italic",
    color: MUTED,
  },
  texto: {
    fontSize: 15,
    lineHeight: 21,
    color: TEXT,
  },
  hora: {
    alignSelf: "flex-end",
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
  },

  // Barra para escribir
  barra: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING,
    paddingHorizontal: PADDING,
    paddingVertical: SPACING,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  // mismo alto que los botones redondos (42) y crece al escribir mas
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    paddingHorizontal: SPACING * 1.6,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: 21,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    fontSize: 15,
    lineHeight: 20,
    color: TEXT,
    textAlignVertical: "center",
    outlineWidth: 0,
  },
  versiculo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  enviar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  enviarApagado: {
    opacity: 0.4,
  },
  presionado: {
    opacity: 0.7,
  },
});

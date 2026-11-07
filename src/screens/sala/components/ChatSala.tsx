import { MENSAJES } from "@/assets/data/comunidadMocks";
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
  LINEA,
} from "@/constants/constans";
import { enviarMensaje, useEsLider, useEstudios } from "@/store/estudios";
import { Grupo, Mensaje } from "@/types/typesComunidad";
import { horaMensaje } from "@/utils/tiempo";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  FlatList,
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
  const { mensajes } = useEstudios();
  const [texto, setTexto] = useState("");
  // hoja para compartir un versiculo (texto o audio)
  const [compartir, setCompartir] = useState(false);
  // mensaje cuyo versiculo se esta leyendo
  const [leyendo, setLeyendo] = useState<Mensaje | null>(null);
  // lider del grupo (o pastor/administrador): avisos y devocionales
  const lider = useEsLider(grupo) && !privado;
  const [publicando, setPublicando] = useState(false);

  // Mas nuevo primero: la lista va invertida (el ultimo queda abajo)
  const lista = [...MENSAJES, ...mensajes]
    .filter((m) => m.grupo === grupo)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const enviar = () => {
    const limpio = texto.trim();
    if (!limpio) return;
    enviarMensaje({
      id: nuevoId(),
      grupo,
      autor: USUARIO.nombre,
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
          const mio = item.autor === USUARIO.nombre;
          // en la lista invertida, el mensaje anterior es el siguiente indice
          const anterior = lista[index + 1];
          const mostrarNombre = !mio && anterior?.autor !== item.autor;
          return (
            <View
              style={[
                styles.burbuja,
                mio ? styles.burbujaMia : styles.burbujaOtra,
                !mostrarNombre && !mio && styles.seguido,
              ]}
            >
              {mostrarNombre && <Text style={styles.autor}>{item.autor}</Text>}
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
              {!!item.texto && <Text style={styles.texto}>{item.texto}</Text>}
              <Text style={styles.hora}>{horaMensaje(item.fecha)}</Text>
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

      {/* Escribir */}
      {!cerrado && (
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
            placeholderTextColor="#666666"
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
    backgroundColor: ELEVADO,
    borderBottomRightRadius: 4,
  },
  burbujaOtra: {
    alignSelf: "flex-start",
    backgroundColor: SURFACE,
    borderBottomLeftRadius: 4,
  },
  seguido: {
    borderTopLeftRadius: 4,
  },
  autor: {
    fontSize: 12,
    fontWeight: "600",
    color: "#BDBDBD",
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

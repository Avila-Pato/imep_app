import { MENSAJES } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  HOME_PADDING as PADDING,
  MUTED,
  DARK_BG,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { enviarMensaje, useEstudios } from "@/store/estudios";
import { GrupoId } from "@/types/typesComunidad";
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

const nuevoId = () => `m${Date.now()}`;

export default function ChatSala({ grupo }: { grupo: GrupoId }) {
  const { mensajes } = useEstudios();
  const [texto, setTexto] = useState("");

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
        ListEmptyComponent={
          <Text style={styles.vacio}>
            Aún no hay mensajes. ¡Saluda a la sala! 👋
          </Text>
        }
        renderItem={({ item, index }) => {
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
              <Text style={styles.texto}>{item.texto}</Text>
              <Text style={styles.hora}>{horaMensaje(item.fecha)}</Text>
            </View>
          );
        }}
      />

      {/* Escribir */}
      <View style={styles.barra}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Mensaje"
          placeholderTextColor="#666666"
          multiline
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
  vacio: {
    textAlign: "center",
    color: MUTED,
    fontSize: 13,
    paddingVertical: SPACING * 4,
    // la lista esta invertida: se endereza el texto
    transform: [{ scaleY: -1 }],
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
    backgroundColor: "#2C2C2C",
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
  input: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: SPACING * 1.6,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 22,
    backgroundColor: SURFACE,
    fontSize: 15,
    color: TEXT,
    outlineWidth: 0,
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

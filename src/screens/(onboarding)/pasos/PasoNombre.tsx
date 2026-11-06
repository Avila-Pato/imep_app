import { BORDER, SPACING, TEXT } from "@/constants/constans";
import { guardarPerfil, useEstudios } from "@/store/estudios";
import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

// "¿Cómo te llamamos?"
export default function PasoNombre({ onSeguir }: { onSeguir: () => void }) {
  const [nombre, setNombre] = useState(useEstudios().nombre ?? "");
  const listo = nombre.trim().length >= 2;

  const seguir = () => {
    if (!listo) return;
    guardarPerfil({ nombre: nombre.trim() });
    onSeguir();
  };

  return (
    <Paso
      pie={
        <BotonPrincipal
          texto="Continuar"
          onPress={seguir}
          deshabilitado={!listo}
        />
      }
    >
      <Titulo texto="¿Cómo te " destacado="llamamos?" />
      <Subtitulo>
        Tu nombre aparecerá en tu perfil, en las salas y en tus peticiones de
        oración.
      </Subtitulo>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        onSubmitEditing={seguir}
        placeholder="Tu nombre…"
        placeholderTextColor="#555555"
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        style={styles.input}
      />
    </Paso>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: SPACING * 2,
    paddingVertical: 12,
    fontSize: 20,
    color: TEXT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
});

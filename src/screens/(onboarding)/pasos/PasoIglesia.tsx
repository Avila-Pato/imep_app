import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import FormIglesia from "@/screens/(tab)/components/FormIglesia";
import {
  agregarIglesia,
  elegirIglesia,
  fijarIglesia,
  quitarIglesia,
  useIglesias,
} from "@/store/estudios";
import { Iglesia } from "@/types/typesHome";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

// Solo el pastor: nombre y ubicacion de sus iglesias (puede dirigir mas de
// una). Los hermanos veran la suya en el mapa al unirse con su invitacion
export default function PasoIglesia({ onSeguir }: { onSeguir: () => void }) {
  const iglesias = useIglesias();
  // "nueva" = formulario vacio; una iglesia = editandola; null = la lista
  const [editando, setEditando] = useState<Iglesia | "nueva" | null>(null);
  const formulario = editando !== null || iglesias.length === 0;

  return (
    <Paso
      pie={
        !formulario && <BotonPrincipal texto="Continuar" onPress={onSeguir} />
      }
    >
      <Titulo
        texto={iglesias.length > 1 ? "¿Dónde están tus " : "¿Dónde está tu "}
        destacado={iglesias.length > 1 ? "iglesias?" : "iglesia?"}
      />
      <Subtitulo>
        {formulario
          ? "Los hermanos verán aquí la ubicación al unirse. Si diriges más de una iglesia, podrás agregar las demás después de esta."
          : "¿Diriges más de una? Agrégalas todas. Podrás cambiarlas cuando quieras desde Anuncios o tu Perfil."}
      </Subtitulo>

      {formulario ? (
        <View style={styles.form}>
          <FormIglesia
            key={editando === null ? "primera" : String(iglesias.length)}
            inicial={editando && editando !== "nueva" ? editando : undefined}
            textoBoton={iglesias.length === 0 ? "Continuar" : "Guardar iglesia"}
            onGuardar={(i) => {
              if (editando && editando !== "nueva") {
                // fijarIglesia cambia la activa: primero activa la que edita
                elegirIglesia(editando);
                fijarIglesia(i);
              } else {
                agregarIglesia(i);
              }
              setEditando(null);
            }}
          />
          {iglesias.length > 0 && (
            <Pressable
              onPress={() => setEditando(null)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.cancelar,
                pressed && styles.presionado,
              ]}
            >
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.lista}>
          {iglesias.map((i) => (
            <View key={`${i.sede}-${i.lat}-${i.lng}`} style={styles.tarjeta}>
              <View style={styles.icono}>
                <Octicons name="location" size={18} color={TEXT} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.nombre} numberOfLines={1}>
                  {i.sede}
                </Text>
                <Text style={styles.direccion} numberOfLines={2}>
                  {i.direccion}
                </Text>
              </View>
              <Pressable
                onPress={() => setEditando(i)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.accion,
                  pressed && styles.presionado,
                ]}
                accessibilityLabel={`Editar ${i.sede}`}
              >
                <Octicons name="pencil" size={15} color={MUTED} />
              </Pressable>
              <Pressable
                onPress={() => quitarIglesia(i)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.accion,
                  pressed && styles.presionado,
                ]}
                accessibilityLabel={`Quitar ${i.sede}`}
              >
                <Octicons name="trash" size={15} color={MUTED} />
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={() => setEditando("nueva")}
            style={({ pressed }) => [
              styles.agregar,
              pressed && styles.presionado,
            ]}
          >
            <Octicons name="plus" size={16} color={TEXT} />
            <Text style={styles.agregarTexto}>Agregar otra iglesia</Text>
          </Pressable>
        </View>
      )}
    </Paso>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  form: {
    marginTop: SPACING * 1.6,
    gap: SPACING,
  },
  cancelar: {
    alignSelf: "center",
    paddingVertical: SPACING / 2,
  },
  cancelarTexto: {
    fontSize: 14,
    color: MUTED,
  },
  lista: {
    gap: SPACING,
    marginTop: SPACING * 1.6,
  },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
  },
  nombre: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  direccion: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    marginTop: 2,
  },
  accion: {
    padding: 6,
  },
  agregar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING,
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  agregarTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
});

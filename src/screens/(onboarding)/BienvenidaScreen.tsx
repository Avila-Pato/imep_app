import {
  BORDER,
  DARK_BG,
  GRUPOS,
  MUTED,
  HOME_PADDING as PADDING,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { elegirGrupo, verBienvenida } from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
import { grupoDeInvitacion } from "@/utils/invitacion";
import { partirTitulo } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type Paso = {
  etiqueta: string;
  titulo: string; // la ultima palabra va en cursiva
  texto: string;
  icono: IconName;
};

// Lo que se puede hacer en la app (una pantalla por seccion)
const PASOS: Paso[] = [
  {
    etiqueta: "IMEP",
    titulo: "Te damos la bienvenida",
    texto:
      "La app de tu iglesia: la Palabra, la oración y la comunidad en un solo lugar.",
    icono: "home",
  },
  {
    etiqueta: "INICIO",
    titulo: "Cada día, una palabra",
    texto:
      "Un versículo al abrir la app, el próximo culto y las últimas predicaciones.",
    icono: "sun",
  },
  {
    etiqueta: "COMUNIDAD",
    titulo: "Oramos juntos",
    texto:
      "Comparte tus peticiones en el muro de oración y conversa con tu grupo en su sala.",
    icono: "people",
  },
  {
    etiqueta: "ESTUDIO",
    titulo: "Profundiza en la Palabra",
    texto:
      "Lee la Biblia, resalta versículos y haz estudios guiados paso a paso.",
    icono: "book",
  },
  {
    etiqueta: "SERVICIO",
    titulo: "Sirve con gozo",
    texto:
      "Revisa el cronograma para saber cuándo te toca servir y no te pierdas ningún anuncio.",
    icono: "calendar",
  },
];

// El ultimo paso es el del grupo (invitacion)
const TOTAL = PASOS.length + 1;

// Onboarding: solo se muestra la primera vez que se abre la app
export default function BienvenidaScreen() {
  const [paso, setPaso] = useState(0);
  const [enlace, setEnlace] = useState("");
  const [error, setError] = useState(false);
  const enGrupo = paso === PASOS.length;
  const actual = PASOS[paso];

  // al terminar, el layout raiz lleva a la app
  const terminar = () => verBienvenida(true);

  const usarInvitacion = () => {
    const id = grupoDeInvitacion(enlace);
    if (!id) return setError(true);
    elegirGrupo(id);
    terminar();
  };
  const grupoValido = grupoDeInvitacion(enlace);
  const nombreGrupo = GRUPOS.find((g) => g.id === grupoValido)?.label;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Progreso + saltar */}
        <View style={styles.arriba}>
          <View style={styles.puntos}>
            {Array.from({ length: TOTAL }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.punto,
                  i <= paso && styles.puntoHecho,
                  i === paso && styles.puntoActual,
                ]}
              />
            ))}
          </View>
          {!enGrupo && (
            <Pressable
              onPress={() => setPaso(PASOS.length)}
              hitSlop={10}
              accessibilityLabel="Saltar introducción"
            >
              <Text style={styles.saltar}>Saltar</Text>
            </Pressable>
          )}
        </View>

        {/* Contenido del paso */}
        <Animated.View
          key={paso}
          entering={FadeIn.duration(260)}
          exiting={FadeOut.duration(120)}
          style={styles.cuerpo}
        >
          <View style={[styles.icono, paso === 0 && styles.iconoMarca]}>
            <Octicons
              name={enGrupo ? "link" : actual.icono}
              size={30}
              color={paso === 0 ? "#FFFFFF" : TEXT}
            />
          </View>

          <Text style={styles.etiqueta}>
            {enGrupo ? "TU GRUPO" : actual.etiqueta}
          </Text>
          <Text style={styles.titulo}>
            {partirTitulo(enGrupo ? "Entra a tu sala" : actual.titulo).inicio}
            <Text style={styles.cursiva}>
              {partirTitulo(enGrupo ? "Entra a tu sala" : actual.titulo).final}
            </Text>
          </Text>
          <Text style={styles.texto}>
            {enGrupo
              ? "Si tu líder te envió un enlace de invitación, pégalo aquí para entrar a la sala de tu grupo (Jóvenes, Varones, Dorcas…)."
              : actual.texto}
          </Text>

          {enGrupo && (
            <View style={styles.form}>
              <View style={[styles.input, error && styles.inputError]}>
                <Octicons name="link" size={14} color={MUTED} />
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
                  style={styles.inputTexto}
                />
              </View>
              {error ? (
                <Text style={styles.error}>
                  Ese enlace no es válido. Pídele uno nuevo a tu líder.
                </Text>
              ) : (
                nombreGrupo && (
                  <Text style={styles.ok}>Invitación a {nombreGrupo} ✓</Text>
                )
              )}
            </View>
          )}
        </Animated.View>

        {/* Acciones */}
        <View style={styles.abajo}>
          {enGrupo ? (
            <>
              <Pressable
                onPress={usarInvitacion}
                disabled={!enlace.trim()}
                style={({ pressed }) => [
                  styles.boton,
                  !enlace.trim() && styles.botonApagado,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.botonTexto}>Entrar a mi grupo</Text>
              </Pressable>
              <Pressable
                onPress={terminar}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.despues,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.despuesTexto}>
                  Aún no tengo invitación · Entrar a la app
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.fila}>
              {paso > 0 && (
                <Pressable
                  onPress={() => setPaso(paso - 1)}
                  style={({ pressed }) => [
                    styles.atras,
                    pressed && styles.presionado,
                  ]}
                  accessibilityLabel="Atrás"
                >
                  <Octicons name="arrow-left" size={18} color={TEXT} />
                </Pressable>
              )}
              <Pressable
                onPress={() => setPaso(paso + 1)}
                style={({ pressed }) => [
                  styles.boton,
                  styles.flex,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.botonTexto}>
                  {paso === 0 ? "Comenzar" : "Continuar"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },

  // Progreso
  arriba: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING,
    paddingTop: SPACING,
    minHeight: 40,
  },
  puntos: {
    flexDirection: "row",
    gap: 6,
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BORDER,
  },
  puntoHecho: {
    backgroundColor: MUTED,
  },
  puntoActual: {
    width: 20,
    backgroundColor: TEXT,
  },
  saltar: {
    fontSize: 14,
    fontWeight: "500",
    color: MUTED,
  },

  // Contenido
  cuerpo: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: PADDING,
    gap: SPACING,
  },
  icono: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: SPACING * 2,
  },
  iconoMarca: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  etiqueta: {
    fontSize: 11,
    letterSpacing: 1.6,
    color: PRIMARY,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 38,
    lineHeight: 44,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
  },
  texto: {
    fontSize: 16,
    lineHeight: 24,
    color: MUTED,
    marginTop: 4,
  },

  // Invitacion
  form: {
    gap: SPACING,
    marginTop: SPACING * 2,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    height: 52,
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  inputError: {
    borderColor: PRIMARY,
  },
  inputTexto: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  error: {
    fontSize: 12,
    color: PRIMARY,
  },
  ok: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT,
  },

  // Acciones
  abajo: {
    paddingHorizontal: PADDING,
    paddingBottom: SPACING * 2,
    gap: SPACING * 1.4,
  },
  fila: {
    flexDirection: "row",
    gap: SPACING,
  },
  boton: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonApagado: {
    opacity: 0.4,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
  atras: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  despues: {
    alignItems: "center",
    paddingVertical: SPACING / 2,
  },
  despuesTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: MUTED,
  },
});

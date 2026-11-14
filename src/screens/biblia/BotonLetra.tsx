import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  LINEA,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import {
  elegirFuenteBiblia,
  FUENTES_BIBLIA,
  FuenteBiblia,
  useFuenteBibliaId,
} from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const FUENTES = Object.keys(FUENTES_BIBLIA) as FuenteBiblia[];

// Boton "Aa" junto al tamaño de letra: elige el tipo de letra de la Biblia
// (cada opcion se muestra escrita con su propia letra)
export default function BotonLetra() {
  const actual = useFuenteBibliaId();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.pastilla, pressed && styles.presionado]}
        accessibilityLabel={`Tipo de letra: ${FUENTES_BIBLIA[actual].label}. Cambiar`}
      >
        <Text
          style={[styles.aa, { fontFamily: FUENTES_BIBLIA[actual].normal }]}
        >
          Aa
        </Text>
        <Text style={styles.etiqueta}>Letra</Text>
        <Octicons name="chevron-down" size={12} color={MUTED} />
      </Pressable>

      <Modal
        navigationBarTranslucent
        statusBarTranslucent
        visible={abierto}
        transparent
        animationType="slide"
        onRequestClose={() => setAbierto(false)}
      >
        <ConBordes>
          {(insets) => (
            <>
              <Pressable
                style={styles.fondo}
                onPress={() => setAbierto(false)}
              />
              <View
                style={[
                  styles.hoja,
                  { paddingBottom: insets.bottom + SPACING },
                ]}
              >
                <View style={styles.asa} />
                <Text style={styles.titulo}>Tipo de letra</Text>
                {FUENTES.map((id) => {
                  const f = FUENTES_BIBLIA[id];
                  const activa = id === actual;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => {
                        elegirFuenteBiblia(id);
                        setAbierto(false);
                      }}
                      style={({ pressed }) => [
                        styles.fila,
                        activa && styles.filaActiva,
                        pressed && styles.presionado,
                      ]}
                      accessibilityState={{ selected: activa }}
                      accessibilityLabel={`${f.label}. ${f.sub}`}
                    >
                      <View style={styles.flex}>
                        <Text
                          style={[
                            styles.muestra,
                            { fontFamily: f.normal },
                            activa && styles.textoActivo,
                          ]}
                        >
                          En el principio era el Verbo
                        </Text>
                        <Text
                          style={[styles.nombre, activa && styles.textoActivo]}
                        >
                          {f.label} · {f.sub}
                        </Text>
                      </View>
                      {activa && (
                        <Octicons name="check" size={16} color={DARK_BG} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </ConBordes>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.6,
  },
  // "Aa Letra ⌄" (como la pastilla de la version): se entiende que se elige
  pastilla: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: LINEA,
  },
  aa: {
    fontSize: 16,
    color: TEXT,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: TEXT,
  },
  fondo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  hoja: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: SPACING,
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: LINEA,
  },
  titulo: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 20,
    color: TEXT,
    marginBottom: 4,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  filaActiva: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  muestra: {
    fontSize: 19,
    color: TEXT,
  },
  nombre: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
  },
  textoActivo: {
    color: DARK_BG,
  },
});

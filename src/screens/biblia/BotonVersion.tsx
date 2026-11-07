import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
  VERSIONES_BIBLIA,
} from "@/constants/constans";
import { elegirVersion, useVersion } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import ConBordes from "@/components/ConBordes";

// Pastilla "RV1960 ⌄" al lado del libro: elige la version de la Biblia
export default function BotonVersion() {
  const version = useVersion();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.pastilla, pressed && styles.presionado]}
        accessibilityLabel={`Versión ${version}. Cambiar versión`}
      >
        <Text style={styles.codigo}>{version}</Text>
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
                <Text style={styles.titulo}>Versión de la Biblia</Text>
                {VERSIONES_BIBLIA.map((v) => {
                  const activa = v.id === version;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => {
                        elegirVersion(v.id);
                        setAbierto(false);
                      }}
                      style={({ pressed }) => [
                        styles.fila,
                        activa && styles.filaActiva,
                        pressed && styles.presionado,
                      ]}
                      accessibilityState={{ selected: activa }}
                    >
                      <Text
                        style={[
                          styles.filaCodigo,
                          activa && styles.textoActivo,
                        ]}
                      >
                        {v.id}
                      </Text>
                      <Text
                        style={[
                          styles.filaNombre,
                          activa && styles.textoActivo,
                        ]}
                      >
                        {v.nombre}
                      </Text>
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
  presionado: {
    opacity: 0.6,
  },
  pastilla: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  codigo: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
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
    backgroundColor: "#3A3A3A",
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
  filaCodigo: {
    width: 64,
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
  },
  filaNombre: {
    flex: 1,
    fontFamily: FUENTE.biblia,
    fontSize: 17,
    color: TEXT,
  },
  textoActivo: {
    color: DARK_BG,
  },
});

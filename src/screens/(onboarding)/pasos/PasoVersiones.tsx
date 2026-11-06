import { PORTADAS } from "@/assets/data/bienvenidaMocks";
import {
  FUENTE,
  MUTED,
  SPACING,
  TEXT,
  VERSIONES_BIBLIA,
} from "@/constants/constans";
import { elegirVersion, useVersion } from "@/store/estudios";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

// "Elige tu Biblia": las versiones como portadas de libro.
// Elegir una cambia la version de toda la app
export default function PasoVersiones({ onSeguir }: { onSeguir: () => void }) {
  const version = useVersion();

  return (
    <Paso pie={<BotonPrincipal texto="Continuar" onPress={onSeguir} />}>
      <Titulo texto="Elige tu " destacado="Biblia" centrado />
      <Subtitulo centrado>
        Lee en la versión que prefieras. Puedes cambiarla cuando quieras.
      </Subtitulo>

      <View style={styles.estante}>
        {VERSIONES_BIBLIA.map((v) => {
          const activa = v.id === version;
          const p = PORTADAS[v.id];
          return (
            <Pressable
              key={v.id}
              onPress={() => elegirVersion(v.id)}
              style={styles.libro}
              accessibilityRole="radio"
              accessibilityState={{ selected: activa }}
              accessibilityLabel={v.nombre}
            >
              <View
                style={[
                  styles.portada,
                  { backgroundColor: p.fondo },
                  activa && styles.portadaActiva,
                ]}
              >
                {/* lomo del libro */}
                <View style={styles.lomo} />
                <View style={[styles.filete, { borderColor: p.letras }]}>
                  <Text style={[styles.santa, { color: p.letras }]}>
                    SANTA BIBLIA
                  </Text>
                  <View style={[styles.cruz, { backgroundColor: p.letras }]} />
                  <View
                    style={[styles.cruzBrazo, { backgroundColor: p.letras }]}
                  />
                  <Text style={[styles.codigo, { color: p.letras }]}>
                    {v.id}
                  </Text>
                </View>
              </View>
              <Text style={[styles.nombre, activa && styles.nombreActivo]}>
                {v.nombre}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Paso>
  );
}

const styles = StyleSheet.create({
  estante: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING * 1.4,
    marginTop: SPACING * 3,
  },
  libro: {
    flex: 1,
    maxWidth: 110,
    alignItems: "center",
    gap: SPACING,
  },
  portada: {
    width: "100%",
    aspectRatio: 0.68,
    borderRadius: 8,
    padding: 8,
    paddingLeft: 14,
    opacity: 0.55,
    // sombra de libro
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  portadaActiva: {
    opacity: 1,
    transform: [{ translateY: -10 }, { scale: 1.06 }],
  },
  lomo: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  filete: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 4,
  },
  santa: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 9,
    letterSpacing: 1.2,
    textAlign: "center",
  },
  // cruz dibujada con dos barras
  cruz: {
    width: 3,
    height: 26,
    borderRadius: 1,
  },
  cruzBrazo: {
    position: "absolute",
    top: "44%",
    width: 16,
    height: 3,
    borderRadius: 1,
  },
  codigo: {
    fontFamily: FUENTE.semibold,
    fontSize: 10,
    letterSpacing: 1,
  },
  nombre: {
    fontSize: 11,
    lineHeight: 15,
    color: MUTED,
    textAlign: "center",
  },
  nombreActivo: {
    color: TEXT,
    fontWeight: "600",
  },
});

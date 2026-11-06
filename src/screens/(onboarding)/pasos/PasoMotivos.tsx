import { MOTIVOS } from "@/assets/data/bienvenidaMocks";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { guardarPerfil, useEstudios } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

// "¿Qué te trae aquí?" (se puede elegir mas de uno)
export default function PasoMotivos({ onSeguir }: { onSeguir: () => void }) {
  const [elegidos, setElegidos] = useState<string[]>(
    useEstudios().motivos ?? [],
  );

  const alternar = (id: string) =>
    setElegidos((e) =>
      e.includes(id) ? e.filter((x) => x !== id) : [...e, id],
    );

  return (
    <Paso
      pie={
        <BotonPrincipal
          texto="Continuar"
          deshabilitado={elegidos.length === 0}
          onPress={() => {
            guardarPerfil({ motivos: elegidos });
            onSeguir();
          }}
        />
      }
    >
      <Text style={styles.comencemos}>Comencemos</Text>
      <Titulo texto="¿Qué te trae " destacado="aquí?" centrado />
      <Subtitulo centrado>Puedes elegir más de una</Subtitulo>

      <View style={styles.lista}>
        {MOTIVOS.map((m) => {
          const activo = elegidos.includes(m.id);
          return (
            <Pressable
              key={m.id}
              onPress={() => alternar(m.id)}
              style={({ pressed }) => [
                styles.tarjeta,
                activo && styles.tarjetaActiva,
                pressed && styles.presionado,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: activo }}
            >
              <View style={[styles.icono, activo && styles.iconoActivo]}>
                <Octicons
                  name={m.icono}
                  size={18}
                  color={activo ? "#FFFFFF" : TEXT}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.tarjetaTitulo}>{m.titulo}</Text>
                <Text style={styles.tarjetaTexto}>{m.texto}</Text>
              </View>
              <View style={[styles.check, activo && styles.checkActivo]}>
                {activo && <Octicons name="check" size={12} color={DARK_BG} />}
              </View>
            </Pressable>
          );
        })}
      </View>
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
  comencemos: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    letterSpacing: 1.6,
    color: MUTED,
    textAlign: "center",
    textTransform: "uppercase",
  },
  lista: {
    gap: SPACING,
    marginTop: SPACING,
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
  tarjetaActiva: {
    borderColor: PRIMARY,
    backgroundColor: "rgba(229, 72, 77, 0.08)",
  },
  icono: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
  },
  iconoActivo: {
    backgroundColor: PRIMARY,
  },
  tarjetaTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  tarjetaTexto: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    marginTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#4A4A4A",
  },
  checkActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
});

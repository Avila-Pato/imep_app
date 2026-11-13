import EditorHorarios, { ordenarHorarios } from "@/components/EditorHorarios";
import {
  BORDER,
  DARK_BG,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { fijarHorarios, useIglesias } from "@/store/estudios";
import { HorarioCulto } from "@/types/typesAnuncios";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

// para empezar: un culto el domingo (lo cambia a su gusto)
const SUGERENCIA: HorarioCulto[] = [{ dia: 0, hora: "11:00" }];

// Solo el pastor: dias y horarios de culto de cada iglesia. Con esto se arma
// el cronograma, el "Proximo culto" y los recordatorios. Puede dejarlo para
// despues (en Cronograma → Editar)
export default function PasoHorarios({ onSeguir }: { onSeguir: () => void }) {
  const iglesias = useIglesias().filter((i) => !!i.id);
  const [elegida, setElegida] = useState(iglesias[0]?.id);
  // borrador por iglesia (se guarda al continuar)
  const [borrador, setBorrador] = useState<Record<string, HorarioCulto[]>>(() =>
    Object.fromEntries(iglesias.map((i) => [i.id!, i.horarios ?? SUGERENCIA])),
  );
  const actual = elegida ? (borrador[elegida] ?? SUGERENCIA) : [];

  const guardar = () => {
    for (const [id, horarios] of Object.entries(borrador)) {
      fijarHorarios(ordenarHorarios(horarios), id);
    }
    onSeguir();
  };

  return (
    <Paso
      pie={
        <>
          <BotonPrincipal texto="Continuar" onPress={guardar} />
          <Pressable
            onPress={onSeguir}
            hitSlop={8}
            style={({ pressed }) => [
              styles.despues,
              pressed && styles.presionado,
            ]}
          >
            <Text style={styles.despuesTexto}>
              Lo haré después en el cronograma
            </Text>
          </Pressable>
        </>
      }
    >
      <Titulo texto="¿Cuándo son tus " destacado="cultos?" />
      <Subtitulo>
        Con esto armamos el cronograma de turnos, el «Próximo culto» y los
        recordatorios para los hermanos. Puedes cambiarlo cuando quieras.
      </Subtitulo>

      {/* con varias iglesias: de cual son estos horarios */}
      {iglesias.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsCaja}
        >
          {iglesias.map((i) => {
            const activa = i.id === elegida;
            return (
              <Pressable
                key={i.id}
                onPress={() => setElegida(i.id)}
                style={[styles.chip, activa && styles.chipActivo]}
              >
                <Text
                  style={[styles.chipTexto, activa && styles.chipTextoActivo]}
                  numberOfLines={1}
                >
                  {i.sede}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.editor}>
        <EditorHorarios
          horarios={actual}
          onCambiar={(h) =>
            elegida && setBorrador((b) => ({ ...b, [elegida]: h }))
          }
        />
      </View>
    </Paso>
  );
}

const styles = StyleSheet.create({
  presionado: {
    opacity: 0.7,
  },
  chipsCaja: {
    marginTop: SPACING * 1.4,
    flexGrow: 0,
  },
  chips: {
    gap: 6,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: MUTED,
  },
  chipTextoActivo: {
    color: DARK_BG,
  },
  editor: {
    marginTop: SPACING * 1.6,
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

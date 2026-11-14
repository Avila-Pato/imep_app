import EditorHorarios, { ordenarHorarios } from "@/components/EditorHorarios";
import {
  BORDER,
  FUENTE,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { fijarHorarios, useIglesias } from "@/store/estudios";
import { HorarioCulto } from "@/types/typesAnuncios";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BotonPrincipal, Paso, Subtitulo, Titulo } from "./ui";

// para empezar: un culto el domingo (lo cambia a su gusto)
const SUGERENCIA: HorarioCulto[] = [{ dia: 0, hora: "11:00" }];

// Solo el pastor: dias y horarios de culto de cada iglesia. Con esto se arma
// el cronograma, el "Proximo culto" y los recordatorios.
// Con varias iglesias va de UNA EN UNA ("Iglesia 1 de 2"), asi ninguna se
// queda sin horarios. Cada iglesia necesita al menos un culto para seguir
export default function PasoHorarios({ onSeguir }: { onSeguir: () => void }) {
  const iglesias = useIglesias().filter((i) => !!i.id);
  const [pos, setPos] = useState(0); // iglesia que se esta configurando
  // borrador por iglesia (se guarda al terminar)
  const [borrador, setBorrador] = useState<Record<string, HorarioCulto[]>>(() =>
    Object.fromEntries(iglesias.map((i) => [i.id!, i.horarios ?? SUGERENCIA])),
  );
  const [falta, setFalta] = useState(false); // toco seguir sin cultos

  const iglesia = iglesias[pos];
  const actual = iglesia ? (borrador[iglesia.id!] ?? SUGERENCIA) : [];
  const ultima = pos >= iglesias.length - 1;
  const siguiente = iglesias[pos + 1];
  const varias = iglesias.length > 1;

  const seguir = () => {
    // al menos un dia y hora en esta iglesia
    if (iglesia && actual.length === 0) return setFalta(true);
    setFalta(false);
    if (!ultima) return setPos(pos + 1);
    for (const [id, horarios] of Object.entries(borrador)) {
      fijarHorarios(ordenarHorarios(horarios), id);
    }
    onSeguir();
  };

  return (
    <Paso
      pie={
        <>
          {falta && actual.length === 0 && (
            <View style={styles.falta}>
              <Octicons name="alert" size={14} color={PRIMARY} />
              <Text style={styles.faltaTexto}>
                Agrega al menos un culto (día y hora) para continuar.
              </Text>
            </View>
          )}
          <BotonPrincipal
            texto={ultima ? "Continuar" : `Siguiente: ${siguiente?.sede}`}
            onPress={seguir}
          />
          {pos > 0 && (
            <Pressable
              onPress={() => {
                setFalta(false);
                setPos(pos - 1);
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.volver,
                pressed && styles.presionado,
              ]}
            >
              <Octicons name="arrow-left" size={13} color={MUTED} />
              <Text style={styles.volverTexto}>
                Volver a {iglesias[pos - 1]?.sede}
              </Text>
            </Pressable>
          )}
        </>
      }
    >
      <Titulo texto="¿Cuándo son tus " destacado="cultos?" />
      <Subtitulo>
        {varias
          ? `Tienes ${iglesias.length} iglesias: configura los cultos de cada una. Con esto armamos el cronograma y los recordatorios.`
          : "Con esto armamos el cronograma de turnos, el «Próximo culto» y los recordatorios. Puedes cambiarlo cuando quieras."}
      </Subtitulo>

      {/* De que iglesia son estos cultos (bien a la vista) */}
      {iglesia && (
        <View style={styles.iglesia}>
          {varias && (
            <View style={styles.progreso}>
              <Text style={styles.paso}>
                IGLESIA {pos + 1} DE {iglesias.length}
              </Text>
              <View style={styles.puntos}>
                {iglesias.map((x, k) => (
                  <View
                    key={x.id}
                    style={[
                      styles.punto,
                      k < pos && styles.puntoListo,
                      k === pos && styles.puntoActual,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
          <View style={styles.iglesiaFila}>
            <View style={styles.iglesiaIcono}>
              {iglesia.logo ? (
                <Image
                  source={{ uri: iglesia.logo }}
                  style={styles.iglesiaLogo}
                  contentFit="cover"
                />
              ) : (
                <Octicons name="home-fill" size={16} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.flex}>
              <Text style={styles.iglesiaNombre} numberOfLines={1}>
                {iglesia.sede}
              </Text>
              <Text style={styles.iglesiaDir} numberOfLines={1}>
                {iglesia.direccion}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.editor}>
        <EditorHorarios
          horarios={actual}
          onCambiar={(h) => {
            if (!iglesia?.id) return;
            setBorrador((b) => ({ ...b, [iglesia.id!]: h }));
            if (h.length) setFalta(false);
          }}
        />
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
  iglesia: {
    marginTop: SPACING * 1.6,
    gap: SPACING,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  progreso: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paso: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: PRIMARY,
  },
  puntos: {
    flexDirection: "row",
    gap: 6,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BORDER,
  },
  puntoListo: {
    backgroundColor: TEXT,
  },
  puntoActual: {
    width: 20,
    backgroundColor: PRIMARY,
  },
  iglesiaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
  },
  iglesiaIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: PRIMARY,
  },
  iglesiaLogo: {
    width: 40,
    height: 40,
  },
  iglesiaNombre: {
    fontFamily: SERIF,
    fontSize: 22,
    color: TEXT,
  },
  iglesiaDir: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED,
  },
  editor: {
    marginTop: SPACING * 1.6,
  },
  falta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: SPACING / 2,
  },
  faltaTexto: {
    flex: 1,
    fontSize: 13,
    color: PRIMARY,
  },
  volver: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SPACING / 2,
  },
  volverTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: MUTED,
  },
});

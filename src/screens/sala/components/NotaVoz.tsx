import { BORDER, DARK_BG, MUTED, TEXT } from "@/constants/constans";
import { NotaDeVoz } from "@/types/typesComunidad";
import Octicons from "@expo/vector-icons/Octicons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pressable, StyleSheet, Text, View } from "react-native";

// 75 -> "1:15"
export const minutos = (seg: number) => {
  const s = Math.max(0, Math.round(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Reproductor de una nota de voz: play/pausa, barra de avance y tiempo
export default function NotaVoz({ audio }: { audio: NotaDeVoz }) {
  const player = useAudioPlayer(audio.uri, { updateInterval: 250 });
  const estado = useAudioPlayerStatus(player);
  const total = estado.duration || audio.duracion;
  const avance = total ? Math.min(1, estado.currentTime / total) : 0;

  const alternar = () => {
    if (estado.playing) return player.pause();
    // si ya termino, vuelve al inicio
    if (estado.didJustFinish || avance >= 1) player.seekTo(0);
    player.play();
  };

  return (
    <View style={styles.fila}>
      <Pressable
        onPress={alternar}
        hitSlop={8}
        style={styles.boton}
        accessibilityLabel={
          estado.playing ? "Pausar audio" : "Reproducir audio"
        }
      >
        <Octicons
          name={estado.playing ? "square-fill" : "play"}
          size={14}
          color={DARK_BG}
        />
      </Pressable>
      <View style={styles.pista}>
        <View style={[styles.avance, { width: `${avance * 100}%` }]} />
      </View>
      <Text style={styles.tiempo}>
        {minutos(estado.playing ? estado.currentTime : total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 200,
  },
  boton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  pista: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: BORDER,
    overflow: "hidden",
  },
  avance: {
    height: "100%",
    backgroundColor: TEXT,
  },
  tiempo: {
    fontSize: 11,
    color: MUTED,
    fontVariant: ["tabular-nums"],
  },
});

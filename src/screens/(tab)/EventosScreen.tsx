import { DARK_BG, TEXT } from "@/constants/constans";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EventosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.texto}>Eventos</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
  },
  texto: {
    color: TEXT,
  },
});

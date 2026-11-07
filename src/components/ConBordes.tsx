import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import {
  EdgeInsets,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// Dentro de un Modal (pantalla completa, bajo la barra de navegacion) los
// bordes seguros se miden en la ventana del propio modal. Asi el boton de
// abajo de cada hoja no queda detras de los botones del telefono
export default function ConBordes({
  children,
}: {
  children: (bordes: EdgeInsets) => ReactNode;
}) {
  return (
    <SafeAreaProvider style={styles.flex}>
      <Medir>{children}</Medir>
    </SafeAreaProvider>
  );
}

function Medir({ children }: { children: (bordes: EdgeInsets) => ReactNode }) {
  const bordes = useSafeAreaInsets();
  return <>{children(bordes)}</>;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "transparent",
  },
});

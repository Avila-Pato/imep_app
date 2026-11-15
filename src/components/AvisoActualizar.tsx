import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  primarioAlfa,
} from "@/constants/constans";
import { EstadoVersion, revisarVersion, urlTienda } from "@/services/version";
import { posponerVersion, useVersionPospuesta } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { useEffect, useState } from "react";
import {
  AppState,
  BackHandler,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// "Hay una version nueva": al abrir la app (y al volver a ella) se revisa la
// version que pide el servidor. Obligatoria: no se puede seguir sin
// actualizar. Sugerida: "Mas tarde" (no vuelve a salir hasta otra version)
export default function AvisoActualizar() {
  const [estado, setEstado] = useState<EstadoVersion>({ tipo: "ok" });
  const pospuesta = useVersionPospuesta();

  useEffect(() => {
    const revisar = () =>
      revisarVersion()
        .then(setEstado)
        .catch(() => {});
    revisar();
    // vuelve a la app (ej: despues de ir a la tienda sin actualizar)
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") revisar();
    });
    return () => sub.remove();
  }, []);

  const obligatoria = estado.tipo === "obligatoria";
  const visible =
    estado.tipo !== "ok" && (obligatoria || estado.nueva !== pospuesta);

  // obligatoria: el boton atras de Android no la cierra
  useEffect(() => {
    if (!visible || !obligatoria) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [visible, obligatoria]);

  if (!visible) return null;

  const actualizar = async () => {
    const url = urlTienda();
    if (!url) return;
    await Linking.openURL(url.app).catch(() => Linking.openURL(url.web));
  };
  const despues = () => posponerVersion(estado.nueva);

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible
      transparent
      animationType="fade"
      onRequestClose={obligatoria ? () => {} : despues}
    >
      <ConBordes>
        {() => (
          <View style={styles.fondo}>
            <View style={styles.tarjeta}>
              <View style={styles.icono}>
                <Octicons name="download" size={24} color={PRIMARY} />
              </View>
              <Text style={styles.titulo}>
                {obligatoria
                  ? "Actualiza Congrega para seguir"
                  : "Hay una versión nueva"}
              </Text>
              <Text style={styles.texto}>
                {obligatoria
                  ? `Esta versión ya no funciona bien. Instala la ${estado.nueva} desde la tienda: tus datos y tu iglesia se mantienen.`
                  : `La versión ${estado.nueva} de Congrega ya está disponible.`}
              </Text>
              {!!estado.mensaje && (
                <View style={styles.novedades}>
                  <Text style={styles.novedadesEtiqueta}>QUÉ TRAE</Text>
                  <Text style={styles.novedadesTexto}>{estado.mensaje}</Text>
                </View>
              )}
              <Pressable
                onPress={actualizar}
                style={({ pressed }) => [
                  styles.boton,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.botonTexto}>Actualizar</Text>
              </Pressable>
              {!obligatoria && (
                <Pressable onPress={despues} hitSlop={8} style={styles.despues}>
                  <Text style={styles.despuesTexto}>Más tarde</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </ConBordes>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING * 2.4,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  tarjeta: {
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 2.4,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  icono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primarioAlfa(0.14),
  },
  titulo: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 24,
    color: TEXT,
    textAlign: "center",
  },
  texto: {
    fontFamily: FUENTE.regular,
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    textAlign: "center",
  },
  novedades: {
    alignSelf: "stretch",
    gap: 4,
    padding: SPACING * 1.4,
    borderRadius: 14,
    backgroundColor: DARK_BG,
  },
  novedadesEtiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: MUTED,
  },
  novedadesTexto: {
    fontFamily: FUENTE.regular,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
  },
  boton: {
    alignSelf: "stretch",
    height: 52,
    marginTop: SPACING / 2,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: DARK_BG,
  },
  despues: {
    paddingVertical: 6,
  },
  despuesTexto: {
    fontFamily: FUENTE.medium,
    fontSize: 14,
    color: MUTED,
  },
  presionado: {
    opacity: 0.7,
  },
});

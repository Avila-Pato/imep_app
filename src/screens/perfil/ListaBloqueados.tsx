import { BORDER, FUENTE, MUTED, TEXT } from "@/constants/constans";
import {
  cargarBloqueos,
  desbloquear,
  useBloqueados,
} from "@/store/moderacion";
import { avisar, confirmar } from "@/utils/confirmar";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

// Las personas que bloqueo (en Privacidad) y el boton para desbloquearlas.
// En la web es la pagina publica: no se carga nada (no hay sesion)
export default function ListaBloqueados() {
  const bloqueados = useBloqueados();
  const enApp = Platform.OS !== "web";
  useEffect(() => {
    if (enApp) cargarBloqueos();
  }, [enApp]);

  if (!enApp) return null;
  if (!bloqueados.length)
    return <Text style={styles.vacio}>No has bloqueado a nadie.</Text>;

  return (
    <View style={styles.lista}>
      {bloqueados.map((b) => (
        <View key={b.id} style={styles.fila}>
          <Text style={styles.nombre} numberOfLines={1}>
            {b.nombre}
          </Text>
          <Pressable
            onPress={() =>
              confirmar(
                `¿Desbloquear a ${b.nombre}?`,
                "Volverás a ver sus mensajes y podrá escribirte en privado.",
                "Desbloquear",
                async () => {
                  if (!(await desbloquear(b.id)))
                    avisar(
                      "No se pudo desbloquear",
                      "Revisa tu conexión e inténtalo de nuevo.",
                    );
                },
                false,
              )
            }
            hitSlop={8}
            style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
            accessibilityLabel={`Desbloquear a ${b.nombre}`}
          >
            <Text style={styles.botonTexto}>Desbloquear</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: 4,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  nombre: {
    flex: 1,
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
  },
  boton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  botonTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: TEXT,
  },
  presionado: {
    opacity: 0.6,
  },
  vacio: {
    fontFamily: FUENTE.regular,
    fontSize: 13,
    color: MUTED,
  },
});

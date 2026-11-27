import * as Updates from "expo-updates";
import { useEffect } from "react";
import { AppState } from "react-native";

// Actualizaciones (EAS Update) sin depender de que la persona cierre y abra
// la app dos veces: al abrirla y al volver a ella busca si hay una nueva;
// si la baja, la app se reinicia sola con la version nueva.
// Al abrir solo reinicia si fue rapido (no le cambia la pantalla a mitad de
// algo); si tardo, queda lista para la proxima vez que la abra.
const ESPERA_AL_ABRIR = 8000;

async function buscar(reiniciar: () => boolean) {
  try {
    const r = await Updates.checkForUpdateAsync();
    if (!r.isAvailable) return;
    const bajada = await Updates.fetchUpdateAsync();
    if (bajada.isNew && reiniciar()) await Updates.reloadAsync();
  } catch (e) {
    // sin internet o el servidor no responde: se intenta la proxima vez
    console.warn("[updates]", (e as Error)?.message ?? e);
  }
}

export function useActualizacionAuto() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    const inicio = Date.now();
    buscar(() => Date.now() - inicio < ESPERA_AL_ABRIR);

    // volvio a la app despues de un rato: se busca otra vez
    let fuera = 0;
    const sub = AppState.addEventListener("change", (estado) => {
      if (estado !== "active") {
        fuera = Date.now();
        return;
      }
      if (fuera && Date.now() - fuera > 30_000) buscar(() => true);
    });
    return () => sub.remove();
  }, []);
}

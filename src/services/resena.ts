import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

// La ventanita de estrellas de Play Store / App Store, sin salir de la app.
// Google decide si de verdad la muestra (tiene su propio limite): por eso no
// se pregunta nada antes ni se avisa despues
export async function pedirResena() {
  if (Platform.OS === "web") return;
  try {
    if (!(await StoreReview.isAvailableAsync())) return;
    await StoreReview.requestReview();
  } catch (e) {
    console.warn("[resena]", (e as Error)?.message ?? e);
  }
}

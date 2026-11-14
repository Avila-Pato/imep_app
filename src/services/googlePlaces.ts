import { Platform } from "react-native";
import type { Lugar } from "./direcciones";

// Buscador de Google (Places API New: "Text Search"). Entiende direcciones
// mal escritas, numeros de casa y lugares ("iglesia evangelica maipu").
// La clave esta restringida a la app Android: Google la acepta solo si la
// llamada trae el paquete y la huella de la firma (headers de abajo).
// En la web no se usa (la clave no sirve ahi): sigue OpenStreetMap
const CLAVE = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
const PAQUETE = "com.avilapato.congrega";
// SHA-1 de la firma de EAS (sin ":"), la misma que se puso en Google Cloud
const FIRMA = "C55D4669317C9B0BFF06C36E1CA279638D31CB4A";

export const hayGoogle = () => !!CLAVE && Platform.OS === "android";

type Cerca = { lat: number; lng: number };
type Respuesta = {
  places?: {
    formattedAddress?: string;
    displayName?: { text?: string };
    location?: { latitude: number; longitude: number };
  }[];
};

export async function buscarEnGoogle(
  texto: string,
  signal?: AbortSignal,
  cerca?: Cerca,
): Promise<Lugar[]> {
  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": CLAVE!,
        "X-Android-Package": PAQUETE,
        "X-Android-Cert": FIRMA,
        // solo lo necesario (pedir menos campos cuesta menos)
        "X-Goog-FieldMask":
          "places.formattedAddress,places.displayName,places.location",
      },
      body: JSON.stringify({
        textQuery: texto,
        languageCode: "es",
        pageSize: 6,
        // primero lo cercano a lo que se ve en el mapa (o al telefono)
        ...(cerca
          ? {
              locationBias: {
                circle: {
                  center: { latitude: cerca.lat, longitude: cerca.lng },
                  radius: 30000,
                },
              },
            }
          : {}),
      }),
    },
  );
  if (!res.ok) throw new Error(`Google ${res.status}`);
  const j: Respuesta = await res.json();
  return (j.places ?? [])
    .filter((p) => p.location)
    .map((p) => {
      const nombre = p.displayName?.text;
      const dir = p.formattedAddress ?? "";
      return {
        // un lugar con nombre ("Plaza de Maipú") muestra el nombre y la direccion
        direccion:
          nombre && !dir.startsWith(nombre) ? `${nombre}, ${dir}` : dir,
        lat: p.location!.latitude,
        lng: p.location!.longitude,
      };
    });
}

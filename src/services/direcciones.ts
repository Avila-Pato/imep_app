import * as Location from "expo-location";
// Busca direcciones con OpenStreetMap (Nominatim): gratis y sin clave.
// Sus reglas piden pocas busquedas (se espera a que deje de escribir)
// y no usarlo para autocompletar letra por letra.
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export type Lugar = {
  direccion: string; // texto completo para mostrar y para "Cómo llegar"
  lat: number;
  lng: number;
};

type LugarApi = { display_name: string; lat: string; lon: string };

export async function buscarDireccion(
  texto: string,
  signal?: AbortSignal,
): Promise<Lugar[]> {
  const url = `${NOMINATIM}?format=jsonv2&limit=5&accept-language=es&q=${encodeURIComponent(texto)}`;
  const res = await fetch(url, {
    signal,
    // en web el navegador no deja cambiar este encabezado (no pasa nada)
    headers: { "User-Agent": "CongregaApp/1.0" },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const lugares: LugarApi[] = await res.json();
  return lugares.map((l) => ({
    direccion: l.display_name,
    lat: Number(l.lat),
    lng: Number(l.lon),
  }));
}

// "Usar mi ubicacion actual": el GPS del telefono + la direccion de ese punto
// (OpenStreetMap). Si no encuentra la calle, igual sirve el punto del mapa.
// null = no dio permiso
export async function ubicacionActual(): Promise<Lugar | null> {
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (!permiso.granted) return null;
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  const lat = coords.latitude;
  const lng = coords.longitude;
  const direccion = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=es&zoom=18&lat=${lat}&lon=${lng}`,
    { headers: { "User-Agent": "CongregaApp/1.0" } },
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { display_name?: string } | null) => j?.display_name)
    .catch(() => undefined);
  return {
    direccion: direccion ?? `Ubicación ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    lat,
    lng,
  };
}

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
    headers: { "User-Agent": "IMEPApp/1.0" },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const lugares: LugarApi[] = await res.json();
  return lugares.map((l) => ({
    direccion: l.display_name,
    lat: Number(l.lat),
    lng: Number(l.lon),
  }));
}

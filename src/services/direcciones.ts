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

// Pais del telefono ("es-CL" -> "cl"): primero se busca ahi, asi una calle
// mal escrita no lleva a otra de Mexico o Argentina
const PAIS = (() => {
  try {
    return (
      Intl.DateTimeFormat()
        .resolvedOptions()
        .locale.match(/-([A-Z]{2})(?:-|$)/)?.[1]
        ?.toLowerCase() ?? ""
    );
  } catch {
    return "";
  }
})();

// cerca: prefiere lo que esta alrededor de ese punto (lo que se ve en el
// mapa), asi "plaza" o "colegio" encuentra los de la zona
export type Cerca = { lat: number; lng: number };

async function consultar(
  texto: string,
  signal?: AbortSignal,
  pais = "",
  cerca?: Cerca,
  soloCerca = false, // solo dentro de la zona (no mas lejos)
) {
  const caja = cerca
    ? `&viewbox=${cerca.lng - 0.25},${cerca.lat + 0.25},${cerca.lng + 0.25},${cerca.lat - 0.25}`
    : "";
  const limitar = cerca && soloCerca ? "&bounded=1" : "";
  const url = `${NOMINATIM}?format=jsonv2&limit=6&accept-language=es${pais ? `&countrycodes=${pais}` : ""}${caja}${limitar}&q=${encodeURIComponent(texto)}`;
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

// OpenStreetMap no perdona errores de ortografia ("Cobarrubias" no encuentra
// "Covarrubias"). Si no hay nada, se prueba con las confusiones tipicas del
// español: b/v, s/z, y/ll
const variantes = (texto: string) =>
  [
    texto.replace(/b/gi, (c) => (c === "b" ? "v" : "V")),
    texto.replace(/v/gi, (c) => (c === "v" ? "b" : "B")),
    texto.replace(/z/gi, (c) => (c === "z" ? "s" : "S")),
    texto.replace(/ll/gi, "y"),
  ].filter((v, i, todas) => v !== texto && todas.indexOf(v) === i);

const esperar = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((listo, falla) => {
    const t = setTimeout(listo, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      falla(new Error("cancelado"));
    });
  });

// Da igual como lo escriba: minusculas, mayusculas, espacios de mas
const normalizar = (texto: string) =>
  texto.toLowerCase().replace(/\s+/g, " ").trim();

export async function buscarDireccion(
  texto: string,
  signal?: AbortSignal,
  cerca?: Cerca,
): Promise<Lugar[]> {
  const limpio = normalizar(texto);
  // 1) tal cual y con las correcciones (b/v...), en su pais
  // 2) si no, tal cual en cualquier pais (la iglesia puede estar en otro)
  const intentos: [string, string][] = PAIS
    ? [
        [limpio, PAIS],
        ...variantes(limpio)
          .slice(0, 3)
          .map((v): [string, string] => [v, PAIS]),
        [limpio, ""],
      ]
    : [
        [limpio, ""],
        ...variantes(limpio)
          .slice(0, 3)
          .map((v): [string, string] => [v, ""]),
      ];
  // en el mapa: primero lo de la zona que se ve ("colegio" = los cercanos)
  if (cerca) {
    const zona = await consultar(limpio, signal, "", cerca, true);
    if (zona.length) return zona;
    await esperar(1100, signal);
  }
  for (const [i, [q, pais]] of intentos.entries()) {
    // las reglas de OpenStreetMap: maximo una busqueda por segundo
    if (i > 0) await esperar(1100, signal);
    const r = await consultar(q, signal, pais, cerca);
    if (r.length) return r;
  }
  return [];
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
  return lugarEn(coords.latitude, coords.longitude);
}

// La direccion de un punto del mapa (OpenStreetMap). Si no encuentra la
// calle, igual sirve el punto
export async function lugarEn(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<Lugar> {
  const direccion = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=es&zoom=18&lat=${lat}&lon=${lng}`,
    { signal, headers: { "User-Agent": "CongregaApp/1.0" } },
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

import { Linking, Platform } from "react-native";

const TESELA = 256;

// Lat/lng -> posicion en pixeles dentro del mapa del mundo a ese zoom
export function aPixel(lat: number, lng: number, zoom: number) {
  const escala = TESELA * 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  return {
    x: ((lng + 180) / 360) * escala,
    y:
      ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      escala,
  };
}

// Teselas necesarias para cubrir un recuadro, con su posicion dentro de el
export function teselasVisibles(
  lat: number,
  lng: number,
  zoom: number,
  ancho: number,
  alto: number,
  // donde queda el punto dentro del recuadro (0..1)
  foco = { x: 0.5, y: 0.5 },
) {
  const centro = aPixel(lat, lng, zoom);
  const origenX = centro.x - ancho * foco.x;
  const origenY = centro.y - alto * foco.y;

  const desdeX = Math.floor(origenX / TESELA);
  const hastaX = Math.floor((origenX + ancho) / TESELA);
  const desdeY = Math.floor(origenY / TESELA);
  const hastaY = Math.floor((origenY + alto) / TESELA);

  const teselas: { x: number; y: number; left: number; top: number }[] = [];
  for (let x = desdeX; x <= hastaX; x++) {
    for (let y = desdeY; y <= hastaY; y++) {
      teselas.push({
        x,
        y,
        left: x * TESELA - origenX,
        top: y * TESELA - origenY,
      });
    }
  }
  return { teselas, tamano: TESELA };
}

// Abre la app de mapas del telefono con la ruta hacia la direccion
// (si no hay direccion, usa las coordenadas)
export function abrirComoLlegar(lat: number, lng: number, direccion?: string) {
  const destino = encodeURIComponent(direccion ?? `${lat},${lng}`);
  const url =
    Platform.OS === "ios"
      ? `https://maps.apple.com/?daddr=${destino}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destino}`;
  Linking.openURL(url);
}

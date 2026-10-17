import { DARK_BG, NOTA_TINTA, SERIF, TEXT } from "@/constants/constans";
import { Grupo, GrupoId } from "@/types/typesComunidad";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";

type SalaRueda = Grupo & { noLeidos: number };

type Props = {
  centro: SalaRueda; // la iglesia completa, al medio
  salas: SalaRueda[]; // los grupos, alrededor
  tamano: number;
  onAbrir: (id: GrupoId) => void;
};

const SEPARACION = 4; // linea oscura entre gajos

// Punto en el circulo (angulo en grados, 0 = arriba, sentido horario)
const punto = (cx: number, cy: number, r: number, grados: number) => {
  const rad = ((grados - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

// Gajo de dona entre dos angulos
function gajo(
  cx: number,
  cy: number,
  rExt: number,
  rInt: number,
  desde: number,
  hasta: number,
) {
  const grande = hasta - desde > 180 ? 1 : 0;
  const a = punto(cx, cy, rExt, desde);
  const b = punto(cx, cy, rExt, hasta);
  const c = punto(cx, cy, rInt, hasta);
  const d = punto(cx, cy, rInt, desde);
  return [
    `M ${a.x} ${a.y}`,
    `A ${rExt} ${rExt} 0 ${grande} 1 ${b.x} ${b.y}`,
    `L ${c.x} ${c.y}`,
    `A ${rInt} ${rInt} 0 ${grande} 0 ${d.x} ${d.y}`,
    "Z",
  ].join(" ");
}

// Rueda: "Mi Iglesia" al centro y cada sala como un gajo alrededor
export default function RuedaSalas({ centro, salas, tamano, onAbrir }: Props) {
  const c = tamano / 2;
  const rExt = c - 2;
  const rInt = c * 0.38;
  const paso = 360 / salas.length;
  // el primer gajo queda centrado arriba
  const inicio = -paso / 2;
  const centroDiametro = rInt * 2 - SEPARACION * 2;

  // Que parte se esta presionando (para dar respuesta visual)
  const [presionado, setPresionado] = useState<"centro" | number | null>(null);

  // Segun la distancia al centro y el angulo: "centro", indice del gajo o nada
  const zona = (x: number, y: number): "centro" | number | null => {
    const dx = x - c;
    const dy = y - c;
    const distancia = Math.hypot(dx, dy);
    if (distancia > rExt) return null;
    if (distancia < rInt) return "centro";
    // 0 grados = arriba, sentido horario (igual que "punto")
    const angulo = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    return Math.floor(((((angulo - inicio) % 360) + 360) % 360) / paso);
  };

  // Un solo toque para toda la rueda (funciona igual en web y en el telefono)
  const toque = Gesture.Tap()
    .runOnJS(true)
    .onBegin((e) => setPresionado(zona(e.x, e.y)))
    .onEnd((e) => {
      const z = zona(e.x, e.y);
      if (z === "centro") onAbrir(centro.id);
      else if (z !== null && salas[z]) onAbrir(salas[z].id);
    })
    .onFinalize(() => setPresionado(null));

  return (
    <GestureDetector gesture={toque}>
      <View
        style={{ width: tamano, height: tamano, alignSelf: "center" }}
        accessibilityRole="button"
        accessibilityLabel="Salas de la iglesia"
      >
        <Svg width={tamano} height={tamano} pointerEvents="none">
          {salas.map((s, i) => (
            <Path
              key={s.id}
              d={gajo(
                c,
                c,
                rExt,
                rInt,
                inicio + i * paso,
                inicio + (i + 1) * paso,
              )}
              fill={s.tono ?? "#CFCFCF"}
              fillOpacity={presionado === i ? 0.7 : 1}
              stroke={DARK_BG}
              strokeWidth={SEPARACION}
            />
          ))}
        </Svg>

        {/* Textos de cada gajo (encima del dibujo, sin bloquear el toque) */}
        {salas.map((s, i) => {
          const medio = inicio + (i + 0.5) * paso;
          const p = punto(c, c, (rExt + rInt) / 2, medio);
          return (
            <View
              key={s.id}
              pointerEvents="none"
              style={[styles.etiqueta, { left: p.x - 55, top: p.y - 40 }]}
            >
              <Text style={styles.numero}>{i + 1}.</Text>
              <Text style={styles.nombre}>{s.label}</Text>
              <Text style={styles.descripcion} numberOfLines={2}>
                ({s.descripcion})
              </Text>
              <View style={styles.iconoFila}>
                <Octicons name={s.icono} size={16} color={NOTA_TINTA} />
                {s.noLeidos > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTexto}>{s.noLeidos}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Centro: la iglesia completa */}
        <View
          pointerEvents="none"
          style={[
            styles.centro,
            {
              width: centroDiametro,
              height: centroDiametro,
              borderRadius: centroDiametro / 2,
              left: c - centroDiametro / 2,
              top: c - centroDiametro / 2,
            },
            presionado === "centro" && styles.centroPresionado,
          ]}
        >
          <Octicons name={centro.icono} size={18} color={NOTA_TINTA} />
          <Text style={styles.centroTexto}>MI{"\n"}IGLESIA</Text>
          <View style={styles.entrar}>
            <Text style={styles.entrarTexto}>Entrar</Text>
            <Octicons name="arrow-right" size={10} color={NOTA_TINTA} />
            {centro.noLeidos > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>{centro.noLeidos}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    position: "absolute",
    width: 110,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  numero: {
    fontFamily: SERIF,
    fontSize: 13,
    color: NOTA_TINTA,
  },
  nombre: {
    fontFamily: SERIF,
    fontSize: 16,
    fontWeight: "600",
    color: NOTA_TINTA,
    textAlign: "center",
  },
  descripcion: {
    fontFamily: SERIF,
    fontSize: 11,
    color: "rgba(42,42,42,0.75)",
    textAlign: "center",
  },
  iconoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NOTA_TINTA,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  centro: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: TEXT,
    // sombra para que se vea "levantado", como un boton
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  centroPresionado: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  centroTexto: {
    fontFamily: SERIF,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 2,
    lineHeight: 18,
    color: NOTA_TINTA,
    textAlign: "center",
  },
  entrar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(42,42,42,0.4)",
  },
  entrarTexto: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: NOTA_TINTA,
  },
});

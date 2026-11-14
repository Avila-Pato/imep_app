import { BORDER, MUTED, PRIMARY, SPACING, TEXT } from "@/constants/constans";
import { reintentarSubida, Subida, useSubida } from "@/store/estudios";
import Octicons from "@expo/vector-icons/Octicons";
import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ETAPAS: Record<Subida["etapa"], string> = {
  foto: "Subiendo foto…",
  guardando: "Guardando…",
  avisando: "Avisando a la iglesia…",
  listo: "Publicado ✓",
  error: "No se pudo subir",
};

// Linea de estado de una subida (anuncio o dia del cronograma): barra que se
// mueve + etapa + segundos. Si falla: "Reintentar". Solo la ve quien sube
export default function EstadoSubida({
  clave,
  textos,
}: {
  clave?: string;
  textos?: Partial<Record<Subida["etapa"], string>>;
}) {
  const sub = useSubida(clave);
  if (!sub || !clave) return null;
  return <Linea clave={clave} sub={sub} textos={textos} />;
}

function Linea({
  clave,
  sub,
  textos,
}: {
  clave: string;
  sub: Subida;
  textos?: Partial<Record<Subida["etapa"], string>>;
}) {
  const activa = sub.etapa !== "listo" && sub.etapa !== "error";
  const segundos = useSegundos(sub.desde, activa);
  const texto = textos?.[sub.etapa] ?? ETAPAS[sub.etapa];

  return (
    <View style={styles.caja}>
      {activa && <Barra />}
      <View style={styles.fila}>
        {sub.etapa === "error" && (
          <Octicons name="alert" size={12} color={PRIMARY} />
        )}
        <Text
          style={[
            styles.texto,
            sub.etapa === "listo" && styles.listo,
            sub.etapa === "error" && styles.error,
          ]}
          numberOfLines={1}
        >
          {texto}
          {sub.etapa === "error" && sub.error ? ` · ${sub.error}` : ""}
          {activa && segundos > 0 ? ` ${segundos} s` : ""}
        </Text>
        {sub.etapa === "error" && (
          <Pressable
            onPress={() => reintentarSubida(clave)}
            hitSlop={10}
            style={({ pressed }) => pressed && styles.presionado}
          >
            <Text style={styles.reintentar}>Reintentar</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Segundos desde que empezo (se actualiza cada segundo mientras sube)
function useSegundos(desde: string, activa: boolean) {
  const calcular = () =>
    Math.max(0, Math.round((Date.now() - new Date(desde).getTime()) / 1000));
  const [segundos, setSegundos] = useState(calcular);
  useEffect(() => {
    if (!activa) return;
    const t = setInterval(() => setSegundos(calcular()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- calcular usa desde
  }, [desde, activa]);
  return segundos;
}

// Barra que va y viene (no hay porcentaje real: Supabase no lo informa)
function Barra() {
  const [x] = useState(() => new Animated.Value(0));
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [x]);
  const tramo = ancho * 0.35;
  return (
    <View
      style={styles.pista}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
    >
      {ancho > 0 && (
        <Animated.View
          style={[
            styles.tramo,
            {
              width: tramo,
              transform: [
                {
                  translateX: x.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-tramo, ancho],
                  }),
                },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    gap: 6,
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: SPACING * 0.8,
  },
  pista: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: BORDER,
  },
  tramo: {
    height: 3,
    borderRadius: 2,
    backgroundColor: PRIMARY,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  texto: {
    flex: 1,
    fontSize: 12,
    color: MUTED,
  },
  listo: {
    color: TEXT,
    fontWeight: "600",
  },
  error: {
    color: PRIMARY,
  },
  reintentar: {
    fontSize: 12,
    fontWeight: "700",
    color: TEXT,
  },
  presionado: {
    opacity: 0.6,
  },
});

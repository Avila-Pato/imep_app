import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  ELEVADO,
  PLACEHOLDER,
} from "@/constants/constans";
import { buscarDireccion, Lugar } from "@/services/direcciones";
import { Iglesia } from "@/types/typesHome";
import Octicons from "@expo/vector-icons/Octicons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapaIglesia from "./MapaIglesia";

// Nombre y ubicacion de la iglesia (lo llena el pastor).
// Busca la direccion, muestra opciones y una vista previa del mapa
export default function FormIglesia({
  inicial,
  textoBoton,
  onGuardar,
}: {
  inicial?: Iglesia;
  textoBoton: string;
  onGuardar: (iglesia: Iglesia) => void;
}) {
  const [nombre, setNombre] = useState(inicial?.sede ?? "");
  const [busqueda, setBusqueda] = useState(inicial?.direccion ?? "");
  const [elegido, setElegido] = useState<Lugar | null>(
    inicial
      ? { direccion: inicial.direccion, lat: inicial.lat, lng: inicial.lng }
      : null,
  );
  const [resultados, setResultados] = useState<Lugar[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(false);
  const [ancho, setAncho] = useState(0); // para dibujar la vista previa

  // busca cuando deja de escribir (y no si ya eligio esa direccion)
  useEffect(() => {
    const texto = busqueda.trim();
    if (texto.length < 4 || texto === elegido?.direccion) return;
    const ctrl = new AbortController();
    const espera = setTimeout(() => {
      setBuscando(true);
      setError(false);
      buscarDireccion(texto, ctrl.signal)
        .then(setResultados)
        .catch(() => !ctrl.signal.aborted && setError(true))
        .finally(() => !ctrl.signal.aborted && setBuscando(false));
    }, 700);
    return () => {
      clearTimeout(espera);
      ctrl.abort();
    };
  }, [busqueda, elegido?.direccion]);

  const elegir = (l: Lugar) => {
    setElegido(l);
    setBusqueda(l.direccion);
    setResultados([]);
  };

  const listo = nombre.trim().length >= 2 && !!elegido;

  return (
    <View style={styles.contenedor}>
      <View style={styles.campo}>
        <Text style={styles.etiqueta}>NOMBRE DE LA IGLESIA</Text>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Iglesia Central"
          placeholderTextColor={PLACEHOLDER}
          autoCapitalize="words"
          style={styles.input}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.etiqueta}>DIRECCIÓN</Text>
        <View style={styles.buscador}>
          <Octicons name="location" size={14} color={MUTED} />
          <TextInput
            value={busqueda}
            onChangeText={(t) => {
              setBusqueda(t);
              if (elegido && t !== elegido.direccion) setElegido(null);
            }}
            placeholder="Calle, número y comuna"
            placeholderTextColor={PLACEHOLDER}
            autoCorrect={false}
            style={styles.buscadorInput}
          />
          {buscando && <ActivityIndicator size="small" color={MUTED} />}
        </View>
        {error && (
          <Text style={styles.error}>
            No se pudo buscar. Revisa tu conexión.
          </Text>
        )}

        {/* Opciones encontradas */}
        {resultados.length > 0 && (
          <View style={styles.resultados}>
            {resultados.map((r, i) => (
              <Pressable
                key={`${r.lat}-${r.lng}-${i}`}
                onPress={() => elegir(r)}
                style={({ pressed }) => [
                  styles.resultado,
                  i > 0 && styles.conLinea,
                  pressed && styles.presionado,
                ]}
              >
                <Octicons name="location" size={14} color={PRIMARY} />
                <Text style={styles.resultadoTexto} numberOfLines={2}>
                  {r.direccion}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Vista previa del punto elegido */}
      {elegido && (
        <View
          style={styles.previa}
          onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
        >
          {ancho > 0 && (
            <MapaIglesia
              lat={elegido.lat}
              lng={elegido.lng}
              ancho={ancho}
              alto={PREVIA_ALTO}
            />
          )}
          <View style={styles.previaChip}>
            <Octicons name="check" size={12} color={TEXT} />
            <Text style={styles.previaTexto}>Así la verán los hermanos</Text>
          </View>
        </View>
      )}

      <Pressable
        onPress={() =>
          elegido &&
          onGuardar({
            sede: nombre.trim(),
            lugar: inicial?.lugar ?? "Templo principal",
            direccion: elegido.direccion,
            lat: elegido.lat,
            lng: elegido.lng,
          })
        }
        disabled={!listo}
        style={({ pressed }) => [
          styles.boton,
          !listo && styles.botonApagado,
          pressed && styles.presionado,
        ]}
      >
        <Text style={styles.botonTexto}>{textoBoton}</Text>
      </Pressable>
    </View>
  );
}

const PREVIA_ALTO = 170;

const styles = StyleSheet.create({
  contenedor: {
    gap: SPACING * 1.6,
  },
  presionado: {
    opacity: 0.7,
  },
  campo: {
    gap: 8,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  input: {
    paddingVertical: 10,
    fontSize: 16,
    color: TEXT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    height: 48,
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  buscadorInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  error: {
    fontSize: 12,
    color: PRIMARY,
  },
  resultados: {
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: "hidden",
  },
  resultado: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: SPACING * 1.1,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  resultadoTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: TEXT,
  },
  previa: {
    height: PREVIA_ALTO,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: ELEVADO,
  },
  previaChip: {
    position: "absolute",
    left: SPACING,
    bottom: SPACING,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  previaTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT,
  },
  boton: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonApagado: {
    opacity: 0.25,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
});

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
import {
  buscarDireccion,
  Lugar,
  ubicacionActual,
} from "@/services/direcciones";
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
import SelectorMapa from "./SelectorMapa";

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
  // la ultima busqueda que no encontro nada (para decirlo)
  const [sinResultados, setSinResultados] = useState("");
  // "Usar mi ubicacion actual": null = no esta buscando
  const [ubicando, setUbicando] = useState<"buscando" | "sin-permiso" | null>(
    null,
  );
  const [error, setError] = useState(false);
  const [enMapa, setEnMapa] = useState(false); // elegir en el mapa
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
        .then((r) => {
          setResultados(r);
          setSinResultados(r.length ? "" : texto);
        })
        .catch(() => !ctrl.signal.aborted && setError(true))
        .finally(() => !ctrl.signal.aborted && setBuscando(false));
    }, 700);
    return () => {
      clearTimeout(espera);
      ctrl.abort();
    };
  }, [busqueda, elegido?.direccion]);

  // el pastor esta en el templo: un toque y listo (sin escribir la direccion)
  const usarMiUbicacion = async () => {
    setUbicando("buscando");
    setError(false);
    try {
      const l = await ubicacionActual();
      if (!l) return setUbicando("sin-permiso");
      elegir(l);
      setUbicando(null);
    } catch {
      setError(true);
      setUbicando(null);
    }
  };

  const elegir = (l: Lugar) => {
    setElegido(l);
    setBusqueda(l.direccion);
    setResultados([]);
  };

  const listo = nombre.trim().length >= 2 && !!elegido;

  return (
    <View style={styles.contenedor}>
      {enMapa && (
        <SelectorMapa
          // parte en lo elegido, o en lo primero que encontro la busqueda
          inicial={elegido ?? resultados[0]}
          onCerrar={() => setEnMapa(false)}
          onElegir={(l) => {
            elegir(l);
            setEnMapa(false);
          }}
        />
      )}
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
        {/* lo mas facil: estando en la iglesia, su ubicacion */}
        <Pressable
          onPress={usarMiUbicacion}
          disabled={ubicando === "buscando"}
          style={({ pressed }) => [
            styles.miUbicacion,
            pressed && styles.presionado,
          ]}
        >
          {ubicando === "buscando" ? (
            <ActivityIndicator size="small" color={TEXT} />
          ) : (
            <Octicons name="location" size={15} color={TEXT} />
          )}
          <View style={styles.flex}>
            <Text style={styles.miUbicacionTitulo}>
              {ubicando === "buscando"
                ? "Buscando dónde estás…"
                : "Usar mi ubicación actual"}
            </Text>
            <Text style={styles.miUbicacionTexto}>
              Si estás en la iglesia ahora, tócalo y listo
            </Text>
          </View>
        </Pressable>
        {ubicando === "sin-permiso" && (
          <Text style={styles.error}>
            Sin permiso de ubicación. Actívalo en los ajustes del teléfono o
            escribe la dirección.
          </Text>
        )}
        {/* o moviendo el mapa hasta el templo */}
        <Pressable
          onPress={() => setEnMapa(true)}
          style={({ pressed }) => [
            styles.miUbicacion,
            pressed && styles.presionado,
          ]}
        >
          <Octicons name="globe" size={15} color={TEXT} />
          <View style={styles.flex}>
            <Text style={styles.miUbicacionTitulo}>Elegir en el mapa</Text>
            <Text style={styles.miUbicacionTexto}>
              Mueve el mapa y deja el pin en tu iglesia
            </Text>
          </View>
          <Octicons name="chevron-right" size={14} color={MUTED} />
        </Pressable>
        <Text style={styles.o}>o busca la dirección</Text>
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
        {!error &&
          !buscando &&
          !elegido &&
          !!sinResultados &&
          sinResultados === busqueda.trim() && (
            <Text style={styles.ayudaBusqueda}>
              No encontramos esa dirección. Revisa cómo se escribe o agrega la
              comuna.
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
  flex: {
    flex: 1,
  },
  miUbicacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  miUbicacionTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
  miUbicacionTexto: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  o: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    marginVertical: 2,
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
  ayudaBusqueda: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
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

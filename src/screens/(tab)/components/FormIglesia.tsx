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
import { Lugar, ubicacionActual } from "@/services/direcciones";
import { Iglesia } from "@/types/typesHome";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
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
  const [elegido, setElegido] = useState<Lugar | null>(
    inicial
      ? { direccion: inicial.direccion, lat: inicial.lat, lng: inicial.lng }
      : null,
  );
  // "Usar mi ubicacion actual": null = no esta buscando
  const [ubicando, setUbicando] = useState<"buscando" | "sin-permiso" | null>(
    null,
  );
  const [error, setError] = useState(false);
  // mapa a pantalla completa: "buscar" abre con el teclado en el buscador
  const [enMapa, setEnMapa] = useState<"buscar" | "mover" | null>(null);
  const [ancho, setAncho] = useState(0); // para dibujar la vista previa
  // logo: URL, foto recien elegida, o "" si lo quito
  const [logo, setLogo] = useState(inicial?.logo ?? "");

  const elegirLogo = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1], // cuadrado: va en un circulo
      quality: 0.7,
    });
    if (!r.canceled && r.assets[0]) setLogo(r.assets[0].uri);
  };

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

  const elegir = (l: Lugar) => setElegido(l);

  const sinNombre = nombre.trim().length < 2;
  const listo = !sinNombre && !!elegido;
  // toco el boton sin completar: se le dice que falta (en vez de no hacer nada)
  const [falta, setFalta] = useState(false);
  const guardar = () => {
    if (!listo || !elegido) return setFalta(true);
    onGuardar({
      // lo demas de la iglesia (horarios...) se mantiene
      ...inicial,
      sede: nombre.trim(),
      lugar: inicial?.lugar ?? "Templo principal",
      direccion: elegido.direccion,
      lat: elegido.lat,
      lng: elegido.lng,
      // URL: se mantiene; foto nueva: se sube; "": se quita
      logo,
    });
  };

  return (
    <View style={styles.contenedor}>
      {enMapa && (
        <SelectorMapa
          inicial={elegido ?? undefined}
          buscar={enMapa === "buscar"}
          onCerrar={() => setEnMapa(null)}
          onElegir={(l) => {
            elegir(l);
            setEnMapa(null);
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
          style={[styles.input, falta && sinNombre && styles.inputFalta]}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.etiqueta}>DIRECCIÓN</Text>
        {elegido ? (
          // Ya la encontro: tarjeta aparte, con el mapa (asi la veran)
          <View style={styles.encontrada}>
            <View style={styles.encontradaFila}>
              <View style={styles.encontradaIcono}>
                <Octicons name="check" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.encontradaTitulo}>Ubicación elegida</Text>
                <Text style={styles.encontradaTexto} numberOfLines={3}>
                  {elegido.direccion}
                </Text>
              </View>
            </View>
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
                  logo={logo || undefined}
                />
              )}
              <View style={styles.previaChip}>
                <Octicons name="eye" size={12} color={TEXT} />
                <Text style={styles.previaTexto}>
                  Así la verán los hermanos
                </Text>
              </View>
            </View>
            {/* un solo boton: el mapa ya trae el buscador arriba */}
            <Pressable
              onPress={() => setEnMapa("mover")}
              hitSlop={6}
              style={({ pressed }) => [
                styles.cambiar,
                pressed && styles.presionado,
              ]}
            >
              <Octicons name="pencil" size={13} color={TEXT} />
              <Text style={styles.cambiarTexto}>Cambiar ubicación</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Buscar: abre el mapa con el buscador ARRIBA (el teclado no lo tapa) */}
            <Pressable
              onPress={() => setEnMapa("buscar")}
              style={({ pressed }) => [
                styles.buscador,
                falta && styles.buscadorFalta,
                pressed && styles.presionado,
              ]}
              accessibilityRole="search"
            >
              <Octicons name="search" size={15} color={MUTED} />
              <Text style={[styles.buscadorTexto, styles.buscadorVacio]}>
                Busca la calle o un lugar cercano
              </Text>
            </Pressable>

            {/* o de otra forma */}
            <Text style={styles.o}>o ubícala de otra forma</Text>
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
                busca la dirección.
              </Text>
            )}
            {error && (
              <Text style={styles.error}>
                No se pudo obtener la ubicación. Revisa tu conexión.
              </Text>
            )}
            {/* si la direccion no aparece: mover el mapa hasta el templo */}
            <Pressable
              onPress={() => setEnMapa("mover")}
              style={({ pressed }) => [
                styles.miUbicacion,
                pressed && styles.presionado,
              ]}
            >
              <Octicons name="globe" size={15} color={TEXT} />
              <View style={styles.flex}>
                <Text style={styles.miUbicacionTitulo}>Elegir en el mapa</Text>
                <Text style={styles.miUbicacionTexto}>
                  ¿No aparece la dirección? Mueve el mapa y deja el pin en tu
                  iglesia
                </Text>
              </View>
              <Octicons name="chevron-right" size={14} color={MUTED} />
            </Pressable>
          </>
        )}
      </View>

      {/* Logo (opcional): va en el pin del mapa */}
      <View style={styles.campo}>
        <Text style={styles.etiqueta}>LOGO DE LA IGLESIA (OPCIONAL)</Text>
        <View style={styles.logoFila}>
          <Pressable
            onPress={elegirLogo}
            style={({ pressed }) => [
              styles.logoCaja,
              pressed && styles.presionado,
            ]}
            accessibilityLabel={logo ? "Cambiar el logo" : "Elegir un logo"}
          >
            {logo ? (
              <Image
                source={{ uri: logo }}
                style={styles.logoImagen}
                contentFit="cover"
              />
            ) : (
              <Octicons name="image" size={20} color={MUTED} />
            )}
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.miUbicacionTitulo}>
              {logo ? "Logo listo" : "Agrega el logo de tu iglesia"}
            </Text>
            <Text style={styles.miUbicacionTexto}>
              Se verá en el mapa, en lugar de la casita.
            </Text>
            <View style={styles.logoAcciones}>
              <Pressable onPress={elegirLogo} hitSlop={6}>
                <Text style={styles.logoAccion}>
                  {logo ? "Cambiar" : "Elegir imagen"}
                </Text>
              </Pressable>
              {!!logo && (
                <Pressable onPress={() => setLogo("")} hitSlop={6}>
                  <Text style={[styles.logoAccion, styles.logoQuitar]}>
                    Quitar
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>

      {falta && !listo && (
        <View style={styles.falta}>
          <Octicons name="alert" size={14} color={PRIMARY} />
          <Text style={styles.faltaTexto}>
            {sinNombre
              ? "Escribe el nombre de tu iglesia para continuar."
              : "Elige dónde está tu iglesia para continuar."}
          </Text>
        </View>
      )}
      <Pressable
        onPress={guardar}
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
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    minHeight: 50,
    paddingHorizontal: SPACING * 1.4,
    paddingVertical: SPACING,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  buscadorTexto: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  buscadorVacio: {
    color: PLACEHOLDER,
  },
  inputFalta: {
    borderBottomColor: PRIMARY,
  },
  falta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  faltaTexto: {
    flex: 1,
    fontSize: 13,
    color: PRIMARY,
  },
  buscadorFalta: {
    borderColor: PRIMARY,
  },
  o: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    marginTop: 4,
  },
  // la direccion encontrada: tarjeta aparte, con borde del color de la app
  encontrada: {
    gap: SPACING,
    padding: SPACING,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  encontradaFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING,
    padding: 4,
  },
  encontradaIcono: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },
  encontradaTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1,
    color: PRIMARY,
    textTransform: "uppercase",
  },
  encontradaTexto: {
    marginTop: 3,
    fontSize: 15,
    lineHeight: 21,
    color: TEXT,
  },
  cambiar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cambiarTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
  },
  logoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.2,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  logoCaja: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: DARK_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "dashed",
  },
  logoImagen: {
    width: 64,
    height: 64,
  },
  logoAcciones: {
    flexDirection: "row",
    gap: SPACING * 1.6,
    marginTop: 6,
  },
  logoAccion: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
    textDecorationLine: "underline",
  },
  logoQuitar: {
    color: MUTED,
  },
  error: {
    fontSize: 12,
    color: PRIMARY,
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

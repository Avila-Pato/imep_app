import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  GREEN,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  primarioAlfa,
} from "@/constants/constans";
import { responder, useFuenteBiblia } from "@/store/estudios";
import { Mensaje } from "@/types/typesComunidad";
import {
  barajar,
  elegirOcultas,
  estrellasPor,
  Palabra,
  palabrasDe,
  sinSignos,
  trozosDe,
} from "@/utils/memorizar";
import Octicons from "@expo/vector-icons/Octicons";
import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const ROJO = "#E5484D";

// Los niveles del juego (el ultimo es la celebracion)
const NIVELES = [
  { titulo: "Léelo", ayuda: "Léelo en voz alta dos veces 📢" },
  { titulo: "Completa", ayuda: "Toca las palabras que faltan, en orden" },
  { titulo: "Más difícil", ayuda: "Ahora faltan más palabras 💪" },
  { titulo: "Ordena", ayuda: "Toca los pedazos en el orden correcto" },
] as const;

// Versiculo para memorizar: un juego corto de 4 niveles. Al terminarlo,
// queda como "Lo aprendí" (el lider ve quienes lo aprendieron)
export default function ModalMemorizar({
  mensaje,
  onCerrar,
}: {
  mensaje: Mensaje;
  onCerrar: () => void;
}) {
  const fuente = useFuenteBiblia();
  const texto = mensaje.versiculo ?? "";
  const [palabras] = useState(() => palabrasDe(texto));
  const [nivel, setNivel] = useState(0);
  const errores = useRef(0);
  const [estrellas, setEstrellas] = useState(0);

  const fallar = () => {
    errores.current += 1;
  };
  const siguiente = () => {
    if (nivel === NIVELES.length - 1) {
      setEstrellas(estrellasPor(errores.current));
      responder(mensaje.id, "aprendido");
    }
    setNivel((n) => n + 1);
  };
  const otraVez = () => {
    errores.current = 0;
    setNivel(0);
  };

  const fin = nivel >= NIVELES.length;
  const verso = { fontFamily: fuente.normal };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible
      animationType="slide"
      onRequestClose={onCerrar}
    >
      <ConBordes>
        {(insets) => (
          <View
            style={[
              styles.pantalla,
              {
                paddingTop: insets.top + SPACING,
                paddingBottom: insets.bottom + SPACING * 2,
              },
            ]}
          >
            {/* Arriba: nivel, avance y cerrar */}
            <View style={styles.cabecera}>
              <View style={styles.flex}>
                <Text style={styles.etiqueta}>
                  {fin
                    ? "¡TERMINASTE!"
                    : `NIVEL ${nivel + 1} DE ${NIVELES.length} · ${NIVELES[nivel].titulo.toUpperCase()}`}
                </Text>
                <Text style={styles.cita}>{mensaje.cita}</Text>
              </View>
              <Pressable
                onPress={onCerrar}
                hitSlop={10}
                style={styles.cerrar}
                accessibilityLabel="Cerrar el juego"
              >
                <Octicons name="x" size={18} color={TEXT} />
              </Pressable>
            </View>
            <View style={styles.avance}>
              {NIVELES.map((n, i) => (
                <View
                  key={n.titulo}
                  style={[styles.tramo, i < nivel && styles.tramoListo]}
                />
              ))}
            </View>

            {nivel === 0 && (
              <Leer texto={texto} verso={verso} onListo={siguiente} />
            )}
            {nivel === 1 && (
              <Completar
                key="facil"
                palabras={palabras}
                proporcion={0.3}
                maximo={6}
                verso={verso}
                onError={fallar}
                onListo={siguiente}
              />
            )}
            {nivel === 2 && (
              <Completar
                key="dificil"
                palabras={palabras}
                proporcion={0.65}
                maximo={12}
                verso={verso}
                onError={fallar}
                onListo={siguiente}
              />
            )}
            {nivel === 3 && (
              <Ordenar
                palabras={palabras}
                verso={verso}
                onError={fallar}
                onListo={siguiente}
              />
            )}
            {fin && (
              <Fin
                texto={texto}
                estrellas={estrellas}
                verso={verso}
                onOtraVez={otraVez}
                onCerrar={onCerrar}
              />
            )}
          </View>
        )}
      </ConBordes>
    </Modal>
  );
}

type Verso = { fontFamily: string };

// Nivel 1: leerlo completo
function Leer({
  texto,
  verso,
  onListo,
}: {
  texto: string;
  verso: Verso;
  onListo: () => void;
}) {
  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.centro}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.verso, verso]}>“{texto}”</Text>
        <Text style={styles.ayuda}>{NIVELES[0].ayuda}</Text>
      </ScrollView>
      <Boton texto="¡Ya lo leí!" icono="check" onPress={onListo} />
    </>
  );
}

// Niveles 2 y 3: faltan palabras; se tocan en orden desde las fichas
function Completar({
  palabras,
  proporcion,
  maximo,
  verso,
  onError,
  onListo,
}: {
  palabras: Palabra[];
  proporcion: number;
  maximo: number;
  verso: Verso;
  onError: () => void;
  onListo: () => void;
}) {
  const [ocultas] = useState(() =>
    elegirOcultas(palabras, proporcion, maximo),
  );
  const [fichas] = useState(() =>
    barajar(
      ocultas.map((i) => ({
        id: i,
        texto: sinSignos(palabras[i].texto),
        clave: palabras[i].clave,
      })),
    ),
  );
  const [llenas, setLlenas] = useState(0);
  const [usadas, setUsadas] = useState<number[]>([]);
  const [fallo, setFallo] = useState<number | null>(null);
  const listo = llenas === ocultas.length;

  const tocar = (f: (typeof fichas)[number]) => {
    if (listo) return;
    const falta = palabras[ocultas[llenas]];
    // palabras repetidas: sirve cualquier ficha con la misma palabra
    if (f.clave !== falta.clave) {
      setFallo(f.id);
      onError();
      return;
    }
    setFallo(null);
    setUsadas((u) => [...u, f.id]);
    setLlenas((n) => n + 1);
    if (llenas + 1 === ocultas.length) setTimeout(onListo, 700);
  };

  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.centro}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.verso, verso]}>
          {palabras.map((p, i) => {
            const pos = ocultas.indexOf(i);
            const espacio = i < palabras.length - 1 ? " " : "";
            if (pos === -1) return p.texto + espacio;
            if (pos < llenas) {
              return (
                <Text key={i} style={styles.acierto}>
                  {p.texto}
                  {espacio}
                </Text>
              );
            }
            const raya = "_".repeat(Math.max(3, Math.min(8, p.clave.length)));
            return (
              <Text
                key={i}
                style={pos === llenas ? styles.hueco : styles.huecoDespues}
              >
                {raya}
                {espacio}
              </Text>
            );
          })}
        </Text>
        <Text style={styles.ayuda}>
          {listo ? "¡Muy bien! 🎉" : NIVELES[proporcion < 0.5 ? 1 : 2].ayuda}
        </Text>
      </ScrollView>

      <View style={styles.fichas}>
        {fichas.map((f) =>
          usadas.includes(f.id) ? null : (
            <Pressable
              key={f.id}
              onPress={() => tocar(f)}
              style={({ pressed }) => [
                styles.ficha,
                fallo === f.id && styles.fichaMal,
                pressed && styles.presionado,
              ]}
            >
              <Text
                style={[styles.fichaTexto, fallo === f.id && styles.blanco]}
              >
                {f.texto}
              </Text>
            </Pressable>
          ),
        )}
      </View>
    </>
  );
}

// Nivel 4: armar el versiculo con los pedazos desordenados
function Ordenar({
  palabras,
  verso,
  onError,
  onListo,
}: {
  palabras: Palabra[];
  verso: Verso;
  onError: () => void;
  onListo: () => void;
}) {
  const [trozos] = useState(() => trozosDe(palabras));
  // desordenados (que no queden igual que el versiculo)
  const [orden] = useState(() => {
    const indices = trozos.map((_, i) => i);
    let r = barajar(indices);
    for (let n = 0; n < 5 && r.every((x, i) => x === i); n++) {
      r = barajar(indices);
    }
    return r;
  });
  const [usados, setUsados] = useState<number[]>([]);
  const [fallo, setFallo] = useState<number | null>(null);
  const puestos = usados.length;
  const listo = puestos === trozos.length;

  const tocar = (i: number) => {
    if (listo) return;
    // dos pedazos iguales: sirve cualquiera
    if (trozos[i] !== trozos[puestos]) {
      setFallo(i);
      onError();
      return;
    }
    setFallo(null);
    setUsados((u) => [...u, i]);
    if (puestos + 1 === trozos.length) setTimeout(onListo, 700);
  };

  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.centro}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.armado}>
          <Text style={[styles.verso, verso]}>
            {puestos === 0 ? (
              <Text style={styles.huecoDespues}>¿Cómo empieza?…</Text>
            ) : (
              <Text style={styles.acierto}>
                {trozos.slice(0, puestos).join(" ")}
              </Text>
            )}
          </Text>
        </View>
        <Text style={styles.ayuda}>
          {listo ? "¡Lo armaste completo! 🎉" : NIVELES[3].ayuda}
        </Text>
      </ScrollView>

      <View style={styles.trozos}>
        {orden.map((i) =>
          usados.includes(i) ? null : (
            <Pressable
              key={i}
              onPress={() => tocar(i)}
              style={({ pressed }) => [
                styles.ficha,
                styles.trozo,
                fallo === i && styles.fichaMal,
                pressed && styles.presionado,
              ]}
            >
              <Text
                style={[styles.fichaTexto, fallo === i && styles.blanco]}
              >
                {trozos[i]}
              </Text>
            </Pressable>
          ),
        )}
      </View>
    </>
  );
}

// Celebracion: estrellas segun los errores
function Fin({
  texto,
  estrellas,
  verso,
  onOtraVez,
  onCerrar,
}: {
  texto: string;
  estrellas: number;
  verso: Verso;
  onOtraVez: () => void;
  onCerrar: () => void;
}) {
  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.centro}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.fiesta}>🎉</Text>
        <Text style={styles.estrellas}>
          {"★".repeat(estrellas)}
          <Text style={styles.estrellaApagada}>
            {"★".repeat(3 - estrellas)}
          </Text>
        </Text>
        <Text style={styles.ganaste}>¡Lo aprendiste!</Text>
        <Text style={styles.ayuda}>
          {estrellas === 3
            ? "Sin ningún error. ¡Excelente!"
            : "Juega otra vez para ganar las 3 estrellas."}
        </Text>
        <Text style={[styles.versoChico, verso]}>“{texto}”</Text>
      </ScrollView>
      <View style={styles.botones}>
        <Pressable
          onPress={onOtraVez}
          style={({ pressed }) => [styles.otraVez, pressed && styles.presionado]}
        >
          <Octicons name="sync" size={15} color={TEXT} />
          <Text style={styles.otraVezTexto}>Otra vez</Text>
        </Pressable>
        <View style={styles.flex}>
          <Boton texto="Listo" icono="check" onPress={onCerrar} />
        </View>
      </View>
    </>
  );
}

function Boton({
  texto,
  icono,
  onPress,
}: {
  texto: string;
  icono: "check";
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
    >
      <Octicons name={icono} size={17} color={DARK_BG} />
      <Text style={styles.botonTexto}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    paddingHorizontal: SPACING * 2,
    gap: SPACING * 1.4,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: PRIMARY,
  },
  cita: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 20,
    color: TEXT,
    marginTop: 2,
  },
  cerrar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  avance: {
    flexDirection: "row",
    gap: 6,
  },
  tramo: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: SURFACE,
  },
  tramoListo: {
    backgroundColor: PRIMARY,
  },
  centro: {
    flexGrow: 1,
    justifyContent: "center",
    gap: SPACING * 2,
    paddingVertical: SPACING * 2,
  },
  verso: {
    fontSize: 24,
    lineHeight: 38,
    color: TEXT,
    textAlign: "center",
  },
  versoChico: {
    fontSize: 17,
    lineHeight: 26,
    color: MUTED,
    textAlign: "center",
  },
  ayuda: {
    fontFamily: FUENTE.medium,
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
  },
  acierto: {
    color: PRIMARY,
  },
  hueco: {
    color: PRIMARY,
    backgroundColor: primarioAlfa(0.16),
  },
  huecoDespues: {
    color: MUTED,
  },
  armado: {
    minHeight: 120,
    justifyContent: "center",
    padding: SPACING * 1.6,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  fichas: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    minHeight: 60,
  },
  trozos: {
    gap: 10,
  },
  ficha: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  trozo: {
    alignItems: "center",
  },
  fichaMal: {
    backgroundColor: ROJO,
    borderColor: ROJO,
  },
  fichaTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 17,
    color: TEXT,
    textAlign: "center",
  },
  blanco: {
    color: "#FFFFFF",
  },
  fiesta: {
    fontSize: 64,
    textAlign: "center",
  },
  estrellas: {
    fontSize: 44,
    color: "#F5B83D",
    textAlign: "center",
    letterSpacing: 6,
  },
  estrellaApagada: {
    color: BORDER,
  },
  ganaste: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 32,
    color: GREEN,
    textAlign: "center",
  },
  botones: {
    flexDirection: "row",
    gap: SPACING,
  },
  otraVez: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 54,
    paddingHorizontal: SPACING * 2,
    borderRadius: 16,
    backgroundColor: SURFACE,
  },
  otraVezTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  boton: {
    flexDirection: "row",
    gap: 8,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_BG,
  },
});

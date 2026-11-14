import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  primarioAlfa,
} from "@/constants/constans";
import {
  borrarPeticion,
  fijarPeticion,
  revisarPeticion,
  useEstudios,
} from "@/store/estudios";
import { Publicacion } from "@/types/typesComunidad";
import { enMuro, estadoPeticion, inicioPeticion } from "@/utils/peticiones";
import { haceCuanto, tiempoRestante } from "@/utils/tiempo";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ModalPedirOracion from "./ModalPedirOracion";

// Oracion, vista del pastor: las peticiones que esperan su aprobacion (las
// aprueba o rechaza aqui mismo), las que estan en el muro (y puede quitarlas
// por si acaso) y pedir oracion el tambien (la suya se publica directo)
export default function OracionPastor() {
  const { publicaciones, revisiones } = useEstudios();
  const [pidiendo, setPidiendo] = useState(false);

  const pendientes = publicaciones
    .filter(
      (p) => p.mia === false && estadoPeticion(p, revisiones) === "pendiente",
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha)); // la mas antigua primero
  const enElMuro = publicaciones
    .filter((p) => enMuro(p, revisiones))
    .sort((a, b) =>
      inicioPeticion(b, revisiones).localeCompare(
        inicioPeticion(a, revisiones),
      ),
    );

  // quitar del muro: se borra para todos (pide confirmacion)
  const quitar = (p: Publicacion) => {
    const texto = `La petición de ${p.autor} se borrará del muro para todos.`;
    if (Platform.OS === "web") {
      if (
        window.confirm(`¿Quitar del muro?

${texto}`)
      )
        borrarPeticion(p.id);
      return;
    }
    Alert.alert("¿Quitar del muro?", texto, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar",
        style: "destructive",
        onPress: () => borrarPeticion(p.id),
      },
    ]);
  };

  return (
    <View style={styles.contenedor}>
      <Pressable
        onPress={() => setPidiendo(true)}
        style={({ pressed }) => [styles.pedir, pressed && styles.presionado]}
      >
        <View style={styles.pedirIcono}>
          <Octicons name="heart" size={16} color={PRIMARY} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.pedirTitulo}>Hacer oración</Text>
          <Text style={styles.meta}>
            Publica una oración en el muro para que la iglesia ore contigo.
          </Text>
        </View>
        <Octicons name="chevron-right" size={16} color={MUTED} />
      </Pressable>

      {/* Por aprobar (solo si hay) */}
      {pendientes.length > 0 ? (
        <>
          <Text style={[styles.seccion, styles.cabecera]}>
            POR APROBAR · {pendientes.length}
          </Text>
          {pendientes.map((p) => (
            <View key={p.id} style={styles.tarjeta}>
              <Text style={styles.autor}>
                {p.autor} · {haceCuanto(p.fecha)}
              </Text>
              {!!p.cita && <Text style={styles.cita}>{p.cita}</Text>}
              <Text style={styles.texto}>{p.texto}</Text>
              <View style={styles.acciones}>
                <Pressable
                  onPress={() => revisarPeticion(p.id, "rechazada")}
                  style={({ pressed }) => [
                    styles.accion,
                    pressed && styles.presionado,
                  ]}
                >
                  <Text style={styles.accionTexto}>Rechazar</Text>
                </Pressable>
                <Pressable
                  onPress={() => revisarPeticion(p.id, "aprobada")}
                  style={({ pressed }) => [
                    styles.accion,
                    styles.aprobar,
                    pressed && styles.presionado,
                  ]}
                >
                  <Text style={[styles.accionTexto, styles.aprobarTexto]}>
                    Aprobar
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Text style={styles.nota}>
            Al aprobarla se publica en el muro de la iglesia por 24 horas.
          </Text>
        </>
      ) : (
        <View style={styles.vacio}>
          <Octicons name="check-circle" size={22} color={MUTED} />
          <Text style={styles.vacioTexto}>
            No hay peticiones esperando tu aprobación. Cuando un hermano pida
            oración te llegará un aviso.
          </Text>
        </View>
      )}

      {/* En el muro ahora: las ve y puede quitarlas */}
      {enElMuro.length > 0 && (
        <>
          <Text style={[styles.seccion, styles.cabecera]}>
            EN EL MURO · {enElMuro.length}
          </Text>
          {enElMuro.map((p) => (
            <View key={p.id} style={styles.tarjeta}>
              <View style={styles.filaMuro}>
                <Text style={[styles.autor, styles.flex]}>
                  {p.autor} ·{" "}
                  {p.fijada
                    ? "📌 Fijada"
                    : tiempoRestante(inicioPeticion(p, revisiones))}
                </Text>
                <Text style={styles.orando}>🙏 {p.orando}</Text>
              </View>
              {!!p.cita && p.mostrarCita && (
                <Text style={styles.cita}>{p.cita}</Text>
              )}
              <Text style={styles.texto}>{p.texto}</Text>
              <View style={styles.accionesMuro}>
                {/* mantenerla mas de 24 h (hasta soltarla) */}
                <Pressable
                  onPress={() => fijarPeticion(p.id, !p.fijada)}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.quitar,
                    pressed && styles.presionado,
                  ]}
                  accessibilityLabel={
                    p.fijada
                      ? `Dejar que la petición de ${p.autor} venza`
                      : `Mantener en el muro la petición de ${p.autor}`
                  }
                >
                  <Octicons
                    name={p.fijada ? "pin-slash" : "pin"}
                    size={13}
                    color={TEXT}
                  />
                  <Text style={[styles.quitarTexto, styles.fijarTexto]}>
                    {p.fijada
                      ? "Soltar (vence en 24 h)"
                      : "Mantener en el muro"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => quitar(p)}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.quitar,
                    pressed && styles.presionado,
                  ]}
                  accessibilityLabel={`Quitar del muro la petición de ${p.autor}`}
                >
                  <Octicons name="trash" size={13} color={PRIMARY} />
                  <Text style={styles.quitarTexto}>Quitar del muro</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}

      {pidiendo && <ModalPedirOracion onCerrar={() => setPidiendo(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.6,
  },
  contenedor: {
    gap: SPACING * 1.2,
  },
  pedir: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  pedirIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primarioAlfa(0.12),
  },
  pedirTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
  },
  cabecera: {
    marginTop: SPACING,
  },
  filaMuro: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
  },
  orando: {
    fontSize: 12,
    color: MUTED,
  },
  accionesMuro: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: SPACING * 2,
  },
  fijarTexto: {
    color: TEXT,
  },
  quitar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  quitarTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: PRIMARY,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  vacio: {
    alignItems: "center",
    gap: SPACING,
    padding: SPACING * 2,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  vacioTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    textAlign: "center",
  },
  tarjeta: {
    gap: 6,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  autor: {
    fontSize: 12,
    fontWeight: "600",
    color: MUTED,
  },
  cita: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: PRIMARY,
  },
  texto: {
    fontSize: 15,
    lineHeight: 21,
    color: TEXT,
  },
  acciones: {
    flexDirection: "row",
    gap: SPACING,
    marginTop: SPACING / 2,
  },
  accion: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  accionTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },
  aprobar: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  aprobarTexto: {
    color: DARK_BG,
  },
  nota: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
});

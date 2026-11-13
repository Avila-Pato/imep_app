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
import { revisarPeticion, useEstudios } from "@/store/estudios";
import { enMuro, estadoPeticion } from "@/utils/peticiones";
import { haceCuanto } from "@/utils/tiempo";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ModalPedirOracion from "./ModalPedirOracion";

// Oracion, vista del pastor: no ve el muro como los hermanos; ve las
// peticiones que esperan su aprobacion (las aprueba o rechaza aqui mismo) y
// puede pedir oracion el tambien (la suya se publica directo)
export default function OracionPastor() {
  const { publicaciones, revisiones } = useEstudios();
  const [pidiendo, setPidiendo] = useState(false);

  const pendientes = publicaciones
    .filter(
      (p) => p.mia === false && estadoPeticion(p, revisiones) === "pendiente",
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha)); // la mas antigua primero
  const enElMuro = publicaciones.filter((p) => enMuro(p, revisiones)).length;

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
          <Text style={styles.pedirTitulo}>Pedir oración</Text>
          <Text style={styles.meta}>
            La tuya se publica directo en el muro de la iglesia.
          </Text>
        </View>
        <Octicons name="chevron-right" size={16} color={MUTED} />
      </Pressable>

      <View style={styles.cabecera}>
        <Text style={styles.seccion}>
          POR APROBAR{pendientes.length ? ` · ${pendientes.length}` : ""}
        </Text>
        <Text style={styles.meta}>
          {enElMuro === 1
            ? "1 petición en el muro"
            : `${enElMuro} peticiones en el muro`}
        </Text>
      </View>

      {pendientes.length === 0 ? (
        <View style={styles.vacio}>
          <Octicons name="check-circle" size={22} color={MUTED} />
          <Text style={styles.vacioTexto}>
            No hay peticiones esperando. Cuando un hermano pida oración te
            llegará un aviso.
          </Text>
        </View>
      ) : (
        pendientes.map((p) => (
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
        ))
      )}
      <Text style={styles.nota}>
        Al aprobarla se publica en el muro de la iglesia por 24 horas.
      </Text>

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING,
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

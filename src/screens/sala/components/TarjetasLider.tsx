import {
  BORDER,
  DARK_BG,
  FUENTE,
  GREEN,
  LINEA,
  MUTED,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
  primarioAlfa,
} from "@/constants/constans";
import { esUuid } from "@/services/iglesias";
import { responder, useFuenteBiblia } from "@/store/estudios";
import { Mensaje, ValorRespuesta } from "@/types/typesComunidad";
import { deDiaKey, diaKey, diaLegible, horaMensaje } from "@/utils/tiempo";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ModalMemorizar from "./ModalMemorizar";

const nombresCon = (m: Mensaje, valor: ValorRespuesta) =>
  (m.respuestas ?? []).filter((r) => r.valor === valor).map((r) => r.nombre);

// Encuentro del grupo: cuando, donde y "Voy / No puedo". Abajo, cuantos van
// (tocar muestra quienes)
export function TarjetaEncuentro({
  mensaje,
  grande,
}: {
  mensaje: Mensaje;
  grande?: boolean; // sala con letra grande
}) {
  const [verQuienes, setVerQuienes] = useState(false);
  const e = mensaje.encuentro;
  if (!e) return null;
  const paso = e.fecha < diaKey();
  // se puede responder cuando ya llego al servidor
  const activo = !paso && !mensaje.pendiente && esUuid(mensaje.id);
  const van = nombresCon(mensaje, "voy");
  const noVan = nombresCon(mensaje, "no");
  const fecha = deDiaKey(e.fecha);
  const mes = fecha
    .toLocaleDateString("es-ES", { month: "short" })
    .replace(".", "")
    .toUpperCase();

  return (
    <View style={[styles.tarjeta, !paso && styles.destacada]}>
      <Cabecera icono="calendar" texto={`ENCUENTRO · ${mensaje.autor}`} />

      <View style={styles.fila}>
        <View style={[styles.calendario, paso && styles.apagado]}>
          <Text style={styles.calendarioMes}>{mes}</Text>
          <Text style={styles.calendarioDia}>{fecha.getDate()}</Text>
        </View>
        <View style={styles.flex}>
          {!!mensaje.titulo && (
            <Text style={styles.titulo}>{mensaje.titulo}</Text>
          )}
          <Text style={styles.dato}>
            {diaLegible(e.fecha)}
            {e.hora ? ` · ${e.hora} h` : ""}
          </Text>
          {!!e.lugar && (
            <View style={styles.lugar}>
              <Octicons name="location" size={12} color={MUTED} />
              <Text style={styles.dato} numberOfLines={2}>
                {e.lugar}
              </Text>
            </View>
          )}
        </View>
      </View>

      {!!mensaje.texto && (
        <Text style={[styles.texto, grande && styles.textoGrande]}>
          {mensaje.texto}
        </Text>
      )}

      {paso ? (
        <Text style={styles.paso}>Este encuentro ya pasó</Text>
      ) : (
        <View style={styles.botones}>
          <BotonRespuesta
            texto="Voy"
            icono="check"
            elegido={mensaje.miRespuesta === "voy"}
            deshabilitado={!activo}
            onPress={() => responder(mensaje.id, "voy")}
          />
          <BotonRespuesta
            texto="No puedo"
            icono="x"
            elegido={mensaje.miRespuesta === "no"}
            deshabilitado={!activo}
            onPress={() => responder(mensaje.id, "no")}
          />
        </View>
      )}

      {van.length + noVan.length > 0 && (
        <Pressable
          onPress={() => setVerQuienes((v) => !v)}
          hitSlop={6}
          style={styles.resumen}
          accessibilityLabel="Ver quiénes respondieron"
        >
          <Octicons name="people" size={13} color={MUTED} />
          <Text style={styles.resumenTexto}>
            {van.length} {van.length === 1 ? "va" : "van"}
            {noVan.length ? ` · ${noVan.length} no pueden` : ""}
          </Text>
          <Octicons
            name={verQuienes ? "chevron-up" : "chevron-down"}
            size={13}
            color={MUTED}
          />
        </Pressable>
      )}
      {verQuienes && (
        <View style={styles.quienes}>
          {van.length > 0 && <Quienes titulo="Van" nombres={van} />}
          {noVan.length > 0 && (
            <Quienes titulo="No pueden" nombres={noVan} />
          )}
        </View>
      )}
      <Text style={styles.hora}>{horaMensaje(mensaje.fecha)}</Text>
    </View>
  );
}

// Versiculo para memorizar: el texto y el juego. Abajo, quienes ya lo
// aprendieron
export function TarjetaMemorizar({
  mensaje,
  grande,
}: {
  mensaje: Mensaje;
  grande?: boolean;
}) {
  const fuente = useFuenteBiblia();
  const [jugando, setJugando] = useState(false);
  const [verQuienes, setVerQuienes] = useState(false);
  const aprendido = mensaje.miRespuesta === "aprendido";
  const quienes = nombresCon(mensaje, "aprendido");
  const listo = !!mensaje.versiculo;

  return (
    <View style={[styles.tarjeta, styles.destacada]}>
      <Cabecera icono="mortar-board" texto={`PARA MEMORIZAR · ${mensaje.autor}`} />

      {!!mensaje.versiculo && (
        <Text
          style={[
            styles.verso,
            { fontFamily: fuente.normal },
            grande && styles.versoGrande,
          ]}
        >
          “{mensaje.versiculo}”
        </Text>
      )}
      {!!mensaje.cita && (
        <Text style={styles.cita}>{mensaje.cita.toUpperCase()}</Text>
      )}
      {!!mensaje.texto && (
        <Text style={[styles.texto, grande && styles.textoGrande]}>
          {mensaje.texto}
        </Text>
      )}

      {aprendido && (
        <View style={styles.logro}>
          <Octicons name="check-circle-fill" size={14} color={GREEN} />
          <Text style={styles.logroTexto}>¡Ya lo aprendiste!</Text>
        </View>
      )}

      {listo && (
        <Pressable
          onPress={() => setJugando(true)}
          style={({ pressed }) => [
            styles.jugar,
            aprendido && styles.jugarOtra,
            pressed && styles.presionado,
          ]}
          accessibilityLabel="Jugar para memorizar el versículo"
        >
          <Text style={styles.jugarEmoji}>🎮</Text>
          <Text style={[styles.jugarTexto, aprendido && styles.jugarOtraTexto]}>
            {aprendido ? "Jugar otra vez" : "Jugar y aprenderlo"}
          </Text>
        </Pressable>
      )}

      {quienes.length > 0 && (
        <Pressable
          onPress={() => setVerQuienes((v) => !v)}
          hitSlop={6}
          style={styles.resumen}
          accessibilityLabel="Ver quiénes lo aprendieron"
        >
          <Text style={styles.estrella}>★</Text>
          <Text style={styles.resumenTexto}>
            {quienes.length === 1
              ? "1 ya lo aprendió"
              : `${quienes.length} ya lo aprendieron`}
          </Text>
          <Octicons
            name={verQuienes ? "chevron-up" : "chevron-down"}
            size={13}
            color={MUTED}
          />
        </Pressable>
      )}
      {verQuienes && (
        <View style={styles.quienes}>
          <Quienes titulo="Lo aprendieron" nombres={quienes} />
        </View>
      )}
      <Text style={styles.hora}>{horaMensaje(mensaje.fecha)}</Text>

      {jugando && (
        <ModalMemorizar mensaje={mensaje} onCerrar={() => setJugando(false)} />
      )}
    </View>
  );
}

function Cabecera({
  icono,
  texto,
}: {
  icono: "calendar" | "mortar-board";
  texto: string;
}) {
  return (
    <View style={styles.cabecera}>
      <Octicons name={icono} size={12} color={PRIMARY} />
      <Text style={styles.etiqueta} numberOfLines={1}>
        {texto.toUpperCase()}
      </Text>
    </View>
  );
}

function BotonRespuesta({
  texto,
  icono,
  elegido,
  deshabilitado,
  onPress,
}: {
  texto: string;
  icono: "check" | "x";
  elegido: boolean;
  deshabilitado: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        styles.respuesta,
        elegido && styles.respuestaElegida,
        deshabilitado && styles.apagado,
        pressed && styles.presionado,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: elegido, disabled: deshabilitado }}
    >
      <Octicons name={icono} size={15} color={elegido ? DARK_BG : TEXT} />
      <Text style={[styles.respuestaTexto, elegido && styles.oscuro]}>
        {texto}
      </Text>
    </Pressable>
  );
}

function Quienes({ titulo, nombres }: { titulo: string; nombres: string[] }) {
  return (
    <View style={styles.grupoQuienes}>
      <Text style={styles.quienesTitulo}>{titulo.toUpperCase()}</Text>
      <Text style={styles.quienesNombres}>{nombres.join(", ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.7,
  },
  apagado: {
    opacity: 0.45,
  },
  oscuro: {
    color: DARK_BG,
  },
  tarjeta: {
    alignSelf: "stretch",
    gap: SPACING,
    marginVertical: 6,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINEA,
  },
  destacada: {
    borderColor: PRIMARY,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  etiqueta: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: PRIMARY,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
  },
  calendario: {
    width: 56,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: primarioAlfa(0.14),
  },
  calendarioMes: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: PRIMARY,
  },
  calendarioDia: {
    fontSize: 24,
    fontWeight: "700",
    color: TEXT,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 19,
    color: TEXT,
  },
  dato: {
    flexShrink: 1,
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  lugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  texto: {
    fontSize: 15,
    lineHeight: 21,
    color: TEXT,
  },
  textoGrande: {
    fontSize: 19,
    lineHeight: 27,
  },
  paso: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: MUTED,
  },
  botones: {
    flexDirection: "row",
    gap: SPACING,
  },
  respuesta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: DARK_BG,
  },
  respuestaElegida: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  respuestaTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
  },
  resumen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  resumenTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: MUTED,
  },
  quienes: {
    gap: SPACING,
    padding: SPACING * 1.2,
    borderRadius: 14,
    backgroundColor: DARK_BG,
  },
  grupoQuienes: {
    gap: 3,
  },
  quienesTitulo: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: MUTED,
  },
  quienesNombres: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
  },
  verso: {
    fontSize: 19,
    lineHeight: 28,
    color: TEXT,
  },
  versoGrande: {
    fontSize: 23,
    lineHeight: 33,
  },
  cita: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: MUTED,
  },
  logro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logroTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: GREEN,
  },
  jugar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: TEXT,
  },
  jugarOtra: {
    backgroundColor: DARK_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  jugarEmoji: {
    fontSize: 18,
  },
  jugarTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: DARK_BG,
  },
  jugarOtraTexto: {
    color: TEXT,
  },
  estrella: {
    fontSize: 14,
    color: "#F5B83D",
  },
  hora: {
    alignSelf: "flex-end",
    fontSize: 10,
    color: MUTED,
  },
});

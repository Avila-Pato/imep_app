import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { terminarDesafio, useEsLider, useEstudios } from "@/store/estudios";
import { Grupo } from "@/types/typesComunidad";
import { confirmar } from "@/utils/confirmar";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import CompartirVersiculo from "./CompartirVersiculo";
import ModalNuevoDesafio from "./ModalNuevoDesafio";

const pad = (n: number) => String(n).padStart(2, "0");
const aKey = (f: Date) =>
  `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;

// "2026-11-15" -> "domingo 15"
const diaCorto = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
  });
};
// "2026-11-15" -> "dom 15"
const diaChip = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  const dia = new Date(y, m - 1, d)
    .toLocaleDateString("es-ES", { weekday: "short" })
    .replace(".", "");
  return `${dia} ${d}`;
};

// Arriba del chat de la sala: la "Palabra de la semana".
// Lider: la crea y ve quien respondio. Elegidos: la responden.
// oculto: mientras se escribe en el chat se esconde la tarjeta, pero sus
// hojas siguen abiertas (si no, al abrir el teclado se cerraban)
export default function DesafioSala({
  sala,
  oculto,
}: {
  sala: Grupo;
  oculto?: boolean;
}) {
  const { desafios, mensajes } = useEstudios();
  const lider = useEsLider(sala.id); // pastor, administrador o lider
  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);

  const hoy = aKey(new Date());
  const activo = desafios.find((d) => d.grupo === sala.id && d.hasta >= hoy);

  // Sin palabra activa: solo el lider ve el boton para darla
  if (!activo) {
    if (!lider) return null;
    return (
      <>
        {!oculto && (
          <Pressable
            onPress={() => setCreando(true)}
            style={({ pressed }) => [
              styles.nueva,
              pressed && styles.presionado,
            ]}
          >
            <View style={styles.icono}>
              <Octicons name="book" size={14} color={DARK_BG} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.nuevaTitulo}>
                Dar una palabra de la semana
              </Text>
              <Text style={styles.meta}>
                Elige hermanos para que compartan un versículo
              </Text>
            </View>
            <Octicons name="plus" size={16} color={MUTED} />
          </Pressable>
        )}
        <ModalNuevoDesafio
          sala={sala}
          visible={creando}
          onCerrar={() => setCreando(false)}
        />
      </>
    );
  }

  const respondieron = new Set(
    mensajes.filter((m) => m.desafio === activo.id).map((m) => m.autor),
  );
  const meToca =
    activo.elegidos.includes(USUARIO.nombre) &&
    !respondieron.has(USUARIO.nombre);
  const hechos = activo.elegidos.filter((n) => respondieron.has(n)).length;
  const miDia = activo.dias?.[USUARIO.nombre];
  const resumenMio = !miDia
    ? "Te toca compartir un versículo"
    : miDia === hoy
      ? "Hoy te toca compartir tu palabra"
      : miDia < hoy
        ? `Te tocaba el ${diaCorto(miDia)}`
        : `Te toca el ${diaCorto(miDia)}`;

  return (
    <>
      {!oculto && (
        <View style={[styles.tarjeta, meToca && styles.tarjetaMia]}>
          {/* Resumen (se toca para ver el detalle) */}
          <Pressable
            onPress={() => setAbierto((a) => !a)}
            style={styles.fila}
            accessibilityLabel="Palabra de la semana"
            accessibilityState={{ expanded: abierto }}
          >
            <View style={[styles.icono, meToca && styles.iconoMio]}>
              <Octicons name="book" size={14} color={DARK_BG} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.etiqueta}>PALABRA DE LA SEMANA</Text>
              <Text style={styles.resumen} numberOfLines={1}>
                {meToca
                  ? resumenMio
                  : `${hechos} de ${activo.elegidos.length} compartieron${activo.cita ? ` · ${activo.cita}` : ""}`}
              </Text>
            </View>
            {meToca ? (
              <Pressable
                onPress={() => setRespondiendo(true)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.responder,
                  pressed && styles.presionado,
                ]}
              >
                <Text style={styles.responderTexto}>Responder</Text>
              </Pressable>
            ) : (
              <Octicons
                name={abierto ? "chevron-up" : "chevron-down"}
                size={16}
                color={MUTED}
              />
            )}
          </Pressable>

          {/* Detalle */}
          {abierto && (
            <View style={styles.detalle}>
              <Text style={styles.consigna}>{activo.consigna}</Text>
              <Text style={styles.meta}>
                {activo.cita
                  ? `Versículo: ${activo.cita}`
                  : "Cada uno elige su versículo"}
                {` · hasta el ${diaCorto(activo.hasta)} · de ${activo.autor}`}
              </Text>

              <View style={styles.elegidos}>
                {activo.elegidos.map((n) => {
                  const listo = respondieron.has(n);
                  return (
                    <View
                      key={n}
                      style={[styles.elegido, listo && styles.elegidoListo]}
                    >
                      <Octicons
                        name={listo ? "check" : "clock"}
                        size={11}
                        color={listo ? DARK_BG : MUTED}
                      />
                      <Text
                        style={[
                          styles.elegidoTexto,
                          listo && styles.elegidoTextoListo,
                        ]}
                      >
                        {n === USUARIO.nombre ? "Tú" : n.split(" ")[0]}
                        {activo.dias?.[n]
                          ? ` · ${diaChip(activo.dias[n])}`
                          : ""}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {lider && (
                <View style={styles.acciones}>
                  <Pressable
                    onPress={() => setCreando(true)}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.accion,
                      pressed && styles.presionado,
                    ]}
                  >
                    <Octicons name="sync" size={12} color={TEXT} />
                    <Text style={styles.accionTexto}>Dar otra</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      confirmar(
                        "¿Terminar la palabra de la semana?",
                        "Dejará de verse arriba del chat. Las respuestas quedan en el chat.",
                        "Terminar",
                        () => terminarDesafio(activo.id),
                      )
                    }
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.accion,
                      pressed && styles.presionado,
                    ]}
                  >
                    <Octicons name="x" size={12} color={MUTED} />
                    <Text style={[styles.accionTexto, styles.apagado]}>
                      Terminar
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* se monta al responder: parte con el versiculo fijo si lo hay */}
      {respondiendo && (
        <CompartirVersiculo
          sala={sala}
          visible
          desafio={activo}
          onCerrar={() => setRespondiendo(false)}
        />
      )}
      <ModalNuevoDesafio
        sala={sala}
        visible={creando}
        onCerrar={() => setCreando(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.6,
  },
  nueva: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    marginHorizontal: PADDING,
    marginBottom: SPACING,
    padding: SPACING * 1.2,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  nuevaTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },
  tarjeta: {
    marginHorizontal: PADDING,
    marginBottom: SPACING,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  tarjetaMia: {
    borderColor: PRIMARY,
    borderWidth: 1,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 1.2,
  },
  icono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  iconoMio: {
    backgroundColor: PRIMARY,
  },
  etiqueta: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: MUTED,
  },
  resumen: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
    marginTop: 1,
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    marginTop: 2,
  },
  responder: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: TEXT,
  },
  responderTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK_BG,
  },
  detalle: {
    gap: SPACING,
    paddingHorizontal: SPACING * 1.2,
    paddingBottom: SPACING * 1.2,
  },
  consigna: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
  },
  elegidos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  elegido: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  elegidoListo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  elegidoTexto: {
    fontSize: 12,
    color: MUTED,
  },
  elegidoTextoListo: {
    color: DARK_BG,
    fontWeight: "600",
  },
  acciones: {
    flexDirection: "row",
    gap: SPACING * 1.6,
    marginTop: 2,
  },
  accion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  accionTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT,
  },
  apagado: {
    color: MUTED,
  },
});

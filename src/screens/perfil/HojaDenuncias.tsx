import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  FUENTE,
  LINEA,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { Denuncia } from "@/services/moderacion";
import { quitarMiembro, sincronizarMensajes } from "@/store/estudios";
import {
  cargarDenuncias,
  resolverDenuncia,
  useDenuncias,
} from "@/store/moderacion";
import { avisar, confirmar } from "@/utils/confirmar";
import Octicons from "@expo/vector-icons/Octicons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const cuando = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// Denuncias de los hermanos (solo el pastor, desde su Perfil). Por cada una:
// borrar el mensaje, sacar a quien lo escribio o marcarla como revisada
export default function HojaDenuncias({
  iglesiaId,
  onCerrar,
}: {
  iglesiaId?: string;
  onCerrar: () => void;
}) {
  const denuncias = useDenuncias();
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState<string | null>(null);

  useEffect(() => {
    cargarDenuncias(iglesiaId).finally(() => setCargando(false));
  }, [iglesiaId]);

  // varias denuncias del mismo mensaje se muestran como una sola
  const unicas = denuncias.filter(
    (d, i, t) =>
      t.findIndex((x) => x.tipo === d.tipo && x.refId === d.refId) === i,
  );
  const cuantas = (d: Denuncia) =>
    denuncias.filter((x) => x.tipo === d.tipo && x.refId === d.refId).length;

  const resolver = async (d: Denuncia, borrar: boolean) => {
    setTrabajando(d.id);
    const ok = await resolverDenuncia(d, borrar);
    setTrabajando(null);
    if (!ok) {
      avisar("No se pudo guardar", "Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    if (borrar) sincronizarMensajes();
  };

  const borrar = (d: Denuncia) =>
    confirmar(
      "¿Borrar el mensaje?",
      "Se borra para todos y la denuncia queda revisada.",
      "Borrar",
      () => resolver(d, true),
    );

  const sacar = (d: Denuncia) => {
    const id = d.autorId;
    if (!id) return;
    confirmar(
      `¿Quitar a ${d.autor ?? "esta persona"} de la iglesia?`,
      "Se borra el mensaje denunciado y deja de ver los anuncios, el cronograma y las salas. Para volver tendría que unirse otra vez con un código.",
      "Quitar",
      async () => {
        setTrabajando(d.id);
        const ok = await resolverDenuncia(d, true);
        const fuera = ok && (await quitarMiembro(id));
        setTrabajando(null);
        sincronizarMensajes();
        if (!fuera)
          avisar(
            "No se pudo completar",
            "Revisa tu conexión e inténtalo de nuevo.",
          );
      },
    );
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <ConBordes>
        {(insets) => (
          <View style={styles.fondo}>
            <Pressable style={styles.flex} onPress={onCerrar} />
            <View
              style={[styles.hoja, { paddingBottom: insets.bottom + SPACING }]}
            >
              <View style={styles.asa} />
              <View style={styles.cabecera}>
                <View style={styles.flex}>
                  <Text style={styles.titulo}>Denuncias</Text>
                  <Text style={styles.sub}>
                    Mensajes que los hermanos reportaron. Nadie sabe quién
                    denunció, solo tú.
                  </Text>
                </View>
                <Pressable
                  onPress={onCerrar}
                  hitSlop={10}
                  accessibilityLabel="Cerrar"
                >
                  <Octicons name="x" size={18} color={MUTED} />
                </Pressable>
              </View>

              {cargando && !unicas.length ? (
                <ActivityIndicator
                  color={MUTED}
                  style={{ paddingVertical: SPACING * 3 }}
                />
              ) : (
                <FlatList
                  style={styles.lista}
                  data={unicas}
                  keyExtractor={(d) => d.id}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.vacio}>
                      <Octicons name="check-circle" size={22} color={MUTED} />
                      <Text style={styles.vacioTexto}>
                        No hay denuncias pendientes.
                      </Text>
                    </View>
                  }
                  renderItem={({ item: d, index }) => {
                    const n = cuantas(d);
                    const ocupado = trabajando === d.id;
                    return (
                      <View style={[styles.fila, index > 0 && styles.conLinea]}>
                        <Text style={styles.donde}>
                          {d.tipo === "privado"
                            ? "Mensaje privado"
                            : `Sala ${d.sala ?? ""}`.trim()}{" "}
                          · {cuando(d.creada)}
                        </Text>
                        <Text style={styles.autor}>{d.autor ?? "Alguien"}</Text>
                        <Text style={styles.texto} numberOfLines={4}>
                          {d.texto?.trim()
                            ? `«${d.texto}»`
                            : "(nota de voz o versículo)"}
                        </Text>
                        <Text style={styles.motivo}>
                          {d.motivo}
                          {n > 1 ? ` · ${n} denuncias` : ""}
                          {d.denunciante ? ` · por ${d.denunciante}` : ""}
                        </Text>
                        {ocupado ? (
                          <ActivityIndicator
                            size="small"
                            color={MUTED}
                            style={styles.cargando}
                          />
                        ) : (
                          <View style={styles.acciones}>
                            <Boton
                              texto="Borrar mensaje"
                              icono="trash"
                              onPress={() => borrar(d)}
                            />
                            {!!d.autorId && (
                              <Boton
                                texto="Quitar de la iglesia"
                                icono="person"
                                peligro
                                onPress={() => sacar(d)}
                              />
                            )}
                            <Boton
                              texto="Está bien"
                              icono="check"
                              onPress={() => resolver(d, false)}
                            />
                          </View>
                        )}
                      </View>
                    );
                  }}
                />
              )}
            </View>
          </View>
        )}
      </ConBordes>
    </Modal>
  );
}

function Boton({
  texto,
  icono,
  peligro,
  onPress,
}: {
  texto: string;
  icono: "trash" | "person" | "check";
  peligro?: boolean;
  onPress: () => void;
}) {
  const color = peligro ? PRIMARY : TEXT;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
      accessibilityLabel={texto}
    >
      <Octicons name={icono} size={13} color={color} />
      <Text style={[styles.botonTexto, { color }]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  fondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  hoja: {
    gap: SPACING,
    maxHeight: "85%",
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  asa: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: LINEA,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING,
  },
  titulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 18,
    color: TEXT,
  },
  sub: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  lista: {
    flexGrow: 0,
  },
  fila: {
    gap: 4,
    paddingVertical: SPACING * 1.2,
  },
  conLinea: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  donde: {
    fontFamily: FUENTE.medium,
    fontSize: 11,
    color: MUTED,
  },
  autor: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  texto: {
    fontFamily: FUENTE.regular,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
  },
  motivo: {
    fontFamily: FUENTE.medium,
    fontSize: 12,
    color: PRIMARY,
  },
  acciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  botonTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
  },
  presionado: {
    opacity: 0.6,
  },
  cargando: {
    alignSelf: "flex-start",
    marginTop: 6,
  },
  vacio: {
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING * 3,
  },
  vacioTexto: {
    fontFamily: FUENTE.regular,
    fontSize: 13,
    color: MUTED,
  },
});

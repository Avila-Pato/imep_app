import AvatarPersona from "@/components/AvatarPersona";
import ConBordes from "@/components/ConBordes";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  LINEA,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import PerfilMiembro from "@/screens/sala/components/PerfilMiembro";
import {
  quitarMiembro,
  useAvatarDe,
  useIglesia,
  useMiembros,
} from "@/store/estudios";
import { Miembro } from "@/types/typesComunidad";
import { confirmar } from "@/utils/confirmar";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const sinTildes = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const desde = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : undefined;

// Los miembros de la iglesia (solo el pastor la abre, desde su Perfil).
// Tocar a alguien abre su perfil; el pastor puede quitarlo de la iglesia
export default function HojaMiembros({ onCerrar }: { onCerrar: () => void }) {
  const miembros = useMiembros();
  const iglesia = useIglesia();
  const avatarDe = useAvatarDe();
  const [busca, setBusca] = useState("");
  const [viendo, setViendo] = useState<Miembro | null>(null);
  const [quitando, setQuitando] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  // el pastor arriba, luego por nombre
  const q = sinTildes(busca.trim());
  const lista = [...miembros]
    .filter((m) => !q || sinTildes(m.nombre).includes(q))
    .sort(
      (a, b) =>
        Number(b.rol === "pastor") - Number(a.rol === "pastor") ||
        a.nombre.localeCompare(b.nombre, "es"),
    );

  // mismo nombre en dos cuentas: se distinguen por cuando se unieron
  const repetidos = new Set(
    miembros
      .map((m) => m.nombre.trim().toLowerCase())
      .filter((n, i, t) => t.indexOf(n) !== i),
  );

  const quitar = (id: string, nombre: string) =>
    confirmar(
      `¿Quitar a ${nombre} de la iglesia?`,
      "Dejará de ver los anuncios, el cronograma y las salas. Si quiere volver, tendrá que unirse otra vez con un código.",
      "Quitar",
      async () => {
        setQuitando(id);
        setFallo(null);
        const ok = await quitarMiembro(id);
        setQuitando(null);
        if (!ok) setFallo(nombre);
      },
    );

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
                  <Text style={styles.titulo}>Miembros</Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {miembros.length}{" "}
                    {miembros.length === 1 ? "persona" : "personas"}
                    {iglesia?.sede ? ` en ${iglesia.sede}` : ""}
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

              {miembros.length > 6 && (
                <View style={styles.buscador}>
                  <Octicons name="search" size={14} color={MUTED} />
                  <TextInput
                    value={busca}
                    onChangeText={setBusca}
                    placeholder="Buscar por nombre"
                    placeholderTextColor={MUTED}
                    style={styles.buscadorTexto}
                    autoCorrect={false}
                  />
                </View>
              )}

              {fallo && (
                <Text style={styles.error}>
                  No se pudo quitar a {fallo}. Revisa tu conexión e intenta otra
                  vez.
                </Text>
              )}

              <FlatList
                style={styles.lista}
                data={lista}
                keyExtractor={(m) => m.id}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={styles.vacio}>
                    {q ? "Nadie con ese nombre." : "Aún no se une nadie."}
                  </Text>
                }
                renderItem={({ item: m, index }) => {
                  const esPastor = m.rol === "pastor";
                  const yo = !!m.esYo || m.id === "yo";
                  const quitable = !yo && !esPastor && m.id !== "yo";
                  const fecha = desde(m.unido);
                  const detalle = [
                    esPastor ? "Pastor" : undefined,
                    m.sinChat || m.sinOracion
                      ? [m.sinChat && "Sin chat", m.sinOracion && "Sin oración"]
                          .filter(Boolean)
                          .join(" · ")
                      : undefined,
                    fecha &&
                    (repetidos.has(m.nombre.trim().toLowerCase()) || !esPastor)
                      ? `Se unió el ${fecha}`
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <Pressable
                      onPress={() =>
                        setViendo({
                          nombre: m.nombre,
                          id: m.id === "yo" ? undefined : m.id,
                          esYo: yo,
                          esPastor,
                          rol: esPastor ? "Pastor" : undefined,
                          sinChat: m.sinChat,
                          sinOracion: m.sinOracion,
                        })
                      }
                      style={({ pressed }) => [
                        styles.fila,
                        index > 0 && styles.conLinea,
                        pressed && styles.presionado,
                      ]}
                      accessibilityLabel={`Ver el perfil de ${m.nombre}`}
                    >
                      <AvatarPersona
                        nombre={m.nombre}
                        avatar={m.avatar ?? avatarDe(m.nombre)}
                        tamano={40}
                      />
                      <View style={styles.flex}>
                        <Text style={styles.nombre} numberOfLines={1}>
                          {m.nombre}
                          {yo && <Text style={styles.tu}> · Tú</Text>}
                        </Text>
                        {!!detalle && (
                          <Text style={styles.detalle} numberOfLines={1}>
                            {detalle}
                          </Text>
                        )}
                      </View>
                      {quitando === m.id ? (
                        <ActivityIndicator size="small" color={MUTED} />
                      ) : (
                        quitable && (
                          <Pressable
                            onPress={() => quitar(m.id, m.nombre)}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.quitar,
                              pressed && styles.presionado,
                            ]}
                            accessibilityLabel={`Quitar a ${m.nombre} de la iglesia`}
                          >
                            <Octicons name="trash" size={14} color={PRIMARY} />
                          </Pressable>
                        )
                      )}
                    </Pressable>
                  );
                }}
              />
            </View>
            {viendo && (
              <PerfilMiembro
                miembro={viendo}
                onCerrar={() => setViendo(null)}
              />
            )}
          </View>
        )}
      </ConBordes>
    </Modal>
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
    alignItems: "center",
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
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: SPACING * 1.25,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: DARK_BG,
  },
  buscadorTexto: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: FUENTE.regular,
    fontSize: 14,
    color: TEXT,
  },
  error: {
    fontFamily: FUENTE.medium,
    fontSize: 12,
    color: PRIMARY,
  },
  lista: {
    flexGrow: 0,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  conLinea: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  presionado: {
    opacity: 0.6,
  },
  nombre: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  tu: {
    fontFamily: FUENTE.regular,
    color: MUTED,
  },
  detalle: {
    fontFamily: FUENTE.regular,
    fontSize: 12,
    color: MUTED,
  },
  quitar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  vacio: {
    fontFamily: FUENTE.regular,
    fontSize: 13,
    color: MUTED,
    paddingVertical: SPACING * 2,
    textAlign: "center",
  },
});

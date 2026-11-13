import {
  BORDER,
  DARK_BG,
  MUTED,
  PRIMARY,
  SPACING,
  SURFACE,
  TEXT,
  LINEA,
} from "@/constants/constans";
import {
  agregarInvitado,
  quitarInvitado,
  useEstudios,
  useAvatarDe,
  useMiembros,
  useRoles,
} from "@/store/estudios";
import AvatarPersona from "@/components/AvatarPersona";
import { RolId } from "@/types/typesCronogramas";
import SelectorHora from "./SelectorHora";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ConBordes from "@/components/ConBordes";

const sinTildes = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Props = {
  rol: RolId | null; // null = cerrado
  fecha: string; // "Domingo, 1 de noviembre"
  actual?: string; // persona asignada ahora
  hora?: string; // "HH:MM" del turno (o la del culto)
  horaCulto?: string; // para mostrar si cambio respecto al culto
  onHora: (hora: string) => void;
  onElegir: (persona: string | null) => void;
  onCerrar: () => void;
};

// Hoja para que el admin elija a la persona de un rol
export default function ModalAsignar({
  rol,
  fecha,
  actual,
  hora,
  horaCulto,
  onHora,
  onElegir,
  onCerrar,
}: Props) {
  const { invitados } = useEstudios();
  const avatarDe = useAvatarDe();
  // los hermanos que se unieron a la iglesia (sin repetir)
  const REGISTRADOS = [...new Set(useMiembros().map((m) => m.nombre))].sort(
    (a, b) => a.localeCompare(b, "es"),
  );
  const roles = useRoles();
  const [busqueda, setBusqueda] = useState("");
  const texto = busqueda.trim().replace(/\s+/g, " ");
  // registrados + los que se agregaron a mano antes (sin cuenta en la app)
  const sinCuenta = invitados.filter((n) => !REGISTRADOS.includes(n));
  const personas = [...REGISTRADOS, ...sinCuenta].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  const lista = personas.filter((p) => sinTildes(p).includes(sinTildes(texto)));
  // alguien que no esta en la lista (ej: predicador invitado, hermano sin la app)
  const nuevo =
    !!texto && !personas.some((p) => sinTildes(p) === sinTildes(texto));

  const elegir = (persona: string | null) => {
    onElegir(persona);
    setBusqueda("");
  };
  const agregar = () => {
    if (!nuevo) return;
    agregarInvitado(texto); // queda guardado para la proxima vez
    elegir(texto);
  };
  const cerrar = () => {
    onCerrar();
    setBusqueda("");
  };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible={!!rol}
      transparent
      animationType="slide"
      onRequestClose={cerrar}
    >
      <ConBordes>
        {(insets) => (
          <>
            <Pressable style={styles.fondo} onPress={cerrar} />
            <KeyboardAvoidingView
              // en Android la hoja (pantalla completa) no se achica sola: se sube aqui
              behavior="padding"
              style={styles.hojaZona}
            >
              {rol && (
                <View
                  style={[
                    styles.hoja,
                    { paddingBottom: insets.bottom + SPACING },
                  ]}
                >
                  <View style={styles.asa} />

                  <View style={styles.cabecera}>
                    <View style={styles.icono}>
                      <Octicons
                        name={roles.de(rol).icon}
                        size={16}
                        color={TEXT}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.titulo}>{roles.de(rol).label}</Text>
                      <Text style={styles.sub}>{fecha}</Text>
                    </View>
                    <Pressable
                      onPress={cerrar}
                      hitSlop={10}
                      accessibilityLabel="Cerrar"
                    >
                      <Octicons name="x" size={18} color={MUTED} />
                    </Pressable>
                  </View>

                  {/* Hora exacta del turno (ej: 18:09) */}
                  {hora && (
                    <View style={styles.horaFila}>
                      <View style={styles.flex}>
                        <Text style={styles.horaLabel}>HORA</Text>
                        <Text style={styles.detalle}>
                          {hora === horaCulto
                            ? "La del culto"
                            : `El culto es a las ${horaCulto ?? "—"}`}
                        </Text>
                      </View>
                      <SelectorHora hora={hora} onCambiar={onHora} />
                    </View>
                  )}

                  <View style={styles.buscador}>
                    <Octicons name="search" size={14} color={MUTED} />
                    <TextInput
                      value={busqueda}
                      onChangeText={setBusqueda}
                      onSubmitEditing={agregar}
                      placeholder="Buscar o escribir un nombre nuevo"
                      placeholderTextColor={MUTED}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="done"
                      style={styles.input}
                    />
                  </View>

                  <ScrollView
                    style={styles.lista}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Agregar a alguien que no esta registrado */}
                    {nuevo ? (
                      <Pressable
                        onPress={agregar}
                        style={({ pressed }) => [
                          styles.agregar,
                          pressed && styles.presionado,
                        ]}
                      >
                        <View style={[styles.avatar, styles.avatarSel]}>
                          <Octicons name="plus" size={14} color={DARK_BG} />
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.nombre}>Agregar “{texto}”</Text>
                          <Text style={styles.detalle}>
                            No está en la app · quedará guardado
                          </Text>
                        </View>
                      </Pressable>
                    ) : (
                      !texto && (
                        <View style={styles.pista}>
                          <Octicons name="person-add" size={14} color={MUTED} />
                          <Text style={styles.pistaTexto}>
                            ¿No está en la lista? Escribe su nombre arriba para
                            agregarlo.
                          </Text>
                        </View>
                      )
                    )}
                    {lista.map((p) => {
                      const elegido = p === actual;
                      const agregado = sinCuenta.includes(p);
                      return (
                        <Pressable
                          key={p}
                          onPress={() => elegir(p)}
                          style={({ pressed }) => [
                            styles.fila,
                            pressed && styles.presionado,
                          ]}
                          accessibilityState={{ selected: elegido }}
                        >
                          {/* su foto o chibi (o sus iniciales) */}
                          <View
                            style={[styles.anillo, elegido && styles.anilloSel]}
                          >
                            <AvatarPersona
                              nombre={p}
                              avatar={avatarDe(p)}
                              tamano={36}
                            />
                          </View>
                          <View style={styles.flex}>
                            <Text style={styles.nombre}>{p}</Text>
                            {agregado && (
                              <Text style={styles.detalle}>
                                Agregado a mano
                              </Text>
                            )}
                          </View>
                          {elegido && (
                            <Octicons name="check" size={16} color={TEXT} />
                          )}
                          {agregado && !elegido && (
                            <Pressable
                              onPress={() => quitarInvitado(p)}
                              hitSlop={10}
                              accessibilityLabel={`Quitar a ${p} de la lista`}
                            >
                              <Octicons name="trash" size={14} color={MUTED} />
                            </Pressable>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {actual && (
                    <Pressable
                      onPress={() => elegir(null)}
                      style={({ pressed }) => [
                        styles.quitar,
                        pressed && styles.presionado,
                      ]}
                    >
                      <Text style={styles.quitarTexto}>Quitar a {actual}</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </KeyboardAvoidingView>
          </>
        )}
      </ConBordes>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // borde que marca a quien esta elegido
  anillo: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
  },
  anilloSel: {
    borderColor: PRIMARY,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.6,
  },
  fondo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  hojaZona: {
    flex: 1,
    justifyContent: "flex-end",
  },
  hoja: {
    maxHeight: "80%",
    paddingHorizontal: SPACING * 2,
    paddingTop: SPACING,
    gap: SPACING * 1.4,
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
    gap: SPACING * 1.2,
  },
  icono: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
  },
  titulo: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
  },
  sub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  horaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    padding: SPACING,
    paddingLeft: SPACING * 1.2,
    borderRadius: 12,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  horaLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: MUTED,
  },
  horaBoton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  horaValor: {
    minWidth: 52,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    height: 44,
    paddingHorizontal: SPACING * 1.2,
    borderRadius: 12,
    backgroundColor: DARK_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
  },
  lista: {
    flexGrow: 0,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BORDER,
  },
  avatarSel: {
    backgroundColor: TEXT,
  },
  avatarTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
  },
  avatarTextoSel: {
    color: DARK_BG,
  },
  nombre: {
    fontSize: 15,
    color: TEXT,
  },
  detalle: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  agregar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING,
    marginBottom: SPACING / 2,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  pista: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    paddingVertical: SPACING,
  },
  pistaTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
  },
  quitar: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  quitarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY,
  },
});

import ConBordes from "@/components/ConBordes";
import IconoSala from "@/components/IconoSala";
import {
  BORDER,
  DARK_BG,
  FUENTE,
  LINEA,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import { elegirIglesia, useEsPastor, useSalasDeTodas } from "@/store/estudios";
import { puedeVerSala } from "@/utils/peticiones";
import { GrupoId } from "@/types/typesComunidad";
import { Iglesia } from "@/types/typesHome";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// "Mis ministerios" (pastor) / "Mi ministerio" (hermano): cada iglesia con
// todas sus salas. Tocar una sala la abre (si es de otra iglesia, primero
// cambia a esa). El hermano ve tambien las salas a las que no pertenece,
// con candado: entra con el codigo que le da el lider
export default function HojaMinisterios({
  onCerrar,
}: {
  onCerrar: () => void;
}) {
  const todas = useSalasDeTodas();
  const esPastor = useEsPastor();

  const abrir = (iglesia: Iglesia, activa: boolean, sala: GrupoId) => {
    if (!activa) elegirIglesia(iglesia);
    onCerrar();
    router.push(`/sala/${sala}` as Href);
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
                  <Text style={styles.titulo}>
                    {esPastor ? "Mis ministerios" : "Mi ministerio"}
                  </Text>
                  <Text style={styles.sub}>
                    {todas.length === 1
                      ? "Tu iglesia y sus salas"
                      : `Tus ${todas.length} iglesias y sus salas`}
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

              <ScrollView
                style={styles.lista}
                showsVerticalScrollIndicator={false}
              >
                {todas.map(({ iglesia, activa, salas, miGrupo, guio }) => (
                  <View key={iglesia.id ?? iglesia.sede} style={styles.bloque}>
                    <View style={styles.iglesiaFila}>
                      <Text style={styles.iglesia} numberOfLines={1}>
                        {iglesia.sede}
                      </Text>
                      {activa && todas.length > 1 && (
                        <Text style={styles.activa}>Abierta ahora</Text>
                      )}
                    </View>
                    {salas.map((sala, i) => {
                      // el pastor entra a todas; el hermano, a la de toda
                      // la iglesia, la suya y las que guia
                      const entra =
                        esPastor || puedeVerSala(sala.id, miGrupo, guio);
                      const esMia = !esPastor && sala.id === miGrupo;
                      return (
                        <Pressable
                          key={sala.id}
                          onPress={
                            entra
                              ? () => abrir(iglesia, activa, sala.id)
                              : undefined
                          }
                          disabled={!entra}
                          style={({ pressed }) => [
                            styles.sala,
                            i > 0 && styles.conLinea,
                            pressed && styles.presionado,
                            !entra && styles.cerrada,
                          ]}
                          accessibilityLabel={
                            entra
                              ? `Abrir la sala ${sala.label} de ${iglesia.sede}`
                              : `${sala.label}: necesitas el código de esta sala`
                          }
                        >
                          <IconoSala sala={sala} tamano={36} />
                          <View style={styles.flex}>
                            <Text style={styles.salaNombre} numberOfLines={1}>
                              {sala.id === "general"
                                ? "Toda la iglesia"
                                : sala.label}
                            </Text>
                            <Text style={styles.salaDetalle} numberOfLines={1}>
                              {sala.id === "general"
                                ? "La sala de todos"
                                : !entra
                                  ? "Pide el código a tu líder para entrar"
                                  : [
                                      esMia
                                        ? "Tu sala"
                                        : guio.includes(sala.id)
                                          ? "La guías"
                                          : undefined,
                                      sala.lider
                                        ? `Líder: ${sala.lider}`
                                        : "Sin líder aún",
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                            </Text>
                          </View>
                          <Octicons
                            name={entra ? "chevron-right" : "lock"}
                            size={16}
                            color={MUTED}
                          />
                        </Pressable>
                      );
                    })}
                    {salas.length === 1 && (
                      <Text style={styles.vacio}>
                        {esPastor
                          ? "Aún no hay salas de grupo. Créalas desde Comunidad."
                          : "Aún no hay salas de grupo en esta iglesia."}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
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
  lista: {
    flexGrow: 0,
  },
  bloque: {
    marginBottom: SPACING * 1.5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: DARK_BG,
    overflow: "hidden",
  },
  iglesiaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: SPACING * 1.5,
    paddingTop: SPACING * 1.25,
    paddingBottom: SPACING / 2,
  },
  iglesia: {
    flex: 1,
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: MUTED,
    textTransform: "uppercase",
  },
  activa: {
    fontFamily: FUENTE.medium,
    fontSize: 11,
    color: MUTED,
  },
  sala: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SPACING * 1.5,
    paddingVertical: 10,
  },
  conLinea: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  presionado: {
    opacity: 0.6,
  },
  // sala a la que no pertenece (entra con su codigo)
  cerrada: {
    opacity: 0.55,
  },
  salaNombre: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  salaDetalle: {
    fontFamily: FUENTE.regular,
    fontSize: 12,
    color: MUTED,
  },
  vacio: {
    fontFamily: FUENTE.regular,
    fontSize: 12,
    color: MUTED,
    paddingHorizontal: SPACING * 1.5,
    paddingBottom: SPACING,
  },
});

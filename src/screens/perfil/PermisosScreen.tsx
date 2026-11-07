import { MIEMBROS } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  BORDER,
  CARGOS,
  DARK_BG,
  FUENTE,
  MUTED,
  HOME_PADDING as PADDING,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
  primarioAlfa,
} from "@/constants/constans";
import {
  alternarCargo,
  useEsPastor,
  useEstudios,
  usePuede,
} from "@/store/estudios";
import { CargoId } from "@/types/typesCargos";
import { iniciales } from "@/utils/texto";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, Redirect, router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const IDS = Object.keys(CARGOS) as CargoId[];

// Lo que deja hacer cada permiso
const PUEDE: Record<string, string> = {
  cronograma: "Edita el cronograma",
  anuncios: "Publica anuncios",
  salas: "Cuida su sala",
  roles: "Asigna roles",
};

// Toda la congregacion menos el pastor
const PERSONAS = MIEMBROS.general.filter((m) => m.rol !== "Pastor");

// El pastor y quien tenga el permiso "roles" (ej: secretaria) asignan
// roles a los hermanos (cada uno puede tener varios)
export default function PermisosScreen() {
  const esPastor = useEsPastor();
  const puedeRoles = usePuede("roles");
  const { cargos, nombre } = useEstudios();
  const [busqueda, setBusqueda] = useState("");

  if (!puedeRoles) return <Redirect href={"/perfil" as Href} />;

  const filtro = busqueda.trim().toLowerCase();
  const lista = PERSONAS.filter(
    (p) => !filtro || p.nombre.toLowerCase().includes(filtro),
  );
  // la secretaria no cambia sus propios roles (no se puede quitar el acceso sola)
  const esYo = (n: string) => !esPastor && n === (nombre ?? USUARIO.nombre);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.cabecera}>
        <Pressable
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/perfil" as Href)
          }
          hitSlop={10}
          accessibilityLabel="Volver"
        >
          <Octicons name="arrow-left" size={20} color={TEXT} />
        </Pressable>
        <Text style={styles.cabeceraTitulo}>Roles y permisos</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.titulo}>
            Delega con <Text style={styles.cursiva}>confianza</Text>
          </Text>
          <Text style={styles.sub}>
            Dale a cada hermano uno o más roles. Cada rol le permite editar
            ciertas partes de la app.{" "}
            {esPastor
              ? "Tú, como pastor, siempre puedes editar todo."
              : "Tus propios roles solo los cambia el pastor."}
          </Text>
        </View>

        {/* Que hace cada rol */}
        <Text style={styles.seccion}>LOS ROLES</Text>
        {IDS.map((id) => {
          const c = CARGOS[id];
          const cuantos = Object.values(cargos).filter((cs) =>
            cs.includes(id),
          ).length;
          return (
            <View key={id} style={styles.rol}>
              <View style={styles.rolIcono}>
                <Octicons name={c.icono} size={18} color={PRIMARY} />
              </View>
              <View style={styles.flex}>
                <View style={styles.rolFila}>
                  <Text style={styles.rolNombre}>{c.label}</Text>
                  {cuantos > 0 && (
                    <Text style={styles.rolCuantos}>
                      {cuantos} {cuantos === 1 ? "persona" : "personas"}
                    </Text>
                  )}
                </View>
                <Text style={styles.rolTexto}>{c.texto}</Text>
                <View style={styles.puede}>
                  {c.permisos.map((p) => (
                    <Text key={p} style={styles.puedeChip}>
                      {PUEDE[p]}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        {/* Asignar roles a cada hermano */}
        <Text style={[styles.seccion, styles.seccionHermanos]}>
          LOS HERMANOS
        </Text>
        <View style={styles.buscador}>
          <Octicons name="search" size={14} color={MUTED} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar hermano"
            placeholderTextColor={MUTED}
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        {lista.map((persona) => {
          const suyos = cargos[persona.nombre] ?? [];
          const bloqueado = esYo(persona.nombre);
          return (
            <View key={persona.nombre} style={styles.tarjeta}>
              <View style={styles.persona}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>
                    {iniciales(persona.nombre)}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.nombre}>
                    {persona.nombre}
                    {bloqueado ? " (tú)" : ""}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {suyos.length === 0
                      ? "Sin rol"
                      : suyos.map((c) => CARGOS[c].label).join(" · ")}
                  </Text>
                </View>
              </View>

              <View style={styles.chips}>
                {IDS.map((id) => {
                  const activo = suyos.includes(id);
                  return (
                    <Pressable
                      key={id}
                      onPress={() => alternarCargo(persona.nombre, id)}
                      disabled={bloqueado}
                      style={({ pressed }) => [
                        styles.chip,
                        activo && styles.chipActivo,
                        bloqueado && styles.chipBloqueado,
                        pressed && styles.presionado,
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: activo }}
                      accessibilityLabel={`${CARGOS[id].label} para ${persona.nombre}`}
                    >
                      <Octicons
                        name={activo ? "check" : CARGOS[id].icono}
                        size={12}
                        color={activo ? DARK_BG : MUTED}
                      />
                      <Text
                        style={[
                          styles.chipTexto,
                          activo && styles.chipTextoActivo,
                        ]}
                      >
                        {CARGOS[id].label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  flex: {
    flex: 1,
  },
  presionado: {
    opacity: 0.6,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.4,
    paddingHorizontal: PADDING,
    paddingVertical: SPACING,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  cabeceraTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
  },
  content: {
    padding: PADDING,
    paddingBottom: SPACING * 4,
    gap: SPACING * 1.2,
  },
  intro: {
    gap: 6,
    marginBottom: SPACING,
  },
  titulo: {
    fontFamily: SERIF,
    fontSize: 30,
    color: TEXT,
  },
  cursiva: {
    fontStyle: "italic",
    color: PRIMARY,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
  },
  seccionHermanos: {
    marginTop: SPACING * 1.6,
  },

  // Roles
  rol: {
    flexDirection: "row",
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
  },
  rolIcono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primarioAlfa(0.12),
  },
  rolFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING,
  },
  rolNombre: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  rolCuantos: {
    fontSize: 11,
    color: MUTED,
  },
  rolTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    marginTop: 4,
  },
  puede: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: SPACING,
  },
  puedeChip: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: DARK_BG,
    overflow: "hidden",
  },

  // Hermanos
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    height: 44,
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
  },
  tarjeta: {
    gap: SPACING * 1.2,
    padding: SPACING * 1.4,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  persona: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  avatarTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: TEXT,
  },
  nombre: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  meta: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipBloqueado: {
    opacity: 0.4,
  },
  chipActivo: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  chipTexto: {
    fontFamily: FUENTE.medium,
    fontSize: 12,
    color: MUTED,
  },
  chipTextoActivo: {
    color: DARK_BG,
  },
});

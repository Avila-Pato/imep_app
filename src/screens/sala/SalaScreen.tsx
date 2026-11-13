import {
  BORDER,
  DARK_BG,
  HOME_PADDING as PADDING,
  MUTED,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import {
  marcarVisto,
  useEsPastor,
  useEstudios,
  useEsLider,
  useGrupos,
  usePuede,
} from "@/store/estudios";
import { puedeVerSala } from "@/utils/peticiones";
import { GrupoId } from "@/types/typesComunidad";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import TabsSuperiores from "../(tab)/components/TabsSuperiores";
import VistaAnimada from "../(tab)/components/VistaAnimada";
import BotonVaciarChat from "./components/BotonVaciarChat";
import ChatSala from "./components/ChatSala";
import MiembrosSala, { miembrosDe } from "./components/MiembrosSala";
import MuroOracion from "./components/MuroOracion";
import OracionPastor from "./components/OracionPastor";
import ModalNuevaSala from "../(tab)/components/ModalNuevaSala";
import { useTecladoAbierto } from "@/hooks/useEspacioBarra";
import DesafioSala from "./components/DesafioSala";
import PeticionesPorAprobar from "./components/PeticionesPorAprobar";

type Vista = "chat" | "oracion" | "miembros";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "oracion", label: "Oración" },
  { id: "miembros", label: "Miembros" },
];

export default function SalaScreen() {
  const params = useLocalSearchParams<{ id: GrupoId; vista?: Vista }>();
  const grupos = useGrupos(); // incluye las salas que creo el pastor
  const grupo = grupos.find((g) => g.id === params.id) ?? grupos[0];
  const esPastor = useEsPastor();
  const [elegida, setVista] = useState<Vista>(params.vista ?? "chat");
  // solo lo que el pastor activo al crear la sala (Miembros siempre)
  // el chat siempre se ve: si se apago, dice que no se puede hablar
  // Oracion: los hermanos ven el muro; el pastor tiene su propia vista
  // (aprobar o rechazar peticiones y pedir oracion el tambien)
  const vistas = VISTAS.filter(
    (v) => v.id !== "oracion" || grupo.funciones?.oracion !== false,
  );
  const chatCerrado = grupo.funciones?.chat === false;
  const lider = useEsLider(grupo.id);
  const vista = vistas.some((v) => v.id === elegida) ? elegida : vistas[0].id;
  const { grupo: miGrupo, iglesia } = useEstudios();

  // Al entrar y al salir, la sala queda como leida
  useEffect(() => {
    marcarVisto(grupo.id);
    return () => marcarVisto(grupo.id);
  }, [grupo.id]);

  const cantidad = miembrosDe(grupo.id).length;
  const puedeAdministrar = usePuede("roles");
  const puedeEditar = esPastor || puedeAdministrar;
  const [editando, setEditando] = useState(false);
  const escribiendo = useTecladoAbierto();
  // el teclado se mide desde arriba de la pantalla: se suma la barra de estado
  const { top } = useSafeAreaInsets();

  // Sin iglesia o sala de otro grupo: bloqueada, vuelve a Comunidad
  if (!esPastor && (!iglesia || !puedeVerSala(grupo.id, miGrupo))) {
    return <Redirect href={"/comunidad" as Href} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Encabezado de la sala */}
      <View style={styles.cabecera}>
        <Pressable
          // si se entro directo (sin historial), vuelve a Comunidad
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/comunidad" as Href)
          }
          hitSlop={10}
          accessibilityLabel="Volver"
        >
          <Octicons name="arrow-left" size={20} color={TEXT} />
        </Pressable>
        <View style={styles.icono}>
          <Octicons name={grupo.icono} size={18} color={TEXT} />
        </View>
        <Pressable style={styles.flex} onPress={() => setVista("miembros")}>
          <Text style={styles.nombre}>{grupo.label}</Text>
          <Text style={styles.sub}>
            {cantidad} miembros ·{" "}
            {grupo.lider ? `Líder: ${grupo.lider}` : grupo.descripcion}
          </Text>
        </Pressable>
        {/* cada uno puede vaciar el chat (solo para el) */}
        {vista === "chat" && (
          <BotonVaciarChat grupo={grupo.id} nombre={grupo.label} />
        )}
        {/* pastor / administrador: editar la sala */}
        {puedeEditar && (
          <Pressable
            onPress={() => setEditando(true)}
            hitSlop={10}
            accessibilityLabel="Editar sala"
          >
            <Octicons name="gear" size={18} color={MUTED} />
          </Pressable>
        )}
      </View>

      {/* Solo el lider: peticiones que esperan su aprobacion */}
      {/* Mientras se escribe se esconden (el chat no queda aplastado) */}
      <PeticionesPorAprobar grupo={grupo.id} oculto={escribiendo} />

      {/* Palabra de la semana: la da el lider, responden los elegidos */}
      {grupo.funciones?.palabra !== false && (
        <DesafioSala sala={grupo} oculto={escribiendo} />
      )}

      <TabsSuperiores opciones={vistas} activo={vista} onCambiar={setVista} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={top}
      >
        <VistaAnimada vista={vista} style={styles.flex}>
          {vista === "chat" && <ChatSala sala={grupo} cerrado={chatCerrado} />}
          {vista === "oracion" && (
            <ScrollView
              contentContainerStyle={styles.muro}
              showsVerticalScrollIndicator={false}
            >
              {esPastor ? <OracionPastor /> : <MuroOracion grupo={grupo.id} />}
            </ScrollView>
          )}
          {vista === "miembros" && (
            <MiembrosSala grupo={grupo.id} lider={lider} />
          )}
        </VistaAnimada>
      </KeyboardAvoidingView>
      {editando && (
        <ModalNuevaSala
          visible
          sala={grupo}
          onCerrar={() => setEditando(false)}
          onBorrada={() => router.replace("/comunidad" as Href)}
        />
      )}
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
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingHorizontal: PADDING,
    paddingVertical: SPACING,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    marginBottom: SPACING / 2,
  },
  muro: {
    paddingHorizontal: PADDING,
    paddingBottom: SPACING * 4,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  nombre: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
  },
  sub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },
});

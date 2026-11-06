import {
  BORDER,
  DARK_BG,
  FUENTE,
  MUTED,
  HOME_PADDING as PADDING,
  PRIMARY,
  SERIF,
  SPACING,
  SURFACE,
  TEXT,
} from "@/constants/constans";
import {
  enviarPrueba,
  NOTIS_DISPONIBLES,
  pedirPermiso,
  tienePermiso,
} from "@/services/notificaciones";
import { alternarAviso, TipoAviso, useEstudios } from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
import Octicons from "@expo/vector-icons/Octicons";
import { Href, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TIPOS: {
  id: TipoAviso;
  titulo: string;
  texto: string;
  icono: IconName;
}[] = [
  {
    id: "cultos",
    titulo: "Cultos",
    texto: "2 horas antes de cada culto",
    icono: "bell",
  },
  {
    id: "turnos",
    titulo: "Mis turnos",
    texto: "El día anterior a las 19:00, cuando te toca servir",
    icono: "calendar",
  },
  {
    id: "anuncios",
    titulo: "Anuncios y eventos",
    texto: "La mañana del día de cada actividad",
    icono: "megaphone",
  },
];

// Notificaciones: permiso del telefono y que recordatorios recibir
export default function NotificacionesScreen() {
  const { avisos } = useEstudios();
  // null = revisando el permiso
  const [permiso, setPermiso] = useState<boolean | null>(null);
  const [probado, setProbado] = useState(false);

  useEffect(() => {
    tienePermiso().then(setPermiso);
  }, []);

  const activar = async () => {
    const ok = await pedirPermiso();
    setPermiso(ok);
    // si lo nego antes, el telefono ya no pregunta: se abren los ajustes
    if (!ok) Linking.openSettings().catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
        <Text style={styles.cabeceraTitulo}>Notificaciones</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.titulo}>
            Que nada se te <Text style={styles.cursiva}>pase</Text>
          </Text>
          <Text style={styles.sub}>
            Te recordamos los cultos, cuándo te toca servir y las actividades de
            la iglesia.
          </Text>
        </View>

        {/* Estado del permiso del telefono */}
        {!NOTIS_DISPONIBLES ? (
          <View style={styles.estado}>
            <Octicons name="device-mobile" size={18} color={MUTED} />
            <Text style={styles.estadoTexto}>
              Las notificaciones funcionan en la app del teléfono.
            </Text>
          </View>
        ) : permiso === false ? (
          <View style={[styles.estado, styles.estadoApagado]}>
            <View style={styles.flex}>
              <Text style={styles.estadoTitulo}>Están desactivadas</Text>
              <Text style={styles.estadoTexto}>
                Actívalas para recibir los recordatorios.
              </Text>
            </View>
            <Pressable
              onPress={activar}
              style={({ pressed }) => [
                styles.activar,
                pressed && styles.presionado,
              ]}
            >
              <Text style={styles.activarTexto}>Activar</Text>
            </Pressable>
          </View>
        ) : permiso ? (
          <View style={styles.estado}>
            <Octicons name="check-circle-fill" size={18} color={PRIMARY} />
            <Text style={styles.estadoTexto}>Activadas en este teléfono.</Text>
          </View>
        ) : null}

        {/* Que recibir */}
        <Text style={styles.seccion}>QUÉ QUIERES RECIBIR</Text>
        <View style={styles.lista}>
          {TIPOS.map((t, i) => {
            const activo = avisos[t.id] ?? true;
            return (
              <View key={t.id} style={[styles.fila, i > 0 && styles.conLinea]}>
                <View style={styles.icono}>
                  <Octicons name={t.icono} size={16} color={TEXT} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.filaTitulo}>{t.titulo}</Text>
                  <Text style={styles.filaTexto}>{t.texto}</Text>
                </View>
                <Switch
                  value={activo}
                  onValueChange={() => alternarAviso(t.id)}
                  trackColor={{ false: BORDER, true: PRIMARY }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={t.titulo}
                />
              </View>
            );
          })}
        </View>

        {NOTIS_DISPONIBLES && permiso && (
          <Pressable
            onPress={async () => {
              await enviarPrueba();
              setProbado(true);
            }}
            style={({ pressed }) => [
              styles.prueba,
              pressed && styles.presionado,
            ]}
          >
            <Octicons name="bell" size={14} color={TEXT} />
            <Text style={styles.pruebaTexto}>
              {probado ? "Llegará en unos segundos…" : "Enviar una de prueba"}
            </Text>
          </Pressable>
        )}
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
    gap: SPACING * 1.4,
  },
  intro: {
    gap: 6,
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
  estado: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING,
    padding: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: SURFACE,
  },
  estadoApagado: {
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  estadoTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  estadoTexto: {
    flexShrink: 1,
    fontSize: 13,
    color: MUTED,
  },
  activar: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: TEXT,
  },
  activarTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: DARK_BG,
  },
  seccion: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: MUTED,
    marginTop: SPACING,
  },
  lista: {
    paddingHorizontal: SPACING * 1.4,
    borderRadius: 18,
    backgroundColor: SURFACE,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING * 1.2,
    paddingVertical: SPACING * 1.4,
  },
  conLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  icono: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK_BG,
  },
  filaTitulo: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: TEXT,
  },
  filaTexto: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  prueba: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  pruebaTexto: {
    fontFamily: FUENTE.medium,
    fontSize: 14,
    color: TEXT,
  },
});

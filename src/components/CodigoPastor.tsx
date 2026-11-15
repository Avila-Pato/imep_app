import { Esqueleto } from "@/components/Esqueleto";
import ConBordes from "@/components/ConBordes";
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
import {
  generarCodigo,
  marcarCodigoVisto,
  useCodigoVisto,
  useEsPastor,
  useEstudios,
} from "@/store/estudios";
import { codigoVisible } from "@/utils/invitacion";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { Href, router } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

// Al entrar por primera vez, el pastor ve su codigo de invitacion y DONDE
// lo encontrara siempre (Perfil › Codigo de la iglesia). Una sola vez
export default function CodigoPastor() {
  const esPastor = useEsPastor();
  const visto = useCodigoVisto();
  const { iglesia, codigos } = useEstudios();
  const general = codigos.general;
  const mostrar = esPastor && !visto && !!iglesia;
  const [copiado, setCopiado] = useState(false);

  // el codigo se crea en el servidor (igual que en el panel)
  useEffect(() => {
    if (mostrar && !general) generarCodigo("general");
  }, [mostrar, general]);

  if (!mostrar) return null;

  const cerrar = () => marcarCodigoVisto();
  const verEnPerfil = () => {
    marcarCodigoVisto();
    router.push("/perfil" as Href);
  };
  const copiar = async () => {
    if (!general) return;
    await Clipboard.setStringAsync(codigoVisible(general.codigo));
    setCopiado(true);
  };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible
      transparent
      animationType="fade"
      onRequestClose={cerrar}
    >
      <ConBordes>
        {() => (
          <View style={styles.fondo}>
            <View style={styles.tarjeta}>
              <View style={styles.icono}>
                <Octicons name="key" size={22} color={PRIMARY} />
              </View>
              <Text style={styles.titulo}>Tu código de invitación</Text>
              <Text style={styles.texto}>
                Compártelo con los hermanos: lo escriben al registrarse y entran
                a {iglesia?.sede ?? "tu iglesia"}.
              </Text>

              {/* el codigo, grande */}
              <View style={styles.codigoCaja}>
                {general ? (
                  <Text style={styles.codigo} selectable>
                    {codigoVisible(general.codigo)}
                  </Text>
                ) : (
                  <Esqueleto ancho={140} alto={34} radio={8} />
                )}
              </View>

              {/* donde esta siempre */}
              <View style={styles.donde}>
                <Text style={styles.dondeEtiqueta}>
                  SIEMPRE LO ENCUENTRAS EN
                </Text>
                <View style={styles.ruta}>
                  <View style={styles.paso}>
                    <Octicons name="person" size={12} color={TEXT} />
                    <Text style={styles.pasoTexto}>Perfil</Text>
                  </View>
                  <Octicons name="chevron-right" size={12} color={MUTED} />
                  <View style={styles.paso}>
                    <Octicons name="key" size={12} color={TEXT} />
                    <Text style={styles.pasoTexto}>Código de la iglesia</Text>
                  </View>
                </View>
                <Text style={styles.ayuda}>
                  Arriba, en tu panel. Ahí también puedes compartirlo por
                  WhatsApp o mostrar el QR en el culto.
                </Text>
              </View>

              <View style={styles.botones}>
                <Pressable
                  onPress={copiar}
                  disabled={!general}
                  style={({ pressed }) => [
                    styles.secundario,
                    !general && styles.apagado,
                    pressed && styles.presionado,
                  ]}
                >
                  <Octicons
                    name={copiado ? "check" : "copy"}
                    size={14}
                    color={TEXT}
                  />
                  <Text style={styles.secundarioTexto}>
                    {copiado ? "Copiado" : "Copiar"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={verEnPerfil}
                  style={({ pressed }) => [
                    styles.principal,
                    pressed && styles.presionado,
                  ]}
                >
                  <Text style={styles.principalTexto}>Ver en mi perfil</Text>
                </Pressable>
              </View>
              <Pressable onPress={cerrar} hitSlop={8} style={styles.despues}>
                <Text style={styles.despuesTexto}>Entendido</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ConBordes>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING * 2.4,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  tarjeta: {
    alignItems: "center",
    gap: SPACING * 1.2,
    padding: SPACING * 2.4,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  icono: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: primarioAlfa(0.14),
  },
  titulo: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 24,
    color: TEXT,
    textAlign: "center",
  },
  texto: {
    fontFamily: FUENTE.regular,
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    textAlign: "center",
  },
  codigoCaja: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: DARK_BG,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: PRIMARY,
  },
  codigo: {
    fontFamily: FUENTE.semibold,
    fontSize: 32,
    letterSpacing: 6,
    color: TEXT,
  },
  donde: {
    alignSelf: "stretch",
    gap: 8,
    padding: SPACING * 1.4,
    borderRadius: 16,
    backgroundColor: DARK_BG,
  },
  dondeEtiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: MUTED,
  },
  ruta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  paso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: SURFACE,
  },
  pasoTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: TEXT,
  },
  ayuda: {
    fontFamily: FUENTE.regular,
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
  },
  botones: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: SPACING,
    marginTop: SPACING / 2,
  },
  secundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 50,
    paddingHorizontal: SPACING * 1.8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  secundarioTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 14,
    color: TEXT,
  },
  principal: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT,
  },
  principalTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 15,
    color: DARK_BG,
  },
  despues: {
    paddingVertical: 6,
  },
  despuesTexto: {
    fontFamily: FUENTE.medium,
    fontSize: 14,
    color: MUTED,
  },
  apagado: {
    opacity: 0.4,
  },
  presionado: {
    opacity: 0.7,
  },
});

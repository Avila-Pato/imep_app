import { FUENTE } from "@/constants/constans";
import { enlaceDeCodigo } from "@/utils/invitacion";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { Ref } from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

// Colores fijos (no del tema): la tarjeta se manda por WhatsApp o se
// imprime, tiene que verse igual para todos
const TINTA = "#1B1B1B";
const GRIS = "#6F6B66";
const SUAVE = "#F3F1EC";
const ACENTO = "#E5484D";

// Tarjeta de invitacion (se comparte como imagen): la iglesia, el QR, el
// codigo y DONDE escribirlo (un dibujo del campo de "Unete a tu iglesia")
export default function TarjetaInvitacion({
  ref,
  codigo,
  iglesia,
  sala,
}: {
  ref?: Ref<View>;
  codigo: string;
  iglesia: string;
  sala?: string; // invitacion a una sala: tambien la nombra
}) {
  return (
    <View ref={ref} collapsable={false} style={styles.tarjeta}>
      {/* marca */}
      <View style={styles.marca}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.marcaTexto}>CONGREGA</Text>
      </View>

      <Text style={styles.invita}>Te invitamos a</Text>
      <Text style={styles.iglesia} numberOfLines={2}>
        {iglesia}
      </Text>
      {!!sala && <Text style={styles.sala}>Sala {sala}</Text>}

      {/* QR + codigo */}
      <View style={styles.qrFila}>
        <View style={styles.qr}>
          <QRCode
            value={enlaceDeCodigo(codigo)}
            size={104}
            color={TINTA}
            backgroundColor="#FFFFFF"
          />
        </View>
        <View style={styles.codigoCaja}>
          <Text style={styles.etiqueta}>TU CÓDIGO</Text>
          <Text style={styles.codigo}>{codigo}</Text>
          <Text style={styles.ayuda}>o escanea el QR con la cámara</Text>
        </View>
      </View>

      {/* como entrar */}
      <Text style={[styles.etiqueta, styles.comoEntrar]}>CÓMO ENTRAR</Text>
      <Paso n={1} texto="Descarga la app Congrega" />
      <Paso n={2} texto="Ábrela y llega a «Únete a tu iglesia»" />
      <Paso n={3} texto="Escribe tu código aquí:" />

      {/* el campo de la app, con el codigo escrito */}
      <View style={styles.campoTitulo}>
        <Text style={styles.campoTituloTexto}>
          Únete a tu <Text style={styles.cursiva}>iglesia</Text>
        </Text>
      </View>
      <View style={styles.campo}>
        <Octicons name="link" size={13} color={GRIS} />
        <Text style={styles.campoTexto}>{codigo}</Text>
        <View style={styles.cursor} />
        <View style={styles.flechaCaja}>
          <Octicons name="arrow-left" size={14} color={ACENTO} />
          <Text style={styles.flechaTexto}>aquí</Text>
        </View>
      </View>
    </View>
  );
}

function Paso({ n, texto }: { n: number; texto: string }) {
  return (
    <View style={styles.paso}>
      <View style={styles.numero}>
        <Text style={styles.numeroTexto}>{n}</Text>
      </View>
      <Text style={styles.pasoTexto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    width: 320,
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  marca: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },
  logo: {
    width: 24,
    height: 24,
  },
  marcaTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 11,
    letterSpacing: 2,
    color: TINTA,
  },
  invita: {
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: GRIS,
  },
  iglesia: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 28,
    lineHeight: 32,
    color: TINTA,
  },
  sala: {
    fontFamily: FUENTE.semibold,
    fontSize: 13,
    color: ACENTO,
    marginTop: 2,
  },
  qrFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: SUAVE,
  },
  qr: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  codigoCaja: {
    flex: 1,
    gap: 2,
  },
  etiqueta: {
    fontFamily: FUENTE.semibold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: GRIS,
  },
  codigo: {
    fontFamily: FUENTE.semibold,
    fontSize: 34,
    letterSpacing: 5,
    color: TINTA,
  },
  ayuda: {
    fontFamily: FUENTE.regular,
    fontSize: 11,
    color: GRIS,
  },
  comoEntrar: {
    marginTop: 16,
    marginBottom: 8,
  },
  paso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 7,
  },
  numero: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TINTA,
  },
  numeroTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: "#FFFFFF",
  },
  pasoTexto: {
    flex: 1,
    fontFamily: FUENTE.medium,
    fontSize: 13,
    color: TINTA,
  },
  campoTitulo: {
    marginTop: 4,
    marginLeft: 32,
  },
  campoTituloTexto: {
    fontFamily: FUENTE.bibliaFuerte,
    fontSize: 16,
    color: TINTA,
  },
  cursiva: {
    fontFamily: FUENTE.bibliaCursiva,
    color: ACENTO,
  },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    marginLeft: 32,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ACENTO,
    backgroundColor: "#FFFFFF",
  },
  campoTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 16,
    letterSpacing: 3,
    color: TINTA,
  },
  cursor: {
    width: 2,
    height: 18,
    backgroundColor: ACENTO,
  },
  flechaCaja: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  flechaTexto: {
    fontFamily: FUENTE.semibold,
    fontSize: 12,
    color: ACENTO,
  },
});

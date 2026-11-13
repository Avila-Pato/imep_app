// Enlace de invitacion del pastor: https://congrega.expo.app/unirse/4K7Q
// En el telefono (con la app) se une; en la web, sin la app, muestra como
// abrirla o descargarla
import InvitacionWeb from "@/screens/perfil/InvitacionWeb";
import UnirseScreen from "@/screens/perfil/UnirseScreen";
import Head from "expo-router/head";
import { Platform } from "react-native";

export default function Unirse() {
  if (Platform.OS !== "web") return <UnirseScreen />;
  return (
    <>
      <Head>
        <title>Te invitaron a tu iglesia · Congrega</title>
        <meta
          name="description"
          content="Únete a tu iglesia en Congrega: anuncios, turnos de servicio, salas y Biblia en un solo lugar."
        />
        <meta property="og:title" content="Te invitaron a tu iglesia" />
        <meta
          property="og:description"
          content="Toca para unirte en Congrega."
        />
      </Head>
      <InvitacionWeb />
    </>
  );
}

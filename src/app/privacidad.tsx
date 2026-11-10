// Politica de privacidad (desde el Perfil y como pagina publica para Google Play)
import PrivacidadScreen from "@/screens/perfil/PrivacidadScreen";
import Head from "expo-router/head";

export default function Privacidad() {
  return (
    <>
      <Head>
        <title>Política de privacidad · Congrega</title>
        <meta
          name="description"
          content="Qué datos usa Congrega, dónde se guardan y cómo borrarlos."
        />
      </Head>
      <PrivacidadScreen />
    </>
  );
}

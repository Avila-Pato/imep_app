// Centro de ayuda (desde el Perfil y como pagina publica)
import AyudaScreen from "@/screens/perfil/AyudaScreen";
import Head from "expo-router/head";

export default function Ayuda() {
  return (
    <>
      <Head>
        <title>Centro de ayuda · Congrega</title>
        <meta
          name="description"
          content="Preguntas frecuentes de Congrega: unirse a tu iglesia, turnos, salas, Biblia y notificaciones."
        />
      </Head>
      <AyudaScreen />
    </>
  );
}

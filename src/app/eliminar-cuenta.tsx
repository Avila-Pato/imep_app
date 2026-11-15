// Como eliminar la cuenta: pagina publica que pide Google Play
// (congrega.expo.app/eliminar-cuenta)
import PaginaInfo, {
  Apartado,
  estilosInfo,
  Parrafo,
  Punto,
} from "@/screens/perfil/PaginaInfo";
import Head from "expo-router/head";
import { Text } from "react-native";

export default function EliminarCuenta() {
  return (
    <>
      <Head>
        <title>Eliminar tu cuenta · Congrega</title>
        <meta
          name="description"
          content="Cómo eliminar tu cuenta de Congrega y todos tus datos."
        />
      </Head>
      <PaginaInfo
        titulo="Eliminar tu cuenta"
        etiqueta="CONGREGA · TUS DATOS"
        bajada="Puedes eliminar tu cuenta de Congrega y tus datos cuando quieras. Se hace desde la app, al momento."
      >
        <Apartado titulo="Cómo hacerlo">
          <Punto titulo="1.">Abre Congrega en tu teléfono.</Punto>
          <Punto titulo="2.">
            Entra a <Text style={estilosInfo.negrita}>Perfil</Text> (abajo a la
            derecha).
          </Punto>
          <Punto titulo="3.">
            Baja hasta el final y toca{" "}
            <Text style={estilosInfo.negrita}>Eliminar mi cuenta</Text>.
          </Punto>
          <Punto titulo="4.">Confirma. Listo: se borra al instante.</Punto>
        </Apartado>

        <Apartado titulo="Qué se borra">
          <Punto>Tu cuenta y tu perfil (nombre y foto).</Punto>
          <Punto>
            Tus mensajes, notas de voz, chats privados, peticiones de oración,
            reacciones y respuestas.
          </Punto>
          <Punto>Tu membresía en tu iglesia y tus roles.</Punto>
          <Punto>
            Si eres pastor: tu iglesia y todo lo de ella (anuncios, cronograma,
            salas, predicaciones e invitaciones).
          </Punto>
          <Parrafo>
            No guardamos copias: lo borrado no se puede recuperar. Lo que estaba
            solo en tu teléfono (versículos guardados, estudios) se borra
            también.
          </Parrafo>
        </Apartado>

        <Apartado titulo="¿Ya no tienes la app?">
          <Parrafo>
            Instálala de nuevo, entra con la misma cuenta de Google y sigue los
            pasos de arriba. Si no puedes, escríbenos al correo de contacto de
            la ficha de Congrega en Google Play, desde el correo de tu cuenta, y
            la eliminaremos por ti en un plazo de 30 días.
          </Parrafo>
        </Apartado>
      </PaginaInfo>
    </>
  );
}

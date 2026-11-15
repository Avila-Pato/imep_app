import { Text } from "react-native";
import PaginaInfo, {
  Apartado,
  estilosInfo,
  Parrafo,
  Punto,
} from "./PaginaInfo";

// Politica de privacidad: que datos usa la app, donde se guardan, con quien
// se conecta y como borrarlos. Tambien es la pagina publica de Google Play
// (congrega.expo.app/privacidad): tiene que decir lo que la app hace HOY
export default function PrivacidadScreen() {
  return (
    <PaginaInfo
      titulo="Privacidad"
      etiqueta="POLÍTICA DE PRIVACIDAD · NOVIEMBRE 2026"
      bajada="Tu fe y tu información son personales. Aquí te contamos, con palabras simples, qué datos usa Congrega, dónde se guardan, quién los ve y cómo puedes borrarlos."
    >
      <Apartado titulo="En resumen">
        <Punto>
          Lo que compartes con tu iglesia se guarda en nuestro servidor para que
          les llegue a los demás.{" "}
          <Text style={estilosInfo.negrita}>
            Solo lo ven los miembros de tu iglesia.
          </Text>
        </Punto>
        <Punto>Lo devocional y personal se guarda solo en tu teléfono.</Punto>
        <Punto>No vendemos ni compartimos tus datos con terceros.</Punto>
        <Punto>No usamos publicidad ni rastreadores.</Punto>
        <Punto>
          Puedes eliminar tu cuenta y tus datos cuando quieras, desde la app.
        </Punto>
      </Apartado>

      <Apartado titulo="Qué guardamos en el servidor">
        <Parrafo>
          Para que tu iglesia funcione en todos los teléfonos, guardamos:
        </Parrafo>
        <Punto titulo="Tu cuenta:">
          un identificador anónimo y, si la guardas con Google, tu correo y tu
          nombre de Google.
        </Punto>
        <Punto titulo="Tu perfil:">
          el nombre que eliges y tu foto o avatar.
        </Punto>
        <Punto titulo="Tu iglesia:">
          la iglesia y la sala a las que te uniste, y tu rol o cargo.
        </Punto>
        <Punto titulo="Lo que publicas:">
          mensajes y notas de voz de las salas y los chats privados, peticiones
          de oración, reacciones y respuestas a los encuentros.
        </Punto>
        <Punto titulo="Organización (pastor y líderes):">
          anuncios, cronograma y turnos, salas, predicaciones, códigos de
          invitación y la ubicación y horarios de la iglesia.
        </Punto>
        <Punto titulo="Avisos:">
          un código de tu teléfono para enviarte notificaciones y cuáles quieres
          recibir.
        </Punto>
      </Apartado>

      <Apartado titulo="Qué queda solo en tu teléfono">
        <Parrafo>
          Tus versículos guardados, «me gusta» y resaltados, tus estudios y
          notas, tus preferencias de lectura (versión, letra, tamaño) y los
          capítulos de la Biblia que ya leíste. Si desinstalas la app, se borran
          con ella.
        </Parrafo>
      </Apartado>

      <Apartado titulo="Quién ve tu información">
        <Parrafo>
          Solo los miembros de tu iglesia, que entran con un código de
          invitación. Lo que escribes en una sala lo ven los de esa sala. Las
          peticiones de oración las revisa el líder antes de mostrarse en el
          muro. Los chats privados son solo entre tú y la otra persona. El
          pastor ve la lista de miembros de su iglesia.
        </Parrafo>
      </Apartado>

      <Apartado titulo="Servicios que usamos">
        <Parrafo>
          Solo se envía lo necesario para que cada función trabaje:
        </Parrafo>
        <Punto titulo="Supabase:">
          nuestro servidor y base de datos (guarda lo de tu iglesia, con
          conexión cifrada).
        </Punto>
        <Punto titulo="Google:">
          para iniciar sesión con tu cuenta de Google (si lo eliges), el mapa de
          tu iglesia y la búsqueda de direcciones al registrarla.
        </Punto>
        <Punto titulo="Expo:">
          para entregar las notificaciones a tu teléfono.
        </Punto>
        <Punto titulo="Bolls.life:">
          entrega el texto de la Biblia (se envía el libro y capítulo que lees).
        </Punto>
        <Punto titulo="OpenStreetMap y Esri:">
          mapa y direcciones en la versión web.
        </Punto>
        <Punto titulo="DiceBear:">
          dibuja los avatares ilustrados (no se envía tu nombre).
        </Punto>
      </Apartado>

      <Apartado titulo="Permisos del teléfono">
        <Punto titulo="Fotos:">
          para tu foto de perfil, la portada o la imagen de un anuncio o sala.
          Solo se usa la imagen que eliges.
        </Punto>
        <Punto titulo="Micrófono:">
          solo mientras grabas una nota de voz en el chat.
        </Punto>
        <Punto titulo="Ubicación:">
          solo si el pastor toca «Usar mi ubicación actual» al registrar la
          iglesia. Se guarda la ubicación de la iglesia, no la tuya ni tu
          recorrido.
        </Punto>
        <Punto titulo="Notificaciones:">
          cultos, turnos, anuncios y avisos de tu sala. Ajústalas en Perfil ›
          Notificaciones.
        </Punto>
        <Parrafo>
          Puedes quitar estos permisos cuando quieras desde los ajustes de tu
          teléfono.
        </Parrafo>
      </Apartado>

      <Apartado titulo="Cómo eliminar tu cuenta y tus datos">
        <Parrafo>
          Entra a{" "}
          <Text style={estilosInfo.negrita}>Perfil › Eliminar mi cuenta</Text>.
          Se borran tu cuenta, tu perfil, tus mensajes, notas de voz, peticiones
          y fotos. Si eres pastor, también tu iglesia con todo lo de ella. Se
          hace al momento y no se puede deshacer.
        </Parrafo>
        <Parrafo>
          Si ya no tienes la app, sigue los pasos en
          congrega.expo.app/eliminar-cuenta.
        </Parrafo>
        <Parrafo>
          <Text style={estilosInfo.negrita}>Perfil › Reiniciar app</Text> solo
          te saca de tu iglesia y borra lo de este teléfono, sin eliminar tu
          cuenta.
        </Parrafo>
      </Apartado>

      <Apartado titulo="Menores de edad">
        <Parrafo>
          Si eres menor de edad, usa la app con el conocimiento de tus padres o
          tutores y de los líderes de tu iglesia.
        </Parrafo>
      </Apartado>

      <Apartado titulo="Cambios a esta política">
        <Parrafo>
          Si la app cambia lo que hace con tu información, actualizaremos esta
          página y te avisaremos dentro de la app.
        </Parrafo>
      </Apartado>

      <Apartado titulo="Contacto">
        <Parrafo>
          Si tienes dudas sobre tu información, habla con el pastor de tu
          iglesia o escríbenos al correo de contacto que aparece en la ficha de
          Congrega en Google Play.
        </Parrafo>
      </Apartado>
    </PaginaInfo>
  );
}

import { Text } from "react-native";
import PaginaInfo, {
  Apartado,
  estilosInfo,
  Parrafo,
  Punto,
} from "./PaginaInfo";

// Politica de privacidad: que datos usa la app, donde se guardan y con
// quien se conecta. Refleja la version actual (todo en el telefono)
export default function PrivacidadScreen() {
  return (
    <PaginaInfo
      titulo="Privacidad"
      etiqueta="POLÍTICA DE PRIVACIDAD · NOVIEMBRE 2026"
      bajada="Tu fe y tu información son personales. Aquí te contamos, con palabras simples, qué datos usa la app, dónde se guardan y cómo puedes borrarlos."
    >
      <Apartado titulo="En resumen">
        <Punto>
          En esta versión, todo lo que haces en la app se guarda{" "}
          <Text style={estilosInfo.negrita}>solo en tu teléfono</Text>.
        </Punto>
        <Punto>No vendemos ni compartimos tus datos con terceros.</Punto>
        <Punto>No usamos publicidad ni rastreadores.</Punto>
        <Punto>Puedes borrar toda tu información cuando quieras.</Punto>
      </Apartado>

      <Apartado titulo="Qué información guarda la app">
        <Punto titulo="Tu perfil:">
          nombre, avatar o foto, imagen de portada, colores y tipo de letra.
        </Punto>
        <Punto titulo="Tu iglesia:">
          la iglesia y las salas a las que te uniste, y tu rol o cargo.
        </Punto>
        <Punto titulo="Tu vida devocional:">
          versículos guardados, «me gusta», resaltados, oraciones y estudios.
        </Punto>
        <Punto titulo="Tu comunidad:">
          mensajes de las salas, peticiones de oración y tu Palabra de la
          semana.
        </Punto>
        <Punto titulo="Organización:">
          turnos del cronograma, anuncios y predicaciones que se publican.
        </Punto>
      </Apartado>

      <Apartado titulo="Dónde se guarda">
        <Parrafo>
          Todo se almacena de forma local en tu dispositivo. No tenemos
          servidores propios que reciban tu información. Si desinstalas la app,
          estos datos se eliminan junto con ella.
        </Parrafo>
      </Apartado>

      <Apartado titulo="Servicios externos">
        <Parrafo>
          Para algunas funciones la app se conecta a servicios públicos. Solo se
          envía lo necesario para que funcionen, nunca tu nombre ni tus
          mensajes:
        </Parrafo>
        <Punto titulo="Bolls.life:">
          entrega el texto de la Biblia (se envía el libro y capítulo que lees).
        </Punto>
        <Punto titulo="Esri (ArcGIS):">
          dibuja el mapa de tu iglesia (se envía la zona del mapa).
        </Punto>
        <Punto titulo="OpenStreetMap (Nominatim):">
          ubica la dirección cuando el pastor registra la iglesia.
        </Punto>
        <Punto titulo="DiceBear:">
          dibuja los avatares ilustrados (se envía solo el estilo y el nombre
          del dibujo, no el tuyo).
        </Punto>
        <Punto titulo="Google Maps o Apple Maps:">
          se abren solo si tocas «Cómo llegar».
        </Punto>
      </Apartado>

      <Apartado titulo="Permisos del teléfono">
        <Punto titulo="Fotos:">
          para elegir tu foto de perfil, la portada o la imagen de un anuncio.
          Solo se usa la imagen que eliges.
        </Punto>
        <Punto titulo="Notificaciones:">
          para recordarte cultos, tus turnos, anuncios y tu Palabra de la
          semana. Puedes ajustarlas en Perfil › Notificaciones.
        </Punto>
        <Parrafo>
          Puedes quitar estos permisos en cualquier momento desde los ajustes de
          tu teléfono.
        </Parrafo>
      </Apartado>

      <Apartado titulo="Lo que ve tu iglesia">
        <Parrafo>
          Lo que publicas en una sala (mensajes, peticiones de oración, tu
          Palabra de la semana) está pensado para los miembros de esa sala. Las
          peticiones de oración las revisa el líder antes de mostrarse en el
          muro. Los chats privados son solo entre tú y la otra persona.
        </Parrafo>
      </Apartado>

      <Apartado titulo="Tus derechos y cómo borrar tus datos">
        <Parrafo>
          Puedes ver y editar tu información desde tu Perfil. Para borrar todo
          lo guardado en este teléfono, entra a{" "}
          <Text style={estilosInfo.negrita}>Perfil › Reiniciar app</Text>. Esta
          acción no se puede deshacer.
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
          Cuando la app sume funciones nuevas (por ejemplo, cuentas en línea o
          avisos entre teléfonos), actualizaremos esta página y te avisaremos
          dentro de la app.
        </Parrafo>
      </Apartado>

      <Apartado titulo="Contacto">
        <Parrafo>
          Si tienes dudas sobre tu información, habla con el pastor o el
          administrador de tu iglesia.
        </Parrafo>
      </Apartado>
    </PaginaInfo>
  );
}

import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

// (escrito aqui y no importado: este archivo corre en Node al generar la
// web, sin los modulos nativos que trae utils/invitacion)
const SITIO = "https://congrega.expo.app";

// HTML de la version web (solo se usa al generar las paginas estaticas).
// Sirve para que Google entienda que es Congrega y muestre bien el enlace.
const TITULO = "Congrega: organiza tu iglesia";
const DESCRIPCION =
  "Turnos de servicio, anuncios, salas y Biblia para tu iglesia, en un solo lugar.";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>{TITULO}</title>
        <meta name="description" content={DESCRIPCION} />
        <meta name="application-name" content="Congrega" />
        <meta name="theme-color" content="#121212" />
        {/* vista previa al compartir el enlace (WhatsApp, Facebook, etc.) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Congrega" />
        <meta property="og:title" content={TITULO} />
        <meta property="og:description" content={DESCRIPCION} />
        <meta property="og:locale" content="es_419" />
        {/* La imagen que WhatsApp muestra arriba del mensaje. Va aqui (para
            todas las paginas) porque el <Head> de cada pagina no llega al
            HTML estatico, y WhatsApp no ejecuta JavaScript. Casi siempre lo
            que se comparte es el enlace de invitacion, por eso es esa
            imagen (se genera con tienda/vista_previa.py) */}
        <meta property="og:image" content={`${SITIO}/og-invitacion.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Te invitaron a tu iglesia: descarga Congrega y escribe tu código"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

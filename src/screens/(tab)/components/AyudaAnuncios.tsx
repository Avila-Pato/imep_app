import { useEsPastor, useIglesia, usePuede } from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
import { RefObject } from "react";
import { View } from "react-native";
import PopupAyuda from "./PopupAyuda";

// Ayuda de Anuncios (solo la primera vez): la flechita señala la pestaña
export default function AyudaAnuncios({
  objetivo,
  arriba,
}: {
  objetivo: RefObject<View | null>;
  arriba: number;
}) {
  const publica = usePuede("anuncios");
  const iglesia = useIglesia();
  const esPastor = useEsPastor();
  // el paso del codigo solo si aun no se une a una iglesia
  const sinIglesia = !iglesia && !esPastor;

  return (
    <PopupAyuda
      id="anuncios"
      objetivo={objetivo}
      arriba={arriba}
      flecha="70%"
      titulo="Anuncios"
      sub="todo lo que pasa en tu iglesia"
      icono="megaphone"
      minis={["location", "calendar", "bell-fill"]}
      puntos={[
        ...(sinIglesia
          ? [
              {
                icono: "key" as IconName,
                texto:
                  "Primero únete a tu iglesia con el código de tu pastor (Perfil › Tengo un código).",
              },
            ]
          : []),
        {
          icono: "location",
          texto:
            "Arriba ves el mapa de tu iglesia y el próximo culto. Toca «Cómo llegar» para abrir el mapa.",
        },
        {
          icono: "megaphone",
          texto:
            "Aquí salen los eventos y avisos, con su fecha y hora. Toca uno para verlo completo.",
        },
        {
          icono: "shield-check",
          texto:
            "Los publica el pastor o quien tiene permiso (secretaría o comunicaciones).",
        },
        {
          icono: "bell",
          texto: "Te avisamos 2 horas antes de cada actividad.",
        },
        ...(publica
          ? [
              {
                icono: "pencil" as IconName,
                texto:
                  "Tú puedes publicar: toca «Escribir un anuncio» aquí mismo o desde tu Perfil.",
              },
            ]
          : []),
      ]}
    />
  );
}

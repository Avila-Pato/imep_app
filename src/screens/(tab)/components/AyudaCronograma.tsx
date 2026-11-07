import { useEsPastor, useIglesia, usePuede } from "@/store/estudios";
import { IconName } from "@/types/typesCronogramas";
import { RefObject } from "react";
import { View } from "react-native";
import PopupAyuda from "./PopupAyuda";

// Ayuda del Cronograma (solo la primera vez): la flechita señala la pestaña
export default function AyudaCronograma({
  objetivo,
  arriba,
}: {
  objetivo: RefObject<View | null>;
  arriba: number;
}) {
  const administra = usePuede("cronograma");
  const iglesia = useIglesia();
  const esPastor = useEsPastor();
  const sinIglesia = !iglesia && !esPastor;
  return (
    <PopupAyuda
      id="cronograma"
      objetivo={objetivo}
      arriba={arriba}
      flecha="22%"
      titulo="Cronograma"
      sub="quién sirve en cada culto"
      icono="calendar"
      minis={["people", "clock", "bell-fill"]}
      puntos={[
        ...(sinIglesia
          ? [
              {
                icono: "key" as IconName,
                texto:
                  "Para verlo, primero únete a tu iglesia con el código de tu pastor (Perfil › Tengo un código).",
              },
            ]
          : []),
        {
          icono: "shield-check",
          texto:
            "Lo maneja el pastor o el encargado del cronograma: decide quién sirve en cada culto y a qué hora.",
        },
        {
          icono: "calendar",
          texto:
            "Los días marcados del calendario son los cultos. Toca uno para ver quién sirve: Palabra, Alabanza, Ofrenda, Puerta…",
        },
        {
          icono: "bell",
          texto:
            "Si te toca servir, aparece destacado y te avisamos el día antes.",
        },
        ...(administra
          ? [
              {
                icono: "pencil" as IconName,
                texto:
                  "Tú eres encargado: toca un turno para asignar a alguien y su hora, o agrega casillas nuevas.",
              },
            ]
          : []),
      ]}
    />
  );
}

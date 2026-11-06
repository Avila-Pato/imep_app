import FormIglesia from "@/screens/(tab)/components/FormIglesia";
import { fijarIglesia, useIglesia } from "@/store/estudios";
import { Paso, Subtitulo, Titulo } from "./ui";

// Solo el pastor: nombre y ubicacion de su iglesia (los hermanos la veran
// en el mapa de Inicio al unirse con su invitacion)
export default function PasoIglesia({ onSeguir }: { onSeguir: () => void }) {
  const iglesia = useIglesia();

  return (
    <Paso>
      <Titulo texto="¿Dónde está tu " destacado="iglesia?" />
      <Subtitulo>
        Los hermanos verán aquí la ubicación al unirse. Podrás cambiarla cuando
        quieras desde Inicio.
      </Subtitulo>
      <FormIglesia
        inicial={iglesia}
        textoBoton="Continuar"
        onGuardar={(i) => {
          fijarIglesia(i);
          onSeguir();
        }}
      />
    </Paso>
  );
}

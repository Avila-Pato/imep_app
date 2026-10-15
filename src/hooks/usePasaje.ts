import { obtenerPasaje, parseCita, Verso } from "@/services/biblia";
import { useEffect, useState } from "react";

type Resultado = { cita: string; versos?: Verso[]; error?: string };

// Trae el texto de un pasaje ("Juan 3:16") desde la API de la Biblia
export function usePasaje(cita: string) {
  const [resultado, setResultado] = useState<Resultado>({ cita: "" });
  const ref = parseCita(cita);

  useEffect(() => {
    const r = parseCita(cita);
    if (!r) return;

    const ctrl = new AbortController();
    // pequeña espera para no pedir en cada letra mientras se escribe
    const espera = setTimeout(() => {
      obtenerPasaje(r, ctrl.signal)
        .then((versos) => setResultado({ cita, versos }))
        .catch(() => {
          if (!ctrl.signal.aborted)
            setResultado({ cita, error: "No se pudo cargar el pasaje" });
        });
    }, 500);

    return () => {
      clearTimeout(espera);
      ctrl.abort();
    };
  }, [cita]);

  const vigente = ref !== null && resultado.cita === cita;
  return {
    valida: ref !== null,
    cargando: ref !== null && !vigente,
    versos: vigente ? resultado.versos : undefined,
    error: vigente ? resultado.error : undefined,
  };
}

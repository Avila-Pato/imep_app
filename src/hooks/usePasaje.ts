import { obtenerPasaje, parseCita, Verso } from "@/services/biblia";
import { useEffect, useState } from "react";

//Tipado de resultado segun la cita y el verso 
type Resultado = { cita: string; versos?: Verso[]; error?: string };

// Trae el texto de un pasaje ("Juan 3:16") desde la API de la Biblia
export function usePasaje(cita: string) {
  // cita y versos cargados, la cita viene desde el input
  const [resultado, setResultado] = useState<Resultado>({ cita: "" });
  // parsea la cita, analiza los datos y los trasnforma en una estructura comprensible
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
      // limpia el timeout
      clearTimeout(espera);
      ctrl.abort();
    };
  }, [cita]);

  // vigente si la cita y el resultado son iguales
  const vigente = ref !== null && resultado.cita === cita;
  return {
    valida: ref !== null,
    cargando: ref !== null && !vigente,
    versos: vigente ? resultado.versos : undefined,
    error: vigente ? resultado.error : undefined,
  };
}

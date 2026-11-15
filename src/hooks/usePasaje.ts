import {
  obtenerPasaje,
  parseCita,
  pasajeEnMemoria,
  pasajeGuardado,
  Verso,
} from "@/services/biblia";
import { useVersion } from "@/store/estudios";
import { useEffect, useState } from "react";

//Tipado de resultado segun la cita y el verso
type Resultado = { clave: string; versos?: Verso[]; error?: string };

// Trae el texto de un pasaje ("Juan 3:16") desde la API de la Biblia,
// en la version que eligio la persona
export function usePasaje(cita: string) {
  const version = useVersion();
  // la misma cita en otra version es otro pasaje
  const clave = `${version}|${cita}`;
  // cita y versos cargados, la cita viene desde el input
  const [resultado, setResultado] = useState<Resultado>({ clave: "" });
  // parsea la cita, analiza los datos y los trasnforma en una estructura comprensible
  const ref = parseCita(cita);

  useEffect(() => {
    const r = parseCita(cita);
    if (!r) return;

    // ya en memoria: se muestra directo (abajo), no hay nada que pedir
    if (pasajeEnMemoria(r, version)) return;

    const ctrl = new AbortController();
    // guardado en el telefono: al instante, sin esperar ni internet
    let espera: ReturnType<typeof setTimeout> | undefined;
    pasajeGuardado(r, version).then((guardado) => {
      if (ctrl.signal.aborted) return;
      if (guardado) return setResultado({ clave, versos: guardado });
      // pequeña espera para no pedir en cada letra mientras se escribe
      espera = setTimeout(() => {
        obtenerPasaje(r, ctrl.signal, version)
          .then((versos) => setResultado({ clave, versos }))
          .catch(() => {
            if (!ctrl.signal.aborted)
              setResultado({ clave, error: "No se pudo cargar el pasaje" });
          });
      }, 500);
    });

    return () => {
      // limpia el timeout
      clearTimeout(espera);
      ctrl.abort();
    };
  }, [cita, version, clave]);

  // ya leido en esta sesion: sin esperar nada
  const enMemoria = ref ? pasajeEnMemoria(ref, version) : null;
  if (enMemoria) {
    return {
      valida: true,
      cargando: false,
      versos: enMemoria,
      error: undefined,
    };
  }
  // vigente si la cita (y la version) del resultado son las actuales
  const vigente = ref !== null && resultado.clave === clave;
  return {
    valida: ref !== null,
    cargando: ref !== null && !vigente,
    versos: vigente ? resultado.versos : undefined,
    error: vigente ? resultado.error : undefined,
  };
}

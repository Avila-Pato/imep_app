import { conectado, extraerCodigo, verificarCodigo } from "@/services/iglesias";
import { useEstudios, useGrupos } from "@/store/estudios";
import { leerInvitacion } from "@/utils/invitacion";
import { useEffect, useState } from "react";

export type Verificacion =
  | { estado: "vacio" }
  | { estado: "revisando" }
  | { estado: "valido"; iglesia?: string; sala?: string }
  | { estado: "invalido" };

// Revisa el codigo mientras se escribe (con una pequeña espera) y dice a que
// iglesia lleva. Con servidor solo vale lo que diga el servidor
export function useVerificarCodigo(texto: string): Verificacion {
  const grupos = useGrupos();
  const { codigos } = useEstudios();
  // ultimo resultado del servidor y de que codigo era
  const [remoto, setRemoto] = useState<{
    codigo: string;
    resultado: Verificacion;
  } | null>(null);
  const limpio = texto.trim();
  const codigo = extraerCodigo(limpio);
  const enLinea = conectado();

  useEffect(() => {
    if (!enLinea || !codigo) return;
    let vivo = true;
    const espera = setTimeout(() => {
      verificarCodigo(codigo)
        .then((r) => {
          if (!vivo) return;
          setRemoto({
            codigo,
            resultado: r
              ? { estado: "valido", iglesia: r.iglesia, sala: r.sala }
              : { estado: "invalido" },
          });
        })
        .catch((e) => {
          console.warn("[supabase]", e?.message ?? e);
          if (vivo) setRemoto({ codigo, resultado: { estado: "invalido" } });
        });
    }, 450);
    return () => {
      vivo = false;
      clearTimeout(espera);
    };
  }, [enLinea, codigo]);

  if (!limpio) return { estado: "vacio" };

  // modo de prueba (sin servidor): los codigos de este telefono
  if (!enLinea) {
    const { valida, grupo } = leerInvitacion(limpio, grupos, codigos);
    return valida
      ? {
          estado: "valido",
          sala: grupos.find((g) => g.id === grupo)?.label,
        }
      : { estado: "invalido" };
  }

  // con servidor: si no tiene forma de codigo, ni se pregunta
  if (!codigo) return { estado: "invalido" };
  // aun no llega la respuesta de este codigo
  if (remoto?.codigo !== codigo) return { estado: "revisando" };
  return remoto.resultado;
}

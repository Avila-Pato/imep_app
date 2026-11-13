import { asegurarSesion, supabase } from "@/lib/supabase";
import { esUuid } from "@/services/iglesias";
import { sincronizarContenido, useIglesia } from "@/store/estudios";
import { useEffect } from "react";

// En vivo (Supabase Realtime): cuando el admin cambia el cronograma, publica
// un anuncio o se une un hermano, esta app se entera al instante y trae lo
// nuevo (sin cerrar y abrir). Realtime respeta las reglas RLS
const TABLAS = ["turnos", "anuncios", "miembros"] as const;

export function useEnVivo() {
  const id = useIglesia()?.id;

  useEffect(() => {
    const cliente = supabase;
    if (!cliente || !esUuid(id)) return;
    let espera: ReturnType<typeof setTimeout> | undefined;
    // varios cambios seguidos (el dia se reemplaza completo): una sola carga
    const refrescar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => sincronizarContenido(), 700);
    };

    let canal: ReturnType<typeof cliente.channel> | null = null;
    let vivo = true;
    asegurarSesion()
      .then(() => {
        if (!vivo) return;
        canal = cliente.channel(`iglesia-${id}`);
        for (const tabla of TABLAS) {
          canal.on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: tabla,
              filter: `iglesia_id=eq.${id}`,
            },
            refrescar,
          );
          // los borrados no se pueden filtrar por iglesia: se revisa igual
          canal.on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: tabla },
            refrescar,
          );
        }
        canal.subscribe();
      })
      .catch((e) => console.warn("[supabase]", e?.message ?? e));

    return () => {
      vivo = false;
      clearTimeout(espera);
      if (canal) cliente.removeChannel(canal);
    };
  }, [id]);
}

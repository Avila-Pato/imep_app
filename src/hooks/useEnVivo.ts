import { asegurarSesion, supabase } from "@/lib/supabase";
import { esUuid } from "@/services/iglesias";
import {
  sincronizarContenido,
  sincronizarIglesias,
  sincronizarMensajes,
  sincronizarPeticiones,
  sincronizarSalas,
  useIglesia,
} from "@/store/estudios";
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
        // chat de las salas: solo se recarga el chat (llegan seguido)
        let esperaChat: ReturnType<typeof setTimeout> | undefined;
        canal.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "mensajes",
            filter: `iglesia_id=eq.${id}`,
          },
          () => {
            clearTimeout(esperaChat);
            esperaChat = setTimeout(() => sincronizarMensajes(), 300);
          },
        );
        // reacciones a los mensajes (alguien puso o quito un emoji)
        canal.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reacciones",
            filter: `iglesia_id=eq.${id}`,
          },
          () => {
            clearTimeout(esperaChat);
            esperaChat = setTimeout(() => sincronizarMensajes(), 400);
          },
        );
        canal.on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "reacciones" },
          () => {
            clearTimeout(esperaChat);
            esperaChat = setTimeout(() => sincronizarMensajes(), 400);
          },
        );
        // privados: solo llegan los mios (RLS), no se filtran por iglesia
        canal.on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "privados" },
          () => {
            clearTimeout(esperaChat);
            esperaChat = setTimeout(() => sincronizarMensajes(), 300);
          },
        );
        // el pastor creo, cambio o borro una sala
        canal.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "salas",
            filter: `iglesia_id=eq.${id}`,
          },
          () => {
            sincronizarSalas();
          },
        );
        canal.on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "salas" },
          () => {
            sincronizarSalas();
          },
        );
        // peticiones de oracion: llego una (pastor) o la aprobaron (hermano)
        canal.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "peticiones",
            filter: `iglesia_id=eq.${id}`,
          },
          () => {
            sincronizarPeticiones();
          },
        );
        // el pastor quito una del muro (los borrados no se filtran por iglesia)
        canal.on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "peticiones" },
          () => {
            sincronizarPeticiones();
          },
        );
        // la iglesia misma (ej: el pastor cambio los horarios de culto)
        canal.on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "iglesias",
            filter: `id=eq.${id}`,
          },
          () => {
            sincronizarIglesias();
          },
        );
        // alguien cambio su foto o nombre (RLS: solo los de su iglesia)
        canal.on(
          "postgres_changes",
          { event: "*", schema: "public", table: "perfiles" },
          refrescar,
        );
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

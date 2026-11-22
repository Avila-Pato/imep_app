import {
  Bloqueado,
  bajarBloqueos,
  bajarDenuncias,
  bloquearRemoto,
  Denuncia,
  denunciarRemoto,
  desbloquearRemoto,
  resolverDenunciaRemoto,
} from "@/services/moderacion";
import { create } from "zustand";

// Bloqueos y denuncias. El servidor manda: se bajan al abrir la app y al
// entrar al chat. Al bloquear se oculta al instante (si falla, se revierte)
type Estado = {
  bloqueados: Bloqueado[];
  denuncias: Denuncia[];
};

const useModeracion = create<Estado>(() => ({ bloqueados: [], denuncias: [] }));
const cambiar = useModeracion.setState;
const aviso = (e: unknown) =>
  console.warn("[supabase]", (e as Error)?.message ?? e);

export const useBloqueados = () => useModeracion((s) => s.bloqueados);
export const useDenuncias = () => useModeracion((s) => s.denuncias);

export async function cargarBloqueos() {
  const lista = await bajarBloqueos().catch((e) => {
    aviso(e);
    return null;
  });
  if (lista) cambiar({ bloqueados: lista });
}

export async function bloquear(b: Bloqueado): Promise<boolean> {
  const antes = useModeracion.getState().bloqueados;
  if (antes.some((x) => x.id === b.id)) return true;
  cambiar({ bloqueados: [b, ...antes] });
  try {
    await bloquearRemoto(b);
    return true;
  } catch (e) {
    aviso(e);
    cambiar({ bloqueados: antes });
    return false;
  }
}

export async function desbloquear(id: string): Promise<boolean> {
  const antes = useModeracion.getState().bloqueados;
  cambiar({ bloqueados: antes.filter((x) => x.id !== id) });
  try {
    await desbloquearRemoto(id);
    return true;
  } catch (e) {
    aviso(e);
    cambiar({ bloqueados: antes });
    return false;
  }
}

export async function denunciar(
  tipo: Denuncia["tipo"],
  refId: string,
  motivo: string,
): Promise<boolean> {
  try {
    return await denunciarRemoto(tipo, refId, motivo);
  } catch (e) {
    aviso(e);
    return false;
  }
}

export async function cargarDenuncias(iglesiaId?: string) {
  if (!iglesiaId) return;
  const lista = await bajarDenuncias(iglesiaId).catch((e) => {
    aviso(e);
    return null;
  });
  if (lista) cambiar({ denuncias: lista });
}

// Resuelta: sale de la lista (con las otras denuncias del mismo mensaje)
export async function resolverDenuncia(
  d: Denuncia,
  borrar: boolean,
): Promise<boolean> {
  try {
    const ok = await resolverDenunciaRemoto(d.id, borrar);
    if (ok)
      cambiar((s) => ({
        denuncias: s.denuncias.filter(
          (x) => !(x.tipo === d.tipo && x.refId === d.refId),
        ),
      }));
    return ok;
  } catch (e) {
    aviso(e);
    return false;
  }
}

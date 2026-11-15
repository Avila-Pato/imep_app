import type { RespuestaNativa } from "./googleNativo";

// En la web no hay Google nativo: se usa el navegador (redirect de Supabase)
export async function googleNativo(): Promise<RespuestaNativa> {
  return { tipo: "no-disponible" };
}

export async function salirGoogleNativo() {}

export async function revocarGoogleNativo() {}

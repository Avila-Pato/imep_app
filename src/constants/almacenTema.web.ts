// Web: el navegador guarda sin esperar (expo-sqlite en web necesita
// configuracion extra, por eso no se usa aqui)
export const leer = (clave: string): string | null =>
  globalThis.localStorage?.getItem(clave) ?? null;
export const escribir = (clave: string, valor: string) =>
  globalThis.localStorage?.setItem(clave, valor);

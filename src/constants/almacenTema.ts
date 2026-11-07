import Storage from "expo-sqlite/kv-store";

// Celular: guardado sin esperar (SQLite), para leer el tema antes de dibujar.
// En web se usa almacenTema.web.ts
export const leer = (clave: string): string | null =>
  Storage.getItemSync(clave);
export const escribir = (clave: string, valor: string) =>
  Storage.setItemSync(clave, valor);

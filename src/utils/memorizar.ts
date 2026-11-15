// Juego para memorizar un versiculo: el texto se parte en palabras y se
// esconden algunas (completar) o se parte en trozos (ordenar)

export type Palabra = { texto: string; clave: string }; // clave: sin signos

// "¡Señor," -> "senor" (para comparar sin tildes, signos ni mayusculas)
export const normalizar = (p: string) =>
  p
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ]/g, "");

export const palabrasDe = (texto: string): Palabra[] =>
  texto
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => ({ texto: t, clave: normalizar(t) }));

// lo que se ve en la ficha: la palabra sin los signos de alrededor
export const sinSignos = (p: string) =>
  p.replace(/^[^0-9A-Za-zÀ-ÿ]+|[^0-9A-Za-zÀ-ÿ]+$/g, "") || p;

export function barajar<T>(lista: T[]): T[] {
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// Que palabras se esconden: una parte (proporcion) de las que tienen 3+
// letras (las cortas como "y", "de" no tienen gracia), hasta un maximo
export function elegirOcultas(
  palabras: Palabra[],
  proporcion: number,
  maximo: number,
): number[] {
  let candidatas = palabras
    .map((p, i) => (p.clave.length >= 3 ? i : -1))
    .filter((i) => i >= 0);
  if (candidatas.length === 0) candidatas = palabras.map((_, i) => i);
  const cuantas = Math.min(
    maximo,
    Math.max(1, Math.round(candidatas.length * proporcion)),
  );
  return barajar(candidatas)
    .slice(0, cuantas)
    .sort((a, b) => a - b);
}

// Trozos de 2-5 palabras para ordenar (entre 3 y 7 trozos)
export function trozosDe(palabras: Palabra[]): string[] {
  const tamano = Math.min(5, Math.max(2, Math.ceil(palabras.length / 6)));
  const trozos: string[] = [];
  for (let i = 0; i < palabras.length; i += tamano) {
    trozos.push(
      palabras
        .slice(i, i + tamano)
        .map((p) => p.texto)
        .join(" "),
    );
  }
  return trozos;
}

// Estrellas segun los errores de todo el juego
export const estrellasPor = (errores: number) =>
  errores === 0 ? 3 : errores <= 3 ? 2 : 1;

// Mas de esto ya no es un versiculo para memorizar
export const MAX_PALABRAS_MEMORIZAR = 70;

import {
  BIBLIA_API,
  BIBLIA_VERSION,
  LIBROS_BIBLIA,
} from "@/constants/constans";

export type Referencia = {
  libro: number; // id del libro en la API (1 = Génesis)
  capitulo: number;
  desde?: number;
  hasta?: number;
};

// "Isaías" -> "isaias", "1 Samuel" -> "1samuel"
const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");

const ALIAS: Record<string, string> = {
  salmo: "salmos",
  cantar: "cantares",
  cantardeloscantares: "cantares",
};

// "Proverbios 3:5-6" | "Juan 3:16" | "Salmos 23"
export function parseCita(cita: string): Referencia | null {
  const m = cita.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/);
  if (!m) return null;

  const nombre = normalizar(m[1]);
  const idx = LIBROS_BIBLIA.findIndex(
    (l) => normalizar(l) === (ALIAS[nombre] ?? nombre),
  );
  if (idx === -1) return null;

  const desde = m[3] ? Number(m[3]) : undefined;
  return {
    libro: idx + 1,
    capitulo: Number(m[2]),
    desde,
    hasta: m[4] ? Number(m[4]) : desde,
  };
}

type VersoApi = { verse: number; text: string };

export type Verso = { numero: number; texto: string };

// Quita etiquetas HTML (<br>, <S>…) y espacios dobles del texto de la API
const limpiar = (texto: string) =>
  texto
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<S>\d+<\/S>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const cache = new Map<string, Verso[]>();

export async function obtenerPasaje(
  ref: Referencia,
  signal?: AbortSignal,
): Promise<Verso[]> {
  const clave = `${ref.libro}-${ref.capitulo}-${ref.desde}-${ref.hasta}`;
  const guardado = cache.get(clave);
  if (guardado) return guardado;

  const res = await fetch(
    `${BIBLIA_API}/get-text/${BIBLIA_VERSION}/${ref.libro}/${ref.capitulo}/`,
    { signal },
  );
  if (!res.ok) throw new Error(`Error ${res.status}`);

  const versos: VersoApi[] = await res.json();
  const elegidos = versos.filter(
    (v) =>
      ref.desde === undefined ||
      (v.verse >= ref.desde && v.verse <= (ref.hasta ?? ref.desde)),
  );
  if (elegidos.length === 0) throw new Error("Pasaje no encontrado");

  const resultado = elegidos.map((v) => ({
    numero: v.verse,
    texto: limpiar(v.text),
  }));
  cache.set(clave, resultado);
  return resultado;
}

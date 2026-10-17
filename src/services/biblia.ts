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
  // desconpone una expresion  limpianndo los espacion en blanco y .match() para buscar coincidencias
  const m = cita.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/);
  // Null si no coincide
  if (!m) return null;

  // se normaliza el nombre para buscar en la API (1 Samuel -> 1samuel) para evitar problemas de acentos o espacios
  const nombre = normalizar(m[1]);

  //buscar indice del libro para resolver posibles vvariaciones del nombre
  const idx = LIBROS_BIBLIA.findIndex(
    (l) => normalizar(l) === (ALIAS[nombre] ?? nombre),
  );
 // Null si no coincide
  if (idx === -1) return null;

  // construir la referencia
  // m[3] el versiculo inicial, si existe lo convierte de un texto a un numero   Number(m[3]) si no existe es undefined
  const desde = m[3] ? Number(m[3]) : undefined;
  // objeto que devuelve las propiedades normalizadas
  return {
    libro: idx + 1,
    capitulo: Number(m[2]),
    desde,
    hasta: m[4] ? Number(m[4]) : desde,
  };
}

// tipado de la API
type VersoApi = { verse: number; text: string };

// tipado de los versos
export type Verso = { numero: number; texto: string };

// Quita etiquetas HTML (<br>, <S>…) y espacios dobles del texto de la API
const limpiar = (texto: string) =>
  texto
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<S>\d+<\/S>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

    // cache de pasajes
const cache = new Map<string, Verso[]>();

// 
export async function obtenerPasaje(
  ref: Referencia, // referencia de la api ya tipada
  signal?: AbortSignal, // para cancelar la peticion

): Promise<Verso[]> { // es una promise porque es asincrona osea espera a que se resuelva y despues devuelve el resultado
  // construye la clave para buscar la referencia
  const clave = `${ref.libro}-${ref.capitulo}-${ref.desde}-${ref.hasta}`;
  // si lo encuentra lo devuelve
  const guardado = cache.get(clave);
  // busca el pasaje en el cache
  if (guardado) return guardado;

  // peticion a la API
  const res = await fetch(
    `${BIBLIA_API}/get-text/${BIBLIA_VERSION}/${ref.libro}/${ref.capitulo}/`,
    { signal },
  );

  if (!res.ok) throw new Error(`Error ${res.status}`);

  // guarda los versos en una respuesta JSON dentro de un array
  const versos: VersoApi[] = await res.json();

  // filtra los versos segun la referencia elegida
  const elegidos = versos.filter(
    (v) =>
      ref.desde === undefined ||
      (v.verse >= ref.desde && v.verse <= (ref.hasta ?? ref.desde)),
  );
  // si no encuentra nada lanza un error
  if (elegidos.length === 0) throw new Error("Pasaje no encontrado");

  //mapea los versos con su numero y su texto
  const resultado = elegidos.map((v) => ({
    numero: v.verse,
    texto: limpiar(v.text),
  }));
  // guarda el resultado en el cache  
  cache.set(clave, resultado);
  //devuelve el resultado 
  return resultado;
}

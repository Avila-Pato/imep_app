import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import {
  BIBLIA_API,
  BIBLIA_VERSION,
  CAPITULOS_BIBLIA,
  LIBROS_BIBLIA,
  VERSICULOS_POPULARES,
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
    .replace(/•/g, "") // marcas de nota de la LBLA
    .replace(/\s+/g, " ")
    .trim();

// Capitulos completos ya leidos: en memoria y guardados en el telefono
// (biblia/<version>-<libro>-<capitulo>.json). Asi abren al instante y sin
// internet desde la segunda vez. En la web solo en memoria
const capitulos = new Map<string, Verso[]>();
const EN_DISCO = Platform.OS !== "web";
const archivoDe = (clave: string) =>
  new File(Paths.document, "biblia", `${clave}.json`);

async function leerGuardado(clave: string): Promise<Verso[] | null> {
  if (!EN_DISCO) return null;
  try {
    const archivo = archivoDe(clave);
    if (!archivo.exists) return null;
    const versos = JSON.parse(await archivo.text());
    return Array.isArray(versos) && versos.length ? versos : null;
  } catch {
    return null; // archivo roto: se vuelve a pedir
  }
}

function guardarCapitulo(clave: string, versos: Verso[]) {
  if (!EN_DISCO) return;
  try {
    const carpeta = new Directory(Paths.document, "biblia");
    if (!carpeta.exists)
      carpeta.create({ intermediates: true, idempotent: true });
    archivoDe(clave).write(JSON.stringify(versos));
  } catch (e) {
    // sin espacio u otro problema: igual se muestra (solo no queda guardado)
    console.warn("[biblia] no se pudo guardar", clave, e);
  }
}

// El capitulo completo: memoria -> telefono -> internet (y se guarda)
async function obtenerCapitulo(
  version: string,
  libro: number,
  capitulo: number,
  signal?: AbortSignal,
): Promise<Verso[]> {
  const clave = `${version}-${libro}-${capitulo}`;
  const enMemoria = capitulos.get(clave);
  if (enMemoria) return enMemoria;

  const guardado = await leerGuardado(clave);
  if (guardado) {
    capitulos.set(clave, guardado);
    return guardado;
  }

  const res = await fetch(
    `${BIBLIA_API}/get-text/${version}/${libro}/${capitulo}/`,
    {
      signal,
    },
  );
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const versos: VersoApi[] = await res.json();
  const resultado = versos.map((v) => ({
    numero: v.verse,
    texto: limpiar(v.text),
  }));
  if (resultado.length) {
    capitulos.set(clave, resultado);
    guardarCapitulo(clave, resultado);
  }
  return resultado;
}

// Solo los versos de la referencia (sin "desde" = el capitulo completo)
const recortar = (versos: Verso[], ref: Referencia) =>
  versos.filter(
    (v) =>
      ref.desde === undefined ||
      (v.numero >= ref.desde && v.numero <= (ref.hasta ?? ref.desde)),
  );

// Ya esta en memoria: se muestra sin esperar (null si no)
// los recortes ya hechos: la misma cita devuelve la misma lista (asi los
// efectos que dependen de los versos no se repiten en cada render)
const recortes = new Map<string, Verso[]>();

export function pasajeEnMemoria(ref: Referencia, version = BIBLIA_VERSION) {
  const clave = `${version}-${ref.libro}-${ref.capitulo}`;
  const versos = capitulos.get(clave);
  if (!versos) return null;
  const claveRecorte = `${clave}-${ref.desde ?? ""}-${ref.hasta ?? ""}`;
  let elegidos = recortes.get(claveRecorte);
  if (!elegidos) {
    elegidos = recortar(versos, ref);
    recortes.set(claveRecorte, elegidos);
  }
  return elegidos.length ? elegidos : null;
}

// Guardado en el telefono (sin internet). null si no esta
export async function pasajeGuardado(
  ref: Referencia,
  version = BIBLIA_VERSION,
): Promise<Verso[] | null> {
  const enMemoria = pasajeEnMemoria(ref, version);
  if (enMemoria) return enMemoria;
  const clave = `${version}-${ref.libro}-${ref.capitulo}`;
  const guardado = await leerGuardado(clave);
  if (!guardado) return null;
  capitulos.set(clave, guardado);
  const elegidos = recortar(guardado, ref);
  return elegidos.length ? elegidos : null;
}

export async function obtenerPasaje(
  ref: Referencia, // referencia de la api ya tipada
  signal?: AbortSignal, // para cancelar la peticion
  version = BIBLIA_VERSION, // RV1960, NTV, LBLA
): Promise<Verso[]> {
  const versos = await obtenerCapitulo(
    version,
    ref.libro,
    ref.capitulo,
    signal,
  );
  const elegidos = recortar(versos, ref);
  if (elegidos.length === 0) throw new Error("Pasaje no encontrado");
  return elegidos;
}

const azar = (n: number) => Math.floor(Math.random() * n);

// Un versiculo al azar de TODA la Biblia: libro y capitulo al azar,
// se pide el capitulo a la API y se elige un verso. Devuelve la cita.
export async function versiculoAlAzar(): Promise<string> {
  const libro = azar(LIBROS_BIBLIA.length) + 1;
  const capitulo = azar(CAPITULOS_BIBLIA[libro - 1]) + 1;
  const versos = await obtenerPasaje({ libro, capitulo });
  const verso = versos[azar(versos.length)];
  return `${LIBROS_BIBLIA[libro - 1]} ${capitulo}:${verso.numero}`;
}

// Autocompletado mientras se escribe ("sal" -> "Salmos 23:1", "Salmos 27:1"…).
// Sin internet: sugiere versiculos conocidos del libro o, si no hay, el capitulo.
export function sugerirCitas(texto: string, max = 6): string[] {
  const m = texto.trim().match(/^(\d?\s*[^\d:]*)\s*(\d[\d:\-\s]*)?$/);
  const nombre = m ? normalizar(m[1]) : "";
  if (!nombre) return [];
  const resto = (m?.[2] ?? "").replace(/\s/g, "");

  // primero los que empiezan igual ("1co"), luego sin el numero ("juan" -> "1 Juan")
  const libros = [
    ...LIBROS_BIBLIA.filter((l) => normalizar(l).startsWith(nombre)),
    ...LIBROS_BIBLIA.filter((l) =>
      normalizar(l).replace(/^\d/, "").startsWith(nombre),
    ),
  ];

  const escrito = normalizar(texto);
  const sugerencias = libros.flatMap((libro) => {
    const prefijo = normalizar(`${libro}${resto}`);
    const populares = VERSICULOS_POPULARES.filter((c) =>
      normalizar(c).startsWith(prefijo),
    );
    if (populares.length) return populares;
    if (/:\d/.test(resto)) return []; // ya escribio el versiculo completo
    const capitulo = Number(resto.split(":")[0]) || 1;
    const total = CAPITULOS_BIBLIA[LIBROS_BIBLIA.indexOf(libro)];
    return capitulo <= total
      ? [`${libro} ${resto.replace(/:$/, "") || 1}`]
      : [];
  });

  return [...new Set(sugerencias)]
    .filter((c) => normalizar(c) !== escrito)
    .slice(0, max);
}

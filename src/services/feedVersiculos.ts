import {
  CAPITULOS_BIBLIA,
  LIBROS_BIBLIA,
  VERSICULOS_POPULARES,
} from "@/constants/constans";
import { obtenerPasaje, parseCita } from "./biblia";

// "Para ti": versiculos al azar de toda la Biblia, como un feed de TikTok.
// Nunca repite lo que ya se vio (se recuerda en el telefono). Para que no
// salgan genealogias o listas de leyes, se eligen mas seguido los libros con
// versiculos que se leen solos (Salmos, Proverbios, evangelios, cartas...) y
// se descartan los versiculos muy cortos o muy largos

export type VersoFeed = {
  clave: string; // "libro-capitulo-verso" (como me gusta / resaltados)
  cita: string; // "Juan 3:16" o "Proverbios 3:5-6"
  libro: number;
  capitulo: number;
  numero: number;
  texto: string;
};

// libro -> que tan seguido sale (los que no estan, casi nunca)
const PESOS: Record<string, number> = {
  Salmos: 12,
  Proverbios: 7,
  Juan: 6,
  Mateo: 5,
  Romanos: 5,
  Isaías: 5,
  Lucas: 4,
  Hebreos: 3,
  Efesios: 3,
  Filipenses: 3,
  Marcos: 3,
  "1 Juan": 3,
  "2 Corintios": 2,
  "1 Corintios": 2,
  Gálatas: 2,
  Colosenses: 2,
  Santiago: 2,
  "1 Pedro": 2,
  Jeremías: 2,
  Deuteronomio: 2,
  Eclesiastés: 1,
  Lamentaciones: 1,
  Josué: 1,
  Génesis: 1,
  Hechos: 1,
  "1 Tesalonicenses": 1,
  "2 Timoteo": 1,
  Apocalipsis: 1,
  Miqueas: 1,
  Sofonías: 1,
  Habacuc: 1,
  Job: 1,
};
const LIBROS_PESADOS = LIBROS_BIBLIA.map((nombre, i) => ({
  libro: i + 1,
  peso: PESOS[nombre] ?? 0,
})).filter((l) => l.peso > 0);
const PESO_TOTAL = LIBROS_PESADOS.reduce((t, l) => t + l.peso, 0);

const azar = (n: number) => Math.floor(Math.random() * n);

function libroAlAzar() {
  let r = Math.random() * PESO_TOTAL;
  for (const l of LIBROS_PESADOS) {
    r -= l.peso;
    if (r <= 0) return l.libro;
  }
  return LIBROS_PESADOS[0].libro;
}

// se lee solo: ni un pedacito ("Y dijo:") ni un parrafo enorme
const seLeeSolo = (t: string) => t.length >= 45 && t.length <= 360;

// Uno de los versiculos conocidos (Juan 3:16...) que aun no se vio
async function popular(
  vistos: Set<string>,
  version: string,
): Promise<VersoFeed | null> {
  const libres = VERSICULOS_POPULARES.filter((c) => {
    const r = parseCita(c);
    return r && !vistos.has(`${r.libro}-${r.capitulo}-${r.desde}`);
  });
  if (!libres.length) return null;
  const cita = libres[azar(libres.length)];
  const r = parseCita(cita);
  if (!r || r.desde === undefined) return null;
  const versos = await obtenerPasaje(r, undefined, version);
  return {
    clave: `${r.libro}-${r.capitulo}-${r.desde}`,
    cita,
    libro: r.libro,
    capitulo: r.capitulo,
    numero: r.desde,
    texto: versos.map((v) => v.texto).join(" "),
  };
}

// Uno al azar de un capitulo al azar (de los libros con peso)
async function alAzar(
  vistos: Set<string>,
  version: string,
): Promise<VersoFeed | null> {
  const libro = libroAlAzar();
  const capitulo = azar(CAPITULOS_BIBLIA[libro - 1]) + 1;
  const versos = await obtenerPasaje({ libro, capitulo }, undefined, version);
  const libres = versos.filter(
    (v) =>
      seLeeSolo(v.texto) && !vistos.has(`${libro}-${capitulo}-${v.numero}`),
  );
  if (!libres.length) return null;
  const v = libres[azar(libres.length)];
  return {
    clave: `${libro}-${capitulo}-${v.numero}`,
    cita: `${LIBROS_BIBLIA[libro - 1]} ${capitulo}:${v.numero}`,
    libro,
    capitulo,
    numero: v.numero,
    texto: v.texto,
  };
}

// Los siguientes `cuantos` versiculos del feed, sin repetir ninguno de
// `vistos` (lo ya visto + lo que ya esta en la lista). 1 de cada 4 es uno
// de los conocidos mientras queden sin ver
export async function masVersiculos(
  cuantos: number,
  vistos: Set<string>,
  version: string,
): Promise<VersoFeed[]> {
  const usados = new Set(vistos);
  const nuevos: VersoFeed[] = [];
  let intentos = 0;
  while (nuevos.length < cuantos && intentos < cuantos * 4) {
    intentos++;
    try {
      const v =
        Math.random() < 0.25
          ? ((await popular(usados, version)) ??
            (await alAzar(usados, version)))
          : await alAzar(usados, version);
      if (!v || usados.has(v.clave)) continue;
      usados.add(v.clave);
      nuevos.push(v);
    } catch {
      // sin internet o la API fallo: se corta y se reintenta al deslizar
      if (!nuevos.length && intentos >= 3) throw new Error("sin conexión");
    }
  }
  return nuevos;
}

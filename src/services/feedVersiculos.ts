import {
  CAPITULOS_BIBLIA,
  LIBROS_BIBLIA,
  VERSICULOS_POPULARES,
} from "@/constants/constans";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { capitulosGuardados, obtenerPasaje, parseCita } from "./biblia";

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

// Uno al azar de un capitulo al azar (de los libros con peso). guardado:
// de un capitulo que ya esta en el telefono (sale al instante, sin internet)
async function alAzar(
  vistos: Set<string>,
  version: string,
  guardado = false,
): Promise<VersoFeed | null> {
  const enTelefono = guardado
    ? capitulosGuardados(version).filter(
        (c) => PESOS[LIBROS_BIBLIA[c.libro - 1]],
      )
    : [];
  const elegido = enTelefono.length
    ? enTelefono[azar(enTelefono.length)]
    : null;
  const libro = elegido?.libro ?? libroAlAzar();
  const capitulo = elegido?.capitulo ?? azar(CAPITULOS_BIBLIA[libro - 1]) + 1;
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
// de los conocidos mientras queden sin ver.
// Los capitulos se piden TODOS A LA VEZ (antes de a uno: varios segundos
// de espera). guardados: el primero sale de lo ya descargado si se puede
export async function masVersiculos(
  cuantos: number,
  vistos: Set<string>,
  version: string,
  guardados = false,
): Promise<VersoFeed[]> {
  const usados = new Set(vistos);
  const nuevos: VersoFeed[] = [];
  let fallos = 0;
  for (let ronda = 0; ronda < 4 && nuevos.length < cuantos; ronda++) {
    const faltan = cuantos - nuevos.length;
    const pedidos = Array.from({ length: faltan }, (_, i) =>
      Math.random() < 0.25
        ? popular(usados, version).then((v) => v ?? alAzar(usados, version))
        : alAzar(usados, version, guardados && ronda === 0 && i === 0),
    );
    for (const r of await Promise.allSettled(pedidos)) {
      if (r.status === "rejected") {
        fallos++;
        continue;
      }
      const v = r.value;
      if (!v || usados.has(v.clave) || nuevos.length >= cuantos) continue;
      usados.add(v.clave);
      nuevos.push(v);
    }
    // sin internet o la API fallo: se corta y se reintenta al deslizar
    if (!nuevos.length && fallos >= 3) throw new Error("sin conexión");
  }
  return nuevos;
}

// ───────── Reserva: versiculos listos para la proxima vez ─────────
// Mientras se lee, se dejan unos preparados (en memoria y en el telefono).
// Al abrir "Para ti" de nuevo salen al instante, sin esperar internet
const reservas = new Map<string, VersoFeed[]>();
const preparando = new Set<string>();
const claveReserva = (version: string) => `imep:feedReserva:${version}`;

// Los preparados (que aun no se vieron). Se usan una sola vez
export async function tomarReserva(
  version: string,
  vistos: Set<string>,
): Promise<VersoFeed[]> {
  let lista = reservas.get(version);
  if (!lista) {
    try {
      lista = JSON.parse(
        (await AsyncStorage.getItem(claveReserva(version))) ?? "[]",
      ) as VersoFeed[];
    } catch {
      lista = [];
    }
  }
  reservas.set(version, []);
  AsyncStorage.removeItem(claveReserva(version)).catch(() => {});
  return (Array.isArray(lista) ? lista : []).filter(
    (v) => !!v?.clave && !vistos.has(v.clave),
  );
}

// Deja preparados unos cuantos para la proxima vez (en segundo plano)
export function prepararReserva(
  version: string,
  vistos: Set<string>,
  cuantos = 4,
) {
  if (preparando.has(version)) return;
  if ((reservas.get(version)?.length ?? 0) >= cuantos) return;
  preparando.add(version);
  masVersiculos(cuantos, vistos, version)
    .then((lista) => {
      if (!lista.length) return;
      reservas.set(version, lista);
      return AsyncStorage.setItem(claveReserva(version), JSON.stringify(lista));
    })
    .catch(() => {})
    .finally(() => preparando.delete(version));
}

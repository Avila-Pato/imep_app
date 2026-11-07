// Chats privados (lider <-> hermano). Se guardan como mensajes de una
// "sala" especial cuyo id junta los dos nombres: "dm:Ana Muñoz|Pedro Soto"
const PREFIJO = "dm:";

export const idPrivado = (a: string, b: string) =>
  PREFIJO + [a, b].sort((x, y) => x.localeCompare(y, "es")).join("|");

export const esPrivado = (grupo: string) => grupo.startsWith(PREFIJO);

// Con quien es la conversacion (el que no soy yo)
export const otroDe = (grupo: string, yo: string) =>
  grupo
    .slice(PREFIJO.length)
    .split("|")
    .find((n) => n !== yo) ?? yo;

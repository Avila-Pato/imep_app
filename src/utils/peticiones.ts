import { MIEMBROS } from "@/assets/data/comunidadMocks";
import { USUARIO } from "@/assets/data/perfilMocks";
import {
  EstadoPeticion,
  GrupoId,
  Publicacion,
  Revision,
} from "@/types/typesComunidad";
import { oracionVigente } from "./tiempo";

type Revisiones = Record<string, Revision>;

// Quienes aprueban las peticiones de una sala
const ROLES_LIDER = ["Líder", "Pastor"];

// TEMPORAL: para probar, esta persona es lider de todas las salas.
// Poner en false cuando los roles vengan del registro / backend.
const PROBAR_COMO_LIDER = true;

export const esLider = (nombre: string, grupo: GrupoId) =>
  (PROBAR_COMO_LIDER && nombre === USUARIO.nombre) ||
  (MIEMBROS[grupo] ?? []).some(
    (m) => m.nombre === nombre && ROLES_LIDER.includes(m.rol ?? ""),
  );

// Estado real: la decision del lider manda sobre el de la publicacion
export const estadoPeticion = (
  p: Publicacion,
  rev: Revisiones,
): EstadoPeticion => rev[p.id]?.estado ?? p.estado ?? "aprobada";

// Desde cuando corre el plazo de 24 h (la aprobacion, si la hay)
export const inicioPeticion = (p: Publicacion, rev: Revisiones) =>
  rev[p.id]?.fecha ?? p.fecha;

// ¿Se ve en el muro? Aprobada y dentro de las 24 h
export const enMuro = (p: Publicacion, rev: Revisiones) =>
  estadoPeticion(p, rev) === "aprobada" &&
  oracionVigente(inicioPeticion(p, rev));

// ¿Se guarda en el telefono? Las pendientes esperan; el resto hasta vencer
export const sigueGuardada = (p: Publicacion, rev: Revisiones) =>
  estadoPeticion(p, rev) === "pendiente" || enMuro(p, rev);

// Salas que puede ver: la iglesia (de todos) y su propio grupo.
// Las demas quedan bloqueadas: sin entrar, sin avisos y sin sus peticiones.
export const puedeVerSala = (grupo: GrupoId, miGrupo?: GrupoId) =>
  grupo === "general" || grupo === miGrupo;

import { IconName } from "./typesCronogramas";

// Salas de la comunidad (cada grupo de la iglesia)
export type GrupoId = "general" | "jovenes" | "varones" | "dorcas" | "ninos";

export type Grupo = {
  id: GrupoId;
  label: string;
  descripcion: string;
  icono: IconName;
  tono?: string; // color suave del gajo en la rueda de salas
};

export type Miembro = {
  nombre: string;
  rol?: string; // ej: "Líder", "Pastor"
};

// Mensaje del chat de una sala
export type Mensaje = {
  id: string;
  grupo: GrupoId;
  autor: string;
  texto: string;
  fecha: string; // ISO
};

// Estudio guiado que la persona guarda en su telefono
export type EstudioGuardado = {
  id: string;
  cita: string;
  respuestas: Record<string, string>; // id de pregunta -> respuesta
  fecha: string; // ISO
  compartido: boolean;
};

// Lo que se ve en el muro de la Comunidad
export type Publicacion = {
  id: string;
  autor: string;
  grupo: GrupoId; // sala donde se compartio
  cita: string;
  mostrarCita?: boolean; // si la persona quiso mostrar el pasaje estudiado
  texto: string; // la oracion o reflexion compartida
  fecha: string; // ISO
  orando: number; // cuantos hermanos estan orando
};

// Pasaje que estudia cada sala en la semana (lo asigna el guia del grupo)
export type EstudioSala = {
  id: string;
  grupo: GrupoId;
  titulo: string;
  cita: string;
  guia: string; // quien dirige el estudio
  semana: string; // "2026-10-12" (lunes de la semana)
};

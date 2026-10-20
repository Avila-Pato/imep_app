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
  texto: string; // puede ir vacio si es una nota de voz
  fecha: string; // ISO
  cita?: string; // versiculo sobre el que se comparte
  versiculo?: string; // texto de ese versiculo
  audio?: NotaDeVoz;
};

export type NotaDeVoz = {
  uri: string;
  duracion: number; // segundos
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
  estado?: EstadoPeticion; // sin estado = aprobada
};

// Toda peticion pasa por el lider de la sala antes de llegar al muro
export type EstadoPeticion = "pendiente" | "aprobada" | "rechazada";

// Decision del lider (las 24 h del muro cuentan desde que se aprueba)
export type Revision = {
  estado: Exclude<EstadoPeticion, "pendiente">;
  fecha: string; // ISO
};

// Versiculo(s) que la persona guarda desde la Biblia
export type VersiculoGuardado = {
  id: string; // "1-1-3" (libro-capitulo-primer verso) + versos
  cita: string; // "Génesis 1:3-4"
  texto: string;
  oracion?: string; // si oro con ese versiculo
  fecha: string; // ISO
};

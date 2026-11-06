import { IconName } from "./typesCronogramas";

// Lo que se puede editar en la app (el pastor puede todo)
export type Permiso = "cronograma" | "anuncios" | "salas" | "roles";

// Roles que el pastor asigna a los hermanos (una persona puede tener varios)
export type CargoId = "secretaria" | "servicio" | "comunicaciones" | "lider";

export type Cargo = {
  label: string;
  texto: string; // de que se trata el rol
  icono: IconName;
  permisos: Permiso[]; // lo que puede editar quien lo tiene
};

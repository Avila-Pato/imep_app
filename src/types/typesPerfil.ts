import { IconName } from "./typesCronogramas";

export type Usuario = {
  nombre: string; // debe coincidir con "persona" en los turnos
  ministerio: string;
  miembroDesde: number;
  turnosRealizados: number;
  estudios: number;
  admin?: boolean; // puede asignar los turnos del cronograma
};

export type OpcionMenu = {
  id: string;
  label: string;
  icon: IconName;
  peligro?: boolean; // en rojo (ej: cerrar sesion)
};

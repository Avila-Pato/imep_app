import { IconName } from "./typesCronogramas";

export type Pasaje = {
  cita: string;
  texto: string;
};

export type PreguntaGuiada = {
  id: string;
  titulo: string;
  ayuda: string;
};

export type Predicacion = {
  id: string;
  fecha: string; // "YYYY-MM-DD"
  culto: string;
  titulo: string;
  predicador: string;
  cita: string; // se carga el texto desde la API
};

// Habito diario de "Tu dia con Dios"
export type Habito = {
  id: string;
  momento: string; // "Mañana" | "Día" | "Noche"
  icono: IconName;
  titulo: string;
  minutos: number;
};

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
  puntos: string[];
};

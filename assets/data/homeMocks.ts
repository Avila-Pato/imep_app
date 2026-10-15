// Datos de ejemplo del Home (luego vendran de la API)
import {
    Devocional,
    Iglesia,
    PalabraDelDia,
} from "@/types/typesHome";

export const NOTIFICACIONES = 2;

export const PALABRA: PalabraDelDia = {
  texto: "Estad quietos, y conoced que yo soy Dios.",
  cita: "Salmos 46:10",
};

export const IGLESIA: Iglesia = {
  sede: "IMEP · Sede central",
  culto: "CULTO DOMINICAL",
  detalle: "10:00 hrs · Templo principal",
  estado: "PRÓXIMO",
  cuando: "Domingo",
};

export const DEVOCIONALES: Devocional[] = [
  {
    id: "1",
    dia: "Domingo · Bendición para la semana",
    titulo: "Descansar en la incertidumbre",
    enfoque: "Rendición",
  },
  {
    id: "2",
    dia: "Lunes · Un nuevo comienzo",
    titulo: "Fe para el camino",
    enfoque: "Confianza",
  },
  {
    id: "3",
    dia: "Martes · Palabra de aliento",
    titulo: "Paz en medio de la tormenta",
    enfoque: "Paz",
  },
];

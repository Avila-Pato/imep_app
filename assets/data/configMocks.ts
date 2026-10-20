// Configuracion de la iglesia (luego la editara el lider desde la app)
import { HorarioCulto } from "@/types/typesAnuncios";

// Dias y horas de culto. dia como Date.getDay(): 0 = domingo ... 6 = sabado
export const HORARIOS_CULTO: HorarioCulto[] = [
  { dia: 2, hora: "19:30" },
  { dia: 4, hora: "19:30" },
  { dia: 0, hora: "18:30" },
];

// Predicaciones de ejemplo (luego vendran de la API de la iglesia)
import { Predicacion } from "@/types/typesOraciones";

export const PREDICACIONES: Predicacion[] = [
  {
    id: "1",
    fecha: "2026-10-13",
    culto: "Culto de oración",
    titulo: "No temas, yo estoy contigo",
    predicador: "Pastor Luis Soto",
    cita: "Isaías 41:10",
    puntos: [
      "Dios no promete ausencia de problemas, promete su presencia.",
      "El temor se vence recordando quién es nuestro Dios.",
      "Su diestra nos sostiene cuando nuestras fuerzas se acaban.",
    ],
  },
  {
    id: "2",
    fecha: "2026-10-11",
    culto: "Culto general",
    titulo: "Confiar cuando no entendemos",
    predicador: "Ana Muñoz",
    cita: "Proverbios 3:5-6",
    puntos: [
      "Confiar de todo corazón, no a medias.",
      "Nuestra prudencia es limitada; la de Dios no.",
      "Reconocerlo en todo trae dirección a nuestro camino.",
    ],
  },
  {
    id: "3",
    fecha: "2026-10-08",
    culto: "Culto de jóvenes",
    titulo: "Buscar primero el Reino",
    predicador: "Daniel Rojas",
    cita: "Mateo 6:33",
    puntos: [
      "Las prioridades revelan lo que adoramos.",
      "Buscar el Reino es una decisión diaria.",
      "Dios cuida de lo que nosotros soltamos.",
    ],
  },
  {
    id: "4",
    fecha: "2026-10-06",
    culto: "Culto de oración",
    titulo: "La paz que guarda el corazón",
    predicador: "Pastor Luis Soto",
    cita: "Filipenses 4:6-7",
    puntos: [
      "La ansiedad se transforma en oración.",
      "Dar gracias cambia nuestra perspectiva.",
      "La paz de Dios cuida nuestra mente y corazón.",
    ],
  },
];

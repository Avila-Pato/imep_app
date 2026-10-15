// Pasajes y preguntas guiadas de ejemplo (luego vendran de la API)
import { Pasaje, PreguntaGuiada } from "@/types/typesOraciones";

export const PASAJES: Pasaje[] = [
  {
    cita: "Proverbios 3:5-6",
    texto:
      "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.",
  },
  {
    cita: "Filipenses 4:6-7",
    texto:
      "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios guardará vuestros corazones.",
  },
  {
    cita: "Romanos 8:28",
    texto:
      "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.",
  },
  {
    cita: "Isaías 41:10",
    texto:
      "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré.",
  },
  {
    cita: "Mateo 6:33",
    texto:
      "Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.",
  },
  {
    cita: "Salmos 23:1",
    texto: "Jehová es mi pastor; nada me faltará.",
  },
];

export const PREGUNTAS: PreguntaGuiada[] = [
  {
    id: "dice",
    titulo: "¿Qué dice el texto?",
    ayuda: "Explícalo con tus propias palabras.",
  },
  {
    id: "significa",
    titulo: "¿Qué me dice a mí?",
    ayuda: "¿Cómo se aplica a tu vida hoy?",
  },
  {
    id: "oracion",
    titulo: "Mi oración",
    ayuda: "Escribe una oración a partir de este pasaje.",
  },
];

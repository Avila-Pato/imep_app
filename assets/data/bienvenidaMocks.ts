// Contenido del onboarding (textos, opciones y colores)
import { IconName } from "@/types/typesCronogramas";
import { ImageSource } from "expo-image";

// Historias de presentacion: que es la app (para cualquier iglesia) y sus
// funciones. Se pasan deslizando o tocando. Las imagenes son de relleno
// (picsum): cambia "imagen" por tus fotos, ej: require("@/assets/images/inicio-1.jpg")
export const HISTORIAS: {
  etiqueta: string;
  titulo: string; // la ultima palabra va en cursiva
  texto: string;
  imagen: ImageSource | string;
}[] = [
  {
    etiqueta: "BIENVENIDO",
    titulo: "Te damos la bienvenida",
    texto:
      "Una app hecha para ayudar a las iglesias a organizarse, mantener a todos informados y acompañarse durante la semana.",
    imagen: "https://picsum.photos/seed/imep-iglesia/900/1400",
  },
  {
    etiqueta: "QUÉ ES",
    titulo: "Tu iglesia, organizada",
    texto:
      "Cultos, turnos, anuncios y grupos en un solo lugar. Menos mensajes perdidos en el chat y más tiempo para lo importante.",
    imagen: "https://picsum.photos/seed/imep-orden/900/1400",
  },
  {
    etiqueta: "ANUNCIOS",
    titulo: "Que nadie se lo pierda",
    texto:
      "El próximo culto, los eventos y las actividades de cada grupo, con fecha, hora y lugar. Todos se enteran a tiempo.",
    imagen: "https://picsum.photos/seed/imep-anuncios/900/1400",
  },
  {
    etiqueta: "SERVICIO",
    titulo: "Cada uno sabe su turno",
    texto:
      "El cronograma muestra quién predica, quién está en el pasillo, en la puerta o en la ofrenda. Cada hermano ve sus próximos turnos.",
    imagen: "https://picsum.photos/seed/imep-servicio/900/1400",
  },
  {
    etiqueta: "COMUNIDAD",
    titulo: "Grupos que se acompañan",
    texto:
      "Una sala para cada grupo (jóvenes, varones, damas, niños o los que tu iglesia cree) con chat y muro de oración.",
    imagen: "https://picsum.photos/seed/imep-comunidad/900/1400",
  },
  {
    etiqueta: "BIBLIA",
    titulo: "La Palabra, a tu ritmo",
    texto:
      "Versículo por versículo o el capítulo completo, en varias versiones y con la letra del tamaño que necesites.",
    imagen: "https://picsum.photos/seed/imep-biblia/900/1400",
  },
  {
    etiqueta: "PARA EL PASTOR",
    titulo: "Todo bajo tu cuidado",
    texto:
      "El pastor crea las salas, asigna los roles y da permisos a los hermanos que ayudan a organizar la iglesia.",
    imagen: "https://picsum.photos/seed/imep-pastor/900/1400",
  },
];

// "¿Qué te trae aquí?" (se puede elegir mas de uno)
export const MOTIVOS: {
  id: string;
  titulo: string;
  texto: string;
  icono: IconName;
}[] = [
  {
    id: "palabra",
    titulo: "Crecer en la Palabra",
    texto: "Leer la Biblia cada día y entenderla mejor",
    icono: "book",
  },
  {
    id: "oracion",
    titulo: "Orar con otros",
    texto: "Pedir oración y orar por mis hermanos",
    icono: "heart",
  },
  {
    id: "grupo",
    titulo: "Conectar con mi grupo",
    texto: "Conversar con Jóvenes, Varones, Dorcas o Niños",
    icono: "people",
  },
  {
    id: "servir",
    titulo: "Servir en la iglesia",
    texto: "Saber cuándo me toca y en qué puedo ayudar",
    icono: "star",
  },
  {
    id: "anuncios",
    titulo: "Estar al día",
    texto: "No perderme cultos, anuncios ni actividades",
    icono: "bell",
  },
];

// "Todo en un lugar": mosaico de lo que trae la app (tonos suaves)
export const FUNCIONES: {
  titulo: string;
  texto: string;
  icono: IconName;
  tono: string;
}[] = [
  {
    titulo: "Biblia",
    texto: "Versículo a versículo",
    icono: "book",
    tono: "#D8C8A8",
  },
  {
    titulo: "Oración",
    texto: "Muro de peticiones",
    icono: "heart",
    tono: "#D5C1BF",
  },
  {
    titulo: "Salas",
    texto: "Chat de tu grupo",
    icono: "comment-discussion",
    tono: "#B8C4CC",
  },
  {
    titulo: "Servicio",
    texto: "Cronograma de turnos",
    icono: "calendar",
    tono: "#C2CCB6",
  },
  {
    titulo: "Anuncios",
    texto: "Cultos y actividades",
    icono: "megaphone",
    tono: "#C9B7D6",
  },
  {
    titulo: "Predicaciones",
    texto: "Vuelve a leerlas",
    icono: "quote",
    tono: "#E0B9A0",
  },
];

// Portadas de las versiones de la Biblia (paso "Elige tu Biblia")
export const PORTADAS: Record<string, { fondo: string; letras: string }> = {
  RV1960: { fondo: "#5E2328", letras: "#E3C58B" },
  NTV: { fondo: "#22344F", letras: "#D9DEE8" },
  LBLA: { fondo: "#2C4335", letras: "#D8CBA4" },
};

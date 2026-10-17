// Datos de ejemplo del Home (luego vendran de la API)
import {
  Devocional,
  Iglesia,
  PalabraDelDia,
  RedSocial,
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
  direccion: "Pje. Volcán Tronador 859, El Bosque, Región Metropolitana",
  // Centro del pasaje Volcán Tronador (OpenStreetMap no tiene el numero exacto)
  lat: -33.5821853,
  lng: -70.6739371,
};

// TODO: reemplazar por los links y usuarios reales de la iglesia
export const REDES: RedSocial[] = [
  {
    id: "facebook",
    nombre: "Facebook",
    usuario: "IMEP Iglesia",
    url: "https://www.facebook.com/",
    icono: "facebook-f",
  },
  {
    id: "instagram",
    nombre: "Instagram",
    usuario: "@imep",
    url: "https://www.instagram.com/",
    icono: "instagram",
  },
  {
    id: "tiktok",
    nombre: "TikTok",
    usuario: "@imep",
    url: "https://www.tiktok.com/",
    icono: "tiktok",
  },
  {
    id: "youtube",
    nombre: "YouTube",
    usuario: "@imep",
    url: "https://www.youtube.com/",
    icono: "youtube",
  },
];

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
